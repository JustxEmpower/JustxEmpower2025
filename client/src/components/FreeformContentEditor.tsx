import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown, Type, AlignLeft } from 'lucide-react';

interface ContentBlock {
  id: string;
  type: 'heading' | 'paragraph';
  text: string;
  level?: 1 | 2 | 3;
}

interface FreeformContentEditorProps {
  value: string; // JSON string of blocks
  onChange: (value: string) => void;
  onSave?: () => void;
}

/**
 * Free-form content editor for legal pages
 * Allows adding/removing/reordering heading and paragraph blocks
 */
export default function FreeformContentEditor({ value, onChange, onSave }: FreeformContentEditorProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  // Parse initial value
  useEffect(() => {
    try {
      const parsed = JSON.parse(value || '[]');
      if (Array.isArray(parsed)) {
        // Ensure each block has an id
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

  return (
    <div className="space-y-4">
      {/* Add Block Buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addBlock('heading')}
          className="gap-2"
        >
          <Type className="w-4 h-4" />
          Add Heading
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addBlock('paragraph')}
          className="gap-2"
        >
          <AlignLeft className="w-4 h-4" />
          Add Paragraph
        </Button>
      </div>

      {/* Block List */}
      {blocks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p className="mb-2">No content blocks yet</p>
          <p className="text-sm">Click "Add Heading" or "Add Paragraph" to start building your page</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, index) => (
            <div
              key={block.id}
              className="flex gap-2 items-start p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800"
            >
              {/* Reorder Controls */}
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveDown(index)}
                  disabled={index === blocks.length - 1}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>

              {/* Block Content */}
              <div className="flex-1 space-y-2">
                {/* Block Type Badge */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    block.type === 'heading' 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                      : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  }`}>
                    {block.type === 'heading' ? 'Heading' : 'Paragraph'}
                  </span>
                  
                  {/* Heading Level Selector */}
                  {block.type === 'heading' && (
                    <Select
                      value={String(block.level || 2)}
                      onValueChange={(val) => updateBlock(block.id, { level: parseInt(val) as 1 | 2 | 3 })}
                    >
                      <SelectTrigger className="w-24 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">H1 - Large</SelectItem>
                        <SelectItem value="2">H2 - Medium</SelectItem>
                        <SelectItem value="3">H3 - Small</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Text Input */}
                {block.type === 'heading' ? (
                  <Input
                    value={block.text}
                    onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                    placeholder="Enter heading text..."
                    className="font-medium"
                  />
                ) : (
                  <Textarea
                    value={block.text}
                    onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                    placeholder="Enter paragraph text..."
                    className="min-h-[80px]"
                  />
                )}
              </div>

              {/* Delete Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => removeBlock(block.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Save Button */}
      {onSave && blocks.length > 0 && (
        <div className="pt-4">
          <Button onClick={onSave} className="w-full">
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
