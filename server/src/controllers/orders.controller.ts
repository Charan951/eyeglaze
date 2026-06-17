import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { connectDB } from '../config/mongodb';
import { Order } from '../models/Order';
import { Cart } from '../models/Cart';
import { Coupon } from '../models/Coupon';
import { User } from '../models/User';
import { Product } from '../models/Product';

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
    const { deliveryAddress, paymentMethod, couponCode } = body;

    if (!deliveryAddress) {
      return res.status(400).json({ error: 'Delivery address is required' });
    }

    const cart = await Cart.findOne({ user: req.user!.userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Recalculate pricing server-side
    let subtotal = 0;
    let totalFittingCharge = 0;

    const orderItems = cart.items.map((item: any) => {
      const framePrice = item.product?.price?.selling ?? item.framePrice ?? 0;
      const lensPrice = item.lensPrice || 0;
      const fittingCharge = item.lensType ? 199 : 0;
      subtotal += (framePrice + lensPrice) * item.qty;
      totalFittingCharge += fittingCharge * item.qty;

      return {
        product: item.product,
        qty: item.qty,
        color: item.color,
        lensType: item.lensType,
        lensSubType: item.lensSubType,
        power: item.power,
        lensQuality: item.lensQuality,
        lensPrice,
        framePrice,
        fittingCharge,
      };
    });

    const deliveryCharge = 99;
    let discount = 0;
    let couponData;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        const orderTotal = subtotal + totalFittingCharge + deliveryCharge;
        if (coupon.discountType === 'percent') {
          discount = (orderTotal * coupon.discountValue) / 100;
          const cap = coupon.maxDiscount || coupon.maxDiscountCap;
          if (cap) discount = Math.min(discount, cap);
        } else {
          discount = coupon.discountValue;
        }
        discount = Math.round(discount);
        couponData = {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          amountSaved: discount,
        };
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
      }
    }

    const total = subtotal + totalFittingCharge + deliveryCharge - discount;

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
      user: req.user!.userId,
      items: orderItems,
      address: deliveryAddress,
      subtotal,
      deliveryCharge,
      fittingCharge: totalFittingCharge,
      discount,
      total,
      coupon: couponData,
      paymentMethod,
      paymentStatus: 'paid', // stub
      status: 'pending',
      statusHistory: [{ status: 'pending', timestamp: new Date() }],
      estimatedDelivery,
    });

    await order.save();

    cart.items = [] as typeof cart.items;
    cart.updatedAt = new Date();
    await cart.save();

    return res.status(201).json({ orderId, total, estimatedDelivery });
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
