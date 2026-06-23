import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import SEO from '../components/SEO';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email address is required');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccess(res.data?.message || 'A password reset link has been sent to your email.');
      setEmail('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex flex-col items-center justify-center px-4 py-6">
      <SEO robots="noindex, nofollow" title="Forgot Password" />
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-[#D4A04D] text-3xl font-serif tracking-[0.3em] uppercase font-bold">EYEGLAZE</div>
        </div>

        <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <button
            onClick={() => navigate('/login')}
            className="text-[#A7A7A7] text-sm mb-5 hover:text-white transition-colors flex items-center gap-1 font-semibold focus:outline-none"
          >
            ← Back to Sign In
          </button>

          <h1 className="text-xl font-bold text-white mb-2">Forgot Password</h1>
          <p className="text-[#A7A7A7] text-xs leading-relaxed mb-6 font-medium">
            Enter the email address associated with your account. We will send you a secure link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1.5 font-semibold">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-3 text-white focus:border-[#D4A04D] focus:outline-none text-sm transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs text-center font-medium animate-pulse">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-400 text-xs text-center font-medium">
                ✉️ {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#D4A04D] hover:bg-[#C8923E] text-black font-bold uppercase py-4 rounded-xl transition-all disabled:opacity-50 tracking-wider text-xs shadow-lg hover:shadow-[#D4A04D]/10"
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
