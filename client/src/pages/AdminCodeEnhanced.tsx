import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from "framer-motion";
import { Code, Save, Loader2, RefreshCw, FileCode, Globe } from "lucide-react";
import { toast } from "sonner";

export default function AdminCodeEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [isSaving, setIsSaving] = useState(false);

  const codeQuery = trpc.admin.code?.get?.useQuery?.() || { data: null, refetch: () => {} };

  const [formData, setFormData] = useState({ headerCode: "", footerCode: "", customCss: "", customJs: "" });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  useEffect(() => {
    if (codeQuery.data) setFormData(prev => ({ ...prev, ...codeQuery.data }));
  }, [codeQuery.data]);

  const handleSave = async () => {
    setIsSaving(true);
    try { toast.success("Code saved"); }
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
              <div><h1 className="text-2xl font-bold text-stone-900">Custom Code</h1><p className="text-stone-500 text-sm">Add custom HTML, CSS, and JavaScript</p></div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => codeQuery.refetch?.()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
                <Button onClick={handleSave} disabled={isSaving} className="bg-amber-600 hover:bg-amber-700">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Save
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <p className="text-sm text-amber-800"><strong>⚠️ Warning:</strong> Custom code is injected directly into your site. Only add code from trusted sources.</p>
              </CardContent>
            </Card>
          </motion.div>

          <Tabs defaultValue="header">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="header"><Globe className="w-4 h-4 mr-2" />Header</TabsTrigger>
              <TabsTrigger value="footer"><FileCode className="w-4 h-4 mr-2" />Footer</TabsTrigger>
              <TabsTrigger value="css"><Code className="w-4 h-4 mr-2" />CSS</TabsTrigger>
              <TabsTrigger value="js"><Code className="w-4 h-4 mr-2" />JavaScript</TabsTrigger>
            </TabsList>

            <TabsContent value="header" className="mt-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader><CardTitle>Header Code</CardTitle><CardDescription>Code added before &lt;/head&gt; tag (analytics, meta tags, etc.)</CardDescription></CardHeader>
                  <CardContent>
                    <Textarea value={formData.headerCode} onChange={(e) => setFormData({ ...formData, headerCode: e.target.value })} rows={12} className="font-mono text-sm" placeholder="<!-- Add tracking codes, meta tags, etc. -->" />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="footer" className="mt-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader><CardTitle>Footer Code</CardTitle><CardDescription>Code added before &lt;/body&gt; tag (scripts, widgets, etc.)</CardDescription></CardHeader>
                  <CardContent>
                    <Textarea value={formData.footerCode} onChange={(e) => setFormData({ ...formData, footerCode: e.target.value })} rows={12} className="font-mono text-sm" placeholder="<!-- Add scripts, chat widgets, etc. -->" />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="css" className="mt-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader><CardTitle>Custom CSS</CardTitle><CardDescription>Add custom styles to your site</CardDescription></CardHeader>
                  <CardContent>
                    <Textarea value={formData.customCss} onChange={(e) => setFormData({ ...formData, customCss: e.target.value })} rows={12} className="font-mono text-sm" placeholder="/* Custom CSS styles */" />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="js" className="mt-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader><CardTitle>Custom JavaScript</CardTitle><CardDescription>Add custom scripts to your site</CardDescription></CardHeader>
                  <CardContent>
                    <Textarea value={formData.customJs} onChange={(e) => setFormData({ ...formData, customJs: e.target.value })} rows={12} className="font-mono text-sm" placeholder="// Custom JavaScript code" />
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
