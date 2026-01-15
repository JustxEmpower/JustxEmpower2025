import { useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import CartSlideout from "@/components/CartSlideout";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [quantity, setQuantity] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  
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
  const mainImage = images[selectedImage] || "/placeholder-product.jpg";
  const isOutOfStock = product.stock != null && product.stock <= 0;
  
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  
  // Generate product code
  const productCode = product.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2) + '-' + String(product.id).padStart(2, '0');

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
      <div className="fixed top-20 left-0 right-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-6 py-3">
          <Link href="/shop">
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
              <ChevronLeft className="w-3 h-3" />
              Back
            </span>
          </Link>
          
          <span className="text-[11px] uppercase tracking-[0.3em] text-foreground font-medium">
            {productCode}
          </span>
          
          <button
            onClick={() => setCartOpen(true)}
            className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
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
              <div className="h-full bg-muted flex items-center justify-center p-8">
                <img
                  src={mainImage}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              
              {/* Thumbnail Navigation */}
              {images.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_: string, idx: number) => (
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
            <h1 className="text-[11px] uppercase tracking-[0.3em] text-foreground mb-2">
              {product.name}
            </h1>
            
            {/* Price */}
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-12">
              {formatPrice(product.price)}
            </p>
            
            {/* Description */}
            {product.description && (
              <p className="text-[12px] leading-relaxed text-muted-foreground mb-12 max-w-md">
                {product.description}
              </p>
            )}
            
            {/* Size/Variant Selector - Placeholder */}
            <div className="mb-8">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
                Select Size
              </p>
              <div className="flex flex-wrap gap-2">
                {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                  <button
                    key={size}
                    className="w-12 h-12 border border-border text-[11px] uppercase tracking-[0.1em] text-foreground hover:border-foreground transition-colors"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Quantity */}
            <div className="mb-8">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
                Quantity
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={isOutOfStock}
                  className="w-10 h-10 border border-border text-foreground flex items-center justify-center hover:border-foreground transition-colors disabled:opacity-50"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-[11px] uppercase tracking-[0.2em] w-8 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={isOutOfStock || (product.stock != null && quantity >= product.stock)}
                  className="w-10 h-10 border border-border text-foreground flex items-center justify-center hover:border-foreground transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
            
            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`w-full py-4 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                isOutOfStock
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-foreground text-background hover:bg-foreground/90"
              }`}
            >
              {isOutOfStock ? "Sold Out" : "Add to Bag"}
            </button>
            
            {/* Stock Status */}
            {!isOutOfStock && product.stock && product.stock < 10 && (
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-4 text-center">
                Only {product.stock} left
              </p>
            )}
            
            {/* Additional Info */}
            <div className="mt-16 pt-8 border-t border-border">
              <div className="space-y-4">
                <button className="w-full flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors py-2">
                  <span>Details</span>
                  <Plus className="w-3 h-3" />
                </button>
                <button className="w-full flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors py-2">
                  <span>Shipping & Returns</span>
                  <Plus className="w-3 h-3" />
                </button>
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
