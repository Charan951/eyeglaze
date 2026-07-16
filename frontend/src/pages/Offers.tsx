import { useState, useEffect, useRef } from 'react';
import { useLoaderData } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import SEO from '../components/SEO';
import { socket } from '../lib/socket';

interface Coupon {
  _id: string;
  code: string;
  name?: string;
  description?: string;
  badge?: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  validTo?: string;
  expiresAt?: string;
}

export default function Offers() {
  const { coupons: initialCoupons } = useLoaderData() as { coupons: Coupon[] };
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons || []);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (initialCoupons) {
      setCoupons(initialCoupons);
      setLoading(false);
    }
  }, [initialCoupons]);
  
  // Slider State
  const [activeSlide, setActiveSlide] = useState(0);
  const [direction, setDirection] = useState(0); // -1: left, 1: right
  const timerRef = useRef<any>(null);

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data.coupons || []);
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch handled by route loader

  useEffect(() => {
    socket.on('coupon_changed', fetchCoupons);
    return () => {
      socket.off('coupon_changed', fetchCoupons);
    };
  }, []);

  // Auto-slide functionality
  const startTimer = () => {
    stopTimer();
    if (coupons.length > 1) {
      timerRef.current = setInterval(() => {
        handleNextSlide();
      }, 6000);
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [coupons, activeSlide]);

  const handleNextSlide = () => {
    setDirection(1);
    setActiveSlide((prev) => (prev + 1) % coupons.length);
  };

  const handlePrevSlide = () => {
    setDirection(-1);
    setActiveSlide((prev) => (prev - 1 + coupons.length) % coupons.length);
  };

  const handleDotClick = (index: number) => {
    setDirection(index > activeSlide ? 1 : -1);
    setActiveSlide(index);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Slider animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring" as const, stiffness: 120, damping: 20 },
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 }
      }
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: "spring" as const, stiffness: 120, damping: 20 },
        opacity: { duration: 0.4 },
        scale: { duration: 0.4 }
      }
    })
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white py-4 flex flex-col gap-10">
      <SEO 
        title="Eyewear Coupon Codes & Active Offers"
        description="Save on premium designer frames and custom lenses with current EyeGlaze promo codes, first order discounts, and free anti-glare lens coating offers."
        keywords="eyeglaze coupon codes, luxury eyewear discount, free lens coating promo, free shipping glasses"
      />

      {/* High Fashion Curved Hero Campaign Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full relative h-[300px] md:h-[380px] rounded-3xl overflow-hidden border border-zinc-800/50 shadow-2xl bg-gradient-to-r from-black via-black/90 to-transparent"
        style={{
          clipPath: 'ellipse(100% 100% at 50% 0%)',
        }}
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/promotions_hero.png" 
            alt="Meller Editorial Eyewear Collection"
            className="w-full h-full object-cover object-center opacity-85 select-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0C] via-[#0B0B0C]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C] via-transparent to-[#0B0B0C]/40" />
        </div>

        <div className="absolute inset-0 z-10 flex flex-col justify-center px-8 md:px-16 lg:px-24">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="max-w-md space-y-4"
          >
            <div className="inline-flex items-center gap-2">
              <span className="h-[2px] w-6 bg-[#D4A04D]" />
              <span className="text-gray-400 text-[10px] tracking-[0.3em] font-extrabold uppercase">Featured Campaign</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-[#D4A04D] font-serif text-3xl md:text-5xl font-black tracking-widest uppercase leading-none">
                MELLER
              </h2>
              <p className="text-[#D4A04D]/90 text-[10px] md:text-xs tracking-[0.25em] font-bold uppercase">
                Designed in Barcelona
              </p>
            </div>

            <h3 className="text-white text-xl md:text-3xl font-extrabold tracking-tight leading-none uppercase">
              IT'S <span className="text-[#D4A04D] bg-gradient-to-r from-[#D4A04D] to-[#ffd080] bg-clip-text text-transparent">OUT</span> THERE!
            </h3>

            <p className="text-gray-400 text-xs md:text-sm leading-relaxed max-w-sm">
              Discover bold silhouettes, polarized clarity, and modern colors. Exclusive deals on premium frames available below.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Promotions Slider Section */}
      <div className="w-full max-w-6xl mx-auto px-4 flex flex-col gap-6 select-none mt-2">
        <div className="flex flex-col gap-1 text-left">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-white">
            EXCLUSIVE OFFERS & PROMOTIONS
          </h2>
          <p className="text-gray-500 text-[10px] md:text-xs font-black tracking-widest uppercase">
            GET THE BEST VALUE ON PREMIUM EYEWEAR
          </p>
        </div>

        {loading ? (
          <div className="bg-[#131314]/50 border border-[#2A2A2D] h-[280px] rounded-3xl animate-pulse flex items-center justify-center">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Loading Exclusive Offers...</span>
          </div>
        ) : coupons.length === 0 ? (
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-3xl p-16 text-center text-gray-500">
            <span className="text-4xl block mb-3">🏷️</span>
            <p className="text-sm font-bold uppercase tracking-wider">No active promotions at the moment.</p>
            <p className="text-xs text-gray-600 mt-1">Check back later or check our store announcements!</p>
          </div>
        ) : (
          <div 
            className="relative w-full overflow-hidden group"
            onMouseEnter={stopTimer}
            onMouseLeave={startTimer}
          >
            <div className="relative min-h-[300px] md:min-h-[260px] w-full flex items-center">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={activeSlide}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="w-full bg-gradient-to-r from-[#1C1914] to-[#0E0E0F] border border-[#2A2A2D] rounded-3xl p-6 md:p-10 flex flex-col md:flex-row justify-between gap-6 items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                >
                  {/* Left Side: Coupon Title, Subtitle, Description */}
                  <div className="flex-1 flex flex-col items-start text-left">
                    <span className="bg-[#C8923E]/10 border border-[#C8923E]/30 text-[#D4A04D] text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest mb-4 shadow-sm">
                      {coupons[activeSlide].badge || 'OFFER'}
                    </span>
                    
                    <h3 className="text-white font-extrabold text-2xl md:text-4xl uppercase tracking-wide leading-tight mb-1.5">
                      {coupons[activeSlide].name || 'DISCOUNT VOUCHER'}
                    </h3>

                    {coupons[activeSlide].discountType === 'percent' ? (
                      <span className="text-[#D4A04D] text-xs font-black uppercase tracking-wider mb-4 block">
                        SAVE {coupons[activeSlide].discountValue}% ON YOUR ORDER
                      </span>
                    ) : (
                      <span className="text-[#D4A04D] text-xs font-black uppercase tracking-wider mb-4 block">
                        FLAT ₹{coupons[activeSlide].discountValue} DISCOUNT INSTANTLY
                      </span>
                    )}

                    <p className="text-gray-400 text-xs md:text-sm leading-relaxed max-w-lg mb-4">
                      {coupons[activeSlide].description || 'Apply this promo code at checkout to claim your deal.'}
                    </p>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      {coupons[activeSlide].minOrderValue ? (
                        <div>MIN. PURCHASE: <span className="text-white">₹{coupons[activeSlide].minOrderValue}</span></div>
                      ) : null}
                      {coupons[activeSlide].maxDiscount ? (
                        <div>MAX DISCOUNT: <span className="text-white">₹{coupons[activeSlide].maxDiscount}</span></div>
                      ) : null}
                      {coupons[activeSlide].validTo || coupons[activeSlide].expiresAt ? (
                        <div>
                          EXPIRES:{' '}
                          <span className="text-white">
                            {new Date(coupons[activeSlide].validTo || coupons[activeSlide].expiresAt || '').toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Right Side: Copy Box exactly matching user design */}
                  <div className="flex-shrink-0 w-full sm:w-[250px] flex justify-center">
                    <div className="bg-[#0B0B0C] border border-[#2A2A2D] rounded-2xl p-5 flex flex-col gap-3.5 w-full items-center justify-center text-center shadow-xl">
                      <span className="text-gray-500 text-[9px] font-black uppercase tracking-widest">
                        COPY COUPON CODE
                      </span>
                      <div className="border border-dashed border-[#D4A04D]/40 rounded-xl px-4 py-2.5 bg-[#131314] font-mono text-sm text-[#D4A04D] font-black tracking-wider w-full select-all">
                        {coupons[activeSlide].code}
                      </div>
                      <motion.button
                        onClick={() => handleCopy(coupons[activeSlide].code)}
                        whileTap={{ scale: 0.96 }}
                        className={`w-full bg-[#D4A04D] text-black font-black text-xs uppercase py-3 rounded-xl tracking-widest transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_0_15px_rgba(212,160,77,0.25)] ${
                          copiedCode === coupons[activeSlide].code
                            ? 'bg-green-600 text-white shadow-[0_0_15px_rgba(22,163,74,0.3)]'
                            : 'hover:bg-[#C8923E]'
                        }`}
                      >
                        {copiedCode === coupons[activeSlide].code ? '✓ COPIED!' : 'COPY CODE'}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Left/Right Arrow Controls */}
            {coupons.length > 1 && (
              <>
                <button
                  onClick={handlePrevSlide}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-zinc-700/60 bg-[#0E0E0F]/80 text-gray-300 hover:text-white flex items-center justify-center hover:border-[#D4A04D] transition-all z-20 opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg"
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNextSlide}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-zinc-700/60 bg-[#0E0E0F]/80 text-gray-300 hover:text-white flex items-center justify-center hover:border-[#D4A04D] transition-all z-20 opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg"
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Indicator Dots */}
            {coupons.length > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {coupons.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleDotClick(index)}
                    className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                      index === activeSlide 
                        ? 'w-6 bg-[#D4A04D] shadow-[0_0_8px_rgba(212,160,77,0.4)]' 
                        : 'w-2.5 bg-zinc-700 hover:bg-zinc-500'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
