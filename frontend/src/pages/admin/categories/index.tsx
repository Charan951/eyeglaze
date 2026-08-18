import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../lib/api';
import { ADD_CHILD_LABEL, ADD_VARIANT_LABEL, catalogListPath } from './levelLabels';

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

// Drill-down depth: 0 = root grid of Categories (no sidebar).
// 1 = a Category is selected — sidebar lists Categories, cards show its Collections.
// 2 = a Collection is selected — sidebar lists Collections, tabs show Types | Variants.
type Level = 0 | 1 | 2;
type CollectionTab = 'types' | 'variants';

function statusPillClasses(status: CategoryItem['status']) {
  if (status === 'Active') return 'bg-green-500/10 text-green-400 border-green-500/20';
  if (status === 'Draft') return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
  return 'bg-red-500/10 text-red-400 border-red-500/20';
}

export default function CategoriesList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [level, setLevel] = useState<Level>(0);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [subCategories, setSubCategories] = useState<CategoryItem[]>([]);
  const [subSubCategories, setSubSubCategories] = useState<CategoryItem[]>([]);
  const [subSubSubCategories, setSubSubSubCategories] = useState<CategoryItem[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<CategoryItem | null>(null);
  const [collectionTab, setCollectionTab] = useState<CollectionTab>('types');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchCategories = useCallback(async () => {
    const res = await api.get('/admin/categories?type=Category&isDeleted=false&limit=1000');
    setCategories(res.data.items || []);
  }, []);

  const fetchSubCategories = useCallback(async (categoryId: string) => {
    const res = await api.get(`/admin/categories?type=SubCategory&categoryId=${categoryId}&isDeleted=false&limit=1000`);
    setSubCategories(res.data.items || []);
  }, []);

  const fetchSubSubCategories = useCallback(async (subCategoryId: string) => {
    const res = await api.get(`/admin/categories?type=SubSubCategory&subCategoryId=${subCategoryId}&isDeleted=false&limit=1000`);
    setSubSubCategories(res.data.items || []);
  }, []);

  const fetchSubSubSubCategories = useCallback(async (subCategoryId: string) => {
    const res = await api.get(`/admin/categories?type=SubSubSubCategory&subCategoryId=${subCategoryId}&isDeleted=false&limit=1000`);
    setSubSubSubCategories(res.data.items || []);
  }, []);

  const syncDrillUrl = useCallback((catId?: string | null, subId?: string | null, tab?: CollectionTab | null) => {
    const next = catalogListPath({
      categoryId: catId,
      subCategoryId: subId,
      tab: tab && tab !== 'types' ? tab : undefined,
    });
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== next) {
      const qs = next.includes('?') ? next.split('?')[1] : '';
      setSearchParams(qs ? Object.fromEntries(new URLSearchParams(qs)) : {}, { replace: true });
    }
  }, [setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const catRes = await api.get('/admin/categories?type=Category&isDeleted=false&limit=1000');
        const cats: CategoryItem[] = catRes.data.items || [];
        if (cancelled) return;
        setCategories(cats);

        const catId = searchParams.get('categoryId');
        const subId = searchParams.get('subCategoryId');
        const tab = searchParams.get('tab') === 'variants' ? 'variants' : 'types';
        if (!catId) return;

        const cat = cats.find((c) => c._id === catId);
        if (!cat) return;
        setSelectedCategory(cat);

        const subRes = await api.get(`/admin/categories?type=SubCategory&categoryId=${cat._id}&isDeleted=false&limit=1000`);
        const subs: CategoryItem[] = subRes.data.items || [];
        if (cancelled) return;
        setSubCategories(subs);
        setLevel(1);

        if (!subId) return;
        const sub = subs.find((s) => s._id === subId);
        if (!sub) return;
        setSelectedSubCategory(sub);
        setCollectionTab(tab);

        const [typeRes, varRes] = await Promise.all([
          api.get(`/admin/categories?type=SubSubCategory&subCategoryId=${sub._id}&isDeleted=false&limit=1000`),
          api.get(`/admin/categories?type=SubSubSubCategory&subCategoryId=${sub._id}&isDeleted=false&limit=1000`),
        ]);
        if (cancelled) return;
        setSubSubCategories(typeRes.data.items || []);
        setSubSubSubCategories(varRes.data.items || []);
        setLevel(2);
      } catch {
        if (!cancelled) setError('Failed to fetch category catalog.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // Restore drill-down once from the URL (e.g. returning from Add Variant).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch whichever list is currently on screen, e.g. after an edit/delete/duplicate.
  const refreshCurrentLevel = useCallback(() => {
    if (level === 0) {
      fetchCategories().catch(() => setError('Failed to fetch category catalog.'));
    } else if (level === 1 && selectedCategory) {
      fetchSubCategories(selectedCategory._id).catch(() => setError('Failed to fetch collections.'));
    } else if (level === 2 && selectedSubCategory) {
      fetchSubSubCategories(selectedSubCategory._id).catch(() => setError('Failed to fetch types.'));
      fetchSubSubSubCategories(selectedSubCategory._id).catch(() => setError('Failed to fetch variants.'));
    }
    if (level === 1) fetchCategories().catch(() => {});
    if (level === 2 && selectedCategory) fetchSubCategories(selectedCategory._id).catch(() => {});
  }, [level, selectedCategory, selectedSubCategory, fetchCategories, fetchSubCategories, fetchSubSubCategories, fetchSubSubSubCategories]);

  const openCategory = (cat: CategoryItem) => {
    setSelectedCategory(cat);
    setSelectedSubCategory(null);
    setCollectionTab('types');
    setLevel(1);
    setSearch('');
    syncDrillUrl(cat._id);
    fetchSubCategories(cat._id).catch(() => setError('Failed to fetch collections.'));
  };

  const openSubCategory = (sub: CategoryItem) => {
    setSelectedSubCategory(sub);
    setCollectionTab('types');
    setLevel(2);
    setSearch('');
    syncDrillUrl(selectedCategory?._id, sub._id);
    fetchSubSubCategories(sub._id).catch(() => setError('Failed to fetch types.'));
    fetchSubSubSubCategories(sub._id).catch(() => setError('Failed to fetch variants.'));
  };

  const switchCollectionTab = (tab: CollectionTab) => {
    setCollectionTab(tab);
    setSearch('');
    syncDrillUrl(selectedCategory?._id, selectedSubCategory?._id, tab);
  };

  const backToRoot = () => {
    setLevel(0);
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setCollectionTab('types');
    setSearch('');
    syncDrillUrl();
  };

  // Actions
  const toggleStatus = async (item: CategoryItem) => {
    try {
      const nextStatus = item.status === 'Active' ? 'Inactive' : 'Active';
      await api.put(`/admin/categories/${item.type || 'Category'}/${item._id}`, {
        basic: { name: item.name, code: item.code, status: nextStatus, slug: item.slug }
      });
      refreshCurrentLevel();
    } catch {
      setError('Failed to toggle status.');
    }
  };

  const handleDelete = async (item: CategoryItem) => {
    if (!confirm(`Soft delete ${item.name}?`)) return;
    try {
      await api.delete(`/admin/categories/${item.type || 'Category'}/${item._id}`);
      refreshCurrentLevel();
    } catch {
      setError('Failed to delete.');
    }
  };

  const handleDuplicate = async (item: CategoryItem) => {
    try {
      await api.post(`/admin/categories/${item.type || 'Category'}/${item._id}/duplicate`);
      refreshCurrentLevel();
    } catch {
      setError('Failed to duplicate.');
    }
  };

  // Which list is the "main" grid for the current level, and how to open/add-child for it.
  const mainItems: CategoryItem[] =
    level === 0 ? categories :
    level === 1 ? subCategories :
    collectionTab === 'variants' ? subSubSubCategories :
    subSubCategories;

  const filteredMainItems = search
    ? mainItems.filter(it => it.name.toLowerCase().includes(search.toLowerCase()))
    : mainItems;

  const openMainItem = (item: CategoryItem) => {
    if (level === 0) openCategory(item);
    else if (level === 1) openSubCategory(item);
  };

  const addChildFor = (item: CategoryItem) => {
    if (item.type === 'Category') {
      navigate(`/admin/categories/add?type=SubCategory&categoryId=${item._id}`);
    } else if (item.type === 'SubCategory') {
      const catId = typeof item.categoryId === 'object' ? item.categoryId?._id : item.categoryId || '';
      if (collectionTab === 'variants' && level === 2) {
        navigate(`/admin/categories/add?type=SubSubSubCategory&categoryId=${catId}&subCategoryId=${item._id}`);
      } else {
        navigate(`/admin/categories/add?type=SubSubCategory&categoryId=${catId}&subCategoryId=${item._id}`);
      }
    }
  };

  const addVariantForCollection = (item: CategoryItem) => {
    const catId = typeof item.categoryId === 'object' ? item.categoryId?._id : item.categoryId || selectedCategory?._id || '';
    navigate(`/admin/categories/add?type=SubSubSubCategory&categoryId=${catId}&subCategoryId=${item._id}`);
  };

  const addChildLabel = (item: CategoryItem): string | null => {
    return ADD_CHILD_LABEL[item.type] || null;
  };

  const canOpen = level < 2;

  const sidebarItems: CategoryItem[] =
    level === 1 ? categories :
    level === 2 ? subCategories :
    [];
  const sidebarTitle = level === 1 ? 'Categories' : 'Collections';
  const sidebarActiveId =
    level === 1 ? selectedCategory?._id :
    selectedSubCategory?._id;
  const sidebarOnClick =
    level === 1 ? openCategory :
    openSubCategory;

  const gridLabel =
    level === 0 ? 'Categories' :
    level === 1 ? `Collections in "${selectedCategory?.name}"` :
    collectionTab === 'variants'
      ? `Variants in "${selectedSubCategory?.name}"`
      : `Types in "${selectedSubCategory?.name}"`;

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
          <button
            onClick={() => {
              if (level === 2 && selectedSubCategory && collectionTab === 'variants') addVariantForCollection(selectedSubCategory);
              else if (level === 2 && selectedSubCategory) addChildFor(selectedSubCategory);
              else if (level === 1 && selectedCategory) addChildFor(selectedCategory);
              else navigate('/admin/categories/add');
            }}
            className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md border-none cursor-pointer"
          >
            {level === 2 && collectionTab === 'variants' ? ADD_VARIANT_LABEL : level === 2 ? ADD_CHILD_LABEL.SubCategory : level === 1 ? ADD_CHILD_LABEL.Category : '+ Create Segment'}
          </button>
        </div>
      </div>

      {/* Back button + breadcrumb, once drilled below the root grid */}
      {level > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={backToRoot}
            className="bg-[#18181A] hover:bg-zinc-800 border border-zinc-700 text-white font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
          >
            ← Back to Categories
          </button>
          <div className="text-xs font-semibold flex items-center gap-1.5 flex-wrap">
            <button
              onClick={backToRoot}
              className="bg-transparent border-none cursor-pointer p-0 text-gray-400 hover:text-white hover:underline transition-colors"
            >
              Categories
            </button>
            <span className="text-gray-600">➔</span>
            {selectedCategory && (
              level === 1 ? (
                <span className="text-[#D4A04D] font-bold">{selectedCategory.name}</span>
              ) : (
                <button
                  onClick={() => openCategory(selectedCategory)}
                  className="bg-transparent border-none cursor-pointer p-0 text-gray-300 hover:text-white hover:underline transition-colors"
                >
                  {selectedCategory.name}
                </button>
              )
            )}
            {selectedSubCategory && (
              <>
                <span className="text-gray-600">➔</span>
                <span className="text-[#D4A04D] font-bold">{selectedSubCategory.name}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="max-w-sm">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${gridLabel.toLowerCase()}...`}
          className="w-full bg-[#131314] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none transition-colors"
        />
      </div>

      {/* Sidebar + Grid */}
      <div className="flex gap-6 items-start">
        {level > 0 && (
          <div className="w-60 shrink-0 bg-[#131314] border border-[#2A2A2D] rounded-2xl p-3 space-y-1 sticky top-4">
            <div className="text-[10px] text-gray-500 font-black uppercase tracking-wider px-2 pb-2">{sidebarTitle}</div>
            {sidebarItems.map(it => (
              <button
                key={it._id}
                onClick={() => sidebarOnClick(it)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border-none ${
                  sidebarActiveId === it._id
                    ? 'bg-[#D4A04D]/15 text-[#D4A04D] border border-[#D4A04D]/30'
                    : 'text-gray-300 hover:bg-[#1C1C1E] bg-transparent border border-transparent'
                }`}
              >
                {it.name}
              </button>
            ))}
            {sidebarItems.length === 0 && (
              <div className="text-[10px] text-gray-600 italic px-2 py-2">No data is added</div>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-4">
          {level === 2 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => switchCollectionTab('types')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-colors ${
                  collectionTab === 'types'
                    ? 'bg-[#D4A04D] text-black border-[#D4A04D]'
                    : 'bg-[#131314] text-gray-400 border-[#2A2A2D] hover:text-white'
                }`}
              >
                Types
              </button>
              <button
                type="button"
                onClick={() => switchCollectionTab('variants')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-colors ${
                  collectionTab === 'variants'
                    ? 'bg-[#D4A04D] text-black border-[#D4A04D]'
                    : 'bg-[#131314] text-gray-400 border-[#2A2A2D] hover:text-white'
                }`}
              >
                Variants
              </button>
            </div>
          )}
          <h2 className="text-sm font-black uppercase tracking-wider text-gray-400">{gridLabel}</h2>

          {loading ? (
            <div className="text-center text-gray-400 py-16 animate-pulse text-xs">Loading categories catalog...</div>
          ) : filteredMainItems.length === 0 ? (
            <div className="text-center text-gray-500 py-16 italic text-xs bg-[#131314] border border-[#2A2A2D] rounded-2xl">No data is added</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMainItems.map(item => {
                const childLabel = addChildLabel(item);
                return (
                  <div
                    key={item._id}
                    onClick={() => canOpen && openMainItem(item)}
                    className={`bg-[#131314] border border-[#2A2A2D] rounded-2xl p-5 flex flex-col gap-3 transition-colors ${
                      canOpen ? 'hover:border-[#D4A04D]/60 cursor-pointer group' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className={`font-bold text-white text-base truncate ${canOpen ? 'group-hover:text-[#D4A04D] transition-colors' : ''}`}>{item.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5 truncate">{item.slug}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStatus(item); }}
                        className={`shrink-0 px-2 py-0.5 rounded text-[8px] font-black uppercase border cursor-pointer ${statusPillClasses(item.status)}`}
                      >
                        {item.status}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold">
                      <span>Sort #{item.displayOrder}</span>
                      {canOpen && <span className="text-[#D4A04D] font-bold opacity-0 group-hover:opacity-100 transition-opacity">View →</span>}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold pt-2 border-t border-[#2A2A2D]/60" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => navigate(`/admin/categories/edit/${item.type || 'Category'}/${item._id}`)} className="text-gray-400 hover:text-white hover:underline bg-transparent border-none cursor-pointer">Edit</button>
                      <button onClick={() => handleDuplicate(item)} className="text-gray-400 hover:text-white hover:underline bg-transparent border-none cursor-pointer">Duplicate</button>
                      <button onClick={() => handleDelete(item)} className="text-red-400 hover:text-red-300 hover:underline bg-transparent border-none cursor-pointer">Delete</button>
                      {childLabel && (
                        <button
                          onClick={() => addChildFor(item)}
                          className="ml-auto bg-[#D4A04D]/15 hover:bg-[#D4A04D]/25 border border-[#D4A04D]/30 text-[#D4A04D] px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider transition-colors cursor-pointer"
                        >
                          {childLabel}
                        </button>
                      )}
                      {item.type === 'SubCategory' && (
                        <button
                          onClick={() => addVariantForCollection(item)}
                          className={`${childLabel ? '' : 'ml-auto '}bg-[#D4A04D]/15 hover:bg-[#D4A04D]/25 border border-[#D4A04D]/30 text-[#D4A04D] px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider transition-colors cursor-pointer`}
                        >
                          {ADD_VARIANT_LABEL}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
