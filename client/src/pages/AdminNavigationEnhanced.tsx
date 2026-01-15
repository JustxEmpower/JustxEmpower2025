import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from "framer-motion";
import { Menu, Plus, Edit, Trash2, GripVertical, Save, Loader2, RefreshCw, ExternalLink, ChevronRight } from "lucide-react";
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

export default function AdminNavigationEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ label: "", url: "", order: 0, isExternal: false });

  const navQuery = trpc.admin.navigation?.list?.useQuery?.() || { data: [], refetch: () => {} };

  const createMutation = trpc.admin.navigation?.create?.useMutation?.({
    onSuccess: () => { toast.success('Item created'); navQuery.refetch?.(); setIsCreateOpen(false); resetForm(); },
    onError: (e: any) => toast.error(e.message),
  }) || { mutate: () => {}, isPending: false };
  const updateMutation = trpc.admin.navigation?.update?.useMutation?.({
    onSuccess: () => { toast.success('Item updated'); navQuery.refetch?.(); setEditingItem(null); resetForm(); },
    onError: (e: any) => toast.error(e.message),
  }) || { mutate: () => {}, isPending: false };
  const deleteMutation = trpc.admin.navigation?.delete?.useMutation?.({
    onSuccess: () => { toast.success('Item deleted'); navQuery.refetch?.(); },
    onError: (e: any) => toast.error(e.message),
  }) || { mutate: () => {}, isPending: false };

  const handleSubmit = () => {
    if (editingItem) {
      updateMutation.mutate?.({ id: editingItem.id, ...formData });
    } else {
      createMutation.mutate?.(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this item?')) deleteMutation.mutate?.({ id });
  };

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  const navItems = navQuery.data || [];
  const stats = useMemo(() => ({ total: navItems.length, internal: navItems.filter((n: any) => !n.isExternal).length, external: navItems.filter((n: any) => n.isExternal).length }), [navItems]);

  const resetForm = () => setFormData({ label: "", url: "", order: 0, isExternal: false });
  const handleEdit = (item: any) => { setEditingItem(item); setFormData({ label: item.label, url: item.url, order: item.order || 0, isExternal: item.isExternal || false }); };

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
              <div><h1 className="text-2xl font-bold text-stone-900">Navigation</h1><p className="text-stone-500 text-sm">Manage site navigation menus</p></div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => navQuery.refetch?.()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-amber-600 hover:bg-amber-700"><Plus className="w-4 h-4 mr-2" />Add Item</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[{ label: "Total Items", value: stats.total, color: "amber" }, { label: "Internal Links", value: stats.internal, color: "blue" }, { label: "External Links", value: stats.external, color: "purple" }].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100/50 border-${stat.color}-200`}>
                  <CardContent className="p-5"><div className="flex items-center justify-between"><div><p className={`text-xs font-medium text-${stat.color}-600`}>{stat.label}</p><p className={`text-2xl font-bold text-${stat.color}-900`}><AnimatedCounter value={stat.value} /></p></div><Menu className={`w-8 h-8 text-${stat.color}-500`} /></div></CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle>Navigation Items</CardTitle></CardHeader>
            <CardContent>
              {navItems.length === 0 ? (
                <div className="py-8 text-center text-stone-500"><Menu className="w-12 h-12 mx-auto text-stone-300 mb-2" /><p>No navigation items yet</p></div>
              ) : (
                <div className="space-y-2">
                  {navItems.map((item: any, i: number) => (
                    <motion.div key={item.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors">
                      <GripVertical className="w-4 h-4 text-stone-400 cursor-grab" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2"><span className="font-medium">{item.label}</span>{item.isExternal && <Badge variant="outline" className="text-xs"><ExternalLink className="w-3 h-3 mr-1" />External</Badge>}</div>
                        <span className="text-sm text-stone-500">{item.url}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={isCreateOpen || !!editingItem} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setEditingItem(null); resetForm(); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingItem ? "Edit Navigation Item" : "Add Navigation Item"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Label</Label><Input value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} placeholder="Menu label" /></div>
              <div className="space-y-2"><Label>URL</Label><Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="/page-slug or https://..." /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={formData.isExternal} onChange={(e) => setFormData({ ...formData, isExternal: e.target.checked })} className="rounded" /><Label>External link (opens in new tab)</Label></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => { setIsCreateOpen(false); setEditingItem(null); resetForm(); }}>Cancel</Button><Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="bg-amber-600 hover:bg-amber-700">{editingItem ? "Update" : "Add"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
