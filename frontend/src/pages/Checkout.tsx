import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import SEO from '../components/SEO';

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
  const delivery = 99;
  const total = subtotal + delivery;

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
          
          {/* Shipping Address */}
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-6 space-y-4">
            <h2 className="text-white font-bold text-base uppercase tracking-wider pb-2 border-b border-[#2A2A2D]">Shipping Address</h2>
            
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

            {/* Pricing Summary */}
            <div className="space-y-2.5 text-xs pt-4 border-t border-[#2A2A2D]">
              <div className="flex justify-between">
                <span className="text-[#A7A7A7]">Items Subtotal</span>
                <span className="text-white">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A7A7A7]">Shipping & Delivery</span>
                <span className="text-white">₹{delivery}</span>
              </div>
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
