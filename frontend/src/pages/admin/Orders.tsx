import { useState, useEffect, useCallback } from 'react';
import StatusBadge from '../../components/ui/StatusBadge';
import api from '../../lib/api';

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
    fetchOrders();
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
              filter === s ? 'bg-[#C9A84C] text-black' : 'bg-[#1A1A1A] border border-[#2A2A2A] text-[#888] hover:border-[#C9A84C] hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center text-[#888] py-10">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#888] text-xs uppercase border-b border-[#2A2A2A]">
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
                  <tr key={order._id} className="border-b border-[#2A2A2A] hover:bg-[#222] transition-colors">
                    <td className="px-5 py-4 text-[#C9A84C] font-mono text-xs">{order.orderId || order.orderNumber || order._id}</td>
                    <td className="px-5 py-4 text-white">{customerName(order)}</td>
                    <td className="px-5 py-4 text-[#888]">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
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
                            className="bg-[#0D0D0D] border border-[#C9A84C] rounded px-2 py-1 text-white text-xs focus:outline-none"
                          >
                            {ORDER_STATUSES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <button onClick={() => setUpdating(null)} className="text-[#888] text-xs">✕</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setUpdating(order._id)}
                          className="text-[#C9A84C] hover:underline text-xs"
                        >
                          {savingId === order._id ? 'Saving...' : 'Update Status'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-[#888] py-10">No orders found</td>
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
