import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, ShoppingBag, Users, Calendar, RefreshCw, ArrowUpRight, ArrowDownRight, CreditCard, Percent } from "lucide-react";

function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
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
  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
}

export default function AdminFinancialAnalyticsEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [period, setPeriod] = useState("month");

  const analyticsQuery = { data: { revenue: 0, orders: 0, avgOrderValue: 0, conversionRate: 0, revenueChange: 0, ordersChange: 0 }, refetch: () => {} };
  const data = analyticsQuery.data || { revenue: 0, orders: 0, avgOrderValue: 0, conversionRate: 0, revenueChange: 0, ordersChange: 0 };

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

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
              <div><h1 className="text-2xl font-bold text-stone-900">Financial Analytics</h1><p className="text-stone-500 text-sm">Business performance insights</p></div>
              <div className="flex items-center gap-3">
                <Select value={period} onValueChange={setPeriod}><SelectTrigger className="w-40"><Calendar className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="week">This Week</SelectItem><SelectItem value="month">This Month</SelectItem><SelectItem value="quarter">This Quarter</SelectItem><SelectItem value="year">This Year</SelectItem></SelectContent></Select>
                <Button variant="outline" size="sm" onClick={() => analyticsQuery.refetch?.()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div><p className="text-xs font-medium text-emerald-600">Total Revenue</p><p className="text-2xl font-bold text-emerald-900"><AnimatedCounter value={(data.revenue || 0) / 100} prefix="$" /></p></div>
                    <DollarSign className="w-8 h-8 text-emerald-500" />
                  </div>
                  {data.revenueChange !== undefined && (
                    <div className={`flex items-center gap-1 mt-2 text-xs ${data.revenueChange >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {data.revenueChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(data.revenueChange)}% vs prev period
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div><p className="text-xs font-medium text-blue-600">Total Orders</p><p className="text-2xl font-bold text-blue-900"><AnimatedCounter value={data.orders || 0} /></p></div>
                    <ShoppingBag className="w-8 h-8 text-blue-500" />
                  </div>
                  {data.ordersChange !== undefined && (
                    <div className={`flex items-center gap-1 mt-2 text-xs ${data.ordersChange >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {data.ordersChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(data.ordersChange)}% vs prev period
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div><p className="text-xs font-medium text-amber-600">Avg Order Value</p><p className="text-2xl font-bold text-amber-900"><AnimatedCounter value={(data.avgOrderValue || 0) / 100} prefix="$" /></p></div>
                    <CreditCard className="w-8 h-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div><p className="text-xs font-medium text-purple-600">Conversion Rate</p><p className="text-2xl font-bold text-purple-900"><AnimatedCounter value={data.conversionRate || 0} suffix="%" /></p></div>
                    <Percent className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-500" />Revenue Trend</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center bg-stone-50 rounded-lg">
                    <div className="text-center text-stone-500">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                      <p>Revenue chart visualization</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-blue-500" />Orders Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center bg-stone-50 rounded-lg">
                    <div className="text-center text-stone-500">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                      <p>Orders breakdown visualization</p>
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
