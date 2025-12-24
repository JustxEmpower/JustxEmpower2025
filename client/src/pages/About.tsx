import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import NewsletterSignup from '@/components/NewsletterSignup';
import { usePageContent } from '@/hooks/usePageContent';

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const { getContent, getSection, isLoading } = usePageContent('about');
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log("Video autoplay failed:", error);
      });
    }

    const ctx = gsap.context(() => {
      // Fade in hero text
      gsap.from('.about-hero-text', {
        y: 50,
        opacity: 0,
        duration: 1.5,
        ease: 'power3.out',
        delay: 0.3
      });

      // Parallax video
      gsap.to(videoRef.current, {
        yPercent: 20,
        scale: 1.1,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });

      // Fade in content sections
      gsap.utils.toArray('.content-section').forEach((section: any) => {
        gsap.from(section, {
          y: 60,
          opacity: 0,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'top 50%',
            scrub: 1
          }
        });
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Video Background */}
      <div ref={heroRef} className="relative h-screen w-full overflow-hidden bg-black rounded-b-[2.5rem]">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-[120%] -top-[10%]">
          <div className="absolute inset-0 bg-black/40 z-10" />
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={getContent('hero', 'videoUrl', '/media/09/seeds-of-power.mp4')} type="video/mp4" />
          </video>
        </div>

        {/* Hero Content */}
        <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4">
          <div className="about-hero-text">
            <h2 className="font-sans text-white text-xs md:text-sm uppercase tracking-[0.3em] mb-8 md:mb-12 opacity-90">
              {getContent('hero', 'subtitle', 'April Gambardella')}
            </h2>
            
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white font-light italic tracking-wide leading-[1.1] mb-8">
              {getContent('hero', 'title', 'The Founder')}
            </h1>
            
            <p className="font-sans text-white/90 text-lg md:text-xl font-light tracking-wide max-w-3xl leading-relaxed">
              {getContent('hero', 'description', 'Steward of Embodied Change & Energetic Coherence')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-24 md:py-32">
        {/* Opening Section */}
        <section className="content-section max-w-4xl mx-auto mb-24">
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            From the moment my eyes opened to this world, I have been drawn to truth—not from a need to know, but from a need to understand. This inclination was nurtured by my mother, who taught me that true stewardship means leaving everything better than we found it: a space, a system, or the Earth itself.
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            That ethos of restoration and responsibility became the ground of my devotion. Over time, it expanded beyond personal integrity into a greater mission: empowering visionaries, reimagining inherited systems, and contributing to planetary regeneration.
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light">
            Just as we are responsible for the spaces we inhabit, we are stewards of the Earth, entrusted with its vitality.
          </p>
        </section>

        {/* Just Empower Truth Section */}
        <section className="content-section max-w-4xl mx-auto mb-24 py-16 border-y border-border">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground font-light italic mb-8 text-center">
            Just Empower is Built on This Truth
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light text-center">
            Real change is both individual and collective—an energetic imprint that reverberates through humanity and the living world alike.
          </p>
        </section>

        {/* Depth Beneath Section */}
        <section className="content-section max-w-4xl mx-auto mb-24">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground font-light mb-12">
            The Depth Beneath the Framework
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            Though my roots first took hold in Southern California, I have since grounded in the vibrant soils of Austin, Texas, a sanctuary that attuned my rhythm, mirrored my reinvention, and revealed the sacred nature of emergence.
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            My understanding of trauma, healing, and transformation is not theoretical; it was forged through lived experience.
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            With a degree in Communication Studies and a background in law, I came to know the mechanics of language, perception, and influence. Ongoing studies in consciousness, energy dynamics, and systemic change offered the scaffolding, but it was the descent itself that transmuted knowledge into truth.
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            I was not taught—I was tempered. Not by intellect, but by initiation.
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light">
            The truths I carry were etched into the language of my body as knowing. What emerged now lives within our offerings and through the field of Just Empower.
          </p>
        </section>

        {/* Thread of Remembrance Section */}
        <section className="content-section max-w-4xl mx-auto mb-24">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground font-light mb-12">
            The Thread of Remembrance
          </h2>
          <blockquote className="text-xl md:text-2xl text-foreground/90 leading-relaxed font-light italic mb-12 pl-8 border-l-2 border-primary">
            There is a beauty only those who've crossed the underworld can name—a beauty born from witnessing the fragility of the human spirit... and the brilliance of its capacity to rebuild, rewire, and rise.
          </blockquote>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            My work emerged through direct immersion in the complexity of this human experience. I have known despair, but more importantly, I understand what it reveals: The intricacies of trauma. The intelligence of the body. The language of energy. The architecture of reality itself.
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            What remains is not conceptual; it is cellular. It moves like memory through the body—quiet, rhythmic, alive—restoring what was scattered into harmony once more.
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            I have known the devastation life can impose on the spirit—but I have also witnessed the extraordinary beauty of existence, and the indomitable power of the human soul.
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light">
            I live by this truth: Until we break from the systems that shaped our suffering—the wounds inflicted, the identities imposed, the weight that was never ours to carry—we cannot reclaim our sovereign power.
          </p>
        </section>

        {/* Renewal Section */}
        <section className="content-section max-w-4xl mx-auto mb-24 py-16 border-y border-border">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground font-light italic mb-8 text-center">
            Just Empower is That Renewal
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light text-center mb-8">
            It is not simply about healing. It is a return—to memory, to frequency, to the feminine blueprint reactivated from within.
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light text-center">
            Not the version that adapted to survive, but the one that creates, remembers, and leads.
          </p>
        </section>

        {/* Future Section */}
        <section className="content-section max-w-4xl mx-auto mb-24">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground font-light mb-12">
            Just Empower: The Future is Ours to Shape
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            The future isn't something we wait for; it's something we restore and embody.
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            Just Empower is a catalytic framework where personal evolution becomes the foundation for collective change.
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            It's for those who refuse stagnation—who know that reality isn't inherited, but rewritten.
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light">
            This is crossing through time. A sacred reclamation. A restoration, for ourselves, for every woman who came before, and every daughter yet to rise.
          </p>
        </section>

        {/* Newsletter CTA */}
        <section className="content-section max-w-2xl mx-auto">
          <div className="bg-card rounded-3xl p-12 md:p-16 text-center border border-border">
            <h3 className="font-serif text-2xl md:text-3xl text-card-foreground font-light italic mb-6">
              Stay Connected
            </h3>
            <p className="text-base md:text-lg text-card-foreground/70 mb-8 leading-relaxed">
              Join our monthly mailing list for insights on embodied transformation and conscious leadership.
            </p>
            <NewsletterSignup variant="inline" />
          </div>
        </section>
      </div>
    </div>
  );
}
