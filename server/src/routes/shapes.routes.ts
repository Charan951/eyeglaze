import { Router } from 'express';
import { getPublicShapes } from '../controllers/shapes.controller';

const router = Router();

router.get('/', getPublicShapes);

export default router;
