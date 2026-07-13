import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/products.controller';

const router = Router();

router.get('/', getProducts);
router.post('/', requireAdmin(['admin', 'store_manager']), createProduct);
router.get('/:id', getProductById);
router.put('/:id', requireAdmin(['admin', 'store_manager']), updateProduct);
router.delete('/:id', requireAdmin(['admin', 'store_manager']), deleteProduct);

export default router;
