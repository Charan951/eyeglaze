import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';

interface ShapeItem {
  _id: string;
  name: string;
  slug: string;
  image: string;
  displayOrder: number;
  status: 'Active' | 'Inactive';
  isDeleted: boolean;
}

interface KidsAgeGroupItem {
  _id: string;
  title: string;
  ageRange: string;
  badgeText: string;
  subtitle: string;
  image: string;
  targetSize: string;
  colorTheme: string;
  displayOrder: number;
  status: 'Active' | 'Inactive';
  isDeleted: boolean;
}

export default function ShapesList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'shapes' | 'kids-age-groups'>('shapes');

  // Shapes State
  const [items, setItems] = useState<ShapeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showTrash, setShowTrash] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Kids Age Groups State
  const [kidsItems, setKidsItems] = useState<KidsAgeGroupItem[]>([]);
  const [loadingKids, setLoadingKids] = useState(false);
  const [isKidsModalOpen, setIsKidsModalOpen] = useState(false);
  const [editingKidsItem, setEditingKidsItem] = useState<KidsAgeGroupItem | null>(null);

  // Kids Modal Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formAgeRange, setFormAgeRange] = useState('');
  const [formBadgeText, setFormBadgeText] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formImage, setFormImage] = useState('/images/kids_special_edition.png');
  const [formTargetSize, setFormTargetSize] = useState('Small');
  const [formColorTheme, setFormColorTheme] = useState('amber');
  const [formDisplayOrder, setFormDisplayOrder] = useState(1);
  const [isSavingKids, setIsSavingKids] = useState(false);
  const [uploadingKidsImage, setUploadingKidsImage] = useState(false);

  const handleKidsImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingKidsImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormImage(res.data.url);
    } catch (err) {
      console.error('Failed to upload card image:', err);
      setError('Failed to upload card image. Please try again.');
    } finally {
      setUploadingKidsImage(false);
    }
  };

  const fetchShapes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.set('search', search);
      queryParams.set('isDeleted', String(showTrash));
      queryParams.set('page', String(page));
      queryParams.set('limit', '10');

      const res = await api.get(`/admin/shapes?${queryParams.toString()}`);
      setItems(res.data.items || []);
      setTotalPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch {
      setError('Failed to fetch shapes from catalog.');
    } finally {
      setLoading(false);
    }
  }, [search, showTrash, page]);

  const fetchKidsAgeGroups = useCallback(async () => {
    setLoadingKids(true);
    setError('');
    try {
      const res = await api.get(`/admin/kids-age-groups?isDeleted=${showTrash}&search=${search}`);
      setKidsItems(res.data.items || []);
    } catch {
      setError('Failed to fetch kids age groups.');
    } finally {
      setLoadingKids(false);
    }
  }, [search, showTrash]);

  useEffect(() => {
    setPage(1);
  }, [search, showTrash, activeTab]);

  useEffect(() => {
    if (activeTab === 'shapes') {
      fetchShapes();
    } else {
      fetchKidsAgeGroups();
    }
  }, [activeTab, fetchShapes, fetchKidsAgeGroups]);

  const toggleStatus = async (item: ShapeItem) => {
    try {
      const nextStatus = item.status === 'Active' ? 'Inactive' : 'Active';
      await api.put(`/admin/shapes/${item._id}`, {
        status: nextStatus
      });
      fetchShapes();
    } catch {
      setError('Failed to update status.');
    }
  };

  const handleDelete = async (item: ShapeItem) => {
    if (!confirm(`Soft delete shape "${item.name}"?`)) return;
    try {
      await api.delete(`/admin/shapes/${item._id}`);
      fetchShapes();
    } catch {
      setError('Failed to delete shape.');
    }
  };

  const handleRestore = async (item: ShapeItem) => {
    try {
      await api.put(`/admin/shapes/${item._id}/restore`);
      fetchShapes();
    } catch {
      setError('Failed to restore shape.');
    }
  };

  // Kids Age Groups Handlers
  const handleOpenKidsModal = (item?: KidsAgeGroupItem) => {
    if (item) {
      setEditingKidsItem(item);
      setFormTitle(item.title);
      setFormAgeRange(item.ageRange);
      setFormBadgeText(item.badgeText);
      setFormSubtitle(item.subtitle || '');
      setFormImage(item.image || '/images/kids_eyeglasses.png');
      setFormTargetSize(item.targetSize || 'Small');
      setFormColorTheme(item.colorTheme || 'amber');
      setFormDisplayOrder(item.displayOrder || 1);
    } else {
      setEditingKidsItem(null);
      setFormTitle('');
      setFormAgeRange('');
      setFormBadgeText('Kids');
      setFormSubtitle('');
      setFormImage('/images/kids_eyeglasses.png');
      setFormTargetSize('Small');
      setFormColorTheme('amber');
      setFormDisplayOrder(kidsItems.length + 1);
    }
    setIsKidsModalOpen(true);
  };

  const handleSaveKidsGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formAgeRange) {
      alert('Title and Age Range are required.');
      return;
    }

    setIsSavingKids(true);
    const payload = {
      title: formTitle,
      ageRange: formAgeRange,
      badgeText: formBadgeText,
      subtitle: formSubtitle,
      image: formImage,
      targetSize: formTargetSize,
      colorTheme: formColorTheme,
      displayOrder: Number(formDisplayOrder),
    };

    try {
      if (editingKidsItem) {
        await api.put(`/admin/kids-age-groups/${editingKidsItem._id}`, payload);
      } else {
        await api.post('/admin/kids-age-groups', payload);
      }
      setIsKidsModalOpen(false);
      fetchKidsAgeGroups();
    } catch (err: any) {
      if (err.response?.status === 401) {
        alert('Your admin session has expired. Please log in again.');
        navigate('/login', { state: { from: { pathname: '/admin/shapes' } } });
      } else {
        alert(err.response?.data?.error || 'Failed to save Kids Age Group.');
      }
    } finally {
      setIsSavingKids(false);
    }
  };

  const toggleKidsStatus = async (item: KidsAgeGroupItem) => {
    try {
      const nextStatus = item.status === 'Active' ? 'Inactive' : 'Active';
      await api.put(`/admin/kids-age-groups/${item._id}`, { status: nextStatus });
      fetchKidsAgeGroups();
    } catch {
      setError('Failed to update status.');
    }
  };

  const handleDeleteKidsGroup = async (item: KidsAgeGroupItem) => {
    if (!confirm(`Delete Kids Age Group "${item.title}"?`)) return;
    try {
      await api.delete(`/admin/kids-age-groups/${item._id}`);
      fetchKidsAgeGroups();
    } catch {
      setError('Failed to delete kids age group.');
    }
  };

  const handleRestoreKidsGroup = async (item: KidsAgeGroupItem) => {
    try {
      await api.put(`/admin/kids-age-groups/${item._id}/restore`);
      fetchKidsAgeGroups();
    } catch {
      setError('Failed to restore kids age group.');
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0C0C0E] text-white p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2A2A2D] pb-5">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#D4A04D]">Shapes & Kids Manager</h1>
          <p className="text-xs text-[#A7A7A7] mt-1">
            Manage global frame shapes and Kids Age Group selection cards.
          </p>
        </div>
        
        {activeTab === 'shapes' ? (
          <button
            onClick={() => navigate('/admin/shapes/add')}
            className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-[10px] uppercase tracking-wider py-3 px-6 rounded-xl transition-all cursor-pointer shadow-md select-none"
          >
            + Create Frame Shape
          </button>
        ) : (
          <button
            onClick={() => handleOpenKidsModal()}
            className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-[10px] uppercase tracking-wider py-3 px-6 rounded-xl transition-all cursor-pointer shadow-md select-none"
          >
            + Add Kids Age Group
          </button>
        )}
      </div>

      {/* Top Navbar / Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-[#2A2A2D] pb-3">
        <button
          onClick={() => setActiveTab('shapes')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'shapes'
              ? 'bg-[#D4A04D] text-black shadow-md'
              : 'bg-[#131314] border border-[#2A2A2D] text-gray-400 hover:text-white'
          }`}
        >
          <span>👓</span> Frame Shapes
        </button>
        <button
          onClick={() => setActiveTab('kids-age-groups')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'kids-age-groups'
              ? 'bg-[#D4A04D] text-black shadow-md'
              : 'bg-[#131314] border border-[#2A2A2D] text-gray-400 hover:text-white'
          }`}
        >
          <span>🧒</span> Kids Age Groups
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#131314] border border-[#2A2A2D] p-4 rounded-2xl shadow-xl">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder={activeTab === 'shapes' ? 'Search shapes by name...' : 'Search kids age groups...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0B0B0C] border border-[#2A2A2D] focus:border-[#D4A04D] rounded-xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs bg-transparent border-none cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={() => setShowTrash(!showTrash)}
            className={`text-xs font-bold py-2.5 px-5 rounded-xl border transition-all cursor-pointer ${
              showTrash
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'border-[#2A2A2D] text-gray-400 hover:text-white'
            }`}
          >
            {showTrash ? 'View Active' : 'View Archive (Trash)'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'shapes' ? (
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-t-[#D4A04D] border-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Fetching shapes...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center text-gray-500 text-sm">
              No data is added
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#2A2A2D] bg-[#18181A]">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#A7A7A7] w-24">Icon</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#A7A7A7]">Name</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#A7A7A7]">Slug</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#A7A7A7] text-center w-28">Order</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#A7A7A7] text-center w-28">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#A7A7A7] text-right w-44">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2D]/40">
                  {items.map((item) => (
                    <tr key={item._id} className="hover:bg-[#1A1A1C]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="w-12 h-12 rounded-full bg-white border border-[#2A2A2D] flex items-center justify-center p-1.5 overflow-hidden">
                          <img src={item.image} alt={item.name} className="w-10 h-10 object-contain" />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-white text-sm">{item.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">{item.slug}</td>
                      <td className="px-6 py-4 text-center font-mono text-xs text-gray-300">#{item.displayOrder}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => !item.isDeleted && toggleStatus(item)}
                          disabled={item.isDeleted}
                          className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full cursor-pointer disabled:cursor-default ${
                            item.status === 'Active'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          }`}
                        >
                          {item.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {item.isDeleted ? (
                            <button
                              onClick={() => handleRestore(item)}
                              className="bg-[#2A2A2D] hover:bg-zinc-800 text-[#D4A04D] border border-zinc-700 text-[10px] font-extrabold uppercase py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                            >
                              Restore
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => navigate(`/admin/shapes/edit/${item._id}`)}
                                className="bg-[#18181A] hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white text-[10px] font-extrabold uppercase py-1.5 px-3.5 rounded-lg transition-colors cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-extrabold uppercase py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Kids Age Groups Table */
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl shadow-xl overflow-hidden">
          {loadingKids ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-t-[#D4A04D] border-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Fetching kids age groups...</span>
            </div>
          ) : kidsItems.length === 0 ? (
            <div className="py-20 text-center text-gray-500 text-sm">
              No data is added
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#2A2A2D] bg-[#18181A]">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#A7A7A7]">Title / Badge</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#A7A7A7]">Age Range</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#A7A7A7]">Subtitle</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#A7A7A7]">Target Size</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#A7A7A7] text-center">Color</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#A7A7A7] text-center">Order</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#A7A7A7] text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-[#A7A7A7] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2D]/40">
                  {kidsItems.map((item) => (
                    <tr key={item._id} className="hover:bg-[#1A1A1C]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-[#D4A04D]">
                            {item.badgeText || 'Kids'}
                          </span>
                          <span className="font-bold text-white text-sm">{item.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-300">{item.ageRange}</td>
                      <td className="px-6 py-4 text-xs text-gray-400">{item.subtitle || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-gray-200">
                          {item.targetSize}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[10px] font-bold uppercase text-gray-400">
                          {item.colorTheme}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-xs text-gray-300">#{item.displayOrder}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => !item.isDeleted && toggleKidsStatus(item)}
                          disabled={item.isDeleted}
                          className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full cursor-pointer disabled:cursor-default ${
                            item.status === 'Active'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          }`}
                        >
                          {item.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {item.isDeleted ? (
                            <button
                              onClick={() => handleRestoreKidsGroup(item)}
                              className="bg-[#2A2A2D] hover:bg-zinc-800 text-[#D4A04D] border border-zinc-700 text-[10px] font-extrabold uppercase py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                            >
                              Restore
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleOpenKidsModal(item)}
                                className="bg-[#18181A] hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white text-[10px] font-extrabold uppercase py-1.5 px-3.5 rounded-lg transition-colors cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteKidsGroup(item)}
                                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-extrabold uppercase py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pagination controls for Shapes */}
      {activeTab === 'shapes' && !loading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-[#131314] border border-[#2A2A2D] p-4 rounded-2xl">
          <span className="text-xs text-gray-500">
            Showing Page <strong className="text-white font-semibold">{page}</strong> of <strong className="text-white font-semibold">{totalPages}</strong> ({total} total shapes)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-[#18181A] border border-[#2A2A2D] hover:border-zinc-700 rounded-lg text-xs font-bold disabled:opacity-50 disabled:cursor-default"
            >
              ◀ Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 bg-[#18181A] border border-[#2A2A2D] hover:border-zinc-700 rounded-lg text-xs font-bold disabled:opacity-50 disabled:cursor-default"
            >
              Next ▶
            </button>
          </div>
        </div>
      )}

      {/* Modal Dialog for Add / Edit Kids Age Group */}
      {isKidsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsKidsModalOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          />
          <div className="relative bg-[#121213] border border-[#2A2A2D] w-full max-w-lg rounded-2xl shadow-2xl p-6 z-10 flex flex-col gap-4 text-left">
            <div className="flex justify-between items-center pb-3 border-b border-[#2A2A2D]">
              <h3 className="text-white text-base font-black uppercase tracking-wider">
                {editingKidsItem ? 'Edit Kids Age Group' : 'Add Kids Age Group'}
              </h3>
              <button
                onClick={() => setIsKidsModalOpen(false)}
                className="text-gray-400 hover:text-white bg-transparent border-none cursor-pointer text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveKidsGroup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juniors"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full mt-1 bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-xs text-white focus:border-[#D4A04D] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Age Range *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5 to 8 years"
                    value={formAgeRange}
                    onChange={(e) => setFormAgeRange(e.target.value)}
                    className="w-full mt-1 bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-xs text-white focus:border-[#D4A04D] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Badge Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Juniors or Offer"
                    value={formBadgeText}
                    onChange={(e) => setFormBadgeText(e.target.value)}
                    className="w-full mt-1 bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-xs text-white focus:border-[#D4A04D] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Subtitle / Size Desc</label>
                  <input
                    type="text"
                    placeholder="e.g. Fits Small Frames"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    className="w-full mt-1 bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-xs text-white focus:border-[#D4A04D] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Target Size</label>
                  <select
                    value={formTargetSize}
                    onChange={(e) => setFormTargetSize(e.target.value)}
                    className="w-full mt-1 bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-xs text-white focus:border-[#D4A04D] outline-none"
                  >
                    <option value="Small">Small (5-8 yrs)</option>
                    <option value="Medium">Medium (8-12 yrs)</option>
                    <option value="Large">Large (12-17 yrs)</option>
                    <option value="Sale">Sale / Offers</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Color Theme</label>
                  <select
                    value={formColorTheme}
                    onChange={(e) => setFormColorTheme(e.target.value)}
                    className="w-full mt-1 bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-xs text-white focus:border-[#D4A04D] outline-none"
                  >
                    <option value="amber">Amber (Gold)</option>
                    <option value="cyan">Cyan (Blue)</option>
                    <option value="purple">Purple</option>
                    <option value="rose">Rose (Red)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Display Order</label>
                  <input
                    type="number"
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                    className="w-full mt-1 bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-xs text-white focus:border-[#D4A04D] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1.5 font-semibold">Card Image Banner</label>
                
                {formImage ? (
                  <div className="flex items-center gap-3 bg-[#0B0B0C] border border-[#2A2A2D] p-2.5 rounded-xl">
                    <img
                      src={formImage}
                      alt="Card Banner Preview"
                      className="w-20 h-10 object-cover rounded-lg border border-[#2A2A2D]"
                    />
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={formImage}
                        onChange={(e) => setFormImage(e.target.value)}
                        className="w-full bg-transparent text-xs text-gray-300 font-mono focus:outline-none truncate"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormImage('')}
                      className="text-red-400 hover:text-red-300 text-xs font-bold px-2 py-1 bg-transparent border-none cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      id="kidsCardImageUpload"
                      onChange={handleKidsImageUpload}
                      disabled={uploadingKidsImage}
                      className="hidden"
                    />
                    <label
                      htmlFor="kidsCardImageUpload"
                      className="flex flex-col items-center justify-center border-2 border-dashed border-[#2A2A2D] hover:border-[#D4A04D]/60 rounded-xl p-4 cursor-pointer bg-[#0B0B0C]/40 transition-colors"
                    >
                      <span className="text-lg mb-1">📤</span>
                      <span className="text-xs font-bold text-gray-300">
                        {uploadingKidsImage ? 'Uploading card image...' : 'Click to upload card image banner'}
                      </span>
                      <span className="text-[10px] text-gray-500 mt-0.5">Supports PNG, JPG, WEBP</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#2A2A2D]">
                <button
                  type="button"
                  onClick={() => setIsKidsModalOpen(false)}
                  className="px-4 py-2 bg-transparent border border-[#2A2A2D] hover:border-gray-500 text-gray-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingKids}
                  className="px-5 py-2 bg-[#D4A04D] hover:bg-[#C8923E] text-black text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSavingKids ? 'Saving...' : editingKidsItem ? 'Update Group' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
