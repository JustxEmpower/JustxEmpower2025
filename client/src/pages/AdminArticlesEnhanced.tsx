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
  Plus, Edit, Trash2, Save, X, Sparkles, Loader2, 
  Search, RefreshCw, FileText, Eye, Calendar, Filter, LayoutGrid, List,
  Type, GripVertical, Copy, Maximize2, Minimize2
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
  
  // Block-based content editor
  type ContentBlock = { id: string; type: 'heading' | 'text'; content: string };
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    { id: '1', type: 'heading', content: 'Section Heading' },
    { id: '2', type: 'text', content: 'Enter your text here...' }
  ]);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addBlock = (type: 'heading' | 'text') => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      content: type === 'heading' ? 'New Heading' : 'Enter your text here...'
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const updateBlock = (id: string, content: string) => {
    setContentBlocks(contentBlocks.map(b => b.id === id ? { ...b, content } : b));
  };

  const deleteBlock = (id: string) => {
    if (contentBlocks.length > 1) {
      setContentBlocks(contentBlocks.filter(b => b.id !== id));
    }
  };

  const duplicateBlock = (id: string) => {
    const block = contentBlocks.find(b => b.id === id);
    if (block) {
      const newBlock = { ...block, id: Date.now().toString() };
      const index = contentBlocks.findIndex(b => b.id === id);
      const newBlocks = [...contentBlocks];
      newBlocks.splice(index + 1, 0, newBlock);
      setContentBlocks(newBlocks);
    }
  };

  // Convert blocks to HTML for storage
  const blocksToHtml = () => {
    return contentBlocks.map(block => {
      if (block.type === 'heading') {
        return `<h2>${block.content}</h2>`;
      }
      return `<p>${block.content}</p>`;
    }).join('\n\n');
  };

  // Parse HTML back to blocks when editing
  const htmlToBlocks = (html: string): ContentBlock[] => {
    if (!html || html.trim() === '') {
      return [{ id: '1', type: 'text', content: 'Enter your text here...' }];
    }
    const blocks: ContentBlock[] = [];
    const headingRegex = /<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi;
    const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gi;
    let match;
    let lastIndex = 0;
    
    // Simple parsing - extract headings and paragraphs
    const tempDiv = html.replace(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi, '|||HEADING:$1|||')
                        .replace(/<p[^>]*>(.*?)<\/p>/gi, '|||TEXT:$1|||');
    const parts = tempDiv.split('|||').filter(p => p.trim());
    
    parts.forEach((part, i) => {
      if (part.startsWith('HEADING:')) {
        blocks.push({ id: `${Date.now()}-${i}`, type: 'heading', content: part.replace('HEADING:', '').trim() });
      } else if (part.startsWith('TEXT:')) {
        blocks.push({ id: `${Date.now()}-${i}`, type: 'text', content: part.replace('TEXT:', '').trim() });
      } else if (part.trim()) {
        blocks.push({ id: `${Date.now()}-${i}`, type: 'text', content: part.trim() });
      }
    });
    
    return blocks.length > 0 ? blocks : [{ id: '1', type: 'text', content: 'Enter your text here...' }];
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
    setContentBlocks([
      { id: '1', type: 'heading', content: 'Section Heading' },
      { id: '2', type: 'text', content: 'Enter your text here...' }
    ]);
  };

  const handleEdit = (article: any) => {
    setIsEditing(true);
    setEditingId(article.id);
    setTitle(article.title);
    setSubtitle(article.excerpt || '');
    setContent(article.content);
    setContentBlocks(htmlToBlocks(article.content || ''));
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
    const htmlContent = blocksToHtml();
    if (!title || !htmlContent) { toast.error('Title and content required'); return; }
    const data: any = {
      title, slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      excerpt: subtitle, content: htmlContent, category, status, imageUrl: imageUrl || null,
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
                <div className="space-y-3">
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
                  
                  {/* Visual Block Editor */}
                  <div className="space-y-3 bg-stone-50 dark:bg-stone-900 rounded-xl p-4 border border-stone-200 dark:border-stone-700">
                    {contentBlocks.map((block, index) => (
                      <div key={block.id} className="group relative">
                        {/* Block Label */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-800 dark:bg-stone-700 text-white text-xs font-medium rounded-md">
                            <Type className="w-3 h-3" />
                            {block.type === 'heading' ? 'Heading' : 'Text Block'}
                          </span>
                          <div className="flex-1" />
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            {block.type === 'text' && (
                              <button type="button" onClick={() => toggleExpand(block.id)} className="p-1.5 rounded bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 transition-colors" title={expandedBlocks.has(block.id) ? "Collapse" : "Expand"}>
                                {expandedBlocks.has(block.id) ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            <button type="button" onClick={() => duplicateBlock(block.id)} className="p-1.5 rounded bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors" title="Duplicate">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => deleteBlock(block.id)} className="p-1.5 rounded bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Block Content */}
                        {block.type === 'heading' ? (
                          <input
                            type="text"
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, e.target.value)}
                            className="w-full px-4 py-3 text-2xl font-serif bg-white dark:bg-stone-800 border-2 border-amber-200 dark:border-amber-800 rounded-lg focus:border-amber-400 dark:focus:border-amber-600 focus:outline-none transition-colors"
                            placeholder="Section Heading"
                          />
                        ) : (
                          <textarea
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, e.target.value)}
                            rows={expandedBlocks.has(block.id) ? 16 : 4}
                            className={`w-full px-4 py-3 text-base bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:border-amber-400 dark:focus:border-amber-600 focus:outline-none transition-all duration-200 ${expandedBlocks.has(block.id) ? 'min-h-[400px]' : ''}`}
                            placeholder="Enter your text here..."
                          />
                        )}
                      </div>
                    ))}
                    
                    {/* Add Block Button */}
                    <div className="flex items-center justify-center pt-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => addBlock('heading')}
                          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:border-amber-300 dark:hover:border-amber-700 transition-colors text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Heading
                        </button>
                        <button
                          type="button"
                          onClick={() => addBlock('text')}
                          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:border-amber-300 dark:hover:border-amber-700 transition-colors text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Text Block
                        </button>
                      </div>
                    </div>
                  </div>
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
