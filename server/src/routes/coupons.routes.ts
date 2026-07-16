import { Router } from 'express';
import {
  validateCoupon,
  getActiveCoupons,
  getMyCoupons,
  getCouponHistory,
  autoApplyBestCoupon,
} from '../controllers/coupons.controller';
import { validate } from '../middleware/validate';
import { validateCouponSchema, autoApplyCouponSchema } from '../validations/coupon.validation';
import { requireAuth, optionalAuth } from '../middleware/requireAuth';

const router = Router();

router.get('/', optionalAuth, getActiveCoupons);
router.post('/validate', validate(validateCouponSchema), validateCoupon);
router.post('/auto-apply', validate(autoApplyCouponSchema), autoApplyBestCoupon);
router.get('/my', requireAuth, getMyCoupons);
router.get('/history', requireAuth, getCouponHistory);

export default router;
