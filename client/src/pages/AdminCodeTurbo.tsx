import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminSidebar from '@/components/AdminSidebar';
import { motion, AnimatePresence } from "framer-motion";
import {
  Code, Save, Loader2, RefreshCw, FileCode, Globe, Sparkles, Copy, Check,
  Play, Eye, EyeOff, History, Undo2, Redo2, Download, Upload, Trash2,
  AlertTriangle, CheckCircle, XCircle, Zap, Terminal, Palette, FileText,
  ChevronDown, Plus, Settings, Info, ExternalLink, Braces, Hash, AtSign
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

// Code snippet templates
const CODE_SNIPPETS = {
  header: [
    { name: "Google Analytics 4", code: `<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>` },
    { name: "Meta Pixel", code: `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>` },
    { name: "Hotjar", code: `<!-- Hotjar Tracking Code -->
<script>
(function(h,o,t,j,a,r){
    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
    h._hjSettings={hjid:YOUR_HOTJAR_ID,hjsv:6};
    a=o.getElementsByTagName('head')[0];
    r=o.createElement('script');r.async=1;
    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
    a.appendChild(r);
})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
</script>` },
    { name: "Custom Font", code: `<!-- Custom Google Font -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">` },
  ],
  footer: [
    { name: "Tawk.to Chat", code: `<!-- Tawk.to Live Chat -->
<script type="text/javascript">
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/YOUR_TAWK_ID/default';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();
</script>` },
    { name: "Crisp Chat", code: `<!-- Crisp Chat Widget -->
<script type="text/javascript">
window.$crisp=[];window.CRISP_WEBSITE_ID="YOUR_CRISP_ID";
(function(){d=document;s=d.createElement("script");
s.src="https://client.crisp.chat/l.js";
s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();
</script>` },
    { name: "Cookie Consent", code: `<!-- Cookie Consent Banner -->
<script src="https://cdn.jsdelivr.net/npm/cookieconsent@3/build/cookieconsent.min.js"></script>
<script>
window.cookieconsent.initialise({
  palette: { popup: { background: "#1d1d1d" }, button: { background: "#f59e0b" }},
  content: { message: "We use cookies to enhance your experience.", dismiss: "Got it!" }
});
</script>` },
  ],
  css: [
    { name: "Smooth Scroll", code: `/* Smooth Scroll Behavior */
html {
  scroll-behavior: smooth;
}

/* Offset for fixed header */
:target {
  scroll-margin-top: 80px;
}` },
    { name: "Custom Scrollbar", code: `/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}` },
    { name: "Text Selection", code: `/* Custom Text Selection */
::selection {
  background-color: #f59e0b;
  color: #ffffff;
}

::-moz-selection {
  background-color: #f59e0b;
  color: #ffffff;
}` },
    { name: "Focus Styles", code: `/* Accessible Focus Styles */
*:focus-visible {
  outline: 2px solid #f59e0b;
  outline-offset: 2px;
}

button:focus-visible,
a:focus-visible {
  outline: 2px solid #f59e0b;
  outline-offset: 2px;
  border-radius: 4px;
}` },
  ],
  js: [
    { name: "Console Welcome", code: `// Console Welcome Message
console.log('%c✨ Just Empower', 'font-size: 24px; font-weight: bold; color: #f59e0b;');
console.log('%cCatalyzing The Rise of Her', 'font-size: 14px; color: #78716c;');` },
    { name: "Scroll to Top", code: `// Scroll to Top Button
document.addEventListener('DOMContentLoaded', function() {
  const scrollBtn = document.createElement('button');
  scrollBtn.innerHTML = '↑';
  scrollBtn.className = 'scroll-to-top';
  scrollBtn.style.cssText = 'position:fixed;bottom:20px;right:20px;width:40px;height:40px;border-radius:50%;background:#f59e0b;color:white;border:none;cursor:pointer;opacity:0;transition:opacity 0.3s;z-index:999;';
  document.body.appendChild(scrollBtn);
  
  window.addEventListener('scroll', function() {
    scrollBtn.style.opacity = window.scrollY > 300 ? '1' : '0';
  });
  
  scrollBtn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});` },
    { name: "Lazy Load Images", code: `// Lazy Load Images
document.addEventListener('DOMContentLoaded', function() {
  const lazyImages = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.add('loaded');
        imageObserver.unobserve(img);
      }
    });
  });
  
  lazyImages.forEach(img => imageObserver.observe(img));
});` },
    { name: "External Links", code: `// Open External Links in New Tab
document.addEventListener('DOMContentLoaded', function() {
  const links = document.querySelectorAll('a[href^="http"]');
  const host = window.location.hostname;
  
  links.forEach(link => {
    if (!link.hostname.includes(host)) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
});` },
  ],
};

// Version history type
interface CodeVersion {
  id: string;
  timestamp: Date;
  type: string;
  code: string;
  label?: string;
}

export default function AdminCodeTurbo() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [activeTab, setActiveTab] = useState("header");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [codeVersions, setCodeVersions] = useState<CodeVersion[]>([]);

  // Form data for all code types
  const [formData, setFormData] = useState({
    headerCode: "",
    footerCode: "",
    customCss: "",
    customJs: "",
  });

  // Original data for change detection
  const [originalData, setOriginalData] = useState({
    headerCode: "",
    footerCode: "",
    customCss: "",
    customJs: "",
  });

  // Enable/disable toggles
  const [enabledCodes, setEnabledCodes] = useState({
    headerCode: true,
    footerCode: true,
    customCss: true,
    customJs: true,
  });

  // Queries
  const settingsQuery = trpc.admin.siteSettings.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutation
  const updateSettingMutation = trpc.admin.siteSettings.update.useMutation({
    onSuccess: () => {
      settingsQuery.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  // Load settings into form
  useEffect(() => {
    if (settingsQuery.data) {
      const settings = settingsQuery.data as any[];
      const getValue = (key: string) => settings.find(s => s.settingKey === key)?.settingValue || "";
      const getEnabled = (key: string) => {
        const val = settings.find(s => s.settingKey === `${key}_enabled`)?.settingValue;
        return val !== "false";
      };

      const newData = {
        headerCode: getValue("customHeaderCode"),
        footerCode: getValue("customFooterCode"),
        customCss: getValue("customCss"),
        customJs: getValue("customJs"),
      };

      setFormData(newData);
      setOriginalData(newData);
      setEnabledCodes({
        headerCode: getEnabled("customHeaderCode"),
        footerCode: getEnabled("customFooterCode"),
        customCss: getEnabled("customCss"),
        customJs: getEnabled("customJs"),
      });
    }
  }, [settingsQuery.data]);

  // Detect changes
  useEffect(() => {
    const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasChanges(changed);
  }, [formData, originalData]);

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  // Save all code
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save code versions for history
      const now = new Date();
      const newVersions: CodeVersion[] = [];

      if (formData.headerCode !== originalData.headerCode) {
        newVersions.push({ id: `h-${Date.now()}`, timestamp: now, type: "header", code: originalData.headerCode });
      }
      if (formData.footerCode !== originalData.footerCode) {
        newVersions.push({ id: `f-${Date.now()}`, timestamp: now, type: "footer", code: originalData.footerCode });
      }
      if (formData.customCss !== originalData.customCss) {
        newVersions.push({ id: `c-${Date.now()}`, timestamp: now, type: "css", code: originalData.customCss });
      }
      if (formData.customJs !== originalData.customJs) {
        newVersions.push({ id: `j-${Date.now()}`, timestamp: now, type: "js", code: originalData.customJs });
      }

      if (newVersions.length > 0) {
        setCodeVersions(prev => [...newVersions, ...prev].slice(0, 20));
      }

      // Save all settings
      await Promise.all([
        updateSettingMutation.mutateAsync({ settingKey: "customHeaderCode", settingValue: formData.headerCode }),
        updateSettingMutation.mutateAsync({ settingKey: "customFooterCode", settingValue: formData.footerCode }),
        updateSettingMutation.mutateAsync({ settingKey: "customCss", settingValue: formData.customCss }),
        updateSettingMutation.mutateAsync({ settingKey: "customJs", settingValue: formData.customJs }),
        updateSettingMutation.mutateAsync({ settingKey: "customHeaderCode_enabled", settingValue: String(enabledCodes.headerCode) }),
        updateSettingMutation.mutateAsync({ settingKey: "customFooterCode_enabled", settingValue: String(enabledCodes.footerCode) }),
        updateSettingMutation.mutateAsync({ settingKey: "customCss_enabled", settingValue: String(enabledCodes.customCss) }),
        updateSettingMutation.mutateAsync({ settingKey: "customJs_enabled", settingValue: String(enabledCodes.customJs) }),
      ]);

      setOriginalData(formData);
      toast.success("All code saved successfully!");
    } catch (e: any) {
      toast.error("Failed to save: " + e.message);
    }
    setIsSaving(false);
  };

  // Insert snippet
  const insertSnippet = (code: string) => {
    const key = activeTab === "header" ? "headerCode" : activeTab === "footer" ? "footerCode" : activeTab === "css" ? "customCss" : "customJs";
    setFormData(prev => ({
      ...prev,
      [key]: prev[key as keyof typeof prev] + (prev[key as keyof typeof prev] ? "\n\n" : "") + code,
    }));
    setShowSnippets(false);
    toast.success("Snippet inserted");
  };

  // Restore version
  const restoreVersion = (version: CodeVersion) => {
    const key = version.type === "header" ? "headerCode" : version.type === "footer" ? "footerCode" : version.type === "css" ? "customCss" : "customJs";
    setFormData(prev => ({ ...prev, [key]: version.code }));
    setShowHistory(false);
    toast.success(`Restored ${version.type} code from ${formatDistanceToNow(version.timestamp, { addSuffix: true })}`);
  };

  // Copy code
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copied to clipboard");
  };

  // Download code
  const downloadCode = () => {
    const allCode = {
      headerCode: formData.headerCode,
      footerCode: formData.footerCode,
      customCss: formData.customCss,
      customJs: formData.customJs,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(allCode, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `custom-code-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    toast.success("Code exported");
  };

  // Stats
  const stats = useMemo(() => ({
    headerLines: formData.headerCode.split("\n").filter(l => l.trim()).length,
    footerLines: formData.footerCode.split("\n").filter(l => l.trim()).length,
    cssLines: formData.customCss.split("\n").filter(l => l.trim()).length,
    jsLines: formData.customJs.split("\n").filter(l => l.trim()).length,
    totalChars: formData.headerCode.length + formData.footerCode.length + formData.customCss.length + formData.customJs.length,
  }), [formData]);

  // Get current snippets
  const currentSnippets = CODE_SNIPPETS[activeTab as keyof typeof CODE_SNIPPETS] || [];

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-stone-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
      </div>
    );
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
                <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                  Custom Code
                </h1>
                <p className="text-stone-500 text-sm">Add tracking, analytics, custom styles, and scripts</p>
              </div>
              <div className="flex items-center gap-3">
                {hasChanges && (
                  <Badge className="bg-amber-100 text-amber-700 animate-pulse">Unsaved changes</Badge>
                )}
                <Button variant="outline" size="sm" onClick={() => window.location.href = "/admin/source-editor"}>
                  <Terminal className="w-4 h-4 mr-2" />
                  Source Editor
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowHistory(true)} disabled={codeVersions.length === 0}>
                  <History className="w-4 h-4 mr-2" />
                  History
                </Button>
                <Button variant="outline" size="sm" onClick={downloadCode}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={() => settingsQuery.refetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save All
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Header", lines: stats.headerLines, icon: Globe, color: "blue", enabled: enabledCodes.headerCode },
              { label: "Footer", lines: stats.footerLines, icon: FileCode, color: "purple", enabled: enabledCodes.footerCode },
              { label: "CSS", lines: stats.cssLines, icon: Palette, color: "pink", enabled: enabledCodes.customCss },
              { label: "JavaScript", lines: stats.jsLines, icon: Braces, color: "amber", enabled: enabledCodes.customJs },
              { label: "Total", lines: stats.totalChars, icon: Terminal, color: "emerald", enabled: true, isChars: true },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`border-${stat.color}-200/50 ${!stat.enabled ? "opacity-50" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs font-medium text-${stat.color}-600 uppercase tracking-wide`}>{stat.label}</p>
                        <p className={`text-xl font-bold text-stone-900 mt-1`}>
                          {stat.lines}{stat.isChars ? " chars" : " lines"}
                        </p>
                      </div>
                      <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Warning Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  <strong>Security Notice:</strong> Custom code is injected directly into your site. Only add code from trusted sources.
                  Malicious code can compromise your site and user data.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList className="grid grid-cols-4 w-auto">
                <TabsTrigger value="header" className="gap-2">
                  <Globe className="w-4 h-4" />
                  Header
                  {stats.headerLines > 0 && <Badge variant="secondary" className="ml-1">{stats.headerLines}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="footer" className="gap-2">
                  <FileCode className="w-4 h-4" />
                  Footer
                  {stats.footerLines > 0 && <Badge variant="secondary" className="ml-1">{stats.footerLines}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="css" className="gap-2">
                  <Palette className="w-4 h-4" />
                  CSS
                  {stats.cssLines > 0 && <Badge variant="secondary" className="ml-1">{stats.cssLines}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="js" className="gap-2">
                  <Braces className="w-4 h-4" />
                  JavaScript
                  {stats.jsLines > 0 && <Badge variant="secondary" className="ml-1">{stats.jsLines}</Badge>}
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <DropdownMenu open={showSnippets} onOpenChange={setShowSnippets}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Zap className="w-4 h-4 mr-2" />
                      Snippets
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    {currentSnippets.length > 0 ? (
                      currentSnippets.map((snippet, i) => (
                        <DropdownMenuItem key={i} onClick={() => insertSnippet(snippet.code)}>
                          <Plus className="w-4 h-4 mr-2" />
                          {snippet.name}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="px-2 py-4 text-center text-stone-500 text-sm">
                        No snippets for this tab
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Header Code Tab */}
            <TabsContent value="header" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-600" />
                        Header Code
                      </CardTitle>
                      <CardDescription>Injected before &lt;/head&gt; - tracking codes, meta tags, fonts</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={enabledCodes.headerCode}
                          onCheckedChange={(v) => setEnabledCodes(prev => ({ ...prev, headerCode: v }))}
                        />
                        <Label className="text-sm">Enabled</Label>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyCode(formData.headerCode)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.headerCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, headerCode: e.target.value }))}
                    rows={16}
                    className="font-mono text-sm bg-stone-900 text-green-400 border-stone-700"
                    placeholder="<!-- Add tracking codes, meta tags, fonts, etc. -->"
                    disabled={!enabledCodes.headerCode}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Footer Code Tab */}
            <TabsContent value="footer" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileCode className="w-5 h-5 text-purple-600" />
                        Footer Code
                      </CardTitle>
                      <CardDescription>Injected before &lt;/body&gt; - chat widgets, scripts</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={enabledCodes.footerCode}
                          onCheckedChange={(v) => setEnabledCodes(prev => ({ ...prev, footerCode: v }))}
                        />
                        <Label className="text-sm">Enabled</Label>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyCode(formData.footerCode)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.footerCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, footerCode: e.target.value }))}
                    rows={16}
                    className="font-mono text-sm bg-stone-900 text-green-400 border-stone-700"
                    placeholder="<!-- Add scripts, chat widgets, etc. -->"
                    disabled={!enabledCodes.footerCode}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* CSS Tab */}
            <TabsContent value="css" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="w-5 h-5 text-pink-600" />
                        Custom CSS
                      </CardTitle>
                      <CardDescription>Custom styles applied globally to your site</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={enabledCodes.customCss}
                          onCheckedChange={(v) => setEnabledCodes(prev => ({ ...prev, customCss: v }))}
                        />
                        <Label className="text-sm">Enabled</Label>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyCode(formData.customCss)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.customCss}
                    onChange={(e) => setFormData(prev => ({ ...prev, customCss: e.target.value }))}
                    rows={16}
                    className="font-mono text-sm bg-stone-900 text-pink-400 border-stone-700"
                    placeholder="/* Custom CSS styles */"
                    disabled={!enabledCodes.customCss}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* JavaScript Tab */}
            <TabsContent value="js" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Braces className="w-5 h-5 text-amber-600" />
                        Custom JavaScript
                      </CardTitle>
                      <CardDescription>Custom scripts executed after page load</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={enabledCodes.customJs}
                          onCheckedChange={(v) => setEnabledCodes(prev => ({ ...prev, customJs: v }))}
                        />
                        <Label className="text-sm">Enabled</Label>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyCode(formData.customJs)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.customJs}
                    onChange={(e) => setFormData(prev => ({ ...prev, customJs: e.target.value }))}
                    rows={16}
                    className="font-mono text-sm bg-stone-900 text-amber-400 border-stone-700"
                    placeholder="// Custom JavaScript code"
                    disabled={!enabledCodes.customJs}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* History Dialog */}
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                Code History
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-96">
              {codeVersions.length === 0 ? (
                <div className="py-8 text-center text-stone-500">
                  <History className="w-12 h-12 mx-auto text-stone-300 mb-3" />
                  <p>No history yet</p>
                  <p className="text-sm">Previous versions will appear here after saving changes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {codeVersions.map((version) => (
                    <div
                      key={version.id}
                      className="p-3 border rounded-lg hover:bg-stone-50 cursor-pointer"
                      onClick={() => restoreVersion(version)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{version.type}</Badge>
                          <span className="text-sm text-stone-600">
                            {formatDistanceToNow(version.timestamp, { addSuffix: true })}
                          </span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Undo2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-stone-500 mt-1 font-mono truncate">
                        {version.code.substring(0, 80)}...
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowHistory(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
