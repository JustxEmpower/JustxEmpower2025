import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from "framer-motion";
import { Files, Plus, Edit, Trash2, Eye, Search, RefreshCw, Filter, Globe, FileText, ExternalLink } from "lucide-react";
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
  return <span>{displayValue.toLocaleString()}</span>;
}

export default function AdminPagesEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [formData, setFormData] = useState({ title: "", slug: "", template: "default", status: "published" });

  const pagesQuery = trpc.admin.pages.list.useQuery();
  const createMutation = trpc.admin.pages.create?.useMutation?.({ onSuccess: () => { toast.success("Page created"); pagesQuery.refetch(); setIsCreateOpen(false); resetForm(); }, onError: (e: any) => toast.error(e.message) }) || { mutate: () => {}, isPending: false };
  const updateMutation = trpc.admin.pages.update?.useMutation?.({ onSuccess: () => { toast.success("Page updated"); pagesQuery.refetch(); setEditingPage(null); resetForm(); }, onError: (e: any) => toast.error(e.message) }) || { mutate: () => {}, isPending: false };
  const deleteMutation = trpc.admin.pages.delete?.useMutation?.({ onSuccess: () => { toast.success("Page deleted"); pagesQuery.refetch(); }, onError: (e: any) => toast.error(e.message) }) || { mutate: () => {}, isPending: false };

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  const pages = pagesQuery.data || [];
  const filteredPages = useMemo(() => {
    return pages.filter((p: any) => {
      const matchesSearch = searchQuery === "" || p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.slug?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [pages, searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: pages.length,
    published: pages.filter((p: any) => p.status === "published").length,
    draft: pages.filter((p: any) => p.status === "draft").length,
  }), [pages]);

  const resetForm = () => setFormData({ title: "", slug: "", template: "default", status: "published" });
  const handleEdit = (page: any) => { setEditingPage(page); setFormData({ title: page.title, slug: page.slug, template: page.template || "default", status: page.status || "published" }); };
  const handleSubmit = () => {
    if (editingPage) {
      updateMutation.mutate?.({ id: editingPage.id, ...formData });
    } else {
      createMutation.mutate?.(formData);
    }
  };
  const handleDelete = (id: number) => {
    if (confirm('Delete this page?')) deleteMutation.mutate?.({ id });
  };

  if (isChecking) {
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
              <div><h1 className="text-2xl font-bold text-stone-900">Pages</h1><p className="text-stone-500 text-sm">Manage site pages and content</p></div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => pagesQuery.refetch()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-amber-600 hover:bg-amber-700"><Plus className="w-4 h-4 mr-2" />New Page</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[{ label: "Total Pages", value: stats.total, icon: Files, color: "amber" }, { label: "Published", value: stats.published, icon: Globe, color: "emerald" }, { label: "Drafts", value: stats.draft, icon: FileText, color: "blue" }].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100/50 border-${stat.color}-200`}>
                  <CardContent className="p-5"><div className="flex items-center justify-between"><div><p className={`text-xs font-medium text-${stat.color}-600`}>{stat.label}</p><p className={`text-2xl font-bold text-${stat.color}-900`}><AnimatedCounter value={stat.value} /></p></div><stat.icon className={`w-8 h-8 text-${stat.color}-500`} /></div></CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" /><Input placeholder="Search pages..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-36"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="draft">Draft</SelectItem></SelectContent></Select>
          </div>

          {filteredPages.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><Files className="w-12 h-12 mx-auto text-stone-400 mb-4" /><h3 className="text-lg font-medium mb-2">No Pages Found</h3><p className="text-stone-500">{searchQuery || statusFilter !== "all" ? "Try adjusting filters" : "Create your first page"}</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filteredPages.map((page: any, i: number) => (
                <motion.div key={page.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0"><FileText className="w-6 h-6 text-stone-500" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1"><h3 className="font-semibold">{page.title}</h3><Badge className={page.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>{page.status}</Badge></div>
                        <p className="text-sm text-stone-500">/{page.slug}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => window.open(`/${page.slug}`, "_blank")}><ExternalLink className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(page)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate?.({ id: page.id }); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <Dialog open={isCreateOpen || !!editingPage} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setEditingPage(null); resetForm(); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingPage ? "Edit Page" : "New Page"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="page-url" /></div>
              <div className="space-y-2"><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="published">Published</SelectItem><SelectItem value="draft">Draft</SelectItem></SelectContent></Select></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => { setIsCreateOpen(false); setEditingPage(null); resetForm(); }}>Cancel</Button><Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="bg-amber-600 hover:bg-amber-700">{editingPage ? "Update" : "Create"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
