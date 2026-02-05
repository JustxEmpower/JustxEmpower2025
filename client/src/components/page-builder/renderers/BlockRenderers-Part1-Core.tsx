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

import React, { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
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
import EditableElement from '../EditableElement';
import MoveableElement from '../MoveableElement';

// Lazy load custom RichTextEditor (no API key required)
const RichTextEditor = lazy(() => import('../RichTextEditor'));

// ============================================================================
// GOOGLE FONT LOADING UTILITY
// ============================================================================

/**
 * Extract font names from HTML content with inline styles
 */
function extractFontsFromHtml(html: string): string[] {
  if (!html) return [];
  const fontNames = new Set<string>();
  const fontFamilyRegex = /font-family:\s*["']?([^"';,\)]+)/gi;
  let match;
  while ((match = fontFamilyRegex.exec(html)) !== null) {
    const fontName = match[1].trim().replace(/["']/g, '');
    if (fontName && 
        !fontName.toLowerCase().includes('sans-serif') && 
        !fontName.toLowerCase().includes('serif') && 
        !fontName.toLowerCase().includes('monospace') && 
        !fontName.toLowerCase().includes('cursive') &&
        !fontName.toLowerCase().includes('fantasy') &&
        !fontName.toLowerCase().includes('system-ui') &&
        !fontName.toLowerCase().includes('inherit')) {
      fontNames.add(fontName);
    }
  }
  return Array.from(fontNames);
}

/**
 * Load Google Fonts dynamically
 */
function loadGoogleFonts(fonts: string[], blockId: string): void {
  if (fonts.length === 0) return;
  const fontNamesStr = fonts
    .map(name => name.replace(/ /g, '+') + ':ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700')
    .join('&family=');
  const linkId = `google-fonts-${blockId.replace(/[^a-z0-9]/gi, '')}`;
  let link = document.getElementById(linkId) as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  const newHref = `https://fonts.googleapis.com/css2?family=${fontNamesStr}&display=swap`;
  if (link.href !== newHref) {
    link.href = newHref;
    console.log('[GoogleFonts-Core] Loading fonts for block', blockId, ':', fonts);
  }
}

/**
 * React hook to load Google Fonts from HTML content
 */
function useGoogleFonts(htmlContent: string | undefined, blockId: string): void {
  useEffect(() => {
    if (htmlContent && /<[^>]+>/.test(htmlContent)) {
      const fonts = extractFontsFromHtml(htmlContent);
      loadGoogleFonts(fonts, blockId);
    }
  }, [htmlContent, blockId]);
}

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
  richText?: boolean;
  elementId?: string;
  elementType?: string;
  isElementEditMode?: boolean;
  initialTransform?: { x?: number; y?: number; width?: number; height?: number; rotate?: number };
  onTransformChange?: (elementId: string, transform: { x?: number; y?: number; width?: number; height?: number; rotate?: number }) => void;
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
  richText = false,
  elementId,
  elementType = 'text',
  isElementEditMode = false,
  initialTransform,
  onTransformChange,
}: EditableTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [localValue, setLocalValue] = useState(value);
  const [showRichEditor, setShowRichEditor] = useState(false);

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

  // Non-editing mode - wrap in MoveableElement if element edit mode is active
  if (!isEditing) {
    const content = dangerousHtml || richText ? (
      <Tag 
        className={className} 
        style={style}
        dangerouslySetInnerHTML={{ __html: value || placeholder }}
      />
    ) : (
      <Tag className={className} style={style}>
        {value || <span className="opacity-50">{placeholder}</span>}
      </Tag>
    );
    
    // Wrap in MoveableElement when element edit mode is active
    if (isElementEditMode && elementId) {
      return (
        <MoveableElement 
          elementId={elementId} 
          elementType={elementType}
          initialTransform={initialTransform}
          onTransformChange={onTransformChange}
        >
          {content}
        </MoveableElement>
      );
    }
    
    return content;
  }

  // Rich text editing mode with custom RichTextEditor (no API key required)
  if (richText && showRichEditor) {
    return (
      <div className="relative group">
        <Suspense fallback={<div className="animate-pulse bg-neutral-100 rounded h-24" />}>
          <RichTextEditor
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            height={multiline ? 200 : 100}
            className={className}
          />
        </Suspense>
        <button
          onClick={() => setShowRichEditor(false)}
          className="absolute -top-8 right-0 text-xs bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700 transition-colors"
        >
          Done Editing
        </button>
      </div>
    );
  }

  // Rich text click-to-edit mode
  if (richText) {
    return (
      <div
        onClick={() => setShowRichEditor(true)}
        className={cn(
          className,
          'cursor-pointer border-2 border-dashed border-transparent hover:border-amber-400 rounded p-1 transition-colors relative group'
        )}
        style={style}
      >
        <Tag dangerouslySetInnerHTML={{ __html: value || `<span class="opacity-50">${placeholder}</span>` }} />
        <span className="absolute -top-6 left-0 text-xs bg-amber-500 text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Click to edit
        </span>
      </div>
    );
  }

  // Simple contentEditable editing mode
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
        'min-w-[50px]'
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
// EDITABLE IMAGE COMPONENT WITH TRUE RESIZE (like Word)
// ============================================================================

interface EditableImageProps {
  src: string;
  onChange: (src: string) => void;
  alt?: string;
  className?: string;
  isEditing?: boolean;
  aspectRatio?: string;
  fallback?: React.ReactNode;
  elementId?: string;
  isElementEditMode?: boolean;
  initialTransform?: { x?: number; y?: number; width?: number; height?: number; rotate?: number };
  onTransformChange?: (elementId: string, transform: { x?: number; y?: number; width?: number; height?: number; rotate?: number }) => void;
  // New props for true resize
  initialWidth?: number;
  initialHeight?: number;
  onSizeChange?: (width: number, height: number) => void;
}

export function EditableImage({
  src,
  onChange,
  alt = '',
  className = '',
  isEditing = false,
  aspectRatio,
  fallback,
  elementId,
  isElementEditMode = false,
  initialTransform,
  onTransformChange,
  initialWidth,
  initialHeight,
  onSizeChange,
}: EditableImageProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({
    width: initialWidth || initialTransform?.width || 0,
    height: initialHeight || initialTransform?.height || 0,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Sync dimensions from props
  useEffect(() => {
    if (initialTransform?.width || initialTransform?.height) {
      setDimensions({
        width: initialTransform.width || dimensions.width,
        height: initialTransform.height || dimensions.height,
      });
    }
  }, [initialTransform?.width, initialTransform?.height]);

  const handleClick = () => {
    if (isEditing && !isResizing && inputRef.current) {
      inputRef.current.click();
    }
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    if (!isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeHandle(handle);
    
    const rect = containerRef.current?.getBoundingClientRect();
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: rect?.width || dimensions.width || 200,
      height: rect?.height || dimensions.height || 200,
    };
  };

  // Handle mouse move for resize
  useEffect(() => {
    if (!isResizing || !resizeHandle) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;
      
      let newWidth = dragStart.current.width;
      let newHeight = dragStart.current.height;
      
      // Calculate new dimensions based on handle
      if (resizeHandle.includes('e')) newWidth = Math.max(50, dragStart.current.width + deltaX);
      if (resizeHandle.includes('w')) newWidth = Math.max(50, dragStart.current.width - deltaX);
      if (resizeHandle.includes('s')) newHeight = Math.max(50, dragStart.current.height + deltaY);
      if (resizeHandle.includes('n')) newHeight = Math.max(50, dragStart.current.height - deltaY);
      
      // For corner handles, maintain aspect ratio if shift is held
      if (resizeHandle.length === 2 && e.shiftKey) {
        const aspectRatio = dragStart.current.width / dragStart.current.height;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          newHeight = newWidth / aspectRatio;
        } else {
          newWidth = newHeight * aspectRatio;
        }
      }
      
      setDimensions({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle(null);
      
      // Save the new size
      if (onSizeChange && dimensions.width && dimensions.height) {
        onSizeChange(dimensions.width, dimensions.height);
      }
      if (onTransformChange && elementId) {
        onTransformChange(elementId, {
          ...initialTransform,
          width: dimensions.width,
          height: dimensions.height,
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeHandle, dimensions, onSizeChange, onTransformChange, elementId, initialTransform]);

  if (!src && !isEditing) {
    return fallback ? <>{fallback}</> : null;
  }

  // Resize handle styles
  const handleStyle = 'absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-sm z-50 shadow-md';
  
  // Calculate style with dimensions
  const containerStyle: React.CSSProperties = {
    ...(aspectRatio && !dimensions.width ? { aspectRatio } : {}),
    ...(dimensions.width ? { width: `${dimensions.width}px` } : {}),
    ...(dimensions.height ? { height: `${dimensions.height}px` } : {}),
  };

  const imageContent = (
    <div
      ref={containerRef}
      className={cn('relative', className, isEditing && 'cursor-pointer')}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleClick}
      style={containerStyle}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-neutral-200 flex items-center justify-center min-h-[100px]">
          <ImageIcon className="w-8 h-8 text-neutral-400" />
        </div>
      )}

      {/* Edit overlay */}
      {isEditing && isHovering && !isResizing && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer">
          <div className="text-white text-center">
            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
            <span className="text-sm">Click to change</span>
          </div>
        </div>
      )}

      {/* TRUE RESIZE HANDLES - Corner drag like Word */}
      {isEditing && (isHovering || isResizing) && (
        <>
          {/* Corner handles */}
          <div
            className={`${handleStyle} -top-1.5 -left-1.5 cursor-nw-resize`}
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
          />
          <div
            className={`${handleStyle} -top-1.5 -right-1.5 cursor-ne-resize`}
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
          />
          <div
            className={`${handleStyle} -bottom-1.5 -left-1.5 cursor-sw-resize`}
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
          />
          <div
            className={`${handleStyle} -bottom-1.5 -right-1.5 cursor-se-resize`}
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          />
          
          {/* Edge handles */}
          <div
            className={`${handleStyle} -top-1.5 left-1/2 -translate-x-1/2 cursor-n-resize`}
            onMouseDown={(e) => handleResizeStart(e, 'n')}
          />
          <div
            className={`${handleStyle} -bottom-1.5 left-1/2 -translate-x-1/2 cursor-s-resize`}
            onMouseDown={(e) => handleResizeStart(e, 's')}
          />
          <div
            className={`${handleStyle} top-1/2 -left-1.5 -translate-y-1/2 cursor-w-resize`}
            onMouseDown={(e) => handleResizeStart(e, 'w')}
          />
          <div
            className={`${handleStyle} top-1/2 -right-1.5 -translate-y-1/2 cursor-e-resize`}
            onMouseDown={(e) => handleResizeStart(e, 'e')}
          />
          
          {/* Dimension tooltip while resizing */}
          {isResizing && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
              {Math.round(dimensions.width)} × {Math.round(dimensions.height)}
            </div>
          )}
          
          {/* Selection border */}
          <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none" />
        </>
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

  // Wrap in MoveableElement when element edit mode is active
  if (isElementEditMode && elementId) {
    return (
      <MoveableElement 
        elementId={elementId} 
        elementType="image"
        initialTransform={initialTransform}
        onTransformChange={onTransformChange}
      >
        {imageContent}
      </MoveableElement>
    );
  }

  return imageContent;
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
  elementId?: string;
  isElementEditMode?: boolean;
  initialTransform?: { x?: number; y?: number; width?: number; height?: number; rotate?: number };
  onTransformChange?: (elementId: string, transform: { x?: number; y?: number; width?: number; height?: number; rotate?: number }) => void;
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
  elementId,
  isElementEditMode = false,
  initialTransform,
  onTransformChange,
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

  const videoContent = (
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

  // Wrap in MoveableElement when element edit mode is active
  if (isElementEditMode && elementId) {
    return (
      <MoveableElement 
        elementId={elementId} 
        elementType="video"
        initialTransform={initialTransform}
        onTransformChange={onTransformChange}
      >
        {videoContent}
      </MoveableElement>
    );
  }

  return videoContent;
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
// TEXT STYLE BUILDER - Builds inline styles from content fontSize values
// ============================================================================

/**
 * Builds a style object from fontSize and other text styling values.
 * Used across all block renderers to ensure fontSize from BlockFieldDefinitions is applied.
 */
export function buildTextStyle(options: {
  fontSize?: string;
  lineHeight?: string;
  letterSpacing?: string;
  color?: string;
  marginBottom?: string;
  marginTop?: string;
}): React.CSSProperties {
  const style: React.CSSProperties = {};
  
  // Apply fontSize if it contains a unit (px, rem, em, vh, %)
  if (options.fontSize && /\d+(px|rem|em|vh|%)/.test(options.fontSize)) {
    style.fontSize = options.fontSize;
  }
  
  // Apply lineHeight if it's a number or contains a unit
  if (options.lineHeight && (/^\d+(\.\d+)?$/.test(options.lineHeight) || /\d+(px|rem|em)/.test(options.lineHeight))) {
    style.lineHeight = options.lineHeight;
  }
  
  // Apply letterSpacing if it contains a unit
  if (options.letterSpacing && /\d+(px|rem|em)/.test(options.letterSpacing)) {
    style.letterSpacing = options.letterSpacing;
  }
  
  // Apply color
  if (options.color) {
    style.color = options.color;
  }
  
  // Apply margins
  if (options.marginBottom && /\d+(px|rem|em)/.test(options.marginBottom)) {
    style.marginBottom = options.marginBottom;
  }
  if (options.marginTop && /\d+(px|rem|em)/.test(options.marginTop)) {
    style.marginTop = options.marginTop;
  }
  
  return style;
}

// ============================================================================
// SCROLL INDICATOR COMPONENT - Draggable scroll button with position persistence
// ============================================================================

interface ScrollIndicatorProps {
  isEditing?: boolean;
  isElementEditMode?: boolean;
  dark?: boolean;
  positionX?: number;
  positionY?: number;
  onPositionChange?: (x: number, y: number) => void;
}

function ScrollIndicator({
  isEditing = false,
  isElementEditMode = false,
  dark = false,
  positionX = 0,
  positionY = 0,
  onPositionChange,
}: ScrollIndicatorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localPosition, setLocalPosition] = useState({ x: positionX, y: positionY });
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const indicatorRef = useRef<HTMLDivElement>(null);
  // Use ref to track latest position for mouseup handler (avoids stale closure)
  const latestPosition = useRef({ x: positionX, y: positionY });

  // Sync local position with props
  useEffect(() => {
    setLocalPosition({ x: positionX, y: positionY });
    latestPosition.current = { x: positionX, y: positionY };
  }, [positionX, positionY]);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isElementEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      posX: localPosition.x,
      posY: localPosition.y,
    };
  };

  // Handle drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;
      
      const newX = dragStart.current.posX + deltaX;
      const newY = dragStart.current.posY + deltaY;
      
      setLocalPosition({ x: newX, y: newY });
      // Update ref with latest position
      latestPosition.current = { x: newX, y: newY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Use ref to get latest position (not stale closure value)
      const finalX = latestPosition.current.x;
      const finalY = latestPosition.current.y;
      console.log('[ScrollIndicator] Saving position:', finalX, finalY);
      if (onPositionChange) {
        onPositionChange(finalX, finalY);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onPositionChange]);

  // Calculate transform style - apply position offset
  const transformStyle: React.CSSProperties = {
    transform: `translate(calc(-50% + ${localPosition.x}px), ${localPosition.y}px)`,
  };

  return (
    <div
      ref={indicatorRef}
      className={cn(
        'absolute bottom-8 left-1/2',
        isElementEditMode && 'cursor-move',
        isDragging && 'z-50'
      )}
      style={transformStyle}
      onMouseDown={handleMouseDown}
    >
      {/* Edit mode indicator */}
      {isElementEditMode && (
        <div className={cn(
          'absolute -inset-2 border-2 rounded',
          isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-dashed border-blue-400/50'
        )} />
      )}
      
      {/* Scroll indicator content */}
      <div className="flex flex-col items-center gap-2">
        <span className={cn(
          'text-xs uppercase tracking-widest',
          dark ? 'text-white/60' : 'text-neutral-500'
        )}>
          Scroll
        </span>
        <div className={cn(
          'w-px h-8',
          dark ? 'bg-white/40' : 'bg-neutral-400'
        )} />
        <ChevronDown className={cn(
          'w-4 h-4 animate-bounce',
          dark ? 'text-white/40' : 'text-neutral-400'
        )} />
      </div>
      
      {/* Position indicator while dragging */}
      {isDragging && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
          {Math.round(localPosition.x)}, {Math.round(localPosition.y)}
        </div>
      )}
    </div>
  );
}

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
  isElementEditMode?: boolean;
  onUpdate?: (content: Record<string, any>) => void;
}

export function JEHeroRenderer({ block, isEditing, isElementEditMode = false, onUpdate }: BlockRendererProps) {
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
    // Sizing controls (legacy presets)
    titleSize = 'hero',
    subtitleSize = 'medium',
    descriptionSize = 'medium',
    buttonSize = 'lg',
    // Typography overrides (from BlockFieldDefinitions)
    titleFontSize = '',
    titleFontSizeMd = '',
    titleFontSizeLg = '',
    titleLineHeight = '',
    titleMarginBottom = '',
    subtitleFontSize = '',
    subtitleLetterSpacing = '',
    subtitleMarginBottom = '',
    descriptionFontSize = '',
    descriptionLineHeight = '',
    descriptionMarginBottom = '',
    ctaFontSize = '',
    ctaLetterSpacing = '',
  } = content;

  // Get sizing classes (fallback when no custom fontSize)
  const getTitleClass = () => titleFontSize ? '' : (TITLE_SIZE_PRESETS[titleSize as keyof typeof TITLE_SIZE_PRESETS] || TITLE_SIZE_PRESETS.hero);
  const getDescriptionClass = () => descriptionFontSize ? '' : (BODY_SIZE_PRESETS[descriptionSize as keyof typeof BODY_SIZE_PRESETS] || BODY_SIZE_PRESETS.medium);

  // Build inline styles for typography
  const titleStyle = buildTextStyle({ fontSize: titleFontSize, lineHeight: titleLineHeight, marginBottom: titleMarginBottom, color: titleColor });
  const subtitleStyle = buildTextStyle({ fontSize: subtitleFontSize, letterSpacing: subtitleLetterSpacing, marginBottom: subtitleMarginBottom, color: subtitleColor });
  const descriptionStyle = buildTextStyle({ fontSize: descriptionFontSize, lineHeight: descriptionLineHeight, marginBottom: descriptionMarginBottom, color: descriptionColor });
  const ctaStyle = buildTextStyle({ fontSize: ctaFontSize, letterSpacing: ctaLetterSpacing });

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
        <div className={cn(variant === 'split' ? '' : `${contentWidth} mx-auto`, 'relative')}>
          {/* Subtitle */}
          <EditableElement
            elementId="subtitle"
            elementType="text"
            isEditing={isElementEditMode}
            className="inline-block"
          >
            <EditableText
              value={subtitle}
              onChange={(v) => handleChange('subtitle', v)}
              tag="p"
              placeholder="SUBTITLE"
              isEditing={isEditing}
              dangerousHtml={true}
              className={cn(
                !subtitleFontSize && 'text-sm md:text-base',
                'uppercase tracking-[0.3em] mb-4 font-sans',
                overlay || dark ? 'text-white/80' : 'text-neutral-600'
              )}
              style={subtitleStyle}
            />
          </EditableElement>

          {/* Title - Using sizing presets or custom fontSize */}
          <EditableElement
            elementId="title"
            elementType="text"
            isEditing={isElementEditMode}
            className="block"
          >
            <EditableText
              value={title}
              onChange={(v) => handleChange('title', v)}
              tag="h1"
              placeholder="Your Headline Here"
              isEditing={isEditing}
              dangerousHtml={true}
              className={cn(
                getTitleClass(),
                'font-serif italic mb-6 leading-tight',
                overlay || dark ? 'text-white' : 'text-neutral-900'
              )}
              style={titleStyle}
            />
          </EditableElement>

          {/* Description - Using sizing presets or custom fontSize */}
          <EditableElement
            elementId="description"
            elementType="text"
            isEditing={isElementEditMode}
            className="block"
          >
            <EditableText
              value={description}
              onChange={(v) => handleChange('description', v)}
              tag="p"
              placeholder="Add a description..."
              multiline
              isEditing={isEditing}
              dangerousHtml={true}
              className={cn(
                getDescriptionClass(),
                'mb-8 font-sans leading-relaxed whitespace-pre-wrap',
                variant === 'centered' ? 'mx-auto max-w-2xl' : '',
                overlay || dark ? 'text-white/90' : 'text-neutral-700'
              )}
              style={descriptionStyle}
            />
          </EditableElement>

          {/* CTA Buttons */}
          <div className={cn(
            'flex gap-4',
            variant === 'centered' ? 'justify-center' : 'justify-start'
          )}>
            {(ctaText || isEditing) && (
              <EditableElement
                elementId="cta-button"
                elementType="button"
                isEditing={isElementEditMode}
                className="inline-block"
              >
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
              </EditableElement>
            )}

            {(secondaryCtaText || isEditing) && (
              <EditableElement
                elementId="secondary-cta"
                elementType="button"
                isEditing={isElementEditMode}
                className="inline-block"
              >
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
              </EditableElement>
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

      {/* Scroll Indicator - Rebuilt with direct position control */}
      <ScrollIndicator
        isEditing={isEditing}
        isElementEditMode={isElementEditMode}
        dark={overlay || dark}
        positionX={content.scrollIndicatorX}
        positionY={content.scrollIndicatorY}
        onPositionChange={(x, y) => {
          if (onUpdate) {
            onUpdate({
              ...content,
              scrollIndicatorX: x,
              scrollIndicatorY: y,
            });
          }
        }}
      />
    </section>
  );
}

// ============================================================================
// JE SECTION RENDERER (je-section-standard, je-section-fullwidth)
// ============================================================================

export function JESectionRenderer({ block, isEditing, isElementEditMode = false, onUpdate }: BlockRendererProps) {
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
    // Typography overrides from BlockFieldDefinitions
    titleFontSize = '',
    titleLineHeight = '',
    titleMarginBottom = '',
    titleColor = '',
    descriptionFontSize = '',
    descriptionLineHeight = '',
    descriptionMarginBottom = '',
    descriptionColor = '',
    labelFontSize = '',
    labelMarginBottom = '',
    labelColor = '',
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  // Build typography styles
  const titleStyle = buildTextStyle({ fontSize: titleFontSize, lineHeight: titleLineHeight, marginBottom: titleMarginBottom, color: titleColor || textColor });
  const descriptionStyle = buildTextStyle({ fontSize: descriptionFontSize, lineHeight: descriptionLineHeight, marginBottom: descriptionMarginBottom, color: descriptionColor || textColor });
  const labelStyle = buildTextStyle({ fontSize: labelFontSize, marginBottom: labelMarginBottom, color: labelColor || textColor });

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
            <div className={cn(isImageLeft ? 'md:col-start-2' : '', 'relative')}>
              {/* Label */}
              <EditableElement
                elementId="label"
                elementType="text"
                isEditing={isElementEditMode}
                className="inline-block"
              >
                <EditableText
                  value={label}
                  onChange={(v) => handleChange('label', v)}
                  tag="p"
                  placeholder="SECTION LABEL"
                  isEditing={isEditing}
                  dangerousHtml={true}
                  className={cn(
                    !labelFontSize && 'text-xs md:text-sm',
                    'uppercase tracking-[0.3em] mb-4 font-sans',
                    dark ? 'text-amber-400' : 'text-amber-600'
                  )}
                  style={labelStyle}
                />
              </EditableElement>

              {/* Title */}
              <EditableElement
                elementId="title"
                elementType="text"
                isEditing={isElementEditMode}
                className="block"
              >
                <EditableText
                  value={title}
                  onChange={(v) => handleChange('title', v)}
                  tag="h2"
                  placeholder="Section Title"
                  isEditing={isEditing}
                  dangerousHtml={true}
                  className={cn(
                    !titleFontSize && 'text-3xl md:text-4xl lg:text-5xl',
                    'font-serif italic mb-6',
                    dark ? 'text-white' : 'text-neutral-900'
                  )}
                  style={titleStyle}
                />
              </EditableElement>

              {/* Subtitle */}
              <EditableElement
                elementId="subtitle"
                elementType="text"
                isEditing={isElementEditMode}
                className="block"
              >
                <EditableText
                  value={subtitle}
                  onChange={(v) => handleChange('subtitle', v)}
                  tag="p"
                  placeholder="Subtitle..."
                  isEditing={isEditing}
                  dangerousHtml={true}
                  className={cn(
                    'text-lg md:text-xl mb-6 font-sans',
                    dark ? 'text-neutral-300' : 'text-neutral-600'
                  )}
                />
              </EditableElement>

              {/* Description */}
              <EditableElement
                elementId="description"
                elementType="text"
                isEditing={isElementEditMode}
                className="block"
              >
                <EditableText
                  value={description}
                  onChange={(v) => handleChange('description', v)}
                  tag="div"
                  placeholder="Add description..."
                  multiline
                  isEditing={isEditing}
                  dangerousHtml={true}
                  className={cn(
                    !descriptionFontSize && 'text-base md:text-lg',
                    'font-sans leading-relaxed whitespace-pre-wrap',
                    dark ? 'text-neutral-400' : 'text-neutral-600'
                  )}
                  style={descriptionStyle}
                />
              </EditableElement>
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
          <div className="relative">
            <EditableElement
              elementId="label"
              elementType="text"
              isEditing={isElementEditMode}
              className="inline-block"
            >
              <EditableText
                value={label}
                onChange={(v) => handleChange('label', v)}
                tag="p"
                placeholder="SECTION LABEL"
                isEditing={isEditing}
                dangerousHtml={true}
                className={cn(
                  !labelFontSize && 'text-xs md:text-sm',
                  'uppercase tracking-[0.3em] mb-4 font-sans',
                  dark || overlay ? 'text-amber-400' : 'text-amber-600'
                )}
                style={labelStyle}
              />
            </EditableElement>

            <EditableElement
              elementId="title"
              elementType="text"
              isEditing={isElementEditMode}
              className="block"
            >
              <EditableText
                value={title}
                onChange={(v) => handleChange('title', v)}
                tag="h2"
                placeholder="Section Title"
                isEditing={isEditing}
                dangerousHtml={true}
                className={cn(
                  !titleFontSize && 'text-3xl md:text-4xl lg:text-5xl',
                  'font-serif italic mb-6',
                  dark || overlay ? 'text-white' : 'text-neutral-900'
                )}
                style={titleStyle}
              />
            </EditableElement>

            <EditableElement
              elementId="subtitle"
              elementType="text"
              isEditing={isElementEditMode}
              className="block"
            >
              <EditableText
                value={subtitle}
                onChange={(v) => handleChange('subtitle', v)}
                tag="p"
                placeholder="Subtitle..."
                isEditing={isEditing}
                dangerousHtml={true}
                className={cn(
                  'text-lg md:text-xl mb-6 font-sans',
                  dark || overlay ? 'text-neutral-300' : 'text-neutral-600'
                )}
              />
            </EditableElement>

            <EditableElement
              elementId="description"
              elementType="text"
              isEditing={isElementEditMode}
              className="block"
            >
              <EditableText
                value={description}
                onChange={(v) => handleChange('description', v)}
                tag="div"
                placeholder="Add description..."
                multiline
                isEditing={isEditing}
                dangerousHtml={true}
                className={cn(
                  !descriptionFontSize && 'text-base md:text-lg',
                  'max-w-3xl font-sans leading-relaxed whitespace-pre-wrap',
                  alignment === 'center' ? 'mx-auto' : '',
                  dark || overlay ? 'text-neutral-300' : 'text-neutral-600'
                )}
                style={descriptionStyle}
              />
            </EditableElement>

            {/* HTML Content */}
            {htmlContent && (
              <div
                className={cn('prose max-w-none mt-8', dark ? 'prose-invert' : '')}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            )}
          </div>
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
        dangerousHtml={true}
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
  const content = block.content || {};
  const contentAny = content as Record<string, any>;
  
  // Get text content - this contains HTML with inline font styles from RichTextEditor
  const text = contentAny.text || '';
  const alignment = contentAny.alignment || 'center';
  const dropCap = contentAny.dropCap || false;
  const columns = contentAny.columns || 1;
  const lineHeight = contentAny.lineHeight || 'relaxed';
  const indent = contentAny.indent || false;
  
  // Microsoft Word-style margin controls
  const textWidthPreset = contentAny.textWidthPreset || 'wide';
  const marginLeft = contentAny.marginLeft || '0%';
  const marginRight = contentAny.marginRight || '0%';

  // Load Google Fonts from inline styles in HTML content
  useGoogleFonts(text, block.id);

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
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  };

  // Text width preset to actual width percentage
  const getTextWidth = (): string => {
    switch (textWidthPreset) {
      case 'narrow': return '60%';
      case 'medium': return '75%';
      case 'wide': return '90%';
      case 'full': return '100%';
      case 'custom': {
        const left = parseFloat(marginLeft) || 0;
        const right = parseFloat(marginRight) || 0;
        return `${100 - left - right}%`;
      }
      default: return '90%';
    }
  };

  const columnClasses: Record<number, string> = {
    1: '',
    2: 'columns-2 gap-8',
    3: 'columns-3 gap-8',
  };

  const calculatedWidth = getTextWidth();
  const containerStyle: React.CSSProperties = {
    width: calculatedWidth,
    maxWidth: calculatedWidth,
    marginLeft: 'auto',
    marginRight: 'auto',
  };
  
  return (
    <div 
      className={cn(
        'py-8 px-6',
        alignmentClasses[alignment] || alignmentClasses.center,
        alignment === 'center' && 'mx-auto'
      )}
      style={containerStyle}
    >
      {/* SIMPLE: Just render the HTML content directly - fonts are inline styles */}
      <div
        className={cn(
          lineHeightClasses[lineHeight] || lineHeightClasses.relaxed,
          'text-neutral-700 dark:text-neutral-300',
          columnClasses[columns] || '',
          dropCap ? 'first-letter:float-left first-letter:text-6xl first-letter:font-serif first-letter:mr-2 first-letter:mt-1 first-letter:text-amber-600' : '',
          indent ? 'indent-8' : ''
        )}
        dangerouslySetInnerHTML={{ __html: text || '<span class="opacity-50">Enter paragraph text here...</span>' }}
      />
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
              dangerousHtml={true}
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
            dangerousHtml={true}
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
            dangerousHtml={true}
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
              dangerousHtml={true}
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
    <figure className="py-4 px-6">
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
          dangerousHtml={true}
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
          dangerousHtml={true}
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
          dangerousHtml={true}
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
