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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingBag,
  Package,
  Eye,
  Search,
  Filter,
  RefreshCw,
  DollarSign,
  Clock,
  CheckCircle,
  Truck,
  CreditCard,
  ArrowUpRight,
  Mail,
  Download,
  Send,
  MapPin,
  User,
  FileText,
  ChevronRight,
  Plus,
  Trash2,
  Printer,
  Pencil,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

function UspsLiveTracking({ orderId, carrier }: { orderId: number; carrier?: string }) {
  const isUsps = !carrier || carrier.toLowerCase() === "usps";
  const trackingQuery = trpc.admin.orders.trackUsps.useQuery(
    { orderId },
    { enabled: isUsps, refetchInterval: 60_000 }
  );

  if (!isUsps) return null;

  const data = trackingQuery.data;

  if (trackingQuery.isLoading) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-sm text-neutral-400 animate-pulse">Fetching live USPS tracking...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.available) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-neutral-500">{data?.reason || "USPS tracking not available."}</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => trackingQuery.refetch()}>
            <RefreshCw className="w-3 h-3 mr-1" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statusColor: Record<string, string> = {
    Delivered: "text-green-600 bg-green-50 border-green-200",
    "In Transit": "text-blue-600 bg-blue-50 border-blue-200",
    Accepted: "text-amber-600 bg-amber-50 border-amber-200",
    "Out for Delivery": "text-purple-600 bg-purple-50 border-purple-200",
    "Alert": "text-red-600 bg-red-50 border-red-200",
  };
  const badgeClass = statusColor[data.statusCategory] || "text-neutral-600 bg-neutral-50 border-neutral-200";

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Package className="w-4 h-4" /> USPS Live Tracking
          </h4>
          <Button variant="ghost" size="sm" onClick={() => trackingQuery.refetch()} disabled={trackingQuery.isFetching}>
            <RefreshCw className={`w-3 h-3 mr-1 ${trackingQuery.isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <div className={`rounded-lg border p-3 ${badgeClass}`}>
          <p className="text-xs font-medium uppercase tracking-wider">{data.statusCategory}</p>
          <p className="text-sm mt-1">{data.statusSummary}</p>
        </div>

        {data.mailClass && (
          <p className="text-xs text-neutral-500">Service: <span className="font-medium" dangerouslySetInnerHTML={{ __html: data.mailClass }} /></p>
        )}
        {data.estimatedDelivery && (
          <p className="text-xs text-neutral-500">Estimated Delivery: <span className="font-medium">{new Date(data.estimatedDelivery).toLocaleDateString()}</span></p>
        )}
        {data.destinationCity && (
          <p className="text-xs text-neutral-500">Destination: <span className="font-medium">{data.destinationCity}, {data.destinationState} {data.destinationZIP}</span></p>
        )}

        {data.trackingEvents && data.trackingEvents.length > 0 && (
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Tracking History</p>
            <div className="space-y-0 border-l-2 border-neutral-200 ml-2">
              {data.trackingEvents.map((evt: any, i: number) => (
                <div key={i} className="relative pl-5 pb-3">
                  <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ${i === 0 ? "bg-blue-500" : "bg-neutral-300"}`} />
                  <p className="text-sm font-medium">{evt.eventType}</p>
                  <p className="text-xs text-neutral-500">
                    {evt.eventCity && `${evt.eventCity}, ${evt.eventState || ""} ${evt.eventZIP || ""}`}
                    {evt.eventTimestamp && ` · ${new Date(evt.eventTimestamp).toLocaleString()}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminOrders() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking, username, logout } = useAdminAuth();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [carrier, setCarrier] = useState("");
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [editingShipping, setEditingShipping] = useState(false);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    email: "",
    phone: "",
    shippingFirstName: "",
    shippingLastName: "",
    shippingAddress1: "",
    shippingAddress2: "",
    shippingCity: "",
    shippingState: "",
    shippingPostalCode: "",
    shippingCountry: "US",
    notes: "",
    sendConfirmationEmail: true,
  });
  const [newItems, setNewItems] = useState<{ productId?: number; name: string; price: string; quantity: number; sku: string; imageUrl?: string }[]>([
    { name: "", price: "", quantity: 1, sku: "" },
  ]);
  const [newShippingAmount, setNewShippingAmount] = useState("");

  const brandAssetsQuery = trpc.siteSettings.getBrandAssets.useQuery();
  const brandLogoUrl = brandAssetsQuery.data?.logo_header || brandAssetsQuery.data?.logo_footer || '';

  const productsQuery = trpc.shop.products.list.useQuery(
    { limit: 100 },
    { enabled: showCreateOrder }
  );
  const storeProducts = productsQuery.data?.products || [];

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

  const createManualOrder = trpc.admin.orders.createManual.useMutation({
    onSuccess: (data) => {
      toast.success(`Order ${data.orderNumber} created successfully!`);
      ordersQuery.refetch();
      setShowCreateOrder(false);
      setNewOrder({
        email: "", phone: "", shippingFirstName: "", shippingLastName: "",
        shippingAddress1: "", shippingAddress2: "", shippingCity: "", shippingState: "",
        shippingPostalCode: "", shippingCountry: "US", notes: "", sendConfirmationEmail: true,
      });
      setNewItems([{ name: "", price: "", quantity: 1, sku: "" }]);
      setNewShippingAmount("");
      productsQuery.refetch();
    },
    onError: (error) => {
      toast.error("Failed to create order: " + error.message);
    },
  });

  const deleteOrder = trpc.admin.orders.delete.useMutation({
    onSuccess: () => {
      toast.success("Order deleted");
      ordersQuery.refetch();
      setSelectedOrder(null);
    },
    onError: (error) => {
      toast.error("Failed to delete order: " + error.message);
    },
  });

  const handleCreateOrder = () => {
    if (!newOrder.email || !newOrder.shippingFirstName || !newOrder.shippingLastName) {
      toast.error("Please fill in customer name and email");
      return;
    }
    if (!newOrder.shippingAddress1 || !newOrder.shippingCity || !newOrder.shippingState || !newOrder.shippingPostalCode) {
      toast.error("Please fill in the shipping address");
      return;
    }
    const validItems = newItems.filter(i => i.name && i.price);
    if (validItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }
    createManualOrder.mutate({
      ...newOrder,
      items: validItems.map(i => ({
        name: i.name,
        price: Math.round(parseFloat(i.price) * 100),
        quantity: i.quantity,
        sku: i.sku || undefined,
        imageUrl: i.imageUrl || undefined,
      })),
      shippingAmount: newShippingAmount ? Math.round(parseFloat(newShippingAmount) * 100) : 0,
    });
  };

  const updateShipment = trpc.admin.orders.updateShipment.useMutation({
    onSuccess: () => {
      toast.success("Shipment info updated & shipping email sent to customer");
      ordersQuery.refetch();
      orderDetailQuery.refetch();
      setTrackingNumber("");
      setTrackingUrl("");
      setCarrier("");
      setEditingShipping(false);
    },
    onError: (error) => {
      toast.error("Error updating shipment: " + error.message);
    },
  });

  // Fetch full order detail with line items when an order is selected
  const orderDetailQuery = trpc.admin.orders.getById.useQuery(
    { id: selectedOrder?.id },
    { enabled: !!selectedOrder?.id }
  );
  const orderDetail = orderDetailQuery.data;

  // Email sending mutations
  const sendConfirmationEmail = trpc.automation.sendOrderConfirmation.useMutation({
    onSuccess: () => { toast.success("Order confirmation email sent"); setSendingEmail(null); },
    onError: (e) => { toast.error("Failed to send email: " + e.message); setSendingEmail(null); },
  });
  const sendShippingEmail = trpc.automation.sendShippingNotification.useMutation({
    onSuccess: () => { toast.success("Shipping notification email sent"); setSendingEmail(null); },
    onError: (e) => { toast.error("Failed to send email: " + e.message); setSendingEmail(null); },
  });

  // CSV Export
  const exportToCSV = () => {
    const rows = allOrders.map((o: any) => ({
      OrderNumber: o.orderNumber,
      Date: new Date(o.createdAt).toLocaleDateString(),
      Customer: `${o.shippingFirstName || ''} ${o.shippingLastName || ''}`,
      Email: o.email,
      Status: o.status,
      PaymentStatus: o.paymentStatus,
      Total: `$${(o.total / 100).toFixed(2)}`,
      TrackingNumber: o.trackingNumber || '',
    }));
    const headers = Object.keys(rows[0] || {}).join(',');
    const csv = [headers, ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Orders exported to CSV');
  };

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
           `${order.shippingFirstName} ${order.shippingLastName}`.toLowerCase().includes(searchQuery.toLowerCase());
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
      case "on_hold": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
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
                <Button size="sm" onClick={() => setShowCreateOrder(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Order
                </Button>
                <Button variant="outline" size="sm" onClick={exportToCSV} disabled={allOrders.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
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
                <SelectItem value="on_hold">On Hold</SelectItem>
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
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Item thumbnail or icon */}
                          {order.items?.[0]?.imageUrl ? (
                            <img src={order.items[0].imageUrl} alt={order.items[0].name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border" />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                              <ShoppingBag className="w-6 h-6 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-sm">{order.orderNumber}</h3>
                              <Badge className={`${getStatusColor(order.status)} text-[10px]`}>
                                {order.status}
                              </Badge>
                              {order.paymentStatus === "paid" && (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px]">
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  Paid
                                </Badge>
                              )}
                            </div>
                            {/* Purchased items summary */}
                            <div className="mt-1.5">
                              {order.items?.length > 0 ? (
                                <div className="space-y-0.5">
                                  {order.items.slice(0, 3).map((item: any, i: number) => (
                                    <p key={i} className="text-sm text-stone-700 truncate">
                                      <span className="font-medium">{item.name}</span>
                                      <span className="text-stone-400 ml-1">× {item.quantity}</span>
                                      <span className="text-stone-500 ml-1">${(item.price / 100).toFixed(2)}</span>
                                    </p>
                                  ))}
                                  {order.items.length > 3 && (
                                    <p className="text-xs text-stone-400">+{order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}</p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-stone-400 italic">No item details</p>
                              )}
                            </div>
                            <p className="text-xs text-stone-500 mt-1.5">
                              {order.shippingFirstName} {order.shippingLastName} · {order.email} · {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xl font-bold text-primary">${(order.total / 100).toFixed(2)}</p>
                            <p className="text-xs text-stone-500 mt-1">
                              {order.items?.length || 1} item{(order.items?.length || 1) !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-100">
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
                              <SelectItem value="on_hold">On Hold</SelectItem>
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
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl">Order {selectedOrder?.orderNumber}</DialogTitle>
                    <DialogDescription>
                      Placed on {selectedOrder && formatDate(selectedOrder.createdAt)}
                    </DialogDescription>
                  </div>
                  {selectedOrder && (
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(selectedOrder.status)}>{selectedOrder.status}</Badge>
                      <Badge className={selectedOrder.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                        {selectedOrder.paymentStatus}
                      </Badge>
                    </div>
                  )}
                </div>
              </DialogHeader>
              {selectedOrder && (
                <Tabs defaultValue="details" className="mt-2">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="items">Items</TabsTrigger>
                    <TabsTrigger value="shipping">Shipping</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                  </TabsList>

                  {/* DETAILS TAB */}
                  <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2"><User className="w-4 h-4" /> Customer</h4>
                        <p className="text-sm">{selectedOrder.shippingFirstName} {selectedOrder.shippingLastName}</p>
                        <p className="text-sm text-neutral-500">{selectedOrder.email}</p>
                        {selectedOrder.phone && <p className="text-sm text-neutral-500">{selectedOrder.phone}</p>}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2"><MapPin className="w-4 h-4" /> Shipping Address</h4>
                        <p className="text-sm">{selectedOrder.shippingAddress1}{selectedOrder.shippingAddress2 ? `, ${selectedOrder.shippingAddress2}` : ''}</p>
                        <p className="text-sm">{selectedOrder.shippingCity}, {selectedOrder.shippingState} {selectedOrder.shippingPostalCode}</p>
                        <p className="text-sm">{selectedOrder.shippingCountry}</p>
                      </CardContent>
                    </Card>
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
                  {selectedOrder.paymentIntentId && (
                    <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <CreditCard className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm text-indigo-700 dark:text-indigo-300">Stripe Payment ID:</span>
                      <code className="text-xs font-mono bg-white dark:bg-neutral-800 px-2 py-0.5 rounded">{selectedOrder.paymentIntentId}</code>
                    </div>
                  )}

                  </TabsContent>

                  {/* ITEMS TAB */}
                  <TabsContent value="items" className="mt-4">
                    {orderDetail?.items?.length ? (
                      <div className="border rounded-lg divide-y">
                        {orderDetail.items.map((item: any) => (
                          <div key={item.id} className="p-3 flex items-center gap-3">
                            {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.name}</p>
                              <p className="text-xs text-neutral-500">SKU: {item.sku || 'N/A'} · Qty: {item.quantity} × ${(item.price / 100).toFixed(2)}</p>
                            </div>
                            <p className="text-sm font-medium">${(item.total / 100).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    ) : orderDetailQuery.isLoading ? (
                      <p className="text-sm text-neutral-400 py-4 text-center">Loading items...</p>
                    ) : (
                      <p className="text-sm text-neutral-400 py-4 text-center">No line items found.</p>
                    )}
                  </TabsContent>

                  {/* SHIPPING TAB */}
                  <TabsContent value="shipping" className="space-y-4 mt-4">
                    {selectedOrder.trackingNumber && !editingShipping ? (
                      <>
                        <Card>
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium flex items-center gap-2"><Truck className="w-4 h-4 text-green-600" /> Shipped</h4>
                              <Button size="sm" variant="outline" onClick={() => {
                                setTrackingNumber(selectedOrder.trackingNumber || "");
                                setTrackingUrl(selectedOrder.trackingUrl || "");
                                setCarrier(selectedOrder.carrier || "");
                                setEditingShipping(true);
                              }}>
                                <Pencil className="w-3 h-3 mr-1" /> Edit Tracking
                              </Button>
                            </div>
                            <p className="text-sm"><span className="text-neutral-500">Tracking #:</span> <span className="font-mono font-medium">{selectedOrder.trackingNumber}</span></p>
                            {selectedOrder.carrier && <p className="text-sm"><span className="text-neutral-500">Carrier:</span> <span className="font-medium uppercase">{selectedOrder.carrier}</span></p>}
                            {selectedOrder.trackingUrl && (
                              <a href={selectedOrder.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3" /> Track Package
                              </a>
                            )}
                            {selectedOrder.shippedAt && <p className="text-xs text-neutral-500">Shipped: {formatDate(selectedOrder.shippedAt)}</p>}
                            {selectedOrder.deliveredAt && <p className="text-xs text-green-600 font-medium">Delivered: {formatDate(selectedOrder.deliveredAt)}</p>}
                          </CardContent>
                        </Card>
                        <UspsLiveTracking orderId={selectedOrder.id} carrier={selectedOrder.carrier} />
                      </>
                    ) : (editingShipping || (selectedOrder.paymentStatus === "paid" && !["cancelled","refunded"].includes(selectedOrder.status))) ? (
                      <Card>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium flex items-center gap-2"><Truck className="w-4 h-4" /> {editingShipping ? "Update Tracking Info" : "Add Tracking Info"}</h4>
                            {editingShipping && (
                              <Button size="sm" variant="ghost" onClick={() => { setEditingShipping(false); setTrackingNumber(""); setTrackingUrl(""); setCarrier(""); }}>
                                Cancel
                              </Button>
                            )}
                          </div>
                          {!editingShipping && <p className="text-sm text-amber-600">This order needs shipment processing.</p>}
                          {editingShipping && <p className="text-sm text-blue-600">Updating tracking will send a new shipping notification email to the customer.</p>}
                          <Select value={carrier} onValueChange={setCarrier}>
                            <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="usps">USPS</SelectItem>
                              <SelectItem value="ups">UPS</SelectItem>
                              <SelectItem value="fedex">FedEx</SelectItem>
                              <SelectItem value="dhl">DHL</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input placeholder="Tracking number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
                          <Input placeholder="Tracking URL (optional)" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} />
                          <Button size="sm" disabled={!trackingNumber || updateShipment.isPending}
                            onClick={() => updateShipment.mutate({ id: selectedOrder.id, trackingNumber, trackingUrl: trackingUrl || undefined, carrier: carrier || undefined })}>
                            <Truck className="w-4 h-4 mr-2" />
                            {updateShipment.isPending ? "Updating..." : editingShipping ? "Update Tracking & Notify Customer" : "Mark as Shipped & Notify Customer"}
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <p className="text-sm text-neutral-400 py-4 text-center">No tracking information available.</p>
                    )}
                  </TabsContent>

                  {/* ACTIONS TAB */}
                  <TabsContent value="actions" className="space-y-3 mt-4">
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <h4 className="font-medium flex items-center gap-2"><Printer className="w-4 h-4" /> Packing Slip</h4>
                        <p className="text-sm text-neutral-500">Generate a printable packing slip for this order.</p>
                        <Button size="sm" variant="outline" onClick={() => {
                          const items = orderDetail?.items || selectedOrder.items || [];
                          const o = selectedOrder;
                          const logoSrc = brandLogoUrl || 'https://justxempower-assets.s3.us-east-1.amazonaws.com/media/brand/logo_header.png';
                          const win = window.open("", "_blank", "width=800,height=1000");
                          if (!win) { toast.error("Popup blocked — allow popups for this site"); return; }
                          win.document.write(`<!DOCTYPE html><html><head><title>Packing Slip - ${o.orderNumber}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; padding: 48px 56px; color: #1a1a1a; font-size: 13px; line-height: 1.6; background: #fff; }
  .slip { max-width: 720px; margin: 0 auto; }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 28px; margin-bottom: 28px; border-bottom: 1px solid #e5e5e5; }
  .brand { display: flex; align-items: center; gap: 16px; }
  .brand img { height: 64px; width: auto; object-fit: contain; }
  .brand-text { font-family: 'Playfair Display', Georgia, serif; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #888; margin-top: 4px; }
  .order-meta { text-align: right; }
  .order-number { font-family: 'Playfair Display', Georgia, serif; font-size: 18px; font-weight: 600; color: #1a1a1a; }
  .order-date { font-size: 12px; color: #888; margin-top: 2px; }
  .order-badge { display: inline-block; margin-top: 8px; padding: 3px 12px; border-radius: 20px; font-size: 10px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; background: #f0f0f0; color: #555; }

  /* Document Title */
  .doc-title { text-align: center; margin-bottom: 32px; }
  .doc-title h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 14px; font-weight: 400; letter-spacing: 4px; text-transform: uppercase; color: #aaa; }
  .doc-title .line { width: 40px; height: 1px; background: #ccc; margin: 10px auto 0; }

  /* Info Grid */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-bottom: 32px; padding: 24px; background: #fafafa; border-radius: 8px; }
  .info-block {}
  .info-label { font-size: 9px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #999; margin-bottom: 8px; }
  .info-block p { font-size: 12.5px; line-height: 1.6; color: #333; }
  .info-block p strong { font-weight: 600; color: #1a1a1a; }
  .tracking-num { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px; background: #fff; border: 1px solid #e0e0e0; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 4px; }

  /* Items Table */
  .items-section { margin-bottom: 24px; }
  .items-label { font-size: 9px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #999; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; }
  thead th { text-align: left; font-size: 10px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #999; padding: 10px 16px; border-bottom: 2px solid #eee; }
  thead th.r { text-align: right; }
  thead th.c { text-align: center; }
  tbody td { padding: 14px 16px; border-bottom: 1px solid #f0f0f0; font-size: 13px; vertical-align: middle; }
  tbody td.r { text-align: right; font-variant-numeric: tabular-nums; }
  tbody td.c { text-align: center; }
  tbody tr:last-child td { border-bottom: none; }
  .item-name { font-weight: 500; color: #1a1a1a; }
  .item-sku { font-size: 11px; color: #aaa; margin-top: 2px; }

  /* Totals */
  .totals-row { display: flex; justify-content: flex-end; margin-top: 16px; }
  .totals-box { width: 260px; }
  .totals-box .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #666; }
  .totals-box .row.discount { color: #16a34a; }
  .totals-box .row.grand { padding-top: 12px; margin-top: 8px; border-top: 2px solid #1a1a1a; font-size: 16px; font-weight: 700; color: #1a1a1a; font-family: 'Playfair Display', Georgia, serif; }

  /* Notes */
  .notes { margin-top: 28px; padding: 20px; background: #fafafa; border-left: 3px solid #ddd; border-radius: 0 8px 8px 0; }
  .notes .notes-label { font-size: 9px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #999; margin-bottom: 6px; }
  .notes p { font-size: 12.5px; color: #555; font-style: italic; }

  /* Footer */
  .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
  .footer-left { font-size: 11px; color: #bbb; }
  .footer-right { font-size: 11px; color: #bbb; font-style: italic; }

  @media print {
    body { padding: 24px 32px; }
    @page { margin: 0.4in; size: letter; }
    .info-grid { background: #fafafa !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style></head><body>
<div class="slip">
  <div class="header">
    <div class="brand">
      <img src="${logoSrc}" alt="Just Empower" onerror="this.style.display='none';this.nextElementSibling.style.display='block'" />
      <div style="display:none;font-family:'Playfair Display',serif;font-size:22px;font-weight:700;letter-spacing:2px">JUST X EMPOWER</div>
    </div>
    <div class="order-meta">
      <div class="order-number">${o.orderNumber}</div>
      <div class="order-date">${new Date(o.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div>
      <div class="order-badge">${o.status}</div>
    </div>
  </div>

  <div class="doc-title"><h1>Packing Slip</h1><div class="line"></div></div>

  <div class="info-grid">
    <div class="info-block">
      <div class="info-label">Ship To</div>
      <p><strong>${o.shippingFirstName || ""} ${o.shippingLastName || ""}</strong></p>
      <p>${o.shippingAddress1 || ""}</p>
      ${o.shippingAddress2 ? `<p>${o.shippingAddress2}</p>` : ""}
      <p>${o.shippingCity || ""}, ${o.shippingState || ""} ${o.shippingPostalCode || ""}</p>
      <p>${o.shippingCountry || "US"}</p>
    </div>
    <div class="info-block">
      <div class="info-label">Customer</div>
      <p>${o.email || ""}</p>
      ${o.phone ? `<p>${o.phone}</p>` : ""}
    </div>
    <div class="info-block">
      ${o.trackingNumber ? `
        <div class="info-label">Shipping</div>
        <p style="font-weight:500">${(o.carrier || "USPS").toUpperCase()}</p>
        <div class="tracking-num">${o.trackingNumber}</div>
      ` : `
        <div class="info-label">Payment</div>
        <p style="font-weight:500">${o.paymentStatus === "paid" ? "Paid" : o.paymentStatus || "Pending"}</p>
      `}
    </div>
  </div>

  <div class="items-section">
    <div class="items-label">Order Items</div>
    <table>
      <thead><tr><th>Item</th><th>SKU</th><th class="c">Qty</th><th class="r">Price</th></tr></thead>
      <tbody>
        ${items.map((it: any) => `<tr>
          <td><div class="item-name">${it.name || it.productName || "Item"}</div></td>
          <td><span class="item-sku">${it.sku || "—"}</span></td>
          <td class="c">${it.quantity}</td>
          <td class="r">$${((it.price || 0) / 100).toFixed(2)}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>

  <div class="totals-row"><div class="totals-box">
    <div class="row"><span>Subtotal</span><span>$${((o.subtotal || 0) / 100).toFixed(2)}</span></div>
    ${o.discountAmount > 0 ? `<div class="row discount"><span>Discount</span><span>-$${(o.discountAmount / 100).toFixed(2)}</span></div>` : ""}
    <div class="row"><span>Shipping</span><span>${o.shippingAmount === 0 ? "FREE" : "$" + ((o.shippingAmount || 0) / 100).toFixed(2)}</span></div>
    <div class="row grand"><span>Total</span><span>$${((o.total || 0) / 100).toFixed(2)}</span></div>
  </div></div>

  ${o.notes ? `<div class="notes"><div class="notes-label">Order Notes</div><p>${o.notes}</p></div>` : ""}

  <div class="footer">
    <div class="footer-left">justxempower.com</div>
    <div class="footer-right">Thank you for your order</div>
  </div>
</div>
</body></html>`);
                          win.document.close();
                          setTimeout(() => win.print(), 800);
                        }}>
                          <Printer className="w-3 h-3 mr-1" /> Print Packing Slip
                        </Button>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <h4 className="font-medium flex items-center gap-2"><Mail className="w-4 h-4" /> Email Customer</h4>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" disabled={sendConfirmationEmail.isPending}
                            onClick={() => { setSendingEmail("confirm"); sendConfirmationEmail.mutate({ orderId: selectedOrder.id }); }}>
                            <Send className="w-3 h-3 mr-1" />
                            {sendConfirmationEmail.isPending ? "Sending..." : "Send Order Confirmation"}
                          </Button>
                          {selectedOrder.trackingNumber && (
                            <Button size="sm" variant="outline" disabled={sendShippingEmail.isPending}
                              onClick={() => { setSendingEmail("ship"); sendShippingEmail.mutate({ orderId: selectedOrder.id, trackingNumber: selectedOrder.trackingNumber, trackingUrl: selectedOrder.trackingUrl || undefined }); }}>
                              <Truck className="w-3 h-3 mr-1" />
                              {sendShippingEmail.isPending ? "Sending..." : "Resend Shipping Email"}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <h4 className="font-medium flex items-center gap-2"><Package className="w-4 h-4" /> Update Status</h4>
                        <Select value={selectedOrder.status} onValueChange={(v) => handleStatusChange(selectedOrder.id, v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                    <Card className="border-red-200">
                      <CardContent className="p-4 space-y-3">
                        <h4 className="font-medium flex items-center gap-2 text-red-600"><Trash2 className="w-4 h-4" /> Delete Order</h4>
                        <p className="text-sm text-neutral-500">Permanently delete this order and all its items. This cannot be undone.</p>
                        <Button size="sm" variant="destructive" disabled={deleteOrder.isPending}
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete order ${selectedOrder.orderNumber}? This cannot be undone.`)) {
                              deleteOrder.mutate({ id: selectedOrder.id });
                            }
                          }}>
                          <Trash2 className="w-3 h-3 mr-1" />
                          {deleteOrder.isPending ? "Deleting..." : "Delete Order"}
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Create Order Dialog */}
          <Dialog open={showCreateOrder} onOpenChange={setShowCreateOrder}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">Create Manual Order</DialogTitle>
                <DialogDescription>
                  Create an order manually. The customer will receive a confirmation email.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-2">
                {/* Customer Info */}
                <div>
                  <h4 className="font-medium text-sm text-stone-700 mb-3 flex items-center gap-2"><User className="w-4 h-4" /> Customer Info</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">First Name *</Label>
                      <Input value={newOrder.shippingFirstName} onChange={(e) => setNewOrder({ ...newOrder, shippingFirstName: e.target.value })} placeholder="First name" />
                    </div>
                    <div>
                      <Label className="text-xs">Last Name *</Label>
                      <Input value={newOrder.shippingLastName} onChange={(e) => setNewOrder({ ...newOrder, shippingLastName: e.target.value })} placeholder="Last name" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <Label className="text-xs">Email *</Label>
                      <Input type="email" value={newOrder.email} onChange={(e) => setNewOrder({ ...newOrder, email: e.target.value })} placeholder="customer@email.com" />
                    </div>
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input value={newOrder.phone} onChange={(e) => setNewOrder({ ...newOrder, phone: e.target.value })} placeholder="(555) 123-4567" />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h4 className="font-medium text-sm text-stone-700 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> Shipping Address</h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Address Line 1 *</Label>
                      <Input value={newOrder.shippingAddress1} onChange={(e) => setNewOrder({ ...newOrder, shippingAddress1: e.target.value })} placeholder="123 Main St" />
                    </div>
                    <div>
                      <Label className="text-xs">Address Line 2</Label>
                      <Input value={newOrder.shippingAddress2} onChange={(e) => setNewOrder({ ...newOrder, shippingAddress2: e.target.value })} placeholder="Apt, Suite, etc." />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">City *</Label>
                        <Input value={newOrder.shippingCity} onChange={(e) => setNewOrder({ ...newOrder, shippingCity: e.target.value })} placeholder="City" />
                      </div>
                      <div>
                        <Label className="text-xs">State *</Label>
                        <Input value={newOrder.shippingState} onChange={(e) => setNewOrder({ ...newOrder, shippingState: e.target.value })} placeholder="TX" />
                      </div>
                      <div>
                        <Label className="text-xs">ZIP *</Label>
                        <Input value={newOrder.shippingPostalCode} onChange={(e) => setNewOrder({ ...newOrder, shippingPostalCode: e.target.value })} placeholder="78701" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <h4 className="font-medium text-sm text-stone-700 mb-3 flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> Items</h4>
                  <div className="space-y-3">
                    {newItems.map((item, idx) => (
                      <div key={idx} className="border rounded-lg p-3 space-y-2 bg-stone-50">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Label className="text-xs">Select from store</Label>
                            <Select
                              value={item.productId ? String(item.productId) : ""}
                              onValueChange={(val) => {
                                if (val === "custom") {
                                  const u = [...newItems];
                                  u[idx] = { name: "", price: "", quantity: 1, sku: "", productId: undefined, imageUrl: undefined };
                                  setNewItems(u);
                                  return;
                                }
                                const product = storeProducts.find((p: any) => String(p.id) === val);
                                if (product) {
                                  const u = [...newItems];
                                  const images = Array.isArray(product.images) ? product.images : [];
                                  const firstImg = images[0];
                                  const imgUrl = typeof firstImg === "string" ? firstImg : (firstImg?.url || firstImg?.src || undefined);
                                  u[idx] = {
                                    productId: product.id,
                                    name: product.name,
                                    price: (product.price / 100).toFixed(2),
                                    quantity: u[idx].quantity || 1,
                                    sku: product.sku || "",
                                    imageUrl: imgUrl,
                                  };
                                  setNewItems(u);
                                }
                              }}
                            >
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder={productsQuery.isLoading ? "Loading products..." : "Choose a product or enter custom"} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="custom">Custom item (enter manually)</SelectItem>
                                {storeProducts.map((p: any) => (
                                  <SelectItem key={p.id} value={String(p.id)}>
                                    {p.name} — ${(p.price / 100).toFixed(2)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {newItems.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0 mt-5" onClick={() => setNewItems(newItems.filter((_, i) => i !== idx))}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-end gap-2">
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded object-cover border flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <Label className="text-xs">Item Name *</Label>
                            <Input value={item.name} onChange={(e) => { const u = [...newItems]; u[idx].name = e.target.value; setNewItems(u); }} placeholder="Product name" className="bg-white" />
                          </div>
                          <div className="w-24">
                            <Label className="text-xs">Price ($) *</Label>
                            <Input value={item.price} onChange={(e) => { const u = [...newItems]; u[idx].price = e.target.value; setNewItems(u); }} placeholder="29.99" className="bg-white" />
                          </div>
                          <div className="w-16">
                            <Label className="text-xs">Qty</Label>
                            <Input type="number" min={1} value={item.quantity} onChange={(e) => { const u = [...newItems]; u[idx].quantity = parseInt(e.target.value) || 1; setNewItems(u); }} className="bg-white" />
                          </div>
                          <div className="w-24">
                            <Label className="text-xs">SKU</Label>
                            <Input value={item.sku} onChange={(e) => { const u = [...newItems]; u[idx].sku = e.target.value; setNewItems(u); }} placeholder="SKU" className="bg-white" />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setNewItems([...newItems, { name: "", price: "", quantity: 1, sku: "" }])}>
                      <Plus className="w-3 h-3 mr-1" /> Add Item
                    </Button>
                  </div>

                  {/* Shipping Cost */}
                  <div className="mt-3 flex items-end gap-3">
                    <div className="w-40">
                      <Label className="text-xs">Shipping Cost ($)</Label>
                      <Input value={newShippingAmount} onChange={(e) => setNewShippingAmount(e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-sm text-stone-500">
                        Subtotal: <span className="font-semibold text-stone-900">
                          ${newItems.filter(i => i.name && i.price).reduce((sum, i) => sum + (parseFloat(i.price) || 0) * i.quantity, 0).toFixed(2)}
                        </span>
                      </p>
                      <p className="text-lg font-bold text-stone-900">
                        Total: ${(
                          newItems.filter(i => i.name && i.price).reduce((sum, i) => sum + (parseFloat(i.price) || 0) * i.quantity, 0) +
                          (parseFloat(newShippingAmount) || 0)
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label className="text-xs">Internal Notes</Label>
                  <Input value={newOrder.notes} onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })} placeholder="Optional internal notes..." />
                </div>

                {/* Send Email Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendEmail"
                    checked={newOrder.sendConfirmationEmail}
                    onCheckedChange={(checked) => setNewOrder({ ...newOrder, sendConfirmationEmail: !!checked })}
                  />
                  <label htmlFor="sendEmail" className="text-sm font-medium leading-none cursor-pointer">
                    Send order confirmation email to customer
                  </label>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setShowCreateOrder(false)}>Cancel</Button>
                <Button onClick={handleCreateOrder} disabled={createManualOrder.isPending}>
                  {createManualOrder.isPending ? "Creating..." : "Create Order"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </main>
    </div>
  );
}
