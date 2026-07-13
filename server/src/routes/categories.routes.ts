import { Router } from 'express';
import { getPublicCategories, getPublicCategoryTree } from '../controllers/categories.controller';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

router.get('/', cacheMiddleware({ ttl: 1800, keyPrefix: 'cache:/api/categories' }), getPublicCategories);
router.get('/tree', cacheMiddleware({ ttl: 1800, keyPrefix: 'cache:/api/categories' }), getPublicCategoryTree);

export default router;

