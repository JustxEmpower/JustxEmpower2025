import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { PageBlock } from '../usePageBuilderStore';
import Carousel from '@/components/Carousel';
import NewsletterSignup from '@/components/NewsletterSignup';
import { Heart, Compass, Crown, Leaf, Star, Sparkles, ChevronDown, Mail, Phone, MapPin, ArrowRight, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Icon mapping for pillar grid
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  heart: Heart,
  compass: Compass,
  crown: Crown,
  leaf: Leaf,
  star: Star,
  sparkles: Sparkles,
};

// JE Hero Block Renderer (handles je-hero-video, je-hero-image, je-hero-split, je-hero)
export function JEHeroRenderer({ block }: { block: PageBlock }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

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
  
  // Helper to detect if URL is a video file
  const isVideoUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    return /\.(mp4|webm|mov|ogg|m4v|avi|mkv)(?:[?#]|$)/i.test(url);
  };
  
  // Get the resolved URLs
  const rawVideoUrl = content.videoUrl ? getMediaUrl(content.videoUrl) : undefined;
  const rawImageUrl = content.imageUrl ? getMediaUrl(content.imageUrl) : undefined;
  const posterImageUrl = content.posterImage ? getMediaUrl(content.posterImage) : undefined;
  
  // If imageUrl is actually a video file, treat it as videoUrl
  const imageIsVideo = isVideoUrl(rawImageUrl);
  const videoUrl = rawVideoUrl || (imageIsVideo ? rawImageUrl : undefined);
  const imageUrl = imageIsVideo ? undefined : rawImageUrl;
  const hasMedia = videoUrl || imageUrl;

  // Debug logging
  console.log('[JEHeroRenderer] Block type:', block.type);
  console.log('[JEHeroRenderer] Video URL:', videoUrl);
  console.log('[JEHeroRenderer] Image URL:', imageUrl);
  console.log('[JEHeroRenderer] Has media:', hasMedia);

  // Effect to handle video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    setVideoLoaded(false);
    setVideoError(false);

    const handleCanPlay = () => {
      console.log('[JEHeroRenderer] Video can play');
      setVideoLoaded(true);
      // Try to play the video
      video.play().catch(err => {
        console.warn('[JEHeroRenderer] Autoplay blocked:', err);
      });
    };

    const handleError = (e: Event) => {
      console.error('[JEHeroRenderer] Video error:', e);
      setVideoError(true);
    };

    const handleLoadedData = () => {
      console.log('[JEHeroRenderer] Video data loaded');
      setVideoLoaded(true);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);

    // Force load the video
    video.load();

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
    };
  }, [videoUrl]);

  return (
    <section 
      className="relative w-full overflow-hidden bg-black"
      style={{ minHeight: minHeight === '100vh' ? '500px' : minHeight }}
    >
      {/* Video Background */}
      {videoUrl && !videoError && (
        <video
          src={videoUrl}
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster={posterImageUrl}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ zIndex: 1 }} />
      )}
      
      {/* Image Background (fallback or primary) */}
      {((!videoUrl && imageUrl) || (videoUrl && !videoLoaded && imageUrl) || (videoError && imageUrl)) && (
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})`, zIndex: 1 }}
        />
      )}

      {/* Poster Image while video loads */}
      {videoUrl && !videoLoaded && posterImageUrl && !videoError && (
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${posterImageUrl})`, zIndex: 1 }}
        />
      )}
      
      {/* Placeholder when no media */}
      {!hasMedia && (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center" style={{ zIndex: 1 }} />
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
        style={{ opacity: overlayOpacity / 100, zIndex: 2 }}
      />
      
      {/* Content */}
      <div className="relative h-full min-h-[500px] flex flex-col items-center justify-center text-center text-white px-6 py-16" style={{ zIndex: 10 }}>
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

// JE Section Block Renderer (handles je-section-standard, je-section-fullwidth, je-section-full-width)
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
  const imageUrl = content.imageUrl ? getMediaUrl(content.imageUrl) : undefined;

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
          {imageUrl ? (
            <div className="relative overflow-hidden rounded-[2rem]">
              <img
                src={imageUrl}
                alt={content.imageAlt || 'Section image'}
                className="w-full h-auto object-cover"
                onError={(e) => console.error('[JESectionRenderer] Image error:', e)}
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
  const content = block.content as {
    items?: Array<{
      title: string;
      description?: string;
      imageUrl?: string;
      link?: string;
    }>;
  };

  // If items are provided in the block, render custom carousel
  if (content.items && content.items.length > 0) {
    return (
      <section className="py-24 px-6 bg-[#f5f5f0]">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-8 overflow-x-auto pb-8 snap-x snap-mandatory">
            {content.items.map((item, index) => (
              <div key={index} className="flex-shrink-0 w-80 snap-start">
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
                  {item.imageUrl && (
                    <img
                      src={getMediaUrl(item.imageUrl)}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="font-serif text-xl italic mb-2">{item.title}</h3>
                    {item.description && (
                      <p className="text-neutral-600 text-sm">{item.description}</p>
                    )}
                    {item.link && (
                      <Link href={item.link}>
                        <a className="mt-4 inline-flex items-center text-primary text-sm font-medium">
                          Learn More <ArrowRight className="w-4 h-4 ml-2" />
                        </a>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Default: use the actual Carousel component which fetches from database
  return <Carousel />;
}

// JE Newsletter Block Renderer
export function JENewsletterRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    title?: string;
    description?: string;
    buttonText?: string;
    variant?: 'inline' | 'stacked' | 'minimal';
    dark?: boolean;
  };

  const bgClass = content.dark !== false ? 'bg-[#1a1a1a] text-white' : 'bg-[#f5f5f0]';

  return (
    <div className={`py-24 px-6 ${bgClass} rounded-[2.5rem]`}>
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-serif text-4xl italic mb-4">
          {content.title || 'Stay Connected'}
        </h2>
        <p className={content.dark !== false ? 'text-white/70 mb-8' : 'text-neutral-600 mb-8'}>
          {content.description || 'Join our community for updates.'}
        </p>
        <NewsletterSignup variant="inline" />
      </div>
    </div>
  );
}

// JE Quote Block Renderer (handles je-quote, je-blockquote)
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

// JE Pillar Grid Renderer (handles je-pillar-grid, je-three-pillars, je-pillars)
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

// JE Community Section Renderer (handles je-community, je-community-section)
export function JECommunityRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    title?: string;
    subtitle?: string;
    description?: string;
    imageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
  };

  const imageUrl = content.imageUrl ? getMediaUrl(content.imageUrl) : undefined;

  return (
    <section className="py-24 px-6 bg-[#f5f5f0]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Image */}
        <div className="relative">
          {imageUrl ? (
            <div className="relative overflow-hidden rounded-[2rem]">
              <img
                src={imageUrl}
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
            {content.title || 'Join Our Community'}
          </h2>
          
          {content.description && (
            <p className="font-sans text-lg text-neutral-600 leading-relaxed mb-8">
              {content.description}
            </p>
          )}
          
          {content.ctaText && content.ctaLink && (
            <Link href={content.ctaLink}>
              <a className="inline-block px-6 py-3 border border-neutral-900 rounded-full font-sans text-sm uppercase tracking-[0.15em] hover:bg-black hover:text-white transition-all duration-300">
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

  const imageUrl = content.imageUrl ? getMediaUrl(content.imageUrl) : undefined;

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
            <p className="font-sans text-lg text-white/70 leading-relaxed mb-8">
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
          {imageUrl ? (
            <div className="relative overflow-hidden rounded-[2rem]">
              <img
                src={imageUrl}
                alt="Rooted Unity"
                className="w-full h-auto object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[4/3] bg-neutral-700 rounded-[2rem] flex items-center justify-center">
              <span className="text-neutral-400">Add an image</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// JE Heading Renderer
export function JEHeadingRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    text?: string;
    label?: string;
    level?: 'h1' | 'h2' | 'h3' | 'h4';
    alignment?: 'left' | 'center' | 'right';
    dark?: boolean;
  };

  const HeadingTag = content.level || 'h2';
  const alignClass = content.alignment === 'center' ? 'text-center' : content.alignment === 'right' ? 'text-right' : 'text-left';
  const sizeClass = content.level === 'h1' ? 'text-5xl md:text-7xl' : content.level === 'h3' ? 'text-3xl md:text-4xl' : content.level === 'h4' ? 'text-2xl md:text-3xl' : 'text-4xl md:text-5xl';

  return (
    <div className={`py-8 ${alignClass}`}>
      {content.label && (
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-primary mb-4">
          {content.label}
        </p>
      )}
      <HeadingTag className={`font-serif ${sizeClass} font-light italic`}>
        {content.text || 'Heading Text'}
      </HeadingTag>
    </div>
  );
}

// JE Paragraph Renderer
export function JEParagraphRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    text?: string;
    alignment?: 'left' | 'center' | 'right';
    size?: 'small' | 'medium' | 'large';
    dark?: boolean;
  };

  const alignClass = content.alignment === 'center' ? 'text-center' : content.alignment === 'right' ? 'text-right' : 'text-left';
  const sizeClass = content.size === 'small' ? 'text-base' : content.size === 'large' ? 'text-xl' : 'text-lg';
  const textClass = content.dark ? 'text-white/70' : 'text-neutral-600';

  return (
    <div className={`py-4 ${alignClass}`}>
      <p className={`font-sans ${sizeClass} leading-relaxed ${textClass}`}>
        {content.text || 'Add your paragraph text here...'}
      </p>
    </div>
  );
}

// JE Image Renderer
export function JEImageRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    imageUrl?: string;
    alt?: string;
    caption?: string;
    rounded?: boolean;
    shadow?: boolean;
  };

  const imageUrl = content.imageUrl ? getMediaUrl(content.imageUrl) : undefined;

  return (
    <figure className="py-8">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={content.alt || 'Image'}
          className={`w-full h-auto ${content.rounded ? 'rounded-[2rem]' : ''} ${content.shadow ? 'shadow-xl' : ''}`}
          onError={(e) => console.error('[JEImageRenderer] Image error:', e)}
        />
      ) : (
        <div className="aspect-video bg-neutral-200 rounded-[2rem] flex items-center justify-center">
          <span className="text-neutral-400">Add an image</span>
        </div>
      )}
      {content.caption && (
        <figcaption className="mt-4 text-center text-sm text-neutral-500 italic">
          {content.caption}
        </figcaption>
      )}
    </figure>
  );
}

// JE Video Renderer
export function JEVideoRenderer({ block }: { block: PageBlock }) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const content = block.content as {
    videoUrl?: string;
    posterImage?: string;
    autoplay?: boolean;
    loop?: boolean;
    controls?: boolean;
  };

  const videoUrl = content.videoUrl ? getMediaUrl(content.videoUrl) : undefined;
  const posterUrl = content.posterImage ? getMediaUrl(content.posterImage) : undefined;

  console.log('[JEVideoRenderer] Video URL input:', content.videoUrl);
  console.log('[JEVideoRenderer] Video URL resolved:', videoUrl);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="py-8">
      {videoUrl ? (
        <div className="relative rounded-[2rem] overflow-hidden bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            autoPlay={content.autoplay}
            loop={content.loop !== false}
            muted={isMuted}
            playsInline
            className="w-full h-auto"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={(e) => console.error('[JEVideoRenderer] Video error:', e)}
            onLoadedData={() => console.log('[JEVideoRenderer] Video loaded successfully')}
          />
          {content.controls !== false && (
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
              </button>
              <button
                onClick={toggleMute}
                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-video bg-neutral-800 rounded-[2rem] flex items-center justify-center">
          <div className="text-center text-white/40">
            <Play className="w-16 h-16 mx-auto mb-4" />
            <p className="text-sm">Add a video in settings</p>
          </div>
        </div>
      )}
    </div>
  );
}

// JE Button Renderer
export function JEButtonRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    text?: string;
    link?: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    alignment?: 'left' | 'center' | 'right';
  };

  const alignClass = content.alignment === 'center' ? 'text-center' : content.alignment === 'right' ? 'text-right' : 'text-left';
  const sizeClass = content.size === 'small' ? 'px-4 py-2 text-xs' : content.size === 'large' ? 'px-10 py-5 text-base' : 'px-8 py-4 text-sm';
  
  const variantClass = content.variant === 'primary' 
    ? 'bg-black text-white hover:bg-neutral-800' 
    : content.variant === 'secondary'
    ? 'bg-primary text-white hover:bg-primary/90'
    : content.variant === 'ghost'
    ? 'bg-transparent text-black hover:bg-black/5'
    : 'border border-black text-black hover:bg-black hover:text-white';

  return (
    <div className={`py-4 ${alignClass}`}>
      {content.link ? (
        <Link href={content.link}>
          <a className={`inline-block ${sizeClass} ${variantClass} rounded-full font-sans uppercase tracking-[0.15em] transition-all duration-300`}>
            {content.text || 'Button'}
          </a>
        </Link>
      ) : (
        <button className={`${sizeClass} ${variantClass} rounded-full font-sans uppercase tracking-[0.15em] transition-all duration-300`}>
          {content.text || 'Button'}
        </button>
      )}
    </div>
  );
}

// JE Two Column Renderer
export function JETwoColumnRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    leftContent?: string;
    rightContent?: string;
    leftTitle?: string;
    rightTitle?: string;
    imageUrl?: string;
    imagePosition?: 'left' | 'right';
    dark?: boolean;
  };

  const bgClass = content.dark ? 'bg-[#1a1a1a] text-white' : 'bg-[#f5f5f0]';
  const textClass = content.dark ? 'text-white/70' : 'text-neutral-600';
  const imageUrl = content.imageUrl ? getMediaUrl(content.imageUrl) : undefined;

  return (
    <section className={`py-24 px-6 ${bgClass}`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className={content.imagePosition === 'right' ? 'lg:order-1' : 'lg:order-2'}>
          {content.leftTitle && (
            <h3 className="font-serif text-3xl italic mb-6">{content.leftTitle}</h3>
          )}
          <p className={`font-sans text-lg leading-relaxed ${textClass}`}>
            {content.leftContent || 'Left column content...'}
          </p>
        </div>
        <div className={content.imagePosition === 'right' ? 'lg:order-2' : 'lg:order-1'}>
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full h-auto rounded-[2rem]" />
          ) : (
            <>
              {content.rightTitle && (
                <h3 className="font-serif text-3xl italic mb-6">{content.rightTitle}</h3>
              )}
              <p className={`font-sans text-lg leading-relaxed ${textClass}`}>
                {content.rightContent || 'Right column content...'}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// JE Divider Renderer
export function JEDividerRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    style?: 'line' | 'dots' | 'ornament';
    dark?: boolean;
  };

  const colorClass = content.dark ? 'border-white/20' : 'border-neutral-300';

  if (content.style === 'dots') {
    return (
      <div className="py-8 flex justify-center gap-2">
        <span className={`w-2 h-2 rounded-full ${content.dark ? 'bg-white/40' : 'bg-neutral-400'}`} />
        <span className={`w-2 h-2 rounded-full ${content.dark ? 'bg-white/40' : 'bg-neutral-400'}`} />
        <span className={`w-2 h-2 rounded-full ${content.dark ? 'bg-white/40' : 'bg-neutral-400'}`} />
      </div>
    );
  }

  if (content.style === 'ornament') {
    return (
      <div className="py-8 flex justify-center">
        <svg className={`w-24 h-6 ${content.dark ? 'text-white/40' : 'text-neutral-400'}`} viewBox="0 0 100 24" fill="currentColor">
          <path d="M0 12h40l5-6 5 6 5-6 5 6h40" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
      </div>
    );
  }

  return (
    <div className="py-8">
      <hr className={`border-t ${colorClass}`} />
    </div>
  );
}

// JE Spacer Renderer
export function JESpacerRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    height?: 'small' | 'medium' | 'large' | 'xlarge';
  };

  const heightClass = content.height === 'small' ? 'h-8' : content.height === 'large' ? 'h-24' : content.height === 'xlarge' ? 'h-32' : 'h-16';

  return <div className={heightClass} />;
}

// JE FAQ Renderer
export function JEFAQRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    title?: string;
    items?: Array<{ question: string; answer: string }>;
    dark?: boolean;
  };

  const bgClass = content.dark ? 'bg-[#1a1a1a] text-white' : 'bg-[#f5f5f0]';
  const items = content.items || [
    { question: 'Sample question?', answer: 'Sample answer...' }
  ];

  return (
    <section className={`py-24 px-6 ${bgClass}`}>
      <div className="max-w-3xl mx-auto">
        {content.title && (
          <h2 className="font-serif text-4xl italic text-center mb-12">{content.title}</h2>
        )}
        <Accordion type="single" collapsible className="space-y-4">
          {items.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-neutral-300 dark:border-neutral-700">
              <AccordionTrigger className="font-serif text-xl py-6 hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-neutral-600 dark:text-neutral-400 pb-6">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

// JE Contact Form Renderer
export function JEContactFormRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    title?: string;
    description?: string;
    dark?: boolean;
  };

  const bgClass = content.dark ? 'bg-[#1a1a1a] text-white' : 'bg-[#f5f5f0]';
  const inputClass = content.dark 
    ? 'bg-white/10 border-white/20 text-white placeholder-white/50' 
    : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400';

  return (
    <section className={`py-24 px-6 ${bgClass}`}>
      <div className="max-w-2xl mx-auto">
        {content.title && (
          <h2 className="font-serif text-4xl italic text-center mb-4">{content.title}</h2>
        )}
        {content.description && (
          <p className={`text-center mb-12 ${content.dark ? 'text-white/70' : 'text-neutral-600'}`}>
            {content.description}
          </p>
        )}
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="text"
              placeholder="First Name"
              className={`w-full px-6 py-4 rounded-full border ${inputClass} focus:outline-none focus:ring-2 focus:ring-primary`}
            />
            <input
              type="text"
              placeholder="Last Name"
              className={`w-full px-6 py-4 rounded-full border ${inputClass} focus:outline-none focus:ring-2 focus:ring-primary`}
            />
          </div>
          <input
            type="email"
            placeholder="Email Address"
            className={`w-full px-6 py-4 rounded-full border ${inputClass} focus:outline-none focus:ring-2 focus:ring-primary`}
          />
          <textarea
            placeholder="Your Message"
            rows={5}
            className={`w-full px-6 py-4 rounded-3xl border ${inputClass} focus:outline-none focus:ring-2 focus:ring-primary resize-none`}
          />
          <div className="text-center">
            <button
              type="submit"
              className="px-10 py-4 bg-black text-white rounded-full font-sans text-sm uppercase tracking-[0.15em] hover:bg-neutral-800 transition-colors"
            >
              Send Message
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

// JE Testimonial Renderer
export function JETestimonialRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    quote?: string;
    author?: string;
    role?: string;
    imageUrl?: string;
    dark?: boolean;
  };

  const bgClass = content.dark ? 'bg-[#1a1a1a] text-white' : 'bg-[#f5f5f0]';
  const imageUrl = content.imageUrl ? getMediaUrl(content.imageUrl) : undefined;

  return (
    <section className={`py-24 px-6 ${bgClass}`}>
      <div className="max-w-4xl mx-auto text-center">
        <blockquote className="font-serif text-3xl md:text-4xl italic leading-relaxed mb-8">
          "{content.quote || 'A powerful testimonial from a satisfied client.'}"
        </blockquote>
        <div className="flex items-center justify-center gap-4">
          {imageUrl && (
            <img src={imageUrl} alt={content.author} className="w-16 h-16 rounded-full object-cover" />
          )}
          <div className="text-left">
            <p className="font-sans font-medium">{content.author || 'Client Name'}</p>
            {content.role && (
              <p className={`font-sans text-sm ${content.dark ? 'text-white/60' : 'text-neutral-500'}`}>
                {content.role}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// JE Offerings Grid Renderer
export function JEOfferingsGridRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    title?: string;
    items?: Array<{
      title: string;
      description?: string;
      imageUrl?: string;
      link?: string;
    }>;
  };

  const items = content.items || [];

  return (
    <section className="py-24 px-6 bg-[#f5f5f0]">
      <div className="max-w-7xl mx-auto">
        {content.title && (
          <h2 className="font-serif text-4xl md:text-5xl italic text-center mb-16">{content.title}</h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, index) => (
            <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              {item.imageUrl && (
                <img
                  src={getMediaUrl(item.imageUrl)}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <h3 className="font-serif text-xl italic mb-2">{item.title}</h3>
                {item.description && (
                  <p className="text-neutral-600 text-sm mb-4">{item.description}</p>
                )}
                {item.link && (
                  <Link href={item.link}>
                    <a className="inline-flex items-center text-primary text-sm font-medium">
                      Learn More <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// JE Coming Soon Renderer
export function JEComingSoonRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    title?: string;
    subtitle?: string;
    description?: string;
    date?: string;
    dark?: boolean;
  };

  const bgClass = content.dark ? 'bg-[#1a1a1a] text-white' : 'bg-[#f5f5f0]';

  return (
    <section className={`py-24 px-6 ${bgClass}`}>
      <div className="max-w-3xl mx-auto text-center">
        {content.subtitle && (
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-primary mb-4">
            {content.subtitle}
          </p>
        )}
        <h2 className="font-serif text-4xl md:text-5xl italic mb-6">
          {content.title || 'Coming Soon'}
        </h2>
        {content.description && (
          <p className={`font-sans text-lg leading-relaxed mb-8 ${content.dark ? 'text-white/70' : 'text-neutral-600'}`}>
            {content.description}
          </p>
        )}
        {content.date && (
          <p className="font-sans text-sm uppercase tracking-[0.2em] text-primary">
            {content.date}
          </p>
        )}
      </div>
    </section>
  );
}

// JE Gallery Renderer
export function JEGalleryRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    images?: Array<{ url: string; alt?: string; caption?: string }>;
    columns?: number;
  };

  const images = content.images || [];
  const columns = content.columns || 3;

  return (
    <section className="py-24 px-6 bg-[#f5f5f0]">
      <div className="max-w-7xl mx-auto">
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6`}>
          {images.map((image, index) => (
            <figure key={index} className="relative overflow-hidden rounded-2xl">
              <img
                src={getMediaUrl(image.url)}
                alt={image.alt || `Gallery image ${index + 1}`}
                className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
              />
              {image.caption && (
                <figcaption className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white text-sm">
                  {image.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

// JE Team Member Renderer
export function JETeamMemberRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    name?: string;
    role?: string;
    bio?: string;
    imageUrl?: string;
    dark?: boolean;
  };

  const bgClass = content.dark ? 'bg-[#1a1a1a] text-white' : 'bg-[#f5f5f0]';
  const imageUrl = content.imageUrl ? getMediaUrl(content.imageUrl) : undefined;

  return (
    <section className={`py-24 px-6 ${bgClass}`}>
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12 items-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={content.name}
            className="w-64 h-64 rounded-full object-cover"
          />
        ) : (
          <div className="w-64 h-64 rounded-full bg-neutral-300 flex items-center justify-center">
            <span className="text-neutral-500">Add photo</span>
          </div>
        )}
        <div>
          <h3 className="font-serif text-3xl italic mb-2">{content.name || 'Team Member'}</h3>
          {content.role && (
            <p className="font-sans text-sm uppercase tracking-[0.2em] text-primary mb-6">{content.role}</p>
          )}
          {content.bio && (
            <p className={`font-sans text-lg leading-relaxed ${content.dark ? 'text-white/70' : 'text-neutral-600'}`}>
              {content.bio}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// JE Principles Renderer
export function JEPrinciplesRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    title?: string;
    principles?: Array<{ number: string; title: string; description: string }>;
    dark?: boolean;
  };

  const bgClass = content.dark ? 'bg-[#1a1a1a] text-white' : 'bg-[#f5f5f0]';
  const textClass = content.dark ? 'text-white/70' : 'text-neutral-600';
  const principles = content.principles || [];

  return (
    <section className={`py-24 px-6 ${bgClass}`}>
      <div className="max-w-4xl mx-auto">
        {content.title && (
          <h2 className="font-serif text-4xl italic text-center mb-16">{content.title}</h2>
        )}
        <div className="space-y-12">
          {principles.map((principle, index) => (
            <div key={index} className="flex gap-8">
              <span className="font-serif text-5xl italic text-primary/30">
                {principle.number || `0${index + 1}`}
              </span>
              <div>
                <h3 className="font-serif text-2xl italic mb-4">{principle.title}</h3>
                <p className={`font-sans text-lg leading-relaxed ${textClass}`}>
                  {principle.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// JE Footer Renderer
export function JEFooterRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    tagline?: string;
    copyright?: string;
    links?: Array<{ label: string; url: string }>;
  };

  return (
    <footer className="py-16 px-6 bg-[#1a1a1a] text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="font-serif text-2xl italic mb-4">
            {content.tagline || 'Where Empowerment Becomes Embodiment'}
          </p>
        </div>
        {content.links && content.links.length > 0 && (
          <nav className="flex flex-wrap justify-center gap-8 mb-12">
            {content.links.map((link, index) => (
              <Link key={index} href={link.url}>
                <a className="font-sans text-sm uppercase tracking-[0.15em] text-white/70 hover:text-white transition-colors">
                  {link.label}
                </a>
              </Link>
            ))}
          </nav>
        )}
        <p className="text-center text-white/50 text-sm">
          {content.copyright || `© ${new Date().getFullYear()} Just Empower. All rights reserved.`}
        </p>
      </div>
    </footer>
  );
}

// JE Volumes Renderer
export function JEVolumesRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    title?: string;
    volumes?: Array<{
      title: string;
      description?: string;
      imageUrl?: string;
      link?: string;
    }>;
  };

  const volumes = content.volumes || [];

  return (
    <section className="py-24 px-6 bg-[#f5f5f0]">
      <div className="max-w-7xl mx-auto">
        {content.title && (
          <h2 className="font-serif text-4xl italic text-center mb-16">{content.title}</h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {volumes.map((volume, index) => (
            <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-lg">
              {volume.imageUrl && (
                <img
                  src={getMediaUrl(volume.imageUrl)}
                  alt={volume.title}
                  className="w-full h-64 object-cover"
                />
              )}
              <div className="p-6">
                <h3 className="font-serif text-xl italic mb-2">{volume.title}</h3>
                {volume.description && (
                  <p className="text-neutral-600 text-sm mb-4">{volume.description}</p>
                )}
                {volume.link && (
                  <Link href={volume.link}>
                    <a className="inline-flex items-center text-primary text-sm font-medium">
                      Read More <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// JE Feature Card Renderer
export function JEFeatureCardRenderer({ block }: { block: PageBlock }) {
  const content = block.content as {
    title?: string;
    description?: string;
    icon?: string;
    link?: string;
    dark?: boolean;
  };

  const bgClass = content.dark ? 'bg-[#1a1a1a] text-white' : 'bg-white';
  const IconComponent = iconMap[content.icon || 'star'] || Star;

  return (
    <div className={`p-8 rounded-2xl ${bgClass} shadow-lg`}>
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <IconComponent className="w-6 h-6 text-primary" />
      </div>
      <h3 className="font-serif text-xl italic mb-4">{content.title || 'Feature Title'}</h3>
      <p className={`font-sans text-sm leading-relaxed ${content.dark ? 'text-white/70' : 'text-neutral-600'}`}>
        {content.description || 'Feature description...'}
      </p>
      {content.link && (
        <Link href={content.link}>
          <a className="mt-4 inline-flex items-center text-primary text-sm font-medium">
            Learn More <ArrowRight className="w-4 h-4 ml-2" />
          </a>
        </Link>
      )}
    </div>
  );
}
