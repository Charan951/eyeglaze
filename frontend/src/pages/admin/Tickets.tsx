import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { socket } from '../../lib/socket';

interface UserInfo {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  phone?: string;
}

interface AdminTicket {
  _id: string;
  ticketId: string;
  user: UserInfo;
  category: string;
  subject: string;
  orderNumber?: string;
  message: string;
  status: 'Open' | 'Resolved';
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'Resolved'>('All');

  // Modal Detail State
  const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null);
  const [adminResponseInput, setAdminResponseInput] = useState('');
  const [statusInput, setStatusInput] = useState<'Open' | 'Resolved'>('Open');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const fetchTickets = () => {
    setLoading(true);
    api.get('/admin/tickets')
      .then((res) => {
        setTickets(res.data?.tickets || []);
      })
      .catch((err) => {
        console.error('Failed to fetch admin tickets:', err);
        setError('Failed to fetch support tickets. Please refresh the page.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTickets();

    socket.on('ticket_changed', fetchTickets);
    return () => {
      socket.off('ticket_changed', fetchTickets);
    };
  }, []);

  const handleOpenDetailModal = (ticket: AdminTicket) => {
    setSelectedTicket(ticket);
    setAdminResponseInput(ticket.adminResponse || '');
    setStatusInput(ticket.status);
    setUpdateSuccess(false);
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setIsUpdating(true);
    try {
      const res = await api.put(`/admin/tickets/${selectedTicket._id}`, {
        status: statusInput,
        adminResponse: adminResponseInput.trim(),
      });

      const updated = res.data?.ticket;
      if (updated) {
        // Update local tickets state
        setTickets(tickets.map(t => t._id === updated._id ? { ...t, ...updated } : t));
        setSelectedTicket({ ...selectedTicket, ...updated });
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to update ticket:', err);
      alert('Failed to update support ticket. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter & Search Logic
  const filteredTickets = tickets.filter(t => {
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesSearch = 
      t.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.orderNumber && t.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#A7A7A7]">
        <div className="w-8 h-8 border-4 border-[#D4A04D] border-t-transparent rounded-full animate-spin" />
        <span>Loading support tickets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Support Tickets</h1>
          <p className="text-gray-500 text-xs">Inspect client inquiries, verify details, and resolve queries.</p>
        </div>
        <div className="text-[#A7A7A7] text-sm bg-[#131314] px-4 py-2 rounded-xl border border-[#2A2A2D]">
          <span className="text-white font-bold">{tickets.length}</span> Total Tickets
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#131314] border border-[#2A2A2D] p-4 rounded-xl">
        <div className="w-full md:w-96 relative">
          <input
            type="text"
            placeholder="Search ID, user, order, or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4A04D]"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {(['All', 'Open', 'Resolved'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-[#D4A04D] text-black border-[#D4A04D]'
                  : 'bg-[#0B0B0C] text-[#A7A7A7] border-[#2A2A2D] hover:border-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table List */}
      <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl overflow-hidden shadow-lg">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-xs">
            No support tickets match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#A7A7A7] text-xs uppercase border-b border-[#2A2A2D]">
                  <th className="text-left px-5 py-4">Ticket Info</th>
                  <th className="text-left px-5 py-4">User Details</th>
                  <th className="text-left px-5 py-4">Subject & Concern</th>
                  <th className="text-left px-5 py-4">Created Date</th>
                  <th className="text-left px-5 py-4">Status</th>
                  <th className="text-center px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map(ticket => (
                  <tr key={ticket._id} className="border-b border-[#2A2A2D] hover:bg-[#1E1E20] transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono text-[#D4A04D] font-bold block">{ticket.ticketId}</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wide">{ticket.category}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-white text-xs font-semibold">{ticket.user?.name || 'Unknown User'}</div>
                      <div className="text-[#A7A7A7] text-xs font-mono">{ticket.user?.email}</div>
                      {ticket.user?.mobile && (
                        <div className="text-[#A7A7A7] text-[10px]">Mob: +91 {ticket.user?.mobile}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <div className="text-white text-xs font-semibold truncate" title={ticket.subject}>
                        {ticket.subject}
                      </div>
                      <p className="text-gray-500 text-[10.5px] line-clamp-1 mt-0.5" title={ticket.message}>
                        {ticket.message}
                      </p>
                      {ticket.orderNumber && (
                        <span className="inline-block mt-1 text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Order: {ticket.orderNumber}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[#A7A7A7] text-xs">
                      {new Date(ticket.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        ticket.status === 'Resolved'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleOpenDetailModal(ticket)}
                        className="bg-[#252528] hover:bg-[#2F2F32] border border-[#3A3A3D] text-white hover:text-[#D4A04D] text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Details Inspection Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131314] border border-[#2A2A2D] w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-[#2A2A2D] px-6 py-4">
              <div>
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Ticket Details</span>
                <div className="flex items-center gap-3 mt-0.5">
                  <h3 className="font-mono text-[#D4A04D] font-extrabold text-base">{selectedTicket.ticketId}</h3>
                  <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    selectedTicket.status === 'Resolved'
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  }`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-500 hover:text-white transition-colors text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              {/* Meta information card */}
              <div className="grid grid-cols-2 gap-4 bg-[#0B0B0C] border border-[#2A2A2D] p-4 rounded-xl text-xs text-gray-400">
                <div>
                  <span className="block text-gray-500 text-[10px] uppercase font-bold mb-0.5">Submitting User</span>
                  <span className="text-white font-semibold block">{selectedTicket.user?.name}</span>
                  <span className="text-[11px] font-mono block">{selectedTicket.user?.email}</span>
                  {selectedTicket.user?.mobile && (
                    <span className="text-[11px] block mt-0.5">Mob: +91 {selectedTicket.user?.mobile}</span>
                  )}
                </div>
                <div>
                  <span className="block text-gray-500 text-[10px] uppercase font-bold mb-0.5">Ticket Info</span>
                  <span className="text-white font-semibold block">Category: {selectedTicket.category}</span>
                  <span className="block mt-0.5">
                    Order Ref: <span className="font-mono text-white">{selectedTicket.orderNumber || 'None'}</span>
                  </span>
                  <span className="block text-[10.5px] mt-0.5">
                    Created: {new Date(selectedTicket.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Subject & Concern Message */}
              <div className="space-y-2">
                <span className="block text-gray-500 text-[10px] uppercase font-bold">Concern details</span>
                <div className="bg-[#1C1C1E] border border-[#2A2A2D] p-4 rounded-xl">
                  <h4 className="text-white font-bold text-xs mb-2 border-b border-[#2A2A2D]/60 pb-1.5">
                    {selectedTicket.subject}
                  </h4>
                  <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-line">
                    {selectedTicket.message}
                  </p>
                </div>
              </div>

              {/* Action Form */}
              <form onSubmit={handleUpdateTicket} className="space-y-4 pt-2 border-t border-[#2A2A2D]/60">
                <h4 className="text-white text-[10px] font-bold uppercase tracking-wider">Respond & Resolve</h4>

                <div className="flex gap-4">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-gray-500 text-[9px] uppercase font-bold">Action / Status</label>
                    <select
                      value={statusInput}
                      onChange={(e) => setStatusInput(e.target.value as 'Open' | 'Resolved')}
                      className="bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4A04D] cursor-pointer"
                    >
                      <option value="Open">Keep Ticket Open</option>
                      <option value="Resolved">Mark as Resolved</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-500 text-[9px] uppercase font-bold">Administrative Response</label>
                  <textarea
                    rows={3}
                    placeholder="Type the response/actions taken to address the user's inquiry..."
                    value={adminResponseInput}
                    onChange={(e) => setAdminResponseInput(e.target.value)}
                    className="bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#D4A04D] resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    {updateSuccess && (
                      <span className="text-green-400 text-xs font-semibold animate-pulse">
                        ✓ Ticket updated successfully!
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(null)}
                      className="bg-[#252528] hover:bg-[#2F2F32] border border-[#3A3A3D] text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-colors cursor-pointer uppercase tracking-wider"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-bold text-xs py-2.5 px-6 rounded-xl transition-colors cursor-pointer uppercase tracking-wider disabled:opacity-50 flex items-center gap-2"
                    >
                      {isUpdating ? 'Saving...' : 'Save Updates'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
