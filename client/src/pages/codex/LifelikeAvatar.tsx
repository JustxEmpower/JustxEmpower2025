/**
 * LifelikeAvatar.tsx
 *
 * Canvas-composited lifelike avatar for Living Codex™.
 * ZERO runtime Kling API calls — all lip-sync + emotion is local.
 *
 * Architecture (3-Layer Composite):
 *   Layer 1: Kling idle video loop (pre-generated atlas video, seamless crossfade)
 *   Layer 2: Canvas-driven viseme mouth overlay (sprite sheet frames)
 *   Layer 3: Emotion post-processing (color grading, glow, breathing dynamics)
 *   Audio:   Kokoro TTS → VisemeEngine → frame selection at 60fps
 *
 * Seamless Loop Strategy:
 *   Two <video> elements ping-pong. When video A approaches its end (~0.5s before),
 *   video B starts playing from 0. Canvas crossfades between them over 0.5s.
 *   Result: zero visible seam, zero flicker, infinite smooth idle.
 *
 * Emotion System:
 *   Receives AvatarEmotion from parent (detected from guide text).
 *   Maps emotion → color grading, glow intensity, breathing speed, warmth overlay.
 *   Smooth transitions between emotion states over 0.6s.
 *
 * The VisemeEngine blends two signal paths:
 *   - TEXT predictive (70%): grapheme→phoneme→viseme, knows timing ahead
 *   - AUDIO reactive (30%): FFT spectral classification, corrects drift
 *
 * Assets per guide (generated once by scripts/generate-kling-atlas.mjs):
 *   public/assets/avatars/atlas/{guideId}/atlas-video.mp4   — idle loop
 *   public/assets/avatars/atlas/{guideId}/sprite-sheet.png    — 5×3 grid
 *   public/assets/avatars/atlas/{guideId}/viseme-index.json  — frame map
 *
 * @module codex/LifelikeAvatar
 */

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  getVisemeEngine,
  type VisemeFrame,
  SPRITE_COLS,
  SPRITE_ROWS,
} from './VisemeEngine';

// ============================================================================
// Types
// ============================================================================

type AvatarState = 'loading' | 'idle' | 'speaking' | 'listening' | 'error';

type AvatarEmotion =
  | 'neutral'
  | 'joy'
  | 'concern'
  | 'curiosity'
  | 'calm'
  | 'listening'
  | 'empathy'
  | 'celebration';

