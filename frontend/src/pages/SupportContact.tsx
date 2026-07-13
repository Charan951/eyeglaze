import { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import api from '../lib/api';
import { socket } from '../lib/socket';

interface SupportTicket {
  id: string;
  _id?: string;
  category: string;
  subject: string;
  orderNumber?: string;
  message: string;
  status: 'Open' | 'Resolved';
  adminResponse?: string;
  createdAt: string;
}

export default function SupportContact() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState('General');
  const [subject, setSubject] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTicketId, setSuccessTicketId] = useState<string | null>(null);
  const [showCopied, setShowCopied] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchTickets = () => {
      api.get('/tickets')
        .then((res) => {
          if (!active) return;
          const fetched = (res.data?.tickets || []).map((t: any) => ({
            id: t.ticketId,
            _id: t._id,
            category: t.category,
            subject: t.subject,
            orderNumber: t.orderNumber,
            message: t.message,
            status: t.status,
            adminResponse: t.adminResponse,
            createdAt: t.createdAt,
          }));
          setTickets(fetched);
        })
        .catch((err) => {
          console.error('Failed to fetch support tickets:', err);
          if (active) setError('Failed to retrieve ticket history. Please check back later.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    fetchTickets();

    socket.on('ticket_changed', fetchTickets);

    return () => {
      active = false;
      socket.off('ticket_changed', fetchTickets);
    };
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('support@eyeglaze.com');
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.post('/tickets', {
        category,
        subject: subject.trim(),
        orderNumber: orderNumber.trim() || undefined,
        message: message.trim(),
      });

      const newT = res.data?.ticket;
      if (newT) {
        const mapped: SupportTicket = {
          id: newT.ticketId,
          _id: newT._id,
          category: newT.category,
          subject: newT.subject,
          orderNumber: newT.orderNumber,
          message: newT.message,
          status: newT.status,
          adminResponse: newT.adminResponse,
          createdAt: newT.createdAt,
        };
        setTickets([mapped, ...tickets]);
        setSuccessTicketId(mapped.id);
      }

      // Reset form fields
      setSubject('');
      setOrderNumber('');
      setMessage('');
      setCategory('General');
    } catch (err: any) {
      console.error('Failed to submit ticket:', err);
      setError(err.response?.data?.error || 'Failed to register ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 text-white min-h-screen pb-12">
      <SEO 
        title="Contact Customer Support | EyeGlaze Care Panel"
        description="Direct channel to EyeGlaze support agents. Send tickets, message via WhatsApp, or email our optical verification laboratory."
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Contact Support</h1>
        <p className="text-gray-500 text-sm">
          Get in touch with our certified optometrist panel or general helpline. Choose a channel below or submit an inquiry ticket.
        </p>
      </div>

      {/* Contact Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* WhatsApp Card */}
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-5 flex flex-col justify-between hover:border-green-500/40 transition-colors group">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">💬</span>
              <div>
                <h3 className="text-sm font-bold">WhatsApp Support</h3>
                <span className="text-green-500 text-[10px] uppercase tracking-wider font-semibold">Fast Response</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Message our prescription review panel for swift advice on cylinder, axis, and power readings.
            </p>
          </div>
          <a
            href="https://wa.me/919876543210?text=Hi%20EyeGlaze%20optics%20support%20team,%20I%20have%20a%20question%20regarding%20my%20prescription%20order."
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 w-full text-center bg-green-600 hover:bg-green-500 text-white font-extrabold text-[10px] uppercase py-2.5 rounded-xl transition-colors tracking-wider cursor-pointer"
          >
            Open WhatsApp Chat
          </a>
        </div>

        {/* Email Card */}
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-5 flex flex-col justify-between hover:border-blue-500/40 transition-colors group">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">✉️</span>
              <div>
                <h3 className="text-sm font-bold">Email Desk</h3>
                <span className="text-blue-400 text-[10px] uppercase tracking-wider font-semibold">Response under 12 Hrs</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Email us raw scans of prescription slips, customize request alterations, or send general feedback.
            </p>
          </div>
          <div className="flex gap-2 mt-4">
            <a
              href="mailto:support@eyeglaze.com"
              className="flex-1 text-center bg-[#252528] hover:bg-[#2F2F32] border border-[#3A3A3D] text-white font-extrabold text-[10px] uppercase py-2.5 rounded-xl transition-colors tracking-wider cursor-pointer"
            >
              Compose Mail
            </a>
            <button
              onClick={handleCopyEmail}
              className="px-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 text-xs rounded-xl transition-colors cursor-pointer"
              title="Copy Email Address"
            >
              {showCopied ? 'Copied! ✓' : '📋'}
            </button>
          </div>
        </div>

        {/* Helpline Card */}
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-5 flex flex-col justify-between hover:border-[#D4A04D]/40 transition-colors group">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl w-10 h-10 bg-[#D4A04D]/10 rounded-xl flex items-center justify-center">📞</span>
              <div>
                <h3 className="text-sm font-bold">Toll-Free Helpline</h3>
                <span className="text-[#D4A04D] text-[10px] uppercase tracking-wider font-semibold">10 AM - 7 PM (Mon-Sat)</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Call our Central Optical Laboratory in Gurugram for urgent issues related to delivery dispatch.
            </p>
          </div>
          <a
            href="tel:18004195888"
            className="mt-4 w-full text-center bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-[10px] uppercase py-2.5 rounded-xl transition-colors tracking-wider cursor-pointer"
          >
            Call 1800-419-5888
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Ticket Form */}
        <div className="lg:col-span-7 bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs">
              {error}
            </div>
          )}

          {successTicketId ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-4 animate-scale-up">
              <div className="w-14 h-14 bg-green-500/25 border border-green-500 text-green-500 rounded-full flex items-center justify-center text-2xl font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-white text-base font-bold">Inquiry Ticket Registered</h3>
                <p className="text-[#D4A04D] text-xs font-mono font-bold mt-1">Ticket ID: {successTicketId}</p>
              </div>
              <p className="text-gray-400 text-xs max-w-sm leading-relaxed">
                Thank you! Your ticket has been logged in our support dashboard. Our customer care staff or optics panel will review and follow up shortly.
              </p>
              <button
                onClick={() => setSuccessTicketId(null)}
                className="mt-4 bg-[#D4A04D]/10 hover:bg-[#D4A04D]/20 border border-[#D4A04D]/30 text-[#D4A04D] font-bold text-xs py-2.5 px-6 rounded-xl transition-all cursor-pointer uppercase tracking-wider"
              >
                Submit New Ticket
              </button>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-2">Submit an Inquiry Ticket</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-[#1C1C1E] border border-[#2A2A2D] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4A04D] cursor-pointer"
                  >
                    <option value="General">General Inquiry</option>
                    <option value="Prescription Help">Prescription & Optician Advice</option>
                    <option value="Shipping Delay">Shipping & Logistics Delay</option>
                    <option value="Damage/Return">Damaged Item & Return Claims</option>
                    <option value="Payment Surcharge">Payment Failures & Surcharges</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Order Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. EGO-20260616-0001"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="bg-[#1C1C1E] border border-[#2A2A2D] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4A04D]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="Summary of your concern"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-[#1C1C1E] border border-[#2A2A2D] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4A04D]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Details *</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Describe your issue or custom request details..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-[#1C1C1E] border border-[#2A2A2D] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4A04D] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-black border-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Ticket'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Tickets History List */}
        <div className="lg:col-span-5 bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider border-b border-[#2A2A2D] pb-3 mb-2">
            Ticket History & Logs
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500 text-xs">
              <div className="w-5 h-5 border-2 border-t-white border-transparent rounded-full animate-spin" />
              Loading tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs">No support tickets submitted yet.</div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-96 pr-1">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-[#1C1C1E] border border-[#2A2A2D] rounded-xl p-4 space-y-2.5 text-xs hover:border-gray-700 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-[#D4A04D] font-bold">{ticket.id}</span>
                      <div className="text-gray-500 text-[10px] mt-0.5">
                        {new Date(ticket.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        ticket.status === 'Resolved'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/25'
                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/25'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  <div>
                    <div className="text-white font-bold truncate">{ticket.subject}</div>
                    <div className="text-gray-500 text-[10px] mt-0.5">Category: {ticket.category}</div>
                    {ticket.orderNumber && (
                      <div className="text-gray-500 text-[10px]">Order: {ticket.orderNumber}</div>
                    )}
                  </div>

                  <p className="text-gray-400 leading-relaxed border-t border-[#2A2A2D]/40 pt-2 text-[11px]">
                    {ticket.message}
                  </p>

                  {ticket.adminResponse && (
                    <div className="bg-[#131314] border border-[#2E2E31] rounded-xl p-3 mt-2 space-y-1">
                      <div className="text-[#D4A04D] text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <span>💬</span> Admin Response
                      </div>
                      <p className="text-gray-300 text-[10.5px] leading-relaxed">
                        {ticket.adminResponse}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
