import { Router } from 'express';
import {
  getAdminHomepageVideos,
  createHomepageVideo,
  updateHomepageVideo,
  deleteHomepageVideo,
} from '../../controllers/admin/homepageVideo.controller';

const router = Router();

router.get('/', getAdminHomepageVideos);
router.post('/', createHomepageVideo);
router.put('/:id', updateHomepageVideo);
router.delete('/:id', deleteHomepageVideo);

export default router;
