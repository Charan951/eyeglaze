import { Request, Response } from 'express';
import { HomepageSection, ensureDefaultHomepageSections } from '../models/HomepageSection';
import { clearCachePattern } from '../middleware/cache';

export async function getPublicHomepageSections(req: Request, res: Response) {
  try {
    const changed = await ensureDefaultHomepageSections();
    if (changed) {
      await clearCachePattern('cache:/api/homepage-sections*');
    }
    const sections = await HomepageSection.find({ isActive: true }).sort({ displayOrder: 1 });
    return res.status(200).json(sections);
  } catch (error) {
    console.error('Error fetching homepage sections:', error);
    return res.status(500).json({ error: 'Failed to fetch homepage sections' });
  }
}
