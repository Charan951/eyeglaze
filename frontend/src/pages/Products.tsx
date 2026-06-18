import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ui/ProductCard';
import ProductFilters from '../components/ProductFilters';
import api from '../lib/api';
import { socket } from '../lib/socket';
import SEO from '../components/SEO';

interface Product {
  _id: string;
  sku: string;
  name: string;
  price: { original: number; selling: number };
  rating?: number;
  reviewCount?: number;
  isBestseller?: boolean;
  brand?: string;
  shape?: string;
  frameSize?: string;
  frameColor?: string;
  frameType?: string;
  weight?: string;
  isPremium?: boolean;
  images?: string[];
  frame?: { type?: string };
  colors?: Array<{
    name: string;
    hex: string;
  }>;
}

const CATEGORIES = [
  { value: 'prescription', label: 'Prescription Glasses' },
  { value: 'sunglasses', label: 'Sunglasses' },
  { value: 'blue_light', label: 'Blue Light Glasses' },
  { value: 'contact_lenses', label: 'Contact Lenses' },
  { value: 'kids', label: 'Kids Eyewear' },
];

const SHAPES = ['Aviator', 'Rectangle', 'Round', 'Oval', 'Cat Eye', 'Geometric', 'Clubmaster'];
const SIZES = ['Small', 'Medium', 'Large'];
const BRANDS = ['Vincent Chase', 'John Jacobs', 'Hustlr', 'Lenskart Air'];
const COLORS = ['Black', 'Brown', 'Gold', 'Silver', 'Transparent', 'Pink'];
const TYPES = ['Full Rim', 'Half Rim', 'Rimless'];
const MATERIALS = ['Metal', 'Acetate', 'TR90', 'Titanium'];
const WEIGHTS = ['Lightweight', 'Medium', 'Heavy'];
const FACESHAPES = ['Round', 'Oval', 'Square', 'Diamond'];

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
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Mobile States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'tile' | 'list' | 'grid'>('tile');
  const [activeFilterTab, setActiveFilterTab] = useState('price');

  // Local price range state for mobile slider
  const maxPriceQuery = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 3000;
  const [mobilePriceVal, setMobilePriceVal] = useState(maxPriceQuery);

  useEffect(() => {
    setMobilePriceVal(maxPriceQuery);
  }, [maxPriceQuery]);

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

  // Query utilities
  const toggleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const existing = params.get(key);
    let values = existing ? existing.split(',').map(v => v.trim()).filter(Boolean) : [];

    if (values.includes(value)) {
      values = values.filter(v => v !== value);
    } else {
      values.push(value);
    }

    if (values.length > 0) {
      params.set(key, values.join(','));
    } else {
      params.delete(key);
    }
    params.delete('page');
    navigate(`/products?${params.toString()}`);
  };

  const updateSingleFilter = (key: string, value: string | boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === true || (typeof value === 'string' && value !== '')) {
      params.set(key, String(value));
    } else {
      params.delete(key);
    }
    params.delete('page');
    navigate(`/products?${params.toString()}`);
  };

  const clearAll = () => {
    const params = new URLSearchParams();
    const search = searchParams.get('search');
    const sort = searchParams.get('sort');
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);
    navigate(`/products?${params.toString()}`);
  };

  const filterKeys = ['category', 'gender', 'shape', 'frameSize', 'frameColor', 'frameType', 'material', 'weight', 'faceShape', 'maxPrice', 'rating', 'isPremium'];
  const activeKeys: string[] = [];
  searchParams.forEach((_, key) => {
    if (!activeKeys.includes(key)) {
      activeKeys.push(key);
    }
  });
  const activeFilterCount = activeKeys.filter(key => filterKeys.includes(key)).length;

  const filterTabs = [
    { id: 'price', label: 'Price' },
    { id: 'category', label: 'Category' },
    { id: 'gender', label: 'Gender' },
    { id: 'shape', label: 'Shape & Style' },
    { id: 'size', label: 'Frame Size' },
    { id: 'brand', label: 'Brand' },
    { id: 'color', label: 'Frame Color' },
    { id: 'type', label: 'Frame Type' },
    { id: 'material', label: 'Material' },
    { id: 'weight', label: 'Weight' },
    { id: 'faceShape', label: 'Face Shape' },
    { id: 'rating', label: 'Rating' },
    { id: 'toggles', label: 'Toggles' },
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Best Rated' },
    { value: 'bestseller', label: 'Bestsellers' },
  ];

  return (
    <div className="min-h-screen pb-16 md:pb-6">
      <SEO 
        title="Shop Luxury Designer Eyeglasses & Sunglasses"
        description="Explore our curated collection of premium designer frames, eyeglasses, and prescription sunglasses. Find the perfect shape and fit for your face."
        keywords="designer glasses, luxury eyewear, shop eyeglasses, prescription sunglasses, round frames, square frames, wayfarer"
      />
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">All Frames</h1>
          <p className="text-[#A7A7A7] text-sm mt-1">{total || products.length} products found</p>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters - Desktop only */}
        <div className="w-56 flex-shrink-0 hidden md:block">
          <ProductFilters />
        </div>

        {/* Product Grid / Details List */}
        <div className="flex-1">
          {loading ? (
            <div className="text-center py-24 text-[#A7A7A7]">Loading...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 text-[#A7A7A7]">No products found.</div>
          ) : (
            <div className={
              viewMode === 'list' 
                ? "flex flex-col gap-4" 
                : viewMode === 'grid'
                  ? "grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2"
                  : "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            }>
              {products.map(p => (
                <ProductCard 
                  key={p._id} 
                  product={p} 
                  layout={viewMode === 'list' ? 'horizontal' : 'grid'}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* STICKY BOTTOM BAR FOR MOBILE */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#131314] border-t border-[#2A2A2D] flex md:hidden h-14 select-none">
        <button
          onClick={() => setIsSortOpen(true)}
          className="flex-1 flex flex-col items-center justify-center text-[10px] font-bold text-gray-400 hover:text-white border-r border-[#2A2A2D]/40"
        >
          <span className="text-sm">⇅</span>
          <span className="mt-0.5">Sort By</span>
        </button>
        <button
          onClick={() => setIsFilterOpen(true)}
          className="flex-1 flex flex-col items-center justify-center text-[10px] font-bold text-gray-400 hover:text-white border-r border-[#2A2A2D]/40"
        >
          <span className="text-sm">⚙️</span>
          <span className="mt-0.5 flex items-center gap-1">
            Filters 
            {activeFilterCount > 0 && (
              <span className="bg-[#D4A04D] text-black w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0">
                {activeFilterCount}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setIsViewOpen(true)}
          className="flex-1 flex flex-col items-center justify-center text-[10px] font-bold text-gray-400 hover:text-white"
        >
          <span className="text-sm">
            {viewMode === 'tile' ? '▢' : viewMode === 'list' ? '☰' : '⊞'}
          </span>
          <span className="mt-0.5">
            {viewMode === 'tile' ? 'Tile View' : viewMode === 'list' ? 'List View' : 'Grid View'}
          </span>
        </button>
      </div>

      {/* SORT BOTTOM SHEET FOR MOBILE */}
      {isSortOpen && (
        <>
          <div onClick={() => setIsSortOpen(false)} className="fixed inset-0 bg-black/70 z-40" />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#131314] border-t border-[#2A2A2D] rounded-t-2xl p-4 flex flex-col gap-4 animate-slide-in select-none max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#2A2A2D]/40 pb-2.5">
              <span className="text-white font-extrabold text-xs uppercase tracking-wider">Sort By</span>
              <button 
                onClick={() => setIsSortOpen(false)} 
                className="text-[#D4A04D] text-xs font-bold bg-transparent border-none cursor-pointer uppercase hover:underline"
              >
                Close
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {sortOptions.map(o => {
                const isSelected = (searchParams.get('sort') || 'newest') === o.value;
                return (
                  <button
                    key={o.value}
                    onClick={() => {
                      updateSingleFilter('sort', o.value);
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left py-3 px-3 text-xs font-extrabold uppercase rounded-xl transition-colors cursor-pointer border border-transparent ${
                      isSelected 
                        ? 'bg-[#D4A04D]/10 text-[#D4A04D] border-[#D4A04D]/20' 
                        : 'text-gray-400 hover:bg-[#1C1C1E] hover:text-white'
                    }`}
                  >
                    <span className="flex justify-between items-center">
                      <span>{o.label}</span>
                      {isSelected && <span className="text-[#D4A04D]">✓</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* CHANGE VIEW BOTTOM SHEET FOR MOBILE */}
      {isViewOpen && (
        <>
          <div onClick={() => setIsViewOpen(false)} className="fixed inset-0 bg-black/70 z-40" />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#131314] border-t border-[#2A2A2D] rounded-t-2xl p-4 flex flex-col gap-4 animate-slide-in select-none max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#2A2A2D]/40 pb-2.5">
              <span className="text-white font-extrabold text-xs uppercase tracking-wider">Change View</span>
              <button 
                onClick={() => setIsViewOpen(false)} 
                className="text-gray-400 hover:text-white text-lg bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="flex flex-col divide-y divide-[#2A2A2D]/40">
              {/* Tile View Option */}
              <button
                onClick={() => {
                  setViewMode('tile');
                  setIsViewOpen(false);
                }}
                className="w-full py-4 flex items-center justify-between text-left cursor-pointer group text-white bg-transparent border-none"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${viewMode === 'tile' ? 'border-[#D4A04D]' : 'border-gray-500'}`}>
                    {viewMode === 'tile' && <div className="w-2 h-2 rounded-full bg-[#D4A04D]" />}
                  </div>
                  <span className={`text-xs font-extrabold uppercase tracking-wide ${viewMode === 'tile' ? 'text-[#D4A04D]' : 'text-gray-400 group-hover:text-white'}`}>Tile View</span>
                </div>
                <svg className={`w-5 h-5 ${viewMode === 'tile' ? 'text-[#D4A04D]' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
              </button>

              {/* List View Option */}
              <button
                onClick={() => {
                  setViewMode('list');
                  setIsViewOpen(false);
                }}
                className="w-full py-4 flex items-center justify-between text-left cursor-pointer group text-white bg-transparent border-none"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${viewMode === 'list' ? 'border-[#D4A04D]' : 'border-gray-500'}`}>
                    {viewMode === 'list' && <div className="w-2 h-2 rounded-full bg-[#D4A04D]" />}
                  </div>
                  <span className={`text-xs font-extrabold uppercase tracking-wide ${viewMode === 'list' ? 'text-[#D4A04D]' : 'text-gray-400 group-hover:text-white'}`}>List View</span>
                </div>
                <svg className={`w-5 h-5 ${viewMode === 'list' ? 'text-[#D4A04D]' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <line x1="3" y1="8" x2="21" y2="8" stroke="currentColor" strokeWidth="2" />
                  <line x1="3" y1="16" x2="21" y2="16" stroke="currentColor" strokeWidth="2" />
                  <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>

              {/* Grid View Option */}
              <button
                onClick={() => {
                  setViewMode('grid');
                  setIsViewOpen(false);
                }}
                className="w-full py-4 flex items-center justify-between text-left cursor-pointer group text-white bg-transparent border-none"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${viewMode === 'grid' ? 'border-[#D4A04D]' : 'border-gray-500'}`}>
                    {viewMode === 'grid' && <div className="w-2 h-2 rounded-full bg-[#D4A04D]" />}
                  </div>
                  <span className={`text-xs font-extrabold uppercase tracking-wide ${viewMode === 'grid' ? 'text-[#D4A04D]' : 'text-gray-400 group-hover:text-white'}`}>Grid View</span>
                </div>
                <svg className={`w-5 h-5 ${viewMode === 'grid' ? 'text-[#D4A04D]' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                  <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                  <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                  <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* FULLSCREEN FILTER DRAWER FOR MOBILE */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B0B0C] flex flex-col select-none">
          {/* Header */}
          <div className="h-14 border-b border-[#2A2A2D] flex items-center justify-between px-4 bg-[#131314] shrink-0">
            <span className="text-white font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5">
              <span>⚙️</span> Filters
            </span>
            <button 
              onClick={() => setIsFilterOpen(false)} 
              className="text-gray-400 hover:text-white text-xl bg-transparent border-none cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Drawer Body - Split Pane */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Pane - Vertical Tabs */}
            <div className="w-1/3 bg-[#131314] border-r border-[#2A2A2D]/80 overflow-y-auto flex flex-col scrollbar-none">
              {filterTabs.map(tab => {
                const isSelected = activeFilterTab === tab.id;
                
                // Show dot indicator if this section has active values
                let hasActiveValues = false;
                if (tab.id === 'price' && searchParams.has('maxPrice')) hasActiveValues = true;
                if (tab.id === 'category' && searchParams.has('category')) hasActiveValues = true;
                if (tab.id === 'gender' && searchParams.has('gender')) hasActiveValues = true;
                if (tab.id === 'shape' && searchParams.has('shape')) hasActiveValues = true;
                if (tab.id === 'size' && searchParams.has('frameSize')) hasActiveValues = true;
                if (tab.id === 'brand' && searchParams.has('brand')) hasActiveValues = true;
                if (tab.id === 'color' && searchParams.has('frameColor')) hasActiveValues = true;
                if (tab.id === 'type' && searchParams.has('frameType')) hasActiveValues = true;
                if (tab.id === 'material' && searchParams.has('material')) hasActiveValues = true;
                if (tab.id === 'weight' && searchParams.has('weight')) hasActiveValues = true;
                if (tab.id === 'faceShape' && searchParams.has('faceShape')) hasActiveValues = true;
                if (tab.id === 'rating' && searchParams.has('rating')) hasActiveValues = true;
                if (tab.id === 'toggles' && searchParams.has('isPremium')) hasActiveValues = true;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilterTab(tab.id)}
                    className={`text-left py-3.5 px-3 text-[10px] font-extrabold uppercase tracking-wide border-b border-[#2A2A2D]/30 cursor-pointer relative ${
                      isSelected 
                        ? 'bg-[#0B0B0C] text-[#D4A04D] border-l-4 border-l-[#D4A04D]' 
                        : 'text-gray-400 bg-[#131314] hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {hasActiveValues && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4A04D] absolute right-2 top-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Pane - Options Content */}
            <div className="w-2/3 bg-[#0B0B0C] overflow-y-auto p-4 scrollbar-none">
              
              {activeFilterTab === 'price' && (
                <div className="space-y-4 animate-fade-in">
                  <h4 className="text-white text-xs font-extrabold uppercase tracking-wider">Select Max Price</h4>
                  <div className="flex justify-between items-center text-[10px] text-[#A7A7A7] font-bold">
                    <span>₹0</span>
                    <span className="text-[#D4A04D] bg-[#D4A04D]/10 border border-[#D4A04D]/25 px-2.5 py-0.5 rounded font-extrabold">
                      Max: ₹{mobilePriceVal}
                    </span>
                    <span>₹3,000</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    step="50"
                    value={mobilePriceVal}
                    onChange={e => setMobilePriceVal(Number(e.target.value))}
                    onMouseUp={() => updateSingleFilter('maxPrice', String(mobilePriceVal))}
                    onTouchEnd={() => updateSingleFilter('maxPrice', String(mobilePriceVal))}
                    className="w-full h-1 bg-[#1C1C1E] rounded-lg appearance-none cursor-pointer accent-[#D4A04D]"
                  />
                </div>
              )}

              {activeFilterTab === 'category' && (
                <div className="space-y-3.5 animate-fade-in">
                  <h4 className="text-white text-xs font-extrabold uppercase tracking-wider mb-2">Category</h4>
                  {CATEGORIES.map(cat => {
                    const isChecked = searchParams.get('category') === cat.value;
                    return (
                      <label key={cat.value} className="flex items-center gap-3 cursor-pointer group text-xs py-1">
                        <input
                          type="radio"
                          name="categoryMobile"
                          checked={isChecked}
                          onChange={() => updateSingleFilter('category', cat.value)}
                          className="accent-[#D4A04D] w-4 h-4 cursor-pointer"
                        />
                        <span className={`text-[#A7A7A7] group-hover:text-white transition-colors uppercase font-bold text-[10px] tracking-wide ${isChecked ? 'text-[#D4A04D]' : ''}`}>
                          {cat.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {activeFilterTab === 'gender' && (
                <div className="space-y-3.5 animate-fade-in">
                  <h4 className="text-white text-xs font-extrabold uppercase tracking-wider mb-2">Gender</h4>
                  {[
                    { value: 'men', label: 'Men' },
                    { value: 'women', label: 'Women' },
                    { value: 'kids', label: 'Kids' },
                    { value: 'unisex', label: 'Unisex' }
                  ].map(g => {
                    const activeGenders = searchParams.get('gender')?.split(',') || [];
                    const isChecked = activeGenders.includes(g.value);
                    return (
                      <label key={g.value} className="flex items-center gap-3 cursor-pointer group text-xs py-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFilter('gender', g.value)}
                          className="accent-[#D4A04D] w-4 h-4 rounded cursor-pointer border-[#2A2A2D] bg-[#0B0B0C]"
                        />
                        <span className={`text-[#A7A7A7] group-hover:text-white transition-colors uppercase font-bold text-[10px] tracking-wide ${isChecked ? 'text-white' : ''}`}>
                          {g.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {activeFilterTab === 'shape' && (
                <div className="space-y-3.5 animate-fade-in">
                  <h4 className="text-white text-xs font-extrabold uppercase tracking-wider mb-2">Shape & Style</h4>
                  {SHAPES.map(shape => {
                    const activeShapes = searchParams.get('shape')?.split(',') || [];
                    const isChecked = activeShapes.includes(shape);
                    return (
                      <label key={shape} className="flex items-center gap-3 cursor-pointer group text-xs py-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFilter('shape', shape)}
                          className="accent-[#D4A04D] w-4 h-4 rounded cursor-pointer border-[#2A2A2D] bg-[#0B0B0C]"
                        />
                        <span className={`text-[#A7A7A7] group-hover:text-white transition-colors uppercase font-bold text-[10px] tracking-wide ${isChecked ? 'text-white' : ''}`}>
                          {shape}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {activeFilterTab === 'size' && (
                <div className="space-y-3.5 animate-fade-in">
                  <h4 className="text-white text-xs font-extrabold uppercase tracking-wider mb-2">Frame Size</h4>
                  {SIZES.map(size => {
                    const activeSizes = searchParams.get('frameSize')?.split(',') || [];
                    const isChecked = activeSizes.includes(size);
                    return (
                      <label key={size} className="flex items-center gap-3 cursor-pointer group text-xs py-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFilter('frameSize', size)}
                          className="accent-[#D4A04D] w-4 h-4 rounded cursor-pointer border-[#2A2A2D] bg-[#0B0B0C]"
                        />
                        <span className={`text-[#A7A7A7] group-hover:text-white transition-colors uppercase font-bold text-[10px] tracking-wide ${isChecked ? 'text-white' : ''}`}>
                          {size}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {activeFilterTab === 'brand' && (
                <div className="space-y-3.5 animate-fade-in">
                  <h4 className="text-white text-xs font-extrabold uppercase tracking-wider mb-2">Brand</h4>
                  {BRANDS.map(brand => {
                    const activeBrands = searchParams.get('brand')?.split(',') || [];
                    const isChecked = activeBrands.includes(brand);
                    return (
                      <label key={brand} className="flex items-center gap-3 cursor-pointer group text-xs py-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFilter('brand', brand)}
                          className="accent-[#D4A04D] w-4 h-4 rounded cursor-pointer border-[#2A2A2D] bg-[#0B0B0C]"
                        />
                        <span className={`text-[#A7A7A7] group-hover:text-white transition-colors uppercase font-bold text-[10px] tracking-wide ${isChecked ? 'text-white' : ''}`}>
                          {brand}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {activeFilterTab === 'color' && (
                <div className="space-y-3.5 animate-fade-in">
                  <h4 className="text-white text-xs font-extrabold uppercase tracking-wider mb-2">Frame Color</h4>
                  {COLORS.map(color => {
                    const activeColors = searchParams.get('frameColor')?.split(',') || [];
                    const isChecked = activeColors.includes(color);
                    
                    const colorSwatches: Record<string, string> = {
                      Black: 'bg-black border border-[#2A2A2D]',
                      Brown: 'bg-[#5C3D2E]',
                      Gold: 'bg-[#D4A04D]',
                      Silver: 'bg-[#C0C0C0]',
                      Transparent: 'bg-white/20 border border-dashed border-[#A7A7A7]',
                      Pink: 'bg-[#FF69B4]',
                    };

                    return (
                      <label key={color} className="flex items-center gap-3 cursor-pointer group text-xs py-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFilter('frameColor', color)}
                          className="accent-[#D4A04D] w-4 h-4 rounded cursor-pointer border-[#2A2A2D] bg-[#0B0B0C]"
                        />
                        <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${colorSwatches[color] || 'bg-gray-400'}`} />
                        <span className={`text-[#A7A7A7] group-hover:text-white transition-colors uppercase font-bold text-[10px] tracking-wide ${isChecked ? 'text-white' : ''}`}>
                          {color}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {activeFilterTab === 'type' && (
                <div className="space-y-3.5 animate-fade-in">
                  <h4 className="text-white text-xs font-extrabold uppercase tracking-wider mb-2">Frame Type</h4>
                  {TYPES.map(type => {
                    const activeTypes = searchParams.get('frameType')?.split(',') || [];
                    const isChecked = activeTypes.includes(type);
                    return (
                      <label key={type} className="flex items-center gap-3 cursor-pointer group text-xs py-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFilter('frameType', type)}
                          className="accent-[#D4A04D] w-4 h-4 rounded cursor-pointer border-[#2A2A2D] bg-[#0B0B0C]"
                        />
                        <span className={`text-[#A7A7A7] group-hover:text-white transition-colors uppercase font-bold text-[10px] tracking-wide ${isChecked ? 'text-white' : ''}`}>
                          {type}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {activeFilterTab === 'material' && (
                <div className="space-y-3.5 animate-fade-in">
                  <h4 className="text-white text-xs font-extrabold uppercase tracking-wider mb-2">Material</h4>
                  {MATERIALS.map(mat => {
                    const activeMaterials = searchParams.get('material')?.split(',') || [];
                    const isChecked = activeMaterials.includes(mat);
                    return (
                      <label key={mat} className="flex items-center gap-3 cursor-pointer group text-xs py-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFilter('material', mat)}
                          className="accent-[#D4A04D] w-4 h-4 rounded cursor-pointer border-[#2A2A2D] bg-[#0B0B0C]"
                        />
                        <span className={`text-[#A7A7A7] group-hover:text-white transition-colors uppercase font-bold text-[10px] tracking-wide ${isChecked ? 'text-white' : ''}`}>
                          {mat}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {activeFilterTab === 'weight' && (
                <div className="space-y-3.5 animate-fade-in">
                  <h4 className="text-white text-xs font-extrabold uppercase tracking-wider mb-2">Weight</h4>
                  {WEIGHTS.map(weight => {
                    const activeWeights = searchParams.get('weight')?.split(',') || [];
                    const isChecked = activeWeights.includes(weight);
                    return (
                      <label key={weight} className="flex items-center gap-3 cursor-pointer group text-xs py-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFilter('weight', weight)}
                          className="accent-[#D4A04D] w-4 h-4 rounded cursor-pointer border-[#2A2A2D] bg-[#0B0B0C]"
                        />
                        <span className={`text-[#A7A7A7] group-hover:text-white transition-colors uppercase font-bold text-[10px] tracking-wide ${isChecked ? 'text-white' : ''}`}>
                          {weight}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {activeFilterTab === 'faceShape' && (
                <div className="space-y-3.5 animate-fade-in">
                  <h4 className="text-white text-xs font-extrabold uppercase tracking-wider mb-2">Suitable Face Shape</h4>
                  {FACESHAPES.map(face => {
                    const activeFaces = searchParams.get('faceShape')?.split(',') || [];
                    const isChecked = activeFaces.includes(face);
                    return (
                      <label key={face} className="flex items-center gap-3 cursor-pointer group text-xs py-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFilter('faceShape', face)}
                          className="accent-[#D4A04D] w-4 h-4 rounded cursor-pointer border-[#2A2A2D] bg-[#0B0B0C]"
                        />
                        <span className={`text-[#A7A7A7] group-hover:text-white transition-colors uppercase font-bold text-[10px] tracking-wide ${isChecked ? 'text-white' : ''}`}>
                          {face}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {activeFilterTab === 'rating' && (
                <div className="space-y-3.5 animate-fade-in">
                  <h4 className="text-white text-xs font-extrabold uppercase tracking-wider mb-2">Select Rating</h4>
                  {[
                    { value: '4', label: '★ 4.0 & above' },
                    { value: '4.5', label: '★ 4.5 & above' },
                  ].map(rat => {
                    const isChecked = searchParams.get('rating') === rat.value;
                    return (
                      <label key={rat.value} className="flex items-center gap-3 cursor-pointer group text-xs py-1">
                        <input
                          type="radio"
                          name="ratingMobile"
                          checked={isChecked}
                          onChange={() => updateSingleFilter('rating', rat.value)}
                          className="accent-[#D4A04D] w-4 h-4 cursor-pointer"
                        />
                        <span className={`text-[#A7A7A7] group-hover:text-white transition-colors uppercase font-bold text-[10px] tracking-wide ${isChecked ? 'text-white' : ''}`}>
                          {rat.label}
                        </span>
                      </label>
                    );
                  })}
                  {searchParams.get('rating') && (
                    <button
                      onClick={() => updateSingleFilter('rating', '')}
                      className="text-[#D4A04D] text-[10px] font-extrabold uppercase mt-2.5 hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Clear Rating
                    </button>
                  )}
                </div>
              )}

              {activeFilterTab === 'toggles' && (
                <div className="space-y-4 animate-fade-in">
                  <h4 className="text-white text-xs font-extrabold uppercase tracking-wider mb-2">Toggles</h4>
                  
                  {/* Premium Toggle */}
                  <div className="flex items-center justify-between py-1 bg-[#131314] px-3.5 py-2.5 rounded-xl border border-[#2A2A2D]/60">
                    <span className="text-[#A7A7A7] text-[10px] font-extrabold uppercase tracking-wide">Premium Only</span>
                    <button
                      onClick={() => updateSingleFilter('isPremium', searchParams.get('isPremium') !== 'true')}
                      className={`w-9 h-5 rounded-full transition-colors relative border border-[#2A2A2D] cursor-pointer ${searchParams.get('isPremium') === 'true' ? 'bg-[#D4A04D]' : 'bg-[#1C1C1E]'}`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full absolute top-[2px] transition-all ${searchParams.get('isPremium') === 'true' ? 'left-[18px] bg-black' : 'left-[3px] bg-[#A7A7A7]'}`} />
                    </button>
                  </div>

                  </div>
              )}

            </div>
          </div>

          {/* Drawer Footer */}
          <div className="h-16 border-t border-[#2A2A2D] bg-[#131314] px-4 flex items-center gap-3 shrink-0">
            <button
              onClick={clearAll}
              className="flex-1 border border-[#2A2A2D] hover:border-white text-white py-2.5 rounded-xl text-xs font-extrabold uppercase bg-transparent cursor-pointer"
            >
              Clear All
            </button>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="flex-1 bg-[#D4A04D] text-black font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wider hover:opacity-90 cursor-pointer shadow-md"
            >
              Apply
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
