import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminSidebar from "@/components/AdminSidebar";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Files,
  Users,
  FormInput,
  Image,
  ArrowRight,
  ArrowUpRight,
  Activity,
  Clock,
  Palette,
  BarChart3,
  ShoppingCart,
  Calendar,
  DollarSign,
  Mail,
  Database,
  Cloud,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Package,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Zap,
  Eye,
  MousePointer,
  Globe,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
  Settings,
  Search,
  Command,
  Plus,
  MoreHorizontal,
  ChevronRight,
  ExternalLink,
  Layers,
  Target,
  Award,
  Rocket,
  LayoutDashboard,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationCenter";

// Animated counter component
function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const stepValue = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
}

// Stat card with trend indicator
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  color = "blue",
  href 
}: { 
  title: string;
  value: number | string;
  subtitle: string;
  icon: any;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: string;
  href?: string;
}) {
  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", icon: "text-blue-500" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", icon: "text-purple-500" },
    green: { bg: "bg-green-50", text: "text-green-600", icon: "text-green-500" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", icon: "text-amber-500" },
    pink: { bg: "bg-pink-50", text: "text-pink-600", icon: "text-pink-500" },
    cyan: { bg: "bg-cyan-50", text: "text-cyan-600", icon: "text-cyan-500" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", icon: "text-orange-500" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", icon: "text-indigo-500" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "text-emerald-500" },
    rose: { bg: "bg-rose-50", text: "text-rose-600", icon: "text-rose-500" },
  };
  
  const colors = colorClasses[color] || colorClasses.blue;
  
  const content = (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className={`relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300 ${href ? 'hover:border-primary' : ''}`}>
        <div className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:scale-150 transition-transform duration-500`} />
        <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
          <CardTitle className="text-sm font-medium text-stone-600">{title}</CardTitle>
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            <Icon className={`w-4 h-4 ${colors.icon}`} />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold text-stone-900">
            {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
          </div>
          <div className="flex items-center gap-2 mt-2">
            {trend && trendValue && (
              <Badge variant="secondary" className={`${trend === 'up' ? 'bg-green-100 text-green-700' : trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-700'}`}>
                {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : trend === 'down' ? <TrendingDown className="w-3 h-3 mr-1" /> : null}
                {trendValue}
              </Badge>
            )}
            <p className="text-xs text-stone-500">{subtitle}</p>
          </div>
        </CardContent>
        {href && (
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="w-4 h-4 text-stone-400" />
          </div>
        )}
      </Card>
    </motion.div>
  );
  
  return href ? <Link href={href}>{content}</Link> : content;
}

