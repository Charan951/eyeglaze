import { Router } from 'express';
import multer from 'multer';
import { savePrescription, getPrescriptions } from '../controllers/prescriptions.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), savePrescription);
router.get('/', getPrescriptions);

export default router;
