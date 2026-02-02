import React, { useState, useRef } from 'react';
import { Move, Trash2 } from 'lucide-react';
import { usePageBuilderStore } from './usePageBuilderStore';

interface EditableWrapperProps {
  children: React.ReactNode;
  elementId: string;
  elementType?: string;
  className?: string;
}

/**
 * Simple wrapper that shows editing borders when isElementEditMode is true.
 * Reads directly from the Zustand store to avoid prop drilling issues.
 */
export default function EditableWrapper({
  children,
  elementId,
  elementType = 'element',
  className = '',
}: EditableWrapperProps) {
  // Read isElementEditMode directly from store
  const isElementEditMode = usePageBuilderStore((state) => state.isElementEditMode);
  const [isSelected, setIsSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // If not in element edit mode, just render children
  if (!isElementEditMode) {
    return <>{children}</>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSelected(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelected) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newX = moveEvent.clientX - dragStart.current.x;
      const newY = moveEvent.clientY - dragStart.current.y;
      setOffset({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Click outside to deselect
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsSelected(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        transform: offset.x !== 0 || offset.y !== 0 ? `translate(${offset.x}px, ${offset.y}px)` : undefined,
        cursor: isDragging ? 'grabbing' : 'pointer',
        // Bright magenta/cyan borders that cannot be missed
        outline: isSelected ? '4px solid #3b82f6' : '3px dashed #ff00ff',
        outlineOffset: '2px',
        boxShadow: isSelected 
          ? '0 0 0 6px rgba(59, 130, 246, 0.4), inset 0 0 0 2px rgba(59, 130, 246, 0.3)' 
          : '0 0 0 4px rgba(255, 0, 255, 0.3), inset 0 0 0 2px rgba(0, 255, 255, 0.2)',
        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 0, 255, 0.05)',
        borderRadius: '4px',
        zIndex: isSelected ? 100 : 10,
      }}
      onClick={handleClick}
    >
      {children}

      {/* Controls when selected */}
      {isSelected && (
        <div 
          className="absolute -top-8 left-0 flex items-center gap-1 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg z-[200]"
          style={{ pointerEvents: 'auto' }}
        >
          <button
            className="p-1 hover:bg-blue-600 rounded cursor-move"
            onMouseDown={handleMouseDown}
            title="Drag to move"
          >
            <Move className="w-3 h-3" />
          </button>
          <span className="capitalize font-medium">{elementType}</span>
        </div>
      )}
    </div>
  );
}
