/**
 * HOLOGRAPHIC AVATAR — EMBODY
 * ============================
 * Three.js holographic guide avatar with real-time Gemini Live API integration.
 *
 * Features:
 * - WebGL-rendered holographic avatar with sacred geometry
 * - Real-time voice interaction via Gemini Live streaming
 * - Morph-target facial expressions (joy, concern, curiosity, calm, listening)
 * - Particle system background with phase-specific coloring
 * - Audio waveform visualization synced to guide speech
 * - Gesture system mapped to emotional tone detection
 * - Accessibility: reduced motion support + text fallback
 * - KOKORO TTS — 82M parameter neural TTS replacing SpeechSynthesis
 * - Voice selector with unique pastel/neon color orbs per voice
 *
 * Architecture:
 * 1. Three.js Canvas (avatar model + particles + lighting)
 * 2. Gemini Live Session (streaming conversation)
 * 3. Speech-to-Text (user voice input)
 * 4. Kokoro TTS (guide voice output — neural, natural-sounding)
 * 5. Escalation Pipeline (every message passes through VITALIZE)
 * 6. Citation Engine (evidence injection via FORTIFY)
 */

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Environment,
  Float,
  MeshDistortMaterial,
  Sparkles,
  Text,
  useGLTF,
  OrbitControls,
} from '@react-three/drei';
import * as THREE from 'three';

// Kokoro TTS integration
import {
  KokoroTTSManager,
  GUIDE_VOICE_DEFAULTS,
  KOKORO_VOICE_CATALOG,
  type KokoroVoice,
} from './KokoroTTSService';
import { VoiceSelector, VoiceSettingsButton } from './VoiceSelector';

// Avatar system integration
import {
  type AvatarPreset,
  type AvatarCustomization,
  getPresetsForGuide,
  getDefaultPreset,
  AVATAR_PRESETS,
  EXPRESSION_CONFIGS,
  VISEME_MAP,
} from './AvatarSystem';
import { RealisticAvatarRenderer } from './RealisticAvatarRenderer';
import { AvatarSelector, AvatarSettingsButton } from './AvatarSelector';

// Kling AI lifelike avatar system
import LifelikeAvatar from './LifelikeAvatar';
import { type AvatarDisplayMode } from './KlingAvatarService';

// Simli real-time lip-sync avatar
import SimliAvatar from './SimliAvatar';

// Ambient particle field for depth
import ParticleField from './ParticleField';

// Simli face IDs per guide — set VITE_SIMLI_FACE_ID in .env
// For multiple guides, use VITE_SIMLI_FACE_ID_KORE, VITE_SIMLI_FACE_ID_AOEDE, etc.
const SIMLI_FACE_IDS: Record<string, string> = (() => {
  const ids: Record<string, string> = {};
  const globalId = (import.meta as any).env?.VITE_SIMLI_FACE_ID || '';
  if (globalId) {
    ['kore','aoede','leda','theia','selene','zephyr'].forEach(g => { ids[g] = globalId; });
  }
  // Per-guide overrides
  const guides = ['kore','aoede','leda','theia','selene','zephyr'];
  for (const g of guides) {
    const envKey = `VITE_SIMLI_FACE_ID_${g.toUpperCase()}`;
    const val = (import.meta as any).env?.[envKey];
    if (val) ids[g] = val;
  }
  return ids;
})();

// Guide character system
import { getGuideCharacter, CHARACTER_TO_GUIDE_TYPE } from './GuideCharacters';
import { GuideCharacterSelector } from './GuideCharacterSelector';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface HolographicAvatarProps {
  guideType: GuideType;
  userProfile: UserProfile;
  systemPrompt: string;
  onMessage: (message: GuideMessage) => void;
  onEscalation: (event: EscalationEvent) => void;
  onSessionEnd: () => void;
  isActive: boolean;
  onSendMessage?: (message: string) => Promise<string>;
  /** User's preferred guide character ID (kore, aoede, leda, theia, selene, zephyr) */
  preferredGuideId?: string;
  /** User's preferred Kokoro voice ID */
  preferredVoiceId?: string;
  /** Callback when user changes guide character */
  onChangeGuide?: (guideId: string, voiceId: string) => void;
}

type GuideType =
  | 'codex_orientation'
  | 'archetype_reflection'
  | 'journal_companion'
  | 'ns_support'
  | 'resource_librarian'
  | 'community_concierge';

interface UserProfile {
  userId: string;
  phase: number;
  primaryArchetype: string;
  shadowArchetype: string;
  woundPrioritySet: string[];
  nsDominant: string;
  pathway: string;
}

interface GuideMessage {
  role: 'user' | 'guide';
  content: string;
  timestamp: string;
  citations?: string[];
  emotion?: AvatarEmotion;
}

interface EscalationEvent {
  triggerType: string;
  severity: string;
  content: string;
}

type AvatarEmotion =
  | 'neutral'
  | 'joy'
  | 'concern'
  | 'curiosity'
  | 'calm'
  | 'listening'
  | 'empathy'
  | 'celebration';

type AvatarGesture =
  | 'idle'
  | 'speaking'
  | 'nodding'
  | 'thinking'
  | 'opening'
  | 'holding_space'
  | 'welcoming';

// ============================================================================
// GUIDE VISUAL CONFIGURATIONS
// ============================================================================

interface GuideVisualConfig {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  emissiveColor: string;
  particleColor: string;
  voiceId: string;
  avatarScale: number;
  ambientIntensity: number;
  geometryType: 'sphere' | 'torus' | 'icosahedron' | 'octahedron' | 'dodecahedron' | 'torusKnot';
  distortSpeed: number;
}

