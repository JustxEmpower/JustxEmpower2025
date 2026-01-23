/**
 * Just Empower - COMPLETE Block Field Definitions
 * 
 * This file contains field definitions for ALL 52+ block types.
 * These definitions power the settings panel, ensuring every
 * field of every block is editable.
 * 
 * Field Types:
 * - text: Single-line text input
 * - textarea: Multi-line text input
 * - richtext: HTML-enabled text editor
 * - number: Numeric input with min/max
 * - boolean: Toggle switch
 * - select: Dropdown selection
 * - color: Color picker
 * - image: Image URL picker
 * - video: Video URL picker
 * - url: URL input
 * - alignment: Left/Center/Right buttons
 * - icon: Icon selector
 * - array: Array of items with sub-fields
 * - stringarray: Simple array of strings
 * 
 * @version 3.0 - COMPLETE
 * @date January 2026
 */

// ============================================================================
// FIELD TYPE INTERFACES
// ============================================================================

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'richtext' | 'number' | 'boolean' | 'select' | 'color' | 'image' | 'video' | 'url' | 'alignment' | 'icon' | 'array' | 'stringarray';
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: FieldOption[];
  min?: number;
  max?: number;
  step?: number;
  itemFields?: FieldDefinition[];
  defaultValue?: any;
  group?: string;
}

// ============================================================================
// COMMON FIELD PRESETS
// ============================================================================

const ALIGNMENT_OPTIONS: FieldOption[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

const PADDING_OPTIONS: FieldOption[] = [
  { value: 'none', label: 'None' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'Extra Large' },
];

const HEADING_LEVEL_OPTIONS: FieldOption[] = [
  { value: 'h1', label: 'H1 - Largest' },
  { value: 'h2', label: 'H2' },
  { value: 'h3', label: 'H3' },
  { value: 'h4', label: 'H4' },
  { value: 'h5', label: 'H5' },
  { value: 'h6', label: 'H6 - Smallest' },
];

const ROUNDED_OPTIONS: FieldOption[] = [
  { value: 'none', label: 'None' },
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'Extra Large' },
  { value: '2xl', label: '2XL' },
  { value: 'full', label: 'Full (Circle)' },
];

const WIDTH_OPTIONS: FieldOption[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'full', label: 'Full Width' },
  { value: '3/4', label: '75%' },
  { value: '1/2', label: '50%' },
  { value: '1/3', label: '33%' },
  { value: '1/4', label: '25%' },
];

const ASPECT_RATIO_OPTIONS: FieldOption[] = [
  { value: 'auto', label: 'Auto' },
  { value: '1/1', label: 'Square (1:1)' },
  { value: '4/3', label: 'Standard (4:3)' },
  { value: '16/9', label: 'Widescreen (16:9)' },
  { value: '21/9', label: 'Ultrawide (21:9)' },
  { value: '9/16', label: 'Vertical (9:16)' },
];

const COLUMN_OPTIONS: FieldOption[] = [
  { value: '1', label: '1 Column' },
  { value: '2', label: '2 Columns' },
  { value: '3', label: '3 Columns' },
  { value: '4', label: '4 Columns' },
];

// ============================================================================
// JE BLOCK FIELD DEFINITIONS
// ============================================================================

