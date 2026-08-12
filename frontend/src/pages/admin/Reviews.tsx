import { useState, useEffect } from 'react';
import api from '../../lib/api';

interface AdminReview {
  _id: string;
  user: { _id: string; name: string; email: string } | null;
  product: { _id: string; name: string; sku: string; images?: string[] } | null;
  rating: number;
  title?: string;
  comment?: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'All' | 1 | 2 | 3 | 4 | 5>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReviews = () => {
    setLoading(true);
    api.get('/admin/reviews', { params: { limit: 200 } })
      .then((res) => {
        setReviews(res.data?.reviews || []);
      })
      .catch((err) => {
        console.error('Failed to fetch admin reviews:', err);
        setError('Failed to fetch reviews. Please refresh the page.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (review: AdminReview) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return;
    setDeletingId(review._id);
    try {
      await api.delete(`/admin/reviews/${review._id}`);
      setReviews(prev => prev.filter(r => r._id !== review._id));
    } catch (err) {
      console.error('Failed to delete review:', err);
      alert('Failed to delete review. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredReviews = reviews.filter(r => {
    const matchesRating = ratingFilter === 'All' || r.rating === ratingFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      (r.user?.name || '').toLowerCase().includes(term) ||
      (r.user?.email || '').toLowerCase().includes(term) ||
      (r.product?.name || '').toLowerCase().includes(term) ||
      (r.title || '').toLowerCase().includes(term) ||
      (r.comment || '').toLowerCase().includes(term);
    return matchesRating && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#A7A7A7]">
        <div className="w-8 h-8 border-4 border-[#D4A04D] border-t-transparent rounded-full animate-spin" />
        <span>Loading reviews...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Customer Reviews</h1>
          <p className="text-gray-500 text-xs">Moderate reviews submitted by logged-in customers.</p>
        </div>
        <div className="text-[#A7A7A7] text-sm bg-[#131314] px-4 py-2 rounded-xl border border-[#2A2A2D]">
          <span className="text-white font-bold">{reviews.length}</span> Total Reviews
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#131314] border border-[#2A2A2D] p-4 rounded-xl">
        <div className="w-full md:w-96 relative">
          <input
            type="text"
            placeholder="Search user, product, or review text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0B0B0C] border border-[#2A2A2D] rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4A04D]"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          {(['All', 5, 4, 3, 2, 1] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setRatingFilter(tab)}
              className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                ratingFilter === tab
                  ? 'bg-[#D4A04D] text-black border-[#D4A04D]'
                  : 'bg-[#0B0B0C] text-[#A7A7A7] border-[#2A2A2D] hover:border-gray-700'
              }`}
            >
              {tab === 'All' ? 'All' : `${tab} ★`}
            </button>
          ))}
        </div>
      </div>

      {/* Table List */}
      <div className="bg-[#131314] border border-[#2A2A2D] rounded-xl overflow-hidden shadow-lg">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-xs">
            No reviews match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#A7A7A7] text-xs uppercase border-b border-[#2A2A2D]">
                  <th className="text-left px-5 py-4">Product</th>
                  <th className="text-left px-5 py-4">Reviewer</th>
                  <th className="text-left px-5 py-4">Rating</th>
                  <th className="text-left px-5 py-4">Review</th>
                  <th className="text-left px-5 py-4">Date</th>
                  <th className="text-center px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map(review => (
                  <tr key={review._id} className="border-b border-[#2A2A2D] hover:bg-[#1E1E20] transition-colors">
                    <td className="px-5 py-4">
                      <div className="text-white text-xs font-semibold">{review.product?.name || 'Deleted product'}</div>
                      {review.product?.sku && (
                        <div className="text-[10px] text-gray-500 font-mono">{review.product.sku}</div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-white text-xs font-semibold">{review.user?.name || 'Deleted user'}</div>
                      <div className="text-[#A7A7A7] text-[10px] font-mono">{review.user?.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[#D4A04D] font-bold text-xs">
                        {'★'.repeat(review.rating)}
                        <span className="text-[#2D2D30]">{'★'.repeat(5 - review.rating)}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-sm">
                      <div className="text-white text-xs font-semibold truncate" title={review.title}>
                        {review.title}
                      </div>
                      <p className="text-gray-500 text-[10.5px] line-clamp-2 mt-0.5" title={review.comment}>
                        {review.comment}
                      </p>
                      {review.isVerifiedPurchase && (
                        <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                          Verified Buyer
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[#A7A7A7] text-xs whitespace-nowrap">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleDelete(review)}
                        disabled={deletingId === review._id}
                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {deletingId === review._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
