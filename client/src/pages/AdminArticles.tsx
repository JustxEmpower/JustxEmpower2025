import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { LogOut, FileText, Settings, Layout, Plus, Edit, Trash2, Save, X, FolderOpen, Palette, Files, BarChart3, Sparkles, Loader2, ChevronUp, ChevronDown, Image } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminSidebar from '@/components/AdminSidebar';
// ReactQuill removed due to React 19 compatibility issues

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
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState('professional');
  const [metaDescription, setMetaDescription] = useState('');
  const [suggestionsDialogOpen, setSuggestionsDialogOpen] = useState(false);
  const [contentSuggestions, setContentSuggestions] = useState<string[]>([]);
  const [status, setStatus] = useState<'published' | 'draft' | 'scheduled'>('published');
  const [publishDate, setPublishDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');

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

  const reorderMutation = trpc.admin.articles.reorder.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reorder articles');
    },
  });

  const handleMoveUp = (index: number) => {
    if (!articles || index === 0) return;
    const newOrder = [...articles];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    const updates = newOrder.map((article: any, i: number) => ({
      id: article.id,
      displayOrder: i,
    }));
    reorderMutation.mutate({ articles: updates });
  };

  const handleMoveDown = (index: number) => {
    if (!articles || index === articles.length - 1) return;
    const newOrder = [...articles];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    const updates = newOrder.map((article: any, i: number) => ({
      id: article.id,
      displayOrder: i,
    }));
    reorderMutation.mutate({ articles: updates });
  };

  const deleteMutation = trpc.admin.articles.delete.useMutation({
    onSuccess: () => {
      toast.success('Article deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete article');
    },
  });

  const generateArticleMutation = trpc.admin.ai.generateArticle.useMutation({
    onSuccess: (data) => {
      setContent(data.content);
      setAiDialogOpen(false);
      toast.success('Article content generated successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate article content');
    },
  });

  const generateMetaMutation = trpc.admin.ai.generateMetaDescription.useMutation({
    onSuccess: (data) => {
      setMetaDescription(data.description);
      toast.success('SEO meta description generated!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate meta description');
    },
  });

  const generateSuggestionsMutation = trpc.admin.ai.generateContentSuggestions.useMutation({
    onSuccess: (data) => {
      setContentSuggestions(data.suggestions);
      setSuggestionsDialogOpen(true);
      toast.success('Content suggestions generated!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate suggestions');
    },
  });

  const handleGenerateSEO = () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please enter title and content first');
      return;
    }
    generateMetaMutation.mutate({ title, content });
  };

  const handleGenerateArticle = () => {
    if (!aiTopic.trim()) {
      toast.error('Please enter a topic');
      return;
    }
    generateArticleMutation.mutate({ topic: aiTopic, tone: aiTone });
  };

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
    setMetaDescription('');
    setStatus('published');
    setPublishDate('');
    setImageUrl('');
  };

  const handleEdit = (article: any) => {
    setIsEditing(true);
    setEditingId(article.id);
    setTitle(article.title);
    setSubtitle(article.excerpt || '');
    setContent(article.content);
    setCategory(article.category || '');
    setMetaDescription(article.metaDescription || '');
    setStatus(article.status || 'published');
    setImageUrl(article.imageUrl || '');
    if (article.publishDate) {
      const date = new Date(article.publishDate);
      const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setPublishDate(localDateTime);
    } else {
      setPublishDate('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !content) {
      toast.error('Title and content are required');
      return;
    }

    const articleData: any = {
      title,
      slug: title.toLowerCase().replace(/\s+/g, '-'),
      excerpt: subtitle,
      content,
      category,
      status,
      imageUrl: imageUrl || null,
    };

    // Add publishDate - required for scheduled, optional for others
    if (status === 'scheduled') {
      if (!publishDate) {
        toast.error('Please select a publish date for scheduled articles');
        return;
      }
      articleData.publishDate = new Date(publishDate).toISOString();
    } else if (publishDate) {
      // For published/draft articles, use the selected date if provided
      articleData.publishDate = new Date(publishDate).toISOString();
    } else {
      // Default to current date for published articles without a date
      articleData.publishDate = status === 'published' ? new Date().toISOString() : null;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...articleData });
    } else {
      createMutation.mutate(articleData);
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

  // Quill editor configuration removed

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Sidebar */}
      <AdminSidebar variant="light" />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-5xl mx-auto">
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
                <div className="flex gap-2">
                  <Button 
                    onClick={() => generateSuggestionsMutation.mutate()} 
                    variant="outline" 
                    className="gap-2"
                    disabled={generateSuggestionsMutation.isPending}
                  >
                    {generateSuggestionsMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Content Ideas
                  </Button>
                  <Button onClick={() => setIsEditing(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Article
                  </Button>
                </div>
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

                  {/* Publishing Status */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'published' | 'draft' | 'scheduled')}
                      className="w-full h-11 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>

                  {/* Cover Photo URL */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      <span className="flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        Cover Photo URL
                      </span>
                    </label>
                    <Input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://... or paste image URL"
                      className="h-11"
                    />
                    {imageUrl && (
                      <div className="mt-2 relative rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
                        <img 
                          src={imageUrl} 
                          alt="Cover preview" 
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Enter a URL for the article cover image (displayed in hero section)
                    </p>
                  </div>

                  {/* Date Published - shows for all statuses */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      {status === 'scheduled' ? 'Scheduled Publish Date & Time *' : 'Date Published'}
                    </label>
                    <Input
                      type="datetime-local"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      className="h-11"
                      required={status === 'scheduled'}
                    />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {status === 'scheduled' 
                        ? 'Article will be automatically published at this time'
                        : 'The date this article was published (leave empty for current date)'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Content *
                      </label>
                      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="sm" className="gap-2">
                            <Sparkles className="w-4 h-4" />
                            Generate with AI
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Generate Article with AI</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label htmlFor="ai-topic">Article Topic *</Label>
                              <Textarea
                                id="ai-topic"
                                placeholder="E.g., The Power of Feminine Leadership in Modern Business"
                                value={aiTopic}
                                onChange={(e) => setAiTopic(e.target.value)}
                                rows={3}
                                className="mt-2"
                              />
                            </div>
                            <div>
                              <Label htmlFor="ai-tone">Tone</Label>
                              <select
                                id="ai-tone"
                                value={aiTone}
                                onChange={(e) => setAiTone(e.target.value)}
                                className="w-full mt-2 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                              >
                                <option value="professional">Professional</option>
                                <option value="conversational">Conversational</option>
                                <option value="inspirational">Inspirational</option>
                                <option value="academic">Academic</option>
                                <option value="poetic">Poetic</option>
                              </select>
                            </div>
                            <Button
                              onClick={handleGenerateArticle}
                              disabled={generateArticleMutation.isPending}
                              className="w-full gap-2"
                            >
                              {generateArticleMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4" />
                                  Generate Article
                                </>
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      rows={15}
                      placeholder="Write your article content here..."
                      className="font-mono text-sm"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        SEO Meta Description
                      </label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={handleGenerateSEO}
                        disabled={generateMetaMutation.isPending || !title || !content}
                      >
                        {generateMetaMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Generate SEO
                          </>
                        )}
                      </Button>
                    </div>
                    <Textarea
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      rows={3}
                      placeholder="SEO meta description for search engines (155-160 characters recommended)"
                      maxLength={160}
                      className="text-sm"
                    />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {metaDescription.length}/160 characters
                    </p>
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
                          <div className="flex items-center gap-2 mb-2">
                            {article.category && (
                              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                {article.category}
                              </p>
                            )}
                            {/* Status Badge */}
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              article.status === 'published' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : article.status === 'scheduled'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400'
                            }`}>
                              {article.status === 'scheduled' && article.publishDate
                                ? `Scheduled for ${new Date(article.publishDate).toLocaleDateString()}`
                                : article.status || 'Published'}
                            </span>
                          </div>
                          <h3 className="text-xl font-light text-neutral-900 dark:text-neutral-100 mb-1">
                            {article.title}
                          </h3>
                          {article.excerpt && (
                            <p className="text-neutral-600 dark:text-neutral-400 mb-3">
                              {article.excerpt}
                            </p>
                          )}
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Published: {article.publishDate 
                              ? new Date(article.publishDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                              : article.date 
                                ? new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                : 'No date set'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Reorder buttons */}
                          <div className="flex flex-col gap-1 mr-2">
                            <Button
                              onClick={() => handleMoveUp(articles.findIndex((a: any) => a.id === article.id))}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              disabled={articles.findIndex((a: any) => a.id === article.id) === 0 || reorderMutation.isPending}
                              title="Move up"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleMoveDown(articles.findIndex((a: any) => a.id === article.id))}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              disabled={articles.findIndex((a: any) => a.id === article.id) === articles.length - 1 || reorderMutation.isPending}
                              title="Move down"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </div>
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

      {/* Content Suggestions Dialog */}
      <Dialog open={suggestionsDialogOpen} onOpenChange={setSuggestionsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Content Suggestions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Based on your existing articles, here are some related topic ideas:
            </p>
            <div className="space-y-3">
              {contentSuggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors cursor-pointer"
                  onClick={() => {
                    setTitle(suggestion);
                    setAiTopic(suggestion);
                    setSuggestionsDialogOpen(false);
                    setIsEditing(true);
                    toast.success('Topic selected! You can now generate content.');
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                        {suggestion}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                        Click to use this topic
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setSuggestionsDialogOpen(false)}
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  generateSuggestionsMutation.mutate();
                }}
                disabled={generateSuggestionsMutation.isPending}
                className="gap-2"
              >
                {generateSuggestionsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generate New Ideas
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
