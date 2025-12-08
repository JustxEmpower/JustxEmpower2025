import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';

export default function Journal() {
  const [location] = useLocation();
  const [limit] = useState(6);
  const [offset, setOffset] = useState(0);
  const [allArticles, setAllArticles] = useState<any[]>([]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[50vh] w-full overflow-hidden rounded-b-[2.5rem]">
        <div className="absolute inset-0 bg-black/30 z-10" />
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/media/09/home-fog-slide-3.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="font-serif text-5xl md:text-7xl font-light tracking-wide italic mb-6">
            She Writes
          </h1>
          <p className="font-sans text-sm md:text-base tracking-[0.2em] uppercase opacity-90">
            Lessons from the Living Codex
          </p>
        </div>
      </div>

      <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        
        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-24">
            <h2 className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-8 border-b border-border pb-4">Featured Article</h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <img
                  src={featuredPost.imageUrl || "/media/11/Cover-Final-Emblem-V1-1024x731.png"}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover"
                />
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
                <Button
                  variant="outline"
                  className="rounded-full px-8"
                >
                  Read Article
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Articles Grid */}
        {regularPosts.length > 0 && (
          <div className="mb-16">
            <h2 className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-8 border-b border-border pb-4">Recent Articles</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map((post, index) => (
                <article key={index} className="group cursor-pointer">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl mb-6">
                    <img
                      src={post.imageUrl || "/media/12/IMG_0513-1280x1358.jpg"}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
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
      </div>
    </div>
  );
}
