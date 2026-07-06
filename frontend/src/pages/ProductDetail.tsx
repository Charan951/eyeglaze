import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import StarRating from '../components/ui/StarRating';
import AddToCartButton from '../components/AddToCartButton';
import ProductCard from '../components/ui/ProductCard';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

interface ColorOption {
  name: string;
  hex: string;
  stock: number;
  images?: string[];
}

interface Product {
  _id: string;
  sku: string;
  name: string;
  price: { original: number; selling: number };
  memberPrice?: number;
  nonMemberPrice?: number;
  rating: number;
  reviewCount: number;
  isBestseller: boolean;
  images: string[];
  productVideo?: string;
  image360?: string;
  colors: ColorOption[];
  frame: {
    type: string;
    material: string;
    width: number;
    lensWidth: number;
    bridgeWidth: number;
    templeLength: number;
    featureTags: string[];
  };
  warranty?: string;
  returnPolicy?: string;
  deliveryInfo?: string;
  compatible: { prescription?: boolean; bluecut?: boolean; zeropower?: boolean; progressive?: boolean };
  categories: string[];
  category?: string;
  availableSizes?: Array<'Small' | 'Medium' | 'Large'>;
  sizeMeasurements?: Array<{
    size: 'Small' | 'Medium' | 'Large';
    lensWidth?: number;
    bridgeWidth?: number;
    templeLength?: number;
    frameWidth?: number;
    frameHeight?: number;
  }>;
  offerBadges?: Array<string>;
  isPremium?: boolean;
  buy1Get1?: boolean;
  oneRupeeFrameOffer?: boolean;
  readingPowers?: string[];
  contactPowers?: Array<{ power: string; price: number }>;
  contactDisposableType?: string;
  subCategory?: string;
  sellAsFrame?: boolean;
  sellWithLens?: boolean;
  shortDescription?: string;
  longDescription?: string;
  description?: string;
  primaryColor?: string;
  secondaryColor?: string;
  frameWeight?: string;
  countryOfOrigin?: string;
  manufacturer?: string;
  frameType?: string;
  frameShape?: string;
  material?: string;
  shape?: string | string[];
  gender?: string | string[];
}

