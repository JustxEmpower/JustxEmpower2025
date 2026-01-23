import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import CartSlideout from "@/components/CartSlideout";
import { getMediaUrl } from "@/lib/media";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const [quantity, setQuantity] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  const { addToCart, getCartCount } = useCart();
  
  const { data: product, isLoading, error } = trpc.shop.products.bySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border border-border border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-8">
          Product not found
        </p>
        <Link href="/shop">
          <span className="text-[11px] uppercase tracking-[0.2em] text-foreground hover:text-muted-foreground transition-colors">
            ← Back to Shop
          </span>
        </Link>
      </div>
    );
  }

  // Safely parse images JSON with error handling
  const parseImages = (imgData: string | string[] | null | undefined): string[] => {
    if (!imgData) return [];
    if (Array.isArray(imgData)) return imgData;
    if (typeof imgData !== 'string' || !imgData.trim() || imgData === 'null') return [];
    try {
      const parsed = JSON.parse(imgData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('[ProductDetail] Failed to parse images:', imgData?.substring?.(0, 50));
      return [];
    }
  };
  const images = parseImages(product.images as unknown as string);
  // Use featuredImage first, then fall back to images array
  const allImages = product.featuredImage ? [product.featuredImage, ...images] : images;
  const mainImage = allImages[selectedImage] || "/placeholder-product.jpg";
  const isOutOfStock = product.stock != null && product.stock <= 0;
  
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  
  // Parse sizes from product dimensions or use default
  const parseSizes = (): { sizes: string[], showSizes: boolean } => {
    if (product.dimensions) {
      try {
        const parsed = JSON.parse(product.dimensions);
        const sizes = Array.isArray(parsed) ? parsed : (parsed.sizes || []);
        const showSizes = parsed.showSizes !== false;
        return { sizes, showSizes };
      } catch (e) {}
    }
    return { sizes: [], showSizes: true };
  };
  const { sizes: availableSizes, showSizes } = parseSizes();
  const hasSizes = showSizes && availableSizes.length > 0;
  
  // Parse shipping and return info from shortDescription
  const parseShippingInfo = (): { shippingInfo: string, returnPolicy: string } => {
    if (product.shortDescription) {
      try {
        const parsed = JSON.parse(product.shortDescription);
        return {
          shippingInfo: parsed.shippingInfo || "Free shipping on orders over $100.",
          returnPolicy: parsed.returnPolicy || "Returns accepted within 30 days of purchase."
        };
      } catch (e) {}
    }
    return {
      shippingInfo: "Free shipping on orders over $100.",
      returnPolicy: "Returns accepted within 30 days of purchase."
    };
  };
  const { shippingInfo, returnPolicy } = parseShippingInfo();

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: mainImage,
        quantity,
      });
      setCartOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Minimal Top Bar */}
      <div className="fixed top-20 left-0 right-0 z-40 bg-white dark:bg-background border-b border-stone-200 dark:border-border">
        <div className="flex items-center justify-between px-6 py-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLocation('/shop');
            }}
            className="text-[11px] uppercase tracking-[0.2em] text-stone-600 dark:text-muted-foreground hover:text-stone-900 dark:hover:text-foreground transition-colors flex items-center gap-2 cursor-pointer z-50"
          >
            <ChevronLeft className="w-3 h-3" />
            Back
          </button>
          
          <span className="text-sm font-medium text-stone-900 dark:text-foreground">
            {product.name}
          </span>
          
          <button
            onClick={() => setCartOpen(true)}
            className="text-[11px] uppercase tracking-[0.2em] text-stone-600 dark:text-muted-foreground hover:text-stone-900 dark:hover:text-foreground transition-colors flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            {getCartCount() > 0 && <span>{getCartCount()}</span>}
          </button>
        </div>
      </div>

      {/* Product Content */}
      <main className="pt-32 pb-20">
        <div className="grid lg:grid-cols-2 min-h-[calc(100vh-200px)]">
          {/* Image Gallery - Left Side */}
          <div className="relative">
            {/* Main Image */}
            <div className="sticky top-32 h-[calc(100vh-200px)]">
              <div className="h-full bg-stone-100 dark:bg-muted flex items-center justify-center p-8">
                <img
                  src={getMediaUrl(mainImage)}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              
              {/* Thumbnail Navigation */}
              {allImages.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                  {allImages.map((_: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        selectedImage === idx ? "bg-foreground" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info - Right Side */}
          <div className="flex flex-col justify-center px-8 lg:px-16 py-12">
            {/* Product Name */}
            <h1 className="text-2xl font-semibold text-stone-900 dark:text-foreground mb-2">
              {product.name}
            </h1>
            
            {/* Price */}
            <p className="text-xl text-stone-700 dark:text-muted-foreground mb-8">
              {formatPrice(product.price)}
            </p>
            
            {/* Description */}
            {product.description && (
              <p className="text-sm leading-relaxed text-stone-600 dark:text-muted-foreground mb-8 max-w-md">
                {product.description}
              </p>
            )}
            
            {/* Size/Variant Selector - Only show if product has sizes */}
            {hasSizes && (
              <div className="mb-8">
                <p className="text-xs uppercase tracking-wider text-stone-500 dark:text-muted-foreground mb-4">
                  Select Size
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border text-sm transition-colors ${
                        selectedSize === size 
                          ? 'border-stone-900 dark:border-foreground bg-stone-900 dark:bg-foreground text-white dark:text-background' 
                          : 'border-stone-300 dark:border-border text-stone-900 dark:text-foreground hover:border-stone-900 dark:hover:border-foreground'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quantity */}
            <div className="mb-8">
              <p className="text-xs uppercase tracking-wider text-stone-500 dark:text-muted-foreground mb-4">
                Quantity
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={isOutOfStock}
                  className="w-10 h-10 border border-stone-300 dark:border-border text-stone-900 dark:text-foreground flex items-center justify-center hover:border-stone-900 dark:hover:border-foreground transition-colors disabled:opacity-50"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm w-8 text-center text-stone-900 dark:text-foreground">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={isOutOfStock || (product.stock != null && quantity >= product.stock)}
                  className="w-10 h-10 border border-stone-300 dark:border-border text-stone-900 dark:text-foreground flex items-center justify-center hover:border-stone-900 dark:hover:border-foreground transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
            
            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`w-full py-4 text-sm uppercase tracking-wider transition-colors ${
                isOutOfStock
                  ? "bg-stone-200 dark:bg-muted text-stone-500 dark:text-muted-foreground cursor-not-allowed"
                  : "bg-stone-900 dark:bg-foreground text-white dark:text-background hover:bg-stone-800 dark:hover:bg-foreground/90"
              }`}
            >
              {isOutOfStock ? "Sold Out" : "Add to Bag"}
            </button>
            
            {/* Stock Status */}
            {!isOutOfStock && product.stock && product.stock < 10 && (
              <p className="text-xs text-stone-500 dark:text-muted-foreground mt-4 text-center">
                Only {product.stock} left
              </p>
            )}
            
            {/* Additional Info - Expandable sections */}
            <div className="mt-12 pt-8 border-t border-stone-200 dark:border-border">
              <div className="space-y-4">
                <div>
                  <button 
                    onClick={() => setExpandedSection(expandedSection === 'details' ? null : 'details')}
                    className="w-full flex items-center justify-between text-sm text-stone-700 dark:text-muted-foreground hover:text-stone-900 dark:hover:text-foreground transition-colors py-2"
                  >
                    <span>Details</span>
                    <Plus className={`w-4 h-4 transition-transform ${expandedSection === 'details' ? 'rotate-45' : ''}`} />
                  </button>
                  {expandedSection === 'details' && (
                    <div className="py-4 text-sm text-stone-600 dark:text-muted-foreground">
                      {product.description || 'No additional details available.'}
                    </div>
                  )}
                </div>
                <div>
                  <button 
                    onClick={() => setExpandedSection(expandedSection === 'shipping' ? null : 'shipping')}
                    className="w-full flex items-center justify-between text-sm text-stone-700 dark:text-muted-foreground hover:text-stone-900 dark:hover:text-foreground transition-colors py-2"
                  >
                    <span>Shipping & Returns</span>
                    <Plus className={`w-4 h-4 transition-transform ${expandedSection === 'shipping' ? 'rotate-45' : ''}`} />
                  </button>
                  {expandedSection === 'shipping' && (
                    <div className="py-4 text-sm text-stone-600 dark:text-muted-foreground">
                      <p className="mb-2">{shippingInfo}</p>
                      <p>{returnPolicy}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Cart Slideout */}
      <CartSlideout open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
