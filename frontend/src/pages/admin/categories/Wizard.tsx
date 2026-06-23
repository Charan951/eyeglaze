import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../../lib/api';

const categoryFormSchema = z.object({
  type: z.enum(['Category', 'SubCategory']),
  
  // Basic Information
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters'),
  icon: z.string().optional(),
  bannerImage: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.number().default(0),
  status: z.enum(['Draft', 'Active', 'Inactive', 'Archived']).default('Active'),

  // Hierarchy references
  categoryId: z.string().optional(),
  subCategoryId: z.string().optional(),

  // Attributes
  genders: z.array(z.string()).default([]),
  ageGroups: z.array(z.string()).default([]),
  usageTypes: z.array(z.string()).default([]),
  faceShapes: z.array(z.string()).default([]),
  occasions: z.array(z.string()).default([]),

  // Filters
  brandFilter: z.boolean().default(true),
  priceFilter: z.boolean().default(true),
  colorFilter: z.boolean().default(true),
  shapeFilter: z.boolean().default(true),
  materialFilter: z.boolean().default(true),
  widthFilter: z.boolean().default(true),
  lensFilter: z.boolean().default(true),
  weightFilter: z.boolean().default(true),
  featuresFilter: z.boolean().default(true),
  faceShapeFilter: z.boolean().default(true),

  // Core slug required for routes
  slug: z.string().min(2, 'Slug must be lowercase alphanumeric with dashes'),

  // Navigation Menu Mapping
  showInMenu: z.boolean().default(true),
  menuLabel: z.string().optional(),
}).refine((data) => {
  if (data.type === 'SubCategory' && !data.categoryId) return false;
  return true;
}, {
  message: "Parent Category is required for Sub-Category",
  path: ["categoryId"]
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

export default function CategoryWizard() {
  const { type: paramType, id } = useParams();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // References list for Hierarchy selection
  const [parentCats, setParentCats] = useState<any[]>([]);
  const [parentSubcats, setParentSubcats] = useState<any[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);

  // Accordion active sections state
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema) as any,
    defaultValues: {
      type: 'Category',
      name: '',
      code: '',
      icon: '👓',
      bannerImage: '',
      description: '',
      displayOrder: 0,
      status: 'Active',
      genders: ['Unisex'],
      ageGroups: ['18-25', '26-35'],
      usageTypes: ['Daily Wear'],
      faceShapes: ['Oval', 'Round'],
      occasions: ['Casual'],
      brandFilter: true,
      priceFilter: true,
      colorFilter: true,
      shapeFilter: true,
      materialFilter: true,
      widthFilter: true,
      lensFilter: true,
      weightFilter: true,
      featuresFilter: true,
      faceShapeFilter: true,
      slug: '',
      showInMenu: true,
      menuLabel: '',
    }
  });

  const formValues = watch();

  // Load parent data for dropdown lists
  useEffect(() => {
    async function loadParents() {
      setLoadingParents(true);
      try {
        const [catsRes, subsRes] = await Promise.all([
          api.get('/admin/categories?type=Category'),
          api.get('/admin/categories?type=SubCategory')
        ]);
        setParentCats(catsRes.data.items || []);
        setParentSubcats(subsRes.data.items || []);
      } catch (err) {
        console.error('Failed to load parent reference dropdown lists', err);
      } finally {
        setLoadingParents(false);
      }
    }
    loadParents();
  }, []);

  // Auto-generate code & slug from Category name
  const nameValue = watch('name');
  useEffect(() => {
    if (nameValue && !id) {
      const generatedSlug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setValue('slug', generatedSlug);
      
      const generatedCode = 'CAT-' + nameValue
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '')
        .slice(0, 4) + '-' + Math.floor(100 + Math.random() * 900);
      setValue('code', generatedCode);
    }
  }, [nameValue, setValue, id]);

  // Load existing details in edit mode
  useEffect(() => {
    if (id && paramType) {
      api.get(`/admin/categories/${paramType}/${id}`)
        .then((res) => {
          const { category, attributes, filters, seo } = res.data;
          reset({
            type: category.type || category.targetType || 'Category',
            name: category.name || '',
            code: category.code || '',
            icon: category.icon || '',
            bannerImage: category.bannerImage || '',
            description: category.description || '',
            displayOrder: category.displayOrder || 0,
            status: category.status || 'Active',
            categoryId: category.categoryId || '',
            subCategoryId: category.subCategoryId || '',
            childCategoryId: category.childCategoryId || '',
            genders: attributes?.genders || [],
            ageGroups: attributes?.ageGroups || [],
            usageTypes: attributes?.usageTypes || [],
            faceShapes: attributes?.faceShapes || [],
            occasions: attributes?.occasions || [],
            brandFilter: filters?.brand ?? true,
            priceFilter: filters?.price ?? true,
            colorFilter: filters?.color ?? true,
            shapeFilter: filters?.frameShape ?? true,
            materialFilter: filters?.frameMaterial ?? true,
            widthFilter: filters?.frameWidth ?? true,
            lensFilter: filters?.lensType ?? true,
            weightFilter: filters?.weight ?? true,
            featuresFilter: filters?.features ?? true,
            faceShapeFilter: filters?.faceShape ?? true,
            slug: category.slug || seo?.slug || '',
            showInMenu: category.showInMenu ?? true,
            menuLabel: category.menuLabel || category.name || '',
          });
        })
        .catch(() => showToast('Failed to load category details', 'error'));
    }
  }, [id, paramType, reset]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleAccordion = (name: string) => {
    setActiveAccordion(activeAccordion === name ? null : name);
  };

  // Find parent names for live preview
  const getParentName = () => {
    if (formValues.type === 'SubCategory') {
      const parent = parentCats.find(c => c._id === formValues.categoryId);
      return parent ? `${parent.name} (${parent.code})` : 'None';
    }
    return 'N/A';
  };

  // Count active filters for preview card
  const getActiveFiltersCount = () => {
    const filtersList = [
      formValues.brandFilter, formValues.priceFilter, formValues.colorFilter,
      formValues.shapeFilter, formValues.materialFilter, formValues.widthFilter,
      formValues.lensFilter, formValues.weightFilter, formValues.featuresFilter,
      formValues.faceShapeFilter
    ];
    return filtersList.filter(Boolean).length;
  };

  const onSubmit = async (data: CategoryFormData) => {
    setIsSaving(true);
    try {
      const payload = {
        type: data.type,
        basic: {
          name: data.name,
          code: data.code,
          icon: data.icon,
          bannerImage: data.bannerImage,
          description: data.description,
          displayOrder: data.displayOrder,
          status: data.status,
          slug: data.slug,
        },
        hierarchy: {
          categoryId: data.type === 'SubCategory' ? data.categoryId : undefined,
        },
        attributes: {
          genders: data.genders,
          ageGroups: data.ageGroups,
          usageTypes: data.usageTypes,
          faceShapes: data.faceShapes,
          occasions: data.occasions,
        },
        filters: {
          brand: data.brandFilter,
          price: data.priceFilter,
          color: data.colorFilter,
          frameShape: data.shapeFilter,
          frameMaterial: data.materialFilter,
          frameWidth: data.widthFilter,
          lensType: data.lensFilter,
          weight: data.weightFilter,
          features: data.featuresFilter,
          faceShape: data.faceShapeFilter,
        },
        seo: {
          seoTitle: data.name,
          metaDescription: data.description || '',
          keywords: '',
          canonicalUrl: '',
          slug: data.slug,
          ogImage: data.bannerImage || '',
        },
      };

      if (id && paramType) {
        await api.put(`/admin/categories/${paramType}/${id}`, payload);
        showToast('Category updated successfully!', 'success');
      } else {
        await api.post('/admin/categories', payload);
        showToast('Category created successfully!', 'success');
      }
      setTimeout(() => navigate('/admin/categories'), 1500);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to save Category configurations';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F2F2F2] flex flex-col pb-24 select-none">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl border text-sm font-bold animate-slide-in ${toast.type === 'success' ? 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20' : 'bg-[#FF4444]/10 text-[#FF4444] border-[#FF4444]/20'}`}>
          {toast.type === 'success' ? '✓ ' : '✕ '} {toast.message}
        </div>
      )}

      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#2A2A2D] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/categories')} className="text-[#A7A7A7] hover:text-white transition-colors text-xs font-bold uppercase tracking-wider bg-transparent border-none cursor-pointer">
            ← Categories
          </button>
          <div className="h-4 w-px bg-[#2A2A2D]" />
          <h1 className="text-base font-extrabold uppercase tracking-wide text-white">
            {id ? `Edit ${paramType}` : 'Add Category Tier'}
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/categories')}
            className="bg-[#2A2A2D] hover:bg-zinc-800 text-white font-bold py-2 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors border-none cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving}
            className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold py-2 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg disabled:opacity-50 border-none cursor-pointer"
          >
            {isSaving ? 'Saving...' : 'Save Schema'}
          </button>
        </div>
      </header>

      {/* Form and Preview Layout Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Form Editor */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Primary Details Card */}
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-xl space-y-6">
              <h2 className="text-[#D4A04D] text-xs font-black uppercase tracking-widest border-b border-[#2A2A2D] pb-3 flex items-center gap-2">
                <span>01.</span> Core Category Details
              </h2>

              {/* Type */}
              <div>
                <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Category Type *</label>
                <select
                  {...register('type')}
                  disabled={!!id}
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none disabled:opacity-50"
                >
                  <option value="Category">Main Category</option>
                  <option value="SubCategory">Sub Category</option>
                </select>
              </div>

              {/* Conditional Hierarchy Selection */}
              {formValues.type !== 'Category' && (
                <div className="p-4 bg-[#18181A] border border-[#2A2A2D]/40 rounded-xl space-y-3">
                  <div className="text-xs text-[#A7A7A7] font-semibold flex items-center gap-1.5">
                    <span>🔀</span> Establish Parent Connection
                  </div>

                  {formValues.type === 'SubCategory' && (
                    <div>
                      <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1">Select Parent Main Category *</label>
                      {loadingParents ? (
                        <div className="text-xs text-zinc-500 animate-pulse">Loading categories...</div>
                      ) : (
                        <select
                          {...register('categoryId')}
                          className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none font-bold"
                        >
                          <option value="">-- Choose Category --</option>
                          {parentCats.map(c => (
                            <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                          ))}
                        </select>
                      )}
                      {errors.categoryId && <p className="text-[#FF4444] text-[10px] mt-1 font-semibold">{errors.categoryId.message}</p>}
                    </div>
                  )}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Category Name *</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Round Eyeglasses"
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                />
                {errors.name && <p className="text-[#FF4444] text-[10px] mt-1 font-semibold">{errors.name.message}</p>}
              </div>

              {/* Banner Image URL */}
              <div>
                <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Banner Image URL</label>
                <input
                  type="text"
                  {...register('bannerImage')}
                  placeholder="https://images.lenskart.com/banner.jpg"
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                />
              </div>

              {/* Status & Display Sort Order */}
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
                    <option value="Draft">Draft</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Description</label>
                <textarea
                  {...register('description')}
                  placeholder="Enter details explaining what products fall under this category tier..."
                  rows={3}
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Collapsible Advanced Settings Panel */}
            <div className="space-y-4">
              <div className="text-[#A7A7A7] text-[10px] font-black uppercase tracking-widest px-2">
                02. Advanced Schema Settings (Optional)
              </div>

              {/* Accordion 1: Catalog Attributes */}
              <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl overflow-hidden shadow-xl transition-all">
                <button
                  type="button"
                  onClick={() => toggleAccordion('attributes')}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#1A1A1C] transition-colors cursor-pointer border-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base text-[#D4A04D]">🏷️</span>
                    <div>
                      <span className="text-white text-xs font-extrabold uppercase tracking-wider block">Target Catalog Attributes</span>
                      <span className="text-[10px] text-[#A7A7A7] block mt-0.5">Demographics, Face Shapes, Occasions & Usage targets</span>
                    </div>
                  </div>
                  <span className={`text-xs text-[#A7A7A7] transition-transform duration-200 ${activeAccordion === 'attributes' ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {activeAccordion === 'attributes' && (
                  <div className="p-6 border-t border-[#2A2A2D] bg-[#0E0E0F] space-y-6">
                    {/* Gender target */}
                    <div className="space-y-2.5">
                      <label className="text-[#A7A7A7] text-[9px] font-extrabold uppercase tracking-widest block">Gender Target</label>
                      <div className="flex gap-2.5 flex-wrap">
                        {['Men', 'Women', 'Kids', 'Unisex'].map(g => {
                          const current = formValues.genders || [];
                          const isChecked = current.includes(g);
                          return (
                            <label key={g} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${isChecked ? 'bg-[#D4A04D]/10 text-[#D4A04D] border-[#D4A04D]/30 scale-[1.02]' : 'bg-[#0B0B0C] text-[#A7A7A7] border-zinc-800 hover:text-white'}`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) setValue('genders', [...current, g]);
                                  else setValue('genders', current.filter(x => x !== g));
                                }}
                                className="hidden"
                              />
                              <span>{g}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Age groups target */}
                    <div className="space-y-2.5">
                      <label className="text-[#A7A7A7] text-[9px] font-extrabold uppercase tracking-widest block">Age Groups Target</label>
                      <div className="flex gap-2.5 flex-wrap">
                        {['0-5', '6-12', '13-18', '18-25', '26-35', '36-50', '50+'].map(age => {
                          const current = formValues.ageGroups || [];
                          const isChecked = current.includes(age);
                          return (
                            <label key={age} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${isChecked ? 'bg-[#D4A04D]/10 text-[#D4A04D] border-[#D4A04D]/30 scale-[1.02]' : 'bg-[#0B0B0C] text-[#A7A7A7] border-zinc-800 hover:text-white'}`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) setValue('ageGroups', [...current, age]);
                                  else setValue('ageGroups', current.filter(x => x !== age));
                                }}
                                className="hidden"
                              />
                              <span>{age}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Usage Types target */}
                    <div className="space-y-2.5">
                      <label className="text-[#A7A7A7] text-[9px] font-extrabold uppercase tracking-widest block">Usage Type Targets</label>
                      <div className="flex gap-2.5 flex-wrap">
                        {['Daily Wear', 'Office Wear', 'Computer Use', 'Reading', 'Driving', 'Gaming', 'Sports', 'Outdoor', 'Fashion'].map(u => {
                          const current = formValues.usageTypes || [];
                          const isChecked = current.includes(u);
                          return (
                            <label key={u} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${isChecked ? 'bg-[#D4A04D]/10 text-[#D4A04D] border-[#D4A04D]/30 scale-[1.02]' : 'bg-[#0B0B0C] text-[#A7A7A7] border-zinc-800 hover:text-white'}`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) setValue('usageTypes', [...current, u]);
                                  else setValue('usageTypes', current.filter(x => x !== u));
                                }}
                                className="hidden"
                              />
                              <span>{u}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Face Shape targets */}
                    <div className="space-y-2.5">
                      <label className="text-[#A7A7A7] text-[9px] font-extrabold uppercase tracking-widest block">Face Shape Compatibility</label>
                      <div className="flex gap-2.5 flex-wrap">
                        {['Round', 'Oval', 'Square', 'Heart', 'Diamond', 'Rectangle', 'Triangle'].map(f => {
                          const current = formValues.faceShapes || [];
                          const isChecked = current.includes(f);
                          return (
                            <label key={f} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${isChecked ? 'bg-[#D4A04D]/10 text-[#D4A04D] border-[#D4A04D]/30 scale-[1.02]' : 'bg-[#0B0B0C] text-[#A7A7A7] border-zinc-800 hover:text-white'}`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) setValue('faceShapes', [...current, f]);
                                  else setValue('faceShapes', current.filter(x => x !== f));
                                }}
                                className="hidden"
                              />
                              <span>{f}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Occasion targets */}
                    <div className="space-y-2.5">
                      <label className="text-[#A7A7A7] text-[9px] font-extrabold uppercase tracking-widest block">Occasions</label>
                      <div className="flex gap-2.5 flex-wrap">
                        {['Casual', 'Formal', 'Business', 'Travel', 'Party', 'Sports'].map(o => {
                          const current = formValues.occasions || [];
                          const isChecked = current.includes(o);
                          return (
                            <label key={o} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${isChecked ? 'bg-[#D4A04D]/10 text-[#D4A04D] border-[#D4A04D]/30 scale-[1.02]' : 'bg-[#0B0B0C] text-[#A7A7A7] border-zinc-800 hover:text-white'}`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) setValue('occasions', [...current, o]);
                                  else setValue('occasions', current.filter(x => x !== o));
                                }}
                                className="hidden"
                              />
                              <span>{o}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 2: Customer Search Filters */}
              <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl overflow-hidden shadow-xl transition-all">
                <button
                  type="button"
                  onClick={() => toggleAccordion('filters')}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#1A1A1C] transition-colors cursor-pointer border-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base text-[#D4A04D]">🎛️</span>
                    <div>
                      <span className="text-white text-xs font-extrabold uppercase tracking-wider block">Customer Search Filters</span>
                      <span className="text-[10px] text-[#A7A7A7] block mt-0.5">Toggle filter controls visible on product list catalogs</span>
                    </div>
                  </div>
                  <span className={`text-xs text-[#A7A7A7] transition-transform duration-200 ${activeAccordion === 'filters' ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {activeAccordion === 'filters' && (
                  <div className="p-6 border-t border-[#2A2A2D] bg-[#0E0E0F] space-y-4">
                    <p className="text-[10px] text-[#A7A7A7] uppercase font-bold tracking-wider mb-2">Enable / Disable Filters for this Catalog Tier:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { field: 'brandFilter', label: 'Brand Filter' },
                        { field: 'priceFilter', label: 'Price Range' },
                        { field: 'colorFilter', label: 'Colors Grid' },
                        { field: 'shapeFilter', label: 'Frame Shapes' },
                        { field: 'materialFilter', label: 'Frame Materials' },
                        { field: 'widthFilter', label: 'Frame Width' },
                        { field: 'lensFilter', label: 'Lens Types' },
                        { field: 'weightFilter', label: 'Weight Filter' },
                        { field: 'featuresFilter', label: 'Features Filter' },
                        { field: 'faceShapeFilter', label: 'Face Shape Filter' }
                      ].map(({ field, label }) => (
                        <label key={field} className="flex items-center gap-3 p-3 bg-[#0B0B0C] border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl cursor-pointer select-none text-xs font-bold text-gray-300 transition-colors">
                          <input
                            type="checkbox"
                            {...register(field as any)}
                            className="w-4 h-4 accent-[#D4A04D] cursor-pointer"
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 3: Website Menu Mapping */}
              <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl overflow-hidden shadow-xl transition-all">
                <button
                  type="button"
                  onClick={() => toggleAccordion('menu')}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#1A1A1C] transition-colors cursor-pointer border-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base text-[#D4A04D]">🗺️</span>
                    <div>
                      <span className="text-white text-xs font-extrabold uppercase tracking-wider block">Website Navigation Menu Mapping</span>
                      <span className="text-[10px] text-[#A7A7A7] block mt-0.5">Control where and how this category displays in header/footer</span>
                    </div>
                  </div>
                  <span className={`text-xs text-[#A7A7A7] transition-transform duration-200 ${activeAccordion === 'menu' ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {activeAccordion === 'menu' && (
                  <div className="p-6 border-t border-[#2A2A2D] bg-[#0E0E0F] space-y-5">
                    <div className="flex items-center justify-between bg-[#0B0B0C] border border-zinc-800 p-4 rounded-xl">
                      <div>
                        <h4 className="text-white text-xs font-bold block">Display in Nav Navigation Menu grids</h4>
                        <p className="text-[10px] text-[#A7A7A7] mt-0.5">Toggle catalog link inclusion in site headers/footers dynamically.</p>
                      </div>
                      <input
                        type="checkbox"
                        {...register('showInMenu')}
                        className="w-9 h-5 accent-[#D4A04D] cursor-pointer"
                      />
                    </div>

                    {formValues.showInMenu && (
                      <div className="space-y-2.5 animate-fade-in">
                        <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block">Navigation Menu Text Label</label>
                        <input
                          type="text"
                          {...register('menuLabel')}
                          placeholder={formValues.name || 'Category Name'}
                          className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-xs focus:border-[#D4A04D] focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions Form Footer */}
            <div className="flex justify-end gap-3 border-t border-[#2A2A2D] pt-6">
              <button
                type="button"
                onClick={() => navigate('/admin/categories')}
                className="bg-[#2A2A2D] hover:bg-zinc-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-colors border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg disabled:opacity-50 border-none cursor-pointer"
              >
                {isSaving ? 'Saving Configurations...' : 'Publish Category Schema'}
              </button>
            </div>

          </form>
        </div>

        {/* Right Side: Sticky Live Interactive Preview */}
        <div className="lg:col-span-4 lg:sticky lg:top-[85px] space-y-6">
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl overflow-hidden shadow-xl flex flex-col">
            
            <div className="px-5 py-4 border-b border-[#2A2A2D] flex items-center justify-between">
              <span className="text-white text-xs font-extrabold uppercase tracking-wider">Live Catalog Preview</span>
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                formValues.status === 'Active' ? 'bg-[#4CAF50]/15 text-[#4CAF50] border border-[#4CAF50]/20' :
                formValues.status === 'Draft' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20' :
                'bg-red-500/15 text-red-400 border border-red-500/20'
              }`}>
                {formValues.status}
              </span>
            </div>

            {/* Banner Section Mock */}
            <div className="relative aspect-[16/7] bg-[#18181A] flex items-center justify-center overflow-hidden border-b border-[#2A2A2D]/85">
              {formValues.bannerImage ? (
                <img
                  src={formValues.bannerImage}
                  alt="Category Banner Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-tr from-[#1B1207] to-[#101012] flex flex-col items-center justify-center text-center opacity-70">
                  <span className="text-3xl filter drop-shadow-md mb-1">👓</span>
                  <span className="text-[9px] uppercase tracking-widest font-black text-[#D4A04D]/60">Banner Artwork Layer</span>
                </div>
              )}

              {/* Float Type Badge */}
              <span className="absolute top-3 left-3 bg-[#0B0B0C]/85 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black uppercase text-[#D4A04D] border border-zinc-800">
                {formValues.type}
              </span>
            </div>

            {/* Metadata Info Panel */}
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <h3 className="text-white text-base font-black leading-snug flex items-center gap-1.5">
                  <span>{formValues.name || 'Untitled Category'}</span>
                </h3>
              </div>

              {formValues.description && (
                <p className="text-gray-400 text-[10px] leading-normal border-t border-zinc-800/60 pt-3">
                  {formValues.description}
                </p>
              )}

              {/* Hierarchy Parent Trace */}
              {formValues.type !== 'Category' && (
                <div className="bg-[#0B0B0C] p-3 rounded-xl border border-zinc-900 flex items-center justify-between text-[10px]">
                  <span className="text-zinc-500 font-bold uppercase">Parent Trace:</span>
                  <span className="text-white font-extrabold text-right font-mono max-w-[70%] truncate">
                    {getParentName()}
                  </span>
                </div>
              )}

              {/* Dynamic Stats Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-[#18181A] p-2.5 rounded-xl border border-zinc-900 text-center">
                  <span className="text-zinc-500 text-[8px] font-black uppercase tracking-wider block">Active Filters</span>
                  <span className="text-white text-sm font-extrabold mt-0.5 block">{getActiveFiltersCount()} / 10</span>
                </div>
                <div className="bg-[#18181A] p-2.5 rounded-xl border border-zinc-900 text-center">
                  <span className="text-zinc-500 text-[8px] font-black uppercase tracking-wider block">Display Order</span>
                  <span className="text-white text-sm font-extrabold mt-0.5 block">#{formValues.displayOrder || '0'}</span>
                </div>
              </div>

              {/* Demographics targets */}
              {((formValues.genders && formValues.genders.length > 0) || (formValues.ageGroups && formValues.ageGroups.length > 0)) && (
                <div className="space-y-1.5 border-t border-zinc-800/60 pt-3">
                  <span className="text-zinc-500 text-[8px] font-black uppercase tracking-wider block">Demographics Compatibility</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {formValues.genders?.map(g => (
                      <span key={g} className="bg-[#D4A04D]/10 border border-[#D4A04D]/25 text-[#D4A04D] px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase">
                        {g}
                      </span>
                    ))}
                    {formValues.ageGroups?.map(a => (
                      <span key={a} className="bg-zinc-800 border border-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase">
                        Age: {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
