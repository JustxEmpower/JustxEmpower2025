/**
 * HOLOGRAPHIC BACKGROUNDS — Doc 04 Implementation
 * =================================================
 * Background selector system for the holographic avatar experience.
 * 8 standard CSS-only backgrounds + 4 phase-locked backgrounds.
 * FAB button + selector panel + crossfade transitions.
 */

import React, { useState, useEffect, useCallback } from 'react';

// ── Background Configuration Types ─────────────────────────────────

interface BackgroundLayer {
  type: 'gradient' | 'overlay';
  css: string;
  animation?: string;
  opacity?: number;
}

interface ParticleConfig {
  count: number;
  color: string;
  speed: number;
  type: 'dust' | 'stars' | 'embers' | 'bubbles' | 'fireflies' | 'geometry';
}

export interface BackgroundConfig {
  id: string;
  name: string;
  layers: BackgroundLayer[];
  ambientColor: string;
  particleConfig?: ParticleConfig;
  locked?: boolean;
  unlockCondition?: string;
}

// ── Standard Backgrounds (Always Available) ─────────────────────────

const STANDARD_BACKGROUNDS: BackgroundConfig[] = [
  {
    id: 'void',
    name: 'The Void',
    layers: [
      { type: 'gradient', css: 'radial-gradient(ellipse at 50% 50%, #0A0A12 0%, #000 100%)' },
      { type: 'overlay', css: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.01) 0%, transparent 50%)', animation: 'bg-breathe 8s ease-in-out infinite' },
    ],
    ambientColor: '#ffffff',
  },
  {
    id: 'temple',
    name: 'Sacred Temple',
    layers: [
      { type: 'gradient', css: 'radial-gradient(ellipse at 50% 80%, #2A1810 0%, #0A0504 100%)' },
      { type: 'overlay', css: 'radial-gradient(circle at 50% 30%, rgba(196,162,101,0.08) 0%, transparent 60%)', animation: 'bg-breathe 6s ease-in-out infinite' },
      { type: 'overlay', css: 'radial-gradient(circle at 30% 60%, rgba(196,162,101,0.04) 0%, transparent 40%)', animation: 'bg-breathe 8s ease-in-out infinite 2s' },
    ],
    ambientColor: '#C4A265',
    particleConfig: { count: 200, color: '#FFD700', speed: 0.3, type: 'embers' },
  },
  {
    id: 'cosmos',
    name: 'Cosmic Field',
    layers: [
      { type: 'gradient', css: 'radial-gradient(ellipse at 40% 30%, #1A1040 0%, #060818 60%, #000 100%)' },
      { type: 'overlay', css: 'radial-gradient(circle at 60% 40%, rgba(100,60,180,0.06) 0%, transparent 50%)', animation: 'bg-drift 12s ease-in-out infinite' },
      { type: 'overlay', css: 'radial-gradient(circle at 30% 70%, rgba(60,100,200,0.04) 0%, transparent 40%)', animation: 'bg-drift 16s ease-in-out infinite 4s' },
    ],
    ambientColor: '#7B68EE',
    particleConfig: { count: 300, color: '#aaccff', speed: 0.1, type: 'stars' },
  },
  {
    id: 'forest',
    name: 'Ancient Grove',
    layers: [
      { type: 'gradient', css: 'radial-gradient(ellipse at 50% 90%, #0A1A0A 0%, #040A04 100%)' },
      { type: 'overlay', css: 'radial-gradient(circle at 40% 30%, rgba(100,200,100,0.04) 0%, transparent 50%)', animation: 'bg-breathe 7s ease-in-out infinite' },
      { type: 'overlay', css: 'radial-gradient(circle at 70% 60%, rgba(80,180,120,0.03) 0%, transparent 40%)', animation: 'bg-breathe 10s ease-in-out infinite 3s' },
    ],
    ambientColor: '#7CB342',
    particleConfig: { count: 150, color: '#90EE90', speed: 0.2, type: 'fireflies' },
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    layers: [
      { type: 'gradient', css: 'radial-gradient(ellipse at 50% 20%, #0A1A2A 0%, #040810 100%)' },
      { type: 'overlay', css: 'radial-gradient(circle at 50% 10%, rgba(80,160,220,0.06) 0%, transparent 60%)', animation: 'bg-caustic 5s ease-in-out infinite' },
      { type: 'overlay', css: 'radial-gradient(circle at 30% 50%, rgba(60,120,180,0.03) 0%, transparent 50%)', animation: 'bg-caustic 8s ease-in-out infinite 2s' },
    ],
    ambientColor: '#5B8DB8',
    particleConfig: { count: 100, color: '#87CEEB', speed: 0.15, type: 'bubbles' },
  },
  {
    id: 'fire',
    name: 'Sacred Fire',
    layers: [
      { type: 'gradient', css: 'radial-gradient(ellipse at 50% 95%, #2A1008 0%, #0A0400 60%, #000 100%)' },
      { type: 'overlay', css: 'radial-gradient(circle at 50% 85%, rgba(255,120,30,0.08) 0%, transparent 50%)', animation: 'bg-flicker 3s ease-in-out infinite' },
      { type: 'overlay', css: 'radial-gradient(circle at 45% 80%, rgba(255,80,20,0.04) 0%, transparent 40%)', animation: 'bg-flicker 4s ease-in-out infinite 1s' },
    ],
    ambientColor: '#E67E22',
    particleConfig: { count: 250, color: '#FF6B35', speed: 0.5, type: 'embers' },
  },
  {
    id: 'nebula',
    name: 'Rose Nebula',
    layers: [
      { type: 'gradient', css: 'radial-gradient(ellipse at 40% 40%, #2A1020 0%, #0A0408 60%, #000 100%)' },
      { type: 'overlay', css: 'radial-gradient(circle at 55% 35%, rgba(200,100,160,0.06) 0%, transparent 50%)', animation: 'bg-drift 10s ease-in-out infinite' },
      { type: 'overlay', css: 'radial-gradient(circle at 35% 65%, rgba(196,162,101,0.04) 0%, transparent 45%)', animation: 'bg-drift 14s ease-in-out infinite 5s' },
    ],
    ambientColor: '#C4A0B4',
    particleConfig: { count: 200, color: '#DDA0DD', speed: 0.12, type: 'dust' },
  },
  {
    id: 'geometry',
    name: 'Sacred Geometry',
    layers: [
      { type: 'gradient', css: 'radial-gradient(ellipse at 50% 50%, #0A0A14 0%, #000 100%)' },
      { type: 'overlay', css: 'radial-gradient(circle at 50% 50%, rgba(196,162,101,0.03) 0%, transparent 60%)', animation: 'bg-breathe 6s ease-in-out infinite' },
    ],
    ambientColor: '#C4A265',
    particleConfig: { count: 120, color: '#C4A265', speed: 0.08, type: 'geometry' },
  },
];

