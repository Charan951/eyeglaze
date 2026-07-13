import { Router } from 'express';
import { getHomepageVideos, streamVideo } from '../controllers/homepageVideo.controller';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

router.get('/', cacheMiddleware({ ttl: 1800, keyPrefix: 'cache:/api/homepage-videos' }), getHomepageVideos);
router.get('/stream/:id', streamVideo);

export default router;
