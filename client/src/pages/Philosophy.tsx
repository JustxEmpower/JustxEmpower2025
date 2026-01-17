import { useEffect } from 'react';
import Section from '@/components/Section';
import { useLocation } from 'wouter';
import { getMediaUrl } from '@/lib/media';
import NewsletterSignup from '@/components/NewsletterSignup';
import { usePageContent } from '@/hooks/usePageContent';
import { EditablePageZone } from '@/components/PageZone';

export default function Philosophy() {
  const [location] = useLocation();
  const { getContent, getTextStyle, isLoading } = usePageContent('philosophy');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Get hero content from CMS (siteContent table)
  const heroTitle = getContent('hero', 'title');
  const heroSubtitle = getContent('hero', 'subtitle');
  const heroDescription = getContent('hero', 'description');
  const heroVideoUrl = getContent('hero', 'videoUrl');
  const heroImageUrl = getContent('hero', 'imageUrl');

  // Determine which media to use for hero (video takes priority)
  const heroMediaUrl = heroVideoUrl || heroImageUrl || '';
  const isHeroVideo = heroMediaUrl ? /\.(mp4|webm|mov|ogg)$/i.test(heroMediaUrl) : false;

  // Get principles content from CMS
  const principlesTitle = getContent('principles', 'title');
  const principlesImageUrl = getContent('principles', 'imageUrl');
  const principle1Title = getContent('principles', 'principle1_title');
  const principle1Desc = getContent('principles', 'principle1_description');
  const principle2Title = getContent('principles', 'principle2_title');
  const principle2Desc = getContent('principles', 'principle2_description');
  const principle3Title = getContent('principles', 'principle3_title');
  const principle3Desc = getContent('principles', 'principle3_description');

  // Get pillars content from CMS
  const pillarsTitle = getContent('pillars', 'title');
  const pillarsSubtitle = getContent('pillars', 'subtitle');
  const pillarsDescription = getContent('pillars', 'description');
  const pillarsImageUrl = getContent('pillars', 'imageUrl');

  // Get newsletter content from CMS
  const newsletterTitle = getContent('newsletter', 'title');
  const newsletterDesc = getContent('newsletter', 'description');

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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[60vh] w-full overflow-hidden rounded-b-[2.5rem]">
        <div className="absolute inset-0 bg-black/30 z-10" />
        
        {/* Video or Image Background */}
        {heroMediaUrl && isHeroVideo ? (
          <video
            src={getProperMediaUrl(heroMediaUrl)}
            autoPlay
            loop
            muted
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
            {heroDescription}
          </p>
        </div>
      </div>

      {/* Core Principles */}
      <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="font-serif text-4xl italic mb-8 text-foreground">{principlesTitle}</h2>
            <div className="space-y-12">
              <div>
                <h3 className="font-sans text-sm tracking-widest uppercase mb-3 text-muted-foreground">01. {principle1Title}</h3>
                <p className="text-lg leading-relaxed">{principle1Desc}</p>
              </div>
              <div>
                <h3 className="font-sans text-sm tracking-widest uppercase mb-3 text-muted-foreground">02. {principle2Title}</h3>
                <p className="text-lg leading-relaxed">{principle2Desc}</p>
              </div>
              <div>
                <h3 className="font-sans text-sm tracking-widest uppercase mb-3 text-muted-foreground">03. {principle3Title}</h3>
                <p className="text-lg leading-relaxed">{principle3Desc}</p>
              </div>
            </div>
          </div>
          <div className="sticky top-32">
            {principlesImageUrl ? (
              <img 
                src={getProperMediaUrl(principlesImageUrl)} 
                alt="Nature philosophy" 
                className="w-full h-[80vh] object-cover rounded-[1.5rem]"
              />
            ) : (
              <div className="w-full h-[80vh] bg-gradient-to-br from-neutral-300 to-neutral-500 rounded-[1.5rem]" />
            )}
          </div>
        </div>
      </div>

      {/* Three Pillars */}
      <Section 
        title={pillarsTitle}
        subtitle={pillarsSubtitle}
        description={pillarsDescription}
        image={pillarsImageUrl ? getProperMediaUrl(pillarsImageUrl) : undefined}
        imageAlt="Three Pillars Symbol"
        dark
      />

      {/* Page Builder Zone: Before Newsletter */}
      <EditablePageZone pageSlug="philosophy" zoneName="before-newsletter" />

      {/* Newsletter CTA */}
      <div className="py-24 px-6 md:px-12 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl italic mb-4 text-foreground">
            {newsletterTitle}
          </h2>
          <p className="font-sans text-muted-foreground mb-8">
            {newsletterDesc}
          </p>
          <div className="max-w-md mx-auto">
            <NewsletterSignup variant="inline" />
          </div>
        </div>
      </div>

      {/* Page Builder Zone: Before Footer */}
      <EditablePageZone pageSlug="philosophy" zoneName="before-footer" />
    </div>
  );
}
