import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Helmet } from "react-helmet";
import BlockRenderer from "@/components/BlockRenderer";

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

  // Check if the first block is a hero block - if so, render without container wrapper
  const firstBlock = blocks[0];
  const hasHeroBlock = firstBlock && (
    firstBlock.type?.startsWith('je-hero') || 
    firstBlock.type === 'hero' ||
    (firstBlock.content as any)?._originalType?.startsWith('je-hero')
  );

  return (
    <>
      <Helmet>
        <title>{page.metaTitle || page.title}</title>
        {page.metaDescription && <meta name="description" content={page.metaDescription} />}
        {page.ogImage && <meta property="og:image" content={page.ogImage} />}
      </Helmet>

      <div className="min-h-screen" data-dynamic-page="true" data-page-builder="true">
        {blocks.length > 0 ? (
          <BlockRenderer blocks={blocks} />
        ) : (
          <div className="py-20">
            <div className="container max-w-4xl mx-auto px-4">
              <h1 className="text-5xl font-light mb-8 text-center">{page.title}</h1>
              <div className="prose prose-lg dark:prose-invert mx-auto">
                <p className="text-neutral-600 dark:text-neutral-400 text-center">
                  This page has no content yet. Add blocks in the admin panel.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
