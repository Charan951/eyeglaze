import { Router } from 'express';
import { adminGetAllReviews, adminDeleteReview } from '../../controllers/admin/reviews.controller';

const router = Router();

router.get('/', adminGetAllReviews);
router.delete('/:id', adminDeleteReview);

export default router;
