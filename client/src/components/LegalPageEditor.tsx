import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ChevronUp, ChevronDown, Type, AlignLeft, Save } from 'lucide-react';

interface ContentBlock {
  id: string;
  type: 'heading' | 'paragraph';
  text: string;
  level?: 1 | 2 | 3;
}

interface LegalPageEditorProps {
  value: string; // JSON string of blocks
  onChange: (value: string) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export default function LegalPageEditor({ value, onChange, onSave, isSaving = false }: LegalPageEditorProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Parse initial value
  useEffect(() => {
    try {
      const parsed = JSON.parse(value || '[]');
      if (Array.isArray(parsed)) {
        const blocksWithIds = parsed.map((block, index) => ({
          ...block,
          id: block.id || `block-${Date.now()}-${index}`,
        }));
        setBlocks(blocksWithIds);
      }
    } catch (e) {
      console.error('Failed to parse blocks:', e);
      setBlocks([]);
    }
  }, []);

  // Update parent when blocks change
  const updateBlocks = (newBlocks: ContentBlock[]) => {
    setBlocks(newBlocks);
    setHasChanges(true);
    // Remove ids before saving (they're just for React keys)
    const blocksToSave = newBlocks.map(({ id, ...rest }) => rest);
    onChange(JSON.stringify(blocksToSave));
  };

  // Add a new block
  const addBlock = (type: 'heading' | 'paragraph') => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type,
      text: '',
      ...(type === 'heading' ? { level: 2 } : {}),
    };
    updateBlocks([...blocks, newBlock]);
  };

  // Remove a block
  const removeBlock = (id: string) => {
    updateBlocks(blocks.filter(block => block.id !== id));
  };

  // Update a block
  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    updateBlocks(blocks.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  // Move block up
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newBlocks = [...blocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    updateBlocks(newBlocks);
  };

  // Move block down
  const moveDown = (index: number) => {
    if (index === blocks.length - 1) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    updateBlocks(newBlocks);
  };

  const handleSave = () => {
    onSave();
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-light text-neutral-900 dark:text-neutral-100 mb-2">
          Page Content
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Build your page by adding headings and paragraphs. You can reorder and edit blocks at any time.
        </p>
      </div>

      {/* Add Block Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={() => addBlock('heading')}
          className="gap-2"
          size="lg"
        >
          <Type className="w-5 h-5" />
          Add Heading
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => addBlock('paragraph')}
          className="gap-2"
          size="lg"
        >
          <AlignLeft className="w-5 h-5" />
          Add Paragraph
        </Button>
      </div>

      {/* Block List */}
      {blocks.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900/50">
          <Type className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-2">No content blocks yet</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            Click "Add Heading" or "Add Paragraph" above to start building your page
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {blocks.map((block, index) => (
            <div
              key={block.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
            >
              <div className="flex gap-4">
                {/* Reorder Controls */}
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => moveDown(index)}
                    disabled={index === blocks.length - 1}
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>

                {/* Block Content */}
                <div className="flex-1 space-y-3">
                  {/* Block Type and Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        block.type === 'heading' 
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}>
                        {block.type === 'heading' ? 'HEADING' : 'PARAGRAPH'}
                      </span>
                      
                      {/* Heading Level Selector */}
                      {block.type === 'heading' && (
                        <Select
                          value={String(block.level || 2)}
                          onValueChange={(val) => updateBlock(block.id, { level: parseInt(val) as 1 | 2 | 3 })}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Large (H1)</SelectItem>
                            <SelectItem value="2">Medium (H2)</SelectItem>
                            <SelectItem value="3">Small (H3)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Delete Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => removeBlock(block.id)}
                      title="Delete block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Text Input */}
                  {block.type === 'heading' ? (
                    <Input
                      value={block.text}
                      onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                      placeholder="Enter heading text..."
                      className="font-medium text-base"
                    />
                  ) : (
                    <Textarea
                      value={block.text}
                      onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                      placeholder="Enter paragraph text..."
                      className="min-h-[100px] text-base"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Button */}
      {hasChanges && (
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            size="lg"
            className="w-full gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
