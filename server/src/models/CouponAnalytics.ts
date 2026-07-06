import mongoose, { Document, Schema } from 'mongoose';

export interface ICouponAnalytics extends Document {
  couponId: mongoose.Types.ObjectId;
  code: string;
  date: Date; // Day of analytics tracking
  impressions: number;
  clicks: number;
  usages: number;
  revenue: number;
  discountAmount: number;
  failureCount: number;
  failureReasons: Map<string, number>;
}

const CouponAnalyticsSchema = new Schema<ICouponAnalytics>(
  {
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true, index: true },
    code: { type: String, required: true, uppercase: true, index: true },
    date: { type: Date, required: true, index: true },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    usages: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    failureReasons: {
      type: Schema.Types.Map,
      of: Number,
      default: () => new Map<string, number>(),
    },
  },
  { timestamps: true }
);

// Compound Index to prevent duplicate entries for same coupon on same day
CouponAnalyticsSchema.index({ couponId: 1, date: 1 }, { unique: true });

export const CouponAnalytics = mongoose.models.CouponAnalytics || mongoose.model<ICouponAnalytics>('CouponAnalytics', CouponAnalyticsSchema);
