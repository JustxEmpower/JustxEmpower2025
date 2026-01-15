import { create } from 'zustand';
import { PageBlock } from './usePageBuilderStore';

interface MultiSelectState {
  // Selected block IDs (for multi-select)
  selectedBlockIds: string[];
  // Last selected block ID (for shift-click range selection)
  lastSelectedId: string | null;
  // Is multi-select mode active
  isMultiSelectMode: boolean;
  
  // Actions
  selectBlock: (id: string, options?: { shift?: boolean; ctrl?: boolean }) => void;
  selectBlocks: (ids: string[]) => void;
  selectAll: (blocks: PageBlock[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  getSelectedCount: () => number;
  toggleMultiSelectMode: () => void;
}

export const useMultiSelect = create<MultiSelectState>((set, get) => ({
  selectedBlockIds: [],
  lastSelectedId: null,
  isMultiSelectMode: false,
  
  selectBlock: (id, options = {}) => {
    const { shift, ctrl } = options;
    const { selectedBlockIds, lastSelectedId } = get();
    
    if (ctrl) {
      // Ctrl+Click: Toggle selection of this block
      if (selectedBlockIds.includes(id)) {
        set({
          selectedBlockIds: selectedBlockIds.filter(bid => bid !== id),
          lastSelectedId: id,
        });
      } else {
        set({
          selectedBlockIds: [...selectedBlockIds, id],
          lastSelectedId: id,
        });
      }
    } else if (shift && lastSelectedId) {
      // Shift+Click: Select range (handled by Canvas with block order info)
      // This just adds the block to selection, range logic is in Canvas
      if (!selectedBlockIds.includes(id)) {
        set({
          selectedBlockIds: [...selectedBlockIds, id],
          lastSelectedId: id,
        });
      }
    } else {
      // Regular click: Select only this block
      set({
        selectedBlockIds: [id],
        lastSelectedId: id,
      });
    }
  },
  
  selectBlocks: (ids) => {
    set({
      selectedBlockIds: ids,
      lastSelectedId: ids.length > 0 ? ids[ids.length - 1] : null,
    });
  },
  
  selectAll: (blocks) => {
    set({
      selectedBlockIds: blocks.map(b => b.id),
      lastSelectedId: blocks.length > 0 ? blocks[blocks.length - 1].id : null,
    });
  },
  
  clearSelection: () => {
    set({
      selectedBlockIds: [],
      lastSelectedId: null,
    });
  },
  
  isSelected: (id) => {
    return get().selectedBlockIds.includes(id);
  },
  
  getSelectedCount: () => {
    return get().selectedBlockIds.length;
  },
  
  toggleMultiSelectMode: () => {
    set((state) => ({ isMultiSelectMode: !state.isMultiSelectMode }));
  },
}));

// Hook to handle keyboard shortcuts for multi-select
export function useMultiSelectKeyboard(blocks: PageBlock[]) {
  const { selectAll, clearSelection, selectedBlockIds } = useMultiSelect();
  
  // This would be called from PageBuilder to set up keyboard listeners
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl+A or Cmd+A to select all
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      selectAll(blocks);
    }
    
    // Escape to clear selection
    if (e.key === 'Escape') {
      clearSelection();
    }
  };
  
  return {
    handleKeyDown,
    selectedBlockIds,
    selectAll: () => selectAll(blocks),
    clearSelection,
  };
}

// Helper to get blocks in a range for shift-click selection
export function getBlocksInRange(
  blocks: PageBlock[],
  startId: string,
  endId: string
): string[] {
  const startIndex = blocks.findIndex(b => b.id === startId);
  const endIndex = blocks.findIndex(b => b.id === endId);
  
  if (startIndex === -1 || endIndex === -1) return [];
  
  const minIndex = Math.min(startIndex, endIndex);
  const maxIndex = Math.max(startIndex, endIndex);
  
  return blocks.slice(minIndex, maxIndex + 1).map(b => b.id);
}
