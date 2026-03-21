/**
 * RPMAvatarService.ts
 *
 * Ready Player Me integration service for Living Codex™.
 * Handles avatar configuration, blend shape mapping, and lip-sync
 * for full 3D rigged humanoid avatars.
 *
 * Architecture:
 *   - 6 pre-configured guide avatars (GLB models hosted via RPM)
 *   - 52 ARKit blend shapes for facial animation
 *   - Real-time Kokoro TTS → viseme mapping
 *   - Expression system mapped from Living Codex emotions to ARKit targets
 *
 * @module codex/RPMAvatarService
 */

// ============================================================================
// Types
// ============================================================================

/** Living Codex emotion states */
export type CodexEmotion =
  | 'neutral'
  | 'joy'
  | 'concern'
  | 'curiosity'
  | 'calm'
  | 'listening'
  | 'empathy'
  | 'celebration'
  | 'empowerment';

/** RPM avatar body type */
export type RPMBodyType = 'fullbody' | 'halfbody';

/** RPM avatar gender presentation */
export type RPMGender = 'feminine' | 'masculine' | 'neutral';

/** Guide identifier */
export type GuideId = 'kore' | 'aoede' | 'leda' | 'theia' | 'selene' | 'zephyr';

/**
 * Configuration for a single guide's RPM avatar
 */
export interface RPMGuideConfig {
  guideId: GuideId;
  name: string;
  title: string;
  /** Pre-built RPM avatar GLB URL (with morph targets) */
  glbUrl: string;
  /** Fallback portrait image if GLB fails to load */
  fallbackPortrait: string;
  /** RPM avatar ID for API customization */
  rpmAvatarId?: string;
  /** Guide's signature color (hex) for rim lighting */
  guideColor: string;
  /** Guide's glow/emissive color (hex) */
  glowColor: string;
  /** Ambient particle color (hex) */
  particleColor: string;
  /** Default idle animation URL (.glb or .fbx) */
  idleAnimationUrl: string;
  /** Talking animation URL */
  talkAnimationUrl: string;
  /** Listening animation URL */
  listenAnimationUrl: string;
  /** Environment/backdrop description */
  environment: string;
}

/**
 * Morph target weights for a single animation frame.
 * Values are 0-1 unless noted otherwise.
 */
export interface BlendShapeFrame {
  // Eyes
  eyeBlinkLeft: number;
  eyeBlinkRight: number;
  eyeSquintLeft: number;
  eyeSquintRight: number;
  eyeWideLeft: number;
  eyeWideRight: number;
  eyeLookUpLeft: number;
  eyeLookUpRight: number;
  eyeLookDownLeft: number;
  eyeLookDownRight: number;
  eyeLookInLeft: number;
  eyeLookInRight: number;
  eyeLookOutLeft: number;
  eyeLookOutRight: number;

  // Brows
  browDownLeft: number;
  browDownRight: number;
  browInnerUp: number;
  browOuterUpLeft: number;
  browOuterUpRight: number;

  // Jaw
  jawOpen: number;
  jawForward: number;
  jawLeft: number;
  jawRight: number;

  // Mouth
  mouthOpen: number;
  mouthClose: number;
  mouthSmileLeft: number;
  mouthSmileRight: number;
  mouthFrownLeft: number;
  mouthFrownRight: number;
  mouthDimpleLeft: number;
  mouthDimpleRight: number;
  mouthStretchLeft: number;
  mouthStretchRight: number;
  mouthPressLeft: number;
  mouthPressRight: number;
  mouthPucker: number;
  mouthFunnel: number;
  mouthLeft: number;
  mouthRight: number;
  mouthRollLower: number;
  mouthRollUpper: number;
  mouthShrugLower: number;
  mouthShrugUpper: number;
  mouthLowerDownLeft: number;
  mouthLowerDownRight: number;
  mouthUpperUpLeft: number;
  mouthUpperUpRight: number;

  // Cheeks & Nose
  cheekPuff: number;
  cheekSquintLeft: number;
  cheekSquintRight: number;
  noseSneerLeft: number;
  noseSneerRight: number;

  // Tongue
  tongueOut: number;
}

/**
 * Viseme definition mapping phoneme groups to ARKit blend shape weights
 */
export interface VisemeDefinition {
  name: string;
  phonemes: string;
  blendShapes: Partial<BlendShapeFrame>;
  /** Duration weight (some visemes are naturally longer) */
  durationWeight: number;
}

/**
 * Active lip-sync state tracked per frame
 */
