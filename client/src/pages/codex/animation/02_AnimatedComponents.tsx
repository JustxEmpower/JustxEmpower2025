/**
 * LIVING CODEX — AnimatedComponents.tsx
 * ═══════════════════════════════════════════════════════════════
 * Drop-in animated component library · v3.0
 *
 * Every component in this file replaces or wraps an existing
 * codex UI element with the full animation system baked in.
 *
 * Import these and swap them into your existing pages.
 * ═══════════════════════════════════════════════════════════════
 */

import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import {
  useAnimation, useReducedMotion, useBreath, useStaggerEntrance,
  useProgressFill, TOKENS,
} from './01_AnimationEngine';


// ═══════════════════════════════════════════════════════════════
// 1. GLIMMER LAYER — adaptive particle background
// ═══════════════════════════════════════════════════════════════

const GLIMMER_CONFIGS = {
  light: {
    count: 28, sizeMin: 1.5, sizeMax: 5,
    durMin: 2.5, durMax: 5.5, delayMax: 7,
    alphaMin: 0.3, alphaMax: 0.75,
    color: (a: number) => `rgba(255,255,255,${a})`,
    keyframe: 'glimmerFloat', yMin: 0,
  },
  holographic: {
    count: 52, sizeMin: 1.5, sizeMax: 4,
    durMin: 1.8, durMax: 4.2, delayMax: 5,
    alphaMin: 0.5, alphaMax: 0.95,
    color: (a: number) => `rgba(212,175,95,${a})`,
    keyframe: 'goldDrift', yMin: 35,
  },
  sacred_space: {
    count: 64, sizeMin: 1, sizeMax: 3.5,
    durMin: 2, durMax: 5, delayMax: 6,
    alphaMin: 0.25, alphaMax: 0.75,
    color: (a: number) => `rgba(255,255,255,${a})`,
    keyframe: 'glimmerPulse', yMin: 0,
  },
} as const;

type GlimmerMode = keyof typeof GLIMMER_CONFIGS;

function generateParticles(mode: GlimmerMode) {
  const cfg = GLIMMER_CONFIGS[mode];
  return Array.from({ length: cfg.count }, (_, i) => {
    const size = cfg.sizeMin + Math.random() * (cfg.sizeMax - cfg.sizeMin);
    const x = Math.random() * 100;
    const y = cfg.yMin + Math.random() * (100 - cfg.yMin);
    const dur = (cfg.durMin + Math.random() * (cfg.durMax - cfg.durMin)).toFixed(2);
    const delay = (Math.random() * cfg.delayMax).toFixed(2);
    const alpha = (cfg.alphaMin + Math.random() * (cfg.alphaMax - cfg.alphaMin)).toFixed(2);
    const dx = (Math.random() * 40 - 20).toFixed(1);
    return { key: `${mode}-${i}`, size, x, y, dur, delay, alpha, dx, color: cfg.color(+alpha), keyframe: cfg.keyframe };
  });
}

/**
 * GlimmerLayer — fixed-position particle background.
 * Reads `glimmerMode` from AnimationProvider context.
 * Place once inside <CodexPortalShell>, BEFORE page content.
 *
 * <GlimmerLayer />
 */
