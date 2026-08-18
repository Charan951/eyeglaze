import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

export type HomepageSection = {
  _id?: string;
  sectionType: 'special_promo' | 'new_arrivals' | 'eyeglaze_edit';
  position: string;
  displayOrder?: number;
  isActive?: boolean;
  showOnMobile?: boolean;
  tag?: string;
  headline?: string;
  description?: string;
  buttonText?: string;
  linkUrl?: string;
  imageUrl?: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
  items?: Array<{
    title?: string;
    style?: string;
    description?: string;
    imageUrl?: string;
    linkUrl?: string;
    buttonText?: string;
  }>;
};

export function sectionsForPosition(
  sections: HomepageSection[],
  position: string,
  opts?: { mobile?: boolean }
) {
  return sections
    .filter((section) => {
      if (section.isActive === false) return false;
      if (opts?.mobile && section.showOnMobile === false) return false;
      if (section.position === position) return true;
      if (section.position === 'both' && (position === 'eyeglasses_landing' || position === 'footer')) {
        return true;
      }
      return false;
    })
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
}

export function HomePromoCard({
  section,
  compact = false,
  flush = false,
}: {
  section: HomepageSection;
  compact?: boolean;
  flush?: boolean;
}) {
  const navigate = useNavigate();
  const href = section.linkUrl || '/products';

  return (
    <div className={`w-full ${flush ? '' : compact ? 'my-2' : 'my-4'}`}>
      <div className={`bg-[#131314] border border-[#2A2A2D] rounded-2xl ${compact ? 'p-3 min-h-[110px]' : 'p-3 sm:p-6 min-h-[110px] sm:min-h-[160px]'} flex items-center justify-between relative overflow-hidden group hover:border-[#D4A04D]/50 transition-all duration-300 w-full`}>
        <div className={`flex flex-col gap-1 ${compact ? '' : 'sm:gap-2'} ${compact ? 'max-w-[60%]' : 'max-w-[60%] sm:max-w-[55%]'} z-10`}>
          {section.tag && (
            <span className={`${section.sectionType === 'new_arrivals' ? 'text-[#D4A04D]' : 'text-white'} ${compact ? 'text-[9px]' : 'text-[7px] sm:text-[10px]'} font-bold tracking-widest uppercase`}>
              {section.tag}
            </span>
          )}
          {section.headline && (
            <h3 className={`${section.sectionType === 'new_arrivals' ? 'text-white' : 'text-[#D4A04D]'} ${compact ? 'text-sm' : 'text-xs sm:text-2xl'} font-extrabold leading-none ${compact ? '' : 'sm:leading-tight'}`}>
              {section.headline}
            </h3>
          )}
          {section.description && (
            <p className={`text-gray-400 ${compact ? 'text-[10px]' : 'text-[8px] sm:text-xs'} font-semibold leading-tight line-clamp-1 ${compact ? '' : 'sm:line-clamp-none'}`}>
              {section.description}
            </p>
          )}
          {section.buttonText && (
            <button
              onClick={() => navigate(href)}
              className={`${compact ? 'mt-1.5 text-[9px] py-1 px-2.5' : 'mt-1.5 sm:mt-3 text-[7px] sm:text-[10px] py-1 px-2.5 sm:py-2 sm:px-4'} w-fit border border-[#D4A04D] text-[#D4A04D] hover:bg-[#D4A04D] hover:text-black font-bold uppercase rounded transition-all duration-300 cursor-pointer`}
            >
              {section.buttonText}
            </button>
          )}
        </div>
        {section.imageUrl && (
          <div className="w-2/5 md:w-1/2 h-full absolute right-0 top-0 bottom-0">
            <img
              src={section.imageUrl}
              alt={section.headline || section.tag || ''}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}

type LookCard = {
  title?: string;
  style?: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  buttonText?: string;
};

function lookCardsFrom(sections: HomepageSection[]): LookCard[] {
  const cards: LookCard[] = [];
  for (const section of sections) {
    if (section.items?.length) {
      cards.push(...section.items);
      continue;
    }
    if (!section.headline && !section.imageUrl) continue;
    cards.push({
      title: section.headline,
      style: section.tag,
      description: section.description,
      imageUrl: section.imageUrl,
      linkUrl: section.linkUrl,
      buttonText: section.buttonText,
    });
  }
  return cards;
}

export function HomeEditCarousel({ sections }: { sections: HomepageSection[] }) {
  const navigate = useNavigate();
  const items = lookCardsFrom(sections);
  if (!items.length) return null;
  const heading = sections.find((section) => section.sectionTitle)?.sectionTitle || 'The EyeGlaze Edit: Styled by Icons';
  const subtitle = sections.find((section) => section.sectionSubtitle)?.sectionSubtitle;

  return (
    <section className="w-full py-4 border-t border-[#1C1C1E] flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold uppercase tracking-wider text-white">{heading}</h2>
        {subtitle && (
          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">
            {subtitle}
          </span>
        )}
      </div>
      <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none w-full pb-4">
        {items.map((trend, idx) => (
          <div
            key={`${trend.title}-${idx}`}
            className="flex-shrink-0 w-[70vw] sm:w-[235px] md:w-[245px] snap-start bg-[#121212] border border-[#2A2A2D] rounded-2xl overflow-hidden group hover:border-[#D4A04D]/50 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-[#131314] relative">
              {trend.imageUrl && (
                <img
                  src={trend.imageUrl}
                  alt={trend.title || ''}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
            </div>
            <div className="p-4 flex flex-col gap-1.5 flex-1 justify-between">
              <div className="flex flex-col gap-1">
                {trend.style && (
                  <span className="text-[#D4A04D] text-[10px] font-bold uppercase tracking-wider">{trend.style}</span>
                )}
                {trend.title && <h3 className="text-white text-xs font-bold">{trend.title}</h3>}
                {trend.description && (
                  <p className="text-gray-400 text-[10px] leading-relaxed mt-1 font-semibold">{trend.description}</p>
                )}
              </div>
              <button
                onClick={() => navigate(trend.linkUrl || '/products')}
                className="w-full mt-3 border border-[#2A2A2D] group-hover:border-[#D4A04D] text-white group-hover:text-black group-hover:bg-[#D4A04D] text-[10px] font-bold py-2 rounded-lg transition-all cursor-pointer"
              >
                {trend.buttonText || 'SHOP THE LOOK'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomepageSectionBlock({
  section,
  compact = false,
}: {
  section: HomepageSection;
  compact?: boolean;
}) {
  if (section.sectionType === 'eyeglaze_edit') {
    return <HomeEditCarousel sections={[section]} />;
  }
  return <HomePromoCard section={section} compact={compact} />;
}

function PromoCardCarousel({
  sections,
  compact = false,
}: {
  sections: HomepageSection[];
  compact?: boolean;
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (sections.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % sections.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sections.length]);

  if (!sections.length) return null;
  if (sections.length === 1) {
    return <HomePromoCard section={sections[0]} compact={compact} />;
  }

  return (
    <div className={`relative w-full ${compact ? 'my-2' : 'my-4'}`}>
      <div className={`relative overflow-hidden ${compact ? 'min-h-[110px]' : 'min-h-[110px] sm:min-h-[160px]'}`}>
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={sections[current]._id || current}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35 }}
          >
            <HomePromoCard section={sections[current]} compact={compact} flush />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex justify-center gap-1.5 mt-2">
        {sections.map((section, i) => (
          <button
            key={section._id || i}
            type="button"
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer border-none ${
              current === i ? 'bg-[#D4A04D] w-4' : 'bg-gray-600 w-1.5'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export function HomepageSectionsAtPosition({
  sections,
  compact = false,
}: {
  sections: HomepageSection[];
  compact?: boolean;
}) {
  if (!sections.length) return null;

  const groups: Array<{ type: string; items: HomepageSection[] }> = [];
  for (const section of sections) {
    const last = groups[groups.length - 1];
    if (last && last.type === section.sectionType) {
      last.items.push(section);
    } else {
      groups.push({ type: section.sectionType, items: [section] });
    }
  }

  return (
    <>
      {groups.map((group, index) => {
        if (group.type === 'eyeglaze_edit') {
          return <HomeEditCarousel key={`eyeglaze-edit-${index}`} sections={group.items} />;
        }
        return (
          <PromoCardCarousel
            key={`${group.type}-${index}`}
            sections={group.items}
            compact={compact}
          />
        );
      })}
    </>
  );
}
