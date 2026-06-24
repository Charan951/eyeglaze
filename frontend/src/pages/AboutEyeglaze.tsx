import { useState } from 'react';
import SEO from '../components/SEO';

interface Step {
  title: string;
  desc: string;
  icon: string;
  detail: string;
}

const PRODUCTION_STEPS: Step[] = [
  {
    title: 'Frame Inspection',
    icon: '🔍',
    desc: 'Each designer frame is inspected for hinge tension, alignment, and structural integrity.',
    detail: 'We verify alignment tolerances up to 0.1mm before admitting the frame to the lens-grinding lab, ensuring no loose temples or structural defects.',
  },
  {
    title: 'Digital Lens Surfacing',
    icon: '💿',
    desc: 'State-of-the-art robotic generators custom-grind prescription values into lens blanks.',
    detail: 'Our automated digital generators surface the back of the lenses with sub-micron diamond polishing bits, creating crystal-clear focus fields.',
  },
  {
    title: 'Edging & Glazing',
    icon: '💎',
    desc: 'Diamond-tipped edgers trim the lens shape to snap flush into frame bevels.',
    detail: 'Using 3D optical tracers, the lens edge profile is cut to match the frame channel exactly, avoiding lens stress which causes optical aberrations.',
  },
  {
    title: 'Double Optometrist Check',
    icon: '🎓',
    desc: 'Opticians inspect focal center alignment using computerized lensmeters.',
    detail: 'Two certified optometrists measure pupil distance (PD) matching and prescription accuracy. Only when both verify does it receive our quality card.',
  },
];

export default function AboutEyeglaze() {
  const [activeStep, setActiveStep] = useState(0);

  const stats = [
    { label: 'Optics Accuracy', value: '100%' },
    { label: 'Fitting SLA', value: '48 Hrs' },
    { label: 'Active Users', value: '45,000+' },
    { label: 'Returns Rate', value: '< 1.2%' },
  ];

  return (
    <div className="space-y-8 text-white min-h-screen pb-12">
      <SEO 
        title="About EyeGlaze | Digital Laboratory & Craftsmanship"
        description="Discover the technology behind EyeGlaze. Learn about our direct-to-consumer frames, computerized lens cutting, and quality control."
      />

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white">About EyeGlaze</h1>
        <p className="text-gray-500 text-sm">
          A behind-the-scenes look at our digital optics laboratory, custom frame fabrications, and the promise of clarity.
        </p>
      </div>

      {/* Story Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-[2px] bg-[#D4A04D]" />
            <span className="text-[#D4A04D] text-xs font-bold tracking-widest uppercase">The EyeGlaze Model</span>
          </div>
          <h2 className="text-xl md:text-3xl font-extrabold tracking-tight leading-snug">
            Premium Optics. <br />
            <span className="text-[#D4A04D]">Without the Retail Surcharges.</span>
          </h2>
          <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
            By handling lens fabrication directly and bypassing high-rent optical shops, we bypass up to 70% of retail markups. We source aerospace-grade titanium and lightweight TR90 thermoplastics to build frames designed for daily comfort.
          </p>
          <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
            Every order is custom-fabricated in our Central Optics Laboratory. From complex progressive prescription mappings to standard blue-light filter coatings, we maintain extreme precision from start to finish.
          </p>
        </div>

        <div className="lg:col-span-5 aspect-[16/10] md:aspect-[2/1] lg:aspect-square bg-[#131314] rounded-2xl border border-[#2A2A2D] p-6 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4A04D_1px,transparent_1px)] [background-size:12px_12px]" />
          <div className="relative z-10 flex items-start justify-between">
            <span className="text-[#D4A04D] text-[10px] uppercase font-bold tracking-wider bg-[#D4A04D]/10 border border-[#D4A04D]/20 px-2 py-0.5 rounded">Lab HQ</span>
            <span className="text-gray-600 text-xs">Sector 3, Gurugram</span>
          </div>
          <div className="relative z-10 space-y-2">
            <div className="text-white text-lg font-bold uppercase tracking-wider">Certified Precision</div>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              We employ computer-controlled diamond grinding generators ensuring lenses fit exactly without edge warp, preserving correct optical center placement.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-5 text-center hover:border-gray-700 transition-colors">
            <div className="text-2xl md:text-3xl font-extrabold text-[#D4A04D]">{stat.value}</div>
            <div className="text-gray-500 text-[9px] uppercase font-bold tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Production Walkthrough Carousel */}
      <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <span>⚙️</span> Lens Fabrication Walkthrough
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Steps selector */}
          <div className="lg:col-span-5 flex flex-col gap-2">
            {PRODUCTION_STEPS.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`flex items-center gap-3 p-4 rounded-xl text-left border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#D4A04D]/10 text-white border-[#D4A04D]/30 shadow-md'
                      : 'bg-[#1C1C1E]/50 border-transparent text-gray-400 hover:bg-[#1C1C1E]'
                  }`}
                >
                  <span className="text-xl">{step.icon}</span>
                  <div>
                    <div className={`text-xs font-bold ${isActive ? 'text-[#D4A04D]' : 'text-white'}`}>
                      Phase {idx + 1}: {step.title}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5 truncate max-w-[200px]">{step.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Interactive display block */}
          <div className="lg:col-span-7 bg-[#1C1C1E] border border-[#2A2A2D] rounded-xl p-6 min-h-[14rem] md:h-56 flex flex-col justify-between gap-6 md:gap-0 relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 right-0 p-8 text-7xl opacity-5 select-none">{PRODUCTION_STEPS[activeStep].icon}</div>
            <div className="space-y-3 relative z-10">
              <span className="text-xs text-[#D4A04D] uppercase tracking-widest font-extrabold">
                Active Process Phase {activeStep + 1}
              </span>
              <h4 className="text-white text-lg font-bold">{PRODUCTION_STEPS[activeStep].title}</h4>
              <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                {PRODUCTION_STEPS[activeStep].detail}
              </p>
            </div>
            <div className="text-gray-600 text-[10px] uppercase font-bold tracking-widest border-t border-[#2A2A2D] pt-3">
              Standard Operating Procedure (SOP) verified
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
