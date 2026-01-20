import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

interface TextStyle {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  fontSize?: string | null;
  fontColor?: string | null;
}

interface SectionProps {
  title: string;
  subtitle?: string;
  description: string;
  image?: string;
  imageAlt: string;
  reversed?: boolean;
  dark?: boolean;
  ctaText?: string;
  ctaLink?: string;
  // Text styles from RDS
  textStyles?: {
    title?: TextStyle;
    subtitle?: TextStyle;
    description?: TextStyle;
    ctaText?: TextStyle;
  };
}

// Helper to convert TextStyle to CSS classes with !important to override defaults
function getStyleClasses(style?: TextStyle): string {
  if (!style) return '';
  const classes = [];
  if (style.isBold) classes.push('!font-bold');
  if (style.isItalic) classes.push('!italic');
  if (style.isUnderline) classes.push('!underline');
  // Override default color if custom color is set
  if (style.fontColor) classes.push('!text-inherit');
  return classes.join(' ');
}

// Helper to convert TextStyle to inline styles (includes fontSize and fontColor)
function getInlineStyles(style?: TextStyle): React.CSSProperties {
  if (!style) return {};
  const styles: React.CSSProperties = {};
  if (style.isBold) styles.fontWeight = 'bold';
  if (style.isItalic) styles.fontStyle = 'italic';
  if (style.isUnderline) styles.textDecoration = 'underline';
  if (style.fontSize) styles.fontSize = style.fontSize;
  if (style.fontColor) styles.color = style.fontColor;
  return styles;
}

export default function Section({ 
  title, 
  subtitle, 
  description, 
  image, 
  imageAlt, 
  reversed = false,
  dark = false,
  ctaText,
  ctaLink,
  textStyles = {}
}: SectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Artistic Image Reveal
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          end: 'bottom top',
          toggleActions: 'play none none reverse'
        }
      });

      // Image parallax and scale effect
      gsap.fromTo(imageRef.current,
        { scale: 1.2, y: -50 },
        {
          scale: 1,
          y: 50,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.5 // Smoother scrub
          }
        }
      );

      // Reveal animation sequence
      tl.fromTo(imageWrapperRef.current,
        { clipPath: 'inset(100% 0 0 0)', opacity: 0 },
        { clipPath: 'inset(0% 0 0 0)', opacity: 1, duration: 1.5, ease: 'power4.out' }
      )
      if (subtitle) {
        const subtitleEl = contentRef.current?.querySelector('.subtitle');
        if (subtitleEl) {
          tl.fromTo(subtitleEl,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
            '-=1'
          );
        }
      }

      const h2 = contentRef.current?.querySelector('h2');
      if (h2) {
        tl.fromTo(h2,
          { y: 40, opacity: 0, rotateX: 10 },
          { y: 0, opacity: 1, rotateX: 0, duration: 1, ease: 'power3.out' },
          '-=0.6'
        );
      }

      if (lineRef.current) {
        tl.fromTo(lineRef.current,
          { scaleX: 0, transformOrigin: 'left' },
          { scaleX: 1, duration: 1, ease: 'expo.out' },
          '-=0.8'
        );
      }

      const p = contentRef.current?.querySelector('p');
      if (p) {
        tl.fromTo(p,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: 'power3.out' },
          '-=0.8'
        );
      }

      const button = contentRef.current?.querySelector('.cta-button');
      if (button) {
        tl.fromTo(button,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
          '-=0.6'
        );
      }

    }, sectionRef);

    return () => ctx.revert();
  }, [subtitle]);

  return (
    <section 
      ref={sectionRef}
      className={cn(
        "relative py-32 md:py-48 overflow-hidden transition-colors duration-300",
        dark ? "bg-secondary" : "bg-background"
      )}
    >
      <div className="container mx-auto px-6 md:px-12">
        <div className={cn(
          "flex flex-col md:flex-row items-center gap-16 md:gap-32",
          reversed ? "md:flex-row-reverse" : ""
        )}>
          
          {/* Image Column */}
          <div 
            ref={imageWrapperRef}
            className="w-full md:w-1/2 relative aspect-[3/4] overflow-hidden rounded-[2rem] shadow-2xl shadow-black/5"
          >
            {image ? (
              <div 
                ref={imageRef}
                className="absolute inset-[-10%] w-[120%] h-[120%] bg-cover bg-center will-change-transform"
                style={{ backgroundImage: `url(${image})` }}
                role="img"
                aria-label={imageAlt}
              />
            ) : (
              <div 
                ref={imageRef}
                className="absolute inset-[-10%] w-[120%] h-[120%] bg-gradient-to-br from-neutral-300 to-neutral-500 will-change-transform"
                role="img"
                aria-label={imageAlt}
              />
            )}
            {/* Artistic Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 opacity-60" />
          </div>

          {/* Content Column */}
          <div ref={contentRef} className="w-full md:w-1/2 flex flex-col justify-center relative">
            {/* Decorative background element */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />

            {subtitle && (
              <span 
                className={cn(
                  "subtitle font-sans text-xs uppercase tracking-[0.3em] text-primary/80 mb-8 block pl-1",
                  getStyleClasses(textStyles.subtitle)
                )}
                style={getInlineStyles(textStyles.subtitle)}
              >
                {subtitle}
              </span>
            )}
            
            <h2 
              className={cn(
                "font-serif text-5xl md:text-6xl lg:text-7xl font-light mb-8 leading-[1.1] text-foreground tracking-tight",
                getStyleClasses(textStyles.title)
              )}
              style={getInlineStyles(textStyles.title)}
            >
              {title}
            </h2>

            <div ref={lineRef} className="w-24 h-[1px] bg-primary/30 mb-10" />
            
            <p 
              className={cn(
                "font-sans text-muted-foreground text-lg md:text-xl leading-relaxed mb-12 max-w-xl font-light",
                getStyleClasses(textStyles.description)
              )}
              style={getInlineStyles(textStyles.description)}
            >
              {description}
            </p>
            
            {ctaText && ctaLink && (
              <Link href={ctaLink}>
                <div className={cn(
                  "cta-button self-start group relative px-10 py-5 overflow-hidden rounded-full transition-all duration-500 cursor-pointer",
                  "border border-foreground/10 hover:border-transparent"
                )}>
                  <span 
                    className={cn(
                      "relative z-10 font-sans text-xs uppercase tracking-[0.25em] transition-colors duration-500",
                      "text-foreground group-hover:text-white",
                      getStyleClasses(textStyles.ctaText)
                    )}
                    style={getInlineStyles(textStyles.ctaText)}
                  >
                    {ctaText}
                  </span>
                  <div className="absolute inset-0 bg-foreground transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left ease-[0.22,1,0.36,1]" />
                </div>
              </Link>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
