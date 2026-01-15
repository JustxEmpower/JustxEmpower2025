/**
 * PageBuilderPreview - Full-bleed preview for Page Builder pages
 * 
 * Features:
 * - Lenis smooth scrolling (matching original pages)
 * - Full-bleed layout (no container constraints)
 * - GSAP ScrollTrigger support for blocks
 */

import { useEffect, useRef } from 'react';
import { useRoute } from 'wouter';
import { Helmet } from 'react-helmet';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { trpc } from '@/lib/trpc';
import {
  JEHeroRenderer,
  JESectionRenderer,
  JECarouselRenderer,
  JENewsletterRenderer,
  JEQuoteRenderer,
  JEPillarGridRenderer,
  JECommunityRenderer,
  JERootedUnityRenderer,
  JEHeadingRenderer,
  JEParagraphRenderer,
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
} from '@/components/page-builder/renderers/JEBlockRenderers';

gsap.registerPlugin(ScrollTrigger);

interface PageBuilderPreviewProps {
  slug?: string;
}

// Map block types to their renderers
const blockRenderers: Record<string, React.ComponentType<any>> = {
  // Hero blocks
  'je-hero': JEHeroRenderer,
  'je-hero-video': JEHeroRenderer,
  'je-hero-image': JEHeroRenderer,
  'je-hero-split': JEHeroRenderer,
  'hero': JEHeroRenderer,
  
  // Section blocks
  'je-section': JESectionRenderer,
  'je-section-standard': JESectionRenderer,
  'je-section-fullwidth': JESectionRenderer,
  'je-section-full-width': JESectionRenderer,
  'section': JESectionRenderer,
  
  // Carousel
  'je-carousel': JECarouselRenderer,
  'carousel': JECarouselRenderer,
  
  // Newsletter
  'je-newsletter': JENewsletterRenderer,
  'newsletter': JENewsletterRenderer,
  
  // Quote
  'je-quote': JEQuoteRenderer,
  'quote': JEQuoteRenderer,
  
  // Pillar Grid
  'je-pillar-grid': JEPillarGridRenderer,
  'pillar-grid': JEPillarGridRenderer,
  
  // Community
  'je-community': JECommunityRenderer,
  'community': JECommunityRenderer,
  
  // Rooted Unity
  'je-rooted-unity': JERootedUnityRenderer,
  'rooted-unity': JERootedUnityRenderer,
  
  // Typography
  'je-heading': JEHeadingRenderer,
  'heading': JEHeadingRenderer,
  'je-paragraph': JEParagraphRenderer,
  'paragraph': JEParagraphRenderer,
  
  // Media
  'je-image': JEImageRenderer,
  'image': JEImageRenderer,
  'je-video': JEVideoRenderer,
  'video': JEVideoRenderer,
  
  // Layout
  'je-button': JEButtonRenderer,
  'button': JEButtonRenderer,
  'je-two-column': JETwoColumnRenderer,
  'two-column': JETwoColumnRenderer,
  'je-divider': JEDividerRenderer,
  'divider': JEDividerRenderer,
  'je-spacer': JESpacerRenderer,
  'spacer': JESpacerRenderer,
  
  // Interactive
  'je-faq': JEFAQRenderer,
  'faq': JEFAQRenderer,
  'je-contact-form': JEContactFormRenderer,
  'contact-form': JEContactFormRenderer,
  
  // Content
  'je-testimonial': JETestimonialRenderer,
  'testimonial': JETestimonialRenderer,
  'je-offerings-grid': JEOfferingsGridRenderer,
  'offerings-grid': JEOfferingsGridRenderer,
  'je-coming-soon': JEComingSoonRenderer,
  'coming-soon': JEComingSoonRenderer,
  'je-gallery': JEGalleryRenderer,
  'gallery': JEGalleryRenderer,
  'je-team-member': JETeamMemberRenderer,
  'team-member': JETeamMemberRenderer,
  'je-principles': JEPrinciplesRenderer,
  'principles': JEPrinciplesRenderer,
  'je-volumes': JEVolumesRenderer,
  'volumes': JEVolumesRenderer,
  'je-feature-card': JEFeatureCardRenderer,
  'feature-card': JEFeatureCardRenderer,
  'je-calendar': JECalendarRenderer,
  'calendar': JECalendarRenderer,
  
  // Footer
  'je-footer': JEFooterRenderer,
  'footer': JEFooterRenderer,
};

export default function PageBuilderPreview({ slug }: PageBuilderPreviewProps) {
  const [, params] = useRoute('/:slug');
  const pageSlug = slug || params?.slug || '';
  const containerRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Fetch page data
  const { data: page, isLoading: pageLoading } = trpc.pages.getBySlug.useQuery(
    { slug: pageSlug },
    { enabled: !!pageSlug }
  );

  // Fetch blocks
  const { data: blocks = [], isLoading: blocksLoading } = trpc.pages.getBlocks.useQuery(
    { pageId: page?.id || 0 },
    { enabled: !!page?.id }
  );

  // Initialize Lenis smooth scroll
  useEffect(() => {
    // Initialize Lenis with luxurious, fluid settings (matching original pages)
    const lenis = new Lenis({
      duration: 2.0, // Slower, more luxurious feel
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.8, // Slower scroll speed
      touchMultiplier: 1.5,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Refresh ScrollTrigger when blocks change
  useEffect(() => {
    if (blocks.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);
    }
  }, [blocks]);

  if (pageLoading || blocksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-light mb-4 text-foreground">Page Not Found</h1>
          <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
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

      <div 
        ref={containerRef}
        className="min-h-screen bg-background selection:bg-primary selection:text-white"
        data-page-builder-preview="true"
      >
        <main>
          {blocks.length > 0 ? (
            blocks
              .sort((a, b) => a.order - b.order)
              .map((block) => {
                // Parse content if it's a string
                let content = block.content || {};
                if (typeof content === 'string') {
                  try {
                    content = JSON.parse(content);
                  } catch (e) {
                    content = {};
                  }
                }

                // Get the original block type
                const originalType = content._originalType || block.type;
                const { _originalType, ...cleanContent } = content;

                // Find the appropriate renderer
                const Renderer = blockRenderers[originalType] || blockRenderers[block.type];

                if (!Renderer) {
                  console.warn(`No renderer found for block type: ${originalType || block.type}`);
                  return null;
                }

                // Create a block object compatible with the renderers
                const blockData = {
                  id: String(block.id),
                  type: originalType || block.type,
                  content: cleanContent,
                  order: block.order,
                };

                return (
                  <div key={block.id} data-block-id={block.id} data-block-type={originalType || block.type}>
                    <Renderer block={blockData} isEditing={false} isBlockSelected={false} />
                  </div>
                );
              })
          ) : (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-light mb-4 text-foreground">{page.title}</h1>
                <p className="text-muted-foreground">
                  This page has no content yet. Add blocks in the Page Builder.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
