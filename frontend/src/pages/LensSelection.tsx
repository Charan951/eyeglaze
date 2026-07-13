import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { socket } from '../lib/socket';

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
  powerPricing?: any[];
  minSph?: number;
  maxSph?: number;
  minCyl?: number;
  maxCyl?: number;
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

const parseSafeFloat = (val: any): number => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};

const getLensPriceForPower = (lens: any, sph: number, cyl: number): number => {
  if (!lens.powerPricing || lens.powerPricing.length === 0) {
    return lens.basePrice || lens.price || 0;
  }
  
  const matchingRule = lens.powerPricing.find((rule: any) => {
    const minS = Math.min(rule.minSph, rule.maxSph);
    const maxS = Math.max(rule.minSph, rule.maxSph);
    const minC = Math.min(rule.minCyl, rule.maxCyl);
    const maxC = Math.max(rule.minCyl, rule.maxCyl);
    
    return sph >= minS && sph <= maxS && cyl >= minC && cyl <= maxC;
  });
  
  return matchingRule ? matchingRule.price : (lens.basePrice || lens.price || 0);
};

const getLensPairPrice = (
  lens: any,
  powerMode: string,
  reSphVal: number,
  reCylVal: number,
  leSphVal: number,
  leCylVal: number
): number => {
  if (!lens) return 0;
  if (powerMode !== 'enter') {
    return lens.basePrice || lens.price || 0;
  }
  const rightPrice = getLensPriceForPower(lens, reSphVal, reCylVal);
  const leftPrice = getLensPriceForPower(lens, leSphVal, leCylVal);
  
  return Math.max(rightPrice, leftPrice);
};

