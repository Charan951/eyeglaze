import { Request, Response } from 'express';
import { connectDB } from '../../config/mongodb';
import { Coupon } from '../../models/Coupon';

export async function getAdminCoupons(req: Request, res: Response) {
  try {
    await connectDB();
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ coupons });
  } catch (error) {
    console.error('get admin coupons error:', error);
    return res.status(500).json({ error: 'Failed to fetch coupons' });
  }
}

export async function createCoupon(req: Request, res: Response) {
  try {
    await connectDB();
    const body = req.body || {};
    const {
      code,
      name,
      description,
      badge,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      validFrom,
      validTo,
      expiresAt,
      usageLimitPerUser,
      usageLimitTotal,
      isActive = true
    } = body;

    if (!code || !discountType || !discountValue) {
      return res.status(400).json({ error: 'Code, discount type, and discount value are required' });
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ error: 'A coupon with this code already exists' });
    }

    const newCoupon = new Coupon({
      code: code.toUpperCase(),
      name,
      description,
      badge,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validTo: validTo ? new Date(validTo) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      usageLimitPerUser,
      usageLimitTotal,
      isActive,
    });

    await newCoupon.save();
    return res.status(201).json({ coupon: newCoupon });
  } catch (error) {
    console.error('create coupon error:', error);
    return res.status(500).json({ error: 'Failed to create coupon' });
  }
}

export async function updateCoupon(req: Request, res: Response) {
  try {
    await connectDB();
    const { id } = req.params;
    const body = req.body || {};

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    // Update fields
    const fieldsToUpdate = [
      'code', 'name', 'description', 'badge', 'discountType',
      'discountValue', 'minOrderValue', 'maxDiscount', 'validFrom',
      'validTo', 'expiresAt', 'usageLimitPerUser', 'usageLimitTotal',
      'isActive'
    ];

    fieldsToUpdate.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'code') {
          coupon.code = body[field].toUpperCase();
        } else if (field === 'validFrom' || field === 'validTo' || field === 'expiresAt') {
          coupon[field] = body[field] ? new Date(body[field]) : undefined;
        } else {
          coupon[field] = body[field];
        }
      }
    });

    // Check code uniqueness if changing code
    if (body.code && body.code.toUpperCase() !== coupon.code) {
      const existing = await Coupon.findOne({ code: body.code.toUpperCase() });
      if (existing && existing._id.toString() !== id) {
        return res.status(400).json({ error: 'A coupon with this code already exists' });
      }
    }

    await coupon.save();
    return res.status(200).json({ coupon });
  } catch (error) {
    console.error('update coupon error:', error);
    return res.status(500).json({ error: 'Failed to update coupon' });
  }
}

export async function deleteCoupon(req: Request, res: Response) {
  try {
    await connectDB();
    const { id } = req.params;

    const deleted = await Coupon.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    return res.status(200).json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('delete coupon error:', error);
    return res.status(500).json({ error: 'Failed to delete coupon' });
  }
}
