import { Request, Response } from 'express';
import { connectDB } from '../config/mongodb';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { Coupon } from '../models/Coupon';
import { Order } from '../models/Order';
import { getIO } from '../lib/socket';
import { isContactLensProduct, isFrameProduct, isMonthlyContactLens } from '../lib/productType';

export async function getCart(req: Request, res: Response) {
  try {
    await connectDB();
    const cart = await Cart.findOne({ user: req.user!.userId }).populate(
      'items.product',
      'name images thumbnail price sku frame colors memberPrice memberPrices nonMemberPrice buy1Get1 oneRupeeFrameOffer oneRupeeOfferConditions category subCategory subSubCategory subSubSubCategory solutionVariants isLensSolution linkedSolutions'
    );

    if (!cart) {
      return res.status(200).json({ cart: { items: [], total: 0 } });
    }

    // Fetch user for eligibility checks
    const user = await User.findById(req.user!.userId);
    const previousOrderCount = user ? await Order.countDocuments({
      user: req.user!.userId,
      status: { $ne: 'cancelled' }
    }) : 0;

    // Check 1+1 Offer eligibility
    const isMemberNow = user?.membershipActive || cart.addGoldMembership;

    // Check if user already had a BOGO/1+1 order this calendar month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const bogoOrderThisMonth = await Order.findOne({
      user: req.user!.userId,
      bogoApplied: true,
      createdAt: { $gte: startOfMonth },
      status: { $ne: 'cancelled' },
      paymentStatus: { $ne: 'failed' }
    });

    // Reused as the general "once per month" limit for the frame 1+1 offer too,
    // per the client's "1+1 usable once a month" rule — same underlying tracking.
    const bogoAllowedForMember = !bogoOrderThisMonth;

    // No coupon stacking with the ₹1 frame offer: if a coupon is currently applied
    // to the cart, the ₹1 frame price must not also apply.
    const hasCouponApplied = !!cart.couponCode;

    // Process cart items with business logic
    let oneRupeeFramesApplied = 0;
    const remainingOneRupeeFrames = Math.max(0, 2 - (user?.oneRupeeOfferCount ?? 0));
    const now = new Date();

    const processedItems = cart.items.map((item: any) => {
      // Items with a lensType (contact lenses, or a frame's lens payload) store their own
      // authoritative framePrice at add-time (0 for contact lenses, since the box price is
      // carried entirely in lensPrice). Only plain frame items re-sync to the live product
      // price here, so eyeglass pricing always reflects the current catalog price.
      let framePrice = (item.priceLocked || item.lensType) ? (item.framePrice ?? 0) : (item.product?.price?.selling ?? item.framePrice ?? 0);
      let appliedOffers: string[] = [];
      let isOneRupeeFrame = false;
      let offerType: 'oneRupeeFrame' | 'buy1Get1' | 'freeGift' | 'none' = 'none';
      let discountApplied = 0;

      const effectiveMemberPrice = item.product?.memberPrice !== undefined ? item.product.memberPrice : item.product?.memberPrices?.goldMemberPrice;

      // ₹1 Frame offer conditions (Product.oneRupeeOfferConditions, admin-configured):
      const conditions = item.product?.oneRupeeOfferConditions;
      const conditionsOk = !conditions || (
        (!conditions.premiumLensRequired || !!item.lensType) &&
        (!conditions.campaignStartDate || new Date(conditions.campaignStartDate) <= now) &&
        (!conditions.campaignEndDate || new Date(conditions.campaignEndDate) >= now)
      );
      // Compulsory condition (client rule): a lens must be added to the frame for the
      // ₹1 price to apply — a bare frame with no lens does not qualify.
      const hasLens = !!item.lensType;
      const maxUsageAllowed = conditions?.maxUsage ?? 2;

      // Check ₹1 Frame eligibility
      if (
        !item.priceLocked &&
        !hasCouponApplied &&
        hasLens &&
        conditionsOk &&
        item.product?.oneRupeeFrameOffer &&
        isMemberNow &&
        !user?.oneRupeeOfferUsed &&
        (user?.oneRupeeOfferCount ?? 0) < maxUsageAllowed &&
        oneRupeeFramesApplied < remainingOneRupeeFrames
      ) {
        const allowed = Math.min(item.qty, remainingOneRupeeFrames - oneRupeeFramesApplied);
        const regularPrice = effectiveMemberPrice !== undefined ? effectiveMemberPrice : (item.product?.price?.selling ?? item.framePrice ?? 0);
        const totalFramePriceForQty = (allowed * 1) + ((item.qty - allowed) * regularPrice);
        discountApplied = (regularPrice - 1) * allowed;
        framePrice = totalFramePriceForQty / item.qty;
        oneRupeeFramesApplied += allowed;
        isOneRupeeFrame = true;
        offerType = 'oneRupeeFrame';
        appliedOffers.push('₹1 Frame');
      } else if (!item.priceLocked && effectiveMemberPrice !== undefined && isMemberNow) {
        framePrice = effectiveMemberPrice;
        appliedOffers.push('Member Price');
      } else if (!item.priceLocked && item.product?.nonMemberPrice !== undefined && !isMemberNow) {
        framePrice = item.product.nonMemberPrice;
      }

      return {
        ...item.toObject(),
        framePrice,
        memberFramePrice: effectiveMemberPrice,
        appliedOffers,
        isOneRupeeFrame,
        offerType,
        discountApplied,
        isFreeItem: false
      };
    });

    // Real 1+1 (Buy-1-Get-1) engine: applies automatically (no coupon code needed) to
    // frame products flagged Product.buy1Get1, excluding contact lenses and anything
    // already on the ₹1 frame offer. Once per calendar month (bogoAllowedForMember).
    // NOTE: the client's minimum-order-value condition for this offer is deliberately
    // left UNENFORCED pending separate clarification from the client.
    let onePlusOneDiscount = 0;
    let onePlusOneApplied = false;
    if (bogoAllowedForMember) {
      type Unit = { idx: number; price: number };
      const units: Unit[] = [];
      processedItems.forEach((item: any, idx: number) => {
        if (item.isOneRupeeFrame || item.priceLocked) return;
        if (!item.product?.buy1Get1) return;
        if (!isFrameProduct(item.product) || isContactLensProduct(item.product)) return;
        for (let i = 0; i < item.qty; i++) {
          units.push({ idx, price: item.framePrice });
        }
      });

      if (units.length >= 2) {
        // Cheaper unit in each pair is free, standard BOGO convention.
        units.sort((a, b) => a.price - b.price);
        const freeUnitsCount = Math.floor(units.length / 2);
        const freeUnits = units.slice(0, freeUnitsCount);
        freeUnits.forEach((u) => {
          onePlusOneDiscount += u.price;
          const item: any = processedItems[u.idx];
          item.discountApplied = (item.discountApplied || 0) + u.price;
          item.offerType = 'buy1Get1';
          if (!item.appliedOffers.includes('1+1 Offer')) item.appliedOffers.push('1+1 Offer');
        });
        onePlusOneApplied = freeUnitsCount > 0;
      }
    }

    // Free contact-lens solution bundle: a monthly contact lens purchased together with
    // a lens (i.e. an actual buy, not just browsing) earns one free solution line, linked
    // back to the lens cart item it was bundled with.
    processedItems.forEach((item: any) => {
      if (isMonthlyContactLens(item.product) && item.lensType && !item.linkedToCartItemId) {
        // Solution is represented as a display-only free-gift flag on the qualifying
        // lens line itself (no separate solution product exists in every catalog, and
        // the frontend/mobile already render a "Free Solution" badge off appliedOffers).
        if (!item.appliedOffers.includes('Free Solution Bundle')) {
          item.appliedOffers.push('Free Solution Bundle');
        }
      }
    });

    // Calculate totals
    let subtotal = 0;
    let totalDeliveryCharge = 0;

    processedItems.forEach((item: any) => {
      subtotal += (item.framePrice + (item.lensPrice || 0)) * item.qty;
      totalDeliveryCharge += (item.deliveryCharge || (isMemberNow ? 0 : 99)) * item.qty;
    });

    // Calculate total fitting charge dynamically: 99 for one product with lens, 199 for more than one
    let lensItemsCount = 0;
    processedItems.forEach((item: any) => {
      const hasLens = item.lensType || (item.lensPrice && item.lensPrice > 0);
      if (hasLens) {
        lensItemsCount += item.qty;
      }
    });

    const totalFittingCharge = lensItemsCount === 0 ? 0 : lensItemsCount === 1 ? 99 : 199;

    // Delivery charge: members free, non-members 99 (one charge per order, not per item)
    totalDeliveryCharge = isMemberNow ? 0 : 99;

    const cartWithOffers = {
      ...cart.toObject(),
      items: processedItems,
      subtotal,
      totalFittingCharge,
      totalDeliveryCharge,
      onePlusOneDiscount,
      onePlusOneApplied,
      total: Math.max(0, subtotal + totalFittingCharge + totalDeliveryCharge - onePlusOneDiscount),
      hasUsedBogoThisMonth: !bogoAllowedForMember
    };

    return res.status(200).json({ cart: cartWithOffers });
  } catch (error) {
    console.error('GET cart error:', error);
    return res.status(500).json({ error: 'Failed to fetch cart' });
  }
}

