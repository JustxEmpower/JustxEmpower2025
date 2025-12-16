import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LogOut,
  FileText,
  Settings,
  Layout,
  FolderOpen,
  Palette,
  BarChart3,
  Files,
  TrendingUp,
  Users,
  MessageSquare,
  ThumbsUp,
  Eye,
  Activity,
} from "lucide-react";

export default function AdminAnalytics() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking, username, logout } = useAdminAuth();

  const statsQuery = trpc.analytics.getDashboardStats.useQuery(undefined, {
    refetchInterval: 30000, // Refetch every 30 seconds for real-time data
  });

  const popularPagesQuery = trpc.analytics.getPopularPages.useQuery({ limit: 10 });
  const recentActivityQuery = trpc.analytics.getRecentActivity.useQuery({ limit: 15 });
  const aiInsightsQuery = trpc.analytics.getAIChatInsights.useQuery();

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation("/admin/login");
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
    { icon: Layout, label: "Content", path: "/admin/content" },
    { icon: FileText, label: "Articles", path: "/admin/articles" },
    { icon: FolderOpen, label: "Media", path: "/admin/media" },
    { icon: Palette, label: "Theme", path: "/admin/theme" },
    { icon: Files, label: "Pages", path: "/admin/pages" },
    { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

  const stats = statsQuery.data;

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
                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
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
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-light text-neutral-900 dark:text-neutral-100 mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                Real-time insights into visitor behavior and AI chat effectiveness
              </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-neutral-500">
                      Total Page Views
                    </CardTitle>
                    <Eye className="w-4 h-4 text-neutral-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-light text-neutral-900 dark:text-neutral-100">
                    {stats?.totalPageViews.toLocaleString() || "0"}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {stats?.todayPageViews || 0} today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-neutral-500">
                      Unique Visitors
                    </CardTitle>
                    <Users className="w-4 h-4 text-neutral-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-light text-neutral-900 dark:text-neutral-100">
                    {stats?.uniqueVisitors.toLocaleString() || "0"}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">Last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-neutral-500">
                      AI Conversations
                    </CardTitle>
                    <MessageSquare className="w-4 h-4 text-neutral-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-light text-neutral-900 dark:text-neutral-100">
                    {stats?.totalConversations.toLocaleString() || "0"}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {aiInsightsQuery.data?.totalMessages || 0} messages
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-neutral-500">
                      AI Satisfaction
                    </CardTitle>
                    <ThumbsUp className="w-4 h-4 text-neutral-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-light text-neutral-900 dark:text-neutral-100">
                    {stats?.aiSatisfactionRate || 0}%
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {stats?.positiveFeedback || 0} positive /{" "}
                    {stats?.negativeFeedback || 0} negative
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Popular Pages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Popular Pages
                  </CardTitle>
                  <CardDescription>Most visited pages on your site</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {popularPagesQuery.data?.map((page, index) => (
                      <div
                        key={page.page}
                        className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-neutral-400 w-6">
                            {index + 1}
                          </span>
                          <span className="text-sm text-neutral-700 dark:text-neutral-300">
                            {page.page}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {page.views.toLocaleString()} views
                        </span>
                      </div>
                    ))}
                    {(!popularPagesQuery.data || popularPagesQuery.data.length === 0) && (
                      <p className="text-sm text-neutral-500 text-center py-4">
                        No data yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* AI Chat Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    AI Chat Insights
                  </CardTitle>
                  <CardDescription>Sentiment analysis and engagement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-neutral-500 mb-2">
                        Average Conversation Length
                      </p>
                      <p className="text-2xl font-light text-neutral-900 dark:text-neutral-100">
                        {aiInsightsQuery.data?.avgConversationLength || 0} messages
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-neutral-500 mb-2">Sentiment Distribution</p>
                      <div className="space-y-2">
                        {aiInsightsQuery.data?.sentimentDistribution.map((sentiment) => (
                          <div key={sentiment.sentiment} className="flex items-center gap-3">
                            <span className="text-xs text-neutral-600 dark:text-neutral-400 w-20 capitalize">
                              {sentiment.sentiment}
                            </span>
                            <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full h-2">
                              <div
                                className="bg-neutral-900 dark:bg-neutral-100 h-2 rounded-full"
                                style={{
                                  width: `${
                                    ((sentiment.count || 0) /
                                      (aiInsightsQuery.data?.totalMessages || 1)) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-neutral-500 w-12 text-right">
                              {sentiment.count}
                            </span>
                          </div>
                        ))}
                        {(!aiInsightsQuery.data?.sentimentDistribution ||
                          aiInsightsQuery.data.sentimentDistribution.length === 0) && (
                          <p className="text-sm text-neutral-500 text-center py-2">
                            No sentiment data yet
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Live visitor activity on your site</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentActivityQuery.data?.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Eye className="w-4 h-4 text-neutral-400" />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">
                          {activity.page}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                  {(!recentActivityQuery.data || recentActivityQuery.data.length === 0) && (
                    <p className="text-sm text-neutral-500 text-center py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
