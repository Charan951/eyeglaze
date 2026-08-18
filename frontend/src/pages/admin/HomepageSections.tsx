import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { socket } from '../../lib/socket';
import {
  parseSectionType,
  TYPE_DEFAULT_POSITION,
  TYPE_LABEL,
  TYPE_TO_SLUG,
  POSITION_OPTIONS,
  type SectionType,
} from './homepageSectionMeta';

interface HomepageSection {
  _id: string;
  sectionType: SectionType;
  position: string;
  displayOrder: number;
  isActive: boolean;
  showOnMobile: boolean;
  tag?: string;
  headline?: string;
  description?: string;
  sectionTitle?: string;
  imageUrl?: string;
  items?: Array<{ title?: string; style?: string; imageUrl?: string }>;
}

export function SectionPositionSelect({
  value,
  onChange,
  categories,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  categories: Array<{ _id: string; slug: string; name: string }>;
  disabled?: boolean;
}) {
  const known = new Set<string>([
    ...POSITION_OPTIONS.map((option) => option.value),
    ...categories.map((cat) => `after_category:${cat.slug}`),
  ]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="bg-[#181818] border border-[#2A2A2D] focus:border-[#D4A04D] text-xs text-white rounded-lg p-2.5 focus:outline-none cursor-pointer disabled:opacity-60 min-w-[240px]"
    >
      {POSITION_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
      {categories.map((cat) => (
        <option key={cat._id} value={`after_category:${cat.slug}`}>
          After {cat.name} Category
        </option>
      ))}
      {value && !known.has(value) && <option value={value}>{value}</option>}
    </select>
  );
}

export default function AdminHomepageSections() {
  const { type: typeSlug } = useParams();
  const sectionType = parseSectionType(typeSlug);
  const navigate = useNavigate();
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [position, setPosition] = useState(
    sectionType ? TYPE_DEFAULT_POSITION[sectionType] : 'after_featured'
  );
  const [savingPosition, setSavingPosition] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSections = async () => {
    if (!sectionType) return;
    setLoading(true);
    try {
      const res = await api.get('/admin/homepage-sections');
      const list = ((res.data || []) as HomepageSection[]).filter(
        (section) => section.sectionType === sectionType
      );
      setSections(list);
      if (list[0]?.position) setPosition(list[0].position);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch homepage sections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
    api.get('/categories').then((res) => setCategories(res.data || [])).catch(() => {});
  }, [sectionType]);

  useEffect(() => {
    socket.on('homepage_section_changed', fetchSections);
    return () => {
      socket.off('homepage_section_changed', fetchSections);
    };
  }, [sectionType]);

  if (!sectionType) {
    return <Navigate to="/admin/homepage-sections/special-promo" replace />;
  }

  const typeLabel = TYPE_LABEL[sectionType];
  const typePath = `/admin/homepage-sections/${TYPE_TO_SLUG[sectionType]}`;

  const handlePositionChange = async (next: string) => {
    setPosition(next);
    if (!sections.length) return;
    setSavingPosition(true);
    setError('');
    try {
      await api.put('/admin/homepage-sections/position', { sectionType, position: next });
      setSuccess('Position updated for all cards.');
      fetchSections();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update position.');
    } finally {
      setSavingPosition(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm(`Delete this ${typeLabel.toLowerCase()} section?`)) return;
    try {
      await api.delete(`/admin/homepage-sections/${id}`);
      setSuccess('Section deleted.');
      fetchSections();
    } catch {
      setError('Failed to delete section.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 text-white">
      <nav className="flex items-center gap-1.5 text-xs font-semibold flex-wrap">
        <span className="text-gray-400">Home Sections</span>
        <span className="text-gray-600">➔</span>
        <span className="text-[#D4A04D] font-bold">{typeLabel}</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#D4A04D]">{typeLabel}</h1>
          <p className="text-xs text-[#A7A7A7] mt-1">
            {sectionType === 'eyeglaze_edit'
              ? 'Each look card on this list appears in the EyeGlaze Edit carousel on web and mobile.'
              : `You can add multiple ${typeLabel.toLowerCase()} cards. They appear as a carousel on web and mobile.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`${typePath}/new`, { state: { position } })}
          className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-[10px] uppercase tracking-wider py-3 px-6 rounded-xl transition-all cursor-pointer shadow-md border-none self-start"
        >
          + Add {typeLabel}
        </button>
      </div>

      <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-[#A7A7A7] text-xs font-semibold uppercase tracking-wider">
            Section Position *
          </span>
          <SectionPositionSelect
            value={position}
            onChange={handlePositionChange}
            categories={categories}
            disabled={savingPosition}
          />
        </label>
        <p className="text-[10px] text-gray-500 sm:max-w-xs sm:pt-5">
          Same placement options as Home Banners. This applies to every {typeLabel.toLowerCase()} card.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs px-4 py-3 rounded-lg">{error}</div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs px-4 py-3 rounded-lg">{success}</div>
      )}

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="text-[#A7A7A7] text-sm py-10 text-center">Loading sections...</div>
        ) : sections.length === 0 ? (
          <div className="text-[#A7A7A7] text-sm py-10 text-center">No data is added</div>
        ) : (
          sections.map((section) => (
            <div
              key={section._id}
              className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-4 flex gap-4 items-center"
            >
              <div className="w-20 h-16 rounded-lg overflow-hidden bg-black shrink-0">
                {(section.imageUrl || section.items?.[0]?.imageUrl) && (
                  <img
                    src={section.imageUrl || section.items?.[0]?.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[#D4A04D] text-[10px] font-black uppercase tracking-wider">
                  {section.tag || TYPE_LABEL[section.sectionType]}
                </div>
                <div className="text-white text-sm font-bold truncate">
                  {section.headline || section.items?.[0]?.title || section.sectionTitle || 'Untitled'}
                </div>
                <div className="text-gray-500 text-[10px] mt-1">
                  order {section.displayOrder}
                  {!section.isActive ? ' · hidden' : ''}
                  {section.showOnMobile === false ? ' · web only' : ''}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  to={`${typePath}/${section._id}`}
                  className="bg-transparent border border-[#2A2A2D] text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg no-underline"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, section._id)}
                  className="bg-transparent border border-red-500/30 text-red-400 text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

