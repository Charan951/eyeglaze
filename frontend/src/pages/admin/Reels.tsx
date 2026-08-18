import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { socket } from '../../lib/socket';
import { getEmbedUrl, isDirectVideo } from './homepageVideoMedia';

interface Reel {
  _id: string;
  title: string;
  videoUrl: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

export default function AdminReels() {
  const navigate = useNavigate();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchReels = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reels');
      setReels(res.data);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch reels from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  useEffect(() => {
    socket.on('reel_changed', fetchReels);
    return () => {
      socket.off('reel_changed', fetchReels);
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this reel?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/admin/reels/${id}`);
      setSuccess('Reel deleted successfully!');
      fetchReels();
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete reel.');
    }
  };

  const handleToggleActive = async (reel: Reel) => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/admin/reels/${reel._id}`, {
        isActive: !reel.isActive,
      });
      fetchReels();
      setSuccess(`Reel ${!reel.isActive ? 'activated' : 'deactivated'} successfully!`);
    } catch (err: any) {
      console.error(err);
      setError('Failed to update status.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-wider">Homepage Reels</h1>
          <p className="text-[#A7A7A7] text-xs mt-1">
            Manage portrait/vertical Reels shown above the EyeGlaze Showcase on the main landing page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/reels/new')}
          className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md shrink-0"
        >
          + Add Reel
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          ✓ {success}
        </div>
      )}

      <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl px-5 py-4 flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Active Reels List</h2>
        <span className="text-[10px] bg-white/5 text-gray-400 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
          {reels.length} {reels.length === 1 ? 'Reel' : 'Reels'}
        </span>
      </div>

      {loading ? (
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-8 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-t-[#D4A04D] border-[#2A2A2D] rounded-full animate-spin" />
          <span className="text-xs text-gray-500">Loading reels...</span>
        </div>
      ) : reels.length === 0 ? (
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <span className="text-3xl">📱</span>
          <h3 className="text-white font-bold text-sm">No data is added</h3>
          <p className="text-gray-500 text-xs max-w-xs mx-auto leading-relaxed">
            Click Add Reel to create a portrait reel. They appear above the Showcase on the home page.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {reels.map((reel) => (
            <div
              key={reel._id}
              className={`bg-[#131314] border rounded-xl overflow-hidden flex flex-col transition-all duration-300 ${
                reel.isActive ? 'border-[#2A2A2D] hover:border-[#D4A04D]/40' : 'border-[#2A2A2D] opacity-60'
              }`}
            >
              <div className="aspect-[9/16] w-full bg-black relative border-b border-[#2A2A2D]">
                {isDirectVideo(reel.videoUrl) ? (
                  <video
                    src={reel.videoUrl}
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                  />
                ) : (
                  <iframe
                    title={reel.title}
                    className="w-full h-full"
                    src={getEmbedUrl(reel.videoUrl)}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
                <div className="absolute top-2 left-2 bg-black/85 border border-[#2A2A2D]/80 text-[#D4A04D] font-mono font-bold text-[9px] px-2 py-0.5 rounded-md uppercase">
                  Order: {reel.displayOrder}
                </div>
                {!reel.isActive && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-red-500 font-extrabold uppercase text-xs tracking-wider">
                    Inactive
                  </div>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <h3 className="text-white text-xs font-bold uppercase tracking-wide truncate">
                    {reel.title}
                  </h3>
                  {reel.description && (
                    <p className="text-gray-400 text-[10px] leading-relaxed mt-1 line-clamp-2">
                      {reel.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 border-t border-[#2A2A2D]/40 pt-3 mt-auto">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(reel)}
                    className={`w-full text-[10px] font-bold py-1.5 rounded-lg transition-colors cursor-pointer ${
                      reel.isActive
                        ? 'bg-[#1C1C1E] hover:bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-[#D4A04D] hover:bg-[#C8923E] text-black'
                    }`}
                  >
                    {reel.isActive ? 'Deactivate' : 'Activate'}
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/reels/${reel._id}`)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold py-1.5 rounded-lg transition-all cursor-pointer border border-[#2A2A2D]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(reel._id)}
                      className="flex-1 bg-red-950/20 hover:bg-red-900/40 text-red-400 text-[10px] font-bold py-1.5 rounded-lg transition-all cursor-pointer border border-red-500/20"
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
