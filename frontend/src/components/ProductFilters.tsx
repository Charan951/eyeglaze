import { useNavigate, useSearchParams } from 'react-router-dom';

const categories = [
  { value: 'prescription', label: 'Prescription Glasses' },
  { value: 'sunglasses', label: 'Sunglasses' },
  { value: 'blue_light', label: 'Blue Light Glasses' },
  { value: 'contact', label: 'Contact Lenses' },
  { value: 'kids', label: 'Kids Eyewear' },
];
const frameTypes = ['Square', 'Round', 'Clubmaster', 'Aviator', 'Wayfarer', 'Cat Eye'];
const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Best Rated' },
  { value: 'bestseller', label: 'Bestsellers' },
];

export default function ProductFilters() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    navigate(`/products?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-3">Sort By</h3>
        <select
          className="w-full bg-[#131314] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
          value={searchParams.get('sort') || ''}
          onChange={e => update('sort', e.target.value)}
        >
          <option value="">Default</option>
          {sortOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-3">Category</h3>
        <div className="space-y-2">
          {categories.map(cat => (
            <label key={cat.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="category"
                value={cat.value}
                checked={searchParams.get('category') === cat.value}
                onChange={() => update('category', cat.value)}
                className="accent-[#D4A04D]"
              />
              <span className="text-[#A7A7A7] text-sm group-hover:text-white transition-colors">{cat.label}</span>
            </label>
          ))}
        </div>
        {searchParams.get('category') && (
          <button onClick={() => update('category', '')} className="text-[#D4A04D] text-xs mt-2 hover:underline">
            Clear
          </button>
        )}
      </div>

      {/* Frame Type */}
      <div>
        <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-3">Frame Type</h3>
        <div className="space-y-2">
          {frameTypes.map(ft => (
            <label key={ft} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="frameType"
                value={ft}
                checked={searchParams.get('frameType') === ft}
                onChange={() => update('frameType', ft)}
                className="accent-[#D4A04D]"
              />
              <span className="text-[#A7A7A7] text-sm group-hover:text-white transition-colors">{ft}</span>
            </label>
          ))}
        </div>
        {searchParams.get('frameType') && (
          <button onClick={() => update('frameType', '')} className="text-[#D4A04D] text-xs mt-2 hover:underline">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
