import { Router, Request, Response } from 'express';
import { connectDB } from '../lib/mongodb';
import { Coupon } from '../models/Coupon';

const router = Router();

router.post('/validate', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { code, cartTotal } = req.body || {};

    if (!code) return res.status(200).json({ valid: false, message: 'Coupon code required' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return res.status(200).json({ valid: false, message: 'Invalid coupon code' });

    const now = new Date();
    if (coupon.validFrom && coupon.validFrom > now) {
      return res.status(200).json({ valid: false, message: 'Coupon not yet active' });
    }
    const expiryDate = coupon.validTo || coupon.expiresAt;
    if (expiryDate && expiryDate < now) {
      return res.status(200).json({ valid: false, message: 'Coupon has expired' });
    }

    if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
      return res.status(200).json({
        valid: false,
        message: `Minimum order value of ₹${coupon.minOrderValue} required`,
      });
    }

    if (coupon.usageLimitTotal && coupon.usedCount >= coupon.usageLimitTotal) {
      return res.status(200).json({ valid: false, message: 'Coupon usage limit exceeded' });
    }

    let discount = 0;
    if (coupon.discountType === 'percent') {
      discount = (cartTotal * coupon.discountValue) / 100;
      const cap = coupon.maxDiscount || coupon.maxDiscountCap;
      if (cap) discount = Math.min(discount, cap);
    } else {
      discount = coupon.discountValue;
    }

    return res.status(200).json({
      valid: true,
      discount: Math.round(discount),
      message: `You save ₹${Math.round(discount)} with this coupon!`,
    });
  } catch (error) {
    console.error('validate coupon error:', error);
    return res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

export default router;
