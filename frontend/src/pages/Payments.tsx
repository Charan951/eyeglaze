import { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

interface Card {
  id?: string;
  _id?: string;
  number: string;
  name: string;
  expiry: string;
  cvv?: string;
  type: 'visa' | 'mastercard' | 'amex' | 'discover' | 'generic';
  bgClass: string;
}

interface Wallet {
  id?: string;
  _id?: string;
  walletId: string;
  name: string;
  icon: string;
  linked: boolean;
  emailOrPhone?: string;
}


interface Transaction {
  id?: string;
  _id?: string;
  type: 'Refund' | 'Added' | 'Paid';
  amount: number;
  date: string | Date;
  description: string;
}

export default function PaymentsPage() {
  const { user, checkAuth } = useAuth();

  const [cards, setCards] = useState<Card[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  // Sync state with authenticated user context
  useEffect(() => {
    if (user) {
      setCards((user.savedCards as Card[]) || []);
      setWallets((user.linkedWallets as Wallet[]) || []);
    }
  }, [user]);

  // Add Card Modal State
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [error, setError] = useState('');
  const [linkingWalletId, setLinkingWalletId] = useState<string | null>(null);
  const [walletInput, setWalletInput] = useState('');



  const getCardType = (num: string): Card['type'] => {
    const cleanNum = num.replace(/\D/g, '');
    if (cleanNum.startsWith('4')) return 'visa';
    if (cleanNum.startsWith('5')) return 'mastercard';
    if (cleanNum.startsWith('3')) return 'amex';
    if (cleanNum.startsWith('6')) return 'discover';
    return 'generic';
  };

  const getCardBg = (type: Card['type']) => {
    switch (type) {
      case 'visa':
        return 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
      case 'mastercard':
        return 'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)';
      case 'amex':
        return 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
      case 'discover':
        return 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)';
      default:
        return 'linear-gradient(135deg, #434343 0%, #090909 100%)';
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.substring(0, 16);
    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.substring(0, 4);
    if (val.length > 2) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }
    setCardExpiry(val);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.substring(0, 4);
    setCardCvv(val);
  };

  const handleAddCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = cardNumber.replace(/\s/g, '');
    if (cleanNum.length < 15) {
      setError('Please enter a valid credit card number.');
      return;
    }
    if (!cardName.trim()) {
      setError('Please enter the cardholder name.');
      return;
    }
    if (cardExpiry.length < 5) {
      setError('Expiry must be MM/YY.');
      return;
    }
    if (cardCvv.length < 3) {
      setError('CVV must be 3 or 4 digits.');
      return;
    }

    const type = getCardType(cardNumber);
    try {
      await api.post('/auth/cards', {
        number: `•••• •••• •••• ${cleanNum.slice(-4)}`,
        name: cardName.trim(),
        expiry: cardExpiry,
        type,
        bgClass: getCardBg(type),
      });
      await checkAuth();
      setCardNumber('');
      setCardName('');
      setCardExpiry('');
      setCardCvv('');
      setShowAddCard(false);
      setError('');
      setIsFlipped(false);
    } catch (err: any) {
      console.error('Failed to save card:', err);
      setError(err.response?.data?.error || 'Failed to save card.');
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this card?')) return;
    try {
      await api.delete(`/auth/cards/${id}`);
      await checkAuth();
    } catch (err) {
      console.error('Failed to delete card:', err);
      alert('Failed to remove card.');
    }
  };

  const toggleWalletLink = async (walletId: string, currentlyLinked: boolean) => {
    if (currentlyLinked) {
      if (window.confirm('Are you sure you want to unlink this wallet?')) {
        try {
          await api.put(`/auth/wallets/${walletId}`, { linked: false });
          await checkAuth();
        } catch (err) {
          console.error('Failed to unlink wallet:', err);
          alert('Failed to unlink wallet.');
        }
      }
    } else {
      setLinkingWalletId(walletId);
    }
  };

  const handleConfirmWalletLink = async (walletId: string) => {
    if (!walletInput.trim()) return;
    try {
      await api.put(`/auth/wallets/${walletId}`, { linked: true, emailOrPhone: walletInput });
      await checkAuth();
      setWalletInput('');
      setLinkingWalletId(null);
    } catch (err) {
      console.error('Failed to link wallet:', err);
      alert('Failed to link wallet.');
    }
  };

  const detectedType = getCardType(cardNumber);

  return (
    <div className="space-y-8 text-white min-h-screen pb-12">
      <SEO robots="noindex, nofollow" title="Payment Methods" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Payment Methods</h1>
        <p className="text-gray-500 text-sm">
          Securely manage your saved credit/debit cards and digital wallets for quick checkout.
        </p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Saved Cards */}
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold uppercase tracking-wider flex items-center gap-2">
                <span>💳</span> Saved Cards
              </h2>
              <button
                onClick={() => setShowAddCard(true)}
                className="bg-[#D4A04D]/10 hover:bg-[#D4A04D]/20 border border-[#D4A04D]/30 text-[#D4A04D] font-bold text-xs py-2 px-4 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                + Add Card
              </button>
            </div>

            {cards.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border border-dashed border-[#2A2A2D] rounded-xl text-sm">
                No credit or debit cards saved yet. Click Add Card to save one.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map((card) => {
                  const cardId = card.id || card._id || '';
                  return (
                    <div
                      key={cardId}
                      className="relative rounded-xl p-5 border border-white/5 flex flex-col justify-between h-40 select-none transition-transform hover:-translate-y-1 hover:shadow-xl overflow-hidden"
                      style={{ background: card.bgClass }}
                    >
                      <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] pointer-events-none" />

                      <div className="flex items-start justify-between relative z-10">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-white/70 uppercase tracking-widest font-bold">
                            {card.type}
                          </span>
                          <div className="w-8 h-6 bg-yellow-400/20 border border-yellow-400/50 rounded-md mt-1 flex items-center justify-center">
                            <span className="text-[10px]">🪙</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteCard(cardId)}
                          className="text-white/40 hover:text-red-400 hover:bg-white/10 p-1 rounded-lg transition-colors cursor-pointer text-xs"
                          title="Remove Card"
                        >
                          🗑️
                        </button>
                      </div>

                      <div className="relative z-10">
                        <div className="text-white text-base font-mono tracking-widest">{card.number}</div>
                        <div className="flex justify-between items-end mt-4">
                          <div className="flex flex-col">
                            <span className="text-[7px] text-white/50 uppercase tracking-wider">
                              Card Holder
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wider truncate max-w-[120px]">
                              {card.name}
                            </span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-[7px] text-white/50 uppercase tracking-wider">
                              Expires
                            </span>
                            <span className="text-xs font-semibold font-mono">{card.expiry}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Linked Wallets */}
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-lg">
            <h2 className="text-base font-bold uppercase tracking-wider flex items-center gap-2 mb-6">
              <span>👛</span> Linked Mobile Wallets
            </h2>

            <div className="space-y-4">
              {wallets.map((wallet) => {
                const wId = wallet.walletId || wallet.id || '';
                return (
                  <div
                    key={wId}
                    className="flex items-center justify-between p-4 bg-[#1C1C1E] border border-[#2A2A2D] rounded-xl hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl w-10 h-10 bg-[#131314] border border-[#2A2A2D] rounded-xl flex items-center justify-center">
                        {wallet.icon}
                      </span>
                      <div>
                        <div className="text-white text-sm font-bold">{wallet.name}</div>
                        {wallet.linked && wallet.emailOrPhone ? (
                          <div className="text-[#A7A7A7] text-xs mt-0.5">Linked: {wallet.emailOrPhone}</div>
                        ) : (
                          <div className="text-gray-500 text-xs mt-0.5">Not linked</div>
                        )}
                      </div>
                    </div>

                    <div>
                      {linkingWalletId === wId ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={walletInput}
                            onChange={(e) => setWalletInput(e.target.value)}
                            placeholder={wId === 'applepay' ? 'iCloud email' : 'Mobile number / UPI'}
                            className="bg-[#131314] border border-[#2D2D30] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4A04D] w-40"
                          />
                          <button
                            onClick={() => handleConfirmWalletLink(wId)}
                            className="bg-[#D4A04D] text-black font-extrabold text-[10px] uppercase py-1.5 px-3 rounded-lg hover:bg-[#C8923E] cursor-pointer"
                          >
                            Link
                          </button>
                          <button
                            onClick={() => { setLinkingWalletId(null); setWalletInput(''); }}
                            className="text-gray-400 hover:text-white text-xs px-1.5 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleWalletLink(wId, wallet.linked)}
                          className={`text-xs font-bold py-1.5 px-4 rounded-xl border transition-colors cursor-pointer ${
                            wallet.linked
                              ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              : 'border-[#D4A04D]/30 bg-[#D4A04D]/10 text-[#D4A04D] hover:bg-[#D4A04D]/20'
                          }`}
                        >
                          {wallet.linked ? 'Unlink' : 'Link Account'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>



      {/* Add Card Modal */}
      {showAddCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0E0E0F] border border-[#2A2A2D] w-full max-w-lg rounded-2xl shadow-2xl p-6 flex flex-col gap-6 animate-scale-up">
            <div className="flex items-center justify-between border-b border-[#2A2A2D] pb-3">
              <h3 className="text-lg font-bold text-white">Add New Card</h3>
              <button
                onClick={() => setShowAddCard(false)}
                className="text-gray-400 hover:text-white text-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Credit Card Container (3D Flip Effect) */}
            <div className="flex justify-center py-2">
              <div
                className="w-80 h-48 select-none relative"
                style={{ perspective: '1000px' }}
              >
                <div
                  className="w-full h-full duration-500 relative"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  {/* Card Front */}
                  <div
                    className="absolute inset-0 rounded-xl p-5 border border-white/10 flex flex-col justify-between overflow-hidden shadow-2xl"
                    style={{
                      background: getCardBg(detectedType),
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-[0.5px]" />
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <span className="text-[10px] text-white/70 uppercase tracking-widest font-extrabold">
                          {detectedType.toUpperCase()}
                        </span>
                        <div className="w-9 h-7 bg-yellow-400/20 border border-yellow-400/50 rounded-md mt-1" />
                      </div>
                      <span className="text-white text-xl font-bold italic tracking-wide">
                        {detectedType === 'visa'
                          ? 'Visa'
                          : detectedType === 'mastercard'
                          ? 'Mastercard'
                          : detectedType === 'amex'
                          ? 'Amex'
                          : 'Card'}
                      </span>
                    </div>

                    <div className="relative z-10">
                      <div className="text-white text-base md:text-lg font-mono tracking-widest">
                        {cardNumber || '•••• •••• •••• ••••'}
                      </div>
                      <div className="flex justify-between items-end mt-4">
                        <div className="flex flex-col">
                          <span className="text-[7px] text-white/50 uppercase tracking-wider">
                            Card Holder
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-wider truncate max-w-[150px]">
                            {cardName || 'YOUR FULL NAME'}
                          </span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[7px] text-white/50 uppercase tracking-wider">
                            Expires
                          </span>
                          <span className="text-xs font-semibold font-mono">
                            {cardExpiry || 'MM/YY'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Back */}
                  <div
                    className="absolute inset-0 rounded-xl bg-slate-800 border border-white/10 flex flex-col justify-between py-5 overflow-hidden shadow-2xl"
                    style={{
                      background: getCardBg(detectedType),
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-[0.5px]" />
                    <div className="w-full h-10 bg-black/80 relative z-10 mt-2" />
                    <div className="px-5 mt-4 relative z-10 flex flex-col gap-1.5">
                      <div className="flex justify-end pr-2">
                        <span className="text-[6px] text-white/50 uppercase tracking-wider">
                          CVV Code
                        </span>
                      </div>
                      <div className="bg-white text-black font-mono text-sm py-1.5 px-3 rounded flex justify-end font-bold tracking-widest">
                        {cardCvv || '•••'}
                      </div>
                    </div>
                    <div className="px-5 text-[7px] text-white/40 leading-none relative z-10 flex items-end justify-between">
                      <span>SECURE 128-BIT AUTHENTICATION</span>
                      <span>EYEGLAZE INC.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAddCardSubmit} className="flex flex-col gap-4">
              {error && <div className="text-red-400 text-xs bg-red-900/10 border border-red-500/20 p-2.5 rounded-lg">{error}</div>}

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                  Card Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="4000 1234 5678 9010"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  onFocus={() => setIsFlipped(false)}
                  className="bg-[#1C1C1E] border border-[#2A2A2D] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4A04D]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manoj Kumar"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  onFocus={() => setIsFlipped(false)}
                  className="bg-[#1C1C1E] border border-[#2A2A2D] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4A04D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                    Expiration (MM/YY)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="12/29"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    onFocus={() => setIsFlipped(false)}
                    className="bg-[#1C1C1E] border border-[#2A2A2D] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4A04D]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                    CVV
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="123"
                    value={cardCvv}
                    onChange={handleCvvChange}
                    onFocus={() => setIsFlipped(true)}
                    onBlur={() => setIsFlipped(false)}
                    className="bg-[#1C1C1E] border border-[#2A2A2D] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4A04D]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCard(false)}
                  className="border border-[#2A2A2D] hover:bg-[#1C1C1E] text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#D4A04D] text-black hover:bg-[#C8923E] font-bold text-xs py-2.5 px-6 rounded-xl transition-all cursor-pointer"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
