/**
 * LifelikeAvatar.tsx
 *
 * Kling AI-powered lifelike talking avatar for Living Codex™.
 * Displays Kling-generated video of the guide character with:
 *   - Idle ambient animation (breathing, micro-movements)
 *   - Lip-synced speaking animation driven by Kokoro TTS audio
 *   - Listening animation with gentle nodding
 *   - Smooth crossfade transitions between states
 *
 * Two display modes available in the parent HolographicAvatar:
 *   1. ORB — procedural Three.js energy orb
 *   2. LIFELIKE — this component (Kling video)
 *
 * @module codex/LifelikeAvatar
 */

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  getKlingAvatarService,
  type AvatarDisplayMode,
  type KlingMode,
} from './KlingAvatarService';

// ============================================================================
// Types
// ============================================================================

type AvatarState = 'loading' | 'idle' | 'speaking' | 'listening' | 'error';

interface LifelikeAvatarProps {
  /** Guide identifier (kore, aoede, leda, theia, selene, zephyr) */
  guideId: string;
  /** URL to the guide's portrait image (LoRA-generated) */
  portraitUrl: string;
  /** Whether the guide is currently speaking */
  isSpeaking: boolean;
  /** Whether the guide is listening to user */
  isListening: boolean;
  /** Audio blob URL from Kokoro TTS (for lip-sync) */
  audioUrl?: string;
  /** Text being spoken (alternative: use Kling's built-in TTS) */
  spokenText?: string;
  /** Quality mode */
  mode?: KlingMode;
  /** Container width */
  width?: string;
  /** Container height */
  height?: string;
  /** Callback when avatar video is ready */
  onReady?: () => void;
  /** Callback on error */
  onError?: (error: string) => void;
  /** Whether to use Kling's built-in TTS instead of Kokoro audio */
  useKlingTTS?: boolean;
}

// ============================================================================
// Loading Spinner
// ============================================================================

const GUIDE_COLORS: Record<string, string> = {
  kore: '#D4AF37',
  aoede: '#9B59B6',
  leda: '#FFB6C1',
  theia: '#2ECC71',
  selene: '#2471A3',
  zephyr: '#FF6B35',
};

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
      {/* Pulsing orb while loading */}
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
// Main Component
// ============================================================================

