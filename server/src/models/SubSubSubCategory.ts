import mongoose, { Document, Schema } from 'mongoose';

export interface ISubSubSubCategory extends Document {
  name: string;
  slug: string;
  code: string;
  categoryId: mongoose.Types.ObjectId; // References Category
  subCategoryId: mongoose.Types.ObjectId; // References SubCategory
  subSubCategoryId: mongoose.Types.ObjectId; // References SubSubCategory
  description?: string;
  displayOrder: number;
  status: 'Draft' | 'Active' | 'Inactive' | 'Archived';
  isDeleted: boolean;
  deletedAt?: Date;
  icon?: string;
  bannerImage?: string;
  bannerImageEnabled?: boolean;
  linkTo?: string;
  gender?: string;
  startingPrice?: number;
  startingPriceEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubSubSubCategorySchema = new Schema<ISubSubSubCategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    code: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    subCategoryId: { type: Schema.Types.ObjectId, ref: 'SubCategory', required: true },
    subSubCategoryId: { type: Schema.Types.ObjectId, ref: 'SubSubCategory', required: true },
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
    bannerImageEnabled: { type: Boolean, default: false },
    linkTo: { type: String },
    gender: { type: String },
    startingPrice: { type: Number, default: null },
    startingPriceEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SubSubSubCategorySchema.index({ categoryId: 1 });
SubSubSubCategorySchema.index({ subCategoryId: 1 });
SubSubSubCategorySchema.index({ subSubCategoryId: 1 });
SubSubSubCategorySchema.index({ status: 1 });

export const SubSubSubCategory =
  mongoose.models.SubSubSubCategory || mongoose.model<ISubSubSubCategory>('SubSubSubCategory', SubSubSubCategorySchema);
