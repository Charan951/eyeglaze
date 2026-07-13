import mongoose, { Document, Schema } from 'mongoose';

export interface IBanner extends Document {
  title?: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  position: string;
  displayOrder: number;
  isActive: boolean;
  showOnMobile: boolean;
  description?: string;
  buttonText?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    title: { type: String },
    subtitle: { type: String },
    imageUrl: { type: String, required: true },
    linkUrl: { type: String },
    position: { type: String, default: 'eyeglasses_landing' },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    showOnMobile: { type: Boolean, default: true },
    description: { type: String },
    buttonText: { type: String },
  },
  { timestamps: true }
);

BannerSchema.index({ isActive: 1, position: 1, displayOrder: 1 });

export const Banner =
  mongoose.models.Banner ||
  mongoose.model<IBanner>('Banner', BannerSchema);
