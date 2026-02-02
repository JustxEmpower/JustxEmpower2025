import React, { useRef, useEffect, useState } from 'react';
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
 * MoveableElement - Uses react-moveable library for drag, resize, rotate functionality.
 * This component wraps any element and provides MS Word/Photoshop-like manipulation.
 * 
 * The element is only editable when the body has 'element-edit-mode-active' class.
 */
export default function MoveableElement({
  children,
  elementId,
  elementType = 'element',
  className = '',
  onTransform,
}: MoveableElementProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [frame, setFrame] = useState({
    translate: [0, 0] as [number, number],
    rotate: 0,
    scale: [1, 1] as [number, number],
  });

  // Watch for body class changes to enable/disable edit mode
  useEffect(() => {
    const checkEditMode = () => {
      const hasClass = document.body.classList.contains('element-edit-mode-active');
      setIsEditMode(hasClass);
      if (!hasClass) {
        setIsSelected(false);
      }
    };
    
    checkEditMode();
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkEditMode();
        }
      });
    });
    
    observer.observe(document.body, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Click outside to deselect
  useEffect(() => {
    if (!isEditMode) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (targetRef.current && !targetRef.current.contains(e.target as Node)) {
        setIsSelected(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditMode]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setIsSelected(true);
  };

  // Build transform string
  const transformStyle = `translate(${frame.translate[0]}px, ${frame.translate[1]}px) rotate(${frame.rotate}deg) scale(${frame.scale[0]}, ${frame.scale[1]})`;

  return (
    <>
      <div
        ref={targetRef}
        className={`moveable-target ${className} ${isEditMode ? 'cursor-pointer' : ''}`}
        data-element-id={elementId}
        data-element-type={elementType}
        onClick={handleClick}
        style={{
          display: 'inline-block',
          position: 'relative',
          transform: transformStyle,
          // Show border when in edit mode
          outline: isEditMode 
            ? (isSelected ? '3px solid #3b82f6' : '2px dashed #ff00ff') 
            : 'none',
          outlineOffset: '2px',
          boxShadow: isEditMode && isSelected 
            ? '0 0 0 4px rgba(59, 130, 246, 0.3)' 
            : (isEditMode ? '0 0 0 2px rgba(255, 0, 255, 0.2)' : 'none'),
          backgroundColor: isEditMode && isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
          borderRadius: '4px',
          transition: isSelected ? 'none' : 'outline 0.2s, box-shadow 0.2s',
        }}
      >
        {/* Element type label when selected */}
        {isEditMode && isSelected && (
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
      {isEditMode && isSelected && targetRef.current && (
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
            target.style.transform = `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px) rotate(${frame.rotate}deg) scale(${frame.scale[0]}, ${frame.scale[1]})`;
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
            target.style.transform = `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px) rotate(${frame.rotate}deg) scale(${frame.scale[0]}, ${frame.scale[1]})`;
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
            target.style.transform = `translate(${frame.translate[0]}px, ${frame.translate[1]}px) rotate(${beforeRotate}deg) scale(${frame.scale[0]}, ${frame.scale[1]})`;
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
