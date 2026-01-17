import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import NewsletterSignup from '@/components/NewsletterSignup';
import { getMediaUrl } from '@/lib/media';
import { usePageContent } from '@/hooks/usePageContent';
import { EditablePageZone } from '@/components/PageZone';

gsap.registerPlugin(ScrollTrigger);

interface AboutProps {
  slug?: string;
}

export default function About({ slug = 'about' }: AboutProps) {
  const { getContent, getTextStyle, isLoading } = usePageContent(slug);
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Helper to get proper media URL
  const getProperMediaUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : getMediaUrl(url);
  };

  // Get hero content from CMS
  const heroTitle = getContent('hero', 'title');
  const heroSubtitle = getContent('hero', 'subtitle');
  const heroDescription = getContent('hero', 'description');
  const heroVideoUrl = getContent('hero', 'videoUrl');
  const heroImageUrl = getContent('hero', 'imageUrl');
  
  // Determine which media to use for hero (video takes priority)
  const heroMediaUrl = heroVideoUrl || heroImageUrl;
  const isHeroVideo = heroMediaUrl ? /\.(mp4|webm|mov|ogg)$/i.test(heroMediaUrl) : false;

  // Get opening section content from CMS
  const openingParagraph1 = getContent('opening', 'paragraph1');
  const openingParagraph2 = getContent('opening', 'paragraph2');
  const openingParagraph3 = getContent('opening', 'paragraph3');

  // Get truth section content from CMS
  const truthTitle = getContent('truth', 'title');
  const truthDescription = getContent('truth', 'description');

  // Get depth section content from CMS
  const depthTitle = getContent('depth', 'title');
  const depthParagraph1 = getContent('depth', 'paragraph1');
  const depthParagraph2 = getContent('depth', 'paragraph2');
  const depthParagraph3 = getContent('depth', 'paragraph3');
  const depthParagraph4 = getContent('depth', 'paragraph4');
  const depthParagraph5 = getContent('depth', 'paragraph5');

  // Get remembrance section content from CMS
  const remembranceTitle = getContent('remembrance', 'title');
  const remembranceQuote = getContent('remembrance', 'quote');
  const remembranceParagraph1 = getContent('remembrance', 'paragraph1');
  const remembranceParagraph2 = getContent('remembrance', 'paragraph2');
  const remembranceParagraph3 = getContent('remembrance', 'paragraph3');
  const remembranceParagraph4 = getContent('remembrance', 'paragraph4');

  // Get renewal section content from CMS
  const renewalTitle = getContent('renewal', 'title');
  const renewalParagraph1 = getContent('renewal', 'paragraph1');
  const renewalParagraph2 = getContent('renewal', 'paragraph2');

  // Get future section content from CMS
  const futureTitle = getContent('future', 'title');
  const futureParagraph1 = getContent('future', 'paragraph1');
  const futureParagraph2 = getContent('future', 'paragraph2');
  const futureParagraph3 = getContent('future', 'paragraph3');
  const futureParagraph4 = getContent('future', 'paragraph4');

  // Get newsletter section content from CMS
  const newsletterTitle = getContent('newsletter', 'title');
  const newsletterDescription = getContent('newsletter', 'description');

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
              src={getProperMediaUrl(heroMediaUrl)}
              autoPlay
              muted
              loop
              playsInline
              crossOrigin="anonymous"
              preload="auto"
              className="w-full h-full object-cover"
            />
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

        {/* Page Builder Zone: Before Newsletter */}
        <EditablePageZone pageSlug="about" zoneName="before-newsletter" />

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

        {/* Page Builder Zone: Before Footer */}
        <EditablePageZone pageSlug="about" zoneName="before-footer" />
      </div>
    </div>
  );
}
