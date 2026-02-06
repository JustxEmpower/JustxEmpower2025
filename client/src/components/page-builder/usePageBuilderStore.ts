import { create } from 'zustand';
import { BlockType } from './blockTypes';

export interface PageBlock {
  id: string;
  type: string;
  content: Record<string, unknown>;
  order: number;
  settings?: Record<string, unknown>;
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
  isInPageBuilder: boolean; // True when inside Page Builder context
  
  // Element editing state
  isElementEditMode: boolean;
  selectedElementId: string | null;
  
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
  setInPageBuilder: (isInPageBuilder: boolean) => void;
  
  // Element editing actions
  toggleElementEditMode: () => void;
  setElementEditMode: (isEditing: boolean) => void;
  selectElement: (elementId: string | null) => void;
  updateElementStyle: (blockId: string, elementId: string, styles: Record<string, string>) => void;
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
  
  // Reset store for switching pages
  resetForNewPage: () => void;
}

const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper to get auto-save key for a specific page
const getAutoSaveKey = (pageId: string | null) => {
  return pageId ? `${AUTO_SAVE_KEY}_${pageId}` : `${AUTO_SAVE_KEY}_new`;
};

// Helper to get all auto-save keys from localStorage
const getAllAutoSaveKeys = (): string[] => {
  try {
    return Object.keys(localStorage).filter(key => key.startsWith(AUTO_SAVE_KEY));
  } catch {
    return [];
  }
};

