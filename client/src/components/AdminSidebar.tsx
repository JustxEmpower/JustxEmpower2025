import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getMediaUrl } from '@/lib/media';
import { Button } from '@/components/ui/button';
import {
  Layout,
  FileText,
  Settings,
  FolderOpen,
  Palette,
  BarChart3,
  LogOut,
  Files,
  Users,
  Briefcase,
  Search,
  Menu,
  FormInput,
  Link as LinkIcon,
  Code,
  Database,
  Home,
  ShoppingBag,
  Package,
  ShoppingCart,
  Star,
  Tag,
  Calendar,
  UserCheck,
  DollarSign,
  CreditCard,
  TrendingUp,
  FileDown,
  Mail,
  Images,
  Blocks,
  Brain,
  ArrowLeft,
  LayoutDashboard,
  Layers,
  Box,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
} from 'lucide-react';

// Complete list of all admin navigation items matching the original design
const navItems = [
  { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: Layout, label: 'Content', path: '/admin/content' },
  { icon: Images, label: 'Carousel Manager', path: '/admin/carousels' },
  { icon: FileText, label: 'Articles', path: '/admin/articles' },
  { icon: FolderOpen, label: 'Media', path: '/admin/media' },
  { icon: Blocks, label: 'Page Builder', path: '/admin/page-builder' },
  { icon: Layers, label: 'Page Zones', path: '/admin/zones' },
  { icon: Box, label: 'Block Store', path: '/admin/block-store' },
  // E-commerce / Shop section
  { icon: Package, label: 'Products', path: '/admin/products' },
  { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
  { icon: Star, label: 'Reviews', path: '/admin/reviews' },
  { icon: Tag, label: 'Categories', path: '/admin/categories' },
  // Events section
  { icon: Calendar, label: 'Events', path: '/admin/events' },
  { icon: UserCheck, label: 'Attendees', path: '/admin/attendees' },
  // Resources / Document Library
  { icon: FileDown, label: 'Resources', path: '/admin/resources' },
  // Financial section
  { icon: DollarSign, label: 'Revenue', path: '/admin/revenue' },
  { icon: CreditCard, label: 'Payments', path: '/admin/payments' },
  { icon: TrendingUp, label: 'Financial Analytics', path: '/admin/financial-analytics' },
  // User management
  { icon: Users, label: 'Users', path: '/admin/users' },
  // Design & Branding
  { icon: Palette, label: 'Theme', path: '/admin/theme' },
  { icon: Briefcase, label: 'Brand', path: '/admin/brand' },
  // SEO & Navigation
  { icon: Search, label: 'SEO', path: '/admin/seo' },
  { icon: Menu, label: 'Navigation', path: '/admin/navigation' },
  { icon: FormInput, label: 'Forms', path: '/admin/forms' },
  { icon: Mail, label: 'Messages', path: '/admin/messages' },
  { icon: LinkIcon, label: 'Redirects', path: '/admin/redirects' },
  // Advanced
  { icon: Code, label: 'Custom Code', path: '/admin/code' },
  { icon: Database, label: 'Backup', path: '/admin/backup' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
  { icon: Brain, label: 'AI Training', path: '/admin/ai-training' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

interface AdminSidebarProps {
  variant?: 'light' | 'dark';
}

export default function AdminSidebar({ variant = 'dark' }: AdminSidebarProps) {
  const [location, setLocation] = useLocation();
  const { username, logout } = useAdminAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const isDark = variant === 'dark';
  const showExpanded = isExpanded || isPinned;

  return (
    <>
      {/* Collapsed sidebar - always visible */}
      <aside 
        className={`fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300 ease-in-out ${
          showExpanded ? 'w-64' : 'w-16'
        } ${
          isDark 
            ? 'bg-stone-900 text-stone-100' 
            : 'bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800'
        }`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Header */}
        <div className={`p-4 ${isDark ? 'mb-2' : 'border-b border-neutral-200 dark:border-neutral-800'} flex items-center justify-between`}>
          {showExpanded ? (
            <div className="flex items-center justify-between w-full">
              <div>
                {isDark ? (
                  <>
                    <h1 className="text-xl font-serif whitespace-nowrap">Just Empower</h1>
                    <p className="text-xs text-stone-400">Admin Portal</p>
                  </>
                ) : (
                  <>
                    <img
                      src={getMediaUrl('/media/logo-white.png')}
                      alt="Just Empower"
                      className="h-8 opacity-90"
                    />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-light">
                      Admin Portal
                    </p>
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPinned(!isPinned)}
                className={`${isDark ? 'text-stone-400 hover:text-white hover:bg-stone-800' : 'text-neutral-500 hover:text-neutral-900'}`}
                title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
              >
                {isPinned ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
              </Button>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-stone-800' : 'bg-neutral-100'}`}>
                <Menu className="w-5 h-5" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${showExpanded ? (isDark ? 'space-y-1 px-3' : 'p-3 space-y-1') : 'px-2 space-y-1'}`}>
          {/* Back to Dashboard button - show on all pages except dashboard */}
          {location !== '/admin' && location !== '/admin/dashboard' && (
            <button
              onClick={() => setLocation('/admin/dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all mb-3 ${
                showExpanded ? '' : 'justify-center'
              } ${
                isDark
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-md'
              }`}
              title={showExpanded ? '' : 'Back to Dashboard'}
            >
              <ArrowLeft className="w-5 h-5 flex-shrink-0" />
              {showExpanded && <span className="font-medium whitespace-nowrap">Back to Dashboard</span>}
            </button>
          )}
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path || 
              (item.path === '/admin/dashboard' && location === '/admin');
            
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  showExpanded ? '' : 'justify-center'
                } ${
                  isDark
                    ? isActive
                      ? 'bg-amber-600 text-white'
                      : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                    : isActive
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
                title={showExpanded ? '' : item.label}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {showExpanded && <span className={`${isDark ? '' : 'font-medium text-sm'} truncate whitespace-nowrap`}>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`p-3 ${isDark ? 'mt-auto pt-3 border-t border-stone-800' : 'border-t border-neutral-200 dark:border-neutral-800'}`}>
          {showExpanded ? (
            isDark ? (
              <>
                <div className="px-3 py-2 text-xs text-stone-400">
                  Logged in as <span className="text-stone-200 font-medium">{username}</span>
                </div>
                <Button
                  onClick={logout}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-stone-300 hover:text-white hover:bg-stone-800"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
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
              </>
            )
          ) : (
            <button
              onClick={logout}
              className={`w-full flex justify-center p-2.5 rounded-lg transition-colors ${
                isDark
                  ? 'text-stone-400 hover:bg-stone-800 hover:text-white'
                  : 'text-neutral-500 hover:bg-neutral-100'
              }`}
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Spacer div to push content */}
      <div className={`flex-shrink-0 transition-all duration-300 ${isPinned ? 'w-64' : 'w-16'}`} />
    </>
  );
}

// Export navItems for use in other components if needed
export { navItems };
