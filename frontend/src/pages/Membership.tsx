import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import SEO from '../components/SEO';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export default function Membership() {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/membership' } } });
      return;
    }

    setIsProcessing(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Failed to load payment gateway. Please try again.');
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_STX1H1R9XvVjSZ',
        amount: 12900, // ₹129 in paise
        currency: 'INR',
        name: 'EyeGlaze',
        description: 'Gold Membership',
        handler: async (_response: any) => {
          try {
            await api.post('/auth/membership/activate', { paymentMethod: 'razorpay' });
            await checkAuth();
            alert('🎉 Gold Membership activated successfully! Enjoy your benefits!');
          } catch (err: any) {
            alert('Failed to activate membership: ' + (err.response?.data?.error || err.message));
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || user.mobile || '',
        },
        theme: {
          color: '#D4A04D',
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Razorpay error:', error);
      alert('Something went wrong. Please try again.');
      setIsProcessing(false);
    }
  };

  // 1. Show Active View if user is already a Gold Member
  if (user?.membershipActive) {
    const expiryDate = user.membershipExpiry 
      ? new Date(user.membershipExpiry as string | number | Date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : '14 July 2027';

    return (
      <div className="min-h-screen bg-[#070708] text-white flex flex-col w-full max-w-4xl mx-auto p-4 md:p-8 relative">
        <SEO 
          title="You are a Gold Member!"
          description="Your EyeGlaze Gold Membership details and benefits"
        />

        {/* Back Button & Title Header */}
        <div className="flex items-center gap-4 mb-8 select-none">
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer focus:outline-none"
            aria-label="Go Back"
          >
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-wide">
              You are a Gold Member!
            </h1>
            <p className="text-gray-400 text-xs mt-1.5 font-medium">
              Your membership expires on {expiryDate}
            </p>
          </div>
        </div>

        {/* Active Membership Main Card */}
        <div className="relative overflow-hidden rounded-2xl border border-[#D4A04D]/35 bg-gradient-to-br from-[#121213] to-[#0A0A0B] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.8),_0_0_20px_rgba(212,160,77,0.03)] mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#1E1911] via-[#0D0C0A] to-[#050506] border border-[#D4A04D]/40 rounded-full flex items-center justify-center shadow-lg text-2xl select-none">
                👑
              </div>
              <div>
                <h2 className="text-white text-lg font-black uppercase tracking-wide">Gold Membership</h2>
                <p className="text-[#D4A04D] text-xs font-black uppercase tracking-wider mt-0.5">₹129 / Year</p>
              </div>
            </div>
            <p className="text-gray-400 text-xs max-w-lg leading-relaxed font-semibold">
              Join thousands of happy customers enjoying premium benefits. Upgrade today and start saving!
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
            <span className="bg-[#D4A04D]/25 border border-[#D4A04D]/40 text-[#D4A04D] font-black uppercase px-6 py-2 rounded-full text-[10px] select-none tracking-widest leading-none">
              ✓ Active
            </span>
            <Link 
              to="/profile" 
              className="text-gray-400 hover:text-[#D4A04D] text-xs font-bold transition-colors underline"
            >
              Go to Account →
            </Link>
          </div>
        </div>

        {/* Section Title */}
        <h3 className="text-xl font-extrabold text-white mb-6 uppercase tracking-wider">
          What you get
        </h3>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: '👑',
              title: '₹1 Frames',
              desc: 'Get select premium frames for just ₹1'
            },
            {
              icon: '🥳',
              title: 'Buy 1 Get 1 Free',
              desc: 'Buy One Get One offer on all gold membership frames'
            },
            {
              icon: '💰',
              title: '5% Cashback',
              desc: 'Earn 5% cashback on every order'
            },
            {
              icon: '🚀',
              title: 'Priority Support',
              desc: 'Get 24/7 priority customer support'
            },
            {
              icon: '🎁',
              title: 'Exclusive Offers',
              desc: 'Early access to sales and special discounts'
            },
            {
              icon: '📦',
              title: 'Free Shipping',
              desc: 'Free shipping on all orders'
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-[#121213] border border-zinc-800/80 rounded-2xl p-6 flex flex-col gap-3 shadow-lg hover:border-[#D4A04D]/35 transition-colors">
              <div className="text-3xl select-none">{item.icon}</div>
              <h4 className="text-white text-sm font-black uppercase tracking-wider">{item.title}</h4>
              <p className="text-gray-400 text-xs font-semibold leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Show Upgrade View if user is not a Gold Member
  return (
    <div className="min-h-screen bg-[#070708] text-white flex flex-col w-full max-w-lg mx-auto relative pb-28">
      <SEO 
        title="EyeGlaze Gold Membership"
        description="Upgrade to EyeGlaze Gold Membership and unlock exclusive benefits including ₹1 frames, Buy One Get One offers, and more!"
        keywords="eyeglaze gold membership, premium eyewear benefits, exclusive offers"
      />

      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#1C1C1E] bg-[#070708] sticky top-0 z-30 select-none">
        <button 
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer focus:outline-none"
          aria-label="Go Back"
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center flex flex-col items-center">
          <span className="text-[#D4A04D] font-serif font-black text-sm tracking-[0.2em] uppercase leading-none">
            EYEGLAZE
          </span>
          <span className="text-[#D4A04D]/90 text-[8px] font-black tracking-widest uppercase mt-1">
            GOLD MEMBERSHIP
          </span>
        </div>
        <div className="border border-[#D4A04D] rounded-lg px-2 py-0.75 text-[#D4A04D] text-[7px] font-black uppercase tracking-wider bg-transparent">
          BEST VALUE
        </div>
      </div>

      {/* Content Container */}
      <div className="flex flex-col gap-6 p-4">
        
        {/* 1. Hero Card */}
        <div className="relative overflow-hidden rounded-2xl border border-[#D4A04D]/25 bg-gradient-to-br from-[#121213] to-[#0A0A0B] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.6),_0_0_20px_rgba(212,160,77,0.03)] flex flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-3.5 z-10">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-black text-[#D4A04D] tracking-wide leading-none">
                ₹1 = 1 FRAME
              </h2>
              <div className="inline-flex bg-[#D4A04D] text-black text-[7.5px] font-black uppercase tracking-wider px-2 py-0.75 rounded mt-1.5 w-max select-none">
                GOLD MEMBERS EXCLUSIVE
              </div>
            </div>

            <ul className="flex flex-col gap-1.5 text-[9px] font-black uppercase tracking-wider text-gray-300">
              <li className="flex items-center gap-1.5">
                <span className="text-[#D4A04D]">✓</span> SELECTED FRAMES ONLY
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-[#D4A04D]">✓</span> FIRST ORDER BENEFIT
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-[#D4A04D]">✓</span> PREMIUM EYEWEAR AT JUST ₹1
              </li>
            </ul>
          </div>

          {/* Right Image Stack with Overlay */}
          <div className="relative w-36 h-28 flex-shrink-0 flex items-center justify-center rounded-xl overflow-hidden border border-[#2A2A2D]/40 shadow-inner bg-black/10 select-none">
            <img 
              src="/images/gold_membership_hero.png" 
              alt="Premium Eyewear Case" 
              className="w-full h-full object-cover" 
            />
            {/* Absolute Circular Gold Pricing badge */}
            <div className="absolute right-2 bottom-2 w-12 h-12 bg-black/85 border border-[#D4A04D] rounded-full flex flex-col items-center justify-center shadow-lg select-none">
              <span className="text-[#D4A04D] text-[9.5px] font-black leading-none">₹129</span>
              <span className="text-gray-400 text-[6.5px] font-black uppercase tracking-widest mt-0.5">/YEAR</span>
            </div>
          </div>
        </div>

        {/* 2. Need 2 Frames Card */}
        <div className="rounded-2xl bg-[#131315] border border-[#2A2A2D]/80 p-4 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#D4A04D]/10 flex items-center justify-center text-[#D4A04D] shrink-0 border border-[#D4A04D]/15">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h4 className="text-white text-xs font-black uppercase tracking-wide">
                NEED 2 FRAMES?
              </h4>
              <p className="text-gray-400 text-[9.5px] font-semibold leading-relaxed mt-0.5">
                Get another frame for just ₹1 anytime before your membership expires.
              </p>
              <div className="flex items-center gap-1 text-gray-500 text-[8px] font-black uppercase tracking-wider mt-1.5 select-none">
                <span className="text-[#D4A04D]">⏱</span> Valid until your Gold Membership expiry date
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0 select-none">
            <span className="text-white text-sm font-black tracking-wide flex items-center gap-1.5">
              ₹1 + ₹1 = <span className="text-[#D4A04D] line-through decoration-red-500 font-extrabold">₹2</span>
            </span>
            <span className="text-gray-500 text-[7px] font-black uppercase tracking-widest mt-0.5">
              TOTAL 2 FRAMES
            </span>
          </div>
        </div>

        {/* 3. Gold Benefits Title */}
        <div className="flex flex-col gap-1 mt-2">
          <div className="flex items-center gap-2 text-white">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
            </svg>
            <h3 className="text-sm font-black uppercase tracking-wider">
              EYEGLAZE GOLD BENEFITS
            </h3>
          </div>
          <p className="text-gray-500 text-[8.5px] font-black uppercase tracking-widest ml-6">
            PREMIUM BENEFITS. MAXIMUM SAVINGS.
          </p>
        </div>

        {/* 4. Grid of 6 Benefit Cards */}
        <div className="grid grid-cols-2 gap-3.5">
          {[
            {
              title: '₹1 PER FRAME',
              desc: 'Get 1 frame for just ₹1. Take another for just ₹1 anytime. (Total 2 Frames = ₹2)',
              icon: (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="12" r="3" />
                  <path d="M9 12h6" />
                </svg>
              )
            },
            {
              title: '1+1 FREE FRAMES',
              desc: 'Buy 1 Get 1 Free on selected frames. Members Only.',
              icon: (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m-3-3h6" />
                </svg>
              )
            },
            {
              title: '90% WALLET REFUND',
              desc: "If you don't take the second frame, get 90% refund to wallet. Valid for 30 days.",
              icon: (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
                  <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              )
            },
            {
              title: '15% CASHBACK',
              desc: '15% cashback on selected frames. Members Only.',
              icon: (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              )
            },
            {
              title: 'FREE EYE TEST',
              desc: 'Partner stores / camps to free eye test for you and your family.',
              icon: (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
                </svg>
              )
            },
            {
              title: 'PRIORITY SUPPORT',
              desc: 'Fast response and priority assistance for all your orders.',
              icon: (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              )
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-[#121213] border border-[#2A2A2D]/80 rounded-2xl p-4 flex flex-col gap-2 shadow-lg hover:border-[#D4A04D]/35 transition-colors">
              <div className="w-8 h-8 rounded-full bg-[#D4A04D]/5 border border-[#D4A04D]/15 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <h4 className="text-white text-[10px] font-black uppercase tracking-wider">{item.title}</h4>
              <p className="text-gray-400 text-[8.5px] font-semibold leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

      </div>

      {/* 5. Sticky Bottom Checkout row */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0E0E0F] border-t border-[#2A2A2D]/85 p-4 shadow-[0_-8px_32px_rgba(0,0,0,0.8)] backdrop-blur-lg flex items-center justify-between max-w-lg mx-auto">
        <div className="flex flex-col select-none">
          <span className="text-white text-[9px] font-black uppercase tracking-widest">
            JOIN GOLD MEMBERSHIP
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-[#D4A04D] text-2xl font-black tracking-wide leading-none">
              ₹129
            </span>
            <span className="text-gray-400 text-[9px] font-black uppercase tracking-wider">
              / YEAR ONLY
            </span>
          </div>
          <span className="text-gray-500 text-[7px] font-black uppercase tracking-widest mt-1">
            UNLOCK ALL PREMIUM BENEFITS
          </span>
        </div>

        <button
          onClick={handleUpgrade}
          disabled={isProcessing}
          className="bg-gradient-to-r from-[#D4A04D] to-[#B3823B] hover:from-[#E6B45C] hover:to-[#C4934C] text-black font-black uppercase px-8 py-3.5 rounded-xl text-xs cursor-pointer active:scale-95 transition-all shadow-md select-none tracking-widest flex items-center gap-1.5 focus:outline-none border-none shrink-0"
        >
          <span>{isProcessing ? 'PROCESSING...' : 'BUY NOW'}</span>
          <span className="text-sm font-light">➔</span>
        </button>
      </div>

    </div>
  );
}
