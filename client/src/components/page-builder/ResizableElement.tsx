import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ResizableElementProps {
  children: React.ReactNode;
  elementId: string;
  elementType: 'image' | 'title' | 'subtitle' | 'description' | 'cta' | 'container';
  initialWidth?: string;
  initialHeight?: string;
  initialX?: number;
  initialY?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  isEditing?: boolean;
  onResize?: (width: string, height: string) => void;
  onMove?: (x: number, y: number) => void;
  onSelect?: () => void;
  isSelected?: boolean;
  showHandles?: boolean;
  lockAspectRatio?: boolean;
  className?: string;
}

type HandlePosition = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export default function ResizableElement({
  children,
  elementId,
  elementType,
  initialWidth = 'auto',
  initialHeight = 'auto',
  initialX = 0,
  initialY = 0,
  minWidth = 50,
  minHeight = 30,
  maxWidth = 2000,
  maxHeight = 2000,
  isEditing = false,
  onResize,
  onMove,
  onSelect,
  isSelected = false,
  showHandles = true,
  lockAspectRatio = false,
  className = '',
}: ResizableElementProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<HandlePosition | null>(null);
  const [dimensions, setDimensions] = useState({ 
    width: initialWidth, 
    height: initialHeight 
  });
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [showDimensions, setShowDimensions] = useState(false);
  
  const startPos = useRef({ x: 0, y: 0 });
  const startDimensions = useRef({ width: 0, height: 0 });
  const startPosition = useRef({ x: 0, y: 0 });
  const aspectRatio = useRef(1);

  // Parse dimension string to number
  const parseDimension = (value: string): number => {
    if (value === 'auto') return 0;
    if (value.endsWith('px')) return parseFloat(value);
    if (value.endsWith('%')) return parseFloat(value);
    if (value.endsWith('rem')) return parseFloat(value) * 16;
    if (value.endsWith('em')) return parseFloat(value) * 16;
    if (value.endsWith('vh')) return (parseFloat(value) / 100) * window.innerHeight;
    if (value.endsWith('vw')) return (parseFloat(value) / 100) * window.innerWidth;
    return parseFloat(value) || 0;
  };

  // Get current computed dimensions
  const getComputedDimensions = useCallback(() => {
    if (!elementRef.current) return { width: 0, height: 0 };
    const rect = elementRef.current.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }, []);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, handle: HandlePosition) => {
    e.preventDefault();
    e.stopPropagation();
    
    const computed = getComputedDimensions();
    startPos.current = { x: e.clientX, y: e.clientY };
    startDimensions.current = computed;
    aspectRatio.current = computed.width / computed.height;
    
    setActiveHandle(handle);
    setIsResizing(true);
    setShowDimensions(true);
  }, [getComputedDimensions]);

  // Handle drag start for moving
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (isResizing) return;
    e.preventDefault();
    e.stopPropagation();
    
    startPos.current = { x: e.clientX, y: e.clientY };
    startPosition.current = { ...position };
    
    setIsDragging(true);
  }, [isResizing, position]);

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && activeHandle) {
        const deltaX = e.clientX - startPos.current.x;
        const deltaY = e.clientY - startPos.current.y;
        
        let newWidth = startDimensions.current.width;
        let newHeight = startDimensions.current.height;
        
        // Calculate new dimensions based on handle position
        switch (activeHandle) {
          case 'e':
            newWidth = startDimensions.current.width + deltaX;
            break;
          case 'w':
            newWidth = startDimensions.current.width - deltaX;
            break;
          case 's':
            newHeight = startDimensions.current.height + deltaY;
            break;
          case 'n':
            newHeight = startDimensions.current.height - deltaY;
            break;
          case 'se':
            newWidth = startDimensions.current.width + deltaX;
            newHeight = lockAspectRatio 
              ? newWidth / aspectRatio.current 
              : startDimensions.current.height + deltaY;
            break;
          case 'sw':
            newWidth = startDimensions.current.width - deltaX;
            newHeight = lockAspectRatio 
              ? newWidth / aspectRatio.current 
              : startDimensions.current.height + deltaY;
            break;
          case 'ne':
            newWidth = startDimensions.current.width + deltaX;
            newHeight = lockAspectRatio 
              ? newWidth / aspectRatio.current 
              : startDimensions.current.height - deltaY;
            break;
          case 'nw':
            newWidth = startDimensions.current.width - deltaX;
            newHeight = lockAspectRatio 
              ? newWidth / aspectRatio.current 
              : startDimensions.current.height - deltaY;
            break;
        }
        
        // Apply constraints
        newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
        
        setDimensions({
          width: `${Math.round(newWidth)}px`,
          height: `${Math.round(newHeight)}px`,
        });
      }
      
      if (isDragging) {
        const deltaX = e.clientX - startPos.current.x;
        const deltaY = e.clientY - startPos.current.y;
        
        setPosition({
          x: startPosition.current.x + deltaX,
          y: startPosition.current.y + deltaY,
        });
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        setActiveHandle(null);
        setShowDimensions(false);
        onResize?.(dimensions.width, dimensions.height);
      }
      if (isDragging) {
        setIsDragging(false);
        onMove?.(position.x, position.y);
      }
    };

    if (isResizing || isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isDragging, activeHandle, dimensions, position, minWidth, minHeight, maxWidth, maxHeight, lockAspectRatio, onResize, onMove]);

  // Handle click to select
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.();
  }, [onSelect]);

  if (!isEditing) {
    return <div className={className}>{children}</div>;
  }

  const handleStyle = (pos: HandlePosition): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      width: pos.length === 1 ? '8px' : '10px',
      height: pos.length === 1 ? '8px' : '10px',
      backgroundColor: isSelected ? '#3b82f6' : '#94a3b8',
      border: '2px solid white',
      borderRadius: '2px',
      zIndex: 50,
      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    };

    // Position handles
    switch (pos) {
      case 'n':
        return { ...base, top: '-5px', left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' };
      case 's':
        return { ...base, bottom: '-5px', left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' };
      case 'e':
        return { ...base, right: '-5px', top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' };
      case 'w':
        return { ...base, left: '-5px', top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' };
      case 'ne':
        return { ...base, top: '-5px', right: '-5px', cursor: 'nesw-resize' };
      case 'nw':
        return { ...base, top: '-5px', left: '-5px', cursor: 'nwse-resize' };
      case 'se':
        return { ...base, bottom: '-5px', right: '-5px', cursor: 'nwse-resize' };
      case 'sw':
        return { ...base, bottom: '-5px', left: '-5px', cursor: 'nesw-resize' };
    }
  };

  const handles: HandlePosition[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

  return (
    <motion.div
      ref={elementRef}
      className={`relative ${className}`}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : (isSelected ? 'grab' : 'pointer'),
        outline: isSelected ? '2px solid #3b82f6' : (isEditing ? '1px dashed #94a3b8' : 'none'),
        outlineOffset: '2px',
      }}
      onClick={handleClick}
      onMouseDown={isSelected ? handleDragStart : undefined}
      whileHover={{ outlineColor: '#3b82f6' }}
    >
      {/* Content */}
      <div className="w-full h-full overflow-hidden">
        {children}
      </div>

      {/* Resize handles */}
      {isSelected && showHandles && (
        <>
          {handles.map((handle) => (
            <div
              key={handle}
              style={handleStyle(handle)}
              onMouseDown={(e) => handleResizeStart(e, handle)}
            />
          ))}
        </>
      )}

      {/* Dimension tooltip */}
      {showDimensions && (
        <div 
          className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50"
        >
          {Math.round(parseDimension(dimensions.width))} × {Math.round(parseDimension(dimensions.height))}
        </div>
      )}

      {/* Element type label */}
      {isSelected && (
        <div className="absolute -bottom-6 left-0 bg-blue-500 text-white text-xs px-2 py-0.5 rounded capitalize">
          {elementType}
        </div>
      )}
    </motion.div>
  );
}
