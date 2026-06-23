import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';

interface CategoryItem {
  _id: string;
  name: string;
  code: string;
  slug: string;
  type: 'Category' | 'SubCategory';
  displayOrder: number;
  status: 'Draft' | 'Active' | 'Inactive' | 'Archived';
  isDeleted: boolean;
}

export default function CategoriesList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [showTrash, setShowTrash] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // CSV Import state
  const [csvText, setCsvText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.set('search', search);
      if (filterType) queryParams.set('type', filterType);
      queryParams.set('isDeleted', String(showTrash));
      queryParams.set('page', String(page));
      queryParams.set('limit', '10');

      const res = await api.get(`/admin/categories?${queryParams.toString()}`);
      setItems(res.data.items || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch {
      setError('Failed to fetch category catalog.');
    } finally {
      setLoading(false);
    }
  }, [search, filterType, showTrash, page]);

  useEffect(() => {
    setPage(1);
  }, [search, filterType, showTrash]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Actions
  const toggleStatus = async (item: CategoryItem) => {
    try {
      const nextStatus = item.status === 'Active' ? 'Inactive' : 'Active';
      await api.put(`/admin/categories/${item.type}/${item._id}`, {
        basic: { name: item.name, code: item.code, status: nextStatus, slug: item.slug }
      });
      fetchCategories();
    } catch {
      setError('Failed to toggle status.');
    }
  };

  const handleDelete = async (item: CategoryItem) => {
    if (!confirm(`Soft delete ${item.name}?`)) return;
    try {
      await api.delete(`/admin/categories/${item.type}/${item._id}`);
      fetchCategories();
    } catch {
      setError('Failed to delete.');
    }
  };

  const handleRestore = async (item: CategoryItem) => {
    try {
      await api.put(`/admin/categories/${item.type}/${item._id}/restore`);
      fetchCategories();
    } catch {
      setError('Failed to restore.');
    }
  };

  const handleDuplicate = async (item: CategoryItem) => {
    try {
      await api.post(`/admin/categories/${item.type}/${item._id}/duplicate`);
      fetchCategories();
    } catch {
      setError('Failed to duplicate.');
    }
  };

  // CSV Operations
  const triggerCSVExport = () => {
    window.open(`${api.defaults.baseURL}/admin/categories/export`, '_blank');
  };

  const handleCSVImport = async () => {
    if (!csvText.trim()) return;
    setImportStatus('Importing catalog...');
    try {
      const res = await api.post('/admin/categories/import', { csvData: csvText });
      setImportStatus(`Successfully imported ${res.data.importedCount} segments!`);
      setTimeout(() => {
        setShowImportModal(false);
        setCsvText('');
        setImportStatus(null);
        fetchCategories();
      }, 2000);
    } catch {
      setImportStatus('CSV Import failed. Check syntax.');
    }
  };

  return (
    <div className="space-y-6 select-none text-white">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-bold">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide">Category Management</h1>
          <p className="text-xs text-gray-500 font-semibold">Organize eyewear product catalog hierarchies dynamically</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/admin/categories/tree')} className="bg-[#18181A] hover:bg-zinc-800 border border-zinc-700 text-[#D4A04D] font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer">
            🌲 Tree View
          </button>
          <button onClick={() => navigate('/admin/categories/menu-builder')} className="bg-[#18181A] hover:bg-zinc-800 border border-zinc-700 text-[#D4A04D] font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer">
            🛠️ Menu Builder
          </button>
          <button onClick={() => navigate('/admin/categories/add')} className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md border-none cursor-pointer">
            + Create Segment
          </button>
        </div>
      </div>

      {/* CSV, Filters, Search tools */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Type tabs */}
        <div className="flex gap-1 bg-[#131314] p-1 border border-[#2A2A2D] rounded-xl text-[10px] font-extrabold uppercase tracking-widest w-fit">
          {[
            { value: '', label: 'All Tiers' },
            { value: 'Category', label: 'Main Category' },
            { value: 'SubCategory', label: 'Sub Category' }
          ].map(t => (
            <button
              key={t.value}
              onClick={() => setFilterType(t.value)}
              className={`px-3 py-1.5 rounded-lg border-none cursor-pointer transition-colors ${filterType === t.value ? 'bg-[#D4A04D] text-black' : 'bg-transparent text-gray-400 hover:text-white'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Trash / Active toggler */}
        <div className="flex gap-2 text-xs font-bold">
          <button
            onClick={() => setShowTrash(!showTrash)}
            className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${showTrash ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-[#18181A] border-zinc-800 text-gray-400 hover:text-white'}`}
          >
            🗑️ {showTrash ? 'Show Active' : 'Trash Bin'}
          </button>
          <button onClick={() => setShowImportModal(true)} className="bg-[#18181A] hover:bg-zinc-800 border border-zinc-800 text-gray-300 py-1.5 px-3 rounded-lg cursor-pointer">
            📥 Bulk Import CSV
          </button>
          <button onClick={triggerCSVExport} className="bg-[#18181A] hover:bg-zinc-800 border border-zinc-800 text-gray-300 py-1.5 px-3 rounded-lg cursor-pointer">
            📤 Bulk Export CSV
          </button>
        </div>
      </div>

      <div className="max-w-sm">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by catalog segment name..."
          className="w-full bg-[#131314] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none transition-colors"
        />
      </div>

      {/* Categories Table */}
      <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="text-center text-gray-400 py-16 animate-pulse text-xs">Loading categories catalog...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#A7A7A7] text-[10px] font-extrabold uppercase tracking-wider border-b border-[#2A2A2D] bg-[#1A1A1C]">
                  <th className="text-left px-5 py-3">Code</th>
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3">Hierarchy level</th>
                  <th className="text-left px-5 py-3">Sort Order</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2D]/40">
                {items.map(item => (
                  <tr key={item._id} className="hover:bg-[#1C1C1E] transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-[#D4A04D]">{item.code}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">{item.slug}</div>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        item.type === 'Category' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-purple-500/10 text-purple-400'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold">{item.displayOrder}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleStatus(item)}
                        className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border cursor-pointer ${
                          item.status === 'Active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          item.status === 'Draft' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}
                      >
                        {item.status}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-3 text-xs font-bold">
                        {!item.isDeleted ? (
                          <>
                            <button onClick={() => navigate(`/admin/categories/edit/${item.type}/${item._id}`)} className="text-[#D4A04D] hover:underline bg-transparent border-none cursor-pointer">Edit</button>
                            <button onClick={() => handleDuplicate(item)} className="text-gray-400 hover:underline bg-transparent border-none cursor-pointer">Duplicate</button>
                            <button onClick={() => handleDelete(item)} className="text-red-400 hover:underline bg-transparent border-none cursor-pointer">Delete</button>
                          </>
                        ) : (
                          <button onClick={() => handleRestore(item)} className="text-green-400 hover:underline bg-transparent border-none cursor-pointer">Restore</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-500 py-16 italic text-xs">No elements found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between border border-[#2A2A2D] bg-[#131314] px-6 py-4 rounded-xl shadow-lg">
          <div className="text-xs text-[#A7A7A7]">
            Showing page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span> ({total} elements)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3.5 py-2 rounded-lg bg-[#1C1C1E] border border-[#2A2A2D] text-white text-xs font-bold hover:bg-[#2A2A2D] disabled:opacity-40 disabled:pointer-events-none transition-colors border-none cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3.5 py-2 rounded-lg bg-[#1C1C1E] border border-[#2A2A2D] text-white text-xs font-bold hover:bg-[#2A2A2D] disabled:opacity-40 disabled:pointer-events-none transition-colors border-none cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#131314] border border-[#2A2A2D] p-6 rounded-2xl max-w-xl w-full space-y-4 shadow-2xl">
            <h3 className="text-white text-sm font-extrabold uppercase tracking-wider text-[#D4A04D]">Bulk Import Categories (CSV)</h3>
            <p className="text-[10px] text-gray-500">Paste your CSV strings containing headers: Type,Name,Code,Slug,ParentCodeOrName,DisplayOrder,Status</p>
            <textarea
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              placeholder="e.g.&#10;Type,Name,Code,Slug,ParentCodeOrName,DisplayOrder,Status&#10;Category,Eyeglasses,CAT-MEYE-001,eyeglasses,N/A,1,Active"
              rows={8}
              className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl p-4 text-xs text-white font-mono focus:outline-none resize-none"
            />
            {importStatus && <div className="text-xs font-semibold text-yellow-400 animate-pulse">{importStatus}</div>}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowImportModal(false)} className="px-4 py-2 rounded-xl text-xs bg-[#2A2A2D] text-white hover:bg-zinc-800 transition-colors font-bold uppercase border-none cursor-pointer">Cancel</button>
              <button onClick={handleCSVImport} className="px-4 py-2 rounded-xl text-xs bg-[#D4A04D] text-black hover:bg-[#C8923E] transition-colors font-bold uppercase border-none cursor-pointer">Import CSV</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