export interface LipSyncState {
  currentViseme: string;
  targetViseme: string;
  blendProgress: number; // 0-1 interpolation between current and target
  audioLevel: number;
  isSpeaking: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * RPM API configuration
 */
export const RPM_CONFIG = {
  /** RPM REST API base URL */
  apiBase: 'https://api.readyplayer.me/v2',

  /** Morph targets to request when fetching GLBs */
  morphTargets: [
    // ARKit blend shapes for full facial animation
    'eyeBlinkLeft', 'eyeBlinkRight', 'eyeSquintLeft', 'eyeSquintRight',
    'eyeWideLeft', 'eyeWideRight', 'browDownLeft', 'browDownRight',
    'browInnerUp', 'browOuterUpLeft', 'browOuterUpRight',
    'jawOpen', 'jawForward', 'mouthOpen', 'mouthClose',
    'mouthSmileLeft', 'mouthSmileRight', 'mouthFrownLeft', 'mouthFrownRight',
    'mouthPucker', 'mouthFunnel', 'mouthLeft', 'mouthRight',
    'mouthRollLower', 'mouthRollUpper', 'mouthShrugLower', 'mouthShrugUpper',
    'mouthLowerDownLeft', 'mouthLowerDownRight', 'mouthUpperUpLeft', 'mouthUpperUpRight',
    'mouthStretchLeft', 'mouthStretchRight', 'mouthPressLeft', 'mouthPressRight',
    'mouthDimpleLeft', 'mouthDimpleRight',
    'cheekPuff', 'cheekSquintLeft', 'cheekSquintRight',
    'noseSneerLeft', 'noseSneerRight', 'tongueOut',
  ],

  /** GLB URL parameters for optimized web delivery */
  glbParams: {
    meshLod: 1, // Medium detail (0=highest, 3=lowest)
    textureSizeLimit: 1024,
    textureAtlas: 1024,
    useDracoMeshCompression: true,
    useHands: true,
  },

  /** Animation blend speeds (seconds) */
  blendSpeeds: {
    viseme: 0.08, // Fast for responsive lip-sync
    expression: 0.4, // Smooth for emotion transitions
    blink: 0.12, // Natural blink speed
    idle: 0.6, // Slow for ambient motion
  },
};

/**
 * Build the GLB URL for an RPM avatar with morph targets enabled
 */
export function buildRPMGlbUrl(avatarId: string): string {
  const morphParam = RPM_CONFIG.morphTargets.join(',');
  const params = new URLSearchParams({
    morphTargets: morphParam,
    meshLod: String(RPM_CONFIG.glbParams.meshLod),
    textureSizeLimit: String(RPM_CONFIG.glbParams.textureSizeLimit),
    textureAtlas: String(RPM_CONFIG.glbParams.textureAtlas),
    useDracoMeshCompression: String(RPM_CONFIG.glbParams.useDracoMeshCompression),
    useHands: String(RPM_CONFIG.glbParams.useHands),
  });
  return `https://models.readyplayer.me/${avatarId}.glb?${params.toString()}`;
}

// ============================================================================
// Guide Configurations
// ============================================================================

/**
 * Placeholder RPM avatar IDs — replace with actual RPM avatar IDs after
 * creating avatars via https://readyplayer.me/avatar or the REST API.
 *
 * To create guide avatars:
 * 1. Go to https://readyplayer.me/avatar
 * 2. Create each guide with matching appearance
 * 3. Copy the avatar ID from the URL
 * 4. Replace the placeholder IDs below
 */
const GUIDE_RPM_IDS: Record<GuideId, string> = {
  kore: 'PLACEHOLDER_KORE_RPM_ID',
  aoede: 'PLACEHOLDER_AOEDE_RPM_ID',
  leda: 'PLACEHOLDER_LEDA_RPM_ID',
  theia: 'PLACEHOLDER_THEIA_RPM_ID',
  selene: 'PLACEHOLDER_SELENE_RPM_ID',
  zephyr: 'PLACEHOLDER_ZEPHYR_RPM_ID',
};

/**
 * Hosted animation files for guide behaviors.
 * These are Mixamo-compatible animations re-exported for RPM rigs.
 * Replace with your own hosted animations or use RPM's animation library.
 */
const ANIMATION_URLS = {
  /** Subtle breathing + weight shift */
  idleFeminine: '/assets/animations/idle-feminine.glb',
  /** Gentle gestures while speaking */
  talkingFeminine: '/assets/animations/talking-feminine.glb',
  /** Slight head tilt, attentive posture */
  listeningFeminine: '/assets/animations/listening-feminine.glb',
  /** Welcoming open arms gesture */
  greetingFeminine: '/assets/animations/greeting-feminine.glb',
  /** Thinking pose, hand to chin */
  thinkingFeminine: '/assets/animations/thinking-feminine.glb',
  /** Gentle nod */
  noddingFeminine: '/assets/animations/nodding-feminine.glb',
};

/**
 * Complete guide avatar configurations
 */
export const GUIDE_CONFIGS: Record<GuideId, RPMGuideConfig> = {
  kore: {
    guideId: 'kore',
    name: 'Kore',
    title: 'Orientation Guide',
    glbUrl: buildRPMGlbUrl(GUIDE_RPM_IDS.kore),
    fallbackPortrait: '/assets/avatars/kore-prime/portrait-kore.png',
    rpmAvatarId: GUIDE_RPM_IDS.kore,
    guideColor: '#D4AF37', // Gold
    glowColor: '#FFD700',
    particleColor: '#FFF8DC',
    idleAnimationUrl: ANIMATION_URLS.idleFeminine,
    talkAnimationUrl: ANIMATION_URLS.talkingFeminine,
    listenAnimationUrl: ANIMATION_URLS.listeningFeminine,
    environment: 'Warm sacred temple with soft golden light',
  },
  aoede: {
    guideId: 'aoede',
    name: 'Aoede',
    title: 'Archetype Reflection',
    glbUrl: buildRPMGlbUrl(GUIDE_RPM_IDS.aoede),
    fallbackPortrait: '/assets/avatars/kore-prime/portrait-aoede.png',
    rpmAvatarId: GUIDE_RPM_IDS.aoede,
    guideColor: '#9B59B6', // Violet
    glowColor: '#8E44AD',
    particleColor: '#E8DAEF',
    idleAnimationUrl: ANIMATION_URLS.idleFeminine,
    talkAnimationUrl: ANIMATION_URLS.talkingFeminine,
    listenAnimationUrl: ANIMATION_URLS.listeningFeminine,
    environment: 'Creative studio with mirrors and violet light',
  },
  leda: {
    guideId: 'leda',
    name: 'Leda',
    title: 'Journal Companion',
    glbUrl: buildRPMGlbUrl(GUIDE_RPM_IDS.leda),
    fallbackPortrait: '/assets/avatars/kore-prime/portrait-leda.png',
    rpmAvatarId: GUIDE_RPM_IDS.leda,
    guideColor: '#FFB6C1', // Rose
    glowColor: '#FF69B4',
    particleColor: '#FFF0F5',
    idleAnimationUrl: ANIMATION_URLS.idleFeminine,
    talkAnimationUrl: ANIMATION_URLS.talkingFeminine,
    listenAnimationUrl: ANIMATION_URLS.listeningFeminine,
    environment: 'Warm garden alcove with climbing roses',
  },
  theia: {
    guideId: 'theia',
    name: 'Theia',
    title: 'NS Support',
    glbUrl: buildRPMGlbUrl(GUIDE_RPM_IDS.theia),
    fallbackPortrait: '/assets/avatars/kore-prime/portrait-theia.png',
    rpmAvatarId: GUIDE_RPM_IDS.theia,
    guideColor: '#2ECC71', // Emerald
    glowColor: '#27AE60',
    particleColor: '#E8F8F5',
    idleAnimationUrl: ANIMATION_URLS.idleFeminine,
    talkAnimationUrl: ANIMATION_URLS.talkingFeminine,
    listenAnimationUrl: ANIMATION_URLS.listeningFeminine,
    environment: 'Misty forest clearing with ancient stones',
  },
  selene: {
    guideId: 'selene',
    name: 'Selene',
    title: 'Resource Librarian',
    glbUrl: buildRPMGlbUrl(GUIDE_RPM_IDS.selene),
    fallbackPortrait: '/assets/avatars/kore-prime/portrait-selene.png',
    rpmAvatarId: GUIDE_RPM_IDS.selene,
    guideColor: '#2471A3', // Sapphire
    glowColor: '#1A5276',
    particleColor: '#D6EAF8',
    idleAnimationUrl: ANIMATION_URLS.idleFeminine,
    talkAnimationUrl: ANIMATION_URLS.talkingFeminine,
    listenAnimationUrl: ANIMATION_URLS.listeningFeminine,
    environment: 'Grand library with warm lamp light',
  },
  zephyr: {
    guideId: 'zephyr',
    name: 'Zephyr',
    title: 'Community Concierge',
    glbUrl: buildRPMGlbUrl(GUIDE_RPM_IDS.zephyr),
    fallbackPortrait: '/assets/avatars/kore-prime/portrait-zephyr.png',
    rpmAvatarId: GUIDE_RPM_IDS.zephyr,
    guideColor: '#FF6B35', // Coral
    glowColor: '#E74C3C',
    particleColor: '#FDEBD0',
    idleAnimationUrl: ANIMATION_URLS.idleFeminine,
    talkAnimationUrl: ANIMATION_URLS.talkingFeminine,
    listenAnimationUrl: ANIMATION_URLS.listeningFeminine,
    environment: 'Sunset terrace with warm city skyline',
  },
};

// ============================================================================
// Viseme Mapping (Kokoro TTS phonemes → ARKit blend shapes)
// ============================================================================

/**
 * 15-viseme map: Maps standard TTS visemes to ARKit blend shape weights.
 * Each viseme defines which blend shapes to activate and by how much
 * to create the correct mouth shape for that phoneme group.
 */
export const VISEME_MAP: Record<string, VisemeDefinition> = {
  sil: {
    name: 'Silence',
    phonemes: '(silence)',
    blendShapes: {
      jawOpen: 0,
      mouthClose: 0.1,
    },
    durationWeight: 1.0,
  },
  PP: {
    name: 'Bilabial Plosive',
    phonemes: 'p, b, m',
    blendShapes: {
      jawOpen: 0.05,
      mouthClose: 0.6,
      mouthPressLeft: 0.4,
      mouthPressRight: 0.4,
      mouthPucker: 0.15,
    },
    durationWeight: 0.6,
  },
  FF: {
    name: 'Labiodental Fricative',
    phonemes: 'f, v',
    blendShapes: {
      jawOpen: 0.1,
      mouthFunnel: 0.3,
      mouthLowerDownLeft: 0.3,
      mouthLowerDownRight: 0.3,
      mouthUpperUpLeft: 0.15,
      mouthUpperUpRight: 0.15,
    },
    durationWeight: 0.8,
  },
  TH: {
    name: 'Dental Fricative',
    phonemes: 'th (thin, that)',
    blendShapes: {
      jawOpen: 0.12,
      tongueOut: 0.4,
      mouthOpen: 0.1,
    },
    durationWeight: 0.7,
  },
  DD: {
    name: 'Alveolar Plosive',
    phonemes: 't, d, n, l',
    blendShapes: {
      jawOpen: 0.15,
      mouthOpen: 0.12,
      mouthStretchLeft: 0.1,
      mouthStretchRight: 0.1,
    },
    durationWeight: 0.5,
  },
  kk: {
    name: 'Velar Plosive',
    phonemes: 'k, g, ng',
    blendShapes: {
      jawOpen: 0.2,
      mouthOpen: 0.18,
      mouthFunnel: 0.1,
    },
    durationWeight: 0.5,
  },
  CH: {
    name: 'Postalveolar Affricate',
    phonemes: 'ch, j, sh, zh',
    blendShapes: {
      jawOpen: 0.12,
      mouthPucker: 0.35,
      mouthFunnel: 0.4,
      mouthShrugUpper: 0.15,
    },
    durationWeight: 0.7,
  },
  SS: {
    name: 'Alveolar Fricative',
    phonemes: 's, z',
    blendShapes: {
      jawOpen: 0.08,
      mouthStretchLeft: 0.25,
      mouthStretchRight: 0.25,
      mouthSmileLeft: 0.1,
      mouthSmileRight: 0.1,
    },
    durationWeight: 0.8,
  },
  nn: {
    name: 'Nasal',
    phonemes: 'n, l (nasal)',
    blendShapes: {
      jawOpen: 0.1,
      mouthOpen: 0.08,
      mouthSmileLeft: 0.05,
      mouthSmileRight: 0.05,
    },
    durationWeight: 0.6,
  },
  RR: {
    name: 'Approximant',
    phonemes: 'r',
    blendShapes: {
      jawOpen: 0.15,
      mouthPucker: 0.25,
      mouthFunnel: 0.2,
      mouthRollLower: 0.1,
    },
    durationWeight: 0.6,
  },
  aa: {
    name: 'Open Vowel',
    phonemes: 'a (father)',
    blendShapes: {
      jawOpen: 0.55,
      mouthOpen: 0.5,
      mouthLowerDownLeft: 0.3,
      mouthLowerDownRight: 0.3,
    },
    durationWeight: 1.0,
  },
  E: {
    name: 'Mid Front Vowel',
    phonemes: 'e (bed)',
    blendShapes: {
      jawOpen: 0.3,
      mouthOpen: 0.25,
      mouthStretchLeft: 0.3,
      mouthStretchRight: 0.3,
      mouthSmileLeft: 0.15,
      mouthSmileRight: 0.15,
    },
    durationWeight: 1.0,
  },
  ih: {
    name: 'Close Front Vowel',
    phonemes: 'i (see)',
    blendShapes: {
      jawOpen: 0.15,
      mouthOpen: 0.1,
      mouthSmileLeft: 0.35,
      mouthSmileRight: 0.35,
      mouthStretchLeft: 0.2,
      mouthStretchRight: 0.2,
    },
    durationWeight: 1.0,
  },
  oh: {
    name: 'Mid Back Vowel',
    phonemes: 'o (go)',
    blendShapes: {
      jawOpen: 0.35,
      mouthOpen: 0.3,
      mouthPucker: 0.4,
      mouthFunnel: 0.35,
    },
    durationWeight: 1.0,
  },
  ou: {
    name: 'Close Back Vowel',
    phonemes: 'u (you)',
    blendShapes: {
      jawOpen: 0.2,
      mouthPucker: 0.6,
      mouthFunnel: 0.5,
      mouthRollLower: 0.15,
      mouthRollUpper: 0.15,
    },
    durationWeight: 1.0,
  },
};

/**
 * All viseme names in order (for indexing)
 */
export const VISEME_NAMES = Object.keys(VISEME_MAP);

// ============================================================================
// Expression Mapping (Living Codex emotions → ARKit blend shapes)
// ============================================================================

/**
 * Maps Living Codex emotion states to ARKit blend shape weights.
 * These are layered ON TOP of any active visemes during speech.
 */
export const EXPRESSION_MAP: Record<CodexEmotion, Partial<BlendShapeFrame>> = {
  neutral: {
    // Baseline — all zeros (natural resting face)
  },

  joy: {
    mouthSmileLeft: 0.65,
    mouthSmileRight: 0.65,
    cheekSquintLeft: 0.4,
    cheekSquintRight: 0.4,
    eyeSquintLeft: 0.3,
    eyeSquintRight: 0.3,
    browInnerUp: 0.2,
    browOuterUpLeft: 0.15,
    browOuterUpRight: 0.15,
    mouthDimpleLeft: 0.2,
    mouthDimpleRight: 0.2,
    noseSneerLeft: 0.1,
    noseSneerRight: 0.1,
  },

  concern: {
    browInnerUp: 0.5,
    browDownLeft: 0.3,
    browDownRight: 0.3,
    mouthFrownLeft: 0.25,
    mouthFrownRight: 0.25,
    mouthPressLeft: 0.15,
    mouthPressRight: 0.15,
    eyeSquintLeft: 0.15,
    eyeSquintRight: 0.15,
  },

  curiosity: {
    browInnerUp: 0.4,
    browOuterUpLeft: 0.5,
    browOuterUpRight: 0.5,
    eyeWideLeft: 0.3,
    eyeWideRight: 0.3,
    mouthSmileLeft: 0.15,
    mouthSmileRight: 0.15,
    mouthOpen: 0.05,
  },

  calm: {
    eyeBlinkLeft: 0.1, // Slightly heavy lids
    eyeBlinkRight: 0.1,
    mouthSmileLeft: 0.1,
    mouthSmileRight: 0.1,
    cheekSquintLeft: 0.05,
    cheekSquintRight: 0.05,
  },

  listening: {
    browInnerUp: 0.15,
    eyeWideLeft: 0.15,
    eyeWideRight: 0.15,
    mouthSmileLeft: 0.05,
    mouthSmileRight: 0.05,
  },

  empathy: {
    browInnerUp: 0.35,
    browDownLeft: 0.15,
    browDownRight: 0.15,
    mouthSmileLeft: 0.2,
    mouthSmileRight: 0.2,
    eyeSquintLeft: 0.1,
    eyeSquintRight: 0.1,
    cheekSquintLeft: 0.15,
    cheekSquintRight: 0.15,
    mouthFrownLeft: 0.1,
    mouthFrownRight: 0.1,
  },

  celebration: {
    mouthSmileLeft: 0.85,
    mouthSmileRight: 0.85,
    cheekSquintLeft: 0.6,
    cheekSquintRight: 0.6,
    eyeSquintLeft: 0.4,
    eyeSquintRight: 0.4,
    browOuterUpLeft: 0.4,
    browOuterUpRight: 0.4,
    browInnerUp: 0.3,
    mouthOpen: 0.15,
    jawOpen: 0.1,
    noseSneerLeft: 0.15,
    noseSneerRight: 0.15,
  },

  empowerment: {
    mouthSmileLeft: 0.45,
    mouthSmileRight: 0.45,
    browOuterUpLeft: 0.2,
    browOuterUpRight: 0.2,
    eyeSquintLeft: 0.15,
    eyeSquintRight: 0.15,
    cheekSquintLeft: 0.2,
    cheekSquintRight: 0.2,
    jawForward: 0.05, // Subtle confident jaw
    mouthShrugLower: 0.1,
  },
};

// ============================================================================
// Blink System
// ============================================================================

export interface BlinkConfig {
  /** Minimum seconds between blinks */
  minInterval: number;
  /** Maximum seconds between blinks */
  maxInterval: number;
  /** Blink down duration (seconds) */
  closeDuration: number;
  /** Blink open duration (seconds) */
  openDuration: number;
  /** Chance of double-blink (0-1) */
  doubleBlinkChance: number;
}

export const DEFAULT_BLINK_CONFIG: BlinkConfig = {
  minInterval: 2.0,
  maxInterval: 6.0,
  closeDuration: 0.08,
  openDuration: 0.12,
  doubleBlinkChance: 0.15,
};

/**
 * Manages natural-looking blink timing and animation.
 * Call `update(deltaTime)` each frame and read `blinkValue` (0-1).
 */
export class BlinkController {
  private config: BlinkConfig;
  private timer: number = 0;
  private nextBlink: number = 0;
  private blinkPhase: 'waiting' | 'closing' | 'opening' | 'pause' = 'waiting';
  private phaseTimer: number = 0;
  private isDoubleBlink: boolean = false;
  private doubleBlinkCount: number = 0;

