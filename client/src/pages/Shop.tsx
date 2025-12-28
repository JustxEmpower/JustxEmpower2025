import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import CartSlideout from "@/components/CartSlideout";

export default function Shop() {
  const [category, setCategory] = useState<string>("all");
  const [cartOpen, setCartOpen] = useState(false);
  
  const { cart } = useCart();
  const cartItemCount = cart.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
  
  const { data, isLoading } = trpc.shop.products.list.useQuery({
    categoryId: category === "all" ? undefined : parseInt(category) || undefined,
    sortBy: "newest",
    limit: 50,
  });
  
  const { data: categoriesData } = trpc.shop.categories.list.useQuery();
  
  const products = data?.products || [];
  const categories = categoriesData || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header Bar */}
      <div className="fixed top-20 left-0 right-0 z-40 bg-white border-b border-neutral-100">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Back to Home + Category Navigation - Yeezy Style */}
          <nav className="flex items-center gap-8">
            <Link
              href="/"
              className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-black transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-3 h-3" />
              Home
            </Link>
            <span className="text-neutral-200">|</span>
            <button
              onClick={() => setCategory("all")}
              className={`text-[11px] uppercase tracking-[0.2em] transition-colors ${
                category === "all" ? "text-black" : "text-neutral-400 hover:text-black"
              }`}
            >
              All
            </button>
            {categories.map((cat: { id: number; slug: string; name: string }) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.slug)}
                className={`text-[11px] uppercase tracking-[0.2em] transition-colors ${
                  category === cat.slug ? "text-black" : "text-neutral-400 hover:text-black"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </nav>
          
          {/* Cart */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative text-[11px] uppercase tracking-[0.2em] text-neutral-600 hover:text-black transition-colors flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartItemCount > 0 && (
              <span className="text-black">{cartItemCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Products Grid - Yeezy Style */}
      <main className="pt-32 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-square bg-neutral-50 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 mb-4">
              No products available
            </p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-300">
              Check back soon
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
  const images = product.images ? JSON.parse(product.images) : [];
  const mainImage = images[0] || "/placeholder-product.jpg";
  const hoverImage = images[1] || mainImage;
  
  // Extract product code from name or generate one
  const productCode = product.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2) + '-' + String(product.id).padStart(2, '0');

  return (
    <Link href={`/shop/${product.slug}`}>
      <div 
        className="group relative cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Product Image */}
        <div className="aspect-square bg-neutral-50 overflow-hidden">
          <img
            src={isHovered ? hoverImage : mainImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>
        
        {/* Product Code Overlay - Yeezy Style */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-[11px] uppercase tracking-[0.3em] text-black font-medium bg-white/90 px-4 py-2">
            {productCode}
          </span>
        </div>
        
        {/* Minimal Product Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-1">
            {product.formattedPrice}
          </p>
        </div>
      </div>
    </Link>
  );
}
