/**
 * MediaFieldWithPicker.tsx - Fixed Media Field Component
 * 
 * FIXES ADDRESSED:
 * - Video fields showing images (and vice versa)
 * - Improved field type detection
 * - Block-type specific overrides
 * - Better preview handling
 * 
 * LOCATION: /client/src/components/page-builder/panels/MediaFieldWithPicker.tsx
 * ACTION: Create this new file and import in BlockSettings.tsx
 */

import React, { useState, useMemo } from 'react';
import { Video, Image as ImageIcon, X, Upload, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MediaPicker from '@/components/MediaPicker';
import { getMediaUrl } from '@/lib/media';

// ============================================
// MEDIA TYPE DETECTION
// ============================================

type MediaType = 'image' | 'video' | 'all';

/**
 * Video-specific field patterns
 * These fields should ONLY show videos
 */
const VIDEO_FIELD_PATTERNS = [
  'videourl',
  'video',
  'backgroundvideo',
  'herovideo',
  'videosrc',
  'videosource',
  'mp4url',
  'webmurl',
  'movurl',
];

/**
 * Image-specific field patterns
 * These fields should ONLY show images
 */
const IMAGE_FIELD_PATTERNS = [
  'imageurl',
  'image',
  'backgroundimage',
  'heroimage',
  'thumbnail',
  'thumbnailurl',
  'poster',
  'posterimage',
  'avatar',
  'avatarurl',
  'logo',
  'logourl',
  'icon',
  'iconurl',
  'photo',
  'photourl',
  'picture',
  'pictureurl',
  'banner',
  'bannerurl',
  'cover',
  'coverurl',
  'ogimage',
  'favicon',
];

/**
 * Block-type specific field overrides
 * When a block type has specific media requirements
 */
const BLOCK_TYPE_OVERRIDES: Record<string, Record<string, MediaType>> = {
  'je-hero-video': {
    'backgroundurl': 'video',
    'mediaurl': 'video',
    'src': 'video',
    'url': 'video',
    'posterimage': 'image',
    'fallbackimage': 'image',
  },
  'je-hero-image': {
    'backgroundurl': 'image',
    'mediaurl': 'image',
    'src': 'image',
    'url': 'image',
  },
  'je-video': {
    'url': 'video',
    'src': 'video',
    'source': 'video',
    'posterimage': 'image',
  },
  'je-image': {
    'url': 'image',
    'src': 'image',
    'source': 'image',
  },
  'je-gallery': {
    'url': 'image',
    'src': 'image',
  },
  'je-section-fullwidth': {
    'backgroundimage': 'image',
    'backgroundvideo': 'video',
  },
  'video': {
    'src': 'video',
    'url': 'video',
    'poster': 'image',
  },
  'image': {
    'src': 'image',
    'url': 'image',
  },
};

/**
 * Determine the media type for a field based on its key and block type
 * Uses a priority system:
 * 1. Block-type specific overrides (highest priority)
 * 2. Explicit video field patterns
 * 3. Explicit image field patterns
 * 4. Default to 'all' (lowest priority)
 */
export function getMediaTypeForField(key: string, blockType: string): MediaType {
  // Guard against null/undefined keys
  if (!key || typeof key !== 'string') {
    return 'all';
  }
  const lowerKey = key.toLowerCase();
  
  // Priority 1: Check block-type specific overrides
  const blockOverrides = BLOCK_TYPE_OVERRIDES[blockType];
  if (blockOverrides) {
    for (const [pattern, type] of Object.entries(blockOverrides)) {
      if (lowerKey.includes(pattern.toLowerCase())) {
        return type;
      }
    }
  }
  
  // Priority 2: Check explicit video patterns
  for (const pattern of VIDEO_FIELD_PATTERNS) {
    if (lowerKey.includes(pattern)) {
      return 'video';
    }
  }
  
  // Priority 3: Check explicit image patterns
  for (const pattern of IMAGE_FIELD_PATTERNS) {
    if (lowerKey.includes(pattern)) {
      // Double-check it's not a video field misnamed
      if (!lowerKey.includes('video')) {
        return 'image';
      }
    }
  }
  
  // Priority 4: Default to all
  return 'all';
}

/**
 * Detect media type from URL/filename
 */
export function detectMediaTypeFromUrl(url: string): 'image' | 'video' | 'unknown' {
  if (!url) return 'unknown';
  
  const lowerUrl = url.toLowerCase();
  
  // Video extensions
  if (
    lowerUrl.endsWith('.mp4') ||
    lowerUrl.endsWith('.webm') ||
    lowerUrl.endsWith('.mov') ||
    lowerUrl.endsWith('.avi') ||
    lowerUrl.endsWith('.mkv') ||
    lowerUrl.includes('/video/') ||
    lowerUrl.includes('video/')
  ) {
    return 'video';
  }
  
  // Image extensions
  if (
    lowerUrl.endsWith('.jpg') ||
    lowerUrl.endsWith('.jpeg') ||
    lowerUrl.endsWith('.png') ||
    lowerUrl.endsWith('.gif') ||
    lowerUrl.endsWith('.webp') ||
    lowerUrl.endsWith('.svg') ||
    lowerUrl.endsWith('.bmp') ||
    lowerUrl.includes('/image/') ||
    lowerUrl.includes('image/')
  ) {
    return 'image';
  }
  
  return 'unknown';
}

// ============================================
// COMPONENT PROPS
// ============================================

interface MediaFieldWithPickerProps {
  fieldKey: string;
  value: string;
  onChange: (value: string) => void;
  blockType: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function MediaFieldWithPicker({
  fieldKey,
  value,
  onChange,
  blockType,
  label,
  placeholder,
  required = false,
  disabled = false,
  className = '',
}: MediaFieldWithPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [inputMode, setInputMode] = useState<'picker' | 'url'>('picker');
  const [urlInput, setUrlInput] = useState('');
  
  // Determine expected media type
  const expectedMediaType = useMemo(
    () => getMediaTypeForField(fieldKey, blockType),
    [fieldKey, blockType]
  );
  
  // Resolve the current URL
  const resolvedUrl = useMemo(
    () => (value ? getMediaUrl(value) : ''),
    [value]
  );
  
  // Detect actual media type of current value
  const actualMediaType = useMemo(
    () => detectMediaTypeFromUrl(value),
    [value]
  );
  
  // Determine if we should show video preview
  const showVideoPreview = actualMediaType === 'video' || (
    actualMediaType === 'unknown' && expectedMediaType === 'video'
  );
  
  // Format the label
  const displayLabel = useMemo(() => {
    if (label) return label;
    // Convert camelCase to Title Case with spaces
    return fieldKey
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }, [label, fieldKey]);
  
  // Get media type label
  const mediaTypeLabel = useMemo(() => {
    switch (expectedMediaType) {
      case 'video': return 'Video';
      case 'image': return 'Image';
      default: return 'Media';
    }
  }, [expectedMediaType]);
  
  // Handle URL input submission
  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setInputMode('picker');
    }
  };
  
  // Handle media selection from picker
  const handleMediaSelect = (url: string) => {
    onChange(url);
    setShowPicker(false);
  };
  
  // Handle clear
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <Label className="text-sm font-medium flex items-center gap-2">
        {displayLabel}
        {required && <span className="text-red-500">*</span>}
        <span className="text-xs text-neutral-400 font-normal">
          ({mediaTypeLabel})
        </span>
      </Label>
      
      {/* Preview */}
      <div className="relative rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200 group">
        {resolvedUrl ? (
          showVideoPreview ? (
            // Video Preview
            <div className="relative">
              <video 
                src={resolvedUrl} 
                className="w-full h-32 object-cover"
                muted
                playsInline
                loop
                crossOrigin="anonymous"
                preload="metadata"
                onMouseEnter={(e) => e.currentTarget.play()}
                onMouseLeave={(e) => {
                  e.currentTarget.pause();
                  e.currentTarget.currentTime = 0;
                }}
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-xs text-white">
                Video
              </div>
            </div>
          ) : (
            // Image Preview
            <img 
              src={resolvedUrl} 
              alt={displayLabel}
              className="w-full h-32 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyOCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyOCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzlmYTZiMiI+SW1hZ2Ugbm90IGZvdW5kPC90ZXh0Pjwvc3ZnPg==';
              }}
            />
          )
        ) : (
          // Empty State
          <div className="w-full h-32 flex flex-col items-center justify-center text-neutral-400 gap-2">
            {expectedMediaType === 'video' ? (
              <Video className="w-8 h-8" strokeWidth={1.5} />
            ) : expectedMediaType === 'image' ? (
              <ImageIcon className="w-8 h-8" strokeWidth={1.5} />
            ) : (
              <Upload className="w-8 h-8" strokeWidth={1.5} />
            )}
            <span className="text-xs">No {mediaTypeLabel.toLowerCase()} selected</span>
          </div>
        )}
        
        {/* Clear Button (hover overlay) */}
        {resolvedUrl && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            aria-label="Clear media"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      
      {/* Actions */}
      {!disabled && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setShowPicker(true)}
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            {value ? 'Change' : 'Select'} {mediaTypeLabel}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setInputMode(inputMode === 'url' ? 'picker' : 'url')}
            title="Enter URL directly"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
      
      {/* URL Input Mode */}
      {inputMode === 'url' && !disabled && (
        <div className="flex gap-2">
          <Input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={placeholder || `Paste ${mediaTypeLabel.toLowerCase()} URL...`}
            className="text-xs flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleUrlSubmit();
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim()}
          >
            Add
          </Button>
        </div>
      )}
      
      {/* Current Value Display (for debugging) */}
      {value && (
        <p className="text-xs text-neutral-400 truncate" title={value}>
          {value.length > 50 ? `${value.substring(0, 50)}...` : value}
        </p>
      )}
      
      {/* Media Picker Modal */}
      {showPicker && (
        <MediaPicker
          open={showPicker}
          onSelect={handleMediaSelect}
          onClose={() => setShowPicker(false)}
          mediaType={expectedMediaType === 'all' ? 'all' : expectedMediaType}
        />
      )}
    </div>
  );
}

// ============================================
// UTILITY: Check if a field is a media field
// ============================================

/**
 * Check if a field key represents a media field
 */
export function isMediaField(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }
  const lowerKey = key.toLowerCase();
  
  const mediaPatterns = [
    ...VIDEO_FIELD_PATTERNS,
    ...IMAGE_FIELD_PATTERNS,
    'media', 'file', 'asset', 'upload',
  ];
  
  return mediaPatterns.some(pattern => lowerKey.includes(pattern));
}

export default MediaFieldWithPicker;
