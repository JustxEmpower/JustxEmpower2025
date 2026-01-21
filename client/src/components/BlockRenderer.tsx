import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap, Shield, Sparkles, Star, Heart, Award, Target, Users, Clock, CheckCircle } from "lucide-react";
import {
  JEHeroRenderer,
  JESectionRenderer,
  JECarouselRenderer,
  JENewsletterRenderer,
  JEPillarGridRenderer,
  JECommunityRenderer,
  JERootedUnityRenderer,
  JEHeadingRenderer,
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
  JECalendarRenderer,
} from './page-builder/renderers/JEBlockRenderers';
import { JEQuoteRenderer, JEParagraphRenderer as JEParagraphRendererCore } from './page-builder/renderers/BlockRenderers-Part1-Core';

interface BlockData {
  id: number;
  type: string;
  content: any;
  settings: any;
  animation: any;
  visibility: any;
  order: number;
}

interface BlockRendererProps {
  blocks: BlockData[];
}

// Icon mapping for feature grids
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  zap: Zap,
  shield: Shield,
  sparkles: Sparkles,
  star: Star,
  heart: Heart,
  award: Award,
  target: Target,
  users: Users,
  clock: Clock,
  check: CheckCircle,
};

function shouldShowBlock(visibility: any): boolean {
  if (!visibility) return true;

  // Check device type
  if (visibility.devices && visibility.devices.length > 0) {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    const isDesktop = window.innerWidth >= 1024;

    const deviceMatch =
      (isMobile && visibility.devices.includes("mobile")) ||
      (isTablet && visibility.devices.includes("tablet")) ||
      (isDesktop && visibility.devices.includes("desktop"));

    if (!deviceMatch) return false;
  }

  // Check schedule
  if (visibility.schedule) {
    const now = new Date();
    if (visibility.schedule.startDate) {
      const start = new Date(visibility.schedule.startDate);
      if (now < start) return false;
    }
    if (visibility.schedule.endDate) {
      const end = new Date(visibility.schedule.endDate);
      if (now > end) return false;
    }
  }

  return true;
}

function getAnimationVariants(animation: any) {
  if (!animation || animation.type === "none") return {};

  const duration = animation.duration || 0.5;
  const delay = animation.delay || 0;

  const variants: any = {
    hidden: {},
    visible: {
      transition: {
        duration,
        delay,
        ease: animation.easing || "easeOut",
      },
    },
  };

  switch (animation.type) {
    case "fade-in":
      variants.hidden = { opacity: 0 };
      variants.visible = { ...variants.visible, opacity: 1 };
      break;
    case "slide-up":
      variants.hidden = { opacity: 0, y: 50 };
      variants.visible = { ...variants.visible, opacity: 1, y: 0 };
      break;
    case "slide-down":
      variants.hidden = { opacity: 0, y: -50 };
      variants.visible = { ...variants.visible, opacity: 1, y: 0 };
      break;
    case "zoom":
      variants.hidden = { opacity: 0, scale: 0.8 };
      variants.visible = { ...variants.visible, opacity: 1, scale: 1 };
      break;
    default:
      return {};
  }

  return variants;
}

