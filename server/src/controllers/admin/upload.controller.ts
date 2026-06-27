import { Request, Response } from 'express';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { uploadToS3 } from '../../lib/s3';

// Configure S3 check
const isS3Configured = !!(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_BUCKET_NAME
);

export async function uploadImage(req: Request, res: Response) {
  try {
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Compress using sharp before uploading
    // Resize to max width 800px, compress to 80% quality JPEG
    const compressedBuffer = await sharp(file.buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    if (!isS3Configured) {
      console.warn('AWS S3 not configured. Falling back to local upload storage.');
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, compressedBuffer);

      const host = req.get('host') || 'localhost:5000';
      let protocol = req.protocol || 'http';
      const forwardedProto = req.headers['x-forwarded-proto'];
      if (forwardedProto) {
        protocol = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
      } else if (host.includes('.in') || host.includes('.com')) {
        protocol = 'https';
      }
      const fileUrl = `${protocol}://${host}/uploads/${filename}`;
      return res.status(200).json({ url: fileUrl });
    }

    // Upload to S3
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
    const s3Key = `eyeglaze_products/${filename}`;
    const fileUrl = await uploadToS3(compressedBuffer, s3Key, 'image/jpeg');

    return res.status(200).json({ url: fileUrl });
  } catch (error) {
    console.error('Image upload/compression error:', error);
    return res.status(500).json({ error: 'Image processing failed' });
  }
}

export async function uploadVideo(req: Request, res: Response) {
  try {
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileExt = path.extname(file.originalname) || '.mp4';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;

    if (!isS3Configured) {
      console.warn('AWS S3 not configured for video. Falling back to local upload storage.');
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, file.buffer);

      const host = req.get('host') || 'localhost:5000';
      let protocol = req.protocol || 'http';
      const forwardedProto = req.headers['x-forwarded-proto'];
      if (forwardedProto) {
        protocol = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
      } else if (host.includes('.in') || host.includes('.com')) {
        protocol = 'https';
      }
      const fileUrl = `${protocol}://${host}/uploads/${filename}`;
      return res.status(200).json({ url: fileUrl });
    }

    // Upload to S3
    const s3Key = `eyeglaze_videos/${filename}`;
    const contentType = file.mimetype || 'video/mp4';
    const fileUrl = await uploadToS3(file.buffer, s3Key, contentType);

    return res.status(200).json({ url: fileUrl });
  } catch (error) {
    console.error('Video upload error:', error);
    return res.status(500).json({ error: 'Video upload failed' });
  }
}


