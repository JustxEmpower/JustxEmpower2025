export type KokoroTTSEvent = 'start' | 'end' | 'error' | 'loading';

export class KokoroTTSManager {
  private audioElement: HTMLAudioElement | null = null;
  private currentBlobUrl: string | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;
  private isReady = false;
  private isLoading = false;
  private isSpeaking = false;
  private loadingProgress = '';
  private currentVoice = 'af_kore';
  private audioLevel = 0;
  private audioLevelInterval: ReturnType<typeof setInterval> | null = null;
  private abortController: AbortController | null = null;
  private eventListeners: Map<KokoroTTSEvent, Set<Function>> = new Map();

  constructor() {
    this.eventListeners.set('start', new Set());
    this.eventListeners.set('end', new Set());
    this.eventListeners.set('error', new Set());
    this.eventListeners.set('loading', new Set());
  }

  async initialize(): Promise<void> {
    if (this.isReady || this.isLoading) return;
    this.isLoading = true;
    this.loadingProgress = 'Connecting to voice engine...';
    this.emit('loading', { progress: this.loadingProgress });
    try {
      for (let i = 0; i < 60; i++) {
        const res = await fetch('/api/tts/status');
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const status = await res.json();
        if (status.ready) {
          this.isReady = true;
          this.isLoading = false;
          this.loadingProgress = 'Voice ready';
          this.emit('loading', { progress: 'Ready' });
          console.log('[Kokoro TTS] Server model ready');
          return;
        }
        if (status.error) throw new Error(status.error);
        this.loadingProgress = 'Loading voice engine...';
        this.emit('loading', { progress: this.loadingProgress });
        await new Promise(r => setTimeout(r, 2000));
      }
      throw new Error('TTS loading timed out');
    } catch (error) {
      this.isLoading = false;
      this.loadingProgress = `Error: ${error instanceof Error ? error.message : 'Unknown'}`;
      this.emit('error', { message: this.loadingProgress });
      console.error('[Kokoro TTS] Init failed:', error);
      throw error;
    }
  }

  private ensureAudioContext(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (!this.gainNode || !this.analyser) {
      this.gainNode = this.audioContext.createGain();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
    }
  }

  async speak(text: string, voiceId?: string): Promise<void> {
    if (!this.isReady) throw new Error('TTS not ready');
    if (this.isSpeaking) this.stop();
    const voice = voiceId || this.currentVoice;
    this.isSpeaking = true;
    this.emit('start', { voice, text });
    try {
      this.emit('loading', { progress: 'Generating audio...' });
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, speed: 1 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }
      const blob = await res.blob();
      if (this.currentBlobUrl) URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = URL.createObjectURL(blob);
      this.stopAudioElement();
      this.audioElement = new Audio(this.currentBlobUrl);
      this.audioElement.volume = 1.0;
      try {
        this.ensureAudioContext();
        const ctx = this.audioContext!;
        if (ctx.state === 'suspended') await ctx.resume();
        if (!this.mediaSource) {
          this.mediaSource = ctx.createMediaElementSource(this.audioElement);
          this.mediaSource.connect(this.analyser || ctx.destination);
          if (this.analyser) this.analyser.connect(ctx.destination);
        }
      } catch (e) {
        console.warn('[TTS] Analyser setup failed:', e);
      }
      this.startAudioLevelMonitoring();
      this.audioElement.onended = () => {
        this.isSpeaking = false;
        this.stopAudioLevelMonitoring();
        this.emit('end', { voice });
      };
      this.audioElement.onerror = (e) => {
        this.isSpeaking = false;
        this.stopAudioLevelMonitoring();
        this.emit('error', { message: 'Playback failed' });
      };
      await this.audioElement.play();
      console.log(`[Kokoro TTS] Playing ${voice} audio from server`);
    } catch (error) {
      this.isSpeaking = false;
      this.stopAudioLevelMonitoring();
      this.emit('error', { message: error instanceof Error ? error.message : 'Unknown' });
      console.error('[Kokoro TTS] Speak failed:', error);
      throw error;
    }
  }

  async speakStreaming(text: string, voiceId?: string): Promise<void> {
    return this.speak(text, voiceId);
  }

  stop(): void {
    this.stopAudioElement();
    if (this.abortController) { this.abortController.abort(); this.abortController = null; }
    this.isSpeaking = false;
    this.stopAudioLevelMonitoring();
  }

  private stopAudioElement(): void {
    if (this.audioElement) {
      try { this.audioElement.pause(); this.audioElement.src = ''; } catch {}
      this.audioElement = null;
    }
    if (this.mediaSource) { try { this.mediaSource.disconnect(); } catch {} this.mediaSource = null; }
    if (this.currentBlobUrl) { URL.revokeObjectURL(this.currentBlobUrl); this.currentBlobUrl = null; }
  }

  setVoice(voiceId: string): void { this.currentVoice = voiceId; }
  getAudioLevel(): number { return this.audioLevel; }
  listVoices(): string[] { return []; }

  private startAudioLevelMonitoring(): void {
    if (!this.analyser) return;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.audioLevelInterval = setInterval(() => {
      if (!this.analyser) return;
      this.analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += (data[i] / 255) ** 2;
      this.audioLevel = Math.max(0, Math.min(1, Math.sqrt(sum / data.length)));
    }, 50);
  }

  private stopAudioLevelMonitoring(): void {
    if (this.audioLevelInterval) { clearInterval(this.audioLevelInterval); this.audioLevelInterval = null; }
    this.audioLevel = 0;
  }

  addEventListener(event: KokoroTTSEvent, cb: Function): void { this.eventListeners.get(event)?.add(cb); }
  removeEventListener(event: KokoroTTSEvent, cb: Function): void { this.eventListeners.get(event)?.delete(cb); }

  private emit(event: KokoroTTSEvent, data: any): void {
    this.eventListeners.get(event)?.forEach(cb => { try { cb(data); } catch {} });
  }

  async resumeAudioContext(): Promise<void> {
    this.ensureAudioContext();
    if (this.audioContext?.state === 'suspended') await this.audioContext.resume();
  }

  getState() {
    return {
      isReady: this.isReady, isLoading: this.isLoading, isSpeaking: this.isSpeaking,
      loadingProgress: this.loadingProgress, currentVoice: this.currentVoice, audioLevel: this.audioLevel,
    };
  }

  dispose(): void {
    this.stop();
    this.stopAudioElement();
    if (this.audioContext) { this.audioContext.close(); this.audioContext = null; }
    this.eventListeners.clear();
  }
}
