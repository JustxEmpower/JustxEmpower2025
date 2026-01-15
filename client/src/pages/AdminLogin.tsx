import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { getMediaUrl } from '@/lib/media';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch brand assets for logo using the correct endpoint
  const { data: brandAssets } = trpc.siteSettings.getBrandAssets.useQuery();
  
  // Get logo URL from brand assets, with fallback
  const logoUrl = brandAssets?.logo_black || brandAssets?.logo || '';

  const loginMutation = trpc.admin.login.useMutation({
    onSuccess: (data) => {
      // Store admin token in localStorage
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUsername', data.username);
      toast.success('Welcome back');
      setLocation('/admin/dashboard');
    },
    onError: (error) => {
      toast.error(error.message || 'Invalid credentials');
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    loginMutation.mutate({ username, password });
  };

  // Helper to get proper media URL
  const getProperMediaUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : getMediaUrl(url);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="w-full max-w-md px-8">
        {/* Logo / Brand */}
        <div className="text-center mb-12">
          {logoUrl ? (
            <img
              src={getProperMediaUrl(logoUrl)}
              alt="Just Empower"
              className="h-16 mx-auto mb-6"
            />
          ) : (
            <div className="h-16 mx-auto mb-6 flex items-center justify-center">
              <span className="text-2xl font-serif italic text-neutral-900 dark:text-neutral-100">Just Empower</span>
            </div>
          )}
          <h1 className="text-2xl font-light text-neutral-900 dark:text-neutral-100 tracking-tight">
            Admin Portal
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 font-light">
            Content Management System
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-neutral-200/50 dark:border-neutral-800/50">
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-12 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
                  placeholder="Enter username"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
                  placeholder="Enter password"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-8 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all duration-200 rounded-xl font-medium"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-400 dark:text-neutral-600 mt-8 font-light">
          © 2025 Just Empower™. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
