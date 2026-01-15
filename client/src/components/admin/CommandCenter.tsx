/**
 * Command Center - Unified control panel for all site capabilities
 * 
 * Features:
 * - Global search (Cmd+K)
 * - Quick actions
 * - Site overview stats
 * - Recent activity feed
 * - Alerts and notifications
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Search,
  Plus,
  FileText,
  Files,
  ShoppingBag,
  Calendar,
  Image,
  FileDown,
  Users,
  Mail,
  Settings,
  Palette,
  BarChart3,
  ArrowRight,
  Clock,
  AlertTriangle,
  Package,
  DollarSign,
  TrendingUp,
  Bell,
  Eye,
  Zap,
  Command as CommandIcon,
} from 'lucide-react';

// Quick action definitions
const QUICK_ACTIONS = [
  { id: 'new-page', label: 'Create New Page', icon: Files, path: '/admin/page-builder?new=true', shortcut: 'P' },
  { id: 'new-article', label: 'Write New Article', icon: FileText, path: '/admin/articles?new=true', shortcut: 'A' },
  { id: 'new-product', label: 'Add New Product', icon: ShoppingBag, path: '/admin/products?new=true', shortcut: 'R' },
  { id: 'new-event', label: 'Create New Event', icon: Calendar, path: '/admin/events?new=true', shortcut: 'E' },
  { id: 'upload-media', label: 'Upload Media', icon: Image, path: '/admin/media?upload=true', shortcut: 'M' },
  { id: 'view-orders', label: 'View Orders', icon: Package, path: '/admin/orders', shortcut: 'O' },
  { id: 'view-messages', label: 'View Messages', icon: Mail, path: '/admin/messages', shortcut: 'I' },
  { id: 'site-settings', label: 'Site Settings', icon: Settings, path: '/admin/settings', shortcut: 'S' },
  { id: 'theme-editor', label: 'Theme Editor', icon: Palette, path: '/admin/theme', shortcut: 'T' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/admin/analytics', shortcut: 'N' },
];

// Navigation sections
const NAV_SECTIONS = [
  { 
    title: 'Content', 
    items: [
      { label: 'Pages', path: '/admin/pages', icon: Files },
      { label: 'Page Builder', path: '/admin/page-builder', icon: Zap },
      { label: 'Articles', path: '/admin/articles', icon: FileText },
      { label: 'Media Library', path: '/admin/media', icon: Image },
      { label: 'Resources', path: '/admin/resources', icon: FileDown },
    ]
  },
  {
    title: 'Commerce',
    items: [
      { label: 'Products', path: '/admin/products', icon: ShoppingBag },
      { label: 'Orders', path: '/admin/orders', icon: Package },
      { label: 'Events', path: '/admin/events', icon: Calendar },
    ]
  },
  {
    title: 'Engagement',
    items: [
      { label: 'Messages', path: '/admin/messages', icon: Mail },
      { label: 'Subscribers', path: '/admin/subscribers', icon: Users },
      { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    ]
  },
  {
    title: 'Settings',
    items: [
      { label: 'Site Settings', path: '/admin/settings', icon: Settings },
      { label: 'Theme', path: '/admin/theme', icon: Palette },
      { label: 'Navigation', path: '/admin/navigation', icon: Files },
    ]
  },
];

interface CommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandCenter({ isOpen, onClose }: CommandCenterProps) {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Search results
  const searchResults = trpc.siteManager.globalSearch.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: searchQuery.length >= 2 }
  );

  const handleSelect = (path: string) => {
    setLocation(path);
    onClose();
    setSearchQuery('');
  };

  const getItemPath = (type: string, id: number, slug?: string) => {
    switch (type) {
      case 'page': return `/admin/page-builder/${id}`;
      case 'article': return `/admin/articles/${id}`;
      case 'product': return `/admin/products/${id}`;
      case 'event': return `/admin/events/${id}`;
      case 'media': return `/admin/media?id=${id}`;
      case 'resource': return `/admin/resources/${id}`;
      default: return `/admin/${type}s/${id}`;
    }
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <CommandInput 
        placeholder="Search everything or type a command..." 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {/* Search Results */}
        {searchQuery.length >= 2 && searchResults.data && searchResults.data.length > 0 && (
          <CommandGroup heading="Search Results">
            {searchResults.data.map((result) => (
              <CommandItem
                key={`${result.type}-${result.id}`}
                onSelect={() => handleSelect(getItemPath(result.type, result.id, result.slug))}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded bg-stone-100 flex items-center justify-center">
                  {result.imageUrl ? (
                    <img src={result.imageUrl} alt="" className="w-full h-full object-cover rounded" />
                  ) : (
                    <FileText className="w-4 h-4 text-stone-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{result.title}</p>
                  <p className="text-xs text-stone-500 capitalize">{result.type}</p>
                </div>
                {result.status && (
                  <Badge variant={result.status === 'published' || result.status === 'active' ? 'default' : 'secondary'}>
                    {result.status}
                  </Badge>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Quick Actions */}
        {searchQuery.length < 2 && (
          <>
            <CommandGroup heading="Quick Actions">
              {QUICK_ACTIONS.slice(0, 5).map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.id}
                    onSelect={() => handleSelect(action.path)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{action.label}</span>
                    <span className="ml-auto text-xs text-stone-400">⌘{action.shortcut}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandSeparator />

            {NAV_SECTIONS.map((section) => (
              <CommandGroup key={section.title} heading={section.title}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.path}
                      onSelect={() => handleSelect(item.path)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

// Command Center Trigger Button
export function CommandCenterTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start text-stone-500 gap-2"
        onClick={() => setIsOpen(true)}
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-stone-100 px-1.5 font-mono text-[10px] font-medium text-stone-600">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

// Site Overview Widget
export function SiteOverviewWidget() {
  const overview = trpc.siteManager.siteOverview.useQuery();

  if (!overview.data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-24 bg-stone-100 rounded-lg" />
        ))}
      </div>
    );
  }

  const { content, commerce, engagement, alerts } = overview.data;

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {(alerts.hasUnreadSubmissions || alerts.hasLowStock || alerts.hasPendingOrders) && (
        <div className="flex gap-2 flex-wrap">
          {alerts.hasUnreadSubmissions && (
            <Badge variant="destructive" className="gap-1">
              <Mail className="w-3 h-3" />
              {engagement.unreadSubmissions} unread messages
            </Badge>
          )}
          {alerts.hasLowStock && (
            <Badge variant="outline" className="gap-1 border-amber-500 text-amber-700">
              <AlertTriangle className="w-3 h-3" />
              {commerce.lowStockProducts} low stock items
            </Badge>
          )}
          {alerts.hasPendingOrders && (
            <Badge variant="outline" className="gap-1 border-blue-500 text-blue-700">
              <Package className="w-3 h-3" />
              {commerce.pendingOrders} pending orders
            </Badge>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Pages" value={content.pages} icon={Files} />
        <StatCard title="Articles" value={content.articles} icon={FileText} />
        <StatCard title="Products" value={content.products} icon={ShoppingBag} />
        <StatCard title="Events" value={content.events} icon={Calendar} />
        <StatCard title="Media" value={content.media} icon={Image} />
        <StatCard title="Resources" value={content.resources} icon={FileDown} />
        <StatCard title="Subscribers" value={engagement.subscribers} icon={Users} trend={engagement.newSubscribers > 0 ? `+${engagement.newSubscribers}` : undefined} />
        <StatCard 
          title="Revenue" 
          value={`$${(commerce.totalRevenue / 100).toLocaleString()}`} 
          icon={DollarSign}
          trend={commerce.recentRevenue > 0 ? `+$${(commerce.recentRevenue / 100).toLocaleString()}` : undefined}
        />
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType;
  trend?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Icon className="w-4 h-4 text-stone-400" />
          {trend && (
            <span className="text-xs text-green-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </span>
          )}
        </div>
        <p className="text-2xl font-bold mt-2">{value}</p>
        <p className="text-xs text-stone-500">{title}</p>
      </CardContent>
    </Card>
  );
}

// Recent Activity Widget
export function RecentActivityWidget() {
  const activity = trpc.siteManager.recentActivity.useQuery({ limit: 10 });

  if (!activity.data) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-stone-100 rounded" />
        ))}
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'page': return Files;
      case 'article': return FileText;
      case 'order': return Package;
      case 'submission': return Mail;
      case 'subscriber': return Users;
      default: return FileText;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
      case 'new':
      case 'subscribed': return 'text-green-600 bg-green-50';
      case 'updated': return 'text-blue-600 bg-blue-50';
      case 'deleted': return 'text-red-600 bg-red-50';
      default: return 'text-stone-600 bg-stone-50';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2">
        {activity.data.map((item, index) => {
          const Icon = getIcon(item.type);
          return (
            <div
              key={`${item.type}-${item.id}-${index}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 transition-colors"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActionColor(item.action)}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-xs text-stone-500 capitalize">
                  {item.type} {item.action}
                </p>
              </div>
              <span className="text-xs text-stone-400 whitespace-nowrap">
                {formatTime(item.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// Quick Actions Grid
export function QuickActionsGrid() {
  const [, setLocation] = useLocation();

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            variant="outline"
            className="h-auto py-4 flex-col gap-2 hover:border-amber-500 hover:bg-amber-50"
            onClick={() => setLocation(action.path)}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs text-center">{action.label}</span>
          </Button>
        );
      })}
    </div>
  );
}

export default CommandCenter;
