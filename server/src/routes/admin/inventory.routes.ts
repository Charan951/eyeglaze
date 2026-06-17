import { Router } from 'express';
import { getInventory } from '../../controllers/admin/inventory.controller';

const router = Router();

router.get('/', getInventory);

export default router;
