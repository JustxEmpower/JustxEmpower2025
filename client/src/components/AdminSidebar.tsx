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
} from 'lucide-react';

// Complete list of all admin navigation items matching the original design
const navItems = [
  { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: Layout, label: 'Content', path: '/admin/content' },
  { icon: Images, label: 'Featured Offerings', path: '/admin/carousel' },
  { icon: Images, label: 'Carousel Manager', path: '/admin/carousels' },
  { icon: FileText, label: 'Articles', path: '/admin/articles' },
  { icon: FolderOpen, label: 'Media', path: '/admin/media' },
  { icon: Files, label: 'Pages', path: '/admin/pages' },
  { icon: Blocks, label: 'Page Builder', path: '/admin/page-builder' },
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
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

interface AdminSidebarProps {
  variant?: 'light' | 'dark';
}

export default function AdminSidebar({ variant = 'dark' }: AdminSidebarProps) {
  const [location, setLocation] = useLocation();
  const { username, logout } = useAdminAuth();

  const isDark = variant === 'dark';

  return (
    <aside className={`w-64 flex flex-col ${
      isDark 
        ? 'bg-stone-900 text-stone-100' 
        : 'bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800'
    }`}>
      <div className={`p-6 ${isDark ? 'mb-2' : 'border-b border-neutral-200 dark:border-neutral-800'}`}>
        {isDark ? (
          <>
            <h1 className="text-2xl font-serif">Just Empower</h1>
            <p className="text-sm text-stone-400 mt-1">Admin Portal</p>
          </>
        ) : (
          <>
            <img
              src={getMediaUrl('/media/logo-white.png')}
              alt="Just Empower"
              className="h-10 opacity-90"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-light">
              Admin Portal
            </p>
          </>
        )}
      </div>

      <nav className={`flex-1 min-h-0 overflow-y-auto ${isDark ? 'space-y-1 px-3' : 'p-4 space-y-1'}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || 
            (item.path === '/admin/dashboard' && location === '/admin');
          
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                isDark
                  ? isActive
                    ? 'bg-amber-600 text-white'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  : isActive
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className={`${isDark ? '' : 'font-medium text-sm'} truncate`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className={`p-4 ${isDark ? 'mt-4 pt-4 border-t border-stone-800' : 'border-t border-neutral-200 dark:border-neutral-800'}`}>
        {isDark ? (
          <>
            <div className="px-4 py-2 text-sm text-stone-400">
              Logged in as <span className="text-stone-200 font-medium">{username}</span>
            </div>
            <Button
              onClick={logout}
              variant="ghost"
              className="w-full justify-start text-stone-300 hover:text-white hover:bg-stone-800 mt-2"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </aside>
  );
}

// Export navItems for use in other components if needed
export { navItems };
