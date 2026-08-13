import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeCartItem, applyCoupon, toggleMembership, convertBuy1Get1ToCoupon } from '../controllers/cart.controller';

const router = Router();

router.get('/', getCart);
router.post('/', addToCart);
router.put('/membership', toggleMembership);
router.post('/apply-coupon', applyCoupon);
router.post('/convert-to-coupon', convertBuy1Get1ToCoupon);
router.put('/:itemId', updateCartItem);
router.delete('/:itemId', removeCartItem);

export default router;
