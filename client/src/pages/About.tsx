import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import NewsletterSignup from '@/components/NewsletterSignup';
import { getMediaUrl } from '@/lib/media';
import { usePageContent } from '@/hooks/usePageContent';
import { EditablePageZone } from '@/components/PageZone';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

interface AboutProps {
  slug?: string;
}

export default function About({ slug = 'about' }: AboutProps) {
  const { getContent, getTextStyle, getInlineStyles, isLoading } = usePageContent(slug);
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
            <h2 className={cn("text-xs md:text-sm uppercase tracking-[0.3em] mb-8 md:mb-12 opacity-90", getTextStyle('hero', 'subtitle')?.fontOverride ? '' : 'font-sans', getTextStyle('hero', 'subtitle')?.fontColor ? '' : 'text-white')} style={getInlineStyles('hero', 'subtitle')}>
              {heroSubtitle}
            </h2>
            
            <h1 className={cn("text-5xl md:text-7xl lg:text-8xl font-light italic tracking-wide leading-[1.1] mb-8", getTextStyle('hero', 'title')?.fontOverride ? '' : 'font-serif', getTextStyle('hero', 'title')?.fontColor ? '' : 'text-white')} style={getInlineStyles('hero', 'title')}>
              {heroTitle}
            </h1>
            
            <p className={cn("text-lg md:text-xl font-light tracking-wide max-w-3xl leading-relaxed", getTextStyle('hero', 'description')?.fontOverride ? '' : 'font-sans', getTextStyle('hero', 'description')?.fontColor ? '' : 'text-white/90')} style={getInlineStyles('hero', 'description')}>
              {heroDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Page Builder Zone: After Hero */}
      <EditablePageZone pageSlug="about" zoneName="after-hero" />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-24 md:py-32">
        {/* Opening Section */}
        <section className="content-section max-w-4xl mx-auto mb-24">
          <p className={cn("text-lg md:text-xl leading-relaxed font-light mb-8", getTextStyle('opening', 'paragraph1')?.fontColor ? '' : 'text-foreground/80')} style={getInlineStyles('opening', 'paragraph1')}>
            {openingParagraph1}
          </p>
          <p className={cn("text-lg md:text-xl leading-relaxed font-light mb-8", getTextStyle('opening', 'paragraph2')?.fontColor ? '' : 'text-foreground/80')} style={getInlineStyles('opening', 'paragraph2')}>
            {openingParagraph2}
          </p>
          <p className={cn("text-lg md:text-xl leading-relaxed font-light", getTextStyle('opening', 'paragraph3')?.fontColor ? '' : 'text-foreground/80')} style={getInlineStyles('opening', 'paragraph3')}>
            {openingParagraph3}
          </p>
        </section>

        {/* Page Builder Zone: After Opening */}
        <EditablePageZone pageSlug="about" zoneName="after-opening" />

        {/* Just Empower Truth Section */}
        <section className="content-section max-w-4xl mx-auto mb-24 py-16 border-y border-border">
          <h2 className={cn("text-3xl md:text-4xl font-light italic mb-8 text-center", getTextStyle('truth', 'title')?.fontOverride ? '' : 'font-serif', getTextStyle('truth', 'title')?.fontColor ? '' : 'text-foreground')} style={getInlineStyles('truth', 'title')}>
            {truthTitle}
          </h2>
          <p className={cn("text-lg md:text-xl leading-relaxed font-light text-center", getTextStyle('truth', 'description')?.fontColor ? '' : 'text-foreground/80')} style={getInlineStyles('truth', 'description')}>
            {truthDescription}
          </p>
        </section>

        {/* Page Builder Zone: After Truth */}
        <EditablePageZone pageSlug="about" zoneName="after-truth" />

        {/* Depth Beneath Section */}
        <section className="content-section max-w-4xl mx-auto mb-24">
          <h2 className={cn("text-3xl md:text-4xl font-light mb-12", getTextStyle('depth', 'title')?.fontOverride ? '' : 'font-serif', getTextStyle('depth', 'title')?.fontColor ? '' : 'text-foreground')} style={getInlineStyles('depth', 'title')}>
            {depthTitle}
          </h2>
          <p className={cn("text-lg md:text-xl leading-relaxed font-light mb-8", getTextStyle('depth', 'paragraph1')?.fontColor ? '' : 'text-foreground/80')} style={getInlineStyles('depth', 'paragraph1')}>
            {depthParagraph1}
          </p>
          <p className={cn("text-lg md:text-xl leading-relaxed font-light mb-8", getTextStyle('depth', 'paragraph2')?.fontColor ? '' : 'text-foreground/80')} style={getInlineStyles('depth', 'paragraph2')}>
            {depthParagraph2}
          </p>
          <p className={cn("text-lg md:text-xl leading-relaxed font-light mb-8", getTextStyle('depth', 'paragraph3')?.fontColor ? '' : 'text-foreground/80')} style={getInlineStyles('depth', 'paragraph3')}>
            {depthParagraph3}
          </p>
          <p className={cn("text-lg md:text-xl leading-relaxed font-light mb-8", getTextStyle('depth', 'paragraph4')?.fontColor ? '' : 'text-foreground/80')} style={getInlineStyles('depth', 'paragraph4')}>
            {depthParagraph4}
          </p>
          <p className={cn("text-lg md:text-xl leading-relaxed font-light", getTextStyle('depth', 'paragraph5')?.fontColor ? '' : 'text-foreground/80')} style={getInlineStyles('depth', 'paragraph5')}>
            {depthParagraph5}
          </p>
        </section>

        {/* Page Builder Zone: After Depth */}
        <EditablePageZone pageSlug="about" zoneName="after-depth" />

        {/* Thread of Remembrance Section */}
        <section className="content-section max-w-4xl mx-auto mb-24">
          <h2 className={cn("text-3xl md:text-4xl font-light mb-12", getTextStyle('remembrance', 'title')?.fontOverride ? '' : 'font-serif', getTextStyle('remembrance', 'title')?.fontColor ? '' : 'text-foreground')} style={getInlineStyles('remembrance', 'title')}>
            {remembranceTitle}
          </h2>
          <blockquote className={cn("text-xl md:text-2xl leading-relaxed font-light italic mb-12 pl-8 border-l-2 border-primary", getTextStyle('remembrance', 'quote')?.fontColor ? '' : 'text-foreground/90')} style={getInlineStyles('remembrance', 'quote')}>
            {remembranceQuote}
          </blockquote>
          <p className={cn("text-lg md:text-xl leading-relaxed font-light mb-8", getTextStyle('remembrance', 'paragraph1')?.fontColor ? '' : 'text-foreground/80')} style={getInlineStyles('remembrance', 'paragraph1')}>
            {remembranceParagraph1}
          </p>
          <p className={cn("text-lg md:text-xl leading-relaxed font-light mb-8", getTextStyle('remembrance', 'paragraph2')?.fontColor ? '' : 'text-foreground/80')} style={getInlineStyles('remembrance', 'paragraph2')}>
            {remembranceParagraph2}
          </p>
          <p className={cn("text-lg md:text-xl leading-relaxed font-light mb-8", getTextStyle('remembrance', 'paragraph3')?.fontColor ? '' : 'text-foreground/80')} style={getInlineStyles('remembrance', 'paragraph3')}>
            {remembranceParagraph3}
          </p>
          <p className={cn("text-lg md:text-xl leading-relaxed font-light", getTextStyle('remembrance', 'paragraph4')?.fontColor ? '' : 'text-foreground/80')} style={getInlineStyles('remembrance', 'paragraph4')}>
            {remembranceParagraph4}
          </p>
        </section>

        {/* Page Builder Zone: After Remembrance */}
        <EditablePageZone pageSlug="about" zoneName="after-remembrance" />

        {/* Renewal Section */}
        <section className="content-section max-w-4xl mx-auto mb-24 py-16 border-y border-border">
          <h2 className={cn("text-3xl md:text-4xl font-light italic mb-8 text-center", getTextStyle('renewal', 'title')?.fontOverride ? '' : 'font-serif', getTextStyle('renewal', 'title')?.fontColor ? '' : 'text-foreground')} style={getInlineStyles('renewal', 'title')}>
            {renewalTitle}
          </h2>
          <p className={cn("text-lg md:text-xl leading-relaxed font-light text-center mb-8", getTextStyle('renewal', 'paragraph1')?.fontColor ? '' : 'text-foreground/80')} style={getInlineStyles('renewal', 'paragraph1')}>
            {renewalParagraph1}
          </p>
          <p className={cn("text-lg md:text-xl leading-relaxed font-light text-center", getTextStyle('renewal', 'paragraph2')?.fontColor ? '' : 'text-foreground/80')} style={getInlineStyles('renewal', 'paragraph2')}>
            {renewalParagraph2}
          </p>
        </section>

        {/* Page Builder Zone: After Renewal */}
        <EditablePageZone pageSlug="about" zoneName="after-renewal" />

        {/* Future Section */}
        <section className="content-section max-w-4xl mx-auto mb-24">
          <h2 className={cn("text-3xl md:text-4xl font-light mb-12", getTextStyle('future', 'title')?.fontOverride ? '' : 'font-serif', getTextStyle('future', 'title')?.fontColor ? '' : 'text-foreground')} style={getInlineStyles('future', 'title')}>
            {futureTitle}
          </h2>
          <p className={cn("text-lg md:text-xl leading-relaxed font-light mb-8", getTextStyle('future', 'paragraph1')?.fontColor ? '' : 'text-foreground/80')} style={getInlineStyles('future', 'paragraph1')}>
            {futureParagraph1}
          </p>
          <p className={cn("text-lg md:text-xl leading-relaxed font-light mb-8", getTextStyle('future', 'paragraph2')?.fontColor ? '' : 'text-foreground/80')} style={getInlineStyles('future', 'paragraph2')}>
            {futureParagraph2}
          </p>
          <p className={cn("text-lg md:text-xl leading-relaxed font-light mb-8", getTextStyle('future', 'paragraph3')?.fontColor ? '' : 'text-foreground/80')} style={getInlineStyles('future', 'paragraph3')}>
            {futureParagraph3}
          </p>
          <p className={cn("text-lg md:text-xl leading-relaxed font-light", getTextStyle('future', 'paragraph4')?.fontColor ? '' : 'text-foreground/80')} style={getInlineStyles('future', 'paragraph4')}>
            {futureParagraph4}
          </p>
        </section>

        {/* Page Builder Zone: After Future */}
        <EditablePageZone pageSlug="about" zoneName="after-future" />

        {/* Page Builder Zone: Before Newsletter */}
        <EditablePageZone pageSlug="about" zoneName="before-newsletter" />

        {/* Newsletter CTA */}
        <section className="content-section max-w-2xl mx-auto">
          <div className="bg-card rounded-3xl p-12 md:p-16 text-center border border-border">
            <h3 className={cn("text-2xl md:text-3xl font-light italic mb-6", getTextStyle('newsletter', 'title')?.fontOverride ? '' : 'font-serif', getTextStyle('newsletter', 'title')?.fontColor ? '' : 'text-card-foreground')} style={getInlineStyles('newsletter', 'title')}>
              {newsletterTitle}
            </h3>
            <p className={cn("text-base md:text-lg mb-8 leading-relaxed", getTextStyle('newsletter', 'description')?.fontColor ? '' : 'text-card-foreground/70')} style={getInlineStyles('newsletter', 'description')}>
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
