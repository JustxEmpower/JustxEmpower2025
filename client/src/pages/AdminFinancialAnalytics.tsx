import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminSidebar from '@/components/AdminSidebar';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Calendar, Package, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";

export default function AdminFinancialAnalytics() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const overviewQuery = trpc.adminFinancial.overview.useQuery();

  useEffect(() => { if (!isChecking && !isAuthenticated) setLocation("/admin/login"); }, [isAuthenticated, isChecking, setLocation]);
  if (isChecking) return <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950"><Loader2 className="h-8 w-8 animate-spin text-neutral-400" /></div>;
  if (!isAuthenticated) return null;

  const fmt = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  const d = overviewQuery.data;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      <AdminSidebar variant="light" />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-light tracking-tight">Financial Analytics</h1>
              <p className="text-neutral-500 mt-1">Comprehensive financial insights and reports</p>
            </div>
          </div>

          {overviewQuery.isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-neutral-400" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gross Revenue (This Month)</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{fmt(d?.monthRevenue || 0)}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      {d?.monthChange !== undefined && d.monthChange !== 0 && (
                        <>
                          {d.monthChange > 0 ? <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" /> : <ArrowDownRight className="h-3 w-3 mr-1 text-red-500" />}
                          <span className={d.monthChange > 0 ? "text-green-600" : "text-red-600"}>{Math.abs(d.monthChange)}%</span>
                          <span className="ml-1">vs last month</span>
                        </>
                      )}
                      {(!d?.monthChange || d.monthChange === 0) && <span>This month</span>}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Product Sales</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{fmt(d?.monthShopRevenue || 0)}</div>
                    <p className="text-xs text-muted-foreground">{d?.monthShopOrders || 0} orders this month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Event Revenue</CardTitle>
                    <Calendar className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{fmt(d?.monthEventRevenue || 0)}</div>
                    <p className="text-xs text-muted-foreground">{d?.monthEventRegs || 0} registrations this month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                    <TrendingUp className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{fmt(d?.avgOrderValue || 0)}</div>
                    <p className="text-xs text-muted-foreground">Per transaction</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">All-Time Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{fmt(d?.allTimeRevenue || 0)}</div>
                    <p className="text-xs text-muted-foreground">Lifetime earnings</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Last Month Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-slate-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{fmt(d?.lastMonthRevenue || 0)}</div>
                    <p className="text-xs text-muted-foreground">Previous month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Shipments</CardTitle>
                    <Package className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{d?.pendingShipments || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {(d?.pendingShipments || 0) > 0 ? (
                        <Badge className="bg-orange-100 text-orange-800">Needs attention</Badge>
                      ) : "All shipped"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
