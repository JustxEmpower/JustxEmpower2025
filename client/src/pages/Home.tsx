import { useEffect } from 'react';
import Lenis from 'lenis';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Section from '@/components/Section';
import Carousel from '@/components/Carousel';
import Footer from '@/components/Footer';

export default function Home() {
  useEffect(() => {
    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
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
      <Navigation />
      
      <main>
        <Hero />
        
        <Section 
          title="The Philosophy"
          subtitle="Our Approach"
          description="Just Empower operates at the intersection of personal healing and systemic change. We believe that true empowerment is a homecoming—a return to the voice, clarity, and sovereignty that have always lived within you."
          image="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop"
          imageAlt="Ocean waves representing depth and flow"
        />

        <Carousel />

        <Section 
          title="Emerge With Us"
          subtitle="Community"
          description="We are planting seeds for a new paradigm rooted in consciousness, compassion, and sacred reciprocity. Join a community of women dedicated to rewriting the narrative of leadership and legacy."
          image="https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1000&auto=format&fit=crop"
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

      <Footer />
    </div>
  );
}
