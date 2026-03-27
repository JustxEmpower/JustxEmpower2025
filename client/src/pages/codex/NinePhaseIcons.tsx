import { useState, useRef, useEffect, useCallback } from "react";

/*
 * NinePhaseIcons — Living Codex™ Phase Icon System
 *
 * Each icon is a philosophical SVG animation — not decoration.
 * The symbol IS the meaning. The hover IS the experience.
 *
 * Props:
 *   currentPhase: number (1-9)
 *   completedPhases: number[]
 *   pathway: string
 *   onPhaseClick?: (phase: number) => void
 */

// ═══════════════════════════════════════════════════════════════════
// PALETTE
// ═══════════════════════════════════════════════════════════════════
const P = {
  clay:     "#B87B65",
  gold:     "#B8976A",
  sage:     "#7D8E7F",
  stone:    "#9A948D",
  parch:    "#EDE5D8",
  ink:      "#221E1A",
  muted:    "#C9BFB2",
  warm:     "rgba(184,123,101,0.08)",
  warmBord: "rgba(184,123,101,0.5)",
  doneBg:   "rgba(125,142,127,0.08)",
  doneBord: "rgba(125,142,127,0.4)",
  lockBg:   "rgba(255,255,255,0.15)",
  lockBord: "rgba(200,188,174,0.22)",
  orbBg:    "rgba(255,255,255,0.30)",
  orbBord:  "rgba(200,188,174,0.38)",
};

// ═══════════════════════════════════════════════════════════════════
// HOOK: useHover
// ═══════════════════════════════════════════════════════════════════
function useHover() {
  const [hovered, setHovered] = useState(false);
  const enterTime = useRef(0);
  const onEnter = useCallback(() => { enterTime.current = performance.now(); setHovered(true); }, []);
  const onLeave = useCallback(() => setHovered(false), []);
  return { hovered, enterTime, onEnter, onLeave };
}

// ═══════════════════════════════════════════════════════════════════
// HOOK: useAnimationFrame
// ═══════════════════════════════════════════════════════════════════
function useAnimationFrame(callback: (t: number) => void, active: boolean) {
  const ref = useRef<number>();
  useEffect(() => {
    if (!active) { if (ref.current) cancelAnimationFrame(ref.current); return; }
    const loop = (t: number) => { callback(t); ref.current = requestAnimationFrame(loop); };
    ref.current = requestAnimationFrame(loop);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [active, callback]);
}

// ═══════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════
const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));
const ease = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
const sin = Math.sin;
const cos = Math.cos;
const PI = Math.PI;

// ═══════════════════════════════════════════════════════════════════
// PHASE DATA
// ═══════════════════════════════════════════════════════════════════
const PHASES = [
  { num: 1, name: "Threshold", desc: "The doorway between who you were told you are and who you have always been. You step through once." },
  { num: 2, name: "Descent",   desc: "The spiral inward. Going down is not falling — it is the only path to the root." },
  { num: 3, name: "Naming",    desc: "The moment language finds what has lived wordless inside you. The word is a key." },
  { num: 4, name: "Mirror",    desc: "Seeing yourself clearly — perhaps for the first time. Through your own eyes, finally trusted." },
  { num: 5, name: "Void",      desc: "The fertile emptiness before form. Not absence — pure potential." },
  { num: 6, name: "Ember",     desc: "The small, surviving fire. It does not need to roar to matter. From this ember, everything after is lit." },
  { num: 7, name: "Integration", desc: "Shadow and gift, wound and strength — no longer at war, but braided into wholeness." },
  { num: 8, name: "Embodiment", desc: "Rooted below, open above. Not a concept you hold — a truth you have become." },
  { num: 9, name: "Offering",  desc: "Her specific light, forged by her specific fire. This is what the whole journey was for." },
];

interface IconProps {
  hovered: boolean;
  t: number;
}

