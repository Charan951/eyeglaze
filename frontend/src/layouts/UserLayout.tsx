import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation, Navigate, useLoaderData } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import BrandIcon from '../components/BrandIcon';
import api from '../lib/api';
import { socket } from '../lib/socket';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserLayout() {
  const { user, cartCount, wishlist, logout, checkAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { products: initialProducts, categories: initialCategories } = useLoaderData() as { products: any[]; categories: any[] };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>(initialCategories || []);
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>(initialProducts || []);

  useEffect(() => {
    if (initialProducts) setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    if (initialCategories) setCategories(initialCategories);
  }, [initialCategories]);

  const hoverTimeoutRef = useRef<any>(null);

  // Geolocation and Geocoding states
  const [activeLocation, setActiveLocation] = useState<{ short: string; full: string } | null>(null);
  const [isLocationDrawerOpen, setIsLocationDrawerOpen] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');

  // Scroll hide bottom navigation state
  const [isBottomBarVisible, setIsBottomBarVisible] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Gold Membership global states
  const [isGoldDrawerOpen, setIsGoldDrawerOpen] = useState(false);
  const [isProcessingGold, setIsProcessingGold] = useState(false);
  const [goldError, setGoldError] = useState('');
  const [goldSuccess, setGoldSuccess] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/' } } });
      setIsGoldDrawerOpen(false);
      return;
    }

    setIsProcessingGold(true);
    setGoldError('');
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setGoldError('Failed to load payment gateway. Please try again.');
        setIsProcessingGold(false);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_STX1H1R9XvVjSZ',
        amount: 12900, // ₹129 in paise
        currency: 'INR',
        name: 'EyeGlaze',
        description: 'Gold Membership Upgrade',
        handler: async (_response: any) => {
          try {
            const res = await api.post('/auth/membership/activate', { paymentMethod: 'razorpay' });
            if (res.data.success) {
              setGoldSuccess(true);
              await checkAuth();
            }
          } catch (err: any) {
            setGoldError(err.response?.data?.error || 'Failed to activate membership.');
          } finally {
            setIsProcessingGold(false);
          }
        },
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || user.mobile || '',
        },
        theme: {
          color: '#D4A04D',
        },
        modal: {
          ondismiss: function () {
            setIsProcessingGold(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Razorpay error:', error);
      setGoldError('Payment processing error occurred.');
      setIsProcessingGold(false);
    }
  };

  // Chatbot states
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hello! Welcome to EyeGlaze. I am your AI assistant. How can I help you choose the perfect frames today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [currentProduct, setCurrentProduct] = useState<any>(null);

  // Track active product context on product page
  useEffect(() => {
    const match = location.pathname.match(/\/products\/([a-f\d]{24})/i);
    if (match) {
      const productId = match[1];
      api.get(`/products/${productId}`)
        .then((res) => {
          setCurrentProduct(res.data.product || res.data);
        })
        .catch((err) => {
          console.error('[UserLayout] Failed to load active product context:', err);
          setCurrentProduct(null);
        });
    } else {
      setCurrentProduct(null);
    }
  }, [location.pathname]);

  const getPageContext = () => {
    const pathname = location.pathname;
    let pageName = 'General';
    let details: any = null;

    if (pathname === '/') {
      pageName = 'Home Page';
    } else if (pathname === '/membership') {
      pageName = 'Gold Membership';
    } else if (pathname === '/cart') {
      pageName = 'Shopping Cart';
    } else if (pathname === '/contact' || pathname === '/support/contact') {
      pageName = 'Support and Contact';
    } else if (pathname === '/products') {
      pageName = 'Products List';
    } else if (pathname.startsWith('/products/')) {
      pageName = 'Product Detail';
      details = currentProduct;
    } else if (pathname === '/wishlist') {
      pageName = 'Wishlist';
    } else if (pathname === '/orders') {
      pageName = 'Orders';
    } else if (pathname === '/profile') {
      pageName = 'Profile';
    }

    return { pageName, pathname, details };
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isAiTyping]);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();

    // Add user message immediately
    const updatedHistory = [...chatMessages, { sender: 'user', text: userMsg }];
    setChatMessages(updatedHistory);
    setChatInput('');
    setIsAiTyping(true);

    try {
      const backendHistory = chatMessages.map(msg => ({
        sender: msg.sender as 'user' | 'bot',
        text: msg.text
      }));

      const pageContext = getPageContext();

      const response = await api.post('/ai/chat', {
        message: userMsg,
        history: backendHistory,
        pageContext
      });

      const botResponse = response.data.reply;
      setChatMessages((prev) => [...prev, { sender: 'bot', text: botResponse }]);
    } catch (error) {
      console.error('[UserLayout Chatbot] Error generating response:', error);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'I am experiencing connection issues. How else can I help you choose the perfect frames?'
        }
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };


  // Location Geocoding Detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const googleKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
          let addressText = '';
          let city = '';

          if (googleKey) {
            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleKey}`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              addressText = data.results[0].formatted_address;
              const cityComp = data.results[0].address_components.find((c: any) =>
                c.types.includes('locality') || c.types.includes('administrative_area_level_2')
              );
              city = cityComp ? cityComp.long_name : 'Detected Location';
            }
          }

          if (!addressText) {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            if (data && data.address) {
              const addr = data.address;
              city = addr.city || addr.town || addr.village || addr.suburb || 'Hyderabad';
              const parts = [
                addr.house_number,
                addr.road,
                addr.neighbourhood,
                addr.suburb,
                city,
                addr.state,
                addr.postcode,
                addr.country
              ].filter(Boolean);
              addressText = parts.join(', ');
            }
          }

          if (addressText) {
            const isHydOrTS = addressText.includes('500081') || addressText.toLowerCase().includes('hyderabad');
            const stateCode = isHydOrTS ? 'TS' : '';
            const shortLoc = `${city}${stateCode ? ', ' + stateCode : ''}`;
            const locationData = {
              short: shortLoc,
              full: addressText
            };
            setActiveLocation(locationData);
            localStorage.setItem('user_location', JSON.stringify(locationData));
          } else {
            alert('Could not resolve location.');
          }
        } catch (err) {
          console.error('Location geocoding error:', err);
          alert('Failed to resolve location details.');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Location error:', error);
        alert('Could not fetch location. Please check permissions.');
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Check saved location and detect on mount if permission already granted
  useEffect(() => {
    const saved = localStorage.getItem('user_location');
    if (saved) {
      try {
        setActiveLocation(JSON.parse(saved));
      } catch (e) {
        // Ignore
      }
    } else {
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
          if (result.state === 'granted') {
            handleDetectLocation();
          }
        });
      }
    }
  }, []);

  // Scroll listener for bottom bar and header hiding
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (Math.abs(currentScrollY - lastScrollY.current) < 10) return;
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsBottomBarVisible(false);
        setIsHeaderVisible(false);
      } else {
        setIsBottomBarVisible(true);
        setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const mockSuggestions = [
    { short: 'Madhapur, Hyderabad', full: 't hub, 3F-005, Silpa Gram Craft Village, Madhapur, Hyderabad, Telangana 500081, India' },
    { short: 'Koramangala, Bengaluru', full: 'Koramangala 4th Block, Bengaluru, Karnataka 560034, India' },
    { short: 'Connaught Place, New Delhi', full: 'Radial Road 4, Connaught Place, New Delhi, Delhi 110001, India' },
    { short: 'Gachibowli, Hyderabad', full: 'DLF Cyber City, Gachibowli, Hyderabad, Telangana 500032, India' },
    { short: 'Jubilee Hills, Hyderabad', full: 'Road No 36, Jubilee Hills, Hyderabad, Telangana 500033, India' },
    { short: 'Indiranagar, Bengaluru', full: '100 Feet Rd, Indiranagar, Bengaluru, Karnataka 560038, India' }
  ];

  const filteredSuggestions = locationSearchQuery.trim()
    ? mockSuggestions.filter(s =>
      s.short.toLowerCase().includes(locationSearchQuery.toLowerCase()) ||
      s.full.toLowerCase().includes(locationSearchQuery.toLowerCase())
    )
    : [];

  // Setup product change socket listener
  useEffect(() => {
    const fetchProductsForPrices = async () => {
      try {
        const res = await api.get('/products?limit=1000');
        setProducts(res.data.products || []);
      } catch (err) {
        console.error('Failed to fetch products for navbar pricing:', err);
      }
    };

    const handleProductChange = () => {
      fetchProductsForPrices();
    };

    socket.on('product_changed', handleProductChange);
    return () => {
      socket.off('product_changed', handleProductChange);
    };
  }, []);

  const getDynamicCategoryPrice = (categorySlug: string, fallbackPrice: number) => {
    const matchingProds = products.filter(p => {
      const pCat = (p.category || '').toLowerCase();
      const pCats = (p.categories || []).map((c: any) => String(c).toLowerCase());
      return pCat === categorySlug.toLowerCase() || pCats.includes(categorySlug.toLowerCase());
    });

    if (matchingProds.length === 0) return `Starts at ₹${fallbackPrice}`;

    const minPrice = Math.min(...matchingProds.map(p => p.price?.selling || p.sellingPrice || fallbackPrice));
    return `Starts at ₹${minPrice}`;
  };

  const getDynamicProducts = (
    categorySlug: string,
    genderVal: string | null,
    options?: {
      subCategory?: string;
      fallbackItems?: Array<{ label: string; price: string; to: string; image?: string; isDynamic?: boolean; badge?: string }>;
    }
  ) => {
    // Normalize category slug
    const normalizedCats = [categorySlug.toLowerCase()];
    if (categorySlug.toLowerCase() === 'prescription' || categorySlug.toLowerCase() === 'eyeglasses') {
      normalizedCats.push('prescription', 'eyeglasses');
    } else if (categorySlug.toLowerCase() === 'blue_light' || categorySlug.toLowerCase() === 'computer-glasses') {
      normalizedCats.push('blue_light', 'computer-glasses');
    } else if (categorySlug.toLowerCase() === 'contact-lenses' || categorySlug.toLowerCase() === 'contact_lenses' || categorySlug.toLowerCase() === 'contact') {
      normalizedCats.push('contact-lenses', 'contact_lenses', 'contact');
    } else if (categorySlug.toLowerCase() === 'power-sunglasses') {
      normalizedCats.push('power-sunglasses');
    } else if (categorySlug.toLowerCase() === 'reading-glasses') {
      normalizedCats.push('reading-glasses');
    }

    const matchingProds = products.filter(p => {
      // 1. check category
      const pCat = (p.category || '').toLowerCase();
      const pCats = (p.categories || []).map((c: any) => String(c).toLowerCase());
      const catMatch = normalizedCats.includes(pCat) || pCats.some((c: string) => normalizedCats.includes(c));
      if (!catMatch) return false;

      // 2. check gender
      if (genderVal && genderVal !== 'all') {
        let genderMatch = false;
        if (p.gender) {
          if (Array.isArray(p.gender)) {
            genderMatch = p.gender.some((g: string) => g.toLowerCase() === genderVal.toLowerCase());
          } else {
            genderMatch = p.gender.toLowerCase() === genderVal.toLowerCase();
          }
        }
        if (!genderMatch) return false;
      }

      // 3. check subcategory (if any)
      if (options?.subCategory) {
        const pSub = (p.subCategory || '').toLowerCase();
        const pSubMatch = pSub === options.subCategory.toLowerCase() ||
          p.name.toLowerCase().includes(options.subCategory.toLowerCase()) ||
          p.sku.toLowerCase().includes(options.subCategory.toLowerCase());
        if (!pSubMatch) return false;
      }

      return true;
    });

    if (matchingProds.length > 0) {
      // Sort: Bestseller first, then higher rating, then higher price
      const sortedProds = [...matchingProds].sort((a, b) => {
        if (a.isBestseller && !b.isBestseller) return -1;
        if (!a.isBestseller && b.isBestseller) return 1;
        const rA = a.rating || 0;
        const rB = b.rating || 0;
        if (rA !== rB) return rB - rA;
        const pA = a.price?.selling || a.sellingPrice || 0;
        const pB = b.price?.selling || b.sellingPrice || 0;
        return pB - pA;
      });

      return sortedProds.slice(0, 3).map(p => {
        const price = p.price?.selling || p.sellingPrice;
        const image = p.thumbnail || (p.images && p.images[0]) || '/images/cat_prescription.png';
        return {
          id: p._id,
          label: p.name,
          price: `₹${price}`,
          to: `/products/${p._id}`,
          image: image,
          isDynamic: true,
          badge: p.isBestseller ? 'Bestseller' : p.rating >= 4.7 ? 'Top Rated' : undefined
        };
      });
    }

    // Fall back to fallbackItems or construct default items
    if (options?.fallbackItems) {
      return options.fallbackItems;
    }

    // Default fallbacks if nothing provided
    const fallbackMap: Record<string, Array<{ label: string; price: string; to: string; image?: string; isDynamic?: boolean; badge?: string }>> = {
      men: [
        { label: 'EyeGlaze Men\'s Classic', price: 'Starts at ₹999', to: `/products?category=${categorySlug}&gender=men`, image: '/images/men_eyeglasses.png', isDynamic: false },
        { label: 'Vincent Chase Aviator', price: 'Starts at ₹1499', to: `/products?category=${categorySlug}&gender=men`, image: '/images/men_eyeglasses.png', isDynamic: false },
        { label: 'John Jacobs Premium', price: 'Starts at ₹1999', to: `/products?category=${categorySlug}&gender=men`, image: '/images/men_eyeglasses.png', isDynamic: false }
      ],
      women: [
        { label: 'EyeGlaze Women\'s Classic', price: 'Starts at ₹999', to: `/products?category=${categorySlug}&gender=women`, image: '/images/women_eyeglasses.png', isDynamic: false },
        { label: 'Vincent Chase Cat Eye', price: 'Starts at ₹1399', to: `/products?category=${categorySlug}&gender=women`, image: '/images/women_eyeglasses.png', isDynamic: false },
        { label: 'John Jacobs Designer', price: 'Starts at ₹1999', to: `/products?category=${categorySlug}&gender=women`, image: '/images/women_eyeglasses.png', isDynamic: false }
      ],
      kids: [
        { label: 'Juniors Eyeglasses (5-8 yrs)', price: 'Starts at ₹800', to: `/products?category=${categorySlug}&gender=kids&size=Small`, image: '/images/kids_eyeglasses.png', isDynamic: false },
        { label: 'Tweens Eyeglasses (8-12 yrs)', price: 'Starts at ₹900', to: `/products?category=${categorySlug}&gender=kids&size=Medium`, image: '/images/kids_eyeglasses.png', isDynamic: false },
        { label: 'Teens Eyeglasses (12-17 yrs)', price: 'Starts at ₹1500', to: `/products?category=${categorySlug}&gender=kids&size=Large`, image: '/images/kids_eyeglasses.png', isDynamic: false }
      ]
    };

    return fallbackMap[genderVal || 'men'] || fallbackMap['men'];
  };

  // Setup category socket listener
  useEffect(() => {
    let active = true;
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories/tree');
        if (!active) return;
        setCategories(res.data.tree || []);
      } catch (err) {
        console.error('Failed to fetch navbar categories:', err);
      }
    };

    const handleCategoryChange = () => {
      fetchCategories();
    };

    socket.on('category_changed', handleCategoryChange);

    return () => {
      active = false;
      socket.off('category_changed', handleCategoryChange);
    };
  }, []);

  const handleMouseEnter = (menuId: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setActiveHover(menuId);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveHover(null);
    }, 200);
  };

  const handleMegaMenuMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handleMegaMenuMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveHover(null);
    }, 200);
  };

  const getDynamicGroupData = (
    categorySlug: string,
    genderVal: string,
    filterOptions: {
      brands?: string[];
      size?: string;
      fallbackPrice: number;
      label: string;
      to: string;
      fallbackImage: string;
    }
  ) => {
    const normalizedCats = [categorySlug.toLowerCase()];
    if (categorySlug.toLowerCase() === 'prescription' || categorySlug.toLowerCase() === 'eyeglasses') {
      normalizedCats.push('prescription', 'eyeglasses');
    } else if (categorySlug.toLowerCase() === 'sunglasses') {
      normalizedCats.push('sunglasses');
    }

    const matching = products.filter(p => {
      const pCat = (p.category || '').toLowerCase();
      const pCats = (p.categories || []).map((c: any) => String(c).toLowerCase());
      const catMatch = normalizedCats.includes(pCat) || pCats.some((c: string) => normalizedCats.includes(c));
      if (!catMatch) return false;

      let genderMatch = false;
      if (p.gender) {
        if (Array.isArray(p.gender)) {
          genderMatch = p.gender.some((g: string) => g.toLowerCase() === genderVal.toLowerCase());
        } else {
          genderMatch = p.gender.toLowerCase() === genderVal.toLowerCase();
        }
      }
      if (!genderMatch) return false;

      if (filterOptions.brands) {
        const pBrand = (p.brand || '').toLowerCase();
        const brandMatch = filterOptions.brands.some(b => pBrand === b.toLowerCase() || pBrand.includes(b.toLowerCase()));
        if (!brandMatch) return false;
      }

      if (filterOptions.size) {
        const pSize = (p.frameSize || '').toLowerCase();
        if (pSize !== filterOptions.size.toLowerCase()) return false;
      }

      return true;
    });

    let minPrice = filterOptions.fallbackPrice;
    let image = filterOptions.fallbackImage;

    if (matching.length > 0) {
      const prices = matching.map(p => p.price?.selling || p.sellingPrice).filter(p => typeof p === 'number' && p > 0);
      if (prices.length > 0) {
        minPrice = Math.min(...prices);
      }
      const firstWithImage = matching.find(p => p.thumbnail || (p.images && p.images.length > 0));
      if (firstWithImage) {
        image = firstWithImage.thumbnail || firstWithImage.images[0];
      }
    }

    return {
      label: filterOptions.label,
      price: `Starts at ₹${minPrice}`,
      to: filterOptions.to,
      image: image
    };
  };

  const renderMegaMenu = () => {
    if (!activeHover) return null;

    const isEyeglasses = activeHover === 'prescription' || activeHover === 'eyeglasses';
    const isSunglasses = activeHover === 'sunglasses';
    const isContacts = activeHover === 'contact-lenses' || activeHover === 'contact_lenses' || activeHover === 'contact';
    const isComputer = activeHover === 'computer-glasses' || activeHover === 'blue_light' || activeHover === 'blue-light' || activeHover === 'reading-glasses' || activeHover === 'power-sunglasses';

    if (!isEyeglasses && !isSunglasses && !isContacts && !isComputer) {
      const dynamicCat = categories.find(c => c.slug === activeHover);
      if (!dynamicCat || !dynamicCat.children || dynamicCat.children.length === 0) {
        return null;
      }

      return (
        <div
          className="absolute top-full left-0 right-0 bg-[#0E0E0F]/98 border-t border-b border-[#2A2A2D] shadow-2xl z-50 animate-fade-in"
          onMouseEnter={handleMegaMenuMouseEnter}
          onMouseLeave={handleMegaMenuMouseLeave}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 lg:px-16 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {dynamicCat.children.map((sub: any) => (
                <div key={sub.id || sub.slug} className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 hover:border-[#D4A04D]/40 transition-all duration-300 flex flex-col justify-between group/card">
                  <div>
                    <h3 className="text-white text-sm font-black tracking-wide uppercase">{sub.name}</h3>
                    <span className="inline-block mt-1 text-[8px] font-extrabold uppercase bg-zinc-800 text-gray-400 px-2 py-0.5 rounded-full tracking-wider">
                      Explore Collection
                    </span>

                    <div className="mt-4 space-y-2">
                      <Link
                        to={`/products?category=${dynamicCat.slug}&shape=${sub.name}&gender=men`}
                        className="flex items-center justify-between text-xs font-semibold text-gray-400 hover:text-[#D4A04D] transition-colors"
                      >
                        <span>Men's {sub.name}</span>
                        <span className="text-[10px] transform group-hover/card:translate-x-1 transition-transform">→</span>
                      </Link>
                      <Link
                        to={`/products?category=${dynamicCat.slug}&shape=${sub.name}&gender=women`}
                        className="flex items-center justify-between text-xs font-semibold text-gray-400 hover:text-[#D4A04D] transition-colors"
                      >
                        <span>Women's {sub.name}</span>
                        <span className="text-[10px] transform group-hover/card:translate-x-1 transition-transform">→</span>
                      </Link>
                      <Link
                        to={`/products?category=${dynamicCat.slug}&shape=${sub.name}`}
                        className="flex items-center justify-between text-xs font-semibold text-gray-400 hover:text-[#D4A04D] transition-colors"
                      >
                        <span>View All {sub.name}</span>
                        <span className="text-[10px] transform group-hover/card:translate-x-1 transition-transform">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {dynamicCat.bannerImage ? (
                <div className="md:col-span-2 relative overflow-hidden rounded-2xl border border-zinc-800 group/promo h-48 md:h-full min-h-[160px] bg-cover bg-center" style={{ backgroundImage: `url(${dynamicCat.bannerImage})` }}>
                  <div className="absolute inset-0 bg-black/60 group-hover/promo:bg-black/50 transition-colors duration-300" />
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <h4 className="text-white text-lg font-black uppercase tracking-wider">{dynamicCat.name}</h4>
                    <p className="text-gray-300 text-xs mt-1 max-w-[280px] line-clamp-2">{dynamicCat.description || 'Premium designer frames'}</p>
                    <Link
                      to={`/products?category=${dynamicCat.slug}`}
                      className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-black uppercase bg-[#D4A04D] hover:bg-[#C8923E] text-black py-2 px-4 rounded-lg tracking-wider transition-colors w-fit"
                    >
                      Shop Collection
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="md:col-span-2 relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-[#1c1c1e] to-[#0c0c0d] p-6 flex flex-col justify-center items-center text-center">
                  <span className="text-2xl mb-2">✨</span>
                  <h4 className="text-[#D4A04D] text-xs font-black uppercase tracking-widest">Premium Selection</h4>
                  <p className="text-gray-500 text-[10px] mt-1 max-w-[200px]">Handcrafted premium quality prescription glasses and custom sunglasses.</p>
                  <Link to={`/products?category=${dynamicCat.slug}`} className="mt-3 text-[10px] font-black uppercase border border-zinc-700 hover:border-[#D4A04D] hover:text-[#D4A04D] transition-colors py-1.5 px-3 rounded-lg">
                    Discover More
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    let columns: any[] = [];
    if (isEyeglasses) {
      columns = [
        {
          title: 'MEN Eyeglasses',
          badge: 'with FREE lenses',
          image: '/images/men_eyeglasses.png',
          items: [
            getDynamicGroupData('prescription', 'men', {
              brands: ['John Jacobs', 'Owndays', 'Le Petit'],
              fallbackPrice: 3000,
              label: 'John Jacobs | Owndays | Le Petit',
              to: '/products?category=prescription&gender=men&brand=John%20Jacobs,Owndays,Le%20Petit',
              fallbackImage: '/images/men_eyeglasses.png'
            }),
            getDynamicGroupData('prescription', 'men', {
              brands: ['Vincent Chase', 'Lenskart Air'],
              fallbackPrice: 1500,
              label: 'Vincent Chase | Lenskart Air',
              to: '/products?category=prescription&gender=men&brand=Vincent%20Chase,Lenskart%20Air',
              fallbackImage: '/images/men_eyeglasses.png'
            }),
            getDynamicGroupData('prescription', 'men', {
              brands: ['Hustlr'],
              fallbackPrice: 500,
              label: 'Hustlr',
              to: '/products?category=prescription&gender=men&brand=Hustlr',
              fallbackImage: '/images/men_eyeglasses.png'
            }),
            getDynamicGroupData('prescription', 'men', {
              brands: ['Essentials', 'EyeGlaze'],
              fallbackPrice: 500,
              label: 'Essentials',
              to: '/products?category=prescription&gender=men&brand=Essentials,EyeGlaze',
              fallbackImage: '/images/men_eyeglasses.png'
            }),
            getDynamicGroupData('prescription', 'men', {
              fallbackPrice: 800,
              label: 'All Brands',
              to: '/products?category=prescription&gender=men',
              fallbackImage: '/images/men_eyeglasses.png'
            })
          ]
        },
        {
          title: 'WOMEN Eyeglasses',
          badge: 'with FREE lenses',
          image: '/images/women_eyeglasses.png',
          items: [
            getDynamicGroupData('prescription', 'women', {
              brands: ['John Jacobs', 'Owndays', 'Le Petit'],
              fallbackPrice: 3000,
              label: 'John Jacobs | Owndays | Le Petit',
              to: '/products?category=prescription&gender=women&brand=John%20Jacobs,Owndays,Le%20Petit',
              fallbackImage: '/images/women_eyeglasses.png'
            }),
            getDynamicGroupData('prescription', 'women', {
              brands: ['Vincent Chase', 'Lenskart Air'],
              fallbackPrice: 1500,
              label: 'Vincent Chase | Lenskart Air',
              to: '/products?category=prescription&gender=women&brand=Vincent%20Chase,Lenskart%20Air',
              fallbackImage: '/images/women_eyeglasses.png'
            }),
            getDynamicGroupData('prescription', 'women', {
              brands: ['Hustlr'],
              fallbackPrice: 500,
              label: 'Hustlr',
              to: '/products?category=prescription&gender=women&brand=Hustlr',
              fallbackImage: '/images/women_eyeglasses.png'
            }),
            getDynamicGroupData('prescription', 'women', {
              brands: ['Essentials', 'EyeGlaze'],
              fallbackPrice: 500,
              label: 'Essentials',
              to: '/products?category=prescription&gender=women&brand=Essentials,EyeGlaze',
              fallbackImage: '/images/women_eyeglasses.png'
            }),
            getDynamicGroupData('prescription', 'women', {
              fallbackPrice: 800,
              label: 'All Brands',
              to: '/products?category=prescription&gender=women',
              fallbackImage: '/images/women_eyeglasses.png'
            })
          ]
        },
        {
          title: 'KIDS Eyeglasses',
          badge: 'with FREE lenses',
          image: '/images/kids_eyeglasses.png',
          items: [
            getDynamicGroupData('prescription', 'kids', {
              size: 'Small',
              fallbackPrice: 800,
              label: 'Juniors | 6 to 8 years',
              to: '/products?category=prescription&gender=kids&size=Small',
              fallbackImage: '/images/kids_eyeglasses.png'
            }),
            getDynamicGroupData('prescription', 'kids', {
              size: 'Medium',
              fallbackPrice: 500,
              label: 'Tweens | 8 to 10 years',
              to: '/products?category=prescription&gender=kids&size=Medium',
              fallbackImage: '/images/kids_eyeglasses.png'
            }),
            getDynamicGroupData('prescription', 'kids', {
              size: 'Large',
              fallbackPrice: 1500,
              label: 'Teens | 10 to 16 years',
              to: '/products?category=prescription&gender=kids&size=Large',
              fallbackImage: '/images/kids_eyeglasses.png'
            })
          ]
        }
      ];
    } else if (isSunglasses) {
      columns = [
        {
          title: 'MEN Sunglasses',
          badge: 'Polarized with UV',
          image: '/images/men_sunglasses.png',
          items: [
            getDynamicGroupData('sunglasses', 'men', {
              brands: ['John Jacobs', 'Owndays', 'Le Petit'],
              fallbackPrice: 3000,
              label: 'John Jacobs | Owndays | Le Petit',
              to: '/products?category=sunglasses&gender=men&brand=John%20Jacobs,Owndays,Le%20Petit',
              fallbackImage: '/images/men_sunglasses.png'
            }),
            getDynamicGroupData('sunglasses', 'men', {
              brands: ['Vincent Chase', 'Lenskart Air'],
              fallbackPrice: 1500,
              label: 'Vincent Chase | Lenskart Air',
              to: '/products?category=sunglasses&gender=men&brand=Vincent%20Chase,Lenskart%20Air',
              fallbackImage: '/images/men_sunglasses.png'
            }),
            getDynamicGroupData('sunglasses', 'men', {
              brands: ['Hustlr'],
              fallbackPrice: 500,
              label: 'Hustlr',
              to: '/products?category=sunglasses&gender=men&brand=Hustlr',
              fallbackImage: '/images/men_sunglasses.png'
            }),
            getDynamicGroupData('sunglasses', 'men', {
              brands: ['Essentials', 'EyeGlaze'],
              fallbackPrice: 500,
              label: 'Essentials',
              to: '/products?category=sunglasses&gender=men&brand=Essentials,EyeGlaze',
              fallbackImage: '/images/men_sunglasses.png'
            }),
            getDynamicGroupData('sunglasses', 'men', {
              fallbackPrice: 800,
              label: 'All Brands',
              to: '/products?category=sunglasses&gender=men',
              fallbackImage: '/images/men_sunglasses.png'
            })
          ]
        },
        {
          title: 'WOMEN Sunglasses',
          badge: 'Polarized with UV',
          image: '/images/women_sunglasses.png',
          items: [
            getDynamicGroupData('sunglasses', 'women', {
              brands: ['John Jacobs', 'Owndays', 'Le Petit'],
              fallbackPrice: 3000,
              label: 'John Jacobs | Owndays | Le Petit',
              to: '/products?category=sunglasses&gender=women&brand=John%20Jacobs,Owndays,Le%20Petit',
              fallbackImage: '/images/women_sunglasses.png'
            }),
            getDynamicGroupData('sunglasses', 'women', {
              brands: ['Vincent Chase', 'Lenskart Air'],
              fallbackPrice: 1500,
              label: 'Vincent Chase | Lenskart Air',
              to: '/products?category=sunglasses&gender=women&brand=Vincent%20Chase,Lenskart%20Air',
              fallbackImage: '/images/women_sunglasses.png'
            }),
            getDynamicGroupData('sunglasses', 'women', {
              brands: ['Hustlr'],
              fallbackPrice: 500,
              label: 'Hustlr',
              to: '/products?category=sunglasses&gender=women&brand=Hustlr',
              fallbackImage: '/images/women_sunglasses.png'
            }),
            getDynamicGroupData('sunglasses', 'women', {
              brands: ['Essentials', 'EyeGlaze'],
              fallbackPrice: 500,
              label: 'Essentials',
              to: '/products?category=sunglasses&gender=women&brand=Essentials,EyeGlaze',
              fallbackImage: '/images/women_sunglasses.png'
            }),
            getDynamicGroupData('sunglasses', 'women', {
              fallbackPrice: 800,
              label: 'All Brands',
              to: '/products?category=sunglasses&gender=women',
              fallbackImage: '/images/women_sunglasses.png'
            })
          ]
        },
        {
          title: 'KIDS Sunglasses',
          badge: 'Polarized with UV',
          image: '/images/kids_sunglasses.png',
          items: [
            getDynamicGroupData('sunglasses', 'kids', {
              size: 'Small',
              fallbackPrice: 800,
              label: 'Juniors | 6 to 8 years',
              to: '/products?category=sunglasses&gender=kids&size=Small',
              fallbackImage: '/images/kids_sunglasses.png'
            }),
            getDynamicGroupData('sunglasses', 'kids', {
              size: 'Medium',
              fallbackPrice: 500,
              label: 'Tweens | 8 to 10 years',
              to: '/products?category=sunglasses&gender=kids&size=Medium',
              fallbackImage: '/images/kids_sunglasses.png'
            }),
            getDynamicGroupData('sunglasses', 'kids', {
              size: 'Large',
              fallbackPrice: 1500,
              label: 'Teens | 10 to 16 years',
              to: '/products?category=sunglasses&gender=kids&size=Large',
              fallbackImage: '/images/kids_sunglasses.png'
            })
          ]
        }
      ];
    } else if (isContacts) {
      columns = [
        {
          title: 'CLEAR Contacts',
          badge: '10% OFF with Gold',
          image: '/images/cat_contacts.png',
          items: getDynamicProducts('contact-lenses', 'all', {
            subCategory: 'clear-contacts',
            fallbackItems: [
              { label: 'Distance power (-ve)', price: getDynamicCategoryPrice('contact_lenses', 249), to: '/products?category=contact_lenses&subCategory=clear-contacts', image: '/images/cat_contacts.png' },
              { label: 'Toric/Cylindrical', price: getDynamicCategoryPrice('contact_lenses', 349), to: '/products?category=contact_lenses&subCategory=clear-contacts', image: '/images/cat_contacts.png' },
              { label: 'Multi-Focal', price: getDynamicCategoryPrice('contact_lenses', 2000), to: '/products?category=contact_lenses&subCategory=clear-contacts', image: '/images/cat_contacts.png' },
            ]
          })
        },
        {
          title: 'COLOR Contacts',
          badge: '10% OFF with Gold',
          image: '/images/cat_contacts.png',
          items: getDynamicProducts('contact-lenses', 'all', {
            subCategory: 'color-contacts',
            fallbackItems: [
              { label: 'Zero Power', price: getDynamicCategoryPrice('contact_lenses', 179), to: '/products?category=contact_lenses&subCategory=color-contacts', image: '/images/cat_contacts.png' },
              { label: 'With Power', price: getDynamicCategoryPrice('contact_lenses', 199), to: '/products?category=contact_lenses&subCategory=color-contacts', image: '/images/cat_contacts.png' },
              { label: 'Color Combos', price: 'Buy 4, Pay for 3!', to: '/products?category=contact_lenses&subCategory=color-contacts', image: '/images/cat_contacts.png' },
            ]
          })
        },
        {
          title: 'Solution & Accessories',
          badge: '10% OFF with Gold',
          image: '/images/accessories.png',
          items: getDynamicProducts('accessories', 'all', {
            fallbackItems: [
              { label: 'Solution', price: getDynamicCategoryPrice('contact_lenses', 149), to: '/products?category=contact_lenses&subCategory=solutions-accessories', image: '/images/accessories.png' },
              { label: 'Accessories', price: getDynamicCategoryPrice('contact_lenses', 159), to: '/products?category=contact_lenses&subCategory=solutions-accessories', image: '/images/accessories.png' },
            ]
          })
        }
      ];
    } else if (isComputer) {
      columns = [
        {
          title: 'Computer Glasses',
          badge: 'Anti-Glare Screen',
          image: '/images/cat_blue_light.png',
          items: getDynamicProducts('blue_light', 'all', {
            fallbackItems: [
              { label: 'Vincent Chase Anti-Glare', price: 'Starts at ₹799', to: '/products?category=blue_light', image: '/images/cat_blue_light.png' },
              { label: 'John Jacobs Blue Cut Clear', price: 'Starts at ₹1299', to: '/products?category=blue_light', image: '/images/cat_blue_light.png' },
              { label: 'EyeGlaze Gamer Special', price: 'Starts at ₹1999', to: '/products?category=blue_light', image: '/images/cat_blue_light.png' }
            ]
          })
        },
        {
          title: 'Reading Glasses',
          badge: 'Ready-to-Wear Power',
          image: '/images/reading_book.png',
          items: getDynamicProducts('reading-glasses', 'all', {
            fallbackItems: [
              { label: 'Classic Reading Glasses', price: 'Starts at ₹299', to: '/products?category=reading-glasses', image: '/images/reading_book.png' },
              { label: 'Premium Metallic Reading Frame', price: 'Starts at ₹499', to: '/products?category=reading-glasses', image: '/images/reading_book.png' },
              { label: 'Folding Pocket Readers', price: 'Starts at ₹1499', to: '/products?category=reading-glasses', image: '/images/reading_book.png' }
            ]
          })
        },
        {
          title: 'Power Sunglasses',
          badge: 'Prescription Sun',
          image: '/images/cat_sunglasses.png',
          items: getDynamicProducts('power-sunglasses', 'all', {
            fallbackItems: [
              { label: 'Classic Aviator Power Sun', price: getDynamicCategoryPrice('power-sunglasses', 1999), to: '/products?category=power-sunglasses', image: '/images/cat_sunglasses.png' },
              { label: 'Modern Wayfarer Power Sun', price: getDynamicCategoryPrice('power-sunglasses', 1499), to: '/products?category=power-sunglasses', image: '/images/cat_sunglasses.png' },
              { label: 'Cat-Eye Special Power Sun', price: getDynamicCategoryPrice('power-sunglasses', 1799), to: '/products?category=power-sunglasses', image: '/images/cat_sunglasses.png' },
            ]
          })
        }
      ];
    }

    return (
      <div
        className="absolute top-full left-0 right-0 bg-[#0E0E0F]/90 backdrop-blur-xl border-t border-b border-zinc-800/80 shadow-[0_25px_50px_rgba(0,0,0,0.8)] z-50 animate-fade-in"
        onMouseEnter={handleMegaMenuMouseEnter}
        onMouseLeave={handleMegaMenuMouseLeave}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 lg:px-16 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map((col, cIdx) => (
              <div key={cIdx} className="bg-gradient-to-b from-zinc-900/40 to-zinc-950/60 border border-zinc-800/60 rounded-2xl p-5 hover:border-[#D4A04D]/35 transition-all duration-500 flex flex-col justify-between group/card relative overflow-hidden shadow-lg">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="pr-12">
                      <h3 className="text-white text-sm font-black tracking-wide uppercase">{col.title}</h3>
                      <span className="inline-block mt-1 text-[8px] font-extrabold uppercase bg-[#D4A04D]/10 text-[#D4A04D] px-2 py-0.5 rounded-full tracking-wider">
                        {col.badge}
                      </span>
                    </div>
                    {col.image && (
                      <img
                        src={col.image}
                        alt={col.title}
                        className="w-16 h-16 object-cover rounded-full border border-[#D4A04D]/30 bg-zinc-900/90 -mt-2 -mr-2 shrink-0 shadow-lg group-hover/card:border-[#D4A04D]/60 transition-colors duration-500"
                      />
                    )}
                  </div>

                  <div className="space-y-3.5">
                    {col.items.map((item: any, iIdx: number) => {
                      const itemImg = item.image || col.image || '/images/cat_prescription.png';
                      return (
                        <Link
                          key={iIdx}
                          to={item.to}
                          onClick={() => setActiveHover(null)}
                          className="flex items-center gap-3.5 p-2 rounded-xl bg-zinc-950/20 hover:bg-zinc-800/45 border border-transparent hover:border-zinc-850 transition-all duration-300 group/item relative overflow-hidden"
                        >
                          {/* Left: Thumbnail */}
                          <div className="w-12 h-12 rounded-lg bg-zinc-900/60 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0 group-hover/item:border-[#D4A04D]/40 transition-colors p-1 bg-gradient-to-br from-zinc-900 to-zinc-950">
                            <img
                              src={itemImg}
                              alt={item.label}
                              className="w-full h-full object-contain group-hover/item:scale-110 transition-transform duration-500"
                            />
                          </div>

                          {/* Middle: Name & Price */}
                          <div className="flex-1 min-w-0 pr-2">
                            <span className="block text-[#F2F2F2]/90 font-bold group-hover/item:text-[#D4A04D] transition-colors truncate text-[11px] uppercase tracking-wide">
                              {item.label}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-white font-extrabold">{item.price}</span>
                              {item.badge && (
                                <span className="text-[7px] font-black uppercase tracking-widest bg-[#D4A04D]/15 text-[#D4A04D] px-1.5 py-0.5 rounded leading-none">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right: pointer chevron arrow */}
                          <span className="text-[10px] shrink-0 transform group-hover/item:translate-x-0.5 transition-all text-gray-500 group-hover/item:text-[#D4A04D] font-bold p-1 bg-zinc-900/50 group-hover/item:bg-[#D4A04D]/10 rounded-lg">
                            &gt;
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };



  // Close menus when route/pathname or search parameters change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
    setActiveHover(null);
  }, [location.pathname, location.search]);

  // Lock body scroll on mobile when menus are open
  useEffect(() => {
    const isMobile = window.innerWidth < 1280;
    if (isMobile && (isProfileDropdownOpen || isMobileMenuOpen)) {
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
  }, [isProfileDropdownOpen, isMobileMenuOpen]);

  const ADMIN_ROLES = ['admin', 'store_manager', 'support_agent'];
  if (user && ADMIN_ROLES.includes(user.role || '')) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Check if we are on the product detail route (e.g. /products/:id), cart page, wishlist, or login/auth pages
  const isCartPage = location.pathname === '/cart';
  const isAuthPage = [
    '/login',
    '/login/otp',
    '/forgot-password',
    '/reset-password'
  ].includes(location.pathname);
  const hideRightIconsOnMobile = isCartPage || isAuthPage;

  const isCustomerPage = [
    '/orders',
    '/membership',
    '/profile',
    '/saved-powers',
    '/payments',
    '/wallet',
    '/support/questions',
    '/support/contact',
    '/about-eyeglaze',
    '/rate-us',
    '/account'
  ].some(path => location.pathname.startsWith(path));

  const isHomePage = location.pathname === '/';
  const isProductDetailPage = location.pathname.startsWith('/products/');
  const hideHeader = isCustomerPage || isProductDetailPage;
  const showBottomNav = isHomePage;

  const renderProfileDropdown = () => {
    if (!user) return null;
    return (
      <>
        {/* Click outside overlay */}
        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsProfileDropdownOpen(false)} />

        {/* Dropdown Card */}
        <div className="absolute right-0 mt-3 w-64 max-h-[85vh] overflow-y-auto overscroll-y-contain bg-[#0E0E0F]/95 backdrop-blur-md border border-[#D4A04D]/25 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.8),_0_0_20px_rgba(212,160,77,0.03)] z-50 animate-fade-in scrollbar-none flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-[#2A2A2D] select-none">
            <div className="w-11 h-11 bg-[#D4A04D] text-black font-sans font-black rounded-full flex items-center justify-center text-sm uppercase shadow-[0_0_10px_rgba(212,160,77,0.15)] shrink-0">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-white text-xs font-black uppercase tracking-wide truncate">{user.name || 'charan'}</div>
              <div className="text-gray-500 text-[10px] truncate mt-0.5">{user.email || 'c@gmail.com'}</div>
              {user.membershipActive ? (
                <div className="flex items-center gap-1 text-[#D4A04D] text-[9px] font-black uppercase tracking-wider mt-1">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span>GOLD MEMBER</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setIsGoldDrawerOpen(true);
                  }}
                  className="text-gray-400 hover:text-[#D4A04D] text-[9px] font-black uppercase mt-1 tracking-wider bg-transparent border-none p-0 cursor-pointer focus:outline-none"
                >
                  Join Gold Membership
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-0.5">
            {[
              {
                href: '/profile',
                label: 'My Profile',
                icon: (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )
              },
              {
                href: '/saved-powers',
                label: 'Saved Powers',
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="12" r="3" />
                    <path d="M9 12h6" />
                  </svg>
                )
              },
              {
                href: '/orders',
                label: 'My Orders',
                icon: (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                )
              },
              {
                href: '/wishlist',
                label: 'My Wishlist',
                icon: (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )
              },
              {
                href: '/membership',
                label: 'Gold Membership',
                icon: (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                )
              },
              {
                href: '/payments',
                label: 'Payment History',
                icon: (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
                    <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                )
              },
              {
                href: '/wallet',
                label: 'My Wallet',
                icon: (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                )
              }
            ].map(({ href, label, icon }) => (
              <Link
                key={href}
                to={href}
                onClick={() => setIsProfileDropdownOpen(false)}
                className="flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:bg-[#131314] hover:text-white transition-colors"
              >
                {icon}
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="pt-2.5 border-t border-[#2A2A2D]">
            <button
              onClick={async () => {
                setIsProfileDropdownOpen(false);
                await logout();
                navigate('/');
              }}
              className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left text-xs font-bold text-red-400 hover:bg-red-500/5 hover:text-red-300 transition-colors bg-transparent border-none cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-red-400">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] w-full overflow-x-clip">
      {!hideHeader && (
        <header className="bg-[#0B0B0C]/95 backdrop-blur-md border-b border-[#2A2A2D] fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300">
          <div className={`flex items-center justify-between px-4 sm:px-6 md:px-12 lg:px-16 relative z-10 transition-all duration-300 ${isHomePage ? 'h-11' : 'h-16'}`}>
            {/* Mobile / Tablet Left Menu and Back Actions */}
            <div className="flex items-center gap-1.5 xl:hidden w-full">
              {showBottomNav ? (
                /* Mobile primary header row: Left Location, Right GET GOLD badge, Cart & Login/Logout button */
                <div className="flex items-center justify-between w-full relative z-20">
                  {/* Left: Location selector - Hidden */}

                  {/* Right: Cart Icon & Login/Logout Button */}
                  <div className="flex items-center gap-2 xs:gap-3 shrink-0 ml-auto">

                    <Link
                      to="/cart"
                      className="text-gray-400 hover:text-[#D4A04D] transition-colors relative cursor-pointer"
                      title="Shopping Cart"
                    >
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      {cartCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-[#D4A04D] text-black font-extrabold text-[7px] w-3.5 h-3.5 rounded-full flex items-center justify-center border border-[#0B0B0C]">
                          {cartCount}
                        </span>
                      )}
                    </Link>

                    <div className="relative">
                      <button
                        onClick={() => {
                          if (user) {
                            setIsProfileDropdownOpen(!isProfileDropdownOpen);
                          } else {
                            navigate('/login');
                          }
                        }}
                        className="w-8 h-8 rounded-full border border-zinc-700/60 flex items-center justify-center text-gray-400 hover:text-[#D4A04D] hover:border-[#D4A04D]/50 transition-colors bg-transparent cursor-pointer focus:outline-none"
                        title={user ? "Profile Menu" : "Login"}
                      >
                        {user ? (
                          /* Silhouette Icon inside Circle */
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        ) : (
                          /* Login Icon */
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                            <polyline points="10 17 15 12 10 7" />
                            <line x1="15" y1="12" x2="3" y2="12" />
                          </svg>
                        )}
                      </button>
                      {isProfileDropdownOpen && renderProfileDropdown()}
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard mobile header back navigation button */
                location.pathname !== '/' && (
                  <button
                    onClick={() => navigate(-1)}
                    className="text-gray-400 hover:text-white p-1 focus:outline-none transition-colors cursor-pointer bg-transparent border-none"
                    aria-label="Go Back"
                  >
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                )
              )}
            </div>

            {/* Logo - Centered on Mobile and Desktop */}
            <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center select-none text-center">
              <span className="text-[#D4A04D] font-serif text-sm tracking-[0.2em] uppercase font-bold leading-none xl:text-xl">EYEGLAZE</span>
              <span className="text-[#D4A04D]/80 font-sans text-[6px] tracking-[0.3em] uppercase mt-0.5">EYEWEAR</span>
            </Link>

            {/* Right Actions - Hidden on mobile if bottom-nav top layout is active */}
            <div className={`${showBottomNav ? 'hidden xl:flex' : 'flex'} items-center gap-3.5 md:gap-6 z-10 ml-auto`}>
              {/* Search Icon (for smaller screens) */}
              {location.pathname !== '/' && (
                <button
                  onClick={() => {
                    if (location.pathname === '/products') {
                      document.getElementById('search-input')?.focus();
                    } else {
                      navigate('/products');
                    }
                  }}
                  className="hidden xl:block text-gray-400 hover:text-[#D4A04D] transition-colors cursor-pointer bg-transparent border-none"
                  title="Search"
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}

              {/* Wishlist Icon */}
              {location.pathname !== '/' && (
                <Link
                  to="/wishlist"
                  className="hidden xl:block text-gray-400 hover:text-[#D4A04D] transition-colors relative cursor-pointer"
                  title="Wishlist"
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlist && wishlist.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#D4A04D] text-black font-extrabold text-[8px] w-4 h-4 rounded-full flex items-center justify-center border border-[#0B0B0C]">
                      {wishlist.length}
                    </span>
                  )}
                </Link>
              )}

              {/* Cart Icon with Badge */}
              <Link
                to="/cart"
                className={`${hideRightIconsOnMobile ? 'hidden' : 'block'} text-gray-400 hover:text-[#D4A04D] transition-colors relative cursor-pointer`}
                title="Shopping Cart"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#D4A04D] text-black font-extrabold text-[8px] w-4 h-4 rounded-full flex items-center justify-center border border-[#0B0B0C]">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Profile / Login Button & Dropdown */}
              {user ? (
                <div className="relative">
                  {/* Desktop Trigger */}
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="hidden xl:flex items-center gap-2 bg-[#131314] border border-[#2A2A2D] hover:border-[#D4A04D]/50 rounded-full py-1 px-2.5 transition-colors text-[10px] font-bold text-white cursor-pointer focus:outline-none"
                    title="Account"
                  >
                    <div className="w-4 h-4 bg-[#D4A04D] text-black font-extrabold rounded-full flex items-center justify-center text-[8px] uppercase">
                      {user.name ? user.name[0] : 'U'}
                    </div>
                    <span className="max-w-[80px] truncate">{user.name || 'Account'}</span>
                    <svg
                      className={`w-2.5 h-2.5 text-gray-400 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Mobile Trigger */}
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className={`${hideRightIconsOnMobile ? 'hidden' : 'xl:hidden'} w-9 h-9 rounded-full border border-zinc-700/60 flex items-center justify-center text-gray-300 hover:text-[#D4A04D] transition-colors cursor-pointer bg-transparent focus:outline-none`}
                    title="Profile"
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>

                  {isProfileDropdownOpen && renderProfileDropdown()}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    state={{ from: location }}
                    className="hidden xl:block bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-[9px] uppercase py-2 px-3.5 rounded-lg tracking-wider transition-colors cursor-pointer"
                  >
                    Login/Signup
                  </Link>
                  <Link
                    to="/login"
                    state={{ from: location }}
                    className={`${hideRightIconsOnMobile ? 'hidden' : 'xl:hidden'} w-9 h-9 rounded-full border border-zinc-700/60 flex items-center justify-center text-gray-300 hover:text-[#D4A04D] transition-colors cursor-pointer`}
                    title="Login"
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Row 2: Desktop Categories Navigation Bar */}
          <div className="hidden xl:flex w-full px-4 sm:px-6 md:px-12 lg:px-16 h-12 border-t border-[#2A2A2D]/40 items-center justify-between select-none">
            <nav className="flex items-center gap-7 h-full text-[10px] xl:text-[11px] font-black uppercase tracking-[0.15em] text-white">
              {categories.map((cat: any) => (
                <div
                  key={cat.id || cat.slug}
                  onMouseEnter={() => handleMouseEnter(cat.slug)}
                  onMouseLeave={handleMouseLeave}
                  className="h-full flex items-center relative cursor-pointer"
                >
                  <Link
                    to={`/products?category=${cat.slug}`}
                    className="hover:text-[#D4A04D] transition-colors py-3 border-b-2 border-transparent hover:border-[#D4A04D]"
                  >
                    {cat.name}
                  </Link>
                </div>
              ))}
            </nav>
          </div>

          {/* Mega Menu Overlay */}
          {renderMegaMenu()}
        </header>
      )}

      {/* Mobile Menu Sidebar Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-start xl:hidden">
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

            {/* Mobile Categories Menu */}
            <div className="mt-4 space-y-3">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1 select-none">
                Categories
              </div>
              <nav className="flex flex-col gap-2">
                {categories.map((cat: any) => (
                  <Link
                    key={cat.id || cat.slug}
                    to={`/products?category=${cat.slug}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-gray-400 hover:text-[#D4A04D] text-xs font-semibold py-1 transition-colors px-1"
                  >
                    <span className="text-sm">{cat.icon || '👓'}</span>
                    <span>{cat.name}</span>
                  </Link>
                ))}
                {/* Removed Stores & Try @ Home Links */}
              </nav>
            </div>

            {/* Mobile Drawer "My Space" (if user logged in) */}
            {user && (
              <div className="mt-6 space-y-3">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1 select-none">
                  My Space
                </div>
                <nav className="flex flex-col gap-2">
                  {[
                    { href: '/profile', label: 'My Profile', icon: '👤' },
                    { href: '/saved-powers', label: 'Saved Powers', icon: '👓' },
                    { href: '/orders', label: 'My Orders', icon: '📦' },
                    { href: '/wishlist', label: 'My Wishlist', icon: '❤️' },
                    { href: '/membership', label: 'Gold Membership', icon: '👑' },
                    { href: '/payments', label: 'Payment History', icon: '💳' },
                    { href: '/wallet', label: 'My Wallet', icon: '👛' },
                  ].map(({ href, label, icon }) => (
                    <Link
                      key={href}
                      to={href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 text-gray-400 hover:text-[#D4A04D] text-xs font-semibold py-1.5 transition-colors px-1"
                    >
                      <BrandIcon name={icon} className="w-4 h-4 text-[#D4A04D]" />
                      <span>{label}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            )}

            {/* Account info in Drawer */}
            <div className="mt-auto pt-6 border-t border-[#1C1C1E] flex flex-col gap-4">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#D4A04D] to-[#8b6524] text-black font-extrabold rounded-full flex items-center justify-center text-xs uppercase">
                      {user.name ? user.name[0] : 'U'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white text-xs font-bold truncate max-w-[100px]">{user.name}</span>
                      {user.membershipActive && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] text-[#D4A04D] font-extrabold uppercase mt-0.5">
                          <BrandIcon name="👑" className="w-2.5 h-2.5 text-[#D4A04D]" /> Gold
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      await logout();
                      navigate('/');
                    }}
                    className="text-red-400 hover:text-red-300 text-xs font-bold uppercase transition-colors bg-transparent border-none cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  state={{ from: location }}
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

      <main className={
        isCustomerPage || isProductDetailPage
          ? "w-full min-h-screen"
          : isHomePage
            ? "w-full mt-[44px] xl:mt-[92px]"
            : "w-full px-4 sm:px-6 md:px-12 lg:px-16 py-8 mt-16 xl:mt-28"
      }>
        <Outlet />
      </main>

      {isHomePage && <Footer />}

      {/* Slide-in Location Selection Drawer */}
      <AnimatePresence>
        {isLocationDrawerOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed inset-0 z-50 bg-[#0B0B0C] flex flex-col w-full h-full"
          >
            {/* Header */}
            <div className="p-4 border-b border-[#2A2A2D] flex items-center justify-between bg-[#131314]">
              <button
                onClick={() => {
                  setIsLocationDrawerOpen(false);
                  setLocationSearchQuery('');
                }}
                className="text-gray-400 hover:text-white p-2 focus:outline-none bg-transparent border-none cursor-pointer"
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>

              <div className="flex items-center gap-4">
                <button className="text-gray-400 hover:text-[#D4A04D] focus:outline-none bg-transparent border-none cursor-pointer">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <Link to="/wishlist" onClick={() => setIsLocationDrawerOpen(false)} className="text-gray-400 hover:text-[#D4A04D]">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </Link>
                <Link to="/cart" onClick={() => setIsLocationDrawerOpen(false)} className="text-gray-400 hover:text-[#D4A04D] relative">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#D4A04D] text-black font-extrabold text-[8px] w-4 h-4 rounded-full flex items-center justify-center border border-[#0B0B0C]">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
              {/* Search Bar */}
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder='Try "Koramangala or 560065"'
                  value={locationSearchQuery}
                  onChange={(e) => setLocationSearchQuery(e.target.value)}
                  className="w-full bg-[#131314] border border-[#2A2A2D] focus:border-[#D4A04D] text-white rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none transition-colors"
                />
              </div>

              {/* Suggestions / Auto-detect */}
              {locationSearchQuery.trim() ? (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Search Results</span>
                  {filteredSuggestions.length > 0 ? (
                    <div className="border border-[#2A2A2D] bg-[#131314] rounded-xl overflow-hidden divide-y divide-[#2A2A2D]">
                      {filteredSuggestions.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setActiveLocation(item);
                            localStorage.setItem('user_location', JSON.stringify(item));
                            setIsLocationDrawerOpen(false);
                            setLocationSearchQuery('');
                          }}
                          className="w-full flex items-start gap-3 p-3.5 hover:bg-zinc-800/40 text-left bg-transparent border-none cursor-pointer"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#D4A04D] mt-0.5 shrink-0">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="10" r="3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-xs font-bold">{item.short}</div>
                            <div className="text-gray-400 text-[10px] mt-0.5 truncate">{item.full}</div>
                          </div>
                          <span className="text-gray-500 text-xs mt-1">➔</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 text-xs">
                      No matching addresses found. Try another search.
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Your current Location</span>

                  <button
                    onClick={handleDetectLocation}
                    disabled={isDetectingLocation}
                    className="w-full flex items-center justify-between p-4 border border-[#2A2A2D] bg-[#131314] rounded-xl hover:border-[#D4A04D]/50 transition-colors text-left bg-transparent cursor-pointer focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#D4A04D]/10 flex items-center justify-center text-[#D4A04D]">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className={isDetectingLocation ? 'animate-spin' : ''}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-white text-xs font-bold">
                          {isDetectingLocation ? 'Detecting Location...' : 'Use Current Location'}
                        </div>
                        <div className="text-gray-400 text-[10px] mt-0.5">
                          {isDetectingLocation ? 'Fetching GPS coordinates...' : 'Enable location services'}
                        </div>
                      </div>
                    </div>
                    <span className="text-gray-500 text-xs">➔</span>
                  </button>

                  {/* Show active location info */}
                  {activeLocation && (
                    <div className="p-4 border border-[#D4A04D]/25 bg-[#D4A04D]/5 rounded-xl flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#D4A04D]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="12" cy="10" r="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Active Address</span>
                      </div>
                      <div className="text-white text-xs font-black">{activeLocation.short}</div>
                      <div className="text-gray-400 text-[10px] leading-relaxed">{activeLocation.full}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Mobile Bottom Sticky Navigation Bar */}
      {showBottomNav && (
        <AnimatePresence>
          {isBottomBarVisible && (
            <motion.nav
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed bottom-4 left-4 right-4 md:hidden z-40 bg-[#0E0E0F]/90 border border-[#D4A04D]/25 h-16 rounded-2xl flex items-center justify-between px-2.5 backdrop-blur-lg shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
            >
              {[
                {
                  to: '/products',
                  label: 'PRODUCTS',
                  badge: null,
                  icon: (isActive: boolean) => (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={`transition-transform ${isActive ? 'scale-110 text-[#D4A04D]' : 'text-zinc-400'}`}>
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="12" r="3" />
                      <path d="M9 12h6" />
                      <path d="M3 12h1" />
                      <path d="M20 12h1" />
                      <path d="M6 9a4 4 0 0 1 4 4" />
                      <path d="M14 13a4 4 0 0 1 4-4" />
                    </svg>
                  )
                },
                {
                  to: '/wishlist',
                  label: 'WISHLIST',
                  badge: wishlist?.length,
                  icon: (isActive: boolean) => (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className={`transition-transform ${isActive ? 'scale-110 text-[#D4A04D]' : 'text-zinc-400'}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )
                },
                {
                  to: '/',
                  label: 'HOME',
                  badge: null,
                  isCenter: true,
                  icon: (isActive: boolean) => (
                    <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24" className="text-black">
                      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                    </svg>
                  )
                },
                {
                  to: '/orders',
                  label: 'ORDERS',
                  badge: null,
                  icon: (isActive: boolean) => (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className={`transition-transform ${isActive ? 'scale-110 text-[#D4A04D]' : 'text-zinc-400'}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  )
                },
                user?.membershipActive ? {
                  to: '/profile',
                  label: 'PROFILE',
                  badge: null,
                  icon: (isActive: boolean) => (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className={`transition-transform ${isActive ? 'scale-110 text-[#D4A04D]' : 'text-zinc-400'}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )
                } : {
                  onClick: () => setIsGoldDrawerOpen(true),
                  label: 'GET GOLD',
                  badge: null,
                  icon: (isActive: boolean) => (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className={`transition-transform ${isActive ? 'scale-110 text-[#D4A04D]' : 'text-zinc-400'}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
                    </svg>
                  )
                }
              ].map((tab) => {
                if ('onClick' in tab) {
                  return (
                    <button
                      key={tab.label}
                      onClick={tab.onClick}
                      className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-gray-500 relative focus:outline-none bg-transparent border-none cursor-pointer"
                    >
                      <div className="relative flex items-center justify-center">
                        {tab.icon(false)}
                      </div>
                      <span className="text-[7.5px] font-black uppercase tracking-wider text-zinc-500">
                        {tab.label}
                      </span>
                    </button>
                  );
                }

                const isActive = location.pathname === tab.to;

                if (tab.isCenter) {
                  return (
                    <Link
                      key={tab.to}
                      to={tab.to}
                      className="relative flex flex-col items-center justify-center -translate-y-3 cursor-pointer z-50 focus:outline-none"
                    >
                      <div className={`w-12 h-12 bg-gradient-to-b from-[#D4A04D] to-[#A3742C] rounded-full flex items-center justify-center text-black shadow-lg shadow-[#D4A04D]/20 border-4 border-[#0E0E0F] active:scale-90 transition-transform ${isActive ? 'ring-2 ring-[#D4A04D]' : ''}`}>
                        {tab.icon(isActive)}
                      </div>
                      <span className="text-[7.5px] font-black uppercase tracking-wider text-[#D4A04D] mt-1">
                        HOME
                      </span>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={tab.to}
                    to={tab.to}
                    className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-gray-500 relative focus:outline-none"
                  >
                    {/* Active Background Glow */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabGlow"
                        className="absolute inset-y-1 inset-x-2 bg-[#D4A04D]/10 rounded-xl -z-10 filter blur-xs"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}

                    <div className="relative flex items-center justify-center">
                      {tab.icon(isActive)}
                      {tab.badge && tab.badge > 0 ? (
                        <span className="absolute -top-1 -right-2 bg-[#D4A04D] text-black font-extrabold text-[7px] w-3.5 h-3.5 rounded-full flex items-center justify-center border border-[#0E0E0F]">
                          {tab.badge}
                        </span>
                      ) : null}
                    </div>

                    <span className={`text-[7.5px] font-black uppercase tracking-wider transition-colors ${isActive ? 'text-[#D4A04D]' : 'text-zinc-500'}`}>
                      {tab.label}
                    </span>

                    {/* Active indicator dot under icon */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabDot"
                        className="absolute bottom-0 w-1.5 h-1.5 bg-[#D4A04D] rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </motion.nav>
          )}
        </AnimatePresence>
      )}

      {/* Global AI Chatbot Floating Button */}
      <AnimatePresence>
        {!isAiDrawerOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              bottom: (isBottomBarVisible && showBottomNav) || (isProductDetailPage && isBottomBarVisible) ? 112 : 24
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsAiDrawerOpen(true)}
            className="fixed right-4 z-40 w-14 h-14 bg-gradient-to-br from-[#1C1C1E] to-[#0E0E0F] border border-[#D4A04D]/30 rounded-full flex items-center justify-center text-white shadow-2xl active:scale-95 hover:border-[#D4A04D] group cursor-pointer focus:outline-none"
          >
            {/* Pulsing ring */}
            <span className="absolute inset-0 rounded-full border border-[#D4A04D]/40 animate-ping opacity-25 group-hover:opacity-40" />

            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#D4A04D] group-hover:scale-110 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Global AI Assistant Chat Drawer */}
      <AnimatePresence>
        {isAiDrawerOpen && (
          <div className={`fixed inset-0 z-50 flex items-end justify-end p-4 md:p-6 pointer-events-none transition-all duration-300 ${isBottomBarVisible && showBottomNav ? 'pb-28' :
              isProductDetailPage && isBottomBarVisible ? 'pb-[104px]' : 'pb-4 md:pb-6'
            }`}>
            {/* Overlay */}
            <motion.div
              onClick={() => setIsAiDrawerOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs cursor-pointer pointer-events-auto"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-[360px] h-[500px] max-h-[80vh] bg-[#0E0E0E] rounded-2xl border border-[#2A2A2D] shadow-2xl flex flex-col z-10 overflow-hidden pointer-events-auto"
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
                <button onClick={() => setIsAiDrawerOpen(false)} className="text-gray-400 hover:text-white p-2 bg-transparent border-none cursor-pointer">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Chat Body */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-3 text-xs md:text-sm leading-relaxed ${msg.sender === 'user'
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
                    onClick={() => { setChatInput(prompt) }}
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Gold Membership Drawer */}
      <AnimatePresence>
        {isGoldDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Overlay */}
            <motion.div
              onClick={() => {
                setIsGoldDrawerOpen(false);
                setGoldError('');
                setGoldSuccess(false);
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xs cursor-pointer"
            />

            {/* Drawer Content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative bg-[#000000] w-full max-w-md h-full border-l border-zinc-800/80 flex flex-col shadow-2xl overflow-hidden text-white z-10"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-4 py-3.5 border-b border-zinc-800/80 bg-[#0A0A0B] sticky top-0 z-10">
                <button
                  onClick={() => {
                    setIsGoldDrawerOpen(false);
                    setGoldError('');
                    setGoldSuccess(false);
                  }}
                  className="text-gray-400 hover:text-white p-1 cursor-pointer bg-transparent border-none focus:outline-none transition-colors"
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
                  <span className="text-[6px] font-black text-[#D4A04D] uppercase tracking-wider">BEST VALUE</span>
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
                    <p className="text-gray-400 text-xs px-6 leading-relaxed">
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
                        setIsGoldDrawerOpen(false);
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
                    <div className="relative overflow-hidden rounded-2xl border border-[#D4A04D]/25 bg-gradient-to-br from-[#121213] to-[#0A0A0B] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.6)] flex flex-row items-center justify-between gap-4">
                      <div className="flex flex-col gap-3.5 z-10">
                        <div className="flex flex-col gap-1">
                          <h2 className="text-2xl font-black text-[#D4A04D] tracking-wide leading-none">
                            ₹1 = 1 FRAME
                          </h2>
                          <div className="inline-flex bg-[#D4A04D] text-black text-[7.5px] font-black uppercase tracking-wider px-2 py-0.75 rounded mt-1.5 w-max select-none">
                            GOLD MEMBERS EXCLUSIVE
                          </div>
                        </div>

                        <ul className="flex flex-col gap-1.5 text-[9px] font-black uppercase tracking-wider text-gray-300">
                          <li className="flex items-center gap-1.5">
                            <span className="text-[#D4A04D]">✓</span> SELECTED FRAMES ONLY
                          </li>
                          <li className="flex items-center gap-1.5">
                            <span className="text-[#D4A04D]">✓</span> FIRST ORDER BENEFIT
                          </li>
                          <li className="flex items-center gap-1.5">
                            <span className="text-[#D4A04D]">✓</span> PREMIUM EYEWEAR AT JUST ₹1
                          </li>
                        </ul>
                      </div>

                      {/* Right Image Stack with Overlay */}
                      <div className="relative w-32 h-24 flex-shrink-0 flex items-center justify-center rounded-xl overflow-hidden border border-[#2A2A2D]/40 shadow-inner bg-black/10 select-none">
                        <img
                          src="/images/gold_membership_hero.png"
                          alt="Premium Eyewear Case"
                          className="w-full h-full object-cover"
                        />
                        {/* Absolute Circular Gold Pricing badge */}
                        <div className="absolute right-1 bottom-1 w-11 h-11 bg-black/85 border border-[#D4A04D] rounded-full flex flex-col items-center justify-center shadow-lg select-none">
                          <span className="text-[#D4A04D] text-[9px] font-black leading-none">₹129</span>
                          <span className="text-gray-400 text-[6px] font-black uppercase tracking-widest mt-0.5">/YEAR</span>
                        </div>
                      </div>
                    </div>

                    {/* Need 2 Frames Offer Block */}
                    <div className="bg-[#121213] border border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow">
                      <div className="flex items-center gap-3">
                        <div className="text-lg">
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>
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
                          <span>₹1</span>
                          <span>+</span>
                          <span>₹1</span>
                          <span>=</span>
                          <span className="text-white font-extrabold">₹2</span>
                        </div>
                        <span className="text-gray-500 text-[6px] uppercase tracking-wider font-bold mt-0.5">TOTAL 2 FRAMES</span>
                      </div>
                    </div>

                    {/* Error Box */}
                    {goldError && (
                      <div className="bg-red-500/10 border border-red-500/30 p-3.5 rounded-xl text-red-400 text-[10px] leading-relaxed flex items-start gap-1.5">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="text-red-400 mt-0.5 shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{goldError}</span>
                      </div>
                    )}

                    {/* Benefits Grid */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="text-[#D4A04D]">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <h3 className="text-white text-xs font-black uppercase tracking-wider">EYEGLAZE GOLD BENEFITS</h3>
                      </div>
                      <p className="text-gray-500 text-[8px] font-bold uppercase tracking-wider mt-[-6px]">Premium Benefits. Maximum Savings.</p>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          {
                            title: '₹1 PER FRAME',
                            desc: 'Get 1 frame for just ₹1. Take another for just ₹1 anytime. (Total 2 Frames = ₹2)',
                            icon: (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
                                <circle cx="6" cy="12" r="3" />
                                <circle cx="18" cy="12" r="3" />
                                <path d="M9 12h6" />
                              </svg>
                            )
                          },
                          {
                            title: '1+1 FREE FRAMES',
                            desc: 'Buy 1 Get 1 Free on selected frames. Members Only.',
                            icon: (
                              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )
                          },
                          {
                            title: '90% WALLET REFUND',
                            desc: 'If you don\'t take the second frame, get 90% refund to wallet. Valid for 30 days.',
                            icon: (
                              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                            )
                          },
                          {
                            title: '15% CASHBACK',
                            desc: '15% cashback on selected frames. Members Only.',
                            icon: (
                              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            )
                          },
                          {
                            title: 'FREE EYE TEST',
                            desc: 'Partner stores / camps to free eye checkup.',
                            icon: (
                              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            )
                          },
                          {
                            title: 'PRIORITY SUPPORT',
                            desc: 'Fast response and priority assistance for all your queries.',
                            icon: (
                              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            )
                          }
                        ].map((benefit, idx) => (
                          <div key={idx} className="bg-[#121213] border border-zinc-800/60 p-3 rounded-xl flex flex-col gap-1 hover:border-[#D4A04D]/30 transition-all">
                            <div className="flex items-center gap-2">
                              {benefit.icon}
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
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <h5 className="text-white text-[9px] font-black uppercase tracking-wider">EXCLUSIVE DEALS</h5>
                          <p className="text-gray-400 text-[8px] leading-relaxed">
                            Gold Members only get special offers and early access to new launches.
                          </p>
                        </div>
                        <div className="bg-[#121213] border border-zinc-800/60 p-3 rounded-xl flex flex-col gap-1">
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" className="text-[#D4A04D]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
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

                    {/* Trust badges */}
                    <div className="grid grid-cols-4 gap-2 pt-2 text-center text-[7px] text-gray-500 font-bold uppercase tracking-wider">
                      <div className="flex flex-col items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-600">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                        <span>₹129/YEAR</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-600">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span>100% SECURE</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-600">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>30-DAYS VALID</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-600">
                          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        <span>AUTO APPLY</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Sticky Bottom Buy Now Bar */}
              {!goldSuccess && (
                <div className="absolute bottom-0 left-0 right-0 bg-[#0A0A0B] border-t border-zinc-800/80 px-4 py-4 flex items-center justify-between z-10">
                  {user?.membershipActive ? (
                    <div className="w-full bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-3 text-center text-xs font-bold flex items-center justify-center gap-1.5">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <span>ACTIVE GOLD MEMBERSHIP UNTIL {user.membershipExpiry ? new Date(user.membershipExpiry as string | number | Date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '1 YEAR'}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col">
                        <span className="text-white text-[10px] font-black uppercase tracking-wider leading-none">JOIN GOLD MEMBERSHIP</span>
                        <span className="text-[#D4A04D] text-lg font-black leading-none mt-1.5">₹129 <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">/ Year Only</span></span>
                        <span className="text-gray-500 text-[7px] font-bold mt-1 leading-none uppercase">Unlock All Premium Benefits</span>
                      </div>

                      <button
                        onClick={handleUpgrade}
                        disabled={isProcessingGold}
                        className="px-6 py-3 bg-[#D4A04D] hover:bg-[#C8923E] disabled:bg-gray-600 text-black font-black text-xs uppercase rounded-xl shadow-lg transition-transform active:scale-95 border-none cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isProcessingGold ? (
                          <div className="w-4 h-4 border-2 border-t-black border-zinc-800 rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>BUY NOW</span>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
