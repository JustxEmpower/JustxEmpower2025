import { useEffect } from 'react';
import Section from '@/components/Section';
import { useLocation } from 'wouter';
import { usePageSectionContent, getProperMediaUrl } from '@/hooks/usePageSectionContent';

export default function Offerings() {
  const [location] = useLocation();
  const { sections, isLoading } = usePageSectionContent('offerings');

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
  const seedsSection = getSectionBySectionId('seeds');
  const sheWritesSection = getSectionBySectionId('sheWrites');
  const emergeSection = getSectionBySectionId('emerge');
  const rootedUnitySection = getSectionBySectionId('rootedUnity');

  // Determine which media to use for hero (video takes priority)
  const heroMediaUrl = heroSection.videoUrl || heroSection.imageUrl || '';
  const isHeroVideo = heroMediaUrl ? /\.(mp4|webm|mov|ogg)$/i.test(heroMediaUrl) : false;

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

      {/* Seeds of a New Paradigm - 100% database driven */}
      {(seedsSection.title || seedsSection.description) && (
        <Section 
          title={seedsSection.title || ''}
          subtitle={seedsSection.subtitle || ''}
          description={seedsSection.description || ''}
          image={seedsSection.imageUrl ? getProperMediaUrl(seedsSection.imageUrl) : undefined}
          imageAlt="Seeds of a New Paradigm"
          ctaText={seedsSection.ctaText || ''}
          ctaLink={seedsSection.link || seedsSection.ctaLink || ''}
        />
      )}

      {/* She Writes - 100% database driven */}
      {(sheWritesSection.title || sheWritesSection.description) && (
        <Section 
          title={sheWritesSection.title || ''}
          subtitle={sheWritesSection.subtitle || ''}
          description={sheWritesSection.description || ''}
          image={sheWritesSection.imageUrl ? getProperMediaUrl(sheWritesSection.imageUrl) : undefined}
          imageAlt="She Writes"
          reversed
          dark
          ctaText={sheWritesSection.ctaText || ''}
          ctaLink={sheWritesSection.link || sheWritesSection.ctaLink || ''}
        />
      )}

      {/* Emerge with Us - 100% database driven */}
      {(emergeSection.title || emergeSection.description) && (
        <Section 
          title={emergeSection.title || ''}
          subtitle={emergeSection.subtitle || ''}
          description={emergeSection.description || ''}
          image={emergeSection.imageUrl ? getProperMediaUrl(emergeSection.imageUrl) : undefined}
          imageAlt="Emerge with Us"
          ctaText={emergeSection.ctaText || ''}
          ctaLink={emergeSection.link || emergeSection.ctaLink || ''}
        />
      )}

      {/* Rooted Unity - 100% database driven */}
      {(rootedUnitySection.title || rootedUnitySection.description) && (
        <Section 
          title={rootedUnitySection.title || ''}
          subtitle={rootedUnitySection.subtitle || ''}
          description={rootedUnitySection.description || ''}
          image={rootedUnitySection.imageUrl ? getProperMediaUrl(rootedUnitySection.imageUrl) : undefined}
          imageAlt="Rooted Unity"
          reversed
          dark
          ctaText={rootedUnitySection.ctaText || ''}
          ctaLink={rootedUnitySection.link || rootedUnitySection.ctaLink || ''}
        />
      )}
    </div>
  );
}
