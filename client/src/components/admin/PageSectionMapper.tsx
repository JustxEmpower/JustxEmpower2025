import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Menu, 
  Image, 
  FileText, 
  GalleryHorizontal, 
  LayoutGrid, 
  FormInput, 
  Play, 
  Quote, 
  MousePointerClick, 
  Calendar,
  PanelBottom,
  Target,
  Layers,
  Users,
  Leaf,
  Mail,
  ShoppingBag,
  BookOpen,
  Star,
  MessageSquare,
  MapPin,
  Heart,
  Sparkles,
  CircleDot,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';

// Define comprehensive section types that can appear on a page
export type SectionType = 
  | 'header'
  | 'hero'
  | 'content'
  | 'carousel'
  | 'grid'
  | 'form'
  | 'video'
  | 'quote'
  | 'cta'
  | 'calendar'
  | 'footer'
  | 'newsletter'
  | 'community'
  | 'testimonials'
  | 'gallery'
  | 'map'
  | 'products'
  | 'articles'
  | 'team'
  | 'faq'
  | 'pricing'
  | 'features'
  | 'stats'
  | 'social'
  | 'rooted-unity';

export interface PageSection {
  id: string;
  type: SectionType;
  label: string;
  contentKey?: string; // Maps to CMS content key
  hasContent: boolean; // Whether content exists for this section
  fields?: string[]; // List of field names in this section
  completeness?: number; // 0-100 percentage of fields filled
  requiredFields?: string[]; // Fields that must be filled
  missingFields?: string[]; // Fields that are empty
}

interface PageSectionMapperProps {
  sections: PageSection[];
  activeSection?: string; // Currently active section ID
  onSectionClick?: (sectionId: string) => void;
  className?: string;
}

