import { SubCategory } from './SubCategory';
import { SubSubCategory } from './SubSubCategory';
import { SubSubSubCategory } from './SubSubSubCategory';

async function dropIfExists(model: { collection: { dropIndex: (name: string) => Promise<unknown> } }, name: string) {
  try {
    await model.collection.dropIndex(name);
  } catch (err: any) {
    if (err?.code !== 27 && err?.codeName !== 'IndexNotFound') {
      console.warn(`Could not drop index ${name}:`, err?.message || err);
    }
  }
}

/** Nested catalog slugs are unique per parent, not globally. Drop the old unique slug indexes. */
export async function ensureCategoryIndexes() {
  await Promise.all([
    dropIfExists(SubCategory, 'slug_1'),
    dropIfExists(SubSubCategory, 'slug_1'),
    dropIfExists(SubSubSubCategory, 'slug_1'),
    dropIfExists(SubSubSubCategory, 'subSubCategoryId_1_slug_1'),
  ]);
  await Promise.all([
    SubCategory.syncIndexes(),
    SubSubCategory.syncIndexes(),
    SubSubSubCategory.syncIndexes(),
  ]);
}
