/**
 * Just Empower - COMPLETE Block Renderers with Full Editability
 * 
 * PART 3: JE Interactive & Layout Blocks
 * - JE Newsletter
 * - JE Contact Form
 * - JE FAQ
 * - JE Testimonial
 * - JE Testimonials Grid
 * - JE Button
 * - JE Divider
 * - JE Spacer
 * - JE Two Column
 * - JE Gallery
 * - JE Calendar
 * - JE Footer
 * 
 * @version 3.0 - COMPLETE
 * @date January 2026
 */

import React, { useState } from 'react';
import {
  ChevronDown, ChevronUp, Plus, X, Star, Mail, Phone, MapPin,
  Calendar, Clock, ArrowRight, Quote, Image as ImageIcon,
  Instagram, Facebook, Twitter, Linkedin, Youtube, Send,
  Check, ChevronLeft, ChevronRight, ExternalLink, Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditableText, getIcon, buildTextStyle, SECTION_PADDING_PRESETS, TITLE_SIZE_PRESETS, BODY_SIZE_PRESETS, GAP_PRESETS } from './BlockRenderers-Part1-Core';
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
// JE NEWSLETTER RENDERER
// ============================================================================

export function JENewsletterRenderer({ block, isEditing, isElementEditMode = false, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    title = 'Stay Connected',
    description = 'Subscribe to receive updates, inspiration, and exclusive content.',
    placeholder = 'Enter your email',
    buttonText = 'Subscribe',
    successMessage = 'Thank you for subscribing!',
    backgroundColor = '',
    dark = false,
    variant = 'elegant',
    alignment = 'center',
    // Sizing controls
    sectionPadding = 'spacious',
    titleSize = 'large',
    descriptionSize = 'medium',
    maxWidth = 'max-w-3xl',
    elementTransforms = {},
  } = content;

  // Transform persistence handlers
  const handleTransformChange = (elementId: string, transform: { x?: number; y?: number; width?: number; height?: number; rotate?: number }) => {
    onUpdate?.({ ...content, elementTransforms: { ...elementTransforms, [elementId]: transform } });
  };
  const getElementTransform = (elementId: string) => elementTransforms[elementId];

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  // Get sizing classes
  const getPaddingClass = () => SECTION_PADDING_PRESETS[sectionPadding as keyof typeof SECTION_PADDING_PRESETS] || SECTION_PADDING_PRESETS.spacious;
  const getTitleClass = () => TITLE_SIZE_PRESETS[titleSize as keyof typeof TITLE_SIZE_PRESETS] || TITLE_SIZE_PRESETS.large;
  const getDescriptionClass = () => BODY_SIZE_PRESETS[descriptionSize as keyof typeof BODY_SIZE_PRESETS] || BODY_SIZE_PRESETS.medium;

  const alignmentClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <section
      className={cn(
        getPaddingClass(),
        'overflow-hidden',
        dark ? 'bg-[#1a1a1a]' : 'bg-[#faf9f7]'
      )}
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <div className={cn(
        'mx-auto px-6 md:px-12 relative',
        maxWidth,
        alignmentClasses[alignment]
      )}>
        {isElementEditMode ? (
          <MoveableElement
            elementId="title"
            elementType="text"
            initialTransform={getElementTransform('title')}
            onTransformChange={handleTransformChange}
          >
            <EditableText
              value={title}
              onChange={(v) => handleChange('title', v)}
              tag="h2"
              placeholder="Newsletter Title"
              isEditing={isEditing}
              className={cn(
                getTitleClass(),
                'font-serif italic font-light leading-[1.1] tracking-tight mb-6',
                dark ? 'text-white' : 'text-foreground'
              )}
            />
          </MoveableElement>
        ) : (
          <EditableText
            value={title}
            onChange={(v) => handleChange('title', v)}
            tag="h2"
            placeholder="Newsletter Title"
            isEditing={isEditing}
            className={cn(
              getTitleClass(),
              'font-serif italic font-light leading-[1.1] tracking-tight mb-6',
              dark ? 'text-white' : 'text-foreground'
            )}
          />
        )}

        {isElementEditMode ? (
          <MoveableElement
            elementId="description"
            elementType="text"
            initialTransform={getElementTransform('description')}
            onTransformChange={handleTransformChange}
          >
          <EditableText
            value={description}
            onChange={(v) => handleChange('description', v)}
            tag="p"
            placeholder="Description..."
            multiline
            isEditing={isEditing}
            className={cn(
              'text-lg font-sans mb-8 whitespace-pre-wrap',
              dark ? 'text-neutral-300' : 'text-neutral-600'
            )}
          />
        </MoveableElement>
        ) : (
          <EditableText
            value={description}
            onChange={(v) => handleChange('description', v)}
            tag="p"
            placeholder="Description..."
            multiline
            isEditing={isEditing}
            className={cn(
              'text-lg font-sans mb-8 whitespace-pre-wrap',
              dark ? 'text-neutral-300' : 'text-neutral-600'
            )}
          />
        )}

        {/* Form */}
        <form className={cn(
          'flex gap-2',
          alignment === 'center' && 'justify-center',
          alignment === 'right' && 'justify-end',
          variant === 'stacked' && 'flex-col'
        )}>
          <input
            type="email"
            placeholder={placeholder}
            className={cn(
              'px-4 py-3 rounded-lg border transition-colors',
              variant === 'stacked' ? 'w-full' : 'flex-1 max-w-sm',
              dark
                ? 'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500'
                : 'bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400',
              'focus:outline-none focus:ring-2 focus:ring-amber-500/50'
            )}
          />
          <button
            type="submit"
            className={cn(
              'px-6 py-3 rounded-lg font-sans text-sm uppercase tracking-wider transition-colors',
              'bg-amber-500 text-white hover:bg-amber-600',
              variant === 'stacked' && 'w-full'
            )}
          >
            <EditableText
              value={buttonText}
              onChange={(v) => handleChange('buttonText', v)}
              placeholder="Subscribe"
              isEditing={isEditing}
            />
          </button>
        </form>

        <p className={cn(
          'mt-4 text-xs',
          dark ? 'text-neutral-500' : 'text-neutral-400'
        )}>
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </section>
  );
}

