import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Palette, Code, X, Trash2, Copy, ArrowUp, ArrowDown, Image, Video, Play, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import MediaPicker from '@/components/MediaPicker';
import VideoThumbnail from '@/components/VideoThumbnail';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePageBuilderStore } from '../usePageBuilderStore';
import { getBlockById } from '../blockTypes';

// Generic field renderer based on content type
function renderField(
  key: string,
  value: unknown,
  onChange: (key: string, value: unknown) => void,
  blockType: string
): React.ReactNode {
  const label = key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());

  // Boolean fields
  if (typeof value === 'boolean') {
    return (
      <div key={key} className="flex items-center justify-between py-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {label}
        </Label>
        <Switch
          id={key}
          checked={value}
          onCheckedChange={(checked) => onChange(key, checked)}
        />
      </div>
    );
  }

  // Number fields
  if (typeof value === 'number') {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {label}
        </Label>
        <Input
          id={key}
          type="number"
          value={value}
          onChange={(e) => onChange(key, Number(e.target.value))}
          className="bg-neutral-50 dark:bg-neutral-800"
        />
      </div>
    );
  }

  // Select fields for specific keys
  if (key === 'variant') {
    const variants = getVariantsForBlock(blockType);
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {label}
        </Label>
        <Select value={value as string} onValueChange={(v) => onChange(key, v)}>
          <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {variants.map((v) => (
              <SelectItem key={v} value={v}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (key === 'alignment') {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {label}
        </Label>
        <Select value={value as string} onValueChange={(v) => onChange(key, v)}>
          <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (key === 'columns') {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {label}
        </Label>
        <Select value={String(value)} onValueChange={(v) => onChange(key, Number(v))}>
          <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2, 3, 4, 5, 6].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} Columns
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (key === 'level') {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          Heading Level
        </Label>
        <Select value={value as string} onValueChange={(v) => onChange(key, v)}>
          <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((h) => (
              <SelectItem key={h} value={h}>
                {h.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Long text fields
  if (
    key === 'content' ||
    key === 'text' ||
    key === 'description' ||
    key === 'bio' ||
    key === 'quote' ||
    key === 'html' ||
    key === 'code' ||
    key === 'embedCode'
  ) {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {label}
        </Label>
        <Textarea
          id={key}
          value={value as string}
          onChange={(e) => onChange(key, e.target.value)}
          rows={4}
          className="bg-neutral-50 dark:bg-neutral-800 font-mono text-sm"
        />
      </div>
    );
  }

  // Image fields with MediaPicker - allow both images and videos for hero/background fields
  // Exclude color fields (backgroundColor, textColor, etc.)
  const isColorField = key.toLowerCase().includes('color');
  if (
    !isColorField && (
    key.toLowerCase().includes('image') ||
    key.toLowerCase().includes('src') ||
    key.toLowerCase().includes('background') ||
    key.toLowerCase().includes('poster') ||
    key.toLowerCase().includes('thumbnail') ||
    key.toLowerCase().includes('avatar') ||
    key.toLowerCase().includes('photo') ||
    key.toLowerCase().includes('picture'))
  ) {
    // For hero/background fields, allow both images and videos
    const allowBothMediaTypes = 
      key.toLowerCase().includes('hero') ||
      key.toLowerCase().includes('background') ||
      key === 'imageUrl' || // JE Hero blocks use imageUrl for both
      key === 'backgroundImage';
    
    return (
      <MediaFieldWithPicker
        key={key}
        fieldKey={key}
        label={label}
        value={value as string}
        onChange={onChange}
        mediaType={allowBothMediaTypes ? 'all' : 'image'}
      />
    );
  }

  // Video URL fields with MediaPicker
  if (
    key.toLowerCase().includes('video') ||
    key.toLowerCase().includes('media')
  ) {
    return (
      <MediaFieldWithPicker
        key={key}
        fieldKey={key}
        label={label}
        value={value as string}
        onChange={onChange}
        mediaType="video"
      />
    );
  }

  // Regular URL/Link fields (non-media) - for things like ctaLink, buttonLink, etc.
  if (
    key.toLowerCase().includes('link') ||
    (key.toLowerCase().includes('url') && !key.toLowerCase().includes('video') && !key.toLowerCase().includes('image'))
  ) {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {label}
        </Label>
        <Input
          id={key}
          type="url"
          value={value as string}
          onChange={(e) => onChange(key, e.target.value)}
          placeholder="https://..."
          className="bg-neutral-50 dark:bg-neutral-800"
        />
      </div>
    );
  }

  // Per-field color picker fields (titleColor, subtitleColor, descriptionColor, etc.)
  if (key.endsWith('Color') && typeof value === 'string') {
    // Get the field name this color applies to (e.g., "title" from "titleColor")
    const fieldName = key.replace('Color', '');
    const fieldLabel = fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
    
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {fieldLabel} Color
        </Label>
        <div className="flex gap-2">
          <Input
            type="color"
            className="w-12 h-10 p-1 cursor-pointer rounded"
            value={value || '#ffffff'}
            onChange={(e) => onChange(key, e.target.value)}
          />
          <Input
            id={key}
            value={value}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder="#ffffff or leave empty for default"
            className="flex-1 bg-neutral-50 dark:bg-neutral-800"
          />
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 px-2 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => onChange(key, '')}
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Default string fields
  if (typeof value === 'string') {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {label}
        </Label>
        <Input
          id={key}
          value={value}
          onChange={(e) => onChange(key, e.target.value)}
          className="bg-neutral-50 dark:bg-neutral-800"
        />
      </div>
    );
  }

  // Handle button objects (primaryButton, secondaryButton)
  if (
    (key === 'primaryButton' || key === 'secondaryButton') &&
    typeof value === 'object' &&
    value !== null
  ) {
    const buttonValue = value as { text?: string; link?: string };
    return (
      <div key={key} className="space-y-3 p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="space-y-2">
          <div>
            <Label htmlFor={`${key}-text`} className="text-xs text-muted-foreground">
              Button Text
            </Label>
            <Input
              id={`${key}-text`}
              value={buttonValue.text || ''}
              onChange={(e) =>
                onChange(key, { ...buttonValue, text: e.target.value })
              }
              placeholder="Button text"
              className="bg-white dark:bg-neutral-900"
            />
          </div>
          <div>
            <Label htmlFor={`${key}-link`} className="text-xs text-muted-foreground">
              Button Link
            </Label>
            <Input
              id={`${key}-link`}
              value={buttonValue.link || ''}
              onChange={(e) =>
                onChange(key, { ...buttonValue, link: e.target.value })
              }
              placeholder="https://..."
              className="bg-white dark:bg-neutral-900"
            />
          </div>
        </div>
      </div>
    );
  }

  // Handle ctaText and ctaLink fields specifically
  if (key === 'ctaText' || key === 'ctaLink') {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {key === 'ctaText' ? 'CTA Button Text' : 'CTA Button Link'}
        </Label>
        <Input
          id={key}
          value={value as string || ''}
          onChange={(e) => onChange(key, e.target.value)}
          placeholder={key === 'ctaText' ? 'Get Started' : 'https://...'}
          className="bg-neutral-50 dark:bg-neutral-800"
        />
      </div>
    );
  }

  // Handle carousel items array
  if (key === 'items' && Array.isArray(value)) {
    const items = value as Array<{ title: string; description?: string; imageUrl?: string; link?: string }>;
    return (
      <CarouselItemsEditor
        key={key}
        items={items}
        onChange={(newItems) => onChange(key, newItems)}
      />
    );
  }

  // Skip other complex objects/arrays for now (would need custom editors)
  return null;
}

// ==========================================
// MEDIA TYPE DETECTION UTILITIES
// ==========================================

/**
 * Video-specific field patterns - these fields should ONLY show videos
 */
const VIDEO_FIELD_PATTERNS = [
  'videourl', 'video', 'backgroundvideo', 'herovideo',
  'videosrc', 'videosource', 'mp4url', 'webmurl', 'movurl',
];

/**
 * Image-specific field patterns - these fields should ONLY show images
 */
const IMAGE_FIELD_PATTERNS = [
  'imageurl', 'image', 'backgroundimage', 'heroimage',
  'thumbnail', 'thumbnailurl', 'poster', 'posterimage',
  'avatar', 'avatarurl', 'logo', 'logourl', 'icon', 'iconurl',
  'photo', 'photourl', 'picture', 'pictureurl',
  'banner', 'bannerurl', 'cover', 'coverurl', 'ogimage', 'favicon',
];

/**
 * Block-type specific field overrides for media type
 */
const BLOCK_TYPE_OVERRIDES: Record<string, Record<string, 'video' | 'image' | 'all'>> = {
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
 */
function getMediaTypeForField(key: string, blockType: string): 'video' | 'image' | 'all' {
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
function detectMediaTypeFromUrl(url: string): 'image' | 'video' | 'unknown' {
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

// Unified Media field component with MediaPicker integration for both images and videos
function MediaFieldWithPicker({
  fieldKey,
  label,
  value,
  onChange,
  mediaType = 'all',
  blockType = '',
}: {
  fieldKey: string;
  label: string;
  value: string;
  onChange: (key: string, value: unknown) => void;
  mediaType?: 'image' | 'video' | 'all';
  blockType?: string;
}) {
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  
  // Determine expected media type based on field key and block type
  const expectedMediaType = blockType ? getMediaTypeForField(fieldKey, blockType) : mediaType;
  
  // Detect actual media type of current value
  const actualMediaType = detectMediaTypeFromUrl(value);
  
  // Determine if we should show video preview
  const showVideoPreview = actualMediaType === 'video' || (
    actualMediaType === 'unknown' && expectedMediaType === 'video'
  );
  
  // Get media type label for UI
  const mediaTypeLabel = expectedMediaType === 'video' ? 'Video' : 
                         expectedMediaType === 'image' ? 'Image' : 'Media';

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldKey} className="text-sm font-medium flex items-center gap-2">
        {label}
        <span className="text-xs text-neutral-400 font-normal">({mediaTypeLabel})</span>
      </Label>
      <div className="flex gap-2">
        <Input
          id={fieldKey}
          type="url"
          value={value || ''}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          placeholder="https://..."
          className="bg-neutral-50 dark:bg-neutral-800 flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMediaPickerOpen(true)}
          className="px-3"
          title={`Select ${mediaTypeLabel} from Media Library`}
        >
          {showVideoPreview ? <Video className="w-4 h-4" /> : <Image className="w-4 h-4" />}
        </Button>
      </div>
      {value && (
        <div className="relative w-full h-24 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          {showVideoPreview ? (
            <div className="relative w-full h-full">
              <video 
                src={value} 
                className="w-full h-full object-cover"
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
              <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/60 rounded text-xs text-white">
                Video
              </div>
            </div>
          ) : (
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
        </div>
      )}
      <MediaPicker
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => {
          onChange(fieldKey, url);
          setMediaPickerOpen(false);
        }}
        mediaType={expectedMediaType === 'all' ? undefined : expectedMediaType}
      />
    </div>
  );
}

// Carousel Items Editor Component
interface CarouselItem {
  title: string;
  description?: string;
  imageUrl?: string;
  link?: string;
}

function CarouselItemsEditor({
  items,
  onChange,
}: {
  items: CarouselItem[];
  onChange: (items: CarouselItem[]) => void;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  const updateItem = (index: number, field: keyof CarouselItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const addItem = () => {
    const newItems = [...items, { title: `Item ${items.length + 1}`, description: '', imageUrl: '', link: '' }];
    onChange(newItems);
    setExpandedIndex(newItems.length - 1);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return; // Keep at least one item
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length) return;
    const newItems = [...items];
    const [removed] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, removed);
    onChange(newItems);
    setExpandedIndex(toIndex);
  };

  const openMediaPicker = (index: number) => {
    setSelectedItemIndex(index);
    setMediaPickerOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Carousel Items ({items.length})</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          className="h-7 px-2 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Item
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden"
          >
            {/* Item Header */}
            <div
              className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 cursor-pointer"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              {/* Thumbnail */}
              <div className="w-10 h-10 rounded bg-neutral-200 dark:bg-neutral-700 flex-shrink-0 overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-4 h-4 text-neutral-400" />
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title || `Item ${index + 1}`}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveItem(index, index - 1);
                  }}
                  disabled={index === 0}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveItem(index, index + 1);
                  }}
                  disabled={index === items.length - 1}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(index);
                  }}
                  disabled={items.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                {expandedIndex === index ? (
                  <ChevronUp className="w-4 h-4 text-neutral-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                )}
              </div>
            </div>

            {/* Expanded Content */}
            {expandedIndex === index && (
              <div className="p-3 space-y-3 border-t border-neutral-200 dark:border-neutral-700">
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Image</Label>
                  <div className="flex gap-2">
                    {item.imageUrl && (
                      <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={() => openMediaPicker(index)}
                      >
                        <Image className="w-3 h-3 mr-1" />
                        {item.imageUrl ? 'Change Image' : 'Select Image'}
                      </Button>
                      {item.imageUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => updateItem(index, 'imageUrl', '')}
                        >
                          Remove Image
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input
                    value={item.title}
                    onChange={(e) => updateItem(index, 'title', e.target.value)}
                    placeholder="Item title"
                    className="h-8 text-sm bg-white dark:bg-neutral-900"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea
                    value={item.description || ''}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Item description"
                    rows={2}
                    className="text-sm bg-white dark:bg-neutral-900"
                  />
                </div>

                {/* Link */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Link</Label>
                  <Input
                    value={item.link || ''}
                    onChange={(e) => updateItem(index, 'link', e.target.value)}
                    placeholder="/page-link or https://..."
                    className="h-8 text-sm bg-white dark:bg-neutral-900"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Media Picker Modal */}
      <MediaPicker
        open={mediaPickerOpen}
        onClose={() => {
          setMediaPickerOpen(false);
          setSelectedItemIndex(null);
        }}
        onSelect={(url) => {
          if (selectedItemIndex !== null) {
            updateItem(selectedItemIndex, 'imageUrl', url);
          }
          setMediaPickerOpen(false);
          setSelectedItemIndex(null);
        }}
        mediaType="image"
      />
    </div>
  );
}

function getVariantsForBlock(blockType: string): string[] {
  const variantMap: Record<string, string[]> = {
    hero: ['centered', 'left-aligned', 'split', 'video-background'],
    testimonials: ['carousel', 'grid', 'single'],
    team: ['card', 'simple', 'overlay'],
    timeline: ['vertical', 'horizontal', 'alternating'],
    cta: ['centered', 'split', 'minimal'],
    quote: ['default', 'large', 'bordered', 'modern'],
    stats: ['default', 'card', 'minimal'],
    button: ['primary', 'secondary', 'outline', 'ghost'],
    alert: ['info', 'success', 'warning', 'error'],
  };
  return variantMap[blockType] || ['default'];
}

export default function BlockSettings() {
  const {
    blocks,
    selectedBlockId,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    moveBlock,
    selectBlock,
  } = usePageBuilderStore();

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
  const blockType = selectedBlock ? getBlockById(selectedBlock.type) : null;
  const blockIndex = selectedBlock ? blocks.findIndex((b) => b.id === selectedBlockId) : -1;

  const handleContentChange = (key: string, value: unknown) => {
    if (selectedBlockId) {
      updateBlock(selectedBlockId, { [key]: value });
    }
  };

  if (!selectedBlock || !blockType) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
          <Settings className="w-8 h-8 text-neutral-400" />
        </div>
        <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
          No Block Selected
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Select a block on the canvas to edit its settings
        </p>
      </div>
    );
  }

  const Icon = blockType.icon;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
              {blockType.name}
            </h3>
            <p className="text-xs text-neutral-500 truncate">{blockType.description}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => selectBlock(null)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => selectedBlockId && duplicateBlock(selectedBlockId)}
          >
            <Copy className="w-4 h-4 mr-1" />
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={blockIndex === 0}
            onClick={() => moveBlock(blockIndex, blockIndex - 1)}
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={blockIndex === blocks.length - 1}
            onClick={() => moveBlock(blockIndex, blockIndex + 1)}
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (selectedBlockId) {
                deleteBlock(selectedBlockId);
                selectBlock(null);
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Settings tabs */}
      <Tabs defaultValue="content" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="content" className="flex-1">
            <Settings className="w-4 h-4 mr-1" />
            Content
          </TabsTrigger>
          <TabsTrigger value="style" className="flex-1">
            <Palette className="w-4 h-4 mr-1" />
            Style
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex-1">
            <Code className="w-4 h-4 mr-1" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="content" className="p-4 space-y-4 mt-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedBlockId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {Object.entries(selectedBlock.content).map(([key, value]) => {
                  // Skip complex nested objects for now
                  if (typeof value === 'object' && value !== null) {
                    return null;
                  }
                  return renderField(key, value, handleContentChange, selectedBlock.type);
                })}
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="style" className="p-4 space-y-4 mt-0">
            <div className="space-y-4">
              {/* Colors Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Colors</h4>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      className="w-12 h-10 p-1 cursor-pointer"
                      value={selectedBlock.content.backgroundColor as string || '#ffffff'}
                      onChange={(e) => handleContentChange('backgroundColor', e.target.value)}
                    />
                    <Input
                      value={selectedBlock.content.backgroundColor as string || ''}
                      onChange={(e) => handleContentChange('backgroundColor', e.target.value)}
                      placeholder="#ffffff or transparent"
                      className="flex-1 bg-neutral-50 dark:bg-neutral-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      className="w-12 h-10 p-1 cursor-pointer"
                      value={selectedBlock.content.textColor as string || '#000000'}
                      onChange={(e) => handleContentChange('textColor', e.target.value)}
                    />
                    <Input
                      value={selectedBlock.content.textColor as string || ''}
                      onChange={(e) => handleContentChange('textColor', e.target.value)}
                      placeholder="#000000"
                      className="flex-1 bg-neutral-50 dark:bg-neutral-800"
                    />
                  </div>
                </div>
              </div>

              {/* Size & Shape Section */}
              <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Size & Shape</h4>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Min Height</Label>
                  <Select
                    value={selectedBlock.content.minHeight as string || 'auto'}
                    onValueChange={(v) => handleContentChange('minHeight', v)}
                  >
                    <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="300px">Small (300px)</SelectItem>
                      <SelectItem value="500px">Medium (500px)</SelectItem>
                      <SelectItem value="70vh">Large (70vh)</SelectItem>
                      <SelectItem value="80vh">Extra Large (80vh)</SelectItem>
                      <SelectItem value="100vh">Full Screen (100vh)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Max Width</Label>
                  <Select
                    value={selectedBlock.content.maxWidth as string || 'full'}
                    onValueChange={(v) => handleContentChange('maxWidth', v)}
                  >
                    <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Small (640px)</SelectItem>
                      <SelectItem value="md">Medium (768px)</SelectItem>
                      <SelectItem value="lg">Large (1024px)</SelectItem>
                      <SelectItem value="xl">XL (1280px)</SelectItem>
                      <SelectItem value="2xl">2XL (1536px)</SelectItem>
                      <SelectItem value="4xl">4XL (896px)</SelectItem>
                      <SelectItem value="6xl">6XL (1152px)</SelectItem>
                      <SelectItem value="7xl">7XL (1280px)</SelectItem>
                      <SelectItem value="full">Full Width</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Border Radius</Label>
                  <Select
                    value={selectedBlock.content.borderRadius as string || 'none'}
                    onValueChange={(v) => handleContentChange('borderRadius', v)}
                  >
                    <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (0)</SelectItem>
                      <SelectItem value="0.5rem">Small (0.5rem)</SelectItem>
                      <SelectItem value="1rem">Medium (1rem)</SelectItem>
                      <SelectItem value="1.5rem">Large (1.5rem)</SelectItem>
                      <SelectItem value="2rem">XL (2rem)</SelectItem>
                      <SelectItem value="2.5rem">2XL (2.5rem)</SelectItem>
                      <SelectItem value="3rem">3XL (3rem)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bottom Curve Toggle for Hero blocks */}
                {selectedBlock.type.includes('hero') && (
                  <div className="flex items-center justify-between py-2">
                    <Label className="text-sm font-medium">Curved Bottom Edge</Label>
                    <Switch
                      checked={selectedBlock.content.bottomCurve as boolean ?? true}
                      onCheckedChange={(checked) => handleContentChange('bottomCurve', checked)}
                    />
                  </div>
                )}
              </div>

              {/* Spacing Section */}
              <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Spacing</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Padding Top</Label>
                    <Select
                      value={selectedBlock.content.paddingTop as string || '16'}
                      onValueChange={(v) => handleContentChange('paddingTop', v)}
                    >
                      <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0</SelectItem>
                        <SelectItem value="4">1rem</SelectItem>
                        <SelectItem value="6">1.5rem</SelectItem>
                        <SelectItem value="8">2rem</SelectItem>
                        <SelectItem value="12">3rem</SelectItem>
                        <SelectItem value="16">4rem</SelectItem>
                        <SelectItem value="20">5rem</SelectItem>
                        <SelectItem value="24">6rem</SelectItem>
                        <SelectItem value="32">8rem</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Padding Bottom</Label>
                    <Select
                      value={selectedBlock.content.paddingBottom as string || '16'}
                      onValueChange={(v) => handleContentChange('paddingBottom', v)}
                    >
                      <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0</SelectItem>
                        <SelectItem value="4">1rem</SelectItem>
                        <SelectItem value="6">1.5rem</SelectItem>
                        <SelectItem value="8">2rem</SelectItem>
                        <SelectItem value="12">3rem</SelectItem>
                        <SelectItem value="16">4rem</SelectItem>
                        <SelectItem value="20">5rem</SelectItem>
                        <SelectItem value="24">6rem</SelectItem>
                        <SelectItem value="32">8rem</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Padding Left</Label>
                    <Select
                      value={selectedBlock.content.paddingLeft as string || '6'}
                      onValueChange={(v) => handleContentChange('paddingLeft', v)}
                    >
                      <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0</SelectItem>
                        <SelectItem value="4">1rem</SelectItem>
                        <SelectItem value="6">1.5rem</SelectItem>
                        <SelectItem value="8">2rem</SelectItem>
                        <SelectItem value="12">3rem</SelectItem>
                        <SelectItem value="16">4rem</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Padding Right</Label>
                    <Select
                      value={selectedBlock.content.paddingRight as string || '6'}
                      onValueChange={(v) => handleContentChange('paddingRight', v)}
                    >
                      <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0</SelectItem>
                        <SelectItem value="4">1rem</SelectItem>
                        <SelectItem value="6">1.5rem</SelectItem>
                        <SelectItem value="8">2rem</SelectItem>
                        <SelectItem value="12">3rem</SelectItem>
                        <SelectItem value="16">4rem</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Content Alignment Section */}
              <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Content Position</h4>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Vertical Align</Label>
                  <Select
                    value={selectedBlock.content.contentVerticalAlign as string || 'center'}
                    onValueChange={(v) => handleContentChange('contentVerticalAlign', v)}
                  >
                    <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="start">Top</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="end">Bottom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Horizontal Align</Label>
                  <Select
                    value={selectedBlock.content.contentHorizontalAlign as string || 'center'}
                    onValueChange={(v) => handleContentChange('contentHorizontalAlign', v)}
                  >
                    <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="start">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="end">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Content Max Width</Label>
                  <Select
                    value={selectedBlock.content.contentMaxWidth as string || '4xl'}
                    onValueChange={(v) => handleContentChange('contentMaxWidth', v)}
                  >
                    <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Small (640px)</SelectItem>
                      <SelectItem value="md">Medium (768px)</SelectItem>
                      <SelectItem value="lg">Large (1024px)</SelectItem>
                      <SelectItem value="xl">XL (1280px)</SelectItem>
                      <SelectItem value="2xl">2XL (1536px)</SelectItem>
                      <SelectItem value="3xl">3XL (768px)</SelectItem>
                      <SelectItem value="4xl">4XL (896px)</SelectItem>
                      <SelectItem value="full">Full Width</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Carousel-specific controls */}
              {selectedBlock.type.includes('carousel') && (
                <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Carousel Cards</h4>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Card Border Radius</Label>
                    <Select
                      value={selectedBlock.content.cardBorderRadius as string || '2rem'}
                      onValueChange={(v) => handleContentChange('cardBorderRadius', v)}
                    >
                      <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">None</SelectItem>
                        <SelectItem value="0.5rem">Small</SelectItem>
                        <SelectItem value="1rem">Medium</SelectItem>
                        <SelectItem value="1.5rem">Large</SelectItem>
                        <SelectItem value="2rem">XL (Curved)</SelectItem>
                        <SelectItem value="2.5rem">2XL (More Curved)</SelectItem>
                        <SelectItem value="3rem">3XL (Very Curved)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Card Height</Label>
                    <Select
                      value={selectedBlock.content.cardHeight as string || '400px'}
                      onValueChange={(v) => handleContentChange('cardHeight', v)}
                    >
                      <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300px">Small (300px)</SelectItem>
                        <SelectItem value="350px">Medium (350px)</SelectItem>
                        <SelectItem value="400px">Large (400px)</SelectItem>
                        <SelectItem value="450px">XL (450px)</SelectItem>
                        <SelectItem value="500px">2XL (500px)</SelectItem>
                        <SelectItem value="60vh">60% Viewport</SelectItem>
                        <SelectItem value="70vh">70% Viewport</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <Label className="text-sm font-medium">Show Section Title</Label>
                    <Switch
                      checked={selectedBlock.content.showTitle as boolean ?? true}
                      onCheckedChange={(checked) => handleContentChange('showTitle', checked)}
                    />
                  </div>
                </div>
              )}

              {/* Title Element Controls - for JE blocks */}
              {selectedBlock.type.startsWith('je-') && (
                <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title Element</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Font Size</Label>
                      <Input
                        value={selectedBlock.content.titleFontSize as string || '3rem'}
                        onChange={(e) => handleContentChange('titleFontSize', e.target.value)}
                        placeholder="3rem"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Line Height</Label>
                      <Input
                        value={selectedBlock.content.titleLineHeight as string || '1.2'}
                        onChange={(e) => handleContentChange('titleLineHeight', e.target.value)}
                        placeholder="1.2"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Margin Bottom</Label>
                      <Input
                        value={selectedBlock.content.titleMarginBottom as string || '1.5rem'}
                        onChange={(e) => handleContentChange('titleMarginBottom', e.target.value)}
                        placeholder="1.5rem"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Font Weight</Label>
                      <Select
                        value={selectedBlock.content.titleFontWeight as string || '300'}
                        onValueChange={(v) => handleContentChange('titleFontWeight', v)}
                      >
                        <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="100">Thin (100)</SelectItem>
                          <SelectItem value="200">Extra Light (200)</SelectItem>
                          <SelectItem value="300">Light (300)</SelectItem>
                          <SelectItem value="400">Normal (400)</SelectItem>
                          <SelectItem value="500">Medium (500)</SelectItem>
                          <SelectItem value="600">Semi Bold (600)</SelectItem>
                          <SelectItem value="700">Bold (700)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Font Style</Label>
                    <Select
                      value={selectedBlock.content.titleFontStyle as string || 'italic'}
                      onValueChange={(v) => handleContentChange('titleFontStyle', v)}
                    >
                      <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="italic">Italic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Subtitle Element Controls - for JE blocks */}
              {selectedBlock.type.startsWith('je-') && (
                <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subtitle/Label Element</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Font Size</Label>
                      <Input
                        value={selectedBlock.content.subtitleFontSize as string || selectedBlock.content.labelFontSize as string || '0.75rem'}
                        onChange={(e) => {
                          handleContentChange('subtitleFontSize', e.target.value);
                          handleContentChange('labelFontSize', e.target.value);
                        }}
                        placeholder="0.75rem"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Letter Spacing</Label>
                      <Input
                        value={selectedBlock.content.subtitleLetterSpacing as string || '0.3em'}
                        onChange={(e) => handleContentChange('subtitleLetterSpacing', e.target.value)}
                        placeholder="0.3em"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label className="text-xs text-muted-foreground">Margin Bottom</Label>
                      <Input
                        value={selectedBlock.content.subtitleMarginBottom as string || selectedBlock.content.labelMarginBottom as string || '1rem'}
                        onChange={(e) => {
                          handleContentChange('subtitleMarginBottom', e.target.value);
                          handleContentChange('labelMarginBottom', e.target.value);
                        }}
                        placeholder="1rem"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Description Element Controls - for JE blocks */}
              {selectedBlock.type.startsWith('je-') && (
                <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description Element</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Font Size</Label>
                      <Input
                        value={selectedBlock.content.descriptionFontSize as string || '1.125rem'}
                        onChange={(e) => handleContentChange('descriptionFontSize', e.target.value)}
                        placeholder="1.125rem"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Line Height</Label>
                      <Input
                        value={selectedBlock.content.descriptionLineHeight as string || '1.75'}
                        onChange={(e) => handleContentChange('descriptionLineHeight', e.target.value)}
                        placeholder="1.75"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Margin Bottom</Label>
                      <Input
                        value={selectedBlock.content.descriptionMarginBottom as string || '2rem'}
                        onChange={(e) => handleContentChange('descriptionMarginBottom', e.target.value)}
                        placeholder="2rem"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Max Width</Label>
                      <Input
                        value={selectedBlock.content.descriptionMaxWidth as string || '100%'}
                        onChange={(e) => handleContentChange('descriptionMaxWidth', e.target.value)}
                        placeholder="32rem or 100%"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* CTA Button Element Controls - for JE blocks */}
              {selectedBlock.type.startsWith('je-') && (
                <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CTA Button Element</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Border Radius</Label>
                      <Input
                        value={selectedBlock.content.ctaBorderRadius as string || '9999px'}
                        onChange={(e) => handleContentChange('ctaBorderRadius', e.target.value)}
                        placeholder="9999px (pill) or 0.5rem"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Font Size</Label>
                      <Input
                        value={selectedBlock.content.ctaFontSize as string || '0.875rem'}
                        onChange={(e) => handleContentChange('ctaFontSize', e.target.value)}
                        placeholder="0.875rem"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Padding X</Label>
                      <Input
                        value={selectedBlock.content.ctaPaddingX as string || '2rem'}
                        onChange={(e) => handleContentChange('ctaPaddingX', e.target.value)}
                        placeholder="2rem"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Padding Y</Label>
                      <Input
                        value={selectedBlock.content.ctaPaddingY as string || '1rem'}
                        onChange={(e) => handleContentChange('ctaPaddingY', e.target.value)}
                        placeholder="1rem"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Letter Spacing</Label>
                      <Input
                        value={selectedBlock.content.ctaLetterSpacing as string || '0.2em'}
                        onChange={(e) => handleContentChange('ctaLetterSpacing', e.target.value)}
                        placeholder="0.2em"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Border Width</Label>
                      <Input
                        value={selectedBlock.content.ctaBorderWidth as string || '1px'}
                        onChange={(e) => handleContentChange('ctaBorderWidth', e.target.value)}
                        placeholder="1px"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Image Element Controls - for JE section blocks */}
              {(selectedBlock.type.includes('section') || selectedBlock.type.includes('split')) && selectedBlock.type.startsWith('je-') && (
                <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Image Element</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Width</Label>
                      <Input
                        value={selectedBlock.content.imageWidth as string || '100%'}
                        onChange={(e) => handleContentChange('imageWidth', e.target.value)}
                        placeholder="100% or 400px"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Height</Label>
                      <Input
                        value={selectedBlock.content.imageHeight as string || 'auto'}
                        onChange={(e) => handleContentChange('imageHeight', e.target.value)}
                        placeholder="auto or 300px"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Max Width</Label>
                      <Input
                        value={selectedBlock.content.imageMaxWidth as string || '100%'}
                        onChange={(e) => handleContentChange('imageMaxWidth', e.target.value)}
                        placeholder="100% or 500px"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Border Radius</Label>
                      <Input
                        value={selectedBlock.content.imageBorderRadius as string || '2rem'}
                        onChange={(e) => handleContentChange('imageBorderRadius', e.target.value)}
                        placeholder="2rem or 0"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Object Fit</Label>
                      <Select
                        value={selectedBlock.content.imageObjectFit as string || 'cover'}
                        onValueChange={(v) => handleContentChange('imageObjectFit', v)}
                      >
                        <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cover">Cover</SelectItem>
                          <SelectItem value="contain">Contain</SelectItem>
                          <SelectItem value="fill">Fill</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Margin Top</Label>
                      <Input
                        value={selectedBlock.content.imageMarginTop as string || '0'}
                        onChange={(e) => handleContentChange('imageMarginTop', e.target.value)}
                        placeholder="0 or 2rem"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Layout Controls - for JE section blocks */}
              {selectedBlock.type.includes('section') && selectedBlock.type.startsWith('je-') && (
                <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Section Layout</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Content Gap</Label>
                      <Input
                        value={selectedBlock.content.contentGap as string || '4rem'}
                        onChange={(e) => handleContentChange('contentGap', e.target.value)}
                        placeholder="4rem"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Section Padding Y</Label>
                      <Input
                        value={selectedBlock.content.sectionPaddingY as string || '6rem'}
                        onChange={(e) => handleContentChange('sectionPaddingY', e.target.value)}
                        placeholder="6rem"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Section Padding X</Label>
                      <Input
                        value={selectedBlock.content.sectionPaddingX as string || '1.5rem'}
                        onChange={(e) => handleContentChange('sectionPaddingX', e.target.value)}
                        placeholder="1.5rem"
                        className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Text Align</Label>
                      <Select
                        value={selectedBlock.content.contentTextAlign as string || 'left'}
                        onValueChange={(v) => handleContentChange('contentTextAlign', v)}
                      >
                        <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="p-4 space-y-4 mt-0">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">CSS Class</Label>
                <Input
                  value={selectedBlock.content.customClass as string || ''}
                  onChange={(e) => handleContentChange('customClass', e.target.value)}
                  placeholder="my-custom-class"
                  className="bg-neutral-50 dark:bg-neutral-800 font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">CSS ID</Label>
                <Input
                  value={selectedBlock.content.customId as string || ''}
                  onChange={(e) => handleContentChange('customId', e.target.value)}
                  placeholder="my-section"
                  className="bg-neutral-50 dark:bg-neutral-800 font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Custom CSS</Label>
                <Textarea
                  value={selectedBlock.content.customCss as string || ''}
                  onChange={(e) => handleContentChange('customCss', e.target.value)}
                  placeholder=".my-class { color: red; }"
                  rows={4}
                  className="bg-neutral-50 dark:bg-neutral-800 font-mono text-sm"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <Label className="text-sm font-medium">Hide on Mobile</Label>
                <Switch
                  checked={selectedBlock.content.hideOnMobile as boolean || false}
                  onCheckedChange={(checked) => handleContentChange('hideOnMobile', checked)}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <Label className="text-sm font-medium">Hide on Desktop</Label>
                <Switch
                  checked={selectedBlock.content.hideOnDesktop as boolean || false}
                  onCheckedChange={(checked) => handleContentChange('hideOnDesktop', checked)}
                />
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
