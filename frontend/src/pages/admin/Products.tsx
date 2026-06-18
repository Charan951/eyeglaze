import { useState, useEffect, useCallback } from 'react';
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
  frame?: {
    type?: string;
    material?: string;
    width?: number;
    lensWidth?: number;
    bridgeWidth?: number;
    templeLength?: number;
    featureTags?: string[];
  };
  compatible?: {
    prescription?: boolean;
    bluecut?: boolean;
    zeropower?: boolean;
    progressive?: boolean;
  };
  colors?: Array<{
    name: string;
    hex: string;
    stock: number;
    images: string[];
  }>;
  images?: string[];
}

interface ColorInput {
  name: string;
  hex: string;
  stock: string;
  images: string[];
}

const emptyForm = {
  sku: '',
  name: '',
  description: '',
  category: 'prescription',
  brand: 'Vincent Chase',
  shape: 'Rectangle',
  frameSize: 'Medium',
  frameColor: 'Black',
  frameType: 'Full Rim',
  material: 'TR90 Premium',
  weight: 'Lightweight',
  faceShapes: [] as string[],
  isPremium: false,
  isActive: true,
  isBestseller: false,
  priceOriginal: 999,
  priceSelling: 999,
  frameWidth: '',
  lensWidth: '',
  bridgeWidth: '',
  templeLength: '',
  featureTags: '',
  compPrescription: false,
  compBluecut: false,
  compZeropower: false,
  compProgressive: false,
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
  const [colorsList, setColorsList] = useState<ColorInput[]>([]);
  const [generalImages, setGeneralImages] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingState, setUploadingState] = useState<string>(''); // displays progress messages
  const [activeTab, setActiveTab] = useState<'basic' | 'specs' | 'colors'>('basic');

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

  // Socket.io integration to listen for real-time changes
  useEffect(() => {
    socket.on('product_changed', fetchProducts);
    return () => {
      socket.off('product_changed', fetchProducts);
    };
  }, [fetchProducts]);

  const openAdd = () => {
    setForm(emptyForm);
    setColorsList([]);
    setGeneralImages([]);
    setEditing(null);
    setError('');
    setActiveTab('basic');
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setForm({
      sku: p.sku || '',
      name: p.name || '',
      description: p.description || '',
      category: p.category || 'prescription',
      brand: p.brand || 'Vincent Chase',
      shape: p.shape || p.frame?.type || 'Rectangle',
      frameSize: p.frameSize || 'Medium',
      frameColor: p.frameColor || 'Black',
      frameType: p.frameType || 'Full Rim',
      material: p.material || p.frame?.material || 'TR90 Premium',
      weight: p.weight || 'Lightweight',
      faceShapes: p.faceShapes || [],
      isPremium: p.isPremium ?? false,
      priceOriginal: p.price?.original ?? 999,
      priceSelling: p.price?.selling ?? 999,
      frameWidth: p.frame?.width ? String(p.frame.width) : '',
      lensWidth: p.frame?.lensWidth ? String(p.frame.lensWidth) : '',
      bridgeWidth: p.frame?.bridgeWidth ? String(p.frame.bridgeWidth) : '',
      templeLength: p.frame?.templeLength ? String(p.frame.templeLength) : '',
      featureTags: p.frame?.featureTags ? p.frame.featureTags.join(', ') : '',
      compPrescription: p.compatible?.prescription ?? false,
      compBluecut: p.compatible?.bluecut ?? false,
      compZeropower: p.compatible?.zeropower ?? false,
      compProgressive: p.compatible?.progressive ?? false,
      isBestseller: p.isBestseller ?? false,
      isActive: p.isActive ?? true,
    });

    setColorsList(p.colors ? p.colors.map((c: any) => ({
      name: c.name || '',
      hex: c.hex || '',
      stock: String(c.stock || 0),
      images: c.images || [],
    })) : []);

    setGeneralImages(p.images || []);
    setEditing(p._id);
    setError('');
    setActiveTab('basic');
    setShowModal(true);
  };

  // HTML5 Canvas client-side compression
  const compressAndUploadImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            async (blob) => {
              if (!blob) {
                reject(new Error('Canvas compression failed'));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });

              const formData = new FormData();
              formData.append('image', compressedFile);

              try {
                const res = await api.post('/admin/upload', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' },
                });
                resolve(res.data.url);
              } catch (err) {
                reject(err);
              }
            },
            'image/jpeg',
            0.8
          );
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleColorImageUpload = async (colorIdx: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingState('Compressing and uploading color images...');
    setError('');
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await compressAndUploadImage(files[i]);
        urls.push(url);
      }
      setColorsList(prev => prev.map((c, idx) => {
        if (idx === colorIdx) {
          return { ...c, images: [...c.images, ...urls] };
        }
        return c;
      }));
    } catch (err) {
      console.error('File upload failed:', err);
      setError('Failed to upload one or more color images');
    } finally {
      setUploadingState('');
    }
  };

  const handleGeneralImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingState('Compressing and uploading general images...');
    setError('');
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await compressAndUploadImage(files[i]);
        urls.push(url);
      }
      setGeneralImages(prev => [...prev, ...urls]);
    } catch (err) {
      console.error('General file upload failed:', err);
      setError('Failed to upload one or more general images');
    } finally {
      setUploadingState('');
    }
  };

  const addColorItem = () => {
    setColorsList([...colorsList, { name: '', hex: '#000000', stock: '0', images: [] }]);
  };

  const removeColorItem = (index: number) => {
    setColorsList(colorsList.filter((_, idx) => idx !== index));
  };

  const updateColorItemField = (index: number, field: keyof ColorInput, value: string) => {
    setColorsList(prev => prev.map((c, idx) => idx === index ? { ...c, [field]: value } : c));
  };

  const removeColorImage = (colorIdx: number, imgIdx: number) => {
    setColorsList(prev => prev.map((c, idx) => {
      if (idx === colorIdx) {
        return { ...c, images: c.images.filter((_, i) => i !== imgIdx) };
      }
      return c;
    }));
  };

  const removeGeneralImage = (imgIdx: number) => {
    setGeneralImages(prev => prev.filter((_, i) => i !== imgIdx));
  };

  const save = async () => {
    // Robust Validations
    if (!form.name || form.name.trim().length < 3) {
      setError('Product name is required (min 3 characters)');
      setActiveTab('basic');
      return;
    }
    if (form.priceSelling <= 0) {
      setError('Selling Price must be a positive number');
      setActiveTab('basic');
      return;
    }
    if (form.priceOriginal < form.priceSelling) {
      setError('MRP must be greater than or equal to Selling Price');
      setActiveTab('basic');
      return;
    }
    if (form.sku && !/^[A-Za-z0-9-_]+$/.test(form.sku)) {
      setError('SKU can only contain alphanumeric characters, dashes, and underscores');
      setActiveTab('basic');
      return;
    }

    // Validate Dimensions
    const checkDim = (val: string, name: string) => {
      if (val && (isNaN(parseInt(val)) || parseInt(val) <= 0)) {
        return `${name} must be a positive integer`;
      }
      return null;
    };
    const dimError = 
      checkDim(form.frameWidth, 'Frame Width') ||
      checkDim(form.lensWidth, 'Lens Width') ||
      checkDim(form.bridgeWidth, 'Bridge Width') ||
      checkDim(form.templeLength, 'Temple Length');
    
    if (dimError) {
      setError(dimError);
      setActiveTab('specs');
      return;
    }

    // Validate Colors
    for (let i = 0; i < colorsList.length; i++) {
      const c = colorsList[i];
      if (!c.name.trim()) {
        setError(`Color #${i + 1} must have a name`);
        setActiveTab('colors');
        return;
      }
      if (!/^#[0-9A-Fa-f]{6}$/.test(c.hex)) {
        setError(`Color #${i + 1} must have a valid Hex color code (e.g. #00FF00)`);
        setActiveTab('colors');
        return;
      }
      if (isNaN(parseInt(c.stock)) || parseInt(c.stock) < 0) {
        setError(`Color #${i + 1} must have a non-negative stock count`);
        setActiveTab('colors');
        return;
      }
      if (c.images.length === 0) {
        setError(`Color #${i + 1} (${c.name}) must have at least one image uploaded`);
        setActiveTab('colors');
        return;
      }
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        sku: form.sku.trim() || undefined,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        category: form.category,
        brand: form.brand,
        shape: form.shape,
        frameSize: form.frameSize,
        frameColor: form.frameColor,
        frameType: form.frameType,
        material: form.material,
        weight: form.weight,
        faceShapes: form.faceShapes,
        isPremium: form.isPremium,
        frame: {
          type: form.shape,
          material: form.material,
          width: form.frameWidth ? parseInt(form.frameWidth) : undefined,
          lensWidth: form.lensWidth ? parseInt(form.lensWidth) : undefined,
          bridgeWidth: form.bridgeWidth ? parseInt(form.bridgeWidth) : undefined,
          templeLength: form.templeLength ? parseInt(form.templeLength) : undefined,
          featureTags: form.featureTags ? form.featureTags.split(',').map(s => s.trim()).filter(Boolean) : [],
        },
        price: { original: form.priceOriginal, selling: form.priceSelling },
        compatible: {
          prescription: form.compPrescription,
          bluecut: form.compBluecut,
          zeropower: form.compZeropower,
          progressive: form.compProgressive,
        },
        colors: colorsList.map(c => ({
          name: c.name.trim(),
          hex: c.hex,
          stock: parseInt(c.stock) || 0,
          images: c.images,
        })),
        images: generalImages,
        isBestseller: form.isBestseller,
        isActive: form.isActive,
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
    <div className="space-y-6">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#2A2A2D] flex items-center justify-between bg-[#151515] sticky top-0 z-20">
              <h2 className="text-white font-extrabold text-lg uppercase tracking-wide">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-xl bg-transparent border-none cursor-pointer">✕</button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-5">
              
              {/* Error messages */}
              {error && <div className="text-red-400 text-xs font-bold bg-red-400/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}
              {uploadingState && <div className="text-[#D4A04D] text-xs font-bold bg-[#D4A04D]/10 border border-[#D4A04D]/20 rounded-xl px-4 py-3 animate-pulse">{uploadingState}</div>}

              {/* Tab Navigation */}
              <div className="flex border-b border-[#2A2A2D] mb-4 text-[10px] font-extrabold uppercase tracking-widest gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className={`flex-1 pb-2.5 border-b-2 text-center transition-colors cursor-pointer bg-transparent border-none ${activeTab === 'basic' ? 'border-[#D4A04D] text-[#D4A04D]' : 'border-transparent text-gray-500 hover:text-white'}`}
                >
                  1. Basic Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('specs')}
                  className={`flex-1 pb-2.5 border-b-2 text-center transition-colors cursor-pointer bg-transparent border-none ${activeTab === 'specs' ? 'border-[#D4A04D] text-[#D4A04D]' : 'border-transparent text-gray-500 hover:text-white'}`}
                >
                  2. Specifications
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('colors')}
                  className={`flex-1 pb-2.5 border-b-2 text-center transition-colors cursor-pointer bg-transparent border-none ${activeTab === 'colors' ? 'border-[#D4A04D] text-[#D4A04D]' : 'border-transparent text-gray-500 hover:text-white'}`}
                >
                  3. Colors & Media
                </button>
              </div>

              {/* TAB 1: BASIC INFO */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1">SKU</label>
                      <input
                        type="text"
                        value={form.sku}
                        onChange={e => setForm({ ...form, sku: e.target.value })}
                        placeholder="EG-0000"
                        className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1">Category</label>
                      <select
                        value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                        className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none cursor-pointer"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1">Brand</label>
                      <select
                        value={form.brand}
                        onChange={e => setForm({ ...form, brand: e.target.value })}
                        className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none cursor-pointer"
                      >
                        {['Vincent Chase', 'John Jacobs', 'Hustlr', 'Lenskart Air'].map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. EG-6003 | Progressive Ready Wide Frame"
                      className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Enter detailed description of style, fit, features..."
                      rows={3}
                      className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1">MRP (Original Price ₹) *</label>
                      <input
                        type="number"
                        value={form.priceOriginal}
                        onChange={e => setForm({ ...form, priceOriginal: parseInt(e.target.value) || 0 })}
                        className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1">Selling Price (₹) *</label>
                      <input
                        type="number"
                        value={form.priceSelling}
                        onChange={e => setForm({ ...form, priceSelling: parseInt(e.target.value) || 0 })}
                        className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 select-none">
                    <label className="flex items-center gap-2 cursor-pointer text-white text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={form.isBestseller}
                        onChange={e => setForm({ ...form, isBestseller: e.target.checked })}
                        className="accent-[#D4A04D] w-4 h-4 cursor-pointer"
                      />
                      <span>Bestseller</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-white text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={e => setForm({ ...form, isActive: e.target.checked })}
                        className="accent-[#D4A04D] w-4 h-4 cursor-pointer"
                      />
                      <span>Active</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-white text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={form.isPremium}
                        onChange={e => setForm({ ...form, isPremium: e.target.checked })}
                        className="accent-[#D4A04D] w-4 h-4 cursor-pointer"
                      />
                      <span>Premium</span>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: SPECIFICATIONS */}
              {activeTab === 'specs' && (
                <div className="space-y-5">
                  <div className="bg-[#18181A] border border-[#2A2A2D]/40 p-4 rounded-xl space-y-4">
                    <h3 className="text-white text-xs font-extrabold uppercase tracking-wide text-[#D4A04D]">Frame Dimensions</h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1">Shape & Style</label>
                        <select
                          value={form.shape}
                          onChange={e => setForm({ ...form, shape: e.target.value })}
                          className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none cursor-pointer"
                        >
                          {['Aviator', 'Rectangle', 'Round', 'Oval', 'Cat Eye', 'Geometric', 'Clubmaster'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1">Frame Size</label>
                        <select
                          value={form.frameSize}
                          onChange={e => setForm({ ...form, frameSize: e.target.value })}
                          className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none cursor-pointer"
                        >
                          {['Small', 'Medium', 'Large'].map(sz => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1">Frame Type</label>
                        <select
                          value={form.frameType}
                          onChange={e => setForm({ ...form, frameType: e.target.value })}
                          className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none cursor-pointer"
                        >
                          {['Full Rim', 'Half Rim', 'Rimless'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1">Frame Color</label>
                        <select
                          value={form.frameColor}
                          onChange={e => setForm({ ...form, frameColor: e.target.value })}
                          className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none cursor-pointer"
                        >
                          {['Black', 'Brown', 'Gold', 'Silver', 'Transparent', 'Pink'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1">Material</label>
                        <select
                          value={form.material}
                          onChange={e => setForm({ ...form, material: e.target.value })}
                          className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none cursor-pointer"
                        >
                          {['Metal', 'Acetate', 'TR90', 'Titanium'].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1">Frame Weight</label>
                        <select
                          value={form.weight}
                          onChange={e => setForm({ ...form, weight: e.target.value })}
                          className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none cursor-pointer"
                        >
                          {['Lightweight', 'Medium', 'Heavy'].map(w => (
                            <option key={w} value={w}>{w}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-2">Suitable Face Shapes</label>
                      <div className="flex gap-6 pt-1 select-none">
                        {['Round', 'Oval', 'Square', 'Diamond'].map(shape => {
                          const list = form.faceShapes || [];
                          const isChecked = list.includes(shape);
                          return (
                            <label key={shape} className="flex items-center gap-2 cursor-pointer text-white text-xs font-semibold">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  const newList = e.target.checked
                                    ? [...list, shape]
                                    : list.filter(s => s !== shape);
                                  setForm({ ...form, faceShapes: newList });
                                }}
                                className="accent-[#D4A04D] w-4 h-4 cursor-pointer"
                              />
                              <span>{shape}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="text-[#A7A7A7] text-[8px] font-bold uppercase tracking-wider block mb-1">Total Width (mm)</label>
                        <input
                          type="number"
                          value={form.frameWidth}
                          onChange={e => setForm({ ...form, frameWidth: e.target.value })}
                          placeholder="140"
                          className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[#A7A7A7] text-[8px] font-bold uppercase tracking-wider block mb-1">Lens Width (mm)</label>
                        <input
                          type="number"
                          value={form.lensWidth}
                          onChange={e => setForm({ ...form, lensWidth: e.target.value })}
                          placeholder="54"
                          className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[#A7A7A7] text-[8px] font-bold uppercase tracking-wider block mb-1">Bridge (mm)</label>
                        <input
                          type="number"
                          value={form.bridgeWidth}
                          onChange={e => setForm({ ...form, bridgeWidth: e.target.value })}
                          placeholder="18"
                          className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[#A7A7A7] text-[8px] font-bold uppercase tracking-wider block mb-1">Temple (mm)</label>
                        <input
                          type="number"
                          value={form.templeLength}
                          onChange={e => setForm({ ...form, templeLength: e.target.value })}
                          placeholder="145"
                          className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1">Feature Tags (comma separated)</label>
                      <input
                        type="text"
                        value={form.featureTags}
                        onChange={e => setForm({ ...form, featureTags: e.target.value })}
                        placeholder="Lightweight, Flexible, Skin Friendly, Durable"
                        className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="bg-[#18181A] border border-[#2A2A2D]/40 p-4 rounded-xl space-y-3">
                    <h3 className="text-white text-xs font-extrabold uppercase tracking-wide text-[#D4A04D]">Lens Compatibility</h3>
                    
                    <div className="grid grid-cols-2 gap-4 pt-1 select-none">
                      <label className="flex items-center gap-2 cursor-pointer text-white text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={form.compPrescription}
                          onChange={e => setForm({ ...form, compPrescription: e.target.checked })}
                          className="accent-[#D4A04D] w-4 h-4 cursor-pointer"
                        />
                        <span>Prescription Lenses Compatible</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-white text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={form.compBluecut}
                          onChange={e => setForm({ ...form, compBluecut: e.target.checked })}
                          className="accent-[#D4A04D] w-4 h-4 cursor-pointer"
                        />
                        <span>Blue Cut Lenses Compatible</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-white text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={form.compZeropower}
                          onChange={e => setForm({ ...form, compZeropower: e.target.checked })}
                          className="accent-[#D4A04D] w-4 h-4 cursor-pointer"
                        />
                        <span>Zero Power Lenses Compatible</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-white text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={form.compProgressive}
                          onChange={e => setForm({ ...form, compProgressive: e.target.checked })}
                          className="accent-[#D4A04D] w-4 h-4 cursor-pointer"
                        />
                        <span>Progressive Lenses Compatible</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: COLORS & MEDIA */}
              {activeTab === 'colors' && (
                <div className="space-y-6">
                  
                  {/* General Product Images */}
                  <div className="bg-[#18181A] border border-[#2A2A2D]/40 p-4 rounded-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-white text-xs font-extrabold uppercase tracking-wide text-[#D4A04D]">General Images</h3>
                      <label className="bg-[#2A2A2D] hover:bg-[#3E3E42] text-white font-extrabold text-[10px] uppercase py-1.5 px-3 rounded-lg cursor-pointer transition-colors shadow">
                        Upload Files
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={e => handleGeneralImageUpload(e.target.files)}
                        />
                      </label>
                    </div>

                    {generalImages.length === 0 ? (
                      <div className="text-center py-6 text-xs text-gray-500 italic border border-dashed border-[#2A2A2D] rounded-lg">No general images uploaded yet.</div>
                    ) : (
                      <div className="grid grid-cols-4 gap-3">
                        {generalImages.map((img, idx) => (
                          <div key={idx} className="relative group aspect-square border border-[#2A2A2D] rounded-xl overflow-hidden bg-[#222]">
                            <img src={img} alt="preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeGeneralImage(idx)}
                              className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Colors List */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-white text-sm font-bold uppercase tracking-wide">Product Colors</h3>
                      <button
                        type="button"
                        onClick={addColorItem}
                        className="border border-[#D4A04D] text-[#D4A04D] hover:bg-[#D4A04D] hover:text-black font-extrabold text-[10px] uppercase py-1.5 px-3.5 rounded-lg tracking-wider transition-colors bg-transparent cursor-pointer"
                      >
                        + Add Color
                      </button>
                    </div>

                    {colorsList.length === 0 ? (
                      <div className="text-center py-10 text-xs text-gray-500 italic border border-dashed border-[#2A2A2D] rounded-2xl">
                        No product colors added. Standard storefront images will be used.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {colorsList.map((color, colorIdx) => (
                          <div key={colorIdx} className="bg-[#18181A] border border-[#2A2A2D]/60 p-4 rounded-xl space-y-4 relative">
                            
                            {/* Delete color item */}
                            <button
                              type="button"
                              onClick={() => removeColorItem(colorIdx)}
                              className="absolute top-3 right-3 text-red-500 hover:text-red-400 font-bold text-xs bg-transparent border-none cursor-pointer"
                            >
                              Remove Color
                            </button>

                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="text-[#A7A7A7] text-[9px] font-bold uppercase tracking-wider block mb-1">Color Name *</label>
                                <input
                                  type="text"
                                  required
                                  value={color.name}
                                  onChange={e => updateColorItemField(colorIdx, 'name', e.target.value)}
                                  placeholder="e.g. Matte Black"
                                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-1.5 text-white text-xs focus:border-[#D4A04D] focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[#A7A7A7] text-[9px] font-bold uppercase tracking-wider block mb-1">Hex Code *</label>
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="color"
                                    value={color.hex}
                                    onChange={e => updateColorItemField(colorIdx, 'hex', e.target.value)}
                                    className="w-7 h-7 rounded bg-transparent border-none cursor-pointer shrink-0"
                                  />
                                  <input
                                    type="text"
                                    required
                                    value={color.hex.toUpperCase()}
                                    onChange={e => updateColorItemField(colorIdx, 'hex', e.target.value)}
                                    placeholder="#000000"
                                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-1.5 text-white text-xs focus:border-[#D4A04D] focus:outline-none uppercase"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-[#A7A7A7] text-[9px] font-bold uppercase tracking-wider block mb-1">Stock *</label>
                                <input
                                  type="number"
                                  required
                                  value={color.stock}
                                  onChange={e => updateColorItemField(colorIdx, 'stock', e.target.value)}
                                  placeholder="50"
                                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-1.5 text-white text-xs focus:border-[#D4A04D] focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Color Images Upload */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[#A7A7A7] text-[9px] font-bold uppercase tracking-wider block">Images for this Color * (min 1 required)</label>
                                <label className="bg-[#2A2A2D] hover:bg-[#3E3E42] text-white font-extrabold text-[8px] uppercase py-1 px-2.5 rounded-md cursor-pointer transition-colors shadow">
                                  Upload Files
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => handleColorImageUpload(colorIdx, e.target.files)}
                                  />
                                </label>
                              </div>

                              {color.images.length === 0 ? (
                                <div className="text-center py-4 text-[10px] text-gray-500 italic border border-dashed border-[#2A2A2D] rounded-lg">No images uploaded for this color.</div>
                              ) : (
                                <div className="grid grid-cols-5 gap-2">
                                  {color.images.map((img, imgIdx) => (
                                    <div key={imgIdx} className="relative group aspect-square border border-[#2A2A2D] rounded-lg overflow-hidden bg-[#222]">
                                      <img src={img} alt="preview" className="w-full h-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={() => removeColorImage(colorIdx, imgIdx)}
                                        className="absolute top-1.5 right-1.5 bg-red-600 text-white w-4.5 h-4.5 rounded-full flex items-center justify-center text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-[#2A2A2D] bg-[#151515] flex gap-3 sticky bottom-0 z-20">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 border border-[#2A2A2D] text-white py-3 rounded-xl text-xs font-bold uppercase hover:border-[#D4A04D] transition-colors bg-transparent cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="flex-1 bg-[#D4A04D] text-black font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
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
