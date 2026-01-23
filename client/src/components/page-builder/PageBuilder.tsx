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
  Sparkles,
  Wand2,
  Navigation,
  Globe,
  Check,
  Copy,
  Scissors,
  ClipboardPaste,
  Clipboard,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { usePageBuilderStore, PageBlock } from './usePageBuilderStore';
import { BlockType } from './blockTypes';
import BlockLibrary from './panels/BlockLibrary';
import LayersPanel from './panels/LayersPanel';
import BlockSettings from './panels/BlockSettings';
import PageLibrary from './panels/PageLibrary';
import Canvas, { CANVAS_VIEWPORTS, ViewportConfig } from './Canvas';
import PreviewPanel from './panels/PreviewPanel';
import FloatingToolbar from './FloatingToolbar';
import BlockTemplates from './BlockTemplates';
import { TemplateLibrary } from './TemplateLibrary';
import { useUndoRedo } from './useUndoRedo';
import { useCopyPaste } from './useCopyPaste';
import { useClipboardStore } from './useClipboardStore';
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
    showInNav: boolean,
    published: boolean
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
    isElementEditMode,
    toggleElementEditMode,
    isSaving,
    setSaving,
    undo,
    redo,
    canUndo,
    canRedo,
    addBlock,
    setDragging,
    hasUnsavedChanges,
    lastAutoSave,
    loadAutoSave,
    clearAutoSave,
    markAsSaved,
  } = usePageBuilderStore();

  // Enable keyboard shortcuts for undo/redo
  useUndoRedo();

  // Get selectedBlockId from the store
  const selectedBlockId = usePageBuilderStore((state) => state.selectedBlockId);

  // Enable keyboard shortcuts for copy/paste (Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+D)
  const { copy, cut, paste, duplicate, hasClipboard, clipboardInfo } = useCopyPaste({
    pageId: pageId || undefined,
    pageTitle: pageTitle,
    selectedBlockId: selectedBlockId,
    blocks: blocks,
    setBlocks: setBlocks,
    enabled: true,
  });

  const [viewportSize, setViewportSize] = React.useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [currentViewport, setCurrentViewport] = React.useState<ViewportConfig>(CANVAS_VIEWPORTS[0]);
  const [showGrid, setShowGrid] = React.useState(false);
  const [activeNewBlock, setActiveNewBlock] = React.useState<BlockType | null>(null);
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);
  const [pageSlug, setPageSlug] = React.useState('');
  const [showInNav, setShowInNav] = React.useState(false);
  const [isPublished, setIsPublished] = React.useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = React.useState(false);
  const [recoveryData, setRecoveryData] = React.useState<{
    pageTitle: string;
    blocks: PageBlock[];
    timestamp: number;
  } | null>(null);
  const blocksInitializedRef = React.useRef(false);
  const prevInitialTitleRef = React.useRef<string | undefined>(undefined);
  const recoveryCheckedRef = React.useRef(false);
  const prevPageIdRef = React.useRef<string | undefined>(undefined);

  // Reset refs when pageId changes (switching to a different page)
  React.useEffect(() => {
    if (pageId !== prevPageIdRef.current) {
      prevPageIdRef.current = pageId;
      blocksInitializedRef.current = false;
      prevInitialTitleRef.current = undefined;
      recoveryCheckedRef.current = false;
    }
  }, [pageId]);

  // Full-screen Preview Panel state
  const [showPreviewPanel, setShowPreviewPanel] = React.useState(false);
  
  // Template Library state
  const [showTemplateLibrary, setShowTemplateLibrary] = React.useState(false);

  // AI Page Generation state
  const [showAIDialog, setShowAIDialog] = React.useState(false);
  const [aiPrompt, setAiPrompt] = React.useState('');
  const [aiPageType, setAiPageType] = React.useState<'landing' | 'about' | 'services' | 'contact' | 'blog' | 'custom'>('custom');
  const [isGenerating, setIsGenerating] = React.useState(false);

  // AI Generation mutation
  const generatePageMutation = trpc.admin.ai.generatePageBlocks.useMutation({
    onSuccess: (data) => {
      // Convert AI-generated blocks to PageBuilder format
      const newBlocks: PageBlock[] = data.blocks.map((block, index) => ({
        id: `ai-${Date.now()}-${index}`,
        type: block.type,
        content: block.props as Record<string, unknown>,
        order: index,
      }));
      
      // Set the page title and blocks
      setPageTitle(data.title);
      setBlocks(newBlocks, false);
      
      toast.success('Page generated successfully!');
      setShowAIDialog(false);
      setAiPrompt('');
    },
    onError: (error) => {
      toast.error(`Failed to generate page: ${error.message}`);
    },
  });

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please describe what you want to create');
      return;
    }
    
    setIsGenerating(true);
    try {
      await generatePageMutation.mutateAsync({
        description: aiPrompt,
        pageType: aiPageType,
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
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

  // Check for auto-saved data on mount
  useEffect(() => {
    if (recoveryCheckedRef.current) return;
    recoveryCheckedRef.current = true;
    
    const savedData = loadAutoSave();
    if (savedData && savedData.blocks.length > 0) {
      // Check if the saved data is more recent than 1 hour
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      if (savedData.timestamp > oneHourAgo) {
        setRecoveryData(savedData);
        setShowRecoveryDialog(true);
      } else {
        // Clear old auto-save data
        clearAutoSave();
      }
    }
  }, [loadAutoSave, clearAutoSave]);

  const handleRecoverAutoSave = () => {
    if (recoveryData) {
      setPageTitle(recoveryData.pageTitle);
      setBlocks(recoveryData.blocks, true);
      blocksInitializedRef.current = true;
    }
    setShowRecoveryDialog(false);
    setRecoveryData(null);
  };

  const handleDiscardAutoSave = () => {
    clearAutoSave();
    setShowRecoveryDialog(false);
    setRecoveryData(null);
  };

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
    console.log('isPublished:', isPublished);
    
    if (onSave) {
      setSaving(true);
      try {
        console.log('Calling onSave...');
        await onSave(blocks, pageTitle, pageSlug, showInNav, isPublished);
        console.log('onSave completed successfully');
        markAsSaved(); // Clear auto-save and mark as saved
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
                  onClick={() => setShowPreviewPanel(true)}
                  className="h-9 px-3 gap-2"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">Preview</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open full-screen preview</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isElementEditMode ? 'default' : 'ghost'}
                  size="sm"
                  onClick={toggleElementEditMode}
                  className={`h-9 px-3 gap-2 ${isElementEditMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                    <circle cx="21" cy="21" r="2" fill="currentColor" />
                    <circle cx="3" cy="3" r="2" fill="currentColor" />
                  </svg>
                  <span className="text-sm">Edit Elements</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isElementEditMode ? 'Exit element edit mode' : 'Resize & move elements'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAIDialog(true)}
                  className="h-9 px-3 gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-300 dark:border-purple-700 hover:from-purple-500/20 hover:to-pink-500/20"
                >
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-purple-700 dark:text-purple-300">AI Generate</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Generate page with AI</TooltipContent>
            </Tooltip>

            {/* Block Templates */}
            <BlockTemplates
              selectedBlocks={blocks}
              onLoadTemplate={(templateBlocks) => {
                const newBlocks = templateBlocks.map((block, index) => ({
                  ...block,
                  id: `template-${Date.now()}-${index}`,
                  order: blocks.length + index,
                }));
                setBlocks([...blocks, ...newBlocks as PageBlock[]]);
                toast.success('Template loaded successfully');
              }}
            />

            {/* Template Library Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplateLibrary(true)}
                  className="h-9 px-3 gap-2"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-sm">Templates</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Browse pre-built page templates</TooltipContent>
            </Tooltip>

            {/* Clipboard Actions */}
            <div className="flex items-center gap-1 border-l border-neutral-200 dark:border-neutral-700 pl-2 ml-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copy}
                    disabled={!selectedBlockId}
                    className="h-9 w-9 p-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy block (Ctrl+C)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cut}
                    disabled={!selectedBlockId}
                    className="h-9 w-9 p-0"
                  >
                    <Scissors className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Cut block (Ctrl+X)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={hasClipboard ? 'outline' : 'ghost'}
                    size="sm"
                    onClick={paste}
                    disabled={!hasClipboard}
                    className={`h-9 w-9 p-0 ${hasClipboard ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  >
                    <ClipboardPaste className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {hasClipboard 
                    ? `Paste ${clipboardInfo.count} block${clipboardInfo.count > 1 ? 's' : ''} (Ctrl+V)`
                    : 'Paste (Ctrl+V)'}
                </TooltipContent>
              </Tooltip>

              {hasClipboard && (
                <span className="text-xs text-neutral-500 ml-1">
                  {clipboardInfo.count} {clipboardInfo.isCut ? 'cut' : 'copied'}
                </span>
              )}
            </div>

            {/* Page Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-9 px-3 gap-2 ${showInNav ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}`}
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Page Settings</span>
                  {showInNav && <Navigation className="w-3 h-3 text-green-600" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Page Visibility</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={showInNav}
                  onCheckedChange={(checked) => setShowInNav(checked)}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Show in Navigation
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-neutral-500">
                  {showInNav 
                    ? '✓ This page will appear in the site navigation menu'
                    : 'This page will not appear in navigation'
                  }
                </DropdownMenuLabel>
              </DropdownMenuContent>
            </DropdownMenu>

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
                <Tabs value={activeLeftTab} onValueChange={(v) => setActiveLeftTab(v as 'blocks' | 'layers' | 'pages')} className="flex flex-col h-full">
                  <TabsList className="w-full justify-start rounded-none border-b border-neutral-200 dark:border-neutral-800 bg-transparent h-12 px-2 flex-shrink-0">
                    <TabsTrigger value="blocks" className="gap-2">
                      <LayoutGrid className="w-4 h-4" />
                      Blocks
                    </TabsTrigger>
                    <TabsTrigger value="layers" className="gap-2">
                      <Layers className="w-4 h-4" />
                      Layers
                    </TabsTrigger>
                    <TabsTrigger value="pages" className="gap-2">
                      <FileText className="w-4 h-4" />
                      Pages
                    </TabsTrigger>
                  </TabsList>
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <TabsContent value="blocks" className="h-full m-0 overflow-auto flex-1">
                      <BlockLibrary />
                    </TabsContent>
                    <TabsContent value="layers" className="h-full m-0 overflow-hidden flex-1">
                      <LayersPanel />
                    </TabsContent>
                    <TabsContent value="pages" className="h-full m-0 overflow-auto flex-1">
                      <PageLibrary />
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
                <Canvas 
                  viewport={currentViewport}
                  showGrid={showGrid}
                  onViewportChange={(vp) => setCurrentViewport(vp)}
                />
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
                className="bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 flex-shrink-0 relative h-full flex flex-col overflow-hidden"
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
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                  <BlockSettings />
                </div>
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
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="secondary"
              onClick={() => { setIsPublished(false); handleSaveConfirm(); }} 
              disabled={isSaving || !pageTitle}
            >
              {isSaving && !isPublished ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save as Draft'
              )}
            </Button>
            <Button 
              onClick={() => { setIsPublished(true); handleSaveConfirm(); }} 
              disabled={isSaving || !pageTitle}
            >
              {isSaving && isPublished ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Publishing...
                </>
              ) : (
                'Save & Publish'
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

      {/* Auto-save Recovery Dialog */}
      <Dialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recover Unsaved Work?</DialogTitle>
            <DialogDescription>
              We found auto-saved work from {recoveryData ? new Date(recoveryData.timestamp).toLocaleString() : 'earlier'}.
              Would you like to recover it?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4">
              <p className="text-sm font-medium">{recoveryData?.pageTitle || 'Untitled Page'}</p>
              <p className="text-xs text-neutral-500 mt-1">
                {recoveryData?.blocks.length || 0} blocks
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDiscardAutoSave}>
              Discard
            </Button>
            <Button onClick={handleRecoverAutoSave}>
              Recover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-save Status Indicator */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 left-4 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 px-3 py-2 rounded-lg shadow-lg text-xs flex items-center gap-2 z-50">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <span>Unsaved changes</span>
          {lastAutoSave && (
            <span className="text-amber-600 dark:text-amber-400">
              (auto-saved {new Date(lastAutoSave).toLocaleTimeString()})
            </span>
          )}
        </div>
      )}

      {/* AI Page Generation Dialog - TURBO ENHANCED */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              ✨ AI Page Generator - Turbo
            </DialogTitle>
            <DialogDescription>
              Describe your vision and AI will craft a beautiful JE-styled page in seconds.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[65vh] overflow-y-auto">
            {/* Quick Templates */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Start Templates</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '🌟 Workshop Landing', prompt: 'Create a workshop landing page with hero, program benefits using 3 pillars, testimonials from past participants, pricing section, and newsletter signup', type: 'landing' as const },
                  { label: '👩‍💼 Leadership Program', prompt: 'Create a leadership program page with inspiring hero, numbered principles of leadership, program offerings grid, success stories, FAQ section, and call to action', type: 'services' as const },
                  { label: '📖 Founder Story', prompt: 'Create an about page telling the founder story with split hero, two-column biography section, philosophy principles, inspirational quote, and community invitation', type: 'about' as const },
                  { label: '🎉 Event Page', prompt: 'Create an event page with video hero, event details section, speaker/host bio, agenda using principles, testimonials, registration CTA, and FAQ', type: 'landing' as const },
                  { label: '💫 Retreat Experience', prompt: 'Create a retreat page with immersive image hero, 3 pillars of transformation, daily schedule, testimonials carousel, pricing offerings, and booking form', type: 'services' as const },
                  { label: '📬 Contact Page', prompt: 'Create a beautiful contact page with minimal hero, contact form, location info in two columns, FAQ for common questions, and newsletter signup', type: 'contact' as const },
                ].map((template) => (
                  <button
                    key={template.label}
                    onClick={() => { setAiPrompt(template.prompt); setAiPageType(template.type); }}
                    className="text-left p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-sm"
                  >
                    <span className="font-medium">{template.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ai-page-type">Page Type</Label>
                <Select value={aiPageType} onValueChange={(v) => setAiPageType(v as typeof aiPageType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select page type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landing">🚀 Landing Page</SelectItem>
                    <SelectItem value="about">👤 About Page</SelectItem>
                    <SelectItem value="services">💼 Services/Programs</SelectItem>
                    <SelectItem value="contact">📬 Contact Page</SelectItem>
                    <SelectItem value="blog">📝 Blog/Article</SelectItem>
                    <SelectItem value="custom">✨ Custom Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Block Count</Label>
                <div className="flex gap-2">
                  {['5-7 blocks', '8-10 blocks', '10+ blocks'].map((count, i) => (
                    <button
                      key={count}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs border transition-all ${i === 1 ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/30 text-purple-700' : 'border-neutral-200 dark:border-neutral-700 hover:border-purple-300'}`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-prompt">Describe Your Page</Label>
              <Textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="E.g., Create a page for our women's leadership retreat in Sedona. Include sections for the transformational experience, daily schedule, testimonials from past attendees, pricing tiers, and a registration form. The tone should be warm, empowering, and luxurious."
                className="min-h-[140px] max-h-[200px] resize-none"
              />
            </div>

            {/* Enhancement Options */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Enhance With</Label>
              <div className="flex flex-wrap gap-2">
                {['Testimonials', 'FAQ Section', 'Newsletter', 'Pricing', 'Video Hero', 'Gallery', 'Team Bios'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setAiPrompt(prev => prev + ` Include ${tag.toLowerCase()}.`)}
                    className="px-3 py-1.5 rounded-full text-xs border border-neutral-200 dark:border-neutral-700 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <Wand2 className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-200">AI will generate:</p>
                  <ul className="text-xs text-purple-700 dark:text-purple-300 mt-1 space-y-0.5">
                    <li>• JE-styled blocks matching your brand</li>
                    <li>• Compelling, on-brand copy</li>
                    <li>• Proper page structure with hero and footer</li>
                    <li>• Editable blocks you can customize further</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAIDialog(false)} disabled={isGenerating}>
              Cancel
            </Button>
            <Button
              onClick={handleAIGenerate}
              disabled={isGenerating || !aiPrompt.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 min-w-[160px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Page ✨
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full-Screen Preview Panel */}
      <PreviewPanel 
        isOpen={showPreviewPanel} 
        onClose={() => setShowPreviewPanel(false)} 
      />

      {/* Template Library */}
      <TemplateLibrary
        isOpen={showTemplateLibrary}
        onClose={() => setShowTemplateLibrary(false)}
        onSelectTemplate={(templateBlocks) => {
          // Replace current blocks with template blocks
          setBlocks(templateBlocks);
          setShowTemplateLibrary(false);
        }}
      />

      {/* Floating Formatting Toolbar */}
      <FloatingToolbar />
    </DndContext>
  );
}
