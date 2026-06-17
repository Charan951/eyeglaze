import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/ui/StatusBadge';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

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

export default function AccountPage() {
  const { user } = useAuth();
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

  const liveOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-[#A7A7A7] animate-pulse">Loading orders...</div>
      </div>
    );
  }

  const renderOrderList = (orderList: Order[], emptyMsg: string) => {
    if (orderList.length === 0) {
      return (
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-8 text-center text-gray-500 text-sm">
          {emptyMsg}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {orderList.map(order => (
          <div key={order._id} className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-5 hover:border-[#D4A04D]/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-white font-bold">{order.orderId}</div>
                <div className="text-[#A7A7A7] text-xs mt-1">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} />
                <span className="text-[#D4A04D] font-bold">₹{order.total}</span>
              </div>
            </div>

            <div className="border-t border-[#2A2A2D] pt-3 space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#222] rounded-lg flex items-center justify-center">
                    <span className="text-lg">👓</span>
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">{item.name}</div>
                    <div className="text-[#A7A7A7] text-xs">{item.sku} · {item.color}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-3">
              <Link to={`/orders/${order._id}`} className="text-[#D4A04D] text-sm hover:underline font-semibold">View Details</Link>
              {order.status === 'shipped' && (
                <Link to={`/track/${order._id}`} className="text-[#D4A04D] text-sm hover:underline font-semibold">Track Order</Link>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Customer Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome back, {user?.name || 'Customer'}. Monitor your live and completed orders below.</p>
      </div>

      {/* Live Orders Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse" />
          <span>Live Orders</span>
          <span className="text-xs bg-[#131314] border border-[#2A2A2D] text-gray-400 px-2 py-0.5 rounded-full font-normal">
            {liveOrders.length}
          </span>
        </h2>
        {renderOrderList(liveOrders, 'No live orders currently. Start shopping to place an order!')}
      </div>

      {/* Completed Orders Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
          <span>Completed & Cancelled Orders</span>
          <span className="text-xs bg-[#131314] border border-[#2A2A2D] text-gray-400 px-2 py-0.5 rounded-full font-normal">
            {completedOrders.length}
          </span>
        </h2>
        {renderOrderList(completedOrders, 'No completed or cancelled orders found.')}
      </div>
    </div>
  );
}
