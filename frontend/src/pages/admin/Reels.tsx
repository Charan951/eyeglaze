import { useState, useEffect } from 'react';
import api from '../../lib/api';

interface Reel {
  _id: string;
  title: string;
  videoUrl: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminReels() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Upload/Input Mode States
  const [inputMode, setInputMode] = useState<'url' | 'upload'>('url');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file.');
      return;
    }

    const formData = new FormData();
    formData.append('video', file);

    setUploadingVideo(true);
    setUploadProgress('Uploading reel...');
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/admin/upload/video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setVideoUrl(res.data.url);
      setSuccess('Reel file uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to upload reel file.');
    } finally {
      setUploadingVideo(false);
      setUploadProgress('');
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

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

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    // YouTube
    const ytMatch = url.match(
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    );
    if (ytMatch && ytMatch[2].length === 11) {
      return `https://www.youtube.com/embed/${ytMatch[2]}`;
    }
    // Vimeo
    const vimeoMatch = url.match(
      /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/
    );
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    return url;
  };

  const isDirectVideo = (url: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('vimeo.com')) {
      return false;
    }
    const ext = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];
    const cleanUrl = lower.split('?')[0];
    return ext.some(e => cleanUrl.endsWith(e)) || lower.includes('/uploads/') || lower.includes('/stream/');
  };

  const resetForm = () => {
    setTitle('');
    setVideoUrl('');
    setDescription('');
    setDisplayOrder(0);
    setIsActive(true);
    setIsEditing(false);
    setEditingId(null);
    setInputMode('url');
    setUploadProgress('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim() || !videoUrl.trim()) {
      setError('Title and Video URL are required.');
      return;
    }

    const payload = {
      title: title.trim(),
      videoUrl: videoUrl.trim(),
      description: description.trim(),
      displayOrder,
      isActive,
    };

    try {
      if (isEditing && editingId) {
        await api.put(`/admin/reels/${editingId}`, payload);
        setSuccess('Reel updated successfully!');
      } else {
        await api.post('/admin/reels', payload);
        setSuccess('Reel added successfully!');
      }
      resetForm();
      fetchReels();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save reel.');
    }
  };

  const handleEditClick = (reel: Reel) => {
    setIsEditing(true);
    setEditingId(reel._id);
    setTitle(reel.title);
    setVideoUrl(reel.videoUrl);
    setDescription(reel.description || '');
    setDisplayOrder(reel.displayOrder);
    setIsActive(reel.isActive);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-wider">Homepage Reels</h1>
          <p className="text-[#A7A7A7] text-xs mt-1">
            Manage portrait/vertical Reels shown above the EyeGlaze Showcase on the main landing page.
          </p>
        </div>
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

      {/* Grid containing Form and Reels List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Editor Form */}
        <div className="lg:col-span-1 bg-[#131314] border border-[#2A2A2D] rounded-xl p-5">
          <h2 className="text-lg font-bold text-white mb-4">
            {isEditing ? '✏️ Edit Reel' : '➕ Add Reel'}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[#A7A7A7] text-xs font-semibold uppercase tracking-wider">
                Reel Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Vintage Gold Frame"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-[#181818] border border-[#2A2A2D] focus:border-[#D4A04D] text-xs text-white rounded-lg p-2.5 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#A7A7A7] text-xs font-semibold uppercase tracking-wider">
                Video Source <span className="text-red-500">*</span>
              </label>
              
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#181818] border border-[#2A2A2D] rounded-lg">
                <button
                  type="button"
                  onClick={() => setInputMode('url')}
                  className={`py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                    inputMode === 'url' ? 'bg-[#D4A04D] text-black' : 'text-[#A7A7A7] hover:text-white'
                  }`}
                >
                  Link URL
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                    inputMode === 'upload' ? 'bg-[#D4A04D] text-black' : 'text-[#A7A7A7] hover:text-white'
                  }`}
                >
                  Upload File
                </button>
              </div>

              {inputMode === 'url' ? (
                <div className="flex flex-col gap-1 mt-1">
                  <input
                    type="text"
                    required
                    placeholder="e.g. https://example.com/reel.mp4"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="bg-[#181818] border border-[#2A2A2D] focus:border-[#D4A04D] text-xs text-white rounded-lg p-2.5 focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-500">
                    Direct MP4/WebM URL (e.g. S3), or YouTube/Vimeo links.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mt-1">
                  <label className="border-2 border-dashed border-[#2A2A2D] hover:border-[#D4A04D]/40 bg-[#181818] rounded-lg p-5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors relative">
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleVideoUpload}
                      disabled={uploadingVideo}
                    />
                    {uploadingVideo ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-5 h-5 border-2 border-t-[#D4A04D] border-[#2A2A2D] rounded-full animate-spin" />
                        <span className="text-[10px] text-[#D4A04D] font-bold">{uploadProgress}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-center">
                        <span className="text-xl">📁</span>
                        <span className="text-[10px] text-white font-bold">Select Video File</span>
                        <span className="text-[9px] text-gray-500">MP4, WebM portrait/vertical layout</span>
                      </div>
                    )}
                  </label>
                  {videoUrl && (
                    <div className="bg-[#181818] border border-[#2A2A2D] p-2.5 rounded-lg text-[9.5px] font-mono text-gray-400 break-all select-all flex items-center justify-between gap-2">
                      <span className="truncate flex-1">{videoUrl}</span>
                      <span className="text-[#D4A04D] font-bold uppercase shrink-0 text-[8px] border border-[#D4A04D]/30 px-1.5 py-0.5 rounded">Uploaded</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[#A7A7A7] text-xs font-semibold uppercase tracking-wider">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Brief description of the reel..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-[#181818] border border-[#2A2A2D] focus:border-[#D4A04D] text-xs text-white rounded-lg p-2.5 focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[#A7A7A7] text-xs font-semibold uppercase tracking-wider">
                  Display Order
                </label>
                <input
                  type="number"
                  min={0}
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                  className="bg-[#181818] border border-[#2A2A2D] focus:border-[#D4A04D] text-xs text-white rounded-lg p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2.5 text-[#A7A7A7] text-xs font-semibold uppercase tracking-wider cursor-pointer py-3 select-none">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-[#2A2A2D] text-[#D4A04D] focus:ring-0 focus:ring-offset-0 bg-[#181818]"
                  />
                  <span>Is Active</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2.5 mt-2">
              <button
                type="submit"
                className="flex-1 bg-[#D4A04D] hover:bg-[#C8923E] text-black font-bold text-xs uppercase py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                {isEditing ? 'Save Changes' : 'Add Reel'}
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

          {/* Inline Video Preview in Form */}
          {videoUrl.trim() && (
            <div className="mt-5 border-t border-[#2A2A2D] pt-4">
              <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-2">
                Live Preview:
              </label>
              <div className="w-full max-w-[200px] mx-auto aspect-[9/16] rounded-xl overflow-hidden bg-black border border-[#2A2A2D]">
                {isDirectVideo(videoUrl.trim()) ? (
                  <video
                    src={videoUrl.trim()}
                    className="w-full h-full object-cover animate-fade-in"
                    controls
                    playsInline
                  />
                ) : (
                  <iframe
                    title="Form Preview"
                    className="w-full h-full animate-fade-in"
                    src={getEmbedUrl(videoUrl.trim())}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reels List Grid */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl px-5 py-4 flex items-center justify-between">
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
              <h3 className="text-white font-bold text-sm">No Reels Found</h3>
              <p className="text-gray-500 text-xs max-w-xs mx-auto leading-relaxed">
                Add portrait reels using the form on the left. They will render vertically in a single line on the home page above the Showcase.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {reels.map((reel) => (
                <div
                  key={reel._id}
                  className={`bg-[#131314] border rounded-xl overflow-hidden flex flex-col transition-all duration-300 ${
                    reel.isActive ? 'border-[#2A2A2D] hover:border-[#D4A04D]/40' : 'border-[#2A2A2D] opacity-60'
                  }`}
                >
                  {/* Aspect Ratio 9:16 for Reels */}
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
                    <div className="absolute top-2 left-2 bg-black/85 border border-[#2A2A2D]/80 text-[#D4A04D] font-mono font-bold text-[9px] px-2 py-0.5 rounded-md uppercase animate-fade-in">
                      Order: {reel.displayOrder}
                    </div>
                    {!reel.isActive && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-red-500 font-extrabold uppercase text-xs tracking-wider">
                        Inactive
                      </div>
                    )}
                  </div>

                  {/* Body Info */}
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

                    {/* Actions */}
                    <div className="flex flex-col gap-2 border-t border-[#2A2A2D]/40 pt-3 mt-auto">
                      <button
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
                          onClick={() => handleEditClick(reel)}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold py-1.5 rounded-lg transition-all cursor-pointer border border-[#2A2A2D]"
                        >
                          Edit
                        </button>
                        <button
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
      </div>
    </div>
  );
}
