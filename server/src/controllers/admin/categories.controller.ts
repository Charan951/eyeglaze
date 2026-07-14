import { Request, Response } from 'express';
import { connectDB } from '../../config/mongodb';
import { Category } from '../../models/Category';
import { clearCachePattern } from '../../middleware/cache';
import { SubCategory } from '../../models/SubCategory';

import { CategoryAttribute } from '../../models/CategoryAttribute';
import { CategoryFilter } from '../../models/CategoryFilter';
import { CategorySeo } from '../../models/CategorySeo';
import { NavigationMenu } from '../../models/NavigationMenu';
import { AuditLog } from '../../models/AuditLog';
import { User } from '../../models/User';
import mongoose from 'mongoose';
import { getIO } from '../../lib/socket';

const ADMIN_ROLES = ['admin', 'store_manager'];

// Utility to resolve target model based on type
function getModelByType(type: string): mongoose.Model<any> {
  switch (type) {
    case 'Category':
      return Category;
    case 'SubCategory':
      return SubCategory;
    default:
      throw new Error(`Invalid category type: ${type}`);
  }
}

// 1. Get Categories List (paginated, sorted, searchable)
export async function getCategories(req: Request, res: Response) {
  try {
    await connectDB();
    const type = req.query.type as string | undefined;
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const isDeleted = req.query.isDeleted === 'true';
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '20');
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { isDeleted };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }

    let items: any[] = [];
    let total = 0;

    if (type) {
      const model = getModelByType(type);
      const docs = await model.find(query).sort({ displayOrder: 1, name: 1 }).skip(skip).limit(limit).lean();
      items = docs.map((d) => ({ ...d, type }));
      total = await model.countDocuments(query);
    } else {
      // Gather Category and SubCategory if no type is passed
      const [cats, subcats] = await Promise.all([
        Category.find(query).lean(),
        SubCategory.find(query).lean(),
      ]);

      const all = [
        ...cats.map((c) => ({ ...c, type: 'Category' })),
        ...subcats.map((s) => ({ ...s, type: 'SubCategory' })),
      ];

      // Sort in memory
      all.sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0) || a.name.localeCompare(b.name));
      total = all.length;
      items = all.slice(skip, skip + limit);
    }

    return res.status(200).json({ items, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    console.error('GET categories error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch categories' });
  }
}

// 2. Get Hierarchy Tree
export async function getCategoryTree(req: Request, res: Response) {
  try {
    await connectDB();
    const query = { isDeleted: false, status: 'Active' };

    const [categories, subCategories] = await Promise.all([
      Category.find(query).sort({ displayOrder: 1, name: 1 }).lean(),
      SubCategory.find(query).sort({ displayOrder: 1, name: 1 }).lean(),
    ]);

    // Build hierarchy
    const tree = categories.map((cat: any) => {
      const catSubcats = subCategories
        .filter((sub: any) => String(sub.categoryId) === String(cat._id))
        .map((sub: any) => {
          return {
            id: sub._id,
            name: sub.name,
            code: sub.code,
            slug: sub.slug,
            type: 'SubCategory',
            children: [],
          };
        });

      return {
        id: cat._id,
        name: cat.name,
        code: cat.code,
        slug: cat.slug,
        type: 'Category',
        children: catSubcats,
      };
    });

    return res.status(200).json({ tree });
  } catch (error: any) {
    console.error('GET category tree error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch tree structure' });
  }
}

// 3. Get Category Details with Metadata (Attributes, Filters, SEO)
export async function getCategoryDetails(req: Request, res: Response) {
  try {
    await connectDB();
    const { type, id } = req.params;
    const model = getModelByType(type as string);

    const doc = await model.findById(id).lean();
    if (!doc) {
      return res.status(404).json({ error: 'Category element not found' });
    }

    const [attributes, filters, seo] = await Promise.all([
      CategoryAttribute.findOne({ targetId: id, targetType: type }).lean(),
      CategoryFilter.findOne({ targetId: id, targetType: type }).lean(),
      CategorySeo.findOne({ targetId: id, targetType: type }).lean(),
    ]);

    return res.status(200).json({
      category: { ...doc, type },
      attributes: attributes || { genders: [], ageGroups: [], usageTypes: [], faceShapes: [], occasions: [] },
      filters: filters?.enabledFilters || {
        brand: true,
        price: true,
        color: true,
        frameShape: true,
        frameMaterial: true,
        frameWidth: true,
        lensType: true,
        weight: true,
        features: true,
        faceShape: true,
      },
      seo: seo || {},
    });
  } catch (error: any) {
    console.error('GET category details error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch details' });
  }
}

