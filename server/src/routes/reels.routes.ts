import { Router } from 'express';
import { getReels, streamReel } from '../controllers/reel.controller';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

router.get('/', cacheMiddleware({ ttl: 1800, keyPrefix: 'cache:/api/reels' }), getReels);
router.get('/stream/:id', streamReel);

export default router;
