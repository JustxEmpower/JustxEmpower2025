import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import NewsletterSignup from '@/components/NewsletterSignup';
import { getMediaUrl } from '@/lib/media';
import { usePageContent } from '@/hooks/usePageContent';

gsap.registerPlugin(ScrollTrigger);

export default function Founder() {
  // Query 'founder' content from CMS database
  const { getContent, isLoading } = usePageContent('founder');
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Helper to get proper media URL
  const getProperMediaUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : getMediaUrl(url);
  };

  // Get hero content from CMS
  const heroTitle = getContent('hero', 'title', 'The Founder');
  const heroSubtitle = getContent('hero', 'subtitle', 'APRIL GAMBARDELLA');
  const heroDescription = getContent('hero', 'description', 'Steward of Embodied Change & Energetic Coherence');
  const heroVideoUrl = getContent('hero', 'videoUrl');
  const heroImageUrl = getContent('hero', 'imageUrl');
  
  // Determine which media to use for hero (video takes priority)
  const heroMediaUrl = heroVideoUrl || heroImageUrl;
  const isHeroVideo = heroMediaUrl ? /\.(mp4|webm|mov|ogg)$/i.test(heroMediaUrl) : false;

  // Get biography section content from CMS
  const biographyTitle = getContent('biography', 'title', 'Biography');
  const biographyParagraph1 = getContent('biography', 'paragraph1');
  const biographyParagraph2 = getContent('biography', 'paragraph2');
  const biographyParagraph3 = getContent('biography', 'paragraph3');

  // Get journey section content from CMS
  const journeyTitle = getContent('journey', 'title', 'The Journey');
  const journeyParagraph1 = getContent('journey', 'paragraph1');
  const journeyParagraph2 = getContent('journey', 'paragraph2');
  const journeyParagraph3 = getContent('journey', 'paragraph3');

  // Get personal quote section from CMS
  const quoteText = getContent('quote', 'text');
  const quoteAuthor = getContent('quote', 'author', 'April Gambardella');

  // Get social links from CMS
  const socialInstagram = getContent('social', 'instagram');
  const socialLinkedIn = getContent('social', 'linkedin');
  const socialTwitter = getContent('social', 'twitter');

  // Get newsletter section content from CMS
  const newsletterTitle = getContent('newsletter', 'title', 'Stay Connected');
  const newsletterDescription = getContent('newsletter', 'description', 'Join our community for updates on workshops, events, and new offerings.');

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log("Video autoplay failed:", error);
      });
    }

    const ctx = gsap.context(() => {
      // Fade in hero text
      gsap.from('.founder-hero-text', {
        y: 50,
        opacity: 0,
        duration: 1.5,
        ease: 'power3.out',
        delay: 0.3
      });

      // Parallax video/image
      if (heroRef.current) {
        gsap.to(videoRef.current || heroRef.current.querySelector('.hero-bg'), {
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
      }

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
      {/* Hero Section with Video/Image Background */}
      <div ref={heroRef} className="relative h-screen w-full overflow-hidden bg-black rounded-b-[2.5rem]">
        {/* Video/Image Background */}
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
              className="hero-bg w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${getProperMediaUrl(heroMediaUrl)})` }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-400 to-neutral-600" />
          )}
        </div>

        {/* Hero Content */}
        <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4">
          <div className="founder-hero-text">
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
        {/* Biography Section */}
        {(biographyParagraph1 || biographyParagraph2 || biographyParagraph3) && (
          <section className="content-section max-w-4xl mx-auto mb-24">
            {biographyTitle && (
              <h2 className="font-serif text-3xl md:text-4xl text-foreground font-light mb-12">
                {biographyTitle}
              </h2>
            )}
            {biographyParagraph1 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
                {biographyParagraph1}
              </p>
            )}
            {biographyParagraph2 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
                {biographyParagraph2}
              </p>
            )}
            {biographyParagraph3 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light">
                {biographyParagraph3}
              </p>
            )}
          </section>
        )}

        {/* Personal Quote Section */}
        {quoteText && (
          <section className="content-section max-w-4xl mx-auto mb-24 py-16 border-y border-border">
            <blockquote className="text-xl md:text-2xl text-foreground/90 leading-relaxed font-light italic text-center">
              "{quoteText}"
            </blockquote>
            {quoteAuthor && (
              <p className="text-center mt-6 text-foreground/60 font-sans uppercase tracking-wider text-sm">
                — {quoteAuthor}
              </p>
            )}
          </section>
        )}

        {/* Journey Section */}
        {(journeyParagraph1 || journeyParagraph2 || journeyParagraph3) && (
          <section className="content-section max-w-4xl mx-auto mb-24">
            {journeyTitle && (
              <h2 className="font-serif text-3xl md:text-4xl text-foreground font-light mb-12">
                {journeyTitle}
              </h2>
            )}
            {journeyParagraph1 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
                {journeyParagraph1}
              </p>
            )}
            {journeyParagraph2 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light mb-8">
                {journeyParagraph2}
              </p>
            )}
            {journeyParagraph3 && (
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light">
                {journeyParagraph3}
              </p>
            )}
          </section>
        )}

        {/* Social Links Section */}
        {(socialInstagram || socialLinkedIn || socialTwitter) && (
          <section className="content-section max-w-4xl mx-auto mb-24 text-center">
            <h3 className="font-serif text-2xl text-foreground font-light mb-8">Connect</h3>
            <div className="flex justify-center gap-8">
              {socialInstagram && (
                <a 
                  href={socialInstagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-foreground/60 hover:text-foreground transition-colors"
                >
                  Instagram
                </a>
              )}
              {socialLinkedIn && (
                <a 
                  href={socialLinkedIn} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-foreground/60 hover:text-foreground transition-colors"
                >
                  LinkedIn
                </a>
              )}
              {socialTwitter && (
                <a 
                  href={socialTwitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-foreground/60 hover:text-foreground transition-colors"
                >
                  Twitter
                </a>
              )}
            </div>
          </section>
        )}

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