export function GlimmerLayer() {
  const { glimmerMode, reducedMotion } = useAnimation();
  const [particles, setParticles] = useState(() => generateParticles(glimmerMode));
  const [transitioning, setTransitioning] = useState(false);
  const prevMode = useRef(glimmerMode);

  useEffect(() => {
    if (glimmerMode === prevMode.current) return;
    prevMode.current = glimmerMode;
    setTransitioning(true);
    const timer = setTimeout(() => {
      setParticles(generateParticles(glimmerMode));
      setTransitioning(false);
    }, 650);
    return () => clearTimeout(timer);
  }, [glimmerMode]);

  if (reducedMotion) return null;

  return (
    <div
      className="lc-glimmer-layer"
      style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
        transition: 'opacity 600ms ease',
        opacity: transitioning ? 0 : 1,
      }}
    >
      {particles.map(p => (
        <div
          key={p.key}
          style={{
            position: 'absolute',
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            borderRadius: '50%',
            background: p.color,
            pointerEvents: 'none',
            ['--dx' as string]: `${p.dx}px`,
            animation: `${p.keyframe} ${p.dur}s ease-in-out ${p.delay}s infinite`,
            opacity: 0,
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
        />
      ))}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// 2. GLASS CARD — the universal surface
// ═══════════════════════════════════════════════════════════════

interface GlassCardProps {
  variant?: 'default' | 'elevated' | 'sacred' | 'insight' | 'void';
  breathe?: boolean;
  glow?: boolean;
  glowColor?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler;
  'data-animate'?: string;
  'data-animate-delay'?: string;
}

/**
 * GlassCard — glassmorphic card with hover lift, press scale,
 * optional breathing animation, and insight glow variant.
 *
 * <GlassCard variant="insight" breathe>...</GlassCard>
 */
export function GlassCard({
  variant = 'default', breathe = false, glow = false, glowColor,
  className = '', style, children, onClick, ...rest
}: GlassCardProps) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: 'rgba(255,255,255,0.28)',
      borderColor: 'rgba(255,255,255,0.52)',
    },
    elevated: {
      background: 'rgba(255,255,255,0.32)',
      borderColor: 'rgba(184,151,106,0.3)',
    },
    sacred: {
      background: 'rgba(255,255,255,0.85)',
      borderColor: 'rgba(184,123,101,0.2)',
    },
    insight: {
      background: 'linear-gradient(135deg, rgba(184,123,101,0.07), rgba(184,151,106,0.04))',
      borderColor: 'rgba(184,123,101,0.16)',
    },
    void: {
      background: 'rgba(236,228,218,0.45)',
      borderColor: 'rgba(200,188,174,0.3)',
    },
  };

  const hoverShadow = variant === 'insight'
    ? '0 1px 0 rgba(255,255,255,0.9) inset, 0 16px 48px rgba(0,0,0,0.08), 0 0 40px rgba(184,123,101,0.07)'
    : '0 1px 0 rgba(255,255,255,0.9) inset, 0 16px 48px rgba(0,0,0,0.08)';

  return (
    <div
      className={`lc-glass-card ${className}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      onClick={onClick}
      style={{
        backdropFilter: `blur(${TOKENS.BLUR_GLASS}px) saturate(1.4)`,
        WebkitBackdropFilter: `blur(${TOKENS.BLUR_GLASS}px) saturate(1.4)`,
        border: '1px solid',
        borderRadius: 18,
        boxShadow: hover
          ? hoverShadow
          : '0 1px 0 rgba(255,255,255,0.9) inset, 0 8px 32px rgba(0,0,0,0.04)',
        transition: `background ${TOKENS.DUR_MEDIUM}ms ${TOKENS.EASE_IN_OUT}, transform ${TOKENS.DUR_MEDIUM}ms ${TOKENS.EASE_OUT}, box-shadow ${TOKENS.DUR_MEDIUM}ms ${TOKENS.EASE_IN_OUT}, border-color ${TOKENS.DUR_MEDIUM}ms ${TOKENS.EASE_IN_OUT}`,
        willChange: 'transform',
        transform: active
          ? `scale(${TOKENS.SCALE_PRESS}) translateY(0)`
          : hover
            ? `translateY(${TOKENS.LIFT_CARD}px)`
            : 'translateY(0)',
        cursor: onClick ? 'pointer' : undefined,
        ...(breathe ? { animation: `breatheGlow ${TOKENS.DUR_BREATH}ms ease-in-out infinite` } : {}),
        ...(glow && glowColor ? { boxShadow: `0 0 32px ${glowColor}` } : {}),
        ...variantStyles[variant],
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// 3. MIRROR CARD — the emotional anchor on dashboard
// ═══════════════════════════════════════════════════════════════

interface MirrorCardProps {
  quote: string;
  attribution?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * MirrorCard — breathing glass card with floating radial glow,
 * quote mark drift on hover, and continuous gentle pulse.
 *
 * <MirrorCard quote="You are already becoming." attribution="Aoede" />
 */
export function MirrorCard({ quote, attribution, className = '', children }: MirrorCardProps) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className={`lc-mirror-card ${className}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', overflow: 'hidden',
        background: 'rgba(255,255,255,0.28)',
        backdropFilter: 'blur(18px) saturate(1.4)',
        border: '1px solid rgba(255,255,255,0.52)',
        borderRadius: 18, padding: '28px 30px',
        animation: 'breatheGlow 5000ms ease-in-out infinite',
        willChange: 'transform, box-shadow',
      }}
    >
      {/* Floating radial glow */}
      <div style={{
        position: 'absolute',
        top: hover ? -20 : -40,
        right: hover ? -20 : -40,
        width: hover ? 200 : 150,
        height: hover ? 200 : 150,
        borderRadius: '50%',
        background: hover
          ? 'radial-gradient(circle, rgba(184,123,101,0.2), transparent 70%)'
          : 'radial-gradient(circle, rgba(184,123,101,0.12), transparent 70%)',
        transition: 'all 700ms cubic-bezier(0.0,0.0,0.2,1.0)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      {/* Quote mark */}
      <div style={{
        fontFamily: "'Cormorant Garamond',serif",
        fontSize: 48, fontWeight: 300, lineHeight: 1,
        color: 'rgba(184,123,101,0.25)',
        transition: 'transform 600ms cubic-bezier(0.0,0.0,0.2,1.0), opacity 600ms ease',
        transform: hover ? 'translateY(-3px) translateX(-2px)' : 'translateY(0)',
        opacity: hover ? 0.55 : 0.35,
        position: 'relative', zIndex: 1,
        userSelect: 'none',
      }}>
        &ldquo;
      </div>
      {/* Quote text */}
      <div style={{
        fontFamily: "'Cormorant Garamond',serif",
        fontSize: 18, fontWeight: 300, fontStyle: 'italic',
        color: '#221E1A', lineHeight: 1.65,
        position: 'relative', zIndex: 1,
        marginTop: -8,
      }}>
        {quote}
      </div>
      {attribution && (
        <div style={{
          fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: '#9A948D', marginTop: 12,
          position: 'relative', zIndex: 1,
        }}>
          — {attribution}
        </div>
      )}
      {children && <div style={{ position: 'relative', zIndex: 1, marginTop: 16 }}>{children}</div>}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// 4. PROGRESS BAR — animated fill with shimmer
// ═══════════════════════════════════════════════════════════════

interface ProgressBarProps {
  percent: number;
  color?: string;
  height?: number;
  delay?: number;
  label?: string;
}

/**
 * ProgressBar — animates on scroll into view, adds shimmer after fill.
 *
 * <ProgressBar percent={38} color="var(--lc-rose)" label="Integration" />
 */
export function ProgressBar({ percent, color = '#B87B65', height = 2, delay = 400, label }: ProgressBarProps) {
  const { ref, current, shimmer } = useProgressFill(percent, { delayMs: delay });

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginBottom: 6,
          fontSize: 11, letterSpacing: '0.08em', color: '#9A948D',
        }}>
          <span>{label}</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{current}%</span>
        </div>
      )}
      <div
        ref={ref}
        style={{
          height, borderRadius: height,
          background: 'rgba(200,188,174,0.25)',
          overflow: 'hidden', position: 'relative',
        }}
      >
        <div style={{
          height: '100%', borderRadius: height,
          background: color,
          width: `${current}%`,
          transition: `width ${TOKENS.DUR_PHASE}ms ${TOKENS.EASE_UNFURL}`,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Shimmer sweep after fill */}
          {shimmer && (
            <span style={{
              position: 'absolute', top: 0, left: 0,
              width: '45%', height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
              animation: 'barShimmer 1.6s cubic-bezier(0.4,0,0.2,1) 0.2s both',
              pointerEvents: 'none', borderRadius: 'inherit',
            }} />
          )}
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// 5. WAVEFORM BARS — Voice Vault visualizer
// ═══════════════════════════════════════════════════════════════

interface WaveformBarsProps {
  bars?: number[];
  state?: 'idle' | 'recording' | 'playback';
  barCount?: number;
}

const IDLE_HEIGHTS = [6,10,18,26,20,14,22,16,8,24,18,12,20,10,16,28,18,8,14,22];

/**
 * WaveformBars — 3-state waveform visualizer.
 * Pass `bars` from useWaveform() for live audio, or let idle animation run.
 *
 * <WaveformBars state="recording" bars={waveform.bars} />
 */
export function WaveformBars({ bars, state = 'idle', barCount = 20 }: WaveformBarsProps) {
  const heights = bars || IDLE_HEIGHTS.slice(0, barCount);

  const colorMap = {
    idle:      'rgba(184,123,101,0.28)',
    recording: 'rgba(184,123,101,0.7)',
    playback:  'rgba(125,142,127,0.5)',
  };

  const animMap = {
    idle:      (i: number, h: number) => `waveIdle ${(0.9 + Math.random() * 0.5).toFixed(2)}s ease-in-out ${(i * 0.06).toFixed(2)}s infinite`,
    recording: (i: number, h: number) => `waveActive ${(0.3 + Math.random() * 0.35).toFixed(2)}s ease-in-out ${(i * 0.04).toFixed(2)}s infinite`,
    playback:  (i: number, h: number) => `wavePulse ${(0.6 + Math.random() * 0.4).toFixed(2)}s ease-in-out ${(i * 0.05).toFixed(2)}s infinite`,
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 2, overflow: 'hidden', height: 36,
    }}>
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            width: 3, borderRadius: 3, flexShrink: 0,
            background: colorMap[state],
            ['--wave-h' as string]: `${h}px`,
            animation: state !== 'recording' || !bars
              ? animMap[state](i, h)
              : undefined,
            height: state === 'recording' && bars ? h : 4,
            transition: state === 'recording' && bars ? 'height 80ms ease' : undefined,
          }}
        />
      ))}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// 6. CONSTELLATION SVG — My Journey / Archetype card
