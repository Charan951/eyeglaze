import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

// Mirrors the identifier-detection heuristics used by the mobile app's
// login_screen.dart: a single field accepts either an email or a 10-digit
// Indian mobile number, and the flow branches from there.
const looksLikeEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim());
const looksLikePhone = (value: string) => /^[6-9]\d{9}$/.test(value.trim());

type Step = 'identifier' | 'details';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<Step>('identifier');

  // Form fields
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleMode = () => {
    setMode(m => (m === 'login' ? 'register' : 'login'));
    setError('');
    setPassword('');
  };

  const redirectUser = (role?: string, hasCartItems = false) => {
    const ADMIN_ROLES = ['admin', 'store_manager', 'support_agent'];
    if (role && ADMIN_ROLES.includes(role)) {
      navigate('/admin/dashboard');
      return;
    }

    let from = location.state?.from;

    // If they have items in the cart, and their destination is not explicitly set, or is the cart page, redirect to checkout
    if (hasCartItems) {
      if (!from || from.pathname === '/cart' || from.pathname === '/') {
        from = { pathname: '/checkout' };
      }
    }

    const targetPath = from
      ? (from.pathname + (from.search || ''))
      : '/';

    navigate(targetPath, {
      state: location.state?.checkoutState,
      replace: true
    });
  };

  // Step 1: identifier entry. A phone number sends an OTP immediately
  // (matching mobile), an email reveals the password (+ name) fields in
  // place instead of navigating away.
  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const value = identifier.trim();

    if (looksLikePhone(value)) {
      setLoading(true);
      try {
        await api.post('/auth/send-otp', { phone: value, countryCode: '+91' });
        sessionStorage.setItem('otp_target', JSON.stringify({ mode: 'mobile', value }));
        navigate('/login/otp');
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Could not send OTP. Please try again.';
        setError(message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (looksLikeEmail(value)) {
      setStep('details');
      return;
    }

    setError('Enter a valid email address or 10-digit mobile number');
  };

  // Step 2: email + password (+ name for registration).
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const guestCartStr = localStorage.getItem('guest_cart');
      const hasGuestCartItems = guestCartStr ? JSON.parse(guestCartStr).length > 0 : false;

      if (mode === 'register') {
        if (!name || !password) {
          setError('All fields are required');
          setLoading(false);
          return;
        }
        const res = await api.post('/auth/register', { name, email: identifier.trim(), password });
        const data = res.data;
        if (data?.user) await login(data.user);
        redirectUser(data?.user?.role, hasGuestCartItems);
      } else {
        if (!password) {
          setError('Password is required');
          setLoading(false);
          return;
        }
        const res = await api.post('/auth/login', { email: identifier.trim(), password });
        const data = res.data;
        if (data?.user) await login(data.user);
        redirectUser(data?.user?.role, hasGuestCartItems);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (mode === 'register' ? 'Registration failed' : 'Invalid email or password');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-end sm:items-center sm:justify-center bg-[#0B0B0C]">
      <SEO robots="noindex, nofollow" title={mode === 'login' ? 'Sign In' : 'Sign Up'} />

      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full sm:max-w-sm bg-[#131314] border-t sm:border border-[#2A2A2D] rounded-t-3xl sm:rounded-3xl px-6 pt-4 pb-6 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        {/* Drag handle — bottom-sheet affordance on mobile only */}
        <div className="sm:hidden w-10 h-1 rounded-full bg-[#2A2A2D] mx-auto mb-5" />

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-[#D4A04D] text-2xl sm:text-3xl font-serif tracking-[0.3em] uppercase font-bold">EYEGLAZE</div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {step === 'identifier' ? (
            <motion.div
              key="identifier"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
            >
              <h1 className="text-white text-xl font-extrabold mb-1">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="text-[#A7A7A7] text-sm mb-6">
                Enter your email or mobile number to continue
              </p>

              <form onSubmit={handleIdentifierSubmit} className="space-y-4">
                <div>
                  <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1.5 font-semibold">
                    Email or Mobile Number
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={identifier}
                    onChange={e => { setIdentifier(e.target.value); setError(''); }}
                    placeholder="you@example.com or 9876543210"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-3 text-white focus:border-[#D4A04D] focus:outline-none text-sm transition-colors"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs text-center font-medium">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-[#D4A04D] hover:bg-[#C8923E] text-black font-bold uppercase py-4 rounded-xl transition-all disabled:opacity-50 tracking-wider text-xs"
                >
                  {loading ? 'Please wait...' : 'Continue'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18 }}
            >
              <button
                type="button"
                onClick={() => { setStep('identifier'); setError(''); }}
                className="text-[#A7A7A7] text-sm mb-4 hover:text-white transition-colors flex items-center gap-1"
              >
                ← Back
              </button>

              <h1 className="text-white text-xl font-extrabold mb-1">
                {mode === 'login' ? 'Sign In' : 'Sign Up'}
              </h1>
              <p className="text-[#A7A7A7] text-sm mb-6 truncate">
                Continuing as <span className="text-white">{identifier.trim()}</span>
              </p>

              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1.5 font-semibold">Full Name</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-3 text-white focus:border-[#D4A04D] focus:outline-none text-sm transition-colors"
                    />
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide font-semibold">Password</label>
                    {mode === 'login' && (
                      <Link to="/forgot-password" className="text-[#D4A04D] hover:underline text-xs font-semibold">
                        Forgot Password?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoFocus={mode === 'login'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl pl-4 pr-16 py-3 text-white focus:border-[#D4A04D] focus:outline-none text-sm transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs font-bold tracking-wider focus:outline-none"
                    >
                      {showPassword ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs text-center font-medium">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-[#D4A04D] hover:bg-[#C8923E] text-black font-bold uppercase py-4 rounded-xl transition-all disabled:opacity-50 tracking-wider text-xs"
                >
                  {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sign in / Sign up toggle — a text link, matching the mobile app's pattern */}
        <p className="text-center text-[#A7A7A7] text-xs mt-6">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={toggleMode}
            className="text-[#D4A04D] hover:underline font-semibold"
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>

        <p className="text-center text-[#A7A7A7] text-xs mt-6 border-t border-[#2A2A2D] pt-6">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="text-[#D4A04D] underline hover:text-[#C8923E] transition-colors">Terms of Use</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-[#D4A04D] underline hover:text-[#C8923E] transition-colors">Privacy Policy</Link>
        </p>
      </motion.div>
    </div>
  );
}
