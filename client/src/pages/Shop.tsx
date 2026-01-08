import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ShoppingBag, ArrowLeft, Filter } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import CartSlideout from "@/components/CartSlideout";

export default function Shop() {
  const [, setLocation] = useLocation();
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  
  const { cart } = useCart();
  const cartItemCount = cart.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
  
  const { data, isLoading } = trpc.shop.products.list.useQuery({
    categoryId: categoryId ?? undefined,
    sortBy: "newest",
    limit: 50,
  });
  
  const { data: categoriesData } = trpc.shop.categories.list.useQuery();
  
  const products = data?.products || [];
  const categories = categoriesData || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Shop Category Navigation Bar - Fixed below main header with visible background */}
      <div className="fixed top-[88px] left-0 right-0 z-40 bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between px-6 md:px-12 py-4">
          {/* Back to Home + Category Navigation */}
          <nav className="flex items-center gap-4 md:gap-6 flex-wrap">
            <button
              type="button"
              onClick={() => setLocation("/")}
              className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 hover:text-black transition-colors flex items-center gap-2 font-medium"
            >
              <ArrowLeft className="w-3 h-3" />
              <span className="hidden sm:inline">Home</span>
            </button>
            
            <div className="w-px h-4 bg-neutral-300" />
            
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              className={`text-[11px] uppercase tracking-[0.2em] transition-colors font-medium ${
                categoryId === null 
                  ? "text-black border-b-2 border-black pb-0.5" 
                  : "text-neutral-500 hover:text-black"
              }`}
            >
              All Products
            </button>
            
            {categories.length > 0 && (
              <>
                {categories.map((cat: { id: number; slug: string; name: string }) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={`text-[11px] uppercase tracking-[0.2em] transition-colors font-medium ${
                      categoryId === cat.id 
                        ? "text-black border-b-2 border-black pb-0.5" 
                        : "text-neutral-500 hover:text-black"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </>
            )}
          </nav>
          
          {/* Cart Button */}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 text-neutral-600 hover:text-black transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-black text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <main className="pt-[160px] pb-20 px-4 md:px-8">
        {/* Page Title */}
        <div className="max-w-[1920px] mx-auto mb-8">
          <h1 className="text-2xl md:text-3xl font-serif text-neutral-900">
            {categoryId === null ? "All Products" : categories.find(c => c.id === categoryId)?.name || "Products"}
          </h1>
          <p className="text-sm text-neutral-500 mt-2">
            {products.length} {products.length === 1 ? "item" : "items"}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-square bg-neutral-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-neutral-400" />
            </div>
            <h2 className="text-lg font-medium text-neutral-900 mb-2">No products available</h2>
            <p className="text-sm text-neutral-500 max-w-md">
              {categoryId !== null 
                ? "No products found in this category. Try browsing all products."
                : "Check back soon for new arrivals."
              }
            </p>
            {categoryId !== null && (
              <button
                onClick={() => setCategoryId(null)}
                className="mt-4 text-sm text-black underline hover:no-underline"
              >
                View all products
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {products.map((product: ProductCardProps['product']) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      
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
}

function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Safely parse images JSON
  let images: string[] = [];
  try {
    if (product.images && typeof product.images === 'string' && product.images.trim()) {
      images = JSON.parse(product.images);
    }
  } catch (e) {
    console.warn('Failed to parse product images:', product.images);
    images = [];
  }
  const mainImage = images[0] || "/placeholder-product.jpg";
  const hoverImage = images[1] || mainImage;

  return (
    <Link href={`/shop/${product.slug}`}>
      <div 
        className="group relative cursor-pointer bg-neutral-50 rounded-lg overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Product Image */}
        <div className="aspect-square overflow-hidden">
          <img
            src={isHovered ? hoverImage : mainImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </div>
        
        {/* Product Info - Always visible */}
        <div className="p-4 bg-white">
          <h3 className="text-sm font-medium text-neutral-900 truncate">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-medium text-neutral-900">
              {product.formattedPrice}
            </span>
            {product.formattedComparePrice && (
              <span className="text-xs text-neutral-400 line-through">
                {product.formattedComparePrice}
              </span>
            )}
          </div>
        </div>

        {/* Quick View Overlay on Hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
      </div>
    </Link>
  );
}
