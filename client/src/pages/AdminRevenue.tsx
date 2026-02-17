import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminSidebar from '@/components/AdminSidebar';
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, ShoppingBag, Calendar, Loader2, ExternalLink, RefreshCw } from "lucide-react";

type Period = "today" | "week" | "month" | "year" | "all";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  delivered: "bg-emerald-100 text-emerald-800",
  shipped: "bg-indigo-100 text-indigo-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
  paid: "bg-green-100 text-green-800",
  on_hold: "bg-orange-100 text-orange-800",
};

export default function AdminRevenue() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [period, setPeriod] = useState<Period>("month");

  const statsQuery = trpc.admin.revenue.stats.useQuery({ period });
  const transactionsQuery = trpc.admin.revenue.recentTransactions.useQuery({ limit: 20 });

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

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const stats = statsQuery.data;
  const transactions = transactionsQuery.data?.transactions || [];

  const periodLabels: Record<Period, string> = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    year: "This Year",
    all: "All Time",
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      <AdminSidebar variant="light" />

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-light tracking-tight">Revenue</h1>
              <p className="text-neutral-500 mt-1">Track your earnings and revenue streams</p>
            </div>
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {statsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatPrice(stats?.totalRevenue || 0)}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      {stats?.percentChange !== undefined && stats.percentChange !== 0 && (
                        <>
                          {stats.percentChange > 0 ? (
                            <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 mr-1 text-red-500" />
                          )}
                          <span className={stats.percentChange > 0 ? "text-green-600" : "text-red-600"}>
                            {Math.abs(stats.percentChange)}%
                          </span>
                          <span className="ml-1">vs previous {period}</span>
                        </>
                      )}
                      {(stats?.percentChange === undefined || stats.percentChange === 0) && (
                        <span>{periodLabels[period]}</span>
                      )}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Product Sales</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatPrice(stats?.shopRevenue || 0)}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.orderCount || 0} orders
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Event Tickets</CardTitle>
                    <Calendar className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatPrice(stats?.eventRevenue || 0)}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.registrationCount || 0} registrations
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Transaction</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatPrice(
                        stats && (stats.orderCount + stats.registrationCount) > 0
                          ? stats.totalRevenue / (stats.orderCount + stats.registrationCount)
                          : 0
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Per transaction</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                  <CardTitle>Recent Transactions</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => transactionsQuery.refetch()}>
                    <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                  </Button>
                </div>
                </CardHeader>
                <CardContent>
                  {transactionsQuery.isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                    </div>
                  ) : transactions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx: any) => (
                          <TableRow
                            key={`${tx.type}-${tx.id}`}
                            className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900"
                            onClick={() => setLocation(tx.type === "order" ? "/admin/orders" : "/admin/events")}
                          >
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {tx.type === "order" ? (
                                  <><ShoppingBag className="h-3 w-3 mr-1" /> Order</>
                                ) : (
                                  <><Calendar className="h-3 w-3 mr-1" /> Event</>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm font-medium">{tx.reference || 'N/A'}</TableCell>
                            <TableCell>{tx.email}</TableCell>
                            <TableCell className="font-semibold">{formatPrice(tx.amount)}</TableCell>
                            <TableCell>
                              <Badge className={statusColors[tx.status] || "bg-gray-100"}>
                                {tx.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-neutral-500">
                              {formatDate(tx.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12">
                      <DollarSign className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Transactions Yet</h3>
                      <p className="text-neutral-500">
                        Revenue data will appear here once you start making sales through your shop or events.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
