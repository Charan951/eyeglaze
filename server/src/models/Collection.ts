import mongoose, { Document, Schema } from 'mongoose';

export interface ICollection extends Document {
  name: string;
  slug: string;
  code: string;
  bannerImage?: string;
  description?: string;
  displayOrder: number;
  status: 'Draft' | 'Active' | 'Inactive' | 'Archived';
  childCategoryId?: mongoose.Types.ObjectId; // References ChildCategory (optional)
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CollectionSchema = new Schema<ICollection>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    bannerImage: { type: String },
    description: { type: String },
    displayOrder: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Inactive', 'Archived'],
      default: 'Active',
    },
    childCategoryId: { type: Schema.Types.ObjectId, ref: 'ChildCategory' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

CollectionSchema.index({ childCategoryId: 1 });
CollectionSchema.index({ status: 1 });
CollectionSchema.index({ isDeleted: 1 });

export const Collection = mongoose.models.Collection || mongoose.model<ICollection>('Collection', CollectionSchema);
