import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import StarRating from '../components/ui/StarRating';
import AddToCartButton from '../components/AddToCartButton';
import ProductCard from '../components/ui/ProductCard';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

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
  rating: number;
  reviewCount: number;
  isBestseller: boolean;
  images: string[];
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
  compatible: { prescription?: boolean; bluecut?: boolean; zeropower?: boolean; progressive?: boolean };
  categories: string[];
  category?: string;
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

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, wishlist, toggleWishlist } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);
  const [reviews, setReviews] = useState<ReviewType[]>([]);

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
          if (prod.colors && prod.colors.length > 0) {
            setSelectedColor(prod.colors[0]);
          }

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
          if (prod.colors && prod.colors.length > 0) {
            setSelectedColor(prod.colors[0]);
          }
          setReviews(getMockReviews(prod.name));
        }
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  if (loading || !product) {
    return <div className="text-center py-24 text-[#A7A7A7]">Loading...</div>;
  }

  const discount = Math.round(((product.price.original - product.price.selling) / product.price.original) * 100);

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
      ];

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % productImages.length);
  };
  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-0">
      <div className="grid md:grid-cols-2 gap-10">
        
        {/* Image Gallery */}
        <div>
          {/* Main Image Container */}
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl aspect-square flex items-center justify-center mb-4 relative overflow-hidden group">
            <img src={productImages[activeImageIndex]} alt={product.name} className="w-full h-full object-cover rounded-xl" />
            
            {product.isBestseller && (
              <span className="absolute top-3 left-3 bg-[#D4A04D] text-black text-[10px] font-extrabold px-2.5 py-1 rounded-md tracking-wider uppercase z-20 shadow-md">
                BESTSELLER
              </span>
            )}
            
            {/* 360° overlay */}
            <div className="absolute top-3 right-3 bg-black/75 border border-[#2A2A2D] text-white text-[10px] font-bold py-1 px-2.5 rounded-full flex items-center gap-1.5 z-20 shadow-md">
              <span>360°</span>
              <svg className="w-3.5 h-3.5 text-[#D4A04D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
              </svg>
            </div>

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
                  className={`bg-[#131314] border rounded-lg w-14 h-14 flex-shrink-0 flex items-center justify-center cursor-pointer hover:border-[#D4A04D] transition-colors overflow-hidden ${
                    isSelected ? 'border-[#D4A04D]' : 'border-[#2A2A2D]'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
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
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide uppercase">{product.sku} | {product.name}</h1>
              
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
          </div>

          {/* Pricing Card */}
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Frame Starting</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">₹{product.price.selling}</span>
                <span className="text-gray-600 text-sm line-through">₹{product.price.original}</span>
                <span className="bg-[#D4A04D]/25 border border-[#D4A04D]/40 text-[#D4A04D] text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ml-1">
                  {discount}% OFF
                </span>
              </div>
            </div>

            <div className="w-[1px] h-10 bg-[#2A2A2D]" />

            <div className="flex items-center gap-3 text-left">
              <div className="text-[#D4A04D] bg-[#1e1a14] border border-[#D4A04D]/20 p-1.5 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 011-1v-4a1 1 0 011-1h2l4 4v3.5a1.5 1.5 0 01-1.5 1.5h-1m-6 0a2 2 0 004 0h5M3 17h2m4 0h6m4 0h2" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-white text-[10px] font-bold">Fast Delivery</span>
                <span className="text-gray-500 text-[9px] font-semibold uppercase tracking-wider">2-4 Days | Just ₹99 Delivery</span>
              </div>
            </div>
          </div>

          {/* Color Selector */}
          {product.colors?.length > 0 && (
            <div>
              <div className="text-white text-sm font-semibold mb-2">
                Select Color: <span className="text-[#D4A04D]">{selectedColor?.name || product.colors[0].name}</span>
              </div>
              <div className="flex gap-3">
                {product.colors.map((c, i) => {
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
                        <span className="absolute -bottom-1 -right-1 bg-[#D4A04D] text-black w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md">
                          ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Frame Dimensions Strip */}
          {product.frame && (
            <div>
              <div className="text-white text-xs font-bold uppercase tracking-wider mb-2.5">Frame Dimensions</div>
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
                  <span className="text-white text-xs font-bold mt-0.5">{product.frame.width} mm</span>
                </div>
                
                {/* 2. Lens Width */}
                <div className="flex flex-col items-center justify-center px-1">
                  <span className="text-[#D4A04D] text-xs mb-1.5">
                    <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </span>
                  <span className="text-gray-500 text-[8px] uppercase font-bold tracking-wider">Lens Width</span>
                  <span className="text-white text-xs font-bold mt-0.5">{product.frame.lensWidth} mm</span>
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
                  <span className="text-white text-xs font-bold mt-0.5">{product.frame.bridgeWidth} mm</span>
                </div>

                {/* 4. Temple Length */}
                <div className="flex flex-col items-center justify-center px-1">
                  <span className="text-[#D4A04D] text-xs mb-1.5">
                    <svg className="w-5.5 h-3.5 mx-auto" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M10,15 L70,15 C75,15 85,25 90,25" fill="none" />
                    </svg>
                  </span>
                  <span className="text-gray-500 text-[8px] uppercase font-bold tracking-wider">Temple</span>
                  <span className="text-white text-xs font-bold mt-0.5">{product.frame.templeLength} mm</span>
                </div>
              </div>
            </div>
          )}

          {/* Frame Details Box */}
          {product.frame && (
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-4 flex flex-col gap-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 flex flex-col gap-2.5">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-[9px] font-bold uppercase tracking-wider mb-1">Frame Details</span>
                    <div className="flex gap-4 text-xs font-medium">
                      <div><span className="text-gray-500">Frame Type:</span> <strong className="text-white font-bold">{product.frame.type}</strong></div>
                      <div><span className="text-gray-500">Material:</span> <strong className="text-white font-bold">{product.frame.material}</strong></div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {product.frame.featureTags?.map(tag => (
                      <span key={tag} className="flex items-center gap-1 bg-[#1A1A1C] border border-[#2A2A2D] text-gray-300 text-[9px] font-bold px-2.5 py-1 rounded-md">
                        <span className="text-[#D4A04D] text-[9px]">✔</span> {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={() => alert('Detailed specifications: Handcrafted frames, double-reinforced hinges, organic coatings.')}
                  className="border border-[#D4A04D] text-[#D4A04D] hover:bg-[#D4A04D] hover:text-black transition-colors font-extrabold text-[9px] uppercase py-2 px-3.5 rounded-lg tracking-wider shrink-0 cursor-pointer bg-transparent"
                >
                  VIEW DETAILS
                </button>
              </div>

              <div className="border-t border-[#2A2A2D]/40 pt-3 flex items-center gap-1.5 text-[#A7A7A7] text-[10px] font-medium leading-none">
                <span className="text-green-500 font-extrabold text-xs">✓</span>
                <span>Compatible with:</span>
                <span className="text-white font-bold">
                  {[
                    product.compatible?.prescription && 'Prescription Lenses',
                    product.compatible?.bluecut && 'Blue Cut',
                    product.compatible?.zeropower && 'Zero Power',
                    product.compatible?.progressive && 'Progressive',
                  ].filter(Boolean).join(' • ')}
                </span>
              </div>
            </div>
          )}

          {/* Desktop Call to Actions (visible on medium screens and up) */}
          <div className="hidden md:flex items-center gap-3 pt-6 border-t border-[#2A2A2D] mt-6">
            <AddToCartButton productId={product._id} color={selectedColor?.name} />
            <Link
              to={`/lens?product=${product._id}&color=${selectedColor?.name || ''}`}
              className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold uppercase py-3.5 px-6 rounded-xl text-xs tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-md select-none text-center"
            >
              <svg className="w-5 h-4" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="27" cy="15" r="10" />
                <circle cx="73" cy="15" r="10" />
                <path d="M37,15 L63,15" />
              </svg>
              <span>BUY WITH LENS</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Similar Products Section */}
      <div className="mt-12 border-t border-[#2A2A2D] pt-10">
        <h2 className="text-xl font-bold text-white mb-1">Similar Products</h2>
        <p className="text-[#A7A7A7] text-xs font-medium uppercase tracking-wider mb-6">You might also like these matching frames</p>
        
        {similarProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similarProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-[#A7A7A7] text-sm italic py-4">No similar products found.</div>
        )}
      </div>

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
          <div className="flex-1 max-w-[140px]">
            <AddToCartButton productId={product._id} color={selectedColor?.name} />
          </div>

          {/* Right: BUY WITH LENS */}
          <Link
            to={`/lens?product=${product._id}&color=${selectedColor?.name || ''}`}
            className="flex-1 max-w-[150px] bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold uppercase py-3 rounded-lg text-[9px] tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md select-none text-center"
          >
            <svg className="w-4 h-3.5" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="27" cy="15" r="10" />
              <circle cx="73" cy="15" r="10" />
              <path d="M37,15 L63,15" />
            </svg>
            <span>BUY WITH LENS</span>
          </Link>
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

      {/* Padding for sticky bar */}
      <div className="h-32 md:hidden" />
    </div>
  );
}
