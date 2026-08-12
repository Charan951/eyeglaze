import { Router } from 'express';
import { getPublicBlogs, getPublicBlogBySlug } from '../controllers/blogs.controller';

const router = Router();

router.get('/', getPublicBlogs);
router.get('/:slug', getPublicBlogBySlug);

export default router;
