import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin';
import { cacheMiddleware } from '../middleware/cache';
import { getLensOptions, createLensOption } from '../controllers/lensOptions.controller';

const router = Router();

router.get('/', cacheMiddleware({ ttl: 3600 }), getLensOptions);
router.post('/', requireAdmin(['admin', 'store_manager']), createLensOption);

export default router;
