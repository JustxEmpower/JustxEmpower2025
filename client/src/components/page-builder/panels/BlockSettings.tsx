import React, { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Palette, Code, X, Trash2, Copy, ArrowUp, ArrowDown, Image, Video, Play, Plus, ChevronDown, ChevronUp, Calendar, Heart, Leaf, Moon, Star, Sun, Sparkles, Flower2, Mountain, Globe, Shield, Zap, Target, Award, Users, BookOpen, Link, Ruler, ArrowLeftRight, RotateCcw } from 'lucide-react';
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
import { IconPicker } from '../IconPicker';
import BlockAnimationSettings, { BlockAnimationConfig, DEFAULT_ANIMATION_CONFIG } from '../BlockAnimationSettings';
import CustomCSSEditor from '../CustomCSSEditor';
import { getBlockFields, getGroupedFields, FieldDefinition } from './BlockFieldDefinitions';
import { JEGallerySettingsPanel } from './JEGallerySettingsPanel';
import { CompactMarginRuler } from '../MarginRuler';

// Lazy load Rich Text Editor for performance
const RichTextEditor = lazy(() => import('../RichTextEditor'));

// Generic field renderer based on content type
function renderField(
  key: string,
  value: unknown,
  onChange: (key: string, value: unknown) => void,
  blockType: string
): React.ReactNode {
  // Guard against null/undefined keys
  if (!key || typeof key !== 'string') {
    return null;
  }
  
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
        <Select value={value != null ? String(value) : ''} onValueChange={(v) => onChange(key, v)}>
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
        <Select value={value != null ? String(value) : ''} onValueChange={(v) => onChange(key, v)}>
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

  // ============================================================================
  // SIZING CONTROLS - For proper proportions matching original site
  // ============================================================================

  // Section Padding
  if (key === 'sectionPadding') {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">Section Padding</Label>
        <Select value={value != null ? String(value) : ''} onValueChange={(v) => onChange(key, v)}>
          <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="compact">Compact (py-16/20)</SelectItem>
            <SelectItem value="standard">Standard (py-24/32)</SelectItem>
            <SelectItem value="spacious">Spacious (py-32/48)</SelectItem>
            <SelectItem value="hero">Hero (py-40/56)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Title Size
  if (key === 'titleSize') {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">Title Size</Label>
        <Select value={value != null ? String(value) : ''} onValueChange={(v) => onChange(key, v)}>
          <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small (3xl/4xl)</SelectItem>
            <SelectItem value="medium">Medium (4xl/5xl)</SelectItem>
            <SelectItem value="large">Large (5xl/6xl/7xl)</SelectItem>
            <SelectItem value="hero">Hero (6xl/7xl/8xl)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Subtitle/Body Size
  if (key === 'subtitleSize' || key === 'descriptionSize' || key === 'bodySize') {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">{label}</Label>
        <Select value={value != null ? String(value) : ''} onValueChange={(v) => onChange(key, v)}>
          <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small (base)</SelectItem>
            <SelectItem value="medium">Medium (lg/xl)</SelectItem>
            <SelectItem value="large">Large (xl/2xl)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Number Size (for principles, etc.)
  if (key === 'numberSize') {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">Number Size</Label>
        <Select value={value != null ? String(value) : ''} onValueChange={(v) => onChange(key, v)}>
          <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small (3xl/4xl)</SelectItem>
            <SelectItem value="medium">Medium (4xl/5xl)</SelectItem>
            <SelectItem value="large">Large (5xl/6xl)</SelectItem>
            <SelectItem value="hero">Hero (6xl/7xl)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Item Gap
  if (key === 'itemGap' || key === 'gap') {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">Item Spacing</Label>
        <Select value={value != null ? String(value) : ''} onValueChange={(v) => onChange(key, v)}>
          <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tight">Tight (gap-6/8)</SelectItem>
            <SelectItem value="standard">Standard (gap-8/12)</SelectItem>
            <SelectItem value="spacious">Spacious (gap-12/16)</SelectItem>
            <SelectItem value="wide">Wide (gap-16/24)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Max Width
  if (key === 'maxWidth') {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">Container Width</Label>
        <Select value={value != null ? String(value) : ''} onValueChange={(v) => onChange(key, v)}>
          <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="max-w-4xl">Narrow (4xl)</SelectItem>
            <SelectItem value="max-w-5xl">Medium (5xl)</SelectItem>
            <SelectItem value="max-w-6xl">Wide (6xl)</SelectItem>
            <SelectItem value="max-w-7xl">Extra Wide (7xl)</SelectItem>
            <SelectItem value="max-w-full">Full Width</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Header Margin
  if (key === 'headerMargin') {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">Header Bottom Margin</Label>
        <Select value={value != null ? String(value) : ''} onValueChange={(v) => onChange(key, v)}>
          <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mb-8 md:mb-12">Small</SelectItem>
            <SelectItem value="mb-12 md:mb-16">Medium</SelectItem>
            <SelectItem value="mb-16 md:mb-24">Large</SelectItem>
            <SelectItem value="mb-20 md:mb-32">Extra Large</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Image Size
  if (key === 'imageSize') {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">Image Size</Label>
        <Select value={value != null ? String(value) : ''} onValueChange={(v) => onChange(key, v)}>
          <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small (200px)</SelectItem>
            <SelectItem value="medium">Medium (300px)</SelectItem>
            <SelectItem value="large">Large (400px)</SelectItem>
            <SelectItem value="xlarge">Extra Large (500px)</SelectItem>
            <SelectItem value="full">Full Width</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Button Size
  if (key === 'buttonSize') {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">Button Size</Label>
        <Select value={value != null ? String(value) : ''} onValueChange={(v) => onChange(key, v)}>
          <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
            <SelectItem value="xl">Extra Large</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Handle footer columns array (JE Footer) - check for array first
  if (key === 'columns' && Array.isArray(value)) {
    return (
      <FooterColumnsEditor
        key={key}
        columns={value as Array<{ title: string; links: Array<{ text: string; url: string }> }>}
        onChange={(newColumns) => onChange(key, newColumns)}
      />
    );
  }

  // Handle social links array (JE Footer) - early check
  if (key === 'socialLinks' && Array.isArray(value)) {
    return (
      <SocialLinksEditor
        key={key}
        links={value as Array<{ platform: string; url: string }>}
        onChange={(newLinks) => onChange(key, newLinks)}
      />
    );
  }

  // Handle columns as number selector (for grid layouts)
  if (key === 'columns' && typeof value === 'number') {
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
        <Select value={value != null ? String(value) : ''} onValueChange={(v) => onChange(key, v)}>
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

  // Handle carousel items array (for JE Offerings Carousel)
  if (key === 'items' && Array.isArray(value)) {
    // Check if this is FAQ items (has question/answer) or carousel items (has title/imageUrl)
    const firstItem = value[0] as Record<string, unknown> | undefined;
    if (firstItem && 'question' in firstItem) {
      // FAQ items
      return (
        <FAQItemsEditor
          key={key}
          items={value as Array<{ question: string; answer: string }>}
          onChange={(newItems) => onChange(key, newItems)}
        />
      );
    }
    // Carousel items
    const items = value as Array<{ title: string; description?: string; imageUrl?: string; link?: string }>;
    return (
      <CarouselItemsEditor
        key={key}
        items={items}
        onChange={(newItems) => onChange(key, newItems)}
      />
    );
  }

  // Handle pillars array (JE Three Pillars)
  if (key === 'pillars' && Array.isArray(value)) {
    return (
      <PillarsEditor
        key={key}
        pillars={value as Array<{ title: string; description: string; icon: string }>}
        onChange={(newPillars) => onChange(key, newPillars)}
      />
    );
  }

  // Handle principles array (JE Foundational Principles)
  if (key === 'principles' && Array.isArray(value)) {
    return (
      <PrinciplesEditor
        key={key}
        principles={value as Array<{ number: string; title: string; description: string; imageUrl?: string }>}
        onChange={(newPrinciples) => onChange(key, newPrinciples)}
      />
    );
  }

  // Handle volumes array (JE Volumes Display)
  if (key === 'volumes' && Array.isArray(value)) {
    return (
      <VolumesEditor
        key={key}
        volumes={value as Array<{ title: string; description: string; imageUrl: string; link: string }>}
        onChange={(newVolumes) => onChange(key, newVolumes)}
      />
    );
  }

  // Handle images array (JE Image Gallery)
  if (key === 'images' && Array.isArray(value)) {
    return (
      <GalleryImagesEditor
        key={key}
        images={value as Array<{ url: string; alt?: string; caption?: string }>}
        onChange={(newImages) => onChange(key, newImages)}
      />
    );
  }

  // Handle slides array (JE Carousel)
  if (key === 'slides' && Array.isArray(value)) {
    return (
      <CarouselItemsEditor
        key={key}
        items={value as Array<{ title: string; description?: string; imageUrl?: string; link?: string }>}
        onChange={(newSlides) => onChange(key, newSlides)}
      />
    );
  }

  // Handle offerings array (JE Offerings Grid)
  if (key === 'offerings' && Array.isArray(value)) {
    return (
      <OfferingsEditor
        key={key}
        offerings={value as Array<{ title: string; description: string; imageUrl: string; price?: string; link: string }>}
        onChange={(newOfferings) => onChange(key, newOfferings)}
      />
    );
  }

  // Handle events array (JE Calendar)
  if (key === 'events' && Array.isArray(value)) {
    return (
      <EventsEditor
        key={key}
        events={value as Array<{ date: string; title: string; type: string; description?: string; link?: string }>}
        onChange={(newEvents) => onChange(key, newEvents)}
      />
    );
  }

  // Handle footer columns array (JE Footer)
  if (key === 'columns' && Array.isArray(value)) {
    return (
      <FooterColumnsEditor
        key={key}
        columns={value as Array<{ title: string; links: Array<{ text: string; url: string }> }>}
        onChange={(newColumns) => onChange(key, newColumns)}
      />
    );
  }

  // Handle social links array (JE Footer)
  if (key === 'socialLinks' && Array.isArray(value)) {
    return (
      <SocialLinksEditor
        key={key}
        links={value as Array<{ platform: string; url: string }>}
        onChange={(newLinks) => onChange(key, newLinks)}
      />
    );
  }

  // Handle features array (JE Community Section)
  if (key === 'features' && Array.isArray(value)) {
    return (
      <FeaturesEditor
        key={key}
        features={value as Array<{ icon: string; title: string; description: string }>}
        onChange={(newFeatures) => onChange(key, newFeatures)}
      />
    );
  }

  // Handle event types array (JE Calendar)
  if (key === 'eventTypes' && Array.isArray(value)) {
    return (
      <EventTypesEditor
        key={key}
        eventTypes={value as Array<{ id: string; name: string; color: string }>}
        onChange={(newTypes) => onChange(key, newTypes)}
      />
    );
  }

  // Handle form fields array (JE Contact Form)
  if (key === 'fields' && Array.isArray(value)) {
    return (
      <FormFieldsEditor
        key={key}
        fields={value as Array<{ name: string; label: string; type: string; required: boolean }>}
        onChange={(newFields) => onChange(key, newFields)}
      />
    );
  }

  // Skip other complex objects/arrays for now (would need custom editors)
  return null;
}

// ==========================================
// DYNAMIC FIELD RENDERER (from BlockFieldDefinitions)
// ==========================================

/**
 * Render a field based on its FieldDefinition from BlockFieldDefinitions.tsx
 * This provides consistent, definition-driven UI for all block properties.
 */
function renderDefinedField(
  field: FieldDefinition,
  value: unknown,
  onChange: (key: string, value: unknown) => void,
  blockType: string
): React.ReactNode {
  const { key, label, type, placeholder, description, options, min, max, required, itemFields } = field;
  
  // Handle based on field type
  switch (type) {
    case 'text':
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="text-sm font-medium">
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id={key}
            value={(value as string) || ''}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder={placeholder}
            className="bg-neutral-50 dark:bg-neutral-800"
          />
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      );
    
    case 'textarea':
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="text-sm font-medium">{label}</Label>
          <Textarea
            id={key}
            value={(value as string) || ''}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="bg-neutral-50 dark:bg-neutral-800"
          />
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      );
    
    case 'richtext':
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="text-sm font-medium">{label}</Label>
          <Suspense fallback={<div className="p-4 text-sm text-muted-foreground border rounded-md">Loading editor...</div>}>
            <RichTextEditor
              value={(value as string) || ''}
              onChange={(content) => onChange(key, content)}
              placeholder={placeholder}
              height={150}
            />
          </Suspense>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      );
    
    case 'number':
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="text-sm font-medium">{label}</Label>
          <Input
            id={key}
            type="number"
            value={(value as number) || min || 0}
            onChange={(e) => onChange(key, Number(e.target.value))}
            min={min}
            max={max}
            className="bg-neutral-50 dark:bg-neutral-800"
          />
        </div>
      );
    
    case 'boolean':
      return (
        <div key={key} className="flex items-center justify-between py-2">
          <div>
            <Label htmlFor={key} className="text-sm font-medium">{label}</Label>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <Switch
            id={key}
            checked={(value as boolean) || false}
            onCheckedChange={(checked) => onChange(key, checked)}
          />
        </div>
      );
    
    case 'select':
      // Ensure value is always a string for Radix Select (it calls toLowerCase internally)
      const selectValue = value != null ? String(value) : '';
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="text-sm font-medium">{label}</Label>
          <Select value={selectValue} onValueChange={(v) => onChange(key, v)}>
            <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
              <SelectValue placeholder={placeholder || `Select ${label}`} />
            </SelectTrigger>
            <SelectContent>
              {options?.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      );
    
    case 'color':
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="text-sm font-medium">{label}</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              className="w-12 h-10 p-1 cursor-pointer rounded"
              value={(value as string) || '#ffffff'}
              onChange={(e) => onChange(key, e.target.value)}
            />
            <Input
              id={key}
              value={(value as string) || ''}
              onChange={(e) => onChange(key, e.target.value)}
              placeholder={placeholder || '#ffffff'}
              className="bg-neutral-50 dark:bg-neutral-800 flex-1"
            />
          </div>
        </div>
      );
    
    case 'image':
      return (
        <MediaFieldWithPicker
          key={key}
          fieldKey={key}
          label={label}
          value={(value as string) || ''}
          onChange={onChange}
          mediaType="image"
        />
      );
    
    case 'video':
      return (
        <MediaFieldWithPicker
          key={key}
          fieldKey={key}
          label={label}
          value={(value as string) || ''}
          onChange={onChange}
          mediaType="video"
        />
      );
    
    case 'url':
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="text-sm font-medium">{label}</Label>
          <Input
            id={key}
            type="url"
            value={(value as string) || ''}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder={placeholder || 'https://...'}
            className="bg-neutral-50 dark:bg-neutral-800"
          />
        </div>
      );
    
    case 'alignment':
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="text-sm font-medium">{label}</Label>
          <Select value={(value as string) || 'left'} onValueChange={(v) => onChange(key, v)}>
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
    
    case 'icon':
      return (
        <div key={key} className="space-y-2">
          <Label className="text-sm font-medium">{label}</Label>
          <IconPicker
            value={(value as string) || ''}
            onChange={(icon) => onChange(key, icon)}
          />
        </div>
      );
    
    // For array types, fall back to existing editors
    case 'array':
    case 'stringarray':
      // These are handled by the existing renderField function
      return null;
    
    default:
      // Fall back to text input for unknown types
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key} className="text-sm font-medium">{label}</Label>
          <Input
            id={key}
            value={(value as string) || ''}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder={placeholder}
            className="bg-neutral-50 dark:bg-neutral-800"
          />
        </div>
      );
  }
}

/**
 * Render all defined fields for a block, grouped by category
 */
function renderFieldsFromDefinitions(
  blockType: string,
  content: Record<string, unknown>,
  onChange: (key: string, value: unknown) => void
): React.ReactNode {
  const groupedFields = getGroupedFields(blockType);
  const groups = Object.entries(groupedFields).filter(([_, fields]) => fields.length > 0);
  
  if (groups.length === 0) return null;
  
  return (
    <div className="space-y-6">
      {groups.map(([groupName, fields]) => (
        <div key={groupName} className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">
            {groupName.charAt(0).toUpperCase() + groupName.slice(1)}
          </h4>
          <div className="space-y-4">
            {fields.map((field) => {
              // Skip array fields - they need special handling
              if (field.type === 'array' || field.type === 'stringarray') {
                return renderField(field.key, content[field.key], onChange, blockType);
              }
              return renderDefinedField(field, content[field.key], onChange, blockType);
            })}
          </div>
        </div>
      ))}
    </div>
  );
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

// ==========================================
// ICON OPTIONS FOR PILLARS/FEATURES
// ==========================================
const ICON_OPTIONS = [
  { value: 'heart', label: 'Heart', icon: Heart },
  { value: 'leaf', label: 'Leaf', icon: Leaf },
  { value: 'moon', label: 'Moon', icon: Moon },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'sun', label: 'Sun', icon: Sun },
  { value: 'sparkles', label: 'Sparkles', icon: Sparkles },
  { value: 'flower', label: 'Flower', icon: Flower2 },
  { value: 'mountain', label: 'Mountain', icon: Mountain },
  { value: 'globe', label: 'Globe', icon: Globe },
  { value: 'shield', label: 'Shield', icon: Shield },
  { value: 'zap', label: 'Zap', icon: Zap },
  { value: 'target', label: 'Target', icon: Target },
  { value: 'award', label: 'Award', icon: Award },
  { value: 'users', label: 'Users', icon: Users },
  { value: 'book', label: 'Book', icon: BookOpen },
];

// ==========================================
// PILLARS EDITOR (JE Three Pillars)
// ==========================================
interface Pillar {
  title: string;
  description: string;
  icon: string;
}

function PillarsEditor({
  pillars,
  onChange,
}: {
  pillars: Pillar[];
  onChange: (pillars: Pillar[]) => void;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const updatePillar = (index: number, field: keyof Pillar, value: string) => {
    const newPillars = [...pillars];
    newPillars[index] = { ...newPillars[index], [field]: value };
    onChange(newPillars);
  };

  const addPillar = () => {
    const newPillars = [...pillars, { title: `Pillar ${pillars.length + 1}`, description: 'Description...', icon: 'heart' }];
    onChange(newPillars);
    setExpandedIndex(newPillars.length - 1);
  };

  const removePillar = (index: number) => {
    if (pillars.length <= 1) return;
    const newPillars = pillars.filter((_, i) => i !== index);
    onChange(newPillars);
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const movePillar = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pillars.length) return;
    const newPillars = [...pillars];
    const [removed] = newPillars.splice(fromIndex, 1);
    newPillars.splice(toIndex, 0, removed);
    onChange(newPillars);
    setExpandedIndex(toIndex);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Pillars ({pillars.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addPillar} className="h-7 px-2 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add Pillar
        </Button>
      </div>
      <div className="space-y-2">
        {pillars.map((pillar, index) => (
          <div key={index} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <div
              className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 cursor-pointer"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                {(() => {
                  const IconComponent = ICON_OPTIONS.find(i => i.value === pillar.icon)?.icon || Heart;
                  return <IconComponent className="w-4 h-4 text-primary" />;
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{pillar.title || `Pillar ${index + 1}`}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); movePillar(index, index - 1); }} disabled={index === 0}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); movePillar(index, index + 1); }} disabled={index === pillars.length - 1}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); removePillar(index); }} disabled={pillars.length <= 1}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                {expandedIndex === index ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
              </div>
            </div>
            {expandedIndex === index && (
              <div className="p-3 space-y-3 border-t border-neutral-200 dark:border-neutral-700">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Icon</Label>
                  <Select value={pillar.icon} onValueChange={(v) => updatePillar(index, 'icon', v)}>
                    <SelectTrigger className="h-8 text-sm bg-white dark:bg-neutral-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="w-4 h-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input value={pillar.title} onChange={(e) => updatePillar(index, 'title', e.target.value)} placeholder="Pillar title" className="h-8 text-sm bg-white dark:bg-neutral-900" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea value={pillar.description} onChange={(e) => updatePillar(index, 'description', e.target.value)} placeholder="Pillar description" rows={2} className="text-sm bg-white dark:bg-neutral-900" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// PRINCIPLES EDITOR (JE Foundational Principles)
// ==========================================
interface Principle {
  number: string;
  title: string;
  description: string;
  imageUrl?: string;
}

function PrinciplesEditor({
  principles,
  onChange,
}: {
  principles: Principle[];
  onChange: (principles: Principle[]) => void;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const updatePrinciple = (index: number, field: keyof Principle, value: string) => {
    const newPrinciples = [...principles];
    newPrinciples[index] = { ...newPrinciples[index], [field]: value };
    onChange(newPrinciples);
  };

  const addPrinciple = () => {
    const num = String(principles.length + 1).padStart(2, '0');
    const newPrinciples = [...principles, { number: num, title: `Principle ${principles.length + 1}`, description: 'Description...', imageUrl: '' }];
    onChange(newPrinciples);
    setExpandedIndex(newPrinciples.length - 1);
  };

  const removePrinciple = (index: number) => {
    if (principles.length <= 1) return;
    const newPrinciples = principles.filter((_, i) => i !== index);
    onChange(newPrinciples);
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const movePrinciple = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= principles.length) return;
    const newPrinciples = [...principles];
    const [removed] = newPrinciples.splice(fromIndex, 1);
    newPrinciples.splice(toIndex, 0, removed);
    onChange(newPrinciples);
    setExpandedIndex(toIndex);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Principles ({principles.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addPrinciple} className="h-7 px-2 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add Principle
        </Button>
      </div>
      <div className="space-y-2">
        {principles.map((principle, index) => (
          <div key={index} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <div
              className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 cursor-pointer"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {principle.number}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{principle.title || `Principle ${index + 1}`}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); movePrinciple(index, index - 1); }} disabled={index === 0}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); movePrinciple(index, index + 1); }} disabled={index === principles.length - 1}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); removePrinciple(index); }} disabled={principles.length <= 1}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                {expandedIndex === index ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
              </div>
            </div>
            {expandedIndex === index && (
              <div className="p-3 space-y-3 border-t border-neutral-200 dark:border-neutral-700">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Number</Label>
                    <Input value={principle.number} onChange={(e) => updatePrinciple(index, 'number', e.target.value)} placeholder="01" className="h-8 text-sm bg-white dark:bg-neutral-900" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Title</Label>
                    <Input value={principle.title} onChange={(e) => updatePrinciple(index, 'title', e.target.value)} placeholder="Principle title" className="h-8 text-sm bg-white dark:bg-neutral-900" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea value={principle.description} onChange={(e) => updatePrinciple(index, 'description', e.target.value)} placeholder="Principle description" rows={3} className="text-sm bg-white dark:bg-neutral-900" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Image (Optional)</Label>
                  <div className="flex gap-2">
                    {principle.imageUrl && (
                      <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                        <img src={principle.imageUrl} alt={principle.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <Button type="button" variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => { setSelectedIndex(index); setMediaPickerOpen(true); }}>
                        <Image className="w-3 h-3 mr-1" /> {principle.imageUrl ? 'Change Image' : 'Select Image'}
                      </Button>
                      {principle.imageUrl && (
                        <Button type="button" variant="ghost" size="sm" className="w-full h-7 text-xs text-destructive hover:text-destructive" onClick={() => updatePrinciple(index, 'imageUrl', '')}>
                          Remove Image
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <MediaPicker
        open={mediaPickerOpen}
        onClose={() => { setMediaPickerOpen(false); setSelectedIndex(null); }}
        onSelect={(url) => { if (selectedIndex !== null) updatePrinciple(selectedIndex, 'imageUrl', url); setMediaPickerOpen(false); setSelectedIndex(null); }}
        mediaType="image"
      />
    </div>
  );
}

// ==========================================
// VOLUMES EDITOR (JE Volumes Display)
// ==========================================
interface Volume {
  title: string;
  description: string;
  imageUrl: string;
  link: string;
}

function VolumesEditor({
  volumes,
  onChange,
}: {
  volumes: Volume[];
  onChange: (volumes: Volume[]) => void;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const updateVolume = (index: number, field: keyof Volume, value: string) => {
    const newVolumes = [...volumes];
    newVolumes[index] = { ...newVolumes[index], [field]: value };
    onChange(newVolumes);
  };

  const addVolume = () => {
    const newVolumes = [...volumes, { title: `Volume ${volumes.length + 1}`, description: 'Description...', imageUrl: '', link: '' }];
    onChange(newVolumes);
    setExpandedIndex(newVolumes.length - 1);
  };

  const removeVolume = (index: number) => {
    if (volumes.length <= 1) return;
    const newVolumes = volumes.filter((_, i) => i !== index);
    onChange(newVolumes);
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const moveVolume = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= volumes.length) return;
    const newVolumes = [...volumes];
    const [removed] = newVolumes.splice(fromIndex, 1);
    newVolumes.splice(toIndex, 0, removed);
    onChange(newVolumes);
    setExpandedIndex(toIndex);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Volumes ({volumes.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addVolume} className="h-7 px-2 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add Volume
        </Button>
      </div>
      <div className="space-y-2">
        {volumes.map((volume, index) => (
          <div key={index} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <div
              className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 cursor-pointer"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              <div className="w-10 h-10 rounded bg-neutral-200 dark:bg-neutral-700 flex-shrink-0 overflow-hidden">
                {volume.imageUrl ? (
                  <img src={volume.imageUrl} alt={volume.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-4 h-4 text-neutral-400" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{volume.title || `Volume ${index + 1}`}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); moveVolume(index, index - 1); }} disabled={index === 0}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); moveVolume(index, index + 1); }} disabled={index === volumes.length - 1}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeVolume(index); }} disabled={volumes.length <= 1}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                {expandedIndex === index ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
              </div>
            </div>
            {expandedIndex === index && (
              <div className="p-3 space-y-3 border-t border-neutral-200 dark:border-neutral-700">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Cover Image</Label>
                  <div className="flex gap-2">
                    {volume.imageUrl && (
                      <div className="w-16 h-20 rounded overflow-hidden flex-shrink-0">
                        <img src={volume.imageUrl} alt={volume.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <Button type="button" variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => { setSelectedIndex(index); setMediaPickerOpen(true); }}>
                        <Image className="w-3 h-3 mr-1" /> {volume.imageUrl ? 'Change Image' : 'Select Image'}
                      </Button>
                      {volume.imageUrl && (
                        <Button type="button" variant="ghost" size="sm" className="w-full h-7 text-xs text-destructive hover:text-destructive" onClick={() => updateVolume(index, 'imageUrl', '')}>
                          Remove Image
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input value={volume.title} onChange={(e) => updateVolume(index, 'title', e.target.value)} placeholder="Volume title" className="h-8 text-sm bg-white dark:bg-neutral-900" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea value={volume.description} onChange={(e) => updateVolume(index, 'description', e.target.value)} placeholder="Volume description" rows={2} className="text-sm bg-white dark:bg-neutral-900" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Link</Label>
                  <Input value={volume.link} onChange={(e) => updateVolume(index, 'link', e.target.value)} placeholder="/page-link or https://..." className="h-8 text-sm bg-white dark:bg-neutral-900" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <MediaPicker
        open={mediaPickerOpen}
        onClose={() => { setMediaPickerOpen(false); setSelectedIndex(null); }}
        onSelect={(url) => { if (selectedIndex !== null) updateVolume(selectedIndex, 'imageUrl', url); setMediaPickerOpen(false); setSelectedIndex(null); }}
        mediaType="image"
      />
    </div>
  );
}

// ==========================================
// GALLERY IMAGES EDITOR (JE Image Gallery)
// ==========================================
interface GalleryImage {
  url: string;
  alt?: string;
  caption?: string;
}

function GalleryImagesEditor({
  images,
  onChange,
}: {
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const updateImage = (index: number, field: keyof GalleryImage, value: string) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], [field]: value };
    onChange(newImages);
  };

  const addImage = () => {
    setSelectedIndex(images.length);
    setMediaPickerOpen(true);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    const newImages = [...images];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    onChange(newImages);
    setExpandedIndex(toIndex);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Gallery Images ({images.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addImage} className="h-7 px-2 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add Image
        </Button>
      </div>
      {images.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg">
          <Image className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
          <p className="text-sm text-muted-foreground">No images yet</p>
          <Button type="button" variant="outline" size="sm" onClick={addImage} className="mt-2">
            <Plus className="w-3 h-3 mr-1" /> Add First Image
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
              <img src={image.url} alt={image.alt || ''} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-white hover:text-white hover:bg-white/20" onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}>
                  <Settings className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-white hover:text-white hover:bg-white/20" onClick={() => { setSelectedIndex(index); setMediaPickerOpen(true); }}>
                  <Image className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-400 hover:bg-white/20" onClick={() => removeImage(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {expandedIndex === index && (
                <div className="absolute inset-x-0 bottom-0 p-2 bg-black/80 space-y-2">
                  <Input value={image.alt || ''} onChange={(e) => updateImage(index, 'alt', e.target.value)} placeholder="Alt text" className="h-7 text-xs" />
                  <Input value={image.caption || ''} onChange={(e) => updateImage(index, 'caption', e.target.value)} placeholder="Caption" className="h-7 text-xs" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <MediaPicker
        open={mediaPickerOpen}
        onClose={() => { setMediaPickerOpen(false); setSelectedIndex(null); }}
        onSelect={(url) => {
          if (selectedIndex !== null) {
            if (selectedIndex >= images.length) {
              // Adding new image
              onChange([...images, { url, alt: '', caption: '' }]);
            } else {
              // Updating existing image
              updateImage(selectedIndex, 'url', url);
            }
          }
          setMediaPickerOpen(false);
          setSelectedIndex(null);
        }}
        mediaType="image"
      />
    </div>
  );
}

// ==========================================
// OFFERINGS EDITOR (JE Offerings Grid)
// ==========================================
interface Offering {
  title: string;
  description: string;
  imageUrl: string;
  price?: string;
  link: string;
}

function OfferingsEditor({
  offerings,
  onChange,
}: {
  offerings: Offering[];
  onChange: (offerings: Offering[]) => void;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const updateOffering = (index: number, field: keyof Offering, value: string) => {
    const newOfferings = [...offerings];
    newOfferings[index] = { ...newOfferings[index], [field]: value };
    onChange(newOfferings);
  };

  const addOffering = () => {
    const newOfferings = [...offerings, { title: `Offering ${offerings.length + 1}`, description: 'Description...', imageUrl: '', price: '', link: '' }];
    onChange(newOfferings);
    setExpandedIndex(newOfferings.length - 1);
  };

  const removeOffering = (index: number) => {
    if (offerings.length <= 1) return;
    const newOfferings = offerings.filter((_, i) => i !== index);
    onChange(newOfferings);
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const moveOffering = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= offerings.length) return;
    const newOfferings = [...offerings];
    const [removed] = newOfferings.splice(fromIndex, 1);
    newOfferings.splice(toIndex, 0, removed);
    onChange(newOfferings);
    setExpandedIndex(toIndex);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Offerings ({offerings.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addOffering} className="h-7 px-2 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add Offering
        </Button>
      </div>
      <div className="space-y-2">
        {offerings.map((offering, index) => (
          <div key={index} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <div
              className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 cursor-pointer"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              <div className="w-10 h-10 rounded bg-neutral-200 dark:bg-neutral-700 flex-shrink-0 overflow-hidden">
                {offering.imageUrl ? (
                  <img src={offering.imageUrl} alt={offering.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Image className="w-4 h-4 text-neutral-400" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{offering.title || `Offering ${index + 1}`}</p>
                {offering.price && <p className="text-xs text-muted-foreground">{offering.price}</p>}
              </div>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); moveOffering(index, index - 1); }} disabled={index === 0}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); moveOffering(index, index + 1); }} disabled={index === offerings.length - 1}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeOffering(index); }} disabled={offerings.length <= 1}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                {expandedIndex === index ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
              </div>
            </div>
            {expandedIndex === index && (
              <div className="p-3 space-y-3 border-t border-neutral-200 dark:border-neutral-700">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Image</Label>
                  <div className="flex gap-2">
                    {offering.imageUrl && (
                      <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                        <img src={offering.imageUrl} alt={offering.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <Button type="button" variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => { setSelectedIndex(index); setMediaPickerOpen(true); }}>
                        <Image className="w-3 h-3 mr-1" /> {offering.imageUrl ? 'Change Image' : 'Select Image'}
                      </Button>
                      {offering.imageUrl && (
                        <Button type="button" variant="ghost" size="sm" className="w-full h-7 text-xs text-destructive hover:text-destructive" onClick={() => updateOffering(index, 'imageUrl', '')}>
                          Remove Image
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input value={offering.title} onChange={(e) => updateOffering(index, 'title', e.target.value)} placeholder="Offering title" className="h-8 text-sm bg-white dark:bg-neutral-900" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea value={offering.description} onChange={(e) => updateOffering(index, 'description', e.target.value)} placeholder="Offering description" rows={2} className="text-sm bg-white dark:bg-neutral-900" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Price (Optional)</Label>
                    <Input value={offering.price || ''} onChange={(e) => updateOffering(index, 'price', e.target.value)} placeholder="$99" className="h-8 text-sm bg-white dark:bg-neutral-900" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Link</Label>
                    <Input value={offering.link} onChange={(e) => updateOffering(index, 'link', e.target.value)} placeholder="/page-link" className="h-8 text-sm bg-white dark:bg-neutral-900" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <MediaPicker
        open={mediaPickerOpen}
        onClose={() => { setMediaPickerOpen(false); setSelectedIndex(null); }}
        onSelect={(url) => { if (selectedIndex !== null) updateOffering(selectedIndex, 'imageUrl', url); setMediaPickerOpen(false); setSelectedIndex(null); }}
        mediaType="image"
      />
    </div>
  );
}

// ==========================================
// EVENTS EDITOR (JE Calendar)
// ==========================================
interface CalendarEvent {
  date: string;
  title: string;
  type: string;
  description?: string;
  link?: string;
}

function EventsEditor({
  events,
  onChange,
}: {
  events: CalendarEvent[];
  onChange: (events: CalendarEvent[]) => void;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const updateEvent = (index: number, field: keyof CalendarEvent, value: string) => {
    const newEvents = [...events];
    newEvents[index] = { ...newEvents[index], [field]: value };
    onChange(newEvents);
  };

  const addEvent = () => {
    const today = new Date().toISOString().split('T')[0];
    const newEvents = [...events, { date: today, title: `Event ${events.length + 1}`, type: 'workshop', description: '', link: '' }];
    onChange(newEvents);
    setExpandedIndex(newEvents.length - 1);
  };

  const removeEvent = (index: number) => {
    const newEvents = events.filter((_, i) => i !== index);
    onChange(newEvents);
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const moveEvent = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= events.length) return;
    const newEvents = [...events];
    const [removed] = newEvents.splice(fromIndex, 1);
    newEvents.splice(toIndex, 0, removed);
    onChange(newEvents);
    setExpandedIndex(toIndex);
  };

  const EVENT_TYPES = [
    { value: 'workshop', label: 'Workshop' },
    { value: 'retreat', label: 'Retreat' },
    { value: 'webinar', label: 'Webinar' },
    { value: 'meetup', label: 'Meetup' },
    { value: 'conference', label: 'Conference' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Events ({events.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addEvent} className="h-7 px-2 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add Event
        </Button>
      </div>
      {events.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg">
          <Calendar className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
          <p className="text-sm text-muted-foreground">No events yet</p>
          <Button type="button" variant="outline" size="sm" onClick={addEvent} className="mt-2">
            <Plus className="w-3 h-3 mr-1" /> Add First Event
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event, index) => (
            <div key={index} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
              <div
                className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 cursor-pointer"
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                <div className="w-10 h-10 rounded bg-primary/10 flex flex-col items-center justify-center text-primary">
                  <span className="text-[10px] font-medium uppercase">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                  <span className="text-sm font-bold leading-none">{new Date(event.date).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{event.title || `Event ${index + 1}`}</p>
                  <p className="text-xs text-muted-foreground capitalize">{event.type}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); moveEvent(index, index - 1); }} disabled={index === 0}>
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); moveEvent(index, index + 1); }} disabled={index === events.length - 1}>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeEvent(index); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  {expandedIndex === index ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                </div>
              </div>
              {expandedIndex === index && (
                <div className="p-3 space-y-3 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Date</Label>
                      <Input type="date" value={event.date} onChange={(e) => updateEvent(index, 'date', e.target.value)} className="h-8 text-sm bg-white dark:bg-neutral-900" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <Select value={event.type} onValueChange={(v) => updateEvent(index, 'type', v)}>
                        <SelectTrigger className="h-8 text-sm bg-white dark:bg-neutral-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EVENT_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Title</Label>
                    <Input value={event.title} onChange={(e) => updateEvent(index, 'title', e.target.value)} placeholder="Event title" className="h-8 text-sm bg-white dark:bg-neutral-900" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Description (Optional)</Label>
                    <Textarea value={event.description || ''} onChange={(e) => updateEvent(index, 'description', e.target.value)} placeholder="Event description" rows={2} className="text-sm bg-white dark:bg-neutral-900" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Link (Optional)</Label>
                    <Input value={event.link || ''} onChange={(e) => updateEvent(index, 'link', e.target.value)} placeholder="/page-link or https://..." className="h-8 text-sm bg-white dark:bg-neutral-900" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// FAQ ITEMS EDITOR (JE FAQ Accordion)
// ==========================================
interface FAQItem {
  question: string;
  answer: string;
}

function FAQItemsEditor({
  items,
  onChange,
}: {
  items: FAQItem[];
  onChange: (items: FAQItem[]) => void;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const updateItem = (index: number, field: keyof FAQItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const addItem = () => {
    const newItems = [...items, { question: `Question ${items.length + 1}?`, answer: 'Answer...' }];
    onChange(newItems);
    setExpandedIndex(newItems.length - 1);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length) return;
    const newItems = [...items];
    const [removed] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, removed);
    onChange(newItems);
    setExpandedIndex(toIndex);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">FAQ Items ({items.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-7 px-2 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add FAQ
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <div
              className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 cursor-pointer"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                Q{index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.question || `Question ${index + 1}`}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); moveItem(index, index - 1); }} disabled={index === 0}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); moveItem(index, index + 1); }} disabled={index === items.length - 1}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeItem(index); }} disabled={items.length <= 1}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                {expandedIndex === index ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
              </div>
            </div>
            {expandedIndex === index && (
              <div className="p-3 space-y-3 border-t border-neutral-200 dark:border-neutral-700">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Question</Label>
                  <Input value={item.question} onChange={(e) => updateItem(index, 'question', e.target.value)} placeholder="Enter question" className="h-8 text-sm bg-white dark:bg-neutral-900" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Answer</Label>
                  <Textarea value={item.answer} onChange={(e) => updateItem(index, 'answer', e.target.value)} placeholder="Enter answer" rows={4} className="text-sm bg-white dark:bg-neutral-900" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// FOOTER COLUMNS EDITOR (JE Footer)
// ==========================================
interface FooterLink {
  text: string;
  url: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

function FooterColumnsEditor({
  columns,
  onChange,
}: {
  columns: FooterColumn[];
  onChange: (columns: FooterColumn[]) => void;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const updateColumn = (index: number, field: 'title', value: string) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    onChange(newColumns);
  };

  const updateLink = (colIndex: number, linkIndex: number, field: keyof FooterLink, value: string) => {
    const newColumns = [...columns];
    const newLinks = [...newColumns[colIndex].links];
    newLinks[linkIndex] = { ...newLinks[linkIndex], [field]: value };
    newColumns[colIndex] = { ...newColumns[colIndex], links: newLinks };
    onChange(newColumns);
  };

  const addColumn = () => {
    const newColumns = [...columns, { title: `Column ${columns.length + 1}`, links: [{ text: 'Link', url: '/' }] }];
    onChange(newColumns);
    setExpandedIndex(newColumns.length - 1);
  };

  const removeColumn = (index: number) => {
    if (columns.length <= 1) return;
    const newColumns = columns.filter((_, i) => i !== index);
    onChange(newColumns);
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const addLink = (colIndex: number) => {
    const newColumns = [...columns];
    newColumns[colIndex] = {
      ...newColumns[colIndex],
      links: [...newColumns[colIndex].links, { text: 'New Link', url: '/' }],
    };
    onChange(newColumns);
  };

  const removeLink = (colIndex: number, linkIndex: number) => {
    if (columns[colIndex].links.length <= 1) return;
    const newColumns = [...columns];
    newColumns[colIndex] = {
      ...newColumns[colIndex],
      links: newColumns[colIndex].links.filter((_, i) => i !== linkIndex),
    };
    onChange(newColumns);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Footer Columns ({columns.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addColumn} className="h-7 px-2 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add Column
        </Button>
      </div>
      <div className="space-y-2">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <div
              className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 cursor-pointer"
              onClick={() => setExpandedIndex(expandedIndex === colIndex ? null : colIndex)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{column.title || `Column ${colIndex + 1}`}</p>
                <p className="text-xs text-muted-foreground">{column.links.length} links</p>
              </div>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeColumn(colIndex); }} disabled={columns.length <= 1}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                {expandedIndex === colIndex ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
              </div>
            </div>
            {expandedIndex === colIndex && (
              <div className="p-3 space-y-3 border-t border-neutral-200 dark:border-neutral-700">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Column Title</Label>
                  <Input value={column.title} onChange={(e) => updateColumn(colIndex, 'title', e.target.value)} placeholder="Column title" className="h-8 text-sm bg-white dark:bg-neutral-900" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Links</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => addLink(colIndex)} className="h-6 px-2 text-xs">
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                  {column.links.map((link, linkIndex) => (
                    <div key={linkIndex} className="flex gap-2 items-center">
                      <Input value={link.text} onChange={(e) => updateLink(colIndex, linkIndex, 'text', e.target.value)} placeholder="Link text" className="h-7 text-xs flex-1 bg-white dark:bg-neutral-900" />
                      <Input value={link.url} onChange={(e) => updateLink(colIndex, linkIndex, 'url', e.target.value)} placeholder="/url" className="h-7 text-xs flex-1 bg-white dark:bg-neutral-900" />
                      <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => removeLink(colIndex, linkIndex)} disabled={column.links.length <= 1}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// SOCIAL LINKS EDITOR (JE Footer)
// ==========================================
interface SocialLink {
  platform: string;
  url: string;
}

function SocialLinksEditor({
  links,
  onChange,
}: {
  links: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}) {
  const PLATFORMS = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'twitter', label: 'Twitter/X' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'pinterest', label: 'Pinterest' },
  ];

  const updateLink = (index: number, field: keyof SocialLink, value: string) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    onChange(newLinks);
  };

  const addLink = () => {
    onChange([...links, { platform: 'instagram', url: '' }]);
  };

  const removeLink = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Social Links ({links.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addLink} className="h-7 px-2 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add Link
        </Button>
      </div>
      <div className="space-y-2">
        {links.map((link, index) => (
          <div key={index} className="flex gap-2 items-center">
            <Select value={link.platform} onValueChange={(v) => updateLink(index, 'platform', v)}>
              <SelectTrigger className="h-8 text-sm w-32 bg-white dark:bg-neutral-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={link.url} onChange={(e) => updateLink(index, 'url', e.target.value)} placeholder="https://..." className="h-8 text-sm flex-1 bg-white dark:bg-neutral-900" />
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => removeLink(index)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// FEATURES EDITOR (JE Community Section)
// ==========================================
interface Feature {
  icon: string;
  title: string;
  description: string;
}

function FeaturesEditor({
  features,
  onChange,
}: {
  features: Feature[];
  onChange: (features: Feature[]) => void;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const updateFeature = (index: number, field: keyof Feature, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    onChange(newFeatures);
  };

  const addFeature = () => {
    const newFeatures = [...features, { icon: 'star', title: `Feature ${features.length + 1}`, description: 'Description...' }];
    onChange(newFeatures);
    setExpandedIndex(newFeatures.length - 1);
  };

  const removeFeature = (index: number) => {
    if (features.length <= 1) return;
    const newFeatures = features.filter((_, i) => i !== index);
    onChange(newFeatures);
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const moveFeature = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= features.length) return;
    const newFeatures = [...features];
    const [removed] = newFeatures.splice(fromIndex, 1);
    newFeatures.splice(toIndex, 0, removed);
    onChange(newFeatures);
    setExpandedIndex(toIndex);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Features ({features.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addFeature} className="h-7 px-2 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add Feature
        </Button>
      </div>
      <div className="space-y-2">
        {features.map((feature, index) => (
          <div key={index} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <div
              className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 cursor-pointer"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                {(() => {
                  const IconComponent = ICON_OPTIONS.find(i => i.value === feature.icon)?.icon || Star;
                  return <IconComponent className="w-4 h-4 text-primary" />;
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{feature.title || `Feature ${index + 1}`}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); moveFeature(index, index - 1); }} disabled={index === 0}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); moveFeature(index, index + 1); }} disabled={index === features.length - 1}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeFeature(index); }} disabled={features.length <= 1}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                {expandedIndex === index ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
              </div>
            </div>
            {expandedIndex === index && (
              <div className="p-3 space-y-3 border-t border-neutral-200 dark:border-neutral-700">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Icon</Label>
                  <Select value={feature.icon} onValueChange={(v) => updateFeature(index, 'icon', v)}>
                    <SelectTrigger className="h-8 text-sm bg-white dark:bg-neutral-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="w-4 h-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input value={feature.title} onChange={(e) => updateFeature(index, 'title', e.target.value)} placeholder="Feature title" className="h-8 text-sm bg-white dark:bg-neutral-900" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea value={feature.description} onChange={(e) => updateFeature(index, 'description', e.target.value)} placeholder="Feature description" rows={2} className="text-sm bg-white dark:bg-neutral-900" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// EVENT TYPES EDITOR (JE Calendar)
// ==========================================
interface EventType {
  id: string;
  name: string;
  color: string;
}

function EventTypesEditor({
  eventTypes,
  onChange,
}: {
  eventTypes: EventType[];
  onChange: (eventTypes: EventType[]) => void;
}) {
  const updateType = (index: number, field: keyof EventType, value: string) => {
    const newTypes = [...eventTypes];
    newTypes[index] = { ...newTypes[index], [field]: value };
    onChange(newTypes);
  };

  const addType = () => {
    const id = `type-${Date.now()}`;
    onChange([...eventTypes, { id, name: 'New Type', color: '#6B7280' }]);
  };

  const removeType = (index: number) => {
    if (eventTypes.length <= 1) return;
    onChange(eventTypes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Event Types ({eventTypes.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addType} className="h-7 px-2 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add Type
        </Button>
      </div>
      <div className="space-y-2">
        {eventTypes.map((type, index) => (
          <div key={index} className="flex gap-2 items-center">
            <Input type="color" value={type.color} onChange={(e) => updateType(index, 'color', e.target.value)} className="w-10 h-8 p-1 cursor-pointer rounded" />
            <Input value={type.name} onChange={(e) => updateType(index, 'name', e.target.value)} placeholder="Type name" className="h-8 text-sm flex-1 bg-white dark:bg-neutral-900" />
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => removeType(index)} disabled={eventTypes.length <= 1}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// FORM FIELDS EDITOR (JE Contact Form)
// ==========================================
interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

function FormFieldsEditor({
  fields,
  onChange,
}: {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const FIELD_TYPES = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Phone' },
    { value: 'number', label: 'Number' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'select', label: 'Select' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'date', label: 'Date' },
  ];

  const updateField = (index: number, key: keyof FormField, value: string | boolean) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    onChange(newFields);
  };

  const addField = () => {
    const newFields = [...fields, { name: `field_${fields.length + 1}`, label: `Field ${fields.length + 1}`, type: 'text', required: false }];
    onChange(newFields);
    setExpandedIndex(newFields.length - 1);
  };

  const removeField = (index: number) => {
    if (fields.length <= 1) return;
    const newFields = fields.filter((_, i) => i !== index);
    onChange(newFields);
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= fields.length) return;
    const newFields = [...fields];
    const [removed] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, removed);
    onChange(newFields);
    setExpandedIndex(toIndex);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Form Fields ({fields.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addField} className="h-7 px-2 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add Field
        </Button>
      </div>
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={index} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <div
              className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 cursor-pointer"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{field.label || `Field ${index + 1}`}</p>
                <p className="text-xs text-muted-foreground">{field.type} {field.required && '• required'}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); moveField(index, index - 1); }} disabled={index === 0}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); moveField(index, index + 1); }} disabled={index === fields.length - 1}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeField(index); }} disabled={fields.length <= 1}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                {expandedIndex === index ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
              </div>
            </div>
            {expandedIndex === index && (
              <div className="p-3 space-y-3 border-t border-neutral-200 dark:border-neutral-700">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Field Name (ID)</Label>
                  <Input value={field.name} onChange={(e) => updateField(index, 'name', e.target.value)} placeholder="field_name" className="h-8 text-sm bg-white dark:bg-neutral-900" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Label</Label>
                  <Input value={field.label} onChange={(e) => updateField(index, 'label', e.target.value)} placeholder="Field Label" className="h-8 text-sm bg-white dark:bg-neutral-900" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select value={field.type} onValueChange={(v) => updateField(index, 'type', v)}>
                    <SelectTrigger className="h-8 text-sm bg-white dark:bg-neutral-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs text-muted-foreground">Required</Label>
                  <Switch
                    checked={field.required}
                    onCheckedChange={(checked) => updateField(index, 'required', checked)}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
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

  // Update multiple content fields at once (for margin ruler)
  const handleContentChangeMultiple = (updates: Record<string, unknown>) => {
    if (selectedBlockId) {
      updateBlock(selectedBlockId, updates);
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

      {/* Settings tabs - 4 tabs matching Zone Editor */}
      <Tabs defaultValue="content" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 mt-4 grid grid-cols-4 flex-shrink-0">
          <TabsTrigger value="content" className="text-xs px-2">
            Content
          </TabsTrigger>
          <TabsTrigger value="style" className="text-xs px-2">
            Style
          </TabsTrigger>
          <TabsTrigger value="layout" className="text-xs px-2">
            Layout
          </TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs px-2">
            Advanced
          </TabsTrigger>
        </TabsList>

          <TabsContent value="content" className="mt-0 p-0">
            <ScrollArea style={{ height: 'calc(100vh - 280px)' }}>
              <div className="p-4 space-y-4 pb-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedBlockId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Custom inline settings for je-gallery - avoids Select component issues */}
                {selectedBlock.type === 'je-gallery' ? (
                  <JEGallerySettingsPanel content={selectedBlock.content} onChange={handleContentChange} />
                ) : (
                  <>
                    {/* Use definition-based field rendering when available */}
                    {(() => {
                      const blockFields = getBlockFields(selectedBlock.type);
                      if (blockFields.length > 0) {
                        // Render fields from definitions, grouped by category
                        return renderFieldsFromDefinitions(selectedBlock.type, selectedBlock.content, handleContentChange);
                      }
                      // Fallback to legacy rendering for blocks without definitions
                      return Object.entries(selectedBlock.content).map(([key, value]) => {
                        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                          return null;
                        }
                        return renderField(key, value, handleContentChange, selectedBlock.type);
                      });
                    })()}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="style" className="mt-0 p-0">
            <ScrollArea style={{ height: 'calc(100vh - 280px)' }}>
              <div className="p-4 space-y-4 pb-16">
              {/* Render style fields from definitions first */}
              {(() => {
                const groupedFields = getGroupedFields(selectedBlock.type);
                const styleFields = groupedFields.style || [];
                
                if (styleFields.length > 0) {
                  return (
                    <div className="space-y-4 pb-4 border-b border-neutral-200 dark:border-neutral-700">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Block Style</h4>
                      {styleFields.map((field) => renderDefinedField(field, selectedBlock.content[field.key], handleContentChange, selectedBlock.type))}
                    </div>
                  );
                }
                return null;
              })()}
              
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
                  <>
                    <div className="flex items-center justify-between py-2">
                      <Label className="text-sm font-medium">Bottom Curve</Label>
                      <Switch
                        checked={selectedBlock.content.bottomCurve as boolean ?? true}
                        onCheckedChange={(checked) => handleContentChange('bottomCurve', checked)}
                      />
                    </div>
                    
                    {/* Curve Type Selector - only show when bottom curve is enabled */}
                    {(selectedBlock.content.bottomCurve as boolean ?? true) && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Curve Style</Label>
                        <Select
                          value={(selectedBlock.content.curveType as string) || 'wave'}
                          onValueChange={(value) => handleContentChange('curveType', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select curve style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="wave">Wave</SelectItem>
                            <SelectItem value="arc">Arc</SelectItem>
                            <SelectItem value="diagonal">Diagonal</SelectItem>
                            <SelectItem value="tilt">Tilt</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
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

              {/* Icon Picker - for JE Pillars block */}
              {(selectedBlock.type === 'je-pillars' || selectedBlock.type === 'je-pillar-grid' || selectedBlock.type === 'je-three-pillars') && (
                <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pillar Icons</h4>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Pillar 1 Icon</Label>
                      <IconPicker
                        value={selectedBlock.content.pillar1Icon as string || 'heart'}
                        onChange={(icon) => handleContentChange('pillar1Icon', icon)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Pillar 2 Icon</Label>
                      <IconPicker
                        value={selectedBlock.content.pillar2Icon as string || 'sparkles'}
                        onChange={(icon) => handleContentChange('pillar2Icon', icon)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Pillar 3 Icon</Label>
                      <IconPicker
                        value={selectedBlock.content.pillar3Icon as string || 'crown'}
                        onChange={(icon) => handleContentChange('pillar3Icon', icon)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Title Element Controls - for JE blocks */}
              {selectedBlock.type.startsWith('je-') && (
                <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title Element</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Text Size</Label>
                      <Select
                        value={selectedBlock.content.titleFontSize as string || '48px'}
                        onValueChange={(v) => handleContentChange('titleFontSize', v)}
                      >
                        <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="8px">8</SelectItem>
                          <SelectItem value="10px">10</SelectItem>
                          <SelectItem value="12px">12</SelectItem>
                          <SelectItem value="14px">14</SelectItem>
                          <SelectItem value="16px">16</SelectItem>
                          <SelectItem value="18px">18</SelectItem>
                          <SelectItem value="20px">20</SelectItem>
                          <SelectItem value="24px">24</SelectItem>
                          <SelectItem value="28px">28</SelectItem>
                          <SelectItem value="32px">32</SelectItem>
                          <SelectItem value="36px">36</SelectItem>
                          <SelectItem value="40px">40</SelectItem>
                          <SelectItem value="48px">48</SelectItem>
                          <SelectItem value="56px">56</SelectItem>
                          <SelectItem value="64px">64</SelectItem>
                          <SelectItem value="72px">72</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Line Spacing</Label>
                      <Select
                        value={selectedBlock.content.titleLineHeight as string || '1.2'}
                        onValueChange={(v) => handleContentChange('titleLineHeight', v)}
                      >
                        <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Tight</SelectItem>
                          <SelectItem value="1.2">Normal</SelectItem>
                          <SelectItem value="1.4">Relaxed</SelectItem>
                          <SelectItem value="1.6">Loose</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Space Below</Label>
                      <Select
                        value={selectedBlock.content.titleMarginBottom as string || '1.5rem'}
                        onValueChange={(v) => handleContentChange('titleMarginBottom', v)}
                      >
                        <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">None</SelectItem>
                          <SelectItem value="0.5rem">Tiny</SelectItem>
                          <SelectItem value="1rem">Small</SelectItem>
                          <SelectItem value="1.5rem">Medium</SelectItem>
                          <SelectItem value="2rem">Large</SelectItem>
                          <SelectItem value="3rem">X-Large</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Label className="text-xs text-muted-foreground">Text Size</Label>
                      <Select
                        value={selectedBlock.content.subtitleFontSize as string || selectedBlock.content.labelFontSize as string || '12px'}
                        onValueChange={(v) => {
                          handleContentChange('subtitleFontSize', v);
                          handleContentChange('labelFontSize', v);
                        }}
                      >
                        <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="8px">8</SelectItem>
                          <SelectItem value="10px">10</SelectItem>
                          <SelectItem value="12px">12</SelectItem>
                          <SelectItem value="14px">14</SelectItem>
                          <SelectItem value="16px">16</SelectItem>
                          <SelectItem value="18px">18</SelectItem>
                          <SelectItem value="20px">20</SelectItem>
                          <SelectItem value="24px">24</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Letter Spacing</Label>
                      <Select
                        value={selectedBlock.content.subtitleLetterSpacing as string || '0.3em'}
                        onValueChange={(v) => handleContentChange('subtitleLetterSpacing', v)}
                      >
                        <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">None</SelectItem>
                          <SelectItem value="0.1em">Slight</SelectItem>
                          <SelectItem value="0.2em">Normal</SelectItem>
                          <SelectItem value="0.3em">Wide</SelectItem>
                          <SelectItem value="0.4em">Extra Wide</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label className="text-xs text-muted-foreground">Space Below</Label>
                      <Select
                        value={selectedBlock.content.subtitleMarginBottom as string || selectedBlock.content.labelMarginBottom as string || '1rem'}
                        onValueChange={(v) => {
                          handleContentChange('subtitleMarginBottom', v);
                          handleContentChange('labelMarginBottom', v);
                        }}
                      >
                        <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">None</SelectItem>
                          <SelectItem value="0.5rem">Tiny</SelectItem>
                          <SelectItem value="1rem">Small</SelectItem>
                          <SelectItem value="1.5rem">Medium</SelectItem>
                          <SelectItem value="2rem">Large</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Label className="text-xs text-muted-foreground">Text Size</Label>
                      <Select
                        value={selectedBlock.content.descriptionFontSize as string || '18px'}
                        onValueChange={(v) => handleContentChange('descriptionFontSize', v)}
                      >
                        <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="8px">8</SelectItem>
                          <SelectItem value="10px">10</SelectItem>
                          <SelectItem value="12px">12</SelectItem>
                          <SelectItem value="14px">14</SelectItem>
                          <SelectItem value="16px">16</SelectItem>
                          <SelectItem value="18px">18</SelectItem>
                          <SelectItem value="20px">20</SelectItem>
                          <SelectItem value="24px">24</SelectItem>
                          <SelectItem value="28px">28</SelectItem>
                          <SelectItem value="32px">32</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Line Spacing</Label>
                      <Select
                        value={selectedBlock.content.descriptionLineHeight as string || '1.75'}
                        onValueChange={(v) => handleContentChange('descriptionLineHeight', v)}
                      >
                        <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1.4">Tight</SelectItem>
                          <SelectItem value="1.6">Normal</SelectItem>
                          <SelectItem value="1.75">Relaxed</SelectItem>
                          <SelectItem value="2">Loose</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Space Below</Label>
                      <Select
                        value={selectedBlock.content.descriptionMarginBottom as string || '2rem'}
                        onValueChange={(v) => handleContentChange('descriptionMarginBottom', v)}
                      >
                        <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">None</SelectItem>
                          <SelectItem value="1rem">Small</SelectItem>
                          <SelectItem value="2rem">Medium</SelectItem>
                          <SelectItem value="3rem">Large</SelectItem>
                        </SelectContent>
                      </Select>
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
                  
                  {/* Swap Columns Toggle */}
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="w-4 h-4 text-primary" />
                      <div>
                        <Label className="text-sm font-medium">Swap Columns</Label>
                        <p className="text-xs text-muted-foreground">Flip text & image sides</p>
                      </div>
                    </div>
                    <Switch
                      checked={selectedBlock.content.reversed as boolean || false}
                      onCheckedChange={(checked) => handleContentChange('reversed', checked)}
                    />
                  </div>

                  {/* Reset Element Positions */}
                  {selectedBlock.content.elementTransforms && Object.keys(selectedBlock.content.elementTransforms as Record<string, any>).length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full flex items-center gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950 border-amber-200 dark:border-amber-800"
                      onClick={() => handleContentChange('elementTransforms', {})}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset Element Positions
                    </Button>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Content Gap</Label>
                      <Select
                        value={selectedBlock.content.contentGap as string || '4rem'}
                        onValueChange={(v) => handleContentChange('contentGap', v)}
                      >
                        <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">None</SelectItem>
                          <SelectItem value="1rem">Small</SelectItem>
                          <SelectItem value="2rem">Medium</SelectItem>
                          <SelectItem value="3rem">Large</SelectItem>
                          <SelectItem value="4rem">X-Large</SelectItem>
                          <SelectItem value="6rem">XX-Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Section Padding Y</Label>
                      <Select
                        value={selectedBlock.content.sectionPaddingY as string || '6rem'}
                        onValueChange={(v) => handleContentChange('sectionPaddingY', v)}
                      >
                        <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">None</SelectItem>
                          <SelectItem value="1rem">Compact</SelectItem>
                          <SelectItem value="2rem">Small</SelectItem>
                          <SelectItem value="3rem">Medium</SelectItem>
                          <SelectItem value="4rem">Large</SelectItem>
                          <SelectItem value="6rem">X-Large</SelectItem>
                          <SelectItem value="8rem">XX-Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Section Padding X</Label>
                      <Select
                        value={selectedBlock.content.sectionPaddingX as string || '1.5rem'}
                        onValueChange={(v) => handleContentChange('sectionPaddingX', v)}
                      >
                        <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">None</SelectItem>
                          <SelectItem value="0.5rem">Tiny</SelectItem>
                          <SelectItem value="1rem">Small</SelectItem>
                          <SelectItem value="1.5rem">Medium</SelectItem>
                          <SelectItem value="2rem">Large</SelectItem>
                          <SelectItem value="3rem">X-Large</SelectItem>
                        </SelectContent>
                      </Select>
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
            </ScrollArea>
          </TabsContent>

          {/* Layout Tab - Definition-based layout fields */}
          <TabsContent value="layout" className="mt-0 p-0">
            <ScrollArea style={{ height: 'calc(100vh - 280px)' }}>
              <div className="p-4 space-y-4 pb-16">
                {/* Microsoft Word-style Margin Ruler for ALL block types */}
                <div className="space-y-3 pb-4 border-b border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-blue-500" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Content Width Ruler</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">Drag the handles to adjust content margins like Microsoft Word</p>
                  <CompactMarginRuler
                    leftMargin={parseFloat(selectedBlock.content.marginLeft as string || '5') || 5}
                    rightMargin={parseFloat(selectedBlock.content.marginRight as string || '5') || 5}
                    onLeftMarginChange={(percent) => {
                      console.log('[MarginRuler] Left margin changed:', percent, '-> marginLeft:', `${percent}%`, 'textWidthPreset: custom');
                      handleContentChangeMultiple({
                        marginLeft: `${percent}%`,
                        textWidthPreset: 'custom'
                      });
                    }}
                    onRightMarginChange={(percent) => {
                      console.log('[MarginRuler] Right margin changed:', percent, '-> marginRight:', `${percent}%`, 'textWidthPreset: custom');
                      handleContentChangeMultiple({
                        marginRight: `${percent}%`,
                        textWidthPreset: 'custom'
                      });
                    }}
                  />
                </div>

                {/* Render layout fields from definitions */}
                {(() => {
                  const groupedFields = getGroupedFields(selectedBlock.type);
                  const layoutFields = groupedFields.layout || [];
                  
                  if (layoutFields.length > 0) {
                    return (
                      <div className="space-y-4">
                        {layoutFields.map((field) => renderDefinedField(field, selectedBlock.content[field.key], handleContentChange, selectedBlock.type))}
                      </div>
                    );
                  }
                  
                  // Fallback layout controls for blocks without definitions
                  return (
                    <>
                      {/* Padding Controls */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Padding</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Top</Label>
                            <Input
                              value={selectedBlock.content.paddingTop as string || ''}
                              onChange={(e) => handleContentChange('paddingTop', e.target.value)}
                              placeholder="16px"
                              className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Bottom</Label>
                            <Input
                              value={selectedBlock.content.paddingBottom as string || ''}
                              onChange={(e) => handleContentChange('paddingBottom', e.target.value)}
                              placeholder="16px"
                              className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Left</Label>
                            <Input
                              value={selectedBlock.content.paddingLeft as string || ''}
                              onChange={(e) => handleContentChange('paddingLeft', e.target.value)}
                              placeholder="24px"
                              className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Right</Label>
                            <Input
                              value={selectedBlock.content.paddingRight as string || ''}
                              onChange={(e) => handleContentChange('paddingRight', e.target.value)}
                              placeholder="24px"
                              className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Content Alignment */}
                      <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Content Alignment</h4>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Vertical Align</Label>
                          <Select
                            value={selectedBlock.content.contentVerticalAlign as string || 'center'}
                            onValueChange={(v) => handleContentChange('contentVerticalAlign', v)}
                          >
                            <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800 h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="top">Top</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="bottom">Bottom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Horizontal Align</Label>
                          <Select
                            value={selectedBlock.content.contentHorizontalAlign as string || 'center'}
                            onValueChange={(v) => handleContentChange('contentHorizontalAlign', v)}
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
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Content Max Width</Label>
                          <Input
                            value={selectedBlock.content.contentMaxWidth as string || ''}
                            onChange={(e) => handleContentChange('contentMaxWidth', e.target.value)}
                            placeholder="48rem or 100%"
                            className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                          />
                        </div>
                      </div>

                      {/* Gap & Spacing */}
                      <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Spacing</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Content Gap</Label>
                            <Input
                              value={selectedBlock.content.contentGap as string || ''}
                              onChange={(e) => handleContentChange('contentGap', e.target.value)}
                              placeholder="2rem"
                              className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Item Gap</Label>
                            <Input
                              value={selectedBlock.content.itemGap as string || ''}
                              onChange={(e) => handleContentChange('itemGap', e.target.value)}
                              placeholder="1.5rem"
                              className="bg-neutral-50 dark:bg-neutral-800 h-9 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="advanced" className="mt-0 p-0">
            <ScrollArea style={{ height: 'calc(100vh - 280px)' }}>
              <div className="p-4 space-y-4 pb-16">
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

              {/* Custom CSS Editor */}
              <CustomCSSEditor
                value={selectedBlock.content.customCss as string || ''}
                onChange={(css) => handleContentChange('customCss', css)}
                blockType={selectedBlock.type}
              />

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

              {/* Animation Settings */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Animation Settings
                </h4>
                <BlockAnimationSettings
                  config={(selectedBlock.content.animation as BlockAnimationConfig) || DEFAULT_ANIMATION_CONFIG}
                  onChange={(config) => handleContentChange('animation', config)}
                />
              </div>
              </div>
            </ScrollArea>
          </TabsContent>
      </Tabs>
    </div>
  );
}
