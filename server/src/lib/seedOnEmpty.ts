import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';
import { SubSubCategory } from '../models/SubSubCategory';
import catalogSeed from './catalogSeed.json';

type TypeSeed = {
  name: string;
  slug: string;
  code: string;
  icon?: string;
  bannerImage?: string;
  bannerImageEnabled?: boolean;
  description?: string;
  displayOrder?: number;
  status?: string;
  linkTo?: string;
  gender?: string;
  startingPrice?: number;
  startingPriceEnabled?: boolean;
  variants?: unknown[];
};

type CollectionSeed = {
  name: string;
  slug: string;
  code: string;
  icon?: string;
  bannerImage?: string;
  bannerImageEnabled?: boolean;
  description?: string;
  displayOrder?: number;
  status?: string;
  linkTo?: string;
  gender?: string;
  startingPrice?: number;
  startingPriceEnabled?: boolean;
  shapeModal?: boolean;
  modalShapes?: string[];
  subSubCategoryModal?: boolean;
  modalSubSubCategories?: string[];
  showInNavbar?: boolean;
  types?: TypeSeed[];
};

type CategorySeed = {
  name: string;
  slug: string;
  code: string;
  icon?: string;
  bannerImage?: string;
  bannerImageEnabled?: boolean;
  description?: string;
  displayOrder?: number;
  status?: string;
  showInNavbar?: boolean;
  subCategoryShape?: 'square' | 'circle' | 'rectangle';
  subCategorySize?: 'small' | 'medium' | 'large';
  subCategoryColumns?: number;
  collections?: CollectionSeed[];
};

function withImageFlags<T extends { bannerImage?: string; bannerImageEnabled?: boolean }>(data: T) {
  return {
    ...data,
    bannerImageEnabled: data.bannerImageEnabled ?? Boolean(data.bannerImage),
    isDeleted: false,
    status: data.status || 'Active',
  };
}

/** Create the env admin account only when no admin exists yet. */
export async function seedAdminIfEmpty() {
  const exists = await User.exists({ role: 'admin' });
  if (exists) return;

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@gmail.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin@123';
  const password = await bcrypt.hash(adminPassword, 10);

  await User.create({
    name: 'EyeGlaze Admin',
    email: adminEmail,
    password,
    mobile: '9999999999',
    phone: '9999999999',
    countryCode: '+91',
    role: 'admin',
    isVerified: true,
    membershipActive: false,
  });

  console.log(`Empty database — seeded admin (${adminEmail})`);
}

/** Insert the current catalog tree only when there are no categories. */
export async function seedCatalogIfEmpty() {
  const exists = await Category.exists({});
  if (exists) return;

  console.log('Empty database — seeding categories, collections, and types with images...');

  const tree = catalogSeed as CategorySeed[];

  for (const cat of tree) {
    const { collections = [], ...catData } = cat;
    const catDoc = await Category.create({
      ...withImageFlags(catData),
      isActive: (catData.status || 'Active') === 'Active',
    });

    for (const col of collections) {
      const { types = [], ...colData } = col;
      const colDoc = await SubCategory.create({
        ...withImageFlags(colData),
        categoryId: catDoc._id,
      });

      for (const type of types) {
        const { variants: _variants, ...typeData } = type;
        await SubSubCategory.create({
          ...withImageFlags(typeData),
          categoryId: catDoc._id,
          subCategoryId: colDoc._id,
        });
      }
    }
  }

  console.log('Catalog seed complete.');
}
