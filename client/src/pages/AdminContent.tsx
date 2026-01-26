import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { LogOut, FileText, Settings, Layout, Save, ChevronDown, ChevronUp, FolderOpen, Image, Palette, Files, BarChart3, Layers } from 'lucide-react';
import MediaPicker from '@/components/MediaPicker';
import AdminSidebar from '@/components/AdminSidebar';
import SectionVisualizer from '@/components/SectionVisualizer';
import TextFormatToolbar from '@/components/TextFormatToolbar';
import LegalPageEditorNew, { LegalSection } from '@/components/LegalPageEditorNew';

interface ContentItem {
  id: number;
  page: string;
  section: string;
  contentKey: string;
  contentValue: string;
}

export default function AdminContent() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking, username, logout } = useAdminAuth();
  
  // Get page from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const pageFromUrl = urlParams.get('page');
  
  const [selectedPage, setSelectedPage] = useState(pageFromUrl || 'home');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [editedContent, setEditedContent] = useState<Record<number, string>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [textStyles, setTextStyles] = useState<Record<number, { isBold: boolean; isItalic: boolean; isUnderline: boolean; fontSize?: string; fontColor?: string }>>({});
  const [legalSections, setLegalSections] = useState<LegalSection[]>([]);
  const legalPageNames: Record<string, string> = {
    'privacy-policy': 'Privacy Policy',
    'terms-of-service': 'Terms of Service',
    'accessibility': 'Accessibility Statement',
    'cookie-policy': 'Cookie Policy',
  };
  
  // Refs for scrolling to sections
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Fetch pages dynamically from database - MUST be before any conditional returns
  const { data: pagesData } = trpc.admin.pages.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Build pages list from database, with fallback to hardcoded list
  // MUST be before any conditional returns to avoid React hooks error
  const pages = React.useMemo(() => {
    // Define priority order for pages (lower number = higher priority)
    const pageOrder: Record<string, number> = {
      'home': 1,
      'about': 2,
      'about-justxempower': 3,
      'philosophy': 4,
      'founder': 5,
      'vision-ethos': 6,
      'offerings': 7,
      'workshops-programs': 8,
      'vix-journal-trilogy': 9,
      'blog': 10,
      'blog-she-writes': 11,
      'shop': 12,
      'community-events': 13,
      'resources': 14,
      'walk-with-us': 15,
      'contact': 16,
      'overview': 17,
      'accessibility': 90,
      'privacy-policy': 91,
      'terms-of-service': 92,
      'cookie-policy': 93,
    };

    if (pagesData && pagesData.length > 0) {
      // Ensure "home" is always in the list
      const hasHome = pagesData.some(p => p.slug === 'home');
      const pagesWithHome = hasHome ? pagesData : [
        { slug: 'home', title: 'Home', published: 1, showInNav: 0, template: 'default' },
        ...pagesData
      ];
      
      // Sort pages: by priority order, then alphabetically
      return pagesWithHome
        .sort((a, b) => {
          const orderA = pageOrder[a.slug] || 50; // Default to middle if not in list
          const orderB = pageOrder[b.slug] || 50;
          if (orderA !== orderB) return orderA - orderB;
          // Then alphabetically by title
          return a.title.localeCompare(b.title);
        })
        .map(page => ({
          id: page.slug,
          label: page.title,
          published: page.published === 1,
          showInNav: page.showInNav === 1,
          template: page.template,
        }));
    }
    // Fallback to hardcoded list if database fetch fails
    return [
      { id: 'home', label: 'Home', published: true, showInNav: false, template: 'default' },
      { id: 'philosophy', label: 'Philosophy', published: true, showInNav: true, template: 'default' },
      { id: 'founder', label: 'Founder', published: true, showInNav: true, template: 'default' },
      { id: 'vision-ethos', label: 'Vision & Ethos', published: true, showInNav: true, template: 'default' },
      { id: 'offerings', label: 'Offerings', published: true, showInNav: true, template: 'default' },
      { id: 'workshops-programs', label: 'Workshops & Programs', published: true, showInNav: true, template: 'default' },
      { id: 'vix-journal-trilogy', label: 'VI • X Journal Trilogy', published: true, showInNav: true, template: 'default' },
      { id: 'blog', label: 'Blog (She Writes)', published: true, showInNav: true, template: 'default' },
      { id: 'shop', label: 'Shop', published: true, showInNav: true, template: 'default' },
      { id: 'community-events', label: 'Community Events', published: true, showInNav: true, template: 'default' },
      { id: 'resources', label: 'Resources', published: true, showInNav: true, template: 'default' },
      { id: 'walk-with-us', label: 'Walk With Us', published: true, showInNav: true, template: 'default' },
      { id: 'contact', label: 'Contact', published: true, showInNav: true, template: 'default' },
      { id: 'accessibility', label: 'Accessibility', published: true, showInNav: false, template: 'default' },
      { id: 'privacy-policy', label: 'Privacy Policy', published: true, showInNav: false, template: 'default' },
      { id: 'terms-of-service', label: 'Terms of Service', published: true, showInNav: false, template: 'default' },
      { id: 'cookie-policy', label: 'Cookie Policy', published: true, showInNav: false, template: 'default' },
    ];
  }, [pagesData]);

  const { data: contentData, isLoading, refetch } = trpc.admin.content.getByPage.useQuery(
    { page: selectedPage },
    { enabled: isAuthenticated }
  );

  // Fetch text styles for the current page
  const { data: pageTextStyles } = trpc.contentTextStyles.getByPage.useQuery(
    { page: selectedPage },
    { enabled: isAuthenticated }
  );

  const utils = trpc.useUtils();
  const updateMutation = trpc.admin.content.update.useMutation({
    onSuccess: async () => {
      // Invalidate and refetch both admin and public content queries
      await utils.admin.content.getByPage.invalidate({ page: selectedPage });
      await utils.content.getByPage.invalidate({ page: selectedPage });
      await refetch();
    },
  });
  
  const upsertMutation = trpc.admin.content.upsert.useMutation({
    onSuccess: async () => {
      await utils.admin.content.getByPage.invalidate({ page: selectedPage });
      await utils.content.getByPage.invalidate({ page: selectedPage });
      await refetch();
    },
  });

  useEffect(() => {
    if (contentData) {
      setContent(contentData);
      // Auto-expand all sections by default
      const sections = contentData.reduce((acc: Record<string, boolean>, item) => {
        acc[item.section] = true;
        return acc;
      }, {});
      setExpandedSections(sections);
      // Clear any edited content when page data changes
      setEditedContent({});
      // Set first section as active
      const firstSection = contentData[0]?.section;
      if (firstSection && !activeSection) {
        setActiveSection(firstSection);
      }
    }
  }, [contentData, selectedPage]);

  // Load legal sections from database - only on initial page load, not after saves
  // Use a ref to track if we've loaded the initial data for this page
  const initialLoadRef = React.useRef<string | null>(null);
  
  useEffect(() => {
    const isLegal = ['privacy-policy', 'terms-of-service', 'accessibility', 'cookie-policy'].includes(selectedPage);
    
    // Reset initial load ref when page changes
    if (initialLoadRef.current !== selectedPage) {
      initialLoadRef.current = null;
    }
    
    if (isLegal && contentData) {
      // Only load from database if we haven't loaded yet for this page
      if (initialLoadRef.current !== selectedPage) {
        const legalSectionItem = contentData.find(item => item.section === 'legalSections' && item.contentKey === 'sections');
        if (legalSectionItem && legalSectionItem.contentValue) {
          try {
            const parsed = JSON.parse(legalSectionItem.contentValue);
            setLegalSections(Array.isArray(parsed) ? parsed : []);
          } catch (e) {
            console.error('Failed to parse legal sections:', e);
            setLegalSections([]);
          }
        } else {
          // Check localStorage for any unsaved sections
          const localSections = localStorage.getItem(`legal-sections-${selectedPage}`);
          if (localSections) {
            try {
              const parsed = JSON.parse(localSections);
              setLegalSections(Array.isArray(parsed) ? parsed : []);
            } catch (e) {
              setLegalSections([]);
            }
          } else {
            setLegalSections([]);
          }
        }
        initialLoadRef.current = selectedPage;
      }
    } else if (!isLegal) {
      setLegalSections([]);
      initialLoadRef.current = null;
    }
  }, [selectedPage, contentData]);

  // Process text styles into a map for easy lookup
  useEffect(() => {
    if (pageTextStyles) {
      const stylesMap: Record<number, { isBold: boolean; isItalic: boolean; isUnderline: boolean; fontSize?: string; fontColor?: string }> = {};
      pageTextStyles.forEach((style: any) => {
        stylesMap[style.contentId] = {
          isBold: style.isBold === 1,
          isItalic: style.isItalic === 1,
          isUnderline: style.isUnderline === 1,
          fontSize: style.fontSize || '',
          fontColor: style.fontColor || '',
        };
      });
      setTextStyles(stylesMap);
    }
  }, [pageTextStyles]);

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation('/admin/login');
    }
  }, [isAuthenticated, isChecking, setLocation]);

  const handleContentChange = (id: number, value: string) => {
    setEditedContent(prev => ({ ...prev, [id]: value }));
    // Update the local content state immediately for UI feedback
    setContent(prev => prev.map(item => item.id === id ? { ...item, contentValue: value } : item));
  };

  const handleSaveAll = async () => {
    const isLegal = ['privacy-policy', 'terms-of-service', 'accessibility', 'cookie-policy'].includes(selectedPage);
    const hasEditedContent = Object.keys(editedContent).length > 0;
    // Always save legal sections on legal pages (even if empty array, to clear old content)
    const shouldSaveLegalSections = isLegal;
    
    if (!hasEditedContent && !shouldSaveLegalSections) {
      toast.info('No changes to save');
      return;
    }
    
    const updates = Object.entries(editedContent);
    let successCount = 0;
    let errorCount = 0;
    
    // Save legal sections if this is a legal page (use upsert to create or update)
    if (shouldSaveLegalSections) {
      try {
        console.log('Saving legal sections:', legalSections);
        await upsertMutation.mutateAsync({
          page: selectedPage,
          section: 'legalSections',
          contentKey: 'sections',
          contentValue: JSON.stringify(legalSections),
        });
        successCount++;
        console.log('Legal sections saved successfully');
      } catch (error) {
        console.error('Failed to save legal sections:', error);
        errorCount++;
      }
    }
    
    // Save all other updates sequentially
    for (const [id, value] of updates) {
      try {
        await updateMutation.mutateAsync({
          id: parseInt(id),
          contentValue: value,
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to update content ID ${id}:`, error);
        errorCount++;
      }
    }
    
    // Show result toast
    if (errorCount === 0) {
      toast.success(`Successfully saved ${successCount} change${successCount > 1 ? 's' : ''}`);
    } else if (successCount > 0) {
      toast.warning(`Saved ${successCount} change${successCount > 1 ? 's' : ''}, ${errorCount} failed`);
    } else {
      toast.error('Failed to save changes');
    }
    
    // Clear edited content and refetch after all saves complete
    setEditedContent({});
    await refetch();
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Handle section click from visualizer
  const handleSectionClick = (section: string) => {
    setActiveSection(section);
    // Expand the section if collapsed
    setExpandedSections(prev => ({ ...prev, [section]: true }));
    // Scroll to the section
    const sectionElement = sectionRefs.current[section];
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // When selected page changes, refetch content
  useEffect(() => {
    refetch();
    setActiveSection(null);
  }, [selectedPage, refetch]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading && content.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <p className="text-neutral-500">Loading content...</p>
      </div>
    );
  }

  const handleOpenMediaPicker = (fieldId: number) => {
    setSelectedFieldId(fieldId);
    setMediaPickerOpen(true);
  };

  const handleMediaSelect = async (url: string) => {
    if (selectedFieldId !== null) {
      // Update local state immediately for UI feedback
      handleContentChange(selectedFieldId, url);
      
      // Auto-save to database immediately
      try {
        await updateMutation.mutateAsync({
          id: selectedFieldId,
          contentValue: url,
        });
        // Remove from editedContent since it's already saved
        setEditedContent(prev => {
          const newState = { ...prev };
          delete newState[selectedFieldId];
          return newState;
        });
        toast.success('Media saved successfully');
        // Refetch to ensure data is in sync
        await refetch();
      } catch (error) {
        console.error('Failed to save media:', error);
        toast.error('Failed to save media. Please try again.');
      }
    }
    setMediaPickerOpen(false);
    setSelectedFieldId(null);
  };

  // Group content by section
  const groupedContent = content.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, ContentItem[]>);

  // Helper to format section names
  const formatSectionName = (section: string) => {
    return section.split(/(?=[A-Z])/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Helper to determine input type
  const getInputType = (contentKey: string) => {
    if (contentKey.includes('Url') || contentKey.includes('Link')) return 'url';
    if (contentKey.includes('email')) return 'email';
    if (contentKey.includes('phone')) return 'tel';
    return 'text';
  };

  // Helper to determine if field should be textarea
  const isLongText = (contentKey: string, value: string) => {
    return contentKey.includes('description') || 
           contentKey.includes('paragraph') || 
           contentKey.includes('content') ||
           value.length > 100;
  };

  const hasUnsavedChanges = Object.keys(editedContent).length > 0;

  // Check if this is a legal page that should use free-form editor
  const isLegalPage = ['privacy-policy', 'terms-of-service', 'accessibility', 'cookie-policy'].includes(selectedPage);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Sidebar */}
      <AdminSidebar variant="dark" />

      {/* Main Content Area with Section Visualizer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Section Visualizer - Left Panel */}
        <div className="w-64 flex-shrink-0 p-4 overflow-y-auto border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
          <SectionVisualizer
            content={content}
            selectedPage={selectedPage}
            activeSection={activeSection}
            onSectionClick={handleSectionClick}
          />

          {/* Quick Link to Page Zones */}
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-xs"
              onClick={() => setLocation(`/admin/zones`)}
            >
              <Layers className="w-4 h-4" />
              Edit Page Zones
            </Button>
            <p className="text-[10px] text-muted-foreground mt-2">
              Add Page Builder blocks to this page
            </p>
          </div>
        </div>

        {/* Content Editor - Right Panel */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                {hasUnsavedChanges && (
                  <Button
                    onClick={handleSaveAll}
                    disabled={updateMutation.isPending}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {updateMutation.isPending ? 'Saving...' : `Save All Changes (${Object.keys(editedContent).length})`}
                  </Button>
                )}
              </div>

              <h1 className="text-3xl font-light text-neutral-900 dark:text-neutral-100 mb-2">
                Content Editor
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                Edit all text content, images, and videos across your website
              </p>

              {/* Page Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {pages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => {
                      setSelectedPage(page.id);
                      // Update URL without full page reload
                      window.history.pushState({}, '', `/admin/content?page=${page.id}`);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                      selectedPage === page.id
                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                        : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    {page.label}
                    {page.template === 'page-builder' && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                        PB
                      </span>
                    )}
                    {page.showInNav && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="In Navigation" />
                    )}
                  </button>
                ))}
              </div>

              {/* Legal Page Editor */}
              {isLegalPage && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8 mb-8">
                  <LegalPageEditorNew
                    sections={legalSections}
                    onChange={(sections) => {
                      setLegalSections(sections);
                      localStorage.setItem(`legal-sections-${selectedPage}`, JSON.stringify(sections));
                    }}
                    onSave={handleSaveAll}
                    isSaving={updateMutation.isPending}
                    pageName={legalPageNames[selectedPage] || selectedPage}
                  />
                </div>
              )}

              {/* Content Sections - Hide for legal pages since they use LegalPageEditorNew */}
              <div className="space-y-4">
                {!isLegalPage && Object.entries(groupedContent)
                  .filter(([section]) => section !== 'legalSections')
                  .map(([section, items]) => (
                  <div
                    key={section}
                    ref={(el) => { sectionRefs.current[section] = el; }}
                    className={`bg-white dark:bg-neutral-900 rounded-xl border-2 overflow-hidden transition-all ${
                      activeSection === section 
                        ? 'border-orange-400 ring-2 ring-orange-200' 
                        : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                    onClick={() => setActiveSection(section)}
                  >
                    {/* Section Header */}
                    <button
                      onClick={() => toggleSection(section)}
                      className="w-full flex items-center justify-between p-6 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-light text-neutral-900 dark:text-neutral-100">
                          {formatSectionName(section)}
                        </h2>
                        {activeSection === section && (
                          <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded">
                            EDITING
                          </span>
                        )}
                      </div>
                      {expandedSections[section] ? (
                        <ChevronUp className="w-5 h-5 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-neutral-400" />
                      )}
                    </button>

                    {/* Section Content */}
                    {expandedSections[section] && (
                      <div className="px-6 pb-6 space-y-4 border-t border-neutral-100 dark:border-neutral-800">
                        {/* Section Type Badge */}
                        <div className="pt-4 flex items-center gap-2">
                          <span className="text-xs text-neutral-500">Section Type:</span>
                          <span className="text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-400">
                            {section.toLowerCase().includes('hero') ? 'hero' :
                             section.toLowerCase().includes('newsletter') ? 'newsletter' :
                             section.toLowerCase().includes('footer') ? 'footer' :
                             section.toLowerCase().includes('form') ? 'form' :
                             section.toLowerCase().includes('carousel') ? 'carousel' :
                             section.toLowerCase().includes('community') || section.toLowerCase().includes('emerge') ? 'community' :
                             section.toLowerCase().includes('rooted') || section.toLowerCase().includes('unity') ? 'rooted-unity' :
                             section.toLowerCase().includes('quote') ? 'quote' :
                             section.toLowerCase().includes('cta') ? 'cta' :
                             section.toLowerCase().includes('video') ? 'video' :
                             section.toLowerCase().includes('grid') ? 'grid' :
                             'content'}
                          </span>
                        </div>
                        
                        {items.map((item) => {
                          const currentValue = editedContent[item.id] ?? item.contentValue;
                          const isModified = editedContent[item.id] !== undefined;
                          const inputType = getInputType(item.contentKey);
                          const useTextarea = isLongText(item.contentKey, currentValue);
                          const itemStyles = textStyles[item.id] || { isBold: false, isItalic: false, isUnderline: false, fontSize: '', fontColor: '' };
                          const styleClasses = [
                            itemStyles.isBold ? 'font-bold' : '',
                            itemStyles.isItalic ? 'italic' : '',
                            itemStyles.isUnderline ? 'underline' : '',
                          ].filter(Boolean).join(' ');
                          const inlineStyles: React.CSSProperties = {
                            ...(itemStyles.fontSize ? { fontSize: itemStyles.fontSize } : {}),
                            // Don't apply fontColor in admin editor - only on live site
                          };

                          return (
                            <div key={item.id} className="pt-4">
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                  {formatSectionName(item.contentKey)}
                                  {isModified && (
                                    <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                                      (Modified)
                                    </span>
                                  )}
                                </label>
                                {/* Text formatting toolbar for text fields */}
                                {!item.contentKey.includes('Url') && !item.contentKey.includes('Image') && !item.contentKey.includes('Video') && (
                                  <TextFormatToolbar 
                                    contentId={item.id} 
                                    size="sm"
                                    onStyleChange={(styles) => {
                                      setTextStyles(prev => ({
                                        ...prev,
                                        [item.id]: styles
                                      }));
                                    }}
                                  />
                                )}
                              </div>
                              {useTextarea ? (
                                <Textarea
                                  value={currentValue}
                                  onChange={(e) => handleContentChange(item.id, e.target.value)}
                                  className={`min-h-[100px] ${isModified ? 'border-amber-400 dark:border-amber-600' : ''} ${styleClasses}`}
                                  style={inlineStyles}
                                  placeholder={`Enter ${item.contentKey}...`}
                                />
                              ) : (
                                <div className="flex gap-2">
                                  <Input
                                    type={inputType}
                                    value={currentValue}
                                    onChange={(e) => handleContentChange(item.id, e.target.value)}
                                    className={`h-11 flex-1 ${isModified ? 'border-amber-400 dark:border-amber-600' : ''} ${styleClasses}`}
                                    style={inlineStyles}
                                    placeholder={`Enter ${item.contentKey}...`}
                                  />
                                  {(item.contentKey.includes('Url') || item.contentKey.includes('Image') || item.contentKey.includes('Video')) && (
                                    <Button
                                      type="button"
                                      onClick={() => handleOpenMediaPicker(item.id)}
                                      variant="outline"
                                      size="icon"
                                      className="h-11 w-11 flex-shrink-0"
                                    >
                                      <Image className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              )}
                              {item.contentKey.includes('Url') && currentValue && (
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                  Preview: <a href={currentValue} target="_blank" rel="noopener noreferrer" className="underline">{currentValue}</a>
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {content.length === 0 && (
                  <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                    No content sections found for this page.
                  </div>
                )}
              </div>

              {/* Sticky Save Button */}
              {hasUnsavedChanges && (
                <div className="fixed bottom-8 right-8">
                  <Button
                    onClick={handleSaveAll}
                    disabled={updateMutation.isPending}
                    size="lg"
                    className="gap-2 shadow-lg"
                  >
                    <Save className="w-5 h-5" />
                    {updateMutation.isPending ? 'Saving...' : `Save All Changes (${Object.keys(editedContent).length})`}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Media Picker Modal */}
      <MediaPicker
        open={mediaPickerOpen}
        onClose={() => {
          setMediaPickerOpen(false);
          setSelectedFieldId(null);
        }}
        onSelect={handleMediaSelect}
        mediaType="all"
      />
    </div>
  );
}
