import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ScrollFade from '../components/ScrollFade';
import { Calendar, ArrowRight } from 'lucide-react';
import { supabase, Article } from '../lib/supabase';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function Insights() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const { data, error: fetchError } = await supabase
          .from('articles')
          .select('*')
          .eq('is_published', true)
          .order('published_at', { ascending: false });

        if (fetchError) throw fetchError;
        setArticles(data || []);
      } catch (err) {
        setError('Failed to load articles');
        console.error('Error fetching articles:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-[#BCD8D4]/20 py-16 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-end pointer-events-none pr-12 opacity-[0.05]">
          <img
            src="/FN_MICE_(1920_x_1080_px).png"
            alt=""
            aria-hidden="true"
            className="w-[35%] max-w-sm"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFade>
            <nav className="font-['Inter'] text-sm mb-8">
              <span className="text-[#3A3A3A]/60">Home</span>
              <span className="mx-2 text-[#3A3A3A]/40">/</span>
              <span className="text-[#21436A] font-medium">Insights</span>
            </nav>
            <h1 className="font-['Cormorant_Garamond'] text-4xl lg:text-5xl font-semibold text-[#21436A] mb-4">
              Insights & Thought Leadership
            </h1>
            <p className="font-['Inter'] text-lg text-[#3A3A3A] max-w-2xl">
              Perspectives on MICE, business tourism, sustainability, and destination development
              across Africa.
            </p>
          </ScrollFade>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#21436A] border-t-transparent mx-auto" />
              <p className="font-['Inter'] text-sm text-[#3A3A3A] mt-4">Loading articles...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="font-['Inter'] text-sm text-red-600">{error}</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-['Inter'] text-sm text-[#3A3A3A]">
                No articles published yet. Check back soon for insights on MICE and business tourism.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article, index) => (
                <ScrollFade key={article.id} delay={index * 100}>
                  <article className="group h-full flex flex-col">
                    <Link
                      to={`/insights/${article.slug}`}
                      className="block relative overflow-hidden rounded-lg mb-4"
                    >
                      <div className="aspect-[16/10]">
                        <img
                          src={article.image_url}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="absolute top-3 left-3">
                        <span className="bg-[#21436A] text-white text-xs font-['Inter'] px-3 py-1 rounded">
                          {article.category}
                        </span>
                      </div>
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-[#3A3A3A]/60 mb-2">
                        <Calendar className="w-4 h-4" />
                        <time className="font-['Inter'] text-sm">
                          {formatDate(article.published_at)}
                        </time>
                      </div>
                      <h2 className="font-['Cormorant_Garamond'] text-xl font-semibold text-[#21436A] mb-3 group-hover:text-[#BCD8D4] transition-colors duration-200">
                        <Link to={`/insights/${article.slug}`}>{article.title}</Link>
                      </h2>
                      <p className="font-['Inter'] text-sm text-[#3A3A3A] leading-relaxed mb-4">
                        {article.excerpt}
                      </p>
                      <Link
                        to={`/insights/${article.slug}`}
                        className="inline-flex items-center gap-2 text-[#21436A] font-['Inter'] text-sm font-medium hover:text-[#BCD8D4] transition-colors duration-200"
                      >
                        Read more
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </article>
                </ScrollFade>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-[#BCD8D4]/30 py-16 lg:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollFade>
            <h2 className="font-['Cormorant_Garamond'] text-2xl lg:text-3xl font-semibold text-[#21436A] mb-4">
              Stay Informed
            </h2>
            <p className="font-['Inter'] text-base text-[#3A3A3A] mb-8">
              Subscribe to receive the latest insights on MICE and business tourism in Africa.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-[#21436A] text-white px-8 py-3.5 font-['Inter'] text-sm font-medium rounded hover:bg-[#1a3456] transition-colors duration-200"
            >
              Subscribe for Updates
            </Link>
          </ScrollFade>
        </div>
      </section>
    </div>
  );
}
