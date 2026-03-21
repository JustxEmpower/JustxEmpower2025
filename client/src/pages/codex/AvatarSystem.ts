/**
 * AvatarSystem.ts
 *
 * Core avatar system for Living Codex™ women's empowerment portal.
 * Supports photorealistic 3D humanoid avatars rendered in Three.js
 * with full diversity representation and comprehensive customization.
 *
 * SAFETY: All avatars are professional, dignified, clothed, and age-appropriate.
 * Explicit content safeguards are enforced throughout.
 *
 * @module AvatarSystem
 */

/**
 * Represents a named skin tone with shader properties
 */
export interface SkinTone {
  id: string;
  name: string;
  hexValue: string;
  undertone: 'warm' | 'cool' | 'neutral';
  subsurfaceColor: string;
  description: string;
}

/**
 * Maps viseme phonemes to mouth deformation parameters
 * for synchronizing speech with avatar animation
 */
export interface VisemeConfig {
  viseme: string;
  jawOpen: number; // 0-1
  lipWidth: number; // 0-1
  lipRound: number; // 0-1
  tongueUp: number; // 0-1
}

/**
 * Face geometry parameters for mesh deformation
 * Allows procedural generation of diverse facial features
 */
export interface FaceGeometry {
  jawWidth: number; // 0.5-1.5 (relative scale)
  cheekHeight: number; // 0.6-1.4
  noseWidth: number; // 0.5-1.3
  lipFullness: number; // 0.4-1.6
  eyeSize: number; // 0.8-1.3
  browArch: number; // 0.3-1.2
  foreheadHeight: number; // 0.7-1.4
  chinShape: number; // 0 (pointed) to 1 (rounded)
}

/**
 * User customization options for avatar appearance
 * All parameters are optional and safe-guarded
 */
export interface AvatarCustomization {
  skinTone: string; // hex color or skin tone ID
  hairStyle:
    | 'natural_coils'
    | 'tight_curls'
    | 'loose_curls'
    | 'locs'
    | 'braids'
    | 'cornrows'
    | 'afro'
    | 'straight'
    | 'wavy'
    | 'pixie'
    | 'long_flowing'
    | 'shaved'
    | 'headwrap';
  hairColor: string; // hex color
  bodyType: 'slim' | 'athletic' | 'curvy' | 'plus_size';
  ageRange: 'young_adult_20s' | 'adult_30s' | 'mature_40s' | 'elder_50plus';
  eyeColor: string; // hex color
  outfitStyle:
    | 'flowing_robes'
    | 'modern_elegant'
    | 'sacred_warrior'
    | 'earth_mother'
    | 'celestial'
    | 'professional';
  accessories: Array<
    | 'crown'
    | 'circlet'
    | 'pendant'
    | 'arm_cuffs'
    | 'earrings'
    | 'nose_ring'
    | 'headwrap_accent'
  >;
  faceGeometry?: FaceGeometry;
}

/**
 * Diversity metadata for avatar representation
 */
export interface DiversityMetadata {
  skinTone: string;
  bodyType: string;
  hairStyle: string;
  hairTexture: 'coily' | 'curly' | 'wavy' | 'straight' | 'textured';
  ageRange: string;
  ethnicity?: string; // optional descriptive label
}

/**
 * Preset avatar configuration for each guide
 * Includes pre-configured appearance, outfit, and accessories
 */
export interface AvatarPreset {
  id: string;
  name: string;
  guideId: string;
  description: string;
  imageUrl: string; // placeholder path to /assets/avatars/presets/
  thumbnailUrl: string; // smaller preview image
  customization: AvatarCustomization;
  diversityMetadata: DiversityMetadata;
  outfitDescription: string;
  sacredAccessories: Array<{
    type: string;
    color: string;
    symbolism: string;
  }>;
  createdAt?: Date;
}

/**
 * Avatar emotional expression configuration
 * Maps emotional states to facial parameter adjustments
 */
export interface ExpressionConfig {
  emotion: string;
  browOffset: number; // -1 to 1
  eyeSquint: number; // 0-1
  eyeWideness: number; // -1 to 1
  mouthCurve: number; // -1 (frown) to 1 (smile)
  cheekRaise: number; // 0-1
  noseWrinkle: number; // 0-1
  jawSlack: number; // 0-1
  lipTension: number; // -1 (relaxed) to 1 (tight)
}

/**
 * Complete avatar instance with all customization and state
 */
export interface AvatarInstance {
  id: string;
  guideId: string;
  preset?: AvatarPreset;
  customization: AvatarCustomization;
  currentExpression: string; // emotion key
  voiceCharacteristics?: {
    pitch: number; // 0.5-2.0
    speed: number; // 0.5-2.0
    tone: 'warm' | 'calm' | 'energetic' | 'contemplative';
  };
  lastUpdated: Date;
}

/**
 * Safety validation result
 */
export interface ValidationResult {
  valid: boolean;
  violations: string[];
}

/**
 * 12-color skin tone palette with shader properties
 * Covers diverse spectrum from light to dark with various undertones
 */
export const SKIN_TONE_PALETTE: Record<string, SkinTone> = {
  pearl: {
    id: 'pearl',
    name: 'Pearl',
    hexValue: '#fdbcb4',
    undertone: 'cool',
    subsurfaceColor: '#ff99cc',
    description: 'Fair with cool undertone',
  },
  ivory: {
    id: 'ivory',
    name: 'Ivory',
    hexValue: '#f3d5a5',
    undertone: 'warm',
    subsurfaceColor: '#ffbb99',
    description: 'Fair with warm undertone',
  },
  honey: {
    id: 'honey',
    name: 'Honey',
    hexValue: '#e6b89c',
    undertone: 'warm',
    subsurfaceColor: '#ffaa88',
    description: 'Light with warm undertone',
  },
  amber: {
    id: 'amber',
    name: 'Amber',
    hexValue: '#d4a574',
    undertone: 'warm',
    subsurfaceColor: '#ff9966',
    description: 'Medium with warm undertone',
  },
  copper: {
    id: 'copper',
    name: 'Copper',
    hexValue: '#c68642',
    undertone: 'warm',
    subsurfaceColor: '#ff8844',
    description: 'Medium-deep with warm undertone',
  },
  sienna: {
    id: 'sienna',
    name: 'Sienna',
    hexValue: '#9d6f47',
    undertone: 'warm',
    subsurfaceColor: '#dd7722',
    description: 'Deep with warm undertone',
  },
  mahogany: {
    id: 'mahogany',
    name: 'Mahogany',
    hexValue: '#8b5a3c',
    undertone: 'warm',
    subsurfaceColor: '#cc6633',
    description: 'Deep with rich warm undertone',
  },
  teak: {
    id: 'teak',
    name: 'Teak',
    hexValue: '#6b4423',
    undertone: 'warm',
    subsurfaceColor: '#aa5522',
    description: 'Very deep with warm undertone',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian',
    hexValue: '#3d2817',
    undertone: 'neutral',
    subsurfaceColor: '#885533',
    description: 'Very dark with neutral undertone',
  },
  ebony: {
    id: 'ebony',
    name: 'Ebony',
    hexValue: '#2a1810',
    undertone: 'cool',
    subsurfaceColor: '#665544',
    description: 'Darkest with cool undertone',
  },
  sage: {
    id: 'sage',
    name: 'Sage',
    hexValue: '#c9a89a',
    undertone: 'neutral',
    subsurfaceColor: '#bb8899',
    description: 'Medium with neutral undertone',
  },
  bronze: {
    id: 'bronze',
    name: 'Bronze',
    hexValue: '#a0674e',
    undertone: 'warm',
    subsurfaceColor: '#994455',
    description: 'Medium-deep with bronze undertone',
  },
};

/**
 * Complete set of 24 avatar presets (4 per guide)
 * Each preset includes diverse skin tones, body types, hair styles, and ages
 */
