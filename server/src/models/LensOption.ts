import mongoose, { Document, Schema } from 'mongoose';

export interface ILensOption extends Document {
  kind: 'type' | 'quality';
  type?: string;
  subType?: string;
  displayName: string;
  name: string;
  description?: string;
  price: number;
  startingPrice?: number;
  features: string[];
  badge?: string;
  isBestseller: boolean;
  isRecommended: boolean;
  sortOrder: number;
  isActive: boolean;
}

const LensOptionSchema = new Schema<ILensOption>({
  kind: { type: String, enum: ['type', 'quality'], required: true },
  type: {
    type: String,
    enum: ['single_vision', 'progressive', 'bluecut', 'zero_power', 'photochromic'],
  },
  subType: { type: String },
  displayName: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  startingPrice: { type: Number },
  features: [String],
  badge: { type: String },
  isBestseller: { type: Boolean, default: false },
  isRecommended: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

export const LensOption = mongoose.models.LensOption || mongoose.model<ILensOption>('LensOption', LensOptionSchema);
