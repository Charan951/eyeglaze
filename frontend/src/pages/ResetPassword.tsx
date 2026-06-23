import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import SEO from '../components/SEO';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link: Missing verification token. Please request a new link.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Cannot reset password without a valid token.');
      return;
    }
    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(res.data?.message || 'Password has been updated successfully!');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password. The link may have expired or is invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex flex-col items-center justify-center px-4 py-6">
      <SEO robots="noindex, nofollow" title="Reset Password" />
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-[#D4A04D] text-3xl font-serif tracking-[0.3em] uppercase font-bold">EYEGLAZE</div>
        </div>

        <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <h1 className="text-xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-[#A7A7A7] text-xs leading-relaxed mb-6 font-medium">
            Enter and confirm your new secure password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1.5 font-semibold">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter new password"
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

            <div>
              <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1.5 font-semibold">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-3 text-white focus:border-[#D4A04D] focus:outline-none text-sm transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs text-center font-medium">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-400 text-xs text-center font-medium">
                ✓ {success} Redirecting to login...
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full mt-2 bg-[#D4A04D] hover:bg-[#C8923E] text-black font-bold uppercase py-4 rounded-xl transition-all disabled:opacity-50 tracking-wider text-xs shadow-lg hover:shadow-[#D4A04D]/10"
            >
              {loading ? 'Updating password...' : 'Update Password'}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/login')}
              className="text-[#D4A04D] hover:underline text-xs font-semibold focus:outline-none"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
