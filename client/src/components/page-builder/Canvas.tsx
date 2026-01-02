import React from 'react';
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
import { GripVertical, Plus, Trash2, Copy, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePageBuilderStore, PageBlock } from './usePageBuilderStore';
import { getBlockById, BlockType } from './blockTypes';
import BlockRenderer from './BlockRenderer';

interface SortableBlockProps {
  block: PageBlock;
  isSelected: boolean;
  isHovered: boolean;
  isPreviewMode: boolean;
  onSelect: () => void;
  onHover: () => void;
  onLeave: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function SortableBlock({
  block,
  isSelected,
  isHovered,
  isPreviewMode,
  onSelect,
  onHover,
  onLeave,
  onDelete,
  onDuplicate,
}: SortableBlockProps) {
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
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`
        group relative
        ${isDragging ? 'opacity-50 z-50' : ''}
        ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
        ${isHovered && !isSelected ? 'ring-2 ring-primary/30 ring-offset-1' : ''}
      `}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
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
        <BlockRenderer block={block} />
        
        {/* Click overlay to prevent interaction with block content */}
        <div className="absolute inset-0 cursor-pointer" />
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

export default function Canvas() {
  const {
    blocks,
    selectedBlockId,
    hoveredBlockId,
    isPreviewMode,
    isDragging,
    selectBlock,
    hoverBlock,
    deleteBlock,
    duplicateBlock,
    moveBlock,
    addBlock,
    setDragging,
  } = usePageBuilderStore();

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [isOverCanvas, setIsOverCanvas] = React.useState(false);

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
        className={`
          min-h-full p-8 transition-colors duration-200
          ${isPreviewMode ? 'bg-white dark:bg-neutral-900' : 'bg-neutral-100 dark:bg-neutral-950'}
        `}
        onClick={handleCanvasClick}
      >
        <div className={`
          max-w-5xl mx-auto
          ${isPreviewMode ? '' : 'bg-white dark:bg-neutral-900 rounded-2xl shadow-xl min-h-[600px] p-6'}
        `}>
          {blocks.length > 0 ? (
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {blocks.map((block) => (
                  <SortableBlock
                    key={block.id}
                    block={block}
                    isSelected={selectedBlockId === block.id}
                    isHovered={hoveredBlockId === block.id}
                    isPreviewMode={isPreviewMode}
                    onSelect={() => selectBlock(block.id)}
                    onHover={() => hoverBlock(block.id)}
                    onLeave={() => hoverBlock(null)}
                    onDelete={() => deleteBlock(block.id)}
                    onDuplicate={() => duplicateBlock(block.id)}
                  />
                ))}
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
