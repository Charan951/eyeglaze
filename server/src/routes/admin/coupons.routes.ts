import { Router } from 'express';
import {
  getAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  duplicateCoupon,
  bulkImportCoupons,
  bulkExportCoupons,
  getCouponAnalytics,
  getCouponReports,
  getCouponDashboard,
} from '../../controllers/admin/coupons.controller';
import { validate } from '../../middleware/validate';
import { createCouponSchema, updateCouponSchema } from '../../validations/coupon.validation';

const router = Router();

router.get('/', getAdminCoupons);
router.get('/dashboard', getCouponDashboard);
router.get('/analytics', getCouponAnalytics);
router.get('/reports', getCouponReports);
router.post('/import', bulkImportCoupons);
router.get('/export', bulkExportCoupons);

router.post('/', validate(createCouponSchema), createCoupon);
router.put('/:id', validate(updateCouponSchema), updateCoupon);
router.delete('/:id', deleteCoupon);
router.post('/:id/duplicate', duplicateCoupon);

export default router;
