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
import { Package, Plus, Edit, Trash2, Search, RefreshCw, Filter, DollarSign, Eye, LayoutGrid, List, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { getMediaUrl } from "@/lib/media";

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

export default function AdminProductsEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const productsQuery = trpc.admin.products?.list?.useQuery?.({}) || { data: { products: [] }, refetch: () => {}, isLoading: false };
  const deleteProduct = trpc.admin.products?.delete?.useMutation?.({ onSuccess: () => { toast.success("Product deleted"); productsQuery.refetch?.(); }, onError: (e: any) => toast.error(e.message) }) || { mutate: () => {} };

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  const products = productsQuery.data?.products || [];
  const filteredProducts = useMemo(() => products.filter((p: any) => {
    const matchesSearch = searchQuery === "" || p.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [products, searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((p: any) => p.status === "active").length,
    draft: products.filter((p: any) => p.status === "draft").length,
    totalValue: products.reduce((sum: number, p: any) => sum + (p.price || 0), 0),
  }), [products]);

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (isChecking || productsQuery.isLoading) {
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
              <div><h1 className="text-2xl font-bold text-stone-900">Products</h1><p className="text-stone-500 text-sm">Manage your product catalog</p></div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => productsQuery.refetch?.()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
                <Button onClick={() => setLocation("/admin/products/new")} className="bg-amber-600 hover:bg-amber-700"><Plus className="w-4 h-4 mr-2" />Add Product</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[{ label: "Total Products", value: stats.total, icon: Package, color: "amber" }, { label: "Active", value: stats.active, icon: Eye, color: "emerald" }, { label: "Draft", value: stats.draft, icon: Edit, color: "blue" }, { label: "Catalog Value", value: stats.totalValue / 100, prefix: "$", icon: DollarSign, color: "purple" }].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100/50 border-${stat.color}-200`}>
                  <CardContent className="p-5"><div className="flex items-center justify-between"><div><p className={`text-xs font-medium text-${stat.color}-600`}>{stat.label}</p><p className={`text-2xl font-bold text-${stat.color}-900`}><AnimatedCounter value={stat.value} prefix={stat.prefix} /></p></div><stat.icon className={`w-8 h-8 text-${stat.color}-500`} /></div></CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-4 items-center w-full md:w-auto">
              <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" /><Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-36"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}><LayoutGrid className="w-4 h-4" /></Button>
              <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}><List className="w-4 h-4" /></Button>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><Package className="w-12 h-12 mx-auto text-stone-400 mb-4" /><h3 className="text-lg font-medium mb-2">No Products</h3><p className="text-stone-500">{searchQuery || statusFilter !== "all" ? "Try adjusting filters" : "Add your first product"}</p></CardContent></Card>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product: any, i: number) => (
                <motion.div key={product.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-stone-100 relative">
                      {product.images?.[0] ? <img src={getMediaUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-12 h-12 text-stone-300" /></div>}
                      <Badge className={`absolute top-2 right-2 ${product.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{product.status}</Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold truncate">{product.name}</h3>
                      <p className="text-lg font-bold text-amber-600">{formatPrice(product.price || 0)}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm text-stone-500">{product.stockQuantity || 0} in stock</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setLocation(`/admin/products/${product.id}`)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteProduct.mutate?.({ id: product.id }); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((product: any, i: number) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
                        {product.images?.[0] ? <img src={getMediaUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-6 h-6 text-stone-300" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><h3 className="font-semibold truncate">{product.name}</h3><Badge className={product.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>{product.status}</Badge></div>
                        <p className="text-sm text-stone-500">{product.category || "Uncategorized"} • {product.stockQuantity || 0} in stock</p>
                      </div>
                      <p className="text-lg font-bold text-amber-600">{formatPrice(product.price || 0)}</p>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setLocation(`/admin/products/${product.id}`)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteProduct.mutate?.({ id: product.id }); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
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