  /** Current blink value: 0 = eyes open, 1 = eyes closed */
  public blinkValue: number = 0;

  constructor(config: BlinkConfig = DEFAULT_BLINK_CONFIG) {
    this.config = config;
    this.scheduleNextBlink();
  }

  private scheduleNextBlink() {
    const { minInterval, maxInterval } = this.config;
    this.nextBlink = minInterval + Math.random() * (maxInterval - minInterval);
    this.timer = 0;
  }

  update(deltaTime: number) {
    switch (this.blinkPhase) {
      case 'waiting':
        this.timer += deltaTime;
        if (this.timer >= this.nextBlink) {
          this.blinkPhase = 'closing';
          this.phaseTimer = 0;
          this.isDoubleBlink = Math.random() < this.config.doubleBlinkChance;
          this.doubleBlinkCount = 0;
        }
        break;

      case 'closing':
        this.phaseTimer += deltaTime;
        this.blinkValue = Math.min(this.phaseTimer / this.config.closeDuration, 1.0);
        if (this.phaseTimer >= this.config.closeDuration) {
          this.blinkPhase = 'opening';
          this.phaseTimer = 0;
        }
        break;

      case 'opening':
        this.phaseTimer += deltaTime;
        this.blinkValue = Math.max(1.0 - this.phaseTimer / this.config.openDuration, 0.0);
        if (this.phaseTimer >= this.config.openDuration) {
          if (this.isDoubleBlink && this.doubleBlinkCount === 0) {
            this.doubleBlinkCount++;
            this.blinkPhase = 'pause';
            this.phaseTimer = 0;
          } else {
            this.blinkPhase = 'waiting';
            this.blinkValue = 0;
            this.scheduleNextBlink();
          }
        }
        break;

      case 'pause':
        this.phaseTimer += deltaTime;
        this.blinkValue = 0;
        if (this.phaseTimer >= 0.08) {
          this.blinkPhase = 'closing';
          this.phaseTimer = 0;
        }
        break;
    }
  }
}

// ============================================================================
// Micro-Movement System (Idle Animation Enhancement)
// ============================================================================

export interface MicroMovementConfig {
  /** Head sway amplitude (radians) */
  headSwayAmount: number;
  /** Head sway speed */
  headSwaySpeed: number;
  /** Breathing amplitude (scale factor) */
  breathingAmount: number;
  /** Breathing speed (cycles per second) */
  breathingSpeed: number;
  /** Subtle eye drift amplitude */
  eyeDriftAmount: number;
  /** Eye drift speed */
  eyeDriftSpeed: number;
}

export const DEFAULT_MICRO_MOVEMENT: MicroMovementConfig = {
  headSwayAmount: 0.015,
  headSwaySpeed: 0.3,
  breathingAmount: 0.003,
  breathingSpeed: 0.2,
  eyeDriftAmount: 0.08,
  eyeDriftSpeed: 0.5,
};

/**
 * Generates organic micro-movements for idle animation.
 * Uses layered sine waves for natural, non-repetitive motion.
 */
export class MicroMovementController {
  private config: MicroMovementConfig;
  private elapsed: number = 0;