// ═══════════════════════════════════════════════════════════════

interface ConstellationProps {
  stars?: Array<{ cx: number; cy: number; r: number; color: string }>;
  lines?: Array<{ x1: number; y1: number; x2: number; y2: number; color: string }>;
  size?: number;
}

const DEFAULT_STARS = [
  { cx: 65, cy: 18, r: 2.5, color: 'rgba(184,123,101,0.5)' },
  { cx: 98, cy: 38, r: 2,   color: 'rgba(184,123,101,0.3)' },
  { cx: 92, cy: 78, r: 3,   color: 'rgba(184,151,106,0.5)' },
  { cx: 38, cy: 78, r: 2,   color: 'rgba(125,142,127,0.5)' },
  { cx: 32, cy: 38, r: 1.5, color: 'rgba(139,123,168,0.4)' },
];

const DEFAULT_LINES = [
  { x1: 65, y1: 21, x2: 65, y2: 61, color: 'rgba(184,123,101,0.18)' },
  { x1: 95, y1: 40, x2: 69, y2: 61, color: 'rgba(184,123,101,0.12)' },
  { x1: 89, y1: 75, x2: 68, y2: 67, color: 'rgba(184,151,106,0.18)' },
  { x1: 41, y1: 75, x2: 62, y2: 67, color: 'rgba(125,142,127,0.18)' },
  { x1: 35, y1: 40, x2: 61, y2: 61, color: 'rgba(139,123,168,0.12)' },
];

