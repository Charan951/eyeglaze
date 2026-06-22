import { Router } from 'express';
import { getCashbackCampaigns, createCashbackCampaign, updateCashbackCampaign, deleteCashbackCampaign } from '../controllers/cashbackCampaigns.controller';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

// Public route
router.get('/', getCashbackCampaigns);

// Admin-only routes
router.post('/', requireAdmin(['admin', 'store_manager']), createCashbackCampaign);
router.put('/:id', requireAdmin(['admin', 'store_manager']), updateCashbackCampaign);
router.delete('/:id', requireAdmin(['admin', 'store_manager']), deleteCashbackCampaign);

export default router;
