import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    collections: false,
    support: false,
    brand: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <footer className="bg-[#0A0A0B] border-t border-[#1C1C1E] text-white pt-8 pb-6 md:pt-16 md:pb-8 mt-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-8 md:pb-12 border-b border-[#1C1C1E]">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4 text-center md:text-left flex flex-col items-center md:items-start w-full">
            <div className="flex flex-col select-none items-center md:items-start">
              <span className="text-[#D4A04D] font-serif text-xl tracking-[0.25em] uppercase font-bold leading-none">EYEGLAZE</span>
              <span className="text-[#D4A04D]/80 font-sans text-[8px] tracking-[0.4em] uppercase mt-0.5">EYEWEAR</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed max-w-xs mx-auto md:mx-0">
              Handcrafted Italian Acetate Frames & High-Index German Engineered Lenses. Redefining premium vision.
            </p>
            <div className="space-y-1.5 text-xs text-gray-400 pt-2 flex flex-col items-center md:items-start w-full">
              <div className="flex items-center gap-2">
                <span className="text-[#D4A04D]">📞</span>
                <span>1800-419-5888 (Toll-Free)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#D4A04D]">✉️</span>
                <a href="mailto:support@eyeglaze.com" className="hover:text-[#D4A04D] transition-colors">support@eyeglaze.com</a>
              </div>
            </div>
          </div>

          {/* Collections Column */}
          <div className="lg:col-span-2 border-b border-[#1C1C1E]/50 md:border-b-0 pb-4 md:pb-0">
            <button 
              onClick={() => toggleSection('collections')}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white md:cursor-default focus:outline-none bg-transparent border-none text-left p-0 select-none cursor-pointer"
            >
              <span>Collections</span>
              <span className="md:hidden text-[#D4A04D] font-extrabold text-sm">
                {openSections.collections ? '−' : '+'}
              </span>
            </button>
            <ul className={`${openSections.collections ? 'block animate-fade-in' : 'hidden'} md:block mt-3 md:mt-2.5 space-y-2 text-xs text-gray-400`}>
              <li><Link to="/products?category=prescription" className="hover:text-[#D4A04D] transition-colors">Eyeglasses</Link></li>
              <li><Link to="/products?category=sunglasses" className="hover:text-[#D4A04D] transition-colors">Sunglasses</Link></li>
              <li><Link to="/products?category=zero-power" className="hover:text-[#D4A04D] transition-colors">Computer Glasses</Link></li>
              <li><Link to="/products?category=reading-glasses" className="hover:text-[#D4A04D] transition-colors">Reading Glasses</Link></li>
            </ul>
          </div>

          {/* Customer Care Column */}
          <div className="lg:col-span-3 border-b border-[#1C1C1E]/50 md:border-b-0 pb-4 md:pb-0">
            <button 
              onClick={() => toggleSection('support')}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white md:cursor-default focus:outline-none bg-transparent border-none text-left p-0 select-none cursor-pointer"
            >
              <span>Customer Support</span>
              <span className="md:hidden text-[#D4A04D] font-extrabold text-sm">
                {openSections.support ? '−' : '+'}
              </span>
            </button>
            <ul className={`${openSections.support ? 'block animate-fade-in' : 'hidden'} md:block mt-3 md:mt-2.5 space-y-2 text-xs text-gray-400`}>
              <li><Link to="/support/contact" className="hover:text-[#D4A04D] transition-colors">Submit Inquiry Ticket</Link></li>
              <li><Link to="/support/questions" className="hover:text-[#D4A04D] transition-colors">FAQs & Advice</Link></li>
              <li><Link to="/orders" className="hover:text-[#D4A04D] transition-colors">Track Orders</Link></li>
              <li><Link to="/rate-us" className="hover:text-[#D4A04D] transition-colors">Rate Our Service</Link></li>
            </ul>
          </div>

          {/* Company Info Column */}
          <div className="lg:col-span-3 pb-4 md:pb-0">
            <button 
              onClick={() => toggleSection('brand')}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white md:cursor-default focus:outline-none bg-transparent border-none text-left p-0 select-none cursor-pointer"
            >
              <span>About Brand</span>
              <span className="md:hidden text-[#D4A04D] font-extrabold text-sm">
                {openSections.brand ? '−' : '+'}
              </span>
            </button>
            <ul className={`${openSections.brand ? 'block animate-fade-in' : 'hidden'} md:block mt-3 md:mt-2.5 space-y-2 text-xs text-gray-400`}>
              <li><Link to="/about" className="hover:text-[#D4A04D] transition-colors">About Us</Link></li>
              <li><Link to="/offers" className="hover:text-[#D4A04D] transition-colors">Offers</Link></li>
              <li><Link to="/blogs" className="hover:text-[#D4A04D] transition-colors">Blogs</Link></li>
              <li><Link to="/contact" className="hover:text-[#D4A04D] transition-colors">Contact Us</Link></li>
              <li><Link to="/about-eyeglaze" className="hover:text-[#D4A04D] transition-colors">About EyeGlaze</Link></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 md:pt-8 text-[11px] text-gray-500 gap-3">
          <div>
            © {new Date().getFullYear()} EYEGLAZE Eyewear. All rights reserved.
          </div>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Use</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
