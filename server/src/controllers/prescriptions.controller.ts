import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { connectDB } from '../config/mongodb';
import { Prescription } from '../models/Prescription';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

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

export async function savePrescription(req: Request, res: Response) {
  try {
    await connectDB();

    const file = req.file;
    const body = req.body || {};
    const RE = body.RE ? JSON.parse(body.RE) : undefined;
    const LE = body.LE ? JSON.parse(body.LE) : undefined;
    const pd = body.pd ? parseFloat(body.pd) : undefined;

    let uploadedFile: string | undefined;

    if (file) {
      let finalBuffer = file.buffer;
      const isImage = file.mimetype.startsWith('image/');

      if (isImage) {
        try {
          finalBuffer = await sharp(file.buffer)
            .resize({ width: 800, withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
        } catch (err) {
          console.error('Image compression error:', err);
          // Fall back to original file buffer if compression fails
        }
      }

      if (isCloudinaryConfigured) {
        // Upload to Cloudinary using upload_stream wrapped in a Promise
        const uploadToCloudinary = (buffer: Buffer, folder: string): Promise<string> => {
          return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder,
                resource_type: 'auto',
              },
              (error, result) => {
                if (error || !result) {
                  reject(error || new Error('Cloudinary upload failed'));
                } else {
                  resolve(result.secure_url);
                }
              }
            );
            uploadStream.end(buffer);
          });
        };

        try {
          uploadedFile = await uploadToCloudinary(finalBuffer, 'eyeglaze_prescriptions');
        } catch (error) {
          console.error('Cloudinary prescription upload error:', error);
          return res.status(500).json({ error: 'Cloudinary upload failed' });
        }
      } else {
        console.warn('Cloudinary not configured. Falling back to local upload storage.');
        const uploadDir = path.join(process.cwd(), 'public', 'images', 'prescriptions');
        await fs.mkdir(uploadDir, { recursive: true });
        
        const fileExt = isImage ? '.jpg' : path.extname(file.originalname);
        const filename = `${req.user!.userId}_${Date.now()}${fileExt}`;
        const filepath = path.join(uploadDir, filename);
        await fs.writeFile(filepath, finalBuffer);
        uploadedFile = `/images/prescriptions/${filename}`;
      }
    }

    const prescription = new Prescription({
      user: req.user!.userId,
      RE,
      LE,
      pd,
      uploadedFile,
      imageUrl: uploadedFile,
    });

    await prescription.save();
    return res.status(201).json({ prescription });
  } catch (error) {
    console.error('POST prescription error:', error);
    return res.status(500).json({ error: 'Failed to save prescription' });
  }
}

export async function getPrescriptions(req: Request, res: Response) {
  try {
    await connectDB();
    const prescriptions = await Prescription.find({ user: req.user!.userId }).sort({ createdAt: -1 });
    return res.status(200).json({ prescriptions });
  } catch (error) {
    console.error('GET prescriptions error:', error);
    return res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
}
