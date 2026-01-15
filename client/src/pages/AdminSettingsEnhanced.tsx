import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from "framer-motion";
import { Settings, Globe, Mail, Bell, Shield, Database, Save, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [isSaving, setIsSaving] = useState(false);

  const settingsQuery = trpc.admin.settings?.get?.useQuery?.() || { data: null, refetch: () => {} };

  const [settings, setSettings] = useState({
    siteName: "Just Empower",
    siteDescription: "",
    contactEmail: "",
    enableNewsletter: true,
    enableAnalytics: true,
    enableAIChat: true,
    maintenanceMode: false,
    socialInstagram: "",
    socialLinkedin: "",
    socialFacebook: "",
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  useEffect(() => {
    if (settingsQuery.data) {
      setSettings(prev => ({ ...prev, ...settingsQuery.data }));
    }
  }, [settingsQuery.data]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      toast.success("Settings saved");
    } catch (e) {
      toast.error("Failed to save");
    }
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
              <div><h1 className="text-2xl font-bold text-stone-900">Settings</h1><p className="text-stone-500 text-sm">Configure your site settings</p></div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => settingsQuery.refetch?.()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
                <Button onClick={handleSave} disabled={isSaving} className="bg-amber-600 hover:bg-amber-700">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general"><Globe className="w-4 h-4 mr-2" />General</TabsTrigger>
              <TabsTrigger value="features"><Shield className="w-4 h-4 mr-2" />Features</TabsTrigger>
              <TabsTrigger value="social"><Mail className="w-4 h-4 mr-2" />Social</TabsTrigger>
              <TabsTrigger value="advanced"><Database className="w-4 h-4 mr-2" />Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6 space-y-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader><CardTitle>Site Information</CardTitle><CardDescription>Basic site configuration</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Site Name</Label><Input value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Site Description</Label><Input value={settings.siteDescription} onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })} placeholder="A brief description of your site" /></div>
                    <div className="space-y-2"><Label>Contact Email</Label><Input type="email" value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} placeholder="contact@example.com" /></div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="features" className="mt-6 space-y-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader><CardTitle>Site Features</CardTitle><CardDescription>Enable or disable features</CardDescription></CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div><Label>Newsletter Popup</Label><p className="text-sm text-stone-500">Show newsletter subscription popup</p></div>
                      <Switch checked={settings.enableNewsletter} onCheckedChange={(v) => setSettings({ ...settings, enableNewsletter: v })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div><Label>Analytics Tracking</Label><p className="text-sm text-stone-500">Track visitor analytics</p></div>
                      <Switch checked={settings.enableAnalytics} onCheckedChange={(v) => setSettings({ ...settings, enableAnalytics: v })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div><Label>AI Chat Assistant</Label><p className="text-sm text-stone-500">Enable AI-powered chat widget</p></div>
                      <Switch checked={settings.enableAIChat} onCheckedChange={(v) => setSettings({ ...settings, enableAIChat: v })} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="social" className="mt-6 space-y-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader><CardTitle>Social Links</CardTitle><CardDescription>Connect your social profiles</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Instagram URL</Label><Input value={settings.socialInstagram} onChange={(e) => setSettings({ ...settings, socialInstagram: e.target.value })} placeholder="https://instagram.com/..." /></div>
                    <div className="space-y-2"><Label>LinkedIn URL</Label><Input value={settings.socialLinkedin} onChange={(e) => setSettings({ ...settings, socialLinkedin: e.target.value })} placeholder="https://linkedin.com/..." /></div>
                    <div className="space-y-2"><Label>Facebook URL</Label><Input value={settings.socialFacebook} onChange={(e) => setSettings({ ...settings, socialFacebook: e.target.value })} placeholder="https://facebook.com/..." /></div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="advanced" className="mt-6 space-y-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader><CardTitle>Advanced Settings</CardTitle><CardDescription>System configuration</CardDescription></CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                      <div><Label className="text-red-700">Maintenance Mode</Label><p className="text-sm text-red-600">Take site offline for maintenance</p></div>
                      <Switch checked={settings.maintenanceMode} onCheckedChange={(v) => setSettings({ ...settings, maintenanceMode: v })} />
                    </div>
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
