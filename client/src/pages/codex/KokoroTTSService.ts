/**
 * KokoroTTSService.ts
 * Integrates Kokoro TTS (kokoro-js npm package) with Living Codex holographic avatar system.
 * Runs entirely in the browser using WASM/WebGPU with real-time streaming support.
 *
 * @module KokoroTTSService
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// Import types from kokoro-js (install: npm install kokoro-js)
// These will be resolved at runtime
let KokoroTTS: any = null;
let TextSplitterStream: any = null;

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

/**
 * Events emitted by KokoroTTSManager
 */
export type KokoroTTSEvent = 'start' | 'end' | 'error' | 'loading';

/**
 * KokoroTTSManager handles all TTS generation and playback
 */
export class KokoroTTSManager {
  private model: any = null;
  private audioContext: AudioContext | null = null;
  private audioSource: AudioBufferAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  private isReady: boolean = false;
  private isLoading: boolean = false;
  private isSpeaking: boolean = false;
  private loadingProgress: string = '';
  private currentVoice: string = 'af_kore';
  private audioLevel: number = 0;
  private audioLevelInterval: NodeJS.Timeout | null = null;

  private eventListeners: Map<KokoroTTSEvent, Set<Function>> = new Map();
  private abortController: AbortController | null = null;

  constructor() {
    this.initializeEventListeners();
  }

  private initializeEventListeners() {
    this.eventListeners.set('start', new Set());
    this.eventListeners.set('end', new Set());
    this.eventListeners.set('error', new Set());
    this.eventListeners.set('loading', new Set());
  }

