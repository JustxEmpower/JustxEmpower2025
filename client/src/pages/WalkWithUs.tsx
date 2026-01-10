import { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { getMediaUrl } from '@/lib/media';
import { usePageContent } from '@/hooks/usePageContent';

interface WalkWithUsProps {
  slug?: string;
}

export default function WalkWithUs({ slug = 'walk-with-us' }: WalkWithUsProps) {
  const [location] = useLocation();
  const { getContent, getTextStyle, isLoading } = usePageContent(slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Helper to get proper media URL
  const getProperMediaUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : getMediaUrl(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  // Get hero section content from CMS
  const heroTitle = getContent('hero', 'title');
  const heroSubtitle = getContent('hero', 'subtitle');
  const heroVideoUrl = getContent('hero', 'videoUrl');
  const heroImageUrl = getContent('hero', 'imageUrl');
  
  // Determine which media to use for hero (video takes priority)
  const heroMediaUrl = heroVideoUrl || heroImageUrl;
  const isVideo = heroMediaUrl ? /\.(mp4|webm|mov|ogg)$/i.test(heroMediaUrl) : false;

  // Get main content section from CMS
  const mainTitle = getContent('main', 'title');
  const mainDescription = getContent('main', 'description');

  // Get partner card content from CMS
  const partnerTitle = getContent('partners', 'title');
  const partnerDescription = getContent('partners', 'description');
  const partnerCtaText = getContent('partners', 'ctaText');
  const partnerCtaLink = getContent('partners', 'ctaLink');

  // Get individual card content from CMS
  const individualTitle = getContent('individuals', 'title');
  const individualDescription = getContent('individuals', 'description');
  const individualCtaText = getContent('individuals', 'ctaText');
  const individualCtaLink = getContent('individuals', 'ctaLink');

  // Get quote section from CMS
  const quoteText = getContent('quote', 'text');
  const quoteImageUrl = getContent('quote', 'imageUrl');

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[70vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-black/30 z-10" />
        
        {/* Video or Image Background */}
        {heroMediaUrl && isVideo ? (
          <video
            src={getProperMediaUrl(heroMediaUrl)}
            autoPlay
            muted
            loop
            playsInline
            crossOrigin="anonymous"
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : heroMediaUrl ? (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${getProperMediaUrl(heroMediaUrl)})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-400 to-neutral-600" />
        )}
        
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="font-serif text-5xl md:text-7xl font-light tracking-wide italic mb-6">
            {heroTitle}
          </h1>
          <p className="font-sans text-sm md:text-base tracking-[0.2em] uppercase opacity-90">
            {heroSubtitle}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-24 px-6 md:px-12 max-w-4xl mx-auto text-center">
        <h2 className="font-serif text-4xl italic mb-8 text-foreground">{mainTitle}</h2>
        <p className="text-lg text-muted-foreground leading-relaxed mb-12">
          {mainDescription}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-muted/30 p-8 rounded-[1.5rem] text-left">
            <h3 className="font-serif text-2xl italic mb-4">{partnerTitle}</h3>
            <p className="text-muted-foreground mb-6">
              {partnerDescription}
            </p>
            <Link href={partnerCtaLink}>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
                {partnerCtaText}
              </Button>
            </Link>
          </div>
          <div className="bg-muted/30 p-8 rounded-[1.5rem] text-left">
            <h3 className="font-serif text-2xl italic mb-4">{individualTitle}</h3>
            <p className="text-muted-foreground mb-6">
              {individualDescription}
            </p>
            <Link href={individualCtaLink}>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
                {individualCtaText}
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative rounded-[1.5rem] overflow-hidden h-[400px]">
          {quoteImageUrl ? (
            <img 
              src={getProperMediaUrl(quoteImageUrl)} 
              alt="Community" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-300 to-neutral-500" />
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <p className="text-white font-serif text-3xl italic max-w-2xl px-4">
              {quoteText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
