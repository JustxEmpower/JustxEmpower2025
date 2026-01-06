import { useState, useEffect } from 'react';
import { LayoutGrid, CheckCircle2, AlertCircle, Circle } from 'lucide-react';

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

// Section type definitions with colors
const sectionTypes: Record<string, { color: string; bgColor: string; borderColor: string; label: string }> = {
  hero: { color: 'text-emerald-700', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-300', label: 'Hero' },
  header: { color: 'text-blue-700', bgColor: 'bg-blue-100', borderColor: 'border-blue-300', label: 'Header' },
  content: { color: 'text-amber-700', bgColor: 'bg-amber-100', borderColor: 'border-amber-300', label: 'Content' },
  main: { color: 'text-orange-700', bgColor: 'bg-orange-100', borderColor: 'border-orange-300', label: 'Content' },
  carousel: { color: 'text-purple-700', bgColor: 'bg-purple-100', borderColor: 'border-purple-300', label: 'Carousel' },
  grid: { color: 'text-indigo-700', bgColor: 'bg-indigo-100', borderColor: 'border-indigo-300', label: 'Grid' },
  form: { color: 'text-pink-700', bgColor: 'bg-pink-100', borderColor: 'border-pink-300', label: 'Form' },
  video: { color: 'text-red-700', bgColor: 'bg-red-100', borderColor: 'border-red-300', label: 'Video' },
  quote: { color: 'text-teal-700', bgColor: 'bg-teal-100', borderColor: 'border-teal-300', label: 'Quote' },
  cta: { color: 'text-rose-700', bgColor: 'bg-rose-100', borderColor: 'border-rose-300', label: 'Cta' },
  newsletter: { color: 'text-cyan-700', bgColor: 'bg-cyan-100', borderColor: 'border-cyan-300', label: 'Newsletter' },
  community: { color: 'text-lime-700', bgColor: 'bg-lime-100', borderColor: 'border-lime-300', label: 'Community' },
  footer: { color: 'text-gray-700', bgColor: 'bg-gray-100', borderColor: 'border-gray-300', label: 'Footer' },
  principles: { color: 'text-violet-700', bgColor: 'bg-violet-100', borderColor: 'border-violet-300', label: 'Content' },
  pillars: { color: 'text-fuchsia-700', bgColor: 'bg-fuchsia-100', borderColor: 'border-fuchsia-300', label: 'Content' },
  philosophy: { color: 'text-sky-700', bgColor: 'bg-sky-100', borderColor: 'border-sky-300', label: 'Content' },
  offerings: { color: 'text-yellow-700', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-300', label: 'Content' },
  rootedUnity: { color: 'text-green-700', bgColor: 'bg-green-100', borderColor: 'border-green-300', label: 'Content' },
  rooted: { color: 'text-green-700', bgColor: 'bg-green-100', borderColor: 'border-green-300', label: 'Content' },
};

// Get section type styling
const getSectionStyle = (sectionName: string) => {
  const lowerSection = sectionName.toLowerCase();
  
  // Check for exact match first
  if (sectionTypes[lowerSection]) {
    return sectionTypes[lowerSection];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(sectionTypes)) {
    if (lowerSection.includes(key)) {
      return value;
    }
  }
  
  // Default styling
  return { color: 'text-neutral-700', bgColor: 'bg-neutral-100', borderColor: 'border-neutral-300', label: 'Content' };
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
    item.contentKey.endsWith('_title') ||
    item.contentKey === 'heading'
  );
  
  if (titleItem && titleItem.contentValue) {
    return titleItem.contentValue;
  }
  
  // Format section name as fallback
  return sectionName
    .split(/(?=[A-Z])/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 sticky top-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <LayoutGrid className="w-5 h-5 text-neutral-500" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            PAGE STRUCTURE
          </h3>
          <p className="text-xs text-neutral-500">
            {sections.length}/{sections.length} sections
          </p>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          overallCompletion >= 80 ? 'bg-emerald-100 text-emerald-700' :
          overallCompletion >= 50 ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'
        }`}>
          {overallCompletion}%
        </div>
      </div>

      {/* Traffic Light Indicator */}
      <div className="flex gap-1.5 mb-4">
        <div className={`w-3 h-3 rounded-full ${overallCompletion >= 30 ? 'bg-red-500' : 'bg-red-200'}`} />
        <div className={`w-3 h-3 rounded-full ${overallCompletion >= 60 ? 'bg-amber-500' : 'bg-amber-200'}`} />
        <div className={`w-3 h-3 rounded-full ${overallCompletion >= 90 ? 'bg-emerald-500' : 'bg-emerald-200'}`} />
      </div>

      {/* Section List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {sections.map((section, index) => {
          const items = groupedContent[section];
          const completion = calculateCompletion(items);
          const style = getSectionStyle(section);
          const displayTitle = getSectionDisplayTitle(section, items);
          const isActive = activeSection === section;
          const isEmpty = completion === 0;

          return (
            <button
              key={section}
              onClick={() => onSectionClick(section)}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                isActive 
                  ? `${style.bgColor} ${style.borderColor} ring-2 ring-offset-1 ring-${style.color.replace('text-', '')}`
                  : `bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300`
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    completion === 100 ? 'bg-emerald-500' :
                    completion > 0 ? 'bg-amber-500' :
                    'bg-neutral-300'
                  }`} />
                  <span className={`text-sm font-medium truncate ${
                    isActive ? style.color : 'text-neutral-700 dark:text-neutral-300'
                  }`}>
                    {displayTitle}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isActive && (
                    <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded">
                      EDITING
                    </span>
                  )}
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    completion === 100 ? 'bg-emerald-100 text-emerald-700' :
                    completion > 0 ? 'bg-amber-100 text-amber-700' :
                    'bg-neutral-100 text-neutral-500'
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
      <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <h4 className="text-xs font-semibold text-neutral-500 mb-2">Section Types</h4>
        <div className="grid grid-cols-3 gap-1.5 text-[10px]">
          {[
            { key: 'header', label: 'Header' },
            { key: 'hero', label: 'Hero' },
            { key: 'content', label: 'Content' },
            { key: 'carousel', label: 'Carousel' },
            { key: 'grid', label: 'Grid' },
            { key: 'form', label: 'Form' },
            { key: 'video', label: 'Video' },
            { key: 'quote', label: 'Quote' },
            { key: 'cta', label: 'Cta' },
            { key: 'newsletter', label: 'Newsletter' },
            { key: 'community', label: 'Community' },
            { key: 'footer', label: 'Footer' },
          ].map(({ key, label }) => {
            const style = sectionTypes[key];
            return (
              <div key={key} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${style.bgColor} ${style.borderColor} border`} />
                <span className="text-neutral-600 dark:text-neutral-400">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Currently Editing Indicator */}
      {activeSection && (
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <h4 className="text-xs font-semibold text-neutral-500 mb-1">Currently Editing</h4>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {activeSection}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
