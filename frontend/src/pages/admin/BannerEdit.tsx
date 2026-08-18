import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';

const LIST_PATH = '/admin/banners';

export default function BannerEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [position, setPosition] = useState('eyeglasses_landing');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [showOnMobile, setShowOnMobile] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  useEffect(() => {
    api.get('/categories')
      .then((res) => setCategories(res.data || []))
      .catch((err) => console.error('Failed to fetch categories:', err));
  }, []);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    api.get(`/admin/banners/${id}`)
      .then((res) => {
        const banner = res.data;
        setTitle(banner.title || '');
        setSubtitle(banner.subtitle || '');
        setDescription(banner.description || '');
        setButtonText(banner.buttonText || '');
        setImageUrl(banner.imageUrl || '');
        setLinkUrl(banner.linkUrl || '');
        setPosition(banner.position || 'eyeglasses_landing');
        setDisplayOrder(banner.displayOrder || 0);
        setIsActive(banner.isActive !== false);
        setShowOnMobile(banner.showOnMobile !== false);
        setError('');
      })
      .catch((err: any) => {
        setError(err.response?.data?.error || 'Failed to load banner.');
      })
      .finally(() => setLoading(false));
  }, [id, isNew]);

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
        headers: { 'Content-Type': 'multipart/form-data' },
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

    setSaving(true);
    try {
      if (isNew) {
        await api.post('/admin/banners', payload);
      } else {
        await api.put(`/admin/banners/${id}`, payload);
      }
      setSuccess(isNew ? 'Banner created successfully!' : 'Banner updated successfully!');
      setTimeout(() => navigate(LIST_PATH), 600);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save banner.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-white">
      <button
        type="button"
        onClick={() => navigate(LIST_PATH)}
        className="mb-4 px-4 py-2 rounded-xl bg-[#1C1C1E] border border-[#2A2A2D] text-white hover:bg-[#2A2A2D] transition-colors text-xs font-bold uppercase tracking-wider"
      >
        ← Back to banners
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-serif font-semibold text-[#D4A04D]">
          {isNew ? 'Add Banner' : 'Edit Banner'}
        </h1>
        <p className="text-xs text-[#A7A7A7] mt-1">
          Promotional banners render on the landing page based on position.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-200 text-xs px-4 py-3 rounded-lg">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs px-4 py-3 rounded-lg">
          ✨ {success}
        </div>
      )}

      {loading ? (
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-12 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-t-[#D4A04D] border-[#2A2A2D] rounded-full animate-spin" />
          <span className="text-xs text-gray-500">Loading banner...</span>
        </div>
      ) : (
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  <div className="relative rounded-lg overflow-hidden border border-[#2A2A2D] aspect-[3/1] bg-black flex items-center justify-center">
                    <img src={imageUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
              </div>
            </div>

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

            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[#A7A7A7] text-xs font-semibold uppercase tracking-wider">
                  Display Order
                </label>
                <input
                  type="number"
                  min={0}
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
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

            <div className="flex gap-2.5 mt-2">
              <button
                type="submit"
                disabled={uploadingImage || saving}
                className="flex-1 bg-[#D4A04D] hover:bg-[#C8923E] disabled:opacity-50 text-black font-bold text-xs uppercase py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                {saving ? 'Saving...' : isNew ? 'Create Banner' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate(LIST_PATH)}
                className="px-4 border border-[#2A2A2D] text-white font-semibold text-xs uppercase rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
