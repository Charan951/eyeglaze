import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { socket } from '../lib/socket';

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
  lensType?: string;
  lensSubType?: string;
  lensQuality?: string;
  lensPayload?: any;
  power?: any;
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
  const [refreshKey, setRefreshKey] = useState(0);
  const { user, fetchCartCount } = useAuth();
  const navigate = useNavigate();

  // Lenskart Interactive Checkout states inside Cart
  const [addGoldMembership, setAddGoldMembership] = useState(false);
  const [hasUsedBogoThisMonth, setHasUsedBogoThisMonth] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [activeCoupons, setActiveCoupons] = useState<Coupon[]>([]);
  const [showItemPriceDropdown, setShowItemPriceDropdown] = useState(false);
  const [showDiscountDropdown, setShowDiscountDropdown] = useState(false);
  const [isMembershipDetailsOpen, setIsMembershipDetailsOpen] = useState(false);

  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [userRemovedCoupon, setUserRemovedCoupon] = useState(false);

  // Fetch active coupons
  useEffect(() => {
    const fetchCoupons = () => {
      api.get('/coupons')
        .then(res => {
          setActiveCoupons(res.data?.coupons || []);
        })
        .catch(err => {
          console.error('Failed to fetch coupons:', err);
        });
    };
    fetchCoupons();

    socket.on('coupon_changed', fetchCoupons);
    return () => {
      socket.off('coupon_changed', fetchCoupons);
    };
  }, []);

  // Listen to real-time cart changes from backend
  useEffect(() => {
    const handleCartChanged = () => {
      setRefreshKey(prev => prev + 1);
    };
    socket.on('cart_changed', handleCartChanged);
    return () => {
      socket.off('cart_changed', handleCartChanged);
    };
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
        setHasUsedBogoThisMonth(!!res.data?.cart?.hasUsedBogoThisMonth);
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
          power: item.power,
          lensType: item.lensType,
          lensSubType: item.lensSubType,
          lensQuality: item.lensQuality,
        }));
        setItems(mapped);
      })
      .catch(() => {
        if (active) {
          setItems(mockItems);
          setHasUsedBogoThisMonth(false);
        }
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [user, refreshKey]);

  const isMember = user?.membershipActive || addGoldMembership;

  // Recalculate frame prices and BOGO
  let oneRupeeFramesCount = 0;
  const remainingOneRupeeFrames = Math.max(0, 2 - ((user as any)?.oneRupeeOfferCount ?? 0));
  const buy1Get1Items: { id: string; framePrice: number; lensPrice: number }[] = [];

  const itemsWithPricing = items.map(item => {
    let framePrice = item.framePrice;
    
    // Member Price / ₹1 Frame check - only after first order
    const previousOrderCount = user?.previousOrderCount ?? 0;
    if (item.product?.oneRupeeFrameOffer && user?.membershipActive && previousOrderCount > 0 && !user?.oneRupeeOfferUsed && (user?.oneRupeeOfferCount ?? 0) < 2 && oneRupeeFramesCount < remainingOneRupeeFrames) {
      const allowed = Math.min(item.qty, remainingOneRupeeFrames - oneRupeeFramesCount);
      const regularPrice = item.product?.memberPrice !== undefined ? item.product.memberPrice : item.framePrice;
      const totalFramePriceForQty = (allowed * 1) + ((item.qty - allowed) * regularPrice);
      framePrice = totalFramePriceForQty / item.qty;
      oneRupeeFramesCount += allowed;
    } else if (item.product?.memberPrice !== undefined && isMember) {
      framePrice = item.product.memberPrice;
    } else if (item.product?.nonMemberPrice !== undefined && !isMember) {
      framePrice = item.product.nonMemberPrice;
    }

    return {
      ...item,
      framePriceCalculated: framePrice,
    };
  });

  // Populate BOGO items with unique key per quantity index
  itemsWithPricing.forEach(item => {
    if (!hasUsedBogoThisMonth && (isMember || item.product?.buy1Get1)) {
      for (let index = 0; index < item.qty; index++) {
        buy1Get1Items.push({
          id: `${item._id || item.id}_${index}`,
          framePrice: item.framePriceCalculated,
          lensPrice: item.lensPrice || 0
        });
      }
    }
  });

  // Calculate BOGO discount
  let bogoDiscount = 0;
  let freeItemUniqueKey = '';
  if (buy1Get1Items.length >= 2) {
    buy1Get1Items.sort((a, b) => (b.framePrice + b.lensPrice) - (a.framePrice + a.lensPrice));
    const lowestPriceItem = buy1Get1Items.reduce((lowest, current) => {
      const currentTotal = current.framePrice + current.lensPrice;
      const lowestTotal = lowest.framePrice + lowest.lensPrice;
      return currentTotal < lowestTotal ? current : lowest;
    });
    bogoDiscount = lowestPriceItem.framePrice + lowestPriceItem.lensPrice;
    freeItemUniqueKey = lowestPriceItem.id;
  }

  const isBogoActive = isMember && buy1Get1Items.length >= 2;

  // 1. Total Item Price (undiscounted)
  const itemsSubtotal = itemsWithPricing.reduce((s, i) => {
    const originalFramePrice = i.product?.nonMemberPrice ?? i.product?.price?.selling ?? i.framePrice ?? 1;
    return s + (originalFramePrice + i.lensPrice) * i.qty;
  }, 0);

  // 2. Actual Subtotal (discounted by product discounts)
  const actualSubtotal = itemsWithPricing.reduce((s, i) => s + (i.framePriceCalculated + i.lensPrice) * i.qty, 0);

  // 3. Product/Membership discount
  const productDiscounts = itemsWithPricing.reduce((s, i) => {
    const originalFramePrice = i.product?.nonMemberPrice ?? i.product?.price?.selling ?? i.framePrice ?? 1;
    return s + Math.max(0, originalFramePrice - i.framePriceCalculated) * i.qty;
  }, 0);

  // 4. Fitting Fee: 99 for one product with lens, 199 for more than one
  const lensItemsCount = itemsWithPricing.reduce((count, item) => {
    const hasLens = (item.lensPrice && item.lensPrice > 0) || item.lens;
    return count + (hasLens ? item.qty : 0);
  }, 0);
  const fittingFeeTotal = lensItemsCount === 0 ? 0 : lensItemsCount === 1 ? 99 : 199;

  const delivery = isMember ? 0 : 99;
  const membershipFee = addGoldMembership ? 129 : 0;
  const totalDiscount = discount + bogoDiscount + productDiscounts;
  
  const totalBeforeDiscount = itemsSubtotal + fittingFeeTotal + delivery + membershipFee;
  const total = Math.max(0, totalBeforeDiscount - totalDiscount);

  const renderedItems: any[] = [];
  itemsWithPricing.forEach(item => {
    for (let index = 0; index < item.qty; index++) {
      renderedItems.push({
        ...item,
        qty: 1,
        uniqueKey: `${item._id || item.id}_${index}`,
      });
    }
  });

  if (addGoldMembership && !user?.membershipActive) {
    renderedItems.push({
      id: 'gold_membership_pseudo',
      name: 'EyeGlaze Membership',
      sku: 'MEMBERSHIP-GOLD-1YR',
      color: 'Gold',
      qty: 1,
      framePriceCalculated: 129,
      lensPrice: 0,
      image: '',
      isPseudo: true,
      uniqueKey: 'gold_membership_pseudo',
    } as any);
  }

  // Auto re-validate coupon if pricing updates
  useEffect(() => {
    if (isBogoActive) {
      if (appliedCoupon) {
        setDiscount(0);
        setAppliedCoupon(null);
        setCouponSuccess('');
        setCouponError('Standard coupons cannot be combined with Buy 1 Get 1 Membership offer.');
      }
      return;
    }

    if (appliedCoupon) {
      api.post('/coupons/validate', {
        code: appliedCoupon,
        cartTotal: actualSubtotal + fittingFeeTotal - bogoDiscount,
        addGoldMembership,
        items: itemsWithPricing.map(item => ({
          productId: item.product?._id || item.product?.id || item.productId || item.id,
          qty: item.qty,
          price: (item.framePriceCalculated ?? item.framePrice ?? 1) + (item.lensPrice || 0),
          category: item.product?.category,
          brand: item.product?.brand,
        }))
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
  }, [addGoldMembership, actualSubtotal, fittingFeeTotal, bogoDiscount, isBogoActive]);

  // Auto-apply best coupon if none is applied and user hasn't manually removed it
  useEffect(() => {
    if (isBogoActive) {
      return;
    }
    if (!appliedCoupon && !userRemovedCoupon && itemsWithPricing.length > 0) {
      const itemsPayload = itemsWithPricing.map(item => ({
        productId: item.product?._id || item.product?.id || item.productId || item.id,
        qty: item.qty,
        price: (item.framePriceCalculated ?? item.framePrice ?? 1) + (item.lensPrice || 0),
        category: item.product?.category,
        brand: item.product?.brand,
      }));

      api.post('/coupons/auto-apply', {
        cartTotal: actualSubtotal + fittingFeeTotal - bogoDiscount,
        addGoldMembership,
        items: itemsPayload
      }).then(res => {
        if (res.data.valid && res.data.discountAmount > 0) {
          setDiscount(res.data.discountAmount);
          setAppliedCoupon(res.data.coupon?.code || null);
          setCouponSuccess(res.data.message || 'Auto-applied the best coupon!');
          setCouponError('');
        }
      }).catch(err => {
        console.error('Failed to auto-apply best coupon:', err);
      });
    }
  }, [appliedCoupon, userRemovedCoupon, items.length, actualSubtotal, fittingFeeTotal, bogoDiscount, addGoldMembership]);

  const handleApplyCoupon = async (codeToUse?: string) => {
    if (isBogoActive) {
      setCouponError('Standard coupons cannot be combined with Buy 1 Get 1 Membership offer.');
      return;
    }
    const code = codeToUse || couponCode;
    if (!code || !code.trim()) return;
    setCouponError('');
    setCouponSuccess('');
    try {
      const res = await api.post('/coupons/validate', {
        code: code.trim().toUpperCase(),
        cartTotal: actualSubtotal + fittingFeeTotal - bogoDiscount,
        addGoldMembership,
        items: itemsWithPricing.map(item => ({
          productId: item.product?._id || item.product?.id || item.productId || item.id,
          qty: item.qty,
          price: (item.framePriceCalculated ?? item.framePrice ?? 1) + (item.lensPrice || 0),
          category: item.product?.category,
          brand: item.product?.brand,
        }))
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
    setUserRemovedCoupon(true);
  };



  const handleRepeat = async (item: CartItem) => {
    if (!user) {
      const guestCartStr = localStorage.getItem('guest_cart');
      const cart = guestCartStr ? JSON.parse(guestCartStr) : [];
      const idx = cart.findIndex((i: any) => i.id === item.id);
      if (idx >= 0) {
        const duplicatedItem = {
          ...cart[idx],
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          qty: 1
        };
        cart.splice(idx + 1, 0, duplicatedItem);
        localStorage.setItem('guest_cart', JSON.stringify(cart));
        setItems(cart);
      }
      await fetchCartCount();
      return;
    }

    try {
      setLoading(true);
      const lensObj = item.lensType ? {
        lensType: item.lensType,
        lensSubType: item.lensSubType,
        lensQuality: item.lensQuality,
        lensPrice: item.lensPrice,
        power: item.power,
      } : undefined;

      await api.post('/cart', {
        productId: item.productId,
        color: item.color,
        qty: 1,
        lens: lensObj,
        forceNew: true
      });

      await fetchCartCount();
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Failed to repeat cart item:', err);
      setLoading(false);
    }
  };

  const remove = async (item: CartItem) => {
    if (!user) {
      const guestCartStr = localStorage.getItem('guest_cart');
      const cart = guestCartStr ? JSON.parse(guestCartStr) : [];
      const idx = cart.findIndex((i: any) => i.id === item.id || i._id === item._id);
      if (idx >= 0) {
        if (cart[idx].qty > 1) {
          cart[idx].qty -= 1;
        } else {
          cart.splice(idx, 1);
        }
        localStorage.setItem('guest_cart', JSON.stringify(cart));
        setRefreshKey(prev => prev + 1);
        await fetchCartCount();
      }
      return;
    }

    try {
      const originalItem = items.find(i => i._id === item._id || i.id === item.id);
      if (originalItem && originalItem.qty > 1) {
        await api.put(`/cart/${item._id || item.id}`, { qty: originalItem.qty - 1 });
      } else {
        await api.delete(`/cart/${item._id || item.id}`);
      }
      setRefreshKey(prev => prev + 1);
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
          {renderedItems.map(item => {
            if (item.isPseudo) {
              return (
                <div key={item.id} className="bg-[#131314] border border-[#2A2A2D] rounded-none p-4 flex gap-4 animate-fade-in">
                  {/* Product Image */}
                  <div className="w-36 h-36 bg-gradient-to-br from-[#1E1911] via-[#16120C] to-[#0E0E0F] border border-[#D4A04D]/35 rounded-none overflow-hidden flex flex-col items-center justify-center flex-shrink-0 relative p-3 text-center">
                    <span className="text-[#D4A04D] font-serif font-black tracking-wider text-xs leading-none">EYEGLAZE</span>
                    <span className="text-[#A7A7A7] text-[8px] font-bold uppercase tracking-widest mt-1">MEMBERSHIP</span>
                  </div>

                  <div className="flex-1">
                    <div className="text-white font-semibold flex items-center gap-2 flex-wrap">
                      {item.name}
                    </div>
                    <div className="text-[#A7A7A7] text-xs mt-2">
                      Buy 1 Get 1 Free On Over 5000+ Items, Applicable Everywhere
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <button
                        onClick={() => setAddGoldMembership(false)}
                        className="text-red-400 text-xs hover:underline cursor-pointer bg-transparent border-none p-0"
                      >
                        Remove
                      </button>
                      <span className="text-[#A7A7A7] text-xs">Know More</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-white font-bold">₹129</div>
                    <div className="text-[#A7A7A7] text-[10px] line-through mt-1">₹600</div>
                  </div>
                </div>
              );
            }

            const isFreeThisItem = item.uniqueKey === freeItemUniqueKey;

            return (
              <div key={item.uniqueKey || item.id} className="bg-[#131314] border border-[#2A2A2D] rounded-none p-4 flex gap-4 relative">
                {/* Product Image */}
                <div className="w-36 h-36 bg-[#1A1A1C] border border-[#2A2A2D] rounded-none overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                  {isFreeThisItem && (
                    <div className="absolute top-0 left-0 bg-[#00A86B] text-white font-black text-[8px] uppercase tracking-wider px-2 py-0.5 z-10 rounded-br shadow-md">
                      FREE
                    </div>
                  )}
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <span className="text-3xl">👓</span>
                  )}
                </div>

                <div className="flex-1">
                  <div className="text-white font-semibold flex items-center gap-2 flex-wrap">
                    {item.name}
                  </div>
                  <div className="text-[#A7A7A7] text-sm mt-1">{item.sku} · {item.color}</div>
                  {item.lens && (
                    <div className="text-[#A7A7A7] text-xs mt-1">Lens: {item.lens}</div>
                  )}
                  {item.power && (item.power.RE?.sph !== undefined || item.power.LE?.sph !== undefined) && (
                    <div className="text-[#D4A04D] text-xs mt-0.5 font-bold">
                      Power: {item.power.RE?.sph !== undefined ? `RE: ${item.power.RE.sph > 0 ? '+' : ''}${item.power.RE.sph}` : ''}
                      {item.power.LE?.sph !== undefined && item.power.LE?.sph !== item.power.RE?.sph ? ` · LE: ${item.power.LE.sph > 0 ? '+' : ''}${item.power.LE.sph}` : ''}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <button
                      onClick={() => handleRepeat(item)}
                      className="text-[#D4A04D] text-xs font-bold hover:underline cursor-pointer bg-transparent border-none p-0"
                    >
                      Repeat
                    </button>
                    <button
                      onClick={() => remove(item)}
                      className="text-red-400 text-xs hover:underline cursor-pointer bg-transparent border-none p-0"
                    >
                      Remove
                    </button>
                  </div>
                  {isFreeThisItem && (
                    <div className="mt-3 bg-green-500/10 border border-green-500/25 rounded-lg px-3 py-1.5 text-[10px] text-green-400 flex items-center gap-1.5 w-fit font-medium">
                      <span>✓</span>
                      <span>This Product is Free with EyeGlaze Membership!</span>
                    </div>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-white font-bold">
                    {isFreeThisItem ? (
                      <>
                        <span className="line-through text-xs font-normal text-gray-500 mr-1.5">₹{item.framePriceCalculated + item.lensPrice}</span>
                        <span className="text-green-400">Free</span>
                      </>
                    ) : (
                      `₹${(item.framePriceCalculated + item.lensPrice) * item.qty}`
                    )}
                  </div>
                  <div className="text-[#A7A7A7] text-xs mt-1">
                    Frame: {isFreeThisItem ? (
                      <>
                        <span className="line-through text-gray-500">₹{item.framePriceCalculated}</span>
                        <span className="text-green-400 font-semibold ml-1">Free</span>
                      </>
                    ) : `₹${item.framePriceCalculated}`}
                  </div>
                  {item.lensPrice > 0 && (
                    <div className="text-[#A7A7A7] text-xs">
                      Lens: {isFreeThisItem ? (
                        <>
                          <span className="line-through text-gray-500">₹{item.lensPrice}</span>
                          <span className="text-green-400 font-semibold ml-1">Free</span>
                        </>
                      ) : `₹${item.lensPrice}`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="space-y-4 sticky top-28 self-start">
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-5 space-y-4">
            <h2 className="text-white font-bold text-lg mb-4">Order Summary</h2>

            {/* Billing summary */}
            <div className="space-y-3 text-sm mb-4">
              <div>
                <div 
                  className="flex justify-between items-center cursor-pointer select-none group"
                  onClick={() => setShowItemPriceDropdown(!showItemPriceDropdown)}
                >
                  <span className="text-[#A7A7A7] flex items-center gap-1 group-hover:text-white transition-colors">
                    Total Item Price
                    <span className="text-[10px] text-gray-500">{showItemPriceDropdown ? '▼' : '▶'}</span>
                  </span>
                  <span className="text-white font-semibold">₹{itemsSubtotal}</span>
                </div>
                {showItemPriceDropdown && (
                  <div className="pl-4 pr-2 mt-1.5 py-1.5 space-y-1.5 text-xs text-[#A7A7A7] border-l border-[#2A2A2D] ml-1">
                    {itemsWithPricing.map(item => {
                      const originalFramePrice = item.product?.nonMemberPrice ?? item.product?.price?.selling ?? item.framePrice ?? 1;
                      return (
                        <div key={item.id} className="flex justify-between">
                          <span className="max-w-[70%] truncate">{item.name} (x{item.qty})</span>
                          <span>₹{(originalFramePrice + item.lensPrice) * item.qty}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {totalDiscount > 0 && (
                <div>
                  <div 
                    className="flex justify-between items-center cursor-pointer select-none group font-medium text-green-400"
                    onClick={() => setShowDiscountDropdown(!showDiscountDropdown)}
                  >
                    <span className="flex items-center gap-1 group-hover:text-green-300 transition-colors">
                      Total Discount
                      <span className="text-[10px] text-green-400/50">{showDiscountDropdown ? '▼' : '▶'}</span>
                    </span>
                    <span className="font-bold">-₹{totalDiscount}</span>
                  </div>
                  {showDiscountDropdown && (
                    <div className="pl-4 pr-2 mt-1.5 py-1.5 space-y-1.5 text-xs text-green-400/70 border-l border-green-500/20 ml-1">
                      {productDiscounts > 0 && (
                        <div className="flex justify-between">
                          <span>Product Discount</span>
                          <span>-₹{productDiscounts}</span>
                        </div>
                      )}
                      {bogoDiscount > 0 && (
                        <div className="flex justify-between">
                          <span>Buy 1 Get 1 Offer</span>
                          <span>-₹{bogoDiscount}</span>
                        </div>
                      )}
                      {discount > 0 && (
                        <div className="flex justify-between">
                          <span>Coupon Discount ({appliedCoupon})</span>
                          <span>-₹{discount}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
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

              {membershipFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#A7A7A7]">Gold Membership Fee</span>
                  <span className="text-white">₹{membershipFee}</span>
                </div>
              )}
              
              <div className="border-t border-[#2A2A2D] pt-3 flex justify-between font-bold">
                <span className="text-white">Total Payable</span>
                <span className="text-[#D4A04D] text-lg">₹{total}</span>
              </div>
            </div>
          </div>

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
                    {addGoldMembership ? 'EyeGlaze Membership added' : 'Add EyeGlaze Membership and Avail Buy 1 Get 1 Free + 10% Cashback'}
                  </span>
                  <span className="text-gray-500 text-[9px] mt-1 font-medium flex items-center gap-2">
                    {addGoldMembership ? 'Add 2nd Pair for Free' : 'Get member benefits instantly on this order · ₹129 / year'}
                    <button
                      type="button"
                      onClick={() => setIsMembershipDetailsOpen(true)}
                      className="text-[#D4A04D] hover:underline text-[9px] font-bold tracking-wider uppercase bg-transparent border-none p-0 cursor-pointer ml-1"
                    >
                      View Details
                    </button>
                  </span>
                </div>
                {addGoldMembership ? (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[#D4A04D] text-[10px] font-bold">Choose Now</span>
                    <button
                      type="button"
                      onClick={() => setAddGoldMembership(!addGoldMembership)}
                      className="w-8 h-8 rounded-full border-none cursor-pointer flex items-center justify-center bg-green-500 text-white transition-all"
                      title="Remove Gold Membership"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddGoldMembership(!addGoldMembership)}
                    className="w-8 h-8 rounded-full border-none cursor-pointer flex items-center justify-center bg-[#D4A04D] text-black hover:scale-105 transition-all flex-shrink-0"
                    title="Add Gold Membership"
                  >
                    →
                  </button>
                )}
              </div>
            </div>
          )}

          {hasUsedBogoThisMonth && isMember && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-2.5 text-amber-300 text-xs">
              <div className="text-base mt-0.5">⚠️</div>
              <div className="text-left">
                <span className="font-extrabold text-[10px] uppercase tracking-wide block">Monthly BOGO Limit Reached</span>
                <span className="text-[10px] text-amber-300/80 block mt-0.5 leading-normal">
                  Members are eligible for only one Buy 1 Get 1 free offer per month. Your monthly limit has been reached.
                </span>
              </div>
            </div>
          )}

          {/* Apply Coupon Card */}
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-5 space-y-3">
            <label className="text-white font-bold text-xs uppercase tracking-wide block">Apply Coupon</label>
            <div 
              onClick={() => setIsCouponModalOpen(true)}
              className={`bg-[#0B0B0C] border hover:border-gray-500 rounded-xl p-3.5 cursor-pointer transition-all flex items-center justify-between ${
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

            {couponError && <p className="text-red-400 text-[10px] mt-1">{couponError}</p>}
            {couponSuccess && <p className="text-green-400 text-[10px] mt-1">{couponSuccess}</p>}
          </div>

          <button
            onClick={handleCheckout}
            className="block bg-[#D4A04D] text-black font-bold uppercase py-4 rounded-xl text-center hover:opacity-90 transition-opacity w-full border-none cursor-pointer"
          >
            Proceed to Checkout →
          </button>
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

      {/* Membership Details Modal */}
      {isMembershipDetailsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131314] border border-[#D4A04D]/35 rounded-xl w-full max-w-md p-6 relative flex flex-col shadow-[0_0_50px_rgba(212,160,77,0.15)] animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-[#2A2A2D]">
              <div className="flex items-center gap-2">
                <span className="text-[#D4A04D] text-[10px] font-black uppercase tracking-widest bg-[#D4A04D]/10 px-2 py-1 rounded border border-[#D4A04D]/35">
                  Gold Member
                </span>
                <h3 className="text-white font-bold text-base">Membership Benefits</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMembershipDetailsOpen(false)}
                className="text-[#A7A7A7] hover:text-white font-bold text-sm bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Benefits List */}
            <div className="mt-4 space-y-4 text-left">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#D4A04D]/10 border border-[#D4A04D]/30 flex items-center justify-center flex-shrink-0 text-[#D4A04D] font-bold text-xs">
                  1
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">Buy 1 Get 1 Free</h4>
                  <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                    Buy any frame with lens and get the second frame + lens of equal or lesser value absolutely free. Usable once per calendar month.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#D4A04D]/10 border border-[#D4A04D]/30 flex items-center justify-center flex-shrink-0 text-[#D4A04D] font-bold text-xs">
                  2
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">₹1 Frame Offer (2 Times Lifetime)</h4>
                  <p className="text-gray-400 text-xs mt-1 leading-relaxed text-gray-300">
                    Get up to 2 premium frames for just ₹1 each! <span className="text-[#D4A04D] font-bold">Note: This offer is unlocked and becomes active on subsequent orders after your very first order is completed.</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#D4A04D]/10 border border-[#D4A04D]/30 flex items-center justify-center flex-shrink-0 text-[#D4A04D] font-bold text-xs">
                  3
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">10% Instant Cashback</h4>
                  <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                    Earn 10% cashback directly in your wallet on every order. Save it for your future purchases or add-ons.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#D4A04D]/10 border border-[#D4A04D]/30 flex items-center justify-center flex-shrink-0 text-[#D4A04D] font-bold text-xs">
                  4
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">Free Shipping & Delivery</h4>
                  <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                    Enjoy zero delivery charges or shipping fees on all purchases for the entire duration of your membership.
                  </p>
                </div>
              </div>
            </div>

            {/* Price Footer */}
            <div className="mt-6 pt-4 border-t border-[#2A2A2D] flex items-center justify-between">
              <div>
                <span className="text-[#A7A7A7] text-[10px] uppercase font-bold tracking-wider">Annual Price</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[#D4A04D] text-lg font-black">₹129</span>
                  <span className="text-gray-500 text-xs line-through">₹600</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAddGoldMembership(true);
                  setIsMembershipDetailsOpen(false);
                }}
                className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-xs uppercase px-4 py-2.5 rounded-lg transition-colors cursor-pointer border-none"
              >
                Add Membership
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
