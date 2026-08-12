import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/mongodb';
import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';
import { SubSubCategory } from '../models/SubSubCategory';
import { SubSubSubCategory } from '../models/SubSubSubCategory';
import { Product } from '../models/Product';

// A pool of existing static images already used elsewhere in the app —
// cycled through so sibling products don't all show the same picture.
const IMAGE_POOL = [
  '/images/men_eyeglasses.png',
  '/images/women_eyeglasses.png',
  '/images/kids_eyeglasses.png',
  '/images/men_sunglasses.png',
  '/images/women_sunglasses.png',
  '/images/kids_sunglasses.png',
  '/images/cat_prescription.png',
  '/images/cat_sunglasses.png',
  '/images/cat_blue_light.png',
  '/images/cat_contacts.png',
  '/images/cat_kids.png',
  '/images/zero_power_glasses.png',
  '/images/reading_book.png',
  '/images/transition_lens.png',
  '/images/sale_eyeglasses.png',
  '/images/sale_sunglasses.png',
  '/images/accessories.png',
  '/images/laptop_screen.png',
];

const COLOR_POOL = [
  { name: 'Matte Black', hex: '#1A1A1A' },
  { name: 'Tortoise Brown', hex: '#6B3A2A' },
  { name: 'Gunmetal Grey', hex: '#2C3539' },
  { name: 'Crystal Clear', hex: '#E8E8E8' },
  { name: 'Navy Blue', hex: '#1E3A5F' },
  { name: 'Rose Gold', hex: '#B76E79' },
];

