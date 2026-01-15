import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import AdminSidebar from '@/components/AdminSidebar';
import {
  LogOut,
  FileText,
  Settings,
  Layout,
  FolderOpen,
  Palette,
  BarChart3,
  Files,
  ShoppingBag,
  Calendar,
  ClipboardList,
  Package,
  Eye,
  Search,
  Filter,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  CreditCard,
  ArrowUpRight,
  MoreHorizontal,
} from "lucide-react";

export default function AdminOrders() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking, username, logout } = useAdminAuth();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const ordersQuery = trpc.admin.orders.list.useQuery(
    statusFilter !== "all" ? { status: statusFilter as any } : {}
  );
  
  const updateOrderStatus = trpc.admin.orders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Order status updated");
      ordersQuery.refetch();
    },
    onError: (error) => {
      toast.error("Error updating order: " + error.message);
    },
  });

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

  const allOrders = ordersQuery.data?.orders || [];
  
  // Filter orders
  const orders = allOrders.filter((order: any) => {
    if (searchQuery === "") return true;
    return order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           order.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           `${order.firstName} ${order.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  // Calculate stats
  const totalRevenue = allOrders.filter((o: any) => o.paymentStatus === 'paid').reduce((sum: number, o: any) => sum + o.total, 0);
  const pendingOrders = allOrders.filter((o: any) => o.status === 'pending').length;
  const processingOrders = allOrders.filter((o: any) => o.status === 'processing').length;
  const completedOrders = allOrders.filter((o: any) => o.status === 'delivered').length;

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "processing": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "shipped": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "delivered": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "cancelled": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "refunded": return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400";
      default: return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400";
    }
  };

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateOrderStatus.mutate({ id: orderId, status: newStatus as any });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 flex">
      <AdminSidebar variant="dark" />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Orders</h1>
                <p className="text-stone-500 text-sm">Manage shop orders and fulfillment</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => ordersQuery.refetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-600 font-medium">Total Revenue</p>
                      <p className="text-2xl font-bold text-emerald-900">${(totalRevenue / 100).toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-amber-600 font-medium">Pending</p>
                      <p className="text-2xl font-bold text-amber-900">{pendingOrders}</p>
                    </div>
                    <Clock className="w-8 h-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Processing</p>
                      <p className="text-2xl font-bold text-blue-900">{processingOrders}</p>
                    </div>
                    <Truck className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Completed</p>
                      <p className="text-2xl font-bold text-green-900">{completedOrders}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {ordersQuery.isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                  <Package className="w-10 h-10 text-stone-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{searchQuery ? "No orders match your search" : "No orders yet"}</h3>
                <p className="text-stone-500 text-center max-w-md">
                  {searchQuery ? "Try adjusting your search criteria" : "Orders will appear here when customers make purchases"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {orders.map((order: any, index: number) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className="hover:shadow-md transition-all">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{order.orderNumber}</h3>
                            <Badge className={`${getStatusColor(order.status)}`}>
                              {order.status}
                            </Badge>
                            {order.paymentStatus === "paid" && (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                <CreditCard className="w-3 h-3 mr-1" />
                                Paid
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-stone-600 mt-1">
                            {order.firstName} {order.lastName} • {order.email}
                          </p>
                          <p className="text-xs text-stone-400 mt-1">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">${(order.total / 100).toFixed(2)}</p>
                          <p className="text-xs text-stone-500 mt-1">
                            {order.itemCount || 1} item{order.itemCount !== 1 ? 's' : ''}
                          </p>
                    </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Select 
                            value={order.status} 
                            onValueChange={(value) => handleStatusChange(order.id, value)}
                          >
                            <SelectTrigger className="w-[130px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                            <Eye className="w-4 h-4 mr-1" />
                            Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Order Details Dialog */}
          <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Order {selectedOrder?.orderNumber}</DialogTitle>
                <DialogDescription>
                  Placed on {selectedOrder && formatDate(selectedOrder.createdAt)}
                </DialogDescription>
              </DialogHeader>
              {selectedOrder && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Customer</h4>
                      <p className="text-sm">{selectedOrder.firstName} {selectedOrder.lastName}</p>
                      <p className="text-sm text-neutral-500">{selectedOrder.email}</p>
                      {selectedOrder.phone && <p className="text-sm text-neutral-500">{selectedOrder.phone}</p>}
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Shipping Address</h4>
                      <p className="text-sm">{selectedOrder.shippingAddress}</p>
                      <p className="text-sm">{selectedOrder.shippingCity}, {selectedOrder.shippingState} {selectedOrder.shippingZip}</p>
                      <p className="text-sm">{selectedOrder.shippingCountry}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Order Summary</h4>
                    <div className="border rounded-lg divide-y">
                      <div className="p-3 flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>${(selectedOrder.subtotal / 100).toFixed(2)}</span>
                      </div>
                      {selectedOrder.discountAmount > 0 && (
                        <div className="p-3 flex justify-between text-sm text-green-600">
                          <span>Discount</span>
                          <span>-${(selectedOrder.discountAmount / 100).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="p-3 flex justify-between text-sm">
                        <span>Shipping</span>
                        <span>{selectedOrder.shippingAmount === 0 ? "FREE" : `$${(selectedOrder.shippingAmount / 100).toFixed(2)}`}</span>
                      </div>
                      <div className="p-3 flex justify-between font-medium">
                        <span>Total</span>
                        <span>${(selectedOrder.total / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm text-neutral-500">Payment Status: </span>
                      <span className={`text-sm font-medium ${selectedOrder.paymentStatus === "paid" ? "text-green-600" : "text-yellow-600"}`}>
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-neutral-500">Order Status: </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
