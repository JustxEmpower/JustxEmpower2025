import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LayoutTemplate, Save, Trash2, Download, Upload, Plus, 
  Layers, Type, Image, Video, Grid, Box, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageBlock } from './usePageBuilderStore';

// Template categories
const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: LayoutTemplate },
  { id: 'hero', label: 'Hero Sections', icon: Layers },
  { id: 'content', label: 'Content Blocks', icon: Type },
  { id: 'media', label: 'Media Layouts', icon: Image },
  { id: 'cta', label: 'Call to Action', icon: Box },
  { id: 'custom', label: 'My Templates', icon: Star },
] as const;

type TemplateCategory = typeof TEMPLATE_CATEGORIES[number]['id'];

// Block template interface
export interface BlockTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  blocks: Omit<PageBlock, 'id' | 'pageId'>[];
  thumbnail?: string;
  createdAt: number;
  isBuiltIn?: boolean;
}

// Built-in templates
const BUILT_IN_TEMPLATES: BlockTemplate[] = [
  {
    id: 'hero-simple',
    name: 'Simple Hero',
    description: 'Clean hero section with headline, subtext, and CTA button',
    category: 'hero',
    isBuiltIn: true,
    createdAt: Date.now(),
    blocks: [
      {
        type: 'je-hero',
        order: 0,
        content: {
          label: 'WELCOME',
          title: 'Your Headline Here',
          subtitle: 'Add a compelling subtext that describes your value proposition',
          buttonText: 'Get Started',
          buttonLink: '#',
          backgroundType: 'gradient',
        },
        settings: {},
      },
    ],
  },
  {
    id: 'hero-video',
    name: 'Video Hero',
    description: 'Full-width hero with background video',
    category: 'hero',
    isBuiltIn: true,
    createdAt: Date.now(),
    blocks: [
      {
        type: 'je-hero-video',
        order: 0,
        content: {
          title: 'Immersive Experience',
          subtitle: 'Engage your audience with stunning video backgrounds',
          videoUrl: '',
          overlayOpacity: 0.5,
        },
        settings: {},
      },
    ],
  },
  {
    id: 'three-pillars',
    name: 'Three Pillars',
    description: 'Display three key features or values with icons',
    category: 'content',
    isBuiltIn: true,
    createdAt: Date.now(),
    blocks: [
      {
        type: 'je-pillars',
        order: 0,
        content: {
          label: 'OUR FOUNDATION',
          title: 'Three Pillars',
          description: 'The core principles that guide everything we do.',
          pillar1Icon: 'heart',
          pillar1Title: 'First Pillar',
          pillar1Description: 'Description of your first key value or feature.',
          pillar2Icon: 'sparkles',
          pillar2Title: 'Second Pillar',
          pillar2Description: 'Description of your second key value or feature.',
          pillar3Icon: 'crown',
          pillar3Title: 'Third Pillar',
          pillar3Description: 'Description of your third key value or feature.',
        },
        settings: {},
      },
    ],
  },
  {
    id: 'two-column-text-image',
    name: 'Text & Image',
    description: 'Two-column layout with text on one side and image on the other',
    category: 'content',
    isBuiltIn: true,
    createdAt: Date.now(),
    blocks: [
      {
        type: 'je-two-column',
        order: 0,
        content: {
          title: 'Section Title',
          text: 'Add your content here. This layout works great for storytelling, about sections, or feature highlights.',
          imageUrl: '',
          imagePosition: 'right',
        },
        settings: {},
      },
    ],
  },
  {
    id: 'cta-simple',
    name: 'Simple CTA',
    description: 'Clean call-to-action section with headline and button',
    category: 'cta',
    isBuiltIn: true,
    createdAt: Date.now(),
    blocks: [
      {
        type: 'cta',
        order: 0,
        content: {
          title: 'Ready to Get Started?',
          subtitle: 'Join thousands of satisfied customers today.',
          buttonText: 'Start Now',
          buttonLink: '#',
          variant: 'primary',
        },
        settings: { backgroundColor: '#1a1a1a', textColor: '#ffffff' },
      },
    ],
  },
  {
    id: 'newsletter-section',
    name: 'Newsletter Signup',
    description: 'Email capture section with JE styling',
    category: 'cta',
    isBuiltIn: true,
    createdAt: Date.now(),
    blocks: [
      {
        type: 'je-newsletter',
        order: 0,
        content: {
          title: 'Stay Connected',
          subtitle: 'Subscribe to receive updates, insights, and exclusive content.',
          buttonText: 'Subscribe',
          placeholder: 'Enter your email',
        },
        settings: {},
      },
    ],
  },
  {
    id: 'faq-section',
    name: 'FAQ Section',
    description: 'Frequently asked questions with expandable answers',
    category: 'content',
    isBuiltIn: true,
    createdAt: Date.now(),
    blocks: [
      {
        type: 'je-faq',
        order: 0,
        content: {
          title: 'Frequently Asked Questions',
          items: [
            { question: 'What is your first question?', answer: 'This is the answer to the first question.' },
            { question: 'What is your second question?', answer: 'This is the answer to the second question.' },
            { question: 'What is your third question?', answer: 'This is the answer to the third question.' },
          ],
        },
        settings: {},
      },
    ],
  },
  {
    id: 'gallery-grid',
    name: 'Image Gallery',
    description: 'Grid layout for displaying multiple images',
    category: 'media',
    isBuiltIn: true,
    createdAt: Date.now(),
    blocks: [
      {
        type: 'je-gallery',
        order: 0,
        content: {
          title: 'Gallery',
          columns: 3,
          images: [],
        },
        settings: {},
      },
    ],
  },
];

