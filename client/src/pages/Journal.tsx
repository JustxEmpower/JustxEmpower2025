import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { cn } from '@/lib/utils';
import { getMediaUrl } from '@/lib/media';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { usePageContent } from '@/hooks/usePageContent';
import { EditablePageZone } from '@/components/PageZone';

interface JournalProps {
  slug?: string;
}

export default function Journal({ slug = 'blog' }: JournalProps) {
  const [location] = useLocation();
  const [limit] = useState(6);
  const [offset, setOffset] = useState(0);
  const [allArticles, setAllArticles] = useState<any[]>([]);
  
  // Get page content from database - use dynamic slug
  const { getContent, getInlineStyles, isLoading: contentLoading } = usePageContent(slug);

  const { data: articles, isLoading, refetch } = trpc.articles.list.useQuery({
    limit,
    offset,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    if (articles) {
      if (offset === 0) {
        setAllArticles(articles);
      } else {
        setAllArticles(prev => [...prev, ...articles]);
      }
    }
  }, [articles, offset]);

  const handleLoadMore = () => {
    setOffset(prev => prev + limit);
  };

  const featuredPost = allArticles[0] || null;
  const regularPosts = allArticles.slice(1);

  // Helper to get proper media URL
  const getProperMediaUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : getMediaUrl(url);
  };

  // Get hero content from CMS
  const heroTitle = getContent('hero', 'title');
  const heroSubtitle = getContent('hero', 'subtitle');
  const heroDescription = getContent('hero', 'description');
  const heroVideoUrl = getContent('hero', 'videoUrl');
  const heroImageUrl = getContent('hero', 'imageUrl');
  
  // Determine which media to use for hero (video takes priority)
  const heroMediaUrl = heroVideoUrl || heroImageUrl;
  const isHeroVideo = heroMediaUrl ? /\.(mp4|webm|mov|ogg)$/i.test(heroMediaUrl) : false;

  // Get overview content from database
  const overviewTitle = getContent('overview', 'title');
  const overviewParagraph1 = getContent('overview', 'paragraph1');
  const overviewParagraph2 = getContent('overview', 'paragraph2');

  // Get fallback image for articles from CMS
  const articleFallbackImage = getContent('articles', 'fallbackImageUrl');

  if (contentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[50vh] w-full overflow-hidden rounded-b-[2.5rem]">
        <div className="absolute inset-0 bg-black/30 z-10" />
        
        {/* Fallback gradient (always present) */}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-400 to-neutral-600" />
        
        {/* Video Background */}
        {heroMediaUrl && isHeroVideo && (
          <video
            key={heroMediaUrl}
            src={getProperMediaUrl(heroMediaUrl)}
            autoPlay
            loop
            muted
            playsInline
            crossOrigin="anonymous"
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        
        {/* Image Background */}
        {heroMediaUrl && !isHeroVideo && (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${getProperMediaUrl(heroMediaUrl)})` }}
          />
        )}
        
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="font-serif text-5xl md:text-7xl font-light tracking-wide italic mb-6 text-white" style={getInlineStyles('hero', 'title')}>
            {heroTitle}
          </h1>
          <p className="font-sans text-sm md:text-base tracking-[0.2em] uppercase opacity-90 text-white/90" style={getInlineStyles('hero', 'description')}>
            {heroDescription}
          </p>
        </div>
      </div>

      {/* Page Builder Zone: After Hero */}
      <EditablePageZone pageSlug="blog" zoneName="after-hero" />

      <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        
        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-24">
            <h2 className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-8 border-b border-border pb-4">Featured Article</h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                {featuredPost.imageUrl ? (
                  <img
                    src={getProperMediaUrl(featuredPost.imageUrl)}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover"
                  />
                ) : articleFallbackImage ? (
                  <img
                    src={getProperMediaUrl(articleFallbackImage)}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-neutral-300 to-neutral-500" />
                )}
              </div>
              <div>
                {featuredPost.category && (
                  <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">
                    {featuredPost.category}
                  </p>
                )}
                <h3 className="font-serif text-4xl md:text-5xl font-light italic mb-4">
                  {featuredPost.title}
                </h3>
                {featuredPost.date && (
                  <p className="font-sans text-sm text-muted-foreground mb-6">
                    {new Date(featuredPost.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                )}
                <p className="font-sans text-base leading-relaxed text-foreground/80 mb-8">
                  {featuredPost.excerpt}
                </p>
                <Link href={`/blog/${featuredPost.slug}`}>
                  <Button
                    variant="outline"
                    className="rounded-full px-8"
                  >
                    Read Article
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Page Builder Zone: Mid Page */}
        <EditablePageZone pageSlug="blog" zoneName="mid-page" />

        {/* Recent Articles Grid */}
        {regularPosts.length > 0 && (
          <div className="mb-16">
            <h2 className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-8 border-b border-border pb-4">Recent Articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map((post, index) => (
                <Link key={index} href={`/blog/${post.slug}`}>
                <article className="group cursor-pointer">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl mb-6">
                    {post.imageUrl ? (
                      <img
                        src={getProperMediaUrl(post.imageUrl)}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : articleFallbackImage ? (
                      <img
                        src={getProperMediaUrl(articleFallbackImage)}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-neutral-300 to-neutral-500" />
                    )}
                  </div>
                  {post.category && (
                    <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3">
                      {post.category}
                    </p>
                  )}
                  <h3 className="font-serif text-2xl font-light italic mb-3 group-hover:opacity-70 transition-opacity">
                    {post.title}
                  </h3>
                  {post.date && (
                    <p className="font-sans text-sm text-muted-foreground mb-4">
                      {new Date(post.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  )}
                  <p className="font-sans text-sm leading-relaxed text-foreground/70">
                    {post.excerpt}
                  </p>
                </article>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Load More Button */}
        {articles && articles.length === limit && (
          <div className="flex justify-center mt-12">
            <Button
              onClick={handleLoadMore}
              disabled={isLoading}
              variant="outline"
              className="rounded-full px-12 py-6 text-base tracking-wider"
            >
              {isLoading ? 'Loading...' : 'LOAD MORE ARTICLES'}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && allArticles.length === 0 && (
          <div className="text-center py-24">
            <p className="font-sans text-muted-foreground">
              No articles published yet. Check back soon for new content.
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && offset === 0 && (
          <div className="text-center py-24">
            <p className="font-sans text-muted-foreground">
              Loading articles...
            </p>
          </div>
        )}

        {/* Page Builder Zone: After Content */}
        <EditablePageZone pageSlug="blog" zoneName="after-content" />

        {/* Page Builder Zone: Before Newsletter */}
        <EditablePageZone pageSlug="blog" zoneName="before-newsletter" />

        {/* Page Builder Zone: Before Footer */}
        <EditablePageZone pageSlug="blog" zoneName="before-footer" />
      </div>
    </div>
  );
}
