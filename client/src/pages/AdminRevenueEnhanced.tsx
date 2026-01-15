import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, ShoppingBag, Calendar, RefreshCw, CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react";

function AnimatedCounter({ value, prefix = "" }: { value: number; prefix?: string }) {
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
  return <span>{prefix}{displayValue.toLocaleString()}</span>;
}

type Period = "today" | "week" | "month" | "year" | "all";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700", processing: "bg-blue-100 text-blue-700", confirmed: "bg-emerald-100 text-emerald-700",
  delivered: "bg-teal-100 text-teal-700", shipped: "bg-indigo-100 text-indigo-700", cancelled: "bg-red-100 text-red-700", refunded: "bg-stone-100 text-stone-700",
};

export default function AdminRevenueEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [period, setPeriod] = useState<Period>("month");

  const statsQuery = trpc.admin.revenue.stats.useQuery({ period });
  const transactionsQuery = trpc.admin.revenue.recentTransactions.useQuery({ limit: 20 });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  const formatPrice = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  const formatDate = (date: Date | string) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  const stats = statsQuery.data;
  const transactions = transactionsQuery.data?.transactions || [];

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
              <div><h1 className="text-2xl font-bold text-stone-900">Revenue</h1><p className="text-stone-500 text-sm">Track earnings and transactions</p></div>
              <div className="flex items-center gap-3">
                <Select value={period} onValueChange={(v: Period) => setPeriod(v)}><SelectTrigger className="w-40"><Calendar className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="week">This Week</SelectItem><SelectItem value="month">This Month</SelectItem><SelectItem value="year">This Year</SelectItem><SelectItem value="all">All Time</SelectItem></SelectContent></Select>
                <Button variant="outline" size="sm" onClick={() => { statsQuery.refetch(); transactionsQuery.refetch(); }}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div><p className="text-xs font-medium text-emerald-600">Total Revenue</p><p className="text-2xl font-bold text-emerald-900">{stats ? formatPrice(stats.totalRevenue || 0) : "$0"}</p></div>
                    <DollarSign className="w-8 h-8 text-emerald-500" />
                  </div>
                  {stats?.revenueChange !== undefined && (
                    <div className={`flex items-center gap-1 mt-2 text-xs ${stats.revenueChange >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {stats.revenueChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(stats.revenueChange)}% vs prev period
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div><p className="text-xs font-medium text-blue-600">Orders</p><p className="text-2xl font-bold text-blue-900"><AnimatedCounter value={stats?.orderCount || 0} /></p></div>
                    <ShoppingBag className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div><p className="text-xs font-medium text-amber-600">Avg Order Value</p><p className="text-2xl font-bold text-amber-900">{stats ? formatPrice(stats.avgOrderValue || 0) : "$0"}</p></div>
                    <CreditCard className="w-8 h-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div><p className="text-xs font-medium text-purple-600">Growth</p><p className="text-2xl font-bold text-purple-900">{stats?.revenueChange !== undefined ? `${stats.revenueChange >= 0 ? "+" : ""}${stats.revenueChange}%` : "N/A"}</p></div>
                    {stats?.revenueChange !== undefined && stats.revenueChange >= 0 ? <TrendingUp className="w-8 h-8 text-purple-500" /> : <TrendingDown className="w-8 h-8 text-purple-500" />}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
              {transactions.length === 0 ? (
                <div className="py-8 text-center text-stone-500">No transactions yet</div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx: any, i: number) => (
                    <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-stone-600" /></div>
                        <div>
                          <p className="font-medium">Order #{tx.orderNumber}</p>
                          <p className="text-sm text-stone-500">{tx.customerEmail || "Guest"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(tx.total || 0)}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[tx.status] || "bg-stone-100"}>{tx.status}</Badge>
                          <span className="text-xs text-stone-500">{formatDate(tx.createdAt)}</span>
                        </div>
                      </div>
                    </motion.div>
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
