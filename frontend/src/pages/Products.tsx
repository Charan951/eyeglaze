import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ui/ProductCard';
import ProductFilters from '../components/ProductFilters';
import api from '../lib/api';
import { socket } from '../lib/socket';

interface Product {
  _id: string;
  sku: string;
  name: string;
  price: { original: number; selling: number };
  rating?: number;
  reviewCount?: number;
  isBestseller?: boolean;
  images?: string[];
  frame?: { type?: string };
}

const mockProducts: Product[] = [
  { _id: '1', sku: 'EG-2041', name: 'Matte Square Frame', price: { original: 999, selling: 1 }, rating: 4.7, reviewCount: 198, isBestseller: true, frame: { type: 'Square' }, images: ['/images/cat_prescription.png'] },
  { _id: '2', sku: 'EG-1067', name: 'Premium Clubmaster Frame', price: { original: 999, selling: 1 }, rating: 4.5, reviewCount: 143, isBestseller: false, frame: { type: 'Clubmaster' }, images: ['/images/cat_prescription.png'] },
  { _id: '3', sku: 'EG-3012', name: 'Classic Aviator', price: { original: 999, selling: 1 }, rating: 4.8, reviewCount: 312, isBestseller: true, frame: { type: 'Aviator' }, images: ['/images/cat_sunglasses.png'] },
  { _id: '4', sku: 'EG-4055', name: 'Round Metal Frame', price: { original: 999, selling: 1 }, rating: 4.3, reviewCount: 87, isBestseller: false, frame: { type: 'Round' }, images: ['/images/cat_prescription.png'] },
  { _id: '5', sku: 'EG-5099', name: 'Wayfarer Bold', price: { original: 999, selling: 1 }, rating: 4.6, reviewCount: 201, isBestseller: true, frame: { type: 'Wayfarer' }, images: ['/images/cat_blue_light.png'] },
  { _id: '6', sku: 'EG-6011', name: 'Cat Eye Chic', price: { original: 999, selling: 1 }, rating: 4.4, reviewCount: 156, isBestseller: false, frame: { type: 'Cat Eye' }, images: ['/images/cat_prescription.png'] },
];

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const loadProducts = () => {
      const params = searchParams.toString();
      api.get(`/products?${params}`)
        .then(res => {
          if (!active) return;
          setProducts(res.data.products || []);
          setTotal(res.data.total ?? (res.data.products || []).length);
        })
        .catch(() => {
          if (!active) return;
          setProducts(mockProducts);
          setTotal(mockProducts.length);
        })
        .finally(() => active && setLoading(false));
    };

    loadProducts();

    const handleProductChange = () => {
      loadProducts();
    };

    socket.on('product_changed', handleProductChange);

    return () => {
      active = false;
      socket.off('product_changed', handleProductChange);
    };
  }, [searchParams]);

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">All Frames</h1>
          <p className="text-[#A7A7A7] text-sm mt-1">{total || products.length} products found</p>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <div className="w-56 flex-shrink-0 hidden md:block">
          <ProductFilters />
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="text-center py-24 text-[#A7A7A7]">Loading...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 text-[#A7A7A7]">No products found.</div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(p => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
