import { Router } from 'express';
import { getAdminUsers } from '../../controllers/admin/users.controller';

const router = Router();

router.get('/', getAdminUsers);

export default router;
