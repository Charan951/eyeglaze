import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';

interface CartItem {
  id: string;
  name: string;
  sku: string;
  color: string;
  lens?: string;
  framePrice: number;
  lensPrice: number;
  fittingCharge: number;
  qty: number;
  image?: string;
}

export default function CheckoutPage() {
  const { user } = useAuth();

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
  const [paymentMethod, setPaymentMethod] = useState('cod'); // cod, card, upi

  // Coupon & Discount
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');

  // Wallet
  const [useWallet, setUseWallet] = useState(false);

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
      }
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
        }));
        setItems(mapped);
      })
      .catch((err) => {
        console.error('Failed to load cart for checkout:', err);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const subtotal = items.reduce((s, i) => s + (i.framePrice + i.lensPrice + i.fittingCharge) * i.qty, 0);
  const delivery = user?.membershipActive ? 0 : 99;
  
  // Wallet deduction: up to wallet balance, not more than remaining amount
  let walletAmount = 0;
  if (useWallet && user?.walletBalance) {
    const remainingAfterDiscount = Math.max(0, subtotal + delivery - discount);
    walletAmount = Math.min(user.walletBalance, remainingAfterDiscount);
  }
  
  const total = Math.max(0, subtotal + delivery - discount - walletAmount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await api.post('/cart/apply-coupon', { code: couponCode, cartTotal: subtotal + delivery });
      if (res.data.valid) {
        setDiscount(res.data.discount);
        setCouponApplied(true);
        setCouponMessage(res.data.message);
      } else {
        setCouponMessage(res.data.message);
        setCouponApplied(false);
        setDiscount(0);
      }
    } catch (err) {
      console.error('Failed to apply coupon:', err);
      setCouponMessage('Failed to apply coupon');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !mobile || !line1 || !city || !state || !pincode) {
      alert('Please fill out all required address fields.');
      return;
    }

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
        paymentMethod,
        paymentStatus: 'paid'
      };

      const res = await api.post('/orders', payload);
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
    <div className="max-w-6xl mx-auto px-4 md:px-0">
      <SEO robots="noindex, nofollow" title="Secure Checkout" />
      <h1 className="text-2xl font-bold text-white mb-8">Checkout</h1>

      <form onSubmit={handlePlaceOrder} className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Columns: Address Form & Payment */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-6 space-y-4">
            <h2 className="text-white font-bold text-base uppercase tracking-wider pb-2 border-b border-[#2A2A2D]">Shipping Address</h2>
            
            {user && user.addresses && user.addresses.length > 0 && (
              <div className="bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl p-4 mb-2">
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

                  {/* New Address Card Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setFullName('');
                      setMobile('');
                      setLine1('');
                      setLine2('');
                      setCity('');
                      setState('');
                      setPincode('');
                    }}
                    className={`text-left p-3 rounded-xl border text-xs transition-all flex flex-col justify-center items-center h-full min-h-[96px] ${
                      !user.addresses.some((addr: any) => 
                        fullName === addr.fullName && 
                        mobile === addr.mobile && 
                        line1 === addr.line1 && 
                        line2 === (addr.line2 || '') && 
                        city === addr.city && 
                        state === addr.state && 
                        pincode === addr.pincode
                      )
                        ? 'border-[#D4A04D] bg-[#D4A04D]/5 text-[#D4A04D] shadow-[0_0_10px_rgba(212,160,77,0.1)]' 
                        : 'border-[#2A2A2D] bg-[#131314] text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <span className="text-lg mb-1">➕</span>
                    <span className="font-bold text-[10px] uppercase tracking-wider text-center">New Address</span>
                  </button>
                </div>
              </div>
            )}

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
          </div>

          {/* Payment Method */}
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-6 space-y-4">
            <h2 className="text-white font-bold text-base uppercase tracking-wider pb-2 border-b border-[#2A2A2D]">Payment Method</h2>
            
            <div className="space-y-3">
              {[
                { id: 'cod', title: 'Cash on Delivery (COD)', desc: 'Pay with cash upon package arrival' },
                { id: 'card', title: 'Credit / Debit Card', desc: 'Secure payment via Visa, Mastercard, RuPay' },
                { id: 'upi', title: 'UPI / NetBanking', desc: 'Instant transfer via GooglePay, PhonePe, Paytm' }
              ].map((method) => {
                const isChecked = paymentMethod === method.id;
                return (
                  <label
                    key={method.id}
                    className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer hover:border-[#D4A04D]/60 transition-colors ${
                      isChecked ? 'border-[#D4A04D] bg-[#131314]' : 'border-[#2A2A2D]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={isChecked}
                      onChange={() => setPaymentMethod(method.id)}
                      className="accent-[#D4A04D] mt-1"
                    />
                    <div>
                      <span className="text-white font-bold text-sm block">{method.title}</span>
                      <span className="text-[#A7A7A7] text-xs block mt-0.5">{method.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-4">
          {/* Membership Banner */}
          {!user?.membershipActive && (
            <div className="bg-gradient-to-r from-[#1E1911] to-[#0E0E0F] border border-[#D4A04D]/30 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border border-[#D4A04D]/40 rounded-lg flex items-center justify-center text-[#D4A04D] font-extrabold text-sm flex-shrink-0 bg-[#0E0E0F]">
                  EG
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[#D4A04D] text-[10px] font-black uppercase tracking-widest">EYEGLAZE MEMBERSHIP</span>
                  <span className="text-white text-xs font-bold mt-1">Join & get exclusive benefits</span>
                  <span className="text-gray-500 text-[9px] mt-0.5">Free delivery, extended warranty & more! · ₹129 / year</span>
                </div>
              </div>
              <Link
                to="/membership"
                className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-[10px] uppercase px-4 py-2.5 rounded-lg transition-colors cursor-pointer border-none shrink-0"
              >
                Join Now
              </Link>
            </div>
          )}
          
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-5 sticky top-28 space-y-4">
            <h2 className="text-white font-bold text-base uppercase tracking-wider pb-3 border-b border-[#2A2A2D]">Order Items</h2>
            
            {/* Cart Items Details */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 text-xs border-b border-[#2A2A2D]/50 pb-3 last:border-b-0 last:pb-0">
                  <div className="w-12 h-12 bg-[#222] border border-[#2A2A2D] rounded flex items-center justify-center flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">👓</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-bold line-clamp-1">{item.name}</h4>
                    <p className="text-[#A7A7A7] text-[10px] mt-0.5">{item.color} · Qty: {item.qty}</p>
                    {item.lens && <p className="text-[#D4A04D] text-[10px] mt-0.5 line-clamp-1">Lens: {item.lens}</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-white font-bold">₹{(item.framePrice + item.lensPrice + item.fittingCharge) * item.qty}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Section */}
            <div className="border-t border-[#2A2A2D]/60 pt-4">
              <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Apply Coupon</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter coupon code"
                  className="flex-1 bg-[#0B0B0C] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#D4A04D]"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="bg-[#1C1C1E] border border-[#2A2A2D] hover:border-[#D4A04D] text-white font-bold text-xs uppercase px-4 py-2 rounded-lg transition-colors"
                >
                  Apply
                </button>
              </div>
              {couponMessage && (
                <p className={`text-[10px] mt-2 ${couponApplied ? 'text-green-400' : 'text-red-400'}`}>{couponMessage}</p>
              )}
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
                <span className="text-[#A7A7A7]">Items Subtotal</span>
                <span className="text-white">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A7A7A7]">Shipping & Delivery</span>
                <span className="text-white">{delivery === 0 ? <span className="text-green-400 font-bold">FREE</span> : `₹${delivery}`}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#A7A7A7]">Discount</span>
                  <span className="text-green-400 font-bold">-₹{discount}</span>
                </div>
              )}
              {useWallet && walletAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#A7A7A7]">Wallet Deduction</span>
                  <span className="text-[#D4A04D] font-bold">-₹{walletAmount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-2.5 border-t border-[#2A2A2D]">
                <span className="text-white">Total Amount</span>
                <span className="text-[#D4A04D] text-base">₹{total}</span>
              </div>
            </div>

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
    </div>
  );
}