export const AVATAR_PRESETS: AvatarPreset[] = [
  // ═══════════════════════════════════════════════════════════════
  // KORE PRIME — Founder Avatar (Default for ALL guides)
  // Trained via LoRA on founder's likeness. This is the primary avatar.
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'kore-prime',
    name: 'Kore Prime — The Founder',
    guideId: 'kore',
    description: 'The Living Codex founder herself. Photorealistic avatar trained on the creator\'s likeness — olive skin, green-hazel eyes, signature tattoo sleeve, gold accessories. Embodies the source energy of the entire Codex system.',
    imageUrl: '/assets/avatars/kore-prime/portrait-kore.png',
    thumbnailUrl: '/assets/avatars/kore-prime/portrait-kore-thumb.png',
    customization: {
      skinTone: '#D4A574',
      hairStyle: 'wavy',
      hairColor: '#C9A86C',
      bodyType: 'curvy',
      ageRange: 'adult_30s',
      eyeColor: '#6B8E5A',
      outfitStyle: 'flowing_robes',
      accessories: ['earrings', 'nose_ring', 'pendant', 'arm_cuffs'],
      faceGeometry: {
        jawWidth: 0.45,
        cheekHeight: 0.75,
        noseWidth: 0.42,
        lipFullness: 0.72,
        eyeSize: 0.60,
        browArch: 0.68,
        foreheadHeight: 0.50,
        chinShape: 0.40,
      },
    },
    diversityMetadata: {
      skinTone: 'Light Olive (Warm undertone)',
      bodyType: 'Athletic-Curvy',
      hairStyle: 'Long Wavy',
      hairTexture: 'wavy',
      ageRange: '30s',
    },
    outfitDescription: 'Flowing golden-cream sacred robes with intricate embroidery, gold circlet crown. Tattoo sleeve visible through sheer fabric on right arm. Signature gold feather earrings, small gold nose ring, layered gold necklaces.',
    sacredAccessories: [
      {
        type: 'earrings',
        color: '#D4AF37',
        symbolism: 'Gold feather/leaf drops — divine listening, receiving wisdom',
      },
      {
        type: 'nose_ring',
        color: '#D4AF37',
        symbolism: 'Small gold hoop — breath of life, sacred feminine',
      },
      {
        type: 'pendant',
        color: '#D4AF37',
        symbolism: 'Layered gold chains — interconnection of all phases',
      },
      {
        type: 'arm_cuffs',
        color: '#D4AF37',
        symbolism: 'Gold cuffs over tattoo sleeve — strength made beautiful',
      },
    ],
  },

  // KORE (Orientation) - Wise counselor energy
  {
    id: 'kore-amber',
    name: 'Kore Amber',
    guideId: 'kore',
    description: 'Warm, approachable guide with inviting presence',
    imageUrl: '/assets/avatars/presets/kore-amber.png',
    thumbnailUrl: '/assets/avatars/presets/kore-amber-thumb.png',
    customization: {
      skinTone: 'amber',
      hairStyle: 'loose_curls',
      hairColor: '#c68642',
      bodyType: 'athletic',
      ageRange: 'adult_30s',
      eyeColor: '#6b4423',
      outfitStyle: 'modern_elegant',
      accessories: ['pendant', 'earrings'],
    },
    diversityMetadata: {
      skinTone: 'Amber (Medium with warm undertone)',
      bodyType: 'Athletic',
      hairStyle: 'Loose Curls',
      hairTexture: 'curly',
      ageRange: '30s',
    },
    outfitDescription: 'Tailored linen dress with natural fibers, elegant draped shawl',
    sacredAccessories: [
      {
        type: 'pendant',
        color: '#d4a574',
        symbolism: 'Grounding anchor for orientation',
      },
      {
        type: 'earrings',
        color: '#c68642',
        symbolism: 'Active listening',
      },
    ],
  },
  {
    id: 'kore-obsidian',
    name: 'Kore Obsidian',
    guideId: 'kore',
    description: 'Powerful, grounded guide with deep wisdom',
    imageUrl: '/assets/avatars/presets/kore-obsidian.png',
    thumbnailUrl: '/assets/avatars/presets/kore-obsidian-thumb.png',
    customization: {
      skinTone: 'obsidian',
      hairStyle: 'natural_coils',
      hairColor: '#1a0f0a',
      bodyType: 'curvy',
      ageRange: 'mature_40s',
      eyeColor: '#8b5a3c',
      outfitStyle: 'sacred_warrior',
      accessories: ['crown', 'arm_cuffs'],
    },
    diversityMetadata: {
      skinTone: 'Obsidian (Very dark with neutral undertone)',
      bodyType: 'Curvy',
      hairStyle: 'Natural Coils',
      hairTexture: 'coily',
      ageRange: '40s',
    },
    outfitDescription: 'Structured wrap with geometric patterns, power stance accessories',
    sacredAccessories: [
      {
        type: 'crown',
        color: '#daa520',
        symbolism: 'Sovereignty and self-knowledge',
      },
      {
        type: 'arm_cuffs',
        color: '#8b5a3c',
        symbolism: 'Strength and boundaries',
      },
    ],
  },
  {
    id: 'kore-pearl',
    name: 'Kore Pearl',
    guideId: 'kore',
    description: 'Serene, clarifying guide with luminous presence',
    imageUrl: '/assets/avatars/presets/kore-pearl.png',
    thumbnailUrl: '/assets/avatars/presets/kore-pearl-thumb.png',
    customization: {
      skinTone: 'pearl',
      hairStyle: 'straight',
      hairColor: '#e8c4b8',
      bodyType: 'slim',
      ageRange: 'young_adult_20s',
      eyeColor: '#4a7c8c',
      outfitStyle: 'celestial',
      accessories: ['circlet', 'pendant'],
    },
    diversityMetadata: {
      skinTone: 'Pearl (Fair with cool undertone)',
      bodyType: 'Slim',
      hairStyle: 'Straight',
      hairTexture: 'straight',
      ageRange: '20s',
    },
    outfitDescription: 'Flowing ethereal gown in soft neutrals with shimmer',
    sacredAccessories: [
      {
        type: 'circlet',
        color: '#e8c4b8',
        symbolism: 'Mental clarity and focus',
      },
      {
        type: 'pendant',
        color: '#87ceeb',
        symbolism: 'Truth and communication',
      },
    ],
  },
  {
    id: 'kore-sage',
    name: 'Kore Sage',
    guideId: 'kore',
    description: 'Balanced, thoughtful guide with gentle authority',
    imageUrl: '/assets/avatars/presets/kore-sage.png',
    thumbnailUrl: '/assets/avatars/presets/kore-sage-thumb.png',
    customization: {
      skinTone: 'sage',
      hairStyle: 'wavy',
      hairColor: '#a0674e',
      bodyType: 'plus_size',
      ageRange: 'elder_50plus',
      eyeColor: '#6b8e23',
      outfitStyle: 'earth_mother',
      accessories: ['pendant', 'headwrap_accent'],
    },
    diversityMetadata: {
      skinTone: 'Sage (Medium with neutral undertone)',
      bodyType: 'Plus Size',
      hairStyle: 'Wavy',
      hairTexture: 'wavy',
      ageRange: '50+',
    },
    outfitDescription: 'Layered earth-toned textiles with natural patterns and texture',
    sacredAccessories: [
      {
        type: 'pendant',
        color: '#8fbc8f',
        symbolism: 'Growth and nurturing wisdom',
      },
      {
        type: 'headwrap_accent',
        color: '#d2b48c',
        symbolism: 'Integration of knowledge',
      },
    ],
  },

  // AOEDE — Founder Variant
  {
    id: 'aoede-prime',
    name: 'Aoede Prime — The Founder',
    guideId: 'aoede',
    description: 'The founder as Aoede — violet artistic dress, moonstone pendant, creative studio setting. Tattoo sleeve and signature features preserved.',
    imageUrl: '/assets/avatars/kore-prime/portrait-aoede.png',
    thumbnailUrl: '/assets/avatars/kore-prime/portrait-aoede-thumb.png',
    customization: {
      skinTone: '#D4A574',
      hairStyle: 'wavy',
      hairColor: '#3B2314',
      bodyType: 'curvy',
      ageRange: 'adult_30s',
      eyeColor: '#6B8E5A',
      outfitStyle: 'celestial',
      accessories: ['earrings', 'nose_ring', 'pendant'],
    },
    diversityMetadata: { skinTone: 'Light Olive', bodyType: 'Athletic-Curvy', hairStyle: 'Long Wavy', hairTexture: 'wavy', ageRange: '30s' },
    outfitDescription: 'Deep violet artistic draped dress with asymmetric neckline, silver moonstone pendant. Tattoo sleeve visible, gold nose ring, creative studio with mirrors.',
    sacredAccessories: [
      { type: 'pendant', color: '#9B59B6', symbolism: 'Moonstone — archetype reflection, inner knowing' },
      { type: 'earrings', color: '#D4AF37', symbolism: 'Gold feather drops — creative listening' },
    ],
  },

  // AOEDE (Archetype) - Creative artist energy
  {
    id: 'aoede-indigo',
    name: 'Aoede Indigo',
    guideId: 'aoede',
    description: 'Visionary guide with creative spark',
    imageUrl: '/assets/avatars/presets/aoede-indigo.png',
    thumbnailUrl: '/assets/avatars/presets/aoede-indigo-thumb.png',
    customization: {
      skinTone: 'obsidian',
      hairStyle: 'locs',
      hairColor: '#4b0082',
      bodyType: 'slim',
      ageRange: 'young_adult_20s',
      eyeColor: '#ffd700',
      outfitStyle: 'celestial',
      accessories: ['crown', 'earrings', 'nose_ring'],
    },
    diversityMetadata: {
      skinTone: 'Obsidian (Very dark)',
      bodyType: 'Slim',
      hairStyle: 'Locs',
      hairTexture: 'coily',
      ageRange: '20s',
    },
    outfitDescription: 'Flowing celestial robes with cosmic patterns and iridescent accents',
    sacredAccessories: [
      {
        type: 'crown',
        color: '#4b0082',
        symbolism: 'Imagination and creative power',
      },
      {
        type: 'earrings',
        color: '#ffd700',
        symbolism: 'Artistic expression',
      },
      {
        type: 'nose_ring',
        color: '#daa520',
        symbolism: 'Intuitive sight',
      },
    ],
  },
  {
    id: 'aoede-copper',
    name: 'Aoede Copper',
    guideId: 'aoede',
    description: 'Grounded creative with earthy presence',
    imageUrl: '/assets/avatars/presets/aoede-copper.png',
    thumbnailUrl: '/assets/avatars/presets/aoede-copper-thumb.png',
    customization: {
      skinTone: 'copper',
      hairStyle: 'braids',
      hairColor: '#d2691e',
      bodyType: 'athletic',
      ageRange: 'adult_30s',
      eyeColor: '#8b4513',
      outfitStyle: 'earth_mother',
      accessories: ['pendant', 'arm_cuffs'],
    },
    diversityMetadata: {
      skinTone: 'Copper (Medium-deep with warm undertone)',
      bodyType: 'Athletic',
      hairStyle: 'Braids',
      hairTexture: 'coily',
      ageRange: '30s',
    },
    outfitDescription: 'Artisan wrap with hand-woven patterns and clay tones',
    sacredAccessories: [
      {
        type: 'pendant',
        color: '#cd853f',
        symbolism: 'Artistic channel',
      },
      {
        type: 'arm_cuffs',
        color: '#8b4513',
        symbolism: 'Creative craftsmanship',
      },
    ],
  },
  {
    id: 'aoede-ivory',
    name: 'Aoede Ivory',
    guideId: 'aoede',
    description: 'Luminous artist with ethereal quality',
    imageUrl: '/assets/avatars/presets/aoede-ivory.png',
    thumbnailUrl: '/assets/avatars/presets/aoede-ivory-thumb.png',
    customization: {
      skinTone: 'ivory',
      hairStyle: 'long_flowing',
      hairColor: '#deb887',
      bodyType: 'curvy',
      ageRange: 'mature_40s',
      eyeColor: '#696969',
      outfitStyle: 'flowing_robes',
      accessories: ['circlet', 'pendant', 'earrings'],
    },
    diversityMetadata: {
      skinTone: 'Ivory (Fair with warm undertone)',
      bodyType: 'Curvy',
      hairStyle: 'Long Flowing',
      hairTexture: 'wavy',
      ageRange: '40s',
    },
    outfitDescription: 'Flowing silk robes in cream and gold with artistic draping',
    sacredAccessories: [
      {
        type: 'circlet',
        color: '#daa520',
        symbolism: 'Muse activation',
      },
      {
        type: 'pendant',
        color: '#f0e68c',
        symbolism: 'Creative expression',
      },
      {
        type: 'earrings',
        color: '#ffd700',
        symbolism: 'Listening to inspiration',
      },
    ],
  },
  {
    id: 'aoede-midnight',
    name: 'Aoede Midnight',
    guideId: 'aoede',
    description: 'Deep creative with transformative energy',
    imageUrl: '/assets/avatars/presets/aoede-midnight.png',
    thumbnailUrl: '/assets/avatars/presets/aoede-midnight-thumb.png',
    customization: {
      skinTone: 'ebony',
      hairStyle: 'afro',
      hairColor: '#0a0a0a',
      bodyType: 'plus_size',
      ageRange: 'elder_50plus',
      eyeColor: '#daa520',
      outfitStyle: 'sacred_warrior',
      accessories: ['crown', 'pendant', 'arm_cuffs'],
    },
    diversityMetadata: {
      skinTone: 'Ebony (Darkest with cool undertone)',
      bodyType: 'Plus Size',
      hairStyle: 'Afro',
      hairTexture: 'coily',
      ageRange: '50+',
    },
    outfitDescription: 'Powerful sacred robes with metallic gold accents',
    sacredAccessories: [
      {
        type: 'crown',
        color: '#ffd700',
        symbolism: 'Mastery of creative vision',
      },
      {
        type: 'pendant',
        color: '#ffd700',
        symbolism: 'Ancestral creative power',
      },
      {
        type: 'arm_cuffs',
        color: '#c0c0c0',
        symbolism: 'Creative strength',
      },
    ],
  },

  // LEDA — Founder Variant
  {
    id: 'leda-prime',
    name: 'Leda Prime — The Founder',
    guideId: 'leda',
    description: 'The founder as Leda — soft rose-blush blouse, layered gold necklaces, holding an ornate journal in a warm garden alcove. Tattoo sleeve and signature features preserved.',
    imageUrl: '/assets/avatars/kore-prime/portrait-leda.png',
    thumbnailUrl: '/assets/avatars/kore-prime/portrait-leda-thumb.png',
    customization: {
      skinTone: '#D4A574',
      hairStyle: 'wavy',
      hairColor: '#C9A86C',
      bodyType: 'curvy',
      ageRange: 'adult_30s',
      eyeColor: '#6B8E5A',
      outfitStyle: 'earth_mother',
      accessories: ['earrings', 'nose_ring', 'pendant'],
    },
    diversityMetadata: { skinTone: 'Light Olive', bodyType: 'Athletic-Curvy', hairStyle: 'Long Wavy', hairTexture: 'wavy', ageRange: '30s' },
    outfitDescription: 'Soft rose-blush flowing blouse with gathered neckline, delicate gold layered necklaces. Hair pulled softly to one side. Tattoo sleeve visible, gold feather earrings, holding ornate leather journal.',
    sacredAccessories: [
      { type: 'pendant', color: '#FFB6C1', symbolism: 'Rose quartz — compassionate self-reflection' },
      { type: 'earrings', color: '#D4AF37', symbolism: 'Gold feather drops — gentle listening' },
    ],
  },

  // LEDA (Journal) - Nurturing companion energy
  {
    id: 'leda-rose',
    name: 'Leda Rose',
    guideId: 'leda',
    description: 'Warm, compassionate journal companion',
    imageUrl: '/assets/avatars/presets/leda-rose.png',
    thumbnailUrl: '/assets/avatars/presets/leda-rose-thumb.png',
    customization: {
      skinTone: 'honey',
      hairStyle: 'wavy',
      hairColor: '#daa520',
      bodyType: 'curvy',
      ageRange: 'adult_30s',
      eyeColor: '#cd5c5c',
      outfitStyle: 'flowing_robes',
      accessories: ['pendant', 'earrings'],
    },
    diversityMetadata: {
      skinTone: 'Honey (Light with warm undertone)',
      bodyType: 'Curvy',
      hairStyle: 'Wavy',
      hairTexture: 'wavy',
      ageRange: '30s',
    },
    outfitDescription: 'Soft flowing robes in rose and cream with gentle embroidery',
    sacredAccessories: [
      {
        type: 'pendant',
        color: '#ff69b4',
        symbolism: 'Heart opening and vulnerability',
      },
      {
        type: 'earrings',
        color: '#ffc0cb',
        symbolism: 'Compassionate listening',
      },
    ],
  },
  {
    id: 'leda-mahogany',
    name: 'Leda Mahogany',
    guideId: 'leda',
    description: 'Grounded, nurturing presence with depth',
    imageUrl: '/assets/avatars/presets/leda-mahogany.png',
    thumbnailUrl: '/assets/avatars/presets/leda-mahogany-thumb.png',
    customization: {
      skinTone: 'mahogany',
      hairStyle: 'cornrows',
      hairColor: '#8b5a3c',
      bodyType: 'plus_size',
      ageRange: 'mature_40s',
      eyeColor: '#daa520',
      outfitStyle: 'earth_mother',
      accessories: ['headwrap_accent', 'pendant'],
    },
    diversityMetadata: {
      skinTone: 'Mahogany (Deep with warm undertone)',
      bodyType: 'Plus Size',
      hairStyle: 'Cornrows',
      hairTexture: 'coily',
      ageRange: '40s',
    },
    outfitDescription: 'Warm layered wraps with natural fibers and patterns',
    sacredAccessories: [
      {
        type: 'headwrap_accent',
        color: '#8b5a3c',
        symbolism: 'Integrated wisdom',
      },
      {
        type: 'pendant',
        color: '#d2691e',
        symbolism: 'Nurturing presence',
      },
    ],
  },
  {
    id: 'leda-honey',
    name: 'Leda Honey',
    guideId: 'leda',
    description: 'Sweet, encouraging journaling guide',
    imageUrl: '/assets/avatars/presets/leda-honey.png',
    thumbnailUrl: '/assets/avatars/presets/leda-honey-thumb.png',
    customization: {
      skinTone: 'honey',
      hairStyle: 'loose_curls',
      hairColor: '#cd853f',
      bodyType: 'athletic',
      ageRange: 'young_adult_20s',
      eyeColor: '#8b6914',
      outfitStyle: 'modern_elegant',
      accessories: ['circlet', 'earrings'],
    },
    diversityMetadata: {
      skinTone: 'Honey (Light with warm undertone)',
      bodyType: 'Athletic',
      hairStyle: 'Loose Curls',
      hairTexture: 'curly',
      ageRange: '20s',
    },
    outfitDescription: 'Elegant modern dress in warm tones with soft textures',
    sacredAccessories: [
      {
        type: 'circlet',
        color: '#daa520',
        symbolism: 'Clarity of purpose',
      },
      {
        type: 'earrings',
        color: '#f0e68c',
        symbolism: 'Attentive presence',
      },
    ],
  },
  {
    id: 'leda-willow',
    name: 'Leda Willow',
    guideId: 'leda',
    description: 'Gentle, flowing journal companion for reflection',
    imageUrl: '/assets/avatars/presets/leda-willow.png',
    thumbnailUrl: '/assets/avatars/presets/leda-willow-thumb.png',
    customization: {
      skinTone: 'sage',
      hairStyle: 'long_flowing',
      hairColor: '#9acd32',
      bodyType: 'slim',
      ageRange: 'elder_50plus',
      eyeColor: '#6b8e23',
      outfitStyle: 'flowing_robes',
      accessories: ['pendant', 'headwrap_accent'],
    },
    diversityMetadata: {
      skinTone: 'Sage (Medium with neutral undertone)',
      bodyType: 'Slim',
      hairStyle: 'Long Flowing',
      hairTexture: 'wavy',
      ageRange: '50+',
    },
    outfitDescription: 'Flowing robes in sage and cream with graceful movement',
    sacredAccessories: [
      {
        type: 'pendant',
        color: '#8fbc8f',
        symbolism: 'Growth through reflection',
      },
      {
        type: 'headwrap_accent',
        color: '#9acd32',
        symbolism: 'Integrated understanding',
      },
    ],
  },

  // THEIA — Founder Variant
  {
    id: 'theia-prime',
    name: 'Theia Prime — The Founder',
    guideId: 'theia',
    description: 'The founder as Theia — emerald green sacred warrior tunic with gold arm cuffs, standing in a misty forest clearing. Tattoo sleeve and signature features preserved.',
    imageUrl: '/assets/avatars/kore-prime/portrait-theia.png',
    thumbnailUrl: '/assets/avatars/kore-prime/portrait-theia-thumb.png',
    customization: {
      skinTone: '#D4A574',
      hairStyle: 'wavy',
      hairColor: '#3B2314',
      bodyType: 'curvy',
      ageRange: 'adult_30s',
      eyeColor: '#6B8E5A',
      outfitStyle: 'sacred_warrior',
      accessories: ['arm_cuffs', 'nose_ring', 'earrings'],
    },
    diversityMetadata: { skinTone: 'Light Olive', bodyType: 'Athletic-Curvy', hairStyle: 'Long Wavy', hairTexture: 'wavy', ageRange: '30s' },
    outfitDescription: 'Emerald green fitted sacred warrior tunic with gold arm cuffs and geometric shoulder detail. Hair in loose waves, full sleeve tattoo visible through open sleeves. Minimal gold jewelry, standing among ancient stones.',
    sacredAccessories: [
      { type: 'arm_cuffs', color: '#D4AF37', symbolism: 'Gold warrior cuffs — grounded protection' },
      { type: 'earrings', color: '#2ECC71', symbolism: 'Emerald — healing and renewal' },
    ],
  },

  // THEIA (NS Support) - Grounded healer energy
  {
    id: 'theia-jade',
    name: 'Theia Jade',
    guideId: 'theia',
    description: 'Peaceful healing presence with grounding energy',
    imageUrl: '/assets/avatars/presets/theia-jade.png',
    thumbnailUrl: '/assets/avatars/presets/theia-jade-thumb.png',
    customization: {
      skinTone: 'sienna',
      hairStyle: 'braids',
      hairColor: '#8b7355',
      bodyType: 'curvy',
      ageRange: 'mature_40s',
      eyeColor: '#228b22',
      outfitStyle: 'earth_mother',
      accessories: ['pendant', 'arm_cuffs'],
    },
    diversityMetadata: {
      skinTone: 'Sienna (Deep with warm undertone)',
      bodyType: 'Curvy',
      hairStyle: 'Braids',
      hairTexture: 'coily',
      ageRange: '40s',
    },
    outfitDescription: 'Healing robes in jade tones with grounding earth elements',
    sacredAccessories: [
      {
        type: 'pendant',
        color: '#228b22',
        symbolism: 'Healing and restoration',
      },
      {
        type: 'arm_cuffs',
        color: '#8fbc8f',
        symbolism: 'Grounding support',
      },
    ],
  },
  {
    id: 'theia-garnet',
    name: 'Theia Garnet',
    guideId: 'theia',
    description: 'Powerful healer with rooted presence',
    imageUrl: '/assets/avatars/presets/theia-garnet.png',
    thumbnailUrl: '/assets/avatars/presets/theia-garnet-thumb.png',
    customization: {
      skinTone: 'obsidian',
      hairStyle: 'natural_coils',
      hairColor: '#1a0f0a',
      bodyType: 'athletic',
      ageRange: 'adult_30s',
      eyeColor: '#a52a2a',
      outfitStyle: 'sacred_warrior',
      accessories: ['crown', 'pendant'],
    },
    diversityMetadata: {
      skinTone: 'Obsidian (Very dark)',
      bodyType: 'Athletic',
      hairStyle: 'Natural Coils',
      hairTexture: 'coily',
      ageRange: '30s',
    },
    outfitDescription: 'Sacred healing garments in deep reds and golds',
    sacredAccessories: [
      {
        type: 'crown',
        color: '#a52a2a',
        symbolism: 'Healing authority',
      },
      {
        type: 'pendant',
        color: '#b22222',
        symbolism: 'Life force and vitality',
      },
    ],
  },
  {
    id: 'theia-silver',
    name: 'Theia Silver',
    guideId: 'theia',
    description: 'Cool, calming healer with intuitive wisdom',
    imageUrl: '/assets/avatars/presets/theia-silver.png',
    thumbnailUrl: '/assets/avatars/presets/theia-silver-thumb.png',
    customization: {
      skinTone: 'pearl',
      hairStyle: 'straight',
      hairColor: '#c0c0c0',
      bodyType: 'slim',
      ageRange: 'young_adult_20s',
      eyeColor: '#4682b4',
      outfitStyle: 'celestial',
      accessories: ['circlet', 'pendant', 'earrings'],
    },
    diversityMetadata: {
      skinTone: 'Pearl (Fair with cool undertone)',
      bodyType: 'Slim',
      hairStyle: 'Straight',
      hairTexture: 'straight',
      ageRange: '20s',
    },
    outfitDescription: 'Cool-toned healing robes with silver and blue accents',
    sacredAccessories: [
      {
        type: 'circlet',
        color: '#c0c0c0',
        symbolism: 'Clarity and intuition',
      },
      {
        type: 'pendant',
        color: '#87ceeb',
        symbolism: 'Soothing and calm',
      },
      {
        type: 'earrings',
        color: '#b0c4de',
        symbolism: 'Deep listening',
      },
    ],
  },
  {
    id: 'theia-bronze',
    name: 'Theia Bronze',
    guideId: 'theia',
    description: 'Warm, steady healer with deep experience',
    imageUrl: '/assets/avatars/presets/theia-bronze.png',
    thumbnailUrl: '/assets/avatars/presets/theia-bronze-thumb.png',
    customization: {
      skinTone: 'bronze',
      hairStyle: 'locs',
      hairColor: '#704214',
      bodyType: 'plus_size',
      ageRange: 'elder_50plus',
      eyeColor: '#8b7355',
      outfitStyle: 'earth_mother',
      accessories: ['headwrap_accent', 'pendant', 'arm_cuffs'],
    },
    diversityMetadata: {
      skinTone: 'Bronze (Medium-deep with bronze undertone)',
      bodyType: 'Plus Size',
      hairStyle: 'Locs',
      hairTexture: 'coily',
      ageRange: '50+',
    },
    outfitDescription: 'Grounding robes in bronze tones with natural textures',
    sacredAccessories: [
      {
        type: 'headwrap_accent',
        color: '#8b7355',
        symbolism: 'Ancient healing wisdom',
      },
      {
        type: 'pendant',
        color: '#cd853f',
        symbolism: 'Earth connection',
      },
      {
        type: 'arm_cuffs',
        color: '#8b6914',
        symbolism: 'Grounding strength',
      },
    ],
  },

  // SELENE — Founder Variant
  {
    id: 'selene-prime',
    name: 'Selene Prime — The Founder',
    guideId: 'selene',
    description: 'The founder as Selene — elegant sapphire blue blazer-dress with pearl brooch, dark hair in a sophisticated low bun, in a grand library. Tattoo sleeve partially visible, reading glasses on head.',
    imageUrl: '/assets/avatars/kore-prime/portrait-selene.png',
    thumbnailUrl: '/assets/avatars/kore-prime/portrait-selene-thumb.png',
    customization: {
      skinTone: '#D4A574',
      hairStyle: 'long_flowing',
      hairColor: '#3B2314',
      bodyType: 'curvy',
      ageRange: 'adult_30s',
      eyeColor: '#6B8E5A',
      outfitStyle: 'professional',
      accessories: ['earrings', 'nose_ring', 'pendant'],
    },
    diversityMetadata: { skinTone: 'Light Olive', bodyType: 'Athletic-Curvy', hairStyle: 'Low Bun', hairTexture: 'wavy', ageRange: '30s' },
    outfitDescription: 'Elegant sapphire blue fitted blazer-dress with pearl brooch and structured shoulders. Dark hair pulled back in sophisticated low bun. Sleeve tattoo partially visible at wrist cuff, reading glasses pushed up on head, gold earrings.',
    sacredAccessories: [
      { type: 'pendant', color: '#2471A3', symbolism: 'Sapphire pearl — accumulated wisdom' },
      { type: 'earrings', color: '#D4AF37', symbolism: 'Gold drops — scholarly illumination' },
    ],
  },

  // SELENE (Librarian) - Scholarly wisdom energy
  {
    id: 'selene-sapphire',
    name: 'Selene Sapphire',
    guideId: 'selene',
    description: 'Brilliant knowledge keeper with scholarly grace',
    imageUrl: '/assets/avatars/presets/selene-sapphire.png',
    thumbnailUrl: '/assets/avatars/presets/selene-sapphire-thumb.png',
    customization: {
      skinTone: 'obsidian',
      hairStyle: 'long_flowing',
      hairColor: '#0a0a0a',
      bodyType: 'slim',
      ageRange: 'young_adult_20s',
      eyeColor: '#0000cd',
      outfitStyle: 'professional',
      accessories: ['circlet', 'pendant', 'earrings'],
    },
    diversityMetadata: {
      skinTone: 'Obsidian (Very dark)',
      bodyType: 'Slim',
      hairStyle: 'Long Flowing',
      hairTexture: 'straight',
      ageRange: '20s',
    },
    outfitDescription: 'Professional scholarly robes in sapphire with gold trimming',
    sacredAccessories: [
      {
        type: 'circlet',
        color: '#0000cd',
        symbolism: 'Knowledge and wisdom',
      },
      {
        type: 'pendant',
        color: '#daa520',
        symbolism: 'Illuminated truth',
      },
      {
        type: 'earrings',
        color: '#4169e1',
        symbolism: 'Receptive learning',
      },
    ],
  },
  {
    id: 'selene-ebony',
    name: 'Selene Ebony',
    guideId: 'selene',
    description: 'Deep knowledge guardian with ancestral roots',
    imageUrl: '/assets/avatars/presets/selene-ebony.png',
    thumbnailUrl: '/assets/avatars/presets/selene-ebony-thumb.png',
    customization: {
      skinTone: 'ebony',
      hairStyle: 'natural_coils',
      hairColor: '#0a0a0a',
      bodyType: 'athletic',
      ageRange: 'mature_40s',
      eyeColor: '#ffd700',
      outfitStyle: 'sacred_warrior',
      accessories: ['crown', 'pendant', 'arm_cuffs'],
    },
    diversityMetadata: {
      skinTone: 'Ebony (Darkest)',
      bodyType: 'Athletic',
      hairStyle: 'Natural Coils',
      hairTexture: 'coily',
      ageRange: '40s',
    },
    outfitDescription: 'Powerful scholarly robes in black and gold with archival patterns',
    sacredAccessories: [
      {
        type: 'crown',
        color: '#ffd700',
        symbolism: 'Authority of knowledge',
      },
      {
        type: 'pendant',
        color: '#daa520',
        symbolism: 'Ancestral wisdom',
      },
      {
        type: 'arm_cuffs',
        color: '#c0c0c0',
        symbolism: 'Strength in scholarship',
      },
    ],
  },
  {
    id: 'selene-opal',
    name: 'Selene Opal',
    guideId: 'selene',
    description: 'Luminous librarian with multifaceted insight',
    imageUrl: '/assets/avatars/presets/selene-opal.png',
    thumbnailUrl: '/assets/avatars/presets/selene-opal-thumb.png',
    customization: {
      skinTone: 'ivory',
      hairStyle: 'wavy',
      hairColor: '#deb887',
      bodyType: 'curvy',
      ageRange: 'adult_30s',
      eyeColor: '#4682b4',
      outfitStyle: 'modern_elegant',
      accessories: ['circlet', 'pendant', 'earrings'],
    },
    diversityMetadata: {
      skinTone: 'Ivory (Fair with warm undertone)',
      bodyType: 'Curvy',
      hairStyle: 'Wavy',
      hairTexture: 'wavy',
      ageRange: '30s',
    },
    outfitDescription: 'Elegant scholarly dress in cream and iridescent tones with literary motifs',
    sacredAccessories: [
      {
        type: 'circlet',
        color: '#e6e6fa',
        symbolism: 'Multifaceted wisdom',
      },
      {
        type: 'pendant',
        color: '#4682b4',
        symbolism: 'Deep knowledge',
      },
      {
        type: 'earrings',
        color: '#daa520',
        symbolism: 'Hearing the stories',
      },
    ],
  },
  {
    id: 'selene-teak',
    name: 'Selene Teak',
    guideId: 'selene',
    description: 'Seasoned wisdom keeper with enduring knowledge',
    imageUrl: '/assets/avatars/presets/selene-teak.png',
    thumbnailUrl: '/assets/avatars/presets/selene-teak-thumb.png',
    customization: {
      skinTone: 'teak',
      hairStyle: 'cornrows',
      hairColor: '#3d2817',
      bodyType: 'plus_size',
      ageRange: 'elder_50plus',
      eyeColor: '#8b6914',
      outfitStyle: 'earth_mother',
      accessories: ['headwrap_accent', 'pendant', 'arm_cuffs'],
    },
    diversityMetadata: {
      skinTone: 'Teak (Very deep with warm undertone)',
      bodyType: 'Plus Size',
      hairStyle: 'Cornrows',
      hairTexture: 'coily',
      ageRange: '50+',
    },
    outfitDescription: 'Richly textured scholarly robes in deep wood tones with heritage patterns',
    sacredAccessories: [
      {
        type: 'headwrap_accent',
        color: '#8b6914',
        symbolism: 'Integrated archives of wisdom',
      },
      {
        type: 'pendant',
        color: '#cd853f',
        symbolism: 'Preservation and legacy',
      },
      {
        type: 'arm_cuffs',
        color: '#8b4513',
        symbolism: 'Strength of heritage',
      },
    ],
  },

  // ZEPHYR — Founder Variant
  {
    id: 'zephyr-prime',
    name: 'Zephyr Prime — The Founder',
    guideId: 'zephyr',
    description: 'The founder as Zephyr — warm coral-orange wrap top with flowing pants, layered bracelets, on a sunset terrace with warm city skyline. Both arm tattoos clearly visible.',
    imageUrl: '/assets/avatars/kore-prime/portrait-zephyr.png',
    thumbnailUrl: '/assets/avatars/kore-prime/portrait-zephyr-thumb.png',
    customization: {
      skinTone: '#D4A574',
      hairStyle: 'wavy',
      hairColor: '#C9A86C',
      bodyType: 'curvy',
      ageRange: 'adult_30s',
      eyeColor: '#6B8E5A',
      outfitStyle: 'modern_elegant',
      accessories: ['earrings', 'nose_ring', 'arm_cuffs'],
    },
    diversityMetadata: { skinTone: 'Light Olive', bodyType: 'Athletic-Curvy', hairStyle: 'Long Wavy', hairTexture: 'wavy', ageRange: '30s' },
    outfitDescription: 'Warm coral-orange modern wrap top with flowing wide-leg pants, layered bracelets. Long dark wavy hair with natural movement, both arm tattoos clearly visible. Gold nose ring, gold feather earrings, welcoming open posture on sunset terrace.',
    sacredAccessories: [
      { type: 'arm_cuffs', color: '#FF6B35', symbolism: 'Coral bracelets — bonds of community' },
      { type: 'earrings', color: '#D4AF37', symbolism: 'Gold feather drops — joyful connection' },
    ],
  },

  // ZEPHYR (Community) - Warm connector energy
  {
    id: 'zephyr-coral',
    name: 'Zephyr Coral',
    guideId: 'zephyr',
    description: 'Vibrant, welcoming community connector',
    imageUrl: '/assets/avatars/presets/zephyr-coral.png',
    thumbnailUrl: '/assets/avatars/presets/zephyr-coral-thumb.png',
    customization: {
      skinTone: 'copper',
      hairStyle: 'loose_curls',
      hairColor: '#d2691e',
      bodyType: 'curvy',
      ageRange: 'young_adult_20s',
      eyeColor: '#ff6347',
      outfitStyle: 'flowing_robes',
      accessories: ['pendant', 'earrings', 'nose_ring'],
    },
    diversityMetadata: {
      skinTone: 'Copper (Medium-deep with warm undertone)',
      bodyType: 'Curvy',
      hairStyle: 'Loose Curls',
      hairTexture: 'curly',
      ageRange: '20s',
    },
    outfitDescription: 'Warm flowing robes in coral and gold with communal motifs',
    sacredAccessories: [
      {
        type: 'pendant',
        color: '#ff6347',
        symbolism: 'Connection and warmth',
      },
      {
        type: 'earrings',
        color: '#ff8c00',
        symbolism: 'Joyful communication',
      },
      {
        type: 'nose_ring',
        color: '#daa520',
        symbolism: 'Authentic expression',
      },
    ],
  },
  {
    id: 'zephyr-umber',
    name: 'Zephyr Umber',
    guideId: 'zephyr',
    description: 'Grounded, steady community presence',
    imageUrl: '/assets/avatars/presets/zephyr-umber.png',
    thumbnailUrl: '/assets/avatars/presets/zephyr-umber-thumb.png',
    customization: {
      skinTone: 'mahogany',
      hairStyle: 'braids',
      hairColor: '#6b4423',
      bodyType: 'plus_size',
      ageRange: 'mature_40s',
      eyeColor: '#8b4513',
      outfitStyle: 'earth_mother',
      accessories: ['headwrap_accent', 'pendant', 'arm_cuffs'],
    },
    diversityMetadata: {
      skinTone: 'Mahogany (Deep with warm undertone)',
      bodyType: 'Plus Size',
      hairStyle: 'Braids',
      hairTexture: 'coily',
      ageRange: '40s',
    },
    outfitDescription: 'Grounding community robes in umber and earth tones with inclusive patterns',
    sacredAccessories: [
      {
        type: 'headwrap_accent',
        color: '#8b4513',
        symbolism: 'Unified circles',
      },
      {
        type: 'pendant',
        color: '#a0522d',
        symbolism: 'Heart of the circle',
      },
      {
        type: 'arm_cuffs',
        color: '#8b5a3c',
        symbolism: 'Supportive strength',
      },
    ],
  },
  {
    id: 'zephyr-cream',
    name: 'Zephyr Cream',
    guideId: 'zephyr',
    description: 'Gentle, inclusive community guide',
    imageUrl: '/assets/avatars/presets/zephyr-cream.png',
    thumbnailUrl: '/assets/avatars/presets/zephyr-cream-thumb.png',
    customization: {
      skinTone: 'honey',
      hairStyle: 'long_flowing',
      hairColor: '#daa520',
      bodyType: 'slim',
      ageRange: 'adult_30s',
      eyeColor: '#8b6914',
      outfitStyle: 'modern_elegant',
      accessories: ['circlet', 'pendant'],
    },
    diversityMetadata: {
      skinTone: 'Honey (Light with warm undertone)',
      bodyType: 'Slim',
      hairStyle: 'Long Flowing',
      hairTexture: 'wavy',
      ageRange: '30s',
    },
    outfitDescription: 'Elegant welcoming dress in cream with community symbols',
    sacredAccessories: [
      {
        type: 'circlet',
        color: '#f0e68c',
        symbolism: 'Open invitation',
      },
      {
        type: 'pendant',
        color: '#daa520',
        symbolism: 'Shared light',
      },
    ],
  },
  {
    id: 'zephyr-sienna',
    name: 'Zephyr Sienna',
    guideId: 'zephyr',
    description: 'Wise, elder community connector with deep roots',
    imageUrl: '/assets/avatars/presets/zephyr-sienna.png',
    thumbnailUrl: '/assets/avatars/presets/zephyr-sienna-thumb.png',
    customization: {
      skinTone: 'sienna',
      hairStyle: 'afro',
      hairColor: '#6b4423',
      bodyType: 'athletic',
      ageRange: 'elder_50plus',
      eyeColor: '#daa520',
      outfitStyle: 'sacred_warrior',
      accessories: ['crown', 'pendant', 'arm_cuffs'],
    },
    diversityMetadata: {
      skinTone: 'Sienna (Deep with warm undertone)',
      bodyType: 'Athletic',
      hairStyle: 'Afro',
      hairTexture: 'coily',
      ageRange: '50+',
    },
    outfitDescription: 'Powerful community robes in sienna with inclusive and protective symbols',
    sacredAccessories: [
      {
        type: 'crown',
        color: '#daa520',
        symbolism: 'Community leadership',
      },
      {
        type: 'pendant',
        color: '#ff8c00',
        symbolism: 'Warmth and inclusion',
      },
      {
        type: 'arm_cuffs',
        color: '#d2691e',
        symbolism: 'Protective embrace',
      },
    ],
  },
];

