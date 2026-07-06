import mongoose, { Document, Schema } from 'mongoose';

export interface IReel extends Document {
  title: string;
  videoUrl: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReelSchema = new Schema<IReel>(
  {
    title: { type: String, required: true },
    videoUrl: { type: String, required: true },
    description: { type: String },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ReelSchema.index({ isActive: 1, displayOrder: 1 });

export const Reel =
  mongoose.models.Reel ||
  mongoose.model<IReel>('Reel', ReelSchema);
