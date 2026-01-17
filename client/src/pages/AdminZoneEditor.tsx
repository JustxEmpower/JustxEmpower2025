import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Save, Eye, Plus, Trash2, GripVertical, Layers } from 'lucide-react';
import { blockTypes } from '@/components/page-builder/blockTypes';
import { BlockRenderer } from '@/components/page-builder/BlockRenderer';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PageBlock {
  id: string;
  type: string;
  content: Record<string, unknown>;
  order: number;
}

function SortableBlock({ block, onDelete, isSelected, onSelect }: { 
  block: PageBlock; 
  onDelete: () => void;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const blockDef = blockTypes.find(b => b.id === block.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group border rounded-lg overflow-hidden ${isSelected ? 'ring-2 ring-primary' : 'border-neutral-200 dark:border-neutral-700'}`}
      onClick={onSelect}
    >
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div {...attributes} {...listeners} className="cursor-grab p-1 rounded bg-white/80 dark:bg-neutral-800/80 shadow">
          <GripVertical className="w-4 h-4" />
        </div>
        <span className="text-xs px-2 py-1 bg-white/80 dark:bg-neutral-800/80 rounded shadow font-medium">
          {blockDef?.name || block.type}
        </span>
      </div>
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <div className="pointer-events-none">
        <BlockRenderer block={block} isPreviewMode={true} />
      </div>
    </div>
  );
}

export default function AdminZoneEditor() {
  const params = useParams();
  const pageSlug = params.pageSlug as string;
  const zoneName = params.zoneName as string;
  const [, navigate] = useLocation();
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showBlockLibrary, setShowBlockLibrary] = useState(false);

  const { data: zone, isLoading } = trpc.pageZones.getZone.useQuery(
    { pageSlug: pageSlug!, zoneName: zoneName! },
    { enabled: !!pageSlug && !!zoneName }
  );

  const upsertZone = trpc.pageZones.upsertZone.useMutation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (zone?.blocks) {
      try {
        const parsed = JSON.parse(zone.blocks);
        setBlocks(parsed);
      } catch (e) {
        console.error('Failed to parse zone blocks:', e);
        setBlocks([]);
      }
    }
  }, [zone]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, idx) => ({ ...item, order: idx }));
      });
    }
  };

  const addBlock = (blockType: typeof blockTypes[0]) => {
    const newBlock: PageBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: blockType.id,
      content: { ...blockType.defaultContent },
      order: blocks.length,
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    setShowBlockLibrary(false);
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id).map((b, idx) => ({ ...b, order: idx })));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const handleSave = async () => {
    if (!pageSlug || !zoneName) return;
    setIsSaving(true);
    console.log('[ZoneEditor] Saving zone:', { pageSlug, zoneName, blocksCount: blocks.length });
    console.log('[ZoneEditor] Blocks data:', JSON.stringify(blocks, null, 2));
    try {
      const result = await upsertZone.mutateAsync({
        pageSlug,
        zoneName,
        blocks: JSON.stringify(blocks),
        isActive: true,
      });
      console.log('[ZoneEditor] Save result:', result);
      alert('Zone saved successfully!');
    } catch (error: any) {
      console.error('[ZoneEditor] Failed to save zone:', error);
      console.error('[ZoneEditor] Error details:', error?.message, error?.data);
      alert(`Failed to save zone: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Group blocks by category
  const blocksByCategory = blockTypes.reduce((acc, block) => {
    const cat = block.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(block);
    return acc;
  }, {} as Record<string, typeof blockTypes>);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Edit Zone: {zoneName}</h1>
              <p className="text-sm text-muted-foreground">Page: {pageSlug}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.open(`/${pageSlug === 'home' ? '' : pageSlug}`, '_blank')}>
              <Eye className="w-4 h-4 mr-2" />
              Preview Page
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Zone'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Block Library Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Add Blocks
                </CardTitle>
                <CardDescription>Click to add blocks to this zone</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[60vh]">
                  <div className="p-4 space-y-4">
                    {Object.entries(blocksByCategory).map(([category, categoryBlocks]) => (
                      <div key={category}>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          {category.replace('je-', 'JE ').replace('-', ' ')}
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {categoryBlocks.slice(0, 6).map((block) => {
                            const Icon = block.icon;
                            return (
                              <button
                                key={block.id}
                                onClick={() => addBlock(block)}
                                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-center"
                              >
                                <Icon className="w-5 h-5 text-primary" />
                                <span className="text-xs font-medium truncate w-full">{block.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Canvas */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Zone Content ({blocks.length} blocks)</CardTitle>
                <CardDescription>Drag blocks to reorder. Click to select and edit.</CardDescription>
              </CardHeader>
              <CardContent>
                {blocks.length === 0 ? (
                  <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-12 text-center">
                    <Plus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No blocks yet</h3>
                    <p className="text-muted-foreground mb-4">Add blocks from the sidebar to build this zone</p>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-4">
                        {blocks.map((block) => (
                          <SortableBlock
                            key={block.id}
                            block={block}
                            onDelete={() => deleteBlock(block.id)}
                            isSelected={selectedBlockId === block.id}
                            onSelect={() => setSelectedBlockId(block.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
