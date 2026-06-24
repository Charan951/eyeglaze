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
  userSpecific?: mongoose.Types.ObjectId;
  isActive: boolean;
  name?: string;
  description?: string;
  badge?: string;
}

const CouponSchema = new Schema<ICoupon>({
  code: { type: String, unique: true, uppercase: true, required: true },
  name: String,
  description: String,
  badge: String,
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
  userSpecific: { type: Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Coupon = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
