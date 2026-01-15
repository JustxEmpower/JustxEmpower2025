import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminSidebar from '@/components/AdminSidebar';
import { motion } from "framer-motion";
import { ShoppingCart, Search, RefreshCw, Filter, Eye, Package, Truck, CheckCircle, Clock, DollarSign, XCircle } from "lucide-react";
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
  pending: "bg-amber-100 text-amber-700", processing: "bg-blue-100 text-blue-700", confirmed: "bg-emerald-100 text-emerald-700",
  shipped: "bg-indigo-100 text-indigo-700", delivered: "bg-teal-100 text-teal-700", cancelled: "bg-red-100 text-red-700", refunded: "bg-stone-100 text-stone-700",
};

const statusIcons: Record<string, any> = {
  pending: Clock, processing: Package, confirmed: CheckCircle, shipped: Truck, delivered: CheckCircle, cancelled: XCircle, refunded: XCircle,
};

export default function AdminOrdersEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const ordersQuery = trpc.admin.orders?.list?.useQuery?.({ limit: 100 }) || { data: { orders: [] }, refetch: () => {}, isLoading: false };
  const updateStatus = trpc.admin.orders?.updateStatus?.useMutation?.({ onSuccess: () => { toast.success("Status updated"); ordersQuery.refetch?.(); }, onError: (e: any) => toast.error(e.message) }) || { mutate: () => {} };

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  const orders = ordersQuery.data?.orders || [];
  const filteredOrders = useMemo(() => orders.filter((o: any) => {
    const matchesSearch = searchQuery === "" || o.orderNumber?.includes(searchQuery) || o.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [orders, searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o: any) => o.status === "pending").length,
    processing: orders.filter((o: any) => o.status === "processing" || o.status === "confirmed").length,
    totalRevenue: orders.filter((o: any) => !["cancelled", "refunded"].includes(o.status)).reduce((sum: number, o: any) => sum + (o.total || 0), 0),
  }), [orders]);

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatDate = (date: Date | string) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  if (isChecking || ordersQuery.isLoading) {
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
              <div><h1 className="text-2xl font-bold text-stone-900">Orders</h1><p className="text-stone-500 text-sm">Manage customer orders</p></div>
              <Button variant="outline" size="sm" onClick={() => ordersQuery.refetch?.()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[{ label: "Total Orders", value: stats.total, icon: ShoppingCart, color: "amber" }, { label: "Pending", value: stats.pending, icon: Clock, color: "blue" }, { label: "Processing", value: stats.processing, icon: Package, color: "purple" }, { label: "Revenue", value: stats.totalRevenue / 100, prefix: "$", icon: DollarSign, color: "emerald" }].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100/50 border-${stat.color}-200`}>
                  <CardContent className="p-5"><div className="flex items-center justify-between"><div><p className={`text-xs font-medium text-${stat.color}-600`}>{stat.label}</p><p className={`text-2xl font-bold text-${stat.color}-900`}><AnimatedCounter value={stat.value} prefix={stat.prefix} /></p></div><stat.icon className={`w-8 h-8 text-${stat.color}-500`} /></div></CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" /><Input placeholder="Search orders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-40"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="processing">Processing</SelectItem><SelectItem value="confirmed">Confirmed</SelectItem><SelectItem value="shipped">Shipped</SelectItem><SelectItem value="delivered">Delivered</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent></Select>
          </div>

          {filteredOrders.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><ShoppingCart className="w-12 h-12 mx-auto text-stone-400 mb-4" /><h3 className="text-lg font-medium mb-2">No Orders</h3><p className="text-stone-500">{searchQuery || statusFilter !== "all" ? "Try adjusting filters" : "No orders yet"}</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order: any, i: number) => {
                const StatusIcon = statusIcons[order.status] || Clock;
                return (
                  <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0"><StatusIcon className={`w-5 h-5 ${order.status === "delivered" || order.status === "confirmed" ? "text-emerald-600" : order.status === "cancelled" ? "text-red-600" : "text-amber-600"}`} /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1"><span className="font-semibold">#{order.orderNumber}</span><Badge className={statusColors[order.status] || "bg-stone-100"}>{order.status}</Badge></div>
                          <p className="text-sm text-stone-500">{order.customerEmail || "Guest"} • {formatDate(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatPrice(order.total || 0)}</p>
                          <p className="text-xs text-stone-500">{order.itemCount || 0} items</p>
                        </div>
                        <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Order #{selectedOrder?.orderNumber}</DialogTitle></DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-stone-500">Customer</p><p className="font-medium">{selectedOrder.customerEmail || "Guest"}</p></div>
                  <div><p className="text-sm text-stone-500">Date</p><p className="font-medium">{formatDate(selectedOrder.createdAt)}</p></div>
                  <div><p className="text-sm text-stone-500">Total</p><p className="font-medium text-lg">{formatPrice(selectedOrder.total || 0)}</p></div>
                  <div><p className="text-sm text-stone-500">Status</p>
                    <Select value={selectedOrder.status} onValueChange={(s) => { updateStatus.mutate?.({ id: selectedOrder.id, status: s }); setSelectedOrder({ ...selectedOrder, status: s }); }}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="processing">Processing</SelectItem><SelectItem value="confirmed">Confirmed</SelectItem><SelectItem value="shipped">Shipped</SelectItem><SelectItem value="delivered">Delivered</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                {selectedOrder.shippingAddress && (
                  <div><p className="text-sm text-stone-500 mb-1">Shipping Address</p><p className="text-sm bg-stone-50 p-3 rounded">{selectedOrder.shippingAddress}</p></div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
