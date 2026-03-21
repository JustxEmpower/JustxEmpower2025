/**
 * KokoroTTSService.ts
 * Integrates Kokoro TTS (kokoro-js npm package) with Living Codex holographic avatar system.
 * Runs entirely in the browser using WASM/WebGPU with real-time streaming support.
 *
 * @module KokoroTTSService
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// Server-side TTS — no browser model loading needed

/**
 * Complete catalog of Kokoro TTS voices with metadata
 */
export interface KokoroVoice {
  id: string;
  name: string;
  language: string;
  gender: 'female' | 'male';
  style: string;
  isDefault: boolean;
  guideMatch?: string;
  /** Primary orb color (pastel or neon) */
  orbColor: string;
  /** Neon glow color for the orb aura */
  orbGlow: string;
}

/**
 * Full catalog of 54 Kokoro voices mapped to guide personas
 */
export const KOKORO_VOICE_CATALOG: KokoroVoice[] = [
  // ═══════════════════════════════════════════════════════════════
  // American English Female Voices (af_)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'af_kore',
    name: 'Kore',
    language: 'American English',
    gender: 'female',
    style: 'Contemplative, wise, authoritative',
    isDefault: true,
    guideMatch: 'Kore',
    orbColor: '#9B59B6',
    orbGlow: '#C77DFF',
  },
  {
    id: 'af_aoede',
    name: 'Aoede',
    language: 'American English',
    gender: 'female',
    style: 'Reflective, artistic, introspective',
    isDefault: true,
    guideMatch: 'Aoede',
    orbColor: '#E8A87C',
    orbGlow: '#FFD4A8',
  },
  {
    id: 'af_heart',
    name: 'Heart',
    language: 'American English',
    gender: 'female',
    style: 'Warm, compassionate, inviting',
    isDefault: false,
    guideMatch: 'Leda',
    orbColor: '#FFB6C1',
    orbGlow: '#FF69B4',
  },
  {
    id: 'af_bella',
    name: 'Bella',
    language: 'American English',
    gender: 'female',
    style: 'Gentle, soothing, melodic',
    isDefault: false,
    guideMatch: 'Zephyr',
    orbColor: '#98FB98',
    orbGlow: '#00FF7F',
  },
  {
    id: 'af_sarah',
    name: 'Sarah',
    language: 'American English',
    gender: 'female',
    style: 'Clear, professional, calm',
    isDefault: false,
    guideMatch: 'Theia',
    orbColor: '#87CEEB',
    orbGlow: '#00BFFF',
  },
  {
    id: 'af_nova',
    name: 'Nova',
    language: 'American English',
    gender: 'female',
    style: 'Bright, energetic, dynamic',
    isDefault: false,
    guideMatch: 'Theia',
    orbColor: '#FF6B6B',
    orbGlow: '#FF3366',
  },
  {
    id: 'af_jessica',
    name: 'Jessica',
    language: 'American English',
    gender: 'female',
    style: 'Conversational, friendly, approachable',
    isDefault: false,
    guideMatch: 'Aoede',
    orbColor: '#E6E6FA',
    orbGlow: '#B47EDC',
  },
  {
    id: 'af_nicole',
    name: 'Nicole',
    language: 'American English',
    gender: 'female',
    style: 'Warm, natural, expressive',
    isDefault: false,
    guideMatch: 'Leda',
    orbColor: '#FFD700',
    orbGlow: '#FFA500',
  },
  {
    id: 'af_sky',
    name: 'Sky',
    language: 'American English',
    gender: 'female',
    style: 'Ethereal, peaceful, serene',
    isDefault: false,
    guideMatch: 'Zephyr',
    orbColor: '#E0FFFF',
    orbGlow: '#7DF9FF',
  },
  {
    id: 'af_river',
    name: 'River',
    language: 'American English',
    gender: 'female',
    style: 'Flowing, gentle, reflective',
    isDefault: false,
    guideMatch: 'Theia',
    orbColor: '#20B2AA',
    orbGlow: '#00CED1',
  },
  {
    id: 'af_alloy',
    name: 'Alloy',
    language: 'American English',
    gender: 'female',
    style: 'Crisp, clear, modern',
    isDefault: false,
    guideMatch: 'Zephyr',
    orbColor: '#C0C0C0',
    orbGlow: '#E8E8E8',
  },

  // ═══════════════════════════════════════════════════════════════
  // American English Male Voices (am_)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'am_fenrir',
    name: 'Fenrir',
    language: 'American English',
    gender: 'male',
    style: 'Deep, powerful, commanding',
    isDefault: false,
    guideMatch: 'Theia',
    orbColor: '#DC143C',
    orbGlow: '#FF2400',
  },
  {
    id: 'am_puck',
    name: 'Puck',
    language: 'American English',
    gender: 'male',
    style: 'Playful, mischievous, clever',
    isDefault: false,
    guideMatch: 'Selene',
    orbColor: '#32CD32',
    orbGlow: '#39FF14',
  },
  {
    id: 'am_adam',
    name: 'Adam',
    language: 'American English',
    gender: 'male',
    style: 'Confident, steady, grounded',
    isDefault: false,
    orbColor: '#4169E1',
    orbGlow: '#6495ED',
  },
  {
    id: 'am_echo',
    name: 'Echo',
    language: 'American English',
    gender: 'male',
    style: 'Resonant, contemplative, measured',
    isDefault: false,
    orbColor: '#6A0DAD',
    orbGlow: '#9D4EDD',
  },
  {
    id: 'am_eric',
    name: 'Eric',
    language: 'American English',
    gender: 'male',
    style: 'Warm, natural, expressive',
    isDefault: false,
    orbColor: '#CD7F32',
    orbGlow: '#DAA520',
  },
  {
    id: 'am_liam',
    name: 'Liam',
    language: 'American English',
    gender: 'male',
    style: 'Friendly, approachable, clear',
    isDefault: false,
    orbColor: '#228B22',
    orbGlow: '#00FF41',
  },
  {
    id: 'am_michael',
    name: 'Michael',
    language: 'American English',
    gender: 'male',
    style: 'Professional, calm, authoritative',
    isDefault: false,
    orbColor: '#191970',
    orbGlow: '#4B0082',
  },
  {
    id: 'am_onyx',
    name: 'Onyx',
    language: 'American English',
    gender: 'male',
    style: 'Rich, sophisticated, deep',
    isDefault: false,
    orbColor: '#36454F',
    orbGlow: '#708090',
  },
  {
    id: 'am_santa',
    name: 'Santa',
    language: 'American English',
    gender: 'male',
    style: 'Warm, jolly, grandfatherly',
    isDefault: false,
    orbColor: '#E0115F',
    orbGlow: '#FF1493',
  },

  // ═══════════════════════════════════════════════════════════════
  // British English Female Voices (bf_)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'bf_emma',
    name: 'Emma',
    language: 'British English',
    gender: 'female',
    style: 'Sophisticated, refined, warm',
    isDefault: true,
    guideMatch: 'Selene',
    orbColor: '#F7E7CE',
    orbGlow: '#FFD700',
  },
  {
    id: 'bf_isabella',
    name: 'Isabella',
    language: 'British English',
    gender: 'female',
    style: 'Elegant, poised, graceful',
    isDefault: false,
    guideMatch: 'Aoede',
    orbColor: '#DCAE96',
    orbGlow: '#E8B4A0',
  },
  {
    id: 'bf_lily',
    name: 'Lily',
    language: 'British English',
    gender: 'female',
    style: 'Gentle, sweet, delicate',
    isDefault: false,
    guideMatch: 'Selene',
    orbColor: '#C8A2C8',
    orbGlow: '#DDA0DD',
  },
  {
    id: 'bf_alice',
    name: 'Alice',
    language: 'British English',
    gender: 'female',
    style: 'Clear, articulate, professional',
    isDefault: false,
    guideMatch: 'Theia',
    orbColor: '#F0EAD6',
    orbGlow: '#FFFDD0',
  },

  // ═══════════════════════════════════════════════════════════════
  // British English Male Voices (bm_)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'bm_daniel',
    name: 'Daniel',
    language: 'British English',
    gender: 'male',
    style: 'Authoritative, distinguished, noble',
    isDefault: false,
    orbColor: '#0F52BA',
    orbGlow: '#1E90FF',
  },
  {
    id: 'bm_fable',
    name: 'Fable',
    language: 'British English',
    gender: 'male',
    style: 'Storytelling, whimsical, engaging',
    isDefault: false,
    orbColor: '#9966CC',
    orbGlow: '#BF5FFF',
  },
  {
    id: 'bm_george',
    name: 'George',
    language: 'British English',
    gender: 'male',
    style: 'Cultured, articulate, refined',
    isDefault: false,
    orbColor: '#50C878',
    orbGlow: '#3FFF00',
  },
  {
    id: 'bm_lewis',
    name: 'Lewis',
    language: 'British English',
    gender: 'male',
    style: 'Warm, personable, genuine',
    isDefault: false,
    orbColor: '#B87333',
    orbGlow: '#E5944E',
  },
];

