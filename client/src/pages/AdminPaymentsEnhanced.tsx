import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from "framer-motion";
import { CreditCard, DollarSign, Search, RefreshCw, Filter, CheckCircle, Clock, XCircle, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

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

const statusColors: Record<string, string> = {
  succeeded: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-stone-100 text-stone-700",
};

export default function AdminPaymentsEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const paymentsQuery = (trpc.admin as any).payments?.list?.useQuery?.({ limit: 50 }) || { data: { payments: [], total: 0 }, refetch: () => {} };
  const payments = paymentsQuery.data?.payments || [];

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  const stats = useMemo(() => ({
    total: payments.length,
    succeeded: payments.filter((p: any) => p.status === "succeeded").length,
    pending: payments.filter((p: any) => p.status === "pending").length,
    totalAmount: payments.filter((p: any) => p.status === "succeeded").reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
  }), [payments]);

  const filteredPayments = useMemo(() => payments.filter((p: any) => {
    const matchesSearch = searchQuery === "" || p.email?.toLowerCase().includes(searchQuery.toLowerCase()) || p.id?.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [payments, searchQuery, statusFilter]);

  const formatPrice = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  const formatDate = (date: Date | string) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

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
              <div><h1 className="text-2xl font-bold text-stone-900">Payments</h1><p className="text-stone-500 text-sm">Track payment transactions</p></div>
              <Button variant="outline" size="sm" onClick={() => paymentsQuery.refetch?.()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Total Payments", value: stats.total, icon: CreditCard, color: "amber" },
              { label: "Succeeded", value: stats.succeeded, icon: CheckCircle, color: "emerald" },
              { label: "Pending", value: stats.pending, icon: Clock, color: "blue" },
              { label: "Total Collected", value: stats.totalAmount / 100, prefix: "$", icon: DollarSign, color: "purple" },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100/50 border-${stat.color}-200`}>
                  <CardContent className="p-5"><div className="flex items-center justify-between"><div><p className={`text-xs font-medium text-${stat.color}-600`}>{stat.label}</p><p className={`text-2xl font-bold text-${stat.color}-900`}><AnimatedCounter value={stat.value} prefix={stat.prefix} /></p></div><stat.icon className={`w-8 h-8 text-${stat.color}-500`} /></div></CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" /><Input placeholder="Search payments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-36"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="succeeded">Succeeded</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="failed">Failed</SelectItem><SelectItem value="refunded">Refunded</SelectItem></SelectContent></Select>
          </div>

          {filteredPayments.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><CreditCard className="w-12 h-12 mx-auto text-stone-400 mb-4" /><h3 className="text-lg font-medium mb-2">No Payments</h3><p className="text-stone-500">{searchQuery || statusFilter !== "all" ? "Try adjusting filters" : "No payment transactions yet"}</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filteredPayments.map((payment: any, i: number) => (
                <motion.div key={payment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                        {payment.status === "succeeded" ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : payment.status === "failed" ? <XCircle className="w-5 h-5 text-red-600" /> : <Clock className="w-5 h-5 text-amber-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1"><span className="font-medium">{payment.email || "Guest"}</span><Badge className={statusColors[payment.status] || "bg-stone-100"}>{payment.status}</Badge></div>
                        <p className="text-sm text-stone-500">{payment.id} • {formatDate(payment.createdAt)}</p>
                      </div>
                      <div className="text-right"><p className="text-lg font-semibold">{formatPrice(payment.amount || 0)}</p><p className="text-xs text-stone-500">{payment.type || "Payment"}</p></div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
