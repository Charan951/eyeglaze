import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Boxes,
  Check,
  Package,
  PackageX,
  Pencil,
  Search,
  X,
} from 'lucide-react';
import api from '../../lib/api';
import { socket } from '../../lib/socket';

interface ColorStock {
  name: string;
  hex?: string;
  images?: string[];
  stock: number;
}

interface InventoryItem {
  _id?: string;
  id?: string;
  sku: string;
  name: string;
  soldCount: number;
  colors: ColorStock[];
  isActive: boolean;
  isBestseller?: boolean;
  thumbnail?: string;
  images?: string[];
  totalStock?: number;
}

type StockFilter = 'all' | 'out' | 'low' | 'inactive';

const LOW_STOCK = 10;

function itemId(item: InventoryItem) {
  return item.id || item._id || '';
}

function totalUnits(item: InventoryItem) {
  if (typeof item.totalStock === 'number') return item.totalStock;
  return item.colors.reduce((sum, c) => sum + (c.stock || 0), 0);
}

function productThumb(item: InventoryItem) {
  const fromColor = item.colors.find((c) => c.images && c.images.length > 0)?.images?.[0];
  return fromColor || item.thumbnail || item.images?.[0] || '';
}

function stockTone(stock: number) {
  if (stock === 0) return 'text-red-400';
  if (stock < LOW_STOCK) return 'text-yellow-400';
  return 'text-emerald-400';
}

