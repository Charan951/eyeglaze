import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../../lib/api';

const shapeFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  image: z.string().min(1, 'Shape icon image is required'),
  displayOrder: z.number().default(0),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

type ShapeFormData = z.infer<typeof shapeFormSchema>;

export default function ShapeWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<ShapeFormData>({
    resolver: zodResolver(shapeFormSchema) as any,
    defaultValues: {
      name: '',
      image: '',
      displayOrder: 0,
      status: 'Active',
    }
  });

  const formValues = watch();

  useEffect(() => {
    register('image');
  }, [register]);

  // Load existing details
  useEffect(() => {
    if (id) {
      setLoadingDetails(true);
      api.get(`/admin/shapes/${id}`)
        .then((res) => {
          reset({
            name: res.data.name || '',
            image: res.data.image || '',
            displayOrder: res.data.displayOrder || 0,
            status: res.data.status || 'Active',
          });
        })
        .catch(() => showToast('Failed to load shape details', 'error'))
        .finally(() => setLoadingDetails(false));
    }
  }, [id, reset]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploadingIcon(true);
    try {
      const res = await api.post('/admin/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setValue('image', res.data.url);
      showToast('Shape icon uploaded successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to upload image.', 'error');
    } finally {
      setUploadingIcon(false);
    }
  };

  const onSubmit = async (data: ShapeFormData) => {
    setIsSaving(true);
    try {
      if (id) {
        await api.put(`/admin/shapes/${id}`, data);
        showToast('Shape schema updated successfully!', 'success');
      } else {
        await api.post('/admin/shapes', data);
        showToast('Shape schema created successfully!', 'success');
      }
      setTimeout(() => navigate('/admin/shapes'), 1000);
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to save shape schema.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0C0C0E] text-white p-6 flex flex-col gap-6 relative">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl animate-slide-in ${
            toast.type === 'success'
              ? 'bg-green-500/10 border-green-500/25 text-green-400'
              : 'bg-red-500/10 border-red-500/25 text-red-400'
          }`}
        >
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2A2A2D] pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/shapes')}
            className="text-gray-400 hover:text-white text-xs bg-[#131314] hover:bg-zinc-800 border border-[#2A2A2D] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-serif font-semibold text-[#D4A04D]">
              {id ? 'Edit Shape Schema' : 'Create Shape Schema'}
            </h1>
            <p className="text-[10px] text-[#A7A7A7] mt-0.5">
              Configure dynamic frame shape name, icon image, and sort order.
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isSaving || loadingDetails}
          className="bg-[#D4A04D] hover:bg-[#C8923E] disabled:opacity-50 text-black font-extrabold text-[10px] uppercase tracking-wider py-3 px-6 rounded-xl transition-all cursor-pointer shadow-md select-none"
        >
          {isSaving ? 'Saving...' : 'Save Schema'}
        </button>
      </div>

      {loadingDetails ? (
        <div className="py-40 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-t-[#D4A04D] border-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Loading details...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-xl space-y-6">
              {/* Name */}
              <div>
                <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Shape Name *</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Round, Cat Eye, Rectangle"
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                />
                {errors.name && <p className="text-[#FF4444] text-[10px] mt-1 font-semibold">{errors.name.message}</p>}
              </div>

              {/* Icon Image Upload */}
              <div>
                <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5 font-semibold">Shape Icon Image *</label>
                {formValues.image ? (
                  <div className="flex items-center gap-4 bg-[#0B0B0C] border border-[#2A2A2D] p-3 rounded-xl">
                    <img
                      src={formValues.image}
                      alt="Shape Preview"
                      className="w-14 h-14 object-contain rounded bg-[#18181A] p-1 border border-[#2A2A2D]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate font-mono">{formValues.image}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setValue('image', '')}
                      className="text-red-400 hover:text-red-300 text-xs font-bold uppercase bg-transparent border-none cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      id="shapeIconUpload"
                      onChange={handleImageUpload}
                      disabled={uploadingIcon}
                      className="hidden"
                    />
                    <label
                      htmlFor="shapeIconUpload"
                      className="flex flex-col items-center justify-center border-2 border-dashed border-[#2A2A2D] hover:border-[#D4A04D]/60 rounded-xl p-8 cursor-pointer bg-[#0B0B0C]/40 transition-colors"
                    >
                      <span className="text-2xl mb-1">📤</span>
                      <span className="text-xs font-bold text-gray-400">
                        {uploadingIcon ? 'Uploading icon...' : 'Click or Drag to upload Shape Icon Image'}
                      </span>
                      <span className="text-[9px] text-gray-600 mt-1.5">PNG, JPG, WEBP, SVG up to 5MB</span>
                    </label>
                  </div>
                )}
                {errors.image && <p className="text-[#FF4444] text-[10px] mt-1 font-semibold">{errors.image.message}</p>}
              </div>

              {/* Display Order & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Display Sort Order</label>
                  <input
                    type="number"
                    {...register('displayOrder', { valueAsNumber: true })}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Status</label>
                  <select
                    {...register('status')}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Live Preview Sidebar */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6">
            <div className="text-[#A7A7A7] text-[10px] font-black uppercase tracking-widest px-2">
              Shape Preview
            </div>

            <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-xl flex flex-col gap-5">
              <div className="text-xs font-extrabold uppercase tracking-widest text-[#D4A04D]">Visual Render</div>

              {/* Rendering container */}
              <div className="bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl p-6 flex flex-col items-center justify-center min-h-[160px] gap-4">
                {formValues.image ? (
                  <div className="relative group/prev">
                    {/* Circle Background matching mock */}
                    <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center p-2 relative overflow-hidden transition-all duration-300 group-hover/prev:border-[#D4A04D]/40">
                      <img 
                        src={formValues.image} 
                        alt={formValues.name}
                        className="w-20 h-20 object-contain transform group-hover/prev:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-xs text-gray-600 font-medium">
                    Please upload an icon image to see the live frame icon preview.
                  </div>
                )}
              </div>

              <div className="space-y-3.5 border-t border-[#2A2A2D]/60 pt-4">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Name:</span>
                  <span className="text-white font-bold">{formValues.name || '—'}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Display Sort:</span>
                  <span className="text-white font-mono">#{formValues.displayOrder || '0'}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Status:</span>
                  <span className="text-green-400 font-bold uppercase tracking-wider text-[10px]">{formValues.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
