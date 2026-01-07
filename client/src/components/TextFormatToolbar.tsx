import { useState, useEffect } from 'react';
import { Bold, Italic, Underline } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';

interface TextFormatToolbarProps {
  contentId: number;
  onStyleChange?: (styles: { isBold: boolean; isItalic: boolean; isUnderline: boolean }) => void;
  size?: 'sm' | 'md';
}

export default function TextFormatToolbar({ 
  contentId,
  onStyleChange,
  size = 'sm'
}: TextFormatToolbarProps) {
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    }
  }, [styleData]);

  const handleToggle = async (type: 'bold' | 'italic' | 'underline') => {
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

    // Notify parent of style change
    onStyleChange?.({
      isBold: newBold,
      isItalic: newItalic,
      isUnderline: newUnderline,
    });

    // Save to database
    setIsLoading(true);
    try {
      await saveMutation.mutateAsync({
        contentId,
        isBold: newBold,
        isItalic: newItalic,
        isUnderline: newUnderline,
      });
    } catch (error) {
      console.error('Failed to save text style:', error);
      // Revert on error
      switch (type) {
        case 'bold': setIsBold(!newBold); break;
        case 'italic': setIsItalic(!newItalic); break;
        case 'underline': setIsUnderline(!newUnderline); break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const buttonSize = size === 'sm' ? 'p-1.5' : 'p-2';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className={cn(
      "inline-flex items-center gap-0.5 rounded-md p-0.5 border transition-all",
      isLoading ? "opacity-50 pointer-events-none" : "",
      "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
    )}>
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
    </div>
  );
}
