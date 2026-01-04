import {
  Type,
  Image,
  Video,
  Quote,
  MousePointer,
  Minus,
  Layout,
  Grid3X3,
  Star,
  DollarSign,
  ChevronDown,
  Layers,
  Clock,
  BarChart3,
  Images,
  FileText,
  Users,
  Building,
  MapPin,
  Calendar,
  MessageSquare,
  Mail,
  Phone,
  Share2,
  Download,
  Play,
  Music,
  Code,
  Table,
  List,
  CheckSquare,
  AlertCircle,
  Bookmark,
  Heart,
  ThumbsUp,
  Award,
  Zap,
  Target,
  TrendingUp,
  Globe,
  Shield,
  Sparkles,
  Palette,
  Box,
  Columns,
  LayoutGrid,
  Newspaper,
  LucideIcon,
} from 'lucide-react';

export interface BlockType {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: BlockCategory;
  defaultContent: Record<string, unknown>;
  previewImage?: string;
}

export type BlockCategory =
  | 'layout'
  | 'content'
  | 'media'
  | 'interactive'
  | 'data'
  | 'social'
  | 'commerce'
  | 'forms'
  | 'justempower';

export const blockCategories: { id: BlockCategory; name: string; icon: LucideIcon }[] = [
  { id: 'justempower', name: 'JustEmpower', icon: Sparkles },
  { id: 'layout', name: 'Layout', icon: Layout },
  { id: 'content', name: 'Content', icon: Type },
  { id: 'media', name: 'Media', icon: Image },
  { id: 'interactive', name: 'Interactive', icon: MousePointer },
  { id: 'data', name: 'Data & Charts', icon: BarChart3 },
  { id: 'social', name: 'Social', icon: Share2 },
  { id: 'commerce', name: 'Commerce', icon: DollarSign },
  { id: 'forms', name: 'Forms', icon: FileText },
];

