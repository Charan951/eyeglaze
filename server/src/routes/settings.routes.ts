import { Router } from 'express';
import { getPublicSettings } from '../controllers/settings.controller';

const router = Router();

router.get('/', getPublicSettings);

export default router;
