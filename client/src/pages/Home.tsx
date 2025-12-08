import { useEffect } from 'react';
import Lenis from 'lenis';
import Hero from '@/components/Hero';
import Section from '@/components/Section';
import Carousel from '@/components/Carousel';

export default function Home() {
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

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-white">
      <main>
        <Hero />
        
        <Section 
          title="The Philosophy"
          subtitle="Our Approach"
          description="Just Empower operates at the intersection of personal healing and systemic change. We believe that true empowerment is a homecoming—a return to the voice, clarity, and sovereignty that have always lived within you."
          image="/media/12/IMG_0513-1280x1358.jpg"
          imageAlt="Ocean waves representing depth and flow"
        />

        <Carousel />

        <Section 
          title="Emerge With Us"
          subtitle="Community"
          description="We are planting seeds for a new paradigm rooted in consciousness, compassion, and sacred reciprocity. Join a community of women dedicated to rewriting the narrative of leadership and legacy."
          image="/media/12/IMG_0516-800x1044.jpg"
          imageAlt="Woman walking in nature"
          reversed
          dark
        />

        <Section 
          title="Rooted Unity"
          subtitle="Coming 2026"
          description="Ecological stewardship meets personal healing. Recognizing that our internal landscape mirrors the external world, we embark on a journey of regenerative living and planetary care."
          image="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000&auto=format&fit=crop"
          imageAlt="Forest sunlight representing growth"
        />
      </main>
    </div>
  );
}