interface ReviewType {
  _id: string;
  user: { name: string };
  rating: number;
  title?: string;
  comment?: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

const getMockReviews = (productName: string): ReviewType[] => [
  {
    _id: 'rev-1',
    user: { name: 'Rahul Sharma' },
    rating: 5,
    title: 'Superb quality and fit!',
    comment: `The ${productName} fits perfectly. It is extremely lightweight, feels very durable, and the style is very modern. Absolutely love it!`,
    isVerifiedPurchase: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'rev-2',
    user: { name: 'Priya Patel' },
    rating: 4,
    title: 'Very comfortable for daily use',
    comment: 'Nice product. The frames are very comfortable to wear for long working hours in front of screens. Recommended!',
    isVerifiedPurchase: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'rev-3',
    user: { name: 'Amit Kumar' },
    rating: 5,
    title: 'Value for Money',
    comment: 'Excellent eyeglasses, premium packaging, and fast delivery. Exceptional quality for the price.',
    isVerifiedPurchase: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

function mockProduct(id: string): Product {
  return {
    _id: id,
    sku: 'EG-2021',
    name: 'Matte Square Frame',
    price: { original: 999, selling: 1 },
    rating: 4.7,
    reviewCount: 198,
    isBestseller: true,
    images: [],
    colors: [
      { name: 'Matte Black', hex: '#131314', stock: 50 },
      { name: 'Black Gold', hex: '#D4A04D', stock: 30 },
      { name: 'Dark Brown', hex: '#5C3D2E', stock: 20 },
    ],
    frame: {
      type: 'Square',
      material: 'TR90 Premium',
      width: 140,
      lensWidth: 54,
      bridgeWidth: 18,
      templeLength: 145,
      featureTags: ['Lightweight', 'Flexible', 'Skin Friendly', 'Durable'],
    },
    compatible: { prescription: true, bluecut: true, zeropower: true, progressive: true },
    categories: ['Prescription Glasses'],
  };
}

const colorMap: Record<string, string> = {
  'black': '#000000',
  'matte black': '#1A1A1A',
  'gold': '#D4A04D',
  'silver': '#C0C0C0',
  'grey': '#808080',
  'gray': '#808080',
  'brown': '#8B4513',
  'blue': '#0000FF',
  'red': '#FF0000',
  'green': '#008000',
  'pink': '#FFC0CB',
  'white': '#FFFFFF',
  'yellow': '#FFFF00',
  'transparent': 'rgba(255,255,255,0.1)'
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, wishlist, toggleWishlist, fetchCartCount } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [quantity, setQuantity] = useState(1);

  // Size Selector, Guide, and Tech Details State
  const [selectedSize, setSelectedSize] = useState('Medium');
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Reels states & refs
  const [reels, setReels] = useState<any[]>([]);
  const [selectedReel, setSelectedReel] = useState<any | null>(null);
  const [isReelModalOpen, setIsReelModalOpen] = useState(false);
  const [playingReelId, setPlayingReelId] = useState<string | null>(null);
  const [clickedReelId, setClickedReelId] = useState<string | null>(null);
  const reelsCarouselRefReal = useRef<HTMLDivElement>(null);

  const scrollReelsLeft = () => {
    if (reelsCarouselRefReal.current) {
      reelsCarouselRefReal.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const scrollReelsRight = () => {
    if (reelsCarouselRefReal.current) {
      reelsCarouselRefReal.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    const vimeoMatch = url.match(/(?:vimeo\.com\/)(?:video\/)?([0-9]+)/i);
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

  useEffect(() => {
    api.get('/reels')
      .then(res => {
        if (Array.isArray(res.data)) {
          setReels(res.data);
        } else if (res.data?.reels) {
          setReels(res.data.reels);
        }
      })
      .catch(err => console.error('Error fetching reels:', err));
  }, []);

  // Custom Power & Pricing states
  const [selectedReadingPower, setSelectedReadingPower] = useState<string>('');
  const [selectedContactPower, setSelectedContactPower] = useState<string>('');
  const [customPriceOverride, setCustomPriceOverride] = useState<number | null>(null);
  const [buyingNow, setBuyingNow] = useState(false);
  const [buyingFrameOnly, setBuyingFrameOnly] = useState(false);

  const getActiveDimensions = () => {
    if (product?.sizeMeasurements && Array.isArray(product.sizeMeasurements)) {
      const match = product.sizeMeasurements.find((item: any) => item.size === selectedSize);
      if (match) {
        return {
          frameWidth: match.frameWidth ?? product.frame?.width,
          lensWidth: match.lensWidth ?? product.frame?.lensWidth,
          bridgeWidth: match.bridgeWidth ?? product.frame?.bridgeWidth,
          templeLength: match.templeLength ?? product.frame?.templeLength,
          frameHeight: match.frameHeight ?? 40,
        };
      }
    }
    return {
      frameWidth: product?.frame?.width,
      lensWidth: product?.frame?.lensWidth,
      bridgeWidth: product?.frame?.bridgeWidth,
      templeLength: product?.frame?.templeLength,
      frameHeight: 40,
    };
  };

  const activeDimensions = getActiveDimensions();

  const getRecommendedSize = (widthVal?: number) => {
    const width = widthVal ?? product?.frame?.width;
    if (!width) return 'Medium';
    if (width <= 135) return 'Small';
    if (width >= 143) return 'Large';
    return 'Medium';
  };
  const recommendedSize = product ? getRecommendedSize() : 'Medium';

  const isInWishlist = product ? wishlist.includes(product._id) : false;

  const handleWishlistToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!product) return;
    await toggleWishlist(product._id);
  };

  // Reset active image index when selected color changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedColor]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!product) return;
    let active = true;
    const cat = product.category || (product.categories && product.categories[0]) || '';
    
    api.get('/products', { params: { category: cat, limit: 10 } })
      .then(res => {
        if (!active) return;
        const fetched = res.data.products || res.data || [];
        // Filter out the current product and slice to 4 items
        const filtered = fetched.filter((p: any) => p._id !== product._id).slice(0, 4);
        setSimilarProducts(filtered);
      })
      .catch(() => {
        if (!active) return;
        // Fallback: load all products and filter
        api.get('/products')
          .then(res => {
            if (!active) return;
            const fetched = res.data.products || res.data || [];
            const filtered = fetched.filter((p: any) => p._id !== product._id).slice(0, 4);
            setSimilarProducts(filtered);
          })
          .catch(() => {
            if (!active) return;
            // Fallback to mock products if everything fails
            const mockList = [
              { ...mockProduct('EG-1067'), sku: 'EG-1067', name: 'Premium Clubmaster' },
              { ...mockProduct('EG-3012'), sku: 'EG-3012', name: 'Classic Aviator' },
              { ...mockProduct('EG-4001'), sku: 'EG-4001', name: 'Kids Round' },
              { ...mockProduct('EG-5010'), sku: 'EG-5010', name: 'Blue Light Blocker' }
            ];
            const filtered = mockList.filter(p => p._id !== product._id).slice(0, 4);
            setSimilarProducts(filtered);
          });
      });
    return () => { active = false; };
  }, [product]);

  // review form states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // AI Chat States
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hello! Welcome to EyeGlaze. I am your AI assistant. How can I help you choose the perfect frames today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: msg }]);
    setChatInput('');
    setIsAiTyping(true);
    setTimeout(() => {
      setIsAiTyping(false);
      let response = `This frame (${product?.sku || 'frame'}) is highly compatible with prescription, blue cut, and progressive lenses. We offer single-vision, bifocal, and progressive options starting from ₹699.`;
      const val = msg.toLowerCase();
      if (val.includes('price') || val.includes('cost') || val.includes('rate')) {
        response = `The frame starts at ₹${product?.price.selling}. With prescription lenses, packages start from ₹699.`;
      } else if (val.includes('size') || val.includes('fit') || val.includes('measure')) {
        response = `This frame has a total width of ${product?.frame.width}mm, lens width of ${product?.frame.lensWidth}mm, bridge width of ${product?.frame.bridgeWidth}mm, and temple length of ${product?.frame.templeLength}mm. It fits most faces comfortably!`;
      } else if (val.includes('delivery') || val.includes('ship')) {
        response = `We offer Fast Delivery in 2-4 days. Shipping is ₹99.`;
      }
      setChatMessages(prev => [...prev, { sender: 'bot', text: response }]);
    }, 1000);
  };

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    api.get(`/products/${id}`)
      .then(res => {
        if (active) {
          const prod = res.data.product || res.data;
          setProduct(prod);
          if (prod.images && prod.images.length > 0) {
            setActiveImageIndex(0);
          }
          const colorsToSelect = (prod.colors && prod.colors.length > 0)
            ? prod.colors
            : (prod.primaryColor
                ? prod.primaryColor.split(',').map((c: string) => {
                    const name = c.trim();
                    const lower = name.toLowerCase();
                    const hex = colorMap[lower] || lower;
                    return { name, hex, stock: 10, images: [] };
                  }).filter((item: any) => item.name)
                : []
              );
          if (colorsToSelect.length > 0) {
            setSelectedColor(colorsToSelect[0]);
          }
          const available = prod.availableSizes && prod.availableSizes.length > 0
            ? prod.availableSizes
            : ['Small', 'Medium', 'Large'];
          let initialSize = 'Medium';
          if (prod.frame?.width) {
            const w = prod.frame.width;
            if (w <= 135) initialSize = 'Small';
            else if (w >= 143) initialSize = 'Large';
            else initialSize = 'Medium';
          }
          if (!available.includes(initialSize as any)) {
            initialSize = available[0];
          }
          setSelectedSize(initialSize);

          const backendReviews = res.data.reviews || [];
          if (backendReviews.length > 0) {
            setReviews(backendReviews);
          } else {
            setReviews(getMockReviews(prod.name || 'Frame'));
          }
        }
      })
      .catch(() => {
        if (active) {
          const prod = mockProduct(id);
          setProduct(prod);
          if (prod.images && prod.images.length > 0) {
            setActiveImageIndex(0);
          }
          const colorsToSelect = (prod.colors && prod.colors.length > 0)
            ? prod.colors
            : (prod.primaryColor
                ? prod.primaryColor.split(',').map((c: string) => {
                    const name = c.trim();
                    const lower = name.toLowerCase();
                    const hex = colorMap[lower] || lower;
                    return { name, hex, stock: 10, images: [] };
                  }).filter((item: any) => item.name)
                : []
              );
          if (colorsToSelect.length > 0) {
            setSelectedColor(colorsToSelect[0]);
          }
          const available = prod.availableSizes && prod.availableSizes.length > 0
            ? prod.availableSizes
            : ['Small', 'Medium', 'Large'];
          let initialSize = 'Medium';
          if (prod.frame?.width) {
            const w = prod.frame.width;
            if (w <= 135) initialSize = 'Small';
            else if (w >= 143) initialSize = 'Large';
            else initialSize = 'Medium';
          }
          if (!available.includes(initialSize as any)) {
            initialSize = available[0];
          }
          setSelectedSize(initialSize);
          setReviews(getMockReviews(prod.name));
        }
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (product) {
      if (product.category === 'power-sunglasses' && product.subCategory === 'reading') {
        if (product.readingPowers && product.readingPowers.length > 0) {
          setSelectedReadingPower(product.readingPowers[0]);
        }
      } else if (product.category === 'contact-lenses') {
        if (product.contactPowers && product.contactPowers.length > 0) {
          setSelectedContactPower(product.contactPowers[0].power);
          setCustomPriceOverride(product.contactPowers[0].price);
        } else {
          setCustomPriceOverride(product.price.selling);
        }
      } else {
        setCustomPriceOverride(null);
      }
    }
  }, [product]);

  if (loading || !product) {
    return <div className="text-center py-24 text-[#A7A7A7]">Loading...</div>;
  }

  const discount = Math.round(((product.price.original - product.price.selling) / product.price.original) * 100);

  const colorsToRender = (product.colors && product.colors.length > 0)
    ? product.colors
    : (product.primaryColor
        ? product.primaryColor.split(',').map((c: string) => {
            const name = c.trim();
            const lower = name.toLowerCase();
            const hex = colorMap[lower] || lower;
            return { name, hex, stock: 10, images: [] };
          }).filter((item: any) => item.name)
        : []
      );

  const displaySpecs = {
    frameType: product.frameType || product.frame?.type,
    frameShape: product.frameShape || (Array.isArray(product.shape) ? product.shape[0] : product.shape),
    material: product.material || product.frame?.material,
    primaryColor: product.primaryColor,
    secondaryColor: product.secondaryColor,
    frameWeight: product.frameWeight,
    countryOfOrigin: product.countryOfOrigin,
    manufacturer: product.manufacturer,
    warranty: product.warranty
  };

  const hasAnySpecs = Object.values(displaySpecs).some(Boolean);
  const hasDimensions = !!(activeDimensions.frameWidth || activeDimensions.lensWidth || activeDimensions.bridgeWidth || activeDimensions.templeLength);

  const sellingPrice = customPriceOverride !== null ? customPriceOverride : product.price.selling;

  const getLensPayload = () => {
    if (!product) return undefined;
    if (product.category === 'contact-lenses') {
      const subCatName = product.subCategory === 'clear-contacts' 
        ? 'Clear Contacts' 
        : product.subCategory === 'color-contacts' 
          ? 'Color Contacts' 
          : 'Contacts';
      return {
        lensType: subCatName,
        lensPrice: customPriceOverride || product.price.selling,
        framePrice: 0,
        fittingCharge: 0,
        power: {
          RE: { sph: parseFloat(selectedContactPower || '0') },
          LE: { sph: parseFloat(selectedContactPower || '0') }
        }
      };
    }
    if (product.category === 'power-sunglasses' && product.subCategory === 'reading') {
      return {
        lensType: 'Reading',
        lensPrice: 0,
        fittingCharge: 0,
        power: {
          RE: { sph: parseFloat(selectedReadingPower || '0') },
          LE: { sph: parseFloat(selectedReadingPower || '0') }
        }
      };
    }
    return undefined;
  };

  const handleBuyNow = async () => {
    if (!product) return;
    setBuyingNow(true);
    try {
      const lensPayload = getLensPayload();

      if (!user) {
        // Guest user buy now flow
        const guestCartStr = localStorage.getItem('guest_cart');
        const cart = guestCartStr ? JSON.parse(guestCartStr) : [];
        
        const existingIdx = cart.findIndex(
          (item: any) =>
            item.productId === product._id &&
            item.color === selectedColor?.name &&
            item.lensType === (lensPayload?.lensType || undefined)
        );

        if (existingIdx >= 0) {
          cart[existingIdx].qty += quantity;
        } else {
          const newItem = {
            id: `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            productId: product._id,
            qty: quantity,
            color: selectedColor?.name || 'Matte Black',
            name: product.name,
            sku: product.sku,
            framePrice: product.price?.selling ?? 1,
            lensPrice: lensPayload?.lensPrice || 0,
            fittingCharge: lensPayload ? 99 : 0,
            image: product.images?.[0] || '',
            lens: lensPayload 
              ? `${lensPayload.lensType || 'Lens'}${lensPayload.power?.RE?.sph ? ` (${lensPayload.power.RE.sph > 0 ? '+' : ''}${lensPayload.power.RE.sph})` : ''}` 
              : '',
            lensType: lensPayload?.lensType || undefined,
            power: lensPayload?.power || undefined,
            lensPayload,
          };
          cart.push(newItem);
        }
        localStorage.setItem('guest_cart', JSON.stringify(cart));
      } else {
        await api.post('/cart', {
          productId: product._id,
          qty: quantity,
          color: selectedColor?.name,
          lens: lensPayload
        });
      }
      await fetchCartCount();
      navigate('/cart');
    } catch (err) {
      console.error('Failed to buy now:', err);
    } finally {
      setBuyingNow(false);
    }
  };

  const handleBuyFrameOnly = async () => {
    if (!product) return;
    setBuyingFrameOnly(true);
    try {
      if (!user) {
        // Guest user buy now flow
        const guestCartStr = localStorage.getItem('guest_cart');
        const cart = guestCartStr ? JSON.parse(guestCartStr) : [];
        
        const existingIdx = cart.findIndex(
          (item: any) =>
            item.productId === product._id &&
            item.color === selectedColor?.name &&
            !item.lensType
        );

        if (existingIdx >= 0) {
          cart[existingIdx].qty += quantity;
        } else {
          const newItem = {
            id: `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            productId: product._id,
            qty: quantity,
            color: selectedColor?.name || 'Matte Black',
            frameSize: selectedSize || 'Medium',
            name: product.name,
            sku: product.sku,
            framePrice: product.price?.selling ?? 1,
            lensPrice: 0,
            fittingCharge: 0,
            image: product.images?.[0] || '',
            lens: '',
            lensType: undefined,
            power: undefined,
            lensPayload: undefined,
          };
          cart.push(newItem);
        }
        localStorage.setItem('guest_cart', JSON.stringify(cart));
      } else {
        await api.post('/cart', {
          productId: product._id,
          qty: quantity,
          color: selectedColor?.name,
          frameSize: selectedSize,
          lens: undefined
        });
      }
      await fetchCartCount();
      navigate('/cart');
    } catch (err) {
      console.error('Failed to buy frame only:', err);
    } finally {
      setBuyingFrameOnly(false);
    }
  };

  const handleReviewSubmit = () => {
    if (!reviewName || !reviewTitle || !reviewComment) {
      return;
    }

    const newReview: ReviewType = {
      _id: `local-rev-${Date.now()}`,
      user: { name: reviewName },
      rating: reviewRating,
      title: reviewTitle,
      comment: reviewComment,
      isVerifiedPurchase: true,
      createdAt: new Date().toISOString(),
    };

    setReviews(prev => [newReview, ...prev]);

    // update product review count and average rating locally
    const newCount = (product.reviewCount || 0) + 1;
    const newRating =
      ((product.rating || 0) * (product.reviewCount || 0) + reviewRating) / newCount;
    
    setProduct(prev => prev ? {
      ...prev,
      reviewCount: newCount,
      rating: Number(newRating.toFixed(1)),
    } : null);

    setReviewSuccess(true);
    // Reset form fields
    setReviewName('');
    setReviewTitle('');
    setReviewComment('');
    setReviewRating(5);

    setTimeout(() => {
      setShowReviewForm(false);
      setReviewSuccess(false);
    }, 2000);
  };

  const productImages = (selectedColor && selectedColor.images && selectedColor.images.length > 0)
    ? selectedColor.images
    : [
        product.images?.[0] || '/images/cat_prescription.png',
        product.images?.[1] || '/images/cat_sunglasses.png',
        product.images?.[2] || '/images/cat_blue_light.png',
        product.images?.[3] || '/images/cat_contacts.png',
        '/images/hero_model.png' // 5th image: model photo
      ];  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % productImages.length);
  };
  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  const productSchema = product ? {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": productImages[0] ? (productImages[0].startsWith('http') ? productImages[0] : `${window.location.origin}${productImages[0]}`) : '',
    "description": `Premium ${product.name} (${product.sku}) designer eyeglasses by EyeGlaze. Frame material: ${product.frame?.material || 'TR90 Premium'}. Frame shape: ${product.frame?.type || 'Square'}.`,
    "sku": product.sku,
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "INR",
      "price": product.price.selling,
      "availability": "https://schema.org/InStock",
      "priceValidUntil": "2027-12-31"
    },
    ...(product.reviewCount > 0 ? {
      "aggregateRating": {
         "@type": "AggregateRating",
         "ratingValue": product.rating,
         "reviewCount": product.reviewCount
      }
    } : {})
  } : undefined;

  const renderSizeCard = (sizeName: 'Small' | 'Medium' | 'Large', range: string, desc: string) => {
    const isSelected = selectedSize === sizeName;
    const isRecommended = recommendedSize === sizeName;

    const isKidsProduct = product?.gender
      ? (Array.isArray(product.gender)
          ? product.gender.some((g: string) => g.toLowerCase() === 'kids')
          : product.gender.toLowerCase() === 'kids'
        )
      : false;

    let sizeTitle = sizeName as string;
    let sizeRange = range;
    let sizeDesc = desc;

    if (isKidsProduct) {
      if (sizeName === 'Small') {
        sizeTitle = 'Juniors';
        sizeRange = '5 – 8 years';
        sizeDesc = 'Frame: Small';
      } else if (sizeName === 'Medium') {
        sizeTitle = 'Tweens';
        sizeRange = '8 – 12 years';
        sizeDesc = 'Frame: Medium';
      } else if (sizeName === 'Large') {
        sizeTitle = 'Teens';
        sizeRange = '12 – 17 years';
        sizeDesc = 'Frame: Large';
      }
    }

    return (
      <button
        type="button"
        onClick={() => setSelectedSize(sizeName)}
        className={`flex-grow-0 flex-shrink-0 w-[30%] bg-[#131314] border-2 rounded-xl p-3 text-center relative flex flex-col items-center justify-between transition-all select-none cursor-pointer ${
          isSelected ? 'border-[#D4A04D] scale-[1.02]' : 'border-[#2A2A2D] hover:border-[#D4A04D]/60'
        }`}
      >
        {isRecommended && (
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#D4A04D] text-black text-[7px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-md whitespace-nowrap">
            Recommended
          </span>
        )}
        {isSelected && (
          <span className="absolute top-2 right-2 bg-[#D4A04D] text-black w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold shadow-md">
            ✓
          </span>
        )}
        <div className="text-white text-xs font-extrabold mt-1">{sizeTitle}</div>
        
        {/* SVG Glasses Drawing */}
        <svg className={`w-14 h-8 my-2.5 transition-colors duration-300 ${isSelected ? 'text-[#D4A04D]' : 'text-gray-500'}`} viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="28" cy="20" r="14" />
          <circle cx="72" cy="20" r="14" />
          <path d="M42 20 C 48 12, 52 12, 58 20" />
          <path d="M14 20 C 8 20, 2 14, 2 10" />
          <path d="M86 20 C 92 20, 98 14, 98 10" />
        </svg>

        <div className="text-[#A7A7A7] text-[10px] font-bold">{sizeRange}</div>
        <div className="text-[#727275] text-[8px] font-extrabold uppercase tracking-wide mt-0.5">{sizeDesc}</div>
      </button>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <SEO 
        title={`${product.name} (${product.sku})`}
        description={`Buy the premium ${product.name} (${product.sku}) online at EyeGlaze. Made with high-quality ${product.frame?.material || 'TR90'}. Compatible with prescription, progressive, and blue-cut lenses.`}
        keywords={`eyeglaze, ${product.name}, ${product.sku}, ${product.frame?.type || ''} eyeglasses, prescription glasses, premium frames`}
        image={productImages[0]}
        schema={productSchema}
      />
      <div className="grid md:grid-cols-2 gap-10">
        
        {/* Image Gallery */}
        <div>
          {/* Main Image Container */}
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-none aspect-square flex items-center justify-center mb-4 relative overflow-hidden group">
            <img src={productImages[activeImageIndex]} alt={product.name} className="w-full h-full object-contain rounded-none p-4" />
            
            <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
              {product.isBestseller && (
                <span className="bg-[#D4A04D] text-black text-[10px] font-extrabold px-2.5 py-1 rounded-md tracking-wider uppercase shadow-md">
                  BESTSELLER
                </span>
              )}
              {product.isPremium && (
                <span className="bg-black/75 border border-[#D4A04D] text-[#D4A04D] text-[10px] font-extrabold px-2.5 py-1 rounded-md tracking-wider uppercase shadow-md">
                  PREMIUM
                </span>
              )}
              {product.buy1Get1 && (
                <span className="bg-pink-600/80 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md tracking-wider uppercase shadow-md">
                  BUY 1 GET 1
                </span>
              )}
              {product.oneRupeeFrameOffer && (
                <span className="bg-green-600/80 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md tracking-wider uppercase shadow-md">
                  ₹1 FRAME OFFER
                </span>
              )}
              {product.offerBadges?.map((badge, idx) => (
                <span key={idx} className="bg-purple-600/80 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md tracking-wider uppercase shadow-md">
                  {badge}
                </span>
              ))}
            </div>
            
            {/* 360° overlay */}
            {product.image360 && (
              <div className="absolute top-3 right-3 bg-black/75 border border-[#2A2A2D] text-white text-[10px] font-bold py-1 px-2.5 rounded-full flex items-center gap-1.5 z-20 shadow-md">
                <span>360°</span>
                <svg className="w-3.5 h-3.5 text-[#D4A04D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                </svg>
              </div>
            )}
            {/* Product Video overlay */}
            {product.productVideo && (
              <div className="absolute bottom-3 right-3 bg-black/75 border border-[#2A2A2D] text-white text-[10px] font-bold py-1 px-2.5 rounded-full flex items-center gap-1.5 z-20 shadow-md">
                <span>VIDEO</span>
                <svg className="w-3.5 h-3.5 text-[#D4A04D]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}

            {/* Left/Right Overlaid navigation buttons */}
            <button 
              onClick={prevImage} 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 border border-[#2A2A2D] text-white flex items-center justify-center hover:bg-black transition-colors z-20 cursor-pointer"
              aria-label="Previous image"
            >
              &lt;
            </button>
            <button 
              onClick={nextImage} 
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 border border-[#2A2A2D] text-white flex items-center justify-center hover:bg-black transition-colors z-20 cursor-pointer"
              aria-label="Next image"
            >
              &gt;
            </button>

            {/* Carousel dots overlay */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {productImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeImageIndex === idx ? 'bg-[#D4A04D] w-4' : 'bg-gray-600'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {productImages.map((img, i) => {
              const isSelected = activeImageIndex === i;
              return (
                <div
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={`bg-[#131314] border rounded-none w-14 h-14 flex-shrink-0 flex items-center justify-center cursor-pointer hover:border-[#D4A04D] transition-colors overflow-hidden ${
                    isSelected ? 'border-[#D4A04D]' : 'border-[#2A2A2D]'
                  }`}
                >
                  <img src={img} alt={`${product.name} angle view ${i + 1}`} className="w-full h-full object-contain rounded-none p-1" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-5">
          {/* Name & Rating Block */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide uppercase">{product.name}</h1>
              
              {/* Share & Wishlist */}
              <div className="flex items-center gap-4 text-xs font-bold text-gray-400 shrink-0">
                <button 
                  onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Product link copied to clipboard!'); }} 
                  className="flex items-center gap-1.5 hover:text-[#D4A04D] transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l4.028-2.014m0 0a3 3 0 10-2.243-4.077L7.545 6.586m0 0a3 3 0 100 5.828l5.029 2.514m0 0a3 3 0 102.243-4.077L9.268 9.546" />
                  </svg>
                  <span>Share</span>
                </button>
                <span className="text-gray-700">|</span>
                <button 
                  onClick={handleWishlistToggle} 
                  className={`flex items-center gap-1.5 transition-colors cursor-pointer ${isInWishlist ? 'text-[#D4A04D]' : 'hover:text-[#D4A04D] text-gray-400'}`}
                >
                  <svg 
                    className="w-4 h-4" 
                    fill={isInWishlist ? 'currentColor' : 'none'} 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth="2.2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{isInWishlist ? 'Wishlisted' : 'Wishlist'}</span>
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-xs font-medium text-gray-400">
              <div className="flex items-center gap-1">
                <span className="text-yellow-500 text-sm">★</span>
                <span className="text-white font-bold">{product.rating}</span>
                <span>({product.reviewCount} reviews)</span>
              </div>
              <span className="text-gray-700">|</span>
              <span className="text-[#D4A04D] font-bold">500+ bought this week</span>
            </div>
            {product.shortDescription && (
              <p className="text-[#A7A7A7] text-xs font-semibold leading-relaxed mt-2">
                {product.shortDescription}
              </p>
            )}
          </div>

           {/* Pricing Card */}
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                  {product.category === 'contact-lenses' ? 'Contact Lens Price' : 'Frame Starting'}
                </span>
                <div className="flex items-baseline gap-2 flex-wrap">
                  {/* Mobile responsive / Single Price: Show custom selling price */}
                  <span className="text-3xl font-black text-white md:hidden">
                    ₹{sellingPrice}
                  </span>

                  {/* Desktop view: Show member/non-member prices if available (Only for non-contact lenses) */}
                  {product.category !== 'contact-lenses' && product.memberPrice && (
                    <span className="hidden md:inline text-3xl font-black text-[#D4A04D]">
                      ₹{product.memberPrice} <span className="text-gray-500 text-sm font-bold">(Member)</span>
                    </span>
                  )}
                  {product.category !== 'contact-lenses' && product.nonMemberPrice && (
                    <span className="hidden md:inline text-2xl font-black text-white">
                      ₹{product.nonMemberPrice} <span className="text-gray-500 text-sm font-bold">(Non-Member)</span>
                    </span>
                  )}
                  
                  {/* Fallback/Main price for contact lenses or when member prices are not available */}
                  {(product.category === 'contact-lenses' || !product.memberPrice || !product.nonMemberPrice) && (
                    <span className="hidden md:inline text-3xl font-black text-white">
                      ₹{sellingPrice}
                    </span>
                  )}
                  <span className="hidden md:inline text-gray-600 text-sm line-through">₹{product.price.original}</span>
                  <span className="hidden md:inline bg-[#D4A04D]/25 border border-[#D4A04D]/40 text-[#D4A04D] text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                    {discount}% OFF
                  </span>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between pt-0 md:pt-3 border-none md:border-t md:border-[#2A2A2D]">
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Quantity</span>
              <div className="flex items-center gap-2 bg-[#0E0E0E] border border-[#2A2A2D] rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center text-white hover:text-[#D4A04D] cursor-pointer"
                >
                  -
                </button>
                <span className="text-white font-bold text-sm w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-white hover:text-[#D4A04D] cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>




          {/* Color Selector */}
          {product.category !== 'contact-lenses' && colorsToRender.length > 0 && (
            <div>
              <div className="text-white text-xs font-bold uppercase tracking-wider mb-2.5 select-none">
                SELECT COLOR: <span className="text-[#D4A04D]">{selectedColor?.name || colorsToRender[0].name}</span>
              </div>
              <div className="flex gap-3">
                {colorsToRender.map((c, i) => {
                  const isSelected = selectedColor ? selectedColor.name === c.name : i === 0;
                  return (
                    <div key={c.name} className="relative select-none">
                      <button
                        title={c.name}
                        onClick={() => setSelectedColor(c)}
                        className={`w-9 h-9 rounded-full border-2 transition-all cursor-pointer ${isSelected ? 'border-[#D4A04D] scale-110' : 'border-[#2A2A2D] hover:border-[#D4A04D]'}`}
                        style={{ backgroundColor: c.hex }}
                      />
                      {isSelected && (
                        <span className="absolute -bottom-1 -right-1 bg-[#D4A04D] text-black w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md">
                          ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Choose Size Selector */}
          {product.category !== 'contact-lenses' && (
            <div>
              <div className="flex justify-between items-center mb-2.5 select-none">
                <span className="text-white text-xs font-bold uppercase tracking-wider">CHOOSE SIZE</span>
                {product.category !== 'sunglasses' && product.category !== 'power-sunglasses' && (
                  <button
                    type="button"
                    onClick={() => setShowSizeGuide(true)}
                    className="text-[#D4A04D] text-xs font-extrabold uppercase tracking-wide underline cursor-pointer bg-transparent border-none hover:text-[#C8923E] transition-colors"
                  >
                    What's my size?
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                {(!product.availableSizes || product.availableSizes.length === 0 || product.availableSizes.includes('Small')) && renderSizeCard('Small', 'Up to 135 mm', 'Best for narrow face')}
                {(!product.availableSizes || product.availableSizes.length === 0 || product.availableSizes.includes('Medium')) && renderSizeCard('Medium', '136 – 142 mm', 'Best for standard face')}
                {(!product.availableSizes || product.availableSizes.length === 0 || product.availableSizes.includes('Large')) && renderSizeCard('Large', '143 – 150 mm', 'Best for wide face')}
              </div>
            </div>
          )}

          {/* Frame Dimensions Strip */}
          {product.category !== 'contact-lenses' && product.category !== 'sunglasses' && product.category !== 'power-sunglasses' && hasDimensions && (
            <div>
              <div className="flex justify-between items-center mb-2.5 select-none">
                <span className="text-white text-xs font-bold uppercase tracking-wider">FRAME DIMENSIONS (in mm)</span>
              </div>
              <div className="border border-[#2A2A2D] rounded-xl bg-[#0E0E0E] grid grid-cols-4 divide-x divide-[#2A2A2D] py-3 text-center">
                {/* 1. Frame Width */}
                <div className="flex flex-col items-center justify-center px-1">
                  <span className="text-[#D4A04D] text-xs mb-1.5">
                    <svg className="w-5.5 h-3.5 mx-auto" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="27" cy="15" r="10" />
                      <circle cx="73" cy="15" r="10" />
                      <path d="M37,15 L63,15 M17,15 L4,15 M83,15 L96,15" />
                    </svg>
                  </span>
                  <span className="text-gray-500 text-[8px] uppercase font-bold tracking-wider">Frame Width</span>
                  <span className="text-white text-xs font-bold mt-0.5">{activeDimensions.frameWidth} mm</span>
                </div>
                
                {/* 2. Lens Width */}
                <div className="flex flex-col items-center justify-center px-1">
                  <span className="text-[#D4A04D] text-xs mb-1.5">
                    <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </span>
                  <span className="text-gray-500 text-[8px] uppercase font-bold tracking-wider">Lens Width</span>
                  <span className="text-white text-xs font-bold mt-0.5">{activeDimensions.lensWidth} mm</span>
                </div>

                {/* 3. Bridge Width */}
                <div className="flex flex-col items-center justify-center px-1">
                  <span className="text-[#D4A04D] text-xs mb-1.5">
                    <svg className="w-5.5 h-3.5 mx-auto" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M30,15 C40,5 60,5 70,15" fill="none" />
                      <line x1="10" y1="15" x2="30" y2="15" />
                      <line x1="70" y1="15" x2="90" y2="15" />
                    </svg>
                  </span>
                  <span className="text-gray-500 text-[8px] uppercase font-bold tracking-wider">Bridge</span>
                  <span className="text-white text-xs font-bold mt-0.5">{activeDimensions.bridgeWidth} mm</span>
                </div>

                {/* 4. Temple Length */}
                <div className="flex flex-col items-center justify-center px-1">
                  <span className="text-[#D4A04D] text-xs mb-1.5">
                    <svg className="w-5.5 h-3.5 mx-auto" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M10,15 L70,15 C75,15 85,25 90,25" fill="none" />
                    </svg>
                  </span>
                  <span className="text-gray-500 text-[8px] uppercase font-bold tracking-wider">Temple</span>
                  <span className="text-white text-xs font-bold mt-0.5">{activeDimensions.templeLength} mm</span>
                </div>
              </div>
            </div>
          )}

          {/* Frame Details Box */}
          {product.category !== 'contact-lenses' && product.category !== 'sunglasses' && product.category !== 'power-sunglasses' && hasAnySpecs && (
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-4 flex flex-col gap-4">
              <span className="text-gray-500 text-[9px] font-bold uppercase tracking-wider">Frame Details & Specifications</span>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                {displaySpecs.frameType && (
                  <div className="flex justify-between border-b border-[#2A2A2D]/40 pb-1.5">
                    <span className="text-gray-500">Frame Type:</span>
                    <strong className="text-white font-bold">{displaySpecs.frameType}</strong>
                  </div>
                )}
                {displaySpecs.frameShape && (
                  <div className="flex justify-between border-b border-[#2A2A2D]/40 pb-1.5">
                    <span className="text-gray-500">Frame Shape:</span>
                    <strong className="text-white font-bold">{displaySpecs.frameShape}</strong>
                  </div>
                )}
                {displaySpecs.material && (
                  <div className="flex justify-between border-b border-[#2A2A2D]/40 pb-1.5">
                    <span className="text-gray-500">Material:</span>
                    <strong className="text-white font-bold">{displaySpecs.material}</strong>
                  </div>
                )}
                {displaySpecs.primaryColor && (
                  <div className="flex justify-between border-b border-[#2A2A2D]/40 pb-1.5">
                    <span className="text-gray-500">Frame Color:</span>
                    <strong className="text-white font-bold">{displaySpecs.primaryColor}</strong>
                  </div>
                )}
                {displaySpecs.secondaryColor && (
                  <div className="flex justify-between border-b border-[#2A2A2D]/40 pb-1.5">
                    <span className="text-gray-500">Secondary Color:</span>
                    <strong className="text-white font-bold">{displaySpecs.secondaryColor}</strong>
                  </div>
                )}
                {displaySpecs.frameWeight && (
                  <div className="flex justify-between border-b border-[#2A2A2D]/40 pb-1.5">
                    <span className="text-gray-500">Weight:</span>
                    <strong className="text-white font-bold">{displaySpecs.frameWeight}</strong>
                  </div>
                )}
                {displaySpecs.countryOfOrigin && (
                  <div className="flex justify-between border-b border-[#2A2A2D]/40 pb-1.5">
                    <span className="text-gray-500">Country of Origin:</span>
                    <strong className="text-white font-bold">{displaySpecs.countryOfOrigin}</strong>
                  </div>
                )}
                {displaySpecs.warranty && (
                  <div className="flex justify-between border-b border-[#2A2A2D]/40 pb-1.5">
                    <span className="text-gray-500">Warranty:</span>
                    <strong className="text-white font-bold">{displaySpecs.warranty}</strong>
                  </div>
                )}
              </div>
              
              {product.frame?.featureTags && product.frame.featureTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1 border-t border-[#2A2A2D]/40 pt-3">
                  {product.frame.featureTags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-[#1A1A1C] border border-[#2A2A2D] text-gray-300 text-[9px] font-bold px-2.5 py-1 rounded-md">
                      <span className="text-[#D4A04D] text-[9px]">✔</span> {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="border-t border-[#2A2A2D]/40 pt-3 flex items-center gap-1.5 text-[#A7A7A7] text-[10px] font-medium leading-none">
                <span className="text-green-500 font-extrabold text-xs">✓</span>
                <span>Compatible with:</span>
                <span className="text-white font-bold">
                  {[
                    product.compatible?.prescription && 'Prescription Lenses',
                    product.compatible?.bluecut && 'Blue Cut',
                    product.compatible?.zeropower && 'Zero Power',
                    product.compatible?.progressive && 'Progressive',
                  ].filter(Boolean).join(' • ') || 'Standard Lenses'}
                </span>
              </div>
            </div>
          )}

          {/* Reading Glasses Selector (Special Power -> Reading) */}
          {product.category === 'power-sunglasses' && product.subCategory === 'reading' && product.readingPowers && product.readingPowers.length > 0 && (
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-4.5 space-y-3">
              <div className="text-white text-xs font-bold uppercase tracking-wider">
                SELECT READING POWER (SPH)
              </div>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider leading-relaxed">
                Reading glasses come pre-fitted with identical powers in both lenses:
              </p>
              <div className="flex flex-wrap gap-2.5">
                {product.readingPowers.map((power) => {
                  const isSelected = selectedReadingPower === power;
                  return (
                    <button
                      type="button"
                      key={power}
                      onClick={() => setSelectedReadingPower(power)}
                      className={`px-4.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer select-none ${
                        isSelected
                          ? 'bg-[#D4A04D]/15 border-[#D4A04D] text-[#D4A04D]'
                          : 'bg-[#0E0E0E] border-zinc-800 text-gray-400 hover:text-white hover:border-[#D4A04D]/60'
                      }`}
                    >
                      {power}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contact Lenses Configuration */}
          {product.category === 'contact-lenses' && (
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-4.5 space-y-4">
              {product.contactDisposableType && (
                <div className="flex items-center justify-between border-b border-[#2A2A2D]/60 pb-3">
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Disposable Type</span>
                  <span className="text-white text-[10px] font-black bg-[#2A2A2D] px-3 py-1.5 rounded-md uppercase tracking-widest">
                    {product.contactDisposableType}
                  </span>
                </div>
              )}

              {product.contactPowers && product.contactPowers.length > 0 && (
                <div className="space-y-3.5">
                  <div className="text-white text-xs font-bold uppercase tracking-wider">
                    SELECT LENS POWER
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider leading-relaxed">
                    Choose power option (prices update automatically):
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {product.contactPowers.map((cp) => {
                      const isSelected = selectedContactPower === cp.power;
                      return (
                        <button
                          type="button"
                          key={cp.power}
                          onClick={() => {
                            setSelectedContactPower(cp.power);
                            setCustomPriceOverride(cp.price);
                          }}
                          className={`p-3 rounded-xl text-center transition-all border flex flex-col items-center justify-center gap-1 cursor-pointer select-none ${
                            isSelected
                              ? 'bg-[#D4A04D]/15 border-[#D4A04D] text-[#D4A04D]'
                              : 'bg-[#0E0E0E] border-zinc-800 text-gray-400 hover:text-white hover:border-[#D4A04D]/60'
                          }`}
                        >
                          <span className="text-xs font-black uppercase tracking-wider">{cp.power} SPH</span>
                          <span className={`text-[10px] font-extrabold ${isSelected ? 'text-[#D4A04D]' : 'text-gray-500'}`}>₹{cp.price}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trust & Delivery Info Strip */}
          <div className="grid grid-cols-3 gap-2 bg-[#131314] border border-[#2A2A2D] rounded-xl p-3.5 text-center mt-6 select-none">
            {/* 1. Warranty */}
            <div className="flex flex-col items-center justify-center p-1">
              <span className="text-lg mb-1">🛡️</span>
              <span className="text-white font-extrabold text-[10px] uppercase tracking-wider">
                {product.warranty || '1 Year Warranty'}
              </span>
              <span className="text-gray-500 text-[8px] mt-0.5 font-bold uppercase tracking-wider">Warranty Covered</span>
            </div>
            
            {/* 2. Returns */}
            <div className="flex flex-col items-center justify-center p-1 border-x border-[#2A2A2D]">
              <span className="text-lg mb-1">🔄</span>
              <span className="text-white font-extrabold text-[10px] uppercase tracking-wider">
                {product.returnPolicy || (product.category === 'contact_lenses' ? 'Non-Returnable' : '14-Day Returnable')}
              </span>
              <span className="text-gray-500 text-[8px] mt-0.5 font-bold uppercase tracking-wider">
                {(product.returnPolicy || '').toLowerCase().includes('non') ? 'Final Sale' : 'Easy Returns'}
              </span>
            </div>
            
            {/* 3. Delivery */}
            <div className="flex flex-col items-center justify-center p-1">
              <span className="text-lg mb-1">🚚</span>
              <span className="text-white font-extrabold text-[10px] uppercase tracking-wider">
                {product.deliveryInfo || '5-7 Days Delivery'}
              </span>
              <span className="text-gray-500 text-[8px] mt-0.5 font-bold uppercase tracking-wider">Fast Shipping</span>
            </div>
          </div>

          {/* Call to Actions */}
          {product.category === 'contact-lenses' || (product.category === 'power-sunglasses' && product.subCategory === 'reading') ? (
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-6 border-t border-[#2A2A2D] mt-6">
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={buyingNow}
                className="flex-1 w-full bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold uppercase py-3.5 px-6 rounded-xl text-xs tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md select-none text-center disabled:opacity-50"
              >
                {buyingNow ? 'Processing...' : 'BUY NOW'}
              </button>
              <div className="flex-1 w-full">
                <AddToCartButton
                  productId={product._id}
                  color={selectedColor?.name}
                  product={product}
                  lensPayload={getLensPayload()}
                  className="w-full bg-[#1C1C1E] border border-[#2A2A2D] hover:border-[#D4A04D] text-white font-extrabold uppercase py-3.5 px-6 rounded-xl text-xs tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer select-none text-center"
                />
              </div>
            </div>
          ) : (
            <>
              {(product.sellAsFrame !== false || product.sellWithLens !== false) && (
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-6 border-t border-[#2A2A2D] mt-6">
                  {product.sellAsFrame !== false && (
                    <button
                      type="button"
                      onClick={handleBuyFrameOnly}
                      disabled={buyingFrameOnly}
                      className="flex-1 w-full bg-[#1C1C1E] border border-[#2A2A2D] hover:border-[#D4A04D] text-white font-extrabold uppercase py-3.5 px-6 rounded-xl text-xs tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer select-none text-center disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{buyingFrameOnly ? 'Processing...' : 'BUY FRAME ONLY'}</span>
                    </button>
                  )}
                  {product.sellWithLens !== false && (
                    <Link
                      to={`/lens?product=${product._id}&color=${selectedColor?.name || ''}&size=${selectedSize}&qty=${quantity}`}
                      className="flex-1 w-full bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold uppercase py-3.5 px-6 rounded-xl text-xs tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md select-none text-center"
                    >
                      <svg className="w-5 h-4" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="27" cy="15" r="10" />
                        <circle cx="73" cy="15" r="10" />
                        <path d="M37,15 L63,15" />
                      </svg>
                      <span>BUY WITH LENS</span>
                    </Link>
                  )}
                </div>
              )}
              {product.sellAsFrame !== false && (
                <div className="pt-3">
                  <div className="w-full">
                    <AddToCartButton productId={product._id} color={selectedColor?.name} product={product} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Product Description & Details Section */}
      {(product.longDescription || product.description) && (
        <div className="mt-12 border-t border-[#2A2A2D] pt-10">
          <h2 className="text-xl font-bold text-white mb-3">Product Description</h2>
          <div className="text-gray-400 text-sm leading-relaxed max-w-4xl space-y-4">
            {(product.longDescription || product.description)?.split('\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>
      )}

      {/* Related Products Section */}
      <div className="mt-12 border-t border-[#2A2A2D] pt-10">
        <h2 className="text-xl font-bold text-white mb-1">Related Products</h2>
        <p className="text-[#A7A7A7] text-xs font-medium uppercase tracking-wider mb-6">You might also like these related frames</p>
        
        {similarProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-[#A7A7A7] text-sm italic py-4">No similar products found.</div>
        )}
      </div>

      {/* EyeGlaze Reels Section (Above Reviews) */}
      {reels && reels.length > 0 && (
        <div className="mt-12 border-t border-[#2A2A2D] pt-10">
          <div className="flex flex-col gap-1 mb-6">
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">EyeGlaze Reels</h2>
            <p className="text-[#A7A7A7] text-xs font-medium uppercase tracking-wider">Trending styles, lookbooks and details</p>
          </div>

          <div className="relative w-full group/reels-carousel">
            {/* Left navigation arrow */}
            <button 
              onClick={scrollReelsLeft}
              className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-[#121212]/90 border border-[#2A2A2D] text-white rounded-full flex items-center justify-center hover:border-[#D4A04D] hover:text-[#D4A04D] transition-all cursor-pointer shadow-lg opacity-0 group-hover/reels-carousel:opacity-100 hidden md:flex"
              aria-label="Previous Reel"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Right navigation arrow */}
            <button 
              onClick={scrollReelsRight}
              className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-[#121212]/90 border border-[#2A2A2D] text-white rounded-full flex items-center justify-center hover:border-[#D4A04D] hover:text-[#D4A04D] transition-all cursor-pointer shadow-lg opacity-0 group-hover/reels-carousel:opacity-100 hidden md:flex"
              aria-label="Next Reel"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Reels Carousel Container */}
            <div 
              ref={reelsCarouselRefReal}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-none w-full flex-nowrap scroll-smooth"
            >
              {reels.map((reel) => (
                <div 
                  key={reel._id || reel.id}
                  onClick={(e) => {
                    const isClicked = clickedReelId === reel._id;
                    const videoEl = e.currentTarget.querySelector('video');
                    
                    // Pause and mute all other videos
                    const allVideos = document.querySelectorAll('video');
                    allVideos.forEach(v => {
                      if (v !== videoEl) {
                        v.pause();
                        v.muted = true;
                      }
                    });

                    if (isClicked) {
                      setClickedReelId(null);
                      setPlayingReelId(null);
                      if (videoEl) {
                        videoEl.pause();
                        videoEl.muted = true;
                      }
                    } else {
                      setClickedReelId(reel._id);
                      setPlayingReelId(reel._id);
                      if (videoEl) {
                        videoEl.muted = false; // Unmute to allow audio!
                        videoEl.play().catch(() => {});
                      }
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (clickedReelId && clickedReelId !== reel._id) return;
                    setPlayingReelId(reel._id);
                    const videoEl = e.currentTarget.querySelector('video');
                    if (videoEl) {
                      videoEl.muted = clickedReelId === reel._id ? false : true;
                      videoEl.play().catch(() => {});
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (clickedReelId === reel._id) return; // Keep playing if clicked!
                    setPlayingReelId(null);
                    const videoEl = e.currentTarget.querySelector('video');
                    if (videoEl) {
                      videoEl.pause();
                      videoEl.muted = true;
                    }
                  }}
                  className="bg-[#121212] border border-[#2A2A2D] rounded-2xl overflow-hidden p-3 flex flex-col gap-3 shadow-xl hover:border-[#D4A04D]/35 transition-colors w-[160px] md:w-[220px] flex-shrink-0 cursor-pointer group relative"
                >
                  <div className="aspect-[9/16] w-full rounded-xl overflow-hidden bg-black border border-[#2A2A2D] relative">
                    {/* The Logo Cover Overlay */}
                    <div className={`absolute inset-0 bg-[#0c0c0e] flex flex-col items-center justify-center gap-3 transition-opacity duration-300 pointer-events-none z-10 ${playingReelId === reel._id ? 'opacity-0' : 'group-hover:opacity-0'}`}>
                      {/* Logo emblem */}
                      <div className="w-12 h-12 rounded-full border border-[#D4A04D]/30 flex items-center justify-center bg-black/60 shadow-lg shadow-[#D4A04D]/5">
                        <span className="text-[#D4A04D] text-sm font-bold tracking-widest font-serif">EG</span>
                      </div>
                      <span className="text-[#D4A04D] text-[10px] font-black uppercase tracking-[0.25em] font-serif">EYEGLAZE</span>
                    </div>

                    {isDirectVideo(reel.videoUrl) ? (
                      <video
                        src={reel.videoUrl}
                        className="w-full h-full object-cover"
                        loop
                        playsInline
                        autoPlay={playingReelId === reel._id}
                      />
                    ) : (
                      <iframe
                        title={reel.title}
                        className={`w-full h-full border-none ${playingReelId === reel._id ? '' : 'pointer-events-none'}`}
                        src={
                          playingReelId === reel._id
                            ? clickedReelId === reel._id
                              ? `${getEmbedUrl(reel.videoUrl)}?autoplay=1`
                              : `${getEmbedUrl(reel.videoUrl)}?autoplay=1&mute=1`
                            : getEmbedUrl(reel.videoUrl)
                        }
                        allow="autoplay; encrypted-media"
                      />
                    )}
                    {/* Dark gradient overlay at the bottom for title */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-85 group-hover:opacity-90 transition-opacity flex flex-col justify-end p-3 gap-1">
                      <span className="text-white text-[10px] md:text-xs font-bold uppercase tracking-wide truncate">{reel.title}</span>
                      {reel.description && (
                        <p className="text-gray-400 text-[8px] md:text-[9.5px] leading-relaxed line-clamp-2 font-medium">
                          {reel.description}
                        </p>
                      )}
                    </div>
                    {/* Play Badge Overlay */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity bg-black/25 ${playingReelId === reel._id ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white text-sm">
                        ▶
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="mt-12 border-t border-[#2A2A2D] pt-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Customer Reviews</h2>
            <p className="text-[#A7A7A7] text-sm mt-1">What our customers are saying about this frame</p>
          </div>
          <button
            onClick={() => {
              setShowReviewForm(!showReviewForm);
              setReviewSuccess(false);
            }}
            className="self-start sm:self-auto bg-transparent border border-[#D4A04D] text-[#D4A04D] font-bold py-2.5 px-5 rounded-xl text-sm hover:bg-[#D4A04D]/10 transition-all cursor-pointer"
          >
            {showReviewForm ? 'Cancel Review' : 'Write a Review'}
          </button>
        </div>

        {/* Write Review Form */}
        {showReviewForm && (
          <div className="mb-10 bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 max-w-xl transition-all">
            <h3 className="text-white font-bold text-lg mb-4">Share Your Feedback</h3>
            {reviewSuccess ? (
              <div className="text-green-400 bg-green-400/10 border border-green-500/30 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">✓</div>
                <div className="font-semibold">Thank you! Your review has been added successfully.</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[#A7A7A7] text-xs uppercase tracking-wide block mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={reviewName}
                    onChange={e => setReviewName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#A7A7A7] text-xs uppercase tracking-wide block mb-1">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`text-2xl cursor-pointer ${star <= reviewRating ? 'text-[#D4A04D]' : 'text-[#2D2D30]'} hover:scale-110 transition-transform`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[#A7A7A7] text-xs uppercase tracking-wide block mb-1">Review Title</label>
                  <input
                    type="text"
                    required
                    value={reviewTitle}
                    onChange={e => setReviewTitle(e.target.value)}
                    placeholder="Summarize your experience"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#A7A7A7] text-xs uppercase tracking-wide block mb-1">Comments</label>
                  <textarea
                    required
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="Tell us what you liked or disliked about this frame"
                    rows={4}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4A04D] focus:outline-none resize-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleReviewSubmit}
                  className="bg-[#D4A04D] text-black font-bold uppercase py-2.5 px-6 rounded-xl text-sm hover:opacity-90 transition-opacity cursor-pointer border-none"
                >
                  Submit Review
                </button>
              </div>
            )}
          </div>
        )}

        {/* Rating Summary Breakdown */}
        <div className="grid md:grid-cols-3 gap-8 mb-10 bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6">
          <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-[#2A2A2D] pb-6 md:pb-0">
            <div className="text-5xl font-black text-white">{product.rating.toFixed(1)}</div>
            <div className="mt-2">
              <StarRating rating={product.rating} size="md" />
            </div>
            <p className="text-[#A7A7A7] text-xs mt-2">{product.reviewCount} customer ratings</p>
          </div>

          <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
            {[
              { stars: 5, pct: 75, count: Math.round(product.reviewCount * 0.75) },
              { stars: 4, pct: 15, count: Math.round(product.reviewCount * 0.15) },
              { stars: 3, pct: 6, count: Math.round(product.reviewCount * 0.06) },
              { stars: 2, pct: 3, count: Math.round(product.reviewCount * 0.03) },
              { stars: 1, pct: 1, count: Math.round(product.reviewCount * 0.01) },
            ].map(row => (
              <div key={row.stars} className="flex items-center gap-3 text-sm">
                <span className="text-[#A7A7A7] w-3 text-right">{row.stars}</span>
                <span className="text-[#A7A7A7] text-xs">★</span>
                <div className="flex-1 h-2 bg-[#2D2D30] rounded-full overflow-hidden">
                  <div className="h-full bg-[#D4A04D] rounded-full" style={{ width: `${row.pct}%` }} />
                </div>
                <span className="text-[#A7A7A7] text-xs w-8 text-right">{row.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.map(rev => {
            const dateStr = new Date(rev.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const initials = rev.user?.name
              ? rev.user.name
                  .split(' ')
                  .filter(Boolean)
                  .map((n: string) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : 'U';

            return (
              <div key={rev._id} className="bg-[#131314]/60 border border-[#2A2A2D] rounded-xl p-5 hover:border-[#D4A04D]/30 transition-colors">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2A2A2D] text-[#D4A04D] font-bold text-sm flex items-center justify-center">
                      {initials}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm flex items-center gap-2">
                        {rev.user?.name || 'Anonymous'}
                        {rev.isVerifiedPurchase && (
                          <span className="bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/20">
                            Verified Buyer
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5">
                        <StarRating rating={rev.rating} />
                      </div>
                    </div>
                  </div>
                  <span className="text-[#A7A7A7] text-xs font-medium">{dateStr}</span>
                </div>
                {rev.title && <h4 className="text-white font-semibold text-sm mb-1">{rev.title}</h4>}
                {rev.comment && <p className="text-[#A7A7A7] text-sm leading-relaxed">{rev.comment}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Bar (visible only on mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/95 border-t border-[#2A2A2D] z-50 md:hidden backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          
          {/* Left Side: Pricing */}
          <div className="flex flex-col justify-center shrink-0 min-w-[70px]">
            <div className="flex items-baseline gap-1">
              <span className="text-white font-black text-lg leading-none">₹{product.price.selling}</span>
              <span className="text-gray-600 text-[10px] line-through leading-none">₹{product.price.original}</span>
            </div>
            <span className="text-[#D4A04D] text-[9px] font-extrabold uppercase mt-1 leading-none">{discount}% OFF</span>
          </div>

          {/* Middle: ADD TO CART */}
          {product.sellAsFrame !== false && (
            <div className="flex-1 max-w-[200px]">
              <AddToCartButton productId={product._id} color={selectedColor?.name} product={product} />
            </div>
          )}

          {/* Right: BUY WITH LENS */}
          {product.sellWithLens !== false && (
            <Link
              to={`/lens?product=${product._id}&color=${selectedColor?.name || ''}`}
              className="flex-1 max-w-[200px] bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold uppercase py-3 rounded-lg text-[9px] tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md select-none text-center"
            >
              <svg className="w-4 h-3.5" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="27" cy="15" r="10" />
                <circle cx="73" cy="15" r="10" />
                <path d="M37,15 L63,15" />
              </svg>
              <span>BUY WITH LENS</span>
            </Link>
          )}
        </div>
        
        {/* Bottom Trust Strip */}
        <div className="bg-[#131314] border-t border-[#2A2A2D]/50 py-2.5 px-3 md:hidden">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-1 text-[8px] font-bold text-gray-500 tracking-wider text-center uppercase">
            <div className="flex items-center gap-1">
              <span className="text-[#D4A04D] text-xs leading-none">✔</span>
              <span>100% Authentic</span>
            </div>
            <span className="text-gray-800">•</span>
            <div className="flex items-center gap-1">
              <span className="text-[#D4A04D] text-xs leading-none">✔</span>
              <span>Just ₹99 Delivery</span>
            </div>
            <span className="text-gray-800">•</span>
            <div className="flex items-center gap-1">
              <span className="text-[#D4A04D] text-xs leading-none">✔</span>
              <span>Fast Delivery</span>
            </div>
            <span className="text-gray-800">•</span>
            <div className="flex items-center gap-1">
              <span className="text-[#D4A04D] text-xs leading-none">✔</span>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Chat Drawer */}
      {isAiDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div onClick={() => setIsAiDrawerOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-[#0E0E0E] h-full shadow-2xl border-l border-[#2A2A2D] flex flex-col z-50 animate-slide-in">
            {/* Header */}
            <div className="p-4 border-b border-[#2A2A2D] flex items-center justify-between bg-[#151515]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#D4A04D] rounded-full flex items-center justify-center text-black font-bold">
                  🤖
                </div>
                <div>
                  <h4 className="text-white text-sm font-bold">EyeGlaze AI</h4>
                  <span className="text-[#D4A04D] text-[10px] font-semibold uppercase tracking-wider">Virtual Assistant</span>
                </div>
              </div>
              <button onClick={() => setIsAiDrawerOpen(false)} className="text-gray-400 hover:text-white p-2 cursor-pointer bg-transparent border-none">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l18 18" />
                </svg>
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 text-xs md:text-sm leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-[#D4A04D] text-black rounded-tr-none font-medium' 
                      : 'bg-[#1C1C1E] text-white border border-[#2A2A2D] rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#1C1C1E] border border-[#2A2A2D] rounded-2xl rounded-tl-none p-3 text-xs text-gray-400 flex items-center gap-1">
                    <span>AI is typing</span>
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce delay-100">.</span>
                    <span className="animate-bounce delay-200">.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-[#2A2A2D] bg-[#151515] flex gap-2 items-center">
              <input 
                type="text" 
                placeholder="Ask me about this frame..." 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                className="flex-1 bg-[#1E1E1E] border border-[#2A2A2D] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4A04D]"
              />
              <button 
                onClick={handleSendChat}
                className="bg-[#D4A04D] text-black hover:bg-[#C8923E] p-3 rounded-xl transition-colors flex items-center justify-center font-bold border-none cursor-pointer"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
            <h3 className="text-white font-extrabold text-lg mb-2 uppercase tracking-wide">Size Guide</h3>
            <p className="text-gray-400 text-xs mb-5">
              Measure your face width temple-to-temple to find your ideal fit.
            </p>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between border-b border-[#2A2A2D]/40 pb-2">
                <span className="text-white text-sm font-semibold">Small</span>
                <span className="text-[#D4A04D] text-sm font-bold">Up to 135 mm (Narrow face)</span>
              </div>
              <div className="flex justify-between border-b border-[#2A2A2D]/40 pb-2">
                <span className="text-white text-sm font-semibold">Medium</span>
                <span className="text-[#D4A04D] text-sm font-bold">136 mm to 142 mm (Standard face)</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-white text-sm font-semibold">Large</span>
                <span className="text-[#D4A04D] text-sm font-bold">143 mm to 150 mm (Wide face)</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSizeGuide(false)}
              className="w-full bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer border-none"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}



      {/* Reels Modal Player */}
      {isReelModalOpen && selectedReel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => {
              setIsReelModalOpen(false);
              setSelectedReel(null);
            }} 
            className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer" 
          />
          <div className="relative bg-[#0E0E0E] border border-[#2A2A2D] w-full max-w-sm aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl z-10 animate-scale-up flex flex-col justify-between">
            {/* Header overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center z-20">
              <h3 className="text-white text-xs font-bold uppercase tracking-wider truncate max-w-[80%]">
                {selectedReel.title}
              </h3>
              <button 
                onClick={() => {
                  setIsReelModalOpen(false);
                  setSelectedReel(null);
                }} 
                className="text-white hover:text-gray-300 p-1.5 rounded-full bg-black/40 hover:bg-black/60 transition-colors border-none cursor-pointer"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l18 18" />
                </svg>
              </button>
            </div>

            {/* Video content */}
            <div className="flex-1 w-full h-full bg-black relative">
              {isDirectVideo(selectedReel.videoUrl) ? (
                <video
                  src={selectedReel.videoUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  controls
                  loop
                  playsInline
                />
              ) : (
                <iframe
                  title={selectedReel.title}
                  className="w-full h-full border-none"
                  src={`${getEmbedUrl(selectedReel.videoUrl)}?autoplay=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>

            {/* Description overlay */}
            {selectedReel.description && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent z-20 flex flex-col gap-1">
                <p className="text-gray-200 text-[10px] md:text-xs leading-relaxed font-semibold">
                  {selectedReel.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Padding for sticky bar */}
      <div className="h-32 md:hidden" />
    </div>
  );
}
