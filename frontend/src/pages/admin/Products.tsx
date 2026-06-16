import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';

interface Product {
  _id: string;
  sku: string;
  name: string;
  category: string;
  price: { original: number; selling: number };
  isActive: boolean;
  isBestseller: boolean;
  frameType?: string;
  material?: string;
}

const emptyForm = {
  sku: '',
  name: '',
  category: 'prescription',
  frameType: 'Square',
  material: 'TR90 Premium',
  isActive: true,
  priceOriginal: 999,
  priceSelling: 999,
};

const CATEGORIES = [
  { value: 'prescription', label: 'Prescription Glasses' },
  { value: 'sunglasses', label: 'Sunglasses' },
  { value: 'blue_light', label: 'Blue Light Glasses' },
  { value: 'contact_lenses', label: 'Contact Lenses' },
  { value: 'kids', label: 'Kids Eyewear' },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await api.get(`/admin/products${params}`);
      setProducts(res.data.products || []);
    } catch {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setError(''); setShowModal(true); };
  const openEdit = (p: Product) => {
    setForm({
      sku: p.sku,
      name: p.name,
      category: p.category,
      frameType: p.frameType || 'Square',
      material: p.material || 'TR90 Premium',
      isActive: p.isActive,
      priceOriginal: p.price.original,
      priceSelling: p.price.selling,
    });
    setEditing(p._id);
    setError('');
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name) { setError('Product name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        sku: form.sku || undefined,
        name: form.name,
        category: form.category,
        frameType: form.frameType,
        material: form.material,
        isActive: form.isActive,
        price: { original: form.priceOriginal, selling: form.priceSelling },
      };

      if (editing) {
        await api.put(`/admin/products/${editing}`, payload);
      } else {
        await api.post('/admin/products', payload);
      }

      setShowModal(false);
      fetchProducts();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to save product';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      fetchProducts();
    } catch {
      // ignore
    }
  };

  const toggleActive = async (p: Product) => {
    try {
      await api.put(`/admin/products/${p._id}`, { isActive: !p.isActive });
      fetchProducts();
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Products</h1>
        <button onClick={openAdd} className="bg-[#C9A84C] text-black font-bold py-2 px-4 rounded-lg text-sm hover:opacity-90">
          + Add Product
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or SKU..."
          className="w-full max-w-sm bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2 text-white text-sm focus:border-[#C9A84C] focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center text-[#888] py-10">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#888] text-xs uppercase border-b border-[#2A2A2A]">
                  <th className="text-left px-5 py-3">SKU</th>
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3">Category</th>
                  <th className="text-left px-5 py-3">Price</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id} className="border-b border-[#2A2A2A] hover:bg-[#222] transition-colors">
                    <td className="px-5 py-4 text-[#C9A84C] font-mono text-xs">{p.sku}</td>
                    <td className="px-5 py-4">
                      <div className="text-white">{p.name}</div>
                      {p.isBestseller && <span className="text-xs text-[#C9A84C]">★ Bestseller</span>}
                    </td>
                    <td className="px-5 py-4 text-[#888]">{p.category}</td>
                    <td className="px-5 py-4">
                      <span className="text-white font-bold">₹{p.price.selling}</span>
                      <span className="text-[#888] text-xs ml-2 line-through">₹{p.price.original}</span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleActive(p)}
                        className={`px-2 py-1 rounded text-xs font-bold ${p.isActive ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}
                      >
                        {p.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="text-[#C9A84C] hover:underline text-xs">Edit</button>
                        <button onClick={() => deleteProduct(p._id)} className="text-red-400 hover:underline text-xs">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-[#888] py-10">No products found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#888] hover:text-white text-xl">✕</button>
            </div>

            {error && <div className="mb-4 text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="text-[#888] text-xs uppercase tracking-wide">SKU (auto-generated if blank)</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={e => setForm({ ...form, sku: e.target.value })}
                  placeholder="EG-0000"
                  className="mt-1 w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#C9A84C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[#888] text-xs uppercase tracking-wide">Product Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Matte Square Frame"
                  className="mt-1 w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#C9A84C] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#888] text-xs uppercase tracking-wide">MRP (₹)</label>
                  <input
                    type="number"
                    value={form.priceOriginal}
                    onChange={e => setForm({ ...form, priceOriginal: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#C9A84C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#888] text-xs uppercase tracking-wide">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={form.priceSelling}
                    onChange={e => setForm({ ...form, priceSelling: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#C9A84C] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#888] text-xs uppercase tracking-wide">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="mt-1 w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#C9A84C] focus:outline-none"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[#888] text-xs uppercase tracking-wide">Frame Type</label>
                <select
                  value={form.frameType}
                  onChange={e => setForm({ ...form, frameType: e.target.value })}
                  className="mt-1 w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#C9A84C] focus:outline-none"
                >
                  {['Square', 'Round', 'Clubmaster', 'Aviator', 'Wayfarer', 'Cat Eye'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  className="accent-[#C9A84C]"
                />
                <span className="text-white text-sm">Active (visible on storefront)</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-[#2A2A2A] text-white py-3 rounded-xl text-sm hover:border-[#C9A84C] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 bg-[#C9A84C] text-black font-bold py-3 rounded-xl text-sm hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
