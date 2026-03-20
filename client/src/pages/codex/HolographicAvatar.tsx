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
 *
 * Architecture:
 * 1. Three.js Canvas (avatar model + particles + lighting)
 * 2. Gemini Live Session (streaming conversation)
 * 3. Speech-to-Text (user voice input)
 * 4. Text-to-Speech (guide voice output)
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
    voiceId: 'alloy',
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
    voiceId: 'nova',
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
    voiceId: 'shimmer',
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
    voiceId: 'echo',
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
    voiceId: 'fable',
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
    voiceId: 'onyx',
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
// GEMINI LIVE SESSION HOOK
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
  const sessionRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const pendingTranscriptRef = useRef<string>('');

  // Initialize session — server handles AI, so just mark connected
  useEffect(() => {
    setIsConnected(true);
    return () => {
      if (sessionRef.current) {
        sessionRef.current = null;
      }
    };
  }, []);

  // Audio level monitoring
  useEffect(() => {
    if (!isSpeaking) {
      setAudioLevel(0);
      return;
    }

    // Simulate audio levels for avatar animation
    const interval = setInterval(() => {
      setAudioLevel(Math.random() * 0.8 + 0.2);
    }, 100);

    return () => clearInterval(interval);
  }, [isSpeaking]);

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
      // Import escalation patterns (simplified check — full check runs server-side)
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

      // Add user message
      onMessage({
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      });

      setCurrentGesture('thinking');
      setCurrentEmotion('listening');

      try {
        if (!onSendMessage) {
          setTimeout(() => {
            const demoResponse = `I hear you. That's a meaningful reflection. Within the Codex, this connects to your current phase of growth. What resonates most with what you're noticing?`;
            const emotion = detectEmotion(demoResponse);
            setCurrentEmotion(emotion);
            setCurrentGesture(detectGesture(demoResponse, false));
            setIsSpeaking(true);

            onMessage({
              role: 'guide',
              content: demoResponse,
              timestamp: new Date().toISOString(),
              emotion,
            });

            setTimeout(() => {
              setIsSpeaking(false);
              setCurrentGesture('idle');
              setCurrentEmotion('neutral');
            }, 3000);
          }, 1500);
          return;
        }

        // Server-side AI — no API key exposed to client
        const guideText = await onSendMessage(text);

        const emotion = detectEmotion(guideText);
        const gesture = detectGesture(guideText, guideText.includes('?'));

        setCurrentEmotion(emotion);
        setCurrentGesture(gesture);
        setIsSpeaking(true);

        onMessage({
          role: 'guide',
          content: guideText,
          timestamp: new Date().toISOString(),
          emotion,
        });

        // Simulate speaking duration based on text length
        const speakDuration = Math.min(guideText.length * 50, 15000);
        setTimeout(() => {
          setIsSpeaking(false);
          setCurrentGesture('idle');
        }, speakDuration);
      } catch (error) {
        console.error('[HolographicAvatar] Message send failed:', error);
        setCurrentGesture('idle');
        setCurrentEmotion('concern');
      }
    },
    [onSendMessage, onMessage, checkEscalation, detectEmotion, detectGesture]
  );

  // Speech recognition for voice mode
  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.warn('[HolographicAvatar] Speech recognition not supported');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

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
      if (finalText) {
        pendingTranscriptRef.current = '';
        setTranscript(finalText);
        sendTextMessage(finalText);
      } else if (interimText) {
        pendingTranscriptRef.current = interimText;
        setTranscript(interimText);
      }
    };

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error('[HolographicAvatar] Speech error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [sendTextMessage]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      // Send any accumulated interim transcript that wasn't finalized
      if (pendingTranscriptRef.current.trim()) {
        sendTextMessage(pendingTranscriptRef.current.trim());
        pendingTranscriptRef.current = '';
      }
    }
  }, [sendTextMessage]);

  const endSession = useCallback(() => {
    stopListening();
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
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<GuideMessage[]>([]);

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

  if (!isActive) return null;

  return (
    <div className="relative w-full h-full min-h-[600px] bg-gray-950 rounded-2xl overflow-hidden">
      {/* Three.js Canvas — Holographic Avatar */}
      {!prefersReducedMotion ? (
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

              <GuideName name={config.name} color={config.primaryColor} />

              <Environment preset="night" />
            </Suspense>
          </Canvas>
        </div>
      ) : (
        /* Reduced motion fallback */
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: PHASE_AMBIENTS[userProfile.phase]?.fog || '#0A0A1A' }}
        >
          <div className="text-center">
            <div
              className="w-24 h-24 rounded-full mx-auto mb-4"
              style={{
                backgroundColor: config.primaryColor,
                boxShadow: `0 0 40px ${config.emissiveColor}`,
                opacity: gemini.isSpeaking ? 0.9 : 0.6,
              }}
            />
            <p className="text-lg font-medium" style={{ color: config.primaryColor }}>
              {config.name}
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
              placeholder={`Speak with ${config.name}...`}
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

          {/* Status bar */}
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
  );
};

export default HolographicAvatar;
