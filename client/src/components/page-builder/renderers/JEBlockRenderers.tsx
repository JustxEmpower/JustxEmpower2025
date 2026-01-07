import React from 'react';
import { Link } from 'wouter';
import { PageBlock } from '../usePageBuilderStore';
import Carousel from '@/components/Carousel';
import NewsletterSignup from '@/components/NewsletterSignup';
import { Heart, Compass, Crown, Leaf, Star, Sparkles } from 'lucide-react';

// Icon mapping for pillar grid
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  heart: Heart,
  compass: Compass,
  crown: Crown,
  leaf: Leaf,
  star: Star,
  sparkles: Sparkles,
};

// JE Hero Block Renderer
export function JEHeroRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    videoUrl?: string;
    imageUrl?: string;
    posterImage?: string;
    subtitle?: string;
    title?: string;
    description?: string;
    ctaText?: string;
    ctaLink?: string;
    overlayOpacity?: number;
    minHeight?: string;
    textAlignment?: string;
  };

  const overlayOpacity = content.overlayOpacity ?? 40;
  const minHeight = content.minHeight || '100vh';
  const hasMedia = content.videoUrl || content.imageUrl;

  return (
    <section 
      className="relative w-full overflow-hidden bg-black"
      style={{ minHeight: minHeight === '100vh' ? '500px' : minHeight }}
    >
      {/* Video Background */}
      {content.videoUrl && (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={content.posterImage}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={content.videoUrl} type="video/mp4" />
          <source src={content.videoUrl} type="video/webm" />
          Your browser does not support the video tag.
        </video>
      )}
      
      {/* Image Background (fallback) */}
      {!content.videoUrl && content.imageUrl && (
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${content.imageUrl})` }}
        />
      )}
      
      {/* Placeholder when no media */}
      {!hasMedia && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
          <div className="text-center text-white/40">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Add a video or image in settings</p>
          </div>
        </div>
      )}
      
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity / 100 }}
      />
      
      {/* Content */}
      <div className={`relative z-10 h-full min-h-[500px] flex flex-col items-center justify-center text-${content.textAlignment || 'center'} text-white px-6 py-16`}>
        {content.subtitle && (
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-white/80 mb-6">
            {content.subtitle}
          </p>
        )}
        
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-light italic mb-6 max-w-4xl">
          {content.title || 'Welcome to Just Empower'}
        </h1>
        
        {content.description && (
          <p className="font-sans text-lg md:text-xl text-white/80 max-w-2xl mb-12">
            {content.description}
          </p>
        )}
        
        {content.ctaText && content.ctaLink && (
          <Link href={content.ctaLink}>
            <a className="inline-block px-8 py-4 border border-white/30 rounded-full font-sans text-sm uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-500">
              {content.ctaText}
            </a>
          </Link>
        )}
      </div>
    </section>
  );
}

// JE Section Block Renderer
export function JESectionRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    title?: string;
    subtitle?: string;
    description?: string;
    imageUrl?: string;
    imageAlt?: string;
    ctaText?: string;
    ctaLink?: string;
    reversed?: boolean;
    dark?: boolean;
  };

  const bgClass = content.dark ? 'bg-[#1a1a1a] text-white' : 'bg-[#f5f5f0]';
  const textClass = content.dark ? 'text-white/70' : 'text-neutral-600';

  return (
    <section className={`py-24 px-6 ${bgClass}`}>
      <div className={`max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${content.reversed ? 'lg:flex-row-reverse' : ''}`}>
        {/* Text Content */}
        <div className={content.reversed ? 'lg:order-2' : ''}>
          {content.subtitle && (
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-primary mb-4">
              {content.subtitle}
            </p>
          )}
          
          <h2 className="font-serif text-4xl md:text-5xl font-light italic mb-8">
            {content.title || 'Section Title'}
          </h2>
          
          {content.description && (
            <p className={`font-sans text-lg leading-relaxed mb-8 ${textClass}`}>
              {content.description}
            </p>
          )}
          
          {content.ctaText && content.ctaLink && (
            <Link href={content.ctaLink}>
              <a className="inline-block px-6 py-3 border border-current rounded-full font-sans text-sm uppercase tracking-[0.15em] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300">
                {content.ctaText}
              </a>
            </Link>
          )}
        </div>
        
        {/* Image */}
        <div className={`relative ${content.reversed ? 'lg:order-1' : ''}`}>
          {content.imageUrl ? (
            <div className="relative overflow-hidden rounded-[2rem]">
              <img
                src={content.imageUrl}
                alt={content.imageAlt || 'Section image'}
                className="w-full h-auto object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[4/3] bg-neutral-200 dark:bg-neutral-700 rounded-[2rem] flex items-center justify-center">
              <span className="text-neutral-400">Add an image</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// JE Carousel Block Renderer
export function JECarouselRenderer({ block }: { block: PageBlock }) {
  // This uses the actual Carousel component which fetches from database
  return <Carousel />;
}

// JE Newsletter Block Renderer
export function JENewsletterRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    title?: string;
    description?: string;
    buttonText?: string;
    variant?: 'inline' | 'stacked' | 'minimal';
  };

  return (
    <div className="py-24 px-6 bg-[#1a1a1a] text-white rounded-[2.5rem]">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-serif text-4xl italic mb-4">
          {content.title || 'Stay Connected'}
        </h2>
        <p className="text-white/70 mb-8">
          {content.description || 'Join our community for updates.'}
        </p>
        <NewsletterSignup variant="inline" />
      </div>
    </div>
  );
}

// JE Quote Block Renderer
export function JEQuoteRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    quote?: string;
    author?: string;
    dark?: boolean;
  };

  const bgClass = content.dark ? 'bg-[#1a1a1a] text-white' : 'bg-[#f5f5f0]';

  return (
    <div className={`py-24 px-6 ${bgClass}`}>
      <blockquote className="max-w-4xl mx-auto text-center">
        <p className="font-serif text-3xl md:text-4xl italic leading-relaxed mb-8">
          "{content.quote || 'A meaningful quote that represents your brand.'}"
        </p>
        {content.author && (
          <cite className="font-sans text-sm uppercase tracking-[0.2em] opacity-60 not-italic">
            — {content.author}
          </cite>
        )}
      </blockquote>
    </div>
  );
}

// JE Pillar Grid Renderer
export function JEPillarGridRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    title?: string;
    pillars?: Array<{ icon: string; title: string; description: string }>;
  };

  const pillars = content.pillars || [
    { icon: 'heart', title: 'Embodiment', description: 'Description...' },
    { icon: 'compass', title: 'Discernment', description: 'Description...' },
    { icon: 'crown', title: 'Sovereignty', description: 'Description...' },
  ];

  return (
    <div className="py-24 px-6 bg-[#f5f5f0]">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-serif text-4xl md:text-5xl italic text-center mb-16">
          {content.title || 'Our Pillars'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {pillars.map((pillar, index) => {
            const IconComponent = iconMap[pillar.icon] || Heart;
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <IconComponent className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-serif text-2xl italic mb-4">{pillar.title}</h3>
                <p className="text-neutral-600 leading-relaxed">{pillar.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// JE Community Section Renderer
export function JECommunityRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    title?: string;
    subtitle?: string;
    description?: string;
    imageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
  };

  return (
    <section className="py-24 px-6 bg-[#f5f5f0]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Image */}
        <div className="relative">
          {content.imageUrl ? (
            <div className="relative overflow-hidden rounded-[2rem]">
              <img
                src={content.imageUrl}
                alt="Community"
                className="w-full h-auto object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[4/3] bg-neutral-200 rounded-[2rem] flex items-center justify-center">
              <span className="text-neutral-400">Add an image</span>
            </div>
          )}
        </div>
        
        {/* Text Content */}
        <div>
          {content.subtitle && (
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-primary mb-4">
              {content.subtitle}
            </p>
          )}
          
          <h2 className="font-serif text-4xl md:text-5xl font-light italic mb-8">
            {content.title || 'Emerge With Us'}
          </h2>
          
          {content.description && (
            <p className="font-sans text-lg leading-relaxed text-neutral-600 mb-8">
              {content.description}
            </p>
          )}
          
          {content.ctaText && content.ctaLink && (
            <Link href={content.ctaLink}>
              <a className="inline-block px-6 py-3 bg-black text-white rounded-full font-sans text-sm uppercase tracking-[0.15em] hover:bg-neutral-800 transition-all duration-300">
                {content.ctaText}
              </a>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

// JE Rooted Unity Section Renderer
export function JERootedUnityRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    title?: string;
    subtitle?: string;
    description?: string;
    imageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
  };

  return (
    <section className="py-24 px-6 bg-[#1a1a1a] text-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Text Content */}
        <div>
          {content.subtitle && (
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-primary mb-4">
              {content.subtitle}
            </p>
          )}
          
          <h2 className="font-serif text-4xl md:text-5xl font-light italic mb-8">
            {content.title || 'Rooted Unity'}
          </h2>
          
          {content.description && (
            <p className="font-sans text-lg leading-relaxed text-white/70 mb-8">
              {content.description}
            </p>
          )}
          
          {content.ctaText && content.ctaLink && (
            <Link href={content.ctaLink}>
              <a className="inline-block px-6 py-3 border border-white/30 rounded-full font-sans text-sm uppercase tracking-[0.15em] hover:bg-white hover:text-black transition-all duration-300">
                {content.ctaText}
              </a>
            </Link>
          )}
        </div>
        
        {/* Image */}
        <div className="relative">
          {content.imageUrl ? (
            <div className="relative overflow-hidden rounded-[2rem]">
              <img
                src={content.imageUrl}
                alt="Rooted Unity"
                className="w-full h-auto object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[4/3] bg-neutral-800 rounded-[2rem] flex items-center justify-center">
              <span className="text-neutral-500">Add an image</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
