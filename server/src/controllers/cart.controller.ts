import { Request, Response } from 'express';
import { connectDB } from '../config/mongodb';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { Coupon } from '../models/Coupon';
import { Order } from '../models/Order';
import { getIO } from '../lib/socket';

export async function getCart(req: Request, res: Response) {
  try {
    await connectDB();
    const cart = await Cart.findOne({ user: req.user!.userId }).populate(
      'items.product',
      'name images thumbnail price sku frame colors memberPrice nonMemberPrice buy1Get1 oneRupeeFrameOffer'
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

    // Check if user already had a BOGO order this calendar month
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

    const bogoAllowedForMember = !bogoOrderThisMonth;

    // Calculate if BOGO is active (has >= 2 BOGO-eligible items)
    const totalBogoQty = cart.items.reduce((sum: number, item: any) => 
      (bogoAllowedForMember && isMemberNow && item.product?.buy1Get1) ? sum + item.qty : sum, 
      0
    );
    const isBogoActive = totalBogoQty >= 2;

    // Process cart items with business logic
    let oneRupeeFramesApplied = 0;
    const remainingOneRupeeFrames = Math.max(0, 2 - (user?.oneRupeeOfferCount ?? 0));

    const processedItems = cart.items.map((item: any) => {
      let framePrice = item.product?.price?.selling ?? item.framePrice ?? 0;
      let appliedOffers: string[] = [];
      let isOneRupeeFrame = false;

      // Check ₹1 Frame eligibility
      if (!isBogoActive && item.product?.oneRupeeFrameOffer && isMemberNow && !user?.oneRupeeOfferUsed && (user?.oneRupeeOfferCount ?? 0) < 2 && oneRupeeFramesApplied < remainingOneRupeeFrames) {
        const allowed = Math.min(item.qty, remainingOneRupeeFrames - oneRupeeFramesApplied);
        const regularPrice = item.product?.memberPrice !== undefined ? item.product.memberPrice : (item.product?.price?.selling ?? item.framePrice ?? 0);
        const totalFramePriceForQty = (allowed * 1) + ((item.qty - allowed) * regularPrice);
        framePrice = totalFramePriceForQty / item.qty;
        oneRupeeFramesApplied += allowed;
        isOneRupeeFrame = true;
        appliedOffers.push('₹1 Frame');
      } else if (item.product?.memberPrice && user?.membershipActive) {
        framePrice = item.product.memberPrice;
        appliedOffers.push('Member Price');
      } else if (item.product?.nonMemberPrice && !user?.membershipActive) {
        framePrice = item.product.nonMemberPrice;
      }

      return {
        ...item.toObject(),
        framePrice,
        memberFramePrice: item.product?.memberPrice,
        appliedOffers,
        isOneRupeeFrame
      };
    });

    // Check 1+1 Offer
    let onePlusOneDiscount = 0;

    const buy1Get1Items: any[] = [];
    processedItems.forEach((item: any) => {
      if (bogoAllowedForMember && isMemberNow && item.product?.buy1Get1) {
        for (let i = 0; i < item.qty; i++) {
          buy1Get1Items.push(item);
        }
      }
    });

    if (buy1Get1Items.length >= 2) {
      // Sort by price (descending) to get the highest price first
      buy1Get1Items.sort((a: any, b: any) => (b.framePrice + b.lensPrice) - (a.framePrice + a.lensPrice));
      // The second item is free (or get the lowest price item free)
      const lowestPriceItem = buy1Get1Items.reduce((lowest: any, current: any) => {
        const currentTotal = current.framePrice + (current.lensPrice || 0);
        const lowestTotal = lowest.framePrice + (lowest.lensPrice || 0);
        return currentTotal < lowestTotal ? current : lowest;
      });
      onePlusOneDiscount = lowestPriceItem.framePrice + (lowestPriceItem.lensPrice || 0);
      
      const targetItem = processedItems.find((item: any) => 
        (item.product?._id || item.product?.id || '').toString() === (lowestPriceItem.product?._id || lowestPriceItem.product?.id || '').toString()
      );
      if (targetItem) {
        if (!targetItem.appliedOffers) targetItem.appliedOffers = [];
        if (!targetItem.appliedOffers.includes('1+1 Offer')) {
          targetItem.appliedOffers.push('1+1 Offer');
        }
      }
    }

    // Calculate totals
    let subtotal = 0;
    let totalDeliveryCharge = 0;

    processedItems.forEach((item: any) => {
      subtotal += (item.framePrice + (item.lensPrice || 0)) * item.qty;
      totalDeliveryCharge += (item.deliveryCharge || (user?.membershipActive ? 0 : 99)) * item.qty;
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
    totalDeliveryCharge = user?.membershipActive ? 0 : 99;

    const cartWithOffers = {
      ...cart.toObject(),
      items: processedItems,
      subtotal,
      totalFittingCharge,
      totalDeliveryCharge,
      onePlusOneDiscount,
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
    const { productId, color, qty = 1, lens, forceNew = false } = body;

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

    if (existingIdx >= 0) {
      cart.items[existingIdx].qty += qty;
    } else {
      const newItem = {
        product: productId,
        qty,
        color,
        framePrice: product.price?.selling || 1,
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
