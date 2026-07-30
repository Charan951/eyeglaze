import mongoose, { Document, Schema } from 'mongoose';

export interface IKidsAgeGroup extends Document {
  title: string;
  ageRange: string;
  badgeText: string;
  subtitle?: string;
  image: string;
  targetSize: string;
  colorTheme: string;
  displayOrder: number;
  status: 'Active' | 'Inactive';
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const KidsAgeGroupSchema = new Schema<IKidsAgeGroup>(
  {
    title: { type: String, required: true },
    ageRange: { type: String, required: true },
    badgeText: { type: String, default: 'Kids' },
    subtitle: { type: String, default: '' },
    image: { type: String, default: '/images/kids_eyeglasses.png' },
    targetSize: { type: String, default: 'Small' },
    colorTheme: { type: String, default: 'amber' },
    displayOrder: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

KidsAgeGroupSchema.index({ status: 1 });
KidsAgeGroupSchema.index({ isDeleted: 1 });

export const KidsAgeGroup =
  mongoose.models.KidsAgeGroup || mongoose.model<IKidsAgeGroup>('KidsAgeGroup', KidsAgeGroupSchema);
