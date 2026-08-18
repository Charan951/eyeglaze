import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { getEmbedUrl, isDirectVideo } from './homepageVideoMedia';

const LIST_PATH = '/admin/reels';

export default function ReelEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [inputMode, setInputMode] = useState<'url' | 'upload'>('url');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    api.get(`/admin/reels/${id}`)
      .then((res) => {
        const reel = res.data;
        setTitle(reel.title || '');
        setVideoUrl(reel.videoUrl || '');
        setDescription(reel.description || '');
        setDisplayOrder(reel.displayOrder || 0);
        setIsActive(reel.isActive !== false);
        setInputMode(isDirectVideo(reel.videoUrl || '') ? 'upload' : 'url');
        setError('');
      })
      .catch((err: any) => {
        setError(err.response?.data?.error || 'Failed to load reel.');
      })
      .finally(() => setLoading(false));
  }, [id, isNew]);

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
        headers: { 'Content-Type': 'multipart/form-data' },
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

    setSaving(true);
    try {
      if (isNew) {
        await api.post('/admin/reels', payload);
      } else {
        await api.put(`/admin/reels/${id}`, payload);
      }
      setSuccess(isNew ? 'Reel added successfully!' : 'Reel updated successfully!');
      setTimeout(() => navigate(LIST_PATH), 600);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save reel.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        type="button"
        onClick={() => navigate(LIST_PATH)}
        className="mb-4 px-4 py-2 rounded-xl bg-[#1C1C1E] border border-[#2A2A2D] text-white hover:bg-[#2A2A2D] transition-colors text-xs font-bold uppercase tracking-wider"
      >
        ← Back to reels
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{isNew ? 'Add Reel' : 'Edit Reel'}</h1>
        <p className="text-[#A7A7A7] text-xs mt-1">
          Portrait reels appear above the EyeGlaze Showcase on the landing page.
        </p>
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

      {loading ? (
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-12 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-t-[#D4A04D] border-[#2A2A2D] rounded-full animate-spin" />
          <span className="text-xs text-gray-500">Loading reel...</span>
        </div>
      ) : (
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-6">
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
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
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
                disabled={uploadingVideo || saving}
                className="flex-1 bg-[#D4A04D] hover:bg-[#C8923E] disabled:opacity-50 text-black font-bold text-xs uppercase py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                {saving ? 'Saving...' : isNew ? 'Add Reel' : 'Save Changes'}
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

          {videoUrl.trim() && (
            <div className="mt-5 border-t border-[#2A2A2D] pt-4">
              <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-2">
                Live Preview
              </label>
              <div className="w-full max-w-[200px] mx-auto aspect-[9/16] rounded-xl overflow-hidden bg-black border border-[#2A2A2D]">
                {isDirectVideo(videoUrl.trim()) ? (
                  <video
                    src={videoUrl.trim()}
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                  />
                ) : (
                  <iframe
                    title="Form Preview"
                    className="w-full h-full"
                    src={getEmbedUrl(videoUrl.trim())}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
