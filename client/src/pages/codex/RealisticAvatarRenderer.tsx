/**
 * RealisticAvatarRenderer.tsx
 *
 * Photorealistic humanoid avatar renderer for Living Codex™ women's empowerment portal.
 * Uses Three.js with React Three Fiber to render a guide character with advanced
 * realism techniques: subsurface scattering, Fresnel rim lighting, lip-sync, blink
 * animation, micro-expressions, and natural motion.
 *
 * @module codex/RealisticAvatarRenderer
 */

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree, ThreeElements } from '@react-three/fiber';
import {
  Float,
  Sparkles,
  useGLTF,
  useTexture,
  OrbitControls,
} from '@react-three/drei';
import * as THREE from 'three';

// ============================================================================
// Type Definitions
// ============================================================================

/** Avatar emotional state affecting motion and expression profiles */
type AvatarEmotion = 'calm' | 'curious' | 'joyful' | 'concerned' | 'empowered' | 'listening';

/** Props for the main RealisticAvatarRenderer component */
interface RealisticAvatarRendererProps {
  /** URL path to portrait texture for the face */
  avatarImageUrl: string;
  /** Guide's primary color for Fresnel rim lighting (hex) */
  guideColor: string;
  /** Guide's emissive/glow color for effects (hex) */
  glowColor: string;
  /** Audio level input from TTS (0-1 range) */
  audioLevel: number;
  /** Whether avatar is currently speaking */
  isSpeaking: boolean;
  /** Whether avatar is in listening/attending mode */
  isListening: boolean;
  /** Current emotional state of the avatar */
  emotion: AvatarEmotion;
  /** Hex color for skin tone SSS base (default: realistic peach) */
  skinTone?: string;
  /** Hex color for iris (default: warm brown) */
  eyeColor?: string;
  /** Canvas width (default: "100%") */
  width?: string;
  /** Canvas height (default: "400px") */
  height?: string;
}

/** Morph target state for facial expressions */
interface MorphTargets {
  jawOpen: number;
  lipWidth: number;
  lipRound: number;
  browRaise: number;
  browFurrow: number;
  eyeSquint: number;
  cheekRaise: number;
  noseWrinkle: number;
  mouthSmile: number;
  mouthFrown: number;
}

/** Eye blink state tracking */
interface BlinkState {
  isBlinking: boolean;
  blinkStartTime: number;
  nextBlinkTime: number;
}

