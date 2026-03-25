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
// Audio Conversion Utilities
// ============================================================================

/** Decode a WAV blob to PCM16 Uint8Array at 16KHz for Simli */
async function wavBlobToPCM16(blob: Blob): Promise<Uint8Array> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Resample to 16kHz via OfflineAudioContext
    const duration = audioBuffer.duration;
    const numSamples = Math.ceil(duration * 16000);
    const offlineCtx = new OfflineAudioContext(1, numSamples, 16000);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);
    const resampled = await offlineCtx.startRendering();
    const samples = resampled.getChannelData(0);

    // Convert Float32 [-1, 1] to Int16 PCM
    const pcm16 = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    return new Uint8Array(pcm16.buffer);
  } finally {
    await audioCtx.close();
  }
}

/** Send PCM16 data to Simli in paced chunks to simulate real-time streaming */
function sendPacedAudio(client: any, pcm16: Uint8Array): Promise<void> {
  return new Promise((resolve) => {
    // Simli expects chunks matching its AudioWorklet buffer: 6000 bytes (3000 Int16 samples)
    // At 16kHz, 3000 samples = 187.5ms of audio
    const CHUNK_SIZE = 6000;
    const CHUNK_INTERVAL_MS = 180; // slightly less than 187.5ms to avoid starving
    let offset = 0;

    function sendNext() {
      if (offset >= pcm16.length) {
        resolve();
        return;
      }
      const chunk = pcm16.slice(offset, Math.min(offset + CHUNK_SIZE, pcm16.length));
      try {
        client.sendAudioData(chunk);
      } catch (err) {
        console.error('[SimliAvatar] sendAudioData error:', err);
        resolve();
        return;
      }
      offset += CHUNK_SIZE;
      if (offset < pcm16.length) {
        setTimeout(sendNext, CHUNK_INTERVAL_MS);
      } else {
        resolve();
      }
    }

    sendNext();
  });
}

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

        // 3. Initialize SimliClient — use DEBUG log level to see internal state
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
          LL.DEBUG,
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
            setTimeout(() => {
              if (!cancelled) {
                console.log('[SimliAvatar] Auto-reconnecting...');
                initSimli();
              }
            }, 3000);
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
      setConnected(false);
    };
  }, [faceId, guideId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Public method: send audio to Simli via sendAudioData with real-time pacing ──
  const sendAudioToSimli = useCallback(async (audioBlob: Blob) => {
    const client = simliRef.current;
    if (!client) {
      console.warn('[SimliAvatar] Cannot send audio — not connected');
      return;
    }

    try {
      const pcm16 = await wavBlobToPCM16(audioBlob);
      const durationSec = (pcm16.length / 2) / 16000;
      console.log(`[SimliAvatar] Sending ${pcm16.length} bytes (${durationSec.toFixed(2)}s) via paced sendAudioData`);
      await sendPacedAudio(client, pcm16);
      console.log('[SimliAvatar] Audio send complete');
    } catch (err) {
      console.error('[SimliAvatar] Audio conversion/send failed:', err);
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
