# LIVING CODEX — Animation System Integration Guide
## For the Dev Team · v3.0

---

## WHAT'S IN THIS FOLDER

| File | What It Does |
|------|-------------|
| `01_AnimationEngine.tsx` | Core engine: all hooks, context provider, 50+ keyframe injection, design tokens, holographic mode controller |
| `02_AnimatedComponents.tsx` | Drop-in component library: GlimmerLayer, GlassCard, MirrorCard, ProgressBar, WaveformBars, Constellation, AnimatedButton, WriteCursor, SessionInsight, SpaceCard, TimelineDot, PageTransition |
| `03_PhaseIconSVGs.tsx` | Complete SVG icon set for all 9 phases with animation-ready CSS class names |
| `04_HolographicSystem.tsx` | Dark world components: HolographicBackground, HolographicPortrait, HolographicSurface, HolographicInputBar, VoiceOrb, usePageTransition hook |

---

## INSTALLATION ORDER

```
1. Copy all 4 .tsx files into: client/src/pages/codex/animation/
2. The AnimationEngine auto-injects all CSS keyframes on mount
3. No separate CSS imports needed — it's all self-contained
```

---

## STEP 1: WRAP THE APP

In `CodexPortalShell.tsx`, wrap children in `AnimationProvider`:

```tsx
import { AnimationProvider } from './animation/01_AnimationEngine';
import { GlimmerLayer } from './animation/02_AnimatedComponents';

export function CodexPortalShell({ children }) {
  return (
    <AnimationProvider>
      <div className="codex-env cx-portal-layout">
        <GlimmerLayer />
        <Sidebar />
        <main>{children}</main>
      </div>
    </AnimationProvider>
  );
}
```

---

## HOOKS REFERENCE

| Hook | Returns | Use For |
|------|---------|---------|
| `useReducedMotion()` | `boolean` | Check accessibility preference |
| `useStaggerEntrance(count, opts)` | `{ containerRef, getItemStyle }` | List entrance animations |
| `useBreath(periodMs)` | `number (0-1)` | Continuous breathing value |
| `useProgressFill(percent, opts)` | `{ ref, current, shimmer }` | Animated progress bars |
| `useWaveform(analyserNode)` | `{ bars, state, setWaveState }` | Voice waveform visualization |
| `usePhaseGlow(phaseNum)` | `{ primary, glow, boxShadow }` | Phase-specific colors |
| `useCountUp(target, durationMs)` | `number` | Animated number counter |
| `useTypewriter(text, speedMs)` | `{ displayText, isComplete }` | Character reveal |
| `useAnimation()` | context value | Holographic mode, glimmer mode |
| `usePageTransition()` | `{ navigateTo, animStyle }` | Route change animations |

---

## PERFORMANCE RULES

1. **Only `transform` and `opacity`** — all continuous animations only animate these two properties.
2. **`will-change` sparingly** — only on `.lc-glass-card`, `.lc-mirror-card`, `.lc-guide-portrait`, `.icon-orb`.
3. **Tab visibility** — AnimationProvider pauses GlimmerLayer when the tab is hidden.
4. **GPU compositing** — all glimmer particles use `transform: translateZ(0)` and `backface-visibility: hidden`.
5. **Intersection Observer** — `useStaggerEntrance` and `useProgressFill` only trigger when elements scroll into view.

---

*Living Codex Animation System v3.0 · Just Empower · Confidential*
