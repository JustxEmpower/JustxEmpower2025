/**
 * Just Empower - COMPLETE Block Renderers with Full Editability
 * 
 * PART 2: JE Special Blocks
 * - JE Three Pillars
 * - JE Pillars / Pillar Grid
 * - JE Rooted Unity
 * - JE Foundational Principles
 * - JE Offerings Grid
 * - JE Offerings Carousel
 * - JE Community
 * - JE Coming Soon
 * - JE Team Member
 * - JE Feature Card
 * - JE Volumes
 * - JE Calendar
 * 
 * @version 3.0 - COMPLETE
 * @date January 2026
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Heart, Leaf, Sparkles, Globe, Star, Sun, Moon, Mountain, Shield,
  Target, Award, Users, BookOpen, Zap, Flower2, ArrowRight, Play,
  ChevronLeft, ChevronRight, ChevronDown, Plus, Trash2, Calendar,
  Clock, MapPin, Mail, ExternalLink, Check, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditableText, iconMap, getIcon } from './BlockRenderers-Part1-Core';

// ============================================================================
// SHARED INTERFACES
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

// ============================================================================
// SIZING PRESETS - Match original site proportions
// ============================================================================

const SECTION_PADDING_PRESETS: Record<string, string> = {
  compact: 'py-16 md:py-20',
  standard: 'py-24 md:py-32',
  spacious: 'py-32 md:py-48',
  hero: 'py-40 md:py-56',
};

const TITLE_SIZE_PRESETS: Record<string, string> = {
  small: 'text-3xl md:text-4xl',
  medium: 'text-4xl md:text-5xl',
  large: 'text-5xl md:text-6xl lg:text-7xl',
  hero: 'text-6xl md:text-7xl lg:text-8xl',
};

const BODY_SIZE_PRESETS: Record<string, string> = {
  small: 'text-base',
  medium: 'text-lg md:text-xl',
  large: 'text-xl md:text-2xl',
};

const NUMBER_SIZE_PRESETS: Record<string, string> = {
  small: 'text-3xl md:text-4xl',
  medium: 'text-4xl md:text-5xl',
  large: 'text-5xl md:text-6xl',
  hero: 'text-6xl md:text-7xl',
};

const GAP_PRESETS: Record<string, string> = {
  tight: 'gap-6 md:gap-8',
  standard: 'gap-8 md:gap-12',
  spacious: 'gap-12 md:gap-16',
  wide: 'gap-16 md:gap-24',
};

// ============================================================================
// JE THREE PILLARS RENDERER
// ============================================================================

export function JEThreePillarsRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    label = 'FOUNDATION OF OUR WORK',
    title = 'The Three Pillars',
    description = 'Our work is built upon three interconnected pillars that guide everything we do.',
    imageUrl = '',
    dark = false,
    variant = 'default',
    // Sizing controls
    sectionPadding = 'spacious',
    titleSize = 'large',
    descriptionSize = 'medium',
    itemGap = 'spacious',
    maxWidth = 'max-w-6xl',
    pillars = [
      { icon: 'heart', title: 'Embodiment', description: 'Living wisdom through the body' },
      { icon: 'sparkles', title: 'Sacred Reciprocity', description: 'Honoring the give and take of life' },
      { icon: 'heart', title: 'Feminine Wisdom', description: 'Reclaiming ancient knowing' },
    ],
  } = content;

  // Get classes from presets
  const getPaddingClass = () => SECTION_PADDING_PRESETS[sectionPadding as keyof typeof SECTION_PADDING_PRESETS] || sectionPadding;
  const getTitleClass = () => TITLE_SIZE_PRESETS[titleSize as keyof typeof TITLE_SIZE_PRESETS] || titleSize;
  const getDescriptionClass = () => BODY_SIZE_PRESETS[descriptionSize as keyof typeof BODY_SIZE_PRESETS] || descriptionSize;
  const getGapClass = () => GAP_PRESETS[itemGap as keyof typeof GAP_PRESETS] || itemGap;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const handlePillarChange = (index: number, key: string, value: string) => {
    const newPillars = [...pillars];
    newPillars[index] = { ...newPillars[index], [key]: value };
    onUpdate?.({ ...content, pillars: newPillars });
  };

  const addPillar = () => {
    const newPillars = [...pillars, { icon: 'star', title: 'New Pillar', description: 'Description here' }];
    onUpdate?.({ ...content, pillars: newPillars });
  };

  const removePillar = (index: number) => {
    const newPillars = pillars.filter((_: any, i: number) => i !== index);
    onUpdate?.({ ...content, pillars: newPillars });
  };

  return (
    <section className={cn(
      getPaddingClass(),
      'overflow-hidden',
      dark ? 'bg-[#1a1a1a]' : 'bg-[#faf9f7]'
    )}>
      <div className={cn('mx-auto px-6 md:px-12', maxWidth)}>
        {/* Section Header - Proper proportions */}
        <div className="text-center mb-16 md:mb-24 max-w-4xl mx-auto">
          <EditableText
            value={label}
            onChange={(v) => handleChange('label', v)}
            tag="p"
            placeholder="SECTION LABEL"
            isEditing={isEditing}
            className={cn(
              'text-xs uppercase tracking-[0.3em] mb-6 font-sans',
              dark ? 'text-primary/80' : 'text-primary/80'
            )}
          />

          <EditableText
            value={title}
            onChange={(v) => handleChange('title', v)}
            tag="h2"
            placeholder="Section Title"
            isEditing={isEditing}
            className={cn(
              getTitleClass(),
              'font-serif italic font-light leading-[1.1] tracking-tight mb-6',
              dark ? 'text-white' : 'text-foreground'
            )}
          />

          <EditableText
            value={description}
            onChange={(v) => handleChange('description', v)}
            tag="p"
            placeholder="Section description..."
            multiline
            isEditing={isEditing}
            className={cn(
              getDescriptionClass(),
              'font-sans font-light leading-relaxed whitespace-pre-wrap',
              dark ? 'text-neutral-400' : 'text-muted-foreground'
            )}
          />
        </div>

        {/* Pillars Grid - Using gap presets */}
        <div className={cn(
          'grid',
          getGapClass(),
          pillars.length === 2 ? 'md:grid-cols-2' : 
          pillars.length === 3 ? 'md:grid-cols-3' :
          pillars.length === 4 ? 'md:grid-cols-4 lg:grid-cols-4' :
          'md:grid-cols-3'
        )}>
          {pillars.map((pillar: any, index: number) => {
            const IconComponent = getIcon(pillar.icon);
            
            return (
              <div 
                key={index}
                className={cn(
                  'text-center group relative',
                  isEditing && 'border border-dashed border-neutral-300 rounded-lg p-4'
                )}
              >
                {/* Delete button when editing */}
                {isEditing && pillars.length > 1 && (
                  <button
                    onClick={() => removePillar(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Icon */}
                <div className={cn(
                  'w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center',
                  'transition-all duration-300 group-hover:scale-110',
                  dark 
                    ? 'bg-amber-500/20 text-amber-400' 
                    : 'bg-amber-100 text-amber-600'
                )}>
                  <IconComponent className="w-10 h-10" />
                </div>

                {/* Pillar Title - EDITABLE */}
                <EditableText
                  value={pillar.title}
                  onChange={(v) => handlePillarChange(index, 'title', v)}
                  tag="h3"
                  placeholder="Pillar Title"
                  isEditing={isEditing}
                  className={cn(
                    'text-2xl md:text-3xl font-serif italic mb-4',
                    dark ? 'text-white' : 'text-neutral-900'
                  )}
                />

                {/* Pillar Description - EDITABLE */}
                <EditableText
                  value={pillar.description}
                  onChange={(v) => handlePillarChange(index, 'description', v)}
                  tag="p"
                  placeholder="Pillar description..."
                  multiline
                  isEditing={isEditing}
                  className={cn(
                    'text-base md:text-lg font-sans leading-relaxed whitespace-pre-wrap',
                    dark ? 'text-neutral-400' : 'text-neutral-600'
                  )}
                />
              </div>
            );
          })}
        </div>

        {/* Add Pillar Button */}
        {isEditing && (
          <div className="text-center mt-8">
            <button
              onClick={addPillar}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
            >
              <Plus className="w-4 h-4" />
              Add Pillar
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// JE PILLAR GRID RENDERER (je-pillars, je-pillar-grid)
// ============================================================================

export function JEPillarGridRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    label = '',
    title = 'Our Core Values',
    description = '',
    columns = 3,
    variant = 'cards',
    dark = false,
    // Sizing controls
    sectionPadding = 'spacious',
    titleSize = 'large',
    descriptionSize = 'medium',
    itemGap = 'spacious',
    maxWidth = 'max-w-6xl',
    pillars = [
      { icon: 'heart', title: 'Value One', description: 'Description of this value', link: '' },
      { icon: 'leaf', title: 'Value Two', description: 'Description of this value', link: '' },
      { icon: 'star', title: 'Value Three', description: 'Description of this value', link: '' },
    ],
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const handlePillarChange = (index: number, key: string, value: string) => {
    const newPillars = [...pillars];
    newPillars[index] = { ...newPillars[index], [key]: value };
    onUpdate?.({ ...content, pillars: newPillars });
  };

  const addPillar = () => {
    onUpdate?.({ ...content, pillars: [...pillars, { icon: 'star', title: 'New Item', description: 'Description', link: '' }] });
  };

  const removePillar = (index: number) => {
    onUpdate?.({ ...content, pillars: pillars.filter((_: any, i: number) => i !== index) });
  };

  const columnClasses: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  // Get sizing classes
  const getPaddingClass = () => SECTION_PADDING_PRESETS[sectionPadding as keyof typeof SECTION_PADDING_PRESETS] || SECTION_PADDING_PRESETS.spacious;
  const getTitleClass = () => TITLE_SIZE_PRESETS[titleSize as keyof typeof TITLE_SIZE_PRESETS] || TITLE_SIZE_PRESETS.large;
  const getDescriptionClass = () => BODY_SIZE_PRESETS[descriptionSize as keyof typeof BODY_SIZE_PRESETS] || BODY_SIZE_PRESETS.medium;
  const getGapClass = () => GAP_PRESETS[itemGap as keyof typeof GAP_PRESETS] || GAP_PRESETS.spacious;

  return (
    <section className={cn(
      getPaddingClass(),
      'overflow-hidden',
      dark ? 'bg-[#1a1a1a]' : 'bg-[#faf9f7]'
    )}>
      <div className={cn('mx-auto px-6 md:px-12', maxWidth)}>
        {/* Header - Proper proportions */}
        {(title || label || isEditing) && (
          <div className="text-center mb-16 md:mb-24 max-w-4xl mx-auto">
            <EditableText
              value={label}
              onChange={(v) => handleChange('label', v)}
              tag="p"
              placeholder="LABEL"
              isEditing={isEditing}
              className={cn(
                'text-xs uppercase tracking-[0.3em] mb-6 font-sans',
                dark ? 'text-primary/80' : 'text-primary/80'
              )}
            />
            <EditableText
              value={title}
              onChange={(v) => handleChange('title', v)}
              tag="h2"
              placeholder="Section Title"
              isEditing={isEditing}
              className={cn(
                getTitleClass(),
                'font-serif italic font-light leading-[1.1] tracking-tight mb-6',
                dark ? 'text-white' : 'text-foreground'
              )}
            />
            <EditableText
              value={description}
              onChange={(v) => handleChange('description', v)}
              tag="p"
              placeholder="Description..."
              multiline
              isEditing={isEditing}
              className={cn(
                getDescriptionClass(),
                'font-sans font-light leading-relaxed',
                dark ? 'text-neutral-400' : 'text-muted-foreground'
              )}
            />
          </div>
        )}

        {/* Grid - Using gap presets */}
        <div className={cn('grid', getGapClass(), columnClasses[columns] || columnClasses[3])}>
          {pillars.map((pillar: any, index: number) => {
            const IconComponent = getIcon(pillar.icon);
            const Wrapper = pillar.link ? 'a' : 'div';
            
            return (
              <Wrapper
                key={index}
                {...(pillar.link ? { href: pillar.link } : {})}
                className={cn(
                  'relative group',
                  variant === 'cards' && cn(
                    'p-6 rounded-lg transition-all duration-300',
                    dark 
                      ? 'bg-neutral-800 hover:bg-neutral-700' 
                      : 'bg-white hover:shadow-lg'
                  ),
                  variant === 'minimal' && 'text-center py-4',
                  isEditing && 'border border-dashed border-neutral-300'
                )}
              >
                {isEditing && pillars.length > 1 && (
                  <button
                    onClick={(e) => { e.preventDefault(); removePillar(index); }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <div className={cn(
                  'w-14 h-14 rounded-full flex items-center justify-center mb-4',
                  variant === 'minimal' && 'mx-auto',
                  dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'
                )}>
                  <IconComponent className="w-7 h-7" />
                </div>

                <EditableText
                  value={pillar.title}
                  onChange={(v) => handlePillarChange(index, 'title', v)}
                  tag="h3"
                  placeholder="Title"
                  isEditing={isEditing}
                  className={cn(
                    'text-xl font-serif italic mb-2',
                    dark ? 'text-white' : 'text-neutral-900'
                  )}
                />

                <EditableText
                  value={pillar.description}
                  onChange={(v) => handlePillarChange(index, 'description', v)}
                  tag="p"
                  placeholder="Description..."
                  multiline
                  isEditing={isEditing}
                  className={cn(
                    'text-sm font-sans leading-relaxed whitespace-pre-wrap',
                    dark ? 'text-neutral-400' : 'text-neutral-600'
                  )}
                />

                {pillar.link && (
                  <div className="mt-4 flex items-center gap-1 text-amber-600 text-sm">
                    Learn more <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Wrapper>
            );
          })}
        </div>

        {isEditing && (
          <div className="text-center mt-8">
            <button onClick={addPillar} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// JE ROOTED UNITY RENDERER
// ============================================================================

export function JERootedUnityRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    label = 'COMING FALL 2026',
    title = 'Rooted Unity',
    description = 'A movement for ecological renewal, community resilience, and visionary action.',
    longDescription = '',
    imageUrl = '',
    videoUrl = '',
    dark = true,
    ctaText = '',
    ctaLink = '',
    // Sizing controls
    sectionPadding = 'hero',
    titleSize = 'hero',
    descriptionSize = 'large',
    maxWidth = 'max-w-6xl',
    features = [
      'Ecological restoration projects',
      'Community building initiatives', 
      'Educational workshops and retreats',
    ],
  } = content;

  // Get sizing classes
  const getPaddingClass = () => SECTION_PADDING_PRESETS[sectionPadding as keyof typeof SECTION_PADDING_PRESETS] || SECTION_PADDING_PRESETS.hero;
  const getTitleClass = () => TITLE_SIZE_PRESETS[titleSize as keyof typeof TITLE_SIZE_PRESETS] || TITLE_SIZE_PRESETS.hero;
  const getDescriptionClass = () => BODY_SIZE_PRESETS[descriptionSize as keyof typeof BODY_SIZE_PRESETS] || BODY_SIZE_PRESETS.large;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    onUpdate?.({ ...content, features: newFeatures });
  };

  const addFeature = () => {
    onUpdate?.({ ...content, features: [...features, 'New feature'] });
  };

  const removeFeature = (index: number) => {
    onUpdate?.({ ...content, features: features.filter((_: any, i: number) => i !== index) });
  };

  const mediaUrl = videoUrl || imageUrl;
  const isVideo = mediaUrl && /\.(mp4|webm|mov|ogg)$/i.test(mediaUrl);

  return (
    <section className={cn(
      'relative min-h-[80vh] overflow-hidden',
      dark ? 'bg-neutral-900' : 'bg-neutral-100'
    )}>
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
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <img src={mediaUrl} alt="" className="w-full h-full object-cover opacity-60" />
          )}
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

      {/* Content - Using sizing presets */}
      <div className={cn('relative z-10 mx-auto px-6 md:px-12', getPaddingClass(), maxWidth)}>
        <div className="max-w-4xl mx-auto text-center">
          <EditableText
            value={label}
            onChange={(v) => handleChange('label', v)}
            tag="p"
            placeholder="LABEL"
            isEditing={isEditing}
            className="text-xs uppercase tracking-[0.3em] mb-6 font-sans text-white/70"
          />

          <EditableText
            value={title}
            onChange={(v) => handleChange('title', v)}
            tag="h2"
            placeholder="Title"
            isEditing={isEditing}
            className={cn(getTitleClass(), 'font-serif italic font-light mb-8 text-white leading-tight')}
          />

          <EditableText
            value={description}
            onChange={(v) => handleChange('description', v)}
            tag="p"
            placeholder="Short description..."
            multiline
            isEditing={isEditing}
            className={cn(getDescriptionClass(), 'font-sans mb-8 text-white/90 leading-relaxed max-w-2xl mx-auto whitespace-pre-wrap')}
          />

          {/* Long Description - CRITICAL: whitespace-pre-wrap for spacing */}
          {(longDescription || isEditing) && (
            <EditableText
              value={longDescription}
              onChange={(v) => handleChange('longDescription', v)}
              tag="div"
              placeholder="Add detailed description here. Press Enter for new paragraphs..."
              multiline
              isEditing={isEditing}
              className={cn(
                'text-base md:text-lg font-sans leading-loose text-white/80 mb-8',
                'whitespace-pre-wrap' // CRITICAL: Preserves line breaks
              )}
            />
          )}

          {/* Features List */}
          {(features.length > 0 || isEditing) && (
            <ul className="space-y-4 mb-8">
              {features.map((feature: string, index: number) => (
                <li key={index} className="flex items-start gap-3 text-white/80 group">
                  <Leaf className="w-5 h-5 mt-1 text-green-400 flex-shrink-0" />
                  <EditableText
                    value={feature}
                    onChange={(v) => handleFeatureChange(index, v)}
                    tag="span"
                    placeholder="Feature description..."
                    isEditing={isEditing}
                    className="text-base md:text-lg font-sans flex-1"
                  />
                  {isEditing && features.length > 1 && (
                    <button
                      onClick={() => removeFeature(index)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </li>
              ))}
              {isEditing && (
                <li>
                  <button
                    onClick={addFeature}
                    className="flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Feature
                  </button>
                </li>
              )}
            </ul>
          )}

          {/* CTA */}
          {(ctaText || isEditing) && (
            <a
              href={ctaLink || '#'}
              className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// JE FOUNDATIONAL PRINCIPLES RENDERER - REVAMPED with proper proportions
// ============================================================================

export function JEPrinciplesRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    label = '',
    title = 'Our Guiding Principles',
    subtitle = '',
    columns = 2,
    variant = 'numbered',
    dark = false,
    // NEW: Sizing controls
    sectionPadding = 'spacious',
    titleSize = 'large',
    subtitleSize = 'medium',
    numberSize = 'large',
    descriptionSize = 'medium',
    itemGap = 'spacious',
    headerMargin = 'mb-16 md:mb-24',
    maxWidth = 'max-w-6xl',
    principles = [
      { number: '01', title: 'Integrity', description: 'We act with honesty and transparency in all we do.' },
      { number: '02', title: 'Compassion', description: 'We lead with empathy and understanding.' },
      { number: '03', title: 'Excellence', description: 'We strive for the highest standards.' },
      { number: '04', title: 'Growth', description: 'We embrace continuous learning and evolution.' },
    ],
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const handlePrincipleChange = (index: number, key: string, value: string) => {
    const newPrinciples = [...principles];
    newPrinciples[index] = { ...newPrinciples[index], [key]: value };
    onUpdate?.({ ...content, principles: newPrinciples });
  };

  const addPrinciple = () => {
    const num = String(principles.length + 1).padStart(2, '0');
    onUpdate?.({ ...content, principles: [...principles, { number: num, title: 'New Principle', description: 'Description' }] });
  };

  const removePrinciple = (index: number) => {
    onUpdate?.({ ...content, principles: principles.filter((_: any, i: number) => i !== index) });
  };

  // Get classes from presets or use custom value
  const getPaddingClass = () => SECTION_PADDING_PRESETS[sectionPadding as keyof typeof SECTION_PADDING_PRESETS] || sectionPadding;
  const getTitleClass = () => TITLE_SIZE_PRESETS[titleSize as keyof typeof TITLE_SIZE_PRESETS] || titleSize;
  const getSubtitleClass = () => BODY_SIZE_PRESETS[subtitleSize as keyof typeof BODY_SIZE_PRESETS] || subtitleSize;
  const getNumberClass = () => NUMBER_SIZE_PRESETS[numberSize as keyof typeof NUMBER_SIZE_PRESETS] || numberSize;
  const getDescriptionClass = () => BODY_SIZE_PRESETS[descriptionSize as keyof typeof BODY_SIZE_PRESETS] || descriptionSize;
  const getGapClass = () => GAP_PRESETS[itemGap as keyof typeof GAP_PRESETS] || itemGap;

  return (
    <section className={cn(
      getPaddingClass(),
      'overflow-hidden',
      dark ? 'bg-[#1a1a1a]' : 'bg-[#faf9f7]'
    )}>
      <div className={cn('mx-auto px-6 md:px-12', maxWidth)}>
        {/* Header - Matching original site proportions */}
        <div className={cn('text-center mx-auto', headerMargin, 'max-w-4xl')}>
          {label && (
            <EditableText
              value={label}
              onChange={(v) => handleChange('label', v)}
              tag="p"
              placeholder="LABEL"
              isEditing={isEditing}
              className={cn(
                'text-xs uppercase tracking-[0.3em] mb-6 font-sans',
                dark ? 'text-primary/80' : 'text-primary/80'
              )}
            />
          )}
          <EditableText
            value={title}
            onChange={(v) => handleChange('title', v)}
            tag="h2"
            placeholder="Section Title"
            isEditing={isEditing}
            className={cn(
              getTitleClass(),
              'font-serif italic font-light leading-[1.1] tracking-tight mb-6',
              dark ? 'text-white' : 'text-foreground'
            )}
          />
          {subtitle && (
            <EditableText
              value={subtitle}
              onChange={(v) => handleChange('subtitle', v)}
              tag="p"
              placeholder="Subtitle..."
              isEditing={isEditing}
              className={cn(
                getSubtitleClass(),
                'font-sans font-light leading-relaxed',
                dark ? 'text-neutral-400' : 'text-muted-foreground'
              )}
            />
          )}
        </div>

        {/* Principles Grid - Proper proportions */}
        <div className={cn(
          'grid',
          getGapClass(),
          columns === 1 ? 'grid-cols-1 max-w-3xl mx-auto' :
          columns === 2 ? 'grid-cols-1 md:grid-cols-2' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        )}>
          {principles.map((principle: any, index: number) => (
            <div 
              key={index}
              className={cn(
                'relative group',
                isEditing && 'border border-dashed border-neutral-300 rounded-xl p-6'
              )}
            >
              {isEditing && principles.length > 1 && (
                <button
                  onClick={() => removePrinciple(index)}
                  className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 z-10 shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <div className="flex gap-6 md:gap-8">
                {/* Number - Large and prominent */}
                <EditableText
                  value={principle.number}
                  onChange={(v) => handlePrincipleChange(index, 'number', v)}
                  tag="span"
                  placeholder="01"
                  isEditing={isEditing}
                  className={cn(
                    getNumberClass(),
                    'font-serif italic flex-shrink-0',
                    dark ? 'text-primary/60' : 'text-primary/40'
                  )}
                />

                <div className="flex-1 pt-2">
                  <EditableText
                    value={principle.title}
                    onChange={(v) => handlePrincipleChange(index, 'title', v)}
                    tag="h3"
                    placeholder="Principle Title"
                    isEditing={isEditing}
                    className={cn(
                      'text-2xl md:text-3xl font-serif italic mb-4',
                      dark ? 'text-white' : 'text-foreground'
                    )}
                  />
                  <EditableText
                    value={principle.description}
                    onChange={(v) => handlePrincipleChange(index, 'description', v)}
                    tag="p"
                    placeholder="Description..."
                    multiline
                    isEditing={isEditing}
                    className={cn(
                      getDescriptionClass(),
                      'font-sans font-light leading-relaxed whitespace-pre-wrap',
                      dark ? 'text-neutral-400' : 'text-muted-foreground'
                    )}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {isEditing && (
          <div className="text-center mt-12">
            <button onClick={addPrinciple} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors">
              <Plus className="w-5 h-5" /> Add Principle
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// JE OFFERINGS GRID RENDERER
// ============================================================================

export function JEOfferingsGridRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    label = '',
    title = 'Our Offerings',
    description = '',
    columns = 3,
    variant = 'cards',
    dark = false,
    // Sizing controls
    sectionPadding = 'spacious',
    titleSize = 'large',
    descriptionSize = 'medium',
    itemGap = 'spacious',
    maxWidth = 'max-w-6xl',
    offerings = [
      { title: 'Service One', description: 'Description of this service', imageUrl: '', price: '', link: '', badge: '' },
      { title: 'Service Two', description: 'Description of this service', imageUrl: '', price: '', link: '', badge: 'Popular' },
      { title: 'Service Three', description: 'Description of this service', imageUrl: '', price: '', link: '', badge: '' },
    ],
  } = content;

  // Get sizing classes
  const getPaddingClass = () => SECTION_PADDING_PRESETS[sectionPadding as keyof typeof SECTION_PADDING_PRESETS] || SECTION_PADDING_PRESETS.spacious;
  const getTitleClass = () => TITLE_SIZE_PRESETS[titleSize as keyof typeof TITLE_SIZE_PRESETS] || TITLE_SIZE_PRESETS.large;
  const getDescriptionClass = () => BODY_SIZE_PRESETS[descriptionSize as keyof typeof BODY_SIZE_PRESETS] || BODY_SIZE_PRESETS.medium;
  const getGapClass = () => GAP_PRESETS[itemGap as keyof typeof GAP_PRESETS] || GAP_PRESETS.spacious;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const handleOfferingChange = (index: number, key: string, value: string) => {
    const newOfferings = [...offerings];
    newOfferings[index] = { ...newOfferings[index], [key]: value };
    onUpdate?.({ ...content, offerings: newOfferings });
  };

  const addOffering = () => {
    onUpdate?.({ ...content, offerings: [...offerings, { title: 'New Offering', description: 'Description', imageUrl: '', price: '', link: '', badge: '' }] });
  };

  const removeOffering = (index: number) => {
    onUpdate?.({ ...content, offerings: offerings.filter((_: any, i: number) => i !== index) });
  };

  return (
    <section className={cn(
      getPaddingClass(),
      'overflow-hidden',
      dark ? 'bg-[#1a1a1a]' : 'bg-[#faf9f7]'
    )}>
      <div className={cn('mx-auto px-6 md:px-12', maxWidth)}>
        {/* Header - Proper proportions */}
        <div className="text-center mb-16 md:mb-24 max-w-4xl mx-auto">
          <EditableText
            value={label}
            onChange={(v) => handleChange('label', v)}
            tag="p"
            placeholder="LABEL"
            isEditing={isEditing}
            className={cn('text-xs uppercase tracking-[0.3em] mb-6 font-sans', dark ? 'text-primary/80' : 'text-primary/80')}
          />
          <EditableText
            value={title}
            onChange={(v) => handleChange('title', v)}
            tag="h2"
            placeholder="Section Title"
            isEditing={isEditing}
            className={cn(getTitleClass(), 'font-serif italic font-light leading-[1.1] tracking-tight mb-6', dark ? 'text-white' : 'text-foreground')}
          />
          <EditableText
            value={description}
            onChange={(v) => handleChange('description', v)}
            tag="p"
            placeholder="Description..."
            multiline
            isEditing={isEditing}
            className={cn(getDescriptionClass(), 'font-sans font-light leading-relaxed whitespace-pre-wrap', dark ? 'text-neutral-400' : 'text-muted-foreground')}
          />
        </div>

        {/* Grid - Using gap presets */}
        <div className={cn(
          'grid',
          getGapClass(),
          columns === 2 ? 'grid-cols-1 md:grid-cols-2' :
          columns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        )}>
          {offerings.map((offering: any, index: number) => (
            <div
              key={index}
              className={cn(
                'relative group rounded-lg overflow-hidden',
                dark ? 'bg-neutral-800' : 'bg-white shadow-sm hover:shadow-lg',
                'transition-all duration-300',
                isEditing && 'border border-dashed border-neutral-300'
              )}
            >
              {isEditing && offerings.length > 1 && (
                <button
                  onClick={() => removeOffering(index)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Badge */}
              {offering.badge && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-amber-500 text-white text-xs uppercase tracking-wider rounded-full z-10">
                  {offering.badge}
                </div>
              )}

              {/* Image */}
              {offering.imageUrl ? (
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={offering.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className={cn('aspect-[4/3] flex items-center justify-center', dark ? 'bg-neutral-700' : 'bg-neutral-100')}>
                  <Star className="w-12 h-12 text-neutral-400" />
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                <EditableText
                  value={offering.title}
                  onChange={(v) => handleOfferingChange(index, 'title', v)}
                  tag="h3"
                  placeholder="Offering Title"
                  isEditing={isEditing}
                  className={cn('text-xl font-serif italic mb-2', dark ? 'text-white' : 'text-neutral-900')}
                />
                <EditableText
                  value={offering.description}
                  onChange={(v) => handleOfferingChange(index, 'description', v)}
                  tag="p"
                  placeholder="Description..."
                  multiline
                  isEditing={isEditing}
                  className={cn('text-sm font-sans mb-4 whitespace-pre-wrap', dark ? 'text-neutral-400' : 'text-neutral-600')}
                />
                {(offering.price || isEditing) && (
                  <EditableText
                    value={offering.price}
                    onChange={(v) => handleOfferingChange(index, 'price', v)}
                    tag="p"
                    placeholder="$99"
                    isEditing={isEditing}
                    className={cn('text-lg font-semibold', dark ? 'text-amber-400' : 'text-amber-600')}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {isEditing && (
          <div className="text-center mt-8">
            <button onClick={addOffering} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
              <Plus className="w-4 h-4" /> Add Offering
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// JE OFFERINGS CAROUSEL RENDERER
// ============================================================================

export function JECarouselRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    label = '',
    title = 'Featured',
    subtitle = '',
    autoplay = false,
    interval = 5000,
    showDots = true,
    showArrows = true,
    items = [
      { title: 'Item One', description: 'Description', imageUrl: '', link: '' },
      { title: 'Item Two', description: 'Description', imageUrl: '', link: '' },
      { title: 'Item Three', description: 'Description', imageUrl: '', link: '' },
    ],
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const handleItemChange = (index: number, key: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [key]: value };
    onUpdate?.({ ...content, items: newItems });
  };

  const addItem = () => {
    onUpdate?.({ ...content, items: [...items, { title: 'New Item', description: 'Description', imageUrl: '', link: '' }] });
  };

  const removeItem = (index: number) => {
    onUpdate?.({ ...content, items: items.filter((_: any, i: number) => i !== index) });
    if (currentIndex >= items.length - 1) setCurrentIndex(Math.max(0, items.length - 2));
  };

  const goTo = (index: number) => setCurrentIndex(index);
  const goNext = () => setCurrentIndex((prev) => (prev + 1) % items.length);
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

  // Autoplay
  useEffect(() => {
    if (autoplay && items.length > 1 && !isEditing) {
      const timer = setInterval(goNext, interval);
      return () => clearInterval(timer);
    }
  }, [autoplay, interval, items.length, isEditing]);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <EditableText value={label} onChange={(v) => handleChange('label', v)} tag="p" placeholder="LABEL" isEditing={isEditing} className="text-xs uppercase tracking-[0.3em] mb-4 font-sans text-amber-600" />
          <EditableText value={title} onChange={(v) => handleChange('title', v)} tag="h2" placeholder="Title" isEditing={isEditing} className="text-3xl md:text-4xl font-serif italic mb-4 text-neutral-900" />
          <EditableText value={subtitle} onChange={(v) => handleChange('subtitle', v)} tag="p" placeholder="Subtitle..." isEditing={isEditing} className="text-lg font-sans text-neutral-600" />
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Slides Container */}
          <div className="overflow-hidden rounded-lg">
            <div 
              className="flex transition-transform duration-500"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {items.map((item: any, index: number) => (
                <div key={index} className="w-full flex-shrink-0 relative">
                  {isEditing && (
                    <button
                      onClick={() => removeItem(index)}
                      className="absolute top-4 right-4 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 z-10"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    {/* Image */}
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-neutral-100">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Star className="w-16 h-16 text-neutral-300" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <EditableText value={item.title} onChange={(v) => handleItemChange(index, 'title', v)} tag="h3" placeholder="Item Title" isEditing={isEditing} className="text-2xl md:text-3xl font-serif italic mb-4 text-neutral-900" />
                      <EditableText value={item.description} onChange={(v) => handleItemChange(index, 'description', v)} tag="p" placeholder="Description..." multiline isEditing={isEditing} className="text-base font-sans text-neutral-600 whitespace-pre-wrap mb-6" />
                      {item.link && (
                        <a href={item.link} className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700">
                          Learn More <ArrowRight className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Arrows */}
          {showArrows && items.length > 1 && (
            <>
              <button onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-neutral-50">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-neutral-50">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        {showDots && items.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {items.map((_: any, index: number) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  currentIndex === index ? 'bg-amber-500 w-6' : 'bg-neutral-300 hover:bg-neutral-400'
                )}
              />
            ))}
          </div>
        )}

        {isEditing && (
          <div className="text-center mt-8">
            <button onClick={addItem} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
              <Plus className="w-4 h-4" /> Add Slide
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// JE COMMUNITY RENDERER
// ============================================================================

export function JECommunityRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    label = '',
    title = 'Join Our Community',
    description = 'Be part of a growing movement of conscious individuals.',
    imageUrl = '',
    dark = false,
    ctaText = 'Join Now',
    ctaLink = '#',
    stats = [
      { value: '10K+', label: 'Members' },
      { value: '50+', label: 'Events' },
      { value: '100%', label: 'Love' },
    ],
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const handleStatChange = (index: number, key: string, value: string) => {
    const newStats = [...stats];
    newStats[index] = { ...newStats[index], [key]: value };
    onUpdate?.({ ...content, stats: newStats });
  };

  return (
    <section className={cn(
      'py-16 md:py-24 relative overflow-hidden',
      dark ? 'bg-neutral-900' : 'bg-amber-50'
    )}>
      {imageUrl && (
        <>
          <div className="absolute inset-0">
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-black/60" />
        </>
      )}

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <EditableText value={label} onChange={(v) => handleChange('label', v)} tag="p" placeholder="LABEL" isEditing={isEditing} className={cn('text-xs uppercase tracking-[0.3em] mb-4 font-sans', imageUrl || dark ? 'text-amber-400' : 'text-amber-600')} />
          <EditableText value={title} onChange={(v) => handleChange('title', v)} tag="h2" placeholder="Title" isEditing={isEditing} className={cn('text-3xl md:text-4xl font-serif italic mb-6', imageUrl || dark ? 'text-white' : 'text-neutral-900')} />
          <EditableText value={description} onChange={(v) => handleChange('description', v)} tag="p" placeholder="Description..." multiline isEditing={isEditing} className={cn('text-lg font-sans mb-8 whitespace-pre-wrap', imageUrl || dark ? 'text-white/80' : 'text-neutral-600')} />

          {/* Stats */}
          {stats.length > 0 && (
            <div className="flex justify-center gap-12 mb-8">
              {stats.map((stat: any, index: number) => (
                <div key={index} className="text-center">
                  <EditableText value={stat.value} onChange={(v) => handleStatChange(index, 'value', v)} tag="p" placeholder="100+" isEditing={isEditing} className={cn('text-3xl md:text-4xl font-serif italic', imageUrl || dark ? 'text-white' : 'text-amber-600')} />
                  <EditableText value={stat.label} onChange={(v) => handleStatChange(index, 'label', v)} tag="p" placeholder="Label" isEditing={isEditing} className={cn('text-sm font-sans', imageUrl || dark ? 'text-white/60' : 'text-neutral-500')} />
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <a href={ctaLink} className={cn(
            'inline-flex items-center gap-2 px-8 py-3 rounded-lg transition-colors',
            imageUrl || dark
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-neutral-900 text-white hover:bg-neutral-800'
          )}>
            <EditableText value={ctaText} onChange={(v) => handleChange('ctaText', v)} placeholder="Button Text" isEditing={isEditing} />
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// JE COMING SOON RENDERER
// ============================================================================

export function JEComingSoonRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    title = 'Coming Soon',
    description = 'Something exciting is on its way.',
    launchDate = '',
    imageUrl = '',
    dark = true,
    showCountdown = false,
    notifyEnabled = true,
    notifyPlaceholder = 'Enter your email',
    notifyButtonText = 'Notify Me',
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  return (
    <section className={cn(
      'py-24 md:py-32 relative overflow-hidden min-h-[60vh] flex items-center',
      dark ? 'bg-neutral-900' : 'bg-neutral-100'
    )}>
      {imageUrl && (
        <>
          <div className="absolute inset-0">
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-black/70" />
        </>
      )}

      <div className="container mx-auto px-6 relative z-10 text-center">
        <EditableText value={title} onChange={(v) => handleChange('title', v)} tag="h1" placeholder="Coming Soon" isEditing={isEditing} className={cn('text-4xl md:text-6xl font-serif italic mb-6', imageUrl || dark ? 'text-white' : 'text-neutral-900')} />
        <EditableText value={description} onChange={(v) => handleChange('description', v)} tag="p" placeholder="Description..." multiline isEditing={isEditing} className={cn('text-xl font-sans mb-8 max-w-2xl mx-auto whitespace-pre-wrap', imageUrl || dark ? 'text-white/80' : 'text-neutral-600')} />

        {launchDate && (
          <p className={cn('text-sm uppercase tracking-wider mb-8', imageUrl || dark ? 'text-amber-400' : 'text-amber-600')}>
            Expected: {launchDate}
          </p>
        )}

        {notifyEnabled && (
          <div className="max-w-md mx-auto flex gap-2">
            <input
              type="email"
              placeholder={notifyPlaceholder}
              className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50"
            />
            <button className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
              {notifyButtonText}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// JE TEAM MEMBER RENDERER
// ============================================================================

export function JETeamMemberRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    name = 'Team Member',
    role = 'Position',
    bio = '',
    imageUrl = '',
    email = '',
    phone = '',
    socialLinks = [],
    variant = 'card',
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  return (
    <div className={cn(
      'p-6',
      variant === 'card' && 'bg-white rounded-lg shadow-sm'
    )}>
      <div className="text-center">
        {/* Avatar */}
        <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-neutral-200">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Users className="w-12 h-12 text-neutral-400" />
            </div>
          )}
        </div>

        <EditableText value={name} onChange={(v) => handleChange('name', v)} tag="h3" placeholder="Name" isEditing={isEditing} className="text-xl font-serif italic text-neutral-900 mb-1" />
        <EditableText value={role} onChange={(v) => handleChange('role', v)} tag="p" placeholder="Role/Position" isEditing={isEditing} className="text-sm font-sans text-amber-600 mb-4" />
        <EditableText value={bio} onChange={(v) => handleChange('bio', v)} tag="p" placeholder="Bio..." multiline isEditing={isEditing} className="text-sm font-sans text-neutral-600 whitespace-pre-wrap" />

        {/* Contact */}
        {(email || phone) && (
          <div className="mt-4 flex justify-center gap-4 text-sm text-neutral-500">
            {email && <a href={`mailto:${email}`} className="flex items-center gap-1 hover:text-amber-600"><Mail className="w-4 h-4" /></a>}
            {phone && <a href={`tel:${phone}`} className="flex items-center gap-1 hover:text-amber-600"><MapPin className="w-4 h-4" /></a>}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// JE FEATURE CARD RENDERER
// ============================================================================

export function JEFeatureCardRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    title = 'Feature Title',
    description = 'Feature description goes here.',
    icon = 'star',
    link = '',
    dark = false,
    imageUrl = '',
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const IconComponent = getIcon(icon);
  const Wrapper = link ? 'a' : 'div';

  return (
    <Wrapper
      {...(link ? { href: link } : {})}
      className={cn(
        'block p-6 rounded-lg transition-all duration-300',
        dark ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-white hover:shadow-lg',
        link && 'cursor-pointer'
      )}
    >
      {imageUrl ? (
        <div className="aspect-video rounded-lg overflow-hidden mb-4">
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center mb-4',
          dark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'
        )}>
          <IconComponent className="w-7 h-7" />
        </div>
      )}

      <EditableText value={title} onChange={(v) => handleChange('title', v)} tag="h3" placeholder="Title" isEditing={isEditing} className={cn('text-xl font-serif italic mb-2', dark ? 'text-white' : 'text-neutral-900')} />
      <EditableText value={description} onChange={(v) => handleChange('description', v)} tag="p" placeholder="Description..." multiline isEditing={isEditing} className={cn('text-sm font-sans whitespace-pre-wrap', dark ? 'text-neutral-400' : 'text-neutral-600')} />

      {link && (
        <div className="mt-4 flex items-center gap-1 text-amber-600 text-sm">
          Learn more <ArrowRight className="w-4 h-4" />
        </div>
      )}
    </Wrapper>
  );
}

// ============================================================================
// JE VOLUMES RENDERER (for books/publications)
// ============================================================================

export function JEVolumesRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    label = '',
    title = 'Publications',
    description = '',
    dark = false,
    cardRadius = '1rem',
    volumes = [
      { title: 'Volume I', description: 'First edition', imageUrl: '', link: '' },
      { title: 'Volume II', description: 'Second edition', imageUrl: '', link: '' },
    ],
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const handleVolumeChange = (index: number, key: string, value: string) => {
    const newVolumes = [...volumes];
    newVolumes[index] = { ...newVolumes[index], [key]: value };
    onUpdate?.({ ...content, volumes: newVolumes });
  };

  const addVolume = () => {
    onUpdate?.({ ...content, volumes: [...volumes, { title: 'New Volume', description: 'Description', imageUrl: '', link: '' }] });
  };

  const removeVolume = (index: number) => {
    onUpdate?.({ ...content, volumes: volumes.filter((_: any, i: number) => i !== index) });
  };

  return (
    <section className={cn('py-16 md:py-24', dark ? 'bg-neutral-900' : 'bg-white')}>
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <EditableText value={label} onChange={(v) => handleChange('label', v)} tag="p" placeholder="LABEL" isEditing={isEditing} className={cn('text-xs uppercase tracking-[0.3em] mb-4 font-sans', dark ? 'text-amber-400' : 'text-amber-600')} />
          <EditableText value={title} onChange={(v) => handleChange('title', v)} tag="h2" placeholder="Title" isEditing={isEditing} className={cn('text-3xl md:text-4xl font-serif italic mb-4', dark ? 'text-white' : 'text-neutral-900')} />
          <EditableText value={description} onChange={(v) => handleChange('description', v)} tag="p" placeholder="Description..." multiline isEditing={isEditing} className={cn('text-lg font-sans whitespace-pre-wrap', dark ? 'text-neutral-300' : 'text-neutral-600')} />
        </div>

        {/* Volumes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {volumes.map((volume: any, index: number) => (
            <div
              key={index}
              className={cn(
                'relative group overflow-hidden transition-all duration-300',
                dark ? 'bg-neutral-800' : 'bg-neutral-50',
                isEditing && 'border border-dashed border-neutral-300'
              )}
              style={{ borderRadius: cardRadius }}
            >
              {isEditing && volumes.length > 1 && (
                <button onClick={() => removeVolume(index)} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 z-10">
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Cover Image */}
              <div className="aspect-[3/4] overflow-hidden">
                {volume.imageUrl ? (
                  <img src={volume.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className={cn('w-full h-full flex items-center justify-center', dark ? 'bg-neutral-700' : 'bg-neutral-200')}>
                    <BookOpen className="w-16 h-16 text-neutral-400" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <EditableText value={volume.title} onChange={(v) => handleVolumeChange(index, 'title', v)} tag="h3" placeholder="Volume Title" isEditing={isEditing} className={cn('text-lg font-serif italic mb-1', dark ? 'text-white' : 'text-neutral-900')} />
                <EditableText value={volume.description} onChange={(v) => handleVolumeChange(index, 'description', v)} tag="p" placeholder="Description..." isEditing={isEditing} className={cn('text-sm font-sans', dark ? 'text-neutral-400' : 'text-neutral-600')} />
              </div>
            </div>
          ))}
        </div>

        {isEditing && (
          <div className="text-center mt-8">
            <button onClick={addVolume} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
              <Plus className="w-4 h-4" /> Add Volume
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// EXPORTS - Part 2
// ============================================================================

export const Part2Renderers = {
  JEThreePillarsRenderer,
  JEPillarGridRenderer,
  JERootedUnityRenderer,
  JEPrinciplesRenderer,
  JEOfferingsGridRenderer,
  JECarouselRenderer,
  JECommunityRenderer,
  JEComingSoonRenderer,
  JETeamMemberRenderer,
  JEFeatureCardRenderer,
  JEVolumesRenderer,
};
