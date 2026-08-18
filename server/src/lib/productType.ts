// Shared server-side product-type detection, mirroring the equivalent
// client-side helpers in frontend/src/pages/ProductDetail.tsx
// (isContactLensProduct / isSolutionProductPage / isAccessoryProductPage).
// Cart/checkout pricing logic (1+1, contact-lens exclusion, free solution
// bundle) needs this same classification server-side, where it didn't
// exist before — category data is denormalized text fields on Product,
// not an enum, so this matches by substring same as the frontend does.

export interface ProductTypeFields {
  category?: string;
  categoryId?: { slug?: string; name?: string } | string;
  categories?: string[];
  subCategory?: string;
  subSubCategory?: string;
  subSubSubCategory?: string;
  name?: string;
  solutionVariants?: unknown[];
}

function categoryLooksLikeContactLens(value: unknown): boolean {
  if (!value) return false;
  if (typeof value === 'object') {
    const o = value as { slug?: string; name?: string };
    return categoryLooksLikeContactLens(o.slug) || categoryLooksLikeContactLens(o.name);
  }
  return String(value).toLowerCase().includes('contact');
}

export function isContactLensProduct(product?: ProductTypeFields | null): boolean {
  if (!product) return false;
  if (categoryLooksLikeContactLens(product.category) || categoryLooksLikeContactLens(product.categoryId)) {
    return true;
  }
  return (product.categories || []).some((c) => categoryLooksLikeContactLens(c));
}

export function isSolutionProduct(product?: ProductTypeFields | null): boolean {
  if (!product) return false;
  const sub = (product.subCategory || '').toLowerCase();
  const subsub = (product.subSubCategory || '').toLowerCase();
  return (
    (Array.isArray(product.solutionVariants) && product.solutionVariants.length > 0) ||
    sub.includes('solution') ||
    (subsub.includes('solution') && !subsub.includes('accessor'))
  );
}

export function isAccessoryProduct(product?: ProductTypeFields | null): boolean {
  if (!product) return false;
  const sub = (product.subCategory || '').toLowerCase();
  const subsub = (product.subSubCategory || '').toLowerCase();
  return sub.includes('accessor') || subsub.includes('accessor');
}

// "Monthly" contact lenses specifically — wear-duration is stored as free
// text in subSubSubCategory (e.g. "Monthly", "Dailies", "Bi-Weekly",
// "Yearly") rather than a dedicated enum field, so match on that plus name.
export function isMonthlyContactLens(product?: ProductTypeFields | null): boolean {
  if (!product || !isContactLensProduct(product)) return false;
  const subsubsub = (product.subSubSubCategory || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  return subsubsub.includes('monthly') || name.includes('monthly');
}

// Frames/eyeglasses eligible for frame-level offers (₹1 frame, 1+1) —
// i.e. not a contact lens, solution, or accessory.
export function isFrameProduct(product?: ProductTypeFields | null): boolean {
  if (!product) return false;
  return !isContactLensProduct(product) && !isSolutionProduct(product) && !isAccessoryProduct(product);
}
