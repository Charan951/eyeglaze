import { Link, Outlet } from 'react-router-dom';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/products', label: 'Products', icon: '👓' },
  { href: '/admin/orders', label: 'Orders', icon: '📦' },
  { href: '/admin/inventory', label: 'Inventory', icon: '🗂️' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex bg-[#0D0D0D]">
      {/* Sidebar */}
      <aside className="w-56 bg-[#0A0A0A] border-r border-[#2A2A2A] flex flex-col py-6 px-3 gap-1 flex-shrink-0">
        <div className="px-3 mb-6">
          <div className="text-[#C9A84C] font-serif text-lg tracking-wider uppercase font-bold">EYEGLAZE</div>
          <div className="text-[#888] text-xs mt-0.5">Admin Panel</div>
        </div>

        {navItems.map(({ href, label, icon }) => (
          <Link
            key={href}
            to={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#888] hover:bg-[#1A1A1A] hover:text-white transition-colors group"
          >
            <span>{icon}</span>
            <span className="group-hover:text-white">{label}</span>
          </Link>
        ))}

        <div className="flex-1" />

        <div className="border-t border-[#2A2A2A] pt-4 px-3">
          <Link to="/" className="text-[#888] text-xs hover:text-[#C9A84C] transition-colors">
            ← Back to Store
          </Link>
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
