import mongoose, { Document, Schema } from 'mongoose';

export interface ICouponUsage extends Document {
  couponId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderId: string;
  orderObjectId?: mongoose.Types.ObjectId;
  discountApplied: number;
  transactionAmount: number;
  status: 'applied' | 'cancelled' | 'refunded';
  usedAt: Date;
}

const CouponUsageSchema = new Schema<ICouponUsage>(
  {
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: String, required: true, index: true },
    orderObjectId: { type: Schema.Types.ObjectId, ref: 'Order' },
    discountApplied: { type: Number, required: true },
    transactionAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['applied', 'cancelled', 'refunded'],
      default: 'applied',
      index: true,
    },
    usedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// Compound Index for checking per-user usage limits fast
CouponUsageSchema.index({ couponId: 1, userId: 1, status: 1 });

export const CouponUsage = mongoose.models.CouponUsage || mongoose.model<ICouponUsage>('CouponUsage', CouponUsageSchema);
