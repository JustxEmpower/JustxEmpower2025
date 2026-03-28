/**
 * LIVING CODEX — HolographicSystem.tsx
 * ═══════════════════════════════════════════════════════════════
 * The dark world. The holographic mode components.
 *
 * When a user enters holographic mode (AI Guide), the entire
 * visual system transforms: light → dark, white particles → gold,
 * glass → obsidian, the portrait breathes, scan lines sweep.
 *
 * This file provides:
 *   - HolographicBackground (aurora + dark canvas)
 *   - HolographicPortrait (breathing frame + scan line + glow ring)
 *   - HolographicSurface (dark glass card variant)
 *   - HolographicInputBar (guide input with mic ring)
 *   - useHolographicTransition() hook
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAnimation, TOKENS } from './01_AnimationEngine';


// ═══════════════════════════════════════════════════════════════
// 1. HOLOGRAPHIC BACKGROUND — aurora gradient canvas
// ═══════════════════════════════════════════════════════════════

interface HoloBgProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * HolographicBackground — the dark world canvas.
 * Wraps the entire AI Guide viewport when in holographic mode.
 * Aurora gradient shifts slowly. Children float on top.
 *
 * <HolographicBackground>
 *   <HolographicPortrait ... />
 *   <ConversationThread ... />
 * </HolographicBackground>
 */
