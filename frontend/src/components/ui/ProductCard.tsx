import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import StarRating from './StarRating';
import { useAuth } from '../../context/AuthContext';

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
    shape?: string | string[];
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
    category?: string;
    subCategory?: string;
    subSubCategory?: string;
  };
  layout?: 'grid' | 'horizontal';
}

export default function ProductCard({ product, layout = 'grid' }: ProductCardProps) {
  const { wishlist, toggleWishlist } = useAuth();
  const isWishlisted = wishlist.includes(product._id);

  const discount = Math.round(
    ((product.price.original - product.price.selling) / product.price.original) * 100
  );

  const isFrameProduct = !/contact|lens/i.test(
    `${product.category || ''} ${product.subCategory || ''} ${product.subSubCategory || ''}`
  );

  const isRow = layout === 'horizontal';

  return (
    <Link to={`/products/${product._id}`} className="block group h-full">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
        className={`bg-[#131314] border border-[#2A2A2D] rounded-2xl overflow-hidden hover:border-[#D4A04D] hover:shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition-[border-color,box-shadow] duration-300 flex ${isRow ? 'flex-row' : 'flex-col w-full h-full'} shadow-lg`}>
        {/* Image wrapper */}
        <div className={`relative ${isRow ? 'w-[42%] border-r border-[#2A2A2D]/40 shrink-0' : 'aspect-[4/3] w-full border-b border-[#2A2A2D]/40'} bg-[#161618] flex items-center justify-center overflow-hidden`}>
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="text-[#444] text-center py-6">
              <div className="text-4xl mb-1">👓</div>
              <div className="text-[10px] font-mono">{product.sku}</div>
            </div>
          )}
          
          {/* Top-left Rating Badge (Image 15) */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 z-10">
            {product.rating !== undefined ? (
              <span className="bg-black/75 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                <span className="text-[#D4A04D]">★</span> {product.rating}
              </span>
            ) : (
              <span className="bg-black/75 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                <span className="text-[#D4A04D]">★</span> 4.8
              </span>
            )}

            {product.isBestseller && (
              <span className="bg-[#00BBA6] text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                POWERED
              </span>
            )}
          </div>

          {/* Top-right Wishlist Heart Button */}
          <motion.button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product._id);
            }}
            whileTap={{ scale: 0.75 }}
            animate={isWishlisted ? { scale: [1, 1.35, 1] } : { scale: 1 }}
            transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center transition-colors z-10 ${
              isWishlisted ? 'text-red-500' : 'text-gray-300 hover:text-red-400'
            }`}
            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <svg width="14" height="14" fill={isWishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </motion.button>

          {/* Bottom Image Overlay: View Similar & Color Dots (Image 15) */}
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
            <span className="bg-black/80 backdrop-blur-md text-gray-300 text-[9px] font-bold px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              View Similar
            </span>

            {/* Colors dots (dynamic, from product's own colors) */}
            {product.colors && product.colors.length > 0 && (
              <div className="flex items-center gap-1">
                {product.colors.slice(0, 3).map((color, idx) => (
                  <span
                    key={idx}
                    title={color.name}
                    className="w-2.5 h-2.5 rounded-full border border-white/40 shadow-sm"
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
                {product.colors.length > 3 && (
                  <span className="text-[8px] font-bold text-gray-400 bg-black/70 px-1 py-0.2 rounded">
                    +{product.colors.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info Content Section (Image 15) */}
        <div className={`flex-1 flex flex-col ${isRow ? 'p-3.5' : 'p-3.5'}`}>
          <div className="space-y-2">
            {/* Title */}
            <div className="text-white font-extrabold text-xs md:text-sm line-clamp-2 group-hover:text-[#D4A04D] transition-colors">
              {product.name}
            </div>

            {/* Frame Specs Pill */}
            {isFrameProduct && (
              <div className="flex items-center gap-1.5 flex-wrap text-[8px] font-bold">
                <span className="bg-zinc-900 text-gray-400 border border-zinc-800 px-2 py-0.5 rounded uppercase">
                  FRAME WIDTH 139 mm (M)
                </span>
              </div>
            )}
          </div>

          {/* Price section with Free BLU lenses tag — pinned to the bottom
              of the card so it lines up across cards regardless of whether
              the frame-specs pill above it is present. */}
          <div className="flex items-center justify-between gap-2 pt-0.5 mt-auto">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-white font-black text-sm md:text-base">₹{product.price.selling}</span>
                {isFrameProduct && (
                  <span className="text-[#00BBA6] text-[9px] font-bold">with Free BLU lenses</span>
                )}
              </div>
              {product.price.original > product.price.selling && (
                <div className="flex items-center gap-1 text-[9px]">
                  <span className="text-gray-500 line-through">₹{product.price.original}</span>
                  <span className="text-blue-400 font-extrabold">({discount}% OFF)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
