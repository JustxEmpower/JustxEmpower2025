import { useEffect, useRef } from 'react';
import { Link } from 'wouter';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { usePageContent } from '@/hooks/usePageContent';
import { BookOpen } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function Founder() {
  // Use usePageContent to read from siteContent table (same as Content Editor writes to)
  const { getContent, getSection, isLoading } = usePageContent('founder');
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get all section content from siteContent table - 100% database driven
  const heroSection = getSection('hero');
  const openingSection = getSection('opening');
  const truthSection = getSection('truth');
  const depthSection = getSection('depth');
  const remembranceSection = getSection('remembrance');
  const renewalSection = getSection('renewal');
  const futureSection = getSection('future');
  const newsletterSection = getSection('newsletter');

  // Determine which media to use for hero (video takes priority)
  const heroMediaUrl = heroSection.videoUrl || heroSection.imageUrl || '';
  const isHeroVideo = heroMediaUrl ? /\.(mp4|webm|mov|ogg)$/i.test(heroMediaUrl) : false;

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
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Video Background - 100% database driven */}
      <div ref={heroRef} className="relative h-screen w-full overflow-hidden bg-black rounded-b-[2.5rem]">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-[120%] -top-[10%]">
          <div className="absolute inset-0 bg-black/40 z-10" />
          
          {/* Fallback gradient (always present) */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-neutral-400 to-neutral-600" />
          
          {/* Video Background */}
          {heroMediaUrl && isHeroVideo && (
            <video
              ref={videoRef}
              key={heroMediaUrl}
              src={heroMediaUrl}
              autoPlay
              muted
              loop
              playsInline
              crossOrigin="anonymous"
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          
          {/* Image Background */}
          {heroMediaUrl && !isHeroVideo && (
            <div 
              className="absolute inset-0 w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${heroMediaUrl})` }}
            />
          )}
        </div>

        {/* Hero Content */}
        <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4">
          <div className="about-hero-text">
            <h2 className="font-sans text-white text-xs md:text-sm uppercase tracking-[0.3em] mb-8 md:mb-12 opacity-90">
              {heroSection.subtitle || ''}
            </h2>
            
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white font-light italic tracking-wide leading-[1.1] mb-8">
              {heroSection.title || ''}
            </h1>
            
            <p className="font-sans text-white/90 text-lg md:text-xl font-light tracking-wide max-w-3xl leading-relaxed">
              {heroSection.description || ''}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-24 md:py-32">
        {/* Opening Section - 100% database driven */}
        {(openingSection.paragraph1 || openingSection.paragraph2) && (
          <section className="content-section max-w-4xl mx-auto mb-24">
            {openingSection.paragraph1 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
                {openingSection.paragraph1}
              </p>
            )}
            {openingSection.paragraph2 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
                {openingSection.paragraph2}
              </p>
            )}
            {openingSection.paragraph3 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light">
                {openingSection.paragraph3}
              </p>
            )}
          </section>
        )}

        {/* Just Empower Truth Section - 100% database driven */}
        {(truthSection.title || truthSection.description) && (
          <section className="content-section max-w-4xl mx-auto mb-24 py-16 border-y border-border">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground font-light italic mb-8 text-center">
              {truthSection.title || ''}
            </h2>
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light text-center">
              {truthSection.description || ''}
            </p>
          </section>
        )}

        {/* Depth Beneath Section - 100% database driven */}
        {(depthSection.title || depthSection.paragraph1) && (
          <section className="content-section max-w-4xl mx-auto mb-24">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground font-light mb-12">
              {depthSection.title || ''}
            </h2>
            {depthSection.paragraph1 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
                {depthSection.paragraph1}
              </p>
            )}
            {depthSection.paragraph2 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
                {depthSection.paragraph2}
              </p>
            )}
            {depthSection.paragraph3 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
                {depthSection.paragraph3}
              </p>
            )}
            {depthSection.paragraph4 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
                {depthSection.paragraph4}
              </p>
            )}
            {depthSection.paragraph5 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light">
                {depthSection.paragraph5}
              </p>
            )}
          </section>
        )}

        {/* Thread of Remembrance Section - 100% database driven */}
        {(remembranceSection.title || remembranceSection.quote) && (
          <section className="content-section max-w-4xl mx-auto mb-24">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground font-light mb-12">
              {remembranceSection.title || ''}
            </h2>
            {remembranceSection.quote && (
              <blockquote className="text-xl md:text-2xl text-foreground/90 leading-relaxed font-light italic mb-12 pl-8 border-l-2 border-primary">
                {remembranceSection.quote}
              </blockquote>
            )}
            {remembranceSection.paragraph1 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
                {remembranceSection.paragraph1}
              </p>
            )}
            {remembranceSection.paragraph2 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
                {remembranceSection.paragraph2}
              </p>
            )}
            {remembranceSection.paragraph3 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
                {remembranceSection.paragraph3}
              </p>
            )}
            {remembranceSection.paragraph4 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light">
                {remembranceSection.paragraph4}
              </p>
            )}
          </section>
        )}

        {/* Renewal Section - 100% database driven */}
        {(renewalSection.title || renewalSection.paragraph1) && (
          <section className="content-section max-w-4xl mx-auto mb-24 py-16 border-y border-border">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground font-light italic mb-8 text-center">
              {renewalSection.title || ''}
            </h2>
            {renewalSection.paragraph1 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light text-center mb-8">
                {renewalSection.paragraph1}
              </p>
            )}
            {renewalSection.paragraph2 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light text-center">
                {renewalSection.paragraph2}
              </p>
            )}
          </section>
        )}

        {/* Future Section - 100% database driven */}
        {(futureSection.title || futureSection.paragraph1) && (
          <section className="content-section max-w-4xl mx-auto mb-24">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground font-light mb-12">
              {futureSection.title || ''}
            </h2>
            {futureSection.paragraph1 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
                {futureSection.paragraph1}
              </p>
            )}
            {futureSection.paragraph2 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
                {futureSection.paragraph2}
              </p>
            )}
            {futureSection.paragraph3 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
                {futureSection.paragraph3}
              </p>
            )}
            {futureSection.paragraph4 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light">
                {futureSection.paragraph4}
              </p>
            )}
          </section>
        )}

        {/* Blog CTA - Read She Writes */}
        <section className="content-section max-w-2xl mx-auto">
          <div className="bg-card rounded-3xl p-12 md:p-16 text-center border border-border">
            <h3 className="font-serif text-2xl md:text-3xl text-card-foreground font-light italic mb-6">
              Read She Writes
            </h3>
            <p className="text-base md:text-lg text-card-foreground/70 mb-8 leading-relaxed">
              Reflections shaped by lived experience and embodied truth.<br />
              Offered with intention and care.
            </p>
            <Link href="/blog">
              <Button size="lg" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Begin Reading
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
