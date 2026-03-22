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
 *   public/assets/avatars/atlas/{guideId}/viseme-sprite.png  — 5×3 grid
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

/** Atlas asset base path */
const ATLAS_BASE = '/assets/avatars/atlas';

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
}: LifelikeAvatarProps) {
  // --- Refs ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const spriteImgRef = useRef<HTMLImageElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
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

  // --- State ---
  const [state, setState] = useState<AvatarState>('loading');
  const [loadingMessage, setLoadingMessage] = useState('Loading atlas...');
  const [atlasReady, setAtlasReady] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const guideColor = GUIDE_COLORS[guideId] || '#D4AF37';
  const visemeEngine = useMemo(() => getVisemeEngine(), []);

  // Asset URLs
  // idle-video.mp4 = clean base video (no speech), atlas-video.mp4 = lip-synced (for frame extraction only)
  const idleVideoUrl = `${ATLAS_BASE}/${guideId}/idle-video.mp4`;
  const spriteUrl = `${ATLAS_BASE}/${guideId}/viseme-sprite.png`;

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
      setLoadingMessage('Loading sprite sheet...');

      try {
        // Load sprite sheet image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Sprite sheet not found'));
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
        videoB.src = idleVideoUrl;
        videoA.load();
        videoB.load();

        // Wait for video A to be playable
        await new Promise<void>((resolve, reject) => {
          const onCanPlay = () => {
            videoA.removeEventListener('canplaythrough', onCanPlay);
            videoA.removeEventListener('error', onErr);
            resolve();
          };
          const onErr = () => {
            videoA.removeEventListener('canplaythrough', onCanPlay);
            videoA.removeEventListener('error', onErr);
            reject(new Error('Idle video failed to load'));
          };
          videoA.addEventListener('canplaythrough', onCanPlay);
          videoA.addEventListener('error', onErr);
          if (videoA.readyState >= 4) {
            videoA.removeEventListener('canplaythrough', onCanPlay);
            videoA.removeEventListener('error', onErr);
            resolve();
          }
        });
        if (cancelled) return;

        // Also wait for video B
        await new Promise<void>((resolve) => {
          const onCanPlay = () => {
            videoB.removeEventListener('canplaythrough', onCanPlay);
            resolve();
          };
          videoB.addEventListener('canplaythrough', onCanPlay);
          if (videoB.readyState >= 4) {
            videoB.removeEventListener('canplaythrough', onCanPlay);
            resolve();
          }
        });
        if (cancelled) return;

        // Start video A playing, keep B paused at 0
        videoA.play().catch(() => {});
        videoB.currentTime = 0;
        activeVideoRef.current = 'A';

        setVideoReady(true);
        setState('idle');
        onReady?.();
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
  }, [guideId, idleVideoUrl, spriteUrl]);

  // --------------------------------------------------------------------------
  // Audio setup: Connect Kokoro TTS audio to VisemeEngine analyser
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!audioUrl || !isSpeaking) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      visemeEngine.stopText();
      return;
    }

    // Create or reuse AudioContext
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const audioCtx = audioCtxRef.current;

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.src = audioUrl;
    audioRef.current = audio;

    // Create analyser
    if (!analyserRef.current) {
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;
      visemeEngine.connectAnalyser(analyser);
    }

    // Connect audio → analyser → destination
    try {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
      const source = audioCtx.createMediaElementSource(audio);
      source.connect(analyserRef.current!);
      analyserRef.current!.connect(audioCtx.destination);
      sourceNodeRef.current = source;
    } catch (e) {
      console.warn('[LifelikeAvatar] Audio source reconnection:', e);
    }

    // Prepare text-based prediction
    if (spokenText) {
      const wordCount = spokenText.split(/\s+/).length;
      const estimatedDuration = Math.max(1, wordCount * 0.15);
      visemeEngine.prepareText(spokenText, estimatedDuration);
    }

    if (audioCtx.state === 'suspended') audioCtx.resume();

    audio.play().catch(e => {
      console.warn('[LifelikeAvatar] Audio playback failed:', e);
    });

    const handleEnded = () => visemeEngine.stopText();
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audio.src = '';
      visemeEngine.stopText();
    };
  }, [audioUrl, isSpeaking, spokenText, visemeEngine]);

  // --------------------------------------------------------------------------
  // Update text prediction when spokenText changes mid-speech
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isSpeaking || !spokenText) return;
    const wordCount = spokenText.split(/\s+/).length;
    const estimatedDuration = Math.max(1, wordCount * 0.15);
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
          ctx.drawImage(activeVid, 0, 0, displayW, displayH);
        }
        if (nextVid.readyState >= 2) {
          ctx.globalAlpha = crossfadeProgressRef.current;
          ctx.drawImage(nextVid, 0, 0, displayW, displayH);
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
          ctx.drawImage(activeVid, 0, 0, displayW, displayH);
        }
      }

      // ==== LAYER 2: VISEME MOUTH OVERLAY (only when speaking) ====
      const sprite = spriteImgRef.current;
      if (isSpeaking && sprite) {
        const frame: VisemeFrame = visemeEngine.getCurrentFrame();

        const srcX = frame.spriteCol * CELL_W;
        const srcY = frame.spriteRow * CELL_H;

        const dstX = displayW * MOUTH_REGION.x;
        const dstY = displayH * MOUTH_REGION.y;
        const dstW = displayW * MOUTH_REGION.w;
        const dstH = displayH * MOUTH_REGION.h;

        // Mouth openness drives overlay opacity (0.5–1.0)
        const alpha = 0.5 + frame.weight * 0.5;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Rounded clip for soft edge blending
        const r = FEATHER_PX;
        ctx.beginPath();
        ctx.moveTo(dstX + r, dstY);
        ctx.lineTo(dstX + dstW - r, dstY);
        ctx.quadraticCurveTo(dstX + dstW, dstY, dstX + dstW, dstY + r);
        ctx.lineTo(dstX + dstW, dstY + dstH - r);
        ctx.quadraticCurveTo(dstX + dstW, dstY + dstH, dstX + dstW - r, dstY + dstH);
        ctx.lineTo(dstX + r, dstY + dstH);
        ctx.quadraticCurveTo(dstX, dstY + dstH, dstX, dstY + dstH - r);
        ctx.lineTo(dstX, dstY + r);
        ctx.quadraticCurveTo(dstX, dstY, dstX + r, dstY);
        ctx.closePath();
        ctx.clip();

        // Draw current viseme sprite cell
        ctx.drawImage(sprite, srcX, srcY, CELL_W, CELL_H, dstX, dstY, dstW, dstH);

        // Crossfade to next viseme if mid-transition
        if (frame.blendFactor > 0.05 && frame.blendFactor < 0.95) {
          const nextSrcX = frame.nextSpriteCol * CELL_W;
          const nextSrcY = frame.nextSpriteRow * CELL_H;
          ctx.globalAlpha = alpha * frame.blendFactor;
          ctx.drawImage(sprite, nextSrcX, nextSrcY, CELL_W, CELL_H, dstX, dstY, dstW, dstH);
        }

        ctx.restore();
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
      if (isListening && !isSpeaking) {
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
        borderRadius: 16,
        background: 'radial-gradient(ellipse at center, rgba(15,10,25,1) 0%, rgba(5,0,15,1) 100%)',
      }}
    >
      {/* Ambient glow border */}
      <div
        style={{
          position: 'absolute',
          inset: -2,
          borderRadius: 18,
          background: `linear-gradient(135deg, ${guideColor}22, transparent 40%, ${guideColor}11)`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

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
            borderRadius: 16,
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
