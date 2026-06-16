import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { connectDB } from '../lib/mongodb';
import { Product } from '../models/Product';
import { Review } from '../models/Review';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    await connectDB();

    const category = req.query.category as string | undefined;
    const frameType = req.query.frameType as string | undefined;
    const search = req.query.search as string | undefined;
    const sort = (req.query.sort as string) || 'newest';
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '20');
    const minPrice = req.query.minPrice as string | undefined;
    const maxPrice = req.query.maxPrice as string | undefined;
    const compatible = req.query.compatible as string | undefined;

    const query: Record<string, any> = { isActive: true };

    if (category) {
      query.$or = [{ category }, { categories: category }];
    }
    if (frameType) {
      const existing = query.$or || [];
      query.$or = [...existing, { frameType }, { 'frame.type': frameType }];
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }
    if (minPrice || maxPrice) {
      query['price.selling'] = {};
      if (minPrice) query['price.selling'].$gte = parseFloat(minPrice);
      if (maxPrice) query['price.selling'].$lte = parseFloat(maxPrice);
    }
    if (compatible) {
      query[`compatible.${compatible}`] = true;
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      price_asc: { 'price.selling': 1 },
      price_desc: { 'price.selling': -1 },
      rating: { rating: -1 },
      newest: { createdAt: -1 },
      bestseller: { soldCount: -1 },
    };
    const sortOption = sortMap[sort] || { createdAt: -1 };

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(query).sort(sortOption).skip(skip).limit(limit),
      Product.countDocuments(query),
    ]);

    return res.status(200).json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('GET products error:', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.post('/', requireAdmin(['admin', 'store_manager']), async (req: Request, res: Response) => {
  try {
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
    console.error('POST product error:', error);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const id = req.params.id as string;

    let product;
    if (id.startsWith('EG-')) {
      product = await Product.findOne({ sku: id });
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    } else {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const reviews = await Review.find({ product: product._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name');

    return res.status(200).json({ product, reviews });
  } catch (error) {
    console.error('GET product error:', error);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.put('/:id', requireAdmin(['admin', 'store_manager']), async (req: Request, res: Response) => {
  try {
    await connectDB();
    const id = req.params.id as string;
    const body = req.body || {};

    const product = await Product.findByIdAndUpdate(id, { $set: body }, { new: true });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error('PUT product error:', error);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', requireAdmin(['admin', 'store_manager']), async (req: Request, res: Response) => {
  try {
    await connectDB();
    const id = req.params.id as string;

    await Product.findByIdAndUpdate(id, { isActive: false });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('DELETE product error:', error);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