export const blockTypes: BlockType[] = [
  // JustEmpower Luxury Blocks
  {
    id: 'je-hero',
    name: 'JE Hero Section',
    description: 'Full-screen hero with video/image background, GSAP animations',
    icon: Layout,
    category: 'justempower',
    defaultContent: {
      videoUrl: '',
      imageUrl: '',
      subtitle: 'Welcome to Just Empower',
      title: 'Catalyzing the Rise of Her',
      description: 'Where Empowerment Becomes Embodiment.',
      ctaText: 'Discover More',
      ctaLink: '/about',
      overlayOpacity: 40,
    },
  },
  {
    id: 'je-section',
    name: 'JE Content Section',
    description: 'Two-column section with image and text, parallax effects',
    icon: Columns,
    category: 'justempower',
    defaultContent: {
      title: 'Section Title',
      subtitle: 'Label',
      description: 'Your content description here...',
      imageUrl: '',
      imageAlt: 'Section image',
      ctaText: 'Learn More',
      ctaLink: '#',
      reversed: false,
      dark: false,
    },
  },
  {
    id: 'je-carousel',
    name: 'JE Offerings Carousel',
    description: 'Horizontal scroll carousel for offerings (fetches from database)',
    icon: Images,
    category: 'justempower',
    defaultContent: {
      useDatabase: true,
      manualItems: [],
    },
  },
  {
    id: 'je-newsletter',
    name: 'JE Newsletter Section',
    description: 'Newsletter signup with brand styling',
    icon: Mail,
    category: 'justempower',
    defaultContent: {
      title: 'Stay Connected',
      description: 'Join our community for updates.',
      buttonText: 'Subscribe',
      variant: 'stacked',
    },
  },
  {
    id: 'je-quote',
    name: 'JE Quote Block',
    description: 'Elegant quote with serif typography',
    icon: Quote,
    category: 'justempower',
    defaultContent: {
      quote: 'A meaningful quote that represents your brand.',
      author: 'Author Name',
      dark: false,
    },
  },
  {
    id: 'je-pillar-grid',
    name: 'JE Pillar Grid',
    description: 'Three-column grid for values or pillars',
    icon: Grid3X3,
    category: 'justempower',
    defaultContent: {
      title: 'Our Pillars',
      pillars: [
        { icon: 'heart', title: 'Embodiment', description: 'Description...' },
        { icon: 'compass', title: 'Discernment', description: 'Description...' },
        { icon: 'crown', title: 'Sovereignty', description: 'Description...' },
      ],
    },
  },
  {
    id: 'je-community',
    name: 'JE Community Section',
    description: 'Community invitation section with image',
    icon: Users,
    category: 'justempower',
    defaultContent: {
      title: 'Emerge With Us',
      subtitle: 'Community',
      description: 'Join our community of conscious leaders.',
      imageUrl: '',
      ctaText: 'Walk With Us',
      ctaLink: '/walk-with-us',
    },
  },
  {
    id: 'je-rooted-unity',
    name: 'JE Rooted Unity Section',
    description: 'Coming soon section for Rooted Unity',
    icon: Globe,
    category: 'justempower',
    defaultContent: {
      title: 'Rooted Unity',
      subtitle: 'Coming 2026',
      description: 'Ecological stewardship meets personal healing.',
      imageUrl: '',
      ctaText: 'Learn More',
      ctaLink: '/offerings/rooted-unity',
    },
  },

  // Layout Blocks
  {
    id: 'hero',
    name: 'Hero Section',
    description: 'Full-width hero with headline, subtext, and CTA',
    icon: Layout,
    category: 'layout',
    defaultContent: {
      headline: 'Welcome to Our Platform',
      subheadline: 'Discover amazing possibilities',
      ctaText: 'Get Started',
      ctaLink: '#',
      backgroundImage: '',
      variant: 'centered',
      overlay: true,
    },
  },
  {
    id: 'columns',
    name: 'Columns',
    description: 'Multi-column layout container',
    icon: Columns,
    category: 'layout',
    defaultContent: {
      columns: 2,
      gap: 'medium',
      content: [{ html: '' }, { html: '' }],
    },
  },
  {
    id: 'section',
    name: 'Section',
    description: 'Container section with background options',
    icon: Box,
    category: 'layout',
    defaultContent: {
      backgroundColor: '',
      backgroundImage: '',
      padding: 'large',
      maxWidth: 'container',
    },
  },
  {
    id: 'grid',
    name: 'Grid Layout',
    description: 'Flexible grid container',
    icon: LayoutGrid,
    category: 'layout',
    defaultContent: {
      columns: 3,
      gap: 'medium',
      items: [],
    },
  },
  {
    id: 'spacer',
    name: 'Spacer',
    description: 'Add vertical spacing',
    icon: Minus,
    category: 'layout',
    defaultContent: {
      height: 64,
    },
  },
  {
    id: 'divider',
    name: 'Divider',
    description: 'Horizontal line separator',
    icon: Minus,
    category: 'layout',
    defaultContent: {
      style: 'solid',
      color: '#e5e7eb',
      width: '100%',
    },
  },

  // Content Blocks
  {
    id: 'text',
    name: 'Text Block',
    description: 'Rich text content with formatting',
    icon: Type,
    category: 'content',
    defaultContent: {
      content: '<p>Enter your text here...</p>',
      alignment: 'left',
    },
  },
  {
    id: 'heading',
    name: 'Heading',
    description: 'Section heading with multiple levels',
    icon: Type,
    category: 'content',
    defaultContent: {
      text: 'Section Heading',
      level: 'h2',
      alignment: 'left',
    },
  },
  {
    id: 'quote',
    name: 'Quote',
    description: 'Styled blockquote with attribution',
    icon: Quote,
    category: 'content',
    defaultContent: {
      quote: 'Enter your quote here...',
      author: 'Author Name',
      role: 'Position/Company',
      variant: 'default',
    },
  },
  {
    id: 'feature-grid',
    name: 'Feature Grid',
    description: 'Grid of features with icons',
    icon: Grid3X3,
    category: 'content',
    defaultContent: {
      heading: 'Our Features',
      features: [
        { icon: 'zap', title: 'Fast', description: 'Lightning fast performance' },
        { icon: 'shield', title: 'Secure', description: 'Enterprise-grade security' },
        { icon: 'sparkles', title: 'Modern', description: 'Built with latest tech' },
      ],
      columns: 3,
    },
  },
  {
    id: 'testimonials',
    name: 'Testimonials',
    description: 'Customer testimonials carousel or grid',
    icon: Star,
    category: 'content',
    defaultContent: {
      heading: 'What Our Customers Say',
      testimonials: [
        {
          quote: 'Amazing product!',
          author: 'John Doe',
          role: 'CEO',
          company: 'Tech Corp',
          avatar: '',
          rating: 5,
        },
      ],
      variant: 'carousel',
    },
  },
  {
    id: 'team',
    name: 'Team Members',
    description: 'Team member profiles grid',
    icon: Users,
    category: 'content',
    defaultContent: {
      heading: 'Meet Our Team',
      members: [
        {
          name: 'Jane Smith',
          role: 'Founder & CEO',
          bio: 'Passionate about innovation',
          image: '',
          social: {},
        },
      ],
      columns: 4,
      variant: 'card',
    },
  },
  {
    id: 'timeline',
    name: 'Timeline',
    description: 'Vertical or horizontal timeline',
    icon: Clock,
    category: 'content',
    defaultContent: {
      heading: 'Our Journey',
      events: [
        { date: '2020', title: 'Founded', description: 'Company was established' },
        { date: '2021', title: 'Growth', description: 'Expanded to new markets' },
      ],
      variant: 'vertical',
    },
  },
  {
    id: 'accordion',
    name: 'Accordion / FAQ',
    description: 'Collapsible content sections',
    icon: ChevronDown,
    category: 'content',
    defaultContent: {
      heading: 'Frequently Asked Questions',
      items: [
        { question: 'What is this?', answer: 'This is an FAQ section.' },
        { question: 'How does it work?', answer: 'Click to expand answers.' },
      ],
      allowMultiple: false,
    },
  },
  {
    id: 'tabs',
    name: 'Tabs',
    description: 'Tabbed content sections',
    icon: Layers,
    category: 'content',
    defaultContent: {
      tabs: [
        { label: 'Tab 1', content: 'Content for tab 1' },
        { label: 'Tab 2', content: 'Content for tab 2' },
      ],
      variant: 'default',
    },
  },
  {
    id: 'stats',
    name: 'Statistics',
    description: 'Number counters and stats',
    icon: TrendingUp,
    category: 'content',
    defaultContent: {
      stats: [
        { value: '10K+', label: 'Customers' },
        { value: '99%', label: 'Satisfaction' },
        { value: '24/7', label: 'Support' },
      ],
      variant: 'default',
    },
  },
  {
    id: 'logo-grid',
    name: 'Logo Grid',
    description: 'Partner/client logos display',
    icon: Building,
    category: 'content',
    defaultContent: {
      heading: 'Trusted By',
      logos: [],
      grayscale: true,
      columns: 5,
    },
  },
  {
    id: 'cta',
    name: 'Call to Action',
    description: 'Prominent CTA section',
    icon: MousePointer,
    category: 'content',
    defaultContent: {
      heading: 'Ready to Get Started?',
      description: 'Join thousands of satisfied customers today.',
      primaryButton: { text: 'Get Started', link: '#' },
      secondaryButton: { text: 'Learn More', link: '#' },
      variant: 'centered',
    },
  },
  {
    id: 'alert',
    name: 'Alert / Notice',
    description: 'Important announcements or notices',
    icon: AlertCircle,
    category: 'content',
    defaultContent: {
      message: 'Important notice here',
      type: 'info',
      dismissible: true,
    },
  },
  {
    id: 'list',
    name: 'List',
    description: 'Styled bullet or numbered list',
    icon: List,
    category: 'content',
    defaultContent: {
      items: ['Item 1', 'Item 2', 'Item 3'],
      style: 'bullet',
      icon: 'check',
    },
  },
  {
    id: 'checklist',
    name: 'Checklist',
    description: 'Interactive checklist',
    icon: CheckSquare,
    category: 'content',
    defaultContent: {
      heading: 'Checklist',
      items: [
        { text: 'Task 1', checked: true },
        { text: 'Task 2', checked: false },
      ],
    },
  },

  // Media Blocks
  {
    id: 'image',
    name: 'Image',
    description: 'Single image with caption',
    icon: Image,
    category: 'media',
    defaultContent: {
      src: '',
      alt: '',
      caption: '',
      size: 'full',
      alignment: 'center',
    },
  },
  {
    id: 'gallery',
    name: 'Image Gallery',
    description: 'Grid or masonry image gallery',
    icon: Images,
    category: 'media',
    defaultContent: {
      images: [],
      columns: 3,
      variant: 'grid',
      lightbox: true,
    },
  },
  {
    id: 'video',
    name: 'Video',
    description: 'Embedded video player',
    icon: Video,
    category: 'media',
    defaultContent: {
      url: '',
      provider: 'youtube',
      autoplay: false,
      controls: true,
    },
  },
  {
    id: 'video-background',
    name: 'Video Background',
    description: 'Full-width video background section',
    icon: Play,
    category: 'media',
    defaultContent: {
      videoUrl: '',
      overlayContent: {
        heading: '',
        subheading: '',
        cta: '',
      },
      overlay: true,
    },
  },
  {
    id: 'audio',
    name: 'Audio Player',
    description: 'Audio file player',
    icon: Music,
    category: 'media',
    defaultContent: {
      src: '',
      title: '',
      artist: '',
      showWaveform: false,
    },
  },
  {
    id: 'carousel',
    name: 'Carousel / Slider',
    description: 'Image or content carousel',
    icon: Images,
    category: 'media',
    defaultContent: {
      slides: [],
      autoplay: true,
      interval: 5000,
      showDots: true,
      showArrows: true,
    },
  },
  {
    id: 'before-after',
    name: 'Before/After',
    description: 'Image comparison slider',
    icon: Columns,
    category: 'media',
    defaultContent: {
      beforeImage: '',
      afterImage: '',
      beforeLabel: 'Before',
      afterLabel: 'After',
    },
  },

  // Interactive Blocks
  {
    id: 'button',
    name: 'Button',
    description: 'Styled button with link',
    icon: MousePointer,
    category: 'interactive',
    defaultContent: {
      text: 'Click Me',
      link: '#',
      variant: 'primary',
      size: 'medium',
      icon: '',
    },
  },
  {
    id: 'button-group',
    name: 'Button Group',
    description: 'Multiple buttons together',
    icon: MousePointer,
    category: 'interactive',
    defaultContent: {
      buttons: [
        { text: 'Primary', link: '#', variant: 'primary' },
        { text: 'Secondary', link: '#', variant: 'outline' },
      ],
      alignment: 'center',
    },
  },
  {
    id: 'countdown',
    name: 'Countdown Timer',
    description: 'Countdown to a date/time',
    icon: Clock,
    category: 'interactive',
    defaultContent: {
      targetDate: '',
      heading: 'Coming Soon',
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
    },
  },
  {
    id: 'progress',
    name: 'Progress Bar',
    description: 'Visual progress indicator',
    icon: BarChart3,
    category: 'interactive',
    defaultContent: {
      items: [
        { label: 'Progress 1', value: 75 },
        { label: 'Progress 2', value: 50 },
      ],
      showPercentage: true,
      animated: true,
    },
  },
  {
    id: 'map',
    name: 'Map',
    description: 'Interactive map embed',
    icon: MapPin,
    category: 'interactive',
    defaultContent: {
      address: '',
      lat: 0,
      lng: 0,
      zoom: 14,
      style: 'default',
    },
  },
  {
    id: 'modal-trigger',
    name: 'Modal Trigger',
    description: 'Button that opens a modal',
    icon: Box,
    category: 'interactive',
    defaultContent: {
      triggerText: 'Open Modal',
      modalTitle: 'Modal Title',
      modalContent: '',
    },
  },

  // Data Blocks
  {
    id: 'table',
    name: 'Table',
    description: 'Data table with sorting',
    icon: Table,
    category: 'data',
    defaultContent: {
      headers: ['Column 1', 'Column 2', 'Column 3'],
      rows: [
        ['Data 1', 'Data 2', 'Data 3'],
        ['Data 4', 'Data 5', 'Data 6'],
      ],
      striped: true,
      sortable: true,
    },
  },
  {
    id: 'chart',
    name: 'Chart',
    description: 'Data visualization chart',
    icon: BarChart3,
    category: 'data',
    defaultContent: {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [{ label: 'Sales', data: [10, 20, 30] }],
      },
      options: {},
    },
  },
  {
    id: 'pricing',
    name: 'Pricing Table',
    description: 'Pricing plans comparison',
    icon: DollarSign,
    category: 'data',
    defaultContent: {
      heading: 'Choose Your Plan',
      plans: [
        {
          name: 'Basic',
          price: '$9',
          period: 'month',
          features: ['Feature 1', 'Feature 2'],
          ctaText: 'Get Started',
          highlighted: false,
        },
        {
          name: 'Pro',
          price: '$29',
          period: 'month',
          features: ['All Basic', 'Feature 3', 'Feature 4'],
          ctaText: 'Get Started',
          highlighted: true,
        },
      ],
    },
  },
  {
    id: 'comparison',
    name: 'Comparison Table',
    description: 'Feature comparison grid',
    icon: Table,
    category: 'data',
    defaultContent: {
      heading: 'Compare Plans',
      features: ['Feature 1', 'Feature 2', 'Feature 3'],
      plans: [
        { name: 'Basic', values: [true, false, false] },
        { name: 'Pro', values: [true, true, false] },
        { name: 'Enterprise', values: [true, true, true] },
      ],
    },
  },

  // Social Blocks
  {
    id: 'social-links',
    name: 'Social Links',
    description: 'Social media icon links',
    icon: Share2,
    category: 'social',
    defaultContent: {
      links: [
        { platform: 'twitter', url: '' },
        { platform: 'facebook', url: '' },
        { platform: 'instagram', url: '' },
        { platform: 'linkedin', url: '' },
      ],
      style: 'icons',
      size: 'medium',
    },
  },
  {
    id: 'social-feed',
    name: 'Social Feed',
    description: 'Embedded social media feed',
    icon: Newspaper,
    category: 'social',
    defaultContent: {
      platform: 'instagram',
      username: '',
      count: 6,
    },
  },
  {
    id: 'share-buttons',
    name: 'Share Buttons',
    description: 'Social sharing buttons',
    icon: Share2,
    category: 'social',
    defaultContent: {
      platforms: ['twitter', 'facebook', 'linkedin', 'email'],
      style: 'buttons',
    },
  },
  {
    id: 'reviews',
    name: 'Reviews',
    description: 'Customer reviews with ratings',
    icon: Star,
    category: 'social',
    defaultContent: {
      heading: 'Customer Reviews',
      reviews: [],
      showRating: true,
      allowSubmit: false,
    },
  },

  // Commerce Blocks
  {
    id: 'product-card',
    name: 'Product Card',
    description: 'Single product display',
    icon: Box,
    category: 'commerce',
    defaultContent: {
      productId: '',
      showPrice: true,
      showDescription: true,
      showButton: true,
    },
  },
  {
    id: 'product-grid',
    name: 'Product Grid',
    description: 'Multiple products grid',
    icon: LayoutGrid,
    category: 'commerce',
    defaultContent: {
      products: [],
      columns: 4,
      showFilters: false,
    },
  },
  {
    id: 'featured-product',
    name: 'Featured Product',
    description: 'Highlighted product showcase',
    icon: Award,
    category: 'commerce',
    defaultContent: {
      productId: '',
      variant: 'hero',
      showGallery: true,
    },
  },

  // Form Blocks
  {
    id: 'contact-form',
    name: 'Contact Form',
    description: 'Pre-built contact form',
    icon: Mail,
    category: 'forms',
    defaultContent: {
      heading: 'Get in Touch',
      fields: ['name', 'email', 'message'],
      submitText: 'Send Message',
      successMessage: 'Thank you for your message!',
    },
  },
  {
    id: 'newsletter',
    name: 'Newsletter Signup',
    description: 'Email subscription form',
    icon: Mail,
    category: 'forms',
    defaultContent: {
      heading: 'Subscribe to Our Newsletter',
      description: 'Get the latest updates delivered to your inbox.',
      buttonText: 'Subscribe',
      placeholder: 'Enter your email',
    },
  },
  {
    id: 'form-builder',
    name: 'Custom Form',
    description: 'Build custom forms',
    icon: FileText,
    category: 'forms',
    defaultContent: {
      fields: [],
      submitText: 'Submit',
      successMessage: 'Form submitted successfully!',
    },
  },
  {
    id: 'search',
    name: 'Search Box',
    description: 'Search input with suggestions',
    icon: Globe,
    category: 'forms',
    defaultContent: {
      placeholder: 'Search...',
      showSuggestions: true,
      searchType: 'site',
    },
  },

  // Special Blocks
  {
    id: 'code',
    name: 'Code Block',
    description: 'Syntax highlighted code',
    icon: Code,
    category: 'content',
    defaultContent: {
      code: '// Your code here',
      language: 'javascript',
      showLineNumbers: true,
      theme: 'dark',
    },
  },
  {
    id: 'embed',
    name: 'Embed',
    description: 'Embed external content',
    icon: Code,
    category: 'media',
    defaultContent: {
      embedCode: '',
      aspectRatio: '16:9',
    },
  },
  {
    id: 'html',
    name: 'Custom HTML',
    description: 'Raw HTML content',
    icon: Code,
    category: 'content',
    defaultContent: {
      html: '',
    },
  },
];

export const getBlocksByCategory = (category: BlockCategory): BlockType[] => {
  return blockTypes.filter((block) => block.category === category);
};

export const getBlockById = (id: string): BlockType | undefined => {
  return blockTypes.find((block) => block.id === id);
};
