import mongoose, { Document, Schema } from 'mongoose';

export interface IProductColor {
  name: string;
  hex: string;
  swatchImage?: string;
  images: string[];
  stock: number;
}

export interface ISizeMeasurement {
  size: 'Small' | 'Medium' | 'Large';
  lensWidth?: number;
  bridgeWidth?: number;
  templeLength?: number;
  frameWidth?: number;
  frameHeight?: number;
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
  shape?: string | string[];
  frameSize?: string;
  frameColor?: string;
  weight?: string;
  faceShapes?: string[];
  isPremium?: boolean;
  colors: IProductColor[];
  defaultColor?: string;
  images: string[];
  image360?: string;
  productVideo?: string;
  price: {
    original: number;
    selling: number;
  };
  memberPrice?: number;
  nonMemberPrice?: number;
  mrp?: number;
  sellingPrice?: number;
  discountPercent?: number;
  category: string;
  categories: string[];
  gender?: string | string[];
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
  availableSizes?: ('Small' | 'Medium' | 'Large')[];
  sizeMeasurements?: ISizeMeasurement[];
  offerBadges?: string[];
  
  // NEW WIZARD FIELDS BELOW
  barcode?: string;
  slug: string;
  brandId?: mongoose.Types.ObjectId;
  categoryId?: mongoose.Types.ObjectId;
  subCategoryId?: mongoose.Types.ObjectId;
  subCategory?: string;
  launchDate?: Date;
  sortOrder?: number;
  status: 'Draft' | 'Active' | 'Inactive' | 'Scheduled';
  shortDescription?: string;
  longDescription?: string;

  // Step 2: Pricing
  costPrice?: number;
  gstPercent?: number;
  discountType?: 'Percentage' | 'Fixed Amount' | 'None';
  discountValue?: number;
  profitMargin?: number;
  taxInclusive?: boolean;
  currency?: string;

  // Step 3: Member Pricing
  enableMemberPricing?: boolean;
  memberPrices?: {
    regularPrice?: number;
    goldMemberPrice?: number;
    platinumMemberPrice?: number;
    corporateMemberPrice?: number;
    studentMemberPrice?: number;
    employeePrice?: number;
    cashbackPercent?: number;
    rewardPoints?: number;
  };
  memberExclusiveProduct?: boolean;

  // Step 4 & 5: Frame Specs & Measurements
  primaryColor?: string;
  secondaryColor?: string;
  frameWeight?: string;
  countryOfOrigin?: string;
  manufacturer?: string;
  warranty?: string;
  returnPolicy?: string;
  deliveryInfo?: string;
  frameHeight?: number;
  pdCompatibility?: string;
  faceShapeCompatibility?: string[];

  // Step 6: Lens Compatibility & Dynamic Lens Pricing
  lensTypes?: mongoose.Types.ObjectId[];
  compatibleLensTypes?: string[];
  dynamicLensPricing?: Array<{
    lensName: string;
    lensCategory: string;
    regularPrice: number;
    goldPrice: number;
    platinumPrice: number;
    priority: number;
    status: 'Active' | 'Inactive';
    minSph?: number;
    maxSph?: number;
    minCyl?: number;
    maxCyl?: number;
  }>;

  // Step 7: Thickness Pricing
  thicknessPricing?: Array<{
    thickness: string; // '1.50' | '1.56' | '1.59' | '1.67' | '1.74'
    regularPrice: number;
    goldPrice: number;
    platinumPrice: number;
  }>;

  // Step 8: Coating Options
  coatingPricing?: Array<{
    coatingName: string; // 'Blue Cut' | 'Anti Glare' | 'UV Protection' | 'Photochromic' | 'Polarized' | 'Hydrophobic' | 'Scratch Resistant'
    regularPrice: number;
    memberPrice: number;
    description?: string;
    isActive: boolean;
  }>;

  // Step 9: Membership & Offers
  eligibleForGold?: boolean;
  eligibleForPlatinum?: boolean;
  buy1Get1?: boolean;
  oneRupeeFrameOffer?: boolean;
  couponEligible?: boolean;
  rewardEligible?: boolean;
  familySharing?: boolean;
  exclusiveProduct?: boolean;
  oneRupeeOfferConditions?: {
    membershipRequired?: boolean;
    premiumLensRequired?: boolean;
    minCartValue?: number;
    campaignStartDate?: Date;
    campaignEndDate?: Date;
    maxUsage?: number;
  };

