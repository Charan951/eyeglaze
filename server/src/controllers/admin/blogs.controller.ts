import { Request, Response } from 'express';
import { connectDB } from '../../config/mongodb';
import { Blog } from '../../models/Blog';
import { clearCachePattern } from '../../middleware/cache';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function getAdminBlogs(req: Request, res: Response) {
  try {
    await connectDB();
    const blogs = await Blog.find().sort({ displayOrder: 1, createdAt: -1 });
    return res.status(200).json({ blogs });
  } catch (error) {
    console.error('getAdminBlogs error:', error);
    return res.status(500).json({ error: 'Failed to fetch blogs' });
  }
}

export async function createBlog(req: Request, res: Response) {
  try {
    await connectDB();
    const { title, excerpt, content, image, tag, readTime, author, status, displayOrder } = req.body || {};

    if (!title || !excerpt || !image) {
      return res.status(400).json({ error: 'Title, excerpt, and image are required' });
    }

    let slug = slugify(title);
    const existing = await Blog.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const blog = await Blog.create({
      title,
      slug,
      excerpt,
      content,
      image,
      tag,
      readTime,
      author,
      status: status || 'Published',
      displayOrder: displayOrder || 0,
      publishedAt: new Date(),
    });

    await clearCachePattern('cache:/api/blogs*');
    return res.status(201).json({ blog });
  } catch (error) {
    console.error('createBlog error:', error);
    return res.status(500).json({ error: 'Failed to create blog' });
  }
}

export async function updateBlog(req: Request, res: Response) {
  try {
    await connectDB();
    const { id } = req.params;
    const { title, excerpt, content, image, tag, readTime, author, status, displayOrder } = req.body || {};

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (title !== undefined) blog.title = title;
    if (excerpt !== undefined) blog.excerpt = excerpt;
    if (content !== undefined) blog.content = content;
    if (image !== undefined) blog.image = image;
    if (tag !== undefined) blog.tag = tag;
    if (readTime !== undefined) blog.readTime = readTime;
    if (author !== undefined) blog.author = author;
    if (status !== undefined) blog.status = status;
    if (displayOrder !== undefined) blog.displayOrder = displayOrder;

    await blog.save();
    await clearCachePattern('cache:/api/blogs*');
    return res.status(200).json({ blog });
  } catch (error) {
    console.error('updateBlog error:', error);
    return res.status(500).json({ error: 'Failed to update blog' });
  }
}

export async function deleteBlog(req: Request, res: Response) {
  try {
    await connectDB();
    const { id } = req.params;
    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    await clearCachePattern('cache:/api/blogs*');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('deleteBlog error:', error);
    return res.status(500).json({ error: 'Failed to delete blog' });
  }
}
