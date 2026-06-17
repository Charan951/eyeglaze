import { Router } from 'express';
import { getAdminOrders, getAdminOrderById, updateAdminOrder } from '../../controllers/admin/orders.controller';

const router = Router();

router.get('/', getAdminOrders);
router.get('/:id', getAdminOrderById);
router.put('/:id', updateAdminOrder);

export default router;
