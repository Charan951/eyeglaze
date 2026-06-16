import { useState, useEffect } from 'react';
import api from '../../lib/api';

interface ColorStock {
  name: string;
  stock: number;
}

interface InventoryItem {
  _id: string;
  sku: string;
  name: string;
  soldCount: number;
  colors: ColorStock[];
  isActive: boolean;
}

const mockInventory: InventoryItem[] = [
  { _id: '1', sku: 'EG-2041', name: 'Matte Square Frame', soldCount: 412, colors: [{ name: 'Matte Black', stock: 45 }, { name: 'Black Gold', stock: 8 }], isActive: true },
  { _id: '2', sku: 'EG-1067', name: 'Premium Clubmaster Frame', soldCount: 238, colors: [{ name: 'Brown', stock: 0 }, { name: 'Black', stock: 22 }], isActive: true },
  { _id: '3', sku: 'EG-3012', name: 'Classic Aviator', soldCount: 567, colors: [{ name: 'Gold', stock: 33 }, { name: 'Silver', stock: 15 }], isActive: true },
  { _id: '4', sku: 'EG-4055', name: 'Round Metal Frame', soldCount: 89, colors: [{ name: 'Rose Gold', stock: 2 }], isActive: false },
];

const LOW_STOCK = 10;

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(mockInventory);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get('/admin/inventory')
      .then(res => {
        if (!active) return;
        const data = res.data?.items || res.data?.inventory;
        if (data?.length) setItems(data);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const toggleActive = (id: string) => {
    setItems(items.map(i => i._id === id ? { ...i, isActive: !i.isActive } : i));
  };

  if (loading) {
    return <div className="text-center text-[#888] py-10">Loading...</div>;
  }

  return (
    <div>
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

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#888] text-xs uppercase border-b border-[#2A2A2A]">
                <th className="text-left px-5 py-3">Product</th>
                <th className="text-left px-5 py-3">SKU</th>
                <th className="text-left px-5 py-3">Colors / Stock</th>
                <th className="text-left px-5 py-3">Sold</th>
                <th className="text-left px-5 py-3">Active</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id} className="border-b border-[#2A2A2A] hover:bg-[#222] transition-colors">
                  <td className="px-5 py-4 text-white">{item.name}</td>
                  <td className="px-5 py-4 text-[#C9A84C] font-mono text-xs">{item.sku}</td>
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      {item.colors.map(c => (
                        <div key={c.name} className="flex items-center gap-2 text-xs">
                          <span className="text-[#888]">{c.name}:</span>
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
                  </td>
                  <td className="px-5 py-4 text-white font-semibold">{item.soldCount}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleActive(item._id)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${item.isActive ? 'bg-[#C9A84C]' : 'bg-[#2A2A2A]'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${item.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
