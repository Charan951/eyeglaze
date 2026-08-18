import { useState, useEffect } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { parseSectionType, TYPE_DEFAULT_POSITION, TYPE_LABEL, TYPE_TO_SLUG } from './homepageSectionMeta';

export default function AdminHomepageSectionEdit() {
  const { type: typeSlug, id } = useParams();
  const sectionType = parseSectionType(typeSlug);
  const navigate = useNavigate();
  const location = useLocation();
  const isNew = !id || id === 'new';
  const listPath = sectionType ? `/admin/homepage-sections/${TYPE_TO_SLUG[sectionType]}` : '/admin/homepage-sections/special-promo';
  const locationPosition = (location.state as { position?: string } | null)?.position;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [position, setPosition] = useState(
    locationPosition || (sectionType ? TYPE_DEFAULT_POSITION[sectionType] : 'after_featured')
  );
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [showOnMobile, setShowOnMobile] = useState(true);
  const [tag, setTag] = useState('');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [buttonText, setButtonText] = useState(sectionType === 'eyeglaze_edit' ? 'SHOP THE LOOK' : '');
  const [linkUrl, setLinkUrl] = useState(sectionType === 'eyeglaze_edit' ? '/products' : '');
  const [imageUrl, setImageUrl] = useState('');
  const [sectionTitle, setSectionTitle] = useState(
    sectionType === 'eyeglaze_edit' ? 'The EyeGlaze Edit: Styled by Icons' : ''
  );
  const [sectionSubtitle, setSectionSubtitle] = useState(
    sectionType === 'eyeglaze_edit' ? 'High-fashion trends inspired by global runways' : ''
  );

  useEffect(() => {
    if (!isNew || !sectionType || locationPosition) return;
    api.get('/admin/homepage-sections').then((res) => {
      const sibling = ((res.data || []) as Array<{ sectionType: string; position?: string }>).find(
        (section) => section.sectionType === sectionType && section.position
      );
      if (sibling?.position) setPosition(sibling.position);
    }).catch(() => {});
  }, [isNew, sectionType, locationPosition]);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    api
      .get(`/admin/homepage-sections/${id}`)
      .then((res) => {
        const section = res.data;
        setPosition(section.position || (sectionType ? TYPE_DEFAULT_POSITION[sectionType] : 'after_featured'));
        setDisplayOrder(section.displayOrder || 0);
        setIsActive(section.isActive !== false);
        setShowOnMobile(section.showOnMobile !== false);
        setTag(section.tag || '');
        setHeadline(section.headline || '');
        setDescription(section.description || '');
        setButtonText(section.buttonText || '');
        setLinkUrl(section.linkUrl || '');
        setImageUrl(section.imageUrl || '');
        setSectionTitle(section.sectionTitle || (sectionType === 'eyeglaze_edit' ? 'The EyeGlaze Edit: Styled by Icons' : ''));
        setSectionSubtitle(section.sectionSubtitle || (sectionType === 'eyeglaze_edit' ? 'High-fashion trends inspired by global runways' : ''));
        if (sectionType === 'eyeglaze_edit' && !section.headline && section.items?.[0]) {
          const first = section.items[0];
          setHeadline(first.title || '');
          setTag(first.style || '');
          setDescription(first.description || '');
          setImageUrl(first.imageUrl || section.imageUrl || '');
          setLinkUrl(first.linkUrl || section.linkUrl || '');
          setButtonText(first.buttonText || section.buttonText || 'SHOP THE LOOK');
        }
        setError('');
      })
      .catch((err: any) => {
        setError(err.response?.data?.error || 'Failed to load section.');
      })
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, onUrl: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    const formData = new FormData();
    formData.append('image', file);
    setUploadingImage(true);
    setError('');
    try {
      const res = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUrl(res.data.url);
      setSuccess('Image uploaded.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionType) return;
    setError('');
    setSuccess('');
    setSaving(true);
    const payload: Record<string, unknown> = {
      sectionType,
      displayOrder,
      isActive,
      showOnMobile,
      tag: tag.trim(),
      headline: headline.trim(),
      description: description.trim(),
      buttonText: buttonText.trim(),
      linkUrl: linkUrl.trim(),
      imageUrl: imageUrl.trim(),
      sectionTitle: sectionTitle.trim(),
      sectionSubtitle: sectionSubtitle.trim(),
      items: [],
    };
    if (isNew) payload.position = position;
    try {
      if (isNew) {
        await api.post('/admin/homepage-sections', payload);
        setSuccess('Section created.');
      } else {
        await api.put(`/admin/homepage-sections/${id}`, payload);
        setSuccess('Section updated.');
      }
      setTimeout(() => navigate(listPath), 600);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save section.');
    } finally {
      setSaving(false);
    }
  };

  if (!sectionType) {
    return <Navigate to="/admin/homepage-sections/special-promo" replace />;
  }

  const isEditCard = sectionType === 'eyeglaze_edit';
  const typeLabel = TYPE_LABEL[sectionType];
  const crumbLabel = isNew ? `Add ${typeLabel}` : `Edit ${typeLabel}`;

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 text-white">
      <nav className="flex items-center gap-1.5 text-xs font-semibold flex-wrap">
        <span className="text-gray-400">Home Sections</span>
        <span className="text-gray-600">➔</span>
        <Link
          to={listPath}
          className="text-gray-400 hover:text-white hover:underline transition-colors"
        >
          {typeLabel}
        </Link>
        <span className="text-gray-600">➔</span>
        <span className="text-[#D4A04D] font-bold">{isNew ? 'Add' : 'Edit'}</span>
      </nav>

      <div>
        <h1 className="text-2xl font-serif font-semibold text-[#D4A04D]">{crumbLabel}</h1>
        <p className="text-xs text-[#A7A7A7] mt-1">
          Placement is set on the {typeLabel} list page, same as Home Banners.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs px-4 py-3 rounded-lg">{error}</div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs px-4 py-3 rounded-lg">{success}</div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-t-[#D4A04D] border-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Loading section...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-6 flex flex-col gap-4">

          <label className="flex flex-col gap-1">
            <span className="text-[#A7A7A7] text-xs font-semibold uppercase tracking-wider">Display order</span>
            <input
              type="text"
              inputMode="numeric"
              value={String(displayOrder)}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value.replace(/[^\d]/g, ''), 10) || 0)}
              className="bg-[#181818] border border-[#2A2A2D] focus:border-[#D4A04D] text-xs text-white rounded-lg p-2.5 focus:outline-none"
            />
          </label>

          {isEditCard ? (
            <>
              <Field label="Section title" value={sectionTitle} onChange={setSectionTitle} placeholder="The EyeGlaze Edit: Styled by Icons" />
              <Field label="Section subtitle" value={sectionSubtitle} onChange={setSectionSubtitle} placeholder="High-fashion trends..." />
              <Field label="Look title" value={headline} onChange={setHeadline} placeholder="The Minimalist" />
              <Field label="Style" value={tag} onChange={setTag} placeholder="Thin Gold Wireframes" />
              <Field label="Description" value={description} onChange={setDescription} placeholder="A subtle statement..." />
              <Field label="Button text" value={buttonText} onChange={setButtonText} placeholder="SHOP THE LOOK" />
              <Field label="Link URL" value={linkUrl} onChange={setLinkUrl} placeholder="/products" />
              <Field label="Image URL" value={imageUrl} onChange={setImageUrl} placeholder="/images/cat_prescription.png" />
              <label className="text-[#A7A7A7] text-[10px] font-semibold uppercase">
                Or upload image
                <input type="file" accept="image/*" className="mt-1 block text-[10px]" onChange={(e) => handleImageUpload(e, setImageUrl)} />
              </label>
              {imageUrl && <img src={imageUrl} alt="" className="rounded-lg border border-[#2A2A2D] max-h-40 object-cover" />}
            </>
          ) : (
            <>
              <Field label="Tag" value={tag} onChange={setTag} placeholder="Special Promo" />
              <Field label="Headline" value={headline} onChange={setHeadline} placeholder="UP TO 50% OFF" />
              <Field label="Description" value={description} onChange={setDescription} placeholder="On Selected Sunglasses" />
              <Field label="Button text" value={buttonText} onChange={setButtonText} placeholder="SHOP NOW" />
              <Field label="Link URL" value={linkUrl} onChange={setLinkUrl} placeholder="/products?category=sunglasses" />
              <Field label="Image URL" value={imageUrl} onChange={setImageUrl} placeholder="/images/promo_sunglasses.png" />
              <label className="text-[#A7A7A7] text-[10px] font-semibold uppercase">
                Or upload image
                <input type="file" accept="image/*" className="mt-1 block text-[10px]" onChange={(e) => handleImageUpload(e, setImageUrl)} />
              </label>
              {imageUrl && <img src={imageUrl} alt="" className="rounded-lg border border-[#2A2A2D] max-h-40 object-cover" />}
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-[#A7A7A7] text-xs cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active
            </label>
            <label className="flex items-center gap-2 text-[#A7A7A7] text-xs cursor-pointer">
              <input type="checkbox" checked={showOnMobile} onChange={(e) => setShowOnMobile(e.target.checked)} />
              Show on mobile
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={uploadingImage || saving}
              className="flex-1 bg-[#D4A04D] hover:bg-[#C8923E] disabled:opacity-50 text-black font-extrabold text-xs uppercase py-2.5 rounded-lg border-none cursor-pointer"
            >
              {saving ? 'Saving...' : isNew ? 'Create section' : 'Save section'}
            </button>
            <button
              type="button"
              onClick={() => navigate(listPath)}
              className="bg-transparent border border-[#2A2A2D] text-gray-400 text-xs uppercase px-4 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[#A7A7A7] text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[#181818] border border-[#2A2A2D] focus:border-[#D4A04D] text-xs text-white rounded-lg p-2.5 focus:outline-none"
      />
    </label>
  );
}
