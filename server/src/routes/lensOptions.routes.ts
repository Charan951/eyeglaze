import { Router, Request, Response } from 'express';
import { connectDB } from '../lib/mongodb';
import { LensOption } from '../models/LensOption';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const kind = req.query.kind as string | undefined;

    const query: Record<string, unknown> = { isActive: true };
    if (kind) query.kind = kind;

    const options = await LensOption.find(query).sort({ sortOrder: 1 });

    const lensTypes = options.filter((o) => o.kind === 'type');
    const lensQualities = options.filter((o) => o.kind === 'quality');

    return res.status(200).json({ lensTypes, lensQualities });
  } catch (error) {
    console.error('GET lens-options error:', error);
    return res.status(500).json({ error: 'Failed to fetch lens options' });
  }
});

router.post('/', requireAdmin(['admin', 'store_manager']), async (req: Request, res: Response) => {
  try {
    await connectDB();
    const body = req.body || {};
    const option = new LensOption(body);
    await option.save();
    return res.status(201).json(option);
  } catch (error) {
    console.error('POST lens-option error:', error);
    return res.status(500).json({ error: 'Failed to create lens option' });
  }
});

export default router;
