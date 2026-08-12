import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQ[] = [
  {
    category: 'General',
    question: 'What is EyeGlaze?',
    answer: 'EyeGlaze is a premium direct-to-consumer eyewear brand. We eliminate middleman markup by running our own state-of-the-art optical laboratory and shipping custom-fitted designer prescription glasses straight to you.',
  },
  {
    category: 'General',
    question: 'Do you have physical retail stores?',
    answer: 'To keep our prices affordable and quality premium, we operate exclusively online. However, we offer an interactive 7-day return policy to guarantee that you are fully satisfied with your fit and prescription.',
  },
  {
    category: 'General',
    question: 'What is Pupillary Distance (PD) and how is it measured?',
    answer: 'Pupillary Distance is the distance between your pupil centers in millimeters. It ensures your lens optical center align with your pupils. You can find this on your prescription, or measure it using a ruler and mirror, or ask our optician panel during verification.',
  },
  {
    category: 'Orders & Shipping',
    question: 'How long does delivery take?',
    answer: 'Standard prescription frames are fabricated, inspected, and shipped within 3 to 5 business days. Transit time is generally 2 business days. Express shipping is also available during checkout.',
  },
  {
    category: 'Orders & Shipping',
    question: 'Can I track my order?',
    answer: 'Yes! Once your frames leave our optics laboratory, a shipment confirmation email with a tracking number (e.g. Bluedart or Delhivery) is sent to you. You can also monitor live progress in the "My Orders" tab.',
  },
  {
    category: 'Orders & Shipping',
    question: 'How do I cancel or modify an order?',
    answer: 'Since prescription lenses are custom-ground to your exact parameters, we begin processing orders quickly. Please contact our support desk or email us within 2 hours of placement to request modifications or cancellations.',
  },
  {
    category: 'Prescriptions & Lenses',
    question: 'How do I upload my optical prescription?',
    answer: 'You can submit your prescription parameters directly during the frame customizer flow, or upload an image file of your prescription during checkout. Alternatively, select the option to "Email Later" and send a copy to rx@eyeglaze.com.',
  },
  {
    category: 'Prescriptions & Lenses',
    question: 'Do you support bifocal or progressive lenses?',
    answer: 'Yes! We support premium digital progressives and bifocals. During the lens customization wizard, select the Progressive option to configure multi-focal distances.',
  },
  {
    category: 'Prescriptions & Lenses',
    question: 'What lens coatings do you offer?',
    answer: 'All our custom prescription lenses come standard with Anti-Reflective, Scratch-Resistant, and UV400 Protection coatings at no extra charge. We also offer premium upgrades for Blue-Light Blocking and Photochromic (Transition) coatings.',
  },
  {
    category: 'Payments & Security',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit and debit cards (Visa, Mastercard, American Express, RuPay), Netbanking, and popular digital wallets (Google Pay, Paytm, PhonePe, and Apple Pay).',
  },
  {
    category: 'Payments & Security',
    question: 'Is my payment information secure?',
    answer: 'Absolutely. We do not store your credit card CVV numbers. All financial transactions are encrypted using 256-bit SSL tokens and processed securely through PCI-DSS certified gateway networks.',
  },
];

export default function SupportQuestions() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedIndices, setExpandedIndices] = useState<Record<string, boolean>>({});

  const categories = useMemo(() => {
    const unique = new Set(FAQS.map((f) => f.category));
    return ['All', ...Array.from(unique)];
  }, []);

  const toggleAccordion = (key: string) => {
    setExpandedIndices((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
      const matchesSearch =
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="space-y-8 text-white min-h-screen pb-12">
      <SEO
        title="Help Center FAQs | Optical Queries Answered"
        description="Browse help topics on frame sizing, prescription verification, order tracking, and optical lens coatings at EyeGlaze Support."
      />

      {/* Mobile-only Back to Profile */}
      <button
        type="button"
        onClick={() => navigate('/profile')}
        className="md:hidden inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#D4A04D] font-bold transition-colors cursor-pointer bg-transparent border-none p-0"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Profile</span>
      </button>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white">Ask Questions</h1>
        <p className="text-gray-500 text-sm">
          Search our comprehensive knowledge database or select a category below to find instant answers.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-xl">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for keywords (e.g. prescription, delivery, billing)..."
          className="w-full bg-[#131314] border border-[#2A2A2D] focus:border-[#D4A04D] focus:outline-none rounded-xl py-3.5 pl-11 pr-4 text-xs text-white placeholder-gray-500 transition-colors"
        />
        <span className="absolute left-4 top-3.5 text-base text-gray-500">🔍</span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-3.5 text-gray-400 hover:text-white text-xs cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs font-bold py-2 px-4 rounded-xl border transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#D4A04D] text-black border-[#D4A04D]'
                : 'bg-[#131314] border-[#2A2A2D] text-gray-400 hover:text-white hover:border-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion Questions List */}
      <div className="max-w-3xl space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-8 text-center text-gray-500 text-sm">
            No FAQ matches found for "{searchQuery}". Try typing other keywords or check under another category.
          </div>
        ) : (
          filteredFaqs.map((faq, index) => {
            const itemKey = `${faq.category}-${index}`;
            const isOpen = !!expandedIndices[itemKey];

            return (
              <div
                key={itemKey}
                className="bg-[#131314] border border-[#2A2A2D] rounded-xl overflow-hidden hover:border-gray-700 transition-colors"
              >
                <button
                  onClick={() => toggleAccordion(itemKey)}
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-xs md:text-sm text-white select-none cursor-pointer bg-transparent border-none focus:outline-none"
                >
                  <span className="pr-4">{faq.question}</span>
                  <span
                    className={`text-xs text-[#D4A04D] transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : 'rotate-0'
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {/* Smooth Expandable Drawer */}
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-52 opacity-100 border-t border-[#2A2A2D]/40' : 'max-h-0 opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="p-4 text-xs md:text-sm text-gray-400 leading-relaxed bg-[#0E0E0F]/40">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom FAQ Help Note */}
      <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 max-w-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-8">
        <div>
          <h4 className="text-white text-sm font-bold uppercase tracking-wider">Still have questions?</h4>
          <p className="text-gray-500 text-xs mt-1">Our support staff is ready to help you with personalized optical advice.</p>
        </div>
        <a
          href="/support/contact"
          className="bg-[#D4A04D]/10 hover:bg-[#D4A04D]/20 border border-[#D4A04D]/30 text-[#D4A04D] font-bold text-xs py-2 px-5 rounded-xl transition-all cursor-pointer whitespace-nowrap"
        >
          Contact Support Panel
        </a>
      </div>
    </div>
  );
}
