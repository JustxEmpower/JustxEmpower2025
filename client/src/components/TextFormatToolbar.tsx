import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bold, Italic, Underline, Type, Palette, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';

// Available fonts for per-field override
const AVAILABLE_FONTS = [
  { value: '', label: 'Default (Site Font)' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond', category: 'serif' },
  { value: 'Playfair Display', label: 'Playfair Display', category: 'serif' },
  { value: 'Libre Baskerville', label: 'Libre Baskerville', category: 'serif' },
  { value: 'Lora', label: 'Lora', category: 'serif' },
  { value: 'Crimson Text', label: 'Crimson Text', category: 'serif' },
  { value: 'EB Garamond', label: 'EB Garamond', category: 'serif' },
  { value: 'Merriweather', label: 'Merriweather', category: 'serif' },
  { value: 'Source Serif Pro', label: 'Source Serif Pro', category: 'serif' },
  { value: 'Inter', label: 'Inter', category: 'sans-serif' },
  { value: 'Open Sans', label: 'Open Sans', category: 'sans-serif' },
  { value: 'Lato', label: 'Lato', category: 'sans-serif' },
  { value: 'Montserrat', label: 'Montserrat', category: 'sans-serif' },
  { value: 'Poppins', label: 'Poppins', category: 'sans-serif' },
  { value: 'Roboto', label: 'Roboto', category: 'sans-serif' },
  { value: 'Work Sans', label: 'Work Sans', category: 'sans-serif' },
];

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

// Expanded color palette with 36 colors organized by category
const PRESET_COLORS = [
  // Row 1: Grayscale
  '#000000', '#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080',
  '#999999', '#b3b3b3', '#cccccc', '#e6e6e6', '#f2f2f2', '#ffffff',
  
  // Row 2: Warm colors (reds, oranges, yellows)
  '#8B0000', '#DC143C', '#FF4500', '#FF6347', '#FF8C00', '#FFA500',
  '#FFD700', '#FFFF00', '#F0E68C', '#BDB76B', '#DAA520', '#B8860B',
  
  // Row 3: Cool colors (greens, blues, purples)
  '#006400', '#228B22', '#32CD32', '#90EE90', '#008B8B', '#20B2AA',
  '#4169E1', '#1E90FF', '#87CEEB', '#9370DB', '#8B008B', '#4B0082',
  
  // Row 4: Brand & Neutral colors (JE colors + pastels)
  '#8B7355', '#C4A77D', '#4A3728', '#2C1810', '#1E3A5F', '#4A5568',
  '#2D3748', '#718096', '#E2E8F0', '#F7FAFC', '#FFF5EE', '#FAF0E6',
];

// Color names for tooltips
const COLOR_NAMES: Record<string, string> = {
  '#000000': 'Black',
  '#1a1a1a': 'Near Black',
  '#333333': 'Dark Gray',
  '#4d4d4d': 'Charcoal',
  '#666666': 'Gray',
  '#808080': 'Medium Gray',
  '#999999': 'Light Gray',
  '#b3b3b3': 'Silver',
  '#cccccc': 'Pale Gray',
  '#e6e6e6': 'Very Light Gray',
  '#f2f2f2': 'Off White',
  '#ffffff': 'White',
  '#8B0000': 'Dark Red',
  '#DC143C': 'Crimson',
  '#FF4500': 'Orange Red',
  '#FF6347': 'Tomato',
  '#FF8C00': 'Dark Orange',
  '#FFA500': 'Orange',
  '#FFD700': 'Gold',
  '#FFFF00': 'Yellow',
  '#F0E68C': 'Khaki',
  '#BDB76B': 'Dark Khaki',
  '#DAA520': 'Goldenrod',
  '#B8860B': 'Dark Goldenrod',
  '#006400': 'Dark Green',
  '#228B22': 'Forest Green',
  '#32CD32': 'Lime Green',
  '#90EE90': 'Light Green',
  '#008B8B': 'Dark Cyan',
  '#20B2AA': 'Light Sea Green',
  '#4169E1': 'Royal Blue',
  '#1E90FF': 'Dodger Blue',
  '#87CEEB': 'Sky Blue',
  '#9370DB': 'Medium Purple',
  '#8B008B': 'Dark Magenta',
  '#4B0082': 'Indigo',
  '#8B7355': 'JE Gold/Brown',
  '#C4A77D': 'JE Light Gold',
  '#4A3728': 'JE Dark Brown',
  '#2C1810': 'JE Deep Brown',
  '#1E3A5F': 'Navy',
  '#4A5568': 'Slate',
  '#2D3748': 'Dark Slate',
  '#718096': 'Cool Gray',
  '#E2E8F0': 'Light Slate',
  '#F7FAFC': 'Off White',
  '#FFF5EE': 'Seashell',
  '#FAF0E6': 'Linen',
};

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
  const [fontOverride, setFontOverride] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  
  const sizeDropdownRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const sizeButtonRef = useRef<HTMLButtonElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const fontButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch existing styles for this content item
  const { data: styleData } = trpc.contentTextStyles.get.useQuery(
    { contentId },
    { enabled: !!contentId }
  );

  // Mutation to save styles
  const utils = trpc.useUtils();
  const saveMutation = trpc.contentTextStyles.save.useMutation({
    onSuccess: (data) => {
      console.log('[TextFormatToolbar] Style saved successfully for contentId:', contentId, data);
      utils.contentTextStyles.get.invalidate({ contentId });
      // Also invalidate public content styles cache so live site picks up changes
      utils.content.getTextStylesByPage.invalidate();
    },
    onError: (error) => {
      console.error('[TextFormatToolbar] Failed to save style for contentId:', contentId, error);
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
      setFontOverride(styleData.fontOverride || '');
    }
  }, [styleData]);

  // Calculate dropdown position when opening
  const updateDropdownPosition = (buttonRef: React.RefObject<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Calculate position - prefer below the button, but flip if not enough space
      let top = rect.bottom + 4;
      let left = rect.left;
      
      // Check if dropdown would go off the right edge (assume 280px width for color picker)
      if (left + 280 > viewportWidth) {
        left = viewportWidth - 290;
      }
      
      // Check if dropdown would go off the bottom (assume 400px height for color picker)
      if (top + 400 > viewportHeight) {
        top = rect.top - 404; // Position above instead
      }
      
      setDropdownPosition({ top, left });
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(event.target as Node) &&
          sizeButtonRef.current && !sizeButtonRef.current.contains(event.target as Node)) {
        setShowSizeDropdown(false);
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node) &&
          colorButtonRef.current && !colorButtonRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target as Node) &&
          fontButtonRef.current && !fontButtonRef.current.contains(event.target as Node)) {
        setShowFontDropdown(false);
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
    fontOverride?: string;
  }) => {
    const newStyles = {
      isBold: updates.isBold ?? isBold,
      isItalic: updates.isItalic ?? isItalic,
      isUnderline: updates.isUnderline ?? isUnderline,
      fontSize: updates.fontSize ?? fontSize,
      fontColor: updates.fontColor ?? fontColor,
      fontOverride: updates.fontOverride ?? fontOverride,
    };

    // Notify parent of style change
    onStyleChange?.(newStyles);

    // Save to database
    setIsLoading(true);
    console.log('[TextFormatToolbar] Saving styles for contentId:', contentId, newStyles);
    try {
      await saveMutation.mutateAsync({
        contentId,
        ...newStyles,
      });
    } catch (error) {
      console.error('[TextFormatToolbar] Failed to save text style:', error);
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

  const handleFontChange = async (newFont: string) => {
    setFontOverride(newFont);
    setShowFontDropdown(false);
    await saveStyles({ fontOverride: newFont });
  };

  const handleFontButtonClick = () => {
    if (!showFontDropdown) {
      updateDropdownPosition(fontButtonRef);
    }
    setShowFontDropdown(!showFontDropdown);
    setShowSizeDropdown(false);
    setShowColorPicker(false);
  };

  const handleColorChange = async (newColor: string) => {
    setFontColor(newColor);
    await saveStyles({ fontColor: newColor });
  };

  const handleSizeButtonClick = () => {
    if (!showSizeDropdown) {
      updateDropdownPosition(sizeButtonRef);
    }
    setShowSizeDropdown(!showSizeDropdown);
    setShowColorPicker(false);
  };

  const handleColorButtonClick = () => {
    if (!showColorPicker) {
      updateDropdownPosition(colorButtonRef);
    }
    setShowColorPicker(!showColorPicker);
    setShowSizeDropdown(false);
  };

  const buttonSize = size === 'sm' ? 'p-1.5' : 'p-2';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  // Get current font display name
  const currentFontLabel = fontOverride 
    ? AVAILABLE_FONTS.find(f => f.value === fontOverride)?.label || fontOverride
    : 'Font';

  // Render font dropdown using portal
  const renderFontDropdown = () => {
    if (!showFontDropdown) return null;
    
    return createPortal(
      <div 
        ref={fontDropdownRef}
        className="fixed bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl z-[9999] max-h-80 overflow-y-auto min-w-[200px]"
        style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
      >
        <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
          Select Font
        </div>
        {AVAILABLE_FONTS.map((fontOption) => (
          <button
            key={fontOption.value}
            type="button"
            onClick={() => handleFontChange(fontOption.value)}
            className={cn(
              "w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors",
              fontOverride === fontOption.value && "bg-neutral-100 dark:bg-neutral-700 font-medium"
            )}
            style={{ fontFamily: fontOption.value || 'inherit' }}
          >
            {fontOption.label}
          </button>
        ))}
      </div>,
      document.body
    );
  };

  // Render dropdown using portal to avoid overflow issues
  const renderSizeDropdown = () => {
    if (!showSizeDropdown) return null;
    
    return createPortal(
      <div 
        ref={sizeDropdownRef}
        className="fixed bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl z-[9999] max-h-64 overflow-y-auto min-w-[100px]"
        style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
      >
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
      </div>,
      document.body
    );
  };

  // Render color picker using portal to avoid overflow issues
  const renderColorPicker = () => {
    if (!showColorPicker) return null;
    
    return createPortal(
      <div 
        ref={colorPickerRef}
        className="fixed bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl z-[9999] p-4 w-[280px]"
        style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
      >
        {/* Color Grid Header */}
        <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
          Select a color ({PRESET_COLORS.length} colors)
        </div>
        
        {/* Preset Colors Grid - 12 columns for better organization */}
        <div className="grid grid-cols-12 gap-1 mb-3">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleColorChange(color)}
              className={cn(
                "w-5 h-5 rounded border-2 transition-all hover:scale-125 hover:z-10",
                fontColor === color 
                  ? "border-blue-500 ring-2 ring-blue-200 scale-110" 
                  : "border-neutral-300 dark:border-neutral-600 hover:border-neutral-400"
              )}
              style={{ backgroundColor: color }}
              title={COLOR_NAMES[color] || color}
            />
          ))}
        </div>
        
        {/* Category Labels */}
        <div className="grid grid-cols-4 gap-1 text-[9px] text-neutral-400 mb-3">
          <span>Grayscale</span>
          <span>Warm</span>
          <span>Cool</span>
          <span>Brand</span>
        </div>
        
        {/* Custom Color Input */}
        <div className="flex items-center gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-700">
          <label className="text-xs text-neutral-500 whitespace-nowrap">Custom:</label>
          <input
            type="color"
            value={fontColor || '#000000'}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-neutral-300 flex-shrink-0"
          />
          <input
            type="text"
            value={fontColor}
            onChange={(e) => handleColorChange(e.target.value)}
            placeholder="#000000"
            className="flex-1 px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-600 rounded bg-transparent min-w-0"
          />
        </div>
        
        {/* Clear Button */}
        {fontColor && (
          <button
            type="button"
            onClick={() => handleColorChange('')}
            className="w-full mt-2 px-2 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors border border-neutral-200 dark:border-neutral-700"
          >
            Clear Color
          </button>
        )}
      </div>,
      document.body
    );
  };

  return (
    <>
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

            {/* Font Selector */}
            <button
              ref={fontButtonRef}
              type="button"
              onClick={handleFontButtonClick}
              disabled={isLoading}
              className={cn(
                "rounded transition-all duration-200 flex items-center gap-1",
                buttonSize,
                fontOverride 
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md" 
                  : "text-neutral-400 dark:text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200"
              )}
              title="Font Family"
              style={{ fontFamily: fontOverride || 'inherit' }}
            >
              <span className="text-xs max-w-[80px] truncate">{currentFontLabel}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Font Size Dropdown */}
            <button
              ref={sizeButtonRef}
              type="button"
              onClick={handleSizeButtonClick}
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

            {/* Color Picker */}
            <button
              ref={colorButtonRef}
              type="button"
              onClick={handleColorButtonClick}
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
          </>
        )}
      </div>

      {/* Render dropdowns via portal */}
      {renderFontDropdown()}
      {renderSizeDropdown()}
      {renderColorPicker()}
    </>
  );
}
