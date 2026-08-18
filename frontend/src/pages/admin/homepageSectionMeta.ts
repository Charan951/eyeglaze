export type SectionType = 'special_promo' | 'new_arrivals' | 'eyeglaze_edit';

export const TYPE_SLUGS = {
  'special-promo': 'special_promo',
  'new-arrivals': 'new_arrivals',
  'eyeglaze-edit': 'eyeglaze_edit',
} as const;

export type SectionTypeSlug = keyof typeof TYPE_SLUGS;

export const TYPE_TO_SLUG: Record<SectionType, SectionTypeSlug> = {
  special_promo: 'special-promo',
  new_arrivals: 'new-arrivals',
  eyeglaze_edit: 'eyeglaze-edit',
};

export const TYPE_LABEL: Record<SectionType, string> = {
  special_promo: 'Special Promo',
  new_arrivals: 'New Arrivals',
  eyeglaze_edit: 'EyeGlaze Edit',
};

export const TYPE_DEFAULT_POSITION: Record<SectionType, string> = {
  special_promo: 'after_category:sunglasses',
  new_arrivals: 'after_featured',
  eyeglaze_edit: 'after_offers',
};

export const POSITION_OPTIONS = [
  { value: 'hero', label: 'Hero Slider (Top of Page)' },
  { value: 'eyeglasses_landing', label: 'Top Banner (Above Eyeglasses)' },
  { value: 'after_featured', label: 'After Featured Products' },
  { value: 'after_offers', label: 'After Offers Carousel' },
  { value: 'footer', label: 'Footer Banner (Above Footer)' },
  { value: 'both', label: 'Both Placements' },
] as const;

export function parseSectionType(slug?: string): SectionType | null {
  if (!slug) return null;
  return TYPE_SLUGS[slug as SectionTypeSlug] ?? null;
}
