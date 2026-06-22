import { Router } from 'express';
import multer from 'multer';
import { uploadImage, uploadVideo } from '../../controllers/admin/upload.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('image'), uploadImage);
router.post('/video', upload.single('video'), uploadVideo);

export default router;
