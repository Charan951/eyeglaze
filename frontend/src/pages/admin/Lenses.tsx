import React, { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';

interface LensType {
  _id: string;
  name: string;
  status: 'Active' | 'Inactive';
  lensCount?: number;
}

interface Lens {
  _id: string;
  name: string;
  lensType: LensType;
  basePrice: number;
  memberPrice?: number;
  displayOrder: number;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export default function AdminLensesPage() {
  const [lensTypes, setLensTypes] = useState<LensType[]>([]);
  const [lenses, setLenses] = useState<Lens[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingLenses, setLoadingLenses] = useState(true);

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Modals
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<LensType | null>(null);

  const [isLensDrawerOpen, setIsLensDrawerOpen] = useState(false);
  const [editingLens, setEditingLens] = useState<Lens | null>(null);

  // Notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchLensTypes = useCallback(async () => {
    setLoadingTypes(true);
    try {
      const res = await api.get('/admin/lens-types');
      setLensTypes(res.data.lensTypes || []);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to fetch lens types', 'error');
    } finally {
      setLoadingTypes(false);
    }
  }, []);

  const fetchLenses = useCallback(async () => {
    setLoadingLenses(true);
    try {
      const url = selectedTypeId ? `/admin/lenses?typeId=${selectedTypeId}` : '/admin/lenses';
      const res = await api.get(url);
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
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white uppercase tracking-wide">Lens Management</h1>
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
            <div
              onClick={() => setSelectedTypeId(null)}
              className={`p-3 rounded-xl cursor-pointer border transition-colors ${
                selectedTypeId === null 
                  ? 'bg-[#D4A04D]/10 border-[#D4A04D] text-[#D4A04D]' 
                  : 'bg-[#1A1A1C] border-transparent text-[#A7A7A7] hover:bg-[#2A2A2D]'
              }`}
            >
              <div className="font-bold">All Types</div>
            </div>

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

      {/* Add/Edit Lens Drawer */}
      {isLensDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="bg-[#131314] border-l border-[#2A2A2D] w-full max-w-md h-full flex flex-col shadow-2xl animate-slide-left">
            <div className="p-6 border-b border-[#2A2A2D]">
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">{editingLens ? 'Edit' : 'Add'} Lens</h2>
            </div>
            <form onSubmit={handleSaveLens} className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#A7A7A7] uppercase tracking-wider mb-2">Lens Name *</label>
                  <input
                    name="name"
                    type="text"
                    required
                    defaultValue={editingLens?.name || ''}
                    className="w-full bg-[#1A1A1C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                    placeholder="e.g. Standard Anti-Glare"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#A7A7A7] uppercase tracking-wider mb-2">Select Lens Type *</label>
                  <select
                    name="lensType"
                    required
                    defaultValue={editingLens?.lensType?._id || ''}
                    className="w-full bg-[#1A1A1C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  >
                    <option value="" disabled>Select Type</option>
                    {lensTypes.map(lt => (
                      <option key={lt._id} value={lt._id}>{lt.name}</option>
                    ))}
                  </select>
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
                    className="w-full bg-[#1A1A1C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#A7A7A7] uppercase tracking-wider mb-2">Status</label>
                  <select
                    name="status"
                    defaultValue={editingLens?.status || 'Active'}
                    className="w-full bg-[#1A1A1C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-[#2A2A2D] flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsLensDrawerOpen(false)}
                  className="flex-1 px-4 py-3 text-sm font-bold text-white bg-[#2A2A2D] hover:bg-[#3A3A3D] rounded-xl uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 text-sm font-extrabold text-black bg-[#D4A04D] hover:bg-[#C8923E] rounded-xl uppercase tracking-wider transition-colors"
                >
                  Save Lens
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
