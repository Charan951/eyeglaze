import { Router } from 'express';
import {
  getAdminHomepageVideos,
  getAdminHomepageVideo,
  createHomepageVideo,
  updateHomepageVideo,
  deleteHomepageVideo,
} from '../../controllers/admin/homepageVideo.controller';

const router = Router();

router.get('/', getAdminHomepageVideos);
router.get('/:id', getAdminHomepageVideo);
router.post('/', createHomepageVideo);
router.put('/:id', updateHomepageVideo);
router.delete('/:id', deleteHomepageVideo);

export default router;
