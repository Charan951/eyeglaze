import { Router } from 'express';
import { cacheMiddleware } from '../middleware/cache';
import { getReels, streamReel } from '../controllers/reel.controller';

const router = Router();

router.get('/', cacheMiddleware({ ttl: 3600 }), getReels);
router.get('/stream/:id', streamReel);

export default router;
