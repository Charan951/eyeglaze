import express from 'express';
import {
  getLenses,
  createLens,
  updateLens,
  deleteLens
} from '../../controllers/adminLenses.controller';

const router = express.Router();

router.get('/', getLenses);
router.post('/', createLens);
router.put('/:id', updateLens);
router.delete('/:id', deleteLens);

export default router;
