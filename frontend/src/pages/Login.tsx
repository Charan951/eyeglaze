import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'choose' | 'mobile' | 'email'>('choose');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const body = mode === 'mobile'
        ? { phone: input, countryCode: '+91' }
        : { email: input };
      await api.post('/auth/send-otp', body);
      sessionStorage.setItem('otp_target', JSON.stringify({ mode, value: input }));
      navigate('/login/otp');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to send OTP';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-[#C9A84C] text-3xl font-serif tracking-[0.3em] uppercase font-bold">EYEGLAZE</div>
          <div className="text-[#888] text-sm mt-1">/ EYEWEAR</div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6">
          {mode === 'choose' ? (
            <>
              <h1 className="text-xl font-bold text-white text-center mb-1">Welcome to EyeGlaze</h1>
              <p className="text-[#888] text-sm text-center mb-6">Login / Sign up to continue</p>

              <div className="space-y-3">
                <button
                  onClick={() => setMode('mobile')}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl p-4 text-left flex items-center gap-4 hover:border-[#C9A84C] transition-colors group"
                >
                  <div className="w-10 h-10 bg-[#C9A84C]/10 rounded-lg flex items-center justify-center text-xl">📱</div>
                  <div>
                    <div className="text-white font-semibold group-hover:text-[#C9A84C] transition-colors">Continue with Mobile Number</div>
                    <div className="text-[#888] text-xs mt-0.5">Login or sign up with OTP</div>
                  </div>
                </button>

                <button
                  onClick={() => setMode('email')}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl p-4 text-left flex items-center gap-4 hover:border-[#C9A84C] transition-colors group"
                >
                  <div className="w-10 h-10 bg-[#C9A84C]/10 rounded-lg flex items-center justify-center text-xl">✉️</div>
                  <div>
                    <div className="text-white font-semibold group-hover:text-[#C9A84C] transition-colors">Continue with Email</div>
                    <div className="text-[#888] text-xs mt-0.5">Login or sign up with OTP</div>
                  </div>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-4 gap-2 mt-6">
                {[
                  { icon: '🔒', label: '100% Secure' },
                  { icon: '⭐', label: '1 Year Warranty' },
                  { icon: '↩', label: 'Easy Returns' },
                  { icon: '🚀', label: 'Fast Delivery' },
                ].map(({ icon, label }) => (
                  <div key={label} className="text-center">
                    <div className="text-xl mb-1">{icon}</div>
                    <div className="text-[#888] text-[10px] leading-tight">{label}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => { setMode('choose'); setInput(''); setError(''); }}
                className="text-[#888] text-sm mb-4 hover:text-white transition-colors flex items-center gap-1"
              >
                ← Back
              </button>

              <h1 className="text-xl font-bold text-white mb-1">
                {mode === 'mobile' ? 'Enter Mobile Number' : 'Enter Email Address'}
              </h1>
              <p className="text-[#888] text-sm mb-5">We will send you an OTP to verify</p>

              <div className="space-y-3">
                {mode === 'mobile' ? (
                  <div className="flex gap-2">
                    <div className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl px-3 py-3 text-white text-sm flex-shrink-0">
                      +91
                    </div>
                    <input
                      type="tel"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder="Enter mobile number"
                      maxLength={10}
                      className="flex-1 bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white focus:border-[#C9A84C] focus:outline-none"
                    />
                  </div>
                ) : (
                  <input
                    type="email"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white focus:border-[#C9A84C] focus:outline-none"
                  />
                )}

                {error && <div className="text-red-400 text-sm">{error}</div>}

                <button
                  onClick={sendOtp}
                  disabled={loading || !input}
                  className="w-full bg-[#C9A84C] text-black font-bold uppercase py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'SEND OTP'}
                </button>

                <div className="text-center">
                  <button
                    onClick={() => { setMode(mode === 'mobile' ? 'email' : 'mobile'); setInput(''); }}
                    className="text-[#C9A84C] text-sm hover:underline"
                  >
                    {mode === 'mobile' ? 'Continue with Email' : 'Continue with Mobile Number'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-[#888] text-xs mt-6">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-[#C9A84C] underline">Terms of Use</a>
          {' '}and{' '}
          <a href="/privacy" className="text-[#C9A84C] underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
