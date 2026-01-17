import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import AdminSidebar from '@/components/AdminSidebar';
import { Tag, Plus, Edit, Trash2, Search, RefreshCw, FolderOpen, Package, Calendar } from "lucide-react";

function AnimatedCounter({ value }: { value: number }) {
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
  return <span>{displayValue.toLocaleString()}</span>;
}

export default function AdminCategoriesEnhanced() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({ name: "", slug: "", description: "" });

  // Try to fetch categories
  const productCategoriesQuery = trpc.shop?.categories?.list?.useQuery?.() || { data: [], isLoading: false, refetch: () => {} };
  const resourceCategoriesQuery = trpc.adminResources?.categories?.list?.useQuery?.() || { data: [], isLoading: false, refetch: () => {} };

  const createProductCategoryMutation = { mutate: () => toast.info("Category creation coming soon"), isPending: false };

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  const resetForm = () => {
    setFormData({ name: "", slug: "", description: "" });
    setEditingCategory(null);
  };

  const handleSubmit = () => {
    if (!formData.name) { toast.error("Name is required"); return; }
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    (createProductCategoryMutation as any).mutate?.({ name: formData.name, slug, description: formData.description || undefined });
  };

  const productCategories = productCategoriesQuery.data || [];
  const resourceCategories = resourceCategoriesQuery.data || [];

  const stats = useMemo(() => ({
    productCategories: Array.isArray(productCategories) ? productCategories.length : 0,
    resourceCategories: Array.isArray(resourceCategories) ? resourceCategories.length : 0,
    total: (Array.isArray(productCategories) ? productCategories.length : 0) + (Array.isArray(resourceCategories) ? resourceCategories.length : 0),
  }), [productCategories, resourceCategories]);

  const filteredProductCategories = useMemo(() => {
    if (!Array.isArray(productCategories)) return [];
    return productCategories.filter((c: any) => searchQuery === "" || c.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [productCategories, searchQuery]);

  const filteredResourceCategories = useMemo(() => {
    if (!Array.isArray(resourceCategories)) return [];
    return resourceCategories.filter((c: any) => searchQuery === "" || c.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [resourceCategories, searchQuery]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-stone-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50 flex">
      <AdminSidebar variant="dark" />

      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Categories</h1>
                <p className="text-stone-500 text-sm">Organize products and resources</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => { productCategoriesQuery.refetch?.(); resourceCategoriesQuery.refetch?.(); }}>
                  <RefreshCw className="w-4 h-4 mr-2" />Refresh
                </Button>
                <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
                  <DialogTrigger asChild>
                    <Button className="bg-amber-600 hover:bg-amber-700"><Plus className="w-4 h-4 mr-2" />Add Category</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingCategory ? "Edit Category" : "Create Category"}</DialogTitle>
                      <DialogDescription>Add a new category to organize your content.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Category name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Slug</Label>
                        <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="category-slug (auto-generated if empty)" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>Cancel</Button>
                      <Button onClick={handleSubmit} className="bg-amber-600 hover:bg-amber-700">
                        {editingCategory ? "Update" : "Create"} Category
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-amber-600">Total Categories</p>
                      <p className="text-2xl font-bold text-amber-900"><AnimatedCounter value={stats.total} /></p>
                    </div>
                    <Tag className="w-8 h-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-blue-600">Product Categories</p>
                      <p className="text-2xl font-bold text-blue-900"><AnimatedCounter value={stats.productCategories} /></p>
                    </div>
                    <Package className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-purple-600">Resource Categories</p>
                      <p className="text-2xl font-bold text-purple-900"><AnimatedCounter value={stats.resourceCategories} /></p>
                    </div>
                    <FolderOpen className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input placeholder="Search categories..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>

          {/* Product Categories */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />Product Categories
            </h2>
            {filteredProductCategories.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-stone-500">No product categories found</CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProductCategories.map((cat: any, i: number) => (
                  <motion.div key={cat.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{cat.name}</h3>
                            <p className="text-sm text-stone-500">{cat.slug}</p>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700">{cat.productCount || 0} products</Badge>
                        </div>
                        {cat.description && <p className="text-sm text-stone-600 mt-2">{cat.description}</p>}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Resource Categories */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-purple-500" />Resource Categories
            </h2>
            {filteredResourceCategories.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-stone-500">No resource categories found</CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredResourceCategories.map((cat: any, i: number) => (
                  <motion.div key={cat.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{cat.name}</h3>
                            <p className="text-sm text-stone-500">{cat.slug}</p>
                          </div>
                          <Badge className="bg-purple-100 text-purple-700">{cat.resourceCount || 0} resources</Badge>
                        </div>
                        {cat.description && <p className="text-sm text-stone-600 mt-2">{cat.description}</p>}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
