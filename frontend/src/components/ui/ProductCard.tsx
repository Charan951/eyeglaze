import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import AddToCartButton from '../AddToCartButton';

interface ProductCardProps {
  product: {
    _id: string;
    sku: string;
    name: string;
    price: { original: number; selling: number };
    memberPrice?: number;
    nonMemberPrice?: number;
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
    productVideo?: string;
    image360?: string;
    frame?: { type?: string };
    colors?: Array<{
      name: string;
      hex: string;
    }>;
    availableSizes?: Array<string>;
    offerBadges?: Array<string>;
  };
  layout?: 'grid' | 'horizontal';
}

export default function ProductCard({ product, layout = 'grid' }: ProductCardProps) {
  const discount = Math.round(
    ((product.price.original - product.price.selling) / product.price.original) * 100
  );

  const isRow = layout === 'horizontal';

  return (
    <div className="block group">
      <div className={`bg-[#131314] border border-[#2A2A2D] rounded-xl overflow-hidden hover:border-[#D4A04D] transition-colors flex ${isRow ? 'flex-row' : 'flex-col h-full'}`}>
        {/* Image wrapper */}
        <Link to={`/products/${product._id}`} className={`relative ${isRow ? 'w-[40%] border-r border-[#2A2A2D]/40 shrink-0' : 'aspect-[4/3] border-b border-[#2A2A2D]/40'} bg-[#1A1A1C] flex items-center justify-center`}>
          {product.images?.[0] ? (
            <img 
              src={product.images[0]} 
              alt={product.name} 
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" 
            />
          ) : (
            <div className="text-[#444] text-center py-6">
              <div className="text-4xl mb-1">👓</div>
              <div className="text-[10px] font-mono">{product.sku}</div>
            </div>
          )}
          
          {/* Badge Overlay */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
            {product.isBestseller && (
              <span className="bg-[#D4A04D] text-black text-[9px] font-extrabold px-2 py-0.5 rounded shadow-md tracking-wider uppercase">
                ★ Bestseller
              </span>
            )}
            {product.isPremium && (
              <span className="bg-black/90 border border-[#D4A04D]/60 text-[#D4A04D] text-[9px] font-extrabold px-2 py-0.5 rounded shadow-md tracking-widest uppercase">
                ✦ Premium
              </span>
            )}
            {product.offerBadges?.map((badge, idx) => (
              <span key={idx} className="bg-purple-600/20 border border-purple-500/30 text-purple-300 text-[9px] font-extrabold px-2 py-0.5 rounded shadow-md uppercase">
                {badge}
              </span>
            ))}
          </div>

          {/* Discount Overlay */}
          {discount > 0 && (
            <span className="absolute top-2 right-2 bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-extrabold px-2 py-0.5 rounded shadow-md">
              {discount}% OFF
            </span>
          )}

        </Link>

        {/* Info */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Brand Header */}
            <div className="text-[#D4A04D] text-[10px] font-extrabold uppercase tracking-widest mb-1.5">
              {product.brand || 'EyeGlaze'}
            </div>

            {/* Product Title */}
            <Link to={`/products/${product._id}`} className="block">
              <div className="text-[#F2F2F2] font-extrabold text-sm mb-2.5 line-clamp-1 group-hover:text-[#D4A04D] transition-colors">
                {product.name}
              </div>
            </Link>

            {/* Meta Tags (Shape/Type/Size) */}
            <div className="flex gap-1.5 flex-wrap mb-3.5 text-[9px] font-semibold text-[#A7A7A7]">
              {product.shape && (
                <span className="bg-[#1C1C1E] border border-[#2A2A2D]/60 px-2 py-0.5 rounded-full uppercase">
                  {product.shape}
                </span>
              )}
              {product.frameType && (
                <span className="bg-[#1C1C1E] border border-[#2A2A2D]/60 px-2 py-0.5 rounded-full uppercase">
                  {product.frameType}
                </span>
              )}
              {product.frameSize && (
                <span className="bg-[#1C1C1E] border border-[#2A2A2D]/60 px-2 py-0.5 rounded-full uppercase">
                  {product.frameSize}
                </span>
              )}
            </div>

            {/* Colors Swatches */}
            {product.colors && product.colors.length > 0 && (
              <div className="flex gap-1.5 mb-3.5 items-center">
                {product.colors.slice(0, 5).map((col, idx) => (
                  <div 
                    key={idx} 
                    title={col.name}
                    className="w-3 h-3 rounded-full border border-white/20 transition-transform duration-200 hover:scale-125 cursor-pointer shadow-sm shrink-0"
                    style={{ backgroundColor: col.hex }}
                  />
                ))}
                {product.colors.length > 5 && (
                  <span className="text-[#A7A7A7] text-[9px] font-bold">+{product.colors.length - 5}</span>
                )}
              </div>
            )}
          </div>

          <div>
            {/* Pricing Section */}
            <div className="flex items-baseline gap-2 mb-2 border-t border-[#2A2A2D]/30 pt-3">
              {product.memberPrice && (
                <span className="text-[#D4A04D] font-black text-sm">₹{product.memberPrice} <span className="text-[#A7A7A7] text-[8px]">(Member)</span></span>
              )}
              {product.nonMemberPrice && (
                <span className="text-white font-black text-sm">₹{product.nonMemberPrice} <span className="text-[#A7A7A7] text-[8px]">(Non-Member)</span></span>
              )}
              {!product.memberPrice && !product.nonMemberPrice && (
                <>
                  <span className="text-white font-black text-base">₹{product.price.selling}</span>
                  <span className="text-[#A7A7A7] text-xs line-through font-medium">₹{product.price.original}</span>
                </>
              )}
            </div>

            {/* Star Rating */}
            {product.rating !== undefined && (
              <div className="mb-3">
                <StarRating rating={product.rating} reviewCount={product.reviewCount} />
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-2">
              <Link to={`/products/${product._id}`} className="w-full bg-[#1C1C1E] border border-[#2A2A2D] text-white text-[9px] font-extrabold uppercase py-2 rounded-lg text-center transition-colors hover:border-[#D4A04D]">
                View Details
              </Link>
              <AddToCartButton productId={product._id} color={product.colors?.[0]?.name} product={product} />
              <Link to={`/products/${product._id}?buy=frame`} className="w-full bg-[#1C1C1E] border border-[#2A2A2D] text-white text-[9px] font-extrabold uppercase py-2 rounded-lg text-center transition-colors hover:border-[#D4A04D]">
                Buy Frame Only
              </Link>
              <Link to={`/lens?product=${product._id}&color=${product.colors?.[0]?.name || ''}`} className="w-full bg-[#D4A04D] text-black text-[9px] font-extrabold uppercase py-2 rounded-lg text-center transition-colors hover:bg-[#C8923E]">
                Buy With Lens
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
