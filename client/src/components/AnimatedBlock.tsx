import { useEffect, useRef, useState } from "react";

interface AnimationConfig {
  type?: "none" | "fade-in" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "zoom-in";
  trigger?: "on-load" | "on-scroll" | "on-hover";
  duration?: number;
  delay?: number;
  easing?: string;
}

interface AnimatedBlockProps {
  children: React.ReactNode;
  animation: string; // JSON string
}

export function AnimatedBlock({ children, animation }: AnimatedBlockProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const config: AnimationConfig = (() => {
    try {
      return animation ? JSON.parse(animation) : { type: "none" };
    } catch {
      return { type: "none" };
    }
  })();

  const {
    type = "none",
    trigger = "on-scroll",
    duration = 600,
    delay = 0,
    easing = "ease-out",
  } = config;

  useEffect(() => {
    if (type === "none") return;

    if (trigger === "on-load") {
      // Trigger animation immediately on mount
      setTimeout(() => setIsVisible(true), delay);
    } else if (trigger === "on-scroll") {
      // Trigger animation when element enters viewport
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(() => setIsVisible(true), delay);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => observer.disconnect();
    }
  }, [type, trigger, delay]);

  if (type === "none") {
    return <>{children}</>;
  }

  const getAnimationStyles = (): React.CSSProperties => {
    const shouldAnimate =
      (trigger === "on-load" && isVisible) ||
      (trigger === "on-scroll" && isVisible) ||
      (trigger === "on-hover" && isHovered);

    const baseStyles: React.CSSProperties = {
      transition: `all ${duration}ms ${easing}`,
    };

    if (!shouldAnimate) {
      // Initial state before animation
      switch (type) {
        case "fade-in":
          return { ...baseStyles, opacity: 0 };
        case "slide-up":
          return { ...baseStyles, opacity: 0, transform: "translateY(30px)" };
        case "slide-down":
          return { ...baseStyles, opacity: 0, transform: "translateY(-30px)" };
        case "slide-left":
          return { ...baseStyles, opacity: 0, transform: "translateX(30px)" };
        case "slide-right":
          return { ...baseStyles, opacity: 0, transform: "translateX(-30px)" };
        case "zoom-in":
          return { ...baseStyles, opacity: 0, transform: "scale(0.9)" };
        default:
          return baseStyles;
      }
    }

    // Animated state
    return {
      ...baseStyles,
      opacity: 1,
      transform: "translateY(0) translateX(0) scale(1)",
    };
  };

  return (
    <div
      ref={ref}
      style={getAnimationStyles()}
      onMouseEnter={() => trigger === "on-hover" && setIsHovered(true)}
      onMouseLeave={() => trigger === "on-hover" && setIsHovered(false)}
    >
      {children}
    </div>
  );
}
