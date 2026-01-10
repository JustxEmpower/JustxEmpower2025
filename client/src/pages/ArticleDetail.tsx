import { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { getMediaUrl } from '@/lib/media';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, Share2, BookOpen } from 'lucide-react';
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

      {/* Back to Blog */}
      <div className="border-t border-border">
        <div className="max-w-4xl mx-auto px-6 py-12 flex justify-center">
          <Link href="/blog">
            <Button variant="outline" className="rounded-full px-12 py-6 text-base tracking-wider">
              <ArrowLeft className="w-4 h-4 mr-2" />
              BACK TO BLOG
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
