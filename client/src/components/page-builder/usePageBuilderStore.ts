import { create } from 'zustand';
import { BlockType } from './blockTypes';

export interface PageBlock {
  id: string;
  type: string;
  content: Record<string, unknown>;
  order: number;
}

interface HistoryState {
  blocks: PageBlock[];
}

interface PageBuilderState {
  // Page data
  pageId: string | null;
  pageTitle: string;
  blocks: PageBlock[];
  
  // UI state
  selectedBlockId: string | null;
  hoveredBlockId: string | null;
  isDragging: boolean;
  isPreviewMode: boolean;
  isSaving: boolean;
  
  // Panel state
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  activeLeftTab: 'blocks' | 'layers' | 'templates';
  activeRightTab: 'settings' | 'style' | 'advanced';
  
  // History for undo/redo
  history: HistoryState[];
  historyIndex: number;
  
  // Actions
  setPageId: (id: string | null) => void;
  setPageTitle: (title: string) => void;
  setBlocks: (blocks: PageBlock[]) => void;
  addBlock: (blockType: BlockType, index?: number) => void;
  updateBlock: (id: string, content: Record<string, unknown>) => void;
  deleteBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  selectBlock: (id: string | null) => void;
  hoverBlock: (id: string | null) => void;
  setDragging: (isDragging: boolean) => void;
  togglePreviewMode: () => void;
  setPreviewMode: (isPreview: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setActiveLeftTab: (tab: 'blocks' | 'layers' | 'templates') => void;
  setActiveRightTab: (tab: 'settings' | 'style' | 'advanced') => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveToHistory: () => void;
  clearSelection: () => void;
  getSelectedBlock: () => PageBlock | null;
}

const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const usePageBuilderStore = create<PageBuilderState>((set, get) => ({
  // Initial state
  pageId: null,
  pageTitle: 'Untitled Page',
  blocks: [],
  selectedBlockId: null,
  hoveredBlockId: null,
  isDragging: false,
  isPreviewMode: false,
  isSaving: false,
  leftPanelOpen: true,
  rightPanelOpen: true,
  activeLeftTab: 'blocks',
  activeRightTab: 'settings',
  history: [],
  historyIndex: -1,

  // Actions
  setPageId: (id) => set({ pageId: id }),
  
  setPageTitle: (title) => set({ pageTitle: title }),
  
  setBlocks: (blocks) => {
    set({ blocks });
    get().saveToHistory();
  },
  
  addBlock: (blockType, index) => {
    const { blocks, saveToHistory } = get();
    const newBlock: PageBlock = {
      id: generateId(),
      type: blockType.id,
      content: { ...blockType.defaultContent },
      order: index !== undefined ? index : blocks.length,
    };
    
    let newBlocks: PageBlock[];
    if (index !== undefined) {
      newBlocks = [
        ...blocks.slice(0, index),
        newBlock,
        ...blocks.slice(index).map((b, i) => ({ ...b, order: index + i + 1 })),
      ];
    } else {
      newBlocks = [...blocks, newBlock];
    }
    
    set({ blocks: newBlocks, selectedBlockId: newBlock.id });
    saveToHistory();
  },
  
  updateBlock: (id, content) => {
    const { blocks, saveToHistory } = get();
    const newBlocks = blocks.map((block) =>
      block.id === id ? { ...block, content: { ...block.content, ...content } } : block
    );
    set({ blocks: newBlocks });
    saveToHistory();
  },
  
  deleteBlock: (id) => {
    const { blocks, selectedBlockId, saveToHistory } = get();
    const newBlocks = blocks
      .filter((block) => block.id !== id)
      .map((block, index) => ({ ...block, order: index }));
    set({
      blocks: newBlocks,
      selectedBlockId: selectedBlockId === id ? null : selectedBlockId,
    });
    saveToHistory();
  },
  
  duplicateBlock: (id) => {
    const { blocks, saveToHistory } = get();
    const blockIndex = blocks.findIndex((b) => b.id === id);
    if (blockIndex === -1) return;
    
    const originalBlock = blocks[blockIndex];
    const newBlock: PageBlock = {
      ...originalBlock,
      id: generateId(),
      order: blockIndex + 1,
    };
    
    const newBlocks = [
      ...blocks.slice(0, blockIndex + 1),
      newBlock,
      ...blocks.slice(blockIndex + 1).map((b) => ({ ...b, order: b.order + 1 })),
    ];
    
    set({ blocks: newBlocks, selectedBlockId: newBlock.id });
    saveToHistory();
  },
  
  moveBlock: (fromIndex, toIndex) => {
    const { blocks, saveToHistory } = get();
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    
    const reorderedBlocks = newBlocks.map((block, index) => ({
      ...block,
      order: index,
    }));
    
    set({ blocks: reorderedBlocks });
    saveToHistory();
  },
  
  selectBlock: (id) => set({ selectedBlockId: id }),
  
  hoverBlock: (id) => set({ hoveredBlockId: id }),
  
  setDragging: (isDragging) => set({ isDragging }),
  
  togglePreviewMode: () => set((state) => ({ isPreviewMode: !state.isPreviewMode })),
  
  setPreviewMode: (isPreview) => set({ isPreviewMode: isPreview }),
  
  setSaving: (isSaving) => set({ isSaving }),
  
  toggleLeftPanel: () => set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),
  
  toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  
  setActiveLeftTab: (tab) => set({ activeLeftTab: tab }),
  
  setActiveRightTab: (tab) => set({ activeRightTab: tab }),
  
  saveToHistory: () => {
    const { blocks, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ blocks: JSON.parse(JSON.stringify(blocks)) });
    
    // Keep only last 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },
  
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({
        blocks: JSON.parse(JSON.stringify(history[newIndex].blocks)),
        historyIndex: newIndex,
      });
    }
  },
  
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({
        blocks: JSON.parse(JSON.stringify(history[newIndex].blocks)),
        historyIndex: newIndex,
      });
    }
  },
  
  canUndo: () => get().historyIndex > 0,
  
  canRedo: () => get().historyIndex < get().history.length - 1,
  
  clearSelection: () => set({ selectedBlockId: null }),
  
  getSelectedBlock: () => {
    const { blocks, selectedBlockId } = get();
    return blocks.find((b) => b.id === selectedBlockId) || null;
  },
}));