function stockLabel(stock: number) {
  if (stock === 0) return 'Out';
  return `${stock}`;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StockFilter>('all');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editColors, setEditColors] = useState<ColorStock[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const startEdit = (item: InventoryItem) => {
    setEditingItemId(itemId(item));
    setEditColors(item.colors.map((c) => ({
      name: c.name,
      hex: c.hex || '#A7A7A7',
      images: c.images || [],
      stock: c.stock,
    })));
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditColors([]);
  };

  const handleStockChange = (idx: number, stockVal: number) => {
    const updated = [...editColors];
    updated[idx].stock = Math.max(0, stockVal);
    setEditColors(updated);
  };

  const handleHexChange = (idx: number, hexVal: string) => {
    const updated = [...editColors];
    updated[idx].hex = hexVal;
    setEditColors(updated);
  };

  const saveEdit = async (id: string) => {
    setSavingId(id);
    try {
      const item = items.find((i) => itemId(i) === id);
      if (!item) return;

      await api.put(`/admin/products/${id}`, { colors: editColors });

      setItems((prev) =>
        prev.map((i) => (itemId(i) === id
          ? { ...i, colors: editColors, totalStock: editColors.reduce((s, c) => s + (c.stock || 0), 0) }
          : i))
      );
      showToast('Stock and colors updated.', 'success');
      setEditingItemId(null);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update stock', 'error');
    } finally {
      setSavingId(null);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchInventory = () => {
      api.get('/admin/inventory')
        .then((res) => {
          if (!active) return;
          setItems(res.data.inventory || res.data || []);
        })
        .catch(() => {})
        .finally(() => active && setLoading(false));
    };

    fetchInventory();
    socket.on('product_changed', fetchInventory);
    socket.on('inventory_changed', fetchInventory);
    socket.on('order_changed', fetchInventory);

    return () => {
      active = false;
      socket.off('product_changed', fetchInventory);
      socket.off('inventory_changed', fetchInventory);
      socket.off('order_changed', fetchInventory);
    };
  }, []);

  const toggleActive = async (id: string) => {
    const item = items.find((i) => itemId(i) === id);
    if (!item) return;

    try {
      await api.put(`/admin/products/${id}`, { isActive: !item.isActive });
      setItems((prev) =>
        prev.map((i) => (itemId(i) === id ? { ...i, isActive: !i.isActive } : i))
      );
    } catch (err) {
      console.error('Failed to toggle active status in database:', err);
    }
  };

  const colorStats = useMemo(() => {
    const colors = items.flatMap((i) => i.colors);
    return {
      products: items.length,
      units: colors.reduce((sum, c) => sum + (c.stock || 0), 0),
      out: colors.filter((c) => c.stock === 0).length,
      low: colors.filter((c) => c.stock > 0 && c.stock < LOW_STOCK).length,
      inactive: items.filter((i) => !i.isActive).length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const units = totalUnits(item);
      const hasOut = item.colors.some((c) => c.stock === 0);
      const hasLow = item.colors.some((c) => c.stock > 0 && c.stock < LOW_STOCK);

      if (filter === 'out' && !hasOut) return false;
      if (filter === 'low' && !hasLow) return false;
      if (filter === 'inactive' && item.isActive) return false;

      if (!q) return true;
      const hay = [
        item.name,
        item.sku,
        ...item.colors.map((c) => c.name),
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [items, search, filter]);

  const filters: { id: StockFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: colorStats.products },
    { id: 'out', label: 'Out of stock', count: colorStats.out },
    { id: 'low', label: 'Low stock', count: colorStats.low },
    { id: 'inactive', label: 'Inactive', count: colorStats.inactive },
  ];

  return (
    <div className="relative space-y-6">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl border text-sm font-semibold ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}
        >
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.message}
        </div>
      )}

      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inventory</h1>
          <p className="text-[#A7A7A7] text-sm mt-1">Stock by product and color. Changes save to the live catalog.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'Products', value: colorStats.products, hint: 'in catalog', icon: Boxes, tone: 'text-white' },
          { label: 'Units on hand', value: colorStats.units, hint: 'across all colors', icon: Package, tone: 'text-[#D4A04D]' },
          { label: 'Out of stock', value: colorStats.out, hint: 'color variants', icon: PackageX, tone: 'text-red-400' },
          { label: 'Low stock', value: colorStats.low, hint: `under ${LOW_STOCK} units`, icon: AlertTriangle, tone: 'text-yellow-400' },
        ].map(({ label, value, hint, icon: Icon, tone }) => (
          <div key={label} className="bg-[#131314] border border-[#2A2A2D] rounded-xl px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#A7A7A7] text-[11px] font-bold uppercase tracking-wider">{label}</span>
              <Icon className="w-4 h-4 text-[#D4A04D]" />
            </div>
            <div className={`text-2xl font-bold tabular-nums ${tone}`}>{loading ? '—' : value}</div>
            <div className="text-[#A7A7A7] text-[11px] mt-1">{hint}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A7A7A7] pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, SKU, or color…"
            className="w-full bg-[#131314] border border-[#2A2A2D] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-[#6B6B70] focus:border-[#D4A04D] focus:outline-none transition-colors duration-150"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border transition-colors duration-150 ${
                  active
                    ? 'bg-[#D4A04D] text-black border-[#D4A04D]'
                    : 'bg-[#131314] text-[#A7A7A7] border-[#2A2A2D] hover:border-[#D4A04D]/50 hover:text-white'
                }`}
              >
                {f.label}
                <span className={`ml-1.5 tabular-nums ${active ? 'text-black/70' : 'text-[#6B6B70]'}`}>{f.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-[#2A2A2D]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-14 h-14 rounded-lg bg-[#1C1C1E]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 bg-[#1C1C1E] rounded" />
                  <div className="h-3 w-24 bg-[#1C1C1E] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center">
            <Boxes className="w-8 h-8 text-[#D4A04D] mx-auto mb-3" />
            <p className="text-white font-semibold">{items.length === 0 ? 'No data is added' : 'No matching results'}</p>
            {items.length > 0 && (
              <p className="text-[#A7A7A7] text-sm mt-1">Try a different search or stock filter.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#A7A7A7] text-[10px] font-extrabold uppercase tracking-wider border-b border-[#2A2A2D] bg-[#1A1A1C]">
                  <th className="text-left px-5 py-3">Product</th>
                  <th className="text-left px-5 py-3">Colors / Stock</th>
                  <th className="text-right px-5 py-3">On hand</th>
                  <th className="text-right px-5 py-3">Sold</th>
                  <th className="text-left px-5 py-3">Active</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const id = itemId(item);
                  const editing = editingItemId === id;
                  const thumb = productThumb(item);
                  const units = totalUnits(item);

                  return (
                    <tr
                      key={id}
                      className={`border-b border-[#2A2A2D] last:border-b-0 align-top transition-colors duration-150 ${
                        editing ? 'bg-[#1E1911]/60' : 'hover:bg-[#1C1C1E]'
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-[220px]">
                          <div className="w-14 h-14 rounded-lg bg-[#0B0B0C] border border-[#2A2A2D] overflow-hidden flex-shrink-0">
                            {thumb ? (
                              <img src={thumb} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Boxes className="w-5 h-5 text-[#D4A04D]/50" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-white font-semibold leading-snug truncate">{item.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] font-mono text-[#A7A7A7]">{item.sku || '—'}</span>
                              {item.isBestseller && (
                                <span className="text-[9px] bg-[#D4A04D]/10 text-[#D4A04D] border border-[#D4A04D]/20 px-1.5 py-0.5 rounded font-extrabold uppercase">
                                  Bestseller
                                </span>
                              )}
                            </div>
                            <Link
                              to={`/admin/products/edit/${id}`}
                              className="text-[10px] font-bold uppercase tracking-wider text-[#D4A04D] hover:text-[#C8923E] mt-1 inline-block"
                            >
                              Open product
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {editing ? (
                          <div className="space-y-2 min-w-[320px] max-w-lg">
                            {editColors.map((c, idx) => (
                              <div
                                key={`${c.name}-${idx}`}
                                className="flex items-center gap-2 bg-[#0B0B0C] border border-[#2A2A2D] p-2 rounded-lg"
                              >
                                <span
                                  className="w-4 h-4 rounded-full border border-white/10 flex-shrink-0"
                                  style={{ background: c.hex && c.hex.startsWith('#') ? c.hex : '#A7A7A7' }}
                                />
                                <div className="flex-1 text-xs text-white truncate font-semibold">{c.name}</div>
                                <input
                                  type="color"
                                  value={c.hex && c.hex.startsWith('#') && c.hex.length === 7 ? c.hex : '#A7A7A7'}
                                  onChange={(e) => handleHexChange(idx, e.target.value)}
                                  className="w-7 h-7 border-none bg-transparent cursor-pointer rounded"
                                  disabled={savingId === id}
                                  aria-label={`${c.name} color`}
                                />
                                <input
                                  type="text"
                                  value={c.hex || ''}
                                  onChange={(e) => handleHexChange(idx, e.target.value)}
                                  className="w-[4.5rem] bg-[#131314] border border-[#2A2A2D] rounded px-1.5 py-1 text-white text-[10px] font-mono focus:outline-none focus:border-[#D4A04D]"
                                  placeholder="#HEX"
                                  disabled={savingId === id}
                                />
                                <input
                                  type="number"
                                  value={c.stock}
                                  onChange={(e) => handleStockChange(idx, parseInt(e.target.value, 10) || 0)}
                                  className="w-16 bg-[#131314] border border-[#2A2A2D] rounded px-2 py-1 text-white text-xs font-bold text-center focus:border-[#D4A04D] focus:outline-none"
                                  min={0}
                                  disabled={savingId === id}
                                  aria-label={`${c.name} stock`}
                                />
                              </div>
                            ))}
                            <div className="flex gap-2 justify-end pt-1">
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="inline-flex items-center gap-1 bg-[#1C1C1E] hover:bg-[#2A2A2D] text-white text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-md transition-colors duration-150"
                                disabled={savingId === id}
                              >
                                <X className="w-3 h-3" />
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => saveEdit(id)}
                                className="inline-flex items-center gap-1 bg-[#D4A04D] hover:bg-[#C8923E] text-black text-[10px] font-black uppercase tracking-wider py-1.5 px-3 rounded-md transition-colors duration-150 disabled:opacity-60"
                                disabled={savingId === id}
                              >
                                <Check className="w-3 h-3" />
                                {savingId === id ? 'Saving…' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex flex-wrap gap-1.5 max-w-xl">
                              {item.colors.map((c) => (
                                <span
                                  key={c.name}
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] ${
                                    c.stock === 0
                                      ? 'border-red-400/30 bg-red-400/5'
                                      : c.stock < LOW_STOCK
                                        ? 'border-yellow-400/30 bg-yellow-400/5'
                                        : 'border-[#2A2A2D] bg-[#0B0B0C]'
                                  }`}
                                >
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-white/15 flex-shrink-0"
                                    style={{ background: c.hex && c.hex.startsWith('#') ? c.hex : '#A7A7A7' }}
                                  />
                                  <span className="text-[#A7A7A7] capitalize">{c.name}</span>
                                  <span className={`font-bold tabular-nums ${stockTone(c.stock)}`}>
                                    {stockLabel(c.stock)}
                                  </span>
                                </span>
                              ))}
                              {item.colors.length === 0 && (
                                <span className="text-[#6B6B70] text-xs italic">No colors</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="mt-2 inline-flex items-center gap-1 text-[#D4A04D] hover:text-[#C8923E] transition-colors duration-150 text-[10px] font-bold uppercase tracking-wider bg-transparent border-none cursor-pointer p-0"
                            >
                              <Pencil className="w-3 h-3" />
                              Edit stock & colors
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className={`text-base font-bold tabular-nums ${units === 0 ? 'text-red-400' : units < LOW_STOCK ? 'text-yellow-400' : 'text-white'}`}>
                          {units}
                        </div>
                        <div className="text-[10px] text-[#6B6B70] uppercase tracking-wider">units</div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="text-white font-semibold tabular-nums">{item.soldCount ?? 0}</div>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => toggleActive(id)}
                          aria-pressed={item.isActive}
                          aria-label={item.isActive ? 'Deactivate product' : 'Activate product'}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A04D] ${
                            item.isActive ? 'bg-[#D4A04D]' : 'bg-[#2A2A2D]'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-150 ${
                              item.isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <div className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${item.isActive ? 'text-emerald-400' : 'text-[#6B6B70]'}`}>
                          {item.isActive ? 'Live' : 'Off'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
