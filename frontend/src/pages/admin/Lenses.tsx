import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { socket } from '../../lib/socket';

interface LensType {
  _id: string;
  name: string;
  status: 'Active' | 'Inactive';
  lensCount?: number;
}

interface PowerPricing {
  minSph: number;
  maxSph: number;
  minCyl: number;
  maxCyl: number;
  price: number;
}

interface Lens {
  _id: string;
  name: string;
  lensType: LensType;
  basePrice: number;
  memberPrice?: number;
  displayOrder: number;
  status: 'Active' | 'Inactive';
  powerPricing?: PowerPricing[];
  createdAt: string;
}

export default function AdminLensesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'eyeglasses';

  const getCategoryDisplayName = (slug: string) => {
    if (slug === 'eyeglasses' || slug === 'prescription') return 'Eyeglasses';
    if (slug === 'sunglasses') return 'Sunglasses';
    if (slug === 'power-sunglasses') return 'Special Power';
    return slug.charAt(0).toUpperCase() + slug.slice(1);
  };

  const [lensTypes, setLensTypes] = useState<LensType[]>([]);
  const [lenses, setLenses] = useState<Lens[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingLenses, setLoadingLenses] = useState(true);

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  const selectedType = lensTypes.find(t => t._id === selectedTypeId);

  useEffect(() => {
    setSelectedTypeId(null);
  }, [categoryParam]);

  useEffect(() => {
    if (lensTypes.length > 0 && !selectedTypeId) {
      setSelectedTypeId(lensTypes[0]._id);
    }
  }, [lensTypes, selectedTypeId]);

  // Modals
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<LensType | null>(null);

  const [isLensDrawerOpen, setIsLensDrawerOpen] = useState(false);
  const [editingLens, setEditingLens] = useState<Lens | null>(null);
  const [powerPricing, setPowerPricing] = useState<PowerPricing[]>([]);

  useEffect(() => {
    if (isLensDrawerOpen) {
      if (editingLens) {
        setPowerPricing(editingLens.powerPricing || []);
      } else {
        setPowerPricing([]);
      }
    }
  }, [isLensDrawerOpen, editingLens]);

  const handleAddPowerPricingRule = () => {
    setPowerPricing([
      ...powerPricing,
      { minSph: -4.00, maxSph: 4.00, minCyl: -2.00, maxCyl: 2.00, price: 999 }
    ]);
  };

  const handleRemovePowerPricingRule = (idx: number) => {
    setPowerPricing(powerPricing.filter((_, i) => i !== idx));
  };

  const handleRuleChange = (idx: number, key: keyof PowerPricing, val: number) => {
    setPowerPricing(
      powerPricing.map((rule, i) => {
        if (i === idx) {
          return { ...rule, [key]: val };
        }
        return rule;
      })
    );
  };

  // Notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchLensTypes = useCallback(async () => {
    setLoadingTypes(true);
    try {
      const res = await api.get(`/admin/lens-types?category=${categoryParam}`);
      setLensTypes(res.data.lensTypes || []);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to fetch lens types', 'error');
    } finally {
      setLoadingTypes(false);
    }
  }, [categoryParam]);

  const fetchLenses = useCallback(async () => {
    if (!selectedTypeId) {
      setLenses([]);
      setLoadingLenses(false);
      return;
    }
    setLoadingLenses(true);
    try {
      const res = await api.get(`/admin/lenses?typeId=${selectedTypeId}`);
      setLenses(res.data.lenses || []);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to fetch lenses', 'error');
    } finally {
      setLoadingLenses(false);
    }
  }, [selectedTypeId]);

  useEffect(() => {
    fetchLensTypes();
  }, [fetchLensTypes]);

  useEffect(() => {
    fetchLenses();
  }, [fetchLenses]);

  // Real-time socket synchronization
  useEffect(() => {
    const handleTypeChange = () => {
      fetchLensTypes();
    };
    const handleLensChange = () => {
      fetchLenses();
      fetchLensTypes(); // Also update lens counts in types list
    };

    socket.on('lens_type_changed', handleTypeChange);
    socket.on('lens_changed', handleLensChange);

    return () => {
      socket.off('lens_type_changed', handleTypeChange);
      socket.off('lens_changed', handleLensChange);
    };
  }, [fetchLensTypes, fetchLenses]);

  // Derived state
  const filteredLenses = lenses.filter(lens => {
    const matchesSearch = lens.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || lens.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // --- Type Actions ---
  const handleSaveType = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name') as string,
      status: formData.get('status') as string,
      category: categoryParam,
    };

    try {
      if (editingType) {
        await api.put(`/admin/lens-types/${editingType._id}`, payload);
        showToast('Lens Type updated', 'success');
      } else {
        await api.post('/admin/lens-types', payload);
        showToast('Lens Type created', 'success');
      }
      setIsTypeModalOpen(false);
      fetchLensTypes();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save lens type', 'error');
    }
  };

  const handleDeleteType = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this lens type?')) return;
    try {
      await api.delete(`/admin/lens-types/${id}`);
      showToast('Lens Type deleted', 'success');
      if (selectedTypeId === id) setSelectedTypeId(null);
      fetchLensTypes();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete lens type', 'error');
    }
  };

  // --- Lens Actions ---
  const handleSaveLens = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const basePrice = Number(formData.get('basePrice'));
    
    if (basePrice < 0) {
      showToast('Price cannot be negative', 'error');
      return;
    }

    const payload = {
      name: formData.get('name') as string,
      lensType: formData.get('lensType') as string,
      basePrice,
      status: formData.get('status') as string,
      powerPricing,
    };

    try {
      if (editingLens) {
        await api.put(`/admin/lenses/${editingLens._id}`, payload);
        showToast('Lens updated', 'success');
      } else {
        await api.post('/admin/lenses', payload);
        showToast('Lens created', 'success');
      }
      setIsLensDrawerOpen(false);
      fetchLenses();
      fetchLensTypes(); // Update counts
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save lens', 'error');
    }
  };

  const handleDeleteLens = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lens?')) return;
    try {
      await api.delete(`/admin/lenses/${id}`);
      showToast('Lens deleted', 'success');
      fetchLenses();
      fetchLensTypes(); // Update counts
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete lens', 'error');
    }
  };

  if (isLensDrawerOpen) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] p-6 text-left relative flex flex-col">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-bold animate-fade-in ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="pb-4 border-b border-[#2A2A2D] mb-6 flex justify-between items-center">
          <div>
            <button
              type="button"
              onClick={() => setIsLensDrawerOpen(false)}
              className="text-xs text-[#A7A7A7] hover:text-[#D4A04D] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors bg-transparent border-none p-0 cursor-pointer mb-2"
            >
              ← Back to Lens Management
            </button>
            <h1 className="text-2xl font-bold text-white uppercase tracking-wide">
              {editingLens ? 'Edit Lens' : 'Add New Lens'}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSaveLens} className="flex-1 flex flex-col space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column: General Info */}
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 space-y-5">
              <h2 className="text-sm text-[#D4A04D] font-extrabold uppercase tracking-wider border-b border-[#2A2A2D] pb-3 mb-2">
                General Information
              </h2>
              
              <div>
                <label className="block text-xs font-bold text-[#A7A7A7] uppercase tracking-wider mb-2">Lens Name *</label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editingLens?.name || ''}
                  className="w-full bg-[#1A1A1C] border border-[#2A2A2D] rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  placeholder="e.g. Standard Anti-Glare"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A7A7A7] uppercase tracking-wider mb-2">Lens Type</label>
                <div className="w-full bg-[#18181A] border border-[#2A2A2D] rounded-xl px-4 py-3 text-white text-sm font-semibold select-none">
                  {editingLens?.lensType?.name || selectedType?.name || 'Selected Lens Type'}
                </div>
                <input
                  type="hidden"
                  name="lensType"
                  value={editingLens?.lensType?._id || selectedTypeId || ''}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A7A7A7] uppercase tracking-wider mb-2">Base Price (₹) *</label>
                <input
                  name="basePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  defaultValue={editingLens?.basePrice || ''}
                  className="w-full bg-[#1A1A1C] border border-[#2A2A2D] rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A7A7A7] uppercase tracking-wider mb-2">Status</label>
                <select
                  name="status"
                  defaultValue={editingLens?.status || 'Active'}
                  className="w-full bg-[#1A1A1C] border border-[#2A2A2D] rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Right Column: Power-based Pricing */}
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-[#2A2A2D] pb-3 mb-2">
                <h2 className="text-sm text-[#D4A04D] font-extrabold uppercase tracking-wider">
                  Power-based Pricing (Optional)
                </h2>
                <button
                  type="button"
                  onClick={handleAddPowerPricingRule}
                  className="bg-[#2A2A2D] hover:bg-[#3A3A3D] text-[#D4A04D] text-[10px] font-extrabold uppercase py-1.5 px-3.5 rounded-xl border border-[#D4A04D]/20 cursor-pointer transition-colors"
                >
                  + Add Rule
                </button>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {powerPricing.map((rule, idx) => (
                  <div key={idx} className="bg-[#1A1A1C] border border-[#2A2A2D] rounded-2xl p-5 space-y-4 relative">
                    <button
                      type="button"
                      onClick={() => handleRemovePowerPricingRule(idx)}
                      className="absolute top-4 right-4 text-[#A7A7A7] hover:text-red-400 font-black text-sm bg-transparent border-none cursor-pointer transition-colors"
                    >
                      ✕
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-gray-500 font-bold mb-1.5">MIN SPH</label>
                        <input
                          type="number"
                          step="0.25"
                          value={rule.minSph}
                          onChange={(e) => handleRuleChange(idx, 'minSph', Number(e.target.value))}
                          className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 font-bold mb-1.5">MAX SPH</label>
                        <input
                          type="number"
                          step="0.25"
                          value={rule.maxSph}
                          onChange={(e) => handleRuleChange(idx, 'maxSph', Number(e.target.value))}
                          className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-gray-500 font-bold mb-1.5">MIN CYL</label>
                        <input
                          type="number"
                          step="0.25"
                          value={rule.minCyl}
                          onChange={(e) => handleRuleChange(idx, 'minCyl', Number(e.target.value))}
                          className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 font-bold mb-1.5">MAX CYL</label>
                        <input
                          type="number"
                          step="0.25"
                          value={rule.maxCyl}
                          onChange={(e) => handleRuleChange(idx, 'maxCyl', Number(e.target.value))}
                          className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold mb-1.5">PRICE (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={rule.price}
                        onChange={(e) => handleRuleChange(idx, 'price', Number(e.target.value))}
                        className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2.5 text-white text-xs font-bold text-[#D4A04D]"
                      />
                    </div>
                  </div>
                ))}

                {powerPricing.length === 0 && (
                  <p className="text-gray-500 text-xs italic text-center py-6">
                    No power-based prices set. Lens will use Base Price for all prescription powers.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#2A2A2D] flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setIsLensDrawerOpen(false)}
              className="px-6 py-3 text-sm font-bold text-white bg-[#2A2A2D] hover:bg-[#3A3A3D] rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 text-sm font-extrabold text-black bg-[#D4A04D] hover:bg-[#C8923E] rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
            >
              Save Lens
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-bold animate-fade-in ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="sticky top-0 bg-[#0B0B0C] z-10 pb-4 border-b border-[#2A2A2D]">
        <div className="mb-2">
          <button
            onClick={() => navigate('/admin/categories')}
            className="text-xs text-[#A7A7A7] hover:text-[#D4A04D] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors bg-transparent border-none p-0 cursor-pointer"
          >
            ← Back to Categories
          </button>
        </div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white uppercase tracking-wide">
            {getCategoryDisplayName(categoryParam)} Lens Management
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => { setEditingType(null); setIsTypeModalOpen(true); }}
              className="bg-[#2A2A2D] hover:bg-[#3A3A3D] text-white font-extrabold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md"
            >
              + Add Lens Type
            </button>
            <button
              onClick={() => { setEditingLens(null); setIsLensDrawerOpen(true); }}
              className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md"
            >
              + Add Lens
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search lenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 bg-[#131314] border border-[#2A2A2D] rounded-xl px-4 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none transition-colors"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#131314] border border-[#2A2A2D] rounded-xl px-4 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none transition-colors"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Main Layout 30/70 */}
      <div className="flex flex-1 overflow-hidden mt-4 gap-6">
        {/* Left Side: Lens Types */}
        <div className="w-[30%] bg-[#131314] border border-[#2A2A2D] rounded-2xl p-4 flex flex-col overflow-hidden">
          <h2 className="text-sm text-[#A7A7A7] font-extrabold uppercase tracking-wider mb-4 px-2">Lens Types</h2>
          <div className="overflow-y-auto flex-1 pr-2 space-y-2">
            {loadingTypes ? (
              <div className="animate-pulse space-y-2 mt-2">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-[#2A2A2D] rounded-xl"></div>)}
              </div>
            ) : (
              lensTypes.map(type => (
                <div
                  key={type._id}
                  onClick={() => setSelectedTypeId(type._id)}
                  className={`p-3 rounded-xl cursor-pointer border transition-colors flex justify-between items-center group ${
                    selectedTypeId === type._id 
                      ? 'bg-[#D4A04D]/10 border-[#D4A04D]' 
                      : 'bg-[#1A1A1C] border-[#2A2A2D] hover:bg-[#2A2A2D]'
                  }`}
                >
                  <div>
                    <div className={`font-bold text-sm ${selectedTypeId === type._id ? 'text-[#D4A04D]' : 'text-white'}`}>
                      {type.name} ({type.lensCount || 0})
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${type.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-[10px] text-[#A7A7A7]">{type.status}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingType(type); setIsTypeModalOpen(true); }}
                      className="text-[#D4A04D] hover:text-[#C8923E] text-xs font-bold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => handleDeleteType(type._id, e)}
                      className="text-red-400 hover:text-red-500 text-xs font-bold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
            {!loadingTypes && lensTypes.length === 0 && (
              <div className="text-center text-sm text-[#A7A7A7] py-8">No lens types found</div>
            )}
          </div>
        </div>

        {/* Right Side: Lenses */}
        <div className="w-[70%] bg-[#131314] border border-[#2A2A2D] rounded-2xl flex flex-col overflow-hidden">
          {loadingLenses ? (
            <div className="flex-1 flex items-center justify-center text-[#A7A7A7] animate-pulse">Loading lenses...</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#1A1A1C]">
                  <tr className="text-[#A7A7A7] text-[10px] font-extrabold uppercase tracking-wider border-b border-[#2A2A2D]">
                    <th className="text-left px-5 py-4">Lens Name</th>
                    <th className="text-left px-5 py-4">Type</th>
                    <th className="text-left px-5 py-4">Base Price</th>
                    <th className="text-left px-5 py-4">Status</th>
                    <th className="text-left px-5 py-4">Date</th>
                    <th className="text-left px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2D]/40">
                  {filteredLenses.map(lens => (
                    <tr key={lens._id} className="hover:bg-[#1C1C1E] transition-colors">
                      <td className="px-5 py-4 text-white font-semibold">{lens.name}</td>
                      <td className="px-5 py-4 text-[#A7A7A7] text-xs font-medium">{lens.lensType?.name || '-'}</td>
                      <td className="px-5 py-4 text-white font-black">₹{lens.basePrice}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 rounded-full text-[9px] font-extrabold uppercase border ${
                          lens.status === 'Active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {lens.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[#A7A7A7] text-xs">{new Date(lens.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-3 font-bold text-xs">
                          <button onClick={() => { setEditingLens(lens); setIsLensDrawerOpen(true); }} className="text-[#D4A04D] hover:underline">Edit</button>
                          <button onClick={() => handleDeleteLens(lens._id)} className="text-red-400 hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredLenses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-[#A7A7A7] py-16 italic">No lenses found matching criteria</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Lens Type Modal */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">{editingType ? 'Edit' : 'Add'} Lens Type</h2>
            <form onSubmit={handleSaveType} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#A7A7A7] uppercase tracking-wider mb-2">Lens Type Name *</label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editingType?.name || ''}
                  className="w-full bg-[#1A1A1C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  placeholder="e.g. Zero Power"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#A7A7A7] uppercase tracking-wider mb-2">Status</label>
                <select
                  name="status"
                  defaultValue={editingType?.status || 'Active'}
                  className="w-full bg-[#1A1A1C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#2A2A2D] mt-6">
                <button
                  type="button"
                  onClick={() => setIsTypeModalOpen(false)}
                  className="px-5 py-2 text-sm font-bold text-[#A7A7A7] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold py-2 px-6 rounded-xl text-sm uppercase tracking-wider transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-slide-left { animation: slideLeft 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}
