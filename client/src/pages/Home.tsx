import { useEffect } from 'react';
import Lenis from 'lenis';
import Hero from '@/components/Hero';
import Section from '@/components/Section';
import { ManagedCarousel } from '@/components/ManagedCarousel';
import { usePageContent } from '@/hooks/usePageContent';
import { getMediaUrl } from '@/lib/media';
import { EditablePageZone } from '@/components/PageZone';

interface HomeProps {
  slug?: string;
}

export default function Home({ slug = 'home' }: HomeProps) {
  const { getContent, getSection, getTextStyle, isLoading } = usePageContent(slug);

  // Helper to get proper media URL
  const getProperMediaUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : getMediaUrl(url);
  };

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

  const philosophySection = getSection('philosophy');
  const communitySection = getSection('community');
  const pointsOfAccessSection = getSection('pointsOfAccess');
  
  // Get hero section data
  const heroSection = getSection('hero');
  
  // DEBUG: Log hero section data to trace video URL issue
  console.log('[Home] heroSection:', heroSection);
  console.log('[Home] heroSection.videoUrl:', heroSection.videoUrl);
  console.log('[Home] heroSection.imageUrl:', heroSection.imageUrl);

  // Check if sections have actual content (not just empty objects)
  const hasHeroContent = heroSection.title || heroSection.videoUrl || heroSection.imageUrl;
  const hasPhilosophyContent = philosophySection.title || philosophySection.description;
  const hasCommunityContent = communitySection.title || communitySection.description;
  const hasPointsOfAccessContent = pointsOfAccessSection.title || pointsOfAccessSection.description;

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-white">
      <main>
        {/* Hero Section - only show if content exists */}
        {hasHeroContent && (
          <Hero
            videoUrl={heroSection.videoUrl}
            imageUrl={heroSection.imageUrl}
            subtitle={heroSection.subtitle}
            title={heroSection.title}
            description={heroSection.description}
            ctaText={heroSection.ctaText || heroSection.buttonText}
            ctaLink={heroSection.ctaLink || heroSection.buttonLink}
            isLoading={isLoading}
            textStyles={{
              title: getTextStyle('hero', 'title'),
              subtitle: getTextStyle('hero', 'subtitle'),
              description: getTextStyle('hero', 'description'),
              ctaText: getTextStyle('hero', 'ctaText') || getTextStyle('hero', 'buttonText'),
            }}
          />
        )}
        
        {/* Page Builder Zone: After Hero */}
        <EditablePageZone pageSlug="home" zoneName="after-hero" />
        
        {/* Philosophy Section - only show if content exists */}
        {hasPhilosophyContent && (
          <Section 
            title={philosophySection.title}
            subtitle={philosophySection.label}
            description={philosophySection.description}
            image={philosophySection.imageUrl ? getProperMediaUrl(philosophySection.imageUrl) : undefined}
            imageAlt={philosophySection.imageAlt || ""}
            ctaText={philosophySection.ctaText}
            ctaLink={philosophySection.ctaLink}
            textStyles={{
              title: getTextStyle('philosophy', 'title'),
              subtitle: getTextStyle('philosophy', 'label'),
              description: getTextStyle('philosophy', 'description'),
              ctaText: getTextStyle('philosophy', 'ctaText'),
            }}
          />
        )}

        <ManagedCarousel />
        
        {/* Page Builder Zone: After Carousel */}
        <EditablePageZone pageSlug="home" zoneName="after-carousel" />

        {/* Page Builder Zone: Mid Page */}
        <EditablePageZone pageSlug="home" zoneName="mid-page" />

        {/* Community Section - only show if content exists */}
        {hasCommunityContent && (
          <Section 
            title={communitySection.title}
            subtitle={communitySection.label}
            description={communitySection.description}
            image={communitySection.imageUrl ? getProperMediaUrl(communitySection.imageUrl) : undefined}
            imageAlt={communitySection.imageAlt || ""}
            reversed
            dark
            ctaText={communitySection.ctaText}
            ctaLink={communitySection.ctaLink}
            textStyles={{
              title: getTextStyle('community', 'title'),
              subtitle: getTextStyle('community', 'label'),
              description: getTextStyle('community', 'description'),
              ctaText: getTextStyle('community', 'ctaText'),
            }}
          />
        )}

        {/* Points of Access Section - only show if content exists */}
        {hasPointsOfAccessContent && (
          <Section 
            title={pointsOfAccessSection.title}
            subtitle={pointsOfAccessSection.subtitle}
            description={pointsOfAccessSection.description}
            image={pointsOfAccessSection.imageUrl ? getProperMediaUrl(pointsOfAccessSection.imageUrl) : undefined}
            imageAlt={pointsOfAccessSection.imageAlt || ""}
            ctaText={pointsOfAccessSection.ctaText}
            ctaLink={pointsOfAccessSection.ctaLink}
            textStyles={{
              title: getTextStyle('pointsOfAccess', 'title'),
              subtitle: getTextStyle('pointsOfAccess', 'label'),
              description: getTextStyle('pointsOfAccess', 'description'),
              ctaText: getTextStyle('pointsOfAccess', 'ctaText'),
            }}
          />
        )}

        {/* Page Builder Zone: After Content */}
        <EditablePageZone pageSlug="home" zoneName="after-content" />

        {/* Page Builder Zone: Before Newsletter */}
        <EditablePageZone pageSlug="home" zoneName="before-newsletter" />

        {/* Page Builder Zone: Before Footer */}
        <EditablePageZone pageSlug="home" zoneName="before-footer" />

        {/* Show message if no content */}
        {!hasHeroContent && !hasPhilosophyContent && !hasCommunityContent && !hasPointsOfAccessContent && !isLoading && (
          <div className="min-h-[50vh] flex items-center justify-center">
            <p className="text-muted-foreground text-lg">No content has been added to this page yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
