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
  Crown,
  LogOut,
  Shapes,
  Eye,
  ChevronDown,
  Layers,
  ShoppingBag,
  Sparkles,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Star,
  FileText,
  Settings,
  LayoutGrid,
  Percent,
  Gem
} from 'lucide-react';

interface NavLinkItem {
  type: 'link';
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavLinkChild {
  type?: 'link';
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavNestedAccordion {
  type: 'nested-accordion';
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: NavLinkChild[];
}

type NavChild = NavLinkChild | NavNestedAccordion;

interface NavAccordionGroup {
  type: 'accordion';
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: NavChild[];
}

type NavItem = NavLinkItem | NavAccordionGroup;

function childIsActive(child: NavChild, currentPath: string): boolean {
  if (child.type === 'nested-accordion') {
    return child.children.some(
      (nested) => currentPath === nested.href || currentPath.startsWith(nested.href + '/')
    );
  }
  return currentPath === child.href || currentPath.startsWith(child.href + '/');
}

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
      { href: '/admin/reviews', label: 'Reviews', icon: Star },
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
      {
        type: 'nested-accordion',
        id: 'home-sections',
        label: 'Home Sections',
        icon: LayoutGrid,
        children: [
          { href: '/admin/homepage-sections/special-promo', label: 'Special Promo', icon: Percent },
          { href: '/admin/homepage-sections/new-arrivals', label: 'New Arrivals', icon: Sparkles },
          { href: '/admin/homepage-sections/eyeglaze-edit', label: 'EyeGlaze Edit', icon: Gem },
        ],
      },
      { href: '/admin/blogs', label: 'Blogs', icon: FileText },
      { href: '/admin/settings', label: 'Site Settings', icon: Settings },
    ],
  },
  {
    type: 'accordion',
    id: 'marketing',
    label: 'Promotions',
    icon: Sparkles,
    children: [
      { href: '/admin/coupons', label: 'Coupons', icon: Tag },
      { href: '/admin/membership-price', label: 'Membership Price', icon: Crown },
    ],
  },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    catalog: false,
    sales: false,
    customers: false,
    storefront: false,
    marketing: false,
    'home-sections': false,
  });

  // Auto expand the accordion section that contains the current active route
  useEffect(() => {
    const currentPath = location.pathname;
    navItems.forEach((item) => {
      if (item.type === 'accordion') {
        const nestedOpen: Record<string, boolean> = {};
        const isChildActive = item.children.some((child) => {
          if (child.type === 'nested-accordion' && childIsActive(child, currentPath)) {
            nestedOpen[child.id] = true;
            return true;
          }
          return childIsActive(child, currentPath);
        });
        if (isChildActive) {
          setOpenSections((prev) => ({ ...prev, [item.id]: true, ...nestedOpen }));
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

  // Close sidebar on menu item click so page expands to 100% width cleanly
  const handleNavClick = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="h-screen flex bg-[#0B0B0C] overflow-hidden relative">
      {/* Sidebar Overlay on mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-[#0A0A0A] border-r border-[#2A2A2D] flex flex-col z-40 flex-shrink-0 select-none transition-all duration-300 ease-in-out ${
          isSidebarOpen
            ? 'w-64 px-3 py-6 opacity-100 translate-x-0'
            : 'w-0 px-0 py-6 opacity-0 -translate-x-full overflow-hidden border-r-0 pointer-events-none'
        }`}
      >
        <div className="px-3 mb-5 flex items-center justify-between">
          <div>
            <div className="text-[#D4A04D] font-serif text-lg tracking-wider uppercase font-bold">EYEGLAZE</div>
            <div className="text-[#A7A7A7] text-xs mt-0.5 font-sans">Admin Panel</div>
          </div>
          {/* Close button inside sidebar */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto scrollbar-none pr-1">
          {navItems.map((item) => {
            if (item.type === 'link') {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={handleNavClick}
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
              const hasActiveChild = item.children.some((child) => childIsActive(child, location.pathname));

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
                        if (child.type === 'nested-accordion') {
                          const nestedOpen = !!openSections[child.id];
                          const nestedActive = childIsActive(child, location.pathname);
                          const NestedIcon = child.icon;
                          return (
                            <div key={child.id} className="flex flex-col">
                              <button
                                type="button"
                                onClick={() => toggleSection(child.id)}
                                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs transition-all duration-150 group cursor-pointer outline-none ${
                                  nestedActive
                                    ? 'text-white font-medium bg-[#18181A]/80'
                                    : 'text-[#A7A7A7] hover:bg-[#131314] hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <NestedIcon className={`w-3.5 h-3.5 shrink-0 ${nestedActive ? 'text-[#D4A04D]' : 'text-[#71717A] group-hover:text-[#D4A04D]'}`} />
                                  <span className="truncate">{child.label}</span>
                                </div>
                                <ChevronDown
                                  className={`w-3.5 h-3.5 text-[#8E8E93] shrink-0 transition-transform duration-200 ${
                                    nestedOpen ? 'rotate-180 text-white' : ''
                                  }`}
                                />
                              </button>
                              <div
                                className={`grid transition-all duration-200 ease-in-out ${
                                  nestedOpen ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 overflow-hidden'
                                }`}
                              >
                                <div className="overflow-hidden flex flex-col gap-1 pl-3 border-l border-[#2A2A2D] ml-4">
                                  {child.children.map((nested) => {
                                    const isNestedActive =
                                      location.pathname === nested.href || location.pathname.startsWith(nested.href + '/');
                                    const NestedChildIcon = nested.icon;
                                    return (
                                      <Link
                                        key={nested.href}
                                        to={nested.href}
                                        onClick={handleNavClick}
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-150 group ${
                                          isNestedActive
                                            ? 'bg-[#18181A] text-white font-medium border border-[#2A2A2D]'
                                            : 'text-[#A7A7A7] hover:bg-[#131314] hover:text-white'
                                        }`}
                                      >
                                        <NestedChildIcon className={`w-3.5 h-3.5 ${isNestedActive ? 'text-[#D4A04D]' : 'text-[#71717A] group-hover:text-[#D4A04D]'}`} />
                                        <span>{nested.label}</span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        const isChildActive = childIsActive(child, location.pathname);
                        const ChildIcon = child.icon;
                        return (
                          <Link
                            key={child.href}
                            to={child.href}
                            onClick={handleNavClick}
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

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto scrollbar-none flex flex-col min-w-0 transition-all duration-300 ease-in-out">
        {/* Floating Top Navbar with Hamburger Toggle */}
        <header className="sticky top-0 z-20 bg-[#0B0B0C]/80 backdrop-blur-md border-b border-[#2A2A2D] px-6 py-3.5 flex items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="p-2 rounded-xl bg-[#131314] hover:bg-[#1C1C1E] border border-[#2A2A2D] text-[#D4A04D] hover:text-white transition-all cursor-pointer shadow-md flex items-center justify-center"
              title={isSidebarOpen ? "Collapse Sidebar (Full Width Page)" : "Expand Sidebar Menu"}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5 text-[#D4A04D]" />}
            </button>
            <div className="text-white text-xs font-bold uppercase tracking-wider hidden sm:block">
              Eyeglaze Admin Portal
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8 flex-1 w-full max-w-full transition-all duration-300">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

