export default function Blogs() {
  const articles = [
    {
      title: 'How to Choose the Perfect Frame for Your Face Shape',
      excerpt: 'Struggling to find frames that fit? Learn the secrets of matching rectangular, round, and geometric frames to oval, square, and heart-shaped faces.',
      image: '/images/hero_model.png',
      date: 'June 15, 2026',
      readTime: '4 min read',
      tag: 'Styling Guide'
    },
    {
      title: 'What is Blue Light and Do You Really Need Blocking Lenses?',
      excerpt: 'With screen times at an all-time high, digital eye strain is a growing concern. Learn how blue cut lenses work and if they are worth the upgrade.',
      image: '/images/cat_blue_light.png',
      date: 'May 28, 2026',
      readTime: '6 min read',
      tag: 'Eye Health'
    },
    {
      title: 'Understanding Lens Index: From Standard to Ultra-Thin',
      excerpt: 'Having a high prescription does not mean you need thick lenses. Compare 1.56, 1.61, and 1.67 lens indexes to find the perfect thin profile.',
      image: '/images/cat_prescription.png',
      date: 'April 12, 2026',
      readTime: '5 min read',
      tag: 'Lens Tech'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white py-4 flex flex-col gap-8">
      
      {/* Header Info */}
      <div className="flex flex-col gap-2 max-w-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-[2px] bg-[#D4A04D]" />
          <span className="text-[#D4A04D] text-xs font-bold tracking-widest uppercase">Journal</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Blogs & Insights</h1>
        <p className="text-gray-400 text-sm">
          Stay informed with the latest trends in designer eyewear, optical technologies, and expert tips on maintaining vision health.
        </p>
      </div>

      {/* Grid of Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, idx) => (
          <article 
            key={idx}
            className="bg-[#131314] border border-[#2A2A2D] hover:border-[#D4A04D]/40 transition-all duration-300 rounded-2xl overflow-hidden flex flex-col justify-between group"
          >
            {/* Header image */}
            <div className="aspect-video bg-[#131314] overflow-hidden border-b border-[#2A2A2D] relative">
              <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
              <span className="absolute top-3 left-3 bg-black/80 text-[#D4A04D] border border-[#D4A04D]/25 text-[9px] font-bold py-1 px-3 rounded-full uppercase tracking-wider">
                {article.tag}
              </span>
            </div>

            {/* Content area */}
            <div className="p-5 flex flex-col gap-3 flex-1 justify-between">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-gray-500 text-[10px]">
                  <span>{article.date}</span>
                  <span className="w-1.5 h-1.5 bg-[#2A2A2D] rounded-full" />
                  <span>{article.readTime}</span>
                </div>
                <h3 className="text-white text-base font-bold group-hover:text-[#D4A04D] transition-colors leading-tight">
                  {article.title}
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">
                  {article.excerpt}
                </p>
              </div>

              <div className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mt-4 pt-3 border-t border-[#2A2A2D]/40 group-hover:text-[#D4A04D] transition-colors cursor-pointer">
                Read Article <span>→</span>
              </div>
            </div>
          </article>
        ))}
      </div>

    </div>
  );
}