const GUIDE_CONFIGS: Record<GuideType, GuideVisualConfig> = {
  codex_orientation: {
    name: 'Kore',
    primaryColor: '#C9A96E',
    secondaryColor: '#2D1B35',
    emissiveColor: '#C9A96E',
    particleColor: '#FFD700',
    voiceId: 'af_kore',
    avatarScale: 1.2,
    ambientIntensity: 0.6,
    geometryType: 'icosahedron',
    distortSpeed: 0.3,
  },
  archetype_reflection: {
    name: 'Aoede',
    primaryColor: '#7B4B94',
    secondaryColor: '#1A1A2E',
    emissiveColor: '#9B59B6',
    particleColor: '#B39DDB',
    voiceId: 'af_aoede',
    avatarScale: 1.1,
    ambientIntensity: 0.5,
    geometryType: 'dodecahedron',
    distortSpeed: 0.2,
  },
  journal_companion: {
    name: 'Leda',
    primaryColor: '#B76E79',
    secondaryColor: '#2D1B35',
    emissiveColor: '#E91E63',
    particleColor: '#F8BBD0',
    voiceId: 'af_heart',
    avatarScale: 1.0,
    ambientIntensity: 0.7,
    geometryType: 'sphere',
    distortSpeed: 0.15,
  },
  ns_support: {
    name: 'Theia',
    primaryColor: '#2E8B57',
    secondaryColor: '#0D3B21',
    emissiveColor: '#4CAF50',
    particleColor: '#A5D6A7',
    voiceId: 'af_nova',
    avatarScale: 1.15,
    ambientIntensity: 0.65,
    geometryType: 'torusKnot',
    distortSpeed: 0.1,
  },
  resource_librarian: {
    name: 'Selene',
    primaryColor: '#4169E1',
    secondaryColor: '#0D1B3E',
    emissiveColor: '#5C6BC0',
    particleColor: '#90CAF9',
    voiceId: 'bf_emma',
    avatarScale: 1.0,
    ambientIntensity: 0.55,
    geometryType: 'octahedron',
    distortSpeed: 0.25,
  },
  community_concierge: {
    name: 'Zephyr',
    primaryColor: '#E8834A',
    secondaryColor: '#3E1B0D',
    emissiveColor: '#FF9800',
    particleColor: '#FFE0B2',
    voiceId: 'af_bella',
    avatarScale: 1.1,
    ambientIntensity: 0.6,
    geometryType: 'torus',
    distortSpeed: 0.35,
  },
};

// ============================================================================
// PHASE-SPECIFIC VISUAL PARAMETERS
// ============================================================================

const PHASE_AMBIENTS: Record<number, { fog: string; intensity: number }> = {
  1: { fog: '#1A0A0A', intensity: 0.4 },   // Threshold — deep crimson dark
  2: { fog: '#0A0A1A', intensity: 0.3 },   // Descent — deep blue dark
  3: { fog: '#0A1A1A', intensity: 0.45 },  // Naming — teal emergence
  4: { fog: '#1A0A2A', intensity: 0.5 },   // Mirror — violet depth
  5: { fog: '#050510', intensity: 0.2 },   // Void — near darkness
  6: { fog: '#1A0D05', intensity: 0.55 },  // Ember — warm dark
  7: { fog: '#0A1A0A', intensity: 0.6 },   // Integration — forest
  8: { fog: '#1A1505', intensity: 0.7 },   // Embodiment — golden
  9: { fog: '#1A1A05', intensity: 0.8 },   // Offering — radiant
};

// ============================================================================
// AVATAR CORE GEOMETRY COMPONENT
// ============================================================================

interface AvatarCoreProps {
  config: GuideVisualConfig;
  emotion: AvatarEmotion;
  gesture: AvatarGesture;
  isSpeaking: boolean;
  audioLevel: number;
}

const AvatarCore: React.FC<AvatarCoreProps> = ({
  config,
  emotion,
  gesture,
  isSpeaking,
  audioLevel,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const timeRef = useRef(0);

  // Emotion → distortion mapping
  const emotionDistortion = useMemo(
    () => ({
      neutral: 0.3,
      joy: 0.5,
      concern: 0.15,
      curiosity: 0.4,
      calm: 0.1,
      listening: 0.2,
      empathy: 0.25,
      celebration: 0.6,
    }),
    []
  );

  // Emotion → emissive intensity mapping
  const emotionGlow = useMemo(
    () => ({
      neutral: 0.3,
      joy: 0.7,
      concern: 0.4,
      curiosity: 0.5,
      calm: 0.2,
      listening: 0.35,
      empathy: 0.45,
      celebration: 0.9,
    }),
    []
  );

  useFrame((state, delta) => {
    timeRef.current += delta;

    if (meshRef.current) {
      // Base rotation
      meshRef.current.rotation.y += delta * 0.15;

      // Speaking pulse — avatar breathes with voice
      if (isSpeaking) {
        const speakPulse = 1 + Math.sin(timeRef.current * 8) * 0.05 * audioLevel;
        meshRef.current.scale.setScalar(config.avatarScale * speakPulse);
      } else {
        // Idle breathing
        const breathe = 1 + Math.sin(timeRef.current * 1.5) * 0.02;
        meshRef.current.scale.setScalar(config.avatarScale * breathe);
      }

      // Gesture-based movement
      switch (gesture) {
        case 'nodding':
          meshRef.current.rotation.x =
            Math.sin(timeRef.current * 3) * 0.1;
          break;
        case 'thinking':
          meshRef.current.rotation.z =
            Math.sin(timeRef.current * 0.5) * 0.05;
          meshRef.current.position.y =
            Math.sin(timeRef.current * 0.8) * 0.1 + 0.1;
          break;
        case 'opening':
          const openScale = config.avatarScale * (1 + Math.sin(timeRef.current * 2) * 0.08);
          meshRef.current.scale.setScalar(openScale);
          break;
        case 'holding_space':
          meshRef.current.rotation.x = 0;
          meshRef.current.rotation.z = 0;
          break;
        case 'welcoming':
          meshRef.current.position.z =
            Math.sin(timeRef.current * 1.2) * 0.15;
          break;
        default:
          meshRef.current.rotation.x *= 0.95;
          meshRef.current.rotation.z *= 0.95;
      }
    }

    // Dynamic material properties
    if (materialRef.current) {
      materialRef.current.distort =
        emotionDistortion[emotion] + (isSpeaking ? audioLevel * 0.2 : 0);
      materialRef.current.emissiveIntensity = emotionGlow[emotion];
    }
  });

  const geometry = useMemo(() => {
    switch (config.geometryType) {
      case 'sphere':
        return <sphereGeometry args={[1, 64, 64]} />;
      case 'torus':
        return <torusGeometry args={[1, 0.4, 32, 64]} />;
      case 'icosahedron':
        return <icosahedronGeometry args={[1, 4]} />;
      case 'octahedron':
        return <octahedronGeometry args={[1, 4]} />;
      case 'dodecahedron':
        return <dodecahedronGeometry args={[1, 4]} />;
      case 'torusKnot':
        return <torusKnotGeometry args={[0.8, 0.3, 128, 32]} />;
      default:
        return <icosahedronGeometry args={[1, 4]} />;
    }
  }, [config.geometryType]);

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} scale={config.avatarScale}>
        {geometry}
        <MeshDistortMaterial
          ref={materialRef}
          color={config.primaryColor}
          emissive={config.emissiveColor}
          emissiveIntensity={0.3}
          roughness={0.1}
          metalness={0.8}
          distort={emotionDistortion[emotion]}
          speed={config.distortSpeed}
          transparent
          opacity={0.85}
        />
      </mesh>
    </Float>
  );
};

