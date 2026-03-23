/**
 * Guide Character definitions — the 6 avatar identities.
 * Each character has a visual identity (idle video, portrait, colors)
 * and a default Kokoro voice. Users pick a character, which sets both.
 */

export interface GuideCharacter {
  id: string;
  name: string;
  title: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  emissiveColor: string;
  particleColor: string;
  defaultVoiceId: string;
  voiceLabel: string;
  idleVideoUrl: string;
  portraitUrl: string;
}

const ATLAS_S3_BASE = 'https://justxempower-assets.s3.amazonaws.com/avatars/atlas';
const PORTRAIT_S3_BASE = 'https://justxempower-assets.s3.amazonaws.com/avatars/portraits';

export const GUIDE_CHARACTERS: GuideCharacter[] = [
  {
    id: 'kore',
    name: 'Kore',
    title: 'The Orientation Guide',
    description: 'Gentle wisdom and golden warmth. She helps you understand where you are and where to begin.',
    primaryColor: '#C9A96E',
    secondaryColor: '#2D1B35',
    emissiveColor: '#C9A96E',
    particleColor: '#FFD700',
    defaultVoiceId: 'af_kore',
    voiceLabel: 'Kore (Gentle)',
    idleVideoUrl: `${ATLAS_S3_BASE}/kore/idle-video.mp4`,
    portraitUrl: `${PORTRAIT_S3_BASE}/portrait-kore.jpg`,
  },
  {
    id: 'aoede',
    name: 'Aoede',
    title: 'The Archetype Mirror',
    description: 'Creative depth and violet intuition. She reflects your patterns back with poetic clarity.',
    primaryColor: '#7B4B94',
    secondaryColor: '#1A1A2E',
    emissiveColor: '#9B59B6',
    particleColor: '#B39DDB',
    defaultVoiceId: 'af_aoede',
    voiceLabel: 'Aoede (Storyteller)',
    idleVideoUrl: `${ATLAS_S3_BASE}/aoede/idle-video.mp4`,
    portraitUrl: `${PORTRAIT_S3_BASE}/portrait-aoede.jpg`,
  },
  {
    id: 'leda',
    name: 'Leda',
    title: 'The Wound Companion',
    description: 'Nurturing compassion and rose-toned warmth. She holds space for your deepest healing.',
    primaryColor: '#B76E79',
    secondaryColor: '#2D1B35',
    emissiveColor: '#E91E63',
    particleColor: '#F8BBD0',
    defaultVoiceId: 'af_heart',
    voiceLabel: 'Heart (Sweet)',
    idleVideoUrl: `${ATLAS_S3_BASE}/leda/idle-video.mp4`,
    portraitUrl: `${PORTRAIT_S3_BASE}/portrait-leda.jpg`,
  },
  {
    id: 'theia',
    name: 'Theia',
    title: 'The Somatic Guide',
    description: 'Grounded knowing and emerald calm. She reconnects you with your body\'s ancient wisdom.',
    primaryColor: '#2E8B57',
    secondaryColor: '#0D3B21',
    emissiveColor: '#4CAF50',
    particleColor: '#A5D6A7',
    defaultVoiceId: 'af_nova',
    voiceLabel: 'Nova (Calm)',
    idleVideoUrl: `${ATLAS_S3_BASE}/theia/idle-video.mp4`,
    portraitUrl: `${PORTRAIT_S3_BASE}/portrait-theia.jpg`,
  },
  {
    id: 'selene',
    name: 'Selene',
    title: 'The Knowledge Keeper',
    description: 'Serene intellect and sapphire depth. She illuminates your journey with lucid insight.',
    primaryColor: '#4169E1',
    secondaryColor: '#0D1B3E',
    emissiveColor: '#5C6BC0',
    particleColor: '#90CAF9',
    defaultVoiceId: 'bf_emma',
    voiceLabel: 'Emma (Intellectual)',
    idleVideoUrl: `${ATLAS_S3_BASE}/selene/idle-video.mp4`,
    portraitUrl: `${PORTRAIT_S3_BASE}/portrait-selene.jpg`,
  },
  {
    id: 'zephyr',
    name: 'Zephyr',
    title: 'The Sovereignty Guide',
    description: 'Radiant energy and amber fire. She ignites your sovereign power and embodied leadership.',
    primaryColor: '#E8834A',
    secondaryColor: '#3E1B0D',
    emissiveColor: '#FF9800',
    particleColor: '#FFE0B2',
    defaultVoiceId: 'af_bella',
    voiceLabel: 'Bella (Confident)',
    idleVideoUrl: `${ATLAS_S3_BASE}/zephyr/idle-video.mp4`,
    portraitUrl: `${PORTRAIT_S3_BASE}/portrait-zephyr.jpg`,
  },
];

/** Lookup by ID */
export function getGuideCharacter(id: string): GuideCharacter | undefined {
  return GUIDE_CHARACTERS.find(g => g.id === id);
}

/** Map from character ID → GuideType for HolographicAvatar compatibility */
export const CHARACTER_TO_GUIDE_TYPE: Record<string, string> = {
  kore: 'codex_orientation',
  aoede: 'archetype_reflection',
  leda: 'journal_companion',
  theia: 'ns_support',
  selene: 'resource_librarian',
  zephyr: 'community_concierge',
};
