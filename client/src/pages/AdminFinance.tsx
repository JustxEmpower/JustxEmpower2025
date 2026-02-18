import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, TrendingDown, ShoppingCart, Calendar, Users, AlertTriangle, Package, CreditCard, Activity, RefreshCw, Search, ArrowUpRight, ArrowDownRight, ShieldAlert, Clock, BarChart3, Eye, Download } from "lucide-react";

const fmt = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
const fmtN = (n: number) => new Intl.NumberFormat("en-US").format(n);
const pct = (n: number) => `${n >= 0 ? "+" : ""}${n}%`;
const timeAgo = (d: string) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const useTRPC = (path: string, input?: any) => {
  const adminToken = localStorage.getItem("adminToken") || "";
  return useQuery({
    queryKey: [path, input],
    queryFn: async () => {
      const params = input ? `?input=${encodeURIComponent(JSON.stringify(input))}` : "";
      const res = await fetch(`/api/trpc/${path}${params}`, { headers: { "x-admin-token": adminToken } });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.result?.data;
    },
  });
};

// === KPI CARD ===
function KpiCard({ title, value, subtitle, icon: Icon, trend, color = "emerald", large }: any) {
  return (
    <Card className={`relative overflow-hidden ${large ? "col-span-2" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className={`${large ? "text-3xl" : "text-2xl"} font-bold tracking-tight`}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`p-2.5 rounded-xl bg-${color}-500/10`}>
            <Icon className={`h-5 w-5 text-${color}-500`} />
          </div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center mt-2 text-xs font-medium ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
            {pct(trend)} vs last month
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// === MINI BAR CHART (CSS) ===
function MiniChart({ data, height = 60 }: { data: { value: number; label: string }[]; height?: number }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-[2px]" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 group relative">
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
            {fmt(d.value)} · {d.label}
          </div>
          <div
            className="w-full bg-emerald-500/80 hover:bg-emerald-400 rounded-t transition-all cursor-pointer"
            style={{ height: `${Math.max((d.value / max) * 100, 2)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

// === PAYMENT HEALTH GAUGE ===
function HealthGauge({ rate, label }: { rate: number; label: string }) {
  const color = rate >= 90 ? "emerald" : rate >= 70 ? "yellow" : "red";
  return (
    <div className="text-center">
      <div className="relative w-20 h-20 mx-auto">
        <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke={color === "emerald" ? "#10b981" : color === "yellow" ? "#eab308" : "#ef4444"} strokeWidth="3" strokeDasharray={`${rate} ${100 - rate}`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{rate}%</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

// === STATUS BADGE ===
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-700", confirmed: "bg-emerald-100 text-emerald-700",
    pending: "bg-yellow-100 text-yellow-700", processing: "bg-blue-100 text-blue-700",
    failed: "bg-red-100 text-red-700", refunded: "bg-orange-100 text-orange-700",
    partially_refunded: "bg-orange-100 text-orange-700", disputed: "bg-red-100 text-red-700",
    shipped: "bg-indigo-100 text-indigo-700", delivered: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-gray-100 text-gray-700",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${colors[status] || "bg-gray-100 text-gray-600"}`}>{status.replace("_", " ")}</span>;
}

// === MAIN COMPONENT ===
export default function AdminFinance() {
  const [activeTab, setActiveTab] = useState("command-center");
  const [txSearch, setTxSearch] = useState("");
  const [txFilter, setTxFilter] = useState("all");

  const { data: cc, refetch: refetchCC, isLoading: ccLoading } = useTRPC("adminCommand.commandCenter");
  const { data: trend } = useTRPC("adminCommand.revenueByDay", { days: 30 });
  const { data: topProducts } = useTRPC("adminCommand.revenueByProduct", { limit: 10 });
  const { data: customers } = useTRPC("adminCommand.topCustomers", { limit: 15 });
  const { data: activity } = useTRPC("adminCommand.activityFeed", { limit: 30 });
  const { data: payments } = useTRPC("adminFinancial.payments");
  const { data: lowStock } = useTRPC("adminCommand.lowStockAlerts");
  const { data: abandoned } = useTRPC("adminCommand.abandonedCarts");

  const refreshAll = () => { refetchCC(); };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-emerald-500" />
            Financial Command Center
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time revenue intelligence · Powered by Stripe</p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshAll} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="command-center" className="text-xs gap-1"><Activity className="h-3 w-3" /> Command Center</TabsTrigger>
          <TabsTrigger value="revenue" className="text-xs gap-1"><TrendingUp className="h-3 w-3" /> Revenue</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs gap-1"><DollarSign className="h-3 w-3" /> Transactions</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs gap-1"><CreditCard className="h-3 w-3" /> Payments</TabsTrigger>
          <TabsTrigger value="customers" className="text-xs gap-1"><Users className="h-3 w-3" /> Customers</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" /> Alerts</TabsTrigger>
        </TabsList>

        {/* ========== TAB 1: COMMAND CENTER ========== */}
        <TabsContent value="command-center" className="space-y-4 mt-4">
          {ccLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">Loading command center...</div>
          ) : cc ? (
            <>
              {/* KPI ROW 1: Revenue by period */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <KpiCard title="Today" value={fmt(cc.todayRevenue)} subtitle={`${fmtN(cc.todayOrders)} orders`} icon={Clock} color="blue" />
                <KpiCard title="This Week" value={fmt(cc.weekRevenue)} subtitle={`${fmtN(cc.weekOrders)} orders`} icon={Calendar} color="indigo" />
                <KpiCard title="This Month" value={fmt(cc.monthRevenue)} subtitle={`${fmtN(cc.monthOrders)} orders`} icon={TrendingUp} color="emerald" trend={cc.monthChange} />
                <KpiCard title="This Year" value={fmt(cc.yearRevenue)} subtitle={`${fmtN(cc.yearOrders)} orders`} icon={BarChart3} color="purple" />
                <KpiCard title="All Time" value={fmt(cc.allTimeRevenue)} subtitle={`${fmtN(cc.allTimeOrders)} orders`} icon={DollarSign} color="amber" />
              </div>

              {/* ROW 2: Channel + Health + Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Channel Breakdown */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Revenue by Channel</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Shop Sales</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{fmt(cc.shopRevenue)}</p>
                        <p className="text-[10px] text-muted-foreground">{fmtN(cc.shopOrders)} orders</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${cc.allTimeRevenue > 0 ? (cc.shopRevenue / cc.allTimeRevenue) * 100 : 0}%` }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">Event Tickets</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{fmt(cc.eventRevenue)}</p>
                        <p className="text-[10px] text-muted-foreground">{fmtN(cc.eventRegistrations)} registrations</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${cc.allTimeRevenue > 0 ? (cc.eventRevenue / cc.allTimeRevenue) * 100 : 0}%` }} />
                    </div>
                    <div className="pt-2 border-t flex justify-between text-xs text-muted-foreground">
                      <span>Avg. Transaction</span>
                      <span className="font-semibold text-foreground">{fmt(cc.avgOrderValue)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Health */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Payment Health</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-around mb-3">
                      <HealthGauge rate={cc.paymentHealth.successRate} label="Success Rate" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between p-1.5 bg-emerald-50 rounded"><span>Paid</span><span className="font-bold text-emerald-700">{fmtN(cc.paymentHealth.paid)}</span></div>
                      <div className="flex justify-between p-1.5 bg-yellow-50 rounded"><span>Pending</span><span className="font-bold text-yellow-700">{fmtN(cc.paymentHealth.pending)}</span></div>
                      <div className="flex justify-between p-1.5 bg-red-50 rounded"><span>Failed</span><span className="font-bold text-red-700">{fmtN(cc.paymentHealth.failed)}</span></div>
                      <div className="flex justify-between p-1.5 bg-orange-50 rounded"><span>Refunded</span><span className="font-bold text-orange-700">{fmtN(cc.paymentHealth.refunded)}</span></div>
                    </div>
                    {cc.paymentHealth.disputed > 0 && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-xs text-red-700">
                        <ShieldAlert className="h-3.5 w-3.5" /> {cc.paymentHealth.disputed} active dispute{cc.paymentHealth.disputed > 1 ? "s" : ""}
                      </div>
                    )}
                    {cc.paymentHealth.refundedAmount > 0 && (
                      <p className="mt-2 text-[10px] text-muted-foreground">Total refunded: {fmt(cc.paymentHealth.refundedAmount)}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Action Items */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Action Items</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <ActionItem icon={Package} label="Pending Shipments" count={cc.pendingShipments} color="blue" urgent={cc.pendingShipments > 0} />
                    <ActionItem icon={Clock} label="Pending Orders" count={cc.pendingOrders} color="yellow" urgent={cc.pendingOrders > 0} />
                    <ActionItem icon={AlertTriangle} label="Low Stock Products" count={cc.lowStockProducts} color="red" urgent={cc.lowStockProducts > 0} />
                    {abandoned && <ActionItem icon={ShoppingCart} label="Abandoned Carts" count={abandoned.count} color="orange" subtitle={abandoned.totalValue > 0 ? `${fmt(abandoned.totalValue)} potential` : undefined} />}
                  </CardContent>
                </Card>
              </div>

              {/* ROW 3: 30-Day Trend + Activity Feed */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-2">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">30-Day Revenue Trend</CardTitle></CardHeader>
                  <CardContent>
                    {trend && trend.length > 0 ? (
                      <MiniChart data={trend.map((d: any) => ({ value: d.totalRevenue, label: d.date }))} height={100} />
                    ) : (
                      <p className="text-sm text-muted-foreground py-8 text-center">No revenue data yet</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Live Activity</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {activity && activity.length > 0 ? activity.slice(0, 8).map((a: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs border-b pb-1.5 last:border-0">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.paymentStatus === "paid" ? "bg-emerald-500" : a.paymentStatus === "failed" ? "bg-red-500" : "bg-yellow-500"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium">{a.type === "order" ? "Order" : "Event"} {a.ref}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{a.email}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold">{fmt(a.amount)}</p>
                            <p className="text-[10px] text-muted-foreground">{timeAgo(a.createdAt)}</p>
                          </div>
                        </div>
                      )) : <p className="text-xs text-muted-foreground text-center py-4">No activity yet</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </TabsContent>

        {/* ========== TAB 2: REVENUE INTELLIGENCE ========== */}
        <TabsContent value="revenue" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Revenue Trend Chart */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Daily Revenue (Last 30 Days)</CardTitle></CardHeader>
              <CardContent>
                {trend && trend.length > 0 ? (
                  <>
                    <MiniChart data={trend.map((d: any) => ({ value: d.totalRevenue, label: d.date }))} height={140} />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>{trend[0]?.date}</span>
                      <span>{trend[trend.length - 1]?.date}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t text-xs">
                      <div><p className="text-muted-foreground">Total</p><p className="font-bold">{fmt(trend.reduce((s: number, d: any) => s + d.totalRevenue, 0))}</p></div>
                      <div><p className="text-muted-foreground">Best Day</p><p className="font-bold">{fmt(Math.max(...trend.map((d: any) => d.totalRevenue)))}</p></div>
                      <div><p className="text-muted-foreground">Avg/Day</p><p className="font-bold">{fmt(Math.round(trend.reduce((s: number, d: any) => s + d.totalRevenue, 0) / trend.length))}</p></div>
                    </div>
                  </>
                ) : <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p>}
              </CardContent>
            </Card>

            {/* Channel Split */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Channel Split (30 Days)</CardTitle></CardHeader>
              <CardContent>
                {trend && trend.length > 0 ? (() => {
                  const shopTotal = trend.reduce((s: number, d: any) => s + d.shopRevenue, 0);
                  const eventTotal = trend.reduce((s: number, d: any) => s + d.eventRevenue, 0);
                  const total = shopTotal + eventTotal;
                  return (
                    <div className="space-y-4">
                      <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
                        {total > 0 && <div className="bg-blue-500 transition-all" style={{ width: `${(shopTotal / total) * 100}%` }} />}
                        {total > 0 && <div className="bg-purple-500 transition-all" style={{ width: `${(eventTotal / total) * 100}%` }} />}
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-500" /> Shop</div>
                          <div className="text-right"><p className="font-bold">{fmt(shopTotal)}</p><p className="text-[10px] text-muted-foreground">{total > 0 ? Math.round((shopTotal / total) * 100) : 0}%</p></div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-purple-500" /> Events</div>
                          <div className="text-right"><p className="font-bold">{fmt(eventTotal)}</p><p className="text-[10px] text-muted-foreground">{total > 0 ? Math.round((eventTotal / total) * 100) : 0}%</p></div>
                        </div>
                      </div>
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground">Shop Orders: <span className="font-semibold text-foreground">{fmtN(trend.reduce((s: number, d: any) => s + d.shopOrders, 0))}</span></p>
                        <p className="text-xs text-muted-foreground">Event Regs: <span className="font-semibold text-foreground">{fmtN(trend.reduce((s: number, d: any) => s + d.eventOrders, 0))}</span></p>
                      </div>
                    </div>
                  );
                })() : <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p>}
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Top Products by Revenue</CardTitle></CardHeader>
            <CardContent>
              {topProducts && topProducts.length > 0 ? (
                <div className="space-y-2">
                  {topProducts.map((p: any, i: number) => {
                    const maxRev = topProducts[0].totalRevenue;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center"><Package className="h-4 w-4 text-gray-400" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                            <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${(p.totalRevenue / maxRev) * 100}%` }} />
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold">{fmt(p.totalRevenue)}</p>
                          <p className="text-[10px] text-muted-foreground">{fmtN(p.totalQty)} sold · {fmtN(p.orderCount)} orders</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-sm text-muted-foreground py-4 text-center">No product sales yet</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== TAB 3: TRANSACTIONS ========== */}
        <TabsContent value="transactions" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">All Transactions</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search by email, order #..." className="pl-8 h-8 text-xs w-52" value={txSearch} onChange={(e) => setTxSearch(e.target.value)} />
                  </div>
                  <Select value={txFilter} onValueChange={setTxFilter}>
                    <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="order">Shop Orders</SelectItem>
                      <SelectItem value="event">Event Tickets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activity && activity.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Type</th>
                        <th className="pb-2 font-medium">Reference</th>
                        <th className="pb-2 font-medium">Customer</th>
                        <th className="pb-2 font-medium">Amount</th>
                        <th className="pb-2 font-medium">Payment</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Stripe ID</th>
                        <th className="pb-2 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activity.filter((a: any) => {
                        if (txFilter !== "all" && a.type !== txFilter) return false;
                        if (txSearch) {
                          const s = txSearch.toLowerCase();
                          return (a.email?.toLowerCase().includes(s) || a.ref?.toLowerCase().includes(s) || a.paymentIntentId?.toLowerCase().includes(s));
                        }
                        return true;
                      }).map((a: any, i: number) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2"><Badge variant={a.type === "order" ? "default" : "secondary"} className="text-[10px]">{a.type === "order" ? "Shop" : "Event"}</Badge></td>
                          <td className="py-2 font-mono font-medium">{a.ref}</td>
                          <td className="py-2 max-w-[150px] truncate">{a.email}</td>
                          <td className="py-2 font-bold">{fmt(a.amount)}</td>
                          <td className="py-2"><StatusBadge status={a.paymentStatus} /></td>
                          <td className="py-2"><StatusBadge status={a.status} /></td>
                          <td className="py-2 font-mono text-[10px] text-muted-foreground max-w-[120px] truncate">{a.paymentIntentId || "—"}</td>
                          <td className="py-2 text-muted-foreground whitespace-nowrap">{new Date(a.createdAt).toLocaleDateString()} {new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-sm text-muted-foreground py-8 text-center">No transactions yet</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== TAB 4: PAYMENTS ========== */}
        <TabsContent value="payments" className="space-y-4 mt-4">
          {/* Payment Stats */}
          {payments?.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard title="Total Payments" value={fmtN(Number(payments.stats.total))} icon={CreditCard} color="blue" />
              <KpiCard title="Successful" value={fmtN(Number(payments.stats.paid))} icon={TrendingUp} color="emerald" />
              <KpiCard title="Pending" value={fmtN(Number(payments.stats.pending))} icon={Clock} color="yellow" />
              <KpiCard title="Failed" value={fmtN(Number(payments.stats.failed))} icon={AlertTriangle} color="red" />
            </div>
          )}
          {/* Payment Health Visual */}
          {cc?.paymentHealth && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Payment Health Overview</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <HealthGauge rate={cc.paymentHealth.successRate} label="Success Rate" />
                  <div className="flex-1 space-y-2">
                    {[
                      { label: "Paid", val: cc.paymentHealth.paid, total: cc.paymentHealth.total, color: "bg-emerald-500" },
                      { label: "Pending", val: cc.paymentHealth.pending, total: cc.paymentHealth.total, color: "bg-yellow-500" },
                      { label: "Failed", val: cc.paymentHealth.failed, total: cc.paymentHealth.total, color: "bg-red-500" },
                      { label: "Refunded", val: cc.paymentHealth.refunded, total: cc.paymentHealth.total, color: "bg-orange-500" },
                    ].map((b, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="w-16 text-muted-foreground">{b.label}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2"><div className={`${b.color} h-2 rounded-full`} style={{ width: `${b.total > 0 ? (b.val / b.total) * 100 : 0}%` }} /></div>
                        <span className="w-8 text-right font-semibold">{fmtN(b.val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Payments List */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Payment Records</CardTitle></CardHeader>
            <CardContent>
              {payments?.payments && payments.payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Order #</th><th className="pb-2 font-medium">Customer</th>
                      <th className="pb-2 font-medium">Amount</th><th className="pb-2 font-medium">Payment Status</th>
                      <th className="pb-2 font-medium">Method</th><th className="pb-2 font-medium">Stripe Payment ID</th>
                      <th className="pb-2 font-medium">Date</th>
                    </tr></thead>
                    <tbody>
                      {payments.payments.map((p: any) => (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2 font-mono font-medium">{p.orderNumber}</td>
                          <td className="py-2 max-w-[150px] truncate">{p.email}</td>
                          <td className="py-2 font-bold">{fmt(p.total)}</td>
                          <td className="py-2"><StatusBadge status={p.paymentStatus} /></td>
                          <td className="py-2 capitalize">{p.paymentMethod || "—"}</td>
                          <td className="py-2 font-mono text-[10px] text-muted-foreground max-w-[160px] truncate">{p.paymentIntentId || "—"}</td>
                          <td className="py-2 text-muted-foreground whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-sm text-muted-foreground py-4 text-center">No payment records</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== TAB 5: CUSTOMERS ========== */}
        <TabsContent value="customers" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Top Customers by Revenue</CardTitle></CardHeader>
            <CardContent>
              {customers && customers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">#</th><th className="pb-2 font-medium">Customer</th>
                      <th className="pb-2 font-medium">Total Spent</th><th className="pb-2 font-medium">Orders</th>
                      <th className="pb-2 font-medium">Avg. Order</th><th className="pb-2 font-medium">Last Order</th>
                      <th className="pb-2 font-medium">Loyalty</th>
                    </tr></thead>
                    <tbody>
                      {customers.map((c: any, i: number) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2.5 font-bold text-muted-foreground">{i + 1}</td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                {c.email?.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium truncate max-w-[180px]">{c.email}</span>
                            </div>
                          </td>
                          <td className="py-2.5 font-bold text-emerald-600">{fmt(c.totalSpent)}</td>
                          <td className="py-2.5">{fmtN(c.orderCount)}</td>
                          <td className="py-2.5">{fmt(c.avgOrder)}</td>
                          <td className="py-2.5 text-muted-foreground">{c.lastOrder ? new Date(c.lastOrder).toLocaleDateString() : "—"}</td>
                          <td className="py-2.5">
                            {c.orderCount >= 5 ? <Badge className="bg-amber-100 text-amber-700 text-[10px]">VIP</Badge> :
                             c.orderCount >= 3 ? <Badge className="bg-blue-100 text-blue-700 text-[10px]">Loyal</Badge> :
                             c.orderCount >= 2 ? <Badge className="bg-green-100 text-green-700 text-[10px]">Returning</Badge> :
                             <Badge variant="outline" className="text-[10px]">New</Badge>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-sm text-muted-foreground py-8 text-center">No customer data yet</p>}
            </CardContent>
          </Card>

          {/* Customer Insights */}
          {customers && customers.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard title="Total Customers" value={fmtN(customers.length)} icon={Users} color="blue" />
              <KpiCard title="Top Customer Spend" value={fmt(customers[0]?.totalSpent || 0)} subtitle={customers[0]?.email} icon={DollarSign} color="emerald" />
              <KpiCard title="Avg. Customer Value" value={fmt(Math.round(customers.reduce((s: number, c: any) => s + c.totalSpent, 0) / customers.length))} icon={TrendingUp} color="purple" />
              <KpiCard title="Repeat Buyers" value={fmtN(customers.filter((c: any) => c.orderCount > 1).length)} subtitle={`${Math.round((customers.filter((c: any) => c.orderCount > 1).length / customers.length) * 100)}% repeat rate`} icon={ArrowUpRight} color="amber" />
            </div>
          )}
        </TabsContent>

        {/* ========== TAB 6: ALERTS ========== */}
        <TabsContent value="alerts" className="space-y-4 mt-4">
          {/* Urgent Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Low Stock */}
            <Card className={lowStock && lowStock.length > 0 ? "border-red-200" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${lowStock && lowStock.length > 0 ? "text-red-500" : "text-muted-foreground"}`} />
                  Low Stock Products
                  {lowStock && lowStock.length > 0 && <Badge variant="destructive" className="text-[10px]">{lowStock.length}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStock && lowStock.length > 0 ? (
                  <div className="space-y-2">
                    {lowStock.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-2 p-2 rounded bg-red-50 border border-red-100">
                        {p.featuredImage ? (
                          <img src={p.featuredImage} alt="" className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center"><Package className="h-4 w-4 text-gray-400" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{p.name}</p>
                          {p.sku && <p className="text-[10px] text-muted-foreground">SKU: {p.sku}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-600">{p.stock} left</p>
                          <p className="text-[10px] text-muted-foreground">Threshold: {p.lowStockThreshold}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Package className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">All products well stocked</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Abandoned Carts */}
            <Card className={abandoned && abandoned.count > 0 ? "border-orange-200" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShoppingCart className={`h-4 w-4 ${abandoned && abandoned.count > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
                  Abandoned Carts
                  {abandoned && abandoned.count > 0 && <Badge className="bg-orange-100 text-orange-700 text-[10px]">{abandoned.count}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {abandoned && abandoned.count > 0 ? (
                  <div className="text-center py-6">
                    <p className="text-3xl font-bold text-orange-600">{fmtN(abandoned.count)}</p>
                    <p className="text-sm text-muted-foreground mt-1">carts abandoned</p>
                    <p className="text-lg font-bold text-orange-500 mt-2">{fmt(abandoned.totalValue)}</p>
                    <p className="text-xs text-muted-foreground">potential revenue left on table</p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <ShoppingCart className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No abandoned carts</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pending Actions Summary */}
          {cc && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Pending Actions Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className={`p-3 rounded-lg border ${cc.pendingShipments > 0 ? "bg-blue-50 border-blue-200" : "bg-gray-50"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Package className={`h-4 w-4 ${cc.pendingShipments > 0 ? "text-blue-500" : "text-gray-400"}`} />
                      <span className="text-xs font-medium">Pending Shipments</span>
                    </div>
                    <p className={`text-2xl font-bold ${cc.pendingShipments > 0 ? "text-blue-600" : "text-gray-400"}`}>{cc.pendingShipments}</p>
                    {cc.pendingShipments > 0 && <p className="text-[10px] text-blue-600 mt-1">Needs attention</p>}
                  </div>
                  <div className={`p-3 rounded-lg border ${cc.pendingOrders > 0 ? "bg-yellow-50 border-yellow-200" : "bg-gray-50"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className={`h-4 w-4 ${cc.pendingOrders > 0 ? "text-yellow-500" : "text-gray-400"}`} />
                      <span className="text-xs font-medium">Pending Orders</span>
                    </div>
                    <p className={`text-2xl font-bold ${cc.pendingOrders > 0 ? "text-yellow-600" : "text-gray-400"}`}>{cc.pendingOrders}</p>
                    {cc.pendingOrders > 0 && <p className="text-[10px] text-yellow-600 mt-1">Awaiting processing</p>}
                  </div>
                  <div className={`p-3 rounded-lg border ${cc.paymentHealth.disputed > 0 ? "bg-red-50 border-red-200" : "bg-gray-50"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldAlert className={`h-4 w-4 ${cc.paymentHealth.disputed > 0 ? "text-red-500" : "text-gray-400"}`} />
                      <span className="text-xs font-medium">Active Disputes</span>
                    </div>
                    <p className={`text-2xl font-bold ${cc.paymentHealth.disputed > 0 ? "text-red-600" : "text-gray-400"}`}>{cc.paymentHealth.disputed}</p>
                    {cc.paymentHealth.disputed > 0 && <p className="text-[10px] text-red-600 mt-1">Requires immediate action</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// === ACTION ITEM COMPONENT ===
function ActionItem({ icon: Icon, label, count, color, urgent, subtitle }: any) {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${urgent ? `bg-${color}-50 border-${color}-200` : "bg-gray-50 border-gray-100"}`}>
      <Icon className={`h-4 w-4 ${urgent ? `text-${color}-500` : "text-gray-400"}`} />
      <div className="flex-1">
        <p className="text-xs font-medium">{label}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
      </div>
      <span className={`text-sm font-bold ${urgent ? `text-${color}-600` : "text-gray-400"}`}>{count}</span>
    </div>
  );
}
