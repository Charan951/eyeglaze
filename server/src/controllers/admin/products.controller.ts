import { Request, Response } from 'express';
import { connectDB } from '../../config/mongodb';
import { Product } from '../../models/Product';
import { clearCachePattern } from '../../middleware/cache';
import { Brand } from '../../models/Brand';
import { Category } from '../../models/Category';
import { Warehouse } from '../../models/Warehouse';
import { ProductVariant } from '../../models/ProductVariant';
import { AuditLog } from '../../models/AuditLog';
import { User } from '../../models/User';
import { getIO } from '../../lib/socket';

const ADMIN_ROLES = ['admin', 'store_manager'];

export async function getProductsMetadata(req: Request, res: Response) {
  try {
    if (!req.user || !['admin', 'store_manager', 'support_agent'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await connectDB();
    const [brands, categories, warehouses] = await Promise.all([
      Brand.find({ isActive: true }).sort({ name: 1 }),
      Category.find({ isActive: true }).sort({ name: 1 }),
      Warehouse.find({ isActive: true }).sort({ name: 1 }),
    ]);

    return res.status(200).json({ brands, categories, warehouses });
  } catch (error) {
    console.error('GET products metadata error:', error);
    return res.status(500).json({ error: 'Failed to fetch metadata' });
  }
}

export async function getAdminProducts(req: Request, res: Response) {
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
}

export async function createAdminProduct(req: Request, res: Response) {
  try {
    if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await connectDB();
    const body = req.body || {};

    // SKU Generation & Validation
    if (!body.sku) {
      const lastProduct = await Product.findOne().sort({ createdAt: -1 });
      const lastNum = lastProduct?.sku?.match(/\d+$/)?.[0];
      const nextNum = lastNum ? String(parseInt(lastNum) + 1).padStart(4, '0') : '0001';
      body.sku = `EG-${nextNum}`;
    } else {
      const existingSku = await Product.findOne({ sku: body.sku });
      if (existingSku) {
        return res.status(400).json({ error: `Product SKU '${body.sku}' already exists` });
      }
    }

    // Slug Generation & Validation
    if (!body.slug) {
      body.slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    const existingSlug = await Product.findOne({ slug: body.slug });
    if (existingSlug) {
      return res.status(400).json({ error: `Product Slug URL '${body.slug}' already exists` });
    }

    // Campaign date validation if available
    if (body.oneRupeeOfferConditions?.campaignStartDate && body.oneRupeeOfferConditions?.campaignEndDate) {
      const start = new Date(body.oneRupeeOfferConditions.campaignStartDate);
      const end = new Date(body.oneRupeeOfferConditions.campaignEndDate);
      if (start >= end) {
        return res.status(400).json({ error: 'Campaign End Date must be after Campaign Start Date' });
      }
    }

    // Price validation
    if (body.mrp !== undefined && body.sellingPrice !== undefined) {
      if (body.sellingPrice > body.mrp) {
        return res.status(400).json({ error: 'Selling Price cannot be greater than MRP' });
      }
    }

    // Set defaults
    body.currentVersion = 1;

    const product = new Product(body);
    await product.save();

    // 1. Sync Variants to ProductVariant collection
    if (body.variants && Array.isArray(body.variants)) {
      for (const v of body.variants) {
        const variant = new ProductVariant({
          productId: product._id,
          name: v.name || `${product.name} - ${v.color}`,
          color: v.color,
          sku: v.sku || `${product.sku}-${v.color.toUpperCase()}`,
          stock: v.stock || 0,
          priceOverride: v.priceOverride,
          status: v.status || 'Active',
          images: v.images || [],
          priority: v.priority || 0,
        });
        await variant.save();
      }
    }

    // 2. Log Audit Details
    const userObj = await User.findById(req.user.userId);
    const audit = new AuditLog({
      productId: product._id,
      action: 'create',
      performedBy: req.user.userId,
      performedByName: userObj?.name || userObj?.email || 'Admin User',
      changes: body,
      version: 1,
    });
    await audit.save();

    // Broadcast creation
    try {
      getIO().emit('product_changed', { action: 'create', product });
    } catch (err) {
      console.error('Socket emit error:', err);
    }

    await clearCachePattern('cache:/api/products*');
    return res.status(201).json(product);
  } catch (error: any) {
    console.error('POST admin product error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create product' });
  }
}

export async function getAdminProductById(req: Request, res: Response) {
  try {
    if (!req.user || !['admin', 'store_manager', 'support_agent'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await connectDB();
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Fetch associated variants
    const variants = await ProductVariant.find({ productId: id }).sort({ priority: -1 });

    // Fetch associated audit logs
    const auditLogs = await AuditLog.find({ productId: id }).sort({ createdAt: -1 });

    return res.status(200).json({ product, variants, auditLogs });
  } catch (error) {
    console.error('GET admin product error:', error);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
}

export async function updateAdminProduct(req: Request, res: Response) {
  try {
    if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await connectDB();
    const { id } = req.params;
    const body = req.body || {};

    const existingProduct = await Product.findById(id);
    if (!existingProduct) return res.status(404).json({ error: 'Product not found' });

    // SKU uniqueness validation
    if (body.sku && body.sku !== existingProduct.sku) {
      const existingSku = await Product.findOne({ sku: body.sku });
      if (existingSku) {
        return res.status(400).json({ error: `Product SKU '${body.sku}' already exists` });
      }
    }

    // Slug uniqueness validation
    if (body.slug && body.slug !== existingProduct.slug) {
      const existingSlug = await Product.findOne({ slug: body.slug });
      if (existingSlug) {
        return res.status(400).json({ error: `Product Slug '${body.slug}' already exists` });
      }
    }

    // Campaign date validation
    if (body.oneRupeeOfferConditions?.campaignStartDate && body.oneRupeeOfferConditions?.campaignEndDate) {
      const start = new Date(body.oneRupeeOfferConditions.campaignStartDate);
      const end = new Date(body.oneRupeeOfferConditions.campaignEndDate);
      if (start >= end) {
        return res.status(400).json({ error: 'Campaign End Date must be after Campaign Start Date' });
      }
    }

    // Increment version
    const nextVersion = (existingProduct.currentVersion || 1) + 1;
    body.currentVersion = nextVersion;

    const product = await Product.findByIdAndUpdate(id, { $set: body }, { returnDocument: 'after' });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Sync Variants to ProductVariant collection
    if (body.variants && Array.isArray(body.variants)) {
      // Remove previous ones and rewrite or upsert. Deleting and rewriting is simple and clean.
      await ProductVariant.deleteMany({ productId: id });
      for (const v of body.variants) {
        const variant = new ProductVariant({
          productId: product._id,
          name: v.name || `${product.name} - ${v.color}`,
          color: v.color,
          sku: v.sku || `${product.sku}-${v.color.toUpperCase()}`,
          stock: v.stock || 0,
          priceOverride: v.priceOverride,
          status: v.status || 'Active',
          images: v.images || [],
          priority: v.priority || 0,
        });
        await variant.save();
      }
    }

    // Audit logs entry
    const userObj = await User.findById(req.user.userId);
    const audit = new AuditLog({
      productId: product._id,
      action: body.status === 'Active' && existingProduct.status !== 'Active' ? 'publish' : 'update',
      performedBy: req.user.userId,
      performedByName: userObj?.name || userObj?.email || 'Admin User',
      changes: body,
      version: nextVersion,
    });
    await audit.save();

    // Broadcast update
    try {
      getIO().emit('product_changed', { action: 'update', product });
    } catch (err) {
      console.error('Socket emit error:', err);
    }

    await clearCachePattern('cache:/api/products*');
    return res.status(200).json({ product });
  } catch (error: any) {
    console.error('PUT admin product error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update product' });
  }
}

export async function deleteAdminProduct(req: Request, res: Response) {
  try {
    if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await connectDB();
    const { id } = req.params;
    const hard = req.query.hard === 'true' && req.user.role === 'admin';

    if (hard) {
      await Product.findByIdAndDelete(id);
      await ProductVariant.deleteMany({ productId: id });
      await AuditLog.deleteMany({ productId: id });
    } else {
      await Product.findByIdAndUpdate(id, { isActive: false, status: 'Inactive' });
      
      const userObj = await User.findById(req.user.userId);
      const audit = new AuditLog({
        productId: id as any,
        action: 'delete',
        performedBy: req.user.userId,
        performedByName: userObj?.name || userObj?.email || 'Admin User',
        version: 1,
      });
      await audit.save();
    }

    // Broadcast deletion
    try {
      getIO().emit('product_changed', { action: 'delete', id });
    } catch (err) {
      console.error('Socket emit error:', err);
    }

    await clearCachePattern('cache:/api/products*');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('DELETE admin product error:', error);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
}