// Enhanced section type colors for visual distinction - more vibrant and distinct
const sectionColors: Record<SectionType, { bg: string; border: string; text: string; accent: string }> = {
  header: { bg: 'bg-slate-100', border: 'border-slate-400', text: 'text-slate-700', accent: 'bg-slate-500' },
  hero: { bg: 'bg-amber-100', border: 'border-amber-500', text: 'text-amber-800', accent: 'bg-amber-500' },
  content: { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-800', accent: 'bg-blue-500' },
  carousel: { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-800', accent: 'bg-purple-500' },
  grid: { bg: 'bg-emerald-100', border: 'border-emerald-500', text: 'text-emerald-800', accent: 'bg-emerald-500' },
  form: { bg: 'bg-pink-100', border: 'border-pink-500', text: 'text-pink-800', accent: 'bg-pink-500' },
  video: { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-800', accent: 'bg-red-500' },
  quote: { bg: 'bg-indigo-100', border: 'border-indigo-500', text: 'text-indigo-800', accent: 'bg-indigo-500' },
  cta: { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-800', accent: 'bg-orange-500' },
  calendar: { bg: 'bg-teal-100', border: 'border-teal-500', text: 'text-teal-800', accent: 'bg-teal-500' },
  footer: { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700', accent: 'bg-gray-500' },
  newsletter: { bg: 'bg-rose-100', border: 'border-rose-500', text: 'text-rose-800', accent: 'bg-rose-500' },
  community: { bg: 'bg-cyan-100', border: 'border-cyan-500', text: 'text-cyan-800', accent: 'bg-cyan-500' },
  testimonials: { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-800', accent: 'bg-yellow-500' },
  gallery: { bg: 'bg-fuchsia-100', border: 'border-fuchsia-500', text: 'text-fuchsia-800', accent: 'bg-fuchsia-500' },
  map: { bg: 'bg-lime-100', border: 'border-lime-500', text: 'text-lime-800', accent: 'bg-lime-500' },
  products: { bg: 'bg-violet-100', border: 'border-violet-500', text: 'text-violet-800', accent: 'bg-violet-500' },
  articles: { bg: 'bg-sky-100', border: 'border-sky-500', text: 'text-sky-800', accent: 'bg-sky-500' },
  team: { bg: 'bg-amber-100', border: 'border-amber-600', text: 'text-amber-900', accent: 'bg-amber-600' },
  faq: { bg: 'bg-stone-100', border: 'border-stone-500', text: 'text-stone-800', accent: 'bg-stone-500' },
  pricing: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-800', accent: 'bg-green-500' },
  features: { bg: 'bg-blue-100', border: 'border-blue-600', text: 'text-blue-900', accent: 'bg-blue-600' },
  stats: { bg: 'bg-purple-100', border: 'border-purple-600', text: 'text-purple-900', accent: 'bg-purple-600' },
  social: { bg: 'bg-pink-100', border: 'border-pink-600', text: 'text-pink-900', accent: 'bg-pink-600' },
  'rooted-unity': { bg: 'bg-emerald-100', border: 'border-emerald-600', text: 'text-emerald-900', accent: 'bg-emerald-600' },
};

// Section type icons using Lucide
const SectionIcon = ({ type, className }: { type: SectionType; className?: string }) => {
  const iconProps = { className: cn('w-3.5 h-3.5', className) };
  
  switch (type) {
    case 'header':
      return <Menu {...iconProps} />;
    case 'hero':
      return <Target {...iconProps} />;
    case 'content':
      return <FileText {...iconProps} />;
    case 'carousel':
      return <GalleryHorizontal {...iconProps} />;
    case 'grid':
      return <LayoutGrid {...iconProps} />;
    case 'form':
      return <FormInput {...iconProps} />;
    case 'video':
      return <Play {...iconProps} />;
    case 'quote':
      return <Quote {...iconProps} />;
    case 'cta':
      return <MousePointerClick {...iconProps} />;
    case 'calendar':
      return <Calendar {...iconProps} />;
    case 'footer':
      return <PanelBottom {...iconProps} />;
    case 'newsletter':
      return <Mail {...iconProps} />;
    case 'community':
      return <Users {...iconProps} />;
    case 'testimonials':
      return <Star {...iconProps} />;
    case 'gallery':
      return <Image {...iconProps} />;
    case 'map':
      return <MapPin {...iconProps} />;
    case 'products':
      return <ShoppingBag {...iconProps} />;
    case 'articles':
      return <BookOpen {...iconProps} />;
    case 'team':
      return <Users {...iconProps} />;
    case 'faq':
      return <MessageSquare {...iconProps} />;
    case 'pricing':
      return <CircleDot {...iconProps} />;
    case 'features':
      return <Sparkles {...iconProps} />;
    case 'stats':
      return <Layers {...iconProps} />;
    case 'social':
      return <Heart {...iconProps} />;
    case 'rooted-unity':
      return <Leaf {...iconProps} />;
    default:
      return <Layers {...iconProps} />;
  }
};

// Section height ratios for visual representation
const sectionHeights: Record<SectionType, string> = {
  header: 'h-6',
  hero: 'h-16',
  content: 'h-14',
  carousel: 'h-12',
  grid: 'h-14',
  form: 'h-14',
  video: 'h-12',
  quote: 'h-8',
  cta: 'h-8',
  calendar: 'h-16',
  footer: 'h-10',
  newsletter: 'h-10',
  community: 'h-14',
  testimonials: 'h-10',
  gallery: 'h-12',
  map: 'h-10',
  products: 'h-14',
  articles: 'h-14',
  team: 'h-12',
  faq: 'h-12',
  pricing: 'h-14',
  features: 'h-12',
  stats: 'h-10',
  social: 'h-8',
  'rooted-unity': 'h-14',
};

// Completeness status indicator
const CompletenessIndicator = ({ completeness, hasContent }: { completeness?: number; hasContent: boolean }) => {
  if (!hasContent) {
    return (
      <div className="flex items-center gap-0.5">
        <XCircle className="w-3 h-3 text-red-500" />
        <span className="text-[8px] text-red-600 font-medium">EMPTY</span>
      </div>
    );
  }
  
  if (completeness === undefined) {
    return (
      <div className="flex items-center gap-0.5">
        <CheckCircle2 className="w-3 h-3 text-green-500" />
      </div>
    );
  }
  
  if (completeness >= 100) {
    return (
      <div className="flex items-center gap-0.5">
        <CheckCircle2 className="w-3 h-3 text-green-500" />
        <span className="text-[8px] text-green-600 font-medium">100%</span>
      </div>
    );
  }
  
  if (completeness >= 50) {
    return (
      <div className="flex items-center gap-0.5">
        <AlertCircle className="w-3 h-3 text-yellow-500" />
        <span className="text-[8px] text-yellow-600 font-medium">{completeness}%</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-0.5">
      <AlertCircle className="w-3 h-3 text-orange-500" />
      <span className="text-[8px] text-orange-600 font-medium">{completeness}%</span>
    </div>
  );
};

export function PageSectionMapper({
  sections,
  activeSection,
  onSectionClick,
  className,
}: PageSectionMapperProps) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  // Calculate overall page completeness
  const totalSections = sections.length;
  const completeSections = sections.filter(s => s.hasContent).length;
  const overallCompleteness = Math.round((completeSections / totalSections) * 100);

  return (
    <div className={cn('flex flex-col gap-2 p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm', className)}>
      {/* Header with overall status */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
          <Layers className="w-3.5 h-3.5" />
          Page Structure
        </div>
        <div className="flex items-center gap-1.5">
          <div className="text-[10px] text-gray-500 dark:text-gray-400">
            {completeSections}/{totalSections} sections
          </div>
          <div className={cn(
            'text-[10px] font-medium px-1.5 py-0.5 rounded',
            overallCompleteness >= 80 ? 'bg-green-100 text-green-700' :
            overallCompleteness >= 50 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          )}>
            {overallCompleteness}%
          </div>
        </div>
      </div>

      {/* Page Preview Container */}
      <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-neutral-800">
        {/* Browser-like top bar */}
        <div className="h-5 bg-gray-200 dark:bg-neutral-700 flex items-center gap-1.5 px-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
          <div className="flex-1 mx-2">
            <div className="h-2.5 bg-white dark:bg-neutral-600 rounded-sm"></div>
          </div>
        </div>

        {/* Sections */}
        <div className="p-2 flex flex-col gap-1">
          {sections.map((section) => {
            const colors = sectionColors[section.type] || sectionColors.content;
            const height = sectionHeights[section.type] || 'h-12';
            const isActive = activeSection === section.id;
            const isHovered = hoveredSection === section.id;

            return (
              <div
                key={section.id}
                className={cn(
                  'relative rounded-md transition-all duration-200 cursor-pointer border-2',
                  height,
                  colors.bg,
                  isActive 
                    ? 'border-orange-500 ring-2 ring-orange-300 shadow-lg scale-[1.02]' 
                    : isHovered 
                      ? `${colors.border} shadow-md` 
                      : 'border-transparent hover:border-gray-300',
                  !section.hasContent && 'opacity-70'
                )}
                onClick={() => onSectionClick?.(section.id)}
                onMouseEnter={() => setHoveredSection(section.id)}
                onMouseLeave={() => setHoveredSection(null)}
              >
                {/* Color accent bar on left */}
                <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-md', colors.accent)} />
                
                {/* Section content */}
                <div className="absolute inset-0 flex items-center justify-between px-3 pl-4">
                  {/* Left side: icon and label */}
                  <div className="flex items-center gap-2">
                    <SectionIcon type={section.type} className={colors.text} />
                    <span className={cn('text-[11px] font-semibold truncate', colors.text)}>
                      {section.label}
                    </span>
                  </div>

                  {/* Right side: status indicators */}
                  <div className="flex items-center gap-1.5">
                    <CompletenessIndicator 
                      completeness={section.completeness} 
                      hasContent={section.hasContent} 
                    />
                    {isActive && (
                      <span className="text-[8px] px-1.5 py-0.5 bg-orange-500 text-white rounded font-bold animate-pulse">
                        EDITING
                      </span>
                    )}
                  </div>
                </div>

                {/* Content preview lines (visual representation) */}
                {section.hasContent && section.type !== 'header' && section.type !== 'footer' && (
                  <div className="absolute bottom-1.5 left-4 right-3 flex flex-col gap-0.5 opacity-20">
                    <div className={cn('h-0.5 rounded w-3/4', colors.accent)}></div>
                    <div className={cn('h-0.5 rounded w-1/2', colors.accent)}></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend - Two rows for all section types */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Section Types</div>
        <div className="grid grid-cols-3 gap-x-2 gap-y-1">
          {(['header', 'hero', 'content', 'carousel', 'grid', 'form', 'video', 'quote', 'cta', 'newsletter', 'community', 'footer'] as SectionType[]).map((type) => {
            const colors = sectionColors[type];
            return (
              <div key={type} className="flex items-center gap-1">
                <div className={cn('w-2.5 h-2.5 rounded-sm border', colors.bg, colors.border)}></div>
                <span className="text-[9px] text-gray-600 dark:text-gray-400 capitalize">{type}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active section details */}
      {activeSection && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Currently Editing</div>
          {sections.filter(s => s.id === activeSection).map(section => {
            const colors = sectionColors[section.type] || sectionColors.content;
            return (
              <div key={section.id} className="text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn('w-3 h-3 rounded flex items-center justify-center', colors.bg)}>
                    <SectionIcon type={section.type} className={cn('w-2 h-2', colors.text)} />
                  </div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{section.label}</span>
                </div>
                {section.fields && section.fields.length > 0 && (
                  <div className="mt-1.5 text-[10px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-neutral-800 rounded p-1.5">
                    <span className="font-medium">Fields:</span> {section.fields.join(', ')}
                  </div>
                )}
                {section.missingFields && section.missingFields.length > 0 && (
                  <div className="mt-1 text-[10px] text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-1.5">
                    <span className="font-medium">Missing:</span> {section.missingFields.join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helper function to generate default sections for a page type
export function getDefaultSections(pageType: string): PageSection[] {
  const commonSections: PageSection[] = [
    { id: 'header', type: 'header', label: 'Header Navigation', hasContent: true },
  ];

  const footerSection: PageSection = {
    id: 'footer',
    type: 'footer',
    label: 'Footer',
    hasContent: true,
    fields: ['copyright', 'socialLinks', 'newsletterSignup', 'navigationLinks'],
  };

  switch (pageType) {
    case 'home':
    case 'homepage':
      return [
        ...commonSections,
        { id: 'hero', type: 'hero', label: 'Hero Section', hasContent: true, fields: ['title', 'subtitle', 'description', 'ctaText', 'ctaLink', 'videoUrl', 'backgroundImage'], completeness: 100 },
        { id: 'philosophy', type: 'content', label: 'Philosophy Section', hasContent: true, fields: ['title', 'subtitle', 'description', 'ctaText', 'ctaLink'], completeness: 100 },
        { id: 'carousel', type: 'carousel', label: 'Offerings Carousel', hasContent: true, fields: ['offerings'], completeness: 100 },
        { id: 'community', type: 'community', label: 'Community Section', hasContent: true, fields: ['title', 'subtitle', 'description', 'ctaText', 'ctaLink', 'pillars'], completeness: 100 },
        { id: 'rooted-unity', type: 'rooted-unity', label: 'Rooted Unity Section', hasContent: true, fields: ['title', 'subtitle', 'description', 'ctaText', 'ctaLink', 'backgroundImage'], completeness: 100 },
        { id: 'newsletter', type: 'newsletter', label: 'Newsletter Popup', hasContent: true, fields: ['title', 'description', 'ctaText', 'privacyText'], completeness: 100 },
        footerSection,
      ];

    case 'philosophy':
      return [
        ...commonSections,
        { id: 'hero', type: 'hero', label: 'Hero Section', hasContent: true, fields: ['title', 'subtitle', 'backgroundImage'] },
        { id: 'intro', type: 'content', label: 'Introduction', hasContent: true, fields: ['headline', 'body'] },
        { id: 'pillars', type: 'grid', label: 'Core Pillars', hasContent: true, fields: ['pillars'] },
        { id: 'quote', type: 'quote', label: 'Founder Quote', hasContent: false, fields: ['quote', 'attribution'], missingFields: ['quote', 'attribution'] },
        { id: 'cta', type: 'cta', label: 'Call to Action', hasContent: true, fields: ['ctaText', 'ctaLink'] },
        footerSection,
      ];

    case 'founder':
      return [
        ...commonSections,
        { id: 'hero', type: 'hero', label: 'Hero Section', hasContent: true, fields: ['title', 'subtitle', 'backgroundImage'] },
        { id: 'bio', type: 'content', label: 'Biography', hasContent: true, fields: ['name', 'title', 'bio', 'image'] },
        { id: 'journey', type: 'content', label: 'Journey', hasContent: true, fields: ['timeline', 'milestones'] },
        { id: 'quote', type: 'quote', label: 'Personal Quote', hasContent: false, fields: ['quote'] },
        { id: 'social', type: 'social', label: 'Social Links', hasContent: true, fields: ['instagram', 'linkedin', 'twitter'] },
        footerSection,
      ];

    case 'vision-ethos':
      return [
        ...commonSections,
        { id: 'hero', type: 'hero', label: 'Hero Section', hasContent: true, fields: ['title', 'subtitle', 'backgroundImage'] },
        { id: 'vision', type: 'content', label: 'Vision Statement', hasContent: true, fields: ['title', 'body'] },
        { id: 'ethos', type: 'content', label: 'Ethos & Values', hasContent: true, fields: ['values'] },
        { id: 'quote', type: 'quote', label: 'Guiding Quote', hasContent: false, fields: ['quote', 'attribution'] },
        footerSection,
      ];

    case 'offerings':
      return [
        ...commonSections,
        { id: 'hero', type: 'hero', label: 'Hero Section', hasContent: true, fields: ['title', 'subtitle', 'backgroundImage'] },
        { id: 'intro', type: 'content', label: 'Introduction', hasContent: true, fields: ['headline', 'description'] },
        { id: 'grid', type: 'grid', label: 'Offerings Grid', hasContent: true, fields: ['offerings'] },
        { id: 'cta', type: 'cta', label: 'Get Started CTA', hasContent: true, fields: ['ctaText', 'ctaLink'] },
        footerSection,
      ];

    case 'workshops-programs':
      return [
        ...commonSections,
        { id: 'hero', type: 'hero', label: 'Hero Section', hasContent: true, fields: ['title', 'subtitle', 'backgroundImage'] },
        { id: 'programs', type: 'grid', label: 'Programs List', hasContent: true, fields: ['programs'] },
        { id: 'testimonials', type: 'testimonials', label: 'Testimonials', hasContent: false, fields: ['testimonials'], missingFields: ['testimonials'] },
        { id: 'cta', type: 'cta', label: 'Register CTA', hasContent: true, fields: ['ctaText', 'ctaLink'] },
        footerSection,
      ];

    case 'vix-journal-trilogy':
    case 'blog':
    case 'blog-she-writes':
      return [
        ...commonSections,
        { id: 'hero', type: 'hero', label: 'Hero Section', hasContent: true, fields: ['title', 'subtitle'] },
        { id: 'featured', type: 'content', label: 'Featured Article', hasContent: false, fields: ['article'], missingFields: ['article'] },
        { id: 'articles', type: 'articles', label: 'Articles Grid', hasContent: true, fields: ['articles', 'categories'] },
        { id: 'newsletter', type: 'newsletter', label: 'Newsletter Signup', hasContent: true, fields: ['title', 'description', 'ctaText'] },
        footerSection,
      ];

    case 'rooted-unity':
      return [
        ...commonSections,
        { id: 'hero', type: 'hero', label: 'Hero Section', hasContent: true, fields: ['title', 'subtitle', 'backgroundImage'] },
        { id: 'intro', type: 'content', label: 'Introduction', hasContent: true, fields: ['headline', 'description'] },
        { id: 'features', type: 'features', label: 'Program Features', hasContent: false, fields: ['features'], missingFields: ['features'] },
        { id: 'cta', type: 'cta', label: 'Coming Soon CTA', hasContent: true, fields: ['ctaText', 'ctaLink'] },
        footerSection,
      ];

    case 'community-events':
      return [
        ...commonSections,
        { id: 'hero', type: 'hero', label: 'Hero Section', hasContent: true, fields: ['title', 'subtitle'] },
        { id: 'upcoming', type: 'calendar', label: 'Upcoming Events', hasContent: true, fields: ['events'] },
        { id: 'past', type: 'gallery', label: 'Past Events Gallery', hasContent: false, fields: ['gallery'], missingFields: ['gallery'] },
        { id: 'cta', type: 'cta', label: 'Host an Event CTA', hasContent: true, fields: ['ctaText', 'ctaLink'] },
        footerSection,
      ];

    case 'resources':
      return [
        ...commonSections,
        { id: 'hero', type: 'hero', label: 'Hero Section', hasContent: true, fields: ['title', 'subtitle'] },
        { id: 'categories', type: 'grid', label: 'Resource Categories', hasContent: true, fields: ['categories'] },
        { id: 'resources', type: 'grid', label: 'Resources List', hasContent: true, fields: ['resources'] },
        { id: 'cta', type: 'cta', label: 'Submit Resource CTA', hasContent: false, fields: ['ctaText', 'ctaLink'], missingFields: ['ctaText', 'ctaLink'] },
        footerSection,
      ];

    case 'contact':
      return [
        ...commonSections,
        { id: 'hero', type: 'hero', label: 'Hero Section', hasContent: true, fields: ['title', 'subtitle', 'backgroundImage'] },
        { id: 'info', type: 'content', label: 'Contact Info', hasContent: true, fields: ['email', 'phone', 'address', 'hours'] },
        { id: 'form', type: 'form', label: 'Contact Form', hasContent: true, fields: ['formFields', 'submitText'] },
        { id: 'map', type: 'map', label: 'Location Map', hasContent: false, fields: ['mapEmbed', 'address'], missingFields: ['mapEmbed'] },
        { id: 'social', type: 'social', label: 'Social Links', hasContent: true, fields: ['instagram', 'facebook', 'linkedin', 'youtube'] },
        footerSection,
      ];

    case 'shop':
      return [
        ...commonSections,
        { id: 'hero', type: 'hero', label: 'Hero Banner', hasContent: false, fields: ['title', 'subtitle', 'backgroundImage'], missingFields: ['backgroundImage'] },
        { id: 'categories', type: 'grid', label: 'Product Categories', hasContent: true, fields: ['categories'] },
        { id: 'products', type: 'products', label: 'Products Grid', hasContent: true, fields: ['products'] },
        { id: 'featured', type: 'carousel', label: 'Featured Products', hasContent: false, fields: ['featuredProducts'], missingFields: ['featuredProducts'] },
        footerSection,
      ];

    case 'walk-with-us':
      return [
        ...commonSections,
        { id: 'hero', type: 'hero', label: 'Hero Section', hasContent: true, fields: ['title', 'subtitle', 'backgroundImage', 'videoUrl'] },
        { id: 'intro', type: 'content', label: 'Introduction', hasContent: true, fields: ['headline', 'description'] },
        { id: 'pricing', type: 'pricing', label: 'Membership Options', hasContent: false, fields: ['tiers'], missingFields: ['tiers'] },
        { id: 'video', type: 'video', label: 'Video Section', hasContent: false, fields: ['videoUrl', 'videoTitle'], missingFields: ['videoUrl'] },
        { id: 'testimonials', type: 'testimonials', label: 'Member Testimonials', hasContent: false, fields: ['testimonials'], missingFields: ['testimonials'] },
        { id: 'faq', type: 'faq', label: 'FAQ Section', hasContent: false, fields: ['faqs'], missingFields: ['faqs'] },
        { id: 'cta', type: 'cta', label: 'Join CTA', hasContent: true, fields: ['ctaText', 'ctaLink'] },
        footerSection,
      ];

    default:
      return [
        ...commonSections,
        { id: 'hero', type: 'hero', label: 'Hero Section', hasContent: false, fields: ['title', 'subtitle', 'backgroundImage'] },
        { id: 'content', type: 'content', label: 'Main Content', hasContent: false, fields: ['body'] },
        { id: 'cta', type: 'cta', label: 'Call to Action', hasContent: false, fields: ['ctaText', 'ctaLink'] },
        footerSection,
      ];
  }
}

export default PageSectionMapper;
