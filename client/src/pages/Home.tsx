import { useEffect } from 'react';
import Lenis from 'lenis';
import Hero from '@/components/Hero';
import Section from '@/components/Section';
import Carousel from '@/components/Carousel';
import { usePageContent } from '@/hooks/usePageContent';
import { getMediaUrl } from '@/lib/media';

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

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-white">
      <main>
        <Hero
          videoUrl={heroSection.videoUrl}
          imageUrl={heroSection.imageUrl}
          subtitle={heroSection.subtitle}
          title={heroSection.title}
          description={heroSection.subDescription || heroSection.description}
          ctaText={heroSection.ctaText || heroSection.buttonText}
          ctaLink={heroSection.ctaLink || heroSection.buttonLink}
          isLoading={isLoading}
          // Pass text styles from RDS
          textStyles={{
            title: getTextStyle('title'),
            subtitle: getTextStyle('subtitle'),
            description: getTextStyle('subDescription') || getTextStyle('description'),
            ctaText: getTextStyle('ctaText') || getTextStyle('buttonText'),
          }}
        />
        
        <Section 
          title={philosophySection.title || 'The Philosophy'}
          subtitle={philosophySection.label || 'Our Approach'}
          description={philosophySection.description || 'Just Empower operates at the intersection of personal reclamation and collective influence. We believe that transformative leadership begins within—through self-trust, discernment, and embodied integrity—and radiates outward into the structures we shape, steward, and reimagine.'}
          image={philosophySection.imageUrl ? getProperMediaUrl(philosophySection.imageUrl) : undefined}
          imageAlt="Ocean waves representing depth and flow"
          ctaText={philosophySection.ctaText || 'Discover More'}
          ctaLink={philosophySection.ctaLink || '/philosophy/vision-ethos'}
          // Pass text styles from RDS
          textStyles={{
            title: getTextStyle('title'),
            subtitle: getTextStyle('label'),
            description: getTextStyle('description'),
            ctaText: getTextStyle('ctaText'),
          }}
        />

        <Carousel />

        <Section 
          title={communitySection.title || 'Emerge With Us'}
          subtitle={communitySection.label || 'Community'}
          description={communitySection.description || 'We are planting seeds for a new paradigm—one rooted in consciousness, compassion, and sacred reciprocity. This is an invitation for women ready to move beyond survival patterns and into grounded discernment, embodied presence, and conscious self-authority.'}
          image={communitySection.imageUrl ? getProperMediaUrl(communitySection.imageUrl) : undefined}
          imageAlt="Woman walking in nature"
          reversed
          dark
          ctaText={communitySection.ctaText || 'Walk With Us'}
          ctaLink={communitySection.ctaLink || '/walk-with-us'}
          // Pass text styles from RDS
          textStyles={{
            title: getTextStyle('title'),
            subtitle: getTextStyle('label'),
            description: getTextStyle('description'),
            ctaText: getTextStyle('ctaText'),
          }}
        />

        <Section 
          title={pointsOfAccessSection.title || 'Points of Access'}
          subtitle={pointsOfAccessSection.subtitle || 'Ways to connect with the work'}
          description={pointsOfAccessSection.description || 'Engagement happens through published works, ongoing essays, select gatherings, and updates as new initiatives launch.'}
          image={pointsOfAccessSection.imageUrl ? getProperMediaUrl(pointsOfAccessSection.imageUrl) : undefined}
          imageAlt="Connection and engagement"
          ctaText={pointsOfAccessSection.ctaText || 'Learn More'}
          ctaLink={pointsOfAccessSection.ctaLink || '/vision-ethos'}
          // Pass text styles from RDS
          textStyles={{
            title: getTextStyle('title'),
            subtitle: getTextStyle('label'),
            description: getTextStyle('description'),
            ctaText: getTextStyle('ctaText'),
          }}
        />
      </main>
    </div>
  );
}
