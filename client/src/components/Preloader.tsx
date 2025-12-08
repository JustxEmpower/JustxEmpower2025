import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          // Fade out container
          gsap.to(containerRef.current, {
            opacity: 0,
            duration: 0.8,
            ease: 'power2.inOut',
            onComplete: onComplete
          });
        }
      });

      // Initial state
      gsap.set(logoRef.current, { 
        scale: 0.8, 
        opacity: 0,
        filter: 'blur(10px)'
      });
      gsap.set(progressRef.current, { scaleX: 0 });

      // Animation sequence
      tl.to(logoRef.current, {
        opacity: 1,
        filter: 'blur(0px)',
        duration: 1.5,
        ease: 'power2.out'
      })
      .to(logoRef.current, {
        scale: 1,
        duration: 2,
        ease: 'power1.inOut'
      }, '<')
      .to(progressRef.current, {
        scaleX: 1,
        duration: 2,
        ease: 'power1.inOut'
      }, '<')
      .to(logoRef.current, {
        opacity: 0,
        scale: 1.1,
        filter: 'blur(5px)',
        duration: 0.8,
        ease: 'power2.in',
        delay: 0.2
      });

    }, containerRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
    >
      <div className="relative w-32 h-32 md:w-48 md:h-48 flex items-center justify-center">
        <img 
          ref={logoRef}
          src="/media/logo-white.png" 
          alt="Just Empower" 
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* Elegant progress line */}
      <div className="w-48 h-[1px] bg-white/20 mt-8 overflow-hidden">
        <div 
          ref={progressRef}
          className="w-full h-full bg-white origin-left"
        />
      </div>
    </div>
  );
}
