import { Router } from 'express';
import { getReels, streamReel } from '../controllers/reel.controller';

const router = Router();

router.get('/', getReels);
router.get('/stream/:id', streamReel);

export default router;
