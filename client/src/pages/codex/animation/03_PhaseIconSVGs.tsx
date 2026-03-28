/**
 * LIVING CODEX — PhaseIconSVGs.tsx
 * ═══════════════════════════════════════════════════════════════
 * Complete SVG icon set for the Nine Thresholds
 * with animation-ready CSS class names for animation-engine.js
 *
 * Each SVG has semantic class names that the PHASE_ANIMATIONS
 * in animation-engine.js targets for hover enter/leave.
 *
 * Usage:
 *   import { PhaseIconSVG } from './03_PhaseIconSVGs'
 *   <div data-phase-icon="1"><PhaseIconSVG phase={1} /></div>
 *
 * The data-phase-icon attribute is what initPhaseIcons() hooks onto.
 * ═══════════════════════════════════════════════════════════════
 */

import React from 'react';

interface PhaseIconProps {
  size?: number;
  color?: string;
}

// ═══════════════════════════════════════════════════════════════
// 1. THRESHOLD — Two pillars forming a doorway
//    Animatable elements: .door-l, .door-r, .threshold-light
// ═══════════════════════════════════════════════════════════════

export function ThresholdSVG({ size = 32, color = 'currentColor' }: PhaseIconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" width={size} height={size}>
      {/* Left pillar */}
      <line className="door-l" x1="10" y1="5" x2="10" y2="27"
        stroke={color} strokeWidth="2.2" strokeLinecap="round"
        style={{ transition: 'transform 0.5s cubic-bezier(0.0,0.0,0.2,1.0)', transformOrigin: '10px 16px' }} />
      {/* Right pillar */}
      <line className="door-r" x1="22" y1="5" x2="22" y2="27"
        stroke={color} strokeWidth="2.2" strokeLinecap="round"
        style={{ transition: 'transform 0.5s cubic-bezier(0.0,0.0,0.2,1.0)', transformOrigin: '22px 16px' }} />
      {/* Lintel */}
      <line x1="10" y1="5" x2="22" y2="5"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" opacity={0.6} />
      {/* Sacred light column — hidden until hover */}
      <line className="threshold-light" x1="16" y1="8" x2="16" y2="24"
        stroke="#B8976A" strokeWidth="1.2" strokeLinecap="round"
        strokeDasharray="1.5 3" opacity={0}
        style={{ transition: 'opacity 0.5s ease 0.2s' }} />
      {/* Light particles (static — animate via JS if desired) */}
      <circle className="threshold-light" cx="16" cy="18" r="0.8" fill="#B8976A" opacity={0} />
      <circle className="threshold-light" cx="15" cy="13" r="0.6" fill="#B8976A" opacity={0} />
      <circle className="threshold-light" cx="17" cy="10" r="0.7" fill="#B8976A" opacity={0} />
    </svg>
  );
}


// ═══════════════════════════════════════════════════════════════
// 2. DESCENT — Spiral tightening inward
//    Animatable: .spiral
// ═══════════════════════════════════════════════════════════════

export function DescentSVG({ size = 32, color = 'currentColor' }: PhaseIconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" width={size} height={size}>
      <g className="spiral" style={{ transformOrigin: '16px 16px' }}>
        <path d="M16 5 C23 5 27 9 27 16 C27 23 23 27 16 27 C9 27 7 23 7 18 C7 13 10 11 13.5 11 C17 11 19 13 19 16 C19 19 17.5 20 16 20"
          stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity={0.7} />
      </g>
      {/* Center gravitational point */}
      <circle cx="16" cy="16" r="1.5" fill={color} opacity={0.5} />
    </svg>
  );
}


// ═══════════════════════════════════════════════════════════════
// 3. NAMING — Calligraphic "N" letterform
//    Animatable: .name-stroke (multiple paths)
// ═══════════════════════════════════════════════════════════════

export function NamingSVG({ size = 32, color = 'currentColor' }: PhaseIconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" width={size} height={size}>
      {/* Baseline guide */}
      <line x1="7" y1="24" x2="25" y2="24"
        stroke={color} strokeWidth="0.6" opacity={0.15} />
      {/* "N" stroke segments — each draws independently */}
      <path className="name-stroke" d="M10 24 L10 8"
        stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path className="name-stroke" d="M10 8 L22 24"
        stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path className="name-stroke" d="M22 24 L22 8"
        stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}


