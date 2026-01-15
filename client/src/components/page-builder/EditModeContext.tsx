import React, { createContext, useContext, useState, useCallback } from 'react';
import { usePageBuilderStore } from './usePageBuilderStore';

interface SelectedElement {
  blockId: string;
  elementId: string;
  elementType: string;
}

interface EditModeContextType {
  isEditMode: boolean;
  selectedElement: SelectedElement | null;
  selectElement: (blockId: string, elementId: string, elementType: string) => void;
  clearSelection: () => void;
  updateElementDimensions: (blockId: string, elementId: string, width: string, height: string) => void;
  updateElementPosition: (blockId: string, elementId: string, x: number, y: number) => void;
}

const EditModeContext = createContext<EditModeContextType | null>(null);

export function EditModeProvider({ 
  children, 
  isEditMode = true 
}: { 
  children: React.ReactNode;
  isEditMode?: boolean;
}) {
  const { updateBlock, blocks } = usePageBuilderStore();
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);

  const selectElement = useCallback((blockId: string, elementId: string, elementType: string) => {
    setSelectedElement({ blockId, elementId, elementType });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedElement(null);
  }, []);

  const updateElementDimensions = useCallback((blockId: string, elementId: string, width: string, height: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    updateBlock(blockId, {
      content: {
        ...block.content,
        [`${elementId}Width`]: width,
        [`${elementId}Height`]: height,
      },
    });
  }, [blocks, updateBlock]);

  const updateElementPosition = useCallback((blockId: string, elementId: string, x: number, y: number) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    updateBlock(blockId, {
      content: {
        ...block.content,
        [`${elementId}X`]: x,
        [`${elementId}Y`]: y,
      },
    });
  }, [blocks, updateBlock]);

  return (
    <EditModeContext.Provider value={{
      isEditMode,
      selectedElement,
      selectElement,
      clearSelection,
      updateElementDimensions,
      updateElementPosition,
    }}>
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  const context = useContext(EditModeContext);
  if (!context) {
    // Return default values when not in edit mode context
    return {
      isEditMode: false,
      selectedElement: null,
      selectElement: () => {},
      clearSelection: () => {},
      updateElementDimensions: () => {},
      updateElementPosition: () => {},
    };
  }
  return context;
}

export default EditModeContext;
