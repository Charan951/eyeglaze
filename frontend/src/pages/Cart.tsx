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
  product?: any;
}

interface Coupon {
  _id: string;
  code: string;
  name: string;
  description: string;
  badge?: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  expiresAt?: string;
  validTo?: string;
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
  const { user, fetchCartCount } = useAuth();
  const navigate = useNavigate();

  // Lenskart Interactive Checkout states inside Cart
  const [addGoldMembership, setAddGoldMembership] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [activeCoupons, setActiveCoupons] = useState<Coupon[]>([]);

  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Fetch active coupons
  useEffect(() => {
    api.get('/coupons')
      .then(res => {
        setActiveCoupons(res.data?.coupons || []);
      })
      .catch(err => {
        console.error('Failed to fetch coupons:', err);
      });
  }, []);

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
          product: item.product,
        }));
        setItems(mapped);
      })
      .catch(() => {
        if (active) setItems(mockItems);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [user]);

  const isMember = user?.membershipActive || addGoldMembership;

  // Recalculate frame prices and BOGO
  let oneRupeeFramesCount = 0;
  const buy1Get1Items: { framePrice: number; lensPrice: number }[] = [];

  const itemsWithPricing = items.map(item => {
    let framePrice = item.framePrice;
    
    // Member Price / ₹1 Frame check
    if (item.product?.oneRupeeFrameOffer && isMember && !user?.oneRupeeOfferUsed && oneRupeeFramesCount < 2) {
      framePrice = 1;
      oneRupeeFramesCount += item.qty;
    } else if (item.product?.memberPrice !== undefined && isMember) {
      framePrice = item.product.memberPrice;
    } else if (item.product?.nonMemberPrice !== undefined && !isMember) {
      framePrice = item.product.nonMemberPrice;
    }

    if (item.product?.buy1Get1) {
      for (let index = 0; index < item.qty; index++) {
        buy1Get1Items.push({ framePrice, lensPrice: item.lensPrice });
      }
    }

    return {
      ...item,
      framePriceCalculated: framePrice,
    };
  });

  // Calculate BOGO discount
  let bogoDiscount = 0;
  if (buy1Get1Items.length >= 2) {
    buy1Get1Items.sort((a, b) => (b.framePrice + b.lensPrice) - (a.framePrice + a.lensPrice));
    const lowestPriceItem = buy1Get1Items.reduce((lowest, current) => {
      const currentTotal = current.framePrice + current.lensPrice;
      const lowestTotal = lowest.framePrice + lowest.lensPrice;
      return currentTotal < lowestTotal ? current : lowest;
    });
    bogoDiscount = lowestPriceItem.framePrice + lowestPriceItem.lensPrice;
  }

  const itemsSubtotal = itemsWithPricing.reduce((s, i) => s + (i.framePriceCalculated + i.lensPrice) * i.qty, 0);
  const fittingFeeTotal = itemsWithPricing.reduce((s, i) => s + i.fittingCharge * i.qty, 0);
  const delivery = isMember ? 0 : 99;
  const membershipFee = addGoldMembership ? 129 : 0;
  
  const totalBeforeDiscount = itemsSubtotal + fittingFeeTotal + delivery + membershipFee - bogoDiscount;
  const total = Math.max(0, totalBeforeDiscount - discount);

  // Auto re-validate coupon if pricing updates
  useEffect(() => {
    if (appliedCoupon) {
      api.post('/coupons/validate', {
        code: appliedCoupon,
        cartTotal: itemsSubtotal + fittingFeeTotal - bogoDiscount
      }).then(res => {
        if (res.data.valid) {
          setDiscount(res.data.discount);
        } else {
          setDiscount(0);
          setAppliedCoupon(null);
          setCouponSuccess('');
          setCouponError(`Coupon removed: ${res.data.message}`);
        }
      }).catch(() => {
        setDiscount(0);
        setAppliedCoupon(null);
        setCouponSuccess('');
      });
    }
  }, [addGoldMembership, itemsSubtotal, fittingFeeTotal, bogoDiscount]);

  const handleApplyCoupon = async (codeToUse?: string) => {
    const code = codeToUse || couponCode;
    if (!code.trim()) return;
    setCouponError('');
    setCouponSuccess('');
    try {
      const res = await api.post('/coupons/validate', {
        code: code.trim().toUpperCase(),
        cartTotal: itemsSubtotal + fittingFeeTotal - bogoDiscount
      });

      if (res.data.valid) {
        setDiscount(res.data.discount);
        setAppliedCoupon(code.trim().toUpperCase());
        setCouponSuccess(res.data.message || 'Coupon applied successfully!');
        setIsCouponModalOpen(false);
      } else {
        setCouponError(res.data.message || 'Invalid coupon code');
        setDiscount(0);
        setAppliedCoupon(null);
      }
    } catch (err: any) {
      console.error(err);
      setCouponError(err.response?.data?.error || 'Failed to validate coupon.');
      setDiscount(0);
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setDiscount(0);
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    setCouponSuccess('');
  };

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

  const handleCheckout = () => {
    const checkoutState = {
      addGoldMembership,
      appliedCouponCode: appliedCoupon,
      discount
    };
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/checkout', search: '' }, checkoutState } });
    } else {
      navigate('/checkout', { state: checkoutState });
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
          {itemsWithPricing.map(item => (
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
                <div className="text-white font-bold">₹{(item.framePriceCalculated + item.lensPrice + item.fittingCharge) * item.qty}</div>
                <div className="text-[#A7A7A7] text-xs mt-1">Frame: ₹{item.framePriceCalculated}</div>
                {item.lensPrice > 0 && <div className="text-[#A7A7A7] text-xs">Lens: ₹{item.lensPrice}</div>}
                {item.fittingCharge > 0 && <div className="text-[#A7A7A7] text-xs">Fitting: ₹{item.fittingCharge}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          {/* Gold Membership Card */}
          {!user?.membershipActive && (
            <div className={`bg-gradient-to-br from-[#1E1911] via-[#16120C] to-[#0E0E0F] border rounded-xl p-4 transition-all duration-300 relative overflow-hidden ${
              addGoldMembership 
                ? 'border-[#D4A04D] shadow-[0_0_15px_rgba(212,160,77,0.15)] bg-[#1e1911]' 
                : 'border-[#D4A04D]/30'
            }`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#D4A04D] text-[9px] font-black uppercase tracking-widest bg-[#D4A04D]/10 px-1.5 py-0.5 rounded border border-[#D4A04D]/30">
                      Gold Member
                    </span>
                  </div>
                  <span className="text-white text-xs font-bold mt-2 leading-snug">
                    Add Gold Max Membership and Avail Buy 1 Get 1 Free + 10% Cashback
                  </span>
                  <span className="text-gray-500 text-[9px] mt-1 font-medium">
                    Get member benefits instantly on this order · ₹129 / year
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAddGoldMembership(!addGoldMembership)}
                  className={`w-8 h-8 rounded-full border-none cursor-pointer flex items-center justify-center transition-all flex-shrink-0 ${
                    addGoldMembership 
                      ? 'bg-green-500 text-white' 
                      : 'bg-[#D4A04D] text-black hover:scale-105'
                  }`}
                  title={addGoldMembership ? "Remove Gold Membership" : "Add Gold Membership"}
                >
                  {addGoldMembership ? '✓' : '→'}
                </button>
              </div>
            </div>
          )}

          <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-5 sticky top-28 space-y-4">
            <h2 className="text-white font-bold text-lg mb-4">Order Summary</h2>

            {/* Apply Coupon Card */}
            <div className="border-b border-[#2A2A2D]/60 pb-4 mb-4">
              <label className="text-white font-bold text-xs uppercase tracking-wide block mb-2">Apply Coupon</label>
              <div 
                onClick={() => setIsCouponModalOpen(true)}
                className={`bg-[#0B0B0C] border hover:border-gray-500 rounded-xl p-3 cursor-pointer transition-all flex items-center justify-between ${
                  appliedCoupon ? 'border-green-500/50 bg-green-500/5' : 'border-[#2A2A2D]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="text-lg">🎫</div>
                  <div className="flex flex-col text-left">
                    <span className="text-white font-bold text-xs uppercase tracking-wide">
                      {appliedCoupon ? `Coupon: ${appliedCoupon}` : 'Apply Coupon'}
                    </span>
                    <span className="text-[#A7A7A7] text-[10px] mt-0.5">
                      {appliedCoupon ? `Saved ₹${discount}!` : 'Check available offers'}
                    </span>
                  </div>
                </div>
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCoupon();
                    }}
                    className="text-red-400 hover:text-red-300 font-extrabold text-[10px] uppercase tracking-wider bg-transparent border-none cursor-pointer p-1"
                  >
                    Remove
                  </button>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#2A2A2D] hover:bg-gray-700 flex items-center justify-center text-white text-xs">
                    →
                  </div>
                )}
              </div>

              {couponError && <p className="text-red-400 text-[10px] mt-1.5">{couponError}</p>}
              {couponSuccess && <p className="text-green-400 text-[10px] mt-1.5">{couponSuccess}</p>}
            </div>

            {/* Billing summary */}
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-[#A7A7A7]">Total Item Price</span>
                <span className="text-white">₹{itemsSubtotal}</span>
              </div>
              
              {fittingFeeTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#A7A7A7]">Fitting Fee</span>
                  <span className="text-white">₹{fittingFeeTotal}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-[#A7A7A7]">Shipping & Delivery</span>
                <span className="text-white">{delivery === 0 ? <span className="text-green-400 font-bold">FREE</span> : `₹${delivery}`}</span>
              </div>

              {bogoDiscount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-green-400">Buy 1 Get 1 Discount</span>
                  <span className="text-green-400 font-bold">-₹{bogoDiscount}</span>
                </div>
              )}

              {membershipFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#A7A7A7]">Gold Membership Fee</span>
                  <span className="text-white">₹{membershipFee}</span>
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-[#A7A7A7]">Coupon Discount ({appliedCoupon})</span>
                  <span className="text-[#D4A04D] font-bold">-₹{discount}</span>
                </div>
              )}
              
              <div className="border-t border-[#2A2A2D] pt-3 flex justify-between font-bold">
                <span className="text-white">Total Payable</span>
                <span className="text-[#D4A04D] text-lg">₹{total}</span>
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

      {/* Coupon Selection Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl w-full max-w-md p-6 relative shadow-2xl flex flex-col max-h-[80vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-[#2A2A2D]">
              <div>
                <h3 className="text-white font-bold text-base">Select Coupon</h3>
                <p className="text-[#A7A7A7] text-[11px] mt-0.5">Choose an active offer to save on your order</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(false)}
                className="text-[#A7A7A7] hover:text-white font-bold text-sm bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Manual Entry Row */}
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="ENTER COUPON CODE"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1 bg-[#0B0B0C] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-xs font-mono tracking-wider focus:border-[#D4A04D] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleApplyCoupon()}
                className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-xs uppercase px-4 py-2 rounded-lg transition-colors cursor-pointer border-none"
              >
                Apply
              </button>
            </div>
            {couponError && <p className="text-red-400 text-[10px] mt-1">{couponError}</p>}

            {/* Coupons List */}
            <div className="mt-4 flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[45vh]">
              {activeCoupons.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs">No active coupons available right now</div>
              ) : (
                activeCoupons.map((coupon) => (
                  <div 
                    key={coupon._id} 
                    className={`border border-dashed rounded-xl p-4 flex flex-col relative overflow-hidden bg-[#1A1A1C]/50 ${
                      appliedCoupon === coupon.code 
                        ? 'border-green-500/50 bg-green-500/5' 
                        : 'border-[#D4A04D]/40'
                    }`}
                  >
                    {/* Punch holes for coupon ticket effect */}
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#131314] rounded-full border border-[#2A2A2D] z-10" />
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#131314] rounded-full border border-l-[#2A2A2D] z-10" />
                    
                    <div className="flex justify-between items-start gap-4">
                      <div className="text-left">
                        {coupon.badge && (
                          <span className="bg-[#D4A04D]/15 text-[#D4A04D] text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-[#D4A04D]/35">
                            {coupon.badge}
                          </span>
                        )}
                        <h4 className="text-white font-mono font-bold text-sm tracking-wider mt-1.5">{coupon.code}</h4>
                        <p className="text-gray-400 text-[10px] mt-1 leading-snug">{coupon.description}</p>
                        <div className="flex gap-3 text-[9px] text-gray-500 mt-2 font-medium">
                          {coupon.minOrderValue && <span>MIN PURCHASE: ₹{coupon.minOrderValue}</span>}
                          {coupon.maxDiscount && <span>MAX DISCOUNT: ₹{coupon.maxDiscount}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon(coupon.code)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer flex-shrink-0 ${
                          appliedCoupon === coupon.code
                            ? 'bg-green-500 text-white'
                            : 'bg-[#D4A04D] text-black hover:opacity-90 hover:scale-105'
                        }`}
                      >
                        {appliedCoupon === coupon.code ? 'Applied ✓' : 'Apply'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
