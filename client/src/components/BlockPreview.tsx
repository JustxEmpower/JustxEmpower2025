import TextBlockDisplay from "@/components/blocks/TextBlockDisplay";
import ImageBlock from "@/components/blocks/ImageBlock";
import VideoBlock from "@/components/blocks/VideoBlock";
import QuoteBlock from "@/components/blocks/QuoteBlock";
import CTABlock from "@/components/blocks/CTABlock";
import SpacerBlock from "@/components/blocks/SpacerBlock";

interface PageBlock {
  id: number;
  pageId: number;
  type: "text" | "image" | "video" | "quote" | "cta" | "spacer";
  content: string | null;
  settings: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface BlockPreviewProps {
  blocks: PageBlock[];
}

export default function BlockPreview({ blocks }: BlockPreviewProps) {
  const renderBlock = (block: PageBlock) => {
    const settings = JSON.parse(block.settings || "{}");
    const content = block.content || "";

    switch (block.type) {
      case "text":
        return <TextBlockDisplay key={block.id} content={content} settings={settings} />;
      case "image":
        return <ImageBlock key={block.id} content={content} settings={settings} />;
      case "video":
        return <VideoBlock key={block.id} content={content} settings={settings} />;
      case "quote":
        return <QuoteBlock key={block.id} content={content} settings={settings} />;
      case "cta":
        return <CTABlock key={block.id} content={content} settings={settings} />;
      case "spacer":
        return <SpacerBlock key={block.id} content={content} settings={settings} />;
      default:
        return null;
    }
  };

  if (blocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-neutral-500">No blocks to preview</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="container py-12">
        <div className="max-w-5xl mx-auto">
          {blocks.map((block) => renderBlock(block))}
        </div>
      </div>
    </div>
  );
}
