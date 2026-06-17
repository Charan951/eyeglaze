import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../lib/api';

export interface AuthUser {
  _id: string;
  name?: string;
  phone?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
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

  const fetchCartCount = useCallback(async () => {
    try {
      const res = await api.get('/cart');
      const cartItems = res.data?.items || res.data?.cart?.items || [];
      setCartCount(cartItems.length);
    } catch {
      setCartCount(0);
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
    try {
      const res = await api.get('/auth/me');
      const userData = res.data?.user || res.data || null;
      setUser(userData);
      if (userData) {
        const initialWishlist = (userData.wishlist || []).map((w: any) => 
          typeof w === 'object' && w?._id ? w._id.toString() : w.toString()
        );
        setWishlist(initialWishlist);
        
        // Fetch cart count
        const cartRes = await api.get('/cart');
        const cartItems = cartRes.data?.items || cartRes.data?.cart?.items || [];
        setCartCount(cartItems.length);
      } else {
        setWishlist([]);
        setCartCount(0);
      }
    } catch {
      setUser(null);
      setWishlist([]);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = (u: AuthUser) => {
    setUser(u);
    if (u) {
      const initialWishlist = (u.wishlist as any[] || []).map((w: any) => 
        typeof w === 'object' && w?._id ? w._id.toString() : w.toString()
      );
      setWishlist(initialWishlist);
      fetchCartCount();
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('token');
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
