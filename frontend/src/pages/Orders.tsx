import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/ui/StatusBadge';
import api from '../lib/api';

interface OrderItemRow {
  name: string;
  sku: string;
  color: string;
}

interface Order {
  _id: string;
  orderId: string;
  createdAt: string;
  status: string;
  total: number;
  items: OrderItemRow[];
}

const mockOrders: Order[] = [
  {
    _id: 'ord1',
    orderId: 'EGO-20260616-0001',
    createdAt: '2026-06-16T10:00:00Z',
    status: 'processing',
    total: 1298,
    items: [{ name: 'Matte Square Frame', sku: 'EG-2041', color: 'Matte Black' }],
  },
  {
    _id: 'ord2',
    orderId: 'EGO-20260610-0002',
    createdAt: '2026-06-10T14:30:00Z',
    status: 'delivered',
    total: 799,
    items: [{ name: 'Classic Aviator', sku: 'EG-3012', color: 'Gold' }],
  },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get('/orders')
      .then(res => {
        if (!active) return;
        const data = res.data?.orders;
        if (data?.length) setOrders(data);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  if (loading) {
    return <div className="text-center py-24 text-[#888]">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-bold text-white mb-2">No orders yet</h2>
          <p className="text-[#888] mb-6">Start shopping to place your first order</p>
          <Link to="/products" className="bg-[#C9A84C] text-black font-bold uppercase py-3 px-8 rounded-xl hover:opacity-90 transition-opacity">
            Shop Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order._id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#C9A84C]/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-white font-bold">{order.orderId}</div>
                  <div className="text-[#888] text-xs mt-1">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <span className="text-[#C9A84C] font-bold">₹{order.total}</span>
                </div>
              </div>

              <div className="border-t border-[#2A2A2A] pt-3 space-y-1">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#222] rounded-lg flex items-center justify-center">
                      <span className="text-lg">👓</span>
                    </div>
                    <div>
                      <div className="text-white text-sm">{item.name}</div>
                      <div className="text-[#888] text-xs">{item.sku} · {item.color}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-3">
                <Link to={`/orders/${order._id}`} className="text-[#C9A84C] text-sm hover:underline">View Details</Link>
                {order.status === 'shipped' && (
                  <Link to={`/track/${order._id}`} className="text-[#C9A84C] text-sm hover:underline">Track Order</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
