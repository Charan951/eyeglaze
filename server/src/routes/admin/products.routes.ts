import { Router, Request, Response } from 'express';
import { connectDB } from '../../lib/mongodb';
import { Product } from '../../models/Product';

const ADMIN_ROLES = ['admin', 'store_manager'];

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user || !['admin', 'store_manager', 'support_agent'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await connectDB();
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '50');

    const query: Record<string, any> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) query.category = category;

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(query),
    ]);

    return res.status(200).json({ products, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('GET admin products error:', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await connectDB();
    const body = req.body || {};

    if (!body.sku) {
      const lastProduct = await Product.findOne().sort({ createdAt: -1 });
      const lastNum = lastProduct?.sku?.match(/\d+$/)?.[0];
      const nextNum = lastNum ? String(parseInt(lastNum) + 1).padStart(4, '0') : '0001';
      body.sku = `EG-${nextNum}`;
    }

    const product = new Product(body);
    await product.save();
    return res.status(201).json(product);
  } catch (error) {
    console.error('POST admin product error:', error);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user || !['admin', 'store_manager', 'support_agent'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await connectDB();
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.status(200).json({ product });
  } catch (error) {
    console.error('GET admin product error:', error);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await connectDB();
    const { id } = req.params;
    const body = req.body || {};
    const product = await Product.findByIdAndUpdate(id, { $set: body }, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.status(200).json({ product });
  } catch (error) {
    console.error('PUT admin product error:', error);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await connectDB();
    const { id } = req.params;
    const hard = req.query.hard === 'true' && req.user.role === 'admin';

    if (hard) {
      await Product.findByIdAndDelete(id);
    } else {
      await Product.findByIdAndUpdate(id, { isActive: false });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('DELETE admin product error:', error);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
