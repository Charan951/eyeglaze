import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeCartItem, applyCoupon } from '../controllers/cart.controller';

const router = Router();

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:itemId', updateCartItem);
router.delete('/:itemId', removeCartItem);
router.post('/apply-coupon', applyCoupon);

export default router;
