import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PageBlock } from './usePageBuilderStore';

// ============================================================================
// CLIPBOARD STORE - Cross-page block copy/paste with localStorage persistence
// ============================================================================

interface ClipboardState {
  // Copied blocks (stored in localStorage for cross-page persistence)
  copiedBlocks: PageBlock[];
  
  // Source page info for reference
  sourcePageId: string | null;
  sourcePageTitle: string | null;
  
  // Timestamp of when blocks were copied
  copiedAt: number | null;
  
  // Whether the copy was a cut operation (blocks should be removed from source)
  isCut: boolean;
  
  // Actions
  copyBlocks: (blocks: PageBlock[], pageId?: string, pageTitle?: string) => void;
  cutBlocks: (blocks: PageBlock[], pageId?: string, pageTitle?: string) => void;
  pasteBlocks: () => PageBlock[];
  clearClipboard: () => void;
  hasClipboard: () => boolean;
  getClipboardInfo: () => { count: number; sourceTitle: string | null; copiedAt: number | null; isCut: boolean };
}

// Generate new unique IDs for pasted blocks to avoid conflicts
function generateNewBlockIds(blocks: PageBlock[]): PageBlock[] {
  const timestamp = Date.now();
  return blocks.map((block, index) => ({
    ...block,
    id: `pasted-${timestamp}-${index}-${Math.random().toString(36).substr(2, 9)}`,
    // Reset order - will be set by the paste location
    order: index,
  }));
}

// Deep clone blocks to avoid reference issues
function deepCloneBlocks(blocks: PageBlock[]): PageBlock[] {
  return JSON.parse(JSON.stringify(blocks));
}

export const useClipboardStore = create<ClipboardState>()(
  persist(
    (set, get) => ({
      copiedBlocks: [],
      sourcePageId: null,
      sourcePageTitle: null,
      copiedAt: null,
      isCut: false,

      copyBlocks: (blocks, pageId, pageTitle) => {
        if (blocks.length === 0) return;
        
        set({
          copiedBlocks: deepCloneBlocks(blocks),
          sourcePageId: pageId || null,
          sourcePageTitle: pageTitle || null,
          copiedAt: Date.now(),
          isCut: false,
        });
      },

      cutBlocks: (blocks, pageId, pageTitle) => {
        if (blocks.length === 0) return;
        
        set({
          copiedBlocks: deepCloneBlocks(blocks),
          sourcePageId: pageId || null,
          sourcePageTitle: pageTitle || null,
          copiedAt: Date.now(),
          isCut: true,
        });
      },

      pasteBlocks: () => {
        const { copiedBlocks, isCut } = get();
        
        if (copiedBlocks.length === 0) return [];
        
        // Generate new IDs for pasted blocks
        const pastedBlocks = generateNewBlockIds(deepCloneBlocks(copiedBlocks));
        
        // If it was a cut operation, clear the clipboard after paste
        if (isCut) {
          set({
            copiedBlocks: [],
            sourcePageId: null,
            sourcePageTitle: null,
            copiedAt: null,
            isCut: false,
          });
        }
        
        return pastedBlocks;
      },

      clearClipboard: () => {
        set({
          copiedBlocks: [],
          sourcePageId: null,
          sourcePageTitle: null,
          copiedAt: null,
          isCut: false,
        });
      },

      hasClipboard: () => {
        return get().copiedBlocks.length > 0;
      },

      getClipboardInfo: () => {
        const { copiedBlocks, sourcePageTitle, copiedAt, isCut } = get();
        return {
          count: copiedBlocks.length,
          sourceTitle: sourcePageTitle,
          copiedAt,
          isCut,
        };
      },
    }),
    {
      name: 'page-builder-clipboard',
      // Only persist the essential data
      partialize: (state) => ({
        copiedBlocks: state.copiedBlocks,
        sourcePageId: state.sourcePageId,
        sourcePageTitle: state.sourcePageTitle,
        copiedAt: state.copiedAt,
        isCut: state.isCut,
      }),
    }
  )
);

// ============================================================================
// CLIPBOARD HOOK - Convenient hook for components
// ============================================================================

export function useClipboard() {
  const store = useClipboardStore();
  
  return {
    // State
    hasCopiedBlocks: store.hasClipboard(),
    clipboardInfo: store.getClipboardInfo(),
    
    // Actions
    copy: store.copyBlocks,
    cut: store.cutBlocks,
    paste: store.pasteBlocks,
    clear: store.clearClipboard,
  };
}

export default useClipboardStore;
