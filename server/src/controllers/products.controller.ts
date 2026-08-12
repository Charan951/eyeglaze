import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { connectDB } from '../config/mongodb';
import { Product } from '../models/Product';
import { ProductVariant } from '../models/ProductVariant';
import { AuditLog } from '../models/AuditLog';
import { Review } from '../models/Review';
import { Lens } from '../models/Lens';
import { LensType } from '../models/LensType';
import { clearCachePattern } from '../middleware/cache';
import { escapeRegExp } from '../lib/regex';
import { getIO } from '../lib/socket';

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
    const subCategory = req.query.subCategory as string | undefined;
    const subCategoryId = req.query.subCategoryId as string | undefined;
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
      let normalizedList = [category];
      if (category === 'prescription' || category === 'eyeglasses') {
        normalizedList = ['prescription', 'eyeglasses'];
      } else if (category === 'bluelight' || category === 'blue_light' || category === 'computer-glasses') {
        normalizedList = ['blue_light', 'computer-glasses'];
      } else if (category === 'contact' || category === 'contact-lenses' || category === 'contact_lenses' || category === 'contact-lens') {
        normalizedList = ['contact-lenses', 'contact_lenses', 'contact-lens', 'contact'];
      } else if (category === 'power-sunglasses') {
        normalizedList = ['power-sunglasses'];
      } else if (category === 'reading-glasses') {
        normalizedList = ['reading-glasses'];
      }
      andConditions.push({
        $or: [
          { category: { $in: normalizedList } },
          { categories: { $in: normalizedList } }
        ]
      });
    }

    if (subCategory) {
      const escapedSub = escapeRegExp(subCategory);
      const subRegex = new RegExp(`^${escapedSub.replace(/-/g, ' ')}$|^${escapedSub}$`, 'i');
      andConditions.push({
        $or: [
          { subCategory: { $regex: subRegex } },
          { subCategory: subCategory }
        ]
      });
    }

    if (subCategoryId) {
      andConditions.push({ subCategoryId: subCategoryId });
    }

    const subSubCategory = req.query.subSubCategory as string | undefined;
    const subSubCategoryId = req.query.subSubCategoryId as string | undefined;

    if (subSubCategory) {
      const escapedSubSub = escapeRegExp(subSubCategory);
      const subSubRegex = new RegExp(`^${escapedSubSub.replace(/-/g, ' ')}$|^${escapedSubSub}$`, 'i');
      andConditions.push({
        $or: [
          { subSubCategory: { $regex: subSubRegex } },
          { subSubCategory: subSubCategory }
        ]
      });
    }

    if (subSubCategoryId) {
      andConditions.push({ subSubCategoryId: subSubCategoryId });
    }

    const subSubSubCategory = req.query.subSubSubCategory as string | undefined;
    const subSubSubCategoryId = req.query.subSubSubCategoryId as string | undefined;

    if (subSubSubCategory) {
      const escapedSubSubSub = escapeRegExp(subSubSubCategory);
      const subSubSubRegex = new RegExp(`^${escapedSubSubSub.replace(/-/g, ' ')}$|^${escapedSubSubSub}$`, 'i');
      andConditions.push({
        $or: [
          { subSubSubCategory: { $regex: subSubSubRegex } },
          { subSubSubCategory: subSubSubCategory }
        ]
      });
    }

    if (subSubSubCategoryId) {
      andConditions.push({ subSubSubCategoryId: subSubSubCategoryId });
    }

    if (search) {
      const escapedSearch = escapeRegExp(search);
      andConditions.push({
        $or: [
          { name: { $regex: escapedSearch, $options: 'i' } },
          { sku: { $regex: escapedSearch, $options: 'i' } },
          { tags: { $regex: escapedSearch, $options: 'i' } },
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
      const shapeRegexes = shapes.map(s => new RegExp(`^${escapeRegExp(s)}$`, 'i'));
      andConditions.push({
        $or: [
          { shape: { $in: shapeRegexes } },
          { 'frame.type': { $in: shapeRegexes } },
          { frameType: { $in: shapeRegexes } },
        ],
      });
    }

    const frameSizes = parseCommaParam(req.query.frameSize || req.query.size);
    if (frameSizes) {
      const sizeRegexes = frameSizes.map(s => new RegExp(`^${escapeRegExp(s)}$`, 'i'));
      const ageGroupTerms: string[] = [];
      if (frameSizes.some(s => s.toLowerCase() === 'small')) ageGroupTerms.push('juniors', 'small');
      if (frameSizes.some(s => s.toLowerCase() === 'medium')) ageGroupTerms.push('tweens', 'medium');
      if (frameSizes.some(s => s.toLowerCase() === 'large')) ageGroupTerms.push('teens', 'large');
      if (frameSizes.some(s => s.toLowerCase() === 'sale')) ageGroupTerms.push('kids on sale', 'sale');

      const ageRegexes = ageGroupTerms.map(a => new RegExp(escapeRegExp(a), 'i'));

      andConditions.push({
        $or: [
          { kidsAgeGroups: { $in: ageRegexes } },
          {
            $and: [
              { $or: [{ kidsAgeGroups: { $exists: false } }, { kidsAgeGroups: { $size: 0 } }] },
              { $or: [{ frameSize: { $in: sizeRegexes } }, { availableSizes: { $in: frameSizes } }] }
            ]
          }
        ]
      });
    }

    const frameColors = parseCommaParam(req.query.frameColor || req.query.color);
    if (frameColors) {
      andConditions.push({
        $or: [
          { frameColor: { $in: frameColors } },
          { 'colors.name': { $regex: frameColors.map(c => `^${escapeRegExp(c)}$|\\b${escapeRegExp(c)}\\b`).join('|'), $options: 'i' } },
        ],
      });
    }

    const frameTypes = parseCommaParam(req.query.frameType);
    if (frameTypes) {
      const shapeList = ['Square', 'Round', 'Clubmaster', 'Aviator', 'Wayfarer', 'Cat Eye', 'Hexagonal', 'Rectangle', 'Oval', 'Geometric'];
      const hasLegacyShapes = frameTypes.some(t => shapeList.includes(t));
      if (hasLegacyShapes) {
        const frameTypesRegexes = frameTypes.map(t => new RegExp(`^${escapeRegExp(t)}$`, 'i'));
        andConditions.push({
          $or: [
            { shape: { $in: frameTypesRegexes } },
            { 'frame.type': { $in: frameTypesRegexes } },
            { frameType: { $in: frameTypesRegexes } },
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
      const isKidsFilter = genders.some(g => g.toLowerCase() === 'kids');
      if (isKidsFilter) {
        andConditions.push({
          $or: [
            { gender: { $in: [new RegExp('kids', 'i')] } },
            { subCategory: { $in: [new RegExp('kids', 'i'), '6a608f61f19254d4d7917ba4'] } },
            { kidsAgeGroups: { $exists: true, $not: { $size: 0 } } }
          ]
        });
      } else {
        const genderRegexes = genders.map(g => new RegExp(`^${escapeRegExp(g)}$`, 'i'));
        andConditions.push({ gender: { $in: genderRegexes } });
      }
    }

    const isPremium = req.query.isPremium as string | undefined;
    if (isPremium === 'true') {
      andConditions.push({ isPremium: true });
    }

    // Contact Lens specific filters: disposable / wearTime / type / power
    const disposable = req.query.disposable as string | undefined || req.query.wearTime as string | undefined;
    if (disposable && disposable.trim() !== '') {
      const escapedDisp = escapeRegExp(disposable);
      let dispRegex = new RegExp(escapedDisp, 'i');
      if (disposable.toLowerCase().includes('daily') || disposable.toLowerCase().includes('dailies')) {
        dispRegex = /daily|dailies|1-day|day/i;
      } else if (disposable.toLowerCase().includes('monthly') || disposable.toLowerCase().includes('month')) {
        dispRegex = /monthly|month|30-day/i;
      } else if (disposable.toLowerCase().includes('yearly') || disposable.toLowerCase().includes('year')) {
        dispRegex = /yearly|year|annual/i;
      } else if (disposable.toLowerCase().includes('bi-weekly') || disposable.toLowerCase().includes('weekly')) {
        dispRegex = /weekly|bi-weekly|2-week/i;
      }
      andConditions.push({
        $or: [
          { disposable: { $regex: dispRegex } },
          { wearTime: { $regex: dispRegex } },
          { name: { $regex: dispRegex } },
          { tags: { $regex: dispRegex } },
          { description: { $regex: dispRegex } }
        ]
      });
    }

    const typeParam = req.query.type as string | undefined || req.query.power as string | undefined;
    if (typeParam && typeParam.trim() !== '') {
      const escapedType = escapeRegExp(typeParam);
      let typeRegex = new RegExp(escapedType, 'i');
      if (typeParam.toLowerCase().includes('toric') || typeParam.toLowerCase().includes('cylinder')) {
        typeRegex = /toric|astigmatism|cylinder|cylindrical/i;
      } else if (typeParam.toLowerCase().includes('multi') || typeParam.toLowerCase().includes('focal')) {
        typeRegex = /multifocal|multi-focal|bifocal|progressive/i;
      } else if (typeParam.toLowerCase().includes('distance') || typeParam.toLowerCase().includes('spherical')) {
        typeRegex = /distance|spherical|clear|power/i;
      } else if (typeParam.toLowerCase().includes('zero')) {
        typeRegex = /zero|plano|0\.00|no power/i;
      } else if (typeParam.toLowerCase().includes('solution')) {
        typeRegex = /solution|cleaner|fluid/i;
      }
      andConditions.push({
        $or: [
          { subSubCategory: { $regex: typeRegex } },
          { contactType: { $regex: typeRegex } },
          { powerType: { $regex: typeRegex } },
          { type: { $regex: typeRegex } },
          { name: { $regex: typeRegex } },
          { tags: { $regex: typeRegex } }
        ]
      });
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

function cleanObjectIdFields(body: any) {
  if (!body || typeof body !== 'object') return;
  const keys = [
    'brandId',
    'categoryId',
    'subCategoryId',
    'subSubCategoryId',
    'subSubSubCategoryId',
    'warehouseId',
    'lensTypeId',
    'lensId',
  ];
  for (const key of keys) {
    if (key in body && (body[key] === '' || (typeof body[key] === 'string' && !body[key].trim()))) {
      body[key] = null;
    }
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    await connectDB();
    const body = req.body || {};
    cleanObjectIdFields(body);

    if (!body.sku) {
      const lastProduct = await Product.findOne().sort({ createdAt: -1 });
      const lastNum = lastProduct?.sku?.match(/\d+$/)?.[0];
      const nextNum = lastNum ? String(parseInt(lastNum) + 1).padStart(4, '0') : '0001';
      body.sku = `EG-${nextNum}`;
    }

    const product = new Product(body);
    await product.save();
    await clearCachePattern('cache:/api/products*');
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

    const solutionSelect = 'name sku thumbnail images price sellingPrice mrp';
    let product;
    if (id.startsWith('EG-')) {
      product = await Product.findOne({ sku: id }).populate('lensTypes').populate('linkedSolutions.solutionId', solutionSelect);
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id).populate('lensTypes').populate('linkedSolutions.solutionId', solutionSelect);
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

    // Fetch all active lens types to map product-specific custom lenses
    const allLensTypes = await LensType.find({ status: 'Active' });

    // Apply product-specific price overrides if present in dynamicLensPricing
    const overriddenLenses = lenses.map(lensDoc => {
      const lensObj = lensDoc.toObject();
      if (product.dynamicLensPricing && Array.isArray(product.dynamicLensPricing)) {
        const override = product.dynamicLensPricing.find(
          (o: any) => o.lensName === lensObj.name
        );
        if (override) {
          if (override.status === 'Inactive') {
            lensObj.status = 'Inactive';
          } else {
            lensObj.basePrice = override.regularPrice;
            if (override.goldPrice !== undefined) {
              lensObj.memberPrice = override.goldPrice;
            }
          }
        }
      }
      return lensObj;
    }).filter(lens => lens.status === 'Active');

    // Find any product-specific custom lenses in dynamicLensPricing that do not match global lenses
    const customLenses: any[] = [];
    if (product.dynamicLensPricing && Array.isArray(product.dynamicLensPricing)) {
      const unmatchedPricing = product.dynamicLensPricing.filter((o: any) => {
        return o.status === 'Active' && !lenses.some(lensDoc => lensDoc.name === o.lensName);
      });

      unmatchedPricing.forEach((o: any) => {
        // Prioritize matching types from product's compatible lensTypes first
        let matchingType = (product.lensTypes || []).find((t: any) => {
          const typeName = typeof t === 'object' ? t.name : '';
          return typeName.toLowerCase() === o.lensCategory.toLowerCase();
        });

        // Fallback to searching all active lens types
        if (!matchingType) {
          matchingType = allLensTypes.find(t => t.name.toLowerCase() === o.lensCategory.toLowerCase());
        }

        customLenses.push({
          _id: `custom-${o._id || new mongoose.Types.ObjectId()}`,
          name: o.lensName,
          basePrice: o.regularPrice,
          memberPrice: o.goldPrice,
          status: o.status || 'Active',
          isProductSpecific: true,
          lensType: matchingType ? { _id: matchingType._id || matchingType, name: (matchingType as any).name } : undefined,
          minSph: o.minSph !== undefined ? o.minSph : -20,
          maxSph: o.maxSph !== undefined ? o.maxSph : 20,
          minCyl: o.minCyl !== undefined ? o.minCyl : -6,
          maxCyl: o.maxCyl !== undefined ? o.maxCyl : 6,
        });
      });
    }

    return res.status(200).json({ 
      product, 
      reviews, 
      lenses: [...overriddenLenses, ...customLenses] 
    });
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
    cleanObjectIdFields(body);

    const product = await Product.findByIdAndUpdate(id, { $set: body }, { returnDocument: 'after' });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await clearCachePattern('cache:/api/products*');
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

    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await ProductVariant.deleteMany({ productId: id });
    await AuditLog.deleteMany({ productId: id });

    try {
      getIO().emit('product_changed', { action: 'delete', id });
    } catch (err) {
      console.error('Socket emit error:', err);
    }

    await clearCachePattern('cache:/api/products*');
    return res.status(200).json({ success: true, message: 'Product deleted successfully from database' });
  } catch (error) {
    console.error('DELETE product error:', error);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
}