  constructor(config: MicroMovementConfig = DEFAULT_MICRO_MOVEMENT) {
    this.config = config;
  }

  update(deltaTime: number) {
    this.elapsed += deltaTime;
  }

  /** Head rotation offsets (x, y, z in radians) */
  getHeadRotation(): [number, number, number] {
    const t = this.elapsed;
    const c = this.config;
    return [
      Math.sin(t * c.headSwaySpeed * 1.1) * c.headSwayAmount * 0.5 +
        Math.sin(t * c.headSwaySpeed * 0.7) * c.headSwayAmount * 0.3,
      Math.sin(t * c.headSwaySpeed * 0.8) * c.headSwayAmount +
        Math.cos(t * c.headSwaySpeed * 0.5) * c.headSwayAmount * 0.4,
      Math.sin(t * c.headSwaySpeed * 0.6) * c.headSwayAmount * 0.3,
    ];
  }

  /** Chest/spine scale for breathing (uniform scale multiplier) */
  getBreathingScale(): number {
    const t = this.elapsed;
    const c = this.config;
    return 1.0 + Math.sin(t * c.breathingSpeed * Math.PI * 2) * c.breathingAmount;
  }

  /** Eye look direction offsets for natural drift */
  getEyeDrift(): { lookX: number; lookY: number } {
    const t = this.elapsed;
    const c = this.config;
    return {
      lookX: Math.sin(t * c.eyeDriftSpeed * 1.3) * c.eyeDriftAmount +
        Math.cos(t * c.eyeDriftSpeed * 0.7) * c.eyeDriftAmount * 0.5,
      lookY: Math.sin(t * c.eyeDriftSpeed * 0.9) * c.eyeDriftAmount * 0.6 +
        Math.cos(t * c.eyeDriftSpeed * 1.1) * c.eyeDriftAmount * 0.3,
    };
  }
}

// ============================================================================
// Audio-to-Viseme Engine
// ============================================================================

/**
 * Real-time audio analysis for driving lip-sync from Kokoro TTS output.
 * Uses frequency-band analysis to estimate which viseme is most likely.
 */
export class AudioVisemeEngine {
  private analyser: AnalyserNode | null = null;
  private frequencyData: Uint8Array | null = null;
  private currentViseme: string = 'sil';
  private targetViseme: string = 'sil';
  private blendProgress: number = 0;
  private currentWeights: Partial<BlendShapeFrame> = {};
  private targetWeights: Partial<BlendShapeFrame> = {};

