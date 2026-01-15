import { useState, useCallback, useRef, useEffect } from 'react';
import { usePageBuilderStore } from './usePageBuilderStore';

interface ResizeHandlesProps {
  blockId: string;
  isSelected: boolean;
}

type HandlePosition = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export default function ResizeHandles({ blockId, isSelected }: ResizeHandlesProps) {
  const { updateBlock, blocks } = usePageBuilderStore();
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<HandlePosition | null>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const block = blocks.find(b => b.id === blockId);

  const handleMouseDown = useCallback((e: React.MouseEvent, position: HandlePosition) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setActiveHandle(position);
    startPos.current = { x: e.clientX, y: e.clientY };
    
    // Get current element size
    const element = containerRef.current?.parentElement;
    if (element) {
      const rect = element.getBoundingClientRect();
      startSize.current = { width: rect.width, height: rect.height };
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !activeHandle) return;

    const deltaX = e.clientX - startPos.current.x;
    const deltaY = e.clientY - startPos.current.y;

    let newWidth = startSize.current.width;
    let newHeight = startSize.current.height;

    // Calculate new dimensions based on handle position
    switch (activeHandle) {
      case 'e':
        newWidth = Math.max(100, startSize.current.width + deltaX);
        break;
      case 'w':
        newWidth = Math.max(100, startSize.current.width - deltaX);
        break;
      case 's':
        newHeight = Math.max(50, startSize.current.height + deltaY);
        break;
      case 'n':
        newHeight = Math.max(50, startSize.current.height - deltaY);
        break;
      case 'se':
        newWidth = Math.max(100, startSize.current.width + deltaX);
        newHeight = Math.max(50, startSize.current.height + deltaY);
        break;
      case 'sw':
        newWidth = Math.max(100, startSize.current.width - deltaX);
        newHeight = Math.max(50, startSize.current.height + deltaY);
        break;
      case 'ne':
        newWidth = Math.max(100, startSize.current.width + deltaX);
        newHeight = Math.max(50, startSize.current.height - deltaY);
        break;
      case 'nw':
        newWidth = Math.max(100, startSize.current.width - deltaX);
        newHeight = Math.max(50, startSize.current.height - deltaY);
        break;
    }

    // Update block with new dimensions
    const updates: Record<string, unknown> = {};
    
    if (['e', 'w', 'se', 'sw', 'ne', 'nw'].includes(activeHandle)) {
      updates.customWidth = `${Math.round(newWidth)}px`;
    }
    
    if (['n', 's', 'se', 'sw', 'ne', 'nw'].includes(activeHandle)) {
      updates.minHeight = `${Math.round(newHeight)}px`;
    }

    if (Object.keys(updates).length > 0) {
      updateBlock(blockId, updates);
    }
  }, [isResizing, activeHandle, blockId, updateBlock]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setActiveHandle(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  if (!isSelected) return null;

  const handleStyle = "absolute bg-blue-500 border-2 border-white rounded-full shadow-lg z-[100] hover:bg-blue-600 hover:scale-110 transition-all";
  const cornerSize = "w-4 h-4";
  const edgeHorizontal = "w-8 h-3";
  const edgeVertical = "w-3 h-8";

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      {/* Corner handles */}
      <div
        className={`${handleStyle} ${cornerSize} -top-1.5 -left-1.5 cursor-nw-resize pointer-events-auto`}
        onMouseDown={(e) => handleMouseDown(e, 'nw')}
      />
      <div
        className={`${handleStyle} ${cornerSize} -top-1.5 -right-1.5 cursor-ne-resize pointer-events-auto`}
        onMouseDown={(e) => handleMouseDown(e, 'ne')}
      />
      <div
        className={`${handleStyle} ${cornerSize} -bottom-1.5 -left-1.5 cursor-sw-resize pointer-events-auto`}
        onMouseDown={(e) => handleMouseDown(e, 'sw')}
      />
      <div
        className={`${handleStyle} ${cornerSize} -bottom-1.5 -right-1.5 cursor-se-resize pointer-events-auto`}
        onMouseDown={(e) => handleMouseDown(e, 'se')}
      />

      {/* Edge handles */}
      <div
        className={`${handleStyle} ${edgeHorizontal} -top-1 left-1/2 -translate-x-1/2 cursor-n-resize pointer-events-auto`}
        onMouseDown={(e) => handleMouseDown(e, 'n')}
      />
      <div
        className={`${handleStyle} ${edgeHorizontal} -bottom-1 left-1/2 -translate-x-1/2 cursor-s-resize pointer-events-auto`}
        onMouseDown={(e) => handleMouseDown(e, 's')}
      />
      <div
        className={`${handleStyle} ${edgeVertical} top-1/2 -left-1 -translate-y-1/2 cursor-w-resize pointer-events-auto`}
        onMouseDown={(e) => handleMouseDown(e, 'w')}
      />
      <div
        className={`${handleStyle} ${edgeVertical} top-1/2 -right-1 -translate-y-1/2 cursor-e-resize pointer-events-auto`}
        onMouseDown={(e) => handleMouseDown(e, 'e')}
      />

      {/* Resize indicator */}
      {isResizing && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none">
          {String(block?.content?.customWidth || 'auto')} × {String(block?.content?.minHeight || 'auto')}
        </div>
      )}
    </div>
  );
}
