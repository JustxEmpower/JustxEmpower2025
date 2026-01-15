import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import {
  Copy,
  Scissors,
  ClipboardPaste,
  Trash2,
  CopyPlus,
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  ArrowDownToLine,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layers,
} from 'lucide-react';
import { useClipboardStore } from './useClipboardStore';
import { useMultiSelect } from './useMultiSelect';
import { PageBlock } from './usePageBuilderStore';

interface BlockContextMenuProps {
  children: React.ReactNode;
  block: PageBlock;
  blocks: PageBlock[];
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToTop: () => void;
  onMoveToBottom: () => void;
  onToggleVisibility?: () => void;
  onToggleLock?: () => void;
  isVisible?: boolean;
  isLocked?: boolean;
}

export function BlockContextMenu({
  children,
  block,
  blocks,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onMoveToTop,
  onMoveToBottom,
  onToggleVisibility,
  onToggleLock,
  isVisible = true,
  isLocked = false,
}: BlockContextMenuProps) {
  const { hasClipboard, getClipboardInfo } = useClipboardStore();
  const { selectedBlockIds, getSelectedCount } = useMultiSelect();
  
  const clipboardInfo = getClipboardInfo();
  const hasClipboardContent = hasClipboard();
  const selectedCount = getSelectedCount();
  const isMultiSelected = selectedCount > 1;
  
  // Find block position
  const blockIndex = blocks.findIndex(b => b.id === block.id);
  const isFirst = blockIndex === 0;
  const isLast = blockIndex === blocks.length - 1;
  
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {/* Selection info */}
        {isMultiSelected && (
          <>
            <div className="px-2 py-1.5 text-xs text-neutral-500">
              {selectedCount} blocks selected
            </div>
            <ContextMenuSeparator />
          </>
        )}
        
        {/* Clipboard actions */}
        <ContextMenuItem onClick={onCopy}>
          <Copy className="mr-2 h-4 w-4" />
          Copy{isMultiSelected ? ` (${selectedCount})` : ''}
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuItem onClick={onCut}>
          <Scissors className="mr-2 h-4 w-4" />
          Cut{isMultiSelected ? ` (${selectedCount})` : ''}
          <ContextMenuShortcut>⌘X</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuItem onClick={onPaste} disabled={!hasClipboardContent}>
          <ClipboardPaste className="mr-2 h-4 w-4" />
          Paste{hasClipboardContent ? ` (${clipboardInfo.count})` : ''}
          <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        {/* Block actions */}
        <ContextMenuItem onClick={onDuplicate}>
          <CopyPlus className="mr-2 h-4 w-4" />
          Duplicate{isMultiSelected ? ` (${selectedCount})` : ''}
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={onDelete}
          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete{isMultiSelected ? ` (${selectedCount})` : ''}
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        {/* Move actions */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Layers className="mr-2 h-4 w-4" />
            Move
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={onMoveToTop} disabled={isFirst}>
              <ArrowUpToLine className="mr-2 h-4 w-4" />
              Move to Top
            </ContextMenuItem>
            <ContextMenuItem onClick={onMoveUp} disabled={isFirst}>
              <ArrowUp className="mr-2 h-4 w-4" />
              Move Up
              <ContextMenuShortcut>⌘↑</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={onMoveDown} disabled={isLast}>
              <ArrowDown className="mr-2 h-4 w-4" />
              Move Down
              <ContextMenuShortcut>⌘↓</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={onMoveToBottom} disabled={isLast}>
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Move to Bottom
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        {/* Visibility and Lock (if handlers provided) */}
        {(onToggleVisibility || onToggleLock) && (
          <>
            <ContextMenuSeparator />
            
            {onToggleVisibility && (
              <ContextMenuItem onClick={onToggleVisibility}>
                {isVisible ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Hide Block
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Show Block
                  </>
                )}
              </ContextMenuItem>
            )}
            
            {onToggleLock && (
              <ContextMenuItem onClick={onToggleLock}>
                {isLocked ? (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    Unlock Block
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Lock Block
                  </>
                )}
              </ContextMenuItem>
            )}
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default BlockContextMenu;
