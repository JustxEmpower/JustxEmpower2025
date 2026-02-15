import { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Helmet } from "react-helmet";
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
  
  // Shop Next carousel state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  const { addToCart, getCartCount } = useCart();
  
  const { data: product, isLoading, error } = trpc.shop.products.bySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );
  
  // Fetch other products for "Shop Next" section
  const { data: allProducts } = trpc.shop.products.list.useQuery(
    { limit: 10 },
    { enabled: !!product }
  );
  
  // Filter out current product
  const nextProducts = (allProducts?.products || []).filter(p => p.slug !== slug);
  
  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };
  
  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [nextProducts]);
  
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 350;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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
    let productDetails = "";
    
    if (product.dimensions) {
      try {
        // Handle both string (needs parsing) and object (already parsed by API)
        const parsed = typeof product.dimensions === 'string' 
          ? JSON.parse(product.dimensions) 
          : product.dimensions;
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
        productDetails = parsed.productDetails || "";
      } catch (e) {}
    }
    return { productType, sizes, showSizes, colors, material, isbn, author, publisher, pageCount, duration, accessType, modules, fileType, downloadLink, productDetails };
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

  const productUrl = `https://justxempower.com/shop/${slug}`;
  const productImage = product.featuredImage ? (product.featuredImage.startsWith('http') ? product.featuredImage : getMediaUrl(product.featuredImage)) : (allMedia[0]?.url || '');
  const productMetaDesc = product.description ? product.description.replace(/<[^>]*>/g, '').slice(0, 155) + (product.description.length > 155 ? '...' : '') : `Shop ${product.name} at Just Empower®.`;
  const productMetaTitle = `${product.name} | Just Empower® Shop`;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": productMetaDesc,
    "image": productImage || undefined,
    "url": productUrl,
    "brand": { "@type": "Brand", "name": "Just Empower®" },
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "USD",
      "price": (product.price / 100).toFixed(2),
      "availability": isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      "seller": { "@type": "Organization", "name": "Just Empower®" },
    },
    ...(productInfo.isbn ? { "isbn": productInfo.isbn } : {}),
    ...(productInfo.author ? { "author": { "@type": "Person", "name": productInfo.author } } : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://justxempower.com" },
      { "@type": "ListItem", "position": 2, "name": "Shop", "item": "https://justxempower.com/shop" },
      { "@type": "ListItem", "position": 3, "name": product.name, "item": productUrl },
    ]
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Helmet>
        <title>{productMetaTitle}</title>
        <meta name="description" content={productMetaDesc} />
        <link rel="canonical" href={productUrl} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={productUrl} />
        <meta property="og:title" content={productMetaTitle} />
        <meta property="og:description" content={productMetaDesc} />
        <meta property="og:site_name" content="Just Empower®" />
        {productImage && <meta property="og:image" content={productImage} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={productMetaTitle} />
        <meta name="twitter:description" content={productMetaDesc} />
        {productImage && <meta name="twitter:image" content={productImage} />}
        <meta property="product:price:amount" content={(product.price / 100).toFixed(2)} />
        <meta property="product:price:currency" content="USD" />
        <script type="application/ld+json">{JSON.stringify(productJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      </Helmet>

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
              
              {/* Thumbnail Navigation - Premium Apple-style design */}
              {allMedia.length > 1 && (
                <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-3 px-8">
                  {/* Dot indicators */}
                  <div className="flex items-center gap-2">
                    {allMedia.map((media, idx: number) => (
                      <button
                        key={`dot-${idx}`}
                        onClick={() => goToMedia(idx)}
                        className="relative transition-all duration-500 ease-out"
                        style={{
                          width: selectedImage === idx ? '20px' : '6px',
                          height: '6px',
                          borderRadius: '3px',
                          background: selectedImage === idx ? goldColor : 'rgba(0,0,0,0.15)',
                        }}
                        aria-label={`View ${media.type === 'video' ? 'video' : 'image'} ${idx + 1}`}
                      />
                    ))}
                  </div>
                  {/* Thumbnail images - scrollable container constrained to column */}
                  <div className="w-full max-w-full overflow-x-auto scrollbar-hide">
                    <div className="flex items-center justify-center gap-2 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-lg p-2 mx-auto w-fit max-w-full">
                      {allMedia.map((media, idx: number) => (
                        <button
                          key={`thumb-${idx}`}
                          onClick={() => goToMedia(idx)}
                          className={`relative flex-shrink-0 w-12 h-12 rounded-md overflow-hidden transition-all duration-300 ${
                            selectedImage === idx 
                              ? 'ring-2 ring-offset-1 scale-105' 
                              : 'opacity-60 hover:opacity-100'
                          }`}
                          style={{ 
                            ringColor: selectedImage === idx ? goldColor : 'transparent',
                            borderColor: selectedImage === idx ? goldColor : 'transparent',
                          }}
                          aria-label={`View ${media.type === 'video' ? 'video' : 'image'} ${idx + 1}`}
                        >
                          {media.type === 'video' ? (
                            <div className="w-full h-full bg-stone-800 flex items-center justify-center">
                              <Play className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <img 
                              src={getMediaUrl(media.url)} 
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                          {selectedImage === idx && (
                            <div 
                              className="absolute inset-0 pointer-events-none"
                              style={{ boxShadow: `inset 0 0 0 2px ${goldColor}` }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Info - Right Side */}
          <div className="flex flex-col justify-center px-8 lg:px-16 py-12">
            {/* Product Name */}
            <h1 className="text-3xl md:text-4xl font-semibold text-stone-900 dark:text-foreground mb-3">
              {product.name}
            </h1>
            
            {/* Price */}
            <p className="text-2xl md:text-3xl text-stone-700 dark:text-muted-foreground mb-8">
              {formatPrice(product.price)}
            </p>
            
            {/* Description */}
            {product.description && (
              <p className="text-base md:text-lg leading-relaxed text-stone-600 dark:text-muted-foreground mb-8 max-w-md">
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
            
            {/* Book Details - Prominent display for book products or any product with book fields */}
            {(productInfo.productType === "book" || productInfo.author || productInfo.publisher || productInfo.isbn || productInfo.pageCount) && (productInfo.author || productInfo.publisher || productInfo.isbn || productInfo.pageCount) && (
              <div className="mb-8 p-4 bg-stone-50 dark:bg-muted/30 rounded-lg border border-stone-200 dark:border-border">
                <p className="text-xs uppercase tracking-wider text-stone-500 dark:text-muted-foreground mb-3 font-medium">
                  📚 Book Details
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {productInfo.author && (
                    <div>
                      <span className="text-stone-500 dark:text-muted-foreground">Author</span>
                      <p className="text-stone-900 dark:text-foreground font-medium">{productInfo.author}</p>
                    </div>
                  )}
                  {productInfo.publisher && (
                    <div>
                      <span className="text-stone-500 dark:text-muted-foreground">Publisher</span>
                      <p className="text-stone-900 dark:text-foreground font-medium">{productInfo.publisher}</p>
                    </div>
                  )}
                  {productInfo.isbn && (
                    <div>
                      <span className="text-stone-500 dark:text-muted-foreground">ISBN</span>
                      <p className="text-stone-900 dark:text-foreground font-medium">{productInfo.isbn}</p>
                    </div>
                  )}
                  {productInfo.pageCount && (
                    <div>
                      <span className="text-stone-500 dark:text-muted-foreground">Pages</span>
                      <p className="text-stone-900 dark:text-foreground font-medium">{productInfo.pageCount}</p>
                    </div>
                  )}
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
                    <div className="py-4 text-base text-stone-600 dark:text-muted-foreground space-y-3">
                      {/* Product Details - separate editable field with preserved line breaks */}
                      {productInfo.productDetails && <div className="whitespace-pre-line">{productInfo.productDetails}</div>}
                      {/* Fall back to description if no productDetails */}
                      {!productInfo.productDetails && product.description && <p>{product.description}</p>}
                      
                      {/* Apparel details */}
                      {productInfo.productType === "apparel" && (
                        <>
                          {productInfo.material && <p><span className="font-medium">Material:</span> {productInfo.material}</p>}
                          {productInfo.colors && <p><span className="font-medium">Colors:</span> {productInfo.colors}</p>}
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

      {/* Shop Next Section - Apple-style with scroll arrows */}
      {nextProducts.length > 0 && (
        <section className="bg-stone-50 dark:bg-stone-900/50 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 mb-2">Continue Shopping</p>
                <h2 className="text-2xl md:text-3xl font-light text-stone-900 dark:text-white">You May Also Like</h2>
              </div>
              
              {/* Navigation Arrows */}
              {nextProducts.length > 3 && (
                <div className="flex gap-3">
                  <button
                    onClick={() => scrollCarousel('left')}
                    disabled={!canScrollLeft}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                      canScrollLeft 
                        ? 'border-stone-900 dark:border-white text-stone-900 dark:text-white hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900' 
                        : 'border-stone-300 dark:border-stone-700 text-stone-300 dark:text-stone-700 cursor-not-allowed'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => scrollCarousel('right')}
                    disabled={!canScrollRight}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                      canScrollRight 
                        ? 'border-stone-900 dark:border-white text-stone-900 dark:text-white hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900' 
                        : 'border-stone-300 dark:border-stone-700 text-stone-300 dark:text-stone-700 cursor-not-allowed'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Scrollable Products Container */}
            <div 
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {nextProducts.map((nextProduct) => (
                <Link key={nextProduct.id} href={`/shop/${nextProduct.slug}`}>
                  <div className="group cursor-pointer flex-shrink-0 w-[280px] md:w-[320px] snap-start">
                    {/* Product Image */}
                    <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-stone-200 dark:bg-stone-800">
                      {nextProduct.featuredImage ? (
                        <img
                          src={getMediaUrl(nextProduct.featuredImage)}
                          alt={nextProduct.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-stone-300 to-stone-400 dark:from-stone-700 dark:to-stone-800" />
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <h3 className="text-base font-medium text-stone-900 dark:text-white mb-1 group-hover:text-amber-700 dark:group-hover:text-amber-500 transition-colors line-clamp-2">
                      {nextProduct.name}
                    </h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      {nextProduct.formattedPrice}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cart Slideout */}
      <CartSlideout open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
