import { Request, Response } from 'express';
import { connectDB } from '../config/mongodb';
import { SiteSettings } from '../models/SiteSettings';

export async function getPublicSettings(req: Request, res: Response) {
  try {
    await connectDB();
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }
    return res.status(200).json({ settings });
  } catch (error) {
    console.error('getPublicSettings error:', error);
    return res.status(500).json({ error: 'Failed to fetch site settings' });
  }
}
