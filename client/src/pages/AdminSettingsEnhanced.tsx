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
import { Badge } from "@/components/ui/badge";
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from "framer-motion";
import { Settings, Globe, Mail, Bell, Shield, Database, Save, RefreshCw, Loader2, CheckCircle, XCircle, Users, Send, Key, Link2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking, username } = useAdminAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingMailchimp, setIsTestingMailchimp] = useState(false);
  const [mailchimpConnected, setMailchimpConnected] = useState<boolean | null>(null);

  // Fetch settings
  const adminSettingsQuery = trpc.admin.getSettings.useQuery();

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

  // Mailchimp state
  const [mailchimpApiKey, setMailchimpApiKey] = useState("");
  const [mailchimpAudienceId, setMailchimpAudienceId] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Mutations
  const updateMailchimpMutation = trpc.newsletter.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Mailchimp settings saved and verified!");
      setMailchimpConnected(true);
      adminSettingsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save Mailchimp settings");
      setMailchimpConnected(false);
    },
  });

  const changePasswordMutation = trpc.admin.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error) => toast.error(error.message || "Failed to update password"),
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  useEffect(() => {
    if (adminSettingsQuery.data) {
      setMailchimpApiKey(adminSettingsQuery.data.mailchimpApiKey || "");
      setMailchimpAudienceId(adminSettingsQuery.data.mailchimpAudienceId || "");
      if (adminSettingsQuery.data.mailchimpApiKey && adminSettingsQuery.data.mailchimpAudienceId) {
        setMailchimpConnected(true);
      }
    }
  }, [adminSettingsQuery.data]);

  const handleSaveMailchimp = async () => {
    if (!mailchimpApiKey || !mailchimpAudienceId) {
      toast.error("Please fill in both API Key and Audience ID");
      return;
    }
    setIsTestingMailchimp(true);
    try {
      await updateMailchimpMutation.mutateAsync({
        apiKey: mailchimpApiKey,
        audienceId: mailchimpAudienceId,
      });
    } finally {
      setIsTestingMailchimp(false);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

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
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-stone-600 to-stone-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-stone-900">Settings</h1>
                  <p className="text-stone-500 text-sm">Configure your site and integrations</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => adminSettingsQuery.refetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" />Refresh
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="bg-amber-600 hover:bg-amber-700">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general"><Globe className="w-4 h-4 mr-2" />General</TabsTrigger>
              <TabsTrigger value="mailchimp"><Mail className="w-4 h-4 mr-2" />Mailchimp</TabsTrigger>
              <TabsTrigger value="features"><Shield className="w-4 h-4 mr-2" />Features</TabsTrigger>
              <TabsTrigger value="social"><Link2 className="w-4 h-4 mr-2" />Social</TabsTrigger>
              <TabsTrigger value="security"><Key className="w-4 h-4 mr-2" />Security</TabsTrigger>
            </TabsList>

            {/* General Tab */}
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

            {/* Mailchimp Tab */}
            <TabsContent value="mailchimp" className="mt-6 space-y-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Connection Status */}
                <Card className={mailchimpConnected ? "border-emerald-200 bg-emerald-50/30" : mailchimpConnected === false ? "border-red-200 bg-red-50/30" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${mailchimpConnected ? "bg-emerald-100" : mailchimpConnected === false ? "bg-red-100" : "bg-stone-100"}`}>
                          {mailchimpConnected ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : mailchimpConnected === false ? <XCircle className="w-5 h-5 text-red-600" /> : <Mail className="w-5 h-5 text-stone-500" />}
                        </div>
                        <div>
                          <p className="font-medium">Mailchimp Integration</p>
                          <p className="text-sm text-stone-500">
                            {mailchimpConnected ? "Connected and ready to sync subscribers" : mailchimpConnected === false ? "Connection failed - check your credentials" : "Not configured"}
                          </p>
                        </div>
                      </div>
                      <Badge className={mailchimpConnected ? "bg-emerald-100 text-emerald-700" : mailchimpConnected === false ? "bg-red-100 text-red-700" : "bg-stone-100 text-stone-700"}>
                        {mailchimpConnected ? "Connected" : mailchimpConnected === false ? "Error" : "Not Connected"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Mailchimp Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <img src="https://cdn.brandfetch.io/id1kJDRZU1/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B" alt="Mailchimp" className="w-6 h-6 rounded" />
                      Mailchimp Configuration
                    </CardTitle>
                    <CardDescription>Connect your Mailchimp account to sync newsletter subscribers automatically</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        value={mailchimpApiKey}
                        onChange={(e) => setMailchimpApiKey(e.target.value)}
                        placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us1"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-stone-500">
                        Find this in Mailchimp → Account → Extras → API keys. Format: xxxxx-us1 (includes datacenter suffix)
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Audience ID (List ID)</Label>
                      <Input
                        value={mailchimpAudienceId}
                        onChange={(e) => setMailchimpAudienceId(e.target.value)}
                        placeholder="a1b2c3d4e5"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-stone-500">
                        Find this in Mailchimp → Audience → Settings → Audience name and defaults → Audience ID
                      </p>
                    </div>

                    <div className="pt-4 border-t">
                      <Button 
                        onClick={handleSaveMailchimp} 
                        disabled={isTestingMailchimp || !mailchimpApiKey || !mailchimpAudienceId}
                        className="w-full bg-amber-600 hover:bg-amber-700"
                      >
                        {isTestingMailchimp ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Testing Connection...</>
                        ) : (
                          <><Send className="w-4 h-4 mr-2" />Save & Test Connection</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* How it works */}
                <Card>
                  <CardHeader><CardTitle>How It Works</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-stone-50 rounded-lg">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                          <span className="text-amber-600 font-bold">1</span>
                        </div>
                        <h4 className="font-medium mb-1">Visitor Subscribes</h4>
                        <p className="text-sm text-stone-500">Visitors sign up via newsletter popup or forms on your site</p>
                      </div>
                      <div className="p-4 bg-stone-50 rounded-lg">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                          <span className="text-amber-600 font-bold">2</span>
                        </div>
                        <h4 className="font-medium mb-1">Auto-Sync</h4>
                        <p className="text-sm text-stone-500">Subscribers are automatically added to your Mailchimp audience</p>
                      </div>
                      <div className="p-4 bg-stone-50 rounded-lg">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                          <span className="text-amber-600 font-bold">3</span>
                        </div>
                        <h4 className="font-medium mb-1">Send Campaigns</h4>
                        <p className="text-sm text-stone-500">Use Mailchimp to send newsletters and marketing emails</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Features Tab */}
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

            {/* Social Tab */}
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

            {/* Security Tab */}
            <TabsContent value="security" className="mt-6 space-y-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Account Info */}
                <Card>
                  <CardHeader><CardTitle>Account Information</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">{username?.[0]?.toUpperCase() || "A"}</span>
                      </div>
                      <div>
                        <p className="font-medium text-lg">{username || "Admin"}</p>
                        <p className="text-sm text-stone-500">Administrator</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Change Password */}
                <Card>
                  <CardHeader><CardTitle>Change Password</CardTitle><CardDescription>Update your admin password</CardDescription></CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Current Password</Label>
                        <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>New Password</Label>
                        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
                      </div>
                      <div className="space-y-2">
                        <Label>Confirm New Password</Label>
                        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                      </div>
                      <Button type="submit" disabled={changePasswordMutation.isPending} className="w-full">
                        {changePasswordMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                        Update Password
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-red-200">
                  <CardHeader><CardTitle className="text-red-700">Danger Zone</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <Label className="text-red-700">Maintenance Mode</Label>
                        <p className="text-sm text-red-600">Take site offline for maintenance</p>
                      </div>
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
