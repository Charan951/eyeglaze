import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary
const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name' &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'placeholder';

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

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

    if (!isCloudinaryConfigured) {
      console.warn('Cloudinary not configured. Falling back to local upload storage.');
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, compressedBuffer);

      const host = req.get('host') || 'localhost:5000';
      const protocol = req.protocol || 'http';
      const fileUrl = `${protocol}://${host}/uploads/${filename}`;
      return res.status(200).json({ url: fileUrl });
    }

    // Upload to Cloudinary using upload_stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'eyeglaze_products',
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ error: 'Cloudinary upload failed' });
        }
        return res.status(200).json({ url: result.secure_url });
      }
    );

    uploadStream.end(compressedBuffer);
  } catch (error) {
    console.error('Image upload/compression error:', error);
    return res.status(500).json({ error: 'Image processing failed' });
  }
}
