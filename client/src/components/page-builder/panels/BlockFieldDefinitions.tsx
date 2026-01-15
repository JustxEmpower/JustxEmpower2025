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
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'videoUrl', label: 'Video URL', type: 'video', required: true },
    { key: 'ctaText', label: 'Button Text', type: 'text' },
    { key: 'ctaLink', label: 'Button Link', type: 'url' },
    { key: 'overlay', label: 'Show Overlay', type: 'boolean' },
    { key: 'overlayOpacity', label: 'Overlay Opacity', type: 'number', min: 0, max: 100 },
    { key: 'dark', label: 'Dark Mode', type: 'boolean' },
  ],

  // ========================================
  // JE SECTION BLOCKS
  // ========================================
  'je-section-standard': [
    { key: 'label', label: 'Section Label', type: 'text', placeholder: 'SECTION LABEL' },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'htmlContent', label: 'HTML Content', type: 'richtext' },
    { key: 'imageUrl', label: 'Image', type: 'image' },
    { key: 'imagePosition', label: 'Image Position', type: 'select', options: [
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
      { value: 'top', label: 'Top' },
      { value: 'bottom', label: 'Bottom' },
    ]},
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'textColor', label: 'Text Color', type: 'color' },
    { key: 'padding', label: 'Padding', type: 'select', options: PADDING_OPTIONS },
    { key: 'alignment', label: 'Text Alignment', type: 'alignment' },
    { key: 'maxWidth', label: 'Max Width', type: 'select', options: [
      { value: '4xl', label: 'Narrow' },
      { value: '5xl', label: 'Medium' },
      { value: '6xl', label: 'Wide' },
      { value: '7xl', label: 'Extra Wide' },
    ]},
    { key: 'dark', label: 'Dark Mode', type: 'boolean' },
  ],

  'je-section-fullwidth': [
    { key: 'label', label: 'Section Label', type: 'text' },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'htmlContent', label: 'HTML Content', type: 'richtext' },
    { key: 'imageUrl', label: 'Background Image', type: 'image' },
    { key: 'videoUrl', label: 'Background Video', type: 'video' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'textColor', label: 'Text Color', type: 'color' },
    { key: 'padding', label: 'Padding', type: 'select', options: PADDING_OPTIONS },
    { key: 'alignment', label: 'Text Alignment', type: 'alignment' },
    { key: 'overlay', label: 'Show Overlay', type: 'boolean' },
    { key: 'dark', label: 'Dark Mode', type: 'boolean' },
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
    { key: 'fontSize', label: 'Font Size', type: 'select', options: [
      { value: 'sm', label: 'Small' },
      { value: 'base', label: 'Normal' },
      { value: 'lg', label: 'Large' },
      { value: 'xl', label: 'Extra Large' },
    ]},
    { key: 'lineHeight', label: 'Line Height', type: 'select', options: [
      { value: 'tight', label: 'Tight' },
      { value: 'normal', label: 'Normal' },
      { value: 'relaxed', label: 'Relaxed' },
      { value: 'loose', label: 'Loose' },
    ]},
    { key: 'maxWidth', label: 'Max Width', type: 'select', options: [
      { value: '2xl', label: 'Narrow' },
      { value: '4xl', label: 'Medium' },
      { value: '6xl', label: 'Wide' },
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

  'je-gallery': [
    { key: 'title', label: 'Gallery Title', type: 'text' },
    { key: 'columns', label: 'Columns', type: 'number', min: 2, max: 6 },
    { key: 'gap', label: 'Gap', type: 'number', min: 0, max: 12 },
    { key: 'variant', label: 'Layout', type: 'select', options: [
      { value: 'grid', label: 'Grid' },
      { value: 'masonry', label: 'Masonry' },
    ]},
    { key: 'lightbox', label: 'Enable Lightbox', type: 'boolean' },
    { key: 'images', label: 'Images', type: 'array', itemFields: [
      { key: 'url', label: 'Image URL', type: 'image' },
      { key: 'alt', label: 'Alt Text', type: 'text' },
      { key: 'caption', label: 'Caption', type: 'text' },
    ]},
  ],

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
    { key: 'label', label: 'Section Label', type: 'text' },
    { key: 'title', label: 'Section Title', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'text' },
    { key: 'autoplay', label: 'Autoplay', type: 'boolean' },
    { key: 'interval', label: 'Interval (ms)', type: 'number', min: 1000, max: 10000 },
    { key: 'showDots', label: 'Show Dots', type: 'boolean' },
    { key: 'showArrows', label: 'Show Arrows', type: 'boolean' },
    { key: 'items', label: 'Carousel Items', type: 'array', itemFields: [
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
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'submitText', label: 'Submit Button Text', type: 'text' },
    { key: 'successMessage', label: 'Success Message', type: 'text' },
    { key: 'dark', label: 'Dark Mode', type: 'boolean' },
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
    { key: 'headline', label: 'Headline', type: 'text' },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea' },
    { key: 'ctaText', label: 'Button Text', type: 'text' },
    { key: 'ctaLink', label: 'Button Link', type: 'url' },
    { key: 'secondaryCtaText', label: 'Secondary Button', type: 'text' },
    { key: 'secondaryCtaLink', label: 'Secondary Link', type: 'url' },
    { key: 'backgroundImage', label: 'Background Image', type: 'image' },
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'variant', label: 'Layout', type: 'select', options: [
      { value: 'centered', label: 'Centered' },
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
    ]},
    { key: 'minHeight', label: 'Minimum Height', type: 'text' },
    { key: 'overlay', label: 'Show Overlay', type: 'boolean' },
    { key: 'overlayOpacity', label: 'Overlay Opacity', type: 'number', min: 0, max: 100 },
    { key: 'textColor', label: 'Text Color', type: 'select', options: [
      { value: 'white', label: 'White' },
      { value: 'dark', label: 'Dark' },
    ]},
  ],

  'text': [
    { key: 'content', label: 'Content', type: 'richtext' },
    { key: 'alignment', label: 'Alignment', type: 'alignment' },
    { key: 'maxWidth', label: 'Max Width', type: 'select', options: [
      { value: '2xl', label: 'Narrow' },
      { value: '4xl', label: 'Medium' },
      { value: '6xl', label: 'Wide' },
      { value: 'full', label: 'Full' },
    ]},
  ],

  'heading': [
    { key: 'text', label: 'Heading Text', type: 'text' },
    { key: 'level', label: 'Level', type: 'select', options: HEADING_LEVEL_OPTIONS },
    { key: 'alignment', label: 'Alignment', type: 'alignment' },
    { key: 'color', label: 'Color', type: 'color' },
  ],

  'quote': [
    { key: 'quote', label: 'Quote Text', type: 'textarea' },
    { key: 'author', label: 'Author', type: 'text' },
    { key: 'role', label: 'Role', type: 'text' },
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'default', label: 'Default' },
      { value: 'bordered', label: 'Bordered' },
      { value: 'modern', label: 'Modern' },
      { value: 'large', label: 'Large' },
    ]},
  ],

  'feature-grid': [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'columns', label: 'Columns', type: 'number', min: 2, max: 4 },
    { key: 'features', label: 'Features', type: 'array', itemFields: [
      { key: 'icon', label: 'Icon', type: 'icon' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ]},
  ],

  'testimonials': [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'testimonials', label: 'Testimonials', type: 'array', itemFields: [
      { key: 'quote', label: 'Quote', type: 'textarea' },
      { key: 'author', label: 'Author', type: 'text' },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'avatar', label: 'Avatar', type: 'image' },
      { key: 'rating', label: 'Rating', type: 'number', min: 0, max: 5 },
    ]},
  ],

  'stats': [
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'default', label: 'Default' },
      { value: 'cards', label: 'Cards' },
    ]},
    { key: 'stats', label: 'Statistics', type: 'array', itemFields: [
      { key: 'value', label: 'Value', type: 'text' },
      { key: 'label', label: 'Label', type: 'text' },
    ]},
  ],

  'cta': [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'primaryButtonText', label: 'Primary Button', type: 'text' },
    { key: 'primaryButtonLink', label: 'Primary Link', type: 'url' },
    { key: 'secondaryButtonText', label: 'Secondary Button', type: 'text' },
    { key: 'secondaryButtonLink', label: 'Secondary Link', type: 'url' },
    { key: 'variant', label: 'Layout', type: 'select', options: [
      { value: 'centered', label: 'Centered' },
      { value: 'split', label: 'Split' },
    ]},
    { key: 'backgroundColor', label: 'Background Color', type: 'color' },
    { key: 'textColor', label: 'Text Color', type: 'select', options: [
      { value: 'white', label: 'White' },
      { value: 'dark', label: 'Dark' },
    ]},
  ],

  'accordion': [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'allowMultiple', label: 'Allow Multiple Open', type: 'boolean' },
    { key: 'items', label: 'Items', type: 'array', itemFields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'content', label: 'Content', type: 'textarea' },
    ]},
  ],

  'tabs': [
    { key: 'tabs', label: 'Tabs', type: 'array', itemFields: [
      { key: 'title', label: 'Tab Title', type: 'text' },
      { key: 'content', label: 'Content', type: 'richtext' },
    ]},
  ],

  'image': [
    { key: 'src', label: 'Image URL', type: 'image', required: true },
    { key: 'alt', label: 'Alt Text', type: 'text' },
    { key: 'caption', label: 'Caption', type: 'text' },
    { key: 'width', label: 'Width', type: 'select', options: WIDTH_OPTIONS },
    { key: 'alignment', label: 'Alignment', type: 'alignment' },
    { key: 'rounded', label: 'Border Radius', type: 'select', options: ROUNDED_OPTIONS },
    { key: 'shadow', label: 'Shadow', type: 'boolean' },
    { key: 'link', label: 'Link URL', type: 'url' },
  ],

  'video': [
    { key: 'url', label: 'Video URL', type: 'video', required: true },
    { key: 'poster', label: 'Poster Image', type: 'image' },
    { key: 'autoplay', label: 'Autoplay', type: 'boolean' },
    { key: 'controls', label: 'Show Controls', type: 'boolean' },
    { key: 'aspectRatio', label: 'Aspect Ratio', type: 'select', options: ASPECT_RATIO_OPTIONS },
    { key: 'caption', label: 'Caption', type: 'text' },
  ],

  'spacer': [
    { key: 'height', label: 'Height (px)', type: 'number', min: 0, max: 500 },
  ],

  'divider': [
    { key: 'style', label: 'Style', type: 'select', options: [
      { value: 'solid', label: 'Solid' },
      { value: 'dashed', label: 'Dashed' },
      { value: 'dotted', label: 'Dotted' },
    ]},
    { key: 'color', label: 'Color', type: 'color' },
    { key: 'width', label: 'Width', type: 'select', options: WIDTH_OPTIONS },
  ],

  'button': [
    { key: 'text', label: 'Button Text', type: 'text' },
    { key: 'link', label: 'Link URL', type: 'url' },
    { key: 'variant', label: 'Style', type: 'select', options: [
      { value: 'default', label: 'Default' },
      { value: 'outline', label: 'Outline' },
      { value: 'ghost', label: 'Ghost' },
    ]},
    { key: 'size', label: 'Size', type: 'select', options: [
      { value: 'sm', label: 'Small' },
      { value: 'default', label: 'Default' },
      { value: 'lg', label: 'Large' },
    ]},
    { key: 'alignment', label: 'Alignment', type: 'alignment' },
  ],

  'pricing': [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'plans', label: 'Plans', type: 'array', itemFields: [
      { key: 'name', label: 'Plan Name', type: 'text' },
      { key: 'price', label: 'Price', type: 'text' },
      { key: 'period', label: 'Period', type: 'text' },
      { key: 'features', label: 'Features', type: 'stringarray' },
      { key: 'ctaText', label: 'Button Text', type: 'text' },
      { key: 'highlighted', label: 'Highlighted', type: 'boolean' },
    ]},
  ],

  'code': [
    { key: 'code', label: 'Code', type: 'textarea' },
    { key: 'language', label: 'Language', type: 'select', options: [
      { value: 'javascript', label: 'JavaScript' },
      { value: 'typescript', label: 'TypeScript' },
      { value: 'html', label: 'HTML' },
      { value: 'css', label: 'CSS' },
      { value: 'python', label: 'Python' },
      { value: 'bash', label: 'Bash' },
      { value: 'json', label: 'JSON' },
    ]},
    { key: 'filename', label: 'Filename', type: 'text' },
    { key: 'showLineNumbers', label: 'Show Line Numbers', type: 'boolean' },
  ],

  'html': [
    { key: 'html', label: 'HTML Content', type: 'richtext' },
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
