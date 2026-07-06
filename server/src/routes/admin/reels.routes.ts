import { Router } from 'express';
import {
  getAdminReels,
  createReel,
  updateReel,
  deleteReel,
} from '../../controllers/admin/reel.controller';

const router = Router();

router.get('/', getAdminReels);
router.post('/', createReel);
router.put('/:id', updateReel);
router.delete('/:id', deleteReel);

export default router;