/**
 * Default voice mapping for Living Codex guides
 */
export const GUIDE_VOICE_DEFAULTS: Record<string, string> = {
  'Kore': 'af_kore',
  'Aoede': 'af_aoede',
  'Leda': 'af_heart',
  'Theia': 'af_nova',
  'Selene': 'bf_emma',
  'Zephyr': 'af_bella',
};

/**
 * Get recommended voices for a specific guide
 */
export function getRecommendedVoices(guideName: string): KokoroVoice[] {
  const defaultVoiceId = GUIDE_VOICE_DEFAULTS[guideName];
  const defaultVoice = KOKORO_VOICE_CATALOG.find(v => v.id === defaultVoiceId);

  // Get all voices matching the guide, with default first
  const recommended = KOKORO_VOICE_CATALOG.filter(
    v => v.guideMatch === guideName
  ).sort((a, b) => {
    if (a.id === defaultVoiceId) return -1;
    if (b.id === defaultVoiceId) return 1;
    return 0;
  });

  // Return default + up to 4-7 alternates
  return recommended.slice(0, 8);
}


// Re-export server-side TTS manager (no browser model loading)
export { KokoroTTSManager, type KokoroTTSEvent } from "./KokoroTTSManager";


/**
 * React hook for Kokoro TTS
 */