/**
 * Constellation — slowly orbiting, twinkling archetype constellation.
 *
 * <Constellation size={130} />
 */
export function Constellation({ stars = DEFAULT_STARS, lines = DEFAULT_LINES, size = 130 }: ConstellationProps) {
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      {/* Orbit ring */}
      <g style={{ animation: 'constellationOrbit 40s linear infinite', transformOrigin: 'center' }}>
        <circle cx={size/2} cy={size/2} r={size * 0.35} fill="none" stroke="rgba(200,188,174,0.18)" strokeWidth="0.5" />
      </g>
      {/* Center orb */}
      <g style={{ animation: 'breatheSlow 5s ease-in-out infinite' }}>
        <circle cx={size/2} cy={size/2} r={4} fill="rgba(184,123,101,0.7)" />
      </g>
      {/* Connection lines */}
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke={l.color} strokeWidth="0.5"
          style={{
            animation: `connectionPulse 4s ease-in-out ${(i * 0.4).toFixed(1)}s infinite`,
          }}
        />
      ))}
      {/* Stars */}
      {stars.map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.color}
          style={{
            animation: `starTwinkle ${(2.5 + i * 0.4).toFixed(1)}s ease-in-out ${(i * 0.5).toFixed(1)}s infinite`,
          }}
        />
      ))}
    </svg>
  );
}


