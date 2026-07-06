import mongoose, { Document, Schema } from 'mongoose';

export interface IReferralCoupon extends Document {
  referrerId: mongoose.Types.ObjectId;
  refereeId: mongoose.Types.ObjectId;
  referralCode: string;
  refereeCouponId?: mongoose.Types.ObjectId;
  referrerCouponId?: mongoose.Types.ObjectId;
  status: 'pending' | 'completed' | 'cancelled';
  orderId?: string;
  completedAt?: Date;
}

const ReferralCouponSchema = new Schema<IReferralCoupon>(
  {
    referrerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refereeId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    referralCode: { type: String, required: true, index: true },
    refereeCouponId: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    referrerCouponId: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    orderId: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

ReferralCouponSchema.index({ referrerId: 1, refereeId: 1 }, { unique: true });

export const ReferralCoupon = mongoose.models.ReferralCoupon || mongoose.model<IReferralCoupon>('ReferralCoupon', ReferralCouponSchema);
