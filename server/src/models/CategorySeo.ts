import mongoose, { Document, Schema } from 'mongoose';

export interface ICategorySeo extends Document {
  targetId: mongoose.Types.ObjectId;
  targetType: 'Category' | 'SubCategory';
  seoTitle?: string;
  metaDescription?: string;
  keywords?: string;
  canonicalUrl?: string;
  slug?: string;
  ogImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySeoSchema = new Schema<ICategorySeo>(
  {
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    targetType: {
      type: String,
      required: true,
      enum: ['Category', 'SubCategory'],
    },
    seoTitle: { type: String },
    metaDescription: { type: String },
    keywords: { type: String },
    canonicalUrl: { type: String },
    slug: { type: String },
    ogImage: { type: String },
  },
  { timestamps: true }
);

CategorySeoSchema.index({ targetId: 1, targetType: 1 }, { unique: true });

export const CategorySeo =
  mongoose.models.CategorySeo || mongoose.model<ICategorySeo>('CategorySeo', CategorySeoSchema);
