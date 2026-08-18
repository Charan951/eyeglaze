import { Request, Response } from 'express';
import { connectDB } from '../config/mongodb';
import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';
import { SubSubCategory } from '../models/SubSubCategory';
import { SubSubSubCategory } from '../models/SubSubSubCategory';

// Legacy docs saved before the enable-toggle feature existed have no
// `*Enabled` field at all. Treat "field missing" as "enabled" when a
// value is already present, so old data keeps displaying as before.
// Once a doc is re-saved via the admin form, the explicit flag takes over.
function isBannerEnabled(doc: any): boolean {
  return doc.bannerImageEnabled !== undefined ? !!doc.bannerImageEnabled : !!doc.bannerImage;
}
function isPriceEnabled(doc: any): boolean {
  return doc.startingPriceEnabled !== undefined ? !!doc.startingPriceEnabled : doc.startingPrice != null;
}

export async function getPublicCategories(req: Request, res: Response) {
  try {
    await connectDB();
    const query = { isDeleted: false, status: 'Active' };
    const [categories, subcategories, subSubCategories, subSubSubCategories] = await Promise.all([
      Category.find(query).sort({ displayOrder: 1, name: 1 }).lean(),
      SubCategory.find(query).sort({ displayOrder: 1, name: 1 }).lean(),
      SubSubCategory.find(query).sort({ displayOrder: 1, name: 1 }).lean(),
      SubSubSubCategory.find(query).sort({ displayOrder: 1, name: 1 }).lean(),
    ]);

    const result = categories.map((cat: any) => {
      const children = subcategories
        .filter((sub: any) => String(sub.categoryId) === String(cat._id))
        .map((sub: any) => {
          const subsubchildren = subSubCategories
            .filter((subsub: any) => String(subsub.subCategoryId) === String(sub._id))
            .map((subsub: any) => ({
              id: subsub._id,
              _id: subsub._id,
              name: subsub.name,
              code: subsub.code,
              slug: subsub.slug,
              type: 'SubSubCategory',
              icon: subsub.icon,
              bannerImage: isBannerEnabled(subsub) ? subsub.bannerImage : '',
              linkTo: subsub.linkTo,
              gender: subsub.gender,
              displayOrder: subsub.displayOrder,
              children: [],
            }));

          const variants = subSubSubCategories
            .filter((v: any) => String(v.subCategoryId) === String(sub._id))
            .map((v: any) => ({
              id: v._id,
              _id: v._id,
              name: v.name,
              code: v.code,
              slug: v.slug,
              type: 'SubSubSubCategory',
              displayOrder: v.displayOrder,
            }));

          return {
            id: sub._id,
            _id: sub._id,
            name: sub.name,
            code: sub.code,
            slug: sub.slug,
            type: 'SubCategory',
            icon: sub.icon,
            bannerImage: isBannerEnabled(sub) ? sub.bannerImage : '',
            linkTo: sub.linkTo,
            gender: sub.gender,
            shapeModal: sub.shapeModal,
            modalShapes: sub.modalShapes,
            subSubCategoryModal: sub.subSubCategoryModal,
            modalSubSubCategories: sub.modalSubSubCategories,
            showInNavbar: sub.showInNavbar !== false,
            displayOrder: sub.displayOrder,
            children: subsubchildren,
            variants,
          };
        });

      return {
        ...cat,
        id: cat._id,
        bannerImage: isBannerEnabled(cat) ? cat.bannerImage : '',
        children,
      };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('getPublicCategories error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch categories' });
  }
}

export async function getPublicCategoryTree(req: Request, res: Response) {
  try {
    await connectDB();
    const query = { isDeleted: false, status: 'Active' };

    const [categories, subCategories, subSubCategories, subSubSubCategories] = await Promise.all([
      Category.find(query).sort({ displayOrder: 1, name: 1 }).lean(),
      SubCategory.find(query).sort({ displayOrder: 1, name: 1 }).lean(),
      SubSubCategory.find(query).sort({ displayOrder: 1, name: 1 }).lean(),
      SubSubSubCategory.find(query).sort({ displayOrder: 1, name: 1 }).lean(),
    ]);

    // Build hierarchy tree
    const tree = categories.map((cat: any) => {
      const catSubcats = subCategories
        .filter((sub: any) => String(sub.categoryId) === String(cat._id))
        .map((sub: any) => {
          const subsubcats = subSubCategories
            .filter((subsub: any) => String(subsub.subCategoryId) === String(sub._id))
            .map((subsub: any) => ({
              id: subsub._id,
              _id: subsub._id,
              name: subsub.name,
              code: subsub.code,
              slug: subsub.slug,
              type: 'SubSubCategory',
              icon: subsub.icon,
              bannerImage: isBannerEnabled(subsub) ? subsub.bannerImage : '',
              bannerImageEnabled: isBannerEnabled(subsub),
              startingPrice: isPriceEnabled(subsub) ? subsub.startingPrice : undefined,
              startingPriceEnabled: isPriceEnabled(subsub),
              linkTo: subsub.linkTo,
              gender: subsub.gender,
              displayOrder: subsub.displayOrder,
              children: [],
            }));

          const variants = subSubSubCategories
            .filter((v: any) => String(v.subCategoryId) === String(sub._id))
            .map((v: any) => ({
              id: v._id,
              _id: v._id,
              name: v.name,
              code: v.code,
              slug: v.slug,
              type: 'SubSubSubCategory',
              icon: v.icon,
              bannerImage: isBannerEnabled(v) ? v.bannerImage : '',
              bannerImageEnabled: isBannerEnabled(v),
              startingPrice: isPriceEnabled(v) ? v.startingPrice : undefined,
              startingPriceEnabled: isPriceEnabled(v),
              displayOrder: v.displayOrder,
            }));

          return {
            id: sub._id,
            _id: sub._id,
            name: sub.name,
            code: sub.code,
            slug: sub.slug,
            type: 'SubCategory',
            icon: sub.icon,
            bannerImage: isBannerEnabled(sub) ? sub.bannerImage : '',
            bannerImageEnabled: isBannerEnabled(sub),
            startingPrice: isPriceEnabled(sub) ? sub.startingPrice : undefined,
            startingPriceEnabled: isPriceEnabled(sub),
            linkTo: sub.linkTo,
            gender: sub.gender,
            shapeModal: sub.shapeModal,
            modalShapes: sub.modalShapes,
            subSubCategoryModal: sub.subSubCategoryModal,
            modalSubSubCategories: sub.modalSubSubCategories,
            showInNavbar: sub.showInNavbar !== false,
            displayOrder: sub.displayOrder,
            children: subsubcats,
            variants,
          };
        });

      return {
        id: cat._id,
        _id: cat._id,
        name: cat.name,
        code: cat.code,
        slug: cat.slug,
        icon: cat.icon,
        bannerImage: isBannerEnabled(cat) ? cat.bannerImage : '',
        description: cat.description,
        type: 'Category',
        subCategoryShape: cat.subCategoryShape || 'square',
        subCategorySize: cat.subCategorySize || 'medium',
        subCategoryColumns: cat.subCategoryColumns || 4,
        showInNavbar: cat.showInNavbar !== false,
        children: catSubcats,
      };
    });

    return res.status(200).json({ tree });
  } catch (error: any) {
    console.error('getPublicCategoryTree error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch public category tree' });
  }
}

