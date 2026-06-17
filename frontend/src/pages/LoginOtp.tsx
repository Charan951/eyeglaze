import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OtpInput from '../components/ui/OtpInput';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

export default function OtpPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [target, setTarget] = useState<{ mode: string; value: string } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('otp_target');
    if (stored) setTarget(JSON.parse(stored));
    else navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const verify = async () => {
    if (!target || otp.length < 6) return;
    setError('');
    setLoading(true);
    try {
      const body = target.mode === 'mobile'
        ? { phone: target.value, otp }
        : { email: target.value, otp };
      const res = await api.post('/auth/verify-otp', body);
      const data = res.data;
      if (data?.token) {
        localStorage.setItem('token', data.token);
      }
      if (data?.user) {
        login(data.user);
      }
      navigate('/products');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Invalid OTP. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!target) return;
    setTimer(30);
    setError('');
    try {
      const body = target.mode === 'mobile'
        ? { phone: target.value, countryCode: '+91' }
        : { email: target.value };
      await api.post('/auth/send-otp', body);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex flex-col items-center justify-center px-4 py-6">
      <SEO robots="noindex, nofollow" title="Verify OTP" />
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-[#D4A04D] text-3xl font-serif tracking-[0.3em] uppercase font-bold">EYEGLAZE</div>
        </div>

        <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6">
          <button
            onClick={() => navigate('/login')}
            className="text-[#A7A7A7] text-sm mb-5 hover:text-white transition-colors flex items-center gap-1"
          >
            ← Back
          </button>

          <h1 className="text-xl font-bold text-white mb-1">Enter OTP</h1>
          <p className="text-[#A7A7A7] text-sm mb-6">
            Sent to{' '}
            <span className="text-white">
              {target?.mode === 'mobile' ? `+91 ${target.value}` : target?.value}
            </span>
          </p>

          <OtpInput length={6} onComplete={setOtp} onChange={setOtp} />

          {error && <div className="text-red-400 text-sm text-center mt-3">{error}</div>}

          <div className="text-center mt-4 text-sm text-[#A7A7A7]">
            {timer > 0 ? (
              <span>Resend OTP in 0:{String(timer).padStart(2, '0')}</span>
            ) : (
              <button onClick={resend} className="text-[#D4A04D] hover:underline">
                Resend OTP
              </button>
            )}
          </div>

          <button
            onClick={verify}
            disabled={loading || otp.length < 6}
            className="w-full mt-6 bg-[#D4A04D] text-black font-bold uppercase py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'VERIFY'}
          </button>
        </div>
      </div>
    </div>
  );
}
