/**
 * KOKORO TTS SERVICE — Living Codex™
 * Neural TTS engine using Kokoro (82M params) in-browser via WASM.
 * 28 voices with unique orb colors. Falls back to SpeechSynthesis.
 */
import { useState, useEffect, useRef, useCallback } from 'react';

export interface KokoroVoice {
  id: string;
  name: string;
  gender: 'female' | 'male';
  accent: 'american' | 'british';
  style: string;
  orbColor: string;
  orbGlow: string;
  tags: string[];
}

export type TTSStatus = 'idle' | 'loading' | 'ready' | 'speaking' | 'error';

// Placeholder for kokoro-js dynamic import
let KokoroTTSModule: any = null;

export const KOKORO_VOICE_CATALOG: KokoroVoice[] = [
  // American Female
  { id: 'af_heart', name: 'Heart', gender: 'female', accent: 'american', style: 'Warm, nurturing', orbColor: '#FFB6C1', orbGlow: '#FF69B480', tags: ['warm', 'gentle'] },
  { id: 'af_alloy', name: 'Alloy', gender: 'female', accent: 'american', style: 'Clear, professional', orbColor: '#B0C4DE', orbGlow: '#6495ED80', tags: ['clear', 'neutral'] },
  { id: 'af_aoede', name: 'Aoede', gender: 'female', accent: 'american', style: 'Melodic, artistic', orbColor: '#E8A87C', orbGlow: '#DBA36880', tags: ['melodic'] },
  { id: 'af_bella', name: 'Bella', gender: 'female', accent: 'american', style: 'Friendly, bright', orbColor: '#98FB98', orbGlow: '#66CDAA80', tags: ['friendly'] },
  { id: 'af_jessica', name: 'Jessica', gender: 'female', accent: 'american', style: 'Confident, poised', orbColor: '#DDA0DD', orbGlow: '#BA55D380', tags: ['confident'] },
  { id: 'af_kore', name: 'Kore', gender: 'female', accent: 'american', style: 'Wise, grounded', orbColor: '#9B59B6', orbGlow: '#8E44AD80', tags: ['wise', 'guide'] },
  { id: 'af_nicole', name: 'Nicole', gender: 'female', accent: 'american', style: 'Calm, reassuring', orbColor: '#F0E68C', orbGlow: '#DAA52080', tags: ['calm'] },
  { id: 'af_nova', name: 'Nova', gender: 'female', accent: 'american', style: 'Vibrant, energetic', orbColor: '#FF6B6B', orbGlow: '#FF454580', tags: ['vibrant'] },
  { id: 'af_river', name: 'River', gender: 'female', accent: 'american', style: 'Flowing, natural', orbColor: '#87CEEB', orbGlow: '#4682B480', tags: ['flowing'] },
  { id: 'af_sarah', name: 'Sarah', gender: 'female', accent: 'american', style: 'Gentle, empathetic', orbColor: '#FFDAB9', orbGlow: '#F4A46080', tags: ['gentle'] },
  { id: 'af_sky', name: 'Sky', gender: 'female', accent: 'american', style: 'Airy, ethereal', orbColor: '#ADD8E6', orbGlow: '#87CEEB80', tags: ['ethereal'] },
  // American Male
  { id: 'am_adam', name: 'Adam', gender: 'male', accent: 'american', style: 'Steady, grounding', orbColor: '#8FBC8F', orbGlow: '#6B8E6B80', tags: ['steady'] },
  { id: 'am_echo', name: 'Echo', gender: 'male', accent: 'american', style: 'Deep, resonant', orbColor: '#708090', orbGlow: '#4A636F80', tags: ['deep'] },
  { id: 'am_eric', name: 'Eric', gender: 'male', accent: 'american', style: 'Warm, approachable', orbColor: '#DEB887', orbGlow: '#C4A06E80', tags: ['warm'] },
  { id: 'am_fenrir', name: 'Fenrir', gender: 'male', accent: 'american', style: 'Powerful, commanding', orbColor: '#CD5C5C', orbGlow: '#B2474780', tags: ['powerful'] },
  { id: 'am_liam', name: 'Liam', gender: 'male', accent: 'american', style: 'Friendly, engaging', orbColor: '#F4A460', orbGlow: '#D2854E80', tags: ['friendly'] },
  { id: 'am_michael', name: 'Michael', gender: 'male', accent: 'american', style: 'Authoritative', orbColor: '#B8860B', orbGlow: '#9A710980', tags: ['authoritative'] },
  { id: 'am_onyx', name: 'Onyx', gender: 'male', accent: 'american', style: 'Rich, velvety', orbColor: '#483D8B', orbGlow: '#3C328080', tags: ['rich'] },
  { id: 'am_puck', name: 'Puck', gender: 'male', accent: 'american', style: 'Playful, dynamic', orbColor: '#FF8C00', orbGlow: '#E07B0080', tags: ['playful'] },
  { id: 'am_santa', name: 'Santa', gender: 'male', accent: 'american', style: 'Jovial, warm', orbColor: '#DC143C', orbGlow: '#B2102F80', tags: ['jovial'] },
  // British Female
  { id: 'bf_alice', name: 'Alice', gender: 'female', accent: 'british', style: 'Elegant, refined', orbColor: '#F7E7CE', orbGlow: '#E8D5B580', tags: ['elegant'] },
  { id: 'bf_emma', name: 'Emma', gender: 'female', accent: 'british', style: 'Poised, articulate', orbColor: '#C8A2C8', orbGlow: '#B088B080', tags: ['poised'] },
  { id: 'bf_isabella', name: 'Isabella', gender: 'female', accent: 'british', style: 'Graceful, measured', orbColor: '#FFE4E1', orbGlow: '#FFB6C180', tags: ['graceful'] },
  { id: 'bf_lily', name: 'Lily', gender: 'female', accent: 'british', style: 'Soft, gentle', orbColor: '#E6E6FA', orbGlow: '#D8BFD880', tags: ['soft'] },
  // British Male
  { id: 'bm_daniel', name: 'Daniel', gender: 'male', accent: 'british', style: 'Composed, trustworthy', orbColor: '#4682B4', orbGlow: '#366FA280', tags: ['composed'] },
  { id: 'bm_fable', name: 'Fable', gender: 'male', accent: 'british', style: 'Storytelling, narrative', orbColor: '#D2691E', orbGlow: '#B8581A80', tags: ['storytelling'] },
  { id: 'bm_george', name: 'George', gender: 'male', accent: 'british', style: 'Classic, dignified', orbColor: '#2F4F4F', orbGlow: '#1C3C3C80', tags: ['classic'] },
  { id: 'bm_lewis', name: 'Lewis', gender: 'male', accent: 'british', style: 'Thoughtful, measured', orbColor: '#6A5ACD', orbGlow: '#584BC080', tags: ['thoughtful'] },
];

