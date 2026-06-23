import mongoose, { Document, Schema } from 'mongoose';

export interface ILens extends Document {
  name: string;
  lensType: mongoose.Types.ObjectId;
  basePrice: number;
  memberPrice?: number;
  displayOrder: number;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const LensSchema = new Schema<ILens>(
  {
    name: { type: String, required: true, trim: true },
    lensType: { type: Schema.Types.ObjectId, ref: 'LensType', required: true },
    basePrice: { type: Number, required: true, min: 0 },
    memberPrice: { type: Number, min: 0 },
    displayOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

// Lens name must be unique within a Lens Type
LensSchema.index({ name: 1, lensType: 1 }, { unique: true });

export const Lens = mongoose.models.Lens || mongoose.model<ILens>('Lens', LensSchema);
