import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import NewsletterSignup from '@/components/NewsletterSignup';
import { getMediaUrl } from '@/lib/media';
import { usePageContent } from '@/hooks/usePageContent';

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const { getContent, isLoading } = usePageContent('about');
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Helper to get proper media URL
  const getProperMediaUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : getMediaUrl(url);
  };

  // Get hero content from CMS
  const heroTitle = getContent('hero', 'title') || 'The Founder';
  const heroSubtitle = getContent('hero', 'subtitle') || 'April Gambardella';
  const heroDescription = getContent('hero', 'description') || 'Steward of Embodied Change & Energetic Coherence';
  const heroVideoUrl = getContent('hero', 'videoUrl') || '';
  const heroImageUrl = getContent('hero', 'imageUrl') || '';
  
  // Determine which media to use for hero (video takes priority)
  const heroMediaUrl = heroVideoUrl || heroImageUrl;
  const isHeroVideo = heroMediaUrl ? /\.(mp4|webm|mov|ogg)$/i.test(heroMediaUrl) : false;

  // Get opening section content from CMS
  const openingParagraph1 = getContent('opening', 'paragraph1') || 'From the moment my eyes opened to this world, I have been drawn to truth—not from a need to know, but from a need to understand. This inclination was nurtured by my mother, who taught me that true stewardship means leaving everything better than we found it: a space, a system, or the Earth itself.';
  const openingParagraph2 = getContent('opening', 'paragraph2') || 'That ethos of restoration and responsibility became the ground of my devotion. Over time, it expanded beyond personal integrity into a greater mission: empowering visionaries, reimagining inherited systems, and contributing to planetary regeneration.';
  const openingParagraph3 = getContent('opening', 'paragraph3') || 'Just as we are responsible for the spaces we inhabit, we are stewards of the Earth, entrusted with its vitality.';

  // Get truth section content from CMS
  const truthTitle = getContent('truth', 'title') || 'Just Empower is Built on This Truth';
  const truthDescription = getContent('truth', 'description') || 'Real change is both individual and collective—an energetic imprint that reverberates through humanity and the living world alike.';

  // Get depth section content from CMS
  const depthTitle = getContent('depth', 'title') || 'The Depth Beneath the Framework';
  const depthParagraph1 = getContent('depth', 'paragraph1') || 'Though my roots first took hold in Southern California, I have since grounded in the vibrant soils of Austin, Texas, a sanctuary that attuned my rhythm, mirrored my reinvention, and revealed the sacred nature of emergence.';
  const depthParagraph2 = getContent('depth', 'paragraph2') || 'My understanding of trauma, healing, and transformation is not theoretical; it was forged through lived experience.';
  const depthParagraph3 = getContent('depth', 'paragraph3') || 'With a degree in Communication Studies and a background in law, I came to know the mechanics of language, perception, and influence. Ongoing studies in consciousness, energy dynamics, and systemic change offered the scaffolding, but it was the descent itself that transmuted knowledge into truth.';
  const depthParagraph4 = getContent('depth', 'paragraph4') || 'I was not taught—I was tempered. Not by intellect, but by initiation.';
  const depthParagraph5 = getContent('depth', 'paragraph5') || 'The truths I carry were etched into the language of my body as knowing. What emerged now lives within our offerings and through the field of Just Empower.';

  // Get remembrance section content from CMS
  const remembranceTitle = getContent('remembrance', 'title') || 'The Thread of Remembrance';
  const remembranceQuote = getContent('remembrance', 'quote') || "There is a beauty only those who've crossed the underworld can name—a beauty born from witnessing the fragility of the human spirit... and the brilliance of its capacity to rebuild, rewire, and rise.";
  const remembranceParagraph1 = getContent('remembrance', 'paragraph1') || 'My work emerged through direct immersion in the complexity of this human experience. I have known despair, but more importantly, I understand what it reveals: The intricacies of trauma. The intelligence of the body. The language of energy. The architecture of reality itself.';
  const remembranceParagraph2 = getContent('remembrance', 'paragraph2') || 'What remains is not conceptual; it is cellular. It moves like memory through the body—quiet, rhythmic, alive—restoring what was scattered into harmony once more.';
  const remembranceParagraph3 = getContent('remembrance', 'paragraph3') || 'I have known the devastation life can impose on the spirit—but I have also witnessed the extraordinary beauty of existence, and the indomitable power of the human soul.';
  const remembranceParagraph4 = getContent('remembrance', 'paragraph4') || 'I live by this truth: Until we break from the systems that shaped our suffering—the wounds inflicted, the identities imposed, the weight that was never ours to carry—we cannot reclaim our sovereign power.';

  // Get renewal section content from CMS
  const renewalTitle = getContent('renewal', 'title') || 'Just Empower is That Renewal';
  const renewalParagraph1 = getContent('renewal', 'paragraph1') || 'It is not simply about healing. It is a return—to memory, to frequency, to the feminine blueprint reactivated from within.';
  const renewalParagraph2 = getContent('renewal', 'paragraph2') || 'Not the version that adapted to survive, but the one that creates, remembers, and leads.';

  // Get future section content from CMS
  const futureTitle = getContent('future', 'title') || 'Just Empower: The Future is Ours to Shape';
  const futureParagraph1 = getContent('future', 'paragraph1') || "The future isn't something we wait for; it's something we restore and embody.";
  const futureParagraph2 = getContent('future', 'paragraph2') || 'Just Empower is a catalytic framework where personal evolution becomes the foundation for collective change.';
  const futureParagraph3 = getContent('future', 'paragraph3') || "It's for those who refuse stagnation—who know that reality isn't inherited, but rewritten.";
  const futureParagraph4 = getContent('future', 'paragraph4') || 'This is crossing through time. A sacred reclamation. A restoration, for ourselves, for every woman who came before, and every daughter yet to rise.';

  // Get newsletter section content from CMS
  const newsletterTitle = getContent('newsletter', 'title') || 'Stay Connected';
  const newsletterDescription = getContent('newsletter', 'description') || 'Join our monthly mailing list for insights on embodied transformation and conscious leadership.';

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Video Background */}
      <div ref={heroRef} className="relative h-screen w-full overflow-hidden bg-black rounded-b-[2.5rem]">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-[120%] -top-[10%]">
          <div className="absolute inset-0 bg-black/40 z-10" />
          
          {/* Video or Image Background */}
          {heroMediaUrl && isHeroVideo ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            >
              <source 
                src={getProperMediaUrl(heroMediaUrl)} 
                type={heroMediaUrl.endsWith('.webm') ? 'video/webm' : 'video/mp4'} 
              />
            </video>
          ) : heroMediaUrl ? (
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${getProperMediaUrl(heroMediaUrl)})` }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-400 to-neutral-600" />
          )}
        </div>

        {/* Hero Content */}
        <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4">
          <div className="about-hero-text">
            <h2 className="font-sans text-white text-xs md:text-sm uppercase tracking-[0.3em] mb-8 md:mb-12 opacity-90">
              {heroSubtitle}
            </h2>
            
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white font-light italic tracking-wide leading-[1.1] mb-8">
              {heroTitle}
            </h1>
            
            <p className="font-sans text-white/90 text-lg md:text-xl font-light tracking-wide max-w-3xl leading-relaxed">
              {heroDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-24 md:py-32">
        {/* Opening Section */}
        <section className="content-section max-w-4xl mx-auto mb-24">
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            {openingParagraph1}
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            {openingParagraph2}
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light">
            {openingParagraph3}
          </p>
        </section>

        {/* Just Empower Truth Section */}
        <section className="content-section max-w-4xl mx-auto mb-24 py-16 border-y border-border">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground font-light italic mb-8 text-center">
            {truthTitle}
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light text-center">
            {truthDescription}
          </p>
        </section>

        {/* Depth Beneath Section */}
        <section className="content-section max-w-4xl mx-auto mb-24">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground font-light mb-12">
            {depthTitle}
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            {depthParagraph1}
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            {depthParagraph2}
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            {depthParagraph3}
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            {depthParagraph4}
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light">
            {depthParagraph5}
          </p>
        </section>

        {/* Thread of Remembrance Section */}
        <section className="content-section max-w-4xl mx-auto mb-24">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground font-light mb-12">
            {remembranceTitle}
          </h2>
          <blockquote className="text-xl md:text-2xl text-foreground/90 leading-relaxed font-light italic mb-12 pl-8 border-l-2 border-primary">
            {remembranceQuote}
          </blockquote>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            {remembranceParagraph1}
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            {remembranceParagraph2}
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            {remembranceParagraph3}
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light">
            {remembranceParagraph4}
          </p>
        </section>

        {/* Renewal Section */}
        <section className="content-section max-w-4xl mx-auto mb-24 py-16 border-y border-border">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground font-light italic mb-8 text-center">
            {renewalTitle}
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light text-center mb-8">
            {renewalParagraph1}
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light text-center">
            {renewalParagraph2}
          </p>
        </section>

        {/* Future Section */}
        <section className="content-section max-w-4xl mx-auto mb-24">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground font-light mb-12">
            {futureTitle}
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            {futureParagraph1}
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            {futureParagraph2}
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
            {futureParagraph3}
          </p>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light">
            {futureParagraph4}
          </p>
        </section>

        {/* Newsletter CTA */}
        <section className="content-section max-w-2xl mx-auto">
          <div className="bg-card rounded-3xl p-12 md:p-16 text-center border border-border">
            <h3 className="font-serif text-2xl md:text-3xl text-card-foreground font-light italic mb-6">
              {newsletterTitle}
            </h3>
            <p className="text-base md:text-lg text-card-foreground/70 mb-8 leading-relaxed">
              {newsletterDescription}
            </p>
            <NewsletterSignup variant="inline" />
          </div>
        </section>
      </div>
    </div>
  );
}