/**
 * Mapping of emotions to facial expression parameters
 * Allows dynamic expressions synchronized with dialogue and interactions
 */
export const EXPRESSION_CONFIGS: Record<string, ExpressionConfig> = {
  neutral: {
    emotion: 'neutral',
    browOffset: 0,
    eyeSquint: 0,
    eyeWideness: 0,
    mouthCurve: 0,
    cheekRaise: 0,
    noseWrinkle: 0,
    jawSlack: 0,
    lipTension: 0,
  },
  joy: {
    emotion: 'joy',
    browOffset: 0.3,
    eyeSquint: 0.4,
    eyeWideness: 0.2,
    mouthCurve: 0.8,
    cheekRaise: 0.6,
    noseWrinkle: 0.2,
    jawSlack: 0.1,
    lipTension: 0.3,
  },
  concern: {
    emotion: 'concern',
    browOffset: -0.4,
    eyeSquint: 0.2,
    eyeWideness: 0.1,
    mouthCurve: -0.3,
    cheekRaise: 0,
    noseWrinkle: 0.3,
    jawSlack: -0.1,
    lipTension: 0.4,
  },
  curiosity: {
    emotion: 'curiosity',
    browOffset: 0.5,
    eyeSquint: 0,
    eyeWideness: 0.4,
    mouthCurve: 0.2,
    cheekRaise: 0.2,
    noseWrinkle: -0.1,
    jawSlack: 0.05,
    lipTension: -0.2,
  },
  calm: {
    emotion: 'calm',
    browOffset: 0.1,
    eyeSquint: -0.2,
    eyeWideness: -0.15,
    mouthCurve: 0.1,
    cheekRaise: 0.1,
    noseWrinkle: -0.2,
    jawSlack: 0.15,
    lipTension: -0.3,
  },
  listening: {
    emotion: 'listening',
    browOffset: 0.15,
    eyeSquint: 0,
    eyeWideness: 0.2,
    mouthCurve: 0,
    cheekRaise: 0.05,
    noseWrinkle: 0,
    jawSlack: 0.1,
    lipTension: -0.1,
  },
  empathy: {
    emotion: 'empathy',
    browOffset: -0.2,
    eyeSquint: 0.1,
    eyeWideness: 0.15,
    mouthCurve: 0.2,
    cheekRaise: 0.3,
    noseWrinkle: 0.1,
    jawSlack: 0.05,
    lipTension: -0.2,
  },
  celebration: {
    emotion: 'celebration',
    browOffset: 0.4,
    eyeSquint: 0.5,
    eyeWideness: 0.3,
    mouthCurve: 1,
    cheekRaise: 0.7,
    noseWrinkle: 0.3,
    jawSlack: 0.2,
    lipTension: 0.5,
  },
};

