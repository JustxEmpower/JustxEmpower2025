import { useEffect } from 'react';
import Section from '@/components/Section';
import { useLocation } from 'wouter';
import { getMediaUrl } from '@/lib/media';
import NewsletterSignup from '@/components/NewsletterSignup';
import { usePageContent } from '@/hooks/usePageContent';

export default function Philosophy() {
  const [location] = useLocation();
  const { getContent, getSection, isLoading } = usePageContent('philosophy');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Get hero content
  const heroTitle = getContent('hero', 'title', 'Our Philosophy');
  const heroSubtitle = getContent('hero', 'subtitle', 'OUR APPROACH');
  const heroDescription = getContent('hero', 'description', 'Embodiment Over Intellectualization');
  const heroImage = getContent('hero', 'imageUrl', '/media/11/Fam.jpg');

  // Get principles content
  const principlesTitle = getContent('principles', 'title', 'Foundational Principles');
  const principle1Title = getContent('principles', 'principle1_title', 'Embodiment');
  const principle1Desc = getContent('principles', 'principle1_description', 'Truth begins where intellect ends—within the lived intelligence of the body and breath. Transformation moves from concept into experience, as the nervous system becomes the gateway to sovereignty.');
  const principle2Title = getContent('principles', 'principle2_title', 'Wholeness');
  const principle2Desc = getContent('principles', 'principle2_description', 'Wholeness is not something to achieve or restore—it is something to reclaim. The work is not about fixing what is broken, but remembering what endures: clarity, sovereignty, embodied truth.');
  const principle3Title = getContent('principles', 'principle3_title', "Nature's Intelligence");
  const principle3Desc = getContent('principles', 'principle3_description', "Rather than replicating outdated systems, Just Empower roots its work in nature's original intelligence—adaptive, regenerative, and quietly revolutionary.");

  // Get newsletter content
  const newsletterTitle = getContent('newsletter', 'title', 'Deepen Your Practice');
  const newsletterDesc = getContent('newsletter', 'description', 'Receive monthly insights on embodiment, conscious leadership, and the philosophy of transformation.');

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
          <source src={getMediaUrl('/media/videos/emerge-with-us.mp4')} type="video/mp4" />
        </video>
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="font-serif text-5xl md:text-7xl font-light tracking-wide italic mb-6">
            {heroTitle}
          </h1>
          <p className="font-sans text-sm md:text-base tracking-[0.2em] uppercase opacity-90">
            {heroDescription}
          </p>
        </div>
      </div>

      {/* Core Principles */}
      <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="font-serif text-4xl italic mb-8 text-foreground">{principlesTitle}</h2>
            <div className="space-y-12">
              <div>
                <h3 className="font-sans text-sm tracking-widest uppercase mb-3 text-muted-foreground">01. {principle1Title}</h3>
                <p className="text-lg leading-relaxed">{principle1Desc}</p>
              </div>
              <div>
                <h3 className="font-sans text-sm tracking-widest uppercase mb-3 text-muted-foreground">02. {principle2Title}</h3>
                <p className="text-lg leading-relaxed">{principle2Desc}</p>
              </div>
              <div>
                <h3 className="font-sans text-sm tracking-widest uppercase mb-3 text-muted-foreground">03. {principle3Title}</h3>
                <p className="text-lg leading-relaxed">{principle3Desc}</p>
              </div>
            </div>
          </div>
          <div className="sticky top-32">
            <img 
              src={getMediaUrl('/media/12/IMG_0516-800x1044.jpg')} 
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
        image={getMediaUrl('/media/11/Cover-Final-Emblem-V1-1024x731.png')}
        imageAlt="Three Pillars Symbol"
        dark
      />

      {/* Newsletter CTA */}
      <div className="py-24 px-6 md:px-12 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl italic mb-4 text-foreground">
            {newsletterTitle}
          </h2>
          <p className="font-sans text-muted-foreground mb-8">
            {newsletterDesc}
          </p>
          <div className="max-w-md mx-auto">
            <NewsletterSignup variant="inline" />
          </div>
        </div>
      </div>
    </div>
  );
}