interface LifelikeAvatarProps {
  /** Guide identifier (kore, aoede, leda, theia, selene, zephyr) */
  guideId: string;
  /** URL to the guide's portrait image (LoRA-generated, fallback) */
  portraitUrl: string;
  /** Whether the guide is currently speaking */
  isSpeaking: boolean;
  /** Whether the guide is listening to user */
  isListening: boolean;
  /** Audio blob URL from Kokoro TTS (for lip-sync) */
  audioUrl?: string;
  /** Text being spoken (drives predictive viseme path) */
  spokenText?: string;
  /** Current emotional state of the guide */
  emotion?: AvatarEmotion;
  /** Quality mode (kept for API compat) */
  mode?: string;
  /** Container width */
  width?: string;
  /** Container height */
  height?: string;
  /** Callback when avatar is ready */
  onReady?: () => void;
  /** Callback on error */
  onError?: (error: string) => void;
  /** Audio amplitude (0-1) from KokoroTTSManager for lip-sync */
  audioLevel?: number;
  /** Unused — kept for API compat with HolographicAvatar */
  useKlingTTS?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const GUIDE_COLORS: Record<string, string> = {
  kore: '#D4AF37',
  aoede: '#9B59B6',
  leda: '#FFB6C1',
  theia: '#2ECC71',
  selene: '#2471A3',
  zephyr: '#FF6B35',
};

/** Atlas asset base paths — all assets served from S3 */
const ATLAS_S3_BASE = 'https://justxempower-assets.s3.amazonaws.com/avatars/atlas';

/** Sprite sheet cell dimensions */
const CELL_W = 256;
const CELL_H = 256;

/** Mouth overlay region within the video frame (centered lower third) */
const MOUTH_REGION = {
  x: 0.30,  // 30% from left
  y: 0.62,  // 62% from top
  w: 0.40,  // 40% of frame width
  h: 0.20,  // 20% of frame height
};

/** Feather radius for mouth blend (px) */
const FEATHER_PX = 14;

/** Procedural mouth shape parameters per viseme (no sprite sheet needed) */
const VISEME_SHAPES: Record<string, { open: number; width: number; round: number }> = {
  sil: { open: 0.00, width: 0.55, round: 0.3 },
  PP:  { open: 0.00, width: 0.45, round: 0.5 },
  FF:  { open: 0.12, width: 0.60, round: 0.2 },
  TH:  { open: 0.18, width: 0.60, round: 0.2 },
  DD:  { open: 0.18, width: 0.50, round: 0.3 },
  kk:  { open: 0.28, width: 0.48, round: 0.4 },
  CH:  { open: 0.22, width: 0.38, round: 0.7 },
  SS:  { open: 0.08, width: 0.55, round: 0.2 },
  nn:  { open: 0.12, width: 0.50, round: 0.3 },
  RR:  { open: 0.18, width: 0.38, round: 0.6 },
  aa:  { open: 0.85, width: 0.65, round: 0.3 },
  E:   { open: 0.50, width: 0.65, round: 0.2 },
  I:   { open: 0.28, width: 0.60, round: 0.2 },
  O:   { open: 0.65, width: 0.45, round: 0.8 },
  U:   { open: 0.38, width: 0.32, round: 0.9 },
};

/** Avatar zoom-out: 1.0 = full fill */
const AVATAR_SCALE = 1.0;

/** How far before video end to start crossfade (seconds) */
const LOOP_CROSSFADE_LEAD = 0.5;

/** Duration of the crossfade blend (seconds) */
const LOOP_CROSSFADE_DURATION = 0.5;

// ============================================================================
// Emotion Profiles
// ============================================================================

interface EmotionProfile {
  /** Color overlay tint (RGBA) */
  tint: [number, number, number, number];
  /** Glow intensity multiplier (0-1) */
  glowIntensity: number;
  /** Breathing animation speed (1 = normal) */
  breathSpeed: number;
  /** Brightness adjustment (-0.1 to 0.1) */
  brightness: number;
  /** Warmth: shift toward warm or cool (positive = warm) */
  warmth: number;
  /** Saturation boost (0 = none, 0.2 = 20% boost) */
  saturation: number;
}

const EMOTION_PROFILES: Record<AvatarEmotion, EmotionProfile> = {
  neutral: {
    tint: [0, 0, 0, 0],
    glowIntensity: 0.15,
    breathSpeed: 1.0,
    brightness: 0,
    warmth: 0,
    saturation: 0,
  },
  joy: {
    tint: [255, 220, 100, 0.06],
    glowIntensity: 0.5,
    breathSpeed: 1.3,
    brightness: 0.06,
    warmth: 0.08,
    saturation: 0.12,
  },
  concern: {
    tint: [100, 120, 180, 0.04],
    glowIntensity: 0.25,
    breathSpeed: 0.7,
    brightness: -0.03,
    warmth: -0.04,
    saturation: -0.05,
  },
  curiosity: {
    tint: [180, 200, 255, 0.03],
    glowIntensity: 0.35,
    breathSpeed: 1.15,
    brightness: 0.03,
    warmth: 0,
    saturation: 0.05,
  },
  calm: {
    tint: [120, 180, 160, 0.03],
    glowIntensity: 0.12,
    breathSpeed: 0.6,
    brightness: 0,
    warmth: 0.02,
    saturation: 0,
  },
  listening: {
    tint: [150, 150, 200, 0.02],
    glowIntensity: 0.2,
    breathSpeed: 0.8,
    brightness: 0.01,
    warmth: 0,
    saturation: 0,
  },
  empathy: {
    tint: [200, 160, 180, 0.05],
    glowIntensity: 0.3,
    breathSpeed: 0.75,
    brightness: 0.02,
    warmth: 0.05,
    saturation: 0.03,
  },
  celebration: {
    tint: [255, 200, 50, 0.08],
    glowIntensity: 0.7,
    breathSpeed: 1.5,
    brightness: 0.08,
    warmth: 0.1,
    saturation: 0.18,
  },
};

// ============================================================================
// Loading Overlay
// ============================================================================

function LoadingOverlay({ guideId, message }: { guideId: string; message: string }) {
  const color = GUIDE_COLORS[guideId] || '#D4AF37';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, rgba(15,10,25,0.95) 0%, rgba(5,0,15,0.98) 100%)',
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}44 0%, ${color}11 60%, transparent 70%)`,
          boxShadow: `0 0 40px ${color}33, 0 0 80px ${color}11`,
          animation: 'lifelike-pulse 2s ease-in-out infinite',
        }}
      />
      <p
        style={{
          marginTop: 16,
          color: `${color}cc`,
          fontSize: 13,
          fontFamily: "'Inter', sans-serif",
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        {message}
      </p>
      <style>{`
        @keyframes lifelike-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

