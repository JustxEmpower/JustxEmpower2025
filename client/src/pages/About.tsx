import { useEffect } from 'react';
import Section from '@/components/Section';
import { useLocation } from 'wouter';
import NewsletterSignup from '@/components/NewsletterSignup';

export default function About() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[70vh] w-full overflow-hidden rounded-b-[2.5rem]">
        <div className="absolute inset-0 bg-black/30 z-10" />
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/media/09/seeds-of-power.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="font-serif text-5xl md:text-7xl font-light tracking-wide italic mb-6">
            Our Story
          </h1>
          <p className="font-sans text-sm md:text-base tracking-[0.2em] uppercase opacity-90">
            Stewardship of Embodied Change
          </p>
        </div>
      </div>

      {/* Founder Story */}
      <Section 
        title="The Founder"
        subtitle="April Gambardella"
        description="From the moment her eyes opened to this world, April was drawn to truth—not from a need to know, but from a need to understand. Her mother taught her that true stewardship means leaving everything better than we found it: a space, a system, or the Earth itself. This ethos of restoration and responsibility became the ground of her devotion."
        image="/media/12/IMG_0513-1280x1358.jpg"
        imageAlt="April Gambardella"
      />

      {/* The Path */}
      <Section 
        title="The Path of Initiation"
        subtitle="Forged in Truth"
        description="April's understanding of trauma, healing, and transformation was not theoretical—it was forged through lived experience. With a background in law and communication, she understood the mechanics of influence, but it was the descent itself that transmuted knowledge into truth. She was not taught—she was tempered. Not by intellect, but by initiation."
        image="/media/11/Tri-Cover-1280x960.jpg"
        imageAlt="Nature landscape"
        reversed
        dark
      />

      {/* Mission */}
      <div className="py-24 px-6 md:px-12 bg-background text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-4xl md:text-5xl italic mb-8 text-foreground">
            "True stewardship means leaving everything better than we found it."
          </h2>
          <p className="font-sans text-lg text-muted-foreground leading-relaxed">
            Though her roots first took hold in Southern California, April grounded herself in the vibrant soils of Austin, Texas—a sanctuary that attuned her rhythm, mirrored her reinvention, and revealed the sacred nature of emergence.
          </p>
        </div>
      </div>

      {/* Newsletter CTA */}
      <div className="py-24 px-6 md:px-12 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl italic mb-4 text-foreground">
            Stay Connected
          </h2>
          <p className="font-sans text-muted-foreground mb-8">
            Join our monthly mailing list for insights on embodied transformation, conscious leadership, and the rise of her.
          </p>
          <div className="max-w-md mx-auto">
            <NewsletterSignup variant="inline" />
          </div>
        </div>
      </div>
    </div>
  );
}
