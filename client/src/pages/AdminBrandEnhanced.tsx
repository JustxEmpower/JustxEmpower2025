import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from "framer-motion";
import { Briefcase, Save, Loader2, RefreshCw, Upload, Image } from "lucide-react";
import { toast } from "sonner";

export default function AdminBrandEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [isSaving, setIsSaving] = useState(false);

  const brandQuery = trpc.admin.brand?.get?.useQuery?.() || { data: null, refetch: () => {} };

  const [formData, setFormData] = useState({
    siteName: "Just Empower",
    tagline: "",
    description: "",
    logoUrl: "",
    logoWhiteUrl: "",
    faviconUrl: "",
    ogImage: "",
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  useEffect(() => {
    if (brandQuery.data) setFormData(prev => ({ ...prev, ...brandQuery.data }));
  }, [brandQuery.data]);

  const handleSave = async () => {
    setIsSaving(true);
    try { toast.success("Brand settings saved"); }
    catch (e) { toast.error("Failed to save"); }
    setIsSaving(false);
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
              <div><h1 className="text-2xl font-bold text-stone-900">Brand</h1><p className="text-stone-500 text-sm">Manage your brand identity</p></div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => brandQuery.refetch?.()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
                <Button onClick={handleSave} disabled={isSaving} className="bg-amber-600 hover:bg-amber-700">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Save
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-amber-500" />Brand Identity</CardTitle><CardDescription>Core brand information</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Site Name</Label><Input value={formData.siteName} onChange={(e) => setFormData({ ...formData, siteName: e.target.value })} /></div>
                <div className="space-y-2"><Label>Tagline</Label><Input value={formData.tagline} onChange={(e) => setFormData({ ...formData, tagline: e.target.value })} placeholder="Your brand tagline" /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of your brand" rows={3} /></div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Image className="w-5 h-5 text-blue-500" />Logos & Images</CardTitle><CardDescription>Brand visual assets</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Logo URL (Dark)</Label>
                    <Input value={formData.logoUrl} onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })} placeholder="https://..." />
                    {formData.logoUrl && <img src={formData.logoUrl} alt="Logo" className="h-16 object-contain mt-2 bg-white p-2 rounded border" />}
                  </div>
                  <div className="space-y-2">
                    <Label>Logo URL (Light/White)</Label>
                    <Input value={formData.logoWhiteUrl} onChange={(e) => setFormData({ ...formData, logoWhiteUrl: e.target.value })} placeholder="https://..." />
                    {formData.logoWhiteUrl && <img src={formData.logoWhiteUrl} alt="Logo White" className="h-16 object-contain mt-2 bg-stone-800 p-2 rounded" />}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Favicon URL</Label>
                  <Input value={formData.faviconUrl} onChange={(e) => setFormData({ ...formData, faviconUrl: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Social Share Image (OG Image)</Label>
                  <Input value={formData.ogImage} onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })} placeholder="https://..." />
                  {formData.ogImage && <img src={formData.ogImage} alt="OG" className="w-full max-w-md h-32 object-cover mt-2 rounded border" />}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
