import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';

const GENDERS = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'kids', label: 'Kids' },
];

export default function ProductFilters() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [shapesList, setShapesList] = useState<string[]>(['Aviator', 'Rectangle', 'Round', 'Oval', 'Cat Eye', 'Geometric', 'Clubmaster']);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        setCategoriesList(res.data || []);
      })
      .catch((err) => console.error('Failed to load categories filter list:', err));

    api.get('/shapes')
      .then((res) => {
        const shapes = res.data.map((s: any) => s.name);
        if (shapes.length > 0) {
          setShapesList(shapes);
        }
      })
      .catch((err) => console.error('Failed to load active shapes filter list:', err));
  }, []);

  // Accordion open/close state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true,
    subCategory: true,
    gender: true,
    shape: true,
    price: true,
  });

  // Local price range state (to prevent spamming APIs while dragging)
  const maxPriceQuery = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 3000;
  const [priceVal, setPriceVal] = useState(maxPriceQuery);

  useEffect(() => {
    setPriceVal(maxPriceQuery);
  }, [maxPriceQuery]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Check if any filter is active
  let hasActiveFilters = false;
  searchParams.forEach((_, key) => {
    if (key !== 'sort' && key !== 'page' && key !== 'search') {
      hasActiveFilters = true;
    }
  });

  const clearAll = () => {
    const params = new URLSearchParams();
    const search = searchParams.get('search');
    const sort = searchParams.get('sort');
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);
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

  const handleCategoryChange = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentCategory = params.get('category');
    
    if (currentCategory === slug) {
      params.delete('category');
    } else {
      params.set('category', slug);
    }
    
    // Clear subcategory when main category changes
    params.delete('subCategory');
    params.delete('page');
    navigate(`/products?${params.toString()}`);
  };

  const renderSectionHeader = (title: string, sectionKey: string) => {
    const isOpen = openSections[sectionKey];
    return (
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between text-[#F2F2F2] font-extrabold text-[11px] uppercase tracking-wider py-2 cursor-pointer focus:outline-none hover:text-[#D4A04D] transition-colors"
      >
        <span>{title}</span>
        <svg
          className={`w-3 h-3 text-[#A7A7A7] transition-transform duration-200 ${isOpen ? 'transform rotate-180 text-[#D4A04D]' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  };

  const selectedCategorySlug = searchParams.get('category');
  const selectedCategory = categoriesList.find(c => c.slug === selectedCategorySlug);
  const subCategories = selectedCategory 
    ? (selectedCategory.children || []) 
    : categoriesList.flatMap(c => c.children || []);

  return (
    <div className="space-y-4 select-none pr-2">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2D]">
        <h3 className="text-white text-sm font-extrabold uppercase tracking-wide flex items-center gap-1.5">
          <span>⚙️</span> Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-[10px] text-[#D4A04D] hover:underline font-extrabold uppercase tracking-wider bg-transparent border-none cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Toggles (Premium) */}
      <div className="py-2 border-b border-[#2A2A2D]/40 space-y-3">
        <div className="flex items-center justify-between py-0.5">
          <span className="text-[#A7A7A7] text-[11px] font-bold uppercase tracking-wider">Premium Only</span>
          <button
            onClick={() => updateSingleFilter('isPremium', searchParams.get('isPremium') !== 'true')}
            className={`w-9 h-5 rounded-full transition-colors relative border border-[#2A2A2D] cursor-pointer ${searchParams.get('isPremium') === 'true' ? 'bg-[#D4A04D]' : 'bg-[#1C1C1E]'}`}
          >
            <div className={`w-3.5 h-3.5 rounded-full absolute top-[2px] transition-all ${searchParams.get('isPremium') === 'true' ? 'left-[18px] bg-black' : 'left-[3px] bg-[#A7A7A7]'}`} />
          </button>
        </div>
      </div>

      {/* Categories Section */}
      <div className="border-b border-[#2A2A2D]/40 pb-2">
        {renderSectionHeader('Category', 'category')}
        {openSections.category && (
          <div className="mt-2.5 space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-none animate-fade-in">
            {categoriesList.map(cat => {
              const isChecked = searchParams.get('category') === cat.slug;
              return (
                <label key={cat._id} className="flex items-center gap-2.5 cursor-pointer group text-xs">
                  <input
                    type="radio"
                    name="category"
                    checked={isChecked}
                    onClick={() => handleCategoryChange(cat.slug)}
                    onChange={() => {}}
                    className="accent-[#D4A04D] w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className={`text-[#A7A7A7] group-hover:text-white transition-colors ${isChecked ? 'text-[#D4A04D] font-bold' : ''}`}>
                    {cat.name}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Sub-Category Section */}
      {subCategories.length > 0 && (
        <div className="border-b border-[#2A2A2D]/40 pb-2">
          {renderSectionHeader('Sub-Category', 'subCategory')}
          {openSections.subCategory && (
            <div className="mt-2.5 space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-none animate-fade-in">
              {subCategories.map((sub: any) => {
                const activeSubs = searchParams.get('subCategory')?.split(',') || [];
                const isChecked = activeSubs.includes(sub.slug);
                return (
                  <label key={sub._id || sub.slug} className="flex items-center gap-2.5 cursor-pointer group text-xs">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleFilter('subCategory', sub.slug)}
                      className="accent-[#D4A04D] w-3.5 h-3.5 rounded cursor-pointer border-[#2A2A2D] bg-[#0B0B0C]"
                    />
                    <span className={`text-[#A7A7A7] group-hover:text-white transition-colors ${isChecked ? 'text-white font-bold' : ''}`}>
                      {sub.name}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Gender Section */}
      <div className="border-b border-[#2A2A2D]/40 pb-2">
        {renderSectionHeader('Gender', 'gender')}
        {openSections.gender && (
          <div className="mt-2.5 space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-none animate-fade-in">
            {GENDERS.map(g => {
              const activeGenders = searchParams.get('gender')?.split(',') || [];
              const isChecked = activeGenders.includes(g.value);
              return (
                <label key={g.value} className="flex items-center gap-2.5 cursor-pointer group text-xs">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleFilter('gender', g.value)}
                    className="accent-[#D4A04D] w-3.5 h-3.5 rounded cursor-pointer border-[#2A2A2D] bg-[#0B0B0C]"
                  />
                  <span className={`text-[#A7A7A7] group-hover:text-white transition-colors ${isChecked ? 'text-white font-bold' : ''}`}>
                    {g.label}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Shape Section */}
      <div className="border-b border-[#2A2A2D]/40 pb-2">
        {renderSectionHeader('Shape & Style', 'shape')}
        {openSections.shape && (
          <div className="mt-2.5 space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-none animate-fade-in">
            {shapesList.map(shape => {
              const activeShapes = searchParams.get('shape')?.split(',') || [];
              const isChecked = activeShapes.includes(shape);
              return (
                <label key={shape} className="flex items-center gap-2.5 cursor-pointer group text-xs">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleFilter('shape', shape)}
                    className="accent-[#D4A04D] w-3.5 h-3.5 rounded cursor-pointer border-[#2A2A2D] bg-[#0B0B0C]"
                  />
                  <span className={`text-[#A7A7A7] group-hover:text-white transition-colors ${isChecked ? 'text-white font-bold' : ''}`}>
                    {shape}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Price Section */}
      <div className="border-b border-[#2A2A2D]/40 pb-3">
        {renderSectionHeader('Price Range', 'price')}
        {openSections.price && (
          <div className="mt-3.5 space-y-3 animate-fade-in">
            <div className="flex justify-between items-center text-[11px] text-[#A7A7A7] font-bold">
              <span>₹0</span>
              <span className="text-[#D4A04D] bg-[#D4A04D]/10 border border-[#D4A04D]/25 px-2 py-0.5 rounded font-extrabold">
                Max: ₹{priceVal}
              </span>
              <span>₹3,000</span>
            </div>
            <input
              type="range"
              min="0"
              max="3000"
              step="50"
              value={priceVal}
              onChange={e => setPriceVal(Number(e.target.value))}
              onMouseUp={() => updateSingleFilter('maxPrice', String(priceVal))}
              onTouchEnd={() => updateSingleFilter('maxPrice', String(priceVal))}
              className="w-full h-1 bg-[#1C1C1E] rounded-lg appearance-none cursor-pointer accent-[#D4A04D]"
            />
          </div>
        )}
      </div>

    </div>
  );
}
