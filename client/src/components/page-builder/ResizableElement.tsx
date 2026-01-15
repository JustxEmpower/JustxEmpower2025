import React, { useState, useRef, useCallback, useEffect } from 'react';

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
    // Only start dragging if clicking on the element itself, not on handles
    if ((e.target as HTMLElement).dataset.handle) return;
    
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

  const handles: HandlePosition[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

  // Get cursor for each handle
  const getCursor = (pos: HandlePosition): string => {
    switch (pos) {
      case 'n':
      case 's':
        return 'ns-resize';
      case 'e':
      case 'w':
        return 'ew-resize';
      case 'ne':
      case 'sw':
        return 'nesw-resize';
      case 'nw':
      case 'se':
        return 'nwse-resize';
      default:
        return 'pointer';
    }
  };

  // Get position styles for each handle
  const getHandlePosition = (pos: HandlePosition): React.CSSProperties => {
    const size = 12;
    const offset = -6;
    
    switch (pos) {
      case 'n':
        return { top: offset, left: '50%', transform: 'translateX(-50%)' };
      case 's':
        return { bottom: offset, left: '50%', transform: 'translateX(-50%)' };
      case 'e':
        return { right: offset, top: '50%', transform: 'translateY(-50%)' };
      case 'w':
        return { left: offset, top: '50%', transform: 'translateY(-50%)' };
      case 'ne':
        return { top: offset, right: offset };
      case 'nw':
        return { top: offset, left: offset };
      case 'se':
        return { bottom: offset, right: offset };
      case 'sw':
        return { bottom: offset, left: offset };
      default:
        return {};
    }
  };

  return (
    <div
      ref={elementRef}
      className={`relative ${className}`}
      style={{
        width: dimensions.width !== 'auto' ? dimensions.width : undefined,
        height: dimensions.height !== 'auto' ? dimensions.height : undefined,
        transform: position.x !== 0 || position.y !== 0 ? `translate(${position.x}px, ${position.y}px)` : undefined,
        cursor: isDragging ? 'grabbing' : (isSelected ? 'grab' : 'pointer'),
        outline: isSelected ? '3px solid #3b82f6' : '2px dashed #94a3b8',
        outlineOffset: '2px',
        boxSizing: 'border-box',
      }}
      onClick={handleClick}
      onMouseDown={isSelected ? handleDragStart : undefined}
    >
      {/* Content */}
      <div className="w-full h-full">
        {children}
      </div>

      {/* Resize handles - Always show when editing, highlight when selected */}
      {showHandles && (
        <>
          {handles.map((handle) => (
            <div
              key={handle}
              data-handle={handle}
              style={{
                position: 'absolute',
                width: '14px',
                height: '14px',
                backgroundColor: isSelected ? '#3b82f6' : '#64748b',
                border: '2px solid white',
                borderRadius: '3px',
                cursor: getCursor(handle),
                zIndex: 9999,
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                opacity: isSelected ? 1 : 0.7,
                transition: 'opacity 0.15s, background-color 0.15s',
                ...getHandlePosition(handle),
              }}
              onMouseDown={(e) => handleResizeStart(e, handle)}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.backgroundColor = '#2563eb';
                (e.target as HTMLElement).style.transform = getHandlePosition(handle).transform || 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor = isSelected ? '#3b82f6' : '#64748b';
                (e.target as HTMLElement).style.transform = getHandlePosition(handle).transform || '';
              }}
            />
          ))}
        </>
      )}

      {/* Dimension tooltip */}
      {showDimensions && (
        <div 
          style={{
            position: 'absolute',
            top: '-32px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1e293b',
            color: 'white',
            fontSize: '12px',
            padding: '4px 8px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            zIndex: 10000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          {Math.round(parseDimension(dimensions.width))} × {Math.round(parseDimension(dimensions.height))}px
        </div>
      )}

      {/* Element type label */}
      {isSelected && (
        <div 
          style={{
            position: 'absolute',
            bottom: '-24px',
            left: '0',
            backgroundColor: '#3b82f6',
            color: 'white',
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            textTransform: 'capitalize',
            fontWeight: 500,
            zIndex: 10000,
          }}
        >
          {elementType}
        </div>
      )}
    </div>
  );
}
