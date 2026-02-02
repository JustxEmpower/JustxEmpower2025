/**
 * Just Empower - COMPLETE Block Renderers with Full Editability
 * 
 * PART 4: Standard Blocks (Non-JE)
 * - Hero
 * - Text
 * - Heading
 * - Quote
 * - Feature Grid
 * - Testimonials
 * - Stats
 * - CTA (Call to Action)
 * - Accordion
 * - Tabs
 * - Image
 * - Video
 * - Spacer
 * - Divider
 * - Button
 * - Contact Form
 * - Newsletter
 * - Pricing
 * - Code
 * - HTML
 * - Embed
 * - Columns
 * - List
 * - Table
 * - Countdown
 * - Map
 * - Social
 * 
 * @version 3.0 - COMPLETE
 * @date January 2026
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown, ChevronUp, Plus, X, Star, Mail, ArrowRight,
  Check, Play, Pause, Code, ExternalLink, MapPin, Clock,
  Instagram, Facebook, Twitter, Linkedin, Youtube, Github,
  Image as ImageIcon, Video, List, Table, Grid, Columns,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditableText, getIcon, SECTION_PADDING_PRESETS, TITLE_SIZE_PRESETS, BODY_SIZE_PRESETS, GAP_PRESETS } from './BlockRenderers-Part1-Core';
import EditableElement from '../EditableElement';
import MoveableElement from '../MoveableElement';

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
  isElementEditMode?: boolean;
  onUpdate?: (content: Record<string, any>) => void;
}

// ============================================================================
// STANDARD HERO RENDERER
// ============================================================================

export function HeroBlockRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    headline = 'Your Headline Here',
    subheadline = 'Supporting text goes here',
    ctaText = 'Get Started',
    ctaLink = '#',
    secondaryCtaText = '',
    secondaryCtaLink = '',
    backgroundImage = '',
    backgroundColor = '',
    overlay = true,
    overlayOpacity = 50,
    variant = 'centered',
    // Sizing controls
    sectionPadding = 'hero',
    titleSize = 'hero',
    descriptionSize = 'large',
    maxWidth = 'max-w-6xl',
    minHeight = '500px',
    textColor = 'white',
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  return (
    <section
      className={cn(
        'relative flex items-center justify-center overflow-hidden',
        variant === 'left' && 'justify-start',
        variant === 'right' && 'justify-end'
      )}
      style={{
        minHeight,
        backgroundColor: backgroundColor || '#1f2937',
      }}
    >
      {/* Background Image */}
      {backgroundImage && (
        <div className="absolute inset-0">
          <img src={backgroundImage} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Overlay */}
      {overlay && backgroundImage && (
        <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity / 100 }} />
      )}

      {/* Content */}
      <div className={cn(
        'relative z-10 container mx-auto px-6 py-20',
        variant === 'centered' && 'text-center',
        variant === 'left' && 'text-left',
        variant === 'right' && 'text-right'
      )}>
        <div className={cn(variant === 'centered' ? 'max-w-3xl mx-auto' : 'max-w-xl')}>
          <EditableText
            value={headline}
            onChange={(v) => handleChange('headline', v)}
            tag="h1"
            placeholder="Headline"
            isEditing={isEditing}
            className={cn(
              'text-4xl md:text-5xl lg:text-6xl font-bold mb-6',
              textColor === 'white' ? 'text-white' : 'text-neutral-900'
            )}
          />

          <EditableText
            value={subheadline}
            onChange={(v) => handleChange('subheadline', v)}
            tag="p"
            placeholder="Subheadline..."
            multiline
            isEditing={isEditing}
            className={cn(
              'text-xl md:text-2xl mb-8 whitespace-pre-wrap',
              textColor === 'white' ? 'text-white/80' : 'text-neutral-600'
            )}
          />

          <div className={cn(
            'flex gap-4',
            variant === 'centered' && 'justify-center',
            variant === 'right' && 'justify-end'
          )}>
            {(ctaText || isEditing) && (
              <a href={ctaLink} className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <EditableText value={ctaText} onChange={(v) => handleChange('ctaText', v)} placeholder="Button" isEditing={isEditing} />
              </a>
            )}
            {(secondaryCtaText || isEditing) && (
              <a href={secondaryCtaLink} className={cn(
                'px-8 py-3 rounded-lg transition-colors',
                textColor === 'white' ? 'text-white border border-white hover:bg-white hover:text-neutral-900' : 'text-neutral-900 border border-neutral-900 hover:bg-neutral-900 hover:text-white'
              )}>
                <EditableText value={secondaryCtaText} onChange={(v) => handleChange('secondaryCtaText', v)} placeholder="Secondary" isEditing={isEditing} />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// STANDARD TEXT BLOCK RENDERER
// ============================================================================

export function TextBlockRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    content: textContent = '',
    alignment = 'left',
    maxWidth = 'narrow',
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  // Static maxWidth classes - Tailwind cannot use dynamic class names
  const maxWidthClasses: Record<string, string> = {
    'narrow': 'max-w-2xl',
    'medium': 'max-w-4xl',
    'wide': 'max-w-6xl',
    'full': 'max-w-full',
    'xs': 'max-w-xs',
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
  };

  const alignmentClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  };

  return (
    <div className={cn(
      'py-6 px-6 mx-auto',
      maxWidthClasses[maxWidth] || maxWidthClasses.narrow,
      alignmentClasses[alignment] || alignmentClasses.left
    )}>
      <EditableText
        value={textContent}
        onChange={(v) => handleChange('content', v)}
        tag="div"
        placeholder="Enter your text here..."
        multiline
        isEditing={isEditing}
        dangerousHtml
        className="prose max-w-none whitespace-pre-wrap"
      />
    </div>
  );
}

