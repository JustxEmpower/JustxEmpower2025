/**
 * Just Empower - MASTER Block Renderer
 * 
 * This file maps ALL 52+ block types to their respective editable renderers.
 * Import this single file to get full editability across the entire Page Builder.
 * 
 * BLOCK TYPE COVERAGE:
 * - JE Hero blocks (4): je-hero, je-hero-video, je-hero-image, je-hero-split
 * - JE Section blocks (2): je-section-standard, je-section-fullwidth
 * - JE Text blocks (3): je-heading, je-paragraph, je-quote/je-blockquote
 * - JE Media blocks (4): je-image, je-video, je-gallery, je-carousel
 * - JE Special blocks (11): je-three-pillars, je-pillars, je-pillar-grid, je-rooted-unity, etc.
 * - JE Interactive blocks (7): je-newsletter, je-contact-form, je-faq, je-testimonial, etc.
 * - JE Layout blocks (4): je-divider, je-spacer, je-two-column, je-footer
 * - Standard blocks (17): hero, text, heading, quote, feature-grid, testimonials, etc.
 * 
 * @version 3.0 - COMPLETE
 * @date January 2026
 */

import React from 'react';

// Part 1: Core components and JE Hero/Section/Text/Media
import {
  EditableText,
  EditableImage,
  EditableVideo,
  JEHeadingRenderer,
  JEParagraphRenderer,
  JEQuoteRenderer,
  JEVideoRenderer,
  iconMap,
  getIcon,
} from './renderers/BlockRenderers-Part1-Core';

// Import JEHeroRenderer, JESectionRenderer, JEImageRenderer from JEBlockRenderers which has EditableElement wrappers
import { JEImageRenderer, JEHeroRenderer, JESectionRenderer } from './renderers/JEBlockRenderers';

// Part 2: JE Special blocks
import {
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
} from './renderers/BlockRenderers-Part2-JESpecial';

// Part 3: JE Interactive & Layout blocks
import {
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
} from './renderers/BlockRenderers-Part3-JEInteractive';

// Part 4: Standard (non-JE) blocks
import {
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
} from './renderers/BlockRenderers-Part4-Standard';

// ============================================================================
// BLOCK RENDERER MAPPING
// ============================================================================

/**
 * Complete mapping of all block types to their renderer components.
 * Each renderer receives: block, isEditing, isBlockSelected, onUpdate
 */
