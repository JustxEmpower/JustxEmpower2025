import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AdminSidebar from "@/components/AdminSidebar";
import {
  FileText,
  Files,
  Users,
  FormInput,
  Image,
  ArrowRight,
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
  Package,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking, username } = useAdminAuth();

  // Fetch dashboard statistics
  const statsQuery = trpc.admin.dashboard.stats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const activityQuery = trpc.admin.dashboard.recentActivity.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const healthQuery = trpc.admin.dashboard.health.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isAuthenticated, isChecking, setLocation]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const quickActions = [
    {
      icon: FileText,
      title: "Create Article",
      description: "Write a new blog post",
      path: "/admin/articles",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: Files,
      title: "Manage Pages",
      description: "Edit page content with blocks",
      path: "/admin/pages",
      color: "bg-purple-100 text-purple-600",
    },
    {
      icon: Image,
      title: "Upload Media",
      description: "Add images and files",
      path: "/admin/media",
      color: "bg-green-100 text-green-600",
    },
    {
      icon: FormInput,
      title: "View Forms",
      description: "Check form submissions",
      path: "/admin/forms",
      color: "bg-amber-100 text-amber-600",
    },
    {
      icon: Palette,
      title: "Customize Theme",
      description: "Update colors and fonts",
      path: "/admin/theme",
      color: "bg-pink-100 text-pink-600",
    },
    {
      icon: BarChart3,
      title: "View Analytics",
      description: "Site performance metrics",
      path: "/admin/analytics",
      color: "bg-indigo-100 text-indigo-600",
    },
  ];

  const stats = statsQuery.data || {
    totalPages: 0,
    publishedPages: 0,
    totalArticles: 0,
    publishedArticles: 0,
    totalMedia: 0,
    totalFormSubmissions: 0,
    unreadSubmissions: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalEvents: 0,
    totalOrders: 0,
    recentOrders: 0,
    totalRevenue: 0,
    totalSubscribers: 0,
    totalResources: 0,
  };

  const health = healthQuery.data;
  const activities = activityQuery.data || [];

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Shared Sidebar */}
      <AdminSidebar variant="dark" />

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-serif text-stone-900 mb-2">Dashboard</h1>
            <p className="text-stone-600">Welcome back, {username}! Here's what's happening with your site.</p>
          </div>

          {/* System Health Banner */}
          {health && (
            <div className={`mb-6 p-4 rounded-lg border ${
              health.status === 'healthy' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {health.status === 'healthy' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}
                  <div>
                    <p className={`font-medium ${health.status === 'healthy' ? 'text-green-800' : 'text-amber-800'}`}>
                      System {health.status === 'healthy' ? 'Healthy' : 'Degraded'}
                    </p>
                    <p className="text-sm text-stone-600">
                      Uptime: {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <Database className={`w-4 h-4 ${health.checks.database ? 'text-green-500' : 'text-red-500'}`} />
                    <span className="text-xs">DB</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Cloud className={`w-4 h-4 ${health.checks.storage ? 'text-green-500' : 'text-red-500'}`} />
                    <span className="text-xs">Storage</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className={`w-4 h-4 ${health.checks.email ? 'text-green-500' : 'text-red-500'}`} />
                    <span className="text-xs">Email</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className={`w-4 h-4 ${health.checks.ai ? 'text-green-500' : 'text-red-500'}`} />
                    <span className="text-xs">AI</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Content Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">Pages</CardTitle>
                <Files className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-stone-900">{stats.totalPages}</div>
                <p className="text-xs text-stone-500 mt-1">
                  <span className="text-green-600">{stats.publishedPages}</span> published
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">Articles</CardTitle>
                <FileText className="w-4 h-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-stone-900">{stats.totalArticles}</div>
                <p className="text-xs text-stone-500 mt-1">
                  <span className="text-green-600">{stats.publishedArticles}</span> published
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">Media</CardTitle>
                <Image className="w-4 h-4 text-pink-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-stone-900">{stats.totalMedia}</div>
                <p className="text-xs text-stone-500 mt-1">Images & files</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">Resources</CardTitle>
                <Package className="w-4 h-4 text-cyan-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-stone-900">{stats.totalResources}</div>
                <p className="text-xs text-stone-500 mt-1">Documents & files</p>
              </CardContent>
            </Card>

            {/* Commerce Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">Products</CardTitle>
                <ShoppingCart className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-stone-900">{stats.totalProducts}</div>
                <p className="text-xs text-stone-500 mt-1">In catalog</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">Events</CardTitle>
                <Calendar className="w-4 h-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-stone-900">{stats.totalEvents}</div>
                <p className="text-xs text-stone-500 mt-1">Scheduled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">Orders</CardTitle>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-stone-900">{stats.totalOrders}</div>
                <p className="text-xs text-stone-500 mt-1">
                  <span className="text-emerald-600">+{stats.recentOrders}</span> this week
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-amber-800">Revenue</CardTitle>
                <DollarSign className="w-4 h-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-900">
                  ${(stats.totalRevenue / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-amber-700 mt-1">Total earnings</p>
              </CardContent>
            </Card>

            {/* Engagement Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">Submissions</CardTitle>
                <FormInput className="w-4 h-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-stone-900">{stats.totalFormSubmissions}</div>
                <p className="text-xs text-stone-500 mt-1">
                  {stats.unreadSubmissions > 0 ? (
                    <span className="text-amber-600 font-medium">{stats.unreadSubmissions} unread</span>
                  ) : (
                    "All read"
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">Subscribers</CardTitle>
                <Mail className="w-4 h-4 text-sky-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-stone-900">{stats.totalSubscribers}</div>
                <p className="text-xs text-stone-500 mt-1">Newsletter</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">Admin Users</CardTitle>
                <Users className="w-4 h-4 text-violet-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-stone-900">{stats.totalUsers}</div>
                <p className="text-xs text-stone-500 mt-1">Administrators</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">Status</CardTitle>
                <Activity className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Online</div>
                <p className="text-xs text-stone-500 mt-1">All systems go</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.path} href={action.path}>
                      <a className="flex items-start gap-4 p-4 rounded-lg border hover:shadow-md transition-shadow bg-white group">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${action.color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-stone-900 mb-1 group-hover:text-amber-600 transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-sm text-stone-500">{action.description}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                      </a>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest changes and updates</CardDescription>
            </CardHeader>
            <CardContent>
              {activityQuery.isLoading ? (
                <div className="text-center py-8 text-stone-500">Loading activity...</div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity: any, index: number) => (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-stone-900">{activity.description}</p>
                        <p className="text-xs text-stone-500 mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
