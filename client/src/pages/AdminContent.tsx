import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { LogOut, FileText, Settings, Layout, ArrowLeft, Save, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [selectedPage, setSelectedPage] = useState('home');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [editedContent, setEditedContent] = useState<Record<number, string>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const { data: contentData, isLoading, refetch } = trpc.admin.content.getByPage.useQuery(
    { page: selectedPage },
    { enabled: isAuthenticated }
  );

  const updateMutation = trpc.admin.content.update.useMutation({
    onSuccess: () => {
      toast.success('Content updated successfully');
      setEditedContent({});
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update content');
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
    }
  }, [contentData]);

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation('/admin/login');
    }
  }, [isAuthenticated, isChecking, setLocation]);

  const handleContentChange = (id: number, value: string) => {
    setEditedContent(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveAll = () => {
    if (Object.keys(editedContent).length === 0) {
      toast.info('No changes to save');
      return;
    }
    
    Object.entries(editedContent).forEach(([id, value]) => {
      updateMutation.mutate({
        id: parseInt(id),
        contentValue: value,
      });
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const pages = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About (Founder)' },
    { id: 'philosophy', label: 'Philosophy' },
    { id: 'offerings', label: 'Offerings' },
    { id: 'journal', label: 'Journal' },
    { id: 'contact', label: 'Contact' },
  ];
  
  const navItems = [
    { icon: Layout, label: 'Content', path: '/admin/content' },
    { icon: FileText, label: 'Articles', path: '/admin/articles' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

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
      <aside className="w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <img
            src="/media/logo-mono-white.png"
            alt="Just Empower"
            className="h-10 opacity-90"
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-light">
            Admin Portal
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {username}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Administrator
              </p>
            </div>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            className="w-full justify-start gap-2"
            size="sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <Button
                onClick={() => setLocation('/admin')}
                variant="ghost"
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              
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
                  onClick={() => setSelectedPage(page.id)}
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

            {/* Content Sections */}
            <div className="space-y-4">
              {Object.entries(groupedContent).map(([section, items]) => (
                <div
                  key={section}
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
                              <Input
                                type={inputType}
                                value={currentValue}
                                onChange={(e) => handleContentChange(item.id, e.target.value)}
                                className={`h-11 ${isModified ? 'border-amber-400 dark:border-amber-600' : ''}`}
                                placeholder={`Enter ${item.contentKey}...`}
                              />
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
  );
}
