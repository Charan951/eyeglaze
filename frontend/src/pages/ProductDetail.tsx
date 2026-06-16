import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import StarRating from '../components/ui/StarRating';
import AddToCartButton from '../components/AddToCartButton';
import api from '../lib/api';

interface ColorOption {
  name: string;
  hex: string;
  stock: number;
}

interface Product {
  _id: string;
  sku: string;
  name: string;
  price: { original: number; selling: number };
  rating: number;
  reviewCount: number;
  isBestseller: boolean;
  images: string[];
  colors: ColorOption[];
  frame: {
    type: string;
    material: string;
    width: number;
    lensWidth: number;
    bridgeWidth: number;
    templeLength: number;
    featureTags: string[];
  };
  compatible: { prescription?: boolean; bluecut?: boolean; zeropower?: boolean; progressive?: boolean };
  categories: string[];
}

function mockProduct(id: string): Product {
  return {
    _id: id,
    sku: 'EG-2041',
    name: 'Matte Square Frame',
    price: { original: 999, selling: 1 },
    rating: 4.7,
    reviewCount: 198,
    isBestseller: true,
    images: [],
    colors: [
      { name: 'Matte Black', hex: '#1A1A1A', stock: 50 },
      { name: 'Black Gold', hex: '#C9A84C', stock: 30 },
      { name: 'Dark Brown', hex: '#5C3D2E', stock: 20 },
    ],
    frame: {
      type: 'Square',
      material: 'TR90 Premium',
      width: 140,
      lensWidth: 54,
      bridgeWidth: 18,
      templeLength: 145,
      featureTags: ['Lightweight', 'Flexible', 'Skin Friendly', 'Durable'],
    },
    compatible: { prescription: true, bluecut: true, zeropower: true, progressive: true },
    categories: ['Prescription Glasses'],
  };
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    api.get(`/products/${id}`)
      .then(res => {
        if (active) setProduct(res.data);
      })
      .catch(() => {
        if (active) setProduct(mockProduct(id));
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  if (loading || !product) {
    return <div className="text-center py-24 text-[#888]">Loading...</div>;
  }

  const discount = Math.round(((product.price.original - product.price.selling) / product.price.original) * 100);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid md:grid-cols-2 gap-10">
        {/* Image Gallery */}
        <div>
          {/* Main Image */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl aspect-square flex items-center justify-center mb-3 relative">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="text-center">
                <div className="text-8xl">👓</div>
                <div className="text-[#888] text-sm mt-2">{product.sku}</div>
              </div>
            )}
            {product.isBestseller && (
              <span className="absolute top-3 left-3 bg-[#C9A84C] text-black text-xs font-bold px-2 py-1 rounded">
                BESTSELLER
              </span>
            )}
          </div>
          {/* Thumbnails */}
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg w-14 h-14 flex items-center justify-center cursor-pointer hover:border-[#C9A84C] transition-colors">
                {product.images?.[i] ? (
                  <img src={product.images[i]} alt="" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <span className="text-xl">👓</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-5">
          {/* Name & Rating */}
          <div>
            <div className="text-[#888] text-sm mb-1">{product.sku}</div>
            <h1 className="text-2xl font-bold text-white mb-2">{product.name}</h1>
            <div className="flex items-center gap-3">
              <StarRating rating={product.rating} reviewCount={product.reviewCount} size="md" />
              <span className="text-[#C9A84C] text-sm font-semibold">{product.rating} / 5</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
            <div className="text-[#888] text-xs mb-1">Frame Starting at</div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-white">₹{product.price.selling}</span>
              <span className="text-[#888] text-lg line-through">₹{product.price.original}</span>
              <span className="bg-[#C9A84C]/20 text-[#C9A84C] text-sm font-bold px-2 py-1 rounded border border-[#C9A84C]/30">
                {discount}% OFF
              </span>
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm text-[#888]">
              <span>Fast Delivery 2-4 Days</span>
              <span>|</span>
              <span>Just ₹99 Delivery Charge</span>
            </div>
          </div>

          {/* Color Selector */}
          {product.colors?.length > 0 && (
            <div>
              <div className="text-white text-sm font-semibold mb-2">
                Select Color: <span className="text-[#C9A84C]">{product.colors[0].name}</span>
              </div>
              <div className="flex gap-2">
                {product.colors.map((c, i) => (
                  <button
                    key={c.name}
                    title={c.name}
                    className={`w-9 h-9 rounded-full border-2 transition-all ${i === 0 ? 'border-[#C9A84C] scale-110' : 'border-[#2A2A2A] hover:border-[#C9A84C]'}`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Frame Specs */}
          {product.frame && (
            <div>
              <div className="text-white text-sm font-semibold mb-3 uppercase tracking-wide">Frame Specifications</div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Frame Width', value: `${product.frame.width}mm` },
                  { label: 'Lens Width', value: `${product.frame.lensWidth}mm` },
                  { label: 'Bridge', value: `${product.frame.bridgeWidth}mm` },
                  { label: 'Temple', value: `${product.frame.templeLength}mm` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3 text-center">
                    <div className="text-white font-bold text-sm">{value}</div>
                    <div className="text-[#888] text-xs mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Frame Details */}
          {product.frame && (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
              <div className="text-white font-semibold mb-3">Frame Details</div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div><span className="text-[#888]">Type: </span><span className="text-white">{product.frame.type}</span></div>
                <div><span className="text-[#888]">Material: </span><span className="text-white">{product.frame.material}</span></div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {product.frame.featureTags?.map(tag => (
                  <span key={tag} className="bg-[#2A2A2A] text-[#888] text-xs px-2 py-1 rounded">{tag}</span>
                ))}
              </div>
              <div className="text-[#888] text-xs">
                Compatible with:{' '}
                <span className="text-[#C9A84C]">
                  {[
                    product.compatible?.prescription && 'Prescription Lenses',
                    product.compatible?.bluecut && 'Blue Cut',
                    product.compatible?.zeropower && 'Zero Power',
                    product.compatible?.progressive && 'Progressive',
                  ].filter(Boolean).join(' • ')}
                </span>
              </div>
            </div>
          )}

          {/* Compatibility Tags */}
          <div className="flex flex-wrap gap-2">
            {product.compatible?.prescription && <span className="bg-[#1A1A1A] border border-[#2A2A2A] text-[#888] text-xs px-3 py-1 rounded-full">Prescription Lenses</span>}
            {product.compatible?.bluecut && <span className="bg-[#1A1A1A] border border-[#2A2A2A] text-[#888] text-xs px-3 py-1 rounded-full">Blue Cut</span>}
            {product.compatible?.zeropower && <span className="bg-[#1A1A1A] border border-[#2A2A2A] text-[#888] text-xs px-3 py-1 rounded-full">Zero Power</span>}
            {product.compatible?.progressive && <span className="bg-[#1A1A1A] border border-[#2A2A2A] text-[#888] text-xs px-3 py-1 rounded-full">Progressive</span>}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0D0D0D] border-t border-[#2A2A2A] z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-[#888] text-xs">Frame Price</div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">₹{product.price.selling}</span>
              <span className="text-[#888] text-sm line-through">₹{product.price.original}</span>
              <span className="text-[#C9A84C] text-xs font-bold">{discount}% OFF</span>
            </div>
          </div>
          <AddToCartButton productId={product._id} />
          <a
            href={`/lens?product=${product._id}`}
            className="bg-[#C9A84C] text-black font-bold uppercase py-3 px-6 rounded-xl text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            BUY WITH LENS
          </a>
        </div>

        {/* Trust Strip */}
        <div className="bg-[#1A1A1A] border-t border-[#2A2A2A]">
          <div className="max-w-6xl mx-auto px-4 py-2 flex justify-center gap-6 text-[#888] text-xs">
            <span>100% Authentic</span>
            <span>·</span>
            <span>₹99 Delivery</span>
            <span>·</span>
            <span>Fast Delivery 2-4 Days</span>
            <span>·</span>
            <span>24/7 Support</span>
          </div>
        </div>
      </div>

      {/* Padding for sticky bar */}
      <div className="h-28" />
    </div>
  );
}