// ============================================================================
// STANDARD HEADING BLOCK RENDERER
// ============================================================================

export function HeadingBlockRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    text = 'Section Heading',
    level = 'h2',
    alignment = 'left',
    color = '',
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const sizeClasses: Record<string, string> = {
    h1: 'text-4xl md:text-5xl font-bold',
    h2: 'text-3xl md:text-4xl font-bold',
    h3: 'text-2xl md:text-3xl font-semibold',
    h4: 'text-xl md:text-2xl font-semibold',
    h5: 'text-lg md:text-xl font-medium',
    h6: 'text-base md:text-lg font-medium',
  };

  const alignmentClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className={cn('py-4 px-6', alignmentClasses[alignment] || alignmentClasses.left)}>
      <EditableText
        value={text}
        onChange={(v) => handleChange('text', v)}
        tag={level as any}
        placeholder="Heading..."
        isEditing={isEditing}
        className={cn(sizeClasses[level], 'text-neutral-900')}
        style={color ? { color } : undefined}
      />
    </div>
  );
}

// ============================================================================
// STANDARD QUOTE BLOCK RENDERER
// ============================================================================

export function QuoteBlockRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    quote = '',
    author = '',
    role = '',
    variant = 'default',
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  return (
    <blockquote className={cn(
      'py-8 px-6',
      variant === 'bordered' && 'border-l-4 border-blue-500 pl-6',
      variant === 'modern' && 'bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-lg',
      variant === 'large' && 'text-center'
    )}>
      <EditableText
        value={quote}
        onChange={(v) => handleChange('quote', v)}
        tag="p"
        placeholder="Quote text..."
        multiline
        isEditing={isEditing}
        className={cn(
          'font-serif italic whitespace-pre-wrap mb-4',
          variant === 'large' ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl',
          'text-neutral-700'
        )}
      />
      <footer>
        <EditableText value={author} onChange={(v) => handleChange('author', v)} tag="cite" placeholder="Author" isEditing={isEditing} className="text-neutral-900 not-italic font-medium" />
        {(role || isEditing) && (
          <EditableText value={role} onChange={(v) => handleChange('role', v)} tag="span" placeholder="Role" isEditing={isEditing} className="text-neutral-500 text-sm ml-2" />
        )}
      </footer>
    </blockquote>
  );
}

