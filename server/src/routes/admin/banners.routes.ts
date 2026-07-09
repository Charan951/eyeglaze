import { Router } from 'express';
import {
  getAdminBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from '../../controllers/admin/banner.controller';

const router = Router();

router.get('/', getAdminBanners);
router.post('/', createBanner);
router.put('/:id', updateBanner);
router.delete('/:id', deleteBanner);

export default router;
