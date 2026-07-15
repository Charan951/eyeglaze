import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { connectDB } from '../../config/mongodb';
import { Order } from '../../models/Order';
import { User } from '../../models/User';
import { WalletTransaction } from '../../models/WalletTransaction';
import { getIO } from '../../lib/socket';

export async function getAdminOrders(req: Request, res: Response) {
  try {
    await connectDB();
    const status = req.query.status as string | undefined;
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '20');
    const dateFrom = req.query.dateFrom as string | undefined;
    const dateTo = req.query.dateTo as string | undefined;

    const query: Record<string, any> = {};
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email mobile phone walletBalance'),
      Order.countDocuments(query),
    ]);

    return res.status(200).json({ orders, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('GET admin orders error:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

export async function getAdminOrderById(req: Request, res: Response) {
  try {
    await connectDB();
    const id = req.params.id as string;
    const orConditions: any[] = [{ orderId: id }, { orderNumber: id }];
    if (mongoose.Types.ObjectId.isValid(id)) orConditions.push({ _id: id });

    const order = await Order.findOne({ $or: orConditions })
      .populate('user', 'name email mobile phone addresses walletBalance')
      .populate('items.product', 'name images thumbnail sku');

    if (!order) return res.status(404).json({ error: 'Order not found' });
    return res.status(200).json({ order });
  } catch (error) {
    console.error('GET admin order error:', error);
    return res.status(500).json({ error: 'Failed to fetch order' });
  }
}

export async function updateAdminOrder(req: Request, res: Response) {
  try {
    await connectDB();
    const id = req.params.id as string;
    const body = req.body || {};
    const orConditions: any[] = [{ orderId: id }, { orderNumber: id }];
    if (mongoose.Types.ObjectId.isValid(id)) orConditions.push({ _id: id });

    const order = await Order.findOne({ $or: orConditions });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (body.status) {
      order.status = body.status;
      order.statusHistory.push({ status: body.status, timestamp: new Date(), note: body.note });
    }
    if (body.trackingNumber) order.trackingNumber = body.trackingNumber;
    if (body.courierPartner) order.courierPartner = body.courierPartner;
    if (body.internalNote) {
      order.internalNotes.push({
        note: body.internalNote,
        addedBy: req.user!.userId as unknown as mongoose.Types.ObjectId,
        addedAt: new Date(),
      });
    }
    if (body.prescriptionVerified !== undefined) {
      order.prescriptionVerified = body.prescriptionVerified;
    }
    if (body.paymentStatus) order.paymentStatus = body.paymentStatus;
    if (body.isFlagged !== undefined) order.isFlagged = body.isFlagged;

    if (body.walletAmountToAdd && typeof body.walletAmountToAdd === 'number' && body.walletAmountToAdd > 0) {
      const userObj = await User.findById(order.user);
      if (userObj) {
        userObj.walletBalance = (userObj.walletBalance || 0) + body.walletAmountToAdd;
        userObj.transactions.push({
          type: 'Refund',
          amount: body.walletAmountToAdd,
          date: new Date(),
          description: body.walletRefundDescription || `Refund for order ${order.orderId || order.orderNumber}`,
        } as any);
        await userObj.save();

        await WalletTransaction.create({
          userId: userObj._id,
          amount: body.walletAmountToAdd,
          type: 'Credit',
          source: 'Refund',
          description: body.walletRefundDescription || `Refund for order ${order.orderId || order.orderNumber}`,
          orderId: order.orderId || order.orderNumber,
        });
      }
    }

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('user', 'name email mobile phone addresses walletBalance')
      .populate('items.product', 'name images thumbnail sku');

    try {
      getIO().emit('order_changed', { action: 'update', order: updatedOrder });
    } catch (err) {
      console.error('Socket emit error:', err);
    }
    return res.status(200).json({ order: updatedOrder });
  } catch (error) {
    console.error('PUT admin order error:', error);
    return res.status(500).json({ error: 'Failed to update order' });
  }
}
