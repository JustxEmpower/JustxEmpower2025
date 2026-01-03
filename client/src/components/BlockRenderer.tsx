import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Quote,
  Star,
  Grid3X3,
  Play,
  ChevronDown,
  ChevronRight,
  Check,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

function shouldShowBlock(visibility: any): boolean {
  if (!visibility) return true;

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
      transition: { duration, delay, ease: animation.easing || "easeOut" },
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
  const content = block.content || {};

  useEffect(() => {
    if (animation.trigger === "on-load") {
      setIsVisible(true);
    } else if (animation.trigger === "on-scroll") {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setIsVisible(true);
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
    switch (block.type) {
      // Layout Blocks
      case "hero":
        return (
          <div 
            className="relative min-h-[500px] flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl overflow-hidden"
            style={{
              backgroundImage: content.backgroundImage ? `url(${content.backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {content.overlay && content.backgroundImage && (
              <div className="absolute inset-0 bg-black/50" />
            )}
            <div className={`relative z-10 p-8 ${content.variant === 'centered' ? 'text-center' : 'text-left'} max-w-4xl mx-auto`}>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                {content.headline || 'Your Headline Here'}
              </h1>
              <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-8">
                {content.subheadline || 'Your subheadline goes here'}
              </p>
              {content.ctaText && (
                <a href={content.ctaLink || '#'}>
                  <Button size="lg" className="px-8">{content.ctaText}</Button>
                </a>
              )}
            </div>
          </div>
        );

      case "section":
        return (
          <section className={`py-16 ${content.fullWidth ? 'w-full' : 'container mx-auto px-4'}`}>
            {content.title && <h2 className="text-3xl font-bold mb-8">{content.title}</h2>}
            {content.subtitle && <p className="text-neutral-600 mb-8">{content.subtitle}</p>}
          </section>
        );

      case "columns":
        return (
          <div className={`grid grid-cols-1 md:grid-cols-${content.count || 2} gap-${content.gap || 6} p-4`}>
            {Array.from({ length: content.count || 2 }).map((_, i) => (
              <div key={i} className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg min-h-[100px]">
                Column {i + 1}
              </div>
            ))}
          </div>
        );

      case "grid":
        return (
          <div className={`grid grid-cols-${content.columns || 3} gap-${content.gap || 4} p-4`}>
            {Array.from({ length: (content.columns || 3) * (content.rows || 2) }).map((_, i) => (
              <div key={i} className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded min-h-[80px]" />
            ))}
          </div>
        );

      case "spacer":
        return <div style={{ height: `${content.height || 40}px` }} />;

      case "divider":
        return (
          <hr className={`my-8 border-t ${content.style === 'dashed' ? 'border-dashed' : ''} ${content.style === 'dotted' ? 'border-dotted' : ''}`} />
        );

      // Content Blocks
      case "text":
        return (
          <div
            className={`prose prose-lg dark:prose-invert max-w-none p-4 text-${content.alignment || 'left'}`}
            dangerouslySetInnerHTML={{ __html: content.content || content.html || content.text || '<p>Enter your text here...</p>' }}
          />
        );

      case "heading":
        const HeadingTag = (content.level || 'h2') as keyof JSX.IntrinsicElements;
        const sizeClasses: Record<string, string> = {
          h1: 'text-4xl md:text-5xl',
          h2: 'text-3xl md:text-4xl',
          h3: 'text-2xl md:text-3xl',
          h4: 'text-xl md:text-2xl',
          h5: 'text-lg md:text-xl',
          h6: 'text-base md:text-lg',
        };
        return (
          <HeadingTag className={`font-bold ${sizeClasses[content.level || 'h2']} text-${content.alignment || 'left'} p-4`}>
            {content.text || 'Section Heading'}
          </HeadingTag>
        );

      case "quote":
        return (
          <blockquote className="border-l-4 border-primary pl-6 py-4 my-8 bg-neutral-50 dark:bg-neutral-800 rounded-r-xl p-6">
            <Quote className="w-8 h-8 text-primary/30 mb-4" />
            <p className="text-xl italic mb-4">"{content.quote || content.text || 'Enter your quote here...'}"</p>
            {content.author && (
              <footer className="text-sm">
                <strong>{content.author}</strong>
                {content.role && <span className="text-neutral-500"> — {content.role}</span>}
              </footer>
            )}
          </blockquote>
        );

      case "feature-grid":
        const features = content.features || [];
        return (
          <div className="p-6">
            {content.heading && <h2 className="text-3xl font-bold text-center mb-8">{content.heading}</h2>}
            <div className={`grid grid-cols-1 md:grid-cols-${content.columns || 3} gap-6`}>
              {features.length > 0 ? features.map((feature: any, i: number) => (
                <div key={i} className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    <Grid3X3 className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{feature.description}</p>
                </div>
              )) : (
                <div className="col-span-full text-center text-neutral-500 py-8">No features added</div>
              )}
            </div>
          </div>
        );

      case "testimonials":
        const testimonials = content.testimonials || [];
        return (
          <div className="p-6">
            {content.heading && <h2 className="text-3xl font-bold text-center mb-8">{content.heading}</h2>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.length > 0 ? testimonials.map((t: any, i: number) => (
                <div key={i} className="p-6 rounded-xl bg-white dark:bg-neutral-800 shadow-sm border">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className={`w-4 h-4 ${j < (t.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'}`} />
                    ))}
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-4">"{t.quote}"</p>
                  <div>
                    <p className="font-semibold text-sm">{t.author}</p>
                    <p className="text-xs text-neutral-500">{t.role}, {t.company}</p>
                  </div>
                </div>
              )) : (
                <div className="col-span-full text-center text-neutral-500 py-8">No testimonials added</div>
              )}
            </div>
          </div>
        );

      case "team":
        const members = content.members || [];
        return (
          <div className="p-6">
            {content.heading && <h2 className="text-3xl font-bold text-center mb-8">{content.heading}</h2>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {members.map((member: any, i: number) => (
                <div key={i} className="text-center">
                  <div className="w-32 h-32 rounded-full bg-neutral-200 mx-auto mb-4 overflow-hidden">
                    {member.image && <img src={member.image} alt={member.name} className="w-full h-full object-cover" />}
                  </div>
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-neutral-500">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "timeline":
        const events = content.events || [];
        return (
          <div className="p-6">
            {content.heading && <h2 className="text-3xl font-bold text-center mb-8">{content.heading}</h2>}
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-primary/20" />
              {events.map((event: any, i: number) => (
                <div key={i} className="relative pl-12 pb-8">
                  <div className="absolute left-2 w-4 h-4 rounded-full bg-primary" />
                  <div className="text-sm text-primary font-semibold mb-1">{event.date}</div>
                  <h3 className="font-semibold mb-2">{event.title}</h3>
                  <p className="text-neutral-600 dark:text-neutral-400">{event.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "accordion":
        const items = content.items || [];
        return (
          <div className="p-6">
            {content.heading && <h2 className="text-3xl font-bold text-center mb-8">{content.heading}</h2>}
            <Accordion type="single" collapsible className="w-full">
              {items.map((item: any, i: number) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        );

      case "tabs":
        const tabs = content.tabs || [];
        return (
          <div className="p-6">
            <Tabs defaultValue="tab-0" className="w-full">
              <TabsList>
                {tabs.map((tab: any, i: number) => (
                  <TabsTrigger key={i} value={`tab-${i}`}>{tab.title}</TabsTrigger>
                ))}
              </TabsList>
              {tabs.map((tab: any, i: number) => (
                <TabsContent key={i} value={`tab-${i}`} className="p-4">
                  {tab.content}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        );

      case "stats":
        const stats = content.stats || [];
        return (
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat: any, i: number) => (
                <div key={i} className="text-center p-4">
                  <p className="text-4xl font-bold text-primary mb-2">{stat.value}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "cta":
        return (
          <div className={`p-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white ${content.variant === 'centered' ? 'text-center' : ''}`}>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{content.heading || 'Ready to Get Started?'}</h2>
            <p className="text-white/80 mb-6 max-w-2xl mx-auto">{content.description || 'Join thousands of satisfied customers today.'}</p>
            <div className="flex gap-4 justify-center flex-wrap">
              {content.primaryButton?.text && (
                <a href={content.primaryButton.link || '#'}>
                  <Button size="lg" variant="secondary">{content.primaryButton.text}</Button>
                </a>
              )}
              {content.secondaryButton?.text && (
                <a href={content.secondaryButton.link || '#'}>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    {content.secondaryButton.text}
                  </Button>
                </a>
              )}
            </div>
          </div>
        );

      case "alert":
        const alertColors: Record<string, string> = {
          info: 'bg-blue-50 border-blue-200 text-blue-800',
          success: 'bg-green-50 border-green-200 text-green-800',
          warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          error: 'bg-red-50 border-red-200 text-red-800',
        };
        return (
          <div className={`p-4 rounded-lg border ${alertColors[content.type || 'info']}`}>
            {content.title && <h4 className="font-semibold mb-1">{content.title}</h4>}
            <p>{content.message}</p>
          </div>
        );

      case "list":
        const listItems = content.items || [];
        return (
          <ul className={`p-4 ${content.style === 'numbered' ? 'list-decimal' : 'list-disc'} list-inside space-y-2`}>
            {listItems.map((item: string, i: number) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        );

      case "checklist":
        const checkItems = content.items || [];
        return (
          <div className="p-4 space-y-2">
            {checkItems.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded flex items-center justify-center ${item.checked ? 'bg-green-500 text-white' : 'border-2 border-neutral-300'}`}>
                  {item.checked && <Check className="w-3 h-3" />}
                </div>
                <span className={item.checked ? 'line-through text-neutral-500' : ''}>{item.text}</span>
              </div>
            ))}
          </div>
        );

      case "code":
        return (
          <pre className="p-4 bg-neutral-900 text-neutral-100 rounded-lg overflow-x-auto">
            <code className={`language-${content.language || 'javascript'}`}>
              {content.code || '// Your code here'}
            </code>
          </pre>
        );

      case "html":
        return (
          <div dangerouslySetInnerHTML={{ __html: content.html || '' }} />
        );

      // Media Blocks
      case "image":
        return (
          <div className="relative">
            <img
              src={content.url || content.src}
              alt={content.alt || ""}
              className="w-full h-auto rounded-lg"
              style={{ maxWidth: content.width ? `${content.width}px` : "100%" }}
            />
            {content.caption && (
              <p className="text-sm text-neutral-500 mt-2 text-center">{content.caption}</p>
            )}
          </div>
        );

      case "gallery":
        const images = content.images || [];
        return (
          <div className={`grid grid-cols-2 md:grid-cols-${content.columns || 3} gap-4 p-4`}>
            {images.map((img: any, i: number) => (
              <img key={i} src={img.url} alt={img.alt || ''} className="w-full h-48 object-cover rounded-lg" />
            ))}
          </div>
        );

      case "video":
        return (
          <div className="relative aspect-video rounded-lg overflow-hidden">
            {content.url?.includes("youtube.com") || content.url?.includes("youtu.be") ? (
              <iframe
                src={content.url.replace("watch?v=", "embed/")}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : content.url?.includes("vimeo.com") ? (
              <iframe
                src={content.url.replace("vimeo.com", "player.vimeo.com/video")}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={content.url} controls={content.controls !== false} autoPlay={content.autoplay} loop={content.loop} className="w-full h-full" />
            )}
          </div>
        );

      case "video-background":
        return (
          <div className="relative min-h-[400px] flex items-center justify-center overflow-hidden rounded-xl">
            <video
              src={content.url}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 text-white text-center p-8">
              {content.heading && <h2 className="text-4xl font-bold mb-4">{content.heading}</h2>}
              {content.text && <p className="text-xl">{content.text}</p>}
            </div>
          </div>
        );

      case "audio":
        return (
          <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            {content.title && <h4 className="font-semibold mb-2">{content.title}</h4>}
            <audio src={content.url} controls className="w-full" />
          </div>
        );

      case "carousel":
        const slides = content.slides || [];
        return (
          <div className="relative overflow-hidden rounded-xl">
            <div className="flex">
              {slides.map((slide: any, i: number) => (
                <div key={i} className="min-w-full">
                  <img src={slide.url} alt={slide.alt || ''} className="w-full h-[400px] object-cover" />
                </div>
              ))}
            </div>
          </div>
        );

      case "embed":
        return (
          <div className="aspect-video rounded-lg overflow-hidden">
            <iframe src={content.url} className="w-full h-full" allowFullScreen />
          </div>
        );

      // Interactive Blocks
      case "button":
        return (
          <div className={`p-4 text-${content.alignment || 'left'}`}>
            <a href={content.link || '#'}>
              <Button variant={content.variant || 'default'} size={content.size || 'default'}>
                {content.text || 'Click Me'}
              </Button>
            </a>
          </div>
        );

      case "button-group":
        const buttons = content.buttons || [];
        return (
          <div className="flex gap-4 p-4 flex-wrap">
            {buttons.map((btn: any, i: number) => (
              <a key={i} href={btn.link || '#'}>
                <Button variant={btn.variant || 'default'}>{btn.text}</Button>
              </a>
            ))}
          </div>
        );

      case "countdown":
        return (
          <div className="p-6 text-center">
            {content.heading && <h3 className="text-2xl font-bold mb-4">{content.heading}</h3>}
            <div className="flex justify-center gap-4">
              {['Days', 'Hours', 'Minutes', 'Seconds'].map((unit, i) => (
                <div key={i} className="bg-primary/10 rounded-lg p-4 min-w-[80px]">
                  <div className="text-3xl font-bold text-primary">00</div>
                  <div className="text-sm text-neutral-500">{unit}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case "progress":
        return (
          <div className="p-4">
            {content.label && <div className="flex justify-between mb-2">
              <span>{content.label}</span>
              <span>{content.value || 0}%</span>
            </div>}
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${content.value || 0}%` }}
              />
            </div>
          </div>
        );

      case "map":
        return (
          <div className="aspect-video rounded-lg overflow-hidden bg-neutral-200 flex items-center justify-center">
            <MapPin className="w-12 h-12 text-neutral-400" />
            <span className="ml-2 text-neutral-500">Map: {content.address || 'No address set'}</span>
          </div>
        );

      // Data Blocks
      case "table":
        const headers = content.headers || [];
        const rows = content.rows || [];
        return (
          <div className="overflow-x-auto p-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800">
                  {headers.map((h: string, i: number) => (
                    <th key={i} className="p-3 text-left border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row: string[], i: number) => (
                  <tr key={i} className="border-b">
                    {row.map((cell: string, j: number) => (
                      <td key={j} className="p-3 border">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "pricing":
        const plans = content.plans || [];
        return (
          <div className="p-6">
            {content.heading && <h2 className="text-3xl font-bold text-center mb-8">{content.heading}</h2>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan: any, i: number) => (
                <div key={i} className={`p-6 rounded-xl border ${plan.featured ? 'border-primary shadow-lg' : ''}`}>
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold mb-4">{plan.price}</div>
                  <ul className="space-y-2 mb-6">
                    {(plan.features || []).map((f: string, j: number) => (
                      <li key={j} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={plan.featured ? 'default' : 'outline'}>
                    {plan.buttonText || 'Get Started'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      // Social Blocks
      case "social-links":
        return (
          <div className="flex gap-4 p-4 justify-center">
            {content.facebook && <a href={content.facebook} className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200"><Facebook className="w-5 h-5" /></a>}
            {content.twitter && <a href={content.twitter} className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200"><Twitter className="w-5 h-5" /></a>}
            {content.linkedin && <a href={content.linkedin} className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200"><Linkedin className="w-5 h-5" /></a>}
            {content.instagram && <a href={content.instagram} className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200"><Instagram className="w-5 h-5" /></a>}
          </div>
        );

      case "share":
        return (
          <div className="flex gap-4 p-4 items-center">
            <span className="text-sm text-neutral-500">Share:</span>
            <button className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200"><Facebook className="w-4 h-4" /></button>
            <button className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200"><Twitter className="w-4 h-4" /></button>
            <button className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200"><Linkedin className="w-4 h-4" /></button>
          </div>
        );

      // Commerce Blocks
      case "product":
        return (
          <div className="p-4 border rounded-xl">
            <div className="aspect-square bg-neutral-100 rounded-lg mb-4 overflow-hidden">
              {content.image && <img src={content.image} alt={content.name} className="w-full h-full object-cover" />}
            </div>
            <h3 className="font-semibold">{content.name || 'Product Name'}</h3>
            <p className="text-primary font-bold">{content.price || '$0.00'}</p>
            <Button className="w-full mt-4">Add to Cart</Button>
          </div>
        );

      case "product-grid":
        const products = content.products || [];
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4">
            {products.map((product: any, i: number) => (
              <div key={i} className="border rounded-xl p-4">
                <div className="aspect-square bg-neutral-100 rounded-lg mb-4" />
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-primary font-bold">{product.price}</p>
              </div>
            ))}
          </div>
        );

      // Form Blocks
      case "contact-form":
        return (
          <form className="p-6 space-y-4 max-w-xl mx-auto">
            {content.heading && <h2 className="text-2xl font-bold mb-4">{content.heading}</h2>}
            <Input placeholder="Your Name" />
            <Input type="email" placeholder="Your Email" />
            {content.showPhone && <Input type="tel" placeholder="Phone Number" />}
            <Textarea placeholder="Your Message" rows={4} />
            <Button type="submit" className="w-full">{content.buttonText || 'Send Message'}</Button>
          </form>
        );

      case "newsletter":
        return (
          <div className="p-6 bg-primary/5 rounded-xl text-center">
            {content.heading && <h3 className="text-2xl font-bold mb-2">{content.heading}</h3>}
            {content.description && <p className="text-neutral-600 mb-4">{content.description}</p>}
            <form className="flex gap-2 max-w-md mx-auto">
              <Input type="email" placeholder={content.placeholder || 'Enter your email'} className="flex-1" />
              <Button type="submit">{content.buttonText || 'Subscribe'}</Button>
            </form>
          </div>
        );

      case "search":
        return (
          <div className="p-4">
            <div className="relative max-w-xl mx-auto">
              <Input placeholder={content.placeholder || 'Search...'} className="pr-10" />
              <Button size="sm" className="absolute right-1 top-1/2 -translate-y-1/2">Search</Button>
            </div>
          </div>
        );

      // Logo Grid
      case "logo-grid":
        const logos = content.logos || [];
        return (
          <div className="p-6">
            {content.heading && <h3 className="text-xl font-semibold text-center mb-6">{content.heading}</h3>}
            <div className="flex flex-wrap justify-center items-center gap-8">
              {logos.map((logo: any, i: number) => (
                <img key={i} src={logo.url} alt={logo.name || ''} className="h-12 opacity-60 hover:opacity-100 transition-opacity" />
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-center">
            <p className="text-neutral-500">Block type: {block.type}</p>
          </div>
        );
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
    <div className="space-y-8">
      {sortedBlocks.map((block) => (
        <RenderBlock key={block.id} block={block} />
      ))}
    </div>
  );
}
