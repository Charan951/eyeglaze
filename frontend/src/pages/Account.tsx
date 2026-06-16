import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const name = user?.name || 'Guest User';
  const phone = user?.phone || '';
  const email = user?.email || '';
  const membershipActive = Boolean(user?.membershipActive);
  const addresses: unknown[] = (user?.addresses as unknown[]) || [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">My Account</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 text-center">
            <div className="w-20 h-20 bg-[#C9A84C]/20 border-2 border-[#C9A84C] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👤</span>
            </div>
            <div className="text-white font-bold text-lg">{name}</div>
            {phone && <div className="text-[#888] text-sm mt-1">{phone}</div>}
            {email && <div className="text-[#888] text-sm mt-1">{email}</div>}

            {membershipActive && (
              <div className="mt-3 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-lg px-3 py-2 text-[#C9A84C] text-xs font-bold">
                ★ EYEGLAZE MEMBER
              </div>
            )}

            <button
              onClick={handleLogout}
              className="mt-4 w-full border border-red-500/50 text-red-400 py-2 rounded-lg text-sm hover:border-red-400 transition-colors"
            >
              Logout
            </button>
          </div>

          {!membershipActive && (
            <div className="mt-4 bg-[#1A1A1A] border border-[#C9A84C]/30 rounded-xl p-4">
              <div className="text-[#C9A84C] font-bold text-sm mb-1">★ EYEGLAZE MEMBERSHIP</div>
              <div className="text-[#888] text-xs mb-3">Free delivery, extended warranty & more</div>
              <div className="text-white font-bold mb-2">₹99/year</div>
              <button className="w-full bg-[#C9A84C] text-black font-bold py-2 rounded-lg text-sm hover:opacity-90">
                Join Now
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-5">
          {/* Edit Profile */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5">
            <h2 className="text-white font-bold mb-4">Personal Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[#888] text-xs uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  defaultValue={name}
                  placeholder="Your name"
                  className="mt-1 w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#C9A84C] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[#888] text-xs uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  defaultValue={email}
                  placeholder="your@email.com"
                  className="mt-1 w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#C9A84C] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[#888] text-xs uppercase tracking-wide">Phone</label>
                <input
                  type="tel"
                  defaultValue={phone}
                  placeholder="+91 9876543210"
                  className="mt-1 w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#C9A84C] focus:outline-none"
                />
              </div>
            </div>
            <button className="mt-4 bg-[#C9A84C] text-black font-bold py-2 px-6 rounded-lg text-sm hover:opacity-90">
              Save Changes
            </button>
          </div>

          {/* Addresses */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold">Saved Addresses</h2>
              <button className="text-[#C9A84C] text-sm hover:underline">+ Add Address</button>
            </div>
            {addresses.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-[#888] text-sm mb-3">No saved addresses</div>
                <button className="border border-[#2A2A2A] text-white py-2 px-4 rounded-lg text-sm hover:border-[#C9A84C] transition-colors">
                  Add New Address
                </button>
              </div>
            ) : null}
          </div>

          {/* Quick Links */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5">
            <h2 className="text-white font-bold mb-4">Quick Links</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'My Orders', href: '/orders', icon: '📦' },
                { label: 'Wishlist', href: '/account', icon: '❤️' },
                { label: 'Prescriptions', href: '/account', icon: '📋' },
                { label: 'Track Order', href: '/orders', icon: '🚀' },
              ].map(({ label, href, icon }) => (
                <a key={label} href={href} className="flex items-center gap-3 bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg p-3 hover:border-[#C9A84C] transition-colors">
                  <span>{icon}</span>
                  <span className="text-white text-sm">{label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
