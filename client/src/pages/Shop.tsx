import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import CartSlideout from "@/components/CartSlideout";
import { EditablePageZone } from '@/components/PageZone';
import { usePageContent } from "@/hooks/usePageContent";
import { getMediaUrl } from "@/lib/media";

interface ShopProps {
  slug?: string;
}

export default function Shop({ slug = 'shop' }: ShopProps) {
  const [, setLocation] = useLocation();
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  
  // Connect to CMS content
  const { getContent, isLoading: contentLoading } = usePageContent(slug);
  
  // Get hero content from CMS
  const heroTitle = getContent('hero', 'title') || 'Shop';
  const heroSubtitle = getContent('hero', 'subtitle') || '';
  const heroDescription = getContent('hero', 'description') || '';
  const heroVideoUrl = getContent('hero', 'videoUrl');
  const heroImageUrl = getContent('hero', 'imageUrl');
  
  // Get overview content from CMS
  const overviewTitle = getContent('overview', 'title');
  const overviewParagraph1 = getContent('overview', 'paragraph1');
  const overviewParagraph2 = getContent('overview', 'paragraph2');
  
  // Helper to get proper media URL
  const getProperMediaUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : getMediaUrl(url);
  };
  
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
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Shop Category Navigation Bar - positioned below main header */}
      <div className="fixed top-[88px] left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Back to Home + Category Navigation - Yeezy Style */}
          <nav className="flex items-center gap-6 flex-wrap">
            <button
              type="button"
              onClick={() => setLocation("/")}
              className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-3 h-3" />
              Home
            </button>
            <span className="text-border">|</span>
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              className={`text-[11px] uppercase tracking-[0.2em] transition-colors ${
                categoryId === null ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {categories.map((cat: { id: number; slug: string; name: string }) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setCategoryId(cat.id)}
                className={`text-[11px] uppercase tracking-[0.2em] transition-colors ${
                  categoryId === cat.id ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </nav>
          
          {/* Cart */}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartItemCount > 0 && (
              <span className="text-foreground font-medium">{cartItemCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Page Builder Zone: After Hero */}
      <EditablePageZone pageSlug="shop" zoneName="after-hero" />

      {/* Products Grid - Yeezy Style */}
      <main className="pt-[140px] pb-20">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
              No products available
            </p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
              Check back soon
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      
      {/* Page Builder Zone: Before Footer */}
      <EditablePageZone pageSlug="shop" zoneName="before-footer" />
      
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
    images?: string[] | string | null;
    status: string;
    stockQuantity?: number | null;
    formattedPrice: string;
    formattedComparePrice?: string | null;
    formattedCompareAtPrice?: string | null;
    tags?: string[];
  };
}

// Safe JSON parse helper for product images
function safeParseImages(images: string | string[] | null | undefined): string[] {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  if (typeof images !== 'string' || !images.trim() || images === 'null') return [];
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('[ProductCard] Failed to parse images:', images?.substring?.(0, 50));
    return [];
  }
}

function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Safely parse images using helper
  const images = safeParseImages(product.images);
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
        <div className="aspect-square bg-muted overflow-hidden">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">No Image</span>
            </div>
          ) : (
            <img
              src={isHovered ? hoverImage : mainImage}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          )}
        </div>
        
        {/* Product Code Overlay - Yeezy Style */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-[11px] uppercase tracking-[0.3em] text-foreground font-medium bg-background/90 px-4 py-2">
            {productCode}
          </span>
        </div>
        
        {/* Minimal Product Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
            {product.formattedPrice}
          </p>
        </div>
      </div>
    </Link>
  );
}
