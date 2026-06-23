import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import api from '../lib/api';

interface Address {
  id?: string;
  _id?: string;
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

export default function ProfilePage() {
  const { user, checkAuth, logout } = useAuth();
  const navigate = useNavigate();
  
  // Personal Info State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Security & Device Sessions State
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const res = await api.get('/auth/sessions');
      setSessions(res.data?.sessions || []);
    } catch (err) {
      console.error('Failed to load active sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const handleRevokeSession = async (sessId: string) => {
    if (!window.confirm('Are you sure you want to log out this device?')) return;
    try {
      const res = await api.delete(`/auth/sessions/${sessId}`);
      if (res.data?.loggedOutCurrent) {
        await logout();
        navigate('/login');
      } else {
        await fetchSessions();
      }
    } catch (err: any) {
      console.error('Failed to revoke session:', err);
      alert(err.response?.data?.error || 'Failed to log out device.');
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('Are you sure you want to log out from all devices? This will also log you out of this current session.')) return;
    setIsLoggingOutAll(true);
    try {
      await api.post('/auth/logout-all');
      await logout();
      navigate('/login');
    } catch (err: any) {
      console.error('Failed to log out from all devices:', err);
      alert(err.response?.data?.error || 'Failed to log out from all devices.');
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  const formatUserAgent = (ua: string) => {
    if (!ua) return { browser: 'Unknown Device', os: 'Unknown OS', icon: '💻' };
    
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';
    let icon = '💻';

    const uaLower = ua.toLowerCase();

    if (uaLower.includes('firefox')) {
      browser = 'Firefox';
      icon = '🦊';
    } else if (uaLower.includes('edg')) {
      browser = 'Edge';
      icon = '🌐';
    } else if (uaLower.includes('chrome')) {
      browser = 'Chrome';
      icon = '🌐';
    } else if (uaLower.includes('safari')) {
      browser = 'Safari';
      icon = '🧭';
    } else if (uaLower.includes('opr') || uaLower.includes('opera')) {
      browser = 'Opera';
      icon = '🅾️';
    }

    if (uaLower.includes('windows')) {
      os = 'Windows';
    } else if (uaLower.includes('android')) {
      os = 'Android';
      icon = '📱';
    } else if (uaLower.includes('iphone') || uaLower.includes('ipad')) {
      os = 'iOS';
      icon = '📱';
    } else if (uaLower.includes('macintosh') || uaLower.includes('mac os')) {
      os = 'macOS';
    } else if (uaLower.includes('linux')) {
      os = 'Linux';
    }

    return { browser, os, icon };
  };

  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm('Are you sure you want to permanently delete your account? This action is irreversible.');
    if (!confirm1) return;

    const confirm2 = window.confirm('WARNING: You will lose access to all your orders, wishlist, and wallet balance. Please confirm once more to delete permanently.');
    if (!confirm2) return;

    setIsDeletingAccount(true);
    try {
      await api.delete('/auth/profile');
      await logout();
      navigate('/');
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      alert(err.response?.data?.error || 'Failed to delete account.');
    } finally {
      setIsDeletingAccount(false);
    }
  };


  // Address Form State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  const [formFullName, setFormFullName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formPincode, setFormPincode] = useState('');
  const [formLine1, setFormLine1] = useState('');
  const [formLine2, setFormLine2] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formType, setFormType] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [formIsDefault, setFormIsDefault] = useState(false);
  
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Sync profile details and addresses on user load
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || user.mobile || '');
      setAddresses((user.addresses as Address[]) || []);
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccess(false);
    try {
      await api.put('/auth/profile', { name, email, phone });
      setProfileSuccess(true);
      await checkAuth();
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      alert(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSetDefaultAddress = async (addrId: string) => {
    try {
      await api.put(`/auth/addresses/${addrId}/default`);
      await checkAuth();
    } catch (err: any) {
      console.error('Failed to set default address:', err);
      alert('Failed to set default address.');
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.delete(`/auth/addresses/${addrId}`);
      await checkAuth();
    } catch (err: any) {
      console.error('Failed to delete address:', err);
      alert('Failed to delete address.');
    }
  };

  const handleAddAddressClick = () => {
    setEditingAddress(null);
    setFormFullName(user?.name || '');
    setFormMobile(user?.phone || user?.mobile || '');
    setFormPincode('');
    setFormLine1('');
    setFormLine2('');
    setFormCity('');
    setFormState('');
    setFormType('Home');
    setFormIsDefault(false);
    setShowForm(true);
  };

  const handleEditAddressClick = (addr: Address) => {
    setEditingAddress(addr);
    setFormFullName(addr.fullName);
    setFormMobile(addr.mobile);
    setFormPincode(addr.pincode);
    setFormLine1(addr.line1);
    setFormLine2(addr.line2 || '');
    setFormCity(addr.city);
    setFormState(addr.state);
    setFormType(addr.type);
    setFormIsDefault(addr.isDefault);
    setShowForm(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName || !formMobile || !formPincode || !formLine1 || !formCity || !formState) {
      alert('Please fill out all required fields.');
      return;
    }

    setIsSavingAddress(true);
    try {
      const payload = {
        fullName: formFullName,
        mobile: formMobile,
        pincode: formPincode,
        line1: formLine1,
        line2: formLine2,
        city: formCity,
        state: formState,
        type: formType,
        isDefault: formIsDefault,
      };

      const addressId = editingAddress ? (editingAddress.id || editingAddress._id) : null;

      if (editingAddress && addressId) {
        await api.put(`/auth/addresses/${addressId}`, payload);
      } else {
        await api.post('/auth/addresses', payload);
      }

      await checkAuth();
      setShowForm(false);
      setEditingAddress(null);
    } catch (err: any) {
      console.error('Failed to save address:', err);
      alert(err.response?.data?.error || 'Failed to save address.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            
            if (addr.postcode) setFormPincode(addr.postcode);
            
            const cityVal = addr.city || addr.town || addr.village || addr.suburb || addr.county || '';
            if (cityVal) setFormCity(cityVal);
            
            if (addr.state) setFormState(addr.state);
            
            const road = addr.road || addr.suburb || addr.neighbourhood || '';
            const house = addr.house_number || '';
            const line1Val = [house, road].filter(Boolean).join(', ');
            if (line1Val) setFormLine1(line1Val);
            
            const line2Val = [addr.suburb, addr.neighbourhood].filter(Boolean).filter(val => val !== road).join(', ');
            if (line2Val) setFormLine2(line2Val);

            if (!line1Val && data.display_name) {
              setFormLine1(data.display_name.split(',').slice(0, 3).join(',').trim());
            }
          } else {
            alert('Could not resolve location. Please enter manually.');
          }
        } catch (err) {
          console.error('Reverse geocoding error:', err);
          alert('Failed to fetch details for location. Please enter address manually.');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let msg = 'Failed to get location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location access denied. Please enable location permissions or enter address manually.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information unavailable. Please enter address manually.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again or enter address manually.';
        }
        alert(msg);
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <SEO robots="noindex, nofollow" title="My Profile" />
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">My Profile</h1>
        <p className="text-gray-500 text-sm">Manage your personal settings and shipping addresses.</p>
      </div>

      <div className="max-w-4xl space-y-8">
        
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

        {/* Address Form Container (Add/Edit Address) */}
        {showForm && (
          <section className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-xl space-y-4 transition-all">
            <div className="flex justify-between items-center border-b border-[#2A2A2D] pb-3">
              <h3 className="text-white font-bold text-base">
                {editingAddress ? '✏️ Edit Address' : '➕ Add New Address'}
              </h3>
              <button 
                type="button" 
                onClick={() => { setShowForm(false); setEditingAddress(null); }}
                className="text-gray-500 hover:text-white text-xs font-bold uppercase transition-colors"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#A7A7A7]">Quickly fill address details using your exact GPS location:</span>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={isDetectingLocation}
                  className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isDetectingLocation ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                      Detecting Location...
                    </>
                  ) : (
                    <>
                      <span>📍</span> Use Current Location
                    </>
                  )}
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1.5 font-semibold">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formFullName}
                    onChange={e => setFormFullName(e.target.value)}
                    placeholder="Enter recipient name"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white focus:border-[#D4A04D] focus:outline-none text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1.5 font-semibold">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={formMobile}
                    onChange={e => setFormMobile(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white focus:border-[#D4A04D] focus:outline-none text-sm transition-colors"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1.5 font-semibold">Address Line 1 (Flat, House, Building) *</label>
                  <input
                    type="text"
                    required
                    value={formLine1}
                    onChange={e => setFormLine1(e.target.value)}
                    placeholder="Flat/House No., Building/Apartment Name, Street"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white focus:border-[#D4A04D] focus:outline-none text-sm transition-colors"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1.5 font-semibold">Address Line 2 (Area, Sector, Landmark)</label>
                  <input
                    type="text"
                    value={formLine2}
                    onChange={e => setFormLine2(e.target.value)}
                    placeholder="Area, Sector, Landmark, Village"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white focus:border-[#D4A04D] focus:outline-none text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1.5 font-semibold">City/Town *</label>
                  <input
                    type="text"
                    required
                    value={formCity}
                    onChange={e => setFormCity(e.target.value)}
                    placeholder="City"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white focus:border-[#D4A04D] focus:outline-none text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1.5 font-semibold">State *</label>
                  <input
                    type="text"
                    required
                    value={formState}
                    onChange={e => setFormState(e.target.value)}
                    placeholder="State"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white focus:border-[#D4A04D] focus:outline-none text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1.5 font-semibold">Pincode/Zip *</label>
                  <input
                    type="text"
                    required
                    value={formPincode}
                    onChange={e => setFormPincode(e.target.value)}
                    placeholder="6-digit pincode"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white focus:border-[#D4A04D] focus:outline-none text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1.5 font-semibold">Address Type</label>
                  <div className="flex gap-3">
                    {(['Home', 'Work', 'Other'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormType(t)}
                        className={`flex-1 py-2.5 rounded-xl border text-xs font-bold uppercase transition-all ${
                          formType === t 
                            ? 'bg-[#D4A04D] text-black border-[#D4A04D]' 
                            : 'bg-[#0B0B0C] text-[#A7A7A7] border-[#2A2A2D] hover:border-gray-700'
                        }`}
                      >
                        {t === 'Home' ? '🏠 ' : t === 'Work' ? '🏢 ' : '📍 '}{t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="defaultAddress"
                  checked={formIsDefault}
                  onChange={e => setFormIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded border-[#2A2A2D] bg-[#0B0B0C] text-[#D4A04D] focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="defaultAddress" className="text-white text-xs select-none cursor-pointer">
                  Set as Default Shipping Address
                </label>
              </div>

              <div className="flex gap-4 pt-2 border-t border-[#2A2A2D]">
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-bold uppercase py-2.5 px-6 rounded-xl transition-all text-xs tracking-wider disabled:opacity-50"
                >
                  {isSavingAddress ? 'Saving...' : 'Save Address'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingAddress(null); }}
                  className="bg-transparent hover:bg-white/5 text-white border border-[#2A2A2D] font-bold uppercase py-2.5 px-6 rounded-xl transition-all text-xs tracking-wider"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Saved Addresses */}
        <section className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📍</span> Saved Addresses
            </h2>
            {!showForm && (
              <button 
                type="button"
                onClick={handleAddAddressClick}
                className="text-[#D4A04D] text-xs font-bold uppercase hover:underline"
              >
                + Add Address
              </button>
            )}
          </div>
          
          {addresses.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No saved addresses.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {addresses.map(addr => {
                const addrId = addr.id || addr._id || '';
                return (
                  <div 
                    key={addrId} 
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
                          onClick={() => handleSetDefaultAddress(addrId)} 
                          className="hover:text-white transition-colors"
                        >
                          Set Default
                        </button>
                      )}
                      <button 
                        onClick={() => handleEditAddressClick(addr)}
                        className="hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteAddress(addrId)} 
                        className="hover:text-red-400 transition-colors text-red-500/80"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Security & Active Sessions */}
        <section className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🛡️</span> Security & Device Sessions
              </h2>
              <p className="text-[#A7A7A7] text-xs mt-1">Manage your active sessions and devices currently logged in.</p>
            </div>
            {sessions.length > 1 && (
              <button
                type="button"
                onClick={handleLogoutAll}
                disabled={isLoggingOutAll}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {isLoggingOutAll ? 'Logging out...' : 'Log Out All Devices'}
              </button>
            )}
          </div>

          {isLoadingSessions ? (
            <div className="text-center py-8 text-gray-500 text-sm animate-pulse">Loading active sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No active sessions found.</div>
          ) : (
            <div className="space-y-4">
              {sessions.map((sess) => {
                const { browser, os, icon } = formatUserAgent(sess.userAgent);
                return (
                  <div
                    key={sess.id}
                    className={`border rounded-xl p-4 flex items-center justify-between transition-all ${
                      sess.isCurrent
                        ? 'border-[#D4A04D] bg-[#D4A04D]/5'
                        : 'border-[#2A2A2D] bg-[#0B0B0C] hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="text-3xl bg-[#1D1D20] p-3 rounded-xl border border-[#2D2D30] shadow-inner flex-shrink-0">
                        {icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-white font-bold text-sm truncate">
                            {browser} on {os}
                          </span>
                          {sess.isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-[#D4A04D]/20 text-[#D4A04D] text-[10px] font-extrabold uppercase border border-[#D4A04D]/30 flex-shrink-0">
                              Current Device
                            </span>
                          )}
                        </div>
                        <div className="text-[#A7A7A7] text-xs mt-1 font-mono truncate">
                          IP: {sess.ipAddress || 'Unknown IP'}
                        </div>
                        <div className="text-gray-500 text-[11px] mt-1.5 font-medium">
                          Logged in:{' '}
                          {new Date(sess.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 flex-shrink-0">
                      <button
                        onClick={() => handleRevokeSession(sess.id)}
                        className={`font-bold uppercase py-2 px-4 rounded-xl text-xs tracking-wider transition-all border ${
                          sess.isCurrent
                            ? 'bg-transparent border-[#2A2A2D] text-[#A7A7A7] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                            : 'bg-transparent border-[#2A2A2D] text-[#A7A7A7] hover:border-gray-700 hover:text-white'
                        }`}
                      >
                        {sess.isCurrent ? 'Log Out' : 'Revoke'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Delete Account */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount}
            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold uppercase py-2.5 px-6 rounded-xl transition-all text-xs tracking-wider cursor-pointer disabled:opacity-50"
          >
            {isDeletingAccount ? 'Deleting Account...' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
