import { Router } from 'express';
import { getAdminStats } from '../../controllers/admin/stats.controller';

const router = Router();

router.get('/', getAdminStats);

export default router;
