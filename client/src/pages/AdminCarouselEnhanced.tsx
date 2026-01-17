import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from "framer-motion";
import { Images, Plus, Edit, Trash2, Search, RefreshCw, GripVertical, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { getMediaUrl } from "@/lib/media";

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

export default function AdminCarouselEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ title: "", subtitle: "", imageUrl: "", linkUrl: "", isActive: true, order: 0 });

  const carouselQuery = trpc.carousel.list.useQuery();
  const items = carouselQuery.data || [];

  const createMutation = (trpc.carousel as any).create.useMutation({
    onSuccess: () => { toast.success('Slide created'); carouselQuery.refetch(); setIsCreateOpen(false); resetForm(); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateMutation = trpc.carousel.update.useMutation({
    onSuccess: () => { toast.success('Slide updated'); carouselQuery.refetch(); setEditingItem(null); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.carousel.delete.useMutation({
    onSuccess: () => { toast.success('Slide deleted'); carouselQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this slide?')) deleteMutation.mutate({ id });
  };

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((i: any) => i.isActive).length,
    inactive: items.filter((i: any) => !i.isActive).length,
  }), [items]);

  const filteredItems = useMemo(() => items.filter((i: any) => searchQuery === "" || i.title?.toLowerCase().includes(searchQuery.toLowerCase())), [items, searchQuery]);

  const resetForm = () => setFormData({ title: "", subtitle: "", imageUrl: "", linkUrl: "", isActive: true, order: 0 });
  const handleEdit = (item: any) => { setEditingItem(item); setFormData({ title: item.title || "", subtitle: item.subtitle || "", imageUrl: item.imageUrl || "", linkUrl: item.linkUrl || "", isActive: item.isActive ?? true, order: item.order || 0 }); };

  if (isChecking || carouselQuery.isLoading) {
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
              <div><h1 className="text-2xl font-bold text-stone-900">Featured Offerings</h1><p className="text-stone-500 text-sm">Manage homepage carousel slides</p></div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => carouselQuery.refetch?.()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-amber-600 hover:bg-amber-700"><Plus className="w-4 h-4 mr-2" />Add Slide</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[{ label: "Total Slides", value: stats.total, icon: Images, color: "amber" }, { label: "Active", value: stats.active, icon: Eye, color: "emerald" }, { label: "Inactive", value: stats.inactive, icon: EyeOff, color: "stone" }].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100/50 border-${stat.color}-200`}>
                  <CardContent className="p-5"><div className="flex items-center justify-between"><div><p className={`text-xs font-medium text-${stat.color}-600`}>{stat.label}</p><p className={`text-2xl font-bold text-${stat.color}-900`}><AnimatedCounter value={stat.value} /></p></div><stat.icon className={`w-8 h-8 text-${stat.color}-500`} /></div></CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" /><Input placeholder="Search slides..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>

          {filteredItems.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><Images className="w-12 h-12 mx-auto text-stone-400 mb-4" /><h3 className="text-lg font-medium mb-2">No Slides</h3><p className="text-stone-500">{searchQuery ? "No matches found" : "Add your first carousel slide"}</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item: any, i: number) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center gap-4 p-4">
                      <GripVertical className="w-5 h-5 text-stone-400 cursor-grab" />
                      <div className="w-24 h-16 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.imageUrl ? <img src={getMediaUrl(item.imageUrl)} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Images className="w-6 h-6 text-stone-300" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><h3 className="font-semibold truncate">{item.title || "Untitled"}</h3><Badge className={item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-700"}>{item.isActive ? "Active" : "Inactive"}</Badge></div>
                        {item.subtitle && <p className="text-sm text-stone-500 truncate">{item.subtitle}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <Dialog open={isCreateOpen || !!editingItem} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setEditingItem(null); resetForm(); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingItem ? "Edit Slide" : "Add Slide"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Subtitle</Label><Textarea value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} rows={2} /></div>
              <div className="space-y-2"><Label>Image URL</Label><Input value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} placeholder="https://..." /></div>
              <div className="space-y-2"><Label>Link URL</Label><Input value={formData.linkUrl} onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })} placeholder="/page or https://..." /></div>
              <div className="flex items-center gap-2"><Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({ ...formData, isActive: v })} /><Label>Active</Label></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => { setIsCreateOpen(false); setEditingItem(null); resetForm(); }}>Cancel</Button><Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="bg-amber-600 hover:bg-amber-700">{editingItem ? "Update" : "Add"} Slide</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
