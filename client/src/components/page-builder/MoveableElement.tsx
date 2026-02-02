import React, { useRef, useState } from 'react';
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
  const [frame, setFrame] = useState({
    translate: [0, 0] as [number, number],
    rotate: 0,
    scale: [1, 1] as [number, number],
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSelected(true);
  };

  // Build transform string only if there are actual transforms
  const transformStyle = frame.translate[0] !== 0 || frame.translate[1] !== 0 || frame.rotate !== 0 
    ? `translate(${frame.translate[0]}px, ${frame.translate[1]}px) rotate(${frame.rotate}deg)` 
    : undefined;

  return (
    <>
      <div
        ref={targetRef}
        className={`moveable-target ${className} ${isSelected ? 'selected' : ''}`}
        data-element-id={elementId}
        data-element-type={elementType}
        onClick={handleClick}
        style={{
          transform: transformStyle,
          borderRadius: '4px',
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
          throttleDrag={0}
          throttleResize={0}
          throttleRotate={0}
          renderDirections={['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']}
          rotationPosition="top"
          origin={false}
          padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
          
          onDragStart={({ set }) => {
            set(frame.translate);
          }}
          onDrag={({ target, beforeTranslate }) => {
            const newFrame = { ...frame, translate: beforeTranslate as [number, number] };
            setFrame(newFrame);
            target.style.transform = `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px) rotate(${frame.rotate}deg)`;
          }}
          onDragEnd={() => {
            if (onTransform && targetRef.current) {
              onTransform({
                translate: frame.translate,
                rotate: frame.rotate,
                scale: frame.scale,
                width: targetRef.current.offsetWidth,
                height: targetRef.current.offsetHeight,
              });
            }
          }}

          onResizeStart={({ setOrigin, dragStart }) => {
            setOrigin(['%', '%']);
            if (dragStart) {
              dragStart.set(frame.translate);
            }
          }}
          onResize={({ target, width, height, drag }) => {
            const beforeTranslate = drag.beforeTranslate;
            const newFrame = { ...frame, translate: beforeTranslate as [number, number] };
            setFrame(newFrame);
            target.style.width = `${width}px`;
            target.style.height = `${height}px`;
            target.style.transform = `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px) rotate(${frame.rotate}deg)`;
          }}
          onResizeEnd={() => {
            if (onTransform && targetRef.current) {
              onTransform({
                translate: frame.translate,
                rotate: frame.rotate,
                scale: frame.scale,
                width: targetRef.current.offsetWidth,
                height: targetRef.current.offsetHeight,
              });
            }
          }}

          onRotateStart={({ set }) => {
            set(frame.rotate);
          }}
          onRotate={({ target, beforeRotate }) => {
            const newFrame = { ...frame, rotate: beforeRotate };
            setFrame(newFrame);
            target.style.transform = `translate(${frame.translate[0]}px, ${frame.translate[1]}px) rotate(${beforeRotate}deg)`;
          }}
          onRotateEnd={() => {
            if (onTransform && targetRef.current) {
              onTransform({
                translate: frame.translate,
                rotate: frame.rotate,
                scale: frame.scale,
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