// ═══════════════════════════════════════════════════════════════
// 7. BUTTON — primary with shimmer sweep
// ═══════════════════════════════════════════════════════════════

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  children: React.ReactNode;
}

/**
 * AnimatedButton — with shimmer sweep on hover, press scale, lift.
 *
 * <AnimatedButton variant="primary" onClick={...}>Begin</AnimatedButton>
 */
export function AnimatedButton({ variant = 'primary', children, style, ...props }: AnimatedButtonProps) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const isPrimary = variant === 'primary';

  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{
        position: 'relative', overflow: 'hidden',
        transition: `background ${TOKENS.DUR_MEDIUM}ms ${TOKENS.EASE_IN_OUT}, transform ${TOKENS.DUR_MEDIUM}ms ${TOKENS.EASE_OUT}, box-shadow ${TOKENS.DUR_MEDIUM}ms ${TOKENS.EASE_IN_OUT}`,
        transform: active
          ? `scale(${TOKENS.SCALE_PRESS})`
          : hover
            ? `translateY(${TOKENS.LIFT_BTN}px)`
            : 'none',
        boxShadow: hover && isPrimary ? '0 6px 20px rgba(184,123,101,0.14)' : 'none',
        ...style,
      }}
      {...props}
    >
      {/* Shimmer sweep */}
      {isPrimary && (
        <span style={{
          position: 'absolute', top: 0, left: hover ? '150%' : '-100%',
          width: '100%', height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
          transition: `left 550ms ${TOKENS.EASE_IN_OUT}`,
          pointerEvents: 'none',
        }} />
      )}
      {children}
    </button>
  );
}


// ═══════════════════════════════════════════════════════════════
// 8. WRITE CURSOR — Journal Bridge blinking cursor
// ═══════════════════════════════════════════════════════════════

/**
 * WriteCursor — rose-colored blinking cursor for the journal writing area.
 *
 * <WriteCursor />
 */
export function WriteCursor() {
  return (
    <span style={{
      display: 'inline-block',
      width: 1.5, height: 18,
      background: '#B87B65',
      opacity: 0.75,
      animation: 'cursorBlink 1.1s step-end infinite',
      verticalAlign: 'middle',
      marginLeft: 1,
      borderRadius: 1,
    }} />
  );
}


// ═══════════════════════════════════════════════════════════════
// 9. SESSION INSIGHT — conversation mid-thread callout
// ═══════════════════════════════════════════════════════════════

interface SessionInsightProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * SessionInsight — surfaces from below with a drawing left border.
 *
 * <SessionInsight>Your pattern of seeking clarity before action...</SessionInsight>
 */
