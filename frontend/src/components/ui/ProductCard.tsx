import { Link } from 'react-router-dom';
import StarRating from './StarRating';

interface ProductCardProps {
  product: {
    _id: string;
    sku: string;
    name: string;
    price: { original: number; selling: number };
    rating?: number;
    reviewCount?: number;
    isBestseller?: boolean;
    images?: string[];
    frame?: { type?: string };
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const discount = Math.round(
    ((product.price.original - product.price.selling) / product.price.original) * 100
  );

  return (
    <Link to={`/products/${product._id}`} className="block group">
      <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl overflow-hidden hover:border-[#D4A04D] transition-colors">
        {/* Image */}
        <div className="relative aspect-square bg-[#222] flex items-center justify-center">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-[#444] text-center">
              <div className="text-4xl mb-1">👓</div>
              <div className="text-xs">{product.sku}</div>
            </div>
          )}
          {product.isBestseller && (
            <span className="absolute top-2 left-2 bg-[#D4A04D] text-black text-xs font-bold px-2 py-1 rounded">
              BESTSELLER
            </span>
          )}
          {discount > 0 && (
            <span className="absolute top-2 right-2 bg-[#D4A04D]/20 text-[#D4A04D] text-xs font-bold px-2 py-1 rounded border border-[#D4A04D]/30">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          {product.frame?.type && (
            <div className="text-[#A7A7A7] text-xs mb-1">{product.frame.type}</div>
          )}
          <div className="text-white font-semibold text-sm mb-2 line-clamp-2">{product.name}</div>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-white font-bold">₹{product.price.selling}</span>
            <span className="text-[#A7A7A7] text-sm line-through">₹{product.price.original}</span>
          </div>

          {product.rating !== undefined && (
            <StarRating rating={product.rating} reviewCount={product.reviewCount} />
          )}
        </div>
      </div>
    </Link>
  );
}
