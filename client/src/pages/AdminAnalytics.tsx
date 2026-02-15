import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, MessageSquare, ThumbsUp, Eye, Activity, Globe, MousePointer, RefreshCw, Sparkles, Target, Hash } from "lucide-react";

function AV({ value }: { value: number }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    if (!value) { setD(0); return; }
    let c = 0; const st = value / 20;
    const t = setInterval(() => { c += st; if (c >= value) { setD(value); clearInterval(t); } else setD(Math.floor(c)); }, 40);
    return () => clearInterval(t);
  }, [value]);
  return <>{d.toLocaleString()}</>;
}

export default function AdminAnalytics() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [refreshing, setRefreshing] = useState(false);
  const sQ = trpc.analytics.getDashboardStats.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 30000 });
  const pQ = trpc.analytics.getPopularPages.useQuery({ limit: 10 }, { enabled: isAuthenticated });
  const aQ = trpc.analytics.getRecentActivity.useQuery({ limit: 20 }, { enabled: isAuthenticated });
  const aiQ = trpc.analytics.getAIChatInsights.useQuery(undefined, { enabled: isAuthenticated });
  const tQ = trpc.aiChatAnalytics?.getTopicDistribution?.useQuery?.({ days: 30 }, { enabled: isAuthenticated }) ?? { data: null, refetch: () => Promise.resolve({} as any) };
  const cQ = trpc.aiChatAnalytics?.getConversationStats?.useQuery?.({ days: 30 }, { enabled: isAuthenticated }) ?? { data: null, refetch: () => Promise.resolve({} as any) };

  useEffect(() => { if (!isChecking && !isAuthenticated) setLocation("/admin/login"); }, [isAuthenticated, isChecking, setLocation]);
  const doRefresh = async () => { setRefreshing(true); await Promise.all([sQ.refetch(), pQ.refetch(), aQ.refetch(), aiQ.refetch()]); setTimeout(() => setRefreshing(false), 500); };

  if (isChecking) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return null;

  const s = sQ.data;
  const pg = pQ.data || [];
  const acts = aQ.data || [];
  const ai = aiQ.data;
  const topics = (tQ?.data as any[]) || [];
  const chat = cQ?.data as any;
  const cls = ['bg-blue-500','bg-purple-500','bg-cyan-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-indigo-500','bg-teal-500'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 flex">
      <AdminSidebar variant="dark" />
      <main className="flex-1 overflow-auto">
        {/* HEADER */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20"><BarChart3 className="w-5 h-5 text-white" /></div>
                Analytics
              </h1>
              <p className="text-stone-500 text-sm mt-1">Site performance and visitor insights</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs gap-1 py-1"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />Live</Badge>
              <Button variant="outline" size="sm" className="gap-2" onClick={doRefresh}><RefreshCw className={`w-4 h-4 ${refreshing?'animate-spin':''}`} />Refresh</Button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
{/* HERO STAT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0}}>
              <Card className="relative overflow-hidden border-2 border-blue-200 shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-50" />
                <CardContent className="p-5 relative">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg w-fit mb-3"><Eye className="w-5 h-5 text-white" /></div>
                  <p className="text-3xl font-bold text-stone-900"><AV value={Number(s?.totalPageViews||0)} /></p>
                  <p className="text-sm font-medium text-stone-600 mt-1">Total Page Views</p>
                  <p className="text-xs text-stone-400">{Number(s?.todayPageViews||0)} today</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}}>
              <Card className="relative overflow-hidden border-2 border-purple-200 shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-violet-50 opacity-50" />
                <CardContent className="p-5 relative">
                  <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg w-fit mb-3"><Users className="w-5 h-5 text-white" /></div>
                  <p className="text-3xl font-bold text-stone-900"><AV value={Number(s?.uniqueVisitors||0)} /></p>
                  <p className="text-sm font-medium text-stone-600 mt-1">Unique Visitors</p>
                  <p className="text-xs text-stone-400">Last 30 days</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}>
              <Card className="relative overflow-hidden border-2 border-emerald-200 shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 opacity-50" />
                <CardContent className="p-5 relative">
                  <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg w-fit mb-3"><MousePointer className="w-5 h-5 text-white" /></div>
                  <p className="text-3xl font-bold text-stone-900"><AV value={Number(s?.totalSessions||0)} /></p>
                  <p className="text-sm font-medium text-stone-600 mt-1">Total Sessions</p>
                  <p className="text-xs text-stone-400">{s?.totalSessions ? Math.round((Number(s.totalPageViews)/Number(s.totalSessions))*10)/10 : 0} pages/session</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}}>
              <Card className="relative overflow-hidden border-2 border-amber-200 shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 opacity-50" />
                <CardContent className="p-5 relative">
                  <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg w-fit mb-3"><ThumbsUp className="w-5 h-5 text-white" /></div>
                  <p className="text-3xl font-bold text-stone-900"><AV value={Number(s?.aiSatisfactionRate||0)} />%</p>
                  <p className="text-sm font-medium text-stone-600 mt-1">AI Satisfaction</p>
                  <p className="text-xs text-stone-400">{Number(s?.positiveFeedback||0)}+ / {Number(s?.negativeFeedback||0)}-</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

{/* TOP PAGES + AI CONVERSATIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-3 border-2 border-blue-100 shadow-md overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-500" />Top Pages</CardTitle>
                    <CardDescription>Most visited pages on your site</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">{pg.length} tracked</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {pg.length > 0 ? (
                  <div className="space-y-3">
                    {pg.map((p: any, i: number) => {
                      const mx = Number(pg[0]?.views || 1);
                      const pct = Math.max(8, (Number(p.views) / mx) * 100);
                      return (
                        <motion.div key={p.page} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-stone-400 w-5 text-right">{i+1}</span>
                          <span className="text-xs text-stone-600 w-28 truncate font-mono" title={p.page}>{p.page||'/'}</span>
                          <div className="flex-1 h-7 bg-stone-100 rounded-full overflow-hidden">
                            <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{delay:i*0.08,duration:0.6,ease:'easeOut'}} className={`h-full ${cls[i%cls.length]} rounded-full flex items-center justify-end pr-3`}>
                              <span className="text-[11px] font-bold text-white drop-shadow-sm">{Number(p.views).toLocaleString()}</span>
                            </motion.div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Globe className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                    <p className="text-stone-500 font-medium">No page data yet</p>
                    <p className="text-stone-400 text-sm">Views will appear as visitors browse your site</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-2 border-amber-100 shadow-md overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-500" />AI Conversations</CardTitle>
                <CardDescription>Chat engagement and satisfaction</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 text-center">
                    <p className="text-2xl font-bold text-amber-900"><AV value={Number(s?.totalConversations||0)} /></p>
                    <p className="text-[10px] text-amber-600 uppercase tracking-wider font-medium">Conversations</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 text-center">
                    <p className="text-2xl font-bold text-rose-900"><AV value={Number(ai?.totalMessages||0)} /></p>
                    <p className="text-[10px] text-rose-600 uppercase tracking-wider font-medium">Messages</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 text-center">
                    <p className="text-2xl font-bold text-green-900">{ai?.avgConversationLength||0}</p>
                    <p className="text-[10px] text-green-600 uppercase tracking-wider font-medium">Avg Length</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 text-center">
                    <p className="text-2xl font-bold text-indigo-900">{Number(s?.aiSatisfactionRate||0)}%</p>
                    <p className="text-[10px] text-indigo-600 uppercase tracking-wider font-medium">Satisfaction</p>
                  </div>
                </div>
                {ai?.sentimentDistribution && ai.sentimentDistribution.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Sentiment</p>
                    {ai.sentimentDistribution.map((sen: any) => {
                      const pct = Math.max(5, ((sen.count||0) / (ai.totalMessages||1)) * 100);
                      const color = sen.sentiment === 'positive' ? 'bg-green-500' : sen.sentiment === 'negative' ? 'bg-red-400' : 'bg-stone-400';
                      return (
                        <div key={sen.sentiment} className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs text-stone-500 w-16 capitalize">{sen.sentiment}</span>
                          <div className="flex-1 h-3 bg-stone-100 rounded-full overflow-hidden">
                            <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.5}} className={`h-full ${color} rounded-full`} />
                          </div>
                          <span className="text-xs text-stone-500 w-8 text-right">{sen.count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

{/* TOPICS + CHAT STATS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-2 border-indigo-100 shadow-md overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Hash className="w-5 h-5 text-indigo-500" />Top Conversation Topics</CardTitle>
                <CardDescription>Most discussed topics in AI chat (last 30 days)</CardDescription>
              </CardHeader>
              <CardContent>
                {topics.length > 0 ? (
                  <div className="space-y-2">
                    {topics.map((t: any, i: number) => (
                      <div key={t.topic} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-indigo-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg ${cls[i%cls.length]} flex items-center justify-center`}>
                            <span className="text-[10px] font-bold text-white">{i+1}</span>
                          </div>
                          <span className="text-sm text-stone-700 capitalize">{t.topic?.replace(/-/g,' ')||'General'}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">{t.count} chats</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <MessageSquare className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                    <p className="text-stone-400 text-sm">No topic data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-teal-100 shadow-md overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-teal-500" />Chat Statistics</CardTitle>
                <CardDescription>AI chat engagement metrics (last 30 days)</CardDescription>
              </CardHeader>
              <CardContent>
                {chat ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100">
                      <p className="text-xs text-teal-600 font-medium uppercase tracking-wider">Conversations</p>
                      <p className="text-2xl font-bold text-teal-900 mt-1">{Number(chat.totalConversations||0).toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100">
                      <p className="text-xs text-sky-600 font-medium uppercase tracking-wider">Messages</p>
                      <p className="text-2xl font-bold text-sky-900 mt-1">{Number(chat.totalMessages||0).toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
                      <p className="text-xs text-violet-600 font-medium uppercase tracking-wider">Avg/Conversation</p>
                      <p className="text-2xl font-bold text-violet-900 mt-1">{chat.avgMessagesPerConversation||0}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100">
                      <p className="text-xs text-rose-600 font-medium uppercase tracking-wider">Unique Visitors</p>
                      <p className="text-2xl font-bold text-rose-900 mt-1">{Number(chat.uniqueVisitors||0).toLocaleString()}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Target className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                    <p className="text-stone-400 text-sm">No chat stats available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

{/* RECENT ACTIVITY */}
          <Card className="border-2 border-emerald-100 shadow-md overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/30">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-emerald-900">Live Visitor Activity</CardTitle>
                    <CardDescription className="text-emerald-600">Real-time page views on your site</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">{acts.length} recent</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {acts.length > 0 ? (
                <div className="space-y-1">
                  {acts.map((a: any, i: number) => (
                    <motion.div key={i} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.03}}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-emerald-50/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 group-hover:bg-emerald-500 transition-colors" />
                        <Eye className="w-4 h-4 text-stone-400" />
                        <span className="text-sm text-stone-700 font-mono">{a.page}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {a.visitorId && <span className="text-[10px] text-stone-400 font-mono">{a.visitorId.slice(0,8)}...</span>}
                        <span className="text-xs text-stone-500">{new Date(a.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                    <Activity className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-emerald-700 font-medium">No recent activity</p>
                  <p className="text-sm text-emerald-500 mt-1">Visitor activity will appear here in real time</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
