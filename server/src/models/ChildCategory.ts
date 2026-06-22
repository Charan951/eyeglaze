import mongoose, { Document, Schema } from 'mongoose';

export interface IChildCategory extends Document {
  name: string;
  slug: string;
  code: string;
  subCategoryId: mongoose.Types.ObjectId; // References SubCategory
  description?: string;
  displayOrder: number;
  status: 'Draft' | 'Active' | 'Inactive' | 'Archived';
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChildCategorySchema = new Schema<IChildCategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
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
  },
  { timestamps: true }
);

ChildCategorySchema.index({ subCategoryId: 1 });
ChildCategorySchema.index({ status: 1 });
ChildCategorySchema.index({ isDeleted: 1 });

export const ChildCategory = mongoose.models.ChildCategory || mongoose.model<IChildCategory>('ChildCategory', ChildCategorySchema);
