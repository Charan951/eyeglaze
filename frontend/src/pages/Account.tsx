import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/ui/StatusBadge';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

interface OrderItemRow {
  name: string;
  sku: string;
  color: string;
}

interface Order {
  _id: string;
  orderId: string;
  createdAt: string;
  status: string;
  total: number;
  items: OrderItemRow[];
}

const mockOrders: Order[] = [
  {
    _id: 'ord1',
    orderId: 'EGO-20260616-0001',
    createdAt: '2026-06-16T10:00:00Z',
    status: 'processing',
    total: 1298,
    items: [{ name: 'Matte Square Frame', sku: 'EG-2041', color: 'Matte Black' }],
  },
  {
    _id: 'ord2',
    orderId: 'EGO-20260610-0002',
    createdAt: '2026-06-10T14:30:00Z',
    status: 'delivered',
    total: 799,
    items: [{ name: 'Classic Aviator', sku: 'EG-3012', color: 'Gold' }],
  },
];

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export default function AccountPage() {
  const { user, checkAuth } = useAuth();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let active = true;
    api.get('/orders')
      .then(res => {
        if (!active) return;
        const data = res.data?.orders;
        if (data?.length) setOrders(data);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgradeToGold = async () => {
    if (!user) return;

    setIsProcessing(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Failed to load Razorpay. Please try again.');
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_STX1H1R9XvVjSZ', // Razorpay TEST Key ID
        amount: 12900, // ₹129 in paise (129 * 100)
        currency: 'INR',
        name: 'EyeGlaze',
        description: 'Gold Membership',
        handler: async (_response: any) => {
          try {
            await api.post('/auth/membership/activate', { paymentMethod: 'razorpay' });
            await checkAuth();
            alert('Gold Membership activated successfully!');
          } catch (err: any) {
            alert('Failed to activate membership: ' + (err.response?.data?.error || err.message));
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || user.mobile || '',
        },
        theme: {
          color: '#2563EB',
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'UPI / Google Pay / PhonePe',
                instruments: [
                  {
                    method: 'upi',
                    flows: ['intent', 'collect', 'qr']
                  }
                ]
              },
              card: {
                name: 'Credit / Debit Cards',
                instruments: [
                  {
                    method: 'card'
                  }
                ]
              },
              wallet: {
                name: 'Wallets (Paytm / PhonePe)',
                instruments: [
                  {
                    method: 'wallet'
                  }
                ]
              }
            },
            sequence: ['block.upi', 'block.card', 'block.wallet'],
            preferences: {
              show_default_blocks: false
            }
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Razorpay error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const liveOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <SEO robots="noindex, nofollow" title="Account Dashboard" />
        <div className="text-[#A7A7A7] animate-pulse">Loading orders...</div>
      </div>
    );
  }

  const renderOrderList = (orderList: Order[], emptyMsg: string) => {
    if (orderList.length === 0) {
      return (
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-8 text-center text-gray-500 text-sm">
          {emptyMsg}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {orderList.map(order => (
          <div key={order._id} className="bg-[#131314] border border-[#2A2A2D] rounded-xl p-5 hover:border-[#D4A04D]/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-white font-bold">{order.orderId}</div>
                <div className="text-[#A7A7A7] text-xs mt-1">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} />
                <span className="text-[#D4A04D] font-bold">₹{order.total}</span>
              </div>
            </div>

            <div className="border-t border-[#2A2A2D] pt-3 space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#222] rounded-lg flex items-center justify-center">
                    <span className="text-lg">👓</span>
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">{item.name}</div>
                    <div className="text-[#A7A7A7] text-xs">{item.sku} · {item.color}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-3">
              <Link to={`/orders/${order._id}`} className="text-[#D4A04D] text-sm hover:underline font-semibold">View Details</Link>
              {order.status === 'shipped' && (
                <Link to={`/track/${order._id}`} className="text-[#D4A04D] text-sm hover:underline font-semibold">Track Order</Link>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <SEO robots="noindex, nofollow" title="Account Dashboard" />
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Customer Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome back, {user?.name || 'Customer'}. Monitor your live and completed orders below.</p>
      </div>

      {/* Gold Membership Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#D4A04D]/30 bg-gradient-to-br from-[#2a1f0e] via-[#1a140a] to-[#0d0b07] p-6">
        <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-[#D4A04D]/10 rounded-full blur-3xl"></div>
        <div className="absolute left-[-20px] bottom-[-20px] w-40 h-40 bg-[#D4A04D]/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-[#D4A04D] to-[#8b6524] flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(212,160,77,0.3)]">
              {user?.membershipActive ? '👑' : '⭐'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Gold Membership
                {user?.membershipActive && (
                  <span className="px-3 py-1 rounded-full bg-[#D4A04D]/20 text-[#D4A04D] text-xs font-bold border border-[#D4A04D]/30">
                    Active
                  </span>
                )}
              </h3>
              {user?.membershipActive ? (
                <div className="mt-2 space-y-1">
                  <p className="text-[#A7A7A7] text-sm">
                    Enjoy all Gold benefits! Your membership expires on{' '}
                    <span className="text-[#D4A04D] font-semibold">
                      {user.membershipExpiry ? new Date(user.membershipExpiry as string | number | Date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  <p className="text-[#A7A7A7] text-sm">
                    Unlock exclusive benefits: ₹1 frames, Buy One Get One offers, cashback & more!
                  </p>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• ₹1 frames on select products</li>
                    <li>• Buy 1 Get 1 Free offers</li>
                    <li>• 5% cashback on every order</li>
                    <li>• Priority customer support</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <Link to="/membership" className="text-[#D4A04D] font-semibold hover:underline">
              View Details →
            </Link>
            {!user?.membershipActive && (
              <>
                <button
                  onClick={handleUpgradeToGold}
                  disabled={isProcessing}
                  className="px-8 py-3 bg-gradient-to-r from-[#D4A04D] to-[#b3823b] hover:from-[#e6b45c] hover:to-[#c4934c] text-black font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Upgrade to Gold - ₹129/year'}
                </button>
                <button
                  onClick={async () => {
                    setIsProcessing(true);
                    try {
                      await api.post('/auth/membership/activate', { paymentMethod: 'razorpay' });
                      await checkAuth();
                      alert('🎉 Test: Gold Membership activated successfully! Enjoy your benefits!');
                    } catch (err: any) {
                      alert('Failed to activate membership: ' + (err.response?.data?.error || err.message));
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  disabled={isProcessing}
                  className="px-8 py-3 bg-transparent border-2 border-dashed border-[#D4A04D] text-[#D4A04D] font-bold rounded-xl hover:bg-[#D4A04D]/10 transition-all disabled:opacity-50 text-sm uppercase tracking-wider"
                >
                  Test Activation (Skip Payment)
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Live Orders Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse" />
          <span>Live Orders</span>
          <span className="text-xs bg-[#131314] border border-[#2A2A2D] text-gray-400 px-2 py-0.5 rounded-full font-normal">
            {liveOrders.length}
          </span>
        </h2>
        {renderOrderList(liveOrders, 'No live orders currently. Start shopping to place an order!')}
      </div>

      {/* Completed Orders Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
          <span>Completed & Cancelled Orders</span>
          <span className="text-xs bg-[#131314] border border-[#2A2A2D] text-gray-400 px-2 py-0.5 rounded-full font-normal">
            {completedOrders.length}
          </span>
        </h2>
        {renderOrderList(completedOrders, 'No completed or cancelled orders found.')}
      </div>
    </div>
  );
}
