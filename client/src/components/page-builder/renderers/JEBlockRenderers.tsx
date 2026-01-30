import React, { memo, useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { PageBlock } from '../usePageBuilderStore';
import { JERendererProps, normalizeJERendererProps } from './jeRendererTypes';
import Carousel from '@/components/Carousel';
import NewsletterSignup from '@/components/NewsletterSignup';
import { Heart, Compass, Crown, Leaf, Star, Sparkles, ChevronDown, Mail, Phone, MapPin, ArrowRight, Play, Pause, Volume2, VolumeX, AlertCircle, ImageIcon } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { InlineEditableText } from '../InlineEditableText';
import { ICON_REGISTRY } from '../IconPicker';
import EditableElement from '../EditableElement';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ==========================================
// STYLE HELPER FUNCTIONS
// ==========================================

// Convert Tailwind spacing scale to CSS rem values
const spacingToRem: Record<string, string> = {
  '0': '0',
  '1': '0.25rem',
  '2': '0.5rem',
  '3': '0.75rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '8': '2rem',
  '10': '2.5rem',
  '12': '3rem',
  '16': '4rem',
  '20': '5rem',
  '24': '6rem',
  '32': '8rem',
  '40': '10rem',
  '48': '12rem',
  '56': '14rem',
  '64': '16rem',
};

// Convert spacing value to CSS (handles both Tailwind scale and direct CSS values)
function toSpacing(value: string | undefined): string | undefined {
  if (!value || value === '0') return undefined;
  // If it's a Tailwind spacing number, convert to rem
  if (spacingToRem[value]) return spacingToRem[value];
  // If it already has units (rem, px, em, %), return as-is
  if (/\d+(rem|px|em|%)$/.test(value)) return value;
  // Otherwise, assume it's a number and convert to rem
  const num = parseFloat(value);
  if (!isNaN(num)) return `${num * 0.25}rem`;
  return value;
}

// Build common container styles from block content
function buildContainerStyles(content: Record<string, unknown>): React.CSSProperties {
  return {
    backgroundColor: content.backgroundColor && content.backgroundColor !== '#ffffff' ? content.backgroundColor as string : undefined,
    minHeight: content.minHeight && content.minHeight !== 'auto' ? content.minHeight as string : undefined,
    maxWidth: content.maxWidth && content.maxWidth !== 'full' ? content.maxWidth as string : undefined,
    width: content.customWidth ? content.customWidth as string : undefined,
    borderRadius: content.borderRadius && content.borderRadius !== 'none' && content.borderRadius !== '0' ? content.borderRadius as string : undefined,
    paddingTop: toSpacing(content.paddingTop as string),
    paddingBottom: toSpacing(content.paddingBottom as string),
    paddingLeft: toSpacing(content.paddingLeft as string),
    paddingRight: toSpacing(content.paddingRight as string),
  };
}

// Build text styles from block content
function buildTextStyles(content: Record<string, unknown>): React.CSSProperties {
  return {
    color: content.textColor && content.textColor !== '#000000' ? content.textColor as string : undefined,
  };
}

// ==========================================
// MEDIA RENDERER COMPONENT (Error-proof)
// ==========================================

interface MediaRendererProps {
  type: 'video' | 'image';
  src?: string;
  poster?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  fallbackClassName?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  loading?: 'lazy' | 'eager';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  showPlaceholder?: boolean;
  placeholderText?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const MediaRenderer = memo(function MediaRenderer({
  type,
  src,
  poster,
  alt = '',
  className = '',
  containerClassName = 'w-full h-full',
  fallbackClassName = '',
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  loading = 'lazy',
  objectFit = 'cover',
  showPlaceholder = true,
  placeholderText,
  onLoad,
  onError,
}: MediaRendererProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const resolvedSrc = src ? getMediaUrl(src) : undefined;
  const resolvedPoster = poster ? getMediaUrl(poster) : undefined;

  const objectFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
  }[objectFit];

  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setRetryCount(0);
  }, [src]);

  // Video loading logic with retry
  useEffect(() => {
    if (type !== 'video' || !resolvedSrc) return;

    const video = videoRef.current;
    if (!video) return;

    let mounted = true;

    const handleCanPlay = () => {
      if (mounted) {
        setIsLoaded(true);
        setHasError(false);
        onLoad?.();

        if (autoPlay) {
          video.play().catch(err => {
            console.warn('[MediaRenderer] Autoplay blocked:', err);
          });
        }
      }
    };

    const handleError = (e: Event) => {
      console.error('[MediaRenderer] Video error:', e, resolvedSrc);
      if (mounted) {
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            video.load();
          }, 1000 * (retryCount + 1)); // Exponential backoff
        } else {
          setHasError(true);
          onError?.(new Error('Video failed to load after retries'));
        }
      }
    };

    const handleLoadStart = () => {
      console.log('[MediaRenderer] Video loading:', resolvedSrc);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);

    video.load();

    return () => {
      mounted = false;
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
    };
  }, [resolvedSrc, type, autoPlay, retryCount, onLoad, onError]);

  // No source - show placeholder
  if (!resolvedSrc) {
    if (!showPlaceholder) return null;

    return (
      <div className={`${containerClassName} bg-neutral-800 flex items-center justify-center ${fallbackClassName}`}>
        <div className="text-center text-neutral-500">
          {type === 'video' ? (
            <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
          ) : (
            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          )}
          <p className="text-sm">{placeholderText || `Add ${type} in settings`}</p>
        </div>
      </div>
    );
  }

  // Error state with fallback to poster
  if (hasError) {
    if (resolvedPoster && type === 'video') {
      return (
        <div className={containerClassName}>
          <img
            src={resolvedPoster}
            alt={alt || 'Video poster'}
            className={`w-full h-full ${objectFitClass} ${className}`}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/50 rounded-full p-4">
              <Play className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`${containerClassName} bg-neutral-800 flex items-center justify-center ${fallbackClassName}`}>
        <div className="text-center text-neutral-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Failed to load {type}</p>
        </div>
      </div>
    );
  }

  // Image rendering
  if (type === 'image') {
    return (
      <div className={containerClassName}>
        <img
          src={resolvedSrc}
          alt={alt}
          className={`w-full h-full ${objectFitClass} ${className}`}
          loading={loading}
          onLoad={() => {
            setIsLoaded(true);
            onLoad?.();
          }}
          onError={() => {
            setHasError(true);
            onError?.(new Error('Image failed to load'));
          }}
        />
      </div>
    );
  }

  // Video rendering
  return (
    <div className={containerClassName}>
      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center z-10">
          <div className="animate-pulse text-neutral-500">Loading video...</div>
        </div>
      )}

      <video
        ref={videoRef}
        src={resolvedSrc}
        className={`w-full h-full ${objectFitClass} ${className} transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        crossOrigin="anonymous"
        poster={resolvedPoster}
        preload="auto"
      />
    </div>
  );
});

// Icon mapping for pillar grid - use ICON_REGISTRY from IconPicker for full icon support
const iconMap = ICON_REGISTRY;

// JE Hero Block Renderer (handles je-hero-video, je-hero-image, je-hero-split, je-hero)
export function JEHeroRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const animationInitialized = useRef(false);

  const content = block.content as {
    videoUrl?: string;
    imageUrl?: string;
    posterImage?: string;
    subtitle?: string;
    subtitleColor?: string;
    title?: string;
    titleColor?: string;
    description?: string;
    descriptionColor?: string;
    ctaText?: string;
    ctaTextColor?: string;
    ctaLink?: string;
    overlayOpacity?: number;
    minHeight?: string;
    textAlignment?: string;
    textColor?: string;
    backgroundColor?: string;
    // Shape & Size
    borderRadius?: string;
    bottomCurve?: boolean;
    curveType?: 'wave' | 'arc' | 'diagonal' | 'tilt' | 'none';
    // Content Position
    contentVerticalAlign?: string;
    contentHorizontalAlign?: string;
    contentMaxWidth?: string;
    // Spacing
    paddingTop?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    paddingRight?: string;
    // Title Element Controls
    titleFontSize?: string;
    titleLineHeight?: string;
    titleMarginBottom?: string;
    titleFontWeight?: string;
    titleFontStyle?: string;
    // Subtitle Element Controls
    subtitleFontSize?: string;
    subtitleLetterSpacing?: string;
    subtitleMarginBottom?: string;
    // Description Element Controls
    descriptionFontSize?: string;
    descriptionLineHeight?: string;
    descriptionMarginBottom?: string;
    descriptionMaxWidth?: string;
    // CTA Element Controls
    ctaBorderRadius?: string;
    ctaPaddingX?: string;
    ctaPaddingY?: string;
    ctaFontSize?: string;
    ctaLetterSpacing?: string;
    ctaBorderWidth?: string;
  };

  // Get custom colors or use defaults
  const textColor = content.textColor || '#ffffff';
  const bgColor = content.backgroundColor;
  
  // Per-field colors (fallback to textColor if not set)
  const titleColor = content.titleColor || textColor;
  const subtitleColor = content.subtitleColor || textColor;
  const descriptionColor = content.descriptionColor || textColor;
  const ctaTextColor = content.ctaTextColor || textColor;

  const overlayOpacity = content.overlayOpacity ?? 40;
  const minHeight = content.minHeight || '100vh';
  
  // Shape & Size options
  const borderRadius = content.borderRadius || '2.5rem';
  const bottomCurve = content.bottomCurve !== false; // Default true
  const curveType = content.curveType || 'wave'; // Default to wave
  
  // SVG Curve Divider Component
  const renderCurveDivider = () => {
    if (!bottomCurve || curveType === 'none') return null;
    
    // Use explicit white color for consistent rendering in both editor and preview
    const curveColor = content.curveColor || '#ffffff';
    
    const curves: Record<string, React.ReactElement> = {
      wave: (
        <svg
          className="absolute bottom-0 left-0 w-full"
          style={{ height: '80px', zIndex: 10 }}
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,60 1440,40 L1440,80 L0,80 Z"
            fill={curveColor}
          />
        </svg>
      ),
      arc: (
        <svg
          className="absolute bottom-0 left-0 w-full"
          style={{ height: '100px', zIndex: 10 }}
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,100 L0,50 Q720,0 1440,50 L1440,100 Z"
            fill={curveColor}
          />
        </svg>
      ),
      diagonal: (
        <svg
          className="absolute bottom-0 left-0 w-full"
          style={{ height: '80px', zIndex: 10 }}
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon
            points="0,80 1440,0 1440,80"
            fill={curveColor}
          />
        </svg>
      ),
      tilt: (
        <svg
          className="absolute bottom-0 left-0 w-full"
          style={{ height: '60px', zIndex: 10 }}
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon
            points="0,60 0,30 1440,60"
            fill={curveColor}
          />
        </svg>
      ),
    };
    
    return curves[curveType] || null;
  };
  
  // Content position options
  const verticalAlign = content.contentVerticalAlign || 'center';
  const horizontalAlign = content.contentHorizontalAlign || 'center';
  const contentMaxWidth = content.contentMaxWidth || '4xl';
  
  // Spacing options
  const paddingTop = content.paddingTop || '16';
  const paddingBottom = content.paddingBottom || '16';
  const paddingLeft = content.paddingLeft || '6';
  const paddingRight = content.paddingRight || '6';
  
  // Build dynamic classes
  const verticalAlignClass = {
    'start': 'justify-start',
    'center': 'justify-center',
    'end': 'justify-end',
  }[verticalAlign] || 'justify-center';
  
  const horizontalAlignClass = {
    'start': 'items-start text-left',
    'center': 'items-center text-center',
    'end': 'items-end text-right',
  }[horizontalAlign] || 'items-center text-center';
  
  const maxWidthClass = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    'full': 'max-w-full',
  }[contentMaxWidth] || 'max-w-4xl';
  
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

  // GSAP entrance animations (matching original Hero component)
  useEffect(() => {
    if (!heroRef.current || isEditing || animationInitialized.current) return;
    
    animationInitialized.current = true;
    
    const ctx = gsap.context(() => {
      // Initial entrance animations - fade in and slide up
      gsap.fromTo('.je-hero-subtitle', 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.8, delay: 0.2 }
      );
      
      gsap.fromTo('.je-hero-title', 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, duration: 0.8, delay: 0.4 }
      );
      
      gsap.fromTo('.je-hero-desc', 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.8, delay: 0.6 }
      );
      
      gsap.fromTo('.je-hero-cta', 
        { opacity: 0, scale: 0.9 }, 
        { opacity: 1, scale: 1, duration: 0.8, delay: 0.8 }
      );
    }, heroRef);

    return () => ctx.revert();
  }, [isEditing]);

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

  // Build section style
  const sectionStyle: React.CSSProperties = {
    minHeight: minHeight === '100vh' ? '500px' : minHeight,
    // Note: Using SVG curve divider instead of border-radius for bottom curve
  };

  return (
    <section 
      ref={heroRef}
      className="relative w-full overflow-hidden bg-black"
      style={sectionStyle}
    >
      {/* Video Background */}
      {videoUrl && !videoError && (
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          crossOrigin="anonymous"
          poster={posterImageUrl}
          preload="auto"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ zIndex: 1 }}
        />
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
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center" style={{ zIndex: 1 }}>
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
      <div 
        className={`relative h-full min-h-[500px] flex flex-col ${verticalAlignClass} ${horizontalAlignClass}`}
        style={{ 
          zIndex: 10,
          paddingTop: `max(${toSpacing(paddingTop) || '4rem'}, 100px)`,
          paddingBottom: toSpacing(paddingBottom) || '4rem',
          paddingLeft: toSpacing(paddingLeft) || '1.5rem',
          paddingRight: toSpacing(paddingRight) || '1.5rem',
        }}
      >
        <div className={maxWidthClass}>
          {content.subtitle && (
            <p 
              className="je-hero-subtitle font-sans uppercase drop-shadow-lg" 
              style={{ 
                color: subtitleColor, 
                opacity: isEditing ? 1 : 0.9,
                fontSize: content.subtitleFontSize || '0.75rem',
                letterSpacing: content.subtitleLetterSpacing || '0.3em',
                marginBottom: content.subtitleMarginBottom || '1.5rem',
              }}
            >
              {content.subtitle}
            </p>
          )}
          
          <h1 
            className="je-hero-title font-serif drop-shadow-lg"
            style={{ 
              color: titleColor,
              fontSize: content.titleFontSize || '5rem',
              lineHeight: content.titleLineHeight || '1.1',
              marginBottom: content.titleMarginBottom || '1.5rem',
              fontWeight: content.titleFontWeight || '300',
              fontStyle: content.titleFontStyle || 'italic',
            }}
          >
            {content.title || 'Welcome to Just Empower'}
          </h1>
          
          {content.description && (
            <p 
              className="je-hero-desc font-sans drop-shadow-lg whitespace-pre-wrap text-center mx-auto" 
              style={{ 
                color: descriptionColor, 
                opacity: isEditing ? 1 : 0.9,
                fontSize: content.descriptionFontSize || '1.125rem',
                lineHeight: content.descriptionLineHeight || '1.6',
                marginBottom: content.descriptionMarginBottom || '3rem',
                maxWidth: content.descriptionMaxWidth || '32rem',
              }}
            >
              {content.description}
            </p>
          )}
          
          {content.ctaText && content.ctaLink && (
            <Link 
              href={content.ctaLink}
              className="je-hero-cta inline-block border font-sans uppercase transition-all duration-500"
              style={{ 
                borderColor: ctaTextColor + '4D', 
                color: ctaTextColor,
                borderRadius: content.ctaBorderRadius || '9999px',
                paddingLeft: content.ctaPaddingX || '2rem',
                paddingRight: content.ctaPaddingX || '2rem',
                paddingTop: content.ctaPaddingY || '1rem',
                paddingBottom: content.ctaPaddingY || '1rem',
                fontSize: content.ctaFontSize || '0.875rem',
                letterSpacing: content.ctaLetterSpacing || '0.2em',
                borderWidth: content.ctaBorderWidth || '1px',
              }}
            >
              {content.ctaText}
            </Link>
          )}
        </div>
      </div>
      
      {/* SVG Curve Divider */}
      {renderCurveDivider()}
    </section>
  );
}

// JE Section Block Renderer (handles je-section-standard, je-section-fullwidth, je-section-full-width)
export function JESectionRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const animationInitialized = useRef(false);
  
  const content = block.content as {
    title?: string;
    titleColor?: string;
    subtitle?: string;
    subtitleColor?: string;
    label?: string;
    labelColor?: string;
    description?: string;
    descriptionColor?: string;
    imageUrl?: string;
    imageAlt?: string;
    ctaText?: string;
    ctaTextColor?: string;
    ctaLink?: string;
    reversed?: boolean;
    dark?: boolean;
    textColor?: string;
    backgroundColor?: string;
    // Image Element Controls
    imageWidth?: string;
    imageHeight?: string;
    imageMaxWidth?: string;
    imageBorderRadius?: string;
    imageObjectFit?: string;
    imageMarginTop?: string;
    imageMarginBottom?: string;
    // Title Element Controls
    titleFontSize?: string;
    titleLineHeight?: string;
    titleMarginBottom?: string;
    titleFontWeight?: string;
    titleFontStyle?: string;
    // Subtitle/Label Element Controls
    labelFontSize?: string;
    labelMarginBottom?: string;
    subtitleFontSize?: string;
    subtitleLetterSpacing?: string;
    subtitleMarginBottom?: string;
    // Description Element Controls
    descriptionFontSize?: string;
    descriptionLineHeight?: string;
    descriptionMarginBottom?: string;
    descriptionMaxWidth?: string;
    // CTA Element Controls
    ctaBorderRadius?: string;
    ctaPaddingX?: string;
    ctaPaddingY?: string;
    ctaFontSize?: string;
    ctaLetterSpacing?: string;
    ctaBorderWidth?: string;
    // Layout Controls
    contentGap?: string;
    sectionPaddingY?: string;
    sectionPaddingX?: string;
    contentTextAlign?: string;
    contentVerticalAlign?: string;
  };

  // Custom colors override dark mode defaults
  const hasCustomBg = content.backgroundColor && content.backgroundColor !== '';
  const hasCustomText = content.textColor && content.textColor !== '';
  const bgClass = hasCustomBg ? '' : (content.dark ? 'bg-[#1a1a1a]' : 'bg-[#f5f5f0]');
  const defaultTextColor = content.dark ? '#ffffff' : '#1a1a1a';
  const imageUrl = content.imageUrl ? getMediaUrl(content.imageUrl) : undefined;
  
  // Per-field colors (fallback to textColor or default)
  const baseTextColor = content.textColor || defaultTextColor;
  const titleColor = content.titleColor || baseTextColor;
  const subtitleColor = content.subtitleColor || content.labelColor || undefined; // Let it use primary color if not set
  const descriptionColor = content.descriptionColor || baseTextColor;
  const ctaTextColor = content.ctaTextColor || baseTextColor;

  // Layout values
  const sectionPaddingY = content.sectionPaddingY || '6rem';
  const sectionPaddingX = content.sectionPaddingX || '1.5rem';
  const contentGap = content.contentGap || '4rem';
  const textAlign = content.contentTextAlign || 'left';

  const sectionStyle: React.CSSProperties = {
    backgroundColor: hasCustomBg ? content.backgroundColor : undefined,
    paddingTop: sectionPaddingY,
    paddingBottom: sectionPaddingY,
    paddingLeft: sectionPaddingX,
    paddingRight: sectionPaddingX,
  };

  // GSAP scroll-triggered animations (matching original Section component)
  useEffect(() => {
    if (!sectionRef.current || isEditing || animationInitialized.current) return;
    
    animationInitialized.current = true;
    
    const ctx = gsap.context(() => {
      // Image parallax and scale effect
      if (imageRef.current) {
        gsap.fromTo(imageRef.current,
          { scale: 1.15, y: -30 },
          {
            scale: 1,
            y: 30,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.5
            }
          }
        );
      }

      // Content reveal animation
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          end: 'bottom top',
          toggleActions: 'play none none reverse'
        }
      });

      // Image reveal with clip-path
      if (imageWrapperRef.current) {
        tl.fromTo(imageWrapperRef.current,
          { clipPath: 'inset(100% 0 0 0)', opacity: 0 },
          { clipPath: 'inset(0% 0 0 0)', opacity: 1, duration: 1.2, ease: 'power4.out' }
        );
      }

      // Content elements staggered reveal
      if (contentRef.current) {
        const subtitle = contentRef.current.querySelector('.je-section-subtitle');
        const title = contentRef.current.querySelector('.je-section-title');
        const desc = contentRef.current.querySelector('.je-section-desc');
        const cta = contentRef.current.querySelector('.je-section-cta');

        if (subtitle) {
          tl.fromTo(subtitle,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
            '-=0.8'
          );
        }
        if (title) {
          tl.fromTo(title,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, ease: 'power3.out' },
            '-=0.6'
          );
        }
        if (desc) {
          tl.fromTo(desc,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, ease: 'power3.out' },
            '-=0.8'
          );
        }
        if (cta) {
          tl.fromTo(cta,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
            '-=0.6'
          );
        }
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [isEditing]);

  return (
    <section ref={sectionRef} className={`${bgClass} overflow-hidden`} style={sectionStyle}>
      <div 
        className={`max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center ${content.reversed ? 'lg:flex-row-reverse' : ''}`}
        style={{ gap: contentGap }}
      >
        {/* Text Content */}
        <div ref={contentRef} className={content.reversed ? 'lg:order-2' : ''} style={{ textAlign: textAlign as any }}>
          {(content.subtitle || content.label) && (
            <p 
              className="je-section-subtitle font-sans uppercase"
              style={{ 
                color: subtitleColor || undefined,
                fontSize: content.labelFontSize || content.subtitleFontSize || '0.75rem',
                letterSpacing: content.subtitleLetterSpacing || '0.2em',
                marginBottom: content.labelMarginBottom || content.subtitleMarginBottom || '1rem',
              }}
            >
              {content.label || content.subtitle}
            </p>
          )}
          
          <h2 
            className="je-section-title font-serif"
            style={{ 
              color: titleColor,
              fontSize: content.titleFontSize || '3rem',
              lineHeight: content.titleLineHeight || '1.2',
              marginBottom: content.titleMarginBottom || '2rem',
              fontWeight: content.titleFontWeight || '300',
              fontStyle: content.titleFontStyle || 'italic',
            }}
          >
            {content.title || 'Section Title'}
          </h2>
          
          {content.description && (
            <p 
              className="je-section-desc font-sans whitespace-pre-wrap" 
              style={{ 
                color: descriptionColor, 
                opacity: isEditing ? 1 : 0.8,
                fontSize: content.descriptionFontSize || '1.125rem',
                lineHeight: content.descriptionLineHeight || '1.75',
                marginBottom: content.descriptionMarginBottom || '2rem',
                maxWidth: content.descriptionMaxWidth || '100%',
              }}
            >
              {content.description}
            </p>
          )}
          
          {content.ctaText && content.ctaLink && (
            <Link 
              href={content.ctaLink}
              className="je-section-cta inline-block border font-sans uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300"
              style={{ 
                color: ctaTextColor, 
                borderColor: ctaTextColor,
                borderRadius: content.ctaBorderRadius || '9999px',
                paddingLeft: content.ctaPaddingX || '1.5rem',
                paddingRight: content.ctaPaddingX || '1.5rem',
                paddingTop: content.ctaPaddingY || '0.75rem',
                paddingBottom: content.ctaPaddingY || '0.75rem',
                fontSize: content.ctaFontSize || '0.875rem',
                letterSpacing: content.ctaLetterSpacing || '0.15em',
                borderWidth: content.ctaBorderWidth || '1px',
              }}
            >
              {content.ctaText}
            </Link>
          )}
        </div>
        
        {/* Image */}
        <EditableElement
          elementId="image"
          elementType="image"
          isEditing={isEditing && isBlockSelected}
          initialWidth={content.imageWidth ? parseInt(content.imageWidth as string) : undefined}
          initialHeight={content.imageHeight ? parseInt(content.imageHeight as string) : undefined}
          className={`relative ${content.reversed ? 'lg:order-1' : ''}`}
        >
          <div 
            ref={imageWrapperRef}
            style={{
              marginTop: content.imageMarginTop || '0',
              marginBottom: content.imageMarginBottom || '0',
            }}
          >
            {imageUrl ? (
              /* Outer wrapper with overflow:hidden and border-radius - NOT animated */
              /* This ensures the border-radius clipping works even when inner content is transformed by GSAP */
              <div 
                className="shadow-2xl shadow-black/10"
                style={{
                  borderRadius: content.imageBorderRadius || '2rem',
                  overflow: 'hidden',
                  width: '100%',
                  maxWidth: content.imageMaxWidth || '100%',
                }}
              >
                {/* Inner wrapper that gets GSAP transform - overflow:hidden here won't clip due to transform */}
                <div 
                  ref={imageRef}
                  className="relative"
                  style={{
                    width: '100%',
                    aspectRatio: '3/4',
                  }}
                >
                  <img
                    src={imageUrl}
                    alt={content.imageAlt || 'Section image'}
                    className="will-change-transform w-full h-full"
                    style={{
                      objectFit: (content.imageObjectFit as any) || 'cover',
                    }}
                    onError={(e) => console.error('[JESectionRenderer] Image error:', e)}
                  />
                  {/* Artistic Overlay like original Section */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 opacity-60 pointer-events-none" />
                </div>
              </div>
            ) : (
              <div 
                className="aspect-[3/4] bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center shadow-2xl shadow-black/10"
                style={{ borderRadius: content.imageBorderRadius || '2rem', overflow: 'hidden' }}
              >
                <span className="text-neutral-400">Add an image</span>
              </div>
            )}
          </div>
        </EditableElement>
      </div>
    </section>
  );
}

// JE Carousel Block Renderer
export function JECarouselRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const animationInitialized = useRef(false);
  
  const content = block.content as {
    title?: string;
    subtitle?: string;
    items?: Array<{
      title: string;
      description?: string;
      imageUrl?: string;
      link?: string;
    }>;
    slides?: Array<{
      title: string;
      description?: string;
      imageUrl?: string;
      link?: string;
    }>;
    // Customization options
    backgroundColor?: string;
    cardBorderRadius?: string;
    cardHeight?: string;
    showTitle?: boolean;
    enableHorizontalScroll?: boolean;
  };

  // Support both 'items' and 'slides' property names
  const carouselItems = content.items || content.slides || [];

  const bgColor = content.backgroundColor || '#f5f5f0';
  const cardRadius = content.cardBorderRadius || '2rem';
  const cardHeight = content.cardHeight || '60vh';
  const showTitle = content.showTitle !== false;
  const enableHorizontalScroll = content.enableHorizontalScroll !== false; // Default true

  // GSAP horizontal scroll pinning (optimized for smooth performance)
  useEffect(() => {
    if (!sectionRef.current || !trackRef.current || isEditing || animationInitialized.current) return;
    if (!enableHorizontalScroll) return;
    
    animationInitialized.current = true;
    
    const ctx = gsap.context(() => {
      const section = sectionRef.current;
      const track = trackRef.current;

      if (!section || !track) return;

      // Cache scroll amount calculation
      let cachedScrollAmount: number | null = null;
      const getScrollAmount = () => {
        if (cachedScrollAmount === null) {
          const trackWidth = track.scrollWidth;
          const viewportWidth = window.innerWidth;
          cachedScrollAmount = -(trackWidth - viewportWidth + 100);
        }
        return cachedScrollAmount;
      };

      // Set GPU acceleration
      gsap.set(track, {
        willChange: 'transform',
        force3D: true,
      });

      // Create the scroll tween with GPU acceleration
      const tween = gsap.to(track, {
        x: getScrollAmount,
        ease: 'none',
        force3D: true,
      });

      // Create optimized ScrollTrigger
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${track.scrollWidth - window.innerWidth}`,
        pin: true,
        animation: tween,
        scrub: 0.5, // Reduced for snappier response
        invalidateOnRefresh: true,
        anticipatePin: 1,
        fastScrollEnd: true,
        onRefresh: () => {
          cachedScrollAmount = null;
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [isEditing, enableHorizontalScroll]);

  // If items are provided in the block, render custom carousel with horizontal scroll pinning
  if (carouselItems.length > 0) {
    return (
      <section 
        ref={sectionRef}
        className="relative h-screen overflow-hidden flex flex-col justify-center"
        style={{ backgroundColor: bgColor }}
      >
        {/* Title Section - Fixed Position */}
        {showTitle && (
          <div className="absolute top-12 left-6 md:left-12 z-10">
            {content.subtitle && (
              <p className="font-sans text-xs uppercase tracking-[0.3em] text-primary/80 mb-4">
                {content.subtitle}
              </p>
            )}
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground font-light italic tracking-tight">
              {content.title || 'Our Offerings'}
            </h2>
          </div>
        )}

        {/* Carousel Track - Horizontal Scroll */}
        <div 
          ref={trackRef}
          className="flex gap-8 md:gap-12 px-6 md:px-12 w-max items-center h-[60vh] md:h-[70vh] pl-[10vw] md:pl-[20vw] z-20"
        >
          {carouselItems.map((item, index) => (
            <div key={index} className="h-full shrink-0">
              {item.link ? (
                <Link href={item.link} className="block h-full">
                  <CarouselCard 
                    item={item} 
                    cardRadius={cardRadius} 
                    cardHeight={cardHeight} 
                  />
                </Link>
              ) : (
                <CarouselCard 
                  item={item} 
                  cardRadius={cardRadius} 
                  cardHeight={cardHeight} 
                />
              )}
            </div>
          ))}
        </div>

        {/* Scroll Indicator - Fixed Position */}
        <div className="absolute bottom-12 left-6 md:left-12 flex items-center gap-4 z-10">
          <span className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Scroll to Explore</span>
          <div className="w-24 h-[1px] bg-muted-foreground/30" />
        </div>
      </section>
    );
  }

  // Default: use the actual Carousel component which fetches from database
  return <Carousel />;
}

