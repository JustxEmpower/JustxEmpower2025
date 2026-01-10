import React, { useState, useRef, useEffect } from 'react';
import { usePageBuilderStore } from './usePageBuilderStore';

interface InlineEditableTextProps {
  blockId: string;
  fieldName: string;
  value: string;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  as?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'div';
  multiline?: boolean;
}

export function InlineEditableText({
  blockId,
  fieldName,
  value,
  placeholder = 'Click to edit...',
  className = '',
  style,
  as: Component = 'p',
  multiline = false,
}: InlineEditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const { updateBlock, isPreviewMode } = usePageBuilderStore();

  // Update local state when prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isPreviewMode) return;
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      updateBlock(blockId, { [fieldName]: editValue });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isPreviewMode) {
    return (
      <Component className={className} style={style}>
        {value || placeholder}
      </Component>
    );
  }

  if (isEditing) {
    const inputStyle: React.CSSProperties = {
      ...style,
      background: 'transparent',
      border: '2px dashed #3b82f6',
      borderRadius: '4px',
      outline: 'none',
      width: '100%',
      resize: multiline ? 'vertical' : 'none',
      minHeight: multiline ? '80px' : 'auto',
      padding: '4px 8px',
      font: 'inherit',
      color: 'inherit',
      textAlign: 'inherit',
    };

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={className}
          style={inputStyle}
          placeholder={placeholder}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={className}
        style={inputStyle}
        placeholder={placeholder}
      />
    );
  }

  return (
    <Component
      className={`${className} cursor-text hover:outline hover:outline-2 hover:outline-dashed hover:outline-blue-400 hover:outline-offset-2 transition-all`}
      style={style}
      onDoubleClick={handleDoubleClick}
      title="Double-click to edit"
    >
      {value || <span className="text-neutral-400 italic">{placeholder}</span>}
    </Component>
  );
}

export default InlineEditableText;
