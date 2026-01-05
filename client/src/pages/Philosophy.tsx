import { useEffect } from 'react';
import Section from '@/components/Section';
import { useLocation } from 'wouter';
import NewsletterSignup from '@/components/NewsletterSignup';
import { usePageSectionContent, getProperMediaUrl } from '@/hooks/usePageSectionContent';

export default function Philosophy() {
  const [location] = useLocation();
  const { getSection, isLoading } = usePageSectionContent('philosophy');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Get all section content from database - 100% database driven
  const heroSection = getSection('hero');
  const principlesSection = getSection('content'); // First content section is principles
  const newsletterSection = getSection('newsletter');

  // Find the pillars section (second content section with sectionId='pillars')
  // For now, we'll get it from the same content type
  const pillarsSection = principlesSection.sectionId === 'pillars' ? principlesSection : getSection('content');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  // Determine which media to use for hero (video takes priority)
  const heroMediaUrl = heroSection.videoUrl || heroSection.imageUrl || '';
  const isHeroVideo = heroMediaUrl ? /\.(mp4|webm|mov|ogg)$/i.test(heroMediaUrl) : false;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - 100% database driven */}
      <div className="relative h-[60vh] w-full overflow-hidden rounded-b-[2.5rem]">
        <div className="absolute inset-0 bg-black/30 z-10" />
        
        {/* Video or Image Background */}
        {heroMediaUrl && isHeroVideo ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source 
              src={getProperMediaUrl(heroMediaUrl)} 
              type={heroMediaUrl.endsWith('.webm') ? 'video/webm' : 'video/mp4'} 
            />
          </video>
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
            {heroSection.title || ''}
          </h1>
          <p className="font-sans text-sm md:text-base tracking-[0.2em] uppercase opacity-90">
            {heroSection.description || ''}
          </p>
        </div>
      </div>

      {/* Core Principles - 100% database driven */}
      {(principlesSection.title || principlesSection.principle1_title) && (
        <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="font-serif text-4xl italic mb-8 text-foreground">{principlesSection.title || ''}</h2>
              <div className="space-y-12">
                {principlesSection.principle1_title && (
                  <div>
                    <h3 className="font-sans text-sm tracking-widest uppercase mb-3 text-muted-foreground">01. {principlesSection.principle1_title}</h3>
                    <p className="text-lg leading-relaxed">{principlesSection.principle1_description || ''}</p>
                  </div>
                )}
                {principlesSection.principle2_title && (
                  <div>
                    <h3 className="font-sans text-sm tracking-widest uppercase mb-3 text-muted-foreground">02. {principlesSection.principle2_title}</h3>
                    <p className="text-lg leading-relaxed">{principlesSection.principle2_description || ''}</p>
                  </div>
                )}
                {principlesSection.principle3_title && (
                  <div>
                    <h3 className="font-sans text-sm tracking-widest uppercase mb-3 text-muted-foreground">03. {principlesSection.principle3_title}</h3>
                    <p className="text-lg leading-relaxed">{principlesSection.principle3_description || ''}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="sticky top-32">
              {principlesSection.imageUrl ? (
                <img 
                  src={getProperMediaUrl(principlesSection.imageUrl)} 
                  alt="Philosophy principles" 
                  className="w-full h-[80vh] object-cover rounded-[1.5rem]"
                />
              ) : (
                <div className="w-full h-[80vh] bg-gradient-to-br from-neutral-300 to-neutral-500 rounded-[1.5rem]" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Three Pillars - 100% database driven */}
      {(pillarsSection.pillar1_title || pillarsSection.subtitle) && (
        <Section 
          title={pillarsSection.title || ''}
          subtitle={pillarsSection.subtitle || ''}
          description={pillarsSection.description || ''}
          image={pillarsSection.imageUrl ? getProperMediaUrl(pillarsSection.imageUrl) : undefined}
          imageAlt="Three Pillars Symbol"
          dark
        />
      )}

      {/* Newsletter CTA - 100% database driven */}
      {(newsletterSection.title || newsletterSection.description) && (
        <div className="py-24 px-6 md:px-12 bg-neutral-50 dark:bg-neutral-900">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-serif text-3xl md:text-4xl italic mb-4 text-foreground">
              {newsletterSection.title || ''}
            </h2>
            <p className="font-sans text-muted-foreground mb-8">
              {newsletterSection.description || ''}
            </p>
            <div className="max-w-md mx-auto">
              <NewsletterSignup variant="inline" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