// ── Phase-Locked Backgrounds ────────────────────────────────────────

const PHASE_LOCKED_BACKGROUNDS: BackgroundConfig[] = [
  {
    id: 'eden',
    name: 'The Garden',
    layers: [
      { type: 'gradient', css: 'radial-gradient(ellipse at 50% 70%, #1A2A1A 0%, #0A140A 60%, #040804 100%)' },
      { type: 'overlay', css: 'radial-gradient(circle at 50% 20%, rgba(196,162,101,0.06) 0%, transparent 60%)', animation: 'bg-breathe 5s ease-in-out infinite' },
      { type: 'overlay', css: 'radial-gradient(circle at 40% 50%, rgba(120,200,100,0.04) 0%, transparent 50%)', animation: 'bg-breathe 8s ease-in-out infinite 3s' },
    ],
    ambientColor: '#7CB342',
    particleConfig: { count: 300, color: '#90EE90', speed: 0.2, type: 'fireflies' },
    locked: true,
    unlockCondition: '90-day streak + Phase 7+',
  },
  {
    id: 'akashic',
    name: 'Akashic Hall',
    layers: [
      { type: 'gradient', css: 'radial-gradient(ellipse at 50% 30%, #1A1430 0%, #0A0818 60%, #000 100%)' },
      { type: 'overlay', css: 'radial-gradient(circle at 50% 40%, rgba(140,120,220,0.06) 0%, transparent 60%)', animation: 'bg-drift 8s ease-in-out infinite' },
    ],
    ambientColor: '#9B59B6',
    particleConfig: { count: 180, color: '#DA70D6', speed: 0.1, type: 'geometry' },
    locked: true,
    unlockCondition: 'All 6 guides tried + Phase 8+',
  },
  {
    id: 'aurora',
    name: 'Aurora Field',
    layers: [
      { type: 'gradient', css: 'radial-gradient(ellipse at 50% 20%, #0A1A20 0%, #000 100%)' },
      { type: 'overlay', css: 'linear-gradient(180deg, rgba(100,200,150,0.04) 0%, transparent 40%, rgba(100,150,220,0.03) 70%, transparent 100%)', animation: 'bg-aurora 12s ease-in-out infinite' },
    ],
    ambientColor: '#7FFFD4',
    particleConfig: { count: 250, color: '#7FFFD4', speed: 0.15, type: 'stars' },
    locked: true,
    unlockCondition: 'Phase 9 (Integration)',
  },
  {
    id: 'womb',
    name: 'Cosmic Womb',
    layers: [
      { type: 'gradient', css: 'radial-gradient(ellipse at 50% 50%, #2A0A10 0%, #140408 60%, #060204 100%)' },
      { type: 'overlay', css: 'radial-gradient(circle at 50% 50%, rgba(200,80,80,0.05) 0%, transparent 60%)', animation: 'bg-heartbeat 1.5s ease-in-out infinite' },
    ],
    ambientColor: '#C0392B',
    particleConfig: { count: 100, color: '#FF6B6B', speed: 0.08, type: 'dust' },
    locked: true,
    unlockCondition: 'S16 (Womb Mapping) complete',
  },
];

