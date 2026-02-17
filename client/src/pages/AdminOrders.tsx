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
} from "lucide-react";

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

  const updateShipment = trpc.admin.orders.updateShipment.useMutation({
    onSuccess: () => {
      toast.success("Shipment info updated & shipping email sent to customer");
      ordersQuery.refetch();
      orderDetailQuery.refetch();
      setTrackingNumber("");
      setTrackingUrl("");
      setCarrier("");
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
                            {order.shippingFirstName} {order.shippingLastName} • {order.email}
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
                    {selectedOrder.trackingNumber ? (
                      <Card>
                        <CardContent className="p-4 space-y-2">
                          <h4 className="font-medium flex items-center gap-2"><Truck className="w-4 h-4 text-green-600" /> Shipped</h4>
                          <p className="text-sm"><span className="text-neutral-500">Tracking #:</span> <span className="font-mono font-medium">{selectedOrder.trackingNumber}</span></p>
                          {selectedOrder.trackingUrl && (
                            <a href={selectedOrder.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                              <ArrowUpRight className="w-3 h-3" /> Track Package
                            </a>
                          )}
                          {selectedOrder.shippedAt && <p className="text-xs text-neutral-500">Shipped: {formatDate(selectedOrder.shippedAt)}</p>}
                          {selectedOrder.deliveredAt && <p className="text-xs text-green-600 font-medium">Delivered: {formatDate(selectedOrder.deliveredAt)}</p>}
                        </CardContent>
                      </Card>
                    ) : selectedOrder.paymentStatus === "paid" && !["cancelled","refunded"].includes(selectedOrder.status) ? (
                      <Card>
                        <CardContent className="p-4 space-y-3">
                          <h4 className="font-medium flex items-center gap-2"><Truck className="w-4 h-4" /> Add Tracking Info</h4>
                          <p className="text-sm text-amber-600">This order needs shipment processing.</p>
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
                            {updateShipment.isPending ? "Updating..." : "Mark as Shipped & Notify Customer"}
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
                  </TabsContent>
                </Tabs>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </main>
    </div>
  );
}
