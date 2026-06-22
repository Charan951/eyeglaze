import mongoose, { Document, Schema } from 'mongoose';

export interface IHomepageVideo extends Document {
  title: string;
  videoUrl: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HomepageVideoSchema = new Schema<IHomepageVideo>(
  {
    title: { type: String, required: true },
    videoUrl: { type: String, required: true },
    description: { type: String },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

HomepageVideoSchema.index({ isActive: 1, displayOrder: 1 });

export const HomepageVideo =
  mongoose.models.HomepageVideo ||
  mongoose.model<IHomepageVideo>('HomepageVideo', HomepageVideoSchema);
