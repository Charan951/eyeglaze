import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import StatusBadge from '../../components/ui/StatusBadge';
import api from '../../lib/api';
import { socket } from '../../lib/socket';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:border-yellow-400',
  confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:border-blue-400',
  processing: 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:border-purple-400',
  shipped: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:border-cyan-400',
  delivered: 'bg-green-500/10 text-green-400 border-green-500/30 hover:border-green-400',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/30 hover:border-red-400',
  returned: 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:border-orange-400',
};

interface OrderItem {
  _id: string;
  orderId?: string;
  orderNumber?: string;
  user?: { name?: string; email?: string; mobile?: string; phone?: string } | null;
  createdAt: string;
  items?: unknown[];
  total: number;
  status: string;
}

export default function AdminOrdersPage() {
  const location = useLocation();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Order Detail States (Full Page)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Wallet Refund States
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundDescription, setRefundDescription] = useState<string>('');

  useEffect(() => {
    if (selectedOrder) {
      setSelectedStatus(selectedOrder.status);
      setRefundAmount(selectedOrder.total.toString());
      setRefundDescription(`Refund for cancelled order ${selectedOrder.orderId || selectedOrder.orderNumber}`);
    } else {
      setSelectedStatus('');
      setRefundAmount('');
      setRefundDescription('');
    }
  }, [selectedOrder]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await api.get(`/admin/orders${params}`);
      setOrders(res.data.orders || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

  // Real-time socket updates for orders
  useEffect(() => {
    socket.on('order_changed', fetchOrders);
    return () => {
      socket.off('order_changed', fetchOrders);
    };
  }, [fetchOrders]);

  // Listen for autoSelectOrderId passed from navigation state (e.g. from Users page)
  useEffect(() => {
    if (location.state?.autoSelectOrderId) {
      const orderId = location.state.autoSelectOrderId;
      setDetailsLoading(true);
      api.get(`/admin/orders/${orderId}`)
        .then(res => {
          setSelectedOrder(res.data.order);
        })
        .catch(err => {
          console.error('Failed to load auto-selected order details:', err);
        })
        .finally(() => {
          setDetailsLoading(false);
        });
    }
  }, [location.state]);

  const updateStatus = async (order: OrderItem, newStatus: string) => {
    const id = order.orderId || order.orderNumber || order._id;
    setSavingId(order._id);
    let walletAmountToAdd = 0;
    let walletRefundDescription = '';

    if (newStatus === 'cancelled') {
      const confirmCancel = window.confirm("Are you sure you want to cancel this order?");
      if (!confirmCancel) {
        setSavingId(null);
        setUpdating(null);
        return;
      }
      const refundInput = window.prompt(`Order cancelled! Enter amount to refund/add to user's wallet:`, order.total.toString());
      if (refundInput !== null) {
        const amount = parseFloat(refundInput);
        if (!isNaN(amount) && amount >= 0) {
          walletAmountToAdd = amount;
          walletRefundDescription = `Refund for cancelled order ${order.orderId || order.orderNumber || order._id}`;
        } else {
          alert('Invalid amount. No refund will be credited.');
        }
      }
    }

    try {
      const res = await api.put(`/admin/orders/${id}`, {
        status: newStatus,
        walletAmountToAdd,
        walletRefundDescription,
      });
      setOrders(prev => prev.map(o => o._id === order._id ? { ...o, status: newStatus } : o));
      // Refresh sub-page details too if it is currently open
      if (selectedOrder && (selectedOrder.orderId === id || selectedOrder.orderNumber === id || selectedOrder._id === order._id)) {
        setSelectedOrder(res.data.order);
      }
      if (newStatus === 'cancelled' && walletAmountToAdd > 0) {
        alert(`Wallet successfully credited with ₹${walletAmountToAdd}.`);
      }
    } catch (err: any) {
      console.error('Failed to update status:', err);
      alert(err.response?.data?.error || 'Failed to update status.');
    } finally {
      setSavingId(null);
      setUpdating(null);
    }
  };

  const handleDetailUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    const id = selectedOrder.orderId || selectedOrder.orderNumber || selectedOrder._id;
    setSavingId(selectedOrder._id);
    try {
      const res = await api.put(`/admin/orders/${id}`, { status: newStatus });
      setSelectedOrder(res.data.order);
      setOrders(prev => prev.map(o => o._id === selectedOrder._id ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status.');
    } finally {
      setSavingId(null);
    }
  };

  const handleRefundAndCancel = async () => {
    if (!selectedOrder) return;
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid amount.');
      return;
    }
    const id = selectedOrder.orderId || selectedOrder.orderNumber || selectedOrder._id;
    setSavingId(selectedOrder._id);
    const targetStatus = selectedStatus;
    try {
      const res = await api.put(`/admin/orders/${id}`, {
        status: targetStatus,
        walletAmountToAdd: amount,
        walletRefundDescription: refundDescription,
      });
      setSelectedOrder(res.data.order);
      setOrders(prev => prev.map(o => o._id === selectedOrder._id ? { ...o, status: targetStatus } : o));
      if (amount > 0) {
        alert(`Wallet successfully credited with ₹${amount}.`);
      } else {
        alert(`Status updated successfully.`);
      }
    } catch (err: any) {
      console.error('Failed to update:', err);
      alert(err.response?.data?.error || 'Failed to update order.');
    } finally {
      setSavingId(null);
    }
  };

  const handleOrderClick = async (order: OrderItem) => {
    const id = order.orderId || order.orderNumber || order._id;
    setDetailsLoading(true);
    try {
      const res = await api.get(`/admin/orders/${id}`);
      setSelectedOrder(res.data.order);
    } catch (err) {
      console.error('Failed to load order details:', err);
      alert('Failed to load order details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const customerName = (order: OrderItem) =>
    order.user?.name || order.user?.email || order.user?.mobile || order.user?.phone || 'Unknown';

  // Full Page Details Loading State
  if (detailsLoading) {
    return (
      <div className="space-y-6 select-none animate-fadeIn text-left">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedOrder(null);
            }}
            className="px-4 py-2 rounded-xl bg-[#1C1C1E] border border-[#2A2A2D] text-white hover:bg-[#2A2A2D] transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            ← Back to Orders
          </button>
        </div>
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-20 text-center text-[#A7A7A7] text-xs font-bold uppercase tracking-widest">
          Loading Order Details...
        </div>
      </div>
    );
  }

  // Full Page Order Details View
  if (selectedOrder) {
    return (
      <div className="space-y-6 select-none animate-fadeIn text-left">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedOrder(null);
            }}
            className="px-4 py-2 rounded-xl bg-[#1C1C1E] border border-[#2A2A2D] text-white hover:bg-[#2A2A2D] transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            ← Back to Orders
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Order Info, Items & Prescription */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Status & Courier Info Card */}
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-2xl space-y-4">
              <h3 className="text-white font-extrabold text-xs uppercase tracking-wider text-[#D4A04D] border-b border-[#2A2A2D] pb-3">
                Order status & information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                <div>
                  <span className="text-[#A7A7A7] block font-bold text-[10px] uppercase tracking-wider">Order ID</span>
                  <span className="text-white block mt-1 font-mono font-bold text-sm">{selectedOrder.orderId || selectedOrder.orderNumber}</span>
                  <span className="text-gray-500 block mt-0.5">Placed: {new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-[#A7A7A7] block font-bold text-[10px] uppercase tracking-wider">Current Status</span>
                  <div className="mt-2">
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                  <span className="text-gray-500 block mt-2">Payment: <strong className="text-green-400 font-extrabold uppercase">{selectedOrder.paymentStatus}</strong> ({selectedOrder.paymentMethod || 'COD/UPI'})</span>
                </div>
                <div>
                  <span className="text-[#A7A7A7] block font-bold text-[10px] uppercase tracking-wider">Courier & Tracking</span>
                  <span className="text-white block mt-1 font-medium text-sm">{selectedOrder.courierPartner || 'Not assigned yet'}</span>
                  {selectedOrder.trackingNumber && (
                    <span className="text-gray-500 block mt-0.5">Track ID: <strong className="text-white">{selectedOrder.trackingNumber}</strong></span>
                  )}
                </div>
              </div>
            </div>

            {/* Items Details */}
            <div className="space-y-4">
              <h3 className="text-white font-extrabold text-xs uppercase tracking-wider text-[#D4A04D] text-left">
                Items Details
              </h3>
              <div className="space-y-4">
                {selectedOrder.items && selectedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 space-y-4 shadow-2xl">
                    
                    {/* Item header */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="text-left">
                        <div className="text-white font-extrabold text-sm">
                          {item.product?.name || 'Frame'}
                        </div>
                        {item.product?.sku && (
                          <div className="text-[#A7A7A7] text-[10px] uppercase font-mono mt-0.5">SKU: {item.product.sku}</div>
                        )}
                      </div>
                      <div className="text-[#D4A04D] font-extrabold text-sm">₹{item.framePrice}</div>
                    </div>

                    {/* Specifications */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3.5 border-t border-[#2A2A2D]/40 text-xs text-left">
                      <div>
                        <span className="text-[#A7A7A7] block text-[9px] font-bold uppercase tracking-wider">Frame Size</span>
                        <span className="text-white block mt-0.5 font-medium">{item.frameSize || 'Medium'}</span>
                      </div>
                      <div>
                        <span className="text-[#A7A7A7] block text-[9px] font-bold uppercase tracking-wider">Frame Color</span>
                        <span className="text-white block mt-0.5 font-medium">{item.color || 'Standard'}</span>
                      </div>
                      {item.lensType && (
                        <>
                          <div>
                            <span className="text-[#A7A7A7] block text-[9px] font-bold uppercase tracking-wider">Lens Selection</span>
                            <span className="text-white block mt-0.5 font-medium">{item.lensType} ({item.lensSubType || 'Single Vision'})</span>
                          </div>
                          <div>
                            <span className="text-[#A7A7A7] block text-[9px] font-bold uppercase tracking-wider">Lens Quality</span>
                            <span className="text-white block mt-0.5 font-medium">{item.lensQuality || 'Standard'} - ₹{item.lensPrice || 0}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Prescription Details (if present) */}
                    {item.power && (item.power.RE || item.power.LE) && (
                      <div className="bg-[#18181A] border border-[#2A2A2D]/40 rounded-xl p-4 space-y-2">
                        <span className="text-white text-[10px] font-extrabold uppercase tracking-wider block text-left">Prescription Power</span>
                        <table className="w-full text-left text-xs text-[#A7A7A7]">
                          <thead>
                            <tr className="border-b border-[#2A2A2D]/60 text-white font-extrabold uppercase text-[10px]">
                              <th className="py-1.5">Eye</th>
                              <th className="py-1.5">SPH</th>
                              <th className="py-1.5">CYL</th>
                              <th className="py-1.5">Axis</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.power.RE && (
                              <tr className="border-b border-[#2A2A2D]/20">
                                <td className="py-2 text-white font-bold">Right Eye (RE)</td>
                                <td className="py-2">{item.power.RE.sph ?? '0.00'}</td>
                                <td className="py-2">{item.power.RE.cyl ?? '0.00'}</td>
                                <td className="py-2">{item.power.RE.axis ?? '—'}</td>
                              </tr>
                            )}
                            {item.power.LE && (
                              <tr>
                                <td className="py-2 text-white font-bold">Left Eye (LE)</td>
                                <td className="py-2">{item.power.LE.sph ?? '0.00'}</td>
                                <td className="py-2">{item.power.LE.cyl ?? '0.00'}</td>
                                <td className="py-2">{item.power.LE.axis ?? '—'}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                        {item.power.pd && (
                          <div className="text-[10px] text-[#A7A7A7] pt-2 border-t border-[#2A2A2D]/10">
                            Pupillary Distance (PD): <strong className="text-white">{item.power.pd} mm</strong>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Column 3: Shipping, Bill Summary & Update Status */}
          <div className="space-y-6">
            
            {/* Customer Details */}
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-2xl space-y-4">
              <h3 className="text-white font-extrabold text-xs uppercase tracking-wider text-[#D4A04D] border-b border-[#2A2A2D] pb-3">
                Customer Details
              </h3>
              <div className="text-xs text-left text-white space-y-3">
                <div>
                  <span className="text-[#A7A7A7] block font-bold text-[10px] uppercase tracking-wider">Account</span>
                  <span className="text-white block mt-1 font-bold">{selectedOrder.user?.name || 'Guest User'}</span>
                  <span className="text-gray-500 block mt-0.5">{selectedOrder.user?.email || '—'}</span>
                </div>
                {selectedOrder.user?.phone && (
                  <div>
                    <span className="text-[#A7A7A7] block font-bold text-[10px] uppercase tracking-wider">Contact</span>
                    <span className="text-white block mt-1 font-medium">{selectedOrder.user.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-2xl space-y-4">
              <h3 className="text-white font-extrabold text-xs uppercase tracking-wider text-[#D4A04D] border-b border-[#2A2A2D] pb-3">
                Shipping Address
              </h3>
              {selectedOrder.address ? (
                <div className="text-xs text-white space-y-1 text-left">
                  <div className="font-bold text-sm">{selectedOrder.address.fullName}</div>
                  <div className="text-[#A7A7A7] text-[11px]">Phone: {selectedOrder.address.mobile}</div>
                  <div className="text-[#A7A7A7] text-[11px] mt-2">{selectedOrder.address.line1}</div>
                  {selectedOrder.address.line2 && <div className="text-[#A7A7A7] text-[11px]">{selectedOrder.address.line2}</div>}
                  <div className="text-[#A7A7A7] text-[11px]">{selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.pincode}</div>
                </div>
              ) : (
                <div className="text-xs text-[#A7A7A7]">No shipping address found.</div>
              )}
            </div>

            {/* Price Breakout */}
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-2xl space-y-4">
              <h3 className="text-white font-extrabold text-xs uppercase tracking-wider text-[#D4A04D] border-b border-[#2A2A2D] pb-3">
                Bill Details
              </h3>
              <div className="text-xs text-[#A7A7A7] space-y-2 font-medium">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white font-bold">₹{selectedOrder.subtotal}</span>
                </div>
                {selectedOrder.fittingCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Fitting Charge</span>
                    <span className="text-white font-bold">₹{selectedOrder.fittingCharge}</span>
                  </div>
                )}
                {selectedOrder.deliveryCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    <span className="text-white font-bold">₹{selectedOrder.deliveryCharge}</span>
                  </div>
                )}
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount Applied</span>
                    <span className="font-bold">-₹{selectedOrder.discount}</span>
                  </div>
                )}
                {selectedOrder.walletUsed > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Wallet Balance Used</span>
                    <span className="font-bold">-₹{selectedOrder.walletUsed}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-[#2A2A2D]/40 text-sm font-extrabold text-white">
                  <span>Total Payable</span>
                  <span className="text-[#D4A04D]">₹{selectedOrder.total}</span>
                </div>
              </div>
            </div>

            {/* Update Status Card */}
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-2xl space-y-4">
              <h3 className="text-white font-extrabold text-xs uppercase tracking-wider text-[#D4A04D] border-b border-[#2A2A2D] pb-3">
                Update Order Status
              </h3>
              <div className="space-y-3">
                <span className="text-[#A7A7A7] block font-bold text-[10px] uppercase tracking-wider">Select New Status</span>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      const nextStatus = e.target.value;
                      setSelectedStatus(nextStatus);
                      if (nextStatus !== 'cancelled') {
                        handleDetailUpdateStatus(nextStatus);
                      }
                    }}
                    disabled={savingId === selectedOrder._id}
                    className={`w-full px-4.5 py-3 rounded-xl text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#D4A04D]/35 border cursor-pointer transition-all ${
                      STATUS_COLORS[selectedStatus] || 'bg-[#1C1C1E] text-white border-[#2A2A2D]'
                    }`}
                  >
                    {ORDER_STATUSES.map(s => (
                      <option key={s} value={s} className="bg-[#131314] text-white font-bold text-xs uppercase tracking-wide">
                        {s}
                      </option>
                    ))}
                  </select>
                  {savingId === selectedOrder._id && selectedStatus !== 'cancelled' && (
                    <span className="text-[#D4A04D] text-[10px] font-bold uppercase animate-pulse shrink-0">Saving...</span>
                  )}
                </div>
              </div>

              {selectedStatus === 'cancelled' && (
                <div className="space-y-4 pt-4 border-t border-[#2A2A2D]/40 text-left animate-fadeIn">
                  <div className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider flex justify-between items-center bg-[#18181A] p-2.5 rounded-lg border border-[#2A2A2D]/40">
                    <span>User's Wallet Balance:</span>
                    <span className="text-green-400 font-extrabold text-xs">₹{selectedOrder.user?.walletBalance ?? 0}</span>
                  </div>
                  <div>
                    <label className="text-[#A7A7A7] block font-bold text-[10px] uppercase tracking-wider mb-1.5">
                      Amount to Add / Refund (₹)
                    </label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#1C1C1E] border border-[#2A2A2D] text-white rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#D4A04D]"
                    />
                  </div>
                  <div>
                    <label className="text-[#A7A7A7] block font-bold text-[10px] uppercase tracking-wider mb-1.5">
                      Description / Note
                    </label>
                    <input
                      type="text"
                      value={refundDescription}
                      onChange={(e) => setRefundDescription(e.target.value)}
                      placeholder="Refund for cancelled order"
                      className="w-full bg-[#1C1C1E] border border-[#2A2A2D] text-white rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#D4A04D]"
                    />
                  </div>
                  <button
                    onClick={handleRefundAndCancel}
                    disabled={savingId === selectedOrder._id}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {savingId === selectedOrder._id 
                      ? 'Processing...' 
                      : selectedOrder.status === 'cancelled' 
                        ? 'Add to Wallet' 
                        : 'Confirm Cancel & Refund'}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6 text-left">Orders</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['all', ...ORDER_STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-colors ${
              filter === s ? 'bg-[#D4A04D] text-black' : 'bg-[#131314] border border-[#2A2A2D] text-[#A7A7A7] hover:border-[#D4A04D] hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="text-center text-[#A7A7A7] py-10">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#A7A7A7] text-xs uppercase border-b border-[#2A2A2D]">
                  <th className="text-left px-5 py-3">Order #</th>
                  <th className="text-left px-5 py-3">Customer</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-5 py-3">Items</th>
                  <th className="text-left px-5 py-3">Total</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr 
                    key={order._id} 
                    className="border-b border-[#2A2A2D] hover:bg-[#2A2A2D]/60 transition-colors"
                  >
                    <td onClick={() => handleOrderClick(order)} className="px-5 py-4 text-[#D4A04D] font-mono text-xs cursor-pointer">{order.orderId || order.orderNumber || order._id}</td>
                    <td onClick={() => handleOrderClick(order)} className="px-5 py-4 text-white cursor-pointer">{customerName(order)}</td>
                    <td onClick={() => handleOrderClick(order)} className="px-5 py-4 text-[#A7A7A7] cursor-pointer">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                    <td onClick={() => handleOrderClick(order)} className="px-5 py-4 text-white cursor-pointer">{Array.isArray(order.items) ? order.items.length : '-'}</td>
                    <td onClick={() => handleOrderClick(order)} className="px-5 py-4 text-white font-semibold cursor-pointer">₹{order.total}</td>
                    <td onClick={() => handleOrderClick(order)} className="px-5 py-4 cursor-pointer"><StatusBadge status={order.status} /></td>
                    <td className="px-5 py-4">
                      {updating === order._id ? (
                        <div className="flex items-center gap-2">
                          <select
                            defaultValue={order.status}
                            onChange={e => updateStatus(order, e.target.value)}
                            disabled={savingId === order._id}
                            className="bg-[#0B0B0C] border border-[#D4A04D] rounded px-2 py-1 text-white text-xs focus:outline-none"
                          >
                            {ORDER_STATUSES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <button onClick={() => setUpdating(null)} className="text-[#A7A7A7] text-xs">✕</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setUpdating(order._id)}
                          className="text-[#D4A04D] hover:underline text-xs"
                        >
                          {savingId === order._id ? 'Saving...' : 'Update Status'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-[#A7A7A7] py-10">No orders found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
