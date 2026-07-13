import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { socket } from '../../lib/socket';

interface Banner {
  _id: string;
  title?: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  position: string;
  displayOrder: number;
  isActive: boolean;
  showOnMobile: boolean;
  description?: string;
  buttonText?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [position, setPosition] = useState('eyeglasses_landing');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [showOnMobile, setShowOnMobile] = useState(true);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Upload States
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    setUploadProgress('Uploading image...');
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/admin/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setImageUrl(res.data.url);
      setSuccess('Banner image uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
      setUploadProgress('');
    }
  };

  useEffect(() => {
    fetchBanners();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/banners');
      setBanners(res.data);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch banners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    socket.on('banner_changed', fetchBanners);
    return () => {
      socket.off('banner_changed', fetchBanners);
    };
  }, []);

  const resetForm = () => {
    setTitle('');
    setSubtitle('');
    setDescription('');
    setButtonText('');
    setImageUrl('');
    setLinkUrl('');
    setPosition('eyeglasses_landing');
    setDisplayOrder(0);
    setIsActive(true);
    setShowOnMobile(true);
    setIsEditing(false);
    setEditingId(null);
    setUploadProgress('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!imageUrl.trim()) {
      setError('Banner Image is required.');
      return;
    }

    const payload = {
      title: title.trim() || undefined,
      subtitle: subtitle.trim() || undefined,
      description: description.trim() || undefined,
      buttonText: buttonText.trim() || undefined,
      imageUrl: imageUrl.trim(),
      linkUrl: linkUrl.trim() || undefined,
      position: position.trim() || 'eyeglasses_landing',
      displayOrder,
      isActive,
      showOnMobile,
    };

    try {
      if (isEditing && editingId) {
        await api.put(`/admin/banners/${editingId}`, payload);
        setSuccess('Banner updated successfully!');
      } else {
        await api.post('/admin/banners', payload);
        setSuccess('Banner created successfully!');
      }
      resetForm();
      fetchBanners();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save banner.');
    }
  };

  const handleEdit = (banner: Banner) => {
    setIsEditing(true);
    setEditingId(banner._id);
    setTitle(banner.title || '');
    setSubtitle(banner.subtitle || '');
    setDescription(banner.description || '');
    setButtonText(banner.buttonText || '');
    setImageUrl(banner.imageUrl);
    setLinkUrl(banner.linkUrl || '');
    setPosition(banner.position || 'eyeglasses_landing');
    setDisplayOrder(banner.displayOrder);
    setIsActive(banner.isActive);
    setShowOnMobile(banner.showOnMobile !== undefined ? banner.showOnMobile : true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/admin/banners/${id}`);
      setSuccess('Banner deleted successfully!');
      fetchBanners();
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete banner.');
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await api.put(`/admin/banners/${banner._id}`, {
        isActive: !banner.isActive,
      });
      fetchBanners();
    } catch (err) {
      console.error(err);
      setError('Failed to toggle status.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 text-white">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-serif font-semibold text-[#D4A04D]">Homepage Banners Manager</h1>
        <p className="text-xs text-[#A7A7A7]">Manage promotional or marketing banners rendered above eyeglasses on the landing page.</p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs px-4 py-3 rounded-lg flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="bg-transparent border-none text-red-400 hover:text-red-200 font-bold cursor-pointer">✕</button>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs px-4 py-3 rounded-lg flex items-center justify-between animate-fade-in">
          <span>✨ {success}</span>
          <button onClick={() => setSuccess('')} className="bg-transparent border-none text-emerald-400 hover:text-emerald-200 font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Creator Form */}
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#2A2A2D] pb-3">
            {isEditing ? '✏️ Edit Banner' : '➕ Add Landing Banner'}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Title */}
            <div className="flex flex-col gap-1">
              <label className="text-[#A7A7A7] text-xs font-semibold uppercase tracking-wider">
                Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Summer Eyewear Fest"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-[#181818] border border-[#2A2A2D] focus:border-[#D4A04D] text-xs text-white rounded-lg p-2.5 focus:outline-none"
              />
            </div>

            {/* Subtitle */}
            <div className="flex flex-col gap-1">
              <label className="text-[#A7A7A7] text-xs font-semibold uppercase tracking-wider">
                Subtitle (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Flat 20% Off on all Prescription Glasses"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="bg-[#181818] border border-[#2A2A2D] focus:border-[#D4A04D] text-xs text-white rounded-lg p-2.5 focus:outline-none"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="text-[#A7A7A7] text-xs font-semibold uppercase tracking-wider">
                Description / Content (Optional / For Hero)
              </label>
              <textarea
                placeholder="e.g., Uncompromising quality meets timeless luxury."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-[#181818] border border-[#2A2A2D] focus:border-[#D4A04D] text-xs text-white rounded-lg p-2.5 focus:outline-none min-h-[60px]"
              />
            </div>

            {/* Button Text */}
            <div className="flex flex-col gap-1">
              <label className="text-[#A7A7A7] text-xs font-semibold uppercase tracking-wider">
                Button Text (Optional / For Hero)
              </label>
              <input
                type="text"
                placeholder="e.g., EXPLORE ALL"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                className="bg-[#181818] border border-[#2A2A2D] focus:border-[#D4A04D] text-xs text-white rounded-lg p-2.5 focus:outline-none"
              />
            </div>

            {/* Image Link or Upload */}
            <div className="flex flex-col gap-1">
              <label className="text-[#A7A7A7] text-xs font-semibold uppercase tracking-wider">
                Banner Image URL *
              </label>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="bg-[#181818] border border-[#2A2A2D] focus:border-[#D4A04D] text-xs text-white rounded-lg p-2.5 focus:outline-none"
                  required
                />
                
                <div className="text-[#A7A7A7] text-[10px] text-center uppercase tracking-widest font-semibold py-0.5">
                  — Or Upload Local File —
                </div>

                <label className="border-2 border-dashed border-[#2A2A2D] hover:border-[#D4A04D]/40 bg-[#181818] rounded-lg p-5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors relative">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-5 h-5 border-2 border-t-[#D4A04D] border-[#2A2A2D] rounded-full animate-spin" />
                      <span className="text-[10px] text-[#D4A04D] font-bold">{uploadProgress}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-center">
                      <span className="text-xl">🖼️</span>
                      <span className="text-[10px] text-white font-bold">Select Banner Image</span>
                      <span className="text-[9px] text-gray-500">JPG, PNG, WebP</span>
                    </div>
                  )}
                </label>

                {imageUrl && (
                  <div className="relative rounded-lg overflow-hidden border border-[#2A2A2D] aspect-[3/1] bg-black">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Click Link URL */}
            <div className="flex flex-col gap-1">
              <label className="text-[#A7A7A7] text-xs font-semibold uppercase tracking-wider">
                Click Link URL (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., /products?category=eyeglasses"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="bg-[#181818] border border-[#2A2A2D] focus:border-[#D4A04D] text-xs text-white rounded-lg p-2.5 focus:outline-none"
              />
              <span className="text-[9px] text-gray-500">Leaving this blank makes the banner non-clickable.</span>
            </div>

            {/* Position */}
            <div className="flex flex-col gap-1">
              <label className="text-[#A7A7A7] text-xs font-semibold uppercase tracking-wider">
                Banner Position *
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="bg-[#181818] border border-[#2A2A2D] focus:border-[#D4A04D] text-xs text-white rounded-lg p-2.5 focus:outline-none cursor-pointer"
                required
              >
                <option value="hero">Hero Slider (Top of Page)</option>
                <option value="eyeglasses_landing">Top Banner (Above Eyeglasses)</option>
                <option value="footer">Footer Banner (Above Footer)</option>
                <option value="both">Both Placements</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={`after_category:${cat.slug}`}>
                    After {cat.name} Category
                  </option>
                ))}
              </select>
            </div>

            {/* Order & Status */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[#A7A7A7] text-xs font-semibold uppercase tracking-wider">
                  Display Order
                </label>
                <input
                  type="number"
                  min={0}
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                  className="bg-[#181818] border border-[#2A2A2D] focus:border-[#D4A04D] text-xs text-white rounded-lg p-2.5 focus:outline-none w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2.5 text-[#A7A7A7] text-xs font-semibold uppercase tracking-wider cursor-pointer py-2.5 select-none">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-[#2A2A2D] text-[#D4A04D] focus:ring-0 focus:ring-offset-0 bg-[#181818]"
                  />
                  <span>Is Active</span>
                </label>

                <label className="flex items-center gap-2.5 text-[#A7A7A7] text-xs font-semibold uppercase tracking-wider cursor-pointer py-2.5 select-none">
                  <input
                    type="checkbox"
                    checked={showOnMobile}
                    onChange={(e) => setShowOnMobile(e.target.checked)}
                    className="rounded border-[#2A2A2D] text-[#D4A04D] focus:ring-0 focus:ring-offset-0 bg-[#181818]"
                  />
                  <span>Visible on Mobile</span>
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-2.5 mt-2">
              <button
                type="submit"
                className="flex-1 bg-[#D4A04D] hover:bg-[#C8923E] text-black font-bold text-xs uppercase py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                {isEditing ? 'Save Changes' : 'Create Banner'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 border border-[#2A2A2D] text-white font-semibold text-xs uppercase rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Banners List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl px-5 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Active Banners List</h2>
            <span className="text-[10px] bg-white/5 text-gray-400 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {banners.length} {banners.length === 1 ? 'Banner' : 'Banners'}
            </span>
          </div>

          {loading ? (
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-8 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-t-[#D4A04D] border-[#2A2A2D] rounded-full animate-spin" />
              <span className="text-xs text-gray-500">Loading banners...</span>
            </div>
          ) : banners.length === 0 ? (
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <span className="text-3xl">🖼️</span>
              <h3 className="text-white font-bold text-sm">No Banners Found</h3>
              <p className="text-gray-500 text-xs max-w-xs mx-auto leading-relaxed">
                Create new promotional banners using the left-hand form. They will render above eyeglasses on the landing page.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {banners.map((banner) => (
                <div
                  key={banner._id}
                  className={`bg-[#131314] border rounded-xl overflow-hidden flex flex-col md:flex-row transition-all duration-300 ${
                    banner.isActive ? 'border-[#2A2A2D] hover:border-[#D4A04D]/40' : 'border-[#2A2A2D] opacity-60'
                  }`}
                >
                  {/* Aspect Image */}
                  <div className="w-full md:w-60 bg-black aspect-[3/1.2] md:aspect-[3/1.5] relative border-b md:border-b-0 md:border-r border-[#2A2A2D] shrink-0">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || 'Banner'}
                      className="w-full h-full object-cover"
                    />
                    {!banner.isActive && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-[10px] font-bold tracking-widest uppercase bg-red-600/90 text-white px-2 py-0.5 rounded">
                          Inactive
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info Box */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-[#D4A04D] font-mono font-bold">Order: {banner.displayOrder}</span>
                        <span className="text-[10px] bg-zinc-800 text-gray-300 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                          {banner.position === 'eyeglasses_landing'
                            ? 'Top'
                            : banner.position === 'footer'
                            ? 'Footer'
                            : banner.position === 'both'
                            ? 'Both'
                            : banner.position === 'hero'
                            ? 'Hero'
                            : banner.position.startsWith('after_category:')
                            ? `After ${banner.position.replace('after_category:', '').toUpperCase()}`
                            : banner.position}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          banner.showOnMobile === false 
                            ? 'bg-amber-500/10 text-amber-400' 
                            : 'bg-indigo-500/10 text-indigo-400'
                        }`}>
                          {banner.showOnMobile === false ? '💻 Desktop Only' : '📱 Mobile & Desktop'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{banner.title || 'Untitled Banner'}</h3>
                      {banner.subtitle && <p className="text-xs text-gray-400">{banner.subtitle}</p>}
                      {banner.description && <p className="text-xs text-gray-500 italic mt-0.5">{banner.description}</p>}
                      {banner.buttonText && (
                        <div className="text-[10px] text-gray-400 mt-1">
                          🔘 Button: <span className="text-white font-medium">{banner.buttonText}</span>
                        </div>
                      )}
                      {banner.linkUrl && (
                        <div className="text-[10px] text-gray-500 font-mono mt-1 truncate">
                          🔗 Link: <span className="text-[#D4A04D]">{banner.linkUrl}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-[#2A2A2D]/60 pt-3">
                      <button
                        onClick={() => handleToggleActive(banner)}
                        className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded transition-colors cursor-pointer border-none ${
                          banner.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                        }`}
                      >
                        {banner.isActive ? '🟢 Active' : '⚪ Inactive'}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(banner)}
                          className="bg-transparent border border-[#2A2A2D] hover:border-white/40 text-white hover:bg-white/5 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Edit Banner"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(banner._id)}
                          className="bg-transparent border border-[#2A2A2D] hover:border-red-500/40 text-red-400 hover:bg-red-500/5 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Delete Banner"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
