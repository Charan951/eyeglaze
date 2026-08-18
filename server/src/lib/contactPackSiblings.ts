import { randomUUID } from 'crypto';
import { Product } from '../models/Product';
import { isAccessoryProduct, isContactLensProduct, isSolutionProduct } from './productType';

export type PackSiblingInput = {
  packName: string;
  price: number;
  originalPrice?: number;
  lensesPerBox?: number;
};

export type SerializedPackSibling = {
  _id: unknown;
  name: string;
  sku: string;
  packName: string;
  lensesPerBox?: number;
  price: number;
  originalPrice?: number;
  thumbnail?: string;
  status?: string;
};

const PACK_SELECT =
  '_id name sku packName lensesPerBox sellingPrice mrp price thumbnail images status isActive contactPackGroupId';

export function newContactPackGroupId() {
  return randomUUID();
}

export function isContactLensPackProduct(product?: {
  category?: string;
  categoryId?: { slug?: string; name?: string } | string;
  categories?: string[];
  subCategory?: string;
  subSubCategory?: string;
  solutionVariants?: unknown[];
} | null): boolean {
  return isContactLensProduct(product) && !isSolutionProduct(product) && !isAccessoryProduct(product);
}

export function inferLensesPerBox(packName?: string, fallback?: number) {
  if (fallback && fallback > 0) return fallback;
  const match = String(packName || '').match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

export function sortPackSiblings<T extends { lensesPerBox?: number; packName?: string }>(packs: T[]) {
  return [...packs].sort((a, b) => {
    const left = a.lensesPerBox || 0;
    const right = b.lensesPerBox || 0;
    if (left !== right) return left - right;
    return String(a.packName || '').localeCompare(String(b.packName || ''));
  });
}

export function serializePackSibling(p: any): SerializedPackSibling {
  const price = Number(p.sellingPrice ?? p.price?.selling ?? 0);
  const originalPrice = Number(p.mrp ?? p.price?.original ?? 0);
  return {
    _id: p._id,
    name: p.name,
    sku: p.sku,
    packName: p.packName || '',
    lensesPerBox: p.lensesPerBox,
    price,
    originalPrice: originalPrice || undefined,
    thumbnail: p.thumbnail || p.images?.[0],
    status: p.status,
  };
}

export function stripContactPackSiblingPayload(body: any): {
  pending: PackSiblingInput[];
  toLink: string[];
  toUnlink: string[];
} {
  const pending = Array.isArray(body?.contactPackSiblingsToCreate)
    ? body.contactPackSiblingsToCreate.filter((p: PackSiblingInput) => p?.packName && Number(p.price) > 0)
    : [];
  const toLink = Array.isArray(body?.contactPackSiblingIdsToLink)
    ? body.contactPackSiblingIdsToLink.filter(Boolean).map(String)
    : [];
  const toUnlink = Array.isArray(body?.contactPackSiblingIdsToUnlink)
    ? body.contactPackSiblingIdsToUnlink.filter(Boolean).map(String)
    : [];
  if (body && typeof body === 'object') {
    delete body.contactPackSiblingsToCreate;
    delete body.contactPackSiblingIdsToLink;
    delete body.contactPackSiblingIdsToUnlink;
  }
  return { pending, toLink, toUnlink };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function uniqueValue(field: 'sku' | 'slug', base: string) {
  const cleaned = (base || 'pack').slice(0, 80) || 'pack';
  let candidate = cleaned;
  let n = 2;
  while (await Product.exists({ [field]: candidate })) {
    candidate = `${cleaned}-${n}`;
    n += 1;
    if (n > 40) {
      candidate = `${cleaned}-${Date.now().toString(36).slice(-6)}`;
      break;
    }
  }
  return candidate;
}

export async function findContactPackSiblings(
  groupId: string,
  opts?: { includeInactive?: boolean }
): Promise<SerializedPackSibling[]> {
  if (!groupId) return [];
  const query: Record<string, unknown> = { contactPackGroupId: groupId };
  if (!opts?.includeInactive) {
    query.isActive = true;
    query.status = { $nin: ['Draft', 'Inactive', 'Scheduled'] };
  }
  const list = await Product.find(query).select(PACK_SELECT).lean();
  return sortPackSiblings(list.map(serializePackSibling));
}

export async function createContactPackSiblings(
  source: any,
  packs: PackSiblingInput[],
  groupId: string
) {
  const src = typeof source.toObject === 'function' ? source.toObject() : { ...source };
  delete src._id;
  delete src.__v;
  delete src.createdAt;
  delete src.updatedAt;
  delete src.contactPackSiblings;
  const baseSku = String(src.sku || 'EG-PACK').replace(/-\d+P$/i, '');
  const baseSlug = String(src.slug || 'product').replace(/-\d+-lens.*$/i, '');
  const created = [];

  for (const pack of packs) {
    const lensesPerBox = inferLensesPerBox(pack.packName, pack.lensesPerBox);
    const packSlug = slugify(pack.packName) || `pack-${lensesPerBox}`;
    const selling = Number(pack.price) || 0;
    const mrp = Number(pack.originalPrice) || selling;
    const sibling = await Product.create({
      ...src,
      soldCount: 0,
      reviewCount: 0,
      contactPackGroupId: groupId,
      packName: pack.packName,
      lensesPerBox,
      sellingPrice: selling,
      mrp,
      price: { original: mrp, selling },
      contactPackOptions: [],
      sku: await uniqueValue('sku', `${baseSku}-${lensesPerBox}P`),
      slug: await uniqueValue('slug', `${baseSlug}-${packSlug}`),
    });
    created.push(sibling);
  }
  return created;
}

export async function syncContactPackFamily(
  product: any,
  pending: PackSiblingInput[],
  toLink: string[],
  toUnlink: string[]
) {
  if (!isContactLensPackProduct(product)) return product;

  if (!product.contactPackGroupId) {
    product.contactPackGroupId = newContactPackGroupId();
  }
  product.contactPackOptions = [];
  if (product.packName) {
    product.lensesPerBox = inferLensesPerBox(product.packName, product.lensesPerBox);
  }
  await product.save();

  const groupId = product.contactPackGroupId as string;
  if (pending.length > 0) {
    await createContactPackSiblings(product, pending, groupId);
  }
  if (toLink.length > 0) {
    await Product.updateMany(
      { _id: { $in: toLink } },
      { $set: { contactPackGroupId: groupId } }
    );
  }
  if (toUnlink.length > 0) {
    const unlinkIds = toUnlink.filter((id) => String(id) !== String(product._id));
    await Promise.all(
      unlinkIds.map((id) =>
        Product.findByIdAndUpdate(id, { $set: { contactPackGroupId: newContactPackGroupId() } })
      )
    );
  }
  return product;
}

const PACK_GROUP_KEY = {
  $cond: [
    { $gt: [{ $strLenCP: { $ifNull: ['$contactPackGroupId', ''] } }, 0] },
    '$contactPackGroupId',
    { $toString: '$_id' },
  ],
};

function familySort(sortOption: Record<string, 1 | -1>): Record<string, 1 | -1> {
  if (sortOption['price.selling'] === 1 || sortOption.sellingPrice === 1) return { _familyMinPrice: 1 };
  if (sortOption['price.selling'] === -1 || sortOption.sellingPrice === -1) return { _familyMinPrice: -1 };
  if (sortOption.rating === -1) return { _familyRating: -1 };
  if (sortOption.soldCount === -1) return { _familySold: -1 };
  return { _familyNewest: -1 };
}

export async function findCollapsedPackProducts(
  query: Record<string, any>,
  sortOption: Record<string, 1 | -1>,
  skip: number,
  limit: number
) {
  const match = Object.keys(query).length > 0 ? query : {};
  const listPipeline: Record<string, unknown>[] = [
    { $match: match },
    {
      $addFields: {
        _packGroupKey: PACK_GROUP_KEY,
        _packRank: { $ifNull: ['$lensesPerBox', 9999] },
      },
    },
    { $sort: { _packGroupKey: 1, _packRank: 1, sellingPrice: 1, createdAt: 1 } },
    {
      $group: {
        _id: '$_packGroupKey',
        doc: { $first: '$$ROOT' },
        packNames: { $push: '$packName' },
        packCount: { $sum: 1 },
        familyNewest: { $max: '$createdAt' },
        familyMinPrice: { $min: { $ifNull: ['$sellingPrice', '$price.selling'] } },
        familySold: { $max: { $ifNull: ['$soldCount', 0] } },
        familyRating: { $max: { $ifNull: ['$rating', 0] } },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$doc',
            {
              contactPackCount: '$packCount',
              contactPackLabels: '$packNames',
              _familyNewest: '$familyNewest',
              _familyMinPrice: '$familyMinPrice',
              _familySold: '$familySold',
              _familyRating: '$familyRating',
            },
          ],
        },
      },
    },
    { $sort: familySort(sortOption) },
    { $skip: Math.max(0, skip) },
    { $limit: Math.max(1, limit) },
    { $project: { _packGroupKey: 0, _packRank: 0, _familyNewest: 0, _familyMinPrice: 0, _familySold: 0, _familyRating: 0 } },
  ];

  const countPipeline: Record<string, unknown>[] = [
    { $match: match },
    { $addFields: { _packGroupKey: PACK_GROUP_KEY } },
    { $group: { _id: '$_packGroupKey' } },
    { $count: 'total' },
  ];

  const [products, countRows] = await Promise.all([
    Product.aggregate(listPipeline),
    Product.aggregate(countPipeline),
  ]);
  const total = countRows[0]?.total || 0;
  return { products, total };
}