// ═══════════════════════════════════════════════════════════════════
// 1. THRESHOLD
// ═══════════════════════════════════════════════════════════════════
function ThresholdIcon({ hovered, t }: IconProps) {
  const h = hovered ? Math.min(1, (performance.now() - t) / 600) : 0;
  const spread = ease(h) * 3.5;
  const lightOp = ease(Math.max(0, (h - 0.3) / 0.7));
  const breath = sin(performance.now() / 2000) * 0.3;
  const particles = [0, 1, 2, 3, 4].map(i => {
    const py = hovered ? ((performance.now() / 800 + i * 0.25) % 1) : 0.5;
    const px = sin(py * PI * 2 + i) * 1.2;
    return { x: 16 + px, y: 24 - py * 18, op: lightOp * sin(py * PI) * 0.7 };
  });

  return (
    <svg viewBox="0 0 32 32" fill="none" style={{ width: 34, height: 34 }}>
      <line x1={10 - spread} y1="5" x2={10 - spread} y2="27"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <line x1={22 + spread} y1="5" x2={22 + spread} y2="27"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <line x1={10 - spread} y1="5" x2={22 + spread} y2="5"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity={0.6} />
      <line x1="16" y1="8" x2="16" y2="24"
        stroke={P.gold} strokeWidth={1.2 + breath * 0.3}
        strokeLinecap="round" strokeDasharray="1.5 3"
        opacity={lightOp * 0.8} />
      {particles.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={0.8} fill={P.gold} opacity={p.op} />
      ))}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 2. DESCENT