  /** Connect to an AudioContext analyser node (from Kokoro TTS) */
  connectAnalyser(analyser: AnalyserNode) {
    this.analyser = analyser;
    this.frequencyData = new Uint8Array(analyser.frequencyBinCount);
  }

  /** Disconnect audio analysis */
  disconnect() {
    this.analyser = null;
    this.frequencyData = null;
    this.currentViseme = 'sil';
    this.targetViseme = 'sil';
  }

  /**
   * Update viseme state from audio analysis.
   * Call every frame with delta time.
   * Returns blend shape weights to apply to the avatar.
   */
  update(deltaTime: number, audioLevel: number, isSpeaking: boolean): Partial<BlendShapeFrame> {
    if (!isSpeaking || audioLevel < 0.01) {
      // Fade to silence
      this.targetViseme = 'sil';
      this.targetWeights = VISEME_MAP.sil.blendShapes;
    } else {
      // Estimate viseme from audio characteristics
      this.targetViseme = this.estimateViseme(audioLevel);
      this.targetWeights = VISEME_MAP[this.targetViseme]?.blendShapes || {};
    }

    // Smooth interpolation between current and target
    const blendSpeed = RPM_CONFIG.blendSpeeds.viseme;
    const t = Math.min(deltaTime / blendSpeed, 1.0);

    const result: Partial<BlendShapeFrame> = {};
    const allKeys = new Set([
      ...Object.keys(this.currentWeights),
      ...Object.keys(this.targetWeights),
    ]);

    for (const key of allKeys) {
      const current = (this.currentWeights as any)[key] || 0;
      const target = (this.targetWeights as any)[key] || 0;
      const blended = current + (target - current) * t;
      (result as any)[key] = blended;
      (this.currentWeights as any)[key] = blended;
    }

    // Scale all mouth shapes by audio level for natural amplitude
    const amplitudeScale = Math.min(audioLevel * 2.0, 1.0);
    if (result.jawOpen !== undefined) result.jawOpen *= amplitudeScale;
    if (result.mouthOpen !== undefined) result.mouthOpen *= amplitudeScale;

    return result;
  }

