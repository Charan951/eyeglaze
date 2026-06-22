import { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

interface Transaction {
  id?: string;
  _id?: string;
  type: 'Refund' | 'Added' | 'Paid';
  amount: number;
  date: string | Date;
  description: string;
}

interface Card {
  id?: string;
  _id?: string;
  number: string;
  name: string;
  expiry: string;
  type: 'visa' | 'mastercard' | 'amex' | 'discover' | 'generic';
}

export default function WalletPage() {
  const { user, checkAuth } = useAuth();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  // Add Money Modal State
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [addMoneyMethod, setAddMoneyMethod] = useState('upi');
  const [isAddingMoney, setIsAddingMoney] = useState(false);

  useEffect(() => {
    if (user) {
      setWalletBalance(user.walletBalance ?? 0);
      setTransactions((user.transactions as Transaction[]) || []);
      setCards((user.savedCards as Card[]) || []);
    }
  }, [user]);

  const handleAddMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(addMoneyAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsAddingMoney(true);
    try {
      await api.post('/auth/wallet/add', { amount, method: addMoneyMethod });
      await checkAuth();
      setAddMoneyAmount('');
      setIsAddingMoney(false);
      setShowAddMoney(false);
    } catch (err: any) {
      console.error('Failed to add money:', err);
      alert(err.response?.data?.error || 'Failed to add money.');
      setIsAddingMoney(false);
    }
  };

  const formatDate = (dateStr: string | Date) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-8 text-white min-h-screen pb-12">
      <SEO robots="noindex, nofollow" title="My Wallet" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">My Wallet</h1>
        <p className="text-gray-500 text-sm">
          View your balance, add funds, and monitor recent transactions.
        </p>
      </div>

      <div className="max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Wallet Balance Card */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-lg">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
              <span>👛</span> EyeGlaze Wallet
            </h2>
            <div className="bg-gradient-to-r from-[#D4A04D]/15 to-[#C8923E]/10 border border-[#D4A04D]/20 rounded-2xl p-6 text-center relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 text-7xl opacity-5">👛</div>
              <div className="text-xs text-[#D4A04D] font-bold uppercase tracking-wider mb-1">Available Balance</div>
              <div className="text-4xl font-extrabold text-white">₹{walletBalance.toFixed(2)}</div>
              <button 
                type="button"
                onClick={() => setShowAddMoney(true)}
                className="mt-6 w-full bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold uppercase py-3 px-5 rounded-xl text-xs tracking-widest transition-all cursor-pointer"
              >
                + Add Money
              </button>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-lg">
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-4 border-b border-[#2A2A2D] pb-3 flex items-center gap-2">
              <span>📜</span> Transaction History
            </h3>
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">No transactions yet.</div>
              ) : (
                transactions.map((tx) => {
                  const txId = tx.id || tx._id || '';
                  return (
                    <div key={txId} className="flex justify-between items-center border-b border-[#2A2A2D]/30 pb-3 text-sm last:border-0 last:pb-0">
                      <div>
                        <div className="text-white font-semibold text-xs">{tx.description}</div>
                        <div className="text-[#A7A7A7] text-[10px] mt-1">{formatDate(tx.date)}</div>
                      </div>
                      <div className={`font-bold text-sm ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.amount > 0 ? `+₹${tx.amount.toFixed(2)}` : `-₹${Math.abs(tx.amount).toFixed(2)}`}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Money Modal */}
      {showAddMoney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0E0E0F] border border-[#2A2A2D] w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-[#2A2A2D] pb-3">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Add Money to Wallet</h3>
              <button
                onClick={() => setShowAddMoney(false)}
                className="text-gray-400 hover:text-white text-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMoneySubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Enter amount (e.g. 1000)"
                  value={addMoneyAmount}
                  onChange={(e) => setAddMoneyAmount(e.target.value)}
                  className="bg-[#1C1C1E] border border-[#2A2A2D] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4A04D]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                  Payment Method
                </label>
                <select
                  value={addMoneyMethod}
                  onChange={(e) => setAddMoneyMethod(e.target.value)}
                  className="bg-[#1C1C1E] border border-[#2A2A2D] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4A04D] cursor-pointer"
                >
                  <option value="upi">Linked UPI / Wallet</option>
                  {cards.map((c) => {
                    const cardId = c.id || c._id || '';
                    return (
                      <option key={cardId} value={cardId}>
                        Saved Card (•••• {c.number.slice(-4)})
                      </option>
                    );
                  })}
                  <option value="netbanking">Netbanking</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddMoney(false)}
                  className="border border-[#2A2A2D] hover:bg-[#1C1C1E] text-white font-bold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingMoney}
                  className="bg-[#D4A04D] text-black hover:bg-[#C8923E] font-bold text-xs py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isAddingMoney ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-t-black border-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Add Funds'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
