import { Router } from 'express';
import { getWishlist, toggleWishlist } from '../controllers/wishlist.controller';

const router = Router();

router.get('/', getWishlist);
router.post('/toggle', toggleWishlist);

export default router;
