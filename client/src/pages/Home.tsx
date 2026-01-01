import { useEffect } from 'react';
import Lenis from 'lenis';
import Hero from '@/components/Hero';
import Section from '@/components/Section';
import Carousel from '@/components/Carousel';
import { usePageContent } from '@/hooks/usePageContent';
import { getMediaUrl } from '@/lib/media';

export default function Home() {
  const { getContent, getSection, isLoading } = usePageContent('home');

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

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
          description={philosophySection.description || 'Just Empower operates at the intersection of personal healing and systemic change.'}
          image={getMediaUrl(philosophySection.imageUrl || '/media/12/IMG_0513-1280x1358.jpg')}
          imageAlt="Ocean waves representing depth and flow"
        />

        <Carousel />

        <Section 
          title={communitySection.title || 'Emerge With Us'}
          subtitle={communitySection.label || 'Community'}
          description={communitySection.description || 'We are planting seeds for a new paradigm rooted in consciousness, compassion, and sacred reciprocity.'}
          image={getMediaUrl(communitySection.imageUrl || '/media/12/IMG_0516-800x1044.jpg')}
          imageAlt="Woman walking in nature"
          reversed
          dark
        />

        <Section 
          title={rootedUnitySection.title || 'Rooted Unity'}
          subtitle={rootedUnitySection.label || 'Coming 2026'}
          description={rootedUnitySection.description || 'Ecological stewardship meets personal healing. Recognizing that our internal landscape mirrors the external world, we embark on a journey of regenerative living and planetary care.'}
          image={getMediaUrl(rootedUnitySection.imageUrl || '/media/11/Lavender1.jpg')}
          imageAlt="Forest sunlight representing growth"
        />
      </main>
    </div>
  );
}
