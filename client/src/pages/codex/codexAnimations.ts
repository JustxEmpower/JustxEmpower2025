/**
 * INSPIRE: Motion Architect
 * Complete animation system for the Living Codex portal
 * Pure CSS + React hooks for 60fps performance
 * No external animation libraries (Framer Motion excluded by design)
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

// ============================================================================
// PHASE COLOR MAP — The Sacred Palette
// ============================================================================

export const PHASE_COLORS: Record<
  string,
  { primary: string; glow: string; accent: string }
> = {
  'The Threshold': {
    primary: '#6B6560',
    glow: 'rgba(107,101,96,0.3)',
    accent: '#8B8580',
  },
  'The Descent': {
    primary: '#3C3489',
    glow: 'rgba(60,52,137,0.3)',
    accent: '#534AB7',
  },
  'The Naming': {
    primary: '#8B2252',
    glow: 'rgba(139,34,82,0.3)',
    accent: '#A83B6B',
  },
  'The Mirror': {
    primary: '#7A4B8A',
    glow: 'rgba(122,75,138,0.3)',
    accent: '#9B6BAA',
  },
  'The Void': {
    primary: '#1A1A2E',
    glow: 'rgba(26,26,46,0.3)',
    accent: '#2A2A4E',
  },
  'The Ember': {
    primary: '#C4A265',
    glow: 'rgba(196,162,101,0.3)',
    accent: '#D4B275',
  },
  'The Integration': {
    primary: '#7A9E7E',
    glow: 'rgba(122,158,126,0.3)',
    accent: '#8AAE8E',
  },
  'The Embodiment': {
    primary: '#B85C38',
    glow: 'rgba(184,92,56,0.3)',
    accent: '#C87C58',
  },
  'The Offering': {
    primary: '#C4A265',
    glow: 'rgba(196,162,101,0.4)',
    accent: '#E4C285',
  },
};

// ============================================================================
// ACCESSIBILITY: Motion Preference Detection
// ============================================================================

/**
 * Hook: Detect prefers-reduced-motion system preference
 * Returns true if user has requested reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReduced(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReduced;
}

/**
 * Hook: Wrap animations to respect accessibility preferences
 * Returns static value if user prefers reduced motion
 */
export function useAccessibleAnimation<T>(
  animatedValue: T,
  staticValue: T
): T {
  const prefersReduced = useReducedMotion();
  return prefersReduced ? staticValue : animatedValue;
}

// ============================================================================
// 1. PAGE TRANSITION SYSTEM
// ============================================================================

export const pageTransitions = {
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  slideInFromRight: 'animate-slide-in-right',
  slideInFromLeft: 'animate-slide-in-left',
  morphUp: 'animate-morph-up',
  dissolve: 'animate-dissolve',
  sacredReveal: 'animate-sacred-reveal',
};

// ============================================================================
// 2. COMPONENT ANIMATIONS — Hooks & Utilities
// ============================================================================

/**
 * Hook: Staggered entrance for list items
 * Returns array of delay values for each item
 * Usage: items.map((item, i) => <div style={{animationDelay: delays[i]}} />)
 */
export function useStaggerEntrance(
  itemCount: number,
  delayMs: number = 80
): string[] {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return Array(itemCount).fill('0ms');
  }

  return Array.from({ length: itemCount }, (_, i) => `${i * delayMs}ms`);
}

/**
 * Hook: Progress fill animation
 * Smoothly animates from current to target percentage
 */
export function useProgressFill(targetPercent: number, durationMs: number = 800): number {
  const [progress, setProgress] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      setProgress(targetPercent);
      return;
    }

    const startTime = Date.now();
    const startProgress = progress;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const fraction = Math.min(elapsed / durationMs, 1);

      // Easing: ease-out-cubic
      const eased = 1 - Math.pow(1 - fraction, 3);
      const current = startProgress + (targetPercent - startProgress) * eased;

      setProgress(current);

      if (fraction < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [targetPercent, durationMs, prefersReduced, progress]);

  return progress;
}

/**
 * Hook: Animated number counter
 * Smoothly counts from 0 to target
 */
