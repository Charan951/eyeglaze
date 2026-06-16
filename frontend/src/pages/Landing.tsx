import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Hero */}
      <div className="relative min-h-screen flex flex-col items-center justify-center text-center px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-[#C9A84C]/5 via-transparent to-transparent pointer-events-none" />

        <div className="mb-6">
          <span className="text-[#C9A84C] text-2xl font-serif tracking-[0.3em] uppercase">EYEGLAZE</span>
          <span className="text-[#888] text-sm"> / EYEWEAR</span>
        </div>

        <div className="text-[#888] text-sm tracking-widest uppercase mb-4">
          Premium Eyewear for Every Version of You
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">
          CLEARER.<br />
          <span className="text-[#C9A84C]">SHARPER.</span><br />
          YOU.
        </h1>

        <p className="text-[#888] text-lg mb-10 max-w-md">
          Frames starting at just ₹1. Add prescription lenses from ₹699.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Link to="/products" className="bg-[#C9A84C] text-black font-bold uppercase py-4 px-8 rounded-xl text-center hover:opacity-90 transition-opacity flex-1">
            Shop Now →
          </Link>
          <Link to="/login" className="border border-[#2A2A2A] text-white font-bold uppercase py-4 px-8 rounded-xl text-center hover:border-[#C9A84C] transition-colors flex-1">
            Sign In
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center max-w-2xl">
          {[
            { icon: '🔒', label: '100% Secure' },
            { icon: '⭐', label: '1 Year Warranty' },
            { icon: '↩', label: 'Easy Returns' },
            { icon: '🚀', label: 'Fast Delivery' },
          ].map(({ icon, label }) => (
            <div key={label} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-[#888] text-xs">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Link to="/admin/dashboard" className="text-[#888] text-sm hover:text-[#C9A84C] transition-colors">
            Admin Dashboard →
          </Link>
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold uppercase text-center mb-8">
          Shop by <span className="text-[#C9A84C]">Category</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { icon: '👓', label: 'Prescription Glasses', slug: 'prescription' },
            { icon: '🕶️', label: 'Sunglasses', slug: 'sunglasses' },
            { icon: '💻', label: 'Blue Light Glasses', slug: 'bluelight' },
            { icon: '👁', label: 'Contact Lenses', slug: 'contact' },
            { icon: '🧒', label: 'Kids Eyewear', slug: 'kids' },
          ].map(({ icon, label, slug }) => (
            <Link key={slug} to={`/products?category=${slug}`} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 text-center hover:border-[#C9A84C] transition-colors group">
              <div className="text-4xl mb-3">{icon}</div>
              <div className="text-white text-sm font-medium group-hover:text-[#C9A84C] transition-colors">{label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
