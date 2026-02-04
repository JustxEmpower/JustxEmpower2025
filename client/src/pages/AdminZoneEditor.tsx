import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { usePageBuilderStore } from '@/components/page-builder/usePageBuilderStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Eye, Plus, Trash2, GripVertical, Layers, Settings, X, Box, Sparkles, Star, Image as ImageIcon, MousePointer, Edit3, Ruler } from 'lucide-react';
import { CompactMarginRuler } from '@/components/page-builder/MarginRuler';
import MediaPicker from '@/components/MediaPicker';
import { blockTypes } from '@/components/page-builder/blockTypes';
import { BlockRenderer } from '@/components/page-builder/BlockRenderer';
import { JE_BLOCK_FIELDS, FieldDefinition } from '@/components/page-builder/panels/BlockFieldDefinitions';
import { IconPicker } from '@/components/page-builder/IconPicker';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Lazy load Rich Text Editor for performance
const RichTextEditor = lazy(() => import('@/components/page-builder/RichTextEditor'));

interface PageBlock {
  id: string;
  type: string;
  content: Record<string, unknown>;
  order: number;
}

// Comprehensive Field Renderer - matches BlockSettings.tsx capabilities
function ZoneFieldRenderer({
  field,
  value,
  onChange,
  blockId,
}: {
  field: FieldDefinition;
  value: unknown;
  onChange: (blockId: string, key: string, value: unknown) => void;
  blockId: string;
}) {
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  switch (field.type) {
    case 'text':
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{field.label}</Label>
          <Input
            value={(value as string) || ''}
            onChange={(e) => onChange(blockId, field.key, e.target.value)}
            placeholder={field.placeholder}
          />
          {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{field.label}</Label>
          <Textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(blockId, field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
          />
          {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
        </div>
      );

    case 'richtext':
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{field.label}</Label>
          <Suspense fallback={<div className="p-4 text-sm text-muted-foreground border rounded-md">Loading editor...</div>}>
            <RichTextEditor
              value={(value as string) || ''}
              onChange={(content) => onChange(blockId, field.key, content)}
              placeholder={field.placeholder}
              height={150}
            />
          </Suspense>
          {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
        </div>
      );

    case 'number':
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{field.label}</Label>
          <Input
            type="number"
            value={(value as number) || field.min || 0}
            onChange={(e) => onChange(blockId, field.key, Number(e.target.value))}
            min={field.min}
            max={field.max}
          />
        </div>
      );

    case 'boolean':
      return (
        <div className="flex items-center justify-between py-2">
          <div>
            <Label className="text-sm font-medium">{field.label}</Label>
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
          </div>
          <Switch
            checked={(value as boolean) || false}
            onCheckedChange={(checked) => onChange(blockId, field.key, checked)}
          />
        </div>
      );

    case 'select':
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{field.label}</Label>
          <Select value={value != null ? String(value) : ''} onValueChange={(v) => onChange(blockId, field.key, v)}>
            <SelectTrigger><SelectValue placeholder={field.placeholder || `Select ${field.label}`} /></SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
        </div>
      );

    case 'color':
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{field.label}</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              className="w-12 h-10 p-1 cursor-pointer rounded"
              value={(value as string) || '#ffffff'}
              onChange={(e) => onChange(blockId, field.key, e.target.value)}
            />
            <Input
              value={(value as string) || ''}
              onChange={(e) => onChange(blockId, field.key, e.target.value)}
              placeholder="#ffffff"
              className="flex-1"
            />
            {value && (
              <Button variant="ghost" size="sm" className="h-10 px-2" onClick={() => onChange(blockId, field.key, '')}>
                Clear
              </Button>
            )}
          </div>
        </div>
      );

    case 'image':
    case 'video':
      const isVideo = field.type === 'video' || (value as string)?.match(/\.(mp4|webm|mov)$/i);
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{field.label}</Label>
          <div className="flex gap-2">
            <Input
              value={(value as string) || ''}
              onChange={(e) => onChange(blockId, field.key, e.target.value)}
              placeholder="https://..."
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={() => setMediaPickerOpen(true)} className="px-3">
              <ImageIcon className="w-4 h-4" />
            </Button>
          </div>
          {value && (
            <div className="relative w-full h-24 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
              {isVideo ? (
                <video src={value as string} className="w-full h-full object-cover" muted playsInline />
              ) : (
                <img src={value as string} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              )}
            </div>
          )}
          <MediaPicker
            open={mediaPickerOpen}
            onClose={() => setMediaPickerOpen(false)}
            onSelect={(url) => { onChange(blockId, field.key, url); setMediaPickerOpen(false); }}
            mediaType={field.type === 'video' ? 'video' : 'image'}
          />
        </div>
      );

    case 'url':
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{field.label}</Label>
          <Input
            type="url"
            value={(value as string) || ''}
            onChange={(e) => onChange(blockId, field.key, e.target.value)}
            placeholder={field.placeholder || 'https://...'}
          />
        </div>
      );

    case 'alignment':
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{field.label}</Label>
          <div className="grid grid-cols-3 gap-1">
            {['left', 'center', 'right'].map((align) => (
              <Button
                key={align}
                size="sm"
                variant={value === align ? 'default' : 'outline'}
                onClick={() => onChange(blockId, field.key, align)}
                className="capitalize"
              >
                {align}
              </Button>
            ))}
          </div>
        </div>
      );

    case 'icon':
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{field.label}</Label>
          <IconPicker
            value={(value as string) || ''}
            onChange={(icon) => onChange(blockId, field.key, icon)}
          />
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{field.label}</Label>
          <Input
            value={(value as string) || ''}
            onChange={(e) => onChange(blockId, field.key, e.target.value)}
            placeholder={field.placeholder}
          />
        </div>
      );
  }
}