export function useCountUp(target: number, durationMs: number = 1000): number {
  const [count, setCount] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      setCount(target);
      return;
    }

    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const fraction = Math.min(elapsed / durationMs, 1);

      // Easing: ease-out-expo
      const eased = 1 - Math.pow(2, -10 * fraction);
      const current = Math.floor(target * eased);

      setCount(current);

      if (fraction < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target, durationMs, prefersReduced]);

  return count;
}

/**
 * Hook: Ripple effect for touch/click feedback
 */
export function useRipple() {
  const [ripples, setRipples] = useState<
    Array<{ id: string; x: number; y: number }>
  >([]);
  const prefersReduced = useReducedMotion();

  const onMouseDown = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (prefersReduced) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const id = `ripple-${Date.now()}-${Math.random()}`;

      setRipples((prev) => [...prev, { id, x, y }]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    },
    [prefersReduced]
  );

  return { onMouseDown, ripples };
}

/**
 * Hook: Typewriter effect for text reveal
 */
export function useTypewriter(text: string, speedMs: number = 50) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      setDisplayText(text);
      setIsComplete(true);
      return;
    }

    if (displayText.length >= text.length) {
      setIsComplete(true);
      return;
    }

    const timer = setTimeout(() => {
      setDisplayText(text.slice(0, displayText.length + 1));
    }, speedMs);

    return () => clearTimeout(timer);
  }, [displayText, text, speedMs, prefersReduced]);

  return { displayText, isComplete };
}

/**
 * Hook: Parallax scroll effect
 * Returns transform style for parallax movement
 */
export function useParallax(speed: number = 0.5) {
  const [offset, setOffset] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      return;
    }

    const handleScroll = () => {
      setOffset(window.scrollY * speed);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, prefersReduced]);

  return {
    transform: `translateY(${offset}px)`,
  };
}

/**
 * Hook: Waveform visualization from audio analyser
 * Returns array of bar heights (0-255)
 */
export function useWaveform(analyserNode: AnalyserNode | null) {
  const [bars, setBars] = useState<number[]>([]);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!analyserNode) return;

    const bufferLength = analyserNode.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);

    const animate = () => {
      if (!analyserNode || !dataArrayRef.current) return;

      analyserNode.getByteFrequencyData(dataArrayRef.current);

      // Sample every Nth bar for smoother visualization
      const sampleRate = Math.max(1, Math.floor(bufferLength / 32));
      const sampledBars = Array.from(
        { length: 32 },
        (_, i) => dataArrayRef.current![i * sampleRate] || 0
      );

      setBars(sampledBars);
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animationIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [analyserNode]);

  return { bars };
}

/**
 * Hook: Phase glow based on Codex phase
 * Returns colors for ambient glow effect
 */
export function usePhaseGlow(phase: string) {
  const colors = PHASE_COLORS[phase] || PHASE_COLORS['The Threshold'];

  return {
    background: colors.primary,
    shadow: colors.glow,
    accent: colors.accent,
  };
}

/**
 * Hook: Constellation draw animation
 * Animates line drawing between points (like connecting wounds)
 */
export function useConstellationDraw(
  points: Array<{ x: number; y: number }>,
  durationMs: number = 1500
) {
  const [progress, setProgress] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      setProgress(1);
      return;
    }

    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const fraction = Math.min(elapsed / durationMs, 1);

      // Easing: ease-in-out-cubic
      const eased =
        fraction < 0.5
          ? 4 * fraction * fraction * fraction
          : 1 - Math.pow(-2 * fraction + 2, 3) / 2;

      setProgress(eased);

      if (fraction < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [points, durationMs, prefersReduced]);

  // Generate SVG paths that gradually draw
  const paths = Array.from(
    { length: Math.max(0, points.length - 1) },
    (_, i) => {
      const start = points[i];
      const end = points[i + 1];
      const segmentProgress = Math.max(
        0,
        Math.min(1, (progress * (points.length - 1) - i) / 1)
      );

      const currentX = start.x + (end.x - start.x) * segmentProgress;
      const currentY = start.y + (end.y - start.y) * segmentProgress;

      return `M ${start.x} ${start.y} L ${currentX} ${currentY}`;
    }
  );

  return { paths, progress };
}

