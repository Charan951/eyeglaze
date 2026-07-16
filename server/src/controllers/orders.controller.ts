import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { connectDB } from '../config/mongodb';
import { Order } from '../models/Order';
import { getIO } from '../lib/socket';
import { Cart } from '../models/Cart';
import { Coupon } from '../models/Coupon';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Prescription } from '../models/Prescription';
import { CashbackCampaign } from '../models/CashbackCampaign';
import { CouponEngine } from '../services/couponEngine';
import { CouponUsage } from '../models/CouponUsage';
import { recordAnalytics, generateMemberCoupons } from './coupons.controller';

const ADMIN_ROLES = ['admin', 'store_manager', 'support_agent'];

export async function getOrders(req: Request, res: Response) {
  try {
    await connectDB();
    const orders = await Order.find({ user: req.user!.userId })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name images thumbnail sku');

    return res.status(200).json({ orders });
  } catch (error) {
    console.error('GET orders error:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

export async function createOrder(req: Request, res: Response) {
  try {
    await connectDB();
    // Ensure Product model is loaded and registered in Mongoose (prevents MissingSchemaError on populate)
    const _modelName = Product.modelName;
    const body = req.body || {};
    const { deliveryAddress, paymentMethod, couponCode, walletUsed = 0, activateMembership, applyBogo } = body;

    if (!deliveryAddress) {
      return res.status(400).json({ error: 'Delivery address is required' });
    }

    if (!deliveryAddress.fullName || !deliveryAddress.mobile || !deliveryAddress.alternativeNumber || !deliveryAddress.line1 || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.pincode) {
      return res.status(400).json({ error: 'All delivery address fields, including Alternative Number, are required' });
    }

    const user = await User.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const cart = await Cart.findOne({ user: req.user!.userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const isMemberNow = user.membershipActive || activateMembership;

    const previousOrderCount = await Order.countDocuments({
      user: req.user!.userId,
      status: { $ne: 'cancelled' }
    });

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

    // Recalculate pricing server-side with business logic
    let subtotal = 0;
    let totalFittingCharge = 0;
    let onePlusOneDiscount = 0;

    if (applyBogo && isMemberNow && bogoAllowedForMember) {
      const bogoItems: any[] = [];
      cart.items.forEach((item: any) => {
        if (item.product?.buy1Get1) {
          for (let index = 0; index < item.qty; index++) {
            const framePrice = item.product.memberPrice !== undefined && isMemberNow ? item.product.memberPrice : (item.product.price?.selling ?? 0);
            bogoItems.push({
              price: framePrice + (item.lensPrice || 0)
            });
          }
        }
      });
      if (bogoItems.length >= 2) {
        bogoItems.sort((a, b) => a.price - b.price);
        const freeQty = Math.floor(bogoItems.length / 2);
        for (let i = 0; i < freeQty; i++) {
          onePlusOneDiscount += bogoItems[i].price;
        }
      }
    }

    let oneRupeeFramesUsed = 0;
    const maxOneRupeeFramesThisOrder = Math.min(1, Math.max(0, 2 - (user.oneRupeeOfferCount ?? 0)));

    const totalBogoQty = 0;
    const isBogoActive = false;

    const buy1Get1Items: any[] = [];

    const orderItems = cart.items.map((item: any) => {
      let framePrice = item.product?.price?.selling ?? item.framePrice ?? 0;
      const lensPrice = item.lensPrice || 0;
      let fittingCharge = 0;
      const appliedOffers: string[] = [];

      // Apply fitting charge
      if (item.lensType) {
        fittingCharge = 99;
        const lensTypeLower = item.lensType.toLowerCase();
        const lensQualityLower = (item.lensQuality || '').toLowerCase();
        if (lensTypeLower.includes('progressive') || lensTypeLower.includes('non breakable') || lensQualityLower.includes('progressive') || lensQualityLower.includes('non breakable')) {
          fittingCharge = 199;
        }
      }

      // Check ₹1 Frame eligibility
      if (cart.items.length === 1 && !isBogoActive && item.product?.oneRupeeFrameOffer && isMemberNow && !user.oneRupeeOfferUsed && (user.oneRupeeOfferCount ?? 0) < 2 && oneRupeeFramesUsed < maxOneRupeeFramesThisOrder) {
        const allowed = Math.min(item.qty, maxOneRupeeFramesThisOrder - oneRupeeFramesUsed);
        const regularPrice = item.product?.memberPrice !== undefined ? item.product.memberPrice : (item.product?.price?.selling ?? item.framePrice ?? 0);
        const totalFramePriceForQty = (allowed * 1) + ((item.qty - allowed) * regularPrice);
        framePrice = totalFramePriceForQty / item.qty;
        oneRupeeFramesUsed += allowed;
        appliedOffers.push('₹1 Frame');
      } else if (item.product?.memberPrice && isMemberNow) {
        framePrice = item.product.memberPrice;
        appliedOffers.push('Member Price');
      } else if (item.product?.nonMemberPrice && !isMemberNow) {
        framePrice = item.product.nonMemberPrice;
      }

      // Automatic BOGO collection disabled (coupon voucher only)

      subtotal += (framePrice + lensPrice) * item.qty;

      return {
        product: item.product,
        qty: item.qty,
        color: item.color,
        frameSize: item.frameSize,
        lensType: item.lensType,
        lensSubType: item.lensSubType,
        power: item.power,
        lensQuality: item.lensQuality,
        lensPrice,
        framePrice,
        memberFramePrice: item.product?.memberPrice,
        fittingCharge,
        appliedOffers,
      };
    });

    // Calculate total fitting charge dynamically: 99 for one product with lens, 199 for more than one
    let lensItemsCount = 0;
    cart.items.forEach((item: any) => {
      if (item.lensType || (item.lensPrice && item.lensPrice > 0)) {
        lensItemsCount += item.qty;
      }
    });

    totalFittingCharge = lensItemsCount === 0 ? 0 : lensItemsCount === 1 ? 99 : 199;

    // Automatic 1+1 Offer discount disabled (coupon voucher only)

    // Shipping charges: members free
    const deliveryCharge = isMemberNow ? 0 : 99;
    
    // Add membership fee if selected and not yet a member
    let membershipFee = 0;
    if (activateMembership && !user.membershipActive) {
      membershipFee = 129;
    }

    let discount = onePlusOneDiscount;
    let couponData;

    // Apply coupon using validation engine
    if (couponCode) {
      if (oneRupeeFramesUsed > 0) {
        return res.status(400).json({ error: 'Standard coupons cannot be combined with the ₹1 Frame offer.' });
      }
      const validationItems = orderItems.map((item: any) => ({
        productId: item.product?._id?.toString() || item.product?.toString(),
        qty: item.qty,
        price: item.framePrice + (item.lensPrice || 0),
        category: item.product?.category,
        brand: item.product?.brand,
        buy1Get1: item.product?.buy1Get1 || false,
      }));

      const validationContext = {
        cartTotal: subtotal + totalFittingCharge + deliveryCharge - onePlusOneDiscount,
        items: validationItems,
        paymentMethod,
        addGoldMembership: activateMembership,
        location: {
          country: 'India',
          state: deliveryAddress.state,
          city: deliveryAddress.city,
        },
        shippingCost: deliveryCharge,
      };

      const valResult = await CouponEngine.validate(couponCode, req.user!.userId, validationContext);
      if (!valResult.valid) {
        return res.status(400).json({ error: valResult.message });
      }

      if (valResult.valid && valResult.discountAmount) {
        if (valResult.coupon?.discountType === 'bogo') {
          discount = valResult.discountAmount; // avoid double discounting, use coupon's BOGO discount
        } else {
          discount += valResult.discountAmount;
        }
        couponData = {
          code: valResult.coupon!.code,
          discountType: valResult.coupon!.discountType,
          discountValue: valResult.coupon!.discountValue,
          amountSaved: valResult.discountAmount,
        };
      }
    }

    // Apply wallet
    const totalWithoutWallet = subtotal + totalFittingCharge + deliveryCharge + membershipFee - discount;
    const walletToUse = Math.min(walletUsed || 0, user.walletBalance || 0, Math.max(0, totalWithoutWallet));
    const total = Math.max(0, totalWithoutWallet - walletToUse);

    const count = await Order.countDocuments();
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
      date.getDate()
    ).padStart(2, '0')}`;
    const orderId = `EGO-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    const estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    const order = new Order({
      orderNumber: orderId,
      orderId,
      user: user._id,
      items: orderItems,
      address: deliveryAddress,
      subtotal,
      deliveryCharge,
      fittingCharge: totalFittingCharge,
      discount,
      walletUsed: walletToUse,
      total,
      coupon: couponData,
      paymentMethod,
      paymentStatus: 'paid', // stub
      status: 'pending',
      statusHistory: [{ status: 'pending', timestamp: new Date() }],
      estimatedDelivery,
      membershipAdded: activateMembership && !user.membershipActive,
      bogoApplied: onePlusOneDiscount > 0 || (couponData && couponData.discountType === 'bogo'),
    });

    await order.save();

    // Auto-save prescriptions from order items to user's saved prescriptions
    try {
      for (const item of orderItems) {
        if (item.power && (item.power.RE || item.power.LE)) {
          // Check if user already has a saved prescription with the exact same power values
          const existingPresc = await Prescription.findOne({
            user: user._id,
            'RE.sph': item.power.RE?.sph,
            'RE.cyl': item.power.RE?.cyl,
            'RE.axis': item.power.RE?.axis,
            'LE.sph': item.power.LE?.sph,
            'LE.cyl': item.power.LE?.cyl,
            'LE.axis': item.power.LE?.axis,
          });

          if (!existingPresc) {
            const newPresc = new Prescription({
              user: user._id,
              name: item.power.name || `Order ${orderId}`,
              RE: item.power.RE,
              LE: item.power.LE,
              pd: item.power.pd || (item.power.RE?.pd ? (item.power.RE.pd + (item.power.LE?.pd || 0)) : undefined),
              verificationStatus: 'verified',
              verified: true,
            });
            await newPresc.save();

            await User.findByIdAndUpdate(user._id, {
              $addToSet: { savedPrescriptions: newPresc._id }
            });
          }
        }
      }
    } catch (prescErr) {
      console.error('Failed to auto-save prescription on order placement:', prescErr);
    }

    // Auto-save address to user's saved addresses if not already exists
    try {
      const addressExists = user.addresses.some((addr: any) => 
        addr.line1.toLowerCase().trim() === deliveryAddress.line1.toLowerCase().trim() &&
        addr.pincode.trim() === deliveryAddress.pincode.trim() &&
        addr.fullName.toLowerCase().trim() === deliveryAddress.fullName.toLowerCase().trim()
      );

      if (!addressExists) {
        const hasDefault = user.addresses.some((addr: any) => addr.isDefault);
        const newAddress = {
          fullName: deliveryAddress.fullName,
          mobile: deliveryAddress.mobile,
          alternativeNumber: deliveryAddress.alternativeNumber,
          pincode: deliveryAddress.pincode,
          line1: deliveryAddress.line1,
          line2: deliveryAddress.line2 || undefined,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          type: 'Home',
          isDefault: !hasDefault
        };
        
        await User.findByIdAndUpdate(user._id, {
          $push: { addresses: newAddress }
        });
      }
    } catch (addrErr) {
      console.error('Failed to auto-save address on checkout:', addrErr);
    }

    try {
      getIO().emit('order_changed', { action: 'create', order });
    } catch (err) {
      console.error('Socket emit error:', err);
    }

    // Track coupon usage and update used counts
    if (couponCode && couponData) {
      const couponObj = await Coupon.findOne({ code: couponCode.toUpperCase(), isDeleted: false });
      if (couponObj) {
        const usage = new CouponUsage({
          couponId: couponObj._id,
          userId: req.user!.userId,
          orderId: orderId,
          orderObjectId: order._id,
          discountApplied: couponData.amountSaved,
          transactionAmount: total,
          status: 'applied',
        });
        await usage.save();

        await Coupon.findByIdAndUpdate(couponObj._id, { $inc: { usedCount: 1 } });
        
        await recordAnalytics(couponObj._id.toString(), couponObj.code, 'usage', {
          revenue: total,
          discount: couponData.amountSaved,
        });
      }
    }

    // Update user: deduct wallet, update ₹1 Frame usage, activate membership
    const updateUser: any = {};
    if (walletToUse > 0) {
      updateUser.$inc = { walletBalance: -walletToUse };
    }
    if (oneRupeeFramesUsed > 0) {
      if (!updateUser.$inc) updateUser.$inc = {};
      updateUser.$inc.oneRupeeOfferCount = oneRupeeFramesUsed;
      if ((user.oneRupeeOfferCount ?? 0) + oneRupeeFramesUsed >= 2) {
        updateUser.oneRupeeOfferUsed = true;
      }
    }

    if (activateMembership && !user.membershipActive) {
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);
      updateUser.membershipActive = true;
      updateUser.membershipExpiry = expiry;
      try {
        await generateMemberCoupons(user._id);
      } catch (err) {
        console.error('Failed to generate member coupons on checkout:', err);
      }
    }

    if (walletToUse > 0) {
      if (!updateUser.$push) updateUser.$push = {};
      updateUser.$push.transactions = {
        type: 'Order',
        amount: -walletToUse,
        date: new Date(),
        description: `Order ${orderId}`
      };
    }

    if (Object.keys(updateUser).length > 0 || (activateMembership && !user.membershipActive)) {
      await User.findByIdAndUpdate(user._id, updateUser);
    }

    // Apply cashback campaigns
    const activeCampaigns = await CashbackCampaign.find({
      isActive: true,
      $and: [
        {
          $or: [
            { validFrom: { $lte: new Date() } },
            { validFrom: null }
          ]
        },
        {
          $or: [
            { validTo: { $gte: new Date() } },
            { validTo: null }
          ]
        }
      ]
    }).sort({ sortOrder: 1 });

    if (activeCampaigns.length > 0) {
      // Find first campaign that meets min order value
      const eligibleCampaign = activeCampaigns.find((campaign: any) => 
        total >= campaign.minOrderValue && 
        (!campaign.usageLimitTotal || campaign.usedCount < campaign.usageLimitTotal)
      );

      if (eligibleCampaign) {
        // Credit cashback
        await User.findByIdAndUpdate(user._id, {
          $inc: { walletBalance: eligibleCampaign.cashbackAmount },
          $push: {
            transactions: {
              type: 'Cashback',
              amount: eligibleCampaign.cashbackAmount,
              date: new Date(),
              description: `Cashback for order ${orderId}`
            }
          }
        });
        await CashbackCampaign.findByIdAndUpdate(eligibleCampaign._id, { $inc: { usedCount: 1 } });
      }
    }

    cart.items = [] as typeof cart.items;
    cart.updatedAt = new Date();
    await cart.save();
    try {
      getIO().to(`user-${req.user!.userId}`).emit('cart_changed', { action: 'clear' });
    } catch (err) {
      console.error('Socket emit error:', err);
    }

    return res.status(201).json({ orderId, total, estimatedDelivery, walletUsed: walletToUse });
  } catch (error) {
    console.error('POST orders error:', error);
    return res.status(500).json({ error: 'Failed to create order' });
  }
}

export async function getOrderById(req: Request, res: Response) {
  try {
    await connectDB();
    const { id } = req.params;
    const orderIdStr = id as string;

    const query: Record<string, any> = {};
    if (mongoose.Types.ObjectId.isValid(orderIdStr)) {
      query.$or = [{ _id: orderIdStr }, { orderId: orderIdStr }, { orderNumber: orderIdStr }];
    } else {
      query.$or = [{ orderId: orderIdStr }, { orderNumber: orderIdStr }];
    }

    const order = await Order.findOne(query)
      .populate('user', 'name email mobile phone')
      .populate('items.product', 'name images thumbnail sku');

    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.user._id.toString() !== req.user!.userId && !ADMIN_ROLES.includes(req.user!.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error('GET order error:', error);
    return res.status(500).json({ error: 'Failed to fetch order' });
  }
}
