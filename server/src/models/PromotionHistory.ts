import mongoose, { Document, Schema } from 'mongoose';

export interface IPromotionHistory extends Document {
  promotionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderId: string;
  discountApplied: number;
  appliedAt: Date;
}

const PromotionHistorySchema = new Schema<IPromotionHistory>(
  {
    promotionId: { type: Schema.Types.ObjectId, ref: 'Promotion', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: String, required: true, index: true },
    discountApplied: { type: Number, required: true },
    appliedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

PromotionHistorySchema.index({ promotionId: 1, userId: 1 });

export const PromotionHistory = mongoose.models.PromotionHistory || mongoose.model<IPromotionHistory>('PromotionHistory', PromotionHistorySchema);
