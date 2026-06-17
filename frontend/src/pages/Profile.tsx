import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface Address {
  id: string;
  type: 'Home' | 'Work' | 'Other';
  fullName: string;
  mobile: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface SavedCard {
  id: string;
  brand: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expMonth: string;
  expYear: string;
  holderName: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  
  // Personal Info State
  const [name, setName] = useState(user?.name || 'Charan');
  const [email, setEmail] = useState(user?.email || 'c@gmail.com');
  const [phone, setPhone] = useState(user?.phone || '+91 9876543210');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Saved Addresses State
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: 'addr-1',
      type: 'Home',
      fullName: 'Charan Kumar',
      mobile: '9876543210',
      line1: '123, Luxury Heights, Sector 45',
      line2: 'Near Central Park',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122003',
      isDefault: true,
    },
    {
      id: 'addr-2',
      type: 'Work',
      fullName: 'Charan Kumar',
      mobile: '9876543210',
      line1: 'EyeGlaze Tech Solutions, Building 10B',
      line2: 'DLF Cyber City',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122002',
      isDefault: false,
    }
  ]);

  // Saved Payment Cards State
  const [cards, setCards] = useState<SavedCard[]>([
    {
      id: 'card-1',
      brand: 'visa',
      last4: '4242',
      expMonth: '12',
      expYear: '2028',
      holderName: 'CHARAN KUMAR',
    },
    {
      id: 'card-2',
      brand: 'mastercard',
      last4: '8888',
      expMonth: '08',
      expYear: '2029',
      holderName: 'CHARAN KUMAR',
    }
  ]);

  // Wallet State
  const [walletBalance] = useState(1250);
  const [transactions] = useState([
    { id: 'tx-1', type: 'Refund', amount: 799, date: '2026-06-12', description: 'Refund for Order EGO-20260610-0002' },
    { id: 'tx-2', type: 'Added', amount: 1000, date: '2026-06-01', description: 'Added via UPI' },
    { id: 'tx-3', type: 'Paid', amount: -549, date: '2026-05-28', description: 'Paid for Order EGO-20260528-0019' }
  ]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccess(false);
    setTimeout(() => {
      setIsSavingProfile(false);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    }, 1000);
  };

  const handleSetDefaultAddress = (id: string) => {
    setAddresses(prev => prev.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses(prev => prev.filter(addr => addr.id !== id));
  };

  const handleDeleteCard = (id: string) => {
    setCards(prev => prev.filter(card => card.id !== id));
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">My Profile</h1>
        <p className="text-gray-500 text-sm">Manage your personal settings, addresses, payment cards, and EyeGlaze wallet.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Info, Cards & Wallet */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Personal Information */}
          <section className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>👤</span> Personal Information
            </h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1.5 font-semibold">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-3 text-white focus:border-[#D4A04D] focus:outline-none text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1.5 font-semibold">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-3 text-white focus:border-[#D4A04D] focus:outline-none text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1.5 font-semibold">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-3 text-white focus:border-[#D4A04D] focus:outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-bold uppercase py-2.5 px-6 rounded-xl transition-all text-xs tracking-wider disabled:opacity-50"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </button>
                {profileSuccess && (
                  <span className="text-green-400 text-xs font-semibold animate-pulse">✓ Profile saved successfully!</span>
                )}
              </div>
            </form>
          </section>

          {/* Saved Addresses */}
          <section className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📍</span> Saved Addresses
              </h2>
              <button 
                type="button"
                className="text-[#D4A04D] text-xs font-bold uppercase hover:underline"
              >
                + Add Address
              </button>
            </div>
            
            {addresses.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No saved addresses.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {addresses.map(addr => (
                  <div 
                    key={addr.id} 
                    className={`border rounded-xl p-4 flex flex-col justify-between transition-all relative ${
                      addr.isDefault 
                        ? 'border-[#D4A04D] bg-[#D4A04D]/5' 
                        : 'border-[#2A2A2D] bg-[#0B0B0C] hover:border-gray-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          addr.type === 'Home' 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                            : addr.type === 'Work' 
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                            : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                        }`}>
                          {addr.type}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-extrabold text-[#D4A04D] uppercase">Default</span>
                        )}
                      </div>
                      <div className="text-white font-bold text-sm">{addr.fullName}</div>
                      <div className="text-[#A7A7A7] text-xs mt-1">{addr.mobile}</div>
                      <div className="text-gray-400 text-xs mt-2 leading-relaxed">
                        {addr.line1}, {addr.line2 && `${addr.line2}, `}{addr.city}, {addr.state} - {addr.pincode}
                      </div>
                    </div>

                    <div className="flex gap-4 border-t border-[#2A2A2D] mt-4 pt-3 text-[11px] font-bold text-[#A7A7A7]">
                      {!addr.isDefault && (
                        <button 
                          onClick={() => handleSetDefaultAddress(addr.id)} 
                          className="hover:text-white transition-colors"
                        >
                          Set Default
                        </button>
                      )}
                      <button className="hover:text-white transition-colors">Edit</button>
                      <button 
                        onClick={() => handleDeleteAddress(addr.id)} 
                        className="hover:text-red-400 transition-colors text-red-500/80"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Saved Payments */}
          <section className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>💳</span> Saved Payment Cards
              </h2>
              <button 
                type="button"
                className="text-[#D4A04D] text-xs font-bold uppercase hover:underline"
              >
                + Add Card
              </button>
            </div>

            {cards.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No saved payment methods.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {cards.map(card => (
                  <div key={card.id} className="bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl p-5 hover:border-gray-700 transition-all flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold tracking-widest text-white uppercase">
                          {card.brand === 'visa' ? 'VISA' : card.brand === 'mastercard' ? 'MC' : 'CARD'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase">{card.brand}</span>
                      </div>
                      <div className="text-white text-sm font-semibold tracking-wider">
                        •••• •••• •••• {card.last4}
                      </div>
                      <div className="text-[#A7A7A7] text-[10px] uppercase font-bold mt-2.5">
                        Expires {card.expMonth}/{card.expYear}
                      </div>
                      <div className="text-gray-400 text-[11px] font-semibold mt-1">
                        {card.holderName}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="text-red-500/80 hover:text-red-400 transition-colors text-xs font-bold"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column - Wallet Balance & Transactions */}
        <div className="space-y-8">
          
          {/* EyeGlaze Wallet */}
          <section className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-lg flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>👛</span> EyeGlaze Wallet
              </h2>
              <div className="bg-gradient-to-r from-[#D4A04D]/20 to-[#C8923E]/20 border border-[#D4A04D]/30 rounded-2xl p-5 text-center relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 text-7xl opacity-10">👛</div>
                <div className="text-xs text-[#D4A04D] font-bold uppercase tracking-wider mb-1">Available Balance</div>
                <div className="text-3xl font-extrabold text-white">₹{walletBalance.toFixed(2)}</div>
                <button 
                  type="button"
                  className="mt-4 bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold uppercase py-2 px-5 rounded-lg text-[10px] tracking-wider transition-all"
                >
                  + Add Money
                </button>
              </div>
            </div>

            {/* Wallet Transactions */}
            <div className="mt-6">
              <h3 className="text-xs text-white uppercase tracking-wider font-bold mb-3">Recent Transactions</h3>
              <div className="space-y-3">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex justify-between items-start border-b border-[#2A2A2D] pb-2 text-xs">
                    <div>
                      <div className="text-white font-semibold">{tx.description}</div>
                      <div className="text-[#A7A7A7] text-[10px] mt-0.5">{tx.date}</div>
                    </div>
                    <div className={`font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? `+₹${tx.amount}` : `-₹${Math.abs(tx.amount)}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
