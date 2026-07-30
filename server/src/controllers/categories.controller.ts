import { Request, Response } from 'express';
import { connectDB } from '../config/mongodb';
import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';
import { SubSubCategory } from '../models/SubSubCategory';
import { SubSubSubCategory } from '../models/SubSubSubCategory';

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
            .map((subsub: any) => {
              const subsubsubchildren = subSubSubCategories
                .filter((subsubsub: any) => String(subsubsub.subSubCategoryId) === String(subsub._id))
                .map((subsubsub: any) => ({
                  id: subsubsub._id,
                  _id: subsubsub._id,
                  name: subsubsub.name,
                  code: subsubsub.code,
                  slug: subsubsub.slug,
                  type: 'SubSubSubCategory',
                  displayOrder: subsubsub.displayOrder,
                }));

              return {
                id: subsub._id,
                _id: subsub._id,
                name: subsub.name,
                code: subsub.code,
                slug: subsub.slug,
                type: 'SubSubCategory',
                icon: subsub.icon,
                bannerImage: subsub.bannerImage,
                linkTo: subsub.linkTo,
                gender: subsub.gender,
                displayOrder: subsub.displayOrder,
                children: subsubsubchildren,
              };
            });

          return {
            id: sub._id,
            _id: sub._id,
            name: sub.name,
            code: sub.code,
            slug: sub.slug,
            type: 'SubCategory',
            icon: sub.icon,
            bannerImage: sub.bannerImage,
            linkTo: sub.linkTo,
            gender: sub.gender,
            shapeModal: sub.shapeModal,
            modalShapes: sub.modalShapes,
            displayOrder: sub.displayOrder,
            children: subsubchildren,
          };
        });

      return {
        ...cat,
        id: cat._id,
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
            .map((subsub: any) => {
              const subsubsubcats = subSubSubCategories
                .filter((subsubsub: any) => String(subsubsub.subSubCategoryId) === String(subsub._id))
                .map((subsubsub: any) => ({
                  id: subsubsub._id,
                  _id: subsubsub._id,
                  name: subsubsub.name,
                  code: subsubsub.code,
                  slug: subsubsub.slug,
                  type: 'SubSubSubCategory',
                  displayOrder: subsubsub.displayOrder,
                }));

              return {
                id: subsub._id,
                _id: subsub._id,
                name: subsub.name,
                code: subsub.code,
                slug: subsub.slug,
                type: 'SubSubCategory',
                icon: subsub.icon,
                bannerImage: subsub.bannerImage,
                linkTo: subsub.linkTo,
                gender: subsub.gender,
                displayOrder: subsub.displayOrder,
                children: subsubsubcats,
              };
            });

          return {
            id: sub._id,
            _id: sub._id,
            name: sub.name,
            code: sub.code,
            slug: sub.slug,
            type: 'SubCategory',
            icon: sub.icon,
            bannerImage: sub.bannerImage,
            linkTo: sub.linkTo,
            gender: sub.gender,
            shapeModal: sub.shapeModal,
            modalShapes: sub.modalShapes,
            displayOrder: sub.displayOrder,
            children: subsubcats,
          };
        });

      return {
        id: cat._id,
        _id: cat._id,
        name: cat.name,
        code: cat.code,
        slug: cat.slug,
        icon: cat.icon,
        bannerImage: cat.bannerImage,
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

