import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trash2, ChevronUp, ChevronDown, Type, AlignLeft, 
  Image, Video, Quote, Code, List, Minus, AlertCircle,
  Link as LinkIcon, Table, CheckSquare
} from 'lucide-react';

// ============================================================================
// Block Types - Enhanced
// ============================================================================

type BlockType = 
  | 'heading' 
  | 'paragraph' 
  | 'image' 
  | 'video' 
  | 'quote' 
  | 'code' 
  | 'list' 
  | 'divider' 
  | 'callout'
  | 'button'
  | 'spacer';

interface ContentBlock {
  id: string;
  type: BlockType;
  text: string;
  level?: 1 | 2 | 3;
  src?: string;
  alt?: string;
  items?: string[];
  listType?: 'bullet' | 'numbered' | 'checklist';
  calloutType?: 'info' | 'warning' | 'success' | 'error';
  buttonUrl?: string;
  buttonStyle?: 'primary' | 'secondary' | 'outline';
  spacerSize?: 'sm' | 'md' | 'lg';
}

const BLOCK_TYPES: { type: BlockType; icon: typeof Type; label: string; description: string }[] = [
  { type: 'heading', icon: Type, label: 'Heading', description: 'Section title' },
  { type: 'paragraph', icon: AlignLeft, label: 'Paragraph', description: 'Text content' },
  { type: 'image', icon: Image, label: 'Image', description: 'Photo or graphic' },
  { type: 'video', icon: Video, label: 'Video', description: 'Embedded video' },
  { type: 'quote', icon: Quote, label: 'Quote', description: 'Blockquote' },
  { type: 'code', icon: Code, label: 'Code', description: 'Code snippet' },
  { type: 'list', icon: List, label: 'List', description: 'Bullet or numbered list' },
  { type: 'divider', icon: Minus, label: 'Divider', description: 'Horizontal line' },
  { type: 'callout', icon: AlertCircle, label: 'Callout', description: 'Highlighted box' },
  { type: 'button', icon: LinkIcon, label: 'Button', description: 'Call to action' },
  { type: 'spacer', icon: Minus, label: 'Spacer', description: 'Vertical space' },
];

interface FreeformContentEditorProps {
  value: string; // JSON string of blocks
  onChange: (value: string) => void;
  onSave?: () => void;
}

/**
 * Free-form Content Editor - Enhanced
 * 
 * Supports multiple block types:
 * - Headings (H1-H3)
 * - Paragraphs
 * - Images & Videos
 * - Quotes & Callouts
 * - Code blocks
 * - Lists (bullet, numbered, checklist)
 * - Dividers & Spacers
 * - Buttons
 */
export default function FreeformContentEditor({ value, onChange, onSave }: FreeformContentEditorProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [showBlockPicker, setShowBlockPicker] = useState(false);

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
    const blocksToSave = newBlocks.map(({ id, ...rest }) => rest);
    onChange(JSON.stringify(blocksToSave));
  };

  // Add a new block
  const addBlock = (type: BlockType) => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type,
      text: '',
      ...(type === 'heading' ? { level: 2 } : {}),
      ...(type === 'list' ? { items: [''], listType: 'bullet' as const } : {}),
      ...(type === 'callout' ? { calloutType: 'info' as const } : {}),
      ...(type === 'button' ? { buttonStyle: 'primary' as const, buttonUrl: '' } : {}),
      ...(type === 'spacer' ? { spacerSize: 'md' as const } : {}),
    };
    updateBlocks([...blocks, newBlock]);
    setShowBlockPicker(false);
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

  // Get block icon
  const getBlockIcon = (type: BlockType) => {
    const blockDef = BLOCK_TYPES.find(b => b.type === type);
    return blockDef?.icon || Type;
  };

  // Get block color
  const getBlockColor = (type: BlockType) => {
    const colors: Record<BlockType, string> = {
      heading: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      paragraph: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      image: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      video: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
      quote: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      code: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
      list: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
      divider: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500',
      callout: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      button: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
      spacer: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500',
    };
    return colors[type];
  };

  // Add list item
  const addListItem = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (block && block.items) {
      updateBlock(blockId, { items: [...block.items, ''] });
    }
  };

  // Update list item
  const updateListItem = (blockId: string, index: number, value: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (block && block.items) {
      const newItems = [...block.items];
      newItems[index] = value;
      updateBlock(blockId, { items: newItems });
    }
  };

  // Remove list item
  const removeListItem = (blockId: string, index: number) => {
    const block = blocks.find(b => b.id === blockId);
    if (block && block.items && block.items.length > 1) {
      const newItems = block.items.filter((_, i) => i !== index);
      updateBlock(blockId, { items: newItems });
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Block Button with Picker */}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowBlockPicker(!showBlockPicker)}
          className="gap-2"
        >
          <Type className="w-4 h-4" />
          Add Block
          <ChevronDown className="w-3 h-3" />
        </Button>

        {/* Block Picker Dropdown */}
        {showBlockPicker && (
          <div className="absolute top-full left-0 mt-1 z-50 w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl p-2 grid grid-cols-2 gap-1">
            {BLOCK_TYPES.map((blockType) => {
              const Icon = blockType.icon;
              return (
                <button
                  key={blockType.type}
                  type="button"
                  onClick={() => addBlock(blockType.type)}
                  className="flex items-center gap-2 p-2 text-left rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <Icon className="w-4 h-4 text-neutral-500" />
                  <div>
                    <div className="text-sm font-medium">{blockType.label}</div>
                    <div className="text-xs text-neutral-400">{blockType.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
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
