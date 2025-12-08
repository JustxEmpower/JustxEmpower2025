import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax effect for video
      gsap.to(videoRef.current, {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });

      // Parallax and fade for text
      gsap.to(textRef.current, {
        yPercent: -50,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'center top',
          scrub: true
        }
      });

      // Initial reveal animation
      const tl = gsap.timeline({ delay: 0.5 });
      
      tl.fromTo('.hero-line', 
        { y: 100, opacity: 0, rotateX: -20 },
        { y: 0, opacity: 1, rotateX: 0, duration: 1.2, stagger: 0.2, ease: 'power3.out' }
      )
      .fromTo('.hero-btn',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' },
        '-=0.5'
      );

    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={heroRef} className="relative h-screen w-full overflow-hidden bg-black">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-[120%] -top-[10%]">
        <div className="absolute inset-0 bg-black/30 z-10" /> {/* Overlay */}
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-90"
          poster="https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=2500&auto=format&fit=crop"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-waves-coming-to-the-beach-5016-large.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Content */}
      <div 
        ref={textRef}
        className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4"
      >
        <h2 className="hero-line font-sans text-white text-sm md:text-base uppercase tracking-[0.3em] mb-6">
          Welcome to Just Empower
        </h2>
        
        <h1 className="hero-line font-serif text-5xl md:text-7xl lg:text-9xl text-white font-light italic tracking-wide mb-8 leading-tight">
          Catalyzing the <br/>
          <span className="not-italic">Rise of Her</span>
        </h1>
        
        <p className="hero-line font-sans text-white/90 text-lg md:text-xl font-light tracking-wide max-w-2xl mb-12 leading-relaxed">
          Where Empowerment Becomes Embodiment. Discover your potential in a new paradigm of conscious leadership.
        </p>
        
        <button className="hero-btn group relative px-10 py-5 overflow-hidden border border-white text-white transition-all duration-300 hover:text-black">
          <span className="relative z-10 font-sans text-xs uppercase tracking-[0.2em]">Walk With Us</span>
          <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left ease-out" />
        </button>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center animate-bounce">
        <span className="text-white text-[10px] uppercase tracking-[0.2em] mb-2">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent" />
      </div>
    </div>
  );
}
