import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';

interface CategoryItem {
  _id: string;
  name: string;
  code: string;
  slug: string;
  type: 'Category' | 'SubCategory' | 'SubSubCategory' | 'SubSubSubCategory';
  displayOrder: number;
  status: 'Draft' | 'Active' | 'Inactive' | 'Archived';
  isDeleted: boolean;
  categoryId?: { _id: string; name: string };
  subCategoryId?: { _id: string; name: string };
  subSubCategoryId?: { _id: string; name: string };
}

export default function CategoriesList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('Category');
  const showTrash = false; // Trash Bin functionality removed per request

  // Category, SubCategory & SubSubCategory filters
  const [parentCategories, setParentCategories] = useState<CategoryItem[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('');
  const [subCategoriesForFilter, setSubCategoriesForFilter] = useState<CategoryItem[]>([]);
  const [selectedSubCategoryFilter, setSelectedSubCategoryFilter] = useState<string>('');
  const [subSubCategoriesForFilter, setSubSubCategoriesForFilter] = useState<CategoryItem[]>([]);
  const [selectedSubSubCategoryFilter, setSelectedSubSubCategoryFilter] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.set('search', search);
      if (filterType) queryParams.set('type', filterType);
      if ((filterType === 'SubCategory' || filterType === 'SubSubCategory' || filterType === 'SubSubSubCategory') && selectedCategoryFilter) {
        queryParams.set('categoryId', selectedCategoryFilter);
      }
      if ((filterType === 'SubSubCategory' || filterType === 'SubSubSubCategory') && selectedSubCategoryFilter) {
        queryParams.set('subCategoryId', selectedSubCategoryFilter);
      }
      if (filterType === 'SubSubSubCategory' && selectedSubSubCategoryFilter) {
        queryParams.set('subSubCategoryId', selectedSubSubCategoryFilter);
      }
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
  }, [search, filterType, showTrash, page, selectedCategoryFilter, selectedSubCategoryFilter, selectedSubSubCategoryFilter]);

  // Fetch all parent categories for filter dropdown
  useEffect(() => {
    api.get('/admin/categories?type=Category&limit=1000')
      .then(res => {
        setParentCategories(res.data.items || []);
      })
      .catch(err => {
        console.error('Failed to fetch parent categories for filter:', err);
      });
  }, []);

  // Fetch sub-categories when parent category or filterType changes
  useEffect(() => {
    if (filterType === 'SubSubCategory' || filterType === 'SubSubSubCategory') {
      const url = selectedCategoryFilter
        ? `/admin/categories?type=SubCategory&categoryId=${selectedCategoryFilter}&limit=1000`
        : '/admin/categories?type=SubCategory&limit=1000';
      api.get(url)
        .then(res => {
          setSubCategoriesForFilter(res.data.items || []);
        })
        .catch(err => console.error('Failed to fetch sub-categories for filter:', err));
    } else {
      setSubCategoriesForFilter([]);
    }
  }, [filterType, selectedCategoryFilter]);

  // Fetch sub-sub-categories when parent sub-category or filterType changes
  useEffect(() => {
    if (filterType === 'SubSubSubCategory') {
      let url = '/admin/categories?type=SubSubCategory&limit=1000';
      if (selectedSubCategoryFilter) {
        url = `/admin/categories?type=SubSubCategory&subCategoryId=${selectedSubCategoryFilter}&limit=1000`;
      } else if (selectedCategoryFilter) {
        url = `/admin/categories?type=SubSubCategory&categoryId=${selectedCategoryFilter}&limit=1000`;
      }
      api.get(url)
        .then(res => {
          setSubSubCategoriesForFilter(res.data.items || []);
        })
        .catch(err => console.error('Failed to fetch sub-sub-categories for filter:', err));
    } else {
      setSubSubCategoriesForFilter([]);
    }
  }, [filterType, selectedCategoryFilter, selectedSubCategoryFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, filterType, showTrash, selectedCategoryFilter, selectedSubCategoryFilter, selectedSubSubCategoryFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Actions
  const toggleStatus = async (item: CategoryItem) => {
    try {
      const nextStatus = item.status === 'Active' ? 'Inactive' : 'Active';
      await api.put(`/admin/categories/${item.type || 'Category'}/${item._id}`, {
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
      await api.delete(`/admin/categories/${item.type || 'Category'}/${item._id}`);
      fetchCategories();
    } catch {
      setError('Failed to delete.');
    }
  };

  const handleRestore = async (item: CategoryItem) => {
    try {
      await api.put(`/admin/categories/${item.type || 'Category'}/${item._id}/restore`);
      fetchCategories();
    } catch {
      setError('Failed to restore.');
    }
  };

  const handleDuplicate = async (item: CategoryItem) => {
    try {
      await api.post(`/admin/categories/${item.type || 'Category'}/${item._id}/duplicate`);
      fetchCategories();
    } catch {
      setError('Failed to duplicate.');
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
          <button 
            onClick={() => navigate('/admin/categories/tree')} 
            className="bg-[#18181A] hover:bg-zinc-800 border border-zinc-700 text-[#D4A04D] font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2"
          >
            <span>🌳</span> Tree View
          </button>
          <button onClick={() => navigate('/admin/categories/add')} className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md border-none cursor-pointer">
            + Create Segment
          </button>
        </div>
      </div>

      {/* Dynamic Type Tabs */}
      <div className="flex border-b border-[#2A2A2D] gap-6 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => {
            setFilterType('Category');
            setSelectedCategoryFilter('');
            setSelectedSubCategoryFilter('');
          }}
          className={`pb-3 relative transition-colors cursor-pointer bg-transparent border-none ${
            filterType === 'Category' ? 'text-[#D4A04D]' : 'text-gray-400 hover:text-white'
          }`}
        >
          Categories
          {filterType === 'Category' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4A04D]" />
          )}
        </button>
        <button
          onClick={() => {
            setFilterType('SubCategory');
            setSelectedCategoryFilter('');
            setSelectedSubCategoryFilter('');
          }}
          className={`pb-3 relative transition-colors cursor-pointer bg-transparent border-none ${
            filterType === 'SubCategory' ? 'text-[#D4A04D]' : 'text-gray-400 hover:text-white'
          }`}
        >
          Sub-Categories
          {filterType === 'SubCategory' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4A04D]" />
          )}
        </button>
        <button
          onClick={() => {
            setFilterType('SubSubCategory');
            setSelectedCategoryFilter('');
            setSelectedSubCategoryFilter('');
            setSelectedSubSubCategoryFilter('');
          }}
          className={`pb-3 relative transition-colors cursor-pointer bg-transparent border-none ${
            filterType === 'SubSubCategory' ? 'text-[#D4A04D]' : 'text-gray-400 hover:text-white'
          }`}
        >
          Sub-Sub-Categories
          {filterType === 'SubSubCategory' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4A04D]" />
          )}
        </button>
        <button
          onClick={() => {
            setFilterType('SubSubSubCategory');
            setSelectedCategoryFilter('');
            setSelectedSubCategoryFilter('');
            setSelectedSubSubCategoryFilter('');
          }}
          className={`pb-3 relative transition-colors cursor-pointer bg-transparent border-none ${
            filterType === 'SubSubSubCategory' ? 'text-[#D4A04D]' : 'text-gray-400 hover:text-white'
          }`}
        >
          Sub-Sub-Sub-Categories
          {filterType === 'SubSubSubCategory' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4A04D]" />
          )}
        </button>
      </div>

      {/* Search & Category Filter row */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="max-w-sm flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by catalog segment name..."
            className="w-full bg-[#131314] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none transition-colors"
          />
        </div>

        {(filterType === 'SubCategory' || filterType === 'SubSubCategory' || filterType === 'SubSubSubCategory') && (
          <div className="w-full sm:w-60">
            <select
              value={selectedCategoryFilter}
              onChange={e => {
                setSelectedCategoryFilter(e.target.value);
                setSelectedSubCategoryFilter('');
                setSelectedSubSubCategoryFilter('');
                setPage(1);
              }}
              className="w-full bg-[#131314] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none transition-colors cursor-pointer"
            >
              <option value="">All Parent Categories</option>
              {parentCategories.map(cat => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {(filterType === 'SubSubCategory' || filterType === 'SubSubSubCategory') && (
          <div className="w-full sm:w-60">
            <select
              value={selectedSubCategoryFilter}
              onChange={e => {
                setSelectedSubCategoryFilter(e.target.value);
                setSelectedSubSubCategoryFilter('');
                setPage(1);
              }}
              className="w-full bg-[#131314] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none transition-colors cursor-pointer"
            >
              <option value="">All Parent Sub-Categories</option>
              {subCategoriesForFilter.map(sub => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {filterType === 'SubSubSubCategory' && (
          <div className="w-full sm:w-60">
            <select
              value={selectedSubSubCategoryFilter}
              onChange={e => {
                setSelectedSubSubCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#131314] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none transition-colors cursor-pointer"
            >
              <option value="">All Parent Sub-Sub-Categories</option>
              {subSubCategoriesForFilter.filter(ss => !/solution/i.test(ss.name || '')).map(ss => (
                <option key={ss._id} value={ss._id}>
                  {ss.name}
                </option>
              ))}
            </select>
          </div>
        )}
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
                  <th className="text-left px-5 py-3">Catalog Segment & Hierarchy Path</th>
                  <th className="text-left px-5 py-3">Sort Order</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2D]/40">
                {items.map(item => (
                  <tr key={item._id} className="hover:bg-[#1C1C1E] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-sm">{item.name}</div>
                      
                      {/* Tree Breadcrumb Path */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold mt-1">
                        {item.type === 'Category' && (
                          <span className="text-[#D4A04D] bg-[#D4A04D]/10 px-2 py-0.5 rounded border border-[#D4A04D]/20">Root Category</span>
                        )}
                        {item.type === 'SubCategory' && item.categoryId && (
                          <span className="text-gray-400 flex items-center gap-1">
                            <span className="text-gray-300 font-bold">{item.categoryId.name}</span>
                            <span className="text-[#D4A04D]">➔</span>
                            <span className="text-[#D4A04D] font-bold">{item.name}</span>
                          </span>
                        )}
                        {item.type === 'SubSubCategory' && (
                          <span className="text-gray-400 flex items-center gap-1">
                            {item.categoryId && <span>{item.categoryId.name}</span>}
                            {item.subCategoryId && (
                              <>
                                <span className="text-gray-500">➔</span>
                                <span className="text-gray-300 font-bold">{item.subCategoryId.name}</span>
                              </>
                            )}
                            <span className="text-[#D4A04D]">➔</span>
                            <span className="text-[#D4A04D] font-bold">{item.name}</span>
                          </span>
                        )}
                        {item.type === 'SubSubSubCategory' && (
                          <span className="text-gray-400 flex items-center gap-1">
                            {item.categoryId && <span>{item.categoryId.name}</span>}
                            {item.subCategoryId && (
                              <>
                                <span className="text-gray-500">➔</span>
                                <span>{item.subCategoryId.name}</span>
                              </>
                            )}
                            {item.subSubCategoryId && (
                              <>
                                <span className="text-gray-500">➔</span>
                                <span className="text-gray-300 font-bold">{item.subSubCategoryId.name}</span>
                              </>
                            )}
                            <span className="text-[#D4A04D]">➔</span>
                            <span className="text-[#D4A04D] font-bold">{item.name}</span>
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">{item.slug}</div>
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
                      <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
                        {!item.isDeleted ? (
                          <>
                            <button onClick={() => navigate(`/admin/categories/edit/${item.type || 'Category'}/${item._id}`)} className="text-gray-400 hover:text-white hover:underline bg-transparent border-none cursor-pointer">Edit</button>
                            <button onClick={() => handleDuplicate(item)} className="text-gray-400 hover:text-white hover:underline bg-transparent border-none cursor-pointer">Duplicate</button>
                            <button onClick={() => handleDelete(item)} className="text-red-400 hover:text-red-300 hover:underline bg-transparent border-none cursor-pointer">Delete</button>

                            {/* Direct Add Child Button */}
                            {item.type === 'Category' && (
                              <button
                                onClick={() => navigate(`/admin/categories/add?type=SubCategory&categoryId=${item._id}`)}
                                className="bg-[#D4A04D]/15 hover:bg-[#D4A04D]/25 border border-[#D4A04D]/30 text-[#D4A04D] px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider transition-colors cursor-pointer"
                              >
                                + Add Sub-Category
                              </button>
                            )}
                            {item.type === 'SubCategory' && (
                              <button
                                onClick={() => {
                                  const catId = typeof item.categoryId === 'object' ? item.categoryId._id : item.categoryId || '';
                                  navigate(`/admin/categories/add?type=SubSubCategory&categoryId=${catId}&subCategoryId=${item._id}`);
                                }}
                                className="bg-[#D4A04D]/15 hover:bg-[#D4A04D]/25 border border-[#D4A04D]/30 text-[#D4A04D] px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider transition-colors cursor-pointer"
                              >
                                + Add Sub-Sub
                              </button>
                            )}
                            {item.type === 'SubSubCategory' && !/solution/i.test(item.name || '') && (
                              <button
                                onClick={() => {
                                  const catId = typeof item.categoryId === 'object' ? item.categoryId._id : item.categoryId || '';
                                  const subId = typeof item.subCategoryId === 'object' ? item.subCategoryId._id : item.subCategoryId || '';
                                  navigate(`/admin/categories/add?type=SubSubSubCategory&categoryId=${catId}&subCategoryId=${subId}&subSubCategoryId=${item._id}`);
                                }}
                                className="bg-[#D4A04D]/15 hover:bg-[#D4A04D]/25 border border-[#D4A04D]/30 text-[#D4A04D] px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider transition-colors cursor-pointer"
                              >
                                + Add Sub-Sub-Sub
                              </button>
                            )}
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
                    <td colSpan={4} className="text-center text-gray-500 py-16 italic text-xs">No elements found</td>
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


    </div>
  );
}
