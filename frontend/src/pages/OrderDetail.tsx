import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatusBadge from '../components/ui/StatusBadge';
import api from '../lib/api';
import SEO from '../components/SEO';

interface IOrderItem {
  product: {
    _id: string;
    name: string;
    images?: string[];
    sku: string;
  };
  sku?: string;
  qty: number;
  color?: string;
  lensType?: string;
  lensSubType?: string;
  power?: {
    RE?: { sph?: number; cyl?: number; axis?: number };
    LE?: { sph?: number; cyl?: number; axis?: number };
    pd?: number;
    addition?: number;
  };
  lensQuality?: string;
  lensPrice?: number;
  framePrice: number;
  fittingCharge: number;
}

interface IOrder {
  _id: string;
  orderNumber: string;
  orderId: string;
  createdAt: string;
  status: string;
  items: IOrderItem[];
  address: {
    fullName: string;
    mobile: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  subtotal: number;
  deliveryCharge: number;
  fittingCharge: number;
  discount: number;
  total: number;
  paymentMethod?: string;
  paymentStatus: string;
  estimatedDelivery?: string;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError('');

    api.get(`/orders/${id}`)
      .then(res => {
        if (active) setOrder(res.data.order);
      })
      .catch((err) => {
        console.error('Failed to fetch order details:', err);
        if (active) setError('Failed to load order details. Please make sure the order exists.');
      })
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [id]);

