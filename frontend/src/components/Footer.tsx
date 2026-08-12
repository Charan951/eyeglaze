import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

interface SocialLink {
  platform: string;
  url: string;
}

interface SiteSettings {
  contactEmail: string;
  contactPhone: string;
  contactPhoneLabel?: string;
  address: string;
  socialLinks: SocialLink[];
}

const DEFAULT_SETTINGS: SiteSettings = {
  contactEmail: 'support@eyeglaze.com',
  contactPhone: '1800-419-5888',
  contactPhoneLabel: 'Toll-Free',
  address: 'EyeGlaze HQ, Cyber City, HITECH City, Hyderabad, TG 500081, India',
  socialLinks: [
    { platform: 'instagram', url: 'https://instagram.com' },
    { platform: 'facebook', url: 'https://facebook.com' },
    { platform: 'twitter', url: 'https://twitter.com' },
  ],
};

function SocialIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  if (p.includes('insta')) {
    return (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    );
  }
  if (p.includes('face')) {
    return (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    );
  }
  if (p.includes('twit') || p === 'x') {
    return (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
      </svg>
    );
  }
  if (p.includes('youtube')) {
    return (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
      </svg>
    );
  }
  if (p.includes('linkedin')) {
    return (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    );
  }
  // Generic fallback for any other platform the admin adds.
  return (
    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export default function Footer() {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    collections: false,
    support: false,
    brand: false,
  });
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    api.get('/settings')
      .then((res) => {
        if (res.data?.settings) {
          setSettings(res.data.settings);
        }
      })
      .catch(() => {
        // Keep the sensible defaults if settings can't be loaded.
      });
  }, []);

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

            <div className="flex items-center gap-4 pt-1 text-gray-400">
              {(settings.socialLinks || []).map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#D4A04D] transition-colors cursor-pointer"
                  aria-label={link.platform}
                >
                  <SocialIcon platform={link.platform} />
                </a>
              ))}
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

          {/* Company Info Column */}
          <div className="lg:col-span-3 border-b border-[#1C1C1E]/50 md:border-b-0 pb-4 md:pb-0">
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
            </ul>
          </div>

          {/* Contact Details Column */}
          <div className="lg:col-span-3 pb-4 md:pb-0">
            <button
              onClick={() => toggleSection('contact')}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white md:cursor-default focus:outline-none bg-transparent border-none text-left p-0 select-none cursor-pointer"
            >
              <span>Contact Details</span>
              <span className="md:hidden text-[#D4A04D] font-extrabold text-sm">
                {openSections.contact ? '−' : '+'}
              </span>
            </button>
            <ul className={`${openSections.contact ? 'block animate-fade-in' : 'hidden'} md:block mt-3 md:mt-2.5 space-y-3 text-xs text-gray-400`}>
              <li className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-[#D4A04D] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-[#D4A04D] transition-colors break-all">
                  {settings.contactEmail}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-[#D4A04D] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={`tel:${settings.contactPhone.replace(/[^0-9+]/g, '')}`} className="hover:text-[#D4A04D] transition-colors">
                  {settings.contactPhone}{settings.contactPhoneLabel ? ` (${settings.contactPhoneLabel})` : ''}
                </a>
              </li>
              <li className="flex items-start gap-2.5 leading-relaxed">
                <svg className="w-4 h-4 text-[#D4A04D] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{settings.address}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 md:pt-8 text-[11px] text-gray-500 gap-3">
          <div>
            © {new Date().getFullYear()} EYEGLAZE Eyewear. All rights reserved.
          </div>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms and Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
