import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../lib/api';
import { CATEGORY_LEVEL } from './categories/levelLabels';



// ----------------------------------------------------
// ZOD VALIDATION SCHEMA
// ----------------------------------------------------
const wizardSchema = z.object({
  sku: z.string().optional(),
  barcode: z.string().optional(),
  name: z.string().min(3, 'Product Name must be at least 3 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  brand: z.string().optional(),
  brandId: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  categoryId: z.string().optional(),
  subCategory: z.string().optional(),
  subCategoryId: z.string().optional(),
  subSubCategory: z.string().optional(),
  subSubCategoryId: z.string().optional(),
  subSubSubCategory: z.string().optional(),
  subSubSubCategoryId: z.string().optional(),
  gender: z.array(z.string()).default([]),
  shape: z.array(z.string()).default([]),
  sellAsFrame: z.boolean().default(true),
  sellWithLens: z.boolean().default(true),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  tags: z.string().optional(),
  launchDate: z.string().optional(),
  sortOrder: z.number().default(0),
  status: z.enum(['Draft', 'Active', 'Inactive', 'Scheduled']),
  tier: z.enum(['Essential', 'Premium', 'Sale', 'None']).default('None'),
  isBestseller: z.boolean().default(false),
  isPremium: z.boolean().default(false),
  isLensSolution: z.boolean().default(false),
  linkedSolutions: z.array(z.object({
    solutionId: z.string(),
    discountPercent: z.number().optional(),
    overridePrice: z.number().optional()
  })).optional(),
  offerBadgesText: z.string().optional(),

  // Pricing
  costPrice: z.number().min(0, 'Cost price must be non-negative'),
  mrp: z.number().min(1, 'MRP must be at least 1'),
  sellingPrice: z.number().min(1, 'Selling price must be at least 1'),
  gstPercent: z.number().min(0).max(100).default(18),
  discountType: z.enum(['Percentage', 'Fixed Amount', 'None']).default('None'),
  discountValue: z.union([z.number(), z.null()]).transform((val) => val ?? 0),
  taxInclusive: z.boolean().default(true),
  currency: z.string().default('INR'),

  // Member Pricing
  enableMemberPricing: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  memberPrices: z.object({
    regularPrice: z.number().optional(),
    goldMemberPrice: z.number().optional(),
    platinumMemberPrice: z.number().optional(),
    corporateMemberPrice: z.number().optional(),
    studentMemberPrice: z.number().optional(),
    employeePrice: z.number().optional(),
    cashbackPercent: z.number().default(0),
    rewardPoints: z.number().default(0),
  }).optional(),
  memberExclusiveProduct: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),

  // Specifications
  frameType: z.enum(['Full Rim', 'Half Rim', 'Rimless']).default('Full Rim'),
  frameShape: z.string().default('Rectangle'),
  material: z.enum(['Metal', 'Titanium', 'TR90', 'Acetate', 'Plastic']).default('TR90'),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  frameWeight: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  manufacturer: z.string().optional(),
  warranty: z.string().optional(),
  returnPolicy: z.string().optional(),
  deliveryInfo: z.string().optional(),

  // Measurements
  lensWidth: z.number().optional(),
  bridgeWidth: z.number().optional(),
  templeLength: z.number().optional(),
  frameWidth: z.number().optional(),
  frameHeight: z.number().optional(),
  pdCompatibility: z.string().optional(),
  frameSize: z.enum(['Small', 'Medium', 'Large']).default('Medium'),
  availableSizes: z.array(z.enum(['Small', 'Medium', 'Large'])).default(['Small', 'Medium', 'Large']),
  sizeMeasurements: z.any().optional(),
  faceShapeCompatibility: z.array(z.string()).default([]),
  kidsAgeGroups: z.array(z.string()).default([]),

  // Lenses compatibility
  lensTypes: z.array(z.string()).default([]),
  compatibleLensTypes: z.array(z.string()).default([]),
  dynamicLensPricing: z.array(z.object({
    lensName: z.string(),
    lensCategory: z.string(),
    regularPrice: z.number(),
    goldPrice: z.number(),
    platinumPrice: z.number(),
    priority: z.number().default(0),
    status: z.enum(['Active', 'Inactive']).default('Active'),
    minSph: z.number().optional(),
    maxSph: z.number().optional(),
    minCyl: z.number().optional(),
    maxCyl: z.number().optional()
  })).default([]),

  // Thickness
  thicknessPricing: z.array(z.object({
    thickness: z.string(),
    regularPrice: z.number(),
    goldPrice: z.number(),
    platinumPrice: z.number()
  })).default([]),

  // Coatings
  coatingPricing: z.array(z.object({
    coatingName: z.string(),
    regularPrice: z.number(),
    memberPrice: z.number(),
    description: z.string().optional(),
    isActive: z.boolean().default(true)
  })).default([]),

  // Offers
  eligibleForGold: z.boolean().default(true),
  eligibleForPlatinum: z.boolean().default(true),
  buy1Get1: z.boolean().default(false),
  oneRupeeFrameOffer: z.boolean().default(false),
  couponEligible: z.boolean().default(true),
  rewardEligible: z.boolean().default(true),
  familySharing: z.boolean().default(false),
  exclusiveProduct: z.boolean().default(false),
  oneRupeeOfferConditions: z.object({
    membershipRequired: z.boolean().default(false),
    premiumLensRequired: z.boolean().default(false),
    minCartValue: z.number().default(0),
    campaignStartDate: z.string().optional(),
    campaignEndDate: z.string().optional(),
    maxUsage: z.number().optional()
  }).optional(),

  // Variants
  variants: z.array(z.object({
    name: z.string(),
    color: z.string(),
    sku: z.string(),
    stock: z.number(),
    priceOverride: z.number().optional(),
    status: z.enum(['Draft', 'Active', 'Inactive', 'Scheduled']),
    images: z.array(z.string()),
    priority: z.number().default(0)
  })).default([]),

  // Shipping
  shippingWeight: z.number().optional(),
  shippingLength: z.number().optional(),
  shippingWidth: z.number().optional(),
  shippingHeight: z.number().optional(),
  packageType: z.string().optional(),
  fragile: z.boolean().default(false),
  estimatedDeliveryDays: z.number().default(5),

  // Media
  thumbnail: z.string().optional(),
  frontView: z.string().optional(),
  leftView: z.string().optional(),
  rightView: z.string().optional(),
  topView: z.string().optional(),
  threeSixtyImages: z.array(z.string()).default([]),
  lifestyleImages: z.array(z.string()).default([]),
  productVideo: z.string().optional(),
  threeDModel: z.string().optional(),
  arModel: z.string().optional(),

  // SEO
  seoKeywords: z.string().optional(),
  canonicalUrl: z.string().optional(),
  openGraphTitle: z.string().optional(),
  openGraphDescription: z.string().optional(),
  schemaMarkup: z.string().optional(),
  imageAltText: z.string().optional(),

  // Warehouse Inventory
  warehouseInventory: z.array(z.object({
    warehouseId: z.string(),
    warehouseName: z.string(),
    availableStock: z.number().default(0),
    reservedStock: z.number().default(0),
    safetyStock: z.number().default(5),
    lowStockAlert: z.number().default(10),
    reorderLevel: z.number().default(20),
    barcode: z.string().optional(),
    qrCode: z.string().optional()
  })).default([]),

  // Contact Lenses & Special Powers
  readingPowers: z.array(z.string()).default([]),
  contactDisposableType: z.string().optional(),
  lensMaterial: z.string().optional(),
  waterContent: z.string().optional(),
  baseCurve: z.string().optional(),
  diameter: z.string().optional(),
  packaging: z.string().optional(),
  powerRange: z.string().optional(),
  lensUsage: z.string().optional(),
  contactPowers: z.array(z.object({
    power: z.string(),
    price: z.number()
  })).default([]),
  contactPackOptions: z.array(z.object({
    packName: z.string(),
    price: z.number(),
    originalPrice: z.number().optional(),
    lensesPerBox: z.number().optional()
  })).default([]),
  contactPackGroupId: z.string().optional(),
  packName: z.string().optional(),
  lensesPerBox: z.preprocess(
    (val) => (val === '' || val === null || val === undefined || Number.isNaN(Number(val)) ? undefined : Number(val)),
    z.number().optional()
  ),
  solutionVariants: z.array(z.object({
    volume: z.string(),
    price: z.number(),
    originalPrice: z.number().optional()
  })).default([])
});

type ContactPackDraft = {
  packName: string;
  price: number;
  originalPrice?: number;
  lensesPerBox?: number;
};

type LinkedContactPack = ContactPackDraft & {
  _id: string;
  sku?: string;
  status?: string;
};

