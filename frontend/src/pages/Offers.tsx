import { useState } from 'react';
import SEO from '../components/SEO';

export default function Offers() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const offers = [
    {
      code: 'EYEGOLD50',
      title: '50% OFF FRAMES',
      description: 'Get up to 50% discount on select luxury aviators and prescription frames. Starting at just ₹1!',
      expires: 'Valid until June 30, 2026',
      badge: 'Bestseller'
    },
    {
      code: 'FREECOAT',
      title: 'FREE ANTI-GLARE COATING',
      description: 'Upgrade your prescription glasses with anti-reflective and water-repellent coatings for free. Saving ₹699.',
      expires: 'Limited Time Offer',
      badge: 'Premium'
    },
    {
      code: 'DELIVERYFREE',
      title: 'FREE SHIPPING',
      description: 'Enjoy free premium shipping with secure packaging on all order values across India.',
      expires: 'Always Active',
      badge: 'Shipping'
    },
    {
      code: 'WELCOME10',
      title: '₹200 NEW USER DISCOUNT',
      description: 'Sign up and place your first order to get flat ₹200 off. Valid on minimum cart value of ₹999.',
      expires: 'First Order Only',
      badge: 'Welcome'
    }
  ];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white py-4 flex flex-col gap-8">
      <SEO 
        title="Eyewear Coupon Codes & Active Offers"
        description="Save on premium designer frames and custom lenses with current EyeGlaze promo codes, first order discounts, and free anti-glare lens coating offers."
        keywords="eyeglaze coupon codes, luxury eyewear discount, free lens coating promo, free shipping glasses"
      />
      
      {/* Header Info */}
      <div className="flex flex-col gap-2 max-w-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-[2px] bg-[#D4A04D]" />
          <span className="text-[#D4A04D] text-xs font-bold tracking-widest uppercase">Promotions</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Active Offers & Deals</h1>
        <p className="text-gray-400 text-sm">
          Save big on luxury frames and premium custom lenses. Copy any coupon code below and apply it at the checkout to redeem.
        </p>
      </div>

      {/* Grid of Offers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {offers.map((offer, idx) => (
          <div 
            key={idx}
            className="bg-[#131314] border border-[#2A2A2D] hover:border-[#D4A04D]/40 transition-all duration-300 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden"
          >
            {/* Coupon edge decor */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#0B0B0C] rounded-full border-r border-[#2A2A2D]" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#0B0B0C] rounded-full border-l border-[#2A2A2D]" />

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <span className="bg-[#1C1C1E] border border-[#2A2A2D] text-gray-400 text-[9px] font-bold py-1 px-3 rounded-full uppercase tracking-wider">
                  {offer.badge}
                </span>
                <span className="text-gray-500 text-[10px]">{offer.expires}</span>
              </div>
              
              <h3 className="text-[#D4A04D] text-lg font-extrabold tracking-wide mt-2">
                {offer.title}
              </h3>
              
              <p className="text-gray-400 text-xs leading-relaxed max-w-[90%]">
                {offer.description}
              </p>
            </div>

            {/* Code Copy Box */}
            <div className="flex items-center justify-between bg-[#1A1A1C] border border-[#2A2A2E] rounded-xl p-3.5 mt-5">
              <div className="flex flex-col">
                <span className="text-gray-500 text-[8px] uppercase font-bold tracking-widest">COUPON CODE</span>
                <span className="text-white font-mono text-sm font-bold tracking-wider">{offer.code}</span>
              </div>

              <button 
                onClick={() => handleCopy(offer.code)}
                className={`text-xs font-bold py-2 px-4 rounded-lg uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  copiedCode === offer.code 
                    ? 'bg-green-600 text-white' 
                    : 'bg-[#D4A04D] text-black hover:bg-[#C8923E]'
                }`}
              >
                {copiedCode === offer.code ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
