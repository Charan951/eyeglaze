import { Request, Response } from 'express';
import { connectDB } from '../config/mongodb';
import { Shape } from '../models/Shape';

export async function getPublicShapes(req: Request, res: Response) {
  try {
    await connectDB();
    const shapes = await Shape.find({ isDeleted: false, status: 'Active' })
      .sort({ displayOrder: 1, name: 1 })
      .lean();
    return res.status(200).json(shapes);
  } catch (error: any) {
    console.error('getPublicShapes error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch active shapes' });
  }
}
