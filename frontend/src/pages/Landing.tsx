import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, cartCount } = useAuth();

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

  // Modal States
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Try On States
  const [selectedTryOnFrame, setSelectedTryOnFrame] = useState<'none' | 'square' | 'clubmaster' | 'aviator'>('none');

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

  // VIP Club Newsletter States
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setIsSubscribed(true);
    setTimeout(() => {
      setNewsletterEmail('');
      setIsSubscribed(false);
      alert('Thank you! You have successfully subscribed to the EyeGlaze VIP club. Check your inbox for your 15% discount code!');
    }, 1500);
  };

  // Featured Products Data
  const featuredProducts = [
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
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white flex flex-col font-sans pb-16 md:pb-0 w-full overflow-x-hidden">
      <SEO 
        title="Premium Eyewear & Custom Lenses"
        description="Experience luxury designer frames, custom prescription lenses, and blue light blocking glasses at EyeGlaze. Book a free home eye test today."
        keywords="eyeglaze, eye glaze, luxury glasses, home eye test, prescription eyeglasses, custom lenses, sunglasses"
      />
      
      {/* Top Header */}
      <header className="bg-[#0B0B0C]/95 backdrop-blur-md border-b border-[#2A2A2D] sticky top-0 z-40 w-full transition-colors duration-300">
        <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 h-16 flex items-center justify-between relative">
          
          {/* Left spacer/tagline (visible on desktop) */}
          <div className="hidden md:flex items-center gap-2 text-[9px] text-gray-500 tracking-widest uppercase font-semibold">
            <span>Free Shipping</span>
            <span className="w-1 h-1 bg-[#D4A04D] rounded-full" />
            <span>7-Day Returns</span>
          </div>
          
          {/* Hamburger Menu (visible on mobile) */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden text-[#D4A04D] hover:text-[#C8923E] p-1.5 focus:outline-none transition-colors cursor-pointer"
            aria-label="Open Menu"
          >
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Center: Logo with Gold Styling */}
          <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center select-none text-center">
            <span className="text-[#D4A04D] font-serif text-xl md:text-2xl tracking-[0.25em] uppercase font-bold leading-none">EYEGLAZE</span>
            <span className="text-[#D4A04D]/80 font-sans text-[8px] md:text-[9px] tracking-[0.4em] uppercase mt-0.5">EYEWEAR</span>
          </Link>

          {/* Right: Actions (Wishlist, Cart, Profile/Login) */}
          <div className="flex items-center gap-3.5 md:gap-6 z-10">
            {/* Search Icon */}
            <button 
              onClick={() => navigate('/products')} 
              className="text-gray-400 hover:text-[#D4A04D] transition-colors cursor-pointer"
              title="Search"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Notification Icon with Badge "3" */}
            <button 
              onClick={() => alert('You have 3 new notifications: 1. Your eye test is booked. 2. 50% Off sale is active. 3. New arrivals added!')}
              className="text-gray-400 hover:text-[#D4A04D] transition-colors relative cursor-pointer" 
              title="Notifications"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -top-1.5 -right-1.5 bg-[#D4A04D] text-black font-extrabold text-[8px] w-4 h-4 rounded-full flex items-center justify-center border border-[#0B0B0C]">
                3
              </span>
            </button>

            {/* Cart Icon with Badge */}
            <Link to="/cart" className="text-gray-400 hover:text-[#D4A04D] transition-colors relative cursor-pointer" title="Shopping Cart">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#D4A04D] text-black font-extrabold text-[8px] w-4 h-4 rounded-full flex items-center justify-center border border-[#0B0B0C]">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Profile / Login Button */}
            {user ? (
              <Link 
                to="/account" 
                className="hidden md:flex items-center gap-2 bg-[#131314] border border-[#2A2A2D] hover:border-[#D4A04D]/50 rounded-full py-1 px-2.5 transition-colors text-[10px] font-bold text-white cursor-pointer"
                title="Account"
              >
                <div className="w-4 h-4 bg-[#D4A04D] text-black font-extrabold rounded-full flex items-center justify-center text-[8px] uppercase">
                  {user.name ? user.name[0] : 'U'}
                </div>
                <span className="max-w-[80px] truncate">{user.name || 'Account'}</span>
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="hidden md:block bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-[9px] uppercase py-2 px-3.5 rounded-lg tracking-wider transition-colors cursor-pointer"
              >
                Login/Signup
              </Link>
            )}
          </div>
        </div>

        {/* Secondary Desktop Navbar - 100% View */}
        <div className="border-t border-[#1C1C1E] bg-[#0A0A0A]/60 hidden md:block w-full">
          <nav className="w-full px-4 sm:px-6 md:px-12 lg:px-16 flex justify-center gap-8 h-12 items-center text-xs tracking-[0.15em] uppercase font-bold">
            {[
              { href: '/', label: 'Home' },
              { href: '/categories', label: 'Categories' },
              { href: '/offers', label: 'Offers' },
              { href: '/about', label: 'About Us' },
              { href: '/blogs', label: 'Blogs' },
              { href: '/contact', label: 'Contact Us' },
            ].map(({ href, label }) => (
              <Link 
                key={label} 
                to={href} 
                className="text-gray-400 hover:text-[#D4A04D] hover:border-b-2 hover:border-[#D4A04D] h-full flex items-center transition-colors px-1"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Body - 100% View Layout */}
      <main className="w-full px-4 sm:px-6 md:px-12 lg:px-16 py-6 flex flex-col gap-10">
        
        {/* Hero Section - Full View */}
        <section className="relative bg-[#111] rounded-2xl overflow-hidden border border-[#2A2A2D] min-h-[260px] sm:min-h-[420px] md:min-h-[520px] flex items-center w-full">
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/55 to-transparent z-10" />
          
          {/* Hero text */}
          <div className="relative z-20 px-4 py-6 sm:px-6 md:px-12 max-w-[55%] md:max-w-lg flex flex-col items-start gap-2 sm:gap-4">
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
          <div className="absolute right-0 top-0 bottom-0 w-1/2 md:w-3/5 h-full">
            <img 
              src={slides[activeSlide].image} 
              alt="Premium Eyewear Model" 
              className="w-full h-full object-cover object-center transition-all duration-700 ease-in-out scale-100" 
            />
          </div>
        </section>

        {/* Feature Badges Strip - Full View */}
        <section className="border-y border-[#2A2A2D] py-4 bg-[#0E0E0E] w-full">
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
        </section>

        {/* Shop by Category - Full View */}
        <section className="flex flex-col gap-4 w-full">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white">Shop by Category</h2>
            <Link to="/categories" className="text-[#D4A04D] text-xs hover:underline flex items-center gap-1 font-semibold">
              View All <span>&gt;</span>
            </Link>
          </div>

          {/* Category List */}
          <div className="flex gap-2.5 overflow-x-auto pb-3 scrollbar-none snap-x md:grid md:grid-cols-5 md:overflow-visible w-full justify-between">
            {[
              { label: 'Prescription Glasses', img: '/images/cat_prescription.png', slug: 'prescription' },
              { label: 'Sunglasses', img: '/images/cat_sunglasses.png', slug: 'sunglasses' },
              { label: 'Blue Light Glasses', img: '/images/cat_blue_light.png', slug: 'blue_light' },
              { label: 'Contact Lenses', img: '/images/cat_contacts.png', slug: 'contact' },
              { label: 'Kids Eyewear', img: '/images/cat_kids.png', slug: 'kids' }
            ].map((cat) => (
              <Link 
                key={cat.slug} 
                to={`/products?category=${cat.slug}`}
                className="flex flex-col items-center gap-2 shrink-0 snap-start w-[68px] sm:w-[90px] md:w-auto group cursor-pointer"
              >
                <div className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] md:w-32 md:h-32 rounded-full overflow-hidden border border-[#2A2A2D] group-hover:border-[#D4A04D] transition-all duration-300 p-0.5 bg-gradient-to-b from-[#1E1E20] to-[#0D0D0E] flex items-center justify-center shadow-lg">
                  <img src={cat.img} alt={cat.label} className="w-[90%] h-[90%] object-cover rounded-full" />
                </div>
                <span className="text-[9px] sm:text-xs text-center font-bold text-gray-300 group-hover:text-[#D4A04D] transition-colors line-clamp-2 px-0.5 leading-tight">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

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

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {featuredProducts.map((product) => (
              <div 
                key={product.id}
                onClick={() => navigate('/products')}
                className="bg-[#121212] border border-[#2A2A2D] rounded-2xl overflow-hidden hover:border-[#D4A04D]/50 transition-all duration-300 group flex flex-col justify-between cursor-pointer"
              >
                
                {/* Image & Badge Container */}
                <div className="aspect-[4/3] bg-[#131314] p-4 relative flex items-center justify-center border-b border-[#2A2A2D]/40 overflow-hidden">
                  <span className="absolute top-3 left-3 bg-[#D4A04D] text-black text-[9px] font-bold py-1 px-2.5 rounded-full tracking-wider uppercase">
                    {product.badge}
                  </span>
                  
                  <img 
                    src={product.image} 
                    alt={product.name} 
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
                    <span className="text-[10px] text-[#D4A04D] font-bold uppercase tracking-wider">{product.category}</span>
                    <h3 className="text-white text-xs font-semibold group-hover:text-[#D4A04D] transition-colors line-clamp-1">{product.name}</h3>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2A2A2D]/40">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#D4A04D] text-sm font-bold">₹{product.salePrice}</span>
                      <span className="text-gray-600 text-[10px] line-through">₹{product.originalPrice}</span>
                    </div>

                    {/* Ratings */}
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500 text-xs">★</span>
                      <span className="text-white text-[10px] font-semibold">{product.rating}</span>
                      <span className="text-gray-600 text-[9px]">({product.reviews})</span>
                    </div>
                  </div>
                </div>

              </div>
            ))}
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
            <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 h-full min-h-[220px]">
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
                    className="w-full mt-1 bg-[#D4A04D] hover:bg-[#C8923E] text-black font-bold text-[10px] uppercase py-2 rounded-lg tracking-wider transition-colors"
                  >
                    {copiedCoupon === offerSlides[activeOfferSlide].code ? '✓ COPIED!' : 'COPY CODE'}
                  </button>
                </div>
              </div>
            </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
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
                className="bg-[#121212] border border-[#2A2A2D] rounded-2xl overflow-hidden group hover:border-[#D4A04D]/50 transition-all duration-300 flex flex-col"
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
        </section>

        {/* Split Section: Book Free Home Eye Test & Virtual Try-On */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full py-4 border-t border-[#1C1C1E]">
          {/* Left Column: Home Eye Test Form */}
          <div className="bg-[#121212] border border-[#2A2A2D] rounded-2xl p-6 md:p-8 flex flex-col gap-5 justify-between relative overflow-hidden group hover:border-[#D4A04D]/30 transition-colors">
            <div className="flex flex-col gap-2">
              <span className="text-[#D4A04D] text-[10px] font-extrabold tracking-widest uppercase">EYEGLAZE CLINIC @ HOME</span>
              <h3 className="text-white text-lg md:text-xl font-extrabold uppercase tracking-wide">Book Free Home Eye Test</h3>
              <p className="text-gray-400 text-xs leading-relaxed max-w-md">
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

          {/* Right Column: AI Try-On Promo */}
          <div className="bg-[#121212] border border-[#2A2A2D] rounded-2xl p-6 md:p-8 flex flex-col justify-between items-start gap-4 relative overflow-hidden group hover:border-[#D4A04D]/30 transition-colors">
            <div className="flex flex-col gap-2">
              <span className="text-[#D4A04D] text-[10px] font-extrabold tracking-widest uppercase">TRY BEFORE YOU BUY</span>
              <h3 className="text-white text-lg md:text-xl font-extrabold uppercase tracking-wide">3D Augmented Reality Try-On</h3>
              <p className="text-gray-400 text-xs leading-relaxed max-w-md">
                Want to see how you look instantly? Activate our interactive webcam simulated try-on overlay. Toggle between high-definition frames including Matte Squares, Clubmasters, and Luxury Aviators.
              </p>
            </div>

            <div className="flex items-center gap-4 w-full bg-[#131314] border border-[#2A2A2D] rounded-xl p-4 mt-2">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 font-bold border border-red-500/20 animate-pulse text-xl">
                📷
              </div>
              <div className="flex flex-col">
                <span className="text-white text-xs font-bold">Try 100+ Frames Instantly</span>
                <span className="text-gray-500 text-[10px] font-semibold">Webcam overlay calibration ready</span>
              </div>
            </div>

            <button
              onClick={() => setIsTryOnOpen(true)}
              className="mt-4 border border-[#D4A04D] text-[#D4A04D] hover:bg-[#D4A04D] hover:text-black font-extrabold text-[10px] uppercase py-3 px-6 rounded-lg tracking-wider transition-all duration-300 cursor-pointer"
            >
              LAUNCH VIRTUAL CAMERA
            </button>
          </div>
        </section>

        {/* Curated Premium Brands */}
        <section className="w-full py-4 border-t border-[#1C1C1E] flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white">Our Premium House Brands</h2>
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Handpicked luxury houses & smart aesthetics</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: 'VINCENT CHASE', tag: 'Trendsetting Acetates' },
              { name: 'JOHN JACOBS', tag: 'Italian Handcraft' },
              { name: 'EYEGLAZE AIR', tag: 'Ultralight Titanium' },
              { name: 'HOOPER KIDS', tag: 'Flexible & Resilient' },
              { name: 'CLUBMASTER LUXE', tag: 'Professional Prestige' }
            ].map((brand, idx) => (
              <div
                key={idx}
                className="bg-[#121212] border border-[#2A2A2D] rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-[#D4A04D]/30 transition-all duration-300 group cursor-default"
              >
                <span className="text-white text-xs md:text-sm font-serif font-bold tracking-[0.2em] group-hover:text-[#D4A04D] transition-colors">
                  {brand.name}
                </span>
                <span className="text-gray-600 text-[8px] tracking-wider uppercase font-semibold mt-1">
                  {brand.tag}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Collapsible FAQ Section */}
        <section className="w-full py-4 border-t border-[#1C1C1E] flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white">Frequently Asked Questions</h2>
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Everything you need to know about buying glasses online</span>
          </div>

          <div className="flex flex-col gap-3 max-w-3xl w-full">
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
        </section>

        {/* Newsletter / VIP Club Section */}
        <section className="w-full py-8 border-t border-[#1C1C1E]">
          <div className="bg-[#121212] border border-[#2A2A2D] rounded-2xl p-6 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-6 w-full relative overflow-hidden">
            <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-[#D4A04D]/5 to-transparent pointer-events-none" />
            
            <div className="flex flex-col gap-2 max-w-xl z-10">
              <span className="text-[#D4A04D] text-[10px] font-extrabold tracking-widest uppercase">JOIN THE COVENANT</span>
              <h3 className="text-white text-lg md:text-2xl font-extrabold uppercase tracking-wide">Subscribe to EyeGlaze VIP</h3>
              <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                Be the first to receive premium collection drops, exclusive VIP coupon discounts, and complimentary shape consultations. Plus, get 15% OFF your first order!
              </p>
            </div>

            {isSubscribed ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 text-xs font-bold animate-scale-up z-10 sm:w-[320px] text-center shrink-0">
                ✓ YOU ARE ON THE VIP LIST! CHECK YOUR INBOX.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0 z-10">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="bg-[#131314] border border-[#2A2A2D] focus:border-[#D4A04D] text-xs text-white rounded-xl px-4 py-3 sm:w-[280px] focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-[10px] uppercase py-3 px-6 rounded-xl tracking-wider transition-colors shrink-0 cursor-pointer"
                >
                  JOIN THE CLUB
                </button>
              </form>
            )}
          </div>
        </section>

      </main>



      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/95 border-t border-[#2A2A2D] h-16 z-30 flex items-center justify-around md:hidden px-2 backdrop-blur-md">
        
        {/* Home */}
        <Link to="/" className="flex flex-col items-center gap-1 text-[#D4A04D]">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider">Home</span>
        </Link>

        {/* Categories */}
        <Link to="/categories" className="flex flex-col items-center gap-1 text-gray-500 hover:text-[#D4A04D] transition-colors">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
          <span className="text-[9px] font-semibold uppercase tracking-wider">Categories</span>
        </Link>

        {/* Wishlist */}
        <Link to="/wishlist" className="flex flex-col items-center gap-1 text-gray-500 hover:text-[#D4A04D] transition-colors">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-[9px] font-semibold uppercase tracking-wider">Wishlist</span>
        </Link>

        {/* Orders */}
        <Link to="/orders" className="flex flex-col items-center gap-1 text-gray-500 hover:text-[#D4A04D] transition-colors">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className="text-[9px] font-semibold uppercase tracking-wider">Orders</span>
        </Link>

        {/* Account */}
        <Link to="/account" className="flex flex-col items-center gap-1 text-gray-500 hover:text-[#D4A04D] transition-colors">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[9px] font-semibold uppercase tracking-wider">Account</span>
        </Link>

      </nav>

      {/* Mobile Menu Sidebar Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-start md:hidden">
          {/* Overlay */}
          <div onClick={() => setIsMobileMenuOpen(false)} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
          
          {/* Sidebar Panel */}
          <div className="relative w-64 bg-[#0E0E0E] h-full shadow-2xl border-r border-[#2A2A2D] flex flex-col z-50 animate-fade-in p-6">
            <div className="flex items-center justify-between mb-8">
              <Link to="/" className="flex flex-col select-none" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="text-[#D4A04D] font-serif text-lg tracking-[0.2em] uppercase font-bold">EYEGLAZE</span>
                <span className="text-[#D4A04D]/80 font-sans text-[7px] tracking-[0.3em] uppercase mt-0.5">EYEWEAR</span>
              </Link>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l18 18" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col gap-6 text-sm tracking-[0.15em] uppercase font-bold">
              {[
                { href: '/', label: 'Home' },
                { href: '/categories', label: 'Categories' },
                { href: '/offers', label: 'Offers' },
                { href: '/about', label: 'About Us' },
                { href: '/blogs', label: 'Blogs' },
                { href: '/contact', label: 'Contact Us' },
              ].map(({ href, label }) => (
                <Link 
                  key={label} 
                  to={href} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-400 hover:text-[#D4A04D] transition-colors py-1 border-b border-[#1A1A1C]"
                >
                  {label}
                </Link>
              ))}
            </nav>
            
            {/* Account info in Drawer */}
            <div className="mt-auto pt-6 border-t border-[#1C1C1E] flex flex-col gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#D4A04D] text-black font-extrabold rounded-full flex items-center justify-center text-xs uppercase">
                    {user.name ? user.name[0] : 'U'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white text-xs font-bold truncate max-w-[120px]">{user.name}</span>
                    <Link to="/account" onClick={() => setIsMobileMenuOpen(false)} className="text-[#D4A04D] text-[10px] font-semibold hover:underline">View Account</Link>
                  </div>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-xs uppercase py-3 rounded-lg tracking-wider transition-colors"
                >
                  Login / Signup
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive overlays & modals */}

      {/* 1. AI Assistant Chat Drawer */}
      {isAiDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div onClick={() => setIsAiDrawerOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-[#0E0E0E] h-full shadow-2xl border-l border-[#2A2A2D] flex flex-col z-10 animate-slide-in">
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
          </div>
        </div>
      )}

      {/* 2. Virtual Try-On Modal */}
      {isTryOnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsTryOnOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div className="relative bg-[#0E0E0E] border border-[#2A2A2D] w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col z-10 animate-fade-in">
            {/* Header */}
            <div className="p-4 border-b border-[#2A2A2D] flex justify-between items-center bg-[#151515]">
              <div>
                <h3 className="text-white text-sm font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
                  Virtual Try-On Cam
                </h3>
                <span className="text-[10px] text-gray-500">Overlay luxury frames in real-time</span>
              </div>
              <button onClick={() => setIsTryOnOpen(false)} className="text-gray-400 hover:text-white p-1">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l18 18" />
                </svg>
              </button>
            </div>

            {/* Webcam simulation view */}
            <div className="aspect-[4/3] bg-[#000] relative flex items-center justify-center overflow-hidden border-b border-[#2A2A2D]">
              
              {/* Webcam Simulated Feed (using our model image) */}
              <img 
                src="/images/hero_model.png" 
                alt="Try On Face" 
                className="w-full h-full object-cover filter brightness-95 contrast-105" 
              />

              {/* Dynamic Frame Overlay */}
              {selectedTryOnFrame === 'square' && (
                <svg className="absolute w-[44%] h-auto top-[28%] left-[28.5%] text-black drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transition-all duration-300" viewBox="0 0 100 30" fill="none">
                  {/* Square Frame */}
                  <rect x="15" y="5" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="2.5" fill="none" />
                  <rect x="57" y="5" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="2.5" fill="none" />
                  <path d="M43 15h14M15 12C10 12 5 10 2 10M85 12C90 12 95 10 98 10" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}

              {selectedTryOnFrame === 'clubmaster' && (
                <svg className="absolute w-[45%] h-auto top-[27.5%] left-[28%] text-black drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transition-all duration-300" viewBox="0 0 100 30" fill="none">
                  {/* Clubmaster style */}
                  <path d="M15 5h28v6c0 6-5 11-14 11s-14-5-14-11V5z" stroke="#D4A04D" strokeWidth="1.5" />
                  <path d="M15 5c0 0 8-1.5 28 0v4H15V5z" fill="currentColor" />
                  <path d="M57 5h28v6c0 6-5 11-14 11s-14-5-14-11V5z" stroke="#D4A04D" strokeWidth="1.5" />
                  <path d="M57 5c0 0 8-1.5 28 0v4H57V5z" fill="currentColor" />
                  <path d="M43 9h14M15 8c-5-2-10-1-13-1M85 8c5-2 10-1 13-1" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}

              {selectedTryOnFrame === 'aviator' && (
                <svg className="absolute w-[46%] h-auto top-[28%] left-[27.5%] text-[#D4A04D] drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transition-all duration-300" viewBox="0 0 100 30" fill="none">
                  {/* Aviator shape */}
                  <path d="M12 5c12-1 28-1 30 10 0 8-8 12-15 12s-15-4-15-12c0-8 12-9 0-10z" stroke="currentColor" strokeWidth="1.5" fill="black" fillOpacity="0.4" />
                  <path d="M88 5c-12-1-28-1-30 10 0 8 8 12 15 12s-15-4-15-12c0-8-12-9 0-10z" stroke="currentColor" strokeWidth="1.5" fill="black" fillOpacity="0.4" />
                  <path d="M42 8h16M41 12h18M12 7c-4 0-8-1-10-1M88 7c4 0 8-1 10-1" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              )}

              {/* Try on watermark / helper */}
              <div className="absolute bottom-4 left-4 bg-black/70 border border-[#2A2A2D] px-3 py-1.5 rounded text-[10px] text-gray-300 flex items-center gap-1.5 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Webcam active
              </div>
            </div>

            {/* Selection bar */}
            <div className="p-4 bg-[#111]">
              <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block mb-2 text-center">Select Frame Styles</span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'none', name: 'Original face' },
                  { id: 'square', name: 'EG-2041 Matte' },
                  { id: 'clubmaster', name: 'EG-1067 Club' },
                  { id: 'aviator', name: 'Luxury Aviator' }
                ].map((frame) => (
                  <button 
                    key={frame.id}
                    onClick={() => setSelectedTryOnFrame(frame.id as any)}
                    className={`text-[10px] font-semibold p-2 border rounded-lg transition-all duration-300 ${
                      selectedTryOnFrame === frame.id 
                        ? 'border-[#D4A04D] text-[#D4A04D] bg-[#1e1a14]' 
                        : 'border-[#2A2A2D] text-gray-400 hover:text-white bg-[#151515]'
                    }`}
                  >
                    {frame.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom bar */}
            <div className="p-4 bg-[#151515] border-t border-[#2A2A2D] flex justify-end gap-3">
              <button 
                onClick={() => setIsTryOnOpen(false)} 
                className="px-4 py-2 border border-[#2A2A2D] text-gray-400 hover:text-white rounded-lg text-xs font-semibold uppercase transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setIsTryOnOpen(false);
                  navigate('/products');
                }} 
                className="px-4 py-2 bg-[#D4A04D] text-black font-semibold rounded-lg text-xs uppercase hover:bg-[#C8923E] transition-colors"
              >
                View Catalog
              </button>
            </div>
          </div>
        </div>
      )}

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

    </div>
  );
}
