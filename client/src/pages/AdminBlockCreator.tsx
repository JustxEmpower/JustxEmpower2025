/**
 * Block Creator - Create custom reusable blocks for the Block Store
 * Full editing capabilities with live preview
 */

import { useState, useEffect, Suspense, lazy } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Lazy load RichTextEditor for text content fields
const RichTextEditor = lazy(() => import('@/components/page-builder/RichTextEditor'));
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Save, Eye, Plus, Trash2, GripVertical, Layers, 
  Box, Sparkles, Type, Image, Layout, List, Grid, 
  Heart, Star, Zap, FileText, MessageSquare, Users, Wand2, Palette,
  Link, AlignLeft, AlignCenter, AlignRight, ImageIcon, Video,
  ChevronDown, ChevronUp, Copy, RotateCcw, Paintbrush, Settings2,
  MousePointer, Edit3
} from 'lucide-react';
import { usePageBuilderStore } from '@/components/page-builder/usePageBuilderStore';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { blockTypes } from '@/components/page-builder/blockTypes';
import { BlockRenderer } from '@/components/page-builder/BlockRenderer';
import AdminSidebar from '@/components/AdminSidebar';
import { CompactMarginRuler } from '@/components/page-builder/MarginRuler';
import { Ruler } from 'lucide-react';

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
  const [isElementEditMode, setIsElementEditMode] = useState(false);
  
  // Get setInPageBuilder from store to mark we're in editor context
  const setInPageBuilder = usePageBuilderStore((state) => state.setInPageBuilder);
  
  // Mark that we're in Page Builder/Block Creator context on mount
  useEffect(() => {
    setInPageBuilder(true);
    return () => setInPageBuilder(false);
  }, [setInPageBuilder]);
  
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
                  <CardHeader className="bg-gradient-to-r from-fuchsia-50 to-pink-50 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-lg text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                        Live Preview
                      </CardTitle>
                      <CardDescription>See your block as it will appear</CardDescription>
                    </div>
                    {selectedBlockType && (
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
                    )}
                  </CardHeader>
                  <CardContent className="p-4">
                    {selectedBlockType ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-2 border-purple-100 rounded-xl overflow-hidden bg-white shadow-inner"
                      >
                        <BlockRenderer 
                          block={previewBlock} 
                          isPreviewMode={false} 
                          isEditing={true}
                          isElementEditMode={isElementEditMode}
                          onUpdate={(content) => setBlockContent(content)}
                        />
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
                        <Settings2 className="w-4 h-4" />
                      </div>
                      Edit Block Content
                    </CardTitle>
                    <CardDescription>Customize all text, images, and settings</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    {selectedBlockType ? (
                      <ScrollArea className="h-[60vh]">
                        <div className="space-y-3 pr-4">
                          {/* Text Content Section */}
                          {(() => {
                            const excludePatterns = [
                              'image', 'Image', 'url', 'Url', 'video', 'Video',
                              'color', 'Color', 'background', 'Background', 'gradient', 'Gradient',
                              'align', 'Align', 'width', 'Width', 'height', 'Height',
                              'padding', 'Padding', 'margin', 'Margin', 'radius', 'Radius',
                              'size', 'Size', 'gap', 'Gap', 'spacing', 'Spacing',
                              'font', 'Font', 'lineHeight', 'LineHeight', 'letterSpacing', 'LetterSpacing',
                              'weight', 'Weight', 'style', 'Style', 'columns', 'Columns', 'position', 'Position'
                            ];
                            const textFields = Object.entries(blockContent).filter(([key, value]) => {
                              if (typeof value !== 'string') return false;
                              return !excludePatterns.some(p => key.includes(p));
                            });
                            if (textFields.length === 0) return null;
                            return (
                              <Collapsible defaultOpen className="border border-purple-200 rounded-lg overflow-hidden">
                                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <Type className="w-4 h-4 text-purple-600" />
                                    <span className="font-semibold text-purple-900">Text Content</span>
                                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                                      {textFields.length}
                                    </Badge>
                                  </div>
                                  <ChevronDown className="w-4 h-4 text-purple-600" />
                                </CollapsibleTrigger>
                                <CollapsibleContent className="p-3 space-y-3 bg-white">
                                  {textFields.map(([key, value]) => {
                                    const isLongText = key.includes('description') || key.includes('content') || 
                                                       key.includes('text') || key.includes('subtitle') || 
                                                       (value as string).length > 60;
                                    return (
                                      <div key={key} className="space-y-1.5">
                                        <Label className="text-sm font-medium text-purple-800 capitalize flex items-center gap-2">
                                          {key.replace(/([A-Z])/g, ' $1')}
                                          {key.includes('title') && !key.includes('Size') && <Badge variant="outline" className="text-xs">Primary</Badge>}
                                        </Label>
                                        {/* Use RichTextEditor for all text fields to enable font/size styling */}
                                        <Suspense fallback={<div className="p-2 text-sm text-muted-foreground border rounded-md">Loading editor...</div>}>
                                          <RichTextEditor
                                            value={value as string}
                                            onChange={(content) => updateContent(key, content)}
                                            placeholder={`Enter ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}...`}
                                            height={isLongText ? 120 : 80}
                                          />
                                        </Suspense>
                                      </div>
                                    );
                                  })}
                                </CollapsibleContent>
                              </Collapsible>
                            );
                          })()}

                          {/* Media & Images Section */}
                          <Collapsible defaultOpen className="border border-green-200 rounded-lg overflow-hidden">
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-colors">
                              <div className="flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-green-600" />
                                <span className="font-semibold text-green-900">Media & Images</span>
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                  {Object.keys(blockContent).filter(k => 
                                    (k.includes('image') || k.includes('Image') || 
                                     k.includes('video') || k.includes('Video') ||
                                     (k.includes('url') || k.includes('Url')) && 
                                     typeof blockContent[k] === 'string')
                                  ).length}
                                </Badge>
                              </div>
                              <ChevronDown className="w-4 h-4 text-green-600" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="p-3 space-y-3 bg-white">
                              {Object.entries(blockContent).map(([key, value]) => {
                                if (typeof value !== 'string') return null;
                                if (!key.includes('image') && !key.includes('Image') && 
                                    !key.includes('video') && !key.includes('Video') &&
                                    !(key.includes('url') || key.includes('Url'))) return null;
                                if (key.includes('color') || key.includes('Color')) return null;
                                
                                return (
                                  <div key={key} className="space-y-1.5">
                                    <Label className="text-sm font-medium text-green-800 capitalize flex items-center gap-2">
                                      {key.includes('video') || key.includes('Video') ? (
                                        <Video className="w-3 h-3" />
                                      ) : (
                                        <ImageIcon className="w-3 h-3" />
                                      )}
                                      {key.replace(/([A-Z])/g, ' $1')}
                                    </Label>
                                    <div className="flex gap-2">
                                      <Input
                                        value={value}
                                        onChange={(e) => updateContent(key, e.target.value)}
                                        className="border-green-200 focus:border-green-400 focus:ring-green-400"
                                        placeholder="Enter URL or path..."
                                      />
                                      {value && (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="w-10 h-10 rounded border border-green-200 overflow-hidden flex-shrink-0">
                                                <img src={value} alt="" className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent>Preview</TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              {Object.keys(blockContent).filter(k => 
                                k.includes('image') || k.includes('Image') || 
                                k.includes('video') || k.includes('Video')
                              ).length === 0 && (
                                <p className="text-sm text-green-600/70 text-center py-2">No media fields for this block</p>
                              )}
                            </CollapsibleContent>
                          </Collapsible>

                          {/* Colors & Styling Section */}
                          <Collapsible defaultOpen className="border border-fuchsia-200 rounded-lg overflow-hidden">
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-fuchsia-50 to-pink-50 hover:from-fuchsia-100 hover:to-pink-100 transition-colors">
                              <div className="flex items-center gap-2">
                                <Paintbrush className="w-4 h-4 text-fuchsia-600" />
                                <span className="font-semibold text-fuchsia-900">Colors & Styling</span>
                              </div>
                              <ChevronDown className="w-4 h-4 text-fuchsia-600" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="p-3 space-y-3 bg-white">
                              {Object.entries(blockContent).map(([key, value]) => {
                                if (typeof value !== 'string') return null;
                                if (!key.includes('color') && !key.includes('Color') && 
                                    !key.includes('background') && !key.includes('Background') &&
                                    !key.includes('gradient') && !key.includes('Gradient')) return null;
                                
                                return (
                                  <div key={key} className="space-y-1.5">
                                    <Label className="text-sm font-medium text-fuchsia-800 capitalize">
                                      {key.replace(/([A-Z])/g, ' $1')}
                                    </Label>
                                    <div className="flex gap-2 items-center">
                                      <input
                                        type="color"
                                        value={value.startsWith('#') ? value : '#7c3aed'}
                                        onChange={(e) => updateContent(key, e.target.value)}
                                        className="w-10 h-10 rounded border border-fuchsia-200 cursor-pointer"
                                      />
                                      <Input
                                        value={value}
                                        onChange={(e) => updateContent(key, e.target.value)}
                                        className="border-fuchsia-200 focus:border-fuchsia-400 focus:ring-fuchsia-400 font-mono text-sm"
                                        placeholder="#hex or color name"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                              {Object.keys(blockContent).filter(k => 
                                k.includes('color') || k.includes('Color') || 
                                k.includes('background') || k.includes('Background')
                              ).length === 0 && (
                                <p className="text-sm text-fuchsia-600/70 text-center py-2">No color fields for this block</p>
                              )}
                            </CollapsibleContent>
                          </Collapsible>

                          {/* Layout & Sizing Section */}
                          {(() => {
                            const layoutFields = Object.entries(blockContent).filter(([key, value]) => {
                              if (typeof value !== 'string') return false;
                              const layoutPatterns = [
                                'align', 'Align', 'width', 'Width', 'height', 'Height',
                                'padding', 'Padding', 'margin', 'Margin', 'radius', 'Radius',
                                'size', 'Size', 'gap', 'Gap', 'spacing', 'Spacing',
                                'columns', 'Columns', 'position', 'Position'
                              ];
                              return layoutPatterns.some(p => key.includes(p));
                            });
                            if (layoutFields.length === 0) return null;
                            return (
                              <Collapsible defaultOpen className="border border-blue-200 rounded-lg overflow-hidden">
                                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <Layout className="w-4 h-4 text-blue-600" />
                                    <span className="font-semibold text-blue-900">Layout & Sizing</span>
                                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                      {layoutFields.length}
                                    </Badge>
                                  </div>
                                  <ChevronDown className="w-4 h-4 text-blue-600" />
                                </CollapsibleTrigger>
                                <CollapsibleContent className="p-3 space-y-3 bg-white">
                                  {/* Microsoft Word-style Margin Ruler */}
                                  <div className="space-y-2 pb-3 border-b border-blue-100">
                                    <div className="flex items-center gap-2">
                                      <Ruler className="w-4 h-4 text-blue-500" />
                                      <Label className="text-sm font-medium text-blue-800">Content Width Ruler</Label>
                                    </div>
                                    <p className="text-xs text-blue-600/70">Drag handles to adjust content margins</p>
                                    <CompactMarginRuler
                                      leftMargin={parseFloat(blockContent.marginLeft as string || '5') || 5}
                                      rightMargin={parseFloat(blockContent.marginRight as string || '5') || 5}
                                      onLeftMarginChange={(percent) => {
                                        updateContent('marginLeft', `${percent}%`);
                                        updateContent('textWidthPreset', 'custom');
                                      }}
                                      onRightMarginChange={(percent) => {
                                        updateContent('marginRight', `${percent}%`);
                                        updateContent('textWidthPreset', 'custom');
                                      }}
                                    />
                                  </div>
                                  {layoutFields.map(([key, value]) => {
                                    const isAlignment = key.toLowerCase().includes('align');
                                    const isMaxWidth = key.toLowerCase().includes('maxwidth') || key.toLowerCase().includes('contentmaxwidth');
                                    
                                    if (isAlignment) {
                                      return (
                                        <div key={key} className="space-y-1.5">
                                          <Label className="text-sm font-medium text-blue-800 capitalize">
                                            {key.replace(/([A-Z])/g, ' $1')}
                                          </Label>
                                          <div className="flex gap-1">
                                            {['left', 'center', 'right'].map((align) => (
                                              <Button
                                                key={align}
                                                variant={value === align ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => updateContent(key, align)}
                                                className="flex-1"
                                              >
                                                {align === 'left' && <AlignLeft className="w-4 h-4" />}
                                                {align === 'center' && <AlignCenter className="w-4 h-4" />}
                                                {align === 'right' && <AlignRight className="w-4 h-4" />}
                                              </Button>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    }
                                    
                                    if (isMaxWidth) {
                                      return (
                                        <div key={key} className="space-y-1.5">
                                          <Label className="text-sm font-medium text-blue-800 capitalize">
                                            {key.replace(/([A-Z])/g, ' $1')}
                                          </Label>
                                          <Select value={value as string} onValueChange={(v) => updateContent(key, v)}>
                                            <SelectTrigger className="border-blue-200"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="sm">Small (sm)</SelectItem>
                                              <SelectItem value="md">Medium (md)</SelectItem>
                                              <SelectItem value="lg">Large (lg)</SelectItem>
                                              <SelectItem value="xl">XL</SelectItem>
                                              <SelectItem value="2xl">2XL</SelectItem>
                                              <SelectItem value="3xl">3XL</SelectItem>
                                              <SelectItem value="4xl">4XL</SelectItem>
                                              <SelectItem value="5xl">5XL</SelectItem>
                                              <SelectItem value="6xl">6XL</SelectItem>
                                              <SelectItem value="7xl">7XL</SelectItem>
                                              <SelectItem value="full">Full</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div key={key} className="space-y-1.5">
                                        <Label className="text-sm font-medium text-blue-800 capitalize flex items-center gap-2">
                                          {key.replace(/([A-Z])/g, ' $1')}
                                          <span className="text-xs text-blue-500 font-mono">{value as string}</span>
                                        </Label>
                                        <Input
                                          value={value as string}
                                          onChange={(e) => updateContent(key, e.target.value)}
                                          className="border-blue-200 focus:border-blue-400 font-mono text-sm"
                                          placeholder="e.g. 1rem, 16px, 100vh"
                                        />
                                      </div>
                                    );
                                  })}
                                  {/* Numeric columns */}
                                  {typeof blockContent.columns === 'number' && (
                                    <div className="space-y-1.5">
                                      <Label className="text-sm font-medium text-blue-800">Columns: {blockContent.columns}</Label>
                                      <Slider
                                        value={[blockContent.columns]}
                                        onValueChange={([v]) => updateContent('columns', v)}
                                        min={1}
                                        max={6}
                                        step={1}
                                        className="py-2"
                                      />
                                    </div>
                                  )}
                                </CollapsibleContent>
                              </Collapsible>
                            );
                          })()}

                          {/* Typography Section */}
                          {(() => {
                            const typographyFields = Object.entries(blockContent).filter(([key, value]) => {
                              if (typeof value !== 'string') return false;
                              const typoPatterns = [
                                'font', 'Font', 'lineHeight', 'LineHeight', 'letterSpacing', 'LetterSpacing',
                                'weight', 'Weight', 'style', 'Style'
                              ];
                              const excludePatterns = ['color', 'Color', 'image', 'Image', 'url', 'Url'];
                              return typoPatterns.some(p => key.includes(p)) && 
                                     !excludePatterns.some(p => key.includes(p));
                            });
                            if (typographyFields.length === 0) return null;
                            return (
                              <Collapsible defaultOpen className="border border-violet-200 rounded-lg overflow-hidden">
                                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <Type className="w-4 h-4 text-violet-600" />
                                    <span className="font-semibold text-violet-900">Typography</span>
                                    <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700">
                                      {typographyFields.length}
                                    </Badge>
                                  </div>
                                  <ChevronDown className="w-4 h-4 text-violet-600" />
                                </CollapsibleTrigger>
                                <CollapsibleContent className="p-3 space-y-3 bg-white">
                                  {typographyFields.map(([key, value]) => (
                                    <div key={key} className="space-y-1.5">
                                      <Label className="text-sm font-medium text-violet-800 capitalize flex items-center gap-2">
                                        {key.replace(/([A-Z])/g, ' $1')}
                                        <span className="text-xs text-violet-500 font-mono">{value as string}</span>
                                      </Label>
                                      <Input
                                        value={value as string}
                                        onChange={(e) => updateContent(key, e.target.value)}
                                        className="border-violet-200 focus:border-violet-400 font-mono text-sm"
                                        placeholder="e.g. 1.5rem, bold, italic"
                                      />
                                    </div>
                                  ))}
                                </CollapsibleContent>
                              </Collapsible>
                            );
                          })()}

                          {/* Toggle Options Section */}
                          <Collapsible defaultOpen className="border border-amber-200 rounded-lg overflow-hidden">
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-colors">
                              <div className="flex items-center gap-2">
                                <Settings2 className="w-4 h-4 text-amber-600" />
                                <span className="font-semibold text-amber-900">Toggle Options</span>
                                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                                  {Object.keys(blockContent).filter(k => typeof blockContent[k] === 'boolean').length}
                                </Badge>
                              </div>
                              <ChevronDown className="w-4 h-4 text-amber-600" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="p-3 space-y-2 bg-white">
                              {Object.entries(blockContent).map(([key, value]) => {
                                if (typeof value !== 'boolean') return null;
                                return (
                                  <div key={key} className="flex items-center justify-between p-2 rounded-lg hover:bg-amber-50 transition-colors">
                                    <Label className="text-sm font-medium text-amber-800 capitalize cursor-pointer">
                                      {key.replace(/([A-Z])/g, ' $1')}
                                    </Label>
                                    <Switch
                                      checked={value}
                                      onCheckedChange={(checked) => updateContent(key, checked)}
                                      className="data-[state=checked]:bg-amber-500"
                                    />
                                  </div>
                                );
                              })}
                              {Object.keys(blockContent).filter(k => typeof blockContent[k] === 'boolean').length === 0 && (
                                <p className="text-sm text-amber-600/70 text-center py-2">No toggle options for this block</p>
                              )}
                            </CollapsibleContent>
                          </Collapsible>

                          {/* Number Values Section */}
                          {Object.keys(blockContent).filter(k => 
                            typeof blockContent[k] === 'number' && 
                            k !== 'columns'
                          ).length > 0 && (
                            <Collapsible defaultOpen className="border border-indigo-200 rounded-lg overflow-hidden">
                              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 transition-colors">
                                <div className="flex items-center gap-2">
                                  <Zap className="w-4 h-4 text-indigo-600" />
                                  <span className="font-semibold text-indigo-900">Number Values</span>
                                </div>
                                <ChevronDown className="w-4 h-4 text-indigo-600" />
                              </CollapsibleTrigger>
                              <CollapsibleContent className="p-3 space-y-3 bg-white">
                                {Object.entries(blockContent).map(([key, value]) => {
                                  if (typeof value !== 'number' || key === 'columns') return null;
                                  const isPercentage = key.includes('opacity') || key.includes('Opacity') || key.includes('percent');
                                  const isSpeed = key.includes('speed') || key.includes('Speed') || key.includes('duration') || key.includes('Duration') || key.includes('interval');
                                  return (
                                    <div key={key} className="space-y-1.5">
                                      <Label className="text-sm font-medium text-indigo-800 capitalize flex items-center justify-between">
                                        {key.replace(/([A-Z])/g, ' $1')}
                                        <span className="font-mono text-indigo-600">
                                          {value}{isPercentage ? '%' : isSpeed ? 'ms' : ''}
                                        </span>
                                      </Label>
                                      {isPercentage ? (
                                        <Slider
                                          value={[value]}
                                          onValueChange={([v]) => updateContent(key, v)}
                                          min={0}
                                          max={100}
                                          step={5}
                                          className="py-2"
                                        />
                                      ) : isSpeed ? (
                                        <Slider
                                          value={[value]}
                                          onValueChange={([v]) => updateContent(key, v)}
                                          min={100}
                                          max={10000}
                                          step={100}
                                          className="py-2"
                                        />
                                      ) : (
                                        <Input
                                          type="number"
                                          value={value}
                                          onChange={(e) => updateContent(key, Number(e.target.value))}
                                          className="border-indigo-200 focus:border-indigo-400"
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </CollapsibleContent>
                            </Collapsible>
                          )}

                          {/* Array Items Section */}
                          {Object.entries(blockContent).map(([key, value]) => {
                            if (!Array.isArray(value)) return null;
                            return (
                              <Collapsible key={key} defaultOpen className="border border-rose-200 rounded-lg overflow-hidden">
                                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <List className="w-4 h-4 text-rose-600" />
                                    <span className="font-semibold text-rose-900 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                    <Badge variant="secondary" className="text-xs bg-rose-100 text-rose-700">
                                      {value.length} items
                                    </Badge>
                                  </div>
                                  <ChevronDown className="w-4 h-4 text-rose-600" />
                                </CollapsibleTrigger>
                                <CollapsibleContent className="p-3 space-y-3 bg-white">
                                  {value.map((item: any, index: number) => (
                                    <motion.div 
                                      key={index} 
                                      initial={{ opacity: 0, y: -10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="border border-rose-100 rounded-lg p-3 space-y-2 bg-rose-50/30"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-rose-700 flex items-center gap-2">
                                          <span className="w-5 h-5 rounded-full bg-rose-200 flex items-center justify-center text-rose-700">
                                            {index + 1}
                                          </span>
                                          Item {index + 1}
                                        </span>
                                        <div className="flex gap-1">
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button 
                                                  variant="ghost" 
                                                  size="sm"
                                                  onClick={() => {
                                                    const newItem = { ...item };
                                                    addArrayItem(key, newItem);
                                                  }}
                                                  className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-100"
                                                >
                                                  <Copy className="w-3 h-3" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>Duplicate</TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button 
                                                  variant="ghost" 
                                                  size="sm"
                                                  onClick={() => removeArrayItem(key, index)}
                                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>Remove</TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </div>
                                      </div>
                                      {Object.entries(item).map(([itemKey, itemValue]) => (
                                        <div key={itemKey} className="space-y-1">
                                          <Label className="text-xs text-rose-700 capitalize font-medium">
                                            {itemKey.replace(/([A-Z])/g, ' $1')}
                                          </Label>
                                          {typeof itemValue === 'boolean' ? (
                                            <Switch
                                              checked={itemValue as boolean}
                                              onCheckedChange={(checked) => updateArrayItem(key, index, itemKey, checked)}
                                              className="data-[state=checked]:bg-rose-500"
                                            />
                                          ) : typeof itemValue === 'string' && (itemValue.length > 50 || itemKey.includes('description') || itemKey.includes('content')) ? (
                                            <Textarea
                                              value={itemValue as string}
                                              onChange={(e) => updateArrayItem(key, index, itemKey, e.target.value)}
                                              rows={2}
                                              className="text-sm border-rose-200 focus:border-rose-400"
                                            />
                                          ) : itemKey.includes('color') || itemKey.includes('Color') ? (
                                            <div className="flex gap-2 items-center">
                                              <input
                                                type="color"
                                                value={(itemValue as string)?.startsWith('#') ? itemValue as string : '#7c3aed'}
                                                onChange={(e) => updateArrayItem(key, index, itemKey, e.target.value)}
                                                className="w-8 h-8 rounded border cursor-pointer"
                                              />
                                              <Input
                                                value={String(itemValue || '')}
                                                onChange={(e) => updateArrayItem(key, index, itemKey, e.target.value)}
                                                className="text-sm border-rose-200 font-mono"
                                              />
                                            </div>
                                          ) : (
                                            <Input
                                              value={String(itemValue || '')}
                                              onChange={(e) => updateArrayItem(key, index, itemKey, e.target.value)}
                                              className="text-sm border-rose-200 focus:border-rose-400"
                                            />
                                          )}
                                        </div>
                                      ))}
                                    </motion.div>
                                  ))}
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => addArrayItem(key, value[0] ? { ...value[0] } : {})}
                                    className="w-full border-rose-300 text-rose-600 hover:bg-rose-100"
                                  >
                                    <Plus className="w-3 h-3 mr-1" /> Add {key.replace(/([A-Z])/g, ' $1').replace(/s$/, '')}
                                  </Button>
                                </CollapsibleContent>
                              </Collapsible>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-12 text-blue-600/70">
                        <Settings2 className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">No Block Selected</h3>
                        <p>Select a block type to start editing its content.</p>
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
