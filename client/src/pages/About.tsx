import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import NewsletterSignup from '@/components/NewsletterSignup';
import { getMediaUrl } from '@/lib/media';
import { usePageSectionContent, PAGE_IDS } from '@/hooks/usePageSectionContent';

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const { getSection, getField, isLoading } = usePageSectionContent('about');

  // Add 'about' to PAGE_IDS if not already there
  // PAGE_IDS.about = 60013;
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Helper to get proper media URL
  const getProperMediaUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : getMediaUrl(url);
  };

  // Get hero content from CMS
  const heroContent = getSection('hero');
  const heroTitle = heroContent.title || 'About Just Empower';
  const heroSubtitle = heroContent.subtitle || 'Our Story';
  const heroDescription = heroContent.description || '';
  const heroVideoUrl = heroContent.videoUrl || '';
  const heroImageUrl = heroContent.imageUrl || '';
  
  // Determine which media to use for hero (video takes priority)
  const heroMediaUrl = heroVideoUrl || heroImageUrl;
  const isHeroVideo = heroMediaUrl ? /\.(mp4|webm|mov|ogg)$/i.test(heroMediaUrl) : false;

  // Get content section from CMS
  const contentSection = getSection('content');
  const openingParagraph1 = contentSection.paragraph1 || contentSection.description || '';
  const openingParagraph2 = contentSection.paragraph2 || '';
  const openingParagraph3 = contentSection.paragraph3 || '';

  // Get truth section content from CMS
  const truthSection = getSection('truth');
  const truthTitle = truthSection.title || contentSection.title || 'Our Mission';
  const truthDescription = truthSection.description || '';

  // Get depth section content from CMS
  const depthSection = getSection('depth');
  const depthTitle = depthSection.title || '';
  const depthParagraph1 = depthSection.paragraph1 || '';
  const depthParagraph2 = depthSection.paragraph2 || '';
  const depthParagraph3 = depthSection.paragraph3 || '';
  const depthParagraph4 = depthSection.paragraph4 || '';
  const depthParagraph5 = depthSection.paragraph5 || '';

  // Get remembrance section content from CMS
  const remembranceSection = getSection('remembrance');
  const remembranceTitle = remembranceSection.title || '';
  const remembranceQuote = remembranceSection.quote || '';
  const remembranceParagraph1 = remembranceSection.paragraph1 || '';
  const remembranceParagraph2 = remembranceSection.paragraph2 || '';
  const remembranceParagraph3 = remembranceSection.paragraph3 || '';
  const remembranceParagraph4 = remembranceSection.paragraph4 || '';

  // Get renewal section content from CMS
  const renewalSection = getSection('renewal');
  const renewalTitle = renewalSection.title || '';
  const renewalParagraph1 = renewalSection.paragraph1 || '';
  const renewalParagraph2 = renewalSection.paragraph2 || '';

  // Get future section content from CMS
  const futureSection = getSection('future');
  const futureTitle = futureSection.title || '';
  const futureParagraph1 = futureSection.paragraph1 || '';
  const futureParagraph2 = futureSection.paragraph2 || '';
  const futureParagraph3 = futureSection.paragraph3 || '';
  const futureParagraph4 = futureSection.paragraph4 || '';

  // Get newsletter section content from CMS
  const newsletterSection = getSection('newsletter');
  const newsletterTitle = newsletterSection.title || 'Stay Connected';
  const newsletterDescription = newsletterSection.description || 'Join our community for updates and insights.';

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
