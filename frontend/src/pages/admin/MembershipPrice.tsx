import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Crown } from 'lucide-react';

const DEFAULT_PRICE = 129;

export default function AdminMembershipPricePage() {
  const [price, setPrice] = useState(String(DEFAULT_PRICE));
  const [savedPrice, setSavedPrice] = useState(DEFAULT_PRICE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/admin/settings')
      .then((res) => {
        const value = Number(res.data?.settings?.membershipPrice);
        const next = Number.isFinite(value) && value > 0 ? Math.round(value) : DEFAULT_PRICE;
        setPrice(String(next));
        setSavedPrice(next);
      })
      .catch(() => {
        setError('Failed to load membership price. Please refresh the page.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(price);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter a valid price greater than 0.');
      return;
    }
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await api.put('/admin/settings', { membershipPrice: Math.round(parsed) });
      const next = Math.round(Number(res.data?.settings?.membershipPrice) || parsed);
      setPrice(String(next));
      setSavedPrice(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save membership price.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#A7A7A7]">
        <div className="w-8 h-8 border-4 border-[#D4A04D] border-t-transparent rounded-full animate-spin" />
        <span>Loading membership price...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Membership Price</h1>
        <p className="text-gray-500 text-xs">
          Sets the Gold Membership annual fee for the website and the mobile app.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#D4A04D]/10 border border-[#D4A04D]/30 flex items-center justify-center">
            <Crown className="w-5 h-5 text-[#D4A04D]" />
          </div>
          <div>
            <p className="text-white text-sm font-bold">Gold Membership</p>
            <p className="text-gray-500 text-[11px]">Currently ₹{savedPrice} / year</p>
          </div>
        </div>

        <label className="block">
          <span className="text-[#D4A04D] text-[10px] font-black uppercase tracking-widest">Annual price (₹)</span>
          <input
            type="text"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ''))}
            className="mt-2 w-full bg-[#0E0E0F] border border-[#2A2A2D] rounded-xl px-4 py-3 text-white text-lg font-bold focus:border-[#D4A04D] focus:outline-none"
          />
        </label>

        <p className="text-gray-500 text-[11px] leading-relaxed">
          Customers see this price on membership screens, cart, checkout, and Razorpay. Changing it does not affect members who already paid.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#D4A04D] hover:bg-[#C8923E] disabled:opacity-50 text-black font-extrabold text-xs uppercase tracking-wider px-5 py-3 rounded-xl border-none cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save price'}
          </button>
          {saved && (
            <span className="text-green-400 text-xs font-bold">Saved. Web and mobile will use ₹{savedPrice}.</span>
          )}
        </div>
      </form>
    </div>
  );
}
