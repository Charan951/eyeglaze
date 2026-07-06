import { Router } from 'express';
import {
  validateCoupon,
  getActiveCoupons,
  getMyCoupons,
  getCouponHistory,
  autoApplyBestCoupon,
} from '../controllers/coupons.controller';
import { validate } from '../middleware/validate';
import { validateCouponSchema } from '../validations/coupon.validation';

const router = Router();

router.get('/', getActiveCoupons);
router.post('/validate', validate(validateCouponSchema), validateCoupon);
router.post('/auto-apply', validate(validateCouponSchema), autoApplyBestCoupon);
router.get('/my', getMyCoupons);
router.get('/history', getCouponHistory);

export default router;
