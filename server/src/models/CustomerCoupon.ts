import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomerCoupon extends Document {
  userId: mongoose.Types.ObjectId;
  couponId: mongoose.Types.ObjectId;
  assignedAt: Date;
  isUsed: boolean;
  usedAt?: Date;
  expiryDate?: Date;
}

const CustomerCouponSchema = new Schema<ICustomerCoupon>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true, index: true },
    assignedAt: { type: Date, default: Date.now },
    isUsed: { type: Boolean, default: false, index: true },
    usedAt: { type: Date },
    expiryDate: { type: Date },
  },
  { timestamps: true }
);

CustomerCouponSchema.index({ userId: 1, couponId: 1 }, { unique: true });

export const CustomerCoupon = mongoose.models.CustomerCoupon || mongoose.model<ICustomerCoupon>('CustomerCoupon', CustomerCouponSchema);
