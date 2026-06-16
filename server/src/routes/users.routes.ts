import { Router, Request, Response } from 'express';
import { connectDB } from '../lib/mongodb';
import { User } from '../models/User';
import { getToken } from '../middleware/requireAuth';
import { verifyJWT } from '../lib/auth';

const router = Router();

// GET /api/users - Admin: list all users (unauthenticated at the route-mount level,
// matching original Next.js behavior — gated only by in-handler role check)
router.get('/', async (req: Request, res: Response) => {
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
});

export default router;