// 4. Create Category (Any tier) with full metadata
export async function createCategory(req: Request, res: Response) {
  try {
    if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await connectDB();
    const { type, basic, hierarchy, attributes, filters, seo } = req.body;

    if (!type || !basic?.name || !basic?.code) {
      return res.status(400).json({ error: 'Type, Name, and Code are required' });
    }

    const model = getModelByType(type);

    // Auto slug generation if empty
    const slug =
      basic.slug ||
      basic.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    // Check slug and code uniqueness
    const existingSlug = await model.findOne({ slug });
    if (existingSlug && !existingSlug.isDeleted) {
      return res.status(400).json({ error: `Slug '${slug}' already exists for type ${type}` });
    }
    const existingCode = await model.findOne({ code: basic.code });
    if (existingCode && !existingCode.isDeleted) {
      return res.status(400).json({ error: `Code '${basic.code}' already exists for type ${type}` });
    }

    const deletedDoc = (existingSlug?.isDeleted ? existingSlug : null) || (existingCode?.isDeleted ? existingCode : null);

    if (deletedDoc) {
      const targetId = deletedDoc._id;
      const docData: Record<string, any> = {
        name: basic.name,
        slug,
        code: basic.code,
        description: basic.description,
        displayOrder: basic.displayOrder || 0,
        status: basic.status || 'Active',
        isDeleted: false,
        deletedAt: null,
      };

      if (type === 'Category') {
        docData.icon = basic.icon;
        docData.bannerImage = basic.bannerImage;
        docData.parentCategory = undefined;
        docData.isActive = docData.status === 'Active';
      } else if (type === 'SubCategory') {
        if (!hierarchy?.categoryId) {
          return res.status(400).json({ error: 'categoryId hierarchy reference is required for SubCategory' });
        }
        docData.categoryId = hierarchy.categoryId;
      }

      const updatedDoc = await model.findByIdAndUpdate(targetId, { $set: docData }, { returnDocument: 'after' });

      const [attrDoc, filterDoc, seoDoc] = await Promise.all([
        CategoryAttribute.findOneAndUpdate(
          { targetId, targetType: type },
          {
            $set: {
              genders: attributes?.genders || [],
              ageGroups: attributes?.ageGroups || [],
              usageTypes: attributes?.usageTypes || [],
              faceShapes: attributes?.faceShapes || [],
              occasions: attributes?.occasions || [],
            },
          },
          { upsert: true, returnDocument: 'after' }
        ),

        CategoryFilter.findOneAndUpdate(
          { targetId, targetType: type },
          {
            $set: {
              enabledFilters: filters || {
                brand: true,
                price: true,
                color: true,
                frameShape: true,
                frameMaterial: true,
                frameWidth: true,
                lensType: true,
                weight: true,
                features: true,
                faceShape: true,
              }
            }
          },
          { upsert: true, returnDocument: 'after' }
        ),

        CategorySeo.findOneAndUpdate(
          { targetId, targetType: type },
          {
            $set: {
              seoTitle: seo?.seoTitle || basic.name,
              metaDescription: seo?.metaDescription || basic.description || '',
              keywords: seo?.keywords || '',
              canonicalUrl: seo?.canonicalUrl || '',
              slug: seo?.slug || slug,
              ogImage: seo?.ogImage || basic.bannerImage || '',
            },
          },
          { upsert: true, returnDocument: 'after' }
        ),
      ]);

      const userObj = await User.findById(req.user.userId);
      const audit = new AuditLog({
        action: 'restore',
        targetId,
        targetType: type,
        performedBy: req.user.userId,
        performedByName: userObj?.name || userObj?.email || 'Admin User',
        changes: { type, basic, hierarchy, attributes, filters, seo },
        version: 2,
      });
      await audit.save();

      return res.status(201).json({ category: updatedDoc, attributes: attrDoc, filters: filterDoc, seo: seoDoc });
    }

    // Prepare tier document
    const docData: Record<string, any> = {
      name: basic.name,
      slug,
      code: basic.code,
      description: basic.description,
      displayOrder: basic.displayOrder || 0,
      status: basic.status || 'Active',
      isDeleted: false,
    };

    if (type === 'Category') {
      docData.icon = basic.icon;
      docData.bannerImage = basic.bannerImage;
      docData.parentCategory = undefined; // For compatibility
      docData.isActive = docData.status === 'Active';
    } else if (type === 'SubCategory') {
      if (!hierarchy?.categoryId) {
        return res.status(400).json({ error: 'categoryId hierarchy reference is required for SubCategory' });
      }
      docData.categoryId = hierarchy.categoryId;
    }

    const newDoc = new model(docData);
    await newDoc.save();

    const targetId = newDoc._id;

    // Save Metadata (Attributes, Filters, SEO)
    const [attrDoc, filterDoc, seoDoc] = await Promise.all([
      new CategoryAttribute({
        targetId,
        targetType: type,
        genders: attributes?.genders || [],
        ageGroups: attributes?.ageGroups || [],
        usageTypes: attributes?.usageTypes || [],
        faceShapes: attributes?.faceShapes || [],
        occasions: attributes?.occasions || [],
      }).save(),

      new CategoryFilter({
        targetId,
        targetType: type,
        enabledFilters: filters || {
          brand: true,
          price: true,
          color: true,
          frameShape: true,
          frameMaterial: true,
          frameWidth: true,
          lensType: true,
          weight: true,
          features: true,
          faceShape: true,
        },
      }).save(),

      new CategorySeo({
        targetId,
        targetType: type,
        seoTitle: seo?.seoTitle || basic.name,
        metaDescription: seo?.metaDescription || basic.description || '',
        keywords: seo?.keywords || '',
        canonicalUrl: seo?.canonicalUrl || '',
        slug: seo?.slug || slug,
        ogImage: seo?.ogImage || basic.bannerImage || '',
      }).save(),
    ]);

    // Save Audit Log
    const userObj = await User.findById(req.user.userId);
    const audit = new AuditLog({
      action: 'create',
      targetId,
      targetType: type,
      performedBy: req.user.userId,
      performedByName: userObj?.name || userObj?.email || 'Admin User',
      changes: { type, basic, hierarchy, attributes, filters, seo },
      version: 1,
    });
    await audit.save();

    getIO().emit('category_changed', { action: 'create', category: newDoc });

    await clearCachePattern('cache:/api/categories*');
    await clearCachePattern('cache:/api/products*');
    return res.status(201).json({ category: newDoc, attributes: attrDoc, filters: filterDoc, seo: seoDoc });
  } catch (error: any) {
    console.error('CREATE category error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create category structure' });
  }
}

