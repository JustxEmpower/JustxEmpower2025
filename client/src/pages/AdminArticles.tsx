import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { LogOut, FileText, Settings, Layout, ArrowLeft, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Article {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  category: string;
  publishedAt: string;
  createdAt: string;
}

export default function AdminArticles() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking, username, logout } = useAdminAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');

  const { data: articles, isLoading, refetch } = trpc.admin.articles.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const createMutation = trpc.admin.articles.create.useMutation({
    onSuccess: () => {
      toast.success('Article created successfully');
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create article');
    },
  });

  const updateMutation = trpc.admin.articles.update.useMutation({
    onSuccess: () => {
      toast.success('Article updated successfully');
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update article');
    },
  });

  const deleteMutation = trpc.admin.articles.delete.useMutation({
    onSuccess: () => {
      toast.success('Article deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete article');
    },
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation('/admin/login');
    }
  }, [isAuthenticated, isChecking, setLocation]);

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setContent('');
    setCategory('');
  };

  const handleEdit = (article: any) => {
    setIsEditing(true);
    setEditingId(article.id);
    setTitle(article.title);
    setSubtitle(article.excerpt || '');
    setContent(article.content);
    setCategory(article.category || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !content) {
      toast.error('Title and content are required');
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        title,
        slug: title.toLowerCase().replace(/\s+/g, '-'),
        excerpt: subtitle,
        content,
        category,
      });
    } else {
      createMutation.mutate({
        title,
        slug: title.toLowerCase().replace(/\s+/g, '-'),
        excerpt: subtitle,
        content,
        category,
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this article?')) {
      deleteMutation.mutate({ id });
    }
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

  const navItems = [
    { icon: Layout, label: 'Content', path: '/admin/content' },
    { icon: FileText, label: 'Articles', path: '/admin/articles' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean']
    ],
  };

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
                  Article Manager
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Create, edit, and publish journal articles
                </p>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Article
                </Button>
              )}
            </div>

            {/* Editor Form */}
            {isEditing && (
              <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-light text-neutral-900 dark:text-neutral-100">
                    {editingId ? 'Edit Article' : 'New Article'}
                  </h2>
                  <Button
                    onClick={resetForm}
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Title *
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="h-11"
                      placeholder="Enter article title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Subtitle
                    </label>
                    <Input
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="h-11"
                      placeholder="Enter article subtitle (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Category
                    </label>
                    <Input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="h-11"
                      placeholder="e.g., NATURE, EXPRESSION, LINEAGE"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Content *
                    </label>
                    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
                      <ReactQuill
                        theme="snow"
                        value={content}
                        onChange={setContent}
                        modules={quillModules}
                        className="bg-white dark:bg-neutral-900"
                        style={{ minHeight: '300px' }}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="w-full h-11 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingId ? 'Update Article' : 'Publish Article'}
                  </Button>
                </form>
              </div>
            )}

            {/* Articles List */}
            {!isEditing && (
              <div className="space-y-4">
                {articles && articles.length > 0 ? (
                  articles.map((article: any) => (
                    <div
                      key={article.id}
                      className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {article.category && (
                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                              {article.category}
                            </p>
                          )}
                          <h3 className="text-xl font-light text-neutral-900 dark:text-neutral-100 mb-1">
                            {article.title}
                          </h3>
                          {article.excerpt && (
                            <p className="text-neutral-600 dark:text-neutral-400 mb-3">
                              {article.excerpt}
                            </p>
                          )}
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Published: {article.date ? new Date(article.date).toLocaleDateString() : 'Draft'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEdit(article)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDelete(article.id)}
                            variant="outline"
                            size="sm"
                            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white dark:bg-neutral-900 rounded-xl p-12 border border-neutral-200 dark:border-neutral-800 text-center">
                    <FileText className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                    <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                      No articles yet. Create your first article to get started.
                    </p>
                    <Button onClick={() => setIsEditing(true)} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Create Article
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
