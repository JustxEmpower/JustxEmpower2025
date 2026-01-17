/**
 * Block Creator - Create custom reusable blocks for the Block Store
 * Full editing capabilities with live preview
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Save, Eye, Plus, Trash2, GripVertical, Layers, 
  Box, Sparkles, Type, Image, Layout, List, Grid, 
  Heart, Star, Zap, FileText, MessageSquare, Users
} from 'lucide-react';
import { blockTypes } from '@/components/page-builder/blockTypes';
import { BlockRenderer } from '@/components/page-builder/BlockRenderer';

const ICON_OPTIONS = [
  { value: 'box', label: 'Box', icon: Box },
  { value: 'sparkles', label: 'Sparkles', icon: Sparkles },
  { value: 'type', label: 'Type', icon: Type },
  { value: 'image', label: 'Image', icon: Image },
  { value: 'layout', label: 'Layout', icon: Layout },
  { value: 'list', label: 'List', icon: List },
  { value: 'grid', label: 'Grid', icon: Grid },
  { value: 'heart', label: 'Heart', icon: Heart },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'zap', label: 'Zap', icon: Zap },
  { value: 'file-text', label: 'Document', icon: FileText },
  { value: 'message-square', label: 'Message', icon: MessageSquare },
  { value: 'users', label: 'Users', icon: Users },
];

const CATEGORY_OPTIONS = [
  { value: 'custom', label: 'Custom' },
  { value: 'hero', label: 'Hero Sections' },
  { value: 'content', label: 'Content Blocks' },
  { value: 'features', label: 'Features & Lists' },
  { value: 'testimonials', label: 'Testimonials' },
  { value: 'cta', label: 'Call to Action' },
  { value: 'media', label: 'Media & Gallery' },
];

interface BlockContent {
  [key: string]: any;
}

export default function AdminBlockCreator() {
  const [, navigate] = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('design');
  
  // Block metadata
  const [blockName, setBlockName] = useState('');
  const [blockDescription, setBlockDescription] = useState('');
  const [blockCategory, setBlockCategory] = useState('custom');
  const [blockIcon, setBlockIcon] = useState('box');
  
  // Selected base block type
  const [selectedBlockType, setSelectedBlockType] = useState<string>('');
  
  // Block content being edited
  const [blockContent, setBlockContent] = useState<BlockContent>({});
  
  const createBlock = trpc.blockStore.create.useMutation();
  
  // Get block types grouped by category
  const blocksByCategory = blockTypes.reduce((acc, block) => {
    const cat = block.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(block);
    return acc;
  }, {} as Record<string, typeof blockTypes>);

  // When a base block type is selected, initialize content with defaults
  const handleSelectBlockType = (blockTypeId: string) => {
    const blockDef = blockTypes.find(b => b.id === blockTypeId);
    if (blockDef) {
      setSelectedBlockType(blockTypeId);
      setBlockContent({ ...blockDef.defaultContent });
      if (!blockName) {
        setBlockName(`Custom ${blockDef.name}`);
      }
    }
  };

  // Update a specific content field
  const updateContent = (key: string, value: any) => {
    setBlockContent(prev => ({ ...prev, [key]: value }));
  };

  // Update an item in an array field
  const updateArrayItem = (arrayKey: string, index: number, itemKey: string, value: any) => {
    setBlockContent(prev => {
      const array = [...(prev[arrayKey] || [])];
      array[index] = { ...array[index], [itemKey]: value };
      return { ...prev, [arrayKey]: array };
    });
  };

  // Add item to array field
  const addArrayItem = (arrayKey: string, template: any) => {
    setBlockContent(prev => ({
      ...prev,
      [arrayKey]: [...(prev[arrayKey] || []), template]
    }));
  };

  // Remove item from array field
  const removeArrayItem = (arrayKey: string, index: number) => {
    setBlockContent(prev => ({
      ...prev,
      [arrayKey]: (prev[arrayKey] || []).filter((_: any, i: number) => i !== index)
    }));
  };

  // Save block to store
  const handleSave = async () => {
    if (!blockName || !selectedBlockType) {
      alert('Please provide a name and select a block type');
      return;
    }
    
    setIsSaving(true);
    try {
      await createBlock.mutateAsync({
        name: blockName,
        description: blockDescription,
        category: blockCategory,
        icon: blockIcon,
        blockType: selectedBlockType,
        content: JSON.stringify(blockContent),
      });
      alert('Block saved to Block Store!');
      navigate('/admin/block-store');
    } catch (error: any) {
      console.error('Failed to save block:', error);
      alert(`Failed to save: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Create a preview block object
  const previewBlock = {
    id: 'preview',
    type: selectedBlockType,
    content: blockContent,
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/block-store')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Block Store
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Block Creator</h1>
              <p className="text-sm text-muted-foreground">Create a custom reusable block</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving || !blockName || !selectedBlockType}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save to Block Store'}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Panel - Block Type Selection */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Choose Base Block
                </CardTitle>
                <CardDescription>Select a starting template</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[50vh]">
                  <div className="p-3 space-y-3">
                    {Object.entries(blocksByCategory).map(([category, categoryBlocks]) => (
                      <div key={category}>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          {category.replace('je-', 'JE ').replace('-', ' ')}
                        </h4>
                        <div className="space-y-1">
                          {categoryBlocks.map((block) => {
                            const Icon = block.icon;
                            const isSelected = selectedBlockType === block.id;
                            return (
                              <button
                                key={block.id}
                                onClick={() => handleSelectBlockType(block.id)}
                                className={`flex items-center gap-2 w-full p-2 rounded-lg border transition-colors text-left ${
                                  isSelected 
                                    ? 'border-primary bg-primary/10 text-primary' 
                                    : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                }`}
                              >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <span className="text-xs font-medium truncate">{block.name}</span>
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

          {/* Center - Preview & Content Editor */}
          <div className="lg:col-span-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="design">Design & Preview</TabsTrigger>
                <TabsTrigger value="content">Edit Content</TabsTrigger>
              </TabsList>

              <TabsContent value="design">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Live Preview</CardTitle>
                    <CardDescription>See your block as it will appear</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedBlockType ? (
                      <div className="border rounded-lg overflow-hidden bg-white">
                        <BlockRenderer block={previewBlock} isPreviewMode={true} />
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-neutral-300 rounded-lg p-12 text-center">
                        <Layers className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">Select a Base Block</h3>
                        <p className="text-muted-foreground">Choose a block type from the left panel to start customizing</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Edit Block Content</CardTitle>
                    <CardDescription>Customize all text, images, and settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedBlockType ? (
                      <ScrollArea className="h-[60vh]">
                        <div className="space-y-4 pr-4">
                          {Object.entries(blockContent).map(([key, value]) => {
                            // Array fields - render each item
                            if (Array.isArray(value)) {
                              return (
                                <div key={key} className="space-y-3 border rounded-lg p-4">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => addArrayItem(key, value[0] ? { ...value[0] } : {})}
                                    >
                                      <Plus className="w-3 h-3 mr-1" /> Add
                                    </Button>
                                  </div>
                                  {value.map((item: any, index: number) => (
                                    <div key={index} className="border rounded p-3 space-y-2 bg-neutral-50 dark:bg-neutral-800">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-muted-foreground">Item {index + 1}</span>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => removeArrayItem(key, index)}
                                        >
                                          <Trash2 className="w-3 h-3 text-destructive" />
                                        </Button>
                                      </div>
                                      {Object.entries(item).map(([itemKey, itemValue]) => (
                                        <div key={itemKey} className="space-y-1">
                                          <Label className="text-xs capitalize">{itemKey.replace(/([A-Z])/g, ' $1')}</Label>
                                          {typeof itemValue === 'string' && itemValue.length > 50 ? (
                                            <Textarea
                                              value={itemValue}
                                              onChange={(e) => updateArrayItem(key, index, itemKey, e.target.value)}
                                              rows={2}
                                              className="text-sm"
                                            />
                                          ) : (
                                            <Input
                                              value={String(itemValue || '')}
                                              onChange={(e) => updateArrayItem(key, index, itemKey, e.target.value)}
                                              className="text-sm"
                                            />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ))}
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
                                    onCheckedChange={(checked) => updateContent(key, checked)}
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
                                    onChange={(e) => updateContent(key, Number(e.target.value))}
                                  />
                                </div>
                              );
                            }

                            // Sizing presets
                            if (key === 'sectionPadding') {
                              return (
                                <div key={key} className="space-y-2">
                                  <Label className="text-sm font-medium">Section Padding</Label>
                                  <Select value={value as string} onValueChange={(v) => updateContent(key, v)}>
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
                                  <Select value={value as string} onValueChange={(v) => updateContent(key, v)}>
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

                            if (key === 'descriptionSize' || key === 'subtitleSize') {
                              return (
                                <div key={key} className="space-y-2">
                                  <Label className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                                  <Select value={value as string} onValueChange={(v) => updateContent(key, v)}>
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
                                  <Select value={value as string} onValueChange={(v) => updateContent(key, v)}>
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
                                  <Select value={value as string} onValueChange={(v) => updateContent(key, v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="max-w-4xl">Narrow</SelectItem>
                                      <SelectItem value="max-w-5xl">Medium</SelectItem>
                                      <SelectItem value="max-w-6xl">Wide</SelectItem>
                                      <SelectItem value="max-w-7xl">Extra Wide</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            }
                            
                            // Long text fields
                            if (typeof value === 'string' && (key.includes('description') || key.includes('content') || key.includes('text') || (value as string).length > 80)) {
                              return (
                                <div key={key} className="space-y-2">
                                  <Label className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                                  <Textarea
                                    value={value}
                                    onChange={(e) => updateContent(key, e.target.value)}
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
                                    value={value}
                                    onChange={(e) => updateContent(key, e.target.value)}
                                  />
                                </div>
                              );
                            }
                            
                            return null;
                          })}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Select a block type to start editing
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Block Metadata */}
          <div className="lg:col-span-3">
            <Card className="sticky top-20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Box className="w-4 h-4" />
                  Block Details
                </CardTitle>
                <CardDescription>Name and categorize your block</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Block Name *</Label>
                  <Input
                    value={blockName}
                    onChange={(e) => setBlockName(e.target.value)}
                    placeholder="My Custom Block"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={blockDescription}
                    onChange={(e) => setBlockDescription(e.target.value)}
                    placeholder="What this block is for..."
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={blockCategory} onValueChange={setBlockCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Select value={blockIcon} onValueChange={setBlockIcon}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map(opt => {
                        const IconComp = opt.icon;
                        return (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <IconComp className="w-4 h-4" />
                              {opt.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {selectedBlockType && (
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Base: <span className="font-medium">{blockTypes.find(b => b.id === selectedBlockType)?.name}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
