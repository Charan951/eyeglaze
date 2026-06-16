import { useNavigate, useSearchParams } from 'react-router-dom';

const categories = ['Prescription Glasses', 'Sunglasses', 'Blue Light Glasses', 'Contact Lenses', 'Kids Eyewear'];
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
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#C9A84C] focus:outline-none"
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
            <label key={cat} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="category"
                value={cat}
                checked={searchParams.get('category') === cat}
                onChange={() => update('category', cat)}
                className="accent-[#C9A84C]"
              />
              <span className="text-[#888] text-sm group-hover:text-white transition-colors">{cat}</span>
            </label>
          ))}
        </div>
        {searchParams.get('category') && (
          <button onClick={() => update('category', '')} className="text-[#C9A84C] text-xs mt-2 hover:underline">
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
                className="accent-[#C9A84C]"
              />
              <span className="text-[#888] text-sm group-hover:text-white transition-colors">{ft}</span>
            </label>
          ))}
        </div>
        {searchParams.get('frameType') && (
          <button onClick={() => update('frameType', '')} className="text-[#C9A84C] text-xs mt-2 hover:underline">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
