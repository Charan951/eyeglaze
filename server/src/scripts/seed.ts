import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../lib/mongodb';

// Inline model definitions to avoid module issues in standalone scripts
const LensOptionSchema = new mongoose.Schema({
  kind: { type: String, enum: ['type', 'quality'], required: true },
  type: String,
  subType: String,
  displayName: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  startingPrice: Number,
  features: [String],
  badge: String,
  isBestseller: { type: Boolean, default: false },
  isRecommended: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

const ProductColorSchema = new mongoose.Schema({
  name: String,
  hex: String,
  swatchImage: String,
  images: [String],
  stock: { type: Number, default: 0 },
});

const ProductSchema = new mongoose.Schema(
  {
    sku: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    description: String,
    frame: {
      type: { type: String },
      material: String,
      width: Number,
      lensWidth: Number,
      bridgeWidth: Number,
      templeLength: Number,
      featureTags: [String],
    },
    frameType: String,
    material: String,
    colors: [ProductColorSchema],
    images: [String],
    price: { original: { type: Number, default: 999 }, selling: { type: Number, default: 1 } },
    category: String,
    categories: [String],
    compatible: {
      prescription: { type: Boolean, default: false },
      bluecut: { type: Boolean, default: false },
      zeropower: { type: Boolean, default: false },
      progressive: { type: Boolean, default: false },
    },
    tags: [String],
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    isBestseller: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    meta: { seoTitle: String, seoDescription: String },
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    phone: { type: String, unique: true, sparse: true },
    mobile: { type: String, unique: true, sparse: true },
    countryCode: { type: String, default: '+91' },
    email: { type: String, unique: true, sparse: true, lowercase: true },
    otp: String,
    otpExpiry: Date,
    isVerified: { type: Boolean, default: false },
    name: String,
    role: { type: String, enum: ['user', 'admin', 'customer', 'store_manager', 'support_agent'], default: 'user' },
    addresses: [],
    wishlist: [],
    membershipActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

async function main() {
  console.log('Connecting to MongoDB...');
  await connectDB();
  console.log('Connected!');

  const LensOption = mongoose.models.LensOption || mongoose.model('LensOption', LensOptionSchema);
  const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  // ---- Seed Lens Options ----
  console.log('Seeding lens options...');

  const lensTypes = [
    {
      kind: 'type',
      type: 'single_vision',
      displayName: 'Single Vision',
      name: 'Single Vision',
      description: 'Corrects near or farsightedness. Best for everyday use.',
      price: 699,
      startingPrice: 699,
      features: ['Anti-Reflective (HMC Coating)', '100% UV Protection', '1 Year Warranty'],
      badge: 'BESTSELLER',
      isBestseller: true,
      sortOrder: 1,
    },
    {
      kind: 'type',
      type: 'progressive',
      displayName: 'Progressive',
      name: 'Progressive',
      description: 'Seamless vision correction for near, intermediate, and distance.',
      price: 2499,
      startingPrice: 2499,
      features: ['Multi-focal lenses', 'No visible lines', '100% UV Protection', '1 Year Warranty'],
      sortOrder: 2,
    },
    {
      kind: 'type',
      type: 'zero_power',
      displayName: 'Zero Power (Plano)',
      name: 'Zero Power',
      description: 'No power, just style and protection.',
      price: 699,
      startingPrice: 699,
      features: ['100% UV Protection', 'Anti-Reflective', 'Scratch Resistant'],
      sortOrder: 3,
    },
    {
      kind: 'type',
      type: 'bluecut',
      displayName: 'Blue Cut',
      name: 'Blue Cut',
      description: 'Blocks harmful blue light from screens.',
      price: 899,
      startingPrice: 899,
      features: ['Blue Light Protection', 'Anti-Reflective', '100% UV Protection', 'Reduces eye strain'],
      sortOrder: 4,
    },
    {
      kind: 'type',
      type: 'photochromic',
      displayName: 'Photochromic',
      name: 'Photochromic',
      description: 'Darkens in sunlight, clears indoors. 2-in-1 convenience.',
      price: 1499,
      startingPrice: 1499,
      features: ['Auto-darkens in sunlight', '100% UV Protection', 'Anti-Reflective', '1 Year Warranty'],
      sortOrder: 5,
    },
  ];

  const progressiveTiers = [
    {
      kind: 'type',
      type: 'progressive',
      subType: 'hc_progressive',
      displayName: 'HC Progressive',
      name: 'HC Progressive',
      description: 'Entry-level progressive lenses with hard coat.',
      price: 2499,
      features: ['Hard Coat', 'Anti-Reflective', '100% UV Protection'],
      sortOrder: 10,
    },
    {
      kind: 'type',
      type: 'progressive',
      subType: 'premium_progressive',
      displayName: 'Premium Progressive',
      name: 'Premium Progressive',
      description: 'Enhanced progressive lenses with wider vision zones.',
      price: 3499,
      features: ['Hard Coat', 'Anti-Reflective', 'Wider vision zones', '100% UV Protection'],
      sortOrder: 11,
    },
    {
      kind: 'type',
      type: 'progressive',
      subType: 'advanced_progressive',
      displayName: 'Advanced Progressive',
      name: 'Advanced Progressive',
      description: 'Advanced progressive lenses with HMC coating.',
      price: 4499,
      features: ['HMC Coating', 'Anti-Reflective', 'Superior optics', '100% UV Protection'],
      sortOrder: 12,
    },
    {
      kind: 'type',
      type: 'progressive',
      subType: 'elite_progressive',
      displayName: 'Elite Progressive',
      name: 'Elite Progressive',
      description: 'Top-of-the-line progressive lenses with all premium coatings.',
      price: 5499,
      features: ['HMC + Blue Cut', 'Maximum UV Protection', 'Widest vision zones', 'Premium optics'],
      sortOrder: 13,
    },
  ];

  const qualityTiers = [
    {
      kind: 'quality',
      subType: 'hmc_bluecut',
      displayName: 'HMC + Blue Cut',
      name: 'HMC + Blue Cut',
      description: 'Best of both worlds: anti-reflective + blue light protection.',
      price: 999,
      features: [
        'Anti-Reflective (HMC Coating)',
        'Blue Light Protection',
        'Water & Dust Repellant',
        '100% UV Protection',
      ],
      badge: 'RECOMMENDED',
      isRecommended: true,
      isBestseller: true,
      sortOrder: 20,
    },
    {
      kind: 'quality',
      subType: 'hmc',
      displayName: 'HMC',
      name: 'HMC',
      description: 'Hard Multi-Coat for anti-reflective performance.',
      price: 699,
      features: ['Anti-Reflective (HMC Coating)', 'Scratch Resistant', '100% UV Protection'],
      sortOrder: 21,
    },
    {
      kind: 'quality',
      subType: 'bluecut_quality',
      displayName: 'Blue Cut',
      name: 'Blue Cut',
      description: 'Blue light blocking for screen-heavy lifestyles.',
      price: 899,
      features: ['Blue Light Protection', 'Anti-Reflective', '100% UV Protection'],
      sortOrder: 22,
    },
    {
      kind: 'quality',
      subType: 'hc',
      displayName: 'HC (Hard Coated)',
      name: 'HC',
      description: 'Basic hard coat for scratch resistance.',
      price: 799,
      features: ['Hard Coat', 'Scratch Resistant', '100% UV Protection'],
      sortOrder: 23,
    },
  ];

  // Idempotent upsert by displayName + kind
  for (const opt of [...lensTypes, ...progressiveTiers, ...qualityTiers]) {
    await LensOption.findOneAndUpdate(
      { displayName: opt.displayName, kind: opt.kind },
      opt,
      { upsert: true, new: true }
    );
  }
  console.log('Lens options seeded.');

  // ---- Seed Products ----
  console.log('Seeding products...');

  const products = [
    {
      sku: 'EG-2041',
      name: 'Matte Square Frame',
      description: 'Lightweight TR90 premium square frames with a modern matte finish.',
      frame: {
        type: 'Square',
        material: 'TR90 Premium',
        width: 140,
        lensWidth: 54,
        bridgeWidth: 18,
        templeLength: 145,
        featureTags: ['Lightweight', 'Flexible', 'Skin Friendly'],
      },
      frameType: 'Square',
      material: 'TR90 Premium',
      colors: [
        { name: 'Matte Black', hex: '#1A1A1A', stock: 50 },
        { name: 'Black Gold', hex: '#2A2214', stock: 35 },
        { name: 'Tortoise', hex: '#8B4513', stock: 20 },
        { name: 'Navy Blue', hex: '#1E3A5F', stock: 25 },
        { name: 'Dark Red', hex: '#8B0000', stock: 15 },
      ],
      images: ['/images/products/eg-2041/1.jpg'],
      price: { original: 999, selling: 1 },
      category: 'prescription',
      compatible: { prescription: true, bluecut: true, zeropower: true, progressive: true },
      tags: ['square', 'matte', 'tr90', 'lightweight', 'prescription'],
      isBestseller: true,
      rating: 4.5,
      reviewCount: 128,
      soldCount: 500,
      meta: {
        seoTitle: 'EG-2041 Matte Square Frame - EyeGlaze',
        seoDescription: 'Premium TR90 matte square eyeglasses frame at ₹1. Available in 5 colors.',
      },
    },
    {
      sku: 'EG-1067',
      name: 'Premium Clubmaster Frame',
      description: 'Classic clubmaster style in premium metal with acetate browline.',
      frame: {
        type: 'Clubmaster',
        material: 'Premium Metal',
        width: 138,
        lensWidth: 52,
        bridgeWidth: 20,
        templeLength: 145,
        featureTags: ['Durable', 'Corrosion Resistant', 'Classic Style'],
      },
      frameType: 'Clubmaster',
      material: 'Premium Metal',
      colors: [
        { name: 'Black Silver', hex: '#2A2A2A', stock: 40 },
        { name: 'Tortoise Gold', hex: '#8B6914', stock: 30 },
        { name: 'Brown Silver', hex: '#5C4033', stock: 25 },
        { name: 'Crystal Clear', hex: '#E8E8E8', stock: 20 },
      ],
      images: ['/images/products/eg-1067/1.jpg'],
      price: { original: 999, selling: 1 },
      category: 'prescription',
      compatible: { prescription: true, bluecut: true, zeropower: true, progressive: false },
      tags: ['clubmaster', 'metal', 'classic', 'prescription', 'browline'],
      isBestseller: true,
      rating: 4.3,
      reviewCount: 89,
      soldCount: 320,
      meta: {
        seoTitle: 'EG-1067 Premium Clubmaster Frame - EyeGlaze',
        seoDescription: 'Classic clubmaster eyeglasses in premium metal at ₹1. 4 color options.',
      },
    },
    {
      sku: 'EG-3012',
      name: 'Classic Aviator',
      description: 'Timeless aviator style in premium stainless steel.',
      frame: {
        type: 'Aviator',
        material: 'Premium Metal',
        width: 144,
        lensWidth: 58,
        bridgeWidth: 14,
        templeLength: 140,
        featureTags: ['Lightweight', 'Corrosion Resistant', 'Adjustable Nose Pads'],
      },
      frameType: 'Aviator',
      material: 'Premium Metal',
      colors: [
        { name: 'Gold', hex: '#D4922A', stock: 35 },
        { name: 'Silver', hex: '#C0C0C0', stock: 40 },
        { name: 'Gunmetal', hex: '#2C3539', stock: 25 },
      ],
      images: ['/images/products/eg-3012/1.jpg'],
      price: { original: 999, selling: 1 },
      category: 'sunglasses',
      compatible: { prescription: false, bluecut: false, zeropower: true, progressive: false },
      tags: ['aviator', 'metal', 'sunglasses', 'classic', 'pilot'],
      isBestseller: false,
      rating: 4.6,
      reviewCount: 56,
      soldCount: 210,
    },
    {
      sku: 'EG-4001',
      name: 'Kids Round Frame',
      description: 'Safe and durable round frames designed for children.',
      frame: {
        type: 'Round',
        material: 'TR90 Premium',
        width: 120,
        lensWidth: 44,
        bridgeWidth: 16,
        templeLength: 125,
        featureTags: ['Flexible', 'Lightweight', 'Skin Friendly', 'Child-Safe'],
      },
      frameType: 'Round',
      material: 'TR90 Premium',
      colors: [
        { name: 'Blue', hex: '#4169E1', stock: 30 },
        { name: 'Pink', hex: '#FF69B4', stock: 35 },
        { name: 'Red', hex: '#DC143C', stock: 20 },
      ],
      images: ['/images/products/eg-4001/1.jpg'],
      price: { original: 999, selling: 1 },
      category: 'kids',
      compatible: { prescription: true, bluecut: true, zeropower: true, progressive: false },
      tags: ['kids', 'round', 'tr90', 'children', 'flexible'],
      isBestseller: false,
      rating: 4.4,
      reviewCount: 42,
      soldCount: 180,
    },
    {
      sku: 'EG-5010',
      name: 'Blue Light Blocker',
      description: 'Acetate frames with built-in blue light blocking lenses.',
      frame: {
        type: 'Square',
        material: 'Acetate',
        width: 136,
        lensWidth: 50,
        bridgeWidth: 18,
        templeLength: 140,
        featureTags: ['Acetate Premium', 'Lightweight', 'Hypoallergenic'],
      },
      frameType: 'Square',
      material: 'Acetate',
      colors: [
        { name: 'Crystal Black', hex: '#1C1C1C', stock: 45 },
        { name: 'Havana Brown', hex: '#6B3A2A', stock: 30 },
        { name: 'Clear', hex: '#F5F5F0', stock: 25 },
      ],
      images: ['/images/products/eg-5010/1.jpg'],
      price: { original: 999, selling: 1 },
      category: 'blue_light',
      compatible: { prescription: false, bluecut: true, zeropower: true, progressive: false },
      tags: ['blue light', 'acetate', 'computer glasses', 'screen protection'],
      isBestseller: false,
      rating: 4.2,
      reviewCount: 67,
      soldCount: 290,
    },
    {
      sku: 'EG-6003',
      name: 'Progressive Ready Wide Frame',
      description: 'Wide-frame design optimized for progressive lenses with maximum viewing area.',
      frame: {
        type: 'Wayfarer',
        material: 'TR90 Premium',
        width: 146,
        lensWidth: 56,
        bridgeWidth: 18,
        templeLength: 145,
        featureTags: ['Wide Frame', 'Lightweight', 'Progressive Ready'],
      },
      frameType: 'Wayfarer',
      material: 'TR90 Premium',
      colors: [
        { name: 'Matte Black', hex: '#1A1A1A', stock: 30 },
        { name: 'Gunmetal', hex: '#2C3539', stock: 25 },
        { name: 'Dark Brown', hex: '#3D2314', stock: 20 },
      ],
      images: ['/images/products/eg-6003/1.jpg'],
      price: { original: 999, selling: 1 },
      category: 'prescription',
      compatible: { prescription: true, bluecut: true, zeropower: true, progressive: true },
      tags: ['progressive', 'wide frame', 'wayfarer', 'tr90', 'multifocal'],
      isBestseller: false,
      rating: 4.7,
      reviewCount: 33,
      soldCount: 95,
      meta: {
        seoTitle: 'EG-6003 Progressive Ready Wide Frame - EyeGlaze',
        seoDescription: 'Wide frame designed for progressive lenses at ₹1.',
      },
    },
  ];

  for (const prod of products) {
    await Product.findOneAndUpdate({ sku: prod.sku }, prod, { upsert: true, new: true });
  }
  console.log('Products seeded.');

  // ---- Seed Admin User ----
  console.log('Seeding admin user...');
  await User.findOneAndUpdate(
    { mobile: '9999999999' },
    {
      mobile: '9999999999',
      phone: '9999999999',
      countryCode: '+91',
      role: 'admin',
      name: 'EyeGlaze Admin',
      isVerified: true,
    },
    { upsert: true, new: true }
  );
  console.log('Admin user seeded (mobile: 9999999999).');

  console.log('\nSeed completed successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
