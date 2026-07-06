import { Request, Response } from 'express';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Reel } from '../models/Reel';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

function getProxiedUrl(reel: any, req: Request) {
  return reel.videoUrl;
}

export async function getReels(req: Request, res: Response) {
  try {
    const reels = await Reel.find({ isActive: true }).sort({ displayOrder: 1 });
    
    const proxiedReels = reels.map(reel => {
      const reelObj = reel.toObject();
      reelObj.videoUrl = getProxiedUrl(reel, req);
      return reelObj;
    });

    return res.status(200).json(proxiedReels);
  } catch (error) {
    console.error('Error fetching reels:', error);
    return res.status(500).json({ error: 'Failed to fetch reels' });
  }
}

export async function streamReel(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const reel = await Reel.findById(id);
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    return res.redirect(reel.videoUrl);
  } catch (error: any) {
    console.error('Error streaming reel:', error);
    return res.status(500).json({ error: 'Streaming failed: ' + error.message });
  }
}
