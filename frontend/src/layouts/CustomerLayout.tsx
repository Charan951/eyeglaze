import { Link, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const customerNavItems = [
  { href: '/account', label: 'Dashboard', icon: '🏠' },
  { href: '/orders', label: 'My Orders', icon: '📦' },
  { href: '/wishlist', label: 'My Wishlist', icon: '❤️' },
  { href: '/profile', label: 'My Profile', icon: '👤' },
];

export default function CustomerLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B0C]">
        <div className="text-[#A7A7A7]">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-[#0B0B0C]">
      {/* Sidebar */}
      <aside className="w-60 bg-[#0A0A0A] border-r border-[#2A2A2D] flex flex-col py-6 px-4 gap-1 flex-shrink-0 select-none">
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

        <div className="space-y-1">
          {customerNavItems.map(({ href, label, icon }) => {
            const isActive = location.pathname === href;
            return (
              <Link
                key={href}
                to={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors group border ${
                  isActive
                    ? 'bg-[#D4A04D]/10 text-[#D4A04D] border-[#D4A04D]/20'
                    : 'text-gray-400 hover:bg-[#131314] hover:text-white border-transparent'
                }`}
              >
                <span className="text-base">{icon}</span>
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex-1" />

        <div className="space-y-3 border-t border-[#2A2A2D] pt-6 px-2">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-gray-400 text-xs hover:text-[#D4A04D] transition-colors font-semibold"
          >
            <span>🛍️</span>
            <span>Back to Store</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-400 text-xs hover:text-red-300 transition-colors font-semibold w-full text-left"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 md:px-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
