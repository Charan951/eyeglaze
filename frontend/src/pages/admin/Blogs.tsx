import { useState, useEffect } from 'react';
import api from '../../lib/api';

interface AdminBlog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  image: string;
  tag?: string;
  readTime?: string;
  author?: string;
  status: 'Draft' | 'Published';
  displayOrder: number;
  createdAt: string;
}

const emptyForm = {
  title: '',
  excerpt: '',
  content: '',
  image: '',
  tag: '',
  readTime: '4 min read',
  author: 'EyeGlaze Team',
  status: 'Published' as 'Draft' | 'Published',
  displayOrder: 0,
};

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<AdminBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBlog, setEditingBlog] = useState<AdminBlog | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchBlogs = () => {
    setLoading(true);
    api.get('/admin/blogs')
      .then((res) => setBlogs(res.data?.blogs || []))
      .catch((err) => {
        console.error('Failed to fetch blogs:', err);
        setError('Failed to fetch blogs. Please refresh the page.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const openCreateForm = () => {
    setEditingBlog(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (blog: AdminBlog) => {
    setEditingBlog(blog);
    setForm({
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content || '',
      image: blog.image,
      tag: blog.tag || '',
      readTime: blog.readTime || '4 min read',
      author: blog.author || 'EyeGlaze Team',
      status: blog.status,
      displayOrder: blog.displayOrder,
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);
    try {
      const res = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((prev) => ({ ...prev, image: res.data.url }));
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingBlog) {
        const res = await api.put(`/admin/blogs/${editingBlog._id}`, form);
        setBlogs((prev) => prev.map((b) => (b._id === editingBlog._id ? res.data.blog : b)));
      } else {
        const res = await api.post('/admin/blogs', form);
        setBlogs((prev) => [res.data.blog, ...prev]);
      }
      setShowForm(false);
    } catch (err: any) {
      console.error('Failed to save blog:', err);
      alert(err.response?.data?.error || 'Failed to save blog.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (blog: AdminBlog) => {
    if (!window.confirm(`Delete "${blog.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/blogs/${blog._id}`);
      setBlogs((prev) => prev.filter((b) => b._id !== blog._id));
    } catch (err) {
      console.error('Failed to delete blog:', err);
      alert('Failed to delete blog. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#A7A7A7]">
        <div className="w-8 h-8 border-4 border-[#D4A04D] border-t-transparent rounded-full animate-spin" />
        <span>Loading blogs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Blogs</h1>
          <p className="text-gray-500 text-xs">Manage the articles shown on the public Blogs & Insights page.</p>
        </div>
        <button
          onClick={openCreateForm}
          className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-bold text-xs py-2.5 px-5 rounded-xl transition-colors cursor-pointer uppercase tracking-wider"
        >
          + New Article
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl overflow-hidden shadow-lg">
        {blogs.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-xs">
            No data is added
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#A7A7A7] text-xs uppercase border-b border-[#2A2A2D]">
                  <th className="text-left px-5 py-4">Article</th>
                  <th className="text-left px-5 py-4">Tag</th>
                  <th className="text-left px-5 py-4">Status</th>
                  <th className="text-left px-5 py-4">Created</th>
                  <th className="text-center px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map((blog) => (
                  <tr key={blog._id} className="border-b border-[#2A2A2D] hover:bg-[#1E1E20] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img src={blog.image} alt={blog.title} className="w-12 h-12 rounded-lg object-cover border border-[#2A2A2D] shrink-0" />
                        <div className="min-w-0">
                          <div className="text-white text-xs font-semibold truncate max-w-xs">{blog.title}</div>
                          <div className="text-[10px] text-gray-500 truncate max-w-xs">{blog.excerpt}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[#A7A7A7] text-xs">{blog.tag || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        blog.status === 'Published'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      }`}>
                        {blog.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#A7A7A7] text-xs whitespace-nowrap">
                      {new Date(blog.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => openEditForm(blog)}
                        className="bg-[#252528] hover:bg-[#2F2F32] border border-[#3A3A3D] text-white hover:text-[#D4A04D] text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg transition-colors cursor-pointer mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(blog)}
                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131314] border border-[#2A2A2D] w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-[#2A2A2D] px-6 py-4 shrink-0">
              <h3 className="font-bold text-white text-base">{editingBlog ? 'Edit Article' : 'New Article'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white transition-colors text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Cover Image *</label>
                {form.image ? (
                  <div className="flex items-center gap-3 bg-[#0B0B0C] border border-[#2A2A2D] p-3 rounded-xl">
                    <img src={form.image} alt="Cover" className="w-16 h-16 object-cover rounded-lg border border-[#2A2A2D]" />
                    <button type="button" onClick={() => setForm({ ...form, image: '' })} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase bg-transparent border-none cursor-pointer">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input type="file" accept="image/*" id="blogImageUpload" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                    <label htmlFor="blogImageUpload" className="flex flex-col items-center justify-center border-2 border-dashed border-[#2A2A2D] hover:border-[#D4A04D]/60 rounded-xl p-5 cursor-pointer bg-[#0B0B0C]/40 transition-colors">
                      <span className="text-xs font-bold text-gray-400">{uploading ? 'Uploading...' : 'Click to upload cover image'}</span>
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Excerpt *</label>
                <textarea
                  required
                  rows={2}
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Full Content</label>
                <textarea
                  rows={5}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Optional — the full article body"
                  className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Tag</label>
                  <input
                    type="text"
                    value={form.tag}
                    onChange={(e) => setForm({ ...form, tag: e.target.value })}
                    placeholder="e.g. Styling Guide"
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Read Time</label>
                  <input
                    type="text"
                    value={form.readTime}
                    onChange={(e) => setForm({ ...form, readTime: e.target.value })}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Author</label>
                  <input
                    type="text"
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#A7A7A7] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as 'Draft' | 'Published' })}
                    className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#D4A04D] focus:outline-none"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-[#252528] hover:bg-[#2F2F32] border border-[#3A3A3D] text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-colors cursor-pointer uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.image}
                  className="bg-[#D4A04D] hover:bg-[#C8923E] text-black font-bold text-xs py-2.5 px-6 rounded-xl transition-colors cursor-pointer uppercase tracking-wider disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingBlog ? 'Save Changes' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
