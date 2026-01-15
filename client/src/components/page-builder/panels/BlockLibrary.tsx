import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { blockTypes, blockCategories, BlockType, BlockCategory } from '../blockTypes';
import { usePageBuilderStore } from '../usePageBuilderStore';
import { useDraggable } from '@dnd-kit/core';

interface DraggableBlockProps {
  block: BlockType;
  onClick: () => void;
}

function DraggableBlock({ block, onClick }: DraggableBlockProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library-${block.id}`,
    data: { type: 'new-block', blockType: block },
  });

  const Icon = block.icon;

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`
        group relative p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700
        hover:border-primary hover:shadow-lg hover:shadow-primary/10 cursor-grab active:cursor-grabbing
        transition-all duration-200 ${isDragging ? 'opacity-50 scale-95' : ''}
      `}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 text-primary group-hover:from-primary group-hover:to-primary/80 group-hover:text-white transition-all duration-200">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-neutral-900 dark:text-white truncate">
            {block.name}
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-0.5">
            {block.description}
          </p>
        </div>
      </div>
      
      {/* Drag indicator */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex flex-col gap-0.5">
          <div className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-neutral-300" />
            <span className="w-1 h-1 rounded-full bg-neutral-300" />
          </div>
          <div className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-neutral-300" />
            <span className="w-1 h-1 rounded-full bg-neutral-300" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface CategorySectionProps {
  category: typeof blockCategories[0];
  blocks: BlockType[];
  isExpanded: boolean;
  onToggle: () => void;
  onAddBlock: (block: BlockType) => void;
}

function CategorySection({ category, blocks, isExpanded, onToggle, onAddBlock }: CategorySectionProps) {
  const Icon = category.icon;

  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <Icon className="w-4 h-4 text-neutral-500" />
        <span className="flex-1 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {category.name}
        </span>
        <span className="text-xs text-neutral-400 mr-2">{blocks.length}</span>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-2 p-2">
              {blocks.map((block) => (
                <DraggableBlock
                  key={block.id}
                  block={block}
                  onClick={() => onAddBlock(block)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BlockLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<BlockCategory>>(
    () => new Set<BlockCategory>(['layout', 'content'])
  );
  const addBlock = usePageBuilderStore((state) => state.addBlock);

  const toggleCategory = (category: BlockCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set<BlockCategory>(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const filteredBlocks = searchQuery
    ? blockTypes.filter(
        (block) =>
          block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          block.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : blockTypes;

  const blocksByCategory = blockCategories.map((category) => ({
    ...category,
    blocks: filteredBlocks.filter((block) => block.category === category.id),
  }));

  const handleAddBlock = (block: BlockType) => {
    addBlock(block);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            placeholder="Search blocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
          />
        </div>
      </div>

      {/* Block categories */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="p-2 pr-4">
          {searchQuery ? (
            // Show flat list when searching
            <div className="grid grid-cols-1 gap-2 p-2">
              {filteredBlocks.length > 0 ? (
                filteredBlocks.map((block) => (
                  <DraggableBlock
                    key={block.id}
                    block={block}
                    onClick={() => handleAddBlock(block)}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <p className="text-sm">No blocks found</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          ) : (
            // Show categorized list
            blocksByCategory.map((category) => (
              <CategorySection
                key={category.id}
                category={category}
                blocks={category.blocks}
                isExpanded={expandedCategories.has(category.id)}
                onToggle={() => toggleCategory(category.id)}
                onAddBlock={handleAddBlock}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Quick tip */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          <span className="font-medium">Tip:</span> Drag blocks to the canvas or click to add at the end
        </p>
      </div>
    </div>
  );
}