// ═══════════════════════════════════════════════════════════════
// 4. MIRROR — Face above reflection line
//    Animatable: .mirror-ripple
// ═══════════════════════════════════════════════════════════════

export function MirrorSVG({ size = 32, color = 'currentColor' }: PhaseIconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" width={size} height={size}>
      {/* Mirror surface */}
      <line x1="6" y1="16" x2="26" y2="16"
        stroke={color} strokeWidth="0.8" strokeDasharray="2 2" opacity={0.4} />
      {/* Upper figure */}
      <circle cx="16" cy="10.5" r="3.5"
        stroke={color} strokeWidth="1.5" fill="none" opacity={0.7} />
      {/* Lower reflection (dashed, compressed) */}
      <ellipse cx="16" cy="21.5" rx="3.5" ry="3"
        stroke={color} strokeWidth="1" strokeDasharray="1.5 2" fill="none" opacity={0.25} />
      {/* Ripple ring — animation target */}
      <circle className="mirror-ripple" cx="16" cy="16" r="6"
        stroke="#B87B65" strokeWidth="1" fill="none" opacity={0} />
    </svg>
  );
}


// ═══════════════════════════════════════════════════════════════
// 5. VOID — Concentric circles with expanding center
//    Animatable: .void-center, .void-ring-outer
// ═══════════════════════════════════════════════════════════════

export function VoidSVG({ size = 32, color = 'currentColor' }: PhaseIconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" width={size} height={size}>
      {/* Outer ring */}
      <circle className="void-ring-outer" cx="16" cy="16" r="10"
        stroke={color} strokeWidth="1.2" fill="none" opacity={0.2} />
      {/* Middle ring */}
      <circle cx="16" cy="16" r="6.5"
        stroke={color} strokeWidth="1" fill="none" opacity={0.3} />
      {/* Inner ring */}
      <circle cx="16" cy="16" r="3.5"
        stroke={color} strokeWidth="0.8" fill="none" opacity={0.4} />
      {/* Center — expands into nothing, contracts into being */}
      <circle className="void-center" cx="16" cy="16" r="3"
        fill={color} opacity={0.35} />
    </svg>
  );
}


// ═══════════════════════════════════════════════════════════════
// 6. EMBER — Three flame shapes
//    Animatable: .flame-1, .flame-2, .flame-3, .ember-glow
// ═══════════════════════════════════════════════════════════════

export function EmberSVG({ size = 32, color = 'currentColor' }: PhaseIconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" width={size} height={size}>
      {/* Background glow */}
      <circle className="ember-glow" cx="16" cy="20" r="8"
        fill="#B87B65" opacity={0.08} />
      {/* Outer flame */}
      <path className="flame-1"
        d="M16 24 C13 24 10 21 10 18 C10 14 13 9 16 6 C16 6 15 14 18 15 C20 16 22 13 22 11 C22 11 25 15 25 19 C25 22 21 24 19 24"
        stroke={color} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity={0.45}
        style={{ transformOrigin: '16px 24px' }} />
      {/* Middle flame */}
      <path className="flame-2"
        d="M16 24 C14 24 12 22 12 19 C12 16 14 12 16 9 C16 9 16 15 18 16 C19.5 17 20.5 15 20.5 13 C20.5 13 22.5 16 22.5 19 C22.5 22 19.5 24 17 24"
        stroke="#B8976A" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity={0.55}
        style={{ transformOrigin: '16px 24px' }} />
      {/* Inner core */}
      <ellipse className="flame-3" cx="16" cy="21" rx="2" ry="1.5"
        fill="#B87B65" opacity={0.4}
        style={{ transformOrigin: '16px 21px' }} />
    </svg>
  );
}


// ═══════════════════════════════════════════════════════════════
// 7. INTEGRATION — Three weaving threads
//    Animatable: .thread-1, .thread-2, .thread-3
// ═══════════════════════════════════════════════════════════════

