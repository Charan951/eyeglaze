import mongoose, { Document, Schema } from 'mongoose';

export interface ISubCategory extends Document {
  name: string;
  slug: string;
  code: string;
  categoryId: mongoose.Types.ObjectId; // References Category
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
  shapeModal?: boolean;
  modalShapes?: string[];
  modalAgeGroups?: string[];
  showInNavbar?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubCategorySchema = new Schema<ISubCategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
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
    shapeModal: { type: Boolean, default: false },
    modalShapes: { type: [String], default: ['Round', 'Rectangle', 'Aviator', 'Square', 'Cat Eye', 'Geometric'] },
    modalAgeGroups: { type: [String], default: ['Kids On Sale', 'Juniors', 'Tweens', 'Teens'] },
    showInNavbar: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SubCategorySchema.index({ categoryId: 1 });
SubCategorySchema.index({ status: 1 });
SubCategorySchema.index({ isDeleted: 1 });

export const SubCategory = mongoose.models.SubCategory || mongoose.model<ISubCategory>('SubCategory', SubCategorySchema);
