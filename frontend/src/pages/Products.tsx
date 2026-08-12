import { useState, useEffect, useRef } from 'react';
import type React from 'react';
import { useSearchParams, useNavigate, useLoaderData, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ui/ProductCard';
import ProductFilters from '../components/ProductFilters';
import api from '../lib/api';
import { socket } from '../lib/socket';
import SEO from '../components/SEO';

interface Product {
  _id: string;
  sku: string;
  name: string;
  mrp?: number;
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

const SHAPES = ['Aviator', 'Rectangle', 'Round', 'Oval', 'Cat Eye', 'Geometric', 'Clubmaster'];

const mockProducts: Product[] = [
  { _id: '1', sku: 'EG-2041', name: 'Matte Square Frame', price: { original: 999, selling: 1 }, rating: 4.7, reviewCount: 198, isBestseller: true, frame: { type: 'Square' }, images: ['/images/cat_prescription.png'] },
  { _id: '2', sku: 'EG-1067', name: 'Premium Clubmaster Frame', price: { original: 999, selling: 1 }, rating: 4.5, reviewCount: 143, isBestseller: false, frame: { type: 'Clubmaster' }, images: ['/images/cat_prescription.png'] },
  { _id: '3', sku: 'EG-3012', name: 'Classic Aviator', price: { original: 999, selling: 1 }, rating: 4.8, reviewCount: 312, isBestseller: true, frame: { type: 'Aviator' }, images: ['/images/cat_sunglasses.png'] },
  { _id: '4', sku: 'EG-4055', name: 'Round Metal Frame', price: { original: 999, selling: 1 }, rating: 4.3, reviewCount: 87, isBestseller: false, frame: { type: 'Round' }, images: ['/images/cat_prescription.png'] },
  { _id: '5', sku: 'EG-5099', name: 'Wayfarer Bold', price: { original: 999, selling: 1 }, rating: 4.6, reviewCount: 201, isBestseller: true, frame: { type: 'Wayfarer' }, images: ['/images/cat_blue_light.png'] },
  { _id: '6', sku: 'EG-6011', name: 'Cat Eye Chic', price: { original: 999, selling: 1 }, rating: 4.4, reviewCount: 156, isBestseller: false, frame: { type: 'Cat Eye' }, images: ['/images/cat_prescription.png'] },
];

export default function ProductsPage() {
  const { productsData, categoriesData } = useLoaderData() as any;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>(productsData?.products || []);
  const [total, setTotal] = useState(productsData?.total || 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (productsData) {
      setProducts(productsData.products || []);
      setTotal(productsData.total ?? (productsData.products || []).length);
      setLoading(false);
    }
  }, [productsData]);

  // Mobile States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'tile' | 'list' | 'grid'>('tile');
  const [activeFilterTab, setActiveFilterTab] = useState('price');

  const categoriesList = categoriesData || [];
  const selectedCategorySlug = searchParams.get('category');
  const selectedCategory = categoriesList.find((c: any) => c.slug === selectedCategorySlug);
  const subCategories = selectedCategory
    ? (selectedCategory.children || [])
    : categoriesList.flatMap((c: any) => c.children || []);

  // Deepest-selected level's name, for the page title — falls back up a
  // level whenever a deeper param isn't set or doesn't resolve.
  const selectedSubCategorySlug = (searchParams.get('subCategory') || '').split(',')[0].toLowerCase();
  const selectedSubSubCategorySlug = (searchParams.get('subSubCategory') || '').toLowerCase();
  const selectedSubSubSubCategorySlug = (searchParams.get('subSubSubCategory') || '').toLowerCase();
  const selectedSubCategoryObj = selectedCategory?.children?.find((s: any) => (s.slug || '').toLowerCase() === selectedSubCategorySlug);
  const selectedSubSubCategoryObj = selectedSubCategoryObj?.children?.find((ss: any) => (ss.slug || '').toLowerCase() === selectedSubSubCategorySlug);
  const selectedSubSubSubCategoryObj = selectedSubSubCategoryObj?.children?.find((sss: any) => (sss.slug || '').toLowerCase() === selectedSubSubSubCategorySlug);
  const displayTitle = selectedSubSubSubCategoryObj?.name || selectedSubSubCategoryObj?.name || selectedSubCategoryObj?.name || selectedCategory?.name || 'All Products';

  // Mobile app-bar title — set on UserLayout via Outlet context so it shows
  // next to the header's back button instead of duplicating in the body.
  const { setMobileTitle } = useOutletContext<{ setMobileTitle: (title: string) => void }>();
  useEffect(() => {
    setMobileTitle(displayTitle);
    return () => setMobileTitle('');
  }, [displayTitle, setMobileTitle]);

  const handleCategoryChange = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentCategory = params.get('category');
    if (currentCategory === slug) {
      params.delete('category');
    } else {
      params.set('category', slug);
    }
    params.delete('subCategory');
    params.delete('page');
    navigate(`/products?${params.toString()}`);
  };

  // Local price range state for mobile slider
  const maxPriceQuery = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 3000;
  const [mobilePriceVal, setMobilePriceVal] = useState(maxPriceQuery);
  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (Math.abs(currentScrollY - lastScrollY.current) < 10) return;
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobilePriceVal(maxPriceQuery);
  }, [maxPriceQuery]);

  // Sync searchVal with URL search param
  useEffect(() => {
    setSearchVal(searchParams.get('search') || '');
  }, [searchParams]);

  // Debounced search update
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const currentSearch = searchParams.get('search') || '';
      if (searchVal !== currentSearch) {
        updateSingleFilter('search', searchVal);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchVal]);

  const loadProducts = () => {
    const params = searchParams.toString();
    api.get(`/products?${params}`)
      .then(res => {
        setProducts(res.data.products || []);
        setTotal(res.data.total ?? (res.data.products || []).length);
      })
      .catch(() => {
        setProducts(mockProducts);
        setTotal(mockProducts.length);
      });
  };

  // Setup product and inventory socket listeners
  useEffect(() => {
    const handleProductChange = () => {
      loadProducts();
    };

    socket.on('product_changed', handleProductChange);
    socket.on('inventory_changed', handleProductChange);
    socket.on('category_changed', handleProductChange);

    return () => {
      socket.off('product_changed', handleProductChange);
      socket.off('inventory_changed', handleProductChange);
      socket.off('category_changed', handleProductChange);
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

  const filterKeys = ['category', 'subCategory', 'subSubCategory', 'gender', 'shape', 'maxPrice', 'isPremium'];
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
    { id: 'subCategory', label: 'Sub-Category' },
    { id: 'subSubCategory', label: 'Sub-Sub-Category' },
    { id: 'gender', label: 'Gender' },
    { id: 'shape', label: 'Shape & Style' },
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
    <div className="min-h-screen pb-16 md:pb-6 px-4 sm:px-6 lg:px-8 w-full max-w-[1920px] mx-auto">
      <SEO 
        title="Shop Luxury Designer Eyeglasses & Sunglasses"
        description="Explore our curated collection of premium designer frames, eyeglasses, and prescription sunglasses. Find the perfect shape and fit for your face."
        keywords="designer glasses, luxury eyewear, shop eyeglasses, prescription sunglasses, round frames, square frames, wayfarer"
      />
      
      {/* Title & Search Box on Same Line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-2.5">
            {/* Name moves to the mobile app bar (see UserLayout); still shown inline on desktop. */}
            <span className="hidden md:inline">{displayTitle}</span>
            <span className="text-xs md:text-sm font-semibold text-gray-500 font-mono">
              ({total ? `${total} Items` : `${products.length} Items`})
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-72 md:w-80">
          <div className="relative w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              id="search-input"
              type="text"
              placeholder="Search products by name..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-[#131314] text-white placeholder-gray-500 text-xs font-semibold pl-10 pr-10 py-2.5 rounded-xl border border-[#2A2A2D] focus:border-[#D4A04D] focus:outline-none transition-colors duration-200"
            />
            {searchVal && (
              <button
                onClick={() => {
                  setSearchVal('');
                  updateSingleFilter('search', '');
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white bg-transparent border-none cursor-pointer p-1"
                title="Clear Search"
              >
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex md:hidden items-center justify-center bg-[#131314] border border-[#2A2A2D] hover:border-[#D4A04D] text-white w-9 h-9 rounded-xl transition-colors cursor-pointer select-none shrink-0"
            title="Open Filters"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex gap-6 md:gap-8">
        {/* Sidebar Filters - Desktop only */}
        <div className="w-56 flex-shrink-0 hidden md:block">
          <ProductFilters />
        </div>

        {/* Product Grid / Details List */}
        <div className="flex-1">
          {/* Sub-Sub-Category Tabs — only rendered when the current level
              actually has real admin-created children; no generic
              fallback tabs when it doesn't. */}
          {(() => {
            const currentCategorySlug = (searchParams.get('category') || '').toLowerCase();
            const currentSubCat = (searchParams.get('subCategory') || '').toLowerCase();
            const currentSubSubCat = (searchParams.get('subSubCategory') || '').toLowerCase();
            const currentSubSubSubCat = (searchParams.get('subSubSubCategory') || '').toLowerCase();

            if (!currentSubCat) return null;

            const activeCat = categoriesList.find((c: any) => (c.slug || '').toLowerCase() === currentCategorySlug);
            const isContactLensCat = (activeCat?.slug || currentCategorySlug || '').toLowerCase().includes('contact');

            // Once a Sub-Sub-Category is chosen, no further tabs are needed for
            // regular categories — only Contact Lens keeps drilling one level
            // deeper (into power/disposable Sub-Sub-Sub-Categories).
            if (currentSubSubCat && !isContactLensCat) return null;

            const activeSubCatObj = activeCat?.children?.find((s: any) => (s.slug || '').toLowerCase() === currentSubCat);
            const activeSubSubCatObj = activeSubCatObj?.children?.find((ss: any) => (ss.slug || '').toLowerCase() === currentSubSubCat);

            // Contact Lens keeps the original two-step drill: SubCategory tabs
            // into SubSubCategories, then (once one is chosen) one level deeper
            // into SubSubSubCategories.
            //
            // Every other category skips the SubSubCategory (brand) tier entirely:
            // at the SubCategory level the tabs go straight to SubSubSubCategories,
            // merged and deduped by slug across all of the SubCategory's
            // SubSubCategory children (SubSubSubCategory slugs are globally unique,
            // and product filtering matches subSubSubCategory independently, so no
            // SubSubCategory needs to be selected alongside it).
            let tabParam: string;
            let children: any[];
            let activeTabValue: string;

            if (isContactLensCat) {
              tabParam = currentSubSubCat ? 'subSubSubCategory' : 'subSubCategory';
              children = currentSubSubCat ? (activeSubSubCatObj?.children || []) : (activeSubCatObj?.children || []);
              activeTabValue = currentSubSubCat ? currentSubSubSubCat : currentSubSubCat;
            } else {
              tabParam = 'subSubSubCategory';
              const seenSlugs = new Set<string>();
              children = [];
              (activeSubCatObj?.children || []).forEach((brand: any) => {
                (brand.children || []).forEach((tag: any) => {
                  const slug = (tag.slug || '').toLowerCase();
                  if (slug && !seenSlugs.has(slug)) {
                    seenSlugs.add(slug);
                    children.push(tag);
                  }
                });
              });
              activeTabValue = currentSubSubSubCat;
            }

            const goToSubSubSub = (slug: string | null) => {
              const params = new URLSearchParams(searchParams.toString());
              if (slug) {
                params.set(tabParam, slug);
              } else {
                params.delete(tabParam);
              }
              if (tabParam === 'subSubCategory') {
                params.delete('subSubSubCategory');
              }
              params.delete('page');
              navigate(`/products?${params.toString()}`);
            };

            // Only render this tab row when the current level actually has
            // real admin-created children — no generic fallback tabs.
            if (children.length === 0) return null;

            const GridIcon = () => (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            );
            const TagIcon = () => (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.59 13.41L13.41 20.6a2 2 0 01-2.83 0l-7.17-7.18a2 2 0 010-2.83l7.19-7.18a2 2 0 011.41-.59H19a2 2 0 012 2v6.42a2 2 0 01-.41 1.17z" />
                <circle cx="8" cy="8" r="1.5" />
              </svg>
            );

            type Tab = { key: string; label: string; icon: React.ComponentType; isActive: boolean; onClick: () => void };

            const goToAll = () => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete('sort');
              params.delete(tabParam);
              if (tabParam === 'subSubCategory') {
                params.delete('subSubSubCategory');
              }
              params.delete('page');
              navigate(`/products?${params.toString()}`);
            };

            const allTab: Tab = { key: 'all', label: 'All', icon: GridIcon, isActive: !activeTabValue, onClick: goToAll };

            const tabs: Tab[] = [
              allTab,
              ...children.map((c: any) => {
                const slug = (c.slug || '').toLowerCase();
                return {
                  key: slug,
                  label: c.name,
                  icon: TagIcon,
                  isActive: activeTabValue === slug,
                  onClick: () => goToSubSubSub(slug),
                };
              }),
            ];

            return (
              <div className="flex items-center gap-6 overflow-x-auto pb-3 mb-6 scrollbar-none border-b border-[#2A2A2D]">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={tab.onClick}
                    className={`shrink-0 flex items-center gap-2 pb-3 px-1 text-sm font-bold uppercase tracking-wide transition-colors cursor-pointer bg-transparent border-none border-b-[3px] -mb-px ${
                      tab.isActive ? 'text-[#D4A04D] border-[#D4A04D]' : 'text-gray-500 hover:text-white border-transparent'
                    }`}
                  >
                    <tab.icon />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            );
          })()}

          {loading ? (
            <div className="text-center py-24 text-[#A7A7A7]">Loading...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 text-[#A7A7A7]">No products found.</div>
          ) : (
            <div className={
              viewMode === 'list' 
                ? "flex flex-col gap-4" 
                : viewMode === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-3 gap-3"
                  : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
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
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-[#0B0B0C] flex flex-col select-none"
          >
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
                if (tab.id === 'subCategory' && searchParams.has('subCategory')) hasActiveValues = true;
                if (tab.id === 'gender' && searchParams.has('gender')) hasActiveValues = true;
                if (tab.id === 'shape' && searchParams.has('shape')) hasActiveValues = true;
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
                  {categoriesList.map((cat: any) => {
                    const isChecked = searchParams.get('category') === cat.slug;
                    return (
                      <label key={cat._id} className="flex items-center gap-3 cursor-pointer group text-xs py-1">
                        <input
                          type="radio"
                          name="categoryMobile"
                          checked={isChecked}
                          onClick={() => handleCategoryChange(cat.slug)}
                          onChange={() => {}}
                          className="accent-[#D4A04D] w-4 h-4 cursor-pointer"
                        />
                        <span className={`text-[#A7A7A7] group-hover:text-white transition-colors uppercase font-bold text-[10px] tracking-wide ${isChecked ? 'text-[#D4A04D]' : ''}`}>
                          {cat.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {activeFilterTab === 'subCategory' && (
                <div className="space-y-3.5 animate-fade-in">
                  <h4 className="text-white text-xs font-extrabold uppercase tracking-wider mb-2">Sub-Category</h4>
                  {subCategories.map((sub: any) => {
                    const activeSubs = searchParams.get('subCategory')?.split(',') || [];
                    const isChecked = activeSubs.includes(sub.slug);
                    return (
                      <label key={sub._id || sub.slug} className="flex items-center gap-3 cursor-pointer group text-xs py-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFilter('subCategory', sub.slug)}
                          className="accent-[#D4A04D] w-4 h-4 rounded cursor-pointer border-[#2A2A2D] bg-[#0B0B0C]"
                        />
                        <span className={`text-[#A7A7A7] group-hover:text-white transition-colors uppercase font-bold text-[10px] tracking-wide ${isChecked ? 'text-white' : ''}`}>
                          {sub.name}
                        </span>
                      </label>
                    );
                  })}
                  {subCategories.length === 0 && (
                    <p className="text-gray-500 text-xs italic">No subcategories available</p>
                  )}
                </div>
              )}

              {activeFilterTab === 'subSubCategory' && (
                <div className="space-y-3.5 animate-fade-in">
                  <h4 className="text-white text-xs font-extrabold uppercase tracking-wider mb-2">Sub-Sub-Category</h4>
                  {(() => {
                    const selectedSubCategorySlug = searchParams.get('subCategory');
                    const subSubCategories = subCategories.flatMap((sub: any) => {
                      if (selectedSubCategorySlug && sub.slug !== selectedSubCategorySlug) return [];
                      return sub.children || [];
                    });

                    if (subSubCategories.length === 0) {
                      return <p className="text-gray-500 text-xs italic">No sub-sub-categories available for selected category</p>;
                    }

                    return subSubCategories.map((subsub: any) => {
                      const activeSubSubs = searchParams.get('subSubCategory')?.split(',') || [];
                      const isChecked = activeSubSubs.includes(subsub.slug);
                      return (
                        <label key={subsub._id || subsub.id || subsub.slug} className="flex items-center gap-3 cursor-pointer group text-xs py-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleFilter('subSubCategory', subsub.slug)}
                            className="accent-[#D4A04D] w-4 h-4 rounded cursor-pointer border-[#2A2A2D] bg-[#0B0B0C]"
                          />
                          <span className={`text-[#A7A7A7] group-hover:text-white transition-colors uppercase font-bold text-[10px] tracking-wide ${isChecked ? 'text-white' : ''}`}>
                            {subsub.name}
                          </span>
                        </label>
                      );
                    });
                  })()}
                </div>
              )}

              {activeFilterTab === 'gender' && (
                <div className="space-y-3.5 animate-fade-in">
                  <h4 className="text-white text-xs font-extrabold uppercase tracking-wider mb-2">Gender</h4>
                  {[
                    { value: 'men', label: 'Men' },
                    { value: 'women', label: 'Women' },
                    { value: 'kids', label: 'Kids' }
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
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
