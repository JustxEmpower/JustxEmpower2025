import { useEffect } from 'react';
import Lenis from 'lenis';
import Hero from '@/components/Hero';
import Section from '@/components/Section';
import Carousel from '@/components/Carousel';
import { usePageContent } from '@/hooks/usePageContent';
import { getMediaUrl } from '@/lib/media';

export default function Home() {
  const { getContent, getSection, isLoading } = usePageContent('home');

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
  const rootedUnitySection = getSection('rootedUnity');

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-white">
      <main>
        <Hero />
        
        <Section 
          title={philosophySection.title || 'The Philosophy'}
          subtitle={philosophySection.label || 'Our Approach'}
          description={philosophySection.description || 'Just Empower operates at the intersection of personal reclamation and collective influence. We believe that transformative leadership begins within—through self-trust, discernment, and embodied integrity—and radiates outward into the structures we shape, steward, and reimagine.'}
          image={philosophySection.imageUrl ? getProperMediaUrl(philosophySection.imageUrl) : undefined}
          imageAlt="Ocean waves representing depth and flow"
          ctaText={philosophySection.ctaText || 'Discover More'}
          ctaLink={philosophySection.ctaLink || '/philosophy/vision-ethos'}
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
        />

        <Section 
          title={rootedUnitySection.title || 'Rooted Unity'}
          subtitle={rootedUnitySection.label || 'Coming 2026'}
          description={rootedUnitySection.description || 'Ecological stewardship meets personal healing. Recognizing that our internal landscape mirrors the external world, we embark on a journey of regenerative living and planetary care—understanding that tending the Earth is an extension of tending the self.'}
          image={rootedUnitySection.imageUrl ? getProperMediaUrl(rootedUnitySection.imageUrl) : undefined}
          imageAlt="Forest sunlight representing growth"
          ctaText={rootedUnitySection.ctaText || 'Learn More'}
          ctaLink={rootedUnitySection.ctaLink || '/offerings/rooted-unity'}
        />
      </main>
    </div>
  );
}
