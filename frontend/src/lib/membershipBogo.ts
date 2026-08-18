export function isContactLensProduct(product?: any): boolean {
  if (!product) return false;
  const values = [
    product.category,
    typeof product.categoryId === 'object' ? product.categoryId?.slug : product.categoryId,
    typeof product.categoryId === 'object' ? product.categoryId?.name : '',
    ...(Array.isArray(product.categories) ? product.categories : []),
  ];
  return values.some((v) => String(v || '').toLowerCase().includes('contact'));
}

export function isSolutionsOrAccessoriesProduct(product?: any): boolean {
  if (!product) return false;
  const blob = [
    product.category,
    product.subCategory,
    product.subSubCategory,
    product.subSubSubCategory,
    typeof product.categoryId === 'object' ? product.categoryId?.slug : product.categoryId,
  ].join(' ').toLowerCase();
  return blob.includes('solution') || blob.includes('accessor');
}

/** Frames from every category except contact lenses and Solutions & Accessories. */
export function isMembershipBogoEligible(product?: any): boolean {
  if (!product) return false;
  return !isContactLensProduct(product) && !isSolutionsOrAccessoriesProduct(product);
}

export type MembershipBogoUnit = {
  id: string;
  price: number;
  discount?: number;
  idx?: number;
  unitIndex?: number;
};

export function saleFramePrice(item: { product?: any; framePrice?: number }): number {
  const p = item.product;
  const n = p?.nonMemberPrice ?? p?.price?.selling ?? item.framePrice ?? 0;
  return Number(n);
}

export function saleUnitTotal(item: { product?: any; framePrice?: number; lensPrice?: number }): number {
  return saleFramePrice(item) + Number(item.lensPrice || 0);
}

function sortBySalePrice<T extends MembershipBogoUnit>(units: T[]): T[] {
  return [...units].sort((a, b) => {
    if (a.price !== b.price) return a.price - b.price;
    const ai = a.idx ?? 0;
    const bi = b.idx ?? 0;
    if (ai !== bi) return ai - bi;
    return (a.unitIndex ?? 0) - (b.unitIndex ?? 0);
  });
}

/**
 * Gold 1+1, ranked by sale price (frame + lens). Ties keep cart order.
 * 2 items → cheapest free (if equal, the earlier cart line).
 * 3 items → median free (all equal → middle cart line; 2 equal + 1 different → middle of the sorted list).
 * 4+ items → floor(n/2) cheapest free.
 */
export function pickMembershipFreeUnits<T extends MembershipBogoUnit>(units: T[]): T[] {
  const n = units.length;
  if (n < 2) return [];
  const sorted = sortBySalePrice(units);
  if (n === 2) return [sorted[0]];
  if (n === 3) return [sorted[1]];
  return sorted.slice(0, Math.floor(n / 2));
}

export function pickMembershipFreeUnit<T extends MembershipBogoUnit>(units: T[]): T | null {
  return pickMembershipFreeUnits(units)[0] ?? null;
}
