import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useInView, useScroll, useTransform, useMotionValue } from 'framer-motion';
import { BlockAnimationConfig, getAnimationVariants, DEFAULT_ANIMATION_CONFIG } from './BlockAnimationSettings';

// ============================================================================
// ANIMATED BLOCK WRAPPER
// Wraps any block content and applies configured animations:
// - Entrance animations (scroll-triggered or on-load)
// - Parallax scrolling
// - Scroll-progress linked properties
// - Continuous looping animations
// - Hover effects
// - Text animations (applied via CSS classes)
// ============================================================================

interface AnimatedBlockWrapperProps {
  children: React.ReactNode;
  animation?: BlockAnimationConfig;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

export function AnimatedBlockWrapper({
  children,
  animation,
  className = '',
  style = {},
  id,
}: AnimatedBlockWrapperProps) {
  const config = animation || DEFAULT_ANIMATION_CONFIG;

  // If animation is not enabled, render children directly
  if (!config.enabled) {
    return (
      <div className={className} style={style} id={id}>
        {children}
      </div>
    );
  }

  return (
    <AnimatedContent config={config} className={className} style={style} id={id}>
      {children}
    </AnimatedContent>
  );
}

// ============================================================================
// ANIMATED CONTENT — The actual animation logic
// ============================================================================

function AnimatedContent({
  children,
  config,
  className,
  style,
  id,
}: {
  children: React.ReactNode;
  config: BlockAnimationConfig;
  className: string;
  style: React.CSSProperties;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const category = config.category || 'entrance';

  // ---- ENTRANCE ANIMATIONS ----
  const entranceProps = useMemo(() => {
    if (category !== 'entrance' || config.type === 'none') return {};
    const v = getAnimationVariants(config);
    const shouldAnimate =
      config.trigger === 'on-load' ? true :
      config.trigger === 'on-scroll' ? isInView :
      false; // on-hover handled separately

    if (config.trigger === 'on-hover') {
      return {
        initial: v.initial,
        whileHover: v.animate,
        transition: v.transition,
      };
    }

    return {
      initial: v.initial,
      animate: shouldAnimate ? v.animate : v.initial,
      transition: v.transition,
    };
  }, [category, config.type, config.trigger, config.duration, config.delay, config.easing, isInView]);

  // ---- PARALLAX ----
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const parallaxEnabled = config.parallax?.enabled && category === 'scroll';
  const parallaxSpeed = config.parallax?.speed || 0.5;
  const parallaxDir = config.parallax?.direction || 'up';

  const parallaxRange = parallaxSpeed * 50;
  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    parallaxDir === 'up' ? [parallaxRange, -parallaxRange] :
    parallaxDir === 'down' ? [-parallaxRange, parallaxRange] : [0, 0]
  );
  const parallaxX = useTransform(
    scrollYProgress,
    [0, 1],
    parallaxDir === 'left' ? [parallaxRange, -parallaxRange] :
    parallaxDir === 'right' ? [-parallaxRange, parallaxRange] : [0, 0]
  );

  // ---- SCROLL PROGRESS ----
  const scrollProgEnabled = config.scrollProgress?.enabled && category === 'scroll';
  const scrollProp = config.scrollProgress?.property || 'opacity';
  const scrollFrom = config.scrollProgress?.from ?? 0;
  const scrollTo = config.scrollProgress?.to ?? 1;

  const scrollProgressValue = useTransform(scrollYProgress, [0, 1], [scrollFrom, scrollTo]);

  // ---- CONTINUOUS ANIMATIONS ----
  const continuousProps = useMemo(() => {
    if (category !== 'continuous') return {};
    const cont = config.continuous;
    if (!cont || cont.type === 'none') return {};

    const dur = 2 / cont.speed;
    const int = cont.intensity * 10;

    switch (cont.type) {
      case 'float':
        return { animate: { y: [-int, int, -int] }, transition: { duration: dur, repeat: Infinity, ease: 'easeInOut' } };
      case 'pulse':
        return { animate: { scale: [1, 1 + int * 0.01, 1] }, transition: { duration: dur, repeat: Infinity, ease: 'easeInOut' } };
      case 'spin':
        return { animate: { rotate: 360 }, transition: { duration: dur, repeat: Infinity, ease: 'linear' } };
      case 'shimmer':
        return { animate: { opacity: [0.7, 1, 0.7] }, transition: { duration: dur * 0.5, repeat: Infinity, ease: 'easeInOut' } };
      case 'glow':
        return {
          animate: {
            boxShadow: [
              '0 0 0px rgba(var(--primary-rgb, 59, 130, 246), 0)',
              `0 0 ${int * 2}px rgba(var(--primary-rgb, 59, 130, 246), 0.4)`,
              '0 0 0px rgba(var(--primary-rgb, 59, 130, 246), 0)',
            ],
          },
          transition: { duration: dur, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'breathe':
        return { animate: { opacity: [1, 0.6, 1], scale: [1, 0.98, 1] }, transition: { duration: dur, repeat: Infinity, ease: 'easeInOut' } };
      case 'swing':
        return { animate: { rotate: [-int * 0.3, int * 0.3, -int * 0.3] }, transition: { duration: dur, repeat: Infinity, ease: 'easeInOut' } };
      case 'gradient-shift':
        return { animate: { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }, transition: { duration: dur * 2, repeat: Infinity, ease: 'linear' } };
      default:
        return {};
    }
  }, [category, config.continuous?.type, config.continuous?.speed, config.continuous?.intensity]);

  // ---- HOVER EFFECTS ----
  const hoverProps = useMemo(() => {
    if (category !== 'hover') return {};
    const h = config.hover;
    if (!h || h.type === 'none') return {};

    const int = h.intensity;

    switch (h.type) {
      case 'lift':
        return { whileHover: { y: -8 * int, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', transition: { duration: 0.3 } } };
      case 'scale':
        return { whileHover: { scale: 1 + 0.05 * int, transition: { duration: 0.3 } } };
      case 'tilt-3d':
        return { whileHover: { rotateX: 5 * int, rotateY: 5 * int, transition: { duration: 0.3 } } };
      case 'glow':
        return { whileHover: { boxShadow: `0 0 ${20 * int}px rgba(var(--primary-rgb, 59, 130, 246), 0.5)`, transition: { duration: 0.3 } } };
      case 'border-glow':
        return { whileHover: { boxShadow: `inset 0 0 ${10 * int}px rgba(var(--primary-rgb, 59, 130, 246), 0.3)`, transition: { duration: 0.3 } } };
      case 'blur-sharpen':
        return { initial: { filter: 'blur(1px)' }, whileHover: { filter: 'blur(0px)', transition: { duration: 0.3 } } };
      case 'color-shift':
        return { whileHover: { filter: 'hue-rotate(30deg)', transition: { duration: 0.5 } } };
      default:
        return {};
    }
  }, [category, config.hover?.type, config.hover?.intensity]);

  // ---- TEXT ANIMATION CSS CLASS ----
  const textAnimClass = useMemo(() => {
    if (category !== 'text') return '';
    const t = config.text;
    if (!t || t.type === 'none') return '';
    // CSS classes that can be applied for text animations
    return `text-anim-${t.type}`;
  }, [category, config.text?.type]);

  // ---- BUILD COMBINED MOTION PROPS ----
  const motionProps: any = {};
  const motionStyle: any = { ...style };

  if (category === 'entrance') {
    Object.assign(motionProps, entranceProps);
  } else if (category === 'scroll') {
    if (parallaxEnabled) {
      if (parallaxDir === 'up' || parallaxDir === 'down') {
        motionStyle.y = parallaxY;
      } else {
        motionStyle.x = parallaxX;
      }
    }
    if (scrollProgEnabled) {
      switch (scrollProp) {
        case 'opacity': motionStyle.opacity = scrollProgressValue; break;
        case 'scale': motionStyle.scale = scrollProgressValue; break;
        case 'rotate': motionStyle.rotate = scrollProgressValue; break;
        case 'translateX': motionStyle.x = scrollProgressValue; break;
        case 'translateY': motionStyle.y = scrollProgressValue; break;
        case 'blur':
          // blur requires useTransform with template
          break;
      }
    }
  } else if (category === 'continuous') {
    Object.assign(motionProps, continuousProps);
  } else if (category === 'hover') {
    Object.assign(motionProps, hoverProps);
  }

  // Add perspective for 3D effects
  const wrapperStyle: React.CSSProperties = {};
  if (config.hover?.type === 'tilt-3d') {
    wrapperStyle.perspective = '800px';
  }

  // Add overflow hidden for parallax to prevent content from extending beyond site boundaries
  if (parallaxEnabled) {
    wrapperStyle.overflow = 'hidden';
  }

  return (
    <div style={wrapperStyle} id={id}>
      <motion.div
        ref={ref}
        className={`${className} ${textAnimClass}`.trim()}
        style={motionStyle}
        {...motionProps}
      >
        {children}
      </motion.div>
    </div>
  );
}

// ============================================================================
// TEXT ANIMATION CSS (inject via style tag)
// ============================================================================

export function AnimationStyles() {
  return (
    <style>{`
      @keyframes typewriter-cursor {
        0%, 100% { border-right-color: transparent; }
        50% { border-right-color: currentColor; }
      }
      .text-anim-typewriter {
        overflow: hidden;
        white-space: nowrap;
        border-right: 2px solid;
        animation: typewriter-cursor 0.8s step-end infinite;
      }
      @keyframes highlight-sweep {
        0% { background-size: 0% 100%; }
        100% { background-size: 100% 100%; }
      }
      .text-anim-highlight-sweep {
        background-image: linear-gradient(120deg, rgba(var(--primary-rgb, 59, 130, 246), 0.2) 0%, rgba(var(--primary-rgb, 59, 130, 246), 0.2) 100%);
        background-repeat: no-repeat;
        background-position: 0 88%;
        background-size: 0% 0.2em;
        animation: highlight-sweep 1.5s ease forwards;
      }
      .text-anim-split-reveal > * {
        display: inline-block;
        opacity: 0;
        animation: split-reveal-in 0.5s ease forwards;
      }
      @keyframes split-reveal-in {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .text-anim-fade-words > * {
        opacity: 0;
        animation: fade-word-in 0.6s ease forwards;
      }
      @keyframes fade-word-in {
        from { opacity: 0; filter: blur(4px); }
        to { opacity: 1; filter: blur(0); }
      }
      .text-anim-blur-in {
        animation: text-blur-in 1s ease forwards;
      }
      @keyframes text-blur-in {
        from { opacity: 0; filter: blur(10px); }
        to { opacity: 1; filter: blur(0); }
      }

      /* Reduced motion preference */
      @media (prefers-reduced-motion: reduce) {
        .text-anim-typewriter,
        .text-anim-highlight-sweep,
        .text-anim-split-reveal > *,
        .text-anim-fade-words > *,
        .text-anim-blur-in {
          animation: none !important;
          opacity: 1 !important;
          filter: none !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

export default AnimatedBlockWrapper;
