import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  maxDiscountCap?: number;
  validFrom?: Date;
  validTo?: Date;
  expiresAt?: Date;
  usageLimitPerUser?: number;
  usageLimitTotal?: number;
  usedCount: number;
  applicableTo: 'all' | 'categories' | 'skus';
  categories: string[];
  skus: string[];
  isActive: boolean;
}

const CouponSchema = new Schema<ICoupon>({
  code: { type: String, unique: true, uppercase: true, required: true },
  discountType: { type: String, enum: ['percent', 'flat'], required: true },
  discountValue: { type: Number, required: true },
  minOrderValue: Number,
  maxDiscount: Number,
  maxDiscountCap: Number,
  validFrom: Date,
  validTo: Date,
  expiresAt: Date,
  usageLimitPerUser: Number,
  usageLimitTotal: Number,
  usedCount: { type: Number, default: 0 },
  applicableTo: { type: String, enum: ['all', 'categories', 'skus'], default: 'all' },
  categories: [String],
  skus: [String],
  isActive: { type: Boolean, default: true },
});

export const Coupon = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
