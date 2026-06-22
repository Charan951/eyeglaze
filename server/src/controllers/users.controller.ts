import { Request, Response } from 'express';
import { connectDB } from '../config/mongodb';
import { User } from '../models/User';
import { Coupon } from '../models/Coupon';
import { getToken } from '../middleware/requireAuth';
import { verifyJWT } from '../lib/auth';

export async function getUsers(req: Request, res: Response) {
  try {
    const token = getToken(req);
    const auth = token ? verifyJWT(token) : null;
    if (!auth || !['admin', 'store_manager', 'support_agent'].includes(auth.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await connectDB();
    const users = await User.find({ role: { $in: ['user', 'customer'] } })
      .select('-otp -otpExpiry')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({ users });
  } catch (error) {
    console.error('GET users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
}
