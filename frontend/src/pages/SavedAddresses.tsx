import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function SavedAddressesPage() {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();

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

  useEffect(() => {
    if (user) {
      setAddresses((user.addresses as Address[]) || []);
    }
  }, [user]);

  useEffect(() => {
    const handleAddressChanged = () => {
      checkAuth();
    };

    socket.on('address_changed', handleAddressChanged);
    socket.on('user_changed', handleAddressChanged);
    return () => {
      socket.off('address_changed', handleAddressChanged);
      socket.off('user_changed', handleAddressChanged);
    };
  }, [checkAuth]);

  const handleOpenAddForm = () => {
    setEditingAddress(null);
    setFormFullName(user?.name || '');
    setFormMobile(user?.phone || user?.mobile || '');
    setFormAlternativeNumber('');
    setFormPincode('');
    setFormLine1('');
    setFormLine2('');
    setFormCity('');
    setFormState('');
    setFormType('Home');
    setFormIsDefault(addresses.length === 0);
    setShowForm(true);
  };

  const handleOpenEditForm = (addr: Address) => {
    setEditingAddress(addr);
    setFormFullName(addr.fullName || '');
    setFormMobile(addr.mobile || '');
    setFormAlternativeNumber(addr.alternativeNumber || '');
    setFormPincode(addr.pincode || '');
    setFormLine1(addr.line1 || '');
    setFormLine2(addr.line2 || '');
    setFormCity(addr.city || '');
    setFormState(addr.state || '');
    setFormType(addr.type || 'Home');
    setFormIsDefault(addr.isDefault || false);
    setShowForm(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAddress(true);
    try {
      const targetId = editingAddress?._id || editingAddress?.id;
      let updatedList: Address[] = [];

      const newAddrObj: Address = {
        fullName: formFullName,
        mobile: formMobile,
        alternativeNumber: formAlternativeNumber,
        line1: formLine1,
        line2: formLine2,
        city: formCity,
        state: formState,
        pincode: formPincode,
        type: formType,
        isDefault: formIsDefault,
      };

      if (editingAddress) {
        updatedList = addresses.map((a) => {
          const aId = a._id || a.id;
          if (aId === targetId) {
            return { ...newAddrObj, _id: aId, id: aId };
          }
          return formIsDefault ? { ...a, isDefault: false } : a;
        });
      } else {
        if (formIsDefault) {
          updatedList = addresses.map((a) => ({ ...a, isDefault: false }));
        } else {
          updatedList = [...addresses];
        }
        updatedList.push(newAddrObj);
      }

      await api.put('/auth/profile', { addresses: updatedList });
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

  const handleDeleteAddress = async (addrId?: string) => {
    if (!addrId) return;
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const updatedList = addresses.filter((a) => (a._id || a.id) !== addrId);
      await api.put('/auth/profile', { addresses: updatedList });
      await checkAuth();
    } catch (err: any) {
      console.error('Failed to delete address:', err);
      alert(err.response?.data?.error || 'Failed to delete address.');
    }
  };

  const handleSetDefaultAddress = async (addrId?: string) => {
    if (!addrId) return;
    try {
      const updatedList = addresses.map((a) => ({
        ...a,
        isDefault: (a._id || a.id) === addrId,
      }));
      await api.put('/auth/profile', { addresses: updatedList });
      await checkAuth();
    } catch (err: any) {
      console.error('Failed to set default address:', err);
      alert(err.response?.data?.error || 'Failed to set default address.');
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
            const line2Val = [addr.suburb, addr.neighbourhood].filter(Boolean).filter((val) => val !== road).join(', ');
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
        alert('Failed to get location. Please enter address manually.');
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-6 text-white min-h-screen pb-12 max-w-4xl mx-auto">
      <SEO title="Saved Addresses - EyeGlaze" />

      {/* Header */}
      <div className="flex justify-between items-center w-full gap-3 border-b border-[#2A2A2D] pb-4">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/profile')}
            className="w-8 h-8 rounded-full border border-[#2A2A2D] bg-[#131314] flex items-center justify-center text-gray-300 hover:text-[#D4A04D] transition-colors cursor-pointer shrink-0"
            title="Back to Profile"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-0.5">Saved Addresses</h1>
            <p className="text-gray-400 text-xs">
              Manage your delivery locations and default shipping addresses.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddForm}
          className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold uppercase py-2 px-3.5 sm:py-2.5 sm:px-5 rounded-xl text-[10px] sm:text-xs tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border-none shadow-md shrink-0"
        >
          + Add New Address
        </button>
      </div>

      {/* Address Form Container */}
      {showForm && (
        <section className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-xl space-y-4 transition-all">
          <div className="flex justify-between items-center border-b border-[#2A2A2D] pb-3">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{editingAddress ? 'Edit Address' : 'Add New Address'}</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingAddress(null);
              }}
              className="text-gray-400 hover:text-white text-xs font-bold uppercase transition-colors bg-transparent border-none cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveAddress} className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#A7A7A7]">Auto-fill details via GPS:</span>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isDetectingLocation}
                className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{isDetectingLocation ? 'Detecting...' : 'Use Current Location'}</span>
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1 font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="Recipient name"
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3.5 py-2.5 text-white focus:border-[#D4A04D] focus:outline-none text-xs transition-colors"
                />
              </div>
              <div>
                <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1 font-semibold">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={formMobile}
                  onChange={(e) => setFormMobile(e.target.value)}
                  placeholder="10-digit mobile"
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3.5 py-2.5 text-white focus:border-[#D4A04D] focus:outline-none text-xs transition-colors"
                />
              </div>
              <div>
                <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1 font-semibold">Alternative Number</label>
                <input
                  type="tel"
                  value={formAlternativeNumber}
                  onChange={(e) => setFormAlternativeNumber(e.target.value)}
                  placeholder="Alternative mobile (optional)"
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3.5 py-2.5 text-white focus:border-[#D4A04D] focus:outline-none text-xs transition-colors"
                />
              </div>
              <div>
                <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1 font-semibold">Address Type *</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3.5 py-2.5 text-white focus:border-[#D4A04D] focus:outline-none text-xs transition-colors"
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1 font-semibold">Address Line 1 *</label>
                <input
                  type="text"
                  required
                  value={formLine1}
                  onChange={(e) => setFormLine1(e.target.value)}
                  placeholder="Flat/House No., Building, Street"
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3.5 py-2.5 text-white focus:border-[#D4A04D] focus:outline-none text-xs transition-colors"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1 font-semibold">Address Line 2</label>
                <input
                  type="text"
                  value={formLine2}
                  onChange={(e) => setFormLine2(e.target.value)}
                  placeholder="Area, Sector, Landmark"
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3.5 py-2.5 text-white focus:border-[#D4A04D] focus:outline-none text-xs transition-colors"
                />
              </div>

              <div>
                <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1 font-semibold">City/Town *</label>
                <input
                  type="text"
                  required
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  placeholder="City"
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3.5 py-2.5 text-white focus:border-[#D4A04D] focus:outline-none text-xs transition-colors"
                />
              </div>
              <div>
                <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1 font-semibold">State *</label>
                <input
                  type="text"
                  required
                  value={formState}
                  onChange={(e) => setFormState(e.target.value)}
                  placeholder="State"
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3.5 py-2.5 text-white focus:border-[#D4A04D] focus:outline-none text-xs transition-colors"
                />
              </div>
              <div>
                <label className="block text-[#A7A7A7] text-xs uppercase tracking-wide mb-1 font-semibold">Pincode *</label>
                <input
                  type="text"
                  required
                  value={formPincode}
                  onChange={(e) => setFormPincode(e.target.value)}
                  placeholder="6-digit pincode"
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3.5 py-2.5 text-white focus:border-[#D4A04D] focus:outline-none text-xs transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#D4A04D]"
                />
                <label htmlFor="isDefault" className="text-xs text-white cursor-pointer font-medium">
                  Set as default shipping address
                </label>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingAddress}
                className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold uppercase py-2.5 px-6 rounded-xl text-xs tracking-wider transition-all disabled:opacity-50 border-none cursor-pointer"
              >
                {isSavingAddress ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Saved Addresses List */}
      <div className="space-y-4">
        {addresses.length === 0 ? (
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-8 text-center space-y-3">
            <svg className="w-10 h-10 text-[#D4A04D] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-white font-bold text-sm">No Saved Addresses Found</h3>
            <p className="text-gray-400 text-xs">Add a delivery address to complete your orders quickly.</p>
            <button
              onClick={handleOpenAddForm}
              className="bg-[#D4A04D] text-black font-extrabold uppercase py-2 px-5 rounded-xl text-xs tracking-wider border-none cursor-pointer"
            >
              + Add Address
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {addresses.map((addr) => {
              const aId = addr._id || addr.id;
              return (
                <div
                  key={aId}
                  className={`bg-[#131314] border rounded-2xl p-5 relative flex flex-col justify-between space-y-3 shadow-lg ${
                    addr.isDefault ? 'border-[#D4A04D]' : 'border-[#2A2A2D]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="bg-[#D4A04D]/10 text-[#D4A04D] border border-[#D4A04D]/20 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md">
                        {addr.type}
                      </span>
                      {addr.isDefault && (
                        <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md">
                          DEFAULT
                        </span>
                      )}
                    </div>

                    <div className="text-white font-extrabold text-sm">{addr.fullName}</div>
                    <div className="text-gray-400 text-xs leading-relaxed">
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ''}
                      <br />
                      {addr.city}, {addr.state} - {addr.pincode}
                    </div>
                    <div className="text-gray-300 text-xs font-medium pt-1 flex items-center gap-1.5">
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>Phone: {addr.mobile} {addr.alternativeNumber ? `| Alt: ${addr.alternativeNumber}` : ''}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#2A2A2D] pt-3 text-xs font-bold">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleOpenEditForm(addr)}
                        className="text-gray-300 hover:text-white transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1"
                      >
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(aId)}
                        className="text-red-400 hover:text-red-300 transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1"
                      >
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>

                    {!addr.isDefault && (
                      <button
                        onClick={() => handleSetDefaultAddress(aId)}
                        className="text-[#D4A04D] hover:underline transition-colors bg-transparent border-none cursor-pointer"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
