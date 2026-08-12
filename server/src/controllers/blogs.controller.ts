import { Request, Response } from 'express';
import { connectDB } from '../config/mongodb';
import { Blog } from '../models/Blog';

export async function getPublicBlogs(req: Request, res: Response) {
  try {
    await connectDB();
    const blogs = await Blog.find({ status: 'Published' }).sort({ displayOrder: 1, publishedAt: -1 });
    return res.status(200).json({ blogs });
  } catch (error) {
    console.error('getPublicBlogs error:', error);
    return res.status(500).json({ error: 'Failed to fetch blogs' });
  }
}

export async function getPublicBlogBySlug(req: Request, res: Response) {
  try {
    await connectDB();
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug, status: 'Published' });
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    return res.status(200).json({ blog });
  } catch (error) {
    console.error('getPublicBlogBySlug error:', error);
    return res.status(500).json({ error: 'Failed to fetch blog' });
  }
}
