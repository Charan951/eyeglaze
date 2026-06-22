import mongoose, { Document, Schema } from 'mongoose';

export interface ICategoryFilter extends Document {
  targetId: mongoose.Types.ObjectId;
  targetType: 'Category' | 'SubCategory' | 'ChildCategory' | 'Collection';
  enabledFilters: {
    brand: boolean;
    price: boolean;
    color: boolean;
    frameShape: boolean;
    frameMaterial: boolean;
    frameWidth: boolean;
    lensType: boolean;
    weight: boolean;
    features: boolean;
    faceShape: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CategoryFilterSchema = new Schema<ICategoryFilter>(
  {
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    targetType: {
      type: String,
      required: true,
      enum: ['Category', 'SubCategory', 'ChildCategory', 'Collection'],
    },
    enabledFilters: {
      brand: { type: Boolean, default: true },
      price: { type: Boolean, default: true },
      color: { type: Boolean, default: true },
      frameShape: { type: Boolean, default: true },
      frameMaterial: { type: Boolean, default: true },
      frameWidth: { type: Boolean, default: true },
      lensType: { type: Boolean, default: true },
      weight: { type: Boolean, default: true },
      features: { type: Boolean, default: true },
      faceShape: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

CategoryFilterSchema.index({ targetId: 1, targetType: 1 }, { unique: true });

export const CategoryFilter =
  mongoose.models.CategoryFilter || mongoose.model<ICategoryFilter>('CategoryFilter', CategoryFilterSchema);
