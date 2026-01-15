import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminSidebar from '@/components/AdminSidebar';
import MediaPicker from '@/components/MediaPicker';
import { motion } from "framer-motion";
import { 
  Search, Save, Loader2, RefreshCw, Globe, FileText, Share2, 
  CheckCircle, AlertCircle, Edit, Eye, ExternalLink, Sparkles,
  Twitter, Facebook, Linkedin, Bot, FileCode, Image as ImageIcon,
  BarChart3, TrendingUp, Link as LinkIcon, Wand2
} from "lucide-react";
import { toast } from "sonner";

interface PageSEO {
  id: number;
  title: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  published: number;
}

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

export default function AdminSEOEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("global");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPage, setEditingPage] = useState<PageSEO | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Global SEO settings
  const [globalSEO, setGlobalSEO] = useState({
    siteTitle: "",
    siteDescription: "",
    siteKeywords: "",
    ogDefaultImage: "",
    twitterHandle: "",
    facebookAppId: "",
    googleVerification: "",
    bingVerification: "",
    robotsTxt: "User-agent: *\nAllow: /\nSitemap: https://justxempower.com/sitemap.xml",
    sitemapEnabled: true,
    schemaOrgEnabled: true,
    canonicalEnabled: true,
  });

  // Page-specific SEO editing
  const [pageSEO, setPageSEO] = useState({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    twitterCard: "summary_large_image",
    canonicalUrl: "",
    noIndex: false,
    structuredData: "",
  });

  // Queries
  const pagesQuery = trpc.admin.pages.list.useQuery();
  const siteSettingsQuery = trpc.admin.siteSettings.get.useQuery();
  
  // Mutations
  const updateSiteSettingMutation = trpc.admin.siteSettings.update.useMutation({
    onSuccess: () => toast.success("Setting saved"),
    onError: (e) => toast.error(e.message),
  });
  
  const updatePageSEOMutation = trpc.admin.seo.update.useMutation({
    onSuccess: () => {
      toast.success("Page SEO updated");
      setIsEditDialogOpen(false);
      setEditingPage(null);
      pagesQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const generateAIMutation = trpc.admin.ai?.generateSEO?.useMutation?.({
    onSuccess: (data: any) => {
      if (data.metaTitle) setPageSEO(prev => ({ ...prev, metaTitle: data.metaTitle }));
      if (data.metaDescription) setPageSEO(prev => ({ ...prev, metaDescription: data.metaDescription }));
      toast.success("AI generated SEO content");
      setIsGeneratingAI(false);
    },
    onError: () => {
      toast.error("AI generation failed");
      setIsGeneratingAI(false);
    },
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  // Load site settings into form
  useEffect(() => {
    if (siteSettingsQuery.data) {
      const settings = siteSettingsQuery.data as any[];
      const getVal = (key: string) => settings.find((s: any) => s.settingKey === key)?.settingValue || "";
      setGlobalSEO(prev => ({
        ...prev,
        siteTitle: getVal("seo_siteTitle"),
        siteDescription: getVal("seo_siteDescription"),
        siteKeywords: getVal("seo_siteKeywords"),
        ogDefaultImage: getVal("seo_ogDefaultImage"),
        twitterHandle: getVal("seo_twitterHandle"),
        facebookAppId: getVal("seo_facebookAppId"),
        googleVerification: getVal("seo_googleVerification"),
        bingVerification: getVal("seo_bingVerification"),
        robotsTxt: getVal("seo_robotsTxt") || prev.robotsTxt,
        sitemapEnabled: getVal("seo_sitemapEnabled") !== "false",
        schemaOrgEnabled: getVal("seo_schemaOrgEnabled") !== "false",
        canonicalEnabled: getVal("seo_canonicalEnabled") !== "false",
      }));
    }
  }, [siteSettingsQuery.data]);

  const pages = pagesQuery.data || [];
  
  // Calculate SEO stats
  const stats = useMemo(() => {
    const total = pages.length;
    const withTitle = pages.filter((p: any) => p.metaTitle && p.metaTitle.length > 0).length;
    const withDesc = pages.filter((p: any) => p.metaDescription && p.metaDescription.length > 0).length;
    const optimized = pages.filter((p: any) => 
      p.metaTitle && p.metaTitle.length >= 30 && p.metaTitle.length <= 60 &&
      p.metaDescription && p.metaDescription.length >= 120 && p.metaDescription.length <= 160
    ).length;
    return { total, withTitle, withDesc, optimized };
  }, [pages]);

  // Filter pages
  const filteredPages = useMemo(() => {
    return pages.filter((p: any) => 
      searchQuery === "" || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pages, searchQuery]);

  const handleSaveGlobalSetting = async (key: string, value: string) => {
    await updateSiteSettingMutation.mutateAsync({
      settingKey: `seo_${key}`,
      settingValue: value,
    });
  };

  const handleSaveAllGlobal = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        handleSaveGlobalSetting("siteTitle", globalSEO.siteTitle),
        handleSaveGlobalSetting("siteDescription", globalSEO.siteDescription),
        handleSaveGlobalSetting("siteKeywords", globalSEO.siteKeywords),
        handleSaveGlobalSetting("ogDefaultImage", globalSEO.ogDefaultImage),
        handleSaveGlobalSetting("twitterHandle", globalSEO.twitterHandle),
        handleSaveGlobalSetting("facebookAppId", globalSEO.facebookAppId),
        handleSaveGlobalSetting("googleVerification", globalSEO.googleVerification),
        handleSaveGlobalSetting("bingVerification", globalSEO.bingVerification),
        handleSaveGlobalSetting("robotsTxt", globalSEO.robotsTxt),
        handleSaveGlobalSetting("sitemapEnabled", String(globalSEO.sitemapEnabled)),
        handleSaveGlobalSetting("schemaOrgEnabled", String(globalSEO.schemaOrgEnabled)),
        handleSaveGlobalSetting("canonicalEnabled", String(globalSEO.canonicalEnabled)),
      ]);
      toast.success("All SEO settings saved");
    } catch (e) {
      toast.error("Failed to save some settings");
    }
    setIsSaving(false);
  };

  const handleEditPageSEO = (page: PageSEO) => {
    setEditingPage(page);
    setPageSEO({
      metaTitle: page.metaTitle || page.title,
      metaDescription: page.metaDescription || "",
      metaKeywords: "",
      ogTitle: page.metaTitle || page.title,
      ogDescription: page.metaDescription || "",
      ogImage: "",
      twitterCard: "summary_large_image",
      canonicalUrl: `https://justxempower.com/${page.slug}`,
      noIndex: false,
      structuredData: "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSavePageSEO = async () => {
    if (!editingPage) return;
    await updatePageSEOMutation.mutateAsync({
      pageSlug: editingPage.slug,
      metaTitle: pageSEO.metaTitle,
      metaDescription: pageSEO.metaDescription,
      metaKeywords: pageSEO.metaKeywords,
      ogTitle: pageSEO.ogTitle,
      ogDescription: pageSEO.ogDescription,
      ogImage: pageSEO.ogImage,
      twitterCard: pageSEO.twitterCard,
      canonicalUrl: pageSEO.canonicalUrl,
      noIndex: pageSEO.noIndex ? 1 : 0,
      structuredData: pageSEO.structuredData,
    });
  };

  const handleGenerateAI = async () => {
    if (!editingPage) return;
    setIsGeneratingAI(true);
    if (generateAIMutation?.mutate) {
      generateAIMutation.mutate({ pageTitle: editingPage.title, pageSlug: editingPage.slug });
    } else {
      // Fallback: generate basic SEO
      const title = `${editingPage.title} | Just Empower`;
      const desc = `Explore ${editingPage.title.toLowerCase()} at Just Empower. Discover empowerment resources, wellness guidance, and community support.`;
      setPageSEO(prev => ({ ...prev, metaTitle: title, metaDescription: desc }));
      toast.success("Generated basic SEO content");
      setIsGeneratingAI(false);
    }
  };

  const getSEOScore = (page: any) => {
    let score = 0;
    if (page.metaTitle && page.metaTitle.length >= 30 && page.metaTitle.length <= 60) score += 40;
    else if (page.metaTitle && page.metaTitle.length > 0) score += 20;
    if (page.metaDescription && page.metaDescription.length >= 120 && page.metaDescription.length <= 160) score += 40;
    else if (page.metaDescription && page.metaDescription.length > 0) score += 20;
    if (page.published === 1) score += 20;
    return score;
  };

  if (isChecking || pagesQuery.isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-stone-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" /></div>;
  }
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 flex">
      <AdminSidebar variant="dark" />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">SEO Manager</h1>
                <p className="text-stone-500 text-sm">Optimize your site for search engines</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => { pagesQuery.refetch(); siteSettingsQuery.refetch(); }}>
                  <RefreshCw className="w-4 h-4 mr-2" />Refresh
                </Button>
                {activeTab === "global" && (
                  <Button onClick={handleSaveAllGlobal} disabled={isSaving} className="bg-amber-600 hover:bg-amber-700">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save All
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Total Pages", value: stats.total, icon: FileText, color: "amber" },
              { label: "With Meta Title", value: stats.withTitle, icon: CheckCircle, color: "emerald" },
              { label: "With Description", value: stats.withDesc, icon: FileCode, color: "blue" },
              { label: "Fully Optimized", value: stats.optimized, icon: TrendingUp, color: "purple" },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100/50 border-${stat.color}-200`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs font-medium text-${stat.color}-600`}>{stat.label}</p>
                        <p className={`text-2xl font-bold text-${stat.color}-900`}><AnimatedCounter value={stat.value} /></p>
                      </div>
                      <stat.icon className={`w-8 h-8 text-${stat.color}-500`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="global"><Globe className="w-4 h-4 mr-2" />Global Settings</TabsTrigger>
              <TabsTrigger value="pages"><FileText className="w-4 h-4 mr-2" />Page SEO</TabsTrigger>
              <TabsTrigger value="social"><Share2 className="w-4 h-4 mr-2" />Social Media</TabsTrigger>
              <TabsTrigger value="technical"><Bot className="w-4 h-4 mr-2" />Technical</TabsTrigger>
            </TabsList>

            {/* Global Settings Tab */}
            <TabsContent value="global" className="mt-6 space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Site-Wide SEO Defaults</CardTitle>
                    <CardDescription>Default meta tags applied to all pages without custom SEO</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Default Site Title</Label>
                      <Input 
                        value={globalSEO.siteTitle} 
                        onChange={(e) => setGlobalSEO({ ...globalSEO, siteTitle: e.target.value })} 
                        placeholder="Just Empower | Wellness & Empowerment" 
                      />
                      <div className="flex justify-between text-xs">
                        <span className={globalSEO.siteTitle.length > 60 ? "text-red-500" : "text-stone-500"}>
                          {globalSEO.siteTitle.length}/60 characters
                        </span>
                        {globalSEO.siteTitle.length >= 30 && globalSEO.siteTitle.length <= 60 && (
                          <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Optimal</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Default Meta Description</Label>
                      <Textarea 
                        value={globalSEO.siteDescription} 
                        onChange={(e) => setGlobalSEO({ ...globalSEO, siteDescription: e.target.value })} 
                        placeholder="Discover empowerment resources, wellness guidance, and community support at Just Empower."
                        rows={3}
                      />
                      <div className="flex justify-between text-xs">
                        <span className={globalSEO.siteDescription.length > 160 ? "text-red-500" : "text-stone-500"}>
                          {globalSEO.siteDescription.length}/160 characters
                        </span>
                        {globalSEO.siteDescription.length >= 120 && globalSEO.siteDescription.length <= 160 && (
                          <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Optimal</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Default Keywords</Label>
                      <Input 
                        value={globalSEO.siteKeywords} 
                        onChange={(e) => setGlobalSEO({ ...globalSEO, siteKeywords: e.target.value })} 
                        placeholder="empowerment, wellness, community, self-care, mindfulness" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Default OG Image</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={globalSEO.ogDefaultImage} 
                          onChange={(e) => setGlobalSEO({ ...globalSEO, ogDefaultImage: e.target.value })} 
                          placeholder="https://justxempower.com/og-image.jpg" 
                        />
                        <Button variant="outline" onClick={() => setMediaPickerOpen(true)}>
                          <ImageIcon className="w-4 h-4" />
                        </Button>
                      </div>
                      {globalSEO.ogDefaultImage && (
                        <img src={globalSEO.ogDefaultImage} alt="OG Preview" className="w-full max-w-md h-32 object-cover mt-2 rounded border" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>SEO Features</CardTitle>
                    <CardDescription>Enable or disable automatic SEO features</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                      <div>
                        <Label>Automatic Sitemap</Label>
                        <p className="text-xs text-stone-500">Generate sitemap.xml automatically</p>
                      </div>
                      <Switch checked={globalSEO.sitemapEnabled} onCheckedChange={(v) => setGlobalSEO({ ...globalSEO, sitemapEnabled: v })} />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                      <div>
                        <Label>Schema.org Markup</Label>
                        <p className="text-xs text-stone-500">Add structured data to pages</p>
                      </div>
                      <Switch checked={globalSEO.schemaOrgEnabled} onCheckedChange={(v) => setGlobalSEO({ ...globalSEO, schemaOrgEnabled: v })} />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                      <div>
                        <Label>Canonical URLs</Label>
                        <p className="text-xs text-stone-500">Automatically add canonical links</p>
                      </div>
                      <Switch checked={globalSEO.canonicalEnabled} onCheckedChange={(v) => setGlobalSEO({ ...globalSEO, canonicalEnabled: v })} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Page SEO Tab */}
            <TabsContent value="pages" className="mt-6 space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  placeholder="Search pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Page-by-Page SEO</CardTitle>
                  <CardDescription>Optimize SEO for individual pages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredPages.map((page: any) => {
                      const score = getSEOScore(page);
                      return (
                        <div key={page.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium truncate">{page.title}</h3>
                              {page.published !== 1 && <Badge variant="outline" className="text-xs">Draft</Badge>}
                            </div>
                            <p className="text-sm text-stone-500">/{page.slug}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs">
                              {page.metaTitle ? (
                                <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Title</span>
                              ) : (
                                <span className="text-amber-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />No title</span>
                              )}
                              {page.metaDescription ? (
                                <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Description</span>
                              ) : (
                                <span className="text-amber-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />No description</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className={`text-lg font-bold ${score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                                {score}%
                              </div>
                              <div className="text-xs text-stone-500">SEO Score</div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => handleEditPageSEO(page)}>
                              <Edit className="w-4 h-4 mr-1" />Edit
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    {filteredPages.length === 0 && (
                      <div className="text-center py-8 text-stone-500">
                        {searchQuery ? "No pages match your search" : "No pages found"}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Social Media Tab */}
            <TabsContent value="social" className="mt-6 space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Twitter className="w-5 h-5" />Twitter / X</CardTitle>
                    <CardDescription>Configure how your site appears on Twitter</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Twitter Handle</Label>
                      <Input 
                        value={globalSEO.twitterHandle} 
                        onChange={(e) => setGlobalSEO({ ...globalSEO, twitterHandle: e.target.value })} 
                        placeholder="@justxempower" 
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Facebook className="w-5 h-5" />Facebook</CardTitle>
                    <CardDescription>Configure Facebook Open Graph settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Facebook App ID</Label>
                      <Input 
                        value={globalSEO.facebookAppId} 
                        onChange={(e) => setGlobalSEO({ ...globalSEO, facebookAppId: e.target.value })} 
                        placeholder="123456789012345" 
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Social Preview */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Social Share Preview</CardTitle>
                    <CardDescription>How your site appears when shared</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden max-w-md">
                      {globalSEO.ogDefaultImage && (
                        <img src={globalSEO.ogDefaultImage} alt="Preview" className="w-full h-40 object-cover" />
                      )}
                      <div className="p-3 bg-white">
                        <p className="text-xs text-stone-500 uppercase">justxempower.com</p>
                        <h3 className="font-semibold text-stone-900">{globalSEO.siteTitle || "Just Empower"}</h3>
                        <p className="text-sm text-stone-600 line-clamp-2">{globalSEO.siteDescription || "Add a description..."}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Technical Tab */}
            <TabsContent value="technical" className="mt-6 space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Search Engine Verification</CardTitle>
                    <CardDescription>Verify ownership with search engines</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Google Search Console</Label>
                      <Input 
                        value={globalSEO.googleVerification} 
                        onChange={(e) => setGlobalSEO({ ...globalSEO, googleVerification: e.target.value })} 
                        placeholder="google-site-verification code" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bing Webmaster Tools</Label>
                      <Input 
                        value={globalSEO.bingVerification} 
                        onChange={(e) => setGlobalSEO({ ...globalSEO, bingVerification: e.target.value })} 
                        placeholder="msvalidate.01 code" 
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Robots.txt</CardTitle>
                    <CardDescription>Control search engine crawling behavior</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      value={globalSEO.robotsTxt} 
                      onChange={(e) => setGlobalSEO({ ...globalSEO, robotsTxt: e.target.value })} 
                      rows={8} 
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-stone-500 mt-2">
                      This content will be served at /robots.txt
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={() => window.open("/sitemap.xml", "_blank")}>
                      <ExternalLink className="w-4 h-4 mr-2" />View Sitemap
                    </Button>
                    <Button variant="outline" onClick={() => window.open("/robots.txt", "_blank")}>
                      <ExternalLink className="w-4 h-4 mr-2" />View Robots.txt
                    </Button>
                    <Button variant="outline" onClick={() => window.open("https://search.google.com/search-console", "_blank")}>
                      <ExternalLink className="w-4 h-4 mr-2" />Google Search Console
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Page SEO Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit SEO: {editingPage?.title}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleGenerateAI} disabled={isGeneratingAI}>
                  {isGeneratingAI ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                  Generate with AI
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input 
                  value={pageSEO.metaTitle} 
                  onChange={(e) => setPageSEO({ ...pageSEO, metaTitle: e.target.value })} 
                />
                <div className="flex justify-between text-xs">
                  <span className={pageSEO.metaTitle.length > 60 ? "text-red-500" : "text-stone-500"}>
                    {pageSEO.metaTitle.length}/60
                  </span>
                  {pageSEO.metaTitle.length >= 30 && pageSEO.metaTitle.length <= 60 && (
                    <span className="text-emerald-600">✓ Optimal</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea 
                  value={pageSEO.metaDescription} 
                  onChange={(e) => setPageSEO({ ...pageSEO, metaDescription: e.target.value })} 
                  rows={3}
                />
                <div className="flex justify-between text-xs">
                  <span className={pageSEO.metaDescription.length > 160 ? "text-red-500" : "text-stone-500"}>
                    {pageSEO.metaDescription.length}/160
                  </span>
                  {pageSEO.metaDescription.length >= 120 && pageSEO.metaDescription.length <= 160 && (
                    <span className="text-emerald-600">✓ Optimal</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Keywords</Label>
                <Input 
                  value={pageSEO.metaKeywords} 
                  onChange={(e) => setPageSEO({ ...pageSEO, metaKeywords: e.target.value })} 
                  placeholder="keyword1, keyword2"
                />
              </div>

              <div className="space-y-2">
                <Label>OG Image URL</Label>
                <Input 
                  value={pageSEO.ogImage} 
                  onChange={(e) => setPageSEO({ ...pageSEO, ogImage: e.target.value })} 
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Twitter Card Type</Label>
                <Select value={pageSEO.twitterCard} onValueChange={(v) => setPageSEO({ ...pageSEO, twitterCard: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary</SelectItem>
                    <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Canonical URL</Label>
                <Input 
                  value={pageSEO.canonicalUrl} 
                  onChange={(e) => setPageSEO({ ...pageSEO, canonicalUrl: e.target.value })} 
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                <div>
                  <Label>No Index</Label>
                  <p className="text-xs text-stone-500">Hide this page from search engines</p>
                </div>
                <Switch checked={pageSEO.noIndex} onCheckedChange={(v) => setPageSEO({ ...pageSEO, noIndex: v })} />
              </div>

              {/* Search Preview */}
              <div className="p-4 bg-white border rounded-lg">
                <p className="text-xs text-stone-500 mb-2">Google Search Preview</p>
                <div className="text-blue-600 text-lg hover:underline cursor-pointer truncate">
                  {pageSEO.metaTitle || editingPage?.title}
                </div>
                <div className="text-emerald-700 text-sm">
                  justxempower.com/{editingPage?.slug}
                </div>
                <div className="text-stone-600 text-sm line-clamp-2">
                  {pageSEO.metaDescription || "Add a meta description..."}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSavePageSEO} disabled={updatePageSEOMutation.isPending} className="bg-amber-600 hover:bg-amber-700">
                {updatePageSEOMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save SEO
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Media Picker */}
        <MediaPicker
          open={mediaPickerOpen}
          onClose={() => setMediaPickerOpen(false)}
          onSelect={(url) => {
            setGlobalSEO({ ...globalSEO, ogDefaultImage: url });
            setMediaPickerOpen(false);
          }}
        />
      </main>
    </div>
  );
}
