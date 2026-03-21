/**
 * RPMAvatarRenderer.tsx
 *
 * Full 3D Ready Player Me avatar renderer for Living Codex™.
 * Renders a rigged humanoid GLB model with:
 *   - Real-time lip-sync via Kokoro TTS → ARKit visemes
 *   - Emotional expressions mapped to 52 blend shapes
 *   - Natural blinking, breathing, and micro-movements
 *   - Guide-specific rim lighting and sacred glow effects
 *   - Idle/talking/listening body animations
 *
 * Requires: three, @react-three/fiber, @react-three/drei
 * Optional: @readyplayerme/visage (for enhanced RPM features)
 *
 * @module codex/RPMAvatarRenderer
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
  useGLTF,
  useAnimations,
  OrbitControls,
  Environment,
  ContactShadows,
  Float,
  Sparkles,
} from '@react-three/drei';
import * as THREE from 'three';

import {
  type GuideId,
  type CodexEmotion,
  type RPMGuideConfig,
  type BlendShapeFrame,
  GUIDE_CONFIGS,
  BlendShapeCompositor,
  RPM_CONFIG,
} from './RPMAvatarService';

// ============================================================================
// Types
// ============================================================================

/** Props for the main RPMAvatarRenderer component */
export interface RPMAvatarRendererProps {
  /** Which guide to render */
  guideId: GuideId;
  /** Audio level from Kokoro TTS (0-1) */
  audioLevel: number;
  /** Whether the avatar is currently speaking */
  isSpeaking: boolean;
  /** Whether the avatar is in listening mode */
  isListening: boolean;
  /** Current emotional state */
  emotion: CodexEmotion;
  /** Optional Web Audio AnalyserNode for advanced viseme detection */
  analyserNode?: AnalyserNode | null;
  /** Canvas width */
  width?: string;
  /** Canvas height */
  height?: string;
  /** Enable orbit controls for debugging (default false) */
  enableOrbit?: boolean;
  /** Show debug overlay with blend shape values */
  showDebug?: boolean;
  /** Custom RPM avatar URL override (for user-customized avatars) */
  customAvatarUrl?: string;
  /** Callback when avatar finishes loading */
  onLoaded?: () => void;
  /** Callback on load error */
  onError?: (error: Error) => void;
}

