import { useState, useEffect } from 'react';
import api from '../../lib/api';

interface SocialLink {
  platform: string;
  url: string;
}

interface SiteSettingsForm {
  contactEmail: string;
  contactPhone: string;
  contactPhoneLabel: string;
  address: string;
  socialLinks: SocialLink[];
}

const emptySettings: SiteSettingsForm = {
  contactEmail: '',
  contactPhone: '',
  contactPhoneLabel: '',
  address: '',
  socialLinks: [],
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SiteSettingsForm>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/admin/settings')
      .then((res) => {
        const s = res.data?.settings;
        if (s) {
          setForm({
            contactEmail: s.contactEmail || '',
            contactPhone: s.contactPhone || '',
            contactPhoneLabel: s.contactPhoneLabel || '',
            address: s.address || '',
            socialLinks: s.socialLinks || [],
          });
        }
      })
      .catch((err) => {
        console.error('Failed to fetch settings:', err);
        setError('Failed to fetch site settings. Please refresh the page.');
      })
      .finally(() => setLoading(false));
  }, []);

  const updateSocialLink = (idx: number, field: keyof SocialLink, value: string) => {
    setForm((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((link, i) => (i === idx ? { ...link, [field]: value } : link)),
    }));
  };

  const addSocialLink = () => {
    setForm((prev) => ({ ...prev, socialLinks: [...prev.socialLinks, { platform: '', url: '' }] }));
  };

  const removeSocialLink = (idx: number) => {
    setForm((prev) => ({ ...prev, socialLinks: prev.socialLinks.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const payload = {
        ...form,
        socialLinks: form.socialLinks.filter((l) => l.platform.trim() && l.url.trim()),
      };
      const res = await api.put('/admin/settings', payload);
      const s = res.data?.settings;
      if (s) {
        setForm({
          contactEmail: s.contactEmail || '',
          contactPhone: s.contactPhone || '',
          contactPhoneLabel: s.contactPhoneLabel || '',
          address: s.address || '',
          socialLinks: s.socialLinks || [],
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save site settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#A7A7A7]">
        <div className="w-8 h-8 border-4 border-[#D4A04D] border-t-transparent rounded-full animate-spin" />
        <span>Loading site settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Site Settings</h1>
        <p className="text-gray-500 text-xs">
          Controls the contact details and social links shown in the storefront footer.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-[#131314] border border-[#2A2A2D] rounded-2xl p-6">
        <div>
          <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Contact Details</h2>
          <div className="space-y-4">
            <div>
              <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Support Email</label>
              <input
                type="email"
                required
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Phone Number</label>
                <input
                  type="text"
                  required
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder="1800-419-5888"
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Phone Label</label>
                <input
                  type="text"
                  value={form.contactPhoneLabel}
                  onChange={(e) => setForm({ ...form, contactPhoneLabel: e.target.value })}
                  placeholder="Toll-Free"
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Address</label>
              <textarea
                required
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-[#2A2A2D] pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-sm uppercase tracking-wider">Social Media Links</h2>
            <button
              type="button"
              onClick={addSocialLink}
              className="bg-[#252528] hover:bg-[#2F2F32] border border-[#3A3A3D] text-white text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
            >
              + Add Link
            </button>
          </div>

          {form.socialLinks.length === 0 ? (
            <p className="text-gray-500 text-xs">No social links yet. Click "Add Link" to add Instagram, Facebook, Twitter, or any other platform.</p>
          ) : (
            <div className="space-y-3">
              {form.socialLinks.map((link, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={link.platform}
                    onChange={(e) => updateSocialLink(idx, 'platform', e.target.value)}
                    placeholder="Platform (e.g. instagram)"
                    className="w-36 bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-white text-xs focus:border-[#D4A04D] focus:outline-none shrink-0"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => updateSocialLink(idx, 'url', e.target.value)}
                    placeholder="https://..."
                    className="flex-1 min-w-0 bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-white text-xs focus:border-[#D4A04D] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeSocialLink(idx)}
                    className="text-red-400 hover:text-red-300 text-xs font-bold uppercase bg-transparent border-none cursor-pointer shrink-0 px-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#2A2A2D]">
          {saved && (
            <span className="text-green-400 text-xs font-semibold mr-auto">✓ Settings saved successfully!</span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-bold text-xs py-2.5 px-6 rounded-xl transition-colors cursor-pointer uppercase tracking-wider disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
