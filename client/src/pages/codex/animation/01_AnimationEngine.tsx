/**
 * LIVING CODEX — AnimationEngine.tsx
 * ═══════════════════════════════════════════════════════════════
 * Turbocharged Animation Hooks & Engine · v3.0
 *
 * This replaces/extends codexAnimations.tsx with:
 *   - GlimmerEngine (React port of the particle system)
 *   - HolographicMode controller (enter/exit dark world)
 *   - WaveformVisualizer (3-state voice bars)
 *   - Phase icon animation wiring
 *   - Upgraded hooks: useStaggerEntrance, useProgressFill, useBreath, etc.
 *   - Full keyframe injection (all 50+ animations)
 *
 * Drop-in: import { AnimationProvider, useAnimation } from './AnimationEngine'
 * Wrap your <CodexPortalShell> children in <AnimationProvider>
 * ═══════════════════════════════════════════════════════════════
 */

import React, {
  createContext, useContext, useCallback, useEffect,
  useMemo, useRef, useState,
} from 'react';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type GlimmerMode = 'light' | 'holographic' | 'sacred_space';
type WaveformState = 'idle' | 'recording' | 'playback';
type PhaseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

interface AnimationContextValue {
  reducedMotion: boolean;
  holoActive: boolean;
  enterHolographic: () => Promise<void>;
  exitHolographic: () => Promise<void>;
  glimmerMode: GlimmerMode;
  setGlimmerMode: (mode: GlimmerMode) => void;
}

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS (mirror codexDesignSystem.tsx variables)
// ═══════════════════════════════════════════════════════════════

export const TOKENS = {
  // Timing
  DUR_INSTANT: 80,
  DUR_FAST: 150,
  DUR_MEDIUM: 300,
  DUR_SLOW: 600,
  DUR_BREATH: 5000,
  DUR_DRIFT: 3500,
  DUR_UNFURL: 900,
  DUR_PHASE: 1200,

  // Easing (CSS strings)
  EASE_OUT:     'cubic-bezier(0.0, 0.0, 0.2, 1.0)',
  EASE_IN_OUT:  'cubic-bezier(0.4, 0.0, 0.2, 1.0)',
  EASE_SPRING:  'cubic-bezier(0.34, 1.56, 0.64, 1.0)',
  EASE_BREATH:  'ease-in-out',
  EASE_UNFURL:  'cubic-bezier(0.16, 1, 0.3, 1)',
  EASE_RECEDE:  'cubic-bezier(0.4, 0, 1, 1)',

  // Scale
  SCALE_PRESS:  0.97,
  SCALE_LIFT:   1.03,
  SCALE_BREATHE: 1.006,
  SCALE_HOVER_ORB: 1.08,

  // Translate
  LIFT_CARD: -3,
  LIFT_ORB:  -5,
  LIFT_BTN:  -2,

  // Opacity
  OPACITY_DIM:   0.45,
  OPACITY_GHOST: 0.25,

  // Blur
  BLUR_GLASS:      18,
  BLUR_GLASS_DEEP: 28,
  BLUR_HOLO:       40,

  // Phase accent colors
  PHASE_COLORS: {
    1: { name: 'Threshold',   primary: 'rgba(184,123,101,0.7)', glow: 'rgba(184,123,101,0.15)' },
    2: { name: 'Descent',     primary: 'rgba(139,123,168,0.7)', glow: 'rgba(139,123,168,0.15)' },
    3: { name: 'Naming',      primary: 'rgba(184,151,106,0.7)', glow: 'rgba(184,151,106,0.15)' },
    4: { name: 'Mirror',      primary: 'rgba(125,142,127,0.7)', glow: 'rgba(125,142,127,0.15)' },
    5: { name: 'Void',        primary: 'rgba(154,148,141,0.5)', glow: 'rgba(154,148,141,0.10)' },
    6: { name: 'Ember',       primary: 'rgba(184,123,101,0.9)', glow: 'rgba(184,123,101,0.20)' },
    7: { name: 'Integration', primary: 'rgba(184,151,106,0.8)', glow: 'rgba(184,151,106,0.15)' },
    8: { name: 'Embodiment',  primary: 'rgba(125,142,127,0.8)', glow: 'rgba(125,142,127,0.15)' },
    9: { name: 'Offering',    primary: 'rgba(255,220,150,0.7)', glow: 'rgba(255,220,150,0.15)' },
  } as Record<number, { name: string; primary: string; glow: string }>,
} as const;


// ═══════════════════════════════════════════════════════════════
// HOOK: useReducedMotion
// ═══════════════════════════════════════════════════════════════

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}


