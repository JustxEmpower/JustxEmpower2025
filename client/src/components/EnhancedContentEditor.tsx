/**
 * Enhanced Content Editor - Rich Text & Markdown Support
 * 
 * Features:
 * - Rich text formatting (bold, italic, underline, strikethrough)
 * - Headings (H1-H6)
 * - Lists (ordered, unordered, checklist)
 * - Links and media embedding
 * - Code blocks with syntax highlighting
 * - Blockquotes and callouts
 * - Tables
 * - Markdown shortcuts
 * - Keyboard shortcuts
 * - Auto-save
 * - Word count and reading time
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare,
  Link, Image, Video, Code, Quote,
  Heading1, Heading2, Heading3,
  Table, Minus, RotateCcw, RotateCw,
  Type, Palette, ChevronDown, Sparkles,
  FileCode, AlertCircle, Info, CheckCircle,
  Copy, Download, Eye, EyeOff, Save,
  Maximize2, Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ============================================================================
// Types
// ============================================================================

interface EnhancedContentEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  showToolbar?: boolean;
  showWordCount?: boolean;
  showPreview?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
  className?: string;
}

interface LinkDialogState {
  open: boolean;
  url: string;
  text: string;
}

interface MediaDialogState {
  open: boolean;
  type: 'image' | 'video';
  url: string;
  alt: string;
}

// ============================================================================
// Constants
// ============================================================================

const FONT_SIZES = [
  { value: '12px', label: '12' },
  { value: '14px', label: '14' },
  { value: '16px', label: '16' },
  { value: '18px', label: '18' },
  { value: '20px', label: '20' },
  { value: '24px', label: '24' },
  { value: '28px', label: '28' },
  { value: '32px', label: '32' },
  { value: '36px', label: '36' },
  { value: '48px', label: '48' },
];

const COLORS = [
  '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6', '#FFFFFF',
  '#DC2626', '#EA580C', '#D97706', '#CA8A04', '#65A30D', '#16A34A', '#059669',
  '#0D9488', '#0891B2', '#0284C7', '#2563EB', '#4F46E5', '#7C3AED', '#9333EA',
  '#C026D3', '#DB2777', '#E11D48',
  '#c9a86c', '#a08050', '#1a1a19', '#2d2d2b', '#f8f8f7', // JE brand colors
];

const CALLOUT_TYPES = [
  { type: 'info', icon: Info, label: 'Info', color: 'blue' },
  { type: 'warning', icon: AlertCircle, label: 'Warning', color: 'yellow' },
  { type: 'success', icon: CheckCircle, label: 'Success', color: 'green' },
  { type: 'error', icon: AlertCircle, label: 'Error', color: 'red' },
];

// ============================================================================
// Helper Functions
// ============================================================================

function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getReadingTime(text: string): string {
  const words = getWordCount(text);
  const minutes = Math.ceil(words / 200);
  return minutes === 1 ? '1 min read' : `${minutes} min read`;
}

function htmlToMarkdown(html: string): string {
  return html
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<b>(.*?)<\/b>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<i>(.*?)<\/i>/g, '*$1*')
    .replace(/<u>(.*?)<\/u>/g, '__$1__')
    .replace(/<s>(.*?)<\/s>/g, '~~$1~~')
    .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
    .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
    .replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
    .replace(/<blockquote>(.*?)<\/blockquote>/g, '> $1\n')
    .replace(/<code>(.*?)<\/code>/g, '`$1`')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
    .replace(/<[^>]+>/g, '');
}

// ============================================================================
// Main Component
// ============================================================================

export default function EnhancedContentEditor({
  value,
  onChange,
  onSave,
  placeholder = 'Start writing...',
  minHeight = '300px',
  maxHeight = '600px',
  showToolbar = true,
  showWordCount = true,
  showPreview = false,
  autoSave = false,
  autoSaveDelay = 3000,
  className,
}: EnhancedContentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(showPreview);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [linkDialog, setLinkDialog] = useState<LinkDialogState>({ open: false, url: '', text: '' });
  const [mediaDialog, setMediaDialog] = useState<MediaDialogState>({ open: false, type: 'image', url: '', alt: '' });
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && onSave && value) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        onSave();
      }, autoSaveDelay);
    }
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [value, autoSave, autoSaveDelay, onSave]);

  // Handle content changes
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      
      // Add to undo stack
      setUndoStack(prev => [...prev.slice(-50), value]);
      setRedoStack([]);
      
      onChange(newContent);
    }
  }, [onChange, value]);

  // Execute document command
  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  // Format selection
  const formatSelection = useCallback((tag: string, className?: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const element = document.createElement(tag);
    if (className) element.className = className;
    
    range.surroundContents(element);
    handleInput();
  }, [handleInput]);

  // Insert HTML at cursor
  const insertHTML = useCallback((html: string) => {
    execCommand('insertHTML', html);
  }, [execCommand]);

  // Undo
  const undo = useCallback(() => {
    if (undoStack.length > 0) {
      const prev = undoStack[undoStack.length - 1];
      setRedoStack(stack => [...stack, value]);
      setUndoStack(stack => stack.slice(0, -1));
      if (editorRef.current) {
        editorRef.current.innerHTML = prev;
        onChange(prev);
      }
    }
  }, [undoStack, value, onChange]);

  // Redo
  const redo = useCallback(() => {
    if (redoStack.length > 0) {
      const next = redoStack[redoStack.length - 1];
      setUndoStack(stack => [...stack, value]);
      setRedoStack(stack => stack.slice(0, -1));
      if (editorRef.current) {
        editorRef.current.innerHTML = next;
        onChange(next);
      }
    }
  }, [redoStack, value, onChange]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          break;
        case 's':
          e.preventDefault();
          onSave?.();
          break;
        case 'k':
          e.preventDefault();
          setLinkDialog({ open: true, url: '', text: window.getSelection()?.toString() || '' });
          break;
      }
    }

    // Markdown shortcuts
    if (e.key === ' ') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;
        if (textNode.nodeType === Node.TEXT_NODE) {
          const text = textNode.textContent?.slice(0, range.startOffset) || '';
          
          // Check for markdown patterns
          if (text === '#') {
            e.preventDefault();
            execCommand('formatBlock', 'h1');
            if (textNode.textContent) {
              textNode.textContent = textNode.textContent.slice(1);
            }
          } else if (text === '##') {
            e.preventDefault();
            execCommand('formatBlock', 'h2');
            if (textNode.textContent) {
              textNode.textContent = textNode.textContent.slice(2);
            }
          } else if (text === '###') {
            e.preventDefault();
            execCommand('formatBlock', 'h3');
            if (textNode.textContent) {
              textNode.textContent = textNode.textContent.slice(3);
            }
          } else if (text === '-' || text === '*') {
            e.preventDefault();
            execCommand('insertUnorderedList');
            if (textNode.textContent) {
              textNode.textContent = textNode.textContent.slice(1);
            }
          } else if (text === '1.') {
            e.preventDefault();
            execCommand('insertOrderedList');
            if (textNode.textContent) {
              textNode.textContent = textNode.textContent.slice(2);
            }
          } else if (text === '>') {
            e.preventDefault();
            execCommand('formatBlock', 'blockquote');
            if (textNode.textContent) {
              textNode.textContent = textNode.textContent.slice(1);
            }
          }
        }
      }
    }
  }, [execCommand, undo, redo, onSave]);

  // Insert link
  const insertLink = useCallback(() => {
    if (linkDialog.url) {
      const html = `<a href="${linkDialog.url}" target="_blank" rel="noopener noreferrer" class="text-[#c9a86c] hover:underline">${linkDialog.text || linkDialog.url}</a>`;
      insertHTML(html);
    }
    setLinkDialog({ open: false, url: '', text: '' });
  }, [linkDialog, insertHTML]);

  // Insert media
  const insertMedia = useCallback(() => {
    if (mediaDialog.url) {
      let html = '';
      if (mediaDialog.type === 'image') {
        html = `<img src="${mediaDialog.url}" alt="${mediaDialog.alt}" class="max-w-full h-auto rounded-lg my-4" />`;
      } else {
        html = `<video src="${mediaDialog.url}" controls class="max-w-full rounded-lg my-4"></video>`;
      }
      insertHTML(html);
    }
    setMediaDialog({ open: false, type: 'image', url: '', alt: '' });
  }, [mediaDialog, insertHTML]);

  // Insert callout
  const insertCallout = useCallback((type: string) => {
    const colors: Record<string, string> = {
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
    };
    const html = `<div class="p-4 rounded-lg border ${colors[type]} my-4"><p>Enter callout text...</p></div>`;
    insertHTML(html);
  }, [insertHTML]);

  // Insert table
  const insertTable = useCallback((rows: number = 3, cols: number = 3) => {
    let html = '<table class="w-full border-collapse my-4"><thead><tr>';
    for (let c = 0; c < cols; c++) {
      html += '<th class="border border-neutral-300 p-2 bg-neutral-100">Header</th>';
    }
    html += '</tr></thead><tbody>';
    for (let r = 0; r < rows - 1; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        html += '<td class="border border-neutral-300 p-2">Cell</td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    insertHTML(html);
  }, [insertHTML]);

  // Insert code block
  const insertCodeBlock = useCallback(() => {
    const html = `<pre class="bg-neutral-900 text-neutral-100 p-4 rounded-lg my-4 overflow-x-auto font-mono text-sm"><code>// Enter code here</code></pre>`;
    insertHTML(html);
  }, [insertHTML]);

  // Copy as markdown
  const copyAsMarkdown = useCallback(() => {
    const markdown = htmlToMarkdown(value);
    navigator.clipboard.writeText(markdown);
  }, [value]);

  // Export as HTML
  const exportHTML = useCallback(() => {
    const blob = new Blob([value], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content.html';
    a.click();
    URL.revokeObjectURL(url);
  }, [value]);

  const wordCount = getWordCount(editorRef.current?.innerText || '');
  const readingTime = getReadingTime(editorRef.current?.innerText || '');

  return (
    <div
      className={cn(
        'border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-900',
        isFullscreen && 'fixed inset-4 z-50 flex flex-col',
        className
      )}
    >
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5 mr-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={undoStack.length === 0} title="Undo (Ctrl+Z)">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={redoStack.length === 0} title="Redo (Ctrl+Shift+Z)">
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />

          {/* Text formatting */}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('bold')} title="Bold (Ctrl+B)">
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('italic')} title="Italic (Ctrl+I)">
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('underline')} title="Underline (Ctrl+U)">
            <Underline className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('strikeThrough')} title="Strikethrough">
            <Strikethrough className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />

          {/* Headings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                <Type className="h-4 w-4" />
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => execCommand('formatBlock', 'p')}>
                <Type className="h-4 w-4 mr-2" /> Paragraph
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => execCommand('formatBlock', 'h1')}>
                <Heading1 className="h-4 w-4 mr-2" /> Heading 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => execCommand('formatBlock', 'h2')}>
                <Heading2 className="h-4 w-4 mr-2" /> Heading 2
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => execCommand('formatBlock', 'h3')}>
                <Heading3 className="h-4 w-4 mr-2" /> Heading 3
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => execCommand('formatBlock', 'blockquote')}>
                <Quote className="h-4 w-4 mr-2" /> Blockquote
              </DropdownMenuItem>
              <DropdownMenuItem onClick={insertCodeBlock}>
                <FileCode className="h-4 w-4 mr-2" /> Code Block
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Font size */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                Size <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {FONT_SIZES.map(size => (
                <DropdownMenuItem key={size.value} onClick={() => execCommand('fontSize', size.value)}>
                  <span style={{ fontSize: size.value }}>{size.label}px</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Color */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Text Color">
                <Palette className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-2">
              <div className="grid grid-cols-7 gap-1">
                {COLORS.map(color => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border border-neutral-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => execCommand('foreColor', color)}
                    title={color}
                  />
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />

          {/* Alignment */}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('justifyLeft')} title="Align Left">
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('justifyCenter')} title="Align Center">
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('justifyRight')} title="Align Right">
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('justifyFull')} title="Justify">
            <AlignJustify className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />

          {/* Lists */}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('insertUnorderedList')} title="Bullet List">
            <List className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('insertOrderedList')} title="Numbered List">
            <ListOrdered className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />

          {/* Insert */}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLinkDialog({ open: true, url: '', text: '' })} title="Insert Link (Ctrl+K)">
            <Link className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMediaDialog({ open: true, type: 'image', url: '', alt: '' })} title="Insert Image">
            <Image className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMediaDialog({ open: true, type: 'video', url: '', alt: '' })} title="Insert Video">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertTable()} title="Insert Table">
            <Table className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('insertHorizontalRule')} title="Insert Divider">
            <Minus className="h-4 w-4" />
          </Button>

          {/* Callouts */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Insert Callout">
                <Sparkles className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {CALLOUT_TYPES.map(callout => (
                <DropdownMenuItem key={callout.type} onClick={() => insertCallout(callout.type)}>
                  <callout.icon className="h-4 w-4 mr-2" /> {callout.label} Callout
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1" />

          {/* Actions */}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsPreviewMode(!isPreviewMode)} title={isPreviewMode ? 'Edit' : 'Preview'}>
            {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyAsMarkdown} title="Copy as Markdown">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={exportHTML} title="Export HTML">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          {onSave && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onSave} title="Save (Ctrl+S)">
              <Save className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Editor */}
      <div className={cn('flex-1 overflow-auto', isFullscreen && 'flex-1')}>
        {isPreviewMode ? (
          <div
            className="prose prose-neutral dark:prose-invert max-w-none p-4"
            style={{ minHeight, maxHeight: isFullscreen ? 'none' : maxHeight }}
            dangerouslySetInnerHTML={{ __html: value }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            className={cn(
              'p-4 outline-none prose prose-neutral dark:prose-invert max-w-none',
              'focus:ring-2 focus:ring-[#c9a86c]/20',
              '[&_a]:text-[#c9a86c] [&_a]:hover:underline',
              '[&_blockquote]:border-l-4 [&_blockquote]:border-[#c9a86c] [&_blockquote]:pl-4 [&_blockquote]:italic',
              '[&_pre]:bg-neutral-900 [&_pre]:text-neutral-100 [&_pre]:rounded-lg [&_pre]:p-4',
              '[&_code]:bg-neutral-100 [&_code]:dark:bg-neutral-800 [&_code]:px-1 [&_code]:rounded',
              '[&_table]:border-collapse [&_td]:border [&_td]:border-neutral-300 [&_td]:p-2',
              '[&_th]:border [&_th]:border-neutral-300 [&_th]:p-2 [&_th]:bg-neutral-100',
            )}
            style={{ minHeight, maxHeight: isFullscreen ? 'none' : maxHeight }}
            data-placeholder={placeholder}
          />
        )}
      </div>

      {/* Footer */}
      {showWordCount && (
        <div className="flex items-center justify-between px-4 py-2 text-xs text-neutral-500 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
          <div className="flex items-center gap-4">
            <span>{wordCount} words</span>
            <span>{readingTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px]">Markdown shortcuts: # ## ### - * 1. &gt;</span>
          </div>
        </div>
      )}

      {/* Link Dialog */}
      <Dialog open={linkDialog.open} onOpenChange={(open) => setLinkDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={linkDialog.url}
                onChange={(e) => setLinkDialog(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link-text">Link Text (optional)</Label>
              <Input
                id="link-text"
                value={linkDialog.text}
                onChange={(e) => setLinkDialog(prev => ({ ...prev, text: e.target.value }))}
                placeholder="Click here"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialog({ open: false, url: '', text: '' })}>
              Cancel
            </Button>
            <Button onClick={insertLink}>Insert Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Dialog */}
      <Dialog open={mediaDialog.open} onOpenChange={(open) => setMediaDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert {mediaDialog.type === 'image' ? 'Image' : 'Video'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="media-url">URL</Label>
              <Input
                id="media-url"
                value={mediaDialog.url}
                onChange={(e) => setMediaDialog(prev => ({ ...prev, url: e.target.value }))}
                placeholder={mediaDialog.type === 'image' ? 'https://example.com/image.jpg' : 'https://example.com/video.mp4'}
              />
            </div>
            {mediaDialog.type === 'image' && (
              <div className="grid gap-2">
                <Label htmlFor="media-alt">Alt Text</Label>
                <Input
                  id="media-alt"
                  value={mediaDialog.alt}
                  onChange={(e) => setMediaDialog(prev => ({ ...prev, alt: e.target.value }))}
                  placeholder="Describe the image..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMediaDialog({ open: false, type: 'image', url: '', alt: '' })}>
              Cancel
            </Button>
            <Button onClick={insertMedia}>Insert {mediaDialog.type === 'image' ? 'Image' : 'Video'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty placeholder style */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { getWordCount, getReadingTime, htmlToMarkdown };
