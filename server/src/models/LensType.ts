import mongoose, { Document, Schema } from 'mongoose';

export interface ILensType extends Document {
  name: string;
  category: string;
  description?: string;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const LensTypeSchema = new Schema<ILensType>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, default: 'eyeglasses', trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

// Compound index to ensure name uniqueness per category
LensTypeSchema.index({ name: 1, category: 1 }, { unique: true });

export const LensType = mongoose.models.LensType || mongoose.model<ILensType>('LensType', LensTypeSchema);