/**
 * Mapping of 15 visemes (phoneme mouth shapes) to mouth deformation parameters
 * For lip-sync animation during speech
 */
export const VISEME_MAP: Record<string, VisemeConfig> = {
  sil: { viseme: 'sil', jawOpen: 0, lipWidth: 0.5, lipRound: 0, tongueUp: 0 },
  PP: { viseme: 'PP', jawOpen: 0.1, lipWidth: 0, lipRound: 1, tongueUp: 0 },
  FF: { viseme: 'FF', jawOpen: 0.15, lipWidth: 0.3, lipRound: 0.8, tongueUp: 0 },
  TH: { viseme: 'TH', jawOpen: 0.2, lipWidth: 0.5, lipRound: 0, tongueUp: 0.8 },
  DD: { viseme: 'DD', jawOpen: 0.3, lipWidth: 0.4, lipRound: 0, tongueUp: 0.9 },
  kk: { viseme: 'kk', jawOpen: 0.25, lipWidth: 0.6, lipRound: 0, tongueUp: 0.7 },
  CH: { viseme: 'CH', jawOpen: 0.2, lipWidth: 0.3, lipRound: 0.6, tongueUp: 0.5 },
  SS: { viseme: 'SS', jawOpen: 0.15, lipWidth: 0.5, lipRound: 0.2, tongueUp: 0.3 },
  nn: { viseme: 'nn', jawOpen: 0.2, lipWidth: 0.5, lipRound: 0, tongueUp: 0.8 },
  RR: { viseme: 'RR', jawOpen: 0.25, lipWidth: 0.4, lipRound: 0.8, tongueUp: 0.5 },
  aa: { viseme: 'aa', jawOpen: 0.6, lipWidth: 0.8, lipRound: 0.2, tongueUp: 0 },
  E: { viseme: 'E', jawOpen: 0.4, lipWidth: 0.8, lipRound: 0, tongueUp: 0.2 },
  ih: { viseme: 'ih', jawOpen: 0.3, lipWidth: 0.6, lipRound: 0, tongueUp: 0.4 },
  oh: { viseme: 'oh', jawOpen: 0.5, lipWidth: 0.6, lipRound: 1, tongueUp: 0.2 },
  ou: { viseme: 'ou', jawOpen: 0.4, lipWidth: 0.4, lipRound: 1, tongueUp: 0.1 },
};