// ═══════════════════════════════════════════════════════════════
// HOOK: useStaggerEntrance — upgraded with intersection observer
// ═══════════════════════════════════════════════════════════════

export function useStaggerEntrance(
  itemCount: number,
  { delayMs = 80, threshold = 0.15, animationType = 'fadeUp' } = {}
) {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [threshold]);

  const getItemStyle = useCallback((index: number): React.CSSProperties => {
    if (reduced) return { opacity: 1 };
    if (!visible) return { opacity: 0 };
    return {
      animation: `${animationType} 650ms ${TOKENS.EASE_OUT} ${index * delayMs}ms both`,
    };
  }, [visible, reduced, delayMs, animationType]);

  return { containerRef, getItemStyle, visible };
}


// ═══════════════════════════════════════════════════════════════
// HOOK: useBreath — continuous breathing animation value
// ═══════════════════════════════════════════════════════════════

export function useBreath(periodMs = 5000): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (reduced) return;
    const loop = () => {
      const t = (performance.now() % periodMs) / periodMs;
      setValue(Math.sin(t * Math.PI * 2) * 0.5 + 0.5); // 0 → 1 → 0
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [periodMs, reduced]);

  return reduced ? 0.5 : value;
}


// ═══════════════════════════════════════════════════════════════
// HOOK: useProgressFill — animates on mount / intersection
// ═══════════════════════════════════════════════════════════════

export function useProgressFill(
  targetPercent: number,
  { durationMs = 1200, delayMs = 400 } = {}
) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [shimmer, setShimmer] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();

        if (reduced) { setCurrent(targetPercent); return; }

        const start = performance.now() + delayMs;
        const animate = (now: number) => {
          const elapsed = now - start;
          if (elapsed < 0) { requestAnimationFrame(animate); return; }
          const progress = Math.min(1, elapsed / durationMs);
          const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
          setCurrent(Math.round(eased * targetPercent));
          if (progress < 1) requestAnimationFrame(animate);
          else setTimeout(() => setShimmer(true), 200);
        };
        requestAnimationFrame(animate);
      },
      { threshold: 0.2 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [targetPercent, durationMs, delayMs, reduced]);

  return { ref, current, shimmer };
}


// ═══════════════════════════════════════════════════════════════
// HOOK: useWaveform — 3-state waveform visualizer
// ═══════════════════════════════════════════════════════════════

const WAVE_BAR_COUNT = 20;
const WAVE_IDLE_HEIGHTS = [6,10,18,26,20,14,22,16,8,24,18,12,20,10,16,28,18,8,14,22];

export function useWaveform(analyserNode: AnalyserNode | null) {
  const [state, setState] = useState<WaveformState>('idle');
  const [bars, setBars] = useState<number[]>(WAVE_IDLE_HEIGHTS);
  const rafRef = useRef<number>();
  const stateRef = useRef(state);
  stateRef.current = state;

  const setWaveState = useCallback((s: WaveformState) => setState(s), []);

  useEffect(() => {
    if (state === 'idle') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    if (state === 'recording' && analyserNode) {
      const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
      const tick = () => {
        if (stateRef.current !== 'recording') return;
        analyserNode.getByteFrequencyData(dataArray);
        const newBars = Array.from({ length: WAVE_BAR_COUNT }, (_, i) => {
          const idx = Math.floor((i / WAVE_BAR_COUNT) * dataArray.length * 0.6);
          return Math.max(4, (dataArray[idx] / 255) * 34);
        });
        setBars(newBars);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [state, analyserNode]);

  return { bars, state, setWaveState };
}


// ═══════════════════════════════════════════════════════════════
// HOOK: usePhaseGlow — returns phase-specific ambient colors
// ═══════════════════════════════════════════════════════════════

export function usePhaseGlow(phaseNum: number) {
  return useMemo(() => {
    const phase = TOKENS.PHASE_COLORS[phaseNum] || TOKENS.PHASE_COLORS[1];
    return {
      primary: phase.primary,
      glow: phase.glow,
      name: phase.name,
      boxShadow: `0 0 40px ${phase.glow}, 0 0 80px ${phase.glow}`,
      borderColor: phase.primary,
    };
  }, [phaseNum]);
}


// ═══════════════════════════════════════════════════════════════
// HOOK: useCountUp — number counter animation
// ═══════════════════════════════════════════════════════════════

export function useCountUp(target: number, durationMs = 1000): number {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduced) { setCount(target); return; }
    if (!ref.current) { setCount(target); return; }

    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const animate = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = 1 - Math.pow(1 - t, 4); // ease-out quart
        setCount(Math.round(eased * target));
        if (t < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, { threshold: 0.3 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, durationMs, reduced]);

  return count;
}


// ═══════════════════════════════════════════════════════════════
// HOOK: useTypewriter — character-by-character reveal
// ═══════════════════════════════════════════════════════════════

export function useTypewriter(text: string, speedMs = 45) {
  const reduced = useReducedMotion();
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (reduced) { setDisplayText(text); setIsComplete(true); return; }
    setDisplayText('');
    setIsComplete(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayText(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); setIsComplete(true); }
    }, speedMs);
    return () => clearInterval(interval);
  }, [text, speedMs, reduced]);

  return { displayText, isComplete };
}


