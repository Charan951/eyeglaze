import { Router } from 'express';
import {
  getAdminHomepageSections,
  getAdminHomepageSection,
  createHomepageSection,
  updateHomepageSection,
  updateHomepageSectionTypePosition,
  deleteHomepageSection,
} from '../../controllers/admin/homepageSection.controller';

const router = Router();

router.get('/', getAdminHomepageSections);
router.put('/position', updateHomepageSectionTypePosition);
router.get('/:id', getAdminHomepageSection);
router.post('/', createHomepageSection);
router.put('/:id', updateHomepageSection);
router.delete('/:id', deleteHomepageSection);

export default router;
