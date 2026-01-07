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

// Auto-save data structure
interface AutoSaveData {
  pageId: string | null;
  pageTitle: string;
  blocks: PageBlock[];
  timestamp: number;
}

// LocalStorage key for auto-save
const AUTO_SAVE_KEY = 'pagebuilder_autosave';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

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
  activeLeftTab: 'blocks' | 'layers' | 'pages';
  activeRightTab: 'settings' | 'style' | 'advanced';
  
  // History for undo/redo
  history: HistoryState[];
  historyIndex: number;
  
  // Auto-save state
  lastAutoSave: number | null;
  hasUnsavedChanges: boolean;
  autoSaveEnabled: boolean;
  
  // Actions
  setPageId: (id: string | null) => void;
  setPageTitle: (title: string) => void;
  setBlocks: (blocks: PageBlock[], skipHistory?: boolean) => void;
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
  setActiveLeftTab: (tab: 'blocks' | 'layers' | 'pages') => void;
  setActiveRightTab: (tab: 'settings' | 'style' | 'advanced') => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveToHistory: () => void;
  clearSelection: () => void;
  getSelectedBlock: () => PageBlock | null;
  
  // Auto-save actions
  autoSave: () => void;
  loadAutoSave: () => AutoSaveData | null;
  clearAutoSave: () => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  markAsSaved: () => void;
}

const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper to get auto-save key for a specific page
const getAutoSaveKey = (pageId: string | null) => {
  return pageId ? `${AUTO_SAVE_KEY}_${pageId}` : `${AUTO_SAVE_KEY}_new`;
};

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
  lastAutoSave: null,
  hasUnsavedChanges: false,
  autoSaveEnabled: true,

  // Actions
  setPageId: (id) => set({ pageId: id }),
  
  setPageTitle: (title) => {
    set({ pageTitle: title, hasUnsavedChanges: true });
    // Trigger auto-save on title change
    get().autoSave();
  },
  
  setBlocks: (blocks, skipHistory = false) => {
    set({ blocks, hasUnsavedChanges: true });
    if (!skipHistory) {
      get().saveToHistory();
    }
    // Trigger auto-save on blocks change
    get().autoSave();
  },
  
  addBlock: (blockType, index) => {
    const { blocks, saveToHistory, autoSave } = get();
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
    
    set({ blocks: newBlocks, selectedBlockId: newBlock.id, hasUnsavedChanges: true });
    saveToHistory();
    autoSave();
  },
  
  updateBlock: (id, content) => {
    const { blocks, saveToHistory, autoSave } = get();
    const newBlocks = blocks.map((block) =>
      block.id === id ? { ...block, content: { ...block.content, ...content } } : block
    );
    set({ blocks: newBlocks, hasUnsavedChanges: true });
    saveToHistory();
    autoSave();
  },
  
  deleteBlock: (id) => {
    const { blocks, selectedBlockId, saveToHistory, autoSave } = get();
    const newBlocks = blocks
      .filter((block) => block.id !== id)
      .map((block, index) => ({ ...block, order: index }));
    set({
      blocks: newBlocks,
      selectedBlockId: selectedBlockId === id ? null : selectedBlockId,
      hasUnsavedChanges: true,
    });
    saveToHistory();
    autoSave();
  },
  
  duplicateBlock: (id) => {
    const { blocks, saveToHistory, autoSave } = get();
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
    
    set({ blocks: newBlocks, selectedBlockId: newBlock.id, hasUnsavedChanges: true });
    saveToHistory();
    autoSave();
  },
  
  moveBlock: (fromIndex, toIndex) => {
    const { blocks, saveToHistory, autoSave } = get();
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    
    const reorderedBlocks = newBlocks.map((block, index) => ({
      ...block,
      order: index,
    }));
    
    set({ blocks: reorderedBlocks, hasUnsavedChanges: true });
    saveToHistory();
    autoSave();
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
    const { history, historyIndex, autoSave } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({
        blocks: JSON.parse(JSON.stringify(history[newIndex].blocks)),
        historyIndex: newIndex,
        hasUnsavedChanges: true,
      });
      autoSave();
    }
  },
  
  redo: () => {
    const { history, historyIndex, autoSave } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({
        blocks: JSON.parse(JSON.stringify(history[newIndex].blocks)),
        historyIndex: newIndex,
        hasUnsavedChanges: true,
      });
      autoSave();
    }
  },
  
  canUndo: () => get().historyIndex > 0,
  
  canRedo: () => get().historyIndex < get().history.length - 1,
  
  clearSelection: () => set({ selectedBlockId: null }),
  
  getSelectedBlock: () => {
    const { blocks, selectedBlockId } = get();
    return blocks.find((b) => b.id === selectedBlockId) || null;
  },
  
  // Auto-save implementation
  autoSave: () => {
    const { pageId, pageTitle, blocks, autoSaveEnabled, lastAutoSave } = get();
    
    if (!autoSaveEnabled) return;
    
    // Debounce auto-save to avoid too frequent saves
    const now = Date.now();
    if (lastAutoSave && now - lastAutoSave < 5000) {
      // Schedule a save for later if we're saving too frequently
      setTimeout(() => {
        get().autoSave();
      }, 5000);
      return;
    }
    
    try {
      const autoSaveData: AutoSaveData = {
        pageId,
        pageTitle,
        blocks,
        timestamp: now,
      };
      
      const key = getAutoSaveKey(pageId);
      localStorage.setItem(key, JSON.stringify(autoSaveData));
      set({ lastAutoSave: now });
      
      console.log('[AutoSave] Saved at', new Date(now).toLocaleTimeString());
    } catch (error) {
      console.error('[AutoSave] Failed to save:', error);
    }
  },
  
  loadAutoSave: () => {
    const { pageId } = get();
    try {
      const key = getAutoSaveKey(pageId);
      const saved = localStorage.getItem(key);
      if (saved) {
        const data: AutoSaveData = JSON.parse(saved);
        console.log('[AutoSave] Found saved data from', new Date(data.timestamp).toLocaleString());
        return data;
      }
    } catch (error) {
      console.error('[AutoSave] Failed to load:', error);
    }
    return null;
  },
  
  clearAutoSave: () => {
    const { pageId } = get();
    try {
      const key = getAutoSaveKey(pageId);
      localStorage.removeItem(key);
      console.log('[AutoSave] Cleared');
    } catch (error) {
      console.error('[AutoSave] Failed to clear:', error);
    }
  },
  
  setAutoSaveEnabled: (enabled) => set({ autoSaveEnabled: enabled }),
  
  markAsSaved: () => {
    const { clearAutoSave } = get();
    set({ hasUnsavedChanges: false });
    clearAutoSave();
  },
}));

// Set up periodic auto-save
if (typeof window !== 'undefined') {
  setInterval(() => {
    const state = usePageBuilderStore.getState();
    if (state.hasUnsavedChanges && state.autoSaveEnabled) {
      state.autoSave();
    }
  }, AUTO_SAVE_INTERVAL);
  
  // Save on page unload
  window.addEventListener('beforeunload', (e) => {
    const state = usePageBuilderStore.getState();
    if (state.hasUnsavedChanges) {
      state.autoSave();
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  });
}
