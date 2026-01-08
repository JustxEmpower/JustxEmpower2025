import { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Underline, Type, Palette, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';

// Predefined font sizes
const FONT_SIZES = [
  { value: '', label: 'Default' },
  { value: '12px', label: '12px' },
  { value: '14px', label: '14px' },
  { value: '16px', label: '16px' },
  { value: '18px', label: '18px' },
  { value: '20px', label: '20px' },
  { value: '24px', label: '24px' },
  { value: '28px', label: '28px' },
  { value: '32px', label: '32px' },
  { value: '36px', label: '36px' },
  { value: '40px', label: '40px' },
  { value: '48px', label: '48px' },
  { value: '56px', label: '56px' },
  { value: '64px', label: '64px' },
  { value: '72px', label: '72px' },
];

// Predefined colors
const PRESET_COLORS = [
  '#000000', // Black
  '#1a1a1a', // Near Black
  '#333333', // Dark Gray
  '#666666', // Gray
  '#999999', // Light Gray
  '#ffffff', // White
  '#8B7355', // JE Gold/Brown
  '#C4A77D', // JE Light Gold
  '#4A3728', // JE Dark Brown
  '#2C1810', // JE Deep Brown
  '#1E3A5F', // Navy
  '#4A5568', // Slate
  '#2D3748', // Dark Slate
  '#718096', // Cool Gray
  '#E2E8F0', // Light Gray
  '#F7FAFC', // Off White
];

interface TextFormatToolbarProps {
  contentId: number;
  onStyleChange?: (styles: { 
    isBold: boolean; 
    isItalic: boolean; 
    isUnderline: boolean;
    fontSize?: string;
    fontColor?: string;
  }) => void;
  size?: 'sm' | 'md';
  showSizeColor?: boolean;
}

export default function TextFormatToolbar({ 
  contentId,
  onStyleChange,
  size = 'sm',
  showSizeColor = true
}: TextFormatToolbarProps) {
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [fontSize, setFontSize] = useState('');
  const [fontColor, setFontColor] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const sizeDropdownRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Fetch existing styles for this content item
  const { data: styleData } = trpc.contentTextStyles.get.useQuery(
    { contentId },
    { enabled: !!contentId }
  );

  // Mutation to save styles
  const utils = trpc.useUtils();
  const saveMutation = trpc.contentTextStyles.save.useMutation({
    onSuccess: () => {
      utils.contentTextStyles.get.invalidate({ contentId });
    },
  });

  // Load existing styles when data arrives
  useEffect(() => {
    if (styleData) {
      setIsBold(styleData.isBold);
      setIsItalic(styleData.isItalic);
      setIsUnderline(styleData.isUnderline);
      setFontSize(styleData.fontSize || '');
      setFontColor(styleData.fontColor || '');
    }
  }, [styleData]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(event.target as Node)) {
        setShowSizeDropdown(false);
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveStyles = async (updates: {
    isBold?: boolean;
    isItalic?: boolean;
    isUnderline?: boolean;
    fontSize?: string;
    fontColor?: string;
  }) => {
    const newStyles = {
      isBold: updates.isBold ?? isBold,
      isItalic: updates.isItalic ?? isItalic,
      isUnderline: updates.isUnderline ?? isUnderline,
      fontSize: updates.fontSize ?? fontSize,
      fontColor: updates.fontColor ?? fontColor,
    };

    // Notify parent of style change
    onStyleChange?.(newStyles);

    // Save to database
    setIsLoading(true);
    try {
      await saveMutation.mutateAsync({
        contentId,
        ...newStyles,
      });
    } catch (error) {
      console.error('Failed to save text style:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (type: 'bold' | 'italic' | 'underline') => {
    let newValue: boolean;
    
    switch (type) {
      case 'bold':
        newValue = !isBold;
        setIsBold(newValue);
        await saveStyles({ isBold: newValue });
        break;
      case 'italic':
        newValue = !isItalic;
        setIsItalic(newValue);
        await saveStyles({ isItalic: newValue });
        break;
      case 'underline':
        newValue = !isUnderline;
        setIsUnderline(newValue);
        await saveStyles({ isUnderline: newValue });
        break;
    }
  };

  const handleFontSizeChange = async (newSize: string) => {
    setFontSize(newSize);
    setShowSizeDropdown(false);
    await saveStyles({ fontSize: newSize });
  };

  const handleColorChange = async (newColor: string) => {
    setFontColor(newColor);
    await saveStyles({ fontColor: newColor });
  };

  const buttonSize = size === 'sm' ? 'p-1.5' : 'p-2';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className={cn(
      "inline-flex items-center gap-1 rounded-md p-0.5 border transition-all flex-wrap",
      isLoading ? "opacity-50 pointer-events-none" : "",
      "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
    )}>
      {/* Bold Button */}
      <button
        type="button"
        onClick={() => handleToggle('bold')}
        disabled={isLoading}
        className={cn(
          "rounded transition-all duration-200 relative",
          buttonSize,
          isBold 
            ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md ring-2 ring-neutral-900/20 dark:ring-white/20" 
            : "text-neutral-400 dark:text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200"
        )}
        title="Bold"
      >
        <Bold className={iconSize} strokeWidth={isBold ? 3 : 2} />
        {isBold && (
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
        )}
      </button>

      {/* Italic Button */}
      <button
        type="button"
        onClick={() => handleToggle('italic')}
        disabled={isLoading}
        className={cn(
          "rounded transition-all duration-200 relative",
          buttonSize,
          isItalic 
            ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md ring-2 ring-neutral-900/20 dark:ring-white/20" 
            : "text-neutral-400 dark:text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200"
        )}
        title="Italic"
      >
        <Italic className={iconSize} strokeWidth={isItalic ? 3 : 2} />
        {isItalic && (
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
        )}
      </button>

      {/* Underline Button */}
      <button
        type="button"
        onClick={() => handleToggle('underline')}
        disabled={isLoading}
        className={cn(
          "rounded transition-all duration-200 relative",
          buttonSize,
          isUnderline 
            ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md ring-2 ring-neutral-900/20 dark:ring-white/20" 
            : "text-neutral-400 dark:text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200"
        )}
        title="Underline"
      >
        <Underline className={iconSize} strokeWidth={isUnderline ? 3 : 2} />
        {isUnderline && (
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
        )}
      </button>

      {showSizeColor && (
        <>
          {/* Separator */}
          <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600 mx-0.5" />

          {/* Font Size Dropdown */}
          <div className="relative" ref={sizeDropdownRef}>
            <button
              type="button"
              onClick={() => setShowSizeDropdown(!showSizeDropdown)}
              disabled={isLoading}
              className={cn(
                "rounded transition-all duration-200 flex items-center gap-1",
                buttonSize,
                fontSize 
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md" 
                  : "text-neutral-400 dark:text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200"
              )}
              title="Font Size"
            >
              <Type className={iconSize} />
              <span className="text-xs min-w-[28px]">{fontSize || 'Size'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {showSizeDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto min-w-[100px]">
                {FONT_SIZES.map((sizeOption) => (
                  <button
                    key={sizeOption.value}
                    type="button"
                    onClick={() => handleFontSizeChange(sizeOption.value)}
                    className={cn(
                      "w-full px-3 py-1.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors",
                      fontSize === sizeOption.value && "bg-neutral-100 dark:bg-neutral-700 font-medium"
                    )}
                  >
                    {sizeOption.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Color Picker */}
          <div className="relative" ref={colorPickerRef}>
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              disabled={isLoading}
              className={cn(
                "rounded transition-all duration-200 flex items-center gap-1",
                buttonSize,
                fontColor 
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md" 
                  : "text-neutral-400 dark:text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200"
              )}
              title="Font Color"
            >
              <Palette className={iconSize} />
              {fontColor && (
                <span 
                  className="w-3 h-3 rounded-full border border-neutral-300"
                  style={{ backgroundColor: fontColor }}
                />
              )}
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50 p-3 min-w-[200px]">
                {/* Preset Colors Grid */}
                <div className="grid grid-cols-8 gap-1 mb-3">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorChange(color)}
                      className={cn(
                        "w-5 h-5 rounded border-2 transition-all hover:scale-110",
                        fontColor === color ? "border-blue-500 ring-2 ring-blue-200" : "border-neutral-300 dark:border-neutral-600"
                      )}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                
                {/* Custom Color Input */}
                <div className="flex items-center gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <label className="text-xs text-neutral-500">Custom:</label>
                  <input
                    type="color"
                    value={fontColor || '#000000'}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-neutral-300"
                  />
                  <input
                    type="text"
                    value={fontColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-600 rounded bg-transparent"
                  />
                </div>
                
                {/* Clear Button */}
                {fontColor && (
                  <button
                    type="button"
                    onClick={() => handleColorChange('')}
                    className="w-full mt-2 px-2 py-1 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                  >
                    Clear Color
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
