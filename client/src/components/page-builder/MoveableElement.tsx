import React, { useRef, useState, useEffect } from 'react';
import Moveable from 'react-moveable';

interface ElementTransform {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotate?: number;
}

interface MoveableElementProps {
  children: React.ReactNode;
  elementId: string;
  elementType?: string;
  className?: string;
  initialTransform?: ElementTransform;
  onTransformChange?: (elementId: string, transform: ElementTransform) => void;
}

/**
 * MoveableElement - Wraps elements for drag/resize/rotate in element edit mode.
 * Transforms are stored as offsets from the original CSS position.
 */
export default function MoveableElement({
  children,
  elementId,
  elementType = 'element',
  className = '',
  initialTransform,
  onTransformChange,
}: MoveableElementProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [isSelected, setIsSelected] = useState(false);
  
  // Track transform state
  const [transform, setTransform] = useState<ElementTransform>({
    x: initialTransform?.x || 0,
    y: initialTransform?.y || 0,
    width: initialTransform?.width,
    height: initialTransform?.height,
    rotate: initialTransform?.rotate || 0,
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSelected(true);
  };

  // Click outside to deselect
  useEffect(() => {
    if (!isSelected) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (targetRef.current && !targetRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest('.moveable-control') || target.closest('.moveable-line') || target.closest('.moveable-rotation')) {
          return;
        }
        setIsSelected(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSelected]);

  // Build inline style from transform - use margin offsets to avoid conflicting with CSS transforms
  const transformStyle: React.CSSProperties = {
    cursor: 'pointer',
  };
  
  // Apply stored position offsets using margin (doesn't conflict with CSS transforms like -translate-x-1/2)
  if (transform.x) {
    transformStyle.marginLeft = `${transform.x}px`;
  }
  if (transform.y) {
    transformStyle.marginTop = `${transform.y}px`;
  }
  if (transform.rotate) {
    // Rotation still needs transform, but we append to existing
    transformStyle.transform = `rotate(${transform.rotate}deg)`;
  }
  if (transform.width) {
    transformStyle.width = `${transform.width}px`;
  }
  if (transform.height) {
    transformStyle.height = `${transform.height}px`;
  }

  // Save transform and notify parent
  const saveTransform = (newTransform: ElementTransform) => {
    setTransform(newTransform);
    if (onTransformChange) {
      onTransformChange(elementId, newTransform);
    }
  };

  return (
    <>
      <div
        ref={targetRef}
        className={`moveable-target ${className} ${isSelected ? 'selected' : ''}`}
        data-element-id={elementId}
        data-element-type={elementType}
        onClick={handleClick}
        style={transformStyle}
      >
        {/* Element type label when selected */}
        {isSelected && (
          <div 
            className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-0.5 rounded font-medium capitalize z-[1000]"
            style={{ pointerEvents: 'none' }}
          >
            {elementType}
          </div>
        )}
        {children}
      </div>

      {/* Moveable controls - only render when selected */}
      {isSelected && targetRef.current && (
        <Moveable
          target={targetRef.current}
          draggable={true}
          resizable={true}
          rotatable={true}
          throttleDrag={0}
          throttleResize={0}
          throttleRotate={0}
          renderDirections={['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']}
          rotationPosition="top"
          origin={false}
          
          onDrag={({ target, beforeTranslate }) => {
            // Use margin for positioning to avoid conflicting with CSS transforms
            target.style.marginLeft = `${beforeTranslate[0]}px`;
            target.style.marginTop = `${beforeTranslate[1]}px`;
          }}
          onDragEnd={({ target, lastEvent }) => {
            if (lastEvent) {
              const newTransform = {
                ...transform,
                x: lastEvent.beforeTranslate[0],
                y: lastEvent.beforeTranslate[1],
              };
              saveTransform(newTransform);
            }
          }}

          onResize={({ target, width, height, drag }) => {
            target.style.width = `${width}px`;
            target.style.height = `${height}px`;
            target.style.marginLeft = `${drag.beforeTranslate[0]}px`;
            target.style.marginTop = `${drag.beforeTranslate[1]}px`;
          }}
          onResizeEnd={({ target, lastEvent }) => {
            if (lastEvent) {
              const newTransform = {
                ...transform,
                x: lastEvent.drag.beforeTranslate[0],
                y: lastEvent.drag.beforeTranslate[1],
                width: lastEvent.width,
                height: lastEvent.height,
              };
              saveTransform(newTransform);
            }
          }}

          onRotate={({ target, beforeRotate }) => {
            target.style.transform = `rotate(${beforeRotate}deg)`;
          }}
          onRotateEnd={({ target, lastEvent }) => {
            if (lastEvent) {
              const newTransform = {
                ...transform,
                rotate: lastEvent.beforeRotate,
              };
              saveTransform(newTransform);
            }
          }}
        />
      )}
    </>
  );
}
