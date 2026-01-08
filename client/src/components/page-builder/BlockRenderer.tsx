import React from 'react';
import { PageBlock } from './usePageBuilderStore';
import BlockErrorBoundary from './BlockErrorBoundary';
import { getBlockById } from './blockTypes';
import { getMediaUrl } from '@/lib/media';
import {
  JEHeroRenderer,
  JESectionRenderer,
  JECarouselRenderer,
  JENewsletterRenderer,
  JEQuoteRenderer,
  JEPillarGridRenderer,
  JECommunityRenderer,
  JERootedUnityRenderer,
  JEHeadingRenderer,
  JEParagraphRenderer,
  JEImageRenderer,
  JEVideoRenderer,
  JEButtonRenderer,
  JETwoColumnRenderer,
  JEDividerRenderer,
  JESpacerRenderer,
  JEFAQRenderer,
  JEContactFormRenderer,
  JETestimonialRenderer,
  JEOfferingsGridRenderer,
  JEComingSoonRenderer,
  JEGalleryRenderer,
  JETeamMemberRenderer,
  JEPrinciplesRenderer,
  JEFooterRenderer,
  JEVolumesRenderer,
  JEFeatureCardRenderer,
} from './renderers/JEBlockRenderers';
import {
  Layout,
  Type,
  Image as ImageIcon,
  Video,
  Quote,
  Grid3X3,
  Star,
  Users,
  Clock,
  ChevronDown,
  Layers,
  TrendingUp,
  Building,
  MousePointer,
  AlertCircle,
  List,
  CheckSquare,
  Images,
  Play,
  Music,
  Columns,
  BarChart3,
  Table,
  DollarSign,
  Share2,
  Newspaper,
  Box,
  Mail,
  FileText,
  Globe,
  Code,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BlockRendererProps {
  block: PageBlock;
}

// Hero Block
function HeroBlock({ content }: { content: Record<string, unknown> }) {
  const variant = content.variant as string || 'centered';
  const overlay = content.overlay as boolean;
  
  return (
    <div 
      className="relative min-h-[400px] flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl overflow-hidden"
      style={{
        backgroundImage: content.backgroundImage ? `url(${content.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {overlay && content.backgroundImage ? (
        <div className="absolute inset-0 bg-black/50" />
      ) : null}
      <div className={`relative z-10 p-8 ${variant === 'centered' ? 'text-center' : 'text-left'}`}>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {content.headline as string || 'Your Headline Here'}
        </h1>
        <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-8 max-w-2xl mx-auto">
          {content.subheadline as string || 'Your subheadline goes here'}
        </p>
        {content.ctaText ? (
          <Button size="lg" className="px-8">
            {String(content.ctaText)}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

// Text Block
function TextBlock({ content }: { content: Record<string, unknown> }) {
  return (
    <div 
      className={`prose dark:prose-invert max-w-none p-4 text-${content.alignment || 'left'}`}
      dangerouslySetInnerHTML={{ __html: content.content as string || '<p>Enter your text here...</p>' }}
    />
  );
}

// Heading Block
function HeadingBlock({ content }: { content: Record<string, unknown> }) {
  const level = (content.level as string) || 'h2';
  const text = (content.text as string) || 'Section Heading';
  const alignment = (content.alignment as string) || 'left';
  
  const sizeClasses: Record<string, string> = {
    h1: 'text-4xl md:text-5xl',
    h2: 'text-3xl md:text-4xl',
    h3: 'text-2xl md:text-3xl',
    h4: 'text-xl md:text-2xl',
    h5: 'text-lg md:text-xl',
    h6: 'text-base md:text-lg',
  };
  
  const className = `font-bold ${sizeClasses[level] || sizeClasses.h2} text-${alignment} p-4`;
  
  switch (level) {
    case 'h1':
      return <h1 className={className}>{text}</h1>;
    case 'h3':
      return <h3 className={className}>{text}</h3>;
    case 'h4':
      return <h4 className={className}>{text}</h4>;
    case 'h5':
      return <h5 className={className}>{text}</h5>;
    case 'h6':
      return <h6 className={className}>{text}</h6>;
    default:
      return <h2 className={className}>{text}</h2>;
  }
}

// Quote Block
function QuoteBlock({ content }: { content: Record<string, unknown> }) {
  const variant = content.variant as string || 'default';
  
  return (
    <blockquote className={`
      p-6 rounded-xl
      ${variant === 'bordered' ? 'border-l-4 border-primary bg-neutral-50 dark:bg-neutral-800' : ''}
      ${variant === 'modern' ? 'bg-gradient-to-br from-primary/10 to-primary/5' : ''}
      ${variant === 'large' ? 'text-2xl italic' : ''}
    `}>
      <Quote className="w-8 h-8 text-primary/30 mb-4" />
      <p className="text-lg italic mb-4">"{content.quote as string || 'Enter your quote here...'}"</p>
      {content.author ? (
        <footer className="text-sm">
          <strong>{String(content.author)}</strong>
          {content.role ? <span className="text-neutral-500"> — {String(content.role)}</span> : null}
        </footer>
      ) : null}
    </blockquote>
  );
}

// Feature Grid Block
function FeatureGridBlock({ content }: { content: Record<string, unknown> }) {
  const features = (content.features as Array<{ icon: string; title: string; description: string }>) || [];
  const columns = content.columns as number || 3;
  
  return (
    <div className="p-6">
      {content.heading ? (
        <h2 className="text-3xl font-bold text-center mb-8">{String(content.heading)}</h2>
      ) : null}
      <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-6`}>
        {features.length > 0 ? features.map((feature, i) => (
          <div key={i} className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <Grid3X3 className="w-6 h-6" />
            </div>
            <h3 className="font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{feature.description}</p>
          </div>
        )) : (
          <div className="col-span-full text-center text-neutral-500 py-8">
            Add features in the settings panel
          </div>
        )}
      </div>
    </div>
  );
}

// Testimonials Block
function TestimonialsBlock({ content }: { content: Record<string, unknown> }) {
  const testimonials = (content.testimonials as Array<{
    quote: string;
    author: string;
    role: string;
    company: string;
    rating: number;
  }>) || [];
  
  return (
    <div className="p-6">
      {content.heading ? (
        <h2 className="text-3xl font-bold text-center mb-8">{String(content.heading)}</h2>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.length > 0 ? testimonials.map((t, i) => (
          <div key={i} className="p-6 rounded-xl bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className={`w-4 h-4 ${j < t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'}`} />
              ))}
            </div>
            <p className="text-neutral-600 dark:text-neutral-300 mb-4">"{t.quote}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
              <div>
                <p className="font-semibold text-sm">{t.author}</p>
                <p className="text-xs text-neutral-500">{t.role}, {t.company}</p>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center text-neutral-500 py-8">
            Add testimonials in the settings panel
          </div>
        )}
      </div>
    </div>
  );
}

// Stats Block
function StatsBlock({ content }: { content: Record<string, unknown> }) {
  const stats = (content.stats as Array<{ value: string; label: string }>) || [];
  
  return (
    <div className="p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.length > 0 ? stats.map((stat, i) => (
          <div key={i} className="text-center p-4">
            <p className="text-4xl font-bold text-primary mb-2">{stat.value}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{stat.label}</p>
          </div>
        )) : (
          <div className="col-span-full text-center text-neutral-500 py-8">
            Add statistics in the settings panel
          </div>
        )}
      </div>
    </div>
  );
}

