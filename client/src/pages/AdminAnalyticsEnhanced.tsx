import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from "framer-motion";
import { BarChart3, Users, Eye, Clock, Globe, RefreshCw, TrendingUp, MousePointer, Calendar, Activity } from "lucide-react";

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const duration = 1000, steps = 30, increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setDisplayValue(value); clearInterval(timer); }
      else { setDisplayValue(Math.floor(current)); }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{displayValue.toLocaleString()}{suffix}</span>;
}

export default function AdminAnalyticsEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [period, setPeriod] = useState("30d");

  const analyticsQuery = trpc.analytics.getDashboardStats.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });
  const topPagesQuery = trpc.analytics.getPopularPages.useQuery({ limit: 10 }, {
    enabled: isAuthenticated,
  });
  const recentActivityQuery = trpc.analytics.getRecentActivity.useQuery({ limit: 20 }, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  const dashData = analyticsQuery.data;
  const totalViews = dashData?.totalPageViews || 0;
  const uniqueVisitors = dashData?.uniqueVisitors || 0;
  const totalSessions = dashData?.totalSessions || 0;
  const todayViews = dashData?.todayPageViews || 0;
  const bounceRate = totalSessions > 0 ? Math.round(((totalSessions - (totalSessions * 0.6)) / totalSessions) * 100) : 0;
  const avgPagesPerSession = totalSessions > 0 ? Math.round((totalViews / totalSessions) * 10) / 10 : 0;

  const topPages: any[] = topPagesQuery.data || [];
  const recentActivity: any[] = recentActivityQuery.data || [];

  if (isChecking) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-stone-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" /></div>;
  }
  if (!isAuthenticated) return null;

  const handleRefresh = () => {
    analyticsQuery.refetch();
    topPagesQuery.refetch();
    recentActivityQuery.refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 flex">
      <AdminSidebar variant="dark" />
      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div><h1 className="text-2xl font-bold text-stone-900">Analytics</h1><p className="text-stone-500 text-sm">Track site performance and visitor insights</p></div>
              <div className="flex items-center gap-3">
                <Select value={period} onValueChange={setPeriod}><SelectTrigger className="w-40"><Calendar className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7d">Last 7 days</SelectItem><SelectItem value="30d">Last 30 days</SelectItem><SelectItem value="90d">Last 90 days</SelectItem><SelectItem value="all">All time</SelectItem></SelectContent></Select>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={analyticsQuery.isLoading}><RefreshCw className={`w-4 h-4 mr-2 ${analyticsQuery.isLoading ? "animate-spin" : ""}`} />Refresh</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Total Views", value: totalViews, icon: Eye, color: "amber", bgFrom: "from-amber-50", bgTo: "to-amber-100/50", border: "border-amber-200", textLabel: "text-amber-600", textValue: "text-amber-900", iconColor: "text-amber-500" },
              { label: "Unique Visitors", value: uniqueVisitors, icon: Users, color: "blue", bgFrom: "from-blue-50", bgTo: "to-blue-100/50", border: "border-blue-200", textLabel: "text-blue-600", textValue: "text-blue-900", iconColor: "text-blue-500" },
              { label: "Avg Pages/Session", value: avgPagesPerSession, icon: Clock, color: "emerald", bgFrom: "from-emerald-50", bgTo: "to-emerald-100/50", border: "border-emerald-200", textLabel: "text-emerald-600", textValue: "text-emerald-900", iconColor: "text-emerald-500" },
              { label: "Today's Views", value: todayViews, icon: MousePointer, color: "purple", bgFrom: "from-purple-50", bgTo: "to-purple-100/50", border: "border-purple-200", textLabel: "text-purple-600", textValue: "text-purple-900", iconColor: "text-purple-500" },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`bg-gradient-to-br ${stat.bgFrom} ${stat.bgTo} ${stat.border}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div><p className={`text-xs font-medium ${stat.textLabel}`}>{stat.label}</p><p className={`text-2xl font-bold ${stat.textValue}`}><AnimatedCounter value={stat.value} /></p></div>
                      <stat.icon className={`w-8 h-8 ${stat.iconColor}`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-blue-500" />Top Pages</h2>
                  {topPages.length === 0 ? (
                    <div className="py-8 text-center text-stone-500">{analyticsQuery.isLoading ? "Loading..." : "No page data yet"}</div>
                  ) : (
                    <div className="space-y-3">
                      {topPages.map((page: any, i: number) => {
                        const maxViews = topPages[0]?.views || 1;
                        const pct = Math.round((page.views / maxViews) * 100);
                        return (
                          <div key={i} className="relative">
                            <div className="absolute inset-0 bg-blue-50 rounded-lg" style={{ width: `${pct}%` }} />
                            <div className="relative flex items-center justify-between p-3">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-stone-400 w-6">{i + 1}</span>
                                <span className="font-medium truncate max-w-[200px]">{page.page || "/"}</span>
                              </div>
                              <span className="text-sm font-semibold text-stone-700">{page.views?.toLocaleString() || 0}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-500" />Recent Activity</h2>
                  {recentActivity.length === 0 ? (
                    <div className="py-8 text-center text-stone-500">{analyticsQuery.isLoading ? "Loading..." : "No recent activity"}</div>
                  ) : (
                    <div className="space-y-2 max-h-[320px] overflow-y-auto">
                      {recentActivity.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg text-sm">
                          <div className="flex items-center gap-2">
                            <Eye className="w-3.5 h-3.5 text-stone-400" />
                            <span className="font-medium truncate max-w-[180px]">{item.page || "/"}</span>
                          </div>
                          <span className="text-xs text-stone-400 whitespace-nowrap">
                            {item.timestamp ? new Date(item.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Summary Stats Row */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-amber-500" />Session Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-stone-900">{totalSessions.toLocaleString()}</p>
                    <p className="text-xs text-stone-500 mt-1">Total Sessions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-stone-900">{todayViews.toLocaleString()}</p>
                    <p className="text-xs text-stone-500 mt-1">Views Today</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-stone-900">{avgPagesPerSession}</p>
                    <p className="text-xs text-stone-500 mt-1">Pages / Session</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-stone-900">{dashData?.totalConversations || 0}</p>
                    <p className="text-xs text-stone-500 mt-1">AI Conversations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
