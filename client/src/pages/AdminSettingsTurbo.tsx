/**
 * Turbo-Charged Admin Settings Page
 * Features: Gemini API key management, Mailchimp integration, account settings
 * All secrets stored in RDS database via siteSettings table
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { 
  Settings, 
  Key, 
  Mail, 
  Brain, 
  Shield, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  RefreshCw,
  Zap,
  Database,
  ArrowLeft,
  Sparkles,
  TestTube,
  Lock,
  Unlock,
  Save,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminSettingsTurbo() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isChecking, username, logout } = useAdminAuth();
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Username change state
  const [newUsername, setNewUsername] = useState('');
  const [usernamePassword, setUsernamePassword] = useState('');
  
  // API Keys state
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<'unknown' | 'testing' | 'connected' | 'error'>('unknown');
  
  const [mailchimpApiKey, setMailchimpApiKey] = useState('');
  const [mailchimpAudienceId, setMailchimpAudienceId] = useState('');
  const [showMailchimpKey, setShowMailchimpKey] = useState(false);
  
  // Fetch current settings
  const { data: settings, refetch: refetchSettings } = trpc.admin.getSettings.useQuery();
  
  // Populate form when settings load - show masked values for existing keys
  useEffect(() => {
    if (settings) {
      // Show masked Mailchimp key if it exists
      if (settings.mailchimpApiKey) {
        setMailchimpApiKey(settings.mailchimpApiKeyMasked || settings.mailchimpApiKey);
      }
      setMailchimpAudienceId(settings.mailchimpAudienceId || '');
      // Show masked Gemini key if it exists
      if (settings.geminiApiKey) {
        setGeminiApiKey(settings.geminiApiKeyMasked || '••••••••••••');
        setGeminiStatus('connected');
      }
    }
  }, [settings]);
  
  // Mutations
  const saveGeminiKeyMutation = trpc.admin.siteSettings.saveGeminiKey.useMutation({
    onSuccess: () => {
      toast.success('Gemini API key saved successfully!');
      refetchSettings();
      setGeminiStatus('connected');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save Gemini API key');
      setGeminiStatus('error');
    },
  });
  
  // Check if the value is a masked key (starts with **** or contains only dots)
  const isGeminiKeyMasked = geminiApiKey.startsWith('****') || geminiApiKey.match(/^[•]+$/);
  const isMailchimpKeyMasked = mailchimpApiKey.startsWith('****');

  const testGeminiMutation = trpc.admin.siteSettings.testGeminiConnection.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message || 'Connection successful!');
        setGeminiStatus('connected');
      } else {
        toast.error(result.error || 'Connection failed');
        setGeminiStatus('error');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Connection test failed');
      setGeminiStatus('error');
    },
  });
  
  const updateMailchimpMutation = trpc.newsletter.updateSettings.useMutation({
    onSuccess: () => {
      toast.success('Mailchimp settings saved successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save settings');
    },
  });

  const changePasswordMutation = trpc.admin.changePassword.useMutation({
    onSuccess: () => {
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update password');
    },
  });

  const changeUsernameMutation = trpc.admin.changeUsername.useMutation({
    onSuccess: (data) => {
      toast.success('Username updated successfully');
      localStorage.setItem('adminUsername', data.newUsername);
      setNewUsername('');
      setUsernamePassword('');
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update username');
    },
  });

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const handleUsernameChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUsername.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    changeUsernameMutation.mutate({ newUsername, password: usernamePassword });
  };

  const handleSaveGeminiKey = () => {
    if (!geminiApiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }
    // Don't save masked values
    if (isGeminiKeyMasked) {
      toast.info('Key is already saved. Enter a new key to update.');
      return;
    }
    saveGeminiKeyMutation.mutate({ apiKey: geminiApiKey });
  };

  const handleTestGemini = () => {
    setGeminiStatus('testing');
    testGeminiMutation.mutate();
  };

  const handleSaveMailchimp = () => {
    if (!mailchimpApiKey || !mailchimpAudienceId) {
      toast.error('Please fill in both Mailchimp fields');
      return;
    }
    // Don't save if only the API key is masked (audience ID can be visible)
    if (isMailchimpKeyMasked) {
      toast.info('API key is already saved. Enter a new key to update.');
      return;
    }
    updateMailchimpMutation.mutate({
      apiKey: mailchimpApiKey,
      audienceId: mailchimpAudienceId,
    });
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
          <p className="text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate('/admin/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 flex">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-stone-200">
          <div className="px-6 py-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/admin/dashboard')}
              className="mb-3 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Settings</h1>
                <p className="text-sm text-stone-500">Manage API connections, integrations, and account security</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-5xl mx-auto">
          <Tabs defaultValue="integrations" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
              <TabsTrigger value="integrations" className="gap-2">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Integrations</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="database" className="gap-2">
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Database</span>
              </TabsTrigger>
            </TabsList>

            {/* Integrations Tab */}
            <TabsContent value="integrations" className="space-y-6">
              {/* Gemini AI Integration */}
              <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-200">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Google Gemini AI
                          {geminiStatus === 'connected' && (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Connected
                            </Badge>
                          )}
                          {geminiStatus === 'error' && (
                            <Badge variant="destructive">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Error
                            </Badge>
                          )}
                          {geminiStatus === 'testing' && (
                            <Badge variant="secondary">
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              Testing...
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          Powers AI page generation, content creation, and Aria assistant
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">API Key</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showGeminiKey ? 'text' : 'password'}
                          value={geminiApiKey}
                          onChange={(e) => setGeminiApiKey(e.target.value)}
                          placeholder={settings?.geminiApiKeyMasked || 'Enter your Gemini API key'}
                          className="pr-10 font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowGeminiKey(!showGeminiKey)}
                        >
                          {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      <Button
                        onClick={handleSaveGeminiKey}
                        disabled={saveGeminiKeyMutation.isPending || !geminiApiKey.trim()}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        {saveGeminiKeyMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span className="ml-2">Save</span>
                      </Button>
                    </div>
                    <p className="text-xs text-stone-500">
                      Get your API key from{' '}
                      <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:underline"
                      >
                        Google AI Studio
                      </a>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTestGemini}
                      disabled={testGeminiMutation.isPending}
                    >
                      {testGeminiMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4 mr-2" />
                      )}
                      Test Connection
                    </Button>
                    {settings?.geminiApiKeyMasked && (
                      <span className="text-xs text-stone-500">
                        Current key: <code className="bg-stone-100 px-1.5 py-0.5 rounded">{settings.geminiApiKeyMasked}</code>
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Mailchimp Integration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-orange-200">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>Mailchimp</CardTitle>
                      <CardDescription>
                        Newsletter subscriptions and email marketing automation
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">API Key</Label>
                      <div className="relative">
                        <Input
                          type={showMailchimpKey ? 'text' : 'password'}
                          value={mailchimpApiKey}
                          onChange={(e) => setMailchimpApiKey(e.target.value)}
                          placeholder="Enter Mailchimp API key"
                          className="pr-10 font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowMailchimpKey(!showMailchimpKey)}
                        >
                          {showMailchimpKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-stone-500">
                        Account → Extras → API keys
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Audience ID</Label>
                      <Input
                        type="text"
                        value={mailchimpAudienceId}
                        onChange={(e) => setMailchimpAudienceId(e.target.value)}
                        placeholder="Enter Audience ID"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-stone-500">
                        Audience → Settings → Audience name and defaults
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleSaveMailchimp}
                    disabled={updateMailchimpMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {updateMailchimpMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Mailchimp Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              {/* Change Password */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-200">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>Change Password</CardTitle>
                      <CardDescription>
                        Update your admin account password
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Current Password</Label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>New Password</Label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={8}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Confirm New Password</Label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {changePasswordMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Shield className="w-4 h-4 mr-2" />
                      )}
                      Update Password
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Change Username */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-200">
                      <Key className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>Change Username</CardTitle>
                      <CardDescription>
                        Current username: <span className="font-medium text-stone-900">{username}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUsernameChange} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>New Username</Label>
                        <Input
                          type="text"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          required
                          minLength={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Confirm Password</Label>
                        <Input
                          type="password"
                          value={usernamePassword}
                          onChange={(e) => setUsernamePassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={changeUsernameMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {changeUsernameMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Unlock className="w-4 h-4 mr-2" />
                      )}
                      Update Username
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Database Tab */}
            <TabsContent value="database" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-200">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>Database Connection</CardTitle>
                      <CardDescription>
                        All settings are stored securely in the RDS database
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Database Connected</p>
                        <p className="text-sm text-green-600">All API keys and settings are synced to the database</p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="p-4 bg-stone-50 rounded-lg">
                        <p className="text-sm font-medium text-stone-600 mb-1">Settings Table</p>
                        <p className="text-lg font-bold text-stone-900">siteSettings</p>
                        <p className="text-xs text-stone-500 mt-1">Stores API keys, integrations, and configuration</p>
                      </div>
                      <div className="p-4 bg-stone-50 rounded-lg">
                        <p className="text-sm font-medium text-stone-600 mb-1">Admin Table</p>
                        <p className="text-lg font-bold text-stone-900">adminUsers</p>
                        <p className="text-xs text-stone-500 mt-1">Stores account credentials and preferences</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium text-stone-700 mb-3">How It Works</h4>
                      <ul className="space-y-2 text-sm text-stone-600">
                        <li className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500 mt-0.5" />
                          <span>API keys are stored securely in the database, not environment variables</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500 mt-0.5" />
                          <span>Changes take effect immediately without server restart</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500 mt-0.5" />
                          <span>Gemini key is automatically loaded when AI features are used</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