// 5. Update Category (Any tier)
export async function updateCategory(req: Request, res: Response) {
  try {
    if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await connectDB();
    const { type, id } = req.params;
    const { basic, hierarchy, attributes, filters, seo } = req.body;

    const model = getModelByType(type as string);
    const existingDoc = await model.findById(id);
    if (!existingDoc) {
      return res.status(404).json({ error: 'Category element not found' });
    }

    // Slug / code unique checks
    if (basic?.slug && basic.slug !== existingDoc.slug) {
      const exSlug = await model.findOne({ slug: basic.slug });
      if (exSlug) return res.status(400).json({ error: `Slug '${basic.slug}' already in use` });
    }
    if (basic?.code && basic.code !== existingDoc.code) {
      const exCode = await model.findOne({ code: basic.code });
      if (exCode) return res.status(400).json({ error: `Code '${basic.code}' already in use` });
    }

    // Set core update parameters
    const updateObj: Record<string, any> = {};
    if (basic?.name) updateObj.name = basic.name;
    if (basic?.slug) updateObj.slug = basic.slug;
    if (basic?.code) updateObj.code = basic.code;
    if (basic?.description !== undefined) updateObj.description = basic.description;
    if (basic?.displayOrder !== undefined) updateObj.displayOrder = basic.displayOrder;
    if (basic?.status) {
      updateObj.status = basic.status;
      if (type === 'Category') updateObj.isActive = basic.status === 'Active';
    }
    if (basic?.icon !== undefined) updateObj.icon = basic.icon;
    if (basic?.bannerImage !== undefined) updateObj.bannerImage = basic.bannerImage;

    // Hierarchy bindings
    if (type === 'SubCategory' && hierarchy?.categoryId) {
      updateObj.categoryId = hierarchy.categoryId;
    }

    const updatedDoc = await model.findByIdAndUpdate(id, { $set: updateObj }, { returnDocument: 'after' });

    // Update metadata
    await Promise.all([
      CategoryAttribute.findOneAndUpdate(
        { targetId: id, targetType: type },
        {
          $set: {
            genders: attributes?.genders || [],
            ageGroups: attributes?.ageGroups || [],
            usageTypes: attributes?.usageTypes || [],
            faceShapes: attributes?.faceShapes || [],
            occasions: attributes?.occasions || [],
          },
        },
        { upsert: true }
      ),

      CategoryFilter.findOneAndUpdate(
        { targetId: id, targetType: type },
        { $set: { enabledFilters: filters } },
        { upsert: true }
      ),

      CategorySeo.findOneAndUpdate(
        { targetId: id, targetType: type },
        {
          $set: {
            seoTitle: seo?.seoTitle || basic?.name,
            metaDescription: seo?.metaDescription || basic?.description || '',
            keywords: seo?.keywords || '',
            canonicalUrl: seo?.canonicalUrl || '',
            slug: seo?.slug || basic?.slug || existingDoc.slug,
            ogImage: seo?.ogImage || basic?.bannerImage || '',
          },
        },
        { upsert: true }
      ),
    ]);

    // Save Audit Log
    const userObj = await User.findById(req.user.userId);
    const audit = new AuditLog({
      action: 'update',
      targetId: id,
      targetType: type,
      performedBy: req.user.userId,
      performedByName: userObj?.name || userObj?.email || 'Admin User',
      changes: { type, id, basic, hierarchy, attributes, filters, seo },
      version: 2,
    });
    await audit.save();

    getIO().emit('category_changed', { action: 'update', category: updatedDoc });

    await clearCachePattern('cache:/api/categories*');
    await clearCachePattern('cache:/api/products*');
    return res.status(200).json({ category: updatedDoc });
  } catch (error: any) {
    console.error('UPDATE category error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update category' });
  }
}

