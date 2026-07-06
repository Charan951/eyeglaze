import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/products', label: 'Products', icon: '👓' },
  { href: '/admin/categories', label: 'Categories', icon: '📁' },
  { href: '/admin/orders', label: 'Orders', icon: '📦' },
  { href: '/admin/inventory', label: 'Inventory', icon: '🗂️' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/tickets', label: 'Support Tickets', icon: '🎫' },
  { href: '/admin/homepage-videos', label: 'Home Videos', icon: '🎥' },
  { href: '/admin/reels', label: 'Home Reels', icon: '📱' },
  { href: '/admin/coupons', label: 'Coupons', icon: '🏷️' },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  return (
    <div className="min-h-screen flex bg-[#0B0B0C]">
      {/* Sidebar */}
      <aside className="w-56 bg-[#0A0A0A] border-r border-[#2A2A2D] flex flex-col py-6 px-3 gap-1 flex-shrink-0">
        <div className="px-3 mb-6">
          <div className="text-[#D4A04D] font-serif text-lg tracking-wider uppercase font-bold">EYEGLAZE</div>
          <div className="text-[#A7A7A7] text-xs mt-0.5">Admin Panel</div>
        </div>

        {navItems.map(({ href, label, icon }) => (
          <Link
            key={href}
            to={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#A7A7A7] hover:bg-[#131314] hover:text-white transition-colors group"
          >
            <span>{icon}</span>
            <span className="group-hover:text-white">{label}</span>
          </Link>
        ))}

        <div className="flex-1" />

        <div className="border-t border-[#2A2A2D] pt-4 px-3">
          <button
            onClick={handleLogout}
            className="text-[#A7A7A7] text-xs hover:text-red-500 transition-colors bg-transparent border-none p-0 cursor-pointer flex items-center gap-1.5 focus:outline-none w-full text-left"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
