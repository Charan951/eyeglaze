import { Router } from 'express';
import { validateCoupon, getActiveCoupons } from '../controllers/coupons.controller';

const router = Router();

router.get('/', getActiveCoupons);
router.post('/validate', validateCoupon);

export default router;
