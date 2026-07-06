import mongoose, { Document, Schema } from 'mongoose';

export interface IPromotion extends Document {
  name: string;
  description: string;
  isActive: boolean;
  isDeleted: boolean;
  validFrom: Date;
  validTo?: Date;
  priority: number;
  autoApply: boolean;
  rules: mongoose.Types.ObjectId[]; // refs to PromotionRule
  discountType: 'percent' | 'flat' | 'bogo' | 'buy_x_get_y' | 'tiered' | 'combo';
  discountValue: number;
  maxDiscount?: number;
  minOrderValue?: number;
  tags: string[];
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const PromotionSchema = new Schema<IPromotion>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    validFrom: { type: Date, default: Date.now, index: true },
    validTo: { type: Date, index: true },
    priority: { type: Number, default: 0, index: true },
    autoApply: { type: Boolean, default: true, index: true },
    rules: [{ type: Schema.Types.ObjectId, ref: 'PromotionRule' }],
    discountType: {
      type: String,
      enum: ['percent', 'flat', 'bogo', 'buy_x_get_y', 'tiered', 'combo'],
      required: true,
    },
    discountValue: { type: Number, required: true, default: 0 },
    maxDiscount: { type: Number },
    minOrderValue: { type: Number, default: 0 },
    tags: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

PromotionSchema.index({ isActive: 1, isDeleted: 1, validFrom: 1, validTo: 1 });

export const Promotion = mongoose.models.Promotion || mongoose.model<IPromotion>('Promotion', PromotionSchema);