// ═══════════════════════════════════════════════════════════════════
function DescentIcon({ hovered, t }: IconProps) {
  const elapsed = hovered ? (performance.now() - t) / 1000 : 0;
  const rot = hovered ? elapsed * 45 : 0;
  const centerR = hovered ? 1.5 + sin(elapsed * 3) * 0.8 : 1.5;
  const breath = sin(performance.now() / 2400) * 0.5;
  const pull = hovered ? Math.min(1, elapsed / 0.8) : 0;

  return (
    <svg viewBox="0 0 32 32" fill="none" style={{ width: 34, height: 34 }}>
      <g style={{ transformOrigin: "16px 16px", transform: `rotate(${rot}deg)` }}>
        <path d="M16 5 C23 5 27 9 27 16 C27 23 23 27 16 27 C9 27 7 23 7 18 C7 13 10 11 13.5 11 C17 11 19 13 19 16 C19 19 17.5 20 16 20"
          stroke="currentColor" strokeWidth={1.6 + breath * 0.2}
          strokeLinecap="round" fill="none"
          opacity={0.7 + pull * 0.3} />
        {hovered && (
          <path d="M16 20 C15 20 14.5 19 14.5 18 C14.5 17 15 16.5 16 16.5"
            stroke={P.clay} strokeWidth="1.3" strokeLinecap="round" fill="none"
            opacity={ease(pull) * 0.8}
            strokeDasharray="8"
            strokeDashoffset={8 - ease(pull) * 8} />
        )}
      </g>
      <circle cx="16" cy={16 + pull * 1.5} r={centerR}
        fill="currentColor" opacity={0.5 + pull * 0.3} />
      {hovered && [0,1,2].map(i => (
        <circle key={i} cx="16" cy={16 + pull * 1.5}
          r={centerR + 2 + i * 2.5 + sin(elapsed * 2 + i) * 0.5}
          stroke="currentColor" strokeWidth="0.5" fill="none"
          opacity={0.15 - i * 0.04} />
      ))}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 3. NAMING
// ═══════════════════════════════════════════════════════════════════
function NamingIcon({ hovered, t }: IconProps) {
  const elapsed = hovered ? (performance.now() - t) / 1000 : 0;
  const draw = hovered ? Math.min(1, elapsed / 1.0) : 0;
  const d = ease(draw);
  const breath = sin(performance.now() / 2000) * 0.4;
  const pathLen = 48;
  const offset = pathLen - d * pathLen;
  const drops = hovered && d > 0.6;

  return (
    <svg viewBox="0 0 32 32" fill="none" style={{ width: 34, height: 34 }}>
      <line x1="7" y1="24" x2="25" y2="24"
        stroke="currentColor" strokeWidth="0.6" opacity={0.15 + breath * 0.05} />
      <path d="M10 24 L10 8 L22 24 L22 8"
        stroke="currentColor" strokeWidth={2 + breath * 0.2}
        strokeLinecap="round" strokeLinejoin="round" fill="none"
        strokeDasharray={pathLen}
        strokeDashoffset={offset}
        opacity={0.4 + d * 0.5} />
      {drops && [0,1,2].map(i => {
        const angle = (elapsed * 3 + i * 2.1) % (PI * 2);
        const dist = 1.5 + sin(elapsed * 5 + i) * 0.8;
        return (
          <circle key={i}
            cx={22 + cos(angle) * dist} cy={8 + sin(angle) * dist}
            r={0.6} fill={P.gold} opacity={0.4 - i * 0.1} />
        );
      })}
      {hovered && d < 1 && (
        <circle cx={lerp(10, 22, d)} cy={lerp(24, 8, d > 0.5 ? (d-0.5)*2 : 0)}
          r="2.5" fill={P.clay} opacity={0.15 + sin(elapsed * 6) * 0.08} />
      )}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 4. MIRROR
// ═══════════════════════════════════════════════════════════════════
function MirrorIcon({ hovered, t }: IconProps) {
  const elapsed = hovered ? (performance.now() - t) / 1000 : 0;
  const h = hovered ? Math.min(1, elapsed / 0.5) : 0;
  const breath = sin(performance.now() / 2200) * 0.3;
  const ripples = hovered ? [0, 1, 2].map(i => {
    const age = (elapsed - i * 0.3);
    if (age < 0) return null;
    const progress = (age % 2) / 2;
    return { r: 2 + progress * 14, op: (1 - progress) * 0.35 };
  }).filter(Boolean) as { r: number; op: number }[] : [];

  return (
    <svg viewBox="0 0 32 32" fill="none" style={{ width: 34, height: 34 }}>
      <line x1="6" y1="16" x2="26" y2="16"
        stroke="currentColor" strokeWidth={0.8 + h * 0.4}
        strokeDasharray={hovered ? "none" : "2 2"} opacity={0.4 + h * 0.3} />
      <circle cx="16" cy="10.5" r={3.5 + breath * 0.15}
        stroke="currentColor" strokeWidth="1.5" fill="none" opacity={0.7} />
      <path d="M14 7.5 C14 6 18 6 18 7.5"
        stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" opacity={0.35} />
      <ellipse cx="16" cy={21.5 + breath * 0.2} rx="3.5" ry={3 - breath * 0.1}
        stroke="currentColor" strokeWidth="1"
        strokeDasharray="1.5 2" fill="none" opacity={0.25 + h * 0.15} />
      {ripples.map((rip, i) => (
        <ellipse key={i} cx="16" cy="16" rx={rip.r} ry={rip.r * 0.35}
          stroke={P.clay} strokeWidth="0.8" fill="none" opacity={rip.op} />
      ))}
      {hovered && h > 0.7 && (
        <line x1="6" y1="16" x2="26" y2="16"
          stroke={P.gold} strokeWidth="1.5" opacity={(h - 0.7) / 0.3 * 0.3} />
      )}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 5. VOID
// ═══════════════════════════════════════════════════════════════════
function VoidIcon({ hovered, t }: IconProps) {
  const elapsed = hovered ? (performance.now() - t) / 1000 : 0;
  const breath = sin(performance.now() / 2600) * 0.4;
  const pulse = hovered ? sin(elapsed * 2.5) : 0;
  const centerR = hovered ? 2 + pulse * 6 : 2;
  const centerOp = hovered ? 0.3 + (1 - Math.abs(pulse)) * 0.2 : 0.35;
  const rings = [10, 6.5, 3.5].map((r, i) => ({
    r: r + (hovered ? -pulse * (1.5 - i * 0.4) : breath * (0.3 - i * 0.1)),
    op: 0.2 + i * 0.1 + (hovered ? sin(elapsed * 2 + i) * 0.1 : 0),
  }));

  return (
    <svg viewBox="0 0 32 32" fill="none" style={{ width: 34, height: 34 }}>
      {rings.map((ring, i) => (
        <circle key={i} cx="16" cy="16" r={ring.r}
          stroke="currentColor" strokeWidth={1.2 - i * 0.2} fill="none"
          opacity={ring.op} />
      ))}
      <circle cx="16" cy="16" r={Math.max(0.5, centerR)}
        fill="currentColor" opacity={centerOp} />
      {hovered && pulse > 0.3 && [0,1,2,3,4,5].map(i => {
        const angle = (i / 6) * PI * 2 + elapsed;
        const dist = centerR * 0.8;
        return (
          <circle key={i}
            cx={16 + cos(angle) * dist}
            cy={16 + sin(angle) * dist}
            r={0.5} fill="currentColor" opacity={pulse * 0.3} />
        );
      })}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 6. EMBER
// ═══════════════════════════════════════════════════════════════════
function EmberIcon({ hovered, t }: IconProps) {
  const elapsed = hovered ? (performance.now() - t) / 1000 : 0;
  const breath = sin(performance.now() / 2000) * 0.3;
  const f1 = hovered ? sin(elapsed * 4.2) : breath;
  const f2 = hovered ? sin(elapsed * 5.7 + 1) : breath * 0.7;
  const f3 = hovered ? sin(elapsed * 3.3 + 2) : breath * 0.5;
  const glow = hovered ? 0.15 + sin(elapsed * 2) * 0.08 : 0;

  return (
    <svg viewBox="0 0 32 32" fill="none" style={{ width: 34, height: 34 }}>
      <circle cx="16" cy="20" r="8" fill={P.clay} opacity={glow} />
      <path d={`M16 ${24 + f3 * 0.5} C13 ${24 + f3} 10 ${21 + f3} 10 ${18 + f3 * 0.5} C10 14 13 ${9 + f3} 16 ${6 + f3 * 2} C16 ${6 + f3 * 2} 15 ${14 - f1} 18 ${15 + f1} C20 ${16 + f2} 22 ${13 - f2} 22 ${11 + f1} C22 ${11 + f1} 25 ${15 + f3} 25 ${19 + f3 * 0.5} C25 ${22 + f3} 21 ${24 + f3} 19 ${24 + f3 * 0.5}`}
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"
        opacity={0.45 + (hovered ? 0.2 : 0)} />
      <path d={`M16 ${24 + f2 * 0.3} C14 ${24 + f2 * 0.3} 12 ${22 - f2 * 0.5} 12 ${19 + f2 * 0.3} C12 ${16 + f1} 14 ${12 + f1} 16 ${9 + f2} C16 ${9 + f2} 16 ${15 - f2} 18 ${16 + f1} C19.5 ${17 + f2} 20.5 ${15 - f1} 20.5 ${13 + f2} C20.5 ${13 + f2} 22.5 ${16 + f1} 22.5 ${19 + f2 * 0.3} C22.5 ${22 - f2 * 0.5} 19.5 ${24 + f2 * 0.3} 17 ${24 + f2 * 0.3}`}
        stroke={P.gold} strokeWidth="1.6" strokeLinecap="round"
        fill={hovered ? "rgba(184,123,101,0.06)" : "none"}
        opacity={0.55 + (hovered ? 0.25 : 0)} />
      <ellipse cx="16" cy={21 + f1 * 0.3} rx={2 + f2 * 0.3} ry={1.5 + f1 * 0.2}
        fill={P.clay} opacity={0.4 + (hovered ? 0.3 + sin(elapsed * 6) * 0.1 : 0)} />
      {hovered && [0,1,2].map(i => {
        const age = (elapsed * 1.5 + i * 0.8) % 2;
        if (age > 1.2) return null;
        return (
          <circle key={i}
            cx={16 + sin(elapsed * 3 + i * 2) * 3}
            cy={12 - age * 8}
            r={0.5} fill={P.gold}
            opacity={Math.max(0, 0.6 - age * 0.5)} />
        );
      })}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 7. INTEGRATION
// ═══════════════════════════════════════════════════════════════════
function IntegrationIcon({ hovered, t }: IconProps) {
  const elapsed = hovered ? (performance.now() - t) / 1000 : 0;
  const breath = sin(performance.now() / 2400) * 0.3;
  const amp = hovered ? Math.min(1, elapsed / 0.6) * 3 : breath;
  const colors = [P.stone, P.clay, P.gold];
  const offsets = [0, PI * 0.67, PI * 1.33];

  const threads = colors.map((color, i) => {
    const points: string[] = [];
    for (let y = 7; y <= 25; y += 0.5) {
      const progress = (y - 7) / 18;
      const wave = sin(progress * PI * 3 + elapsed * 3 + offsets[i]) * amp;
      points.push(`${16 + wave},${y}`);
    }
    return { color, d: `M${points.join(" L")}`, op: 0.5 + (hovered ? 0.3 : 0) };
  });

  const meetY = 16 + sin(elapsed * 2) * (hovered ? 2 : 0);

  return (
    <svg viewBox="0 0 32 32" fill="none" style={{ width: 34, height: 34 }}>
      {threads.map((th, i) => (
        <path key={i} d={th.d}
          stroke={th.color} strokeWidth="1.6" strokeLinecap="round" fill="none"
          opacity={th.op} />
      ))}
      {hovered && (
        <circle cx="16" cy={meetY} r={2 + sin(elapsed * 4) * 0.5}
          fill={P.clay} opacity={0.12} />
      )}
      <line x1="8" y1="16" x2="24" y2="16"
        stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 3" opacity={0.12} />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 8. EMBODIMENT
// ═══════════════════════════════════════════════════════════════════
function EmbodimentIcon({ hovered, t }: IconProps) {
  const elapsed = hovered ? (performance.now() - t) / 1000 : 0;
  const h = hovered ? Math.min(1, elapsed / 1.0) : 0;
  const d = ease(h);
  const breath = sin(performance.now() / 2200) * 0.3;
  const rootDraw = d;
  const crownDraw = Math.max(0, (d - 0.3) / 0.7);
  const crownGlow = hovered ? sin(elapsed * 2) * 0.15 + 0.1 : 0;

  return (
    <svg viewBox="0 0 32 32" fill="none" style={{ width: 34, height: 34 }}>
      <path d="M11 7 C11 3 14 1.5 16 5 C18 1.5 21 3 21 7"
        stroke={P.gold} strokeWidth="1.4" strokeLinecap="round" fill="none"
        strokeDasharray="20" strokeDashoffset={20 - crownDraw * 20}
        opacity={0.5 + crownDraw * 0.4} />
      <circle cx="16" cy="4" r="3" fill={P.gold} opacity={crownGlow} />
      <circle cx="16" cy={9 + breath * 0.15} r="3"
        stroke="currentColor" strokeWidth="1.5" fill="none" opacity={0.65} />
      <line x1="16" y1="12" x2="16" y2="19"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={0.6} />
      <path d="M16 19 C14 21 11 23 9 26"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"
        strokeDasharray="14" strokeDashoffset={14 - rootDraw * 14} opacity={0.5 + rootDraw * 0.3} />
      <path d="M16 19 L16 27"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"
        strokeDasharray="10" strokeDashoffset={10 - rootDraw * 10} opacity={0.5 + rootDraw * 0.3} />
      <path d="M16 19 C18 21 21 23 23 26"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"
        strokeDasharray="14" strokeDashoffset={14 - rootDraw * 14} opacity={0.5 + rootDraw * 0.3} />
      {hovered && rootDraw > 0.8 && (
        <>
          <path d="M9 26 C8 27 7 28 6.5 29" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity={0.25} />
          <path d="M23 26 C24 27 25 28 25.5 29" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity={0.25} />
        </>
      )}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 9. OFFERING
// ═══════════════════════════════════════════════════════════════════
function OfferingIcon({ hovered, t }: IconProps) {
  const elapsed = hovered ? (performance.now() - t) / 1000 : 0;
  const breath = sin(performance.now() / 2000) * 0.3;
  const rays = 8;
  const rayData = Array.from({ length: rays }, (_, i) => {
    const angle = (i / rays) * PI * 2 - PI / 2;
    const phase = hovered ? (elapsed * 1.5 - i * 0.12) : 0;
    const pulse = hovered ? Math.max(0, sin(phase * PI * 2)) : 0;
    const innerR = 5.5;
    const outerR = 10 + pulse * 4 + breath;
    return {
      x1: 16 + cos(angle) * innerR,
      y1: 16 + sin(angle) * innerR,
      x2: 16 + cos(angle) * outerR,
      y2: 16 + sin(angle) * outerR,
      op: 0.3 + pulse * 0.5,
      width: 1.3 + pulse * 0.5,
    };
  });

  const glowR = hovered ? 6 + sin(elapsed * 2) * 1.5 : 5;
  const glowOp = hovered ? 0.12 + sin(elapsed * 1.5) * 0.05 : 0.05;

  return (
    <svg viewBox="0 0 32 32" fill="none" style={{ width: 34, height: 34 }}>
      <circle cx="16" cy="16" r={glowR} fill={P.gold} opacity={glowOp} />
      <circle cx="16" cy="16" r={4.5 + breath * 0.2}
        stroke="currentColor" strokeWidth="1.5" fill="none"
        opacity={0.5 + (hovered ? 0.2 : 0)} />
      {rayData.map((ray, i) => (
        <line key={i} x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2}
          stroke="currentColor" strokeWidth={ray.width}
          strokeLinecap="round" opacity={ray.op} />
      ))}
      {hovered && [0,1].map(i => (
        <circle key={i} cx="16" cy="16"
          r={14 + i * 2 + sin(elapsed * 2 + i) * 1}
          stroke={P.gold} strokeWidth="0.5" fill="none"
          opacity={0.08 - i * 0.03} />
      ))}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ICON COMPONENTS MAP
// ═══════════════════════════════════════════════════════════════════
const ICON_COMPONENTS = [
  ThresholdIcon, DescentIcon, NamingIcon, MirrorIcon, VoidIcon,
  EmberIcon, IntegrationIcon, EmbodimentIcon, OfferingIcon,
];

// ═══════════════════════════════════════════════════════════════════
// SINGLE PHASE CELL
// ═══════════════════════════════════════════════════════════════════
interface PhaseCellProps {
  phase: typeof PHASES[number];
  index: number;
  status: "done" | "active" | "locked" | "default";
  onClick?: (num: number) => void;
}

function PhaseCell({ phase, index, status, onClick }: PhaseCellProps) {
  const { hovered, enterTime, onEnter, onLeave } = useHover();
  const IconComponent = ICON_COMPONENTS[index];
  const [, forceUpdate] = useState(0);

  const needsAnimation = hovered || status === "active";
  useAnimationFrame(
    useCallback(() => forceUpdate(n => n + 1), []),
    needsAnimation
  );

  useEffect(() => {
    let frame: number;
    const interval = setInterval(() => { frame = requestAnimationFrame(() => forceUpdate(n => n + 1)); }, 66);
    return () => { clearInterval(interval); cancelAnimationFrame(frame); };
  }, []);

  const isDone = status === "done";
  const isActive = status === "active";
  const isLocked = status === "locked";

  const orbBg = isDone ? P.doneBg : isActive ? P.warm : isLocked ? P.lockBg : P.orbBg;
  const orbBorder = isDone ? P.doneBord : isActive ? P.warmBord : isLocked ? P.lockBord : P.orbBord;
  const textColor = isDone ? P.sage : isActive ? P.clay : P.stone;

  const lift = hovered && !isLocked ? -5 : 0;
  const scale = hovered && !isLocked ? 1.08 : 1;
  const shadow = hovered && !isLocked ? "0 12px 32px rgba(0,0,0,0.12)" : "none";

  const activePulse = isActive ? sin(performance.now() / 1200) * 0.08 + 0.08 : 0;

  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={() => !isLocked && onClick?.(phase.num)}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 10, cursor: isLocked ? "default" : "pointer",
        flex: 1, position: "relative",
      }}
    >
      {/* Tooltip */}
      <div style={{
        position: "absolute", bottom: "calc(100% + 14px)", left: "50%",
        transform: `translateX(-50%) translateY(${hovered ? 0 : 8}px)`,
        background: "rgba(34,30,26,0.90)", backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14,
        padding: "12px 16px", minWidth: 170, maxWidth: 210,
        pointerEvents: "none", opacity: hovered ? 1 : 0,
        transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)", zIndex: 100,
      }}>
        <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(184,123,101,0.8)", marginBottom: 5 }}>
          Phase {phase.num}
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontWeight: 300, color: "rgba(230,215,195,0.95)", marginBottom: 5, fontStyle: "italic" }}>
          {phase.name}
        </div>
        <div style={{ fontSize: 11, color: "rgba(154,148,141,0.9)", lineHeight: 1.55 }}>
          {phase.desc}
        </div>
        <div style={{
          position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
          borderTop: "6px solid rgba(34,30,26,0.90)",
        }} />
      </div>

      {/* Orb */}
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "visible",
        background: orbBg, border: `1.5px solid ${orbBorder}`,
        color: textColor,
        transform: `translateY(${lift}px) scale(${scale})`,
        boxShadow: `${shadow}${isActive ? `, 0 0 0 ${4 + activePulse * 20}px rgba(184,123,101,${activePulse})` : ""}`,
        transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1), box-shadow 0.4s ease, background 0.3s, border-color 0.3s",
        opacity: isLocked ? 0.5 : 1,
      }}>
        <IconComponent hovered={hovered && !isLocked} t={enterTime.current} />
      </div>

      {/* Phase number */}
      <div style={{ fontSize: 10, letterSpacing: "0.12em", color: P.stone, fontWeight: 500 }}>
        {phase.num}.
      </div>

      {/* Phase name */}
      <div style={{
        fontFamily: "'Cormorant Garamond',serif", fontSize: 13, fontWeight: isActive ? 400 : 300,
        color: textColor, textAlign: "center", lineHeight: 1.3,
        transition: "color 0.3s",
      }}>
        {phase.name}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
interface NinePhaseIconsProps {
  currentPhase?: number;
  completedPhases?: number[];
  pathway?: string;
  onPhaseClick?: (phase: number) => void;
}

export default function NinePhaseIcons({
  currentPhase = 2,
  completedPhases = [1],
  pathway = "The Sovereign",
  onPhaseClick,
}: NinePhaseIconsProps) {
  const getStatus = (num: number): "done" | "active" | "locked" | "default" => {
    if (completedPhases.includes(num)) return "done";
    if (num === currentPhase) return "active";
    if (num > currentPhase) return "locked";
    return "default";
  };

  const progressPct = ((currentPhase - 1) / 8) * 100;

  return (
    <div style={{
      background: "rgba(255,255,255,0.15)",
      backdropFilter: "blur(40px) saturate(1.3)",
      WebkitBackdropFilter: "blur(40px) saturate(1.3)",
      border: "1px solid rgba(255,255,255,0.25)",
      boxShadow: "0 1px 0 rgba(255,255,255,0.4) inset, 0 8px 32px rgba(0,0,0,0.03)",
      padding: "44px 40px 48px", position: "relative", overflow: "hidden",
      borderRadius: "var(--cx-radius-lg, 20px)",
      marginBottom: "2rem",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{
          fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 300, color: P.ink,
          marginBottom: 6,
        }}>
          Your Journey Through the Nine Phases
        </div>
      </div>

      {/* Track */}
      <div style={{ position: "relative", marginBottom: 44 }}>
        {/* Connector line */}
        <div style={{
          position: "absolute", top: 36, left: 36, right: 36,
          height: 1, background: "rgba(200,188,174,0.35)", zIndex: 0,
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, height: "100%",
            background: `linear-gradient(90deg, rgba(125,142,127,0.5), rgba(184,123,101,0.4))`,
            width: `${progressPct}%`, transition: "width 1s ease",
          }} />
        </div>

        {/* Icons */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          position: "relative", zIndex: 1,
        }}>
          {PHASES.map((phase, i) => (
            <PhaseCell
              key={phase.num}
              phase={phase}
              index={i}
              status={getStatus(phase.num)}
              onClick={onPhaseClick}
            />
          ))}
        </div>
      </div>

      {/* Current path */}
      <div style={{
        textAlign: "center",
        fontFamily: "'Cormorant Garamond',serif",
        fontSize: 15, fontStyle: "italic", fontWeight: 300, color: P.stone,
      }}>
        Current path: <em style={{ color: P.clay }}>{pathway}</em>
      </div>
    </div>
  );
}
