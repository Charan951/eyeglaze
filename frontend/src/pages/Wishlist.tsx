import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import AddToCartButton from '../components/AddToCartButton';
import { useAuth } from '../context/AuthContext';

interface WishlistItem {
  _id: string;
  sku: string;
  name: string;
  price: { original: number; selling: number };
  rating?: number;
  reviewCount?: number;
  isBestseller?: boolean;
  images?: string[];
}

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toggleWishlist } = useAuth();

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/wishlist');
      setWishlistItems(res.data?.wishlist || []);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId: string) => {
    // Optimistically update local list
    setWishlistItems(prev => prev.filter(item => item._id !== productId));
    await toggleWishlist(productId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-[#A7A7A7] animate-pulse">Loading your wishlist...</div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4 text-[#D4A04D] animate-bounce">❤️</div>
        <h2 className="text-xl font-bold text-white mb-2">Your wishlist is empty</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-xs">Save frames you love here to easily find them later and add them to your collection.</p>
        <Link to="/products" className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold uppercase py-3.5 px-8 rounded-xl text-xs tracking-wider transition-colors shadow-md select-none">
          EXPLORE CATALOG
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">My Wishlist</h1>
        <p className="text-gray-500 text-sm">You have saved {wishlistItems.length} frame{wishlistItems.length !== 1 ? 's' : ''}.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlistItems.map((item) => {
          const discount = Math.round(((item.price.original - item.price.selling) / item.price.original) * 100);
          return (
            <div key={item._id} className="bg-[#131314] border border-[#2A2A2D] rounded-2xl overflow-hidden hover:border-[#D4A04D]/50 transition-all duration-300 flex flex-col group relative">
              
              {/* Image Container */}
              <div className="relative aspect-[4/3] bg-[#222] flex items-center justify-center p-6 border-b border-[#2A2A2D]/40">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-lg" />
                ) : (
                  <div className="text-gray-500 text-center">
                    <div className="text-5xl mb-2">👓</div>
                    <div className="text-xs uppercase tracking-widest">{item.sku}</div>
                  </div>
                )}
                
                {item.isBestseller && (
                  <span className="absolute top-3 left-3 bg-[#D4A04D] text-black text-[9px] font-extrabold px-2.5 py-1 rounded-md tracking-wider uppercase z-20 shadow-md">
                    BESTSELLER
                  </span>
                )}
                
                {discount > 0 && (
                  <span className="absolute top-3 right-3 bg-[#D4A04D]/25 border border-[#D4A04D]/40 text-[#D4A04D] text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider z-20 shadow-md">
                    {discount}% OFF
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div className="p-5 flex flex-col gap-4 flex-1 justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[#D4A04D] text-[9px] font-bold uppercase tracking-wider">{item.sku}</span>
                      <h3 className="text-white text-sm font-bold group-hover:text-[#D4A04D] transition-colors line-clamp-1">{item.name}</h3>
                    </div>
                    
                    {/* Delete button overlay */}
                    <button 
                      onClick={() => handleRemove(item._id)}
                      className="text-gray-500 hover:text-red-500 p-1 transition-colors cursor-pointer bg-transparent border-none"
                      title="Remove from Wishlist"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-white">₹{item.price.selling}</span>
                    <span className="text-gray-600 text-xs line-through">₹{item.price.original}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link
                    to={`/products/${item._id}`}
                    className="border border-[#2A2A2D] hover:border-[#D4A04D] text-white hover:text-[#D4A04D] font-extrabold uppercase py-3 rounded-lg text-[9px] tracking-wider transition-all text-center flex items-center justify-center"
                  >
                    VIEW DETAILS
                  </Link>
                  <AddToCartButton productId={item._id} />
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
