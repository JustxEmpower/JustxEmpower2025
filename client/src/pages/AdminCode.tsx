import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2, Layout, FileText, Settings, FolderOpen, BarChart3, Files, Palette, LogOut, Briefcase, Search, Menu, FormInput, Link as LinkIcon, Code } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import Editor from "@monaco-editor/react";

export default function AdminCode() {
  const [location, setLocation] = useLocation();
  const { logout } = useAdminAuth();
  
  const [customCSS, setCustomCSS] = useState("");
  const [customJS, setCustomJS] = useState("");
  const [headerCode, setHeaderCode] = useState("");
  const [footerCode, setFooterCode] = useState("");

  const navItems = [
    { icon: Layout, label: "Content", path: "/admin/content" },
    { icon: FileText, label: "Articles", path: "/admin/articles" },
    { icon: FolderOpen, label: "Media", path: "/admin/media" },
    { icon: Palette, label: "Theme", path: "/admin/theme" },
    { icon: Files, label: "Pages", path: "/admin/pages" },
    { icon: Briefcase, label: "Brand", path: "/admin/brand" },
    { icon: Search, label: "SEO", path: "/admin/seo" },
    { icon: Menu, label: "Navigation", path: "/admin/navigation" },
    { icon: FormInput, label: "Forms", path: "/admin/forms" },
    { icon: LinkIcon, label: "Redirects", path: "/admin/redirects" },
    { icon: Code, label: "Custom Code", path: "/admin/code" },
    { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

  const settingsQuery = trpc.admin.siteSettings.get.useQuery();
  
  const updateMutation = trpc.admin.siteSettings.update.useMutation({
    onSuccess: () => {
      toast.success("Custom code updated");
      settingsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update code");
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      const cssData = settingsQuery.data.find((s: any) => s.settingKey === "custom_css");
      const jsData = settingsQuery.data.find((s: any) => s.settingKey === "custom_js");
      const headerData = settingsQuery.data.find((s: any) => s.settingKey === "header_code");
      const footerData = settingsQuery.data.find((s: any) => s.settingKey === "footer_code");
      
      if (cssData) setCustomCSS(cssData.settingValue || "");
      if (jsData) setCustomJS(jsData.settingValue || "");
      if (headerData) setHeaderCode(headerData.settingValue || "");
      if (footerData) setFooterCode(footerData.settingValue || "");
    }
  }, [settingsQuery.data]);

  const handleSaveCSS = async () => {
    await updateMutation.mutateAsync({
      settingKey: "custom_css",
      settingValue: customCSS,
    });
  };

  const handleSaveJS = async () => {
    await updateMutation.mutateAsync({
      settingKey: "custom_js",
      settingValue: customJS,
    });
  };

  const handleSaveHeader = async () => {
    await updateMutation.mutateAsync({
      settingKey: "header_code",
      settingValue: headerCode,
    });
  };

  const handleSaveFooter = async () => {
    await updateMutation.mutateAsync({
      settingKey: "footer_code",
      settingValue: footerCode,
    });
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-900 text-stone-100 p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-serif">Just Empower</h1>
          <p className="text-sm text-stone-400 mt-1">Admin Portal</p>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <a
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-amber-600 text-white"
                      : "text-stone-300 hover:bg-stone-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </a>
              </Link>
            );
          })}
        </nav>

        <Button
          onClick={logout}
          variant="ghost"
          className="w-full justify-start text-stone-300 hover:text-white hover:bg-stone-800 mt-4"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-serif text-stone-900 mb-2">Custom Code Injection</h1>
            <p className="text-stone-600">Add custom CSS, JavaScript, and tracking codes to your site</p>
          </div>

          <Tabs defaultValue="css" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="css">Custom CSS</TabsTrigger>
              <TabsTrigger value="js">Custom JavaScript</TabsTrigger>
              <TabsTrigger value="header">Header Code</TabsTrigger>
              <TabsTrigger value="footer">Footer Code</TabsTrigger>
            </TabsList>

            {/* Custom CSS Tab */}
            <TabsContent value="css">
              <Card>
                <CardHeader>
                  <CardTitle>Custom CSS</CardTitle>
                  <CardDescription>
                    Add custom CSS styles that will be applied site-wide. Changes take effect immediately.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <Editor
                      height="400px"
                      defaultLanguage="css"
                      value={customCSS}
                      onChange={(value) => setCustomCSS(value || "")}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleSaveCSS}
                    disabled={updateMutation.isPending}
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
                        Save CSS
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Custom JavaScript Tab */}
            <TabsContent value="js">
              <Card>
                <CardHeader>
                  <CardTitle>Custom JavaScript</CardTitle>
                  <CardDescription>
                    Add custom JavaScript code. Be careful - invalid code can break your site.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <Editor
                      height="400px"
                      defaultLanguage="javascript"
                      value={customJS}
                      onChange={(value) => setCustomJS(value || "")}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleSaveJS}
                    disabled={updateMutation.isPending}
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
                        Save JavaScript
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Header Code Tab */}
            <TabsContent value="header">
              <Card>
                <CardHeader>
                  <CardTitle>Header Code</CardTitle>
                  <CardDescription>
                    Code injected in the &lt;head&gt; section. Perfect for meta tags, analytics, and fonts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <Editor
                      height="400px"
                      defaultLanguage="html"
                      value={headerCode}
                      onChange={(value) => setHeaderCode(value || "")}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleSaveHeader}
                    disabled={updateMutation.isPending}
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
                        Save Header Code
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Footer Code Tab */}
            <TabsContent value="footer">
              <Card>
                <CardHeader>
                  <CardTitle>Footer Code</CardTitle>
                  <CardDescription>
                    Code injected before &lt;/body&gt;. Ideal for tracking pixels and chat widgets.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <Editor
                      height="400px"
                      defaultLanguage="html"
                      value={footerCode}
                      onChange={(value) => setFooterCode(value || "")}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleSaveFooter}
                    disabled={updateMutation.isPending}
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
                        Save Footer Code
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
