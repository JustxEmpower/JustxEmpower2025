import React, { memo, useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { PageBlock } from '../usePageBuilderStore';
import Carousel from '@/components/Carousel';
import NewsletterSignup from '@/components/NewsletterSignup';
import { Heart, Compass, Crown, Leaf, Star, Sparkles, ChevronDown, Mail, Phone, MapPin, ArrowRight, Play, Pause, Volume2, VolumeX, AlertCircle, ImageIcon } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { InlineEditableText } from '../InlineEditableText';
import EditableElement from '../EditableElement';

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
export function JEHeroRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

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

  // Build section style with dynamic border radius
  const sectionStyle: React.CSSProperties = {
    minHeight: minHeight === '100vh' ? '500px' : minHeight,
    borderBottomLeftRadius: bottomCurve ? borderRadius : 0,
    borderBottomRightRadius: bottomCurve ? borderRadius : 0,
  };

  return (
    <section 
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
        className={`relative h-full min-h-[500px] flex flex-col ${verticalAlignClass} ${horizontalAlignClass} pt-${paddingTop} pb-${paddingBottom} pl-${paddingLeft} pr-${paddingRight}`}
        style={{ zIndex: 10 }}
      >
        <div className={maxWidthClass}>
          {content.subtitle && (
            <p 
              className="font-sans uppercase" 
              style={{ 
                color: subtitleColor, 
                opacity: 0.9,
                fontSize: content.subtitleFontSize || '0.75rem',
                letterSpacing: content.subtitleLetterSpacing || '0.3em',
                marginBottom: content.subtitleMarginBottom || '1.5rem',
              }}
            >
              {content.subtitle}
            </p>
          )}
          
          <h1 
            className="font-serif"
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
              className="font-sans" 
              style={{ 
                color: descriptionColor, 
                opacity: 0.9,
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
            <Link href={content.ctaLink}>
              <a 
                className="inline-block border font-sans uppercase transition-all duration-500"
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
              </a>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

// JE Section Block Renderer (handles je-section-standard, je-section-fullwidth, je-section-full-width)
export function JESectionRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
  
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

  return (
    <section className={bgClass} style={sectionStyle}>
      <div 
        className={`max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center ${content.reversed ? 'lg:flex-row-reverse' : ''}`}
        style={{ gap: contentGap }}
      >
        {/* Text Content */}
        <div className={content.reversed ? 'lg:order-2' : ''} style={{ textAlign: textAlign as any }}>
          {(content.subtitle || content.label) && (
            <p 
              className="font-sans uppercase"
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
            className="font-serif"
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
              className="font-sans" 
              style={{ 
                color: descriptionColor, 
                opacity: 0.8,
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
            <Link href={content.ctaLink}>
              <a 
                className="inline-block border font-sans uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300"
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
              </a>
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
            style={{
              marginTop: content.imageMarginTop || '0',
              marginBottom: content.imageMarginBottom || '0',
            }}
          >
            {imageUrl ? (
              <div 
                className="relative overflow-hidden"
                style={{
                  borderRadius: content.imageBorderRadius || '2rem',
                  width: '100%',
                  maxWidth: content.imageMaxWidth || '100%',
                }}
              >
                <img
                  src={imageUrl}
                  alt={content.imageAlt || 'Section image'}
                  style={{
                    width: '100%',
                    height: 'auto',
                    objectFit: (content.imageObjectFit as any) || 'cover',
                  }}
                  onError={(e) => console.error('[JESectionRenderer] Image error:', e)}
                />
              </div>
            ) : (
              <div 
                className="aspect-[4/3] bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center"
                style={{ borderRadius: content.imageBorderRadius || '2rem' }}
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
  const content = block.content as {
    title?: string;
    subtitle?: string;
    items?: Array<{
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
  };

  const bgColor = content.backgroundColor || '#f5f5f0';
  const cardRadius = content.cardBorderRadius || '2rem';
  const cardHeight = content.cardHeight || '400px';
  const showTitle = content.showTitle !== false;

  // If items are provided in the block, render custom carousel
  if (content.items && content.items.length > 0) {
    return (
      <section 
        className="relative py-24 overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        {/* Title Section */}
        {showTitle && (
          <div className="px-6 md:px-12 mb-12">
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

        {/* Carousel Track */}
        <div className="flex gap-8 md:gap-12 px-6 md:px-12 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide">
          {content.items.map((item, index) => (
            <div key={index} className="flex-shrink-0 snap-start">
              {item.link ? (
                <Link href={item.link}>
                  <a className="block">
                    <CarouselCard 
                      item={item} 
                      cardRadius={cardRadius} 
                      cardHeight={cardHeight} 
                    />
                  </a>
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

        {/* Scroll Indicator */}
        <div className="px-6 md:px-12 mt-8 flex items-center gap-4">
          <span className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground">Scroll to Explore</span>
          <div className="w-24 h-[1px] bg-muted-foreground/30" />
        </div>
      </section>
    );
  }

  // Default: use the actual Carousel component which fetches from database
  return <Carousel />;
}

// Carousel Card Component with curved edges
function CarouselCard({ 
  item, 
  cardRadius, 
  cardHeight 
}: { 
  item: { title: string; description?: string; imageUrl?: string };
  cardRadius: string;
  cardHeight: string;
}) {
  return (
    <div 
      className="relative w-[80vw] md:w-[40vw] lg:w-[30vw] group overflow-hidden cursor-pointer shadow-2xl shadow-black/5 transition-all duration-500 hover:-translate-y-4 bg-gray-900"
      style={{ 
        borderRadius: cardRadius,
        height: cardHeight,
      }}
    >
      {/* Image Background */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ borderRadius: cardRadius }}
      >
        {item.imageUrl ? (
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
            style={{ backgroundImage: `url(${getMediaUrl(item.imageUrl)})` }}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center">
            <span className="text-white/40 text-sm">Add an image</span>
          </div>
        )}
      </div>
      
      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 transition-opacity duration-500"
        style={{ borderRadius: cardRadius }}
      />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 p-8 md:p-10 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 z-20">
        <span className="font-sans text-xs uppercase tracking-[0.2em] text-white/90 mb-4 block border-l-2 border-white/50 pl-3">
          Explore
        </span>
        <h3 className="font-serif text-3xl md:text-4xl text-white mb-4 italic font-light leading-tight drop-shadow-lg">
          {item.title}
        </h3>
        {item.description && (
          <p className="font-sans text-white/90 text-sm tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 transform translate-y-4 group-hover:translate-y-0 drop-shadow-md">
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
export function JEPillarGridRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
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
export function JECommunityRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
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
export function JERootedUnityRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
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
    dark?: boolean;
    maxWidthContent?: string;
  };

  const alignClass = content.alignment === 'center' ? 'text-center' : content.alignment === 'right' ? 'text-right' : 'text-left';
  const sizeClass = content.size === 'small' ? 'text-base' : content.size === 'large' ? 'text-xl' : 'text-lg';
  const textClass = content.dark ? 'text-white/70' : 'text-neutral-600';

  // Build inline styles from Style tab using helper functions
  const containerStyle: React.CSSProperties = {
    ...buildContainerStyles(content),
    // Force apply backgroundColor if it exists
    backgroundColor: content.backgroundColor ? content.backgroundColor as string : undefined,
  };
  const textStyle: React.CSSProperties = {
    ...buildTextStyles(content),
    maxWidth: content.maxWidthContent || '65ch',
  };

  return (
    <div className={`py-4 ${alignClass}`} style={containerStyle}>
      <InlineEditableText
        blockId={block.id}
        fieldName="text"
        value={content.text || ''}
        placeholder="Add your paragraph text here..."
        className={`font-sans ${sizeClass} leading-relaxed ${textClass}`}
        style={textStyle}
        as="p"
        multiline={true}
      />
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
        <div className="relative rounded-[2rem] overflow-hidden bg-black">
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
            <img src={imageUrl} alt="" className="w-full h-auto rounded-[2rem]" />
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
export function JEOfferingsGridRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
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

// JE Gallery Renderer
export function JEGalleryRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
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
export function JETeamMemberRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
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
export function JEFeatureCardRenderer({ block, isEditing = false, isBlockSelected = false }: { block: PageBlock; isEditing?: boolean; isBlockSelected?: boolean }) {
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
                        <Link href={event.link}>
                          <a className="text-primary text-sm hover:underline">View →</a>
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
