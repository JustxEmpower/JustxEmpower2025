import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from "framer-motion";
import { Palette, Type, Save, Loader2, RefreshCw, Sparkles, Image } from "lucide-react";
import { toast } from "sonner";

export default function AdminThemeEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [paletteDescription, setPaletteDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const themeQuery = trpc.admin.theme.get.useQuery();
  const updateMutation = trpc.admin.theme.update.useMutation({ onSuccess: () => toast.success("Theme saved"), onError: (e) => toast.error(e.message) });
  const generatePaletteMutation = trpc.admin.theme.generatePalette.useMutation();

  const [formData, setFormData] = useState({
    primaryColor: "#000000", secondaryColor: "#ffffff", accentColor: "#1a1a1a", backgroundColor: "#ffffff", textColor: "#000000",
    headingFont: "Playfair Display", bodyFont: "Inter", containerMaxWidth: "1280px", sectionSpacing: "120px", borderRadius: "8px",
    heroBackgroundImage: "", heroBackgroundVideo: "",
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  useEffect(() => {
    if (themeQuery.data && typeof themeQuery.data === 'object') setFormData(prev => ({ ...prev, ...(themeQuery.data as Record<string, string>) }));
  }, [themeQuery.data]);

  const handleGeneratePalette = async () => {
    if (!paletteDescription.trim()) { toast.error("Describe your desired palette"); return; }
    setIsGenerating(true);
    try {
      const result = await generatePaletteMutation.mutateAsync({ description: paletteDescription });
      if (result) setFormData(prev => ({ ...prev, ...result }));
      toast.success("Palette generated!");
    } catch (e: any) { toast.error(e.message); }
    setIsGenerating(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try { await updateMutation.mutateAsync(formData); }
    catch (e) { /* handled by mutation */ }
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
              <div><h1 className="text-2xl font-bold text-stone-900">Theme</h1><p className="text-stone-500 text-sm">Customize colors, fonts, and styling</p></div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => themeQuery.refetch()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
                <Button onClick={handleSave} disabled={isSaving} className="bg-amber-600 hover:bg-amber-700">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Save Theme
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          <Tabs defaultValue="colors">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="colors"><Palette className="w-4 h-4 mr-2" />Colors</TabsTrigger>
              <TabsTrigger value="typography"><Type className="w-4 h-4 mr-2" />Typography</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="backgrounds"><Image className="w-4 h-4 mr-2" />Backgrounds</TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="mt-6 space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-500" />AI Palette Generator</CardTitle><CardDescription>Describe your desired color scheme</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <Input value={paletteDescription} onChange={(e) => setPaletteDescription(e.target.value)} placeholder="e.g., Warm earth tones with gold accents, elegant and feminine" />
                    <Button onClick={handleGeneratePalette} disabled={isGenerating} variant="outline" className="w-full">
                      {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}Generate Palette
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardHeader><CardTitle>Color Palette</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { key: "primaryColor", label: "Primary" }, { key: "secondaryColor", label: "Secondary" }, { key: "accentColor", label: "Accent" },
                      { key: "backgroundColor", label: "Background" }, { key: "textColor", label: "Text" },
                    ].map((color) => (
                      <div key={color.key} className="space-y-2">
                        <Label>{color.label}</Label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={(formData as any)[color.key]} onChange={(e) => setFormData({ ...formData, [color.key]: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                          <Input value={(formData as any)[color.key]} onChange={(e) => setFormData({ ...formData, [color.key]: e.target.value })} className="font-mono text-sm" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="typography" className="mt-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader><CardTitle>Fonts</CardTitle><CardDescription>Select fonts for headings and body text</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Heading Font</Label><Input value={formData.headingFont} onChange={(e) => setFormData({ ...formData, headingFont: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Body Font</Label><Input value={formData.bodyFont} onChange={(e) => setFormData({ ...formData, bodyFont: e.target.value })} /></div>
                    <div className="p-4 bg-stone-50 rounded-lg">
                      <h3 style={{ fontFamily: formData.headingFont }} className="text-2xl mb-2">Heading Preview</h3>
                      <p style={{ fontFamily: formData.bodyFont }}>Body text preview. The quick brown fox jumps over the lazy dog.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="layout" className="mt-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader><CardTitle>Layout Settings</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Container Max Width</Label><Input value={formData.containerMaxWidth} onChange={(e) => setFormData({ ...formData, containerMaxWidth: e.target.value })} placeholder="1280px" /></div>
                    <div className="space-y-2"><Label>Section Spacing</Label><Input value={formData.sectionSpacing} onChange={(e) => setFormData({ ...formData, sectionSpacing: e.target.value })} placeholder="120px" /></div>
                    <div className="space-y-2"><Label>Border Radius</Label><Input value={formData.borderRadius} onChange={(e) => setFormData({ ...formData, borderRadius: e.target.value })} placeholder="8px" /></div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="backgrounds" className="mt-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader><CardTitle>Background Images</CardTitle><CardDescription>Set background images for different sections</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Hero Background Image URL</Label><Input value={formData.heroBackgroundImage} onChange={(e) => setFormData({ ...formData, heroBackgroundImage: e.target.value })} placeholder="https://..." /></div>
                    <div className="space-y-2"><Label>Hero Background Video URL</Label><Input value={formData.heroBackgroundVideo} onChange={(e) => setFormData({ ...formData, heroBackgroundVideo: e.target.value })} placeholder="https://..." /></div>
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
