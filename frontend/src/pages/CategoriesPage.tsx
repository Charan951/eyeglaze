import { Link } from 'react-router-dom';

export default function CategoriesPage() {
  const categories = [
    {
      title: 'Prescription Glasses',
      description: 'Find clear vision and elegant design with our custom spheres and lightweight frames.',
      img: '/images/cat_prescription.png',
      slug: 'prescription',
      count: '120+ Frames'
    },
    {
      title: 'Sunglasses',
      description: 'Protect your eyes from UV rays in absolute style. From classic aviators to modern clubmasters.',
      img: '/images/cat_sunglasses.png',
      slug: 'sunglasses',
      count: '85+ Models'
    },
    {
      title: 'Blue Light Glasses',
      description: 'Protect your eyes from screen fatigue. Specially coated lenses filter blue light from digital devices.',
      img: '/images/cat_blue_light.png',
      slug: 'bluelight',
      count: '50+ Styles'
    },
    {
      title: 'Contact Lenses',
      description: 'Experience ultimate comfort and freedom. High-hydration breathable disposable lenses.',
      img: '/images/cat_contacts.png',
      slug: 'contact',
      count: '30+ Packs'
    },
    {
      title: 'Kids Eyewear',
      description: 'Durable, shatterproof, and colorfully fun glasses designed specifically for active children.',
      img: '/images/cat_kids.png',
      slug: 'kids',
      count: '40+ Colors'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white py-4 flex flex-col gap-8">
      
      {/* Header Info */}
      <div className="flex flex-col gap-2 max-w-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-[2px] bg-[#D4A04D]" />
          <span className="text-[#D4A04D] text-xs font-bold tracking-widest uppercase">Collections</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Shop by Category</h1>
        <p className="text-gray-400 text-sm">
          Discover our curated collections. Hand-crafted premium frames and optical technologies tailored to your exact prescription and lifestyle.
        </p>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat, idx) => (
          <Link 
            key={idx} 
            to={`/products?category=${cat.slug}`}
            className="bg-[#131314] border border-[#2A2A2D] rounded-2xl overflow-hidden hover:border-[#D4A04D]/50 transition-all duration-300 group flex flex-col justify-between"
          >
            {/* Image display */}
            <div className="aspect-[16/10] bg-[#131314] overflow-hidden relative border-b border-[#2A2A2D]">
              <img 
                src={cat.img} 
                alt={cat.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <span className="absolute bottom-3 right-3 bg-black/80 text-[#D4A04D] text-[10px] font-bold py-1 px-3 rounded-full border border-[#D4A04D]/25">
                {cat.count}
              </span>
            </div>

            {/* Description details */}
            <div className="p-5 flex flex-col gap-3 flex-1 justify-between">
              <div className="flex flex-col gap-2">
                <h3 className="text-white text-base font-bold group-hover:text-[#D4A04D] transition-colors">
                  {cat.title}
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  {cat.description}
                </p>
              </div>
              
              <div className="text-[#D4A04D] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mt-3 pt-3 border-t border-[#2A2A2D]/40 group-hover:underline">
                Explore Products <span>→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