// ============================================================================
// 3. SACRED MOTION PATTERNS — CSS Keyframes
// ============================================================================

const SACRED_KEYFRAMES = {
  fadeIn: `
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `,

  fadeOut: `
    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }
  `,

  slideInRight: `
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(40px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,

  slideInLeft: `
    @keyframes slideInLeft {
      from {
        opacity: 0;
        transform: translateX(-40px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,

  morphUp: `
    @keyframes morphUp {
      from {
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `,

  dissolve: `
    @keyframes dissolve {
      0% {
        opacity: 1;
        filter: blur(0px) brightness(1);
      }
      50% {
        opacity: 0.5;
        filter: blur(2px) brightness(1.2);
      }
      100% {
        opacity: 0;
        filter: blur(4px) brightness(0.8);
      }
    }
  `,

  sacredReveal: `
    @keyframes sacredReveal {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
        filter: brightness(1.5);
      }
      50% {
        filter: brightness(1.2);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
        filter: brightness(1);
      }
    }
  `,

  breathe: `
    @keyframes breathe {
      0%, 100% {
        opacity: 0.7;
        transform: scale(1);
      }
      50% {
        opacity: 1;
        transform: scale(1.05);
      }
    }
  `,

  shimmer: `
    @keyframes shimmer {
      0%, 100% {
        background-position: -1000px 0;
      }
      50% {
        background-position: 1000px 0;
      }
    }
  `,

  materialize: `
    @keyframes materialize {
      0% {
        opacity: 0;
        transform: scale(0) translate(0, 0);
        filter: blur(8px);
      }
      50% {
        opacity: 0.5;
        filter: blur(4px);
      }
      100% {
        opacity: 1;
        transform: scale(1) translate(0, 0);
        filter: blur(0);
      }
    }
  `,

  thresholdCross: `
    @keyframes thresholdCross {
      0% {
        opacity: 0;
        transform: scaleY(0);
        filter: blur(10px);
      }
      50% {
        filter: blur(5px);
      }
      100% {
        opacity: 1;
        transform: scaleY(1);
        filter: blur(0);
      }
    }
  `,

  mirrorReveal: `
    @keyframes mirrorReveal {
      0% {
        opacity: 0;
        transform: rotateX(90deg) translateY(-20px);
        filter: brightness(0.8);
      }
      50% {
        filter: brightness(1.2);
      }
      100% {
        opacity: 1;
        transform: rotateX(0deg) translateY(0);
        filter: brightness(1);
      }
    }
  `,

  emberFloat: `
    @keyframes emberFloat {
      0% {
        opacity: 1;
        transform: translateY(0) translateX(-50%);
      }
      100% {
        opacity: 0;
        transform: translateY(-100vh) translateX(calc(-50% + 20px));
      }
    }
  `,

  buttonPress: `
    @keyframes buttonPress {
      0% {
        transform: scale(1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      50% {
        transform: scale(0.98);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      }
      100% {
        transform: scale(1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }
  `,

  cardSelect: `
    @keyframes cardSelect {
      from {
        transform: translateY(0);
        border-color: transparent;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      to {
        transform: translateY(-4px);
        border-color: currentColor;
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
      }
    }
  `,

  navActive: `
    @keyframes navActive {
      from {
        transform: scaleX(0);
        opacity: 0;
      }
      to {
        transform: scaleX(1);
        opacity: 1;
      }
    }
  `,

  toggleSwitch: `
    @keyframes toggleSwitch {
      from {
        transform: translateX(0);
      }
      to {
        transform: translateX(100%);
      }
    }
  `,

  badgePop: `
    @keyframes badgePop {
      0% {
        transform: scale(0) translateY(10px);
        opacity: 0;
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        transform: scale(1) translateY(0);
        opacity: 1;
      }
    }
  `,

  pulse: `
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  `,

  slideDown: `
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
        max-height: 0;
      }
      to {
        opacity: 1;
        transform: translateY(0);
        max-height: 1000px;
      }
    }
  `,

  slideUp: `
    @keyframes slideUp {
      from {
        opacity: 1;
        transform: translateY(0);
        max-height: 1000px;
      }
      to {
        opacity: 0;
        transform: translateY(-20px);
        max-height: 0;
      }
    }
  `,

  spin: `
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `,

  bounce: `
    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-20px);
      }
    }
  `,

  glow: `
    @keyframes glow {
      0%, 100% {
        box-shadow: 0 0 10px currentColor;
      }
      50% {
        box-shadow: 0 0 20px currentColor;
      }
    }
  `,

  float: `
    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-10px);
      }
    }
  `,

  slideRight: `
    @keyframes slideRight {
      from {
        opacity: 0;
        transform: translateX(-60px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,

  slideLeft: `
    @keyframes slideLeft {
      from {
        opacity: 0;
        transform: translateX(60px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,

  scaleIn: `
    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `,

  scaleOut: `
    @keyframes scaleOut {
      from {
        opacity: 1;
        transform: scale(1);
      }
      to {
        opacity: 0;
        transform: scale(0.9);
      }
    }
  `,
};

const ANIMATION_CLASSES = `
  /* Page Transitions */
  .animate-fade-in {
    animation: fadeIn 0.4s ease-out forwards;
  }

  .animate-fade-out {
    animation: fadeOut 0.4s ease-in forwards;
  }

  .animate-slide-in-right {
    animation: slideInRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .animate-slide-in-left {
    animation: slideInLeft 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .animate-morph-up {
    animation: morphUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .animate-dissolve {
    animation: dissolve 0.8s ease-in forwards;
  }

  .animate-sacred-reveal {
    animation: sacredReveal 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  /* Breathing & Pulsing */
  .animate-breathe {
    animation: breathe 4s ease-in-out infinite;
  }

  .animate-pulse {
    animation: pulse 2s ease-in-out infinite;
  }

  /* Shimmer for gold effects */
  .animate-shimmer {
    animation: shimmer 3s infinite;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    background-size: 1000px 100%;
  }

  /* Sacred Materials */
  .animate-materialize {
    animation: materialize 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .animate-threshold-cross {
    animation: thresholdCross 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
  }

  .animate-mirror-reveal {
    animation: mirrorReveal 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    perspective: 1000px;
  }

  /* Interaction Feedback */
  .animate-button-press {
    animation: buttonPress 0.3s ease-out;
  }

  .animate-card-select {
    animation: cardSelect 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .animate-nav-active {
    animation: navActive 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    transform-origin: left;
  }

  .animate-toggle-switch {
    animation: toggleSwitch 0.3s ease-out forwards;
  }

  .animate-badge-pop {
    animation: badgePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  /* Utilities */
  .animate-slide-down {
    animation: slideDown 0.3s ease-out forwards;
  }

  .animate-slide-up {
    animation: slideUp 0.3s ease-in forwards;
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  .animate-bounce {
    animation: bounce 1s ease-in-out infinite;
  }

  .animate-glow {
    animation: glow 2s ease-in-out infinite;
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .animate-slide-right {
    animation: slideRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .animate-slide-left {
    animation: slideLeft 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .animate-scale-in {
    animation: scaleIn 0.3s ease-out forwards;
  }

  .animate-scale-out {
    animation: scaleOut 0.3s ease-in forwards;
  }

  /* Reduced Motion Overrides */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

// ============================================================================
// 4. CSS INJECTION & INITIALIZATION
// ============================================================================

let styleInjected = false;

/**
 * Inject all animation styles into the document
 * Call once at app initialization in _app.tsx or layout.tsx
 */
export function injectAnimationStyles(): void {
  if (styleInjected || typeof document === 'undefined') {
    return;
  }

  const style = document.createElement('style');
  style.setAttribute('data-animations', 'inspire-motion-architect');

  // Combine all keyframes
  const allKeyframes = Object.values(SACRED_KEYFRAMES).join('\n');

  style.textContent = `
    ${allKeyframes}
    ${ANIMATION_CLASSES}
  `;

  document.head.appendChild(style);
  styleInjected = true;
}

// ============================================================================
// 5. GLASS HOVER & INTERACTIVE EFFECTS
// ============================================================================

export const glassHoverClass = 'glass-hover-effect';

export const glassHoverStyles = `
  .${glassHoverClass} {
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    backdrop-filter: blur(8px);
  }

  .${glassHoverClass}:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  }
`;

// ============================================================================
// 6. RIPPLE EFFECT COMPONENT (React)
// ============================================================================

export function RippleContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { onMouseDown, ripples } = useRipple();

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseDown={onMouseDown}
    >
      {children}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="absolute pointer-events-none rounded-full bg-white/50 animate-scale-out"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 40,
            height: 40,
            marginLeft: -20,
            marginTop: -20,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// 7. COMPOSITION HELPERS — Ready-to-use combinations
// ============================================================================

/**
 * Get animation duration and easing for a specific animation type
 */
export function getAnimationTiming(type: keyof typeof pageTransitions) {
  const timings: Record<string, { duration: number; easing: string }> = {
    fadeIn: { duration: 400, easing: 'ease-out' },
    fadeOut: { duration: 400, easing: 'ease-in' },
    slideInFromRight: { duration: 500, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    slideInFromLeft: { duration: 500, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    morphUp: { duration: 600, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    dissolve: { duration: 800, easing: 'ease-in' },
    sacredReveal: { duration: 1200, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  };

  return timings[type] || { duration: 400, easing: 'ease-out' };
}

/**
 * Generate staggered animation delays for sequential items
 */
export function generateStaggeredDelays(
  itemCount: number,
  baseDelayMs: number = 0,
  incrementMs: number = 80
): number[] {
  return Array.from(
    { length: itemCount },
    (_, i) => baseDelayMs + i * incrementMs
  );
}

/**
 * Combine multiple animation classes with proper spacing
 */
export function composeAnimationClass(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ============================================================================
// 8. ADVANCED HOOKS FOR COMPLEX ANIMATIONS
// ============================================================================

/**
 * Hook: Manage multiple simultaneous animations with sequencing
 */
export function useAnimationSequence(
  animations: Array<{ duration: number; delay?: number }>,
  trigger?: boolean
) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!trigger || prefersReduced) {
      setActiveIndex(animations.length - 1);
      return;
    }

    let currentDelay = 0;
    let timeoutIds: NodeJS.Timeout[] = [];

    animations.forEach((animation, index) => {
      const delay = animation.delay || currentDelay;
      currentDelay = delay + animation.duration;

      const timeoutId = setTimeout(() => {
        setActiveIndex(index);
      }, delay);

      timeoutIds.push(timeoutId);
    });

    return () => {
      timeoutIds.forEach(clearTimeout);
    };
  }, [trigger, animations, prefersReduced]);

  return activeIndex;
}

/**
 * Hook: Smoothly transition between two values
 */
export function useSmoothTransition(
  targetValue: number,
  durationMs: number = 300
): number {
  const [current, setCurrent] = useState(targetValue);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      setCurrent(targetValue);
      return;
    }

    const startTime = Date.now();
    const startValue = current;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // Cubic easing
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const value = startValue + (targetValue - startValue) * eased;
      setCurrent(value);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [targetValue, durationMs, prefersReduced, current]);

  return current;
}

/**
 * Hook: Detect if element is in viewport and trigger animation
 */
export function useInViewAnimation(threshold: number = 0.2) {
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsInView(true);
          setHasAnimated(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, hasAnimated]);

  return { ref, isInView };
}

// ============================================================================
// 9. EXPORT CONVENIENCE
// ============================================================================

export const ANIMATION_DURATIONS = {
  fast: 200,
  normal: 400,
  slow: 600,
  verySlow: 1000,
};

export const EASING_FUNCTIONS = {
  linear: 'linear',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  springy: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  sharp: 'cubic-bezier(0.4, 0, 1, 1)',
};

export default {
  pageTransitions,
  injectAnimationStyles,
  useStaggerEntrance,
  useProgressFill,
  useCountUp,
  useRipple,
  useTypewriter,
  useParallax,
  useWaveform,
  usePhaseGlow,
  useConstellationDraw,
  useReducedMotion,
  useAccessibleAnimation,
  useAnimationSequence,
  useSmoothTransition,
  useInViewAnimation,
  RippleContainer,
  ANIMATION_DURATIONS,
  EASING_FUNCTIONS,
  PHASE_COLORS,
};
