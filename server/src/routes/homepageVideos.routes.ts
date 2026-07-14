import { Router } from 'express';
import { cacheMiddleware } from '../middleware/cache';
import { getHomepageVideos, streamVideo } from '../controllers/homepageVideo.controller';

const router = Router();

router.get('/', cacheMiddleware({ ttl: 3600 }), getHomepageVideos);
router.get('/stream/:id', streamVideo);

export default router;
