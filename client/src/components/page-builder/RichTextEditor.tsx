/**
 * Rich Text Editor with Font Controls
 * 
 * A simple, API-key-free rich text editor for the page builder.
 * Uses native browser contentEditable with custom toolbar.
 * Fetches full 134 font library from backend API.
 */

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Link, Type, Palette, Search, Subscript, Superscript, Highlighter, Quote, Minus, Undo, Redo, RemoveFormatting } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '@/lib/trpc';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  className?: string;
}

interface Font {
  name: string;
  category: string;
  googleFont: boolean;
  style: string;
}

// Category fallbacks for font-family CSS
const CATEGORY_FALLBACKS: Record<string, string> = {
  'serif': 'serif',
  'sans-serif': 'sans-serif',
  'display': 'sans-serif',
  'script': 'cursive',
  'monospace': 'monospace',
};

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
  { value: '42px', label: '42' },
  { value: '48px', label: '48' },
  { value: '56px', label: '56' },
  { value: '64px', label: '64' },
  { value: '72px', label: '72' },
];

const COLORS = [
  '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
  '#ff0000', '#ff6600', '#ffcc00', '#00ff00', '#00ccff', '#0066ff',
  '#6600ff', '#cc00ff', '#ff0066', '#663300', '#006633', '#003366',
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  height = 150,
  className = '',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [fontSearch, setFontSearch] = useState('');
  const [fontPopoverOpen, setFontPopoverOpen] = useState(false);
  const [sizePopoverOpen, setSizePopoverOpen] = useState(false);
  const [selectedFont, setSelectedFont] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  // Save selection before opening popover (selection is lost when clicking outside editor)
  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  }, []);

  // Restore saved selection
  const restoreSelection = useCallback(() => {
    if (savedSelectionRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelectionRef.current);
      }
    }
  }, []);

  // Fetch fonts from backend API
  const { data: availableFonts } = trpc.fontSettings.availableFonts.useQuery();

  // Filter fonts based on search
  const filteredFonts = useMemo(() => {
    if (!availableFonts) return [];
    if (!fontSearch) return availableFonts;
    return availableFonts.filter((font: Font) =>
      font.name.toLowerCase().includes(fontSearch.toLowerCase()) ||
      font.category.toLowerCase().includes(fontSearch.toLowerCase())
    );
  }, [availableFonts, fontSearch]);

  // Group fonts by category
  const fontsByCategory = useMemo(() => {
    const grouped: Record<string, Font[]> = {};
    filteredFonts.forEach((font: Font) => {
      if (!grouped[font.category]) {
        grouped[font.category] = [];
      }
      grouped[font.category].push(font);
    });
    return grouped;
  }, [filteredFonts]);

  // Load Google Fonts dynamically
  useEffect(() => {
    if (availableFonts && availableFonts.length > 0) {
      const googleFonts = availableFonts.filter((f: Font) => f.googleFont);
      const fontNames = googleFonts
        .map((f: Font) => f.name.replace(/ /g, '+') + ':wght@300;400;500;600;700')
        .join('&family=');
      
      const linkId = 'rich-text-editor-fonts';
      let link = document.getElementById(linkId) as HTMLLinkElement;
      
      if (!link) {
        link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      
      link.href = `https://fonts.googleapis.com/css2?family=${fontNames}&display=swap`;
    }
  }, [availableFonts]);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      // Don't update if it's just the placeholder
      if (html !== '<br>' && html !== '') {
        onChange(html);
      } else {
        onChange('');
      }
    }
  }, [onChange]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleFontFamily = (font: Font) => {
    const fallback = CATEGORY_FALLBACKS[font.category] || 'sans-serif';
    const fontFamily = `"${font.name}", ${fallback}`;
    
    // Load the Google Font immediately so it displays in the editor
    if (font.googleFont) {
      const fontNameEncoded = font.name.replace(/ /g, '+');
      const linkId = `google-font-${font.name.replace(/[^a-z0-9]/gi, '')}`;
      let link = document.getElementById(linkId) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontNameEncoded}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap`;
        document.head.appendChild(link);
        console.log('[RichTextEditor] Loading Google Font:', font.name);
      }
    }
    
    // Restore the saved selection first (it was lost when clicking the popover)
    restoreSelection();
    
    // Use CSS styling instead of deprecated fontName command
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      console.log('[RichTextEditor] Applying font:', font.name, 'to selection collapsed:', range.collapsed);
      
      if (!range.collapsed) {
        // Extract the selected content
        const fragment = range.extractContents();
        const span = document.createElement('span');
        span.style.fontFamily = fontFamily;
        span.appendChild(fragment);
        range.insertNode(span);
        
        // Re-select the content
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        selection.addRange(newRange);
        
        console.log('[RichTextEditor] Font applied, HTML:', editorRef.current?.innerHTML);
        handleInput();
      } else {
        console.log('[RichTextEditor] Selection is collapsed, cannot apply font');
      }
    } else {
      console.log('[RichTextEditor] No selection found');
    }
    
    setSelectedFont(font.name);
    setFontPopoverOpen(false);
    setFontSearch('');
  };

  const handleFontSize = (size: string) => {
    // Restore the saved selection first
    restoreSelection();
    
    // Use CSS styling instead of deprecated fontSize command
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (!range.collapsed) {
        const fragment = range.extractContents();
        const span = document.createElement('span');
        span.style.fontSize = size;
        span.appendChild(fragment);
        range.insertNode(span);
        handleInput();
      }
    }
    setSelectedSize(size);
    setSizePopoverOpen(false);
  };

  const handleColor = (color: string) => {
    execCommand('foreColor', color);
  };

  const handleHighlight = (color: string) => {
    execCommand('hiliteColor', color);
  };

  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  return (
    <div className={`rich-text-editor border rounded-md overflow-hidden bg-white dark:bg-neutral-900 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-neutral-50 dark:bg-neutral-800">
        {/* Font Family - Searchable Popover */}
        <Popover open={fontPopoverOpen} onOpenChange={(open) => {
          if (open) saveSelection(); // Save selection when opening popover
          setFontPopoverOpen(open);
        }}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-[140px] h-8 text-xs justify-between font-normal">
              <span className="truncate" style={{ fontFamily: selectedFont || 'inherit' }}>
                {selectedFont || 'Font'}
              </span>
              <Type className="h-3 w-3 ml-1 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search fonts..."
                  value={fontSearch}
                  onChange={(e) => setFontSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="p-2">
                {Object.entries(fontsByCategory).map(([category, fonts]) => (
                  <div key={category} className="mb-3">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-2">
                      {category} ({fonts.length})
                    </div>
                    {fonts.map((font: Font) => (
                      <button
                        key={font.name}
                        onClick={() => handleFontFamily(font)}
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors"
                        style={{ fontFamily: `"${font.name}", ${CATEGORY_FALLBACKS[font.category] || 'sans-serif'}` }}
                      >
                        {font.name}
                      </button>
                    ))}
                  </div>
                ))}
                {filteredFonts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No fonts found</p>
                )}
              </div>
            </ScrollArea>
            <div className="p-2 border-t text-xs text-muted-foreground text-center">
              {availableFonts?.length || 0} fonts available
            </div>
          </PopoverContent>
        </Popover>

        {/* Font Size - Popover */}
        <Popover open={sizePopoverOpen} onOpenChange={(open) => {
          if (open) saveSelection();
          setSizePopoverOpen(open);
        }}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-[70px] h-8 text-xs justify-between font-normal">
              {selectedSize ? selectedSize.replace('px', '') : 'Size'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[100px] p-1" align="start">
            <ScrollArea className="h-[200px]">
              {FONT_SIZES.map((size) => (
                <button
                  key={size.value}
                  onClick={() => handleFontSize(size.value)}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors"
                >
                  {size.label}px
                </button>
              ))}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />

        {/* Text Formatting */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand('bold')} title="Bold (Ctrl+B)">
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand('italic')} title="Italic (Ctrl+I)">
          <Italic className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand('underline')} title="Underline (Ctrl+U)">
          <Underline className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand('strikeThrough')} title="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand('subscript')} title="Subscript">
          <Subscript className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand('superscript')} title="Superscript">
          <Superscript className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />

        {/* Text Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Text Color">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" side="bottom" align="start" sideOffset={5}>
            <div className="grid grid-cols-6 gap-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border border-neutral-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColor(color)}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Highlight/Background Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Highlight Color">
              <Highlighter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" side="bottom" align="start" sideOffset={5}>
            <div className="grid grid-cols-6 gap-1">
              {['#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ff6600', '#ff0066', '#ffffff', '#f0f0f0', '#e0e0e0', '#d0d0d0', '#c0c0c0', 'transparent'].map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border border-neutral-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color === 'transparent' ? 'white' : color, backgroundImage: color === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none', backgroundSize: '8px 8px', backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px' }}
                  onClick={() => handleHighlight(color)}
                  title={color === 'transparent' ? 'Remove Highlight' : color}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />

        {/* Alignment */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand('justifyLeft')} title="Align Left">
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand('justifyCenter')} title="Align Center">
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand('justifyRight')} title="Align Right">
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand('justifyFull')} title="Justify">
          <AlignJustify className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />

        {/* Lists */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand('insertUnorderedList')} title="Bullet List">
          <List className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand('insertOrderedList')} title="Numbered List">
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />

        {/* Link */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleLink} title="Insert Link">
          <Link className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />

        {/* Block Quote & Horizontal Rule */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand('formatBlock', 'blockquote')} title="Block Quote">
          <Quote className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand('insertHorizontalRule')} title="Horizontal Line">
          <Minus className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-1" />

        {/* Undo/Redo & Clear Formatting */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand('undo')} title="Undo (Ctrl+Z)">
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand('redo')} title="Redo (Ctrl+Y)">
          <Redo className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand('removeFormat')} title="Clear Formatting">
          <RemoveFormatting className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        contentEditable
        className="p-3 outline-none prose prose-sm max-w-none dark:prose-invert"
        style={{ minHeight: height, maxHeight: height * 2, overflowY: 'auto' }}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      <style>{`
        .rich-text-editor [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
