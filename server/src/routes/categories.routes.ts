import { Router } from 'express';
import { cacheMiddleware } from '../middleware/cache';
import { getPublicCategories, getPublicCategoryTree } from '../controllers/categories.controller';

const router = Router();

router.get('/', cacheMiddleware({ ttl: 3600 }), getPublicCategories);
router.get('/tree', cacheMiddleware({ ttl: 3600 }), getPublicCategoryTree);

export default router;