// 6. Delete Category (Soft delete / Archive)
export async function deleteCategory(req: Request, res: Response) {
  try {
    if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await connectDB();
    const { type, id } = req.params;
    const hard = req.query.hard === 'true' && req.user.role === 'admin';
    const model = getModelByType(type as string);

    if (hard) {
      await Promise.all([
        model.findByIdAndDelete(id),
        CategoryAttribute.deleteMany({ targetId: id, targetType: type }),
        CategoryFilter.deleteMany({ targetId: id, targetType: type }),
        CategorySeo.deleteMany({ targetId: id, targetType: type }),
      ]);
    } else {
      // Soft delete
      await model.findByIdAndUpdate(id, {
        isDeleted: true,
        deletedAt: new Date(),
        status: 'Archived',
        ...(type === 'Category' ? { isActive: false } : {}),
      });
    }

    // Save Audit Log
    const userObj = await User.findById(req.user.userId);
    const audit = new AuditLog({
      action: 'delete',
      targetId: id,
      targetType: type,
      performedBy: req.user.userId,
      performedByName: userObj?.name || userObj?.email || 'Admin User',
      changes: { type, id, hard },
      version: 1,
    });
    await audit.save();

    getIO().emit('category_changed', { action: 'delete', id });

    await clearCachePattern('cache:/api/categories*');
    await clearCachePattern('cache:/api/products*');
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('DELETE category error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete category' });
  }
}

// 7. Restore Category
export async function restoreCategory(req: Request, res: Response) {
  try {
    if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await connectDB();
    const { type, id } = req.params;
    const model = getModelByType(type as string);

    await model.findByIdAndUpdate(id, {
      isDeleted: false,
      deletedAt: null,
      status: 'Active',
      ...(type === 'Category' ? { isActive: true } : {}),
    });

    // Save Audit Log
    const userObj = await User.findById(req.user.userId);
    const audit = new AuditLog({
      action: 'restore',
      targetId: id,
      targetType: type,
      performedBy: req.user.userId,
      performedByName: userObj?.name || userObj?.email || 'Admin User',
      changes: { type, id },
      version: 1,
    });
    await audit.save();

    getIO().emit('category_changed', { action: 'restore', id });

    await clearCachePattern('cache:/api/categories*');
    await clearCachePattern('cache:/api/products*');
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('RESTORE category error:', error);
    return res.status(500).json({ error: error.message || 'Failed to restore category' });
  }
}