export const JE_BLOCK_FIELDS: Record<string, FieldDefinition[]> = {
  // ========================================
  // JE HERO BLOCKS
  // ========================================
  'je-hero': [
    { key: 'title', label: 'Title', type: 'text', placeholder: 'Main headline', group: 'content' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Subtitle text', group: 'content' },
    { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description text...', group: 'content' },
    { key: 'ctaText', label: 'Button Text', type: 'text', placeholder: 'Call to action', group: 'content' },
    { key: 'ctaLink', label: 'Button Link', type: 'url', placeholder: '/path-or-url', group: 'content' },
    { key: 'secondaryCtaText', label: 'Secondary Button', type: 'text', group: 'content' },
    { key: 'secondaryCtaLink', label: 'Secondary Link', type: 'url', group: 'content' },
    { key: 'imageUrl', label: 'Background Image', type: 'image', group: 'media' },
    { key: 'videoUrl', label: 'Background Video', type: 'video', group: 'media' },
    { key: 'variant', label: 'Layout Variant', type: 'select', options: [
      { value: 'centered', label: 'Centered' },
      { value: 'left-aligned', label: 'Left Aligned' },
      { value: 'split', label: 'Split' },
    ], group: 'layout' },
    { key: 'minHeight', label: 'Minimum Height', type: 'text', placeholder: '80vh', group: 'layout' },
    { key: 'contentWidth', label: 'Content Width', type: 'select', options: [
      { value: 'max-w-2xl', label: 'Narrow' },
      { value: 'max-w-4xl', label: 'Medium' },
      { value: 'max-w-6xl', label: 'Wide' },
    ], group: 'layout' },
    { key: 'verticalAlign', label: 'Vertical Align', type: 'select', options: [
      { value: 'top', label: 'Top' },
      { value: 'center', label: 'Center' },
      { value: 'bottom', label: 'Bottom' },
    ], group: 'layout' },
    { key: 'overlay', label: 'Show Overlay', type: 'boolean', group: 'style' },
    { key: 'overlayOpacity', label: 'Overlay Opacity', type: 'number', min: 0, max: 100, group: 'style' },
    { key: 'dark', label: 'Dark Mode', type: 'boolean', group: 'style' },
    { key: 'titleColor', label: 'Title Color', type: 'color', group: 'style' },
    { key: 'subtitleColor', label: 'Subtitle Color', type: 'color', group: 'style' },
    { key: 'descriptionColor', label: 'Description Color', type: 'color', group: 'style' },
  ],

  'je-hero-video': [
    // === CONTENT GROUP ===
    { key: 'title', label: 'Title', type: 'text', group: 'content' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', group: 'content' },
    { key: 'description', label: 'Description', type: 'textarea', group: 'content' },
    { key: 'ctaText', label: 'Button Text', type: 'text', group: 'content' },
    { key: 'ctaLink', label: 'Button Link', type: 'url', group: 'content' },
    
    // === MEDIA GROUP ===
    { key: 'videoUrl', label: 'Video URL', type: 'video', required: true, group: 'media' },
    { key: 'posterImage', label: 'Poster Image', type: 'image', group: 'media' },
    
    // === COLORS GROUP ===
    { key: 'titleColor', label: 'Title Color', type: 'color', group: 'style' },
    { key: 'subtitleColor', label: 'Subtitle Color', type: 'color', group: 'style' },
    { key: 'descriptionColor', label: 'Description Color', type: 'color', group: 'style' },
    { key: 'ctaTextColor', label: 'Button Text Color', type: 'color', group: 'style' },
    { key: 'overlayOpacity', label: 'Overlay Opacity', type: 'number', min: 0, max: 100, group: 'style' },
    
    // === SHAPE & SIZE GROUP ===
    { key: 'minHeight', label: 'Minimum Height', type: 'text', placeholder: '100vh', group: 'layout' },
    { key: 'borderRadius', label: 'Border Radius', type: 'text', placeholder: '2.5rem', group: 'layout' },
    { key: 'bottomCurve', label: 'Bottom Curve', type: 'boolean', description: 'Add curved bottom edge', group: 'layout' },
    { key: 'topCurve', label: 'Top Curve', type: 'boolean', description: 'Add curved top edge', group: 'layout' },
    
    // === CONTENT POSITION GROUP ===
    { key: 'textAlignment', label: 'Text Alignment', type: 'select', options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ], group: 'layout' },
    { key: 'contentVerticalAlign', label: 'Vertical Align', type: 'select', options: [
      { value: 'top', label: 'Top' },
      { value: 'center', label: 'Center' },
      { value: 'bottom', label: 'Bottom' },
    ], group: 'layout' },
    { key: 'contentHorizontalAlign', label: 'Horizontal Align', type: 'select', options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ], group: 'layout' },
    { key: 'contentMaxWidth', label: 'Content Max Width', type: 'select', options: [
      { value: '2xl', label: 'Narrow (2xl)' },
      { value: '3xl', label: 'Small (3xl)' },
      { value: '4xl', label: 'Medium (4xl)' },
      { value: '5xl', label: 'Large (5xl)' },
      { value: '6xl', label: 'Wide (6xl)' },
      { value: '7xl', label: 'Extra Wide (7xl)' },
    ], group: 'layout' },
    
    // === SPACING GROUP ===
    { key: 'paddingTop', label: 'Padding Top', type: 'text', placeholder: '16', group: 'layout' },
    { key: 'paddingBottom', label: 'Padding Bottom', type: 'text', placeholder: '16', group: 'layout' },
    { key: 'paddingLeft', label: 'Padding Left', type: 'text', placeholder: '6', group: 'layout' },
    { key: 'paddingRight', label: 'Padding Right', type: 'text', placeholder: '6', group: 'layout' },
    
    // === TITLE TYPOGRAPHY GROUP ===
    { key: 'titleFontSize', label: 'Title Font Size (Mobile)', type: 'text', placeholder: '48px', group: 'advanced' },
    { key: 'titleFontSizeMd', label: 'Title Font Size (Tablet)', type: 'text', placeholder: '64px', group: 'advanced' },
    { key: 'titleFontSizeLg', label: 'Title Font Size (Desktop)', type: 'text', placeholder: '80px', group: 'advanced' },
    { key: 'titleLineHeight', label: 'Title Line Height', type: 'text', placeholder: '1.1', group: 'advanced' },
    { key: 'titleMarginBottom', label: 'Title Margin Bottom', type: 'text', placeholder: '24px', group: 'advanced' },
    { key: 'titleFontWeight', label: 'Title Font Weight', type: 'select', options: [
      { value: '100', label: 'Thin (100)' },
      { value: '200', label: 'Extra Light (200)' },
      { value: '300', label: 'Light (300)' },
      { value: '400', label: 'Normal (400)' },
      { value: '500', label: 'Medium (500)' },
      { value: '600', label: 'Semi Bold (600)' },
      { value: '700', label: 'Bold (700)' },
    ], group: 'advanced' },
    { key: 'titleFontStyle', label: 'Title Font Style', type: 'select', options: [
      { value: 'normal', label: 'Normal' },
      { value: 'italic', label: 'Italic' },
    ], group: 'advanced' },
    
    // === SUBTITLE TYPOGRAPHY GROUP ===
    { key: 'subtitleFontSize', label: 'Subtitle Font Size', type: 'text', placeholder: '12px', group: 'advanced' },
    { key: 'subtitleLetterSpacing', label: 'Subtitle Letter Spacing', type: 'text', placeholder: '0.3em', group: 'advanced' },
    { key: 'subtitleMarginBottom', label: 'Subtitle Margin Bottom', type: 'text', placeholder: '24px', group: 'advanced' },
    
    // === DESCRIPTION TYPOGRAPHY GROUP ===
    { key: 'descriptionFontSize', label: 'Description Font Size', type: 'text', placeholder: '18px', group: 'advanced' },
    { key: 'descriptionFontSizeMd', label: 'Description Size (Tablet)', type: 'text', placeholder: '20px', group: 'advanced' },
    { key: 'descriptionLineHeight', label: 'Description Line Height', type: 'text', placeholder: '1.6', group: 'advanced' },
    { key: 'descriptionMarginBottom', label: 'Description Margin Bottom', type: 'text', placeholder: '3rem', group: 'advanced' },
    { key: 'descriptionMaxWidth', label: 'Description Max Width', type: 'text', placeholder: '32rem', group: 'advanced' },
    
    // === CTA BUTTON STYLING GROUP ===
    { key: 'ctaBorderRadius', label: 'Button Border Radius', type: 'text', placeholder: '9999px', group: 'advanced' },
    { key: 'ctaPaddingX', label: 'Button Padding X', type: 'text', placeholder: '2rem', group: 'advanced' },
    { key: 'ctaPaddingY', label: 'Button Padding Y', type: 'text', placeholder: '1rem', group: 'advanced' },
    { key: 'ctaFontSize', label: 'Button Font Size', type: 'text', placeholder: '0.875rem', group: 'advanced' },
    { key: 'ctaLetterSpacing', label: 'Button Letter Spacing', type: 'text', placeholder: '0.2em', group: 'advanced' },
    { key: 'ctaBorderWidth', label: 'Button Border Width', type: 'text', placeholder: '1px', group: 'advanced' },
  ],

  'je-hero-image': [
    // === CONTENT GROUP ===
    { key: 'title', label: 'Title', type: 'text', group: 'content' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', group: 'content' },
    { key: 'description', label: 'Description', type: 'textarea', group: 'content' },
    { key: 'ctaText', label: 'Button Text', type: 'text', group: 'content' },
    { key: 'ctaLink', label: 'Button Link', type: 'url', group: 'content' },
    
    // === MEDIA GROUP ===
    { key: 'imageUrl', label: 'Background Image', type: 'image', required: true, group: 'media' },
    
    // === COLORS GROUP ===
    { key: 'titleColor', label: 'Title Color', type: 'color', group: 'style' },
    { key: 'subtitleColor', label: 'Subtitle Color', type: 'color', group: 'style' },
    { key: 'descriptionColor', label: 'Description Color', type: 'color', group: 'style' },
    { key: 'ctaTextColor', label: 'Button Text Color', type: 'color', group: 'style' },
    { key: 'overlayOpacity', label: 'Overlay Opacity', type: 'number', min: 0, max: 100, group: 'style' },
    
    // === SHAPE & SIZE GROUP ===
    { key: 'minHeight', label: 'Minimum Height', type: 'text', placeholder: '80vh', group: 'layout' },
    { key: 'borderRadius', label: 'Border Radius', type: 'text', placeholder: '2.5rem', group: 'layout' },
    { key: 'bottomCurve', label: 'Bottom Curve', type: 'boolean', description: 'Add curved bottom edge', group: 'layout' },
    { key: 'topCurve', label: 'Top Curve', type: 'boolean', description: 'Add curved top edge', group: 'layout' },
    
    // === CONTENT POSITION GROUP ===
    { key: 'textAlignment', label: 'Text Alignment', type: 'select', options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ], group: 'layout' },
    { key: 'contentVerticalAlign', label: 'Vertical Align', type: 'select', options: [
      { value: 'top', label: 'Top' },
      { value: 'center', label: 'Center' },
      { value: 'bottom', label: 'Bottom' },
    ], group: 'layout' },
    { key: 'contentHorizontalAlign', label: 'Horizontal Align', type: 'select', options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ], group: 'layout' },
    { key: 'contentMaxWidth', label: 'Content Max Width', type: 'select', options: [
      { value: '2xl', label: 'Narrow (2xl)' },
      { value: '3xl', label: 'Small (3xl)' },
      { value: '4xl', label: 'Medium (4xl)' },
      { value: '5xl', label: 'Large (5xl)' },
      { value: '6xl', label: 'Wide (6xl)' },
    ], group: 'layout' },
    
    // === SPACING GROUP ===
    { key: 'paddingTop', label: 'Padding Top', type: 'text', placeholder: '16', group: 'layout' },
    { key: 'paddingBottom', label: 'Padding Bottom', type: 'text', placeholder: '16', group: 'layout' },
    { key: 'paddingLeft', label: 'Padding Left', type: 'text', placeholder: '6', group: 'layout' },
    { key: 'paddingRight', label: 'Padding Right', type: 'text', placeholder: '6', group: 'layout' },
    
    // === TITLE TYPOGRAPHY GROUP ===
    { key: 'titleFontSize', label: 'Title Font Size (Mobile)', type: 'text', placeholder: '48px', group: 'advanced' },
    { key: 'titleFontSizeMd', label: 'Title Font Size (Tablet)', type: 'text', placeholder: '64px', group: 'advanced' },
    { key: 'titleFontSizeLg', label: 'Title Font Size (Desktop)', type: 'text', placeholder: '80px', group: 'advanced' },
    { key: 'titleLineHeight', label: 'Title Line Height', type: 'text', placeholder: '1.1', group: 'advanced' },
    { key: 'titleMarginBottom', label: 'Title Margin Bottom', type: 'text', placeholder: '24px', group: 'advanced' },
    { key: 'titleFontWeight', label: 'Title Font Weight', type: 'select', options: [
      { value: '100', label: 'Thin (100)' },
      { value: '200', label: 'Extra Light (200)' },
      { value: '300', label: 'Light (300)' },
      { value: '400', label: 'Normal (400)' },
      { value: '500', label: 'Medium (500)' },
      { value: '600', label: 'Semi Bold (600)' },
      { value: '700', label: 'Bold (700)' },
    ], group: 'advanced' },
    { key: 'titleFontStyle', label: 'Title Font Style', type: 'select', options: [
      { value: 'normal', label: 'Normal' },
      { value: 'italic', label: 'Italic' },
    ], group: 'advanced' },
    
    // === SUBTITLE TYPOGRAPHY GROUP ===
    { key: 'subtitleFontSize', label: 'Subtitle Font Size', type: 'text', placeholder: '12px', group: 'advanced' },
    { key: 'subtitleLetterSpacing', label: 'Subtitle Letter Spacing', type: 'text', placeholder: '0.3em', group: 'advanced' },
    { key: 'subtitleMarginBottom', label: 'Subtitle Margin Bottom', type: 'text', placeholder: '24px', group: 'advanced' },
    
    // === DESCRIPTION TYPOGRAPHY GROUP ===
    { key: 'descriptionFontSize', label: 'Description Font Size', type: 'text', placeholder: '18px', group: 'advanced' },
    { key: 'descriptionFontSizeMd', label: 'Description Size (Tablet)', type: 'text', placeholder: '20px', group: 'advanced' },
    { key: 'descriptionLineHeight', label: 'Description Line Height', type: 'text', placeholder: '1.6', group: 'advanced' },
    { key: 'descriptionMarginBottom', label: 'Description Margin Bottom', type: 'text', placeholder: '3rem', group: 'advanced' },
    { key: 'descriptionMaxWidth', label: 'Description Max Width', type: 'text', placeholder: '32rem', group: 'advanced' },
    
    // === CTA BUTTON STYLING GROUP ===
    { key: 'ctaBorderRadius', label: 'Button Border Radius', type: 'text', placeholder: '9999px', group: 'advanced' },
    { key: 'ctaPaddingX', label: 'Button Padding X', type: 'text', placeholder: '2rem', group: 'advanced' },
    { key: 'ctaPaddingY', label: 'Button Padding Y', type: 'text', placeholder: '1rem', group: 'advanced' },
    { key: 'ctaFontSize', label: 'Button Font Size', type: 'text', placeholder: '0.875rem', group: 'advanced' },
    { key: 'ctaLetterSpacing', label: 'Button Letter Spacing', type: 'text', placeholder: '0.2em', group: 'advanced' },
    { key: 'ctaBorderWidth', label: 'Button Border Width', type: 'text', placeholder: '1px', group: 'advanced' },
  ],

  'je-hero-split': [
    // === CONTENT GROUP ===
    { key: 'title', label: 'Title', type: 'text', group: 'content' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', group: 'content' },
    { key: 'description', label: 'Description', type: 'textarea', group: 'content' },
    { key: 'ctaText', label: 'Button Text', type: 'text', group: 'content' },
    { key: 'ctaLink', label: 'Button Link', type: 'url', group: 'content' },
    
    // === MEDIA GROUP ===
    { key: 'imageUrl', label: 'Image', type: 'image', required: true, group: 'media' },
    { key: 'imagePosition', label: 'Image Position', type: 'select', options: [
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
    ], group: 'layout' },
    
    // === COLORS GROUP ===
    { key: 'titleColor', label: 'Title Color', type: 'color', group: 'style' },
    { key: 'subtitleColor', label: 'Subtitle Color', type: 'color', group: 'style' },
    { key: 'descriptionColor', label: 'Description Color', type: 'color', group: 'style' },
    { key: 'ctaTextColor', label: 'Button Text Color', type: 'color', group: 'style' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color', group: 'style' },
  ],

  // ========================================
  // JE SECTION BLOCKS
  // ========================================
  'je-section-standard': [
    // === CONTENT GROUP ===
    { key: 'label', label: 'Section Label', type: 'text', placeholder: 'SECTION LABEL', group: 'content' },
    { key: 'title', label: 'Title', type: 'text', group: 'content' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', group: 'content' },
    { key: 'description', label: 'Description', type: 'textarea', group: 'content' },
    { key: 'htmlContent', label: 'HTML Content', type: 'richtext', group: 'content' },
    { key: 'ctaText', label: 'Button Text', type: 'text', group: 'content' },
    { key: 'ctaLink', label: 'Button Link', type: 'url', group: 'content' },
    
    // === MEDIA GROUP ===
    { key: 'imageUrl', label: 'Image', type: 'image', group: 'media' },
    { key: 'imagePosition', label: 'Image Position', type: 'select', options: [
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
      { value: 'top', label: 'Top' },
      { value: 'bottom', label: 'Bottom' },
    ], group: 'layout' },
    
    // === COLORS GROUP ===
    { key: 'backgroundColor', label: 'Background Color', type: 'select', options: [
      { value: 'white', label: 'White' },
      { value: 'cream', label: 'Cream' },
      { value: 'dark', label: 'Dark' },
      { value: 'transparent', label: 'Transparent' },
    ], group: 'style' },
    { key: 'labelColor', label: 'Label Color', type: 'color', group: 'style' },
    { key: 'titleColor', label: 'Title Color', type: 'color', group: 'style' },
    { key: 'descriptionColor', label: 'Description Color', type: 'color', group: 'style' },
    { key: 'ctaTextColor', label: 'Button Text Color', type: 'color', group: 'style' },
    { key: 'dark', label: 'Dark Mode', type: 'boolean', group: 'style' },
    
    // === IMAGE ELEMENT CONTROLS ===
    { key: 'imageWidth', label: 'Image Width', type: 'text', placeholder: '100%', group: 'advanced' },
    { key: 'imageHeight', label: 'Image Height', type: 'text', placeholder: 'auto', group: 'advanced' },
    { key: 'imageMaxWidth', label: 'Image Max Width', type: 'text', placeholder: '100%', group: 'advanced' },
    { key: 'imageBorderRadius', label: 'Image Border Radius', type: 'text', placeholder: '2rem', group: 'advanced' },
    { key: 'imageObjectFit', label: 'Image Object Fit', type: 'select', options: [
      { value: 'cover', label: 'Cover' },
      { value: 'contain', label: 'Contain' },
      { value: 'fill', label: 'Fill' },
      { value: 'none', label: 'None' },
    ], group: 'advanced' },
    { key: 'imageMarginTop', label: 'Image Margin Top', type: 'text', placeholder: '0', group: 'advanced' },
    { key: 'imageMarginBottom', label: 'Image Margin Bottom', type: 'text', placeholder: '0', group: 'advanced' },
    
    // === TEXT ELEMENT CONTROLS ===
    { key: 'titleFontSize', label: 'Title Font Size', type: 'text', placeholder: '3rem', group: 'advanced' },
    { key: 'titleLineHeight', label: 'Title Line Height', type: 'text', placeholder: '1.2', group: 'advanced' },
    { key: 'titleMarginBottom', label: 'Title Margin Bottom', type: 'text', placeholder: '2rem', group: 'advanced' },
    { key: 'descriptionFontSize', label: 'Description Font Size', type: 'text', placeholder: '18px', group: 'advanced' },
    { key: 'descriptionLineHeight', label: 'Description Line Height', type: 'text', placeholder: '1.75', group: 'advanced' },
    { key: 'descriptionMarginBottom', label: 'Description Margin Bottom', type: 'text', placeholder: '2rem', group: 'advanced' },
    { key: 'labelFontSize', label: 'Label Font Size', type: 'text', placeholder: '12px', group: 'advanced' },
    { key: 'labelMarginBottom', label: 'Label Margin Bottom', type: 'text', placeholder: '1rem', group: 'advanced' },
    
    // === CTA ELEMENT CONTROLS ===
    { key: 'ctaBorderRadius', label: 'Button Border Radius', type: 'text', placeholder: '9999px', group: 'advanced' },
    { key: 'ctaPaddingX', label: 'Button Padding X', type: 'text', placeholder: '24px', group: 'advanced' },
    { key: 'ctaPaddingY', label: 'Button Padding Y', type: 'text', placeholder: '12px', group: 'advanced' },
    { key: 'ctaFontSize', label: 'Button Font Size', type: 'text', placeholder: '0.875rem', group: 'advanced' },
    
    // === LAYOUT CONTROLS ===
    { key: 'contentGap', label: 'Content Gap', type: 'text', placeholder: '4rem', group: 'layout' },
    { key: 'sectionPaddingY', label: 'Section Padding Y', type: 'text', placeholder: '6rem', group: 'layout' },
    { key: 'sectionPaddingX', label: 'Section Padding X', type: 'text', placeholder: '24px', group: 'layout' },
    { key: 'contentTextAlign', label: 'Content Text Align', type: 'select', options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ], group: 'layout' },
    { key: 'contentVerticalAlign', label: 'Content Vertical Align', type: 'select', options: [
      { value: 'top', label: 'Top' },
      { value: 'center', label: 'Center' },
      { value: 'bottom', label: 'Bottom' },
    ], group: 'layout' },
  ],

  'je-section-fullwidth': [
    // === CONTENT GROUP ===
    { key: 'label', label: 'Section Label', type: 'text', group: 'content' },
    { key: 'title', label: 'Title', type: 'text', group: 'content' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', group: 'content' },
    { key: 'description', label: 'Description', type: 'textarea', group: 'content' },
    { key: 'htmlContent', label: 'HTML Content', type: 'richtext', group: 'content' },
    { key: 'ctaText', label: 'Button Text', type: 'text', group: 'content' },
    { key: 'ctaLink', label: 'Button Link', type: 'url', group: 'content' },
    
    // === MEDIA GROUP ===
    { key: 'backgroundType', label: 'Background Type', type: 'select', options: [
      { value: 'image', label: 'Image' },
      { value: 'video', label: 'Video' },
      { value: 'color', label: 'Color Only' },
    ], group: 'media' },
    { key: 'backgroundUrl', label: 'Background URL', type: 'image', group: 'media' },
    { key: 'imageUrl', label: 'Background Image', type: 'image', group: 'media' },
    { key: 'videoUrl', label: 'Background Video', type: 'video', group: 'media' },
    
    // === COLORS GROUP ===
    { key: 'labelColor', label: 'Label Color', type: 'color', group: 'style' },
    { key: 'titleColor', label: 'Title Color', type: 'color', group: 'style' },
    { key: 'descriptionColor', label: 'Description Color', type: 'color', group: 'style' },
    { key: 'ctaTextColor', label: 'Button Text Color', type: 'color', group: 'style' },
    { key: 'textColor', label: 'Text Color Theme', type: 'select', options: [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
    ], group: 'style' },
    { key: 'overlayOpacity', label: 'Overlay Opacity', type: 'number', min: 0, max: 100, group: 'style' },
    { key: 'overlay', label: 'Show Overlay', type: 'boolean', group: 'style' },
    { key: 'dark', label: 'Dark Mode', type: 'boolean', group: 'style' },
    
    // === TEXT ELEMENT CONTROLS ===
    { key: 'titleFontSize', label: 'Title Font Size', type: 'text', placeholder: '3.5rem', group: 'advanced' },
    { key: 'titleLineHeight', label: 'Title Line Height', type: 'text', placeholder: '1.2', group: 'advanced' },
    { key: 'titleMarginBottom', label: 'Title Margin Bottom', type: 'text', placeholder: '24px', group: 'advanced' },
    { key: 'descriptionFontSize', label: 'Description Font Size', type: 'text', placeholder: '20px', group: 'advanced' },
    { key: 'descriptionLineHeight', label: 'Description Line Height', type: 'text', placeholder: '1.75', group: 'advanced' },
    { key: 'descriptionMarginBottom', label: 'Description Margin Bottom', type: 'text', placeholder: '2rem', group: 'advanced' },
    { key: 'labelFontSize', label: 'Label Font Size', type: 'text', placeholder: '12px', group: 'advanced' },
    { key: 'labelMarginBottom', label: 'Label Margin Bottom', type: 'text', placeholder: '1rem', group: 'advanced' },
    
    // === CTA ELEMENT CONTROLS ===
    { key: 'ctaBorderRadius', label: 'Button Border Radius', type: 'text', placeholder: '9999px', group: 'advanced' },
    { key: 'ctaPaddingX', label: 'Button Padding X', type: 'text', placeholder: '2rem', group: 'advanced' },
    { key: 'ctaPaddingY', label: 'Button Padding Y', type: 'text', placeholder: '1rem', group: 'advanced' },
    { key: 'ctaFontSize', label: 'Button Font Size', type: 'text', placeholder: '0.875rem', group: 'advanced' },
    
    // === LAYOUT CONTROLS ===
    { key: 'minHeight', label: 'Minimum Height', type: 'text', placeholder: '70vh', group: 'layout' },
    { key: 'sectionPaddingY', label: 'Section Padding Y', type: 'text', placeholder: '6rem', group: 'layout' },
    { key: 'sectionPaddingX', label: 'Section Padding X', type: 'text', placeholder: '24px', group: 'layout' },
    { key: 'contentMaxWidth', label: 'Content Max Width', type: 'text', placeholder: '48rem', group: 'layout' },
    { key: 'contentTextAlign', label: 'Content Text Align', type: 'select', options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ], group: 'layout' },
    { key: 'contentVerticalAlign', label: 'Content Vertical Align', type: 'select', options: [
      { value: 'top', label: 'Top' },
      { value: 'center', label: 'Center' },
      { value: 'bottom', label: 'Bottom' },
    ], group: 'layout' },
  ],

  // ========================================
  // JE TEXT BLOCKS
  // ========================================
  'je-heading': [
    { key: 'text', label: 'Heading Text', type: 'text', placeholder: 'Section Heading' },
    { key: 'level', label: 'Heading Level', type: 'select', options: HEADING_LEVEL_OPTIONS },
    { key: 'alignment', label: 'Alignment', type: 'alignment' },
    { key: 'italic', label: 'Italic', type: 'boolean' },
    { key: 'serif', label: 'Serif Font', type: 'boolean' },
    { key: 'uppercase', label: 'Uppercase', type: 'boolean' },
    { key: 'color', label: 'Text Color', type: 'color' },
    { key: 'marginTop', label: 'Margin Top', type: 'text', placeholder: '0px' },
    { key: 'marginBottom', label: 'Margin Bottom', type: 'text', placeholder: '0px' },
  ],

  'je-paragraph': [
    { key: 'text', label: 'Paragraph Text', type: 'richtext', placeholder: 'Enter your text here...' },
    { key: 'alignment', label: 'Alignment', type: 'alignment' },
    { key: 'dropCap', label: 'Drop Cap', type: 'boolean' },
    { key: 'columns', label: 'Columns', type: 'number', min: 1, max: 3 },
    { key: 'fontFamily', label: 'Font Family', type: 'select', options: [
      { value: 'default', label: 'Default (Sans)' },
      { value: 'Inter', label: 'Inter' },
      { value: 'Playfair Display', label: 'Playfair Display' },
      { value: 'Lora', label: 'Lora' },
      { value: 'Merriweather', label: 'Merriweather' },
      { value: 'Georgia', label: 'Georgia' },
      { value: 'Retro Signature', label: 'Retro Signature' },
      { value: 'Aphrodite', label: 'Aphrodite' },
      { value: 'Cherolina', label: 'Cherolina' },
      { value: 'Faithfull Signature', label: 'Faithfull Signature' },
      { value: 'Rise of Beauty Script', label: 'Rise of Beauty Script' },
    ]},
    { key: 'fontSize', label: 'Font Size', type: 'select', options: [
      { value: '14px', label: '14px (Small)' },
      { value: '16px', label: '16px (Normal)' },
      { value: '18px', label: '18px (Medium)' },
      { value: '20px', label: '20px (Large)' },
      { value: '24px', label: '24px (X-Large)' },
    ]},
    { key: 'lineHeight', label: 'Line Height', type: 'select', options: [
      { value: 'tight', label: 'Tight' },
      { value: 'normal', label: 'Normal' },
      { value: 'relaxed', label: 'Relaxed' },
      { value: 'loose', label: 'Loose' },
    ]},
    { key: 'maxWidth', label: 'Container Width', type: 'select', options: [
      { value: 'narrow', label: 'Narrow (672px)' },
      { value: 'medium', label: 'Medium (896px)' },
      { value: 'wide', label: 'Wide (1152px)' },
      { value: 'full', label: 'Full Width' },
    ]},
    { key: 'indent', label: 'First Line Indent', type: 'boolean' },
    { key: 'color', label: 'Text Color', type: 'color' },
  ],

  'je-quote': [
    { key: 'quote', label: 'Quote Text', type: 'textarea', placeholder: 'Enter quote...' },
    { key: 'author', label: 'Author Name', type: 'text' },
    { key: 'role', label: 'Author Role/Title', type: 'text' },
    { key: 'imageUrl', label: 'Author Image', type: 'image' },
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'elegant', label: 'Elegant' },
      { value: 'simple', label: 'Simple' },
      { value: 'card', label: 'Card' },
    ]},
    { key: 'alignment', label: 'Alignment', type: 'alignment' },
    { key: 'dark', label: 'Dark Mode', type: 'boolean' },
  ],

  'je-blockquote': [
    { key: 'quote', label: 'Quote Text', type: 'textarea' },
    { key: 'author', label: 'Author Name', type: 'text' },
    { key: 'role', label: 'Author Role/Title', type: 'text' },
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'elegant', label: 'Elegant' },
      { value: 'simple', label: 'Simple' },
      { value: 'card', label: 'Card' },
    ]},
    { key: 'alignment', label: 'Alignment', type: 'alignment' },
  ],

  // ========================================
  // JE MEDIA BLOCKS
  // ========================================
  'je-image': [
    { key: 'imageUrl', label: 'Image', type: 'image', required: true },
    { key: 'alt', label: 'Alt Text', type: 'text', placeholder: 'Image description' },
    { key: 'caption', label: 'Caption', type: 'text' },
    { key: 'width', label: 'Width', type: 'select', options: WIDTH_OPTIONS },
    { key: 'alignment', label: 'Alignment', type: 'alignment' },
    { key: 'rounded', label: 'Border Radius', type: 'select', options: ROUNDED_OPTIONS },
    { key: 'shadow', label: 'Drop Shadow', type: 'boolean' },
    { key: 'aspectRatio', label: 'Aspect Ratio', type: 'select', options: ASPECT_RATIO_OPTIONS },
    { key: 'link', label: 'Link URL', type: 'url' },
    { key: 'lightbox', label: 'Enable Lightbox', type: 'boolean' },
  ],

  'je-video': [
    { key: 'videoUrl', label: 'Video URL', type: 'video', required: true },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'poster', label: 'Poster/Thumbnail', type: 'image' },
    { key: 'autoplay', label: 'Autoplay', type: 'boolean' },
    { key: 'muted', label: 'Muted', type: 'boolean' },
    { key: 'loop', label: 'Loop', type: 'boolean' },
    { key: 'controls', label: 'Show Controls', type: 'boolean' },
    { key: 'aspectRatio', label: 'Aspect Ratio', type: 'select', options: ASPECT_RATIO_OPTIONS },
    { key: 'width', label: 'Width', type: 'select', options: WIDTH_OPTIONS },
    { key: 'alignment', label: 'Alignment', type: 'alignment' },
    { key: 'rounded', label: 'Border Radius', type: 'select', options: ROUNDED_OPTIONS },
  ],

  // je-gallery uses custom inline settings panel - removed from definitions to avoid Select issues

  // ========================================
  // JE SPECIAL BLOCKS
  // ========================================
  'je-three-pillars': [
    { key: 'label', label: 'Section Label', type: 'text', placeholder: 'FOUNDATION OF OUR WORK' },
    { key: 'title', label: 'Section Title', type: 'text', placeholder: 'The Three Pillars' },
    { key: 'description', label: 'Section Description', type: 'textarea' },
    { key: 'imageUrl', label: 'Background Image', type: 'image' },
    { key: 'dark', label: 'Dark Mode', type: 'boolean' },
    { key: 'pillars', label: 'Pillars', type: 'array', itemFields: [
      { key: 'icon', label: 'Icon', type: 'icon' },
      { key: 'title', label: 'Pillar Title', type: 'text' },
      { key: 'description', label: 'Pillar Description', type: 'textarea' },
    ]},
  ],

  'je-pillars': [
    { key: 'label', label: 'Section Label', type: 'text' },
    { key: 'title', label: 'Section Title', type: 'text' },
    { key: 'description', label: 'Section Description', type: 'textarea' },
    { key: 'columns', label: 'Columns', type: 'number', min: 1, max: 4 },
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'cards', label: 'Cards' },
      { value: 'minimal', label: 'Minimal' },
    ]},
    { key: 'dark', label: 'Dark Mode', type: 'boolean' },
    { key: 'pillars', label: 'Pillars', type: 'array', itemFields: [
      { key: 'icon', label: 'Icon', type: 'icon' },
      { key: 'title', label: 'Pillar Title', type: 'text' },
      { key: 'description', label: 'Pillar Description', type: 'textarea' },
      { key: 'link', label: 'Link URL', type: 'url' },
    ]},
  ],

  'je-pillar-grid': [
    { key: 'label', label: 'Section Label', type: 'text' },
    { key: 'title', label: 'Section Title', type: 'text' },
    { key: 'description', label: 'Section Description', type: 'textarea' },
    { key: 'columns', label: 'Columns', type: 'number', min: 1, max: 4 },
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'cards', label: 'Cards' },
      { value: 'minimal', label: 'Minimal' },
    ]},
    { key: 'dark', label: 'Dark Mode', type: 'boolean' },
    { key: 'pillars', label: 'Items', type: 'array', itemFields: [
      { key: 'icon', label: 'Icon', type: 'icon' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'link', label: 'Link URL', type: 'url' },
    ]},
  ],

  'je-rooted-unity': [
    { key: 'label', label: 'Label', type: 'text', placeholder: 'COMING FALL 2026' },
    { key: 'title', label: 'Title', type: 'text', placeholder: 'Rooted Unity' },
    { key: 'description', label: 'Short Description', type: 'textarea' },
    { key: 'longDescription', label: 'Full Description', type: 'richtext', description: 'Use line breaks for paragraphs' },
    { key: 'imageUrl', label: 'Background Image', type: 'image' },
    { key: 'videoUrl', label: 'Background Video', type: 'video' },
    { key: 'ctaText', label: 'Button Text', type: 'text' },
    { key: 'ctaLink', label: 'Button Link', type: 'url' },
    { key: 'dark', label: 'Dark Mode', type: 'boolean' },
    { key: 'features', label: 'Features', type: 'stringarray' },
  ],

  'je-foundational-principles': [
    { key: 'label', label: 'Section Label', type: 'text' },
    { key: 'title', label: 'Section Title', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'text' },
    { key: 'columns', label: 'Columns', type: 'number', min: 1, max: 4 },
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'numbered', label: 'Numbered' },
      { value: 'icon', label: 'With Icons' },
    ]},
    { key: 'dark', label: 'Dark Mode', type: 'boolean' },
    { key: 'principles', label: 'Principles', type: 'array', itemFields: [
      { key: 'number', label: 'Number', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ]},
  ],

  'je-offerings-grid': [
    { key: 'label', label: 'Section Label', type: 'text' },
    { key: 'title', label: 'Section Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'columns', label: 'Columns', type: 'number', min: 2, max: 4 },
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'cards', label: 'Cards' },
      { value: 'minimal', label: 'Minimal' },
    ]},
    { key: 'dark', label: 'Dark Mode', type: 'boolean' },
    { key: 'offerings', label: 'Offerings', type: 'array', itemFields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'imageUrl', label: 'Image', type: 'image' },
      { key: 'price', label: 'Price', type: 'text' },
      { key: 'link', label: 'Link', type: 'url' },
      { key: 'badge', label: 'Badge Text', type: 'text' },
    ]},
  ],

  'je-offerings-carousel': [
    // === DATA SOURCE ===
    { key: 'useAdminCarousel', label: 'Use Admin Carousel', type: 'boolean', description: 'Connect to a carousel managed in Admin Dashboard', group: 'content' },
    { key: 'carouselSlug', label: 'Admin Carousel Slug', type: 'text', placeholder: 'e.g., homepage-offerings', description: 'Enter the slug of an admin-managed carousel', group: 'content' },
    
    // === CONTENT GROUP ===
    { key: 'label', label: 'Section Label', type: 'text', group: 'content' },
    { key: 'title', label: 'Section Title', type: 'text', group: 'content' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', group: 'content' },
    { key: 'showTitle', label: 'Show Title Section', type: 'boolean', group: 'content' },
    
    // === CAROUSEL SETTINGS ===
    { key: 'autoplay', label: 'Autoplay', type: 'boolean', group: 'layout' },
    { key: 'interval', label: 'Interval (ms)', type: 'number', min: 1000, max: 10000, group: 'layout' },
    { key: 'showDots', label: 'Show Dots', type: 'boolean', group: 'layout' },
    { key: 'showArrows', label: 'Show Arrows', type: 'boolean', group: 'layout' },
    
    // === SHAPE & SIZE ===
    { key: 'cardBorderRadius', label: 'Card Border Radius', type: 'text', placeholder: '2rem', group: 'style' },
    { key: 'cardHeight', label: 'Card Height', type: 'text', placeholder: '400px', group: 'style' },
    { key: 'cardWidth', label: 'Card Width', type: 'text', placeholder: '30vw', group: 'style' },
    
    // === SPACING ===
    { key: 'cardGap', label: 'Card Gap', type: 'text', placeholder: '3rem', group: 'layout' },
    { key: 'sectionPadding', label: 'Section Padding', type: 'text', placeholder: '6rem', group: 'layout' },
    
    // === MANUAL ITEMS (when not using admin carousel) ===
    { key: 'items', label: 'Carousel Items', type: 'array', description: 'Manual items (ignored when using Admin Carousel)', itemFields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'imageUrl', label: 'Image', type: 'image' },
      { key: 'link', label: 'Link', type: 'url' },
    ]},
  ],
  
  'je-carousel': [
    // === DATA SOURCE ===
    { key: 'useAdminCarousel', label: 'Use Admin Carousel', type: 'boolean', description: 'Connect to a carousel managed in Admin Dashboard', group: 'content' },
    { key: 'carouselSlug', label: 'Admin Carousel Slug', type: 'text', placeholder: 'e.g., homepage-hero', description: 'Enter the slug of an admin-managed carousel', group: 'content' },
    
    // === CAROUSEL SETTINGS ===
    { key: 'autoplay', label: 'Autoplay', type: 'boolean', group: 'layout' },
    { key: 'interval', label: 'Interval (ms)', type: 'number', min: 1000, max: 10000, group: 'layout' },
    { key: 'showDots', label: 'Show Dots', type: 'boolean', group: 'layout' },
    { key: 'showArrows', label: 'Show Arrows', type: 'boolean', group: 'layout' },
    { key: 'transition', label: 'Transition', type: 'select', options: [
      { value: 'fade', label: 'Fade' },
      { value: 'slide', label: 'Slide' },
      { value: 'zoom', label: 'Zoom' },
    ], group: 'style' },
    
    // === MANUAL SLIDES (when not using admin carousel) ===
    { key: 'slides', label: 'Slides', type: 'array', description: 'Manual slides (ignored when using Admin Carousel)', itemFields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'imageUrl', label: 'Image', type: 'image' },
      { key: 'link', label: 'Link', type: 'url' },
    ]},
  ],

  'je-community': [
    { key: 'label', label: 'Section Label', type: 'text' },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'imageUrl', label: 'Background Image', type: 'image' },
    { key: 'ctaText', label: 'Button Text', type: 'text' },
    { key: 'ctaLink', label: 'Button Link', type: 'url' },
    { key: 'dark', label: 'Dark Mode', type: 'boolean' },
    { key: 'stats', label: 'Statistics', type: 'array', itemFields: [
      { key: 'value', label: 'Value', type: 'text' },
      { key: 'label', label: 'Label', type: 'text' },
    ]},
  ],

  'je-coming-soon': [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'launchDate', label: 'Launch Date', type: 'text' },
    { key: 'imageUrl', label: 'Background Image', type: 'image' },
    { key: 'showCountdown', label: 'Show Countdown', type: 'boolean' },
    { key: 'notifyEnabled', label: 'Enable Email Signup', type: 'boolean' },
    { key: 'notifyPlaceholder', label: 'Email Placeholder', type: 'text' },
    { key: 'notifyButtonText', label: 'Submit Button Text', type: 'text' },
    { key: 'dark', label: 'Dark Mode', type: 'boolean' },
  ],

  'je-team-member': [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'role', label: 'Role/Position', type: 'text' },
    { key: 'bio', label: 'Bio', type: 'textarea' },
    { key: 'imageUrl', label: 'Photo', type: 'image' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'card', label: 'Card' },
      { value: 'minimal', label: 'Minimal' },
    ]},
    { key: 'socialLinks', label: 'Social Links', type: 'array', itemFields: [
      { key: 'platform', label: 'Platform', type: 'select', options: [
        { value: 'instagram', label: 'Instagram' },
        { value: 'facebook', label: 'Facebook' },
        { value: 'twitter', label: 'Twitter' },
        { value: 'linkedin', label: 'LinkedIn' },
      ]},
      { key: 'url', label: 'URL', type: 'url' },
    ]},
  ],

  'je-feature-card': [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'icon', label: 'Icon', type: 'icon' },
    { key: 'imageUrl', label: 'Image', type: 'image' },
    { key: 'link', label: 'Link URL', type: 'url' },
    { key: 'dark', label: 'Dark Mode', type: 'boolean' },
  ],

  'je-volumes': [
    { key: 'label', label: 'Section Label', type: 'text' },
    { key: 'title', label: 'Section Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'cardRadius', label: 'Card Border Radius', type: 'text', placeholder: '1rem' },
    { key: 'dark', label: 'Dark Mode', type: 'boolean' },
    { key: 'volumes', label: 'Volumes', type: 'array', itemFields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'imageUrl', label: 'Cover Image', type: 'image' },
      { key: 'link', label: 'Link', type: 'url' },
    ]},
  ],

  // ========================================
  // JE INTERACTIVE BLOCKS
  // ========================================
  'je-newsletter': [
    { key: 'title', label: 'Title', type: 'text', placeholder: 'Stay Connected' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'placeholder', label: 'Input Placeholder', type: 'text', placeholder: 'Enter your email' },
    { key: 'buttonText', label: 'Button Text', type: 'text', placeholder: 'Subscribe' },
    { key: 'successMessage', label: 'Success Message', type: 'text' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'alignment', label: 'Alignment', type: 'alignment' },
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'elegant', label: 'Elegant' },
      { value: 'simple', label: 'Simple' },
      { value: 'stacked', label: 'Stacked' },
    ]},
    { key: 'dark', label: 'Dark Mode', type: 'boolean' },
  ],

  'je-contact-form': [
    // === CONTENT GROUP ===
    { key: 'title', label: 'Title', type: 'text', group: 'content' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', group: 'content' },
    { key: 'description', label: 'Description', type: 'textarea', group: 'content' },
    { key: 'submitText', label: 'Submit Button Text', type: 'text', group: 'content' },
    { key: 'successMessage', label: 'Success Message', type: 'text', group: 'content' },
    
    // === STYLE GROUP ===
    { key: 'dark', label: 'Dark Mode', type: 'boolean', group: 'style' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color', group: 'style' },
    { key: 'textColor', label: 'Text Color', type: 'color', group: 'style' },
    
    // === SHAPE & SIZE GROUP ===
    { key: 'borderRadius', label: 'Border Radius', type: 'text', placeholder: '24px', group: 'layout' },
    { key: 'maxWidth', label: 'Max Width', type: 'text', placeholder: '2xl', group: 'layout' },
    { key: 'formWidth', label: 'Form Width', type: 'text', placeholder: '100%', group: 'layout' },
    
    // === SPACING GROUP ===
    { key: 'paddingTop', label: 'Padding Top', type: 'text', placeholder: '24', group: 'layout' },
    { key: 'paddingBottom', label: 'Padding Bottom', type: 'text', placeholder: '24', group: 'layout' },
    { key: 'paddingLeft', label: 'Padding Left', type: 'text', placeholder: '6', group: 'layout' },
    { key: 'paddingRight', label: 'Padding Right', type: 'text', placeholder: '6', group: 'layout' },
    { key: 'inputSpacing', label: 'Input Spacing', type: 'text', placeholder: '4', group: 'layout' },
    
    // === ALIGNMENT GROUP ===
    { key: 'contentAlign', label: 'Content Align', type: 'select', options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ], group: 'layout' },
    { key: 'formAlign', label: 'Form Align', type: 'select', options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ], group: 'layout' },
    
    // === FORM FIELDS ===
    { key: 'fields', label: 'Form Fields', type: 'array', itemFields: [
      { key: 'name', label: 'Field Name', type: 'text' },
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'type', label: 'Type', type: 'select', options: [
        { value: 'text', label: 'Text' },
        { value: 'email', label: 'Email' },
        { value: 'phone', label: 'Phone' },
        { value: 'textarea', label: 'Textarea' },
        { value: 'select', label: 'Select' },
      ]},
      { key: 'required', label: 'Required', type: 'boolean' },
      { key: 'placeholder', label: 'Placeholder', type: 'text' },
    ]},
  ],
  
  'je-calendar': [
    // === CONTENT GROUP ===
    { key: 'title', label: 'Title', type: 'text', group: 'content' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', group: 'content' },
    { key: 'viewMode', label: 'View Mode', type: 'select', options: [
      { value: 'calendar', label: 'Calendar View' },
      { value: 'list', label: 'List View' },
      { value: 'grid', label: 'Grid View' },
    ], group: 'content' },
    { key: 'showFilters', label: 'Show Filters', type: 'boolean', group: 'content' },
    
    // === STYLE GROUP ===
    { key: 'dark', label: 'Dark Mode', type: 'boolean', group: 'style' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color', group: 'style' },
    
    // === SHAPE & SIZE GROUP ===
    { key: 'borderRadius', label: 'Border Radius', type: 'text', placeholder: '24px', group: 'layout' },
    { key: 'maxWidth', label: 'Max Width', type: 'select', options: [
      { value: '4xl', label: 'Medium (4xl)' },
      { value: '5xl', label: 'Large (5xl)' },
      { value: '6xl', label: 'Wide (6xl)' },
      { value: '7xl', label: 'Extra Wide (7xl)' },
    ], group: 'layout' },
    
    // === SPACING GROUP ===
    { key: 'paddingTop', label: 'Padding Top', type: 'text', placeholder: '24', group: 'layout' },
    { key: 'paddingBottom', label: 'Padding Bottom', type: 'text', placeholder: '24', group: 'layout' },
    { key: 'paddingLeft', label: 'Padding Left', type: 'text', placeholder: '6', group: 'layout' },
    { key: 'paddingRight', label: 'Padding Right', type: 'text', placeholder: '6', group: 'layout' },
    
    // === ALIGNMENT GROUP ===
    { key: 'contentAlign', label: 'Content Align', type: 'select', options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ], group: 'layout' },
    
    // === EVENT TYPES ===
    { key: 'eventTypes', label: 'Event Types', type: 'array', itemFields: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'color', label: 'Color', type: 'color' },
    ]},
    
    // === EVENTS ===
    { key: 'events', label: 'Events', type: 'array', itemFields: [
      { key: 'date', label: 'Date', type: 'text', placeholder: 'YYYY-MM-DD' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'link', label: 'Link', type: 'url' },
    ]},
  ],

  'je-faq': [
    { key: 'label', label: 'Section Label', type: 'text' },
    { key: 'title', label: 'Section Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'elegant', label: 'Elegant' },
      { value: 'simple', label: 'Simple' },
      { value: 'bordered', label: 'Bordered' },
    ]},
    { key: 'allowMultiple', label: 'Allow Multiple Open', type: 'boolean' },
    { key: 'dark', label: 'Dark Mode', type: 'boolean' },
    { key: 'items', label: 'FAQ Items', type: 'array', itemFields: [
      { key: 'question', label: 'Question', type: 'text' },
      { key: 'answer', label: 'Answer', type: 'textarea' },
    ]},
  ],

  'je-testimonial': [
    { key: 'quote', label: 'Quote', type: 'textarea' },
    { key: 'author', label: 'Author Name', type: 'text' },
    { key: 'role', label: 'Role/Title', type: 'text' },
    { key: 'imageUrl', label: 'Author Image', type: 'image' },
    { key: 'rating', label: 'Rating (1-5)', type: 'number', min: 0, max: 5 },
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'card', label: 'Card' },
      { value: 'minimal', label: 'Minimal' },
    ]},
    { key: 'dark', label: 'Dark Mode', type: 'boolean' },
  ],

  'je-testimonials-grid': [
    { key: 'label', label: 'Section Label', type: 'text' },
    { key: 'title', label: 'Section Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'columns', label: 'Columns', type: 'number', min: 1, max: 4 },
    { key: 'dark', label: 'Dark Mode', type: 'boolean' },
    { key: 'testimonials', label: 'Testimonials', type: 'array', itemFields: [
      { key: 'quote', label: 'Quote', type: 'textarea' },
      { key: 'author', label: 'Author', type: 'text' },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'imageUrl', label: 'Image', type: 'image' },
      { key: 'rating', label: 'Rating', type: 'number', min: 0, max: 5 },
    ]},
  ],

  'je-button': [
    { key: 'text', label: 'Button Text', type: 'text', placeholder: 'Click Here' },
    { key: 'link', label: 'Link URL', type: 'url' },
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'primary', label: 'Primary' },
      { value: 'secondary', label: 'Secondary' },
      { value: 'ghost', label: 'Ghost' },
      { value: 'elegant', label: 'Elegant' },
    ]},
    { key: 'size', label: 'Size', type: 'select', options: [
      { value: 'sm', label: 'Small' },
      { value: 'default', label: 'Default' },
      { value: 'lg', label: 'Large' },
    ]},
    { key: 'fullWidth', label: 'Full Width', type: 'boolean' },
    { key: 'icon', label: 'Icon', type: 'icon' },
    { key: 'iconPosition', label: 'Icon Position', type: 'select', options: [
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
    ]},
    { key: 'alignment', label: 'Alignment', type: 'alignment' },
  ],

  // ========================================
  // JE LAYOUT BLOCKS
  // ========================================
  'je-divider': [
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'line', label: 'Line' },
      { value: 'dots', label: 'Dots' },
      { value: 'ornament', label: 'Ornament' },
      { value: 'gradient', label: 'Gradient' },
    ]},
    { key: 'color', label: 'Color', type: 'color' },
    { key: 'width', label: 'Width', type: 'select', options: WIDTH_OPTIONS },
    { key: 'spacing', label: 'Spacing', type: 'select', options: [
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
    ]},
  ],

  'je-spacer': [
    { key: 'height', label: 'Height (px)', type: 'number', min: 0, max: 500 },
    { key: 'mobileHeight', label: 'Mobile Height (px)', type: 'number', min: 0, max: 500 },
  ],

  'je-two-column': [
    { key: 'leftContent', label: 'Left Column Content', type: 'richtext' },
    { key: 'rightContent', label: 'Right Column Content', type: 'richtext' },
    { key: 'ratio', label: 'Column Ratio', type: 'select', options: [
      { value: '50-50', label: '50/50' },
      { value: '33-67', label: '33/67' },
      { value: '67-33', label: '67/33' },
      { value: '25-75', label: '25/75' },
      { value: '75-25', label: '75/25' },
    ]},
    { key: 'gap', label: 'Gap', type: 'number', min: 0, max: 16 },
    { key: 'reverseOnMobile', label: 'Reverse on Mobile', type: 'boolean' },
    { key: 'verticalAlign', label: 'Vertical Alignment', type: 'select', options: [
      { value: 'top', label: 'Top' },
      { value: 'center', label: 'Center' },
      { value: 'bottom', label: 'Bottom' },
    ]},
  ],

  'je-footer': [
    { key: 'logo', label: 'Logo URL', type: 'image' },
    { key: 'tagline', label: 'Tagline', type: 'text' },
    { key: 'copyright', label: 'Copyright Text', type: 'text' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'columns', label: 'Link Columns', type: 'array', itemFields: [
      { key: 'title', label: 'Column Title', type: 'text' },
      { key: 'links', label: 'Links', type: 'array', itemFields: [
        { key: 'text', label: 'Link Text', type: 'text' },
        { key: 'url', label: 'URL', type: 'url' },
      ]},
    ]},
    { key: 'socialLinks', label: 'Social Links', type: 'array', itemFields: [
      { key: 'platform', label: 'Platform', type: 'select', options: [
        { value: 'instagram', label: 'Instagram' },
        { value: 'facebook', label: 'Facebook' },
        { value: 'twitter', label: 'Twitter' },
        { value: 'linkedin', label: 'LinkedIn' },
        { value: 'youtube', label: 'YouTube' },
      ]},
      { key: 'url', label: 'URL', type: 'url' },
    ]},
  ],
};

