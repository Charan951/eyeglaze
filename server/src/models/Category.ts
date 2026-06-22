import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  code: string; // Auto-generated or user supplied
  icon?: string;
  bannerImage?: string;
  description?: string;
  displayOrder: number;
  status: 'Draft' | 'Active' | 'Inactive' | 'Archived';
  isDeleted: boolean;
  deletedAt?: Date;
  parentCategory?: string; // Backwards compatibility field
  isActive: boolean; // Backwards compatibility field
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    icon: { type: String },
    bannerImage: { type: String },
    description: { type: String },
    displayOrder: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Inactive', 'Archived'],
      default: 'Active',
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    // Backwards compatibility fields
    parentCategory: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CategorySchema.index({ status: 1 });
CategorySchema.index({ isDeleted: 1 });

export const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
