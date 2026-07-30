import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function CategoriesPage() {
  const sections = [
    {
      title: 'Eyeglasses',
      badge: 'with Power',
      items: [
        {
          label: 'Men',
          img: '/images/men_eyeglasses.png',
          to: '/products?category=prescription&gender=men'
        },
        {
          label: 'Women',
          img: '/images/women_eyeglasses.png',
          to: '/products?category=prescription&gender=women'
        },
        {
          label: 'Kids',
          img: '/images/kids_eyeglasses.png',
          to: '/products?category=prescription&gender=kids'
        },
        {
          label: 'On Sale',
          img: '/images/sale_eyeglasses.png',
          to: '/products?category=prescription&sort=price_asc',
          tag: 'Starts @ ₹800'
        }
      ]
    },
    {
      title: 'Sunglasses',
      items: [
        {
          label: 'Men',
          img: '/images/men_sunglasses.png',
          to: '/products?category=sunglasses&gender=men'
        },
        {
          label: 'Women',
          img: '/images/women_sunglasses.png',
          to: '/products?category=sunglasses&gender=women'
        },
        {
          label: 'Kids',
          img: '/images/kids_sunglasses.png',
          to: '/products?category=sunglasses&gender=kids'
        },
        {
          label: 'On Sale',
          img: '/images/sale_sunglasses.png',
          to: '/products?category=sunglasses&sort=price_asc',
          tag: 'Starts @ ₹500'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white py-6 flex flex-col gap-10 max-w-5xl mx-auto px-4 select-none">
      <SEO 
        title="Shop Eyewear by Category | EyeGlaze"
        description="Browse premium prescription eyeglasses and designer sunglasses for Men, Women, and Kids at EyeGlaze."
        keywords="eyeglasses, sunglasses, men glasses, women glasses, kids glasses, prescription eyewear"
      />
      
      {/* Title */}
      <div className="flex flex-col gap-1 border-b border-[#2A2A2D]/40 pb-4">
        <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider text-white">Shop by Category</h1>
        <p className="text-[#A7A7A7] text-xs font-semibold uppercase tracking-widest mt-0.5">Select from our premium collections</p>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-12">
        {sections.map((sec, idx) => (
          <div key={idx} className="flex flex-col gap-5">
            {/* Section Header */}
            <div className="flex items-center gap-3">
              <h2 className="text-lg md:text-xl font-bold text-white tracking-wide">{sec.title}</h2>
              {sec.badge && (
                <span className="bg-[#ECEFF9] text-[#2C3B75] px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">
                  {sec.badge}
                </span>
              )}
            </div>

            {/* Grid Items */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 w-full">
              {sec.items.map((item, itemIdx) => (
                <Link 
                  key={itemIdx} 
                  to={item.to}
                  className="flex flex-col group cursor-pointer"
                >
                  <div className="w-full aspect-square rounded-2xl bg-[#131314] border border-[#2A2A2D]/80 hover:border-[#D4A04D] overflow-hidden relative transition-all duration-300 p-1 bg-gradient-to-b from-[#1C1C1E] to-[#0E0E0F] flex items-center justify-center shadow-md">
                    
                    {/* Starts-at corner tag */}
                    {item.tag && (
                      <span className="absolute top-1 left-1 bg-[#2C3B75] text-white text-[7px] sm:text-[9px] font-black py-0.5 px-1.5 rounded-md tracking-wide uppercase z-10 shadow-sm">
                        {item.tag}
                      </span>
                    )}

                    <img 
                      src={item.img} 
                      alt={item.label} 
                      className="w-full h-full object-contain p-2 rounded-xl transition-all duration-500 group-hover:scale-102"
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs text-center font-bold text-gray-400 group-hover:text-[#D4A04D] transition-colors mt-2 uppercase tracking-widest leading-none">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
