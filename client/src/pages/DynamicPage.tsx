import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Helmet } from "react-helmet";
import BlockRenderer from "@/components/BlockRenderer";

// Check if block should render full-width (outside container)
function isFullWidthBlock(block: any): boolean {
  let content = block.content || {};
  if (typeof content === 'string') {
    try { content = JSON.parse(content); } catch { content = {}; }
  }
  const blockType = content._originalType || block.type;
  const fullWidthTypes = [
    'je-hero', 'je-hero-video', 'je-hero-image', 'je-hero-split',
    'je-section-standard', 'je-section-fullwidth', 'je-carousel',
    'je-gallery', 'je-newsletter', 'je-community', 'je-footer',
    'hero', 'section', 'carousel', 'gallery'
  ];
  return fullWidthTypes.includes(blockType);
}

export default function DynamicPage() {
  const [, params] = useRoute("/:slug");
  const slug = params?.slug || "";

  const { data: page, isLoading, error } = trpc.pages.getBySlug.useQuery({ slug });
  const { data: blocks = [] } = trpc.pages.getBlocks.useQuery(
    { pageId: page?.id || 0 },
    { enabled: !!page?.id }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-light mb-4">Page Not Found</h1>
          <p className="text-neutral-600">The page you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Separate blocks into full-width and contained
  const fullWidthBlocks = blocks.filter(isFullWidthBlock);
  const containedBlocks = blocks.filter(b => !isFullWidthBlock(b));
  
  // Check if first block is a hero (don't show page title if hero exists)
  const hasHeroFirst = blocks.length > 0 && isFullWidthBlock(blocks[0]);

  return (
    <>
      <Helmet>
        <title>{page.metaTitle || page.title}</title>
        {page.metaDescription && <meta name="description" content={page.metaDescription} />}
        {page.ogImage && <meta property="og:image" content={page.ogImage} />}
      </Helmet>

      <div className="min-h-screen" data-dynamic-page="true" data-page-builder="true">
        {/* Render all blocks in order, with full-width blocks outside container */}
        {blocks.length > 0 ? (
          blocks.map((block, index) => {
            if (isFullWidthBlock(block)) {
              // Full-width blocks render without container constraints
              return (
                <div key={block.id} className="w-full">
                  <BlockRenderer blocks={[block]} />
                </div>
              );
            } else {
              // Contained blocks render inside the container
              return (
                <div key={block.id} className="container max-w-4xl mx-auto px-4 py-8">
                  <BlockRenderer blocks={[block]} />
                </div>
              );
            }
          })
        ) : (
          <div className="container max-w-4xl mx-auto px-4 py-20">
            <h1 className="text-5xl font-light mb-8 text-center">{page.title}</h1>
            <div className="prose prose-lg dark:prose-invert mx-auto">
              <p className="text-neutral-600 dark:text-neutral-400 text-center">
                This page has no content yet. Add blocks in the admin panel.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
