import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/mongodb';
import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';
import { ChildCategory } from '../models/ChildCategory';
import { Collection } from '../models/Collection';
import { Product } from '../models/Product';
import { Brand } from '../models/Brand';
import { Warehouse } from '../models/Warehouse';
import { ProductVariant } from '../models/ProductVariant';
import { AuditLog } from '../models/AuditLog';

async function main() {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Connected!');

  console.log('Clearing existing categories, subcategories, child categories, collections, products, variants, and audit logs...');
  await Promise.all([
    Category.deleteMany({}),
    SubCategory.deleteMany({}),
    ChildCategory.deleteMany({}),
    Collection.deleteMany({}),
    Product.deleteMany({}),
    ProductVariant.deleteMany({}),
    AuditLog.deleteMany({})
  ]);
  console.log('Wipe complete!');

  // 1. Seed Brands
  console.log('Seeding Brands...');
  const brandsList = [
    { name: 'Vincent Chase', slug: 'vincent-chase', isActive: true },
    { name: 'John Jacobs', slug: 'john-jacobs', isActive: true },
    { name: 'Hustlr', slug: 'hustlr', isActive: true },
    { name: 'Lenskart Air', slug: 'lenskart-air', isActive: true },
  ];
  const brandMap: Record<string, any> = {};
  for (const b of brandsList) {
    const doc = await Brand.findOneAndUpdate(
      { slug: b.slug },
      b,
      { upsert: true, new: true }
    );
    brandMap[b.slug] = doc;
  }

  // 2. Seed Main Categories
  console.log('Seeding Main Categories...');
  const mainCategoriesList = [
    { name: 'Eyeglasses', code: 'CAT-EYEGLASSES', slug: 'eyeglasses', icon: '👓', displayOrder: 1 },
    { name: 'Sunglasses', code: 'CAT-SUNGLASSES', slug: 'sunglasses', icon: '🕶️', displayOrder: 2 },
    { name: 'Computer Glasses', code: 'CAT-COMPUTERGLASSES', slug: 'computer-glasses', icon: '💻', displayOrder: 3 },
    { name: 'Power Sunglasses', code: 'CAT-POWERSUNGLASSES', slug: 'power-sunglasses', icon: '☀️', displayOrder: 4 },
    { name: 'Reading Glasses', code: 'CAT-READINGGLASSES', slug: 'reading-glasses', icon: '📖', displayOrder: 5 },
  ];
  const categoryMap: Record<string, any> = {};
  for (const mc of mainCategoriesList) {
    const doc = await Category.findOneAndUpdate(
      { slug: mc.slug },
      { ...mc, status: 'Active', isDeleted: false, isActive: true },
      { upsert: true, new: true }
    );
    categoryMap[mc.slug] = doc;
  }

  // 3. Seed Sub Categories
  console.log('Seeding Sub Categories...');
  const eyeglassesSubs = [
    { name: 'Rectangle', code: 'SUBCAT-EYE-RECTANGLE', slug: 'eyeglasses-rectangle', displayOrder: 1 },
    { name: 'Round', code: 'SUBCAT-EYE-ROUND', slug: 'eyeglasses-round', displayOrder: 2 },
    { name: 'Aviator', code: 'SUBCAT-EYE-AVIATOR', slug: 'eyeglasses-aviator', displayOrder: 3 },
    { name: 'Wayfarer', code: 'SUBCAT-EYE-WAYFARER', slug: 'eyeglasses-wayfarer', displayOrder: 4 },
    { name: 'Cat Eye', code: 'SUBCAT-EYE-CATEYE', slug: 'eyeglasses-cat-eye', displayOrder: 5 },
    { name: 'Geometric', code: 'SUBCAT-EYE-GEOMETRIC', slug: 'eyeglasses-geometric', displayOrder: 6 },
    { name: 'Browline', code: 'SUBCAT-EYE-BROWLINE', slug: 'eyeglasses-browline', displayOrder: 7 },
    { name: 'Rimless', code: 'SUBCAT-EYE-RIMLESS', slug: 'eyeglasses-rimless', displayOrder: 8 },
    { name: 'Half Rim', code: 'SUBCAT-EYE-HALFRIM', slug: 'eyeglasses-half-rim', displayOrder: 9 },
  ];

  const sunglassesSubs = [
    { name: 'Aviator', code: 'SUBCAT-SUN-AVIATOR', slug: 'sunglasses-aviator', displayOrder: 1 },
    { name: 'Wayfarer', code: 'SUBCAT-SUN-WAYFARER', slug: 'sunglasses-wayfarer', displayOrder: 2 },
    { name: 'Sports', code: 'SUBCAT-SUN-SPORTS', slug: 'sunglasses-sports', displayOrder: 3 },
    { name: 'Round', code: 'SUBCAT-SUN-ROUND', slug: 'sunglasses-round', displayOrder: 4 },
    { name: 'Clubmaster', code: 'SUBCAT-SUN-CLUBMASTER', slug: 'sunglasses-clubmaster', displayOrder: 5 },
    { name: 'Cat Eye', code: 'SUBCAT-SUN-CATEYE', slug: 'sunglasses-cat-eye', displayOrder: 6 },
    { name: 'Oversized', code: 'SUBCAT-SUN-OVERSIZED', slug: 'sunglasses-oversized', displayOrder: 7 },
  ];

  const subCategoryMap: Record<string, any> = {};

  const createSubs = async (subs: typeof eyeglassesSubs, parentSlug: string) => {
    const parentId = categoryMap[parentSlug]._id;
    for (const sub of subs) {
      const doc = await SubCategory.findOneAndUpdate(
        { slug: sub.slug },
        { ...sub, categoryId: parentId, status: 'Active', isDeleted: false },
        { upsert: true, new: true }
      );
      subCategoryMap[sub.slug] = doc;
    }
  };

  await createSubs(eyeglassesSubs, 'eyeglasses');
  await createSubs(sunglassesSubs, 'sunglasses');

  // 4. Seed Child Categories and Collections
  console.log('Seeding Child Categories and Collections...');
  // Collections list
  const collectionsList = [
    { name: 'Air Flex', code: 'COL-AIR-FLEX', slug: 'air-flex' },
    { name: 'Classic', code: 'COL-CLASSIC', slug: 'classic' },
    { name: 'Carbon Fiber', code: 'COL-CARBON-FIBER', slug: 'carbon-fiber' },
    { name: 'Metal Sleek', code: 'COL-METAL-SLEEK', slug: 'metal-sleek' },
    { name: 'Titanium', code: 'COL-TITANIUM', slug: 'titanium' },
    { name: 'Acetate Signature', code: 'COL-ACETATE-SIGNATURE', slug: 'acetate-signature' },
  ];

  // We will seed a 'Unisex' ChildCategory for each subcategory, and associate our collections
  for (const subSlug in subCategoryMap) {
    const subDoc = subCategoryMap[subSlug];
    const childDoc = await ChildCategory.create({
      name: 'Unisex',
      code: `CHILD-UNISEX-${subDoc.code}`,
      slug: `${subSlug}-unisex`,
      subCategoryId: subDoc._id,
      status: 'Active',
      isDeleted: false
    });

    for (const col of collectionsList) {
      await Collection.create({
        name: col.name,
        code: `${col.code}-${subDoc.code}`,
        slug: `${col.slug}-${subDoc.slug}`,
        childCategoryId: childDoc._id,
        status: 'Active',
        isDeleted: false
      });
    }
  }

  // 5. Seed Warehouses
  console.log('Checking Warehouses...');
  const mainWh = await Warehouse.findOneAndUpdate(
    { code: 'WH-MUM-01' },
    {
      name: 'Mumbai Main Warehouse',
      code: 'WH-MUM-01',
      location: 'Mumbai, Maharashtra',
      isActive: true,
    },
    { upsert: true, new: true }
  );

  // 6. Seed Products
  console.log('Seeding Real Products...');
  const realProducts = [
    {
      sku: 'EG-VC-AIR-RECT',
      name: 'Vincent Chase Air Flex Rectangle Eyeglasses',
      slug: 'vincent-chase-air-flex-rectangle-eyeglasses',
      description: 'Super flexible, ultra-lightweight rectangular TR90 glasses from the Air Flex collection.',
      brand: 'Vincent Chase',
      brandId: brandMap['vincent-chase']._id,
      category: 'eyeglasses',
      categoryId: categoryMap['eyeglasses']._id,
      subCategory: 'Rectangle',
      subCategoryId: subCategoryMap['eyeglasses-rectangle']._id,
      collectionName: 'Air Flex',
      gender: 'unisex',
      price: { original: 1499, selling: 999 },
      mrp: 1499,
      sellingPrice: 999,
      costPrice: 350,
      status: 'Active',
      isActive: true,
      frame: {
        type: 'Rectangle',
        material: 'TR90',
        width: 138,
        lensWidth: 52,
        bridgeWidth: 18,
        templeLength: 140,
        featureTags: ['Lightweight', 'Flexible', 'Skin Friendly'],
      },
      frameType: 'Full Rim',
      material: 'TR90',
      shape: 'Rectangle',
      frameSize: 'Medium',
      frameColor: 'Matte Black',
      weight: '11g',
      faceShapes: ['Round', 'Oval', 'Heart'],
      images: ['/images/men_eyeglasses.png'],
      compatible: { prescription: true, bluecut: true, zeropower: true, progressive: true },
      lensCompatibility: ['Single Vision', 'Progressive', 'Zero Power'],
      tags: ['eyeglasses', 'rectangle', 'tr90', 'vincent chase', 'air flex'],
      rating: 4.6,
      reviewCount: 42,
      soldCount: 230,
      warehouseInventory: [
        {
          warehouseId: mainWh._id,
          warehouseName: mainWh.name,
          availableStock: 150,
          reservedStock: 0,
          safetyStock: 5,
          lowStockAlert: 10,
          reorderLevel: 20,
        },
      ],
    },
    {
      sku: 'EG-JJ-ACET-CATEYE',
      name: 'John Jacobs Acetate Signature Cat Eye Eyeglasses',
      slug: 'john-jacobs-acetate-signature-cat-eye-eyeglasses',
      description: 'Stunning premium acetate cat-eye eyeglasses for women who love style.',
      brand: 'John Jacobs',
      brandId: brandMap['john-jacobs']._id,
      category: 'eyeglasses',
      categoryId: categoryMap['eyeglasses']._id,
      subCategory: 'Cat Eye',
      subCategoryId: subCategoryMap['eyeglasses-cat-eye']._id,
      collectionName: 'Acetate Signature',
      gender: 'women',
      price: { original: 2999, selling: 1999 },
      mrp: 2999,
      sellingPrice: 1999,
      costPrice: 750,
      status: 'Active',
      isActive: true,
      frame: {
        type: 'Cat Eye',
        material: 'Acetate',
        width: 135,
        lensWidth: 50,
        bridgeWidth: 19,
        templeLength: 142,
        featureTags: ['Glossy Finish', 'Durable', 'Premium Fit'],
      },
      frameType: 'Full Rim',
      material: 'Acetate',
      shape: 'Cat Eye',
      frameSize: 'Medium',
      frameColor: 'Tortoise Gold',
      weight: '16g',
      faceShapes: ['Oval', 'Heart', 'Round'],
      images: ['/images/women_eyeglasses.png'],
      compatible: { prescription: true, bluecut: true, zeropower: true, progressive: false },
      lensCompatibility: ['Single Vision', 'Zero Power'],
      tags: ['eyeglasses', 'cat eye', 'acetate', 'john jacobs', 'women'],
      rating: 4.8,
      reviewCount: 29,
      soldCount: 88,
      warehouseInventory: [
        {
          warehouseId: mainWh._id,
          warehouseName: mainWh.name,
          availableStock: 60,
          reservedStock: 0,
          safetyStock: 5,
          lowStockAlert: 10,
          reorderLevel: 15,
        },
      ],
    },
    {
      sku: 'EG-LA-TITA-ROUND',
      name: 'Lenskart Air Titanium Round Eyeglasses',
      slug: 'lenskart-air-titanium-round-eyeglasses',
      description: 'Ultralight pure titanium round eyeglasses with corrosion-resistant premium finishing.',
      brand: 'Lenskart Air',
      brandId: brandMap['lenskart-air']._id,
      category: 'eyeglasses',
      categoryId: categoryMap['eyeglasses']._id,
      subCategory: 'Round',
      subCategoryId: subCategoryMap['eyeglasses-round']._id,
      collectionName: 'Titanium',
      gender: 'unisex',
      price: { original: 3499, selling: 2499 },
      mrp: 3499,
      sellingPrice: 2499,
      costPrice: 900,
      status: 'Active',
      isActive: true,
      frame: {
        type: 'Round',
        material: 'Titanium',
        width: 136,
        lensWidth: 49,
        bridgeWidth: 20,
        templeLength: 145,
        featureTags: ['Ultra Light', 'Corrosion Free', 'Pure Titanium'],
      },
      frameType: 'Full Rim',
      material: 'Titanium',
      shape: 'Round',
      frameSize: 'Medium',
      frameColor: 'Rose Gold',
      weight: '8g',
      faceShapes: ['Square', 'Oval', 'Rectangle'],
      images: ['/images/women_eyeglasses.png'],
      compatible: { prescription: true, bluecut: true, zeropower: true, progressive: true },
      lensCompatibility: ['Single Vision', 'Progressive', 'Zero Power'],
      tags: ['eyeglasses', 'round', 'titanium', 'lenskart air', 'lightweight'],
      rating: 4.9,
      reviewCount: 37,
      soldCount: 120,
      warehouseInventory: [
        {
          warehouseId: mainWh._id,
          warehouseName: mainWh.name,
          availableStock: 75,
          reservedStock: 0,
          safetyStock: 5,
          lowStockAlert: 10,
          reorderLevel: 15,
        },
      ],
    },
    {
      sku: 'SUN-HU-POL-AVIATOR',
      name: 'Hustlr Polarized Aviator Sunglasses',
      slug: 'hustlr-polarized-aviator-sunglasses',
      description: 'Double bridge pilot polarized sunglasses with UV400 protective lenses.',
      brand: 'Hustlr',
      brandId: brandMap['hustlr']._id,
      category: 'sunglasses',
      categoryId: categoryMap['sunglasses']._id,
      subCategory: 'Aviator',
      subCategoryId: subCategoryMap['sunglasses-aviator']._id,
      collectionName: 'Metal Sleek',
      gender: 'men',
      price: { original: 1999, selling: 1499 },
      mrp: 1999,
      sellingPrice: 1499,
      costPrice: 500,
      status: 'Active',
      isActive: true,
      frame: {
        type: 'Aviator',
        material: 'Metal',
        width: 142,
        lensWidth: 58,
        bridgeWidth: 14,
        templeLength: 140,
        featureTags: ['Polarized', 'Double Bridge', 'UV400'],
      },
      frameType: 'Full Rim',
      material: 'Metal',
      shape: 'Aviator',
      frameSize: 'Large',
      frameColor: 'Dark Gold',
      weight: '14g',
      faceShapes: ['Round', 'Oval', 'Square'],
      images: ['/images/men_sunglasses.png'],
      compatible: { prescription: false, bluecut: false, zeropower: true, progressive: false },
      lensCompatibility: ['Zero Power'],
      tags: ['sunglasses', 'aviator', 'polarized', 'hustlr', 'men'],
      rating: 4.7,
      reviewCount: 65,
      soldCount: 190,
      warehouseInventory: [
        {
          warehouseId: mainWh._id,
          warehouseName: mainWh.name,
          availableStock: 90,
          reservedStock: 0,
          safetyStock: 5,
          lowStockAlert: 10,
          reorderLevel: 20,
        },
      ],
    },
    {
      sku: 'SUN-JJ-WAYFARER-CLASSIC',
      name: 'John Jacobs Wayfarer Classic Sunglasses',
      slug: 'john-jacobs-wayfarer-classic-sunglasses',
      description: 'Modern tortoiseshell wayfarer sunglasses with high polarization coatings.',
      brand: 'John Jacobs',
      brandId: brandMap['john-jacobs']._id,
      category: 'sunglasses',
      categoryId: categoryMap['sunglasses']._id,
      subCategory: 'Wayfarer',
      subCategoryId: subCategoryMap['sunglasses-wayfarer']._id,
      collectionName: 'Classic',
      gender: 'unisex',
      price: { original: 2499, selling: 1799 },
      mrp: 2499,
      sellingPrice: 1799,
      costPrice: 650,
      status: 'Active',
      isActive: true,
      frame: {
        type: 'Wayfarer',
        material: 'Acetate',
        width: 140,
        lensWidth: 53,
        bridgeWidth: 19,
        templeLength: 145,
        featureTags: ['Acetate Premium', 'Polarized', 'UV Protection'],
      },
      frameType: 'Full Rim',
      material: 'Acetate',
      shape: 'Wayfarer',
      frameSize: 'Medium',
      frameColor: 'Tortoise Black',
      weight: '18g',
      faceShapes: ['Round', 'Oval', 'Heart'],
      images: ['/images/women_sunglasses.png'],
      compatible: { prescription: false, bluecut: false, zeropower: true, progressive: false },
      lensCompatibility: ['Zero Power'],
      tags: ['sunglasses', 'wayfarer', 'john jacobs', 'polarized'],
      rating: 4.8,
      reviewCount: 33,
      soldCount: 95,
      warehouseInventory: [
        {
          warehouseId: mainWh._id,
          warehouseName: mainWh.name,
          availableStock: 50,
          reservedStock: 0,
          safetyStock: 5,
          lowStockAlert: 5,
          reorderLevel: 10,
        },
      ],
    },
  ];

  for (const p of realProducts) {
    const product = await Product.findOneAndUpdate(
      { sku: p.sku },
      { ...p, currentVersion: 1 },
      { upsert: true, new: true }
    );

    // Create 2 real variants for each product
    const colors = [
      { name: 'Matte Charcoal', color: 'Charcoal', hex: '#2A2A2A', stock: p.warehouseInventory[0].availableStock / 2 },
      { name: 'Polished Gold/Black', color: 'Gold-Black', hex: '#D4AF37', stock: p.warehouseInventory[0].availableStock / 2 }
    ];

    for (const c of colors) {
      await ProductVariant.create({
        productId: product._id,
        name: `${product.name} - ${c.name}`,
        color: c.color,
        sku: `${product.sku}-${c.color.toUpperCase()}`,
        stock: c.stock,
        status: 'Active',
        images: product.images,
        priority: 1
      });
    }

    // Seed Audit Log
    await AuditLog.create({
      productId: product._id,
      action: 'create',
      performedBy: new mongoose.Types.ObjectId('6a30f027dc02afc2e5588f6f'),
      performedByName: 'Database Seeder',
      changes: p,
      version: 1,
    });

    console.log(`Successfully seeded Product: ${product.name} (SKU: ${product.sku})`);
  }

  console.log('Database seeding finished successfully!');
  await mongoose.disconnect();
  console.log('Disconnected!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeding script failed:', err);
  process.exit(1);
});