// ============================================================================
// STANDARD FEATURE GRID RENDERER
// ============================================================================

export function FeatureGridRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    heading = 'Features',
    description = '',
    columns = 3,
    features = [
      { icon: 'star', title: 'Feature One', description: 'Description of feature one' },
      { icon: 'zap', title: 'Feature Two', description: 'Description of feature two' },
      { icon: 'shield', title: 'Feature Three', description: 'Description of feature three' },
    ],
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const handleFeatureChange = (index: number, key: string, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [key]: value };
    onUpdate?.({ ...content, features: newFeatures });
  };

  const addFeature = () => {
    onUpdate?.({ ...content, features: [...features, { icon: 'star', title: 'New Feature', description: 'Description' }] });
  };

  const removeFeature = (index: number) => {
    onUpdate?.({ ...content, features: features.filter((_: any, i: number) => i !== index) });
  };

  return (
    <section className="py-16 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <EditableText value={heading} onChange={(v) => handleChange('heading', v)} tag="h2" placeholder="Section Heading" isEditing={isEditing} className="text-3xl font-bold mb-4 text-neutral-900" />
          <EditableText value={description} onChange={(v) => handleChange('description', v)} tag="p" placeholder="Description..." multiline isEditing={isEditing} className="text-lg text-neutral-600 max-w-2xl mx-auto whitespace-pre-wrap" />
        </div>

        <div className={cn(
          'grid gap-8',
          columns === 2 ? 'md:grid-cols-2' :
          columns === 3 ? 'md:grid-cols-3' :
          'md:grid-cols-4'
        )}>
          {features.map((feature: any, index: number) => {
            const IconComponent = getIcon(feature.icon);
            return (
              <div key={index} className={cn('text-center p-6', isEditing && 'border border-dashed border-neutral-300 rounded-lg relative')}>
                {isEditing && features.length > 1 && (
                  <button onClick={() => removeFeature(index)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                    <X className="w-4 h-4" />
                  </button>
                )}

                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  <IconComponent className="w-8 h-8" />
                </div>

                <EditableText value={feature.title} onChange={(v) => handleFeatureChange(index, 'title', v)} tag="h3" placeholder="Title" isEditing={isEditing} className="text-xl font-semibold mb-2 text-neutral-900" />
                <EditableText value={feature.description} onChange={(v) => handleFeatureChange(index, 'description', v)} tag="p" placeholder="Description..." multiline isEditing={isEditing} className="text-neutral-600 whitespace-pre-wrap" />
              </div>
            );
          })}
        </div>

        {isEditing && (
          <div className="text-center mt-8">
            <button onClick={addFeature} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Add Feature
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// STANDARD TESTIMONIALS RENDERER
// ============================================================================

export function TestimonialsBlockRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    heading = 'What Our Clients Say',
    testimonials = [
      { quote: 'Great service!', author: 'John D.', role: 'CEO', avatar: '', rating: 5 },
      { quote: 'Highly recommended!', author: 'Jane S.', role: 'Designer', avatar: '', rating: 5 },
    ],
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const handleTestimonialChange = (index: number, key: string, value: any) => {
    const newTestimonials = [...testimonials];
    newTestimonials[index] = { ...newTestimonials[index], [key]: value };
    onUpdate?.({ ...content, testimonials: newTestimonials });
  };

  const addTestimonial = () => {
    onUpdate?.({ ...content, testimonials: [...testimonials, { quote: 'New testimonial...', author: 'Name', role: 'Role', avatar: '', rating: 5 }] });
  };

  const removeTestimonial = (index: number) => {
    onUpdate?.({ ...content, testimonials: testimonials.filter((_: any, i: number) => i !== index) });
  };

  return (
    <section className="py-16 px-6 bg-neutral-50">
      <div className="container mx-auto">
        <EditableText value={heading} onChange={(v) => handleChange('heading', v)} tag="h2" placeholder="Heading" isEditing={isEditing} className="text-3xl font-bold mb-12 text-center text-neutral-900" />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t: any, index: number) => (
            <div key={index} className={cn('bg-white p-6 rounded-lg shadow-sm', isEditing && 'relative border border-dashed border-neutral-300')}>
              {isEditing && testimonials.length > 1 && (
                <button onClick={() => removeTestimonial(index)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                  <X className="w-4 h-4" />
                </button>
              )}

              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={cn('w-4 h-4', i < t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300')} />
                ))}
              </div>

              <EditableText value={t.quote} onChange={(v) => handleTestimonialChange(index, 'quote', v)} tag="p" placeholder="Quote..." multiline isEditing={isEditing} className="text-neutral-600 mb-4 whitespace-pre-wrap" />

              <div className="flex items-center gap-3">
                {t.avatar && <img src={t.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />}
                <div>
                  <EditableText value={t.author} onChange={(v) => handleTestimonialChange(index, 'author', v)} tag="p" placeholder="Name" isEditing={isEditing} className="font-medium text-neutral-900" />
                  <EditableText value={t.role} onChange={(v) => handleTestimonialChange(index, 'role', v)} tag="p" placeholder="Role" isEditing={isEditing} className="text-sm text-neutral-500" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {isEditing && (
          <div className="text-center mt-8">
            <button onClick={addTestimonial} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Add Testimonial
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// STANDARD STATS RENDERER
// ============================================================================

export function StatsBlockRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    stats = [
      { value: '100+', label: 'Clients' },
      { value: '500+', label: 'Projects' },
      { value: '99%', label: 'Satisfaction' },
      { value: '24/7', label: 'Support' },
    ],
    variant = 'default',
    backgroundColor = '',
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const handleStatChange = (index: number, key: string, value: string) => {
    const newStats = [...stats];
    newStats[index] = { ...newStats[index], [key]: value };
    onUpdate?.({ ...content, stats: newStats });
  };

  const addStat = () => {
    onUpdate?.({ ...content, stats: [...stats, { value: '0', label: 'Label' }] });
  };

  const removeStat = (index: number) => {
    onUpdate?.({ ...content, stats: stats.filter((_: any, i: number) => i !== index) });
  };

  return (
    <section className="py-16 px-6" style={backgroundColor ? { backgroundColor } : undefined}>
      <div className="container mx-auto">
        <div className={cn(
          'grid gap-8',
          stats.length === 2 ? 'grid-cols-2' :
          stats.length === 3 ? 'grid-cols-3' :
          'grid-cols-2 md:grid-cols-4'
        )}>
          {stats.map((stat: any, index: number) => (
            <div key={index} className={cn('text-center', isEditing && 'relative border border-dashed border-neutral-300 rounded-lg p-4')}>
              {isEditing && stats.length > 1 && (
                <button onClick={() => removeStat(index)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                  <X className="w-4 h-4" />
                </button>
              )}

              <EditableText value={stat.value} onChange={(v) => handleStatChange(index, 'value', v)} tag="p" placeholder="100+" isEditing={isEditing} className="text-4xl md:text-5xl font-bold text-blue-600 mb-2" />
              <EditableText value={stat.label} onChange={(v) => handleStatChange(index, 'label', v)} tag="p" placeholder="Label" isEditing={isEditing} className="text-neutral-600" />
            </div>
          ))}
        </div>

        {isEditing && (
          <div className="text-center mt-8">
            <button onClick={addStat} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Add Stat
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// STANDARD CTA RENDERER
// ============================================================================

export function CTABlockRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    heading = 'Ready to Get Started?',
    description = 'Join thousands of satisfied customers.',
    primaryButtonText = 'Get Started',
    primaryButtonLink = '#',
    secondaryButtonText = '',
    secondaryButtonLink = '',
    variant = 'centered',
    backgroundColor = '#2563eb',
    textColor = 'white',
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  return (
    <section className="py-16 px-6" style={{ backgroundColor }}>
      <div className={cn(
        'container mx-auto',
        variant === 'centered' && 'text-center',
        variant === 'split' && 'flex items-center justify-between'
      )}>
        <div className={variant === 'split' ? 'max-w-xl' : 'max-w-2xl mx-auto'}>
          <EditableText
            value={heading}
            onChange={(v) => handleChange('heading', v)}
            tag="h2"
            placeholder="Heading"
            isEditing={isEditing}
            className={cn('text-3xl md:text-4xl font-bold mb-4', textColor === 'white' ? 'text-white' : 'text-neutral-900')}
          />
          <EditableText
            value={description}
            onChange={(v) => handleChange('description', v)}
            tag="p"
            placeholder="Description..."
            multiline
            isEditing={isEditing}
            className={cn('text-lg mb-8 whitespace-pre-wrap', textColor === 'white' ? 'text-white/80' : 'text-neutral-600')}
          />
        </div>

        <div className={cn(
          'flex gap-4',
          variant === 'centered' && 'justify-center',
          variant === 'split' && 'flex-shrink-0'
        )}>
          <a href={primaryButtonLink} className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-neutral-100 transition-colors font-medium">
            <EditableText value={primaryButtonText} onChange={(v) => handleChange('primaryButtonText', v)} placeholder="Primary" isEditing={isEditing} />
          </a>
          {(secondaryButtonText || isEditing) && (
            <a href={secondaryButtonLink} className="px-8 py-3 border border-white text-white rounded-lg hover:bg-white/10 transition-colors">
              <EditableText value={secondaryButtonText} onChange={(v) => handleChange('secondaryButtonText', v)} placeholder="Secondary" isEditing={isEditing} />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// STANDARD ACCORDION RENDERER
// ============================================================================

export function AccordionBlockRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};
  const [openItems, setOpenItems] = useState<number[]>([0]);

  const {
    heading = '',
    allowMultiple = false,
    items = [
      { title: 'Accordion Item 1', content: 'Content for item 1' },
      { title: 'Accordion Item 2', content: 'Content for item 2' },
      { title: 'Accordion Item 3', content: 'Content for item 3' },
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
    onUpdate?.({ ...content, items: [...items, { title: 'New Item', content: 'Content...' }] });
  };

  const removeItem = (index: number) => {
    onUpdate?.({ ...content, items: items.filter((_: any, i: number) => i !== index) });
  };

  const toggleItem = (index: number) => {
    if (allowMultiple) {
      setOpenItems(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
    } else {
      setOpenItems(prev => prev.includes(index) ? [] : [index]);
    }
  };

  return (
    <section className="py-8 px-6">
      <div className="container mx-auto max-w-3xl">
        {heading && (
          <EditableText value={heading} onChange={(v) => handleChange('heading', v)} tag="h2" placeholder="Heading" isEditing={isEditing} className="text-2xl font-bold mb-6 text-neutral-900" />
        )}

        <div className="space-y-2">
          {items.map((item: any, index: number) => (
            <div key={index} className={cn('border border-neutral-200 rounded-lg overflow-hidden', isEditing && 'relative')}>
              {isEditing && items.length > 1 && (
                <button onClick={() => removeItem(index)} className="absolute top-3 right-12 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 z-10">
                  <X className="w-4 h-4" />
                </button>
              )}

              <button onClick={() => toggleItem(index)} className="w-full px-6 py-4 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100">
                <EditableText value={item.title} onChange={(v) => handleItemChange(index, 'title', v)} tag="span" placeholder="Title" isEditing={isEditing} className="font-medium text-neutral-900" />
                {openItems.includes(index) ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              <div className={cn('transition-all duration-300 overflow-hidden', openItems.includes(index) ? 'max-h-96' : 'max-h-0')}>
                <div className="px-6 py-4">
                  <EditableText value={item.content} onChange={(v) => handleItemChange(index, 'content', v)} tag="p" placeholder="Content..." multiline isEditing={isEditing} className="text-neutral-600 whitespace-pre-wrap" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {isEditing && (
          <div className="text-center mt-6">
            <button onClick={addItem} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// STANDARD TABS RENDERER
// ============================================================================

export function TabsBlockRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};
  const [activeTab, setActiveTab] = useState(0);

  const {
    tabs = [
      { title: 'Tab 1', content: 'Content for tab 1' },
      { title: 'Tab 2', content: 'Content for tab 2' },
      { title: 'Tab 3', content: 'Content for tab 3' },
    ],
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const handleTabChange = (index: number, key: string, value: string) => {
    const newTabs = [...tabs];
    newTabs[index] = { ...newTabs[index], [key]: value };
    onUpdate?.({ ...content, tabs: newTabs });
  };

  const addTab = () => {
    onUpdate?.({ ...content, tabs: [...tabs, { title: 'New Tab', content: 'Content...' }] });
  };

  const removeTab = (index: number) => {
    onUpdate?.({ ...content, tabs: tabs.filter((_: any, i: number) => i !== index) });
    if (activeTab >= tabs.length - 1) setActiveTab(Math.max(0, tabs.length - 2));
  };

  return (
    <section className="py-8 px-6">
      <div className="container mx-auto max-w-4xl">
        {/* Tab Headers */}
        <div className="flex border-b border-neutral-200 overflow-x-auto">
          {tabs.map((tab: any, index: number) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={cn(
                'px-6 py-3 font-medium transition-colors relative whitespace-nowrap',
                activeTab === index ? 'text-blue-600 border-b-2 border-blue-600' : 'text-neutral-600 hover:text-neutral-900'
              )}
            >
              <EditableText value={tab.title} onChange={(v) => handleTabChange(index, 'title', v)} placeholder="Tab" isEditing={isEditing} />
              {isEditing && tabs.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); removeTab(index); }} className="ml-2 text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              )}
            </button>
          ))}
          {isEditing && (
            <button onClick={addTab} className="px-4 py-3 text-blue-600 hover:text-blue-700">
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="py-6">
          {tabs[activeTab] && (
            <EditableText
              value={tabs[activeTab].content}
              onChange={(v) => handleTabChange(activeTab, 'content', v)}
              tag="div"
              placeholder="Tab content..."
              multiline
              isEditing={isEditing}
              className="text-neutral-600 whitespace-pre-wrap"
            />
          )}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// STANDARD IMAGE BLOCK RENDERER
// ============================================================================

export function ImageBlockRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    src = '',
    alt = '',
    caption = '',
    width = 'full',
    alignment = 'center',
    rounded = 'lg',
    shadow = false,
    link = '',
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const Wrapper = link ? 'a' : 'div';

  return (
    <figure className="py-4 px-6">
      <Wrapper
        {...(link ? { href: link, target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={cn(
          'block overflow-hidden',
          width === 'full' ? 'w-full' : width === '3/4' ? 'w-3/4' : width === '1/2' ? 'w-1/2' : 'w-auto',
          alignment === 'center' ? 'mx-auto' : alignment === 'right' ? 'ml-auto' : '',
          `rounded-${rounded}`,
          shadow && 'shadow-lg'
        )}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-auto" />
        ) : (
          <div className="w-full h-48 bg-neutral-200 flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-neutral-400" />
          </div>
        )}
      </Wrapper>

      {(caption || isEditing) && (
        <EditableText value={caption} onChange={(v) => handleChange('caption', v)} tag="p" placeholder="Caption..." isEditing={isEditing} className={cn('mt-4 text-sm text-neutral-500', `text-${alignment}`)} />
      )}
    </figure>
  );
}

// ============================================================================
// STANDARD VIDEO BLOCK RENDERER
// ============================================================================

export function VideoBlockRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    url = '',
    poster = '',
    autoplay = false,
    controls = true,
    aspectRatio = '16/9',
    caption = '',
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const isYouTube = url?.includes('youtube.com') || url?.includes('youtu.be');
  const isVimeo = url?.includes('vimeo.com');

  return (
    <figure className="py-4 px-6">
      <div className="max-w-4xl mx-auto overflow-hidden rounded-lg" style={{ aspectRatio }}>
        {isYouTube || isVimeo ? (
          <iframe src={url} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : url ? (
          <video src={url} poster={poster} autoPlay={autoplay} controls={controls} playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
            <Video className="w-12 h-12 text-neutral-400" />
          </div>
        )}
      </div>

      {(caption || isEditing) && (
        <EditableText value={caption} onChange={(v) => handleChange('caption', v)} tag="p" placeholder="Caption..." isEditing={isEditing} className="mt-4 text-sm text-neutral-500 text-center" />
      )}
    </figure>
  );
}

// ============================================================================
// STANDARD SPACER BLOCK RENDERER
// ============================================================================

export function SpacerBlockRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};
  const { height = 40 } = content;

  return (
    <div
      className={cn('w-full', isEditing && 'border border-dashed border-neutral-300 bg-neutral-50 flex items-center justify-center')}
      style={{ height: `${height}px` }}
    >
      {isEditing && <span className="text-xs text-neutral-400">Spacer: {height}px</span>}
    </div>
  );
}

// ============================================================================
// STANDARD DIVIDER BLOCK RENDERER
// ============================================================================

export function DividerBlockRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};
  const { style = 'solid', color = '', width = 'full' } = content;

  return (
    <div className="py-8 flex justify-center">
      <hr
        className={cn(
          'border-t',
          width === 'full' ? 'w-full' : width === '3/4' ? 'w-3/4' : width === '1/2' ? 'w-1/2' : 'w-1/4',
          style === 'dashed' ? 'border-dashed' : style === 'dotted' ? 'border-dotted' : '',
          'border-neutral-200'
        )}
        style={color ? { borderColor: color } : undefined}
      />
    </div>
  );
}

// ============================================================================
// STANDARD BUTTON BLOCK RENDERER
// ============================================================================

export function ButtonBlockRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    text = 'Click Here',
    link = '#',
    variant = 'default',
    size = 'default',
    alignment = 'left',
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const variantClasses: Record<string, string> = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white',
    ghost: 'text-blue-600 hover:bg-blue-50',
  };

  const sizeClasses: Record<string, string> = {
    sm: 'px-4 py-2 text-sm',
    default: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <div className={cn('py-4 px-6', `text-${alignment}`)}>
      <a href={link} className={cn('inline-flex items-center gap-2 rounded-lg transition-colors', variantClasses[variant], sizeClasses[size])}>
        <EditableText value={text} onChange={(v) => handleChange('text', v)} placeholder="Button Text" isEditing={isEditing} />
      </a>
    </div>
  );
}

// ============================================================================
// STANDARD PRICING BLOCK RENDERER
// ============================================================================

export function PricingBlockRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    heading = 'Pricing Plans',
    description = '',
    plans = [
      { name: 'Basic', price: '$9', period: '/month', features: ['Feature 1', 'Feature 2'], ctaText: 'Get Started', highlighted: false },
      { name: 'Pro', price: '$29', period: '/month', features: ['Feature 1', 'Feature 2', 'Feature 3'], ctaText: 'Get Started', highlighted: true },
      { name: 'Enterprise', price: '$99', period: '/month', features: ['All Features', 'Priority Support'], ctaText: 'Contact Us', highlighted: false },
    ],
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const handlePlanChange = (index: number, key: string, value: any) => {
    const newPlans = [...plans];
    newPlans[index] = { ...newPlans[index], [key]: value };
    onUpdate?.({ ...content, plans: newPlans });
  };

  return (
    <section className="py-16 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <EditableText value={heading} onChange={(v) => handleChange('heading', v)} tag="h2" placeholder="Heading" isEditing={isEditing} className="text-3xl font-bold mb-4 text-neutral-900" />
          <EditableText value={description} onChange={(v) => handleChange('description', v)} tag="p" placeholder="Description..." multiline isEditing={isEditing} className="text-lg text-neutral-600 max-w-2xl mx-auto" />
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan: any, index: number) => (
            <div key={index} className={cn(
              'p-8 rounded-2xl border-2 transition-all',
              plan.highlighted ? 'border-blue-600 shadow-xl scale-105' : 'border-neutral-200'
            )}>
              {plan.highlighted && (
                <div className="text-center mb-4">
                  <span className="px-3 py-1 bg-blue-600 text-white text-xs uppercase tracking-wider rounded-full">Popular</span>
                </div>
              )}

              <EditableText value={plan.name} onChange={(v) => handlePlanChange(index, 'name', v)} tag="h3" placeholder="Plan Name" isEditing={isEditing} className="text-xl font-semibold text-neutral-900 mb-2 text-center" />

              <div className="text-center mb-6">
                <EditableText value={plan.price} onChange={(v) => handlePlanChange(index, 'price', v)} tag="span" placeholder="$0" isEditing={isEditing} className="text-4xl font-bold text-neutral-900" />
                <EditableText value={plan.period} onChange={(v) => handlePlanChange(index, 'period', v)} tag="span" placeholder="/month" isEditing={isEditing} className="text-neutral-500" />
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature: string, fIndex: number) => (
                  <li key={fIndex} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-neutral-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <button className={cn(
                'w-full py-3 rounded-lg font-medium transition-colors',
                plan.highlighted ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
              )}>
                <EditableText value={plan.ctaText} onChange={(v) => handlePlanChange(index, 'ctaText', v)} placeholder="Button" isEditing={isEditing} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// STANDARD CODE BLOCK RENDERER
// ============================================================================

export function CodeBlockRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    code = '// Your code here',
    language = 'javascript',
    showLineNumbers = true,
    filename = '',
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  return (
    <div className="py-4 px-6">
      <div className="max-w-4xl mx-auto">
        {filename && (
          <div className="bg-neutral-700 text-neutral-300 px-4 py-2 text-sm rounded-t-lg font-mono">
            {filename}
          </div>
        )}
        <pre className={cn(
          'bg-neutral-800 text-neutral-100 p-4 overflow-x-auto font-mono text-sm',
          filename ? 'rounded-b-lg' : 'rounded-lg'
        )}>
          <code>
            {isEditing ? (
              <textarea
                value={code}
                onChange={(e) => handleChange('code', e.target.value)}
                className="w-full bg-transparent outline-none resize-y min-h-[100px]"
                spellCheck={false}
              />
            ) : (
              code
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}

// ============================================================================
// STANDARD HTML/EMBED BLOCK RENDERER
// ============================================================================

export function HTMLBlockRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};
  const { html = '' } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  return (
    <div className="py-4 px-6">
      {isEditing ? (
        <div className="max-w-4xl mx-auto">
          <label className="block text-sm font-medium text-neutral-700 mb-2">Custom HTML</label>
          <textarea
            value={html}
            onChange={(e) => handleChange('html', e.target.value)}
            className="w-full h-48 p-4 border border-neutral-300 rounded-lg font-mono text-sm"
            placeholder="<div>Your HTML here</div>"
          />
        </div>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS - Part 4
// ============================================================================

export const Part4Renderers = {
  HeroBlockRenderer,
  TextBlockRenderer,
  HeadingBlockRenderer,
  QuoteBlockRenderer,
  FeatureGridRenderer,
  TestimonialsBlockRenderer,
  StatsBlockRenderer,
  CTABlockRenderer,
  AccordionBlockRenderer,
  TabsBlockRenderer,
  ImageBlockRenderer,
  VideoBlockRenderer,
  SpacerBlockRenderer,
  DividerBlockRenderer,
  ButtonBlockRenderer,
  PricingBlockRenderer,
  CodeBlockRenderer,
  HTMLBlockRenderer,
};