// CTA Block
function CTABlock({ content }: { content: Record<string, unknown> }) {
  const variant = content.variant as string || 'centered';
  
  return (
    <div className={`p-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white ${variant === 'centered' ? 'text-center' : ''}`}>
      <h2 className="text-2xl md:text-3xl font-bold mb-4">
        {content.heading as string || 'Ready to Get Started?'}
      </h2>
      <p className="text-white/80 mb-6 max-w-2xl mx-auto">
        {content.description as string || 'Join thousands of satisfied customers today.'}
      </p>
      <div className="flex gap-4 justify-center flex-wrap">
        {(content.primaryButton as { text: string; link: string })?.text && (
          <Button size="lg" variant="secondary">
            {(content.primaryButton as { text: string }).text}
          </Button>
        )}
        {(content.secondaryButton as { text: string; link: string })?.text && (
          <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
            {(content.secondaryButton as { text: string }).text}
          </Button>
        )}
      </div>
    </div>
  );
}

// Accordion Block
function AccordionBlock({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as Array<{ question: string; answer: string }>) || [];
  
  return (
    <div className="p-6">
      {content.heading ? (
        <h2 className="text-3xl font-bold text-center mb-8">{String(content.heading)}</h2>
      ) : null}
      <Accordion type="single" collapsible className="w-full">
        {items.length > 0 ? items.map((item, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        )) : (
          <div className="text-center text-neutral-500 py-8">
            Add FAQ items in the settings panel
          </div>
        )}
      </Accordion>
    </div>
  );
}

