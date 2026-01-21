import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'wouter';
import { getMediaUrl } from '@/lib/media';
import { trpc } from '@/lib/trpc';

// Register GSAP plugin once at module level
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Preload images for smooth rendering
const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve) => {
    if (!src) {
      resolve();
      return;
    }
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
};

export default function Carousel() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const gsapContextRef = useRef<gsap.Context | null>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Fetch carousel offerings from database
  const { data: dbOfferings, isLoading } = trpc.carousel.getAll.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  // Only use database offerings - no fallback content
  const offerings = dbOfferings && dbOfferings.length > 0 
    ? dbOfferings.map(o => ({
        id: o.id,
        title: o.title,
        imageUrl: o.imageUrl || '',
        description: o.description || '',
        link: o.link || '/offerings'
      }))
    : [];

  // Preload all images when offerings are available
  useEffect(() => {
    if (offerings.length > 0 && !imagesLoaded) {
      Promise.all(offerings.map(o => preloadImage(o.imageUrl)))
        .then(() => setImagesLoaded(true));
    }
  }, [offerings, imagesLoaded]);

  // Set ready state after component mounts and images are loaded
  useEffect(() => {
    if (!imagesLoaded || isLoading) return;
    
    // Use RAF for smoother initialization
    const rafId = requestAnimationFrame(() => {
      setIsReady(true);
    });
    return () => cancelAnimationFrame(rafId);
  }, [imagesLoaded, isLoading]);

  // Debounced resize handler
  const handleResize = useCallback(() => {
    if (scrollTriggerRef.current) {
      scrollTriggerRef.current.refresh();
    }
  }, []);

  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 150);
    };
    
    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, [handleResize]);

  useEffect(() => {
    // Wait for everything to be ready
    if (!isReady || isLoading || offerings.length === 0) return;
    
    const section = sectionRef.current;
    const track = trackRef.current;
    
    if (!section || !track) return;

    // Clean up any existing context
    if (gsapContextRef.current) {
      gsapContextRef.current.revert();
      gsapContextRef.current = null;
    }

    // Create new GSAP context
    const ctx = gsap.context(() => {
      // Cache scroll amount calculation
      let cachedScrollAmount: number | null = null;
      const getScrollAmount = () => {
        if (cachedScrollAmount === null) {
          const trackWidth = track.scrollWidth;
          const viewportWidth = window.innerWidth;
          cachedScrollAmount = -(trackWidth - viewportWidth + 100);
        }
        return cachedScrollAmount;
      };

      // Set initial GPU-accelerated state
      gsap.set(track, {
        willChange: 'transform',
        force3D: true,
      });

      // Create the scroll tween with GPU acceleration
      const tween = gsap.to(track, {
        x: getScrollAmount,
        ease: 'none',
        force3D: true,
      });

      // Create the ScrollTrigger with optimized settings
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${track.scrollWidth - window.innerWidth}`,
        pin: true,
        animation: tween,
        scrub: 0.5, // Reduced from 1 for snappier response
        invalidateOnRefresh: true,
        anticipatePin: 1,
        fastScrollEnd: true, // Optimize for fast scrolling
        onRefresh: () => {
          cachedScrollAmount = null; // Reset cache on refresh
        },
      });

      scrollTriggerRef.current = trigger;

    }, sectionRef);

    gsapContextRef.current = ctx;

    return () => {
      if (gsapContextRef.current) {
        gsapContextRef.current.revert();
        gsapContextRef.current = null;
      }
      scrollTriggerRef.current = null;
    };
  }, [isReady, isLoading, offerings.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gsapContextRef.current) {
        gsapContextRef.current.revert();
        gsapContextRef.current = null;
      }
      scrollTriggerRef.current = null;
      // Kill all ScrollTriggers associated with this component
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.vars.trigger === sectionRef.current) {
          trigger.kill();
        }
      });
    };
  }, []);

  // Don't render anything if no offerings exist
  if (!isLoading && offerings.length === 0) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <section className="relative h-screen bg-background overflow-hidden flex items-center justify-center">
        <div className="text-muted-foreground">Loading offerings...</div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative h-screen bg-background overflow-hidden flex flex-col justify-center py-20">
      
      <div className="absolute top-12 left-6 md:left-12 z-10">
        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground font-light italic tracking-tight">
          Our Offerings
        </h2>
      </div>

      <div 
        ref={trackRef} 
        className="flex gap-8 md:gap-12 px-6 md:px-12 w-max items-center h-[60vh] md:h-[70vh] pl-[10vw] md:pl-[20vw] z-20"
        style={{ willChange: 'transform', transform: 'translate3d(0,0,0)' }}
      >
        {offerings.map((item) => (
          <Link key={item.id} href={item.link} className="block h-full shrink-0">
            <div 
              className="relative w-[80vw] md:w-[40vw] lg:w-[30vw] h-full group overflow-hidden cursor-pointer rounded-[2rem] shadow-2xl shadow-black/5 bg-gray-900"
              style={{ 
                willChange: 'transform',
                transform: 'translate3d(0,0,0)',
                transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translate3d(0,-16px,0)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translate3d(0,0,0)';
              }}
            >
              <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
                {item.imageUrl ? (
                  <div 
                    className="absolute inset-0 w-full h-full bg-cover bg-center group-hover:scale-110"
                    style={{ 
                      backgroundImage: `url(${item.imageUrl})`,
                      willChange: 'transform',
                      transform: 'translate3d(0,0,0) scale(1)',
                      transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-neutral-700 to-neutral-900" />
                )}
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 rounded-[2rem]" />
              
              <div 
                className="absolute bottom-0 left-0 p-8 md:p-10 w-full z-20"
                style={{
                  transform: 'translate3d(0,16px,0)',
                  transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
              >
                <span className="font-sans text-xs uppercase tracking-[0.2em] text-white/90 mb-4 block border-l-2 border-white/50 pl-3">
                  Explore
                </span>
                <h3 className="font-serif text-3xl md:text-4xl text-white mb-4 italic font-light leading-tight drop-shadow-lg">
                  {item.title}
                </h3>
                {item.description && (
                  <p 
                    className="font-sans text-white/90 text-sm tracking-wide opacity-0 group-hover:opacity-100 drop-shadow-md"
                    style={{
                      transform: 'translate3d(0,16px,0)',
                      transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s',
                    }}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="absolute bottom-12 left-6 md:left-12 flex items-center gap-4 z-10">
        <span className="font-sans text-xs uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Scroll to Explore</span>
        <div className="w-24 h-[1px] bg-muted-foreground/30" />
      </div>

    </section>
  );
}
