import { motion } from "framer-motion";
import { useEffect, useState } from "react";

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
  const content = block.content || {};

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
    switch (block.type) {
      case "text":
        return (
          <div
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: content.html || content.text || "" }}
          />
        );

      case "image":
        return (
          <div className="relative">
            <img
              src={content.url}
              alt={content.alt || ""}
              className="w-full h-auto rounded-lg"
              style={{
                maxWidth: content.width ? `${content.width}px` : "100%",
                margin: settings.alignment === "center" ? "0 auto" : "0",
              }}
            />
            {content.caption && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 text-center">
                {content.caption}
              </p>
            )}
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
            ) : (
              <video src={content.url} controls className="w-full h-full" />
            )}
          </div>
        );

      case "quote":
        return (
          <blockquote className="border-l-4 border-amber-500 pl-6 py-4 my-8">
            <p className="text-2xl font-light italic text-neutral-700 dark:text-neutral-300 mb-2">
              "{content.text}"
            </p>
            {content.author && (
              <cite className="text-sm text-neutral-500 dark:text-neutral-400 not-italic">
                — {content.author}
              </cite>
            )}
          </blockquote>
        );

      case "cta":
        return (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-neutral-800 dark:to-neutral-900 rounded-2xl p-8 text-center">
            {content.title && (
              <h3 className="text-3xl font-light mb-4">{content.title}</h3>
            )}
            {content.description && (
              <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-2xl mx-auto">
                {content.description}
              </p>
            )}
            {content.buttonText && content.buttonUrl && (
              <a
                href={content.buttonUrl}
                className="inline-block px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-full transition-colors"
                style={{
                  backgroundColor: content.buttonColor || undefined,
                }}
              >
                {content.buttonText}
              </a>
            )}
          </div>
        );

      case "spacer":
        return <div style={{ height: `${content.height || 40}px` }} />;

      default:
        return <p className="text-neutral-400">Unknown block type: {block.type}</p>;
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
