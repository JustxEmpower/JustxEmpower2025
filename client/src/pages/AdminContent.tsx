import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { LogOut, FileText, Settings, Layout, Save, ChevronDown, ChevronUp, FolderOpen, Image, Palette, Files, BarChart3 } from 'lucide-react';
import MediaPicker from '@/components/MediaPicker';
import AdminSidebar from '@/components/AdminSidebar';
import { PageSectionMapper, getDefaultSections, PageSection } from '@/components/admin/PageSectionMapper';
import { usePageSections } from '@/hooks/usePageSections';

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

  // Page ID mapping for section queries - must be defined before usePageSections hook
  const pageIdMap: Record<string, number> = {
    'home': 1,
    'philosophy': 60001,
    'founder': 60002,
    'vision-ethos': 60003,
    'offerings': 60004,
    'workshops-programs': 60005,
    'vix-journal-trilogy': 60006,
    'blog': 60007,
    'shop': 60008,
    'community-events': 60009,
    'resources': 60010,
    'walk-with-us': 60011,
    'contact': 60012,
  };

  // Fetch page sections from API - must be called before any conditional returns
  const { sections: pageSections, isLoading: sectionsLoading, hasDbSections, completenessData } = usePageSections(
    selectedPage,
    pageIdMap[selectedPage]
  );

  const { data: contentData, isLoading, refetch } = trpc.admin.content.getByPage.useQuery(
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
    }
  }, [contentData, selectedPage]);

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
    if (Object.keys(editedContent).length === 0) {
      toast.info('No changes to save');
      return;
    }
    
    const updates = Object.entries(editedContent);
    let successCount = 0;
    let errorCount = 0;
    
    // Save all updates sequentially
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

  // When selected page changes, refetch content
  useEffect(() => {
    refetch();
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

  // Page ID mapping for section queries
  const pageIdMap: Record<string, number> = {
    'home': 1,
    'philosophy': 60001,
    'founder': 60002,
    'vision-ethos': 60003,
    'offerings': 60004,
    'workshops-programs': 60005,
    'vix-journal-trilogy': 60006,
    'blog': 60007,
    'shop': 60008,
    'community-events': 60009,
    'resources': 60010,
    'walk-with-us': 60011,
    'contact': 60012,
  };

  // Fetch page sections from API
  const { sections: pageSections, isLoading: sectionsLoading, hasDbSections, completenessData } = usePageSections(
    selectedPage,
    pageIdMap[selectedPage]
  );

  const pages = [
    // Core pages
    { id: 'home', label: 'Home' },
    // Philosophy section
    { id: 'philosophy', label: 'Philosophy' },
    { id: 'founder', label: 'Founder' },
    { id: 'vision-ethos', label: 'Vision & Ethos' },
    // Offerings section
    { id: 'offerings', label: 'Offerings' },
    { id: 'workshops-programs', label: 'Workshops & Programs' },
    { id: 'vix-journal-trilogy', label: 'VI • X Journal Trilogy' },
    { id: 'blog', label: 'Blog (She Writes)' },
    // Other main pages
    { id: 'shop', label: 'Shop' },
    { id: 'community-events', label: 'Community Events' },
    { id: 'resources', label: 'Resources' },
    { id: 'walk-with-us', label: 'Walk With Us' },
    { id: 'contact', label: 'Contact' },
    // Footer/Legal pages
    { id: 'accessibility', label: 'Accessibility' },
    { id: 'privacy-policy', label: 'Privacy Policy' },
    { id: 'terms-of-service', label: 'Terms of Service' },
    { id: 'cookie-policy', label: 'Cookie Policy' },
  ];

  const handleOpenMediaPicker = (fieldId: number) => {
    setSelectedFieldId(fieldId);
    setMediaPickerOpen(true);
  };

  const handleMediaSelect = (url: string) => {
    if (selectedFieldId !== null) {
      handleContentChange(selectedFieldId, url);
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

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Sidebar */}
      <AdminSidebar variant="light" />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-5xl mx-auto">
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedPage === page.id
                      ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                      : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  {page.label}
                </button>
              ))}
            </div>

            {/* Two-column layout: Section Mapper + Content Editor */}
            <div className="flex gap-6">
              {/* Left: Page Section Mapper */}
              <div className="w-64 flex-shrink-0 sticky top-8 self-start">
                <PageSectionMapper
                  sections={pageSections}
                  activeSection={Object.keys(expandedSections).find(s => expandedSections[s])}
                  onSectionClick={(sectionId) => {
                    // Find matching section in content and expand it
                    const matchingSection = Object.keys(groupedContent).find(
                      s => s.toLowerCase().includes(sectionId.toLowerCase()) ||
                           sectionId.toLowerCase().includes(s.toLowerCase())
                    );
                    if (matchingSection) {
                      setExpandedSections(prev => ({
                        ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
                        [matchingSection]: true
                      }));
                      // Scroll to section
                      const element = document.getElementById(`section-${matchingSection}`);
                      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="dark:bg-neutral-900 dark:border-neutral-800"
                />
              </div>

              {/* Right: Content Sections */}
              <div className="flex-1 space-y-4">
              {Object.entries(groupedContent).map(([section, items]) => (
                <div
                  key={section}
                  id={`section-${section}`}
                  className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
                >
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section)}
                    className="w-full flex items-center justify-between p-6 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <h2 className="text-xl font-light text-neutral-900 dark:text-neutral-100">
                      {formatSectionName(section)}
                    </h2>
                    {expandedSections[section] ? (
                      <ChevronUp className="w-5 h-5 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-400" />
                    )}
                  </button>

                  {/* Section Content */}
                  {expandedSections[section] && (
                    <div className="px-6 pb-6 space-y-4 border-t border-neutral-100 dark:border-neutral-800">
                      {items.map((item) => {
                        const currentValue = editedContent[item.id] ?? item.contentValue;
                        const isModified = editedContent[item.id] !== undefined;
                        const inputType = getInputType(item.contentKey);
                        const useTextarea = isLongText(item.contentKey, currentValue);

                        return (
                          <div key={item.id} className="pt-4">
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              {formatSectionName(item.contentKey)}
                              {isModified && (
                                <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                                  (Modified)
                                </span>
                              )}
                            </label>
                            {useTextarea ? (
                              <Textarea
                                value={currentValue}
                                onChange={(e) => handleContentChange(item.id, e.target.value)}
                                className={`min-h-[100px] ${isModified ? 'border-amber-400 dark:border-amber-600' : ''}`}
                                placeholder={`Enter ${item.contentKey}...`}
                              />
                            ) : (
                              <div className="flex gap-2">
                                <Input
                                  type={inputType}
                                  value={currentValue}
                                  onChange={(e) => handleContentChange(item.id, e.target.value)}
                                  className={`h-11 flex-1 ${isModified ? 'border-amber-400 dark:border-amber-600' : ''}`}
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
