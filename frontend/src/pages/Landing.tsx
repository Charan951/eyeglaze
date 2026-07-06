import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { socket } from '../lib/socket';
import SEO from '../components/SEO';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, wishlist, checkAuth } = useAuth();

  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const iconsCarouselRef = useRef<HTMLDivElement>(null);

  const showcaseCarouselRef = useRef<HTMLDivElement>(null);

  const scrollShowcaseLeft = () => {
    if (showcaseCarouselRef.current) {
      showcaseCarouselRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollShowcaseRight = () => {
    if (showcaseCarouselRef.current) {
      showcaseCarouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const scrollIconsLeft = () => {
    if (iconsCarouselRef.current) {
      iconsCarouselRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollIconsRight = () => {
    if (iconsCarouselRef.current) {
      iconsCarouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  // Carousel & Image state
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [
    {
      subtitle: 'SEE THE WORLD',
      title: 'CLEARER. SHARPER. YOU.',
      description: 'Premium Eyewear for Every Version of You.',
      buttonText: 'SHOP NOW',
      image: '/images/hero_model.png',
    },
    {
      subtitle: 'EXCLUSIVE DESIGNS',
      title: 'STYLE. COMFORT. LUXURY.',
      description: 'Uncompromising quality meets timeless luxury.',
      buttonText: 'EXPLORE ALL',
      image: '/images/promo_new_arrivals.png',
    }
  ];

  // Auto-slide carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('openGoldModal') === 'true') {
      setIsGoldModalOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Videos States
  const [videos, setVideos] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);

  // Fetch homepage videos on mount
  useEffect(() => {
    let active = true;
    api.get('/homepage-videos')
      .then((res) => {
        if (!active) return;
        setVideos(res.data);
      })
      .catch((err) => {
        console.error('Error fetching homepage videos:', err);
      });
    return () => {
      active = false;
    };
  }, []);

  // Fetch homepage reels on mount
  useEffect(() => {
    let active = true;
    api.get('/reels')
      .then((res) => {
        if (!active) return;
        setReels(res.data);
      })
      .catch((err) => {
        console.error('Error fetching reels:', err);
      });
    return () => {
      active = false;
    };
  }, []);

  // Categories States
  const [categories, setCategories] = useState<any[]>([]);

  // Fetch homepage categories on mount
  useEffect(() => {
    let active = true;
    const fetchCats = () => {
      api.get('/categories')
        .then((res) => {
          if (!active) return;
          setCategories(res.data);
        })
        .catch((err) => {
          console.error('Error fetching categories:', err);
        });
    };

    fetchCats();

    const handleCategoryChange = () => {
      fetchCats();
    };

    socket.on('category_changed', handleCategoryChange);

    return () => {
      active = false;
      socket.off('category_changed', handleCategoryChange);
    };
  }, []);


  const getCategorySubOptions = (cat: any) => {
    const slug = cat.slug.toLowerCase();
    
    if (slug === 'eyeglasses' || slug === 'prescription') {
      return [
        { label: 'Men', img: '/images/men_eyeglasses.png', to: `/products?category=${cat.slug}&gender=men`, gender: 'men', shapeModal: true },
        { label: 'Women', img: '/images/women_eyeglasses.png', to: `/products?category=${cat.slug}&gender=women`, gender: 'women', shapeModal: true },
        { label: 'Kids', img: '/images/kids_eyeglasses.png', to: `/products?category=${cat.slug}&gender=kids`, gender: 'kids', shapeModal: true },
        { label: 'Contact Lenses', img: '/images/cat_contacts.png', to: '/products?category=contact-lenses', shapeModal: false }
      ];
    }
    
    if (slug === 'sunglasses') {
      return [
        { label: 'Men', img: '/images/men_sunglasses.png', to: `/products?category=${cat.slug}&gender=men`, gender: 'men', shapeModal: true },
        { label: 'Women', img: '/images/women_sunglasses.png', to: `/products?category=${cat.slug}&gender=women`, gender: 'women', shapeModal: true },
        { label: 'Kids', img: '/images/kids_sunglasses.png', to: `/products?category=${cat.slug}&gender=kids`, gender: 'kids', shapeModal: true },
        { label: 'Accessories', img: '/images/accessories.png', to: '/products?category=accessories', shapeModal: false }
      ];
    }

    if (slug === 'power-sunglasses') {
      return [
        { label: 'Men', img: '/images/men_sunglasses.png', to: `/products?category=${cat.slug}&gender=men`, gender: 'men', shapeModal: true },
        { label: 'Women', img: '/images/women_sunglasses.png', to: `/products?category=${cat.slug}&gender=women`, gender: 'women', shapeModal: true },
        { label: 'Kids', img: '/images/kids_sunglasses.png', to: `/products?category=${cat.slug}&gender=kids`, gender: 'kids', shapeModal: true },
        { label: 'View More', img: cat.bannerImage || '/images/cat_sunglasses.png', to: `/products?category=${cat.slug}`, shapeModal: false }
      ];
    }

    if (slug === 'reading-glasses') {
      return [
        { label: 'Zero Power', img: '/images/zero_power_glasses.png', to: '/products?category=zero-power', categoryOverride: 'zero-power', shapeModal: true },
        { label: 'Reading', img: '/images/reading_book.png', to: `/products?category=${cat.slug}`, categoryOverride: 'reading-glasses', shapeModal: true },
        { label: 'Power Sun', img: '/images/transition_lens.png', to: '/products?category=sunglasses&hasPower=true', categoryOverride: 'sunglasses', shapeModal: true }
      ];
    }

    if (slug === 'contact-lenses') {
      return [
        { label: 'Clear Lenses', img: '/images/cat_contacts.png', to: `/products?category=${cat.slug}&type=clear`, shapeModal: false },
        { label: 'Color Lenses', img: '/images/cat_contacts.png', to: `/products?category=${cat.slug}&type=color`, shapeModal: false },
        { label: 'Solutions', img: '/images/accessories.png', to: `/products?category=${cat.slug}&type=solution`, shapeModal: false },
        { label: 'View More', img: cat.bannerImage || '/images/cat_contacts.png', to: `/products?category=${cat.slug}`, shapeModal: false }
      ];
    }

    // Default generic sub-options for any other dynamic category
    return [
      { label: 'Men', img: '/images/men_eyeglasses.png', to: `/products?category=${cat.slug}&gender=men`, gender: 'men', shapeModal: true },
      { label: 'Women', img: '/images/women_eyeglasses.png', to: `/products?category=${cat.slug}&gender=women`, gender: 'women', shapeModal: true },
      { label: 'Kids', img: '/images/kids_eyeglasses.png', to: `/products?category=${cat.slug}&gender=kids`, gender: 'kids', shapeModal: true },
      { label: 'View More', img: cat.bannerImage || '/images/hero_model.png', to: `/products?category=${cat.slug}`, shapeModal: false }
    ];
  };

  const handleSubOptionClick = (e: React.MouseEvent, option: any, cat: any) => {
    if (option.shapeModal) {
      e.preventDefault();
      const categorySlug = option.categoryOverride || cat.slug;
      setShapeModalCategory(categorySlug);
      
      if (option.gender) {
        setShapeModalGender(option.gender);
        setShapeModalTitle(`${option.label}'s ${cat.name}`);
      } else {
        setShapeModalGender('');
        setShapeModalTitle(option.label);
      }
      setIsShapeModalOpen(true);
    } else {
      navigate(option.to);
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    const ytMatch = url.match(
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    );
    if (ytMatch && ytMatch[2].length === 11) {
      return `https://www.youtube.com/embed/${ytMatch[2]}`;
    }
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

  // Modal States
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [isGoldModalOpen, setIsGoldModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isShapeModalOpen, setIsShapeModalOpen] = useState(false);
  const [shapeModalTitle, setShapeModalTitle] = useState('');
  const [shapeModalCategory, setShapeModalCategory] = useState('');
  const [shapeModalGender, setShapeModalGender] = useState('');

  // Reels modal states
  const [selectedReel, setSelectedReel] = useState<any | null>(null);
  const [isReelModalOpen, setIsReelModalOpen] = useState(false);
  const [playingReelId, setPlayingReelId] = useState<string | null>(null);
  const [clickedReelId, setClickedReelId] = useState<string | null>(null);

  // Showcase modal states
  const [selectedShowcaseVideo, setSelectedShowcaseVideo] = useState<any | null>(null);
  const [isShowcaseModalOpen, setIsShowcaseModalOpen] = useState(false);

  // Lock body scroll on mobile when menus are open
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile && isShapeModalOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isShapeModalOpen]);



  // Gold Membership States & Handlers
  const [isActivatingGold, setIsActivatingGold] = useState(false);
  const [goldError, setGoldError] = useState('');
  const [goldSuccess, setGoldSuccess] = useState(false);

  const handleQuickAddAndActivate = async () => {
    if (!user) return;
    setIsActivatingGold(true);
    setGoldError('');
    try {
      const needed = Math.max(0, 129 - (user.walletBalance || 0));
      // 1. Add money
      await api.post('/auth/wallet/add', { amount: needed, method: 'upi' });
      // 2. Activate membership
      const res = await api.post('/auth/membership/activate');
      if (res.data.success) {
        setGoldSuccess(true);
        await checkAuth();
      }
    } catch (err: any) {
      setGoldError(err.response?.data?.error || 'Failed to complete transaction.');
    } finally {
      setIsActivatingGold(false);
    }
  };

  const handleGoldArrowClick = () => {
    setIsGoldModalOpen(false);
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/membership' } } });
    } else {
      navigate('/membership');
    }
  };


  // AI Chat States
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! Welcome to EyeGlaze. I am your AI assistant. How can I help you choose the perfect frames today?' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSendChat = () => {
    if (!inputVal.trim()) return;
    const userMsg = inputVal.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setInputVal('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let botResponse = "I'd love to help you find the perfect eyewear! Are you looking for prescription glasses, sunglasses, or trying to find your frame size?";
      
      const val = userMsg.toLowerCase();
      if (val.includes('round') || val.includes('face')) {
        botResponse = 'For a round face, rectangular or square frames like our EG-2041 Matte Square Frame are perfect because they add sharp angles and structure!';
      } else if (val.includes('oval')) {
        botResponse = 'An oval face shape is highly versatile! Most styles look great, but geometric shapes or a Premium Clubmaster (EG-1067) will highlight your features beautifully.';
      } else if (val.includes('prescription') || val.includes('upload') || val.includes('lens')) {
        botResponse = 'You can upload your prescription directly on the home page or select "Buy with Lens" on any product page. We offer HMC, Blue Cut, and Progressive options starting from ₹699.';
      } else if (val.includes('offer') || val.includes('discount') || val.includes('price')) {
        botResponse = 'We currently have a spectacular UP TO 50% OFF promotion on selected sunglasses! Frames start at just ₹1.';
      } else if (val.includes('delivery') || val.includes('shipping') || val.includes('track')) {
        botResponse = 'We offer FREE SHIPPING on all orders! Standard delivery takes 2-4 business days, and you can track your order using the "Track Order" widget.';
      }

      setMessages((prev) => [...prev, { sender: 'bot', text: botResponse }]);
    }, 1200);
  };

  // Prescription Upload States
  const [prescFile, setPrescFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handlePrescUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPrescFile(e.target.files[0]);
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        setUploadSuccess(true);
      }, 2000);
    }
  };

  // New States for Lenskart Enhancements
  const [activeOfferSlide, setActiveOfferSlide] = useState(0);
  const offerSlides = [
    {
      title: 'BUY 1 GET 1 FREE',
      subtitle: 'ON GOLD MEMBERSHIP FRAMES',
      desc: 'Get your second pair absolutely free. Upgrade to premium styling.',
      code: 'GLAZEBOGO',
      bgGradient: 'from-[#6E4E1C]/40 via-[#1C150E] to-[#0B0B0C]',
      borderColor: 'border-[#D4A04D]/30',
      badge: 'BOGO Offer'
    },
    {
      title: 'GET FIRST FRAME FREE',
      subtitle: 'FOR NEW EYEGLAZE MEMBERS',
      desc: 'Select from our signature new arrivals. Pay only for the prescription lenses.',
      code: 'FIRSTFREE',
      bgGradient: 'from-[#1B365D]/30 via-[#0E1524] to-[#0B0B0C]',
      borderColor: 'border-blue-500/30',
      badge: 'New User Exclusive'
    },
    {
      title: 'EXTRA 15% OFF + FREE SHIPPING',
      subtitle: 'ON EXCLUSIVE SUNGLASSES',
      desc: 'Step into summer with polaroid lenses. Limited time discount.',
      code: 'SUN15OFF',
      bgGradient: 'from-[#143D28]/30 via-[#0B1A12] to-[#0B0B0C]',
      borderColor: 'border-emerald-500/30',
      badge: 'Summer Collection'
    }
  ];

  // Auto-slide offer carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveOfferSlide((prev) => (prev + 1) % offerSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const [copiedCoupon, setCopiedCoupon] = useState('');
  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(''), 2000);
  };

  // Home Eye Test Booking States
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingAddress, setBookingAddress] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [isBooked, setIsBooked] = useState(false);

  const handleBookTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDate || !bookingTime || !bookingAddress || !bookingPhone) return;
    setIsBooked(true);
    setTimeout(() => {
      setIsBooked(false);
      setBookingDate('');
      setBookingTime('');
      setBookingAddress('');
      setBookingPhone('');
      alert('Your home eye test has been booked successfully! A certified refractionist will contact you soon.');
    }, 2000);
  };

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const faqData = [
    {
      q: 'How do I find my frame size?',
      a: 'We offer an interactive Frame Size Guide directly on this home page! You can also check the inside temple of your current glasses for numbers like 52-18-140 (lens width, bridge width, temple length) to match your size.'
    },
    {
      q: 'Can I buy frames with prescription lenses?',
      a: 'Absolutely! You can choose "Buy with Lens" on any product page. We custom-grind single-vision, bifocal, or progressive lenses in our digital labs with anti-glare, blue-light block, or photochromic coatings.'
    },
    {
      q: 'How does the Free Home Eye Test work?',
      a: 'Simply click "Book Free Home Eye Test" below, choose your preferred date, time, and address. Our certified optometrist will visit with advanced mobile testing equipment and a collection of 150+ frames to try on!'
    },
    {
      q: 'What is your return and warranty policy?',
      a: 'We offer a 7-day no-questions-asked return policy and a 1-year warranty on all frames and lenses against manufacturing defects. Shipping and returns are completely free!'
    }
  ];



  // Featured Products Data
  const defaultFeaturedProducts = [
    {
      id: 'eg-2041',
      name: 'EG-2041 | Matte Square Frame',
      category: 'Prescription Glasses',
      originalPrice: 999,
      salePrice: 1,
      rating: 4.7,
      reviews: 198,
      image: '/images/cat_prescription.png',
      badge: 'BESTSELLER'
    },
    {
      id: 'eg-1067',
      name: 'EG-1067 | Premium Clubmaster Frame',
      category: 'Sunglasses',
      originalPrice: 999,
      salePrice: 1,
      rating: 4.8,
      reviews: 256,
      image: '/images/cat_sunglasses.png',
      badge: '50% OFF'
    },
    {
      id: 'eg-3055',
      name: 'EG-3055 | Classic Aviator Frame',
      category: 'Sunglasses',
      originalPrice: 1299,
      salePrice: 199,
      rating: 4.9,
      reviews: 142,
      image: '/images/promo_sunglasses.png',
      badge: 'LUXURY'
    },
    {
      id: 'eg-5011',
      name: 'EG-5011 | Retro Round Frame',
      category: 'Blue Light Glasses',
      originalPrice: 899,
      salePrice: 1,
      rating: 4.6,
      reviews: 87,
      image: '/images/cat_blue_light.png',
      badge: 'NEW'
    },
    {
      id: 'eg-4022',
      name: 'EG-4022 | Aviator Style Shield',
      category: 'Computer Glasses',
      originalPrice: 1199,
      salePrice: 299,
      rating: 4.8,
      reviews: 120,
      image: '/images/cat_blue_light.png',
      badge: 'POPULAR'
    },
    {
      id: 'eg-6088',
      name: 'EG-6088 | Cat-Eye Premium Frame',
      category: 'Prescription Glasses',
      originalPrice: 1499,
      salePrice: 499,
      rating: 4.7,
      reviews: 95,
      image: '/images/cat_prescription.png',
      badge: 'ELEGANT'
    },
    {
      id: 'eg-7044',
      name: 'EG-7044 | Hexagonal Wireframe',
      category: 'Zero Power Glasses',
      originalPrice: 899,
      salePrice: 199,
      rating: 4.5,
      reviews: 64,
      image: '/images/cat_blue_light.png',
      badge: 'TRENDING'
    },
    {
      id: 'eg-8012',
      name: 'EG-8012 | Wayfarer Classic',
      category: 'Sunglasses',
      originalPrice: 1099,
      salePrice: 1,
      rating: 4.9,
      reviews: 310,
      image: '/images/promo_sunglasses.png',
      badge: 'HOT SELLER'
    }
  ];

  const [featuredProducts, setFeaturedProducts] = useState<any[]>(defaultFeaturedProducts);

  useEffect(() => {
    let active = true;

    const fetchFeatured = () => {
      api.get('/products?limit=12')
        .then((res) => {
          if (!active) return;
          const fetched = res.data.products || res.data || [];
          if (fetched && fetched.length > 0) {
            setFeaturedProducts(fetched);
          }
        })
        .catch((err) => {
          console.error('Error fetching featured products:', err);
        });
    };

    fetchFeatured();

    const handleProductChange = () => {
      fetchFeatured();
    };

    socket.on('product_changed', handleProductChange);

    return () => {
      active = false;
      socket.off('product_changed', handleProductChange);
    };
  }, []);

  const ADMIN_ROLES = ['admin', 'store_manager', 'support_agent'];
  if (user && ADMIN_ROLES.includes(user.role || '')) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white flex flex-col font-sans pb-16 md:pb-0 w-full overflow-x-clip">
      <SEO 
        title="Premium Eyewear & Custom Lenses"
        description="Experience luxury designer frames, custom prescription lenses, and blue light blocking glasses at EyeGlaze. Book a free home eye test today."
        keywords="eyeglaze, eye glaze, luxury glasses, home eye test, prescription eyeglasses, custom lenses, sunglasses"
      />
      
      {/* Main Body - Shared Layout */}
      <div className="w-full py-6 space-y-12">
        
        {/* Hero Section - Full View */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 lg:px-16 w-full">
          <section className="relative bg-[#111] rounded-2xl overflow-hidden border border-[#2A2A2D] min-h-[260px] sm:min-h-[420px] md:min-h-[520px] flex items-center w-full shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/55 to-transparent z-10" />
            
            {/* Hero text */}
            <div className="relative z-20 px-4 py-6 sm:px-6 md:px-12 max-w-[55%] md:max-w-lg flex flex-col items-start gap-2 sm:gap-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex flex-col items-start gap-2 sm:gap-4"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-5 sm:w-8 h-[2px] bg-[#D4A04D]" />
                    <span className="text-[#D4A04D] text-[8px] sm:text-xs font-bold tracking-widest uppercase">{slides[activeSlide].subtitle}</span>
                  </div>
                  
                  <h1 className="text-sm sm:text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                    {slides[activeSlide].title}
                  </h1>
                  
                  <p className="text-gray-400 text-[8px] sm:text-sm md:text-base line-clamp-2 sm:line-clamp-none">
                    {slides[activeSlide].description}
                  </p>
                  
                  <button 
                    onClick={() => navigate('/products')} 
                    className="mt-1 sm:mt-2 border border-[#D4A04D] text-[#D4A04D] hover:bg-[#D4A04D] hover:text-black font-semibold tracking-wider text-[8px] sm:text-xs uppercase py-1.5 px-3 sm:py-3 sm:px-6 rounded-md sm:rounded-lg transition-all duration-300 flex items-center gap-1.5 sm:gap-2 group cursor-pointer"
                  >
                    {slides[activeSlide].buttonText} 
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </motion.div>
              </AnimatePresence>

              {/* Slide dots */}
              <div className="flex gap-1.5 mt-2 sm:mt-6">
                {slides.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveSlide(i)} 
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${activeSlide === i ? 'bg-[#D4A04D] w-4 sm:w-6' : 'bg-gray-600'}`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Banner image */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 md:w-3/5 h-full overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={activeSlide}
                  src={slides[activeSlide].image} 
                  alt="Premium Eyewear Model" 
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="w-full h-full object-cover object-center scale-100" 
                />
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* Feature Badges Strip - Full View */}
        <section className="border-y border-[#2A2A2D] py-4 bg-[#0E0E0E] w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 lg:px-16 w-full">
            <div className="grid grid-cols-4 divide-x divide-[#2A2A2D] text-center w-full">
              
              {/* 100% Authentic */}
              <div className="flex flex-col items-center justify-center px-1">
                <span className="text-[#D4A04D] mb-1.5">
                  <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
                <span className="text-white text-[9px] sm:text-xs font-bold leading-tight block">100%</span>
                <span className="text-[#A7A7A7] text-[7px] sm:text-[10px] uppercase tracking-wider block mt-0.5">Authentic</span>
              </div>

              {/* Premium Quality */}
              <div className="flex flex-col items-center justify-center px-1">
                <span className="text-[#D4A04D] mb-1.5">
                  <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0h4m-4 0H8m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <span className="text-white text-[9px] sm:text-xs font-bold leading-tight block">Premium</span>
                <span className="text-[#A7A7A7] text-[7px] sm:text-[10px] uppercase tracking-wider block mt-0.5">Quality</span>
              </div>

              {/* 7 Days Return */}
              <div className="flex flex-col items-center justify-center px-1">
                <span className="text-[#D4A04D] mb-1.5">
                  <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                  </svg>
                </span>
                <span className="text-white text-[9px] sm:text-xs font-bold leading-tight block">7 Days</span>
                <span className="text-[#A7A7A7] text-[7px] sm:text-[10px] uppercase tracking-wider block mt-0.5">Return</span>
              </div>

              {/* Free Shipping */}
              <div className="flex flex-col items-center justify-center px-1">
                <span className="text-[#D4A04D] mb-1.5">
                  <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 011-1v-4a1 1 0 011-1h2l4 4v3.5a1.5 1.5 0 01-1.5 1.5h-1m-6 0a2 2 0 004 0h5M3 17h2m4 0h6m4 0h2" />
                  </svg>
                </span>
                <span className="text-white text-[9px] sm:text-xs font-bold leading-tight block">Free</span>
                <span className="text-[#A7A7A7] text-[7px] sm:text-[10px] uppercase tracking-wider block mt-0.5">Shipping</span>
              </div>

            </div>
          </div>
        </section>

        {/* Shop by Category - Desktop View */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 lg:px-16 w-full">
          <section className="flex flex-col gap-8 w-full mt-2">
            <div className="flex flex-col">
              {/* <h2 className="text-lg font-bold uppercase tracking-wider text-white">Shop by Category</h2> */}
              {/* <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mt-0.5">Explore our premium dynamic collections</span> */}
            </div>

            {categories.map((cat, catIdx) => {
              const subOptions = getCategorySubOptions(cat);
              return (
                <motion.div 
                  key={cat._id || cat.slug} 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: catIdx * 0.1 }}
                  className="flex flex-col gap-4"
                >
                  <h3 className="text-base font-extrabold text-white uppercase tracking-wider">{cat.name}</h3>
                  <div className={`grid gap-6 w-full ${subOptions.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                    {subOptions.map((item, idx) => (
                      <Link 
                        key={idx} 
                        to={item.to}
                        onClick={(e) => handleSubOptionClick(e, item, cat)}
                        className="relative bg-gradient-to-b from-[#111112] to-[#070708] border border-zinc-800/80 rounded-2xl aspect-[3/4.2] overflow-hidden group shadow-md flex flex-col justify-end transition-all duration-300 hover:border-[#D4A04D]/60 hover:shadow-[0_0_20px_rgba(212,160,77,0.1)] cursor-pointer"
                      >
                        <img 
                          src={item.img} 
                          alt={item.label} 
                          className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        />
                        
                        <div className="relative z-10 bg-gradient-to-t from-black via-black/85 to-transparent pt-12 pb-5 px-4 flex flex-col items-center text-center justify-center transition-all duration-300">
                          <span className="text-sm font-black text-white uppercase tracking-wider leading-none group-hover:text-[#D4A04D] transition-colors">{item.label}</span>
                          <span className="text-[#D4A04D] text-[10px] font-bold uppercase mt-1.5 tracking-widest flex items-center justify-center gap-0.5">
                            <span>Shop Now</span>
                            <span>→</span>
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </section>
        </div>
      </div>


      {/* ================= MOBILE LAYOUT (Mockup Style) ================= */}
      <div className="block md:hidden w-full bg-black text-white pb-6 font-sans">
        {/* Mobile Main Body */}
        <div className="px-4 py-5 space-y-6">
          
          {/* Hero Slider Card */}
          <div className="relative bg-gradient-to-br from-[#0d0d0e] to-[#050505] border border-zinc-800 rounded-2xl p-5 min-h-[170px] flex items-center justify-between overflow-hidden shadow-xl">
            {/* Background design */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,160,77,0.04),transparent_60%)] pointer-events-none" />
            
            {/* Text details (Left) */}
            <div className="flex flex-col items-start max-w-[55%] z-10 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-[1px] bg-[#D4A04D]" />
                <span className="text-[#D4A04D] text-[8px] font-extrabold tracking-wider uppercase">SEE THE WORLD</span>
              </div>
              
              <h1 className="text-md sm:text-lg font-black text-white leading-tight tracking-wide">
                CLEARER. SHARPER.<br />YOU.
              </h1>
              
              <p className="text-gray-400 text-[9px] leading-relaxed font-medium">
                Premium Eyewear for Every Version of You.
              </p>
              
              <button 
                onClick={() => navigate('/products')} 
                className="mt-1 border border-[#D4A04D] text-[#D4A04D] hover:bg-[#D4A04D] hover:text-black font-extrabold tracking-wider text-[8px] uppercase py-1 px-3 rounded-lg transition-all flex items-center gap-1 bg-transparent cursor-pointer"
              >
                <span>SHOP NOW</span>
                <span className="text-[9px] font-bold">→</span>
              </button>
            </div>

            {/* Model Image (Right) */}
            <div className="absolute right-0 bottom-0 top-0 w-[45%] h-full flex items-end">
              <img 
                src="/images/hero_model.png" 
                alt="Model" 
                className="w-full h-full object-cover object-center translate-y-1"
              />
            </div>
          </div>

          {/* Slider Pagination Dots */}
          <div className="flex justify-center items-center gap-1.5 mt-1">
            <span className="w-4 h-1 bg-[#D4A04D] rounded-full transition-all duration-300" />
            <span className="w-1 h-1 bg-zinc-700 rounded-full transition-all duration-300" />
          </div>

          {/* Feature Badges Grid */}
          <div className="grid grid-cols-4 border border-zinc-800/80 bg-[#070707] rounded-xl py-3.5 divide-x divide-zinc-800/60 shadow-md">
            
            {/* 100% Authentic */}
            <div className="flex flex-col items-center justify-center text-center px-1">
              <div className="w-7 h-7 rounded-full border border-[#D4A04D]/35 flex items-center justify-center text-[#D4A04D] mb-1">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-white text-[8.5px] font-black leading-tight">100%</span>
              <span className="text-gray-500 text-[7.5px] font-extrabold uppercase tracking-wider leading-none mt-0.5">AUTHENTIC</span>
            </div>

            {/* Premium Quality */}
            <div className="flex flex-col items-center justify-center text-center px-1">
              <div className="w-7 h-7 rounded-full border border-[#D4A04D]/35 flex items-center justify-center text-[#D4A04D] mb-1">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0h4m-4 0H8m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-white text-[8.5px] font-black leading-tight">Premium</span>
              <span className="text-gray-500 text-[7.5px] font-extrabold uppercase tracking-wider leading-none mt-0.5">QUALITY</span>
            </div>

            {/* 7 Days Return */}
            <div className="flex flex-col items-center justify-center text-center px-1">
              <div className="w-7 h-7 rounded-full border border-[#D4A04D]/35 flex items-center justify-center text-[#D4A04D] mb-1">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                </svg>
              </div>
              <span className="text-white text-[8.5px] font-black leading-tight">7 Days</span>
              <span className="text-gray-500 text-[7.5px] font-extrabold uppercase tracking-wider leading-none mt-0.5">RETURN</span>
            </div>

            {/* Free Shipping */}
            <div className="flex flex-col items-center justify-center text-center px-1">
              <div className="w-7 h-7 rounded-full border border-[#D4A04D]/35 flex items-center justify-center text-[#D4A04D] mb-1">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 011-1v-4a1 1 0 011-1h2l4 4v3.5a1.5 1.5 0 01-1.5 1.5h-1m-6 0a2 2 0 004 0h5M3 17h2m4 0h6m4 0h2" />
                </svg>
              </div>
              <span className="text-white text-[8.5px] font-black leading-tight">Free</span>
              <span className="text-gray-500 text-[7.5px] font-extrabold uppercase tracking-wider leading-none mt-0.5">SHIPPING</span>
            </div>

          </div>

          {/* Shop by Category - Mobile View */}
          <div className="space-y-6 pb-4">
            <div className="flex flex-col">
              <h2 className="text-[10px] font-black text-white tracking-widest uppercase">Shop by Category</h2>
              <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Explore our premium dynamic collections</span>
            </div>

            {categories.map((cat) => {
              const subOptions = getCategorySubOptions(cat);
              return (
                <div key={cat._id || cat.slug} className="space-y-3">
                  <h3 className="text-[10px] font-black text-white tracking-widest uppercase">{cat.name}</h3>
                  <div className={`grid gap-2 ${subOptions.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                    {subOptions.map((item, idx) => (
                      <Link 
                        key={idx} 
                        to={item.to}
                        onClick={(e) => handleSubOptionClick(e, item, cat)}
                        className="relative bg-gradient-to-b from-[#111112] to-[#070708] border border-zinc-800/80 rounded-xl aspect-[3/4.2] overflow-hidden group shadow-md flex flex-col justify-end"
                      >
                        <img 
                          src={item.img} 
                          alt={item.label} 
                          className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-103"
                        />
                        
                        <div className="relative z-10 bg-gradient-to-t from-black via-black/80 to-transparent pt-6 pb-2 px-1.5 flex flex-col items-center text-center justify-center">
                          <span className="text-[8px] font-black text-white uppercase tracking-wider leading-none">{item.label}</span>
                          <span className="text-[#D4A04D] text-[6px] font-bold uppercase mt-1 tracking-widest flex items-center justify-center gap-0.5">
                            <span>Shop Now</span>
                            <span>→</span>
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div> {/* END MOBILE LAYOUT */}
      {/* ================= SHARED PAGE CONTENT ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 lg:px-16 w-full py-6 flex flex-col gap-10 pb-24 md:pb-6">
        {/* Featured Products Section - Full View */}
        <section className="flex flex-col gap-6 w-full py-4 border-t border-[#1C1C1E]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-lg font-bold uppercase tracking-wider text-white">Featured Products</h2>
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mt-0.5">EyeGlaze Bestsellers of the week</span>
            </div>
            <Link to="/products" className="text-[#D4A04D] text-xs hover:underline flex items-center gap-1 font-semibold">
              Explore All <span>&gt;</span>
            </Link>
          </div>

          {/* Products Carousel */}
          <div className="relative w-full group/carousel">
            {/* Left navigation arrow */}
            <button 
              onClick={scrollLeft}
              className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-[#121212]/90 border border-[#2A2A2D] text-white rounded-full flex items-center justify-center hover:border-[#D4A04D] hover:text-[#D4A04D] transition-all cursor-pointer shadow-lg opacity-0 group-hover/carousel:opacity-100 hidden md:flex"
              aria-label="Previous Products"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Carousel Container */}
            <div 
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none w-full pb-4"
            >
              {featuredProducts.map((product, pIdx) => {
                const productId = product._id || product.id;
                const salePrice = product.price?.selling ?? product.salePrice ?? 0;
                const originalPrice = product.price?.original ?? product.originalPrice ?? 0;
                const imageUrl = product.images?.[0] || product.image || '/images/cat_prescription.png';
                const name = product.name;
                const categoryName = product.category || 'Eyewear';
                const rating = product.rating || 5.0;
                const reviews = product.reviewCount ?? product.reviews ?? 0;
                const badge = product.isBestseller ? 'BESTSELLER' : (product.badge || 'NEW');

                return (
                  <motion.div 
                    key={productId}
                    onClick={() => navigate(`/products/${productId}`)}
                    initial={{ opacity: 0, y: 35 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, delay: pIdx * 0.05 }}
                    whileHover={{ y: -6, borderColor: "rgba(212,160,77,0.6)", boxShadow: "0 12px 24px rgba(0,0,0,0.4)" }}
                    className="flex-shrink-0 w-[70vw] sm:w-[235px] md:w-[245px] snap-start bg-[#121212] border border-[#2A2A2D] rounded-2xl overflow-hidden group flex flex-col justify-between cursor-pointer"
                  >
                    
                    {/* Image & Badge Container */}
                    <div className="aspect-[4/3] bg-[#131314] p-4 relative flex items-center justify-center border-b border-[#2A2A2D]/40 overflow-hidden">
                      <span className="absolute top-3 left-3 bg-[#D4A04D] text-black text-[9px] font-bold py-1 px-2.5 rounded-full tracking-wider uppercase">
                        {badge}
                      </span>
                      
                      <img 
                        src={imageUrl} 
                        alt={name} 
                        className="max-h-[85%] max-w-[85%] object-contain group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Hover Quick View Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="border border-[#D4A04D] text-[#D4A04D] bg-black/80 font-bold text-[10px] tracking-wider uppercase py-2 px-4 rounded-lg">
                          Quick View
                        </span>
                      </div>
                    </div>

                    {/* Details Container */}
                    <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-[#D4A04D] font-bold uppercase tracking-wider">{categoryName.replace('_', ' ')}</span>
                        <h3 className="text-white text-xs font-semibold group-hover:text-[#D4A04D] transition-colors line-clamp-1">{name}</h3>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2A2A2D]/40">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#D4A04D] text-sm font-bold">₹{salePrice}</span>
                          <span className="text-gray-600 text-[10px] line-through">₹{originalPrice}</span>
                        </div>

                        {/* Ratings */}
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500 text-xs">★</span>
                          <span className="text-white text-[10px] font-semibold">{rating}</span>
                          <span className="text-gray-600 text-[9px]">({reviews})</span>
                        </div>
                      </div>
                    </div>

                  </motion.div>
                );
              })}
            </div>

            {/* Right navigation arrow */}
            <button 
              onClick={scrollRight}
              className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-[#121212]/90 border border-[#2A2A2D] text-white rounded-full flex items-center justify-center hover:border-[#D4A04D] hover:text-[#D4A04D] transition-all cursor-pointer shadow-lg opacity-0 group-hover/carousel:opacity-100 hidden md:flex"
              aria-label="Next Products"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </section>

        {/* Promo Section - Full View */}
        <section className="grid grid-cols-2 gap-3 sm:gap-6 w-full">
          
          {/* Card 1 */}
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-3 sm:p-6 flex items-center justify-between min-h-[110px] sm:min-h-[160px] relative overflow-hidden group hover:border-[#D4A04D]/50 transition-all duration-300 w-full">
            <div className="flex flex-col gap-1 sm:gap-2 max-w-[60%] sm:max-w-[55%] z-10">
              <span className="text-white text-[7px] sm:text-[10px] font-bold tracking-widest uppercase">Special Promo</span>
              <h3 className="text-[#D4A04D] text-xs sm:text-2xl font-extrabold leading-none sm:leading-tight">UP TO 50% OFF</h3>
              <p className="text-gray-400 text-[8px] sm:text-xs font-semibold leading-tight line-clamp-1 sm:line-clamp-none">On Selected Sunglasses</p>
              <button 
                onClick={() => navigate('/products?category=sunglasses')}
                className="mt-1.5 sm:mt-3 w-fit border border-[#D4A04D] text-[#D4A04D] hover:bg-[#D4A04D] hover:text-black text-[7px] sm:text-[10px] font-bold uppercase py-1 px-2.5 sm:py-2 sm:px-4 rounded transition-all duration-300 cursor-pointer"
              >
                SHOP NOW
              </button>
            </div>
            <div className="w-2/5 md:w-1/2 h-full absolute right-0 top-0 bottom-0">
              <img src="/images/promo_sunglasses.png" alt="Promo Sunglasses" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-3 sm:p-6 flex items-center justify-between min-h-[110px] sm:min-h-[160px] relative overflow-hidden group hover:border-[#D4A04D]/50 transition-all duration-300 w-full">
            <div className="flex flex-col gap-1 sm:gap-2 max-w-[60%] sm:max-w-[55%] z-10">
              <span className="text-[#D4A04D] text-[7px] sm:text-[10px] font-bold tracking-widest uppercase">NEW ARRIVALS</span>
              <h3 className="text-white text-xs sm:text-2xl font-extrabold leading-none sm:leading-tight">Just In!</h3>
              <p className="text-gray-400 text-[8px] sm:text-xs font-semibold leading-tight line-clamp-1 sm:line-clamp-none">Explore latest trends.</p>
              <button 
                onClick={() => navigate('/products')}
                className="mt-1.5 sm:mt-3 w-fit border border-[#D4A04D] text-[#D4A04D] hover:bg-[#D4A04D] hover:text-black text-[7px] sm:text-[10px] font-bold uppercase py-1 px-2.5 sm:py-2 sm:px-4 rounded transition-all duration-300 cursor-pointer"
              >
                EXPLORE
              </button>
            </div>
            <div className="w-2/5 md:w-1/2 h-full absolute right-0 top-0 bottom-0">
              <img src="/images/promo_new_arrivals.png" alt="New Arrivals" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
          </div>

        </section>
        {/* Lenskart-Style Advanced Offers Carousel */}
        <section className="w-full py-8 border-t border-[#1C1C1E] flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white">Exclusive Offers & Promotions</h2>
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Get the best value on premium eyewear</span>
          </div>

          <div className="relative w-full min-h-[220px] rounded-2xl border border-[#2A2A2D] overflow-hidden group bg-[#111]">
            {/* Background transition wrapper */}
            <div className={`absolute inset-0 bg-gradient-to-r ${offerSlides[activeOfferSlide].bgGradient} transition-all duration-700 ease-in-out`} />
            
            {/* Overlay Grid */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeOfferSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 h-full min-h-[220px]"
              >
                <div className="flex flex-col items-start gap-3 max-w-xl">
                  <span className="bg-[#D4A04D] text-black text-[9px] font-extrabold py-1 px-3 rounded-full uppercase tracking-wider">
                    {offerSlides[activeOfferSlide].badge}
                  </span>
                  <h3 className="text-xl md:text-3xl font-extrabold text-white leading-tight uppercase tracking-wide">
                    {offerSlides[activeOfferSlide].title}
                  </h3>
                  <span className="text-[#D4A04D] text-[10px] md:text-xs font-bold tracking-widest uppercase">
                    {offerSlides[activeOfferSlide].subtitle}
                  </span>
                  <p className="text-gray-400 text-xs md:text-sm leading-relaxed max-w-md">
                    {offerSlides[activeOfferSlide].desc}
                  </p>
                </div>

                {/* Coupon Card & Action */}
                <div className="flex flex-col items-start md:items-end gap-3 justify-center">
                  <div className="bg-[#0B0B0C]/80 backdrop-blur-md border border-[#2A2A2D] rounded-xl p-4 flex flex-col gap-2 w-full sm:w-[240px] items-center justify-center text-center shadow-lg">
                    <span className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">COPY COUPON CODE</span>
                    <div className="border border-dashed border-[#D4A04D]/50 rounded-lg px-4 py-2 bg-[#131314] font-mono text-sm text-[#D4A04D] font-bold tracking-wider w-full select-all">
                      {offerSlides[activeOfferSlide].code}
                    </div>
                    <button
                      onClick={() => handleCopyCoupon(offerSlides[activeOfferSlide].code)}
                      className="w-full mt-1 bg-[#D4A04D] hover:bg-[#C8923E] text-black font-bold text-[10px] uppercase py-2 rounded-lg tracking-wider transition-colors cursor-pointer"
                    >
                      {copiedCoupon === offerSlides[activeOfferSlide].code ? '✓ COPIED!' : 'COPY CODE'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Left/Right Controls */}
            <button
              onClick={() => setActiveOfferSlide((prev) => (prev - 1 + offerSlides.length) % offerSlides.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-[#2A2A2D] bg-[#0A0A0A]/80 text-white flex items-center justify-center hover:border-[#D4A04D] transition-all z-25 opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              &larr;
            </button>
            <button
              onClick={() => setActiveOfferSlide((prev) => (prev + 1) % offerSlides.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-[#2A2A2D] bg-[#0A0A0A]/80 text-white flex items-center justify-center hover:border-[#D4A04D] transition-all z-25 opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              &rarr;
            </button>

            {/* Bullets */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-25">
              {offerSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveOfferSlide(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeOfferSlide === idx ? 'bg-[#D4A04D] w-4' : 'bg-gray-600'}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Shop by Frame Shape */}
        <section className="w-full py-4 border-t border-[#1C1C1E] flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold uppercase tracking-wider text-white">Find Your Signature Shape</h2>
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Select a geometry that highlights your face</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
            {[
              {
                name: 'Hexagonal',
                desc: 'Geometric & Bold',
                slug: 'hexagonal',
                svg: (
                  <svg className="w-16 h-8 text-gray-400 group-hover:text-[#D4A04D] transition-colors" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <polygon points="10,15 20,6 35,6 45,15 35,24 20,24" />
                    <polygon points="55,15 65,6 80,6 90,15 80,24 65,24" />
                    <path d="M45,13 L55,13 M10,13 L3,13 M90,13 L97,13" />
                  </svg>
                )
              },
              {
                name: 'Rectangle',
                desc: 'Classic & Smart',
                slug: 'rectangle',
                svg: (
                  <svg className="w-16 h-8 text-gray-400 group-hover:text-[#D4A04D] transition-colors" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="12" y="7" width="30" height="16" rx="2" />
                    <rect x="58" y="7" width="30" height="16" rx="2" />
                    <path d="M42,13 L58,13 M12,13 L4,13 M88,13 L96,13" />
                  </svg>
                )
              },
              {
                name: 'Round',
                desc: 'Retro & Artistic',
                slug: 'round',
                svg: (
                  <svg className="w-16 h-8 text-gray-400 group-hover:text-[#D4A04D] transition-colors" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="27" cy="15" r="10" />
                    <circle cx="73" cy="15" r="10" />
                    <path d="M37,15 L63,15 M17,15 L4,15 M83,15 L96,15" />
                  </svg>
                )
              },
              {
                name: 'Aviator',
                desc: 'Retro & Iconic',
                slug: 'aviator',
                svg: (
                  <svg className="w-16 h-8 text-gray-400 group-hover:text-[#D4A04D] transition-colors" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M15,9 C20,8 35,8 38,12 C40,18 35,24 27,24 C19,24 13,18 15,9 Z" />
                    <path d="M85,9 C80,8 65,8 62,12 C60,18 65,24 73,24 C81,24 87,18 85,9 Z" />
                    <path d="M38,11 L62,11 M36,8 L64,8 M15,12 L4,12 M85,12 L96,12" />
                  </svg>
                )
              },
              {
                name: 'Cat-Eye',
                desc: 'Sleek & Vintage',
                slug: 'cateye',
                svg: (
                  <svg className="w-16 h-8 text-gray-400 group-hover:text-[#D4A04D] transition-colors" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M10,8 C25,8 42,12 40,20 C38,25 25,25 15,18 C8,13 8,8 10,8 Z" />
                    <path d="M90,8 C75,8 58,12 60,20 C62,25 75,25 85,18 C92,13 92,8 90,8 Z" />
                    <path d="M40,15 L60,15 M8,9 L3,9 M92,9 L97,9" />
                  </svg>
                )
              },
              {
                name: 'Clubmaster',
                desc: 'Sleek & Professional',
                slug: 'clubmaster',
                svg: (
                  <svg className="w-16 h-8 text-gray-400 group-hover:text-[#D4A04D] transition-colors" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M14,12 C14,18 20,23 28,23 C36,23 42,18 42,12" strokeWidth="1.2" />
                    <path d="M58,12 C58,18 64,23 72,23 C80,23 86,18 86,12" strokeWidth="1.2" />
                    <path d="M12,12 C12,10 18,7 28,7 C38,7 42,10 42,12" strokeWidth="2.5" fill="none" />
                    <path d="M88,12 C88,10 82,7 72,7 C62,7 58,10 58,12" strokeWidth="2.5" fill="none" />
                    <path d="M42,13 L58,13 M12,11 L4,11 M88,11 L96,11" />
                  </svg>
                )
              }
            ].map((shape) => (
              <Link
                key={shape.slug}
                to={`/products?shape=${shape.slug}`}
                className="bg-[#121212] border border-[#2A2A2D] rounded-xl p-5 flex flex-col items-center justify-center text-center gap-3 hover:border-[#D4A04D]/50 transition-all duration-300 group cursor-pointer"
              >
                <div className="h-10 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                  {shape.svg}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-white text-xs font-bold tracking-wider group-hover:text-[#D4A04D] transition-colors">{shape.name}</span>
                  <span className="text-gray-500 text-[9px] font-semibold">{shape.desc}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* As Seen On / Trendsetter Showcase */}
        <section className="w-full py-4 border-t border-[#1C1C1E] flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold uppercase tracking-wider text-white">The EyeGlaze Edit: Styled by Icons</h2>
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">High-fashion trends inspired by global runways</span>
            </div>
          </div>

          {/* Icons Carousel */}
          <div className="relative w-full group/icons-carousel">
            {/* Left navigation arrow */}
            <button 
              onClick={scrollIconsLeft}
              className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-[#121212]/90 border border-[#2A2A2D] text-white rounded-full flex items-center justify-center hover:border-[#D4A04D] hover:text-[#D4A04D] transition-all cursor-pointer shadow-lg opacity-0 group-hover/icons-carousel:opacity-100 hidden md:flex"
              aria-label="Previous Trend"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Carousel Container */}
            <div 
              ref={iconsCarouselRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none w-full pb-4"
            >
              {[
                {
                  title: 'The Minimalist',
                  style: 'Thin Gold Wireframes',
                  img: '/images/cat_prescription.png',
                  desc: 'A subtle statement. Lightweight frames engineered from aerospace titanium.'
                },
                {
                  title: 'The Maverick',
                  style: 'Chunky Acetate Square',
                  img: '/images/cat_sunglasses.png',
                  desc: 'Bold contours and thick temples for an unapologetically smart profile.'
                },
                {
                  title: 'The Creator',
                  style: 'Round Transparent Rim',
                  img: '/images/cat_blue_light.png',
                  desc: 'Intellectual styling utilizing clear bio-acetates and textured temples.'
                },
                {
                  title: 'The Explorer',
                  style: 'Classic Double-Bar Aviators',
                  img: '/images/promo_sunglasses.png',
                  desc: 'An outdoor vintage classic re-imagined with high-contrast polaroid lenses.'
                }
              ].map((trend, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 w-[70vw] sm:w-[235px] md:w-[245px] snap-start bg-[#121212] border border-[#2A2A2D] rounded-2xl overflow-hidden group hover:border-[#D4A04D]/50 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-[#131314] relative flex items-center justify-center p-6 border-b border-[#2A2A2D]/40">
                    <img
                      src={trend.img}
                      alt={trend.title}
                      className="max-h-[85%] max-w-[85%] object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                  </div>
                  <div className="p-4 flex flex-col gap-1.5 flex-1 justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-[#D4A04D] text-[10px] font-bold uppercase tracking-wider">{trend.style}</span>
                      <h3 className="text-white text-xs font-bold">{trend.title}</h3>
                      <p className="text-gray-400 text-[10px] leading-relaxed mt-1 font-semibold">{trend.desc}</p>
                    </div>
                    <button
                      onClick={() => navigate('/products')}
                      className="w-full mt-3 border border-[#2A2A2D] group-hover:border-[#D4A04D] text-white group-hover:text-black group-hover:bg-[#D4A04D] text-[10px] font-bold py-2 rounded-lg transition-all"
                    >
                      SHOP THE LOOK
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right navigation arrow */}
            <button 
              onClick={scrollIconsRight}
              className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-[#121212]/90 border border-[#2A2A2D] text-white rounded-full flex items-center justify-center hover:border-[#D4A04D] hover:text-[#D4A04D] transition-all cursor-pointer shadow-lg opacity-0 group-hover/icons-carousel:opacity-100 hidden md:flex"
              aria-label="Next Trend"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </section>

        {/* EyeGlaze Reels Section */}
        {reels && reels.length > 0 ? (
          <section className="w-full py-8 border-t border-[#1C1C1E] flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold uppercase tracking-wider text-white">EyeGlaze Reels</h2>
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Trending styles, lookbooks and details</span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none w-full flex-nowrap scroll-smooth">
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
          </section>
        ) : null}

        {/* EyeGlaze Showcase Section */}
        {videos && videos.length > 0 ? (
          <section className="w-full py-8 border-t border-[#1C1C1E] flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold uppercase tracking-wider text-white">EyeGlaze Showcase</h2>
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Explore our journey and customer stories</span>
            </div>

            <div className="relative w-full group/showcase-carousel">
              {/* Left navigation arrow */}
              <button 
                onClick={scrollShowcaseLeft}
                className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-[#121212]/90 border border-[#2A2A2D] text-white rounded-full flex items-center justify-center hover:border-[#D4A04D] hover:text-[#D4A04D] transition-all cursor-pointer shadow-lg opacity-0 group-hover/showcase-carousel:opacity-100 hidden md:flex"
                aria-label="Previous Showcase Video"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Right navigation arrow */}
              <button 
                onClick={scrollShowcaseRight}
                className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-[#121212]/90 border border-[#2A2A2D] text-white rounded-full flex items-center justify-center hover:border-[#D4A04D] hover:text-[#D4A04D] transition-all cursor-pointer shadow-lg opacity-0 group-hover/showcase-carousel:opacity-100 hidden md:flex"
                aria-label="Next Showcase Video"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Showcase Carousel Container */}
              <div 
                ref={showcaseCarouselRef}
                className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none w-full pb-4"
              >
                {videos.map((vid) => (
                  <div 
                    key={vid._id || vid.id}
                    onClick={() => {
                      setSelectedShowcaseVideo(vid);
                      setIsShowcaseModalOpen(true);
                    }}
                    className="flex-shrink-0 w-[70vw] sm:w-[250px] md:w-[280px] snap-start bg-[#121212] border border-[#2A2A2D] rounded-2xl overflow-hidden group hover:border-[#D4A04D]/50 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-[#131314] relative flex items-center justify-center p-0 border-b border-[#2A2A2D]/40">
                      {isDirectVideo(vid.videoUrl) ? (
                        <video
                          src={vid.videoUrl}
                          className="w-full h-full object-cover pointer-events-none"
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <iframe
                          title={vid.title}
                          className="w-full h-full pointer-events-none border-none"
                          src={getEmbedUrl(vid.videoUrl)}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity" />
                      {/* Play overlay button on center */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-black/55 border border-white/20 flex items-center justify-center text-white text-xs">
                          ▶
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 flex flex-col gap-1.5 flex-1 justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-[#D4A04D] text-[10px] font-bold uppercase tracking-wider">CUSTOMER STORY</span>
                        <h3 className="text-white text-xs font-bold truncate">{vid.title}</h3>
                        {vid.description && (
                          <p className="text-gray-400 text-[10px] leading-relaxed mt-1 font-semibold line-clamp-2">
                            {vid.description}
                          </p>
                        )}
                      </div>
                      <button
                        className="w-full mt-3 border border-[#2A2A2D] group-hover:border-[#D4A04D] text-white group-hover:text-black group-hover:bg-[#D4A04D] text-[10px] font-bold py-2 rounded-lg transition-all"
                      >
                        WATCH SHOWCASE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="w-full py-8 border-t border-[#1C1C1E] flex flex-col gap-6 opacity-40">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold uppercase tracking-wider text-white">EyeGlaze Showcase</h2>
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Explore our journey and customer stories</span>
            </div>
            <div className="bg-[#121212] border border-[#2A2A2D] rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-2 max-w-3xl mx-auto w-full">
              <span>🎥</span>
              <span className="text-xs text-gray-400">Videos will appear here once activated by admin.</span>
            </div>
          </section>
        )}

        {/* Split Section: Frequently Asked Questions & EYEGLAZE CLINIC @ HOME */}
        <section className="w-full py-8 border-t border-[#1C1C1E] grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: FAQ */}
          <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold uppercase tracking-wider text-white">Frequently Asked Questions</h2>
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Everything you need to know about buying glasses online</span>
            </div>

            <div className="flex flex-col gap-3 w-full">
              {faqData.map((faq, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div
                    key={idx}
                    className="bg-[#121212] border border-[#2A2A2D] rounded-xl overflow-hidden transition-all duration-300"
                  >
                    <button
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none hover:bg-[#131314] transition-colors cursor-pointer"
                    >
                      <span className="text-white text-xs md:text-sm font-bold uppercase tracking-wide">{faq.q}</span>
                      <span className={`text-[#D4A04D] font-bold text-xs transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 text-xs md:text-sm text-gray-400 leading-relaxed border-t border-[#2A2A2D]/40 pt-3 animate-fade-in font-medium">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Home Eye Test Form */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-[#121212] border border-[#2A2A2D] rounded-2xl p-6 md:p-8 flex flex-col gap-5 justify-between relative overflow-hidden group hover:border-[#D4A04D]/30 transition-colors w-full shadow-xl">
              <div className="flex flex-col gap-2">
                <span className="text-[#D4A04D] text-[10px] font-extrabold tracking-widest uppercase">EYEGLAZE CLINIC @ HOME</span>
                <h3 className="text-white text-lg md:text-xl font-extrabold uppercase tracking-wide">Book Free Home Eye Test</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Why step out? Get your eyes tested by a certified optometrist in the comfort of your home. Includes advanced digital refraction and a collection of 150+ frames to try on!
                </p>
              </div>

              <form onSubmit={handleBookTest} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[9px] font-bold uppercase tracking-wider">Select Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="bg-[#181818] border border-[#2A2A2D] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#D4A04D]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[9px] font-bold uppercase tracking-wider">Preferred Time Slot</label>
                  <select
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="bg-[#181818] border border-[#2A2A2D] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#D4A04D]"
                  >
                    <option value="">Choose slot...</option>
                    <option value="10am-12pm">10:00 AM - 12:00 PM</option>
                    <option value="12pm-2pm">12:00 PM - 02:00 PM</option>
                    <option value="2pm-4pm">02:00 PM - 04:00 PM</option>
                    <option value="4pm-6pm">04:00 PM - 06:00 PM</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-gray-500 text-[9px] font-bold uppercase tracking-wider">Address & Pincode</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full address for optometrist visit..."
                    value={bookingAddress}
                    onChange={(e) => setBookingAddress(e.target.value)}
                    className="bg-[#181818] border border-[#2A2A2D] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#D4A04D] placeholder-gray-600"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[9px] font-bold uppercase tracking-wider">Phone Number</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    placeholder="10-digit mobile number"
                    value={bookingPhone}
                    onChange={(e) => setBookingPhone(e.target.value)}
                    className="bg-[#181818] border border-[#2A2A2D] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#D4A04D] placeholder-gray-600"
                  />
                </div>

                <div className="flex items-end mt-1">
                  <button
                    type="submit"
                    disabled={isBooked}
                    className="w-full bg-[#D4A04D] hover:bg-[#C8923E] disabled:bg-gray-600 text-black font-extrabold text-[10px] uppercase py-3 rounded-lg tracking-wider transition-colors cursor-pointer"
                  >
                    {isBooked ? 'BOOKING IN PROGRESS...' : 'CONFIRM FREE APPOINTMENT'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>


      </div> {/* END SHARED PAGE CONTENT */}

        {/* Mobile Bottom Navigation Bar */}
        <nav className="fixed bottom-0 md:hidden left-0 right-0 bg-[#0A0A0A]/95 border-t border-[#1C1C1E] h-18 z-30 flex items-center justify-between px-3 backdrop-blur-md pb-safe">
          
          {/* Home */}
          <Link to="/" className="flex flex-col items-center justify-center flex-1 gap-1 text-[#D4A04D]">
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span className="text-[8px] font-black uppercase tracking-wider">HOME</span>
          </Link>

          {/* Wishlist */}
          <Link 
            to="/wishlist" 
            className="flex flex-col items-center justify-center flex-1 gap-1 text-gray-500 hover:text-[#D4A04D] transition-colors relative"
          >
            <div className="relative">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlist && wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4A04D] text-black font-extrabold text-[7px] w-3 h-3 rounded-full flex items-center justify-center border border-[#0B0B0C]">
                  {wishlist.length}
                </span>
              )}
            </div>
            <span className="text-[8px] font-bold uppercase tracking-wider">WISHLIST</span>
          </Link>

          {/* GET GOLD (Floating Center Action) */}
          <button 
            onClick={() => setIsGoldModalOpen(true)}
            className="flex-none mx-1 relative px-3 py-1.5 border border-[#D4A04D]/60 bg-gradient-to-b from-[#1c160e] to-[#0a0704] rounded-lg flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer min-w-[105px]"
          >
            <div className="absolute -top-1 px-1 bg-[#D4A04D] text-black text-[6px] font-black rounded tracking-wide uppercase leading-none py-0.5">
              GET GOLD
            </div>
            <div className="text-[#D4A04D] mt-1.5">
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
            <span className="text-[#D4A04D] text-[8px] font-black uppercase tracking-wider mt-0.5">GET GOLD</span>
            <span className="text-gray-500 text-[5px] font-semibold tracking-normal uppercase leading-none mt-0.5">Unlock Benefits</span>
          </button>

          {/* Orders */}
          <Link to="/orders" className="flex flex-col items-center justify-center flex-1 gap-1 text-gray-500 hover:text-[#D4A04D] transition-colors">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-[8px] font-bold uppercase tracking-wider">ORDERS</span>
          </Link>

          {/* Wallet */}
          <button 
            onClick={() => setIsWalletModalOpen(true)}
            className="flex flex-col items-center justify-center flex-1 gap-1 text-gray-500 hover:text-[#D4A04D] transition-colors bg-transparent border-none p-0 cursor-pointer"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className="text-[8px] font-bold uppercase tracking-wider">WALLET</span>
          </button>

        </nav>

      {/* Interactive overlays & modals */}

      {/* 1. AI Assistant Chat Drawer */}
      <AnimatePresence>
        {isAiDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Overlay */}
            <motion.div 
              onClick={() => setIsAiDrawerOpen(false)} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" 
            />
            
            {/* Drawer Panel */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-[#0E0E0E] h-full shadow-2xl border-l border-[#2A2A2D] flex flex-col z-10"
            >
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
              <button onClick={() => setIsAiDrawerOpen(false)} className="text-gray-400 hover:text-white p-2">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l18 18" />
                </svg>
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {messages.map((msg, i) => (
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
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#1C1C1E] border border-[#2A2A2D] rounded-2xl rounded-tl-none p-3 text-xs text-gray-400 flex items-center gap-1">
                    <span>AI is styling frames</span>
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce delay-100">.</span>
                    <span className="animate-bounce delay-200">.</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="p-2 bg-[#121212] border-t border-[#2A2A2D] overflow-x-auto flex gap-2 scrollbar-none whitespace-nowrap">
              {[
                'Which frames suit a round face?',
                'Are lenses included?',
                'Show current offers',
                'What is the delivery time?'
              ].map((prompt) => (
                <button 
                  key={prompt} 
                  onClick={() => { setInputVal(prompt) }}
                  className="bg-[#1C1C1E] border border-[#2B2B2C] text-gray-300 hover:border-[#D4A04D] text-[10px] px-3 py-1.5 rounded-full transition-colors font-medium shrink-0 cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-[#2A2A2D] bg-[#151515] flex gap-2 items-center">
              <input 
                type="text" 
                placeholder="Ask me anything..." 
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                className="flex-1 bg-[#1E1E1E] border border-[#2A2A2D] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4A04D]"
              />
              <button 
                onClick={handleSendChat}
                className="bg-[#D4A04D] text-black hover:bg-[#C8923E] p-3 rounded-xl transition-colors flex items-center justify-center font-bold"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>



      {/* 3. Find Your Perfect Fit (Size Guide) Modal */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsSizeGuideOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div className="relative bg-[#0E0E0E] border border-[#2A2A2D] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl z-10 animate-fade-in">
            {/* Header */}
            <div className="p-4 border-b border-[#2A2A2D] flex justify-between items-center bg-[#151515]">
              <h3 className="text-white text-sm font-bold">Frame Size Guide</h3>
              <button onClick={() => setIsSizeGuideOpen(false)} className="text-gray-400 hover:text-white p-1">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l18 18" />
                </svg>
              </button>
            </div>

            {/* Guide Body */}
            <div className="p-5 flex flex-col gap-4">
              <p className="text-xs text-gray-400">
                Finding the right frame size ensures maximum comfort and visual alignment. Compare your face width to find the perfect frame.
              </p>
              
              <div className="flex flex-col gap-2.5">
                {[
                  { size: 'Small (S)', face: '120mm - 129mm', frames: 'EG-2041 (S)', description: 'Ideal for narrower faces or teens' },
                  { size: 'Medium (M)', face: '130mm - 139mm', frames: 'EG-1067 / EG-2041', description: 'Universal size fits 80% of adults' },
                  { size: 'Large (L)', face: '140mm +', frames: 'Luxury Aviators', description: 'Ideal for wider face profiles' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-[#151515] border border-[#2A2A2D] p-3.5 rounded-xl flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <span className="text-[#D4A04D] text-xs font-bold">{item.size}</span>
                      <span className="text-gray-400 text-[10px]">{item.description}</span>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="text-white text-[11px] font-semibold">{item.face}</span>
                      <span className="text-gray-500 text-[9px] font-medium">Model: {item.frames}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Graphical representation */}
              <div className="bg-[#1C1C1E] border border-[#2A2A2D] p-3.5 rounded-xl flex flex-col items-center gap-3">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">How We Measure</span>
                <svg width="180" height="50" viewBox="0 0 100 30" fill="none" className="text-gray-500">
                  <path d="M5 15h12M83 15h12M17 10h66v10H17V10z" stroke="currentColor" strokeWidth="1" />
                  <path d="M17 15l3-3m-3 3l3 3M83 15l-3-3m3 3l-3 3" stroke="#D4A04D" strokeWidth="1" />
                  <text x="50" y="22" fill="#D4A04D" fontSize="6" textAnchor="middle" fontWeight="bold">Frame Width</text>
                </svg>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#151515] border-t border-[#2A2A2D] flex justify-end">
              <button 
                onClick={() => setIsSizeGuideOpen(false)} 
                className="px-5 py-2.5 bg-[#D4A04D] text-black font-semibold rounded-lg text-xs uppercase hover:bg-[#C8923E] transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Upload Prescription Modal */}
      {isPrescriptionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsPrescriptionOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div className="relative bg-[#0E0E0E] border border-[#2A2A2D] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl z-10 animate-fade-in">
            {/* Header */}
            <div className="p-4 border-b border-[#2A2A2D] flex justify-between items-center bg-[#151515]">
              <h3 className="text-white text-sm font-bold flex items-center gap-2">
                <span>📋</span>
                Upload Eye Prescription
              </h3>
              <button onClick={() => setIsPrescriptionOpen(false)} className="text-gray-400 hover:text-white p-1">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l18 18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col gap-4">
              {!uploadSuccess ? (
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-gray-400">
                    Upload your prescription file (PDF, JPG, or PNG) issued by your optometrist. Our lab technician will review it and custom-grind your lenses.
                  </p>
                  
                  {/* Dropzone container */}
                  <label className="border-2 border-dashed border-[#2A2A2D] hover:border-[#D4A04D]/50 bg-[#121212] rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors">
                    <input 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png" 
                      className="hidden" 
                      onChange={handlePrescUpload}
                      disabled={isUploading}
                    />
                    
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        {/* Spinner */}
                        <div className="w-8 h-8 border-2 border-t-[#D4A04D] border-[#2A2A2D] rounded-full animate-spin" />
                        <span className="text-[#D4A04D] text-[11px] font-bold">Scanning prescription details...</span>
                      </div>
                    ) : (
                      <>
                        <div className="text-[#D4A04D] text-3xl">📤</div>
                        <span className="text-white text-xs font-semibold mt-2">Select file from device</span>
                        <span className="text-gray-500 text-[10px]">Supports PDF, PNG, JPG up to 10MB</span>
                      </>
                    )}
                  </label>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                  <div className="w-14 h-14 bg-green-500/20 border border-green-500 rounded-full flex items-center justify-center text-green-500 text-2xl animate-scale-up">
                    ✓
                  </div>
                  <h4 className="text-white text-sm font-bold">Prescription Scanned Successfully!</h4>
                  <p className="text-gray-400 text-xs px-4">
                    Optician details locked in: <strong className="text-white">{(prescFile?.name) || 'rx_details.pdf'}</strong>. We have processed the spheres, cylinders, and AXIS variables.
                  </p>
                  
                  {/* Mock rx preview table */}
                  <div className="w-full bg-[#151515] border border-[#2A2A2D] rounded-xl p-3 mt-2 text-[10px] text-gray-300 grid grid-cols-4 gap-2">
                    <div className="font-bold text-gray-500">EYE</div>
                    <div className="font-bold text-gray-500">SPHERE</div>
                    <div className="font-bold text-gray-500">CYLINDER</div>
                    <div className="font-bold text-gray-500">AXIS</div>
                    
                    <div className="font-bold text-white">Right (OD)</div>
                    <div>-1.25</div>
                    <div>-0.50</div>
                    <div>180</div>
                    
                    <div className="font-bold text-white">Left (OS)</div>
                    <div>-1.75</div>
                    <div>-0.75</div>
                    <div>170</div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#151515] border-t border-[#2A2A2D] flex justify-end gap-3">
              <button 
                onClick={() => {
                  setPrescFile(null);
                  setUploadSuccess(false);
                  setIsPrescriptionOpen(false);
                }} 
                className="px-4 py-2 border border-[#2A2A2D] text-gray-400 hover:text-white rounded-lg text-xs font-semibold uppercase transition-colors"
              >
                Close
              </button>
              {uploadSuccess && (
                <button 
                  onClick={() => {
                    setIsPrescriptionOpen(false);
                    navigate('/products');
                  }} 
                  className="px-4 py-2 bg-[#D4A04D] text-black font-semibold rounded-lg text-xs uppercase hover:bg-[#C8923E] transition-colors"
                >
                  Continue Shopping
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Custom GET GOLD Membership Modal */}
      {isGoldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative bg-[#000000] w-full h-full md:h-[90vh] md:max-w-xl md:rounded-2xl border-none md:border md:border-[#D4A04D]/35 flex flex-col shadow-2xl overflow-hidden animate-fade-in text-white">
            
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-800/80 bg-[#0A0A0B] sticky top-0 z-10">
              <button 
                onClick={() => {
                  setIsGoldModalOpen(false);
                  setGoldError('');
                  setGoldSuccess(false);
                }} 
                className="text-gray-400 hover:text-white p-1 cursor-pointer bg-transparent border-none"
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex flex-col items-center">
                <span className="text-[#D4A04D] font-serif text-sm tracking-[0.25em] uppercase font-black leading-none">EYEGLAZE</span>
                <span className="text-[#D4A04D] text-[8px] font-black uppercase mt-1 tracking-[0.15em] leading-none">GOLD MEMBERSHIP</span>
              </div>
              
              <div className="flex items-center gap-1 border border-[#D4A04D] rounded px-1.5 py-0.5 bg-[#D4A04D]/10">
                <span className="text-[7px] font-black text-[#D4A04D] uppercase tracking-wider">BEST VALUE EVER</span>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 bg-[#000000] pb-24 scrollbar-none">
              
              {goldSuccess ? (
                /* Success screen */
                <div className="flex flex-col items-center justify-center py-10 text-center gap-4 animate-scale-up">
                  <div className="w-16 h-16 bg-[#D4A04D]/20 border border-[#D4A04D] rounded-full flex items-center justify-center text-[#D4A04D] text-3xl">
                    👑
                  </div>
                  <h3 className="text-white text-lg font-black uppercase tracking-wider">Congratulations!</h3>
                  <p className="text-gray-400 text-xs px-6">
                    You are now a premium <strong className="text-[#D4A04D]">EYEGLAZE GOLD MEMBER</strong>. Enjoy ₹1 frame exclusives, 1+1 free styling, priority support, and premium benefits!
                  </p>
                  
                  {user && (
                    <div className="bg-[#121213] border border-zinc-800 p-4 rounded-xl text-left w-full max-w-xs space-y-2 mt-2">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-500 font-bold uppercase">Member Name</span>
                        <span className="text-white font-bold">{user.name}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-500 font-bold uppercase">Status</span>
                        <span className="text-green-400 font-black uppercase">Active Gold</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-500 font-bold uppercase">Expires On</span>
                        <span className="text-white font-bold">
                          {user.membershipExpiry ? new Date(user.membershipExpiry as string | number | Date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '1 Year From Now'}
                        </span>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      setIsGoldModalOpen(false);
                      setGoldSuccess(false);
                    }}
                    className="mt-6 px-8 py-3 bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-xs uppercase rounded-xl tracking-wider transition-colors cursor-pointer border-none"
                  >
                    START SHOPPING
                  </button>
                </div>
              ) : (
                <>
                  {/* Gold Member Card Banner */}
                  <div className="bg-gradient-to-br from-[#1E1911] via-[#0D0C0A] to-[#050506] border border-[#D4A04D]/35 rounded-2xl p-5 relative overflow-hidden flex justify-between items-center shadow-lg">
                    <div className="flex flex-col gap-2 z-10 max-w-[65%]">
                      <h2 className="text-[#D4A04D] text-2xl font-black uppercase tracking-tight leading-none">₹1 = 1 FRAME</h2>
                      <div className="inline-block self-start bg-[#D4A04D] text-black text-[7px] font-black uppercase px-2 py-0.5 rounded tracking-widest mt-0.5">
                        GOLD MEMBERS EXCLUSIVE
                      </div>
                      
                      <div className="flex flex-col gap-1.5 mt-2">
                        {[
                          'Selected Frames Only',
                          'First Order Benefit',
                          'Premium Eyewear at Just ₹1'
                        ].map((pt) => (
                          <div key={pt} className="flex items-center gap-1.5">
                            <span className="text-[#D4A04D] text-xs">✓</span>
                            <span className="text-gray-300 text-[9px] font-bold uppercase tracking-wide">{pt}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Frame image and membership fee badge */}
                    <div className="flex flex-col items-end gap-3 z-10 relative">
                      <div className="w-24 h-14 relative flex items-center justify-center">
                        <img src="/images/cat_prescription.png" className="max-w-[85%] object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] rotate-[-5deg]" />
                        <img src="/images/cat_sunglasses.png" className="max-w-[85%] object-contain absolute top-4 left-2 drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] rotate-[10deg]" />
                      </div>
                      
                      <div className="w-16 h-16 bg-[#000000] border-2 border-[#D4A04D] rounded-full flex flex-col items-center justify-center text-center shadow-md">
                        <span className="text-[5px] text-gray-500 font-bold uppercase tracking-tighter leading-none">MEMBERSHIP</span>
                        <span className="text-[5px] text-gray-500 font-bold uppercase tracking-tighter leading-none">FEE ONLY</span>
                        <span className="text-[#D4A04D] text-xs font-black leading-none mt-0.5">₹129</span>
                        <span className="text-[5px] text-gray-400 font-medium leading-none">/ YEAR</span>
                      </div>
                    </div>
                  </div>

                  {/* Need 2 Frames Offer Block */}
                  <div className="bg-[#121213] border border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow">
                    <div className="flex items-center gap-3">
                      <div className="text-xl">🛒</div>
                      <div className="flex flex-col gap-0.5">
                        <h4 className="text-white text-[10px] font-black uppercase tracking-wider">NEED 2 FRAMES?</h4>
                        <p className="text-gray-400 text-[8px] leading-tight max-w-[180px]">
                          Get another frame for just ₹1 anytime before your membership expires.
                        </p>
                        <span className="text-[6px] text-gray-600 font-bold mt-0.5">⏱ Valid until your Gold Membership expiry date</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <div className="flex items-center gap-1 text-[9px] text-[#D4A04D] font-bold">
                        <span>👓 ₹1</span>
                        <span>+</span>
                        <span>👓 ₹1</span>
                        <span>=</span>
                        <span className="text-white">₹2</span>
                      </div>
                      <span className="text-gray-500 text-[6px] uppercase tracking-wider font-bold mt-0.5">TOTAL 2 FRAMES</span>
                    </div>
                  </div>

                  {/* Error Box */}
                  {goldError && (
                    <div className="bg-red-500/10 border border-red-500/30 p-3.5 rounded-xl text-red-400 text-[10px] leading-relaxed flex flex-col gap-2">
                      <div className="flex items-start gap-1.5">
                        <span>⚠️</span>
                        <span>{goldError}</span>
                      </div>
                      
                      {goldError.includes('Insufficient wallet balance') && (
                        <button 
                          onClick={handleQuickAddAndActivate}
                          className="self-start px-3 py-1.5 bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-[8px] uppercase rounded-lg tracking-wider transition-colors border-none cursor-pointer"
                        >
                          Add Wallet Money & Activate Now
                        </button>
                      )}
                    </div>
                  )}

                  {/* Benefits Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#D4A04D]">👑</span>
                      <h3 className="text-white text-xs font-black uppercase tracking-wider">EYEGLAZE GOLD MEMBERSHIP BENEFITS</h3>
                    </div>
                    <p className="text-gray-500 text-[8px] font-bold uppercase tracking-wider mt-[-6px]">Premium Benefits. Maximum Savings.</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { title: '₹1 PER FRAME', desc: 'Get 1 frame for just ₹1. Take another for just ₹1 anytime. (Total 2 Frames = ₹2)', icon: '👓' },
                        { title: '1+1 FREE FRAMES', desc: 'Buy 1 Get 1 Free on selected frames. Members Only.', icon: '➕' },
                        { title: '90% WALLET REFUND', desc: 'If you don\'t take the second frame, get 90% refund to wallet. Valid for 30 days.', icon: '💰' },
                        { title: '15% CASHBACK', desc: '15% cashback on selected frames. Members Only.', icon: '📉' },
                        { title: 'FREE EYE TEST', desc: 'Partner stores / camps to free eye checkup.', icon: '🩺' },
                        { title: 'PRIORITY SUPPORT', desc: 'Fast response and priority assistance for all your queries.', icon: '📞' }
                      ].map((benefit, idx) => (
                        <div key={idx} className="bg-[#121213] border border-zinc-800/60 p-3 rounded-xl flex flex-col gap-1 hover:border-[#D4A04D]/30 transition-all">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{benefit.icon}</span>
                            <span className="text-white text-[9px] font-black uppercase tracking-wider leading-none">{benefit.title}</span>
                          </div>
                          <p className="text-gray-400 text-[8px] leading-snug mt-1">{benefit.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contact Lens Section */}
                  <div className="border-t border-zinc-800/80 pt-5 space-y-4">
                    <div className="flex gap-4 bg-[#121213] border border-zinc-800/60 p-4 rounded-xl items-center">
                      <div className="w-16 h-16 shrink-0 bg-zinc-900 rounded-lg flex items-center justify-center">
                        <img src="/images/accessories.png" className="max-h-[90%] object-contain" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 className="text-[#D4A04D] text-[9px] font-black uppercase tracking-wider leading-none">CONTACT LENS EXCLUSIVE BENEFITS</h4>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8px] text-gray-300 font-semibold">
                          <div>• FREE LENS BOX</div>
                          <div>• FREE LENS SOLUTION</div>
                          <div>• 10% - 15% OFF</div>
                          <div>• FREE DELIVERY</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#121213] border border-zinc-800/60 p-3 rounded-xl flex flex-col gap-1">
                        <span className="text-yellow-500 text-xs">🏷️</span>
                        <h5 className="text-white text-[9px] font-black uppercase tracking-wider">EXCLUSIVE DEALS</h5>
                        <p className="text-gray-400 text-[8px] leading-relaxed">
                          Gold Members ki matrame special offers & early access to new launches.
                        </p>
                      </div>
                      <div className="bg-[#121213] border border-zinc-800/60 p-3 rounded-xl flex flex-col gap-1">
                        <span className="text-yellow-500 text-xs">🎁</span>
                        <h5 className="text-white text-[9px] font-black uppercase tracking-wider">MORE BENEFITS</h5>
                        <div className="space-y-0.5 text-[8px] text-gray-400 font-medium">
                          <div>✓ Exclusive Member Offers</div>
                          <div>✓ Birthday Special Coupon</div>
                          <div>✓ Early Access to Sales</div>
                          <div>✓ Special Gold Deals</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Savings Comparison Table */}
                  <div className="border-t border-zinc-800/80 pt-5 space-y-3">
                    <h3 className="text-white text-xs font-black uppercase tracking-wider text-center">HOW MUCH YOU SAVE EVERY YEAR</h3>
                    
                    <div className="bg-[#121213] border border-zinc-800 rounded-xl overflow-hidden text-[8px] text-gray-400">
                      <div className="grid grid-cols-3 bg-zinc-900 px-3 py-2 text-white font-bold">
                        <div>BENEFITS</div>
                        <div className="text-center">YOU SAVE</div>
                        <div className="text-right">ANNUAL VALUE</div>
                      </div>
                      {[
                        { name: '2 Frames for ₹2', save: '₹1,998', val: 'Up to ₹4,998' },
                        { name: '1+1 Free Frames', save: '₹1,998', val: 'Up to ₹1,998' },
                        { name: '15% Cashback', save: '₹1,000+', val: 'On selected frames' },
                        { name: 'Contact Lens Discount', save: '₹1,200+', val: 'Freebies included' },
                        { name: 'Free Eye Test', save: '₹500', val: 'At partner store' },
                        { name: 'Others & Exclusive', save: '₹500+', val: 'Special sales' }
                      ].map((item, idx) => (
                        <div key={idx} className="grid grid-cols-3 px-3 py-1.5 border-b border-zinc-800/40">
                          <div className="text-white font-semibold">{item.name}</div>
                          <div className="text-green-400 text-center font-bold">{item.save}</div>
                          <div className="text-gray-500 text-right">{item.val}</div>
                        </div>
                      ))}
                      <div className="grid grid-cols-3 bg-[#D4A04D]/10 px-3 py-2.5 text-white font-black border-t border-[#D4A04D]/20">
                        <div className="text-[#D4A04D]">TOTAL SAVINGS</div>
                        <div className="text-green-400 text-center text-[10px]">₹7,000+</div>
                        <div className="text-gray-400 text-right font-medium">Itni bachat, sirf ₹129 pe!</div>
                      </div>
                    </div>
                  </div>

                  {/* Safety icons */}
                  <div className="grid grid-cols-4 gap-2 pt-2 text-center text-[7px] text-gray-500 font-bold uppercase tracking-wider">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs">🪙</span>
                      <span>₹129/YEAR</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs">🛡️</span>
                      <span>100% SECURE</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs">🗓️</span>
                      <span>30-DAYS VALID</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs">⚡</span>
                      <span>AUTO APPLY</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Sticky Bottom Bar */}
            {!goldSuccess && (
              <div className="absolute bottom-0 left-0 right-0 bg-[#0A0A0B] border-t border-zinc-800/80 px-4 py-3 flex items-center justify-between z-10">
                {user?.membershipActive ? (
                  <div className="w-full bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-3 text-center text-xs font-bold flex items-center justify-center gap-1.5">
                    <span>👑</span>
                    <span>ACTIVE GOLD MEMBERSHIP UNTIL {user.membershipExpiry ? new Date(user.membershipExpiry as string | number | Date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '1 YEAR'}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col">
                      <span className="text-white text-xs font-black uppercase tracking-wider leading-none">JOIN GOLD MEMBERSHIP</span>
                      <span className="text-[#D4A04D] text-lg font-black leading-none mt-1">₹129 <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">/ Year Only</span></span>
                      <span className="text-gray-500 text-[7px] font-bold mt-0.5 leading-none uppercase">Unlock All Premium Benefits</span>
                    </div>

                    <button 
                      onClick={handleGoldArrowClick}
                      disabled={isActivatingGold}
                      className="w-12 h-12 rounded-full bg-[#D4A04D] hover:bg-[#C8923E] disabled:bg-gray-600 text-black flex items-center justify-center shadow-lg transition-transform active:scale-95 border-none cursor-pointer"
                    >
                      {isActivatingGold ? (
                        <div className="w-5 h-5 border-2 border-t-black border-zinc-800 rounded-full animate-spin" />
                      ) : (
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Custom WALLET Balance Modal */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsWalletModalOpen(false)} className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
          <div className="relative bg-gradient-to-br from-[#121213] to-[#0A0A0B] border border-zinc-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl z-10 animate-fade-in p-6 flex flex-col gap-5">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <span className="text-xl">💳</span>
                <div>
                  <h3 className="text-white text-sm font-black uppercase tracking-wider leading-none">EYEGLAZE WALLET</h3>
                  <span className="text-gray-500 text-[9px] font-bold uppercase mt-0.5 tracking-wider block">Manage Balance & Cashback</span>
                </div>
              </div>
              <button onClick={() => setIsWalletModalOpen(false)} className="text-gray-400 hover:text-white p-1">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l18 18" />
                </svg>
              </button>
            </div>
            <div className="bg-gradient-to-r from-[#1c1a16] via-[#101011] to-[#0d0d0e] border border-[#D4A04D]/25 rounded-2xl p-5 flex flex-col items-center justify-center gap-1 shadow-md">
              <span className="text-gray-500 text-[9px] font-black uppercase tracking-wider">AVAILABLE BALANCE</span>
              <span className="text-[#D4A04D] text-3xl font-black">₹{user ? (user.walletBalance ?? 0).toFixed(2) : '0.00'}</span>
              <span className="text-green-500 text-[8px] font-bold mt-1 uppercase tracking-wider">✓ 100% usable on next order</span>
            </div>
            <div className="space-y-3 text-left">
              <span className="text-gray-500 text-[9px] font-black uppercase tracking-wider block">RECENT ACTIVITY</span>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                {user && user.transactions && user.transactions.length > 0 ? (
                  user.transactions.slice().reverse().map((tx: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/40 text-xs">
                      <div className="flex flex-col">
                        <span className="text-white text-[10px] font-bold truncate max-w-[170px]">{tx.description}</span>
                        <span className="text-gray-500 text-[8px] font-semibold mt-0.5">
                          {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <span className={`font-extrabold text-[10px] ${tx.type === 'Paid' ? 'text-red-400' : 'text-green-400'}`}>
                        {tx.type === 'Paid' ? '-' : '+'}₹{tx.amount}
                      </span>
                    </div>
                  ))
                ) : (
                  <>
                    {[
                      { title: 'Sign-up Bonus Credit', date: 'Jun 18, 2026', amount: '+₹100', type: 'credit' },
                      { title: 'Referral Cashback Reward', date: 'Jun 15, 2026', amount: '+₹400', type: 'credit' }
                    ].map((tx, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/40 text-xs opacity-55">
                        <div className="flex flex-col">
                          <span className="text-white text-[10px] font-bold">{tx.title}</span>
                          <span className="text-gray-500 text-[8px] font-semibold mt-0.5">{tx.date}</span>
                        </div>
                        <span className="text-green-400 font-extrabold text-[10px]">{tx.amount}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => {
                  alert('Referrals are credited instantly! Share link with friends: https://web.eyeglaze.in/invite');
                }}
                className="bg-transparent border border-zinc-800 hover:border-white text-white font-extrabold text-[9px] py-2.5 rounded-xl transition-all cursor-pointer"
              >
                REFER & EARN
              </button>
              <button 
                onClick={() => setIsWalletModalOpen(false)}
                className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-[9px] py-2.5 rounded-xl transition-colors cursor-pointer border-none"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Custom NOTIFICATIONS Center Drawer Modal */}
      {isNotificationsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsNotificationsModalOpen(false)} className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
          <div className="relative bg-[#0E0E0E] border border-zinc-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl z-10 animate-fade-in p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800/60">
              <h3 className="text-white text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <span>🔔</span>
                Notifications
              </h3>
              <button onClick={() => setIsNotificationsModalOpen(false)} className="text-gray-400 hover:text-white p-1">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l18 18" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-2.5 text-left max-h-[300px] overflow-y-auto pr-1">
              {[
                { title: 'Order Shipped!', desc: 'Your order #EG-9901 has been dispatched via BlueDart.', time: '2 hours ago', icon: '📦' },
                { title: 'Home Eye Test Booked', desc: 'Optometrist visit scheduled for tomorrow at 2:00 PM.', time: '1 day ago', icon: '🩺' },
                { title: 'Gold Coupon Active', desc: 'Use code {offerSlides[0]?.code || "GLAZEBOGO"} to buy 1 get 1 free paired frames.', time: '2 days ago', icon: '🎫' }
              ].map((n, idx) => (
                <div key={idx} className="bg-zinc-900/60 border border-zinc-800/40 rounded-xl p-3 flex gap-3 items-start">
                  <span className="text-lg shrink-0 mt-0.5">{n.icon}</span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-white text-[10px] font-bold">{n.title}</span>
                    <span className="text-gray-400 text-[9.5px] leading-snug">{n.desc}</span>
                    <span className="text-gray-600 text-[8px] font-semibold mt-1">{n.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setIsNotificationsModalOpen(false)}
              className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-extrabold text-[10px] uppercase py-2.5 rounded-xl transition-all cursor-pointer"
            >
              Mark All as Read
            </button>
          </div>
        </div>
      )}

      {/* 8. Responsive Shape Selection Modal / Bottom Sheet */}
      {isShapeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0">
          <div 
            onClick={() => setIsShapeModalOpen(false)} 
            className="absolute inset-0 bg-black/85 backdrop-blur-sm" 
          />
          <div className="relative bg-[#121213] border-t border-zinc-800 w-full md:max-w-md rounded-t-2xl overflow-hidden shadow-2xl z-10 animate-slide-up p-6 flex flex-col gap-5 pb-8">
            
            {/* Mobile/Desktop Drag Indicator */}
            <div className="w-10 h-1 bg-zinc-800 rounded-full mx-auto mb-2" />

            <div className="flex justify-between items-center pb-2 border-b border-zinc-800/60">
              <h3 className="text-white text-base font-black uppercase tracking-wider">
                {shapeModalTitle}
              </h3>
              <button 
                onClick={() => setIsShapeModalOpen(false)} 
                className="text-gray-400 hover:text-white p-1 bg-transparent border-none cursor-pointer"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l18 18" />
                </svg>
              </button>
            </div>

            {/* Shape Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  name: 'Square',
                  slug: 'square',
                  svg: (
                    <svg className="w-16 h-8 text-gray-400 group-hover:text-[#D4A04D] transition-colors" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="15" y="5" width="24" height="20" rx="4" />
                      <rect x="61" y="5" width="24" height="20" rx="4" />
                      <path d="M39,15 L61,15 M15,13 L5,13 M85,13 L95,13" />
                    </svg>
                  )
                },
                {
                  name: 'Rectangle',
                  slug: 'rectangle',
                  svg: (
                    <svg className="w-16 h-8 text-gray-400 group-hover:text-[#D4A04D] transition-colors" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="12" y="7" width="30" height="16" rx="2" />
                      <rect x="58" y="7" width="30" height="16" rx="2" />
                      <path d="M42,13 L58,13 M12,13 L4,13 M88,13 L96,13" />
                    </svg>
                  )
                },
                {
                  name: 'Aviator',
                  slug: 'aviator',
                  svg: (
                    <svg className="w-16 h-8 text-gray-400 group-hover:text-[#D4A04D] transition-colors" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M15,9 C20,8 35,8 38,12 C40,18 35,24 27,24 C19,24 13,18 15,9 Z" />
                      <path d="M85,9 C80,8 65,8 62,12 C60,18 65,24 73,24 C81,24 87,18 85,9 Z" />
                      <path d="M38,11 L62,11 M36,8 L64,8 M15,12 L4,12 M85,12 L96,12" />
                    </svg>
                  )
                },
                {
                  name: 'Geometric',
                  slug: 'geometric',
                  svg: (
                    <svg className="w-16 h-8 text-gray-400 group-hover:text-[#D4A04D] transition-colors" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <polygon points="12,15 20,6 34,6 42,15 34,24 20,24" />
                      <polygon points="58,15 66,6 80,6 88,15 80,24 66,24" />
                      <path d="M42,13 L58,13 M12,13 L4,13 M88,13 L96,13" />
                    </svg>
                  )
                }
              ].map((shape) => (
                <div
                  key={shape.slug}
                  onClick={() => {
                    setIsShapeModalOpen(false);
                    const genderParam = shapeModalGender ? `&gender=${shapeModalGender}` : '';
                    navigate(`/products?category=${shapeModalCategory}&shape=${shape.slug}${genderParam}`);
                  }}
                  className="bg-[#18181A] border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-3 hover:border-[#D4A04D]/60 hover:shadow-[0_0_15px_rgba(212,160,77,0.08)] transition-all duration-300 group cursor-pointer"
                >
                  <div className="h-10 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                    {shape.svg}
                  </div>
                  <span className="text-white text-xs font-bold tracking-wider group-hover:text-[#D4A04D] transition-colors">
                    {shape.name}
                  </span>
                </div>
              ))}
            </div>

            {/* View All Shapes Button */}
            <button
              onClick={() => {
                setIsShapeModalOpen(false);
                const genderParam = shapeModalGender ? `&gender=${shapeModalGender}` : '';
                navigate(`/products?category=${shapeModalCategory}${genderParam}`);
              }}
              className="w-full mt-2 bg-transparent border border-zinc-800 hover:border-zinc-700 text-white font-extrabold text-[10px] uppercase py-3 rounded-xl tracking-wider transition-all cursor-pointer"
            >
              View All Shapes
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

      {/* Widescreen Showcase Modal Player */}
      {isShowcaseModalOpen && selectedShowcaseVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => {
              setIsShowcaseModalOpen(false);
              setSelectedShowcaseVideo(null);
            }} 
            className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer" 
          />
          <div className="relative bg-[#0E0E0E] border border-[#2A2A2D] w-full max-w-2xl aspect-video rounded-2xl overflow-hidden shadow-2xl z-10 animate-scale-up flex flex-col justify-between">
            {/* Header overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center z-20">
              <h3 className="text-white text-xs md:text-sm font-bold uppercase tracking-wider truncate max-w-[85%]">
                {selectedShowcaseVideo.title}
              </h3>
              <button 
                onClick={() => {
                  setIsShowcaseModalOpen(false);
                  setSelectedShowcaseVideo(null);
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
              {isDirectVideo(selectedShowcaseVideo.videoUrl) ? (
                <video
                  src={selectedShowcaseVideo.videoUrl}
                  className="w-full h-full object-contain"
                  autoPlay
                  controls
                  loop
                  playsInline
                />
              ) : (
                <iframe
                  title={selectedShowcaseVideo.title}
                  className="w-full h-full border-none"
                  src={`${getEmbedUrl(selectedShowcaseVideo.videoUrl)}?autoplay=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>

            {/* Description overlay */}
            {selectedShowcaseVideo.description && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent z-20 flex flex-col gap-1">
                <p className="text-gray-200 text-[10px] md:text-xs leading-relaxed font-semibold">
                  {selectedShowcaseVideo.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
