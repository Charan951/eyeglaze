import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { connectDB } from '../config/mongodb';
import { Product } from '../models/Product';
import { Review } from '../models/Review';
import { Lens } from '../models/Lens';

const parseCommaParam = (param: any): string[] | undefined => {
  if (typeof param === 'string' && param.trim() !== '') {
    return param.split(',').map(s => s.trim()).filter(Boolean);
  }
  return undefined;
};

export async function getProducts(req: Request, res: Response) {
  try {
    await connectDB();

    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const sort = (req.query.sort as string) || 'newest';
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '20');
    const minPrice = req.query.minPrice as string | undefined;
    const maxPrice = req.query.maxPrice as string | undefined;
    const compatible = req.query.compatible as string | undefined;

    const query: Record<string, any> = { isActive: true };
    const andConditions: any[] = [];

    if (category) {
      const normalized = category === 'bluelight' ? 'blue_light' : category === 'contact' ? 'contact_lenses' : category;
      andConditions.push({ $or: [{ category: normalized }, { categories: normalized }] });
    }

    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
        ],
      });
    }

    if (minPrice || maxPrice) {
      const priceCond: Record<string, any> = {};
      if (minPrice) priceCond.$gte = parseFloat(minPrice);
      if (maxPrice) priceCond.$lte = parseFloat(maxPrice);
      andConditions.push({ 'price.selling': priceCond });
    }

    if (compatible) {
      andConditions.push({ [`compatible.${compatible}`]: true });
    }

    // New MERN filters
    const brands = parseCommaParam(req.query.brand);
    if (brands) {
      andConditions.push({ brand: { $in: brands } });
    }

    const shapes = parseCommaParam(req.query.shape);
    if (shapes) {
      andConditions.push({
        $or: [
          { shape: { $in: shapes } },
          { 'frame.type': { $in: shapes } },
          { frameType: { $in: shapes } },
        ],
      });
    }

    const frameSizes = parseCommaParam(req.query.frameSize || req.query.size);
    if (frameSizes) {
      andConditions.push({ frameSize: { $in: frameSizes } });
    }

    const frameColors = parseCommaParam(req.query.frameColor || req.query.color);
    if (frameColors) {
      andConditions.push({
        $or: [
          { frameColor: { $in: frameColors } },
          { 'colors.name': { $regex: frameColors.map(c => `^${c}$|\\b${c}\\b`).join('|'), $options: 'i' } },
        ],
      });
    }

    const frameTypes = parseCommaParam(req.query.frameType);
    if (frameTypes) {
      const shapeList = ['Square', 'Round', 'Clubmaster', 'Aviator', 'Wayfarer', 'Cat Eye', 'Hexagonal', 'Rectangle', 'Oval', 'Geometric'];
      const hasLegacyShapes = frameTypes.some(t => shapeList.includes(t));
      if (hasLegacyShapes) {
        andConditions.push({
          $or: [
            { shape: { $in: frameTypes } },
            { 'frame.type': { $in: frameTypes } },
            { frameType: { $in: frameTypes } },
          ],
        });
      } else {
        andConditions.push({ frameType: { $in: frameTypes } });
      }
    }

    const materials = parseCommaParam(req.query.material);
    if (materials) {
      andConditions.push({
        $or: [
          { material: { $in: materials } },
          { 'frame.material': { $in: materials } },
        ],
      });
    }

    const weights = parseCommaParam(req.query.weight);
    if (weights) {
      andConditions.push({ weight: { $in: weights } });
    }

    const faceShapes = parseCommaParam(req.query.faceShape);
    if (faceShapes) {
      andConditions.push({ faceShapes: { $in: faceShapes } });
    }

    const rating = req.query.rating as string | undefined;
    if (rating) {
      andConditions.push({ rating: { $gte: parseFloat(rating) } });
    }

    const genders = parseCommaParam(req.query.gender);
    if (genders) {
      andConditions.push({ gender: { $in: genders } });
    }

    const isPremium = req.query.isPremium as string | undefined;
    if (isPremium === 'true') {
      andConditions.push({ isPremium: true });
    }


    if (andConditions.length > 0) {
      query.$and = andConditions;
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
}

export async function createProduct(req: Request, res: Response) {
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
}

export async function getProductById(req: Request, res: Response) {
  try {
    await connectDB();
    const id = req.params.id as string;

    let product;
    if (id.startsWith('EG-')) {
      product = await Product.findOne({ sku: id }).populate('lensTypes');
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id).populate('lensTypes');
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

    // Fetch active lenses associated with the product's lens types
    const lensTypeIds = product.lensTypes || [];
    const lenses = await Lens.find({ lensType: { $in: lensTypeIds }, status: 'Active' }).populate('lensType');

    // Apply product-specific price overrides if present in dynamicLensPricing
    const overriddenLenses = lenses.map(lensDoc => {
      const lensObj = lensDoc.toObject();
      if (product.dynamicLensPricing && Array.isArray(product.dynamicLensPricing)) {
        const override = product.dynamicLensPricing.find(
          (o: any) => o.lensName === lensObj.name && o.status === 'Active'
        );
        if (override) {
          lensObj.basePrice = override.regularPrice;
          if (override.goldPrice !== undefined) {
            lensObj.memberPrice = override.goldPrice;
          }
        }
      }
      return lensObj;
    });

    return res.status(200).json({ product, reviews, lenses: overriddenLenses });
  } catch (error) {
    console.error('GET product error:', error);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    await connectDB();
    const id = req.params.id as string;
    const body = req.body || {};

    const product = await Product.findByIdAndUpdate(id, { $set: body }, { returnDocument: 'after' });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error('PUT product error:', error);
    return res.status(500).json({ error: 'Failed to update product' });
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    await connectDB();
    const id = req.params.id as string;

    await Product.findByIdAndUpdate(id, { isActive: false });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('DELETE product error:', error);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
}
