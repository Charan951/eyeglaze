import { Router } from 'express';
import { validateCoupon } from '../controllers/coupons.controller';

const router = Router();

router.post('/validate', validateCoupon);

export default router;
