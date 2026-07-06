import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { connectDB } from '../config/mongodb';
import { Order } from '../models/Order';
import { getIO } from '../lib/socket';
import { Cart } from '../models/Cart';
import { Coupon } from '../models/Coupon';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { CashbackCampaign } from '../models/CashbackCampaign';
import { CouponEngine } from '../services/couponEngine';
import { CouponUsage } from '../models/CouponUsage';
import { recordAnalytics } from './coupons.controller';

const ADMIN_ROLES = ['admin', 'store_manager', 'support_agent'];

export async function getOrders(req: Request, res: Response) {
  try {
    await connectDB();
    const orders = await Order.find({ user: req.user!.userId })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name images sku');

    return res.status(200).json({ orders });
  } catch (error) {
    console.error('GET orders error:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

export async function createOrder(req: Request, res: Response) {
  try {
    await connectDB();
    const body = req.body || {};
    const { deliveryAddress, paymentMethod, couponCode, walletUsed = 0, activateMembership } = body;

    if (!deliveryAddress) {
      return res.status(400).json({ error: 'Delivery address is required' });
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

    // Recalculate pricing server-side with business logic
    let subtotal = 0;
    let totalFittingCharge = 0;
    let onePlusOneDiscount = 0;
    let oneRupeeFramesUsed = 0;
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
      if (item.product?.oneRupeeFrameOffer && isMemberNow && !user.oneRupeeOfferUsed && oneRupeeFramesUsed < 2) {
        framePrice = 1;
        oneRupeeFramesUsed++;
        appliedOffers.push('₹1 Frame');
      } else if (item.product?.memberPrice && isMemberNow) {
        framePrice = item.product.memberPrice;
        appliedOffers.push('Member Price');
      } else if (item.product?.nonMemberPrice && !isMemberNow) {
        framePrice = item.product.nonMemberPrice;
      }

      // Collect buy1Get1 items
      if (item.product?.buy1Get1) {
        buy1Get1Items.push({ framePrice, lensPrice });
      }

      subtotal += (framePrice + lensPrice) * item.qty;
      totalFittingCharge += fittingCharge * item.qty;

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

    // Apply 1+1 Offer
    if (buy1Get1Items.length >= 2) {
      buy1Get1Items.sort((a, b) => (b.framePrice + b.lensPrice) - (a.framePrice + a.lensPrice));
      const lowestPriceItem = buy1Get1Items.reduce((lowest: any, current: any) => {
        const currentTotal = current.framePrice + (current.lensPrice || 0);
        const lowestTotal = lowest.framePrice + (lowest.lensPrice || 0);
        return currentTotal < lowestTotal ? current : lowest;
      });
      onePlusOneDiscount = lowestPriceItem.framePrice + (lowestPriceItem.lensPrice || 0);
    }

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
      const validationItems = cart.items.map((item: any) => ({
        productId: item.product?._id?.toString() || item.product?.toString(),
        qty: item.qty,
        price: item.product?.price?.selling ?? item.framePrice ?? 0,
        category: item.product?.category,
        brand: item.product?.brand,
      }));

      const validationContext = {
        cartTotal: subtotal + totalFittingCharge + deliveryCharge - onePlusOneDiscount,
        items: validationItems,
        paymentMethod,
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
        discount += valResult.discountAmount;
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
    });

    await order.save();

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

    // Clear cart
    cart.items = [] as typeof cart.items;
    cart.updatedAt = new Date();
    await cart.save();

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
      .populate('items.product', 'name images sku');

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
