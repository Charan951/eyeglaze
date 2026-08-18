/** Display names for the 4 catalog levels. API `type` values stay unchanged. */
export const CATEGORY_LEVEL = {
  Category: 'Category',
  SubCategory: 'Collection',
  SubSubCategory: 'Type',
  SubSubSubCategory: 'Variant',
} as const;

export type CategoryLevelType = keyof typeof CATEGORY_LEVEL;

export function categoryLevelLabel(type?: string | null): string {
  if (!type) return CATEGORY_LEVEL.Category;
  return CATEGORY_LEVEL[type as CategoryLevelType] || type;
}

export function categoryLevelPlural(type?: string | null): string {
  const label = categoryLevelLabel(type);
  if (label === 'Category') return 'Categories';
  if (label === 'Collection') return 'Collections';
  if (label === 'Type') return 'Types';
  if (label === 'Variant') return 'Variants';
  return `${label}s`;
}

export const ADD_CHILD_LABEL: Record<string, string> = {
  Category: '+ Add Collection',
  SubCategory: '+ Add Type',
};

export const ADD_VARIANT_LABEL = '+ Add Variant';

export function catalogListPath(ids: {
  categoryId?: string | null;
  subCategoryId?: string | null;
  tab?: string | null;
}) {
  const p = new URLSearchParams();
  if (ids.categoryId) p.set('categoryId', ids.categoryId);
  if (ids.subCategoryId) p.set('subCategoryId', ids.subCategoryId);
  if (ids.tab) p.set('tab', ids.tab);
  const q = p.toString();
  return q ? `/admin/categories?${q}` : '/admin/categories';
}
