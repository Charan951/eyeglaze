import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { connectDB } from '../config/mongodb';
import { Order } from '../models/Order';
import { Cart } from '../models/Cart';
import { Coupon } from '../models/Coupon';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { CashbackCampaign } from '../models/CashbackCampaign';

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
    const { deliveryAddress, paymentMethod, couponCode, walletUsed = 0 } = body;

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
      if (item.product?.oneRupeeFrameOffer && user.membershipActive && !user.oneRupeeOfferUsed && oneRupeeFramesUsed < 2) {
        framePrice = 1;
        oneRupeeFramesUsed++;
        appliedOffers.push('₹1 Frame');
      } else if (item.product?.memberPrice && user.membershipActive) {
        framePrice = item.product.memberPrice;
        appliedOffers.push('Member Price');
      } else if (item.product?.nonMemberPrice && !user.membershipActive) {
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
    const deliveryCharge = user.membershipActive ? 0 : 99;
    let discount = onePlusOneDiscount;
    let couponData;

    // Apply coupon
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        // Check user specific coupon
        if (coupon.userSpecific && coupon.userSpecific.toString() !== user._id.toString()) {
          // Invalid coupon for user
        } else {
          const orderTotal = subtotal + totalFittingCharge + deliveryCharge - onePlusOneDiscount;
          let couponDiscount = 0;
          if (coupon.discountType === 'percent') {
            couponDiscount = (orderTotal * coupon.discountValue) / 100;
            const cap = coupon.maxDiscount || coupon.maxDiscountCap;
            if (cap) couponDiscount = Math.min(couponDiscount, cap);
          } else {
            couponDiscount = coupon.discountValue;
          }
          couponDiscount = Math.round(couponDiscount);
          discount += couponDiscount;
          couponData = {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            amountSaved: couponDiscount,
          };
          await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
        }
      }
    }

    // Apply wallet
    const walletToUse = Math.min(walletUsed || 0, user.walletBalance || 0, Math.max(0, subtotal + totalFittingCharge + deliveryCharge - discount));
    const total = Math.max(0, subtotal + totalFittingCharge + deliveryCharge - discount - walletToUse);

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
    });

    await order.save();

    // Update user: deduct wallet, update ₹1 Frame usage
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
      // Add wallet transaction
      if (!updateUser.$push) updateUser.$push = {};
      updateUser.$push.transactions = {
        type: 'Order',
        amount: -walletToUse,
        date: new Date(),
        description: `Order ${orderId}`
      };
    }
    if (Object.keys(updateUser).length > 0) {
      await User.findByIdAndUpdate(user._id, updateUser);
    }

    // Apply cashback campaigns
    const activeCampaigns = await CashbackCampaign.find({
      isActive: true,
      $or: [
        { validFrom: { $lte: new Date() } },
        { validFrom: null }
      ],
      $or: [
        { validTo: { $gte: new Date() } },
        { validTo: null }
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
