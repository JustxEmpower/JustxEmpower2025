import { useEffect, useCallback } from 'react';
import { usePageBuilderStore } from './usePageBuilderStore';

/**
 * Hook to enable keyboard shortcuts for undo/redo in the page builder
 * - Ctrl+Z (or Cmd+Z on Mac) for undo
 * - Ctrl+Y or Ctrl+Shift+Z (or Cmd+Y/Cmd+Shift+Z on Mac) for redo
 */
export function useUndoRedo() {
  const { undo, redo, canUndo, canRedo } = usePageBuilderStore();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check if we're in an input, textarea, or contenteditable
    const target = event.target as HTMLElement;
    const isEditing = 
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      target.closest('[contenteditable="true"]');

    // Skip if user is editing text
    if (isEditing) return;

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? event.metaKey : event.ctrlKey;

    if (!modKey) return;

    // Undo: Ctrl+Z (or Cmd+Z)
    if (event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      if (canUndo()) {
        undo();
      }
      return;
    }

    // Redo: Ctrl+Y or Ctrl+Shift+Z (or Cmd+Y/Cmd+Shift+Z)
    if (event.key === 'y' || (event.key === 'z' && event.shiftKey)) {
      event.preventDefault();
      if (canRedo()) {
        redo();
      }
      return;
    }
  }, [undo, redo, canUndo, canRedo]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    undo,
    redo,
    canUndo: canUndo(),
    canRedo: canRedo(),
  };
}

export default useUndoRedo;
