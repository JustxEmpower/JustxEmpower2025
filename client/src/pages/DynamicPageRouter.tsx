import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import DynamicPage from "./DynamicPage";
import PageBuilderPreview from "./PageBuilderPreview";
import Home from "./Home";
import About from "./About";
import Philosophy from "./Philosophy";
import Offerings from "./Offerings";
import Journal from "./Journal";
import Contact from "./Contact";
import EmergeWithUs from "./EmergeWithUs";
import Shop from "./Shop";
import Resources from "./Resources";
import CommunityEvents from "./CommunityEvents";
import Events from "./Events";
import NotFound from "./NotFound";

// Map template names to components
const templateComponents: Record<string, React.ComponentType<{ slug?: string }>> = {
  'home': Home,
  'about': About,
  'philosophy': Philosophy,
  'offerings': Offerings,
  'journal': Journal,
  'blog': Journal,
  'contact': Contact,
  'emerge-with-us': EmergeWithUs,
  'shop': Shop,
  'resources': Resources,
  'community-events': CommunityEvents,
  'events': Events,
};

export default function DynamicPageRouter() {
  const [, params] = useRoute("/:slug");
  const slug = params?.slug || "";

  // Fetch page info to get the template
  const { data: pageInfo, isLoading, error } = trpc.pages.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error || !pageInfo) {
    return <NotFound />;
  }

  // Get the component based on template
  const template = pageInfo.template || 'default';
  const Component = templateComponents[template];

  if (Component) {
    // Pass the slug to the component so it can fetch content dynamically
    return <Component slug={slug} />;
  }

  // Use PageBuilderPreview for page-builder template pages (full-bleed with Lenis scroll)
  if (template === 'page-builder') {
    return <PageBuilderPreview slug={slug} />;
  }

  // Fall back to DynamicPage for default/content-editor templates
  return <DynamicPage />;
}