// 8. Duplicate Category (Creates copy as Draft)
export async function duplicateCategory(req: Request, res: Response) {
  try {
    if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await connectDB();
    const { type, id } = req.params;
    const model = getModelByType(type as string);

    const original = await model.findById(id).lean();
    if (!original) {
      return res.status(404).json({ error: 'Original element not found' });
    }

    // Generate unique code & slug
    const timestamp = Date.now().toString().slice(-4);
    const duplicatedCode = `${original.code}-COPY-${timestamp}`;
    const duplicatedSlug = `${original.slug}-copy-${timestamp}`;

    const duplicatedData = {
      ...original,
      _id: undefined,
      code: duplicatedCode,
      slug: duplicatedSlug,
      name: `${original.name} (Copy)`,
      status: 'Draft',
      isDeleted: false,
      deletedAt: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    };

    const newDoc = new model(duplicatedData);
    await newDoc.save();

    const newTargetId = newDoc._id;

    // Clone metadata
    const [originalAttr, originalFilter, originalSeo] = await Promise.all([
      CategoryAttribute.findOne({ targetId: id, targetType: type }).lean(),
      CategoryFilter.findOne({ targetId: id, targetType: type }).lean(),
      CategorySeo.findOne({ targetId: id, targetType: type }).lean(),
    ]);

    await Promise.all([
      new CategoryAttribute({
        ...originalAttr,
        _id: undefined,
        targetId: newTargetId,
        createdAt: undefined,
        updatedAt: undefined,
      }).save(),

      new CategoryFilter({
        ...originalFilter,
        _id: undefined,
        targetId: newTargetId,
        createdAt: undefined,
        updatedAt: undefined,
      }).save(),

      new CategorySeo({
        ...originalSeo,
        _id: undefined,
        targetId: newTargetId,
        slug: duplicatedSlug,
        canonicalUrl: '',
        createdAt: undefined,
        updatedAt: undefined,
      }).save(),
    ]);

    // Save Audit Log
    const userObj = await User.findById(req.user.userId);
    const audit = new AuditLog({
      action: 'duplicate',
      targetId: newTargetId,
      targetType: type,
      performedBy: req.user.userId,
      performedByName: userObj?.name || userObj?.email || 'Admin User',
      changes: { originalId: id, duplicatedId: newTargetId, type },
      version: 1,
    });
    await audit.save();

    getIO().emit('category_changed', { action: 'duplicate', category: newDoc });

    await clearCachePattern('cache:/api/categories*');
    await clearCachePattern('cache:/api/products*');
    return res.status(201).json({ category: newDoc });
  } catch (error: any) {
    console.error('DUPLICATE category error:', error);
    return res.status(500).json({ error: error.message || 'Failed to duplicate category' });
  }
}