let cursor = 0;
function nextImage(): string {
  return IMAGE_POOL[cursor % IMAGE_POOL.length];
}
function nextColor() {
  return COLOR_POOL[cursor % COLOR_POOL.length];
}
function nextPrice(): number {
  // Cycles through a spread of price points so siblings aren't all identical.
  const tiers = [499, 699, 899, 999, 1199, 1499, 1799, 1999, 2299, 2599, 2999];
  return tiers[cursor % tiers.length];
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

interface NodeSeedInput {
  name: string;
  skuPrefix: string;
  matchQuery: Record<string, any>;
  fields: Record<string, any>;
}

async function ensureProductForNode(input: NodeSeedInput): Promise<boolean> {
  const existing = await Product.findOne(input.matchQuery).lean();
  if (existing) return false;

  cursor++;
  const image = nextImage();
  const color = nextColor();
  const price = nextPrice();
  const sku = `${input.skuPrefix}-${randomSuffix()}`;
  const slug = slugify(`${input.name}-${sku}`);

  await Product.create({
    sku,
    slug,
    name: input.name,
    description: `${input.name} — a frame curated specifically for this catalog segment.`,
    frame: {
      type: 'Classic',
      material: 'TR90',
      width: 138,
      lensWidth: 52,
      bridgeWidth: 18,
      templeLength: 140,
      featureTags: ['Lightweight', 'Durable'],
    },
    frameType: 'Full Rim',
    material: 'TR90',
    colors: [
      { name: color.name, hex: color.hex, images: [image], stock: 40 },
    ],
    images: [image],
    price: { original: price + 500, selling: price },
    mrp: price + 500,
    sellingPrice: price,
    category: 'eyeglasses',
    categories: ['eyeglasses'],
    compatible: { prescription: true, bluecut: true, zeropower: true, progressive: true },
    lensCompatibility: ['Single Vision', 'Zero Power'],
    tags: [slugify(input.name)],
    rating: 0,
    reviewCount: 0,
    soldCount: 0,
    isActive: true,
    status: 'Active',
    meta: {
      seoTitle: `${input.name} - EyeGlaze`,
      seoDescription: `Shop ${input.name} at EyeGlaze.`,
    },
    ...input.fields,
  });

  return true;
}

async function main() {
  await connectDB();

  const [categories, subCategories, subSubCategories, subSubSubCategories] = await Promise.all([
    Category.find({ isDeleted: false }),
    SubCategory.find({ isDeleted: false }),
    SubSubCategory.find({ isDeleted: false }),
    SubSubSubCategory.find({ isDeleted: false }),
  ]);

  const categoryById = new Map(categories.map((c) => [String(c._id), c]));
  const subCategoryById = new Map(subCategories.map((s) => [String(s._id), s]));
  const subSubCategoryById = new Map(subSubCategories.map((s) => [String(s._id), s]));

  let created = 0;

  // 1. One product directly for each top-level Category (not tied to any sub-tier).
  for (const cat of categories) {
    const didCreate = await ensureProductForNode({
      name: `${cat.name} Signature Frame`,
      skuPrefix: `CAT-${(cat.code || cat.slug).toString().slice(0, 12)}`,
      matchQuery: {
        categoryId: cat._id,
        subCategoryId: { $exists: false },
        subSubCategoryId: { $exists: false },
      },
      fields: {
        category: cat.slug,
        categories: [cat.slug],
        categoryId: cat._id,
      },
    });
    if (didCreate) created++;
  }

  // 2. One product for each SubCategory.
  for (const sub of subCategories) {
    const parentCat = categoryById.get(String(sub.categoryId));
    const didCreate = await ensureProductForNode({
      name: `${sub.name} Essential Frame`,
      skuPrefix: `SUB-${(sub.code || sub.slug).toString().slice(0, 12)}`,
      matchQuery: {
        subCategoryId: sub._id,
        subSubCategoryId: { $exists: false },
      },
      fields: {
        category: parentCat?.slug || 'eyeglasses',
        categories: [parentCat?.slug || 'eyeglasses'],
        categoryId: sub.categoryId,
        subCategory: sub.slug,
        subCategoryId: sub._id,
        gender: sub.gender || undefined,
      },
    });
    if (didCreate) created++;
  }

  // 3. One product for each SubSubCategory.
  for (const subsub of subSubCategories) {
    const parentCat = categoryById.get(String(subsub.categoryId));
    const parentSub = subCategoryById.get(String(subsub.subCategoryId));
    const didCreate = await ensureProductForNode({
      name: subsub.name,
      skuPrefix: `SSC-${(subsub.code || subsub.slug).toString().slice(0, 12)}`,
      matchQuery: {
        subSubCategoryId: subsub._id,
        subSubSubCategoryId: { $exists: false },
      },
      fields: {
        category: parentCat?.slug || 'eyeglasses',
        categories: [parentCat?.slug || 'eyeglasses'],
        categoryId: subsub.categoryId,
        subCategory: parentSub?.slug,
        subCategoryId: subsub.subCategoryId,
        subSubCategory: subsub.slug,
        subSubCategoryId: subsub._id,
        gender: subsub.gender || undefined,
      },
    });
    if (didCreate) created++;
  }

  // 4. One product for each SubSubSubCategory (the deepest tier).
  for (const sss of subSubSubCategories) {
    const parentCat = categoryById.get(String(sss.categoryId));
    const parentSub = subCategoryById.get(String(sss.subCategoryId));
    const parentSubSub = subSubCategoryById.get(String(sss.subSubCategoryId));
    const didCreate = await ensureProductForNode({
      name: sss.name,
      skuPrefix: `SSSC-${(sss.code || sss.slug).toString().slice(0, 12)}`,
      matchQuery: {
        subSubSubCategoryId: sss._id,
      },
      fields: {
        category: parentCat?.slug || 'eyeglasses',
        categories: [parentCat?.slug || 'eyeglasses'],
        categoryId: sss.categoryId,
        subCategory: parentSub?.slug,
        subCategoryId: sss.subCategoryId,
        subSubCategory: parentSubSub?.slug,
        subSubCategoryId: sss.subSubCategoryId,
        subSubSubCategory: sss.slug,
        subSubSubCategoryId: sss._id,
      },
    });
    if (didCreate) created++;
  }

  console.log(`Done. Created ${created} new products across ${categories.length} categories, ${subCategories.length} sub-categories, ${subSubCategories.length} sub-sub-categories, ${subSubSubCategories.length} sub-sub-sub-categories.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('seedProductsForAllCategories failed:', err);
  process.exit(1);
});