  /**
   * Estimate the most likely viseme from audio level and frequency data.
   * This is a simplified approach — for production, use spectral analysis
   * or a pre-trained viseme classifier.
   */
  private estimateViseme(audioLevel: number): string {
    // Get frequency data if available
    let lowEnergy = 0;
    let midEnergy = 0;
    let highEnergy = 0;

    if (this.analyser && this.frequencyData) {
      this.analyser.getByteFrequencyData(this.frequencyData);
      const binCount = this.frequencyData.length;
      const third = Math.floor(binCount / 3);

      for (let i = 0; i < third; i++) lowEnergy += this.frequencyData[i];
      for (let i = third; i < third * 2; i++) midEnergy += this.frequencyData[i];
      for (let i = third * 2; i < binCount; i++) highEnergy += this.frequencyData[i];

      const total = lowEnergy + midEnergy + highEnergy || 1;
      lowEnergy /= total;
      midEnergy /= total;
      highEnergy /= total;
    } else {
      // Fallback: cycle through visemes based on time for natural movement
      const t = Date.now() / 1000;
      const cycle = Math.sin(t * 8) * 0.5 + 0.5;

      if (audioLevel > 0.6) return cycle > 0.5 ? 'aa' : 'oh';
      if (audioLevel > 0.35) return cycle > 0.5 ? 'E' : 'DD';
      if (audioLevel > 0.15) return cycle > 0.5 ? 'ih' : 'nn';
      return 'sil';
    }

    // Frequency-based viseme estimation
    if (highEnergy > 0.45) return 'SS'; // High freq → sibilants
    if (lowEnergy > 0.55 && audioLevel > 0.5) return 'aa'; // Strong low → open vowel
    if (midEnergy > 0.5 && audioLevel > 0.3) return 'E'; // Mid freq → mid vowel
    if (lowEnergy > 0.5 && audioLevel < 0.3) return 'PP'; // Low + quiet → bilabial
    if (audioLevel > 0.4) return 'oh'; // Moderate level → rounded vowel
    if (audioLevel > 0.2) return 'DD'; // Light → alveolar
    return 'nn'; // Very light → nasal
  }

