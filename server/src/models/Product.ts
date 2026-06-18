import mongoose, { Document, Schema } from 'mongoose';

export interface IProductColor {
  name: string;
  hex: string;
  swatchImage?: string;
  images: string[];
  stock: number;
}

export interface IProduct extends Document {
  sku: string;
  name: string;
  description?: string;
  frame: {
    type: string;
    material: string;
    width?: number;
    lensWidth?: number;
    bridgeWidth?: number;
    templeLength?: number;
    featureTags: string[];
  };
  frameType?: string;
  material?: string;
  brand?: string;
  shape?: string;
  frameSize?: string;
  frameColor?: string;
  weight?: string;
  faceShapes?: string[];
  isPremium?: boolean;
  colors: IProductColor[];
  defaultColor?: string;
  images: string[];
  image360?: string;
  price: {
    original: number;
    selling: number;
  };
  mrp?: number;
  sellingPrice?: number;
  discountPercent?: number;
  category: string;
  categories: string[];
  gender?: 'men' | 'women' | 'kids' | 'unisex';
  compatible: {
    prescription: boolean;
    bluecut: boolean;
    zeropower: boolean;
    progressive: boolean;
  };
  lensCompatibility: string[];
  tags: string[];
  rating: number;
  reviewCount: number;
  soldCount: number;
  weeklyBought?: number;
  isBestseller: boolean;
  isActive: boolean;
  meta: {
    seoTitle?: string;
    seoDescription?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductColorSchema = new Schema<IProductColor>({
  name: String,
  hex: String,
  swatchImage: String,
  images: [String],
  stock: { type: Number, default: 0 },
});

const ProductSchema = new Schema<IProduct>(
  {
    sku: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    description: { type: String },
    frame: {
      type: {
        type: String,
        description: 'Frame type like Square, Round, etc.',
      },
      material: String,
      width: Number,
      lensWidth: Number,
      bridgeWidth: Number,
      templeLength: Number,
      featureTags: [String],
    },
    frameType: { type: String },
    material: { type: String },
    brand: { type: String },
    shape: { type: String },
    frameSize: { type: String },
    frameColor: { type: String },
    weight: { type: String },
    faceShapes: [{ type: String }],
    isPremium: { type: Boolean, default: false },
    colors: [ProductColorSchema],
    defaultColor: { type: String },
    images: [String],
    image360: { type: String },
    price: {
      original: { type: Number, default: 999 },
      selling: { type: Number, default: 1 },
    },
    mrp: { type: Number },
    sellingPrice: { type: Number },
    discountPercent: { type: Number },
    category: {
      type: String,
      enum: ['prescription', 'sunglasses', 'blue_light', 'contact_lenses', 'kids'],
    },
    categories: [String],
    gender: {
      type: String,
      enum: ['men', 'women', 'kids', 'unisex'],
      default: 'unisex',
    },
    compatible: {
      prescription: { type: Boolean, default: false },
      bluecut: { type: Boolean, default: false },
      zeropower: { type: Boolean, default: false },
      progressive: { type: Boolean, default: false },
    },
    lensCompatibility: [String],
    tags: [String],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    weeklyBought: { type: Number, default: 0 },
    isBestseller: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    meta: {
      seoTitle: String,
      seoDescription: String,
    },
  },
  { timestamps: true }
);

ProductSchema.index({ sku: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ categories: 1 });
ProductSchema.index({ name: 'text', tags: 'text' });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ shape: 1 });
ProductSchema.index({ frameSize: 1 });
ProductSchema.index({ frameColor: 1 });
ProductSchema.index({ frameType: 1 });
ProductSchema.index({ material: 1 });
ProductSchema.index({ weight: 1 });
ProductSchema.index({ faceShapes: 1 });
ProductSchema.index({ rating: 1 });
ProductSchema.index({ isPremium: 1 });
ProductSchema.index({ gender: 1 });

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
