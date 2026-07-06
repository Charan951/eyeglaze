import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import BrandIcon from '../components/BrandIcon';
import api from '../lib/api';
import { socket } from '../lib/socket';

export default function UserLayout() {
  const { user, cartCount, wishlist, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  const hoverTimeoutRef = useRef<any>(null);

  // Fetch products on mount and setup socket listener
  useEffect(() => {
    const fetchProductsForPrices = async () => {
      try {
        const res = await api.get('/products?limit=1000');
        setProducts(res.data.products || []);
      } catch (err) {
        console.error('Failed to fetch products for navbar pricing:', err);
      }
    };
    fetchProductsForPrices();

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
            genderMatch = p.gender.some((g: string) => g.toLowerCase() === genderVal.toLowerCase() || g.toLowerCase() === 'unisex');
          } else {
            genderMatch = p.gender.toLowerCase() === genderVal.toLowerCase() || p.gender.toLowerCase() === 'unisex';
          }
        } else {
          genderMatch = genderVal.toLowerCase() === 'unisex';
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

  // Fetch navigation categories on mount
  useEffect(() => {
    let active = true;
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories/tree');
        if (!active) return;
        setCategories(res.data.tree || []);
      } catch (err) {
        console.error('Failed to fetch navbar categories:', err);
        // Fallback default structure
        if (!active) return;
        setCategories([
          {
            id: 'default-eye',
            name: 'Eyeglasses',
            slug: 'prescription',
            icon: '👓',
            children: [
              { name: 'Men', slug: 'men' },
              { name: 'Women', slug: 'women' },
              { name: 'Kids', slug: 'kids' },
            ]
          },
          {
            id: 'default-sun',
            name: 'Sunglasses',
            slug: 'sunglasses',
            icon: '🕶️',
            children: [
              { name: 'Men', slug: 'men' },
              { name: 'Women', slug: 'women' },
              { name: 'Kids', slug: 'kids' },
            ]
          }
        ]);
      }
    };
    fetchCategories();

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
          items: getDynamicProducts('prescription', 'men')
        },
        {
          title: 'WOMEN Eyeglasses',
          badge: 'with FREE lenses',
          image: '/images/women_eyeglasses.png',
          items: getDynamicProducts('prescription', 'women')
        },
        {
          title: 'KIDS Eyeglasses',
          badge: 'with FREE lenses',
          image: '/images/kids_eyeglasses.png',
          items: getDynamicProducts('prescription', 'kids')
        }
      ];
    } else if (isSunglasses) {
      columns = [
        {
          title: 'MEN Sunglasses',
          badge: 'Polarized with UV',
          image: '/images/men_sunglasses.png',
          items: getDynamicProducts('sunglasses', 'men')
        },
        {
          title: 'WOMEN Sunglasses',
          badge: 'Polarized with UV',
          image: '/images/women_sunglasses.png',
          items: getDynamicProducts('sunglasses', 'women')
        },
        {
          title: 'KIDS Sunglasses',
          badge: 'Polarized with UV',
          image: '/images/kids_sunglasses.png',
          items: getDynamicProducts('sunglasses', 'kids')
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
                            →
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



  // Close menus when route/pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [location.pathname]);

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

  return (
    <div className="min-h-screen bg-[#0B0B0C] w-full overflow-x-clip">
      {!isCustomerPage && (
        <header className="bg-[#0B0B0C]/95 backdrop-blur-md border-b border-[#2A2A2D] fixed top-0 left-0 right-0 z-50 w-full transition-colors duration-300">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 md:px-12 lg:px-16 relative z-10">
            {/* Mobile / Tablet Left Menu and Back Actions */}
            <div className="flex items-center gap-1.5 xl:hidden">
              {location.pathname !== '/' && (
                <button 
                  onClick={() => navigate(-1)} 
                  className="text-gray-400 hover:text-white p-1 focus:outline-none transition-colors cursor-pointer bg-transparent border-none"
                  aria-label="Go Back"
                >
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              )}
            </div>

            {/* Desktop Left Tagline (FREE SHIPPING • 7-DAY RETURNS) */}
            <div className="hidden xl:flex items-center gap-1.5 text-[9px] text-gray-500 tracking-widest uppercase font-bold select-none">
              <span>Free Shipping</span>
              <span className="w-1 h-1 bg-[#D4A04D] rounded-full" />
              <span>7-Day Returns</span>
            </div>

            {/* Logo - Centered on both Mobile and Desktop */}
            <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center select-none text-center">
              <span className="text-[#D4A04D] font-serif text-xl md:text-2xl tracking-[0.25em] uppercase font-bold leading-none">EYEGLAZE</span>
              <span className="text-[#D4A04D]/80 font-sans text-[8px] md:text-[9px] tracking-[0.4em] uppercase mt-0.5">EYEWEAR</span>
            </Link>

            {/* Right Actions */}
            <div className="flex items-center gap-3.5 md:gap-6 z-10">
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

                  {isProfileDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsProfileDropdownOpen(false)} />
                      <div className="absolute right-0 mt-3 w-52 max-h-[85vh] overflow-y-auto overscroll-y-contain bg-[#0F0F10]/95 backdrop-blur-md border border-[#D4A04D]/25 rounded-2xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.6),_0_0_20px_rgba(212,160,77,0.05)] z-50 animate-fade-in scrollbar-none">
                        {/* Dropdown Header */}
                        <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#2A2A2D] select-none">
                          <div className="w-8 h-8 bg-gradient-to-br from-[#D4A04D] to-[#8b6524] text-black font-serif font-black rounded-full flex items-center justify-center text-xs uppercase shadow-[0_0_10px_rgba(212,160,77,0.15)]">
                            {user.name ? user.name[0].toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="text-white text-xs font-black truncate">{user.name || 'Customer'}</div>
                            <div className="text-gray-500 text-[10px] truncate mt-0.5">{user.email || ''}</div>
                            {user.membershipActive && (
                              <div className="inline-flex items-center gap-0.5 text-[9px] text-[#D4A04D] font-extrabold uppercase mt-1">
                                <BrandIcon name="👑" className="w-3 h-3 text-[#D4A04D]" /> Gold Member
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Dropdown Navigation */}
                        <nav className="mt-2 space-y-0.5">
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
                              onClick={() => setIsProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-400 hover:bg-[#131314] hover:text-white transition-colors"
                            >
                              <BrandIcon name={icon} className="w-3.5 h-3.5 text-[#D4A04D]" />
                              <span>{label}</span>
                            </Link>
                          ))}
                        </nav>

                        {/* Dropdown Footer / Logout */}
                        <div className="mt-2 pt-2 border-t border-[#2A2A2D]">
                          <button
                            onClick={async () => {
                              setIsProfileDropdownOpen(false);
                              await logout();
                              navigate('/');
                            }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left text-xs font-bold text-red-400 hover:bg-red-500/5 hover:text-red-300 transition-colors bg-transparent border-none cursor-pointer"
                          >
                            <BrandIcon name="🚪" className="w-3.5 h-3.5 text-[#D4A04D]" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
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
        isCustomerPage 
          ? "w-full min-h-screen" 
          : isHomePage 
            ? "w-full mt-16" 
            : "w-full px-4 sm:px-6 md:px-12 lg:px-16 py-8 mt-16 xl:mt-28"
      }>
        <Outlet />
      </main>

      {isHomePage && <Footer />}
    </div>
  );
}
