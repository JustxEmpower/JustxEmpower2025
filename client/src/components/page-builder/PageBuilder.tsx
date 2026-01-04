import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  PanelLeftClose,
  PanelRightClose,
  PanelLeft,
  PanelRight,
  Eye,
  EyeOff,
  Undo2,
  Redo2,
  Save,
  Settings,
  Layers,
  LayoutGrid,
  FileText,
  Monitor,
  Tablet,
  Smartphone,
  MoreHorizontal,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { usePageBuilderStore, PageBlock } from './usePageBuilderStore';
import { BlockType } from './blockTypes';
import BlockLibrary from './panels/BlockLibrary';
import LayersPanel from './panels/LayersPanel';
import BlockSettings from './panels/BlockSettings';
import Canvas from './Canvas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PageBuilderProps {
  pageId?: string;
  initialBlocks?: Array<{
    id: string;
    type: string;
    content: Record<string, unknown>;
    order: number;
  }>;
  initialTitle?: string;
  onSave?: (
    blocks: Array<{
      id: string;
      type: string;
      content: Record<string, unknown>;
      order: number;
    }>,
    title: string,
    slug: string,
    showInNav: boolean
  ) => Promise<void>;
}

export default function PageBuilder({ pageId, initialBlocks, initialTitle, onSave }: PageBuilderProps) {
  const [, setLocation] = useLocation();
  const {
    blocks,
    pageTitle,
    setPageTitle,
    setBlocks,
    setPageId,
    leftPanelOpen,
    rightPanelOpen,
    toggleLeftPanel,
    toggleRightPanel,
    activeLeftTab,
    setActiveLeftTab,
    isPreviewMode,
    togglePreviewMode,
    isSaving,
    setSaving,
    undo,
    redo,
    canUndo,
    canRedo,
    addBlock,
    setDragging,
  } = usePageBuilderStore();

  const [viewportSize, setViewportSize] = React.useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeNewBlock, setActiveNewBlock] = React.useState<BlockType | null>(null);
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);
  const [pageSlug, setPageSlug] = React.useState('');
  const [showInNav, setShowInNav] = React.useState(false);
  const blocksInitializedRef = React.useRef(false);
  const prevInitialTitleRef = React.useRef<string | undefined>(undefined);
  
  // Resizable panel widths
  const [leftPanelWidth, setLeftPanelWidth] = React.useState(280);
  const [rightPanelWidth, setRightPanelWidth] = React.useState(320);
  const [isResizingLeft, setIsResizingLeft] = React.useState(false);
  const [isResizingRight, setIsResizingRight] = React.useState(false);

  // Handle panel resize
  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (isResizingLeft) {
      const newWidth = Math.max(200, Math.min(500, e.clientX));
      setLeftPanelWidth(newWidth);
    }
    if (isResizingRight) {
      const newWidth = Math.max(250, Math.min(600, window.innerWidth - e.clientX));
      setRightPanelWidth(newWidth);
    }
  }, [isResizingLeft, isResizingRight]);

  const handleMouseUp = React.useCallback(() => {
    setIsResizingLeft(false);
    setIsResizingRight(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  React.useEffect(() => {
    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight, handleMouseMove, handleMouseUp]);

  // Initialize page ID
  useEffect(() => {
    if (pageId) {
      setPageId(pageId);
    }
  }, [pageId, setPageId]);

  // Initialize blocks only once when they first become available
  useEffect(() => {
    if (!blocksInitializedRef.current && initialBlocks && initialBlocks.length > 0) {
      blocksInitializedRef.current = true;
      setBlocks(initialBlocks as PageBlock[], true); // skip history on initial load
    }
  }, [initialBlocks, setBlocks]);

  // Update title when initialTitle changes (for loading existing pages)
  useEffect(() => {
    if (initialTitle && initialTitle !== 'Untitled Page' && initialTitle !== prevInitialTitleRef.current) {
      prevInitialTitleRef.current = initialTitle;
      setPageTitle(initialTitle);
    }
  }, [initialTitle, setPageTitle]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!pageSlug && pageTitle && pageTitle !== 'Untitled Page') {
      setPageSlug(pageTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  }, [pageTitle, pageSlug]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'new-block') {
      setActiveNewBlock(active.data.current.blockType as BlockType);
    }
    setDragging(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveNewBlock(null);
    setDragging(false);

    // Handle new block from library dropped on canvas
    if (active.data.current?.type === 'new-block' && over) {
      const blockType = active.data.current.blockType as BlockType;
      const overIndex = blocks.findIndex((b) => b.id === over.id);
      addBlock(blockType, overIndex >= 0 ? overIndex : undefined);
    }
  };

  const handleSaveClick = () => {
    setShowSaveDialog(true);
  };

  const handleSaveConfirm = async () => {
    console.log('handleSaveConfirm called');
    console.log('onSave exists:', !!onSave);
    console.log('blocks:', blocks);
    console.log('pageTitle:', pageTitle);
    console.log('pageSlug:', pageSlug);
    console.log('showInNav:', showInNav);
    
    if (onSave) {
      setSaving(true);
      try {
        console.log('Calling onSave...');
        await onSave(blocks, pageTitle, pageSlug, showInNav);
        console.log('onSave completed successfully');
        setShowSaveDialog(false);
      } catch (error) {
        console.error('Save failed:', error);
      } finally {
        setSaving(false);
      }
    } else {
      console.error('onSave prop is not provided!');
    }
  };

  const viewportWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen flex flex-col bg-neutral-100 dark:bg-neutral-950 overflow-hidden">
        {/* Top Toolbar */}
        <header className="h-14 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 flex-shrink-0">
          {/* Left section */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/admin/pages')}
                  className="h-9 w-9 p-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Back to Pages</TooltipContent>
            </Tooltip>

            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLeftPanel}
                  className="h-9 w-9 p-0"
                >
                  {leftPanelOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{leftPanelOpen ? 'Hide sidebar' : 'Show sidebar'}</TooltipContent>
            </Tooltip>

            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700 mx-1" />

            <Input
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              className="w-48 h-9 bg-transparent border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-primary"
              placeholder="Page title..."
            />
          </div>

          {/* Center section - Viewport controls */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewportSize === 'desktop' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewportSize('desktop')}
                  className="h-8 w-8 p-0"
                >
                  <Monitor className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Desktop view</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewportSize === 'tablet' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewportSize('tablet')}
                  className="h-8 w-8 p-0"
                >
                  <Tablet className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Tablet view</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewportSize === 'mobile' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewportSize('mobile')}
                  className="h-8 w-8 p-0"
                >
                  <Smartphone className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mobile view</TooltipContent>
            </Tooltip>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={undo}
                  disabled={!canUndo}
                  className="h-9 w-9 p-0"
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={redo}
                  disabled={!canRedo}
                  className="h-9 w-9 p-0"
                >
                  <Redo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>

            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePreviewMode}
                  className="h-9 px-3 gap-2"
                >
                  {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span className="text-sm">Preview</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isPreviewMode ? 'Exit preview' : 'Preview page'}</TooltipContent>
            </Tooltip>

            <Button
              size="sm"
              onClick={handleSaveClick}
              disabled={isSaving}
              className="h-9 px-4 gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save</span>
            </Button>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleRightPanel}
                  className="h-9 w-9 p-0"
                >
                  {rightPanelOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRight className="w-5 h-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{rightPanelOpen ? 'Hide settings' : 'Show settings'}</TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Block Library & Layers */}
          <AnimatePresence>
            {leftPanelOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: leftPanelWidth, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: isResizingLeft ? 0 : 0.2 }}
                className="bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden flex-shrink-0 relative"
              >
                {/* Resize handle */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10 group"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsResizingLeft(true);
                  }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-neutral-300 dark:bg-neutral-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <Tabs value={activeLeftTab} onValueChange={(v) => setActiveLeftTab(v as 'blocks' | 'layers' | 'templates')} className="flex flex-col h-full">
                  <TabsList className="w-full justify-start rounded-none border-b border-neutral-200 dark:border-neutral-800 bg-transparent h-12 px-2 flex-shrink-0">
                    <TabsTrigger value="blocks" className="gap-2">
                      <LayoutGrid className="w-4 h-4" />
                      Blocks
                    </TabsTrigger>
                    <TabsTrigger value="layers" className="gap-2">
                      <Layers className="w-4 h-4" />
                      Layers
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="gap-2">
                      <FileText className="w-4 h-4" />
                      Templates
                    </TabsTrigger>
                  </TabsList>
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <TabsContent value="blocks" className="h-full m-0 overflow-hidden flex-1">
                      <BlockLibrary />
                    </TabsContent>
                    <TabsContent value="layers" className="h-full m-0 overflow-hidden flex-1">
                      <LayersPanel />
                    </TabsContent>
                    <TabsContent value="templates" className="h-full m-0 p-4 overflow-auto flex-1">
                      <p className="text-sm text-neutral-500">Templates coming soon...</p>
                    </TabsContent>
                  </div>
                </Tabs>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Canvas */}
          <main className="flex-1 overflow-hidden">
            <div
              className="h-full overflow-auto p-8"
              style={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: viewportWidths[viewportSize],
                  maxWidth: '100%',
                  transition: 'width 0.3s ease',
                }}
              >
                <Canvas />
              </div>
            </div>
          </main>

          {/* Right Panel - Block Settings */}
          <AnimatePresence>
            {rightPanelOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: rightPanelWidth, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: isResizingRight ? 0 : 0.2 }}
                className="bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 overflow-hidden flex-shrink-0 relative"
              >
                {/* Resize handle */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10 group"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsResizingRight(true);
                  }}
                >
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-neutral-300 dark:bg-neutral-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <BlockSettings />
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Page</DialogTitle>
            <DialogDescription>
              Configure your page settings before saving.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="page-title">Page Title</Label>
              <Input
                id="page-title"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                placeholder="Enter page title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="page-slug">URL Slug</Label>
              <Input
                id="page-slug"
                value={pageSlug}
                onChange={(e) => setPageSlug(e.target.value)}
                placeholder="page-url-slug"
              />
              <p className="text-xs text-neutral-500">
                Your page will be accessible at: /{pageSlug || 'page-slug'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-in-nav"
                checked={showInNav}
                onCheckedChange={(checked) => setShowInNav(checked as boolean)}
              />
              <Label htmlFor="show-in-nav" className="text-sm font-normal">
                Show in navigation menu
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfirm} disabled={isSaving || !pageTitle}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Page'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeNewBlock && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl border-2 border-primary p-4 opacity-90">
            <p className="text-sm font-medium">{activeNewBlock.name}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