  /** Get current lip-sync state for debugging/UI */
  getState(): LipSyncState {
    return {
      currentViseme: this.currentViseme,
      targetViseme: this.targetViseme,
      blendProgress: this.blendProgress,
      audioLevel: 0,
      isSpeaking: this.targetViseme !== 'sil',
    };
  }
}

// ============================================================================
// Blend Shape Compositor
// ============================================================================

/**
 * Composites multiple blend shape layers (visemes, expressions, blinks, micro-movements)
 * into a single set of morph target weights.
 *
 * Priority order (highest to lowest):
 * 1. Blinks (override eye targets)
 * 2. Visemes (override mouth targets during speech)
 * 3. Expressions (base emotional state)
 * 4. Micro-movements (subtle ambient motion)
 */
export class BlendShapeCompositor {
  private blink: BlinkController;
  private microMovement: MicroMovementController;
  private visemeEngine: AudioVisemeEngine;

  private currentEmotion: CodexEmotion = 'neutral';
  private targetEmotion: CodexEmotion = 'neutral';
  private emotionBlend: number = 1.0;
  private currentExpressionWeights: Partial<BlendShapeFrame> = {};

  constructor() {
    this.blink = new BlinkController();
    this.microMovement = new MicroMovementController();
    this.visemeEngine = new AudioVisemeEngine();
  }

