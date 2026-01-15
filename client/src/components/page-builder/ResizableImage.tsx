import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ResizableImageProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  isEditing?: boolean;
  onResize?: (width: number, height: number) => void;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  maintainAspectRatio?: boolean;
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

export function ResizableImage({
  src,
  alt = '',
  width: initialWidth,
  height: initialHeight,
  className,
  isEditing = false,
  onResize,
  minWidth = 50,
  minHeight = 50,
  maxWidth = 1920,
  maxHeight = 1080,
  maintainAspectRatio = true,
}: ResizableImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [dimensions, setDimensions] = useState({
    width: initialWidth || 0,
    height: initialHeight || 0,
  });
  const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startDimensions, setStartDimensions] = useState({ width: 0, height: 0 });
  const [shiftPressed, setShiftPressed] = useState(false);

  // Track shift key for aspect ratio toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftPressed(false);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Get natural dimensions when image loads
  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setNaturalDimensions({ width: naturalWidth, height: naturalHeight });
      
      // Set initial dimensions if not provided
      if (!initialWidth && !initialHeight) {
        setDimensions({ width: naturalWidth, height: naturalHeight });
      } else if (initialWidth && !initialHeight) {
        const ratio = naturalHeight / naturalWidth;
        setDimensions({ width: initialWidth, height: initialWidth * ratio });
      } else if (!initialWidth && initialHeight) {
        const ratio = naturalWidth / naturalHeight;
        setDimensions({ width: initialHeight * ratio, height: initialHeight });
      }
    }
  }, [initialWidth, initialHeight]);

  // Start resize
  const handleMouseDown = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
    if (!isEditing) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setActiveHandle(handle);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartDimensions({ ...dimensions });
  }, [isEditing, dimensions]);

  // Handle resize
  useEffect(() => {
    if (!isResizing || !activeHandle) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;
      
      let newWidth = startDimensions.width;
      let newHeight = startDimensions.height;
      
      const aspectRatio = naturalDimensions.width / naturalDimensions.height;
      const shouldMaintainRatio = maintainAspectRatio !== shiftPressed; // XOR - shift toggles behavior
      
      // Calculate new dimensions based on handle
      switch (activeHandle) {
        case 'e':
          newWidth = startDimensions.width + deltaX;
          if (shouldMaintainRatio) newHeight = newWidth / aspectRatio;
          break;
        case 'w':
          newWidth = startDimensions.width - deltaX;
          if (shouldMaintainRatio) newHeight = newWidth / aspectRatio;
          break;
        case 's':
          newHeight = startDimensions.height + deltaY;
          if (shouldMaintainRatio) newWidth = newHeight * aspectRatio;
          break;
        case 'n':
          newHeight = startDimensions.height - deltaY;
          if (shouldMaintainRatio) newWidth = newHeight * aspectRatio;
          break;
        case 'se':
          if (shouldMaintainRatio) {
            const delta = Math.max(deltaX, deltaY);
            newWidth = startDimensions.width + delta;
            newHeight = newWidth / aspectRatio;
          } else {
            newWidth = startDimensions.width + deltaX;
            newHeight = startDimensions.height + deltaY;
          }
          break;
        case 'sw':
          if (shouldMaintainRatio) {
            const delta = Math.max(-deltaX, deltaY);
            newWidth = startDimensions.width + delta;
            newHeight = newWidth / aspectRatio;
          } else {
            newWidth = startDimensions.width - deltaX;
            newHeight = startDimensions.height + deltaY;
          }
          break;
        case 'ne':
          if (shouldMaintainRatio) {
            const delta = Math.max(deltaX, -deltaY);
            newWidth = startDimensions.width + delta;
            newHeight = newWidth / aspectRatio;
          } else {
            newWidth = startDimensions.width + deltaX;
            newHeight = startDimensions.height - deltaY;
          }
          break;
        case 'nw':
          if (shouldMaintainRatio) {
            const delta = Math.max(-deltaX, -deltaY);
            newWidth = startDimensions.width + delta;
            newHeight = newWidth / aspectRatio;
          } else {
            newWidth = startDimensions.width - deltaX;
            newHeight = startDimensions.height - deltaY;
          }
          break;
      }
      
      // Apply constraints
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
      
      setDimensions({ width: Math.round(newWidth), height: Math.round(newHeight) });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setActiveHandle(null);
      
      // Notify parent of resize
      if (onResize) {
        onResize(dimensions.width, dimensions.height);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, activeHandle, startPos, startDimensions, naturalDimensions, maintainAspectRatio, shiftPressed, minWidth, minHeight, maxWidth, maxHeight, onResize, dimensions]);

  // Resize handle component
  const ResizeHandle = ({ position }: { position: ResizeHandle }) => {
    const positionClasses: Record<ResizeHandle, string> = {
      nw: '-top-1.5 -left-1.5 cursor-nw-resize',
      ne: '-top-1.5 -right-1.5 cursor-ne-resize',
      sw: '-bottom-1.5 -left-1.5 cursor-sw-resize',
      se: '-bottom-1.5 -right-1.5 cursor-se-resize',
      n: '-top-1.5 left-1/2 -translate-x-1/2 cursor-n-resize',
      s: '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-s-resize',
      e: 'top-1/2 -right-1.5 -translate-y-1/2 cursor-e-resize',
      w: 'top-1/2 -left-1.5 -translate-y-1/2 cursor-w-resize',
    };

    return (
      <div
        className={cn(
          'absolute w-3 h-3 bg-white border-2 border-primary rounded-sm z-10 transition-transform hover:scale-125',
          positionClasses[position],
          activeHandle === position && 'scale-125 bg-primary'
        )}
        onMouseDown={(e) => handleMouseDown(e, position)}
      />
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative inline-block',
        isEditing && 'ring-2 ring-primary ring-offset-2',
        isResizing && 'select-none',
        className
      )}
      style={{
        width: dimensions.width || 'auto',
        height: dimensions.height || 'auto',
      }}
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        onLoad={handleImageLoad}
        className="w-full h-full object-cover"
        draggable={false}
      />
      
      {/* Resize handles - only show in edit mode */}
      {isEditing && (
        <>
          {/* Corner handles */}
          <ResizeHandle position="nw" />
          <ResizeHandle position="ne" />
          <ResizeHandle position="sw" />
          <ResizeHandle position="se" />
          
          {/* Edge handles */}
          <ResizeHandle position="n" />
          <ResizeHandle position="s" />
          <ResizeHandle position="e" />
          <ResizeHandle position="w" />
          
          {/* Dimension display */}
          {isResizing && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {dimensions.width} × {dimensions.height}px
            </div>
          )}
          
          {/* Help text */}
          {!isResizing && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-neutral-500 whitespace-nowrap">
              Drag handles to resize • Hold Shift to {maintainAspectRatio ? 'free resize' : 'lock ratio'}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ResizableImage;