export const ALL_BACKGROUNDS = [...STANDARD_BACKGROUNDS, ...PHASE_LOCKED_BACKGROUNDS];

export function getBackgroundById(id: string): BackgroundConfig {
  return ALL_BACKGROUNDS.find(b => b.id === id) || STANDARD_BACKGROUNDS[0];
}

// ── Background Renderer ─────────────────────────────────────────────

interface BackgroundRendererProps {
  backgroundId: string;
  ambientLevel?: number;
  particleLevel?: number;
  guideColor?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function BackgroundRenderer({
  backgroundId,
  ambientLevel = 3,
  particleLevel = 3,
  guideColor,
  style,
  children,
}: BackgroundRendererProps) {
  const [prevBg, setPrevBg] = useState(backgroundId);
  const [transitioning, setTransitioning] = useState(false);
  const config = getBackgroundById(backgroundId);
  const prevConfig = getBackgroundById(prevBg);
  const opacity = ambientLevel / 5;

  useEffect(() => {
    if (backgroundId !== prevBg) {
      setTransitioning(true);
      const timer = setTimeout(() => {
        setPrevBg(backgroundId);
        setTransitioning(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [backgroundId, prevBg]);

  const renderLayers = (bg: BackgroundConfig, layerOpacity: number) => (
    <>
      {bg.layers.map((layer, i) => (
        <div
          key={`${bg.id}-${i}`}
          style={{
            position: 'absolute',
            inset: 0,
            background: layer.css,
            opacity: (layer.opacity ?? 1) * layerOpacity * opacity,
            animation: layer.animation,
            transition: 'opacity 800ms ease-in-out',
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#000',
        overflow: 'hidden',
        ...style,
      }}
    >
      <style>{bgKeyframes}</style>
      {transitioning && renderLayers(prevConfig, 1)}
      {renderLayers(config, transitioning ? 0 : 1)}
      {children}
    </div>
  );
}

// ── Background Selector FAB ─────────────────────────────────────────

interface BackgroundSelectorFABProps {
  guideColor: string;
  currentBackgroundId: string;
  onBackgroundChange: (id: string) => void;
  ambientLevel: number;
  particleLevel: number;
  onAmbientChange: (level: number) => void;
  onParticleChange: (level: number) => void;
  unlockedBackgrounds?: string[];
}

export function BackgroundSelectorFAB({
  guideColor,
  currentBackgroundId,
  onBackgroundChange,
  ambientLevel,
  particleLevel,
  onAmbientChange,
  onParticleChange,
  unlockedBackgrounds = [],
}: BackgroundSelectorFABProps) {
  const [open, setOpen] = useState(false);

  const isUnlocked = useCallback((bg: BackgroundConfig) => {
    if (!bg.locked) return true;
    return unlockedBackgrounds.includes(bg.id);
  }, [unlockedBackgrounds]);

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setOpen(!open)}
        title="Change background"
        style={{
          position: 'fixed',
          top: '1.5rem',
          right: '7rem',
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: open ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: 'none',
          boxShadow: `0 0 0 1px ${guideColor}30`,
          cursor: 'pointer',
          zIndex: 70,
          animation: open ? 'none' : 'bg-breathe 4s ease-in-out infinite',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
          e.currentTarget.style.boxShadow = `0 0 0 1px ${guideColor}60`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = open ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)';
          e.currentTarget.style.boxShadow = `0 0 0 1px ${guideColor}30`;
        }}
      >
        {/* Layered diamond icon */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2L14 10L10 18L6 10Z" stroke={guideColor} strokeWidth="1" opacity="0.6" fill="none" />
          <path d="M10 5L12.5 10L10 15L7.5 10Z" stroke={guideColor} strokeWidth="1" opacity="0.4" fill="none" />
          <circle cx="10" cy="10" r="1.5" fill={guideColor} opacity="0.5" />
        </svg>
      </button>

      {/* Selector Panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            top: 'calc(1.5rem + 54px)',
            right: '5.5rem',
            width: 320,
            maxHeight: 420,
            background: 'rgba(10,10,15,0.92)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 16,
            zIndex: 71,
            overflowY: 'auto',
            animation: 'bg-fade-in 0.3s ease',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', letterSpacing: '0.08em', fontFamily: 'Cormorant Garamond, serif' }}>
              Choose Your Sacred Space
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 6px' }}
            >
              &times;
            </button>
          </div>

          {/* Standard Backgrounds Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
            {STANDARD_BACKGROUNDS.map(bg => (
              <BackgroundThumbnail
                key={bg.id}
                bg={bg}
                selected={currentBackgroundId === bg.id}
                locked={false}
                guideColor={guideColor}
                onClick={() => onBackgroundChange(bg.id)}
              />
            ))}
          </div>

          {/* Phase-Locked Section */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginBottom: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Phase-Locked
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 8 }}>
              {PHASE_LOCKED_BACKGROUNDS.map(bg => (
                <BackgroundThumbnail
                  key={bg.id}
                  bg={bg}
                  selected={currentBackgroundId === bg.id}
                  locked={!isUnlocked(bg)}
                  guideColor={guideColor}
                  onClick={() => isUnlocked(bg) && onBackgroundChange(bg.id)}
                />
              ))}
            </div>
          </div>

          {/* Ambient / Particle Controls */}
          <div style={{ display: 'flex', gap: 16, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <SliderControl label="Ambient" value={ambientLevel} onChange={onAmbientChange} guideColor={guideColor} />
            <SliderControl label="Particles" value={particleLevel} onChange={onParticleChange} guideColor={guideColor} />
          </div>
        </div>
      )}
    </>
  );
}

// ── Thumbnail Component ─────────────────────────────────────────────

function BackgroundThumbnail({
  bg,
  selected,
  locked,
  guideColor,
  onClick,
}: {
  bg: BackgroundConfig;
  selected: boolean;
  locked: boolean;
  guideColor: string;
  onClick: () => void;
}) {
  const mainGradient = bg.layers[0]?.css || '#000';

  return (
    <button
      onClick={onClick}
      title={locked ? bg.unlockCondition : bg.name}
      style={{
        width: '100%',
        aspectRatio: '1',
        borderRadius: 10,
        border: selected ? `2px solid ${guideColor}` : '1px solid rgba(255,255,255,0.08)',
        background: mainGradient,
        cursor: locked ? 'not-allowed' : 'pointer',
        position: 'relative',
        overflow: 'hidden',
        opacity: locked ? 0.4 : 1,
        boxShadow: selected ? `0 0 12px ${guideColor}40` : 'none',
        transition: 'all 0.3s ease',
        padding: 0,
      }}
    >
      {locked && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(2px)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
      )}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '3px 0',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
        textAlign: 'center',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.5rem', letterSpacing: '0.04em' }}>
          {bg.name}
        </span>
      </div>
    </button>
  );
}

// ── Slider Control ──────────────────────────────────────────────────

function SliderControl({
  label,
  value,
  onChange,
  guideColor,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  guideColor: string;
}) {
  return (
    <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
        {label}: {value}/5
      </span>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={e => onChange(+e.target.value)}
        style={{
          width: '100%',
          height: 4,
          appearance: 'none',
          WebkitAppearance: 'none',
          background: `linear-gradient(to right, ${guideColor}60 0%, ${guideColor}60 ${(value - 1) * 25}%, rgba(255,255,255,0.1) ${(value - 1) * 25}%, rgba(255,255,255,0.1) 100%)`,
          borderRadius: 2,
          outline: 'none',
          cursor: 'pointer',
        }}
      />
    </label>
  );
}

// ── Custom Hook: Background Settings Persistence ────────────────────

export function useBackgroundSettings(defaultBg = 'void') {
  const [backgroundId, setBackgroundId] = useState(() => {
    try { return localStorage.getItem('codex-bg-id') || defaultBg; } catch { return defaultBg; }
  });
  const [ambientLevel, setAmbientLevel] = useState(() => {
    try { return parseInt(localStorage.getItem('codex-bg-ambient') || '3'); } catch { return 3; }
  });
  const [particleLevel, setParticleLevel] = useState(() => {
    try { return parseInt(localStorage.getItem('codex-bg-particles') || '3'); } catch { return 3; }
  });

  useEffect(() => {
    try {
      localStorage.setItem('codex-bg-id', backgroundId);
      localStorage.setItem('codex-bg-ambient', String(ambientLevel));
      localStorage.setItem('codex-bg-particles', String(particleLevel));
    } catch {}
  }, [backgroundId, ambientLevel, particleLevel]);

  return {
    backgroundId, setBackgroundId,
    ambientLevel, setAmbientLevel,
    particleLevel, setParticleLevel,
  };
}

// ── CSS Keyframes for Background Animations ─────────────────────────

const bgKeyframes = `
  @keyframes bg-breathe {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.03); }
  }
  @keyframes bg-drift {
    0% { transform: translate(0, 0); }
    33% { transform: translate(2%, -1%); }
    66% { transform: translate(-1%, 2%); }
    100% { transform: translate(0, 0); }
  }
  @keyframes bg-flicker {
    0%, 100% { opacity: 1; }
    25% { opacity: 0.85; }
    50% { opacity: 1.1; }
    75% { opacity: 0.9; }
  }
  @keyframes bg-caustic {
    0%, 100% { opacity: 1; transform: translateY(0); }
    50% { opacity: 0.7; transform: translateY(-2%); }
  }
  @keyframes bg-aurora {
    0% { transform: translateX(-5%); opacity: 0.6; }
    50% { transform: translateX(5%); opacity: 1; }
    100% { transform: translateX(-5%); opacity: 0.6; }
  }
  @keyframes bg-heartbeat {
    0%, 100% { transform: scale(1); opacity: 0.8; }
    15% { transform: scale(1.03); opacity: 1; }
    30% { transform: scale(1); opacity: 0.8; }
    45% { transform: scale(1.02); opacity: 0.95; }
  }
  @keyframes bg-fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