// Tabs Block
function TabsBlock({ content }: { content: Record<string, unknown> }) {
  const tabs = (content.tabs as Array<{ label: string; content: string }>) || [];
  
  if (tabs.length === 0) {
    return (
      <div className="p-6 text-center text-neutral-500">
        Add tabs in the settings panel
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <Tabs defaultValue="tab-0" className="w-full">
        <TabsList className="w-full justify-start">
          {tabs.map((tab, i) => (
            <TabsTrigger key={i} value={`tab-${i}`}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab, i) => (
          <TabsContent key={i} value={`tab-${i}`} className="p-4">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// Image Block
function ImageBlock({ content }: { content: Record<string, unknown> }) {
  const src = content.src as string;
  const alignment = content.alignment as string || 'center';
  
  if (!src) {
    return (
      <div className="p-6 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl text-center">
        <ImageIcon className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
        <p className="text-neutral-500">Add an image URL in the settings</p>
      </div>
    );
  }
  
  const imageUrl = getMediaUrl(src);
  
  return (
    <figure className={`p-4 text-${alignment}`}>
      <img 
        src={imageUrl} 
        alt={content.alt as string || ''} 
        className="max-w-full h-auto rounded-lg mx-auto"
      />
      {content.caption ? (
        <figcaption className="text-sm text-neutral-500 mt-2">{String(content.caption)}</figcaption>
      ) : null}
    </figure>
  );
}

// Video Block
function VideoBlock({ content }: { content: Record<string, unknown> }) {
  const url = content.url as string;
  const poster = content.poster as string;
  
  if (!url) {
    return (
      <div className="p-6 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl text-center">
        <Video className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
        <p className="text-neutral-500">Add a video URL in the settings</p>
      </div>
    );
  }
  
  const videoUrl = getMediaUrl(url);
  const posterUrl = poster ? getMediaUrl(poster) : undefined;
  
  // Check if it's a direct video file (mp4, webm, mov, etc.)
  const isDirectVideo = /\.(mp4|webm|mov|ogg|m4v|avi|mkv)(\?|$)/i.test(videoUrl);
  
  if (isDirectVideo) {
    return (
      <div className="p-4 aspect-video">
        <video
          src={videoUrl}
          poster={posterUrl}
          controls
          className="w-full h-full rounded-lg object-cover"
          playsInline
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }
  
  // Convert YouTube URL to embed
  let embedUrl = url;
  if (url.includes('youtube.com/watch')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
  } else if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
  } else if (url.includes('vimeo.com/')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    embedUrl = `https://player.vimeo.com/video/${videoId}`;
  }
  
  return (
    <div className="p-4 aspect-video">
      <iframe
        src={embedUrl}
        className="w-full h-full rounded-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

// Spacer Block
function SpacerBlock({ content }: { content: Record<string, unknown> }) {
  const height = content.height as number || 64;
  
  return (
    <div 
      style={{ height: `${height}px` }} 
      className="flex items-center justify-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded"
    >
      <span className="text-xs text-neutral-400">{height}px</span>
    </div>
  );
}

// Divider Block
function DividerBlock({ content }: { content: Record<string, unknown> }) {
  return (
    <hr 
      className="my-4"
      style={{
        borderStyle: content.style as string || 'solid',
        borderColor: content.color as string || '#e5e7eb',
        width: content.width as string || '100%',
      }}
    />
  );
}

// Button Block
function ButtonBlock({ content }: { content: Record<string, unknown> }) {
  const variant = content.variant as 'primary' | 'secondary' | 'outline' | 'ghost' || 'primary';
  const size = content.size as 'sm' | 'default' | 'lg' || 'default';
  
  return (
    <div className="p-4 text-center">
      <Button variant={variant === 'primary' ? 'default' : variant} size={size}>
        {content.text as string || 'Button'}
      </Button>
    </div>
  );
}

// Contact Form Block
function ContactFormBlock({ content }: { content: Record<string, unknown> }) {
  return (
    <div className="p-6 max-w-xl mx-auto">
      {content.heading ? (
        <h2 className="text-2xl font-bold text-center mb-6">{String(content.heading)}</h2>
      ) : null}
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input type="text" className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Message</label>
          <textarea rows={4} className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800" />
        </div>
        <Button className="w-full">{content.submitText as string || 'Send Message'}</Button>
      </form>
    </div>
  );
}

// Newsletter Block
function NewsletterBlock({ content }: { content: Record<string, unknown> }) {
  return (
    <div className="p-8 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center">
      {content.heading ? (
        <h2 className="text-2xl font-bold mb-2">{String(content.heading)}</h2>
      ) : null}
      {content.description ? (
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">{String(content.description)}</p>
      ) : null}
      <div className="flex gap-2 max-w-md mx-auto">
        <input 
          type="email" 
          placeholder={content.placeholder as string || 'Enter your email'}
          className="flex-1 px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
        />
        <Button>{content.buttonText as string || 'Subscribe'}</Button>
      </div>
    </div>
  );
}

// Pricing Block
function PricingBlock({ content }: { content: Record<string, unknown> }) {
  const plans = (content.plans as Array<{
    name: string;
    price: string;
    period: string;
    features: string[];
    ctaText: string;
    highlighted: boolean;
  }>) || [];
  
  return (
    <div className="p-6">
      {content.heading ? (
        <h2 className="text-3xl font-bold text-center mb-8">{String(content.heading)}</h2>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.length > 0 ? plans.map((plan, i) => (
          <div 
            key={i} 
            className={`p-6 rounded-xl border-2 ${
              plan.highlighted 
                ? 'border-primary bg-primary/5 scale-105' 
                : 'border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-neutral-500">/{plan.period}</span>
            </div>
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, j) => (
                <li key={j} className="flex items-center gap-2 text-sm">
                  <CheckSquare className="w-4 h-4 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button className="w-full" variant={plan.highlighted ? 'default' : 'outline'}>
              {plan.ctaText}
            </Button>
          </div>
        )) : (
          <div className="col-span-full text-center text-neutral-500 py-8">
            Add pricing plans in the settings panel
          </div>
        )}
      </div>
    </div>
  );
}

// Code Block
function CodeBlock({ content }: { content: Record<string, unknown> }) {
  return (
    <div className="p-4">
      <pre className={`p-4 rounded-lg overflow-x-auto ${content.theme === 'dark' ? 'bg-neutral-900 text-neutral-100' : 'bg-neutral-100 text-neutral-900'}`}>
        <code className="text-sm font-mono">
          {content.code as string || '// Your code here'}
        </code>
      </pre>
    </div>
  );
}

// HTML Block
function HTMLBlock({ content }: { content: Record<string, unknown> }) {
  const html = content.html as string;
  
  if (!html) {
    return (
      <div className="p-6 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl text-center">
        <Code className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
        <p className="text-neutral-500">Add custom HTML in the settings</p>
      </div>
    );
  }
  
  return (
    <div className="p-4" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

// Default/Placeholder Block
function PlaceholderBlock({ block }: { block: PageBlock }) {
  const blockType = getBlockById(block.type);
  const Icon = blockType?.icon || Box;
  
  return (
    <div className="p-8 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl text-center">
      <Icon className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
      <p className="font-medium text-neutral-600 dark:text-neutral-400">{blockType?.name || block.type}</p>
      <p className="text-sm text-neutral-500 mt-1">Configure this block in the settings panel</p>
    </div>
  );
}

// Main BlockRenderer component
export default function BlockRenderer({ block }: BlockRendererProps) {
  const { content } = block;
  
  // Apply custom styles
  const customStyles: React.CSSProperties = {};
  if (content.backgroundColor) customStyles.backgroundColor = content.backgroundColor as string;
  if (content.textColor) customStyles.color = content.textColor as string;
  
  const paddingMap: Record<string, string> = {
    none: '',
    small: 'py-4',
    medium: 'py-8',
    large: 'py-12',
    xlarge: 'py-16',
  };
  
  const radiusMap: Record<string, string> = {
    none: '',
    small: 'rounded',
    medium: 'rounded-lg',
    large: 'rounded-xl',
    full: 'rounded-3xl',
  };
  
  const wrapperClasses = `
    ${paddingMap[content.padding as string] || ''}
    ${radiusMap[content.borderRadius as string] || ''}
    ${content.customClass || ''}
    ${content.hideOnMobile ? 'hidden md:block' : ''}
    ${content.hideOnDesktop ? 'md:hidden' : ''}
  `;
  
  const renderBlock = () => {
    switch (block.type) {
      case 'hero':
        return <HeroBlock content={content} />;
      case 'text':
        return <TextBlock content={content} />;
      case 'heading':
        return <HeadingBlock content={content} />;
      case 'quote':
        return <QuoteBlock content={content} />;
      case 'feature-grid':
        return <FeatureGridBlock content={content} />;
      case 'testimonials':
        return <TestimonialsBlock content={content} />;
      case 'stats':
        return <StatsBlock content={content} />;
      case 'cta':
        return <CTABlock content={content} />;
      case 'accordion':
        return <AccordionBlock content={content} />;
      case 'tabs':
        return <TabsBlock content={content} />;
      case 'image':
        return <ImageBlock content={content} />;
      case 'video':
        return <VideoBlock content={content} />;
      case 'spacer':
        return <SpacerBlock content={content} />;
      case 'divider':
        return <DividerBlock content={content} />;
      case 'button':
        return <ButtonBlock content={content} />;
      case 'contact-form':
        return <ContactFormBlock content={content} />;
      case 'newsletter':
        return <NewsletterBlock content={content} />;
      case 'pricing':
        return <PricingBlock content={content} />;
      case 'code':
        return <CodeBlock content={content} />;
      case 'html':
        return <HTMLBlock content={content} />;
      // JE Hero blocks
      case 'je-hero':
      case 'je-hero-video':
      case 'je-hero-image':
      case 'je-hero-split':
        return <JEHeroRenderer block={block} />;
      // JE Section blocks
      case 'je-section-standard':
      case 'je-section-fullwidth':
      case 'je-section-full-width':
        return <JESectionRenderer block={block} />;
      // JE Text blocks
      case 'je-heading':
        return <JEHeadingRenderer block={block} />;
      case 'je-paragraph':
        return <JEParagraphRenderer block={block} />;
      case 'je-quote':
      case 'je-blockquote':
        return <JEQuoteRenderer block={block} />;
      // JE Media blocks
      case 'je-image':
        return <JEImageRenderer block={block} />;
      case 'je-video':
        return <JEVideoRenderer block={block} />;
      case 'je-gallery':
        return <JEGalleryRenderer block={block} />;
      case 'je-carousel':
      case 'je-offerings-carousel':
        return <JECarouselRenderer block={block} />;
      // JE Interactive blocks
      case 'je-button':
        return <JEButtonRenderer block={block} />;
      case 'je-newsletter':
        return <JENewsletterRenderer block={block} />;
      case 'je-contact-form':
        return <JEContactFormRenderer block={block} />;
      case 'je-faq':
        return <JEFAQRenderer block={block} />;
      case 'je-testimonial':
        return <JETestimonialRenderer block={block} />;
      // JE Layout blocks
      case 'je-two-column':
        return <JETwoColumnRenderer block={block} />;
      case 'je-pillar-grid':
      case 'je-pillars':
      case 'je-three-pillars':
        return <JEPillarGridRenderer block={block} />;
      case 'je-principles':
        return <JEPrinciplesRenderer block={block} />;
      case 'je-offerings-grid':
        return <JEOfferingsGridRenderer block={block} />;
      // JE Special sections
      case 'je-community':
      case 'je-community-section':
        return <JECommunityRenderer block={block} />;
      case 'je-rooted-unity':
        return <JERootedUnityRenderer block={block} />;
      case 'je-coming-soon':
        return <JEComingSoonRenderer block={block} />;
      case 'je-team-member':
        return <JETeamMemberRenderer block={block} />;
      case 'je-feature-card':
        return <JEFeatureCardRenderer block={block} />;
      case 'je-volumes':
        return <JEVolumesRenderer block={block} />;
      // JE Utility blocks
      case 'je-divider':
        return <JEDividerRenderer block={block} />;
      case 'je-spacer':
        return <JESpacerRenderer block={block} />;
      case 'je-footer':
        return <JEFooterRenderer block={block} />;
      default:
        return <PlaceholderBlock block={block} />;
    }
  };
  
  return (
    <BlockErrorBoundary blockId={block.id} blockType={block.type}>
      <div 
        className={wrapperClasses}
        style={customStyles}
        id={content.customId as string || undefined}
      >
        {content.customCss ? (
          <style>{String(content.customCss)}</style>
        ) : null}
        {renderBlock()}
      </div>
    </BlockErrorBoundary>
  );
}
