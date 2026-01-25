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

      {/* Page Builder Zone: Mid Page */}
      <EditablePageZone pageSlug="shop" zoneName="mid-page" />

      {/* Products Grid - Apple-inspired elegant layout */}
      <main className="pt-[140px] pb-20">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
                No products available
              </p>
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground/60">
                Check back soon
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 justify-items-center">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>
      
      {/* Page Builder Zone: After Content */}
      <EditablePageZone pageSlug="shop" zoneName="after-content" />

      {/* Page Builder Zone: Before Newsletter */}
      <EditablePageZone pageSlug="shop" zoneName="before-newsletter" />

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
    featuredImage?: string | null;
    shortDescription?: string | null;
    dimensions?: string | null;
    status: string;
    stockQuantity?: number | null;
    formattedPrice: string;
    formattedComparePrice?: string | null;
    formattedCompareAtPrice?: string | null;
    tags?: string[];
  };
}

// Safe JSON parse helper for product images - filters out videos
function safeParseImages(images: string | string[] | null | undefined): string[] {
  if (!images) return [];
  
  // Helper to check if item is an image (not video)
  const isImageItem = (item: any): boolean => {
    if (typeof item === 'object' && item?.type) {
      return item.type === 'image';
    }
    // If it's a string URL, check extension
    const url = typeof item === 'string' ? item : item?.url;
    if (!url) return false;
    const ext = url.split('.').pop()?.toLowerCase();
    return !['mov', 'mp4', 'webm', 'avi', 'mkv'].includes(ext || '');
  };
  
  // Helper to extract URL from item
  const getUrl = (item: any): string => {
    return typeof item === 'object' && item?.url ? item.url : item;
  };
  
  if (Array.isArray(images)) {
    return images.filter(isImageItem).map(getUrl).filter(Boolean);
  }
  if (typeof images !== 'string' || !images.trim() || images === 'null') return [];
  try {
    const parsed = JSON.parse(images);
    if (Array.isArray(parsed)) {
      return parsed.filter(isImageItem).map(getUrl).filter(Boolean);
    }
    return [];
  } catch (e) {
    console.warn('[ProductCard] Failed to parse images:', images?.substring?.(0, 50));
    return [];
  }
}

// Font size mapping for Tailwind classes - increased defaults
const fontSizeMap: Record<string, string> = {
  xs: "text-sm",
  sm: "text-base",
  base: "text-lg",
  lg: "text-xl",
  xl: "text-2xl",
};

function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Safely parse images using helper
  const images = safeParseImages(product.images);
  // Use featuredImage first, then fall back to images array
  const hasFeaturedImage = product.featuredImage && product.featuredImage.trim();
  const mainImage = hasFeaturedImage 
    ? product.featuredImage 
    : (images[0] || "/placeholder-product.jpg");
  // If using featuredImage as main, hover should be first gallery image (images[0])
  // If using images[0] as main, hover should be second gallery image (images[1])
  const hoverImage = hasFeaturedImage 
    ? (images[0] || mainImage)
    : (images[1] || images[0] || mainImage);
  
  // Parse display settings from dimensions JSON
  const getDisplaySettings = () => {
    if (!product.dimensions) return { nameFontSize: "base", priceFontSize: "base" };
    try {
      const parsed = JSON.parse(product.dimensions);
      return {
        nameFontSize: parsed.nameFontSize || "base",
        priceFontSize: parsed.priceFontSize || "base",
      };
    } catch {
      return { nameFontSize: "base", priceFontSize: "base" };
    }
  };
  const displaySettings = getDisplaySettings();
  
  // Parse sub-description from shortDescription JSON
  const getSubDescription = (): string => {
    if (!product.shortDescription) return "";
    try {
      const parsed = JSON.parse(product.shortDescription);
      return parsed.subDescription || "";
    } catch {
      return product.shortDescription; // Fallback to raw string
    }
  };
  const subDescription = getSubDescription();
  
  return (
    <Link href={`/shop/${product.slug}`}>
      <div 
        className="group relative cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Product Image - Apple-inspired with subtle shadow and rounded corners */}
        <div className="aspect-[4/5] bg-gradient-to-b from-stone-50 to-stone-100 dark:from-muted dark:to-muted/80 overflow-hidden rounded-2xl shadow-sm group-hover:shadow-lg transition-shadow duration-500">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-sm uppercase tracking-[0.15em] text-stone-400 dark:text-muted-foreground">No Image</span>
            </div>
          ) : (
            <img
              src={getMediaUrl(isHovered ? hoverImage : mainImage)}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.03]"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          )}
        </div>
        
        {/* Product Info - Clean Apple-style typography */}
        <div className="pt-5 px-1">
          <h3 className="text-xl md:text-2xl font-medium text-stone-900 dark:text-foreground leading-snug">{product.name}</h3>
          {subDescription && (
            <p className="text-base md:text-lg text-stone-500 dark:text-muted-foreground/70 mt-2 leading-relaxed line-clamp-3">{subDescription}</p>
          )}
          <p className={`${fontSizeMap[displaySettings.priceFontSize] || 'text-lg'} text-stone-600 dark:text-muted-foreground mt-3 font-medium`}>
            {product.formattedPrice}
          </p>
        </div>
      </div>
    </Link>
  );
}
