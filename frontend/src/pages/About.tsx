export default function About() {
  const brandPillars = [
    {
      title: 'Precision Craftsmanship',
      description: 'Each set of lenses is digitally surfaced and diamond-polished in our state-of-the-art laboratory for absolute visual clarity.',
      icon: '🔬'
    },
    {
      title: 'Premium Materials',
      description: 'We use aerospace-grade titanium, surgical stainless steel, and TR90 thermoplastic to build frames that are extremely durable and lightweight.',
      icon: '🛡️'
    },
    {
      title: 'Personalized Customization',
      description: 'From pupillary distance mapping to custom lens coatings (blue protection, photogrey, anti-scratch), we build frames made specifically for you.',
      icon: '👓'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white py-4 flex flex-col gap-10">
      
      {/* Brand Intro Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-[2px] bg-[#D4A04D]" />
            <span className="text-[#D4A04D] text-xs font-bold tracking-widest uppercase">Our Story</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Redefining Eyewear. <br />
            <span className="text-[#D4A04D]">One Frame at a Time.</span>
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Founded in 2026, EyeGlaze was built on a simple yet revolutionary idea: high-end prescription eyewear shouldn't be overpriced. By eliminating unnecessary markups, managing our own lens surfacing laboratory, and working directly with frame fabricators, we bring premium style and optical precision straight to your doorstep.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Whether you need computer-friendly blue cut lenses, high-index progressives, or fashionable designer sunglasses, our mission is to deliver the perfect vision solution matching your unique style.
          </p>
        </div>
        <div className="lg:col-span-5 aspect-[4/3] bg-[#131314] rounded-2xl overflow-hidden border border-[#2A2A2D]">
          <img src="/images/hero_model.png" alt="EyeGlaze Crafting" className="w-full h-full object-cover filter brightness-95" />
        </div>
      </div>

      {/* Brand Pillars */}
      <div className="flex flex-col gap-6 border-t border-[#2A2A2D] pt-10">
        <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wider text-center">The EyeGlaze Promise</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {brandPillars.map((pillar, idx) => (
            <div key={idx} className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 flex flex-col gap-3">
              <span className="text-3xl">{pillar.icon}</span>
              <h3 className="text-white text-base font-bold mt-2">{pillar.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lab detail block */}
      <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col gap-2 max-w-xl">
          <h3 className="text-[#D4A04D] text-lg font-bold uppercase tracking-wider">High-Precision Surfacing Lab</h3>
          <p className="text-gray-400 text-xs leading-relaxed">
            All lenses are custom-ground to prescription values under strict quality control. Our certified optometrists inspect each frame to ensure exact visual alignment before shipping.
          </p>
        </div>
        <div className="flex gap-4 shrink-0 text-center">
          <div className="flex flex-col">
            <span className="text-white font-extrabold text-3xl">100%</span>
            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mt-1">Accuracy</span>
          </div>
          <div className="w-[1px] h-10 bg-[#2A2A2D]" />
          <div className="flex flex-col">
            <span className="text-white font-extrabold text-3xl">₹0</span>
            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mt-1">Fitting Fees</span>
          </div>
        </div>
      </div>

    </div>
  );
}