/**
 * Safety validator for avatar customization
 * Ensures all modifications stay within appropriate bounds for a women's empowerment platform
 */
export class SafetyValidator {
  static validateAvatarCustomization(custom: AvatarCustomization): ValidationResult {
    const violations: string[] = [];
    const validAges = ['young_adult_20s', 'adult_30s', 'mature_40s', 'elder_50plus'];
    if (!validAges.includes(custom.ageRange)) {
      violations.push('Age range must be a valid adult age category');
    }
    const validOutfits = ['flowing_robes', 'modern_elegant', 'sacred_warrior', 'earth_mother', 'celestial', 'professional'];
    if (!validOutfits.includes(custom.outfitStyle)) {
      violations.push('Outfit style must be one of the approved styles');
    }
    const validBodyTypes = ['slim', 'athletic', 'curvy', 'plus_size'];
    if (!validBodyTypes.includes(custom.bodyType)) {
      violations.push('Body type must be one of the approved types');
    }
    const validHairs = ['natural_coils', 'tight_curls', 'loose_curls', 'locs', 'braids', 'cornrows', 'afro', 'straight', 'wavy', 'pixie', 'long_flowing', 'shaved', 'headwrap'];
    if (!validHairs.includes(custom.hairStyle)) {
      violations.push('Hair style must be one of the approved styles');
    }
    const validAccessories = ['crown', 'circlet', 'pendant', 'arm_cuffs', 'earrings', 'nose_ring', 'headwrap_accent'];
    if (custom.accessories) {
      for (const accessory of custom.accessories) {
        if (!validAccessories.includes(accessory)) {
          violations.push(`Accessory '${accessory}' is not approved`);
        }
      }
    }
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexRegex.test(custom.skinTone) && !SKIN_TONE_PALETTE[custom.skinTone]) {
      violations.push('Skin tone must be a valid hex color or preset skin tone ID');
    }
    if (!hexRegex.test(custom.hairColor)) {
      violations.push('Hair color must be a valid hex color');
    }
    if (!hexRegex.test(custom.eyeColor)) {
      violations.push('Eye color must be a valid hex color');
    }
    if (custom.faceGeometry) {
      this.validateFaceGeometry(custom.faceGeometry, violations);
    }
    return { valid: violations.length === 0, violations };
  }

  private static validateFaceGeometry(geometry: FaceGeometry, violations: string[]): void {
    const boundsMap: Record<keyof FaceGeometry, [number, number]> = {
      jawWidth: [0.5, 1.5],
      cheekHeight: [0.6, 1.4],
      noseWidth: [0.5, 1.3],
      lipFullness: [0.4, 1.6],
      eyeSize: [0.8, 1.3],
      browArch: [0.3, 1.2],
      foreheadHeight: [0.7, 1.4],
      chinShape: [0, 1],
    };
    for (const [key, [min, max]] of Object.entries(boundsMap)) {
      const value = geometry[key as keyof FaceGeometry];
      if (value < min || value > max) {
        violations.push(`Face geometry '${key}' must be between ${min} and ${max}`);
      }
    }
  }
}

