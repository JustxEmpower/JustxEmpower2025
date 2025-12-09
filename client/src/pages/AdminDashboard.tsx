import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { LogOut, FileText, Settings, Layout, FolderOpen } from 'lucide-react';

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking, username, logout } = useAdminAuth();

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation('/admin/login');
    }
  }, [isAuthenticated, isChecking, setLocation]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { icon: Layout, label: 'Content', path: '/admin/content' },
    { icon: FileText, label: 'Articles', path: '/admin/articles' },
    { icon: FolderOpen, label: 'Media', path: '/admin/media' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <img
            src="/media/logo-mono-white.png"
            alt="Just Empower"
            className="h-10 opacity-90"
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-light">
            Admin Portal
          </p>
        </div>

        {/* Navigation */}
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

        {/* User & Logout */}
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
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-light text-neutral-900 dark:text-neutral-100 mb-2">
              Welcome back, {username}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">
              Manage your website content, articles, and settings from here.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                  Total Articles
                </p>
                <p className="text-3xl font-light text-neutral-900 dark:text-neutral-100">
                  3
                </p>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                  Content Sections
                </p>
                <p className="text-3xl font-light text-neutral-900 dark:text-neutral-100">
                  18
                </p>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                  Last Updated
                </p>
                <p className="text-3xl font-light text-neutral-900 dark:text-neutral-100">
                  Today
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800">
              <h2 className="text-xl font-light text-neutral-900 dark:text-neutral-100 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-4 gap-4">
                <Button
                  onClick={() => setLocation('/admin/content')}
                  variant="outline"
                  className="h-24 flex-col gap-2"
                >
                  <Layout className="w-6 h-6" />
                  <span>Edit Content</span>
                </Button>
                <Button
                  onClick={() => setLocation('/admin/articles')}
                  variant="outline"
                  className="h-24 flex-col gap-2"
                >
                  <FileText className="w-6 h-6" />
                  <span>Manage Articles</span>
                </Button>
                <Button
                  onClick={() => setLocation('/admin/media')}
                  variant="outline"
                  className="h-24 flex-col gap-2"
                >
                  <FolderOpen className="w-6 h-6" />
                  <span>Media Library</span>
                </Button>
                <Button
                  onClick={() => setLocation('/admin/settings')}
                  variant="outline"
                  className="h-24 flex-col gap-2"
                >
                  <Settings className="w-6 h-6" />
                  <span>Settings</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
