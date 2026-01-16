import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import AdminSidebar from '@/components/AdminSidebar';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, Plus, Edit, Trash2, Search, RefreshCw, MessageSquare, Sparkles, Database, Zap,
  Upload, Download, FileJson, ChevronDown, ChevronUp, Filter, Tag, 
  BarChart3, TrendingUp, CheckCircle2, AlertCircle, Lightbulb,
  BookOpen, GraduationCap, Target, Layers, FolderOpen, ArrowUpDown,
  FileText, Wand2, Bot, Cpu, Activity, PieChart
} from "lucide-react";
import { toast } from "sonner";

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const duration = 1000, steps = 30, increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setDisplayValue(value); clearInterval(timer); }
      else { setDisplayValue(Math.floor(current)); }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{displayValue}{suffix}</span>;
}

const PRESET_CATEGORIES = [
  { value: "brand", label: "Brand & Identity", icon: Target, color: "purple" },
  { value: "products", label: "Products & Services", icon: Layers, color: "blue" },
  { value: "philosophy", label: "Philosophy & Values", icon: BookOpen, color: "emerald" },
  { value: "offerings", label: "Offerings & Programs", icon: GraduationCap, color: "amber" },
  { value: "faq", label: "FAQ & Support", icon: MessageSquare, color: "pink" },
  { value: "founder", label: "Founder & Story", icon: Sparkles, color: "rose" },
  { value: "community", label: "Community & Events", icon: Brain, color: "cyan" },
  { value: "custom", label: "Custom", icon: Tag, color: "stone" },
];

const TRAINING_TEMPLATES = [
  { category: "brand", question: "What is Just Empower?", answer: "Just Empower is a transformational platform dedicated to catalyzing the rise of women through embodied transformation and conscious leadership." },
  { category: "philosophy", question: "What is the philosophy behind Just Empower?", answer: "Our philosophy centers on the belief that true empowerment comes from within - through embodied practices, conscious awareness, and authentic connection to one's inner wisdom." },
  { category: "offerings", question: "What programs does Just Empower offer?", answer: "We offer transformational workshops, coaching programs, community events, and the VI•X Journal Trilogy for personal development and spiritual growth." },
  { category: "founder", question: "Who founded Just Empower?", answer: "Just Empower was founded by April Gambardella, a visionary leader dedicated to women's empowerment and conscious transformation." },
  { category: "faq", question: "How can I get started with Just Empower?", answer: "You can begin your journey by exploring our offerings, joining our community events, or reaching out through our contact page for personalized guidance." },
  { category: "community", question: "How can I join the Just Empower community?", answer: "Join our community by subscribing to our newsletter, attending our events, and connecting with us on social media for ongoing inspiration and support." },
];

