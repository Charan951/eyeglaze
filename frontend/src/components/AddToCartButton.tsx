import { useState } from 'react';
import api from '../lib/api';

export default function AddToCartButton({ productId }: { productId: string }) {
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    try {
      await api.post('/cart', { productId, qty: 1 });
    } catch {
      // ignore
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button
      onClick={handleAdd}
      className="border border-[#2A2A2A] text-white font-bold uppercase py-3 px-6 rounded-xl text-sm hover:border-[#C9A84C] transition-colors whitespace-nowrap"
    >
      {added ? 'ADDED ✓' : 'ADD TO CART'}
    </button>
  );
}