// ============================================================================
// SACRED PARTICLE SYSTEM
// ============================================================================

interface SacredParticlesProps {
  color: string;
  phase: number;
  isSpeaking: boolean;
}

const SacredParticles: React.FC<SacredParticlesProps> = ({
  color,
  phase,
  isSpeaking,
}) => {
  const particleCount = isSpeaking ? 200 : 100;
  const speed = isSpeaking ? 0.8 : 0.3;

  return (
    <>
      <Sparkles
        count={particleCount}
        scale={8}
        size={2}
        speed={speed}
        color={color}
        opacity={0.6}
      />
      {/* Inner constellation ring */}
      <Sparkles
        count={40}
        scale={3}
        size={4}
        speed={speed * 0.5}
        color={color}
        opacity={0.8}
      />
    </>
  );
};

// ============================================================================
// GUIDE NAME DISPLAY
// ============================================================================

interface GuideNameProps {
  name: string;
  color: string;
}

const GuideName: React.FC<GuideNameProps> = ({ name, color }) => {
  return (
    <Text
      position={[0, -2, 0]}
      fontSize={0.25}
      color={color}
      anchorX="center"
      anchorY="middle"
      font="/fonts/inter-medium.woff"
    >
      {name}
    </Text>
  );
};

// ============================================================================
// SCENE LIGHTING
// ============================================================================

interface SceneLightingProps {
  config: GuideVisualConfig;
  phase: number;
}

const SceneLighting: React.FC<SceneLightingProps> = ({ config, phase }) => {
  const phaseAmbient = PHASE_AMBIENTS[phase] || PHASE_AMBIENTS[1];

  return (
    <>
      <ambientLight intensity={phaseAmbient.intensity} />
      <pointLight
        position={[5, 5, 5]}
        intensity={1}
        color={config.primaryColor}
      />
      <pointLight
        position={[-5, -3, -5]}
        intensity={0.5}
        color={config.secondaryColor}
      />
      <spotLight
        position={[0, 8, 0]}
        angle={0.3}
        penumbra={1}
        intensity={config.ambientIntensity}
        color={config.emissiveColor}
      />
      <fog
        attach="fog"
        args={[phaseAmbient.fog, 5, 25]}
      />
    </>
  );
};

// ============================================================================
// AUDIO WAVEFORM RING
// ============================================================================

interface WaveformRingProps {
  audioLevel: number;
  color: string;
  isSpeaking: boolean;
}

