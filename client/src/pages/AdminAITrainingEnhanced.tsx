import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import AdminSidebar from '@/components/AdminSidebar';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, Plus, Edit, Trash2, Search, RefreshCw, MessageSquare, Sparkles, Database, Zap,
  Upload, Download, FileJson, Copy, Check, ChevronDown, ChevronUp, Filter, Tag, 
  BarChart3, TrendingUp, Clock, CheckCircle2, XCircle, AlertCircle, Lightbulb,
  BookOpen, GraduationCap, Target, Layers, FolderOpen, ArrowUpDown, MoreHorizontal,
  FileText, Wand2, Bot, Cpu, Activity, PieChart
} from "lucide-react";
import { toast } from "sonner";

function AnimatedCounter({ value }: { value: number }) {
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
  return <span>{displayValue}</span>;
}

export default function AdminAITrainingEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ question: "", answer: "", category: "" });

  const trainingQuery = trpc.aiTraining.listKnowledge.useQuery();
  const createMutation = trpc.aiTraining.createKnowledge.useMutation({ onSuccess: () => { toast.success("Training data added"); trainingQuery.refetch(); setIsCreateOpen(false); setFormData({ question: "", answer: "", category: "" }); }, onError: (e: any) => toast.error(e.message) });
  const deleteMutation = trpc.aiTraining.deleteKnowledge.useMutation({ onSuccess: () => { toast.success("Deleted"); trainingQuery.refetch(); }, onError: (e: any) => toast.error(e.message) });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  const items = trainingQuery.data || [];
  const stats = useMemo(() => ({
    total: items.length,
    categories: Array.from(new Set(items.map((i: any) => i.category).filter(Boolean))).length,
  }), [items]);

  const filteredItems = useMemo(() => items.filter((i: any) => searchQuery === "" || i.question?.toLowerCase().includes(searchQuery.toLowerCase()) || i.answer?.toLowerCase().includes(searchQuery.toLowerCase())), [items, searchQuery]);

  if (isChecking || trainingQuery.isPending) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-stone-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" /></div>;
  }
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 flex">
      <AdminSidebar variant="dark" />
      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div><h1 className="text-2xl font-bold text-stone-900">AI Training</h1><p className="text-stone-500 text-sm">Train the AI assistant with custom Q&A pairs</p></div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => trainingQuery.refetch?.()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-amber-600 hover:bg-amber-700"><Plus className="w-4 h-4 mr-2" />Add Training</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[{ label: "Training Pairs", value: stats.total, icon: Database, color: "amber" }, { label: "Categories", value: stats.categories, icon: Brain, color: "purple" }, { label: "AI Status", value: "Active", icon: Zap, color: "emerald", isText: true }].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100/50 border-${stat.color}-200`}>
                  <CardContent className="p-5"><div className="flex items-center justify-between"><div><p className={`text-xs font-medium text-${stat.color}-600`}>{stat.label}</p><p className={`text-2xl font-bold text-${stat.color}-900`}>{stat.isText ? stat.value : <AnimatedCounter value={stat.value as number} />}</p></div><stat.icon className={`w-8 h-8 text-${stat.color}-500`} /></div></CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <div>
                  <h3 className="font-medium text-purple-900">How AI Training Works</h3>
                  <p className="text-sm text-purple-700">Add question-answer pairs to teach the AI about your brand, products, and services. The AI will use this knowledge to provide accurate responses.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" /><Input placeholder="Search training data..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>

          {filteredItems.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><Brain className="w-12 h-12 mx-auto text-stone-400 mb-4" /><h3 className="text-lg font-medium mb-2">No Training Data</h3><p className="text-stone-500">{searchQuery ? "No matches found" : "Add Q&A pairs to train the AI"}</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item: any, i: number) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0"><MessageSquare className="w-5 h-5 text-purple-600" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-0.5 rounded">Q</span>
                            <p className="font-medium">{item.question}</p>
                            {item.category && <Badge variant="outline" className="text-xs">{item.category}</Badge>}
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">A</span>
                            <p className="text-sm text-stone-600 line-clamp-2">{item.answer}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate?.({ id: item.id }); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Add Training Data</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Question</Label><Textarea value={formData.question} onChange={(e) => setFormData({ ...formData, question: e.target.value })} placeholder="What question should the AI understand?" rows={2} /></div>
              <div className="space-y-2"><Label>Answer</Label><Textarea value={formData.answer} onChange={(e) => setFormData({ ...formData, answer: e.target.value })} placeholder="What should the AI respond with?" rows={4} /></div>
              <div className="space-y-2"><Label>Category (optional)</Label><Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g., Products, Services, Brand" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate?.(formData)} disabled={createMutation.isPending || !formData.question || !formData.answer} className="bg-amber-600 hover:bg-amber-700">Add Training</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