export async function addToCart(req: Request, res: Response) {
  try {
    await connectDB();
    const body = req.body || {};
    const { productId, color, qty = 1, lens, forceNew = false, priceOverride } = body;
    const originalPrice = typeof body.originalPrice === 'number' ? body.originalPrice : undefined;

    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const user = await User.findById(req.user!.userId);
    let cart = await Cart.findOne({ user: req.user!.userId });
    if (!cart) {
      cart = new Cart({ user: req.user!.userId, items: [] });
    }

    const existingIdx = forceNew
      ? -1
      : cart.items.findIndex(
          (item: any) =>
            item.product.toString() === productId &&
            item.color === color &&
            item.lensType === (lens?.lensType || null)
        );

    // Fitting Charge Engine
    let fittingCharge = 0;
    if (lens) {
      fittingCharge = 99; // Base for any frame with lens
      const lensType = lens.lensType?.toLowerCase() || '';
      const lensQuality = lens.lensQuality?.toLowerCase() || '';
      const lensSubType = lens.lensSubType?.toLowerCase() || '';
      
      // Progressive or Non Breakable lens → ₹199
      if (
        lensType.includes('progressive') ||
        lensType.includes('non breakable') ||
        lensType.includes('non-breakable') ||
        lensQuality.includes('progressive') ||
        lensQuality.includes('non breakable') ||
        lensQuality.includes('non-breakable') ||
        lensSubType.includes('progressive') ||
        lensSubType.includes('non breakable') ||
        lensSubType.includes('non-breakable')
      ) {
        fittingCharge = 199;
      }
    }

    const hasPriceOverride = typeof priceOverride === 'number' && priceOverride >= 0;

    if (existingIdx >= 0) {
      cart.items[existingIdx].qty += qty;
      if (hasPriceOverride) {
        cart.items[existingIdx].framePrice = priceOverride;
        cart.items[existingIdx].priceLocked = true;
        if (originalPrice !== undefined) {
          cart.items[existingIdx].originalPrice = originalPrice;
        }
      }
    } else {
      const newItem = {
        product: productId,
        qty,
        color,
        framePrice: hasPriceOverride ? priceOverride : (product.price?.selling || 1),
        priceLocked: hasPriceOverride || !!lens,
        originalPrice: hasPriceOverride ? (originalPrice ?? product.price?.selling) : undefined,
        memberFramePrice: product.memberPrice,
        fittingCharge,
        deliveryCharge: user?.membershipActive ? 0 : 99,
        ...(lens || {}),
      };
      cart.items.push(newItem);
    }

    cart.updatedAt = new Date();
    await cart.save();
    try {
      getIO().to(`user-${req.user!.userId}`).emit('cart_changed', { action: 'add', cart });
    } catch (err) {
      console.error('Socket emit error:', err);
    }

    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error('POST cart error:', error);
    return res.status(500).json({ error: 'Failed to add to cart' });
  }
}

