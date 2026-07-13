import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/products.controller';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

router.get('/', cacheMiddleware({ ttl: 300, keyPrefix: 'cache:/api/products' }), getProducts);
router.post('/', requireAdmin(['admin', 'store_manager']), createProduct);
router.get('/:id', cacheMiddleware({ ttl: 600, keyPrefix: 'cache:/api/products' }), getProductById);
router.put('/:id', requireAdmin(['admin', 'store_manager']), updateProduct);
router.delete('/:id', requireAdmin(['admin', 'store_manager']), deleteProduct);

export default router;
