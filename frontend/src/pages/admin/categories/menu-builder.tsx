import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api';

interface MenuItem {
  label: string;
  link: string;
  badge?: string;
  children?: MenuItem[];
}

export default function NavigationMenuBuilder() {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get('/admin/categories/navigation-menu')
      .then(res => {
        setMenuItems(res.data.menu?.items || []);
      })
      .catch(() => setError('Failed to load navigation configuration.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await api.put('/admin/categories/navigation-menu', { items: menuItems });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Failed to persist menu settings.');
    } finally {
      setSaving(false);
    }
  };

  // Add a top-level category menu item
  const addTopLevelItem = () => {
    setMenuItems(prev => [...prev, { label: 'New Link', link: '/products', children: [] }]);
  };

  // Remove a top-level category menu item
  const removeTopLevelItem = (idx: number) => {
    setMenuItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Add child link
  const addChildItem = (parentIdx: number) => {
    setMenuItems(prev => {
      const copy = [...prev];
      if (!copy[parentIdx].children) copy[parentIdx].children = [];
      copy[parentIdx].children!.push({ label: 'New Sub-Link', link: '/products' });
      return copy;
    });
  };

  // Remove child link
  const removeChildItem = (parentIdx: number, childIdx: number) => {
    setMenuItems(prev => {
      const copy = [...prev];
      copy[parentIdx].children = copy[parentIdx].children!.filter((_, i) => i !== childIdx);
      return copy;
    });
  };

  const updateItemField = (parentIdx: number, childIdx: number | null, field: keyof MenuItem, value: string) => {
    setMenuItems(prev => {
      const copy = [...prev];
      if (childIdx === null) {
        (copy[parentIdx] as any)[field] = value;
      } else {
        (copy[parentIdx].children![childIdx] as any)[field] = value;
      }
      return copy;
    });
  };

  return (
    <div className="space-y-6 text-white select-none">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-bold">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-xs font-bold">
          ✓ Navigation config updated successfully!
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide">Navigation Menu Builder</h1>
          <p className="text-xs text-gray-500 font-semibold">Configure dynamic website menus, links, and banners dynamically</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/admin/categories')} className="bg-[#18181A] hover:bg-zinc-800 border border-zinc-700 text-gray-300 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-extrabold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md border-none cursor-pointer disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Builder interface */}
      <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl p-8 shadow-xl max-w-4xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <h2 className="text-[#D4A04D] text-sm font-extrabold uppercase tracking-wider">Web Links Hierarchy</h2>
          <button 
            type="button"
            onClick={addTopLevelItem}
            className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-[#2A2A2D] text-[#D4A04D] hover:bg-[#D4A04D] hover:text-black transition-colors border-none cursor-pointer"
          >
            + Add Menu Section
          </button>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-16 animate-pulse text-xs">Loading structure...</div>
        ) : (
          <div className="space-y-6">
            {menuItems.map((parent, parentIdx) => (
              <div key={parentIdx} className="bg-[#18181A] p-6 rounded-2xl border border-zinc-800 space-y-4">
                
                {/* Parent Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div className="md:col-span-2">
                    <label className="text-gray-500 text-[8px] font-bold uppercase block mb-1">Section Label</label>
                    <input
                      type="text"
                      value={parent.label}
                      onChange={e => updateItemField(parentIdx, null, 'label', e.target.value)}
                      className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 text-[8px] font-bold uppercase block mb-1">Link Destination</label>
                    <input
                      type="text"
                      value={parent.link}
                      onChange={e => updateItemField(parentIdx, null, 'link', e.target.value)}
                      className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-3 py-2 text-xs focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <button 
                      onClick={() => addChildItem(parentIdx)}
                      className="text-[#D4A04D] hover:underline text-[9px] font-extrabold uppercase bg-transparent border-none cursor-pointer"
                    >
                      + Add Link
                    </button>
                    <button 
                      onClick={() => removeTopLevelItem(parentIdx)}
                      className="text-red-400 hover:underline text-[9px] font-extrabold uppercase bg-transparent border-none cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Children Items */}
                <div className="pl-8 border-l border-zinc-800 space-y-3">
                  {parent.children?.map((child, childIdx) => (
                    <div key={childIdx} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-[#0B0B0C] p-3 rounded-xl border border-zinc-800/40">
                      <div>
                        <label className="text-gray-600 text-[8px] font-bold uppercase block mb-1">Child Label</label>
                        <input
                          type="text"
                          value={child.label}
                          onChange={e => updateItemField(parentIdx, childIdx, 'label', e.target.value)}
                          className="w-full bg-[#131314] border border-[#2A2A2D] rounded-xl px-3 py-2 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-gray-600 text-[8px] font-bold uppercase block mb-1">Link Destination</label>
                        <input
                          type="text"
                          value={child.link}
                          onChange={e => updateItemField(parentIdx, childIdx, 'link', e.target.value)}
                          className="w-full bg-[#131314] border border-[#2A2A2D] rounded-xl px-3 py-2 text-xs focus:outline-none font-mono"
                        />
                      </div>
                      <div className="flex justify-end pt-4">
                        <button 
                          onClick={() => removeChildItem(parentIdx, childIdx)}
                          className="text-red-400 hover:underline text-[9px] font-extrabold uppercase bg-transparent border-none cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            ))}
            {menuItems.length === 0 && (
              <p className="text-center text-gray-500 py-10 italic text-xs">No navigation links added. Click 'Add Menu Section' to start.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
