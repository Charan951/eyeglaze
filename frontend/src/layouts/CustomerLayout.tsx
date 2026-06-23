import { useState } from 'react';
import { Link, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandIcon from '../components/BrandIcon';

const customerNavSections = [
  {
    title: 'Account',
    items: [
      { href: '/account', label: 'Dashboard', icon: '🏠' },
      { href: '/membership', label: 'Gold Membership', icon: '👑' },
      { href: '/orders', label: 'My Orders', icon: '📦' },
      { href: '/wishlist', label: 'My Wishlist', icon: '❤️' },
      { href: '/saved-powers', label: 'Saved Powers', icon: '👓' },
      { href: '/profile', label: 'My Profile', icon: '👤' },
    ],
  },
  {
    title: 'Payments',
    items: [
      { href: '/payments', label: 'Payments & Wallet', icon: '💳' },
    ],
  },
  {
    title: 'Support',
    items: [
      { href: '/support/questions', label: 'Ask Questions', icon: '❓' },
      { href: '/support/contact', label: 'Contact Support', icon: '📞' },
    ],
  },
  {
    title: 'Others',
    items: [
      { href: '/about-eyeglaze', label: 'About EyeGlaze', icon: '🏢' },
      { href: '/rate-us', label: 'Rate Us', icon: '⭐️' },
    ],
  },
];

export default function CustomerLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B0C]">
        <div className="text-[#A7A7A7] animate-pulse">Loading...</div>
      </div>
    );
  }

  const ADMIN_ROLES = ['admin', 'store_manager', 'support_agent'];
  if (user && ADMIN_ROLES.includes(user.role || '')) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0B0B0C] w-full overflow-x-hidden">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-[#0A0A0A] border-b border-[#2A2A2D] h-16 px-4 flex items-center justify-between sticky top-0 z-40 w-full select-none">
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="text-[#D4A04D] hover:text-[#C8923E] p-1.5 focus:outline-none transition-colors cursor-pointer bg-transparent border-none"
          aria-label="Open Customer Menu"
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link to="/account" className="flex flex-col items-center text-center select-none">
          <span className="text-[#D4A04D] font-serif text-[16px] tracking-[0.2em] uppercase font-bold leading-none">EYEGLAZE</span>
          <span className="text-[#D4A04D]/80 font-sans text-[7px] tracking-[0.25em] uppercase mt-1 font-bold">CUSTOMER PORTAL</span>
        </Link>

        <Link 
          to="/" 
          className="text-gray-400 hover:text-[#D4A04D] transition-colors p-1"
          title="Back to Store"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </Link>
      </header>

      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex w-60 bg-[#0A0A0A] border-r border-[#2A2A2D] flex-col py-6 px-4 gap-1 flex-shrink-0 select-none">
        <div className="px-3 mb-8">
          <Link to="/" className="flex flex-col">
            <span className="text-[#D4A04D] font-serif text-lg tracking-[0.2em] uppercase font-bold leading-none">EYEGLAZE</span>
            <span className="text-[#D4A04D]/80 font-sans text-[8px] tracking-[0.3em] uppercase mt-1.5">CUSTOMER PORTAL</span>
          </Link>
        </div>

        {/* Profile Card in Sidebar */}
        <div className="flex items-center gap-3 px-3 py-4 bg-[#111] border border-[#2A2A2D] rounded-xl mb-6 flex-shrink-0">
          <div className="w-10 h-10 bg-[#D4A04D]/20 border border-[#D4A04D]/50 rounded-full flex items-center justify-center text-lg font-bold text-[#D4A04D] flex-shrink-0">
            {user.name ? user.name[0].toUpperCase() : '👤'}
          </div>
          <div className="min-w-0">
            <div className="text-white font-bold text-sm truncate">{user.name || 'Customer'}</div>
            <div className="text-[#A7A7A7] text-xs truncate">{user.email || ''}</div>
          </div>
        </div>

        <div className="space-y-5 overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {customerNavSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 select-none">
                {section.title}
              </h3>
              <div className="space-y-0.5">
                {section.items.map(({ href, label, icon }) => {
                  const isActive = location.pathname === href;
                  return (
                    <Link
                      key={href}
                      to={href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group border ${
                        isActive
                          ? 'bg-[#D4A04D]/10 text-[#D4A04D] border-[#D4A04D]/25 shadow-[0_0_15px_rgba(212,160,77,0.05)]'
                          : 'text-gray-400 hover:bg-[#131314] hover:text-white border-transparent'
                      }`}
                    >
                      <BrandIcon name={icon} className="w-4 h-4 text-[#D4A04D]" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 border-t border-[#2A2A2D] pt-6 px-2">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-gray-400 text-xs hover:text-[#D4A04D] transition-colors font-semibold"
          >
            <BrandIcon name="🛍️" className="w-4 h-4 text-[#D4A04D]" />
            <span>Back to Store</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-400 text-xs hover:text-red-300 transition-colors font-semibold w-full text-left bg-transparent border-none cursor-pointer"
          >
            <BrandIcon name="🚪" className="w-4 h-4 text-[#D4A04D]" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (visible on mobile only, when menu open) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-start md:hidden">
          {/* Overlay */}
          <div onClick={() => setIsMobileMenuOpen(false)} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
          
          {/* Drawer Panel */}
          <div className="relative w-64 bg-[#0A0A0A] h-full shadow-2xl border-r border-[#2A2A2D] flex flex-col z-50 animate-fade-in p-6">
            <div className="flex items-center justify-between mb-8 select-none">
              <Link to="/account" className="flex flex-col" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="text-[#D4A04D] font-serif text-lg tracking-[0.2em] uppercase font-bold">EYEGLAZE</span>
                <span className="text-[#D4A04D]/80 font-sans text-[7px] tracking-[0.25em] uppercase mt-1">CUSTOMER PORTAL</span>
              </Link>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white p-1 cursor-pointer bg-transparent border-none">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l18 18" />
                </svg>
              </button>
            </div>

            {/* Profile Card in Drawer */}
            <div className="flex items-center gap-3 px-3 py-4 bg-[#111] border border-[#2A2A2D] rounded-xl mb-6">
              <div className="w-9 h-9 bg-[#D4A04D]/20 border border-[#D4A04D]/50 rounded-full flex items-center justify-center text-sm font-bold text-[#D4A04D] shrink-0">
                {user.name ? user.name[0].toUpperCase() : '👤'}
              </div>
              <div className="min-w-0">
                <div className="text-white font-bold text-xs truncate">{user.name || 'Customer'}</div>
                <div className="text-[#A7A7A7] text-[10px] truncate">{user.email || ''}</div>
              </div>
            </div>

            <nav className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {customerNavSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-3">
                    {section.title}
                  </h3>
                  <div className="space-y-0.5">
                    {section.items.map(({ href, label, icon }) => {
                      const isActive = location.pathname === href;
                      return (
                        <Link
                          key={href}
                          to={href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors border ${
                            isActive
                              ? 'bg-[#D4A04D]/10 text-[#D4A04D] border-[#D4A04D]/20'
                              : 'text-gray-400 hover:bg-[#131314] hover:text-white border-transparent'
                          }`}
                        >
                          <BrandIcon name={icon} className="w-4 h-4 text-[#D4A04D]" />
                          <span>{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="space-y-4 border-t border-[#2A2A2D] pt-6 px-2">
              <Link 
                to="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 text-gray-400 text-xs hover:text-[#D4A04D] transition-colors font-semibold"
              >
                <BrandIcon name="🛍️" className="w-4 h-4 text-[#D4A04D]" />
                <span>Back to Store</span>
              </Link>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2 text-red-400 text-xs hover:text-red-300 transition-colors font-semibold w-full text-left bg-transparent border-none cursor-pointer"
              >
                <BrandIcon name="🚪" className="w-4 h-4 text-[#D4A04D]" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-10 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
