import { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import api from '../lib/api';

interface BlogArticle {
  _id: string;
  title: string;
  excerpt: string;
  image: string;
  tag?: string;
  readTime?: string;
  publishedAt?: string;
  createdAt: string;
}

export default function Blogs() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/blogs')
      .then((res) => setArticles(res.data?.blogs || []))
      .catch((err) => console.error('Failed to fetch blogs:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white py-4 flex flex-col gap-8">
      <SEO
        title="Eyewear Trends & Eye Health Insights | Blogs"
        description="Stay updated with the latest trends in designer eyewear, optical technologies, lens indexing, and expert tips on vision health from EyeGlaze."
        keywords="eyeglaze blog, eyewear trends, blue light lenses health, lens index guide, face shape frame style"
      />

      {/* Header Info */}
      <div className="flex flex-col gap-2 max-w-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-[2px] bg-[#D4A04D]" />
          <span className="text-[#D4A04D] text-xs font-bold tracking-widest uppercase">Journal</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Blogs & Insights</h1>
        <p className="text-gray-400 text-sm">
          Stay informed with the latest trends in designer eyewear, optical technologies, and expert tips on maintaining vision health.
        </p>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm py-10 text-center">Loading articles...</div>
      ) : articles.length === 0 ? (
        <div className="text-gray-500 text-sm py-10 text-center">No articles published yet. Check back soon.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <article
              key={article._id}
              className="bg-[#131314] border border-[#2A2A2D] hover:border-[#D4A04D]/40 transition-all duration-300 rounded-2xl overflow-hidden flex flex-col justify-between group"
            >
              {/* Header image */}
              <div className="aspect-video bg-[#131314] overflow-hidden border-b border-[#2A2A2D] relative">
                <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" />
                {article.tag && (
                  <span className="absolute top-3 left-3 bg-black/80 text-[#D4A04D] border border-[#D4A04D]/25 text-[9px] font-bold py-1 px-3 rounded-full uppercase tracking-wider">
                    {article.tag}
                  </span>
                )}
              </div>

              {/* Content area */}
              <div className="p-5 flex flex-col gap-3 flex-1 justify-between">
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-gray-500 text-[10px]">
                    <span>
                      {new Date(article.publishedAt || article.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    {article.readTime && (
                      <>
                        <span className="w-1.5 h-1.5 bg-[#2A2A2D] rounded-full" />
                        <span>{article.readTime}</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-white text-base font-bold group-hover:text-[#D4A04D] transition-colors leading-tight">
                    {article.title}
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">
                    {article.excerpt}
                  </p>
                </div>

                <div className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mt-4 pt-3 border-t border-[#2A2A2D]/40 group-hover:text-[#D4A04D] transition-colors cursor-pointer">
                  Read Article <span>→</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
