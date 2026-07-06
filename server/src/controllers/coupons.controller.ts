import { Request, Response } from 'express';
import { connectDB } from '../config/mongodb';
import { Coupon } from '../models/Coupon';
import { CouponUsage } from '../models/CouponUsage';
import { CustomerCoupon } from '../models/CustomerCoupon';
import { CouponAnalytics } from '../models/CouponAnalytics';
import { CouponEngine } from '../services/couponEngine';

/**
 * Helper to record coupon analytics (clicks, failures, usages)
 */
async function recordAnalytics(couponId: string, code: string, type: 'click' | 'failure' | 'usage', details?: { revenue?: number; discount?: number; reason?: string }) {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const update: any = {};
    if (type === 'click') update.$inc = { clicks: 1 };
    else if (type === 'usage') {
      update.$inc = { usages: 1, revenue: details?.revenue || 0, discountAmount: details?.discount || 0 };
    } else if (type === 'failure') {
      update.$inc = { failureCount: 1 };
      if (details?.reason) {
        // Safe key formatting for MongoDB Map
        const safeReason = details.reason.replace(/\./g, '_').substring(0, 30);
        update[`failureReasons.${safeReason}`] = 1;
      }
    }
    
    await CouponAnalytics.findOneAndUpdate(
      { couponId, date: startOfToday },
      {
        $setOnInsert: { code: code.toUpperCase() },
        ...(update.$inc ? { $inc: update.$inc } : {}),
        ...(update[`failureReasons.${details?.reason?.replace(/\./g, '_').substring(0, 30)}`] ? { $inc: { [`failureReasons.${details?.reason?.replace(/\./g, '_').substring(0, 30)}`]: 1 } } : {}),
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Record coupon analytics error:', error);
  }
}

export async function validateCoupon(req: Request, res: Response) {
  try {
    await connectDB();
    const { code, cartTotal, items, paymentMethod, shippingMethod, location } = req.body || {};
    
    if (!code) {
      return res.status(200).json({ valid: false, message: 'Coupon code required' });
    }
    
    const userId = req.user?.userId;
    
    const result = await CouponEngine.validate(code, userId, {
      cartTotal,
      items: items || [],
      paymentMethod,
      shippingMethod,
      location,
    });
    
    if (result.coupon) {
      if (result.valid) {
        // Log click count/impression on validation success
        await recordAnalytics(result.coupon._id.toString(), result.coupon.code, 'click');
      } else {
        // Log failure reason
        await recordAnalytics(result.coupon._id.toString(), result.coupon.code, 'failure', { reason: result.message });
      }
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('validate coupon error:', error);
    return res.status(500).json({ error: 'Failed to validate coupon' });
  }
}

export async function getActiveCoupons(req: Request, res: Response) {
  try {
    await connectDB();
    const now = new Date();
    
    const coupons = await Coupon.find({
      isActive: true,
      isDeleted: false,
      autoApply: false, // Don't list auto-applied ones directly as copyable coupons
      $and: [
        { $or: [{ validFrom: { $exists: false } }, { validFrom: null }, { validFrom: { $lte: now } }] },
        { $or: [{ validTo: { $exists: false } }, { validTo: null }, { validTo: { $gte: now } }] },
      ],
    }).sort({ priority: -1, createdAt: -1 });
    
    return res.status(200).json({ coupons });
  } catch (error) {
    console.error('get active coupons error:', error);
    return res.status(500).json({ error: 'Failed to fetch coupons' });
  }
}

export async function getMyCoupons(req: Request, res: Response) {
  try {
    await connectDB();
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const now = new Date();
    const assignedCoupons = await CustomerCoupon.find({
      userId,
      isUsed: false,
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gte: now } }
      ]
    }).populate('couponId');
    
    const coupons = assignedCoupons
      .map(ac => ac.couponId)
      .filter(coupon => coupon && !(coupon as any).isDeleted && (coupon as any).isActive);
      
    return res.status(200).json({ coupons });
  } catch (error) {
    console.error('get my coupons error:', error);
    return res.status(500).json({ error: 'Failed to fetch your coupons' });
  }
}

export async function getCouponHistory(req: Request, res: Response) {
  try {
    await connectDB();
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const history = await CouponUsage.find({ userId })
      .sort({ usedAt: -1 })
      .populate('couponId', 'code name description discountType discountValue');
      
    return res.status(200).json({ history });
  } catch (error) {
    console.error('get coupon history error:', error);
    return res.status(500).json({ error: 'Failed to fetch coupon history' });
  }
}

export async function autoApplyBestCoupon(req: Request, res: Response) {
  try {
    await connectDB();
    const { cartTotal, items, paymentMethod, shippingMethod, location } = req.body || {};
    const userId = req.user?.userId;
    
    const result = await CouponEngine.autoApplyBest(userId, {
      cartTotal,
      items: items || [],
      paymentMethod,
      shippingMethod,
      location,
    });
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('auto apply coupon error:', error);
    return res.status(500).json({ error: 'Failed to auto apply best coupon' });
  }
}

export { recordAnalytics };