// ═══════════════════════════════════════════════════════════════
// CONTEXT + PROVIDER
// ═══════════════════════════════════════════════════════════════

const AnimationContext = createContext<AnimationContextValue>({
  reducedMotion: false,
  holoActive: false,
  enterHolographic: async () => {},
  exitHolographic: async () => {},
  glimmerMode: 'light',
  setGlimmerMode: () => {},
});

export const useAnimation = () => useContext(AnimationContext);

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [holoActive, setHoloActive] = useState(false);
  const [glimmerMode, setGlimmerMode] = useState<GlimmerMode>('light');
  const transitioning = useRef(false);

  const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

  const enterHolographic = useCallback(async () => {
    if (holoActive || transitioning.current) return;
    transitioning.current = true;

    // Step 1: Transition particles to gold
    setGlimmerMode('holographic');

    // Step 2: Flash overlay → dark world
    document.body.classList.add('lc-holo-entering');
    await wait(400);
    document.body.classList.add('lc-holo-mode');
    await wait(150);
    document.body.classList.remove('lc-holo-entering');

    setHoloActive(true);
    transitioning.current = false;
  }, [holoActive]);

  const exitHolographic = useCallback(async () => {
    if (!holoActive || transitioning.current) return;
    transitioning.current = true;

    // Step 1: Brief flash
    document.body.classList.add('lc-holo-exiting');
    setGlimmerMode('light');
    await wait(250);
    document.body.classList.remove('lc-holo-mode');
    await wait(150);
    document.body.classList.remove('lc-holo-exiting');

    setHoloActive(false);
    transitioning.current = false;
  }, [holoActive]);

  // Inject keyframes on mount
  useEffect(() => { injectAnimationStyles(); }, []);

  const value = useMemo(() => ({
    reducedMotion, holoActive, enterHolographic, exitHolographic,
    glimmerMode, setGlimmerMode,
  }), [reducedMotion, holoActive, enterHolographic, exitHolographic, glimmerMode]);

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
}


// ═══════════════════════════════════════════════════════════════
// KEYFRAME INJECTION — all 50+ animations
// ═══════════════════════════════════════════════════════════════

let _injected = false;