/** Linearly interpolate between two values */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

/** Interpolate between two EmotionProfiles */
function lerpProfile(a: EmotionProfile, b: EmotionProfile, t: number): EmotionProfile {
  return {
    tint: [
      lerp(a.tint[0], b.tint[0], t),
      lerp(a.tint[1], b.tint[1], t),
      lerp(a.tint[2], b.tint[2], t),
      lerp(a.tint[3], b.tint[3], t),
    ],
    glowIntensity: lerp(a.glowIntensity, b.glowIntensity, t),
    breathSpeed: lerp(a.breathSpeed, b.breathSpeed, t),
    brightness: lerp(a.brightness, b.brightness, t),
    warmth: lerp(a.warmth, b.warmth, t),
    saturation: lerp(a.saturation, b.saturation, t),
  };
}

// ============================================================================
// Main Component
// ============================================================================

export default function LifelikeAvatar({
  guideId,
  portraitUrl,
  isSpeaking,
  isListening,
  audioUrl,
  spokenText,
  emotion = 'neutral',
  width = '100%',
  height = '500px',
  onReady,
  onError,
  audioLevel = 0,
}: LifelikeAvatarProps) {
  // --- Refs ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const spriteImgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number>(0);
  const mountedRef = useRef(true);

  // Seamless loop state
  const activeVideoRef = useRef<'A' | 'B'>('A');
  const crossfadeProgressRef = useRef(0); // 0 = fully active, 1 = fully next
  const isCrossfadingRef = useRef(false);

  // Emotion interpolation
  const currentProfileRef = useRef<EmotionProfile>(EMOTION_PROFILES.neutral);
  const targetEmotionRef = useRef<AvatarEmotion>('neutral');
  const emotionBlendRef = useRef(1); // 1 = fully at target

  // Live refs for values used inside render loop (avoids stale closures)
  const audioLevelRef = useRef(audioLevel);
  const isSpeakingRef = useRef(isSpeaking);
  audioLevelRef.current = audioLevel;
  isSpeakingRef.current = isSpeaking;

  // --- State ---
  const [state, setState] = useState<AvatarState>('loading');
  const [loadingMessage, setLoadingMessage] = useState('Loading atlas...');
  const [atlasReady, setAtlasReady] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const guideColor = GUIDE_COLORS[guideId] || '#D4AF37';
  const visemeEngine = useMemo(() => getVisemeEngine(), []);

  // Asset URLs
  // idle-video.mp4 = clean base video (no speech) hosted on S3
  const idleVideoUrl = `${ATLAS_S3_BASE}/${guideId}/idle-video.mp4`;
  const spriteUrl = `${ATLAS_S3_BASE}/${guideId}/sprite-sheet.png`;

  // --------------------------------------------------------------------------
  // Emotion transitions — drives both canvas post-processing AND VisemeEngine
  // --------------------------------------------------------------------------
  useEffect(() => {
    // Update VisemeEngine emotion (affects mouth openness, speed, width)
    visemeEngine.setEmotion(emotion);

    if (emotion !== targetEmotionRef.current) {
      // Snapshot current interpolated profile as new "from" state
      const currentTarget = EMOTION_PROFILES[targetEmotionRef.current];
      currentProfileRef.current = lerpProfile(
        currentProfileRef.current,
        currentTarget,
        emotionBlendRef.current
      );
      targetEmotionRef.current = emotion;
      emotionBlendRef.current = 0; // restart blend
    }
  }, [emotion, visemeEngine]);

  // --------------------------------------------------------------------------
  // Load atlas assets on mount
  // --------------------------------------------------------------------------
  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    async function loadAssets() {
      setState('loading');
      setLoadingMessage('Loading idle video...');

      try {
        // Load sprite sheet image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = spriteUrl;
        });
        if (cancelled) return;
        spriteImgRef.current = img;
        setAtlasReady(true);

        setLoadingMessage('Loading idle video...');

        // Load both video elements with the same source for seamless ping-pong
        const videoA = videoARef.current;
        const videoB = videoBRef.current;
        if (!videoA || !videoB) throw new Error('Video elements not mounted');

        videoA.src = idleVideoUrl;
        videoA.load();

        // Wait for video A to have enough data to start playback (canplay, not canplaythrough)
        await new Promise<void>((resolve, reject) => {
          const onCanPlay = () => {
            videoA.removeEventListener('canplay', onCanPlay);
            videoA.removeEventListener('error', onErr);
            resolve();
          };
          const onErr = () => {
            videoA.removeEventListener('canplay', onCanPlay);
            videoA.removeEventListener('error', onErr);
            reject(new Error('Idle video failed to load'));
          };
          videoA.addEventListener('canplay', onCanPlay);
          videoA.addEventListener('error', onErr);
          if (videoA.readyState >= 3) {
            videoA.removeEventListener('canplay', onCanPlay);
            videoA.removeEventListener('error', onErr);
            resolve();
          }
        });
        if (cancelled) return;

        // Start video A playing immediately, load video B in background
        videoA.play().catch(() => {});
        activeVideoRef.current = 'A';

        setVideoReady(true);
        setState('idle');
        onReady?.();

        // Load video B in background for seamless looping (non-blocking)
        videoB.src = idleVideoUrl;
        videoB.load();
        videoB.currentTime = 0;
      } catch (err: any) {
        if (cancelled) return;
        console.warn('[LifelikeAvatar] Atlas assets not found, using portrait fallback:', err.message);
        setErrorMessage(err.message);
        setState('idle');
      }
    }

    loadAssets();

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [guideId, idleVideoUrl, spriteUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // --------------------------------------------------------------------------
  // Viseme text prediction: driven by isSpeaking + spokenText
  // Audio is played by KokoroTTSManager — we only do text→viseme here.
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isSpeaking) {
      visemeEngine.stopText();
      return;
    }
    if (spokenText) {
      const wordCount = spokenText.split(/\s+/).length;
      const estimatedDuration = Math.max(2, wordCount * 0.45);
      console.log(`[LifelikeAvatar] START lip sync: words=${wordCount}, dur=${estimatedDuration.toFixed(1)}s, audioLevel=${audioLevel.toFixed(2)}`);
      visemeEngine.prepareText(spokenText, estimatedDuration);
    }
    return () => { visemeEngine.stopText(); };
  }, [isSpeaking, spokenText, visemeEngine]);

  // --------------------------------------------------------------------------
  // Update text prediction when spokenText changes mid-speech
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isSpeaking || !spokenText) return;
    const wordCount = spokenText.split(/\s+/).length;
    const estimatedDuration = Math.max(2, wordCount * 0.45);
    visemeEngine.prepareText(spokenText, estimatedDuration);
  }, [spokenText, isSpeaking, visemeEngine]);

  // --------------------------------------------------------------------------
  // Canvas render loop (60fps)
  // Composites: seamless idle video + viseme mouth + emotion post-processing
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const videoA = videoARef.current;
    const videoB = videoBRef.current;
    if (!canvas || !videoA || !videoB || !atlasReady || !videoReady) return;

    const ctx = canvas.getContext('2d', { alpha: false })!;
    if (!ctx) return;

    // Match canvas to container size (respects devicePixelRatio)
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let lastTime = performance.now();

    function renderFrame() {
      if (!mountedRef.current) return;

      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const dpr = window.devicePixelRatio || 1;
      const displayW = canvas!.width / dpr;
      const displayH = canvas!.height / dpr;

      // ==== EMOTION INTERPOLATION ====
      // Advance blend toward target emotion (0.6s transition)
      if (emotionBlendRef.current < 1) {
        emotionBlendRef.current = Math.min(1, emotionBlendRef.current + dt / 0.6);
      }
      const targetProfile = EMOTION_PROFILES[targetEmotionRef.current];
      const emo = lerpProfile(currentProfileRef.current, targetProfile, emotionBlendRef.current);

      // ==== LAYER 1: SEAMLESS IDLE VIDEO ====
      const activeVid = activeVideoRef.current === 'A' ? videoA! : videoB!;
      const nextVid = activeVideoRef.current === 'A' ? videoB! : videoA!;

      // Zoom-out: draw video centered and scaled down
      const vidW = displayW * AVATAR_SCALE;
      const vidH = displayH * AVATAR_SCALE;
      const vidX = (displayW - vidW) / 2;
      const vidY = (displayH - vidH) / 2;

      // Fill background behind video
      ctx.fillStyle = '#0A0619';
      ctx.fillRect(0, 0, displayW, displayH);

      // Check if we need to start crossfade
      if (
        !isCrossfadingRef.current &&
        activeVid.duration > 0 &&
        activeVid.currentTime >= activeVid.duration - LOOP_CROSSFADE_LEAD
      ) {
        // Start the next video from frame 0
        nextVid.currentTime = 0;
        nextVid.play().catch(() => {});
        isCrossfadingRef.current = true;
        crossfadeProgressRef.current = 0;
      }

      // Advance crossfade
      if (isCrossfadingRef.current) {
        crossfadeProgressRef.current = Math.min(
          1,
          crossfadeProgressRef.current + dt / LOOP_CROSSFADE_DURATION
        );

        // Draw both videos blended
        if (activeVid.readyState >= 2) {
          ctx.globalAlpha = 1 - crossfadeProgressRef.current;
          ctx.drawImage(activeVid, vidX, vidY, vidW, vidH);
        }
        if (nextVid.readyState >= 2) {
          ctx.globalAlpha = crossfadeProgressRef.current;
          ctx.drawImage(nextVid, vidX, vidY, vidW, vidH);
        }
        ctx.globalAlpha = 1;

        // Crossfade complete — swap active
        if (crossfadeProgressRef.current >= 1) {
          isCrossfadingRef.current = false;
          activeVideoRef.current = activeVideoRef.current === 'A' ? 'B' : 'A';
          // Pause the old video to save resources
          activeVid.pause();
          activeVid.currentTime = 0;
        }
      } else {
        // Normal single-video draw
        if (activeVid.readyState >= 2) {
          ctx.drawImage(activeVid, vidX, vidY, vidW, vidH);
        }
      }

      // ==== LAYER 2: JAW DISPLACEMENT LIP SYNC ====
      const liveAudioLevel = audioLevelRef.current;
      const liveSpeaking = isSpeakingRef.current;
      if (liveSpeaking) {
        const frame: VisemeFrame = visemeEngine.getCurrentFrame();
        const shape = VISEME_SHAPES[frame.viseme] || VISEME_SHAPES.sil;
        const nextShape = VISEME_SHAPES[frame.nextViseme] || VISEME_SHAPES.sil;
        const bf = frame.blendFactor;
        const mOpen = shape.open * (1 - bf) + nextShape.open * bf;
        const mWidth = shape.width * (1 - bf) + nextShape.width * bf;
        const amp = Math.max(liveAudioLevel, 0.6);
        const openness = Math.max(mOpen * amp, 0.08);
        const mCx = vidX + vidW * (MOUTH_REGION.x + MOUTH_REGION.w / 2);
        const mTopY = vidY + vidH * MOUTH_REGION.y;
        const mW = vidW * MOUTH_REGION.w;
        const mH = vidH * MOUTH_REGION.h;
        const maxDrop = vidH * 0.10;
        const jawDrop = maxDrop * openness;
        const splitY = mTopY + mH * 0.35;
        const jawW = mW * 1.4;
        const jawX = mCx - jawW / 2;
        const jawH = (vidY + vidH) - splitY;
        if (jawDrop > 0.5) {
          const srcVid = activeVideoRef.current === 'A' ? videoA : videoB;
          if (srcVid.readyState >= 2) {
            const vw = srcVid.videoWidth, vh = srcVid.videoHeight;
            const sX = (jawX - vidX) / vidW * vw;
            const sY = (splitY - vidY) / vidH * vh;
            const sW = jawW / vidW * vw;
            const sH = jawH / vidH * vh;
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(mCx, splitY + jawH / 2 + jawDrop / 2, jawW / 2 + 8, (jawH + jawDrop) / 2 + 8, 0, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(srcVid, Math.max(0, sX), Math.max(0, sY), Math.min(sW, vw), Math.min(sH, vh), jawX, splitY + jawDrop, jawW, jawH);
            ctx.restore();
          }
          ctx.save();
          const gCy = splitY + jawDrop * 0.4;
          const gRx = mW * 0.35 * (0.6 + mWidth * 0.4);
          const gRy = jawDrop * 0.55;
          if (gRy > 1) {
            ctx.beginPath();
            ctx.ellipse(mCx, gCy, gRx + 3, gRy + 3, 0, 0, Math.PI * 2);
            ctx.clip();
            const mg = ctx.createRadialGradient(mCx, gCy, 0, mCx, gCy, Math.max(gRx, gRy));
            mg.addColorStop(0, 'rgba(15,5,8,0.95)');
            mg.addColorStop(0.5, 'rgba(25,10,15,0.85)');
            mg.addColorStop(0.8, 'rgba(40,20,25,0.5)');
            mg.addColorStop(1, 'rgba(60,30,35,0)');
            ctx.fillStyle = mg;
            ctx.beginPath();
            ctx.ellipse(mCx, gCy, gRx, gRy, 0, 0, Math.PI * 2);
            ctx.fill();
            if (openness > 0.25) {
              ctx.globalAlpha = Math.min(0.3, openness * 0.35);
              ctx.fillStyle = 'rgba(220,210,200,0.6)';
              ctx.beginPath();
              ctx.ellipse(mCx, gCy - gRy * 0.55, gRx * 0.6, gRy * 0.15, 0, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.restore();
        }
      }

      // ==== LAYER 3: EMOTION POST-PROCESSING ====

      // 3a. Brightness adjustment
      if (Math.abs(emo.brightness) > 0.005) {
        ctx.save();
        ctx.globalCompositeOperation = emo.brightness > 0 ? 'screen' : 'multiply';
        const intensity = Math.abs(emo.brightness);
        const bVal = emo.brightness > 0 ? 255 : 0;
        ctx.fillStyle = `rgba(${bVal},${bVal},${bVal},${intensity})`;
        ctx.fillRect(0, 0, displayW, displayH);
        ctx.restore();
      }

      // 3b. Warmth shift (warm = orange overlay, cool = blue overlay)
      if (Math.abs(emo.warmth) > 0.005) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        if (emo.warmth > 0) {
          ctx.fillStyle = `rgba(255,180,80,${emo.warmth})`;
        } else {
          ctx.fillStyle = `rgba(80,120,255,${Math.abs(emo.warmth)})`;
        }
        ctx.fillRect(0, 0, displayW, displayH);
        ctx.restore();
      }

      // 3c. Color tint overlay
      if (emo.tint[3] > 0.005) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = `rgba(${Math.round(emo.tint[0])},${Math.round(emo.tint[1])},${Math.round(emo.tint[2])},${emo.tint[3]})`;
        ctx.fillRect(0, 0, displayW, displayH);
        ctx.restore();
      }

      // 3d. Breathing glow border (pulsates with emotion speed)
      const breathPhase = Math.sin(now / 1000 * emo.breathSpeed * Math.PI) * 0.5 + 0.5;
      const glowAlpha = emo.glowIntensity * (0.4 + breathPhase * 0.6);
      if (glowAlpha > 0.01) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        // Radial glow from edges
        const grad = ctx.createRadialGradient(
          displayW / 2, displayH / 2, Math.min(displayW, displayH) * 0.35,
          displayW / 2, displayH / 2, Math.min(displayW, displayH) * 0.55
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `${guideColor}${Math.round(glowAlpha * 255).toString(16).padStart(2, '0')}`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, displayW, displayH);
        ctx.restore();
      }

      // 3e. Listening shimmer
      if (isListening && !liveSpeaking) {
        const shimmer = Math.sin(now / 800) * 0.025 + 0.015;
        ctx.save();
        ctx.globalAlpha = shimmer;
        ctx.fillStyle = guideColor;
        ctx.fillRect(0, 0, displayW, displayH);
        ctx.restore();
      }

      // 3f. Vignette (subtle, always on)
      ctx.save();
      const vigGrad = ctx.createRadialGradient(
        displayW / 2, displayH / 2, Math.min(displayW, displayH) * 0.3,
        displayW / 2, displayH / 2, Math.max(displayW, displayH) * 0.7
      );
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vigGrad.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, displayW, displayH);
      ctx.restore();

      rafRef.current = requestAnimationFrame(renderFrame);
    }

    rafRef.current = requestAnimationFrame(renderFrame);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(rafRef.current);
    };
  }, [atlasReady, videoReady, isSpeaking, isListening, guideColor, visemeEngine]);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  const showCanvas = atlasReady && videoReady;

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        borderRadius: 14,
        background: '#0A0619',
        border: `2px solid ${guideColor}40`,
        boxShadow: `0 0 20px ${guideColor}15, 0 0 60px ${guideColor}08`,
      }}
    >

      {/* Loading overlay */}
      {state === 'loading' && (
        <LoadingOverlay guideId={guideId} message={loadingMessage} />
      )}

      {/* Hidden video elements for seamless ping-pong looping */}
      <video
        ref={videoARef}
        muted
        playsInline
        preload="auto"
        style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
      />
      <video
        ref={videoBRef}
        muted
        playsInline
        preload="auto"
        style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
      />

      {/* Main canvas — 3-layer composite output */}
      {showCanvas && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            borderRadius: 14,
            opacity: state === 'loading' ? 0 : 1,
            transition: 'opacity 0.6s ease-in-out',
          }}
        />
      )}

      {/* Animated portrait fallback — when atlas assets aren't available */}
      {!showCanvas && state !== 'loading' && (
        <>
          <style>{`
            @keyframes lifelike-breathe { 0%,100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.015) translateY(-2px); } }
            @keyframes lifelike-glow { 0%,100% { box-shadow: 0 0 40px ${guideColor}40, 0 0 80px ${guideColor}15; } 50% { box-shadow: 0 0 60px ${guideColor}60, 0 0 120px ${guideColor}25; } }
            @keyframes lifelike-speak { 0%,100% { box-shadow: 0 0 50px ${guideColor}70, 0 0 100px ${guideColor}35; filter: brightness(1.05); } 50% { box-shadow: 0 0 80px ${guideColor}90, 0 0 140px ${guideColor}50; filter: brightness(1.12); } }
            @keyframes lifelike-ring { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          `}</style>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `radial-gradient(ellipse at center, ${guideColor}18 0%, #0A0A1A 70%)`,
            }}
          >
            <div style={{ position: 'relative', width: '70%', maxWidth: 320, aspectRatio: '1' }}>
              <div style={{ position: 'absolute', inset: -16, borderRadius: '50%', border: `2px solid ${guideColor}20`, animation: 'lifelike-ring 25s linear infinite' }} />
              <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: `1px solid ${guideColor}12`, animation: 'lifelike-ring 18s linear infinite reverse' }} />
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: `3px solid ${guideColor}50`,
                  animation: isSpeaking
                    ? 'lifelike-speak 1s ease-in-out infinite, lifelike-breathe 2s ease-in-out infinite'
                    : 'lifelike-glow 3s ease-in-out infinite, lifelike-breathe 4s ease-in-out infinite',
                  transition: 'box-shadow 0.4s ease',
                }}
              >
                <img
                  src={portraitUrl}
                  alt={`${guideId} guide`}
                  onError={() => onError?.('Portrait image failed to load')}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center 20%',
                    filter: isSpeaking ? 'brightness(1.08)' : 'brightness(1)',
                    transition: 'filter 0.3s ease',
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* State indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          zIndex: 3,
          opacity: 0.6,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background:
              isSpeaking ? '#2ECC71' :
              state === 'loading' ? '#F39C12' :
              state === 'error' ? '#E74C3C' :
              guideColor,
            boxShadow: `0 0 6px ${
              isSpeaking ? '#2ECC71' :
              state === 'loading' ? '#F39C12' :
              guideColor
            }`,
            animation: state === 'loading' ? 'lifelike-pulse 1.5s ease-in-out infinite' : 'none',
          }}
        />
        <span
          style={{
            fontSize: 10,
            color: '#999',
            fontFamily: "'Inter', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {state === 'loading' ? 'Loading...' :
           isSpeaking ? 'Speaking' :
           isListening ? 'Listening' :
           emotion !== 'neutral' ? emotion.charAt(0).toUpperCase() + emotion.slice(1) :
           'Present'}
        </span>
      </div>
    </div>
  );
}

export { LifelikeAvatar, type LifelikeAvatarProps, type AvatarState, type AvatarEmotion };