export function getPresetsForGuide(guideId: string): AvatarPreset[] {
  return AVATAR_PRESETS.filter((preset) => preset.guideId === guideId);
}

export function getDefaultPreset(guideId: string): AvatarPreset | undefined {
  return AVATAR_PRESETS.find((preset) => preset.guideId === guideId);
}

export function buildAvatarPrompt(appearance: AvatarPreset | AvatarCustomization, guideName: string): string {
  const custom = 'customization' in appearance ? appearance.customization : appearance;
  let skinToneDesc = '';
  if (custom.skinTone in SKIN_TONE_PALETTE) {
    const tone = SKIN_TONE_PALETTE[custom.skinTone];
    skinToneDesc = `${tone.name} skin with ${tone.undertone} undertone`;
  } else {
    skinToneDesc = `skin tone ${custom.skinTone}`;
  }
  const hairDescMap: Record<string, string> = {
    natural_coils: 'natural coils, textured, beautiful natural hair in coiled patterns',
    tight_curls: 'tight curls, springy textured natural hair',
    loose_curls: 'loose curls, soft natural waves',
    locs: 'beautiful locs, well-maintained dreads',
    braids: 'intricate braids, protective style',
    cornrows: 'cornrows, geometric braided style',
    afro: 'full, voluminous afro, majestic natural hair',
    straight: 'straight, sleek, well-groomed hair',
    wavy: 'wavy, flowing hair with natural waves',
    pixie: 'short pixie cut, chic and modern',
    long_flowing: 'long, flowing hair, cascading down',
    shaved: 'shaved head, clean and confident',
    headwrap: 'elegant headwrap with cultural patterns',
  };
  const hairDesc = hairDescMap[custom.hairStyle] || 'styled hair';
  const bodyTypeDesc: Record<string, string> = {
    slim: 'slim, lean build',
    athletic: 'athletic, toned build',
    curvy: 'curvy, full-figured with beautiful proportions',
    plus_size: 'plus-size, abundant beauty, fuller figure',
  };
  const ageDesc: Record<string, string> = {
    young_adult_20s: 'young adult in her 20s',
    adult_30s: 'adult woman in her 30s',
    mature_40s: 'mature woman in her 40s',
    elder_50plus: 'elder woman in her 50s or beyond, gracefully aged',
  };
  const outfitDesc: Record<string, string> = {
    flowing_robes: 'flowing robes in natural fabrics, graceful movement',
    modern_elegant: 'elegant modern dress, contemporary style, well-tailored',
    sacred_warrior: 'sacred warrior garments, powerful stance, regal bearing',
    earth_mother: 'earth-toned layered clothing, grounded presence',
    celestial: 'celestial-inspired flowing garments, ethereal quality',
    professional: 'professional attire, well-dressed, corporate or scholarly setting',
  };
  const basePrompt = `Professional portrait of a ${ageDesc[custom.ageRange]}, ${bodyTypeDesc[custom.bodyType]}, with ${skinToneDesc}. Hair: ${hairDesc}. Eye color: bright and expressive eyes. Clothing: ${outfitDesc[custom.outfitStyle]}. Setting: neutral professional background. Style: photorealistic, dignified, warm and welcoming expression. Guide context: ${guideName}. Quality: professional headshot, high quality, studio lighting, no makeup overdone, natural beauty. Expression: calm, wise, compassionate, approachable`;
  const negativePrompt = 'NEVER: nudity, sexual content, provocative poses, revealing clothing, excessive makeup. NO: violence, weapons, darkness, scary expressions, distorted features. NO: child-like features, underage appearance, overly thin/emaciated, unhealthy proportions. NO: cultural appropriation, stereotypes, demeaning representations. NO: backgrounds, accessories that sexualize or demean. ENSURE: fully clothed, professional, dignified, age-appropriate, healing-centered';
  return `MAIN PROMPT:\n${basePrompt}\n\nNEGATIVE PROMPT (SAFETY GUARDRAILS):\n${negativePrompt}`;
}

