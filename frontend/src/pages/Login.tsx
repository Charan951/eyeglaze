import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (activeTab === 'register') {
        if (!name || !email || !password) {
          setError('All fields are required');
          setLoading(false);
          return;
        }
        const res = await api.post('/auth/register', { name, email, password });
        const data = res.data;
        if (data?.token) {
          localStorage.setItem('token', data.token);
        }
        if (data?.user) {
          login(data.user);
        }
        setSuccessMsg('Registration successful!');
        redirectUser(data?.user?.role);
      } else {
        if (!email || !password) {
          setError('Email and password are required');
          setLoading(false);
          return;
        }
        const res = await api.post('/auth/login', { email, password });
        const data = res.data;
        if (data?.token) {
          localStorage.setItem('token', data.token);
        }
        if (data?.user) {
          login(data.user);
        }
        redirectUser(data?.user?.role);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (activeTab === 'register' ? 'Registration failed' : 'Invalid email or password');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (role?: string) => {
    const ADMIN_ROLES = ['admin', 'store_manager', 'support_agent'];
    if (role && ADMIN_ROLES.includes(role)) {
      navigate('/admin/dashboard');
    } else {
      const from = location.state?.from 
        ? (location.state.from.pathname + (location.state.from.search || '')) 
        : '/profile';
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex flex-col items-center justify-center px-4 py-6">
      <SEO robots="noindex, nofollow" title={activeTab === 'login' ? "Sign In" : "Sign Up"} />
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-[#D4A04D] text-3xl font-serif tracking-[0.3em] uppercase font-bold">EYEGLAZE</div>
        </div>

        <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-xl">
          {/* Tabs */}
          <div className="flex border-b border-[#2A2A2D] mb-6">
            <button
              onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
              type="button"
              className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wider text-center border-b-2 transition-colors ${
                activeTab === 'login'
                  ? 'border-[#D4A04D] text-[#D4A04D]'
                  : 'border-transparent text-gray-500 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(''); setSuccessMsg(''); }}
              type="button"
              className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wider text-center border-b-2 transition-colors ${
                activeTab === 'register'
                  ? 'border-[#D4A04D] text-[#D4A04D]'
                  : 'border-transparent text-gray-500 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'register' && (
              <div>
                <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1.5 font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-3 text-white focus:border-[#D4A04D] focus:outline-none text-sm transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1.5 font-semibold">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-3 text-white focus:border-[#D4A04D] focus:outline-none text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1.5 font-semibold">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
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

            {successMsg && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-400 text-xs text-center font-medium">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#D4A04D] hover:bg-[#C8923E] text-black font-bold uppercase py-4 rounded-xl transition-all disabled:opacity-50 tracking-wider text-xs"
            >
              {loading ? 'Processing...' : activeTab === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          {/* Trust Badges */}
          <div className="grid grid-cols-4 gap-2 mt-6 border-t border-[#2A2A2D] pt-6">
            {[
              { icon: '🔒', label: '100% Secure' },
              { icon: '⭐', label: '1 Year Warranty' },
              { icon: '↩', label: 'Easy Returns' },
              { icon: '🚀', label: 'Fast Delivery' },
            ].map(({ icon, label }) => (
              <div key={label} className="text-center">
                <div className="text-xl mb-1">{icon}</div>
                <div className="text-[#A7A7A7] text-[10px] leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[#A7A7A7] text-xs mt-6">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-[#D4A04D] underline hover:text-[#C8923E] transition-colors">Terms of Use</a>
          {' '}and{' '}
          <a href="/privacy" className="text-[#D4A04D] underline hover:text-[#C8923E] transition-colors">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
