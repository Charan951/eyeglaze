import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import multer from 'multer';
import { connectDB } from '../lib/mongodb';
import { Prescription } from '../models/Prescription';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    await connectDB();

    const file = req.file;
    const body = req.body || {};
    const RE = body.RE ? JSON.parse(body.RE) : undefined;
    const LE = body.LE ? JSON.parse(body.LE) : undefined;
    const pd = body.pd ? parseFloat(body.pd) : undefined;

    let uploadedFile: string | undefined;

    if (file) {
      // TODO: Replace with Cloudinary/S3 in production
      const uploadDir = path.join(process.cwd(), 'public', 'images', 'prescriptions');
      await fs.mkdir(uploadDir, { recursive: true });
      const filename = `${req.user!.userId}_${Date.now()}_${file.originalname}`;
      const filepath = path.join(uploadDir, filename);
      await fs.writeFile(filepath, file.buffer);
      uploadedFile = `/images/prescriptions/${filename}`;
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
});

router.get('/', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const prescriptions = await Prescription.find({ user: req.user!.userId }).sort({ createdAt: -1 });
    return res.status(200).json({ prescriptions });
  } catch (error) {
    console.error('GET prescriptions error:', error);
    return res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

export default router;
