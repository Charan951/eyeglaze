import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

interface Stats {
  orders: number;
  products: number;
  users: number;
  revenue: number;
  pendingOrders: number;
  lowStock: number;
}

const recentOrders = [
  { id: 'EGO-20260616-0001', customer: 'Rahul Sharma', total: 1298, status: 'processing', date: '2026-06-16' },
  { id: 'EGO-20260615-0023', customer: 'Priya Patel', total: 799, status: 'shipped', date: '2026-06-15' },
  { id: 'EGO-20260615-0019', customer: 'Amit Kumar', total: 2498, status: 'confirmed', date: '2026-06-15' },
  { id: 'EGO-20260614-0011', customer: 'Sneha Rao', total: 999, status: 'delivered', date: '2026-06-14' },
];

const statusColors: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10',
  confirmed: 'text-blue-400 bg-blue-400/10',
  processing: 'text-purple-400 bg-purple-400/10',
  shipped: 'text-cyan-400 bg-cyan-400/10',
  delivered: 'text-green-400 bg-green-400/10',
  cancelled: 'text-red-400 bg-red-400/10',
};

const fallbackStats: Stats = { orders: 142, products: 38, users: 520, revenue: 184298, pendingOrders: 12, lowStock: 3 };

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>(fallbackStats);

  useEffect(() => {
    let active = true;
    api.get('/admin/stats')
      .then(res => {
        if (!active) return;
        const data = res.data;
        setStats({
          orders: data.orders?.month ?? 0,
          products: data.products ?? 0,
          users: data.newCustomers ?? 0,
          revenue: data.revenue?.month ?? 0,
          pendingOrders: data.pending ?? 0,
          lowStock: data.lowStock ?? 0,
        });
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="text-[#A7A7A7] text-sm">Last updated: {new Date().toLocaleString('en-IN')}</div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: stats.orders, icon: '📦', sub: `${stats.pendingOrders} pending`, color: 'text-blue-400' },
          { label: 'Products', value: stats.products, icon: '👓', sub: `${stats.lowStock} low stock`, color: 'text-[#D4A04D]' },
          { label: 'Users', value: stats.users, icon: '👥', sub: 'registered customers', color: 'text-purple-400' },
          { label: 'Revenue', value: `₹${stats.revenue.toLocaleString('en-IN')}`, icon: '💰', sub: 'total revenue', color: 'text-green-400' },
        ].map(({ label, value, icon, sub, color }) => (
          <div key={label} className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#A7A7A7] text-sm">{label}</span>
              <span className="text-2xl">{icon}</span>
            </div>
            <div className={`text-3xl font-bold ${color} mb-1`}>{value}</div>
            <div className="text-[#A7A7A7] text-xs">{sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Add Product', href: '/admin/products', icon: '➕' },
          { label: 'Process Orders', href: '/admin/orders', icon: '📋' },
          { label: 'View Inventory', href: '/admin/inventory', icon: '📊' },
        ].map(({ label, href, icon }) => (
          <Link key={label} to={href} className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-4 text-center hover:border-[#D4A04D] transition-colors">
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-white text-sm font-semibold">{label}</div>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2D]">
          <h2 className="text-white font-bold">Recent Orders</h2>
          <Link to="/admin/orders" className="text-[#D4A04D] text-sm hover:underline">View All →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#A7A7A7] text-xs uppercase border-b border-[#2A2A2D]">
                <th className="text-left px-5 py-3">Order ID</th>
                <th className="text-left px-5 py-3">Customer</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-left px-5 py-3">Total</th>
                <th className="text-left px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id} className="border-b border-[#2A2A2D] hover:bg-[#2A2A2D] transition-colors">
                  <td className="px-5 py-3 text-[#D4A04D] font-mono text-xs">{order.id}</td>
                  <td className="px-5 py-3 text-white">{order.customer}</td>
                  <td className="px-5 py-3 text-[#A7A7A7]">{order.date}</td>
                  <td className="px-5 py-3 text-white font-semibold">₹{order.total}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${statusColors[order.status] || 'text-gray-400 bg-gray-400/10'}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