// Quick action button
function QuickAction({ icon: Icon, label, href, color, badge }: { icon: any; label: string; href: string; color: string; badge?: string }) {
  const [, setLocation] = useLocation();
  
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setLocation(href)}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl ${color} hover:shadow-md transition-all cursor-pointer relative`}
    >
      {badge && (
        <Badge className="absolute -top-1 -right-1 text-xs px-1.5">{badge}</Badge>
      )}
      <Icon className="w-6 h-6" />
      <span className="text-xs font-medium text-center">{label}</span>
    </motion.div>
  );
}

// System status indicator
function SystemStatus({ name, status, icon: Icon }: { name: string; status: boolean; icon: any }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors">
      <div className={`p-2 rounded-full ${status ? 'bg-green-100' : 'bg-red-100'}`}>
        <Icon className={`w-4 h-4 ${status ? 'text-green-600' : 'text-red-600'}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-stone-900">{name}</p>
        <p className={`text-xs ${status ? 'text-green-600' : 'text-red-600'}`}>
          {status ? 'Operational' : 'Issues Detected'}
        </p>
      </div>
      <div className={`w-2 h-2 rounded-full ${status ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
    </div>
  );
}

export default function AdminDashboardEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking, username } = useAdminAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  const statsQuery = trpc.admin.dashboard.stats.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });

  const activityQuery = trpc.admin.dashboard.recentActivity.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const healthQuery = trpc.admin.dashboard.health.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isAuthenticated, isChecking, setLocation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      statsQuery.refetch(),
      activityQuery.refetch(),
      healthQuery.refetch(),
    ]);
    setTimeout(() => setRefreshing(false), 500);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-stone-500 font-medium">Loading Dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const stats = statsQuery.data || {
    totalPages: 0, publishedPages: 0, totalArticles: 0, publishedArticles: 0,
    totalMedia: 0, totalFormSubmissions: 0, unreadSubmissions: 0, totalUsers: 0,
    totalProducts: 0, totalEvents: 0, totalOrders: 0, recentOrders: 0,
    totalRevenue: 0, totalSubscribers: 0, totalResources: 0,
  };

  const health = healthQuery.data;
  const activities = activityQuery.data || [];
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50">
      <AdminSidebar variant="dark" />

      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">{greeting}, {username}!</h1>
                <p className="text-stone-500 text-sm">Here's what's happening with your site today</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh}>
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <NotificationBell unreadCount={stats.unreadSubmissions} />
                <Link href="/admin/settings">
                  <Button variant="outline" size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* System Health Banner */}
          <AnimatePresence>
            {health && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mb-6 p-4 rounded-xl border-2 ${
                  health.status === 'healthy' 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                    : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${health.status === 'healthy' ? 'bg-green-100' : 'bg-amber-100'}`}>
                      {health.status === 'healthy' ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className={`font-semibold ${health.status === 'healthy' ? 'text-green-800' : 'text-amber-800'}`}>
                        All Systems {health.status === 'healthy' ? 'Operational' : 'Experiencing Issues'}
                      </p>
                      <p className="text-sm text-stone-600">
                        Uptime: {Math.floor(health.uptime / 86400)}d {Math.floor((health.uptime % 86400) / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <SystemStatus name="Database" status={health.checks.database} icon={Database} />
                    <SystemStatus name="Storage" status={health.checks.storage} icon={Cloud} />
                    <SystemStatus name="Email" status={health.checks.email} icon={Mail} />
                    <SystemStatus name="AI" status={health.checks.ai} icon={Sparkles} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Actions Grid */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-stone-900">Quick Actions</h2>
              <Button variant="ghost" size="sm" className="text-stone-500" onClick={() => setLocation('/admin/settings')}>
                Customize <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              <QuickAction icon={Plus} label="New Page" href="/admin/pages" color="bg-blue-50 text-blue-600" />
              <QuickAction icon={FileText} label="New Article" href="/admin/articles" color="bg-purple-50 text-purple-600" />
              <QuickAction icon={Image} label="Upload Media" href="/admin/media" color="bg-green-50 text-green-600" />
              <QuickAction icon={Package} label="Add Product" href="/admin/products" color="bg-orange-50 text-orange-600" />
              <QuickAction icon={Calendar} label="Create Event" href="/admin/events" color="bg-pink-50 text-pink-600" />
              <QuickAction icon={Layers} label="Page Builder" href="/admin/pages" color="bg-indigo-50 text-indigo-600" />
              <QuickAction icon={Palette} label="Theme" href="/admin/theme" color="bg-rose-50 text-rose-600" />
              <QuickAction icon={FormInput} label="Forms" href="/admin/forms" color="bg-amber-50 text-amber-600" badge={stats.unreadSubmissions > 0 ? String(stats.unreadSubmissions) : undefined} />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Pages"
                value={stats.totalPages}
                subtitle={`${stats.publishedPages} published`}
                icon={Files}
                color="blue"
                trend="up"
                trendValue="+2 this week"
                href="/admin/pages"
              />
              <StatCard
                title="Articles"
                value={stats.totalArticles}
                subtitle={`${stats.publishedArticles} published`}
                icon={FileText}
                color="purple"
                href="/admin/articles"
              />
              <StatCard
                title="Media Files"
                value={stats.totalMedia}
                subtitle="Images & videos"
                icon={Image}
                color="green"
                href="/admin/media"
              />
              <StatCard
                title="Resources"
                value={stats.totalResources}
                subtitle="Documents & files"
                icon={Package}
                color="cyan"
                href="/admin/resources"
              />
            </div>
          </div>

          {/* Commerce & Engagement Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Commerce Stats */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-orange-500" />
                      Commerce
                    </CardTitle>
                    <CardDescription>Shop & order statistics</CardDescription>
                  </div>
                  <Link href="/admin/revenue">
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
                    <p className="text-sm text-orange-600 font-medium">Products</p>
                    <p className="text-2xl font-bold text-orange-900">{stats.totalProducts}</p>
                    <p className="text-xs text-orange-600">In catalog</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
                    <p className="text-sm text-emerald-600 font-medium">Orders</p>
                    <p className="text-2xl font-bold text-emerald-900">{stats.totalOrders}</p>
                    <p className="text-xs text-emerald-600">+{stats.recentOrders} this week</p>
                  </div>
                  <div className="col-span-2 p-4 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-50 border border-amber-200">
                    <p className="text-sm text-amber-700 font-medium">Total Revenue</p>
                    <p className="text-3xl font-bold text-amber-900">
                      ${(stats.totalRevenue / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="mt-2">
                      <Progress value={65} className="h-2" />
                      <p className="text-xs text-amber-600 mt-1">65% of monthly goal</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Stats */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-500" />
                      Engagement
                    </CardTitle>
                    <CardDescription>User activity & submissions</CardDescription>
                  </div>
                  <Link href="/admin/analytics">
                    <Button variant="outline" size="sm">View Analytics</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                    <p className="text-sm text-indigo-600 font-medium">Events</p>
                    <p className="text-2xl font-bold text-indigo-900">{stats.totalEvents}</p>
                    <p className="text-xs text-indigo-600">Scheduled</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100">
                    <p className="text-sm text-sky-600 font-medium">Subscribers</p>
                    <p className="text-2xl font-bold text-sky-900">{stats.totalSubscribers}</p>
                    <p className="text-xs text-sky-600">Newsletter</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100">
                    <p className="text-sm text-rose-600 font-medium">Submissions</p>
                    <p className="text-2xl font-bold text-rose-900">{stats.totalFormSubmissions}</p>
                    {stats.unreadSubmissions > 0 && (
                      <Badge className="mt-1 bg-rose-500">{stats.unreadSubmissions} unread</Badge>
                    )}
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
                    <p className="text-sm text-violet-600 font-medium">Admin Users</p>
                    <p className="text-2xl font-bold text-violet-900">{stats.totalUsers}</p>
                    <p className="text-xs text-violet-600">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-500" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest changes and updates</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setLocation('/admin/activity')}>View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              {activityQuery.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-stone-300" />
                  <p className="text-stone-500">No recent activity</p>
                  <p className="text-sm text-stone-400 mt-1">Start creating content to see activity here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.slice(0, 8).map((activity: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-4 p-3 rounded-lg hover:bg-stone-50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedActivity(activity)}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                        <Activity className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-900 font-medium truncate">{activity.description}</p>
                        <p className="text-xs text-stone-500 mt-0.5">{activity.timestamp}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); setSelectedActivity(activity); }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Activity Details Dialog */}
      <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Activity Details
            </DialogTitle>
            <DialogDescription>
              Information about this activity
            </DialogDescription>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {selectedActivity.type || 'Activity'}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-stone-900">
                  {selectedActivity.title || 'Untitled'}
                </h3>
                <p className="text-sm text-stone-600">
                  {selectedActivity.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wide">Created</p>
                  <p className="text-sm font-medium text-stone-900">{selectedActivity.timestamp}</p>
                </div>
                {selectedActivity.slug && (
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wide">Slug</p>
                    <p className="text-sm font-medium text-stone-900 truncate">{selectedActivity.slug}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                {selectedActivity.link && (
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      setLocation(selectedActivity.link);
                      setSelectedActivity(null);
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Go to {selectedActivity.type || 'Item'}
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={() => setSelectedActivity(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