export const GUIDE_VOICE_DEFAULTS: Record<string, string> = {
  Kore: 'af_kore',
  Aoede: 'af_aoede',
  Leda: 'af_heart',
  Theia: 'af_nova',
  Selene: 'bf_emma',
  Zephyr: 'af_bella',
};

export function getVoiceById(id: string): KokoroVoice | undefined {
  return KOKORO_VOICE_CATALOG.find(v => v.id === id);
}

export function getRecommendedVoices(guideName: string): KokoroVoice[] {
  const defaultId = GUIDE_VOICE_DEFAULTS[guideName];
  const defaultVoice = KOKORO_VOICE_CATALOG.find(v => v.id === defaultId);
  const others = KOKORO_VOICE_CATALOG.filter(v => v.id !== defaultId && v.gender === 'female').slice(0, 7);
  return defaultVoice ? [defaultVoice, ...others] : others;
}

// ============================================================================
// KOKORO TTS MANAGER
// ============================================================================

export class KokoroTTSManager {
  private tts: any = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private srcNode: AudioBufferSourceNode | null = null;
  private _status: TTSStatus = 'idle';
  private _voice: string = 'af_heart';
  private events: TTSEvents = {};
  private rafId: number | null = null;
  private initProm: Promise<void> | null = null;

  get status() { return this._status; }
  get currentVoice() { return this._voice; }
  get isReady() { return this._status === 'ready' || this._status === 'speaking'; }

  constructor(events?: TTSEvents) { if (events) this.events = events; }
  setEvents(e: TTSEvents) { this.events = e; }
  setVoice(id: string) { if (KOKORO_VOICE_CATALOG.find(v => v.id === id)) this._voice = id; }