// 9. Export categories to CSV
export async function exportCategoriesToCSV(req: Request, res: Response) {
  try {
    await connectDB();
    const [categories, subCategories] = await Promise.all([
      Category.find({ isDeleted: false }).lean(),
      SubCategory.find({ isDeleted: false }).lean(),
    ]);

    let csvContent = 'Type,Name,Code,Slug,ParentCodeOrName,DisplayOrder,Status\n';

    categories.forEach((c) => {
      csvContent += `Category,"${c.name}",${c.code},${c.slug},N/A,${c.displayOrder},${c.status}\n`;
    });

    subCategories.forEach((s) => {
      // Find category code
      const parent = categories.find((c) => String(c._id) === String(s.categoryId));
      csvContent += `SubCategory,"${s.name}",${s.code},${s.slug},${parent?.code || 'N/A'},${s.displayOrder},${s.status}\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('eyeglaze_categories.csv');
    return res.status(200).send(csvContent);
  } catch (error: any) {
    console.error('CSV export error:', error);
    return res.status(500).json({ error: error.message || 'Failed to export categories' });
  }
}

// 10. Bulk Import categories from CSV
export async function importCategoriesFromCSV(req: Request, res: Response) {
  try {
    if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await connectDB();
    const { csvData } = req.body;

    if (!csvData) {
      return res.status(400).json({ error: 'CSV text data is required' });
    }

    const lines = csvData.split('\n').map((line: string) => line.trim()).filter(Boolean);
    if (lines.length <= 1) {
      return res.status(400).json({ error: 'No data to import' });
    }

    const skipped: string[] = [];
    let importedCount = 0;

    // Process row by row
    for (let i = 1; i < lines.length; i++) {
      // Split on commas, respecting quotes
      const match = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      if (!match || match.length < 3) {
        skipped.push(`Row ${i + 1}: Invalid format`);
        continue;
      }

      const type = match[0].trim();
      const name = match[1].replace(/"/g, '').trim();
      const code = match[2].trim();
      const slug = match[3]?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const parentCodeOrName = match[4]?.trim();
      const displayOrder = parseInt(match[5]?.trim() || '0') || 0;
      const status = (match[6]?.trim() as any) || 'Active';

      try {
        if (type === 'Category') {
          await Category.findOneAndUpdate(
            { code },
            { name, slug, code, displayOrder, status, isDeleted: false },
            { upsert: true }
          );
          importedCount++;
        } else if (type === 'SubCategory') {
          const parentCat = await Category.findOne({ $or: [{ code: parentCodeOrName }, { name: parentCodeOrName }] });
          if (!parentCat) {
            skipped.push(`Row ${i + 1}: Parent category '${parentCodeOrName}' not found`);
            continue;
          }
          await SubCategory.findOneAndUpdate(
            { code },
            { name, slug, code, categoryId: parentCat._id, displayOrder, status, isDeleted: false },
            { upsert: true }
          );
          importedCount++;
        } else {
          skipped.push(`Row ${i + 1}: Unknown or unsupported type '${type}'`);
        }
      } catch (err: any) {
        skipped.push(`Row ${i + 1}: Error - ${err.message}`);
      }
    }

    if (importedCount > 0) {
      getIO().emit('category_changed', { action: 'import' });
      await clearCachePattern('cache:/api/categories*');
      await clearCachePattern('cache:/api/products*');
    }

    return res.status(200).json({ success: true, importedCount, skipped });
  } catch (error: any) {
    console.error('CSV import error:', error);
    return res.status(500).json({ error: error.message || 'Failed to import categories' });
  }
}

// 11. Get Navigation Menu Configuration
export async function getNavigationMenu(req: Request, res: Response) {
  try {
    await connectDB();
    let menu = await NavigationMenu.findOne({ code: 'main_header' });
    if (!menu) {
      // Seed default main navigation structure
      menu = new NavigationMenu({
        name: 'Main Navigation Header',
        code: 'main_header',
        items: [
          {
            label: 'Eyeglasses',
            link: '/products?category=prescription',
            children: [
              { label: 'Men', link: '/products?category=prescription&gender=men' },
              { label: 'Women', link: '/products?category=prescription&gender=women' },
              { label: 'Kids', link: '/products?category=prescription&gender=kids' },
            ],
          },
          {
            label: 'Sunglasses',
            link: '/products?category=sunglasses',
            children: [
              { label: 'Men', link: '/products?category=sunglasses&gender=men' },
              { label: 'Women', link: '/products?category=sunglasses&gender=women' },
              { label: 'Sports', link: '/products?category=sunglasses&usage=sports' },
            ],
          },
        ],
      });
      await menu.save();
    }
    return res.status(200).json({ menu });
  } catch (error: any) {
    console.error('GET navigation menu error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch navigation configuration' });
  }
}

// 12. Update Navigation Menu Configuration
export async function updateNavigationMenu(req: Request, res: Response) {
  try {
    if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await connectDB();
    const { items } = req.body;

    const menu = await NavigationMenu.findOneAndUpdate(
      { code: 'main_header' },
      { $set: { items } },
      { upsert: true, returnDocument: 'after' }
    );

    await clearCachePattern('cache:/api/categories*');
    await clearCachePattern('cache:/api/products*');
    return res.status(200).json({ menu });
  } catch (error: any) {
    console.error('PUT navigation menu error:', error);
    return res.status(500).json({ error: error.message || 'Failed to save navigation config' });
  }
}