export const BLOCK_RENDERER_MAP: Record<string, React.ComponentType<any>> = {
  // ========================================
  // JE HERO BLOCKS
  // ========================================
  'je-hero': JEHeroRenderer,
  'je-hero-video': JEHeroRenderer,
  'je-hero-image': JEHeroRenderer,
  'je-hero-split': JEHeroRenderer,
  'je-hero-centered': JEHeroRenderer,
  'je-hero-left': JEHeroRenderer,

  // ========================================
  // JE SECTION BLOCKS
  // ========================================
  'je-section': JESectionRenderer,
  'je-section-standard': JESectionRenderer,
  'je-section-fullwidth': JESectionRenderer,
  'je-section-image': JESectionRenderer,
  'je-section-video': JESectionRenderer,

  // ========================================
  // JE TEXT BLOCKS
  // ========================================
  'je-heading': JEHeadingRenderer,
  'je-paragraph': JEParagraphRenderer,
  'je-text': JEParagraphRenderer,
  'je-quote': JEQuoteRenderer,
  'je-blockquote': JEQuoteRenderer,

  // ========================================
  // JE MEDIA BLOCKS
  // ========================================
  'je-image': JEImageRenderer,
  'je-video': JEVideoRenderer,
  'je-gallery': JEGalleryRenderer,
  'je-carousel': JECarouselRenderer,
  'je-media': JEImageRenderer,

  // ========================================
  // JE SPECIAL BLOCKS
  // ========================================
  'je-three-pillars': JEThreePillarsRenderer,
  'je-pillars': JEPillarGridRenderer,
  'je-pillar-grid': JEPillarGridRenderer,
  'je-rooted-unity': JERootedUnityRenderer,
  'je-foundational-principles': JEPrinciplesRenderer,
  'je-principles': JEPrinciplesRenderer,
  'je-offerings-grid': JEOfferingsGridRenderer,
  'je-offerings': JEOfferingsGridRenderer,
  'je-offerings-carousel': JECarouselRenderer,
  'je-community': JECommunityRenderer,
  'je-coming-soon': JEComingSoonRenderer,
  'je-team-member': JETeamMemberRenderer,
  'je-team': JETeamMemberRenderer,
  'je-feature-card': JEFeatureCardRenderer,
  'je-feature': JEFeatureCardRenderer,
  'je-volumes': JEVolumesRenderer,
  'je-publications': JEVolumesRenderer,

  // ========================================
  // JE INTERACTIVE BLOCKS
  // ========================================
  'je-newsletter': JENewsletterRenderer,
  'je-subscribe': JENewsletterRenderer,
  'je-contact-form': JEContactFormRenderer,
  'je-contact': JEContactFormRenderer,
  'je-faq': JEFAQRenderer,
  'je-accordion': JEFAQRenderer,
  'je-testimonial': JETestimonialRenderer,
  'je-testimonials': JETestimonialsGridRenderer,
  'je-testimonials-grid': JETestimonialsGridRenderer,
  'je-button': JEButtonRenderer,
  'je-cta': JEButtonRenderer,

  // ========================================
  // JE LAYOUT BLOCKS
  // ========================================
  'je-divider': JEDividerRenderer,
  'je-spacer': JESpacerRenderer,
  'je-two-column': JETwoColumnRenderer,
  'je-columns': JETwoColumnRenderer,
  'je-footer': JEFooterRenderer,

  // ========================================
  // STANDARD HERO BLOCKS
  // ========================================
  'hero': HeroBlockRenderer,
  'hero-centered': HeroBlockRenderer,
  'hero-split': HeroBlockRenderer,
  'hero-video': HeroBlockRenderer,

  // ========================================
  // STANDARD TEXT BLOCKS
  // ========================================
  'text': TextBlockRenderer,
  'paragraph': TextBlockRenderer,
  'rich-text': TextBlockRenderer,
  'heading': HeadingBlockRenderer,
  'quote': QuoteBlockRenderer,
  'blockquote': QuoteBlockRenderer,

  // ========================================
  // STANDARD FEATURE BLOCKS
  // ========================================
  'feature-grid': FeatureGridRenderer,
  'features': FeatureGridRenderer,
  'feature-list': FeatureGridRenderer,

  // ========================================
  // STANDARD TESTIMONIAL BLOCKS
  // ========================================
  'testimonials': TestimonialsBlockRenderer,
  'testimonial': TestimonialsBlockRenderer,
  'reviews': TestimonialsBlockRenderer,

  // ========================================
  // STANDARD STATS & CTA BLOCKS
  // ========================================
  'stats': StatsBlockRenderer,
  'statistics': StatsBlockRenderer,
  'numbers': StatsBlockRenderer,
  'cta': CTABlockRenderer,
  'call-to-action': CTABlockRenderer,

  // ========================================
  // STANDARD INTERACTIVE BLOCKS
  // ========================================
  'accordion': AccordionBlockRenderer,
  'faq': AccordionBlockRenderer,
  'tabs': TabsBlockRenderer,
  'tab-group': TabsBlockRenderer,

  // ========================================
  // STANDARD MEDIA BLOCKS
  // ========================================
  'image': ImageBlockRenderer,
  'picture': ImageBlockRenderer,
  'video': VideoBlockRenderer,
  'embed': HTMLBlockRenderer,
  'youtube': VideoBlockRenderer,
  'vimeo': VideoBlockRenderer,

  // ========================================
  // STANDARD LAYOUT BLOCKS
  // ========================================
  'spacer': SpacerBlockRenderer,
  'divider': DividerBlockRenderer,
  'separator': DividerBlockRenderer,

  // ========================================
  // STANDARD UI BLOCKS
  // ========================================
  'button': ButtonBlockRenderer,
  'button-group': ButtonBlockRenderer,

  // ========================================
  // STANDARD PRICING & CODE BLOCKS
  // ========================================
  'pricing': PricingBlockRenderer,
  'pricing-table': PricingBlockRenderer,
  'code': CodeBlockRenderer,
  'code-block': CodeBlockRenderer,
  'html': HTMLBlockRenderer,
  'custom-html': HTMLBlockRenderer,
};

// ============================================================================
// MASTER BLOCK RENDERER COMPONENT
// ============================================================================

interface BlockRendererProps {
  block: {
    id: string;
    type: string;
    content: Record<string, any>;
    order?: number;
  };
  isEditing?: boolean;
  isBlockSelected?: boolean;
  isPreviewMode?: boolean;
  isElementEditMode?: boolean;
  onUpdate?: (content: Record<string, any>) => void;
}

/**
 * Master BlockRenderer component that routes to the appropriate renderer
 * based on block type. Handles unknown block types gracefully.
 */
