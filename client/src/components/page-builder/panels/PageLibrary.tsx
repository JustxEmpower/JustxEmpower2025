import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { 
  FileText, 
  Navigation, 
  Plus, 
  Edit, 
  Trash2,
  Clock,
  CheckCircle,
  Loader2,
  ExternalLink,
  Search,
  Filter,
  Blocks,
  FileCode,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Page {
  id: number;
  title: string;
  slug: string;
  template: string | null;
  published: number;
  showInNav: number;
  navOrder: number | null;
  parentId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

type FilterStatus = 'all' | 'page-builder' | 'content-editor' | 'published' | 'draft' | 'in-nav';

export default function PageLibrary() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('page-builder');
  const [deletePageId, setDeletePageId] = useState<number | null>(null);

  // Fetch all pages
  const { data: pages, isLoading, refetch } = trpc.admin.pages.list.useQuery();
  const deleteMutation = trpc.admin.pages.delete.useMutation();

  const isPageBuilderPage = (page: Page) => {
    return page.template === 'page-builder';
  };

  // Filter pages based on search and status
  const filteredPages = React.useMemo(() => {
    if (!pages) return [];
    
    return pages.filter(page => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.slug.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      let matchesStatus = true;
      switch (filterStatus) {
        case 'page-builder':
          matchesStatus = isPageBuilderPage(page);
          break;
        case 'content-editor':
          matchesStatus = !isPageBuilderPage(page);
          break;
        case 'published':
          matchesStatus = page.published === 1;
          break;
        case 'draft':
          matchesStatus = page.published === 0;
          break;
        case 'in-nav':
          matchesStatus = page.showInNav === 1;
          break;
      }
      
      return matchesSearch && matchesStatus;
    });
  }, [pages, searchQuery, filterStatus]);

  // Group pages by status for summary
  const pageCounts = React.useMemo(() => {
    if (!pages) return { total: 0, pageBuilder: 0, contentEditor: 0, inNav: 0 };
    return {
      total: pages.length,
      pageBuilder: pages.filter(p => isPageBuilderPage(p)).length,
      contentEditor: pages.filter(p => !isPageBuilderPage(p)).length,
      inNav: pages.filter(p => p.showInNav === 1).length,
    };
  }, [pages]);

  const handleEditPage = (page: Page) => {
    if (isPageBuilderPage(page)) {
      setLocation(`/admin/page-builder/${page.id}`);
    } else {
      setLocation(`/admin/content?page=${page.slug}`);
    }
  };

  const handleDeletePage = async () => {
    if (!deletePageId) return;
    
    try {
      await deleteMutation.mutateAsync({ id: deletePageId });
      toast.success('Page deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete page');
      console.error(error);
    } finally {
      setDeletePageId(null);
    }
  };

  const handleCreateNew = () => {
    setLocation('/admin/page-builder');
  };

  const handleViewPage = (page: Page) => {
    const route = page.slug === 'home' ? '/' : `/${page.slug}`;
    window.open(route, '_blank');
  };

  const getStatusBadge = (page: Page) => {
    const badges = [];
    
    // Page type badge
    if (isPageBuilderPage(page)) {
      badges.push(
        <Badge key="type" variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
          <Blocks className="w-3 h-3 mr-1" />
          Page Builder
        </Badge>
      );
    } else {
      badges.push(
        <Badge key="type" variant="outline" className="bg-neutral-500/10 text-neutral-600 border-neutral-500/20">
          <FileCode className="w-3 h-3 mr-1" />
          Content Editor
        </Badge>
      );
    }
    
    if (page.published === 1) {
      badges.push(
        <Badge key="published" variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          Published
        </Badge>
      );
    } else {
      badges.push(
        <Badge key="draft" variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
          <Clock className="w-3 h-3 mr-1" />
          Draft
        </Badge>
      );
    }
    
    if (page.showInNav === 1) {
      badges.push(
        <Badge key="nav" variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
          <Navigation className="w-3 h-3 mr-1" />
          In Nav
        </Badge>
      );
    }
    
    return badges;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Header with stats */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Page Library</h3>
            <Button size="sm" onClick={handleCreateNew} className="h-8 gap-1">
              <Plus className="w-4 h-4" />
              New Page
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded p-2 text-center">
              <div className="font-bold text-lg">{pageCounts.total}</div>
              <div className="text-neutral-500">Total</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-2 text-center">
              <div className="font-bold text-lg text-purple-600">{pageCounts.pageBuilder}</div>
              <div className="text-purple-600/70 text-[10px]">Page Builder</div>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded p-2 text-center">
              <div className="font-bold text-lg text-neutral-600">{pageCounts.contentEditor}</div>
              <div className="text-neutral-500 text-[10px]">Content Editor</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2 text-center">
              <div className="font-bold text-lg text-blue-600">{pageCounts.inNav}</div>
              <div className="text-blue-600/70">In Nav</div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
            <SelectTrigger className="h-8 text-sm">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pages</SelectItem>
              <SelectItem value="page-builder">
                <span className="flex items-center gap-2">
                  <Blocks className="w-3 h-3 text-purple-500" />
                  Page Builder Only
                </span>
              </SelectItem>
              <SelectItem value="content-editor">
                <span className="flex items-center gap-2">
                  <FileCode className="w-3 h-3 text-neutral-500" />
                  Content Editor Only
                </span>
              </SelectItem>
              <SelectItem value="published">Published Only</SelectItem>
              <SelectItem value="draft">Drafts Only</SelectItem>
              <SelectItem value="in-nav">In Navigation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Page List */}
        <div className="flex-1 overflow-auto p-2">
          {filteredPages.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No pages found</p>
              {filterStatus === 'page-builder' && (
                <p className="text-xs mt-2">Click "New Page" to create a Page Builder page</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPages.map((page) => {
                const isPB = isPageBuilderPage(page);
                return (
                  <div
                    key={page.id}
                    className={cn(
                      "p-3 rounded-lg border transition-colors",
                      isPB ? "cursor-pointer" : "cursor-default",
                      "bg-white dark:bg-neutral-900",
                      isPB 
                        ? "border-purple-200 dark:border-purple-800/50 hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/20"
                        : "border-neutral-200 dark:border-neutral-800 opacity-75"
                    )}
                    onClick={() => isPB && handleEditPage(page)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isPB ? (
                            <Blocks className="w-4 h-4 text-purple-500 flex-shrink-0" />
                          ) : (
                            <FileCode className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                          )}
                          <span className="font-medium text-sm truncate">{page.title}</span>
                          {!isPB && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-3 h-3 text-neutral-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">This page uses Content Editor.</p>
                                <p className="text-xs">Click edit to open Content Editor.</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 truncate mb-2">/{page.slug}</p>
                        <div className="flex flex-wrap gap-1">
                          {getStatusBadge(page)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewPage(page);
                              }}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View page</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "h-7 w-7 p-0",
                                isPB ? "text-purple-500 hover:text-purple-600 hover:bg-purple-50" : ""
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditPage(page);
                              }}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isPB ? 'Edit in Page Builder' : 'Edit in Content Editor'}
                          </TooltipContent>
                        </Tooltip>
                        {isPB && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletePageId(page.id);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete page</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-neutral-400 mt-2">
                      Updated {formatDate(page.updatedAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deletePageId !== null} onOpenChange={() => setDeletePageId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Page</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this page? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePage}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