// LocalStorage key for custom templates
const TEMPLATES_STORAGE_KEY = 'je-block-templates';

// Helper to get templates from localStorage
const getStoredTemplates = (): BlockTemplate[] => {
  try {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper to save templates to localStorage
const saveStoredTemplates = (templates: BlockTemplate[]) => {
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
};

interface BlockTemplatesProps {
  selectedBlocks: PageBlock[];
  onLoadTemplate: (blocks: Omit<PageBlock, 'id' | 'pageId'>[]) => void;
}

export function BlockTemplates({ selectedBlocks, onLoadTemplate }: BlockTemplatesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'save'>('browse');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('all');
  const [customTemplates, setCustomTemplates] = useState<BlockTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Save template form state
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory>('custom');

  // Load custom templates on mount
  useEffect(() => {
    setCustomTemplates(getStoredTemplates());
  }, []);

  // All templates combined
  const allTemplates = [...BUILT_IN_TEMPLATES, ...customTemplates];

  // Filtered templates
  const filteredTemplates = allTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Save current selection as template
  const handleSaveTemplate = () => {
    if (!templateName.trim() || selectedBlocks.length === 0) return;

    const newTemplate: BlockTemplate = {
      id: `custom-${Date.now()}`,
      name: templateName.trim(),
      description: templateDescription.trim(),
      category: templateCategory,
      blocks: selectedBlocks.map(({ type, order, content, settings }) => ({
        type,
        order,
        content,
        settings,
      })),
      createdAt: Date.now(),
      isBuiltIn: false,
    };

    const updatedTemplates = [...customTemplates, newTemplate];
    setCustomTemplates(updatedTemplates);
    saveStoredTemplates(updatedTemplates);

    // Reset form
    setTemplateName('');
    setTemplateDescription('');
    setTemplateCategory('custom');
    setActiveTab('browse');
  };

  // Delete custom template
  const handleDeleteTemplate = (templateId: string) => {
    const updatedTemplates = customTemplates.filter(t => t.id !== templateId);
    setCustomTemplates(updatedTemplates);
    saveStoredTemplates(updatedTemplates);
  };

  // Load template
  const handleLoadTemplate = (template: BlockTemplate) => {
    onLoadTemplate(template.blocks);
    setIsOpen(false);
  };

  // Export template as JSON
  const handleExportTemplate = (template: BlockTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportName = `${template.name.replace(/\s+/g, '-').toLowerCase()}-template.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
  };

  // Import template from JSON
  const handleImportTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const template = JSON.parse(e.target?.result as string) as BlockTemplate;
        // Assign new ID and mark as custom
        template.id = `imported-${Date.now()}`;
        template.isBuiltIn = false;
        template.createdAt = Date.now();
        
        const updatedTemplates = [...customTemplates, template];
        setCustomTemplates(updatedTemplates);
        saveStoredTemplates(updatedTemplates);
      } catch (error) {
        console.error('Failed to import template:', error);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LayoutTemplate className="h-4 w-4" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5" />
            Block Templates
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'browse' | 'save')}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="browse">Browse Templates</TabsTrigger>
              <TabsTrigger value="save" disabled={selectedBlocks.length === 0}>
                Save Template {selectedBlocks.length > 0 && `(${selectedBlocks.length} blocks)`}
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportTemplate}
                />
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <span>
                    <Upload className="h-4 w-4" />
                    Import
                  </span>
                </Button>
              </label>
            </div>
          </div>

          <TabsContent value="browse" className="mt-0">
            <div className="flex gap-4">
              {/* Category sidebar */}
              <div className="w-48 shrink-0">
                <div className="space-y-1">
                  {TEMPLATE_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                          selectedCategory === cat.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Templates grid */}
              <div className="flex-1">
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-4"
                />

                <ScrollArea className="h-[400px]">
                  <div className="grid grid-cols-2 gap-4 pr-4">
                    {filteredTemplates.map((template) => (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:border-primary transition-colors group"
                        onClick={() => handleLoadTemplate(template)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{template.name}</CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {template.blocks.length} block{template.blocks.length !== 1 ? 's' : ''}
                              </CardDescription>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExportTemplate(template);
                                }}
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                              {!template.isBuiltIn && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTemplate(template.id);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {template.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.blocks.slice(0, 3).map((block, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.5 bg-muted rounded"
                              >
                                {block.type}
                              </span>
                            ))}
                            {template.blocks.length > 3 && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded">
                                +{template.blocks.length - 3} more
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {filteredTemplates.length === 0 && (
                      <div className="col-span-2 text-center py-12 text-muted-foreground">
                        <LayoutTemplate className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No templates found</p>
                        <p className="text-sm">Try a different category or search term</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="save" className="mt-0">
            <div className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="My Custom Template"
                />
              </div>

              <div>
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Describe what this template is for..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="template-category">Category</Label>
                <Select value={templateCategory} onValueChange={(v) => setTemplateCategory(v as TemplateCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <h4 className="text-sm font-medium mb-2">Blocks to save ({selectedBlocks.length})</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedBlocks.map((block, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 bg-muted rounded"
                    >
                      {block.type}
                    </span>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
                className="w-full gap-2"
              >
                <Save className="h-4 w-4" />
                Save Template
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default BlockTemplates;
