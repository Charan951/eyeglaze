import { Request, Response } from 'express';
import { connectDB } from '../../config/mongodb';
import { Order } from '../../models/Order';
import { User } from '../../models/User';
import { Product } from '../../models/Product';

export async function getAdminStats(_req: Request, res: Response) {
  try {
    await connectDB();

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      ordersToday,
      ordersWeek,
      ordersMonth,
      totalOrders,
      revenueToday,
      revenueWeek,
      revenueMonth,
      pendingOrders,
      newCustomersWeek,
      totalUsers,
      products,
      recentOrders,
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: startOfDay } }),
      Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfDay }, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfWeek }, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments({ status: 'pending' }),
      User.countDocuments({ createdAt: { $gte: startOfWeek }, role: { $in: ['user', 'customer'] } }),
      User.countDocuments({ role: { $in: ['user', 'customer'] } }),
      Product.find({ isActive: true }).select('colors'),
      Order.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name email mobile phone'),
    ]);

    // Calculate low stock
    let lowStock = 0;
    for (const product of products) {
      if (product.colors && Array.isArray(product.colors)) {
        for (const color of product.colors) {
          if (color.stock < 10) lowStock++;
        }
      }
    }

    return res.status(200).json({
      orders: {
        today: ordersToday,
        week: ordersWeek,
        month: ordersMonth,
        total: totalOrders,
      },
      revenue: {
        today: revenueToday[0]?.total || 0,
        week: revenueWeek[0]?.total || 0,
        month: revenueMonth[0]?.total || 0,
      },
      pending: pendingOrders,
      lowStock,
      newCustomers: newCustomersWeek,
      totalCustomers: totalUsers,
      products: products.length,
      recentOrders,
    });
  } catch (error) {
    console.error('GET admin stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
