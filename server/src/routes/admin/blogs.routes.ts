import { Router } from 'express';
import { getAdminBlogs, createBlog, updateBlog, deleteBlog } from '../../controllers/admin/blogs.controller';

const router = Router();

router.get('/', getAdminBlogs);
router.post('/', createBlog);
router.put('/:id', updateBlog);
router.delete('/:id', deleteBlog);

export default router;
