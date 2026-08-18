import mongoose from 'mongoose';
import { seedAdminIfEmpty, seedCatalogIfEmpty } from './seedOnEmpty';

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

export async function seedDatabase() {
  await seedAdminIfEmpty();
  await seedCatalogIfEmpty();

  const LensOption = mongoose.models.LensOption || mongoose.model('LensOption', LensOptionSchema);

  // ---- Seed Lens Options ----
  // console.log('Seeding lens options...');

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
      { upsert: true, returnDocument: 'after' }
    );
  }
  // console.log('Lens options seeded.');

  // ---- Seed Homepage Videos ----
  // console.log('Seeding homepage videos...');
  const HomepageVideo = mongoose.models.HomepageVideo || mongoose.model('HomepageVideo', new mongoose.Schema({
    title: { type: String, required: true },
    videoUrl: { type: String, required: true },
    description: String,
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  }));

  const defaultVideos = [
    {
      title: 'Our Journey: Crafting Premium Eyewear',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: 'Take a behind-the-scenes look at how we design, manufacture, and quality-test our premium lenses and frames.',
      displayOrder: 0,
      isActive: true,
    },
    {
      title: 'Customer Happiness: Real Stories',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: 'Hear what our customers have to say about their experience with EyeGlaze clinic-at-home and online ordering.',
      displayOrder: 1,
      isActive: true,
    },
  ];

  for (const video of defaultVideos) {
    await HomepageVideo.findOneAndUpdate(
      { title: video.title },
      video,
      { upsert: true, returnDocument: 'after' }
    );
  }
  // console.log('Homepage videos seeded.');

  // console.log('\nSeed completed successfully!');
}
