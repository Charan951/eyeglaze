import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin';
import { getLensOptions, createLensOption } from '../controllers/lensOptions.controller';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

router.get('/', cacheMiddleware({ ttl: 1800, keyPrefix: 'cache:/api/lens-options' }), getLensOptions);
router.post('/', requireAdmin(['admin', 'store_manager']), createLensOption);

export default router;
