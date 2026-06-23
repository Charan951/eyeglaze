import { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

interface EyePower {
  sph?: number;
  cyl?: number;
  axis?: number;
}

interface SavedPrescription {
  id?: string;
  _id: string;
  RE?: EyePower;
  LE?: EyePower;
  pd?: number;
  uploadedFile?: string;
  imageUrl?: string;
  verified: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  createdAt: string | Date;
}

export default function SavedPowersPage() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<SavedPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Add Power Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [reSph, setReSph] = useState('0.00');
  const [reCyl, setReCyl] = useState('0.00');
  const [reAxis, setReAxis] = useState('0');
  const [leSph, setLeSph] = useState('0.00');
  const [leCyl, setLeCyl] = useState('0.00');
  const [leAxis, setLeAxis] = useState('0');
  const [pd, setPd] = useState('62.0');
  const [saving, setSaving] = useState(false);

  const fetchPrescriptions = async () => {
    try {
      const res = await api.get('/prescriptions');
      setPrescriptions(res.data.prescriptions || []);
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
      setError('Failed to load saved powers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPrescriptions();
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this saved power?')) return;
    try {
      await api.delete(`/prescriptions/${id}`);
      setPrescriptions(prev => prev.filter(p => p._id !== id));
      alert('Saved power deleted successfully.');
    } catch (err) {
      console.error('Failed to delete prescription:', err);
      alert('Failed to delete saved power. Please try again.');
    }
  };

  const handleAddPowerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const hasAstigmatismRE = parseFloat(reCyl) !== 0;
      const hasAstigmatismLE = parseFloat(leCyl) !== 0;
      if ((hasAstigmatismRE && !reAxis) || (hasAstigmatismLE && !leAxis)) {
        alert('Please select AXIS for astigmatism (when CYL is not 0)');
        setSaving(false);
        return;
      }

      const payload = {
        RE: JSON.stringify({ sph: parseFloat(reSph), cyl: parseFloat(reCyl), axis: parseInt(reAxis) }),
        LE: JSON.stringify({ sph: parseFloat(leSph), cyl: parseFloat(leCyl), axis: parseInt(leAxis) }),
        pd: parseFloat(pd)
      };

      const res = await api.post('/prescriptions', payload);
      if (res.data.prescription) {
        setPrescriptions(prev => [res.data.prescription, ...prev]);
        setShowAddForm(false);
        // Reset form
        setReSph('0.00');
        setReCyl('0.00');
        setReAxis('0');
        setLeSph('0.00');
        setLeCyl('0.00');
        setLeAxis('0');
        setPd('62.0');
        alert('Power saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save power:', err);
      alert('Failed to save power. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string | Date) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatValue = (val?: number) => {
    if (val === undefined || isNaN(val)) return '0.00';
    return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
  };

  return (
    <div className="space-y-8 text-white min-h-screen pb-12">
      <SEO robots="noindex, nofollow" title="Saved Powers & Prescriptions" />

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Saved Powers</h1>
          <p className="text-gray-500 text-sm">
            Manage your saved eye powers and uploaded doctor prescriptions.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold uppercase py-2.5 px-6 rounded-xl text-xs tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
        >
          {showAddForm ? '✕ Cancel' : '+ Add Here My Power'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6 shadow-xl max-w-2xl animate-fade-in text-left">
          <h3 className="text-base font-bold text-white uppercase tracking-wider mb-4 border-b border-[#2A2A2D] pb-3">
            Add New Eye Power Manually
          </h3>
          
          <form onSubmit={handleAddPowerSubmit} className="space-y-6">
            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-extrabold text-[#A7A7A7] border-b border-[#2A2A2D]/70 pb-2 uppercase tracking-widest">
              <div className="text-left" />
              <div>SPH (Sphere)</div>
              <div>CYL (Cylinder)</div>
              <div>AXIS</div>
            </div>

            {/* Right Eye Row */}
            <div className="grid grid-cols-4 gap-2 items-center text-center">
              <div className="text-[#D4A04D] text-xs font-black text-left">Right Eye (R)</div>
              <div>
                <select value={reSph} onChange={e => setReSph(e.target.value)} className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-lg px-2.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4A04D] cursor-pointer">
                  {Array.from({ length: 81 }, (_, i) => (-10 + i * 0.25).toFixed(2)).map(v => (
                    <option key={v} value={v}>{parseFloat(v) > 0 ? `+${v}` : v}</option>
                  ))}
                </select>
              </div>
              <div>
                <select value={reCyl} onChange={e => setReCyl(e.target.value)} className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-lg px-2.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4A04D] cursor-pointer">
                  {Array.from({ length: 49 }, (_, i) => (-6 + i * 0.25).toFixed(2)).map(v => (
                    <option key={v} value={v}>{parseFloat(v) > 0 ? `+${v}` : v}</option>
                  ))}
                </select>
              </div>
              <div>
                <select value={reAxis} onChange={e => setReAxis(e.target.value)} className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-lg px-2.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4A04D] cursor-pointer">
                  {Array.from({ length: 181 }, (_, i) => i.toString()).map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Left Eye Row */}
            <div className="grid grid-cols-4 gap-2 items-center text-center">
              <div className="text-[#D4A04D] text-xs font-black text-left">Left Eye (L)</div>
              <div>
                <select value={leSph} onChange={e => setLeSph(e.target.value)} className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-lg px-2.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4A04D] cursor-pointer">
                  {Array.from({ length: 81 }, (_, i) => (-10 + i * 0.25).toFixed(2)).map(v => (
                    <option key={v} value={v}>{parseFloat(v) > 0 ? `+${v}` : v}</option>
                  ))}
                </select>
              </div>
              <div>
                <select value={leCyl} onChange={e => setLeCyl(e.target.value)} className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-lg px-2.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4A04D] cursor-pointer">
                  {Array.from({ length: 49 }, (_, i) => (-6 + i * 0.25).toFixed(2)).map(v => (
                    <option key={v} value={v}>{parseFloat(v) > 0 ? `+${v}` : v}</option>
                  ))}
                </select>
              </div>
              <div>
                <select value={leAxis} onChange={e => setLeAxis(e.target.value)} className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-lg px-2.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4A04D] cursor-pointer">
                  {Array.from({ length: 181 }, (_, i) => i.toString()).map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* PD */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#2A2A2D]/55">
              <label className="text-gray-400 text-xs font-bold uppercase tracking-wide">
                PD (Pupillary Distance)
              </label>
              <div className="flex items-center gap-1.5 bg-[#0B0B0C] border border-[#2A2A2D] rounded-lg px-3 py-2">
                <input
                  type="text"
                  value={pd}
                  onChange={e => setPd(e.target.value)}
                  className="bg-transparent border-none text-white text-xs focus:outline-none w-10 text-center font-bold"
                />
                <span className="text-gray-500 text-[10px] font-bold">mm</span>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-[#2A2A2D]">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold uppercase py-2.5 px-6 rounded-xl transition-all text-xs tracking-wider disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Power'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-transparent hover:bg-white/5 text-white border border-[#2A2A2D] font-bold uppercase py-2.5 px-6 rounded-xl transition-all text-xs tracking-wider"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-[#A7A7A7]">Loading saved powers...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-400">{error}</div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-12 text-center text-gray-500 text-sm">
          <div className="text-5xl mb-4">👓</div>
          <p className="font-semibold">No saved powers yet.</p>
          <p className="text-xs text-gray-600 mt-1">Configure and save your power during checkout or add one manually above.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {prescriptions.map((pr) => (
            <div
              key={pr._id}
              className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-5 hover:border-[#D4A04D]/50 transition-all flex flex-col justify-between text-left"
            >
              <div className="space-y-4">
                {/* Header card details */}
                <div className="flex justify-between items-start border-b border-[#2A2A2D]/50 pb-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      Saved on {formatDate(pr.createdAt)}
                    </span>
                    <h3 className="text-white text-xs font-black uppercase tracking-wider">
                      {pr.uploadedFile ? 'Doctor Prescription Document' : 'Manually Entered Power'}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleDelete(pr._id)}
                    className="text-red-400 hover:text-red-300 text-xs font-semibold hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Delete
                  </button>
                </div>

                {/* Body Details */}
                {pr.uploadedFile ? (
                  <div className="flex gap-4 items-center">
                    <a
                      href={pr.uploadedFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-16 h-16 rounded-xl bg-[#222] border border-[#2A2A2D] overflow-hidden flex items-center justify-center cursor-zoom-in"
                    >
                      <img src={pr.uploadedFile} alt="Prescription" className="w-full h-full object-cover" />
                    </a>
                    <div className="space-y-1 text-xs">
                      {pr.verificationStatus !== 'pending' && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#A7A7A7]">Status:</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            pr.verificationStatus === 'verified'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/25'
                              : 'bg-red-500/10 text-red-400 border border-red-500/25'
                          }`}>
                            {pr.verificationStatus}
                          </span>
                        </div>
                      )}
                      {pr.rejectionReason && (
                        <p className="text-red-400 text-[10px]">{pr.rejectionReason}</p>
                      )}
                      <div>
                        <a
                          href={pr.uploadedFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#D4A04D] hover:underline font-bold"
                        >
                          View Full Document ↗
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-bold text-gray-500 uppercase tracking-widest border-b border-[#2A2A2D]/30 pb-1.5">
                      <div className="text-left" />
                      <div>SPH</div>
                      <div>CYL</div>
                      <div>AXIS</div>
                    </div>

                    {/* Right Eye */}
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="text-left font-semibold text-gray-400">Right Eye</div>
                      <div className="text-white font-bold">{formatValue(pr.RE?.sph)}</div>
                      <div className="text-white font-bold">{formatValue(pr.RE?.cyl)}</div>
                      <div className="text-white font-mono">{pr.RE?.axis ?? '0'}°</div>
                    </div>

                    {/* Left Eye */}
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="text-left font-semibold text-gray-400">Left Eye</div>
                      <div className="text-white font-bold">{formatValue(pr.LE?.sph)}</div>
                      <div className="text-white font-bold">{formatValue(pr.LE?.cyl)}</div>
                      <div className="text-white font-mono">{pr.LE?.axis ?? '0'}°</div>
                    </div>

                    {/* PD */}
                    {pr.pd !== undefined && (
                      <div className="pt-2 border-t border-[#2A2A2D]/30 text-xs flex justify-between">
                        <span className="text-gray-500 font-semibold">PD (Pupillary Distance)</span>
                        <span className="text-white font-bold">{pr.pd} mm</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