export function HolographicBackground({ children, className = '' }: HoloBgProps) {
  const { holoActive } = useAnimation();

  return (
    <div
      className={`lc-holo-bg ${className}`}
      style={{
        background: holoActive
          ? 'linear-gradient(170deg, #1A1510 0%, #1E1A14 50%, #16120E 100%)'
          : 'linear-gradient(158deg, #EDE5D8 0%, #E8E0D2 60%, #EAE2D5 100%)',
        backgroundSize: holoActive ? '200% 200%' : undefined,
        animation: holoActive ? 'auroraShift 12s ease-in-out infinite' : undefined,
        transition: 'background 600ms cubic-bezier(0.4,0,0.2,1)',
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      {children}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// 2. HOLOGRAPHIC PORTRAIT — breathing frame + scan line
// ═══════════════════════════════════════════════════════════════

interface HoloPortraitProps {
  src: string;
  alt?: string;
  size?: number;
  shape?: 'circle' | 'rounded';
  children?: React.ReactNode;
}

/**
 * HolographicPortrait — the guide's face, alive in the dark.
 * Breathes gently, has a holographic glow ring, and a subtle
 * CRT-style scan line sweeping down.
 *
 * <HolographicPortrait src="/guides/aoede.jpg" size={180} />
 */
export function HolographicPortrait({ src, alt = 'Guide', size = 160, shape = 'circle', children }: HoloPortraitProps) {
  const { holoActive } = useAnimation();
  const borderRadius = shape === 'circle' ? '50%' : 20;

  return (
    <div style={{
      position: 'relative',
      width: size, height: size,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Glow ring — only in holo mode */}
      {holoActive && (
        <div style={{
          position: 'absolute', inset: -8,
          borderRadius, border: '1px solid rgba(184,123,101,0.0)',
          animation: 'holoGlow 4s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* Portrait frame */}
      <div
        className="lc-guide-frame"
        style={{
          width: size, height: size, borderRadius,
          overflow: 'hidden', position: 'relative',
          animation: holoActive ? 'holoGlow 5s ease-in-out 1s infinite' : undefined,
          transition: 'box-shadow 600ms cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* The portrait image */}
        <img
          src={src}
          alt={alt}
          className="lc-guide-portrait"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            animation: holoActive ? 'portraitBreath 6s ease-in-out infinite' : undefined,
            willChange: holoActive ? 'transform, filter' : undefined,
          }}
        />

        {/* Scan line — CRT warmth */}
        {holoActive && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
            height: '20%', top: '-20%',
            animation: 'scanLine 8s linear infinite',
            pointerEvents: 'none', zIndex: 3,
          }} />
        )}
      </div>

      {children}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// 3. HOLOGRAPHIC SURFACE — dark glass card
// ═══════════════════════════════════════════════════════════════

interface HoloSurfaceProps {
  children: React.ReactNode;
  glow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * HolographicSurface — the dark-mode glass card used inside
 * the holographic AI Guide view. Replaces GlassCard in dark world.
 *
 * <HolographicSurface glow>
 *   <p>Guide response here...</p>
 * </HolographicSurface>
 */
export function HolographicSurface({ children, glow = false, className = '', style }: HoloSurfaceProps) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className={className}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(28px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.2)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        boxShadow: glow
          ? '0 0 40px rgba(184,123,101,0.08), inset 0 1px 0 rgba(255,255,255,0.04)'
          : 'inset 0 1px 0 rgba(255,255,255,0.04)',
        transition: `background ${TOKENS.DUR_MEDIUM}ms ${TOKENS.EASE_IN_OUT}, box-shadow ${TOKENS.DUR_MEDIUM}ms ${TOKENS.EASE_IN_OUT}, transform ${TOKENS.DUR_MEDIUM}ms ${TOKENS.EASE_OUT}`,
        transform: hover ? `translateY(${TOKENS.LIFT_CARD}px)` : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// 4. HOLOGRAPHIC INPUT BAR — guide text input + mic ring
// ═══════════════════════════════════════════════════════════════

interface HoloInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  onMicToggle?: () => void;
  recording?: boolean;
  placeholder?: string;
}

/**
 * HolographicInputBar — dark-mode input field with the mic ring
 * that pulses when recording.
 *
 * <HolographicInputBar
 *   value={msg} onChange={setMsg} onSend={send}
 *   onMicToggle={toggleMic} recording={isRecording}
 * />
 */
export function HolographicInputBar({
  value, onChange, onSend, onMicToggle, recording = false,
  placeholder = 'Speak or type...',
}: HoloInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(20px)',
      border: `1px solid ${focused ? 'rgba(184,123,101,0.3)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 14, padding: '10px 16px',
      transition: `background ${TOKENS.DUR_MEDIUM}ms ${TOKENS.EASE_IN_OUT}, border-color ${TOKENS.DUR_MEDIUM}ms ${TOKENS.EASE_IN_OUT}`,
    }}>
      {/* Mic ring */}
      {onMicToggle && (
        <button
          onClick={onMicToggle}
          style={{
            width: 38, height: 38, borderRadius: '50%',
            border: `1.5px solid ${recording ? 'rgba(184,123,101,0.6)' : 'rgba(255,255,255,0.12)'}`,
            background: recording ? 'rgba(184,123,101,0.16)' : 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            transition: `transform ${TOKENS.DUR_MEDIUM}ms ${TOKENS.EASE_SPRING}, background ${TOKENS.DUR_MEDIUM}ms ${TOKENS.EASE_IN_OUT}, box-shadow ${TOKENS.DUR_MEDIUM}ms ${TOKENS.EASE_IN_OUT}`,
            animation: recording ? 'spaceCardGlow 1.2s ease-in-out infinite' : undefined,
          }}
        >
          {/* Mic icon */}
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke={recording ? '#B87B65' : 'rgba(255,255,255,0.5)'} strokeWidth="2" strokeLinecap="round">
            <rect x="9" y="2" width="6" height="11" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </button>
      )}

      {/* Input field */}
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={e => { if (e.key === 'Enter' && value.trim()) onSend(); }}
        placeholder={placeholder}
        style={{
          flex: 1, border: 'none', outline: 'none',
          background: 'transparent',
          color: 'rgba(230,215,195,0.9)',
          fontFamily: "'DM Sans',system-ui,sans-serif",
          fontSize: 14,
        }}
      />

      {/* Send button */}
      <button
        onClick={() => value.trim() && onSend()}
        disabled={!value.trim()}
        style={{
          width: 34, height: 34, borderRadius: '50%',
          border: 'none',
          background: value.trim() ? 'rgba(184,123,101,0.25)' : 'rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: value.trim() ? 'pointer' : 'default',
          transition: `background ${TOKENS.DUR_FAST}ms ${TOKENS.EASE_IN_OUT}, transform ${TOKENS.DUR_FAST}ms ${TOKENS.EASE_OUT}`,
          transform: value.trim() ? 'scale(1)' : 'scale(0.9)',
          opacity: value.trim() ? 1 : 0.4,
        }}
      >
        <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="rgba(230,215,195,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// 5. HOLOGRAPHIC TRANSITION OVERLAY
// ═══════════════════════════════════════════════════════════════

/**
 * HolographicOverlay — fixed overlay that flashes during enter/exit.
 * Place once at root level, reads state from AnimationProvider.
 *
 * <HolographicOverlay />
 */
export function HolographicOverlay() {
  // The CSS for lc-holo-entering / lc-holo-exiting is injected
  // by the AnimationEngine's keyframe injection.
  // This component exists as a reminder — the overlay is actually
  // rendered via body::before pseudo-element in the CSS.
  return null;
}


// ═══════════════════════════════════════════════════════════════
// 6. PAGE TRANSITION CONTROLLER — route-aware
// ═══════════════════════════════════════════════════════════════

const ROUTE_DEPTH: Record<string, number> = {
  '/dashboard':       0,
  '/codex-scroll':    1,
  '/voice-vault':     1,
  '/journal-bridge':  1,
  '/my-journey':      1,
  '/conversations':   1,
  '/ai-guide':        2,
};

/**
 * usePageTransition — handles animated route changes.
 * Returns { navigateTo, TransitionWrapper }.
 *
 * const { navigateTo, contentRef } = usePageTransition();
 * navigateTo('/codex-scroll', () => router.push('/codex-scroll'));
 */
export function usePageTransition() {
  const [animClass, setAnimClass] = useState('');
  const currentRoute = useRef('/dashboard');
  const busy = useRef(false);

  const navigateTo = useCallback(async (
    targetRoute: string,
    loadFn: () => void | Promise<void>
  ) => {
    if (busy.current) return;
    busy.current = true;

    const goingDeep = (ROUTE_DEPTH[targetRoute] ?? 0) >= (ROUTE_DEPTH[currentRoute.current] ?? 0);

    // Exit
    setAnimClass(`pageExit 320ms ${TOKENS.EASE_RECEDE} both`);
    await new Promise(r => setTimeout(r, 280));

    // Load
    await loadFn();

    // Enter
    setAnimClass(goingDeep
      ? `fadeUp 550ms ${TOKENS.EASE_OUT} both`
      : `fadeDown 550ms ${TOKENS.EASE_OUT} both`
    );

    currentRoute.current = targetRoute;
    busy.current = false;
  }, []);

  return { navigateTo, animStyle: animClass ? { animation: animClass } as React.CSSProperties : {} };
}


// ═══════════════════════════════════════════════════════════════
// 7. VOICE ORB — voice card animated orb
// ═══════════════════════════════════════════════════════════════

interface VoiceOrbProps {
  color: string;
  selected?: boolean;
  previewing?: boolean;
  size?: number;
}

/**
 * VoiceOrb — colored orb for voice selection cards.
 * Pulses when selected, ripples when previewing audio.
 *
 * <VoiceOrb color="#B87B65" selected previewing={false} />
 */
export function VoiceOrb({ color, selected = false, previewing = false, size = 36 }: VoiceOrbProps) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, position: 'relative', overflow: 'hidden',
      transition: `transform ${TOKENS.DUR_MEDIUM}ms ${TOKENS.EASE_SPRING}`,
      animation: selected
        ? 'glimmerPulse 3s ease-in-out infinite'
        : previewing
          ? 'mirrorRipple 0.8s cubic-bezier(0.0,0.0,0.2,1.0) infinite'
          : undefined,
    }}>
      {/* Specular highlight */}
      <div style={{
        position: 'absolute', top: 3, left: 5,
        width: 10, height: 6, borderRadius: '50%',
        background: 'rgba(255,255,255,0.38)',
        transform: 'rotate(-30deg)',
        transition: `opacity ${TOKENS.DUR_MEDIUM}ms ease`,
      }} />
    </div>
  );
}
