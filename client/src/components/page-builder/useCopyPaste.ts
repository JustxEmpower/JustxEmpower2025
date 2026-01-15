import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useClipboardStore } from './useClipboardStore';
import type { PageBlock } from './usePageBuilderStore';

// ============================================================================
// COPY/PASTE HOOK - Keyboard shortcuts and clipboard operations
// ============================================================================

interface UseCopyPasteOptions {
  // Current page info
  pageId?: string;
  pageTitle?: string;
  
  // Currently selected block
  selectedBlockId: string | null;
  
  // All blocks on the current page
  blocks: PageBlock[];
  
  // Callback to update blocks (for paste and cut operations)
  setBlocks: (blocks: PageBlock[]) => void;
  
  // Callback when blocks are cut (to remove from source)
  onCut?: (blockIds: string[]) => void;
  
  // Whether keyboard shortcuts are enabled
  enabled?: boolean;
}

export function useCopyPaste({
  pageId,
  pageTitle,
  selectedBlockId,
  blocks,
  setBlocks,
  onCut,
  enabled = true,
}: UseCopyPasteOptions) {
  const {
    copyBlocks,
    cutBlocks,
    pasteBlocks,
    clearClipboard,
    hasClipboard,
    getClipboardInfo,
  } = useClipboardStore();

  // Get the selected block
  const getSelectedBlock = useCallback((): PageBlock | null => {
    if (!selectedBlockId) return null;
    return blocks.find(b => b.id === selectedBlockId) || null;
  }, [selectedBlockId, blocks]);

  // Copy selected block
  const handleCopy = useCallback(() => {
    const selectedBlock = getSelectedBlock();
    if (!selectedBlock) {
      toast.error('No block selected to copy');
      return;
    }
    
    copyBlocks([selectedBlock], pageId, pageTitle);
    toast.success('Block copied to clipboard');
  }, [getSelectedBlock, copyBlocks, pageId, pageTitle]);

  // Cut selected block
  const handleCut = useCallback(() => {
    const selectedBlock = getSelectedBlock();
    if (!selectedBlock) {
      toast.error('No block selected to cut');
      return;
    }
    
    cutBlocks([selectedBlock], pageId, pageTitle);
    
    // Remove the block from current page
    if (onCut) {
      onCut([selectedBlock.id]);
    } else {
      const newBlocks = blocks.filter(b => b.id !== selectedBlock.id);
      setBlocks(newBlocks);
    }
    
    toast.success('Block cut to clipboard');
  }, [getSelectedBlock, cutBlocks, pageId, pageTitle, blocks, setBlocks, onCut]);

  // Paste blocks
  const handlePaste = useCallback(() => {
    if (!hasClipboard()) {
      toast.error('Clipboard is empty');
      return;
    }
    
    const pastedBlocks = pasteBlocks();
    if (pastedBlocks.length === 0) return;
    
    // Find the position to insert (after selected block or at end)
    let insertIndex = blocks.length;
    if (selectedBlockId) {
      const selectedIndex = blocks.findIndex(b => b.id === selectedBlockId);
      if (selectedIndex !== -1) {
        insertIndex = selectedIndex + 1;
      }
    }
    
    // Update order for pasted blocks
    const updatedPastedBlocks = pastedBlocks.map((block, i) => ({
      ...block,
      order: insertIndex + i,
    }));
    
    // Update order for blocks after insert position
    const updatedBlocks = blocks.map(block => {
      if (block.order >= insertIndex) {
        return { ...block, order: block.order + pastedBlocks.length };
      }
      return block;
    });
    
    // Insert pasted blocks
    const newBlocks = [
      ...updatedBlocks.slice(0, insertIndex),
      ...updatedPastedBlocks,
      ...updatedBlocks.slice(insertIndex),
    ].sort((a, b) => a.order - b.order);
    
    setBlocks(newBlocks);
    
    const info = getClipboardInfo();
    const sourceInfo = info.sourceTitle ? ` from "${info.sourceTitle}"` : '';
    toast.success(`${pastedBlocks.length} block${pastedBlocks.length > 1 ? 's' : ''} pasted${sourceInfo}`);
  }, [hasClipboard, pasteBlocks, blocks, selectedBlockId, setBlocks, getClipboardInfo]);

  // Duplicate selected block (in-place)
  const handleDuplicate = useCallback(() => {
    const selectedBlock = getSelectedBlock();
    if (!selectedBlock) {
      toast.error('No block selected to duplicate');
      return;
    }
    
    const timestamp = Date.now();
    const duplicatedBlock: PageBlock = {
      ...JSON.parse(JSON.stringify(selectedBlock)),
      id: `dup-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      order: selectedBlock.order + 1,
    };
    
    // Update order for blocks after the duplicated position
    const updatedBlocks = blocks.map(block => {
      if (block.order > selectedBlock.order) {
        return { ...block, order: block.order + 1 };
      }
      return block;
    });
    
    // Insert duplicated block
    const selectedIndex = updatedBlocks.findIndex(b => b.id === selectedBlock.id);
    const newBlocks = [
      ...updatedBlocks.slice(0, selectedIndex + 1),
      duplicatedBlock,
      ...updatedBlocks.slice(selectedIndex + 1),
    ].sort((a, b) => a.order - b.order);
    
    setBlocks(newBlocks);
    toast.success('Block duplicated');
  }, [getSelectedBlock, blocks, setBlocks]);

  // Keyboard event handler
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in an input field
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ctrl+C or Cmd+C - Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !e.shiftKey) {
        e.preventDefault();
        handleCopy();
        return;
      }

      // Ctrl+X or Cmd+X - Cut
      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && !e.shiftKey) {
        e.preventDefault();
        handleCut();
        return;
      }

      // Ctrl+V or Cmd+V - Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !e.shiftKey) {
        e.preventDefault();
        handlePaste();
        return;
      }

      // Ctrl+D or Cmd+D - Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        handleDuplicate();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleCopy, handleCut, handlePaste, handleDuplicate]);

  return {
    // Actions
    copy: handleCopy,
    cut: handleCut,
    paste: handlePaste,
    duplicate: handleDuplicate,
    clearClipboard,
    
    // State
    hasClipboard: hasClipboard(),
    clipboardInfo: getClipboardInfo(),
  };
}

export default useCopyPaste;
