import { Router } from 'express';
import { getPublicBanners } from '../controllers/banner.controller';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

router.get('/', cacheMiddleware({ ttl: 1800, keyPrefix: 'cache:/api/banners' }), getPublicBanners);

export default router;