  async init(): Promise<boolean> {
    if (this.tts) return true;
    if (this.initProm) { await this.initProm; return !!this.tts; }
    this._status = 'loading';
    this.events.onLoading?.(0);
    this.initProm = (async () => {
      try {
        const mod = await import('kokoro-js');
        KokoroTTSModule = mod;
        this.events.onLoading?.(30);
        this.tts = await mod.KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8' });
        this.events.onLoading?.(100);
        this._status = 'ready';
      } catch (err) {
        console.error('[KokoroTTS] Load failed:', err);
        this._status = 'error';
        this.events.onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    })();
    await this.initProm;
    return !!this.tts;
  }

  stop() {
    try { this.srcNode?.stop(); } catch {}
    this.srcNode = null;
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
    this.events.onAudioLevel?.(0);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (this._status === 'speaking') { this._status = 'ready'; this.events.onEnd?.(); }
  }

  async speak(text: string): Promise<boolean> {
    if (!text.trim()) return false;
    this.stop();
    if (this.tts) {
      try {
        this._status = 'speaking';
        this.events.onStart?.();
        const audio = await this.tts.generate(text, { voice: this._voice });
        if (!this.audioCtx || this.audioCtx.state === 'closed') this.audioCtx = new AudioContext();
        if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();
        const sr = audio.sampling_rate || 24000;
        const data = audio.audio instanceof Float32Array ? audio.audio : new Float32Array(audio.audio);
        const buf = this.audioCtx.createBuffer(1, data.length, sr);
        buf.getChannelData(0).set(data);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
        const gain = this.audioCtx.createGain();
        this.srcNode = this.audioCtx.createBufferSource();
        this.srcNode.buffer = buf;
        this.srcNode.connect(gain).connect(this.analyser).connect(this.audioCtx.destination);
        this.monitorLevels();
        this.srcNode.onended = () => { this.stopMonitor(); this._status = 'ready'; this.events.onEnd?.(); };
        this.srcNode.start();
        return true;
      } catch (err) {
        console.error('[KokoroTTS] Speak failed, fallback:', err);
        this.events.onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    }
    return this.browserTTS(text);
  }

  private browserTTS(text: string): boolean {
    if (!('speechSynthesis' in window)) return false;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.9;
    const v = window.speechSynthesis.getVoices().find(v => v.name.includes('Samantha'));
    if (v) u.voice = v;
    u.onstart = () => { this._status = 'speaking'; this.events.onStart?.(); };
    u.onend = () => { this._status = 'ready'; this.events.onEnd?.(); };
    u.onerror = () => { this._status = 'ready'; this.events.onEnd?.(); };
    window.speechSynthesis.speak(u);
    return true;
  }

  private monitorLevels() {
    if (!this.analyser) return;
    const arr = new Uint8Array(this.analyser.frequencyBinCount);
    const tick = () => {
      if (!this.analyser) return;
      this.analyser.getByteFrequencyData(arr);
      let sum = 0;
      for (let i = 0; i < arr.length; i++) { const n = arr[i] / 255; sum += n * n; }
      this.events.onAudioLevel?.(Math.min(1, Math.sqrt(sum / arr.length) * 2.5));
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopMonitor() {
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
    this.events.onAudioLevel?.(0);
  }

  dispose() {
    this.stop();
    try { this.audioCtx?.close(); } catch {}
    this.tts = null; this.audioCtx = null; this.initProm = null;
  }
}

// ============================================================================
// REACT HOOK
// ============================================================================

export function useKokoroTTS(guideName: string) {
  const managerRef = useRef<KokoroTTSManager | null>(null);
  const [status, setStatus] = useState<TTSStatus>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [voice, setVoiceState] = useState(GUIDE_VOICE_DEFAULTS[guideName] || 'af_heart');

  useEffect(() => {
    const mgr = new KokoroTTSManager({
      onStart: () => setStatus('speaking'),
      onEnd: () => setStatus('ready'),
      onError: () => setStatus('error'),
      onLoading: () => setStatus('loading'),
      onAudioLevel: setAudioLevel,
    });
    mgr.setVoice(voice);
    managerRef.current = mgr;
    mgr.init();
    return () => { mgr.dispose(); managerRef.current = null; };
  }, []);

  const speak = useCallback(async (text: string) => {
    return managerRef.current?.speak(text) ?? false;
  }, []);

  const stop = useCallback(() => { managerRef.current?.stop(); }, []);

  const setVoice = useCallback((id: string) => {
    setVoiceState(id);
    managerRef.current?.setVoice(id);
  }, []);

  return { status, audioLevel, voice, speak, stop, setVoice, manager: managerRef };
}
