import { Request, Response } from 'express';
import { connectDB } from '../config/mongodb';
import { LensOption } from '../models/LensOption';
import { LensType } from '../models/LensType';
import { Lens } from '../models/Lens';
import { clearCachePattern } from '../middleware/cache';

export async function getLensOptions(req: Request, res: Response) {
  try {
    await connectDB();
    const kind = req.query.kind as string | undefined;
    const category = req.query.category as string | undefined;

    if (category) {
      const lensTypes = await LensType.find({ category, status: 'Active' }).sort({ createdAt: -1 });
      const typeIds = lensTypes.map(t => t._id);
      const lenses = await Lens.find({ lensType: { $in: typeIds }, status: 'Active' }).populate('lensType').sort({ createdAt: -1 });
      return res.status(200).json({ lensTypes, lenses });
    }

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
}

export async function createLensOption(req: Request, res: Response) {
  try {
    await connectDB();
    const body = req.body || {};
    const option = new LensOption(body);
    await option.save();
    await clearCachePattern('cache:/api/lens-options*');
    return res.status(201).json(option);
  } catch (error) {
    console.error('POST lens-option error:', error);
    return res.status(500).json({ error: 'Failed to create lens option' });
  }
}
