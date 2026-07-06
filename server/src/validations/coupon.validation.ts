import { z } from 'zod';

// MongoDB ObjectId validation regex
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const zObjectId = z.string().regex(objectIdRegex, 'Invalid MongoDB ObjectId');

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(20).toUpperCase(),
    name: z.string().min(3).max(100),
    description: z.string().min(5).max(500),
    badge: z.string().optional(),
    discountType: z.enum(['percent', 'flat', 'bogo', 'buy_x_get_y', 'free_shipping', 'cashback', 'wallet_credit', 'gift']),
    couponType: z.string().min(2).max(50),
    discountValue: z.number().nonnegative(),
    maxDiscount: z.number().nonnegative().optional(),
    minOrderValue: z.number().nonnegative().optional(),
    maxOrderValue: z.number().nonnegative().optional(),
    validFrom: z.string().datetime({ offset: true }).or(z.string().date()).optional().transform(val => val ? new Date(val) : undefined),
    validTo: z.string().datetime({ offset: true }).or(z.string().date()).optional().transform(val => val ? new Date(val) : undefined),
    isActive: z.boolean().optional(),
    
    autoApply: z.boolean().optional(),
    priority: z.number().int().optional(),
    stackable: z.boolean().optional(),
    exclusive: z.boolean().optional(),
    usageLimitPerUser: z.number().int().positive().optional(),
    usageLimitTotal: z.number().int().nonnegative().optional(),
    buyQty: z.number().int().positive().optional(), // Added for BOGO
    getQty: z.number().int().positive().optional(), // Added for BOGO
    
    currency: z.string().optional(),
    timeZone: z.string().optional(),
    countryRestrictions: z.array(z.string()).optional(),
    stateRestrictions: z.array(z.string()).optional(),
    cityRestrictions: z.array(z.string()).optional(),
    
    customerGroups: z.array(z.string()).optional(),
    membershipRequired: z.boolean().optional(),
    newUserOnly: z.boolean().optional(),
    existingUserOnly: z.boolean().optional(),
    firstPurchaseOnly: z.boolean().optional(),
    referralRequired: z.boolean().optional(),
    
    paymentMethodRestrictions: z.array(z.string()).optional(),
    shippingMethodRestrictions: z.array(z.string()).optional(),
    
    applicableProducts: z.array(zObjectId).optional(),
    excludedProducts: z.array(zObjectId).optional(),
    applicableCategories: z.array(z.string()).optional(),
    excludedCategories: z.array(z.string()).optional(),
    applicableBrands: z.array(z.string()).optional(),
    excludedBrands: z.array(z.string()).optional(),
    vendorRestrictions: z.array(z.string()).optional(),
    
    tags: z.array(z.string()).optional(),
  }),
});

export const updateCouponSchema = z.object({
  params: z.object({
    id: zObjectId,
  }),
  body: createCouponSchema.shape.body.partial(),
});

export const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1).toUpperCase(),
    cartTotal: z.number().nonnegative(),
    items: z.array(z.object({
      productId: zObjectId,
      qty: z.number().int().positive(),
      price: z.number().nonnegative(),
      category: z.string().optional(),
      brand: z.string().optional(),
    })).optional(),
    paymentMethod: z.string().optional(),
    shippingMethod: z.string().optional(),
    location: z.object({
      country: z.string().optional(),
      state: z.string().optional(),
      city: z.string().optional(),
    }).optional(),
  }),
});
