import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface NavLinkItem {
  type: 'link';
  href: string;
  label: string;
  icon: string;
}

interface NavDropdownItem {
  type: 'dropdown';
  label: string;
  icon: string;
  children: { href: string; label: string; icon: string; }[];
}

type NavItem = NavLinkItem | NavDropdownItem;

const navItems: NavItem[] = [
  { type: 'link', href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { type: 'link', href: '/admin/products', label: 'Products', icon: '👓' },
  { type: 'link', href: '/admin/categories', label: 'Categories', icon: '📁' },
  { type: 'link', href: '/admin/orders', label: 'Orders', icon: '📦' },
  { type: 'link', href: '/admin/inventory', label: 'Inventory', icon: '🗂️' },
  { type: 'link', href: '/admin/users', label: 'Users', icon: '👥' },
  { type: 'link', href: '/admin/tickets', label: 'Support Tickets', icon: '🎫' },
  {
    type: 'dropdown',
    label: 'Home',
    icon: '🏠',
    children: [
      { href: '/admin/homepage-videos', label: 'Home Videos', icon: '🎥' },
      { href: '/admin/reels', label: 'Home Reels', icon: '📱' },
      { href: '/admin/banners', label: 'Home Banners', icon: '🖼️' },
    ],
  },
  { type: 'link', href: '/admin/coupons', label: 'Coupons', icon: '🏷️' },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const homePaths = ['/admin/homepage-videos', '/admin/reels', '/admin/banners'];
  const isHomeActive = homePaths.includes(location.pathname);
  const [isHomeOpen, setIsHomeOpen] = useState(isHomeActive);

  useEffect(() => {
    if (isHomeActive) {
      setIsHomeOpen(true);
    }
  }, [location.pathname, isHomeActive]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="h-screen flex bg-[#0B0B0C] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-[#0A0A0A] border-r border-[#2A2A2D] flex flex-col py-6 px-3 gap-1 flex-shrink-0 overflow-y-auto scrollbar-none">
        <div className="px-3 mb-6">
          <div className="text-[#D4A04D] font-serif text-lg tracking-wider uppercase font-bold">EYEGLAZE</div>
          <div className="text-[#A7A7A7] text-xs mt-0.5">Admin Panel</div>
        </div>

        {navItems.map((item) => {
          if (item.type === 'link') {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group ${
                  isActive
                    ? 'bg-[#131314] text-white font-medium'
                    : 'text-[#A7A7A7] hover:bg-[#131314] hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          } else if (item.type === 'dropdown') {
            return (
              <div key={item.label} className="flex flex-col">
                <button
                  onClick={() => setIsHomeOpen(!isHomeOpen)}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-colors group cursor-pointer outline-none focus:outline-none ${
                    isHomeActive
                      ? 'text-white font-medium'
                      : 'text-[#A7A7A7] hover:bg-[#131314] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <span className={`text-[10px] transition-transform duration-200 ${isHomeOpen ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                
                {isHomeOpen && (
                  <div className="flex flex-col gap-1 mt-1 pl-4 border-l border-[#2A2A2D] ml-5">
                    {item.children.map((child) => {
                      const isChildActive = location.pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          to={child.href}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors group ${
                            isChildActive
                              ? 'bg-[#131314] text-white font-medium'
                              : 'text-[#A7A7A7] hover:bg-[#131314] hover:text-white'
                          }`}
                        >
                          <span>{child.icon}</span>
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}

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
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

