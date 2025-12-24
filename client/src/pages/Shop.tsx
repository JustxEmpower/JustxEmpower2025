import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ShoppingCart, Filter, Grid, List } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import CartSlideout from "@/components/CartSlideout";

export default function Shop() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [cartOpen, setCartOpen] = useState(false);
  
  const { cart } = useCart();
  const cartItemCount = cart.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
  
  const { data, isLoading } = trpc.shop.products.list.useQuery({
    search: search || undefined,
    categoryId: category === "all" ? undefined : parseInt(category) || undefined,
    sortBy: sortBy as "newest" | "price_asc" | "price_desc" | "name",
    limit: 20,
  });
  
  const { data: categoriesData } = trpc.shop.categories.list.useQuery();
  
  const products = data?.products || [];
  const categories = categoriesData || [];

  return (
    <div className="min-h-screen bg-[var(--theme-background)]">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-black to-stone-900">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif text-white mb-4">Shop</h1>
          <p className="text-lg text-stone-300 max-w-2xl mx-auto">
            Discover products that support your journey of empowerment and conscious living.
          </p>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="py-8 border-b border-stone-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat: { id: number; slug: string; name: string }) => (
                    <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
              
              {/* View Toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Cart Button */}
              <Button
                variant="outline"
                onClick={() => setCartOpen(true)}
                className="relative"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <Skeleton className="aspect-square" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="h-16 w-16 mx-auto text-stone-300 mb-4" />
              <h3 className="text-xl font-medium text-stone-600 mb-2">No products found</h3>
              <p className="text-stone-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
              {products.map((product: ProductCardProps['product']) => (
                <ProductCard key={product.id} product={product} viewMode={viewMode} />
              ))}
            </div>
          )}
          
          {/* Load More */}
          {data?.hasMore && (
            <div className="text-center mt-8">
              <Button variant="outline" size="lg">
                Load More Products
              </Button>
            </div>
          )}
        </div>
      </section>
      
      {/* Cart Slideout */}
      <CartSlideout open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number | null;
    images?: string | null;
    status: string;
    stockQuantity?: number | null;
    formattedPrice: string;
    formattedComparePrice?: string | null;
  };
  viewMode: "grid" | "list";
}

function ProductCard({ product, viewMode }: ProductCardProps) {
  const { addToCart } = useCart();
  const images = product.images ? JSON.parse(product.images) : [];
  const mainImage = images[0] || "/placeholder-product.jpg";
  const isOnSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const isOutOfStock = product.stockQuantity != null && product.stockQuantity <= 0;
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: mainImage,
        quantity: 1,
      });
    }
  };

  if (viewMode === "list") {
    return (
      <Link href={`/shop/${product.slug}`}>
        <Card className="flex flex-row overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-48 h-48 flex-shrink-0">
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <CardContent className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-medium mb-2">{product.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold">{product.formattedPrice}</span>
                {isOnSale && (
                  <span className="text-sm text-stone-400 line-through">
                    {product.formattedComparePrice}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1"
              >
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/shop/${product.slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <div className="relative aspect-square overflow-hidden">
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {isOnSale && (
            <Badge className="absolute top-2 left-2 bg-red-500">Sale</Badge>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-medium">Out of Stock</span>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-medium mb-2 line-clamp-2">{product.name}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{product.formattedPrice}</span>
              {isOnSale && (
                <span className="text-sm text-stone-400 line-through">
                  {product.formattedComparePrice}
                </span>
              )}
            </div>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="w-full mt-3"
            size="sm"
          >
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