// Carousel Card Component with GPU-accelerated animations
function CarouselCard({ 
  item, 
  cardRadius, 
  cardHeight 
}: { 
  item: { title: string; description?: string; imageUrl?: string };
  cardRadius: string;
  cardHeight: string;
}) {
  // Use h-full if cardHeight is a viewport unit, otherwise use the specified height
  const useFullHeight = cardHeight.includes('vh');
  
  return (
    <div 
      className="relative w-[80vw] md:w-[40vw] lg:w-[30vw] group overflow-hidden cursor-pointer shadow-2xl shadow-black/5 bg-gray-900"
      style={{ 
        borderRadius: cardRadius,
        height: useFullHeight ? '100%' : cardHeight,
        willChange: 'transform',
        transform: 'translate3d(0,0,0)',
        transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translate3d(0,-16px,0)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translate3d(0,0,0)';
      }}
    >
      {/* Image Background */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ borderRadius: cardRadius }}
      >
        {item.imageUrl ? (
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center group-hover:scale-110"
            style={{ 
              backgroundImage: `url(${getMediaUrl(item.imageUrl)})`,
              willChange: 'transform',
              transform: 'translate3d(0,0,0) scale(1)',
              transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center">
            <span className="text-white/40 text-sm">Add an image</span>
          </div>
        )}
      </div>
      
      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80"
        style={{ borderRadius: cardRadius }}
      />
      
      {/* Content */}
      <div 
        className="absolute bottom-0 left-0 p-8 md:p-10 w-full z-20"
        style={{
          transform: 'translate3d(0,16px,0)',
          transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        <span className="font-sans text-xs uppercase tracking-[0.2em] text-white/90 mb-4 block border-l-2 border-white/50 pl-3">
          Explore
        </span>
        <h3 className="font-serif text-3xl md:text-4xl text-white mb-4 italic font-light leading-tight drop-shadow-lg">
          {item.title}
        </h3>
        {item.description && (
          <p 
            className="font-sans text-white/90 text-sm tracking-wide opacity-0 group-hover:opacity-100 drop-shadow-md"
            style={{
              transform: 'translate3d(0,16px,0)',
              transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s',
            }}
          >
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}

// JE Newsletter Block Renderer
export function JENewsletterRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
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
export function JEQuoteRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
  const content = block.content as {
    quote?: string;
    author?: string;
    dark?: boolean;
  };

  const bgClass = content.dark ? 'bg-[#1a1a1a] text-white' : 'bg-[#f5f5f0]';

  return (
    <div className={`py-24 px-6 ${bgClass}`}>
      <blockquote className="max-w-4xl mx-auto text-center">
        <p className="font-serif text-3xl md:text-4xl italic leading-relaxed mb-8 whitespace-pre-wrap">
          {content.quote || 'A meaningful quote that represents your brand.'}
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
export function JEPillarGridRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
  const content = block.content as {
    label?: string;
    title?: string;
    description?: string;
    pillars?: Array<{ icon: string; title: string; description: string }>;
    dark?: boolean;
    pillar1Icon?: string;
    pillar1Title?: string;
    pillar1Description?: string;
    pillar2Icon?: string;
    pillar2Title?: string;
    pillar2Description?: string;
    pillar3Icon?: string;
    pillar3Title?: string;
    pillar3Description?: string;
  };

  // Support both pillars array and individual pillar fields
  const defaultPillars = [
    { icon: content.pillar1Icon || 'heart', title: content.pillar1Title || 'Embodiment', description: content.pillar1Description || 'Living wisdom through the body, honoring our physical vessel as sacred ground for transformation.' },
    { icon: content.pillar2Icon || 'sparkles', title: content.pillar2Title || 'Sacred Reciprocity', description: content.pillar2Description || 'Honoring the give and take of life, creating balanced exchanges that nourish all involved.' },
    { icon: content.pillar3Icon || 'crown', title: content.pillar3Title || 'Feminine Wisdom', description: content.pillar3Description || 'Reclaiming ancient knowing, intuitive guidance, and the power of the feminine principle.' },
  ];

  const pillars = (content.pillars && content.pillars.length > 0) ? content.pillars : defaultPillars;
  
  const isDark = content.dark === true;
  const bgClass = isDark ? 'bg-[#1a1a1a]' : 'bg-[#f5f5f0]';
  const textClass = isDark ? 'text-white' : 'text-foreground';
  const subtextClass = isDark ? 'text-white/70' : 'text-neutral-600';

  return (
    <section className={`py-24 px-6 ${bgClass}`}>
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          {content.label && (
            <InlineEditableText
              blockId={block.id}
              fieldName="label"
              value={content.label}
              placeholder="Section Label"
              className="font-sans text-xs uppercase tracking-[0.3em] text-primary mb-4"
              as="p"
            />
          )}
          <InlineEditableText
            blockId={block.id}
            fieldName="title"
            value={content.title || 'The Three Pillars'}
            placeholder="Section Title"
            className={`font-serif text-4xl md:text-5xl italic ${textClass}`}
            as="h2"
          />
          {content.description && (
            <InlineEditableText
              blockId={block.id}
              fieldName="description"
              value={content.description}
              placeholder="Section description..."
              className={`font-sans text-lg max-w-2xl mx-auto mt-6 leading-relaxed ${subtextClass}`}
              as="p"
              multiline
            />
          )}
        </div>
        
        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {pillars.map((pillar, index) => {
            const IconComponent = iconMap[pillar.icon as keyof typeof iconMap] || Heart;
            // Use individual field names for each pillar to enable editing
            const pillarTitleField = `pillar${index + 1}Title`;
            const pillarDescField = `pillar${index + 1}Description`;
            
            return (
              <div key={index} className="text-center group">
                {/* Icon Circle */}
                <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${isDark ? 'bg-white/10' : 'bg-primary/10'}`}>
                  <IconComponent className={`w-10 h-10 ${isDark ? 'text-white' : 'text-primary'}`} />
                </div>
                
                {/* Pillar Title - Editable */}
                <InlineEditableText
                  blockId={block.id}
                  fieldName={pillarTitleField}
                  value={pillar.title}
                  placeholder="Pillar Title"
                  className={`font-serif text-2xl md:text-3xl italic mb-4 ${textClass}`}
                  as="h3"
                />
                
                {/* Pillar Description - Editable */}
                <InlineEditableText
                  blockId={block.id}
                  fieldName={pillarDescField}
                  value={pillar.description}
                  placeholder="Pillar description..."
                  className={`text-base md:text-lg leading-relaxed font-sans ${subtextClass}`}
                  as="p"
                  multiline
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// JE Community Section Renderer (handles je-community, je-community-section)
export function JECommunityRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
  const content = block.content as {
    title?: string;
    subtitle?: string;
    description?: string;
    imageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
    dark?: boolean;
    imageBorderRadius?: string;
    reversed?: boolean;
  };

  const imageUrl = content.imageUrl ? getMediaUrl(content.imageUrl) : undefined;
  const bgClass = content.dark ? 'bg-[#1a1a1a]' : 'bg-[#f5f5f0]';
  const textClass = content.dark ? 'text-white' : 'text-foreground';
  const descClass = content.dark ? 'text-white/70' : 'text-neutral-600';
  const borderClass = content.dark ? 'border-white/30' : 'border-neutral-900';
  const hoverClass = content.dark ? 'hover:bg-white hover:text-black' : 'hover:bg-black hover:text-white';
  const borderRadius = content.imageBorderRadius || '2rem';

  return (
    <section className={`py-24 px-6 ${bgClass}`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Image */}
        <div className={`relative ${content.reversed ? 'lg:order-2' : ''}`}>
          {imageUrl ? (
            <div 
              className="relative overflow-hidden shadow-2xl shadow-black/10"
              style={{ borderRadius: borderRadius }}
            >
              <img
                src={imageUrl}
                alt="Community"
                className="w-full h-auto object-cover transition-transform duration-500 hover:scale-105"
                style={{ borderRadius: borderRadius }}
              />
              {/* Artistic Overlay */}
              <div 
                className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 opacity-60 pointer-events-none"
                style={{ borderRadius: borderRadius }}
              />
            </div>
          ) : (
            <div 
              className="aspect-[4/3] bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center"
              style={{ borderRadius: borderRadius }}
            >
              <span className="text-neutral-400">Add an image</span>
            </div>
          )}
        </div>
        
        {/* Text Content */}
        <div className={content.reversed ? 'lg:order-1' : ''}>
          {content.subtitle && (
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-primary mb-4">
              {content.subtitle}
            </p>
          )}
          
          <h2 className={`font-serif text-4xl md:text-5xl font-light italic mb-8 ${textClass}`}>
            {content.title || 'Join Our Community'}
          </h2>
          
          {content.description && (
            <p className={`font-sans text-lg leading-relaxed mb-8 ${descClass}`}>
              {content.description}
            </p>
          )}
          
          {content.ctaText && content.ctaLink && (
            <Link 
              href={content.ctaLink}
              className={`inline-block px-6 py-3 border ${borderClass} rounded-full font-sans text-sm uppercase tracking-[0.15em] ${hoverClass} transition-all duration-300`}
            >
              {content.ctaText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

// JE Rooted Unity Section Renderer
export function JERootedUnityRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
  const content = block.content as {
    label?: string;
    title?: string;
    subtitle?: string;
    description?: string;
    longDescription?: string;
    imageUrl?: string;
    videoUrl?: string;
    ctaText?: string;
    ctaLink?: string;
    dark?: boolean;
    imageBorderRadius?: string;
    reversed?: boolean;
    features?: string[];
  };

  const mediaUrl = content.videoUrl || content.imageUrl;
  const resolvedMediaUrl = mediaUrl ? getMediaUrl(mediaUrl) : undefined;
  const isVideo = mediaUrl && (/\.(mp4|webm|mov|ogg)$/i.test(mediaUrl) || mediaUrl.includes('video/') || mediaUrl.includes('/media/'));
  
  // Default to dark theme for this block
  const isDark = content.dark !== false;
  const bgClass = isDark ? 'bg-[#1a1a1a]' : 'bg-[#f5f5f0]';
  const textClass = isDark ? 'text-white' : 'text-foreground';
  const descClass = isDark ? 'text-white/70' : 'text-neutral-600';
  const borderClass = isDark ? 'border-white/30' : 'border-neutral-900';
  const hoverClass = isDark ? 'hover:bg-white hover:text-black' : 'hover:bg-black hover:text-white';
  const borderRadius = content.imageBorderRadius || '2rem';

  return (
    <section className={`py-24 px-6 ${bgClass} ${textClass}`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Text Content */}
        <div className={content.reversed ? 'lg:order-2' : ''}>
          {content.label && (
            <InlineEditableText
              blockId={block.id}
              fieldName="label"
              value={content.label}
              placeholder="Section Label"
              className="font-sans text-xs uppercase tracking-[0.3em] text-primary mb-4"
              as="p"
            />
          )}
          {content.subtitle && (
            <InlineEditableText
              blockId={block.id}
              fieldName="subtitle"
              value={content.subtitle}
              placeholder="Subtitle"
              className="font-sans text-xs uppercase tracking-[0.2em] text-primary mb-4"
              as="p"
            />
          )}
          
          <InlineEditableText
            blockId={block.id}
            fieldName="title"
            value={content.title || 'Rooted Unity'}
            placeholder="Section Title"
            className="font-serif text-4xl md:text-5xl font-light italic mb-8"
            as="h2"
          />
          
          {/* Short Description */}
          {content.description && (
            <InlineEditableText
              blockId={block.id}
              fieldName="description"
              value={content.description}
              placeholder="Short description..."
              className={`font-sans text-lg leading-relaxed mb-6 text-center lg:text-left ${descClass}`}
              as="p"
              multiline
            />
          )}
          
          {/* Long Description with preserved line breaks */}
          {content.longDescription && (
            <div className={`font-sans text-base leading-loose mb-8 whitespace-pre-wrap ${descClass}`}>
              <InlineEditableText
                blockId={block.id}
                fieldName="longDescription"
                value={content.longDescription}
                placeholder="Detailed description with line breaks..."
                className="whitespace-pre-wrap"
                as="div"
                multiline
              />
            </div>
          )}
          
          {/* Features List */}
          {content.features && content.features.length > 0 && (
            <ul className={`space-y-3 mb-8 ${descClass}`}>
              {content.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="font-sans text-base">{feature}</span>
                </li>
              ))}
            </ul>
          )}
          
          {content.ctaText && content.ctaLink && (
            <Link 
              href={content.ctaLink}
              className={`inline-block px-6 py-3 border ${borderClass} rounded-full font-sans text-sm uppercase tracking-[0.15em] ${hoverClass} transition-all duration-300`}
            >
              {content.ctaText}
            </Link>
          )}
        </div>
        
        {/* Media (Image or Video) */}
        <div className={`relative ${content.reversed ? 'lg:order-1' : ''}`}>
          {resolvedMediaUrl ? (
            <div 
              className="relative overflow-hidden shadow-2xl shadow-black/10"
              style={{ borderRadius: borderRadius }}
            >
              {isVideo ? (
                <video
                  src={resolvedMediaUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-auto object-cover transition-transform duration-500 hover:scale-105"
                  style={{ borderRadius: borderRadius }}
                />
              ) : (
                <img
                  src={resolvedMediaUrl}
                  alt="Rooted Unity"
                  className="w-full h-auto object-cover transition-transform duration-500 hover:scale-105"
                  style={{ borderRadius: borderRadius }}
                />
              )}
              {/* Artistic Overlay */}
              <div 
                className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 opacity-60 pointer-events-none"
                style={{ borderRadius: borderRadius }}
              />
            </div>
          ) : (
            <div 
              className="aspect-[4/3] bg-neutral-700 flex items-center justify-center"
              style={{ borderRadius: borderRadius }}
            >
              <span className="text-neutral-400">Add an image or video</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// JE Heading Renderer
export function JEHeadingRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
  const content = block.content as Record<string, unknown> & {
    title?: string;
    text?: string; // Legacy support
    label?: string;
    level?: 'h1' | 'h2' | 'h3' | 'h4';
    alignment?: 'left' | 'center' | 'right';
    dark?: boolean;
  };
  
  // Support both 'title' (from blockTypes) and 'text' (legacy) field names
  const headingText = content.title || content.text || '';

  const HeadingTag = content.level || 'h2';
  const alignClass = content.alignment === 'center' ? 'text-center' : content.alignment === 'right' ? 'text-right' : 'text-left';
  const sizeClass = content.level === 'h1' ? 'text-5xl md:text-7xl' : content.level === 'h3' ? 'text-3xl md:text-4xl' : content.level === 'h4' ? 'text-2xl md:text-3xl' : 'text-4xl md:text-5xl';

  // Build inline styles from Style tab using helper functions
  const containerStyle = buildContainerStyles(content);
  const textStyle = buildTextStyles(content);

  return (
    <div className={`py-8 ${alignClass}`} style={containerStyle}>
      {content.label && (
        <InlineEditableText
          blockId={block.id}
          fieldName="label"
          value={content.label || ''}
          placeholder="Add label..."
          className="font-sans text-xs uppercase tracking-[0.2em] text-primary mb-4"
          as="p"
        />
      )}
      <InlineEditableText
        blockId={block.id}
        fieldName="title"
        value={headingText}
        placeholder="Heading Text"
        className={`font-serif ${sizeClass} font-light italic`}
        style={textStyle}
        as={HeadingTag as 'h1' | 'h2' | 'h3' | 'h4'}
      />
    </div>
  );
}

// JE Paragraph Renderer
export function JEParagraphRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
  const content = block.content as Record<string, unknown> & {
    text?: string;
    alignment?: 'left' | 'center' | 'right';
    size?: 'small' | 'medium' | 'large';
    fontSize?: string;
    fontFamily?: string;
    dark?: boolean;
    maxWidth?: string;
    maxWidthContent?: string; // Legacy support
  };

  // Static maxWidth classes - Tailwind cannot use dynamic class names
  // Support both lowercase and capitalized values
  const maxWidthClasses: Record<string, string> = {
    'narrow': 'max-w-2xl',      // 672px
    'Narrow': 'max-w-2xl',
    'medium': 'max-w-4xl',      // 896px  
    'Medium': 'max-w-4xl',
    'wide': 'max-w-6xl',        // 1152px
    'Wide': 'max-w-6xl',
    'full': 'max-w-full',       // 100%
    'Full': 'max-w-full',
  };

  const alignmentClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  // Support both maxWidth (new) and maxWidthContent (legacy)
  const maxWidthValue = content.maxWidth || content.maxWidthContent || 'narrow';
  const maxWidthClass = maxWidthClasses[maxWidthValue] || 'max-w-2xl';
  const alignClass = alignmentClasses[content.alignment || 'center'] || 'text-center';
  
  const textClass = content.dark ? 'text-white/70' : 'text-neutral-600';

  // Build inline styles from Style tab using helper functions
  const containerStyle: React.CSSProperties = {
    ...buildContainerStyles(content),
    backgroundColor: content.backgroundColor ? content.backgroundColor as string : undefined,
  };
  
  // Font size and font family - support actual pixel values and legacy Tailwind values
  const fontSizeValue = content.fontSize;
  const fontFamilyValue = content.fontFamily;
  const hasCustomFont = fontFamilyValue && fontFamilyValue !== 'default';
  const textStyle: React.CSSProperties = {
    ...buildTextStyles(content),
    // Apply actual font size if it's a pixel value
    fontSize: fontSizeValue && fontSizeValue.includes('px') ? fontSizeValue : undefined,
    // Apply font family if set (not 'default')
    fontFamily: hasCustomFont ? `"${fontFamilyValue}", sans-serif` : undefined,
  };

  // Apply fontFamily to container so it cascades to all children
  const finalContainerStyle: React.CSSProperties = {
    ...containerStyle,
    ...(hasCustomFont ? { fontFamily: `"${fontFamilyValue}", sans-serif` } : {}),
  };

  // Generate unique class for this block's font
  const fontClass = hasCustomFont ? `font-block-${block.id.replace(/[^a-z0-9]/gi, '')}` : '';

  return (
    <div className={`py-8 px-6 mx-auto ${maxWidthClass} ${alignClass}`}>
      {/* Inject scoped CSS for custom font with !important */}
      {hasCustomFont && (
        <style>{`.${fontClass}, .${fontClass} * { font-family: '${fontFamilyValue}', cursive, sans-serif !important; }`}</style>
      )}
      <p className={`${fontClass} ${hasCustomFont ? '' : 'font-sans '}text-base md:text-lg leading-relaxed whitespace-pre-wrap ${textClass}`}>
        <InlineEditableText
          blockId={block.id}
          fieldName="text"
          value={content.text || ''}
          placeholder="Add your paragraph text here..."
          className=""
          as="span"
          multiline={true}
        />
      </p>
    </div>
  );
}

// JE Image Renderer
export function JEImageRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
  const content = block.content as {
    imageUrl?: string;
    alt?: string;
    caption?: string;
    rounded?: boolean;
    shadow?: boolean;
    borderRadius?: string;
    maxWidth?: string;
    width?: string;
    alignment?: 'left' | 'center' | 'right';
  };

  const imageUrl = content.imageUrl ? getMediaUrl(content.imageUrl) : undefined;
  // Default to rounded unless explicitly set to false
  const isRounded = content.rounded !== false;
  const borderRadius = content.borderRadius || '2rem';
  
  // Support both maxWidth (new) and width (legacy) - map to Tailwind classes
  const sizeValue = content.maxWidth || content.width || '100%';
  
  // Map size values to inline maxWidth styles for precise control
  const getWidthStyle = (size: string): React.CSSProperties => {
    switch(size) {
      case '10%': return { maxWidth: '10%', width: '10%' };
      case '15%': return { maxWidth: '15%', width: '15%' };
      case '20%': return { maxWidth: '20%', width: '20%' };
      case '25%': return { maxWidth: '25%', width: '25%' };
      case '33%':
      case 'small': return { maxWidth: '33.333%', width: '33.333%' };
      case '50%': return { maxWidth: '50%', width: '50%' };
      case '66%':
      case 'medium': return { maxWidth: '66.666%', width: '66.666%' };
      case '75%': return { maxWidth: '75%', width: '75%' };
      case '100%':
      case 'large':
      case 'full':
      default: return { maxWidth: '100%', width: '100%' };
    }
  };
  
  const widthStyles = getWidthStyle(sizeValue);
  const alignment = content.alignment || 'center';
  const alignmentClass = alignment === 'left' ? 'mr-auto' : alignment === 'right' ? 'ml-auto' : 'mx-auto';

  return (
    <figure className="py-8">
      {imageUrl ? (
        <div 
          className={`relative overflow-hidden ${alignmentClass} ${content.shadow ? 'shadow-2xl shadow-black/10' : ''}`}
          style={{ borderRadius: isRounded ? borderRadius : '0', ...widthStyles }}
        >
          <img
            src={imageUrl}
            alt={content.alt || 'Image'}
            className="w-full h-auto block"
            style={{ borderRadius: isRounded ? borderRadius : '0' }}
            onError={(e) => console.error('[JEImageRenderer] Image error:', e)}
          />
        </div>
      ) : (
        <div 
          className={`aspect-video bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center ${alignmentClass}`}
          style={{ borderRadius: borderRadius, ...widthStyles }}
        >
          <span className="text-neutral-400">Add an image</span>
        </div>
      )}
      {content.caption && (
        <figcaption className="mt-4 text-center text-sm text-neutral-500 dark:text-neutral-400 italic">
          {content.caption}
        </figcaption>
      )}
    </figure>
  );
}

// JE Video Renderer
export function JEVideoRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
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
        <div className="relative rounded-[2rem] overflow-hidden bg-black shadow-2xl shadow-black/20">
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            autoPlay={content.autoplay}
            loop={content.loop !== false}
            muted={isMuted}
            playsInline
            crossOrigin="anonymous"
            preload="auto"
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
export function JEButtonRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
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
        <Link 
          href={content.link}
          className={`inline-block ${sizeClass} ${variantClass} rounded-full font-sans uppercase tracking-[0.15em] transition-all duration-300`}
        >
          {content.text || 'Button'}
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
export function JETwoColumnRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
  const content = block.content as {
    leftContent?: string;
    rightContent?: string;
    leftTitle?: string;
    rightTitle?: string;
    imageUrl?: string;
    imagePosition?: 'left' | 'right';
    dark?: boolean;
    textColor?: string;
    backgroundColor?: string;
  };

  // Custom colors override dark mode defaults
  const hasCustomBg = content.backgroundColor && content.backgroundColor !== '';
  const hasCustomText = content.textColor && content.textColor !== '';
  const bgClass = hasCustomBg ? '' : (content.dark ? 'bg-[#1a1a1a]' : 'bg-[#f5f5f0]');
  const textClass = hasCustomText ? '' : (content.dark ? 'text-white/70' : 'text-neutral-600');
  const imageUrl = content.imageUrl ? getMediaUrl(content.imageUrl) : undefined;

  const sectionStyle: React.CSSProperties = {
    backgroundColor: hasCustomBg ? content.backgroundColor : undefined,
    color: hasCustomText ? content.textColor : undefined,
  };

  return (
    <section className={`py-24 px-6 ${bgClass}`} style={sectionStyle}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className={content.imagePosition === 'right' ? 'lg:order-1' : 'lg:order-2'}>
          {content.leftTitle && (
            <h3 className="font-serif text-3xl italic mb-6">{content.leftTitle}</h3>
          )}
          <p className={`font-sans text-lg leading-relaxed ${textClass}`} style={hasCustomText ? { opacity: 0.7 } : undefined}>
            {content.leftContent || 'Left column content...'}
          </p>
        </div>
        <div className={content.imagePosition === 'right' ? 'lg:order-2' : 'lg:order-1'}>
          {imageUrl ? (
            <div className="relative overflow-hidden shadow-2xl shadow-black/10" style={{ borderRadius: '2rem' }}>
              <img src={imageUrl} alt="" className="w-full h-auto" style={{ borderRadius: '2rem' }} />
            </div>
          ) : (
            <>
              {content.rightTitle && (
                <h3 className="font-serif text-3xl italic mb-6">{content.rightTitle}</h3>
              )}
              <p className={`font-sans text-lg leading-relaxed ${textClass}`} style={hasCustomText ? { opacity: 0.7 } : undefined}>
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
export function JEDividerRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
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
export function JESpacerRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
  const content = block.content as {
    height?: 'small' | 'medium' | 'large' | 'xlarge';
  };

  const heightClass = content.height === 'small' ? 'h-8' : content.height === 'large' ? 'h-24' : content.height === 'xlarge' ? 'h-32' : 'h-16';

  return <div className={heightClass} />;
}

// JE FAQ Renderer
export function JEFAQRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
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
export function JEContactFormRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
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
export function JETestimonialRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
  const content = block.content as {
    quote?: string;
    author?: string;
    role?: string;
    imageUrl?: string;
    avatar?: string;
    dark?: boolean;
    avatarSize?: string;
    style?: string;
  };

  const bgClass = content.dark ? 'bg-[#1a1a1a] text-white' : 'bg-[#f5f5f0]';
  const textClass = content.dark ? 'text-white' : 'text-foreground';
  const roleClass = content.dark ? 'text-white/60' : 'text-neutral-500';
  // Support both 'imageUrl' and 'avatar' property names
  const imageUrl = (content.imageUrl || content.avatar) ? getMediaUrl(content.imageUrl || content.avatar || '') : undefined;
  const avatarSize = content.avatarSize || '4rem'; // 64px default

  return (
    <section className={`py-24 px-6 ${bgClass}`}>
      <div className="max-w-4xl mx-auto text-center">
        <blockquote className={`font-serif text-3xl md:text-4xl italic leading-relaxed mb-8 ${textClass}`}>
          "{content.quote || 'A powerful testimonial from a satisfied client.'}"
        </blockquote>
        <div className="flex items-center justify-center gap-4">
          {imageUrl && (
            <div 
              className="relative overflow-hidden rounded-full shadow-lg shadow-black/10 flex-shrink-0"
              style={{ width: avatarSize, height: avatarSize }}
            >
              <img 
                src={imageUrl} 
                alt={content.author} 
                className="w-full h-full object-cover" 
              />
            </div>
          )}
          <div className="text-left">
            <p className={`font-sans font-medium ${textClass}`}>{content.author || 'Client Name'}</p>
            {content.role && (
              <p className={`font-sans text-sm ${roleClass}`}>
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
export function JEOfferingsGridRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
  const content = block.content as {
    title?: string;
    items?: Array<{
      title: string;
      description?: string;
      imageUrl?: string;
      link?: string;
    }>;
    offerings?: Array<{
      title: string;
      description?: string;
      imageUrl?: string;
      link?: string;
    }>;
    columns?: number;
    minHeight?: string;
    dark?: boolean;
    cardBorderRadius?: string;
  };

  // Support both 'items' and 'offerings' property names
  const items = content.items || content.offerings || [];
  const bgClass = content.dark ? 'bg-[#1a1a1a]' : 'bg-[#f5f5f0]';
  const cardBgClass = content.dark ? 'bg-neutral-800' : 'bg-white';
  const textClass = content.dark ? 'text-white' : 'text-foreground';
  const descClass = content.dark ? 'text-neutral-400' : 'text-neutral-600';
  const cardRadius = content.cardBorderRadius || '2rem';

  return (
    <section className={`py-24 px-6 ${bgClass}`}>
      <div className="max-w-7xl mx-auto">
        {content.title && (
          <h2 className={`font-serif text-4xl md:text-5xl italic text-center mb-16 ${textClass}`}>{content.title}</h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, index) => (
            <div 
              key={index} 
              className={`${cardBgClass} overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2`}
              style={{ borderRadius: cardRadius }}
            >
              {item.imageUrl && (
                <div className="relative overflow-hidden" style={{ borderTopLeftRadius: cardRadius, borderTopRightRadius: cardRadius }}>
                  <img
                    src={getMediaUrl(item.imageUrl)}
                    alt={item.title}
                    className="w-full h-48 object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className={`font-serif text-xl italic mb-2 ${textClass}`}>{item.title}</h3>
                {item.description && (
                  <p className={`${descClass} text-sm mb-4`}>{item.description}</p>
                )}
                {item.link && (
                  <Link 
                    href={item.link}
                    className="inline-flex items-center text-primary text-sm font-medium"
                  >
                    Learn More <ArrowRight className="w-4 h-4 ml-2" />
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
export function JEComingSoonRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
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

// JE Gallery Renderer with Carousel Mode
export function JEGalleryRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const content = block.content as {
    images?: Array<{ url: string; alt?: string; caption?: string }>;
    columns?: number;
    dark?: boolean;
    imageBorderRadius?: string;
    imageHeight?: string;
    displayMode?: 'grid' | 'carousel';
    autoPlay?: boolean;
    autoPlayInterval?: number;
    showDots?: boolean;
    showArrows?: boolean;
    carouselMaxWidth?: string;
  };

  const images = content.images || [];
  const columns = content.columns || 3;
  const bgClass = content.dark ? 'bg-[#1a1a1a]' : 'bg-[#f5f5f0]';
  const borderRadius = content.imageBorderRadius || '2rem';
  const imageHeight = content.imageHeight || '16rem';
  const displayMode = content.displayMode || 'grid';
  const autoPlay = content.autoPlay ?? false;
  const autoPlayInterval = content.autoPlayInterval || 5000;
  const showDots = content.showDots ?? true;
  const showArrows = content.showArrows ?? true;
  const carouselMaxWidth = content.carouselMaxWidth || '48rem';

  // Auto-play functionality for carousel
  useEffect(() => {
    if (displayMode !== 'carousel' || !autoPlay || images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoPlayInterval);
    
    return () => clearInterval(interval);
  }, [displayMode, autoPlay, autoPlayInterval, images.length]);

  const goToSlide = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToPrev = () => {
    if (isTransitioning || images.length <= 1) return;
    goToSlide((currentIndex - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    if (isTransitioning || images.length <= 1) return;
    goToSlide((currentIndex + 1) % images.length);
  };

  // Carousel Mode - Pure image carousel without captions
  if (displayMode === 'carousel') {
    return (
      <section className={`py-12 md:py-16 px-6 ${bgClass}`}>
        <div className="mx-auto" style={{ maxWidth: carouselMaxWidth }}>
          {/* Main Image */}
          <div className="relative">
            <figure 
              className="relative overflow-hidden shadow-2xl"
              style={{ borderRadius: borderRadius }}
            >
              {images.length > 0 ? (
                <img
                  src={getMediaUrl(images[currentIndex]?.url || '')}
                  alt={images[currentIndex]?.alt || `Image ${currentIndex + 1}`}
                  className="w-full object-cover transition-opacity duration-500"
                  style={{ 
                    height: 'auto',
                    minHeight: '20rem',
                    maxHeight: '36rem',
                    borderRadius: borderRadius,
                    opacity: isTransitioning ? 0.7 : 1,
                  }}
                />
              ) : (
                <div className="w-full h-64 bg-neutral-300 flex items-center justify-center" style={{ borderRadius }}>
                  <p className="text-neutral-500">No images</p>
                </div>
              )}
            </figure>

            {/* Navigation Arrows */}
            {showArrows && images.length > 1 && (
              <>
                <button
                  onClick={goToPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 dark:bg-black/70 shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-black transition-all duration-300 hover:scale-110"
                  aria-label="Previous image"
                >
                  <svg className="w-6 h-6 text-neutral-700 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 dark:bg-black/70 shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-black transition-all duration-300 hover:scale-110"
                  aria-label="Next image"
                >
                  <svg className="w-6 h-6 text-neutral-700 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Dots Navigation */}
          {showDots && images.length > 1 && (
            <div className="flex justify-center gap-3 mt-6">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-primary scale-125'
                      : content.dark 
                        ? 'bg-white/40 hover:bg-white/60' 
                        : 'bg-neutral-400 hover:bg-neutral-600'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  // Grid Mode (default)
  return (
    <section className={`py-24 px-6 ${bgClass}`}>
      <div className="max-w-7xl mx-auto">
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6`}>
          {images.map((image, index) => (
            <figure 
              key={index} 
              className="relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              style={{ borderRadius: borderRadius }}
            >
              <img
                src={getMediaUrl(image.url)}
                alt={image.alt || `Gallery image ${index + 1}`}
                className="w-full object-cover hover:scale-105 transition-transform duration-500"
                style={{ height: imageHeight, borderRadius: borderRadius }}
              />
              {image.caption && (
                <figcaption 
                  className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white text-sm"
                  style={{ borderBottomLeftRadius: borderRadius, borderBottomRightRadius: borderRadius }}
                >
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
export function JETeamMemberRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
  const content = block.content as {
    name?: string;
    role?: string;
    bio?: string;
    imageUrl?: string;
    dark?: boolean;
    imageSize?: string;
    reversed?: boolean;
  };

  const bgClass = content.dark ? 'bg-[#1a1a1a] text-white' : 'bg-[#f5f5f0]';
  const textClass = content.dark ? 'text-white' : 'text-foreground';
  const descClass = content.dark ? 'text-white/70' : 'text-neutral-600';
  const placeholderBg = content.dark ? 'bg-neutral-700' : 'bg-neutral-300';
  const imageUrl = content.imageUrl ? getMediaUrl(content.imageUrl) : undefined;
  const imageSize = content.imageSize || '16rem'; // 256px default

  return (
    <section className={`py-24 px-6 ${bgClass}`}>
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12 items-center">
        <div className={`relative flex-shrink-0 ${content.reversed ? 'md:order-2' : ''}`}>
          {imageUrl ? (
            <div 
              className="relative overflow-hidden rounded-full shadow-2xl shadow-black/10 group"
              style={{ width: imageSize, height: imageSize }}
            >
              <img
                src={imageUrl}
                alt={content.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Subtle overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-full" />
            </div>
          ) : (
            <div 
              className={`rounded-full ${placeholderBg} flex items-center justify-center`}
              style={{ width: imageSize, height: imageSize }}
            >
              <span className="text-neutral-500">Add photo</span>
            </div>
          )}
        </div>
        <div className={content.reversed ? 'md:order-1' : ''}>
          <h3 className={`font-serif text-3xl italic mb-2 ${textClass}`}>{content.name || 'Team Member'}</h3>
          {content.role && (
            <p className="font-sans text-sm uppercase tracking-[0.2em] text-primary mb-6">{content.role}</p>
          )}
          {content.bio && (
            <p className={`font-sans text-lg leading-relaxed ${descClass}`}>
              {content.bio}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// JE Principles Renderer
export function JEPrinciplesRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
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
export function JEFooterRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
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
export function JEVolumesRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
  const content = block.content as {
    title?: string;
    volumes?: Array<{
      title: string;
      description?: string;
      imageUrl?: string;
      link?: string;
    }>;
    dark?: boolean;
    cardBorderRadius?: string;
  };

  const volumes = content.volumes || [];
  const bgClass = content.dark ? 'bg-[#1a1a1a]' : 'bg-[#f5f5f0]';
  const cardBgClass = content.dark ? 'bg-neutral-800' : 'bg-white';
  const textClass = content.dark ? 'text-white' : 'text-foreground';
  const descClass = content.dark ? 'text-neutral-400' : 'text-neutral-600';
  const cardRadius = content.cardBorderRadius || '2rem';

  return (
    <section className={`py-24 px-6 ${bgClass}`}>
      <div className="max-w-7xl mx-auto">
        {content.title && (
          <h2 className={`font-serif text-4xl italic text-center mb-16 ${textClass}`}>{content.title}</h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {volumes.map((volume, index) => (
            <div 
              key={index} 
              className={`${cardBgClass} overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2`}
              style={{ borderRadius: cardRadius }}
            >
              {volume.imageUrl && (
                <div className="relative overflow-hidden" style={{ borderTopLeftRadius: cardRadius, borderTopRightRadius: cardRadius }}>
                  <img
                    src={getMediaUrl(volume.imageUrl)}
                    alt={volume.title}
                    className="w-full h-64 object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className={`font-serif text-xl italic mb-2 ${textClass}`}>{volume.title}</h3>
                {volume.description && (
                  <p className={`${descClass} text-sm mb-4`}>{volume.description}</p>
                )}
                {volume.link && (
                  <Link 
                    href={volume.link}
                    className="inline-flex items-center text-primary text-sm font-medium"
                  >
                    Read More <ArrowRight className="w-4 h-4 ml-2" />
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
export function JEFeatureCardRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
  const content = block.content as {
    title?: string;
    description?: string;
    icon?: string;
    link?: string;
    dark?: boolean;
  };

  const bgClass = content.dark ? 'bg-[#1a1a1a] text-white' : 'bg-white';
  const IconComponent = iconMap[(content.icon || 'star') as keyof typeof iconMap] || Star;

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
        <Link 
          href={content.link}
          className="mt-4 inline-flex items-center text-primary text-sm font-medium"
        >
          Learn More <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      )}
    </div>
  );
}


// ==========================================
// JE CALENDAR RENDERER
// ==========================================

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  description?: string;
  link?: string;
}

interface EventType {
  id: string;
  name: string;
  color: string;
}

export function JECalendarRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
  const content = block.content as {
    title?: string;
    subtitle?: string;
    viewMode?: 'calendar' | 'list';
    showFilters?: boolean;
    eventTypes?: EventType[];
    events?: CalendarEvent[];
  };

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>(content.viewMode || 'calendar');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const eventTypes = content.eventTypes || [
    { id: 'workshop', name: 'Workshop', color: '#FFD700' },
    { id: 'retreat', name: 'Retreat', color: '#22C55E' },
    { id: 'webinar', name: 'Webinar', color: '#14B8A6' },
    { id: 'meetup', name: 'Meetup', color: '#3B82F6' },
    { id: 'conference', name: 'Conference', color: '#EC4899' },
    { id: 'other', name: 'Other', color: '#6B7280' },
  ];

  const events = content.events || [];

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);

  // Get events for a specific date
  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(event => {
      const eventDate = event.date?.split('T')[0];
      const matchesDate = eventDate === dateStr;
      const matchesFilter = !selectedFilter || event.type === selectedFilter;
      return matchesDate && matchesFilter;
    });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <section className="py-12 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* View Toggle */}
        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              viewMode === 'calendar'
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            📅 Calendar View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            ☰ List View
          </button>
        </div>

        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h3 className="font-serif text-2xl">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={goToPrevMonth}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                ‹
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm hover:bg-neutral-100 rounded-full transition-colors"
              >
                Today
              </button>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                ›
              </button>
            </div>
          </div>
          {content.showFilters && (
            <button
              onClick={() => setSelectedFilter(null)}
              className="flex items-center gap-2 px-3 py-1 text-sm hover:bg-neutral-100 rounded-full transition-colors"
            >
              🔽 Filter
            </button>
          )}
        </div>

        {viewMode === 'calendar' ? (
          <>
            {/* Calendar Grid */}
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              {/* Day Headers */}
              <div className="grid grid-cols-7 bg-neutral-50 border-b border-neutral-200">
                {dayNames.map(day => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-neutral-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {/* Empty cells for days before the 1st */}
                {Array.from({ length: startingDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[100px] p-2 border-b border-r border-neutral-100 bg-neutral-50" />
                ))}

                {/* Days of the month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayEvents = getEventsForDate(day);
                  const isTodayCell = isToday(day);

                  return (
                    <div
                      key={day}
                      className={`min-h-[100px] p-2 border-b border-r border-neutral-100 ${
                        isTodayCell ? 'bg-primary/5 ring-2 ring-primary ring-inset' : ''
                      }`}
                    >
                      <span className={`text-sm ${isTodayCell ? 'font-bold text-primary' : 'text-neutral-600'}`}>
                        {day}
                      </span>
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 3).map((event, idx) => {
                          const eventType = eventTypes.find(t => t.id === event.type);
                          return (
                            <div
                              key={idx}
                              className="text-xs px-1 py-0.5 rounded truncate"
                              style={{ backgroundColor: eventType?.color + '30', color: eventType?.color }}
                            >
                              {event.title}
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-neutral-400">+{dayEvents.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Event Type Legend */}
            <div className="flex flex-wrap gap-4 mt-6 justify-center">
              {eventTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setSelectedFilter(selectedFilter === type.id ? null : type.id)}
                  className={`flex items-center gap-2 text-sm ${
                    selectedFilter === type.id ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  {type.name}
                </button>
              ))}
            </div>
          </>
        ) : (
          /* List View */
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-12 text-neutral-400">
                No events scheduled
              </div>
            ) : (
              events
                .filter(event => !selectedFilter || event.type === selectedFilter)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((event, idx) => {
                  const eventType = eventTypes.find(t => t.id === event.type);
                  const eventDate = new Date(event.date);
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-4 p-4 border border-neutral-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="text-center min-w-[60px]">
                        <div className="text-2xl font-bold text-primary">{eventDate.getDate()}</div>
                        <div className="text-xs text-neutral-500 uppercase">
                          {monthNames[eventDate.getMonth()].slice(0, 3)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: eventType?.color }}
                          />
                          <span className="text-xs text-neutral-500">{eventType?.name}</span>
                        </div>
                        <h4 className="font-medium">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-neutral-600 mt-1">{event.description}</p>
                        )}
                      </div>
                      {event.link && (
                        <Link 
                          href={event.link}
                          className="text-primary text-sm hover:underline"
                        >
                          View →
                        </Link>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        )}
      </div>
    </section>
  );
}
