import React, { useState, useEffect } from 'react';
import PageBuilder from '@/components/page-builder/PageBuilder';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation, useRoute } from 'wouter';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Loader2, Plus, FileText, ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PageData {
  id: number;
  title: string;
  slug: string;
  template?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  published: number;
  showInNav: number;
  navOrder?: number | null;
  parentId?: number | null;
}

export default function PageBuilderPage() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [matchNew] = useRoute('/admin/page-builder/new');
  const [matchEdit, params] = useRoute('/admin/page-builder/:pageId');
  
  const [showPageList, setShowPageList] = useState(false);
  const [showNewPageDialog, setShowNewPageDialog] = useState(false);
  const [showPageSettings, setShowPageSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageData | null>(null);
  const [initialBlocks, setInitialBlocks] = useState<Array<{
    id: string;
    type: string;
    content: Record<string, unknown>;
    order: number;
  }>>([]);

  // New page form state
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageShowInNav, setNewPageShowInNav] = useState(true);
  const [newPageParentId, setNewPageParentId] = useState<number | null>(null);

  // Fetch all pages for the list
  const { data: pages, isLoading: pagesLoading, refetch: refetchPages } = trpc.admin.pages.list.useQuery(
    undefined,
    { enabled: !matchNew && !matchEdit }
  );

  // Fetch single page data when editing
  const pageId = matchEdit ? parseInt(params?.pageId || '0') : null;
  const { data: pageData, isLoading: pageLoading } = trpc.admin.pages.get.useQuery(
    { slug: currentPage?.slug || '' },
    { enabled: !!currentPage?.slug }
  );

  // Fetch blocks for the current page
  const { data: blocksData, isLoading: blocksLoading, refetch: refetchBlocks } = trpc.admin.pages.blocks.list.useQuery(
    { pageId: currentPage?.id || 0 },
    { enabled: !!currentPage?.id }
  );

  // Mutations
  const createPageMutation = trpc.admin.pages.create.useMutation({
    onSuccess: (page) => {
      toast.success('Page created successfully');
      setShowNewPageDialog(false);
      setCurrentPage(page as PageData);
      setLocation(`/admin/page-builder/${page.id}`);
      refetchPages();
    },
    onError: (error) => {
      toast.error(`Failed to create page: ${error.message}`);
    },
  });

  const updatePageMutation = trpc.admin.pages.update.useMutation({
    onSuccess: () => {
      toast.success('Page settings saved');
      setShowPageSettings(false);
      refetchPages();
    },
    onError: (error) => {
      toast.error(`Failed to update page: ${error.message}`);
    },
  });

  const saveBlocksMutation = trpc.admin.pages.blocks.saveAll.useMutation({
    onSuccess: () => {
      toast.success('Page saved successfully');
    },
    onError: (error) => {
      toast.error(`Failed to save page: ${error.message}`);
    },
  });

  // Load page data when pageId changes
  useEffect(() => {
    if (pageId && pages) {
      const page = pages.find((p: PageData) => p.id === pageId);
      if (page) {
        setCurrentPage(page as PageData);
      }
    }
  }, [pageId, pages]);

  // Load blocks when page changes
  useEffect(() => {
    if (blocksData) {
      const formattedBlocks = blocksData.map((block: any) => ({
        id: block.blockId || `block-${block.id}`,
        type: block.type,
        content: typeof block.content === 'string' ? JSON.parse(block.content) : block.content,
        order: block.order,
      }));
      setInitialBlocks(formattedBlocks);
    }
  }, [blocksData]);

  // Auto-generate slug from title
  useEffect(() => {
    if (newPageTitle && !newPageSlug) {
      const slug = newPageTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setNewPageSlug(slug);
    }
  }, [newPageTitle, newPageSlug]);

  // Show loading state
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-neutral-500">Loading page builder...</p>
        </div>
      </div>
    );
  }

  // Handle save
  const handleSave = async (blocks: Array<{
    id: string;
    type: string;
    content: Record<string, unknown>;
    order: number;
  }>) => {
    if (!currentPage?.id) {
      toast.error('Please create or select a page first');
      return;
    }

    await saveBlocksMutation.mutateAsync({
      pageId: currentPage.id,
      blocks: blocks.map((block, index) => ({
        blockId: block.id,
        type: block.type,
        content: block.content,
        order: index,
      })),
    });
  };

  // Handle create new page
  const handleCreatePage = () => {
    if (!newPageTitle.trim()) {
      toast.error('Please enter a page title');
      return;
    }
    if (!newPageSlug.trim()) {
      toast.error('Please enter a page slug');
      return;
    }

    createPageMutation.mutate({
      title: newPageTitle,
      slug: newPageSlug,
      showInNav: newPageShowInNav ? 1 : 0,
      parentId: newPageParentId,
      published: 1,
      autoGenerateSeo: true,
    });
  };

  // Handle update page settings
  const handleUpdatePageSettings = () => {
    if (!currentPage) return;

    updatePageMutation.mutate({
      id: currentPage.id,
      title: currentPage.title,
      slug: currentPage.slug,
      metaTitle: currentPage.metaTitle || undefined,
      metaDescription: currentPage.metaDescription || undefined,
      showInNav: currentPage.showInNav,
      parentId: currentPage.parentId,
      published: currentPage.published,
    });
  };

  // Page list view
  if (!currentPage && !matchNew) {
    return (
      <div className="h-screen bg-neutral-100 dark:bg-neutral-950 overflow-auto">
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Page Builder</h1>
              <p className="text-neutral-500 mt-1">Create and edit pages with the visual builder</p>
            </div>
            <Button onClick={() => setShowNewPageDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Page
            </Button>
          </div>

          {pagesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : pages && pages.length > 0 ? (
            <div className="grid gap-4">
              {pages.map((page: PageData) => (
                <button
                  key={page.id}
                  onClick={() => {
                    setCurrentPage(page);
                    setLocation(`/admin/page-builder/${page.id}`);
                  }}
                  className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-primary/50 transition-colors text-left w-full"
                >
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
                      {page.title}
                    </h3>
                    <p className="text-sm text-neutral-500 truncate">/{page.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {page.showInNav === 1 && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                        In Nav
                      </span>
                    )}
                    {page.published === 1 ? (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                        Published
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 rounded">
                        Draft
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 mb-2">No pages yet</h3>
              <p className="text-neutral-500 mb-4">Create your first page to get started</p>
              <Button onClick={() => setShowNewPageDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Page
              </Button>
            </div>
          )}
        </div>

        {/* New Page Dialog */}
        <Dialog open={showNewPageDialog} onOpenChange={setShowNewPageDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Page</DialogTitle>
              <DialogDescription>
                Add a new page to your website. You can edit the content after creating it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Page Title</Label>
                <Input
                  id="title"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="About Us"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500">/</span>
                  <Input
                    id="slug"
                    value={newPageSlug}
                    onChange={(e) => setNewPageSlug(e.target.value)}
                    placeholder="about-us"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showInNav">Show in Navigation</Label>
                <Switch
                  id="showInNav"
                  checked={newPageShowInNav}
                  onCheckedChange={setNewPageShowInNav}
                />
              </div>
              {pages && pages.length > 0 && (
                <div className="space-y-2">
                  <Label>Parent Page (optional)</Label>
                  <Select
                    value={newPageParentId?.toString() || 'none'}
                    onValueChange={(v) => setNewPageParentId(v === 'none' ? null : parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None (top-level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (top-level)</SelectItem>
                      {pages.map((page: PageData) => (
                        <SelectItem key={page.id} value={page.id.toString()}>
                          {page.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewPageDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePage} disabled={createPageMutation.isPending}>
                {createPageMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Page
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Page builder view
  return (
    <>
      <PageBuilder
        pageId={currentPage?.id?.toString()}
        initialBlocks={initialBlocks}
        onSave={handleSave}
        pageTitle={currentPage?.title}
        onBack={() => {
          setCurrentPage(null);
          setInitialBlocks([]);
          setLocation('/admin/page-builder');
        }}
        onSettings={() => setShowPageSettings(true)}
      />

      {/* Page Settings Dialog */}
      <Dialog open={showPageSettings} onOpenChange={setShowPageSettings}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Page Settings</DialogTitle>
            <DialogDescription>
              Configure page URL, SEO, and navigation settings
            </DialogDescription>
          </DialogHeader>
          {currentPage && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Page Title</Label>
                <Input
                  id="edit-title"
                  value={currentPage.title}
                  onChange={(e) => setCurrentPage({ ...currentPage, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-slug">URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500">/</span>
                  <Input
                    id="edit-slug"
                    value={currentPage.slug}
                    onChange={(e) => setCurrentPage({ ...currentPage, slug: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-metaTitle">SEO Title</Label>
                <Input
                  id="edit-metaTitle"
                  value={currentPage.metaTitle || ''}
                  onChange={(e) => setCurrentPage({ ...currentPage, metaTitle: e.target.value })}
                  placeholder="Page title for search engines"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-metaDescription">SEO Description</Label>
                <Textarea
                  id="edit-metaDescription"
                  value={currentPage.metaDescription || ''}
                  onChange={(e) => setCurrentPage({ ...currentPage, metaDescription: e.target.value })}
                  placeholder="Brief description for search engines"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-showInNav">Show in Navigation</Label>
                <Switch
                  id="edit-showInNav"
                  checked={currentPage.showInNav === 1}
                  onCheckedChange={(checked) => setCurrentPage({ ...currentPage, showInNav: checked ? 1 : 0 })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-published">Published</Label>
                <Switch
                  id="edit-published"
                  checked={currentPage.published === 1}
                  onCheckedChange={(checked) => setCurrentPage({ ...currentPage, published: checked ? 1 : 0 })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPageSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePageSettings} disabled={updatePageMutation.isPending}>
              {updatePageMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
