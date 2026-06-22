import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { socket } from '../../lib/socket';

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
  brand?: string;
  shape?: string;
  frameSize?: string;
  frameColor?: string;
  weight?: string;
  faceShapes?: string[];
  isPremium?: boolean;
  description?: string;
}

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.set('search', search);
      queryParams.set('page', String(page));
      queryParams.set('limit', '10');
      const res = await api.get(`/admin/products?${queryParams.toString()}`);
      setProducts(res.data.products || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Socket.io integration to listen for real-time changes
  useEffect(() => {
    socket.on('product_changed', fetchProducts);
    return () => {
      socket.off('product_changed', fetchProducts);
    };
  }, [fetchProducts]);

  const openAdd = () => {
    navigate('/admin/products/add');
  };

  const openEdit = (p: Product) => {
    navigate(`/admin/products/edit/${p._id}`);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      fetchProducts();
    } catch {
      setError('Failed to delete product');
    }
  };

  const toggleActive = async (p: Product) => {
    try {
      await api.put(`/admin/products/${p._id}`, { isActive: !p.isActive });
      fetchProducts();
    } catch {
      setError('Failed to toggle product status');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-bold">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white uppercase tracking-wide">Products</h1>
        <button onClick={openAdd} className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md">
          + Add Product
        </button>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products by name or SKU..."
          className="w-full max-w-sm bg-[#131314] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="text-center text-[#A7A7A7] py-16 animate-pulse">Loading products...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#A7A7A7] text-[10px] font-extrabold uppercase tracking-wider border-b border-[#2A2A2D] bg-[#1A1A1C]">
                  <th className="text-left px-5 py-3">SKU</th>
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3">Category</th>
                  <th className="text-left px-5 py-3">Price</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2D]/40">
                {products.map(p => (
                  <tr key={p._id} className="hover:bg-[#1C1C1E] transition-colors">
                    <td className="px-5 py-4 text-[#D4A04D] font-mono text-xs font-bold">{p.sku}</td>
                    <td className="px-5 py-4">
                      <div className="text-white font-semibold">{p.name}</div>
                      <div className="flex gap-2 mt-1">
                        {p.isBestseller && <span className="text-[9px] bg-[#D4A04D]/10 text-[#D4A04D] border border-[#D4A04D]/20 px-1.5 py-0.5 rounded font-extrabold uppercase">★ Bestseller</span>}
                        {p.frameType && <span className="text-[9px] bg-[#222] text-gray-400 px-1.5 py-0.5 rounded border border-[#2A2A2D]">{p.frameType}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[#A7A7A7] font-semibold uppercase text-xs">{p.category.replace('_', ' ')}</td>
                    <td className="px-5 py-4">
                      <span className="text-white font-black">₹{p.price.selling}</span>
                      <span className="text-[#A7A7A7] text-xs ml-2 line-through font-medium">₹{p.price.original}</span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleActive(p)}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase border ${p.isActive ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
                      >
                        {p.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-3 font-bold text-xs">
                        <button onClick={() => openEdit(p)} className="text-[#D4A04D] hover:underline bg-transparent border-none cursor-pointer">Edit</button>
                        <button onClick={() => deleteProduct(p._id)} className="text-red-400 hover:underline bg-transparent border-none cursor-pointer">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-[#A7A7A7] py-16 italic">No products found</td>
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
            Showing page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{totalPages}</span> ({total} total products)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3.5 py-2 rounded-lg bg-[#1C1C1E] border border-[#2A2A2D] text-white text-xs font-bold hover:bg-[#2A2A2D] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${page === pageNum ? 'bg-[#D4A04D] text-black' : 'bg-[#1C1C1E] border border-[#2A2A2D] text-white hover:bg-[#2A2A2D]'}`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3.5 py-2 rounded-lg bg-[#1C1C1E] border border-[#2A2A2D] text-white text-xs font-bold hover:bg-[#2A2A2D] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
