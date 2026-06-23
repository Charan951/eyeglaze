import mongoose, { Document, Schema } from 'mongoose';

export interface ILensType extends Document {
  name: string;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const LensTypeSchema = new Schema<ILensType>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

export const LensType = mongoose.models.LensType || mongoose.model<ILensType>('LensType', LensTypeSchema);
