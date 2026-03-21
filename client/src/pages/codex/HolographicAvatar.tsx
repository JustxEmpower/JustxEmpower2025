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
  const [currentVoice, setCurrentVoice] = useState(guideConfig.voiceId);
  const [ttsReady, setTtsReady] = useState(false);
  const [ttsLoading, setTtsLoading] = useState('');
  const [lastSpokenText, setLastSpokenText] = useState('');
  const [lastAudioUrl, setLastAudioUrl] = useState<string | undefined>(undefined);

  const sessionRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const pendingTranscriptRef = useRef<string>('');
  const shouldKeepListeningRef = useRef(false);
  const kokoroRef = useRef<KokoroTTSManager | null>(null);
  const audioLevelFrameRef = useRef<number | null>(null);

  // Initialize Kokoro TTS
  useEffect(() => {
    setIsConnected(true);

    const kokoro = new KokoroTTSManager();
    kokoroRef.current = kokoro;

    // Listen for Kokoro events
    kokoro.addEventListener('start', () => {
      setIsSpeaking(true);
    });

    kokoro.addEventListener('end', () => {
      setIsSpeaking(false);
      setCurrentGesture('idle');
      // Resume listening if user had voice mode on
      if (shouldKeepListeningRef.current && recognitionRef.current === null) {
        setTimeout(() => {
          if (shouldKeepListeningRef.current) {
            startListeningInternal();
          }
        }, 500);
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

    // Set default voice for this guide
    const defaultVoice = GUIDE_VOICE_DEFAULTS[guideConfig.name] || guideConfig.voiceId;
    kokoro.setVoice(defaultVoice);
    setCurrentVoice(defaultVoice);

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
    console.log(`[speakText] voice=${voice}, kokoroReady=${kokoro?.getState().isReady}`);
    if (kokoro && kokoro.getState().isReady) {
      kokoro.resumeAudioContext().then(() => {
        kokoro.speak(text, voice).catch((err: any) => {
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
          k.speak(text, voice).catch(() => {});
        }
      }, 2000);
    }
  }, [currentVoice]);

  // Browser SpeechSynthesis DELETED — Kokoro server TTS only

  // Set voice
  const setVoice = useCallback((voiceId: string) => {
    setCurrentVoice(voiceId);
    if (kokoroRef.current) {
      kokoroRef.current.setVoice(voiceId);
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

  // ── Speech Recognition — robust STT with auto-restart ──

  const startListeningInternal = useCallback(() => {
    // Don't start if guide is currently speaking (mic would pick up TTS)
    if (isSpeaking) return;

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
      if (shouldKeepListeningRef.current && !isSpeaking) {
        // Send any pending interim text that didn't finalize
        if (pendingTranscriptRef.current.trim()) {
          const pending = pendingTranscriptRef.current.trim();
          pendingTranscriptRef.current = '';
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
  }, [sendTextMessage, isSpeaking]);

  const startListening = useCallback(() => {
    shouldKeepListeningRef.current = true;
    // Stop Kokoro TTS if guide is speaking — user wants to talk
    if (kokoroRef.current) {
      kokoroRef.current.stop();
    }
    setIsSpeaking(false);
    startListeningInternal();
  }, [startListeningInternal]);

  const stopListening = useCallback(() => {
    shouldKeepListeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    // Send any accumulated interim transcript
    if (pendingTranscriptRef.current.trim()) {
      sendTextMessage(pendingTranscriptRef.current.trim());
      pendingTranscriptRef.current = '';
    }
  }, [sendTextMessage]);

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
    currentEmotion,
    currentGesture,
    transcript,
    sendTextMessage,
    startListening,
    stopListening,
    endSession,
    currentVoice,
    setVoice,
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
}) => {
  const config = GUIDE_CONFIGS[guideType];
  const [textInput, setTextInput] = useState('');
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [canvasError, setCanvasError] = useState(false);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
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
  const currentVoiceName = currentVoiceData?.name || 'Kore';

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

  return (
    <div className="relative w-full h-full min-h-[600px] bg-gray-950 rounded-2xl overflow-hidden">
      {/* Three.js Canvas — Holographic Avatar */}
      {false ? (
        <div className="absolute inset-0">
          <Canvas
            camera={{ position: [0, 0, 6], fov: 50 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
          >
            <Suspense fallback={null}>
              <SceneLighting config={config} phase={userProfile.phase} />

              <AvatarCore
                config={config}
                emotion={gemini.currentEmotion}
                gesture={gemini.currentGesture}
                isSpeaking={gemini.isSpeaking}
                audioLevel={gemini.audioLevel}
              />

              <SacredParticles
                color={config.particleColor}
                phase={userProfile.phase}
                isSpeaking={gemini.isSpeaking}
              />

              <WaveformRing
                audioLevel={gemini.audioLevel}
                color={config.emissiveColor}
                isSpeaking={gemini.isSpeaking}
              />

              <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
            </Suspense>
          </Canvas>
        </div>
      ) : avatarMode === 'lifelike' ? (
        /* ── LIFELIKE MODE — Kling AI Video Avatar ── */
        <div className="absolute inset-0">
          <LifelikeAvatar
            guideId={config.name.toLowerCase()}
            portraitUrl={currentPreset?.imageUrl || `/assets/avatars/kore-prime/portrait-${config.name.toLowerCase()}.png`}
            isSpeaking={gemini.isSpeaking}
            isListening={gemini.isListening}
            audioUrl={gemini.lastAudioUrl}
            spokenText={gemini.lastSpokenText}
            mode="std"
            width="100%"
            height="100%"
            useKlingTTS={true}
            onReady={() => console.log(`[LifelikeAvatar] ${config.name} ready`)}
            onError={(err) => {
              console.warn(`[LifelikeAvatar] Falling back to orb: ${err}`);
              setAvatarMode('orb');
            }}
          />
        </div>
      ) : (
        /* ── ORB MODE (default) ── */
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: `radial-gradient(ellipse at center, ${config.secondaryColor}cc 0%, #0A0A1A 70%)` }}>
          <style>{`@keyframes hp{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.08);opacity:.95}}@keyframes hs{0%,100%{transform:scale(1)}25%{transform:scale(1.12)}75%{transform:scale(.95)}}@keyframes hr{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes kokoroGlow{0%,100%{box-shadow:0 0 60px ${currentVoiceData?.orbGlow || config.emissiveColor}, 0 0 120px ${currentVoiceData?.orbGlow || config.emissiveColor}40}50%{box-shadow:0 0 80px ${currentVoiceData?.orbGlow || config.emissiveColor}, 0 0 160px ${currentVoiceData?.orbGlow || config.emissiveColor}60}}`}</style>
          <div style={{textAlign:'center',marginTop:'-3rem'}}>
            <div style={{width:'14rem',height:'14rem',margin:'0 auto',position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{position:'absolute',inset:0,borderRadius:'50%',border:`2px solid ${config.primaryColor}30`,animation:'hr 20s linear infinite'}}/>
              <div style={{position:'absolute',inset:'1rem',borderRadius:'50%',border:`1px solid ${config.primaryColor}20`,animation:'hr 15s linear infinite reverse'}}/>
              {/* Main orb — uses voice color when Kokoro is active */}
              <div style={{
                width:'8rem',
                height:'8rem',
                borderRadius:'50%',
                background: currentVoiceData
                  ? `radial-gradient(circle at 35% 35%, ${currentVoiceData.orbColor}, ${currentVoiceData.orbColor}80 50%, ${config.emissiveColor}40)`
                  : `radial-gradient(circle at 35% 35%, ${config.primaryColor}, ${config.emissiveColor}80)`,
                boxShadow: currentVoiceData
                  ? `0 0 60px ${currentVoiceData.orbGlow}, 0 0 120px ${currentVoiceData.orbGlow}40`
                  : `0 0 60px ${config.emissiveColor}, 0 0 120px ${config.emissiveColor}40`,
                animation: gemini.isSpeaking ? 'hs .8s ease-in-out infinite, kokoroGlow 2s ease-in-out infinite' : 'hp 3s ease-in-out infinite',
                transition: 'background 0.5s ease, box-shadow 0.5s ease',
              }}/>
            </div>
            <p style={{fontSize:'1.1rem',fontWeight:500,color:config.primaryColor,letterSpacing:'0.15em',marginTop:'1rem'}}>{config.name}</p>
            <p style={{fontSize:'0.65rem',color:'rgba(255,255,255,0.3)',marginTop:'0.35rem'}}>
              {gemini.ttsLoading && !gemini.ttsReady
                ? gemini.ttsLoading
                : gemini.isSpeaking
                  ? 'Speaking...'
                  : gemini.isListening
                    ? 'Listening...'
                    : 'Holographic Guide'}
            </p>
          </div>
        </div>
      )}

      {/* Chat Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-950 via-gray-950/90 to-transparent pt-20">
        {/* Message Display */}
        <div className="max-h-48 overflow-y-auto px-4 space-y-2 mb-3">
          {messages.slice(-6).map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-white/10 text-white'
                    : 'text-white/90'
                }`}
                style={
                  msg.role === 'guide'
                    ? { backgroundColor: `${config.primaryColor}20` }
                    : undefined
                }
              >
                {msg.role === 'guide' && (
                  <span
                    className="text-xs font-medium block mb-1"
                    style={{ color: config.primaryColor }}
                  >
                    {config.name}
                  </span>
                )}
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Controls */}
        <div className="px-4 pb-4">
          <form onSubmit={handleTextSubmit} className="flex gap-2">
            {/* Voice toggle */}
            <button
              type="button"
              onClick={gemini.isListening ? gemini.stopListening : gemini.startListening}
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                gemini.isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
              aria-label={gemini.isListening ? 'Stop listening' : 'Start voice input'}
            >
              {gemini.isListening ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V20h4v2H8v-2h4v-4.07z" />
                </svg>
              )}
            </button>

            {/* Text input */}
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={`Speak with ${KOKORO_VOICE_CATALOG.find(v => v.id === gemini.currentVoice)?.name || config.name}...`}
              className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ focusRingColor: config.primaryColor } as any}
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
              style={{ backgroundColor: config.primaryColor }}
              aria-label="Send message"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>

          {/* Status bar with voice selector button */}
          <div className="flex items-center justify-between mt-2 text-xs text-white/40">
            <span>
              {gemini.isListening
                ? 'Listening...'
                : gemini.isSpeaking
                ? `${config.name} is speaking...`
                : gemini.isConnected
                ? 'Connected'
                : 'Connecting...'}
            </span>
            <div className="flex items-center gap-2">
              {/* Avatar mode toggle — orb or lifelike only */}
              <button
                onClick={() => setAvatarMode(prev => prev === 'lifelike' ? 'orb' : 'lifelike')}
                className="text-white/40 hover:text-white/70 transition-colors text-xs px-2 py-1 border border-white/20 rounded hover:border-white/40"
                title={avatarMode === 'lifelike' ? 'Switch to orb mode' : 'Switch to lifelike avatar'}
              >
                {avatarMode === 'orb' ? '👤 Lifelike' : '🔮 Orb'}
              </button>
              <VoiceSettingsButton
                onClick={() => setShowVoiceSelector(true)}
                currentVoiceName={currentVoiceName}
                currentVoiceId={gemini.currentVoice}
              />
              <button
                onClick={() => {
                  gemini.endSession();
                  onSessionEnd();
                }}
                className="text-white/40 hover:text-white/70 transition-colors"
              >
                End session
              </button>
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
    </div>
  );
};

export default HolographicAvatar;
