import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { connectDB } from '../config/mongodb';
import { Prescription } from '../models/Prescription';
import sharp from 'sharp';
import { uploadToS3 } from '../lib/s3';

// Configure S3 check
const isS3Configured = !!(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_BUCKET_NAME
);

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
      let contentType = file.mimetype;

      if (isImage) {
        try {
          finalBuffer = await sharp(file.buffer)
            .resize({ width: 800, withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
          contentType = 'image/jpeg';
        } catch (err) {
          console.error('Image compression error:', err);
          // Fall back to original file buffer if compression fails
        }
      }

      if (isS3Configured) {
        const fileExt = isImage ? '.jpg' : path.extname(file.originalname);
        const filename = `${req.user!.userId}_${Date.now()}${fileExt}`;
        const s3Key = `eyeglaze_prescriptions/${filename}`;
        
        try {
          uploadedFile = await uploadToS3(finalBuffer, s3Key, contentType);
        } catch (error) {
          console.error('AWS S3 prescription upload error:', error);
          return res.status(500).json({ error: 'AWS S3 upload failed' });
        }
      } else {
        console.warn('AWS S3 not configured. Falling back to local upload storage.');
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

export async function deletePrescription(req: Request, res: Response) {
  try {
    await connectDB();
    const { id } = req.params;
    const deleted = await Prescription.findOneAndDelete({ _id: id, user: req.user!.userId });
    if (!deleted) {
      return res.status(404).json({ error: 'Prescription not found or unauthorized' });
    }
    return res.status(200).json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    console.error('DELETE prescription error:', error);
    return res.status(500).json({ error: 'Failed to delete prescription' });
  }
}


