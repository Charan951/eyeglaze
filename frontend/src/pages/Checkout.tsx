import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';

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
  image?: string;
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
  discountType: 'percent' | 'flat' | 'bogo' | 'buy_x_get_y' | 'free_shipping' | 'cashback' | 'wallet_credit' | 'gift';
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  expiresAt?: string;
  validTo?: string;
  applicableBrands?: string[];
  applicableCategories?: string[];
  applicableProducts?: string[];
  buyQty?: number;
  getQty?: number;
}

export default function CheckoutPage() {
  const { user, checkAuth, fetchCartCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const checkoutState = location.state?.checkoutState || location.state || {};

  // Cart & Pricing
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form Fields
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  
  const [discount, setDiscount] = useState(checkoutState.discount || 0);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(checkoutState.appliedCouponCode || null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Lenskart Interactive Checkout states
  const [addGoldMembership, setAddGoldMembership] = useState(checkoutState.addGoldMembership || false);
  const [hasUsedBogoThisMonth, setHasUsedBogoThisMonth] = useState(false);
  const [showDiscountDropdown, setShowDiscountDropdown] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [activeCoupons, setActiveCoupons] = useState<Coupon[]>([]);
  const [useWallet, setUseWallet] = useState(false);
  const [isNewAddressActive, setIsNewAddressActive] = useState(false);

  const isMember = user?.membershipActive || addGoldMembership;

  // Recalculate frame prices and BOGO
  let oneRupeeFramesCount = 0;
  const buy1Get1Items: { uniqueKey: string; framePrice: number; lensPrice: number }[] = [];

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

    // Under Gold Membership, ALL items are eligible for BOGO! Otherwise, only items with product.buy1Get1
    if ((isMember && !hasUsedBogoThisMonth) || item.product?.buy1Get1) {
      for (let index = 0; index < item.qty; index++) {
        buy1Get1Items.push({
          uniqueKey: `${item._id || item.id}_${index}`,
          framePrice,
          lensPrice: item.lensPrice || 0
        });
      }
    }

    return {
      ...item,
      framePriceCalculated: framePrice,
    };
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
    freeItemUniqueKey = lowestPriceItem.uniqueKey;
  }

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

  // Wallet deduction: up to wallet balance, not more than remaining amount
  let walletAmount = 0;
  if (useWallet && user?.walletBalance) {
    const remainingAfterDiscount = Math.max(0, totalBeforeDiscount - totalDiscount);
    walletAmount = Math.min(user.walletBalance, remainingAfterDiscount);
  }
  
  const total = Math.max(0, totalBeforeDiscount - totalDiscount - walletAmount);

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
      fittingCharge: 0,
      image: '',
      isPseudo: true,
      uniqueKey: 'gold_membership_pseudo',
    } as any);
  }

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

  const handleApplyCoupon = async (codeToUse?: string) => {
    const code = codeToUse || couponCode;
    if (!code.trim()) return;
    setCouponError('');
    setCouponSuccess('');
    try {
      const res = await api.post('/coupons/validate', {
        code: code.trim().toUpperCase(),
        cartTotal: actualSubtotal + fittingFeeTotal - bogoDiscount,
        items: itemsWithPricing.map(item => ({
          productId: item.product?._id || item.product?.id || item._id,
          qty: item.qty,
          price: item.framePriceCalculated ?? item.framePrice ?? 1,
          category: item.product?.category,
          brand: item.product?.brand,
        })),
        paymentMethod: 'cod',
        shippingMethod: 'standard',
        location: {
          country: 'India',
          state: state || undefined,
          city: city || undefined,
        }
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

  const handleAutoApplyBest = async () => {
    setCouponError('');
    setCouponSuccess('');
    try {
      const res = await api.post('/coupons/auto-apply', {
        cartTotal: actualSubtotal + fittingFeeTotal - bogoDiscount,
        items: itemsWithPricing.map(item => ({
          productId: item.product?._id || item.product?.id || item._id,
          qty: item.qty,
          price: item.framePriceCalculated ?? item.framePrice ?? 1,
          category: item.product?.category,
          brand: item.product?.brand,
        })),
        paymentMethod: 'cod',
        shippingMethod: 'standard',
        location: {
          country: 'India',
          state: state || undefined,
          city: city || undefined,
        }
      });

      if (res.data.valid) {
        setDiscount(res.data.discount);
        setAppliedCoupon(res.data.coupon.code);
        setCouponSuccess(res.data.message || 'Auto-applied best coupon!');
        setIsCouponModalOpen(false);
      } else {
        setCouponError(res.data.message || 'No eligible auto coupons found');
      }
    } catch (err: any) {
      console.error(err);
      setCouponError(err.response?.data?.error || 'Failed to auto apply best coupon.');
    }
  };

  const handleRemoveCoupon = () => {
    setDiscount(0);
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    setCouponSuccess('');
  };

  // Wallet

  // Auto-fill from default saved address if available
  useEffect(() => {
    if (user && user.addresses && user.addresses.length > 0) {
      const defaultAddr = (user.addresses as any[]).find(addr => addr.isDefault) || user.addresses[0];
      if (defaultAddr) {
        setFullName(defaultAddr.fullName || '');
        setMobile(defaultAddr.mobile || '');
        setLine1(defaultAddr.line1 || '');
        setLine2(defaultAddr.line2 || '');
        setCity(defaultAddr.city || '');
        setState(defaultAddr.state || '');
        setPincode(defaultAddr.pincode || '');
        setIsNewAddressActive(false);
      }
    } else {
      setIsNewAddressActive(true);
    }
  }, [user]);
  
  // Success state
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{
    orderId: string;
    total: number;
    estimatedDelivery: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    api.get('/cart')
      .then(res => {
        if (!active) return;
        setHasUsedBogoThisMonth(!!res.data?.cart?.hasUsedBogoThisMonth);
        const cartItems = res.data?.items || res.data?.cart?.items || [];
        const mapped = cartItems.map((item: any) => ({
          id: item._id || item.id,
          _id: item._id,
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
        }));
        setItems(mapped);
      })
      .catch((err) => {
        console.error('Failed to load cart for checkout:', err);
        setHasUsedBogoThisMonth(false);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);



  // Auto re-validate coupon if pricing updates
  useEffect(() => {
    if (appliedCoupon) {
      api.post('/coupons/validate', {
        code: appliedCoupon,
        cartTotal: actualSubtotal + fittingFeeTotal - bogoDiscount,
        items: itemsWithPricing.map(item => ({
          productId: item.product?._id || item.product?.id || item._id,
          qty: item.qty,
          price: item.framePriceCalculated ?? item.framePrice ?? 1,
          category: item.product?.category,
          brand: item.product?.brand,
        })),
        paymentMethod: 'cod',
        shippingMethod: 'standard',
        location: {
          country: 'India',
          state: state || undefined,
          city: city || undefined,
        }
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
  }, [addGoldMembership, actualSubtotal, fittingFeeTotal, bogoDiscount]);

  // Load Razorpay Checkout script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const submitOrder = async (payMethod: string, payStatus: string) => {
    setSubmitting(true);
    try {
      const payload = {
        deliveryAddress: {
          fullName,
          mobile,
          line1,
          line2,
          city,
          state,
          pincode
        },
        paymentMethod: payMethod,
        paymentStatus: payStatus,
        couponCode: appliedCoupon || undefined,
        walletUsed: useWallet ? walletAmount : 0,
        activateMembership: addGoldMembership,
      };

      const res = await api.post('/orders', payload);
      
      // Refresh Auth and Cart counts
      await checkAuth();
      await fetchCartCount();

      setSuccessDetails({
        orderId: res.data.orderId,
        total: res.data.total || total,
        estimatedDelivery: new Date(res.data.estimatedDelivery).toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      });
      setOrderSuccess(true);
    } catch (err) {
      console.error('Order placement failed:', err);
      alert('Failed to place order. Please check your cart and shipping details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !mobile || !line1 || !city || !state || !pincode) {
      alert('Please fill out all required address fields.');
      return;
    }

    if (total === 0) {
      await submitOrder('wallet', 'paid');
      return;
    }

    if (typeof (window as any).Razorpay === 'undefined') {
      alert('Razorpay payment gateway is still loading. Please try again in a few seconds.');
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_STX1H1R9XvVjSZ',
      amount: Math.round(total * 100),
      currency: 'INR',
      name: 'EyeGlaze Eyewear',
      description: 'Order Payment',
      image: '/favicon.ico',
      handler: async function (_response: any) {
        await submitOrder('razorpay', 'paid');
      },
      prefill: {
        name: fullName,
        contact: mobile,
        email: user?.email || '',
      },
      theme: {
        color: '#D4A04D',
      },
      modal: {
        ondismiss: function () {
          console.log('Razorpay modal dismissed');
        }
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  if (loading) {
    return <div className="text-center py-24 text-[#A7A7A7]">Loading Checkout Details...</div>;
  }

  // Order Success Screen
  if (orderSuccess && successDetails) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 md:px-0">
        <SEO robots="noindex, nofollow" title="Order Placed Successfully" />
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full flex items-center justify-center text-3xl mx-auto">
            ✓
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Order Placed Successfully!</h1>
            <p className="text-[#A7A7A7] text-sm">Thank you for shopping with EyeGlaze. Your order has been registered.</p>
          </div>

          <div className="bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl p-5 text-left space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#A7A7A7]">Order ID</span>
              <span className="text-[#D4A04D] font-mono font-bold">{successDetails.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A7A7A7]">Total Paid</span>
              <span className="text-white font-bold">₹{successDetails.total}</span>
            </div>
            <div className="flex justify-between border-t border-[#2A2A2D] pt-3 flex-col sm:flex-row gap-1">
              <span className="text-[#A7A7A7]">Estimated Delivery</span>
              <span className="text-white font-semibold">{successDetails.estimatedDelivery}</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Link to="/orders" className="flex-1 bg-[#2A2A2D] hover:bg-[#D4A04D] hover:text-black text-white font-bold uppercase py-3 rounded-xl text-center text-sm transition-all">
              View Orders
            </Link>
            <Link to="/products" className="flex-1 bg-[#D4A04D] text-black font-bold uppercase py-3 rounded-xl text-center text-sm hover:opacity-90 transition-opacity">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Cart Empty Check for Checkout
  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6">
        <SEO robots="noindex, nofollow" title="Checkout Unavailable" />
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-xl font-bold text-white mb-2">Checkout is unavailable</h2>
        <p className="text-[#A7A7A7] mb-6">Your shopping cart is currently empty.</p>
        <Link to="/products" className="inline-block bg-[#D4A04D] text-black font-bold uppercase py-3 px-8 rounded-xl text-sm">
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full">
      <SEO robots="noindex, nofollow" title="Secure Checkout" />
      <div className="flex items-center gap-4 mb-8">
        <button 
          type="button"
          onClick={() => navigate(-1)}
          className="bg-[#1A1A1C] border border-[#2A2A2D] hover:border-gray-500 text-white rounded-xl p-2.5 transition-all cursor-pointer flex items-center justify-center"
          title="Go Back"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-white">Checkout</h1>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* Left Columns: Address Form & Payment */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-4 sm:p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#2A2A2D] gap-2 flex-wrap">
              <h2 className="text-white font-bold text-sm sm:text-base uppercase tracking-wider">Shipping Address</h2>
              {user && user.addresses && user.addresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (isNewAddressActive) {
                      // Cancel and select the default or first saved address
                      if (user?.addresses) {
                        const defaultAddr = (user.addresses as any[]).find(addr => addr.isDefault) || user.addresses[0];
                        if (defaultAddr) {
                          setFullName(defaultAddr.fullName || '');
                          setMobile(defaultAddr.mobile || '');
                          setLine1(defaultAddr.line1 || '');
                          setLine2(defaultAddr.line2 || '');
                          setCity(defaultAddr.city || '');
                          setState(defaultAddr.state || '');
                          setPincode(defaultAddr.pincode || '');
                        }
                      }
                      setIsNewAddressActive(false);
                    } else {
                      // Switch to empty form for adding new address
                      setFullName('');
                      setMobile('');
                      setLine1('');
                      setLine2('');
                      setCity('');
                      setState('');
                      setPincode('');
                      setIsNewAddressActive(true);
                    }
                  }}
                  className="text-[#D4A04D] hover:text-[#C8923E] hover:underline font-extrabold text-[10px] sm:text-xs uppercase tracking-wider bg-transparent border-none cursor-pointer p-0 transition-colors"
                >
                  {isNewAddressActive ? '✕ Use Saved Address' : '+ Add New Address'}
                </button>
              )}
            </div>
            
            {user && user.addresses && user.addresses.length > 0 && !isNewAddressActive && (
              <div className="bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl p-3 sm:p-4 mb-2">
                <label className="text-[#D4A04D] text-[10px] font-extrabold uppercase tracking-wider block mb-2.5">
                  📋 Use a Saved Address
                </label>
                <div className="grid sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {user.addresses.map((addr: any) => {
                    const addrId = addr._id || addr.id;
                    const isSelected = 
                      fullName === addr.fullName && 
                      mobile === addr.mobile && 
                      line1 === addr.line1 && 
                      line2 === (addr.line2 || '') && 
                      city === addr.city && 
                      state === addr.state && 
                      pincode === addr.pincode;
                      
                    return (
                      <button
                        key={addrId}
                        type="button"
                        onClick={() => {
                          setFullName(addr.fullName || '');
                          setMobile(addr.mobile || '');
                          setLine1(addr.line1 || '');
                          setLine2(addr.line2 || '');
                          setCity(addr.city || '');
                          setState(addr.state || '');
                          setPincode(addr.pincode || '');
                          setIsNewAddressActive(false);
                        }}
                        className={`text-left p-3 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                          isSelected 
                            ? 'border-[#D4A04D] bg-[#D4A04D]/5 text-white shadow-[0_0_10px_rgba(212,160,77,0.1)]' 
                            : 'border-[#2A2A2D] bg-[#131314] text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-extrabold text-white uppercase text-[8px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                              {addr.type}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[9px] text-[#D4A04D] font-extrabold uppercase">Default</span>
                            )}
                          </div>
                          <div className="font-bold text-white truncate">{addr.fullName}</div>
                          <div className="text-[#A7A7A7] text-[10px] mt-0.5">{addr.mobile}</div>
                          <div className="line-clamp-2 text-gray-400 text-[10px] mt-1.5 leading-relaxed">
                            {addr.line1}, {addr.line2 ? `${addr.line2}, ` : ''}{addr.city}, {addr.state} - {addr.pincode}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {(!user || !user.addresses || user.addresses.length === 0 || isNewAddressActive) && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[#A7A7A7] text-xs uppercase tracking-wide block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#A7A7A7] text-xs uppercase tracking-wide block mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    placeholder="10-digit number"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="text-[#A7A7A7] text-xs uppercase tracking-wide block mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{6}"
                    value={pincode}
                    onChange={e => setPincode(e.target.value)}
                    placeholder="6-digit code"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[#A7A7A7] text-xs uppercase tracking-wide block mb-1">Flat, House no., Building, Apartment *</label>
                  <input
                    type="text"
                    required
                    value={line1}
                    onChange={e => setLine1(e.target.value)}
                    placeholder="Address Line 1"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[#A7A7A7] text-xs uppercase tracking-wide block mb-1">Area, Street, Sector, Village</label>
                  <input
                    type="text"
                    value={line2}
                    onChange={e => setLine2(e.target.value)}
                    placeholder="Address Line 2 (Optional)"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#A7A7A7] text-xs uppercase tracking-wide block mb-1">Town/City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#A7A7A7] text-xs uppercase tracking-wide block mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={e => setState(e.target.value)}
                    placeholder="State"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-4">

          
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-5 sticky top-28 space-y-4">
            <h2 className="text-white font-bold text-base uppercase tracking-wider pb-3 border-b border-[#2A2A2D]">Order Items</h2>
            
            {/* Cart Items Details */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {renderedItems.map(item => {
                const isFreeThisItem = item.uniqueKey === freeItemUniqueKey;

                return (
                  <div key={item.uniqueKey || item.id} className="flex gap-3 text-xs border-b border-[#2A2A2D]/50 pb-3 last:border-b-0 last:pb-0 relative">
                    {item.isPseudo ? (
                      <div className="w-20 h-20 bg-gradient-to-br from-[#1E1911] via-[#16120C] to-[#0E0E0F] border border-[#D4A04D]/35 rounded-none flex flex-col items-center justify-center flex-shrink-0 relative p-1 text-center">
                        <span className="text-[#D4A04D] font-serif font-black tracking-wide text-[8px] leading-none">EYEGLAZE</span>
                        <span className="text-[#A7A7A7] text-[6px] font-bold uppercase tracking-widest mt-0.5">MEMBERSHIP</span>
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-[#1A1A1C] border border-[#2A2A2D] rounded-none flex items-center justify-center flex-shrink-0 relative">
                        {isFreeThisItem && (
                          <div className="absolute top-0 left-0 bg-[#00A86B] text-white font-extrabold text-[7px] uppercase tracking-wider px-1.5 py-0.5 z-10 rounded-br">
                            FREE
                          </div>
                        )}
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <span className="text-xl">👓</span>
                        )}
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="text-white font-bold line-clamp-1">{item.name}</h4>
                      {item.isPseudo ? (
                        <p className="text-[#A7A7A7] text-[10px] mt-0.5">Buy 1 Get 1 Free On Over 5000+ Items</p>
                      ) : (
                        <>
                          <p className="text-[#A7A7A7] text-[10px] mt-0.5">{item.color}</p>
                          {item.lens && <p className="text-[#D4A04D] text-[10px] mt-0.5 line-clamp-1">Lens: {item.lens}</p>}
                          {item.power && (item.power.RE?.sph !== undefined || item.power.LE?.sph !== undefined) && (
                             <p className="text-[#D4A04D]/90 text-[10px] mt-0.5 font-bold">
                               Power: {item.power.RE?.sph !== undefined ? `RE: ${item.power.RE.sph > 0 ? '+' : ''}${item.power.RE.sph}` : ''}
                               {item.power.LE?.sph !== undefined && item.power.LE?.sph !== item.power.RE?.sph ? ` · LE: ${item.power.LE.sph > 0 ? '+' : ''}${item.power.LE.sph}` : ''}
                             </p>
                           )}
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-white font-bold">
                        {item.isPseudo ? (
                          '₹129'
                        ) : isFreeThisItem ? (
                          <>
                            <span className="line-through text-[10px] text-gray-500 mr-1">₹{item.framePriceCalculated + item.lensPrice}</span>
                            <span className="text-green-400">Free</span>
                          </>
                        ) : (
                          `₹${(item.framePriceCalculated + item.lensPrice + item.fittingCharge) * item.qty}`
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>



            {/* Wallet Section */}
            {user && user.walletBalance !== undefined && user.walletBalance > 0 && (
              <div className="border-t border-[#2A2A2D]/60 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useWallet}
                    onChange={(e) => setUseWallet(e.target.checked)}
                    className="accent-[#D4A04D] w-4 h-4"
                  />
                  <div className="flex-1">
                    <span className="text-white font-bold text-xs">Use Wallet Balance</span>
                    <p className="text-[#A7A7A7] text-[10px]">Available: ₹{user.walletBalance}</p>
                  </div>
                  {useWallet && <span className="text-[#D4A04D] font-bold text-xs">-₹{walletAmount}</span>}
                </label>
              </div>
            )}

            {/* Pricing Summary */}
            <div className="space-y-2.5 text-xs pt-4 border-t border-[#2A2A2D]">
              <div className="flex justify-between">
                <span className="text-[#A7A7A7]">Total Item Price</span>
                <span className="text-white">₹{itemsSubtotal}</span>
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
                          <span>Buy 1 Get 1 Discount</span>
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

              {useWallet && walletAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#A7A7A7]">Wallet Deduction</span>
                  <span className="text-[#D4A04D] font-bold">-₹{walletAmount}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold text-sm pt-2.5 border-t border-[#2A2A2D]">
                <span className="text-white">Total Payable</span>
                <span className="text-[#D4A04D] text-base">₹{total}</span>
              </div>
            </div>

            {hasUsedBogoThisMonth && isMember && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-start gap-2.5 text-amber-300 text-xs text-left my-4">
                <div className="text-base mt-0.5">⚠️</div>
                <div>
                  <span className="font-extrabold text-[10px] uppercase tracking-wide block">Monthly BOGO Limit Reached</span>
                  <span className="text-[10px] text-amber-300/80 block mt-0.5 leading-normal">
                    Members are eligible for only one Buy 1 Get 1 free offer per month. Your monthly limit has been reached.
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#D4A04D] text-black font-bold uppercase py-3.5 rounded-xl text-center text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitting ? 'Placing Order...' : 'Place Order ✓'}
            </button>
          </div>
        </div>
      </form>

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

            {/* Auto Apply Action */}
            <button
              type="button"
              onClick={handleAutoApplyBest}
              className="mt-3 w-full bg-[#D4A04D]/10 hover:bg-[#D4A04D]/20 text-[#D4A04D] border border-[#D4A04D]/30 font-extrabold text-[10px] uppercase py-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              ⚡ Auto-Apply Best Coupon
            </button>

            {/* Coupons List */}
            <div className="mt-4 flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[45vh]">
              {activeCoupons.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs">No active coupons available right now</div>
              ) : (
                activeCoupons.map((coupon) => {
                  const currentCartTotal = actualSubtotal + fittingFeeTotal - bogoDiscount;
                  
                  // Calculate BOGO eligibility based on brands, categories, and products
                  const eligibleItemsForCoupon = items.filter(item => {
                    if (coupon.applicableBrands && coupon.applicableBrands.length > 0) {
                      if (!coupon.applicableBrands.includes(item.product?.brand || '')) return false;
                    }
                    if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
                      if (!coupon.applicableCategories.includes(item.product?.category || '')) return false;
                    }
                    if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
                      const pId = item.product?._id || item.product?.id || item._id;
                      if (!coupon.applicableProducts.some((ap: any) => ap.toString() === pId?.toString())) return false;
                    }
                    return true;
                  });
                  const eligibleQty = eligibleItemsForCoupon.reduce((acc, item) => acc + item.qty, 0);
                  
                  const isBogoType = coupon.discountType === 'bogo' || coupon.discountType === 'buy_x_get_y';
                  const requiredBogoQty = (coupon.buyQty || 1) + (coupon.getQty || 1);
                  const isBogoLocked = isBogoType && eligibleQty < requiredBogoQty;
                  
                  const isCartValueLocked = coupon.minOrderValue ? currentCartTotal < coupon.minOrderValue : false;
                  const isLocked = isCartValueLocked || isBogoLocked;
                  
                  return (
                    <div 
                      key={coupon._id} 
                      className={`border border-dashed rounded-xl p-4 flex flex-col relative overflow-hidden bg-[#1A1A1C]/50 ${
                        appliedCoupon === coupon.code 
                          ? 'border-green-500/50 bg-green-500/5' 
                          : isLocked 
                            ? 'border-gray-800 bg-gray-900/10 opacity-70'
                            : 'border-[#D4A04D]/40'
                      }`}
                    >
                      {/* Punch holes for coupon ticket effect */}
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#131314] rounded-full border border-r-[#2A2A2D] z-10" />
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
                          
                          {/* Spin to unlock gamified recommendations */}
                          {isCartValueLocked && (
                            <div className="mt-2.5 text-[9px] text-orange-400 font-extrabold bg-orange-950/20 border border-orange-500/20 px-2 py-1 rounded">
                              🔒 Spend ₹{coupon.minOrderValue! - currentCartTotal} more to unlock this coupon!
                            </div>
                          )}

                          {isBogoLocked && (
                            <div className="mt-2.5 text-[9px] text-[#D4A04D] font-extrabold bg-[#D4A04D]/5 border border-[#D4A04D]/25 px-2 py-1 rounded space-y-1">
                              <div>🎁 Buy One Get One Alert: Add {requiredBogoQty - eligibleQty} more eligible frame(s) to unlock this coupon!</div>
                              <div className="text-[8px] text-gray-400 font-medium">
                                Eligible: {coupon.applicableBrands?.length ? `Brands: ${coupon.applicableBrands.join(', ')}` : ''} 
                                {coupon.applicableCategories?.length ? ` Categories: ${coupon.applicableCategories.join(', ')}` : ' All frames & lenses'}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => handleApplyCoupon(coupon.code)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer flex-shrink-0 ${
                            appliedCoupon === coupon.code
                              ? 'bg-green-500 text-white'
                              : isLocked
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-[#D4A04D] text-black hover:opacity-90 hover:scale-105'
                          }`}
                        >
                          {appliedCoupon === coupon.code ? 'Applied ✓' : isLocked ? 'Locked' : 'Apply'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
