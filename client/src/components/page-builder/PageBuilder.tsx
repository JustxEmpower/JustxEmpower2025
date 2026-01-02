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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePageBuilderStore } from './usePageBuilderStore';
import { BlockType } from './blockTypes';
import BlockLibrary from './panels/BlockLibrary';
import LayersPanel from './panels/LayersPanel';
import BlockSettings from './panels/BlockSettings';
import Canvas from './Canvas';

interface PageBuilderProps {
  pageId?: string;
  pageTitle?: string;
  initialBlocks?: Array<{
    id: string;
    type: string;
    content: Record<string, unknown>;
    order: number;
  }>;
  onSave?: (blocks: Array<{
    id: string;
    type: string;
    content: Record<string, unknown>;
    order: number;
  }>) => Promise<void>;
  onBack?: () => void;
  onSettings?: () => void;
}

export default function PageBuilder({ pageId, pageTitle: propPageTitle, initialBlocks, onSave, onBack, onSettings }: PageBuilderProps) {
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
  
  // Resizable panel widths
  const [leftPanelWidth, setLeftPanelWidth] = React.useState(320);
  const [rightPanelWidth, setRightPanelWidth] = React.useState(320);
  const [isResizingLeft, setIsResizingLeft] = React.useState(false);
  const [isResizingRight, setIsResizingRight] = React.useState(false);

  // Handle panel resize
  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (isResizingLeft) {
      const newWidth = Math.max(240, Math.min(500, e.clientX));
      setLeftPanelWidth(newWidth);
    } else if (isResizingRight) {
      const newWidth = Math.max(280, Math.min(500, window.innerWidth - e.clientX));
      setRightPanelWidth(newWidth);
    }
  }, [isResizingLeft, isResizingRight]);

  const handleMouseUp = React.useCallback(() => {
    setIsResizingLeft(false);
    setIsResizingRight(false);
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
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingLeft, isResizingRight, handleMouseMove, handleMouseUp]);

  // Initialize with props
  useEffect(() => {
    if (pageId) {
      setPageId(pageId);
    }
    if (initialBlocks) {
      setBlocks(initialBlocks);
    }
    if (propPageTitle) {
      setPageTitle(propPageTitle);
    }
  }, [pageId, initialBlocks, propPageTitle, setPageId, setBlocks, setPageTitle]);

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

  const handleSave = async () => {
    if (onSave) {
      setSaving(true);
      try {
        await onSave(blocks);
      } finally {
        setSaving(false);
      }
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
            {onBack && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="h-9 w-9 p-0"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Back to pages</TooltipContent>
              </Tooltip>
            )}

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

            {onSettings && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSettings}
                    className="h-9 w-9 p-0"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Page settings</TooltipContent>
              </Tooltip>
            )}
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
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={undo}
                    disabled={!canUndo()}
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
                    disabled={!canRedo()}
                    className="h-9 w-9 p-0"
                  >
                    <Redo2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo</TooltipContent>
              </Tooltip>
            </div>

            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isPreviewMode ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={togglePreviewMode}
                  className="h-9 gap-2"
                >
                  {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {isPreviewMode ? 'Edit' : 'Preview'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isPreviewMode ? 'Exit preview' : 'Preview page'}</TooltipContent>
            </Tooltip>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="h-9 gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
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

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel */}
          <AnimatePresence>
            {leftPanelOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: leftPanelWidth, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: isResizingLeft ? 0 : 0.2 }}
                className="bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden flex-shrink-0 relative"
              >
                <Tabs
                  value={activeLeftTab}
                  onValueChange={(v) => setActiveLeftTab(v as 'blocks' | 'layers' | 'templates')}
                  className="flex-1 flex flex-col"
                >
                  <TabsList className="mx-4 mt-4 grid grid-cols-3">
                    <TabsTrigger value="blocks" className="gap-1">
                      <LayoutGrid className="w-4 h-4" />
                      <span className="hidden sm:inline">Blocks</span>
                    </TabsTrigger>
                    <TabsTrigger value="layers" className="gap-1">
                      <Layers className="w-4 h-4" />
                      <span className="hidden sm:inline">Layers</span>
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="gap-1">
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">Templates</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="blocks" className="flex-1 mt-0 overflow-auto">
                    <BlockLibrary />
                  </TabsContent>

                  <TabsContent value="layers" className="flex-1 mt-0 overflow-hidden">
                    <LayersPanel />
                  </TabsContent>

                  <TabsContent value="templates" className="flex-1 mt-0 overflow-hidden p-4">
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                      <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                        Templates
                      </h3>
                      <p className="text-sm text-neutral-500">
                        Pre-built page templates coming soon
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
                {/* Resize handle */}
                <div
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors group"
                  onMouseDown={() => setIsResizingLeft(true)}
                >
                  <div className="absolute top-1/2 right-0 -translate-y-1/2 w-4 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4 text-neutral-400 rotate-90" />
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Canvas */}
          <main className="flex-1 overflow-auto">
            <div
              className="min-h-full transition-all duration-300 mx-auto"
              style={{
                maxWidth: viewportWidths[viewportSize],
              }}
            >
              <Canvas />
            </div>
          </main>

          {/* Right Panel */}
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
                  className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors group"
                  onMouseDown={() => setIsResizingRight(true)}
                >
                  <div className="absolute top-1/2 left-0 -translate-y-1/2 w-4 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4 text-neutral-400 rotate-90" />
                  </div>
                </div>
                <BlockSettings />
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Drag overlay for new blocks */}
      <DragOverlay>
        {activeNewBlock && (
          <div className="p-4 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-primary/30 opacity-90">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-white">
                <activeNewBlock.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{activeNewBlock.name}</p>
                <p className="text-xs text-neutral-500">{activeNewBlock.description}</p>
              </div>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
