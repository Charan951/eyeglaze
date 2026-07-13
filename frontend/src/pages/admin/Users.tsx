import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

interface AdminUserRow {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  createdAt: string;
  ordersCount: number;
  role: string;
  membershipActive: boolean;
  isBlocked?: boolean;
}

const mockUsers: AdminUserRow[] = [
  { _id: 'u1', name: 'Rahul Sharma', phone: '9876543210', email: 'rahul@email.com', createdAt: '2026-01-10', ordersCount: 5, role: 'user', membershipActive: true },
  { _id: 'u2', name: 'Priya Patel', phone: '9123456780', email: 'priya@email.com', createdAt: '2026-02-15', ordersCount: 3, role: 'user', membershipActive: false },
  { _id: 'u3', name: 'Amit Kumar', phone: '', email: 'amit@company.com', createdAt: '2026-03-20', ordersCount: 8, role: 'user', membershipActive: true },
  { _id: 'u4', name: 'Admin User', phone: '', email: 'admin@eyeglaze.com', createdAt: '2025-12-01', ordersCount: 0, role: 'admin', membershipActive: false },
];

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUserRow[]>(mockUsers);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = (page: number, search: string) => {
    setLoading(true);
    api.get(`/admin/users?page=${page}&search=${search}&limit=20`)
      .then(res => {
        const data = res.data?.users;
        const total = res.data?.total;
        const pages = res.data?.totalPages;
        setUsers(data || []);
        setTotalUsers(total || 0);
        setTotalPages(pages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers(currentPage, searchQuery);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [currentPage, searchQuery]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setDetailsLoading(true);
    api.get(`/admin/users/${userId}/details`)
      .then(res => {
        setSelectedUserDetails(res.data);
      })
      .catch(err => {
        console.error('Failed to load user details:', err);
        setSelectedUserDetails(null);
      })
      .finally(() => {
        setDetailsLoading(false);
      });
  };

  const handleToggleBlock = (userId: string, targetBlockState: boolean) => {
    const actionText = targetBlockState ? 'block' : 'unblock';
    if (!window.confirm(`Are you sure you want to ${actionText} this user?`)) return;

    api.patch(`/admin/users/${userId}/block`, { isBlocked: targetBlockState })
      .then(() => {
        alert(`User successfully ${targetBlockState ? 'blocked' : 'unblocked'}.`);
        // Refresh details
        if (selectedUserId) {
          handleUserClick(selectedUserId);
        }
        // Refresh users list
        fetchUsers(currentPage, searchQuery);
      })
      .catch(err => {
        console.error('Failed to toggle block status:', err);
        alert(err.response?.data?.error || 'Failed to update block status.');
      });
  };

  const handleDeleteUser = (userId: string) => {
    if (!window.confirm('WARNING: Are you sure you want to delete this user? This will delete the user and all associated details (orders, sessions, carts, prescriptions, reviews, tickets) from the entire database permanently. This action CANNOT be undone.')) return;

    api.delete(`/admin/users/${userId}`)
      .then(() => {
        alert('User successfully deleted from the entire database.');
        // Reset view and refresh users list
        setSelectedUserId(null);
        setSelectedUserDetails(null);
        fetchUsers(1, searchQuery);
      })
      .catch(err => {
        console.error('Failed to delete user:', err);
        alert(err.response?.data?.error || 'Failed to delete user.');
      });
  };

  if (loading && users.length === 0) {
    return <div className="text-center text-[#A7A7A7] py-10">Loading...</div>;
  }

  // Full Page Details Loading State
  if (selectedUserId && detailsLoading) {
    return (
      <div className="space-y-6 select-none animate-fadeIn">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedUserId(null);
              setSelectedUserDetails(null);
            }}
            className="px-4 py-2 rounded-xl bg-[#1C1C1E] border border-[#2A2A2D] text-white hover:bg-[#2A2A2D] transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            ← Back to Users
          </button>
        </div>
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-20 text-center text-[#A7A7A7] text-xs font-bold uppercase tracking-widest">
          Loading User Details...
        </div>
      </div>
    );
  }

  // Full Page User Details View
  if (selectedUserId && selectedUserDetails) {
    const { user, orders, bogoStatus } = selectedUserDetails;
    return (
      <div className="space-y-6 select-none animate-fadeIn">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedUserId(null);
              setSelectedUserDetails(null);
            }}
            className="px-4 py-2 rounded-xl bg-[#1C1C1E] border border-[#2A2A2D] text-white hover:bg-[#2A2A2D] transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            ← Back to Users
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel: Profile & Status */}
          <div className="w-full lg:w-1/3 space-y-6">
            {/* User Profile Card */}
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-4 pb-4 border-b border-[#2A2A2D]">
                <div className="w-16 h-16 rounded-full bg-[#D4A04D]/20 flex items-center justify-center text-[#D4A04D] text-2xl font-black uppercase border border-[#D4A04D]/30">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left">
                  <h2 className="text-white font-extrabold text-lg leading-tight flex items-center gap-2 flex-wrap">
                    <span>{user.name}</span>
                    {user.isBlocked && (
                      <span className="px-2 py-0.5 rounded bg-red-950/40 border border-red-500/20 text-red-400 font-extrabold text-[8px] uppercase tracking-wider">
                        Blocked
                      </span>
                    )}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider block w-fit mt-2 ${
                    user.role?.toLowerCase() === 'admin'
                      ? 'bg-[#D4A04D]/20 text-[#D4A04D] border border-[#D4A04D]/35 shadow-[0_0_10px_rgba(212,160,77,0.1)]'
                      : 'bg-[#2A2A2D] text-[#A7A7A7] border border-[#2A2A2D]/80'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[#A7A7A7] block font-bold text-[10px] uppercase tracking-wider">Email Address</span>
                  <span className="text-white block mt-1 font-medium text-sm truncate">{user.email || '—'}</span>
                </div>
                <div>
                  <span className="text-[#A7A7A7] block font-bold text-[10px] uppercase tracking-wider">Phone Number</span>
                  <span className="text-white block mt-1 font-medium text-sm">{user.phone ? `+91 ${user.phone}` : user.mobile ? `+91 ${user.mobile}` : '—'}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[#A7A7A7] block font-bold text-[10px] uppercase tracking-wider">Date Joined</span>
                    <span className="text-white block mt-1 font-medium text-sm">{new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div>
                    <span className="text-[#A7A7A7] block font-bold text-[10px] uppercase tracking-wider">Membership</span>
                    {bogoStatus.membershipActive ? (
                      <span className="text-[#D4A04D] block mt-1 font-black text-sm flex items-center gap-1">
                        ★ Gold Member
                      </span>
                    ) : (
                      <span className="text-[#A7A7A7] block mt-1 font-medium text-sm">Regular User</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* BOGO & Offers Status Card */}
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 space-y-4 shadow-2xl">
              <h3 className="text-white font-extrabold text-xs uppercase tracking-wider text-[#D4A04D] border-b border-[#2A2A2D] pb-3">Offers & Eligibility</h3>
              
              <div className="space-y-4 text-xs">
                <div className="flex flex-col gap-1.5 pb-3 border-b border-[#2A2A2D]/40">
                  <span className="text-[#A7A7A7] font-bold text-[10px] uppercase tracking-wider">Monthly BOGO Offer</span>
                  <div className="mt-1">
                    {!bogoStatus.membershipActive ? (
                      <span className="px-3 py-1 rounded-xl bg-red-950/40 border border-red-500/20 text-red-400 font-extrabold text-[10px] uppercase tracking-wider block w-fit">
                        Ineligible (Not Member)
                      </span>
                    ) : bogoStatus.hasUsedBogoThisMonth ? (
                      <span className="px-3 py-1 rounded-xl bg-amber-950/40 border border-amber-500/20 text-amber-400 font-extrabold text-[10px] uppercase tracking-wider block w-fit">
                        Limit Reached (Used This Month)
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-xl bg-green-950/40 border border-green-500/20 text-green-400 font-extrabold text-[10px] uppercase tracking-wider block w-fit">
                        Available (Active Member)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[#A7A7A7] font-bold text-[10px] uppercase tracking-wider">₹1 Frame Offer Usage</span>
                  <div className="mt-1">
                    {bogoStatus.oneRupeeOfferCount >= 2 ? (
                      <span className="px-3 py-1 rounded-xl bg-red-950/40 border border-red-500/20 text-red-400 font-extrabold text-[10px] uppercase tracking-wider block w-fit">
                        {bogoStatus.oneRupeeOfferCount} / 2 Used (Limit Reached)
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-xl bg-[#2A2A2D] text-white font-extrabold text-[10px] uppercase tracking-wider block w-fit border border-[#2A2A2D]/80">
                        {bogoStatus.oneRupeeOfferCount} / 2 Used
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Actions Card */}
            <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 space-y-4 shadow-2xl">
              <h3 className="text-white font-extrabold text-xs uppercase tracking-wider text-red-500 border-b border-[#2A2A2D] pb-3">Admin Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleToggleBlock(user._id, !user.isBlocked)}
                  className={`w-full py-2.5 rounded-xl border text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
                    user.isBlocked
                      ? 'bg-green-950/20 border-green-500/20 text-green-400 hover:bg-green-900/30'
                      : 'bg-amber-950/20 border-amber-500/20 text-amber-400 hover:bg-amber-950/30'
                  }`}
                >
                  {user.isBlocked ? '🔓 Unblock Account' : '🚫 Block Account'}
                </button>

                <button
                  onClick={() => handleDeleteUser(user._id)}
                  className="w-full py-2.5 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-950/30 text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  🗑️ Delete Account
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Order History */}
          <div className="flex-1 bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-2xl flex flex-col min-h-[450px]">
            <h3 className="text-white font-extrabold text-xs uppercase tracking-wider text-[#D4A04D] border-b border-[#2A2A2D] pb-3 mb-4 text-left">
              Order History ({orders.length})
            </h3>
            
            {orders.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-[#A7A7A7] text-xs">
                <div className="text-3xl mb-2 animate-bounce">📦</div>
                <span>No orders placed by this user yet.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-[#A7A7A7] text-[10px] uppercase border-b border-[#2A2A2D]">
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Items</th>
                      <th className="py-2.5 px-3">Offers</th>
                      <th className="py-2.5 px-3 text-right">Payable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order: any) => (
                      <tr 
                        key={order._id} 
                        onClick={() => navigate('/admin/orders', { state: { autoSelectOrderId: order.orderId || order._id } })}
                        className="border-b border-[#2A2A2D]/40 hover:bg-[#1C1C1E] transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-3 text-white font-extrabold">{order.orderId}</td>
                        <td className="py-3.5 px-3 text-[#A7A7A7]">
                          {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase ${
                            order.status === 'delivered'
                              ? 'bg-green-950/40 text-green-400 border border-green-500/20'
                              : order.status === 'cancelled'
                              ? 'bg-red-950/40 text-red-400 border border-red-500/20'
                              : 'bg-amber-950/40 text-amber-400 border border-amber-500/20'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-white">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</td>
                        <td className="py-3.5 px-3">
                          <div className="flex gap-1.5 flex-wrap">
                            {order.bogoApplied && (
                              <span className="px-1.5 py-0.5 rounded bg-green-950/40 border border-green-500/20 text-green-400 text-[8px] font-black uppercase">
                                BOGO
                              </span>
                            )}
                            {order.coupon?.code && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-950/40 border border-purple-500/20 text-purple-400 text-[8px] font-black uppercase">
                                {order.coupon.code}
                              </span>
                            )}
                            {!order.bogoApplied && !order.coupon?.code && <span className="text-[#A7A7A7]">—</span>}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right text-white font-extrabold">₹{order.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <div className="text-[#A7A7A7] text-xs mt-0.5">{totalUsers} total users</div>
        </div>
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name, email, or mobile..."
            className="w-full bg-[#131314] border border-[#2A2A2D] text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#D4A04D] transition-colors placeholder:text-gray-600"
          />
        </div>
      </div>

      <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#A7A7A7] text-xs uppercase border-b border-[#2A2A2D]">
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-left px-5 py-3">Phone / Email</th>
                <th className="text-left px-5 py-3">Joined</th>
                <th className="text-left px-5 py-3">Orders</th>
                <th className="text-left px-5 py-3">Role</th>
                <th className="text-left px-5 py-3">Membership</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr 
                  key={user._id} 
                  onClick={() => handleUserClick(user._id)}
                  className="border-b border-[#2A2A2D] hover:bg-[#2A2A2D]/60 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#D4A04D]/20 flex items-center justify-center text-[#D4A04D] text-xs font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-white font-medium">{user.name}</span>
                        {user.isBlocked && (
                          <span className="text-red-500 text-[10px] font-bold uppercase tracking-wider">Blocked</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-left">
                    <div className="text-white text-xs">{user.phone && `+91 ${user.phone}`}</div>
                    <div className="text-[#A7A7A7] text-xs mt-0.5">{user.email}</div>
                  </td>
                  <td className="px-5 py-4 text-[#A7A7A7]">{user.createdAt}</td>
                  <td className="px-5 py-4 text-white font-bold">{user.ordersCount}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      user.role === 'admin'
                        ? 'bg-[#D4A04D]/20 text-[#D4A04D]'
                        : 'bg-[#2A2A2D] text-[#A7A7A7]'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {user.membershipActive ? (
                      <span className="text-[#D4A04D] text-xs font-bold">★ Active</span>
                    ) : (
                      <span className="text-[#A7A7A7] text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-[#131314] border border-[#2A2A2D] rounded-xl px-5 py-3">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3.5 py-1.5 rounded-lg bg-[#1C1C1E] border border-[#2A2A2D] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2A2A2D] text-xs font-bold transition-colors cursor-pointer"
          >
            ← Previous
          </button>
          
          <span className="text-xs text-[#A7A7A7] font-medium">
            Page <strong className="text-white font-extrabold">{currentPage}</strong> of <strong className="text-white font-extrabold">{totalPages}</strong>
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3.5 py-1.5 rounded-lg bg-[#1C1C1E] border border-[#2A2A2D] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2A2A2D] text-xs font-bold transition-colors cursor-pointer"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
