import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

interface SectionProps {
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  imageAlt: string;
  reversed?: boolean;
  dark?: boolean;
}

export default function Section({ 
  title, 
  subtitle, 
  description, 
  image, 
  imageAlt, 
  reversed = false,
  dark = false
}: SectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Image parallax
      gsap.fromTo(imageRef.current,
        { scale: 1.1 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        }
      );

      // Content fade up
      gsap.fromTo(contentRef.current?.children || [],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className={cn(
        "relative py-24 md:py-32 overflow-hidden",
        dark ? "bg-secondary" : "bg-background"
      )}
    >
      <div className="container mx-auto px-6 md:px-12">
        <div className={cn(
          "flex flex-col md:flex-row items-center gap-12 md:gap-24",
          reversed ? "md:flex-row-reverse" : ""
        )}>
          
          {/* Image Column */}
          <div className="w-full md:w-1/2 relative aspect-[4/5] overflow-hidden group">
            <div 
              ref={imageRef}
              className="w-full h-full bg-cover bg-center transition-transform duration-700"
              style={{ backgroundImage: `url(${image})` }}
              role="img"
              aria-label={imageAlt}
            />
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
          </div>

          {/* Content Column */}
          <div ref={contentRef} className="w-full md:w-1/2 flex flex-col justify-center">
            {subtitle && (
              <span className="font-sans text-xs uppercase tracking-[0.2em] text-primary mb-6 block">
                {subtitle}
              </span>
            )}
            
            <h2 className={cn(
              "font-serif text-4xl md:text-5xl lg:text-6xl font-light mb-8 leading-tight",
              dark ? "text-foreground" : "text-foreground"
            )}>
              {title}
            </h2>
            
            <p className="font-sans text-muted-foreground text-lg leading-relaxed mb-10 max-w-xl">
              {description}
            </p>
            
            <button className={cn(
              "self-start group relative px-8 py-4 overflow-hidden border transition-all duration-300",
              dark 
                ? "border-foreground text-foreground hover:text-white" 
                : "border-foreground text-foreground hover:text-white"
            )}>
              <span className="relative z-10 font-sans text-xs uppercase tracking-[0.2em]">Discover More</span>
              <div className={cn(
                "absolute inset-0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left ease-out",
                dark ? "bg-foreground" : "bg-foreground"
              )} />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
