import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Palette, Code, X, Trash2, Copy, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePageBuilderStore } from '../usePageBuilderStore';
import { getBlockById } from '../blockTypes';

// Generic field renderer based on content type
function renderField(
  key: string,
  value: unknown,
  onChange: (key: string, value: unknown) => void,
  blockType: string
): React.ReactNode {
  const label = key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());

  // Boolean fields
  if (typeof value === 'boolean') {
    return (
      <div key={key} className="flex items-center justify-between py-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {label}
        </Label>
        <Switch
          id={key}
          checked={value}
          onCheckedChange={(checked) => onChange(key, checked)}
        />
      </div>
    );
  }

  // Number fields
  if (typeof value === 'number') {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {label}
        </Label>
        <Input
          id={key}
          type="number"
          value={value}
          onChange={(e) => onChange(key, Number(e.target.value))}
          className="bg-neutral-50 dark:bg-neutral-800"
        />
      </div>
    );
  }

  // Select fields for specific keys
  if (key === 'variant') {
    const variants = getVariantsForBlock(blockType);
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {label}
        </Label>
        <Select value={value as string} onValueChange={(v) => onChange(key, v)}>
          <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {variants.map((v) => (
              <SelectItem key={v} value={v}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (key === 'alignment') {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {label}
        </Label>
        <Select value={value as string} onValueChange={(v) => onChange(key, v)}>
          <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (key === 'columns') {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {label}
        </Label>
        <Select value={String(value)} onValueChange={(v) => onChange(key, Number(v))}>
          <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2, 3, 4, 5, 6].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} Columns
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (key === 'level') {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          Heading Level
        </Label>
        <Select value={value as string} onValueChange={(v) => onChange(key, v)}>
          <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((h) => (
              <SelectItem key={h} value={h}>
                {h.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Long text fields
  if (
    key === 'content' ||
    key === 'description' ||
    key === 'bio' ||
    key === 'quote' ||
    key === 'html' ||
    key === 'code' ||
    key === 'embedCode'
  ) {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {label}
        </Label>
        <Textarea
          id={key}
          value={value as string}
          onChange={(e) => onChange(key, e.target.value)}
          rows={4}
          className="bg-neutral-50 dark:bg-neutral-800 font-mono text-sm"
        />
      </div>
    );
  }

  // URL fields
  if (
    key.toLowerCase().includes('url') ||
    key.toLowerCase().includes('link') ||
    key.toLowerCase().includes('src') ||
    key.toLowerCase().includes('image')
  ) {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {label}
        </Label>
        <Input
          id={key}
          type="url"
          value={value as string}
          onChange={(e) => onChange(key, e.target.value)}
          placeholder="https://..."
          className="bg-neutral-50 dark:bg-neutral-800"
        />
      </div>
    );
  }

  // Default string fields
  if (typeof value === 'string') {
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {label}
        </Label>
        <Input
          id={key}
          value={value}
          onChange={(e) => onChange(key, e.target.value)}
          className="bg-neutral-50 dark:bg-neutral-800"
        />
      </div>
    );
  }

  // Skip complex objects/arrays for now (would need custom editors)
  return null;
}

function getVariantsForBlock(blockType: string): string[] {
  const variantMap: Record<string, string[]> = {
    hero: ['centered', 'left-aligned', 'split', 'video-background'],
    testimonials: ['carousel', 'grid', 'single'],
    team: ['card', 'simple', 'overlay'],
    timeline: ['vertical', 'horizontal', 'alternating'],
    cta: ['centered', 'split', 'minimal'],
    quote: ['default', 'large', 'bordered', 'modern'],
    stats: ['default', 'card', 'minimal'],
    button: ['primary', 'secondary', 'outline', 'ghost'],
    alert: ['info', 'success', 'warning', 'error'],
  };
  return variantMap[blockType] || ['default'];
}

export default function BlockSettings() {
  const {
    blocks,
    selectedBlockId,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    moveBlock,
    selectBlock,
  } = usePageBuilderStore();

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
  const blockType = selectedBlock ? getBlockById(selectedBlock.type) : null;
  const blockIndex = selectedBlock ? blocks.findIndex((b) => b.id === selectedBlockId) : -1;

  const handleContentChange = (key: string, value: unknown) => {
    if (selectedBlockId) {
      updateBlock(selectedBlockId, { [key]: value });
    }
  };

  if (!selectedBlock || !blockType) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
          <Settings className="w-8 h-8 text-neutral-400" />
        </div>
        <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
          No Block Selected
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Select a block on the canvas to edit its settings
        </p>
      </div>
    );
  }

  const Icon = blockType.icon;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
              {blockType.name}
            </h3>
            <p className="text-xs text-neutral-500 truncate">{blockType.description}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => selectBlock(null)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => selectedBlockId && duplicateBlock(selectedBlockId)}
          >
            <Copy className="w-4 h-4 mr-1" />
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={blockIndex === 0}
            onClick={() => moveBlock(blockIndex, blockIndex - 1)}
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={blockIndex === blocks.length - 1}
            onClick={() => moveBlock(blockIndex, blockIndex + 1)}
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (selectedBlockId) {
                deleteBlock(selectedBlockId);
                selectBlock(null);
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Settings tabs */}
      <Tabs defaultValue="content" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="content" className="flex-1">
            <Settings className="w-4 h-4 mr-1" />
            Content
          </TabsTrigger>
          <TabsTrigger value="style" className="flex-1">
            <Palette className="w-4 h-4 mr-1" />
            Style
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex-1">
            <Code className="w-4 h-4 mr-1" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="content" className="p-4 space-y-4 mt-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedBlockId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {Object.entries(selectedBlock.content).map(([key, value]) => {
                  // Skip complex nested objects for now
                  if (typeof value === 'object' && value !== null) {
                    return null;
                  }
                  return renderField(key, value, handleContentChange, selectedBlock.type);
                })}
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="style" className="p-4 space-y-4 mt-0">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="w-12 h-10 p-1 cursor-pointer"
                    value={selectedBlock.content.backgroundColor as string || '#ffffff'}
                    onChange={(e) => handleContentChange('backgroundColor', e.target.value)}
                  />
                  <Input
                    value={selectedBlock.content.backgroundColor as string || ''}
                    onChange={(e) => handleContentChange('backgroundColor', e.target.value)}
                    placeholder="#ffffff or transparent"
                    className="flex-1 bg-neutral-50 dark:bg-neutral-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="w-12 h-10 p-1 cursor-pointer"
                    value={selectedBlock.content.textColor as string || '#000000'}
                    onChange={(e) => handleContentChange('textColor', e.target.value)}
                  />
                  <Input
                    value={selectedBlock.content.textColor as string || ''}
                    onChange={(e) => handleContentChange('textColor', e.target.value)}
                    placeholder="#000000"
                    className="flex-1 bg-neutral-50 dark:bg-neutral-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Padding</Label>
                <Select
                  value={selectedBlock.content.padding as string || 'medium'}
                  onValueChange={(v) => handleContentChange('padding', v)}
                >
                  <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="xlarge">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Border Radius</Label>
                <Select
                  value={selectedBlock.content.borderRadius as string || 'none'}
                  onValueChange={(v) => handleContentChange('borderRadius', v)}
                >
                  <SelectTrigger className="bg-neutral-50 dark:bg-neutral-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="full">Full</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="p-4 space-y-4 mt-0">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">CSS Class</Label>
                <Input
                  value={selectedBlock.content.customClass as string || ''}
                  onChange={(e) => handleContentChange('customClass', e.target.value)}
                  placeholder="my-custom-class"
                  className="bg-neutral-50 dark:bg-neutral-800 font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">CSS ID</Label>
                <Input
                  value={selectedBlock.content.customId as string || ''}
                  onChange={(e) => handleContentChange('customId', e.target.value)}
                  placeholder="my-section"
                  className="bg-neutral-50 dark:bg-neutral-800 font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Custom CSS</Label>
                <Textarea
                  value={selectedBlock.content.customCss as string || ''}
                  onChange={(e) => handleContentChange('customCss', e.target.value)}
                  placeholder=".my-class { color: red; }"
                  rows={4}
                  className="bg-neutral-50 dark:bg-neutral-800 font-mono text-sm"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <Label className="text-sm font-medium">Hide on Mobile</Label>
                <Switch
                  checked={selectedBlock.content.hideOnMobile as boolean || false}
                  onCheckedChange={(checked) => handleContentChange('hideOnMobile', checked)}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <Label className="text-sm font-medium">Hide on Desktop</Label>
                <Switch
                  checked={selectedBlock.content.hideOnDesktop as boolean || false}
                  onCheckedChange={(checked) => handleContentChange('hideOnDesktop', checked)}
                />
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
