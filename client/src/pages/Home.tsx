import { useEffect } from 'react';
import Lenis from 'lenis';
import Hero from '@/components/Hero';
import Section from '@/components/Section';
import Carousel from '@/components/Carousel';
import { usePageSectionContent, getProperMediaUrl } from '@/hooks/usePageSectionContent';

export default function Home() {
  const { getSection, getField, isLoading } = usePageSectionContent('home');

  useEffect(() => {
    // Initialize Lenis smooth scroll with more artistic, fluid settings
    const lenis = new Lenis({
      duration: 2.0, // Slower, more luxurious feel
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.8, // Slower scroll speed
      touchMultiplier: 1.5,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Get all section content from database using EXACT section type names from DB
  // Database sectionTypes: hero, content (philosophy), carousel, community, rooted-unity, newsletter, footer
  const heroSection = getSection('hero');
  const philosophySection = getSection('content'); // DB uses 'content' for philosophy section
  const communitySection = getSection('community');
  const rootedUnitySection = getSection('rooted-unity'); // DB uses 'rooted-unity' with hyphen

  // Show loading state while fetching content
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-white">
      <main>
        {/* Hero Section - 100% database driven */}
        <Hero
          videoUrl={heroSection.videoUrl || ''}
          imageUrl={heroSection.imageUrl || ''}
          subtitle={heroSection.subtitle || ''}
          title={heroSection.title || ''}
          description={heroSection.subDescription || heroSection.description || ''}
          ctaText={heroSection.ctaText || heroSection.buttonText || ''}
          ctaLink={heroSection.ctaLink || heroSection.buttonLink || ''}
          isLoading={false}
        />
        
        {/* Philosophy Section - 100% database driven (sectionType: 'content') */}
        {(philosophySection.title || philosophySection.description) && (
          <Section 
            title={philosophySection.title || ''}
            subtitle={philosophySection.label || ''}
            description={philosophySection.description || ''}
            image={philosophySection.imageUrl ? getProperMediaUrl(philosophySection.imageUrl) : undefined}
            imageAlt={philosophySection.imageAlt || 'Philosophy section image'}
            ctaText={philosophySection.ctaText || ''}
            ctaLink={philosophySection.ctaLink || ''}
          />
        )}

        {/* Carousel - fetches its own content from database */}
        <Carousel />

        {/* Community Section - 100% database driven */}
        {(communitySection.title || communitySection.description) && (
          <Section 
            title={communitySection.title || ''}
            subtitle={communitySection.label || ''}
            description={communitySection.description || ''}
            image={communitySection.imageUrl ? getProperMediaUrl(communitySection.imageUrl) : undefined}
            imageAlt={communitySection.imageAlt || 'Community section image'}
            reversed
            dark
            ctaText={communitySection.ctaText || ''}
            ctaLink={communitySection.ctaLink || ''}
          />
        )}

        {/* Rooted Unity Section - 100% database driven (sectionType: 'rooted-unity') */}
        {(rootedUnitySection.title || rootedUnitySection.description) && (
          <Section 
            title={rootedUnitySection.title || ''}
            subtitle={rootedUnitySection.label || ''}
            description={rootedUnitySection.description || ''}
            image={rootedUnitySection.imageUrl ? getProperMediaUrl(rootedUnitySection.imageUrl) : undefined}
            imageAlt={rootedUnitySection.imageAlt || 'Rooted Unity section image'}
            ctaText={rootedUnitySection.ctaText || ''}
            ctaLink={rootedUnitySection.ctaLink || ''}
          />
        )}
      </main>
    </div>
  );
}
