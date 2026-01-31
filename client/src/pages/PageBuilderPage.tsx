import React, { useState, useEffect, useMemo } from 'react';
import PageBuilder from '@/components/page-builder/PageBuilder';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation, useRoute } from 'wouter';
import { Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { usePageBuilderStore } from '@/components/page-builder/usePageBuilderStore';

// Demo blocks for new pages - defined outside component to avoid recreation
const DEMO_BLOCKS = [
  {
    id: 'demo-hero',
    type: 'je-hero-video',
    content: {
      title: 'Your Page Title',
      subtitle: 'WELCOME',
      description: 'Add your page description here. Customize this hero section with your own content.',
      ctaText: 'Learn More',
      ctaLink: '#',
      overlayOpacity: 40,
      minHeight: '80vh',
    },
    order: 0,
  },
  {
    id: 'demo-content',
    type: 'je-two-column',
    content: {
      title: 'Section Title',
      description: 'Add your content here. This is a two-column layout that works great for showcasing information with an image.',
      imageUrl: '',
      imagePosition: 'right',
      ctaText: '',
      ctaLink: '',
    },
    order: 1,
  },
  {
    id: 'demo-footer',
    type: 'je-footer',
    content: {
      logo: '',
      tagline: 'Catalyzing the Rise of Her.',
      columns: [
        { title: 'Navigate', links: [{ text: 'Home', url: '/' }, { text: 'Philosophy', url: '/philosophy' }] },
        { title: 'Offerings', links: [{ text: 'Workshops', url: '/offerings' }, { text: 'Retreats', url: '/offerings' }] },
        { title: 'Connect', links: [{ text: 'Contact', url: '/contact' }, { text: 'Walk With Us', url: '/walk-with-us' }] },
      ],
      socialLinks: [
        { platform: 'instagram', url: '' },
        { platform: 'facebook', url: '' },
      ],
      copyright: '© 2025 Just Empower. All rights reserved.',
      showNewsletter: true,
    },
    order: 2,
  },
];

// Map Page Builder block types to database block types
const mapBlockType = (type: string): "text" | "image" | "video" | "quote" | "cta" | "spacer" => {
  const typeMap: Record<string, "text" | "image" | "video" | "quote" | "cta" | "spacer"> = {
    'hero': 'text',
    'text': 'text',
    'heading': 'text',
    'quote': 'quote',
    'feature-grid': 'text',
    'testimonials': 'text',
    'team': 'text',
    'timeline': 'text',
    'accordion': 'text',
    'tabs': 'text',
    'stats': 'text',
    'cta': 'cta',
    'alert': 'text',
    'list': 'text',
    'checklist': 'text',
    'code': 'text',
    'html': 'text',
    'image': 'image',
    'gallery': 'image',
    'video': 'video',
    'video-background': 'video',
    'audio': 'video',
    'carousel': 'image',
    'embed': 'video',
    'button': 'cta',
    'button-group': 'cta',
    'countdown': 'text',
    'progress': 'text',
    'map': 'text',
    'table': 'text',
    'pricing': 'text',
    'social-links': 'text',
    'share': 'text',
    'product': 'text',
    'product-grid': 'text',
    'contact-form': 'text',
    'newsletter': 'text',
    'search': 'text',
    'logo-grid': 'image',
    'section': 'text',
    'columns': 'text',
    'grid': 'text',
    'spacer': 'spacer',
    'divider': 'spacer',
  };
  return typeMap[type] || 'text';
};

export default function PageBuilderPage() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/admin/page-builder/:pageId');
  
  // Parse pageId from URL params - this will update when URL changes
  const pageIdFromUrl = params?.pageId ? parseInt(params.pageId) : undefined;
  
  // Use the URL param directly instead of local state to ensure sync
  const [currentPageId, setCurrentPageId] = useState<number | undefined>(pageIdFromUrl);
  const [pageTitle, setPageTitle] = useState('Untitled Page');
  const [pageSlug, setPageSlug] = useState('');
  
  const { clearAutoSave, resetForNewPage } = usePageBuilderStore();

  // Sync currentPageId with URL param when it changes
  useEffect(() => {
    if (pageIdFromUrl !== currentPageId) {
      // Reset the store state when switching pages
      resetForNewPage();
      setCurrentPageId(pageIdFromUrl);
      // Reset local state when switching pages
      setPageTitle('Untitled Page');
      setPageSlug('');
    }
  }, [pageIdFromUrl, currentPageId, resetForNewPage]);

  // Fetch page details if editing
  const { data: existingPage, isLoading: pageLoading, refetch: refetchPage } = trpc.admin.pages.getById.useQuery(
    { id: currentPageId! },
    { 
      enabled: !!currentPageId,
      refetchOnMount: true,
    }
  );

  // Fetch page blocks if editing existing page
  const { data: existingBlocks, isLoading: blocksLoading, refetch: refetchBlocks } = trpc.admin.pages.blocks.list.useQuery(
    { pageId: currentPageId! },
    { 
      enabled: !!currentPageId,
      refetchOnMount: true,
    }
  );

  // Refetch data when page ID changes
  useEffect(() => {
    if (currentPageId) {
      refetchPage();
      refetchBlocks();
    }
  }, [currentPageId, refetchPage, refetchBlocks]);

  // Update state when page data is loaded
  useEffect(() => {
    if (existingPage) {
      setPageTitle(existingPage.title);
      setPageSlug(existingPage.slug);
    }
  }, [existingPage]);

  // Mutations - must be called before any early returns
  const createPageMutation = trpc.admin.pages.create.useMutation();
  const updatePageMutation = trpc.admin.pages.update.useMutation();
  const createBlockMutation = trpc.admin.pages.blocks.create.useMutation();
  const updateBlockMutation = trpc.admin.pages.blocks.update.useMutation();
  const deleteBlockMutation = trpc.admin.pages.blocks.delete.useMutation();
  const utils = trpc.useUtils();

  // Convert existing blocks to Page Builder format - memoized to prevent unnecessary recalculations
  // MUST be called before early return to maintain hook order
  const initialBlocks = useMemo(() => {
    if (existingBlocks && existingBlocks.length > 0) {
      return existingBlocks.map(block => {
        let content: Record<string, unknown> = {};
        try {
          content = typeof block.content === 'string' ? JSON.parse(block.content) : block.content;
        } catch (e) {
          content = {};
        }
        
        // Get the original block type from the content if stored
        const originalType = (content._originalType as string) || block.type;
        const { _originalType, ...cleanContent } = content;
        
        return {
          id: String(block.id),
          type: originalType,
          content: cleanContent,
          order: block.order,
        };
      });
    }
    
    // Demo blocks for new pages only
    return DEMO_BLOCKS;
  }, [existingBlocks]);

  // Use a unique key to force PageBuilder to remount when editing different pages
  const builderKey = useMemo(() => {
    return currentPageId ? `page-${currentPageId}` : 'new-page';
  }, [currentPageId]);

  // Show loading state while fetching existing page data
  const isLoadingExistingPage = currentPageId && (pageLoading || blocksLoading);
  
  if (authLoading || isLoadingExistingPage) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-neutral-500">Loading page builder...</p>
        </div>
      </div>
    );
  }

  const handleSave = async (
    blocks: Array<{
      id: string;
      type: string;
      content: Record<string, unknown>;
      order: number;
    }>,
    title: string,
    slug: string,
    showInNav: boolean,
    published: boolean = true
  ) => {
    try {
      let savedPageId = currentPageId;

      // Create or update the page
      if (!savedPageId) {
        // Create new page
        const newPage = await createPageMutation.mutateAsync({
          title,
          slug: slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          template: 'page-builder',
          published: published ? 1 : 0,
          showInNav: showInNav ? 1 : 0,
          navOrder: 100,
        });
        savedPageId = newPage.id;
        setCurrentPageId(savedPageId);
        toast.success('Page created successfully!');
      } else {
        // Update existing page
        await updatePageMutation.mutateAsync({
          id: savedPageId,
          title,
          slug,
          showInNav: showInNav ? 1 : 0,
          published: published ? 1 : 0,
        });
      }

      // Get existing blocks for this page
      const existingBlockIds = existingBlocks?.map(b => b.id) || [];
      const newBlockIds = blocks.map(b => b.id);

      // Delete blocks that are no longer in the list
      for (const existingId of existingBlockIds) {
        if (!newBlockIds.includes(String(existingId))) {
          await deleteBlockMutation.mutateAsync({ id: existingId });
        }
      }

      // Create or update blocks
      for (const block of blocks) {
        // Store the original block type in the content for later retrieval
        const contentWithType = {
          ...block.content,
          _originalType: block.type,
        };
        
        const blockData = {
          pageId: savedPageId,
          type: mapBlockType(block.type),
          content: JSON.stringify(contentWithType),
          order: block.order,
          settings: JSON.stringify({}),
        };

        const existingBlock = existingBlocks?.find(b => String(b.id) === block.id);
        
        if (existingBlock) {
          // Update existing block
          await updateBlockMutation.mutateAsync({
            id: existingBlock.id,
            content: blockData.content,
            order: blockData.order,
            settings: blockData.settings,
          });
        } else {
          // Create new block
          await createBlockMutation.mutateAsync(blockData);
        }
      }

      // Invalidate queries to refresh data
      utils.admin.pages.blocks.list.invalidate({ pageId: savedPageId });
      utils.admin.pages.getById.invalidate({ id: savedPageId });
      // Navigation is under admin router
      utils.admin.navigation.list.invalidate({ location: 'header' });
      utils.admin.navigation.list.invalidate({ location: 'footer' });

      // Clear auto-save after successful save
      clearAutoSave();

      toast.success('Page saved successfully!');
      
      // Update URL if this was a new page
      if (!pageIdFromUrl && savedPageId) {
        setLocation(`/admin/page-builder/${savedPageId}`, { replace: true });
      }
    } catch (error: any) {
      console.error('Error saving page:', error);
      // Show specific error message if available
      const errorMessage = error?.message || error?.data?.message || 'Failed to save page. Please try again.';
      toast.error(errorMessage);
      throw error;
    }
  };

  return (
    <PageBuilder
      key={builderKey}
      pageId={currentPageId ? String(currentPageId) : undefined}
      initialBlocks={initialBlocks}
      initialTitle={existingPage?.title || 'Untitled Page'}
      onSave={handleSave}
    />
  );
}
