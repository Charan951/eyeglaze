import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface AddToCartButtonProps {
  productId: string;
  color?: string;
  product?: {
    name: string;
    sku: string;
    price: { original: number; selling: number };
    images?: string[];
  };
  lensPayload?: any;
  className?: string;
  label?: string;
  disabled?: boolean;
}

export default function AddToCartButton({
  productId,
  color,
  product,
  lensPayload,
  className,
  label = 'ADD TO CART',
  disabled = false,
}: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);
  const { user, fetchCartCount } = useAuth();

  const handleAdd = async () => {
    if (disabled) return;

    if (!user) {
      // Guest User Cart Flow
      try {
        const guestCartStr = localStorage.getItem('guest_cart');
        const cart = guestCartStr ? JSON.parse(guestCartStr) : [];
        
        const existingIdx = cart.findIndex(
          (item: any) =>
            item.productId === productId &&
            item.color === color &&
            item.lensType === (lensPayload?.lensType || undefined)
        );

        if (existingIdx >= 0) {
          cart[existingIdx].qty += 1;
          if (lensPayload && typeof lensPayload.framePrice === 'number') {
            cart[existingIdx].framePrice = lensPayload.framePrice;
            cart[existingIdx].lensPrice = lensPayload.lensPrice || 0;
            cart[existingIdx].priceLocked = true;
          }
        } else {
          const newItem = {
            id: `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            productId,
            qty: 1,
            color: color || 'Matte Black',
            name: product?.name || 'Frame',
            sku: product?.sku || '',
            framePrice: lensPayload && typeof lensPayload.framePrice === 'number' ? lensPayload.framePrice : (product?.price?.selling ?? 1),
            priceLocked: !!lensPayload,
            lensPrice: lensPayload?.lensPrice || 0,
            fittingCharge: lensPayload ? 99 : 0,
            image: product?.images?.[0] || '',
            lens: lensPayload 
              ? `${lensPayload.lensType || 'Lens'}${lensPayload.power?.RE?.sph ? ` (${lensPayload.power.RE.sph > 0 ? '+' : ''}${lensPayload.power.RE.sph})` : ''}` 
              : '',
            lensType: lensPayload?.lensType || undefined,
            power: lensPayload?.power || undefined,
            lensPayload,
          };
          cart.push(newItem);
        }

        localStorage.setItem('guest_cart', JSON.stringify(cart));
        await fetchCartCount();
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      } catch (error) {
        console.error('Failed to add to guest cart:', error);
      }
      return;
    }

    try {
      await api.post('/cart', {
        productId,
        qty: 1,
        color,
        lens: lensPayload,
        priceOverride: lensPayload && typeof lensPayload.framePrice === 'number' ? lensPayload.framePrice : undefined
      });
      await fetchCartCount();
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const defaultStyle = "border border-[#D4A04D] text-[#D4A04D] bg-[#0E0E0E] hover:bg-[#D4A04D] hover:text-black font-extrabold uppercase py-3 px-5 rounded-lg text-[9px] tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer w-full select-none disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <motion.button
      onClick={handleAdd}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      animate={added ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
      className={className || defaultStyle}
    >
      <svg className="w-4 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <span className="relative inline-grid overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={added ? 'added' : 'default'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="col-start-1 row-start-1"
          >
            {added ? 'ADDED ✓' : label}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  );
}