function RenderBlock({ block }: { block: BlockData }) {
  const [isVisible, setIsVisible] = useState(false);
  const settings = block.settings || {};
  const animation = block.animation || {};
  
  // Parse content if it's a string
  let content = block.content || {};
  if (typeof content === 'string') {
    try {
      content = JSON.parse(content);
    } catch (e) {
      content = {};
    }
  }
  
  // Get the original block type from content if available
  const originalType = content._originalType || block.type;
  const { _originalType, ...cleanContent } = content;
  
  // Create a PageBlock-compatible object for JE renderers
  const pageBlock = {
    id: String(block.id),
    type: originalType,
    content: cleanContent,
    order: block.order || 0,
  };

  useEffect(() => {
    if (animation.trigger === "on-load") {
      setIsVisible(true);
    } else if (animation.trigger === "on-scroll") {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        },
        { threshold: 0.1 }
      );

      const element = document.getElementById(`block-${block.id}`);
      if (element) observer.observe(element);

      return () => observer.disconnect();
    } else {
      setIsVisible(true);
    }
  }, [animation.trigger, block.id]);

  const variants = getAnimationVariants(animation);
  const MotionDiv = animation.type && animation.type !== "none" ? motion.div : "div";

  const blockStyle = {
    textAlign: settings.alignment || "left",
    backgroundColor: settings.backgroundColor || "transparent",
    color: settings.textColor || "inherit",
    padding: settings.padding || "0",
    marginTop: settings.marginTop || "0",
    marginBottom: settings.marginBottom || "0",
  };

  const renderContent = () => {
    // Use original type for Page Builder blocks
    switch (originalType) {
      // Page Builder block types
      case "hero": {
        // Check if backgroundImage is a video file
        const bgMedia = cleanContent.backgroundImage || '';
        const isVideo = /\.(mp4|webm|mov|ogg)$/i.test(bgMedia) || bgMedia.includes('video/');
        
        return (
          <div 
            className="relative min-h-[60vh] flex items-center justify-center text-center py-20"
            style={{
              backgroundImage: !isVideo && bgMedia ? `url(${bgMedia})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: isVideo ? '#1a1a1a' : undefined,
            }}
          >
            {/* Video Background */}
            {isVideo && bgMedia && (
              <video
                src={bgMedia}
                autoPlay
                muted
                loop
                playsInline
                crossOrigin="anonymous"
                preload="auto"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ zIndex: 0 }}
              />
            )}
            {/* Overlay */}
            {cleanContent.overlay && (cleanContent.backgroundImage || isVideo) && (
              <div className="absolute inset-0 bg-black/50" style={{ zIndex: 1 }} />
            )}
            <div className="relative z-10 max-w-4xl mx-auto px-4">
              <h1 className="text-5xl md:text-6xl font-light mb-6">
                {cleanContent.headline || 'Welcome'}
              </h1>
              {cleanContent.subheadline && (
                <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-300 mb-8">
                  {cleanContent.subheadline}
                </p>
              )}
              {cleanContent.ctaText && (
                <Button size="lg" asChild>
                  <a href={cleanContent.ctaLink || '#'}>{cleanContent.ctaText}</a>
                </Button>
              )}
            </div>
          </div>
        );
      }

      case "feature-grid":
        const features = cleanContent.features || [];
        const columns = cleanContent.columns || 3;
        return (
          <div className="py-16">
            {cleanContent.heading && (
              <h2 className="text-3xl md:text-4xl font-light text-center mb-12">
                {cleanContent.heading}
              </h2>
            )}
            <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-8`}>
              {features.map((feature: any, index: number) => {
                const IconComponent = iconMap[feature.icon] || Sparkles;
                return (
                  <div key={index} className="text-center p-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                      <IconComponent className="w-8 h-8 text-amber-600" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                    <p className="text-neutral-600 dark:text-neutral-400">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "testimonials":
        const testimonials = cleanContent.testimonials || [];
        return (
          <div className="py-16">
            {cleanContent.heading && (
              <h2 className="text-3xl md:text-4xl font-light text-center mb-12">
                {cleanContent.heading}
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial: any, index: number) => (
                <div key={index} className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-6">
                  <p className="text-lg italic mb-4">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    {testimonial.avatar && (
                      <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full" />
                    )}
                    <div>
                      <p className="font-medium">{testimonial.name}</p>
                      {testimonial.role && (
                        <p className="text-sm text-neutral-500">{testimonial.role}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "stats":
        const stats = cleanContent.stats || [];
        return (
          <div className="py-16 bg-neutral-50 dark:bg-neutral-900 rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((stat: any, index: number) => (
                <div key={index}>
                  <div className="text-4xl md:text-5xl font-light text-amber-600 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-neutral-600 dark:text-neutral-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case "heading":
        const level = cleanContent.level || 'h2';
        const HeadingTag = level as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
        const headingSizes: Record<string, string> = {
          h1: 'text-5xl md:text-6xl',
          h2: 'text-4xl md:text-5xl',
          h3: 'text-3xl md:text-4xl',
          h4: 'text-2xl md:text-3xl',
          h5: 'text-xl md:text-2xl',
          h6: 'text-lg md:text-xl',
        };
        return (
          <HeadingTag className={`${headingSizes[level] || headingSizes.h2} font-light`}>
            {cleanContent.text || 'Heading'}
          </HeadingTag>
        );

      case "accordion":
        const items = cleanContent.items || [];
        return (
          <div className="space-y-4">
            {cleanContent.heading && (
              <h2 className="text-3xl font-light mb-8">{cleanContent.heading}</h2>
            )}
            {items.map((item: any, index: number) => (
              <details key={index} className="group border border-neutral-200 dark:border-neutral-700 rounded-lg">
                <summary className="flex items-center justify-between p-4 cursor-pointer">
                  <span className="font-medium">{item.title}</span>
                  <span className="transform group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="p-4 pt-0 text-neutral-600 dark:text-neutral-400">
                  {item.content}
                </div>
              </details>
            ))}
          </div>
        );

      case "timeline":
        const events = cleanContent.events || [];
        return (
          <div className="py-8">
            {cleanContent.heading && (
              <h2 className="text-3xl font-light mb-12 text-center">{cleanContent.heading}</h2>
            )}
            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-amber-200 dark:bg-amber-800" />
              {events.map((event: any, index: number) => (
                <div key={index} className={`relative flex items-center mb-8 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className="w-1/2 px-8">
                    <div className={`${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                      <span className="text-amber-600 font-medium">{event.date}</span>
                      <h3 className="text-xl font-medium mt-1">{event.title}</h3>
                      <p className="text-neutral-600 dark:text-neutral-400 mt-2">{event.description}</p>
                    </div>
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-amber-500 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        );

      case "logo-grid":
        const logos = cleanContent.logos || [];
        return (
          <div className="py-12">
            {cleanContent.heading && (
              <h2 className="text-2xl font-light text-center mb-8 text-neutral-500">{cleanContent.heading}</h2>
            )}
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
              {logos.map((logo: any, index: number) => (
                <img 
                  key={index} 
                  src={logo.url} 
                  alt={logo.alt || `Logo ${index + 1}`} 
                  className="h-12 md:h-16 object-contain opacity-60 hover:opacity-100 transition-opacity"
                />
              ))}
            </div>
          </div>
        );

      case "team":
        const members = cleanContent.members || [];
        return (
          <div className="py-16">
            {cleanContent.heading && (
              <h2 className="text-3xl md:text-4xl font-light text-center mb-12">{cleanContent.heading}</h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {members.map((member: any, index: number) => (
                <div key={index} className="text-center">
                  {member.image && (
                    <img src={member.image} alt={member.name} className="w-32 h-32 mx-auto rounded-full object-cover mb-4" />
                  )}
                  <h3 className="text-xl font-medium">{member.name}</h3>
                  {member.role && (
                    <p className="text-amber-600">{member.role}</p>
                  )}
                  {member.bio && (
                    <p className="text-neutral-600 dark:text-neutral-400 mt-2 text-sm">{member.bio}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      // Original block types
      case "text":
        return (
          <div
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: cleanContent.html || cleanContent.text || "" }}
          />
        );

      case "image":
        return (
          <div className="relative">
            <img
              src={cleanContent.url}
              alt={cleanContent.alt || ""}
              className="w-full h-auto rounded-lg"
              style={{
                maxWidth: cleanContent.width ? `${cleanContent.width}px` : "100%",
                margin: settings.alignment === "center" ? "0 auto" : "0",
              }}
            />
            {cleanContent.caption && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 text-center">
                {cleanContent.caption}
              </p>
            )}
          </div>
        );

      case "video":
        return (
          <div className="relative aspect-video rounded-lg overflow-hidden">
            {cleanContent.url?.includes("youtube.com") || cleanContent.url?.includes("youtu.be") ? (
              <iframe
                src={cleanContent.url.replace("watch?v=", "embed/")}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={cleanContent.url} controls className="w-full h-full" />
            )}
          </div>
        );

      case "quote":
        return (
          <blockquote className="border-l-4 border-amber-500 pl-6 py-4 my-8">
            <p className="text-2xl font-light italic text-neutral-700 dark:text-neutral-300 mb-2">
              {cleanContent.text}
            </p>
            {cleanContent.author && (
              <cite className="text-sm text-neutral-500 dark:text-neutral-400 not-italic">
                — {cleanContent.author}
              </cite>
            )}
          </blockquote>
        );

      case "cta":
        return (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-neutral-800 dark:to-neutral-900 rounded-2xl p-8 md:p-12 text-center">
            {(cleanContent.title || cleanContent.heading) && (
              <h3 className="text-3xl md:text-4xl font-light mb-4">{cleanContent.title || cleanContent.heading}</h3>
            )}
            {cleanContent.description && (
              <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto text-lg">
                {cleanContent.description}
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-4">
              {cleanContent.buttonText && cleanContent.buttonUrl && (
                <Button size="lg" asChild>
                  <a href={cleanContent.buttonUrl}>{cleanContent.buttonText}</a>
                </Button>
              )}
              {cleanContent.primaryButton && (
                <Button size="lg" asChild>
                  <a href={cleanContent.primaryButton.link || '#'}>{cleanContent.primaryButton.text}</a>
                </Button>
              )}
              {cleanContent.secondaryButton && (
                <Button size="lg" variant="outline" asChild>
                  <a href={cleanContent.secondaryButton.link || '#'}>{cleanContent.secondaryButton.text}</a>
                </Button>
              )}
            </div>
          </div>
        );

      case "spacer":
        return <div style={{ height: `${cleanContent.height || 40}px` }} />;

      case "divider":
        return <hr className="border-neutral-200 dark:border-neutral-700 my-8" />;

      // JE Block Types - Hero
      case "je-hero-video":
      case "je-hero-image":
      case "je-hero-split":
        return <JEHeroRenderer block={pageBlock} />;

      // JE Block Types - Sections
      case "je-section-standard":
      case "je-section-fullwidth":
        return <JESectionRenderer block={pageBlock} />;

      // JE Block Types - Content
      case "je-heading":
        return <JEHeadingRenderer block={pageBlock} />;
      case "je-paragraph":
        return <JEParagraphRendererCore block={pageBlock} />;
      case "je-blockquote":
        return <JEQuoteRenderer block={pageBlock} />;
      case "je-image":
        return <JEImageRenderer block={pageBlock} />;
      case "je-video":
        return <JEVideoRenderer block={pageBlock} />;
      case "je-gallery":
        return <JEGalleryRenderer block={pageBlock} />;
      case "je-button":
        return <JEButtonRenderer block={pageBlock} />;

      // JE Block Types - Layout
      case "je-two-column":
        return <JETwoColumnRenderer block={pageBlock} />;
      case "je-divider":
        return <JEDividerRenderer block={pageBlock} />;
      case "je-spacer":
        return <JESpacerRenderer block={pageBlock} />;

      // JE Block Types - Features
      case "je-pillars":
        return <JEPillarGridRenderer block={pageBlock} />;
      case "je-principles":
        return <JEPrinciplesRenderer block={pageBlock} />;
      case "je-feature-card":
        return <JEFeatureCardRenderer block={pageBlock} />;

      // JE Block Types - Offerings
      case "je-offerings-grid":
        return <JEOfferingsGridRenderer block={pageBlock} />;
      case "je-offerings-carousel":
      case "je-carousel":
        return <JECarouselRenderer block={pageBlock} />;
      case "je-volumes":
        return <JEVolumesRenderer block={pageBlock} />;

      // JE Block Types - Community
      case "je-community-section":
        return <JECommunityRenderer block={pageBlock} />;
      case "je-coming-soon":
        return <JEComingSoonRenderer block={pageBlock} />;
      case "je-testimonial":
        return <JETestimonialRenderer block={pageBlock} />;
      case "je-team-member":
        return <JETeamMemberRenderer block={pageBlock} />;

      // JE Block Types - Interactive
      case "je-newsletter":
        return <JENewsletterRenderer block={pageBlock} />;
      case "je-contact-form":
        return <JEContactFormRenderer block={pageBlock} />;
      case "je-faq":
        return <JEFAQRenderer block={pageBlock} />;
      case "je-calendar":
        return <JECalendarRenderer block={pageBlock} />;

      // JE Block Types - Footer
      case "je-footer":
        return <JEFooterRenderer block={pageBlock} />;

      default:
        // For unknown types, try to render any text content
        if (cleanContent.text || cleanContent.html) {
          return (
            <div
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: cleanContent.html || cleanContent.text || "" }}
            />
          );
        }
        return <p className="text-neutral-400">Unknown block type: {originalType}</p>;
    }
  };

  return (
    <MotionDiv
      id={`block-${block.id}`}
      style={blockStyle as any}
      initial={variants.hidden || false}
      animate={isVisible ? variants.visible || false : variants.hidden || false}
      whileHover={animation.trigger === "on-hover" ? variants.visible : undefined}
      className="block-wrapper"
    >
      {renderContent()}
    </MotionDiv>
  );
}

export default function BlockRenderer({ blocks }: BlockRendererProps) {
  const visibleBlocks = blocks.filter((block) => shouldShowBlock(block.visibility));
  const sortedBlocks = [...visibleBlocks].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-8" data-page-builder="true">
      {sortedBlocks.map((block) => (
        <RenderBlock key={block.id} block={block} />
      ))}
    </div>
  );
}
