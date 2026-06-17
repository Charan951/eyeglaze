import { useState } from 'react';
import SEO from '../components/SEO';

export default function Contact() {
  const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.message) return;
    
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormState({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white py-4 flex flex-col gap-10">
      <SEO 
        title="Contact Us | Optical Labs & Customer Care"
        description="Get in touch with EyeGlaze support. Contact our central optics laboratory, optometrist panel, or check out our toll-free phone number and locations."
        keywords="eyeglaze contact, customer care helpline, central laboratory gurugram, optical queries support"
      />
      
      {/* Intro Header */}
      <div className="flex flex-col gap-2 max-w-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-[2px] bg-[#D4A04D]" />
          <span className="text-[#D4A04D] text-xs font-bold tracking-widest uppercase">Connect</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Contact Us</h1>
        <p className="text-gray-400 text-sm">
          Have a question about your prescription, frame sizing, or delivery? Reach out and our optics support team will respond within 12 hours.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Contact Form Card */}
        <div className="lg:col-span-7 bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 md:p-8">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-4 animate-scale-up">
              <div className="w-16 h-16 bg-green-500/20 border border-green-500 rounded-full flex items-center justify-center text-green-500 text-3xl">
                ✓
              </div>
              <h3 className="text-white text-lg font-bold">Message Sent Successfully</h3>
              <p className="text-gray-400 text-xs max-w-sm">
                Thank you for contacting EyeGlaze! Our optometrist panel or support staff will review your message and reply via email shortly.
              </p>
              <button 
                onClick={() => setIsSuccess(false)}
                className="mt-4 border border-[#D4A04D] text-[#D4A04D] hover:bg-[#D4A04D] hover:text-black font-semibold text-xs py-2.5 px-6 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <h2 className="text-white text-base font-bold uppercase tracking-wider mb-2">Send an Inquiry</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Your Name *</label>
                  <input 
                    type="text" 
                    id="name"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    placeholder="Enter name"
                    className="bg-[#1C1C1E] border border-[#2A2A2D] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4A04D]"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Email Address *</label>
                  <input 
                    type="email" 
                    id="email"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    placeholder="Enter email"
                    className="bg-[#1C1C1E] border border-[#2A2A2D] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4A04D]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="subject" className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Subject</label>
                <input 
                  type="text" 
                  id="subject"
                  value={formState.subject}
                  onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                  placeholder="e.g. Order Tracking, Lens surcharges"
                  className="bg-[#1C1C1E] border border-[#2A2A2D] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4A04D]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="message" className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Your Message *</label>
                <textarea 
                  id="message"
                  required
                  rows={5}
                  value={formState.message}
                  onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  placeholder="Type message details..."
                  className="bg-[#1C1C1E] border border-[#2A2A2D] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4A04D] resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="bg-[#D4A04D] text-black hover:bg-[#C8923E] font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl mt-2 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-black border-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Support details */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Quick Contacts */}
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-white text-xs font-bold uppercase tracking-widest border-b border-[#2A2A2D] pb-2.5">Customer Care</h3>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span className="text-base text-[#D4A04D] mt-0.5">📞</span>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-[8px] uppercase tracking-wider">Toll-Free Support</span>
                  <span className="text-white text-xs font-bold">1800-419-5888</span>
                  <span className="text-gray-500 text-[9px] mt-0.5">10:00 AM - 7:00 PM (Mon - Sat)</span>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-base text-[#D4A04D] mt-0.5">✉️</span>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-[8px] uppercase tracking-wider">Email Inquiry</span>
                  <span className="text-white text-xs font-bold">support@eyeglaze.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Locator */}
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-white text-xs font-bold uppercase tracking-widest border-b border-[#2A2A2D] pb-2.5">Central Optics Lab</h3>
            <div className="flex items-start gap-3">
              <span className="text-base text-[#D4A04D] mt-0.5">📍</span>
              <div className="flex flex-col gap-1">
                <span className="text-white text-xs font-bold">EyeGlaze Laboratory Center</span>
                <span className="text-gray-400 text-xs leading-relaxed">
                  201, Outer Ring Road, Optical Hub Sector 3, <br />
                  Gurugram, Haryana - 122001, India.
                </span>
              </div>
            </div>
            
            {/* Mock map graphic */}
            <div className="aspect-[16/7] bg-[#131314] border border-[#2A2A2D]/60 rounded-xl overflow-hidden relative flex items-center justify-center">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#2A2A2D_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="relative flex flex-col items-center gap-1">
                <div className="w-4 h-4 bg-[#D4A04D] rounded-full flex items-center justify-center animate-bounce shadow-lg">
                  <div className="w-1.5 h-1.5 bg-black rounded-full" />
                </div>
                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest bg-black/80 border border-[#2A2A2D]/40 px-2 py-0.5 rounded">Lab Location Locked</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
