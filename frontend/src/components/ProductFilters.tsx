import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const CATEGORIES = [
  { value: 'prescription', label: 'Prescription Glasses' },
  { value: 'sunglasses', label: 'Sunglasses' },
  { value: 'blue_light', label: 'Blue Light Glasses' },
  { value: 'contact_lenses', label: 'Contact Lenses' },
  { value: 'kids', label: 'Kids Eyewear' },
  { value: 'power-sunglasses', label: 'Special Power' },
  { value: 'reading-glasses', label: 'Reading Glasses' },
];

const GENDERS = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'kids', label: 'Kids' },
];

const SHAPES = ['Aviator', 'Rectangle', 'Round', 'Oval', 'Cat Eye', 'Geometric', 'Clubmaster'];
const SIZES = ['Small', 'Medium', 'Large'];
const COLORS = ['Black', 'Brown', 'Gold', 'Silver', 'Transparent', 'Pink'];
const TYPES = ['Full Rim', 'Half Rim', 'Rimless'];
const MATERIALS = ['Metal', 'Acetate', 'TR90', 'Titanium'];
const FACESHAPES = ['Round', 'Oval', 'Square', 'Diamond'];

export default function ProductFilters() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Accordion open/close state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true,
    gender: true,
    shape: true,
    size: true,
    brand: true,
    color: true,
    type: true,
    material: false,
    weight: false,
    faceShape: false,
    price: true,
    rating: true,
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
    // Keep search and sort query parameters if present
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

  return (
    <div className="space-y-4 bg-[#131314] border border-[#2A2A2D] rounded-2xl p-4 select-none">
      
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

      {/* Toggles (Premium & Try in 3D) */}
      <div className="py-2 border-b border-[#2A2A2D]/40 space-y-3">
        {/* Premium Toggle */}
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
            {CATEGORIES.map(cat => {
              const isChecked = searchParams.get('category') === cat.value;
              return (
                <label key={cat.value} className="flex items-center gap-2.5 cursor-pointer group text-xs">
                  <input
                    type="radio"
                    name="category"
                    checked={isChecked}
                    onChange={() => updateSingleFilter('category', cat.value)}
                    className="accent-[#D4A04D] w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className={`text-[#A7A7A7] group-hover:text-white transition-colors ${isChecked ? 'text-[#D4A04D] font-bold' : ''}`}>
                    {cat.label}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

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
            {SHAPES.map(shape => {
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

      {/* Size Section */}
      <div className="border-b border-[#2A2A2D]/40 pb-2">
        {renderSectionHeader('Frame Size', 'size')}
        {openSections.size && (
          <div className="mt-2.5 space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-none animate-fade-in">
            {SIZES.map(size => {
              const activeSizes = searchParams.get('frameSize')?.split(',') || [];
              const isChecked = activeSizes.includes(size);
              return (
                <label key={size} className="flex items-center gap-2.5 cursor-pointer group text-xs">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleFilter('frameSize', size)}
                    className="accent-[#D4A04D] w-3.5 h-3.5 rounded cursor-pointer border-[#2A2A2D] bg-[#0B0B0C]"
                  />
                  <span className={`text-[#A7A7A7] group-hover:text-white transition-colors ${isChecked ? 'text-white font-bold' : ''}`}>
                    {size}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>


      {/* Color Section */}
      <div className="border-b border-[#2A2A2D]/40 pb-2">
        {renderSectionHeader('Frame Color', 'color')}
        {openSections.color && (
          <div className="mt-2.5 space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-none animate-fade-in">
            {COLORS.map(color => {
              const activeColors = searchParams.get('frameColor')?.split(',') || [];
              const isChecked = activeColors.includes(color);
              
              // Custom color dot indicator
              const colorSwatches: Record<string, string> = {
                Black: 'bg-black border border-[#2A2A2D]',
                Brown: 'bg-[#5C3D2E]',
                Gold: 'bg-[#D4A04D]',
                Silver: 'bg-[#C0C0C0]',
                Transparent: 'bg-white/20 border border-dashed border-[#A7A7A7]',
                Pink: 'bg-[#FF69B4]',
              };

              return (
                <label key={color} className="flex items-center gap-2.5 cursor-pointer group text-xs">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleFilter('frameColor', color)}
                    className="accent-[#D4A04D] w-3.5 h-3.5 rounded cursor-pointer border-[#2A2A2D] bg-[#0B0B0C]"
                  />
                  <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${colorSwatches[color] || 'bg-gray-400'}`} />
                  <span className={`text-[#A7A7A7] group-hover:text-white transition-colors ${isChecked ? 'text-white font-bold' : ''}`}>
                    {color}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Frame Type Section */}
      <div className="border-b border-[#2A2A2D]/40 pb-2">
        {renderSectionHeader('Frame Type', 'type')}
        {openSections.type && (
          <div className="mt-2.5 space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-none animate-fade-in">
            {TYPES.map(type => {
              const activeTypes = searchParams.get('frameType')?.split(',') || [];
              const isChecked = activeTypes.includes(type);
              return (
                <label key={type} className="flex items-center gap-2.5 cursor-pointer group text-xs">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleFilter('frameType', type)}
                    className="accent-[#D4A04D] w-3.5 h-3.5 rounded cursor-pointer border-[#2A2A2D] bg-[#0B0B0C]"
                  />
                  <span className={`text-[#A7A7A7] group-hover:text-white transition-colors ${isChecked ? 'text-white font-bold' : ''}`}>
                    {type}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Material Section */}
      <div className="border-b border-[#2A2A2D]/40 pb-2">
        {renderSectionHeader('Material', 'material')}
        {openSections.material && (
          <div className="mt-2.5 space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-none animate-fade-in">
            {MATERIALS.map(mat => {
              const activeMaterials = searchParams.get('material')?.split(',') || [];
              const isChecked = activeMaterials.includes(mat);
              return (
                <label key={mat} className="flex items-center gap-2.5 cursor-pointer group text-xs">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleFilter('material', mat)}
                    className="accent-[#D4A04D] w-3.5 h-3.5 rounded cursor-pointer border-[#2A2A2D] bg-[#0B0B0C]"
                  />
                  <span className={`text-[#A7A7A7] group-hover:text-white transition-colors ${isChecked ? 'text-white font-bold' : ''}`}>
                    {mat}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>


      {/* Face Shape Section */}
      <div className="border-b border-[#2A2A2D]/40 pb-2">
        {renderSectionHeader('Face Shape', 'faceShape')}
        {openSections.faceShape && (
          <div className="mt-2.5 space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-none animate-fade-in">
            {FACESHAPES.map(face => {
              const activeFaces = searchParams.get('faceShape')?.split(',') || [];
              const isChecked = activeFaces.includes(face);
              return (
                <label key={face} className="flex items-center gap-2.5 cursor-pointer group text-xs">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleFilter('faceShape', face)}
                    className="accent-[#D4A04D] w-3.5 h-3.5 rounded cursor-pointer border-[#2A2A2D] bg-[#0B0B0C]"
                  />
                  <span className={`text-[#A7A7A7] group-hover:text-white transition-colors ${isChecked ? 'text-white font-bold' : ''}`}>
                    {face}
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
