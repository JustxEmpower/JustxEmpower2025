import React from 'react';
import { motion, Reorder } from 'framer-motion';
import { GripVertical, Eye, EyeOff, Trash2, Copy, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { usePageBuilderStore, PageBlock } from '../usePageBuilderStore';
import { getBlockById } from '../blockTypes';

interface LayerItemProps {
  block: PageBlock;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: () => void;
  onLeave: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function LayerItem({
  block,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onLeave,
  onDelete,
  onDuplicate,
}: LayerItemProps) {
  const blockType = getBlockById(block.type);
  const Icon = blockType?.icon;

  return (
    <Reorder.Item
      value={block}
      id={block.id}
      className={`
        group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150
        ${isSelected 
          ? 'bg-primary/10 border border-primary/30' 
          : isHovered 
            ? 'bg-neutral-100 dark:bg-neutral-800' 
            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
        }
      `}
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Drag handle */}
      <div className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Block icon */}
      <div className={`
        p-1.5 rounded-md transition-colors
        ${isSelected 
          ? 'bg-primary text-white' 
          : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
        }
      `}>
        {Icon && <Icon className="w-3.5 h-3.5" />}
      </div>

      {/* Block name */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : 'text-neutral-700 dark:text-neutral-300'}`}>
          {blockType?.name || block.type}
        </p>
        {block.content.heading || block.content.headline ? (
          <p className="text-xs text-neutral-400 truncate">
            {(block.content.heading || block.content.headline) as string}
          </p>
        ) : null}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
        >
          <Copy className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Reorder.Item>
  );
}

export default function LayersPanel() {
  const {
    blocks,
    selectedBlockId,
    hoveredBlockId,
    selectBlock,
    hoverBlock,
    deleteBlock,
    duplicateBlock,
    setBlocks,
  } = usePageBuilderStore();

  const handleReorder = (newBlocks: PageBlock[]) => {
    const reorderedBlocks = newBlocks.map((block, index) => ({
      ...block,
      order: index,
    }));
    setBlocks(reorderedBlocks);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900 dark:text-white">Layers</h3>
          <span className="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-full">
            {blocks.length} blocks
          </span>
        </div>
      </div>

      {/* Layers list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {blocks.length > 0 ? (
            <Reorder.Group
              axis="y"
              values={blocks}
              onReorder={handleReorder}
              className="space-y-1"
            >
              {blocks.map((block) => (
                <LayerItem
                  key={block.id}
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  isHovered={hoveredBlockId === block.id}
                  onSelect={() => selectBlock(block.id)}
                  onHover={() => hoverBlock(block.id)}
                  onLeave={() => hoverBlock(null)}
                  onDelete={() => deleteBlock(block.id)}
                  onDuplicate={() => duplicateBlock(block.id)}
                />
              ))}
            </Reorder.Group>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
                <ChevronRight className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                No blocks yet
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                Add blocks from the library
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer info */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          <span className="font-medium">Tip:</span> Drag layers to reorder blocks
        </p>
      </div>
    </div>
  );
}
