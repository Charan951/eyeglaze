import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';

interface LensOption {
  _id: string;
  kind: 'type' | 'quality';
  type?: string;
  subType?: string;
  displayName: string;
  name: string;
  description?: string;
  price: number;
  startingPrice?: number;
  features: string[];
  badge?: string;
  isBestseller?: boolean;
  isRecommended?: boolean;
}

interface Product {
  _id: string;
  sku: string;
  name: string;
  price: { original: number; selling: number };
  rating?: number;
  reviewCount?: number;
  images?: string[];
  compatible?: { prescription?: boolean; bluecut?: boolean; zeropower?: boolean; progressive?: boolean };
  frame?: {
    type?: string;
    material?: string;
    width?: number;
    lensWidth?: number;
    bridgeWidth?: number;
    templeLength?: number;
  };
}

export default function LensSelection() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productId = searchParams.get('product');
  const color = searchParams.get('color') || '';

  const [product, setProduct] = useState<Product | null>(null);
  const [lensTypes, setLensTypes] = useState<LensOption[]>([]);
  const [lensQualities, setLensQualities] = useState<LensOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Stepper State (1: LENS TYPE, 2: POWER, 3: QUALITY, 4: CHECKOUT)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Selections State
  const [selectedType, setSelectedType] = useState<LensOption | null>(null);
  const [selectedSubType, setSelectedSubType] = useState<LensOption | null>(null); // Progressive sub-tier (Step 2)
  const [selectedQuality, setSelectedQuality] = useState<LensOption | null>(null); // Quality/Coatings tier (Step 3)

  // Power Input State
  const [powerMode, setPowerMode] = useState<'enter' | 'upload' | 'later'>('upload');
  const [prescriptionFileName, setPrescriptionFileName] = useState('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  
  // Matches defaults in screenshots
  const [reSph, setReSph] = useState('-1.25');
  const [reCyl, setReCyl] = useState('-0.50');
  const [reAxis, setReAxis] = useState('180');
  const reAdd = '1.00';

  const [leSph, setLeSph] = useState('-1.75');
  const [leCyl, setLeCyl] = useState('-0.75');
  const [leAxis, setLeAxis] = useState('170');

  const [pd, setPd] = useState('62.0');

  // Checkout States
  const [couponCode, setCouponCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isMembershipAdded, setIsMembershipAdded] = useState(false);
  const [isPdModalOpen, setIsPdModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!productId) {
      setError('Product ID is missing in query parameters');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    // Fetch product details & lens options
    Promise.all([
      api.get(`/products/${productId}`),
      api.get('/lens-options')
    ])
      .then(([prodRes, lensRes]) => {
        const prod = prodRes.data.product || prodRes.data;
        setProduct(prod);
        
        const types: LensOption[] = lensRes.data.lensTypes || [];
        const qualities: LensOption[] = lensRes.data.lensQualities || [];
        setLensTypes(types);
        setLensQualities(qualities);

        // Auto-select Single Vision as default type
        if (types.length > 0) {
          const sv = types.find((t: LensOption) => t.type === 'single_vision') || types[0];
          setSelectedType(sv);
        }

        // Auto-select first recommended quality as default
        if (qualities.length > 0) {
          const rec = qualities.find((q: LensOption) => q.isRecommended) || qualities[0];
          setSelectedQuality(rec);
        }
      })
      .catch((err) => {
        console.error('Failed to load lens selection data:', err);
        setError('Failed to load lens options or product details.');
      })
      .finally(() => setLoading(false));
  }, [productId]);

  // Handle progressive sub-type defaults
  useEffect(() => {
    if (selectedType) {
      const subTypes = lensTypes.filter(t => t.type === selectedType.type && t.subType);
      if (subTypes.length > 0) {
        const best = subTypes.find(t => t.isBestseller) || subTypes[0];
        setSelectedSubType(best);
      } else {
        setSelectedSubType(null);
      }
    }
  }, [selectedType, lensTypes]);

  if (loading) {
    return <div className="text-center py-24 text-[#A7A7A7]">Loading Lens Configuration...</div>;
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6">
        <div className="text-red-400 text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-2">Error</h2>
        <p className="text-[#A7A7A7] mb-6">{error || 'Could not load page'}</p>
        <button onClick={() => navigate(-1)} className="bg-[#D4A04D] text-black font-bold uppercase py-2.5 px-6 rounded-xl text-sm cursor-pointer">
          Go Back
        </button>
      </div>
    );
  }

  // Filter types by compatibility
  const compatibleTypes = lensTypes.filter(opt => {
    if (!product.compatible) return true;
    const { compatible } = product;

    if (opt.type === 'single_vision') return compatible.prescription;
    if (opt.type === 'progressive') return compatible.progressive || compatible.prescription;
    if (opt.type === 'zero_power') return compatible.zeropower;
    if (opt.type === 'bluecut') return compatible.bluecut;
    if (opt.type === 'photochromic') return true;

    return true;
  });

  const mainLensTypes = compatibleTypes.filter(t => !t.subType);
  const currentSubTypes = compatibleTypes.filter(t => t.type === selectedType?.type && t.subType);

  const isZeroPower = selectedType?.type === 'zero_power';

  const stepsConfig = [
    { step: 1, label: 'LENS TYPE' },
    { step: 2, label: 'POWER' },
    { step: 3, label: 'QUALITY' },
    { step: 4, label: 'CHECKOUT' }
  ];

  // Navigation Handlers
  const handleNext = () => {
    if (currentStep === 1) {
      if (!selectedType) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!isZeroPower && powerMode === 'enter') {
        const hasAstigmatismRE = parseFloat(reCyl) !== 0;
        const hasAstigmatismLE = parseFloat(leCyl) !== 0;
        if ((hasAstigmatismRE && !reAxis) || (hasAstigmatismLE && !leAxis)) {
          alert('Please enter AXIS for astigmatism (when CYL is not 0)');
          return;
        }
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const compressAndUploadPrescription = async (file: File): Promise<string> => {
    if (file.type === 'application/pdf') {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/prescriptions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.prescription?.uploadedFile || res.data.prescription?.imageUrl || '';
    }

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            async (blob) => {
              if (!blob) {
                reject(new Error('Canvas compression failed'));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });

              const formData = new FormData();
              formData.append('file', compressedFile);

              try {
                const res = await api.post('/prescriptions', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' },
                });
                resolve(res.data.prescription?.uploadedFile || res.data.prescription?.imageUrl || '');
              } catch (err) {
                reject(err);
              }
            },
            'image/jpeg',
            0.85
          );
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPrescriptionFileName(file.name);
      setUploadingPrescription(true);
      try {
        const url = await compressAndUploadPrescription(file);
        setUploadedFileUrl(url);
      } catch (err) {
        console.error('Prescription upload failed:', err);
        alert('Failed to upload prescription. Please try again.');
      } finally {
        setUploadingPrescription(false);
      }
    }
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    setCouponSuccess('');
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'WELCOME50' || code === 'EYEGLAZE50') {
      setDiscountApplied(50);
      setCouponSuccess('Coupon applied successfully! You got ₹50 discount.');
    } else if (code === 'EYEGLAZE99') {
      setDiscountApplied(99);
      setCouponSuccess('Coupon applied successfully! You got ₹99 discount.');
    } else {
      setCouponError('Invalid coupon code. Try WELCOME50 or EYEGLAZE99.');
      setDiscountApplied(0);
    }
  };

  const handleConfirmAndAdd = async () => {
    if (!isZeroPower && powerMode === 'upload') {
      if (uploadingPrescription) {
        alert('Please wait for the prescription file to finish uploading.');
        return;
      }
      if (!uploadedFileUrl) {
        alert('Please select and upload a prescription file first.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const basePrice = selectedType?.type === 'progressive' 
        ? (selectedSubType?.price || 2499)
        : (selectedQuality?.price || selectedType?.price || 699);

      const powerObj = isZeroPower
        ? { RE: { sph: 0 }, LE: { sph: 0 } }
        : powerMode === 'enter'
        ? {
            RE: { sph: parseFloat(reSph), cyl: parseFloat(reCyl), axis: parseInt(reAxis) },
            LE: { sph: parseFloat(leSph), cyl: parseFloat(leCyl), axis: parseInt(leAxis) },
            pd: parseFloat(pd),
            ...(selectedType?.type === 'progressive' ? { addition: parseFloat(reAdd) } : {})
          }
        : { uploadLater: true, uploadedFileUrl };

      const payload = {
        productId: product._id,
        color: color,
        qty: 1,
        lens: {
          lensType: selectedType?.displayName || selectedType?.name,
          lensSubType: selectedSubType?.displayName || selectedSubType?.name || undefined,
          lensQuality: selectedQuality?.displayName || 'Standard Coating',
          lensPrice: basePrice,
          fittingCharge: 199,
          power: powerObj
        }
      };

      await api.post('/cart', payload);
      navigate('/cart');
    } catch (err) {
      console.error('Failed to add product with lens config:', err);
      alert('Failed to add config to cart. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Pricing Breakdown
  const framePrice = product.price.selling;
  const chosenLensPrice = selectedType?.type === 'progressive' 
    ? (selectedSubType?.price || 2499)
    : (selectedQuality?.price || selectedType?.price || 699);
  const fittingCharge = 199;
  const deliveryCharge = isMembershipAdded ? 0 : 99;
  const subTotal = framePrice + chosenLensPrice + fittingCharge + deliveryCharge;
  const totalDiscount = discountApplied;
  const membershipFee = isMembershipAdded ? 99 : 0; // Updated membership fee to match ₹99 in screenshot
  const totalPrice = Math.max(0, subTotal - totalDiscount + membershipFee);

  // SVG diagram rendering for Step 1
  const renderLensDiagram = (type: string, isBig = false) => {
    const size = isBig ? "w-20 h-20" : "w-12 h-12";
    const strokeColor = "#D4A04D";
    
    switch (type) {
      case 'progressive':
        return (
          <svg className={`${size} text-gray-400`} viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="45" stroke="#2A2A2D" strokeWidth="2" />
            <circle cx="50" cy="50" r="40" stroke={strokeColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
            <path d="M20 35 C 35 45, 65 45, 80 35" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="4 4" />
            <path d="M25 65 C 40 55, 60 55, 75 65" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="4 4" />
            <text x="50" y="27" fill="#A7A7A7" fontSize="7" textAnchor="middle" fontWeight="bold">FAR</text>
            <text x="50" y="52" fill="#D4A04D" fontSize="7" textAnchor="middle" fontWeight="bold">INTER</text>
            <text x="50" y="77" fill="#A7A7A7" fontSize="7" textAnchor="middle" fontWeight="bold">NEAR</text>
          </svg>
        );
      case 'single_vision':
        return (
          <svg className={`${size} text-gray-400`} viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="45" stroke="#2A2A2D" strokeWidth="2" />
            <circle cx="50" cy="50" r="28" stroke={strokeColor} strokeWidth="1.5" opacity="0.5" />
            <circle cx="50" cy="50" r="10" stroke={strokeColor} strokeWidth="2" />
            <path d="M15 50 L35 50 M65 50 L85 50 M50 15 L50 35 M50 65 L50 85" stroke={strokeColor} strokeWidth="1" opacity="0.4" />
          </svg>
        );
      case 'bluecut':
        return (
          <svg className={`${size} text-gray-400`} viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="45" stroke="#2A2A2D" strokeWidth="2" />
            <path d="M25 35 Q 40 45, 50 35 T 75 35" stroke="#4169E1" strokeWidth="2" />
            <path d="M25 50 Q 40 60, 50 50 T 75 50" stroke="#4169E1" strokeWidth="2" />
            <path d="M42 22 L58 22 L58 35 C 58 45, 50 50, 50 50 C 50 50, 42 45, 42 35 Z" fill={strokeColor} opacity="0.8" />
            <path d="M30 68 C 40 75, 60 75, 70 68" stroke={strokeColor} strokeWidth="1.5" />
          </svg>
        );
      case 'photochromic':
        return (
          <svg className={`${size} text-gray-400`} viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="45" stroke="#2A2A2D" strokeWidth="2" />
            <path d="M18 18 A 45 45 0 0 0 82 82 Z" fill="#2E2335" opacity="0.9" />
            <circle cx="50" cy="50" r="45" stroke={strokeColor} strokeWidth="1.5" />
            <text x="32" y="70" fill="#FFF" fontSize="8" fontWeight="bold">DARK</text>
            <text x="68" y="36" fill="#A7A7A7" fontSize="8" fontWeight="bold">CLEAR</text>
          </svg>
        );
      case 'zero_power':
      default:
        return (
          <svg className={`${size} text-gray-400`} viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="45" stroke="#2A2A2D" strokeWidth="2" />
            <circle cx="50" cy="50" r="40" stroke="#FFF" strokeWidth="1" opacity="0.1" />
            <path d="M70 25 L73 35 L83 38 L73 41 L70 51 L67 41 L57 38 L67 35 Z" fill={strokeColor} />
            <path d="M30 55 C 30 50, 42 50, 45 55 C 48 50, 60 50, 60 55" stroke="#FFF" strokeWidth="1.5" fill="none" opacity="0.6" />
          </svg>
        );
    }
  };

  // Render Quality Feature Icons dynamically
  const renderQualityFeatureIcon = (featureName: string) => {
    const size = "w-5 h-5 text-[#D4A04D]";
    switch (featureName.toLowerCase()) {
      case 'anti reflective (hmc coating)':
      case 'anti reflective':
      case 'hmc coating':
        return (
          <svg className={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
        );
      case 'blue light protection':
      case 'bluecut':
        return (
          <svg className={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        );
      case 'scratch resistant':
      case 'scratch resistance':
        return (
          <svg className={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'water & dust repellent':
      case 'hydrophobic':
        return (
          <svg className={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        );
      default:
        return (
          <svg className={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
          </svg>
        );
    }
  };

  const getLifestyleImage = (type?: string) => {
    switch (type) {
      case 'single_vision': return '/images/scenic_road.png';
      case 'progressive': return '/images/reading_book.png';
      case 'zero_power': return '/images/zero_power_glasses.png';
      case 'bluecut': return '/images/laptop_screen.png';
      case 'photochromic': return '/images/transition_lens.png';
      default: return '/images/cat_prescription.png';
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0F]">
      
      {/* Sticky Custom Header */}
      <header className="sticky top-0 bg-[#0E0E0F]/90 backdrop-blur-md border-b border-[#2A2A2D] z-50 py-3 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Go Back"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-[#D4A04D] font-serif text-lg tracking-[0.2em] uppercase font-bold leading-none">EYEGLAZE</span>
            <span className="text-[#D4A04D]/85 font-sans text-[7px] tracking-[0.3em] uppercase mt-0.5">EYEWEAR</span>
          </div>

          <Link to="/cart" className="text-gray-400 hover:text-[#D4A04D] transition-colors relative cursor-pointer" title="Shopping Cart">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="absolute -top-1 -right-1 bg-[#D4A04D] text-black font-extrabold text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#0E0E0F]">
              2
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto px-4 py-6 pb-28">
        
        {/* Step Progress Tracker */}
        <div className="mb-8 flex items-center justify-between px-2">
          {stepsConfig.map((item, idx, arr) => {
            const isActive = currentStep === item.step;
            const isCompleted = currentStep > item.step;
            return (
              <div key={item.step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] transition-all ${
                    isCompleted 
                      ? 'bg-[#D4A04D] text-black' 
                      : isActive 
                      ? 'bg-[#D4A04D] text-black shadow-[0_0_10px_rgba(212,160,77,0.3)]' 
                      : 'border-2 border-[#2A2A2D] text-gray-500 bg-transparent'
                  }`}>
                    {isCompleted ? '✓' : item.step}
                  </div>
                  <span className={`text-[8px] sm:text-[9px] font-bold tracking-wider mt-1.5 uppercase ${
                    isActive ? 'text-[#D4A04D]' : isCompleted ? 'text-white' : 'text-gray-600'
                  }`}>
                    {item.label}
                  </span>
                </div>
                {idx < arr.length - 1 && (
                  <div className={`h-[1px] flex-1 mx-2 transition-all ${
                    currentStep > item.step ? 'bg-[#D4A04D]' : 'bg-[#2A2A2D]'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Frame Product Summary Card */}
        {currentStep < 4 && (
          currentStep === 1 ? (
            <div className="bg-[#131314]/90 border border-[#2A2A2D]/80 rounded-2xl p-4.5 mb-6 flex flex-col sm:flex-row items-center gap-5">
              {/* Larger Product Image */}
              <div className="w-full sm:w-48 h-32 bg-[#1A1A1C] border border-[#2A2A2D] rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">👓</span>
                )}
              </div>
              
              {/* Product Details and Button */}
              <div className="flex flex-col flex-1 w-full justify-between h-full py-1 gap-3 sm:gap-2 text-left">
                <div className="space-y-1">
                  <h3 className="text-white text-base sm:text-lg font-bold leading-tight">
                    {product.sku} | {product.name}
                  </h3>
                  <div className="flex flex-col gap-1.5 text-gray-500 text-xs mt-2.5">
                    <div>
                      <span>Color: </span>
                      <span className="text-white font-bold">{color || 'Matte Black'}</span>
                    </div>
                    <div>
                      <span>Size: </span>
                      <span className="text-gray-400 font-semibold">
                        {product.frame 
                          ? `${product.frame.lensWidth}-${product.frame.bridgeWidth}-${product.frame.templeLength}` 
                          : '54-18-145'}
                      </span>
                    </div>
                    <div>
                      <span>Lens: </span>
                      <span className="text-[#D4A04D] font-bold">
                        {selectedSubType ? selectedSubType.displayName : 'Not Selected'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Change Frame Button Bellow */}
                <div className="pt-1 self-start">
                  <button 
                    onClick={() => navigate(productId ? `/products/${productId}` : '/products')} 
                    className="border border-[#D4A04D]/35 hover:bg-[#D4A04D]/10 text-[#D4A04D] font-bold text-[10px] uppercase tracking-wider rounded-lg px-4.5 py-2 transition-colors cursor-pointer bg-transparent"
                  >
                    Change Frame
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#131314]/90 border border-[#2A2A2D]/80 rounded-2xl p-4.5 mb-6 flex flex-col">
              {/* Top Row: Image & Details */}
              <div className="flex items-center gap-4.5">
                <div className="w-20 h-20 bg-[#1A1A1C] border border-[#2A2A2D] rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">👓</span>
                  )}
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-white text-base sm:text-lg font-bold leading-none">{product.sku}</span>
                  <span className="text-white text-sm font-medium leading-tight mt-0.5">{product.name}</span>
                  <span className="text-gray-500 text-xs font-medium mt-0.5">{color || 'Matte Black'}</span>
                </div>
              </div>
              
              {/* Divider Line spanning full width */}
              <div className="w-full border-t border-[#2A2A2D]/40 my-3.5" />
              
              {/* Bottom Row: Lens Type and Edit link */}
              <div className="flex items-start justify-between w-full text-xs">
                <div className="flex items-start gap-4 flex-1 pr-4">
                  <span className="text-gray-500 font-medium whitespace-nowrap">Lens Type:</span>
                  <span className="text-[#D4A04D] font-bold leading-normal text-left max-w-sm sm:max-w-md">
                    {selectedType?.displayName} {selectedSubType ? `(${selectedSubType.displayName})` : ''}
                  </span>
                </div>
                <button 
                  onClick={() => setCurrentStep(1)} 
                  className="text-[#D4A04D] hover:underline font-bold text-xs bg-transparent border-none cursor-pointer p-0 shrink-0 self-center"
                >
                  Edit
                </button>
              </div>
            </div>
          )
        )}

        {/* ================= STEP 1: SELECT LENS TYPE ================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-lg font-black text-white uppercase tracking-wider">Buy With Lens</h1>
              <p className="text-[#A7A7A7] text-[11px] font-medium mt-1">Select lens type that suits your lifestyle</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h2 className="text-[#D4A04D] font-extrabold text-xs uppercase tracking-wider mb-1">Choose Lens Type</h2>
                <p className="text-gray-500 text-[10px]">All lenses come with 100% UV Protection</p>
              </div>

              {mainLensTypes.map((typeOption) => {
                const isSelected = selectedType?._id === typeOption._id;
                
                return (
                  <div
                    key={typeOption._id}
                    onClick={() => {
                      setSelectedType(typeOption);
                    }}
                    className={`relative bg-[#131314]/90 border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all hover:border-[#D4A04D]/45 ${
                      isSelected ? 'border-[#D4A04D] bg-[#141416]' : 'border-[#2A2A2D]'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#D4A04D] flex items-center justify-center shadow-md">
                        <span className="text-black text-[9px] font-extrabold">✓</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0">
                        {renderLensDiagram(typeOption.type || '')}
                      </div>
                      <div className="flex flex-col flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-bold text-sm leading-none">{typeOption.displayName}</h3>
                          {typeOption.isBestseller && (
                            <span className="bg-[#D4A04D]/15 text-[#D4A04D] border border-[#D4A04D]/25 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase leading-none">
                              Bestseller
                            </span>
                          )}
                        </div>
                        <p className="text-[#A7A7A7] text-[10px] font-medium leading-normal mt-1.5 max-w-sm">{typeOption.description}</p>
                        <span className="text-[#D4A04D] text-[10px] font-extrabold uppercase mt-2.5">
                          Starts from ₹{typeOption.startingPrice || typeOption.price}
                        </span>
                      </div>
                    </div>

                    <div className="w-24 h-16 rounded-lg overflow-hidden bg-[#222] flex-shrink-0 border border-[#2A2A2D]/60 relative">
                      <img 
                        src={getLifestyleImage(typeOption.type)} 
                        alt={typeOption.displayName} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trust Badges Strip */}
            <div className="bg-[#131314]/40 border border-[#2A2A2D]/35 rounded-xl py-3 px-4 flex items-center justify-between text-center mt-8 text-[8px] font-bold text-gray-500 uppercase tracking-widest">
              <span>🛡️ 100% UV Protection</span>
              <span className="text-[#2A2A2D]">•</span>
              <span>🔒 1 Year Warranty</span>
              <span className="text-[#2A2A2D]">•</span>
              <span>💎 Scratch Resistant</span>
              <span className="text-[#2A2A2D]">•</span>
              <span>🔄 Easy Returns</span>
            </div>

            {/* Sticky Continue Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#0E0E0F]/90 border-t border-[#2A2A2D] p-4 z-40 backdrop-blur-md">
              <div className="max-w-md mx-auto">
                <button
                  onClick={handleNext}
                  disabled={!selectedType}
                  className="w-full bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold uppercase py-3.5 rounded-xl text-xs tracking-wider transition-colors disabled:opacity-30 disabled:cursor-not-allowed select-none cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>CONTINUE TO POWER</span>
                  <span className="text-xs">→</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: ENTER POWER ================= */}
        {currentStep === 2 && selectedType && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Header Block */}
            <div className="text-left">
              <h1 className="text-lg font-black text-white uppercase tracking-wider">Enter Your Power</h1>
              <p className="text-[#A7A7A7] text-[11px] font-medium mt-1">All fields are required</p>
            </div>



            {/* Prescription Form Block (Show only for non zero-power options) */}
            {!isZeroPower ? (
              <div className="bg-[#131314]/90 border border-[#2A2A2D]/80 rounded-2xl p-5 space-y-6 transition-all duration-300">
                
                {/* Tabs */}
                <div className="flex border-b border-[#2A2A2D]/85">
                  <button
                    onClick={() => setPowerMode('upload')}
                    className={`flex-1 pb-3 text-[10px] font-extrabold uppercase tracking-wider transition-colors border-b-2 text-center bg-transparent border-none cursor-pointer ${
                      powerMode === 'upload' ? 'border-[#D4A04D] text-[#D4A04D]' : 'border-transparent text-gray-500 hover:text-white'
                    }`}
                  >
                    UPLOAD PRESCRIPTION
                  </button>
                  <button
                    onClick={() => setPowerMode('enter')}
                    className={`flex-1 pb-3 text-[10px] font-extrabold uppercase tracking-wider transition-colors border-b-2 text-center bg-transparent border-none cursor-pointer ${
                      powerMode === 'enter' ? 'border-[#D4A04D] text-[#D4A04D]' : 'border-transparent text-gray-500 hover:text-white'
                    }`}
                  >
                    ENTER MANUALLY
                  </button>
                </div>

                {/* Manual entry view */}
                {powerMode === 'enter' && (
                  <div className="space-y-6 pt-2 text-left animate-fade-in">
                    <div>
                      <h4 className="text-white font-bold text-xs uppercase tracking-wider">{selectedType.displayName}</h4>
                      <p className="text-gray-500 text-[10px] mt-0.5">For distance or near vision with a single power.</p>
                    </div>

                    {/* Grid */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-2.5 text-center text-[8px] font-extrabold text-[#A7A7A7] border-b border-[#2A2A2D]/70 pb-2 uppercase tracking-widest">
                        <div className="text-left" />
                        <div>SPH (Sphere)</div>
                        <div>CYL (Cylinder)</div>
                        <div>AXIS</div>
                      </div>

                      {/* Right Eye Row */}
                      <div className="grid grid-cols-4 gap-2.5 items-center text-center">
                        <div className="text-white text-xs font-black text-left">R (Right)</div>
                        <div>
                          <select value={reSph} onChange={e => setReSph(e.target.value)} className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#D4A04D] cursor-pointer">
                            {Array.from({ length: 81 }, (_, i) => (-10 + i * 0.25).toFixed(2)).map(v => (
                              <option key={v} value={v}>{parseFloat(v) > 0 ? `+${v}` : v}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <select value={reCyl} onChange={e => setReCyl(e.target.value)} className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#D4A04D] cursor-pointer">
                            {Array.from({ length: 49 }, (_, i) => (-6 + i * 0.25).toFixed(2)).map(v => (
                              <option key={v} value={v}>{parseFloat(v) > 0 ? `+${v}` : v}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <select value={reAxis} onChange={e => setReAxis(e.target.value)} className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#D4A04D] cursor-pointer">
                            {Array.from({ length: 181 }, (_, i) => i.toString()).map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Left Eye Row */}
                      <div className="grid grid-cols-4 gap-2.5 items-center text-center">
                        <div className="text-white text-xs font-black text-left">L (Left)</div>
                        <div>
                          <select value={leSph} onChange={e => setLeSph(e.target.value)} className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#D4A04D] cursor-pointer">
                            {Array.from({ length: 81 }, (_, i) => (-10 + i * 0.25).toFixed(2)).map(v => (
                              <option key={v} value={v}>{parseFloat(v) > 0 ? `+${v}` : v}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <select value={leCyl} onChange={e => setLeCyl(e.target.value)} className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#D4A04D] cursor-pointer">
                            {Array.from({ length: 49 }, (_, i) => (-6 + i * 0.25).toFixed(2)).map(v => (
                              <option key={v} value={v}>{parseFloat(v) > 0 ? `+${v}` : v}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <select value={leAxis} onChange={e => setLeAxis(e.target.value)} className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded px-2.5 py-2 text-white text-xs focus:outline-none focus:border-[#D4A04D] cursor-pointer">
                            {Array.from({ length: 181 }, (_, i) => i.toString()).map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* PD */}
                    <div className="pt-4 border-t border-[#2A2A2D]/55 flex items-center justify-between gap-4 mt-6">
                      <div className="flex items-center gap-3">
                        <label className="text-[#A7A7A7] text-[10px] font-extrabold uppercase tracking-wide">PD (Pupillary Distance) <span className="text-gray-600 font-bold ml-0.5 cursor-help" title="PD represents distance between pupils">(i)</span></label>
                        <div className="flex items-center gap-1.5 bg-[#0B0B0C] border border-[#2A2A2D] rounded px-2.5 py-1.5">
                          <input 
                            type="text" 
                            value={pd} 
                            onChange={e => setPd(e.target.value)} 
                            className="bg-transparent border-none text-white text-xs focus:outline-none w-10 text-center font-bold"
                          />
                          <span className="text-gray-500 text-[10px] font-bold">mm</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => setIsPdModalOpen(true)}
                        className="border border-[#D4A04D]/35 hover:bg-[#D4A04D]/10 text-[#D4A04D] font-bold text-[10px] uppercase tracking-wider rounded-lg px-3.5 py-1.5 transition-colors cursor-pointer bg-transparent flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="8" />
                          <path d="M12 8v8M8 12h8" />
                        </svg>
                        Measure PD
                      </button>
                    </div>
                  </div>
                )}

                {/* File upload view */}
                {powerMode === 'upload' && (
                  <div className="bg-[#0B0B0C] border border-[#2A2A2D]/85 rounded-xl p-5 text-center space-y-4 animate-fade-in">
                    <div className="text-3xl text-[#D4A04D] animate-bounce">📁</div>
                    <h3 className="text-white font-bold text-xs">Upload Prescription Photo</h3>
                    <p className="text-gray-500 text-[10px] max-w-xs mx-auto leading-relaxed">
                      Drag & drop or click below to upload a clear image of your doctor's prescription.
                    </p>
                    <div className="pt-1">
                      <label className="inline-block bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-[10px] uppercase px-4.5 py-2.5 rounded-lg transition-colors cursor-pointer tracking-wider">
                        {uploadingPrescription ? 'UPLOADING...' : 'Browse File'}
                        <input type="file" accept="image/*,application/pdf" onChange={handleUploadChange} className="hidden" disabled={uploadingPrescription} />
                      </label>
                    </div>
                    {prescriptionFileName && (
                      <div className="text-green-400 text-[10px] font-semibold mt-1">
                        ✓ Selected: {prescriptionFileName} {uploadingPrescription && '(Processing compression & uploading...)'}
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Helper Toggle */}
                <div className="flex items-center justify-center gap-3 pt-3.5 border-t border-[#2A2A2D]/40 mt-5 w-full">
                  <svg className="w-7 h-7 text-[#D4A04D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="text-left text-xs leading-tight">
                    <span className="text-gray-500 block">Preferred method?</span>
                    <button 
                      onClick={() => setPowerMode(powerMode === 'upload' ? 'enter' : 'upload')} 
                      className="text-white font-bold underline hover:text-[#D4A04D] bg-transparent border-none p-0 cursor-pointer"
                    >
                      {powerMode === 'upload' ? 'Enter Manually' : 'Upload Prescription'}
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-5 text-center text-gray-500 text-xs">
                Cosmetic Zero Power (Plano) lenses do not require prescription values. Press continue to choose lens quality.
              </div>
            )}

            {/* Sticky Navigation Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#0E0E0F]/90 border-t border-[#2A2A2D] p-4 z-40 backdrop-blur-md">
              <div className="max-w-md mx-auto flex gap-3">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-[#131314] border border-[#2A2A2D] hover:border-white text-white font-extrabold uppercase py-3.5 rounded-xl text-xs tracking-wider transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold uppercase py-3.5 rounded-xl text-xs tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>CONTINUE TO QUALITY</span>
                  <span className="text-xs">→</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: SELECT LENS QUALITY ================= */}
        {currentStep === 3 && selectedType && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-left">
              <h1 className="text-lg font-black text-white uppercase tracking-wider">Select Lens Quality</h1>
              <p className="text-[#A7A7A7] text-[11px] font-medium mt-1">Choose the quality and features for your lenses</p>
            </div>

            {selectedType.type === 'progressive' ? (
              <div className="space-y-4 pt-1">
                <h2 className="text-white font-extrabold text-xs uppercase tracking-wider">Choose Your Progressive Lens</h2>
                <div className="space-y-3.5">
                  {currentSubTypes.map((subOption) => {
                    const isSubSelected = selectedSubType?._id === subOption._id;
                    return (
                      <div
                        key={subOption._id}
                        onClick={() => setSelectedSubType(subOption)}
                        className={`relative bg-[#131314] border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer transition-all hover:border-[#D4A04D]/45 ${
                          isSubSelected ? 'border-[#D4A04D] bg-[#141416]' : 'border-[#2A2A2D]'
                        }`}
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex-shrink-0 mt-1 sm:mt-0">
                            {renderLensDiagram(selectedType.type || '')}
                          </div>
                          <div className="flex-1 space-y-2 text-left">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-white font-bold text-sm leading-none">{subOption.displayName}</h3>
                              {subOption.isBestseller && (
                                <span className="bg-[#D4A04D] text-black text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-wide uppercase leading-none">
                                  Bestseller
                                </span>
                              )}
                            </div>
                            <p className="text-[#A7A7A7] text-[10px] leading-relaxed max-w-md">
                              {subOption.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center sm:flex-col sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#2A2A2D]/40">
                          <div className="flex flex-col sm:items-end text-left sm:text-right">
                            <span className="text-white font-black text-sm">₹{subOption.price}</span>
                            <span className="text-gray-500 text-[9px] font-semibold mt-0.5">/ pair</span>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-3 sm:mt-4 ${
                            isSubSelected ? 'border-[#D4A04D] bg-[#D4A04D]' : 'border-[#2D2D30]'
                          }`}>
                            {isSubSelected && <span className="text-black text-[10px] font-black">✓</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4.5">
                {lensQualities.map((quality) => {
                  const isSelected = selectedQuality?._id === quality._id;
                  
                  return (
                    <div
                      key={quality._id}
                      onClick={() => setSelectedQuality(quality)}
                      className={`relative bg-[#131314] border rounded-xl p-5 cursor-pointer transition-all hover:border-[#D4A04D]/45 ${
                        isSelected ? 'border-[#D4A04D] shadow-[0_0_15px_rgba(212,160,77,0.06)]' : 'border-[#2A2A2D]'
                      }`}
                    >
                      {/* Recommended badge */}
                      {quality.isRecommended && (
                        <div className="absolute -top-2.5 left-4">
                          <span className="bg-[#D4A04D] text-black text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                            Recommended
                          </span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-4 text-left">
                        <div className="flex-1 space-y-2">
                          <h3 className="text-white font-bold text-sm leading-none pt-0.5">{quality.displayName}</h3>
                          <p className="text-[#A7A7A7] text-[10px] leading-relaxed max-w-md">{quality.description}</p>
                          
                          {/* Feature icons with names */}
                          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
                            {quality.features?.map((feat, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-gray-500 text-[9px] font-bold uppercase tracking-wider">
                                {renderQualityFeatureIcon(feat)}
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center sm:flex-col sm:items-end justify-between shrink-0 self-stretch sm:justify-start gap-4">
                          <span className="text-white font-black text-sm">₹{quality.price} / pair</span>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-[#D4A04D] bg-[#D4A04D]' : 'border-[#2D2D30]'
                          }`}>
                            {isSelected && <span className="text-black text-[10px] font-black">✓</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Strip */}
            <div className="flex items-center justify-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-wider py-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>All lenses include 100% UV Protection</span>
            </div>

            {/* Sticky Navigation Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#0E0E0F]/90 border-t border-[#2A2A2D] p-4 z-40 backdrop-blur-md">
              <div className="max-w-md mx-auto flex gap-3">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-[#131314] border border-[#2A2A2D] hover:border-white text-white font-extrabold uppercase py-3.5 rounded-xl text-xs tracking-wider transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={selectedType.type === 'progressive' && !selectedSubType}
                  className="flex-1 bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold uppercase py-3.5 rounded-xl text-xs tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>CONTINUE TO CHECKOUT</span>
                  <span className="text-xs">→</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: REVIEW & CHECKOUT ================= */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-left">
              <h1 className="text-lg font-black text-white uppercase tracking-wider">Checkout</h1>
              <p className="text-[#A7A7A7] text-[11px] font-medium mt-1">Review your order details</p>
            </div>

            {/* Complete Custom Order Summary Card */}
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center pb-1">
                <span className="text-[#D4A04D] font-extrabold text-xs uppercase tracking-wider">ORDER SUMMARY</span>
                <button 
                  onClick={() => setCurrentStep(1)}
                  className="text-[#D4A04D] hover:underline font-bold text-xs bg-transparent border-none cursor-pointer p-0"
                >
                  Edit
                </button>
              </div>

              {/* Product Info */}
              <div className="flex gap-4 pb-4 border-b border-[#2A2A2D]/60 items-center">
                <div className="w-16 h-16 bg-[#222] border border-[#2A2A2D]/60 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">👓</span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-white font-bold text-sm sm:text-base leading-tight">{product.sku}</h3>
                  <p className="text-white text-xs font-semibold mt-0.5">{product.name}</p>
                  <div className="text-gray-500 text-[10px] mt-1.5 uppercase font-bold flex flex-wrap items-center gap-2">
                    <span>{color || 'Matte Black'}</span>
                    <span>·</span>
                    <span>Size: {product.frame ? `${product.frame.lensWidth}-${product.frame.bridgeWidth}-${product.frame.templeLength}` : '54-18-145'}</span>
                    <span>·</span>
                    <span className="text-white font-black">Qty: 1</span>
                  </div>
                </div>
              </div>

              {/* Specs Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs border-b border-[#2A2A2D]/60 pb-4 text-left">
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500 font-semibold uppercase text-[9px] tracking-wider">Lens Type</span>
                  <span className="text-white font-bold">{selectedType?.displayName}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500 font-semibold uppercase text-[9px] tracking-wider">Power</span>
                  <span className="text-white font-bold truncate max-w-[160px]">
                    {isZeroPower 
                      ? 'Zero Power' 
                      : powerMode === 'enter' 
                      ? `R: ${reSph} ${reCyl} ${reAxis} | L: ${leSph} ${leCyl} ${leAxis}` 
                      : powerMode === 'upload' 
                      ? 'File Uploaded' 
                      : 'WhatsApp Later'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500 font-semibold uppercase text-[9px] tracking-wider">PD</span>
                  <span className="text-white font-bold">{isZeroPower ? '-' : `${pd} mm`}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500 font-semibold uppercase text-[9px] tracking-wider">Lens Quality</span>
                  <span className="text-white font-bold">
                    {selectedType?.type === 'progressive' 
                      ? (selectedSubType?.displayName || 'HC Progressive') 
                      : (selectedQuality?.displayName || 'Standard')}
                  </span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 pt-1 text-left">
                <div className="space-y-2 text-xs text-[#A7A7A7]">
                  <div className="flex justify-between">
                    <span>Frame Price</span>
                    <span className="text-white font-medium">₹{framePrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lenses ({selectedType?.type === 'progressive' ? selectedSubType?.displayName : selectedQuality?.displayName})</span>
                    <span className="text-white font-medium">₹{chosenLensPrice}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      Fitting Charge 
                      <span className="text-gray-500 font-bold text-[9px] cursor-help" title="Fitting & Glazing Fee">(i)</span>
                    </span>
                    <span className="text-white font-medium font-mono">₹{fittingCharge}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    <span className="text-white font-medium">
                      {deliveryCharge === 0 ? <strong className="text-green-500 font-bold uppercase">Free</strong> : `₹${deliveryCharge}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-3 border-t border-[#2A2A2D]/60 font-black text-white">
                    <span>Subtotal</span>
                    <span>₹{subTotal}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Coupon Code Block */}
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-4 space-y-3">
              <span className="text-gray-500 text-[9px] font-black uppercase tracking-wider block text-left">Apply Coupon</span>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Enter code" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#D4A04D] uppercase font-bold"
                />
                <button 
                  onClick={handleApplyCoupon}
                  className="border border-[#D4A04D] text-[#D4A04D] hover:bg-[#D4A04D]/10 font-bold uppercase py-2 px-5 rounded-xl text-[10px] tracking-wider transition-colors cursor-pointer bg-transparent"
                >
                  Apply
                </button>
              </div>
              {couponError && <p className="text-red-400 text-[10px] font-bold text-left">{couponError}</p>}
              {couponSuccess && <p className="text-green-400 text-[10px] font-bold text-left">{couponSuccess}</p>}
            </div>

            {/* Gold Membership Banner */}
            <div className="bg-gradient-to-r from-[#1E1911] to-[#0E0E0F] border border-[#D4A04D]/30 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border border-[#D4A04D]/40 rounded-lg flex items-center justify-center text-[#D4A04D] font-extrabold text-sm flex-shrink-0 bg-[#0E0E0F]">
                  EG
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[#D4A04D] text-[9px] font-black uppercase tracking-widest">EYEGLAZE MEMBERSHIP</span>
                  <span className="text-white text-xs font-bold mt-1">Join & get exclusive benefits</span>
                  <span className="text-gray-500 text-[9px] mt-0.5">Free delivery, extended warranty & more! · ₹99 / year</span>
                </div>
              </div>
              <button 
                onClick={() => setIsMembershipAdded(!isMembershipAdded)}
                className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-[10px] uppercase px-4 py-2.5 rounded-lg transition-colors cursor-pointer border-none shrink-0"
              >
                {isMembershipAdded ? 'Joined' : 'Join Now'}
              </button>
            </div>

            {/* Checkout Secure Badges */}
            <div className="py-2 flex justify-center items-center gap-5 text-[8.5px] font-bold text-gray-500 uppercase tracking-widest text-center">
              <span>🔒 100% Secure Payment</span>
              <span>•</span>
              <span>🛡️ 1 Year Warranty</span>
              <span>•</span>
              <span>🔄 Easy Returns</span>
              <span>•</span>
              <span>🚚 Fast Delivery</span>
            </div>

            {/* Total Amount block */}
            <div className="flex justify-between items-center bg-[#131314] border border-[#2A2A2D]/85 rounded-xl p-4.5">
              <div className="text-left flex flex-col">
                <span className="text-white font-bold text-sm">Total Amount</span>
                {totalDiscount > 0 && (
                  <span className="text-green-500 text-[10px] font-semibold mt-0.5">You will save ₹{totalDiscount} on this order</span>
                )}
              </div>
              <span className="text-[#D4A04D] text-2xl font-black">₹{totalPrice}</span>
            </div>

            {/* Sticky Navigation Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#0E0E0F]/90 border-t border-[#2A2A2D] p-4 z-40 backdrop-blur-md">
              <div className="max-w-md mx-auto flex gap-3">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-[#131314] border border-[#2A2A2D] hover:border-white text-white font-extrabold uppercase py-3.5 rounded-xl text-xs tracking-wider transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmAndAdd}
                  disabled={submitting}
                  className="flex-1 bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold uppercase py-3.5 rounded-xl text-xs tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <span>{submitting ? 'PROCESSING...' : 'PROCEED TO PAYMENT'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Pupillary Distance Modal dialog */}
      {isPdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsPdModalOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-xs" />
          <div className="relative bg-[#131314] border border-[#2A2A2D] max-w-sm w-full rounded-2xl p-6 shadow-2xl z-10 text-center space-y-4">
            <h4 className="text-white font-black text-sm uppercase tracking-wider">How to Measure Pupil Distance (PD)</h4>
            <p className="text-[#A7A7A7] text-[11px] leading-relaxed">
              1. Hold a ruler horizontally against your forehead.<br />
              2. Align the 0mm mark directly under the pupil of one eye.<br />
              3. Look straight ahead and read the millimeter mark under the pupil of your other eye.<br />
              4. Average values are 58mm - 68mm.
            </p>
            <button 
              onClick={() => setIsPdModalOpen(false)}
              className="w-full bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold uppercase py-2.5 rounded-xl text-xs tracking-wider transition-colors cursor-pointer border-none"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