  // Step 11: Inventory
  warehouseInventory?: Array<{
    warehouseId: mongoose.Types.ObjectId;
    warehouseName: string;
    availableStock: number;
    reservedStock: number;
    safetyStock: number;
    lowStockAlert: number;
    reorderLevel: number;
    barcode?: string;
    qrCode?: string;
  }>;

  // Step 12: Shipping
  shippingWeight?: number;
  shippingLength?: number;
  shippingWidth?: number;
  shippingHeight?: number;
  packageType?: string;
  fragile?: boolean;
  estimatedDeliveryDays?: number;

  // Step 13: Media
  thumbnail?: string;
  frontView?: string;
  leftView?: string;
  rightView?: string;
  topView?: string;
  threeSixtyImages?: string[];
  lifestyleImages?: string[];
  threeDModel?: string;
  arModel?: string;

  // Step 14: SEO
  seoKeywords?: string;
  canonicalUrl?: string;
  openGraphTitle?: string;
  openGraphDescription?: string;
  schemaMarkup?: string;
  imageAltText?: string;

  // New fields for Special Power and Contacts
  readingPowers?: string[];
  contactPowers?: Array<{ power: string; price: number }>;
  contactDisposableType?: string;
  sellAsFrame?: boolean;
  sellWithLens?: boolean;

  // Audit Logs Version Tracking
  currentVersion: number;

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
    shape: {
      type: [String],
      default: [],
    },
    frameSize: { type: String },
    frameColor: { type: String },
    weight: { type: String },
    faceShapes: [{ type: String }],
    isPremium: { type: Boolean, default: false },
    colors: [ProductColorSchema],
    defaultColor: { type: String },
    images: [String],
    image360: { type: String },
    productVideo: { type: String },
    price: {
      original: { type: Number, default: 999 },
      selling: { type: Number, default: 1 },
    },
    memberPrice: { type: Number },
    nonMemberPrice: { type: Number },
    mrp: { type: Number },
    sellingPrice: { type: Number },
    discountPercent: { type: Number },
    category: {
      type: String,
      enum: ['prescription', 'sunglasses', 'blue_light', 'contact_lenses', 'kids', 'eyeglasses', 'computer-glasses', 'power-sunglasses', 'reading-glasses', 'accessories'],
    },
    categories: [String],
    gender: {
      type: [String],
      default: ['unisex'],
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
    availableSizes: [{ type: String, enum: ['Small', 'Medium', 'Large'] }],
    sizeMeasurements: [
      {
        size: { type: String, enum: ['Small', 'Medium', 'Large'], required: true },
        lensWidth: Number,
        bridgeWidth: Number,
        templeLength: Number,
        frameWidth: Number,
        frameHeight: Number,
      }
    ],
    offerBadges: [{ type: String }],

    // NEW WIZARD SCHEMAS
    barcode: { type: String },
    slug: { type: String, required: true, unique: true },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    subCategoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    subCategory: { type: String },
    launchDate: { type: Date },
    sortOrder: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Inactive', 'Scheduled'],
      default: 'Draft',
    },
    shortDescription: { type: String },
    longDescription: { type: String },

    // Step 2: Pricing
    costPrice: { type: Number, default: 0 },
    gstPercent: { type: Number, default: 18 },
    discountType: {
      type: String,
      enum: ['Percentage', 'Fixed Amount', 'None'],
      default: 'None',
    },
    discountValue: { type: Number, default: 0 },
    profitMargin: { type: Number, default: 0 },
    taxInclusive: { type: Boolean, default: true },
    currency: { type: String, default: 'INR' },

    // Step 3: Member Pricing
    enableMemberPricing: { type: Boolean, default: false },
    memberPrices: {
      regularPrice: { type: Number },
      goldMemberPrice: { type: Number },
      platinumMemberPrice: { type: Number },
      corporateMemberPrice: { type: Number },
      studentMemberPrice: { type: Number },
      employeePrice: { type: Number },
      cashbackPercent: { type: Number, default: 0 },
      rewardPoints: { type: Number, default: 0 },
    },
    memberExclusiveProduct: { type: Boolean, default: false },

