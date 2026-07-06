import { useState, useEffect, useCallback } from 'react';
import StatusBadge from '../../components/ui/StatusBadge';
import api from '../../lib/api';
import { socket } from '../../lib/socket';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];

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
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

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

  const updateStatus = async (order: OrderItem, newStatus: string) => {
    const id = order.orderId || order.orderNumber || order._id;
    setSavingId(order._id);
    try {
      await api.put(`/admin/orders/${id}`, { status: newStatus });
      setOrders(prev => prev.map(o => o._id === order._id ? { ...o, status: newStatus } : o));
    } catch {
      // ignore
    } finally {
      setSavingId(null);
      setUpdating(null);
    }
  };

  const customerName = (order: OrderItem) =>
    order.user?.name || order.user?.email || order.user?.mobile || order.user?.phone || 'Unknown';

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Orders</h1>

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

      <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl overflow-hidden">
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
                  <tr key={order._id} className="border-b border-[#2A2A2D] hover:bg-[#2A2A2D] transition-colors">
                    <td className="px-5 py-4 text-[#D4A04D] font-mono text-xs">{order.orderId || order.orderNumber || order._id}</td>
                    <td className="px-5 py-4 text-white">{customerName(order)}</td>
                    <td className="px-5 py-4 text-[#A7A7A7]">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-5 py-4 text-white">{Array.isArray(order.items) ? order.items.length : '-'}</td>
                    <td className="px-5 py-4 text-white font-semibold">₹{order.total}</td>
                    <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
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
