import { Request, Response } from 'express';
import { connectDB } from '../../config/mongodb';
import { User } from '../../models/User';
import { Order } from '../../models/Order';
import { Session } from '../../models/Session';
import { Cart } from '../../models/Cart';
import { Prescription } from '../../models/Prescription';
import { Review } from '../../models/Review';
import { Ticket } from '../../models/Ticket';
import { WalletTransaction } from '../../models/WalletTransaction';
import { CouponUsage } from '../../models/CouponUsage';

export async function getAdminUsers(req: Request, res: Response) {
  try {
    await connectDB();
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '20');
    const search = req.query.search as string | undefined;

    const query: Record<string, any> = { role: { $in: ['user', 'customer', 'CUSTOMER'] } };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).select('-otp -otpExpiry').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    return res.status(200).json({ users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('GET admin users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export async function getAdminUserDetails(req: Request, res: Response) {
  try {
    await connectDB();
    const { userId } = req.params;

    const user = await User.findById(userId).select('-otp -otpExpiry');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch user's orders
    const orders = await Order.find({ user: userId })
      .populate('items.product', 'name images sku')
      .sort({ createdAt: -1 });

    // Check if they used BOGO this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const bogoOrderThisMonth = await Order.findOne({
      user: userId,
      bogoApplied: true,
      createdAt: { $gte: startOfMonth },
      status: { $ne: 'cancelled' },
      paymentStatus: { $ne: 'failed' }
    });

    const bogoAllowedForMember = !bogoOrderThisMonth;

    return res.status(200).json({
      user,
      orders,
      bogoStatus: {
        hasUsedBogoThisMonth: !bogoAllowedForMember,
        oneRupeeOfferCount: user.oneRupeeOfferCount ?? 0,
        membershipActive: user.membershipActive ?? false
      }
    });
  } catch (error) {
    console.error('GET admin user details error:', error);
    return res.status(500).json({ error: 'Failed to fetch user details' });
  }
}

export async function toggleBlockUser(req: Request, res: Response) {
  try {
    await connectDB();
    const { userId } = req.params;
    const { isBlocked } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isBlocked = !!isBlocked;
    await user.save();

    // Revoke sessions if blocked
    if (user.isBlocked) {
      await Session.deleteMany({ userId });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Toggle block user error:', error);
    return res.status(500).json({ error: 'Failed to toggle block status' });
  }
}

export async function deleteAdminUser(req: Request, res: Response) {
  try {
    await connectDB();
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user and all associated details
    await Promise.all([
      User.findByIdAndDelete(userId),
      Session.deleteMany({ userId }),
      Cart.deleteMany({ user: userId }),
      Order.deleteMany({ user: userId }),
      Prescription.deleteMany({ user: userId }),
      Review.deleteMany({ user: userId }),
      Ticket.deleteMany({ user: userId }),
      WalletTransaction.deleteMany({ userId }),
      CouponUsage.deleteMany({ userId })
    ]);

    return res.status(200).json({ success: true, message: 'User deleted from the entire database' });
  } catch (error) {
    console.error('Delete admin user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
}
