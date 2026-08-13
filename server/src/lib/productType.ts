// Shared server-side product-type detection, mirroring the equivalent
// client-side helpers in frontend/src/pages/ProductDetail.tsx
// (isContactLensProduct / isSolutionProductPage / isAccessoryProductPage).
// Cart/checkout pricing logic (1+1, contact-lens exclusion, free solution
// bundle) needs this same classification server-side, where it didn't
// exist before — category data is denormalized text fields on Product,
// not an enum, so this matches by substring same as the frontend does.

export interface ProductTypeFields {
  category?: string;
  subCategory?: string;
  subSubCategory?: string;
  subSubSubCategory?: string;
  name?: string;
  solutionVariants?: unknown[];
}

export function isContactLensProduct(product?: ProductTypeFields | null): boolean {
  if (!product) return false;
  const cat = (product.category || '').toLowerCase();
  const sub = (product.subCategory || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  return (
    cat.includes('contact') ||
    (cat.includes('lens') && !cat.includes('frame')) ||
    sub.includes('contact') ||
    name.includes('contact') ||
    (name.includes('lens') && !name.includes('glass') && !name.includes('frame'))
  );
}

export function isSolutionProduct(product?: ProductTypeFields | null): boolean {
  if (!product) return false;
  const subsub = (product.subSubCategory || '').toLowerCase();
  return (
    (Array.isArray(product.solutionVariants) && product.solutionVariants.length > 0) ||
    (subsub.includes('solution') && !subsub.includes('accessor'))
  );
}

export function isAccessoryProduct(product?: ProductTypeFields | null): boolean {
  if (!product) return false;
  const subsub = (product.subSubCategory || '').toLowerCase();
  return subsub.includes('accessor');
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
