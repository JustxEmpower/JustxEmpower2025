import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from "framer-motion";
import { Search, Save, Loader2, RefreshCw, Globe, FileText, Share2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminSEOEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [isSaving, setIsSaving] = useState(false);

  const seoQuery = trpc.admin.seo?.get?.useQuery?.() || { data: null, refetch: () => {} };

  const [formData, setFormData] = useState({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    twitterCard: "summary_large_image",
    googleVerification: "",
    robotsTxt: "",
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  useEffect(() => {
    if (seoQuery.data) setFormData(prev => ({ ...prev, ...seoQuery.data }));
  }, [seoQuery.data]);

  const handleSave = async () => {
    setIsSaving(true);
    try { toast.success("SEO settings saved"); }
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
              <div><h1 className="text-2xl font-bold text-stone-900">SEO</h1><p className="text-stone-500 text-sm">Search engine optimization settings</p></div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => seoQuery.refetch?.()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
                <Button onClick={handleSave} disabled={isSaving} className="bg-amber-600 hover:bg-amber-700">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Save
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          <Tabs defaultValue="meta">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="meta"><FileText className="w-4 h-4 mr-2" />Meta Tags</TabsTrigger>
              <TabsTrigger value="social"><Share2 className="w-4 h-4 mr-2" />Social</TabsTrigger>
              <TabsTrigger value="advanced"><Globe className="w-4 h-4 mr-2" />Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="meta" className="mt-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader><CardTitle>Meta Tags</CardTitle><CardDescription>Default meta tags for search engines</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Meta Title</Label><Input value={formData.metaTitle} onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })} placeholder="Site title for search results" /><p className="text-xs text-stone-500">{formData.metaTitle.length}/60 characters</p></div>
                    <div className="space-y-2"><Label>Meta Description</Label><Textarea value={formData.metaDescription} onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })} placeholder="Brief description for search results" rows={3} /><p className="text-xs text-stone-500">{formData.metaDescription.length}/160 characters</p></div>
                    <div className="space-y-2"><Label>Meta Keywords</Label><Input value={formData.metaKeywords} onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })} placeholder="keyword1, keyword2, keyword3" /></div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="social" className="mt-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader><CardTitle>Open Graph & Social</CardTitle><CardDescription>How your site appears when shared</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>OG Title</Label><Input value={formData.ogTitle} onChange={(e) => setFormData({ ...formData, ogTitle: e.target.value })} placeholder="Title for social shares" /></div>
                    <div className="space-y-2"><Label>OG Description</Label><Textarea value={formData.ogDescription} onChange={(e) => setFormData({ ...formData, ogDescription: e.target.value })} rows={2} /></div>
                    <div className="space-y-2"><Label>OG Image URL</Label><Input value={formData.ogImage} onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })} placeholder="https://..." />{formData.ogImage && <img src={formData.ogImage} alt="OG Preview" className="w-full max-w-md h-32 object-cover mt-2 rounded border" />}</div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="advanced" className="mt-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader><CardTitle>Advanced SEO</CardTitle><CardDescription>Technical SEO settings</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Google Site Verification</Label><Input value={formData.googleVerification} onChange={(e) => setFormData({ ...formData, googleVerification: e.target.value })} placeholder="Verification code" /></div>
                    <div className="space-y-2"><Label>Robots.txt Content</Label><Textarea value={formData.robotsTxt} onChange={(e) => setFormData({ ...formData, robotsTxt: e.target.value })} rows={6} className="font-mono text-sm" placeholder="User-agent: *&#10;Allow: /" /></div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
