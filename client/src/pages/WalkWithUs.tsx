import { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { usePageSectionContent, getProperMediaUrl } from '@/hooks/usePageSectionContent';

export default function WalkWithUs() {
  const [location] = useLocation();
  const { sections, isLoading } = usePageSectionContent('walk-with-us');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Get sections by their sectionId in content
  const getSectionBySectionId = (sectionId: string) => {
    const section = sections.find(s => s.content?.sectionId === sectionId);
    return section?.content || {};
  };

  // Get section by sectionType
  const getSectionByType = (sectionType: string) => {
    const section = sections.find(s => s.sectionType === sectionType);
    return section?.content || {};
  };

  // Get all section content from database - 100% database driven
  const heroSection = getSectionByType('hero');
  const mainSection = getSectionBySectionId('main');
  const partnersSection = getSectionBySectionId('partners');
  const individualsSection = getSectionBySectionId('individuals');
  const quoteSection = getSectionBySectionId('quote') || getSectionByType('quote');

  // Determine which media to use for hero (video takes priority)
  const heroMediaUrl = heroSection.videoUrl || heroSection.imageUrl || '';
  const isVideo = heroMediaUrl ? /\.(mp4|webm|mov|ogg)$/i.test(heroMediaUrl) : false;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - 100% database driven */}
      <div className="relative h-[70vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-black/30 z-10" />
        
        {/* Video or Image Background */}
        {heroMediaUrl && isVideo ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source 
              src={getProperMediaUrl(heroMediaUrl)} 
              type={heroMediaUrl.endsWith('.webm') ? 'video/webm' : 'video/mp4'} 
            />
            Your browser does not support the video tag.
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
            {heroSection.subtitle || ''}
          </p>
        </div>
      </div>

      {/* Main Content - 100% database driven */}
      <div className="py-24 px-6 md:px-12 max-w-4xl mx-auto text-center">
        <h2 className="font-serif text-4xl italic mb-8 text-foreground">
          {mainSection.title || ''}
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed mb-12">
          {mainSection.description || ''}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Partners Card - 100% database driven */}
          {(partnersSection.title || partnersSection.description) && (
            <div className="bg-muted/30 p-8 rounded-[1.5rem] text-left">
              <h3 className="font-serif text-2xl italic mb-4">{partnersSection.title || ''}</h3>
              <p className="text-muted-foreground mb-6">
                {partnersSection.description || ''}
              </p>
              {partnersSection.ctaLink && (
                <Link href={partnersSection.ctaLink}>
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
                    {partnersSection.ctaText || 'Learn More'}
                  </Button>
                </Link>
              )}
            </div>
          )}
          
          {/* Individuals Card - 100% database driven */}
          {(individualsSection.title || individualsSection.description) && (
            <div className="bg-muted/30 p-8 rounded-[1.5rem] text-left">
              <h3 className="font-serif text-2xl italic mb-4">{individualsSection.title || ''}</h3>
              <p className="text-muted-foreground mb-6">
                {individualsSection.description || ''}
              </p>
              {individualsSection.ctaLink && (
                <Link href={individualsSection.ctaLink}>
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
                    {individualsSection.ctaText || 'Learn More'}
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Quote Section - 100% database driven */}
        {(quoteSection.text || quoteSection.imageUrl) && (
          <div className="relative rounded-[1.5rem] overflow-hidden h-[400px]">
            {quoteSection.imageUrl ? (
              <img 
                src={getProperMediaUrl(quoteSection.imageUrl)} 
                alt="Community" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-300 to-neutral-500" />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <p className="text-white font-serif text-3xl italic max-w-2xl px-4">
                {quoteSection.text || ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
