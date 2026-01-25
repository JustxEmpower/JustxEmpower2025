import { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { getMediaUrl } from '@/lib/media';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Calendar, Clock, Share2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

// Helper function to convert plain text with line breaks to HTML paragraphs
function formatArticleContent(content: string): string {
  if (!content) return '';
  
  // If content already contains HTML tags, return as-is
  if (/<[a-z][\s\S]*>/i.test(content)) {
    return content;
  }
  
  // Split by double line breaks (paragraph breaks)
  const paragraphs = content.split(/\n\n+/);
  
  // Process each paragraph
  return paragraphs.map(paragraph => {
    // Trim whitespace
    const trimmed = paragraph.trim();
    if (!trimmed) return '';
    
    // Check if it looks like a heading (short line, possibly with em dash or colon)
    const isHeading = trimmed.length < 100 && 
      (trimmed.includes('—') || trimmed.endsWith(':') || /^[A-Z][^.!?]*$/.test(trimmed));
    
    if (isHeading && !trimmed.includes('.')) {
      return `<h3>${trimmed}</h3>`;
    }
    
    // Convert single line breaks within paragraph to <br>
    const withBreaks = trimmed.replace(/\n/g, '<br>');
    return `<p>${withBreaks}</p>`;
  }).filter(p => p).join('\n');
}

export default function ArticleDetail() {
  const [, params] = useRoute('/blog/:slug');
  const slug = params?.slug || '';
  
  const { data: article, isLoading, error } = trpc.articles.get.useQuery(
    { slug },
    { enabled: !!slug }
  );

  // Fetch recent articles for "Read Next" section
  const { data: recentArticles } = trpc.articles.list.useQuery(
    { limit: 4, status: 'published' },
    { enabled: !!article }
  );

  // Filter out current article and get next articles
  const nextArticles = recentArticles?.filter(a => a.slug !== slug).slice(0, 3) || [];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Helper to get proper media URL
  const getProperMediaUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : getMediaUrl(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title || 'Article',
          text: article?.excerpt || '',
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-2xl font-serif italic mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/blog">
            <Button variant="outline" className="rounded-full px-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const dateValue = article.publishDate || article.date;
  const publishDate = dateValue
    ? new Date(dateValue).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : null;

  const readingTime = article.content 
    ? Math.ceil(article.content.split(/\s+/).length / 200) 
    : 5;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        {article.imageUrl ? (
          <img
            src={getProperMediaUrl(article.imageUrl)}
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-400 to-neutral-600" />
        )}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-4">
          {article.category && (
            <p className="font-sans text-xs tracking-[0.2em] uppercase opacity-80 mb-4">
              {article.category}
            </p>
          )}
          <h1 className="font-serif text-4xl md:text-6xl font-light tracking-wide italic mb-6 max-w-4xl">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="font-sans text-lg md:text-xl opacity-90 max-w-2xl">
              {article.excerpt}
            </p>
          )}
        </div>
      </div>

      {/* Article Meta */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {publishDate && (
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {publishDate}
              </span>
            )}
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {readingTime} min read
            </span>
            
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-6 py-16">
        <div 
          className="prose prose-lg prose-neutral dark:prose-invert max-w-none
            prose-headings:font-serif prose-headings:font-light prose-headings:italic
            prose-p:font-sans prose-p:leading-relaxed
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-primary prose-blockquote:italic prose-blockquote:font-serif
            prose-img:rounded-2xl"
          dangerouslySetInnerHTML={{ 
            __html: formatArticleContent(article.content || '') 
          }}
        />
      </article>

      {/* Read Next Section - Apple-style */}
      {nextArticles.length > 0 && (
        <section className="bg-stone-50 dark:bg-stone-900/50 py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-8">
            <div className="text-center mb-14">
              <p className="text-xs uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 mb-3">Continue Reading</p>
              <h2 className="text-3xl md:text-4xl font-light text-stone-900 dark:text-white">Read Next</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {nextArticles.map((nextArticle) => (
                <Link key={nextArticle.id} href={`/blog/${nextArticle.slug}`}>
                  <article className="group cursor-pointer">
                    {/* Article Image */}
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-5 bg-stone-200 dark:bg-stone-800">
                      {nextArticle.imageUrl ? (
                        <img
                          src={getProperMediaUrl(nextArticle.imageUrl)}
                          alt={nextArticle.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-stone-300 to-stone-400 dark:from-stone-700 dark:to-stone-800" />
                      )}
                    </div>
                    
                    {/* Article Meta */}
                    {nextArticle.category && (
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 mb-2">
                        {nextArticle.category}
                      </p>
                    )}
                    
                    <h3 className="text-xl font-medium text-stone-900 dark:text-white mb-3 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                      {nextArticle.title}
                    </h3>
                    
                    {nextArticle.excerpt && (
                      <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed line-clamp-2 mb-4">
                        {nextArticle.excerpt}
                      </p>
                    )}
                    
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      Read Article
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back to Blog - Apple-style */}
      <div className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-8 py-16 flex justify-center">
          <Link href="/blog">
            <button className="flex items-center gap-3 px-10 py-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-full text-sm font-medium hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
