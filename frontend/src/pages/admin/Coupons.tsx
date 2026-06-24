import { useState, useEffect } from 'react';
import api from '../../lib/api';

interface CouponItem {
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
  usedCount: number;
  isActive: boolean;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [minOrderValue, setMinOrderValue] = useState<number>(0);
  const [maxDiscount, setMaxDiscount] = useState<number>(0);
  const [validTo, setValidTo] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/coupons');
      setCoupons(res.data.coupons || []);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch coupons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDrawerOpen]);

  const openCreateDrawer = () => {
    setEditingId(null);
    setCode('');
    setName('');
    setDescription('');
    setBadge('');
    setDiscountType('percent');
    setDiscountValue(0);
    setMinOrderValue(0);
    setMaxDiscount(0);
    setValidTo('');
    setIsActive(true);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (coupon: CouponItem) => {
    setEditingId(coupon._id);
    setCode(coupon.code);
    setName(coupon.name || '');
    setDescription(coupon.description || '');
    setBadge(coupon.badge || '');
    setDiscountType(coupon.discountType);
    setDiscountValue(coupon.discountValue);
    setMinOrderValue(coupon.minOrderValue || 0);
    setMaxDiscount(coupon.maxDiscount || 0);
    // Format date for datetime-local or date input (YYYY-MM-DD)
    const rawDate = coupon.validTo || coupon.expiresAt;
    if (rawDate) {
      setValidTo(new Date(rawDate).toISOString().split('T')[0]);
    } else {
      setValidTo('');
    }
    setIsActive(coupon.isActive);
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim(),
      badge: badge.trim(),
      discountType,
      discountValue,
      minOrderValue: minOrderValue || undefined,
      maxDiscount: maxDiscount || undefined,
      validTo: validTo ? new Date(validTo).toISOString() : undefined,
      isActive,
    };

    try {
      if (editingId) {
        await api.put(`/admin/coupons/${editingId}`, payload);
        setSuccess('Coupon updated successfully!');
      } else {
        await api.post('/admin/coupons', payload);
        setSuccess('Coupon created successfully!');
      }
      setIsDrawerOpen(false);
      fetchCoupons();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save coupon.');
    }
  };

  const handleToggleActive = async (coupon: CouponItem) => {
    try {
      await api.put(`/admin/coupons/${coupon._id}`, { isActive: !coupon.isActive });
      setCoupons(prev => prev.map(c => c._id === coupon._id ? { ...c, isActive: !c.isActive } : c));
    } catch (err) {
      console.error(err);
      setError('Failed to toggle coupon status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      setSuccess('Coupon deleted successfully!');
      fetchCoupons();
    } catch (err) {
      console.error(err);
      setError('Failed to delete coupon.');
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Coupons & Offers</h1>
          <p className="text-gray-400 text-xs mt-1">Manage active discount codes and promotions displayed to customers.</p>
        </div>
        <button
          onClick={openCreateDrawer}
          className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-xs uppercase py-2.5 px-5 rounded-lg tracking-wider transition-colors cursor-pointer"
        >
          + Add New Coupon
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/40 text-red-300 p-4 rounded-xl mb-4 text-xs">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-500/40 text-green-300 p-4 rounded-xl mb-4 text-xs">
          {success}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500 py-12 text-sm">Loading coupons...</div>
      ) : coupons.length === 0 ? (
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-12 text-center text-gray-400">
          No coupons found. Click "Add New Coupon" to create one.
        </div>
      ) : (
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-[#A7A7A7] text-xs uppercase border-b border-[#2A2A2D] bg-[#1A1A1C]">
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Details</th>
                  <th className="px-5 py-3">Discount</th>
                  <th className="px-5 py-3">Min Order</th>
                  <th className="px-5 py-3">Expiry</th>
                  <th className="px-5 py-3">Usage</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2D]">
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-[#1A1A1C] transition-colors">
                    <td className="px-5 py-4 font-mono text-[#D4A04D] font-bold tracking-wider">{coupon.code}</td>
                    <td className="px-5 py-4">
                      <div className="text-white font-semibold text-xs">{coupon.name || 'Untitled Coupon'}</div>
                      <div className="text-gray-400 text-[10px] mt-0.5 max-w-xs truncate">{coupon.description || 'No description'}</div>
                      {coupon.badge && (
                        <span className="inline-block bg-[#D4A04D]/10 text-[#D4A04D] text-[8px] font-black uppercase px-2 py-0.5 rounded mt-1.5 border border-[#D4A04D]/20">
                          {coupon.badge}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-white text-xs">
                      {coupon.discountType === 'percent' 
                        ? `${coupon.discountValue}% Off` 
                        : `₹${coupon.discountValue} Flat`}
                      {coupon.maxDiscount ? <div className="text-[9px] text-gray-500 mt-0.5">Cap: ₹{coupon.maxDiscount}</div> : null}
                    </td>
                    <td className="px-5 py-4 text-white text-xs">
                      {coupon.minOrderValue ? `₹${coupon.minOrderValue}` : 'None'}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {coupon.validTo || coupon.expiresAt 
                        ? new Date(coupon.validTo || coupon.expiresAt || '').toLocaleDateString('en-IN') 
                        : 'Never Expires'}
                    </td>
                    <td className="px-5 py-4 text-white text-xs">{coupon.usedCount} times</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleActive(coupon)}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                          coupon.isActive ? 'bg-[#D4A04D]' : 'bg-[#2A2A2D]'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            coupon.isActive ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right space-x-3">
                      <button
                        onClick={() => openEditDrawer(coupon)}
                        className="text-gray-400 hover:text-white transition-colors cursor-pointer text-xs font-bold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(coupon._id)}
                        className="text-red-400 hover:text-red-300 transition-colors cursor-pointer text-xs font-bold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 cursor-default" onClick={() => setIsDrawerOpen(false)} />
          
          <div className="relative w-full max-w-md bg-[#0F0F10] border border-[#2A2A2D] rounded-2xl max-h-[90vh] flex flex-col shadow-2xl z-50 overflow-hidden">
            {/* Fixed Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#2A2A2D] flex-shrink-0">
              <h2 className="text-lg font-bold text-white">
                {editingId ? 'Edit Coupon Code' : 'Add New Coupon'}
              </h2>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form wrapping scrollable content and fixed footer */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
              {/* Scrollable Fields */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase block mb-1.5">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SAVE20"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    disabled={!!editingId}
                    className="w-full bg-[#18181B] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none uppercase font-mono tracking-wider disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase block mb-1.5">Offer Title / Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 20% OFF Frames"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-[#18181B] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase block mb-1.5">Badge / Category Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Bestseller, Welcome, Lenses"
                    value={badge}
                    onChange={e => setBadge(e.target.value)}
                    className="w-full bg-[#18181B] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase block mb-1.5">Description *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Get 20% off prescription luxury aviators..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-[#18181B] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-xs font-bold uppercase block mb-1.5">Discount Type *</label>
                    <select
                      value={discountType}
                      onChange={e => setDiscountType(e.target.value as 'percent' | 'flat')}
                      className="w-full bg-[#18181B] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none appearance-none pr-8 bg-no-repeat bg-[right_12px_center] cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23D4A04D' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundSize: '1.25rem',
                      }}
                    >
                      <option value="percent">Percentage (%)</option>
                      <option value="flat">Flat Cash (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-400 text-xs font-bold uppercase block mb-1.5">Discount Value *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={discountValue}
                      onChange={e => setDiscountValue(Number(e.target.value))}
                      className="w-full bg-[#18181B] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-xs font-bold uppercase block mb-1.5">Min Order Value (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={minOrderValue}
                      onChange={e => setMinOrderValue(Number(e.target.value))}
                      className="w-full bg-[#18181B] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 text-xs font-bold uppercase block mb-1.5">Max Discount Cap (₹)</label>
                    <input
                      type="number"
                      min={0}
                      disabled={discountType === 'flat'}
                      value={maxDiscount}
                      onChange={e => setMaxDiscount(Number(e.target.value))}
                      className="w-full bg-[#18181B] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase block mb-1.5">Expiry Date</label>
                  <input
                    type="date"
                    value={validTo}
                    onChange={e => setValidTo(e.target.value)}
                    className="w-full bg-[#18181B] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="accent-[#D4A04D] w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="isActive" className="text-white text-xs font-bold uppercase cursor-pointer select-none">
                    Enable coupon immediately
                  </label>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="p-6 border-t border-[#2A2A2D] bg-[#0E0E0F] flex gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 bg-[#1A1A1C] border border-[#2A2A2D] text-white hover:bg-[#2A2A2D] text-xs font-bold uppercase py-3 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#D4A04D] hover:bg-[#C8923E] text-black text-xs font-bold uppercase py-3 rounded-lg transition-colors cursor-pointer"
                >
                  {editingId ? 'Save Changes' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
