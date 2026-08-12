import { Router } from 'express';
import { getAdminSettings, updateAdminSettings } from '../../controllers/admin/settings.controller';

const router = Router();

router.get('/', getAdminSettings);
router.put('/', updateAdminSettings);

export default router;
