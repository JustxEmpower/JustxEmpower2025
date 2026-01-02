import { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { getMediaUrl } from '@/lib/media';
import { usePageContent } from '@/hooks/usePageContent';

export default function WalkWithUs() {
  const [location] = useLocation();
  const { getContent, isLoading } = usePageContent('walk-with-us');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  // Get hero section content
  const heroTitle = getContent('hero', 'title') || 'Walk With Us';
  const heroSubtitle = getContent('hero', 'subtitle') || 'A Collective Invocation';
  const heroImage = getContent('hero', 'imageUrl') || '/media/11/Tri-Cover-1280x960.jpg';

  // Get main content section
  const mainTitle = getContent('main', 'title') || 'Join the Movement';
  const mainDescription = getContent('main', 'description') || 'This is not a solitary endeavor; it is a collective invocation. We call forth aligned professionals: policy strategists, environmental scientists, systems thinkers, legal advocates, planners, and community organizers who carry both vision and skill. Equally, we seek those who may not have borne formal titles yet held within them the heart, conviction, and devotion to move purpose into form.';

  // Get partner card content
  const partnerTitle = getContent('partners', 'title') || 'For Partners';
  const partnerDescription = getContent('partners', 'description') || 'Collaborate on initiatives that restore coherence between people, purpose, and planet.';
  const partnerCtaText = getContent('partners', 'ctaText') || 'Partner With Us';
  const partnerCtaLink = getContent('partners', 'ctaLink') || '/contact';

  // Get individual card content
  const individualTitle = getContent('individuals', 'title') || 'For Individuals';
  const individualDescription = getContent('individuals', 'description') || 'Join our community of awakened women reclaiming sovereignty and embodied truth.';
  const individualCtaText = getContent('individuals', 'ctaText') || 'Join Community';
  const individualCtaLink = getContent('individuals', 'ctaLink') || '/community-events';

  // Get quote section
  const quoteText = getContent('quote', 'text') || '"In protecting what flourishes, we protect the right of all beings to rise, to renew, and to remain free."';
  const quoteImage = getContent('quote', 'imageUrl') || '/media/12/IMG_0513-1280x1358.jpg';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[70vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-black/30 z-10" />
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${getMediaUrl(heroImage)})` }}
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="font-serif text-5xl md:text-7xl font-light tracking-wide italic mb-6">
            {heroTitle}
          </h1>
          <p className="font-sans text-sm md:text-base tracking-[0.2em] uppercase opacity-90">
            {heroSubtitle}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-24 px-6 md:px-12 max-w-4xl mx-auto text-center">
        <h2 className="font-serif text-4xl italic mb-8 text-foreground">{mainTitle}</h2>
        <p className="text-lg text-muted-foreground leading-relaxed mb-12">
          {mainDescription}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-muted/30 p-8 rounded-[1.5rem] text-left">
            <h3 className="font-serif text-2xl italic mb-4">{partnerTitle}</h3>
            <p className="text-muted-foreground mb-6">
              {partnerDescription}
            </p>
            <Link href={partnerCtaLink}>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
                {partnerCtaText}
              </Button>
            </Link>
          </div>
          <div className="bg-muted/30 p-8 rounded-[1.5rem] text-left">
            <h3 className="font-serif text-2xl italic mb-4">{individualTitle}</h3>
            <p className="text-muted-foreground mb-6">
              {individualDescription}
            </p>
            <Link href={individualCtaLink}>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
                {individualCtaText}
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative rounded-[1.5rem] overflow-hidden h-[400px]">
          <img 
            src={getMediaUrl(quoteImage)} 
            alt="Community" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <p className="text-white font-serif text-3xl italic max-w-2xl px-4">
              {quoteText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
