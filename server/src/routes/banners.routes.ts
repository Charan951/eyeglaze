import { Router } from 'express';
import { cacheMiddleware } from '../middleware/cache';
import { getPublicBanners } from '../controllers/banner.controller';

const router = Router();

router.get('/', cacheMiddleware({ ttl: 3600 }), getPublicBanners);

export default router;
