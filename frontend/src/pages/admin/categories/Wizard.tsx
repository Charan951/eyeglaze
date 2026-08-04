import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../../lib/api';

const categoryFormSchema = z.object({
  type: z.enum(['Category', 'SubCategory', 'SubSubCategory', 'SubSubSubCategory']),
  
  // Basic Information
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters'),
  icon: z.string().optional(),
  bannerImage: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.number().default(0),
  startingPrice: z.number().optional(),
  status: z.enum(['Draft', 'Active', 'Inactive', 'Archived']).default('Active'),

  // Hierarchy references
  categoryId: z.string().optional(),
  subCategoryId: z.string().optional(),
  subSubCategoryId: z.string().optional(),

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
  showInNavbar: z.boolean().default(true),

  // SubCategory custom settings
  linkTo: z.string().optional(),
  gender: z.string().optional(),
  shapeModal: z.boolean().default(false),
  modalShapes: z.array(z.string()).default(['Round', 'Rectangle', 'Aviator', 'Square', 'Cat Eye', 'Geometric']),
  modalAgeGroups: z.array(z.string()).default(['Kids On Sale', 'Juniors', 'Tweens', 'Teens']),

  // Main Category custom layout settings
  subCategoryShape: z.enum(['square', 'circle', 'rectangle']).default('square'),
  subCategorySize: z.enum(['small', 'medium', 'large']).default('medium'),
  subCategoryColumns: z.number().min(2).max(6).default(4),
}).refine((data) => {
  if (data.type === 'SubCategory' && !data.categoryId) return false;
  if (data.type === 'SubSubCategory' && (!data.categoryId || !data.subCategoryId)) return false;
  if (data.type === 'SubSubSubCategory' && (!data.categoryId || !data.subCategoryId || !data.subSubCategoryId)) return false;
  return true;
}, {
  message: "Parent selection is required",
  path: ["categoryId"]
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

export default function CategoryWizard() {
  const { type: paramType, id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [parentCategories, setParentCategories] = useState<any[]>([]);
  const [subCategoriesForParent, setSubCategoriesForParent] = useState<any[]>([]);
  const [availableShapes, setAvailableShapes] = useState<string[]>([]);
  const [availableKidsAgeGroups, setAvailableKidsAgeGroups] = useState<string[]>([]);

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
      showInNavbar: true,
      linkTo: '',
      gender: '',
      shapeModal: false,
      modalShapes: ['Round', 'Rectangle', 'Aviator', 'Square', 'Cat Eye', 'Geometric'],
      modalAgeGroups: ['Kids On Sale', 'Juniors', 'Tweens', 'Teens'],
      subCategoryShape: 'square',
      subCategorySize: 'medium',
      subCategoryColumns: 4,
    }
  });

  const [subSubCategoriesForParent, setSubSubCategoriesForParent] = useState<any[]>([]);

  const formValues = watch();
  const selectedCategoryId = watch('categoryId');
  const selectedSubCategoryId = watch('subCategoryId');

  const qType = searchParams.get('type');
  const qCatId = searchParams.get('categoryId');
  const qSubCatId = searchParams.get('subCategoryId');
  const qSubSubCatId = searchParams.get('subSubCategoryId');

  // Pre-populate form type & initial query values
  useEffect(() => {
    if (!id) {
      if (qType) setValue('type', qType as any);
      if (qCatId) setValue('categoryId', qCatId);
      if (qSubCatId) setValue('subCategoryId', qSubCatId);
      if (qSubSubCatId) setValue('subSubCategoryId', qSubSubCatId);
    }
  }, [id, qType, qCatId, qSubCatId, qSubSubCatId, setValue]);

  // Cascade selection when parentCategories loads
  useEffect(() => {
    if (!id && qCatId && parentCategories.length > 0) {
      setValue('categoryId', qCatId);
    }
  }, [id, qCatId, parentCategories, setValue]);

  // Cascade selection when subCategoriesForParent loads
  useEffect(() => {
    if (!id && qSubCatId && subCategoriesForParent.length > 0) {
      setValue('subCategoryId', qSubCatId);
    }
  }, [id, qSubCatId, subCategoriesForParent, setValue]);

  // Cascade selection when subSubCategoriesForParent loads
  useEffect(() => {
    if (!id && qSubSubCatId && subSubCategoriesForParent.length > 0) {
      setValue('subSubCategoryId', qSubSubCatId);
    }
  }, [id, qSubSubCatId, subSubCategoriesForParent, setValue]);

  // Fetch sub-categories dynamically when categoryId changes
  useEffect(() => {
    if (selectedCategoryId) {
      api.get(`/admin/categories?type=SubCategory&categoryId=${selectedCategoryId}&limit=1000`)
        .then((res) => {
          const items = res.data.items || [];
          setSubCategoriesForParent(items);
          if (qSubCatId) {
            setValue('subCategoryId', qSubCatId);
          }
        })
        .catch((err) => console.error('Failed to load subcategories for parent:', err));
    } else {
      setSubCategoriesForParent([]);
    }
  }, [selectedCategoryId, qSubCatId, setValue]);

  // Fetch sub-sub-categories dynamically when subCategoryId changes
  useEffect(() => {
    if (selectedSubCategoryId) {
      api.get(`/admin/categories?type=SubSubCategory&subCategoryId=${selectedSubCategoryId}&limit=1000`)
        .then((res) => {
          const items = res.data.items || [];
          setSubSubCategoriesForParent(items);
          if (qSubSubCatId) {
            setValue('subSubCategoryId', qSubSubCatId);
          }
        })
        .catch((err) => console.error('Failed to load sub-sub-categories for parent:', err));
    } else {
      setSubSubCategoriesForParent([]);
    }
  }, [selectedSubCategoryId, qSubSubCatId, setValue]);

  useEffect(() => {
    api.get('/admin/categories?type=Category&limit=1000')
      .then((res) => {
        const items = res.data.items || res.data || [];
        setParentCategories(items);
        if (qCatId) {
          setValue('categoryId', qCatId);
        }
      })
      .catch((err) => {
        console.error('Failed to load parent categories:', err);
      });

    api.get('/shapes')
      .then((res) => {
        const shapesList = res.data.map((s: any) => s.name);
        const finalShapes = shapesList.length > 0 ? shapesList : ['Round', 'Rectangle', 'Aviator', 'Square', 'Cat Eye', 'Geometric'];
        setAvailableShapes(finalShapes);
        if (!id) {
          setValue('modalShapes', finalShapes);
        }
      })
      .catch((err) => {
        console.error('Failed to load active shapes:', err);
        const fallback = ['Round', 'Rectangle', 'Aviator', 'Square', 'Cat Eye', 'Geometric'];
        setAvailableShapes(fallback);
        if (!id) {
          setValue('modalShapes', fallback);
        }
      });

    api.get('/kids-age-groups')
      .then((res) => {
        const titles = res.data.map((g: any) => g.title);
        setAvailableKidsAgeGroups(titles.length > 0 ? titles : ['Kids On Sale', 'Juniors', 'Tweens', 'Teens']);
      })
      .catch(() => {
        setAvailableKidsAgeGroups(['Kids On Sale', 'Juniors', 'Tweens', 'Teens']);
      });
  }, [id, setValue]);




  // Accordion active sections state
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const isCategory = paramType ? paramType === 'Category' : formValues.type === 'Category';
  const isSubCategory = paramType ? (paramType === 'SubCategory' || paramType === 'SubSubCategory' || paramType === 'SubSubSubCategory') : (formValues.type === 'SubCategory' || formValues.type === 'SubSubCategory' || formValues.type === 'SubSubSubCategory');
  const isSubSubCategory = paramType ? (paramType === 'SubSubCategory' || paramType === 'SubSubSubCategory') : (formValues.type === 'SubSubCategory' || formValues.type === 'SubSubSubCategory');
  const isSubSubSubCategory = paramType ? paramType === 'SubSubSubCategory' : formValues.type === 'SubSubSubCategory';

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
            type: category.type || category.targetType || (paramType === 'SubSubSubCategory' ? 'SubSubSubCategory' : paramType === 'SubSubCategory' ? 'SubSubCategory' : paramType === 'SubCategory' ? 'SubCategory' : 'Category'),
            name: category.name || '',
            code: category.code || '',
            icon: category.icon || '',
            bannerImage: category.bannerImage || '',
            description: category.description || '',
            displayOrder: category.displayOrder || 0,
            startingPrice: category.startingPrice ?? 999,
            status: category.status || 'Active',
            categoryId: (category.categoryId && typeof category.categoryId === 'object' ? category.categoryId._id : category.categoryId) || '',
            subCategoryId: (category.subCategoryId && typeof category.subCategoryId === 'object' ? category.subCategoryId._id : category.subCategoryId) || '',
            subSubCategoryId: (category.subSubCategoryId && typeof category.subSubCategoryId === 'object' ? category.subSubCategoryId._id : category.subSubCategoryId) || '',
            linkTo: category.linkTo || '',
            gender: category.gender || '',
            shapeModal: category.shapeModal || false,
            modalShapes: category.modalShapes || ['Round', 'Rectangle', 'Aviator', 'Square', 'Cat Eye', 'Geometric'],
            subCategoryShape: category.subCategoryShape || 'square',
            subCategorySize: category.subCategorySize || 'medium',
            subCategoryColumns: category.subCategoryColumns || 4,
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
            showInNavbar: category.showInNavbar ?? true,
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

  const [uploadingBanner, setUploadingBanner] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploadingBanner(true);
    try {
      const res = await api.post('/admin/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setValue('bannerImage', res.data.url);
      showToast('Image uploaded successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to upload image.', 'error');
    } finally {
      setUploadingBanner(false);
    }
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
          startingPrice: data.startingPrice,
          status: data.status,
          slug: data.slug,
          showInNavbar: (data.type === 'Category' || paramType === 'Category') ? data.showInNavbar : undefined,
          linkTo: (data.type === 'SubCategory' || data.type === 'SubSubCategory' || paramType === 'SubCategory' || paramType === 'SubSubCategory') ? data.linkTo : undefined,
          gender: (data.type === 'SubCategory' || data.type === 'SubSubCategory' || paramType === 'SubCategory' || paramType === 'SubSubCategory') ? data.gender : undefined,
          shapeModal: (data.type === 'SubCategory' || paramType === 'SubCategory') ? data.shapeModal : undefined,
          modalShapes: (data.type === 'SubCategory' || paramType === 'SubCategory') ? data.modalShapes : undefined,
          subCategoryShape: (data.type === 'Category' || paramType === 'Category') ? data.subCategoryShape : undefined,
          subCategorySize: (data.type === 'Category' || paramType === 'Category') ? data.subCategorySize : undefined,
          subCategoryColumns: (data.type === 'Category' || paramType === 'Category') ? data.subCategoryColumns : undefined,
        },
        hierarchy: {
          categoryId: (data.type === 'SubCategory' || data.type === 'SubSubCategory' || data.type === 'SubSubSubCategory' || paramType === 'SubCategory' || paramType === 'SubSubCategory' || paramType === 'SubSubSubCategory') ? data.categoryId : undefined,
          subCategoryId: (data.type === 'SubSubCategory' || data.type === 'SubSubSubCategory' || paramType === 'SubSubCategory' || paramType === 'SubSubSubCategory') ? data.subCategoryId : undefined,
          subSubCategoryId: (data.type === 'SubSubSubCategory' || paramType === 'SubSubSubCategory') ? data.subSubCategoryId : undefined,
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
            {id ? `Edit ${formValues.name || 'Segment'}` : 'Add Catalog Segment'}
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

              {/* Segment Type Selection */}
              <div>
                <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Segment Type</label>
                <select
                  {...register('type')}
                  disabled={!!id}
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none disabled:opacity-50"
                >
                  <option value="Category">Main Category</option>
                  <option value="SubCategory">Sub-Category</option>
                  <option value="SubSubCategory">Sub-Sub-Category</option>
                  <option value="SubSubSubCategory">Sub-Sub-Sub-Category</option>
                </select>
              </div>

              {/* Parent Category selection (Shown for SubCategory, SubSubCategory, SubSubSubCategory) */}
              {isSubCategory && (
                <div>
                  <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Parent Category *</label>
                  <select
                    {...register('categoryId')}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  >
                    <option value="">-- Select Parent Category --</option>
                    {parentCategories.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && <p className="text-[#FF4444] text-[10px] mt-1 font-semibold">{errors.categoryId.message}</p>}
                </div>
              )}

              {/* Parent Sub-Category selection (Shown for SubSubCategory and SubSubSubCategory) */}
              {isSubSubCategory && (
                <div>
                  <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Parent Sub-Category *</label>
                  <select
                    {...register('subCategoryId')}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  >
                    <option value="">-- Select Parent Sub-Category --</option>
                    {subCategoriesForParent.map((sub) => (
                      <option key={sub._id || sub.id} value={sub._id || sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                  {errors.subCategoryId && <p className="text-[#FF4444] text-[10px] mt-1 font-semibold">{errors.subCategoryId.message}</p>}
                </div>
              )}

              {/* Parent Sub-Sub-Category selection (Shown for SubSubSubCategory) */}
              {isSubSubSubCategory && (
                <div>
                  <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Parent Sub-Sub-Category *</label>
                  <select
                    {...register('subSubCategoryId')}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  >
                    <option value="">-- Select Parent Sub-Sub-Category --</option>
                    {subSubCategoriesForParent.map((ss) => (
                      <option key={ss._id || ss.id} value={ss._id || ss.id}>
                        {ss.name}
                      </option>
                    ))}
                  </select>
                  {errors.subSubCategoryId && <p className="text-[#FF4444] text-[10px] mt-1 font-semibold">{errors.subSubCategoryId.message}</p>}
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

              {/* Banner Image Upload (Hidden for SubSubSubCategory) */}
              {!isSubSubSubCategory && (
                <div>
                  <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5 font-semibold">Banner Image</label>
                  {formValues.bannerImage ? (
                    <div className="flex items-center gap-4 bg-[#0B0B0C] border border-[#2A2A2D] p-3 rounded-xl">
                      <img
                        src={formValues.bannerImage}
                        alt="Banner Preview"
                        className="w-20 h-10 object-cover rounded border border-[#2A2A2D]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate font-mono">{formValues.bannerImage}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setValue('bannerImage', '')}
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
                        id="bannerImageUpload"
                        onChange={handleImageUpload}
                        disabled={uploadingBanner}
                        className="hidden"
                      />
                      <label
                        htmlFor="bannerImageUpload"
                        className="flex flex-col items-center justify-center border-2 border-dashed border-[#2A2A2D] hover:border-[#D4A04D]/60 rounded-xl p-6 cursor-pointer bg-[#0B0B0C]/40 transition-colors"
                      >
                        <span className="text-xl mb-1">📤</span>
                        <span className="text-xs font-bold text-gray-400">
                          {uploadingBanner ? 'Uploading image...' : 'Click to upload category banner'}
                        </span>
                        <span className="text-[9px] text-gray-600 mt-1">PNG, JPG, WEBP up to 5MB</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Status, Display Sort Order & Starting Price */}
              <div className={`grid grid-cols-1 ${!isSubSubSubCategory ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-5`}>
                <div>
                  <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Display Sort Order</label>
                  <input
                    type="number"
                    {...register('displayOrder', { valueAsNumber: true })}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>

                {!isSubSubSubCategory && (
                  <div>
                    <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Starting Price (₹)</label>
                    <input
                      type="number"
                      {...register('startingPrice', { valueAsNumber: true })}
                      placeholder="999"
                      className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5 font-semibold">Status</label>
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

              {/* Show in Nav Bar Toggle */}
              {!isSubCategory && (
                <div className="flex items-center justify-between bg-[#0B0B0C] border border-[#2A2A2D] p-4 rounded-xl">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-white text-xs font-bold uppercase tracking-wider block">Show in Navigation Bar</label>
                    <p className="text-[10px] text-[#A7A7A7]">Toggle whether this main category is displayed in the public header navigation bar.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      {...register('showInNavbar')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-400 peer-checked:after:bg-[#D4A04D] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4A04D]/10 peer-checked:border-[#D4A04D]/35 border border-zinc-700"></div>
                  </label>
                </div>
              )}

              {/* Sub-Category Specific Fields */}
              {isSubCategory && (
                <div className="border-t border-[#2A2A2D] pt-6 space-y-6">
                  <h3 className="text-white text-xs font-extrabold uppercase tracking-wider text-[#D4A04D]">Sub-Category Navigation Settings</h3>
                  
                  {/* LinkTo */}
                  <div>
                    <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Link Destination Override (Optional)</label>
                    <input
                      type="text"
                      {...register('linkTo')}
                      placeholder="e.g. /products?category=contact-lenses"
                      className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                    />
                    <p className="text-[9px] text-gray-500 mt-1">If left blank, it will automatically link to this subcategory list page.</p>
                  </div>

                  {/* Gender and shape modal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Gender Filter</label>
                      <select
                        {...register('gender')}
                        className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                      >
                        <option value="">None (No filter)</option>
                        <option value="men">Men</option>
                        <option value="women">Women</option>
                        <option value="kids">Kids</option>
                        <option value="unisex">Unisex</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-[#F2F2F2]">
                        <input
                          type="checkbox"
                          {...register('shapeModal')}
                          className="rounded border-[#2A2A2D] bg-[#0B0B0C] text-[#D4A04D] focus:ring-[#D4A04D]"
                        />
                        <span>Show selection modal on click</span>
                      </label>
                    </div>

                    {/* Shapes & Kids Age Groups Selection in Modal */}
                    {formValues.shapeModal && (
                      <div className="space-y-5 pt-3 col-span-1 md:col-span-2 border-t border-[#2A2A2D]">
                        
                        {/* Section 1: Shapes Selection */}
                        <div className="space-y-2">
                          <label className="text-[#D4A04D] text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                            <span>👓</span> SHAPES TO DISPLAY IN MODAL
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#0B0B0C] border border-[#2A2A2D] p-4 rounded-xl">
                            {availableShapes.map((shape) => {
                              const currentShapes = formValues.modalShapes || [];
                              const isChecked = currentShapes.includes(shape);
                              return (
                                <label key={shape} className="flex items-center gap-2 cursor-pointer text-xs text-white hover:text-[#D4A04D] transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setValue('modalShapes', [...currentShapes, shape]);
                                      } else {
                                        setValue('modalShapes', currentShapes.filter((s) => s !== shape));
                                      }
                                    }}
                                    className="rounded border-[#2A2A2D] bg-[#121213] text-[#D4A04D] focus:ring-[#D4A04D]"
                                  />
                                  <span>{shape}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Section 2: Kids Age Groups Selection */}
                        <div className="space-y-2 pt-1">
                          <label className="text-[#D4A04D] text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                            <span>🧒</span> KIDS AGE GROUPS TO DISPLAY IN MODAL
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#0B0B0C] border border-[#2A2A2D] p-4 rounded-xl">
                            {(availableKidsAgeGroups.length > 0
                              ? availableKidsAgeGroups
                              : ['Kids On Sale', 'Juniors', 'Tweens', 'Teens']
                            ).map((groupTitle) => {
                              const currentAgeGroups = formValues.modalAgeGroups || ['Kids On Sale', 'Juniors', 'Tweens', 'Teens'];
                              const isChecked = currentAgeGroups.includes(groupTitle);
                              return (
                                <label key={groupTitle} className="flex items-center gap-2 cursor-pointer text-xs text-white hover:text-[#D4A04D] transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setValue('modalAgeGroups', [...currentAgeGroups, groupTitle]);
                                      } else {
                                        setValue('modalAgeGroups', currentAgeGroups.filter((g) => g !== groupTitle));
                                      }
                                    }}
                                    className="rounded border-[#2A2A2D] bg-[#121213] text-[#D4A04D] focus:ring-[#D4A04D]"
                                  />
                                  <span>{groupTitle}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Main Category Display Layout Settings */}
              {!isSubCategory && (
                <div className="border-t border-[#2A2A2D] pt-6 space-y-6">
                  <h3 className="text-[#D4A04D] text-xs font-black uppercase tracking-wider">Sub-Category Layout Design</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Display Shape */}
                    <div>
                      <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Display Shape</label>
                      <select
                        {...register('subCategoryShape')}
                        className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                      >
                        <option value="square">Square Card</option>
                        <option value="circle">Circular Card</option>
                        <option value="rectangle">Horizontal Rectangle</option>
                      </select>
                    </div>

                    {/* Box Size */}
                    <div>
                      <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Box / Card Size</label>
                      <select
                        {...register('subCategorySize')}
                        className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium (Standard)</option>
                        <option value="large">Large</option>
                      </select>
                    </div>

                    {/* Columns */}
                    <div>
                      <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Grid Column Count</label>
                      <select
                        {...register('subCategoryColumns', { valueAsNumber: true })}
                        className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                      >
                        <option value={2}>2 Columns</option>
                        <option value={3}>3 Columns</option>
                        <option value={4}>4 Columns</option>
                        <option value={5}>5 Columns</option>
                        <option value={6}>6 Columns</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
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



              {/* Dynamic Stats Grid */}
              <div className="grid grid-cols-1 gap-3 pt-2">
                <div className="bg-[#18181A] p-2.5 rounded-xl border border-zinc-900 text-center">
                  <span className="text-zinc-500 text-[8px] font-black uppercase tracking-wider block">Display Order</span>
                  <span className="text-white text-sm font-extrabold mt-0.5 block">#{formValues.displayOrder || '0'}</span>
                </div>
              </div>

            </div>

            {/* Live Subcategory Layout Preview */}
            {!isSubCategory && (
              <div className="p-5 border-t border-[#2A2A2D] space-y-4">
                <span className="text-[#D4A04D] text-[9px] font-black uppercase tracking-widest block">Sub-Category Layout Preview</span>
                <div 
                  className="grid gap-3 w-full"
                  style={{
                    gridTemplateColumns: `repeat(${formValues.subCategoryColumns || 4}, minmax(0, 1fr))`
                  }}
                >
                  {[
                    { label: 'Men', img: '/images/men_eyeglasses.png' },
                    { label: 'Women', img: '/images/women_eyeglasses.png' },
                    { label: 'Kids', img: '/images/kids_eyeglasses.png' },
                    { label: 'Accessories', img: '/images/accessories.png' },
                    { label: 'Lenses', img: '/images/cat_contacts.png' },
                    { label: 'Premium', img: '/images/hero_model.png' }
                  ].slice(0, Math.max(formValues.subCategoryColumns || 4, 4)).map((sub, idx) => {
                    // Determine shape classes
                    let shapeClass = 'aspect-square rounded-2xl'; // square
                    if (formValues.subCategoryShape === 'circle') {
                      shapeClass = 'aspect-square rounded-full';
                    } else if (formValues.subCategoryShape === 'rectangle') {
                      shapeClass = 'aspect-[4/3] rounded-2xl';
                    }

                    // Determine size styling classes
                    let sizeClass = 'text-[9px] py-1 px-1';
                    if (formValues.subCategorySize === 'small') {
                      sizeClass = 'text-[7px] py-0.5 px-0.5';
                    } else if (formValues.subCategorySize === 'large') {
                      sizeClass = 'text-[11px] py-2 px-2';
                    }

                    return (
                      <div 
                        key={idx}
                        className={`relative bg-gradient-to-b from-[#18181A] to-[#0D0D0E] border border-zinc-800/80 overflow-hidden shadow-sm flex flex-col justify-end text-center ${shapeClass}`}
                      >
                        {/* Mock image container or background */}
                        <div className="absolute inset-0 bg-[#2A2A2D] flex items-center justify-center opacity-40">
                          <span className="text-lg">🕶️</span>
                        </div>
                        {/* Text Overlay */}
                        <div className="relative z-10 bg-gradient-to-t from-black via-black/85 to-transparent pt-4 pb-1.5 px-1.5 flex flex-col items-center">
                          <span className={`font-black text-white uppercase tracking-wider leading-none ${sizeClass}`}>
                            {sub.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>

      </main>
    </div>
  );
}
