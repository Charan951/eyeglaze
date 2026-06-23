import express from 'express';
import {
  getLensTypes,
  createLensType,
  updateLensType,
  deleteLensType
} from '../../controllers/adminLensTypes.controller';

const router = express.Router();

router.get('/', getLensTypes);
router.post('/', createLensType);
router.put('/:id', updateLensType);
router.delete('/:id', deleteLensType);

export default router;
