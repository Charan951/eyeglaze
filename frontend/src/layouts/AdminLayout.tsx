import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Glasses,
  Folder,
  Package,
  Boxes,
  Users,
  Ticket,
  Home as HomeIcon,
  Video,
  Smartphone,
  Image,
  Tag,
  LogOut
} from 'lucide-react';

interface NavLinkItem {
  type: 'link';
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavDropdownItem {
  type: 'dropdown';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; }[];
}

type NavItem = NavLinkItem | NavDropdownItem;

const navItems: NavItem[] = [
  { type: 'link', href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { type: 'link', href: '/admin/products', label: 'Products', icon: Glasses },
  { type: 'link', href: '/admin/categories', label: 'Categories', icon: Folder },
  { type: 'link', href: '/admin/orders', label: 'Orders', icon: Package },
  { type: 'link', href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { type: 'link', href: '/admin/users', label: 'Users', icon: Users },
  { type: 'link', href: '/admin/tickets', label: 'Support Tickets', icon: Ticket },
  {
    type: 'dropdown',
    label: 'Home',
    icon: HomeIcon,
    children: [
      { href: '/admin/homepage-videos', label: 'Home Videos', icon: Video },
      { href: '/admin/reels', label: 'Home Reels', icon: Smartphone },
      { href: '/admin/banners', label: 'Home Banners', icon: Image },
    ],
  },
  { type: 'link', href: '/admin/coupons', label: 'Coupons', icon: Tag },
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
            const Icon = item.icon;
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
                <Icon className="w-4 h-4 text-[#D4A04D]" />
                <span>{item.label}</span>
              </Link>
            );
          } else if (item.type === 'dropdown') {
            const Icon = item.icon;
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
                    <Icon className="w-4 h-4 text-[#D4A04D]" />
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
                      const ChildIcon = child.icon;
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
                          <ChildIcon className="w-3.5 h-3.5 text-[#D4A04D]" />
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
            className="text-[#A7A7A7] text-xs hover:text-red-500 transition-colors bg-transparent border-none p-0 cursor-pointer flex items-center gap-2 focus:outline-none w-full text-left"
          >
            <LogOut className="w-4 h-4 text-[#D4A04D]" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto scrollbar-none">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
