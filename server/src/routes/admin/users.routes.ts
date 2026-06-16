import { Router, Request, Response } from 'express';
import { connectDB } from '../../lib/mongodb';
import { User } from '../../models/User';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '20');
    const search = req.query.search as string | undefined;

    const query: Record<string, any> = { role: { $in: ['user', 'customer'] } };
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
});

export default router;
