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

// Holographic background selector system (Doc 04)
import { BackgroundRenderer, BackgroundSelectorFAB, useBackgroundSettings } from './HolographicBackgrounds';

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
  conversationState: 'idle' | 'listening' | 'heard_speech' | 'sending' | 'ai_speaking';
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
  // Ref to track current voice — avoids stale closure in speakText callbacks
  const currentVoiceRef = useRef(currentVoice);
  currentVoiceRef.current = currentVoice;
  // Ref to track isSpeaking without stale closure issues in recognition callbacks
  const isSpeakingRef = useRef(false);
  // Ref to prevent mic restart while AI is processing/responding
  const isProcessingRef = useRef(false);
  // Ref to always call the latest startListeningInternal from event handlers
  const startListeningInternalRef = useRef<() => void>(() => {});
  // Conversation mode: idle timeout — exits conversation mode after sustained silence
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether user has spoken at all in the current listening session
  const hasSpokenRef = useRef(false);
  // Conversation state for UI: idle | listening | heard_speech | sending | ai_speaking
  const [conversationState, setConversationState] = useState<'idle' | 'listening' | 'heard_speech' | 'sending' | 'ai_speaking'>('idle');

  // Initialize Kokoro TTS
  useEffect(() => {
    setIsConnected(true);

    const kokoro = new KokoroTTSManager();
    kokoroRef.current = kokoro;

    // Listen for Kokoro events
    kokoro.addEventListener('start', () => {
      setIsSpeaking(true);
      isSpeakingRef.current = true;
      isProcessingRef.current = false;
      setConversationState('ai_speaking');
      // Mute mic tracks to prevent picking up TTS/Simli audio output
      if (micStreamRef.current) {
        micStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
      }
    });

    kokoro.addEventListener('end', () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      setCurrentGesture('idle');

      // ── INSTANT AUTO-RESUME: Switch to listening immediately when avatar finishes speaking ──
      if (shouldKeepListeningRef.current) {
        // Unmute mic tracks immediately
        if (micStreamRef.current) {
          micStreamRef.current.getAudioTracks().forEach(t => { t.enabled = true; });
        }
        setConversationState('listening');
        hasSpokenRef.current = false;

        // Start listening with minimal delay (just enough to avoid catching the final audio frame)
        setTimeout(() => {
          if (shouldKeepListeningRef.current && !isSpeakingRef.current && !isProcessingRef.current) {
            startListeningInternalRef.current();
            console.log('[Conversation] Auto-resumed listening after avatar finished speaking');
            // Reset idle timer for the new listening turn
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            idleTimerRef.current = setTimeout(() => {
              if (shouldKeepListeningRef.current && !hasSpokenRef.current && !isProcessingRef.current && !isSpeakingRef.current) {
                console.log('[Conversation] 7s idle after AI response — auto-exiting conversation mode');
                shouldKeepListeningRef.current = false;
                if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
                setIsListening(false);
                setConversationState('idle');
              }
            }, 7000);
          }
        }, 150); // 150ms — just enough to clear the audio buffer, not perceptible to the user
      } else {
        // Unmute mic tracks even when not in conversation mode
        if (micStreamRef.current) {
          micStreamRef.current.getAudioTracks().forEach(t => { t.enabled = true; });
        }
        setConversationState('idle');
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
    const voice = voiceOverride || currentVoiceRef.current;
    // Strip markdown + special symbols so TTS reads natural speech only
    const cleanText = text
      .replace(/[™®©]/g, '')           // trademark symbols
      .replace(/```[\s\S]*?```/g, '')   // code blocks
      .replace(/`([^`]+)`/g, '$1')      // inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [links](url) → link text
      .replace(/^#{1,6}\s+/gm, '')      // headings
      .replace(/^[-*+]\s+/gm, '')       // bullet points
      .replace(/^\d+\.\s+/gm, '')       // numbered lists
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1') // ***bold italic***, **bold**, *italic*
      .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')   // ___bold italic___, __bold__, _italic_
      .replace(/~~([^~]+)~~/g, '$1')    // ~~strikethrough~~
      .replace(/^>\s+/gm, '')           // blockquotes
      .replace(/---+/g, '')             // horizontal rules
      .replace(/\n{3,}/g, '\n\n')       // collapse excess newlines
      .trim();
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
  }, []);

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

      // Mark as processing so mic doesn't restart during AI response
      isProcessingRef.current = true;
      setConversationState('sending');

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
        isProcessingRef.current = false;
        setCurrentGesture('idle');
        setCurrentEmotion('concern');
      }
    },
    [onSendMessage, onMessage, checkEscalation, detectEmotion, detectGesture, speakText]
  );

  // ── Mic Audio Monitoring (VAD) — Web Audio API ──
  // Provides real-time mic level + silence detection for fast end-of-speech

  // ── SMART CONVERSATION MODE CONSTANTS ──
  const SILENCE_THRESHOLD = 0.025;       // RMS below this = silence (slightly more sensitive)
  const SPEECH_THRESHOLD = 0.04;         // RMS above this = definite speech activity
  const SILENCE_TIMEOUT_MS = 3000;       // Send after 3s silence with pending text (natural pause)
  const IDLE_TIMEOUT_MS = 7000;          // Exit conversation mode after 7s of total silence (no speech at all)
  const POST_TTS_RESUME_DELAY = 800;     // Resume listening 800ms after AI finishes speaking
  const POST_SEND_COOLDOWN = 500;        // Brief cooldown after sending before re-listening

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

        // Track speech activity for conversation mode
        if (rms > SPEECH_THRESHOLD) {
          lastSpeechTimeRef.current = Date.now();
          // User is actively speaking
          if (!hasSpokenRef.current) {
            hasSpokenRef.current = true;
            setConversationState('heard_speech');
            // Clear idle timer — user is engaged
            if (idleTimerRef.current) { clearTimeout(idleTimerRef.current); idleTimerRef.current = null; }
          }
          // Clear any pending silence timer — user is still talking
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else if (rms > SILENCE_THRESHOLD) {
          // Soft sound detected (breathing, ambient) — still counts as activity
          lastSpeechTimeRef.current = Date.now();
          if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
        } else if (pendingTranscriptRef.current.trim() && !silenceTimerRef.current) {
          // True silence with pending text — start the 3-second silence countdown
          silenceTimerRef.current = setTimeout(() => {
            silenceTimerRef.current = null;
            const pending = pendingTranscriptRef.current.trim();
            if (pending && shouldKeepListeningRef.current) {
              console.log(`[VAD] 3s silence detected, auto-sending: "${pending}"`);
              pendingTranscriptRef.current = '';
              setTranscript(pending);
              setConversationState('sending');
              // Stop recognition to force finalize, then send
              if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch {}
              }
              sendTextMessage(pending);
            }
          }, SILENCE_TIMEOUT_MS);
        } else if (!pendingTranscriptRef.current.trim() && hasSpokenRef.current) {
          // User spoke before but now is silent with no pending text
          // This is normal between turns — do nothing, idle timer handles exit
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
    // Don't start if guide is currently speaking or AI is processing
    // Use ref to avoid stale closure — isSpeaking state may be outdated in callbacks
    if (isSpeakingRef.current || isProcessingRef.current) return;

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
      // Auto-restart if user still wants to listen and guide isn't speaking/processing
      // Use ref to get real-time value (not stale closure)
      if (shouldKeepListeningRef.current && !isSpeakingRef.current && !isProcessingRef.current) {
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
            if (shouldKeepListeningRef.current && !isProcessingRef.current && !isSpeakingRef.current) {
              startListeningInternal();
            } else if (!shouldKeepListeningRef.current) {
              setIsListening(false);
            }
          }, 300);
        }
      } else if (!shouldKeepListeningRef.current) {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[HolographicAvatar] Speech error:', event.error);
      recognitionRef.current = null;

      // 'no-speech' is normal — user just didn't say anything yet. Restart.
      if (event.error === 'no-speech' && shouldKeepListeningRef.current) {
        setTimeout(() => {
          if (shouldKeepListeningRef.current && !isProcessingRef.current && !isSpeakingRef.current) {
            startListeningInternal();
          }
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

  // Keep ref in sync so Kokoro event handlers always call the latest version
  startListeningInternalRef.current = startListeningInternal;

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
    hasSpokenRef.current = false;
    // Stop Kokoro TTS if guide is speaking — user wants to talk
    if (kokoroRef.current) {
      kokoroRef.current.stop();
    }
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    setConversationState('listening');
    startListeningInternal();
    // Start mic audio monitoring for VAD + visual feedback
    startMicMonitoring();
    // Start idle timer — if user doesn't speak for 7s after pressing mic, auto-exit
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (shouldKeepListeningRef.current && !hasSpokenRef.current && !isProcessingRef.current && !isSpeakingRef.current) {
        console.log('[Conversation] 7s idle — no speech detected, auto-exiting conversation mode');
        shouldKeepListeningRef.current = false;
        if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
        setIsListening(false);
        setConversationState('idle');
        stopMicMonitoring();
      }
    }, IDLE_TIMEOUT_MS);
  }, [startListeningInternal, startMicMonitoring, stopMicMonitoring]);

  const stopListening = useCallback(() => {
    shouldKeepListeningRef.current = false;
    hasSpokenRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setConversationState('idle');
    // Clear idle timer
    if (idleTimerRef.current) { clearTimeout(idleTimerRef.current); idleTimerRef.current = null; }
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
    conversationState,
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

  // Background selector settings (Doc 04)
  const bgSettings = useBackgroundSettings('void');

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
    <BackgroundRenderer
      backgroundId={bgSettings.backgroundId}
      ambientLevel={bgSettings.ambientLevel}
      particleLevel={bgSettings.particleLevel}
      guideColor={config.primaryColor}
      style={{
        borderRadius: 20,
        boxShadow: 'inset 0 0 80px rgba(0,0,0,0.6)',
        minHeight: 680,
      }}
    >
      <div
        className="relative w-full h-full min-h-[680px] overflow-hidden"
        style={{ background: 'transparent' }}
      >
      <style>{iveKeyframes}</style>

      {/* ── Ambient Particles — fills gaps around avatar for depth ── */}
      <ParticleField particleCount={Math.round(800 * (bgSettings.particleLevel / 3))} />

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
          background: `radial-gradient(ellipse at 50% 45%, ${config.secondaryColor}40 0%, transparent 75%)`,
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
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.95rem',
              fontWeight: 400,
              color: 'rgba(184,123,101,0.8)',
              letterSpacing: '0.2em',
              marginTop: '1.2rem',
              textTransform: 'uppercase',
            }}>{currentVoiceName}</p>
            {/* Status — whisper-weight */}
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.6rem',
              fontWeight: 300,
              color: 'rgba(154,148,141,0.5)',
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

      {/* ── Caption Bar — AI speech as movie subtitles, just above the bottom edge ── */}
      <div className="absolute bottom-0 left-0 right-0" style={{ zIndex: 10, pointerEvents: 'none' }}>
        {/* Last guide message as caption */}
        {messages.length > 0 && (() => {
          const lastGuideMsg = [...messages].reverse().find(m => m.role === 'guide');
          return lastGuideMsg ? (
            <div style={{
              padding: '12px 24px 16px',
              background: 'linear-gradient(to top, rgba(22,18,14,0.85) 0%, rgba(22,18,14,0.4) 70%, transparent 100%)',
            }}>
              <p style={{
                textAlign: 'center',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.85rem',
                fontWeight: 350,
                lineHeight: 1.6,
                color: 'rgba(230,215,195,0.9)',
                maxWidth: '90%',
                margin: '0 auto',
                textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                animation: 'fade-in 0.3s ease-out',
              }}>
                {lastGuideMsg.content}
              </p>
            </div>
          ) : null;
        })()}
        {/* Live transcript — shows what mic is hearing */}
        {gemini.isListening && gemini.transcript && (
          <div style={{
            textAlign: 'center',
            padding: '4px 24px 8px',
            background: 'rgba(22,18,14,0.6)',
          }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.78rem',
              fontStyle: 'italic',
              fontWeight: 300,
              color: 'rgba(184,123,101,0.7)',
              animation: 'fade-in 0.2s ease-out',
            }}>
              {gemini.transcript}
            </p>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── FLOATING CONTROLS — Below the avatar box, outside it ── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'absolute',
        bottom: -90,
        left: 0,
        right: 0,
        zIndex: 20,
        pointerEvents: 'auto',
      }}>
        {/* Text input row */}
        <form onSubmit={handleTextSubmit} style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          padding: '0 8px',
          marginBottom: 12,
        }}>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={
              gemini.conversationState === 'idle' ? `Message ${config.name}...` :
              gemini.conversationState === 'listening' ? 'Listening... just speak naturally' :
              gemini.conversationState === 'heard_speech' ? 'Pause when done...' :
              gemini.conversationState === 'sending' ? 'Thinking...' :
              `${config.name} is speaking...`
            }
            style={{
              flex: 1,
              height: 44,
              padding: '0 20px',
              borderRadius: 22,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              color: 'rgba(220,205,185,0.8)',
              fontSize: '0.8rem',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 350,
              outline: 'none',
              transition: 'border-color 0.3s ease',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(184,123,101,0.3)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          />
        </form>

        {/* Floating action buttons row: Guide | Mic | Send | Voice */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '0 8px',
        }}>
          {/* #4 — Change Guide (far left) */}
          <button
            onClick={() => setShowGuideSelector(true)}
            style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
              color: 'rgba(220,205,185,0.5)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(220,205,185,0.8)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(220,205,185,0.5)'; }}
            title="Change guide"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 0 0-16 0" />
            </svg>
          </button>

          {/* #3 — Mic Button (center) */}
          <button
            type="button"
            onClick={gemini.isListening ? gemini.stopListening : gemini.startListening}
            style={{
              position: 'relative',
              width: 54, height: 54, borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: gemini.conversationState === 'idle'
                ? 'rgba(255,255,255,0.08)'
                : gemini.conversationState === 'heard_speech'
                  ? 'radial-gradient(circle, rgba(184,123,101,0.35) 0%, rgba(184,123,101,0.1) 100%)'
                  : gemini.conversationState === 'sending'
                    ? 'radial-gradient(circle, rgba(201,168,76,0.25) 0%, rgba(201,168,76,0.06) 100%)'
                    : gemini.conversationState === 'ai_speaking'
                      ? 'radial-gradient(circle, rgba(125,142,127,0.2) 0%, rgba(125,142,127,0.06) 100%)'
                      : 'radial-gradient(circle, rgba(184,123,101,0.2) 0%, rgba(184,123,101,0.06) 100%)',
              border: 'none', outline: 'none',
              color: gemini.conversationState === 'idle' ? 'rgba(220,205,185,0.6)' : 'rgba(230,215,195,0.85)',
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: gemini.conversationState === 'heard_speech'
                ? `0 0 ${20 + gemini.micLevel * 30}px rgba(184,123,101,0.3)`
                : gemini.conversationState === 'listening'
                  ? `0 0 ${10 + gemini.micLevel * 15}px rgba(184,123,101,0.15)`
                  : 'none',
            }}
            aria-label={gemini.conversationState === 'idle' ? 'Start conversation' : 'Stop conversation'}
          >
            {gemini.conversationState !== 'idle' && (
              <span style={{
                position: 'absolute', inset: -3, borderRadius: '50%',
                border: '1.5px solid rgba(184,123,101,0.3)',
                animation: gemini.conversationState === 'listening' ? 'mic-breathe 2.5s ease-in-out infinite' : 'none',
                pointerEvents: 'none',
              }} />
            )}
            {gemini.conversationState === 'idle' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V20h4v2H8v-2h4v-4.07z" />
              </svg>
            ) : gemini.conversationState === 'sending' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ animation: 'mic-breathe 1s ease-in-out infinite' }}>
                <circle cx="6" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="18" cy="12" r="2" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="3" />
              </svg>
            )}
          </button>

          {/* #1 — Send Message (right of mic) */}
          <button
            type="button"
            onClick={() => { if (textInput.trim()) handleTextSubmit({ preventDefault: () => {} } as any); }}
            disabled={!textInput.trim()}
            style={{
              width: 42, height: 42, borderRadius: '50%',
              background: textInput.trim() ? 'rgba(184,123,101,0.2)' : 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
              color: textInput.trim() ? 'rgba(220,185,155,0.95)' : 'rgba(220,205,185,0.3)',
              cursor: textInput.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s ease',
              opacity: textInput.trim() ? 1 : 0.5,
            }}
            title="Send message"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.993.993 0 00-1.39.91L2 9.12c0 .5.37.93.87.99L15 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" />
            </svg>
          </button>

          {/* #2 — Change Voice (far right) */}
          <button
            onClick={() => setShowVoiceSelector(true)}
            style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
              color: 'rgba(184,123,101,0.6)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(184,123,101,0.9)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(184,123,101,0.6)'; }}
            title={`Voice: ${currentVoiceName}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        </div>

        {/* Conversation state label */}
        {gemini.conversationState !== 'idle' && (
          <div style={{
            textAlign: 'center', marginTop: 8,
            fontSize: '8px', letterSpacing: '0.15em', textTransform: 'uppercase',
            color: gemini.conversationState === 'heard_speech' ? 'rgba(184,123,101,0.6)' :
                   gemini.conversationState === 'sending' ? 'rgba(201,168,76,0.5)' :
                   gemini.conversationState === 'ai_speaking' ? 'rgba(125,142,127,0.4)' :
                   'rgba(220,205,185,0.3)',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {gemini.conversationState === 'listening' ? 'listening...' :
             gemini.conversationState === 'heard_speech' ? 'hearing you...' :
             gemini.conversationState === 'sending' ? 'thinking...' :
             'speaking...'}
          </div>
        )}
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

      {/* ── Background Selector FAB (Doc 04) ── */}
      <BackgroundSelectorFAB
        guideColor={config.primaryColor}
        currentBackgroundId={bgSettings.backgroundId}
        onBackgroundChange={bgSettings.setBackgroundId}
        ambientLevel={bgSettings.ambientLevel}
        particleLevel={bgSettings.particleLevel}
        onAmbientChange={bgSettings.setAmbientLevel}
        onParticleChange={bgSettings.setParticleLevel}
        unlockedBackgrounds={['eden', 'akashic', 'aurora', 'womb']}
      />
    </div>
    </BackgroundRenderer>
  );
};

export default HolographicAvatar;
