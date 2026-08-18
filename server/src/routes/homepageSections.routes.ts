import { Router } from 'express';
import { cacheMiddleware } from '../middleware/cache';
import { getPublicHomepageSections } from '../controllers/homepageSection.controller';

const router = Router();

router.get('/', cacheMiddleware({ ttl: 3600 }), getPublicHomepageSections);

export default router;
