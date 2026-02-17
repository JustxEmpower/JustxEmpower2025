import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminSidebar from "@/components/AdminSidebar";
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, ShoppingBag, Calendar, CreditCard, Package, Loader2, RefreshCw, Download } from "lucide-react";

type Period = "today" | "week" | "month" | "year" | "all";
const sc: Record<string,string> = {
  pending:"bg-yellow-100 text-yellow-800",processing:"bg-blue-100 text-blue-800",
  confirmed:"bg-green-100 text-green-800",delivered:"bg-emerald-100 text-emerald-800",
  shipped:"bg-indigo-100 text-indigo-800",cancelled:"bg-red-100 text-red-800",
  refunded:"bg-gray-100 text-gray-800",paid:"bg-green-100 text-green-800",
  failed:"bg-red-100 text-red-800",on_hold:"bg-orange-100 text-orange-800",
};

export default function AdminFinance() {
  const [,setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [period, setPeriod] = useState<Period>("month");
  const [pf, setPf] = useState("all");

  const statsQ = trpc.admin.revenue.stats.useQuery({ period });
  const txQ = trpc.admin.revenue.recentTransactions.useQuery({ limit: 30 });
  const ovQ = trpc.adminFinancial.overview.useQuery();
  const payQ = trpc.adminFinancial.payments.useQuery(pf !== "all" ? { status: pf } : undefined);

  useEffect(() => { if (!isChecking && !isAuthenticated) setLocation("/admin/login"); }, [isAuthenticated, isChecking, setLocation]);
  if (isChecking) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-neutral-400" /></div>;
  if (!isAuthenticated) return null;

  const fmt = (c: number) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(c/100);
  const fmtD = (d: Date|string) => new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"});
  const s = statsQ.data; const ov = ovQ.data;
  const txs = txQ.data?.transactions || [];
  const pays = payQ.data?.payments || [];
  const ps = payQ.data?.stats;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 flex">
      <AdminSidebar variant="dark" />
      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div><h1 className="text-2xl font-bold">Finance</h1><p className="text-stone-500 text-sm">Revenue, payments & analytics — powered by Stripe</p></div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { statsQ.refetch(); txQ.refetch(); ovQ.refetch(); payQ.refetch(); }}><RefreshCw className="w-4 h-4 mr-1" />Refresh</Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6">
              <div className="flex justify-end">
                <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {statsQ.isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-neutral-400" /></div> : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-emerald-600">Total Revenue</p>
                          <p className="text-2xl font-bold text-emerald-900">{fmt(s?.totalRevenue || 0)}</p>
                          {s?.percentChange !== undefined && s.percentChange !== 0 && (
                            <p className="text-xs flex items-center mt-1">
                              {s.percentChange > 0 ? <ArrowUpRight className="h-3 w-3 text-green-500" /> : <ArrowDownRight className="h-3 w-3 text-red-500" />}
                              <span className={s.percentChange > 0 ? "text-green-600" : "text-red-600"}>{Math.abs(s.percentChange)}%</span>
                            </p>
                          )}
                        </div>
                        <DollarSign className="w-8 h-8 text-emerald-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-blue-600">Shop Sales</p>
                          <p className="text-2xl font-bold text-blue-900">{fmt(s?.shopRevenue || 0)}</p>
                          <p className="text-xs text-blue-500">{s?.orderCount || 0} orders</p>
                        </div>
                        <ShoppingBag className="w-8 h-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-purple-600">Event Tickets</p>
                          <p className="text-2xl font-bold text-purple-900">{fmt(s?.eventRevenue || 0)}</p>
                          <p className="text-xs text-purple-500">{s?.registrationCount || 0} registrations</p>
                        </div>
                        <Calendar className="w-8 h-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-amber-600">Avg. Transaction</p>
                          <p className="text-2xl font-bold text-amber-900">{fmt(s && (s.orderCount+s.registrationCount)>0 ? s.totalRevenue/(s.orderCount+s.registrationCount) : 0)}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-amber-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* All-time & month comparison */}
                {ov && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card><CardContent className="p-4"><p className="text-xs text-stone-500">All-Time Revenue</p><p className="text-xl font-bold">{fmt(ov.allTimeRevenue)}</p></CardContent></Card>
                    <Card><CardContent className="p-4"><p className="text-xs text-stone-500">Last Month</p><p className="text-xl font-bold">{fmt(ov.lastMonthRevenue)}</p></CardContent></Card>
                    <Card><CardContent className="p-4"><p className="text-xs text-stone-500">Pending Shipments</p><p className="text-xl font-bold">{ov.pendingShipments}</p>{ov.pendingShipments > 0 && <Badge className="bg-orange-100 text-orange-800 mt-1">Needs attention</Badge>}</CardContent></Card>
                  </div>
                )}
              </>
              )}
            </TabsContent>

            {/* TRANSACTIONS TAB */}
            <TabsContent value="transactions">
              <Card>
                <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
                <CardContent>
                  {txQ.isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : txs.length > 0 ? (
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Type</TableHead><TableHead>Reference</TableHead><TableHead>Email</TableHead>
                        <TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {txs.map((tx: any) => (
                          <TableRow key={`${tx.type}-${tx.id}`} className="cursor-pointer hover:bg-stone-50" onClick={() => setLocation(tx.type === "order" ? "/admin/orders" : "/admin/events")}>
                            <TableCell><Badge variant="outline">{tx.type === "order" ? <><ShoppingBag className="h-3 w-3 mr-1 inline" />Order</> : <><Calendar className="h-3 w-3 mr-1 inline" />Event</>}</Badge></TableCell>
                            <TableCell className="font-mono text-sm font-medium">{tx.reference || "N/A"}</TableCell>
                            <TableCell>{tx.email}</TableCell>
                            <TableCell className="font-semibold">{fmt(tx.amount)}</TableCell>
                            <TableCell><Badge className={sc[tx.status] || "bg-gray-100"}>{tx.status}</Badge></TableCell>
                            <TableCell className="text-sm text-stone-500">{fmtD(tx.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12"><DollarSign className="h-12 w-12 mx-auto text-stone-300 mb-4" /><p className="text-stone-500">No transactions yet</p></div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* PAYMENTS TAB */}
            <TabsContent value="payments" className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="grid grid-cols-4 gap-4 flex-1 mr-4">
                  <Card><CardContent className="p-3 text-center"><p className="text-xs text-stone-500">Total</p><p className="text-lg font-bold">{ps?.total || 0}</p></CardContent></Card>
                  <Card><CardContent className="p-3 text-center"><p className="text-xs text-green-600">Paid</p><p className="text-lg font-bold text-green-700">{ps?.paid || 0}</p></CardContent></Card>
                  <Card><CardContent className="p-3 text-center"><p className="text-xs text-yellow-600">Pending</p><p className="text-lg font-bold text-yellow-700">{ps?.pending || 0}</p></CardContent></Card>
                  <Card><CardContent className="p-3 text-center"><p className="text-xs text-red-600">Failed</p><p className="text-lg font-bold text-red-700">{ps?.failed || 0}</p></CardContent></Card>
                </div>
                <Select value={pf} onValueChange={setPf}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Card>
                <CardContent className="p-0">
                  {payQ.isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : pays.length > 0 ? (
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Order #</TableHead><TableHead>Email</TableHead><TableHead>Amount</TableHead>
                        <TableHead>Payment</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {pays.map((p: any) => (
                          <TableRow key={p.id} className="cursor-pointer hover:bg-stone-50" onClick={() => setLocation("/admin/orders")}>
                            <TableCell className="font-mono text-sm font-medium">{p.orderNumber}</TableCell>
                            <TableCell>{p.email}</TableCell>
                            <TableCell className="font-semibold">{fmt(p.total)}</TableCell>
                            <TableCell><Badge className={sc[p.paymentStatus] || "bg-gray-100"}>{p.paymentStatus}</Badge></TableCell>
                            <TableCell><Badge variant="outline">{p.status}</Badge></TableCell>
                            <TableCell className="text-sm text-stone-500">{fmtD(p.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12"><CreditCard className="h-12 w-12 mx-auto text-stone-300 mb-4" /><p className="text-stone-500">No payments yet</p></div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
