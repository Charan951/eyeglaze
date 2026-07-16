import api from './api';

export interface LoaderProductsResponse {
  products: any[];
  total: number;
}

// Loader for UserLayout
export async function userLayoutLoader() {
  const [products, categories] = await Promise.all([
    api.get('/products?limit=1000').then(res => res.data.products || []).catch(() => []),
    api.get('/categories/tree').then(res => res.data.tree || []).catch(() => []),
  ]);
  return { products, categories };
}

// Loader for Landing Page
export async function landingLoader() {
  const [banners, videos, reels, categories, featuredProducts] = await Promise.all([
    api.get('/banners').then(res => res.data).catch(() => []),
    api.get('/homepage-videos').then(res => res.data).catch(() => []),
    api.get('/reels').then(res => res.data).catch(() => []),
    api.get('/categories').then(res => res.data).catch(() => []),
    api.get('/products?limit=12').then(res => res.data.products || res.data || []).catch(() => []),
  ]);
  return { banners, videos, reels, categories, featuredProducts };
}

// Loader for Products Page
export async function productsLoader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const params = url.searchParams.toString();
  
  const [productsData, categoriesData] = await Promise.all([
    api.get(`/products?${params}`)
      .then(res => ({
        products: res.data.products || [],
        total: res.data.total ?? (res.data.products || []).length
      }))
      .catch(() => ({ products: [], total: 0 })),
    api.get('/categories').then(res => res.data).catch(() => []),
  ]);
  return { productsData, categoriesData };
}

// Loader for Product Detail Page
export async function productDetailLoader({ params }: { params: any }) {
  const { id } = params;
  try {
    const product = await api.get(`/products/${id}`).then(res => res.data.product || res.data);
    const category = product.category || (product.categories && product.categories[0]);
    const similarParams = category ? { category, limit: 10 } : { limit: 10 };
    
    const [similarProducts, videos] = await Promise.all([
      api.get('/products', { params: similarParams }).then(res => res.data.products || res.data || []).catch(() => []),
      api.get('/homepage-videos').then(res => res.data).catch(() => []),
    ]);
    return { product, similarProducts, videos };
  } catch (error) {
    console.error('Failed to load product details in loader:', error);
    throw new Response('Product Not Found', { status: 404 });
  }
}

// Loader for Offers Page
export async function offersLoader() {
  const coupons = await api.get('/coupons')
    .then(res => res.data.coupons || [])
    .catch(() => []);
  return { coupons };
}