  if (loading) {
    return <div className="text-center py-24 text-[#A7A7A7]">Loading Order Details...</div>;
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6">
        <SEO robots="noindex, nofollow" title="Order Error" />
        <div className="text-red-400 text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-2">Error</h2>
        <p className="text-[#A7A7A7] mb-6">{error || 'Could not load page'}</p>
        <Link to="/orders" className="inline-block bg-[#D4A04D] text-black font-bold uppercase py-2.5 px-6 rounded-xl text-sm">
          Go Back
        </Link>
      </div>
    );
  }

  const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const estDeliveryStr = order.estimatedDelivery 
    ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  // Order timeline steps status indices
  const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentStatusIndex = statusSteps.indexOf(order.status.toLowerCase());

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-0 space-y-6">
      <SEO robots="noindex, nofollow" title={`Order ${order.orderId}`} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/orders" className="text-[#D4A04D] text-sm hover:underline">← Back to My Orders</Link>
          <h1 className="text-2xl font-bold text-white mt-2">Order {order.orderId}</h1>
          <p className="text-[#A7A7A7] text-xs mt-1">Placed on {dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <span className="text-white font-bold text-lg">₹{order.total}</span>
        </div>
      </div>

      {/* Tracker Timeline */}
      <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6">
        <h3 className="text-white font-bold text-sm mb-6 uppercase tracking-wider">Order Timeline</h3>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-2">
          {statusSteps.map((step, idx) => {
            const isCompleted = idx <= currentStatusIndex;
            const isActive = idx === currentStatusIndex;
            return (
              <div key={step} className="flex flex-row md:flex-col items-center flex-1 w-full relative">
                {/* Step Circle */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-colors ${
                  isCompleted ? 'bg-[#D4A04D] text-black font-extrabold' : 'bg-[#2A2A2D] text-[#A7A7A7]'
                } ${isActive ? 'ring-4 ring-[#D4A04D]/20' : ''}`}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                
                {/* Text Label */}
                <span className={`text-xs ml-3 md:ml-0 md:mt-2 font-medium capitalize ${
                  isCompleted ? 'text-white' : 'text-[#A7A7A7]'
                }`}>{step}</span>

                {/* Connection line */}
                {idx < statusSteps.length - 1 && (
                  <>
                    {/* Desktop horizontal line */}
                    <div className={`hidden md:block absolute left-[calc(50%+16px)] right-[calc(-50%+16px)] h-0.5 top-[15px] -z-0 transition-colors ${
                      idx < currentStatusIndex ? 'bg-[#D4A04D]' : 'bg-[#2A2A2D]'
                    }`} />
                    {/* Mobile vertical line */}
                    <div className={`md:hidden absolute left-[15px] top-[32px] bottom-[-16px] w-[2px] -z-0 transition-colors ${
                      idx < currentStatusIndex ? 'bg-[#D4A04D]' : 'bg-[#2A2A2D]'
                    }`} />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Details (Address, Payment) vs Summary */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Columns */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Shipping Address & Payment Info */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Address */}
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-5 space-y-3">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider border-b border-[#2A2A2D] pb-2">Shipping Address</h3>
              <div className="text-sm space-y-1">
                <p className="text-white font-bold">{order.address.fullName}</p>
                <p className="text-[#A7A7A7]">{order.address.line1}</p>
                {order.address.line2 && <p className="text-[#A7A7A7]">{order.address.line2}</p>}
                <p className="text-[#A7A7A7]">{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                <p className="text-[#D4A04D] font-medium pt-1">Phone: {order.address.mobile}</p>
              </div>
            </div>

            {/* Payment & Delivery */}
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-5 space-y-3">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider border-b border-[#2A2A2D] pb-2">Payment & Shipping</h3>
              <div className="text-sm space-y-2">
                <div>
                  <span className="text-[#A7A7A7] block text-xs uppercase tracking-wide">Method</span>
                  <span className="text-white font-semibold capitalize">{order.paymentMethod || 'Cash on Delivery'}</span>
                </div>
                <div>
                  <span className="text-[#A7A7A7] block text-xs uppercase tracking-wide">Status</span>
                  <span className={`font-semibold capitalize ${order.paymentStatus === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {order.paymentStatus}
                  </span>
                </div>
                {estDeliveryStr && order.status.toLowerCase() !== 'delivered' && (
                  <div>
                    <span className="text-[#A7A7A7] block text-xs uppercase tracking-wide">Est. Delivery</span>
                    <span className="text-white font-semibold">{estDeliveryStr}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Itemized list of products */}
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 space-y-6">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider border-b border-[#2A2A2D] pb-3">Order Items</h3>
            
            <div className="space-y-6">
              {order.items.map((item, idx) => {
                const totalItemPrice = (item.framePrice + (item.lensPrice || 0) + item.fittingCharge) * item.qty;
                const hasPower = item.power && (item.power.RE || item.power.LE);
                const isManualPower = hasPower && !((item.power as any).uploadLater);

                return (
                  <div key={idx} className="border-b border-[#2A2A2D]/50 pb-6 last:border-b-0 last:pb-0 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Frame image */}
                      <div className="w-20 h-20 bg-[#222] border border-[#2A2A2D] rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
                        {item.product?.images?.[0] ? (
                          <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl">👓</span>
                        )}
                      </div>

                      {/* Main details */}
                      <div className="flex-1 text-center sm:text-left">
                        <h4 className="text-white font-bold text-sm">{item.product?.name || 'Eyeglass Frame'}</h4>
                        <p className="text-[#A7A7A7] text-xs mt-0.5">{item.product?.sku || item.sku} · Color: <span className="text-white font-medium">{item.color || 'Default'}</span></p>
                        
                        {/* Lens Configuration details */}
                        {item.lensType && (
                          <div className="mt-2 bg-[#0B0B0C] border border-[#2A2A2D] rounded-lg p-3 space-y-1.5 text-xs text-[#A7A7A7] text-left">
                            <p className="text-white font-bold text-[10px] uppercase tracking-wider">Custom Lens Configured</p>
                            <div>
                              <span>Type: </span>
                              <span className="text-white font-medium capitalize">{item.lensType.replace('_', ' ')}</span>
                              {item.lensSubType && <span className="text-white font-medium capitalize"> ({item.lensSubType.replace('_', ' ')})</span>}
                            </div>
                            <div>
                              <span>Quality: </span>
                              <span className="text-white font-medium">{item.lensQuality}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Pricing column */}
                      <div className="text-center sm:text-right whitespace-nowrap pt-2 sm:pt-0 border-t border-[#2A2A2D]/20 sm:border-none">
                        <span className="text-[#D4A04D] font-bold text-sm block">₹{totalItemPrice}</span>
                        <span className="text-[#A7A7A7] text-xs block mt-1">Qty: {item.qty}</span>
                      </div>
                    </div>

                    {/* Prescription Power table (shown only if manual power is entered for the item) */}
                    {isManualPower && item.power && (
                      <div className="bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl p-4 space-y-3">
                        <h5 className="text-white font-bold text-xs uppercase tracking-wider">Prescription Details</h5>
                        
                        {/* Mobile View: R/L Cards */}
                        <div className="space-y-3 sm:hidden">
                          {/* Right Eye (RE) */}
                          <div className="bg-[#131314] border border-[#2A2A2D]/40 rounded-lg p-3 space-y-2">
                            <div className="text-[#D4A04D] font-bold text-xs">Right Eye (RE)</div>
                            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                              <div>
                                <span className="text-gray-500 block mb-0.5 uppercase tracking-wide">SPH</span>
                                <span className="text-white font-bold">{item.power.RE?.sph?.toFixed(2) || '0.00'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block mb-0.5 uppercase tracking-wide">CYL</span>
                                <span className="text-white font-bold">{item.power.RE?.cyl?.toFixed(2) || '0.00'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block mb-0.5 uppercase tracking-wide">AXIS</span>
                                <span className="text-white font-mono">{item.power.RE?.axis || '—'}</span>
                              </div>
                            </div>
                            {item.lensType?.toLowerCase().includes('progressive') && (
                              <div className="text-[10px] pt-1.5 border-t border-[#2A2A2D]/30 flex justify-between">
                                <span className="text-gray-500 uppercase tracking-wide">Addition (ADD)</span>
                                <span className="text-white font-bold">+{item.power.addition?.toFixed(2) || '1.00'}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Left Eye (LE) */}
                          <div className="bg-[#131314] border border-[#2A2A2D]/40 rounded-lg p-3 space-y-2">
                            <div className="text-[#D4A04D] font-bold text-xs">Left Eye (LE)</div>
                            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                              <div>
                                <span className="text-gray-500 block mb-0.5 uppercase tracking-wide">SPH</span>
                                <span className="text-white font-bold">{item.power.LE?.sph?.toFixed(2) || '0.00'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block mb-0.5 uppercase tracking-wide">CYL</span>
                                <span className="text-white font-bold">{item.power.LE?.cyl?.toFixed(2) || '0.00'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block mb-0.5 uppercase tracking-wide">AXIS</span>
                                <span className="text-white font-mono">{item.power.LE?.axis || '—'}</span>
                              </div>
                            </div>
                            {item.lensType?.toLowerCase().includes('progressive') && (
                              <div className="text-[10px] pt-1.5 border-t border-[#2A2A2D]/30 flex justify-between">
                                <span className="text-gray-500 uppercase tracking-wide">Addition (ADD)</span>
                                <span className="text-white font-bold">+{item.power.addition?.toFixed(2) || '1.00'}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Desktop View: Table */}
                        <div className="hidden sm:block overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-[#A7A7A7] border-b border-[#2A2A2D] uppercase tracking-wide text-[10px]">
                                <th className="pb-2">Eye</th>
                                <th className="pb-2">Spherical (SPH)</th>
                                <th className="pb-2">Cylindrical (CYL)</th>
                                <th className="pb-2">Axis</th>
                                {item.lensType?.toLowerCase().includes('progressive') && <th className="pb-2">Addition (ADD)</th>}
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-[#2D2D30]/30 text-white">
                                <td className="py-2 font-semibold text-[#A7A7A7]">Right (RE)</td>
                                <td className="py-2">{item.power.RE?.sph?.toFixed(2) || '0.00'}</td>
                                <td className="py-2">{item.power.RE?.cyl?.toFixed(2) || '0.00'}</td>
                                <td className="py-2">{item.power.RE?.axis || '—'}</td>
                                {item.lensType?.toLowerCase().includes('progressive') && <td className="py-2">+{item.power.addition?.toFixed(2) || '1.00'}</td>}
                              </tr>
                              <tr className="text-white">
                                <td className="py-2 font-semibold text-[#A7A7A7]">Left (LE)</td>
                                <td className="py-2">{item.power.LE?.sph?.toFixed(2) || '0.00'}</td>
                                <td className="py-2">{item.power.LE?.cyl?.toFixed(2) || '0.00'}</td>
                                <td className="py-2">{item.power.LE?.axis || '—'}</td>
                                {item.lensType?.toLowerCase().includes('progressive') && <td className="py-2">+{item.power.addition?.toFixed(2) || '1.00'}</td>}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        {item.power.pd && (
                          <div className="text-[#A7A7A7] text-xs pt-2 border-t border-[#2D2D30]/30">
                            Pupillary Distance (PD): <span className="text-white font-medium">{item.power.pd}mm</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Prescription uploaded later message */}
                    {hasPower && !isManualPower && (
                      <div className="bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl p-3 text-xs text-[#D4A04D]">
                        Prescription method: <span className="font-semibold text-white">WhatsApp / Upload Later</span>. Details will be verified before glazing.
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Cost Summary */}
        <div className="space-y-4">
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-5 sticky top-28 space-y-4">
            <h2 className="text-white font-bold text-base uppercase tracking-wider pb-3 border-b border-[#2A2A2D]">Payment Details</h2>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#A7A7A7]">Items Subtotal</span>
                <span className="text-white">₹{order.subtotal}</span>
              </div>
              {order.fittingCharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#A7A7A7]">Fitting & Glazing</span>
                  <span className="text-white">₹{order.fittingCharge}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#A7A7A7]">Delivery Charge</span>
                <span className="text-white">₹{order.deliveryCharge}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Coupon Discount</span>
                  <span>-₹{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-2.5 border-t border-[#2A2A2D]">
                <span className="text-white">Total Paid</span>
                <span className="text-[#D4A04D] text-base">₹{order.total}</span>
              </div>
            </div>

            <div className="pt-2 text-center text-[#A7A7A7] text-[10px] uppercase tracking-wide leading-relaxed">
              EyeGlaze Guarantee · 1 Year Warranty · Certified Lenses
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
