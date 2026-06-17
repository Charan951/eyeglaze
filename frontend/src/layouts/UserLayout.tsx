import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function UserLayout() {
  const { user, cartCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if we are on the product detail route (e.g. /products/:id)
  const segments = location.pathname.split('/');
  const isProductDetailPage = segments.length === 3 && segments[1] === 'products';
  const isLensPage = location.pathname === '/lens';

  return (
    <div className="min-h-screen bg-[#0B0B0C]">
      {!isLensPage && (
        <header className="bg-[#0B0B0C]/95 backdrop-blur-md border-b border-[#2A2A2D] sticky top-0 z-50 w-full transition-colors duration-300">
        <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 h-16 flex items-center justify-between relative">
          
          {/* Left spacer/tagline (visible on desktop) */}
          <div className="hidden md:flex items-center gap-2 text-[9px] text-gray-500 tracking-widest uppercase font-semibold">
            <span>Free Shipping</span>
            <span className="w-1 h-1 bg-[#D4A04D] rounded-full" />
            <span>7-Day Returns</span>
          </div>
          
          {isProductDetailPage ? (
            /* Left actions on product detail: Back Button + Hamburger side-by-side */
            <div className="flex items-center gap-1.5 md:hidden">
              <button 
                onClick={() => navigate(-1)} 
                className="text-gray-400 hover:text-white p-1 focus:outline-none transition-colors cursor-pointer"
                aria-label="Go Back"
              >
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-[#D4A04D] hover:text-[#C8923E] p-1 focus:outline-none transition-colors cursor-pointer"
                aria-label="Open Menu"
              >
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          ) : (
            /* Hamburger Menu (visible on mobile) for normal pages */
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-[#D4A04D] hover:text-[#C8923E] p-1.5 focus:outline-none transition-colors cursor-pointer"
              aria-label="Open Menu"
            >
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Center: Logo with Gold Styling */}
          <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center select-none text-center">
            <span className="text-[#D4A04D] font-serif text-xl md:text-2xl tracking-[0.25em] uppercase font-bold leading-none">EYEGLAZE</span>
            <span className="text-[#D4A04D]/80 font-sans text-[8px] md:text-[9px] tracking-[0.4em] uppercase mt-0.5">EYEWEAR</span>
          </Link>

          {/* Right: Actions */}
          <div className="flex items-center gap-3.5 md:gap-6 z-10">
            {/* Search Icon */}
            <button 
              onClick={() => navigate('/products')} 
              className="text-gray-400 hover:text-[#D4A04D] transition-colors cursor-pointer"
              title="Search"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {isProductDetailPage ? (
              /* Wishlist Icon instead of Notifications on Product Detail */
              <Link 
                to="/wishlist" 
                className="text-gray-400 hover:text-[#D4A04D] transition-colors relative cursor-pointer" 
                title="Wishlist"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>
            ) : (
              /* Notification Icon with Badge "3" */
              <button 
                onClick={() => alert('You have 3 new notifications: 1. Your eye test is booked. 2. 50% Off sale is active. 3. New arrivals added!')}
                className="text-gray-400 hover:text-[#D4A04D] transition-colors relative cursor-pointer" 
                title="Notifications"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute -top-1.5 -right-1.5 bg-[#D4A04D] text-black font-extrabold text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#0B0B0C]">
                  3
                </span>
              </button>
            )}

            {/* Cart Icon with Badge */}
            <Link to="/cart" className="text-gray-400 hover:text-[#D4A04D] transition-colors relative cursor-pointer" title="Shopping Cart">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#D4A04D] text-black font-extrabold text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#0B0B0C]">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Profile / Login Button */}
            {user ? (
              <Link 
                to="/account" 
                className="hidden md:flex items-center gap-2 bg-[#131314] border border-[#2A2A2D] hover:border-[#D4A04D]/50 rounded-full py-1 px-2.5 transition-colors text-[10px] font-bold text-white cursor-pointer"
                title="Account"
              >
                <div className="w-4 h-4 bg-[#D4A04D] text-black font-extrabold rounded-full flex items-center justify-center text-[8px] uppercase">
                  {user.name ? user.name[0] : 'U'}
                </div>
                <span className="max-w-[80px] truncate">{user.name || 'Account'}</span>
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="hidden md:block bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-[9px] uppercase py-2 px-3.5 rounded-lg tracking-wider transition-colors cursor-pointer"
              >
                Login/Signup
              </Link>
            )}
          </div>
        </div>

        {/* Secondary Desktop Navbar - 100% View */}
        <div className="border-t border-[#1C1C1E] bg-[#0A0A0A]/60 hidden md:block w-full">
          <nav className="w-full px-4 sm:px-6 md:px-12 lg:px-16 flex justify-center gap-8 h-12 items-center text-xs tracking-[0.15em] uppercase font-bold">
            {[
              { href: '/', label: 'Home' },
              { href: '/categories', label: 'Categories' },
              { href: '/offers', label: 'Offers' },
              { href: '/about', label: 'About Us' },
              { href: '/blogs', label: 'Blogs' },
              { href: '/contact', label: 'Contact Us' },
            ].map(({ href, label }) => (
              <Link 
                key={label} 
                to={href} 
                className="text-gray-400 hover:text-[#D4A04D] hover:border-b-2 hover:border-[#D4A04D] h-full flex items-center transition-colors px-1"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      )}

      {/* Mobile Menu Sidebar Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-start md:hidden">
          {/* Overlay */}
          <div onClick={() => setIsMobileMenuOpen(false)} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
          
          {/* Sidebar Panel */}
          <div className="relative w-64 bg-[#0E0E0E] h-full shadow-2xl border-r border-[#2A2A2D] flex flex-col z-50 animate-fade-in p-6">
            <div className="flex items-center justify-between mb-8">
              <Link to="/" className="flex flex-col select-none" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="text-[#D4A04D] font-serif text-lg tracking-[0.2em] uppercase font-bold">EYEGLAZE</span>
                <span className="text-[#D4A04D]/80 font-sans text-[7px] tracking-[0.3em] uppercase mt-0.5">EYEWEAR</span>
              </Link>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l18 18" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col gap-6 text-sm tracking-[0.15em] uppercase font-bold">
              {[
                { href: '/', label: 'Home' },
                { href: '/categories', label: 'Categories' },
                { href: '/offers', label: 'Offers' },
                { href: '/about', label: 'About Us' },
                { href: '/blogs', label: 'Blogs' },
                { href: '/contact', label: 'Contact Us' },
              ].map(({ href, label }) => (
                <Link 
                  key={label} 
                  to={href} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-400 hover:text-[#D4A04D] transition-colors py-1 border-b border-[#1A1A1C]"
                >
                  {label}
                </Link>
              ))}
            </nav>
            
            {/* Account info in Drawer */}
            <div className="mt-auto pt-6 border-t border-[#1C1C1E] flex flex-col gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#D4A04D] text-black font-extrabold rounded-full flex items-center justify-center text-xs uppercase">
                    {user.name ? user.name[0] : 'U'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white text-xs font-bold truncate max-w-[120px]">{user.name}</span>
                    <Link to="/account" onClick={() => setIsMobileMenuOpen(false)} className="text-[#D4A04D] text-[10px] font-semibold hover:underline">View Account</Link>
                  </div>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-xs uppercase py-3 rounded-lg tracking-wider transition-colors"
                >
                  Login / Signup
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="w-full px-4 sm:px-6 md:px-12 lg:px-16 py-8">
        <Outlet />
      </main>
    </div>
  );
}
