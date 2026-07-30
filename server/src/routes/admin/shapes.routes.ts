import { Router } from 'express';
import {
  getShapes,
  getShapeById,
  createShape,
  updateShape,
  deleteShape,
  restoreShape,
} from '../../controllers/admin/shapes.controller';

const router = Router();

router.get('/', getShapes);
router.post('/', createShape);
router.get('/:id', getShapeById);
router.put('/:id', updateShape);
router.delete('/:id', deleteShape);
router.put('/:id/restore', restoreShape);

export default router;
