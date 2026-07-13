import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { socket } from '../../lib/socket';

interface CouponItem {
  _id: string;
  code: string;
  name: string;
  description: string;
  badge?: string;
  discountType: 'percent' | 'flat' | 'bogo' | 'buy_x_get_y' | 'free_shipping' | 'cashback' | 'wallet_credit' | 'gift';
  couponType: string;
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
  autoApply: boolean;
  priority: number;
  stackable: boolean;
  exclusive: boolean;
  usageLimitPerUser: number;
  usageLimitTotal: number;
  usedCount: number;
  countryRestrictions?: string[];
  stateRestrictions?: string[];
  cityRestrictions?: string[];
  customerGroups?: string[];
  membershipRequired: boolean;
  newUserOnly: boolean;
  firstPurchaseOnly: boolean;
  paymentMethodRestrictions?: string[];
  shippingMethodRestrictions?: string[];
  applicableCategories?: string[];
  applicableBrands?: string[];
  buyQty?: number;
  getQty?: number;
}

interface AnalyticsItem {
  _id: string;
  code: string;
  usages: number;
  revenue: number;
  discountAmount: number;
  failureCount: number;
}

interface DashboardCounters {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  todayUsages: number;
  todayDiscount: number;
  todayRevenue: number;
  totalDiscountGiven: number;
  totalUsagesCount: number;
}

interface UsageLog {
  _id: string;
  couponId: { code: string; name: string };
  userId: { name: string; email: string; mobile: string };
  orderId: string;
  discountApplied: number;
  transactionAmount: number;
  status: string;
  usedAt: string;
}

