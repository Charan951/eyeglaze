import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../lib/api';
import { socket } from '../lib/socket';

export interface AuthUser {
  _id: string;
  name?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  role?: string;
  walletBalance?: number;
  savedCards?: any[];
  linkedWallets?: any[];
  transactions?: any[];
  addresses?: any[];
  wishlist?: any[];
  membershipActive?: boolean;
  membershipExpiry?: string | Date;
  oneRupeeOfferUsed?: boolean;
  oneRupeeOfferCount?: number;
  previousOrderCount?: number;
  [key: string]: any;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  cartCount: number;
  fetchCartCount: () => Promise<void>;
  wishlist: string[];
  toggleWishlist: (productId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    const handleAuthLogout = () => {
      localStorage.removeItem('eyeglaze_logged_in');
      setUser(null);
      setWishlist([]);
      setCartCount(0);
    };
    window.addEventListener('auth-logout', handleAuthLogout);
    return () => window.removeEventListener('auth-logout', handleAuthLogout);
  }, []);

  const fetchCartCount = useCallback(async () => {
    if (!user) {
      try {
        const guestCartStr = localStorage.getItem('guest_cart');
        const cartItems = guestCartStr ? JSON.parse(guestCartStr) : [];
        setCartCount(cartItems.length);
      } catch {
        setCartCount(0);
      }
      return;
    }

    try {
      const res = await api.get('/cart');
      const cartItems = res.data?.items || res.data?.cart?.items || [];
      setCartCount(cartItems.length);
    } catch {
      setCartCount(0);
    }
  }, [user]);

  const syncLocalCart = useCallback(async () => {
    const guestCartStr = localStorage.getItem('guest_cart');
    if (!guestCartStr) return;
    try {
      const items = JSON.parse(guestCartStr);
      if (items.length === 0) return;

      for (const item of items) {
        let uploadedFileUrl = item.lensPayload?.power?.uploadedFileUrl || '';
        if (uploadedFileUrl && uploadedFileUrl.startsWith('data:')) {
          try {
            const resBlob = await fetch(uploadedFileUrl);
            const blob = await resBlob.blob();
            const mimeType = blob.type || 'image/jpeg';
            let filename = 'prescription.jpg';
            if (mimeType === 'application/pdf') {
              filename = 'prescription.pdf';
            } else if (mimeType === 'image/png') {
              filename = 'prescription.png';
            } else if (mimeType === 'image/webp') {
              filename = 'prescription.webp';
            }
            const file = new File([blob], filename, { type: mimeType });
            
            const formData = new FormData();
            formData.append('file', file);
            const uploadRes = await api.post('/prescriptions', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            uploadedFileUrl = uploadRes.data.prescription?.uploadedFile || uploadRes.data.prescription?.imageUrl || '';
          } catch (uploadErr) {
            console.error('Failed to upload guest prescription:', uploadErr);
          }
        }

        const payload = {
          productId: item.productId,
          color: item.color,
          qty: item.qty,
          ...(item.lensPayload ? {
            lens: {
              ...item.lensPayload,
              power: {
                ...item.lensPayload.power,
                uploadedFileUrl
              }
            }
          } : {})
        };
        await api.post('/cart', payload);
      }
      localStorage.removeItem('guest_cart');
    } catch (err) {
      console.error('Failed to sync guest cart:', err);
    }
  }, []);

  const toggleWishlist = async (productId: string) => {
    try {
      const res = await api.post('/wishlist/toggle', { productId });
      if (res.data && res.data.wishlist) {
        setWishlist(res.data.wishlist.map((w: any) => 
          typeof w === 'object' && w?._id ? w._id.toString() : w.toString()
        ));
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    }
  };

  const checkAuth = useCallback(async () => {
    if (localStorage.getItem('eyeglaze_logged_in') !== 'true') {
      setUser(null);
      setWishlist([]);
      try {
        const guestCartStr = localStorage.getItem('guest_cart');
        const cartItems = guestCartStr ? JSON.parse(guestCartStr) : [];
        setCartCount(cartItems.length);
      } catch {
        setCartCount(0);
      }
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      const userData = res.data?.user || res.data || null;
      setUser(userData);
      if (userData) {
        localStorage.setItem('eyeglaze_logged_in', 'true');
        const initialWishlist = (userData.wishlist || []).map((w: any) => 
          typeof w === 'object' && w?._id ? w._id.toString() : w.toString()
        );
        setWishlist(initialWishlist);
        
        await syncLocalCart();
        
        // Fetch cart count
        const cartRes = await api.get('/cart');
        const cartItems = cartRes.data?.items || cartRes.data?.cart?.items || [];
        setCartCount(cartItems.length);
      } else {
        localStorage.removeItem('eyeglaze_logged_in');
        setWishlist([]);
        const guestCartStr = localStorage.getItem('guest_cart');
        const cartItems = guestCartStr ? JSON.parse(guestCartStr) : [];
        setCartCount(cartItems.length);
      }
    } catch {
      localStorage.removeItem('eyeglaze_logged_in');
      setUser(null);
      setWishlist([]);
      try {
        const guestCartStr = localStorage.getItem('guest_cart');
        const cartItems = guestCartStr ? JSON.parse(guestCartStr) : [];
        setCartCount(cartItems.length);
      } catch {
        setCartCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, [syncLocalCart]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Manage socket.io user-specific room connections
  useEffect(() => {
    if (user && user._id) {
      socket.emit('join_user_room', user._id.toString());
      return () => {
        socket.emit('leave_user_room', user._id.toString());
      };
    }
  }, [user]);

  // Sync cart count when cart changes in another tab/device via Socket.io
  useEffect(() => {
    const handleCartChanged = () => {
      fetchCartCount();
    };
    socket.on('cart_changed', handleCartChanged);
    return () => {
      socket.off('cart_changed', handleCartChanged);
    };
  }, [fetchCartCount]);

  // Sync guest cart count across tabs via storage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'guest_cart') {
        fetchCartCount();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchCartCount]);

  const login = async (u: AuthUser) => {
    localStorage.setItem('eyeglaze_logged_in', 'true');
    setUser(u);
    if (u) {
      const initialWishlist = (u.wishlist as any[] || []).map((w: any) => 
        typeof w === 'object' && w?._id ? w._id.toString() : w.toString()
      );
      setWishlist(initialWishlist);
      await syncLocalCart();
      await fetchCartCount();
      await checkAuth();
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('eyeglaze_logged_in');
      setUser(null);
      setWishlist([]);
      setCartCount(0);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth, cartCount, fetchCartCount, wishlist, toggleWishlist }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