// ============================================================================
// STANDARD BLOCK FIELD DEFINITIONS
// ============================================================================

export const STANDARD_BLOCK_FIELDS: Record<string, FieldDefinition[]> = {
  'hero': [
    // === CONTENT ===
    { key: 'headline', label: 'Headline', type: 'text', group: 'content' },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', group: 'content' },
    { key: 'ctaText', label: 'Button Text', type: 'text', group: 'content' },
    { key: 'ctaLink', label: 'Button Link', type: 'url', group: 'content' },
    { key: 'secondaryCtaText', label: 'Secondary Button', type: 'text', group: 'content' },
    { key: 'secondaryCtaLink', label: 'Secondary Link', type: 'url', group: 'content' },
    // === MEDIA ===
    { key: 'backgroundImage', label: 'Background Image', type: 'image', group: 'media' },
    { key: 'backgroundVideo', label: 'Background Video', type: 'video', group: 'media' },
    // === STYLE ===
    { key: 'backgroundColor', label: 'Background Color', type: 'color', group: 'style' },
    { key: 'headlineColor', label: 'Headline Color', type: 'color', group: 'style' },
    { key: 'subheadlineColor', label: 'Subheadline Color', type: 'color', group: 'style' },
    { key: 'overlay', label: 'Show Overlay', type: 'boolean', group: 'style' },
    { key: 'overlayOpacity', label: 'Overlay Opacity', type: 'number', min: 0, max: 100, group: 'style' },
    { key: 'overlayColor', label: 'Overlay Color', type: 'color', group: 'style' },
    // === LAYOUT ===
    { key: 'variant', label: 'Layout', type: 'select', options: [
      { value: 'centered', label: 'Centered' },
      { value: 'left', label: 'Left Aligned' },
      { value: 'right', label: 'Right Aligned' },
      { value: 'split', label: 'Split' },
    ], group: 'layout' },
    { key: 'minHeight', label: 'Minimum Height', type: 'text', placeholder: '80vh', group: 'layout' },
    { key: 'maxWidth', label: 'Content Max Width', type: 'select', options: [
      { value: '2xl', label: 'Narrow' },
      { value: '4xl', label: 'Medium' },
      { value: '6xl', label: 'Wide' },
    ], group: 'layout' },
    { key: 'verticalAlign', label: 'Vertical Align', type: 'select', options: [
      { value: 'top', label: 'Top' },
      { value: 'center', label: 'Center' },
      { value: 'bottom', label: 'Bottom' },
    ], group: 'layout' },
    { key: 'paddingTop', label: 'Padding Top', type: 'text', placeholder: '6rem', group: 'layout' },
    { key: 'paddingBottom', label: 'Padding Bottom', type: 'text', placeholder: '6rem', group: 'layout' },
    // === TYPOGRAPHY ===
    { key: 'headlineFontSize', label: 'Headline Font Size', type: 'text', placeholder: '4rem', group: 'advanced' },
    { key: 'headlineFontWeight', label: 'Headline Font Weight', type: 'select', options: [
      { value: '300', label: 'Light' },
      { value: '400', label: 'Normal' },
      { value: '600', label: 'Semi Bold' },
      { value: '700', label: 'Bold' },
    ], group: 'advanced' },
    { key: 'buttonVariant', label: 'Button Style', type: 'select', options: [
      { value: 'primary', label: 'Primary' },
      { value: 'secondary', label: 'Secondary' },
      { value: 'outline', label: 'Outline' },
    ], group: 'advanced' },
    { key: 'buttonBorderRadius', label: 'Button Border Radius', type: 'text', placeholder: '9999px', group: 'advanced' },
  ],

  'text': [
    // === CONTENT ===
    { key: 'content', label: 'Content', type: 'richtext', group: 'content' },
    // === STYLE ===
    { key: 'textColor', label: 'Text Color', type: 'color', group: 'style' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color', group: 'style' },
    // === LAYOUT ===
    { key: 'alignment', label: 'Alignment', type: 'alignment', group: 'layout' },
    { key: 'maxWidth', label: 'Max Width', type: 'select', options: [
      { value: '2xl', label: 'Narrow' },
      { value: '4xl', label: 'Medium' },
      { value: '6xl', label: 'Wide' },
      { value: 'full', label: 'Full' },
    ], group: 'layout' },
    { key: 'paddingTop', label: 'Padding Top', type: 'text', placeholder: '0', group: 'layout' },
    { key: 'paddingBottom', label: 'Padding Bottom', type: 'text', placeholder: '0', group: 'layout' },
    // === TYPOGRAPHY ===
    { key: 'fontSize', label: 'Font Size', type: 'select', options: [
      { value: 'sm', label: 'Small' },
      { value: 'base', label: 'Normal' },
      { value: 'lg', label: 'Large' },
      { value: 'xl', label: 'Extra Large' },
    ], group: 'advanced' },
    { key: 'lineHeight', label: 'Line Height', type: 'select', options: [
      { value: 'tight', label: 'Tight' },
      { value: 'normal', label: 'Normal' },
      { value: 'relaxed', label: 'Relaxed' },
    ], group: 'advanced' },
  ],

  'heading': [
    // === CONTENT ===
    { key: 'text', label: 'Heading Text', type: 'text', group: 'content' },
    { key: 'level', label: 'Level', type: 'select', options: HEADING_LEVEL_OPTIONS, group: 'content' },
    // === STYLE ===
    { key: 'color', label: 'Color', type: 'color', group: 'style' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color', group: 'style' },
    // === LAYOUT ===
    { key: 'alignment', label: 'Alignment', type: 'alignment', group: 'layout' },
    { key: 'maxWidth', label: 'Max Width', type: 'select', options: [
      { value: '2xl', label: 'Narrow' },
      { value: '4xl', label: 'Medium' },
      { value: 'full', label: 'Full' },
    ], group: 'layout' },
    { key: 'marginTop', label: 'Margin Top', type: 'text', placeholder: '0', group: 'layout' },
    { key: 'marginBottom', label: 'Margin Bottom', type: 'text', placeholder: '1rem', group: 'layout' },
    // === TYPOGRAPHY ===
    { key: 'fontSize', label: 'Font Size', type: 'text', placeholder: 'auto', group: 'advanced' },
    { key: 'fontWeight', label: 'Font Weight', type: 'select', options: [
      { value: '300', label: 'Light' },
      { value: '400', label: 'Normal' },
      { value: '600', label: 'Semi Bold' },
      { value: '700', label: 'Bold' },
    ], group: 'advanced' },
    { key: 'fontStyle', label: 'Font Style', type: 'select', options: [
      { value: 'normal', label: 'Normal' },
      { value: 'italic', label: 'Italic' },
    ], group: 'advanced' },
    { key: 'textTransform', label: 'Text Transform', type: 'select', options: [
      { value: 'none', label: 'None' },
      { value: 'uppercase', label: 'Uppercase' },
      { value: 'capitalize', label: 'Capitalize' },
    ], group: 'advanced' },
  ],

  'quote': [
    // === CONTENT ===
    { key: 'quote', label: 'Quote Text', type: 'textarea', group: 'content' },
    { key: 'author', label: 'Author', type: 'text', group: 'content' },
    { key: 'role', label: 'Role', type: 'text', group: 'content' },
    { key: 'authorImage', label: 'Author Image', type: 'image', group: 'media' },
    // === STYLE ===
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'default', label: 'Default' },
      { value: 'bordered', label: 'Bordered' },
      { value: 'modern', label: 'Modern' },
      { value: 'large', label: 'Large' },
      { value: 'card', label: 'Card' },
    ], group: 'style' },
    { key: 'quoteColor', label: 'Quote Color', type: 'color', group: 'style' },
    { key: 'authorColor', label: 'Author Color', type: 'color', group: 'style' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color', group: 'style' },
    { key: 'borderColor', label: 'Border Color', type: 'color', group: 'style' },
    // === LAYOUT ===
    { key: 'alignment', label: 'Alignment', type: 'alignment', group: 'layout' },
    { key: 'maxWidth', label: 'Max Width', type: 'select', options: [
      { value: '2xl', label: 'Narrow' },
      { value: '4xl', label: 'Medium' },
      { value: '6xl', label: 'Wide' },
    ], group: 'layout' },
    // === TYPOGRAPHY ===
    { key: 'quoteFontSize', label: 'Quote Font Size', type: 'text', placeholder: '24px', group: 'advanced' },
    { key: 'quoteFontStyle', label: 'Quote Font Style', type: 'select', options: [
      { value: 'normal', label: 'Normal' },
      { value: 'italic', label: 'Italic' },
    ], group: 'advanced' },
  ],

  'feature-grid': [
    // === CONTENT ===
    { key: 'heading', label: 'Heading', type: 'text', group: 'content' },
    { key: 'subheading', label: 'Subheading', type: 'text', group: 'content' },
    { key: 'description', label: 'Description', type: 'textarea', group: 'content' },
    // === LAYOUT ===
    { key: 'columns', label: 'Columns', type: 'number', min: 2, max: 4, group: 'layout' },
    { key: 'gap', label: 'Gap', type: 'select', options: [
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
    ], group: 'layout' },
    { key: 'alignment', label: 'Alignment', type: 'alignment', group: 'layout' },
    { key: 'paddingTop', label: 'Padding Top', type: 'text', placeholder: '4rem', group: 'layout' },
    { key: 'paddingBottom', label: 'Padding Bottom', type: 'text', placeholder: '4rem', group: 'layout' },
    // === STYLE ===
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'default', label: 'Default' },
      { value: 'cards', label: 'Cards' },
      { value: 'minimal', label: 'Minimal' },
      { value: 'bordered', label: 'Bordered' },
    ], group: 'style' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color', group: 'style' },
    { key: 'cardBackgroundColor', label: 'Card Background', type: 'color', group: 'style' },
    { key: 'iconColor', label: 'Icon Color', type: 'color', group: 'style' },
    { key: 'titleColor', label: 'Title Color', type: 'color', group: 'style' },
    // === FEATURES ===
    { key: 'features', label: 'Features', type: 'array', itemFields: [
      { key: 'icon', label: 'Icon', type: 'icon' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'link', label: 'Link', type: 'url' },
    ]},
  ],

  'testimonials': [
    // === CONTENT ===
    { key: 'heading', label: 'Heading', type: 'text', group: 'content' },
    { key: 'subheading', label: 'Subheading', type: 'text', group: 'content' },
    // === LAYOUT ===
    { key: 'columns', label: 'Columns', type: 'number', min: 1, max: 4, group: 'layout' },
    { key: 'layout', label: 'Layout', type: 'select', options: [
      { value: 'grid', label: 'Grid' },
      { value: 'carousel', label: 'Carousel' },
    ], group: 'layout' },
    // === STYLE ===
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'default', label: 'Default' },
      { value: 'cards', label: 'Cards' },
      { value: 'minimal', label: 'Minimal' },
    ], group: 'style' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color', group: 'style' },
    { key: 'cardBackgroundColor', label: 'Card Background', type: 'color', group: 'style' },
    { key: 'showRating', label: 'Show Rating', type: 'boolean', group: 'style' },
    { key: 'showAvatar', label: 'Show Avatar', type: 'boolean', group: 'style' },
    // === TESTIMONIALS ===
    { key: 'testimonials', label: 'Testimonials', type: 'array', itemFields: [
      { key: 'quote', label: 'Quote', type: 'textarea' },
      { key: 'author', label: 'Author', type: 'text' },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'company', label: 'Company', type: 'text' },
      { key: 'avatar', label: 'Avatar', type: 'image' },
      { key: 'rating', label: 'Rating', type: 'number', min: 0, max: 5 },
    ]},
  ],

  'stats': [
    // === CONTENT ===
    { key: 'heading', label: 'Heading', type: 'text', group: 'content' },
    { key: 'description', label: 'Description', type: 'textarea', group: 'content' },
    // === LAYOUT ===
    { key: 'columns', label: 'Columns', type: 'number', min: 2, max: 6, group: 'layout' },
    { key: 'alignment', label: 'Alignment', type: 'alignment', group: 'layout' },
    // === STYLE ===
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'default', label: 'Default' },
      { value: 'cards', label: 'Cards' },
      { value: 'minimal', label: 'Minimal' },
    ], group: 'style' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color', group: 'style' },
    { key: 'valueColor', label: 'Value Color', type: 'color', group: 'style' },
    { key: 'labelColor', label: 'Label Color', type: 'color', group: 'style' },
    { key: 'animate', label: 'Animate Numbers', type: 'boolean', group: 'style' },
    // === STATS ===
    { key: 'stats', label: 'Statistics', type: 'array', itemFields: [
      { key: 'value', label: 'Value', type: 'text' },
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'prefix', label: 'Prefix', type: 'text' },
      { key: 'suffix', label: 'Suffix', type: 'text' },
      { key: 'icon', label: 'Icon', type: 'icon' },
    ]},
  ],

  'cta': [
    // === CONTENT ===
    { key: 'heading', label: 'Heading', type: 'text', group: 'content' },
    { key: 'description', label: 'Description', type: 'textarea', group: 'content' },
    { key: 'primaryButtonText', label: 'Primary Button', type: 'text', group: 'content' },
    { key: 'primaryButtonLink', label: 'Primary Link', type: 'url', group: 'content' },
    { key: 'secondaryButtonText', label: 'Secondary Button', type: 'text', group: 'content' },
    { key: 'secondaryButtonLink', label: 'Secondary Link', type: 'url', group: 'content' },
    // === MEDIA ===
    { key: 'backgroundImage', label: 'Background Image', type: 'image', group: 'media' },
    // === LAYOUT ===
    { key: 'variant', label: 'Layout', type: 'select', options: [
      { value: 'centered', label: 'Centered' },
      { value: 'split', label: 'Split' },
      { value: 'stacked', label: 'Stacked' },
    ], group: 'layout' },
    { key: 'alignment', label: 'Alignment', type: 'alignment', group: 'layout' },
    { key: 'maxWidth', label: 'Max Width', type: 'select', options: [
      { value: '2xl', label: 'Narrow' },
      { value: '4xl', label: 'Medium' },
      { value: '6xl', label: 'Wide' },
    ], group: 'layout' },
    { key: 'paddingTop', label: 'Padding Top', type: 'text', placeholder: '4rem', group: 'layout' },
    { key: 'paddingBottom', label: 'Padding Bottom', type: 'text', placeholder: '4rem', group: 'layout' },
    // === STYLE ===
    { key: 'backgroundColor', label: 'Background Color', type: 'color', group: 'style' },
    { key: 'headingColor', label: 'Heading Color', type: 'color', group: 'style' },
    { key: 'descriptionColor', label: 'Description Color', type: 'color', group: 'style' },
    { key: 'buttonBorderRadius', label: 'Button Border Radius', type: 'text', placeholder: '9999px', group: 'advanced' },
  ],

  'accordion': [
    // === CONTENT ===
    { key: 'heading', label: 'Heading', type: 'text', group: 'content' },
    { key: 'description', label: 'Description', type: 'textarea', group: 'content' },
    { key: 'allowMultiple', label: 'Allow Multiple Open', type: 'boolean', group: 'content' },
    { key: 'defaultOpen', label: 'Default Open Index', type: 'number', min: -1, max: 20, group: 'content' },
    // === STYLE ===
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'default', label: 'Default' },
      { value: 'bordered', label: 'Bordered' },
      { value: 'separated', label: 'Separated' },
    ], group: 'style' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color', group: 'style' },
    { key: 'headerBackgroundColor', label: 'Header Background', type: 'color', group: 'style' },
    { key: 'borderColor', label: 'Border Color', type: 'color', group: 'style' },
    { key: 'iconPosition', label: 'Icon Position', type: 'select', options: [
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
    ], group: 'style' },
    // === ITEMS ===
    { key: 'items', label: 'Items', type: 'array', itemFields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'content', label: 'Content', type: 'textarea' },
      { key: 'icon', label: 'Icon', type: 'icon' },
    ]},
  ],

  'tabs': [
    // === STYLE ===
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'default', label: 'Default' },
      { value: 'pills', label: 'Pills' },
      { value: 'underline', label: 'Underline' },
      { value: 'boxed', label: 'Boxed' },
    ], group: 'style' },
    { key: 'alignment', label: 'Tab Alignment', type: 'select', options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ], group: 'layout' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color', group: 'style' },
    { key: 'activeTabColor', label: 'Active Tab Color', type: 'color', group: 'style' },
    // === TABS ===
    { key: 'tabs', label: 'Tabs', type: 'array', itemFields: [
      { key: 'title', label: 'Tab Title', type: 'text' },
      { key: 'icon', label: 'Tab Icon', type: 'icon' },
      { key: 'content', label: 'Content', type: 'richtext' },
    ]},
  ],

  'image': [
    // === MEDIA ===
    { key: 'src', label: 'Image URL', type: 'image', required: true, group: 'media' },
    { key: 'alt', label: 'Alt Text', type: 'text', group: 'content' },
    { key: 'caption', label: 'Caption', type: 'text', group: 'content' },
    // === LAYOUT ===
    { key: 'width', label: 'Width', type: 'select', options: WIDTH_OPTIONS, group: 'layout' },
    { key: 'height', label: 'Height', type: 'text', placeholder: 'auto', group: 'layout' },
    { key: 'maxWidth', label: 'Max Width', type: 'text', placeholder: '100%', group: 'layout' },
    { key: 'alignment', label: 'Alignment', type: 'alignment', group: 'layout' },
    { key: 'objectFit', label: 'Object Fit', type: 'select', options: [
      { value: 'cover', label: 'Cover' },
      { value: 'contain', label: 'Contain' },
      { value: 'fill', label: 'Fill' },
    ], group: 'layout' },
    // === STYLE ===
    { key: 'rounded', label: 'Border Radius', type: 'select', options: ROUNDED_OPTIONS, group: 'style' },
    { key: 'shadow', label: 'Shadow', type: 'select', options: [
      { value: 'none', label: 'None' },
      { value: 'sm', label: 'Small' },
      { value: 'md', label: 'Medium' },
      { value: 'lg', label: 'Large' },
    ], group: 'style' },
    { key: 'border', label: 'Border', type: 'boolean', group: 'style' },
    { key: 'borderColor', label: 'Border Color', type: 'color', group: 'style' },
    // === INTERACTION ===
    { key: 'link', label: 'Link URL', type: 'url', group: 'content' },
    { key: 'lightbox', label: 'Enable Lightbox', type: 'boolean', group: 'content' },
    { key: 'hoverEffect', label: 'Hover Effect', type: 'select', options: [
      { value: 'none', label: 'None' },
      { value: 'zoom', label: 'Zoom' },
      { value: 'brightness', label: 'Brightness' },
    ], group: 'style' },
    // === SPACING ===
    { key: 'marginTop', label: 'Margin Top', type: 'text', placeholder: '0', group: 'layout' },
    { key: 'marginBottom', label: 'Margin Bottom', type: 'text', placeholder: '0', group: 'layout' },
  ],

  'video': [
    // === MEDIA ===
    { key: 'url', label: 'Video URL', type: 'video', required: true, group: 'media' },
    { key: 'poster', label: 'Poster Image', type: 'image', group: 'media' },
    { key: 'title', label: 'Title', type: 'text', group: 'content' },
    { key: 'caption', label: 'Caption', type: 'text', group: 'content' },
    // === PLAYBACK ===
    { key: 'autoplay', label: 'Autoplay', type: 'boolean', group: 'content' },
    { key: 'muted', label: 'Muted', type: 'boolean', group: 'content' },
    { key: 'loop', label: 'Loop', type: 'boolean', group: 'content' },
    { key: 'controls', label: 'Show Controls', type: 'boolean', group: 'content' },
    { key: 'playsInline', label: 'Plays Inline', type: 'boolean', group: 'content' },
    // === LAYOUT ===
    { key: 'aspectRatio', label: 'Aspect Ratio', type: 'select', options: ASPECT_RATIO_OPTIONS, group: 'layout' },
    { key: 'width', label: 'Width', type: 'select', options: WIDTH_OPTIONS, group: 'layout' },
    { key: 'maxWidth', label: 'Max Width', type: 'text', placeholder: '100%', group: 'layout' },
    { key: 'alignment', label: 'Alignment', type: 'alignment', group: 'layout' },
    // === STYLE ===
    { key: 'rounded', label: 'Border Radius', type: 'select', options: ROUNDED_OPTIONS, group: 'style' },
    { key: 'shadow', label: 'Shadow', type: 'select', options: [
      { value: 'none', label: 'None' },
      { value: 'sm', label: 'Small' },
      { value: 'md', label: 'Medium' },
      { value: 'lg', label: 'Large' },
    ], group: 'style' },
    // === SPACING ===
    { key: 'marginTop', label: 'Margin Top', type: 'text', placeholder: '0', group: 'layout' },
    { key: 'marginBottom', label: 'Margin Bottom', type: 'text', placeholder: '0', group: 'layout' },
  ],

  'spacer': [
    { key: 'height', label: 'Height (px)', type: 'number', min: 0, max: 500, group: 'layout' },
    { key: 'mobileHeight', label: 'Mobile Height (px)', type: 'number', min: 0, max: 500, group: 'layout' },
    { key: 'tabletHeight', label: 'Tablet Height (px)', type: 'number', min: 0, max: 500, group: 'layout' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color', group: 'style' },
  ],

  'divider': [
    { key: 'style', label: 'Style', type: 'select', options: [
      { value: 'solid', label: 'Solid' },
      { value: 'dashed', label: 'Dashed' },
      { value: 'dotted', label: 'Dotted' },
      { value: 'double', label: 'Double' },
      { value: 'gradient', label: 'Gradient' },
    ], group: 'style' },
    { key: 'color', label: 'Color', type: 'color', group: 'style' },
    { key: 'gradientFrom', label: 'Gradient From', type: 'color', group: 'style' },
    { key: 'gradientTo', label: 'Gradient To', type: 'color', group: 'style' },
    { key: 'width', label: 'Width', type: 'select', options: WIDTH_OPTIONS, group: 'layout' },
    { key: 'thickness', label: 'Thickness', type: 'select', options: [
      { value: '1px', label: 'Thin (1px)' },
      { value: '2px', label: 'Normal (2px)' },
      { value: '4px', label: 'Thick (4px)' },
    ], group: 'layout' },
    { key: 'marginTop', label: 'Margin Top', type: 'text', placeholder: '2rem', group: 'layout' },
    { key: 'marginBottom', label: 'Margin Bottom', type: 'text', placeholder: '2rem', group: 'layout' },
  ],

  'button': [
    // === CONTENT ===
    { key: 'text', label: 'Button Text', type: 'text', group: 'content' },
    { key: 'link', label: 'Link URL', type: 'url', group: 'content' },
    { key: 'icon', label: 'Icon', type: 'icon', group: 'content' },
    { key: 'iconPosition', label: 'Icon Position', type: 'select', options: [
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
    ], group: 'content' },
    // === STYLE ===
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'default', label: 'Default' },
      { value: 'primary', label: 'Primary' },
      { value: 'secondary', label: 'Secondary' },
      { value: 'outline', label: 'Outline' },
      { value: 'ghost', label: 'Ghost' },
    ], group: 'style' },
    { key: 'size', label: 'Size', type: 'select', options: [
      { value: 'sm', label: 'Small' },
      { value: 'default', label: 'Default' },
      { value: 'lg', label: 'Large' },
      { value: 'xl', label: 'Extra Large' },
    ], group: 'style' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color', group: 'style' },
    { key: 'textColor', label: 'Text Color', type: 'color', group: 'style' },
    { key: 'borderColor', label: 'Border Color', type: 'color', group: 'style' },
    { key: 'borderRadius', label: 'Border Radius', type: 'text', placeholder: '9999px', group: 'style' },
    { key: 'fullWidth', label: 'Full Width', type: 'boolean', group: 'layout' },
    // === LAYOUT ===
    { key: 'alignment', label: 'Alignment', type: 'alignment', group: 'layout' },
    { key: 'marginTop', label: 'Margin Top', type: 'text', placeholder: '0', group: 'layout' },
    { key: 'marginBottom', label: 'Margin Bottom', type: 'text', placeholder: '0', group: 'layout' },
  ],

  'pricing': [
    // === CONTENT ===
    { key: 'heading', label: 'Heading', type: 'text', group: 'content' },
    { key: 'description', label: 'Description', type: 'textarea', group: 'content' },
    // === LAYOUT ===
    { key: 'columns', label: 'Columns', type: 'number', min: 2, max: 4, group: 'layout' },
    // === STYLE ===
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'default', label: 'Default' },
      { value: 'cards', label: 'Cards' },
      { value: 'minimal', label: 'Minimal' },
    ], group: 'style' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color', group: 'style' },
    { key: 'highlightColor', label: 'Highlight Color', type: 'color', group: 'style' },
    { key: 'showToggle', label: 'Show Monthly/Yearly Toggle', type: 'boolean', group: 'content' },
    // === PLANS ===
    { key: 'plans', label: 'Plans', type: 'array', itemFields: [
      { key: 'name', label: 'Plan Name', type: 'text' },
      { key: 'price', label: 'Price', type: 'text' },
      { key: 'yearlyPrice', label: 'Yearly Price', type: 'text' },
      { key: 'period', label: 'Period', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'features', label: 'Features', type: 'stringarray' },
      { key: 'ctaText', label: 'Button Text', type: 'text' },
      { key: 'ctaLink', label: 'Button Link', type: 'url' },
      { key: 'highlighted', label: 'Highlighted', type: 'boolean' },
      { key: 'badge', label: 'Badge Text', type: 'text' },
    ]},
  ],

  'code': [
    // === CONTENT ===
    { key: 'code', label: 'Code', type: 'textarea', group: 'content' },
    { key: 'language', label: 'Language', type: 'select', options: [
      { value: 'javascript', label: 'JavaScript' },
      { value: 'typescript', label: 'TypeScript' },
      { value: 'html', label: 'HTML' },
      { value: 'css', label: 'CSS' },
      { value: 'python', label: 'Python' },
      { value: 'bash', label: 'Bash' },
      { value: 'json', label: 'JSON' },
      { value: 'sql', label: 'SQL' },
      { value: 'php', label: 'PHP' },
    ], group: 'content' },
    { key: 'filename', label: 'Filename', type: 'text', group: 'content' },
    { key: 'showLineNumbers', label: 'Show Line Numbers', type: 'boolean', group: 'style' },
    { key: 'highlightLines', label: 'Highlight Lines', type: 'text', placeholder: '1,3-5', group: 'style' },
    { key: 'theme', label: 'Theme', type: 'select', options: [
      { value: 'dark', label: 'Dark' },
      { value: 'light', label: 'Light' },
    ], group: 'style' },
    { key: 'maxHeight', label: 'Max Height', type: 'text', placeholder: 'auto', group: 'layout' },
    { key: 'borderRadius', label: 'Border Radius', type: 'text', placeholder: '0.5rem', group: 'style' },
  ],

  'html': [
    { key: 'html', label: 'HTML Content', type: 'richtext', group: 'content' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color', group: 'style' },
    { key: 'padding', label: 'Padding', type: 'text', placeholder: '0', group: 'layout' },
    { key: 'maxWidth', label: 'Max Width', type: 'select', options: [
      { value: '2xl', label: 'Narrow' },
      { value: '4xl', label: 'Medium' },
      { value: '6xl', label: 'Wide' },
      { value: 'full', label: 'Full' },
    ], group: 'layout' },
    { key: 'alignment', label: 'Alignment', type: 'alignment', group: 'layout' },
  ],

  // === ADDITIONAL BLOCKS ===
  'section': [
    // === STYLE ===
    { key: 'backgroundColor', label: 'Background Color', type: 'color', group: 'style' },
    { key: 'backgroundImage', label: 'Background Image', type: 'image', group: 'media' },
    { key: 'backgroundPosition', label: 'Background Position', type: 'select', options: [
      { value: 'center', label: 'Center' },
      { value: 'top', label: 'Top' },
      { value: 'bottom', label: 'Bottom' },
    ], group: 'style' },
    // === LAYOUT ===
    { key: 'paddingTop', label: 'Padding Top', type: 'text', placeholder: '4rem', group: 'layout' },
    { key: 'paddingBottom', label: 'Padding Bottom', type: 'text', placeholder: '4rem', group: 'layout' },
    { key: 'maxWidth', label: 'Max Width', type: 'select', options: [
      { value: 'container', label: 'Container' },
      { value: 'full', label: 'Full Width' },
    ], group: 'layout' },
    { key: 'minHeight', label: 'Minimum Height', type: 'text', placeholder: 'auto', group: 'layout' },
  ],

  'columns': [
    { key: 'columns', label: 'Number of Columns', type: 'number', min: 2, max: 6, group: 'layout' },
    { key: 'gap', label: 'Gap', type: 'select', options: [
      { value: 'none', label: 'None' },
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
    ], group: 'layout' },
    { key: 'verticalAlign', label: 'Vertical Align', type: 'select', options: [
      { value: 'top', label: 'Top' },
      { value: 'center', label: 'Center' },
      { value: 'bottom', label: 'Bottom' },
    ], group: 'layout' },
    { key: 'reverseOnMobile', label: 'Reverse on Mobile', type: 'boolean', group: 'layout' },
    { key: 'stackOnMobile', label: 'Stack on Mobile', type: 'boolean', group: 'layout' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color', group: 'style' },
  ],

  'grid': [
    { key: 'columns', label: 'Columns', type: 'number', min: 1, max: 6, group: 'layout' },
    { key: 'rows', label: 'Rows', type: 'number', min: 1, max: 10, group: 'layout' },
    { key: 'gap', label: 'Gap', type: 'select', options: [
      { value: 'none', label: 'None' },
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
    ], group: 'layout' },
    { key: 'mobileColumns', label: 'Mobile Columns', type: 'number', min: 1, max: 4, group: 'layout' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color', group: 'style' },
  ],

  'gallery': [
    { key: 'title', label: 'Title', type: 'text', group: 'content' },
    { key: 'columns', label: 'Columns', type: 'number', min: 2, max: 6, group: 'layout' },
    { key: 'gap', label: 'Gap', type: 'select', options: [
      { value: 'none', label: 'None' },
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
    ], group: 'layout' },
    { key: 'layout', label: 'Layout', type: 'select', options: [
      { value: 'grid', label: 'Grid' },
      { value: 'masonry', label: 'Masonry' },
    ], group: 'layout' },
    { key: 'rounded', label: 'Image Border Radius', type: 'select', options: ROUNDED_OPTIONS, group: 'style' },
    { key: 'lightbox', label: 'Enable Lightbox', type: 'boolean', group: 'content' },
    { key: 'images', label: 'Images', type: 'array', itemFields: [
      { key: 'src', label: 'Image URL', type: 'image' },
      { key: 'alt', label: 'Alt Text', type: 'text' },
      { key: 'caption', label: 'Caption', type: 'text' },
    ]},
  ],
};

// ============================================================================
// COMBINED FIELD DEFINITIONS
// ============================================================================

export const ALL_BLOCK_FIELDS: Record<string, FieldDefinition[]> = {
  ...JE_BLOCK_FIELDS,
  ...STANDARD_BLOCK_FIELDS,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get field definitions for a block type
 */
export function getBlockFields(blockType: string): FieldDefinition[] {
  return ALL_BLOCK_FIELDS[blockType] || [];
}

/**
 * Get fields grouped by category
 */
export function getGroupedFields(blockType: string): Record<string, FieldDefinition[]> {
  const fields = getBlockFields(blockType);
  const grouped: Record<string, FieldDefinition[]> = {
    content: [],
    media: [],
    layout: [],
    style: [],
    advanced: [],
  };

  fields.forEach(field => {
    const group = field.group || 'content';
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(field);
  });

  return grouped;
}

/**
 * Check if a block type has field definitions
 */
export function hasFieldDefinitions(blockType: string): boolean {
  return blockType in ALL_BLOCK_FIELDS;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default ALL_BLOCK_FIELDS;
