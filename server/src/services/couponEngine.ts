import mongoose from 'mongoose';
import { Coupon, ICoupon } from '../models/Coupon';
import { CouponUsage } from '../models/CouponUsage';
import { Order } from '../models/Order';
import { User } from '../models/User';

export interface CartItem {
  productId: string;
  qty: number;
  price: number;
  category?: string;
  brand?: string;
}

export interface ValidationContext {
  cartTotal: number;
  items: CartItem[];
  paymentMethod?: string;
  shippingMethod?: string;
  location?: {
    country?: string;
    state?: string;
    city?: string;
  };
  shippingCost?: number;
  isTaxBeforeDiscount?: boolean;
  taxRate?: number; // E.g., 0.18 for 18% GST
}

export interface ValidationResult {
  valid: boolean;
  message: string;
  discount?: number; // Added for backward compatibility
  discountAmount?: number;
  cashbackAmount?: number;
  coupon?: ICoupon;
  reasons?: string[];
}

export class CouponEngine {
  
  /**
   * Validates a coupon against a user, cart details, and environmental constraints.
   */
  static async validate(
    code: string,
    userId: string | undefined,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const now = new Date();
    
    // 1. Fetch Coupon
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isDeleted: false,
    });
    
    if (!coupon) {
      return { valid: false, message: 'Coupon code does not exist' };
    }
    
    const reasons: string[] = [];
    
    // 2. Active Status Check
    if (!coupon.isActive) {
      reasons.push('Coupon is currently inactive');
    }
    
    // 3. Expiration Check
    if (coupon.validFrom && coupon.validFrom > now) {
      reasons.push('Coupon promotion has not started yet');
    }
    if (coupon.validTo && coupon.validTo < now) {
      reasons.push('Coupon has expired');
    }
    
    // 4. Usage Limits
    if (coupon.usageLimitTotal > 0 && coupon.usedCount >= coupon.usageLimitTotal) {
      reasons.push('Coupon usage limit reached');
    }
    
    // 5. User Specific Check
    if (coupon.userSpecific && (!userId || coupon.userSpecific.toString() !== userId)) {
      reasons.push('This coupon is not available for your account');
    }
    
    // Fetch User Details if logged in
    let user = null;
    if (userId) {
      user = await User.findById(userId);
    }
    
    // 6. User Status & Restrictions
    if (coupon.membershipRequired && (!user || !user.membershipActive)) {
      reasons.push('This coupon requires an active VIP Gold Membership');
    }
    
    if (user) {
      // Check first purchase / new user constraints
      const previousOrderCount = await Order.countDocuments({
        user: userId,
        paymentStatus: 'paid',
      });
      
      if (coupon.newUserOnly && previousOrderCount > 0) {
        reasons.push('This coupon is only valid for new users');
      }
      if (coupon.firstPurchaseOnly && previousOrderCount > 0) {
        reasons.push('This coupon is only valid on your first order');
      }
      if (coupon.existingUserOnly && previousOrderCount === 0) {
        reasons.push('This coupon is only valid for existing customers');
      }
      
      // Check user specific usage limits
      const userUsageCount = await CouponUsage.countDocuments({
        couponId: coupon._id,
        userId: userId,
        status: 'applied',
      });
      
      if (userUsageCount >= coupon.usageLimitPerUser) {
        reasons.push(`You have reached the maximum usage limit of ${coupon.usageLimitPerUser} for this coupon`);
      }
      
      // Blacklisted Customers (Customer groups fallback)
      if (coupon.customerGroups && coupon.customerGroups.length > 0) {
        const matchesGroup = coupon.customerGroups.some((grp: string) => {
          if (grp.toLowerCase() === 'vip' && user?.membershipActive) return true;
          return false;
        });
        if (!matchesGroup) {
          reasons.push('Your customer group is not eligible for this coupon');
        }
      }
    } else {
      // If user specific rules exist but guest checkout
      if (coupon.membershipRequired || coupon.newUserOnly || coupon.firstPurchaseOnly || coupon.existingUserOnly || coupon.userSpecific) {
        reasons.push('You must be logged in to apply this coupon');
      }
    }
    
    // 7. Cart Value Constraints
    if (coupon.minOrderValue && context.cartTotal < coupon.minOrderValue) {
      reasons.push(`Minimum order value of ₹${coupon.minOrderValue} required`);
    }
    if (coupon.maxOrderValue && context.cartTotal > coupon.maxOrderValue) {
      reasons.push(`Maximum order value limit of ₹${coupon.maxOrderValue} exceeded`);
    }
    
    // 8. Location Restrictions
    if (context.location) {
      const { country, state, city } = context.location;
      if (coupon.countryRestrictions?.length > 0 && country && !coupon.countryRestrictions.includes(country)) {
        reasons.push(`Not valid in country: ${country}`);
      }
      if (coupon.stateRestrictions?.length > 0 && state && !coupon.stateRestrictions.includes(state)) {
        reasons.push(`Not valid in state: ${state}`);
      }
      if (coupon.cityRestrictions?.length > 0 && city && !coupon.cityRestrictions.includes(city)) {
        reasons.push(`Not valid in city: ${city}`);
      }
    }
    
    // 9. Payment Restrictions
    if (coupon.paymentMethodRestrictions?.length > 0 && context.paymentMethod) {
      if (!coupon.paymentMethodRestrictions.includes(context.paymentMethod)) {
        reasons.push(`Only valid when paying via: ${coupon.paymentMethodRestrictions.join(', ')}`);
      }
    }
    
    // 10. Shipping Restrictions
    if (coupon.shippingMethodRestrictions?.length > 0 && context.shippingMethod) {
      if (!coupon.shippingMethodRestrictions.includes(context.shippingMethod)) {
        reasons.push(`Only valid when using shipping method: ${coupon.shippingMethodRestrictions.join(', ')}`);
      }
    }
    
    // 11. Product & Category Eligibility
    const itemAnalysis = this.analyzeItemEligibility(coupon, context.items);
    if (!itemAnalysis.isEligible) {
      reasons.push(itemAnalysis.reason || 'None of the items in your cart are eligible for this discount');
    } else {
      // Check BOGO / Buy X Get Y quantity requirements
      const totalEligibleQty = itemAnalysis.eligibleItems.reduce((acc, item) => acc + item.qty, 0);
      if (coupon.discountType === 'bogo') {
        const required = (coupon.buyQty || 1) + (coupon.getQty || 1);
        if (totalEligibleQty < required) {
          reasons.push(`BOGO Incomplete: Add ${required - totalEligibleQty} more eligible product(s) to get one FREE!`);
        }
      } else if (coupon.discountType === 'buy_x_get_y') {
        const required = (coupon.buyQty || 2) + (coupon.getQty || 1);
        if (totalEligibleQty < required) {
          reasons.push(`Offer Incomplete: Add ${required - totalEligibleQty} more eligible product(s) to get ${coupon.getQty || 1} free!`);
        }
      }
    }
    
    // Final check
    if (reasons.length > 0) {
      return {
        valid: false,
        message: reasons[0], // Return the first primary failure reason
        reasons,
        coupon,
      };
    }
    
    // 12. Calculate Savings
    const calculation = this.calculate(coupon, context, itemAnalysis.eligibleItems);
    
    return {
      valid: true,
      message: `Coupon applied successfully! You save ₹${Math.round(calculation.discountAmount)}`,
      discount: Math.round(calculation.discountAmount), // Added for backward compatibility
      discountAmount: Math.round(calculation.discountAmount),
      cashbackAmount: Math.round(calculation.cashbackAmount),
      coupon,
    };
  }
  
  /**
   * Helper to analyze item-level inclusions and exclusions.
   */
  private static analyzeItemEligibility(
    coupon: ICoupon,
    items: CartItem[]
  ): { isEligible: boolean; eligibleItems: CartItem[]; reason?: string } {
    if (!items || items.length === 0) {
      return { isEligible: true, eligibleItems: [] };
    }
    
    let eligibleItems = [...items];
    
    // 1. Exclude Brands
    if (coupon.excludedBrands && coupon.excludedBrands.length > 0) {
      eligibleItems = eligibleItems.filter(item => !coupon.excludedBrands.includes(item.brand || ''));
    }
    
    // 2. Exclude Categories
    const excludedCats = coupon.excludedCategories?.length ? coupon.excludedCategories : coupon.categories; // fallback
    if (excludedCats && excludedCats.length > 0) {
      eligibleItems = eligibleItems.filter(item => !excludedCats.includes(item.category || ''));
    }
    
    // 3. Exclude Specific Products
    if (coupon.excludedProducts && coupon.excludedProducts.length > 0) {
      eligibleItems = eligibleItems.filter(item => !coupon.excludedProducts.some(pId => pId.toString() === item.productId));
    }
    
    // 4. Include Brands
    if (coupon.applicableBrands && coupon.applicableBrands.length > 0) {
      eligibleItems = eligibleItems.filter(item => coupon.applicableBrands.includes(item.brand || ''));
    }
    
    // 5. Include Categories
    const applicableCats = coupon.applicableCategories?.length ? coupon.applicableCategories : coupon.categories;
    if (applicableCats && applicableCats.length > 0) {
      eligibleItems = eligibleItems.filter(item => applicableCats.includes(item.category || ''));
    }
    
    // 6. Include Specific Products
    const applicableProds = coupon.applicableProducts?.length ? coupon.applicableProducts : (coupon.skus?.map(s => new mongoose.Types.ObjectId(s)) || []);
    if (applicableProds && applicableProds.length > 0) {
      eligibleItems = eligibleItems.filter(item => applicableProds.some(pId => pId.toString() === item.productId));
    }
    
    if (eligibleItems.length === 0) {
      return {
        isEligible: false,
        eligibleItems: [],
        reason: 'Products or categories in your cart are not applicable for this coupon',
      };
    }
    
    return {
      isEligible: true,
      eligibleItems,
    };
  }
  
  /**
   * Core Calculation Logic supporting percentages, caps, BOGO, Buy X Get Y, and shipping.
   */
  private static calculate(
    coupon: ICoupon,
    context: ValidationContext,
    eligibleItems: CartItem[]
  ): { discountAmount: number; cashbackAmount: number } {
    let discountAmount = 0;
    let cashbackAmount = 0;
    
    const eligibleTotal = eligibleItems.reduce((acc, item) => acc + item.price * item.qty, 0);
    
    // Implement tax before / after discount conversion
    let calculationBase = eligibleTotal;
    if (context.isTaxBeforeDiscount && context.taxRate) {
      // If GST is 18%, divide by 1.18 to compute discount on untaxed base
      calculationBase = eligibleTotal / (1 + context.taxRate);
    }
    
    switch (coupon.discountType) {
      case 'percent': {
        const computed = (calculationBase * coupon.discountValue) / 100;
        const cap = coupon.maxDiscount || coupon.maxDiscountCap || Infinity;
        discountAmount = Math.min(computed, cap);
        break;
      }
      
      case 'flat': {
        discountAmount = Math.min(coupon.discountValue, eligibleTotal);
        break;
      }
      
      case 'free_shipping': {
        discountAmount = context.shippingCost || 0;
        break;
      }
      
      case 'cashback': {
        // Cashback is added to user wallet after successful purchase, not deducted directly from cart total
        const computed = (calculationBase * coupon.discountValue) / 100;
        const cap = coupon.maxDiscount || coupon.maxDiscountCap || Infinity;
        cashbackAmount = Math.min(computed, cap);
        break;
      }
      
      case 'wallet_credit':
      case 'gift': {
        discountAmount = Math.min(coupon.discountValue, eligibleTotal);
        break;
      }
      
      case 'bogo': {
        const buyQty = coupon.buyQty || 1;
        const getQty = coupon.getQty || 1;
        const required = buyQty + getQty;
        
        // Flatten items to list individual products
        const flatItems: number[] = [];
        eligibleItems.forEach(i => {
          for (let count = 0; count < i.qty; count++) {
            flatItems.push(i.price);
          }
        });
        
        if (flatItems.length >= required) {
          flatItems.sort((a, b) => a - b);
          // Free the cheapest Y items in each cycle
          const cycles = Math.floor(flatItems.length / required);
          const numFree = cycles * getQty;
          for (let i = 0; i < numFree; i++) {
            discountAmount += flatItems[i];
          }
        }
        break;
      }
      
      case 'buy_x_get_y': {
        const buyQty = coupon.buyQty || 2;
        const getQty = coupon.getQty || 1;
        const required = buyQty + getQty;
        
        const flatItems: number[] = [];
        eligibleItems.forEach(i => {
          for (let count = 0; count < i.qty; count++) {
            flatItems.push(i.price);
          }
        });
        
        if (flatItems.length >= required) {
          flatItems.sort((a, b) => a - b);
          const cycles = Math.floor(flatItems.length / required);
          const numFree = cycles * getQty;
          for (let i = 0; i < numFree; i++) {
            discountAmount += flatItems[i];
          }
        }
        break;
      }
      
      default:
        discountAmount = 0;
    }
    
    // If tax after discount, scale back up if base was untaxed
    if (context.isTaxBeforeDiscount && context.taxRate) {
      discountAmount = discountAmount * (1 + context.taxRate);
    }
    
    return {
      discountAmount: Math.max(0, discountAmount),
      cashbackAmount: Math.max(0, cashbackAmount),
    };
  }
  
  /**
   * Auto applies the best eligible coupon to save the customer the most money.
   */
  static async autoApplyBest(
    userId: string | undefined,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const now = new Date();
    
    // Find all auto-apply active coupons
    const coupons = await Coupon.find({
      isActive: true,
      isDeleted: false,
      autoApply: true,
      $and: [
        { $or: [{ validFrom: { $exists: false } }, { validFrom: null }, { validFrom: { $lte: now } }] },
        { $or: [{ validTo: { $exists: false } }, { validTo: null }, { validTo: { $gte: now } }] },
      ],
    }).sort({ priority: -1 }); // Priority order
    
    let bestResult: ValidationResult = { valid: false, message: 'No eligible auto coupons found' };
    let maxDiscount = -1;
    
    for (const coupon of coupons) {
      const res = await this.validate(coupon.code, userId, context);
      if (res.valid && res.discountAmount !== undefined && res.discountAmount > maxDiscount) {
        maxDiscount = res.discountAmount;
        bestResult = res;
      }
    }
    
    return bestResult;
  }
}