const WaveformRing: React.FC<WaveformRingProps> = ({
  audioLevel,
  color,
  isSpeaking,
}) => {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.5;
      const scale = isSpeaking ? 1.5 + audioLevel * 0.5 : 1.5;
      ringRef.current.scale.setScalar(scale);
    }
  });

  if (!isSpeaking && audioLevel < 0.01) return null;

  return (
    <mesh ref={ringRef} position={[0, 0, -0.5]}>
      <torusGeometry args={[1.5, 0.02, 16, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={audioLevel * 0.8}
      />
    </mesh>
  );
};

// ============================================================================
// GEMINI LIVE SESSION HOOK — With Kokoro TTS
// ============================================================================

interface UseGeminiLiveReturn {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  micLevel: number;
  currentEmotion: AvatarEmotion;
  currentGesture: AvatarGesture;
  transcript: string;
  sendTextMessage: (text: string) => Promise<void>;
  startListening: () => void;
  stopListening: () => void;
  endSession: () => void;
  // Kokoro TTS additions
  currentVoice: string;
  setVoice: (voiceId: string) => void;
  ttsSpeed: number;
  setTtsSpeed: (speed: number) => void;
  speakText: (text: string, voiceOverride?: string) => void;
  ttsReady: boolean;
  ttsLoading: string;
  // Kling lifelike avatar additions
  lastSpokenText: string;
  lastAudioUrl: string | undefined;
}

function useGeminiLive(
  systemPrompt: string,
  guideConfig: GuideVisualConfig,
  onMessage: (msg: GuideMessage) => void,
  onEscalation: (event: EscalationEvent) => void,
  onSendMessage?: (message: string) => Promise<string>
): UseGeminiLiveReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentEmotion, setCurrentEmotion] = useState<AvatarEmotion>('neutral');
  const [currentGesture, setCurrentGesture] = useState<AvatarGesture>('idle');
  const [transcript, setTranscript] = useState('');
  const [currentVoice, setCurrentVoice] = useState(() => {
    try { return localStorage.getItem('codex_voice') || guideConfig.voiceId; } catch { return guideConfig.voiceId; }
  });
  const [ttsReady, setTtsReady] = useState(false);
  const [ttsLoading, setTtsLoading] = useState('');
  const [ttsSpeed, setTtsSpeedState] = useState(() => {
    try { const s = localStorage.getItem('codex_tts_speed'); return s ? parseFloat(s) : 1.0; } catch { return 1.0; }
  });
  const [lastSpokenText, setLastSpokenText] = useState('');
  const [lastAudioUrl, setLastAudioUrl] = useState<string | undefined>(undefined);
  const [micLevel, setMicLevel] = useState(0);

  const sessionRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const pendingTranscriptRef = useRef<string>('');
  const shouldKeepListeningRef = useRef(false);
  const kokoroRef = useRef<KokoroTTSManager | null>(null);
  const audioLevelFrameRef = useRef<number | null>(null);
  // VAD: mic stream + silence timer for fast end-of-speech detection
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micAudioCtxRef = useRef<AudioContext | null>(null);
  const micFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  // Ref to track isSpeaking without stale closure issues in recognition callbacks
  const isSpeakingRef = useRef(false);

  // Initialize Kokoro TTS
  useEffect(() => {
    setIsConnected(true);

    const kokoro = new KokoroTTSManager();
    kokoroRef.current = kokoro;

    // Listen for Kokoro events
    kokoro.addEventListener('start', () => {
      setIsSpeaking(true);
      isSpeakingRef.current = true;
      // Mute mic tracks to prevent picking up TTS/Simli audio output
      if (micStreamRef.current) {
        micStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
      }
    });

    kokoro.addEventListener('end', () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      setCurrentGesture('idle');
      // Unmute mic tracks after a delay (Simli may still have tail-end audio)
      setTimeout(() => {
        if (micStreamRef.current) {
          micStreamRef.current.getAudioTracks().forEach(t => { t.enabled = true; });
        }
      }, 800);
      // Resume listening if user had voice mode on — delay to avoid picking up tail-end audio
      if (shouldKeepListeningRef.current && recognitionRef.current === null) {
        setTimeout(() => {
          if (shouldKeepListeningRef.current && !isSpeakingRef.current) {
            startListeningInternal();
          }
        }, 2000);
      }
    });

    kokoro.addEventListener('error', (data: any) => {
      console.error('[Kokoro TTS] Error:', data?.message);
      setIsSpeaking(false);
      setCurrentGesture('idle');
      setTtsLoading('Kokoro unavailable — retrying...');
    });

    kokoro.addEventListener('loading', (data: any) => {
      setTtsLoading(data?.progress || '');
    });

    // Restore saved voice/speed or fall back to guide default
    const savedVoice = (() => { try { return localStorage.getItem('codex_voice'); } catch { return null; } })();
    const initVoice = savedVoice || GUIDE_VOICE_DEFAULTS[guideConfig.name] || guideConfig.voiceId;
    kokoro.setVoice(initVoice);
    setCurrentVoice(initVoice);
    const savedSpeed = (() => { try { const s = localStorage.getItem('codex_tts_speed'); return s ? parseFloat(s) : null; } catch { return null; } })();
    if (savedSpeed) kokoro.setSpeed(savedSpeed);

    // Initialize the model
    kokoro.initialize()
      .then(() => {
        setTtsReady(true);
        setTtsLoading('');
        console.log(`[Kokoro TTS] Ready for ${guideConfig.name}`);
      })
      .catch((err) => {
        console.warn('[Kokoro TTS] Init failed:', err);
        setTtsLoading('Kokoro loading failed — retrying...');
        // Retry init after 5s
        setTimeout(() => {
          kokoroRef.current?.initialize().then(() => {
            setTtsReady(true);
            setTtsLoading('');
          }).catch(() => {});
        }, 5000);
      });

    // Audio level animation loop — reads real RMS from Kokoro analyser
    const updateAudioLevel = () => {
      if (kokoroRef.current) {
        const level = kokoroRef.current.getAudioLevel();
        setAudioLevel(level);
      }
      audioLevelFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };
    audioLevelFrameRef.current = requestAnimationFrame(updateAudioLevel);

    // Stop all audio on page unload (prevents lingering playback)
    const handleUnload = () => {
      kokoro.stop();
      kokoro.dispose();
      window.speechSynthesis?.cancel();
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      if (audioLevelFrameRef.current) {
        cancelAnimationFrame(audioLevelFrameRef.current);
      }
      kokoro.stop();
      kokoro.dispose();
      kokoroRef.current = null;
    };
  }, []);

  // ── Text-to-Speech: Kokoro TTS only (server-side) ──
  const speakText = useCallback((text: string, voiceOverride?: string) => {
    const kokoro = kokoroRef.current;
    const voice = voiceOverride || currentVoice;
    // Strip ™/®/© symbols so TTS doesn't say "trademark" / "registered" / "copyright"
    const cleanText = text.replace(/[™®©]/g, '');
    console.log(`[speakText] voice=${voice}, kokoroReady=${kokoro?.getState().isReady}`);
    if (kokoro && kokoro.getState().isReady) {
      kokoro.resumeAudioContext().then(() => {
        kokoro.speak(cleanText, voice).catch((err: any) => {
          console.error('[Kokoro TTS] Speak failed:', err);
          setIsSpeaking(false);
          setCurrentGesture('idle');
        });
      });
    } else {
      console.warn('[speakText] Kokoro not ready yet, queuing retry...');
      // Retry once after 2s if model is still loading
      setTimeout(() => {
        const k = kokoroRef.current;
        if (k && k.getState().isReady) {
          k.speak(cleanText, voice).catch(() => {});
        }
      }, 2000);
    }
  }, [currentVoice]);

  // Browser SpeechSynthesis DELETED — Kokoro server TTS only

  // Set voice (persisted to localStorage)
  const setVoice = useCallback((voiceId: string) => {
    setCurrentVoice(voiceId);
    try { localStorage.setItem('codex_voice', voiceId); } catch {}
    if (kokoroRef.current) {
      kokoroRef.current.setVoice(voiceId);
    }
  }, []);

  // Set TTS speed (0.5–2.0, persisted to localStorage)
  const setTtsSpeed = useCallback((speed: number) => {
    const clamped = Math.max(0.5, Math.min(2.0, speed));
    setTtsSpeedState(clamped);
    try { localStorage.setItem('codex_tts_speed', String(clamped)); } catch {}
    if (kokoroRef.current) {
      kokoroRef.current.setSpeed(clamped);
    }
  }, []);

  // Detect emotion from response text
  const detectEmotion = useCallback((text: string): AvatarEmotion => {
    const lower = text.toLowerCase();
    if (lower.includes('celebrate') || lower.includes('beautiful') || lower.includes('amazing'))
      return 'celebration';
    if (lower.includes('understand') || lower.includes('hear you') || lower.includes('feel'))
      return 'empathy';
    if (lower.includes('curious') || lower.includes('wonder') || lower.includes('what if'))
      return 'curiosity';
    if (lower.includes('concerned') || lower.includes('important') || lower.includes('careful'))
      return 'concern';
    if (lower.includes('breathe') || lower.includes('gentle') || lower.includes('settle'))
      return 'calm';
    if (lower.includes('welcome') || lower.includes('glad') || lower.includes('happy'))
      return 'joy';
    return 'neutral';
  }, []);

  // Detect gesture from context
  const detectGesture = useCallback((text: string, isQuestion: boolean): AvatarGesture => {
    if (isQuestion) return 'thinking';
    const lower = text.toLowerCase();
    if (lower.includes('welcome') || lower.includes('come in')) return 'welcoming';
    if (lower.includes('hold') || lower.includes('space') || lower.includes('safe')) return 'holding_space';
    if (lower.includes('yes') || lower.includes('exactly') || lower.includes('right')) return 'nodding';
    if (lower.includes('explore') || lower.includes('open') || lower.includes('discover')) return 'opening';
    return 'speaking';
  }, []);

  // Check for escalation triggers in user message
  const checkEscalation = useCallback(
    (message: string) => {
      const criticalPatterns = [
        /\b(kill|suicide|end (my|it all)|don'?t want to (live|be here|exist))\b/i,
        /\b(self[- ]?harm|cut(ting)? (myself|me)|hurt(ing)? myself)\b/i,
      ];

      for (const pattern of criticalPatterns) {
        if (pattern.test(message)) {
          onEscalation({
            triggerType: 'crisis_language',
            severity: 'critical',
            content: message,
          });
          return true;
        }
      }
      return false;
    },
    [onEscalation]
  );

  const sendTextMessage = useCallback(
    async (text: string) => {
      // Check escalation before processing
      if (checkEscalation(text)) return;

      // Pause STT while processing so mic doesn't pick up guide's voice
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }

      // Add user message
      onMessage({
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      });

      setCurrentGesture('thinking');
      setCurrentEmotion('listening');

      // Warm up AudioContext while we still have user gesture context
      if (kokoroRef.current) {
        kokoroRef.current.resumeAudioContext().catch(() => {});
      }

      try {
        if (!onSendMessage) {
          // Demo mode — still speak the response out loud
          setTimeout(() => {
            const demoResponse = `I hear you. That's a meaningful reflection. Within the Codex, this connects to your current phase of growth. What resonates most with what you're noticing?`;
            const emotion = detectEmotion(demoResponse);
            setCurrentEmotion(emotion);
            setCurrentGesture(detectGesture(demoResponse, false));

            onMessage({
              role: 'guide',
              content: demoResponse,
              timestamp: new Date().toISOString(),
              emotion,
            });

            // Track spoken text for Kling lifelike avatar
            setLastSpokenText(demoResponse);
            // Speak the response with Kokoro TTS
            speakText(demoResponse);
          }, 1500);
          return;
        }

        // Server-side AI — no API key exposed to client
        const guideText = await onSendMessage(text);

        const emotion = detectEmotion(guideText);
        const gesture = detectGesture(guideText, guideText.includes('?'));

        setCurrentEmotion(emotion);
        setCurrentGesture(gesture);

        onMessage({
          role: 'guide',
          content: guideText,
          timestamp: new Date().toISOString(),
          emotion,
        });

        // Track spoken text for Kling lifelike avatar
        setLastSpokenText(guideText);
        // Speak the response with Kokoro TTS
        speakText(guideText);
      } catch (error) {
        console.error('[HolographicAvatar] Message send failed:', error);
        setCurrentGesture('idle');
        setCurrentEmotion('concern');
      }
    },
    [onSendMessage, onMessage, checkEscalation, detectEmotion, detectGesture, speakText]
  );

  // ── Mic Audio Monitoring (VAD) — Web Audio API ──
  // Provides real-time mic level + silence detection for fast end-of-speech

  const SILENCE_THRESHOLD = 0.02;   // RMS below this = silence
  const SILENCE_TIMEOUT_MS = 1200;  // Send after 1.2s silence with pending text

  const startMicMonitoring = useCallback(async () => {
    try {
      if (micStreamRef.current) return; // already monitoring
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      micAudioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      micAnalyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      lastSpeechTimeRef.current = Date.now();

      const monitorLoop = () => {
        if (!micAnalyserRef.current) return;
        micAnalyserRef.current.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += (data[i] / 255) ** 2;
        const rms = Math.sqrt(sum / data.length);
        setMicLevel(rms);

        // Track last time we heard speech
        if (rms > SILENCE_THRESHOLD) {
          lastSpeechTimeRef.current = Date.now();
          // Clear any pending silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else if (pendingTranscriptRef.current.trim() && !silenceTimerRef.current) {
          // Silence detected and we have pending text — start silence timer
          silenceTimerRef.current = setTimeout(() => {
            silenceTimerRef.current = null;
            const pending = pendingTranscriptRef.current.trim();
            if (pending && shouldKeepListeningRef.current) {
              console.log(`[VAD] Silence detected, auto-sending: "${pending}"`);
              pendingTranscriptRef.current = '';
              setTranscript(pending);
              // Stop recognition to force finalize, then send
              if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch {}
              }
              sendTextMessage(pending);
            }
          }, SILENCE_TIMEOUT_MS);
        }

        micFrameRef.current = requestAnimationFrame(monitorLoop);
      };
      micFrameRef.current = requestAnimationFrame(monitorLoop);
      console.log('[VAD] Mic monitoring started');
    } catch (err) {
      console.warn('[VAD] Mic access failed:', err);
    }
  }, [sendTextMessage]);

  const stopMicMonitoring = useCallback(() => {
    if (micFrameRef.current) { cancelAnimationFrame(micFrameRef.current); micFrameRef.current = null; }
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (micAudioCtxRef.current) {
      micAudioCtxRef.current.close().catch(() => {});
      micAudioCtxRef.current = null;
    }
    micAnalyserRef.current = null;
    setMicLevel(0);
    console.log('[VAD] Mic monitoring stopped');
  }, []);

  // ── Speech Recognition — robust STT with auto-restart + VAD ──

  const startListeningInternal = useCallback(() => {
    // Don't start if guide is currently speaking (mic would pick up TTS)
    // Use ref to avoid stale closure — isSpeaking state may be outdated in callbacks
    if (isSpeakingRef.current) return;

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.warn('[HolographicAvatar] Speech recognition not supported in this browser');
      return;
    }

    // Clean up any existing recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;    // Use single-shot mode — more reliable in Chrome
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalText.trim()) {
        pendingTranscriptRef.current = '';
        // Clear any VAD silence timer — we have a finalized result
        if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
        setTranscript(finalText.trim());
        sendTextMessage(finalText.trim());
      } else if (interimText) {
        pendingTranscriptRef.current = interimText;
        setTranscript(interimText);
      }
    };

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      // Auto-restart if user still wants to listen and guide isn't speaking
      // Use ref to get real-time value (not stale closure)
      if (shouldKeepListeningRef.current && !isSpeakingRef.current) {
        // Send any pending interim text that didn't finalize
        if (pendingTranscriptRef.current.trim()) {
          const pending = pendingTranscriptRef.current.trim();
          pendingTranscriptRef.current = '';
          if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
          setTranscript(pending);
          sendTextMessage(pending);
        } else {
          // Restart recognition for next utterance
          setTimeout(() => {
            if (shouldKeepListeningRef.current) {
              startListeningInternal();
            } else {
              setIsListening(false);
            }
          }, 200);
        }
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[HolographicAvatar] Speech error:', event.error);
      recognitionRef.current = null;

      // 'no-speech' is normal — user just didn't say anything yet. Restart.
      if (event.error === 'no-speech' && shouldKeepListeningRef.current) {
        setTimeout(() => {
          if (shouldKeepListeningRef.current) startListeningInternal();
        }, 300);
        return;
      }

      // 'aborted' happens when we intentionally stop — not an error
      if (event.error === 'aborted') return;

      // Real errors — stop listening
      setIsListening(false);
      shouldKeepListeningRef.current = false;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      console.error('[HolographicAvatar] Failed to start recognition:', e);
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, [sendTextMessage]);

  // Kill STT immediately whenever TTS starts — prevents mic from picking up guide audio
  useEffect(() => {
    if (isSpeaking && recognitionRef.current) {
      console.log('[STT] Stopping recognition — guide is speaking');
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  }, [isSpeaking]);

  const startListening = useCallback(() => {
    shouldKeepListeningRef.current = true;
    // Stop Kokoro TTS if guide is speaking — user wants to talk
    if (kokoroRef.current) {
      kokoroRef.current.stop();
    }
    setIsSpeaking(false);
    startListeningInternal();
    // Start mic audio monitoring for VAD + visual feedback
    startMicMonitoring();
  }, [startListeningInternal, startMicMonitoring]);

  const stopListening = useCallback(() => {
    shouldKeepListeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    // Stop mic monitoring
    stopMicMonitoring();
    // Send any accumulated interim transcript
    if (pendingTranscriptRef.current.trim()) {
      sendTextMessage(pendingTranscriptRef.current.trim());
      pendingTranscriptRef.current = '';
    }
  }, [sendTextMessage, stopMicMonitoring]);

  const endSession = useCallback(() => {
    stopListening();
    // Stop Kokoro TTS
    if (kokoroRef.current) {
      kokoroRef.current.stop();
    }
    setIsSpeaking(false);
    if (sessionRef.current) {
      sessionRef.current = null;
    }
    setIsConnected(false);
  }, [stopListening]);

  return {
    isConnected,
    isListening,
    isSpeaking,
    audioLevel,
    micLevel,
    currentEmotion,
    currentGesture,
    transcript,
    sendTextMessage,
    startListening,
    stopListening,
    endSession,
    currentVoice,
    setVoice,
    ttsSpeed,
    setTtsSpeed,
    speakText,
    ttsReady,
    ttsLoading,
    lastSpokenText,
    lastAudioUrl,
  };
}

