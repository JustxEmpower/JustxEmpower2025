import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, Box, Plus, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { blockTypes, blockCategories, BlockType, BlockCategory } from '../blockTypes';
import { usePageBuilderStore } from '../usePageBuilderStore';
import { useDraggable } from '@dnd-kit/core';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

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
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('preset');
  const [expandedCategories, setExpandedCategories] = useState<Set<BlockCategory>>(
    () => new Set<BlockCategory>(['layout', 'content'])
  );
  const addBlock = usePageBuilderStore((state) => state.addBlock);
  
  // Fetch custom blocks from Block Store
  const { data: customBlocks } = trpc.blockStore.getAll.useQuery({});
  const incrementUsage = trpc.blockStore.incrementUsage.useMutation();

  // Add custom block from Block Store
  const handleAddCustomBlock = (customBlock: NonNullable<typeof customBlocks>[0]) => {
    try {
      const content = JSON.parse(customBlock.content);
      const block: BlockType = {
        id: customBlock.blockType,
        name: customBlock.name,
        description: customBlock.description || '',
        icon: Box,
        category: 'custom' as any,
        defaultContent: content,
      };
      addBlock(block);
      incrementUsage.mutate({ id: customBlock.id });
    } catch (e) {
      console.error('Failed to add custom block:', e);
    }
  };

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
          (block.name && block.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (block.description && block.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
      {/* Tabs for Preset and Custom Blocks */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-700">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="preset" className="text-xs">Preset Blocks</TabsTrigger>
            <TabsTrigger value="custom" className="text-xs">
              <Star className="w-3 h-3 mr-1" />
              My Blocks
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="preset" className="flex-1 flex flex-col m-0 overflow-hidden">
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
        </TabsContent>

        <TabsContent value="custom" className="flex-1 flex flex-col m-0 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {customBlocks && customBlocks.length > 0 ? (
                <>
                  {customBlocks.map((customBlock) => (
                    <motion.div
                      key={customBlock.id}
                      onClick={() => handleAddCustomBlock(customBlock)}
                      className="group relative p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700 hover:border-amber-400 hover:shadow-md cursor-pointer transition-all"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-800/50 text-amber-600">
                          <Box className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{customBlock.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {customBlock.description || customBlock.category}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Used {customBlock.usageCount}x
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </>
              ) : (
                <div className="text-center py-8">
                  <Box className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-1">No custom blocks yet</p>
                  <p className="text-xs text-muted-foreground mb-4">Create reusable blocks with full editing control</p>
                </div>
              )}
              
              {/* Create New Block Button */}
              <Button 
                variant="outline" 
                className="w-full mt-3 border-dashed"
                onClick={() => navigate('/admin/block-creator')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Custom Block
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Quick tip */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          <span className="font-medium">Tip:</span> Drag blocks to the canvas or click to add at the end
        </p>
      </div>
    </div>
  );
}