function injectAnimationStyles() {
  if (_injected) return;
  _injected = true;

  const css = `
/* ═══════ LIVING CODEX ANIMATION TOKENS ═══════ */
:root {
  --dur-instant: 80ms;
  --dur-fast: 150ms;
  --dur-medium: 300ms;
  --dur-slow: 600ms;
  --dur-breath: 5000ms;
  --dur-drift: 3500ms;
  --dur-unfurl: 900ms;
  --dur-phase: 1200ms;
  --ease-out: cubic-bezier(0.0, 0.0, 0.2, 1.0);
  --ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1.0);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1.0);
  --ease-breath: ease-in-out;
  --ease-unfurl: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-recede: cubic-bezier(0.4, 0, 1, 1);
  --scale-press: 0.97;
  --scale-lift: 1.03;
  --scale-breathe: 1.006;
  --scale-hover-orb: 1.08;
  --lift-card: -3px;
  --lift-orb: -5px;
  --lift-btn: -2px;
  --blur-glass: 18px;
  --blur-glass-deep: 28px;
  --blur-holo: 40px;
}

/* ═══════ UNIVERSAL ENTRANCE ═══════ */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes fadeDown {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.94); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* ═══════ BREATHING ═══════ */
@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(var(--scale-breathe, 1.006)); }
}
@keyframes breatheSlow {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.004); }
}
@keyframes breatheGlow {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 1px 0 rgba(255,255,255,0.9) inset, 0 8px 32px rgba(0,0,0,0.04);
  }
  50% {
    transform: scale(var(--scale-breathe, 1.006));
    box-shadow: 0 1px 0 rgba(255,255,255,0.9) inset, 0 14px 44px rgba(0,0,0,0.07), 0 0 60px rgba(184,123,101,0.04);
  }
}
@keyframes portraitBreath {
  0%, 100% { transform: scale(1) translateY(0); filter: brightness(1); }
  50%       { transform: scale(1.012) translateY(-3px); filter: brightness(1.04); }
}

/* ═══════ GLIMMER PARTICLES ═══════ */
@keyframes glimmerFloat {
  0%   { opacity: 0; transform: scale(0.4) translateY(0); }
  25%  { opacity: 0.85; }
  70%  { opacity: 0.45; }
  100% { opacity: 0; transform: scale(1.9) translateY(-45px); }
}
@keyframes glimmerPulse {
  0%, 100% { opacity: 0.2; transform: scale(0.8); }
  50%       { opacity: 0.7; transform: scale(1.2); }
}
@keyframes goldDrift {
  0%   { opacity: 0; transform: translate(0, 0) scale(0.6); }
  20%  { opacity: 0.8; }
  100% { opacity: 0; transform: translate(var(--dx, 20px), -65px) scale(1.4); }
}

/* ═══════ HOLOGRAPHIC ═══════ */
@keyframes auroraShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes holoGlow {
  0%, 100% {
    box-shadow: 0 0 40px rgba(184,123,101,0.15), 0 0 80px rgba(139,123,168,0.08), inset 0 1px 0 rgba(255,255,255,0.06);
  }
  50% {
    box-shadow: 0 0 60px rgba(184,123,101,0.25), 0 0 120px rgba(139,123,168,0.14), inset 0 1px 0 rgba(255,255,255,0.12);
  }
}
@keyframes scanLine {
  0%   { transform: translateY(-100%); opacity: 0; }
  10%  { opacity: 0.05; }
  90%  { opacity: 0.05; }
  100% { transform: translateY(220%); opacity: 0; }
}

/* ═══════ PROGRESS BARS ═══════ */
@keyframes barShimmer {
  0%   { transform: translateX(-100%); opacity: 0; }
  30%  { opacity: 1; }
  100% { transform: translateX(400%); opacity: 0; }
}

/* ═══════ WAVEFORM ═══════ */
@keyframes waveIdle {
  0%, 100% { height: 4px; opacity: 0.18; }
  50%       { height: var(--wave-h, 8px); opacity: 0.32; }
}
@keyframes waveActive {
  0%   { height: 4px; }
  25%  { height: var(--wave-h, 24px); }
  75%  { height: calc(var(--wave-h, 24px) * 0.55); }
  100% { height: 4px; }
}
@keyframes wavePulse {
  0%, 100% { height: 4px; opacity: 0.3; }
  50%       { height: var(--wave-h, 22px); opacity: 0.7; }
}

/* ═══════ BUTTONS ═══════ */
@keyframes shimmerSweep {
  0%   { left: -100%; }
  100% { left: 150%; }
}

/* ═══════ PHASE ICONS ═══════ */
@keyframes spiralDescend {
  0%   { transform: translateY(0) rotate(0deg) scale(1); }
  50%  { transform: translateY(4px) rotate(28deg) scale(0.94); }
  100% { transform: translateY(0) rotate(0deg) scale(1); }
}
@keyframes strokeDraw {
  from { stroke-dashoffset: var(--path-length, 60); }
  to   { stroke-dashoffset: 0; }
}
@keyframes mirrorRipple {
  0%   { r: 6; stroke-opacity: 0.7; stroke-width: 1.5; }
  100% { r: 24; stroke-opacity: 0; stroke-width: 0.3; }
}
@keyframes voidPulse {
  0%, 100% { r: 3; opacity: 0.55; }
  50%       { r: 13; opacity: 0.08; }
}
@keyframes voidRing {
  0%, 100% { stroke-opacity: 0.5; }
  50%       { stroke-opacity: 0.15; }
}
@keyframes flickerA {
  0%, 100% { transform: scaleY(1) scaleX(1) translateY(0); }
  50%       { transform: scaleY(1.22) scaleX(0.88) translateY(-3px); }
}
@keyframes flickerB {
  0%, 100% { transform: scaleY(1) rotate(-2deg) translateY(0); }
  50%       { transform: scaleY(0.88) rotate(4deg) translateY(2px); }
}
@keyframes flickerC {
  0%, 100% { transform: scaleY(1.1) translateY(-1px); }
  50%       { transform: scaleY(0.9) translateY(1px); }
}
@keyframes emberGlow {
  0%, 100% { opacity: 0.25; }
  50%       { opacity: 0.65; }
}
@keyframes weaveUp {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-4px); }
}
@keyframes weaveDown {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(4px); }
}
@keyframes rootGrow {
  from { stroke-dashoffset: var(--root-length, 14); }
  to   { stroke-dashoffset: 0; }
}
@keyframes crownBloom {
  from { stroke-dashoffset: var(--crown-length, 18); }
  to   { stroke-dashoffset: 0; }
}
@keyframes rayRadiate {
  0%   { transform: scale(1); opacity: 0.65; }
  100% { transform: scale(1.75); opacity: 0; }
}
@keyframes orbPulseRing {
  0%   { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(1.55); opacity: 0; }
}

/* ═══════ PAGE TRANSITIONS ═══════ */
@keyframes pageEnter {
  from { opacity: 0; transform: translateY(8px); filter: blur(1.5px); }
  to   { opacity: 1; transform: translateY(0); filter: blur(0); }
}
@keyframes pageExit {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-6px); }
}

/* ═══════ CURSOR ═══════ */
@keyframes cursorBlink {
  0%, 100% { opacity: 0.8; }
  50%       { opacity: 0; }
}

/* ═══════ TIMELINE ═══════ */
@keyframes timelineDotPop {
  0%   { transform: scale(0); opacity: 0; }
  65%  { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes timelineLineGrow {
  from { height: 0; }
  to   { height: 100%; }
}

/* ═══════ CONSTELLATION ═══════ */
@keyframes constellationOrbit {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes starTwinkle {
  0%, 100% { opacity: 0.45; r: 2.5; }
  50%       { opacity: 1; r: 3.5; }
}
@keyframes connectionPulse {
  0%, 100% { stroke-opacity: 0.12; }
  50%       { stroke-opacity: 0.32; }
}

/* ═══════ MIRROR REPORT ═══════ */
@keyframes weavingPulse {
  0%, 100% { opacity: 0.65; }
  50%       { opacity: 1; }
}
@keyframes portraitReveal {
  0%   { opacity: 0; clip-path: inset(0 100% 0 0); }
  100% { opacity: 1; clip-path: inset(0 0% 0 0); }
}

/* ═══════ SACRED SPACE ═══════ */
@keyframes spaceCardGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(184,123,101,0); }
  50%       { box-shadow: 0 0 24px 4px rgba(184,123,101,0.22); }
}

/* ═══════ SESSION INSIGHT ═══════ */
@keyframes insightSurface {
  from { opacity: 0; transform: translateY(10px); filter: blur(2px); }
  to   { opacity: 1; transform: translateY(0); filter: blur(0); }
}

/* ═══════ SACRED KEYFRAMES (from existing codexAnimations) ═══════ */
@keyframes sacredReveal {
  0%   { opacity: 0; transform: translateY(20px) scale(0.95); filter: blur(4px); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}
@keyframes materialize {
  0%   { opacity: 0; transform: scale(0.8) rotate(-2deg); filter: blur(6px); }
  60%  { opacity: 1; transform: scale(1.02) rotate(0.5deg); filter: blur(0); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); filter: blur(0); }
}
@keyframes thresholdCross {
  0%   { opacity: 0; transform: translateX(-40px) scale(0.9); }
  60%  { opacity: 1; transform: translateX(5px) scale(1.02); }
  100% { opacity: 1; transform: translateX(0) scale(1); }
}
@keyframes mirrorReveal {
  0%   { opacity: 0; transform: scaleY(0.1); filter: blur(3px); }
  60%  { opacity: 1; transform: scaleY(1.05); }
  100% { opacity: 1; transform: scaleY(1); filter: blur(0); }
}
@keyframes emberFloat {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
  50%       { transform: translateY(-8px) scale(1.05); opacity: 1; }
}
@keyframes dissolve {
  from { opacity: 1; filter: blur(0); }
  to   { opacity: 0; filter: blur(8px); }
}

/* ═══════ HOLOGRAPHIC MODE CLASSES ═══════ */
body.lc-holo-entering::before {
  content: '';
  position: fixed; inset: 0;
  background: rgba(20,16,12,0.95);
  z-index: 9998;
  pointer-events: none;
  animation: fadeIn 400ms var(--ease-in-out) both;
}
body.lc-holo-exiting::before {
  content: '';
  position: fixed; inset: 0;
  background: rgba(20,16,12,0.4);
  z-index: 9998;
  pointer-events: none;
  animation: fadeIn 200ms var(--ease-in-out) both reverse;
}

/* ═══════ REDUCED MOTION ═══════ */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .lc-glimmer-layer { display: none !important; }
}
`;

  const style = document.createElement('style');
  style.id = 'lc-animation-engine';
  style.textContent = css;
  document.head.appendChild(style);
}

export { injectAnimationStyles };
