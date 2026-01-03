import { useEffect } from 'react';
import Section from '@/components/Section';
import { useLocation } from 'wouter';
import { getMediaUrl } from '@/lib/media';
import { usePageContent } from '@/hooks/usePageContent';

export default function Offerings() {
  const [location] = useLocation();
  const { getContent, isLoading } = usePageContent('offerings');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Helper to get proper media URL
  const getProperMediaUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : getMediaUrl(url);
  };

  // Get hero content from CMS
  const heroTitle = getContent('hero', 'title') || 'Our Offerings';
  const heroSubtitle = getContent('hero', 'subtitle') || 'TRANSFORMATIVE EXPERIENCES';
  const heroDescription = getContent('hero', 'description') || 'Seeds of a New Paradigm';
  const heroVideoUrl = getContent('hero', 'videoUrl') || '';
  const heroImageUrl = getContent('hero', 'imageUrl') || '';
  
  // Determine which media to use for hero (video takes priority)
  const heroMediaUrl = heroVideoUrl || heroImageUrl;
  const isHeroVideo = heroMediaUrl ? /\.(mp4|webm|mov|ogg)$/i.test(heroMediaUrl) : false;

  // Get seeds section content from CMS
  const seedsTitle = getContent('seeds', 'title') || 'Seeds of a New Paradigm';
  const seedsSubtitle = getContent('seeds', 'subtitle') || 'Coherence as Creation';
  const seedsDescription = getContent('seeds', 'description') || "This was the heart of regeneration: coherence as creation's remembering, and humanity as the soil through which it blooms. Just Empower was not merely a platform; it was a living ecosystem of renewal, resilience, and reclamation.";
  const seedsImage = getContent('seeds', 'imageUrl') || '';

  // Get sheWrites section content from CMS
  const sheWritesTitle = getContent('sheWrites', 'title') || 'She Writes';
  const sheWritesSubtitle = getContent('sheWrites', 'subtitle') || 'Lessons from the Living Codex';
  const sheWritesDescription = getContent('sheWrites', 'description') || 'A living journal—a chamber of remembrance where experience and wisdom converged. The blog explored Universal Laws, Archetypes, Consciousness, Transformation, and Alchemy—transforming wound into wisdom.';
  const sheWritesImage = getContent('sheWrites', 'imageUrl') || '';

  // Get emerge section content from CMS
  const emergeTitle = getContent('emerge', 'title') || 'Emerge with Us';
  const emergeSubtitle = getContent('emerge', 'subtitle') || 'Partnerships Rooted in Reciprocity';
  const emergeDescription = getContent('emerge', 'description') || 'Partnership with Just Empower was not transactional; it was transformational. To collaborate was to invest in the renewal of culture itself—through aligned initiatives that restored coherence between people, purpose, and planet.';
  const emergeImage = getContent('emerge', 'imageUrl') || '';

  // Get rootedUnity section content from CMS
  const rootedUnityTitle = getContent('rootedUnity', 'title') || 'Rooted Unity';
  const rootedUnitySubtitle = getContent('rootedUnity', 'subtitle') || 'A Movement for the Earth';
  const rootedUnityDescription = getContent('rootedUnity', 'description') || 'Rooted Unity cultivated ecological stewardship and collective renewal through conscious policy, regenerative design, and the principles of living reciprocity. A living bridge between the wild intelligence of nature and the thoughtful evolution of shared systems.';
  const rootedUnityImage = getContent('rootedUnity', 'imageUrl') || '';

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
    </div>
  );
}
