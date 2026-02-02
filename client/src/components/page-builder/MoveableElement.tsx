import React, { useRef, useState, useEffect } from 'react';
import Moveable from 'react-moveable';

interface MoveableElementProps {
  children: React.ReactNode;
  elementId: string;
  elementType?: string;
  className?: string;
  onTransform?: (transform: {
    translate: [number, number];
    rotate: number;
    scale: [number, number];
    width: number;
    height: number;
  }) => void;
}

/**
 * MoveableElement - Wraps elements with moveable-target class for CSS-based borders.
 * CSS in index.css handles the visual borders via [data-element-edit-mode="true"] .moveable-target selector.
 * When selected, Moveable library provides drag/resize/rotate controls.
 */
export default function MoveableElement({
  children,
  elementId,
  elementType = 'element',
  className = '',
  onTransform,
}: MoveableElementProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [isSelected, setIsSelected] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSelected(true);
  };

  // Click outside to deselect
  useEffect(() => {
    if (!isSelected) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (targetRef.current && !targetRef.current.contains(e.target as Node)) {
        // Check if clicking on moveable controls
        const target = e.target as HTMLElement;
        if (target.closest('.moveable-control') || target.closest('.moveable-line')) {
          return;
        }
        setIsSelected(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSelected]);

  return (
    <>
      <div
        ref={targetRef}
        className={`moveable-target ${className} ${isSelected ? 'selected' : ''}`}
        data-element-id={elementId}
        data-element-type={elementType}
        onClick={handleClick}
        style={{
          position: 'relative',
          cursor: 'pointer',
        }}
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
          scalable={false}
          keepRatio={false}
          throttleDrag={1}
          throttleResize={1}
          throttleRotate={1}
          renderDirections={['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']}
          rotationPosition="top"
          origin={false}
          padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
          edge={false}
          
          onDrag={({ target, left, top }) => {
            target.style.left = `${left}px`;
            target.style.top = `${top}px`;
          }}
          onDragEnd={({ target }) => {
            if (onTransform && targetRef.current) {
              onTransform({
                translate: [parseFloat(target.style.left) || 0, parseFloat(target.style.top) || 0],
                rotate: 0,
                scale: [1, 1],
                width: targetRef.current.offsetWidth,
                height: targetRef.current.offsetHeight,
              });
            }
          }}

          onResize={({ target, width, height, delta }) => {
            target.style.width = `${width}px`;
            target.style.height = `${height}px`;
          }}
          onResizeEnd={() => {
            if (onTransform && targetRef.current) {
              onTransform({
                translate: [0, 0],
                rotate: 0,
                scale: [1, 1],
                width: targetRef.current.offsetWidth,
                height: targetRef.current.offsetHeight,
              });
            }
          }}

          onRotate={({ target, transform }) => {
            target.style.transform = transform;
          }}
          onRotateEnd={() => {
            if (onTransform && targetRef.current) {
              onTransform({
                translate: [0, 0],
                rotate: 0,
                scale: [1, 1],
                width: targetRef.current.offsetWidth,
                height: targetRef.current.offsetHeight,
              });
            }
          }}
        />
      )}
    </>
  );
}