export function BlockRenderer({
  block,
  isEditing = false,
  isBlockSelected = false,
  isPreviewMode = false,
  isElementEditMode = false,
  onUpdate,
}: BlockRendererProps) {
  console.log(`[BlockRenderer] Rendering block type: "${block.type}" isElementEditMode:`, isElementEditMode);
  const Renderer = BLOCK_RENDERER_MAP[block.type];
  console.log(`[BlockRenderer] Found renderer for "${block.type}":`, !!Renderer, 'isElementEditMode:', isElementEditMode);

  // Handle unknown block types
  if (!Renderer) {
    console.warn(`[BlockRenderer] Unknown block type: ${block.type}`, 'Available types:', Object.keys(BLOCK_RENDERER_MAP));
    
    return (
      <div className="p-8 border-2 border-dashed border-yellow-400 bg-yellow-50 rounded-lg text-center">
        <p className="text-yellow-700 font-medium mb-2">Unknown Block Type</p>
        <p className="text-yellow-600 text-sm">"{block.type}"</p>
        <p className="text-yellow-500 text-xs mt-2">
          This block type is not yet supported in the Page Builder.
        </p>
      </div>
    );
  }

  // Don't pass editing state in preview mode
  const effectiveEditing = isPreviewMode ? false : isEditing;

  return (
    <Renderer
      block={block}
      isEditing={effectiveEditing}
      isBlockSelected={isBlockSelected}
      isElementEditMode={isElementEditMode}
      onUpdate={onUpdate}
    />
  );
}

// ============================================================================
// BLOCK CATEGORY DEFINITIONS
// ============================================================================

export const BLOCK_CATEGORIES = {
  'je-hero': {
    name: 'JE Hero',
    description: 'Full-width hero sections with video support',
    blocks: ['je-hero', 'je-hero-video', 'je-hero-image', 'je-hero-split'],
  },
  'je-section': {
    name: 'JE Sections',
    description: 'Content sections with various layouts',
    blocks: ['je-section-standard', 'je-section-fullwidth'],
  },
  'je-text': {
    name: 'JE Text',
    description: 'Typography and text elements',
    blocks: ['je-heading', 'je-paragraph', 'je-quote'],
  },
  'je-media': {
    name: 'JE Media',
    description: 'Images, videos, and galleries',
    blocks: ['je-image', 'je-video', 'je-gallery', 'je-carousel'],
  },
  'je-special': {
    name: 'JE Special',
    description: 'JustxEmpower branded components',
    blocks: ['je-three-pillars', 'je-pillars', 'je-rooted-unity', 'je-principles', 'je-offerings-grid', 'je-community', 'je-coming-soon', 'je-team-member', 'je-feature-card', 'je-volumes'],
  },
  'je-interactive': {
    name: 'JE Interactive',
    description: 'Forms, FAQs, and interactive elements',
    blocks: ['je-newsletter', 'je-contact-form', 'je-faq', 'je-testimonial', 'je-testimonials-grid', 'je-button'],
  },
  'je-layout': {
    name: 'JE Layout',
    description: 'Spacing, dividers, and layout helpers',
    blocks: ['je-divider', 'je-spacer', 'je-two-column', 'je-footer'],
  },
  'standard-content': {
    name: 'Standard Content',
    description: 'Generic content blocks',
    blocks: ['hero', 'text', 'heading', 'quote', 'feature-grid', 'testimonials', 'stats', 'cta'],
  },
  'standard-interactive': {
    name: 'Standard Interactive',
    description: 'Accordions, tabs, and interactive elements',
    blocks: ['accordion', 'tabs', 'pricing'],
  },
  'standard-media': {
    name: 'Standard Media',
    description: 'Images, videos, and embeds',
    blocks: ['image', 'video', 'code', 'html'],
  },
  'standard-layout': {
    name: 'Standard Layout',
    description: 'Spacing and dividers',
    blocks: ['spacer', 'divider', 'button'],
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a block type is supported
 */
export function isBlockTypeSupported(type: string): boolean {
  return type in BLOCK_RENDERER_MAP;
}

/**
 * Get all supported block types
 */
export function getSupportedBlockTypes(): string[] {
  return Object.keys(BLOCK_RENDERER_MAP);
}

/**
 * Get block category for a given block type
 */
export function getBlockCategory(type: string): string | null {
  for (const [category, data] of Object.entries(BLOCK_CATEGORIES)) {
    if (data.blocks.includes(type)) {
      return category;
    }
  }
  return null;
}

/**
 * Check if block type is a JE (JustxEmpower) branded block
 */
export function isJEBlock(type: string): boolean {
  return type.startsWith('je-');
}

// ============================================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================================

export {
  // Core components
  EditableText,
  EditableImage,
  EditableVideo,
  iconMap,
  getIcon,
  
  // JE Hero/Section/Text
  JEHeroRenderer,
  JESectionRenderer,
  JEHeadingRenderer,
  JEParagraphRenderer,
  JEQuoteRenderer,
  JEImageRenderer,
  JEVideoRenderer,
  
  // JE Special
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
  
  // JE Interactive & Layout
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
  
  // Standard blocks
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

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default BlockRenderer;
