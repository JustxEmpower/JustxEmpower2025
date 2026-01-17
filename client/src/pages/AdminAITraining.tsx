import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebar from "@/components/AdminSidebar";
import {
  Brain,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  MessageSquare,
  BookOpen,
  TrendingUp,
  Target,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  Lightbulb,
  GraduationCap,
  Activity,
  Eye,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

const CATEGORIES = [
  { value: "about", label: "About JustxEmpower", color: "bg-blue-100 text-blue-700" },
  { value: "philosophy", label: "Philosophy & Vision", color: "bg-purple-100 text-purple-700" },
  { value: "services", label: "Services & Offerings", color: "bg-green-100 text-green-700" },
  { value: "events", label: "Events & Workshops", color: "bg-amber-100 text-amber-700" },
  { value: "products", label: "Products & Shop", color: "bg-pink-100 text-pink-700" },
  { value: "contact", label: "Contact & Support", color: "bg-cyan-100 text-cyan-700" },
  { value: "general", label: "General Knowledge", color: "bg-stone-100 text-stone-700" },
];

interface KnowledgeItem {
  id: number;
  category: string;
  question: string;
  answer: string;
  keywords: string | null;
  priority: number;
  isActive: number;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function AdminAITraining() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking, username } = useAdminAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("knowledge");

  const [formData, setFormData] = useState({
    category: "general",
    question: "",
    answer: "",
    keywords: "",
    priority: 0,
    isActive: true,
  });

  // Queries
  const knowledgeQuery = (trpc.admin as any).aiTraining.listKnowledge.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const statsQuery = (trpc.admin as any).aiTraining.getStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const recentConversationsQuery = (trpc.admin as any).aiTraining.getRecentConversations.useQuery(
    { limit: 20 },
    { enabled: isAuthenticated }
  );

  // Mutations
  const createKnowledge = (trpc.admin as any).aiTraining.createKnowledge.useMutation({
    onSuccess: () => {
      toast.success("Knowledge added successfully!");
      setIsAddDialogOpen(false);
      resetForm();
      knowledgeQuery.refetch();
      statsQuery.refetch();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateKnowledge = (trpc.admin as any).aiTraining.updateKnowledge.useMutation({
    onSuccess: () => {
      toast.success("Knowledge updated!");
      setEditingItem(null);
      resetForm();
      knowledgeQuery.refetch();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteKnowledge = (trpc.admin as any).aiTraining.deleteKnowledge.useMutation({
    onSuccess: () => {
      toast.success("Knowledge deleted");
      knowledgeQuery.refetch();
      statsQuery.refetch();
    },
    onError: (error: any) => toast.error(error.message),
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isAuthenticated, isChecking, setLocation]);

  const resetForm = () => {
    setFormData({
      category: "general",
      question: "",
      answer: "",
      keywords: "",
      priority: 0,
      isActive: true,
    });
  };

  const handleSubmit = () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error("Question and answer are required");
      return;
    }

    const data = {
      category: formData.category,
      question: formData.question.trim(),
      answer: formData.answer.trim(),
      keywords: formData.keywords ? JSON.stringify(formData.keywords.split(",").map(k => k.trim())) : null,
      priority: formData.priority,
      isActive: formData.isActive ? 1 : 0,
    };

    if (editingItem) {
      updateKnowledge.mutate({ id: editingItem.id, ...data });
    } else {
      createKnowledge.mutate(data);
    }
  };

  const handleEdit = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      question: item.question,
      answer: item.answer,
      keywords: item.keywords ? JSON.parse(item.keywords).join(", ") : "",
      priority: item.priority,
      isActive: item.isActive === 1,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this knowledge item?")) {
      deleteKnowledge.mutate({ id });
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const knowledge = knowledgeQuery.data || [];
  const stats = statsQuery.data || { totalKnowledge: 0, activeKnowledge: 0, totalUsage: 0, avgSatisfaction: 0 };
  const conversations = recentConversationsQuery.data || [];

  // Filter knowledge
  const filteredKnowledge = knowledge.filter((item: KnowledgeItem) => {
    const matchesSearch = searchQuery === "" ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.color || "bg-stone-100 text-stone-700";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 flex">
      <AdminSidebar variant="dark" />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                  <Brain className="w-7 h-7 text-primary" />
                  AI Training Center
                </h1>
                <p className="text-stone-500 text-sm">Teach your AI assistant to be a better guide</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => knowledgeQuery.refetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                  setIsAddDialogOpen(open);
                  if (!open) {
                    setEditingItem(null);
                    resetForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Knowledge
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-amber-500" />
                        {editingItem ? "Edit Knowledge" : "Teach Your AI"}
                      </DialogTitle>
                      <DialogDescription>
                        Add a question-answer pair to help your AI provide better responses
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Priority (0-10)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Question / Trigger Phrase</Label>
                        <Textarea
                          value={formData.question}
                          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                          placeholder="What question should trigger this response? e.g., 'What is JustxEmpower about?'"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Answer / Response</Label>
                        <Textarea
                          value={formData.answer}
                          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                          placeholder="What should the AI respond with?"
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Keywords (comma-separated)</Label>
                        <Input
                          value={formData.keywords}
                          onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                          placeholder="empowerment, coaching, leadership, etc."
                        />
                        <p className="text-xs text-stone-500">Keywords help match user questions to this knowledge</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                        <Label>Active</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleSubmit} disabled={createKnowledge.isPending || updateKnowledge.isPending}>
                        {editingItem ? "Update" : "Add"} Knowledge
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Knowledge Base</p>
                      <p className="text-2xl font-bold text-purple-900">{stats.totalKnowledge}</p>
                      <p className="text-xs text-purple-600">{stats.activeKnowledge} active</p>
                    </div>
                    <BookOpen className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-600 font-medium">Total Usage</p>
                      <p className="text-2xl font-bold text-emerald-900">{stats.totalUsage}</p>
                      <p className="text-xs text-emerald-600">times used</p>
                    </div>
                    <Zap className="w-8 h-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-amber-600 font-medium">Satisfaction</p>
                      <p className="text-2xl font-bold text-amber-900">{stats.avgSatisfaction}%</p>
                      <Progress value={stats.avgSatisfaction} className="h-2 mt-2" />
                    </div>
                    <ThumbsUp className="w-8 h-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Categories</p>
                      <p className="text-2xl font-bold text-blue-900">{CATEGORIES.length}</p>
                      <p className="text-xs text-blue-600">topic areas</p>
                    </div>
                    <Target className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="knowledge" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Knowledge
              </TabsTrigger>
              <TabsTrigger value="conversations" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Conversations
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Insights
              </TabsTrigger>
            </TabsList>

            {/* Knowledge Tab */}
            <TabsContent value="knowledge">
              {/* Search and Filter */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    placeholder="Search knowledge..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[200px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Knowledge List */}
              {knowledgeQuery.isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredKnowledge.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                      <Brain className="w-10 h-10 text-purple-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {searchQuery || categoryFilter !== "all" ? "No matching knowledge found" : "Start Teaching Your AI"}
                    </h3>
                    <p className="text-stone-500 text-center max-w-md mb-6">
                      {searchQuery || categoryFilter !== "all"
                        ? "Try adjusting your search or filter"
                        : "Add question-answer pairs to help your AI provide better, more accurate responses to visitors"}
                    </p>
                    {!searchQuery && categoryFilter === "all" && (
                      <Button onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Knowledge
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredKnowledge.map((item: KnowledgeItem, index: number) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card className={`hover:shadow-md transition-all ${item.isActive === 0 ? 'opacity-60' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                                <Lightbulb className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className={getCategoryColor(item.category)}>
                                    {CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                                  </Badge>
                                  {item.isActive === 0 && (
                                    <Badge variant="outline" className="text-stone-500">Inactive</Badge>
                                  )}
                                  {item.priority > 5 && (
                                    <Badge className="bg-amber-100 text-amber-700">High Priority</Badge>
                                  )}
                                </div>
                                <h3 className="font-semibold text-stone-900 mb-1">{item.question}</h3>
                                <p className="text-sm text-stone-600 line-clamp-2">{item.answer}</p>
                                <div className="flex items-center gap-4 mt-3 text-xs text-stone-500">
                                  <span className="flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    Used {item.usageCount} times
                                  </span>
                                  {item.lastUsedAt && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      Last: {new Date(item.lastUsedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>

            {/* Conversations Tab */}
            <TabsContent value="conversations">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Recent AI Conversations
                  </CardTitle>
                  <CardDescription>Review conversations to identify training opportunities</CardDescription>
                </CardHeader>
                <CardContent>
                  {conversations.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 mx-auto text-stone-300 mb-4" />
                      <p className="text-stone-500">No recent conversations</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {conversations.map((conv: any, index: number) => (
                        <div key={index} className="p-4 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${conv.role === 'user' ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                              {conv.role === 'user' ? '👤' : '🤖'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{conv.role === 'user' ? 'Visitor' : 'AI Assistant'}</span>
                                {conv.sentiment && (
                                  <Badge variant="outline" className="text-xs">
                                    {conv.sentiment}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-stone-700">{conv.message}</p>
                              <p className="text-xs text-stone-400 mt-1">
                                {new Date(conv.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => {
                              setFormData({
                                ...formData,
                                question: conv.role === 'user' ? conv.message : '',
                                answer: conv.role === 'assistant' ? conv.message : '',
                              });
                              setIsAddDialogOpen(true);
                            }}>
                              <Plus className="w-4 h-4 mr-1" />
                              Train
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Top Performing Knowledge
                    </CardTitle>
                    <CardDescription>Most frequently used responses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {knowledge
                        .sort((a: KnowledgeItem, b: KnowledgeItem) => b.usageCount - a.usageCount)
                        .slice(0, 5)
                        .map((item: KnowledgeItem, index: number) => (
                          <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                              {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.question}</p>
                              <p className="text-xs text-stone-500">{item.usageCount} uses</p>
                            </div>
                          </div>
                        ))}
                      {knowledge.length === 0 && (
                        <p className="text-sm text-stone-500 text-center py-4">No data yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Category Distribution
                    </CardTitle>
                    <CardDescription>Knowledge by topic area</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {CATEGORIES.map(cat => {
                        const count = knowledge.filter((k: KnowledgeItem) => k.category === cat.value).length;
                        const percentage = knowledge.length > 0 ? (count / knowledge.length) * 100 : 0;
                        return (
                          <div key={cat.value} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>{cat.label}</span>
                              <span className="text-stone-500">{count}</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
