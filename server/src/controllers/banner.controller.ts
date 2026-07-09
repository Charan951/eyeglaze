import { Request, Response } from 'express';
import { Banner } from '../models/Banner';

export async function getPublicBanners(req: Request, res: Response) {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ displayOrder: 1 });
    return res.status(200).json(banners);
  } catch (error) {
    console.error('Error fetching public banners:', error);
    return res.status(500).json({ error: 'Failed to fetch banners' });
  }
}