  /** Get the audio viseme engine for connecting to Kokoro TTS */
  getVisemeEngine(): AudioVisemeEngine {
    return this.visemeEngine;
  }

  /** Get the micro movement controller for head/body animation */
  getMicroMovement(): MicroMovementController {
    return this.microMovement;
  }

  /** Set the target emotion (will blend smoothly) */
  setEmotion(emotion: CodexEmotion) {
    if (emotion !== this.targetEmotion) {
      this.targetEmotion = emotion;
      this.emotionBlend = 0;
    }
  }

  /**
   * Update all animation systems and return composited blend shape weights.
   * Call once per frame.
   */
  update(
    deltaTime: number,
    audioLevel: number,
    isSpeaking: boolean,
  ): Partial<BlendShapeFrame> {
    // Update subsystems
    this.blink.update(deltaTime);
    this.microMovement.update(deltaTime);

    // Update emotion blend
    if (this.emotionBlend < 1.0) {
      this.emotionBlend = Math.min(this.emotionBlend + deltaTime / RPM_CONFIG.blendSpeeds.expression, 1.0);
      if (this.emotionBlend >= 1.0) {
        this.currentEmotion = this.targetEmotion;
      }
    }

    // Get expression weights (interpolated between current and target emotion)
    const currentExpr = EXPRESSION_MAP[this.currentEmotion] || {};
    const targetExpr = EXPRESSION_MAP[this.targetEmotion] || {};
    const expressionWeights: Partial<BlendShapeFrame> = {};

    const allExprKeys = new Set([...Object.keys(currentExpr), ...Object.keys(targetExpr)]);
    for (const key of allExprKeys) {
      const from = (currentExpr as any)[key] || 0;
      const to = (targetExpr as any)[key] || 0;
      (expressionWeights as any)[key] = from + (to - from) * this.emotionBlend;
    }

    // Get viseme weights
    const visemeWeights = this.visemeEngine.update(deltaTime, audioLevel, isSpeaking);

    // Get eye drift
    const eyeDrift = this.microMovement.getEyeDrift();

    // Composite all layers
    const result: Partial<BlendShapeFrame> = { ...expressionWeights };

    // Layer visemes ON TOP of expressions (mouth area only)
    if (isSpeaking) {
      const mouthKeys = [
        'jawOpen', 'jawForward', 'mouthOpen', 'mouthClose',
        'mouthSmileLeft', 'mouthSmileRight', 'mouthFrownLeft', 'mouthFrownRight',
        'mouthPucker', 'mouthFunnel', 'mouthLeft', 'mouthRight',
        'mouthRollLower', 'mouthRollUpper', 'mouthShrugLower', 'mouthShrugUpper',
        'mouthLowerDownLeft', 'mouthLowerDownRight', 'mouthUpperUpLeft', 'mouthUpperUpRight',
        'mouthStretchLeft', 'mouthStretchRight', 'mouthPressLeft', 'mouthPressRight',
        'mouthDimpleLeft', 'mouthDimpleRight', 'tongueOut',
      ];
      for (const key of mouthKeys) {
        const visemeVal = (visemeWeights as any)[key];
        if (visemeVal !== undefined) {
          // Blend: 80% viseme, 20% expression for mouth area during speech
          const exprVal = (expressionWeights as any)[key] || 0;
          (result as any)[key] = visemeVal * 0.8 + exprVal * 0.2;
        }
      }
    }

    // Layer blinks (override eye blink targets)
    const blinkVal = this.blink.blinkValue;
    if (blinkVal > 0.01) {
      result.eyeBlinkLeft = Math.max((result.eyeBlinkLeft || 0), blinkVal);
      result.eyeBlinkRight = Math.max((result.eyeBlinkRight || 0), blinkVal);
    }

    // Layer eye drift (additive)
    result.eyeLookInLeft = (result.eyeLookInLeft || 0) + Math.max(0, eyeDrift.lookX);
    result.eyeLookOutLeft = (result.eyeLookOutLeft || 0) + Math.max(0, -eyeDrift.lookX);
    result.eyeLookInRight = (result.eyeLookInRight || 0) + Math.max(0, -eyeDrift.lookX);
    result.eyeLookOutRight = (result.eyeLookOutRight || 0) + Math.max(0, eyeDrift.lookX);
    result.eyeLookUpLeft = (result.eyeLookUpLeft || 0) + Math.max(0, eyeDrift.lookY);
    result.eyeLookUpRight = (result.eyeLookUpRight || 0) + Math.max(0, eyeDrift.lookY);
    result.eyeLookDownLeft = (result.eyeLookDownLeft || 0) + Math.max(0, -eyeDrift.lookY);
    result.eyeLookDownRight = (result.eyeLookDownRight || 0) + Math.max(0, -eyeDrift.lookY);

    return result;
  }
}

// ============================================================================
// Exports
// ============================================================================

export {
  GUIDE_RPM_IDS,
  ANIMATION_URLS,
};
