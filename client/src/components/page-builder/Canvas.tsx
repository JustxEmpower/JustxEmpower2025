import React, { useState, useEffect, useRef } from 'react';
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
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, Copy, Settings, Monitor, Laptop, Tablet, Smartphone, Grid, Edit3, MousePointer, Scissors, ClipboardPaste } from 'lucide-react';
import ResizeHandles from './ResizeHandles';
import { BlockContextMenu } from './BlockContextMenu';
import { useMultiSelect, getBlocksInRange } from './useMultiSelect';
import { useClipboardStore } from './useClipboardStore';
import { Button } from '@/components/ui/button';
import { usePageBuilderStore, PageBlock } from './usePageBuilderStore';
import { getBlockById, BlockType } from './blockTypes';
import BlockRenderer from './BlockRenderer';
import { cn } from '@/lib/utils';

// ============================================================================
// VIEWPORT CONFIGURATIONS
// ============================================================================

export interface ViewportConfig {
  id: string;
  name: string;
  width: number;
  icon: React.ComponentType<{ className?: string }>;
}

export const CANVAS_VIEWPORTS: ViewportConfig[] = [
  { id: 'desktop', name: 'Desktop', width: 1440, icon: Monitor },
  { id: 'laptop', name: 'Laptop', width: 1280, icon: Laptop },
  { id: 'tablet', name: 'Tablet', width: 768, icon: Tablet },
  { id: 'mobile', name: 'Mobile', width: 375, icon: Smartphone },
];

interface SortableBlockProps {
  block: PageBlock;
  blocks: PageBlock[];
  isSelected: boolean;
  isMultiSelected: boolean;
  isHovered: boolean;
  isPreviewMode: boolean;
  isElementEditMode: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onHover: () => void;
  onLeave: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToTop: () => void;
  onMoveToBottom: () => void;
  onUpdate: (content: Record<string, any>) => void;
}

