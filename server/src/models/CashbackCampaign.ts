import mongoose, { Document, Schema } from 'mongoose';

export interface ICashbackCampaign extends Document {
  name: string;
  description?: string;
  minOrderValue: number;
  cashbackAmount: number;
  isActive: boolean;
  validFrom?: Date;
  validTo?: Date;
  usageLimitTotal?: number;
  usedCount: number;
  sortOrder: number;
}

const CashbackCampaignSchema = new Schema<ICashbackCampaign>({
  name: { type: String, required: true },
  description: { type: String },
  minOrderValue: { type: Number, required: true },
  cashbackAmount: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  validFrom: { type: Date },
  validTo: { type: Date },
  usageLimitTotal: { type: Number },
  usedCount: { type: Number, default: 0 },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

export const CashbackCampaign = mongoose.models.CashbackCampaign || mongoose.model<ICashbackCampaign>('CashbackCampaign', CashbackCampaignSchema);
