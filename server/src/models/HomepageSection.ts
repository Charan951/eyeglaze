import mongoose, { Document, Schema } from 'mongoose';

export type HomepageSectionType = 'special_promo' | 'new_arrivals' | 'eyeglaze_edit';

export interface IHomepageTrendItem {
  title: string;
  style?: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  buttonText?: string;
}

export interface IHomepageSection extends Document {
  sectionType: HomepageSectionType;
  position: string;
  displayOrder: number;
  isActive: boolean;
  showOnMobile: boolean;
  tag?: string;
  headline?: string;
  description?: string;
  buttonText?: string;
  linkUrl?: string;
  imageUrl?: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
  items: IHomepageTrendItem[];
  createdAt: Date;
  updatedAt: Date;
}

const TrendItemSchema = new Schema<IHomepageTrendItem>(
  {
    title: { type: String, default: '' },
    style: { type: String, default: '' },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    linkUrl: { type: String, default: '' },
    buttonText: { type: String, default: 'SHOP THE LOOK' },
  },
  { _id: false }
);

const HomepageSectionSchema = new Schema<IHomepageSection>(
  {
    sectionType: {
      type: String,
      enum: ['special_promo', 'new_arrivals', 'eyeglaze_edit'],
      required: true,
    },
    position: { type: String, default: 'after_featured' },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    showOnMobile: { type: Boolean, default: true },
    tag: { type: String, default: '' },
    headline: { type: String, default: '' },
    description: { type: String, default: '' },
    buttonText: { type: String, default: '' },
    linkUrl: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    sectionTitle: { type: String, default: '' },
    sectionSubtitle: { type: String, default: '' },
    items: { type: [TrendItemSchema], default: [] },
  },
  { timestamps: true }
);

HomepageSectionSchema.index({ isActive: 1, position: 1, displayOrder: 1 });

export const HomepageSection =
  mongoose.models.HomepageSection ||
  mongoose.model<IHomepageSection>('HomepageSection', HomepageSectionSchema);

const DEFAULT_EYEGLAZE_EDIT_CARDS = [
  {
    title: 'The Minimalist',
    style: 'Thin Gold Wireframes',
    description: 'A subtle statement. Lightweight frames engineered from aerospace titanium.',
    imageUrl: '/images/cat_prescription.png',
  },
  {
    title: 'The Maverick',
    style: 'Chunky Acetate Square',
    description: 'Bold contours and thick temples for an unapologetically smart profile.',
    imageUrl: '/images/cat_sunglasses.png',
  },
  {
    title: 'The Creator',
    style: 'Round Transparent Rim',
    description: 'Intellectual styling utilizing clear bio-acetates and textured temples.',
    imageUrl: '/images/cat_blue_light.png',
  },
  {
    title: 'The Explorer',
    style: 'Classic Double-Bar Aviators',
    description: 'An outdoor vintage classic re-imagined with high-contrast polaroid lenses.',
    imageUrl: '/images/promo_sunglasses.png',
  },
].map((card, index) => ({
  sectionType: 'eyeglaze_edit' as const,
  position: 'after_offers',
  displayOrder: 2 + index,
  isActive: true,
  showOnMobile: true,
  sectionTitle: 'The EyeGlaze Edit: Styled by Icons',
  sectionSubtitle: 'High-fashion trends inspired by global runways',
  headline: card.title,
  tag: card.style,
  description: card.description,
  imageUrl: card.imageUrl,
  linkUrl: '/products',
  buttonText: 'SHOP THE LOOK',
  items: [],
}));

export const DEFAULT_HOMEPAGE_SECTIONS = [
  {
    sectionType: 'special_promo' as const,
    position: 'after_category:sunglasses',
    displayOrder: 0,
    isActive: true,
    showOnMobile: true,
    tag: 'Special Promo',
    headline: 'UP TO 50% OFF',
    description: 'On Selected Sunglasses',
    buttonText: 'SHOP NOW',
    linkUrl: '/products?category=sunglasses',
    imageUrl: '/images/promo_sunglasses.png',
    items: [],
  },
  {
    sectionType: 'new_arrivals' as const,
    position: 'after_featured',
    displayOrder: 1,
    isActive: true,
    showOnMobile: true,
    tag: 'NEW ARRIVALS',
    headline: 'Just In!',
    description: 'Explore latest trends.',
    buttonText: 'EXPLORE',
    linkUrl: '/products',
    imageUrl: '/images/promo_new_arrivals.png',
    items: [],
  },
  ...DEFAULT_EYEGLAZE_EDIT_CARDS,
];

function applyLookCard(section: IHomepageSection, item: IHomepageTrendItem) {
  section.headline = item.title || '';
  section.tag = item.style || '';
  section.description = item.description || '';
  section.imageUrl = item.imageUrl || '';
  section.linkUrl = item.linkUrl || section.linkUrl || '/products';
  section.buttonText = item.buttonText || section.buttonText || 'SHOP THE LOOK';
  section.items = [];
}

export async function expandEyeglazeEditCards() {
  const bundled = await HomepageSection.find({
    sectionType: 'eyeglaze_edit',
    'items.0': { $exists: true },
  });
  if (!bundled.length) return false;
  for (const section of bundled) {
    const items = section.items || [];
    if (!items.length) continue;
    const [first, ...rest] = items;
    applyLookCard(section, first);
    await section.save();
    if (!rest.length) continue;
    await HomepageSection.insertMany(
      rest.map((item, index) => ({
        sectionType: 'eyeglaze_edit',
        position: section.position,
        displayOrder: (section.displayOrder || 0) + index + 1,
        isActive: section.isActive,
        showOnMobile: section.showOnMobile,
        sectionTitle: section.sectionTitle,
        sectionSubtitle: section.sectionSubtitle,
        headline: item.title || '',
        tag: item.style || '',
        description: item.description || '',
        imageUrl: item.imageUrl || '',
        linkUrl: item.linkUrl || section.linkUrl || '/products',
        buttonText: item.buttonText || section.buttonText || 'SHOP THE LOOK',
        items: [],
      }))
    );
  }
  return true;
}

export async function ensureDefaultHomepageSections() {
  const count = await HomepageSection.countDocuments();
  if (count === 0) {
    await HomepageSection.insertMany(DEFAULT_HOMEPAGE_SECTIONS);
    return true;
  }
  return expandEyeglazeEditCards();
}
