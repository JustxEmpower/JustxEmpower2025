import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Trash2, Move, FlipHorizontal, FlipVertical, RotateCw, RotateCcw, Lock, Unlock } from 'lucide-react';

interface TransformState {
  flipH: boolean;
  flipV: boolean;
  rotate: number; // degrees
  scaleX: number;
  scaleY: number;
}

interface EditableElementProps {
  children: React.ReactNode;
  elementId: string;
  elementType: 'image' | 'text' | 'video' | 'carousel' | 'button' | 'container' | string;
  isEditing: boolean;
  onResize?: (width: number, height: number) => void;
  onMove?: (x: number, y: number) => void;
  onDelete?: () => void;
  onTransform?: (transform: TransformState) => void;
  initialWidth?: number;
  initialHeight?: number;
  initialX?: number;
  initialY?: number;
  initialTransform?: Partial<TransformState>;
  minWidth?: number;
  minHeight?: number;
  maintainAspectRatio?: boolean;
  className?: string;
}

export default function EditableElement({
  children,
  elementId,
  elementType,
  isEditing,
  onResize,
  onMove,
  onDelete,
  onTransform,
  initialWidth,
  initialHeight,
  initialX = 0,
  initialY = 0,
  initialTransform,
  minWidth = 50,
  minHeight = 20,
  maintainAspectRatio = false,
  className = '',
}: EditableElementProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSelected, setIsSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [aspectLocked, setAspectLocked] = useState(maintainAspectRatio);
  
  const [dimensions, setDimensions] = useState({
    width: initialWidth || 'auto',
    height: initialHeight || 'auto',
  });
  
  const [position, setPosition] = useState({
    x: initialX,
    y: initialY,
  });

  // Transform state for flip, rotate, scale
  const [transform, setTransform] = useState<TransformState>({
    flipH: initialTransform?.flipH || false,
    flipV: initialTransform?.flipV || false,
    rotate: initialTransform?.rotate || 0,
    scaleX: initialTransform?.scaleX || 1,
    scaleY: initialTransform?.scaleY || 1,
  });

  // Scale factor for stretching content (like Photoshop)
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const initialDimensions = useRef({ width: 0, height: 0 });
  const aspectRatio = useRef<number>(1);

  const dragStart = useRef({ x: 0, y: 0 });
  const elementStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Transform handlers
  const handleFlipH = useCallback(() => {
    const newTransform = { ...transform, flipH: !transform.flipH };
    setTransform(newTransform);
    onTransform?.(newTransform);
  }, [transform, onTransform]);

  const handleFlipV = useCallback(() => {
    const newTransform = { ...transform, flipV: !transform.flipV };
    setTransform(newTransform);
    onTransform?.(newTransform);
  }, [transform, onTransform]);

  const handleRotateCW = useCallback(() => {
    const newRotate = (transform.rotate + 90) % 360;
    const newTransform = { ...transform, rotate: newRotate };
    setTransform(newTransform);
    onTransform?.(newTransform);
  }, [transform, onTransform]);

  const handleRotateCCW = useCallback(() => {
    const newRotate = (transform.rotate - 90 + 360) % 360;
    const newTransform = { ...transform, rotate: newRotate };
    setTransform(newTransform);
    onTransform?.(newTransform);
  }, [transform, onTransform]);

  const toggleAspectLock = useCallback(() => {
    setAspectLocked(!aspectLocked);
  }, [aspectLocked]);

  // Handle click to select
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!isEditing) return;
    e.stopPropagation();
    setIsSelected(true);
  }, [isEditing]);

  // Handle click outside to deselect
  useEffect(() => {
    if (!isEditing) {
      setIsSelected(false);
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsSelected(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (!isEditing || !isSelected) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    elementStart.current = { 
      x: position.x, 
      y: position.y, 
      width: containerRef.current?.offsetWidth || 0,
      height: containerRef.current?.offsetHeight || 0,
    };
  }, [isEditing, isSelected, position]);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
    if (!isEditing || !isSelected) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeHandle(handle);
    dragStart.current = { x: e.clientX, y: e.clientY };
    
    const currentWidth = containerRef.current?.offsetWidth || 0;
    const currentHeight = containerRef.current?.offsetHeight || 0;
    
    elementStart.current = { 
      x: position.x, 
      y: position.y, 
      width: currentWidth,
      height: currentHeight,
    };
    
    // Store initial dimensions for scale calculation (only on first resize)
    if (initialDimensions.current.width === 0) {
      initialDimensions.current = { width: currentWidth, height: currentHeight };
    }
  }, [isEditing, isSelected, position]);

  // Handle mouse move for drag/resize
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;

      if (isDragging) {
        const newX = elementStart.current.x + deltaX;
        const newY = elementStart.current.y + deltaY;
        setPosition({ x: newX, y: newY });
      }

      if (isResizing && resizeHandle) {
        let newWidth = elementStart.current.width;
        let newHeight = elementStart.current.height;
        let newX = elementStart.current.x;
        let newY = elementStart.current.y;

        // Handle different resize directions
        if (resizeHandle.includes('e')) {
          newWidth = Math.max(minWidth, elementStart.current.width + deltaX);
        }
        if (resizeHandle.includes('w')) {
          const widthDelta = -deltaX;
          newWidth = Math.max(minWidth, elementStart.current.width + widthDelta);
          if (newWidth > minWidth) {
            newX = elementStart.current.x + deltaX;
          }
        }
        if (resizeHandle.includes('s')) {
          newHeight = Math.max(minHeight, elementStart.current.height + deltaY);
        }
        if (resizeHandle.includes('n')) {
          const heightDelta = -deltaY;
          newHeight = Math.max(minHeight, elementStart.current.height + heightDelta);
          if (newHeight > minHeight) {
            newY = elementStart.current.y + deltaY;
          }
        }

        setDimensions({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
        
        // Calculate scale factors for content stretching (like Photoshop)
        if (initialDimensions.current.width > 0 && initialDimensions.current.height > 0) {
          const scaleX = newWidth / initialDimensions.current.width;
          const scaleY = newHeight / initialDimensions.current.height;
          setScale({ x: scaleX, y: scaleY });
        }
      }
    };

    const handleMouseUp = () => {
      if (isDragging && onMove) {
        onMove(position.x, position.y);
      }
      if (isResizing && onResize && typeof dimensions.width === 'number' && typeof dimensions.height === 'number') {
        onResize(dimensions.width, dimensions.height);
      }
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, resizeHandle, position, dimensions, onMove, onResize, minWidth, minHeight]);

  // Debug logging
  console.log(`[EditableElement] ${elementId} isEditing:`, isEditing);

  if (!isEditing) {
    return <div className={className}>{children}</div>;
  }

  const handleStyle = 'w-3 h-3 bg-blue-500 border-2 border-white rounded-sm absolute z-50 shadow-md';
  const cornerHandleStyle = `${handleStyle} cursor-nwse-resize`;
  const sideHandleStyle = `${handleStyle}`;

  // Use absolute positioning for true free-form movement within block
  const hasMoved = position.x !== 0 || position.y !== 0;

  return (
    <div
      ref={containerRef}
      className={`
        ${hasMoved ? 'absolute' : 'relative'}
        ${isDragging || isResizing ? 'cursor-grabbing' : 'cursor-pointer'}
        ${className}
        transition-all duration-150
      `}
      style={{
        width: typeof dimensions.width === 'number' ? `${dimensions.width}px` : dimensions.width,
        height: typeof dimensions.height === 'number' ? `${dimensions.height}px` : dimensions.height,
        left: hasMoved ? `${position.x}px` : undefined,
        top: hasMoved ? `${position.y}px` : undefined,
        zIndex: isSelected ? 100 : 10,
        outline: isSelected ? '3px solid #3b82f6' : '2px dashed #60a5fa',
        outlineOffset: '2px',
        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
      }}
      onClick={handleClick}
    >
      {/* Element content with full transform support (flip, rotate, scale) */}
      <div 
        className="w-full h-full origin-center"
        style={{
          transform: [
            transform.flipH ? 'scaleX(-1)' : '',
            transform.flipV ? 'scaleY(-1)' : '',
            transform.rotate !== 0 ? `rotate(${transform.rotate}deg)` : '',
            scale.x !== 1 || scale.y !== 1 ? `scale(${scale.x}, ${scale.y})` : '',
          ].filter(Boolean).join(' ') || undefined,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </div>

      {/* Controls shown when selected */}
      {isSelected && (
        <>
          {/* Element type label */}
          <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-0.5 rounded font-medium capitalize z-50">
            {elementType}
          </div>

          {/* Toolbar */}
          <div className="absolute -top-8 right-0 flex gap-1 z-50 bg-neutral-900/90 rounded-lg p-1 shadow-lg">
            {/* Move handle */}
            <button
              className="bg-blue-500 text-white p-1.5 rounded cursor-move hover:bg-blue-600 transition-colors"
              onMouseDown={handleDragStart}
              title="Drag to move"
            >
              <Move className="w-3.5 h-3.5" />
            </button>

            {/* Flip Horizontal */}
            <button
              className={`p-1.5 rounded transition-colors ${transform.flipH ? 'bg-blue-500 text-white' : 'bg-neutral-700 text-white hover:bg-neutral-600'}`}
              onClick={(e) => { e.stopPropagation(); handleFlipH(); }}
              title="Flip Horizontal"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
            </button>

            {/* Flip Vertical */}
            <button
              className={`p-1.5 rounded transition-colors ${transform.flipV ? 'bg-blue-500 text-white' : 'bg-neutral-700 text-white hover:bg-neutral-600'}`}
              onClick={(e) => { e.stopPropagation(); handleFlipV(); }}
              title="Flip Vertical"
            >
              <FlipVertical className="w-3.5 h-3.5" />
            </button>

            {/* Rotate Counter-Clockwise */}
            <button
              className="bg-neutral-700 text-white p-1.5 rounded hover:bg-neutral-600 transition-colors"
              onClick={(e) => { e.stopPropagation(); handleRotateCCW(); }}
              title="Rotate 90° Left"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Rotate Clockwise */}
            <button
              className="bg-neutral-700 text-white p-1.5 rounded hover:bg-neutral-600 transition-colors"
              onClick={(e) => { e.stopPropagation(); handleRotateCW(); }}
              title="Rotate 90° Right"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Aspect Ratio Lock */}
            <button
              className={`p-1.5 rounded transition-colors ${aspectLocked ? 'bg-amber-500 text-white' : 'bg-neutral-700 text-white hover:bg-neutral-600'}`}
              onClick={(e) => { e.stopPropagation(); toggleAspectLock(); }}
              title={aspectLocked ? 'Unlock Aspect Ratio' : 'Lock Aspect Ratio'}
            >
              {aspectLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
            
            {/* Delete button */}
            {onDelete && (
              <button
                className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                title="Delete element"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Resize handles */}
          {/* Corners */}
          <div
            className={`${cornerHandleStyle} -top-1.5 -left-1.5 cursor-nw-resize`}
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
          />
          <div
            className={`${cornerHandleStyle} -top-1.5 -right-1.5 cursor-ne-resize`}
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
          />
          <div
            className={`${cornerHandleStyle} -bottom-1.5 -left-1.5 cursor-sw-resize`}
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
          />
          <div
            className={`${cornerHandleStyle} -bottom-1.5 -right-1.5 cursor-se-resize`}
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          />
          
          {/* Edges */}
          <div
            className={`${sideHandleStyle} -top-1.5 left-1/2 -translate-x-1/2 cursor-n-resize`}
            onMouseDown={(e) => handleResizeStart(e, 'n')}
          />
          <div
            className={`${sideHandleStyle} -bottom-1.5 left-1/2 -translate-x-1/2 cursor-s-resize`}
            onMouseDown={(e) => handleResizeStart(e, 's')}
          />
          <div
            className={`${sideHandleStyle} top-1/2 -left-1.5 -translate-y-1/2 cursor-w-resize`}
            onMouseDown={(e) => handleResizeStart(e, 'w')}
          />
          <div
            className={`${sideHandleStyle} top-1/2 -right-1.5 -translate-y-1/2 cursor-e-resize`}
            onMouseDown={(e) => handleResizeStart(e, 'e')}
          />

          {/* Dimension tooltip while resizing */}
          {isResizing && typeof dimensions.width === 'number' && typeof dimensions.height === 'number' && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
              {Math.round(dimensions.width)} × {Math.round(dimensions.height)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
