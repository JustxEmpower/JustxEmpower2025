import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Check, Type, Loader2, Sparkles, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FontOption {
  name: string;
  category: string;
  googleFont: boolean;
  style: string;
}

// Font category colors matching the SectionVisualizer style
const categoryStyles = {
  serif: { 
    borderColor: 'border-purple-400', 
    bgColor: 'bg-purple-50', 
    textColor: 'text-purple-700',
    accentColor: 'bg-purple-400',
    hoverBg: 'hover:bg-purple-50',
    selectedBg: 'bg-purple-100',
    selectedBorder: 'border-purple-500'
  },
  'sans-serif': { 
    borderColor: 'border-indigo-400', 
    bgColor: 'bg-indigo-50', 
    textColor: 'text-indigo-700',
    accentColor: 'bg-indigo-400',
    hoverBg: 'hover:bg-indigo-50',
    selectedBg: 'bg-indigo-100',
    selectedBorder: 'border-indigo-500'
  },
};

export default function FontSelector() {
  const [selectedHeadingFont, setSelectedHeadingFont] = useState('Cormorant Garamond');
  const [selectedBodyFont, setSelectedBodyFont] = useState('Inter');
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current font settings
  const { data: fontSettings, isLoading: loadingSettings } = trpc.fontSettings.get.useQuery();
  
  // Fetch available fonts
  const { data: availableFonts } = trpc.fontSettings.availableFonts.useQuery();
  
  // Update mutation
  const updateMutation = trpc.fontSettings.update.useMutation({
    onSuccess: () => {
      toast.success('Typography settings saved!');
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error('Failed to save: ' + error.message);
    },
  });

  // Update local state when settings load
  useEffect(() => {
    if (fontSettings) {
      setSelectedHeadingFont(fontSettings.headingFont);
      setSelectedBodyFont(fontSettings.bodyFont);
    }
  }, [fontSettings]);

  // Load Google Fonts dynamically
  useEffect(() => {
    if (availableFonts) {
      const fontNames = availableFonts
        .filter(f => f.googleFont)
        .map(f => f.name.replace(/ /g, '+') + ':ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700')
        .join('&family=');
      
      const linkId = 'google-fonts-preview';
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

  const handleFontChange = (type: 'heading' | 'body', fontName: string) => {
    if (type === 'heading') {
      setSelectedHeadingFont(fontName);
    } else {
      setSelectedBodyFont(fontName);
    }
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate({
      headingFont: selectedHeadingFont,
      bodyFont: selectedBodyFont,
    });
  };

  const serifFonts = availableFonts?.filter(f => f.category === 'serif') || [];
  const sansFonts = availableFonts?.filter(f => f.category === 'sans-serif') || [];

  if (loadingSettings) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex items-center gap-2 text-neutral-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading typography settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-neutral-500" />
          <div>
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
              SITE TYPOGRAPHY
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase">
              Unsaved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all",
              hasChanges 
                ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
            )}
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            Save
          </button>
        </div>
      </div>

      {/* Font Indicator Dots */}
      <div className="flex gap-1 mb-4">
        <div className={cn(
          "w-3 h-3 rounded-full transition-colors",
          selectedHeadingFont ? 'bg-purple-500' : 'bg-purple-200'
        )} title="Heading Font" />
        <div className={cn(
          "w-3 h-3 rounded-full transition-colors",
          selectedBodyFont ? 'bg-indigo-500' : 'bg-indigo-200'
        )} title="Body Font" />
      </div>

      {/* Live Preview */}
      <div className="mb-4 p-4 rounded-lg bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-1 mb-2">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Live Preview</span>
        </div>
        <h3 
          className="text-xl mb-1 text-neutral-800 dark:text-neutral-200 italic" 
          style={{ fontFamily: `"${selectedHeadingFont}", serif` }}
        >
          Catalyzing the Rise of Her
        </h3>
        <p 
          className="text-sm text-neutral-600 dark:text-neutral-400"
          style={{ fontFamily: `"${selectedBodyFont}", sans-serif` }}
        >
          Where empowerment becomes embodiment. Discover your potential.
        </p>
      </div>

      {/* Heading Font Section */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-sm bg-purple-400" />
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Heading Font</span>
          <span className="text-[10px] text-purple-600 font-medium ml-auto">{selectedHeadingFont}</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
          {serifFonts.map((font) => (
            <button
              key={font.name}
              onClick={() => handleFontChange('heading', font.name)}
              className={cn(
                "w-full text-left p-2 rounded-lg border-2 border-l-4 transition-all text-sm",
                selectedHeadingFont === font.name
                  ? "bg-purple-50 border-purple-300 border-l-purple-500 shadow-sm"
                  : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 border-l-purple-300 hover:bg-purple-50/50"
              )}
              style={{ fontFamily: `"${font.name}", serif` }}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "truncate text-xs",
                  selectedHeadingFont === font.name ? "text-purple-700 font-medium" : "text-neutral-700 dark:text-neutral-300"
                )}>
                  {font.name}
                </span>
                {selectedHeadingFont === font.name && (
                  <Check className="w-3 h-3 text-purple-500 flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Body Font Section */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-sm bg-indigo-400" />
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Body Font</span>
          <span className="text-[10px] text-indigo-600 font-medium ml-auto">{selectedBodyFont}</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
          {sansFonts.map((font) => (
            <button
              key={font.name}
              onClick={() => handleFontChange('body', font.name)}
              className={cn(
                "w-full text-left p-2 rounded-lg border-2 border-l-4 transition-all text-sm",
                selectedBodyFont === font.name
                  ? "bg-indigo-50 border-indigo-300 border-l-indigo-500 shadow-sm"
                  : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 border-l-indigo-300 hover:bg-indigo-50/50"
              )}
              style={{ fontFamily: `"${font.name}", sans-serif` }}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "truncate text-xs",
                  selectedBodyFont === font.name ? "text-indigo-700 font-medium" : "text-neutral-700 dark:text-neutral-300"
                )}>
                  {font.name}
                </span>
                {selectedBodyFont === font.name && (
                  <Check className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Font Categories Legend */}
      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
        <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide mb-2">Font Categories</h4>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-purple-400" />
            <span className="text-[9px] text-neutral-500">Serif (Headings)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-indigo-400" />
            <span className="text-[9px] text-neutral-500">Sans-Serif (Body)</span>
          </div>
        </div>
      </div>

      {/* Currently Selected */}
      <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
        <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide mb-1">Active Typography</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-xs text-neutral-700 dark:text-neutral-300" style={{ fontFamily: `"${selectedHeadingFont}", serif` }}>
              {selectedHeadingFont}
            </span>
            <span className="text-[9px] text-neutral-400">headings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-xs text-neutral-700 dark:text-neutral-300" style={{ fontFamily: `"${selectedBodyFont}", sans-serif` }}>
              {selectedBodyFont}
            </span>
            <span className="text-[9px] text-neutral-400">body text</span>
          </div>
        </div>
      </div>
    </div>
  );
}
