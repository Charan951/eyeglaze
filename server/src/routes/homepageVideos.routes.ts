import { Router } from 'express';
import { getHomepageVideos, streamVideo } from '../controllers/homepageVideo.controller';

const router = Router();

router.get('/', getHomepageVideos);
router.get('/stream/:id', streamVideo);

export default router;
