import { trpc } from "@/lib/trpc";
import { useMemo } from "react";
import TextBlockDisplay from "@/components/blocks/TextBlockDisplay";
import ImageBlock from "@/components/blocks/ImageBlock";
import VideoBlock from "@/components/blocks/VideoBlock";
import QuoteBlock from "@/components/blocks/QuoteBlock";
import CTABlock from "@/components/blocks/CTABlock";
import SpacerBlock from "@/components/blocks/SpacerBlock";
import { AnimatedBlock } from "@/components/AnimatedBlock";

interface PageRendererProps {
  pageId: number;
}

interface BlockData {
  id: number;
  type: string;
  content: any;
  settings: any;
  visibility: any;
  animation: any;
}

export default function PageRenderer({ pageId }: PageRendererProps) {
  const blocksQuery = trpc.pages.getBlocks.useQuery({ pageId });

  // Filter blocks based on visibility conditions
  const visibleBlocks = useMemo(() => {
    if (!blocksQuery.data) return [];

    const now = new Date();
    const isDesktop = window.innerWidth >= 1024;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    const isMobile = window.innerWidth < 768;

    return blocksQuery.data.filter((block: BlockData) => {
      try {
        const visibility = block.visibility ? JSON.parse(block.visibility) : {};

        // Device visibility check
        if (visibility.devices) {
          const { desktop, tablet, mobile } = visibility.devices;
          // If all are undefined/null, show on all devices (default)
          const hasDeviceRules = desktop !== undefined || tablet !== undefined || mobile !== undefined;
          
          if (hasDeviceRules) {
            if (isDesktop && desktop === false) return false;
            if (isTablet && tablet === false) return false;
            if (isMobile && mobile === false) return false;
          }
        }

        // Schedule visibility check
        if (visibility.schedule) {
          const { startDate, endDate } = visibility.schedule;
          
          if (startDate && new Date(startDate) > now) {
            return false; // Not yet started
          }
          
          if (endDate && new Date(endDate) < now) {
            return false; // Already ended
          }
        }

        // Auth visibility check (simplified - would need actual auth context)
        // For now, we'll skip auth checks on public pages
        // In a real implementation, you'd check user auth status here

        return true;
      } catch {
        return true; // Show block if visibility parsing fails
      }
    });
  }, [blocksQuery.data]);

  if (blocksQuery.isLoading) {
    return (
      <div className="container py-12">
        <p className="text-center text-neutral-500">Loading...</p>
      </div>
    );
  }

  if (blocksQuery.isError) {
    return (
      <div className="container py-12">
        <p className="text-center text-red-600">Failed to load page content</p>
      </div>
    );
  }

  if (visibleBlocks.length === 0) {
    return (
      <div className="container py-12">
        <p className="text-center text-neutral-500">This page has no content yet.</p>
      </div>
    );
  }

  const renderBlock = (block: BlockData) => {
    const settings = JSON.parse(block.settings || "{}");
    const content = block.content || "";

    let blockElement = null;

    switch (block.type) {
      case "text":
        blockElement = <TextBlockDisplay key={block.id} content={content} settings={settings} />;
        break;
      case "image":
        blockElement = <ImageBlock key={block.id} content={content} settings={settings} />;
        break;
      case "video":
        blockElement = <VideoBlock key={block.id} content={content} settings={settings} />;
        break;
      case "quote":
        blockElement = <QuoteBlock key={block.id} content={content} settings={settings} />;
        break;
      case "cta":
        blockElement = <CTABlock key={block.id} content={content} settings={settings} />;
        break;
      case "spacer":
        blockElement = <SpacerBlock key={block.id} content={content} settings={settings} />;
        break;
      default:
        return null;
    }

    // Wrap block with animation if configured
    return (
      <AnimatedBlock key={block.id} animation={block.animation || "{}"}>
        {blockElement}
      </AnimatedBlock>
    );
  };

  return (
    <div className="container py-12">
      <div className="max-w-5xl mx-auto">
        {visibleBlocks.map((block) => renderBlock(block))}
      </div>
    </div>
  );
}