function SortableBlock({
  block,
  blocks,
  isSelected,
  isMultiSelected,
  isHovered,
  isPreviewMode,
  isElementEditMode,
  onSelect,
  onHover,
  onLeave,
  onDelete,
  onDuplicate,
  onCopy,
  onCut,
  onPaste,
  onMoveUp,
  onMoveDown,
  onMoveToTop,
  onMoveToBottom,
  onUpdate,
}: SortableBlockProps) {
  // DEBUG: Log what SortableBlock receives
  console.log('[SortableBlock] block.type:', block.type, 'isElementEditMode:', isElementEditMode);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const blockType = getBlockById(block.type);
  const Icon = blockType?.icon;

  if (isPreviewMode) {
    return (
      <div ref={setNodeRef} style={style}>
        <BlockRenderer block={block} />
      </div>
    );
  }

  return (
    <BlockContextMenu
      block={block}
      blocks={blocks}
      onCopy={onCopy}
      onCut={onCut}
      onPaste={onPaste}
      onDuplicate={onDuplicate}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onMoveToTop={onMoveToTop}
      onMoveToBottom={onMoveToBottom}
    >
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`
        group relative
        ${isDragging ? 'opacity-50 z-50' : ''}
        ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
        ${isMultiSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${isHovered && !isSelected && !isMultiSelected ? 'ring-2 ring-primary/30 ring-offset-1' : ''}
      `}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(e);
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      {/* Block toolbar */}
      <AnimatePresence>
        {(isSelected || isHovered) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-10 left-0 right-0 flex items-center justify-between z-10"
          >
            <div className="flex items-center gap-1 bg-neutral-900 text-white rounded-lg px-2 py-1 shadow-lg">
              {Icon && <Icon className="w-4 h-4 mr-1" />}
              <span className="text-xs font-medium">{blockType?.name}</span>
            </div>
            <div className="flex items-center gap-1 bg-neutral-900 rounded-lg p-1 shadow-lg">
              <button
                {...attributes}
                {...listeners}
                className="p-1.5 hover:bg-neutral-700 rounded cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                className="p-1.5 hover:bg-neutral-700 rounded"
              >
                <Copy className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 hover:bg-red-600 rounded"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Block content */}
      <div className="relative">
        <BlockRenderer block={block} isEditing={!isPreviewMode} isBlockSelected={isSelected} isElementEditMode={isElementEditMode} onUpdate={onUpdate} />
        {/* DEBUG: Show isElementEditMode state */}
        {isElementEditMode && (
          <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 z-[9999]">
            ELEMENT EDIT MODE ON
          </div>
        )}
        
        {/* Resize handles for selected blocks */}
        <ResizeHandles blockId={block.id} isSelected={isSelected} />
      </div>

      {/* Add block button between blocks */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-10"
          >
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-full bg-white dark:bg-neutral-800 shadow-lg border-2 border-primary hover:bg-primary hover:text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </BlockContextMenu>
  );
}

interface DropZoneProps {
  onDrop: () => void;
  isActive: boolean;
}

function DropZone({ onDrop, isActive }: DropZoneProps) {
  return (
    <motion.div
      className={`
        border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
        ${isActive 
          ? 'border-primary bg-primary/5 scale-[1.02]' 
          : 'border-neutral-300 dark:border-neutral-700 hover:border-primary/50'
        }
      `}
      animate={isActive ? { scale: 1.02 } : { scale: 1 }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className={`
          w-12 h-12 rounded-full flex items-center justify-center transition-colors
          ${isActive ? 'bg-primary text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}
        `}>
          <Plus className="w-6 h-6" />
        </div>
        <div>
          <p className={`font-medium ${isActive ? 'text-primary' : 'text-neutral-600 dark:text-neutral-400'}`}>
            {isActive ? 'Drop here to add block' : 'Drag blocks here'}
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
            or click a block in the library to add it
          </p>
        </div>
      </div>
    </motion.div>
  );
}

interface CanvasProps {
  viewport?: ViewportConfig;
  showGrid?: boolean;
  onViewportChange?: (viewport: ViewportConfig) => void;
}

export default function Canvas({ 
  viewport = CANVAS_VIEWPORTS[0], 
  showGrid = false,
  onViewportChange,
}: CanvasProps) {
  const {
    blocks,
    selectedBlockId,
    hoveredBlockId,
    isPreviewMode,
    isElementEditMode,
    selectedElementId,
    isDragging,
    selectBlock,
    hoverBlock,
    deleteBlock,
    duplicateBlock,
    moveBlock,
    addBlock,
    setDragging,
    selectElement,
    updateElementStyle,
    toggleElementEditMode,
    updateBlock,
  } = usePageBuilderStore();

  // DEBUG: Log isElementEditMode value
  console.log('[Canvas] isElementEditMode from store:', isElementEditMode);

  // Multi-select state
  const {
    selectedBlockIds,
    lastSelectedId,
    selectBlock: multiSelectBlock,
    selectBlocks,
    clearSelection,
    isSelected: isMultiSelected,
  } = useMultiSelect();

  // Clipboard state
  const { copyBlocks, cutBlocks, pasteBlocks, hasClipboard } = useClipboardStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isOverCanvas, setIsOverCanvas] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);

  // Calculate canvas scaling based on viewport
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 48; // padding
        const scale = Math.min(containerWidth / viewport.width, 1);
        setCanvasScale(scale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [viewport]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setDragging(true);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setIsOverCanvas(!!event.over);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDragging(false);
    setIsOverCanvas(false);

    if (!over) return;

    // Handle new block from library
    if (active.data.current?.type === 'new-block') {
      const blockType = active.data.current.blockType as BlockType;
      const overIndex = blocks.findIndex((b) => b.id === over.id);
      addBlock(blockType, overIndex >= 0 ? overIndex : undefined);
      return;
    }

    // Handle reordering existing blocks
    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        moveBlock(oldIndex, newIndex);
      }
    }
  };

  const handleCanvasClick = () => {
    selectBlock(null);
  };

  const activeBlock = activeId ? blocks.find((b) => b.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={containerRef}
        className={`
          min-h-full transition-colors duration-200 flex flex-col
          ${isPreviewMode ? 'bg-white dark:bg-neutral-900' : 'bg-neutral-100 dark:bg-neutral-950'}
        `}
        onClick={handleCanvasClick}
      >
        {/* Canvas Toolbar */}
        {!isPreviewMode && (
          <div className="sticky top-0 z-20 bg-neutral-100 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 px-4 py-2">
            <div className="flex items-center justify-between max-w-5xl mx-auto">
              {/* Viewport Selector */}
              <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 rounded-lg p-1 shadow-sm">
                {CANVAS_VIEWPORTS.map((vp) => {
                  const Icon = vp.icon;
                  return (
                    <button
                      key={vp.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewportChange?.(vp);
                      }}
                      className={cn(
                        'p-2 rounded-md transition-all duration-200',
                        viewport.id === vp.id
                          ? 'bg-primary text-white'
                          : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                      )}
                      title={`${vp.name} (${vp.width}px)`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>

              {/* Canvas Controls */}
              <div className="flex items-center gap-2">
                {/* Grid Toggle */}
                <button
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    'p-2 rounded-md transition-all duration-200',
                    showGrid
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                  )}
                  title="Toggle Grid"
                >
                  <Grid className="w-4 h-4" />
                </button>

                {/* Edit Elements Mode Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Toggle body class for CSS-based element highlighting
                    if (!isElementEditMode) {
                      document.body.classList.add('element-edit-mode-active');
                    } else {
                      document.body.classList.remove('element-edit-mode-active');
                    }
                    toggleElementEditMode();
                  }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium',
                    isElementEditMode
                      ? 'bg-amber-500 text-white'
                      : 'bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                  )}
                  title={isElementEditMode ? 'Exit Element Edit Mode' : 'Edit Elements (double-click text to edit)'}
                >
                  {isElementEditMode ? (
                    <><MousePointer className="w-4 h-4" /> Block Mode</>
                  ) : (
                    <><Edit3 className="w-4 h-4" /> Edit Elements</>
                  )}
                </button>
              </div>

              {/* Viewport Info */}
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {viewport.name} • {viewport.width}px {canvasScale < 1 && `• ${Math.round(canvasScale * 100)}%`}
              </div>
            </div>
          </div>
        )}

        {/* Canvas Content - Mirror of Preview/Live Site */}
                <div 
          className="flex-1 overflow-auto" 
          style={{ padding: isPreviewMode ? 0 : '1rem' }}
          data-element-edit-mode={isElementEditMode ? "true" : "false"}
          data-page-builder-canvas="true"
        >
          <div 
            className={cn(
              'mx-auto transition-all duration-300',
              isPreviewMode ? '' : 'bg-white dark:bg-neutral-900 shadow-lg min-h-[600px] overflow-hidden'
            )}
            style={{
              width: isPreviewMode ? '100%' : `${viewport.width}px`,
              maxWidth: '100%',
              transform: canvasScale < 1 ? `scale(${canvasScale})` : undefined,
              transformOrigin: 'top center',
              borderRadius: isPreviewMode ? 0 : '0.5rem',
            }}
          >
          {blocks.length > 0 ? (
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div>
                {blocks.map((block, index) => {
                  const handleSelect = (e: React.MouseEvent) => {
                    if (e.shiftKey && lastSelectedId) {
                      // Shift+Click: Select range
                      const rangeIds = getBlocksInRange(blocks, lastSelectedId, block.id);
                      selectBlocks(rangeIds);
                    } else if (e.ctrlKey || e.metaKey) {
                      // Ctrl/Cmd+Click: Toggle selection
                      multiSelectBlock(block.id, { ctrl: true });
                    } else {
                      // Regular click: Single select
                      clearSelection();
                      selectBlock(block.id);
                    }
                  };

                  const handleCopy = () => {
                    const blocksToCopy = selectedBlockIds.length > 0 && isMultiSelected(block.id)
                      ? blocks.filter(b => selectedBlockIds.includes(b.id))
                      : [block];
                    copyBlocks(blocksToCopy);
                  };

                  const handleCut = () => {
                    const blocksToCut = selectedBlockIds.length > 0 && isMultiSelected(block.id)
                      ? blocks.filter(b => selectedBlockIds.includes(b.id))
                      : [block];
                    cutBlocks(blocksToCut);
                    // Delete the cut blocks
                    blocksToCut.forEach(b => deleteBlock(b.id));
                  };

                  const handlePaste = () => {
                    const pastedBlocks = pasteBlocks();
                    // Add pasted blocks after current block
                    // This would need to be implemented in the store
                  };

                  const handleMoveUp = () => {
                    if (index > 0) moveBlock(index, index - 1);
                  };

                  const handleMoveDown = () => {
                    if (index < blocks.length - 1) moveBlock(index, index + 1);
                  };

                  const handleMoveToTop = () => {
                    if (index > 0) moveBlock(index, 0);
                  };

                  const handleMoveToBottom = () => {
                    if (index < blocks.length - 1) moveBlock(index, blocks.length - 1);
                  };

                  return (
                    <SortableBlock
                      key={`${block.id}-${isElementEditMode}`}
                      block={block}
                      blocks={blocks}
                      isSelected={selectedBlockId === block.id}
                      isMultiSelected={isMultiSelected(block.id)}
                      isHovered={hoveredBlockId === block.id}
                      isPreviewMode={isPreviewMode}
                      isElementEditMode={isElementEditMode}
                      onSelect={handleSelect}
                      onHover={() => hoverBlock(block.id)}
                      onLeave={() => hoverBlock(null)}
                      onDelete={() => deleteBlock(block.id)}
                      onDuplicate={() => duplicateBlock(block.id)}
                      onCopy={handleCopy}
                      onCut={handleCut}
                      onPaste={handlePaste}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      onMoveToTop={handleMoveToTop}
                      onMoveToBottom={handleMoveToBottom}
                      onUpdate={(content) => updateBlock(block.id, content)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          ) : (
            <DropZone onDrop={() => {}} isActive={isOverCanvas && isDragging} />
          )}

          {/* Empty state add button */}
          {blocks.length > 0 && !isPreviewMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 flex justify-center"
            >
              <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                <p className="text-sm text-neutral-500">
                  Drag more blocks here or select from the library
                </p>
              </div>
            </motion.div>
          )}
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeBlock && (
          <div className="opacity-80 shadow-2xl rounded-lg">
            <BlockRenderer block={activeBlock} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
