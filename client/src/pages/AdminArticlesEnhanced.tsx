import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit, Trash2, Save, X, Sparkles, Loader2, ChevronUp, ChevronDown, 
  Image, Search, RefreshCw, FileText, Eye, Calendar, Filter, LayoutGrid, List,
  Heading1, Heading2, Heading3, Type, Bold, Italic, AlignLeft, Quote
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminSidebar from '@/components/AdminSidebar';

function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setDisplayValue(value); clearInterval(timer); }
      else { setDisplayValue(Math.floor(current)); }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
}

export default function AdminArticlesEnhanced() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'published' | 'draft' | 'scheduled'>('published');
  const [publishDate, setPublishDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState('professional');
  const [fontSize, setFontSize] = useState('base');
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Insert HTML tag at cursor position
  const insertTag = (openTag: string, closeTag: string = '') => {
    const textarea = contentRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const beforeText = content.substring(0, start);
    const afterText = content.substring(end);
    
    const newContent = beforeText + openTag + selectedText + closeTag + afterText;
    setContent(newContent);
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + openTag.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertHeading = (level: number) => {
    insertTag(`<h${level}>`, `</h${level}>\n\n`);
  };

  const insertParagraph = () => {
    insertTag('<p>', '</p>\n\n');
  };

  const insertBold = () => {
    insertTag('<strong>', '</strong>');
  };

  const insertItalic = () => {
    insertTag('<em>', '</em>');
  };

  const insertBlockquote = () => {
    insertTag('<blockquote>', '</blockquote>\n\n');
  };

  const insertFontSize = (size: string) => {
    const sizeMap: Record<string, string> = {
      'xs': 'font-size: 0.75rem',
      'sm': 'font-size: 0.875rem',
      'base': 'font-size: 1rem',
      'lg': 'font-size: 1.125rem',
      'xl': 'font-size: 1.25rem',
      '2xl': 'font-size: 1.5rem',
      '3xl': 'font-size: 1.875rem',
    };
    insertTag(`<span style="${sizeMap[size]}">`, '</span>');
  };

  const { data: articles, isLoading, refetch } = trpc.admin.articles.list.useQuery(undefined, { enabled: isAuthenticated });

  const createMutation = trpc.admin.articles.create.useMutation({
    onSuccess: () => { toast.success('Article created'); resetForm(); refetch(); },
    onError: (error) => toast.error(error.message || 'Failed to create'),
  });

  const updateMutation = trpc.admin.articles.update.useMutation({
    onSuccess: () => { toast.success('Article updated'); resetForm(); refetch(); },
    onError: (error) => toast.error(error.message || 'Failed to update'),
  });

  const deleteMutation = trpc.admin.articles.delete.useMutation({
    onSuccess: () => { toast.success('Article deleted'); refetch(); },
    onError: (error) => toast.error(error.message || 'Failed to delete'),
  });

  const generateArticleMutation = trpc.admin.ai.generateArticle.useMutation({
    onSuccess: (data) => { setContent(data.content); setAiDialogOpen(false); toast.success('Content generated!'); },
    onError: (error) => toast.error(error.message || 'Failed to generate'),
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation('/admin/login');
  }, [isAuthenticated, isChecking, setLocation]);

  // Filter articles
  const filteredArticles = useMemo(() => {
    return (articles || []).filter((article: any) => {
      const matchesSearch = searchQuery === '' ||
        article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || article.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [articles, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const all = articles || [];
    const published = all.filter((a: any) => a.status === 'published').length;
    const drafts = all.filter((a: any) => a.status === 'draft').length;
    const scheduled = all.filter((a: any) => a.status === 'scheduled').length;
    return { total: all.length, published, drafts, scheduled };
  }, [articles]);

  const resetForm = () => {
    setIsEditing(false); setEditingId(null); setTitle(''); setSubtitle('');
    setContent(''); setCategory(''); setStatus('published'); setPublishDate(''); setImageUrl('');
  };

  const handleEdit = (article: any) => {
    setIsEditing(true);
    setEditingId(article.id);
    setTitle(article.title);
    setSubtitle(article.excerpt || '');
    setContent(article.content);
    setCategory(article.category || '');
    setStatus(article.status || 'published');
    setImageUrl(article.imageUrl || '');
    if (article.publishDate) {
      const date = new Date(article.publishDate);
      setPublishDate(new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) { toast.error('Title and content required'); return; }
    const data: any = {
      title, slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      excerpt: subtitle, content, category, status, imageUrl: imageUrl || null,
      publishDate: publishDate ? new Date(publishDate).toISOString() : (status === 'published' ? new Date().toISOString() : null),
    };
    if (editingId) updateMutation.mutate({ id: editingId, ...data });
    else createMutation.mutate(data);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this article?')) deleteMutation.mutate({ id });
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'published': return 'bg-emerald-100 text-emerald-700';
      case 'draft': return 'bg-amber-100 text-amber-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-stone-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 flex">
      <AdminSidebar variant="dark" />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Articles</h1>
                <p className="text-stone-500 text-sm">Create and manage journal articles</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" />Refresh
                </Button>
                <Button onClick={() => setIsEditing(true)} className="bg-amber-600 hover:bg-amber-700">
                  <Plus className="w-4 h-4 mr-2" />New Article
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-600">Total Articles</p>
                      <p className="text-3xl font-bold text-amber-900"><AnimatedCounter value={stats.total} /></p>
                    </div>
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600">Published</p>
                      <p className="text-3xl font-bold text-emerald-900"><AnimatedCounter value={stats.published} /></p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Eye className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Drafts</p>
                      <p className="text-3xl font-bold text-blue-900"><AnimatedCounter value={stats.drafts} /></p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Edit className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Scheduled</p>
                      <p className="text-3xl font-bold text-purple-900"><AnimatedCounter value={stats.scheduled} /></p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-4 items-center w-full md:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input placeholder="Search articles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}><List className="w-4 h-4" /></Button>
              <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}><LayoutGrid className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* Editor Dialog */}
          <Dialog open={isEditing} onOpenChange={(open) => { if (!open) resetForm(); }}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Article' : 'New Article'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article title" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., NATURE, EXPRESSION" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subtitle / Excerpt</Label>
                  <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Brief description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{status === 'scheduled' ? 'Publish Date *' : 'Publish Date'}</Label>
                    <Input type="datetime-local" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} required={status === 'scheduled'} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cover Image URL</Label>
                  <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
                  {imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Content *</Label>
                    <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm"><Sparkles className="w-4 h-4 mr-2" />AI Generate</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Generate with AI</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Topic</Label>
                            <Textarea value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="What should the article be about?" rows={3} />
                          </div>
                          <div className="space-y-2">
                            <Label>Tone</Label>
                            <Select value={aiTone} onValueChange={setAiTone}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="inspirational">Inspirational</SelectItem>
                                <SelectItem value="conversational">Conversational</SelectItem>
                                <SelectItem value="poetic">Poetic</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => generateArticleMutation.mutate({ topic: aiTopic, tone: aiTone })} disabled={generateArticleMutation.isPending || !aiTopic}>
                            {generateArticleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            Generate
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {/* Rich Text Toolbar */}
                  <div className="flex flex-wrap items-center gap-1 p-2 bg-stone-100 dark:bg-stone-800 rounded-t-lg border border-b-0 border-stone-200 dark:border-stone-700">
                    {/* Headings */}
                    <div className="flex items-center gap-1 pr-2 border-r border-stone-300 dark:border-stone-600">
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertHeading(1)} title="Heading 1" className="h-8 w-8 p-0">
                        <Heading1 className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertHeading(2)} title="Heading 2" className="h-8 w-8 p-0">
                        <Heading2 className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertHeading(3)} title="Heading 3" className="h-8 w-8 p-0">
                        <Heading3 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Text formatting */}
                    <div className="flex items-center gap-1 px-2 border-r border-stone-300 dark:border-stone-600">
                      <Button type="button" variant="ghost" size="sm" onClick={insertParagraph} title="Paragraph" className="h-8 w-8 p-0">
                        <AlignLeft className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={insertBold} title="Bold" className="h-8 w-8 p-0">
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={insertItalic} title="Italic" className="h-8 w-8 p-0">
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={insertBlockquote} title="Blockquote" className="h-8 w-8 p-0">
                        <Quote className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Font Size */}
                    <div className="flex items-center gap-2 pl-2">
                      <Type className="w-4 h-4 text-stone-500" />
                      <Select value={fontSize} onValueChange={(v) => { setFontSize(v); insertFontSize(v); }}>
                        <SelectTrigger className="w-24 h-8 text-xs">
                          <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="xs">XS (12px)</SelectItem>
                          <SelectItem value="sm">SM (14px)</SelectItem>
                          <SelectItem value="base">Base (16px)</SelectItem>
                          <SelectItem value="lg">LG (18px)</SelectItem>
                          <SelectItem value="xl">XL (20px)</SelectItem>
                          <SelectItem value="2xl">2XL (24px)</SelectItem>
                          <SelectItem value="3xl">3XL (30px)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Textarea 
                    ref={contentRef}
                    value={content} 
                    onChange={(e) => setContent(e.target.value)} 
                    placeholder="Article content (supports HTML)" 
                    rows={12} 
                    required 
                    className="rounded-t-none font-mono text-sm"
                  />
                  <p className="text-xs text-stone-500">Tip: Select text then click a format button to wrap it in HTML tags</p>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-amber-600 hover:bg-amber-700">
                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {editingId ? 'Update' : 'Create'} Article
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Articles List/Grid */}
          {filteredArticles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-stone-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No articles found</h3>
                <p className="text-stone-500 mb-4">{searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first article'}</p>
                <Button onClick={() => setIsEditing(true)} className="bg-amber-600 hover:bg-amber-700">
                  <Plus className="w-4 h-4 mr-2" />New Article
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredArticles.map((article: any, i: number) => (
                  <motion.div key={article.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                      {article.imageUrl && <img src={article.imageUrl} alt={article.title} className="w-full h-40 object-cover" />}
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(article.status)}>{article.status}</Badge>
                          {article.category && <Badge variant="outline">{article.category}</Badge>}
                        </div>
                        <h3 className="font-semibold text-stone-900 mb-1 line-clamp-2">{article.title}</h3>
                        {article.excerpt && <p className="text-sm text-stone-500 line-clamp-2 mb-3">{article.excerpt}</p>}
                        <div className="flex items-center justify-between pt-3 border-t">
                          <span className="text-xs text-stone-500">{article.publishDate ? new Date(article.publishDate).toLocaleDateString() : 'No date'}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(article)}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(article.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-3">
                {filteredArticles.map((article: any, i: number) => (
                  <motion.div key={article.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ delay: i * 0.03 }}>
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="w-20 h-20 bg-stone-100 rounded-xl flex-shrink-0 overflow-hidden">
                          {article.imageUrl ? (
                            <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><FileText className="w-8 h-8 text-stone-400" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-stone-900 truncate">{article.title}</h3>
                            <Badge className={getStatusColor(article.status)}>{article.status}</Badge>
                            {article.category && <Badge variant="outline">{article.category}</Badge>}
                          </div>
                          {article.excerpt && <p className="text-sm text-stone-500 line-clamp-1">{article.excerpt}</p>}
                          <p className="text-xs text-stone-400 mt-1">{article.publishDate ? new Date(article.publishDate).toLocaleDateString() : 'No date'}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(article)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(article.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}
