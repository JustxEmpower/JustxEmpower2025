'use client';
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
  
  // Get all hero content from database
  const videoUrl = getContent('hero', 'videoUrl') || '';
  const imageUrl = getContent('hero', 'imageUrl') || '';
  const subtitle = getContent('hero', 'subtitle') || 'Welcome to Just Empower';
  const fullTitle = getContent('hero', 'title') || '';
  const titleLine1 = getContent('hero', 'titleLine1') || (fullTitle ? fullTitle.split(' ').slice(0, 2).join(' ') : 'Catalyzing the');
  const titleLine2 = getContent('hero', 'titleLine2') || (fullTitle ? fullTitle.split(' ').slice(2).join(' ') : 'Rise of Her');
  const description = getContent('hero', 'subDescription') || getContent('hero', 'description') || 'Where Empowerment Becomes Embodiment. Discover your potential in a new paradigm of conscious leadership.';
  const ctaText = getContent('hero', 'ctaText') || getContent('hero', 'buttonText') || 'Discover More';
  const ctaLink = getContent('hero', 'ctaLink') || getContent('hero', 'buttonLink') || '/about';
  
  // Determine if we have a video or image
  const isVideo = videoUrl && /\.(mp4|webm|mov|ogg|m4v|avi|mkv)(?:[?#]|$)/i.test(videoUrl);
  const heroMediaUrl = videoUrl || imageUrl;
  
  console.log('Hero Component - videoUrl:', videoUrl);
  console.log('Hero Component - isVideo:', isVideo);
  console.log('Hero Component - heroMediaUrl:', heroMediaUrl);
  console.log('Hero Component - isLoading:', isLoading);

  useEffect(() => {
    // Ensure video plays when component mounts
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.log('Video autoplay failed:', err);
      });
    }
  }, [heroMediaUrl]);

  useEffect(() => {
    if (!heroRef.current) return;

    const ctx = gsap.context(() => {
      // Animate overlay fade
      gsap.fromTo(overlayRef.current,
        { opacity: 0.5 },
        { opacity: 0.3, duration: 2, ease: 'power2.inOut' }
      );

      // Animate text elements on scroll
      gsap.to('.hero-subtitle', {
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top center',
          end: 'center center',
          scrub: true
        },
        opacity: 0,
        y: -50,
        duration: 1
      });

      gsap.to('.hero-title-line', {
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top center',
          end: 'center center',
          scrub: true
        },
        opacity: 0,
        y: -100,
        stagger: 0.2,
        duration: 1
      });

      gsap.to('.hero-desc', {
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top center',
          end: 'center center',
          scrub: true
        },
        opacity: 0,
        y: -50,
        duration: 1
      });

      gsap.to('.hero-btn', {
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top center',
          end: 'center center',
          scrub: true
        },
        opacity: 0,
        y: 50,
        duration: 1
      });

      // Initial animations
      gsap.fromTo('.hero-subtitle', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.2 });
      gsap.fromTo('.hero-title-line', { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.15, duration: 0.8, delay: 0.4 });
      gsap.fromTo('.hero-desc', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.6 });
      gsap.fromTo('.hero-btn', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.8, delay: 0.8 });

    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={heroRef} className="hero-section relative h-screen w-full overflow-hidden bg-black rounded-b-[2.5rem]">
      {/* Video/Image Background */}
      <div className="absolute inset-0 w-full h-full">
        {/* Overlay */}
        <div ref={overlayRef} className="absolute inset-0 bg-black z-10" />
        
        {/* Video Background */}
        {isVideo && videoUrl ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            onError={(e) => console.log('Video error:', e)}
          >
            <source 
              src={videoUrl} 
              type="video/mp4" 
            />
          </video>
        ) : heroMediaUrl ? (
          /* Image Background */
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${heroMediaUrl})` }}
          />
        ) : (
          /* Fallback Gradient */
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
            <div className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 rounded-full" />
          </div>
        </Link>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="text-white/50 text-xs uppercase tracking-widest mb-4">Scroll</div>
        <div className="w-px h-8 bg-gradient-to-b from-white/50 to-transparent mx-auto animate-pulse" />
      </div>
    </div>
  );
}