interface MultiSelectDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = 'Select...'
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(val => val !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const displayText = selectedValues.length > 0
    ? options
        .filter(opt => selectedValues.includes(opt.value))
        .map(opt => opt.label)
        .join(', ')
    : placeholder;

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm text-left focus:border-[#D4A04D] focus:outline-none font-bold flex justify-between items-center transition-colors"
      >
        <span className="truncate">{displayText}</span>
        <span className="text-gray-500 text-xs">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl shadow-2xl max-h-60 overflow-y-auto py-1">
          {options.map(opt => {
            const isChecked = selectedValues.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex items-center gap-3 px-4 py-2 hover:bg-[#18181A] cursor-pointer text-xs font-bold text-gray-300 hover:text-white select-none transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggle(opt.value)}
                  className="accent-[#D4A04D] w-3.5 h-3.5 rounded cursor-pointer border-[#2A2A2D] bg-[#0B0B0C]"
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Default blank values
const defaultValues: WizardFormData = {
  sku: '',
  barcode: '',
  name: '',
  slug: '',
  brand: 'eyeglaze',
  brandId: '',
  category: 'eyeglasses',
  categoryId: '',
  subCategory: '',
  subCategoryId: '',
  subSubCategory: '',
  subSubCategoryId: '',
  gender: ['men', 'women'],
  shape: [],
  shortDescription: '',
  longDescription: '',
  tags: '',
  launchDate: '',
  sortOrder: 0,
  status: 'Draft',
  tier: 'None',
  isBestseller: false,
  isPremium: false,
  isLensSolution: false,
  linkedSolutions: [],
  offerBadgesText: '',

  costPrice: 0,
  mrp: 999,
  sellingPrice: 999,
  gstPercent: 18,
  discountType: 'None',
  discountValue: 0,
  taxInclusive: true,
  currency: 'INR',

  enableMemberPricing: false,
  memberPrices: {
    regularPrice: 999,
    goldMemberPrice: 899,
    platinumMemberPrice: 799,
    corporateMemberPrice: 850,
    studentMemberPrice: 790,
    employeePrice: 699,
    cashbackPercent: 0,
    rewardPoints: 0,
  },
  memberExclusiveProduct: false,

  frameType: 'Full Rim',
  frameShape: 'Rectangle',
  material: 'TR90',
  primaryColor: 'Black',
  secondaryColor: '',
  frameWeight: '12g',
  countryOfOrigin: 'India',
  manufacturer: 'EyeGlaze Ltd',
  warranty: '1 Year Warranty',
  returnPolicy: '14-Day Returnable',
  deliveryInfo: '5-7 Days Delivery',

  lensMaterial: 'Silicone Hydrogel',
  waterContent: '58% Water',
  baseCurve: '8.6 mm',
  diameter: '14.2 mm',
  packaging: '10 Lenses/box',
  powerRange: '-0.50 D to -10.00 D',
  lensUsage: 'Single Vision',

  lensWidth: 50,
  bridgeWidth: 18,
  templeLength: 140,
  frameWidth: 138,
  frameSize: 'Medium',
  availableSizes: ['Small', 'Medium', 'Large'],
  kidsAgeGroups: [],
  sizeMeasurements: {
    Small: { lensWidth: 48, bridgeWidth: 17, templeLength: 135, frameWidth: 132 },
    Medium: { lensWidth: 50, bridgeWidth: 18, templeLength: 140, frameWidth: 138 },
    Large: { lensWidth: 52, bridgeWidth: 19, templeLength: 145, frameWidth: 144 },
  },
  faceShapeCompatibility: ['Oval', 'Round'],

  lensTypes: [],
  compatibleLensTypes: ['Zero Power', 'Single Vision', 'Progressive'],
  dynamicLensPricing: [
    { lensName: 'Premium Clear Lens', lensCategory: 'Single Vision', regularPrice: 1500, goldPrice: 1200, platinumPrice: 1000, priority: 1, status: 'Active' },
    { lensName: 'Elite Progressive Lens', lensCategory: 'Progressive', regularPrice: 3500, goldPrice: 3000, platinumPrice: 2800, priority: 2, status: 'Active' },
  ],

  thicknessPricing: [
    { thickness: '1.50', regularPrice: 0, goldPrice: 0, platinumPrice: 0 },
    { thickness: '1.56', regularPrice: 500, goldPrice: 400, platinumPrice: 300 },
    { thickness: '1.59', regularPrice: 1200, goldPrice: 1000, platinumPrice: 800 },
    { thickness: '1.67', regularPrice: 2000, goldPrice: 1800, platinumPrice: 1500 },
    { thickness: '1.74', regularPrice: 3500, goldPrice: 3200, platinumPrice: 3000 },
  ],

  coatingPricing: [
    { coatingName: 'Blue Cut', regularPrice: 800, memberPrice: 600, description: 'Blocks harmful blue light from digital screens', isActive: true },
    { coatingName: 'Anti Glare', regularPrice: 500, memberPrice: 400, description: 'Reduces reflections and glare', isActive: true },
    { coatingName: 'UV Protection', regularPrice: 400, memberPrice: 300, description: 'Shields eyes from sun UVA/UVB rays', isActive: true },
  ],

  eligibleForGold: true,
  eligibleForPlatinum: true,
  buy1Get1: false,
  oneRupeeFrameOffer: false,
  couponEligible: true,
  rewardEligible: true,
  familySharing: false,
  exclusiveProduct: false,
  oneRupeeOfferConditions: {
    membershipRequired: true,
    premiumLensRequired: false,
    minCartValue: 1500,
    campaignStartDate: '',
    campaignEndDate: '',
    maxUsage: 1
  },

  variants: [],

  shippingWeight: 150,
  shippingLength: 15,
  shippingWidth: 8,
  shippingHeight: 6,
  packageType: 'Box',
  fragile: true,
  estimatedDeliveryDays: 4,

  thumbnail: '',
  frontView: '',
  leftView: '',
  rightView: '',
  topView: '',
  threeSixtyImages: [],
  lifestyleImages: [],
  productVideo: '',
  threeDModel: '',
  arModel: '',

  seoKeywords: '',
  canonicalUrl: '',
  openGraphTitle: '',
  openGraphDescription: '',
  schemaMarkup: '',
  imageAltText: '',
  warehouseInventory: [],
  readingPowers: [],
  contactPowers: [],
  contactPackOptions: [],
  contactPackGroupId: '',
  packName: '',
  solutionVariants: [],
  contactDisposableType: '',
  sellAsFrame: true,
  sellWithLens: true
};

// Removed STEPS array

export default function AddProductWizard() {
  const { id } = useParams();
  const navigate = useNavigate();

  
  // Database Metadata
  const [categoryTree, setCategoryTree] = useState<any[]>([]);
  const [availableShapes, setAvailableShapes] = useState<any[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [availableLensTypes, setAvailableLensTypes] = useState<any[]>([]);
  const [lensesMap, setLensesMap] = useState<Record<string, any[]>>({});
  const [loadingLensesMap, setLoadingLensesMap] = useState<Record<string, boolean>>({});
  
  // State for uploads and notifications
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null); // 'cancel' | 'delete' | 'duplicate'
  const [, setAuditLogs] = useState<any[]>([]);
  const [versionHistory, setVersionHistory] = useState<number>(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadedProduct, setLoadedProduct] = useState<any | null>(null);
  const [colorConfigs, setColorConfigs] = useState<Array<{ name: string; hex: string; stock: number }>>([]);
  const [activeLensTypeTab, setActiveLensTypeTab] = useState<string | null>(null);
  const [showAddCustomLensForm, setShowAddCustomLensForm] = useState<string | null>(null);
  const [customLensName, setCustomLensName] = useState('');
  const [customLensPrice, setCustomLensPrice] = useState('');
  const [customLensMinSph, setCustomLensMinSph] = useState('-20');
  const [customLensMaxSph, setCustomLensMaxSph] = useState('20');
  const [customLensMinCyl, setCustomLensMinCyl] = useState('-6');
  const [customLensMaxCyl, setCustomLensMaxCyl] = useState('6');
  const [linkedPackProducts, setLinkedPackProducts] = useState<LinkedContactPack[]>([]);
  const [pendingPackProducts, setPendingPackProducts] = useState<ContactPackDraft[]>([]);
  const [packLinkQuery, setPackLinkQuery] = useState('');
  const [packLinkBusy, setPackLinkBusy] = useState(false);
  const originalLinkedPackIds = useRef<string[]>([]);
  const [solutionVariantConfigs, setSolutionVariantConfigs] = useState<Array<{ volume: string; price: number; originalPrice?: number }>>([]);
  const [availableSolutions, setAvailableSolutions] = useState<Array<{ _id: string; name: string; sku: string; thumbnail?: string; sellingPrice?: number; mrp?: number; price?: { selling?: number; original?: number } }>>([]);

  // Autosave tracking
  const [lastAutoSaved, setLastAutoSaved] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Canvas Image Cropper state
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropTargetField, setCropTargetField] = useState<string | null>(null); // e.g. 'thumbnail', 'frontView' etc.
  const [cropBox, setCropBox] = useState({ x: 50, y: 50, w: 200, h: 200 });
  const [cropDragging, setCropDragging] = useState<'box' | 'resize' | null>(null);
  const cropDragOffset = useRef({ x: 0, y: 0 });
  const cropImageRef = useRef<HTMLImageElement>(null);

  // React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    trigger,
    formState: { errors }
  } = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema) as any,
    defaultValues
  });

  useEffect(() => {
    setValue('solutionVariants', solutionVariantConfigs);
  }, [solutionVariantConfigs, setValue]);

  // Register custom fields manually so react-hook-form/zod includes them in handleSubmit payload
  useEffect(() => {
    register('gender');
    register('shape');
    register('availableSizes');
    register('faceShapeCompatibility');
    register('lensTypes');
    register('compatibleLensTypes');
    register('dynamicLensPricing');
    register('thicknessPricing');
    register('coatingPricing');
    register('readingPowers');
    register('contactPowers');
    register('contactPackOptions');
    register('contactPackGroupId');
    register('packName');
    register('lensesPerBox');
    register('solutionVariants');
    register('linkedSolutions');
    register('contactDisposableType');
    register('sellAsFrame');
    register('sellWithLens');
  }, [register]);





  // Watch fields for calculations
  const formValues = watch();

  const currentCategory = formValues.category;
  const currentSubCategory = formValues.subCategory;
  const currentGender = formValues.gender || [];
  
  const isSunglasses = currentCategory === 'sunglasses';
  const isContactLenses = Boolean(
    currentCategory && (
      currentCategory.toLowerCase() === 'contact-lenses' ||
      currentCategory.toLowerCase() === 'contact-lens' ||
      currentCategory.toLowerCase() === 'contact lens' ||
      /contact.*lens/i.test(currentCategory) ||
      /contact/i.test(currentCategory)
    )
  );
  const isSolutionProduct = Boolean(
    isContactLenses && (
      (/solution/i.test(String(formValues.subSubCategory || '')) && !/accessor/i.test(String(formValues.subSubCategory || ''))) ||
      formValues.isLensSolution
    )
  );
  const isAccessoryProduct = Boolean(
    isContactLenses && /accessor/i.test(String(formValues.subSubCategory || ''))
  );
  const isNonPowerContactProduct = isSolutionProduct || isAccessoryProduct;
  const hideProductLevelPricing = isContactLenses && !isAccessoryProduct;

  useEffect(() => {
    if (!hideProductLevelPricing) return;
    if (!isSolutionProduct) return;

    const volumes = solutionVariantConfigs;
    if (volumes.length === 0) return;

    const cheapest = [...volumes].sort((a, b) => a.price - b.price)[0];
    const selling = Number(cheapest.price) || 0;
    const mrp = Number(cheapest.originalPrice) || selling;
    if (selling <= 0) return;
    if (getValues('sellingPrice') !== selling) {
      setValue('sellingPrice', selling, { shouldValidate: false });
    }
    if (getValues('mrp') !== mrp) {
      setValue('mrp', mrp, { shouldValidate: false });
    }
  }, [
    hideProductLevelPricing,
    isSolutionProduct,
    solutionVariantConfigs,
    getValues,
    setValue,
  ]);

  const isPowerSunglasses = currentCategory === 'power-sunglasses';
  const isReading = String(currentSubCategory || '').toLowerCase().includes('reading');
  const subCatNameOrSlug = currentSubCategory || formValues.subCategoryId || '';

  // The subcategory's own "Shapes to display in modal" list (set on Categories → edit
  // SubCategory) — scopes Step 3's shape checkboxes to just what's relevant for this
  // subcategory instead of every shape in the system.
  const matchedParentForShapes = categoryTree.find(
    (c: any) => c.slug === currentCategory || c.id === currentCategory || c._id === currentCategory ||
      c.id === formValues.categoryId || c._id === formValues.categoryId
  );
  const matchedSubForShapes = (matchedParentForShapes?.children || []).find(
    (s: any) => s.slug === currentSubCategory || s.name === currentSubCategory ||
      s.id === formValues.subCategoryId || s._id === formValues.subCategoryId
  );
  const subCategoryModalShapes: string[] = matchedSubForShapes?.modalShapes || [];
  const isKids =
    (currentGender && Array.isArray(currentGender) && currentGender.some((g: string) => String(g).toLowerCase() === 'kids')) ||
    String(subCatNameOrSlug).toLowerCase().includes('kids') ||
    String(subCatNameOrSlug).toLowerCase().includes('6a608f61f19254d4d7917ba4');


  // Reset selected lensTypes when category changes to prevent saving invalid compatible lens types
  const selectedCategory = formValues.category;
  const prevCategoryRef = useRef<string>('');

  useEffect(() => {
    if (loadingMeta) {
      if (selectedCategory) {
        prevCategoryRef.current = selectedCategory;
      }
      return;
    }
    if (selectedCategory && prevCategoryRef.current && prevCategoryRef.current !== selectedCategory) {
      // Category actually changed, clear selected lensTypes in form state
      setValue('lensTypes', []);
    }
    prevCategoryRef.current = selectedCategory || '';
  }, [selectedCategory, loadingMeta, setValue]);

  // Fetch available lens types when category changes
  useEffect(() => {
    if (loadingMeta) return;

    async function fetchLensTypes() {
      if (!selectedCategory) {
        setAvailableLensTypes([]);
        return;
      }
      try {
        const res = await api.get(`/admin/lens-types?category=${selectedCategory}`);
        setAvailableLensTypes(res.data.lensTypes || []);
      } catch (err) {
        console.error('Failed to fetch lens types for category:', err);
      }
    }
    fetchLensTypes();
  }, [selectedCategory, loadingMeta]);

  // For power-sunglasses (Special Power), force sellWithLens to false and sellAsFrame to true
  useEffect(() => {
    if (isPowerSunglasses) {
      if (formValues.sellWithLens !== false) {
        setValue('sellWithLens', false);
      }
      if (formValues.sellAsFrame !== true) {
        setValue('sellAsFrame', true);
      }
    }
  }, [isPowerSunglasses, formValues.sellWithLens, formValues.sellAsFrame, setValue]);

  // Sync active lens type tab when selected types change
  const watchedLensTypes = formValues.lensTypes || [];
  useEffect(() => {
    if (watchedLensTypes.length > 0) {
      if (!activeLensTypeTab || !watchedLensTypes.includes(activeLensTypeTab)) {
        setActiveLensTypeTab(watchedLensTypes[0]);
      }
    } else {
      setActiveLensTypeTab(null);
    }
  }, [watchedLensTypes, activeLensTypeTab]);



  // Watch for Price Engine
  const mrpValue = watch('mrp') || 0;
  const sellingPriceValue = watch('sellingPrice') || 0;
  const costPriceValue = watch('costPrice') || 0;
  const discountTypeValue = watch('discountType');
  const discountValueField = watch('discountValue') || 0;
  const enableMemberPricingField = watch('enableMemberPricing');

  // Ensure discountValue is never null or undefined
  useEffect(() => {
    if (formValues.discountValue === null || formValues.discountValue === undefined) {
      setValue('discountValue', 0);
    }
  }, [formValues.discountValue, setValue]);

  // Load Metadata & Product (if editing)
  useEffect(() => {
    async function loadData() {
      setLoadingMeta(true);
      try {
        const [treeRes, shapesRes, solutionsRes] = await Promise.all([
          api.get('/admin/categories/tree'),
          api.get('/shapes').catch(() => ({ data: [] })),
          api.get('/admin/products?category=contact-lens&limit=500').catch(() => ({ data: {} }))
        ]);
        setCategoryTree(treeRes.data.tree || []);
        setAvailableSolutions(
          (solutionsRes.data.products || []).filter(
            (p: any) => p.isLensSolution || /solution/i.test(p.subSubCategory || '')
          )
        );
        setAvailableShapes(shapesRes.data.length > 0 ? shapesRes.data : [
          { name: 'Round', slug: 'round' },
          { name: 'Rectangle', slug: 'rectangle' },
          { name: 'Aviator', slug: 'aviator' },
          { name: 'Square', slug: 'square' },
          { name: 'Cat Eye', slug: 'cat-eye' },
          { name: 'Geometric', slug: 'geometric' }
        ]);

        if (id) {
          setIsEditMode(true);
          const prodRes = await api.get(`/admin/products/${id}`);
          const p = prodRes.data.product;
          setLoadedProduct(p);
          
          // Populate Form
          reset({
            ...defaultValues,
            sku: p.sku || '',
            barcode: p.barcode || '',
            name: p.name || '',
            slug: p.slug || '',
            brand: p.brand || 'eyeglaze',
            brandId: p.brandId || '',
            category: p.category || '',
            categoryId: p.categoryId || '',
            subCategory: p.subCategory || '',
            subCategoryId: p.subCategoryId || '',
            subSubCategory: p.subSubCategory || '',
            subSubCategoryId: p.subSubCategoryId || '',
            subSubSubCategory: p.subSubSubCategory || '',
            subSubSubCategoryId: p.subSubSubCategoryId || '',
            gender: p.gender ? (Array.isArray(p.gender) ? p.gender : [p.gender]) : ['men', 'women'],
            shape: p.shape ? (Array.isArray(p.shape) ? p.shape : [p.shape]) : [],
            shortDescription: p.shortDescription || '',
            longDescription: p.longDescription || '',
            tags: p.tags ? p.tags.join(', ') : '',
            launchDate: p.launchDate ? new Date(p.launchDate).toISOString().split('T')[0] : '',
            sortOrder: p.sortOrder || 0,
            status: p.status || 'Draft',
            tier: p.tier || 'None',
            isBestseller: p.isBestseller || false,
            isPremium: p.isPremium || false,
            isLensSolution: p.isLensSolution || false,
            linkedSolutions: Array.isArray(p.linkedSolutions) ? p.linkedSolutions.map((s: any) => ({
              solutionId: typeof s === 'object' ? (s.solutionId?._id || s.solutionId || s._id || s) : s,
              discountPercent: typeof s === 'object' ? s.discountPercent : undefined,
              overridePrice: typeof s === 'object' ? s.overridePrice : undefined,
            })) : [],
            offerBadgesText: p.offerBadges ? p.offerBadges.join(', ') : '',
            
            costPrice: p.costPrice || 0,
            mrp: p.mrp || p.price?.original || 999,
            sellingPrice: p.sellingPrice || p.price?.selling || 999,
            gstPercent: p.gstPercent || 18,
            discountType: p.discountType || 'None',
            discountValue: p.discountValue || 0,
            taxInclusive: p.taxInclusive ?? true,
            currency: p.currency || 'INR',

            enableMemberPricing: p.enableMemberPricing || false,
            memberPrices: p.memberPrices || defaultValues.memberPrices,
            memberExclusiveProduct: p.memberExclusiveProduct || false,

            frameType: p.frameType || p.frame?.type || 'Full Rim',
            frameShape: p.frameShape || p.frame?.shape || 'Rectangle',
            material: p.material || p.frame?.material || 'TR90',
            primaryColor: p.colors && p.colors.length > 0 
              ? p.colors.map((c: any) => c.name).join(', ') 
              : (p.primaryColor || p.frameColor || 'Black'),
            secondaryColor: p.secondaryColor || '',
            frameWeight: p.frameWeight || p.weight || '12g',
            countryOfOrigin: p.countryOfOrigin || 'India',
            manufacturer: p.manufacturer || 'EyeGlaze Ltd',
            warranty: p.warranty || '1 Year Warranty',
            returnPolicy: p.returnPolicy || '14-Day Returnable',
            deliveryInfo: p.deliveryInfo || '5-7 Days Delivery',

            lensMaterial: p.lensMaterial || 'Silicone Hydrogel',
            waterContent: p.waterContent || '58% Water',
            baseCurve: p.baseCurve || '8.6 mm',
            diameter: p.diameter || '14.2 mm',
            packaging: p.packaging || '10 Lenses/box',
            powerRange: p.powerRange || '-0.50 D to -10.00 D',
            lensUsage: p.lensUsage || 'Single Vision',

            lensWidth: p.lensWidth || p.frame?.lensWidth || 50,
            bridgeWidth: p.bridgeWidth || p.frame?.bridgeWidth || 18,
            templeLength: p.templeLength || p.frame?.templeLength || 140,
            frameWidth: p.frameWidth || p.frame?.width || 138,
            frameSize: p.frameSize || 'Medium',
            availableSizes: p.availableSizes || ['Small', 'Medium', 'Large'],
            sizeMeasurements: (() => {
              const map: any = {
                Small: { lensWidth: 48, bridgeWidth: 17, templeLength: 135, frameWidth: 132 },
                Medium: { lensWidth: 50, bridgeWidth: 18, templeLength: 140, frameWidth: 138 },
                Large: { lensWidth: 52, bridgeWidth: 19, templeLength: 145, frameWidth: 144 },
              };
              if (p.sizeMeasurements && Array.isArray(p.sizeMeasurements)) {
                p.sizeMeasurements.forEach((item: any) => {
                  if (item.size) {
                    map[item.size] = {
                      lensWidth: item.lensWidth,
                      bridgeWidth: item.bridgeWidth,
                      templeLength: item.templeLength,
                      frameWidth: item.frameWidth,
                    };
                  }
                });
              }
              return map;
            })(),
            faceShapeCompatibility: p.faceShapeCompatibility || p.faceShapes || [],
            kidsAgeGroups: p.kidsAgeGroups || [],

            readingPowers: p.readingPowers || [],
            contactPowers: p.contactPowers || [],
            contactPackOptions: p.contactPackOptions || [],
            contactPackGroupId: p.contactPackGroupId || '',
            packName: p.packName || p.contactPackOptions?.[0]?.packName || '',
            lensesPerBox: p.lensesPerBox || p.contactPackOptions?.[0]?.lensesPerBox,
            contactDisposableType: p.contactDisposableType || '',

            lensTypes: (p.lensTypes || []).map((t: any) => typeof t === 'object' && t ? t._id : t),
            compatibleLensTypes: p.compatibleLensTypes || p.lensCompatibility || [],
            dynamicLensPricing: p.dynamicLensPricing || [],
            thicknessPricing: p.thicknessPricing || defaultValues.thicknessPricing,
            coatingPricing: p.coatingPricing || defaultValues.coatingPricing,

            eligibleForGold: p.eligibleForGold ?? true,
            eligibleForPlatinum: p.eligibleForPlatinum ?? true,
            buy1Get1: p.buy1Get1 ?? false,
            oneRupeeFrameOffer: p.oneRupeeFrameOffer ?? false,
            couponEligible: p.couponEligible ?? true,
            rewardEligible: p.rewardEligible ?? true,
            familySharing: p.familySharing ?? false,
            exclusiveProduct: p.exclusiveProduct ?? false,
            oneRupeeOfferConditions: p.oneRupeeOfferConditions ? {
              ...p.oneRupeeOfferConditions,
              campaignStartDate: p.oneRupeeOfferConditions.campaignStartDate ? new Date(p.oneRupeeOfferConditions.campaignStartDate).toISOString().split('T')[0] : '',
              campaignEndDate: p.oneRupeeOfferConditions.campaignEndDate ? new Date(p.oneRupeeOfferConditions.campaignEndDate).toISOString().split('T')[0] : '',
            } : defaultValues.oneRupeeOfferConditions,

            variants: prodRes.data.variants || [],
            shippingWeight: p.shippingWeight || 150,
            shippingLength: p.shippingLength || 15,
            shippingWidth: p.shippingWidth || 8,
            shippingHeight: p.shippingHeight || 6,
            packageType: p.packageType || 'Box',
            fragile: p.fragile ?? true,
            estimatedDeliveryDays: p.estimatedDeliveryDays || 4,

            thumbnail: p.thumbnail || p.images?.[0] || '',
            frontView: p.frontView || p.images?.[1] || '',
            leftView: p.leftView || '',
            rightView: p.rightView || '',
            topView: p.topView || '',
            threeSixtyImages: p.threeSixtyImages || [],
            lifestyleImages: p.lifestyleImages || [],
            productVideo: p.productVideo || '',
            threeDModel: p.threeDModel || '',
            arModel: p.arModel || '',

            seoKeywords: p.seoKeywords || '',
            canonicalUrl: p.canonicalUrl || '',
            openGraphTitle: p.openGraphTitle || '',
            openGraphDescription: p.openGraphDescription || '',
            schemaMarkup: p.schemaMarkup || '',
            imageAltText: p.imageAltText || '',
            sellAsFrame: p.sellAsFrame ?? true,
            sellWithLens: p.sellWithLens ?? true
          });

          if (p.solutionVariants && Array.isArray(p.solutionVariants)) {
            setSolutionVariantConfigs(p.solutionVariants);
            setValue('solutionVariants', p.solutionVariants, { shouldValidate: true });
          }
          if (p.contactPowers && Array.isArray(p.contactPowers)) {
            setValue('contactPowers', p.contactPowers, { shouldValidate: true });
          }
          if (p.readingPowers && Array.isArray(p.readingPowers)) {
            setValue('readingPowers', p.readingPowers, { shouldValidate: true });
          }

          const thisPackName = String(p.packName || p.contactPackOptions?.[0]?.packName || '').toLowerCase();
          const siblings = (prodRes.data.contactPackSiblings || []).filter(
            (s: any) => String(s._id) !== String(p._id)
          );
          setLinkedPackProducts(siblings.map((s: any) => ({
            _id: String(s._id),
            sku: s.sku,
            status: s.status,
            packName: s.packName || '',
            price: Number(s.price) || 0,
            originalPrice: s.originalPrice,
            lensesPerBox: s.lensesPerBox,
          })));
          originalLinkedPackIds.current = siblings.map((s: any) => String(s._id));

          const extraOptions = (Array.isArray(p.contactPackOptions) ? p.contactPackOptions : []).filter((opt: any) => {
            const name = String(opt.packName || '').toLowerCase();
            if (!name || name === thisPackName) return false;
            return !siblings.some((s: any) => String(s.packName || '').toLowerCase() === name);
          });
          setPendingPackProducts(extraOptions);
          if (!p.contactPackGroupId) {
            setValue('contactPackGroupId', crypto.randomUUID(), { shouldValidate: false });
          }

          setAuditLogs(prodRes.data.auditLogs || []);
          setVersionHistory(p.currentVersion || 1);
          if (p.colors && p.colors.length > 0) {
            setColorConfigs(p.colors.map((c: any) => ({
              name: c.name,
              hex: c.hex || '#A7A7A7',
              stock: c.stock ?? 50
            })));
          }
        } else {
          // Check LocalStorage Draft
          const draft = localStorage.getItem('eyeglaze_add_product_draft');
          if (draft) {
            try {
              const parsed = JSON.parse(draft);
              if (parsed.gender && !Array.isArray(parsed.gender)) {
                parsed.gender = [parsed.gender];
              }
              if (parsed.shape && !Array.isArray(parsed.shape)) {
                parsed.shape = [parsed.shape];
              }
              reset(parsed);
              showToast('Restored draft from autosave!', 'success');
            } catch (err) {
              console.error('Failed to parse draft', err);
            }
          }
        }
      } catch (err) {
        showToast('Failed to load initial metadata', 'error');
      } finally {
        setLoadingMeta(false);
      }
    }
    loadData();
  }, [id, reset]);

  // Watch for selected lens types to fetch lenses
  useEffect(() => {
    async function fetchLensesForSelectedTypes() {
      const selectedIds = formValues.lensTypes || [];
      const newLensesMap = { ...lensesMap };
      const newLoadingMap = { ...loadingLensesMap };
      
      // Clean up keys no longer selected
      let changed = false;
      Object.keys(newLensesMap).forEach(key => {
        if (!selectedIds.includes(key)) {
          delete newLensesMap[key];
          delete newLoadingMap[key];
          changed = true;
        }
      });

      if (changed) {
        setLensesMap({ ...newLensesMap });
        setLoadingLensesMap({ ...newLoadingMap });
      }

      const promises = selectedIds.map(async (typeId) => {
        if (newLensesMap[typeId]) return; // Already loaded
        newLoadingMap[typeId] = true;
        setLoadingLensesMap(prev => ({ ...prev, [typeId]: true }));
        try {
          const res = await api.get(`/admin/lenses?typeId=${typeId}`);
          setLensesMap(prev => ({ ...prev, [typeId]: res.data.lenses || [] }));
        } catch (err) {
          console.error(`Error fetching lenses for type ${typeId}:`, err);
          setLensesMap(prev => ({ ...prev, [typeId]: [] }));
        } finally {
          setLoadingLensesMap(prev => ({ ...prev, [typeId]: false }));
        }
      });

      await Promise.all(promises);
    }
    fetchLensesForSelectedTypes();
  }, [JSON.stringify(formValues.lensTypes)]);

  // ShowToast helper
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const primaryColorValue = watch('primaryColor');

  useEffect(() => {
    const names = (primaryColorValue || '')
      .split(',')
      .map((c: string) => c.trim())
      .filter(Boolean);

    setColorConfigs(prev => {
      const source = (prev.length === 0 && loadedProduct?.colors?.length > 0)
        ? loadedProduct.colors.map((c: any) => ({ name: c.name, hex: c.hex || '#A7A7A7', stock: c.stock ?? 50 }))
        : prev;

      return names.map(name => {
        const existing = source.find((p: any) => p.name.toLowerCase() === name.toLowerCase());
        if (existing) {
          return { ...existing, name };
        }
        let hex = '#A7A7A7';
        const lowerName = name.toLowerCase();
        if (lowerName === 'black') hex = '#131314';
        else if (lowerName === 'blue') hex = '#1E3A8A';
        else if (lowerName === 'brown') hex = '#5C3D2E';
        else if (lowerName === 'gold') hex = '#D4A04D';
        else if (lowerName === 'silver') hex = '#E5E7EB';
        else if (lowerName === 'pink') hex = '#FBCFE8';
        else if (lowerName === 'red') hex = '#DC2626';
        else if (lowerName === 'green') hex = '#16A34A';
        else if (lowerName === 'transparent') hex = '#FFFFFF';

        return { name, hex, stock: 50 };
      });
    });
  }, [primaryColorValue, loadedProduct]);

  const renderColorStockEditor = () => {
    if (colorConfigs.length === 0) return null;
    return (
      <div className="mt-4 p-5 bg-[#18181A] border border-[#2A2A2D] rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#2A2A2D]/60 pb-2">
          <h4 className="text-[#D4A04D] text-xs font-bold uppercase tracking-wider">Configure Stock & Color Codes</h4>
          <span className="text-[10px] text-gray-400">Total variants: <strong className="text-white">{colorConfigs.length}</strong></span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {colorConfigs.map((cfg, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-[#0B0B0C] border border-[#2A2A2D] p-3.5 rounded-xl hover:border-zinc-800 transition-colors">
              <div className="flex-1">
                <label className="text-gray-400 text-[9px] font-bold uppercase block mb-1">Color: <span className="text-white">{cfg.name}</span></label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={cfg.hex.startsWith('#') && cfg.hex.length === 7 ? cfg.hex : '#A7A7A7'}
                    onChange={(e) => {
                      const updated = [...colorConfigs];
                      updated[idx].hex = e.target.value;
                      setColorConfigs(updated);
                    }}
                    className="w-8 h-8 border-none bg-transparent cursor-pointer rounded-lg"
                  />
                  <input
                    type="text"
                    value={cfg.hex}
                    onChange={(e) => {
                      const updated = [...colorConfigs];
                      updated[idx].hex = e.target.value;
                      setColorConfigs(updated);
                    }}
                    placeholder="#HEX"
                    className="w-24 bg-[#131314] border border-[#2A2A2D] rounded-lg px-2.5 py-1.5 text-white text-xs font-bold focus:border-[#D4A04D] focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="w-28">
                <label className="text-gray-400 text-[9px] font-bold uppercase block mb-1">Stock Quantity</label>
                <input
                  type="number"
                  value={cfg.stock}
                  onChange={(e) => {
                    const updated = [...colorConfigs];
                    updated[idx].stock = Math.max(0, parseInt(e.target.value) || 0);
                    setColorConfigs(updated);
                  }}
                  className="w-full bg-[#131314] border border-[#2A2A2D] rounded-lg px-3 py-1.5 text-white text-xs font-bold focus:border-[#D4A04D] focus:outline-none transition-colors"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Profit Margin calculation
  const profitMargin = sellingPriceValue > 0 ? Math.round(((sellingPriceValue - costPriceValue) / sellingPriceValue) * 100) : 0;

  // Auto slug & SKU generation based on product name
  const nameValue = watch('name');
  useEffect(() => {
    if (nameValue && !isEditMode) {
      const generatedSlug = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setValue('slug', generatedSlug);

      // SKU Auto-generation
      const namePart = nameValue
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 6);
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const generatedSku = `EG-${namePart}-${randomPart}`;
      setValue('sku', generatedSku);
    }
  }, [nameValue, setValue, isEditMode]);

  // Price Calculations Preview
  let finalCalculatedDiscount = 0;
  if (discountTypeValue === 'Percentage') {
    finalCalculatedDiscount = Math.round((mrpValue * discountValueField) / 100);
  } else if (discountTypeValue === 'Fixed Amount') {
    finalCalculatedDiscount = discountValueField;
  }
  const taxValue = Math.round((sellingPriceValue * (watch('gstPercent') || 18)) / 100);
  const calculatedPayable = Math.max(0, sellingPriceValue);

  // 30-Second Auto Save logic
  useEffect(() => {
    if (isEditMode) return; // Don't autosave when editing live products
    const interval = setInterval(() => {
      const currentForm = watch();
      localStorage.setItem('eyeglaze_add_product_draft', JSON.stringify(currentForm));
      const now = new Date().toLocaleTimeString();
      setLastAutoSaved(now);
    }, 30000);
    return () => clearInterval(interval);
  }, [watch, isEditMode]);

  // Removed goToStep function

  // Image Upload handler (S3 Upload)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, targetField: string, isMultiple = false) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadProgress(`Uploading media for ${targetField}...`);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('image', files[i]);
        const res = await api.post('/admin/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrls.push(res.data.url);
      }

      if (isMultiple) {
        const currentArr = (formValues as any)[targetField] || [];
        setValue(targetField as any, [...currentArr, ...uploadedUrls] as any);
      } else {
        setValue(targetField as any, uploadedUrls[0] as any);
      }
      showToast('Media uploaded successfully!', 'success');
    } catch (err) {
      showToast('Media upload failed', 'error');
    } finally {
      setUploadProgress(null);
    }
  };

  // Drag & Drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetField: string, isMultiple = false) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    setUploadProgress(`Uploading dropped media...`);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('image', files[i]);
        const res = await api.post('/admin/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrls.push(res.data.url);
      }

      if (isMultiple) {
        const currentArr = (formValues as any)[targetField] || [];
        setValue(targetField as any, [...currentArr, ...uploadedUrls] as any);
      } else {
        setValue(targetField as any, uploadedUrls[0] as any);
      }
      showToast('Media uploaded successfully!', 'success');
    } catch (err) {
      showToast('Media drop upload failed', 'error');
    } finally {
      setUploadProgress(null);
    }
  };

  // HTML5 Canvas cropping triggers
  const startCropMode = (e: React.ChangeEvent<HTMLInputElement>, targetField: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCropImageSrc(event.target?.result as string);
      setCropTargetField(targetField);
      setCropBox({ x: 50, y: 50, w: 200, h: 200 });
    };
    reader.readAsDataURL(file);
  };

  // Canvas Crop Dragging details
  const handleCropMouseDown = (e: React.MouseEvent, type: 'box' | 'resize') => {
    e.preventDefault();
    setCropDragging(type);
    const rect = cropImageRef.current?.getBoundingClientRect();
    if (!rect) return;
    cropDragOffset.current = {
      x: e.clientX - rect.left - cropBox.x,
      y: e.clientY - rect.top - cropBox.y
    };
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!cropDragging || !cropImageRef.current) return;
    const rect = cropImageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (cropDragging === 'box') {
      const newX = Math.max(0, Math.min(rect.width - cropBox.w, x - cropDragOffset.current.x));
      const newY = Math.max(0, Math.min(rect.height - cropBox.h, y - cropDragOffset.current.y));
      setCropBox(prev => ({ ...prev, x: newX, y: newY }));
    } else if (cropDragging === 'resize') {
      const newW = Math.max(50, Math.min(rect.width - cropBox.x, x - cropBox.x));
      const newH = Math.max(50, Math.min(rect.height - cropBox.y, y - cropBox.y));
      setCropBox(prev => ({ ...prev, w: newW, h: newH }));
    }
  };

  const handleCropMouseUp = () => {
    setCropDragging(null);
  };

  const applyCrop = async () => {
    if (!cropImageRef.current || !cropTargetField) return;
    setUploadProgress('Cropping and uploading...');
    try {
      const canvas = document.createElement('canvas');
      const img = cropImageRef.current;
      
      // Calculate scaling factor between source image natural dimensions and displayed dimensions
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;

      canvas.width = cropBox.w;
      canvas.height = cropBox.h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          img,
          cropBox.x * scaleX,
          cropBox.y * scaleY,
          cropBox.w * scaleX,
          cropBox.h * scaleY,
          0,
          0,
          cropBox.w,
          cropBox.h
        );
      }

      canvas.toBlob(async (blob) => {
        if (!blob) {
          showToast('Cropping failed', 'error');
          setUploadProgress(null);
          return;
        }
        const file = new File([blob], 'cropped_image.jpg', { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.post('/admin/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setValue(cropTargetField as any, res.data.url);
        setCropImageSrc(null);
        setCropTargetField(null);
        setUploadProgress(null);
        showToast('Cropped & Uploaded successfully!', 'success');
      }, 'image/jpeg', 0.85);

    } catch (err) {
      setUploadProgress(null);
      showToast('Failed to apply crop', 'error');
    }
  };

  // Submit Handler
  const onSubmit = async (data: WizardFormData) => {
    setIsSaving(true);
    try {
      // Map tags into array
      const tagsArray = data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
      
      // Handle sizeMeasurements safely
      const safeSizeMeasurements = data.sizeMeasurements || {};
      const sizeMeasurementsArray = Object.entries(safeSizeMeasurements).map(([size, measurements]: any) => ({
        size,
        ...measurements
      })).filter((item: any) => data.availableSizes.includes(item.size));

      const primaryMeasurements = safeSizeMeasurements?.[data.frameSize] || {};

      const compLensTypes: string[] = [];
      const selectedLensTypeNames = (data.lensTypes || []).map(typeId => {
        const typeDetails = availableLensTypes.find(t => t._id === typeId);
        return typeDetails ? typeDetails.name : '';
      });

      selectedLensTypeNames.forEach(name => {
        if (name === 'With Power') {
          if (!compLensTypes.includes('Single Vision')) compLensTypes.push('Single Vision');
          if (!compLensTypes.includes('Progressive')) compLensTypes.push('Progressive');
        } else {
          if (!compLensTypes.includes(name)) compLensTypes.push(name);
        }
      });

      // Build the images array: thumbnail first, then other views, then lifestyle images
      const imagesArray: string[] = [];
      if (data.thumbnail) imagesArray.push(data.thumbnail);
      if (data.frontView) imagesArray.push(data.frontView);
      if (data.leftView) imagesArray.push(data.leftView);
      if (data.rightView) imagesArray.push(data.rightView);
      if (data.topView) imagesArray.push(data.topView);
      if (data.lifestyleImages && data.lifestyleImages.length > 0) {
        imagesArray.push(...data.lifestyleImages);
      }
      // If no images, add at least one placeholder
      if (imagesArray.length === 0) {
        imagesArray.push('/images/cat_prescription.png');
      }

      let sku = data.sku;
      if (!sku) {
        const namePart = (data.name || 'PRODUCT')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 6);
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        sku = `EG-${namePart}-${randomPart}`;
      }

      // Generate colors array from colorConfigs state
      const colorsPayload = colorConfigs.map((cfg) => {
        const existingColor = loadedProduct?.colors?.find(
          (c: any) => c.name.toLowerCase() === cfg.name.toLowerCase()
        );
        return {
          name: cfg.name,
          hex: cfg.hex || '#A7A7A7',
          stock: cfg.stock ?? 50,
          images: existingColor ? (existingColor.images || []) : []
        };
      });

      const colorNames = colorConfigs.map(c => c.name);

      const payload = {
        ...data,
        sku,
        status: data.status,
        isActive: data.status === 'Active',
        isBestseller: data.isBestseller,
        isPremium: data.isPremium,
        offerBadges: data.offerBadgesText ? data.offerBadgesText.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        colors: colorsPayload,
        primaryColor: colorNames[0] || 'Black',
        images: imagesArray,
        compatibleLensTypes: compLensTypes,
        sizeMeasurements: sizeMeasurementsArray,
        lensWidth: primaryMeasurements.lensWidth ?? data.lensWidth,
        bridgeWidth: primaryMeasurements.bridgeWidth ?? data.bridgeWidth,
        templeLength: primaryMeasurements.templeLength ?? data.templeLength,
        frameWidth: primaryMeasurements.frameWidth ?? data.frameWidth,
        tags: tagsArray,
        price: {
          original: data.mrp,
          selling: data.sellingPrice
        },
        memberPrice: data.enableMemberPricing && data.memberPrices?.goldMemberPrice ? Number(data.memberPrices.goldMemberPrice) : (data.memberPrices?.goldMemberPrice ? Number(data.memberPrices.goldMemberPrice) : undefined),
        frame: {
          type: data.frameShape,
          material: data.material,
          width: primaryMeasurements.frameWidth ?? data.frameWidth,
          lensWidth: primaryMeasurements.lensWidth ?? data.lensWidth,
          bridgeWidth: primaryMeasurements.bridgeWidth ?? data.bridgeWidth,
          templeLength: primaryMeasurements.templeLength ?? data.templeLength,
          featureTags: tagsArray
        },
        compatible: {
          prescription: compLensTypes.includes('Single Vision') || compLensTypes.includes('Progressive'),
          bluecut: compLensTypes.includes('Blue Cut') || data.coatingPricing.some(c => c.coatingName === 'Blue Cut' && c.isActive),
          zeropower: compLensTypes.includes('Zero Power'),
          progressive: compLensTypes.includes('Progressive')
        }
      };

      const originalLinked = new Set(originalLinkedPackIds.current);
      const linkedIds = linkedPackProducts.map((p) => p._id);
      const contactPackSiblingIdsToLink = linkedIds.filter((sibId) => !originalLinked.has(sibId));
      const contactPackSiblingIdsToUnlink = [...originalLinked].filter((sibId) => !linkedIds.includes(sibId));

      let packName = (getValues('packName') || data.packName || '').trim();
      let lensesPerBox = Number(getValues('lensesPerBox') || data.lensesPerBox) || undefined;
      let sellingPrice = data.sellingPrice;
      let mrp = data.mrp;
      const extraPacks = [...pendingPackProducts];
      if (isContactLenses && !isNonPowerContactProduct && !packName && extraPacks.length > 0) {
        const first = extraPacks.shift()!;
        packName = first.packName;
        lensesPerBox = first.lensesPerBox;
        sellingPrice = first.price;
        mrp = first.originalPrice || first.price;
      }

      const cleanPayload: Record<string, unknown> = {
        ...payload,
        contactPowers: getValues('contactPowers') || data.contactPowers || [],
        readingPowers: getValues('readingPowers') || data.readingPowers || [],
        categoryId: payload.categoryId || null,
        subCategoryId: payload.subCategoryId || null,
        brandId: payload.brandId || null,
      };

      if (isContactLenses && !isNonPowerContactProduct) {
        Object.assign(cleanPayload, {
          packName,
          lensesPerBox,
          sellingPrice,
          mrp,
          price: {
            original: mrp,
            selling: sellingPrice,
          },
          contactPackGroupId: getValues('contactPackGroupId') || data.contactPackGroupId || crypto.randomUUID(),
          contactPackOptions: [],
          contactPackSiblingsToCreate: extraPacks,
          contactPackSiblingIdsToLink,
          contactPackSiblingIdsToUnlink,
        });
      }

      if (isEditMode) {
        await api.put(`/admin/products/${id}`, cleanPayload);
        showToast(
          extraPacks.length > 0 && isContactLenses && !isNonPowerContactProduct
            ? `Product updated. ${extraPacks.length} other pack size(s) saved as separate products.`
            : 'Product updated successfully!',
          'success'
        );
      } else {
        await api.post('/admin/products', cleanPayload);
        localStorage.removeItem('eyeglaze_add_product_draft');
        showToast(
          extraPacks.length > 0 && isContactLenses && !isNonPowerContactProduct
            ? `Product created. ${extraPacks.length} other pack size(s) saved as separate products.`
            : 'Product created successfully!',
          'success'
        );
      }
      setTimeout(() => navigate('/admin/products'), 1500);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to save product details';
      showToast(errMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Actions
  const handleSaveDraft = async () => {
    setFormSubmitted(true);
    setValue('status', 'Draft');
    const isValid = await trigger(['name', 'slug', 'category', 'mrp', 'sellingPrice']);
    if (!isValid) {
      showToast('Product Name, Slug, Category, and Pricing are required to save as Draft', 'error');
      // Scroll to first error and popup alert
      setTimeout(() => {
        const errorList = Object.entries(errors)
          .map(([field, err]) => `• ${field}: ${(err as any)?.message || 'Invalid value'}`)
          .join('\n');
        alert(`Draft cannot be saved. Required fields are missing:\n\n${errorList || 'Product Name, Slug, Category, and Pricing.'}`);

        const firstErrorField = document.querySelector('.border-red-500');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }
    handleSubmit(onSubmit)();
  };

  const handlePublish = async () => {
    setFormSubmitted(true);
    setValue('status', 'Active');
    
    // Trigger full form validation
    const isValid = await trigger();
    
    if (!isValid) {
      // Scroll to the first error field and popup alert
      setTimeout(() => {
        const errorList = Object.entries(errors)
          .map(([field, err]) => `• ${field}: ${(err as any)?.message || 'Invalid value'}`)
          .join('\n');
        alert(`Please fix the following validation errors before publishing:\n\n${errorList || 'Check the highlighted fields.'}`);

        const firstErrorField = document.querySelector('.border-red-500');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }
    
    handleSubmit(onSubmit)();
  };

  const handleDuplicate = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      const generatedSku = `EG-${Date.now().toString().slice(-4)}`;
      const generatedSlug = `${formValues.slug}-dup-${Math.floor(Math.random() * 100)}`;
      setValue('sku', generatedSku);
      setValue('slug', generatedSlug);
      setValue('status', 'Draft');
      if (!getValues('contactPackGroupId')) {
        setValue('contactPackGroupId', crypto.randomUUID());
      }
      setIsEditMode(false);
      showToast('Duplicated to draft! Save to commit changes.', 'success');
      setShowConfirm(null);
    } catch {
      showToast('Duplication failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await api.delete(`/admin/products/${id}`);
      showToast('Product deleted successfully', 'success');
      navigate('/admin/products');
    } catch {
      showToast('Failed to delete product', 'error');
    }
  };

  // Price Engine Simulation state (for Step 12 Preview)
  // const [engineLens, setEngineLens] = useState<string>('Zero Power');
  // const [engineThickness, setEngineThickness] = useState<string>('1.50');
  // const [engineCoatings, setEngineCoatings] = useState<string[]>([]);
  // const [engineCoupon, setEngineCoupon] = useState<string>('');
  
  // Calculate simulation prices
  // const getSimulatedPayable = () => {
  //   const baseFrame = sellingPriceValue;
  //   
  //   // Lens Price
  //   const lensObj = formValues.dynamicLensPricing?.find(l => l.lensName === engineLens) || 
  //                   formValues.dynamicLensPricing?.find(l => l.lensCategory === engineLens);
  //   const lensPrice = lensObj ? lensObj.regularPrice : 0;
  // 
  //   // Thickness Price
  //   const thickObj = formValues.thicknessPricing?.find(t => t.thickness === engineThickness);
  //   const thickPrice = thickObj ? thickObj.regularPrice : 0;
  // 
  //   // Coating Price
  //   let coatingPrice = 0;
  //   engineCoatings.forEach(coat => {
  //     const coatObj = formValues.coatingPricing?.find(c => c.coatingName === coat);
  //     if (coatObj) coatingPrice += coatObj.regularPrice;
  //   });
  // 
  //   // Discount / Member Discount
  //   let membershipDiscount = 0;
  //   if (enableMemberPricingField) {
  //     const goldPrice = formValues.memberPrices?.goldMemberPrice || baseFrame;
  //     membershipDiscount = Math.max(0, baseFrame - goldPrice);
  //   }
  // 
  //   // Coupon
  //   let couponDiscount = 0;
  //   if (engineCoupon === 'SAVE10') {
  //     couponDiscount = Math.round((baseFrame + lensPrice) * 0.1);
  //   } else if (engineCoupon === 'FLAT500') {
  //     couponDiscount = 500;
  //   }
  // 
  //   // Cashback
  //   const cashback = Math.round((baseFrame * (formValues.memberPrices?.cashbackPercent || 0)) / 100);
  // 
  //   const payableAmount = baseFrame + lensPrice + thickPrice + coatingPrice - membershipDiscount - couponDiscount - cashback;
  //   return {
  //     frame: baseFrame,
  //     lens: lensPrice,
  //     thickness: thickPrice,
  //     coatings: coatingPrice,
  //     memberDisc: membershipDiscount,
  //     couponDisc: couponDiscount,
  //     cashback,
  //     total: Math.max(0, payableAmount)
  //   };
  // };

  // Derive compatibleLensTypes from selected lensTypes in real-time
  const selectedLensTypeNames = (formValues.lensTypes || []).map(typeId => {
    const typeDetails = availableLensTypes.find(t => t._id === typeId);
    return typeDetails ? typeDetails.name : '';
  });
  const derivedCompatibleLensTypes: string[] = [];
  selectedLensTypeNames.forEach(name => {
    if (name === 'With Power') {
      if (!derivedCompatibleLensTypes.includes('Single Vision')) derivedCompatibleLensTypes.push('Single Vision');
      if (!derivedCompatibleLensTypes.includes('Progressive')) derivedCompatibleLensTypes.push('Progressive');
    } else {
      if (!derivedCompatibleLensTypes.includes(name)) derivedCompatibleLensTypes.push(name);
    }
  });

  // const simResult = getSimulatedPayable();

  // Desktop, Tablet, Mobile Preview selector

  if (loadingMeta) {
    return (
      <div className="space-y-6 animate-pulse p-8">
        <div className="h-8 w-1/3 bg-[#2A2A2D] rounded-lg" />
        <div className="h-12 w-full bg-[#131314] border border-[#2A2A2D] rounded-xl" />
        <div className="grid grid-cols-4 gap-6">
          <div className="h-40 bg-[#131314] rounded-xl" />
          <div className="h-40 bg-[#131314] rounded-xl" />
          <div className="h-40 bg-[#131314] rounded-xl" />
          <div className="h-40 bg-[#131314] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white flex flex-col pb-24">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl border text-sm font-bold animate-slide-in ${toast.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
          {toast.type === 'success' ? '✓ ' : '✕ '} {toast.message}
        </div>
      )}

      {/* Confirmation Dialogs */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#131314] border border-[#2A2A2D] p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-white text-base font-extrabold uppercase tracking-wider">Are you sure?</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              {showConfirm === 'cancel' && 'Discard all changes and go back to the product list?'}
              {showConfirm === 'delete' && 'Permanently delete this product from database? This action is irreversible.'}
              {showConfirm === 'duplicate' && 'Create a copy of this product as a draft?'}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowConfirm(null)} className="px-4 py-2 rounded-xl text-xs bg-[#2A2A2D] text-white hover:bg-zinc-800 transition-colors font-bold uppercase">Cancel</button>
              <button
                onClick={() => {
                  if (showConfirm === 'cancel') navigate('/admin/products');
                  if (showConfirm === 'delete') handleDelete();
                  if (showConfirm === 'duplicate') handleDuplicate();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-colors ${showConfirm === 'delete' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-[#D4A04D] hover:bg-[#C8923E] text-black'}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uploading progress overlay */}
      {uploadProgress && (
        <div className="fixed bottom-6 right-6 bg-[#D4A04D]/10 border border-[#D4A04D]/30 z-50 px-6 py-4 rounded-xl shadow-2xl text-[#D4A04D] text-xs font-bold animate-pulse flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-[#D4A04D] border-t-transparent rounded-full animate-spin" />
          <span>{uploadProgress}</span>
        </div>
      )}

      {/* Image Cropper Modal */}
      {cropImageSrc && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6">
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-[#2A2A2D] pb-3">
              <h3 className="text-white text-sm font-extrabold uppercase tracking-wider text-[#D4A04D]">Crop Image</h3>
              <button onClick={() => setCropImageSrc(null)} className="text-gray-400 hover:text-white text-lg">✕</button>
            </div>
            
            <div 
              className="relative overflow-hidden bg-black rounded-xl border border-zinc-800 flex justify-center items-center select-none"
              style={{ height: '350px' }}
              onMouseMove={handleCropMouseMove}
              onMouseUp={handleCropMouseUp}
              onMouseLeave={handleCropMouseUp}
            >
              <img 
                ref={cropImageRef}
                src={cropImageSrc} 
                alt="To Crop" 
                className="max-h-full max-w-full pointer-events-none"
                onLoad={() => {
                  const rect = cropImageRef.current?.getBoundingClientRect();
                  if (rect) {
                    setCropBox({
                      x: rect.width / 2 - 100,
                      y: rect.height / 2 - 100,
                      w: Math.min(200, rect.width - 20),
                      h: Math.min(200, rect.height - 20)
                    });
                  }
                }}
              />
              
              {/* Crop box overlay */}
              <div 
                className="absolute border-2 border-[#D4A04D] bg-[#D4A04D]/10 cursor-move"
                style={{
                  left: `${cropBox.x}px`,
                  top: `${cropBox.y}px`,
                  width: `${cropBox.w}px`,
                  height: `${cropBox.h}px`,
                }}
                onMouseDown={(e) => handleCropMouseDown(e, 'box')}
              >
                {/* Resize handle */}
                <div 
                  className="absolute bottom-0 right-0 w-4 h-4 bg-[#D4A04D] cursor-se-resize"
                  onMouseDown={(e) => handleCropMouseDown(e, 'resize')}
                />
              </div>
            </div>

            <div className="text-[10px] text-gray-500 text-center">Drag the box to move. Drag the gold corner handle to resize.</div>

            <div className="flex justify-end gap-3 border-t border-[#2A2A2D] pt-4">
              <button onClick={() => setCropImageSrc(null)} className="px-5 py-2.5 rounded-xl text-xs bg-[#2A2A2D] text-white hover:bg-zinc-800 transition-colors font-bold uppercase">Cancel</button>
              <button onClick={applyCrop} className="px-5 py-2.5 rounded-xl text-xs bg-[#D4A04D] hover:bg-[#C8923E] text-black font-bold uppercase transition-colors">Apply Crop</button>
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#2A2A2D] px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowConfirm('cancel')} className="text-[#A7A7A7] hover:text-white transition-colors text-xs font-bold uppercase tracking-wider">
              ← Products
            </button>
            <div className="h-4 w-px bg-[#2A2A2D]" />
            <div>
              <h1 className="text-base font-extrabold uppercase tracking-wide text-white flex items-center gap-2">
                {isEditMode ? `Edit Product (${versionHistory ? `v${versionHistory}` : 'v1'})` : 'Add Product Wizard'}
              </h1>
              {lastAutoSaved && !isEditMode && (
                <div className="text-[10px] text-gray-500">Auto-saved at {lastAutoSaved}</div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="bg-[#2A2A2D] hover:bg-zinc-800 text-white font-bold py-2 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              Save Draft
            </button>
            {isEditMode && (
              <>
                <button
                  onClick={() => setShowConfirm('duplicate')}
                  disabled={isSaving}
                  className="bg-[#2A2A2D] hover:bg-zinc-800 text-white font-bold py-2 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => setShowConfirm('delete')}
                  className="bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/20 font-bold py-2 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors"
                >
                  Delete
                </button>
              </>
            )}
            <button
              onClick={handlePublish}
              disabled={isSaving}
              className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold py-2 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg disabled:opacity-50"
            >
              Publish
            </button>
          </div>
        </div>
      </header>

      {/* Validation Error Summary */}
      {formSubmitted && Object.keys(errors).length > 0 && (
        <div className="max-w-7xl mx-auto px-8 pt-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <div className="text-red-400 text-lg mt-0.5">⚠️</div>
            <div className="flex-1">
              <h3 className="text-red-400 text-xs font-extrabold uppercase tracking-wider mb-2">
                Please fix the following errors to publish:
              </h3>
              <ul className="space-y-1">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field} className="text-red-400/80 text-xs">
                    • {field}: {(error as any)?.message || 'Invalid value'}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Stepper UI removed */}
      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-8 py-8 w-full flex-grow flex gap-8">
        {/* Form Container */}
        <div className="flex-1 bg-[#131314] border border-[#2A2A2D] rounded-2xl p-8 shadow-2xl relative">
          
          {/* SECTION 1: BASIC INFORMATION */}
          <div className="space-y-6 mb-12">
              <h2 className="text-white text-base font-extrabold uppercase tracking-wider border-b border-[#2A2A2D] pb-3 text-[#D4A04D]">Step 1: Basic Information</h2>
              
              {/* Hidden Registered Fields */}
              <input type="hidden" {...register('sku')} />
              <input type="hidden" {...register('slug')} />
              <input type="hidden" {...register('brand')} />
              <input type="hidden" {...register('categoryId')} />
              <input type="hidden" {...register('subCategoryId')} />

              {/* Product Name */}
              <div>
                <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Product Name *</label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Vincent Chase Air Rectangular Premium Glasses"
                  className={`w-full bg-[#0B0B0C] border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none ${
                    errors.name ? 'border-red-500 animate-pulse' : 'border-[#2A2A2D] focus:border-[#D4A04D]'
                  }`}
                />
                {errors.name && <p className="text-red-400 text-[10px] mt-1 font-semibold">{errors.name.message}</p>}
              </div>

              {/* Category Hierarchy Selection */}
              {(() => {
                const matchedParent = categoryTree.find(
                  (c: any) =>
                    c.slug === currentCategory ||
                    c.id === currentCategory ||
                    c._id === currentCategory ||
                    c.id === formValues.categoryId ||
                    c._id === formValues.categoryId
                );

                const subCategoriesList = matchedParent?.children || [];

                const currentSubVal = watch('subCategory');
                const currentSubIdVal = watch('subCategoryId');
                const matchedSub = subCategoriesList.find(
                  (s: any) =>
                    s.slug === currentSubVal ||
                    s.name === currentSubVal ||
                    s.id === currentSubVal ||
                    s._id === currentSubVal ||
                    s.id === currentSubIdVal ||
                    s._id === currentSubIdVal
                );

                const subSubCategoriesList = matchedSub?.children || [];
                const collectionVariants = matchedSub?.variants || [];
                const nestedTypeVariants = (subSubCategoriesList as any[]).flatMap((ss: any) => ss.children || []);
                const subSubSubCategoriesList = collectionVariants.length > 0 ? collectionVariants : nestedTypeVariants;

                const currentSubSubVal = watch('subSubCategory');
                const currentSubSubIdVal = watch('subSubCategoryId');
                const matchedSubSub = subSubCategoriesList.find(
                  (ss: any) =>
                    ss.slug === currentSubSubVal ||
                    ss.name === currentSubSubVal ||
                    ss.id === currentSubSubVal ||
                    ss._id === currentSubSubVal ||
                    ss.id === currentSubSubIdVal ||
                    ss._id === currentSubSubIdVal
                );

                const matchedSubSubSubItem = subSubSubCategoriesList.find(
                  (sss: any) =>
                    sss.slug === formValues.subSubSubCategory ||
                    sss.name === formValues.subSubSubCategory ||
                    sss.id === formValues.subSubSubCategory ||
                    sss._id === formValues.subSubSubCategory ||
                    sss.id === formValues.subSubSubCategoryId ||
                    sss._id === formValues.subSubSubCategoryId
                );

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                      {/* Category Dropdown */}
                      <div>
                        <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Category *</label>
                        <select
                          {...register('category')}
                          onChange={(e) => {
                            const val = e.target.value;
                            setValue('category', val);
                            setValue('subCategory', '');
                            setValue('subCategoryId', '');
                            setValue('subSubCategory', '');
                            setValue('subSubCategoryId', '');
                            setValue('subSubSubCategory', '');
                            setValue('subSubSubCategoryId', '');
                            const matched = categoryTree.find((c: any) => c.slug === val || c.id === val || c._id === val);
                            setValue('categoryId', matched ? matched.id || matched._id : '');
                          }}
                          className={`w-full bg-[#0B0B0C] border rounded-xl px-3 py-2.5 text-white text-xs md:text-sm font-bold focus:outline-none transition-colors ${
                            errors.category ? 'border-red-500 animate-pulse' : 'border-[#2A2A2D] focus:border-[#D4A04D]'
                          }`}
                          title={matchedParent?.name || 'Select Category'}
                        >
                          <option value="">-- Choose Category --</option>
                          {categoryTree.map((c: any) => (
                            <option key={c.id || c._id} value={c.slug || c.id || c._id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        {errors.category && <p className="text-red-400 text-[10px] mt-1 font-semibold">{errors.category.message}</p>}
                      </div>

                      {/* Subcategory Dropdown (Shown if parent has subcategories) */}
                      {subCategoriesList.length > 0 && (
                        <div>
                          <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">{CATEGORY_LEVEL.SubCategory}</label>
                          <select
                            {...register('subCategory')}
                            onChange={(e) => {
                              const val = e.target.value;
                              setValue('subCategory', val);
                              setValue('subSubCategory', '');
                              setValue('subSubCategoryId', '');
                              setValue('subSubSubCategory', '');
                              setValue('subSubSubCategoryId', '');
                              const matchedSubItem = subCategoriesList.find(
                                (s: any) => s.slug === val || s.name === val || s.id === val || s._id === val
                              );
                              setValue('subCategoryId', matchedSubItem ? matchedSubItem.id || matchedSubItem._id : '');
                              if (val.toLowerCase().includes('kids') || matchedSubItem?.name?.toLowerCase().includes('kids')) {
                                const currentGenders = formValues.gender || [];
                                if (!currentGenders.includes('kids')) {
                                  setValue('gender', [...currentGenders, 'kids']);
                                }
                              }
                            }}
                            className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2.5 text-white text-xs md:text-sm focus:border-[#D4A04D] focus:outline-none font-bold transition-colors"
                            title={matchedSub?.name || `Select ${CATEGORY_LEVEL.SubCategory}`}
                          >
                            <option value="">-- Choose {CATEGORY_LEVEL.SubCategory} --</option>
                            {subCategoriesList.map((sub: any) => (
                              <option key={sub.id || sub._id} value={sub.slug || sub.id || sub._id}>
                                {sub.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Sub-Sub-Category Dropdown (Shown if subcategory has sub-sub categories) */}
                      {currentSubVal && subSubCategoriesList.length > 0 && (
                        <div>
                          <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">{CATEGORY_LEVEL.SubSubCategory}</label>
                          <select
                            {...register('subSubCategory')}
                            onChange={(e) => {
                              const val = e.target.value;
                              setValue('subSubCategory', val);
                              setValue('subSubSubCategory', '');
                              setValue('subSubSubCategoryId', '');
                              const matchedSubSubItem = subSubCategoriesList.find(
                                (ss: any) => ss.slug === val || ss.name === val || ss.id === val || ss._id === val
                              );
                              setValue('subSubCategoryId', matchedSubSubItem ? matchedSubSubItem.id || matchedSubSubItem._id : '');
                            }}
                            className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2.5 text-white text-xs md:text-sm focus:border-[#D4A04D] focus:outline-none font-bold transition-colors"
                            title={matchedSubSub?.name || `Select ${CATEGORY_LEVEL.SubSubCategory}`}
                          >
                            <option value="">-- Choose {CATEGORY_LEVEL.SubSubCategory} --</option>
                            {subSubCategoriesList.map((ss: any) => (
                              <option key={ss.id || ss._id} value={ss.slug || ss.id || ss._id}>
                                {ss.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Variant dropdown — belongs to the Collection, not the Type */}
                      {currentSubVal && subSubSubCategoriesList.length > 0 && (
                        <div>
                          <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">{CATEGORY_LEVEL.SubSubSubCategory}</label>
                          <select
                            {...register('subSubSubCategory')}
                            onChange={(e) => {
                              const val = e.target.value;
                              setValue('subSubSubCategory', val);
                              const matchedItem = subSubSubCategoriesList.find(
                                (sss: any) => sss.slug === val || sss.name === val || sss.id === val || sss._id === val
                              );
                              setValue('subSubSubCategoryId', matchedItem ? matchedItem.id || matchedItem._id : '');
                            }}
                            className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2.5 text-white text-xs md:text-sm focus:border-[#D4A04D] focus:outline-none font-bold transition-colors"
                            title={matchedSubSubSubItem?.name || `Select ${CATEGORY_LEVEL.SubSubSubCategory}`}
                          >
                            <option value="">-- Choose {CATEGORY_LEVEL.SubSubSubCategory} --</option>
                            {subSubSubCategoriesList.map((sss: any) => (
                              <option key={sss.id || sss._id} value={sss.slug || sss.id || sss._id}>
                                {sss.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Status */}
                      <div>
                        <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Status</label>
                        <select
                          {...register('status')}
                          className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2.5 text-white text-xs md:text-sm focus:border-[#D4A04D] focus:outline-none font-bold"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Scheduled">Scheduled</option>
                        </select>
                      </div>

                      {/* Product Tier/Collection - Hidden for Contact Lenses */}
                      {!isContactLenses && (
                        <div>
                          <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Tier / Collection</label>
                          <select
                            {...register('tier')}
                            className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2.5 text-white text-xs md:text-sm focus:border-[#D4A04D] focus:outline-none font-bold"
                          >
                            <option value="None">None</option>
                            <option value="Premium">Premium</option>
                            <option value="Essential">Essential</option>
                            <option value="Sale">Sale</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Clean Text Breadcrumb Path (Slash-separated, no card box) */}
                    {(matchedParent || matchedSub || matchedSubSub || matchedSubSubSubItem) && (
                      <div className="flex items-center gap-2 flex-wrap text-sm md:text-base font-medium py-1 px-1 select-none">
                        {matchedParent && (
                          <span className={matchedSub ? "text-slate-400 font-normal" : "text-white font-bold"}>
                            {matchedParent.name}
                          </span>
                        )}
                        {matchedSub && (
                          <>
                            <span className="text-slate-500 font-bold">/</span>
                            <span className={matchedSubSub ? "text-slate-400 font-normal" : "text-white font-bold"}>
                              {matchedSub.name}
                            </span>
                          </>
                        )}
                        {matchedSubSub && (
                          <>
                            <span className="text-slate-500 font-bold">/</span>
                            <span className={matchedSubSubSubItem ? "text-slate-400 font-normal" : "text-white font-bold"}>
                              {matchedSubSub.name}
                            </span>
                          </>
                        )}
                        {matchedSubSubSubItem && (
                          <>
                            <span className="text-slate-500 font-bold">/</span>
                            <span className="text-white font-bold">
                              {matchedSubSubSubItem.name}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Sort Order */}
              <div className="max-w-xs">
                <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Sort Order</label>
                <input
                  type="number"
                  {...register('sortOrder', { valueAsNumber: true })}
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


                {/* Kids Age Groups Selection - Shown when Subcategory is Kids or Gender is Kids */}
                {isKids && (
                  <div>
                    <MultiSelectDropdown
                      label="Kids Age Group / Target Size *"
                      options={[
                        { value: 'Juniors', label: 'Juniors (5 to 8 years) [Small]' },
                        { value: 'Tweens', label: 'Tweens (8 to 12 years) [Medium]' },
                        { value: 'Teens', label: 'Teens (12 to 17 years) [Large]' },
                        { value: 'Sale', label: 'Kids On Sale (Special Discounts)' }
                      ]}
                      selectedValues={formValues.kidsAgeGroups || []}
                      onChange={(values) => {
                        setValue('kidsAgeGroups', values as any);
                        const mappedSizes: ('Small' | 'Medium' | 'Large')[] = [];
                        if (values.includes('Juniors')) mappedSizes.push('Small');
                        if (values.includes('Tweens')) mappedSizes.push('Medium');
                        if (values.includes('Teens')) mappedSizes.push('Large');
                        
                        if (mappedSizes.length > 0) {
                          setValue('availableSizes', mappedSizes as any);
                          setValue('frameSize', mappedSizes[0] as any);
                        } else {
                          setValue('availableSizes', ['Small', 'Medium', 'Large'] as any);
                        }
                      }}
                      placeholder="Select Kids Age Groups (e.g. Juniors 5-8 yrs)..."
                    />
                  </div>
                )}
              </div>

              {isSunglasses && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Frame Size (Multi-select) */}
                    <div>
                      <MultiSelectDropdown
                        label="Frame Sizes *"
                        options={
                          isKids
                            ? [
                                { value: 'Small', label: 'Juniors | 5 to 8 years' },
                                { value: 'Medium', label: 'Tweens | 8 to 12 years' },
                                { value: 'Large', label: 'Teens | 12 to 17 years' }
                              ]
                            : [
                                { value: 'Small', label: 'Small' },
                                { value: 'Medium', label: 'Medium' },
                                { value: 'Large', label: 'Large' }
                              ]
                        }
                        selectedValues={formValues.availableSizes || []}
                        onChange={(values) => {
                          setValue('availableSizes', values as any);
                          if (values.length > 0) {
                            setValue('frameSize', values[0] as any);
                          }
                        }}
                        placeholder="Select sizes..."
                      />
                    </div>

                    {/* Frame Color (comma-separated list) */}
                    <div>
                      <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Frame Colors (comma-separated)</label>
                      <input
                        type="text"
                        {...register('primaryColor')}
                        placeholder="e.g. Black, Brown, Gold"
                        className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none font-bold"
                      />
                    </div>
                  </div>
                  {renderColorStockEditor()}
                </>
              )}

              {/* Descriptions */}
              <div>
                <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Short Description</label>
                <input
                  type="text"
                  {...register('shortDescription')}
                  placeholder="Summarize product highlights in 1 line..."
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                />
              </div>

              {/* Selling Options - Hidden for Contact Lenses */}
              {!isContactLenses && (
                <div className="bg-[#18181A] p-6 rounded-2xl border border-[#2A2A2D]/40 space-y-4">
                  <h3 className="text-white text-xs font-extrabold uppercase tracking-wider text-[#D4A04D]">Selling Options</h3>
                  <p className="text-[10px] text-gray-400">Select how this product can be purchased by customers (at least one must be enabled).</p>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        const currentVal = !!watch('sellAsFrame');
                        const otherVal = !!watch('sellWithLens');
                        // Ensure at least one is checked
                        if (currentVal && !otherVal) {
                          showToast('At least one selling option must be selected', 'error');
                          return;
                        }
                        setValue('sellAsFrame', !currentVal);
                      }}
                      className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        watch('sellAsFrame')
                          ? 'bg-[#D4A04D]/15 border-[#D4A04D] text-[#D4A04D]'
                          : 'bg-[#0B0B0C] border-zinc-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {watch('sellAsFrame') ? '✓ Sell as Frame (Add to Cart)' : 'Frame Only (Disabled)'}
                    </button>
                    {!isPowerSunglasses && (
                      <button
                        type="button"
                        onClick={() => {
                          const currentVal = !!watch('sellWithLens');
                          const otherVal = !!watch('sellAsFrame');
                          // Ensure at least one is checked
                          if (currentVal && !otherVal) {
                            showToast('At least one selling option must be selected', 'error');
                            return;
                          }
                          setValue('sellWithLens', !currentVal);
                        }}
                        className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          watch('sellWithLens')
                            ? 'bg-[#D4A04D]/15 border-[#D4A04D] text-[#D4A04D]'
                            : 'bg-[#0B0B0C] border-zinc-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        {watch('sellWithLens') ? '✓ Sell with Lens (Buy with Lens)' : 'With Lens (Disabled)'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Special Power & Reading custom fields */}
              {isPowerSunglasses && isReading && (
                <div className="bg-[#18181A] p-6 rounded-2xl border border-[#2A2A2D]/40 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-white text-xs font-extrabold uppercase tracking-wider text-[#D4A04D]">Reading Glasses Power Options</h3>
                    <p className="text-[10px] text-gray-400">Select the ready-made powers available for this product.</p>
                    
                    <div className="flex flex-wrap gap-3">
                      {['+1.00', '+1.25', '+1.50', '+1.75', '+2.00', '+2.25', '+2.50', '+2.75', '+3.00'].map((power) => {
                        const currentPowers = formValues.readingPowers || [];
                        const isSelected = currentPowers.includes(power);
                        return (
                          <button
                            type="button"
                            key={power}
                            onClick={() => {
                              if (isSelected) {
                                setValue('readingPowers', currentPowers.filter(p => p !== power));
                              } else {
                                setValue('readingPowers', [...currentPowers, power]);
                              }
                            }}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                              isSelected
                                ? 'bg-[#D4A04D]/15 border-[#D4A04D]/35 text-[#D4A04D]'
                                : 'bg-[#0B0B0C] border-zinc-800 text-gray-400 hover:text-white'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '} {power}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Colors Selector */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#2A2A2D]/40">
                    <div>
                      <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Frame Colors (comma-separated)</label>
                      <input
                        type="text"
                        {...register('primaryColor')}
                        placeholder="e.g. Black, Brown, Gold"
                        className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Secondary Color</label>
                      <input
                        type="text"
                        {...register('secondaryColor')}
                        placeholder="e.g. Gold highlights"
                        className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                      />
                    </div>
                  </div>
                  {renderColorStockEditor()}

                  {/* Frame Size Selector */}
                  <div className="space-y-3 pt-4 border-t border-[#2A2A2D]/40">
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Available Sizes *</label>
                    <div className="flex gap-4">
                      {['Small', 'Medium', 'Large'].map((size) => {
                        const currentSizes = formValues.availableSizes || [];
                        const isChecked = currentSizes.includes(size as any);
                        return (
                          <label
                            key={size}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-[#D4A04D]/15 border-[#D4A04D] text-[#D4A04D]'
                                : 'bg-[#0B0B0C] text-gray-400 border-zinc-800 hover:text-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setValue('availableSizes', currentSizes.filter((s: string) => s !== size));
                                } else {
                                  setValue('availableSizes', [...currentSizes, size as any]);
                                }
                              }}
                              className="hidden"
                            />
                            <span>{isChecked ? '✓ ' : '+ '} {size}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Reading Power custom fields */}
              {(isReading || (watch('subCategory') && /reading/i.test(watch('subCategory') || '')) || (watch('category') && /special|reading/i.test(watch('category') || ''))) && (
                <div className="bg-[#18181A] p-6 rounded-2xl border border-[#2A2A2D]/40 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2A2D]/60 pb-3">
                    <div>
                      <h3 className="text-white text-xs font-extrabold uppercase tracking-wider text-[#D4A04D]">Reading Glasses Power Options</h3>
                      <p className="text-[10px] text-gray-400">Select which diopter powers (e.g. +1.00, +1.50) are available for customers to choose when buying this reading frame.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const stdPowers = ['+1.00', '+1.25', '+1.50', '+1.75', '+2.00', '+2.25', '+2.50', '+2.75', '+3.00'];
                          setValue('readingPowers', stdPowers);
                          showToast('Standard reading powers added (+1.00 to +3.00)', 'success');
                        }}
                        className="bg-[#2A2A2D] hover:bg-[#3A3A3D] text-[#D4A04D] font-extrabold text-[9px] uppercase tracking-wider rounded-lg px-3 py-1.5 transition-colors cursor-pointer border border-[#D4A04D]/30"
                      >
                        + Add All Standard (+1.0 to +3.0)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setValue('readingPowers', []);
                          showToast('Cleared reading powers', 'error');
                        }}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-extrabold text-[9px] uppercase tracking-wider rounded-lg px-3 py-1.5 transition-colors cursor-pointer border border-red-500/20"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Preset Buttons Grid */}
                  <div className="space-y-2">
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block">Quick Toggle Preset Powers</label>
                    <div className="flex flex-wrap gap-2">
                      {['+0.75', '+1.00', '+1.25', '+1.50', '+1.75', '+2.00', '+2.25', '+2.50', '+2.75', '+3.00', '+3.25', '+3.50', '+3.75', '+4.00'].map(power => {
                        const current = formValues.readingPowers || [];
                        const isSelected = current.includes(power);
                        return (
                          <button
                            key={power}
                            type="button"
                            onClick={() => {
                              const next = isSelected
                                ? current.filter((p: string) => p !== power)
                                : [...current, power];
                              setValue('readingPowers', next);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-[#D4A04D] text-black border-[#D4A04D] shadow-md font-extrabold'
                                : 'bg-[#0B0B0C] text-gray-400 border-zinc-800 hover:border-[#D4A04D]/60 hover:text-white'
                            }`}
                          >
                            {isSelected ? `✓ ${power}` : power}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Power Input */}
                  <div className="flex items-end gap-3 bg-[#0B0B0C] p-4 rounded-xl border border-zinc-800/80">
                    <div className="flex-1 max-w-xs">
                      <label className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block mb-1">Custom Power Value</label>
                      <input
                        type="text"
                        id="new-reading-power"
                        placeholder="e.g. +1.50"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#D4A04D]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('new-reading-power') as HTMLInputElement;
                        let val = input?.value?.trim();
                        if (!val) {
                          showToast('Power value is required', 'error');
                          return;
                        }
                        if (!val.startsWith('+') && !val.startsWith('-')) {
                          val = `+${val}`;
                        }
                        const current = formValues.readingPowers || [];
                        if (current.includes(val)) {
                          showToast('Power value already exists', 'error');
                          return;
                        }
                        setValue('readingPowers', [...current, val]);
                        if (input) input.value = '';
                        showToast(`Added ${val} to available reading powers`, 'success');
                      }}
                      className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg px-4 py-2 transition-colors cursor-pointer border-none"
                    >
                      Add Custom Power
                    </button>
                  </div>

                  {/* Active Selected List */}
                  {formValues.readingPowers && formValues.readingPowers.length > 0 ? (
                    <div className="bg-[#0B0B0C] p-4 rounded-xl border border-zinc-800/80">
                      <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block mb-2">Selected Powers Available for Customers ({formValues.readingPowers.length})</span>
                      <div className="flex flex-wrap gap-2">
                        {formValues.readingPowers.map((power: string) => (
                          <span
                            key={power}
                            className="inline-flex items-center gap-1.5 bg-[#18181A] border border-[#D4A04D]/40 text-[#D4A04D] text-xs font-extrabold px-3 py-1 rounded-md"
                          >
                            <span>{power}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const next = (formValues.readingPowers || []).filter((p: string) => p !== power);
                                setValue('readingPowers', next);
                              }}
                              className="text-gray-400 hover:text-red-400 bg-transparent border-none cursor-pointer text-xs ml-1 p-0 leading-none"
                              title="Remove power"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-[#0B0B0C] border border-dashed border-zinc-800 rounded-xl text-gray-500 text-xs italic">
                      No reading powers selected yet. Choose preset powers above or add custom ones.
                    </div>
                  )}
                </div>
              )}
              {isContactLenses && !isNonPowerContactProduct && (
                <div className="bg-[#18181A] p-6 rounded-2xl border border-[#2A2A2D]/40 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2A2D]/60 pb-3">
                    <div>
                      <h3 className="text-white text-xs font-extrabold uppercase tracking-wider text-[#D4A04D]">Contact Lenses Configuration</h3>
                      <p className="text-[10px] text-gray-400">Each pack size is its own product. Linked packs appear together on the customer page.</p>
                    </div>
                  </div>

                  {/* This product is one pack; other sizes become sibling products. */}
                  <div className="space-y-4 pt-4 border-t border-[#2A2A2D]/40">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-white text-xs font-bold uppercase tracking-wider text-[#D4A04D]">Lenses per Pack</h4>
                        <p className="text-[10px] text-gray-500">This product is one pack size. Other sizes are saved as separate products and shown together on the customer page.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const currentSelling = Number(watch('sellingPrice')) || 369;
                            const currentMrp = Number(watch('mrp')) || currentSelling;
                            const existingNames = new Set([
                              String(watch('packName') || '').toLowerCase(),
                              ...linkedPackProducts.map((p) => p.packName.toLowerCase()),
                              ...pendingPackProducts.map((p) => p.packName.toLowerCase()),
                            ].filter(Boolean));
                            const presets: ContactPackDraft[] = [
                              { packName: '1 lens/box', price: currentSelling, originalPrice: currentMrp, lensesPerBox: 1 },
                              { packName: '3 lens/box', price: Math.round(currentSelling * 2.5), originalPrice: Math.round(currentMrp * 3), lensesPerBox: 3 },
                              { packName: '6 lens/box', price: Math.round(currentSelling * 4.8), originalPrice: Math.round(currentMrp * 6), lensesPerBox: 6 },
                            ];
                            let nextPending = [...pendingPackProducts];
                            if (!watch('packName')) {
                              const first = presets[0];
                              setValue('packName', first.packName);
                              setValue('lensesPerBox', first.lensesPerBox);
                              if (!watch('sellingPrice')) setValue('sellingPrice', first.price);
                              if (!watch('mrp')) setValue('mrp', first.originalPrice || first.price);
                              existingNames.add(first.packName.toLowerCase());
                            }
                            presets.forEach((preset) => {
                              if (!existingNames.has(preset.packName.toLowerCase())) {
                                nextPending.push(preset);
                                existingNames.add(preset.packName.toLowerCase());
                              }
                            });
                            setPendingPackProducts(nextPending);
                            if (!getValues('contactPackGroupId')) {
                              setValue('contactPackGroupId', crypto.randomUUID());
                            }
                            showToast('Added 1 / 3 / 6 lens packs as separate products (created on save)', 'success');
                          }}
                          className="bg-[#2A2A2D] hover:bg-[#3A3A3D] text-[#D4A04D] font-extrabold text-[9px] uppercase tracking-wider rounded-lg px-3 py-1.5 transition-colors cursor-pointer border border-[#D4A04D]/30"
                        >
                          + Quick Add Presets (1, 3, 6 lens/box)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPendingPackProducts([]);
                            showToast('Cleared packs waiting to be created', 'error');
                          }}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-extrabold text-[9px] uppercase tracking-wider rounded-lg px-3 py-1.5 transition-colors cursor-pointer border border-red-500/20"
                        >
                          Clear New Packs
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#0B0B0C] p-4 rounded-xl border border-zinc-800/80">
                      <div>
                        <label className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block mb-1">This pack name *</label>
                        <input
                          type="text"
                          placeholder="e.g. 1 lens/box"
                          {...register('packName')}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#D4A04D]"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block mb-1">Lenses per box</label>
                        <input
                          type="number"
                          placeholder="1"
                          {...register('lensesPerBox')}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#D4A04D]"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block mb-1">Selling price (₹) *</label>
                        <input
                          type="number"
                          placeholder="999"
                          {...register('sellingPrice', { valueAsNumber: true })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#D4A04D]"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block mb-1">MRP (₹) *</label>
                        <input
                          type="number"
                          placeholder="999"
                          {...register('mrp', { valueAsNumber: true })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#D4A04D]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-end gap-3 bg-[#0B0B0C] p-4 rounded-xl border border-zinc-800/80">
                      <div className="flex-1 min-w-[140px]">
                        <label className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block mb-1">Another pack name</label>
                        <input
                          type="text"
                          id="new-pack-name"
                          placeholder="e.g. 3 lens/box"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#D4A04D]"
                        />
                      </div>
                      <div className="w-28">
                        <label className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block mb-1">Price (₹)</label>
                        <input
                          type="number"
                          id="new-pack-price"
                          placeholder="e.g. 2498"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#D4A04D]"
                        />
                      </div>
                      <div className="w-28">
                        <label className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block mb-1">MRP (₹)</label>
                        <input
                          type="number"
                          id="new-pack-original-price"
                          placeholder="e.g. 2997"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#D4A04D]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nameInput = document.getElementById('new-pack-name') as HTMLInputElement;
                          const priceInput = document.getElementById('new-pack-price') as HTMLInputElement;
                          const origInput = document.getElementById('new-pack-original-price') as HTMLInputElement;
                          const pName = nameInput?.value?.trim();
                          const price = parseFloat(priceInput?.value);
                          const origPrice = parseFloat(origInput?.value);
                          const lensesMatch = pName?.match(/(\d+)/);
                          const lensesPerBox = lensesMatch ? parseInt(lensesMatch[1], 10) : undefined;

                          if (!pName) {
                            showToast('Pack name is required (e.g. 3 lens/box)', 'error');
                            return;
                          }
                          if (isNaN(price) || price < 0) {
                            showToast('Valid selling price is required', 'error');
                            return;
                          }

                          const names = [
                            String(watch('packName') || '').toLowerCase(),
                            ...linkedPackProducts.map((p) => p.packName.toLowerCase()),
                            ...pendingPackProducts.map((p) => p.packName.toLowerCase()),
                          ];
                          if (names.includes(pName.toLowerCase())) {
                            showToast('This pack size already exists', 'error');
                            return;
                          }

                          if (!watch('packName')) {
                            setValue('packName', pName);
                            setValue('lensesPerBox', lensesPerBox);
                            setValue('sellingPrice', price);
                            setValue('mrp', !isNaN(origPrice) ? origPrice : price);
                          } else {
                            setPendingPackProducts([
                              ...pendingPackProducts,
                              {
                                packName: pName,
                                price,
                                originalPrice: !isNaN(origPrice) ? origPrice : undefined,
                                lensesPerBox,
                              },
                            ]);
                          }
                          if (!getValues('contactPackGroupId')) {
                            setValue('contactPackGroupId', crypto.randomUUID());
                          }
                          if (nameInput) nameInput.value = '';
                          if (priceInput) priceInput.value = '';
                          if (origInput) origInput.value = '';
                          showToast(`${pName} will be saved as its own product`, 'success');
                        }}
                        className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg px-4 py-2.5 transition-colors cursor-pointer border-none"
                      >
                        Add Pack Product
                      </button>
                    </div>

                    {(linkedPackProducts.length > 0 || pendingPackProducts.length > 0) && (
                      <div className="overflow-hidden border border-zinc-800/80 rounded-xl bg-[#0B0B0C]">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="bg-zinc-900/40 text-gray-400 uppercase text-[9px] font-extrabold tracking-wider border-b border-[#2A2A2D]/40">
                              <th className="py-2.5 px-4">Pack product</th>
                              <th className="py-2.5 px-4">Selling Price</th>
                              <th className="py-2.5 px-4">MRP</th>
                              <th className="py-2.5 px-4">Status</th>
                              <th className="py-2.5 px-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#2A2A2D]/30 text-gray-300 font-semibold">
                            {linkedPackProducts.map((item) => (
                              <tr key={item._id} className="hover:bg-zinc-900/10">
                                <td className="py-2.5 px-4 text-white font-bold">
                                  {item.packName}
                                  {item.sku ? <span className="block text-[9px] text-gray-500 font-semibold">{item.sku}</span> : null}
                                </td>
                                <td className="py-2.5 px-4 text-[#D4A04D] font-extrabold">₹{item.price}</td>
                                <td className="py-2.5 px-4 text-gray-500 line-through">{item.originalPrice ? `₹${item.originalPrice}` : '-'}</td>
                                <td className="py-2.5 px-4 text-[#D4A04D] text-[10px] uppercase">{item.status || 'Linked'}</td>
                                <td className="py-2.5 px-4 text-right space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/admin/products/edit/${item._id}`)}
                                    className="text-[#D4A04D] hover:text-white text-xs font-bold bg-[#D4A04D]/10 px-2 py-1 rounded"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setLinkedPackProducts(linkedPackProducts.filter((p) => p._id !== item._id))}
                                    className="text-red-400 hover:text-red-300 text-xs font-bold bg-red-500/10 px-2 py-1 rounded"
                                  >
                                    Unlink
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {pendingPackProducts.map((item, idx) => (
                              <tr key={`pending-${item.packName}-${idx}`} className="hover:bg-zinc-900/10">
                                <td className="py-2.5 px-4 text-white font-bold">{item.packName}</td>
                                <td className="py-2.5 px-4 text-[#D4A04D] font-extrabold">₹{item.price}</td>
                                <td className="py-2.5 px-4 text-gray-500 line-through">{item.originalPrice ? `₹${item.originalPrice}` : '-'}</td>
                                <td className="py-2.5 px-4 text-amber-400 text-[10px] uppercase">Creates on save</td>
                                <td className="py-2.5 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setPendingPackProducts(pendingPackProducts.filter((_, i) => i !== idx))}
                                    className="text-red-400 hover:text-red-300 text-xs font-bold bg-red-500/10 px-2 py-1 rounded"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {isEditMode && (
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="flex-1 min-w-[180px]">
                          <label className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block mb-1">Link existing pack product</label>
                          <input
                            type="text"
                            value={packLinkQuery}
                            onChange={(e) => setPackLinkQuery(e.target.value)}
                            placeholder="Search by name or SKU"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#D4A04D]"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={packLinkBusy}
                          onClick={async () => {
                            const q = packLinkQuery.trim();
                            if (!q) {
                              showToast('Enter a product name or SKU to link', 'error');
                              return;
                            }
                            setPackLinkBusy(true);
                            try {
                              const res = await api.get('/admin/products', { params: { search: q, limit: 8, ungroupPacks: true } });
                              const match = (res.data.products || []).find((prod: any) => {
                                if (String(prod._id) === String(id)) return false;
                                if (linkedPackProducts.some((p) => p._id === String(prod._id))) return false;
                                const blob = `${prod.category || ''} ${(prod.categories || []).join(' ')}`.toLowerCase();
                                return blob.includes('contact');
                              });
                              if (!match) {
                                showToast('No matching contact-lens product found', 'error');
                                return;
                              }
                              setLinkedPackProducts([
                                ...linkedPackProducts,
                                {
                                  _id: String(match._id),
                                  sku: match.sku,
                                  status: match.status,
                                  packName: match.packName || match.name,
                                  price: Number(match.sellingPrice ?? match.price?.selling ?? 0),
                                  originalPrice: match.mrp ?? match.price?.original,
                                  lensesPerBox: match.lensesPerBox,
                                },
                              ]);
                              if (!getValues('contactPackGroupId')) {
                                setValue('contactPackGroupId', crypto.randomUUID());
                              }
                              setPackLinkQuery('');
                              showToast(`Linked ${match.packName || match.name}. Save to apply.`, 'success');
                            } catch {
                              showToast('Failed to search products', 'error');
                            } finally {
                              setPackLinkBusy(false);
                            }
                          }}
                          className="bg-[#2A2A2D] hover:bg-[#3A3A3D] text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg px-4 py-2.5 transition-colors cursor-pointer border border-zinc-700"
                        >
                          {packLinkBusy ? 'Linking…' : 'Link Product'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-[#2A2A2D]/40">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-white text-xs font-bold uppercase tracking-wider text-[#D4A04D]">Configure Power Options & Pricing</h4>
                        <p className="text-[10px] text-gray-500">Define available power options (-0.50 to -10.00, Plano, +0.50 to +6.00) and pricing for each.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const currentSellingPrice = watch('sellingPrice') || 999;
                            const defaultNegativePowers = [
                              '-0.50', '-0.75', '-1.00', '-1.25', '-1.50', '-1.75', '-2.00',
                              '-2.25', '-2.50', '-2.75', '-3.00', '-3.25', '-3.50', '-3.75',
                              '-4.00', '-4.25', '-4.50', '-4.75', '-5.00', '-5.25', '-5.50',
                              '-5.75', '-6.00'
                            ];
                            const current = [...(formValues.contactPowers || [])];
                            defaultNegativePowers.forEach(pow => {
                              if (!current.some(cp => cp.power === pow)) {
                                current.push({ power: pow, price: currentSellingPrice });
                              }
                            });
                            setValue('contactPowers', current);
                            showToast('Added standard powers (-0.50 to -6.00)', 'success');
                          }}
                          className="bg-[#2A2A2D] hover:bg-[#3A3A3D] text-[#D4A04D] font-extrabold text-[9px] uppercase tracking-wider rounded-lg px-3 py-1.5 transition-colors cursor-pointer border border-[#D4A04D]/30"
                        >
                          + Quick Add (-0.50 to -6.00)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setValue('contactPowers', []);
                            showToast('Cleared power options', 'error');
                          }}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-extrabold text-[9px] uppercase tracking-wider rounded-lg px-3 py-1.5 transition-colors cursor-pointer border border-red-500/20"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-end gap-4 bg-[#0B0B0C] p-4 rounded-xl border border-zinc-800/80">
                      <div className="flex-1 min-w-[120px]">
                        <label className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block mb-1">Power Value</label>
                        <input
                          type="text"
                          id="new-contact-power"
                          placeholder="e.g. -1.25 or Plano"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#D4A04D]"
                        />
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <label className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block mb-1">Price (₹)</label>
                        <input
                          type="number"
                          id="new-contact-price"
                          placeholder={`e.g. ${watch('sellingPrice') || 999}`}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#D4A04D]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const powerInput = document.getElementById('new-contact-power') as HTMLInputElement;
                          const priceInput = document.getElementById('new-contact-price') as HTMLInputElement;
                          const pValue = powerInput?.value?.trim();
                          const rawPrice = parseFloat(priceInput?.value);
                          const price = !isNaN(rawPrice) && rawPrice >= 0 ? rawPrice : (watch('sellingPrice') || 0);

                          if (!pValue) {
                            showToast('Power value is required', 'error');
                            return;
                          }

                          const currentPowers = [...(formValues.contactPowers || [])];
                          if (currentPowers.some(cp => cp.power.toLowerCase() === pValue.toLowerCase())) {
                            showToast('This power value already exists', 'error');
                            return;
                          }

                          currentPowers.push({ power: pValue, price });
                          setValue('contactPowers', currentPowers);

                          if (powerInput) powerInput.value = '';
                          if (priceInput) priceInput.value = '';
                          showToast(`Added power ${pValue}`, 'success');
                        }}
                        className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg px-4 py-2.5 transition-colors cursor-pointer border-none"
                      >
                        Add Option
                      </button>
                    </div>

                    {formValues.contactPowers && formValues.contactPowers.length > 0 ? (
                      <div className="overflow-hidden border border-zinc-800/80 rounded-xl bg-[#0B0B0C]">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="bg-zinc-900/40 text-gray-400 uppercase text-[9px] font-extrabold tracking-wider border-b border-[#2A2A2D]/40">
                              <th className="py-2.5 px-4">Power</th>
                              <th className="py-2.5 px-4">Price</th>
                              <th className="py-2.5 px-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#2A2A2D]/30 text-gray-300 font-semibold">
                            {formValues.contactPowers.map((item, idx) => (
                              <tr key={idx} className="hover:bg-zinc-900/10">
                                <td className="py-2.5 px-4 text-white font-bold">{item.power}</td>
                                <td className="py-2.5 px-4 text-yellow-400">₹{item.price}</td>
                                <td className="py-2.5 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const filtered = formValues.contactPowers.filter((_, i) => i !== idx);
                                      setValue('contactPowers', filtered);
                                      showToast('Power option removed', 'success');
                                    }}
                                    className="text-red-400 hover:text-red-500 font-bold bg-transparent border-none cursor-pointer text-xs"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-[#0B0B0C] border border-dashed border-zinc-800 rounded-xl text-gray-600 text-xs italic">
                        No power options configured yet. Add them above or click Quick Add.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isSolutionProduct && (
                <div className="bg-[#18181A] p-6 rounded-2xl border border-[#2A2A2D]/40 space-y-4">
                  <div>
                    <h3 className="text-white text-xs font-extrabold uppercase tracking-wider text-[#D4A04D]">Quantity / Volume Options</h3>
                    <p className="text-[10px] text-gray-400">Configure the volume variants customers can pick (e.g. 60 ml, 120 ml, 360 ml), each with its own MRP and selling price.</p>
                  </div>

                  {/* Variant Manual Input Row */}
                  <div className="flex flex-wrap items-end gap-3 bg-[#0B0B0C] p-4 rounded-xl border border-zinc-800/80">
                    <div className="flex-1 min-w-[120px]">
                      <label className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block mb-1">Volume / Title</label>
                      <input
                        type="text"
                        id="new-solution-volume"
                        placeholder="e.g. 60 ml"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#D4A04D]"
                      />
                    </div>
                    <div className="w-28">
                      <label className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block mb-1">Price (₹)</label>
                      <input
                        type="number"
                        id="new-solution-price"
                        placeholder="e.g. 149"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#D4A04D]"
                      />
                    </div>
                    <div className="w-28">
                      <label className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block mb-1">MRP (₹)</label>
                      <input
                        type="number"
                        id="new-solution-original-price"
                        placeholder="e.g. 199"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#D4A04D]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const volInput = document.getElementById('new-solution-volume') as HTMLInputElement;
                        const priceInput = document.getElementById('new-solution-price') as HTMLInputElement;
                        const origInput = document.getElementById('new-solution-original-price') as HTMLInputElement;

                        const volume = volInput?.value?.trim();
                        const price = parseFloat(priceInput?.value);
                        const origPrice = parseFloat(origInput?.value);

                        if (!volume) {
                          showToast('Volume / title is required (e.g. 60 ml)', 'error');
                          return;
                        }
                        if (isNaN(price) || price < 0) {
                          showToast('Valid selling price is required', 'error');
                          return;
                        }
                        if (solutionVariantConfigs.some(v => v.volume.toLowerCase() === volume.toLowerCase())) {
                          showToast('This volume option already exists', 'error');
                          return;
                        }

                        setSolutionVariantConfigs([
                          ...solutionVariantConfigs,
                          { volume, price, originalPrice: !isNaN(origPrice) ? origPrice : undefined }
                        ]);

                        if (volInput) volInput.value = '';
                        if (priceInput) priceInput.value = '';
                        if (origInput) origInput.value = '';
                        showToast(`Added volume option ${volume}`, 'success');
                      }}
                      className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg px-4 py-2.5 transition-colors cursor-pointer border-none"
                    >
                      Add Option
                    </button>
                  </div>

                  {/* Variants Table */}
                  {solutionVariantConfigs.length > 0 ? (
                    <div className="overflow-hidden border border-zinc-800/80 rounded-xl bg-[#0B0B0C]">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-zinc-900/40 text-gray-400 uppercase text-[9px] font-extrabold tracking-wider border-b border-[#2A2A2D]/40">
                            <th className="py-2.5 px-4">Volume</th>
                            <th className="py-2.5 px-4">Selling Price</th>
                            <th className="py-2.5 px-4">MRP (Original)</th>
                            <th className="py-2.5 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2A2A2D]/30 text-gray-300 font-semibold">
                          {solutionVariantConfigs.map((item, idx) => (
                            <tr key={idx} className="hover:bg-zinc-900/10">
                              <td className="py-2.5 px-4 text-white font-bold">{item.volume}</td>
                              <td className="py-2.5 px-4 text-[#D4A04D] font-extrabold">₹{item.price}</td>
                              <td className="py-2.5 px-4 text-gray-500 line-through">{item.originalPrice ? `₹${item.originalPrice}` : '-'}</td>
                              <td className="py-2.5 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSolutionVariantConfigs(solutionVariantConfigs.filter((_, i) => i !== idx))}
                                  className="text-red-400 hover:text-red-300 text-xs font-bold bg-red-500/10 px-2 py-1 rounded"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-[#0B0B0C] border border-dashed border-zinc-800 rounded-xl text-gray-500 text-xs italic">
                      No volume options added yet. Add one above (e.g. 60 ml, 120 ml, 360 ml, 500 ml).
                    </div>
                  )}
                </div>
              )}

              {/* Long Description removed */}

              {/* Tags removed */}
            </div>

          {/* SECTION 2: PRICING ENGINE & MEMBERSHIP PRICING
              Hidden for contact lenses / solutions — those use pack, power, or volume prices. */}
          {!hideProductLevelPricing && (
          <div className="space-y-6 mb-12">
              <h2 className="text-white text-base font-extrabold uppercase tracking-wider border-b border-[#2A2A2D] pb-3 text-[#D4A04D]">Step 2: Pricing Configuration</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#18181A] p-6 rounded-2xl border border-[#2A2A2D]/40">
                {/* MRP */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">MRP (₹) *</label>
                  <input
                    type="number"
                    {...register('mrp', { valueAsNumber: true })}
                    className={`w-full bg-[#0B0B0C] border rounded-xl px-4 py-2.5 text-white text-sm font-bold focus:outline-none ${
                      errors.mrp ? 'border-red-500 animate-pulse' : 'border-[#2A2A2D] focus:border-[#D4A04D]'
                    }`}
                  />
                  {errors.mrp && <p className="text-red-400 text-[10px] mt-1 font-semibold">{errors.mrp.message}</p>}
                </div>

                {/* Selling Price */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    {...register('sellingPrice', { valueAsNumber: true })}
                    className={`w-full bg-[#0B0B0C] border rounded-xl px-4 py-2.5 text-white text-sm font-bold focus:outline-none ${
                      errors.sellingPrice ? 'border-red-500 animate-pulse' : 'border-[#2A2A2D] focus:border-[#D4A04D]'
                    }`}
                  />
                  {errors.sellingPrice && <p className="text-red-400 text-[10px] mt-1 font-semibold">{errors.sellingPrice.message}</p>}
                </div>
              </div>



              {/* MEMBERSHIP PRICING TOGGLE */}
              <div className="border-t border-[#2A2A2D]/60 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white text-xs font-extrabold uppercase tracking-wider text-[#D4A04D]">Enable Membership Pricing</h3>
                    <p className="text-[10px] text-gray-400">Offer special discounted pricing to Lenskart Gold & VIP members</p>
                  </div>
                  <input
                    type="checkbox"
                    {...register('enableMemberPricing')}
                    className="w-10 h-5 accent-[#D4A04D] cursor-pointer"
                  />
                </div>

                {enableMemberPricingField && (
                  <div className="max-w-sm bg-[#18181A] p-6 rounded-2xl border border-[#2A2A2D]/40">
                    <div>
                      <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Gold Member Price (₹) *</label>
                      <input
                        type="number"
                        {...register('memberPrices.goldMemberPrice', { valueAsNumber: true })}
                        className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-xs focus:border-[#D4A04D] focus:outline-none font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 3: FRAME SPECIFICATIONS */}
          {!isContactLenses && (
            <div className="space-y-6 mb-12">
              <h2 className="text-white text-base font-extrabold uppercase tracking-wider border-b border-[#2A2A2D] pb-3 text-[#D4A04D]">Step 3: Frame Specifications</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Frame Type */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Frame Type *</label>
                  <select
                    {...register('frameType')}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  >
                    <option value="Full Rim">Full Rim</option>
                    <option value="Half Rim">Half Rim</option>
                    <option value="Rimless">Rimless</option>
                  </select>
                </div>

                {/* Frame Shape */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Frame Shape *</label>
                  <select
                    {...register('frameShape')}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  >
                    {availableShapes.map((s) => (
                      <option key={s.slug} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Material */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Material *</label>
                  <select
                    {...register('material')}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  >
                    <option value="Metal">Metal</option>
                    <option value="Titanium">Titanium</option>
                    <option value="TR90">TR90</option>
                    <option value="Acetate">Acetate</option>
                    <option value="Plastic">Plastic</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Primary Color */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Frame Colors (comma-separated)</label>
                  <input
                    type="text"
                    {...register('primaryColor')}
                    placeholder="e.g. Black, Brown, Gold"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none font-bold"
                  />
                </div>

                {/* Secondary Color */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Secondary Color</label>
                  <input
                    type="text"
                    {...register('secondaryColor')}
                    placeholder="e.g. Gold highlights"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>

                {/* Frame Weight */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Frame Weight</label>
                  <input
                    type="text"
                    {...register('frameWeight')}
                    placeholder="e.g. 14g (Extra light)"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>
              </div>

              {/* Shapes (multi-select) — this is the array used by the storefront's
                  "Shape & Style" filter and the home-page shape picker; distinct from
                  the single Frame Shape dropdown above. */}
              <div>
                <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Shapes (for Shape & Style filter)</label>
                {subCategoryModalShapes.length > 0 ? (
                  <p className="text-gray-500 text-[10px] mb-2">Scoped to the shapes configured on "{matchedSubForShapes?.name}" (Categories → edit subcategory).</p>
                ) : currentSubCategory ? (
                  <p className="text-gray-500 text-[10px] mb-2">This subcategory has no shape list configured — showing all shapes.</p>
                ) : (
                  <p className="text-gray-500 text-[10px] mb-2">Select a subcategory above to scope this list.</p>
                )}
                <div className="flex flex-wrap gap-4 select-none">
                  {(subCategoryModalShapes.length > 0
                    ? availableShapes.filter((s) => subCategoryModalShapes.some((m) => m.toLowerCase() === s.name.toLowerCase()))
                    : availableShapes
                  ).map((s) => {
                    const currentShapes = formValues.shape || [];
                    const isChecked = currentShapes.includes(s.name);
                    return (
                      <label
                        key={s.slug || s.name}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${isChecked ? 'bg-[#D4A04D]/10 text-[#D4A04D] border-[#D4A04D]/30' : 'bg-[#0B0B0C] text-gray-400 border-zinc-800 hover:text-white'}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setValue('shape', [...currentShapes, s.name]);
                            } else {
                              setValue('shape', currentShapes.filter((v: string) => v !== s.name));
                            }
                          }}
                          className="hidden"
                        />
                        <span>{s.name}</span>
                      </label>
                    );
                  })}
                  {availableShapes.length === 0 && (
                    <p className="text-gray-500 text-xs">No shapes configured yet. Add shapes under Admin → Shapes.</p>
                  )}
                </div>
              </div>

              {renderColorStockEditor()}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Country of Origin */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Country of Origin</label>
                  <input
                    type="text"
                    {...register('countryOfOrigin')}
                    placeholder="e.g. India"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>

                {/* Manufacturer */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Manufacturer</label>
                  <input
                    type="text"
                    {...register('manufacturer')}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>

                {/* Warranty */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Warranty</label>
                  <input
                    type="text"
                    {...register('warranty')}
                    placeholder="e.g. 1 Year Brand Warranty"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>

                {/* Return Policy */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Return Policy</label>
                  <input
                    type="text"
                    {...register('returnPolicy')}
                    placeholder="e.g. 14-Day Returnable"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>

                {/* Delivery Info */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Delivery Info</label>
                  <input
                    type="text"
                    {...register('deliveryInfo')}
                    placeholder="e.g. 5-7 Days Delivery"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>
              </div>

              {/* Feature Tags Selector */}
              <div className="grid grid-cols-1 gap-6 mt-6">
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Feature Tags / Search Tags (comma-separated)</label>
                  <input
                    type="text"
                    {...register('tags')}
                    placeholder="e.g. Lightweight, Flexible, Skin Friendly, Durable"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none font-bold"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['Lightweight', 'Flexible', 'Skin Friendly', 'Durable'].map(tag => {
                      const currentTagsStr = formValues.tags || '';
                      const currentTagsList = currentTagsStr.split(',').map((t: string) => t.trim().toLowerCase());
                      const isPresent = currentTagsList.includes(tag.toLowerCase());
                      return (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => {
                            const list = currentTagsStr.split(',').map((t: string) => t.trim()).filter(Boolean);
                            const idx = list.findIndex(t => t.toLowerCase() === tag.toLowerCase());
                            if (idx >= 0) {
                              list.splice(idx, 1);
                            } else {
                              list.push(tag);
                            }
                            setValue('tags', list.join(', '));
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all select-none cursor-pointer border ${
                            isPresent 
                              ? 'bg-[#D4A04D]/15 border-[#D4A04D]/35 text-[#D4A04D]' 
                              : 'bg-[#0B0B0C] border-zinc-800 text-gray-400 hover:text-white'
                          }`}
                        >
                          {isPresent ? '✓ ' : '+ '} {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LENS SPECIFICATIONS & TRUST INFO FOR CONTACT LENSES */}
          {isContactLenses && (
            <div className="space-y-6 mb-12">
              <h2 className="text-white text-base font-extrabold uppercase tracking-wider border-b border-[#2A2A2D] pb-3 text-[#D4A04D]">Step 3: Lens Specifications & Product Details</h2>
              
              {/* Technical Specifications */}
              {!isNonPowerContactProduct && (
              <div className="bg-[#18181A] p-5 rounded-2xl border border-[#2A2A2D]/40 space-y-4">
                <h3 className="text-white text-xs font-bold uppercase tracking-wider text-gray-300">Technical Lens Specifications</h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Lens Material */}
                  <div>
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Lens Material</label>
                    <input
                      type="text"
                      {...register('lensMaterial')}
                      placeholder="e.g. Silicone Hydrogel"
                      className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3.5 py-2 text-white text-xs focus:border-[#D4A04D] focus:outline-none font-bold"
                    />
                  </div>

                  {/* Water Content */}
                  <div>
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Water Content</label>
                    <input
                      type="text"
                      {...register('waterContent')}
                      placeholder="e.g. 58% Water"
                      className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3.5 py-2 text-white text-xs focus:border-[#D4A04D] focus:outline-none font-bold"
                    />
                  </div>

                  {/* Base Curve (BC) */}
                  <div>
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Base Curve (BC)</label>
                    <input
                      type="text"
                      {...register('baseCurve')}
                      placeholder="e.g. 8.6 mm"
                      className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3.5 py-2 text-white text-xs focus:border-[#D4A04D] focus:outline-none"
                    />
                  </div>

                  {/* Diameter (DIA) */}
                  <div>
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Diameter (DIA)</label>
                    <input
                      type="text"
                      {...register('diameter')}
                      placeholder="e.g. 14.2 mm"
                      className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3.5 py-2 text-white text-xs focus:border-[#D4A04D] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Packaging */}
                  <div>
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Packaging</label>
                    <input
                      type="text"
                      {...register('packaging')}
                      placeholder="e.g. 10 Lenses/box"
                      className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3.5 py-2 text-white text-xs focus:border-[#D4A04D] focus:outline-none"
                    />
                  </div>

                  {/* Disposable Type */}
                  <div>
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Disposable Type</label>
                    <input
                      type="text"
                      {...register('contactDisposableType')}
                      placeholder="e.g. Daily Disposable"
                      className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3.5 py-2 text-white text-xs focus:border-[#D4A04D] focus:outline-none font-bold"
                    />
                  </div>

                  {/* Power Range */}
                  <div>
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Power Range</label>
                    <input
                      type="text"
                      {...register('powerRange')}
                      placeholder="e.g. -0.50 D to -10.00 D"
                      className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3.5 py-2 text-white text-xs focus:border-[#D4A04D] focus:outline-none"
                    />
                  </div>

                  {/* Lens Usage */}
                  <div>
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Lens Usage / Type</label>
                    <input
                      type="text"
                      {...register('lensUsage')}
                      placeholder="e.g. Single Vision / Toric"
                      className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3.5 py-2 text-white text-xs focus:border-[#D4A04D] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              )}

              {/* Trust & Delivery Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Country of Origin */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Country of Origin</label>
                  <input
                    type="text"
                    {...register('countryOfOrigin')}
                    placeholder="e.g. India"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none font-bold"
                  />
                </div>

                {/* Manufacturer */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Manufacturer</label>
                  <input
                    type="text"
                    {...register('manufacturer')}
                    placeholder="e.g. EyeGlaze Ltd"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>

                {/* Warranty */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Warranty</label>
                  <input
                    type="text"
                    {...register('warranty')}
                    placeholder="e.g. 1 Year Brand Warranty"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>

                {/* Return Policy */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Return Policy</label>
                  <input
                    type="text"
                    {...register('returnPolicy')}
                    placeholder="e.g. 14-Day Returnable"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>

                {/* Delivery Info */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Delivery Info</label>
                  <input
                    type="text"
                    {...register('deliveryInfo')}
                    placeholder="e.g. 5-7 Days Delivery"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Linked Lens Solutions (cart cross-sell) */}
              {!isNonPowerContactProduct && (
              <div className="bg-[#18181A] p-5 rounded-2xl border border-[#2A2A2D]/40 space-y-3">
                <h3 className="text-white text-xs font-bold uppercase tracking-wider text-gray-300">Lens Solutions Cross-Sell</h3>
                <p className="text-gray-500 text-[10px]">
                  Choose which solution products are offered in the "Choose Lens Solution" popup when this lens is added to cart.
                  Any product under Contact Lens → Solution shows here automatically; you can also flag one manually with "Mark as Lens Solution" (Step 6).
                </p>
                {availableSolutions.length === 0 ? (
                  <div className="text-gray-600 text-[10px] italic py-2">
                    No solution products found yet. Create one under Contact Lens → Solution &amp; Accessories → Solution.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {availableSolutions.map((sol) => {
                      const links: Array<{ solutionId: string; discountPercent?: number; overridePrice?: number }> = watch('linkedSolutions') || [];
                      const linkIdx = links.findIndex((l) => l.solutionId === sol._id);
                      const link = linkIdx >= 0 ? links[linkIdx] : undefined;
                      const selected = !!link;
                      const basePrice = sol.price?.selling ?? sol.sellingPrice ?? sol.mrp ?? 0;
                      const finalPrice = link?.overridePrice != null
                        ? link.overridePrice
                        : link?.discountPercent
                          ? Math.round(basePrice * (1 - link.discountPercent / 100))
                          : basePrice;

                      const updateLink = (patch: Partial<{ discountPercent?: number; overridePrice?: number }>) => {
                        const next = [...links];
                        if (linkIdx >= 0) {
                          next[linkIdx] = { ...next[linkIdx], ...patch };
                          setValue('linkedSolutions', next, { shouldValidate: true });
                        }
                      };

                      return (
                        <div
                          key={sol._id}
                          className={`rounded-lg border transition-colors ${
                            selected ? 'border-[#D4A04D] bg-[#D4A04D]/10' : 'border-[#2A2A2D]'
                          }`}
                        >
                          <label className="flex items-center gap-2 px-3 py-2 cursor-pointer text-xs font-semibold text-gray-300">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setValue('linkedSolutions', [...links, { solutionId: sol._id }], { shouldValidate: true });
                                } else {
                                  setValue('linkedSolutions', links.filter((l) => l.solutionId !== sol._id), { shouldValidate: true });
                                }
                              }}
                              className="w-4 h-4 accent-[#D4A04D] shrink-0"
                            />
                            <span className={`truncate flex-1 ${selected ? 'text-[#D4A04D]' : ''}`}>{sol.name}</span>
                            <span className="text-gray-400 text-[10px] font-bold shrink-0">₹{basePrice}</span>
                          </label>

                          {selected && (
                            <div className="flex flex-wrap items-end gap-3 px-3 pb-3 pt-1 border-t border-[#2A2A2D]/60">
                              <div className="w-32">
                                <label className="text-gray-500 text-[9px] font-bold uppercase tracking-wider block mb-1">Discount %</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  placeholder="e.g. 10"
                                  value={link?.discountPercent ?? ''}
                                  onChange={(e) => updateLink({ discountPercent: e.target.value === '' ? undefined : Number(e.target.value), overridePrice: undefined })}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-[#D4A04D]"
                                />
                              </div>
                              <div className="w-32">
                                <label className="text-gray-500 text-[9px] font-bold uppercase tracking-wider block mb-1">Or Fixed Price (₹)</label>
                                <input
                                  type="number"
                                  min={0}
                                  placeholder={`e.g. ${basePrice}`}
                                  value={link?.overridePrice ?? ''}
                                  onChange={(e) => updateLink({ overridePrice: e.target.value === '' ? undefined : Number(e.target.value), discountPercent: undefined })}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-[#D4A04D]"
                                />
                              </div>
                              <div className="text-[10px] text-gray-500 pb-2">
                                Price shown in popup: <span className="text-[#D4A04D] font-extrabold">₹{finalPrice}</span>
                                {finalPrice !== basePrice && <span className="line-through ml-1 text-gray-600">₹{basePrice}</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              )}
            </div>
          )}

          {/* SECTION 4: MEASUREMENTS */}
          {!isContactLenses && (
            <>
              <div className="space-y-6 mb-12">
              <h2 className="text-white text-base font-extrabold uppercase tracking-wider border-b border-[#2A2A2D] pb-3 text-[#D4A04D]">Step 4: Measurements & Fit</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* Lens Width */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Lens Width (mm)</label>
                  <input
                    type="number"
                    {...register('lensWidth', { valueAsNumber: true })}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none font-bold"
                  />
                </div>

                {/* Bridge Width */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Bridge Width (mm)</label>
                  <input
                    type="number"
                    {...register('bridgeWidth', { valueAsNumber: true })}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none font-bold"
                  />
                </div>

                {/* Temple Length */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Temple Length (mm)</label>
                  <input
                    type="number"
                    {...register('templeLength', { valueAsNumber: true })}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none font-bold"
                  />
                </div>

                {/* Frame Width */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Frame Width (mm)</label>
                  <input
                    type="number"
                    {...register('frameWidth', { valueAsNumber: true })}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Frame Size */}
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Default/Primary Frame Size *</label>
                  <select
                    {...register('frameSize')}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none font-bold"
                  >
                    <option value="Small">{isKids ? 'Juniors | 5 to 8 years' : 'Small'}</option>
                    <option value="Medium">{isKids ? 'Tweens | 8 to 12 years' : 'Medium'}</option>
                    <option value="Large">{isKids ? 'Teens | 12 to 17 years' : 'Large'}</option>
                  </select>
                </div>
              </div>

              {/* Available Sizes Checklist */}
              <div>
                <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-3">Available Sizes *</label>
                <div className="flex flex-wrap gap-4 select-none mb-6">
                  {['Small', 'Medium', 'Large'].map(size => {
                    const currentSizes = formValues.availableSizes || [];
                    const isChecked = currentSizes.includes(size as any);
                    const labelText = isKids
                      ? (size === 'Small' ? 'Juniors | 5 to 8 years' : size === 'Medium' ? 'Tweens | 8 to 12 years' : 'Teens | 12 to 17 years')
                      : size;
                    return (
                      <label 
                        key={size}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${isChecked ? 'bg-[#D4A04D]/10 text-[#D4A04D] border-[#D4A04D]/30' : 'bg-[#0B0B0C] text-gray-400 border-zinc-800 hover:text-white'}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setValue('availableSizes', [...currentSizes, size as any]);
                            } else {
                              setValue('availableSizes', currentSizes.filter(s => s !== size));
                            }
                          }}
                          className="hidden"
                        />
                        <span>{labelText}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Size-Specific Measurements sub-forms */}
                <div className="space-y-6">
                  {(formValues.availableSizes || []).map(size => {
                    const headerLabel = isKids
                      ? (size === 'Small' ? 'Juniors | 5 to 8 years' : size === 'Medium' ? 'Tweens | 8 to 12 years' : 'Teens | 12 to 17 years')
                      : size;
                    return (
                      <div key={size} className="bg-[#18181A] p-5 rounded-2xl border border-[#2A2A2D]/40 space-y-4">
                        <h4 className="text-white text-xs font-extrabold uppercase tracking-wider text-[#D4A04D]">{headerLabel} Size Specific Measurements</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block mb-1">Lens Width (mm)</label>
                            <input
                              type="number"
                              placeholder="e.g. 50"
                              {...register(`sizeMeasurements.${size}.lensWidth` as any, { valueAsNumber: true })}
                              className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-white text-xs focus:border-[#D4A04D] focus:outline-none font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block mb-1">Bridge Width (mm)</label>
                            <input
                              type="number"
                              placeholder="e.g. 18"
                              {...register(`sizeMeasurements.${size}.bridgeWidth` as any, { valueAsNumber: true })}
                              className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-white text-xs focus:border-[#D4A04D] focus:outline-none font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block mb-1">Temple Length (mm)</label>
                            <input
                              type="number"
                              placeholder="e.g. 140"
                              {...register(`sizeMeasurements.${size}.templeLength` as any, { valueAsNumber: true })}
                              className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-white text-xs focus:border-[#D4A04D] focus:outline-none font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-gray-400 text-[9px] font-bold uppercase tracking-wider block mb-1">Frame Width (mm)</label>
                            <input
                              type="number"
                              placeholder="e.g. 138"
                              {...register(`sizeMeasurements.${size}.frameWidth` as any, { valueAsNumber: true })}
                              className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-white text-xs focus:border-[#D4A04D] focus:outline-none font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Face Shape Compatibility */}
              <div>
                <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-3">Face Shape Compatibility</label>
                <div className="flex flex-wrap gap-4 select-none">
                  {['Round', 'Oval', 'Square', 'Heart', 'Diamond', 'Rectangle', 'Triangle'].map(shape => {
                    const currentShapes = formValues.faceShapeCompatibility || [];
                    const isChecked = currentShapes.includes(shape);
                    return (
                      <label 
                        key={shape}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${isChecked ? 'bg-[#D4A04D]/10 text-[#D4A04D] border-[#D4A04D]/30' : 'bg-[#0B0B0C] text-gray-400 border-zinc-800 hover:text-white'}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setValue('faceShapeCompatibility', [...currentShapes, shape]);
                            } else {
                              setValue('faceShapeCompatibility', currentShapes.filter(s => s !== shape));
                            }
                          }}
                          className="hidden"
                        />
                        <span>{shape}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>




              {/* SECTION 6 & 7: LENS CONFIGURATION - Hidden for Contact Lenses */}
              {!isContactLenses && (
                <div className="space-y-6 mb-12">
                  <h2 className="text-white text-base font-extrabold uppercase tracking-wider border-b border-[#2A2A2D] pb-3 text-[#D4A04D]">Step 5: Lens Type & Lenses</h2>
                  <div>
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-3">Select Compatible Lens Types *</label>
                    <div className="flex flex-wrap gap-4 select-none">
                      {availableLensTypes
                        .filter((type) => type.category?.toLowerCase() === formValues.category?.toLowerCase())
                        .map((type) => {
                        const currentTypes = formValues.lensTypes || [];
                        const isChecked = currentTypes.includes(type._id);
                        return (
                          <label 
                            key={type._id}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${isChecked ? 'bg-[#D4A04D]/10 text-[#D4A04D] border-[#D4A04D]/30' : 'bg-[#0B0B0C] text-gray-400 border-zinc-800 hover:text-white'}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setValue('lensTypes', [...currentTypes, type._id]);
                                  setActiveLensTypeTab(type._id);
                                } else {
                                  setValue('lensTypes', currentTypes.filter(id => id !== type._id));
                                }
                              }}
                              className="hidden"
                            />
                            <span>{type.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Lenses Tab View */}
                  {watchedLensTypes.length > 0 && (
                    <div className="space-y-4 pt-4">
                      {/* Tab Navigation */}
                      <div className="flex border-b border-[#2A2A2D] overflow-x-auto no-scrollbar scroll-smooth">
                        {watchedLensTypes.map((typeId) => {
                          const typeDetails = availableLensTypes.find(t => t._id === typeId);
                          if (!typeDetails) return null;
                          const lenses = lensesMap[typeId] || [];
                          const count = lenses.length;
                          const isActive = activeLensTypeTab === typeId;

                          return (
                            <button
                              key={typeId}
                              type="button"
                              onClick={() => setActiveLensTypeTab(typeId)}
                              className={`flex items-center whitespace-nowrap px-5 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all duration-200 group ${
                                isActive
                                  ? 'border-[#D4A04D] text-[#D4A04D] bg-[#D4A04D]/5'
                                  : 'border-transparent text-gray-400 hover:text-white hover:border-zinc-700'
                              }`}
                            >
                              <span>{typeDetails.name}</span>
                              <span className={`ml-2 px-1.5 py-0.5 text-[9px] rounded font-extrabold transition-colors ${
                                isActive
                                  ? 'bg-[#D4A04D]/20 text-[#D4A04D]'
                                  : 'bg-[#2A2A2D] text-gray-400 group-hover:bg-zinc-800 group-hover:text-white'
                              }`}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Tab Panel */}
                      {(() => {
                          if (!activeLensTypeTab) return null;
                        const typeDetails = availableLensTypes.find(t => t._id === activeLensTypeTab);
                        if (!typeDetails) return null;
                        
                        const globalLenses = lensesMap[activeLensTypeTab] || [];
                        const productSpecificLenses = (formValues.dynamicLensPricing || []).filter((o: any) => {
                          const isCorrectCategory = o.lensCategory.toLowerCase() === typeDetails.name.toLowerCase();
                          const notGlobal = !globalLenses.some((gl: any) => gl.name === o.lensName);
                          return isCorrectCategory && notGlobal;
                        });

                        const lenses = [
                          ...globalLenses,
                          ...productSpecificLenses.map((pl: any) => ({
                            _id: pl._id || `custom-${pl.lensName}`,
                            name: pl.lensName,
                            basePrice: pl.regularPrice,
                            status: pl.status || 'Active',
                            isProductSpecific: true,
                            minSph: pl.minSph !== undefined ? pl.minSph : -20,
                            maxSph: pl.maxSph !== undefined ? pl.maxSph : 20,
                            minCyl: pl.minCyl !== undefined ? pl.minCyl : -6,
                            maxCyl: pl.maxCyl !== undefined ? pl.maxCyl : 6
                          }))
                        ];

                        const isLoading = loadingLensesMap[activeLensTypeTab];

                        return (
                          <div className="bg-[#18181A] border border-[#2A2A2D] rounded-xl p-6 space-y-4 transition-all duration-300">
                            <div className="flex justify-between items-center pb-3 border-b border-[#2A2A2D]/60">
                              <div>
                                <h3 className="text-white text-sm font-extrabold uppercase tracking-wider text-[#D4A04D]">{typeDetails.name} Lenses</h3>
                                <p className="text-[10px] text-gray-400">Currently configured lenses under this category</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAddCustomLensForm(prev => prev === activeLensTypeTab ? null : activeLensTypeTab);
                                    setCustomLensName('');
                                    setCustomLensPrice('');
                                    setCustomLensMinSph('-20');
                                    setCustomLensMaxSph('20');
                                    setCustomLensMinCyl('-6');
                                    setCustomLensMaxCyl('6');
                                  }}
                                  className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg px-3 py-1.5 transition-colors cursor-pointer border-none"
                                >
                                  {showAddCustomLensForm === activeLensTypeTab ? '✕ Close Form' : '+ Add Product-Specific Lens'}
                                </button>
                                <div className="text-[10px] bg-zinc-900 border border-zinc-800 text-gray-400 px-3 py-1 rounded-lg">
                                  Total Lenses: <span className="text-white font-bold">{lenses.length}</span>
                                </div>
                              </div>
                            </div>

                            {isLoading ? (
                              <div className="py-8 text-center text-gray-500 text-xs italic animate-pulse">Loading associated lenses...</div>
                            ) : (lenses.length > 0 || showAddCustomLensForm === activeLensTypeTab) ? (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                  <thead>
                                    <tr className="text-gray-400 uppercase text-[9px] font-extrabold tracking-wider border-b border-[#2A2A2D]/40 pb-2">
                                      <th className="py-3 px-4">Lens Name</th>
                                      <th className="py-3 px-4">Base Price</th>
                                      <th className="py-3 px-4">Min SPH</th>
                                      <th className="py-3 px-4">Max SPH</th>
                                      <th className="py-3 px-4">Min CYL</th>
                                      <th className="py-3 px-4">Max CYL</th>
                                      <th className="py-3 px-4">Status</th>
                                      <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#2A2A2D]/30 text-gray-300">
                                    {showAddCustomLensForm === activeLensTypeTab && (
                                      <tr className="bg-zinc-900/40 border-b border-[#2A2A2D]">
                                        <td className="py-3 px-4">
                                          <input
                                            type="text"
                                            value={customLensName}
                                            onChange={(e) => setCustomLensName(e.target.value)}
                                            placeholder="Lens name (e.g. Premium Clear)"
                                            className="w-full max-w-md bg-[#0B0B0C] border border-[#2A2A2D] rounded px-2.5 py-1 text-white text-xs font-bold focus:border-[#D4A04D] focus:outline-none transition-colors"
                                            autoFocus
                                          />
                                        </td>
                                        <td className="py-3 px-4 font-bold">
                                          <div className="flex items-center gap-2">
                                            <span className="text-gray-500 text-xs">₹</span>
                                            <input
                                              type="number"
                                              value={customLensPrice}
                                              onChange={(e) => setCustomLensPrice(e.target.value)}
                                              placeholder="Price"
                                              className="w-24 bg-[#0B0B0C] border border-[#2A2A2D] rounded px-2.5 py-1 text-white text-xs font-bold focus:border-[#D4A04D] focus:outline-none transition-colors"
                                            />
                                          </div>
                                        </td>
                                        {/* Min SPH */}
                                        <td className="py-3 px-4">
                                          <input
                                            type="number"
                                            step="0.25"
                                            value={customLensMinSph}
                                            onChange={(e) => setCustomLensMinSph(e.target.value)}
                                            className="w-16 bg-[#0B0B0C] border border-[#2A2A2D] rounded px-2.5 py-1 text-white text-xs font-bold focus:border-[#D4A04D] focus:outline-none transition-colors"
                                          />
                                        </td>
                                        {/* Max SPH */}
                                        <td className="py-3 px-4">
                                          <input
                                            type="number"
                                            step="0.25"
                                            value={customLensMaxSph}
                                            onChange={(e) => setCustomLensMaxSph(e.target.value)}
                                            className="w-16 bg-[#0B0B0C] border border-[#2A2A2D] rounded px-2.5 py-1 text-white text-xs font-bold focus:border-[#D4A04D] focus:outline-none transition-colors"
                                          />
                                        </td>
                                        {/* Min CYL */}
                                        <td className="py-3 px-4">
                                          <input
                                            type="number"
                                            step="0.25"
                                            value={customLensMinCyl}
                                            onChange={(e) => setCustomLensMinCyl(e.target.value)}
                                            className="w-16 bg-[#0B0B0C] border border-[#2A2A2D] rounded px-2.5 py-1 text-white text-xs font-bold focus:border-[#D4A04D] focus:outline-none transition-colors"
                                          />
                                        </td>
                                        {/* Max CYL */}
                                        <td className="py-3 px-4">
                                          <input
                                            type="number"
                                            step="0.25"
                                            value={customLensMaxCyl}
                                            onChange={(e) => setCustomLensMaxCyl(e.target.value)}
                                            className="w-16 bg-[#0B0B0C] border border-[#2A2A2D] rounded px-2.5 py-1 text-white text-xs font-bold focus:border-[#D4A04D] focus:outline-none transition-colors"
                                          />
                                        </td>
                                        <td className="py-3 px-4">
                                          <span className="bg-[#D4A04D]/15 text-[#D4A04D] border border-[#D4A04D]/30 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                            Custom
                                          </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                          <div className="flex justify-end gap-3">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setShowAddCustomLensForm(null);
                                                setCustomLensName('');
                                                setCustomLensPrice('');
                                                setCustomLensMinSph('-20');
                                                setCustomLensMaxSph('20');
                                                setCustomLensMinCyl('-6');
                                                setCustomLensMaxCyl('6');
                                              }}
                                              className="text-gray-400 hover:text-white font-bold bg-transparent border-none cursor-pointer text-xs"
                                            >
                                              Cancel
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const trimmedName = customLensName.trim();
                                                if (!trimmedName) {
                                                  showToast('Lens name is required!', 'error');
                                                  return;
                                                }
                                                const price = parseFloat(customLensPrice);
                                                if (isNaN(price) || price < 0) {
                                                  showToast('Please enter a valid price!', 'error');
                                                  return;
                                                }

                                                const minSphVal = parseFloat(customLensMinSph);
                                                const maxSphVal = parseFloat(customLensMaxSph);
                                                const minCylVal = parseFloat(customLensMinCyl);
                                                const maxCylVal = parseFloat(customLensMaxCyl);

                                                if (isNaN(minSphVal) || isNaN(maxSphVal) || isNaN(minCylVal) || isNaN(maxCylVal)) {
                                                  showToast('Please enter valid numbers for prescription limits!', 'error');
                                                  return;
                                                }

                                                const nameLower = trimmedName.toLowerCase();
                                                const alreadyExists = (formValues.dynamicLensPricing || []).some(
                                                  (o: any) => o.lensName.toLowerCase() === nameLower
                                                ) || globalLenses.some((l: any) => l.name.toLowerCase() === nameLower);

                                                if (alreadyExists) {
                                                  showToast('A lens with this name already exists!', 'error');
                                                  return;
                                                }

                                                const currentPricing = [...(formValues.dynamicLensPricing || [])];
                                                currentPricing.push({
                                                  lensName: trimmedName,
                                                  lensCategory: typeDetails.name,
                                                  regularPrice: price,
                                                  goldPrice: Math.round(price * 0.9),
                                                  platinumPrice: Math.round(price * 0.8),
                                                  priority: 0,
                                                  status: 'Active' as const,
                                                  minSph: minSphVal,
                                                  maxSph: maxSphVal,
                                                  minCyl: minCylVal,
                                                  maxCyl: maxCylVal,
                                                });
                                                setValue('dynamicLensPricing', currentPricing);
                                                setShowAddCustomLensForm(null);
                                                setCustomLensName('');
                                                setCustomLensPrice('');
                                                setCustomLensMinSph('-20');
                                                setCustomLensMaxSph('20');
                                                setCustomLensMinCyl('-6');
                                                setCustomLensMaxCyl('6');
                                                showToast('Product-specific lens added successfully!', 'success');
                                              }}
                                              className="text-[#D4A04D] hover:text-[#C8923E] font-bold bg-transparent border-none cursor-pointer text-xs"
                                            >
                                              Save
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                    {lenses.map((lens: any) => {
                                      const override = (formValues.dynamicLensPricing || []).find(
                                        (o: any) => o.lensName === lens.name
                                      );
                                      const isOverridden = !!override;
                                      const isExcluded = !lens.isProductSpecific && override?.status === 'Inactive';
                                      const displayedStatus = isExcluded ? 'Inactive' : (lens.status || 'Active');

                                      return (
                                        <tr key={lens._id} className="hover:bg-zinc-900/30 transition-colors">
                                          <td className="py-3 px-4 font-semibold text-white">
                                            <div className="flex items-center gap-2">
                                              <span>{lens.name}</span>
                                              {lens.isProductSpecific ? (
                                                <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                  Custom
                                                </span>
                                              ) : isOverridden && !isExcluded ? (
                                                <span className="bg-[#D4A04D]/15 text-[#D4A04D] border border-[#D4A04D]/30 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                  Overridden
                                                </span>
                                              ) : null}
                                            </div>
                                          </td>
                                          <td className="py-3 px-4 font-bold">
                                            <div className="flex items-center gap-2">
                                              <span className="text-gray-500 text-xs">₹</span>
                                              <input
                                                type="number"
                                                value={isOverridden && !isExcluded ? override.regularPrice : ''}
                                                disabled={isExcluded}
                                                placeholder={String(lens.basePrice)}
                                                onChange={(e) => {
                                                  const valStr = e.target.value;
                                                  const currentPricing = [...(formValues.dynamicLensPricing || [])];
                                                  const idx = currentPricing.findIndex((item: any) => item.lensName === lens.name);

                                                  if (valStr.trim() === '') {
                                                    if (idx >= 0) {
                                                      currentPricing.splice(idx, 1);
                                                      setValue('dynamicLensPricing', currentPricing);
                                                    }
                                                  } else {
                                                    const newPrice = parseFloat(valStr);
                                                    if (!isNaN(newPrice)) {
                                                      const updatedItem = {
                                                        ...(idx >= 0 ? currentPricing[idx] : {}),
                                                        lensName: lens.name,
                                                        lensCategory: typeDetails.name,
                                                        regularPrice: newPrice,
                                                        goldPrice: Math.round(newPrice * 0.9),
                                                        platinumPrice: Math.round(newPrice * 0.8),
                                                        priority: 0,
                                                        status: 'Active' as const
                                                      };
                                                      if (idx >= 0) {
                                                        currentPricing[idx] = updatedItem;
                                                      } else {
                                                        currentPricing.push(updatedItem);
                                                      }
                                                      setValue('dynamicLensPricing', currentPricing);
                                                    }
                                                  }
                                                }}
                                                className="w-24 bg-[#0B0B0C] border border-[#2A2A2D] rounded px-2.5 py-1 text-white text-xs font-bold focus:border-[#D4A04D] focus:outline-none transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                              />
                                              {!isOverridden && (
                                                <span className="text-[9px] text-gray-500 font-normal italic">
                                                  (Global: ₹{lens.basePrice})
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          {/* Min SPH */}
                                          <td className="py-3 px-4">
                                            <input
                                              type="number"
                                              step="0.25"
                                              value={lens.isProductSpecific ? (override?.minSph ?? -20) : (lens.minSph ?? -20)}
                                              disabled={!lens.isProductSpecific || isExcluded}
                                              onChange={(e) => {
                                                const valStr = e.target.value;
                                                const currentPricing = [...(formValues.dynamicLensPricing || [])];
                                                const idx = currentPricing.findIndex((item: any) => item.lensName === lens.name);
                                                if (idx >= 0) {
                                                  currentPricing[idx] = {
                                                    ...currentPricing[idx],
                                                    minSph: valStr === '' ? -20 : parseFloat(valStr)
                                                  };
                                                  setValue('dynamicLensPricing', currentPricing);
                                                }
                                              }}
                                              className="w-16 bg-[#0B0B0C] border border-[#2A2A2D] rounded px-2.5 py-1 text-white text-xs font-bold focus:border-[#D4A04D] focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                          </td>
                                          {/* Max SPH */}
                                          <td className="py-3 px-4">
                                            <input
                                              type="number"
                                              step="0.25"
                                              value={lens.isProductSpecific ? (override?.maxSph ?? 20) : (lens.maxSph ?? 20)}
                                              disabled={!lens.isProductSpecific || isExcluded}
                                              onChange={(e) => {
                                                const valStr = e.target.value;
                                                const currentPricing = [...(formValues.dynamicLensPricing || [])];
                                                const idx = currentPricing.findIndex((item: any) => item.lensName === lens.name);
                                                if (idx >= 0) {
                                                  currentPricing[idx] = {
                                                    ...currentPricing[idx],
                                                    maxSph: valStr === '' ? 20 : parseFloat(valStr)
                                                  };
                                                  setValue('dynamicLensPricing', currentPricing);
                                                }
                                              }}
                                              className="w-16 bg-[#0B0B0C] border border-[#2A2A2D] rounded px-2.5 py-1 text-white text-xs font-bold focus:border-[#D4A04D] focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                          </td>
                                          {/* Min CYL */}
                                          <td className="py-3 px-4">
                                            <input
                                              type="number"
                                              step="0.25"
                                              value={lens.isProductSpecific ? (override?.minCyl ?? -6) : (lens.minCyl ?? -6)}
                                              disabled={!lens.isProductSpecific || isExcluded}
                                              onChange={(e) => {
                                                const valStr = e.target.value;
                                                const currentPricing = [...(formValues.dynamicLensPricing || [])];
                                                const idx = currentPricing.findIndex((item: any) => item.lensName === lens.name);
                                                if (idx >= 0) {
                                                  currentPricing[idx] = {
                                                    ...currentPricing[idx],
                                                    minCyl: valStr === '' ? -6 : parseFloat(valStr)
                                                  };
                                                  setValue('dynamicLensPricing', currentPricing);
                                                }
                                              }}
                                              className="w-16 bg-[#0B0B0C] border border-[#2A2A2D] rounded px-2.5 py-1 text-white text-xs font-bold focus:border-[#D4A04D] focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                          </td>
                                          {/* Max CYL */}
                                          <td className="py-3 px-4">
                                            <input
                                              type="number"
                                              step="0.25"
                                              value={lens.isProductSpecific ? (override?.maxCyl ?? 6) : (lens.maxCyl ?? 6)}
                                              disabled={!lens.isProductSpecific || isExcluded}
                                              onChange={(e) => {
                                                const valStr = e.target.value;
                                                const currentPricing = [...(formValues.dynamicLensPricing || [])];
                                                const idx = currentPricing.findIndex((item: any) => item.lensName === lens.name);
                                                if (idx >= 0) {
                                                  currentPricing[idx] = {
                                                    ...currentPricing[idx],
                                                    maxCyl: valStr === '' ? 6 : parseFloat(valStr)
                                                  };
                                                  setValue('dynamicLensPricing', currentPricing);
                                                }
                                              }}
                                              className="w-16 bg-[#0B0B0C] border border-[#2A2A2D] rounded px-2.5 py-1 text-white text-xs font-bold focus:border-[#D4A04D] focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                          </td>
                                          <td className="py-3 px-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                                              displayedStatus === 'Active' 
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                              {displayedStatus}
                                            </span>
                                          </td>
                                          <td className="py-3 px-4 text-right">
                                            {lens.isProductSpecific ? (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (confirm(`Remove product-specific lens "${lens.name}"?`)) {
                                                    const currentPricing = [...(formValues.dynamicLensPricing || [])];
                                                    const updatedPricing = currentPricing.filter(
                                                      (o: any) => o.lensName !== lens.name
                                                    );
                                                    setValue('dynamicLensPricing', updatedPricing);
                                                  }
                                                }}
                                                className="text-red-400 hover:text-red-500 font-bold bg-transparent border-none cursor-pointer text-xs"
                                              >
                                                Delete
                                              </button>
                                            ) : (
                                              <>
                                                {isExcluded ? (
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const currentPricing = [...(formValues.dynamicLensPricing || [])];
                                                      const idx = currentPricing.findIndex((item: any) => item.lensName === lens.name);
                                                      if (idx >= 0) {
                                                        currentPricing[idx] = {
                                                          ...currentPricing[idx],
                                                          status: 'Active'
                                                        };
                                                        setValue('dynamicLensPricing', currentPricing);
                                                      }
                                                    }}
                                                    className="text-green-400 hover:text-green-500 font-bold bg-transparent border-none cursor-pointer text-xs"
                                                  >
                                                    Restore
                                                  </button>
                                                ) : (
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const currentPricing = [...(formValues.dynamicLensPricing || [])];
                                                      const idx = currentPricing.findIndex((item: any) => item.lensName === lens.name);
                                                      if (idx >= 0) {
                                                        currentPricing[idx] = {
                                                          ...currentPricing[idx],
                                                          status: 'Inactive'
                                                        };
                                                      } else {
                                                        currentPricing.push({
                                                          lensName: lens.name,
                                                          lensCategory: typeDetails.name,
                                                          regularPrice: lens.basePrice,
                                                          goldPrice: Math.round(lens.basePrice * 0.9),
                                                          platinumPrice: Math.round(lens.basePrice * 0.8),
                                                          priority: 0,
                                                          status: 'Inactive'
                                                        });
                                                      }
                                                      setValue('dynamicLensPricing', currentPricing);
                                                    }}
                                                    className="text-red-400 hover:text-red-500 font-bold bg-transparent border-none cursor-pointer text-xs"
                                                  >
                                                    Exclude
                                                  </button>
                                                )}
                                              </>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="py-8 flex flex-col items-center justify-center space-y-2 text-center text-gray-500 bg-[#0B0B0C]/40 rounded-lg p-6 border border-dashed border-[#2A2A2D]/60">
                                <span className="text-xs italic">No lenses configured under this lens type yet.</span>
                                <span className="text-[10px] text-gray-600">Go to Lens Management to add them.</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

          {/* SECTION 8: MEMBERSHIP & OFFERS */}
          <div className="space-y-6 mb-12">
              <h2 className="text-white text-base font-extrabold uppercase tracking-wider border-b border-[#2A2A2D] pb-3 text-[#D4A04D]">Step 6: Memberships & Offers</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none bg-[#18181A] p-6 rounded-2xl border border-[#2A2A2D]/40">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input type="checkbox" {...register('buy1Get1')} className="w-4 h-4 accent-[#D4A04D]" />
                  <span>Buy 1 Get 1 (Buy One Get One)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input type="checkbox" {...register('oneRupeeFrameOffer')} className="w-4 h-4 accent-[#D4A04D]" />
                  <span>₹1 Frame Offer</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input type="checkbox" {...register('isBestseller')} className="w-4 h-4 accent-[#D4A04D]" />
                  <span>Mark as Bestseller (Shows Bestseller badge)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input type="checkbox" {...register('isPremium')} className="w-4 h-4 accent-[#D4A04D]" />
                  <span>Mark as Premium (Shows Premium badge)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input type="checkbox" {...register('isLensSolution')} className="w-4 h-4 accent-[#D4A04D]" />
                  <span>Mark as Lens Solution (Selectable as a cart add-on for contact lenses)</span>
                </label>
              </div>

              <div className="bg-[#18181A] p-6 rounded-2xl border border-[#2A2A2D]/40 space-y-4">
                <h3 className="text-white text-xs font-extrabold uppercase tracking-wider text-[#D4A04D]">Promo Badges & Labels</h3>
                <div>
                  <label className="text-gray-400 text-[10px] font-bold uppercase block mb-1">Offer Badges (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. NEW, 100% OFF, SALE"
                    {...register('offerBadgesText')}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-[#D4A04D] font-bold"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">Badges entered here will display as overlays on the product card.</span>
                </div>
              </div>

              {formValues.oneRupeeFrameOffer && (
                <div className="border-t border-[#2A2A2D]/60 pt-6 space-y-4">
                  <h3 className="text-white text-xs font-extrabold uppercase tracking-wider text-[#D4A04D]">₹1 Frame Offer Conditions</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#18181A] p-6 rounded-2xl border border-[#2A2A2D]/40">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold select-none pt-4">
                      <input type="checkbox" {...register('oneRupeeOfferConditions.membershipRequired')} className="w-4 h-4 accent-[#D4A04D]" />
                      <span>Membership Required</span>
                    </label>
                    <div>
                      <label className="text-gray-400 text-[10px] font-bold uppercase block mb-1">Max Usage count per User</label>
                      <input
                        type="number"
                        {...register('oneRupeeOfferConditions.maxUsage', { valueAsNumber: true })}
                        className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2 text-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>



            </>
          )}

          {/* SECTION 11: MEDIA ASSETS UPLOAD */}
          <div className="space-y-6 mb-12">
              <h2 className="text-white text-base font-extrabold uppercase tracking-wider border-b border-[#2A2A2D] pb-3 text-[#D4A04D]">Step 7: Media Assets</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Single Image Drag-n-Drops */}
                <div className="space-y-4">
                  <h3 className="text-white text-xs font-bold uppercase tracking-wider">Product Angles & Thumbnail</h3>
                  
                  {['thumbnail', 'frontView', 'leftView', 'rightView', 'topView'].map(field => (
                    <div key={field} className="grid grid-cols-3 items-center bg-[#18181A] p-4 rounded-xl border border-[#2A2A2D]/40 gap-4">
                      <div className="col-span-1">
                        <span className="text-white text-xs font-bold block capitalize">{field.replace('View', ' View')}</span>
                        {/* Crop trigger */}
                        <div className="pt-2">
                          <label className="text-[10px] text-[#D4A04D] hover:underline cursor-pointer font-bold block">
                            Crop & Upload
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => startCropMode(e, field)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      <div 
                        className="col-span-2 border border-dashed border-zinc-700 hover:border-[#D4A04D] rounded-xl flex items-center justify-center p-3 cursor-pointer text-center text-[10px] text-gray-400 relative h-20 overflow-hidden"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, field)}
                      >
                        {(formValues as any)[field] ? (
                          <img src={(formValues as any)[field]} alt={field} className="max-h-full max-w-full object-contain" />
                        ) : (
                          <span>Drag image here or click to browse</span>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, field)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Multiple Images Uploads */}
                <div className="space-y-6">
                  {/* Lifestyle images */}
                  <div className="space-y-3">
                    <h3 className="text-white text-xs font-bold uppercase tracking-wider">Lifestyle Images</h3>
                    <div 
                      className="border-2 border-dashed border-zinc-800 hover:border-[#D4A04D] rounded-xl flex flex-col items-center justify-center p-8 text-center text-xs text-gray-400 relative"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'lifestyleImages', true)}
                    >
                      <span className="font-extrabold text-[#D4A04D] text-lg mb-1">+</span>
                      <span>Drop lifestyle images here to upload multiple</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileUpload(e, 'lifestyleImages', true)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    
                    {/* Render uploaded list */}
                    <div className="grid grid-cols-5 gap-3 pt-2">
                      {formValues.lifestyleImages?.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg border border-zinc-800 overflow-hidden group">
                          <img src={url} alt={`Lifestyle ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setValue('lifestyleImages', formValues.lifestyleImages.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-black/60 rounded-full w-5 h-5 flex items-center justify-center text-[8px] hover:bg-black text-red-400 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 360 Degree View Images */}
                  <div className="space-y-3">
                    <h3 className="text-white text-xs font-bold uppercase tracking-wider">360 View Images</h3>
                    <div 
                      className="border-2 border-dashed border-zinc-800 hover:border-[#D4A04D] rounded-xl flex flex-col items-center justify-center p-8 text-center text-xs text-gray-400 relative"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'threeSixtyImages', true)}
                    >
                      <span>Drop 360-degree rotation sequence images</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileUpload(e, 'threeSixtyImages', true)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="text-[10px] text-gray-500 font-medium">Add sequential rotation angles to compose interactive 3D rotation view.</div>
                  </div>
                </div>
              </div>
            </div>


          {/* SAVE ACTIONS */}
          <div className="flex justify-end items-center gap-4 border-t border-[#2A2A2D] pt-6 mt-8">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-6 py-3 rounded-xl text-xs font-bold uppercase bg-[#2A2A2D] text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSaving}
              className="px-6 py-3 rounded-xl text-xs font-bold uppercase bg-[#D4A04D] text-black hover:bg-[#C8923E] transition-colors disabled:opacity-50"
            >
              Publish Product
            </button>
          </div>
        </div>

        {/* SIDEBAR: LIVE PREVIEW & PRICE ENGINE PREVIEW */}
        <aside className="w-80 flex-shrink-0 space-y-6 self-start sticky top-28">
          {/* Live Preview Panel */}
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-white text-xs font-extrabold uppercase tracking-wider text-[#D4A04D] border-b border-[#2A2A2D] pb-2">
              Live Preview Card
            </h3>
            <div className="bg-[#101012] aspect-video rounded-2xl flex flex-col p-4 relative overflow-hidden text-xs border border-[#2A2A2D]/40">
              {/* Product mockup details */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] text-[#D4A04D] font-extrabold uppercase tracking-wide block">{formValues.brand || 'Brand'}</span>
                  <span className="text-white font-extrabold text-sm block truncate max-w-[150px]">{formValues.name || 'Unnamed Product'}</span>
                  <span className="text-[10px] text-gray-500 block font-mono mt-0.5">{formValues.sku || 'SKU'}</span>
                  {formValues.packName ? (
                    <span className="text-[10px] text-[#D4A04D] block mt-0.5 font-bold">{formValues.packName}</span>
                  ) : null}
                </div>
                <div className="text-right">
                  <span className="text-white font-black text-sm block">₹{calculatedPayable}</span>
                  {mrpValue > 0 && <span className="text-gray-500 line-through text-[10px] block">₹{mrpValue}</span>}
                </div>
              </div>

              {/* Mockup image area */}
              <div className="flex-1 flex justify-center items-center py-2 relative min-h-[80px]">
                {formValues.thumbnail ? (
                  <img src={formValues.thumbnail} alt="Preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-gray-600 text-[10px] italic">No thumbnail uploaded</div>
                )}

                {formValues.status === 'Active' && (
                  <span className="absolute bottom-1 left-1 bg-green-500/10 text-green-400 border border-green-500/20 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded">
                    ★ Active
                  </span>
                )}
                {formValues.status === 'Draft' && (
                  <span className="absolute bottom-1 left-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded">
                    ✎ Draft
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-[8px] text-gray-400 border-t border-zinc-900/60 pt-2 select-none">
                <span>Frame: {formValues.frameShape} | {formValues.frameSize}</span>
                <span className="font-semibold text-yellow-400">GST {formValues.gstPercent}% Included</span>
              </div>
            </div>
          </div>



        </aside>
      </main>
    </div>
  );
}
