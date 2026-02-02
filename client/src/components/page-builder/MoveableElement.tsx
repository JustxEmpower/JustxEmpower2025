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

  // Build inline style from transform
  const transformStyle: React.CSSProperties = {
    cursor: 'pointer',
  };
  
  // Apply stored transforms
  if (transform.x || transform.y || transform.rotate) {
    const parts: string[] = [];
    if (transform.x || transform.y) {
      parts.push(`translate(${transform.x || 0}px, ${transform.y || 0}px)`);
    }
    if (transform.rotate) {
      parts.push(`rotate(${transform.rotate}deg)`);
    }
    transformStyle.transform = parts.join(' ');
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
            target.style.transform = `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px)${transform.rotate ? ` rotate(${transform.rotate}deg)` : ''}`;
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
            target.style.transform = `translate(${drag.beforeTranslate[0]}px, ${drag.beforeTranslate[1]}px)${transform.rotate ? ` rotate(${transform.rotate}deg)` : ''}`;
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
            target.style.transform = `translate(${transform.x || 0}px, ${transform.y || 0}px) rotate(${beforeRotate}deg)`;
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
