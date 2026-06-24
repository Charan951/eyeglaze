import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function PaymentsPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'purchases' | 'topups' | 'rewards'>('all');

  // Fetch orders representing direct order payments
  useEffect(() => {
    api.get('/orders')
      .then(res => {
        setOrders(res.data?.orders || []);
      })
      .catch(err => {
        console.error('Failed to fetch orders for payment page:', err);
      })
      .finally(() => {
        setLoadingOrders(false);
      });
  }, []);

  const getUnifiedTransactions = () => {
    const list: any[] = [];
    
    // Add orders as payment logs
    orders.forEach(order => {
      list.push({
        id: order._id || order.id,
        type: 'Order Payment',
        description: `Order #${order.orderId || (order._id ? order._id.substring(0, 8) : 'Order')}`,
        amount: -order.total,
        date: order.createdAt,
        method: order.paymentMethod === 'razorpay' ? 'Razorpay' : order.paymentMethod === 'wallet' ? 'Wallet' : 'Cash on Delivery',
        status: order.paymentStatus === 'paid' ? 'Success' : order.paymentStatus || 'Pending'
      });
    });

    // Add wallet transactions (exclude order deductions to avoid duplicate list items)
    const walletTx = (user?.transactions || []) as any[];
    walletTx.forEach(tx => {
      if (tx.type !== 'Order') {
        let displayType = tx.type;
        if (tx.type === 'Added') displayType = 'Funds Added';
        if (tx.type === 'Refund') displayType = 'Refund';
        if (tx.type === 'Paid') displayType = 'Paid';
        if (tx.type === 'Cashback') displayType = 'Cashback';

        let displayAmount = tx.amount;
        if (tx.type === 'Paid' && displayAmount > 0) {
          displayAmount = -displayAmount;
        }

        list.push({
          id: tx._id || tx.id,
          type: displayType,
          description: tx.description || 'Wallet Transaction',
          amount: displayAmount,
          date: tx.date,
          method: 'Wallet',
          status: 'Success'
        });
      }
    });

    // Sort chronologically (newest first)
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const allTransactions = getUnifiedTransactions();

  // Filter logic
  const filteredTransactions = allTransactions.filter(tx => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'purchases') {
      return tx.type === 'Order Payment' || tx.type === 'Paid';
    }
    if (activeFilter === 'topups') {
      return tx.type === 'Funds Added';
    }
    if (activeFilter === 'rewards') {
      return tx.type === 'Cashback' || tx.type === 'Refund';
    }
    return true;
  });

  // Calculate statistics
  const walletBalance = user?.walletBalance || 0;
  const totalSpent = allTransactions
    .filter(tx => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const totalRewards = allTransactions
    .filter(tx => tx.type === 'Cashback' || tx.type === 'Refund')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Helper for rendering transaction type icons
  const getTxIcon = (type: string) => {
    switch (type) {
      case 'Order Payment':
      case 'Paid':
        return '🛍️';
      case 'Funds Added':
        return '💵';
      case 'Cashback':
        return '🪙';
      case 'Refund':
        return '🔄';
      default:
        return '📝';
    }
  };

  return (
    <div className="space-y-8 text-white min-h-screen pb-12">
      <SEO robots="noindex, nofollow" title="Payment History" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Payment History</h1>
        <p className="text-gray-500 text-sm">
          Track and manage your order payments, wallet top-ups, and cashback rewards.
        </p>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
        {/* Wallet Balance Card */}
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between h-40">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl select-none">👛</div>
          <div>
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Wallet Balance</span>
            <h2 className="text-3xl font-extrabold text-[#D4A04D] mt-2">₹{walletBalance.toFixed(2)}</h2>
          </div>
          <div className="mt-4 flex items-center justify-between z-10">
            <span className="text-[10px] text-gray-500 font-medium">Secured wallet</span>
            <Link 
              to="/wallet" 
              className="bg-[#D4A04D]/10 hover:bg-[#D4A04D]/20 text-[#D4A04D] border border-[#D4A04D]/30 text-[10px] font-extrabold uppercase py-1.5 px-3 rounded-lg transition-all"
            >
              Go to Wallet →
            </Link>
          </div>
        </div>

        {/* Total Spent Card */}
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between h-40">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl select-none">🛍️</div>
          <div>
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Purchases</span>
            <h2 className="text-3xl font-extrabold text-white mt-2">₹{totalSpent.toFixed(2)}</h2>
          </div>
          <div className="mt-4">
            <span className="text-[10px] text-gray-500 font-medium">Accumulated orders & activations</span>
          </div>
        </div>

        {/* Total Cashback / Rewards Card */}
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between h-40">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl select-none">🪙</div>
          <div>
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Rewards & Refunds</span>
            <h2 className="text-3xl font-extrabold text-green-400 mt-2">₹{totalRewards.toFixed(2)}</h2>
          </div>
          <div className="mt-4">
            <span className="text-[10px] text-gray-500 font-medium">Cashback credits & refunds</span>
          </div>
        </div>
      </div>

      {/* Main Transactions Section */}
      <div className="max-w-4xl bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-lg">
        {/* Section Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-[#2A2A2D] pb-5">
          <h2 className="text-base font-bold uppercase tracking-wider flex items-center gap-2">
            <span>📜</span> Transaction Log
          </h2>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-[#1C1C1E] border border-[#2A2A2D] p-1 rounded-xl">
            {[
              { id: 'all', label: 'All' },
              { id: 'purchases', label: 'Purchases' },
              { id: 'topups', label: 'Top-ups' },
              { id: 'rewards', label: 'Rewards' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={`text-[10px] font-extrabold uppercase py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-[#D4A04D] text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction Table / List */}
        {loadingOrders ? (
          <div className="text-center py-16 text-gray-500 text-sm animate-pulse">
            Loading transaction records...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-16 text-gray-500 border border-dashed border-[#2A2A2D] rounded-xl text-sm flex flex-col items-center gap-2">
            <span className="text-3xl">📭</span>
            <span>No matching transaction records found.</span>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="space-y-4 md:hidden">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="bg-[#1C1C1E] border border-[#2A2A2D] rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        {new Date(tx.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      <div className="text-white font-bold text-xs flex items-center gap-1.5">
                        <span>{getTxIcon(tx.type)}</span>
                        <span>{tx.type}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 font-bold text-[10px] uppercase ${
                      tx.status.toLowerCase() === 'success' || tx.status.toLowerCase() === 'paid'
                        ? 'text-green-400'
                        : 'text-yellow-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        tx.status.toLowerCase() === 'success' || tx.status.toLowerCase() === 'paid'
                          ? 'bg-green-400'
                          : 'bg-yellow-400'
                      }`} />
                      {tx.status}
                    </span>
                  </div>
                  
                  <div className="text-gray-300 text-xs font-medium">{tx.description}</div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-[#2A2A2D]/30">
                    <span className="bg-[#0B0B0C] text-[#A7A7A7] px-2 py-0.5 rounded border border-[#2A2A2D] uppercase text-[9px] font-bold">
                      {tx.method}
                    </span>
                    <span className={`font-bold text-sm ${
                      tx.amount > 0 ? 'text-green-400' : 'text-white'
                    }`}>
                      {tx.amount > 0 ? `+₹${tx.amount.toFixed(2)}` : `-₹${Math.abs(tx.amount).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#2A2A2D]/80 text-[#A7A7A7] uppercase tracking-wider text-[10px] font-bold">
                    <th className="pb-3 pl-2">Date</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Description</th>
                    <th className="pb-3">Method</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 pr-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2A2D]/30">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 pl-2 text-gray-400 font-medium">
                        {new Date(tx.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      {/* Type with Icon */}
                      <td className="py-3.5 font-bold text-white">
                        <span className="flex items-center gap-1.5">
                          <span>{getTxIcon(tx.type)}</span>
                          <span>{tx.type}</span>
                        </span>
                      </td>
                      {/* Description */}
                      <td className="py-3.5 text-gray-300 font-medium">{tx.description}</td>
                      {/* Method Badge */}
                      <td className="py-3.5">
                        <span className="bg-[#1C1C1E] text-[#A7A7A7] px-2 py-0.5 rounded border border-[#2A2A2D] uppercase text-[9px] font-bold">
                          {tx.method}
                        </span>
                      </td>
                      {/* Status Badge */}
                      <td className="py-3.5">
                        <span className={`inline-flex items-center gap-1 font-bold text-[10px] uppercase ${
                          tx.status.toLowerCase() === 'success' || tx.status.toLowerCase() === 'paid'
                            ? 'text-green-400'
                            : 'text-yellow-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            tx.status.toLowerCase() === 'success' || tx.status.toLowerCase() === 'paid'
                              ? 'bg-green-400'
                              : 'bg-yellow-400'
                          }`} />
                          {tx.status}
                        </span>
                      </td>
                      {/* Amount */}
                      <td className={`py-3.5 pr-2 text-right font-bold text-sm ${
                        tx.amount > 0 ? 'text-green-400' : 'text-white'
                      }`}>
                        {tx.amount > 0 ? `+₹${tx.amount.toFixed(2)}` : `-₹${Math.abs(tx.amount).toFixed(2)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
