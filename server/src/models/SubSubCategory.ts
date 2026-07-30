import mongoose, { Document, Schema } from 'mongoose';

export interface ISubSubCategory extends Document {
  name: string;
  slug: string;
  code: string;
  categoryId: mongoose.Types.ObjectId; // References main Category
  subCategoryId: mongoose.Types.ObjectId; // References SubCategory
  description?: string;
  displayOrder: number;
  status: 'Draft' | 'Active' | 'Inactive' | 'Archived';
  isDeleted: boolean;
  deletedAt?: Date;
  icon?: string;
  bannerImage?: string;
  linkTo?: string;
  gender?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubSubCategorySchema = new Schema<ISubSubCategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    subCategoryId: { type: Schema.Types.ObjectId, ref: 'SubCategory', required: true },
    description: { type: String },
    displayOrder: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Inactive', 'Archived'],
      default: 'Active',
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    icon: { type: String },
    bannerImage: { type: String },
    linkTo: { type: String },
    gender: { type: String },
  },
  { timestamps: true }
);

SubSubCategorySchema.index({ categoryId: 1 });
SubSubCategorySchema.index({ subCategoryId: 1 });
SubSubCategorySchema.index({ status: 1 });
SubSubCategorySchema.index({ isDeleted: 1 });

export const SubSubCategory =
  mongoose.models.SubSubCategory || mongoose.model<ISubSubCategory>('SubSubCategory', SubSubCategorySchema);