// ============================================================================
// JE CONTACT FORM RENDERER
// ============================================================================

export function JEContactFormRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    title = 'Get in Touch',
    description = 'We\'d love to hear from you.',
    submitText = 'Send Message',
    successMessage = 'Thank you! We\'ll be in touch soon.',
    dark = false,
    fields = [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Your name' },
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'your@email.com' },
      { name: 'subject', label: 'Subject', type: 'text', required: false, placeholder: 'Subject' },
      { name: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'Your message...' },
    ],
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const handleFieldChange = (index: number, key: string, value: any) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    onUpdate?.({ ...content, fields: newFields });
  };

  const addField = () => {
    onUpdate?.({ ...content, fields: [...fields, { name: 'field', label: 'New Field', type: 'text', required: false, placeholder: '' }] });
  };

  const removeField = (index: number) => {
    onUpdate?.({ ...content, fields: fields.filter((_: any, i: number) => i !== index) });
  };

  return (
    <section className={cn('py-16 md:py-24', dark ? 'bg-neutral-900' : 'bg-white')}>
      <div className="container mx-auto px-6 max-w-2xl">
        <div className="text-center mb-12">
          <EditableText
            value={title}
            onChange={(v) => handleChange('title', v)}
            tag="h2"
            placeholder="Form Title"
            isEditing={isEditing}
            className={cn('text-3xl md:text-4xl font-serif italic mb-4', dark ? 'text-white' : 'text-neutral-900')}
          />
          <EditableText
            value={description}
            onChange={(v) => handleChange('description', v)}
            tag="p"
            placeholder="Description..."
            multiline
            isEditing={isEditing}
            className={cn('text-lg font-sans whitespace-pre-wrap', dark ? 'text-neutral-300' : 'text-neutral-600')}
          />
        </div>

        <form className="space-y-6">
          {fields.map((field: any, index: number) => (
            <div key={index} className={cn('relative', isEditing && 'border border-dashed border-neutral-300 p-3 rounded-lg')}>
              {isEditing && fields.length > 1 && (
                <button
                  onClick={() => removeField(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 z-10"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <label className={cn('block text-sm font-sans mb-2', dark ? 'text-neutral-300' : 'text-neutral-700')}>
                <EditableText
                  value={field.label}
                  onChange={(v) => handleFieldChange(index, 'label', v)}
                  placeholder="Field Label"
                  isEditing={isEditing}
                />
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  placeholder={field.placeholder}
                  rows={5}
                  className={cn(
                    'w-full px-4 py-3 rounded-lg border transition-colors',
                    dark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900',
                    'focus:outline-none focus:ring-2 focus:ring-amber-500/50'
                  )}
                />
              ) : (
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  className={cn(
                    'w-full px-4 py-3 rounded-lg border transition-colors',
                    dark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900',
                    'focus:outline-none focus:ring-2 focus:ring-amber-500/50'
                  )}
                />
              )}
            </div>
          ))}

          {isEditing && (
            <button onClick={addField} type="button" className="text-amber-600 text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Field
            </button>
          )}

          <button
            type="submit"
            className="w-full px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-sans uppercase tracking-wider text-sm"
          >
            <EditableText
              value={submitText}
              onChange={(v) => handleChange('submitText', v)}
              placeholder="Submit"
              isEditing={isEditing}
            />
          </button>
        </form>
      </div>
    </section>
  );
}

// ============================================================================
// JE FAQ RENDERER
// ============================================================================

export function JEFAQRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};
  const [openItems, setOpenItems] = useState<number[]>([]);

  const {
    label = '',
    title = 'Frequently Asked Questions',
    description = '',
    dark = false,
    variant = 'elegant',
    allowMultiple = false,
    items = [
      { question: 'What is your return policy?', answer: 'We offer a 30-day return policy on all items.' },
      { question: 'How long does shipping take?', answer: 'Standard shipping takes 5-7 business days.' },
      { question: 'Do you offer international shipping?', answer: 'Yes, we ship to over 100 countries worldwide.' },
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
    onUpdate?.({ ...content, items: [...items, { question: 'New Question?', answer: 'Answer here...' }] });
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
    <section className={cn('py-16 md:py-24', dark ? 'bg-neutral-900' : 'bg-white')}>
      <div className="container mx-auto px-6 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <EditableText value={label} onChange={(v) => handleChange('label', v)} tag="p" placeholder="LABEL" isEditing={isEditing} className={cn('text-xs uppercase tracking-[0.3em] mb-4 font-sans', dark ? 'text-amber-400' : 'text-amber-600')} />
          <EditableText value={title} onChange={(v) => handleChange('title', v)} tag="h2" placeholder="FAQ Title" isEditing={isEditing} className={cn('text-3xl md:text-4xl font-serif italic mb-4', dark ? 'text-white' : 'text-neutral-900')} />
          <EditableText value={description} onChange={(v) => handleChange('description', v)} tag="p" placeholder="Description..." multiline isEditing={isEditing} className={cn('text-lg font-sans whitespace-pre-wrap', dark ? 'text-neutral-300' : 'text-neutral-600')} />
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {items.map((item: any, index: number) => (
            <div
              key={index}
              className={cn(
                'border rounded-lg overflow-hidden',
                dark ? 'border-neutral-700' : 'border-neutral-200',
                isEditing && 'relative'
              )}
            >
              {isEditing && items.length > 1 && (
                <button
                  onClick={() => removeItem(index)}
                  className="absolute top-2 right-12 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Question */}
              <button
                onClick={() => toggleItem(index)}
                className={cn(
                  'w-full px-6 py-4 flex items-center justify-between text-left',
                  dark ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-neutral-50 hover:bg-neutral-100'
                )}
              >
                <EditableText
                  value={item.question}
                  onChange={(v) => handleItemChange(index, 'question', v)}
                  tag="span"
                  placeholder="Question?"
                  isEditing={isEditing}
                  className={cn('text-lg font-sans', dark ? 'text-white' : 'text-neutral-900')}
                />
                {openItems.includes(index) ? (
                  <ChevronUp className={cn('w-5 h-5 flex-shrink-0', dark ? 'text-neutral-400' : 'text-neutral-500')} />
                ) : (
                  <ChevronDown className={cn('w-5 h-5 flex-shrink-0', dark ? 'text-neutral-400' : 'text-neutral-500')} />
                )}
              </button>

              {/* Answer */}
              <div className={cn(
                'overflow-hidden transition-all duration-300',
                openItems.includes(index) ? 'max-h-96' : 'max-h-0'
              )}>
                <div className={cn('px-6 py-4', dark ? 'bg-neutral-800/50' : 'bg-white')}>
                  <EditableText
                    value={item.answer}
                    onChange={(v) => handleItemChange(index, 'answer', v)}
                    tag="p"
                    placeholder="Answer..."
                    multiline
                    isEditing={isEditing}
                    className={cn('text-base font-sans whitespace-pre-wrap', dark ? 'text-neutral-300' : 'text-neutral-600')}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {isEditing && (
          <div className="text-center mt-8">
            <button onClick={addItem} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// JE TESTIMONIAL RENDERER (Single)
// ============================================================================

export function JETestimonialRenderer({ block, isEditing, isElementEditMode = false, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    quote = 'This has been a transformative experience.',
    author = 'Jane Doe',
    role = 'Client',
    imageUrl = '',
    rating = 5,
    variant = 'card',
    dark = false,
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  return (
    <div className={cn(
      'p-8 rounded-lg',
      variant === 'card' && (dark ? 'bg-neutral-800' : 'bg-white shadow-lg'),
      variant === 'minimal' && 'text-center'
    )}>
      {/* Stars */}
      {rating > 0 && (
        <div className={cn('flex gap-1 mb-4', variant === 'minimal' && 'justify-center')}>
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                'w-5 h-5',
                i < rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-300'
              )}
            />
          ))}
        </div>
      )}

      {/* Quote */}
      <EditableElement
        elementId="quote"
        elementType="text"
        isEditing={isElementEditMode}
        className="block"
      >
        <EditableText
          value={quote}
          onChange={(v) => handleChange('quote', v)}
          tag="p"
          placeholder="Testimonial quote..."
          multiline
          isEditing={isEditing}
          className={cn(
            'text-lg md:text-xl font-serif italic leading-relaxed mb-6 whitespace-pre-wrap',
            dark ? 'text-white' : 'text-neutral-800'
          )}
        />
      </EditableElement>

      {/* Author */}
      <div className={cn('flex items-center gap-4', variant === 'minimal' && 'justify-center')}>
        {imageUrl && (
          <EditableElement
            elementId="author-image"
            elementType="image"
            isEditing={isElementEditMode}
            className="inline-block"
          >
            <img src={imageUrl} alt={author} className="w-12 h-12 rounded-full object-cover" />
          </EditableElement>
        )}
        <div>
          <EditableElement
            elementId="author-name"
            elementType="text"
            isEditing={isElementEditMode}
            className="block"
          >
            <EditableText
              value={author}
              onChange={(v) => handleChange('author', v)}
              tag="p"
              placeholder="Author Name"
              isEditing={isEditing}
              className={cn('font-sans font-medium', dark ? 'text-white' : 'text-neutral-900')}
            />
          </EditableElement>
          <EditableElement
            elementId="author-role"
            elementType="text"
            isEditing={isElementEditMode}
            className="block"
          >
            <EditableText
              value={role}
              onChange={(v) => handleChange('role', v)}
              tag="p"
              placeholder="Role/Title"
              isEditing={isEditing}
              className={cn('text-sm font-sans', dark ? 'text-neutral-400' : 'text-neutral-500')}
            />
          </EditableElement>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// JE TESTIMONIALS GRID RENDERER
// ============================================================================

export function JETestimonialsGridRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    label = '',
    title = 'What People Say',
    description = '',
    columns = 3,
    dark = false,
    testimonials = [
      { quote: 'Amazing experience!', author: 'Jane D.', role: 'Client', imageUrl: '', rating: 5 },
      { quote: 'Truly transformative.', author: 'John S.', role: 'Member', imageUrl: '', rating: 5 },
      { quote: 'Highly recommend!', author: 'Sarah M.', role: 'Student', imageUrl: '', rating: 5 },
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
    onUpdate?.({ ...content, testimonials: [...testimonials, { quote: 'New testimonial...', author: 'Name', role: 'Role', imageUrl: '', rating: 5 }] });
  };

  const removeTestimonial = (index: number) => {
    onUpdate?.({ ...content, testimonials: testimonials.filter((_: any, i: number) => i !== index) });
  };

  return (
    <section className={cn('py-16 md:py-24', dark ? 'bg-neutral-900' : 'bg-neutral-50')}>
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <EditableText value={label} onChange={(v) => handleChange('label', v)} tag="p" placeholder="LABEL" isEditing={isEditing} className={cn('text-xs uppercase tracking-[0.3em] mb-4 font-sans', dark ? 'text-amber-400' : 'text-amber-600')} />
          <EditableText value={title} onChange={(v) => handleChange('title', v)} tag="h2" placeholder="Title" isEditing={isEditing} className={cn('text-3xl md:text-4xl font-serif italic mb-4', dark ? 'text-white' : 'text-neutral-900')} />
          <EditableText value={description} onChange={(v) => handleChange('description', v)} tag="p" placeholder="Description..." multiline isEditing={isEditing} className={cn('text-lg font-sans whitespace-pre-wrap', dark ? 'text-neutral-300' : 'text-neutral-600')} />
        </div>

        {/* Grid */}
        <div className={cn(
          'grid gap-6',
          columns === 2 ? 'grid-cols-1 md:grid-cols-2' :
          columns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
          'grid-cols-1 md:grid-cols-2'
        )}>
          {testimonials.map((t: any, index: number) => (
            <div key={index} className={cn('relative', isEditing && 'border border-dashed border-neutral-300 rounded-lg')}>
              {isEditing && testimonials.length > 1 && (
                <button onClick={() => removeTestimonial(index)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 z-10">
                  <X className="w-4 h-4" />
                </button>
              )}

              <div className={cn('p-6 rounded-lg h-full', dark ? 'bg-neutral-800' : 'bg-white shadow-sm')}>
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={cn('w-4 h-4', i < t.rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-300')} />
                  ))}
                </div>

                <EditableText value={t.quote} onChange={(v) => handleTestimonialChange(index, 'quote', v)} tag="p" placeholder="Quote..." multiline isEditing={isEditing} className={cn('text-base font-sans mb-4 whitespace-pre-wrap', dark ? 'text-neutral-300' : 'text-neutral-600')} />

                <div className="flex items-center gap-3">
                  {t.imageUrl && <img src={t.imageUrl} alt="Avatar" loading="lazy" className="w-10 h-10 rounded-full object-cover" />}
                  <div>
                    <EditableText value={t.author} onChange={(v) => handleTestimonialChange(index, 'author', v)} tag="p" placeholder="Name" isEditing={isEditing} className={cn('text-sm font-medium', dark ? 'text-white' : 'text-neutral-900')} />
                    <EditableText value={t.role} onChange={(v) => handleTestimonialChange(index, 'role', v)} tag="p" placeholder="Role" isEditing={isEditing} className={cn('text-xs', dark ? 'text-neutral-400' : 'text-neutral-500')} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {isEditing && (
          <div className="text-center mt-8">
            <button onClick={addTestimonial} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
              <Plus className="w-4 h-4" /> Add Testimonial
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// JE BUTTON RENDERER
// ============================================================================

export function JEButtonRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    text = 'Click Here',
    link = '#',
    variant = 'primary',
    size = 'default',
    fullWidth = false,
    icon = '',
    iconPosition = 'right',
    alignment = 'center',
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const variantClasses: Record<string, string> = {
    primary: 'bg-amber-500 text-white hover:bg-amber-600 border-amber-500',
    secondary: 'bg-transparent text-neutral-900 border-neutral-900 hover:bg-neutral-900 hover:text-white',
    ghost: 'bg-transparent text-amber-600 hover:text-amber-700 border-transparent',
    elegant: 'bg-transparent text-neutral-800 border-2 border-neutral-800 hover:bg-neutral-800 hover:text-white font-serif italic',
  };

  const sizeClasses: Record<string, string> = {
    sm: 'px-4 py-2 text-sm',
    default: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const alignmentClasses: Record<string, string> = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  const IconComponent = icon ? getIcon(icon) : null;

  return (
    <div className={cn('py-4 px-6 flex', alignmentClasses[alignment])}>
      <a
        href={link}
        className={cn(
          'inline-flex items-center gap-2 border rounded-lg uppercase tracking-wider transition-all duration-300',
          variantClasses[variant] || variantClasses.primary,
          sizeClasses[size] || sizeClasses.default,
          fullWidth && 'w-full justify-center'
        )}
      >
        {IconComponent && iconPosition === 'left' && <IconComponent className="w-4 h-4" />}
        <EditableText
          value={text}
          onChange={(v) => handleChange('text', v)}
          placeholder="Button Text"
          isEditing={isEditing}
        />
        {IconComponent && iconPosition === 'right' && <IconComponent className="w-4 h-4" />}
        {!IconComponent && <ArrowRight className="w-4 h-4" />}
      </a>
    </div>
  );
}

// ============================================================================
// JE DIVIDER RENDERER
// ============================================================================

export function JEDividerRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    variant = 'line',
    color = '',
    width = 'full',
    spacing = 'medium',
  } = content;

  const spacingClasses: Record<string, string> = {
    small: 'py-4',
    medium: 'py-8',
    large: 'py-12',
  };

  const widthClasses: Record<string, string> = {
    full: 'w-full',
    '3/4': 'w-3/4',
    '1/2': 'w-1/2',
    '1/4': 'w-1/4',
  };

  return (
    <div className={cn('flex justify-center', spacingClasses[spacing])}>
      {variant === 'line' && (
        <hr
          className={cn('border-t border-neutral-200', widthClasses[width])}
          style={color ? { borderColor: color } : undefined}
        />
      )}

      {variant === 'dots' && (
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <div className="w-2 h-2 rounded-full bg-amber-500" />
        </div>
      )}

      {variant === 'ornament' && (
        <div className="flex items-center gap-4">
          <div className="h-px w-16 bg-neutral-300" />
          <div className="text-2xl text-amber-500">✦</div>
          <div className="h-px w-16 bg-neutral-300" />
        </div>
      )}

      {variant === 'gradient' && (
        <div
          className={cn('h-px', widthClasses[width])}
          style={{ background: 'linear-gradient(to right, transparent, #d4af37, transparent)' }}
        />
      )}
    </div>
  );
}

// ============================================================================
// JE SPACER RENDERER
// ============================================================================

export function JESpacerRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    height = 40,
    mobileHeight = 20,
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  return (
    <div
      className={cn('w-full', isEditing && 'border border-dashed border-neutral-300 bg-neutral-50 flex items-center justify-center')}
      style={{ height: `${height}px` }}
    >
      {isEditing && (
        <span className="text-xs text-neutral-400">Spacer: {height}px</span>
      )}
    </div>
  );
}

// ============================================================================
// JE TWO COLUMN RENDERER
// ============================================================================

export function JETwoColumnRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    leftContent = '<p>Left column content</p>',
    rightContent = '<p>Right column content</p>',
    ratio = '50-50',
    gap = '8',
    reverseOnMobile = false,
    verticalAlign = 'top',
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const ratioClasses: Record<string, string> = {
    '50-50': 'grid-cols-1 md:grid-cols-2',
    '33-67': 'grid-cols-1 md:grid-cols-3 [&>*:first-child]:md:col-span-1 [&>*:last-child]:md:col-span-2',
    '67-33': 'grid-cols-1 md:grid-cols-3 [&>*:first-child]:md:col-span-2 [&>*:last-child]:md:col-span-1',
    '25-75': 'grid-cols-1 md:grid-cols-4 [&>*:first-child]:md:col-span-1 [&>*:last-child]:md:col-span-3',
    '75-25': 'grid-cols-1 md:grid-cols-4 [&>*:first-child]:md:col-span-3 [&>*:last-child]:md:col-span-1',
  };

  const alignClasses: Record<string, string> = {
    top: 'items-start',
    center: 'items-center',
    bottom: 'items-end',
  };

  return (
    <div className={cn(
      'grid',
      ratioClasses[ratio] || ratioClasses['50-50'],
      `gap-${gap}`,
      alignClasses[verticalAlign],
      reverseOnMobile && 'flex-col-reverse md:flex-row',
      'py-8 px-6'
    )}>
      {/* Left Column */}
      <div className={cn('prose max-w-none', isEditing && 'border border-dashed border-neutral-300 p-4 rounded min-h-[100px]')}>
        <EditableText
          value={leftContent}
          onChange={(v) => handleChange('leftContent', v)}
          tag="div"
          placeholder="Left column content..."
          multiline
          isEditing={isEditing}
          dangerousHtml
          className="whitespace-pre-wrap"
        />
      </div>

      {/* Right Column */}
      <div className={cn('prose max-w-none', isEditing && 'border border-dashed border-neutral-300 p-4 rounded min-h-[100px]')}>
        <EditableText
          value={rightContent}
          onChange={(v) => handleChange('rightContent', v)}
          tag="div"
          placeholder="Right column content..."
          multiline
          isEditing={isEditing}
          dangerousHtml
          className="whitespace-pre-wrap"
        />
      </div>
    </div>
  );
}

// ============================================================================
// JE GALLERY RENDERER
// ============================================================================

export function JEGalleryRenderer({ block, isEditing, isElementEditMode = false, onUpdate }: BlockRendererProps) {
  const content = block.content || {};
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const {
    title = '',
    columns = 3,
    gap = 4,
    variant = 'grid',
    lightbox = true,
    images = [],
  } = content;

  // Ensure images is always an array
  const safeImages = Array.isArray(images) ? images : [];

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const handleImageChange = (index: number, key: string, value: string) => {
    const newImages = [...safeImages];
    newImages[index] = { ...newImages[index], [key]: value };
    onUpdate?.({ ...content, images: newImages });
  };

  const addImage = () => {
    onUpdate?.({ ...content, images: [...safeImages, { url: '', alt: '', caption: '' }] });
  };

  const removeImage = (index: number) => {
    onUpdate?.({ ...content, images: safeImages.filter((_: any, i: number) => i !== index) });
  };

  // Column class mapping (Tailwind needs static classes)
  const columnClasses: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-5',
    6: 'grid-cols-3 md:grid-cols-6',
  };

  // Gap value (use inline style for dynamic gap)
  const gapValue = typeof gap === 'number' ? gap : parseInt(gap) || 4;

  return (
    <section className="py-8 px-6 relative">
      {title && (
        <EditableElement
          elementId="title"
          elementType="text"
          isEditing={isElementEditMode}
          className="block"
        >
          <EditableText value={title} onChange={(v) => handleChange('title', v)} tag="h2" placeholder="Gallery Title" isEditing={isEditing} className="text-2xl font-serif italic mb-6 text-center text-neutral-900" />
        </EditableElement>
      )}

      <div 
        className={cn('grid', columnClasses[columns] || 'grid-cols-2 md:grid-cols-3')}
        style={{ gap: `${gapValue * 4}px` }}
      >
        {safeImages.length === 0 && isEditing ? (
          <div className="col-span-full text-center py-12 border-2 border-dashed border-neutral-300 rounded-lg">
            <ImageIcon className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
            <p className="text-neutral-500 mb-3">No images yet</p>
            <button onClick={addImage} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
              <Plus className="w-4 h-4" /> Add First Image
            </button>
          </div>
        ) : (
          safeImages.map((image: any, index: number) => (
            <div key={index} className={cn('relative group', isEditing && 'border border-dashed border-neutral-300 rounded')}>
              {isEditing && (
                <button onClick={() => removeImage(index)} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 z-10 opacity-0 group-hover:opacity-100">
                  <X className="w-4 h-4" />
                </button>
              )}

              <div
                className="aspect-square overflow-hidden rounded-lg cursor-pointer"
                onClick={() => lightbox && !isEditing && setLightboxIndex(index)}
              >
                {image?.url ? (
                  <img src={image.url} alt={image.alt || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-neutral-400" />
                  </div>
                )}
              </div>

              {image?.caption && (
                <EditableText value={image.caption} onChange={(v) => handleImageChange(index, 'caption', v)} tag="p" placeholder="Caption..." isEditing={isEditing} className="mt-2 text-sm text-neutral-600 text-center" />
              )}
            </div>
          ))
        )}
      </div>

      {isEditing && safeImages.length > 0 && (
        <div className="text-center mt-6">
          <button onClick={addImage} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
            <Plus className="w-4 h-4" /> Add Image
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && safeImages[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxIndex(null)}>
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightboxIndex(null)}>
            <X className="w-8 h-8" />
          </button>
          <button className="absolute left-4 text-white" onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + safeImages.length) % safeImages.length); }}>
            <ChevronLeft className="w-8 h-8" />
          </button>
          <img src={safeImages[lightboxIndex]?.url || ''} alt="" className="max-w-[90%] max-h-[90%] object-contain" />
          <button className="absolute right-4 text-white" onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % safeImages.length); }}>
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}
    </section>
  );
}

// ============================================================================
// JE FOOTER RENDERER
// ============================================================================

export function JEFooterRenderer({ block, isEditing, onUpdate }: BlockRendererProps) {
  const content = block.content || {};

  const {
    logo = '',
    tagline = 'Empowerment begins within.',
    copyright = '© 2026 JustxEmpower. All rights reserved.',
    backgroundColor = '#1a1a1a',
    columns = [
      { title: 'Navigation', links: [{ text: 'Home', url: '/' }, { text: 'About', url: '/about' }, { text: 'Contact', url: '/contact' }] },
      { title: 'Resources', links: [{ text: 'Blog', url: '/blog' }, { text: 'FAQ', url: '/faq' }] },
    ],
    socialLinks = [
      { platform: 'instagram', url: '#' },
      { platform: 'facebook', url: '#' },
    ],
  } = content;

  const handleChange = (key: string, value: any) => {
    onUpdate?.({ ...content, [key]: value });
  };

  const socialIcons: Record<string, any> = {
    instagram: Instagram,
    facebook: Facebook,
    twitter: Twitter,
    linkedin: Linkedin,
    youtube: Youtube,
  };

  return (
    <footer className="py-16" style={{ backgroundColor }}>
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Logo & Tagline */}
          <div className="md:col-span-2">
            {logo && <img src={logo} alt="" className="h-12 mb-4" />}
            <EditableText value={tagline} onChange={(v) => handleChange('tagline', v)} tag="p" placeholder="Tagline..." isEditing={isEditing} className="text-neutral-400 font-serif italic text-lg" />

            {/* Social Links */}
            <div className="flex gap-4 mt-6">
              {socialLinks.map((social: any, index: number) => {
                const Icon = socialIcons[social.platform] || ExternalLink;
                return (
                  <a key={index} href={social.url} className="text-neutral-400 hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link Columns */}
          {columns.map((column: any, colIndex: number) => (
            <div key={colIndex}>
              <EditableText value={column.title} onChange={(v) => {
                const newColumns = [...columns];
                newColumns[colIndex] = { ...column, title: v };
                handleChange('columns', newColumns);
              }} tag="h4" placeholder="Column Title" isEditing={isEditing} className="text-white font-sans font-medium mb-4" />

              <ul className="space-y-2">
                {column.links.map((link: any, linkIndex: number) => (
                  <li key={linkIndex}>
                    <a href={link.url} className="text-neutral-400 hover:text-white transition-colors text-sm">
                      {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-neutral-800">
          <EditableText value={copyright} onChange={(v) => handleChange('copyright', v)} tag="p" placeholder="Copyright..." isEditing={isEditing} className="text-neutral-500 text-sm text-center" />
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// EXPORTS - Part 3
// ============================================================================

export const Part3Renderers = {
  JENewsletterRenderer,
  JEContactFormRenderer,
  JEFAQRenderer,
  JETestimonialRenderer,
  JETestimonialsGridRenderer,
  JEButtonRenderer,
  JEDividerRenderer,
  JESpacerRenderer,
  JETwoColumnRenderer,
  JEGalleryRenderer,
  JEFooterRenderer,
};
