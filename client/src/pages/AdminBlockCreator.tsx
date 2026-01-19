/**
 * Block Creator - Create custom reusable blocks for the Block Store
 * Full editing capabilities with live preview
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { motion } from 'framer-motion';
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
  Heart, Star, Zap, FileText, MessageSquare, Users, Wand2, Palette
} from 'lucide-react';
import { blockTypes } from '@/components/page-builder/blockTypes';
import { BlockRenderer } from '@/components/page-builder/BlockRenderer';
import AdminSidebar from '@/components/AdminSidebar';

// Category color schemes for vibrant styling
const categoryColors: Record<string, { bg: string; border: string; text: string; icon: string; gradient: string }> = {
  'je-hero': { bg: 'bg-gradient-to-br from-purple-50 to-pink-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-500', gradient: 'from-purple-500 to-pink-500' },
  'je-content': { bg: 'bg-gradient-to-br from-blue-50 to-cyan-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-500', gradient: 'from-blue-500 to-cyan-500' },
  'je-interactive': { bg: 'bg-gradient-to-br from-amber-50 to-orange-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-500', gradient: 'from-amber-500 to-orange-500' },
  'je-media': { bg: 'bg-gradient-to-br from-green-50 to-emerald-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-500', gradient: 'from-green-500 to-emerald-500' },
  'je-layout': { bg: 'bg-gradient-to-br from-indigo-50 to-violet-50', border: 'border-indigo-200', text: 'text-indigo-700', icon: 'text-indigo-500', gradient: 'from-indigo-500 to-violet-500' },
  'hero': { bg: 'bg-gradient-to-br from-rose-50 to-pink-50', border: 'border-rose-200', text: 'text-rose-700', icon: 'text-rose-500', gradient: 'from-rose-500 to-pink-500' },
  'content': { bg: 'bg-gradient-to-br from-teal-50 to-cyan-50', border: 'border-teal-200', text: 'text-teal-700', icon: 'text-teal-500', gradient: 'from-teal-500 to-cyan-500' },
  'media': { bg: 'bg-gradient-to-br from-fuchsia-50 to-purple-50', border: 'border-fuchsia-200', text: 'text-fuchsia-700', icon: 'text-fuchsia-500', gradient: 'from-fuchsia-500 to-purple-500' },
  'layout': { bg: 'bg-gradient-to-br from-sky-50 to-blue-50', border: 'border-sky-200', text: 'text-sky-700', icon: 'text-sky-500', gradient: 'from-sky-500 to-blue-500' },
  'interactive': { bg: 'bg-gradient-to-br from-lime-50 to-green-50', border: 'border-lime-200', text: 'text-lime-700', icon: 'text-lime-500', gradient: 'from-lime-500 to-green-500' },
};

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

  // Default sizing fields to add to all blocks
  const DEFAULT_SIZING = {
    sectionPadding: 'standard',
    titleSize: 'large',
    descriptionSize: 'medium',
    maxWidth: 'max-w-6xl',
    itemGap: 'standard',
  };

  // When a base block type is selected, initialize content with defaults + sizing
  const handleSelectBlockType = (blockTypeId: string) => {
    const blockDef = blockTypes.find(b => b.id === blockTypeId);
    if (blockDef) {
      setSelectedBlockType(blockTypeId);
      // Merge sizing defaults with block defaults
      setBlockContent({ 
        ...DEFAULT_SIZING,
        ...blockDef.defaultContent 
      });
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

  const getCategoryColor = (category: string) => categoryColors[category] || { bg: 'bg-gradient-to-br from-stone-50 to-stone-100', border: 'border-stone-200', text: 'text-stone-700', icon: 'text-stone-500', gradient: 'from-stone-500 to-stone-600' };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
      <AdminSidebar />
      
      <main className="flex-1 overflow-auto">
        {/* Vibrant Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white shadow-lg">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/block-store')} className="text-white/80 hover:text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Block Store
                </Button>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Wand2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Block Creator</h1>
                    <p className="text-sm text-white/80">Design your custom reusable block</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {selectedBlockType && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-3 py-1.5 bg-white/20 rounded-full text-sm font-medium"
                  >
                    ✨ {blockTypes.find(b => b.id === selectedBlockType)?.name}
                  </motion.div>
                )}
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving || !blockName || !selectedBlockType}
                  className="bg-white text-purple-600 hover:bg-white/90 shadow-lg"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save to Block Store'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Panel - Block Type Selection */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <Card className="border-2 border-purple-100 shadow-lg overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-fuchsia-50">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-lg text-white">
                    <Layers className="w-4 h-4" />
                  </div>
                  Choose Base Block
                </CardTitle>
                <CardDescription>Select a starting template</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[55vh]">
                  <div className="p-3 space-y-4">
                    {Object.entries(blocksByCategory).map(([category, categoryBlocks]) => {
                      const colors = getCategoryColor(category);
                      return (
                        <div key={category}>
                          <div className={`flex items-center gap-2 mb-2 px-2 py-1 rounded-lg ${colors.bg}`}>
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colors.gradient}`} />
                            <h4 className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                              {category.replace('je-', 'JE ').replace('-', ' ')}
                            </h4>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-white/60 ${colors.text}`}>
                              {categoryBlocks.length}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {categoryBlocks.map((block) => {
                              const Icon = block.icon;
                              const isSelected = selectedBlockType === block.id;
                              return (
                                <motion.button
                                  key={block.id}
                                  onClick={() => handleSelectBlockType(block.id)}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className={`flex items-center gap-2 w-full p-2.5 rounded-lg border-2 transition-all text-left ${
                                    isSelected 
                                      ? `${colors.bg} ${colors.border} ${colors.text} shadow-md` 
                                      : 'border-transparent hover:border-purple-100 hover:bg-purple-50/50'
                                  }`}
                                >
                                  <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? colors.icon : 'text-stone-400'}`} />
                                  <span className="text-xs font-medium truncate">{block.name}</span>
                                  {isSelected && <Sparkles className="w-3 h-3 ml-auto text-purple-500" />}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>

          {/* Center - Preview & Content Editor */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-6"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 bg-gradient-to-r from-purple-100 to-fuchsia-100 p-1">
                <TabsTrigger value="design" className="data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-md">
                  <Eye className="w-4 h-4 mr-2" />
                  Design & Preview
                </TabsTrigger>
                <TabsTrigger value="content" className="data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-md">
                  <Palette className="w-4 h-4 mr-2" />
                  Edit Content
                </TabsTrigger>
              </TabsList>

              <TabsContent value="design">
                <Card className="border-2 border-fuchsia-100 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-fuchsia-50 to-pink-50">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="p-1.5 bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-lg text-white">
                        <Eye className="w-4 h-4" />
                      </div>
                      Live Preview
                    </CardTitle>
                    <CardDescription>See your block as it will appear</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    {selectedBlockType ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-2 border-purple-100 rounded-xl overflow-hidden bg-white shadow-inner"
                      >
                        <BlockRenderer block={previewBlock} isPreviewMode={true} />
                      </motion.div>
                    ) : (
                      <div className="border-2 border-dashed border-purple-200 rounded-xl p-12 text-center bg-gradient-to-br from-purple-50/50 to-fuchsia-50/50">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-fuchsia-100 flex items-center justify-center">
                          <Layers className="w-8 h-8 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-purple-900 mb-2">Select a Base Block</h3>
                        <p className="text-purple-600/70">Choose a block type from the left panel to start customizing</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content">
                <Card className="border-2 border-blue-100 shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg text-white">
                        <Palette className="w-4 h-4" />
                      </div>
                      Edit Block Content
                    </CardTitle>
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
          </motion.div>

          {/* Right Panel - Block Metadata */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <Card className="sticky top-24 border-2 border-amber-100 shadow-lg overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-amber-50 to-orange-50">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg text-white">
                    <Box className="w-4 h-4" />
                  </div>
                  Block Details
                </CardTitle>
                <CardDescription>Name and categorize your block</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-amber-800 font-medium">Block Name *</Label>
                  <Input
                    value={blockName}
                    onChange={(e) => setBlockName(e.target.value)}
                    placeholder="My Custom Block"
                    className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-amber-800 font-medium">Description</Label>
                  <Textarea
                    value={blockDescription}
                    onChange={(e) => setBlockDescription(e.target.value)}
                    placeholder="What this block is for..."
                    rows={2}
                    className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-amber-800 font-medium">Category</Label>
                  <Select value={blockCategory} onValueChange={setBlockCategory}>
                    <SelectTrigger className="border-amber-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-amber-800 font-medium">Icon</Label>
                  <Select value={blockIcon} onValueChange={setBlockIcon}>
                    <SelectTrigger className="border-amber-200"><SelectValue /></SelectTrigger>
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
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-4 border-t border-amber-200"
                  >
                    <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <p className="text-xs text-amber-800">
                        Base: <span className="font-semibold">{blockTypes.find(b => b.id === selectedBlockType)?.name}</span>
                      </p>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
        </div>
      </main>
    </div>
  );
}
