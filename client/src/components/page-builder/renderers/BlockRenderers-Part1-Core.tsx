/**
 * Just Empower - COMPLETE Block Renderers with Full Editability
 * 
 * This file contains editable renderers for ALL 50+ block types.
 * Every text element is wrapped in EditableText for inline editing.
 * 
 * BLOCKS COVERED IN THIS FILE (Part 1):
 * - EditableText component
 * - EditableArray component  
 * - JE Hero blocks (4)
 * - JE Section blocks (2)
 * - JE Text blocks (3)
 * - JE Media blocks (4)
 * 
 * @version 3.0 - COMPLETE
 * @date January 2026
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Heart, Leaf, Sparkles, Globe, Star, Sun, Moon, Mountain, Shield,
  Target, Award, Users, BookOpen, Zap, Flower2, ArrowRight, Play,
  Pause, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus,
  Trash2, GripVertical, X, Check, Mail, Phone, MapPin, Calendar,
  Clock, ExternalLink, Quote, Image as ImageIcon, Video, Link,
  Code, FileText, Settings, Eye, EyeOff, Edit3, Move, Copy,
  Instagram, Facebook, Twitter, Linkedin, Youtube,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// EDITABLE TEXT COMPONENT - The core of editability
// ============================================================================

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'li' | 'label' | 'cite';
  placeholder?: string;
  multiline?: boolean;
  isEditing?: boolean;
  style?: React.CSSProperties;
  dangerousHtml?: boolean;
}

export function EditableText({
  value,
  onChange,
  className = '',
  tag: Tag = 'span',
  placeholder = 'Click to edit...',
  multiline = false,
  isEditing = false,
  style,
  dangerousHtml = false,
}: EditableTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (ref.current) {
      const newValue = dangerousHtml ? ref.current.innerHTML : ref.current.innerText;
      if (newValue !== value) {
        onChange(newValue);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      ref.current?.blur();
    }
    // Allow Ctrl+B, Ctrl+I for formatting in multiline
    if (multiline && e.ctrlKey) {
      if (e.key === 'b') {
        e.preventDefault();
        document.execCommand('bold');
      }
      if (e.key === 'i') {
        e.preventDefault();
        document.execCommand('italic');
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (!dangerousHtml) {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
    }
  };

  // Non-editing mode
  if (!isEditing) {
    if (dangerousHtml) {
      return (
        <Tag 
          className={className} 
          style={style}
          dangerouslySetInnerHTML={{ __html: value || placeholder }}
        />
      );
    }
    return (
      <Tag className={className} style={style}>
        {value || <span className="opacity-50">{placeholder}</span>}
      </Tag>
    );
  }

  // Editing mode
  return (
    <Tag
      ref={ref as any}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className={cn(
        className,
        'outline-none cursor-text transition-all',
        'focus:ring-2 focus:ring-amber-500/50 focus:bg-amber-50/50 rounded-sm',
        'hover:bg-amber-50/30',
        'min-w-[50px]' // Minimum width for empty fields
      )}
      style={style}
      data-placeholder={placeholder}
      dangerouslySetInnerHTML={dangerousHtml ? { __html: value || '' } : undefined}
    >
      {!dangerousHtml ? (value || '') : undefined}
    </Tag>
  );
}

// ============================================================================
// EDITABLE IMAGE COMPONENT
// ============================================================================

interface EditableImageProps {
  src: string;
  onChange: (src: string) => void;
  alt?: string;
  className?: string;
  isEditing?: boolean;
  aspectRatio?: string;
  fallback?: React.ReactNode;
}

export function EditableImage({
  src,
  onChange,
  alt = '',
  className = '',
  isEditing = false,
  aspectRatio,
  fallback,
}: EditableImageProps) {
  const [isHovering, setIsHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (isEditing && inputRef.current) {
      inputRef.current.click();
    }
  };

  if (!src && !isEditing) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleClick}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-neutral-400" />
        </div>
      )}

      {/* Edit overlay */}
      {isEditing && isHovering && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer">
          <div className="text-white text-center">
            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
            <span className="text-sm">Click to change</span>
          </div>
        </div>
      )}

      {/* Hidden input for URL */}
      <input
        ref={inputRef}
        type="text"
        className="hidden"
        value={src}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// ============================================================================
