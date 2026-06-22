import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

  const benefits = [
    {
      icon: '👑',
      title: '₹1 Frames',
      description: 'Get select premium frames for just ₹1'
    },
    {
      icon: '🎉',
      title: 'Buy 1 Get 1 Free',
      description: 'BOGO offer on all gold membership frames'
    },
    {
      icon: '💰',
      title: '5% Cashback',
      description: 'Earn 5% cashback on every order'
    },
    {
      icon: '🚀',
      title: 'Priority Support',
      description: 'Get 24/7 priority customer support'
    },
    {
      icon: '🎁',
      title: 'Exclusive Offers',
      description: 'Early access to sales and special discounts'
    },
    {
      icon: '📦',
      title: 'Free Shipping',
      description: 'Free shipping on all orders'
    }
  ];

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
        key: 'rzp_test_STX1H1R9XvVjSZ', // Razorpay TEST Key ID
        amount: 12900, // ₹129 in paise (129 * 100)
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

  return (
    <div className="space-y-8">
      <SEO 
        title="EyeGlaze Gold Membership"
        description="Upgrade to EyeGlaze Gold Membership and unlock exclusive benefits including ₹1 frames, BOGO offers, 5% cashback, and more!"
        keywords="eyeglaze gold membership, premium eyewear benefits, exclusive offers"
      />

      {/* Header */}
      <div className="flex flex-col gap-3 max-w-3xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-[2px] bg-[#D4A04D]" />
          <span className="text-[#D4A04D] text-xs font-bold tracking-widest uppercase">Premium</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          {user?.membershipActive 
            ? 'You are a Gold Member!' 
            : 'Upgrade to Gold Membership'}
        </h1>
        <p className="text-gray-400 text-sm">
          {user?.membershipActive 
            ? `Your membership expires on ${user.membershipExpiry ? new Date(user.membershipExpiry as string | number | Date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}` 
            : 'Unlock exclusive benefits and elevate your eyewear experience with EyeGlaze Gold Membership'}
        </p>
      </div>

      {/* Membership Card */}
      <div className="relative overflow-hidden rounded-3xl border border-[#D4A04D]/40 bg-gradient-to-br from-[#2A1F0E] via-[#1A140A] to-[#0D0B07] p-8 md:p-12 shadow-[0_0_40px_rgba(212,160,77,0.15)]">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#D4A04D]/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-[#D4A04D]/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#D4A04D] to-[#8B6524] flex items-center justify-center text-4xl">
                👑
              </div>
              <div>
                <h3 className="text-2xl font-extrabold">Gold Membership</h3>
                <p className="text-[#D4A04D] text-sm font-bold">₹129 / Year</p>
              </div>
            </div>
            
            <p className="text-gray-300 text-sm max-w-md">
              Join thousands of happy customers enjoying premium benefits. Upgrade today and start saving!
            </p>
          </div>

          {user?.membershipActive ? (
            <div className="flex flex-col items-end gap-2">
              <span className="px-6 py-2 rounded-full bg-[#D4A04D]/20 text-[#D4A04D] font-bold border border-[#D4A04D]/40 rounded-full">
                ✓ Active
              </span>
              <Link to="/profile" className="text-gray-400 hover:text-[#D4A04D] transition-colors">
                Go to Account →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={handleUpgrade}
                disabled={isProcessing}
                className="px-10 py-4 bg-gradient-to-r from-[#D4A04D] to-[#B3823B] hover:from-[#E6B45C] hover:to-[#C4934C] text-black font-bold rounded-xl transition-all disabled:opacity-50 text-lg uppercase tracking-wider"
              >
                {isProcessing ? 'Processing...' : 'Upgrade Now - ₹129'}
              </button>
              <button
                onClick={async () => {
                  setIsProcessing(true);
                  try {
                    await api.post('/auth/membership/activate', { paymentMethod: 'razorpay' });
                    await checkAuth();
                    alert('🎉 Test: Gold Membership activated successfully! Enjoy your benefits!');
                  } catch (err: any) {
                    alert('Failed to activate membership: ' + (err.response?.data?.error || err.message));
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                disabled={isProcessing}
                className="px-10 py-4 bg-transparent border-2 border-dashed border-[#D4A04D] text-[#D4A04D] font-bold rounded-xl hover:bg-[#D4A04D]/10 transition-all disabled:opacity-50 text-sm uppercase tracking-wider"
              >
                Test Activation (Skip Payment)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-extrabold">What you get</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, idx) => (
            <div 
              key={idx}
              className="bg-[#131314] border border-[#2A2A2D] hover:border-[#D4A04D]/40 transition-all duration-300 rounded-2xl p-6"
            >
              <div className="text-4xl mb-3">{benefit.icon}</div>
              <h3 className="text-white text-lg font-bold mb-2">{benefit.title}</h3>
              <p className="text-gray-400 text-sm">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
