import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import api from '../lib/api';
import { socket } from '../lib/socket';

interface Address {
  id?: string;
  _id?: string;
  type: 'Home' | 'Work' | 'Other';
  fullName: string;
  mobile: string;
  alternativeNumber?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export default function ProfilePage() {
  const { user, checkAuth, logout, login } = useAuth();
  const navigate = useNavigate();

  // Personal Info State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Guest "Login / Signup" bottom sheet state
  const [showLoginSheet, setShowLoginSheet] = useState(false);
  const [sheetTab, setSheetTab] = useState<'login' | 'register'>('login');
  const [sheetName, setSheetName] = useState('');
  const [sheetEmail, setSheetEmail] = useState('');
  const [sheetPassword, setSheetPassword] = useState('');
  const [sheetShowPassword, setSheetShowPassword] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  // Guests tapping anything that needs an account get the login sheet
  // instead of being bounced to a separate full-page /login route.
  const requireLogin = (destination: string) => {
    if (user) {
      navigate(destination);
      return;
    }
    setPendingRedirect(destination);
    setSheetError('');
    setSheetTab('login');
    setShowLoginSheet(true);
  };

  const handleSheetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSheetError('');
    setSheetLoading(true);
    try {
      if (sheetTab === 'register') {
        if (!sheetName || !sheetEmail || !sheetPassword) {
          setSheetError('All fields are required');
          setSheetLoading(false);
          return;
        }
        const res = await api.post('/auth/register', { name: sheetName, email: sheetEmail, password: sheetPassword });
        if (res.data?.user) await login(res.data.user);
      } else {
        if (!sheetEmail || !sheetPassword) {
          setSheetError('Email and password are required');
          setSheetLoading(false);
          return;
        }
        const res = await api.post('/auth/login', { email: sheetEmail, password: sheetPassword });
        if (res.data?.user) await login(res.data.user);
      }
      setShowLoginSheet(false);
      setSheetName('');
      setSheetEmail('');
      setSheetPassword('');
      if (pendingRedirect) {
        navigate(pendingRedirect);
        setPendingRedirect(null);
      }
    } catch (err: any) {
      setSheetError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSheetLoading(false);
    }
  };

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

  // Real-time user profile & address socket update
  useEffect(() => {
    const handleUserChanged = () => {
      checkAuth();
      if (user) fetchSessions();
    };

    socket.on('user_changed', handleUserChanged);
    socket.on('address_changed', handleUserChanged);
    return () => {
      socket.off('user_changed', handleUserChanged);
      socket.off('address_changed', handleUserChanged);
    };
  }, [checkAuth, user]);

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
  const [formAlternativeNumber, setFormAlternativeNumber] = useState('');
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
    setFormFullName('');
    setFormMobile(user?.phone || user?.mobile || '');
    setFormAlternativeNumber('');
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
    setFormAlternativeNumber(addr.alternativeNumber || '');
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
    if (!formFullName || !formMobile || !formAlternativeNumber || !formPincode || !formLine1 || !formCity || !formState) {
      alert('Please fill out all required fields.');
      return;
    }

