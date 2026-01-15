import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Strikethrough,
  Heading1,
  Heading2,
  Quote,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingToolbarProps {
  containerRef?: React.RefObject<HTMLElement>;
  onFormatChange?: (format: string, value?: string) => void;
}

interface ToolbarPosition {
  top: number;
  left: number;
  visible: boolean;
}

// Format button component
function FormatButton({ 
  icon: Icon, 
  label, 
  active = false, 
  onClick,
  shortcut,
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  active?: boolean;
  onClick: () => void;
  shortcut?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-1.5 rounded transition-colors',
        active 
          ? 'bg-primary text-white' 
          : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
      )}
      title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

// Separator component
function Separator() {
  return <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-600 mx-1" />;
}

export function FloatingToolbar({ containerRef, onFormatChange }: FloatingToolbarProps) {
  const [position, setPosition] = useState<ToolbarPosition>({ top: 0, left: 0, visible: false });
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Check current selection formatting
  const checkActiveFormats = useCallback(() => {
    const formats = new Set<string>();
    
    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('underline')) formats.add('underline');
    if (document.queryCommandState('strikeThrough')) formats.add('strikethrough');
    if (document.queryCommandState('insertUnorderedList')) formats.add('list');
    if (document.queryCommandState('insertOrderedList')) formats.add('orderedList');
    if (document.queryCommandState('justifyLeft')) formats.add('alignLeft');
    if (document.queryCommandState('justifyCenter')) formats.add('alignCenter');
    if (document.queryCommandState('justifyRight')) formats.add('alignRight');
    
    setActiveFormats(formats);
  }, []);

  // Update toolbar position based on selection
  const updatePosition = useCallback(() => {
    const selection = window.getSelection();
    
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setPosition(prev => ({ ...prev, visible: false }));
      return;
    }

    // Check if selection is within an editable element
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const editableParent = (container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element)
      ?.closest('[contenteditable="true"], textarea, input, [data-editable="true"]');
    
    if (!editableParent) {
      setPosition(prev => ({ ...prev, visible: false }));
      return;
    }

    const rect = range.getBoundingClientRect();
    const toolbarWidth = 320; // Approximate toolbar width
    const toolbarHeight = 40;
    
    // Calculate position above the selection
    let top = rect.top - toolbarHeight - 8 + window.scrollY;
    let left = rect.left + (rect.width / 2) - (toolbarWidth / 2) + window.scrollX;
    
    // Keep toolbar within viewport
    left = Math.max(10, Math.min(left, window.innerWidth - toolbarWidth - 10));
    
    // If toolbar would be above viewport, show below selection
    if (top < window.scrollY + 10) {
      top = rect.bottom + 8 + window.scrollY;
    }

    setPosition({ top, left, visible: true });
    checkActiveFormats();
  }, [checkActiveFormats]);

  // Handle selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      // Debounce the update
      requestAnimationFrame(updatePosition);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleSelectionChange);
    };
  }, [updatePosition]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      
      const key = e.key.toLowerCase();
      
      switch (key) {
        case 'b':
          e.preventDefault();
          applyFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          applyFormat('italic');
          break;
        case 'u':
          e.preventDefault();
          applyFormat('underline');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Apply formatting
  const applyFormat = (format: string) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    // Execute the command
    switch (format) {
      case 'bold':
        document.execCommand('bold', false);
        break;
      case 'italic':
        document.execCommand('italic', false);
        break;
      case 'underline':
        document.execCommand('underline', false);
        break;
      case 'strikethrough':
        document.execCommand('strikeThrough', false);
        break;
      case 'list':
        document.execCommand('insertUnorderedList', false);
        break;
      case 'orderedList':
        document.execCommand('insertOrderedList', false);
        break;
      case 'alignLeft':
        document.execCommand('justifyLeft', false);
        break;
      case 'alignCenter':
        document.execCommand('justifyCenter', false);
        break;
      case 'alignRight':
        document.execCommand('justifyRight', false);
        break;
      case 'h1':
        document.execCommand('formatBlock', false, 'h1');
        break;
      case 'h2':
        document.execCommand('formatBlock', false, 'h2');
        break;
      case 'quote':
        document.execCommand('formatBlock', false, 'blockquote');
        break;
    }

    // Update active formats
    checkActiveFormats();
    
    // Notify parent
    onFormatChange?.(format);
  };

  return (
    <AnimatePresence>
      {position.visible && (
        <motion.div
          ref={toolbarRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[9999] bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 p-1 flex items-center gap-0.5"
          style={{
            top: position.top,
            left: position.left,
          }}
          onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
        >
          {/* Text Style */}
          <FormatButton 
            icon={Bold} 
            label="Bold" 
            shortcut="Ctrl+B"
            active={activeFormats.has('bold')}
            onClick={() => applyFormat('bold')} 
          />
          <FormatButton 
            icon={Italic} 
            label="Italic" 
            shortcut="Ctrl+I"
            active={activeFormats.has('italic')}
            onClick={() => applyFormat('italic')} 
          />
          <FormatButton 
            icon={Underline} 
            label="Underline" 
            shortcut="Ctrl+U"
            active={activeFormats.has('underline')}
            onClick={() => applyFormat('underline')} 
          />
          <FormatButton 
            icon={Strikethrough} 
            label="Strikethrough" 
            active={activeFormats.has('strikethrough')}
            onClick={() => applyFormat('strikethrough')} 
          />

          <Separator />

          {/* Headings */}
          <FormatButton 
            icon={Heading1} 
            label="Heading 1" 
            onClick={() => applyFormat('h1')} 
          />
          <FormatButton 
            icon={Heading2} 
            label="Heading 2" 
            onClick={() => applyFormat('h2')} 
          />
          <FormatButton 
            icon={Quote} 
            label="Quote" 
            onClick={() => applyFormat('quote')} 
          />

          <Separator />

          {/* Lists */}
          <FormatButton 
            icon={List} 
            label="Bullet List" 
            active={activeFormats.has('list')}
            onClick={() => applyFormat('list')} 
          />
          <FormatButton 
            icon={ListOrdered} 
            label="Numbered List" 
            active={activeFormats.has('orderedList')}
            onClick={() => applyFormat('orderedList')} 
          />

          <Separator />

          {/* Alignment */}
          <FormatButton 
            icon={AlignLeft} 
            label="Align Left" 
            active={activeFormats.has('alignLeft')}
            onClick={() => applyFormat('alignLeft')} 
          />
          <FormatButton 
            icon={AlignCenter} 
            label="Align Center" 
            active={activeFormats.has('alignCenter')}
            onClick={() => applyFormat('alignCenter')} 
          />
          <FormatButton 
            icon={AlignRight} 
            label="Align Right" 
            active={activeFormats.has('alignRight')}
            onClick={() => applyFormat('alignRight')} 
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FloatingToolbar;
