import { Router } from 'express';
import { getAdminUsers, getAdminUserDetails, toggleBlockUser, deleteAdminUser } from '../../controllers/admin/users.controller';

const router = Router();

router.get('/', getAdminUsers);
router.get('/:userId/details', getAdminUserDetails);
router.patch('/:userId/block', toggleBlockUser);
router.delete('/:userId', deleteAdminUser);

export default router;