// ============================================================================
// MAIN HOLOGRAPHIC AVATAR COMPONENT
// ============================================================================

export const HolographicAvatar: React.FC<HolographicAvatarProps> = ({
  guideType,
  userProfile,
  systemPrompt,
  onMessage,
  onEscalation,
  onSessionEnd,
  isActive,
  onSendMessage,
  preferredGuideId,
  preferredVoiceId,
  onChangeGuide,
}) => {
  // If user has a preferred character, use that character's config instead
  const resolvedGuideType = preferredGuideId
    ? (CHARACTER_TO_GUIDE_TYPE[preferredGuideId] as GuideType) || guideType
    : guideType;
  const config = GUIDE_CONFIGS[resolvedGuideType];
  const activeGuideId = preferredGuideId || config.name.toLowerCase();
  const [textInput, setTextInput] = useState('');
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [canvasError, setCanvasError] = useState(false);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showGuideSelector, setShowGuideSelector] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<GuideMessage[]>([]);

  // Avatar state
  const [currentPreset, setCurrentPreset] = useState<AvatarPreset | null>(() =>
    getDefaultPreset(config.name.toLowerCase()) || null
  );
  const [customAppearance, setCustomAppearance] = useState<Partial<AvatarCustomization> | undefined>();
  const [avatarMode, setAvatarMode] = useState<'orb' | 'lifelike'>('lifelike');

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleMessage = useCallback(
    (msg: GuideMessage) => {
      setMessages((prev) => [...prev, msg]);
      onMessage(msg);
    },
    [onMessage]
  );

  const gemini = useGeminiLive(systemPrompt, config, handleMessage, onEscalation, onSendMessage);

  // Get current voice metadata for orb display
  const currentVoiceData = useMemo(
    () => KOKORO_VOICE_CATALOG.find(v => v.id === gemini.currentVoice),
    [gemini.currentVoice]
  );
  const currentVoiceName = currentVoiceData?.name || config.name;

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTextSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!textInput.trim()) return;
      gemini.sendTextMessage(textInput.trim());
      setTextInput('');
    },
    [textInput, gemini]
  );

  const prevAudioRef = useRef<HTMLAudioElement|null>(null);
  const handlePreviewVoice = useCallback((voiceId: string) => {
    if (prevAudioRef.current) { prevAudioRef.current.pause(); prevAudioRef.current = null; }
    const a = new Audio(`/api/tts/preview/${voiceId}`);
    prevAudioRef.current = a;
    a.play().catch(e => console.warn('[Preview] failed:', e));
  }, []);

  if (!isActive) return null;

  /* Jony Ive-inspired holographic keyframes */
  const iveKeyframes = `
    @keyframes breathe{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.06);opacity:.92}}
    @keyframes speak-pulse{0%,100%{transform:scale(1)}25%{transform:scale(1.10)}75%{transform:scale(.96)}}
    @keyframes orbit{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    @keyframes orb-glow{0%,100%{box-shadow:0 0 50px var(--glow),0 0 100px var(--glow-dim)}50%{box-shadow:0 0 70px var(--glow),0 0 140px var(--glow-dim)}}
    @keyframes mic-breathe{0%{transform:scale(1);opacity:0.7}100%{transform:scale(1.8);opacity:0}}
    @keyframes fade-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes status-dot{0%,100%{opacity:.4}50%{opacity:1}}
  `;

  return (
    <div
      className="relative w-full h-full min-h-[600px] overflow-hidden"
      style={{
        background: '#000',
        borderRadius: 20,
        boxShadow: 'inset 0 0 80px rgba(0,0,0,0.6)',
      }}
    >
      <style>{iveKeyframes}</style>

      {/* ── Ambient Particles — fills gaps around avatar for depth ── */}
      <ParticleField particleCount={800} />

      {/* ── Avatar Display ── */}
      {avatarMode === 'lifelike' ? (
        /* ── LIFELIKE MODE — Simli real-time lip-sync or LifelikeAvatar fallback ── */
        <div className="absolute inset-0">
          {SIMLI_FACE_IDS[activeGuideId] ? (
            <SimliAvatar
              guideId={activeGuideId}
              faceId={SIMLI_FACE_IDS[activeGuideId]}
              isSpeaking={gemini.isSpeaking}
              isListening={gemini.isListening}
              width="100%"
              height="100%"
              guideColor={config.primaryColor}
              onReady={() => console.log(`[SimliAvatar] ${config.name} ready`)}
              onError={(err) => {
                console.warn(`[SimliAvatar] Falling back to LifelikeAvatar: ${err}`);
              }}
            />
          ) : (
            <LifelikeAvatar
              guideId={activeGuideId}
              portraitUrl={currentPreset?.imageUrl || `/assets/avatars/kore-prime/portrait-${activeGuideId}.png`}
              isSpeaking={gemini.isSpeaking}
              isListening={gemini.isListening}
              audioUrl={gemini.lastAudioUrl}
              spokenText={gemini.lastSpokenText}
              emotion={gemini.currentEmotion}
              audioLevel={gemini.audioLevel}
              width="100%"
              height="100%"
              onReady={() => console.log(`[LifelikeAvatar] ${config.name} ready`)}
              onError={(err) => {
                console.warn(`[LifelikeAvatar] Falling back to orb: ${err}`);
                setAvatarMode('orb');
              }}
            />
          )}
          {/* Cinematic vignette overlay for lifelike mode */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)',
          }} />
          {/* Subtle ambient glow at avatar center */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(circle at 50% 40%, ${config.primaryColor}08 0%, transparent 60%)`,
          }} />
        </div>
      ) : (
        /* ── ORB MODE — Refined, minimal ── */
        <div className="absolute inset-0 flex items-center justify-center" style={{
          background: `radial-gradient(ellipse at 50% 45%, ${config.secondaryColor}40 0%, #000 75%)`,
        }}>
          <div style={{ textAlign: 'center', marginTop: '-2rem' }}>
            {/* Orbital rings */}
            <div style={{ width: '16rem', height: '16rem', margin: '0 auto', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid ${config.primaryColor}15`, animation: 'orbit 30s linear infinite' }} />
              <div style={{ position: 'absolute', inset: '1.5rem', borderRadius: '50%', border: `1px solid ${config.primaryColor}10`, animation: 'orbit 22s linear infinite reverse' }} />
              <div style={{ position: 'absolute', inset: '3rem', borderRadius: '50%', border: `1px solid ${config.primaryColor}08`, animation: 'orbit 16s linear infinite' }} />
              {/* Core orb */}
              <div style={{
                '--glow': currentVoiceData?.orbGlow || config.emissiveColor,
                '--glow-dim': `${currentVoiceData?.orbGlow || config.emissiveColor}30`,
                width: '7rem',
                height: '7rem',
                borderRadius: '50%',
                background: currentVoiceData
                  ? `radial-gradient(circle at 38% 35%, ${currentVoiceData.orbColor}ee, ${currentVoiceData.orbColor}60 55%, ${config.emissiveColor}20)`
                  : `radial-gradient(circle at 38% 35%, ${config.primaryColor}ee, ${config.emissiveColor}50)`,
                animation: gemini.isSpeaking
                  ? 'speak-pulse .7s ease-in-out infinite, orb-glow 1.8s ease-in-out infinite'
                  : 'breathe 4s ease-in-out infinite, orb-glow 4s ease-in-out infinite',
                transition: 'background 0.6s cubic-bezier(0.4,0,0.2,1)',
              } as React.CSSProperties} />
            </div>
            {/* Name — light, spaced */}
            <p style={{
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontSize: '0.95rem',
              fontWeight: 400,
              color: `${config.primaryColor}cc`,
              letterSpacing: '0.2em',
              marginTop: '1.2rem',
              textTransform: 'uppercase',
            }}>{currentVoiceName}</p>
            {/* Status — whisper-weight */}
            <p style={{
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontSize: '0.6rem',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.12em',
              marginTop: '0.4rem',
            }}>
              {gemini.ttsLoading && !gemini.ttsReady
                ? gemini.ttsLoading
                : gemini.isSpeaking ? 'Speaking' : gemini.isListening ? 'Listening' : 'Ready'}
            </p>
          </div>
        </div>
      )}

      {/* ── Conversation & Controls Overlay ── */}
      <div className="absolute bottom-0 left-0 right-0" style={{
        background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)',
        paddingTop: '5rem',
        zIndex: 10,
      }}>
        {/* Message stream — minimal, floating */}
        <div className="max-h-40 overflow-y-auto px-6 space-y-2.5 mb-4" style={{ scrollbarWidth: 'none' }}>
          {messages.slice(-5).map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animation: 'fade-in 0.3s ease-out both', animationDelay: `${i * 0.05}s` }}
            >
              <div style={{
                maxWidth: '78%',
                padding: '10px 16px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                fontSize: '0.82rem',
                lineHeight: 1.55,
                fontFamily: "'Inter', -apple-system, sans-serif",
                fontWeight: 350,
                letterSpacing: '0.01em',
                color: msg.role === 'user' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.9)',
                background: msg.role === 'user'
                  ? 'rgba(255,255,255,0.07)'
                  : `linear-gradient(135deg, ${config.primaryColor}12, ${config.primaryColor}08)`,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: msg.role === 'user'
                  ? '1px solid rgba(255,255,255,0.06)'
                  : `1px solid ${config.primaryColor}15`,
              }}>
                {msg.role === 'guide' && (
                  <span style={{
                    display: 'block',
                    fontSize: '0.6rem',
                    fontWeight: 500,
                    color: `${config.primaryColor}99`,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}>
                    {config.name}
                  </span>
                )}
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* ── Input Bar — Frosted glass ── */}
        <div style={{ padding: '0 1.25rem 1rem' }}>
          {/* Live transcript — subtle, breathing */}
          {gemini.isListening && gemini.transcript && (
            <div style={{
              margin: '0 0 10px',
              padding: '8px 16px',
              borderRadius: 12,
              fontSize: '0.8rem',
              fontStyle: 'italic',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.6)',
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${config.primaryColor}18`,
              animation: 'fade-in 0.2s ease-out',
            }}>
              {gemini.transcript}
            </div>
          )}

          <form onSubmit={handleTextSubmit} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* ── Mic Button — the hero interaction ── */}
            <button
              type="button"
              onClick={gemini.isListening ? gemini.stopListening : gemini.startListening}
              style={{
                position: 'relative',
                width: 52,
                height: 52,
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: gemini.isListening
                  ? `radial-gradient(circle, ${config.primaryColor}40 0%, ${config.primaryColor}15 100%)`
                  : 'rgba(255,255,255,0.06)',
                color: gemini.isListening ? config.primaryColor : 'rgba(255,255,255,0.5)',
                transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: gemini.isListening
                  ? `0 0 ${20 + gemini.micLevel * 30}px ${config.primaryColor}${Math.min(99, Math.round(20 + gemini.micLevel * 50)).toString()}`
                  : 'none',
              }}
              aria-label={gemini.isListening ? 'Stop listening' : 'Start voice input'}
            >
              {/* Breathing ring when listening */}
              {gemini.isListening && (
                <span style={{
                  position: 'absolute',
                  inset: -2,
                  borderRadius: '50%',
                  border: `1.5px solid ${config.primaryColor}50`,
                  animation: 'mic-breathe 2s ease-out infinite',
                  pointerEvents: 'none',
                }} />
              )}
              {/* Live audio level ring */}
              {gemini.isListening && gemini.micLevel > 0.01 && (
                <span style={{
                  position: 'absolute',
                  inset: `${-3 - gemini.micLevel * 10}px`,
                  borderRadius: '50%',
                  border: `1.5px solid ${config.primaryColor}`,
                  opacity: Math.min(0.8, 0.15 + gemini.micLevel),
                  transition: 'all 0.06s ease-out',
                  pointerEvents: 'none',
                }} />
              )}
              {gemini.isListening ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ position: 'relative', zIndex: 1 }}>
                  <rect x="6" y="6" width="12" height="12" rx="3" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V20h4v2H8v-2h4v-4.07z" />
                </svg>
              )}
            </button>

            {/* ── Text Input — frosted glass pill ── */}
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={gemini.isListening ? 'Listening...' : `Message ${config.name}...`}
              style={{
                flex: 1,
                height: 48,
                padding: '0 20px',
                borderRadius: 24,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                color: 'rgba(255,255,255,0.9)',
                fontSize: '0.82rem',
                fontFamily: "'Inter', -apple-system, sans-serif",
                fontWeight: 350,
                letterSpacing: '0.01em',
                outline: 'none',
                transition: 'border-color 0.3s ease, background 0.3s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = `${config.primaryColor}40`;
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
            />

            {/* ── Send Button — subtle arrow ── */}
            <button
              type="submit"
              disabled={!textInput.trim()}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: 'none',
                cursor: textInput.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: textInput.trim() ? config.primaryColor : 'rgba(255,255,255,0.04)',
                color: textInput.trim() ? '#000' : 'rgba(255,255,255,0.15)',
                opacity: textInput.trim() ? 1 : 0.5,
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                transform: textInput.trim() ? 'scale(1)' : 'scale(0.92)',
              }}
              aria-label="Send message"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.993.993 0 00-1.39.91L2 9.12c0 .5.37.93.87.99L15 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" />
              </svg>
            </button>
          </form>

          {/* ── Status & Controls — minimal, clean ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 10,
            padding: '0 4px',
          }}>
            {/* Left: status dot + guide selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: gemini.isListening || gemini.isSpeaking
                  ? config.primaryColor
                  : gemini.isConnected
                    ? 'rgba(255,255,255,0.25)'
                    : 'rgba(255,200,0,0.5)',
                animation: gemini.isListening || gemini.isSpeaking ? 'status-dot 1.5s ease-in-out infinite' : 'none',
                transition: 'background 0.4s ease',
              }} />
              <button
                onClick={() => setShowGuideSelector(true)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: '0.58rem',
                  fontFamily: "'Inter', -apple-system, sans-serif",
                  fontWeight: 400,
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
                title="Change guide"
              >Guide</button>
              <button
                onClick={() => { gemini.endSession(); onSessionEnd(); }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.15)',
                  fontSize: '0.58rem',
                  fontFamily: "'Inter', -apple-system, sans-serif",
                  fontWeight: 400,
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  transition: 'color 0.3s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,100,100,0.6)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.15)'}
              >End</button>
            </div>

            {/* Right: voice icon — name revealed on hover */}
            <div
              className="voice-reveal-group"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                padding: '4px 10px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
              }}
              onClick={() => setShowVoiceSelector(true)}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${config.primaryColor}30`;
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                const label = e.currentTarget.querySelector('.voice-label') as HTMLElement;
                if (label) { label.style.maxWidth = '120px'; label.style.opacity = '1'; label.style.marginLeft = '6px'; }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.background = 'transparent';
                const label = e.currentTarget.querySelector('.voice-label') as HTMLElement;
                if (label) { label.style.maxWidth = '0'; label.style.opacity = '0'; label.style.marginLeft = '0'; }
              }}
              title={`Voice: ${currentVoiceName}`}
            >
              {/* Waveform / voice icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={config.primaryColor} strokeWidth="1.5" strokeLinecap="round" style={{ opacity: 0.6, flexShrink: 0 }}>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              {/* Voice name — hidden, slides open on hover */}
              <span
                className="voice-label"
                style={{
                  fontFamily: "'Inter', -apple-system, sans-serif",
                  fontSize: '0.6rem',
                  fontWeight: 400,
                  letterSpacing: '0.06em',
                  color: `${config.primaryColor}aa`,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  maxWidth: 0,
                  opacity: 0,
                  marginLeft: 0,
                  transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                {currentVoiceName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Selector Modal */}
      {showVoiceSelector && (
        <VoiceSelector
          currentGuide={config.name}
          currentVoice={gemini.currentVoice}
          avatarMode={avatarMode}
          onSelectVoice={(voiceId) => {
            gemini.setVoice(voiceId);
            setShowVoiceSelector(false);
          }}
          onPreviewVoice={handlePreviewVoice}
          isPreviewPlaying={gemini.isSpeaking}
          onClose={() => setShowVoiceSelector(false)}
        />
      )}

      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <AvatarSelector
          currentGuide={config.name}
          currentAvatarId={currentPreset?.id || ''}
          onSelectAvatar={(presetId) => {
            const preset = AVATAR_PRESETS.find(p => p.id === presetId);
            if (preset) {
              setCurrentPreset(preset);
              setCustomAppearance(undefined);
              setAvatarMode('lifelike');
            }
            setShowAvatarSelector(false);
          }}
          onOpenCustomizer={() => {
            // TODO: open AvatarCustomizer modal
            setShowAvatarSelector(false);
          }}
          onClose={() => setShowAvatarSelector(false)}
          isOpen={showAvatarSelector}
        />
      )}

      {/* Guide Character Selector Modal */}
      {showGuideSelector && (
        <GuideCharacterSelector
          currentGuideId={activeGuideId}
          onSelect={(guideId, voiceId) => {
            setShowGuideSelector(false);
            if (onChangeGuide) onChangeGuide(guideId, voiceId);
            // Also update the voice immediately
            gemini.setVoice(voiceId);
          }}
          onClose={() => setShowGuideSelector(false)}
        />
      )}
    </div>
  );
};

export default HolographicAvatar;