export default function LensSelection() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, fetchCartCount } = useAuth();
  const productId = searchParams.get('product');
  const color = searchParams.get('color') || '';

  const [product, setProduct] = useState<Product | null>(null);
  const [lensTypes, setLensTypes] = useState<LensOption[]>([]);
  const [lensQualities, setLensQualities] = useState<LensOption[]>([]);
  const [customLenses, setCustomLenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Stepper State (1: LENS TYPE, 2: POWER, 3: QUALITY, 4: CHECKOUT)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Selections State
  const [selectedType, setSelectedType] = useState<LensOption | null>(null);
  const [selectedSubType, setSelectedSubType] = useState<LensOption | null>(null); // Progressive sub-tier (Step 2)
  const [selectedQuality, setSelectedQuality] = useState<LensOption | null>(null); // Quality/Coatings tier (Step 3)

  // Power Input State
  const [powerMode, setPowerMode] = useState<'enter' | 'upload' | 'zero'>('enter');
  const [prescriptionFileName, setPrescriptionFileName] = useState('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const [prescriptionName, setPrescriptionName] = useState('');
  const [prescriptionFileToUpload, setPrescriptionFileToUpload] = useState<File | null>(null);
  
  // Matches defaults in screenshots
  const [reSph, setReSph] = useState('-1.25');
  const [reCyl, setReCyl] = useState('-0.50');
  const [reAxis, setReAxis] = useState('180');
  const [reAdd, setReAdd] = useState('0.00');

  const [leSph, setLeSph] = useState('-1.75');
  const [leCyl, setLeCyl] = useState('-0.75');
  const [leAxis, setLeAxis] = useState('170');
  const [leAdd, setLeAdd] = useState('0.00');

  // Checkout States
  const [submitting, setSubmitting] = useState(false);

  // Saved Prescriptions State
  const [savedPrescriptions, setSavedPrescriptions] = useState<any[]>([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState('');

  // Custom Validation Overlay Modal State
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    message: string;
    allowedSphRange: string;
    allowedCylRange: string;
    currentSph: string;
    currentCyl: string;
    selectedLensName: string;
    suggestions: any[];
  }>({
    isOpen: false,
    message: '',
    allowedSphRange: '',
    allowedCylRange: '',
    currentSph: '',
    currentCyl: '',
    selectedLensName: '',
    suggestions: []
  });

  const getMappedLensTypesFromProduct = useCallback((
    prod: any,
    lensesList: any[],
    pMode: string,
    rSph: string,
    rCyl: string,
    lSph: string,
    lCyl: string
  ): LensOption[] => {
    if (!prod || !prod.lensTypes) return [];
    
    // Group custom lenses by their type ID or name to find the minimum/starting price
    const minPrices: Record<string, number> = {};
    lensesList.forEach((lens: any) => {
      const typeId = typeof lens.lensType === 'object' 
        ? (lens.lensType?._id?.toString() || '') 
        : (lens.lensType?.toString() || '');
      if (typeId) {
        const dynamicPrice = getLensPairPrice(
          lens,
          pMode,
          parseSafeFloat(rSph),
          parseSafeFloat(rCyl),
          parseSafeFloat(lSph),
          parseSafeFloat(lCyl)
        );
        if (minPrices[typeId] === undefined || dynamicPrice < minPrices[typeId]) {
          minPrices[typeId] = dynamicPrice;
        }
      }
    });

    return prod.lensTypes.map((t: any) => {
      const id = typeof t === 'object' ? t._id : t;
      const name = typeof t === 'object' ? t.name : '';
      
      const lowercaseName = name.toLowerCase();
      let type = 'zero_power';
      let description = 'Clear lenses for everyday wear with no prescription.';
      let displayName = name;
      
      if (lowercaseName.includes('single vision')) {
        type = 'single_vision';
        description = 'Single vision lenses corrected for distance or reading.';
      } else if (lowercaseName.includes('progressive')) {
        type = 'progressive';
        description = 'Multifocal lenses for clear vision at all distances.';
      } else if (lowercaseName.includes('blue cut') || lowercaseName.includes('bluecut')) {
        type = 'bluecut';
        description = 'Protects eyes from harmful blue light emitted by digital screens.';
      } else if (lowercaseName.includes('photochromic')) {
        type = 'photochromic';
        description = 'Lenses that darken automatically in sunlight and stay clear indoors.';
      } else if (lowercaseName.includes('zero power')) {
        type = 'zero_power';
        description = 'Clear lenses for everyday wear with no prescription.';
      } else if (lowercaseName.includes('power')) {
        type = 'single_vision';
        description = 'Prescription lenses tailored to your power requirements.';
      }

      return {
        _id: id,
        kind: 'type',
        type,
        displayName,
        name,
        description,
        price: minPrices[id] || 999,
        startingPrice: minPrices[id] || 999,
        features: [],
        isBestseller: lowercaseName.includes('with power') || lowercaseName.includes('zero power')
      };
    }).filter((t: any) => t.name);
  }, []);

  const formatValue = (val?: number) => {
    if (val === undefined || isNaN(val)) return '0.00';
    return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
  };

  const formatOptionLabel = (pr: any) => {
    const date = new Date(pr.createdAt).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    if (pr.uploadedFile || pr.imageUrl) {
      return pr.name 
        ? `📄 ${pr.name} (Uploaded on ${date})`
        : `📄 Uploaded Prescription Document (Saved on ${date})`;
    }
    const reStr = `R: ${formatValue(pr.RE?.sph)} ${formatValue(pr.RE?.cyl)} ${pr.RE?.axis || '0'}°`;
    const leStr = `L: ${formatValue(pr.LE?.sph)} ${formatValue(pr.LE?.cyl)} ${pr.LE?.axis || '0'}°`;
    const pdStr = pr.pd ? ` (PD: ${pr.pd}mm)` : '';
    return pr.name 
      ? `👓 ${pr.name} - ${reStr} | ${leStr}${pdStr}`
      : `👓 Manual Power - ${reStr} | ${leStr}${pdStr}`;
  };

  useEffect(() => {
    if (currentStep === 1 && user) {
      api.get('/prescriptions')
        .then(res => {
          setSavedPrescriptions(res.data.prescriptions || []);
        })
        .catch(err => console.error('Failed to fetch saved prescriptions:', err));
    }
  }, [currentStep, user]);

  const handleSelectSavedPrescription = (id: string) => {
    setSelectedPrescriptionId(id);
    const selected = savedPrescriptions.find(p => p._id === id);
    if (selected) {
      setPrescriptionName(selected.name || '');
      if (selected.uploadedFile || selected.imageUrl) {
        setPowerMode('upload');
        const url = selected.uploadedFile || selected.imageUrl || '';
        setUploadedFileUrl(url);
        
        let filename = 'Saved Prescription Document';
        try {
          const u = new URL(url);
          const pathSegments = u.pathname.split('/');
          filename = pathSegments[pathSegments.length - 1] || 'prescription_document.jpg';
        } catch (e) {
          const pathSegments = url.split('/');
          filename = pathSegments[pathSegments.length - 1] || 'prescription_document.jpg';
        }
        setPrescriptionFileName(decodeURIComponent(filename));
      } else {
        setPowerMode('enter');
        if (selected.RE) {
          setReSph(selected.RE.sph !== undefined ? selected.RE.sph.toFixed(2) : '0.00');
          setReCyl(selected.RE.cyl !== undefined ? selected.RE.cyl.toFixed(2) : '0.00');
          setReAxis(selected.RE.axis !== undefined ? selected.RE.axis.toString() : '0');
          setReAdd(selected.RE.addPower !== undefined ? selected.RE.addPower.toFixed(2) : '0.00');
        }
        if (selected.LE) {
          setLeSph(selected.LE.sph !== undefined ? selected.LE.sph.toFixed(2) : '0.00');
          setLeCyl(selected.LE.cyl !== undefined ? selected.LE.cyl.toFixed(2) : '0.00');
          setLeAxis(selected.LE.axis !== undefined ? selected.LE.axis.toString() : '0');
          setLeAdd(selected.LE.addPower !== undefined ? selected.LE.addPower.toFixed(2) : '0.00');
        }
      }
    }
  };

  const fetchLensSelectionData = useCallback((isInitial = false) => {
    if (!productId) {
      setError('Product ID is missing in query parameters');
      setLoading(false);
      return;
    }

    if (isInitial) {
      setLoading(true);
      setError('');
    }

    // Fetch product details first, then use category to fetch lens types & lenses
    api.get(`/products/${productId}`)
      .then(async (prodRes) => {
        const prod = prodRes.data.product || prodRes.data;
        setProduct(prod);

        const category = prod.category || 'eyeglasses';
        
        try {
          const lensOptionsRes = await api.get(`/lens-options?category=${category}`);

          const dbLensTypes = lensOptionsRes.data.lensTypes || [];
          const dbLenses = lensOptionsRes.data.lenses || [];

          // Map dbLensTypes to LensOption structure
          const mappedDbTypes: LensOption[] = dbLensTypes.map((t: any) => {
            const lowercaseName = t.name.toLowerCase();
            let type = 'zero_power';
            let description = 'Clear lenses for everyday wear with no prescription.';
            
            if (lowercaseName.includes('single vision')) {
              type = 'single_vision';
              description = 'Single vision lenses corrected for distance or reading.';
            } else if (lowercaseName.includes('progressive')) {
              type = 'progressive';
              description = 'Multifocal lenses for clear vision at all distances.';
            } else if (lowercaseName.includes('blue cut') || lowercaseName.includes('bluecut')) {
              type = 'bluecut';
              description = 'Protects eyes from harmful blue light emitted by digital screens.';
            } else if (lowercaseName.includes('photochromic')) {
              type = 'photochromic';
              description = 'Lenses that darken automatically in sunlight and stay clear indoors.';
            } else if (lowercaseName.includes('zero power')) {
              type = 'zero_power';
              description = 'Clear lenses for everyday wear with no prescription.';
            } else if (lowercaseName.includes('power')) {
              type = 'single_vision';
              description = 'Prescription lenses tailored to your power requirements.';
            }

            return {
              _id: t._id,
              kind: 'type',
              type,
              displayName: t.name,
              name: t.name,
              description,
              price: t.startingPrice || t.price || 999,
              startingPrice: t.startingPrice || t.price || 999,
              features: t.features || [],
              isBestseller: lowercaseName.includes('with power') || lowercaseName.includes('zero power')
            };
          });

          setLensTypes(mappedDbTypes);

          // Map dbLenses to qualities structure
          const mappedDbQualities: LensOption[] = dbLenses.map((l: any) => ({
            _id: l._id,
            kind: 'quality',
            name: l.name,
            displayName: l.name,
            price: l.basePrice || l.price || 0,
            features: ['UV Protection', 'Scratch Resistant'],
            powerPricing: l.powerPricing,
            minSph: l.minSph,
            maxSph: l.maxSph,
            minCyl: l.minCyl,
            maxCyl: l.maxCyl
          }));
          setLensQualities(mappedDbQualities);

          const productLenses = prodRes.data.lenses || [];
          let customLensesList = productLenses;

          if (customLensesList.length === 0) {
            // Filter global lenses to only those belonging to the category's lens types
            const typeIds = dbLensTypes.map((t: any) => t._id.toString());
            customLensesList = dbLenses.filter((l: any) => {
              const tId = typeof l.lensType === 'object' ? l.lensType?._id?.toString() : l.lensType?.toString();
              return typeIds.includes(tId);
            });
          }
          setCustomLenses(customLensesList);

          const mappedTypes = getMappedLensTypesFromProduct(prod, customLensesList, 'enter', '-1.25', '-0.50', '-1.75', '-0.75');

          if (isInitial) {
            if (customLensesList.length > 0 && mappedTypes.length > 0) {
              const defaultType = mappedTypes.find((t: LensOption) => t.type === 'single_vision') || mappedTypes[0];
              setSelectedType(defaultType);
              if (defaultType.type === 'zero_power') {
                setPowerMode('zero');
              } else {
                setPowerMode('enter');
              }

              const lensesForDefault = customLensesList.filter((lens: any) => {
                const typeId = typeof lens.lensType === 'object' ? lens.lensType?._id?.toString() : lens.lensType?.toString();
                return typeId === defaultType._id.toString();
              });
              if (lensesForDefault.length > 0) {
                const firstLens = lensesForDefault[0];
                setSelectedQuality({
                  _id: firstLens._id,
                  kind: 'quality',
                  name: firstLens.name,
                  displayName: firstLens.name,
                  price: getLensPairPrice(firstLens, 'enter', -1.25, -0.50, -1.75, -0.75),
                  features: ['UV Protection', 'Scratch Resistant'],
                  powerPricing: firstLens.powerPricing,
                  minSph: firstLens.minSph,
                  maxSph: firstLens.maxSph,
                  minCyl: firstLens.minCyl,
                  maxCyl: firstLens.maxCyl
                } as any);
              }
            } else {
              if (mappedDbTypes.length > 0) {
                const sv = mappedDbTypes.find((t: LensOption) => t.type === 'single_vision') || mappedDbTypes[0];
                setSelectedType(sv);
                if (sv.type === 'zero_power') {
                  setPowerMode('zero');
                } else {
                  setPowerMode('enter');
                }
              }
            }
          }

        } catch (err) {
          console.error('Failed to fetch lens types/lenses:', err);
          setError('Failed to load lens options.');
        }
      })
      .catch((err) => {
        console.error('Failed to load product details:', err);
        setError('Failed to load product details.');
      })
      .finally(() => {
        if (isInitial) {
          setLoading(false);
        }
      });
  }, [productId, getMappedLensTypesFromProduct]);

  // Filter types by compatibility
  const compatibleTypes = lensTypes.filter(opt => {
    if (!product || !product.compatible) return true;
    const { compatible } = product;

    if (opt.type === 'single_vision') return compatible.prescription;
    if (opt.type === 'progressive') return compatible.progressive || compatible.prescription;
    if (opt.type === 'zero_power') return compatible.zeropower;
    if (opt.type === 'bluecut') return compatible.bluecut;
    if (opt.type === 'photochromic') return true;

    return true;
  });

  const mainLensTypes = customLenses.length > 0 
    ? getMappedLensTypesFromProduct(product, customLenses, powerMode, reSph, reCyl, leSph, leCyl)
    : compatibleTypes.filter(t => !t.subType);
  const currentSubTypes = compatibleTypes.filter(t => t.type === selectedType?.type && t.subType);
  
  const filteredLensTypes = mainLensTypes;

  useEffect(() => {
    fetchLensSelectionData(true);
  }, [fetchLensSelectionData]);

  // Real-time socket updates for lenses & types
  useEffect(() => {
    const handleSocketUpdate = () => {
      fetchLensSelectionData(false);
    };

    socket.on('lens_type_changed', handleSocketUpdate);
    socket.on('lens_changed', handleSocketUpdate);

    return () => {
      socket.off('lens_type_changed', handleSocketUpdate);
      socket.off('lens_changed', handleSocketUpdate);
    };
  }, [fetchLensSelectionData]);

  // Set default power mode
  useEffect(() => {
    if (selectedType?.type === 'zero_power') {
      setPowerMode('zero');
    } else {
      setPowerMode('enter');
    }
  }, [product]);

  // Auto-select lens type if current selection is invalid
  useEffect(() => {
    if (!product || mainLensTypes.length === 0) return;
    
    const allowedTypes = mainLensTypes;

    if (allowedTypes.length > 0) {
      const isCurrentAllowed = selectedType && allowedTypes.some(t => t._id === selectedType._id);
      if (!isCurrentAllowed) {
        const defaultType = allowedTypes.find(t => t.type === 'single_vision') || allowedTypes[0];
        setSelectedType(defaultType);
        if (defaultType.type === 'zero_power') {
          setPowerMode('zero');
        } else {
          setPowerMode('enter');
        }
      }
    }
  }, [product, lensTypes, mainLensTypes]);

  // Handle progressive sub-type defaults
  useEffect(() => {
    if (selectedType && customLenses.length === 0) {
      const subTypes = lensTypes.filter(t => t.type === selectedType.type && t.subType);
      if (subTypes.length > 0) {
        const best = subTypes.find(t => t.isBestseller) || subTypes[0];
        setSelectedSubType(best);
      } else {
        setSelectedSubType(null);
      }
    }
  }, [selectedType, lensTypes, customLenses]);

  // Auto-select first custom lens when selected type changes (for custom mode)
  useEffect(() => {
    if (selectedType && customLenses.length > 0) {
      const lensesForType = customLenses.filter((lens: any) => {
        const typeId = typeof lens.lensType === 'object' 
          ? (lens.lensType?._id?.toString() || '') 
          : (lens.lensType?.toString() || '');
        const selectedTypeId = selectedType?._id?.toString() || '';
        return typeId === selectedTypeId;
      });
      if (lensesForType.length > 0) {
        const firstLens = lensesForType[0];
        setSelectedQuality({
          _id: firstLens._id,
          kind: 'quality',
          name: firstLens.name,
          displayName: firstLens.name,
          price: getLensPairPrice(
            firstLens,
            powerMode,
            parseSafeFloat(reSph),
            parseSafeFloat(reCyl),
            parseSafeFloat(leSph),
            parseSafeFloat(leCyl)
          ),
          features: ['UV Protection', 'Scratch Resistant'],
          powerPricing: firstLens.powerPricing,
          minSph: firstLens.minSph,
          maxSph: firstLens.maxSph,
          minCyl: firstLens.minCyl,
          maxCyl: firstLens.maxCyl
        } as any);
      } else {
        setSelectedQuality(null);
      }
    }
  }, [selectedType, customLenses, powerMode, reSph, reCyl, leSph, leCyl]);

  const getCurrentLensPrice = (lens: any) => {
    if (!lens) return 0;
    return getLensPairPrice(
      lens,
      powerMode,
      parseSafeFloat(reSph),
      parseSafeFloat(reCyl),
      parseSafeFloat(leSph),
      parseSafeFloat(leCyl)
    );
  };

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

  const stepsConfig = [
    { step: 1, label: 'LENS TYPE' },
    { step: 2, label: 'QUALITY' },
    { step: 3, label: 'POWER' }
  ];

  // Navigation Handlers
  const handleNext = () => {
    if (currentStep === 1) {
      if (!selectedType) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (customLenses.length > 0) {
        if (!selectedQuality) return;
      } else if (selectedType?.type === 'progressive') {
        if (!selectedSubType) return;
      } else {
        if (!selectedQuality) return;
      }
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const compressPrescription = (file: File): Promise<{ blob: Blob | null; dataUrl: string }> => {
    if (file.type === 'application/pdf') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({ blob: null, dataUrl: reader.result as string });
        reader.onerror = (err) => reject(err);
      });
    }

    return new Promise((resolve, reject) => {
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
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas compression failed'));
                return;
              }
              resolve({ blob, dataUrl: canvas.toDataURL('image/jpeg', 0.85) });
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
        const { blob, dataUrl } = await compressPrescription(file);
        setUploadedFileUrl(dataUrl);
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          setPrescriptionFileToUpload(compressedFile);
        } else {
          setPrescriptionFileToUpload(file);
        }
      } catch (err) {
        console.error('Prescription compression failed:', err);
        alert('Failed to process prescription. Please try again.');
      } finally {
        setUploadingPrescription(false);
      }
    }
  };



  const executeAddToCart = async (lensObj: any) => {
    setSubmitting(true);
    try {
      let finalUploadedUrl = uploadedFileUrl;

      if (user) {
        if (powerMode === 'upload' && prescriptionFileToUpload) {
          const formData = new FormData();
          formData.append('file', prescriptionFileToUpload);
          if (prescriptionName.trim()) {
            formData.append('name', prescriptionName.trim());
          }
          try {
            const res = await api.post('/prescriptions', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            finalUploadedUrl = res.data.prescription?.uploadedFile || res.data.prescription?.imageUrl || '';
            setUploadedFileUrl(finalUploadedUrl);
          } catch (err) {
            console.error('Failed to upload prescription to database:', err);
            alert('Failed to save prescription. Please try again.');
            setSubmitting(false);
            return;
          }
        } else if (powerMode === 'enter' && !selectedPrescriptionId) {
          try {
            const payload: any = {
              RE: JSON.stringify({ sph: parseFloat(reSph), cyl: parseFloat(reCyl), axis: parseInt(reAxis), addPower: parseFloat(reAdd) }),
              LE: JSON.stringify({ sph: parseFloat(leSph), cyl: parseFloat(leCyl), axis: parseInt(leAxis), addPower: parseFloat(leAdd) }),
              pd: 62
            };
            if (prescriptionName.trim()) {
              payload.name = prescriptionName.trim();
            }
            await api.post('/prescriptions', payload);
          } catch (err) {
            console.error('Failed to save manual prescription to database:', err);
          }
        }
      }

      const basePrice = selectedType?.type === 'progressive' 
        ? (selectedSubType?.price || 2499)
        : (getLensPairPrice(
            lensObj,
            powerMode,
            parseSafeFloat(reSph),
            parseSafeFloat(reCyl),
            parseSafeFloat(leSph),
            parseSafeFloat(leCyl)
          ) || selectedType?.price || 699);

      // Determine power object based on user's choice, not lens type!
      let powerObj;
      if (powerMode === 'enter') {
        powerObj = {
          RE: { sph: parseFloat(reSph), cyl: parseFloat(reCyl), axis: parseInt(reAxis), addPower: parseFloat(reAdd) },
          LE: { sph: parseFloat(leSph), cyl: parseFloat(leCyl), axis: parseInt(leAxis), addPower: parseFloat(leAdd) },
          pd: 62,
          addPower: parseFloat(reAdd)
        };
      } else if (powerMode === 'upload') {
        powerObj = { uploadLater: true, uploadedFileUrl: finalUploadedUrl };
      } else {
        powerObj = { RE: { sph: 0 }, LE: { sph: 0 } };
      }

      const lensPayload = {
        lensType: selectedType?.displayName || selectedType?.name,
        lensSubType: selectedSubType?.displayName || selectedSubType?.name || undefined,
        lensQuality: lensObj?.displayName || lensObj?.name || 'Standard Coating',
        lensPrice: basePrice,
        fittingCharge: 199,
        power: powerObj
      };

      if (user && powerMode === 'enter') {
        try {
          await api.post('/prescriptions', {
            RE: JSON.stringify({ sph: parseFloat(reSph), cyl: parseFloat(reCyl), axis: parseInt(reAxis), addPower: parseFloat(reAdd) }),
            LE: JSON.stringify({ sph: parseFloat(leSph), cyl: parseFloat(leCyl), axis: parseInt(leAxis), addPower: parseFloat(leAdd) }),
            pd: 62
          });
        } catch (err) {
          console.error('Failed to save manual prescription to database:', err);
        }
      }

      if (!user) {
        // Guest user local cart flow
        const guestCartStr = localStorage.getItem('guest_cart');
        const cart = guestCartStr ? JSON.parse(guestCartStr) : [];
        
        const newItem = {
          id: `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId: product._id,
          qty: 1,
          color: color || 'Matte Black',
          name: product.name,
          sku: product.sku,
          lens: `${selectedType?.displayName || selectedType?.name}${
            selectedSubType ? ` (${selectedSubType.displayName})` : ` (${lensObj?.displayName || 'Standard Coating'})`
          }`,
          framePrice: product.price?.selling ?? 1,
          lensPrice: basePrice,
          fittingCharge: 199,
          image: product.images?.[0] || '',
          lensPayload
        };

        cart.push(newItem);
        localStorage.setItem('guest_cart', JSON.stringify(cart));
        await fetchCartCount();
        navigate('/cart');
        return;
      }

      const payload = {
        productId: product._id,
        color: color,
        qty: 1,
        lens: lensPayload
      };

      await api.post('/cart', payload);
      await fetchCartCount();
      navigate('/cart');
    } catch (err) {
      console.error('Failed to add product with lens config:', err);
      alert('Failed to add config to cart. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectSuggestedLens = (suggestedLens: any) => {
    setSelectedQuality({
      _id: suggestedLens._id,
      kind: 'quality',
      name: suggestedLens.name,
      displayName: suggestedLens.name,
      price: getLensPairPrice(
        suggestedLens,
        powerMode,
        parseSafeFloat(reSph),
        parseSafeFloat(reCyl),
        parseSafeFloat(leSph),
        parseSafeFloat(leCyl)
      ),
      features: ['UV Protection', 'Scratch Resistant'],
      powerPricing: suggestedLens.powerPricing,
      minSph: suggestedLens.minSph,
      maxSph: suggestedLens.maxSph,
      minCyl: suggestedLens.minCyl,
      maxCyl: suggestedLens.maxCyl
    } as any);

    setValidationModal(prev => ({ ...prev, isOpen: false }));
    executeAddToCart(suggestedLens);
  };

  const handleConfirmAndAdd = async () => {
    // Check validation for both enter and upload modes, regardless of lens type
    if (powerMode === 'enter') {
      const hasAstigmatismRE = parseFloat(reCyl) !== 0;
      const hasAstigmatismLE = parseFloat(leCyl) !== 0;
      if ((hasAstigmatismRE && !reAxis) || (hasAstigmatismLE && !leAxis)) {
        alert('Please enter AXIS for astigmatism (when CYL is not 0)');
        return;
      }

      const targetLens = selectedQuality || selectedSubType;
      if (targetLens) {
        const minSph = targetLens.minSph !== undefined ? targetLens.minSph : -20;
        const maxSph = targetLens.maxSph !== undefined ? targetLens.maxSph : 20;
        const minCyl = targetLens.minCyl !== undefined ? targetLens.minCyl : -6;
        const maxCyl = targetLens.maxCyl !== undefined ? targetLens.maxCyl : 6;

        const reSphVal = parseFloat(reSph) || 0;
        const reCylVal = parseFloat(reCyl) || 0;
        const leSphVal = parseFloat(leSph) || 0;
        const leCylVal = parseFloat(leCyl) || 0;

        const isReSphOutOfRange = reSphVal < Math.min(minSph, maxSph) || reSphVal > Math.max(minSph, maxSph);
        const isReCylOutOfRange = reCylVal < Math.min(minCyl, maxCyl) || reCylVal > Math.max(minCyl, maxCyl);
        const isLeSphOutOfRange = leSphVal < Math.min(minSph, maxSph) || leSphVal > Math.max(minSph, maxSph);
        const isLeCylOutOfRange = leCylVal < Math.min(minCyl, maxCyl) || leCylVal > Math.max(minCyl, maxCyl);

        if (isReSphOutOfRange || isReCylOutOfRange || isLeSphOutOfRange || isLeCylOutOfRange) {
          // Find alternative lenses in the SAME category that support this power range!
          const list = customLenses.length > 0 ? customLenses : lensQualities;
          const suggestions = list.filter((lens: any) => {
            const lMinSph = lens.minSph !== undefined ? lens.minSph : -20;
            const lMaxSph = lens.maxSph !== undefined ? lens.maxSph : 20;
            const lMinCyl = lens.minCyl !== undefined ? lens.minCyl : -6;
            const lMaxCyl = lens.maxCyl !== undefined ? lens.maxCyl : 6;

            return (
              reSphVal >= Math.min(lMinSph, lMaxSph) && reSphVal <= Math.max(lMinSph, lMaxSph) &&
              reCylVal >= Math.min(lMinCyl, lMaxCyl) && reCylVal <= Math.max(lMinCyl, lMaxCyl) &&
              leSphVal >= Math.min(lMinSph, lMaxSph) && leSphVal <= Math.max(lMinSph, lMaxSph) &&
              leCylVal >= Math.min(lMinCyl, lMaxCyl) && leCylVal <= Math.max(lMinCyl, lMaxCyl)
            );
          });

          setValidationModal({
            isOpen: true,
            message: `Your prescription power is out of range for the selected lens "${targetLens.displayName || targetLens.name}".`,
            allowedSphRange: `[${Math.min(minSph, maxSph).toFixed(2)}, ${Math.max(minSph, maxSph).toFixed(2)}]`,
            allowedCylRange: `[${Math.min(minCyl, maxCyl).toFixed(2)}, ${Math.max(minCyl, maxCyl).toFixed(2)}]`,
            currentSph: `R: ${reSphVal > 0 ? '+' : ''}${reSphVal.toFixed(2)} / L: ${leSphVal > 0 ? '+' : ''}${leSphVal.toFixed(2)}`,
            currentCyl: `R: ${reCylVal > 0 ? '+' : ''}${reCylVal.toFixed(2)} / L: ${leCylVal > 0 ? '+' : ''}${leCylVal.toFixed(2)}`,
            selectedLensName: targetLens.displayName || targetLens.name,
            suggestions
          });
          return;
        }
      }
    } else if (powerMode === 'upload') {
      if (uploadingPrescription) {
        alert('Please wait for the prescription file to finish uploading.');
        return;
      }
      if (!uploadedFileUrl) {
        alert('Please select and upload a prescription file first.');
        return;
      }
    }

    executeAddToCart(selectedQuality);
  };



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
      <SEO robots="noindex, nofollow" title="Configure Lenses" />

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
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] relative transition-all ${
                    isCompleted 
                      ? 'bg-[#D4A04D] text-black' 
                      : isActive 
                      ? 'bg-[#D4A04D] text-black shadow-[0_0_15px_rgba(212,160,77,0.4)]' 
                      : 'border-2 border-[#2A2A2D] text-gray-500 bg-transparent'
                  }`}>
                    {isCompleted ? '✓' : item.step}
                    {isActive && (
                      <span className="absolute inset-0 rounded-full border border-[#D4A04D] animate-ping opacity-30 pointer-events-none" />
                    )}
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
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-2" />
                ) : (
                  <span className="text-3xl">👓</span>
                )}
              </div>
              
              {/* Product Details and Button */}
              <div className="flex flex-col flex-1 w-full justify-between h-full py-1 gap-3 sm:gap-2 text-left">
                <div className="space-y-1">
                  <h3 className="text-white text-base sm:text-lg font-bold leading-tight">
                    {product.name}
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
            <div className="bg-[#131314]/90 border border-[#2A2A2D]/80 rounded-2xl p-4.5 mb-6 flex flex-col animate-fade-in">
              {/* Top Row: Image & Details */}
              <div className="flex items-center gap-4.5">
                <div className="w-20 h-20 bg-[#1A1A1C] border border-[#2A2A2D] rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <span className="text-2xl">👓</span>
                  )}
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-white text-base sm:text-lg font-bold leading-tight">{product.name}</span>
                  <span className="text-gray-500 text-xs font-medium mt-0.5">{color || 'Matte Black'}</span>
                </div>
              </div>
              
              {/* Divider Line spanning full width */}
              <div className="w-full border-t border-[#2A2A2D]/40 my-3.5" />
              
              {/* Bottom Row: Selections and Edit links */}
              <div className="space-y-3">
                {/* Lens Type Selection (shown in Step 2 and 3) */}
                {selectedType && (
                  <div className="flex items-start justify-between w-full text-xs">
                    <div className="flex items-start gap-4 flex-1 pr-4">
                      <span className="text-gray-500 font-medium whitespace-nowrap">Lens Type:</span>
                      <span className="text-[#D4A04D] font-bold leading-normal text-left">
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
                )}

                {/* Lens Quality Selection (only shown in Step 3) */}
                {currentStep === 3 && (selectedQuality || selectedSubType) && (
                  <>
                    <div className="w-full border-t border-[#2A2A2D]/20 my-1" />
                    <div className="flex items-start justify-between w-full text-xs">
                      <div className="flex items-start gap-4 flex-1 pr-4">
                        <span className="text-gray-500 font-medium whitespace-nowrap">Lens Quality:</span>
                        <span className="text-[#D4A04D] font-bold leading-normal text-left">
                          {selectedQuality?.displayName || selectedSubType?.displayName}
                        </span>
                      </div>
                      <button 
                        onClick={() => setCurrentStep(2)} 
                        className="text-[#D4A04D] hover:underline font-bold text-xs bg-transparent border-none cursor-pointer p-0 shrink-0 self-center"
                      >
                        Edit
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        )}

        {/* ================= STEP 3: ENTER POWER ================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Block */}
            <div className="text-left">
              <h1 className="text-lg font-black text-white uppercase tracking-wider">Select Power Option</h1>
              <p className="text-[#A7A7A7] text-[11px] font-medium mt-1">Choose how you want to configure your lens power</p>
            </div>

            {/* Prescription Form Block */}
            <div className="bg-[#131314]/90 border border-[#2A2A2D]/80 rounded-2xl p-5 space-y-6 transition-all duration-300">
                {user && savedPrescriptions.length > 0 && (powerMode as any) !== 'zero' && (
                  <div className="bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl p-4.5 space-y-2">
                    <label className="text-[#D4A04D] text-[10px] font-extrabold uppercase tracking-wider block">
                      📂 Add Saved Power
                    </label>
                    <select
                      value={selectedPrescriptionId}
                      onChange={(e) => handleSelectSavedPrescription(e.target.value)}
                      className="w-full bg-[#131314] border border-[#2A2A2D] rounded-lg px-3 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4A04D] cursor-pointer"
                    >
                      <option value="">-- Select from Saved Powers --</option>
                      {savedPrescriptions.map((pr: any) => (
                        <option key={pr._id} value={pr._id}>
                          {formatOptionLabel(pr)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {powerMode === 'zero' ? (
                  <div className="bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl p-6 text-center space-y-4 py-8 animate-fade-in">
                    <div className="text-4xl text-[#D4A04D] text-center">👓</div>
                    <h3 className="text-white font-black text-sm uppercase tracking-wider text-center">Zero Power Lenses Selected</h3>
                    <p className="text-gray-500 text-xs max-w-sm mx-auto leading-relaxed text-center">
                      These lenses are designed for cosmetic use or digital screen protection and do not require any prescription power.
                    </p>
                    <div className="text-center">
                      <div className="inline-block bg-[#D4A04D]/10 border border-[#D4A04D]/35 text-[#D4A04D] text-[10px] font-extrabold uppercase px-4 py-2 rounded-lg tracking-wider">
                        ✓ Ready to add to cart
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Segmented Control Tabs */}
                    <div className="flex bg-[#0B0B0C] border border-[#2A2A2D]/80 rounded-xl p-1">
                      <button
                        onClick={() => setPowerMode('enter')}
                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all text-center border-none cursor-pointer ${
                          powerMode === 'enter' 
                            ? 'bg-[#D4A04D] text-black shadow-md font-extrabold' 
                            : 'text-gray-500 hover:text-white bg-transparent'
                        }`}
                      >
                        Enter Manually
                      </button>
                      <button
                        onClick={() => setPowerMode('upload')}
                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all text-center border-none cursor-pointer ${
                          powerMode === 'upload' 
                            ? 'bg-[#D4A04D] text-black shadow-md font-extrabold' 
                            : 'text-gray-500 hover:text-white bg-transparent'
                        }`}
                      >
                        Upload
                      </button>
                    </div>

                    {/* Manual entry view */}
                    {powerMode === 'enter' && (
                      <div className="space-y-6 pt-2 text-left animate-fade-in">
                        <div>
                          <h4 className="text-white font-bold text-xs uppercase tracking-wider">{selectedType?.displayName || 'Prescription Lenses'}</h4>
                          <p className="text-gray-500 text-[10px] mt-0.5">For distance or near vision with a single power.</p>
                        </div>

                        {user && savedPrescriptions.length === 0 && (
                          <p className="text-gray-500 text-[9px] mt-2 italic">
                            ℹ️ Power entered manually will be saved to your account dashboard for future orders.
                          </p>
                        )}

                        {/* Grid */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-5 gap-2 text-center text-[8px] font-extrabold text-[#A7A7A7] border-b border-[#2A2A2D]/70 pb-2 uppercase tracking-widest">
                            <div className="text-left" />
                            <div>SPH (Sphere)</div>
                            <div>CYL (Cylinder)</div>
                            <div>AXIS</div>
                            <div>ADD</div>
                          </div>

                          {/* Right Eye Row */}
                          <div className="grid grid-cols-5 gap-2 items-center text-center">
                            <div className="text-white text-xs font-black text-left">R (Right)</div>
                            <div>
                              <select value={reSph} onChange={e => setReSph(e.target.value)} className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-2 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4A04D] cursor-pointer transition-all">
                                {Array.from({ length: 81 }, (_, i) => (-10 + i * 0.25).toFixed(2)).map(v => (
                                  <option key={v} value={v}>{parseFloat(v) > 0 ? `+${v}` : v}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <select value={reCyl} onChange={e => setReCyl(e.target.value)} className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-2 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4A04D] cursor-pointer transition-all">
                                {Array.from({ length: 49 }, (_, i) => (-6 + i * 0.25).toFixed(2)).map(v => (
                                  <option key={v} value={v}>{parseFloat(v) > 0 ? `+${v}` : v}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <select value={reAxis} onChange={e => setReAxis(e.target.value)} className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-2 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4A04D] cursor-pointer transition-all">
                                {Array.from({ length: 181 }, (_, i) => i.toString()).map(v => (
                                  <option key={v} value={v}>{v}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <select value={reAdd} onChange={e => setReAdd(e.target.value)} className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-2 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4A04D] cursor-pointer transition-all">
                                <option value="0.00">0.00</option>
                                {['+1.00', '+1.25', '+1.50', '+1.75', '+2.00', '+2.25', '+2.50', '+2.75', '+3.00'].map(power => (
                                  <option key={power} value={power.replace('+', '')}>{power}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Left Eye Row */}
                          <div className="grid grid-cols-5 gap-2 items-center text-center">
                            <div className="text-white text-xs font-black text-left">L (Left)</div>
                            <div>
                              <select value={leSph} onChange={e => setLeSph(e.target.value)} className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-2 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4A04D] cursor-pointer transition-all">
                                {Array.from({ length: 81 }, (_, i) => (-10 + i * 0.25).toFixed(2)).map(v => (
                                  <option key={v} value={v}>{parseFloat(v) > 0 ? `+${v}` : v}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <select value={leCyl} onChange={e => setLeCyl(e.target.value)} className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-2 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4A04D] cursor-pointer transition-all">
                                {Array.from({ length: 49 }, (_, i) => (-6 + i * 0.25).toFixed(2)).map(v => (
                                  <option key={v} value={v}>{parseFloat(v) > 0 ? `+${v}` : v}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <select value={leAxis} onChange={e => setLeAxis(e.target.value)} className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-2 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4A04D] cursor-pointer transition-all">
                                {Array.from({ length: 181 }, (_, i) => i.toString()).map(v => (
                                  <option key={v} value={v}>{v}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <select value={leAdd} onChange={e => setLeAdd(e.target.value)} className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-2 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4A04D] cursor-pointer transition-all">
                                <option value="0.00">0.00</option>
                                {['+1.00', '+1.25', '+1.50', '+1.75', '+2.00', '+2.25', '+2.50', '+2.75', '+3.00'].map(power => (
                                  <option key={power} value={power.replace('+', '')}>{power}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {user && (
                          <div className="pt-4 border-t border-[#2A2A2D]/55 mt-6">
                            <label className="text-[#A7A7A7] text-[10px] font-extrabold uppercase tracking-wide block mb-2">
                              Save this Power as (Optional)
                            </label>
                            <input 
                              type="text" 
                              placeholder="e.g. My Daily Power, Dad's Reading Glasses" 
                              value={prescriptionName}
                              onChange={e => setPrescriptionName(e.target.value)}
                              className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4A04D]"
                            />
                          </div>
                        )}
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
                        {uploadedFileUrl && (
                          <div className="mt-2 flex flex-col items-center gap-2">
                            {uploadedFileUrl.toLowerCase().endsWith('.pdf') || uploadedFileUrl.includes('.pdf') || uploadedFileUrl.startsWith('data:application/pdf') ? (
                              <div className="text-xs text-[#D4A04D] bg-[#1A1A1C] border border-[#2A2A2D] rounded-lg px-3 py-2 flex items-center gap-1.5">
                                <span>📄</span> PDF Document Selected
                              </div>
                            ) : (
                              <div className="relative group w-24 h-24 rounded-lg overflow-hidden border border-[#2A2A2D]">
                                <img src={uploadedFileUrl} alt="Prescription Preview" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        )}
                        
                        {user && uploadedFileUrl && (
                          <div className="text-left mt-4 pt-4 border-t border-[#2A2A2D]/55 space-y-2">
                            <label className="text-[#A7A7A7] text-[10px] font-extrabold uppercase tracking-wide block">
                              Save this Prescription as (Optional)
                            </label>
                            <input 
                              type="text" 
                              placeholder="e.g. Eye Clinic Report, Dad's Prescription" 
                              value={prescriptionName}
                              onChange={e => setPrescriptionName(e.target.value)}
                              className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4A04D]"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

            {/* Sticky Navigation Footer */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl bg-[#131314]/80 border border-[#2A2A2D]/85 p-3.5 z-40 backdrop-blur-xl rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_30px_rgba(212,160,77,0.03)] transition-all duration-300">
              <div className="flex items-center justify-between gap-4">
                {/* Selection Summary (Desktop only) */}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">Step 3 of 3</span>
                  <span className="text-white text-xs font-extrabold truncate max-w-[200px]">
                    {(powerMode as any) === 'zero' ? 'Zero Power (Plano)' : (powerMode === 'enter' ? 'Manual Power' : 'Prescription Upload')}
                  </span>
                </div>
                
                {/* Navigation Buttons */}
                <div className="flex items-center gap-3 w-full sm:w-auto sm:min-w-[320px]">
                  <button
                    onClick={handleBack}
                    className="flex-1 bg-[#1A1A1C] border border-[#2A2A2D] hover:border-gray-500 text-white font-extrabold uppercase py-3.5 px-5 rounded-xl text-xs tracking-wider transition-all duration-300 cursor-pointer text-center select-none"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmAndAdd}
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-[#E5B869] to-[#C8923E] hover:from-[#F0C980] hover:to-[#D4A04D] text-black font-black uppercase py-3.5 px-5 rounded-xl text-xs tracking-wider transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed select-none cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(212,160,77,0.2)]"
                  >
                    <span>{submitting ? 'PROCESSING...' : 'CONTINUE TO CART'}</span>
                    {!submitting && <span className="text-xs">→</span>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 1: SELECT LENS TYPE ================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-left">
              <h1 className="text-lg font-black text-white uppercase tracking-wider">Buy With Lens</h1>
              <p className="text-[#A7A7A7] text-[11px] font-medium mt-1">Select lens type that suits your lifestyle</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h2 className="text-[#D4A04D] font-extrabold text-xs uppercase tracking-wider mb-1">Choose Lens Type</h2>
                <p className="text-gray-500 text-[10px]">All lenses come with 100% UV Protection</p>
              </div>

              {filteredLensTypes.map((typeOption) => {
                const isSelected = selectedType?._id === typeOption._id;
                
                return (
                  <div
                    key={typeOption._id}
                    onClick={() => {
                      setSelectedType(typeOption);
                      if (typeOption.type === 'zero_power') {
                        setPowerMode('zero');
                      } else {
                        setPowerMode('enter');
                      }
                    }}
                    className={`relative bg-[#131314]/90 border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-[#D4A04D]/45 flex flex-col sm:flex-row sm:items-center justify-between ${
                      isSelected ? 'border-[#D4A04D] bg-[#161618] shadow-[0_4px_20px_rgba(212,160,77,0.06)]' : 'border-[#2A2A2D]'
                    }`}
                  >
                    {/* Lifestyle Image: Top on mobile, Right on desktop */}
                    <div className="w-full sm:w-24 md:w-32 h-28 sm:h-20 md:h-24 overflow-hidden relative order-first sm:order-last border-b sm:border-b-0 sm:border-l border-[#2A2A2D]/60 flex-shrink-0">
                      <img 
                        src={getLifestyleImage(typeOption.type)} 
                        alt={typeOption.displayName} 
                        className="w-full h-full object-cover"
                      />
                      {/* Semi-transparent overlay on mobile for sleek look */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#131314] via-transparent to-transparent sm:hidden opacity-80" />
                    </div>

                    {/* Content: Below image on mobile, Left/Center on desktop */}
                    <div className="flex items-center gap-4 flex-1 p-4 md:p-5">
                      <div className="flex-shrink-0 bg-[#1A1A1C] border border-[#2A2A2D] rounded-xl p-2 flex items-center justify-center">
                        {renderLensDiagram(typeOption.type || '', false)}
                      </div>
                      <div className="flex flex-col flex-1 text-left min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-white font-bold text-sm leading-tight truncate">{typeOption.displayName}</h3>
                          {typeOption.isBestseller && (
                            <span className="bg-[#D4A04D]/15 text-[#D4A04D] border border-[#D4A04D]/25 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase leading-none">
                              Bestseller
                            </span>
                          )}
                        </div>
                        <p className="text-[#A7A7A7] text-[10px] font-medium leading-normal mt-1.5 max-w-sm">
                          {typeOption.description}
                        </p>
                        <span className="text-[#D4A04D] text-[10px] font-extrabold uppercase mt-2.5">
                          Starts from ₹{typeOption.startingPrice || typeOption.price}
                        </span>
                      </div>
                    </div>

                    {/* Selection checkmark badge */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 z-10 w-5 h-5 rounded-full bg-[#D4A04D] flex items-center justify-center shadow-lg border border-[#0E0E0F]">
                        <span className="text-black text-[10px] font-extrabold">✓</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sticky Continue Footer */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl bg-[#131314]/80 border border-[#2A2A2D]/85 p-3.5 z-40 backdrop-blur-xl rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_30px_rgba(212,160,77,0.03)] transition-all duration-300">
              <div className="flex items-center justify-between gap-4">
                {/* Left side: Selection summary */}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Step 1 of 3</span>
                  <span className="text-white text-xs font-extrabold truncate max-w-[200px]">
                    {selectedType ? selectedType.displayName : 'None'}
                  </span>
                </div>
                
                {/* Right side: Button */}
                <div className="w-full sm:w-auto sm:min-w-[240px]">
                  <button
                    onClick={handleNext}
                    disabled={!selectedType}
                    className="w-full bg-gradient-to-r from-[#E5B869] to-[#C8923E] hover:from-[#F0C980] hover:to-[#D4A04D] text-black font-black uppercase py-3.5 px-6 rounded-xl text-xs tracking-wider transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed select-none cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(212,160,77,0.2)] hover:shadow-[0_6px_20px_rgba(212,160,77,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_10px_rgba(212,160,77,0.2)]"
                  >
                    <span>CONTINUE TO QUALITY</span>
                    <span className="text-xs">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: SELECT LENS QUALITY ================= */}
        {currentStep === 2 && selectedType && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-left">
              <h1 className="text-lg font-black text-white uppercase tracking-wider">Select Lens Quality</h1>
              <p className="text-[#A7A7A7] text-[11px] font-medium mt-1">Choose the quality and features for your lenses</p>
            </div>

            {customLenses.length > 0 ? (
              <div className="space-y-4.5">
                {(() => {
                  const activeLenses = customLenses.filter((lens: any) => {
                    const typeId = typeof lens.lensType === 'object' 
                      ? (lens.lensType?._id?.toString() || '') 
                      : (lens.lensType?.toString() || '');
                    const selectedTypeId = selectedType?._id?.toString() || '';
                    return typeId === selectedTypeId;
                  });

                  if (activeLenses.length === 0) {
                    return (
                      <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-6 text-center text-gray-500 text-xs">
                        No lenses configured under this lens type yet. Please go to Lens Management to add them.
                      </div>
                    );
                  }

                  return activeLenses.map((lens) => {
                    const isSelected = selectedQuality?._id === lens._id;
                    
                    // Map description and features dynamically
                    let desc = 'Premium quality lens with multi-coat protection.';
                    let features = ['UV Protection', 'Scratch Resistant'];
                    const lowerLensName = lens.name.toLowerCase();
                    
                    if (lowerLensName.includes('blu') || lowerLensName.includes('blue cut')) {
                      desc = 'Blocks harmful blue light from screens. Great for computer use.';
                      features = ['Blue Light Protection', 'Anti Reflective', 'Scratch Resistant', 'UV Protection'];
                    } else if (lowerLensName.includes('anti-glare') || lowerLensName.includes('anti reflective')) {
                      desc = 'Reduces glare and reflections. Clear vision in all lighting.';
                      features = ['Anti Reflective', 'Scratch Resistant', 'UV Protection', 'Water Repellent'];
                    } else if (lowerLensName.includes('computer')) {
                      desc = 'Specifically designed for digital screen usage to reduce eye strain.';
                      features = ['Blue Light Protection', 'Anti Reflective', 'Scratch Resistant'];
                    } else if (lowerLensName.includes('essential')) {
                      desc = 'Essential clear lens offering reliable daily protection.';
                      features = ['Scratch Resistant', 'UV Protection'];
                    } else if (lowerLensName.includes('zero power')) {
                      desc = 'Standard cosmetic clear lens for daily wear.';
                      features = ['Scratch Resistant', 'UV Protection'];
                    }

                    return (
                      <div
                        key={lens._id}
                        onClick={() => setSelectedQuality({
                          _id: lens._id,
                          kind: 'quality',
                          name: lens.name,
                          displayName: lens.name,
                          price: getCurrentLensPrice(lens),
                          features: features,
                          powerPricing: lens.powerPricing,
                          minSph: lens.minSph,
                          maxSph: lens.maxSph,
                          minCyl: lens.minCyl,
                          maxCyl: lens.maxCyl
                        } as any)}
                        className={`relative bg-[#131314] border rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:border-[#D4A04D]/45 flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                          isSelected ? 'border-[#D4A04D] bg-[#161618] shadow-[0_4px_20px_rgba(212,160,77,0.06)]' : 'border-[#2A2A2D]'
                        }`}
                      >
                        <div className="flex-1 space-y-2 text-left">
                          <h3 className="text-white font-bold text-sm leading-tight">{lens.name}</h3>
                          <p className="text-[#A7A7A7] text-[10px] leading-relaxed max-w-md">{desc}</p>
                          
                          {/* Feature icons with names */}
                          <div className="flex flex-wrap gap-x-4 gap-y-2.5 pt-2">
                            {features.map((feat, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-gray-500 text-[9px] font-bold uppercase tracking-wider bg-[#1A1A1C] border border-[#2A2A2D]/40 rounded-lg px-2 py-1">
                                {renderQualityFeatureIcon(feat)}
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>
 
                        {/* Divider line for mobile */}
                        <div className="w-full border-t border-[#2A2A2D]/50 sm:hidden my-1" />
 
                        {/* Price and select circle */}
                        <div className="flex items-center sm:flex-col sm:items-end sm:justify-start justify-between shrink-0 gap-3">
                          <div className="flex flex-col sm:items-end text-left sm:text-right">
                            <span className="text-white font-black text-sm">₹{getCurrentLensPrice(lens)}</span>
                            <span className="text-gray-500 text-[9px] font-bold uppercase tracking-wider">/ pair</span>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected ? 'border-[#D4A04D] bg-[#D4A04D] shadow-[0_0_10px_rgba(212,160,77,0.3)]' : 'border-[#2D2D30]'
                          }`}>
                            {isSelected && <span className="text-black text-[10px] font-black">✓</span>}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : selectedType.type === 'progressive' ? (
              <div className="space-y-4 pt-1">
                <h2 className="text-white font-extrabold text-xs uppercase tracking-wider">Choose Your Progressive Lens</h2>
                <div className="space-y-3.5">
                  {currentSubTypes.map((subOption) => {
                    const isSubSelected = selectedSubType?._id === subOption._id;
                    return (
                      <div
                        key={subOption._id}
                        onClick={() => setSelectedSubType(subOption)}
                        className={`relative bg-[#131314] border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 cursor-pointer transition-all duration-300 hover:border-[#D4A04D]/45 ${
                          isSubSelected ? 'border-[#D4A04D] bg-[#161618] shadow-[0_4px_20px_rgba(212,160,77,0.06)]' : 'border-[#2A2A2D]'
                        }`}
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex-shrink-0 bg-[#1A1A1C] border border-[#2A2A2D] rounded-xl p-2 flex items-center justify-center">
                            {renderLensDiagram(selectedType.type || '', false)}
                          </div>
                          <div className="flex-1 space-y-2 text-left">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h3 className="text-white font-bold text-sm leading-tight">{subOption.displayName}</h3>
                              {subOption.isBestseller && (
                                <span className="bg-[#D4A04D]/15 text-[#D4A04D] border border-[#D4A04D]/25 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase leading-none">
                                  Bestseller
                                </span>
                              )}
                            </div>
                            <p className="text-[#A7A7A7] text-[10px] leading-relaxed max-w-md font-medium">
                              {subOption.description}
                            </p>
                          </div>
                        </div>

                        {/* Divider line for mobile */}
                        <div className="w-full border-t border-[#2A2A2D]/50 sm:hidden my-1" />

                        <div className="flex items-center sm:flex-col sm:items-end sm:justify-start justify-between shrink-0 gap-3">
                          <div className="flex flex-col sm:items-end text-left sm:text-right">
                            <span className="text-white font-black text-sm">₹{subOption.price}</span>
                            <span className="text-gray-500 text-[9px] font-bold uppercase tracking-wider">/ pair</span>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSubSelected ? 'border-[#D4A04D] bg-[#D4A04D] shadow-[0_0_10px_rgba(212,160,77,0.3)]' : 'border-[#2D2D30]'
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
                      className={`relative bg-[#131314] border rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:border-[#D4A04D]/45 flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                        isSelected ? 'border-[#D4A04D] bg-[#161618] shadow-[0_4px_20px_rgba(212,160,77,0.06)]' : 'border-[#2A2A2D]'
                      }`}
                    >
                      {/* Recommended badge */}
                      {quality.isRecommended && (
                        <div className="absolute -top-2.5 left-4">
                          <span className="bg-[#D4A04D] text-black text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                            Recommended
                          </span>
                        </div>
                      )}

                      <div className="flex-1 space-y-2 text-left">
                        <h3 className="text-white font-bold text-sm leading-tight">{quality.displayName}</h3>
                        <p className="text-[#A7A7A7] text-[10px] leading-relaxed max-w-md">{quality.description}</p>
                        
                        {/* Feature icons with names */}
                        <div className="flex flex-wrap gap-x-4 gap-y-2.5 pt-2">
                          {quality.features?.map((feat, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-gray-500 text-[9px] font-bold uppercase tracking-wider bg-[#1A1A1C] border border-[#2A2A2D]/40 rounded-lg px-2 py-1">
                              {renderQualityFeatureIcon(feat)}
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Divider line for mobile */}
                      <div className="w-full border-t border-[#2A2A2D]/50 sm:hidden my-1" />

                      {/* Price and select circle */}
                      <div className="flex items-center sm:flex-col sm:items-end sm:justify-start justify-between shrink-0 gap-3">
                        <div className="flex flex-col sm:items-end text-left sm:text-right">
                          <span className="text-white font-black text-sm">₹{quality.price}</span>
                          <span className="text-gray-500 text-[9px] font-bold uppercase tracking-wider">/ pair</span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected ? 'border-[#D4A04D] bg-[#D4A04D] shadow-[0_0_10px_rgba(212,160,77,0.3)]' : 'border-[#2D2D30]'
                        }`}>
                          {isSelected && <span className="text-black text-[10px] font-black">✓</span>}
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
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl bg-[#131314]/80 border border-[#2A2A2D]/85 p-3.5 z-40 backdrop-blur-xl rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_30px_rgba(212,160,77,0.03)] transition-all duration-300">
              <div className="flex items-center justify-between gap-4">
                {/* Selection Summary (Desktop only) */}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">Step 2 of 3</span>
                  <span className="text-white text-xs font-extrabold truncate max-w-[200px]">
                    {selectedQuality ? selectedQuality.displayName : (selectedSubType ? selectedSubType.displayName : 'Quality Selection')}
                  </span>
                </div>
                
                {/* Navigation Buttons */}
                <div className="flex items-center gap-3 w-full sm:w-auto sm:min-w-[320px]">
                  <button
                    onClick={handleBack}
                    className="flex-1 bg-[#1A1A1C] border border-[#2A2A2D] hover:border-gray-500 text-white font-extrabold uppercase py-3.5 px-5 rounded-xl text-xs tracking-wider transition-all duration-300 cursor-pointer text-center select-none"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={
                      customLenses.length > 0 
                        ? !selectedQuality 
                        : (selectedType?.type === 'progressive' ? !selectedSubType : !selectedQuality)
                    }
                    className="flex-1 bg-gradient-to-r from-[#E5B869] to-[#C8923E] hover:from-[#F0C980] hover:to-[#D4A04D] text-black font-black uppercase py-3.5 px-5 rounded-xl text-xs tracking-wider transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed select-none cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(212,160,77,0.2)]"
                  >
                    <span>CONTINUE TO POWER</span>
                    <span className="text-xs">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* CUSTOM PRESCRIPTION RANGE VALIDATION OVERLAY MODAL */}
      {validationModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-zoom-in text-left">
            
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[#2A2A2D]/80 pb-4">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-white font-black text-base uppercase tracking-wider">Prescription Out of Range</h3>
                <p className="text-red-400/90 text-xs font-bold mt-0.5">Selected Lens: {validationModal.selectedLensName}</p>
              </div>
            </div>

            {/* Error Body Details */}
            <div className="space-y-4 text-xs">
              <p className="text-[#A7A7A7] leading-relaxed">
                The prescription values you entered are not supported by the selected lens. Below are the range limits of this lens:
              </p>

              {/* Comparison Grid */}
              <div className="grid grid-cols-2 gap-4 bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl p-4">
                <div className="space-y-1">
                  <span className="text-gray-500 font-extrabold uppercase text-[9px] tracking-wider block">Allowed SPH Limit</span>
                  <span className="text-white font-bold text-sm">{validationModal.allowedSphRange}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-500 font-extrabold uppercase text-[9px] tracking-wider block">Your Entered SPH</span>
                  <span className="text-red-400 font-extrabold text-sm">{validationModal.currentSph}</span>
                </div>
                <div className="w-full col-span-2 border-t border-[#2A2A2D]/40 my-1" />
                <div className="space-y-1">
                  <span className="text-gray-500 font-extrabold uppercase text-[9px] tracking-wider block">Allowed CYL Limit</span>
                  <span className="text-white font-bold text-sm">{validationModal.allowedCylRange}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-500 font-extrabold uppercase text-[9px] tracking-wider block">Your Entered CYL</span>
                  <span className="text-red-400 font-extrabold text-sm">{validationModal.currentCyl}</span>
                </div>
              </div>
            </div>

            {/* Suggestions Block */}
            <div className="space-y-3.5 pt-2">
              <h4 className="text-[#D4A04D] font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>💡</span> Compatible Lenses Found ({validationModal.suggestions.length})
              </h4>
              
              {validationModal.suggestions.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {validationModal.suggestions.map((sug: any) => {
                    const dynamicPrice = getLensPairPrice(
                      sug,
                      powerMode,
                      parseSafeFloat(reSph),
                      parseSafeFloat(reCyl),
                      parseSafeFloat(leSph),
                      parseSafeFloat(leCyl)
                    );
                    return (
                      <div 
                        key={sug._id} 
                        className="bg-[#1A1A1C] border border-[#2A2A2D] rounded-xl p-3 flex items-center justify-between gap-4 hover:border-[#D4A04D]/40 transition-colors"
                      >
                        <div className="text-left space-y-1 flex-1">
                          <div className="text-white text-xs font-bold">{sug.name}</div>
                          <div className="text-gray-500 text-[10px]">
                            Range: SPH [{sug.minSph} to {sug.maxSph}], CYL [{sug.minCyl} to {sug.maxCyl}]
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-white font-black text-xs">₹{dynamicPrice}</span>
                          <button
                            onClick={() => handleSelectSuggestedLens(sug)}
                            className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-[10px] uppercase px-3 py-1.5 rounded-lg border-none cursor-pointer tracking-wider transition-colors shadow-[0_2px_8px_rgba(212,160,77,0.15)] animate-none"
                          >
                            Select & Cart
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-xs italic bg-[#1A1A1C] border border-[#2A2A2D] rounded-xl p-4 text-center">
                  Unfortunately, no other lenses support your entered power. Please edit your power values or contact support.
                </p>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center gap-3 pt-4 border-t border-[#2A2A2D]/80">
              <button
                onClick={() => setValidationModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 bg-[#1A1A1C] hover:bg-[#252528] border border-[#2A2A2D] text-white font-extrabold uppercase py-3 px-4 rounded-xl text-xs tracking-wider transition-colors cursor-pointer text-center"
              >
                Close & Edit Power
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