/** Internal state for the 3D avatar scene */
interface AvatarSceneProps {
  config: RPMGuideConfig;
  audioLevel: number;
  isSpeaking: boolean;
  isListening: boolean;
  emotion: CodexEmotion;
  analyserNode?: AnalyserNode | null;
  customAvatarUrl?: string;
  onLoaded?: () => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// Avatar Model Component (inside Canvas)
// ============================================================================

/**
 * The core 3D avatar model.
 * Loads an RPM GLB, finds the head mesh with morph targets,
 * and drives blend shapes every frame.
 */
function AvatarModel({
  config,
  audioLevel,
  isSpeaking,
  isListening,
  emotion,
  analyserNode,
  customAvatarUrl,
  onLoaded,
  onError,
}: AvatarSceneProps) {
  const modelUrl = customAvatarUrl || config.glbUrl;

  // Load the GLB model
  const { scene, animations } = useGLTF(modelUrl, true, true, (loader) => {
    // Enable Draco decompression for RPM models
    // loader.setDRACOLoader(dracoLoader); // Uncomment if using Draco
  });

  // Animation mixer
  const { actions, mixer } = useAnimations(animations, scene);

  // Refs
  const headMeshRef = useRef<THREE.SkinnedMesh | null>(null);
  const headBoneRef = useRef<THREE.Bone | null>(null);
  const spineBoneRef = useRef<THREE.Bone | null>(null);
  const compositorRef = useRef<BlendShapeCompositor>(new BlendShapeCompositor());
  const groupRef = useRef<THREE.Group>(null);
  const materialOriginals = useRef<Map<string, THREE.Material>>(new Map());

  // Track morph target dictionary for fast lookups
  const morphDictRef = useRef<Record<string, number>>({});

  /**
   * On model load: find the head mesh with morph targets,
   * locate skeleton bones, apply guide-specific materials.
   */
  useEffect(() => {
    if (!scene) return;

    const cloned = scene.clone();

    // Traverse to find key meshes and bones
    cloned.traverse((node: THREE.Object3D) => {
      // Find head mesh with morph targets
      if (node instanceof THREE.SkinnedMesh && node.morphTargetDictionary) {
        if (!headMeshRef.current || Object.keys(node.morphTargetDictionary).length > Object.keys(headMeshRef.current.morphTargetDictionary || {}).length) {
          headMeshRef.current = node;
          morphDictRef.current = { ...node.morphTargetDictionary };
        }
      }

      // Find skeleton bones
      if (node instanceof THREE.Bone) {
        const name = node.name.toLowerCase();
        if (name.includes('head') && !headBoneRef.current) {
          headBoneRef.current = node;
        }
        if (name.includes('spine') && !name.includes('spine1') && !name.includes('spine2')) {
          spineBoneRef.current = node;
        }
      }

      // Apply guide-specific material enhancements
      if (node instanceof THREE.Mesh && node.material) {
        const mat = node.material as THREE.MeshStandardMaterial;
        if (mat.isMeshStandardMaterial) {
          // Store original for cleanup
          materialOriginals.current.set(node.uuid, mat.clone());

          // Add subtle rim lighting in guide color
          mat.emissive = new THREE.Color(config.glowColor);
          mat.emissiveIntensity = 0.02;

          // Ensure good skin rendering
          mat.roughness = Math.max(mat.roughness, 0.4);
          mat.envMapIntensity = 0.8;
        }
      }
    });

    // Connect analyser to viseme engine
    if (analyserNode) {
      compositorRef.current.getVisemeEngine().connectAnalyser(analyserNode);
    }

    onLoaded?.();

    return () => {
      // Cleanup
      compositorRef.current.getVisemeEngine().disconnect();
    };
  }, [scene, config, analyserNode, onLoaded]);

  // Update emotion when prop changes
  useEffect(() => {
    compositorRef.current.setEmotion(emotion);
  }, [emotion]);

  // Reconnect analyser when it changes
  useEffect(() => {
    if (analyserNode) {
      compositorRef.current.getVisemeEngine().connectAnalyser(analyserNode);
    }
  }, [analyserNode]);

  /**
   * Main animation loop — runs every frame.
   * Updates blend shapes, bone rotations, and body animation.
   */
  useFrame((state, delta) => {
    // Clamp delta to prevent jumps on tab switch
    const dt = Math.min(delta, 0.1);

    // Update compositor (blinking, visemes, expressions, micro-movement)
    const blendWeights = compositorRef.current.update(dt, audioLevel, isSpeaking);

    // Apply blend shape weights to the head mesh
    const mesh = headMeshRef.current;
    if (mesh && mesh.morphTargetInfluences && mesh.morphTargetDictionary) {
      const dict = mesh.morphTargetDictionary;
      const influences = mesh.morphTargetInfluences;

      for (const [key, value] of Object.entries(blendWeights)) {
        const index = dict[key];
        if (index !== undefined) {
          // Smooth the final value to prevent jitter
          const current = influences[index] || 0;
          const target = Math.max(0, Math.min(1, value as number));
          influences[index] = current + (target - current) * Math.min(dt / 0.05, 1.0);
        }
      }
    }

    // Apply head micro-movements
    const micro = compositorRef.current.getMicroMovement();
    const headBone = headBoneRef.current;
    if (headBone) {
      const [rx, ry, rz] = micro.getHeadRotation();

      // Add listening tilt when avatar is attending
      const listenTilt = isListening ? 0.05 : 0;

      headBone.rotation.x = rx + listenTilt;
      headBone.rotation.y = ry;
      headBone.rotation.z = rz;
    }

    // Apply breathing to spine
    const spineBone = spineBoneRef.current;
    if (spineBone) {
      const breathScale = micro.getBreathingScale();
      spineBone.scale.setScalar(breathScale);
    }

    // Subtle speaking emphasis — lean forward slightly when talking
    if (groupRef.current) {
      const targetLean = isSpeaking ? -0.02 : 0;
      groupRef.current.rotation.x += (targetLean - groupRef.current.rotation.x) * dt * 2;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive
        object={scene}
        scale={1.8}
        position={[0, -1.6, 0]}
        rotation={[0, 0, 0]}
      />
    </group>
  );
}

// ============================================================================
// Sacred Glow Effect (Guide-specific rim/aura)
// ============================================================================

function SacredGlow({
  color,
  glowColor,
  audioLevel,
  isSpeaking,
}: {
  color: string;
  glowColor: string;
  audioLevel: number;
  isSpeaking: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;

    // Pulse glow with audio
    const baseOpacity = 0.04;
    const speakBoost = isSpeaking ? audioLevel * 0.08 : 0;
    const breathe = Math.sin(state.clock.elapsedTime * 0.5) * 0.01;
    mat.opacity = baseOpacity + speakBoost + breathe;

    // Subtle scale pulse
    const scale = 1.0 + (isSpeaking ? audioLevel * 0.03 : 0) + Math.sin(state.clock.elapsedTime * 0.3) * 0.005;
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={meshRef} position={[0, 0.2, -0.3]}>
      <sphereGeometry args={[1.2, 32, 32]} />
      <meshBasicMaterial
        color={glowColor}
        transparent
        opacity={0.04}
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ============================================================================
// Environment Lighting
// ============================================================================

function GuideEnvironment({ config }: { config: RPMGuideConfig }) {
  const guideColorObj = useMemo(() => new THREE.Color(config.guideColor), [config.guideColor]);

  return (
    <>
      {/* Main key light */}
      <directionalLight
        position={[2, 3, 4]}
        intensity={1.2}
        color="#fff5ee"
        castShadow
      />

      {/* Warm fill light */}
      <directionalLight
        position={[-2, 2, 2]}
        intensity={0.4}
        color="#ffe4c4"
      />

      {/* Guide-colored rim light */}
      <pointLight
        position={[0, 1, -2]}
        intensity={0.6}
        color={config.guideColor}
        distance={5}
        decay={2}
      />

      {/* Subtle ground bounce */}
      <hemisphereLight
        color="#ffecd2"
        groundColor="#2a1810"
        intensity={0.3}
      />

      {/* HDR environment for realistic reflections */}
      <Environment preset="apartment" />

      {/* Ground contact shadow */}
      <ContactShadows
        position={[0, -1.6, 0]}
        opacity={0.4}
        scale={5}
        blur={2}
        far={4}
        color="#1a0f0a"
      />
    </>
  );
}

// ============================================================================
// Loading Fallback
// ============================================================================

function AvatarLoadingFallback({ config }: { config: RPMGuideConfig }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      const scale = 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.6, 2]} />
        <meshStandardMaterial
          color={config.guideColor}
          emissive={config.glowColor}
          emissiveIntensity={0.3}
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>
      <Sparkles
        count={30}
        scale={2}
        size={3}
        speed={0.4}
        color={config.particleColor}
      />
    </Float>
  );
}

// ============================================================================
// Error Fallback
// ============================================================================

function AvatarErrorFallback({
  config,
  error,
}: {
  config: RPMGuideConfig;
  error: string;
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a0f0a 0%, #2a1810 100%)',
        borderRadius: '16px',
        padding: '24px',
      }}
    >
      <img
        src={config.fallbackPortrait}
        alt={config.name}
        style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          objectFit: 'cover',
          border: `3px solid ${config.guideColor}`,
          boxShadow: `0 0 20px ${config.glowColor}40`,
        }}
        onError={(e) => {
          // If portrait also fails, show placeholder
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      <p
        style={{
          color: '#d4a574',
          marginTop: '16px',
          fontSize: '14px',
          textAlign: 'center',
          fontFamily: 'system-ui',
        }}
      >
        {config.name} is preparing...
        <br />
        <span style={{ fontSize: '11px', opacity: 0.6 }}>{error}</span>
      </p>
    </div>
  );
}

