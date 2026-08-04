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
  LogOut,
  Shapes,
  Eye,
  ChevronDown,
  Layers,
  ShoppingBag,
  Sparkles
} from 'lucide-react';

interface NavLinkItem {
  type: 'link';
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavAccordionGroup {
  type: 'accordion';
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

type NavItem = NavLinkItem | NavAccordionGroup;

const navItems: NavItem[] = [
  {
    type: 'link',
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    type: 'accordion',
    id: 'catalog',
    label: 'Catalog & Products',
    icon: Layers,
    children: [
      { href: '/admin/products', label: 'Products', icon: Glasses },
      { href: '/admin/categories', label: 'Categories', icon: Folder },
      { href: '/admin/shapes', label: 'Shapes', icon: Shapes },
      { href: '/admin/lenses', label: 'Lenses', icon: Eye },
    ],
  },
  {
    type: 'accordion',
    id: 'sales',
    label: 'Sales & Inventory',
    icon: ShoppingBag,
    children: [
      { href: '/admin/orders', label: 'Orders', icon: Package },
      { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
    ],
  },
  {
    type: 'accordion',
    id: 'customers',
    label: 'Users & Support',
    icon: Users,
    children: [
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/tickets', label: 'Support Tickets', icon: Ticket },
    ],
  },
  {
    type: 'accordion',
    id: 'storefront',
    label: 'Home & Content',
    icon: HomeIcon,
    children: [
      { href: '/admin/homepage-videos', label: 'Home Videos', icon: Video },
      { href: '/admin/reels', label: 'Home Reels', icon: Smartphone },
      { href: '/admin/banners', label: 'Home Banners', icon: Image },
    ],
  },
  {
    type: 'accordion',
    id: 'marketing',
    label: 'Promotions',
    icon: Sparkles,
    children: [
      { href: '/admin/coupons', label: 'Coupons', icon: Tag },
    ],
  },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    catalog: false,
    sales: false,
    customers: false,
    storefront: false,
    marketing: false,
  });

  // Auto expand the accordion section that contains the current active route
  useEffect(() => {
    const currentPath = location.pathname;
    navItems.forEach((item) => {
      if (item.type === 'accordion') {
        const isChildActive = item.children.some(
          (child) => currentPath === child.href || currentPath.startsWith(child.href + '/')
        );
        if (isChildActive) {
          setOpenSections((prev) => ({ ...prev, [item.id]: true }));
        }
      }
    });
  }, [location.pathname]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="h-screen flex bg-[#0B0B0C] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-[#0A0A0A] border-r border-[#2A2A2D] flex flex-col py-6 px-3 gap-1.5 flex-shrink-0 overflow-y-auto scrollbar-none select-none">
        <div className="px-3 mb-5">
          <div className="text-[#D4A04D] font-serif text-lg tracking-wider uppercase font-bold">EYEGLAZE</div>
          <div className="text-[#A7A7A7] text-xs mt-0.5 font-sans">Admin Panel</div>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1">
          {navItems.map((item) => {
            if (item.type === 'link') {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
                    isActive
                      ? 'bg-[#18181A] text-white font-semibold shadow-sm border border-[#2A2A2D]'
                      : 'text-[#A7A7A7] hover:bg-[#131314] hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#D4A04D]' : 'text-[#8E8E93] group-hover:text-[#D4A04D]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            }

            if (item.type === 'accordion') {
              const Icon = item.icon;
              const isOpen = !!openSections[item.id];
              const hasActiveChild = item.children.some(
                (child) => location.pathname === child.href || location.pathname.startsWith(child.href + '/')
              );

              return (
                <div key={item.id} className="flex flex-col">
                  <button
                    onClick={() => toggleSection(item.id)}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group cursor-pointer outline-none focus:outline-none ${
                      hasActiveChild
                        ? 'text-white font-medium bg-[#131314]/80'
                        : 'text-[#A7A7A7] hover:bg-[#131314] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 transition-colors ${hasActiveChild ? 'text-[#D4A04D]' : 'text-[#8E8E93] group-hover:text-[#D4A04D]'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {hasActiveChild && !isOpen && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4A04D]" />
                      )}
                      <ChevronDown
                        className={`w-4 h-4 text-[#8E8E93] group-hover:text-white transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-white' : ''
                        }`}
                      />
                    </div>
                  </button>

                  <div
                    className={`grid transition-all duration-200 ease-in-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100 mt-1 mb-1' : 'grid-rows-[0fr] opacity-0 overflow-hidden'
                    }`}
                  >
                    <div className="overflow-hidden flex flex-col gap-1 pl-3.5 border-l border-[#2A2A2D] ml-5">
                      {item.children.map((child) => {
                        const isChildActive = location.pathname === child.href || location.pathname.startsWith(child.href + '/');
                        const ChildIcon = child.icon;
                        return (
                          <Link
                            key={child.href}
                            to={child.href}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-150 group ${
                              isChildActive
                                ? 'bg-[#18181A] text-white font-medium border border-[#2A2A2D]'
                                : 'text-[#A7A7A7] hover:bg-[#131314] hover:text-white'
                            }`}
                          >
                            <ChildIcon className={`w-3.5 h-3.5 transition-colors ${isChildActive ? 'text-[#D4A04D]' : 'text-[#71717A] group-hover:text-[#D4A04D]'}`} />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </nav>

        <div className="border-t border-[#2A2A2D] pt-4 px-3 mt-auto">
          <button
            onClick={handleLogout}
            className="text-[#A7A7A7] text-xs hover:text-red-400 transition-colors bg-transparent border-none p-0 cursor-pointer flex items-center gap-2.5 focus:outline-none w-full text-left font-medium"
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

