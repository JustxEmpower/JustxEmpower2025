import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Eye, Plus, Trash2, GripVertical, Layers, Settings, X, Box, Sparkles, Star, Image as ImageIcon } from 'lucide-react';
import MediaPicker from '@/components/MediaPicker';
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

// Slide Image Editor for Carousel blocks - simplified to just images
function SlideImageEditor({ 
  slides, 
  onChange 
}: { 
  slides: Array<{ imageUrl?: string; title?: string; description?: string }>; 
  onChange: (slides: Array<{ imageUrl?: string; title?: string; description?: string }>) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number>(-1);

  const addSlide = (url: string) => {
    if (editIndex >= 0 && editIndex < slides.length) {
      // Replace existing slide image
      const newSlides = [...slides];
      newSlides[editIndex] = { ...newSlides[editIndex], imageUrl: url };
      onChange(newSlides);
    } else {
      // Add new slide with just the image
      onChange([...slides, { imageUrl: url, title: '', description: '' }]);
    }
    setPickerOpen(false);
    setEditIndex(-1);
  };

  const removeSlide = (index: number) => {
    onChange(slides.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Images ({slides.length})</Label>
        <Button 
          size="sm" 
          onClick={() => { setEditIndex(-1); setPickerOpen(true); }}
          className="h-8"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Image
        </Button>
      </div>
      
      {slides.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-neutral-300 rounded-lg bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-600">
          <ImageIcon className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
          <p className="text-neutral-500 text-sm mb-3">No images added</p>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => { setEditIndex(-1); setPickerOpen(true); }}
          >
            <Plus className="w-4 h-4 mr-1" /> Add First Image
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {slides.map((slide, i) => (
            <div key={i} className="relative aspect-square bg-neutral-200 dark:bg-neutral-700 rounded-lg overflow-hidden group">
              {slide?.imageUrl ? (
                <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-neutral-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  onClick={() => { setEditIndex(i); setPickerOpen(true); }}
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-red-400 hover:bg-white/20 h-8 w-8 p-0"
                  onClick={() => removeSlide(i)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <MediaPicker
        open={pickerOpen}
        onClose={() => { setPickerOpen(false); setEditIndex(-1); }}
        onSelect={addSlide}
        mediaType="image"
      />
    </div>
  );
}

// Image Array Editor for Gallery blocks
function ImageArrayEditor({ 
  images, 
  onChange 
}: { 
  images: Array<{ url: string; alt?: string }>; 
  onChange: (images: Array<{ url: string; alt?: string }>) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number>(-1);

  const addImage = (url: string) => {
    if (editIndex >= 0 && editIndex < images.length) {
      // Replace existing image
      const newImages = [...images];
      newImages[editIndex] = { url, alt: '' };
      onChange(newImages);
    } else {
      // Add new image
      onChange([...images, { url, alt: '' }]);
    }
    setPickerOpen(false);
    setEditIndex(-1);
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Images ({images.length})</Label>
        <Button 
          size="sm" 
          onClick={() => { setEditIndex(-1); setPickerOpen(true); }}
          className="h-8"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Image
        </Button>
      </div>
      
      {images.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-neutral-300 rounded-lg bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-600">
          <ImageIcon className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
          <p className="text-neutral-500 text-sm mb-3">No images added</p>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => { setEditIndex(-1); setPickerOpen(true); }}
          >
            <Plus className="w-4 h-4 mr-1" /> Add First Image
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-square bg-neutral-200 dark:bg-neutral-700 rounded-lg overflow-hidden group">
              {img?.url && <img src={img.url} alt="" className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  onClick={() => { setEditIndex(i); setPickerOpen(true); }}
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-red-400 hover:bg-white/20 h-8 w-8 p-0"
                  onClick={() => removeImage(i)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <MediaPicker
        open={pickerOpen}
        onClose={() => { setPickerOpen(false); setEditIndex(-1); }}
        onSelect={addImage}
        mediaType="image"
      />
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

  // Fetch custom blocks from Block Store
  const { data: customBlocks } = trpc.blockStore.getAll.useQuery({});
  const incrementUsage = trpc.blockStore.incrementUsage.useMutation();

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

  // Add a custom block from Block Store
  const addCustomBlock = (customBlock: NonNullable<typeof customBlocks>[0]) => {
    try {
      const content = JSON.parse(customBlock.content);
      const newBlock: PageBlock = {
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: customBlock.blockType,
        content: content,
        order: blocks.length,
      };
      setBlocks([...blocks, newBlock]);
      setSelectedBlockId(newBlock.id);
      // Track usage
      incrementUsage.mutate({ id: customBlock.id });
    } catch (e) {
      console.error('Failed to parse custom block content:', e);
      alert('Failed to add custom block');
    }
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id).map((b, idx) => ({ ...b, order: idx })));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const updateBlockContent = (id: string, key: string, value: unknown) => {
    setBlocks(blocks.map(block => 
      block.id === id 
        ? { ...block, content: { ...block.content, [key]: value } }
        : block
    ));
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);
  const selectedBlockDef = selectedBlock ? blockTypes.find(bt => bt.id === selectedBlock.type) : null;

  const utils = trpc.useUtils();

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
      
      // Invalidate queries to ensure live pages get fresh data
      await utils.pageZones.getZone.invalidate({ pageSlug, zoneName });
      await utils.pageZones.getAllZones.invalidate();
      await utils.pageZones.getPageZones.invalidate({ pageSlug });
      
      alert('Zone saved successfully! Refresh the live page to see changes.');
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Block Library Sidebar with Tabs for Preset and Custom Blocks */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Add Blocks
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="preset" className="w-full">
                  <TabsList className="w-full grid grid-cols-2 mx-3 mb-2" style={{ width: 'calc(100% - 24px)' }}>
                    <TabsTrigger value="preset" className="text-xs">Preset</TabsTrigger>
                    <TabsTrigger value="custom" className="text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      My Blocks
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="preset" className="m-0">
                    <ScrollArea className="h-[55vh]">
                      <div className="p-3 space-y-3">
                        {Object.entries(blocksByCategory).map(([category, categoryBlocks]) => (
                          <div key={category}>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                              {category.replace('je-', 'JE ').replace('-', ' ')}
                            </h4>
                            <div className="space-y-1">
                              {categoryBlocks.slice(0, 8).map((block) => {
                                const Icon = block.icon;
                                return (
                                  <button
                                    key={block.id}
                                    onClick={() => addBlock(block)}
                                    className="flex items-center gap-2 w-full p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
                                  >
                                    <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                                    <span className="text-xs font-medium truncate">{block.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="custom" className="m-0">
                    <ScrollArea className="h-[55vh]">
                      <div className="p-3 space-y-2">
                        {customBlocks && customBlocks.length > 0 ? (
                          <>
                            {customBlocks.map((customBlock) => (
                              <button
                                key={customBlock.id}
                                onClick={() => addCustomBlock(customBlock)}
                                className="flex items-center gap-2 w-full p-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors text-left"
                              >
                                <Box className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-medium truncate block">{customBlock.name}</span>
                                  <span className="text-[10px] text-muted-foreground truncate block">
                                    {customBlock.category} · Used {customBlock.usageCount}x
                                  </span>
                                </div>
                              </button>
                            ))}
                            <div className="pt-2 border-t mt-3">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full text-xs"
                                onClick={() => navigate('/admin/block-creator')}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Create New Block
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-6">
                            <Sparkles className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground mb-3">No custom blocks yet</p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate('/admin/block-creator')}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Create Block
                            </Button>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Canvas */}
          <div className={selectedBlock ? "lg:col-span-6" : "lg:col-span-10"}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Zone Content ({blocks.length} blocks)</CardTitle>
                <CardDescription>Click a block to edit its content</CardDescription>
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

          {/* Block Settings Panel - Shows when a block is selected */}
          {selectedBlock && (
            <div className="lg:col-span-4">
              <Card className="sticky top-20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Edit: {selectedBlockDef?.name || selectedBlock.type}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedBlockId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[60vh]">
                    <div className="space-y-4 pr-4">
                      {/* Special handling for JE Carousel blocks - show image picker for slides */}
                      {selectedBlock.type === 'je-carousel' && (
                        <>
                          <SlideImageEditor
                            slides={Array.isArray((selectedBlock.content as any).slides) ? (selectedBlock.content as any).slides : []}
                            onChange={(newSlides) => updateBlockContent(selectedBlock.id, 'slides', newSlides)}
                          />
                          
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Show Arrows</Label>
                            <Switch
                              checked={(selectedBlock.content as any).showArrows !== false}
                              onCheckedChange={(v) => updateBlockContent(selectedBlock.id, 'showArrows', v)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Show Dots</Label>
                            <Switch
                              checked={(selectedBlock.content as any).showDots !== false}
                              onCheckedChange={(v) => updateBlockContent(selectedBlock.id, 'showDots', v)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Auto Play</Label>
                            <Switch
                              checked={(selectedBlock.content as any).autoplay !== false}
                              onCheckedChange={(v) => updateBlockContent(selectedBlock.id, 'autoplay', v)}
                            />
                          </div>
                        </>
                      )}
                      
                      {/* Special handling for JE Gallery blocks - always show image picker first */}
                      {selectedBlock.type === 'je-gallery' && (
                        <>
                          {/* Display Mode Toggle */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Display Mode</Label>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={(selectedBlock.content as any).displayMode !== 'carousel' ? 'default' : 'outline'}
                                className="flex-1"
                                onClick={() => updateBlockContent(selectedBlock.id, 'displayMode', 'grid')}
                              >
                                Grid
                              </Button>
                              <Button
                                size="sm"
                                variant={(selectedBlock.content as any).displayMode === 'carousel' ? 'default' : 'outline'}
                                className="flex-1"
                                onClick={() => updateBlockContent(selectedBlock.id, 'displayMode', 'carousel')}
                              >
                                Carousel
                              </Button>
                            </div>
                          </div>
                          
                          {/* Carousel options */}
                          {(selectedBlock.content as any).displayMode === 'carousel' && (
                            <>
                              <div className="flex items-center justify-between">
                                <Label className="text-sm">Show Arrows</Label>
                                <Switch
                                  checked={(selectedBlock.content as any).showArrows !== false}
                                  onCheckedChange={(v) => updateBlockContent(selectedBlock.id, 'showArrows', v)}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label className="text-sm">Show Dots</Label>
                                <Switch
                                  checked={(selectedBlock.content as any).showDots !== false}
                                  onCheckedChange={(v) => updateBlockContent(selectedBlock.id, 'showDots', v)}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label className="text-sm">Auto Play</Label>
                                <Switch
                                  checked={(selectedBlock.content as any).autoPlay === true}
                                  onCheckedChange={(v) => updateBlockContent(selectedBlock.id, 'autoPlay', v)}
                                />
                              </div>
                            </>
                          )}
                          
                          {/* Images Editor - Always visible for gallery */}
                          <ImageArrayEditor
                            images={Array.isArray((selectedBlock.content as any).images) ? (selectedBlock.content as any).images : []}
                            onChange={(newImages) => updateBlockContent(selectedBlock.id, 'images', newImages)}
                          />
                        </>
                      )}
                      
                      {/* Render editable fields based on block content (skip for je-gallery which is handled above) */}
                      {selectedBlock.type !== 'je-gallery' && Object.entries(selectedBlock.content).map(([key, value]) => {
                        // Handle images array for other blocks
                        if (key === 'images' && Array.isArray(value)) {
                          return (
                            <ImageArrayEditor
                              key={key}
                              images={value as Array<{ url: string; alt?: string }>}
                              onChange={(newImages) => updateBlockContent(selectedBlock.id, 'images', newImages)}
                            />
                          );
                        }
                        
                        // Skip other complex arrays
                        if (Array.isArray(value)) {
                          return (
                            <div key={key} className="space-y-2">
                              <Label className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                              <p className="text-xs text-muted-foreground">
                                {(value as any[]).length} items
                              </p>
                            </div>
                          );
                        }
                        
                        // Boolean fields
                        if (typeof value === 'boolean') {
                          return (
                            <div key={key} className="flex items-center justify-between">
                              <Label className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                              <Switch
                                checked={value}
                                onCheckedChange={(checked) => updateBlockContent(selectedBlock.id, key, checked)}
                              />
                            </div>
                          );
                        }
                        
                        // Number fields
                        if (typeof value === 'number') {
                          return (
                            <div key={key} className="space-y-2">
                              <Label className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                              <Input
                                type="number"
                                value={value}
                                onChange={(e) => updateBlockContent(selectedBlock.id, key, Number(e.target.value))}
                              />
                            </div>
                          );
                        }

                        // Sizing preset fields
                        if (key === 'sectionPadding') {
                          return (
                            <div key={key} className="space-y-2">
                              <Label className="text-sm font-medium">Section Padding</Label>
                              <Select value={value as string} onValueChange={(v) => updateBlockContent(selectedBlock.id, key, v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="compact">Compact</SelectItem>
                                  <SelectItem value="standard">Standard</SelectItem>
                                  <SelectItem value="spacious">Spacious</SelectItem>
                                  <SelectItem value="hero">Hero</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        }

                        if (key === 'titleSize' || key === 'numberSize') {
                          return (
                            <div key={key} className="space-y-2">
                              <Label className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                              <Select value={value as string} onValueChange={(v) => updateBlockContent(selectedBlock.id, key, v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="small">Small</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="large">Large</SelectItem>
                                  <SelectItem value="hero">Hero</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        }

                        if (key === 'descriptionSize' || key === 'subtitleSize' || key === 'bodySize') {
                          return (
                            <div key={key} className="space-y-2">
                              <Label className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                              <Select value={value as string} onValueChange={(v) => updateBlockContent(selectedBlock.id, key, v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="small">Small</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="large">Large</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        }

                        if (key === 'itemGap') {
                          return (
                            <div key={key} className="space-y-2">
                              <Label className="text-sm font-medium">Item Spacing</Label>
                              <Select value={value as string} onValueChange={(v) => updateBlockContent(selectedBlock.id, key, v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="tight">Tight</SelectItem>
                                  <SelectItem value="standard">Standard</SelectItem>
                                  <SelectItem value="spacious">Spacious</SelectItem>
                                  <SelectItem value="wide">Wide</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        }

                        if (key === 'maxWidth') {
                          return (
                            <div key={key} className="space-y-2">
                              <Label className="text-sm font-medium">Container Width</Label>
                              <Select value={value as string} onValueChange={(v) => updateBlockContent(selectedBlock.id, key, v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="narrow">Narrow (672px)</SelectItem>
                                  <SelectItem value="medium">Medium (896px)</SelectItem>
                                  <SelectItem value="wide">Wide (1152px)</SelectItem>
                                  <SelectItem value="full">Full Width</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        }

                        if (key === 'fontSize') {
                          return (
                            <div key={key} className="space-y-2">
                              <Label className="text-sm font-medium">Font Size</Label>
                              <Select value={value as string} onValueChange={(v) => updateBlockContent(selectedBlock.id, key, v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="14px">14px (Small)</SelectItem>
                                  <SelectItem value="16px">16px (Normal)</SelectItem>
                                  <SelectItem value="18px">18px (Medium)</SelectItem>
                                  <SelectItem value="20px">20px (Large)</SelectItem>
                                  <SelectItem value="24px">24px (X-Large)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        }

                        if (key === 'alignment') {
                          return (
                            <div key={key} className="space-y-2">
                              <Label className="text-sm font-medium">Alignment</Label>
                              <Select value={value as string} onValueChange={(v) => updateBlockContent(selectedBlock.id, key, v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="left">Left</SelectItem>
                                  <SelectItem value="center">Center</SelectItem>
                                  <SelectItem value="right">Right</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        }
                        
                        // Long text fields (description, content, etc.)
                        if (typeof value === 'string' && (key.includes('description') || key.includes('content') || key.includes('text') || key.includes('bio') || key.includes('quote') || (value as string).length > 100)) {
                          return (
                            <div key={key} className="space-y-2">
                              <Label className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                              <Textarea
                                value={value as string}
                                onChange={(e) => updateBlockContent(selectedBlock.id, key, e.target.value)}
                                rows={3}
                              />
                            </div>
                          );
                        }
                        
                        // Regular string fields
                        if (typeof value === 'string') {
                          return (
                            <div key={key} className="space-y-2">
                              <Label className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                              <Input
                                value={value as string}
                                onChange={(e) => updateBlockContent(selectedBlock.id, key, e.target.value)}
                              />
                            </div>
                          );
                        }
                        
                        return null;
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