  /**
   * Initialize the Kokoro TTS model
   */
  async initialize(): Promise<void> {
    if (this.isReady || this.isLoading) return;

    this.isLoading = true;
    this.loadingProgress = 'Initializing TTS...';
    this.emit('loading', { progress: this.loadingProgress });

    try {
      // Dynamic import to avoid bundling issues
      const kokoroModule = await import('kokoro-js');
      KokoroTTS = kokoroModule.KokoroTTS;
      TextSplitterStream = kokoroModule.TextSplitterStream;

      // Detect WebGPU support
      const hasWebGPU = !!(navigator as any).gpu;
      const device = hasWebGPU ? 'webgpu' : 'wasm';

      this.loadingProgress = `Loading Kokoro model (${device})...`;
      this.emit('loading', { progress: this.loadingProgress });

      // Initialize the model
      this.model = new KokoroTTS({
        model_id: 'onnx-community/Kokoro-82M-v1.0-ONNX',
        dtype: 'q8',
        device: device,
      });

      // Wait for model to be ready
      await this.model.ready;

      // Initialize AudioContext
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Create audio nodes
      this.gainNode = this.audioContext.createGain();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;

      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      this.isReady = true;
      this.isLoading = false;
      this.loadingProgress = 'TTS Ready';
      this.emit('loading', { progress: 'Ready' });

      console.log(`[Kokoro TTS] Initialized successfully using ${device}`);
    } catch (error) {
      this.isLoading = false;
      this.loadingProgress = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.emit('error', { message: this.loadingProgress });
      console.error('[Kokoro TTS] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Generate and play speech
   */
  async speak(text: string, voiceId?: string): Promise<void> {
    if (!this.isReady || !this.model || !this.audioContext || !this.gainNode) {
      throw new Error('KokoroTTS not initialized. Call initialize() first.');
    }

    if (this.isSpeaking) {
      this.stop();
    }

    const voice = voiceId || this.currentVoice;
    this.isSpeaking = true;
    this.emit('start', { voice, text });

    try {
      this.emit('loading', { progress: 'Generating audio...' });

      // Generate audio
      const audio = await this.model.generate(text, {
        voice: voice,
      });

      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create AudioBuffer from the generated audio
      const audioBuffer = this.audioContext.createBuffer(
        1, // mono
        audio.length,
        24000 // 24kHz sample rate
      );

      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < audio.length; i++) {
        channelData[i] = audio[i];
      }

      // Stop any existing playback
      if (this.audioSource) {
        this.audioSource.stop();
      }

      // Create and play audio source
      this.audioSource = this.audioContext.createBufferSource();
      this.audioSource.buffer = audioBuffer;
      this.audioSource.connect(this.gainNode!);

      // Start audio level monitoring
      this.startAudioLevelMonitoring();

      this.audioSource.onended = () => {
        this.isSpeaking = false;
        this.stopAudioLevelMonitoring();
        this.emit('end', { voice });
      };

      this.audioSource.start(0);
    } catch (error) {
      this.isSpeaking = false;
      this.stopAudioLevelMonitoring();
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.emit('error', { message });
      console.error('[Kokoro TTS] Speech generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate and play speech with streaming
   */
  async speakStreaming(text: string, voiceId?: string): Promise<void> {
    if (!this.isReady || !this.model || !this.audioContext || !this.gainNode) {
      throw new Error('KokoroTTS not initialized. Call initialize() first.');
    }

    if (this.isSpeaking) {
      this.stop();
    }

    const voice = voiceId || this.currentVoice;
    this.isSpeaking = true;
    this.abortController = new AbortController();
    this.emit('start', { voice, text });

    try {
      this.emit('loading', { progress: 'Initializing streaming...' });

      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create text splitter and stream
      const splitter = new TextSplitterStream();
      const stream = await this.model.stream(splitter, { voice });

      // Push text tokens into the splitter
      const sentences = text.split(/[.!?]+/).filter(s => s.trim());

      this.emit('loading', { progress: 'Streaming audio...' });
      this.startAudioLevelMonitoring();

      for (const sentence of sentences) {
        if (this.abortController.signal.aborted) break;

        // Push sentence to splitter
        splitter.push(sentence.trim() + '. ');

        // Get audio chunks from stream
        for await (const chunk of stream) {
          if (this.abortController.signal.aborted) break;

          if (chunk && chunk.length > 0) {
            // Create and play audio buffer
            const audioBuffer = this.audioContext.createBuffer(
              1,
              chunk.length,
              24000
            );
            const channelData = audioBuffer.getChannelData(0);
            for (let i = 0; i < chunk.length; i++) {
              channelData[i] = chunk[i];
            }

            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.gainNode!);
            source.start(0);

            // Small delay between chunks for natural flow
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      }

      this.isSpeaking = false;
      this.stopAudioLevelMonitoring();
      this.emit('end', { voice });
    } catch (error) {
      this.isSpeaking = false;
      this.stopAudioLevelMonitoring();

      if (this.abortController?.signal.aborted) {
        console.log('[Kokoro TTS] Streaming cancelled');
        return;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.emit('error', { message });
      console.error('[Kokoro TTS] Streaming failed:', error);
      throw error;
    }
  }

  /**
   * Stop current speech playback
   */
  stop(): void {
    if (this.audioSource) {
      try {
        this.audioSource.stop();
      } catch {
        // Already stopped
      }
      this.audioSource = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.isSpeaking = false;
    this.stopAudioLevelMonitoring();
  }

  /**
   * Set the current voice
   */
  setVoice(voiceId: string): void {
    const voiceExists = KOKORO_VOICE_CATALOG.some(v => v.id === voiceId);
    if (!voiceExists) {
      console.warn(`[Kokoro TTS] Voice "${voiceId}" not found in catalog`);
      return;
    }
    this.currentVoice = voiceId;
  }

  /**
   * Get current audio level (0-1) for avatar animation
   */
  getAudioLevel(): number {
    return this.audioLevel;
  }

  /**
   * List all available voice IDs
   */
  listVoices(): string[] {
    return KOKORO_VOICE_CATALOG.map(v => v.id);
  }

  /**
   * Start monitoring audio level
   */
  private startAudioLevelMonitoring(): void {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    this.audioLevelInterval = setInterval(() => {
      if (!this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);

      // Calculate RMS (root mean square) for more accurate level
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += (dataArray[i] / 255) ** 2;
      }
      const rms = Math.sqrt(sum / dataArray.length);

      // Smooth the level for animation
      this.audioLevel = Math.max(0, Math.min(1, rms));
    }, 50); // Update every 50ms
  }

  /**
   * Stop monitoring audio level
   */
  private stopAudioLevelMonitoring(): void {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }
    this.audioLevel = 0;
  }

  /**
   * Add event listener
   */
  addEventListener(event: KokoroTTSEvent, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: KokoroTTSEvent, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: KokoroTTSEvent, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[Kokoro TTS] Event listener error:`, error);
        }
      });
    }
  }

  /**
   * Get current state
   */
  getState() {
    return {
      isReady: this.isReady,
      isLoading: this.isLoading,
      isSpeaking: this.isSpeaking,
      loadingProgress: this.loadingProgress,
      currentVoice: this.currentVoice,
      audioLevel: this.audioLevel,
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.model = null;
    this.eventListeners.clear();
  }
}

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