export function createAvatarInstance(guideId: string, presetId?: string, customization?: Partial<AvatarCustomization>): AvatarInstance {
  let baseCustom: AvatarCustomization | undefined;
  if (presetId) {
    const preset = AVATAR_PRESETS.find((p) => p.id === presetId);
    if (preset) baseCustom = preset.customization;
  }
  if (!baseCustom) {
    const defaultPreset = getDefaultPreset(guideId);
    baseCustom = defaultPreset?.customization || {
      skinTone: 'honey',
      hairStyle: 'loose_curls',
      hairColor: '#daa520',
      bodyType: 'curvy',
      ageRange: 'adult_30s',
      eyeColor: '#8b6914',
      outfitStyle: 'flowing_robes',
      accessories: ['pendant'],
    };
  }
  const finalCustomization: AvatarCustomization = { ...baseCustom, ...customization };
  const validation = SafetyValidator.validateAvatarCustomization(finalCustomization);
  if (!validation.valid) {
    console.warn('Avatar customization has violations:', validation.violations);
  }
  return {
    id: `avatar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    guideId,
    customization: finalCustomization,
    currentExpression: 'neutral',
    lastUpdated: new Date(),
  };
}

export function getAllGuideIds(): string[] {
  return ['kore', 'aoede', 'leda', 'theia', 'selene', 'zephyr'];
}

export const GUIDE_METADATA = {
  kore: { name: 'Kore', title: 'Orientation Guide', energy: 'Wise counselor', description: 'Your guide for understanding yourself and your journey' },
  aoede: { name: 'Aoede', title: 'Archetype Reflection', energy: 'Creative artist', description: 'Your guide for exploring patterns and stories' },
  leda: { name: 'Leda', title: 'Journal Companion', energy: 'Nurturing companion', description: 'Your guide for documenting your inner world' },
  theia: { name: 'Theia', title: 'NS Support', energy: 'Grounded healer', description: 'Your guide for nervous system healing' },
  selene: { name: 'Selene', title: 'Resource Librarian', energy: 'Scholarly wisdom', description: 'Your guide to knowledge and resources' },
  zephyr: { name: 'Zephyr', title: 'Community Concierge', energy: 'Warm connector', description: 'Your guide to connection and community' },
};
