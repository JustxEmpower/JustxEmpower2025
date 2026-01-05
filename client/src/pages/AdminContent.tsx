import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, ChevronDown, ChevronUp, Image, Link as LinkIcon } from 'lucide-react';
import MediaPicker from '@/components/MediaPicker';
import AdminSidebar from '@/components/AdminSidebar';
import { PageSectionMapper, PageSection, SectionType } from '@/components/admin/PageSectionMapper';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RawSection {
  id: number;
  pageId: number;
  sectionType: string;
  sectionOrder: number;
  title: string | null;
  content: Record<string, any>;
  requiredFields: string[];
  isVisible: number;
}

interface CompletenessData {
  pageId: number;
  totalSections: number;
  overallCompleteness: number;
  sections: Array<{
    id: number;
    sectionType: string;
    completeness: number;
    filledFields: string[];
    missingFields: string[];
  }>;
}

// Page ID mapping - ALL pages must be here (LIVE DATABASE IDs)
const PAGE_ID_MAP: Record<string, number> = {
  'home': 18,
  'philosophy': 2,
  'founder': 3,
  'vision-ethos': 5,
  'offerings': 6,
  'workshops-programs': 7,
  'vix-journal-trilogy': 8,
  'vi-x-journal-trilogy': 19,
  'blog': 20,
  'blog-she-writes': 9,
  'shop': 10,
  'community-events': 1,
  'resources': 12,
  'walk-with-us': 13,
  'contact': 14,
  'rooted-unity': 15,
  'overview': 16,
  'about': 21,
  'about-justxempower': 22,
  'accessibility': 23,
  'privacy-policy': 24,
  'terms-of-service': 25,
  'cookie-policy': 26,
};

// All available pages for the editor
const PAGES = [
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
  // About pages
  { id: 'about', label: 'About' },
  { id: 'about-justxempower', label: 'About JustxEmpower' },
  // Footer/Legal pages
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'privacy-policy', label: 'Privacy Policy' },
  { id: 'terms-of-service', label: 'Terms of Service' },
  { id: 'cookie-policy', label: 'Cookie Policy' },
];

// Internal page links for dropdowns
const PAGE_LINKS = [
  { value: '/', label: 'Home' },
  { value: '/philosophy', label: 'Philosophy' },
  { value: '/founder', label: 'Founder' },
  { value: '/offerings', label: 'Offerings' },
  { value: '/workshops-programs', label: 'Workshops & Programs' },
  { value: '/vix-journal-trilogy', label: 'VI • X Journal Trilogy' },
  { value: '/blog', label: 'Blog' },
  { value: '/shop', label: 'Shop' },
  { value: '/community-events', label: 'Community Events' },
  { value: '/resources', label: 'Resources' },
  { value: '/walk-with-us', label: 'Walk With Us' },
  { value: '/contact', label: 'Contact' },
  { value: '/about', label: 'About' },
  { value: '/about-justxempower', label: 'About JustxEmpower' },
  { value: '/accessibility', label: 'Accessibility' },
  { value: '/privacy-policy', label: 'Privacy Policy' },
  { value: '/terms-of-service', label: 'Terms of Service' },
  { value: '/cookie-policy', label: 'Cookie Policy' },
];

