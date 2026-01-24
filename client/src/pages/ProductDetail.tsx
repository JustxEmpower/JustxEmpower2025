import { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingBag, Play } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import CartSlideout from "@/components/CartSlideout";
import { getMediaUrl } from "@/lib/media";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const [quantity, setQuantity] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // Gold accent color for premium feel
  const goldColor = '#C9A962';
  
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

  // Safely parse images/media JSON with error handling
  const parseMedia = (mediaData: string | string[] | null | undefined): Array<{ url: string; type: 'image' | 'video' }> => {
    if (!mediaData) return [];
    if (Array.isArray(mediaData)) {
      return mediaData.map(item => {
        if (typeof item === 'string') {
          const isVideo = item.match(/\.(mp4|webm|mov|ogg)$/i) || item.includes('youtube') || item.includes('vimeo');
          return { url: item, type: isVideo ? 'video' : 'image' };
        }
        return item;
      });
    }
    if (typeof mediaData !== 'string' || !mediaData.trim() || mediaData === 'null') return [];
    try {
      const parsed = JSON.parse(mediaData);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => {
          if (typeof item === 'string') {
            const isVideo = item.match(/\.(mp4|webm|mov|ogg)$/i) || item.includes('youtube') || item.includes('vimeo');
            return { url: item, type: isVideo ? 'video' : 'image' };
          }
          return item;
        });
      }
      return [];
    } catch (e) {
      console.warn('[ProductDetail] Failed to parse media:', mediaData?.substring?.(0, 50));
      return [];
    }
  };
  const mediaItems = parseMedia(product.images as unknown as string);
  // Use featuredImage first, then fall back to media array
  const allMedia = product.featuredImage 
    ? [{ url: product.featuredImage, type: 'image' as const }, ...mediaItems] 
    : mediaItems;
  const currentMedia = allMedia[selectedImage] || { url: "/placeholder-product.jpg", type: 'image' };
  
  // Premium carousel navigation
  const goToMedia = (index: number) => {
    if (isTransitioning || index === selectedImage) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedImage(index);
      setTimeout(() => setIsTransitioning(false), 500);
    }, 100);
  };
  
  const goNext = () => {
    if (allMedia.length <= 1 || isTransitioning) return;
    goToMedia((selectedImage + 1) % allMedia.length);
  };
  
  const goPrev = () => {
    if (allMedia.length <= 1 || isTransitioning) return;
    goToMedia((selectedImage - 1 + allMedia.length) % allMedia.length);
  };
  const isOutOfStock = product.stock != null && product.stock <= 0;
  
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  
  // Parse product type and type-specific fields from dimensions
  const parseProductInfo = () => {
    let productType = "physical";
    let sizes: string[] = [];
    let showSizes = false;
    let colors = "", material = "";
    let isbn = "", author = "", publisher = "", pageCount = "";
    let duration = "", accessType = "", modules = "";
    let fileType = "", downloadLink = "";
    
    if (product.dimensions) {
      try {
        const parsed = JSON.parse(product.dimensions);
        productType = parsed.productType || "physical";
        sizes = Array.isArray(parsed) ? parsed : (parsed.sizes || []);
        showSizes = parsed.sizeType && parsed.sizeType !== "none";
        colors = parsed.colors || "";
        material = parsed.material || "";
        isbn = parsed.isbn || "";
        author = parsed.author || "";
        publisher = parsed.publisher || "";
        pageCount = parsed.pageCount || "";
        duration = parsed.duration || "";
        accessType = parsed.accessType || "";
        modules = parsed.modules || "";
        fileType = parsed.fileType || "";
        downloadLink = parsed.downloadLink || "";
      } catch (e) {}
    }
    return { productType, sizes, showSizes, colors, material, isbn, author, publisher, pageCount, duration, accessType, modules, fileType, downloadLink };
  };
  const productInfo = parseProductInfo();
  const availableSizes = productInfo.sizes;
  const hasSizes = productInfo.showSizes && availableSizes.length > 0;
  
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
      // Get the first image URL for the cart
      const cartImage = product.featuredImage || (allMedia[0]?.url) || "/placeholder-product.jpg";
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: cartImage,
        quantity,
      });
      setCartOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Minimal Top Bar */}
      <div className="fixed top-20 left-0 right-0 z-[60] bg-white dark:bg-background border-b border-stone-200 dark:border-border">
        <div className="flex items-center justify-between px-6 py-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLocation('/shop');
            }}
            className="text-[11px] uppercase tracking-[0.2em] text-stone-600 dark:text-muted-foreground hover:text-stone-900 dark:hover:text-foreground transition-colors flex items-center gap-2 cursor-pointer relative"
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
          {/* Image Gallery - Left Side - Premium Apple-inspired Carousel */}
          <div className="relative group">
            {/* Main Media Display */}
            <div className="sticky top-32 h-[calc(100vh-200px)]">
              <div className="h-full bg-white dark:bg-[#0a0a0a] flex items-center justify-center p-8 relative">
                {currentMedia.type === 'video' ? (
                  <video
                    key={selectedImage}
                    src={getMediaUrl(currentMedia.url)}
                    autoPlay
                    muted
                    loop
                    controls
                    playsInline
                    preload="auto"
                    className="max-w-full max-h-full object-contain rounded-lg"
                    style={{ 
                      opacity: isTransitioning ? 0 : 1,
                      transform: isTransitioning ? 'scale(0.98)' : 'scale(1)',
                      transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      minWidth: '300px',
                      minHeight: '200px',
                    }}
                    onLoadedData={(e) => {
                      const video = e.currentTarget;
                      video.play().catch(() => {});
                    }}
                  />
                ) : (
                  <img
                    key={selectedImage}
                    src={getMediaUrl(currentMedia.url)}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain"
                    style={{ 
                      opacity: isTransitioning ? 0 : 1,
                      transform: isTransitioning ? 'scale(0.98)' : 'scale(1)',
                      transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                )}
                
                {/* Navigation Arrows - Gold accented */}
                {allMedia.length > 1 && (
                  <>
                    <button
                      onClick={goPrev}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out z-20"
                      style={{ 
                        background: 'rgba(0,0,0,0.03)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: `1px solid ${goldColor}40`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0,0,0,0.06)';
                        e.currentTarget.style.borderColor = goldColor;
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0,0,0,0.03)';
                        e.currentTarget.style.borderColor = `${goldColor}40`;
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                      }}
                      aria-label="Previous"
                    >
                      <ChevronLeft className="w-6 h-6" style={{ color: goldColor }} />
                    </button>
                    <button
                      onClick={goNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out z-20"
                      style={{ 
                        background: 'rgba(0,0,0,0.03)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: `1px solid ${goldColor}40`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0,0,0,0.06)';
                        e.currentTarget.style.borderColor = goldColor;
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0,0,0,0.03)';
                        e.currentTarget.style.borderColor = `${goldColor}40`;
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                      }}
                      aria-label="Next"
                    >
                      <ChevronRight className="w-6 h-6" style={{ color: goldColor }} />
                    </button>
                  </>
                )}
              </div>
              
              {/* Thumbnail/Dot Navigation - Premium gold accent */}
              {allMedia.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
                  {allMedia.map((media, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => goToMedia(idx)}
                      className="relative transition-all duration-500 ease-out"
                      style={{
                        width: selectedImage === idx ? '24px' : '8px',
                        height: '8px',
                        borderRadius: '4px',
                        background: selectedImage === idx ? goldColor : 'rgba(0,0,0,0.15)',
                        transform: selectedImage === idx ? 'scale(1)' : 'scale(0.9)',
                      }}
                      onMouseEnter={(e) => {
                        if (idx !== selectedImage) {
                          e.currentTarget.style.background = 'rgba(0,0,0,0.25)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (idx !== selectedImage) {
                          e.currentTarget.style.background = 'rgba(0,0,0,0.15)';
                          e.currentTarget.style.transform = 'scale(0.9)';
                        }
                      }}
                      aria-label={`View ${media.type === 'video' ? 'video' : 'image'} ${idx + 1}`}
                    >
                      {media.type === 'video' && (
                        <Play className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3" style={{ color: selectedImage === idx ? goldColor : 'rgba(0,0,0,0.3)' }} />
                      )}
                    </button>
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
                    <div className="py-4 text-sm text-stone-600 dark:text-muted-foreground space-y-2">
                      {product.description && <p>{product.description}</p>}
                      
                      {/* Apparel details */}
                      {productInfo.productType === "apparel" && (
                        <>
                          {productInfo.material && <p><span className="font-medium">Material:</span> {productInfo.material}</p>}
                          {productInfo.colors && <p><span className="font-medium">Colors:</span> {productInfo.colors}</p>}
                        </>
                      )}
                      
                      {/* Book details */}
                      {productInfo.productType === "book" && (
                        <>
                          {productInfo.author && <p><span className="font-medium">Author:</span> {productInfo.author}</p>}
                          {productInfo.publisher && <p><span className="font-medium">Publisher:</span> {productInfo.publisher}</p>}
                          {productInfo.isbn && <p><span className="font-medium">ISBN:</span> {productInfo.isbn}</p>}
                          {productInfo.pageCount && <p><span className="font-medium">Pages:</span> {productInfo.pageCount}</p>}
                        </>
                      )}
                      
                      {/* Course details */}
                      {productInfo.productType === "course" && (
                        <>
                          {productInfo.duration && <p><span className="font-medium">Duration:</span> {productInfo.duration}</p>}
                          {productInfo.accessType && <p><span className="font-medium">Access:</span> {productInfo.accessType === "lifetime" ? "Lifetime Access" : productInfo.accessType === "subscription" ? "Subscription" : "Limited Time"}</p>}
                          {productInfo.modules && <p><span className="font-medium">Content:</span> {productInfo.modules}</p>}
                        </>
                      )}
                      
                      {/* Digital details */}
                      {productInfo.productType === "digital" && (
                        <>
                          {productInfo.fileType && <p><span className="font-medium">File Type:</span> {productInfo.fileType}</p>}
                        </>
                      )}
                      
                      {!product.description && productInfo.productType === "physical" && 'No additional details available.'}
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