    setIsSavingAddress(true);
    try {
      const payload = {
        fullName: formFullName,
        mobile: formMobile,
        alternativeNumber: formAlternativeNumber || undefined,
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
    <div className="max-w-2xl mx-auto space-y-5 pb-16 pt-2 px-3 sm:px-6 text-white select-none">
      <SEO robots="noindex, nofollow" title="My Profile" />

      {/* ========================================== */}
      {/* DESKTOP / WEB VIEW: Strictly Edit Profile */}
      {/* ========================================== */}
      <div className="hidden xl:block space-y-6">
        {!user ? (
          <div className="flex flex-col items-center justify-center text-center gap-4 bg-[#131314] border border-[#2A2A2D] rounded-2xl p-16 shadow-xl">
            <div className="w-16 h-16 rounded-full border-2 border-[#D4A04D]/40 bg-[#D4A04D]/10 flex items-center justify-center text-[#D4A04D] text-2xl">👤</div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Login or Signup to get started</h2>
              <p className="text-gray-400 text-xs mt-1.5 max-w-sm">
                Sign in to view your profile, track orders, and get access to exclusive deals.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-xs uppercase py-3 px-8 rounded-xl tracking-wider transition-colors shadow-md border-none cursor-pointer"
            >
              Login / Signup
            </button>
          </div>
        ) : (
        <>
        <div className="border-b border-[#2A2A2D] pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Edit Profile</h1>
            <p className="text-gray-400 text-xs mt-1">
              Update your personal details, contact information, and account settings.
            </p>
          </div>
          <span className="text-[#D4A04D] text-xs font-bold uppercase tracking-wider bg-[#D4A04D]/10 px-3 py-1 rounded-full border border-[#D4A04D]/25">
            {user?.membershipActive ? 'Gold Member' : 'Regular Member'}
          </span>
        </div>

        <div className="bg-[#131314] border border-[#2A2A2D] text-white rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-4 border-b border-[#2A2A2D] pb-5">
            <div className="w-16 h-16 rounded-full border-2 border-[#D4A04D]/50 bg-[#D4A04D]/10 flex items-center justify-center text-[#D4A04D] font-black text-2xl shrink-0">
              {user ? (user.name ? user.name[0].toUpperCase() : 'U') : '👤'}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">
                {user?.name || 'User Account'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {user?.email || 'No email associated'}
              </p>
            </div>
          </div>

          {profileSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Profile updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1.5 font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-3 text-white focus:border-[#D4A04D] focus:outline-none text-xs transition-colors"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1.5 font-semibold">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-3 text-white focus:border-[#D4A04D] focus:outline-none text-xs transition-colors"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1.5 font-semibold">Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-3 text-white focus:border-[#D4A04D] focus:outline-none text-xs transition-colors"
                placeholder="Enter phone number"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold uppercase py-3 px-8 rounded-xl text-xs tracking-wider transition-all border-none cursor-pointer disabled:opacity-50 shadow-md"
              >
                {isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>

          {/* Desktop Actions */}
          <div className="pt-5 border-t border-[#2A2A2D] flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="bg-[#1C1C1E] hover:bg-red-500/20 text-red-400 font-bold uppercase py-2.5 px-5 rounded-xl text-xs tracking-wider transition-colors border border-red-500/30 cursor-pointer"
            >
              Log Out
            </button>

            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold uppercase py-2.5 px-5 rounded-xl text-xs tracking-wider transition-colors border border-red-500/30 cursor-pointer disabled:opacity-50"
            >
              {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
        </>
        )}
      </div>

      {/* ========================================== */}
      {/* MOBILE VIEW: Unchanged Full Dashboard View */}
      {/* ========================================== */}
      <div className="xl:hidden space-y-5">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-[#2A2A2D]">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/')}
              className="w-8 h-8 rounded-full border border-[#2A2A2D] bg-[#131314] flex items-center justify-center text-gray-300 hover:text-[#D4A04D] transition-colors cursor-pointer shrink-0"
              title="Back to Home Page"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-xl font-extrabold text-white">My Profile</h1>
          </div>

          <div className="flex items-center gap-3.5">
            <button onClick={() => navigate('/wishlist')} className="text-gray-300 hover:text-[#D4A04D] bg-transparent border-none cursor-pointer p-0 transition-colors" title="Wishlist">
              <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button onClick={() => navigate('/cart')} className="text-gray-300 hover:text-[#D4A04D] bg-transparent border-none cursor-pointer p-0 transition-colors" title="Cart">
              <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Top Welcome Card */}
        <div className="bg-[#131314] border border-[#2A2A2D] text-white rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full border border-[#D4A04D]/40 bg-[#D4A04D]/10 flex items-center justify-center text-[#D4A04D] font-black text-lg shrink-0">
                {user ? (user.name ? user.name[0].toUpperCase() : 'U') : '👤'}
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white">
                  {user ? `Hi ${user.name || 'Specsy'}!` : 'Hi Specsy!'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                  {user
                    ? user.email || 'Manage your orders, saved powers, and membership.'
                    : 'Login or Signup to track your orders and get access to exclusive deals.'}
                </p>
              </div>
            </div>

            {user && (
              <button
                onClick={() => setIsEditProfileOpen(true)}
                className="bg-[#D4A04D]/10 hover:bg-[#D4A04D]/20 text-[#D4A04D] border border-[#D4A04D]/30 font-bold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {!user ? (
            <button
              onClick={() => {
                setPendingRedirect(null);
                setSheetError('');
                setSheetTab('login');
                setShowLoginSheet(true);
              }}
              className="w-full bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold text-xs uppercase py-3 rounded-xl block text-center tracking-wider transition-colors shadow-md border-none cursor-pointer"
            >
              Login / Signup
            </button>
          ) : (
            <div className="pt-3 border-t border-[#2A2A2D] text-xs flex items-center justify-between">
              <span className="font-semibold text-gray-400">
                Membership Status: <strong className="text-[#D4A04D] uppercase">{user.membershipActive ? 'Gold Member' : 'Regular Member'}</strong>
              </span>
              <span className="text-[#D4A04D] text-[10px] font-bold uppercase tracking-wider bg-[#D4A04D]/10 px-2 py-0.5 rounded-full border border-[#D4A04D]/20">Active</span>
            </div>
          )}
        </div>

        {/* 3 Quick Action Cards Row */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => requireLogin('/orders')}
            className="bg-[#131314] border border-[#2A2A2D] text-white rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-lg hover:border-[#D4A04D]/40 transition-all group cursor-pointer"
          >
            <svg className="w-6 h-6 mb-1 text-[#D4A04D] group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-xs font-extrabold text-white">Orders</span>
          </button>

          <button
            onClick={() => navigate('/wishlist')}
            className="bg-[#131314] border border-[#2A2A2D] text-white rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-lg hover:border-red-500/40 transition-all group cursor-pointer"
          >
            <svg className="w-6 h-6 mb-1 text-red-500 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-xs font-extrabold text-white">Wishlist</span>
          </button>

          <button
            onClick={() => requireLogin('/membership')}
            className="bg-[#131314] border border-[#2A2A2D] text-white rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-lg hover:border-[#D4A04D]/40 transition-all group cursor-pointer"
          >
            <svg className="w-6 h-6 mb-1 text-[#D4A04D] group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <span className="text-xs font-extrabold text-white">Gold Pass</span>
          </button>
        </div>

        {/* Section 1: Get Help */}
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl shadow-lg overflow-hidden">
          <div className="px-4 pt-3 pb-1 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
            Get Help
          </div>
          <button
            onClick={() => requireLogin('/support/contact')}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#1A1A1C] transition-colors text-white font-bold text-xs text-left bg-transparent border-none cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Start a support chat</span>
            </div>
            <span className="text-gray-500 text-sm font-extrabold">›</span>
          </button>
        </div>

        {/* Section 2: My Account */}
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl shadow-lg overflow-hidden">
          <div className="px-4 pt-3 pb-1 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
            My Account
          </div>
          <div className="divide-y divide-[#2A2A2D]/60">
            <button
              onClick={() => requireLogin('/saved-powers')}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#1A1A1C] transition-colors text-white font-bold text-xs text-left bg-transparent border-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5.5 h-3.5 text-[#D4A04D]" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="6">
                  <circle cx="27" cy="15" r="10" />
                  <circle cx="73" cy="15" r="10" />
                  <path d="M37,15 L63,15" />
                </svg>
                <span>Saved Powers</span>
              </div>
              <span className="text-gray-500 text-sm font-extrabold">›</span>
            </button>

            <button
              onClick={() => requireLogin('/saved-addresses')}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#1A1A1C] transition-colors text-white font-bold text-xs text-left bg-transparent border-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#D4A04D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Saved Addresses</span>
              </div>
              <span className="text-gray-500 text-sm font-extrabold">›</span>
            </button>

            <button
              onClick={() => requireLogin('/orders')}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#1A1A1C] transition-colors text-white font-bold text-xs text-left bg-transparent border-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#D4A04D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>My Orders</span>
              </div>
              <span className="text-gray-500 text-sm font-extrabold">›</span>
            </button>

            <button
              onClick={() => navigate('/wishlist')}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#1A1A1C] transition-colors text-white font-bold text-xs text-left bg-transparent border-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>My Wishlist</span>
              </div>
              <span className="text-gray-500 text-sm font-extrabold">›</span>
            </button>

            <button
              onClick={() => requireLogin('/membership')}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#1A1A1C] transition-colors text-white font-bold text-xs text-left bg-transparent border-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#D4A04D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span>Gold Membership</span>
              </div>
              <span className="text-gray-500 text-sm font-extrabold">›</span>
            </button>
          </div>
        </div>

        {/* Section 3: Payments */}
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl shadow-lg overflow-hidden">
          <div className="px-4 pt-3 pb-1 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
            Payments
          </div>
          <div className="divide-y divide-[#2A2A2D]/60">
            <button
              onClick={() => requireLogin('/payments')}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#1A1A1C] transition-colors text-white font-bold text-xs text-left bg-transparent border-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#D4A04D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Payment History</span>
              </div>
              <span className="text-gray-500 text-sm font-extrabold">›</span>
            </button>

            <button
              onClick={() => requireLogin('/wallet')}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#1A1A1C] transition-colors text-white font-bold text-xs text-left bg-transparent border-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#D4A04D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
                <span>My Wallet</span>
              </div>
              <span className="text-gray-500 text-sm font-extrabold">›</span>
            </button>
          </div>
        </div>

        {/* Section 4: Others */}
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl shadow-lg overflow-hidden">
          <div className="px-4 pt-3 pb-1 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
            Others
          </div>
          <div className="divide-y divide-[#2A2A2D]/60">
            <button
              onClick={() => requireLogin('/about-eyeglaze')}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#1A1A1C] transition-colors text-white font-bold text-xs text-left bg-transparent border-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#D4A04D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2M5 21H3m16 0H5m2-14h2m-2 4h2m4-4h2m-2 4h2m-6 4h4" />
                </svg>
                <span>About EyeGlaze</span>
              </div>
              <span className="text-gray-500 text-sm font-extrabold">›</span>
            </button>

            <button
              onClick={() => requireLogin('/support/questions')}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#1A1A1C] transition-colors text-white font-bold text-xs text-left bg-transparent border-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#D4A04D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>FAQs</span>
              </div>
              <span className="text-gray-500 text-sm font-extrabold">›</span>
            </button>
          </div>
        </div>

        {/* Mobile Footer Actions */}
        {user && (
          <div className="pt-4 space-y-3">
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="w-full bg-[#131314] hover:bg-[#1A1A1C] border border-red-500/30 hover:border-red-500/60 text-red-400 font-extrabold uppercase py-3.5 px-6 rounded-2xl transition-all text-xs tracking-wider cursor-pointer shadow-lg flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Log Out of Account</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
              className="w-full bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-400/80 hover:text-red-400 font-bold uppercase py-2.5 px-6 rounded-xl transition-all text-xs tracking-wider cursor-pointer disabled:opacity-50 text-center"
            >
              {isDeletingAccount ? 'Deleting Account...' : 'Delete Account'}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-2xl max-w-md w-full text-white space-y-5 animate-scale-up">
            <div className="flex justify-between items-center border-b border-[#2A2A2D] pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Edit Personal Profile</span>
              </h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="text-gray-400 hover:text-white p-1 bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={async (e) => {
              await handleSaveProfile(e);
              setIsEditProfileOpen(false);
            }} className="space-y-4">
              <div>
                <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1 font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white focus:border-[#D4A04D] focus:outline-none text-xs transition-colors"
                />
              </div>

              <div>
                <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1 font-semibold">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white focus:border-[#D4A04D] focus:outline-none text-xs transition-colors"
                />
              </div>

              <div>
                <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1 font-semibold">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white focus:border-[#D4A04D] focus:outline-none text-xs transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="bg-[#1C1C1E] hover:bg-[#2A2A2D] text-gray-300 font-bold uppercase py-2 px-4 rounded-xl text-xs tracking-wider transition-colors border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold uppercase py-2 px-5 rounded-xl text-xs tracking-wider transition-all border-none cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guest "Login / Signup" Bottom Sheet */}
      <AnimatePresence>
        {showLoginSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => { setShowLoginSheet(false); setPendingRedirect(null); }}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.6 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="bg-[#131314] border border-[#2A2A2D] w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl text-white space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                Login or signup to get started
              </h3>
              <button
                onClick={() => { setShowLoginSheet(false); setPendingRedirect(null); }}
                className="text-gray-400 hover:text-white p-1 bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex border-b border-[#2A2A2D]">
              <button
                type="button"
                onClick={() => { setSheetTab('login'); setSheetError(''); }}
                className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wider text-center border-b-2 transition-colors bg-transparent cursor-pointer ${
                  sheetTab === 'login'
                    ? 'border-[#D4A04D] text-[#D4A04D]'
                    : 'border-transparent text-gray-500 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setSheetTab('register'); setSheetError(''); }}
                className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wider text-center border-b-2 transition-colors bg-transparent cursor-pointer ${
                  sheetTab === 'register'
                    ? 'border-[#D4A04D] text-[#D4A04D]'
                    : 'border-transparent text-gray-500 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {sheetError && (
              <div className="text-red-400 bg-red-400/10 border border-red-500/30 rounded-lg px-3 py-2 text-xs font-semibold">
                {sheetError}
              </div>
            )}

            <form onSubmit={handleSheetSubmit} className="space-y-4">
              {sheetTab === 'register' && (
                <div>
                  <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1 font-semibold">Full Name</label>
                  <input
                    type="text"
                    required
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white focus:border-[#D4A04D] focus:outline-none text-sm transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1 font-semibold">Email Address</label>
                <input
                  type="email"
                  required
                  value={sheetEmail}
                  onChange={(e) => setSheetEmail(e.target.value)}
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white focus:border-[#D4A04D] focus:outline-none text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1 font-semibold">Password</label>
                <div className="relative">
                  <input
                    type={sheetShowPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password"
                    value={sheetPassword}
                    onChange={(e) => setSheetPassword(e.target.value)}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl pl-4 pr-16 py-2.5 text-white focus:border-[#D4A04D] focus:outline-none text-sm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setSheetShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-gray-400 hover:text-[#D4A04D] bg-transparent border-none cursor-pointer"
                  >
                    {sheetShowPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={sheetLoading}
                className="w-full bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold uppercase py-3 rounded-xl text-xs tracking-wider transition-all border-none cursor-pointer disabled:opacity-50"
              >
                {sheetLoading ? 'Please wait...' : sheetTab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p className="text-[10px] text-gray-500 text-center leading-relaxed">
              By continuing, you agree to our{' '}
              <a href="/terms" className="text-[#D4A04D] hover:underline">Terms of Use</a> and{' '}
              <a href="/privacy" className="text-[#D4A04D] hover:underline">Privacy Policy</a>.
            </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
