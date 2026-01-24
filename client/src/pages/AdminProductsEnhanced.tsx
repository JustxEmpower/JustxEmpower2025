import { useState, useEffect, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminSidebar from '@/components/AdminSidebar';
import MediaPicker from '@/components/MediaPicker';
import { motion } from "framer-motion";
import { Package, Plus, Edit, Trash2, Search, RefreshCw, Filter, DollarSign, Eye, LayoutGrid, List, ShoppingBag, Image, Play, Video } from "lucide-react";
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
  const [location, setLocation] = useLocation();
  const [, params] = useRoute("/admin/products/:id");
  const { isAuthenticated, isChecking } = useAdminAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);
  // Product type definitions
  type ProductType = "apparel" | "book" | "course" | "digital" | "physical";
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    subDescription: "",
    price: "",
    compareAtPrice: "",
    sku: "",
    stock: "0",
    status: "draft" as "draft" | "active" | "archived",
    featuredImage: "",
    mediaGallery: [] as Array<{ url: string; type: 'image' | 'video' }>,
    productType: "physical" as ProductType,
    // Apparel fields
    sizeType: "none" as "none" | "preset" | "custom",
    sizePreset: "",
    customSizes: "",
    colors: "",
    material: "",
    // Book fields
    isbn: "",
    author: "",
    publisher: "",
    pageCount: "",
    // Course fields
    duration: "",
    accessType: "lifetime" as "lifetime" | "limited" | "subscription",
    modules: "",
    // Digital fields
    fileType: "",
    downloadLink: "",
    // Common
    shippingInfo: "Free shipping on orders over $100.",
    returnPolicy: "Returns accepted within 30 days of purchase.",
    // Display settings
    nameFontSize: "sm" as "xs" | "sm" | "base" | "lg" | "xl",
    priceFontSize: "sm" as "xs" | "sm" | "base" | "lg" | "xl",
  });

  const productsQuery = trpc.admin.products.list.useQuery({});
  const createProduct = trpc.admin.products.create.useMutation({
    onSuccess: () => {
      toast.success("Product created successfully");
      closeDialog();
      productsQuery.refetch();
    },
    onError: (e: any) => toast.error("Error creating product: " + e.message),
  });
  const updateProduct = trpc.admin.products.update.useMutation({
    onSuccess: () => {
      toast.success("Product updated successfully");
      closeDialog();
      productsQuery.refetch();
    },
    onError: (e: any) => toast.error("Error updating product: " + e.message),
  });
  const deleteProduct = trpc.admin.products.delete.useMutation({ 
    onSuccess: () => { 
      toast.success("Product deleted"); 
      productsQuery.refetch(); 
    }, 
    onError: (e: any) => toast.error(e.message) 
  });

  const resetForm = () => {
    setFormData({ 
      name: "", slug: "", description: "", subDescription: "", price: "", compareAtPrice: "", 
      sku: "", stock: "0", status: "draft", featuredImage: "", mediaGallery: [],
      productType: "physical",
      sizeType: "none", sizePreset: "", customSizes: "", colors: "", material: "",
      isbn: "", author: "", publisher: "", pageCount: "",
      duration: "", accessType: "lifetime", modules: "",
      fileType: "", downloadLink: "",
      shippingInfo: "Free shipping on orders over $100.", returnPolicy: "Returns accepted within 30 days of purchase.",
      nameFontSize: "sm", priceFontSize: "sm"
    });
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    resetForm();
    if (location !== '/admin/products') setLocation('/admin/products');
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: any) => {
    setEditingProduct(product);
    // Parse dimensions for product type and type-specific fields
    let productType: ProductType = "physical";
    let sizeType: "none" | "preset" | "custom" = "none";
    let sizePreset = "", customSizes = "", colors = "", material = "";
    let isbn = "", author = "", publisher = "", pageCount = "";
    let duration = "", accessType: "lifetime" | "limited" | "subscription" = "lifetime", modules = "";
    let fileType = "", downloadLink = "";
    let nameFontSize = "sm", priceFontSize = "sm";
    
    if (product.dimensions) {
      try {
        const parsed = JSON.parse(product.dimensions);
        if (parsed.productType) productType = parsed.productType;
        // Apparel
        if (parsed.sizeType) sizeType = parsed.sizeType;
        if (parsed.sizePreset) sizePreset = parsed.sizePreset;
        if (parsed.customSizes) customSizes = parsed.customSizes;
        if (parsed.colors) colors = parsed.colors;
        if (parsed.material) material = parsed.material;
        // Book
        if (parsed.isbn) isbn = parsed.isbn;
        if (parsed.author) author = parsed.author;
        if (parsed.publisher) publisher = parsed.publisher;
        if (parsed.pageCount) pageCount = parsed.pageCount;
        // Course
        if (parsed.duration) duration = parsed.duration;
        if (parsed.accessType) accessType = parsed.accessType;
        if (parsed.modules) modules = parsed.modules;
        // Digital
        if (parsed.fileType) fileType = parsed.fileType;
        if (parsed.downloadLink) downloadLink = parsed.downloadLink;
        // Display settings
        if (parsed.nameFontSize) nameFontSize = parsed.nameFontSize;
        if (parsed.priceFontSize) priceFontSize = parsed.priceFontSize;
        // Backwards compatibility
        if (!parsed.productType && parsed.sizes && parsed.sizes.length > 0) {
          productType = "apparel";
          sizeType = "custom";
          customSizes = parsed.sizes.join(", ");
        }
      } catch (e) {}
    }
    // Parse shortDescription
    let subDescription = "";
    let shippingInfo = "Free shipping on orders over $100.";
    let returnPolicy = "Returns accepted within 30 days of purchase.";
    if (product.shortDescription) {
      try {
        const parsed = JSON.parse(product.shortDescription);
        if (parsed.subDescription) subDescription = parsed.subDescription;
        if (parsed.shippingInfo) shippingInfo = parsed.shippingInfo;
        if (parsed.returnPolicy) returnPolicy = parsed.returnPolicy;
      } catch (e) {
        subDescription = product.shortDescription;
      }
    }
    // Parse media gallery from images field
    let mediaGallery: Array<{ url: string; type: 'image' | 'video' }> = [];
    if (product.images) {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed)) {
          mediaGallery = parsed.map((item: any) => {
            if (typeof item === 'string') {
              const isVideo = item.match(/\.(mp4|webm|mov|ogg)$/i) || item.includes('youtube') || item.includes('vimeo');
              return { url: item, type: isVideo ? 'video' : 'image' };
            }
            return item;
          });
        }
      } catch (e) {}
    }
    
    setFormData({
      name: product.name || "",
      slug: product.slug || "",
      description: product.description || "",
      subDescription,
      price: product.price ? String(product.price / 100) : "",
      compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice / 100) : "",
      sku: product.sku || "",
      stock: String(product.stock || 0),
      status: product.status || "draft",
      featuredImage: product.featuredImage || "",
      mediaGallery,
      productType, sizeType, sizePreset, customSizes, colors, material,
      isbn, author, publisher, pageCount,
      duration, accessType, modules,
      fileType, downloadLink,
      shippingInfo, returnPolicy,
      nameFontSize, priceFontSize,
    });
    setIsDialogOpen(true);
  };

  // Size preset options
  const sizePresets = [
    { value: "XS-XL", label: "XS - XL", sizes: ["XS", "S", "M", "L", "XL"] },
    { value: "S-3XL", label: "S - 3XL", sizes: ["S", "M", "L", "XL", "2XL", "3XL"] },
    { value: "XS-3XL", label: "XS - 3XL", sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"] },
    { value: "ONE", label: "One Size", sizes: ["One Size"] },
    { value: "NUMERIC", label: "Numeric (0-14)", sizes: ["0", "2", "4", "6", "8", "10", "12", "14"] },
  ];

  const handleSubmit = () => {
    if (!formData.name.trim()) { toast.error("Product name is required"); return; }
    if (!formData.price || parseFloat(formData.price) < 0) { toast.error("Please enter a valid price"); return; }
    
    // Build dimensions JSON based on product type
    let sizes: string[] = [];
    if (formData.productType === "apparel") {
      if (formData.sizeType === "preset" && formData.sizePreset) {
        const preset = sizePresets.find(p => p.value === formData.sizePreset);
        sizes = preset?.sizes || [];
      } else if (formData.sizeType === "custom" && formData.customSizes) {
        sizes = formData.customSizes.split(",").map(s => s.trim()).filter(Boolean);
      }
    }
    
    const dimensionsData: Record<string, any> = {
      productType: formData.productType,
    };
    
    // Add type-specific fields
    if (formData.productType === "apparel") {
      Object.assign(dimensionsData, {
        sizeType: formData.sizeType,
        sizePreset: formData.sizePreset,
        customSizes: formData.customSizes,
        sizes,
        colors: formData.colors,
        material: formData.material,
      });
    } else if (formData.productType === "book") {
      Object.assign(dimensionsData, {
        isbn: formData.isbn,
        author: formData.author,
        publisher: formData.publisher,
        pageCount: formData.pageCount,
      });
    } else if (formData.productType === "course") {
      Object.assign(dimensionsData, {
        duration: formData.duration,
        accessType: formData.accessType,
        modules: formData.modules,
      });
    } else if (formData.productType === "digital") {
      Object.assign(dimensionsData, {
        fileType: formData.fileType,
        downloadLink: formData.downloadLink,
      });
    }
    
    // Always add display settings
    dimensionsData.nameFontSize = formData.nameFontSize;
    dimensionsData.priceFontSize = formData.priceFontSize;
    
    const dimensions = JSON.stringify(dimensionsData);
    
    // Build shortDescription JSON
    const shortDescription = JSON.stringify({ 
      subDescription: formData.subDescription,
      shippingInfo: formData.shippingInfo, 
      returnPolicy: formData.returnPolicy 
    });
    
    // Build images JSON from media gallery
    const images = formData.mediaGallery.length > 0 ? JSON.stringify(formData.mediaGallery) : undefined;
    
    const data = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || formData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      description: formData.description || undefined,
      shortDescription,
      price: Math.round(parseFloat(formData.price) * 100),
      compareAtPrice: formData.compareAtPrice ? Math.round(parseFloat(formData.compareAtPrice) * 100) : undefined,
      sku: formData.sku || undefined,
      stock: parseInt(formData.stock) || 0,
      status: formData.status,
      featuredImage: formData.featuredImage || undefined,
      images,
      dimensions,
    };

    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, ...data });
    } else {
      createProduct.mutate(data);
    }
  };

  useEffect(() => {
    if (!isChecking && !isAuthenticated) setLocation("/admin/login");
  }, [isAuthenticated, isChecking, setLocation]);

  // Auto-open dialog for /new or /:id routes
  useEffect(() => {
    if (location === '/admin/products/new') {
      openCreateDialog();
    } else if (params?.id && params.id !== 'new' && productsQuery.data?.products) {
      const product = productsQuery.data.products.find((p: any) => p.id === parseInt(params.id));
      if (product) openEditDialog(product);
    }
  }, [location, params?.id, productsQuery.data?.products]);

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

  if (isChecking || productsQuery.isPending) {
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
                <Button variant="outline" size="sm" onClick={() => productsQuery.refetch()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
                <Button onClick={openCreateDialog} className="bg-amber-600 hover:bg-amber-700"><Plus className="w-4 h-4 mr-2" />Add Product</Button>
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
                      {(product.featuredImage || product.images?.[0]) ? <img src={getMediaUrl(product.featuredImage || product.images[0])} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-12 h-12 text-stone-300" /></div>}
                      <Badge className={`absolute top-2 right-2 ${product.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{product.status}</Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold truncate">{product.name}</h3>
                      <p className="text-lg font-bold text-amber-600">{formatPrice(product.price || 0)}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm text-stone-500">{product.stockQuantity || 0} in stock</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteProduct.mutate({ id: product.id }); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
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
                        {(product.featuredImage || product.images?.[0]) ? <img src={getMediaUrl(product.featuredImage || product.images[0])} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-6 h-6 text-stone-300" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><h3 className="font-semibold truncate">{product.name}</h3><Badge className={product.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>{product.status}</Badge></div>
                        <p className="text-sm text-stone-500">{product.category || "Uncategorized"} • {product.stockQuantity || 0} in stock</p>
                      </div>
                      <p className="text-lg font-bold text-amber-600">{formatPrice(product.price || 0)}</p>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteProduct.mutate({ id: product.id }); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Create Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Update the product details below." : "Fill in the details to create a new product."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter product name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="auto-generated-from-name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Product description" rows={3} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($) *</Label>
                <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="29.99" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Compare At ($)</Label>
                <Input id="compareAtPrice" type="number" step="0.01" value={formData.compareAtPrice} onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })} placeholder="39.99" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} placeholder="100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="PROD-001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: "draft" | "active" | "archived") => setFormData({ ...formData, status: value })}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Featured Image</Label>
              <div className="flex gap-2">
                <Input value={formData.featuredImage} onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })} placeholder="Click Browse to select" className="flex-1" />
                <Button type="button" variant="outline" onClick={() => setMediaPickerOpen(true)}><Image className="w-4 h-4 mr-2" />Browse</Button>
              </div>
              {formData.featuredImage && (
                <div className="mt-2 relative w-32 h-32 rounded-lg overflow-hidden bg-stone-100">
                  <img src={getMediaUrl(formData.featuredImage)} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            
            {/* Media Gallery - Multiple Images & Videos */}
            <div className="space-y-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-amber-900">📸 Media Gallery (Images & Videos)</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setGalleryPickerOpen(true)}
                  className="border-amber-300 hover:bg-amber-100"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Media
                </Button>
              </div>
              <p className="text-xs text-amber-700">Add additional images and videos to showcase your product</p>
              
              {formData.mediaGallery.length > 0 ? (
                <div className="grid grid-cols-4 gap-3">
                  {formData.mediaGallery.map((media, idx) => (
                    <div key={idx} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-stone-100 border-2 border-stone-200">
                        {media.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-stone-800">
                            <Play className="w-8 h-8 text-white" />
                          </div>
                        ) : (
                          <img src={getMediaUrl(media.url)} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newGallery = [...formData.mediaGallery];
                          newGallery.splice(idx, 1);
                          setFormData({ ...formData, mediaGallery: newGallery });
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                        {media.type === 'video' ? '🎬 Video' : '🖼️ Image'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-stone-400 text-sm border-2 border-dashed border-stone-200 rounded-lg">
                  No additional media added yet
                </div>
              )}
            </div>
            
            {/* Sub-Description for Shop Page */}
            <div className="space-y-2">
              <Label htmlFor="subDescription">Shop Page Tagline</Label>
              <Input 
                id="subDescription"
                value={formData.subDescription} 
                onChange={(e) => setFormData({ ...formData, subDescription: e.target.value })} 
                placeholder="A short tagline shown under the product name on shop page"
              />
            </div>

            {/* Product Type Selector */}
            <div className="space-y-3 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border border-violet-200">
              <Label className="text-sm font-semibold text-violet-900">Product Type</Label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { value: "physical", label: "Physical", icon: "📦" },
                  { value: "apparel", label: "Apparel", icon: "👕" },
                  { value: "book", label: "Book", icon: "📚" },
                  { value: "course", label: "Course", icon: "🎓" },
                  { value: "digital", label: "Digital", icon: "💾" },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, productType: type.value as ProductType })}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      formData.productType === type.value 
                        ? "border-violet-500 bg-violet-100 shadow-sm" 
                        : "border-stone-200 bg-white hover:border-violet-300"
                    }`}
                  >
                    <span className="text-xl block mb-1">{type.icon}</span>
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* APPAREL FIELDS */}
            {formData.productType === "apparel" && (
              <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <Label className="text-sm font-semibold text-amber-900">👕 Apparel Details</Label>
                
                <div className="space-y-3">
                  <Label className="text-xs text-amber-700">Size Options</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="sizeType" checked={formData.sizeType === "none"} onChange={() => setFormData({ ...formData, sizeType: "none", sizePreset: "", customSizes: "" })} />
                      <span className="text-sm">No Sizes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="sizeType" checked={formData.sizeType === "preset"} onChange={() => setFormData({ ...formData, sizeType: "preset" })} />
                      <span className="text-sm">Size Range</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="sizeType" checked={formData.sizeType === "custom"} onChange={() => setFormData({ ...formData, sizeType: "custom" })} />
                      <span className="text-sm">Custom</span>
                    </label>
                  </div>
                  {formData.sizeType === "preset" && (
                    <Select value={formData.sizePreset} onValueChange={(value) => setFormData({ ...formData, sizePreset: value })}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Select size range" /></SelectTrigger>
                      <SelectContent>
                        {sizePresets.map(preset => (
                          <SelectItem key={preset.value} value={preset.value}>{preset.label} ({preset.sizes.join(", ")})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {formData.sizeType === "custom" && (
                    <Input value={formData.customSizes} onChange={(e) => setFormData({ ...formData, customSizes: e.target.value })} placeholder="XS, S, M, L, XL, 2XL" className="bg-white" />
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-amber-700">Colors Available</Label>
                    <Input value={formData.colors} onChange={(e) => setFormData({ ...formData, colors: e.target.value })} placeholder="Black, White, Navy" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-amber-700">Material</Label>
                    <Input value={formData.material} onChange={(e) => setFormData({ ...formData, material: e.target.value })} placeholder="100% Cotton" className="bg-white" />
                  </div>
                </div>
              </div>
            )}

            {/* BOOK FIELDS */}
            {formData.productType === "book" && (
              <div className="space-y-4 p-4 bg-sky-50 rounded-lg border border-sky-200">
                <Label className="text-sm font-semibold text-sky-900">📚 Book Details</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-sky-700">ISBN</Label>
                    <Input value={formData.isbn} onChange={(e) => setFormData({ ...formData, isbn: e.target.value })} placeholder="978-0-123456-78-9" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-sky-700">Author</Label>
                    <Input value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} placeholder="Author name" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-sky-700">Publisher</Label>
                    <Input value={formData.publisher} onChange={(e) => setFormData({ ...formData, publisher: e.target.value })} placeholder="Publisher name" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-sky-700">Page Count</Label>
                    <Input type="number" value={formData.pageCount} onChange={(e) => setFormData({ ...formData, pageCount: e.target.value })} placeholder="256" className="bg-white" />
                  </div>
                </div>
              </div>
            )}

            {/* COURSE FIELDS */}
            {formData.productType === "course" && (
              <div className="space-y-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <Label className="text-sm font-semibold text-emerald-900">🎓 Course Details</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-emerald-700">Duration</Label>
                    <Input value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} placeholder="6 weeks, 12 hours total" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-emerald-700">Access Type</Label>
                    <Select value={formData.accessType} onValueChange={(value: "lifetime" | "limited" | "subscription") => setFormData({ ...formData, accessType: value })}>
                      <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lifetime">Lifetime Access</SelectItem>
                        <SelectItem value="limited">Limited Time</SelectItem>
                        <SelectItem value="subscription">Subscription</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-emerald-700">Modules/Lessons</Label>
                  <Input value={formData.modules} onChange={(e) => setFormData({ ...formData, modules: e.target.value })} placeholder="10 modules, 45 lessons" className="bg-white" />
                </div>
              </div>
            )}

            {/* DIGITAL FIELDS */}
            {formData.productType === "digital" && (
              <div className="space-y-4 p-4 bg-pink-50 rounded-lg border border-pink-200">
                <Label className="text-sm font-semibold text-pink-900">💾 Digital Product Details</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-pink-700">File Type</Label>
                    <Input value={formData.fileType} onChange={(e) => setFormData({ ...formData, fileType: e.target.value })} placeholder="PDF, MP3, ZIP" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-pink-700">Download Link (optional)</Label>
                    <Input value={formData.downloadLink} onChange={(e) => setFormData({ ...formData, downloadLink: e.target.value })} placeholder="https://..." className="bg-white" />
                  </div>
                </div>
              </div>
            )}
            
            {/* Shipping & Returns - Better Separated */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Label className="text-sm font-semibold text-blue-900">Shipping Info</Label>
                <Textarea 
                  value={formData.shippingInfo} 
                  onChange={(e) => setFormData({ ...formData, shippingInfo: e.target.value })} 
                  placeholder="Free shipping on orders over $100."
                  rows={2}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <Label className="text-sm font-semibold text-emerald-900">Return Policy</Label>
                <Textarea 
                  value={formData.returnPolicy} 
                  onChange={(e) => setFormData({ ...formData, returnPolicy: e.target.value })} 
                  placeholder="Returns accepted within 30 days of purchase."
                  rows={2}
                  className="bg-white"
                />
              </div>
            </div>
            
            {/* Display Settings */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <Label className="text-sm font-semibold text-slate-900">🎨 Display Settings</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-700">Product Name Font Size</Label>
                  <Select value={formData.nameFontSize} onValueChange={(value: "xs" | "sm" | "base" | "lg" | "xl") => setFormData({ ...formData, nameFontSize: value })}>
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xs">Extra Small</SelectItem>
                      <SelectItem value="sm">Small (Default)</SelectItem>
                      <SelectItem value="base">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                      <SelectItem value="xl">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-700">Price Font Size</Label>
                  <Select value={formData.priceFontSize} onValueChange={(value: "xs" | "sm" | "base" | "lg" | "xl") => setFormData({ ...formData, priceFontSize: value })}>
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xs">Extra Small</SelectItem>
                      <SelectItem value="sm">Small (Default)</SelectItem>
                      <SelectItem value="base">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                      <SelectItem value="xl">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <MediaPicker open={mediaPickerOpen} onClose={() => setMediaPickerOpen(false)} onSelect={(url) => { setFormData({ ...formData, featuredImage: url }); setMediaPickerOpen(false); }} mediaType="image" />
            <MediaPicker 
              open={galleryPickerOpen} 
              onClose={() => setGalleryPickerOpen(false)} 
              onSelect={(url) => { 
                const isVideo = url.match(/\.(mp4|webm|mov|ogg)$/i) || url.includes('youtube') || url.includes('vimeo');
                setFormData({ 
                  ...formData, 
                  mediaGallery: [...formData.mediaGallery, { url, type: isVideo ? 'video' : 'image' }] 
                }); 
                setGalleryPickerOpen(false); 
              }} 
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createProduct.isPending || updateProduct.isPending}>
              {createProduct.isPending || updateProduct.isPending ? "Saving..." : (editingProduct ? "Update Product" : "Create Product")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