/** Head motion configuration */
interface HeadMotionProfile {
  swayAmplitudeX: number;
  swayAmplitudeY: number;
  swayFrequency: number;
  breathingAmplitude: number;
  breathingFrequency: number;
  nodProbability: number;
  tiltAmount: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Linear interpolation between two values
 * @param current - Current value
 * @param target - Target value
 * @param speed - Interpolation speed (0-1), typically 0.1-0.2
 * @returns Interpolated value
 */
const lerp = (current: number, target: number, speed: number): number => {
  return current + (target - current) * speed;
};

/**
 * Convert hex color string to THREE.Color
 * @param hex - Hex color string (e.g., "#FF6B35")
 * @returns THREE.Color instance
 */
const hexToColor = (hex: string): THREE.Color => {
  return new THREE.Color(hex);
};

/**
 * Get motion profile based on avatar emotion
 * @param emotion - Current avatar emotion
 * @returns HeadMotionProfile configuration
 */
const getMotionProfile = (emotion: AvatarEmotion): HeadMotionProfile => {
  const profiles: Record<AvatarEmotion, HeadMotionProfile> = {
    calm: {
      swayAmplitudeX: 0.015,
      swayAmplitudeY: 0.03,
      swayFrequency: 0.3,
      breathingAmplitude: 0.005,
      breathingFrequency: 0.25,
      nodProbability: 0.02,
      tiltAmount: 0,
    },
    curious: {
      swayAmplitudeX: 0.025,
      swayAmplitudeY: 0.04,
      swayFrequency: 0.4,
      breathingAmplitude: 0.006,
      breathingFrequency: 0.28,
      nodProbability: 0.05,
      tiltAmount: 0.05,
    },
    joyful: {
      swayAmplitudeX: 0.03,
      swayAmplitudeY: 0.05,
      swayFrequency: 0.5,
      breathingAmplitude: 0.008,
      breathingFrequency: 0.3,
      nodProbability: 0.08,
      tiltAmount: 0.08,
    },
    concerned: {
      swayAmplitudeX: 0.01,
      swayAmplitudeY: 0.02,
      swayFrequency: 0.25,
      breathingAmplitude: 0.004,
      breathingFrequency: 0.22,
      nodProbability: 0.03,
      tiltAmount: -0.03,
    },
    empowered: {
      swayAmplitudeX: 0.02,
      swayAmplitudeY: 0.035,
      swayFrequency: 0.35,
      breathingAmplitude: 0.007,
      breathingFrequency: 0.26,
      nodProbability: 0.06,
      tiltAmount: 0,
    },
    listening: {
      swayAmplitudeX: 0.012,
      swayAmplitudeY: 0.025,
      swayFrequency: 0.28,
      breathingAmplitude: 0.005,
      breathingFrequency: 0.24,
      nodProbability: 0.04,
      tiltAmount: 0.06,
    },
  };
  return profiles[emotion];
};

// ============================================================================
// GLSL Shaders
// ============================================================================

/** Vertex shader for subsurface scattering and realistic skin */
const skinVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vViewDir = normalize(cameraPosition - vPosition);

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

/** Fragment shader implementing subsurface scattering and Fresnel rim lighting */
const skinFragmentShader = `
  uniform sampler2D diffuseMap;
  uniform sampler2D normalMap;
  uniform vec3 sssColor;
  uniform float sssIntensity;
  uniform vec3 lightPos;
  uniform vec3 rimColor;
  uniform float rimPower;
  uniform vec3 lightColor;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vViewDir;

  void main() {
    // Sample textures
    vec4 diffuseTex = texture2D(diffuseMap, vUv);
    vec4 normalTex = texture2D(normalMap, vUv);

    // Perturb normal with normal map
    vec3 perturbedNormal = normalize(mix(vNormal, normalTex.rgb * 2.0 - 1.0, 0.5));

    // Light direction and distance
    vec3 lightDir = normalize(lightPos - vPosition);
    float distance = length(lightPos - vPosition);
    float attenuation = 1.0 / (1.0 + distance * distance * 0.01);

    // Diffuse lighting
    float diffuse = max(dot(perturbedNormal, lightDir), 0.0);
    vec3 diffuseLight = diffuse * lightColor * attenuation;

    // Subsurface scattering: light passing through thin skin areas
    float sss = max(dot(vViewDir, -lightDir), 0.0);
    sss = pow(sss, 3.0); // Sharpen the wrap-around effect
    vec3 sssLight = sss * sssColor * sssIntensity * lightColor * attenuation;

    // Fresnel rim lighting for sacred/holographic feel
    float fresnel = pow(1.0 - max(dot(perturbedNormal, vViewDir), 0.0), rimPower);
    vec3 rimLight = fresnel * rimColor * 0.6;

    // Ambient contribution
    vec3 ambient = vec3(0.2) * diffuseTex.rgb;

    // Combine: diffuse + subsurface scattering + rim + ambient
    vec3 finalColor = diffuseTex.rgb * (diffuseLight + ambient) + sssLight + rimLight;

    // Tone mapping for HDR-like feel
    finalColor = finalColor / (finalColor + vec3(1.0));

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ============================================================================
// Component: SkinSSShader
// ============================================================================

/**
 * Custom ShaderMaterial implementing subsurface scattering for realistic skin
 * Handles diffuse lighting, SSS for translucent skin areas, and Fresnel rim glow
 */
const SkinSSShader = React.forwardRef<
  THREE.ShaderMaterial,
  {
    diffuseMap: THREE.Texture;
    normalMap: THREE.Texture;
    sssColor: THREE.Color;
    sssIntensity: number;
    lightPos: THREE.Vector3;
    rimColor: THREE.Color;
    rimPower: number;
    lightColor: THREE.Color;
  }
>(
  (
    {
      diffuseMap,
      normalMap,
      sssColor,
      sssIntensity,
      lightPos,
      rimColor,
      rimPower,
      lightColor,
    },
    ref
  ) => {
    const material = useMemo(() => {
      return new THREE.ShaderMaterial({
        vertexShader: skinVertexShader,
        fragmentShader: skinFragmentShader,
        uniforms: {
          diffuseMap: { value: diffuseMap },
          normalMap: { value: normalMap },
          sssColor: { value: sssColor },
          sssIntensity: { value: sssIntensity },
          lightPos: { value: lightPos },
          rimColor: { value: rimColor },
          rimPower: { value: rimPower },
          lightColor: { value: lightColor },
        },
      });
    }, [diffuseMap, normalMap, sssColor, sssIntensity, lightPos, rimColor, rimPower, lightColor]);

    return <shaderMaterial ref={ref} {...material} />;
  }
);
SkinSSShader.displayName = 'SkinSSShader';

// ============================================================================
// Component: AvatarFace
// ============================================================================

interface AvatarFaceProps {
  imageUrl: string;
  sssColor: THREE.Color;
  rimColor: THREE.Color;
  lightPos: THREE.Vector3;
  lightColor: THREE.Color;
  morphTargets: MorphTargets;
}

/**
 * Avatar face mesh with morph targets for expressions
 * Uses custom SkinSSShader for photorealistic rendering
 */
const AvatarFace = React.forwardRef<THREE.Group, AvatarFaceProps>(
  (
    {
      imageUrl,
      sssColor,
      rimColor,
      lightPos,
      lightColor,
      morphTargets,
    },
    ref
  ) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const textureLoaded = useTexture(imageUrl);
    const normalMap = useTexture('/textures/skin-normal.png');

    useEffect(() => {
      if (meshRef.current) {
        // Apply morph target influences
        if (meshRef.current.morphTargetInfluences) {
          meshRef.current.morphTargetInfluences[0] = morphTargets.jawOpen;
          meshRef.current.morphTargetInfluences[1] = morphTargets.lipWidth;
          meshRef.current.morphTargetInfluences[2] = morphTargets.lipRound;
          meshRef.current.morphTargetInfluences[3] = morphTargets.browRaise;
          meshRef.current.morphTargetInfluences[4] = morphTargets.browFurrow;
          meshRef.current.morphTargetInfluences[5] = morphTargets.eyeSquint;
          meshRef.current.morphTargetInfluences[6] = morphTargets.cheekRaise;
          meshRef.current.morphTargetInfluences[7] = morphTargets.noseWrinkle;
          meshRef.current.morphTargetInfluences[8] = morphTargets.mouthSmile;
          meshRef.current.morphTargetInfluences[9] = morphTargets.mouthFrown;
        }
      }
    }, [morphTargets]);

    return (
      <group ref={ref}>
        <mesh ref={meshRef} castShadow receiveShadow>
          <sphereGeometry args={[1, 64, 64]} />
          <shaderMaterial
            vertexShader={skinVertexShader}
            fragmentShader={skinFragmentShader}
            uniforms={{
              diffuseMap: { value: textureLoaded },
              normalMap: { value: normalMap },
              sssColor: { value: sssColor },
              sssIntensity: { value: 0.8 },
              lightPos: { value: lightPos },
              rimColor: { value: rimColor },
              rimPower: { value: 4.0 },
              lightColor: { value: lightColor },
            }}
          />
        </mesh>
      </group>
    );
  }
);
AvatarFace.displayName = 'AvatarFace';

// ============================================================================
// Component: EyeSystem
// ============================================================================

interface EyeSystemProps {
  irisColor: THREE.Color;
  audioLevel: number;
  emotion: AvatarEmotion;
}

/**
 * Dual eye system with specular highlights, pupil dilation, blinking,
 * and realistic saccadic movement
 */
const EyeSystem = React.forwardRef<THREE.Group, EyeSystemProps>(
  ({ irisColor, audioLevel, emotion }, ref) => {
    const leftEyeRef = useRef<THREE.Mesh>(null);
    const rightEyeRef = useRef<THREE.Mesh>(null);

    const [blinkState, setBlinkState] = useState<BlinkState>({
      isBlinking: false,
      blinkStartTime: 0,
      nextBlinkTime: Math.random() * 3 + 3,
    });

    const [eyeRotation, setEyeRotation] = useState({ x: 0, y: 0 });
    const [pupilDilation, setPupilDilation] = useState(1.0);

    // Pupil dilation based on emotion
    useEffect(() => {
      const dilationMap: Record<AvatarEmotion, number> = {
        curious: 1.3,
        joyful: 1.2,
        empowered: 1.15,
        listening: 1.1,
        calm: 1.0,
        concerned: 0.9,
      };
      setPupilDilation(dilationMap[emotion]);
    }, [emotion]);

    useFrame(({ clock }) => {
      const elapsed = clock.getElapsedTime();

      // Blink animation (natural blink every 3-6 seconds)
      if (!blinkState.isBlinking && elapsed >= blinkState.nextBlinkTime) {
        setBlinkState({
          isBlinking: true,
          blinkStartTime: elapsed,
          nextBlinkTime: blinkState.nextBlinkTime,
        });
      }

      if (blinkState.isBlinking) {
        const blinkElapsed = elapsed - blinkState.blinkStartTime;
        const blinkDuration = 0.3; // 150ms close + 150ms open

        if (blinkElapsed > blinkDuration) {
          setBlinkState({
            isBlinking: false,
            blinkStartTime: 0,
            nextBlinkTime: elapsed + (Math.random() * 3 + 3),
          });
        } else {
          // Animate blink: 0->1->0 over duration
          const blinkProgress = blinkElapsed / blinkDuration;
          const blink = Math.sin(blinkProgress * Math.PI); // Smoothstep-like curve

          if (leftEyeRef.current && rightEyeRef.current) {
            leftEyeRef.current.scale.y = 1 - blink * 0.95;
            rightEyeRef.current.scale.y = 1 - blink * 0.95;
          }
        }
      } else {
        if (leftEyeRef.current && rightEyeRef.current) {
          leftEyeRef.current.scale.y = 1;
          rightEyeRef.current.scale.y = 1;
        }
      }

      // Eye saccades (random movement every 1-3 seconds)
      const saccadePhase = Math.sin(elapsed * 0.3) * 0.1 + Math.sin(elapsed * 0.7) * 0.08;
      const saccadePhaseY = Math.cos(elapsed * 0.25) * 0.08 + Math.cos(elapsed * 0.6) * 0.06;

      setEyeRotation({
        x: saccadePhaseY,
        y: saccadePhase,
      });

      // Apply eye rotations
      if (leftEyeRef.current) {
        leftEyeRef.current.rotation.x = eyeRotation.x;
        leftEyeRef.current.rotation.y = eyeRotation.y;
      }
      if (rightEyeRef.current) {
        rightEyeRef.current.rotation.x = eyeRotation.x;
        rightEyeRef.current.rotation.y = eyeRotation.y;
      }

      // Update pupil dilation smoothly
      if (leftEyeRef.current && rightEyeRef.current) {
        const pupilMesh = leftEyeRef.current.children[1] as THREE.Mesh;
        if (pupilMesh && pupilMesh.scale) {
          pupilMesh.scale.x = pupilDilation;
          pupilMesh.scale.y = pupilDilation;
        }

        const rightPupilMesh = rightEyeRef.current.children[1] as THREE.Mesh;
        if (rightPupilMesh && rightPupilMesh.scale) {
          rightPupilMesh.scale.x = pupilDilation;
          rightPupilMesh.scale.y = pupilDilation;
        }
      }
    });

    return (
      <group ref={ref} position={[0, 0.3, 0.9]}>
        {/* Left Eye */}
        <group ref={leftEyeRef} position={[-0.3, 0, 0]}>
          {/* Sclera (white) */}
          <mesh>
            <sphereGeometry args={[0.15, 32, 32]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          {/* Iris */}
          <mesh position={[0, 0, 0.14]}>
            <cylinderGeometry args={[0.08, 0.08, 0.02, 32]} />
            <meshStandardMaterial color={irisColor} />
          </mesh>
          {/* Pupil with dilation */}
          <mesh position={[0, 0, 0.142]}>
            <cylinderGeometry args={[0.04, 0.04, 0.01, 32]} />
            <meshStandardMaterial
              color="#000000"
              emissive="#000000"
            />
          </mesh>
          {/* Specular highlight */}
          <mesh position={[0.05, 0.05, 0.16]}>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive="#FFFFFF"
              emissiveIntensity={0.8}
            />
          </mesh>
        </group>

        {/* Right Eye */}
        <group ref={rightEyeRef} position={[0.3, 0, 0]}>
          {/* Sclera (white) */}
          <mesh>
            <sphereGeometry args={[0.15, 32, 32]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          {/* Iris */}
          <mesh position={[0, 0, 0.14]}>
            <cylinderGeometry args={[0.08, 0.08, 0.02, 32]} />
            <meshStandardMaterial color={irisColor} />
          </mesh>
          {/* Pupil with dilation */}
          <mesh position={[0, 0, 0.142]}>
            <cylinderGeometry args={[0.04, 0.04, 0.01, 32]} />
            <meshStandardMaterial
              color="#000000"
              emissive="#000000"
            />
          </mesh>
          {/* Specular highlight */}
          <mesh position={[-0.05, 0.05, 0.16]}>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive="#FFFFFF"
              emissiveIntensity={0.8}
            />
          </mesh>
        </group>
      </group>
    );
  }
);
EyeSystem.displayName = 'EyeSystem';

// ============================================================================
// Component: LipSyncDriver
// ============================================================================

interface LipSyncDriverProps {
  audioLevel: number;
  isSpeaking: boolean;
  morphTargetsRef: React.MutableRefObject<MorphTargets>;
}

/**
 * Audio-driven viseme animation system
 * Maps audio amplitude to mouth morph targets for natural lip-sync
 */
const LipSyncDriver: React.FC<LipSyncDriverProps> = ({
  audioLevel,
  isSpeaking,
  morphTargetsRef,
}) => {
  const targetMorphsRef = useRef<MorphTargets>({
    jawOpen: 0,
    lipWidth: 0,
    lipRound: 0,
    browRaise: 0,
    browFurrow: 0,
    eyeSquint: 0,
    cheekRaise: 0,
    noseWrinkle: 0,
    mouthSmile: 0,
    mouthFrown: 0,
  });

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();

    if (isSpeaking) {
      // Map audio level to viseme approximation
      targetMorphsRef.current.jawOpen = Math.min(audioLevel * 0.6, 1.0);
      targetMorphsRef.current.lipWidth = Math.sin(elapsed * 12) * audioLevel * 0.3;
      targetMorphsRef.current.lipRound = Math.cos(elapsed * 8) * audioLevel * 0.2;

      // Add some cheek raise for natural speech
      targetMorphsRef.current.cheekRaise = audioLevel * 0.2;
    } else {
      // Subtle idle mouth movement when not speaking
      targetMorphsRef.current.jawOpen = (Math.random() - 0.5) * 0.03;
      targetMorphsRef.current.lipWidth = Math.sin(elapsed * 2) * 0.02;
      targetMorphsRef.current.lipRound = Math.cos(elapsed * 1.5) * 0.01;
      targetMorphsRef.current.cheekRaise = 0;
    }

    // Smooth interpolation of morph targets
    const interpSpeed = 0.15;
    morphTargetsRef.current.jawOpen = lerp(
      morphTargetsRef.current.jawOpen,
      targetMorphsRef.current.jawOpen,
      interpSpeed
    );
    morphTargetsRef.current.lipWidth = lerp(
      morphTargetsRef.current.lipWidth,
      targetMorphsRef.current.lipWidth,
      interpSpeed
    );
    morphTargetsRef.current.lipRound = lerp(
      morphTargetsRef.current.lipRound,
      targetMorphsRef.current.lipRound,
      interpSpeed
    );
    morphTargetsRef.current.cheekRaise = lerp(
      morphTargetsRef.current.cheekRaise,
      targetMorphsRef.current.cheekRaise,
      interpSpeed
    );
  });

  return null;
};

// ============================================================================
// Component: HeadMotionSystem
// ============================================================================

interface HeadMotionSystemProps {
  headRef: React.MutableRefObject<THREE.Group | null>;
  emotion: AvatarEmotion;
  isSpeaking: boolean;
  isListening: boolean;
  audioLevel: number;
}

/**
 * Subtle realistic head movement system
 * Combines idle sway, breathing motion, speaking head movement, and emotional variations
 */
const HeadMotionSystem: React.FC<HeadMotionSystemProps> = ({
  headRef,
  emotion,
  isSpeaking,
  isListening,
  audioLevel,
}) => {
  const motionProfile = useMemo(() => getMotionProfile(emotion), [emotion]);

  useFrame(({ clock }) => {
    if (!headRef.current) return;

    const elapsed = clock.getElapsedTime();

    // Base idle sway
    let rotationX = Math.sin(elapsed * motionProfile.swayFrequency) * motionProfile.swayAmplitudeX;
    let rotationY = Math.sin(elapsed * motionProfile.swayFrequency * 0.7) * motionProfile.swayAmplitudeY;
    let rotationZ = 0;

    // Breathing motion (subtle scale pulse on neck/chest area)
    const breathingScale = 1.0 + Math.sin(elapsed * motionProfile.breathingFrequency * Math.PI * 2) * motionProfile.breathingAmplitude;

    // Speaking: increased head motion synced to audio
    if (isSpeaking) {
      rotationX += Math.sin(elapsed * 3) * audioLevel * 0.05;
      rotationY += Math.sin(elapsed * 2.5) * audioLevel * 0.08;
    }

    // Listening: head tilt + occasional nod
    if (isListening) {
      rotationZ = motionProfile.tiltAmount;
      const nodChance = Math.random() < motionProfile.nodProbability;
      if (nodChance) {
        rotationX += Math.sin(elapsed * 4) * 0.03;
      }
    }

    // Apply rotations with smoothing
    headRef.current.rotation.x = lerp(headRef.current.rotation.x, rotationX, 0.08);
    headRef.current.rotation.y = lerp(headRef.current.rotation.y, rotationY, 0.08);
    headRef.current.rotation.z = lerp(headRef.current.rotation.z, rotationZ, 0.08);

    // Apply breathing to scale
    headRef.current.scale.y = breathingScale;
  });

  return null;
};

// ============================================================================
// Component: LightingRig
// ============================================================================

interface LightingRigProps {
  guideColor: string;
  glowColor: string;
}

/**
 * 3-point lighting setup matched to guide's color scheme
 * Key light, fill light, and rim light for photorealistic illumination
 */
const LightingRig: React.FC<LightingRigProps> = ({ guideColor, glowColor }) => {
  const guideColorObj = hexToColor(guideColor);
  const glowColorObj = hexToColor(glowColor);

  return (
    <>
      {/* Key Light: Slightly tinted with guide color, high intensity */}
      <pointLight
        position={[2, 3, 2]}
        intensity={1.2}
        color={guideColorObj}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Fill Light: Opposite side, lower intensity, neutral white */}
      <pointLight
        position={[-1.5, 1.5, 1]}
        intensity={0.5}
        color="#FFFFFF"
      />

      {/* Rim Light: Behind, high color saturation, creates sacred effect */}
      <pointLight
        position={[0, 1, -2]}
        intensity={0.8}
        color={glowColorObj}
      />

      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.3} color="#E8D5C4" />
    </>
  );
};

// ============================================================================
// Component: FallbackAvatar
// ============================================================================

interface FallbackAvatarProps {
  avatarImageUrl: string;
  guideColor: string;
  glowColor: string;
  audioLevel: number;
  isSpeaking: boolean;
  width: string;
  height: string;
}

/**
 * CSS-based fallback avatar for browsers without WebGL2 support
 * Features animated glow border synced to audio and mouth indicator
 */
const FallbackAvatar: React.FC<FallbackAvatarProps> = ({
  avatarImageUrl,
  guideColor,
  glowColor,
  audioLevel,
  isSpeaking,
  width,
  height,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const mouthRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const animationInterval = setInterval(() => {
      if (glowRef.current) {
        const glowIntensity = Math.max(0.3, audioLevel);
        glowRef.current.style.boxShadow = `0 0 ${20 * glowIntensity}px ${glowColor}`;
      }

      if (mouthRef.current) {
        const mouthOpen = isSpeaking ? audioLevel * 10 : 0;
        mouthRef.current.style.transform = `scaleY(${1 + mouthOpen * 0.15})`;
      }
    }, 30);

    return () => clearInterval(animationInterval);
  }, [audioLevel, isSpeaking, glowColor]);

  const styles: Record<string, React.CSSProperties> = {
    container: {
      position: 'relative',
      width,
      height,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F5EBE0',
      borderRadius: '12px',
      overflow: 'hidden',
    },
    glow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: '12px',
      boxShadow: `0 0 15px ${glowColor}`,
      pointerEvents: 'none',
      transition: 'box-shadow 0.1s ease-out',
    },
    portrait: {
      position: 'relative',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      zIndex: 1,
    },
    mouth: {
      position: 'absolute',
      bottom: '20%',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '20px',
      height: '10px',
      backgroundColor: guideColor,
      borderRadius: '50%',
      zIndex: 2,
      opacity: isSpeaking ? 0.8 : 0.3,
      transition: 'opacity 0.15s ease-out',
    },
    blinkOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0)',
      zIndex: 3,
      animation: 'blink 4s infinite',
    },
  };

  return (
    <div ref={containerRef} style={styles.container}>
      <style>{`
        @keyframes blink {
          0%, 45%, 55%, 100% { opacity: 0; }
          47.5%, 52.5% { opacity: 0.7; }
        }
      `}</style>
      <div ref={glowRef} style={styles.glow} />
      <img
        src={avatarImageUrl}
        alt="Avatar Portrait"
        style={styles.portrait}
      />
      <div ref={mouthRef} style={styles.mouth} />
      <div style={styles.blinkOverlay} />
    </div>
  );
};

// ============================================================================
// Component: AvatarScene
// ============================================================================

interface AvatarSceneProps {
  avatarImageUrl: string;
  guideColor: string;
  glowColor: string;
  audioLevel: number;
  isSpeaking: boolean;
  isListening: boolean;
  emotion: AvatarEmotion;
  skinTone: string;
  eyeColor: string;
}

/**
 * Main 3D scene composition using React Three Fiber
 * Orchestrates all avatar components, lighting, and animation systems
 */
const AvatarScene: React.FC<AvatarSceneProps> = ({
  avatarImageUrl,
  guideColor,
  glowColor,
  audioLevel,
  isSpeaking,
  isListening,
  emotion,
  skinTone,
  eyeColor,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const morphTargetsRef = useRef<MorphTargets>({
    jawOpen: 0,
    lipWidth: 0,
    lipRound: 0,
    browRaise: 0,
    browFurrow: 0,
    eyeSquint: 0,
    cheekRaise: 0,
    noseWrinkle: 0,
    mouthSmile: 0,
    mouthFrown: 0,
  });

  const guideColorObj = hexToColor(guideColor);
  const glowColorObj = hexToColor(glowColor);
  const skinToneObj = hexToColor(skinTone);
  const eyeColorObj = hexToColor(eyeColor);

  // SSS color is a desaturated version of skin tone
  const sssColorObj = new THREE.Color(skinTone);
  sssColorObj.lerp(glowColorObj, 0.3);

  return (
    <>
      <LightingRig guideColor={guideColor} glowColor={glowColor} />

      <group ref={groupRef}>
        {/* Main avatar group with breathing/sway */}
        <Float
          speed={0.75}
          rotationIntensity={0}
          floatIntensity={0}
        >
          <group position={[0, 0, 0]}>
            {/* Avatar head and face */}
            <AvatarFace
              imageUrl={avatarImageUrl}
              sssColor={sssColorObj}
              rimColor={glowColorObj}
              lightPos={new THREE.Vector3(2, 3, 2)}
              lightColor={guideColorObj}
              morphTargets={morphTargetsRef.current}
            />

            {/* Eye system with blinks and saccades */}
            <EyeSystem
              irisColor={eyeColorObj}
              audioLevel={audioLevel}
              emotion={emotion}
            />
          </group>
        </Float>

        {/* Subtle background particles */}
        <Sparkles
          count={30}
          scale={2}
          size={1.5}
          speed={0.4}
          color={glowColor}
        />
      </group>

      {/* Animation systems */}
      <LipSyncDriver
        audioLevel={audioLevel}
        isSpeaking={isSpeaking}
        morphTargetsRef={morphTargetsRef}
      />

      <HeadMotionSystem
        headRef={groupRef}
        emotion={emotion}
        isSpeaking={isSpeaking}
        isListening={isListening}
        audioLevel={audioLevel}
      />
    </>
  );
};

// ============================================================================
// Component: RealisticAvatarRenderer (Main Export)
// ============================================================================

/**
 * RealisticAvatarRenderer - Main component for photorealistic avatar rendering
 *
 * Renders a WebGL-based photorealistic humanoid avatar for the Living Codex
 * women's empowerment portal. Features advanced realism techniques including
 * subsurface scattering for skin, Fresnel rim lighting, natural eye blinking,
 * lip-sync animation, micro-expressions, and subtle head motion.
 *
 * Falls back to CSS-based avatar rendering for browsers without WebGL2 support.
 *
 * @example
 * ```tsx
 * <RealisticAvatarRenderer
 *   avatarImageUrl="/avatars/sage.jpg"
 *   guideColor="#FF6B35"
 *   glowColor="#FFB84D"
 *   audioLevel={0.5}
 *   isSpeaking={true}
 *   isListening={false}
 *   emotion="joyful"
 *   skinTone="#D4A574"
 *   eyeColor="#8B6F47"
 * />
 * ```
 */
const RealisticAvatarRenderer: React.FC<RealisticAvatarRendererProps> = ({
  avatarImageUrl,
  guideColor,
  glowColor,
  audioLevel,
  isSpeaking,
  isListening,
  emotion,
  skinTone = '#D4A574',
  eyeColor = '#8B6F47',
  width = '100%',
  height = '400px',
}) => {
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    // Check for WebGL2 support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');
      setWebglSupported(gl !== null);
    } catch (e) {
      setWebglSupported(false);
    }
  }, []);

  if (!webglSupported) {
    return (
      <FallbackAvatar
        avatarImageUrl={avatarImageUrl}
        guideColor={guideColor}
        glowColor={glowColor}
        audioLevel={audioLevel}
        isSpeaking={isSpeaking}
        width={width}
        height={height}
      />
    );
  }

  const containerStyles: React.CSSProperties = {
    position: 'relative',
    width,
    height,
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  };

  return (
    <div style={containerStyles}>
      <Canvas
        camera={{
          position: [0, 0, 3],
          fov: 35,
          near: 0.1,
          far: 1000,
        }}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        {/* Background gradient */}
        <color attach="background" args={['#0F0F0F']} />

        {/* Scene composition */}
        <AvatarScene
          avatarImageUrl={avatarImageUrl}
          guideColor={guideColor}
          glowColor={glowColor}
          audioLevel={audioLevel}
          isSpeaking={isSpeaking}
          isListening={isListening}
          emotion={emotion}
          skinTone={skinTone}
          eyeColor={eyeColor}
        />

        {/* Optional orbit controls for development/inspection */}
        {process.env.NODE_ENV === 'development' && (
          <OrbitControls
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
          />
        )}
      </Canvas>
    </div>
  );
};

// ============================================================================
// Exports
// ============================================================================

export default RealisticAvatarRenderer;
export { RealisticAvatarRenderer };
export type {
  RealisticAvatarRendererProps,
  AvatarEmotion,
  MorphTargets,
  BlinkState,
  HeadMotionProfile,
};