// ============================================================================
// Debug Overlay
// ============================================================================

function DebugOverlay({
  emotion,
  audioLevel,
  isSpeaking,
  isListening,
}: {
  emotion: CodexEmotion;
  audioLevel: number;
  isSpeaking: boolean;
  isListening: boolean;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 8,
        left: 8,
        background: 'rgba(0,0,0,0.7)',
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: '10px',
        padding: '6px 10px',
        borderRadius: '6px',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <div>emotion: {emotion}</div>
      <div>audio: {audioLevel.toFixed(3)}</div>
      <div>speaking: {isSpeaking ? 'YES' : 'no'}</div>
      <div>listening: {isListening ? 'YES' : 'no'}</div>
      <div
        style={{
          width: '100px',
          height: '4px',
          background: '#333',
          marginTop: '4px',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${audioLevel * 100}%`,
            height: '100%',
            background: isSpeaking ? '#0f0' : '#666',
            transition: 'width 0.05s',
          }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Main RPMAvatarRenderer Component
// ============================================================================

/**
 * RPMAvatarRenderer — Full 3D Ready Player Me avatar with lip-sync,
 * expressions, blinking, breathing, and guide-specific sacred glow.
 *
 * Usage:
 * ```tsx
 * <RPMAvatarRenderer
 *   guideId="kore"
 *   audioLevel={0.5}
 *   isSpeaking={true}
 *   isListening={false}
 *   emotion="joy"
 * />
 * ```
 */
export default function RPMAvatarRenderer({
  guideId,
  audioLevel,
  isSpeaking,
  isListening,
  emotion,
  analyserNode,
  width = '100%',
  height = '500px',
  enableOrbit = false,
  showDebug = false,
  customAvatarUrl,
  onLoaded,
  onError,
}: RPMAvatarRendererProps) {
  const config = GUIDE_CONFIGS[guideId];
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoaded = useCallback(() => {
    setIsLoaded(true);
    onLoaded?.();
  }, [onLoaded]);

  const handleError = useCallback(
    (error: Error) => {
      console.error(`[RPMAvatarRenderer] Failed to load ${guideId}:`, error);
      setLoadError(error.message);
      onError?.(error);
    },
    [guideId, onError],
  );

  if (!config) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4a574' }}>
        Unknown guide: {guideId}
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ width, height }}>
        <AvatarErrorFallback config={config} error={loadError} />
      </div>
    );
  }

  return (
    <div style={{ width, height, position: 'relative' }}>
      <Canvas
        camera={{
          position: [0, 0.3, 2.2],
          fov: 35,
          near: 0.1,
          far: 20,
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        shadows
        style={{ borderRadius: '16px' }}
      >
        {/* Environment + Lighting */}
        <GuideEnvironment config={config} />

        {/* Sacred glow aura behind avatar */}
        <SacredGlow
          color={config.guideColor}
          glowColor={config.glowColor}
          audioLevel={audioLevel}
          isSpeaking={isSpeaking}
        />

        {/* Ambient particles */}
        <Sparkles
          count={40}
          scale={4}
          size={2}
          speed={0.2}
          opacity={0.3}
          color={config.particleColor}
        />

        {/* Avatar model with suspense fallback */}
        <Suspense fallback={<AvatarLoadingFallback config={config} />}>
          <AvatarModel
            config={config}
            audioLevel={audioLevel}
            isSpeaking={isSpeaking}
            isListening={isListening}
            emotion={emotion}
            analyserNode={analyserNode}
            customAvatarUrl={customAvatarUrl}
            onLoaded={handleLoaded}
            onError={handleError}
          />
        </Suspense>

        {/* Optional orbit controls for debugging */}
        {enableOrbit && (
          <OrbitControls
            target={[0, 0.2, 0]}
            minDistance={1}
            maxDistance={5}
            enablePan={false}
          />
        )}
      </Canvas>

      {/* Debug overlay */}
      {showDebug && (
        <DebugOverlay
          emotion={emotion}
          audioLevel={audioLevel}
          isSpeaking={isSpeaking}
          isListening={isListening}
        />
      )}

      {/* Loading indicator */}
      {!isLoaded && !loadError && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            color: config.guideColor,
            fontSize: '12px',
            fontFamily: 'system-ui',
            opacity: 0.7,
          }}
        >
          Loading {config.name}...
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Preload utility
// ============================================================================

/**
 * Preload all guide avatar GLBs for instant switching.
 * Call once on app mount.
 */
export function preloadAllGuideAvatars() {
  Object.values(GUIDE_CONFIGS).forEach((config) => {
    useGLTF.preload(config.glbUrl);
  });
}

/**
 * Preload a single guide's avatar.
 */
export function preloadGuideAvatar(guideId: GuideId) {
  const config = GUIDE_CONFIGS[guideId];
  if (config) {
    useGLTF.preload(config.glbUrl);
  }
}