export default function AdminContent() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  
  // Get page from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const pageFromUrl = urlParams.get('page');
  
  const [selectedPage, setSelectedPage] = useState(pageFromUrl || 'home');
  const [sections, setSections] = useState<RawSection[]>([]);
  const [editedSections, setEditedSections] = useState<Record<number, Record<string, any>>>({});
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<{ sectionId: number; fieldKey: string } | null>(null);
  const [completenessData, setCompletenessData] = useState<CompletenessData | null>(null);

  // Fetch sections from pageSections table
  const fetchSections = useCallback(async () => {
    const pageId = PAGE_ID_MAP[selectedPage];
    if (!pageId) {
      console.error('No pageId found for:', selectedPage);
      setSections([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/trpc/pageSections.getByPage?input=${encodeURIComponent(JSON.stringify({ json: { pageId } }))}`);
      const data = await response.json();
      
      let fetchedSections: RawSection[] = [];
      if (data.result?.data?.json) {
        fetchedSections = data.result.data.json;
      } else if (data.result?.data) {
        fetchedSections = data.result.data;
      }
      
      // Parse content JSON strings
      fetchedSections = fetchedSections.map(s => ({
        ...s,
        content: typeof s.content === 'string' ? JSON.parse(s.content || '{}') : (s.content || {})
      }));
      
      setSections(fetchedSections);
      
      // Auto-expand all sections
      const expanded: Record<number, boolean> = {};
      fetchedSections.forEach(s => { expanded[s.id] = true; });
      setExpandedSections(expanded);
      
      // Fetch completeness data
      const completenessResponse = await fetch(`/api/trpc/pageSections.getPageCompleteness?input=${encodeURIComponent(JSON.stringify({ json: { pageId } }))}`);
      const completenessResult = await completenessResponse.json();
      if (completenessResult.result?.data?.json) {
        setCompletenessData(completenessResult.result.data.json);
      } else if (completenessResult.result?.data) {
        setCompletenessData(completenessResult.result.data);
      }
      
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error('Failed to load page sections');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPage]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSections();
      setEditedSections({});
    }
  }, [selectedPage, isAuthenticated, fetchSections]);

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation('/admin/login');
    }
  }, [isAuthenticated, isChecking, setLocation]);

  // Handle content field change
  const handleFieldChange = (sectionId: number, fieldKey: string, value: any) => {
    setEditedSections(prev => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] || {}),
        [fieldKey]: value
      }
    }));
  };

  // Get current value for a field (edited or original)
  // Handles object values by stringifying them
  const getFieldValue = (section: RawSection, fieldKey: string): string => {
    let value;
    if (editedSections[section.id]?.[fieldKey] !== undefined) {
      value = editedSections[section.id][fieldKey];
    } else {
      value = section.content?.[fieldKey];
    }
    
    // Handle null/undefined
    if (value === null || value === undefined) return '';
    
    // Handle objects - stringify them for display
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    
    return String(value);
  };

  // Check if a field has been modified
  const isFieldModified = (sectionId: number, fieldKey: string): boolean => {
    return editedSections[sectionId]?.[fieldKey] !== undefined;
  };

  // Save all changes to pageSections table
  const handleSaveAll = async () => {
    const editedIds = Object.keys(editedSections).map(Number);
    if (editedIds.length === 0) {
      toast.info('No changes to save');
      return;
    }

    setIsSaving(true);
    let successCount = 0;
    let errorCount = 0;

    for (const sectionId of editedIds) {
      const section = sections.find(s => s.id === sectionId);
      if (!section) continue;

      // Merge edited fields with existing content
      const updatedContent = {
        ...section.content,
        ...editedSections[sectionId]
      };

      try {
        const adminToken = localStorage.getItem('adminToken');
        const response = await fetch('/api/trpc/pageSections.updateContent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': adminToken || '',
          },
          body: JSON.stringify({
            json: {
              id: sectionId,
              content: updatedContent
            }
          })
        });

        const result = await response.json();
        if (result.result?.data?.json?.success || result.result?.data?.success) {
          successCount++;
        } else {
          console.error('Failed to update section:', sectionId, result);
          errorCount++;
        }
      } catch (error) {
        console.error('Error updating section:', sectionId, error);
        errorCount++;
      }
    }

    if (errorCount === 0) {
      toast.success(`Successfully saved ${successCount} section${successCount > 1 ? 's' : ''}`);
    } else if (successCount > 0) {
      toast.warning(`Saved ${successCount} section${successCount > 1 ? 's' : ''}, ${errorCount} failed`);
    } else {
      toast.error('Failed to save changes');
    }

    setEditedSections({});
    await fetchSections();
    setIsSaving(false);
  };

  const toggleSection = (sectionId: number) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleOpenMediaPicker = (sectionId: number, fieldKey: string) => {
    setSelectedField({ sectionId, fieldKey });
    setMediaPickerOpen(true);
  };

  const handleMediaSelect = (url: string) => {
    if (selectedField) {
      handleFieldChange(selectedField.sectionId, selectedField.fieldKey, url);
    }
    setMediaPickerOpen(false);
    setSelectedField(null);
  };

  // Format field name for display
  const formatFieldName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/Url/g, 'URL')
      .replace(/Cta/g, 'CTA');
  };

  // Determine if field should be a textarea
  const isLongTextField = (key: string): boolean => {
    const longFields = ['description', 'content', 'paragraph', 'text', 'body', 'intro', 'excerpt'];
    return longFields.some(f => key.toLowerCase().includes(f));
  };

  // Determine if field is a link field
  const isLinkField = (key: string): boolean => {
    const linkFields = ['link', 'url', 'href', 'ctalink', 'buttonlink'];
    return linkFields.some(f => key.toLowerCase().includes(f));
  };

  // Determine if field is an image/media field
  const isMediaField = (key: string): boolean => {
    const mediaFields = ['image', 'video', 'media', 'background', 'thumbnail', 'avatar', 'photo'];
    return mediaFields.some(f => key.toLowerCase().includes(f));
  };

  // Convert sections to PageSection format for the mapper
  const pageSections: PageSection[] = sections.map(section => {
    const sectionCompleteness = completenessData?.sections?.find(s => s.id === section.id);
    return {
      id: section.id.toString(),
      type: section.sectionType as SectionType,
      label: section.title || section.sectionType,
      contentKey: section.sectionType,
      hasContent: Object.keys(section.content || {}).length > 0,
      fields: section.requiredFields || [],
      completeness: sectionCompleteness?.completeness ?? 0,
      requiredFields: section.requiredFields || [],
      missingFields: sectionCompleteness?.missingFields || [],
    };
  });

  const hasUnsavedChanges = Object.keys(editedSections).length > 0;

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

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      <AdminSidebar variant="light" />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              {hasUnsavedChanges && (
                <Button
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : `Save All Changes (${Object.keys(editedSections).length})`}
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
              {PAGES.map((page) => (
                <button
                  key={page.id}
                  onClick={() => {
                    setSelectedPage(page.id);
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

            {isLoading ? (
              <div className="text-center py-12 text-neutral-500">Loading sections...</div>
            ) : (
              <div className="flex gap-6">
                {/* Left: Page Section Mapper */}
                <div className="w-64 flex-shrink-0 sticky top-8 self-start">
                  <PageSectionMapper
                    sections={pageSections}
                    activeSection={Object.keys(expandedSections).find(k => expandedSections[parseInt(k)])}
                    onSectionClick={(sectionId) => {
                      const id = parseInt(sectionId);
                      setExpandedSections(prev => ({
                        ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
                        [id]: true
                      }));
                      const element = document.getElementById(`section-${id}`);
                      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="dark:bg-neutral-900 dark:border-neutral-800"
                  />
                </div>

                {/* Right: Content Sections */}
                <div className="flex-1 space-y-4">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      id={`section-${section.id}`}
                      className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
                    >
                      {/* Section Header */}
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between p-6 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                      >
                        <div>
                          <h2 className="text-xl font-light text-neutral-900 dark:text-neutral-100">
                            {section.title || formatFieldName(section.sectionType)}
                          </h2>
                          <p className="text-sm text-neutral-500 mt-1">
                            Section Type: {section.sectionType}
                          </p>
                        </div>
                        {expandedSections[section.id] ? (
                          <ChevronUp className="w-5 h-5 text-neutral-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-neutral-400" />
                        )}
                      </button>

                      {/* Section Content */}
                      {expandedSections[section.id] && (
                        <div className="px-6 pb-6 space-y-4 border-t border-neutral-100 dark:border-neutral-800">
                          {/* Render fields from requiredFields or content keys */}
                          {(section.requiredFields?.length > 0 
                            ? section.requiredFields 
                            : Object.keys(section.content || {})
                          ).map((fieldKey) => {
                            const value = getFieldValue(section, fieldKey);
                            const modified = isFieldModified(section.id, fieldKey);
                            const isLong = isLongTextField(fieldKey);
                            const isLink = isLinkField(fieldKey);
                            const isMedia = isMediaField(fieldKey);

                            return (
                              <div key={fieldKey} className="pt-4">
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                  {formatFieldName(fieldKey)}
                                  {modified && (
                                    <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                                      (Modified)
                                    </span>
                                  )}
                                </label>

                                {isLong ? (
                                  <Textarea
                                    value={value}
                                    onChange={(e) => handleFieldChange(section.id, fieldKey, e.target.value)}
                                    className={`min-h-[100px] ${modified ? 'border-amber-400 dark:border-amber-600' : ''}`}
                                    placeholder={`Enter ${formatFieldName(fieldKey)}...`}
                                  />
                                ) : isLink ? (
                                  <div className="flex gap-2">
                                    <Select
                                      value={value}
                                      onValueChange={(v) => handleFieldChange(section.id, fieldKey, v)}
                                    >
                                      <SelectTrigger className={`flex-1 ${modified ? 'border-amber-400 dark:border-amber-600' : ''}`}>
                                        <SelectValue placeholder="Select a page link..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {PAGE_LINKS.map((link) => (
                                          <SelectItem key={link.value} value={link.value}>
                                            {link.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      value={value}
                                      onChange={(e) => handleFieldChange(section.id, fieldKey, e.target.value)}
                                      className={`flex-1 ${modified ? 'border-amber-400 dark:border-amber-600' : ''}`}
                                      placeholder="Or enter custom URL..."
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-10 w-10"
                                      onClick={() => window.open(value, '_blank')}
                                      disabled={!value}
                                    >
                                      <LinkIcon className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <Input
                                      value={value}
                                      onChange={(e) => handleFieldChange(section.id, fieldKey, e.target.value)}
                                      className={`flex-1 ${modified ? 'border-amber-400 dark:border-amber-600' : ''}`}
                                      placeholder={`Enter ${formatFieldName(fieldKey)}...`}
                                    />
                                    {isMedia && (
                                      <Button
                                        type="button"
                                        onClick={() => handleOpenMediaPicker(section.id, fieldKey)}
                                        variant="outline"
                                        size="icon"
                                        className="h-10 w-10"
                                      >
                                        <Image className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                )}

                                {/* Preview for media/URL fields */}
                                {(isMedia || isLink) && value && (
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                    {isMedia && value.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                                      <img src={value} alt="Preview" className="mt-2 max-h-32 rounded" />
                                    ) : (
                                      <>Preview: <a href={value} target="_blank" rel="noopener noreferrer" className="underline">{value}</a></>
                                    )}
                                  </p>
                                )}
                              </div>
                            );
                          })}

                          {/* Show all content fields even if not in requiredFields */}
                          {Object.keys(section.content || {})
                            .filter(key => !section.requiredFields?.includes(key))
                            .map((fieldKey) => {
                              const value = getFieldValue(section, fieldKey);
                              const modified = isFieldModified(section.id, fieldKey);
                              const isLong = isLongTextField(fieldKey);

                              return (
                                <div key={fieldKey} className="pt-4">
                                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    {formatFieldName(fieldKey)}
                                    {modified && (
                                      <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                                        (Modified)
                                      </span>
                                    )}
                                    <span className="ml-2 text-xs text-neutral-400">(additional field)</span>
                                  </label>
                                  {isLong ? (
                                    <Textarea
                                      value={value}
                                      onChange={(e) => handleFieldChange(section.id, fieldKey, e.target.value)}
                                      className={`min-h-[100px] ${modified ? 'border-amber-400 dark:border-amber-600' : ''}`}
                                      placeholder={`Enter ${formatFieldName(fieldKey)}...`}
                                    />
                                  ) : (
                                    <Input
                                      value={value}
                                      onChange={(e) => handleFieldChange(section.id, fieldKey, e.target.value)}
                                      className={`${modified ? 'border-amber-400 dark:border-amber-600' : ''}`}
                                      placeholder={`Enter ${formatFieldName(fieldKey)}...`}
                                    />
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  ))}

                  {sections.length === 0 && (
                    <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                      No sections found for this page. Add sections in Page Builder first.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sticky Save Button */}
            {hasUnsavedChanges && (
              <div className="fixed bottom-8 right-8">
                <Button
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  size="lg"
                  className="gap-2 shadow-lg"
                >
                  <Save className="w-5 h-5" />
                  {isSaving ? 'Saving...' : `Save All Changes (${Object.keys(editedSections).length})`}
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
          setSelectedField(null);
        }}
        onSelect={handleMediaSelect}
        mediaType="all"
      />
    </div>
  );
}