// Group fields by their group property
function getGroupedFields(blockType: string): Record<string, FieldDefinition[]> {
  const fields = JE_BLOCK_FIELDS[blockType] || [];
  const grouped: Record<string, FieldDefinition[]> = {
    content: [],
    media: [],
    style: [],
    layout: [],
    advanced: [],
  };
  
  fields.forEach((field) => {
    const group = field.group || 'content';
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(field);
  });
  
  return grouped;
}

function SortableBlock({ block, onDelete, isSelected, onSelect, isElementEditMode, onUpdate }: { 
  block: PageBlock; 
  onDelete: () => void;
  isSelected: boolean;
  onSelect: () => void;
  isElementEditMode: boolean;
  onUpdate: (content: Record<string, unknown>) => void;
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
      <div className={isElementEditMode ? '' : 'pointer-events-none'}>
        <BlockRenderer 
          block={block} 
          isPreviewMode={false} 
          isEditing={isElementEditMode && !isSelected} 
          isElementEditMode={isElementEditMode} 
          onUpdate={onUpdate} 
        />
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
  const [isElementEditMode, setIsElementEditMode] = useState(false);
  
  // Get setInPageBuilder from store to mark we're in editor context
  const setInPageBuilder = usePageBuilderStore((state) => state.setInPageBuilder);
  
  // Mark that we're in Page Builder/Zone Editor context on mount
  useEffect(() => {
    setInPageBuilder(true);
    return () => setInPageBuilder(false);
  }, [setInPageBuilder]);

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
    setBlocks(prev => prev.map(block => 
      block.id === id 
        ? { ...block, content: { ...block.content, [key]: value } }
        : block
    ));
  };

  // Update multiple content fields at once (for margin ruler)
  const updateBlockContentMultiple = (id: string, updates: Record<string, unknown>) => {
    setBlocks(prev => prev.map(block => 
      block.id === id 
        ? { ...block, content: { ...block.content, ...updates } }
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Zone Content ({blocks.length} blocks)</CardTitle>
                  <CardDescription>Click a block to edit its content</CardDescription>
                </div>
                <Button
                  variant={isElementEditMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsElementEditMode(!isElementEditMode)}
                  className={isElementEditMode ? "bg-amber-500 hover:bg-amber-600" : ""}
                >
                  {isElementEditMode ? (
                    <><MousePointer className="w-4 h-4 mr-2" /> Block Mode</>
                  ) : (
                    <><Edit3 className="w-4 h-4 mr-2" /> Edit Elements</>
                  )}
                </Button>
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
                            isElementEditMode={isElementEditMode}
                            onUpdate={(content) => setBlocks(blocks.map(b => b.id === block.id ? { ...b, content } : b))}
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
                <CardContent className="p-0">
                  {/* Use field definitions if available for this block type */}
                  {JE_BLOCK_FIELDS[selectedBlock.type] ? (
                    <Tabs defaultValue="content" className="w-full flex flex-col" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                      <TabsList className="w-full grid grid-cols-4 mx-3 mb-2 flex-shrink-0" style={{ width: 'calc(100% - 24px)' }}>
                        <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
                        <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>
                        <TabsTrigger value="layout" className="text-xs">Layout</TabsTrigger>
                        <TabsTrigger value="advanced" className="text-xs">Advanced</TabsTrigger>
                      </TabsList>
                      
                      {(['content', 'media', 'style', 'layout', 'advanced'] as const).map((groupName) => {
                        const groupedFields = getGroupedFields(selectedBlock.type);
                        const fields = groupName === 'content' 
                          ? [...(groupedFields.content || []), ...(groupedFields.media || [])]
                          : groupedFields[groupName] || [];
                        
                        if (fields.length === 0 && groupName !== 'content' && groupName !== 'layout') return null;
                        
                        const tabValue = groupName === 'media' ? 'content' : groupName;
                        
                        return (
                          <TabsContent key={groupName} value={tabValue} className="m-0 px-3 flex-1 overflow-hidden">
                            <ScrollArea className="h-full" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                              <div className="space-y-4 pr-4 pb-8">
                                {/* Microsoft Word-style Margin Ruler for ALL block types in Layout tab */}
                                {groupName === 'layout' && (
                                  <div className="space-y-3 pb-4 border-b border-neutral-200 dark:border-neutral-700">
                                    <div className="flex items-center gap-2">
                                      <Ruler className="w-4 h-4 text-blue-500" />
                                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Content Width Ruler</h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Drag the handles to adjust content margins like Microsoft Word</p>
                                    <CompactMarginRuler
                                      leftMargin={parseFloat(selectedBlock.content.marginLeft as string || '5') || 5}
                                      rightMargin={parseFloat(selectedBlock.content.marginRight as string || '5') || 5}
                                      onLeftMarginChange={(percent) => {
                                        updateBlockContentMultiple(selectedBlock.id, {
                                          marginLeft: `${percent}%`,
                                          textWidthPreset: 'custom'
                                        });
                                      }}
                                      onRightMarginChange={(percent) => {
                                        updateBlockContentMultiple(selectedBlock.id, {
                                          marginRight: `${percent}%`,
                                          textWidthPreset: 'custom'
                                        });
                                      }}
                                    />
                                  </div>
                                )}
                                {fields.map((field) => (
                                  <ZoneFieldRenderer
                                    key={field.key}
                                    field={field}
                                    value={selectedBlock.content[field.key]}
                                    onChange={updateBlockContent}
                                    blockId={selectedBlock.id}
                                  />
                                ))}
                                {fields.length === 0 && groupName !== 'layout' && (
                                  <p className="text-sm text-muted-foreground py-4">No {groupName} settings available for this block.</p>
                                )}
                              </div>
                            </ScrollArea>
                          </TabsContent>
                        );
                      })}
                    </Tabs>
                  ) : (
                    /* Fallback for blocks without field definitions */
                    <ScrollArea className="h-full" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                      <div className="space-y-4 p-4 pb-8">
                        {/* Special handling for JE Carousel blocks */}
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
                      
                      {/* Special handling for JE Image blocks - show size controls */}
                      {selectedBlock.type === 'je-image' && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Image Size</Label>
                            <div className="grid grid-cols-5 gap-1">
                              {['10%', '15%', '20%', '25%', '33%'].map((size) => (
                                <Button
                                  key={size}
                                  size="sm"
                                  variant={(selectedBlock.content as any).maxWidth === size ? 'default' : 'outline'}
                                  className="text-xs px-1"
                                  onClick={() => updateBlockContent(selectedBlock.id, 'maxWidth', size)}
                                >
                                  {size}
                                </Button>
                              ))}
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                              {['50%', '75%', '100%'].map((size) => (
                                <Button
                                  key={size}
                                  size="sm"
                                  variant={(selectedBlock.content as any).maxWidth === size || (!((selectedBlock.content as any).maxWidth) && size === '100%') ? 'default' : 'outline'}
                                  className="text-xs"
                                  onClick={() => updateBlockContent(selectedBlock.id, 'maxWidth', size)}
                                >
                                  {size}
                                </Button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Alignment</Label>
                            <div className="grid grid-cols-3 gap-1">
                              {[
                                { value: 'left', label: 'Left' },
                                { value: 'center', label: 'Center' },
                                { value: 'right', label: 'Right' },
                              ].map((opt) => (
                                <Button
                                  key={opt.value}
                                  size="sm"
                                  variant={(selectedBlock.content as any).alignment === opt.value || (!((selectedBlock.content as any).alignment) && opt.value === 'center') ? 'default' : 'outline'}
                                  className="text-xs"
                                  onClick={() => updateBlockContent(selectedBlock.id, 'alignment', opt.value)}
                                >
                                  {opt.label}
                                </Button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Rounded Corners</Label>
                            <Switch
                              checked={(selectedBlock.content as any).rounded !== false}
                              onCheckedChange={(v) => updateBlockContent(selectedBlock.id, 'rounded', v)}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Shadow</Label>
                            <Switch
                              checked={(selectedBlock.content as any).shadow === true}
                              onCheckedChange={(v) => updateBlockContent(selectedBlock.id, 'shadow', v)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Image URL</Label>
                            <Input
                              value={(selectedBlock.content as any).imageUrl || ''}
                              onChange={(e) => updateBlockContent(selectedBlock.id, 'imageUrl', e.target.value)}
                              placeholder="https://..."
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Alt Text</Label>
                            <Input
                              value={(selectedBlock.content as any).alt || ''}
                              onChange={(e) => updateBlockContent(selectedBlock.id, 'alt', e.target.value)}
                              placeholder="Image description"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Caption</Label>
                            <Input
                              value={(selectedBlock.content as any).caption || ''}
                              onChange={(e) => updateBlockContent(selectedBlock.id, 'caption', e.target.value)}
                              placeholder="Optional caption"
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
                      
                      {/* Render editable fields based on block content (skip for blocks with custom controls) */}
                      {selectedBlock.type !== 'je-gallery' && selectedBlock.type !== 'je-image' && selectedBlock.type !== 'je-carousel' && Object.entries(selectedBlock.content).map(([key, value]) => {
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

                        if (key === 'itemGap' || key === 'gap') {
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

                        if (key === 'imageSize') {
                          return (
                            <div key={key} className="space-y-2">
                              <Label className="text-sm font-medium">Image Size</Label>
                              <Select value={value as string} onValueChange={(v) => updateBlockContent(selectedBlock.id, key, v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="small">Small</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="large">Large</SelectItem>
                                  <SelectItem value="full">Full</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        }

                        if (key === 'buttonSize') {
                          return (
                            <div key={key} className="space-y-2">
                              <Label className="text-sm font-medium">Button Size</Label>
                              <Select value={value as string} onValueChange={(v) => updateBlockContent(selectedBlock.id, key, v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sm">Small</SelectItem>
                                  <SelectItem value="md">Medium</SelectItem>
                                  <SelectItem value="lg">Large</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        }

                        if (key === 'fontSize' || key === 'titleFontSize' || key === 'subtitleFontSize' || key === 'descriptionFontSize' || key === 'labelFontSize') {
                          return (
                            <div key={key} className="space-y-2">
                              <Label className="text-sm font-medium">Text Size</Label>
                              <Select value={value as string} onValueChange={(v) => updateBlockContent(selectedBlock.id, key, v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="8px">8</SelectItem>
                                  <SelectItem value="10px">10</SelectItem>
                                  <SelectItem value="12px">12</SelectItem>
                                  <SelectItem value="14px">14</SelectItem>
                                  <SelectItem value="16px">16</SelectItem>
                                  <SelectItem value="18px">18</SelectItem>
                                  <SelectItem value="20px">20</SelectItem>
                                  <SelectItem value="24px">24</SelectItem>
                                  <SelectItem value="28px">28</SelectItem>
                                  <SelectItem value="32px">32</SelectItem>
                                  <SelectItem value="36px">36</SelectItem>
                                  <SelectItem value="40px">40</SelectItem>
                                  <SelectItem value="48px">48</SelectItem>
                                  <SelectItem value="56px">56</SelectItem>
                                  <SelectItem value="64px">64</SelectItem>
                                  <SelectItem value="72px">72</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        }

                        if (key === 'alignment' || key === 'textAlignment') {
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

                        if (key === 'level') {
                          return (
                            <div key={key} className="space-y-2">
                              <Label className="text-sm font-medium">Heading Level</Label>
                              <Select value={value as string} onValueChange={(v) => updateBlockContent(selectedBlock.id, key, v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="h1">H1</SelectItem>
                                  <SelectItem value="h2">H2</SelectItem>
                                  <SelectItem value="h3">H3</SelectItem>
                                  <SelectItem value="h4">H4</SelectItem>
                                  <SelectItem value="h5">H5</SelectItem>
                                  <SelectItem value="h6">H6</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        }

                        if (key === 'columns' && typeof value === 'number') {
                          return (
                            <div key={key} className="space-y-2">
                              <Label className="text-sm font-medium">Columns</Label>
                              <Select value={String(value)} onValueChange={(v) => updateBlockContent(selectedBlock.id, key, Number(v))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="2">2</SelectItem>
                                  <SelectItem value="3">3</SelectItem>
                                  <SelectItem value="4">4</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        }
                        
                        // Color picker fields
                        if (key.endsWith('Color') && typeof value === 'string') {
                          return (
                            <div key={key} className="space-y-2">
                              <Label className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                              <div className="flex gap-2">
                                <Input type="color" className="w-12 h-10 p-1 cursor-pointer rounded" value={value || '#ffffff'} onChange={(e) => updateBlockContent(selectedBlock.id, key, e.target.value)} />
                                <Input value={value} onChange={(e) => updateBlockContent(selectedBlock.id, key, e.target.value)} placeholder="#ffffff" className="flex-1" />
                              </div>
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
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
