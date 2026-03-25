/**
 * SimliAvatar.tsx
 * Real-time lip-synced avatar powered by Simli.ai
 *
 * Flow: Kokoro TTS generates WAV audio → decode to PCM16 16KHz → send to Simli → WebRTC video stream
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

// Dynamic import to avoid Rollup resolution issues in production build
let SimliClient: any = null;
let LogLevel: any = null;
const loadSimliClient = async () => {
  if (!SimliClient) {
    const mod = await import('simli-client');
    SimliClient = mod.SimliClient;
    LogLevel = mod.LogLevel;
  }
  return { SimliClient, LogLevel };
};

// ============================================================================
// Types
// ============================================================================

interface SimliAvatarProps {
  guideId: string;
  faceId: string;
  isSpeaking: boolean;
  isListening: boolean;
  width?: string | number;
  height?: string | number;
  guideColor?: string;
  onReady?: () => void;
  onError?: (error: string) => void;
  onSpeakingChange?: (speaking: boolean) => void;
}

// ============================================================================
// Audio Playback Utilities
// ============================================================================

// No manual PCM conversion needed — we route decoded audio through a
// MediaStreamDestination so Simli's own AudioWorklet handles chunking,
// sample-rate conversion, and real-time streaming.

// ============================================================================
// SimliAvatar Component
// ============================================================================

export default function SimliAvatar({
  guideId,
  faceId,
  isSpeaking,
  isListening,
  width = '100%',
  height = '500px',
  guideColor = '#D4AF37',
  onReady,
  onError,
  onSpeakingChange,
}: SimliAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const simliRef = useRef<any>(null);
  // AudioContext + MediaStreamDestination for routing TTS audio → Simli AudioWorklet
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const streamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Initialize Simli connection ──
  useEffect(() => {
    let cancelled = false;

    async function initSimli() {
      if (!faceId) {
        setError('No Simli faceId configured');
        setLoading(false);
        onError?.('No Simli faceId configured');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log(`[SimliAvatar] Initializing for guide=${guideId}, faceId=${faceId}`);

        // 1. Get session token from our server (keeps API key secure)
        const tokenRes = await fetch('/api/simli/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ faceId, maxSessionLength: 3600, maxIdleTime: 3600 }),
        });

        if (!tokenRes.ok) {
          const err = await tokenRes.json().catch(() => ({ error: 'Token request failed' }));
          throw new Error(err.error || `Token failed: ${tokenRes.status}`);
        }

        const { session_token } = await tokenRes.json();
        if (!session_token) throw new Error('No session token returned');
        if (cancelled) return;

        console.log('[SimliAvatar] Got session token, connecting...');

        // 2. Get ICE servers for P2P mode
        let iceServers: RTCIceServer[] | null = null;
        try {
          const iceRes = await fetch('/api/simli/ice-servers');
          if (iceRes.ok) {
            iceServers = await iceRes.json();
          }
        } catch {
          console.warn('[SimliAvatar] ICE servers unavailable, using livekit mode');
        }
        if (cancelled) return;

        // 3. Initialize SimliClient (dynamically loaded)
        const videoEl = videoRef.current;
        const audioEl = audioRef.current;
        if (!videoEl || !audioEl) throw new Error('Video/audio elements not mounted');

        const { SimliClient: SC, LogLevel: LL } = await loadSimliClient();
        const transportMode = iceServers ? 'p2p' : 'livekit';
        const client = new SC(
          session_token,
          videoEl,
          audioEl,
          iceServers,
          LL.INFO,
          transportMode,
        );

        // 4. Listen for events
        client.on('start', () => {
          console.log('[SimliAvatar] WebRTC connected, avatar visible');
          if (!cancelled) {
            setConnected(true);
            setLoading(false);
            onReady?.();
          }
        });

        client.on('speaking', () => {
          console.log('[SimliAvatar] Avatar speaking');
          onSpeakingChange?.(true);
        });

        client.on('silent', () => {
          console.log('[SimliAvatar] Avatar silent');
          onSpeakingChange?.(false);
        });

        client.on('error', () => {
          console.error('[SimliAvatar] WebRTC error — will auto-reconnect');
          if (!cancelled) {
            setConnected(false);
            // Auto-reconnect after a brief delay
            setTimeout(() => {
              if (!cancelled) {
                console.log('[SimliAvatar] Auto-reconnecting...');
                initSimli();
              }
            }, 2000);
          }
        });

        client.on('startup_error', (msg: string) => {
          console.error('[SimliAvatar] Startup error:', msg);
          if (!cancelled) {
            setError(msg);
            setLoading(false);
            onError?.(msg);
          }
        });

        // 5. Start the connection
        await client.start();
        simliRef.current = client;

        // 6. Set up MediaStream audio pipeline for TTS → Simli lip-sync.
        // Create a 16kHz AudioContext + MediaStreamDestination, then connect
        // the destination's track to Simli's AudioWorklet via listenToMediastreamTrack.
        // This routes decoded TTS audio through Simli's own chunking/streaming pipeline.
        try {
          const playCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          const dest = playCtx.createMediaStreamDestination();
          playbackCtxRef.current = playCtx;
          streamDestRef.current = dest;
          const audioTrack = dest.stream.getAudioTracks()[0];
          if (audioTrack) {
            client.listenToMediastreamTrack(audioTrack);
            console.log('[SimliAvatar] Audio pipeline connected: TTS → MediaStream → Simli AudioWorklet');
          } else {
            console.warn('[SimliAvatar] No audio track from MediaStreamDestination');
          }
        } catch (pipeErr) {
          console.error('[SimliAvatar] Audio pipeline setup failed:', pipeErr);
        }

        console.log('[SimliAvatar] Client started, waiting for WebRTC...');
      } catch (err: any) {
        if (cancelled) return;
        console.error('[SimliAvatar] Init failed:', err);
        setError(err.message || 'Failed to connect');
        setLoading(false);
        onError?.(err.message);
      }
    }

    initSimli();

    return () => {
      cancelled = true;
      if (simliRef.current) {
        console.log('[SimliAvatar] Stopping client');
        simliRef.current.stop();
        simliRef.current = null;
      }
      if (playbackCtxRef.current) {
        playbackCtxRef.current.close().catch(() => {});
        playbackCtxRef.current = null;
      }
      streamDestRef.current = null;
      setConnected(false);
    };
  }, [faceId, guideId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Public method: send audio to Simli via MediaStream pipeline ──
  // Decodes the WAV blob and plays it through the AudioContext connected to
  // the MediaStreamDestination → Simli AudioWorklet → WebSocket → lip-sync.
  const sendAudioToSimli = useCallback(async (audioBlob: Blob) => {
    const ctx = playbackCtxRef.current;
    const dest = streamDestRef.current;
    if (!ctx || !dest) {
      console.warn('[SimliAvatar] Cannot send audio — playback pipeline not ready');
      return;
    }

    try {
      if (ctx.state === 'suspended') await ctx.resume();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(dest);
      source.start(0);
      console.log(`[SimliAvatar] Playing ${audioBuffer.duration.toFixed(2)}s of audio through Simli pipeline`);
    } catch (err) {
      console.error('[SimliAvatar] Audio playback to Simli failed:', err);
    }
  }, []);

  // ── Expose sendAudioToSimli via ref-like pattern ──
  // Store callback on window so KokoroTTSManager can call it
  useEffect(() => {
    (window as any).__simliSendAudio = connected ? sendAudioToSimli : null;
    return () => { (window as any).__simliSendAudio = null; };
  }, [connected, sendAudioToSimli]);

  // ── Clear buffer when not speaking ──
  useEffect(() => {
    if (!isSpeaking && simliRef.current) {
      simliRef.current.ClearBuffer();
    }
  }, [isSpeaking]);

  // ── Render ──
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
      {/* Simli WebRTC video — the lip-synced avatar */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          borderRadius: 14,
          opacity: connected ? 1 : 0,
          transition: 'opacity 0.6s ease-in-out',
        }}
      />

      {/* Simli audio output */}
      <audio ref={audioRef} autoPlay />

      {/* Loading overlay */}
      {loading && (
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
              background: `radial-gradient(circle, ${guideColor}44 0%, ${guideColor}11 60%, transparent 70%)`,
              boxShadow: `0 0 40px ${guideColor}33, 0 0 80px ${guideColor}11`,
              animation: 'simli-pulse 2s ease-in-out infinite',
            }}
          />
          <p
            style={{
              marginTop: 16,
              color: `${guideColor}cc`,
              fontSize: 13,
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Materializing avatar...
          </p>
          <style>{`
            @keyframes simli-pulse {
              0%, 100% { transform: scale(1); opacity: 0.6; }
              50% { transform: scale(1.15); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* Error overlay */}
      {error && !loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(10,6,25,0.9)',
            zIndex: 10,
          }}
        >
          <p style={{ color: '#ff6b6b', fontSize: 14, textAlign: 'center', padding: 20 }}>
            {error}
          </p>
        </div>
      )}

      {/* Listening indicator */}
      {isListening && connected && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 3,
            zIndex: 5,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: 3,
                height: 16,
                borderRadius: 2,
                background: guideColor,
                animation: `simli-eq ${0.3 + i * 0.1}s ease-in-out infinite alternate`,
              }}
            />
          ))}
          <style>{`
            @keyframes simli-eq {
              0% { transform: scaleY(0.3); opacity: 0.5; }
              100% { transform: scaleY(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
