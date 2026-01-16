import { useState, useEffect, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Check, Type, Loader2, Sparkles, Save, Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentItem {
  id: number;
  page: string;
  section: string;
  contentKey: string;
  contentValue: string;
}

interface FontSelectorEnhancedProps {
  content: ContentItem[];
  selectedPage: string;
  activeSection: string | null;
}

interface Font {
  name: string;
  category: string;
  googleFont: boolean;
  style: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'serif': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
  'sans-serif': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  'display': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' },
  'script': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-300' },
  'monospace': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' },
};

export default function FontSelectorEnhanced({ content, selectedPage, activeSection }: FontSelectorEnhancedProps) {
  const [selectedPrimaryFont, setSelectedPrimaryFont] = useState('Cormorant Garamond');
  const [selectedSecondaryFont, setSelectedSecondaryFont] = useState('Inter');
  const [hasChanges, setHasChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<'primary' | 'secondary' | null>('primary');

  // Fetch current font settings
  const { data: fontSettings, isLoading: loadingSettings, refetch: refetchFontSettings } = trpc.fontSettings.get.useQuery();
  
  // Fetch available fonts
  const { data: availableFonts } = trpc.fontSettings.availableFonts.useQuery();
  
  // Update mutation
  const utils = trpc.useUtils();
  const updateMutation = trpc.fontSettings.update.useMutation({
    onSuccess: () => {
      toast.success('Typography saved! Fonts updated site-wide.');
      setHasChanges(false);
      utils.fontSettings.get.invalidate();
      refetchFontSettings();
      applyFontsToDocument(selectedPrimaryFont, selectedSecondaryFont);
    },
    onError: (error) => {
      toast.error('Failed to save: ' + error.message);
    },
  });

  // Filter fonts based on search and category
  const filteredFonts = useMemo(() => {
    if (!availableFonts) return [];
    
    return availableFonts.filter((font: Font) => {
      const matchesSearch = !searchQuery || 
        font.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        font.style.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || font.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [availableFonts, searchQuery, selectedCategory]);

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

  // Get category counts
  const categoryCounts = useMemo(() => {
    if (!availableFonts) return {};
    const counts: Record<string, number> = {};
    availableFonts.forEach((font: Font) => {
      counts[font.category] = (counts[font.category] || 0) + 1;
    });
    return counts;
  }, [availableFonts]);

  // Preview content
  const previewContent = useMemo(() => {
    if (!content || content.length === 0) {
      return { heading: 'Typography Preview', body: 'Select fonts to preview how they look together.' };
    }
    const sectionContent = activeSection ? content.filter(c => c.section === activeSection) : content;
    const headingItem = sectionContent.find(item => 
      item.contentKey.toLowerCase().includes('title') || item.contentKey.toLowerCase().includes('heading')
    );
    const bodyItem = sectionContent.find(item => 
      item.contentKey.toLowerCase().includes('description') || item.contentKey.toLowerCase().includes('text')
    );
    return {
      heading: headingItem?.contentValue?.substring(0, 50) || 'Page Title',
      body: bodyItem?.contentValue?.substring(0, 120) || 'Content preview text',
    };
  }, [content, activeSection]);

  // Update state when settings load
  useEffect(() => {
    if (fontSettings) {
      setSelectedPrimaryFont(fontSettings.headingFont);
      setSelectedSecondaryFont(fontSettings.bodyFont);
      applyFontsToDocument(fontSettings.headingFont, fontSettings.bodyFont);
    }
  }, [fontSettings]);

  // Load Google Fonts
  useEffect(() => {
    if (availableFonts && availableFonts.length > 0) {
      const fontNames = availableFonts
        .filter((f: Font) => f.googleFont)
        .map((f: Font) => f.name.replace(/ /g, '+') + ':wght@300;400;500;600;700')
        .join('&family=');
      
      const linkId = 'google-fonts-enhanced';
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

  const applyFontsToDocument = (primaryFont: string, secondaryFont: string) => {
    const styleId = 'site-font-styles-enhanced';
    let style = document.getElementById(styleId) as HTMLStyleElement;

    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    style.textContent = `
      :root {
        --font-primary: "${primaryFont}", serif;
        --font-secondary: "${secondaryFont}", sans-serif;
      }
      h1, h2, h3, h4, h5, h6, .font-serif, .font-heading, .font-primary {
        font-family: var(--font-primary) !important;
      }
      body, p, .font-sans, .font-body, .font-secondary {
        font-family: var(--font-secondary);
      }
    `;
  };

  const handleFontSelect = (type: 'primary' | 'secondary', fontName: string) => {
    if (type === 'primary') {
      setSelectedPrimaryFont(fontName);
      applyFontsToDocument(fontName, selectedSecondaryFont);
    } else {
      setSelectedSecondaryFont(fontName);
      applyFontsToDocument(selectedPrimaryFont, fontName);
    }
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate({
      headingFont: selectedPrimaryFont,
      bodyFont: selectedSecondaryFont,
    });
  };

  const totalFonts = availableFonts?.length || 0;

  if (loadingSettings) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex items-center gap-2 text-neutral-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading fonts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-neutral-500" />
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
              TYPOGRAPHY
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-500">
              {totalFonts} fonts
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase animate-pulse">
                Unsaved
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges || updateMutation.isPending}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                hasChanges 
                  ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm" 
                  : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
              )}
            >
              {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search fonts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-600" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-2 py-1 text-[10px] font-medium rounded-full transition-all",
              !selectedCategory 
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" 
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            )}
          >
            All ({totalFonts})
          </button>
          {Object.entries(categoryCounts).map(([category, count]) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
              className={cn(
                "px-2 py-1 text-[10px] font-medium rounded-full transition-all capitalize",
                selectedCategory === category 
                  ? `${CATEGORY_COLORS[category]?.bg || 'bg-neutral-200'} ${CATEGORY_COLORS[category]?.text || 'text-neutral-700'}` 
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              )}
            >
              {category} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      <div className="p-4 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-1 mb-2">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Live Preview</span>
        </div>
        <h3 
          className="text-xl mb-2 text-neutral-800 dark:text-neutral-200 leading-tight" 
          style={{ fontFamily: `"${selectedPrimaryFont}", serif` }}
        >
          {previewContent.heading}
        </h3>
        <p 
          className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed"
          style={{ fontFamily: `"${selectedSecondaryFont}", sans-serif` }}
        >
          {previewContent.body}
        </p>
        <div className="flex gap-4 mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-[10px] text-neutral-500">Primary: <strong className="text-neutral-700 dark:text-neutral-300">{selectedPrimaryFont}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[10px] text-neutral-500">Secondary: <strong className="text-neutral-700 dark:text-neutral-300">{selectedSecondaryFont}</strong></span>
          </div>
        </div>
      </div>

      {/* Primary Font Section */}
      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <button
          onClick={() => setExpandedSection(expandedSection === 'primary' ? null : 'primary')}
          className="w-full p-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase">Primary Font</span>
            <span className="text-[10px] text-purple-600 font-medium">{selectedPrimaryFont}</span>
          </div>
          {expandedSection === 'primary' ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </button>
        
        {expandedSection === 'primary' && (
          <div className="p-3 pt-0 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-2 gap-1.5">
              {filteredFonts.map((font: Font) => (
                <button
                  key={`primary-${font.name}`}
                  onClick={() => handleFontSelect('primary', font.name)}
                  className={cn(
                    "w-full text-left p-2 rounded-lg border-2 transition-all",
                    selectedPrimaryFont === font.name
                      ? "bg-purple-50 border-purple-400 shadow-sm"
                      : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-purple-300"
                  )}
                >
                  <span 
                    className={cn("block text-sm truncate", selectedPrimaryFont === font.name ? "text-purple-700 font-medium" : "text-neutral-700 dark:text-neutral-300")}
                    style={{ fontFamily: `"${font.name}", ${font.category}` }}
                  >
                    {font.name}
                  </span>
                  <span className={cn("text-[9px] capitalize", CATEGORY_COLORS[font.category]?.text || 'text-neutral-400')}>
                    {font.category} • {font.style}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Secondary Font Section */}
      <div>
        <button
          onClick={() => setExpandedSection(expandedSection === 'secondary' ? null : 'secondary')}
          className="w-full p-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase">Secondary Font</span>
            <span className="text-[10px] text-blue-600 font-medium">{selectedSecondaryFont}</span>
          </div>
          {expandedSection === 'secondary' ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </button>
        
        {expandedSection === 'secondary' && (
          <div className="p-3 pt-0 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-2 gap-1.5">
              {filteredFonts.map((font: Font) => (
                <button
                  key={`secondary-${font.name}`}
                  onClick={() => handleFontSelect('secondary', font.name)}
                  className={cn(
                    "w-full text-left p-2 rounded-lg border-2 transition-all",
                    selectedSecondaryFont === font.name
                      ? "bg-blue-50 border-blue-400 shadow-sm"
                      : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-blue-300"
                  )}
                >
                  <span 
                    className={cn("block text-sm truncate", selectedSecondaryFont === font.name ? "text-blue-700 font-medium" : "text-neutral-700 dark:text-neutral-300")}
                    style={{ fontFamily: `"${font.name}", ${font.category}` }}
                  >
                    {font.name}
                  </span>
                  <span className={cn("text-[9px] capitalize", CATEGORY_COLORS[font.category]?.text || 'text-neutral-400')}>
                    {font.category} • {font.style}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
        <p className="text-[10px] text-neutral-500 text-center">
          Any font can be used for any section • Changes apply site-wide
        </p>
      </div>
    </div>
  );
}
