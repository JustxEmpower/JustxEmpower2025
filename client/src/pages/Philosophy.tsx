import { useEffect } from 'react';
import Section from '@/components/Section';
import { useLocation } from 'wouter';

export default function Philosophy() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[60vh] w-full overflow-hidden rounded-b-[2.5rem]">
        <div className="absolute inset-0 bg-black/30 z-10" />
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/media/09/emerge-with-us.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="font-serif text-5xl md:text-7xl font-light tracking-wide italic mb-6">
            Our Philosophy
          </h1>
          <p className="font-sans text-sm md:text-base tracking-[0.2em] uppercase opacity-90">
            Embodiment Over Intellectualization
          </p>
        </div>
      </div>

      {/* Core Principles */}
      <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="font-serif text-4xl italic mb-8 text-foreground">Foundational Principles</h2>
            <div className="space-y-12">
              <div>
                <h3 className="font-sans text-sm tracking-widest uppercase mb-3 text-muted-foreground">01. Embodiment</h3>
                <p className="text-lg leading-relaxed">Truth begins where intellect ends—within the lived intelligence of the body and breath. Transformation moves from concept into experience, as the nervous system becomes the gateway to sovereignty.</p>
              </div>
              <div>
                <h3 className="font-sans text-sm tracking-widest uppercase mb-3 text-muted-foreground">02. Wholeness</h3>
                <p className="text-lg leading-relaxed">Wholeness is not something to achieve or restore—it is something to reclaim. The work is not about fixing what is broken, but remembering what endures: clarity, sovereignty, embodied truth.</p>
              </div>
              <div>
                <h3 className="font-sans text-sm tracking-widest uppercase mb-3 text-muted-foreground">03. Nature's Intelligence</h3>
                <p className="text-lg leading-relaxed">Rather than replicating outdated systems, Just Empower roots its work in nature's original intelligence—adaptive, regenerative, and quietly revolutionary.</p>
              </div>
            </div>
          </div>
          <div className="sticky top-32">
            <img 
              src="/media/12/IMG_0516-800x1044.jpg" 
              alt="Nature philosophy" 
              className="w-full h-[80vh] object-cover rounded-[1.5rem]"
            />
          </div>
        </div>
      </div>

      {/* Three Pillars */}
      <Section 
        title="The Three Pillars"
        subtitle="Integrated Transformation"
        description="Just Empower's mission is realized through three integrated pillars: Personal Empowerment, Community & Cultural Initiatives, and Systemic Regeneration. Together, these pillars foster measurable transformation across individual, relational, and cultural levels."
        image="/media/11/Cover-Final-Emblem-V1-1024x731.png"
        imageAlt="Three Pillars Symbol"
        dark
      />
    </div>
  );
}
