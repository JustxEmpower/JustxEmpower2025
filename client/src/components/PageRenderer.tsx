import { trpc } from "@/lib/trpc";
import TextBlockDisplay from "@/components/blocks/TextBlockDisplay";
import ImageBlock from "@/components/blocks/ImageBlock";
import VideoBlock from "@/components/blocks/VideoBlock";
import QuoteBlock from "@/components/blocks/QuoteBlock";
import CTABlock from "@/components/blocks/CTABlock";
import SpacerBlock from "@/components/blocks/SpacerBlock";

interface PageRendererProps {
  pageId: number;
}

export default function PageRenderer({ pageId }: PageRendererProps) {
  const blocksQuery = trpc.pages.getBlocks.useQuery({ pageId });

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

  const blocks = blocksQuery.data || [];

  if (blocks.length === 0) {
    return (
      <div className="container py-12">
        <p className="text-center text-neutral-500">This page has no content yet.</p>
      </div>
    );
  }

  const renderBlock = (block: { id: number; type: string; content: string | null; settings: string | null }) => {
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

  return (
    <div className="container py-12">
      <div className="max-w-5xl mx-auto">
        {blocks.map((block) => renderBlock(block))}
      </div>
    </div>
  );
}