export function IntegrationSVG({ size = 32, color = 'currentColor' }: PhaseIconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" width={size} height={size}>
      {/* Thread 1 — stone */}
      <path className="thread-1"
        d="M14 7 C14 10 18 12 18 16 C18 20 14 22 14 25"
        stroke="#9A948D" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity={0.5}
        style={{ transformOrigin: '16px 16px' }} />
      {/* Thread 2 — clay */}
      <path className="thread-2"
        d="M16 7 C16 10 12 12 12 16 C12 20 16 22 16 25"
        stroke="#B87B65" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity={0.5}
        style={{ transformOrigin: '16px 16px' }} />
      {/* Thread 3 — gold */}
      <path className="thread-3"
        d="M18 7 C18 10 14 12 14 16 C14 20 18 22 18 25"
        stroke="#B8976A" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity={0.5}
        style={{ transformOrigin: '16px 16px' }} />
      {/* Horizontal guide */}
      <line x1="8" y1="16" x2="24" y2="16"
        stroke={color} strokeWidth="0.5" strokeDasharray="2 3" opacity={0.12} />
    </svg>
  );
}


// ═══════════════════════════════════════════════════════════════
// 8. EMBODIMENT — Figure with roots and crown
//    Animatable: .root-path (multiple), .crown-path
// ═══════════════════════════════════════════════════════════════

export function EmbodimentSVG({ size = 32, color = 'currentColor' }: PhaseIconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" width={size} height={size}>
      {/* Crown */}
      <path className="crown-path"
        d="M11 7 C11 3 14 1.5 16 5 C18 1.5 21 3 21 7"
        stroke="#B8976A" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity={0.5} />
      {/* Head */}
      <circle cx="16" cy="9" r="3"
        stroke={color} strokeWidth="1.5" fill="none" opacity={0.65} />
      {/* Spine */}
      <line x1="16" y1="12" x2="16" y2="19"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity={0.6} />
      {/* Left root */}
      <path className="root-path" d="M16 19 C14 21 11 23 9 26"
        stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity={0.5} />
      {/* Center root */}
      <path className="root-path" d="M16 19 L16 27"
        stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity={0.5} />
      {/* Right root */}
      <path className="root-path" d="M16 19 C18 21 21 23 23 26"
        stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity={0.5} />
    </svg>
  );
}


// ═══════════════════════════════════════════════════════════════
// 9. OFFERING — Sun with eight rays
//    Animatable: .ray (multiple)
// ═══════════════════════════════════════════════════════════════

export function OfferingSVG({ size = 32, color = 'currentColor' }: PhaseIconProps) {
  const rays = 8;
  const innerR = 5.5;
  const outerR = 11;

  return (
    <svg viewBox="0 0 32 32" fill="none" width={size} height={size}>
      {/* Central glow */}
      <circle cx="16" cy="16" r="5" fill="#B8976A" opacity={0.05} />
      {/* Sun core */}
      <circle cx="16" cy="16" r="4.5"
        stroke={color} strokeWidth="1.5" fill="none" opacity={0.5} />
      {/* Rays */}
      {Array.from({ length: rays }, (_, i) => {
        const angle = (i / rays) * Math.PI * 2 - Math.PI / 2;
        const x1 = 16 + Math.cos(angle) * innerR;
        const y1 = 16 + Math.sin(angle) * innerR;
        const x2 = 16 + Math.cos(angle) * outerR;
        const y2 = 16 + Math.sin(angle) * outerR;
        return (
          <line key={i} className="ray"
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity={0.45}
            style={{ transformOrigin: 'center' }} />
        );
      })}
    </svg>
  );
}


// ═══════════════════════════════════════════════════════════════
// ICON MAP — get any phase icon by number
// ═══════════════════════════════════════════════════════════════

const PHASE_ICON_MAP: Record<number, React.FC<PhaseIconProps>> = {
  1: ThresholdSVG,
  2: DescentSVG,
  3: NamingSVG,
  4: MirrorSVG,
  5: VoidSVG,
  6: EmberSVG,
  7: IntegrationSVG,
  8: EmbodimentSVG,
  9: OfferingSVG,
};

/**
 * PhaseIconSVG — renders the correct icon for any phase number.
 * Wrap in a div with data-phase-icon={n} for animation-engine.js hooks.
 *
 * <div data-phase-icon="6">
 *   <PhaseIconSVG phase={6} size={34} />
 * </div>
 */
export function PhaseIconSVG({ phase, ...props }: { phase: number } & PhaseIconProps) {
  const Icon = PHASE_ICON_MAP[phase];
  return Icon ? <Icon {...props} /> : null;
}

export default PhaseIconSVG;
