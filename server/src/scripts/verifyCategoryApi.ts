import 'dotenv/config';
import { signJWT } from '../lib/auth';

const ADMIN_USER_ID = '6a30f027dc02afc2e5588f6f'; // Mock admin user ID for JWT

async function run() {
  console.log('--- CATEGORY API VERIFICATION START ---');

  // 1. Generate Admin Token
  console.log('1. Generating Admin Token...');
  const token = signJWT({ userId: ADMIN_USER_ID, role: 'admin' });
  console.log('   Token:', token ? 'SUCCESS' : 'FAILED');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  let mainCategoryId = '';
  let subCategoryId = '';
  let duplicatedId = '';

  const rand = Date.now().toString().slice(-4);
  const mainCatCode = `CAT-TEST-${rand}`;
  const subCatCode = `SUBCAT-TEST-${rand}`;

  // 2. Create Main Category
  console.log('2. Creating Main Category...');
  try {
    const payload = {
      type: 'Category',
      basic: {
        name: `Test Eyeglasses ${rand}`,
        code: mainCatCode,
        icon: '👓',
        bannerImage: 'https://images.lenskart.com/banner.jpg',
        description: 'Test Main Category Description',
        displayOrder: 1,
        status: 'Active'
      },
      attributes: {
        genders: ['Men', 'Women'],
        ageGroups: ['18-25'],
        usageTypes: ['Daily Wear'],
        faceShapes: ['Round'],
        occasions: ['Casual']
      },
      filters: {
        brand: true,
        price: true,
        color: true,
        frameShape: true,
        frameMaterial: true,
        frameWidth: true,
        lensType: true,
        weight: true,
        features: true,
        faceShape: true
      },
      seo: {
        seoTitle: 'Test Eyeglasses SEO',
        metaDescription: 'SEO Meta Description',
        keywords: 'test, eyeglasses',
        canonicalUrl: '',
        ogImage: ''
      }
    };

    const res = await fetch('http://localhost:5000/api/admin/categories', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    console.log('   Status:', res.status);
    const data = (await res.json()) as any;
    if (res.status !== 201) {
      throw new Error(`Failed to create category: ${JSON.stringify(data)}`);
    }
    mainCategoryId = data.category._id;
    console.log('   Created Category ID:', mainCategoryId);
    console.log('   Attributes genders:', data.attributes.genders);
    console.log('   Filters brand:', data.filters.enabledFilters.brand);
  } catch (err: any) {
    console.error('   Error:', err.message);
    process.exit(1);
  }

  // 3. Create Sub Category linked to parent
  console.log('3. Creating Sub Category linked to parent...');
  try {
    const payload = {
      type: 'SubCategory',
      basic: {
        name: `Test Rectangle ${rand}`,
        code: subCatCode,
        description: 'Test Sub Category Description',
        displayOrder: 1,
        status: 'Active'
      },
      hierarchy: {
        categoryId: mainCategoryId
      },
      attributes: {
        genders: ['Men'],
        ageGroups: ['18-25'],
        usageTypes: ['Daily Wear'],
        faceShapes: ['Round'],
        occasions: ['Casual']
      },
      filters: {
        brand: true,
        price: true,
        color: true
      },
      seo: {
        seoTitle: 'Test Subcategory SEO',
        metaDescription: 'SEO sub description'
      }
    };

    const res = await fetch('http://localhost:5000/api/admin/categories', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    console.log('   Status:', res.status);
    const data = (await res.json()) as any;
    if (res.status !== 201) {
      throw new Error(`Failed to create subcategory: ${JSON.stringify(data)}`);
    }
    subCategoryId = data.category._id;
    console.log('   Created SubCategory ID:', subCategoryId);
    console.log('   Linked categoryId:', data.category.categoryId);
  } catch (err: any) {
    console.error('   Error:', err.message);
    process.exit(1);
  }

  // 4. Fetch Details
  console.log('4. Fetching Category Details...');
  try {
    const res = await fetch(`http://localhost:5000/api/admin/categories/Category/${mainCategoryId}`, { headers });
    console.log('   Status:', res.status);
    const data = (await res.json()) as any;
    console.log('   Fetched category name:', data.category.name);
    console.log('   Fetched SEO Title:', data.seo.seoTitle);
    console.log('   Fetched Genders:', data.attributes.genders);
    if (res.status !== 200) throw new Error('Failed to fetch details');
  } catch (err: any) {
    console.error('   Error:', err.message);
    process.exit(1);
  }

  // 5. Fetch Tree View
  console.log('5. Fetching Tree View and verifying hierarchy...');
  try {
    const res = await fetch('http://localhost:5000/api/admin/categories/tree', { headers });
    console.log('   Status:', res.status);
    const data = (await res.json()) as any;
    const mainNode = data.tree.find((n: any) => n.id === mainCategoryId);
    console.log('   Found parent category in tree:', !!mainNode);
    if (mainNode) {
      const childNode = mainNode.children.find((c: any) => c.id === subCategoryId);
      console.log('   Found child subcategory in tree parent children:', !!childNode);
    }
    if (res.status !== 200) throw new Error('Failed to fetch tree');
  } catch (err: any) {
    console.error('   Error:', err.message);
    process.exit(1);
  }

  // 6. Duplicate Category
  console.log('6. Duplicating Category...');
  try {
    const res = await fetch(`http://localhost:5000/api/admin/categories/Category/${mainCategoryId}/duplicate`, {
      method: 'POST',
      headers
    });
    console.log('   Status:', res.status);
    const data = (await res.json()) as any;
    if (res.status !== 201) throw new Error('Duplication failed');
    duplicatedId = data.category._id;
    console.log('   Duplicated Category ID:', duplicatedId);
    console.log('   Duplicated Category Name:', data.category.name);
    console.log('   Duplicated Category Code:', data.category.code);
  } catch (err: any) {
    console.error('   Error:', err.message);
    process.exit(1);
  }

  // 7. Export CSV
  console.log('7. Exporting Categories to CSV...');
  try {
    const res = await fetch('http://localhost:5000/api/admin/categories/export', { headers });
    console.log('   Status:', res.status);
    const csv = await res.text();
    console.log('   CSV header preview:', csv.split('\n')[0]);
    console.log('   CSV lines count:', csv.split('\n').length);
    if (res.status !== 200) throw new Error('Export failed');
  } catch (err: any) {
    console.error('   Error:', err.message);
    process.exit(1);
  }

  // 8. Import CSV (Self check with new code)
  console.log('8. Importing Categories from CSV...');
  try {
    const csvPayload = `Type,Name,Code,Slug,ParentCodeOrName,DisplayOrder,Status
Category,"Imported Eyeglasses ${rand}",CAT-IMP-${rand},imported-eyeglasses-${rand},N/A,10,Active
SubCategory,"Imported Aviator ${rand}",SUBCAT-IMP-${rand},imported-aviator-${rand},CAT-IMP-${rand},1,Active`;

    const res = await fetch('http://localhost:5000/api/admin/categories/import', {
      method: 'POST',
      headers,
      body: JSON.stringify({ csvData: csvPayload })
    });
    console.log('   Status:', res.status);
    const data = (await res.json()) as any;
    console.log('   Success:', data.success);
    console.log('   Imported count:', data.importedCount);
    console.log('   Skipped details:', data.skipped);
    if (res.status !== 200 || !data.success) throw new Error('Import failed');
  } catch (err: any) {
    console.error('   Error:', err.message);
    process.exit(1);
  }

  // 9. Soft Delete & Restore
  console.log('9. Soft Deleting Category...');
  try {
    const delRes = await fetch(`http://localhost:5000/api/admin/categories/Category/${mainCategoryId}`, {
      method: 'DELETE',
      headers
    });
    console.log('   Delete Status:', delRes.status);
    const delData = (await delRes.json()) as any;
    console.log('   Delete Success:', delData.success);

    // Query categories to make sure isDeleted is true
    const checkRes = await fetch('http://localhost:5000/api/admin/categories?isDeleted=true', { headers });
    const checkData = (await checkRes.json()) as any;
    const isFound = checkData.items.some((item: any) => item._id === mainCategoryId);
    console.log('   Found in soft-deleted tab list:', isFound);

    // Restore it
    console.log('   Restoring Category...');
    const restoreRes = await fetch(`http://localhost:5000/api/admin/categories/Category/${mainCategoryId}/restore`, {
      method: 'PUT',
      headers
    });
    console.log('   Restore Status:', restoreRes.status);
    const restoreData = (await restoreRes.json()) as any;
    console.log('   Restore Success:', restoreData.success);

    // Check again
    const checkRes2 = await fetch('http://localhost:5000/api/admin/categories?isDeleted=false', { headers });
    const checkData2 = (await checkRes2.json()) as any;
    const isFound2 = checkData2.items.some((item: any) => item._id === mainCategoryId);
    console.log('   Found in active categories tab list after restore:', isFound2);

    if (!isFound || !isFound2) throw new Error('Soft-delete or restore failed');
  } catch (err: any) {
    console.error('   Error:', err.message);
    process.exit(1);
  }

  console.log('--- CATEGORY API VERIFICATION COMPLETE ---');
}

run().catch(console.error);
