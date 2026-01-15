import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Search, Save, Loader2, Layout, FileText, Settings, FolderOpen, BarChart3, Files, Palette, LogOut, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminSEO() {
  const [location, setLocation] = useLocation();
  const { logout } = useAdminAuth();
  
  const [selectedPage, setSelectedPage] = useState("home");
  const [isPageChanging, setIsPageChanging] = useState(false);
  const [formData, setFormData] = useState({
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

  const pagesQuery = trpc.admin.pages.list.useQuery();
  const seoQuery = trpc.admin.seo.get.useQuery({ pageSlug: selectedPage });
  const updateMutation = trpc.admin.seo.update.useMutation({
    onSuccess: () => {
      toast.success("SEO settings saved successfully");
      seoQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save SEO settings");
    },
  });

  useEffect(() => {
    if (seoQuery.data) {
      setFormData({
        metaTitle: seoQuery.data.metaTitle || "",
        metaDescription: seoQuery.data.metaDescription || "",
        metaKeywords: seoQuery.data.metaKeywords || "",
        ogTitle: seoQuery.data.ogTitle || "",
        ogDescription: seoQuery.data.ogDescription || "",
        ogImage: seoQuery.data.ogImage || "",
        twitterCard: seoQuery.data.twitterCard || "summary_large_image",
        canonicalUrl: seoQuery.data.canonicalUrl || "",
        noIndex: seoQuery.data.noIndex === 1,
        structuredData: seoQuery.data.structuredData || "",
      });
      setIsPageChanging(false);
    } else if (isPageChanging) {
      // Only reset form when explicitly changing pages, not during refetch
      setFormData({
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
      setIsPageChanging(false);
    }
  }, [seoQuery.data, isPageChanging]);

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      pageSlug: selectedPage,
      ...formData,
      noIndex: formData.noIndex ? 1 : 0,
    });
  };

  const handlePageChange = (pageSlug: string) => {
    setIsPageChanging(true);
    setSelectedPage(pageSlug);
  };

  const generateStructuredData = () => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Just Empower",
      "url": `https://yourdomain.com/${selectedPage === "home" ? "" : selectedPage}`,
      "description": formData.metaDescription,
    };
    setFormData({ ...formData, structuredData: JSON.stringify(structuredData, null, 2) });
    toast.success("Structured data template generated");
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Sidebar */}
      <AdminSidebar variant="dark" />

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-serif text-stone-900 mb-2">SEO Manager</h1>
            <p className="text-stone-600">Optimize your pages for search engines and social media</p>
          </div>

          {/* Page Selector */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Page</CardTitle>
              <CardDescription>Choose which page to configure SEO settings for</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedPage} onValueChange={handlePageChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="about">About</SelectItem>
                  <SelectItem value="philosophy">Philosophy</SelectItem>
                  <SelectItem value="offerings">Offerings</SelectItem>
                  <SelectItem value="journal">Journal</SelectItem>
                  <SelectItem value="contact">Contact</SelectItem>
                  {pagesQuery.data?.map((page) => (
                    <SelectItem key={page.id} value={page.slug}>
                      {page.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* SEO Settings Tabs */}
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic SEO</TabsTrigger>
              <TabsTrigger value="social">Social Media</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* Basic SEO Tab */}
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Basic SEO Settings</CardTitle>
                  <CardDescription>Meta tags that appear in search results</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input
                      id="metaTitle"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                      placeholder="Page title for search engines (50-60 characters)"
                      maxLength={60}
                    />
                    <p className="text-xs text-stone-500 mt-1">{formData.metaTitle.length}/60 characters</p>
                  </div>

                  <div>
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <Textarea
                      id="metaDescription"
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                      placeholder="Brief description for search results (150-160 characters)"
                      rows={3}
                      maxLength={160}
                    />
                    <p className="text-xs text-stone-500 mt-1">{formData.metaDescription.length}/160 characters</p>
                  </div>

                  <div>
                    <Label htmlFor="metaKeywords">Meta Keywords</Label>
                    <Input
                      id="metaKeywords"
                      value={formData.metaKeywords}
                      onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                      placeholder="Comma-separated keywords (optional)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="canonicalUrl">Canonical URL</Label>
                    <Input
                      id="canonicalUrl"
                      value={formData.canonicalUrl}
                      onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                      placeholder="https://yourdomain.com/page"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="noIndex"
                      checked={formData.noIndex}
                      onCheckedChange={(checked) => setFormData({ ...formData, noIndex: checked })}
                    />
                    <Label htmlFor="noIndex" className="cursor-pointer">
                      No Index (Hide from search engines)
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Social Media Tab */}
            <TabsContent value="social">
              <Card>
                <CardHeader>
                  <CardTitle>Social Media Settings</CardTitle>
                  <CardDescription>Control how your page appears when shared on social media</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="ogTitle">Open Graph Title</Label>
                    <Input
                      id="ogTitle"
                      value={formData.ogTitle}
                      onChange={(e) => setFormData({ ...formData, ogTitle: e.target.value })}
                      placeholder="Title for Facebook, LinkedIn (defaults to Meta Title)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ogDescription">Open Graph Description</Label>
                    <Textarea
                      id="ogDescription"
                      value={formData.ogDescription}
                      onChange={(e) => setFormData({ ...formData, ogDescription: e.target.value })}
                      placeholder="Description for social media sharing"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ogImage">Open Graph Image URL</Label>
                    <Input
                      id="ogImage"
                      value={formData.ogImage}
                      onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                      placeholder="https://yourdomain.com/images/og-image.jpg (1200x630px)"
                    />
                    <p className="text-xs text-stone-500 mt-1">Recommended: 1200×630px</p>
                  </div>

                  <div>
                    <Label htmlFor="twitterCard">Twitter Card Type</Label>
                    <Select
                      value={formData.twitterCard}
                      onValueChange={(value) => setFormData({ ...formData, twitterCard: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="summary">Summary</SelectItem>
                        <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced">
              <Card>
                <CardHeader>
                  <CardTitle>Structured Data (JSON-LD)</CardTitle>
                  <CardDescription>Add schema markup for rich search results</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor="structuredData">JSON-LD Schema</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateStructuredData}
                      >
                        Generate Template
                      </Button>
                    </div>
                    <Textarea
                      id="structuredData"
                      value={formData.structuredData}
                      onChange={(e) => setFormData({ ...formData, structuredData: e.target.value })}
                      placeholder='{"@context": "https://schema.org", "@type": "Organization", ...}'
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-stone-500 mt-1">
                      Learn more about structured data at{" "}
                      <a href="https://schema.org" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">
                        schema.org
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              size="lg"
              className="bg-amber-600 hover:bg-amber-700"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save SEO Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
