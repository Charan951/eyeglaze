import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { socket } from '../../lib/socket';
import {
  Package,
  Glasses,
  Users,
  IndianRupee,
  Plus,
  ClipboardList,
  BarChart2
} from 'lucide-react';

interface Stats {
  orders: number;
  products: number;
  users: number;
  revenue: number;
  pendingOrders: number;
  lowStock: number;
}


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
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    const fetchStats = () => {
      api.get('/admin/stats')
        .then(res => {
          if (!active) return;
          const data = res.data;
          setStats({
            orders: data.orders?.total ?? data.orders?.month ?? 0,
            products: data.products ?? 0,
            users: data.totalCustomers ?? data.newCustomers ?? 0,
            revenue: data.revenue?.month ?? 0,
            pendingOrders: data.pending ?? 0,
            lowStock: data.lowStock ?? 0,
          });
          setRecentOrders(data.recentOrders || []);
        })
        .catch(() => {});
    };

    fetchStats();

    socket.on('order_changed', fetchStats);
    socket.on('product_changed', fetchStats);

    return () => {
      active = false;
      socket.off('order_changed', fetchStats);
      socket.off('product_changed', fetchStats);
    };
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
          { label: 'Total Orders', value: stats.orders, icon: Package, sub: `${stats.pendingOrders} pending`, color: 'text-blue-400' },
          { label: 'Products', value: stats.products, icon: Glasses, sub: `${stats.lowStock} low stock`, color: 'text-[#D4A04D]' },
          { label: 'Users', value: stats.users, icon: Users, sub: 'registered customers', color: 'text-purple-400' },
          { label: 'Revenue', value: `₹${stats.revenue.toLocaleString('en-IN')}`, icon: IndianRupee, sub: 'total revenue', color: 'text-green-400' },
        ].map(({ label, value, icon: Icon, sub, color }) => (
          <div key={label} className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-5 text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#A7A7A7] text-sm">{label}</span>
              <Icon className="w-5 h-5 text-[#D4A04D]" />
            </div>
            <div className={`text-3xl font-bold ${color} mb-1`}>{value}</div>
            <div className="text-[#A7A7A7] text-xs">{sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Add Product', href: '/admin/products', icon: Plus },
          { label: 'Process Orders', href: '/admin/orders', icon: ClipboardList },
          { label: 'View Inventory', href: '/admin/inventory', icon: BarChart2 },
        ].map(({ label, href, icon: Icon }) => (
          <Link key={label} to={href} className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-4 text-center hover:border-[#D4A04D] transition-colors flex flex-col items-center justify-center gap-2">
            <Icon className="w-6 h-6 text-[#D4A04D] mb-1" />
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
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-[#A7A7A7] py-16 italic">No recent orders found</td>
                </tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order._id || order.id || order.orderId} className="border-b border-[#2A2A2D] hover:bg-[#2A2A2D] transition-colors">
                    <td className="px-5 py-3 text-[#D4A04D] font-mono text-xs">{order.orderId || order.orderNumber || order._id}</td>
                    <td className="px-5 py-3 text-white">{order.address?.fullName || order.user?.name || 'Walk-in Customer'}</td>
                    <td className="px-5 py-3 text-[#A7A7A7]">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : (order.date || '')}
                    </td>
                    <td className="px-5 py-3 text-white font-semibold">₹{order.total}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${statusColors[order.status] || 'text-gray-400 bg-gray-400/10'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
