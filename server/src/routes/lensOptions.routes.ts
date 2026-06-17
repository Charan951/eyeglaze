import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin';
import { getLensOptions, createLensOption } from '../controllers/lensOptions.controller';

const router = Router();

router.get('/', getLensOptions);
router.post('/', requireAdmin(['admin', 'store_manager']), createLensOption);

export default router;
