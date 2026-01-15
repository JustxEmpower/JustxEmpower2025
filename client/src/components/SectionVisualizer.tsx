import { useState, useEffect } from 'react';
import { LayoutGrid } from 'lucide-react';

interface ContentItem {
  id: number;
  page: string;
  section: string;
  contentKey: string;
  contentValue: string;
}

interface SectionVisualizerProps {
  content: ContentItem[];
  selectedPage: string;
  activeSection: string | null;
  onSectionClick: (section: string) => void;
}

// Section type definitions with colors matching production
const sectionTypeStyles: Record<string, { borderColor: string; bgColor: string; textColor: string }> = {
  hero: { borderColor: 'border-red-400', bgColor: 'bg-red-50', textColor: 'text-red-700' },
  header: { borderColor: 'border-blue-400', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
  content: { borderColor: 'border-orange-400', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
  carousel: { borderColor: 'border-orange-400', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
  community: { borderColor: 'border-green-400', bgColor: 'bg-green-50', textColor: 'text-green-700' },
  grid: { borderColor: 'border-indigo-400', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
  form: { borderColor: 'border-pink-400', bgColor: 'bg-pink-50', textColor: 'text-pink-700' },
  video: { borderColor: 'border-purple-400', bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
  quote: { borderColor: 'border-teal-400', bgColor: 'bg-teal-50', textColor: 'text-teal-700' },
  cta: { borderColor: 'border-rose-400', bgColor: 'bg-rose-50', textColor: 'text-rose-700' },
  newsletter: { borderColor: 'border-cyan-400', bgColor: 'bg-cyan-50', textColor: 'text-cyan-700' },
  footer: { borderColor: 'border-gray-400', bgColor: 'bg-gray-50', textColor: 'text-gray-700' },
  'rooted-unity': { borderColor: 'border-yellow-400', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
  rootedUnity: { borderColor: 'border-yellow-400', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
  rooted: { borderColor: 'border-yellow-400', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
  pointsOfAccess: { borderColor: 'border-lime-400', bgColor: 'bg-lime-50', textColor: 'text-lime-700' },
  'points-of-access': { borderColor: 'border-lime-400', bgColor: 'bg-lime-50', textColor: 'text-lime-700' },
  principles: { borderColor: 'border-violet-400', bgColor: 'bg-violet-50', textColor: 'text-violet-700' },
  pillars: { borderColor: 'border-fuchsia-400', bgColor: 'bg-fuchsia-50', textColor: 'text-fuchsia-700' },
  philosophy: { borderColor: 'border-sky-400', bgColor: 'bg-sky-50', textColor: 'text-sky-700' },
  offerings: { borderColor: 'border-amber-400', bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
  main: { borderColor: 'border-orange-400', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
  info: { borderColor: 'border-blue-400', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
  overview: { borderColor: 'border-slate-400', bgColor: 'bg-slate-50', textColor: 'text-slate-700' },
};

// Determine section type from section name
const getSectionType = (sectionName: string): string => {
  const lowerSection = sectionName.toLowerCase();
  
  if (lowerSection.includes('hero')) return 'hero';
  if (lowerSection.includes('header')) return 'header';
  if (lowerSection.includes('newsletter')) return 'newsletter';
  if (lowerSection.includes('footer')) return 'footer';
  if (lowerSection.includes('form')) return 'form';
  if (lowerSection.includes('carousel')) return 'carousel';
  if (lowerSection.includes('community') || lowerSection.includes('emerge')) return 'community';
  if (lowerSection.includes('points') && lowerSection.includes('access')) return 'pointsOfAccess';
  if (lowerSection.includes('rooted') || lowerSection.includes('unity')) return 'rooted-unity';
  if (lowerSection.includes('principles')) return 'principles';
  if (lowerSection.includes('pillars')) return 'pillars';
  if (lowerSection.includes('quote')) return 'quote';
  if (lowerSection.includes('cta')) return 'cta';
  if (lowerSection.includes('video')) return 'video';
  if (lowerSection.includes('grid')) return 'grid';
  if (lowerSection.includes('offerings')) return 'carousel';
  if (lowerSection.includes('philosophy')) return 'content';
  if (lowerSection.includes('overview')) return 'content';
  if (lowerSection.includes('info')) return 'content';
  if (lowerSection.includes('main')) return 'content';
  
  return 'content';
};

// Get section styling
const getSectionStyle = (sectionName: string) => {
  const sectionType = getSectionType(sectionName);
  return sectionTypeStyles[sectionType] || sectionTypeStyles.content;
};

// Calculate completion percentage for a section
const calculateCompletion = (items: ContentItem[]): number => {
  if (items.length === 0) return 0;
  const filledItems = items.filter(item => item.contentValue && item.contentValue.trim() !== '');
  return Math.round((filledItems.length / items.length) * 100);
};

// Get display title from section content
const getSectionDisplayTitle = (sectionName: string, items: ContentItem[]): string => {
  // Try to find a title field in the section
  const titleItem = items.find(item => 
    item.contentKey === 'title' || 
    item.contentKey.endsWith('Title') ||
    item.contentKey === 'heading'
  );
  
  if (titleItem && titleItem.contentValue && titleItem.contentValue.trim()) {
    // Truncate long titles
    const title = titleItem.contentValue;
    return title.length > 30 ? title.substring(0, 30) + '...' : title;
  }
  
  // Format section name as fallback
  return sectionName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

export default function SectionVisualizer({ 
  content, 
  selectedPage, 
  activeSection, 
  onSectionClick 
}: SectionVisualizerProps) {
  // Group content by section while preserving order
  const groupedContent = content.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, ContentItem[]>);

  // Get ordered sections (maintain insertion order)
  const sections = Object.keys(groupedContent);
  
  // Calculate overall completion
  const totalItems = content.length;
  const filledItems = content.filter(item => item.contentValue && item.contentValue.trim() !== '').length;
  const overallCompletion = totalItems > 0 ? Math.round((filledItems / totalItems) * 100) : 0;
  const filledSections = sections.filter(s => calculateCompletion(groupedContent[s]) > 0).length;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-neutral-500" />
          <div>
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
              PAGE STRUCTURE
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">
            {filledSections}/{sections.length} sections
          </span>
          <span className={`text-sm font-bold px-2 py-0.5 rounded ${
            overallCompletion >= 90 ? 'bg-emerald-100 text-emerald-700' :
            overallCompletion >= 50 ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-700'
          }`}>
            {overallCompletion}%
          </span>
        </div>
      </div>

      {/* Traffic Light Indicator */}
      <div className="flex gap-1 mb-4">
        <div className={`w-3 h-3 rounded-full transition-colors ${
          overallCompletion < 50 ? 'bg-red-500' : 'bg-red-200'
        }`} />
        <div className={`w-3 h-3 rounded-full transition-colors ${
          overallCompletion >= 50 && overallCompletion < 90 ? 'bg-amber-500' : 'bg-amber-200'
        }`} />
        <div className={`w-3 h-3 rounded-full transition-colors ${
          overallCompletion >= 90 ? 'bg-emerald-500' : 'bg-emerald-200'
        }`} />
      </div>

      {/* Section List */}
      <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
        {sections.map((section) => {
          const items = groupedContent[section];
          const completion = calculateCompletion(items);
          const style = getSectionStyle(section);
          const displayTitle = getSectionDisplayTitle(section, items);
          const isActive = activeSection === section;
          const isEmpty = completion === 0;
          const sectionType = getSectionType(section);

          return (
            <button
              key={section}
              onClick={() => onSectionClick(section)}
              className={`w-full text-left p-2.5 rounded-lg border-2 border-l-4 transition-all ${
                isActive 
                  ? `${style.bgColor} ${style.borderColor} shadow-sm`
                  : `bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 border-l-neutral-300`
              }`}
              style={{
                borderLeftColor: isActive ? undefined : (
                  sectionType === 'hero' ? '#f87171' :
                  sectionType === 'content' || sectionType === 'carousel' ? '#fb923c' :
                  sectionType === 'community' ? '#4ade80' :
                  sectionType === 'rooted-unity' ? '#facc15' :
                  sectionType === 'newsletter' ? '#22d3ee' :
                  sectionType === 'footer' ? '#9ca3af' :
                  '#d1d5db'
                )
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className={`text-xs font-medium truncate ${
                    isActive ? style.textColor : 'text-neutral-700 dark:text-neutral-300'
                  }`}>
                    {displayTitle}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isActive && (
                    <span className="px-1.5 py-0.5 bg-green-500 text-white text-[9px] font-bold rounded uppercase">
                      Editing
                    </span>
                  )}
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    isEmpty ? 'bg-neutral-200 text-neutral-500' :
                    completion === 100 ? 'bg-emerald-100 text-emerald-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {isEmpty ? 'EMPTY' : `${completion}%`}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Section Types Legend */}
      <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
        <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide mb-2">Section Types</h4>
        <div className="grid grid-cols-4 gap-x-2 gap-y-1">
          {[
            { key: 'header', label: 'header', color: 'bg-blue-400' },
            { key: 'hero', label: 'hero', color: 'bg-red-400' },
            { key: 'content', label: 'content', color: 'bg-orange-400' },
            { key: 'carousel', label: 'carousel', color: 'bg-orange-400' },
            { key: 'grid', label: 'grid', color: 'bg-indigo-400' },
            { key: 'form', label: 'form', color: 'bg-pink-400' },
            { key: 'video', label: 'video', color: 'bg-purple-400' },
            { key: 'quote', label: 'quote', color: 'bg-teal-400' },
            { key: 'cta', label: 'cta', color: 'bg-rose-400' },
            { key: 'newsletter', label: 'newsletter', color: 'bg-cyan-400' },
            { key: 'community', label: 'community', color: 'bg-green-400' },
            { key: 'footer', label: 'footer', color: 'bg-gray-400' },
          ].map(({ key, label, color }) => (
            <div key={key} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-sm ${color}`} />
              <span className="text-[9px] text-neutral-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Currently Editing Indicator */}
      {activeSection && (
        <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
          <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide mb-1">Currently Editing</h4>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              {getSectionDisplayTitle(activeSection, groupedContent[activeSection] || [])}
            </span>
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">
            Fields: {(groupedContent[activeSection] || []).map(i => i.contentKey).slice(0, 5).join(', ')}
            {(groupedContent[activeSection] || []).length > 5 && '...'}
          </p>
        </div>
      )}
    </div>
  );
}