    // Step 4 & 5: Frame Specs & Measurements
    primaryColor: { type: String },
    secondaryColor: { type: String },
    frameWeight: { type: String },
    countryOfOrigin: { type: String },
    manufacturer: { type: String },
    warranty: { type: String },
    returnPolicy: { type: String, default: '14-Day Returnable' },
    deliveryInfo: { type: String, default: '5-7 Days Delivery' },
    frameHeight: { type: Number },
    pdCompatibility: { type: String },
    faceShapeCompatibility: [String],

    // Step 6: Lens Compatibility & Dynamic Lens Pricing
    lensTypes: [{ type: Schema.Types.ObjectId, ref: 'LensType' }],
    compatibleLensTypes: [String],
    dynamicLensPricing: [
      {
        lensName: { type: String, required: true },
        lensCategory: { type: String, required: true },
        regularPrice: { type: Number, required: true },
        goldPrice: { type: Number, required: true },
        platinumPrice: { type: Number, required: true },
        priority: { type: Number, default: 0 },
        status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
        minSph: { type: Number, default: -20 },
        maxSph: { type: Number, default: 20 },
        minCyl: { type: Number, default: -6 },
        maxCyl: { type: Number, default: 6 },
      },
    ],

    // Step 7: Thickness Pricing
    thicknessPricing: [
      {
        thickness: { type: String, required: true },
        regularPrice: { type: Number, required: true },
        goldPrice: { type: Number, required: true },
        platinumPrice: { type: Number, required: true },
      },
    ],

    // Step 8: Coating Options
    coatingPricing: [
      {
        coatingName: { type: String, required: true },
        regularPrice: { type: Number, required: true },
        memberPrice: { type: Number, required: true },
        description: { type: String },
        isActive: { type: Boolean, default: true },
      },
    ],

    // Step 9: Membership & Offers
    eligibleForGold: { type: Boolean, default: true },
    eligibleForPlatinum: { type: Boolean, default: true },
    buy1Get1: { type: Boolean, default: false },
    oneRupeeFrameOffer: { type: Boolean, default: false },
    couponEligible: { type: Boolean, default: true },
    rewardEligible: { type: Boolean, default: true },
    familySharing: { type: Boolean, default: false },
    exclusiveProduct: { type: Boolean, default: false },
    oneRupeeOfferConditions: {
      membershipRequired: { type: Boolean, default: false },
      premiumLensRequired: { type: Boolean, default: false },
      minCartValue: { type: Number, default: 0 },
      campaignStartDate: { type: Date },
      campaignEndDate: { type: Date },
      maxUsage: { type: Number },
    },

    // Step 11: Inventory
    warehouseInventory: [
      {
        warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
        warehouseName: { type: String, required: true },
        availableStock: { type: Number, default: 0 },
        reservedStock: { type: Number, default: 0 },
        safetyStock: { type: Number, default: 0 },
        lowStockAlert: { type: Number, default: 10 },
        reorderLevel: { type: Number, default: 20 },
        barcode: { type: String },
        qrCode: { type: String },
      },
    ],

    // Step 12: Shipping
    shippingWeight: { type: Number },
    shippingLength: { type: Number },
    shippingWidth: { type: Number },
    shippingHeight: { type: Number },
    packageType: { type: String },
    fragile: { type: Boolean, default: false },
    estimatedDeliveryDays: { type: Number, default: 5 },

    // Step 13: Media
    thumbnail: { type: String },
    frontView: { type: String },
    leftView: { type: String },
    rightView: { type: String },
    topView: { type: String },
    threeSixtyImages: [String],
    lifestyleImages: [String],
    threeDModel: { type: String },
    arModel: { type: String },

    // Step 14: SEO
    seoKeywords: { type: String },
    canonicalUrl: { type: String },
    openGraphTitle: { type: String },
    openGraphDescription: { type: String },
    schemaMarkup: { type: String },
    imageAltText: { type: String },

    // New fields for Special Power and Contacts
    readingPowers: [{ type: String }],
    contactPowers: [
      {
        power: { type: String },
        price: { type: Number }
      }
    ],
    contactDisposableType: { type: String },
    sellAsFrame: { type: Boolean, default: true },
    sellWithLens: { type: Boolean, default: true },

    currentVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

ProductSchema.index({ category: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ brandId: 1 });
ProductSchema.index({ categoryId: 1 });

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
