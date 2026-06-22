import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/mongodb';
import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';
import { CategoryAttribute } from '../models/CategoryAttribute';
import { CategoryFilter } from '../models/CategoryFilter';
import { CategorySeo } from '../models/CategorySeo';
import { Product } from '../models/Product';
import { Brand } from '../models/Brand';
import { Warehouse } from '../models/Warehouse';

async function main() {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Connected!');

  console.log('Clearing existing categories and category metadata collections...');
  await Category.deleteMany({});
  await SubCategory.deleteMany({});
  await CategoryAttribute.deleteMany({});
  await CategoryFilter.deleteMany({});
  await CategorySeo.deleteMany({});

  // 1. Seed Main Categories
  const mainCategoriesList = [
    { name: 'Eyeglasses', code: 'CAT-EYEGLASSES', slug: 'eyeglasses', icon: '👓', displayOrder: 1 },
    { name: 'Sunglasses', code: 'CAT-SUNGLASSES', slug: 'sunglasses', icon: '🕶️', displayOrder: 2 },
    { name: 'Computer Glasses', code: 'CAT-COMPUTERGLASSES', slug: 'computer-glasses', icon: '💻', displayOrder: 3 },
    { name: 'Power Sunglasses', code: 'CAT-POWERSUNGLASSES', slug: 'power-sunglasses', icon: '☀️', displayOrder: 4 },
    { name: 'Reading Glasses', code: 'CAT-READINGGLASSES', slug: 'reading-glasses', icon: '📖', displayOrder: 5 },
    { name: 'Contact Lenses', code: 'CAT-CONTACTLENSES', slug: 'contact-lenses', icon: '👁️', displayOrder: 6 },
    { name: 'Accessories', code: 'CAT-ACCESSORIES', slug: 'accessories', icon: '💼', displayOrder: 7 },
  ];

  console.log('Seeding Main Categories...');
  const mainCategoryMap: Record<string, mongoose.Types.ObjectId> = {};

  for (const mc of mainCategoriesList) {
    const doc = await Category.findOneAndUpdate(
      { slug: mc.slug },
      {
        name: mc.name,
        code: mc.code,
        slug: mc.slug,
        icon: mc.icon,
        displayOrder: mc.displayOrder,
        status: 'Active',
        isDeleted: false,
        isActive: true,
      },
      { upsert: true, new: true }
    );
    mainCategoryMap[mc.slug] = doc._id as mongoose.Types.ObjectId;

    // Seed polymorphic metadata for Main Category
    await CategoryAttribute.findOneAndUpdate(
      { targetId: doc._id, targetType: 'Category' },
      {
        genders: ['Men', 'Women', 'Kids', 'Unisex'],
        ageGroups: ['0-5', '6-12', '13-18', '18-25', '26-35', '36-50', '50+'],
        usageTypes: ['Daily Wear', 'Office Wear', 'Computer Use', 'Driving', 'Reading', 'Gaming', 'Sports', 'Outdoor', 'Fashion'],
        faceShapes: ['Round', 'Oval', 'Square', 'Heart', 'Diamond', 'Rectangle', 'Triangle'],
        occasions: ['Casual', 'Formal', 'Business', 'Party', 'Travel', 'Sports', 'Premium'],
      },
      { upsert: true }
    );

    await CategoryFilter.findOneAndUpdate(
      { targetId: doc._id, targetType: 'Category' },
      {
        enabledFilters: {
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
      },
      { upsert: true }
    );

    await CategorySeo.findOneAndUpdate(
      { targetId: doc._id, targetType: 'Category' },
      {
        seoTitle: `Shop ${mc.name} Online | EyeGlaze`,
        metaDescription: `Discover the best collection of ${mc.name} at EyeGlaze. High quality frames and lenses.`,
        keywords: `${mc.name.toLowerCase()}, eyeglaze, eyewear, online shop`,
        canonicalUrl: `https://eyeglaze.in/products/${mc.slug}`,
        slug: mc.slug,
        ogImage: '',
      },
      { upsert: true }
    );
  }

  // 2. Seed Sub Categories
  const eyeglassesSubs = [
    { name: 'Rectangle', code: 'SUBCAT-EYE-RECTANGLE', slug: 'eyeglasses-rectangle' },
    { name: 'Round', code: 'SUBCAT-EYE-ROUND', slug: 'eyeglasses-round' },
    { name: 'Aviator', code: 'SUBCAT-EYE-AVIATOR', slug: 'eyeglasses-aviator' },
    { name: 'Wayfarer', code: 'SUBCAT-EYE-WAYFARER', slug: 'eyeglasses-wayfarer' },
    { name: 'Cat Eye', code: 'SUBCAT-EYE-CATEYE', slug: 'eyeglasses-cat-eye' },
    { name: 'Geometric', code: 'SUBCAT-EYE-GEOMETRIC', slug: 'eyeglasses-geometric' },
    { name: 'Browline', code: 'SUBCAT-EYE-BROWLINE', slug: 'eyeglasses-browline' },
    { name: 'Rimless', code: 'SUBCAT-EYE-RIMLESS', slug: 'eyeglasses-rimless' },
    { name: 'Half Rim', code: 'SUBCAT-EYE-HALFRIM', slug: 'eyeglasses-half-rim' },
  ];

  const sunglassesSubs = [
    { name: 'Aviator', code: 'SUBCAT-SUN-AVIATOR', slug: 'sunglasses-aviator' },
    { name: 'Wayfarer', code: 'SUBCAT-SUN-WAYFARER', slug: 'sunglasses-wayfarer' },
    { name: 'Sports', code: 'SUBCAT-SUN-SPORTS', slug: 'sunglasses-sports' },
    { name: 'Round', code: 'SUBCAT-SUN-ROUND', slug: 'sunglasses-round' },
    { name: 'Clubmaster', code: 'SUBCAT-SUN-CLUBMASTER', slug: 'sunglasses-clubmaster' },
    { name: 'Cat Eye', code: 'SUBCAT-SUN-CATEYE', slug: 'sunglasses-cat-eye' },
    { name: 'Oversized', code: 'SUBCAT-SUN-OVERSIZED', slug: 'sunglasses-oversized' },
  ];

  console.log('Seeding Sub Categories...');
  const subCategoryMap: Record<string, mongoose.Types.ObjectId> = {};

  const processSubs = async (subs: typeof eyeglassesSubs, parentSlug: string) => {
    const parentId = mainCategoryMap[parentSlug];
    for (const sub of subs) {
      const doc = await SubCategory.findOneAndUpdate(
        { slug: sub.slug },
        {
          name: sub.name,
          code: sub.code,
          slug: sub.slug,
          categoryId: parentId,
          status: 'Active',
          isDeleted: false,
        },
        { upsert: true, new: true }
      );
      subCategoryMap[sub.slug] = doc._id as mongoose.Types.ObjectId;

      // Seed polymorphic metadata for SubCategory
      await CategoryAttribute.findOneAndUpdate(
        { targetId: doc._id, targetType: 'SubCategory' },
        {
          genders: ['Men', 'Women', 'Kids', 'Unisex'],
          ageGroups: ['13-18', '18-25', '26-35', '36-50'],
          usageTypes: ['Daily Wear', 'Office Wear', 'Driving', 'Outdoor', 'Fashion'],
          faceShapes: ['Round', 'Oval', 'Square', 'Heart'],
          occasions: ['Casual', 'Formal', 'Business', 'Travel'],
        },
        { upsert: true }
      );

      await CategoryFilter.findOneAndUpdate(
        { targetId: doc._id, targetType: 'SubCategory' },
        {
          enabledFilters: {
            brand: true,
            price: true,
            color: true,
            frameShape: true,
            frameMaterial: true,
            faceShape: true,
          },
        },
        { upsert: true }
      );

      await CategorySeo.findOneAndUpdate(
        { targetId: doc._id, targetType: 'SubCategory' },
        {
          seoTitle: `Shop ${sub.name} ${parentSlug === 'eyeglasses' ? 'Eyeglasses' : 'Sunglasses'} Online | EyeGlaze`,
          metaDescription: `Discover the best collection of ${sub.name} frames under ${parentSlug} at EyeGlaze.`,
          keywords: `${sub.name.toLowerCase()}, ${parentSlug}, eyeglaze, eyewear`,
          canonicalUrl: `https://eyeglaze.in/products/${parentSlug}/${sub.slug}`,
          slug: sub.slug,
          ogImage: '',
        },
        { upsert: true }
      );
    }
  };

  await processSubs(eyeglassesSubs, 'eyeglasses');
  await processSubs(sunglassesSubs, 'sunglasses');

  // 3. Seed Brands (ensure they exist)
  console.log('Checking Brands...');
  const vcBrand = await Brand.findOneAndUpdate(
    { slug: 'vincent-chase' },
    { name: 'Vincent Chase', slug: 'vincent-chase', isActive: true },
    { upsert: true, new: true }
  );

  const jjBrand = await Brand.findOneAndUpdate(
    { slug: 'john-jacobs' },
    { name: 'John Jacobs', slug: 'john-jacobs', isActive: true },
    { upsert: true, new: true }
  );

  const hustlrBrand = await Brand.findOneAndUpdate(
    { slug: 'hustlr' },
    { name: 'Hustlr', slug: 'hustlr', isActive: true },
    { upsert: true, new: true }
  );

  // 4. Seed Warehouses
  console.log('Checking Warehouses...');
  const mainWh = await Warehouse.findOne({ code: 'WH-MUM-01' });
  const warehouseId = mainWh ? mainWh._id : new mongoose.Types.ObjectId();
  const warehouseName = mainWh ? mainWh.name : 'Mumbai Main Warehouse';

  if (!mainWh) {
    await new Warehouse({
      _id: warehouseId,
      name: warehouseName,
      code: 'WH-MUM-01',
      location: 'Mumbai, Maharashtra',
      isActive: true,
    }).save();
  }

  // 5. Seed 5 Sample Products
  console.log('Seeding 5 Sample Products linked to categories...');

  const sampleProductsList = [
    {
      sku: 'EG-VC-RECT-01',
      name: 'Vincent Chase Classic Rectangular Eyeglasses',
      slug: 'vincent-chase-classic-rectangular-eyeglasses',
      description: 'Super lightweight matte rectangular frame, designed for daily comfort.',
      brand: 'Vincent Chase',
      brandId: vcBrand._id,
      category: 'prescription', // legacy
      categories: ['prescription', 'eyeglasses'],
      categoryId: mainCategoryMap['eyeglasses'],
      subCategoryId: subCategoryMap['eyeglasses-rectangle'],
      gender: 'unisex',
      price: { original: 1499, selling: 999 },
      mrp: 1499,
      sellingPrice: 999,
      costPrice: 400,
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
      weight: 'Lightweight',
      faceShapes: ['Round', 'Oval', 'Heart'],
      isPremium: false,
      colors: [
        { name: 'Matte Black', hex: '#1A1A1A', stock: 45, images: ['/images/men_eyeglasses.png'] },
        { name: 'Navy Blue', hex: '#0B1D3A', stock: 30, images: ['/images/men_eyeglasses.png'] },
      ],
      images: ['/images/men_eyeglasses.png'],
      compatible: { prescription: true, bluecut: true, zeropower: true, progressive: true },
      lensCompatibility: ['Single Vision', 'Progressive', 'Zero Power'],
      tags: ['eyeglasses', 'rectangle', 'tr90', 'vincent chase'],
      rating: 4.6,
      reviewCount: 28,
      soldCount: 140,
      warehouseInventory: [
        {
          warehouseId,
          warehouseName,
          availableStock: 75,
          reservedStock: 0,
          safetyStock: 5,
          lowStockAlert: 10,
          reorderLevel: 20,
        },
      ],
    },
    {
      sku: 'EG-JJ-ROUND-01',
      name: 'John Jacobs Premium Round Eyeglasses',
      slug: 'john-jacobs-premium-round-eyeglasses',
      description: 'Chic and lightweight round metal glasses with acetate temple details.',
      brand: 'John Jacobs',
      brandId: jjBrand._id,
      category: 'prescription', // legacy
      categories: ['prescription', 'eyeglasses'],
      categoryId: mainCategoryMap['eyeglasses'],
      subCategoryId: subCategoryMap['eyeglasses-round'],
      gender: 'women',
      price: { original: 2499, selling: 1999 },
      mrp: 2499,
      sellingPrice: 1999,
      costPrice: 800,
      status: 'Active',
      isActive: true,
      frame: {
        type: 'Round',
        material: 'Metal',
        width: 135,
        lensWidth: 50,
        bridgeWidth: 20,
        templeLength: 145,
        featureTags: ['Corrosion Resistant', 'Durable', 'Premium Optics'],
      },
      frameType: 'Full Rim',
      material: 'Metal',
      shape: 'Round',
      frameSize: 'Medium',
      frameColor: 'Rose Gold',
      weight: 'Lightweight',
      faceShapes: ['Square', 'Oval', 'Rectangle'],
      isPremium: true,
      colors: [
        { name: 'Rose Gold', hex: '#B76E79', stock: 25, images: ['/images/women_eyeglasses.png'] },
        { name: 'Silver Black', hex: '#C0C0C0', stock: 15, images: ['/images/women_eyeglasses.png'] },
      ],
      images: ['/images/women_eyeglasses.png'],
      compatible: { prescription: true, bluecut: true, zeropower: true, progressive: false },
      lensCompatibility: ['Single Vision', 'Zero Power'],
      tags: ['eyeglasses', 'round', 'metal', 'john jacobs', 'women'],
      rating: 4.8,
      reviewCount: 19,
      soldCount: 40,
      warehouseInventory: [
        {
          warehouseId,
          warehouseName,
          availableStock: 40,
          reservedStock: 0,
          safetyStock: 5,
          lowStockAlert: 10,
          reorderLevel: 15,
        },
      ],
    },
    {
      sku: 'SUN-HU-AVI-01',
      name: 'Hustlr Aviator Polarized Sunglasses',
      slug: 'hustlr-aviator-polarized-sunglasses',
      description: 'Perfect pilot-style double-bridge sunglasses with polarized UV400 lenses.',
      brand: 'Hustlr',
      brandId: hustlrBrand._id,
      category: 'sunglasses', // legacy
      categories: ['sunglasses'],
      categoryId: mainCategoryMap['sunglasses'],
      subCategoryId: subCategoryMap['sunglasses-aviator'],
      gender: 'men',
      price: { original: 1999, selling: 1499 },
      mrp: 1999,
      sellingPrice: 1499,
      costPrice: 550,
      status: 'Active',
      isActive: true,
      frame: {
        type: 'Aviator',
        material: 'Metal',
        width: 142,
        lensWidth: 58,
        bridgeWidth: 14,
        templeLength: 140,
        featureTags: ['Polarized', 'Double Bridge', 'UV400 Shield'],
      },
      frameType: 'Full Rim',
      material: 'Metal',
      shape: 'Aviator',
      frameSize: 'Large',
      frameColor: 'Gold',
      weight: 'Lightweight',
      faceShapes: ['Oval', 'Round', 'Square'],
      isPremium: false,
      colors: [
        { name: 'Gold Dark Green', hex: '#D4AF37', stock: 50, images: ['/images/men_sunglasses.png'] },
        { name: 'Matte Black Grey', hex: '#1C1C1C', stock: 35, images: ['/images/men_sunglasses.png'] },
      ],
      images: ['/images/men_sunglasses.png'],
      compatible: { prescription: false, bluecut: false, zeropower: true, progressive: false },
      lensCompatibility: ['Zero Power'],
      tags: ['sunglasses', 'aviator', 'polarized', 'hustlr', 'men'],
      rating: 4.7,
      reviewCount: 34,
      soldCount: 85,
      warehouseInventory: [
        {
          warehouseId,
          warehouseName,
          availableStock: 85,
          reservedStock: 0,
          safetyStock: 5,
          lowStockAlert: 10,
          reorderLevel: 20,
        },
      ],
    },
    {
      sku: 'SUN-JJ-WAY-01',
      name: 'John Jacobs Clubmaster Wayfarer Sunglasses',
      slug: 'john-jacobs-clubmaster-wayfarer-sunglasses',
      description: 'Stunning acetate upper browline style combined with golden metal rim sunglasses.',
      brand: 'John Jacobs',
      brandId: jjBrand._id,
      category: 'sunglasses', // legacy
      categories: ['sunglasses'],
      categoryId: mainCategoryMap['sunglasses'],
      subCategoryId: subCategoryMap['sunglasses-wayfarer'],
      gender: 'unisex',
      price: { original: 2999, selling: 2299 },
      mrp: 2999,
      sellingPrice: 2299,
      costPrice: 900,
      status: 'Active',
      isActive: true,
      frame: {
        type: 'Wayfarer',
        material: 'Acetate',
        width: 140,
        lensWidth: 53,
        bridgeWidth: 19,
        templeLength: 145,
        featureTags: ['Acetate Premium', 'Corrosion Resistant', 'Polarized Lenses'],
      },
      frameType: 'Full Rim',
      material: 'Acetate',
      shape: 'Wayfarer',
      frameSize: 'Medium',
      frameColor: 'Tortoise Gold',
      weight: 'Medium',
      faceShapes: ['Round', 'Oval', 'Heart'],
      isPremium: true,
      colors: [
        { name: 'Tortoise Gold', hex: '#4B3621', stock: 20, images: ['/images/women_sunglasses.png'] },
        { name: 'Glossy Black Gold', hex: '#000000', stock: 30, images: ['/images/women_sunglasses.png'] },
      ],
      images: ['/images/women_sunglasses.png'],
      compatible: { prescription: false, bluecut: false, zeropower: true, progressive: false },
      lensCompatibility: ['Zero Power'],
      tags: ['sunglasses', 'wayfarer', 'clubmaster', 'acetate', 'john jacobs'],
      rating: 4.9,
      reviewCount: 12,
      soldCount: 50,
      warehouseInventory: [
        {
          warehouseId,
          warehouseName,
          availableStock: 50,
          reservedStock: 0,
          safetyStock: 5,
          lowStockAlert: 5,
          reorderLevel: 10,
        },
      ],
    },
    {
      sku: 'COMP-VC-BOSS-01',
      name: 'Vincent Chase Screen Boss Computer Glasses',
      slug: 'vincent-chase-screen-boss-computer-glasses',
      description: 'Zero-power blue light blocking eyeglasses to shield eyes from digital monitors.',
      brand: 'Vincent Chase',
      brandId: vcBrand._id,
      category: 'blue_light', // legacy
      categories: ['blue_light'],
      categoryId: mainCategoryMap['computer-glasses'],
      subCategoryId: undefined,
      gender: 'unisex',
      price: { original: 1499, selling: 899 },
      mrp: 1499,
      sellingPrice: 899,
      costPrice: 350,
      status: 'Active',
      isActive: true,
      frame: {
        type: 'Square',
        material: 'TR90',
        width: 136,
        lensWidth: 50,
        bridgeWidth: 18,
        templeLength: 140,
        featureTags: ['Blue Cut Coating', 'Anti Glare', 'Ultra Comfortable'],
      },
      frameType: 'Full Rim',
      material: 'TR90',
      shape: 'Rectangle',
      frameSize: 'Medium',
      frameColor: 'Crystal Clear',
      weight: 'Lightweight',
      faceShapes: ['Round', 'Oval', 'Heart', 'Square'],
      isPremium: false,
      colors: [
        { name: 'Crystal Clear', hex: '#F0F0F0', stock: 60, images: ['/images/cat_blue_light.png'] },
        { name: 'Crystal Grey', hex: '#D3D3D3', stock: 40, images: ['/images/cat_blue_light.png'] },
      ],
      images: ['/images/cat_blue_light.png'],
      compatible: { prescription: false, bluecut: true, zeropower: true, progressive: false },
      lensCompatibility: ['Zero Power'],
      tags: ['computer glasses', 'blue cut', 'anti glare', 'vincent chase', 'unisex'],
      rating: 4.5,
      reviewCount: 46,
      soldCount: 220,
      warehouseInventory: [
        {
          warehouseId,
          warehouseName,
          availableStock: 100,
          reservedStock: 0,
          safetyStock: 10,
          lowStockAlert: 15,
          reorderLevel: 30,
        },
      ],
    },
  ];

  for (const p of sampleProductsList) {
    await Product.findOneAndUpdate(
      { sku: p.sku },
      { ...p, currentVersion: 1 },
      { upsert: true }
    );
  }

  console.log('Seeding completed successfully!');
  await mongoose.disconnect();
  console.log('Disconnected!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
