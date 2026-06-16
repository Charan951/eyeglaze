import { Link, Outlet } from 'react-router-dom';

export default function UserLayout() {
  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <header className="bg-[#0D0D0D] border-b border-[#2A2A2A] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left: Hamburger */}
          <button className="text-white p-2 hover:text-[#C9A84C] transition-colors" aria-label="Menu">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M3 6h18M3 12h18M3 18h18"/>
            </svg>
          </button>

          {/* Center: Logo */}
          <Link to="/" className="absolute left-1/2 -translate-x-1/2 text-[#C9A84C] font-serif text-xl tracking-[0.25em] uppercase font-bold">
            EYEGLAZE
          </Link>

          {/* Right: Icons */}
          <div className="flex items-center gap-3">
            <Link to="/products" className="text-white p-2 hover:text-[#C9A84C] transition-colors" title="Search">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M21 21l-4-4"/>
              </svg>
            </Link>
            <Link to="/account" className="text-white p-2 hover:text-[#C9A84C] transition-colors" title="Wishlist">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth="2" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </Link>
            <Link to="/cart" className="text-white p-2 hover:text-[#C9A84C] transition-colors relative" title="Cart">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth="2" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18"/>
                <line stroke="currentColor" strokeWidth="2" x1="16" y1="10" x2="16" y2="14"/>
                <line stroke="currentColor" strokeWidth="2" x1="8" y1="10" x2="8" y2="14"/>
              </svg>
            </Link>
          </div>
        </div>

        {/* Top Nav */}
        <div className="border-t border-[#1A1A1A]">
          <nav className="max-w-7xl mx-auto px-4 flex gap-6 h-10 items-center text-sm">
            {[
              { href: '/', label: 'Home' },
              { href: '/products', label: 'Products' },
              { href: '/account', label: 'Wishlist' },
              { href: '/orders', label: 'Orders' },
              { href: '/account', label: 'Account' },
            ].map(({ href, label }) => (
              <Link key={label} to={href} className="text-[#888] hover:text-[#C9A84C] transition-colors font-medium">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
