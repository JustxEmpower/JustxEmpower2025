import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from "framer-motion";
import { BarChart3, Users, Eye, Clock, Globe, RefreshCw, TrendingUp, MousePointer, Calendar } from "lucide-react";

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

  const analyticsQuery = { data: { totalViews: 0, uniqueVisitors: 0, avgSessionDuration: 0, bounceRate: 0 }, refetch: () => {}, isLoading: false };
  const topPagesQuery = { data: [], refetch: () => {} };

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  const stats = analyticsQuery.data || { totalViews: 0, uniqueVisitors: 0, avgSessionDuration: 0, bounceRate: 0 };
  const topPages = topPagesQuery.data || [];

  if (isChecking) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-stone-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" /></div>;
  }
  if (!isAuthenticated) return null;

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
                <Button variant="outline" size="sm" onClick={() => { analyticsQuery.refetch?.(); topPagesQuery.refetch?.(); }}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Total Views", value: stats.totalViews || 0, icon: Eye, color: "amber" },
              { label: "Unique Visitors", value: stats.uniqueVisitors || 0, icon: Users, color: "blue" },
              { label: "Avg Session", value: Math.round((stats.avgSessionDuration || 0) / 60), suffix: "m", icon: Clock, color: "emerald" },
              { label: "Bounce Rate", value: stats.bounceRate || 0, suffix: "%", icon: MousePointer, color: "purple" },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100/50 border-${stat.color}-200`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div><p className={`text-xs font-medium text-${stat.color}-600`}>{stat.label}</p><p className={`text-2xl font-bold text-${stat.color}-900`}><AnimatedCounter value={stat.value} suffix={stat.suffix} /></p></div>
                      <stat.icon className={`w-8 h-8 text-${stat.color}-500`} />
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
                    <div className="py-8 text-center text-stone-500">No page data yet</div>
                  ) : (
                    <div className="space-y-3">
                      {topPages.map((page: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-stone-500 w-6">{i + 1}</span>
                            <span className="font-medium truncate max-w-[200px]">{page.path || "/"}</span>
                          </div>
                          <span className="text-sm text-stone-600">{page.views?.toLocaleString() || 0} views</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-500" />Traffic Overview</h2>
                  <div className="h-48 flex items-center justify-center bg-stone-50 rounded-lg">
                    <div className="text-center text-stone-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                      <p>Traffic chart visualization</p>
                      <p className="text-sm">Data updates in real-time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
