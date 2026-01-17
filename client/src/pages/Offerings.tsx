import { useEffect } from 'react';
import Section from '@/components/Section';
import { useLocation } from 'wouter';
import { getMediaUrl } from '@/lib/media';
import { usePageContent } from '@/hooks/usePageContent';
import { EditablePageZone } from '@/components/PageZone';

export default function Offerings() {
  const [location] = useLocation();
  const { getContent, getTextStyle, isLoading } = usePageContent('offerings');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

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

  // Get seeds section content from CMS
  const seedsTitle = getContent('seeds', 'title');
  const seedsSubtitle = getContent('seeds', 'subtitle');
  const seedsDescription = getContent('seeds', 'description');
  const seedsImage = getContent('seeds', 'imageUrl');

  // Get sheWrites section content from CMS
  const sheWritesTitle = getContent('sheWrites', 'title');
  const sheWritesSubtitle = getContent('sheWrites', 'subtitle');
  const sheWritesDescription = getContent('sheWrites', 'description');
  const sheWritesImage = getContent('sheWrites', 'imageUrl');

  // Get emerge section content from CMS
  const emergeTitle = getContent('emerge', 'title');
  const emergeSubtitle = getContent('emerge', 'subtitle');
  const emergeDescription = getContent('emerge', 'description');
  const emergeImage = getContent('emerge', 'imageUrl');

  // Get rootedUnity section content from CMS
  const rootedUnityTitle = getContent('rootedUnity', 'title');
  const rootedUnitySubtitle = getContent('rootedUnity', 'subtitle');
  const rootedUnityDescription = getContent('rootedUnity', 'description');
  const rootedUnityImage = getContent('rootedUnity', 'imageUrl');

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

      {/* Seeds of a New Paradigm */}
      <Section 
        title={seedsTitle}
        subtitle={seedsSubtitle}
        description={seedsDescription}
        image={seedsImage ? getProperMediaUrl(seedsImage) : undefined}
        imageAlt="Seeds of a New Paradigm"
      />

      {/* She Writes */}
      <Section 
        title={sheWritesTitle}
        subtitle={sheWritesSubtitle}
        description={sheWritesDescription}
        image={sheWritesImage ? getProperMediaUrl(sheWritesImage) : undefined}
        imageAlt="She Writes"
        reversed
        dark
      />

      {/* Emerge with Us */}
      <Section 
        title={emergeTitle}
        subtitle={emergeSubtitle}
        description={emergeDescription}
        image={emergeImage ? getProperMediaUrl(emergeImage) : undefined}
        imageAlt="Emerge with Us"
      />

      {/* Rooted Unity */}
      <Section 
        title={rootedUnityTitle}
        subtitle={rootedUnitySubtitle}
        description={rootedUnityDescription}
        image={rootedUnityImage ? getProperMediaUrl(rootedUnityImage) : undefined}
        imageAlt="Rooted Unity"
        reversed
        dark
      />

      {/* Page Builder Zone: Before Footer */}
      <EditablePageZone pageSlug="offerings" zoneName="before-footer" />
    </div>
  );
}
