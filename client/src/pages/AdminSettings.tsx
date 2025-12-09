import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { LogOut, FileText, Settings, Layout, ArrowLeft } from 'lucide-react';

export default function AdminSettings() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking, username, logout } = useAdminAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [newUsername, setNewUsername] = useState('');
  const [usernamePassword, setUsernamePassword] = useState('');
  
  const [mailchimpApiKey, setMailchimpApiKey] = useState('');
  const [mailchimpAudienceId, setMailchimpAudienceId] = useState('');
  
  // Fetch current settings
  const { data: settings } = trpc.admin.getSettings.useQuery();
  
  // Populate form when settings load
  useEffect(() => {
    if (settings) {
      setMailchimpApiKey(settings.mailchimpApiKey || '');
      setMailchimpAudienceId(settings.mailchimpAudienceId || '');
    }
  }, [settings]);
  
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
      // Reload to update the username display
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
    
    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const handleUsernameChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newUsername.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    
    changeUsernameMutation.mutate({
      newUsername,
      password: usernamePassword,
    });
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation('/admin/login');
    return null;
  }

  const navItems = [
    { icon: Layout, label: 'Content', path: '/admin/content' },
    { icon: FileText, label: 'Articles', path: '/admin/articles' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <img
            src="/media/logo-white.png"
            alt="Just Empower"
            className="h-10 opacity-90"
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-light">
            Admin Portal
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {username}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Administrator
              </p>
            </div>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            className="w-full justify-start gap-2"
            size="sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-3xl mx-auto">
            <Button
              onClick={() => setLocation('/admin/dashboard')}
              variant="ghost"
              className="mb-6 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>

            <h1 className="text-3xl font-light text-neutral-900 dark:text-neutral-100 mb-2">
              Settings
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">
              Manage your account security and preferences
            </p>

            {/* Change Password */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 mb-6">
              <h2 className="text-xl font-light text-neutral-900 dark:text-neutral-100 mb-4">
                Change Password
              </h2>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="w-full h-11"
                >
                  {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </div>

            {/* Change Username */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 mb-6">
              <h2 className="text-xl font-light text-neutral-900 dark:text-neutral-100 mb-4">
                Change Username
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                Current username: <span className="font-medium">{username}</span>
              </p>
              <form onSubmit={handleUsernameChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    New Username
                  </label>
                  <Input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    minLength={3}
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    value={usernamePassword}
                    onChange={(e) => setUsernamePassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={changeUsernameMutation.isPending}
                  className="w-full h-11"
                >
                  {changeUsernameMutation.isPending ? 'Updating...' : 'Update Username'}
                </Button>
              </form>
            </div>

            {/* Mailchimp Configuration */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800">
              <h2 className="text-xl font-light text-neutral-900 dark:text-neutral-100 mb-2">
                Mailchimp Integration
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                Connect your Mailchimp account to enable newsletter subscriptions
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Mailchimp API Key
                  </label>
                  <Input
                    type="text"
                    value={mailchimpApiKey}
                    onChange={(e) => setMailchimpApiKey(e.target.value)}
                    placeholder="Enter your Mailchimp API key"
                    className="h-11 font-mono text-sm"
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Find this in your Mailchimp account under Account → Extras → API keys
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Audience ID (List ID)
                  </label>
                  <Input
                    type="text"
                    value={mailchimpAudienceId}
                    onChange={(e) => setMailchimpAudienceId(e.target.value)}
                    placeholder="Enter your Mailchimp Audience ID"
                    className="h-11 font-mono text-sm"
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Find this in Mailchimp under Audience → Settings → Audience name and defaults
                  </p>
                </div>
                <Button
                  onClick={() => {
                    if (!mailchimpApiKey || !mailchimpAudienceId) {
                      toast.error('Please fill in both fields');
                      return;
                    }
                    
                    updateMailchimpMutation.mutate({
                      apiKey: mailchimpApiKey,
                      audienceId: mailchimpAudienceId,
                    });
                  }}
                  disabled={updateMailchimpMutation.isPending}
                  className="w-full h-11"
                >
                  {updateMailchimpMutation.isPending ? 'Saving...' : 'Save Mailchimp Settings'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
