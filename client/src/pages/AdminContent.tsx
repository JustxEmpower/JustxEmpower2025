import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { LogOut, FileText, Settings, Layout, ArrowLeft, Save } from 'lucide-react';

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

  const handleSave = (item: ContentItem) => {
    const newValue = editedContent[item.id] ?? item.contentValue;
    updateMutation.mutate({
      id: item.id,
      contentValue: newValue,
    });
  };

  const handleSaveAll = () => {
    Object.entries(editedContent).forEach(([id, value]) => {
      updateMutation.mutate({
        id: parseInt(id),
        contentValue: value,
      });
    });
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

  const pages = ['home', 'about', 'philosophy', 'offerings', 'journal', 'contact'];
  
  const navItems = [
    { icon: Layout, label: 'Content', path: '/admin/content' },
    { icon: FileText, label: 'Articles', path: '/admin/articles' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const groupedContent = content.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, ContentItem[]>);

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
            <Button
              onClick={() => setLocation('/admin')}
              variant="ghost"
              className="mb-6 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>

            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-light text-neutral-900 dark:text-neutral-100 mb-2">
                  Content Editor
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Edit page content, hero sections, and media
                </p>
              </div>
              {Object.keys(editedContent).length > 0 && (
                <Button onClick={handleSaveAll} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save All Changes
                </Button>
              )}
            </div>

            {/* Page Selector */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 mb-6">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                Select Page
              </p>
              <div className="flex flex-wrap gap-2">
                {pages.map((page) => (
                  <Button
                    key={page}
                    onClick={() => setSelectedPage(page)}
                    variant={selectedPage === page ? 'default' : 'outline'}
                    size="sm"
                    className="capitalize"
                  >
                    {page}
                  </Button>
                ))}
              </div>
            </div>

            {/* Content Sections */}
            {Object.entries(groupedContent).map(([section, items]) => (
              <div
                key={section}
                className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 mb-6"
              >
                <h2 className="text-xl font-light text-neutral-900 dark:text-neutral-100 mb-4 capitalize">
                  {section}
                </h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id}>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 capitalize">
                        {item.contentKey.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      {item.contentKey.includes('Url') || item.contentKey.includes('url') ? (
                        <Input
                          value={editedContent[item.id] ?? item.contentValue}
                          onChange={(e) => handleContentChange(item.id, e.target.value)}
                          className="h-11 font-mono text-sm"
                          placeholder="Enter URL or file path"
                        />
                      ) : item.contentKey === 'title' ? (
                        <Input
                          value={editedContent[item.id] ?? item.contentValue}
                          onChange={(e) => handleContentChange(item.id, e.target.value)}
                          className="h-11"
                        />
                      ) : (
                        <Textarea
                          value={editedContent[item.id] ?? item.contentValue}
                          onChange={(e) => handleContentChange(item.id, e.target.value)}
                          className="min-h-[80px]"
                        />
                      )}
                      {editedContent[item.id] !== undefined && editedContent[item.id] !== item.contentValue && (
                        <Button
                          onClick={() => handleSave(item)}
                          size="sm"
                          className="mt-2 gap-2"
                          disabled={updateMutation.isPending}
                        >
                          <Save className="w-3 h-3" />
                          Save
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {content.length === 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-xl p-12 border border-neutral-200 dark:border-neutral-800 text-center">
                <p className="text-neutral-500 dark:text-neutral-400">
                  No content found for this page. Content will be created automatically when you add it.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
