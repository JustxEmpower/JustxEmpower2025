import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
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
} from "lucide-react";

export default function AdminOrders() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking, username, logout } = useAdminAuth();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  const navItems = [
    { icon: Layout, label: "Content", path: "/admin/content" },
    { icon: FileText, label: "Articles", path: "/admin/articles" },
    { icon: FolderOpen, label: "Media", path: "/admin/media" },
    { icon: Palette, label: "Theme", path: "/admin/theme" },
    { icon: Files, label: "Pages", path: "/admin/pages" },
    { icon: ShoppingBag, label: "Products", path: "/admin/products" },
    { icon: Calendar, label: "Events", path: "/admin/events" },
    { icon: ClipboardList, label: "Orders", path: "/admin/orders" },
    { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

  const orders = ordersQuery.data?.orders || [];

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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <img src="/media/logo-white.png" alt="Just Empower" className="h-10 opacity-90" />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-light">Admin Portal</p>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => setLocation(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    location === item.path
                      ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
              <span className="text-xs font-medium">{username?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <p className="text-sm font-medium">{username}</p>
              <p className="text-xs text-neutral-500">Administrator</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-light tracking-tight">Orders</h1>
              <p className="text-neutral-500 mt-1">Manage shop orders and fulfillment</p>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
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
            <div className="text-center py-12">Loading orders...</div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-12 h-12 text-neutral-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                <p className="text-neutral-500">Orders will appear here when customers make purchases</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {orders.map((order: any) => (
                <Card key={order.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{order.orderNumber}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-500 mt-1">
                        {order.firstName} {order.lastName} • {order.email}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${(order.total / 100).toFixed(2)}</p>
                      <p className="text-sm text-neutral-500">
                        {order.paymentStatus === "paid" ? "Paid" : order.paymentStatus}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={order.status} 
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger className="w-[130px]">
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
                      <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
