import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from "framer-motion";
import { Link as LinkIcon, Plus, Edit, Trash2, Search, RefreshCw, ArrowRight, ExternalLink } from "lucide-react";
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

export default function AdminRedirectsEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ source: "", destination: "", type: "301", isActive: true });

  const redirectsQuery = trpc.admin.redirects?.list?.useQuery?.() || { data: [], refetch: () => {} };
  const redirects = redirectsQuery.data || [];

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  const stats = useMemo(() => ({ total: redirects.length, permanent: redirects.filter((r: any) => r.type === "301").length, temporary: redirects.filter((r: any) => r.type === "302").length }), [redirects]);
  const filteredRedirects = useMemo(() => redirects.filter((r: any) => searchQuery === "" || r.source?.includes(searchQuery) || r.destination?.includes(searchQuery)), [redirects, searchQuery]);

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
              <div><h1 className="text-2xl font-bold text-stone-900">Redirects</h1><p className="text-stone-500 text-sm">Manage URL redirects</p></div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => redirectsQuery.refetch?.()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-amber-600 hover:bg-amber-700"><Plus className="w-4 h-4 mr-2" />Add Redirect</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[{ label: "Total Redirects", value: stats.total, color: "amber" }, { label: "Permanent (301)", value: stats.permanent, color: "emerald" }, { label: "Temporary (302)", value: stats.temporary, color: "blue" }].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100/50 border-${stat.color}-200`}>
                  <CardContent className="p-5"><div className="flex items-center justify-between"><div><p className={`text-xs font-medium text-${stat.color}-600`}>{stat.label}</p><p className={`text-2xl font-bold text-${stat.color}-900`}><AnimatedCounter value={stat.value} /></p></div><LinkIcon className={`w-8 h-8 text-${stat.color}-500`} /></div></CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" /><Input placeholder="Search redirects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>

          {filteredRedirects.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><LinkIcon className="w-12 h-12 mx-auto text-stone-400 mb-4" /><h3 className="text-lg font-medium mb-2">No Redirects</h3><p className="text-stone-500">{searchQuery ? "No matches found" : "Add your first redirect"}</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filteredRedirects.map((redirect: any, i: number) => (
                <motion.div key={redirect.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-sm bg-stone-100 px-2 py-1 rounded">{redirect.source}</code>
                          <ArrowRight className="w-4 h-4 text-stone-400" />
                          <code className="text-sm bg-stone-100 px-2 py-1 rounded">{redirect.destination}</code>
                        </div>
                      </div>
                      <Badge className={redirect.type === "301" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}>{redirect.type}</Badge>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Redirect</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Source URL</Label><Input value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} placeholder="/old-page" /></div>
              <div className="space-y-2"><Label>Destination URL</Label><Input value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} placeholder="/new-page" /></div>
              <div className="space-y-2"><Label>Redirect Type</Label><Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="301">301 (Permanent)</SelectItem><SelectItem value="302">302 (Temporary)</SelectItem></SelectContent></Select></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button><Button className="bg-amber-600 hover:bg-amber-700">Add Redirect</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
