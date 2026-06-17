import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface AddToCartButtonProps {
  productId: string;
  color?: string;
}

export default function AddToCartButton({ productId, color }: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);
  const { user, fetchCartCount } = useAuth();
  const navigate = useNavigate();

  const handleAdd = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await api.post('/cart', { productId, qty: 1, color });
      await fetchCartCount();
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  return (
    <button
      onClick={handleAdd}
      className="border border-[#D4A04D] text-[#D4A04D] bg-[#0E0E0E] hover:bg-[#D4A04D] hover:text-black font-extrabold uppercase py-3 px-5 rounded-lg text-[9px] tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer w-full select-none"
    >
      <svg className="w-4 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <span>{added ? 'ADDED ✓' : 'ADD TO CART'}</span>
    </button>
  );
}
