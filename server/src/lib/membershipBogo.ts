import { isFrameProduct, type ProductTypeFields } from './productType';

export function saleFramePrice(product?: ProductTypeFields | null, fallback = 0): number {
  const p = product as ProductTypeFields & {
    nonMemberPrice?: number;
    price?: { selling?: number };
  } | null;
  if (!p) return fallback;
  if (typeof p.nonMemberPrice === 'number') return p.nonMemberPrice;
  if (typeof p.price?.selling === 'number') return p.price.selling;
  return fallback;
}

export type MembershipBogoUnit = {
  idx: number;
  unitIndex: number;
  /** Sale (non-member) total used to pick cheapest / medium. */
  price: number;
  /** Amount actually waived (member frame + lens). */
  discount: number;
};

export function isMembershipBogoEligible(product?: ProductTypeFields | null): boolean {
  return isFrameProduct(product);
}

function sortBySalePrice<T extends MembershipBogoUnit>(units: T[]): T[] {
  return [...units].sort((a, b) => {
    if (a.price !== b.price) return a.price - b.price;
    if (a.idx !== b.idx) return a.idx - b.idx;
    return a.unitIndex - b.unitIndex;
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