interface AuditLogItem {
  _id: string;
  targetId: string;
  action: string;
  performedBy: { name: string; role: string };
  performedByName: string;
  changes?: Record<string, any>;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'analytics' | 'bulk' | 'logs'>('list');
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dashboard & Logs State
  const [counters, setCounters] = useState<DashboardCounters | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsItem[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [discountType, setDiscountType] = useState<CouponItem['discountType']>('percent');
  const [couponType, setCouponType] = useState('Standard');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [minOrderValue, setMinOrderValue] = useState<number>(0);
  const [maxDiscount, setMaxDiscount] = useState<number>(0);
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [buyQty, setBuyQty] = useState<number>(1); // Added for BOGO
  const [getQty, setGetQty] = useState<number>(1); // Added for BOGO
  
  // Advanced Form Fields
  const [autoApply, setAutoApply] = useState(false);
  const [priority, setPriority] = useState(0);
  const [stackable, setStackable] = useState(false);
  const [exclusive, setExclusive] = useState(true);
  const [usageLimitPerUser, setUsageLimitPerUser] = useState(1);
  const [usageLimitTotal, setUsageLimitTotal] = useState(0);
  const [countries, setCountries] = useState('');
  const [states, setStates] = useState('');
  const [cities, setCities] = useState('');
  const [membershipRequired, setMembershipRequired] = useState(false);
  const [newUserOnly, setNewUserOnly] = useState(false);
  const [firstPurchaseOnly, setFirstPurchaseOnly] = useState(false);
  const [paymentRestrictions, setPaymentRestrictions] = useState('');
  const [shippingRestrictions, setShippingRestrictions] = useState('');
  const [categories, setCategories] = useState('');
  const [brands, setBrands] = useState('');

  // Bulk Import State
  const [importJson, setImportJson] = useState('');

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/coupons', {
        params: {
          search: searchQuery,
          couponType: typeFilter || undefined,
          isActive: statusFilter === 'active' ? 'true' : statusFilter === 'inactive' ? 'false' : undefined,
        }
      });
      setCoupons(res.data.coupons || []);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch coupons.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const dashRes = await api.get('/admin/coupons/dashboard');
      setCounters(dashRes.data.counters);
      setAuditLogs(dashRes.data.auditLogs || []);
      
      const analyticRes = await api.get('/admin/coupons/analytics');
      setAnalytics(analyticRes.data.stats || []);
      
      const reportsRes = await api.get('/admin/coupons/reports');
      setUsageLogs(reportsRes.data.usages || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'list') {
      fetchCoupons();
    } else {
      fetchDashboardData();
    }
  }, [activeTab, searchQuery, typeFilter, statusFilter]);

  // Real-time socket updates for coupons
  useEffect(() => {
    const handleCouponChanged = () => {
      fetchCoupons();
      fetchDashboardData();
    };

    socket.on('coupon_changed', handleCouponChanged);

    return () => {
      socket.off('coupon_changed', handleCouponChanged);
    };
  }, []);

  const openCreateDrawer = () => {
    setError('');
    setSuccess('');
    setEditingId(null);
    setCode('');
    setName('');
    setDescription('');
    setBadge('');
    setDiscountType('flat');
    setCouponType('Standard');
    setDiscountValue(0);
    setMinOrderValue(0);
    setMaxDiscount(0);
    setValidFrom('');
    setValidTo('');
    setIsActive(true);
    setBuyQty(1);
    setGetQty(1);
    
    // Advanced fields
    setAutoApply(false);
    setPriority(0);
    setStackable(false);
    setExclusive(true);
    setUsageLimitPerUser(1);
    setUsageLimitTotal(0);
    setCountries('');
    setStates('');
    setCities('');
    setMembershipRequired(false);
    setNewUserOnly(false);
    setFirstPurchaseOnly(false);
    setPaymentRestrictions('');
    setShippingRestrictions('');
    setCategories('');
    setBrands('');
    
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (coupon: CouponItem) => {
    setError('');
    setSuccess('');
    setEditingId(coupon._id);
    setCode(coupon.code);
    setName(coupon.name || '');
    setDescription(coupon.description || '');
    setBadge(coupon.badge || '');
    setDiscountType(coupon.discountType);
    setCouponType(coupon.couponType || 'Standard');
    setDiscountValue(coupon.discountValue);
    setMinOrderValue(coupon.minOrderValue || 0);
    setMaxDiscount(coupon.maxDiscount || 0);
    
    if (coupon.validFrom) setValidFrom(new Date(coupon.validFrom).toISOString().split('T')[0]);
    else setValidFrom('');
    if (coupon.validTo) setValidTo(new Date(coupon.validTo).toISOString().split('T')[0]);
    else setValidTo('');
    
    setIsActive(coupon.isActive);
    setBuyQty(coupon.buyQty || 1);
    setGetQty(coupon.getQty || 1);
    setAutoApply(coupon.autoApply || false);
    setPriority(coupon.priority || 0);
    setStackable(coupon.stackable || false);
    setExclusive(coupon.exclusive !== false);
    setUsageLimitPerUser(coupon.usageLimitPerUser || 1);
    setUsageLimitTotal(coupon.usageLimitTotal || 0);
    setCountries(coupon.countryRestrictions?.join(', ') || '');
    setStates(coupon.stateRestrictions?.join(', ') || '');
    setCities(coupon.cityRestrictions?.join(', ') || '');
    setMembershipRequired(coupon.membershipRequired || false);
    setNewUserOnly(coupon.newUserOnly || false);
    setFirstPurchaseOnly(coupon.firstPurchaseOnly || false);
    setPaymentRestrictions(coupon.paymentMethodRestrictions?.join(', ') || '');
    setShippingRestrictions(coupon.shippingMethodRestrictions?.join(', ') || '');
    setCategories(coupon.applicableCategories?.join(', ') || '');
    setBrands(coupon.applicableBrands?.join(', ') || '');
    
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      code: code.trim().toUpperCase(),
      name: code.trim().toUpperCase(),
      description: description.trim(),
      badge: undefined,
      discountType,
      couponType,
      discountValue,
      minOrderValue: minOrderValue || undefined,
      maxDiscount: undefined,
      validFrom: validFrom ? new Date(validFrom).toISOString() : undefined,
      validTo: validTo ? new Date(validTo).toISOString() : undefined,
      isActive,
      
      autoApply,
      priority: 0,
      stackable,
      exclusive,
      usageLimitPerUser,
      usageLimitTotal,
      countryRestrictions: countries ? countries.split(',').map(s => s.trim()) : [],
      stateRestrictions: [],
      cityRestrictions: cities ? cities.split(',').map(s => s.trim()) : [],
      membershipRequired,
      newUserOnly,
      firstPurchaseOnly,
      paymentMethodRestrictions: [],
      shippingMethodRestrictions: shippingRestrictions ? shippingRestrictions.split(',').map(s => s.trim()) : [],
      applicableCategories: [],
      applicableBrands: [],
      buyQty,
      getQty,
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

  const handleDuplicate = async (id: string) => {
    setError('');
    setSuccess('');
    try {
      await api.post(`/admin/coupons/${id}/duplicate`);
      setSuccess('Coupon duplicated successfully!');
      fetchCoupons();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to duplicate coupon.');
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

  const handleImport = async () => {
    setError('');
    setSuccess('');
    try {
      const parsed = JSON.parse(importJson);
      const res = await api.post('/admin/coupons/import', { coupons: parsed });
      setSuccess(res.data.message);
      setImportJson('');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Import failed. Check JSON format.');
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/admin/coupons/export');
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data.coupons, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "eyeglaze_coupons.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="relative pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Coupon & Promotions Control Center</h1>
          <p className="text-gray-400 text-sm mt-1">Manage marketing campaigns, cashback incentives, auto-promotions, and target groups.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={openCreateDrawer}
            className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-xs uppercase py-3 px-6 rounded-xl tracking-wider transition-all cursor-pointer shadow-lg hover:shadow-[#D4A04D]/10"
          >
            + Create Coupon
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-[#2A2A2D] mb-6 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('list')}
          className={`py-3 px-6 text-xs uppercase font-extrabold tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'list'
              ? 'border-[#D4A04D] text-[#D4A04D]'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          📋 Coupons List
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-3 px-6 text-xs uppercase font-extrabold tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'analytics'
              ? 'border-[#D4A04D] text-[#D4A04D]'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          📊 Dashboard & Analytics
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`py-3 px-6 text-xs uppercase font-extrabold tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'bulk'
              ? 'border-[#D4A04D] text-[#D4A04D]'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          📥 Bulk Operations
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`py-3 px-6 text-xs uppercase font-extrabold tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'logs'
              ? 'border-[#D4A04D] text-[#D4A04D]'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          📝 Audit & Usage Logs
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/40 text-red-300 p-4 rounded-xl mb-4 text-xs font-bold">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-500/40 text-green-300 p-4 rounded-xl mb-4 text-xs font-bold">
          {success}
        </div>
      )}

      {/* TAB 1: LIST VIEW */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-[#131314] border border-[#2A2A2D] p-5 rounded-2xl flex flex-wrap gap-4 items-center">
            <input
              type="text"
              placeholder="Search by Code or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[200px] bg-[#18181B] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-xs focus:border-[#D4A04D] focus:outline-none"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#18181B] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-xs focus:border-[#D4A04D] focus:outline-none appearance-none pr-8 bg-no-repeat bg-[right_12px_center] cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23D4A04D' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundSize: '1.25rem',
              }}
            >
              <option value="">All Types</option>
              <option value="Standard">Standard Coupon</option>
              <option value="BOGO">Buy One Get One Offer</option>
              <option value="FirstOrder">First Order</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#18181B] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-xs focus:border-[#D4A04D] focus:outline-none appearance-none pr-8 bg-no-repeat bg-[right_12px_center] cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23D4A04D' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundSize: '1.25rem',
              }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-12 text-sm">Loading promotions...</div>
          ) : coupons.length === 0 ? (
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-12 text-center text-gray-400">
              No promotions matched search criteria.
            </div>
          ) : (
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase border-b border-[#2A2A2D] bg-[#1C1C1E]">
                      <th className="px-6 py-4">Code / Type</th>
                      <th className="px-6 py-4">Campaign Details</th>
                      <th className="px-6 py-4">Value</th>
                      <th className="px-6 py-4">Limits (Used/Total)</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A2D]">
                    {coupons.map((coupon) => (
                      <tr key={coupon._id} className="hover:bg-[#18181A] transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-[#D4A04D] font-bold text-sm tracking-wider block">{coupon.code}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-black">{coupon.couponType}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white font-semibold text-xs">{coupon.name}</div>
                          <div className="text-gray-400 text-[10px] mt-0.5 max-w-sm truncate">{coupon.description}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white text-xs font-bold block">
                            {coupon.discountType === 'percent' ? `${coupon.discountValue}% OFF` : coupon.discountType === 'flat' ? `₹${coupon.discountValue} FLAT` : coupon.discountType.toUpperCase()}
                          </span>
                          {coupon.maxDiscount ? <span className="text-[10px] text-gray-500">Cap: ₹{coupon.maxDiscount}</span> : null}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className="text-white block font-medium">{coupon.usedCount} used</span>
                          <span className="text-gray-500 text-[10px]">{coupon.usageLimitTotal > 0 ? `Limit: ${coupon.usageLimitTotal}` : 'Unlimited'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            coupon.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {coupon.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button
                            onClick={() => openEditDrawer(coupon)}
                            className="text-gray-400 hover:text-white transition-colors cursor-pointer text-xs font-bold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDuplicate(coupon._id)}
                            className="text-orange-400 hover:text-orange-300 transition-colors cursor-pointer text-xs font-bold"
                          >
                            Duplicate
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
        </div>
      )}

      {/* TAB 2: ANALYTICS DASHBOARD */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Analytics Counters */}
          {counters && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#131314] border border-[#2A2A2D] p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                <span className="text-gray-400 text-xs font-black uppercase tracking-widest block mb-2">Total Coupons</span>
                <span className="text-4xl font-extrabold text-white tracking-tight">{counters.totalCoupons}</span>
                <span className="text-gray-500 text-[10px] mt-2 block">All created items</span>
              </div>
              <div className="bg-[#131314] border border-[#2A2A2D] p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                <span className="text-gray-400 text-xs font-black uppercase tracking-widest block mb-2">Active Campaigns</span>
                <span className="text-4xl font-extrabold text-green-400 tracking-tight">{counters.activeCoupons}</span>
                <span className="text-green-500/80 text-[10px] mt-2 block">Live in store</span>
              </div>
              <div className="bg-[#131314] border border-[#2A2A2D] p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                <span className="text-gray-400 text-xs font-black uppercase tracking-widest block mb-2">Total Discount Given</span>
                <span className="text-4xl font-extrabold text-[#D4A04D] tracking-tight">₹{counters.totalDiscountGiven}</span>
                <span className="text-gray-500 text-[10px] mt-2 block">Net savings given</span>
              </div>
              <div className="bg-[#131314] border border-[#2A2A2D] p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                <span className="text-gray-400 text-xs font-black uppercase tracking-widest block mb-2">Today Usages</span>
                <span className="text-4xl font-extrabold text-blue-400 tracking-tight">{counters.todayUsages}</span>
                <span className="text-gray-500 text-[10px] mt-2 block">Grossing ₹{counters.todayRevenue} today</span>
              </div>
            </div>
          )}

          {/* Top Performance Analytics Table */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-[#131314] border border-[#2A2A2D] p-6 rounded-2xl shadow-xl">
              <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-4">🏆 Top Performing Coupon Codes</h2>
              {analytics.length === 0 ? (
                <div className="text-center text-gray-500 text-xs py-12">No usage analytics recorded yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-gray-500 border-b border-[#2A2A2D] uppercase font-bold">
                        <th className="py-2.5">Code</th>
                        <th className="py-2.5">Usages</th>
                        <th className="py-2.5">Discount Given</th>
                        <th className="py-2.5">Revenue Generated</th>
                        <th className="py-2.5">Failure rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2A2D]/40">
                      {analytics.map((a) => (
                        <tr key={a._id} className="text-gray-300">
                          <td className="py-3 font-mono font-bold text-[#D4A04D] uppercase">{a.code}</td>
                          <td className="py-3">{a.usages}</td>
                          <td className="py-3">₹{a.discountAmount}</td>
                          <td className="py-3 text-white">₹{a.revenue}</td>
                          <td className="py-3 text-red-400 font-bold">{a.failureCount} fails</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Failure Reason Analysis Panel */}
            <div className="bg-[#131314] border border-[#2A2A2D] p-6 rounded-2xl shadow-xl">
              <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-4">⚠️ Coupon Rejection Metrics</h2>
              <div className="space-y-4">
                <div className="bg-[#1C1C1E] border border-[#2D2D30] p-4 rounded-xl">
                  <span className="text-gray-400 text-[10px] font-black uppercase tracking-wider block mb-1">Coupon Expired</span>
                  <div className="w-full bg-[#2A2A2D] h-2 rounded-full overflow-hidden">
                    <div className="bg-red-400 h-full rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <span className="text-red-400 text-xs mt-1 block text-right font-bold">45% of failures</span>
                </div>
                <div className="bg-[#1C1C1E] border border-[#2D2D30] p-4 rounded-xl">
                  <span className="text-gray-400 text-[10px] font-black uppercase tracking-wider block mb-1">Cart Minimum Not Met</span>
                  <div className="w-full bg-[#2A2A2D] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#D4A04D] h-full rounded-full" style={{ width: '30%' }}></div>
                  </div>
                  <span className="text-[#D4A04D] text-xs mt-1 block text-right font-bold">30% of failures</span>
                </div>
                <div className="bg-[#1C1C1E] border border-[#2D2D30] p-4 rounded-xl">
                  <span className="text-gray-400 text-[10px] font-black uppercase tracking-wider block mb-1">Ineligible Products</span>
                  <div className="w-full bg-[#2A2A2D] h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-400 h-full rounded-full" style={{ width: '25%' }}></div>
                  </div>
                  <span className="text-blue-400 text-xs mt-1 block text-right font-bold">25% of failures</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BULK IMPORT EXPORT */}
      {activeTab === 'bulk' && (
        <div className="grid lg:grid-cols-2 gap-8 animate-fadeIn">
          {/* JSON Export */}
          <div className="bg-[#131314] border border-[#2A2A2D] p-6 rounded-2xl shadow-xl space-y-4">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">📤 Export Promotion Schema</h2>
            <p className="text-gray-400 text-xs">Download all active, inactive, and legacy coupon definitions as a single formatted JSON catalog.</p>
            <button
              onClick={handleExport}
              className="bg-[#2A2A2D] hover:bg-[#3D3D42] text-white border border-[#3A3A3D] font-extrabold text-xs uppercase py-3 px-6 rounded-xl transition-all cursor-pointer inline-block"
            >
              Start File Export
            </button>
          </div>

          {/* JSON Import */}
          <div className="bg-[#131314] border border-[#2A2A2D] p-6 rounded-2xl shadow-xl space-y-4">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">📥 Import Promotion Catalog</h2>
            <p className="text-gray-400 text-xs">Load multiple coupon definitions from a formatted JSON array payload.</p>
            <textarea
              rows={6}
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='[ { "code": "NEWYEAR", "name": "New Year discount", "description": "Flat 20% off", "discountType": "percent", "couponType": "Standard", "discountValue": 20 } ]'
              className="w-full bg-[#18181B] border border-[#2A2A2D] rounded-xl p-4 text-white text-xs font-mono focus:border-[#D4A04D] focus:outline-none"
            />
            <button
              onClick={handleImport}
              className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-xs uppercase py-3 px-6 rounded-xl transition-all cursor-pointer shadow-lg inline-block"
            >
              Parse & Import JSON
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="grid lg:grid-cols-2 gap-8 animate-fadeIn">
          {/* Coupon Usage History */}
          <div className="bg-[#131314] border border-[#2A2A2D] p-6 rounded-2xl shadow-xl space-y-4">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">🛒 Live Coupon Usage Ledger</h2>
            {usageLogs.length === 0 ? (
              <div className="text-center text-gray-500 text-xs py-12">No transactions recorded yet</div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {usageLogs.map((log) => (
                  <div key={log._id} className="bg-[#1A1A1C] border border-[#2A2A2D] p-4 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[#D4A04D] font-mono font-bold uppercase tracking-wider block">
                        {log.couponId?.code || 'COUPON'} (Order: {log.orderId})
                      </span>
                      <span className="text-gray-400 block mt-0.5">Applied by: {log.userId?.name || 'Guest'}</span>
                      <span className="text-gray-500 text-[10px] block mt-0.5">{new Date(log.usedAt).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-green-400 font-extrabold block">Saved ₹{log.discountApplied}</span>
                      <span className="text-gray-500 text-[10px]">Total Order: ₹{log.transactionAmount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admin modifications Audit Trail */}
          <div className="bg-[#131314] border border-[#2A2A2D] p-6 rounded-2xl shadow-xl space-y-4">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">🔒 Admin Modifications Audit Trail</h2>
            {auditLogs.length === 0 ? (
              <div className="text-center text-gray-500 text-xs py-12">No administrative modifications recorded yet</div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div key={log._id} className="bg-[#1A1A1C] border border-[#2A2A2D] p-4 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold uppercase text-[#D4A04D] bg-[#D4A04D]/5 px-2 py-0.5 border border-[#D4A04D]/10 rounded">
                        {log.action}
                      </span>
                      <span className="text-gray-500 text-[10px]">{new Date(log.createdAt).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-white">
                      Performed by <span className="font-bold">{log.performedByName}</span>
                    </div>
                    {log.changes && (
                      <pre className="bg-black/40 border border-[#2A2A2D] rounded p-2 text-[9px] text-gray-400 overflow-x-auto font-mono">
                        {JSON.stringify(log.changes, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DRAWER FORM FOR CREATE & EDIT */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 cursor-default" onClick={() => setIsDrawerOpen(false)} />
          
          <div className="relative w-full max-w-2xl bg-[#0F0F10] border border-[#2A2A2D] rounded-2xl max-h-[90vh] flex flex-col shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#2A2A2D] flex-shrink-0">
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                {editingId ? '✍️ Modify Campaign Settings' : '✨ Add New Promotion Code'}
              </h2>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-gray-400 hover:text-white cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                {error && (
                  <div className="bg-red-900/20 border border-red-500/40 text-red-300 p-4 rounded-xl text-xs font-bold">
                    {error}
                  </div>
                )}
                
                {/* General Information */}
                <div>
                  <h3 className="text-[#D4A04D] text-xs font-black uppercase tracking-wider border-b border-[#2A2A2D] pb-1.5 mb-4">1. Campaign Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-[10px] font-black uppercase tracking-wider block mb-1.5">Coupon Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. GETSHADES20"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        disabled={!!editingId}
                        className="w-full bg-[#18181B] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none uppercase font-mono tracking-widest disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-[10px] font-black uppercase tracking-wider block mb-1.5">Campaign Classification *</label>
                      <select
                        value={couponType}
                        onChange={e => {
                          const val = e.target.value;
                          setCouponType(val);
                          if (val === 'Standard') {
                            setDiscountType('flat');
                          }
                        }}
                        className="w-full bg-[#18181B] border border-[#2A2A2D] rounded-lg px-3 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none appearance-none pr-8 bg-no-repeat bg-[right_12px_center] cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23D4A04D' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundSize: '1.25rem',
                        }}
                      >
                        <option value="Standard">Standard Coupon</option>
                        <option value="BOGO">Buy One Get One Offer</option>
                        <option value="FirstOrder">First Order Promotion</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-gray-400 text-[10px] font-black uppercase tracking-wider block mb-1.5">Description / Terms *</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="e.g. Valid only on purchase of prescription luxury aviator frames..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full bg-[#18181B] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Calculation settings */}
                <div>
                  <h3 className="text-[#D4A04D] text-xs font-black uppercase tracking-wider border-b border-[#2A2A2D] pb-1.5 mb-4">2. Calculation Parameters</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-[10px] font-black uppercase tracking-wider block mb-1.5">Discount Type *</label>
                      <select
                        value={discountType}
                        disabled={couponType === 'Standard'}
                        onChange={e => setDiscountType(e.target.value as any)}
                        className="w-full bg-[#18181B] border border-[#2A2A2D] rounded-lg px-3 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none appearance-none pr-8 bg-no-repeat bg-[right_12px_center] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23D4A04D' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundSize: '1.25rem',
                        }}
                      >
                        <option value="percent">Percentage (%)</option>
                        <option value="flat">Flat Cash (₹)</option>
                        <option value="bogo">Buy One Get One</option>
                        <option value="buy_x_get_y">Buy X Get Y Free</option>
                        <option value="free_shipping">Free Shipping</option>
                        <option value="cashback">Wallet Cashback</option>
                        <option value="wallet_credit">Wallet Credit</option>
                        <option value="gift">Gift Voucher</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-400 text-[10px] font-black uppercase tracking-wider block mb-1.5">Discount Value *</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={discountValue}
                        onChange={e => setDiscountValue(Number(e.target.value))}
                        className="w-full bg-[#18181B] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                      />
                    </div>
                  </div>

                  {(discountType === 'bogo' || discountType === 'buy_x_get_y') && (
                    <div className="grid grid-cols-2 gap-4 mt-4 bg-[#1C1C1E] border border-[#2D2D30] p-4 rounded-xl">
                      <div>
                        <label className="text-[#D4A04D] text-[10px] font-black uppercase tracking-wider block mb-1.5">Buy Quantity (X) *</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={buyQty}
                          onChange={e => setBuyQty(Number(e.target.value))}
                          className="w-full bg-[#18181B] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[#D4A04D] text-[10px] font-black uppercase tracking-wider block mb-1.5">Get Free Quantity (Y) *</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={getQty}
                          onChange={e => setGetQty(Number(e.target.value))}
                          className="w-full bg-[#18181B] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                        />
                      </div>
                      <p className="col-span-2 text-[10px] text-gray-500 font-medium">
                        💡 Suggestion: Restrict Buy One Get One items in Section 4 below by category, brand, or specific products.
                      </p>
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="text-gray-400 text-[10px] font-black uppercase tracking-wider block mb-1.5">Min Order Value (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={minOrderValue}
                      onChange={e => setMinOrderValue(Number(e.target.value))}
                      className="w-full bg-[#18181B] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Timing & Usage Rules */}
                <div>
                  <h3 className="text-[#D4A04D] text-xs font-black uppercase tracking-wider border-b border-[#2A2A2D] pb-1.5 mb-4">3. Date Boundaries & Usage Limits</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-[10px] font-black uppercase tracking-wider block mb-1.5">Valid From</label>
                      <input
                        type="date"
                        value={validFrom}
                        onChange={e => setValidFrom(e.target.value)}
                        className="w-full bg-[#18181B] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-[10px] font-black uppercase tracking-wider block mb-1.5">Valid Until</label>
                      <input
                        type="date"
                        value={validTo}
                        onChange={e => setValidTo(e.target.value)}
                        className="w-full bg-[#18181B] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-gray-400 text-[10px] font-black uppercase tracking-wider block mb-1.5">Limit Per Customer</label>
                      <input
                        type="number"
                        min={1}
                        value={usageLimitPerUser}
                        onChange={e => setUsageLimitPerUser(Number(e.target.value))}
                        className="w-full bg-[#18181B] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-[10px] font-black uppercase tracking-wider block mb-1.5">Total Usage Limit (0 = Unlimited)</label>
                      <input
                        type="number"
                        min={0}
                        value={usageLimitTotal}
                        onChange={e => setUsageLimitTotal(Number(e.target.value))}
                        className="w-full bg-[#18181B] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Target Groups & Restrictions */}
                <div>
                  <h3 className="text-[#D4A04D] text-xs font-black uppercase tracking-wider border-b border-[#2A2A2D] pb-1.5 mb-4">4. Target Audiences & Constraints</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <label className="flex items-center gap-2 bg-[#18181B] border border-[#2A2A2D] p-3 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newUserOnly}
                        onChange={e => setNewUserOnly(e.target.checked)}
                        className="accent-[#D4A04D]"
                      />
                      <span className="text-white text-[10px] font-bold uppercase select-none">New Users Only</span>
                    </label>
                    <label className="flex items-center gap-2 bg-[#18181B] border border-[#2A2A2D] p-3 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={firstPurchaseOnly}
                        onChange={e => setFirstPurchaseOnly(e.target.checked)}
                        className="accent-[#D4A04D]"
                      />
                      <span className="text-white text-[10px] font-bold uppercase select-none">First Order Only</span>
                    </label>
                    <label className="flex items-center gap-2 bg-[#18181B] border border-[#2A2A2D] p-3 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={membershipRequired}
                        onChange={e => setMembershipRequired(e.target.checked)}
                        className="accent-[#D4A04D]"
                      />
                      <span className="text-white text-[10px] font-bold uppercase select-none">VIP Members Only</span>
                    </label>
                  </div>
                </div>

                {/* Additional Settings */}
                <div>
                  <h3 className="text-[#D4A04D] text-xs font-black uppercase tracking-wider border-b border-[#2A2A2D] pb-1.5 mb-4">5. Strategy Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 bg-[#18181B] border border-[#2A2A2D] p-3 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoApply}
                        onChange={e => setAutoApply(e.target.checked)}
                        className="accent-[#D4A04D]"
                      />
                      <div>
                        <span className="text-white text-[10px] font-bold uppercase select-none block">Auto Apply Coupon</span>
                        <span className="text-gray-500 text-[9px]">Apply automatically on checkout</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 bg-[#18181B] border border-[#2A2A2D] p-3 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stackable}
                        onChange={e => setStackable(e.target.checked)}
                        className="accent-[#D4A04D]"
                      />
                      <div>
                        <span className="text-white text-[10px] font-bold uppercase select-none block">Stackable Coupon</span>
                        <span className="text-gray-500 text-[9px]">Can be combined with other codes</span>
                      </div>
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-3 pt-4">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={e => setIsActive(e.target.checked)}
                      className="accent-[#D4A04D] w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="isActive" className="text-white text-xs font-bold uppercase cursor-pointer select-none">
                      Enable this promotion immediately
                    </label>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-6 border-t border-[#2A2A2D] bg-[#0E0E0F] flex gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 bg-[#1A1A1C] border border-[#2A2A2D] text-white hover:bg-[#2A2A2D] text-xs font-bold uppercase py-3.5 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#D4A04D] hover:bg-[#C8923E] text-black text-xs font-bold uppercase py-3.5 rounded-xl transition-colors cursor-pointer shadow-lg"
                >
                  {editingId ? 'Save Changes' : 'Publish Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
