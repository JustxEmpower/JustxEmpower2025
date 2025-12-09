import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Helmet } from "react-helmet";

export default function DynamicPage() {
  const [, params] = useRoute("/:slug");
  const slug = params?.slug || "";

  const { data: page, isLoading, error } = trpc.pages.getBySlug.useQuery({ slug });

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

  return (
    <>
      <Helmet>
        <title>{page.metaTitle || page.title}</title>
        {page.metaDescription && <meta name="description" content={page.metaDescription} />}
        {page.ogImage && <meta property="og:image" content={page.ogImage} />}
      </Helmet>

      <div className="min-h-screen py-20">
        <div className="container max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-light mb-8 text-center">{page.title}</h1>
          
          <div className="prose prose-lg dark:prose-invert mx-auto">
            <p className="text-neutral-600 dark:text-neutral-400 text-center">
              This is a dynamically created page. Content editing coming soon!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