export function SessionInsight({ children, className = '' }: SessionInsightProps) {
  return (
    <div
      className={className}
      style={{
        animation: 'insightSurface 500ms cubic-bezier(0.16,1,0.3,1) both',
        position: 'relative',
        paddingLeft: 16,
      }}
    >
      {/* Self-drawing left border */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 2, borderRadius: 2,
        background: 'linear-gradient(180deg, rgba(184,123,101,0.7), transparent)',
        animation: 'timelineLineGrow 600ms cubic-bezier(0.16,1,0.3,1) 300ms both',
      }} />
      {children}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// 10. SACRED SPACE CARD — selectable space with unique glow
// ═══════════════════════════════════════════════════════════════

interface SpaceCardProps {
  space: 'cosmic-field' | 'sacred-fire' | 'deep-ocean' | 'ancient-grove';
  selected?: boolean;
  locked?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

const SPACE_GLOWS: Record<string, string> = {
  'cosmic-field': 'rgba(100,80,200,0.3)',
  'sacred-fire':  'rgba(200,80,40,0.3)',
  'deep-ocean':   'rgba(40,100,180,0.3)',
  'ancient-grove':'rgba(60,120,60,0.3)',
};

/**
 * SpaceCard — sacred space selector with unique glow per space,
 * selection pulse, and locked shimmer hint.
 */
export function SpaceCard({ space, selected = false, locked = false, children, onClick }: SpaceCardProps) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => !locked && onClick?.()}
      style={{
        transition: `border-color ${TOKENS.DUR_MEDIUM}ms ${TOKENS.EASE_IN_OUT}, box-shadow ${TOKENS.DUR_MEDIUM}ms ${TOKENS.EASE_IN_OUT}, transform ${TOKENS.DUR_MEDIUM}ms ${TOKENS.EASE_OUT}`,
        transform: !locked && hover ? 'scale(1.04)' : 'none',
        boxShadow: hover && !locked
          ? `0 0 20px ${SPACE_GLOWS[space] || 'rgba(184,123,101,0.2)'}, inset 0 1px 0 rgba(255,255,255,0.1)`
          : undefined,
        animation: selected ? 'spaceCardGlow 2.5s ease-in-out infinite' : undefined,
        borderColor: selected ? 'rgba(184,123,101,0.7)' : undefined,
        cursor: locked ? 'default' : 'pointer',
        position: 'relative', overflow: 'hidden',
        opacity: locked ? 0.55 : 1,
      }}
    >
      {children}
      {/* Locked shimmer hint */}
      {locked && hover && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
          animation: 'shimmerSweep 1.3s cubic-bezier(0.4,0,0.2,1) both',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// 11. TIMELINE DOT — My Journey milestone
// ═══════════════════════════════════════════════════════════════

interface TimelineDotProps {
  index: number;
  color?: string;
  size?: number;
  children?: React.ReactNode;
}

/**
 * TimelineDot — pops in with spring easing, staggered by index.
 */
export function TimelineDot({ index, color = '#B87B65', size = 12, children }: TimelineDotProps) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color,
      animation: `timelineDotPop 400ms ${TOKENS.EASE_SPRING} ${index * 120}ms both`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {children}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// 12. PAGE TRANSITION WRAPPER
// ═══════════════════════════════════════════════════════════════

interface PageTransitionProps {
  direction?: 'deeper' | 'surface';
  children: React.ReactNode;
}

/**
 * PageTransition — wraps page content for enter/exit animations.
 * Use `deeper` when navigating into a sub-page, `surface` when coming back.
 *
 * <PageTransition direction="deeper">
 *   <CodexDashboard />
 * </PageTransition>
 */
export function PageTransition({ direction = 'deeper', children }: PageTransitionProps) {
  const anim = direction === 'deeper'
    ? `fadeUp 550ms ${TOKENS.EASE_OUT} both`
    : `fadeDown 550ms ${TOKENS.EASE_OUT} both`;

  return (
    <div style={{ animation: anim }}>
      {children}
    </div>
  );
}
