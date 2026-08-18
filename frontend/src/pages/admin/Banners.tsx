import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
}

function positionLabel(position: string) {
  if (position === 'eyeglasses_landing') return 'Top';
  if (position === 'footer') return 'Footer';
  if (position === 'both') return 'Both';
  if (position === 'hero') return 'Hero';
  if (position.startsWith('after_category:')) {
    return `After ${position.replace('after_category:', '').toUpperCase()}`;
  }
  return position;
}

export default function AdminBanners() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    fetchBanners();
  }, []);

  useEffect(() => {
    socket.on('banner_changed', fetchBanners);
    return () => {
      socket.off('banner_changed', fetchBanners);
    };
  }, []);

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
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-serif font-semibold text-[#D4A04D]">Homepage Banners Manager</h1>
          <p className="text-xs text-[#A7A7A7]">Manage promotional or marketing banners rendered above eyeglasses on the landing page.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/banners/new')}
          className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md shrink-0"
        >
          + Add Banner
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs px-4 py-3 rounded-lg flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button type="button" onClick={() => setError('')} className="bg-transparent border-none text-red-400 hover:text-red-200 font-bold cursor-pointer">✕</button>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs px-4 py-3 rounded-lg flex items-center justify-between animate-fade-in">
          <span>✨ {success}</span>
          <button type="button" onClick={() => setSuccess('')} className="bg-transparent border-none text-emerald-400 hover:text-emerald-200 font-bold cursor-pointer">✕</button>
        </div>
      )}

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
          <h3 className="text-white font-bold text-sm">No data is added</h3>
          <p className="text-gray-500 text-xs max-w-xs mx-auto leading-relaxed">
            Click Add Banner to create a promotional banner for the landing page.
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
              <div className="w-full md:w-60 bg-black aspect-[3/1.2] md:aspect-[3/1.5] relative border-b md:border-b-0 md:border-r border-[#2A2A2D] shrink-0 flex items-center justify-center">
                <img
                  src={banner.imageUrl}
                  alt={banner.title || 'Banner'}
                  className="max-w-full max-h-full object-contain"
                />
                {!banner.isActive && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-[10px] font-bold tracking-widest uppercase bg-red-600/90 text-white px-2 py-0.5 rounded">
                      Inactive
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-[#D4A04D] font-mono font-bold">Order: {banner.displayOrder}</span>
                    <span className="text-[10px] bg-zinc-800 text-gray-300 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {positionLabel(banner.position)}
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
                    type="button"
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
                      type="button"
                      onClick={() => navigate(`/admin/banners/${banner._id}`)}
                      className="bg-transparent border border-[#2A2A2D] hover:border-white/40 text-white hover:bg-white/5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-[10px] font-bold uppercase"
                      title="Edit Banner"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(banner._id)}
                      className="bg-transparent border border-[#2A2A2D] hover:border-red-500/40 text-red-400 hover:bg-red-500/5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-[10px] font-bold uppercase"
                      title="Delete Banner"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