// Helper to cleanup old auto-saves, keeping the most recent N
const cleanupOldAutoSaves = (keepCount: number = 10): void => {
  try {
    const keys = getAllAutoSaveKeys();
    if (keys.length <= keepCount) return;
    
    // Get timestamps for each key
    const keysWithTimestamp = keys.map(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          return { key, timestamp: parsed.timestamp || 0 };
        }
      } catch {
        // Invalid data
      }
      return { key, timestamp: 0 };
    });
    
    // Sort by timestamp (newest first) and remove oldest
    keysWithTimestamp.sort((a, b) => b.timestamp - a.timestamp);
    const toDelete = keysWithTimestamp.slice(keepCount);
    
    for (const { key } of toDelete) {
      localStorage.removeItem(key);
      console.log('[AutoSave] Cleaned up old save:', key);
    }
  } catch (error) {
    console.warn('[AutoSave] Cleanup failed:', error);
  }
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
  isInPageBuilder: false, // Will be set to true when Page Builder mounts
  isElementEditMode: false,
  selectedElementId: null,
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
    const newBlocks = blocks.map((block) => {
      if (block.id === id) {
        const merged = { ...block.content, ...content };
        if ('animation' in content) {
          console.log('[Store] updateBlock animation for', id, '-> keys in merged content:', Object.keys(merged).filter(k => k === 'animation'), 'enabled:', (merged.animation as any)?.enabled);
        }
        return { ...block, content: merged };
      }
      return block;
    });
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
    const { blocks, pageId, saveToHistory, autoSave } = get();
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
    
    // Persist block order to database immediately
    // This ensures block order is saved even if the user doesn't click Save
    if (pageId) {
      const blockOrders = reorderedBlocks
        .filter(b => b.id && !b.id.startsWith('block_')) // Only persist blocks that exist in DB
        .map(b => ({
          id: parseInt(b.id, 10),
          order: b.order,
        }))
        .filter(b => !isNaN(b.id));
      
      if (blockOrders.length > 0) {
        // Use fetch to call the reorder API
        fetch('/api/trpc/admin.pages.blocks.reorder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            json: {
              pageId: parseInt(pageId, 10),
              blocks: blockOrders,
            },
          }),
        }).catch(err => {
          console.error('[moveBlock] Failed to persist order:', err);
        });
      }
    }
  },
  
  selectBlock: (id) => set({ selectedBlockId: id }),
  
  hoverBlock: (id) => set({ hoveredBlockId: id }),
  
  setDragging: (isDragging) => set({ isDragging }),
  
  togglePreviewMode: () => set((state) => ({ isPreviewMode: !state.isPreviewMode })),
  
  setPreviewMode: (isPreview) => set({ isPreviewMode: isPreview }),
  
  setSaving: (isSaving) => set({ isSaving }),
  
  setInPageBuilder: (isInPageBuilder) => set({ isInPageBuilder }),
  
  // Element editing actions
  toggleElementEditMode: () => set((state) => ({ 
    isElementEditMode: !state.isElementEditMode,
    selectedElementId: state.isElementEditMode ? null : state.selectedElementId,
  })),
  
  setElementEditMode: (isEditing) => set({ 
    isElementEditMode: isEditing,
    selectedElementId: isEditing ? null : null,
  }),
  
  selectElement: (elementId) => set({ selectedElementId: elementId }),
  
  updateElementStyle: (blockId, elementId, styles) => {
    const { blocks, saveToHistory, autoSave } = get();
    const newBlocks = blocks.map((block) => {
      if (block.id === blockId) {
        // Map element IDs to content property names
        const styleMapping: Record<string, Record<string, string>> = {
          'title': { width: 'titleMaxWidth', fontSize: 'titleFontSize' },
          'subtitle': { width: 'subtitleMaxWidth', fontSize: 'subtitleFontSize' },
          'description': { width: 'descriptionMaxWidth', fontSize: 'descriptionFontSize' },
          'image': { width: 'imageWidth', height: 'imageHeight', borderRadius: 'imageBorderRadius' },
          'cta': { width: 'ctaWidth', borderRadius: 'ctaBorderRadius' },
        };
        
        const mapping = styleMapping[elementId] || {};
        const updatedContent = { ...block.content };
        
        Object.entries(styles).forEach(([key, value]) => {
          const contentKey = mapping[key] || `${elementId}${key.charAt(0).toUpperCase() + key.slice(1)}`;
          updatedContent[contentKey] = value;
        });
        
        return { ...block, content: updatedContent };
      }
      return block;
    });
    set({ blocks: newBlocks, hasUnsavedChanges: true });
    saveToHistory();
    autoSave();
  },
  
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
  
  // Auto-save implementation with enhanced error handling
  autoSave: () => {
    const { pageId, pageTitle, blocks, autoSaveEnabled, lastAutoSave, hasUnsavedChanges } = get();
    
    // Skip if disabled, no changes, or no blocks
    if (!autoSaveEnabled || !hasUnsavedChanges || blocks.length === 0) {
      return;
    }
    
    // Check localStorage availability
    try {
      const testKey = '__test_storage__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch {
      console.warn('[AutoSave] localStorage not available');
      return;
    }
    
    // Debounce: minimum 3 seconds between saves
    const now = Date.now();
    if (lastAutoSave && now - lastAutoSave < 3000) {
      // Schedule retry
      setTimeout(() => {
        const currentState = get();
        if (currentState.hasUnsavedChanges) {
          currentState.autoSave();
        }
      }, 3000 - (now - lastAutoSave));
      return;
    }
    
    try {
      const autoSaveData: AutoSaveData = {
        pageId,
        pageTitle: pageTitle || 'Untitled Page',
        blocks: blocks.map((block) => ({
          ...block,
          // Ensure ID is preserved
          id: block.id,
          // Strip any circular references
          content: JSON.parse(JSON.stringify(block.content || {})),
        })),
        timestamp: now,
      };
      
      const key = getAutoSaveKey(pageId);
      const dataString = JSON.stringify(autoSaveData);
      
      // Check size before saving (5MB limit for localStorage)
      if (dataString.length > 4 * 1024 * 1024) {
        console.warn('[AutoSave] Data too large, skipping auto-save');
        return;
      }
      
      localStorage.setItem(key, dataString);
      set({ lastAutoSave: now });
      
      console.log(`[AutoSave] Saved at ${new Date(now).toISOString()} (${dataString.length} bytes)`);
      
      // Cleanup old saves periodically (every 10 saves)
      cleanupOldAutoSaves();
      
    } catch (error) {
      console.error('[AutoSave] Failed to save:', error);
      
      // If quota exceeded, try to cleanup and retry
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        cleanupOldAutoSaves(5);
        // Retry once after cleanup
        setTimeout(() => {
          try {
            const key = getAutoSaveKey(pageId);
            const autoSaveData: AutoSaveData = {
              pageId,
              pageTitle,
              blocks,
              timestamp: now,
            };
            localStorage.setItem(key, JSON.stringify(autoSaveData));
            set({ lastAutoSave: now });
            console.log('[AutoSave] Retry successful after cleanup');
          } catch (retryError) {
            console.error('[AutoSave] Retry failed:', retryError);
          }
        }, 100);
      }
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
  
  resetForNewPage: () => {
    set({
      pageId: null,
      pageTitle: 'Untitled Page',
      blocks: [],
      selectedBlockId: null,
      hoveredBlockId: null,
      isDragging: false,
      isPreviewMode: false,
      isSaving: false,
      isElementEditMode: false,
      selectedElementId: null,
      history: [],
      historyIndex: -1,
      hasUnsavedChanges: false,
    });
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
