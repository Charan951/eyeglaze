import { Router } from 'express';
import { getPublicCategories, getPublicCategoryTree } from '../controllers/categories.controller';

const router = Router();

router.get('/', getPublicCategories);
router.get('/tree', getPublicCategoryTree);

export default router;

