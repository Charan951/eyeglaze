import { Request, Response } from 'express';
import mongoose from 'mongoose';
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
      { upsert: true, returnDocument: 'after' }
    );
  } catch (error) {
    console.error('Record coupon analytics error:', error);
  }
}

export async function validateCoupon(req: Request, res: Response) {
  try {
    await connectDB();
    console.log('VALIDATE COUPON BODY:', JSON.stringify(req.body, null, 2));
    const { code, cartTotal, items, paymentMethod, shippingMethod, location, addGoldMembership } = req.body || {};
    
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
      addGoldMembership,
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
    
    const query: any = {
      isActive: true,
      isDeleted: false,
      autoApply: false, // Don't list auto-applied ones directly as copyable coupons
      $and: [
        { $or: [{ validFrom: { $exists: false } }, { validFrom: null }, { validFrom: { $lte: now } }] },
        { $or: [{ validTo: { $exists: false } }, { validTo: null }, { validTo: { $gte: now } }] },
      ],
    };

    if (req.user?.userId) {
      query.$or = [
        { userSpecific: { $exists: false } },
        { userSpecific: null },
        { userSpecific: new mongoose.Types.ObjectId(req.user.userId) }
      ];
    } else {
      query.$or = [
        { userSpecific: { $exists: false } },
        { userSpecific: null }
      ];
    }

    const coupons = await Coupon.find(query).sort({ priority: -1, createdAt: -1 });
    
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

/**
 * Automatically generates a 50% OFF member coupon and a 30-day BOGO voucher for a new/renewed VIP Gold member.
 */
export async function generateMemberCoupons(userId: string | mongoose.Types.ObjectId) {
  // 1. Generate 50% OFF member coupon
  const percentCode = `MEMBER${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const percentCoupon = new Coupon({
    code: percentCode,
    discountType: 'percent',
    discountValue: 50,
    name: '50% Off Member Exclusive',
    description: 'Exclusive 50% off for members',
    isActive: true,
    validFrom: new Date(),
    validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    usageLimitTotal: 1,
    userSpecific: userId,
    couponType: 'Standard',
  });
  await percentCoupon.save();

  // 2. Generate 30-day BOGO voucher
  const bogoCode = `BOGOMEM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const expiry30Days = new Date();
  expiry30Days.setDate(expiry30Days.getDate() + 30);
  
  const bogoCoupon = new Coupon({
    code: bogoCode,
    name: 'Membership BOGO Voucher',
    description: 'Gold Member BOGO Voucher - Buy 1 Get 1 Free (Valid for 30 days)',
    discountType: 'bogo',
    couponType: 'BOGO',
    discountValue: 0,
    buyQty: 1,
    getQty: 1,
    isActive: true,
    validFrom: new Date(),
    validTo: expiry30Days,
    usageLimitPerUser: 1,
    usageLimitTotal: 1,
    userSpecific: userId,
    applicableTo: 'all'
  });
  await bogoCoupon.save();

  return { percentCoupon, bogoCoupon };
}

export { recordAnalytics };
