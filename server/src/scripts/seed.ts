import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
dotenv.config();
import { connectDB } from '../config/mongodb';
import { startInMemoryMongoDB } from '../config/inMemoryMongo';

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
    brand: String,
    shape: String,
    frameSize: String,
    frameColor: String,
    weight: String,
    faceShapes: [String],
    isPremium: { type: Boolean, default: false },
    colors: [ProductColorSchema],
    images: [String],
    price: { original: { type: Number, default: 999 }, selling: { type: Number, default: 1 } },
    category: String,
    categories: [String],
    gender: String,
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
    password: { type: String },
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
  
  if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'development') {
    const inMemoryUri = await startInMemoryMongoDB();
    process.env.MONGODB_URI = inMemoryUri;
  }
  
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

  const singleVisionTiers = [
    {
      kind: 'type',
      type: 'single_vision',
      subType: 'basic_single_vision',
      displayName: 'Standard Single Vision',
      name: 'Standard Single Vision',
      description: 'Standard single vision lenses with basic anti-glare.',
      price: 699,
      features: ['Anti-Reflective', '100% UV Protection'],
      sortOrder: 4,
    },
    {
      kind: 'type',
      type: 'single_vision',
      subType: 'premium_single_vision',
      displayName: 'Premium Single Vision',
      name: 'Premium Single Vision',
      description: 'Enhanced clarity with premium anti-reflective coating.',
      price: 1299,
      features: ['Premium Anti-Reflective', 'Scratch Resistant', '100% UV Protection'],
      sortOrder: 5,
    },
    {
      kind: 'type',
      type: 'single_vision',
      subType: 'advanced_single_vision',
      displayName: 'Advanced Single Vision',
      name: 'Advanced Single Vision',
      description: 'Super hydrophobic coating for scratch & dust resistance.',
      price: 1599,
      features: ['Hydrophobic Coating', 'Dust Repellent', 'Premium Optics', '100% UV Protection'],
      sortOrder: 6,
    },
    {
      kind: 'type',
      type: 'single_vision',
      subType: 'elite_single_vision',
      displayName: 'Elite Single Vision',
      name: 'Elite Single Vision',
      description: 'Digital blue cut + anti-reflective premium lenses.',
      price: 2199,
      features: ['Blue Cut Coating', 'Premium Anti-Reflective', 'Maximum Clarity', '100% UV Protection'],
      sortOrder: 7,
    },
  ];

  const progressiveTiers = [
    {
      kind: 'type',
      type: 'progressive',
      subType: 'hc_progressive',
      displayName: 'HC Progressive',
      name: 'HC Progressive',
      description: 'Wide & clear vision with enhanced comfort and less distortion.',
      price: 2499,
      features: ['Wide Vision', 'Less Distortion', 'Easy Adaptation', 'UV Protection'],
      sortOrder: 10,
      isBestseller: true,
    },
    {
      kind: 'type',
      type: 'progressive',
      subType: 'premium_progressive',
      displayName: 'Premium Progressive',
      name: 'Premium Progressive',
      description: 'High clarity with advanced lens design for better visual balance.',
      price: 3499,
      features: ['Clear Vision', 'Better Sharpness', 'Reduced Glare', 'UV Protection'],
      sortOrder: 11,
    },
    {
      kind: 'type',
      type: 'progressive',
      subType: 'advanced_progressive',
      displayName: 'Advanced Progressive',
      name: 'Advanced Progressive',
      description: 'Smooth transitions with improved intermediate & near vision.',
      price: 4499,
      features: ['Smooth Transition', 'Wider Zones', 'Low Distortion', 'UV Protection'],
      sortOrder: 12,
    },
    {
      kind: 'type',
      type: 'progressive',
      subType: 'elite_progressive',
      displayName: 'Elite Progressive',
      name: 'Elite Progressive',
      description: 'Best-in-class clarity with personalized comfort for all-day use.',
      price: 5499,
      features: ['Personalized Vision', 'Maximum Clarity', 'Fast Adaptation', 'UV Protection'],
      sortOrder: 13,
    },
  ];

  const zeroPowerTiers = [
    {
      kind: 'type',
      type: 'zero_power',
      subType: 'basic_zero_power',
      displayName: 'Standard Zero Power',
      name: 'Standard Zero Power',
      description: 'Standard zero power lenses for fashion and style.',
      price: 699,
      features: ['Hard Coat', '100% UV Protection'],
      sortOrder: 20,
    },
    {
      kind: 'type',
      type: 'zero_power',
      subType: 'premium_zero_power',
      displayName: 'Premium Zero Power',
      name: 'Premium Zero Power',
      description: 'Zero power lenses with anti-reflective coating.',
      price: 999,
      features: ['Anti-Reflective', 'Scratch Resistant', '100% UV Protection'],
      sortOrder: 21,
    },
    {
      kind: 'type',
      type: 'zero_power',
      subType: 'advanced_zero_power',
      displayName: 'Advanced Zero Power',
      name: 'Advanced Zero Power',
      description: 'Zero power with anti-reflective + blue cut protection.',
      price: 1299,
      features: ['Blue Cut Protection', 'Anti-Reflective', '100% UV Protection'],
      sortOrder: 22,
    },
    {
      kind: 'type',
      type: 'zero_power',
      subType: 'elite_zero_power',
      displayName: 'Elite Zero Power',
      name: 'Elite Zero Power',
      description: 'Premium zero power with all-in-one protective coatings.',
      price: 1699,
      features: ['HMC + Blue Cut', 'Dust & Water Repellent', 'Maximum UV Protection'],
      sortOrder: 23,
    },
  ];

  const blueCutTiers = [
    {
      kind: 'type',
      type: 'bluecut',
      subType: 'basic_bluecut',
      displayName: 'Standard Blue Cut',
      name: 'Standard Blue Cut',
      description: 'Standard blue cut lenses to protect from digital screens.',
      price: 899,
      features: ['Blue Cut Coating', '100% UV Protection'],
      sortOrder: 30,
    },
    {
      kind: 'type',
      type: 'bluecut',
      subType: 'premium_bluecut',
      displayName: 'Premium Blue Cut',
      name: 'Premium Blue Cut',
      description: 'Premium blue cut lenses with anti-reflective coating.',
      price: 1299,
      features: ['Blue Cut Coating', 'Anti-Reflective', 'Scratch Resistant'],
      sortOrder: 31,
    },
    {
      kind: 'type',
      type: 'bluecut',
      subType: 'advanced_bluecut',
      displayName: 'Advanced Blue Cut',
      name: 'Advanced Blue Cut',
      description: 'Hydrophobic anti-reflective blue cut lenses.',
      price: 1699,
      features: ['Blue Cut Coating', 'Hydrophobic Coating', 'Superior Clarity', 'Anti-Reflective'],
      sortOrder: 32,
    },
    {
      kind: 'type',
      type: 'bluecut',
      subType: 'elite_bluecut',
      displayName: 'Elite Blue Cut',
      name: 'Elite Blue Cut',
      description: 'Top-of-the-line blue cut lenses with maximum protection.',
      price: 2199,
      features: ['Ultimate Blue Cut', 'HMC Coating', 'Dust & Smudge Resistant', '1 Year Warranty'],
      sortOrder: 33,
    },
  ];

  const photochromicTiers = [
    {
      kind: 'type',
      type: 'photochromic',
      subType: 'basic_photochromic',
      displayName: 'Standard Photochromic',
      name: 'Standard Photochromic',
      description: 'Transitions from clear to dark in outdoor sunlight.',
      price: 1499,
      features: ['Auto-darkening', '100% UV Protection'],
      sortOrder: 40,
    },
    {
      kind: 'type',
      type: 'photochromic',
      subType: 'premium_photochromic',
      displayName: 'Premium Photochromic',
      name: 'Premium Photochromic',
      description: 'Fast-transitioning lenses with anti-reflective coating.',
      price: 1999,
      features: ['Fast Transitions', 'Anti-Reflective', 'Scratch Resistant'],
      sortOrder: 41,
    },
    {
      kind: 'type',
      type: 'photochromic',
      subType: 'advanced_photochromic',
      displayName: 'Advanced Photochromic',
      name: 'Advanced Photochromic',
      description: 'Transition lenses with blue cut protection.',
      price: 2499,
      features: ['Fast Transitions', 'Blue Cut Protection', 'Anti-Reflective', 'UV Protection'],
      sortOrder: 42,
    },
    {
      kind: 'type',
      type: 'photochromic',
      subType: 'elite_photochromic',
      displayName: 'Elite Photochromic',
      name: 'Elite Photochromic',
      description: 'Premium transition lenses with all-in-one protection.',
      price: 2999,
      features: ['Ultra-Fast Transitions', 'HMC + Blue Cut', 'Water & Dust Repellent', '1 Year Warranty'],
      sortOrder: 43,
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
  for (const opt of [...lensTypes, ...singleVisionTiers, ...progressiveTiers, ...zeroPowerTiers, ...blueCutTiers, ...photochromicTiers, ...qualityTiers]) {
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
      frameType: 'Full Rim',
      material: 'TR90',
      brand: 'Vincent Chase',
      shape: 'Rectangle',
      frameSize: 'Medium',
      frameColor: 'Black',
      weight: 'Lightweight',
      faceShapes: ['Round', 'Oval'],
      isPremium: false,
      colors: [
        { name: 'Matte Black', hex: '#1A1A1A', stock: 50 },
        { name: 'Black Gold', hex: '#2A2214', stock: 35 },
        { name: 'Tortoise', hex: '#8B4513', stock: 20 },
        { name: 'Navy Blue', hex: '#1E3A5F', stock: 25 },
        { name: 'Dark Red', hex: '#8B0000', stock: 15 },
      ],
      images: ['/images/men_eyeglasses.png'],
      price: { original: 1499, selling: 950 },
      category: 'prescription',
      gender: 'men',
      compatible: { prescription: true, bluecut: true, zeropower: true, progressive: true },
      tags: ['square', 'matte', 'tr90', 'lightweight', 'prescription', 'men'],
      isBestseller: true,
      rating: 4.5,
      reviewCount: 128,
      soldCount: 500,
      meta: {
        seoTitle: 'EG-2041 Matte Square Frame - EyeGlaze',
        seoDescription: 'Premium TR90 matte square eyeglasses frame. Available in 5 colors.',
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
      frameType: 'Half Rim',
      material: 'Metal',
      brand: 'John Jacobs',
      shape: 'Clubmaster',
      frameSize: 'Large',
      frameColor: 'Black',
      weight: 'Medium',
      faceShapes: ['Square', 'Oval'],
      isPremium: true,
      colors: [
        { name: 'Black Silver', hex: '#2A2A2A', stock: 40 },
        { name: 'Tortoise Gold', hex: '#8B6914', stock: 30 },
        { name: 'Brown Silver', hex: '#5C4033', stock: 25 },
        { name: 'Crystal Clear', hex: '#E8E8E8', stock: 20 },
      ],
      images: ['/images/women_eyeglasses.png'],
      price: { original: 1999, selling: 1200 },
      category: 'prescription',
      gender: 'women',
      compatible: { prescription: true, bluecut: true, zeropower: true, progressive: false },
      tags: ['clubmaster', 'metal', 'classic', 'prescription', 'browline', 'women'],
      isBestseller: true,
      rating: 4.3,
      reviewCount: 89,
      soldCount: 320,
      meta: {
        seoTitle: 'EG-1067 Premium Clubmaster Frame - EyeGlaze',
        seoDescription: 'Classic clubmaster eyeglasses in premium metal. 4 color options.',
      },
    },
    {
      sku: 'EG-3012',
      name: 'Classic Aviator Sunglasses',
      description: 'Timeless aviator style sunglasses in premium stainless steel with dark polarized lenses.',
      frame: {
        type: 'Aviator',
        material: 'Premium Metal',
        width: 144,
        lensWidth: 58,
        bridgeWidth: 14,
        templeLength: 140,
        featureTags: ['Lightweight', 'Corrosion Resistant', 'Adjustable Nose Pads'],
      },
      frameType: 'Full Rim',
      material: 'Metal',
      brand: 'Hustlr',
      shape: 'Aviator',
      frameSize: 'Large',
      frameColor: 'Gold',
      weight: 'Lightweight',
      faceShapes: ['Round', 'Oval', 'Square'],
      isPremium: false,
      colors: [
        { name: 'Gold', hex: '#D4922A', stock: 35 },
        { name: 'Silver', hex: '#C0C0C0', stock: 40 },
        { name: 'Gunmetal', hex: '#2C3539', stock: 25 },
      ],
      images: ['/images/men_sunglasses.png'],
      price: { original: 1299, selling: 750 },
      category: 'sunglasses',
      gender: 'men',
      compatible: { prescription: false, bluecut: false, zeropower: true, progressive: false },
      tags: ['aviator', 'metal', 'sunglasses', 'classic', 'pilot', 'men'],
      isBestseller: false,
      rating: 4.6,
      reviewCount: 56,
      soldCount: 210,
    },
    {
      sku: 'EG-3013',
      name: 'Cat Eye Sunglasses',
      description: 'Stunning premium cat-eye sunglasses for a bold fashion statement.',
      frame: {
        type: 'Cat Eye',
        material: 'Acetate',
        width: 140,
        lensWidth: 55,
        bridgeWidth: 16,
        templeLength: 140,
        featureTags: ['Lightweight', 'Chic Design', 'UV400 Protection'],
      },
      frameType: 'Full Rim',
      material: 'Acetate',
      brand: 'John Jacobs',
      shape: 'Cat Eye',
      frameSize: 'Medium',
      frameColor: 'Black',
      weight: 'Lightweight',
      faceShapes: ['Oval', 'Heart', 'Round'],
      isPremium: true,
      colors: [
        { name: 'Black Polarized', hex: '#1C1C1D', stock: 30 },
        { name: 'Pink Tint', hex: '#FFB6C1', stock: 20 },
      ],
      images: ['/images/women_sunglasses.png'],
      price: { original: 1799, selling: 999 },
      category: 'sunglasses',
      gender: 'women',
      compatible: { prescription: false, bluecut: false, zeropower: true, progressive: false },
      tags: ['sunglasses', 'cat eye', 'fashion', 'women', 'polarized'],
      isBestseller: true,
      rating: 4.8,
      reviewCount: 94,
      soldCount: 180,
    },
    {
      sku: 'EG-4001',
      name: 'Kids Round Eyeglasses',
      description: 'Safe and durable round frames designed for children, featuring soft-grip temples.',
      frame: {
        type: 'Round',
        material: 'TR90 Premium',
        width: 120,
        lensWidth: 44,
        bridgeWidth: 16,
        templeLength: 125,
        featureTags: ['Flexible', 'Lightweight', 'Skin Friendly', 'Child-Safe'],
      },
      frameType: 'Full Rim',
      material: 'TR90',
      brand: 'Lenskart Air',
      shape: 'Round',
      frameSize: 'Small',
      frameColor: 'Pink',
      weight: 'Lightweight',
      faceShapes: ['Square', 'Diamond'],
      isPremium: false,
      colors: [
        { name: 'Blue', hex: '#4169E1', stock: 30 },
        { name: 'Pink', hex: '#FF69B4', stock: 35 },
        { name: 'Red', hex: '#DC143C', stock: 20 },
      ],
      images: ['/images/kids_eyeglasses.png'],
      price: { original: 1199, selling: 800 },
      category: 'prescription',
      gender: 'kids',
      compatible: { prescription: true, bluecut: true, zeropower: true, progressive: false },
      tags: ['kids', 'round', 'tr90', 'children', 'flexible', 'eyeglasses'],
      isBestseller: false,
      rating: 4.4,
      reviewCount: 42,
      soldCount: 180,
    },
    {
      sku: 'EG-4002',
      name: 'Kids Sport Sunglasses',
      description: 'UV400 protective polarized kids sunglasses with flexible temples.',
      frame: {
        type: 'Rectangle',
        material: 'TR90 Premium',
        width: 122,
        lensWidth: 46,
        bridgeWidth: 15,
        templeLength: 125,
        featureTags: ['Flexible', 'Polarized', 'UV Protection', 'Child-Safe'],
      },
      frameType: 'Full Rim',
      material: 'TR90',
      brand: 'Lenskart Air',
      shape: 'Rectangle',
      frameSize: 'Small',
      frameColor: 'Blue',
      weight: 'Lightweight',
      faceShapes: ['Oval', 'Round'],
      isPremium: false,
      colors: [
        { name: 'Blue Black', hex: '#1E3A8A', stock: 40 },
        { name: 'Orange Black', hex: '#EA580C', stock: 30 },
      ],
      images: ['/images/kids_sunglasses.png'],
      price: { original: 899, selling: 500 },
      category: 'sunglasses',
      gender: 'kids',
      compatible: { prescription: false, bluecut: false, zeropower: true, progressive: false },
      tags: ['kids', 'sunglasses', 'polarized', 'sport', 'flexible'],
      isBestseller: false,
      rating: 4.5,
      reviewCount: 38,
      soldCount: 150,
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
      frameType: 'Full Rim',
      material: 'Acetate',
      brand: 'Vincent Chase',
      shape: 'Rectangle',
      frameSize: 'Medium',
      frameColor: 'Brown',
      weight: 'Medium',
      faceShapes: ['Round', 'Oval'],
      isPremium: true,
      colors: [
        { name: 'Crystal Black', hex: '#1C1C1C', stock: 45 },
        { name: 'Havana Brown', hex: '#6B3A2A', stock: 30 },
        { name: 'Clear', hex: '#F5F5F0', stock: 25 },
      ],
      images: ['/images/cat_blue_light.png'],
      price: { original: 1499, selling: 999 },
      category: 'blue_light',
      gender: 'unisex',
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
      frameType: 'Rimless',
      material: 'Titanium',
      brand: 'John Jacobs',
      shape: 'Clubmaster',
      frameSize: 'Large',
      frameColor: 'Black',
      weight: 'Heavy',
      faceShapes: ['Square', 'Round'],
      isPremium: true,
      colors: [
        { name: 'Matte Black', hex: '#1A1A1A', stock: 30 },
        { name: 'Gunmetal', hex: '#2C3539', stock: 25 },
        { name: 'Dark Brown', hex: '#3D2314', stock: 20 },
      ],
      images: ['/images/cat_prescription.png'],
      price: { original: 2499, selling: 1800 },
      category: 'prescription',
      gender: 'men',
      compatible: { prescription: true, bluecut: true, zeropower: true, progressive: true },
      tags: ['progressive', 'wide frame', 'wayfarer', 'tr90', 'multifocal', 'men'],
      isBestseller: false,
      rating: 4.7,
      reviewCount: 33,
      soldCount: 95,
      meta: {
        seoTitle: 'EG-6003 Progressive Ready Wide Frame - EyeGlaze',
        seoDescription: 'Wide frame designed for progressive lenses.',
      },
    },
    {
      _id: new mongoose.Types.ObjectId('6a30f027dc02afc2e5588f6e'),
      sku: 'EG-2021',
      name: 'Classic Women Square Frame',
      description: 'Lightweight TR90 premium square frames with a modern matte finish, styled for women.',
      frame: {
        type: 'Square',
        material: 'TR90 Premium',
        width: 140,
        lensWidth: 54,
        bridgeWidth: 18,
        templeLength: 145,
        featureTags: ['Lightweight', 'Flexible', 'Skin Friendly', 'Durable'],
      },
      frameType: 'Full Rim',
      material: 'TR90',
      brand: 'Vincent Chase',
      shape: 'Round',
      frameSize: 'Medium',
      frameColor: 'Black',
      weight: 'Lightweight',
      faceShapes: ['Round', 'Oval', 'Square', 'Diamond'],
      isPremium: false,
      colors: [
        { 
          name: 'Matte Black', 
          hex: '#131314', 
          stock: 50,
          images: [
            '/images/women_eyeglasses.png',
            '/images/women_eyeglasses.png',
            '/images/women_eyeglasses.png',
            '/images/women_eyeglasses.png',
            '/images/hero_model.png'
          ]
        },
        { 
          name: 'Black Gold', 
          hex: '#D4A04D', 
          stock: 30,
          images: [
            '/images/cat_blue_light.png',
            '/images/cat_blue_light.png',
            '/images/cat_blue_light.png',
            '/images/cat_blue_light.png',
            '/images/hero_model.png'
          ]
        },
        { 
          name: 'Dark Brown', 
          hex: '#5C3D2E', 
          stock: 20,
          images: [
            '/images/cat_sunglasses.png',
            '/images/cat_sunglasses.png',
            '/images/cat_sunglasses.png',
            '/images/cat_sunglasses.png',
            '/images/hero_model.png'
          ]
        },
      ],
      images: ['/images/women_eyeglasses.png'],
      price: { original: 1499, selling: 950 },
      category: 'prescription',
      gender: 'women',
      compatible: { prescription: true, bluecut: true, zeropower: true, progressive: true },
      tags: ['square', 'matte', 'tr90', 'lightweight', 'prescription', 'women'],
      isBestseller: true,
      rating: 4.7,
      reviewCount: 198,
      soldCount: 500,
      meta: {
        seoTitle: 'EG-2021 Women Square Frame - EyeGlaze',
        seoDescription: 'Premium TR90 square eyeglasses frame. Available in 3 colors.',
      },
    },
  ];

  for (const prod of products) {
    const query = (prod as any)._id ? { _id: (prod as any)._id } : { sku: prod.sku };
    await Product.findOneAndUpdate(query, prod, { upsert: true, new: true });
  }
  console.log('Products seeded.');

  // ---- Seed Admin User ----
  console.log('Seeding admin user...');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@eyeglaze.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  await User.findOneAndUpdate(
    { role: 'admin' },
    {
      mobile: '9999999999',
      phone: '9999999999',
      countryCode: '+91',
      email: adminEmail.toLowerCase(),
      password: adminPasswordHash,
      role: 'admin',
      name: 'EyeGlaze Admin',
      isVerified: true,
    },
    { upsert: true, new: true }
  );
  console.log(`Admin user seeded (email: ${adminEmail}).`);

  // ---- Seed Customer Users ----
  console.log('Seeding customer/user accounts...');
  const userPasswordHash = await bcrypt.hash('user123', 10);
  const customerSeeds = [
    {
      name: 'Rahul Sharma',
      mobile: '9876543210',
      phone: '9876543210',
      countryCode: '+91',
      email: 'rahul@email.com',
      password: userPasswordHash,
      role: 'user',
      membershipActive: true,
      isVerified: true,
    },
    {
      name: 'Priya Patel',
      mobile: '9123456780',
      phone: '9123456780',
      countryCode: '+91',
      email: 'priya@email.com',
      password: userPasswordHash,
      role: 'user',
      membershipActive: false,
      isVerified: true,
    },
    {
      name: 'Amit Kumar',
      mobile: '',
      phone: '',
      countryCode: '+91',
      email: 'amit@company.com',
      password: userPasswordHash,
      role: 'user',
      membershipActive: true,
      isVerified: true,
    },
  ];

  for (const customer of customerSeeds) {
    const query = customer.email ? { email: customer.email } : { name: customer.name };
    await User.findOneAndUpdate(
      query,
      customer,
      { upsert: true, new: true }
    );
  }
  console.log('Customer/user accounts seeded.');

  console.log('\nSeed completed successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
