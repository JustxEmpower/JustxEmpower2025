import { useEffect } from 'react';
import Section from '@/components/Section';
import { useLocation } from 'wouter';

export default function Offerings() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-black/30 z-10" />
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/media/12/IMG_0516-1280x1358.jpg)' }}
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="font-serif text-5xl md:text-7xl font-light tracking-wide italic mb-6">
            Our Offerings
          </h1>
          <p className="font-sans text-sm md:text-base tracking-[0.2em] uppercase opacity-90">
            Seeds of a New Paradigm
          </p>
        </div>
      </div>

      {/* Seeds of a New Paradigm */}
      <Section 
        title="Seeds of a New Paradigm"
        subtitle="Coherence as Creation"
        description="This was the heart of regeneration: coherence as creation's remembering, and humanity as the soil through which it blooms. Just Empower was not merely a platform; it was a living ecosystem of renewal, resilience, and reclamation."
        image="/media/12/IMG_0513-1280x1358.jpg"
        imageAlt="Seeds of a New Paradigm"
      />

      {/* She Writes */}
      <Section 
        title="She Writes"
        subtitle="Lessons from the Living Codex"
        description="A living journal—a chamber of remembrance where experience and wisdom converged. The blog explored Universal Laws, Archetypes, Consciousness, Transformation, and Alchemy—transforming wound into wisdom."
        image="/media/11/Tri-Cover-1280x960.jpg"
        imageAlt="She Writes"
        reversed
        dark
      />

      {/* Emerge with Us */}
      <Section 
        title="Emerge with Us"
        subtitle="Partnerships Rooted in Reciprocity"
        description="Partnership with Just Empower was not transactional; it was transformational. To collaborate was to invest in the renewal of culture itself—through aligned initiatives that restored coherence between people, purpose, and planet."
        image="/media/11/Cover-Final-Emblem-1280x960.jpg"
        imageAlt="Emerge with Us"
      />

      {/* Rooted Unity */}
      <Section 
        title="Rooted Unity"
        subtitle="A Movement for the Earth"
        description="Rooted Unity cultivated ecological stewardship and collective renewal through conscious policy, regenerative design, and the principles of living reciprocity. A living bridge between the wild intelligence of nature and the thoughtful evolution of shared systems."
        image="/media/12/IMG_0516-800x1044.jpg"
        imageAlt="Rooted Unity"
        reversed
        dark
      />
    </div>
  );
}
