/**
 * Managed Carousel - Pinned Horizontal Scroll
 * 
 * Section pins in place while vertical scroll controls horizontal movement
 * Like Apple's product pages - lockstep scroll behavior
 * 
 * Supports both:
 * - Legacy mode: Uses carouselOfferings table (default, no slug)
 * - New mode: Uses carousels/carouselSlides tables (when slug is provided)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';

interface LegacySlide {
  id: number;
  title: string;
  description?: string | null;
  link?: string | null;
  imageUrl?: string | null;
  order: number;
  isActive: number;
}

interface NewSlide {
  id: number;
  carouselId: number;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  visible: number;
  sortOrder: number;
}

interface CarouselData {
  id: number;
  name: string;
  slug: string;
  type: string;
  settings: Record<string, any>;
  styling: Record<string, any>;
  slides: NewSlide[];
}

interface ManagedCarouselProps {
  className?: string;
  slug?: string; // If provided, uses new carousel system
  title?: string; // Override title
}

export function ManagedCarousel({ className = '', slug, title }: ManagedCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  
  // Legacy query (carouselOfferings)
  const { data: legacyOfferings, isLoading: legacyLoading } = trpc.carousel.getAll.useQuery(undefined, {
    staleTime: 60000,
    enabled: !slug, // Only fetch if no slug provided
  });

  // New query (carousels/carouselSlides)
  const { data: carouselData, isLoading: newLoading } = trpc.carousel.getBySlug.useQuery(
    { slug: slug || '', includeHidden: false },
    {
      staleTime: 60000,
      enabled: !!slug, // Only fetch if slug provided
    }
  );

  // Determine which data to use
  const isLoading = slug ? newLoading : legacyLoading;
  const slides = slug 
    ? (carouselData?.slides || []).map(s => ({
        id: s.id,
        title: s.title || '',
        description: s.description,
        link: s.ctaLink,
        imageUrl: s.imageUrl,
        order: s.sortOrder,
        isActive: s.visible,
      }))
    : (legacyOfferings || []);

  const displayTitle = title || (slug ? carouselData?.name : 'Our Offerings') || 'Our Offerings';

  const rafRef = useRef<number | null>(null);
  const lastProgressRef = useRef(0);

  const handleScroll = useCallback(() => {
    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Use requestAnimationFrame for smooth updates
    rafRef.current = requestAnimationFrame(() => {
      const container = containerRef.current;
      const track = trackRef.current;
      if (!container || !track) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const containerHeight = container.offsetHeight;
      
      // Calculate how far we've scrolled into the container
      const scrollStart = rect.top;
      const scrollRange = containerHeight - windowHeight;
      
      let newProgress: number;
      if (scrollStart > 0) {
        newProgress = 0;
      } else if (rect.bottom - windowHeight < 0) {
        newProgress = 1;
      } else {
        newProgress = Math.max(0, Math.min(1, Math.abs(scrollStart) / scrollRange));
      }

      // Only update if there's a meaningful change (reduces re-renders)
      if (Math.abs(newProgress - lastProgressRef.current) > 0.001) {
        lastProgressRef.current = newProgress;
        setProgress(newProgress);
      }
    });
  }, []);

  useEffect(() => {
    if (!slides || slides.length === 0) return;
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    // Initial calculation
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [slides, handleScroll]);

  if (!isLoading && (!slides || slides.length === 0)) return null;
  
  if (isLoading) {
    return (
      <section className="relative h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading offerings...</div>
      </section>
    );
  }

  // Calculate dimensions
  const numItems = slides?.length || 0;
  const cardWidth = 35; // vw per card
  const gap = 3; // vw gap
  const totalTrackWidth = numItems * cardWidth + (numItems - 1) * gap; // Total width in vw
  const maxTranslate = totalTrackWidth - 80; // How far to translate (total - viewport visible area)
  
  // Container height determines scroll distance
  // More height = more scroll needed = slower horizontal movement
  const containerHeightVh = 100 + (numItems * 60); // Adjust multiplier for scroll speed
  
  // Calculate translateX based on progress
  const translateX = -progress * maxTranslate;

  return (
    <div 
      ref={containerRef}
      className={`relative bg-background ${className}`}
      style={{ height: `${containerHeightVh}vh` }}
    >
      {/* Sticky wrapper - pins the carousel in viewport */}
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center">
        
        {/* Title */}
        <div className="absolute top-16 left-8 md:left-16 z-20">
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground font-light italic tracking-tight">
            {displayTitle}
          </h2>
        </div>

        {/* Horizontal Track */}
        <div className="relative w-full h-[65vh] flex items-center overflow-visible">
          <div 
            ref={trackRef}
            className="flex items-center h-full will-change-transform"
            style={{ 
              transform: `translate3d(${translateX}vw, 0, 0)`,
              paddingLeft: '10vw',
              gap: `${gap}vw`,
            }}
          >
            {slides!.map((item, index: number) => (
              <Link 
                key={item.id} 
                href={item.link || '/offerings'} 
                className="block h-full shrink-0"
                style={{ width: `${cardWidth}vw` }}
              >
                <div className="relative w-full h-full group overflow-hidden cursor-pointer rounded-[2rem] shadow-2xl shadow-black/10 transition-all duration-500 hover:-translate-y-2 hover:shadow-black/20 bg-neutral-900">
                  {/* Image Background */}
                  <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
                    {item.imageUrl ? (
                      <div 
                        className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url(${item.imageUrl})` }}
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-neutral-700 to-neutral-900" />
                    )}
                  </div>
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent rounded-[2rem]" />
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 p-8 md:p-10 w-full z-20">
                    <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-white/80 mb-3 block border-l-2 border-white/40 pl-3">
                      Explore
                    </span>
                    <h3 className="font-serif text-2xl md:text-3xl lg:text-4xl text-white mb-3 italic font-light leading-tight">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="font-sans text-white/70 text-sm tracking-wide line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-16 left-8 md:left-16 flex items-center gap-4 z-20">
          <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Scroll to Explore
          </span>
          <div className="w-16 h-[1px] bg-muted-foreground/30" />
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-16 right-8 md:right-16 z-20 flex items-center gap-3">
          <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
            {Math.round(progress * 100)}%
          </span>
          <div className="w-20 h-[2px] bg-muted-foreground/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-foreground/50 rounded-full transition-all duration-100"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManagedCarousel;
