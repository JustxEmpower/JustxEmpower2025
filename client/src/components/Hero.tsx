import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'wouter';
import { usePageContent } from '@/hooks/usePageContent';
import { getMediaUrl } from '@/lib/media';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  const { getContent, isLoading } = usePageContent('home');
  
  // Helper to get proper media URL
  const getProperMediaUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : getMediaUrl(url);
  };
  
  // Get all hero content from database - no hardcoded fallbacks for media
  const videoUrl = getContent('hero', 'videoUrl') || '';
  const imageUrl = getContent('hero', 'imageUrl') || '';
  const heroMediaUrl = videoUrl || imageUrl;
  
  // Improved video detection - check MIME type from media library or file extension
  const isVideo = heroMediaUrl ? (
    // Check if URL contains video MIME type indicators
    heroMediaUrl.includes('video/') ||
    // Check file extension (handle URLs with query params)
    /\.(mp4|webm|mov|ogg|m4v|avi|mkv)(?:[?#]|$)/i.test(heroMediaUrl)
  ) : false;
  
  const subtitle = getContent('hero', 'subtitle') || 'Welcome to Just Empower';
  // Title can be stored as single 'title' field or split into 'titleLine1'/'titleLine2'
  const fullTitle = getContent('hero', 'title') || '';
  const titleLine1 = getContent('hero', 'titleLine1') || (fullTitle ? fullTitle.split(' ').slice(0, 2).join(' ') : 'Catalyzing the');
  const titleLine2 = getContent('hero', 'titleLine2') || (fullTitle ? fullTitle.split(' ').slice(2).join(' ') : 'Rise of Her');
  // Use subDescription for the main description text, fall back to description
  const description = getContent('hero', 'subDescription') || getContent('hero', 'description') || 'Where Empowerment Becomes Embodiment. Discover your potential in a new paradigm of conscious leadership.';
  // CMS uses buttonText/buttonLink, also check ctaText/ctaLink for backwards compatibility
  const ctaText = getContent('hero', 'ctaText') || getContent('hero', 'buttonText') || 'Discover More';
  const ctaLink = getContent('hero', 'ctaLink') || getContent('hero', 'buttonLink') || '/about';
  
  // Debug logging for video URL
  console.log('Hero videoUrl from CMS:', videoUrl);
  console.log('Hero heroMediaUrl:', heroMediaUrl);
  console.log('Hero isVideo:', isVideo);
  console.log('Hero isLoading:', isLoading);

  useEffect(() => {
    // Ensure video plays when component mounts
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log("Video autoplay failed:", error);
      });
    }

    const ctx = gsap.context(() => {
      // Reset initial states to ensure visibility if animation fails
      gsap.set('.hero-subtitle', { opacity: 0, y: 20 });
      gsap.set('.hero-title-line', { opacity: 0, y: 100, rotateX: -10, filter: 'blur(10px)' });
      gsap.set('.hero-desc', { opacity: 0, y: 30 });
      gsap.set('.hero-btn', { opacity: 0, y: 20 });
      gsap.set(overlayRef.current, { opacity: 1 }); // Start black

      // Cinematic Opening Sequence
      const tl = gsap.timeline({ delay: 0.5 });

      // 1. Fade in video from black
      tl.to(overlayRef.current, {
        opacity: 0.3,
        duration: 2.5,
        ease: 'power2.inOut'
      })
      
      // 2. Reveal text elements with staggered, elegant motion
      .to('.hero-subtitle', {
        y: 0, 
        opacity: 1, 
        letterSpacing: '0.3em', 
        duration: 1.5, 
        ease: 'power3.out' 
      }, '-=1.5')
      .to('.hero-title-line', {
        y: 0, 
        opacity: 1, 
        rotateX: 0, 
        filter: 'blur(0px)', 
        duration: 1.5, 
        stagger: 0.2, 
        ease: 'power4.out' 
      }, '-=1.2')
      .to('.hero-desc', {
        y: 0, 
        opacity: 0.9, 
        duration: 1.2, 
        ease: 'power3.out' 
      }, '-=1')
      .to('.hero-btn', {
        y: 0, 
        opacity: 1, 
        duration: 1, 
        ease: 'power2.out' 
      }, '-=0.8');

      // Parallax Scroll Effects
      gsap.to(videoRef.current, {
        yPercent: 20,
        scale: 1.1,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });

      gsap.to(textRef.current, {
        yPercent: -30,
        opacity: 0,
        filter: 'blur(10px)',
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '60% top',
          scrub: true
        }
      });

    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Don't render video until CMS data is loaded
  if (isLoading && !heroMediaUrl) {
    return (
      <div className="hero-section relative h-screen w-full overflow-hidden bg-black rounded-b-[2.5rem]">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-700 to-neutral-900" />
      </div>
    );
  }

  return (
    <div ref={heroRef} className="hero-section relative h-screen w-full overflow-hidden bg-black rounded-b-[2.5rem]">
      {/* Video/Image Background */}
      <div className="absolute inset-0 w-full h-[120%] -top-[10%]">
        <div ref={overlayRef} className="absolute inset-0 bg-black z-10" />
        
        {/* Video or Image Background */}
        {heroMediaUrl && isVideo ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source 
              src={getProperMediaUrl(heroMediaUrl)} 
              type={heroMediaUrl.endsWith('.webm') ? 'video/webm' : 'video/mp4'} 
            />
          </video>
        ) : heroMediaUrl ? (
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${getProperMediaUrl(heroMediaUrl)})` }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-700 to-neutral-900" />
        )}
      </div>

      {/* Content */}
      <div 
        ref={textRef}
        className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4"
      >
        <h2 className="hero-subtitle font-sans text-white text-xs md:text-sm uppercase tracking-[0.3em] mb-8 md:mb-12 opacity-0">
          {subtitle}
        </h2>
        
        <div className="overflow-hidden mb-2">
          <h1 className="hero-title-line font-serif text-5xl md:text-7xl lg:text-9xl text-white font-light italic tracking-wide leading-[1.1] opacity-0">
            {titleLine1}
          </h1>
        </div>
        
        <div className="overflow-hidden mb-8 md:mb-12">
          <h1 className="hero-title-line font-serif text-5xl md:text-7xl lg:text-9xl text-white font-light tracking-wide leading-[1.1] opacity-0">
            {titleLine2}
          </h1>
        </div>
        
        <p className="hero-desc font-sans text-white/90 text-lg md:text-xl font-light tracking-wide max-w-2xl mb-12 leading-relaxed opacity-0">
          {description}
        </p>
        
        <Link href={ctaLink}>
          <div className="hero-btn group relative px-12 py-6 overflow-hidden rounded-full border border-white/30 hover:border-white transition-all duration-500 opacity-0 cursor-pointer">
            <span className="relative z-10 font-sans text-xs uppercase tracking-[0.25em] text-white group-hover:text-black transition-colors duration-500">
              {ctaText}
            </span>
            <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left ease-[0.22,1,0.36,1]" />
          </div>
        </Link>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center opacity-60 mix-blend-difference">
        <span className="text-white text-[10px] uppercase tracking-[0.2em] mb-4 animate-pulse">Scroll</span>
        <div className="w-[1px] h-16 bg-gradient-to-b from-white via-white/50 to-transparent" />
      </div>
    </div>
  );
}