// EDITABLE VIDEO COMPONENT
// ============================================================================

interface EditableVideoProps {
  src: string;
  onChange: (src: string) => void;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  className?: string;
  isEditing?: boolean;
}

export function EditableVideo({
  src,
  onChange,
  poster,
  autoPlay = true,
  muted = true,
  loop = true,
  controls = false,
  className = '',
  isEditing = false,
}: EditableVideoProps) {
  const [isHovering, setIsHovering] = useState(false);

  // Check if URL is video
  const isVideo = src && (
    /\.(mp4|webm|mov|ogg)$/i.test(src) ||
    src.includes('video/') ||
    src.includes('/media/')
  );

  if (!src) {
    if (isEditing) {
      return (
        <div className={cn('bg-neutral-200 flex items-center justify-center', className)}>
          <div className="text-center text-neutral-400">
            <Video className="w-8 h-8 mx-auto mb-2" />
            <span className="text-sm">No video selected</span>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {isVideo ? (
        <video
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          controls={controls}
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <img src={src} alt="" className="w-full h-full object-cover" />
      )}

      {isEditing && isHovering && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white text-center">
            <Video className="w-8 h-8 mx-auto mb-2" />
            <span className="text-sm">Edit in settings panel</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ICON MAP - For blocks with icon selection
// ============================================================================

export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  heart: Heart,
  leaf: Leaf,
  sparkles: Sparkles,
  globe: Globe,
  star: Star,
  sun: Sun,
  moon: Moon,
  mountain: Mountain,
  shield: Shield,
  target: Target,
  award: Award,
  users: Users,
  book: BookOpen,
  zap: Zap,
  flower: Flower2,
  mail: Mail,
  phone: Phone,
  mappin: MapPin,
  calendar: Calendar,
  clock: Clock,
  link: ExternalLink,
  quote: Quote,
  image: ImageIcon,
  video: Video,
  code: Code,
  file: FileText,
  settings: Settings,
  eye: Eye,
  edit: Edit3,
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
};

export function getIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return iconMap[iconName?.toLowerCase()] || Star;
}

// ============================================================================
// SIZING PRESETS - Match original site proportions (shared across renderers)
// ============================================================================

export const SECTION_PADDING_PRESETS: Record<string, string> = {
  compact: 'py-16 md:py-20',
  standard: 'py-24 md:py-32',
  spacious: 'py-32 md:py-48',
  hero: 'py-40 md:py-56',
};

export const TITLE_SIZE_PRESETS: Record<string, string> = {
  small: 'text-3xl md:text-4xl',
  medium: 'text-4xl md:text-5xl',
  large: 'text-5xl md:text-6xl lg:text-7xl',
  hero: 'text-6xl md:text-7xl lg:text-8xl',
};

export const BODY_SIZE_PRESETS: Record<string, string> = {
  small: 'text-base',
  medium: 'text-lg md:text-xl',
  large: 'text-xl md:text-2xl',
};

export const GAP_PRESETS: Record<string, string> = {
  tight: 'gap-6 md:gap-8',
  standard: 'gap-8 md:gap-12',
  spacious: 'gap-12 md:gap-16',
  wide: 'gap-16 md:gap-24',
};

// ============================================================================
// JE HERO RENDERER - All variants (je-hero, je-hero-video, je-hero-image, je-hero-split)
// ============================================================================

interface BlockRendererProps {
  block: {
    id: string;
    type: string;
    content: Record<string, any>;
  };
  isEditing?: boolean;
  isBlockSelected?: boolean;
  onUpdate?: (content: Record<string, any>) => void;
}

export function JEHeroRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};
  
  const {
    title = 'Welcome',
    subtitle = '',
    description = '',
    imageUrl = '',
    videoUrl = '',
    ctaText = '',
    ctaLink = '#',
    secondaryCtaText = '',
    secondaryCtaLink = '',
    variant = 'centered',
    overlay = true,
    overlayOpacity = 50,
    dark = false,
    titleColor = '',
    subtitleColor = '',
    descriptionColor = '',
    minHeight = '80vh',
    contentWidth = 'max-w-4xl',
    verticalAlign = 'center',
    // Sizing controls
    titleSize = 'hero',
    subtitleSize = 'medium',
    descriptionSize = 'medium',
    buttonSize = 'lg',
  } = content;

  // Get sizing classes
  const getTitleClass = () => TITLE_SIZE_PRESETS[titleSize as keyof typeof TITLE_SIZE_PRESETS] || TITLE_SIZE_PRESETS.hero;
  const getDescriptionClass = () => BODY_SIZE_PRESETS[descriptionSize as keyof typeof BODY_SIZE_PRESETS] || BODY_SIZE_PRESETS.medium;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  // Determine media source (video takes priority)
  const mediaUrl = videoUrl || imageUrl;
  const isVideo = mediaUrl && (
    /\.(mp4|webm|mov|ogg)$/i.test(mediaUrl) ||
    mediaUrl.includes('video/') ||
    mediaUrl.includes('/media/')
  );

  const alignClasses = {
    top: 'items-start pt-20',
    center: 'items-center',
    bottom: 'items-end pb-20',
  };

  return (
    <section 
      className={cn(
        'relative flex overflow-hidden',
        alignClasses[verticalAlign as keyof typeof alignClasses] || alignClasses.center,
        dark ? 'bg-neutral-900' : 'bg-neutral-100'
      )}
      style={{ minHeight }}
    >
      {/* Background Media */}
      {mediaUrl && (
        <div className="absolute inset-0 w-full h-full">
          {isVideo ? (
            <video
              src={mediaUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={mediaUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}

      {/* Overlay */}
      {overlay && (
        <div 
          className="absolute inset-0 bg-black" 
          style={{ opacity: overlayOpacity / 100 }}
        />
      )}

      {/* Content */}
      <div className={cn(
        'relative z-10 container mx-auto px-6 py-20 w-full',
        variant === 'centered' ? 'text-center' : 'text-left',
        variant === 'split' ? 'grid md:grid-cols-2 gap-12 items-center' : ''
      )}>
        <div className={cn(variant === 'split' ? '' : `${contentWidth} mx-auto`)}>
          {/* Subtitle */}
          <EditableText
            value={subtitle}
            onChange={(v) => handleChange('subtitle', v)}
            tag="p"
            placeholder="SUBTITLE"
            isEditing={isEditing}
            className={cn(
              'text-sm md:text-base uppercase tracking-[0.3em] mb-4 font-sans',
              overlay || dark ? 'text-white/80' : 'text-neutral-600'
            )}
            style={subtitleColor ? { color: subtitleColor } : undefined}
          />

          {/* Title - Using sizing presets */}
          <EditableText
            value={title}
            onChange={(v) => handleChange('title', v)}
            tag="h1"
            placeholder="Your Headline Here"
            isEditing={isEditing}
            className={cn(
              getTitleClass(),
              'font-serif italic mb-6 leading-tight',
              overlay || dark ? 'text-white' : 'text-neutral-900'
            )}
            style={titleColor ? { color: titleColor } : undefined}
          />

          {/* Description - Using sizing presets */}
          <EditableText
            value={description}
            onChange={(v) => handleChange('description', v)}
            tag="p"
            placeholder="Add a description..."
            multiline
            isEditing={isEditing}
            className={cn(
              getDescriptionClass(),
              'mb-8 font-sans leading-relaxed whitespace-pre-wrap',
              variant === 'centered' ? 'mx-auto max-w-2xl' : '',
              overlay || dark ? 'text-white/90' : 'text-neutral-700'
            )}
            style={descriptionColor ? { color: descriptionColor } : undefined}
          />

          {/* CTA Buttons */}
          <div className={cn(
            'flex gap-4',
            variant === 'centered' ? 'justify-center' : 'justify-start'
          )}>
            {(ctaText || isEditing) && (
              <a
                href={ctaLink}
                className={cn(
                  'inline-flex items-center gap-2 px-8 py-3 border-2 transition-all duration-300',
                  'uppercase tracking-wider text-sm font-sans',
                  overlay || dark
                    ? 'border-white text-white hover:bg-white hover:text-neutral-900'
                    : 'border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white'
                )}
              >
                <EditableText
                  value={ctaText}
                  onChange={(v) => handleChange('ctaText', v)}
                  placeholder="Button Text"
                  isEditing={isEditing}
                />
                <ArrowRight className="w-4 h-4" />
              </a>
            )}

            {(secondaryCtaText || isEditing) && (
              <a
                href={secondaryCtaLink}
                className={cn(
                  'inline-flex items-center gap-2 px-8 py-3 transition-all duration-300',
                  'uppercase tracking-wider text-sm font-sans',
                  overlay || dark
                    ? 'text-white/80 hover:text-white'
                    : 'text-neutral-600 hover:text-neutral-900'
                )}
              >
                <EditableText
                  value={secondaryCtaText}
                  onChange={(v) => handleChange('secondaryCtaText', v)}
                  placeholder="Secondary Button"
                  isEditing={isEditing}
                />
              </a>
            )}
          </div>
        </div>

        {/* Split variant - Right side image */}
        {variant === 'split' && imageUrl && (
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className={cn(
          'text-xs uppercase tracking-widest',
          overlay || dark ? 'text-white/60' : 'text-neutral-500'
        )}>
          Scroll
        </span>
        <div className={cn(
          'w-px h-8',
          overlay || dark ? 'bg-white/40' : 'bg-neutral-400'
        )} />
      </div>
    </section>
  );
}

// ============================================================================
// JE SECTION RENDERER (je-section-standard, je-section-fullwidth)
// ============================================================================

export function JESectionRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};
  const isFullWidth = block.type === 'je-section-fullwidth';

  const {
    label = '',
    title = '',
    subtitle = '',
    description = '',
    htmlContent = '',
    imageUrl = '',
    videoUrl = '',
    imagePosition = 'right',
    backgroundColor = '',
    textColor = '',
    padding = 'large',
    alignment = 'center',
    dark = false,
    overlay = false,
    maxWidth = '6xl',
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const paddingClasses: Record<string, string> = {
    none: 'py-0',
    small: 'py-8 md:py-12',
    medium: 'py-12 md:py-16',
    large: 'py-16 md:py-24',
    xlarge: 'py-24 md:py-32',
  };

  const alignmentClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const hasImage = imageUrl || videoUrl;
  const isImageLeft = imagePosition === 'left';

  return (
    <section
      className={cn(
        paddingClasses[padding] || paddingClasses.large,
        dark ? 'bg-neutral-900' : 'bg-white',
        'relative overflow-hidden'
      )}
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      {/* Background Video/Image */}
      {isFullWidth && (videoUrl || imageUrl) && (
        <>
          <div className="absolute inset-0">
            {videoUrl ? (
              <video
                src={videoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          {overlay && <div className="absolute inset-0 bg-black/50" />}
        </>
      )}

      <div className={cn(
        'relative z-10',
        isFullWidth ? 'w-full px-6' : `container max-w-${maxWidth} mx-auto px-6`,
        alignmentClasses[alignment] || alignmentClasses.center
      )}>
        {/* Standard section with side image */}
        {!isFullWidth && hasImage ? (
          <div className={cn(
            'grid md:grid-cols-2 gap-12 items-center',
            isImageLeft && 'md:grid-flow-dense'
          )}>
            {/* Content */}
            <div className={isImageLeft ? 'md:col-start-2' : ''}>
              {/* Label */}
              <EditableText
                value={label}
                onChange={(v) => handleChange('label', v)}
                tag="p"
                placeholder="SECTION LABEL"
                isEditing={isEditing}
                className={cn(
                  'text-xs md:text-sm uppercase tracking-[0.3em] mb-4 font-sans',
                  dark ? 'text-amber-400' : 'text-amber-600'
                )}
                style={textColor ? { color: textColor } : undefined}
              />

              {/* Title */}
              <EditableText
                value={title}
                onChange={(v) => handleChange('title', v)}
                tag="h2"
                placeholder="Section Title"
                isEditing={isEditing}
                className={cn(
                  'text-3xl md:text-4xl lg:text-5xl font-serif italic mb-6',
                  dark ? 'text-white' : 'text-neutral-900'
                )}
                style={textColor ? { color: textColor } : undefined}
              />

              {/* Subtitle */}
              <EditableText
                value={subtitle}
                onChange={(v) => handleChange('subtitle', v)}
                tag="p"
                placeholder="Subtitle..."
                isEditing={isEditing}
                className={cn(
                  'text-lg md:text-xl mb-6 font-sans',
                  dark ? 'text-neutral-300' : 'text-neutral-600'
                )}
              />

              {/* Description */}
              <EditableText
                value={description}
                onChange={(v) => handleChange('description', v)}
                tag="div"
                placeholder="Add description..."
                multiline
                isEditing={isEditing}
                className={cn(
                  'text-base md:text-lg font-sans leading-relaxed whitespace-pre-wrap',
                  dark ? 'text-neutral-400' : 'text-neutral-600'
                )}
              />
            </div>

            {/* Image */}
            <div className={cn(
              'relative aspect-[4/3] rounded-lg overflow-hidden',
              isImageLeft ? 'md:col-start-1' : ''
            )}>
              <img 
                src={imageUrl || videoUrl} 
                alt="" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ) : (
          /* No image layout */
          <>
            <EditableText
              value={label}
              onChange={(v) => handleChange('label', v)}
              tag="p"
              placeholder="SECTION LABEL"
              isEditing={isEditing}
              className={cn(
                'text-xs md:text-sm uppercase tracking-[0.3em] mb-4 font-sans',
                dark || overlay ? 'text-amber-400' : 'text-amber-600'
              )}
            />

            <EditableText
              value={title}
              onChange={(v) => handleChange('title', v)}
              tag="h2"
              placeholder="Section Title"
              isEditing={isEditing}
              className={cn(
                'text-3xl md:text-4xl lg:text-5xl font-serif italic mb-6',
                dark || overlay ? 'text-white' : 'text-neutral-900'
              )}
            />

            <EditableText
              value={subtitle}
              onChange={(v) => handleChange('subtitle', v)}
              tag="p"
              placeholder="Subtitle..."
              isEditing={isEditing}
              className={cn(
                'text-lg md:text-xl mb-6 font-sans',
                dark || overlay ? 'text-neutral-300' : 'text-neutral-600'
              )}
            />

            <EditableText
              value={description}
              onChange={(v) => handleChange('description', v)}
              tag="div"
              placeholder="Add description..."
              multiline
              isEditing={isEditing}
              className={cn(
                'text-base md:text-lg max-w-3xl font-sans leading-relaxed whitespace-pre-wrap',
                alignment === 'center' ? 'mx-auto' : '',
                dark || overlay ? 'text-neutral-300' : 'text-neutral-600'
              )}
            />

            {/* HTML Content */}
            {htmlContent && (
              <div
                className={cn('prose max-w-none mt-8', dark ? 'prose-invert' : '')}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// JE HEADING RENDERER
// ============================================================================

export function JEHeadingRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    text = 'Section Heading',
    level = 'h2',
    alignment = 'center',
    italic = true,
    serif = true,
    uppercase = false,
    color = '',
    marginTop = '',
    marginBottom = '',
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const sizeClasses: Record<string, string> = {
    h1: 'text-4xl md:text-5xl lg:text-6xl',
    h2: 'text-3xl md:text-4xl lg:text-5xl',
    h3: 'text-2xl md:text-3xl lg:text-4xl',
    h4: 'text-xl md:text-2xl lg:text-3xl',
    h5: 'text-lg md:text-xl lg:text-2xl',
    h6: 'text-base md:text-lg lg:text-xl',
  };

  const alignmentClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div 
      className={cn(
        'py-4 px-6',
        alignmentClasses[alignment] || alignmentClasses.center
      )}
      style={{
        marginTop: marginTop || undefined,
        marginBottom: marginBottom || undefined,
      }}
    >
      <EditableText
        value={text}
        onChange={(v) => handleChange('text', v)}
        tag={level as any}
        placeholder="Heading text..."
        isEditing={isEditing}
        className={cn(
          sizeClasses[level] || sizeClasses.h2,
          serif ? 'font-serif' : 'font-sans',
          italic ? 'italic' : '',
          uppercase ? 'uppercase tracking-wider' : '',
          'text-neutral-900'
        )}
        style={color ? { color } : undefined}
      />
    </div>
  );
}

// ============================================================================
// JE PARAGRAPH RENDERER
// ============================================================================

export function JEParagraphRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  // Read content directly without destructuring to avoid stale closure issues
  const content = block.content || {};
  const contentAny = content as Record<string, any>;
  
  // Read values directly from content object
  const text = contentAny.text || '';
  const alignment = contentAny.alignment || 'center';
  const dropCap = contentAny.dropCap || false;
  const columns = contentAny.columns || 1;
  const fontSize = contentAny.fontSize || '16px';
  const fontFamily = contentAny.fontFamily || '';
  const lineHeight = contentAny.lineHeight || 'relaxed';
  const maxWidth = contentAny.maxWidth || 'narrow';
  const color = contentAny.color || '';
  const indent = contentAny.indent || false;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const lineHeightClasses: Record<string, string> = {
    tight: 'leading-tight',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
    loose: 'leading-loose',
  };

  const alignmentClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right',
    justify: 'text-justify',
  };

  // Static maxWidth classes - case insensitive support
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

  // Static column classes
  const columnClasses: Record<number, string> = {
    1: '',
    2: 'columns-2 gap-8',
    3: 'columns-3 gap-8',
  };

  // Build text style with actual font size and font family
  const hasCustomFont = fontFamily && fontFamily !== 'default';
  const textStyle: React.CSSProperties = {
    ...(color ? { color } : {}),
    ...(fontSize && fontSize.includes('px') ? { fontSize } : {}),
    ...(hasCustomFont ? { fontFamily: `"${fontFamily}", sans-serif` } : {}),
  };

  // Container style - apply font family here too so it cascades
  const containerStyle: React.CSSProperties = hasCustomFont 
    ? { fontFamily: `"${fontFamily}", sans-serif` } 
    : {};

  // Apply font using CSS class with !important
  const fontClassName = hasCustomFont ? `je-font-${block.id.replace(/[^a-z0-9]/gi, '')}` : '';
  
  return (
    <div 
      className={cn(
        'py-8 px-6',
        alignmentClasses[alignment] || alignmentClasses.center,
        maxWidthClasses[maxWidth] || 'max-w-2xl'
      )}
    >
      {/* Inject CSS to force font family with !important */}
      {hasCustomFont && (
        <style dangerouslySetInnerHTML={{ __html: `
          .${fontClassName}, .${fontClassName} * { 
            font-family: '${fontFamily}', cursive, sans-serif !important; 
          }
        `}} />
      )}
      <p
        className={cn(
          fontClassName,
          'text-base md:text-lg',
          lineHeightClasses[lineHeight] || lineHeightClasses.relaxed,
          !hasCustomFont && 'font-sans',
          'whitespace-pre-wrap',
          'text-neutral-700 dark:text-neutral-300',
          columnClasses[columns] || '',
          dropCap ? 'first-letter:float-left first-letter:text-6xl first-letter:font-serif first-letter:mr-2 first-letter:mt-1 first-letter:text-amber-600' : '',
          indent ? 'indent-8' : ''
        )}
      >
        <EditableText
          value={text}
          onChange={(v) => handleChange('text', v)}
          tag="span"
          placeholder="Enter paragraph text here..."
          multiline
          isEditing={isEditing}
          className=""
        />
      </p>
    </div>
  );
}

// ============================================================================
// JE QUOTE / BLOCKQUOTE RENDERER
// ============================================================================

export function JEQuoteRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    quote = '',
    author = '',
    role = '',
    imageUrl = '',
    variant = 'elegant',
    alignment = 'center',
    dark = false,
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const alignmentClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <blockquote className={cn(
      'py-12 px-6',
      alignmentClasses[alignment] || alignmentClasses.center,
      dark ? 'bg-neutral-900' : 'bg-white'
    )}>
      <div className={cn(
        'max-w-3xl mx-auto',
        variant === 'card' && 'bg-neutral-50 p-8 rounded-lg shadow-sm'
      )}>
        {/* Decorative Quote Mark - only show if there's a quote */}
        {variant === 'elegant' && quote && (
          <div className={cn(
            'text-6xl font-serif mb-4',
            dark ? 'text-amber-500/30' : 'text-amber-500/30'
          )}>"</div>
        )}

        {/* Left border for simple variant */}
        {variant === 'simple' && (
          <div className="border-l-4 border-amber-500 pl-6">
            <EditableText
              value={quote}
              onChange={(v) => handleChange('quote', v)}
              tag="p"
              placeholder="Enter quote text..."
              multiline
              isEditing={isEditing}
              className={cn(
                'text-xl md:text-2xl font-sans leading-relaxed',
                dark ? 'text-neutral-300' : 'text-neutral-700'
              )}
            />
          </div>
        )}

        {/* Elegant variant */}
        {variant !== 'simple' && (
          <EditableText
            value={quote}
            onChange={(v) => handleChange('quote', v)}
            tag="p"
            placeholder="Enter quote text..."
            multiline
            isEditing={isEditing}
            className={cn(
              'text-2xl md:text-3xl font-serif italic leading-relaxed mb-6',
              dark ? 'text-white' : 'text-neutral-800'
            )}
          />
        )}

        {/* Attribution */}
        <footer className={cn('mt-6', variant === 'simple' && 'pl-6')}>
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt={author} 
              className="w-16 h-16 rounded-full mx-auto mb-4 object-cover"
            />
          )}
          <EditableText
            value={author}
            onChange={(v) => handleChange('author', v)}
            tag="cite"
            placeholder="Author name"
            isEditing={isEditing}
            className={cn(
              'text-lg font-sans not-italic block',
              dark ? 'text-white' : 'text-neutral-900'
            )}
          />
          {/* Only show role if editing or if role has content */}
          {(isEditing || role) && (
            <EditableText
              value={role}
              onChange={(v) => handleChange('role', v)}
              tag="span"
              placeholder="Author role"
              isEditing={isEditing}
              className={cn(
                'text-sm font-sans block mt-1',
                dark ? 'text-neutral-400' : 'text-neutral-500'
              )}
            />
          )}
        </footer>
      </div>
    </blockquote>
  );
}

// ============================================================================
// JE IMAGE RENDERER
// ============================================================================

export function JEImageRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};
  
  // Debug logging
  console.log('[JEImageRenderer] Rendering with content:', content);

  const {
    imageUrl = '',
    alt = '',
    caption = '',
    width = 'full',
    maxWidth = '',
    alignment = 'center',
    rounded = 'lg',
    shadow = true,
    aspectRatio = 'auto',
    link = '',
    lightbox = false,
  } = content;
  
  console.log('[JEImageRenderer] imageUrl:', imageUrl);

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  // Support percentage-based sizes from maxWidth (new) or fall back to width (legacy)
  const getWidthStyle = (): { className?: string; style?: React.CSSProperties } => {
    const sizeValue = maxWidth || width;
    
    // Check if it's a percentage value
    if (sizeValue && sizeValue.endsWith('%')) {
      return { style: { width: sizeValue, maxWidth: sizeValue } };
    }
    
    // Legacy Tailwind class mapping
    const widthClasses: Record<string, string> = {
      auto: 'w-auto',
      full: 'w-full',
      '100%': 'w-full',
      '3/4': 'w-3/4',
      '75%': 'w-3/4',
      '1/2': 'w-1/2',
      '50%': 'w-1/2',
      '1/3': 'w-1/3',
      '33%': 'w-1/3',
      '1/4': 'w-1/4',
      '25%': 'w-1/4',
    };
    
    return { className: widthClasses[sizeValue] || widthClasses.full };
  };

  const alignmentClasses: Record<string, string> = {
    left: 'mr-auto',
    center: 'mx-auto',
    right: 'ml-auto',
  };

  const roundedClasses: Record<string, string> = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };

  const ImageWrapper = link ? 'a' : 'div';
  const widthInfo = getWidthStyle();

  return (
    <figure className="py-4 px-6 border-4 border-red-500" data-debug="je-image-renderer">
      <ImageWrapper
        {...(link ? { href: link, target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={cn(
          'block overflow-hidden',
          widthInfo.className,
          alignmentClasses[alignment] || alignmentClasses.center,
          roundedClasses[rounded] || roundedClasses.lg,
          shadow && 'shadow-lg'
        )}
        style={{ ...(aspectRatio !== 'auto' ? { aspectRatio } : {}), ...widthInfo.style }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={alt}
            className={cn("w-full object-cover", aspectRatio !== 'auto' ? 'h-full' : 'h-auto')}
          />
        ) : (
          <div className="w-full h-48 bg-neutral-200 flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-neutral-400" />
          </div>
        )}
      </ImageWrapper>

      {(caption || isEditing) && (
        <EditableText
          value={caption}
          onChange={(v) => handleChange('caption', v)}
          tag="p"
          placeholder="Add caption..."
          isEditing={isEditing}
          className={cn(
            'mt-4 text-sm text-neutral-500 font-sans',
            alignmentClasses[alignment] || 'text-center'
          )}
        />
      )}
    </figure>
  );
}

// ============================================================================
// JE VIDEO RENDERER
// ============================================================================

export function JEVideoRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    videoUrl = '',
    poster = '',
    title = '',
    description = '',
    autoplay = false,
    muted = true,
    loop = false,
    controls = true,
    aspectRatio = '16/9',
    width = 'full',
    alignment = 'center',
    rounded = 'lg',
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

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

  // Check for YouTube/Vimeo
  const isYouTube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be');
  const isVimeo = videoUrl?.includes('vimeo.com');
  const isEmbed = isYouTube || isVimeo;

  const widthClasses: Record<string, string> = {
    auto: 'w-auto',
    full: 'w-full',
    '3/4': 'w-3/4',
    '1/2': 'w-1/2',
  };

  const alignmentClasses: Record<string, string> = {
    left: 'mr-auto',
    center: 'mx-auto',
    right: 'ml-auto',
  };

  // Static rounded classes - Tailwind cannot use dynamic class names
  const roundedClasses: Record<string, string> = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };

  return (
    <div className="py-4 px-6">
      {(title || isEditing) && (
        <EditableText
          value={title}
          onChange={(v) => handleChange('title', v)}
          tag="h3"
          placeholder="Video title..."
          isEditing={isEditing}
          className="text-2xl font-serif italic mb-4 text-neutral-900"
        />
      )}

      <div
        className={cn(
          'relative overflow-hidden',
          widthClasses[width] || widthClasses.full,
          alignmentClasses[alignment] || alignmentClasses.center,
          roundedClasses[rounded] || roundedClasses.lg
        )}
        style={{ aspectRatio }}
      >
        {isEmbed ? (
          <iframe
            src={videoUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              poster={poster}
              autoPlay={autoplay}
              muted={muted}
              loop={loop}
              controls={controls}
              playsInline
              className="w-full h-full object-cover"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {!controls && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-16 h-16 text-white" />
                ) : (
                  <Play className="w-16 h-16 text-white" />
                )}
              </button>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
            <Video className="w-12 h-12 text-neutral-400" />
          </div>
        )}
      </div>

      {(description || isEditing) && (
        <EditableText
          value={description}
          onChange={(v) => handleChange('description', v)}
          tag="p"
          placeholder="Video description..."
          multiline
          isEditing={isEditing}
          className="mt-4 text-sm text-neutral-600 font-sans"
        />
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS - Part 1
// ============================================================================

export const Part1Renderers = {
  EditableText,
  EditableImage,
  EditableVideo,
  JEHeroRenderer,
  JESectionRenderer,
  JEHeadingRenderer,
  JEParagraphRenderer,
  JEQuoteRenderer,
  JEImageRenderer,
  JEVideoRenderer,
};
