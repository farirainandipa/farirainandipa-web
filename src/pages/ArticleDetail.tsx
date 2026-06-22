import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ScrollFade from '../components/ScrollFade';
import { Calendar, ChevronLeft, ArrowLeft } from 'lucide-react';
import { supabase, Article } from '../lib/supabase';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticle() {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('articles')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError('Article not found');
          } else {
            throw fetchError;
          }
        } else {
          setArticle(data);
        }
      } catch (err) {
        setError('Failed to load article');
        console.error('Error fetching article:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#21436A] border-t-transparent mx-auto" />
          <p className="font-['Inter'] text-sm text-[#3A3A3A] mt-4">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-['Cormorant_Garamond'] text-3xl text-[#21436A] mb-4">
            Article Not Found
          </h1>
          <p className="font-['Inter'] text-[#3A3A3A] mb-6">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/insights"
            className="inline-flex items-center gap-2 text-[#21436A] font-['Inter'] text-sm font-medium hover:text-[#BCD8D4] transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Insights
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 h-96 lg:h-[28rem]">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-white/5" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 lg:pt-40 pb-8 lg:pb-12">
          <ScrollFade>
            <Link
              to="/insights"
              className="inline-flex items-center gap-2 text-white font-['Inter'] text-sm font-medium mb-6 hover:text-[#BCD8D4] transition-colors duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Insights
            </Link>
            <span className="inline-block bg-[#21436A] text-white text-xs font-['Inter'] px-3 py-1 rounded mb-4">
              {article.category}
            </span>
            <h1 className="font-['Cormorant_Garamond'] text-3xl lg:text-5xl font-semibold text-white mb-4 max-w-4xl">
              {article.title}
            </h1>
            <div className="flex items-center gap-2 text-white/90">
              <Calendar className="w-4 h-4" />
              <time className="font-['Inter'] text-sm">{formatDate(article.published_at)}</time>
            </div>
          </ScrollFade>
        </div>
      </section>

      {/* Article Content */}
      <section className="bg-white py-12 lg:py-16 -mt-32 relative z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFade>
            <div
              className="prose prose-lg max-w-none font-['Inter'] text-[#3A3A3A]
                prose-headings:font-['Cormorant_Garamond'] prose-headings:font-semibold prose-headings:text-[#21436A]
                prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                prose-p:leading-relaxed prose-p:mb-6
                prose-ul:mb-6 prose-li:mb-2 prose-li:leading-relaxed
                prose-strong:text-[#21436A]"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </ScrollFade>

          <ScrollFade delay={200}>
            <div className="mt-12 pt-8 border-t border-gray-200">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-[#21436A] text-white px-6 py-3 font-['Inter'] text-sm font-medium rounded hover:bg-[#1a3456] transition-colors duration-200"
              >
                Discuss This Topic
              </Link>
            </div>
          </ScrollFade>
        </div>
      </section>
    </div>
  );
}