export default function LifelikeAvatar({
  guideId,
  portraitUrl,
  isSpeaking,
  isListening,
  audioUrl,
  spokenText,
  mode = 'std',
  width = '100%',
  height = '500px',
  onReady,
  onError,
  useKlingTTS = false,
}: LifelikeAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const idleVideoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<AvatarState>('loading');
  const [idleVideoUrl, setIdleVideoUrl] = useState<string | null>(null);
  const [speakingVideoUrl, setSpeakingVideoUrl] = useState<string | null>(null);
  const [listeningVideoUrl, setListeningVideoUrl] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<'idle' | 'speaking' | 'listening'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loadingMessage, setLoadingMessage] = useState('Awakening guide...');

  const klingService = useMemo(() => getKlingAvatarService(), []);
  const guideColor = GUIDE_COLORS[guideId] || '#D4AF37';

  // --------------------------------------------------------------------------
  // Pre-warm: generate idle video on mount
  // --------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function warmUp() {
      try {
        setState('loading');
        setLoadingMessage('Generating idle animation...');

        const idleUrl = await klingService.generateIdleVideo(guideId, portraitUrl, mode);
        if (cancelled) return;

        setIdleVideoUrl(idleUrl);
        setState('idle');
        onReady?.();

        // Pre-generate speaking + listening animations in background
        klingService.generateSpeakingAnimationVideo(guideId, portraitUrl, mode)
          .then(url => { if (!cancelled) setSpeakingVideoUrl(url); })
          .catch(e => console.warn('[LifelikeAvatar] Speaking anim failed:', e.message));
        klingService.generateListeningVideo(guideId, portraitUrl, mode)
          .then(url => { if (!cancelled) setListeningVideoUrl(url); })
          .catch(e => console.warn('[LifelikeAvatar] Listening anim failed:', e.message));
      } catch (err: any) {
        if (cancelled) return;
        console.warn('[LifelikeAvatar] Kling warm-up failed, using portrait fallback:', err.message);
        // Don't call onError — show animated portrait instead of falling back to orb
        setState('idle');
      }
    }

    warmUp();

    return () => {
      cancelled = true;
      klingService.cancelAll();
    };
  }, [guideId, portraitUrl, mode]);

  // Listening + speaking animations are pre-generated in warmUp above

  // --------------------------------------------------------------------------
  // Speaking: crossfade to pre-generated speaking animation when Kokoro plays
  // No per-utterance Kling calls — just swap the cached video instantly
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (state === 'loading') return;

    if (isSpeaking && speakingVideoUrl) {
      setActiveVideo('speaking');
      setState('speaking');
    } else if (isListening && listeningVideoUrl) {
      setActiveVideo('listening');
      setState('idle');
    } else {
      setActiveVideo('idle');
      setState('idle');
    }
  }, [isSpeaking, isListening, speakingVideoUrl, listeningVideoUrl, state]);


  // State transitions are handled by the crossfade effect above

  // --------------------------------------------------------------------------
  // When speaking video ends, return to idle
  // --------------------------------------------------------------------------
  const handleSpeakingEnded = useCallback(() => {
    // Don't null out speakingVideoUrl — it's pre-generated and reusable
    setActiveVideo('idle');
    setState('idle');
  }, []);

  // --------------------------------------------------------------------------
  // Current video URL
  // --------------------------------------------------------------------------
  const currentVideoUrl = useMemo(() => {
    switch (activeVideo) {
      case 'speaking': return speakingVideoUrl;
      case 'listening': return listeningVideoUrl || idleVideoUrl;
      case 'idle': default: return idleVideoUrl;
    }
  }, [activeVideo, idleVideoUrl, speakingVideoUrl, listeningVideoUrl]);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
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

      {/* Loading state */}
      {state === 'loading' && (
        <LoadingOverlay guideId={guideId} message={loadingMessage} />
      )}

      {/* Error state — still show portrait, just note the error subtly */}
      {state === 'error' && (
        <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center', zIndex: 10 }}>
          <p style={{ color: '#ff6b6b88', fontSize: 11 }}>Video generation unavailable</p>
        </div>
      )}

      {/* Main video (speaking or active) */}
      {currentVideoUrl && (
        <video
          ref={videoRef}
          src={currentVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: 16,
            opacity: state === 'loading' ? 0 : 1,
            transition: 'opacity 0.8s ease-in-out',
          }}
        />
      )}

      {/* Animated portrait — shown when no video (Kling loading/failed) */}
      {!currentVideoUrl && state !== 'loading' && (
        <>
          <style>{`
            @keyframes lifelike-breathe { 0%,100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.015) translateY(-2px); } }
            @keyframes lifelike-glow { 0%,100% { box-shadow: 0 0 40px ${guideColor}40, 0 0 80px ${guideColor}15; } 50% { box-shadow: 0 0 60px ${guideColor}60, 0 0 120px ${guideColor}25; } }
            @keyframes lifelike-speak { 0%,100% { box-shadow: 0 0 50px ${guideColor}70, 0 0 100px ${guideColor}35; filter: brightness(1.05); } 50% { box-shadow: 0 0 80px ${guideColor}90, 0 0 140px ${guideColor}50; filter: brightness(1.12); } }
            @keyframes lifelike-ring { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          `}</style>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(ellipse at center, ${guideColor}18 0%, #0A0A1A 70%)` }}>
            <div style={{ position: 'relative', width: '70%', maxWidth: 320, aspectRatio: '1' }}>
              {/* Holographic rings */}
              <div style={{ position: 'absolute', inset: -16, borderRadius: '50%', border: `2px solid ${guideColor}20`, animation: 'lifelike-ring 25s linear infinite' }} />
              <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: `1px solid ${guideColor}12`, animation: 'lifelike-ring 18s linear infinite reverse' }} />
              {/* Portrait with effects */}
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
                border: `3px solid ${guideColor}50`,
                animation: isSpeaking
                  ? 'lifelike-speak 1s ease-in-out infinite, lifelike-breathe 2s ease-in-out infinite'
                  : 'lifelike-glow 3s ease-in-out infinite, lifelike-breathe 4s ease-in-out infinite',
                transition: 'box-shadow 0.4s ease',
              }}>
                <img
                  src={portraitUrl}
                  alt={`${guideId} guide`}
                  onError={() => onError?.('Portrait image failed to load')}
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%',
                    filter: isSpeaking ? 'brightness(1.08)' : 'brightness(1)',
                    transition: 'filter 0.3s ease',
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Subtle vignette overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 16,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* State indicator (subtle) */}
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
              state === 'speaking' ? '#2ECC71' :
              state === 'loading' ? '#F39C12' :
              state === 'error' ? '#E74C3C' :
              guideColor,
            boxShadow: `0 0 6px ${
              state === 'speaking' ? '#2ECC71' :
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
          {state === 'loading' ? 'Generating...' :
           state === 'speaking' ? 'Speaking' :
           isListening ? 'Listening' :
           'Present'}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Utilities
// ============================================================================

/** Convert a blob URL to base64 string for uploading */
async function blobUrlToBase64(blobUrl: string): Promise<string> {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Strip the data:audio/...;base64, prefix
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export { LifelikeAvatar, type LifelikeAvatarProps, type AvatarState };
