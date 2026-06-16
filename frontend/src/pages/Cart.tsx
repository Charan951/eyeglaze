import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

interface CartItem {
  id: string;
  _id?: string;
  name: string;
  sku: string;
  color: string;
  lens?: string;
  framePrice: number;
  lensPrice: number;
  fittingCharge: number;
  qty: number;
}

const mockItems: CartItem[] = [
  {
    id: '1',
    name: 'Matte Square Frame',
    sku: 'EG-2041',
    color: 'Matte Black',
    lens: 'Single Vision + HMC Blue Cut',
    framePrice: 1,
    lensPrice: 999,
    fittingCharge: 199,
    qty: 1,
  },
];

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  useEffect(() => {
    let active = true;
    api.get('/cart')
      .then(res => {
        if (!active) return;
        const cartItems = res.data?.items || res.data?.cart?.items || [];
        setItems(cartItems.length ? cartItems : mockItems);
      })
      .catch(() => {
        if (active) setItems(mockItems);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const subtotal = items.reduce((s, i) => s + (i.framePrice + i.lensPrice + i.fittingCharge) * i.qty, 0);
  const delivery = 99;
  const discount = couponApplied ? 100 : 0;
  const total = subtotal + delivery - discount;

  const updateQty = async (item: CartItem, qty: number) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, qty } : i));
    try {
      await api.put(`/cart/${item._id || item.id}`, { qty });
    } catch {
      // ignore
    }
  };

  const remove = async (item: CartItem) => {
    setItems(prev => prev.filter(i => i.id !== item.id));
    try {
      await api.delete(`/cart/${item._id || item.id}`);
    } catch {
      // ignore
    }
  };

  const applyCoupon = async () => {
    if (!coupon) return;
    try {
      await api.post('/cart/apply-coupon', { code: coupon });
      setCouponApplied(true);
    } catch {
      setCouponApplied(true);
    }
  };

  if (loading) {
    return <div className="text-center py-24 text-[#888]">Loading...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-xl font-bold text-white mb-2">Your cart is empty</h2>
        <p className="text-[#888] mb-6">Add some frames to get started</p>
        <Link to="/products" className="bg-[#C9A84C] text-black font-bold uppercase py-3 px-8 rounded-xl hover:opacity-90 transition-opacity">
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Your Cart ({items.length} item{items.length !== 1 ? 's' : ''})</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex gap-4">
              {/* Image placeholder */}
              <div className="w-20 h-20 bg-[#222] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">👓</span>
              </div>

              <div className="flex-1">
                <div className="text-white font-semibold">{item.name}</div>
                <div className="text-[#888] text-sm mt-1">{item.sku} · {item.color}</div>
                {item.lens && (
                  <div className="text-[#888] text-xs mt-1">Lens: {item.lens}</div>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item, Math.max(1, item.qty - 1))}
                      className="w-7 h-7 bg-[#2A2A2A] rounded text-white hover:bg-[#C9A84C] hover:text-black transition-colors text-sm"
                    >−</button>
                    <span className="text-white w-6 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item, item.qty + 1)}
                      className="w-7 h-7 bg-[#2A2A2A] rounded text-white hover:bg-[#C9A84C] hover:text-black transition-colors text-sm"
                    >+</button>
                  </div>
                  <button onClick={() => remove(item)} className="text-red-400 text-xs hover:underline">Remove</button>
                </div>
              </div>

              <div className="text-right">
                <div className="text-white font-bold">₹{(item.framePrice + item.lensPrice + item.fittingCharge) * item.qty}</div>
                <div className="text-[#888] text-xs mt-1">Frame: ₹{item.framePrice}</div>
                {item.lensPrice > 0 && <div className="text-[#888] text-xs">Lens: ₹{item.lensPrice}</div>}
                {item.fittingCharge > 0 && <div className="text-[#888] text-xs">Fitting: ₹{item.fittingCharge}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 sticky top-28">
            <h2 className="text-white font-bold text-lg mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-[#888]">Subtotal</span>
                <span className="text-white">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888]">Delivery Charge</span>
                <span className="text-white">₹{delivery}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between text-green-400">
                  <span>Coupon Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="border-t border-[#2A2A2A] pt-3 flex justify-between font-bold">
                <span className="text-white">Total</span>
                <span className="text-[#C9A84C] text-lg">₹{total}</span>
              </div>
            </div>

            {/* Coupon */}
            <div className="mb-4">
              <div className="text-white text-sm font-semibold mb-2">Apply Coupon</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={coupon}
                  onChange={e => setCoupon(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="flex-1 bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#C9A84C] focus:outline-none"
                />
                <button
                  onClick={applyCoupon}
                  className="bg-[#C9A84C] text-black font-bold px-4 py-2 rounded-lg text-sm hover:opacity-90"
                >
                  Apply
                </button>
              </div>
            </div>

            <a
              href="/checkout"
              className="block bg-[#C9A84C] text-black font-bold uppercase py-4 rounded-xl text-center hover:opacity-90 transition-opacity w-full"
            >
              Proceed to Checkout →
            </a>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[#888] text-center">
              <div>100% Secure</div>
              <div>1 Year Warranty</div>
              <div>Easy Returns</div>
              <div>Fast Delivery</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
