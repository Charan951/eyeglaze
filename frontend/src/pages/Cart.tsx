import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

interface CartItem {
  id: string;
  _id?: string;
  productId?: string;
  name: string;
  sku: string;
  color: string;
  lens?: string;
  framePrice: number;
  lensPrice: number;
  fittingCharge: number;
  qty: number;
  image?: string;
  lensPayload?: any;
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
    image: '/images/cat_prescription.png'
  },
];

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const { user, fetchCartCount } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    if (!user) {
      // Load guest cart from localStorage
      const guestCartStr = localStorage.getItem('guest_cart');
      const cartItems = guestCartStr ? JSON.parse(guestCartStr) : [];
      setItems(cartItems);
      setLoading(false);
      return;
    }

    api.get('/cart')
      .then(res => {
        if (!active) return;
        const cartItems = res.data?.items || res.data?.cart?.items || [];
        const mapped = cartItems.map((item: any) => ({
          id: item._id || item.id,
          _id: item._id,
          productId: item.product?._id || item.product,
          name: item.product?.name || item.name || 'Frame',
          sku: item.product?.sku || item.sku || '',
          color: item.color || '',
          lens: item.lensType 
            ? `${item.lensType.replace('_', ' ').toUpperCase()}${item.lensSubType ? ` (${item.lensSubType.replace('_', ' ').toUpperCase()})` : ` (${item.lensQuality})`}`
            : item.lens || '',
          framePrice: item.framePrice ?? item.product?.price?.selling ?? 1,
          lensPrice: item.lensPrice ?? 0,
          fittingCharge: item.fittingCharge ?? 0,
          qty: item.qty,
          image: item.product?.images?.[0] || item.image || '',
        }));
        setItems(mapped);
      })
      .catch(() => {
        if (active) setItems(mockItems);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [user]);

  const subtotal = items.reduce((s, i) => s + (i.framePrice + i.lensPrice + i.fittingCharge) * i.qty, 0);
  const delivery = 99;
  const discount = couponApplied ? 100 : 0;
  const total = subtotal + delivery - discount;

  const updateQty = async (item: CartItem, qty: number) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, qty } : i));
    
    if (!user) {
      const guestCartStr = localStorage.getItem('guest_cart');
      const cart = guestCartStr ? JSON.parse(guestCartStr) : [];
      const idx = cart.findIndex((i: any) => i.id === item.id);
      if (idx >= 0) {
        cart[idx].qty = qty;
        localStorage.setItem('guest_cart', JSON.stringify(cart));
      }
      await fetchCartCount();
      return;
    }

    try {
      await api.put(`/cart/${item._id || item.id}`, { qty });
      await fetchCartCount();
    } catch {
      // ignore
    }
  };

  const remove = async (item: CartItem) => {
    setItems(prev => prev.filter(i => i.id !== item.id));

    if (!user) {
      const guestCartStr = localStorage.getItem('guest_cart');
      const cart = guestCartStr ? JSON.parse(guestCartStr) : [];
      const updated = cart.filter((i: any) => i.id !== item.id);
      localStorage.setItem('guest_cart', JSON.stringify(updated));
      await fetchCartCount();
      return;
    }

    try {
      await api.delete(`/cart/${item._id || item.id}`);
      await fetchCartCount();
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

  const handleCheckout = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/checkout', search: '' } } });
    } else {
      navigate('/checkout');
    }
  };

  if (loading) {
    return <div className="text-center py-24 text-[#A7A7A7]">Loading...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <SEO robots="noindex, nofollow" title="Shopping Cart" />
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-xl font-bold text-white mb-2">Your cart is empty</h2>
        <p className="text-[#A7A7A7] mb-6">Add some frames to get started</p>
        <Link to="/products" className="bg-[#D4A04D] text-black font-bold uppercase py-3 px-8 rounded-xl hover:opacity-90 transition-opacity">
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div>
      <SEO robots="noindex, nofollow" title="Shopping Cart" />
      <h1 className="text-2xl font-bold text-white mb-6">Your Cart ({items.length} item{items.length !== 1 ? 's' : ''})</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-4 flex gap-4">
              {/* Product Image */}
              <div className="w-20 h-20 bg-[#222] border border-[#2A2A2D] rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">👓</span>
                )}
              </div>

              <div className="flex-1">
                <div className="text-white font-semibold">{item.name}</div>
                <div className="text-[#A7A7A7] text-sm mt-1">{item.sku} · {item.color}</div>
                {item.lens && (
                  <div className="text-[#A7A7A7] text-xs mt-1">Lens: {item.lens}</div>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item, Math.max(1, item.qty - 1))}
                      className="w-7 h-7 bg-[#2A2A2D] rounded text-white hover:bg-[#D4A04D] hover:text-black transition-colors text-sm"
                    >−</button>
                    <span className="text-white w-6 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item, item.qty + 1)}
                      className="w-7 h-7 bg-[#2A2A2D] rounded text-white hover:bg-[#D4A04D] hover:text-black transition-colors text-sm"
                    >+</button>
                  </div>
                  <button onClick={() => remove(item)} className="text-red-400 text-xs hover:underline">Remove</button>
                </div>
              </div>

              <div className="text-right">
                <div className="text-white font-bold">₹{(item.framePrice + item.lensPrice + item.fittingCharge) * item.qty}</div>
                <div className="text-[#A7A7A7] text-xs mt-1">Frame: ₹{item.framePrice}</div>
                {item.lensPrice > 0 && <div className="text-[#A7A7A7] text-xs">Lens: ₹{item.lensPrice}</div>}
                {item.fittingCharge > 0 && <div className="text-[#A7A7A7] text-xs">Fitting: ₹{item.fittingCharge}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-5 sticky top-28">
            <h2 className="text-white font-bold text-lg mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-[#A7A7A7]">Subtotal</span>
                <span className="text-white">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A7A7A7]">Delivery Charge</span>
                <span className="text-white">₹{delivery}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between text-green-400">
                  <span>Coupon Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="border-t border-[#2A2A2D] pt-3 flex justify-between font-bold">
                <span className="text-white">Total</span>
                <span className="text-[#D4A04D] text-lg">₹{total}</span>
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
                  className="flex-1 bg-[#0B0B0C] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                />
                <button
                  onClick={applyCoupon}
                  className="bg-[#D4A04D] text-black font-bold px-4 py-2 rounded-lg text-sm hover:opacity-90"
                >
                  Apply
                </button>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="block bg-[#D4A04D] text-black font-bold uppercase py-4 rounded-xl text-center hover:opacity-90 transition-opacity w-full border-none cursor-pointer"
            >
              Proceed to Checkout →
            </button>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[#A7A7A7] text-center">
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
