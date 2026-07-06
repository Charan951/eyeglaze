import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  name: string;
  description: string;
  badge?: string;
  discountType: 'percent' | 'flat' | 'bogo' | 'buy_x_get_y' | 'free_shipping' | 'cashback' | 'wallet_credit' | 'gift';
  couponType: string; // The specific classification type
  discountValue: number;
  maxDiscount?: number;
  maxDiscountCap?: number; // Aliased for backward compatibility
  minOrderValue?: number;
  maxOrderValue?: number;
  validFrom?: Date;
  validTo?: Date; // mapped to validUntil
  expiresAt?: Date; // fallback compatibility
  isActive: boolean;
  isDeleted: boolean; // For soft delete
  
  // Advanced Constraints
  autoApply: boolean;
  priority: number;
  stackable: boolean;
  exclusive: boolean;
  usageLimitPerUser: number;
  usageLimitTotal: number;
  usedCount: number;
  buyQty: number; // Added for Buy X Get Y
  getQty: number; // Added for Buy X Get Y
  
  currency: string;
  timeZone: string;
  countryRestrictions: string[];
  stateRestrictions: string[];
  cityRestrictions: string[];
  
  customerGroups: string[];
  membershipRequired: boolean;
  newUserOnly: boolean;
  existingUserOnly: boolean;
  firstPurchaseOnly: boolean;
  referralRequired: boolean;
  
  paymentMethodRestrictions: string[];
  shippingMethodRestrictions: string[];
  
  applicableProducts: mongoose.Types.ObjectId[]; // previously skus
  excludedProducts: mongoose.Types.ObjectId[];
  applicableCategories: string[]; // previously categories
  excludedCategories: string[];
  applicableBrands: string[];
  excludedBrands: string[];
  vendorRestrictions: string[];
  
  // Compatibility fields
  applicableTo: 'all' | 'categories' | 'skus';
  categories: string[];
  skus: string[];
  userSpecific?: mongoose.Types.ObjectId;
  
  tags: string[];
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, unique: true, uppercase: true, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    badge: { type: String },
    discountType: {
      type: String,
      enum: ['percent', 'flat', 'bogo', 'buy_x_get_y', 'free_shipping', 'cashback', 'wallet_credit', 'gift'],
      required: true,
    },
    couponType: { type: String, required: true, index: true },
    discountValue: { type: Number, required: true, default: 0 },
    buyQty: { type: Number, default: 1 }, // Added for Buy X Get Y
    getQty: { type: Number, default: 1 }, // Added for Buy X Get Y
    maxDiscount: { type: Number },
    maxDiscountCap: { type: Number }, // Backward compatibility
    minOrderValue: { type: Number, default: 0 },
    maxOrderValue: { type: Number },
    validFrom: { type: Date, default: Date.now, index: true },
    validTo: { type: Date, index: true },
    expiresAt: { type: Date }, // Backward compatibility
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    
    autoApply: { type: Boolean, default: false, index: true },
    priority: { type: Number, default: 0, index: true },
    stackable: { type: Boolean, default: false },
    exclusive: { type: Boolean, default: true },
    usageLimitPerUser: { type: Number, default: 1 },
    usageLimitTotal: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    
    currency: { type: String, default: 'INR' },
    timeZone: { type: String, default: 'Asia/Kolkata' },
    countryRestrictions: [{ type: String }],
    stateRestrictions: [{ type: String }],
    cityRestrictions: [{ type: String }],
    
    customerGroups: [{ type: String }],
    membershipRequired: { type: Boolean, default: false },
    newUserOnly: { type: Boolean, default: false },
    existingUserOnly: { type: Boolean, default: false },
    firstPurchaseOnly: { type: Boolean, default: false },
    referralRequired: { type: Boolean, default: false },
    
    paymentMethodRestrictions: [{ type: String }],
    shippingMethodRestrictions: [{ type: String }],
    
    applicableProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    excludedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    applicableCategories: [{ type: String }],
    excludedCategories: [{ type: String }],
    applicableBrands: [{ type: String }],
    excludedBrands: [{ type: String }],
    vendorRestrictions: [{ type: String }],
    
    // Compatibility fields
    applicableTo: { type: String, enum: ['all', 'categories', 'skus'], default: 'all' },
    categories: [{ type: String }],
    skus: [{ type: String }],
    userSpecific: { type: Schema.Types.ObjectId, ref: 'User' },
    
    tags: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Virtual for remaining count
CouponSchema.virtual('remainingCount').get(function (this: ICoupon) {
  if (this.usageLimitTotal === 0) return Infinity;
  return Math.max(0, this.usageLimitTotal - this.usedCount);
});

// Virtual for validTo compatibility
CouponSchema.pre('save', function (this: any) {
  if (this.validTo && !this.expiresAt) {
    this.expiresAt = this.validTo;
  } else if (this.expiresAt && !this.validTo) {
    this.validTo = this.expiresAt;
  }
  
  if (this.maxDiscount && !this.maxDiscountCap) {
    this.maxDiscountCap = this.maxDiscount;
  } else if (this.maxDiscountCap && !this.maxDiscount) {
    this.maxDiscount = this.maxDiscountCap;
  }
  
  // Keep compatibility categories/skus updated from modern equivalents
  if (this.applicableCategories && this.applicableCategories.length > 0) {
    this.categories = this.applicableCategories;
  }
});

// Indexes for high performance
CouponSchema.index({ code: 1, isActive: 1, isDeleted: 1 });
CouponSchema.index({ validFrom: 1, validTo: 1 });
CouponSchema.index({ autoApply: 1, priority: -1 });

export const Coupon = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