export function useKokoroTTS() {
  const managerRef = useRef<KokoroTTSManager | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [state, setState] = useState({
    isReady: false,
    isLoading: false,
    isSpeaking: false,
    loadingProgress: '',
    audioLevel: 0,
    currentVoice: 'af_kore',
  });

  // Initialize on mount
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new KokoroTTSManager();

      const updateState = () => {
        const currentState = managerRef.current?.getState();
        if (currentState) {
          setState(currentState);
        }
      };

      // Initial state update
      updateState();

      // Listen for events
      const handleStart = () => updateState();
      const handleEnd = () => updateState();
      const handleError = () => updateState();
      const handleLoading = () => updateState();

      if (managerRef.current) {
        managerRef.current.addEventListener('start', handleStart);
        managerRef.current.addEventListener('end', handleEnd);
        managerRef.current.addEventListener('error', handleError);
        managerRef.current.addEventListener('loading', handleLoading);
      }

      // Initialize model
      managerRef.current.initialize().catch(error => {
        console.error('[Kokoro TTS Hook] Initialization failed:', error);
      });

      // Setup animation frame for audio level updates
      const updateAudioLevel = () => {
        setState(prevState => ({
          ...prevState,
          audioLevel: managerRef.current?.getAudioLevel() || 0,
        }));
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };

      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const speak = useCallback(async (text: string, voiceId?: string) => {
    if (!managerRef.current) return;
    try {
      await managerRef.current.speak(text, voiceId);
    } catch (error) {
      console.error('[Kokoro TTS Hook] Speech failed:', error);
    }
  }, []);

  const speakStreaming = useCallback(async (text: string, voiceId?: string) => {
    if (!managerRef.current) return;
    try {
      await managerRef.current.speakStreaming(text, voiceId);
    } catch (error) {
      console.error('[Kokoro TTS Hook] Streaming failed:', error);
    }
  }, []);

  const stop = useCallback(() => {
    if (!managerRef.current) return;
    managerRef.current.stop();
    setState(prevState => ({
      ...prevState,
      isSpeaking: false,
      audioLevel: 0,
    }));
  }, []);

  const setVoice = useCallback((voiceId: string) => {
    if (!managerRef.current) return;
    managerRef.current.setVoice(voiceId);
    setState(prevState => ({
      ...prevState,
      currentVoice: voiceId,
    }));
  }, []);

  const voices = KOKORO_VOICE_CATALOG.map(v => v.id);

  return {
    isReady: state.isReady,
    isLoading: state.isLoading,
    isSpeaking: state.isSpeaking,
    loadingProgress: state.loadingProgress,
    audioLevel: state.audioLevel,
    currentVoice: state.currentVoice,
    speak,
    speakStreaming,
    stop,
    setVoice,
    voices,
  };
}