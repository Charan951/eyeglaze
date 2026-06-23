import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import { connectDB } from '../config/mongodb';
import { Product } from '../models/Product';
import { Brand } from '../models/Brand';
import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';
import { Warehouse } from '../models/Warehouse';
import { ProductVariant } from '../models/ProductVariant';
import { AuditLog } from '../models/AuditLog';

const ADMIN_USER_ID = '6a30f027dc02afc2e5588f6f';

async function main() {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Connected!');

  // Clear previous dynamic products if any
  console.log('Clearing existing dynamic products...');
  const prevProds = await Product.find({ sku: { $regex: /^EG-DYN-/ } });
  for (const p of prevProds) {
    await ProductVariant.deleteMany({ productId: p._id });
    await AuditLog.deleteMany({ productId: p._id });
    await Product.findByIdAndDelete(p._id);
  }

  // Fetch reference metadata
  const vcBrand = await Brand.findOne({ slug: 'vincent-chase' }) || { _id: new mongoose.Types.ObjectId() };
  const jjBrand = await Brand.findOne({ slug: 'john-jacobs' }) || { _id: new mongoose.Types.ObjectId() };
  const hustlrBrand = await Brand.findOne({ slug: 'hustlr' }) || { _id: new mongoose.Types.ObjectId() };

  const eyeCategory = await Category.findOne({ slug: 'eyeglasses' }) || { _id: new mongoose.Types.ObjectId() };
  const sunCategory = await Category.findOne({ slug: 'sunglasses' }) || { _id: new mongoose.Types.ObjectId() };
  const compCategory = await Category.findOne({ slug: 'computer-glasses' }) || { _id: new mongoose.Types.ObjectId() };

  const rectSub = await SubCategory.findOne({ slug: 'eyeglasses-rectangle' }) || { _id: new mongoose.Types.ObjectId() };
  const roundSub = await SubCategory.findOne({ slug: 'eyeglasses-round' }) || { _id: new mongoose.Types.ObjectId() };
  const aviatorSub = await SubCategory.findOne({ slug: 'sunglasses-aviator' }) || { _id: new mongoose.Types.ObjectId() };
  const cateyeSub = await SubCategory.findOne({ slug: 'eyeglasses-cat-eye' }) || { _id: new mongoose.Types.ObjectId() };
  const wayfarerSub = await SubCategory.findOne({ slug: 'eyeglasses-wayfarer' }) || { _id: new mongoose.Types.ObjectId() };

  const warehouse = await Warehouse.findOne({ code: 'WH-MUM-01' }) || { _id: new mongoose.Types.ObjectId(), name: 'Mumbai Main Warehouse' };

  console.log('Seeding 5 Premium Dynamic Eyewear Products...');

  const dynamicProducts = [
    {
      sku: 'EG-DYN-001',
      name: 'Vincent Chase Matte Black Rectangular Eyeglasses',
      slug: 'vincent-chase-matte-black-rectangular-eyeglasses',
      barcode: '890333200101',
      brand: 'Vincent Chase',
      brandId: vcBrand._id,
      category: 'eyeglasses',
      categoryId: eyeCategory._id,
      subCategory: 'Rectangle',
      subCategoryId: rectSub._id,
      gender: 'unisex',
      status: 'Active',
      launchDate: new Date('2026-06-01'),
      sortOrder: 1,
      shortDescription: 'Premium matte black rectangular eyeglasses with lightweight TR90 material.',
      longDescription: 'Crafted with premium TR90 memory polymer, these rectangular frames offer ultimate durability and feather-light comfort. Ideal for everyday office wear.',
      tags: ['flexible', 'lightweight', 'eyeglasses', 'rectangle'],
      costPrice: 350,
      price: { original: 1499, selling: 999 },
      mrp: 1499,
      sellingPrice: 999,
      gstPercent: 18,
      discountType: 'Percentage',
      discountValue: 33,
      profitMargin: 65,
      taxInclusive: true,
      currency: 'INR',
      enableMemberPricing: true,
      memberPrices: {
        regularPrice: 999,
        goldMemberPrice: 799,
        platinumMemberPrice: 699,
      },
      frameType: 'Full Rim',
      frameShape: 'Rectangle',
      material: 'TR90',
      primaryColor: 'Matte Black',
      frameWeight: '11g',
      estimatedDeliveryDays: 3,
      images: ['/images/dynamic_product_1.png'],
      thumbnail: '/images/dynamic_product_1.png',
      frontView: '/images/dynamic_product_1.png',
      rating: 4.7,
      reviewCount: 52,
      soldCount: 180,
      warehouseInventory: [
        {
          warehouseId: warehouse._id,
          warehouseName: warehouse.name,
          availableStock: 100,
          reservedStock: 5,
          safetyStock: 10,
          lowStockAlert: 15,
        }
      ]
    },
    {
      sku: 'EG-DYN-002',
      name: 'John Jacobs Classic Tortoiseshell Round Eyeglasses',
      slug: 'john-jacobs-classic-tortoiseshell-round-eyeglasses',
      barcode: '890333200102',
      brand: 'John Jacobs',
      brandId: jjBrand._id,
      category: 'eyeglasses',
      categoryId: eyeCategory._id,
      subCategory: 'Round',
      subCategoryId: roundSub._id,
      gender: 'unisex',
      status: 'Active',
      launchDate: new Date('2026-06-05'),
      sortOrder: 2,
      shortDescription: 'Retro-inspired acetate round frames with stunning tortoiseshell textures.',
      longDescription: 'Handcrafted premium tortoiseshell acetate frame featuring reinforced metal hinges and customized nosepad bindings for a snug fit.',
      tags: ['classic', 'round', 'acetate', 'unisex'],
      costPrice: 700,
      price: { original: 2499, selling: 1999 },
      mrp: 2499,
      sellingPrice: 1999,
      gstPercent: 18,
      discountType: 'Percentage',
      discountValue: 20,
      profitMargin: 65,
      taxInclusive: true,
      currency: 'INR',
      enableMemberPricing: true,
      memberPrices: {
        regularPrice: 1999,
        goldMemberPrice: 1599,
        platinumMemberPrice: 1499,
      },
      frameType: 'Full Rim',
      frameShape: 'Round',
      material: 'Acetate',
      primaryColor: 'Tortoiseshell',
      frameWeight: '14g',
      estimatedDeliveryDays: 2,
      images: ['/images/dynamic_product_2.png'],
      thumbnail: '/images/dynamic_product_2.png',
      frontView: '/images/dynamic_product_2.png',
      rating: 4.8,
      reviewCount: 41,
      soldCount: 95,
      warehouseInventory: [
        {
          warehouseId: warehouse._id,
          warehouseName: warehouse.name,
          availableStock: 80,
          reservedStock: 3,
          safetyStock: 8,
          lowStockAlert: 12,
        }
      ]
    },
    {
      sku: 'EG-DYN-003',
      name: 'Hustlr Metallic Gold Aviator Sunglasses',
      slug: 'hustlr-metallic-gold-aviator-sunglasses',
      barcode: '890333200103',
      brand: 'Hustlr',
      brandId: hustlrBrand._id,
      category: 'sunglasses',
      categoryId: sunCategory._id,
      subCategory: 'Aviator',
      subCategoryId: aviatorSub._id,
      gender: 'men',
      status: 'Active',
      launchDate: new Date('2026-06-10'),
      sortOrder: 3,
      shortDescription: 'Bold metallic aviator sunglasses with gold accents and polarized lenses.',
      longDescription: 'Sleek premium stainless steel aviator frame with solid double-bridge support. Complete with polarized UV400 lens filters.',
      tags: ['polarized', 'sunglasses', 'aviator', 'uv-protection'],
      costPrice: 600,
      price: { original: 2999, selling: 1899 },
      mrp: 2999,
      sellingPrice: 1899,
      gstPercent: 18,
      discountType: 'Percentage',
      discountValue: 36,
      profitMargin: 68,
      taxInclusive: true,
      currency: 'INR',
      enableMemberPricing: true,
      memberPrices: {
        regularPrice: 1899,
        goldMemberPrice: 1499,
        platinumMemberPrice: 1399,
      },
      frameType: 'Full Rim',
      frameShape: 'Aviator',
      material: 'Metal',
      primaryColor: 'Gold',
      frameWeight: '16g',
      estimatedDeliveryDays: 3,
      images: ['/images/dynamic_product_3.png'],
      thumbnail: '/images/dynamic_product_3.png',
      frontView: '/images/dynamic_product_3.png',
      rating: 4.6,
      reviewCount: 38,
      soldCount: 110,
      warehouseInventory: [
        {
          warehouseId: warehouse._id,
          warehouseName: warehouse.name,
          availableStock: 75,
          reservedStock: 4,
          safetyStock: 10,
          lowStockAlert: 15,
        }
      ]
    },
    {
      sku: 'EG-DYN-004',
      name: 'Vincent Chase Rose Gold Cat Eye Eyeglasses',
      slug: 'vincent-chase-rose-gold-cat-eye-eyeglasses',
      barcode: '890333200104',
      brand: 'Vincent Chase',
      brandId: vcBrand._id,
      category: 'eyeglasses',
      categoryId: eyeCategory._id,
      subCategory: 'Cat Eye',
      subCategoryId: cateyeSub._id,
      gender: 'women',
      status: 'Active',
      launchDate: new Date('2026-06-15'),
      sortOrder: 4,
      shortDescription: 'Chic rose gold cat-eye eyeglasses with lightweight wire temples.',
      longDescription: 'A gorgeous, lightweight cat-eye design that complements oval and round face shapes. The subtle rose gold alloy frame looks delicate yet is highly durable.',
      tags: ['cat-eye', 'rose-gold', 'eyeglasses', 'women'],
      costPrice: 450,
      price: { original: 1999, selling: 1399 },
      mrp: 1999,
      sellingPrice: 1399,
      gstPercent: 18,
      discountType: 'Percentage',
      discountValue: 30,
      profitMargin: 67,
      taxInclusive: true,
      currency: 'INR',
      enableMemberPricing: true,
      memberPrices: {
        regularPrice: 1399,
        goldMemberPrice: 1099,
        platinumMemberPrice: 999,
      },
      frameType: 'Full Rim',
      frameShape: 'Cat Eye',
      material: 'Metal',
      primaryColor: 'Rose Gold',
      frameWeight: '12g',
      estimatedDeliveryDays: 2,
      images: ['/images/dynamic_product_4.png'],
      thumbnail: '/images/dynamic_product_4.png',
      frontView: '/images/dynamic_product_4.png',
      rating: 4.9,
      reviewCount: 29,
      soldCount: 70,
      warehouseInventory: [
        {
          warehouseId: warehouse._id,
          warehouseName: warehouse.name,
          availableStock: 60,
          reservedStock: 2,
          safetyStock: 5,
          lowStockAlert: 8,
        }
      ]
    },
    {
      sku: 'EG-DYN-005',
      name: 'John Jacobs Crystal Clear Wayfarer Computer Glasses',
      slug: 'john-jacobs-crystal-clear-wayfarer-computer-glasses',
      barcode: '890333200105',
      brand: 'John Jacobs',
      brandId: jjBrand._id,
      category: 'computer-glasses',
      categoryId: compCategory._id,
      subCategory: 'Wayfarer',
      subCategoryId: wayfarerSub._id,
      gender: 'unisex',
      status: 'Active',
      launchDate: new Date('2026-06-20'),
      sortOrder: 5,
      shortDescription: 'Bold crystal-clear wayfarer frames featuring blue light protection filters.',
      longDescription: 'Protect your vision from harmful blue light. Features a modern crystal-clear acetate frame with zero power lenses, perfect for long sessions on digital screens.',
      tags: ['computer-glasses', 'blue-light', 'wayfarer', 'crystal-clear'],
      costPrice: 400,
      price: { original: 1799, selling: 1299 },
      mrp: 1799,
      sellingPrice: 1299,
      gstPercent: 18,
      discountType: 'Percentage',
      discountValue: 27,
      profitMargin: 69,
      taxInclusive: true,
      currency: 'INR',
      enableMemberPricing: true,
      memberPrices: {
        regularPrice: 1299,
        goldMemberPrice: 999,
        platinumMemberPrice: 899,
      },
      frameType: 'Full Rim',
      frameShape: 'Wayfarer',
      material: 'Acetate',
      primaryColor: 'Crystal Clear',
      frameWeight: '13g',
      estimatedDeliveryDays: 2,
      images: ['/images/dynamic_product_5.png'],
      thumbnail: '/images/dynamic_product_5.png',
      frontView: '/images/dynamic_product_5.png',
      rating: 4.7,
      reviewCount: 33,
      soldCount: 85,
      warehouseInventory: [
        {
          warehouseId: warehouse._id,
          warehouseName: warehouse.name,
          availableStock: 90,
          reservedStock: 6,
          safetyStock: 8,
          lowStockAlert: 12,
        }
      ]
    }
  ];

  for (const p of dynamicProducts) {
    const product = new Product(p);
    await product.save();

    // Seed 2 variants for each product
    const colors = [
      { name: 'Matte Charcoal', color: 'Charcoal', hex: '#2A2A2A', stock: 25, priceOverride: 0 },
      { name: 'Polished Amber', color: 'Amber', hex: '#D4AF37', stock: 15, priceOverride: 150 }
    ];

    for (const c of colors) {
      const variant = new ProductVariant({
        productId: product._id,
        name: `${product.name} - ${c.name}`,
        color: c.color,
        sku: `${product.sku}-${c.color.toUpperCase()}`,
        stock: c.stock,
        priceOverride: c.priceOverride || undefined,
        status: 'Active',
        images: [product.thumbnail],
        priority: 1
      });
      await variant.save();
    }

    // Seed Audit Log
    const audit = new AuditLog({
      productId: product._id,
      action: 'create',
      performedBy: new mongoose.Types.ObjectId(ADMIN_USER_ID),
      performedByName: 'System Database Seeder',
      changes: p,
      version: 1
    });
    await audit.save();

    console.log(`   Seeded product SKU: ${product.sku} | Name: ${product.name}`);
  }

  console.log('Database populated with 5 premium dynamic products successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
