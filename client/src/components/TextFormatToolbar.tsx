import { useState, useEffect } from 'react';
import { Bold, Italic, Underline } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextFormatToolbarProps {
  value?: { isBold?: boolean; isItalic?: boolean; isUnderline?: boolean };
  onChange?: (styles: { isBold: boolean; isItalic: boolean; isUnderline: boolean }) => void;
  size?: 'sm' | 'md';
}

export default function TextFormatToolbar({ 
  value = { isBold: false, isItalic: false, isUnderline: false },
  onChange,
  size = 'sm'
}: TextFormatToolbarProps) {
  const [isBold, setIsBold] = useState(value.isBold || false);
  const [isItalic, setIsItalic] = useState(value.isItalic || false);
  const [isUnderline, setIsUnderline] = useState(value.isUnderline || false);

  // Sync with external value
  useEffect(() => {
    setIsBold(value.isBold || false);
    setIsItalic(value.isItalic || false);
    setIsUnderline(value.isUnderline || false);
  }, [value]);

  const handleToggle = (type: 'bold' | 'italic' | 'underline') => {
    let newBold = isBold;
    let newItalic = isItalic;
    let newUnderline = isUnderline;

    switch (type) {
      case 'bold':
        newBold = !isBold;
        setIsBold(newBold);
        break;
      case 'italic':
        newItalic = !isItalic;
        setIsItalic(newItalic);
        break;
      case 'underline':
        newUnderline = !isUnderline;
        setIsUnderline(newUnderline);
        break;
    }

    onChange?.({
      isBold: newBold,
      isItalic: newItalic,
      isUnderline: newUnderline,
    });
  };

  const buttonSize = size === 'sm' ? 'p-1' : 'p-1.5';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div className="inline-flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-md p-0.5 border border-neutral-200 dark:border-neutral-700">
      <button
        type="button"
        onClick={() => handleToggle('bold')}
        className={cn(
          "rounded transition-all duration-150",
          buttonSize,
          isBold 
            ? "bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 shadow-sm" 
            : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200"
        )}
        title="Bold (Ctrl+B)"
      >
        <Bold className={iconSize} strokeWidth={isBold ? 3 : 2} />
      </button>
      <button
        type="button"
        onClick={() => handleToggle('italic')}
        className={cn(
          "rounded transition-all duration-150",
          buttonSize,
          isItalic 
            ? "bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 shadow-sm" 
            : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200"
        )}
        title="Italic (Ctrl+I)"
      >
        <Italic className={iconSize} strokeWidth={isItalic ? 3 : 2} />
      </button>
      <button
        type="button"
        onClick={() => handleToggle('underline')}
        className={cn(
          "rounded transition-all duration-150",
          buttonSize,
          isUnderline 
            ? "bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 shadow-sm" 
            : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200"
        )}
        title="Underline (Ctrl+U)"
      >
        <Underline className={iconSize} strokeWidth={isUnderline ? 3 : 2} />
      </button>
    </div>
  );
}