export async function updateCartItem(req: Request, res: Response) {
  try {
    await connectDB();
    const { itemId } = req.params;
    const body = req.body || {};
    const { qty } = body;

    const cart = await Cart.findOne({ user: req.user!.userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    if (qty <= 0) {
      cart.items = cart.items.filter(
        (item: { _id?: { toString(): string } }) => item._id?.toString() !== itemId
      ) as typeof cart.items;
    } else {
      const item = cart.items.find((item: any) => item._id?.toString() === itemId);
      if (!item) return res.status(404).json({ error: 'Item not found' });
      item.qty = qty;
    }

    cart.updatedAt = new Date();
    await cart.save();
    try {
      getIO().to(`user-${req.user!.userId}`).emit('cart_changed', { action: 'update', cart });
    } catch (err) {
      console.error('Socket emit error:', err);
    }
    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error('PUT cart item error:', error);
    return res.status(500).json({ error: 'Failed to update cart item' });
  }
}

export async function removeCartItem(req: Request, res: Response) {
  try {
    await connectDB();
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user!.userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    cart.items = cart.items.filter(
      (item: { _id?: { toString(): string } }) => item._id?.toString() !== itemId
    ) as typeof cart.items;
    cart.updatedAt = new Date();
    await cart.save();
    try {
      getIO().to(`user-${req.user!.userId}`).emit('cart_changed', { action: 'remove' });
    } catch (err) {
      console.error('Socket emit error:', err);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('DELETE cart item error:', error);
    return res.status(500).json({ error: 'Failed to remove cart item' });
  }
}

export async function applyCoupon(req: Request, res: Response) {
  try {
    await connectDB();
    const { code, cartTotal } = req.body || {};

    if (!code) return res.status(200).json({ valid: false, message: 'Coupon code required' });

    // No coupon stacking with the ₹1 frame offer: if the current cart pricing has a
    // ₹1-priced frame in it, coupons cannot be applied on top of it.
    const existingCart = await Cart.findOne({ user: req.user?.userId }).populate(
      'items.product',
      'oneRupeeFrameOffer'
    );
    const hasOneRupeeFrameInCart = !!existingCart?.items?.some(
      (item: any) => !item.priceLocked && item.lensType && item.product?.oneRupeeFrameOffer
    );
    if (hasOneRupeeFrameInCart) {
      return res.status(200).json({
        valid: false,
        message: 'Coupons cannot be combined with the ₹1 Frame offer.',
      });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return res.status(200).json({ valid: false, message: 'Invalid coupon code' });

    // Check userSpecific
    if (coupon.userSpecific && coupon.userSpecific.toString() !== req.user?.userId) {
      return res.status(200).json({ valid: false, message: 'This coupon is not valid for you' });
    }

    const now = new Date();
    if (coupon.validFrom && coupon.validFrom > now) {
      return res.status(200).json({ valid: false, message: 'Coupon not yet active' });
    }
    const expiryDate = coupon.validTo || coupon.expiresAt;
    if (expiryDate && expiryDate < now) {
      return res.status(200).json({ valid: false, message: 'Coupon has expired' });
    }

    if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
      return res.status(200).json({
        valid: false,
        message: `Minimum order value of ₹${coupon.minOrderValue} required`,
      });
    }

    if (coupon.usageLimitTotal && coupon.usedCount >= coupon.usageLimitTotal) {
      return res.status(200).json({ valid: false, message: 'Coupon usage limit exceeded' });
    }

    let discount = 0;
    if (coupon.discountType === 'percent') {
      discount = (cartTotal * coupon.discountValue) / 100;
      const cap = coupon.maxDiscount || coupon.maxDiscountCap;
      if (cap) discount = Math.min(discount, cap);
    } else {
      discount = coupon.discountValue;
    }

    return res.status(200).json({
      valid: true,
      discount: Math.round(discount),
      message: `Coupon applied! You save ₹${Math.round(discount)}`,
    });
  } catch (error) {
    console.error('apply-coupon error:', error);
    return res.status(500).json({ error: 'Failed to validate coupon' });
  }
}

// "Take only 1 → get a coupon" conversion flow (client rule 4): instead of taking the
// free second unit of a 1+1-eligible frame, the customer can keep just 1 and receive a
// coupon worth what they paid for it, valid 30 days, redeemable for exactly one frame.
export async function convertBuy1Get1ToCoupon(req: Request, res: Response) {
  try {
    await connectDB();
    const { itemId } = req.body || {};
    if (!itemId) return res.status(400).json({ error: 'itemId is required' });

    const cart = await Cart.findOne({ user: req.user!.userId }).populate('items.product');
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const item: any = cart.items.find((i: any) => i._id?.toString() === itemId);
    if (!item) return res.status(404).json({ error: 'Cart item not found' });

    if (!item.product?.buy1Get1 || !isFrameProduct(item.product) || isContactLensProduct(item.product)) {
      return res.status(400).json({ error: 'This item is not eligible for the 1+1 offer' });
    }
    if (item.qty < 2) {
      return res.status(400).json({ error: 'Add 2 of this item to convert the free unit into a coupon' });
    }

    const value = Math.round(item.framePrice);
    // Keep only 1 unit — the "free" unit is given up in exchange for the coupon.
    item.qty -= 1;
    cart.updatedAt = new Date();
    await cart.save();

    const code = `FRAME1${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const validTo = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const coupon = new Coupon({
      code,
      name: 'Take 1, Get a Frame Coupon',
      description: `Redeemable for one frame up to ₹${value}, in place of the free unit from a 1+1 offer.`,
      discountType: 'flat',
      discountValue: value,
      maxDiscount: value,
      maxDiscountCap: value,
      maxOrderValue: value,
      validFrom: new Date(),
      validTo,
      expiresAt: validTo,
      isActive: true,
      autoApply: false,
      stackable: false,
      exclusive: true,
      usageLimitPerUser: 1,
      usageLimitTotal: 1,
      userSpecific: req.user!.userId,
      tags: ['take1-conversion', 'frame-only'],
    });
    await coupon.save();

    try {
      getIO().to(`user-${req.user!.userId}`).emit('cart_changed', { action: 'update', cart });
    } catch (err) {
      console.error('Socket emit error:', err);
    }

    return res.status(200).json({ success: true, cart, coupon: { code: coupon.code, value, validTo } });
  } catch (error) {
    console.error('convert-to-coupon error:', error);
    return res.status(500).json({ error: 'Failed to convert offer to coupon' });
  }
}

export async function toggleMembership(req: Request, res: Response) {
  try {
    await connectDB();
    const body = req.body || {};
    const { addGoldMembership } = body;

    let cart = await Cart.findOne({ user: req.user!.userId });
    if (!cart) {
      cart = new Cart({ user: req.user!.userId, items: [], addGoldMembership: false });
    }

    cart.addGoldMembership = !!addGoldMembership;
    cart.updatedAt = new Date();
    await cart.save();

    try {
      getIO().to(`user-${req.user!.userId}`).emit('cart_changed', { action: 'update', cart });
    } catch (err) {
      console.error('Socket emit error:', err);
    }

    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error('Toggle membership error:', error);
    return res.status(500).json({ error: 'Failed to update membership status in cart' });
  }
}
