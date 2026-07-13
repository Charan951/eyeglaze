import { useState, useEffect } from 'react';
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
}

const mockInventory: InventoryItem[] = [
  { _id: '1', sku: 'EG-2041', name: 'Matte Square Frame', soldCount: 412, colors: [{ name: 'Matte Black', stock: 45, hex: '#131314' }, { name: 'Black Gold', stock: 8, hex: '#D4A04D' }], isActive: true },
  { _id: '2', sku: 'EG-1067', name: 'Premium Clubmaster Frame', soldCount: 238, colors: [{ name: 'Brown', stock: 0, hex: '#5C3D2E' }, { name: 'Black', stock: 22, hex: '#131314' }], isActive: true },
  { _id: '3', sku: 'EG-3012', name: 'Classic Aviator', soldCount: 567, colors: [{ name: 'Gold', stock: 33, hex: '#D4A04D' }, { name: 'Silver', stock: 15, hex: '#E5E7EB' }], isActive: true },
  { _id: '4', sku: 'EG-4055', name: 'Round Metal Frame', soldCount: 89, colors: [{ name: 'Rose Gold', stock: 2, hex: '#FBCFE8' }], isActive: false },
];

const LOW_STOCK = 10;

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(mockInventory);
  const [loading, setLoading] = useState(true);

  // Stock and Color Editing State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editColors, setEditColors] = useState<ColorStock[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const startEdit = (item: InventoryItem) => {
    setEditingItemId(item.id || item._id || '');
    setEditColors(item.colors.map(c => ({
      name: c.name,
      hex: c.hex || '#A7A7A7',
      images: c.images || [],
      stock: c.stock
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

  const saveEdit = async (itemId: string) => {
    setSavingId(itemId);
    try {
      const item = items.find(i => (i.id || i._id) === itemId);
      if (!item) return;

      // Update the product's colors array
      await api.put(`/admin/products/${itemId}`, {
        colors: editColors
      });

      // Update local state
      setItems(prevItems =>
        prevItems.map(i => ((i.id || i._id) === itemId ? { ...i, colors: editColors } : i))
      );
      showToast('Stock and colors updated successfully!', 'success');
      setEditingItemId(null);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to update stock';
      showToast(errMsg, 'error');
    } finally {
      setSavingId(null);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchInventory = () => {
      api.get('/admin/inventory')
        .then(res => {
          if (!active) return;
          setItems(res.data.inventory || res.data || []);
        })
        .catch(() => {})
        .finally(() => active && setLoading(false));
    };

    fetchInventory();

    socket.on('product_changed', fetchInventory);
    socket.on('order_changed', fetchInventory);

    return () => {
      active = false;
      socket.off('product_changed', fetchInventory);
      socket.off('order_changed', fetchInventory);
    };
  }, []);

  const toggleActive = async (id: string) => {
    const item = items.find(i => (i._id || i.id) === id);
    if (!item) return;

    try {
      await api.put(`/admin/products/${id}`, { isActive: !item.isActive });
      setItems(prevItems =>
        prevItems.map(i => ((i._id || i.id) === id ? { ...i, isActive: !i.isActive } : i))
      );
    } catch (err) {
      console.error('Failed to toggle active status in database:', err);
    }
  };

  if (loading) {
    return <div className="text-center text-[#A7A7A7] py-10">Loading...</div>;
  }

  return (
    <div className="relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl border text-sm font-bold transition-all duration-300 ${toast.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
          {toast.type === 'success' ? '✓ ' : '✕ '} {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Inventory</h1>
        <div className="flex gap-3 text-sm">
          <div className="bg-red-400/10 text-red-400 px-3 py-1.5 rounded-lg">
            {items.flatMap(i => i.colors).filter(c => c.stock === 0).length} Out of Stock
          </div>
          <div className="bg-yellow-400/10 text-yellow-400 px-3 py-1.5 rounded-lg">
            {items.flatMap(i => i.colors).filter(c => c.stock > 0 && c.stock < LOW_STOCK).length} Low Stock
          </div>
        </div>
      </div>

      <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#A7A7A7] text-xs uppercase border-b border-[#2A2A2D]">
                <th className="text-left px-5 py-3">Product</th>
                <th className="text-left px-5 py-3">Colors / Stock</th>
                <th className="text-left px-5 py-3">Sold</th>
                <th className="text-left px-5 py-3">Active</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const itemId = item.id || item._id || '';
                return (
                  <tr key={itemId} className="border-b border-[#2A2A2D] hover:bg-[#2A2A2D]/40 transition-colors">
                    <td className="px-5 py-4 text-white font-semibold">{item.name}</td>
                    <td className="px-5 py-4">
                      {editingItemId === itemId ? (
                        <div className="space-y-3 min-w-[280px]">
                          {editColors.map((c, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-[#0B0B0C] border border-[#2A2A2D] p-2 rounded-lg">
                              <div className="flex-1 text-xs text-white truncate font-bold">{c.name}</div>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={c.hex && c.hex.startsWith('#') && c.hex.length === 7 ? c.hex : '#A7A7A7'}
                                  onChange={(e) => handleHexChange(idx, e.target.value)}
                                  className="w-5 h-5 border-none bg-transparent cursor-pointer rounded"
                                  disabled={savingId === itemId}
                                />
                                <input
                                  type="text"
                                  value={c.hex || ''}
                                  onChange={(e) => handleHexChange(idx, e.target.value)}
                                  className="w-16 bg-[#131314] border border-[#2A2A2D] rounded px-1.5 py-0.5 text-white text-[10px] focus:outline-none"
                                  placeholder="#HEX"
                                  disabled={savingId === itemId}
                                />
                              </div>
                              <input
                                type="number"
                                value={c.stock}
                                onChange={(e) => handleStockChange(idx, parseInt(e.target.value) || 0)}
                                className="w-16 bg-[#131314] border border-[#2A2A2D] rounded px-2 py-0.5 text-white text-xs font-bold text-center focus:border-[#D4A04D] focus:outline-none"
                                placeholder="Qty"
                                min={0}
                                disabled={savingId === itemId}
                              />
                            </div>
                          ))}
                          <div className="flex gap-2 justify-end pt-1">
                            <button
                              onClick={cancelEdit}
                              className="bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-md transition-colors"
                              disabled={savingId === itemId}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveEdit(itemId)}
                              className="bg-[#D4A04D] hover:bg-[#C8923E] text-black text-[10px] font-black uppercase tracking-wider py-1 px-3 rounded-md transition-colors flex items-center gap-1"
                              disabled={savingId === itemId}
                            >
                              {savingId === itemId ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="space-y-1">
                            {item.colors.map(c => (
                              <div key={c.name} className="flex items-center gap-2 text-xs">
                                <span className="text-[#A7A7A7]">{c.name}:</span>
                                <span className={
                                  c.stock === 0 ? 'text-red-400 font-bold' :
                                  c.stock < LOW_STOCK ? 'text-yellow-400 font-bold' :
                                  'text-green-400'
                                }>
                                  {c.stock === 0 ? 'OUT OF STOCK' : `${c.stock} units`}
                                </span>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => startEdit(item)}
                            className="mt-2 text-[#D4A04D] hover:text-[#C8923E] transition-colors text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border-none bg-transparent cursor-pointer"
                          >
                            ✏️ Edit Stock & Colors
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-white font-semibold">{item.soldCount}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleActive(itemId)}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${item.isActive ? 'bg-[#D4A04D]' : 'bg-[#2A2A2D]'}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${item.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