export default function AdminAITrainingTurbo() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [activeTab, setActiveTab] = useState("training");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "category">("newest");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ question: "", answer: "", category: "" });
  const [bulkImportData, setBulkImportData] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const trainingQuery = trpc.aiTraining.listKnowledge.useQuery();
  const createMutation = trpc.aiTraining.addKnowledge.useMutation({ 
    onSuccess: () => { toast.success("Training data added!"); trainingQuery.refetch(); setIsCreateOpen(false); setFormData({ question: "", answer: "", category: "" }); }, 
    onError: (e: any) => toast.error(e.message) 
  });
  const deleteMutation = trpc.aiTraining.deleteKnowledge.useMutation({ 
    onSuccess: () => { toast.success("Deleted"); trainingQuery.refetch(); }, 
    onError: (e: any) => toast.error(e.message) 
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  const items = trainingQuery.data || [];
  
  const stats = useMemo(() => {
    const categories = Array.from(new Set(items.map((i: any) => i.category).filter(Boolean)));
    const categoryBreakdown: Record<string, number> = {};
    categories.forEach((cat: string) => { categoryBreakdown[cat] = items.filter((i: any) => i.category === cat).length; });
    const avgAnswerLength = items.length > 0 ? Math.round(items.reduce((sum: number, i: any) => sum + (i.answer?.length || 0), 0) / items.length) : 0;
    return { total: items.length, categories: categories.length, categoryBreakdown, avgAnswerLength, recentlyAdded: items.length };
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items.filter((i: any) => {
      const matchesSearch = !searchQuery || i.question?.toLowerCase().includes(searchQuery.toLowerCase()) || i.answer?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || i.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    if (sortOrder === "category") result = result.sort((a: any, b: any) => (a.category || "").localeCompare(b.category || ""));
    return result;
  }, [items, searchQuery, selectedCategory, sortOrder]);

  const handleEdit = (item: any) => { setEditingItem(item); setFormData({ question: item.question, answer: item.answer, category: item.category || "" }); setIsEditOpen(true); };
  
  const handleBulkImport = () => {
    try {
      const parsed = JSON.parse(bulkImportData);
      if (!Array.isArray(parsed)) throw new Error("Must be an array");
      parsed.forEach((item: any) => { if (item.question && item.answer) createMutation.mutate({ question: item.question, answer: item.answer, category: item.category || "" }); });
      toast.success(`Importing ${parsed.length} pairs`);
      setIsBulkImportOpen(false); setBulkImportData("");
    } catch { toast.error("Invalid JSON format"); }
  };

  const handleExport = () => {
    const exportData = items.map((i: any) => ({ question: i.question, answer: i.answer, category: i.category }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `ai-training-${new Date().toISOString().split("T")[0]}.json`; a.click();
    toast.success("Exported!");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => { setBulkImportData(event.target?.result as string); setIsBulkImportOpen(true); };
    reader.readAsText(file);
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0 || !confirm(`Delete ${selectedItems.length} items?`)) return;
    selectedItems.forEach(id => deleteMutation.mutate({ id })); setSelectedItems([]);
  };

  const toggleExpanded = (id: number) => setExpandedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleSelected = (id: number) => setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const selectAll = () => { const ids = filteredItems.map((i: any) => i.id); setSelectedItems(prev => ids.every((id: number) => prev.includes(id)) ? [] : ids); };
  const useTemplate = (t: typeof TRAINING_TEMPLATES[0]) => { setFormData({ question: t.question, answer: t.answer, category: t.category }); setIsCreateOpen(true); };

  if (isChecking || trainingQuery.isPending) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"><div className="text-center"><div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-spin border-t-purple-600 mx-auto"><Bot className="w-6 h-6 text-purple-600 absolute" /></div><p className="mt-4 text-white">Loading AI Training...</p></div></div>;
  }
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      <AdminSidebar variant="dark" />
      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25"><Brain className="w-6 h-6 text-white" /></div>
                <div><h1 className="text-2xl font-bold text-white">AI Training Center</h1><p className="text-purple-300 text-sm">Turbocharge your AI with custom knowledge</p></div>
              </div>
              <div className="flex items-center gap-3">
                <input type="file" ref={fileInputRef} accept=".json" onChange={handleFileUpload} className="hidden" />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="border-white/20 text-white hover:bg-white/10"><Upload className="w-4 h-4 mr-2" />Import</Button>
                <Button variant="outline" size="sm" onClick={handleExport} className="border-white/20 text-white hover:bg-white/10"><Download className="w-4 h-4 mr-2" />Export</Button>
                <Button variant="outline" size="sm" onClick={() => trainingQuery.refetch?.()} className="border-white/20 text-white hover:bg-white/10"><RefreshCw className="w-4 h-4" /></Button>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"><Plus className="w-4 h-4 mr-2" />Add Training</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Total Training Pairs", value: stats.total, icon: Database, color: "purple", sub: `${stats.recentlyAdded} entries` },
              { label: "Categories", value: stats.categories, icon: FolderOpen, color: "blue", sub: "Organized knowledge" },
              { label: "Avg Answer Length", value: stats.avgAnswerLength, icon: FileText, color: "emerald", sub: " chars", isSuffix: true },
              { label: "AI Status", value: "Active", icon: Cpu, color: "amber", isText: true, sub: "Real-time processing" },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-2xl font-bold text-white mt-1">{stat.isText ? <><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block mr-2" />{stat.value}</> : <AnimatedCounter value={stat.value as number} suffix={stat.isSuffix ? stat.sub : ""} />}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center`}><stat.icon className={`w-6 h-6 text-${stat.color}-400`} /></div>
                    </div>
                    {!stat.isSuffix && <p className="text-xs text-slate-500 mt-2">{stat.sub}</p>}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/10 border border-white/20 p-1">
              <TabsTrigger value="training" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-white"><Database className="w-4 h-4 mr-2" />Training Data</TabsTrigger>
              <TabsTrigger value="templates" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-white"><Lightbulb className="w-4 h-4 mr-2" />Templates</TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-white"><BarChart3 className="w-4 h-4 mr-2" />Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="training" className="space-y-4 mt-4">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[200px] max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-white/10 border-white/20 text-white" /></div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}><SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{Array.from(new Set(items.map((i: any) => i.category).filter(Boolean))).map((cat: string) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select>
                    <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}><SelectTrigger className="w-[150px] bg-white/10 border-white/20 text-white"><ArrowUpDown className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">Newest</SelectItem><SelectItem value="oldest">Oldest</SelectItem><SelectItem value="category">Category</SelectItem></SelectContent></Select>
                    {selectedItems.length > 0 && <Button variant="destructive" size="sm" onClick={handleBulkDelete}><Trash2 className="w-4 h-4 mr-2" />Delete ({selectedItems.length})</Button>}
                  </div>
                  <div className="flex items-center gap-2 mt-3"><Button variant="ghost" size="sm" onClick={selectAll} className="text-white/70 hover:text-white"><CheckCircle2 className="w-4 h-4 mr-2" />Select All</Button><span className="text-sm text-slate-400">Showing {filteredItems.length} of {items.length}</span></div>
                </CardContent>
              </Card>

              {filteredItems.length === 0 ? (
                <Card className="bg-white/5 border-white/10"><CardContent className="py-16 text-center"><Brain className="w-16 h-16 mx-auto text-purple-400 mb-4" /><h3 className="text-lg font-medium text-white mb-2">No Training Data</h3><p className="text-slate-400 mb-6">{searchQuery ? "No matches" : "Add Q&A pairs to train the AI"}</p><Button onClick={() => setIsCreateOpen(true)} className="bg-gradient-to-r from-purple-500 to-pink-500"><Plus className="w-4 h-4 mr-2" />Add First Training</Button></CardContent></Card>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredItems.map((item: any, i: number) => (
                      <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                        <Card className={`bg-white/5 border-white/10 hover:bg-white/10 transition-all ${selectedItems.includes(item.id) ? "ring-2 ring-purple-500" : ""}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => toggleSelected(item.id)} className="mt-3 w-4 h-4 rounded" />
                              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-purple-400" /></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2"><span className="text-xs font-bold text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">Q</span><p className="font-medium text-white">{item.question}</p></div>
                                <div className="flex items-start gap-2"><span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">A</span><p className={`text-sm text-slate-300 ${expandedItems.includes(item.id) ? "" : "line-clamp-2"}`}>{item.answer}</p></div>
                                <div className="flex items-center gap-3 mt-3">
                                  {item.category && <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30"><Tag className="w-3 h-3 mr-1" />{item.category}</Badge>}
                                  {item.answer?.length > 150 && <Button variant="ghost" size="sm" onClick={() => toggleExpanded(item.id)} className="text-slate-400 h-6 px-2">{expandedItems.includes(item.id) ? <><ChevronUp className="w-4 h-4" />Less</> : <><ChevronDown className="w-4 h-4" />More</>}</Button>}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="text-slate-400 hover:text-white"><Edit className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate({ id: item.id }); }} className="text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
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

            <TabsContent value="templates" className="space-y-4 mt-4">
              <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30"><CardContent className="p-4"><div className="flex items-center gap-3"><Wand2 className="w-6 h-6 text-purple-400" /><div><h3 className="font-medium text-white">Quick Start Templates</h3><p className="text-sm text-purple-300">Click to use as a starting point</p></div></div></CardContent></Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TRAINING_TEMPLATES.map((t, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer group" onClick={() => useTemplate(t)}>
                      <CardContent className="p-4">
                        <Badge className="mb-2 bg-purple-500/20 text-purple-300">{t.category}</Badge>
                        <p className="font-medium text-white mb-1">{t.question}</p>
                        <p className="text-sm text-slate-400 line-clamp-2">{t.answer}</p>
                        <Button size="sm" className="mt-3 opacity-0 group-hover:opacity-100 bg-purple-500"><Plus className="w-4 h-4 mr-1" />Use</Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              <h3 className="text-lg font-semibold text-white mt-6">Categories</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PRESET_CATEGORIES.map((cat, i) => (
                  <Card key={cat.value} className="bg-white/5 border-white/10 hover:bg-white/10">
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 rounded-xl bg-${cat.color}-500/20 flex items-center justify-center mx-auto mb-2`}><cat.icon className={`w-6 h-6 text-${cat.color}-400`} /></div>
                      <p className="font-medium text-white">{cat.label}</p>
                      <p className="text-sm text-slate-400">{stats.categoryBreakdown[cat.value] || 0} entries</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white/5 border-white/10"><CardHeader><CardTitle className="text-white flex items-center gap-2"><PieChart className="w-5 h-5 text-purple-400" />Category Distribution</CardTitle></CardHeader><CardContent><div className="space-y-3">{Object.entries(stats.categoryBreakdown).map(([cat, count]) => (<div key={cat}><div className="flex justify-between mb-1"><span className="text-sm text-slate-300">{cat}</span><span className="text-sm text-slate-400">{count} ({stats.total > 0 ? Math.round((count as number / stats.total) * 100) : 0}%)</span></div><Progress value={stats.total > 0 ? (count as number / stats.total) * 100 : 0} className="h-2" /></div>))}{Object.keys(stats.categoryBreakdown).length === 0 && <p className="text-slate-400 text-center py-4">No data yet</p>}</div></CardContent></Card>
                <Card className="bg-white/5 border-white/10"><CardHeader><CardTitle className="text-white flex items-center gap-2"><Target className="w-5 h-5 text-emerald-400" />Training Progress</CardTitle></CardHeader><CardContent><div className="text-center py-4"><div className="text-5xl font-bold text-white mb-2">{stats.total}</div><p className="text-slate-400">Total Training Pairs</p><div className="grid grid-cols-2 gap-4 mt-6"><div className="p-3 rounded-lg bg-white/5"><p className="text-2xl font-bold text-purple-400">{stats.categories}</p><p className="text-xs text-slate-400">Categories</p></div><div className="p-3 rounded-lg bg-white/5"><p className="text-2xl font-bold text-emerald-400">{stats.avgAnswerLength}</p><p className="text-xs text-slate-400">Avg Length</p></div></div></div></CardContent></Card>
              </div>
              <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30"><CardHeader><CardTitle className="text-white flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-400" />Recommendations</CardTitle></CardHeader><CardContent><div className="space-y-3">{stats.total < 10 && <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5"><AlertCircle className="w-5 h-5 text-amber-400" /><div><p className="text-white font-medium">Add more training data</p><p className="text-sm text-slate-400">Your AI works best with 20-30+ pairs. You have {stats.total}.</p></div></div>}{stats.categories < 3 && <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5"><Tag className="w-5 h-5 text-blue-400" /><div><p className="text-white font-medium">Diversify categories</p><p className="text-sm text-slate-400">Add training across different categories.</p></div></div>}{stats.total >= 10 && stats.categories >= 3 && <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10"><CheckCircle2 className="w-5 h-5 text-emerald-400" /><div><p className="text-white font-medium">Great progress!</p><p className="text-sm text-slate-400">Your AI training is on track!</p></div></div>}</div></CardContent></Card>
            </TabsContent>
          </Tabs>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl bg-slate-900 border-white/20 text-white">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-purple-400" />Add Training Data</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label className="text-slate-300">Category</Label><Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}><SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white"><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{PRESET_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-slate-300">Question</Label><Textarea value={formData.question} onChange={(e) => setFormData({ ...formData, question: e.target.value })} placeholder="What question should the AI understand?" rows={2} className="mt-1 bg-white/10 border-white/20 text-white" /></div>
              <div><Label className="text-slate-300">Answer</Label><Textarea value={formData.answer} onChange={(e) => setFormData({ ...formData, answer: e.target.value })} placeholder="What should the AI respond with?" rows={6} className="mt-1 bg-white/10 border-white/20 text-white" /><p className="text-xs text-slate-500 mt-1">{formData.answer.length} characters</p></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsCreateOpen(false)} className="border-white/20 text-white">Cancel</Button><Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending || !formData.question || !formData.answer} className="bg-gradient-to-r from-purple-500 to-pink-500">{createMutation.isPending ? "Adding..." : "Add Training"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl bg-slate-900 border-white/20 text-white">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit className="w-5 h-5 text-blue-400" />Edit Training Data</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label className="text-slate-300">Category</Label><Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}><SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger><SelectContent>{PRESET_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-slate-300">Question</Label><Textarea value={formData.question} onChange={(e) => setFormData({ ...formData, question: e.target.value })} rows={2} className="mt-1 bg-white/10 border-white/20 text-white" /></div>
              <div><Label className="text-slate-300">Answer</Label><Textarea value={formData.answer} onChange={(e) => setFormData({ ...formData, answer: e.target.value })} rows={6} className="mt-1 bg-white/10 border-white/20 text-white" /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsEditOpen(false)} className="border-white/20 text-white">Cancel</Button><Button onClick={() => { deleteMutation.mutate({ id: editingItem.id }); createMutation.mutate(formData); setIsEditOpen(false); }} disabled={!formData.question || !formData.answer} className="bg-gradient-to-r from-blue-500 to-cyan-500">Save Changes</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
          <DialogContent className="max-w-3xl bg-slate-900 border-white/20 text-white">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><FileJson className="w-5 h-5 text-emerald-400" />Bulk Import</DialogTitle></DialogHeader>
            <div className="py-4"><p className="text-sm text-slate-400 mb-2">JSON format: [{`{question, answer, category}`}, ...]</p><Textarea value={bulkImportData} onChange={(e) => setBulkImportData(e.target.value)} rows={12} className="font-mono text-sm bg-white/10 border-white/20 text-white" /></div>
            <DialogFooter><Button variant="outline" onClick={() => setIsBulkImportOpen(false)} className="border-white/20 text-white">Cancel</Button><Button onClick={handleBulkImport} className="bg-gradient-to-r from-emerald-500 to-teal-500">Import</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
