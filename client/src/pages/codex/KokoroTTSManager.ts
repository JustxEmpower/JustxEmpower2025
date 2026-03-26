import { splitSentences, fetchAudio } from './KokoroTTSChunked';

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
  private currentSpeed = 1.0;
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

  /**
   * Sentence-chunked speak: splits text into sentences, fetches audio for
   * all in parallel, plays them sequentially so the first sentence starts
   * playing as soon as its audio is ready (~0.5-1s).
   */
  async speak(text: string, voiceId?: string): Promise<void> {
    if (!this.isReady) throw new Error('TTS not ready');
    if (this.isSpeaking) this.stop();

    const voice = voiceId || this.currentVoice;
    const sentences = splitSentences(text);
    console.log(`[Kokoro TTS] Chunked speak: ${sentences.length} sentence(s), voice=${voice}`);

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // Fire all sentence fetches in parallel
    const speed = this.currentSpeed;
    const blobPromises = sentences.map(s => fetchAudio(s, voice, speed, signal));

    this.isSpeaking = true;
    this.emit('start', { voice, text });
    this.emit('loading', { progress: 'Generating audio...' });

    try {
      let simliTotalDurationMs = 0;
      const simliSendStartTime = Date.now();
      let usedSimli = false;

      for (let i = 0; i < blobPromises.length; i++) {
        if (signal.aborted) break;

        const blob = await blobPromises[i];
        if (signal.aborted) break;

        if (i === 0) this.emit('loading', { progress: '' });

        // Check if Simli is connected — if so, send audio there instead of playing locally
        const simliSend = (window as any).__simliSendAudio;
        if (typeof simliSend === 'function') {
          usedSimli = true;
          // Estimate audio duration from WAV blob size (16kHz mono 16-bit = 32000 bytes/sec)
          const durationMs = Math.max(0, (blob.size - 44) / 32) ; // bytes / 32 = ms
          simliTotalDurationMs += durationMs;
          await this.sendToSimli(blob, simliSend, signal);
        } else {
          await this.playBlob(blob, voice, signal);
        }
      }

      // If we used Simli, wait for estimated playback to finish before firing 'end'
      // Simli buffers audio and plays it back — sending is near-instant but playback takes time
      if (usedSimli && !signal.aborted && simliTotalDurationMs > 0) {
        const elapsedMs = Date.now() - simliSendStartTime;
        const remainingMs = Math.max(0, simliTotalDurationMs - elapsedMs + 1500); // +1.5s safety buffer
        console.log(`[Kokoro TTS] Simli playback wait: ${remainingMs}ms (total audio: ${Math.round(simliTotalDurationMs)}ms, elapsed: ${elapsedMs}ms)`);
        if (remainingMs > 0) {
          await new Promise<void>((resolve) => {
            const timer = setTimeout(resolve, remainingMs);
            const onAbort = () => { clearTimeout(timer); resolve(); };
            signal.addEventListener('abort', onAbort, { once: true });
          });
        }
      }
    } catch (error) {
      if (signal.aborted) return; // stop() was called, not an error
      this.emit('error', { message: error instanceof Error ? error.message : 'Unknown' });
      console.error('[Kokoro TTS] Chunked speak failed:', error);
    } finally {
      if (!signal.aborted) {
        this.isSpeaking = false;
        this.stopAudioLevelMonitoring();
        this.emit('end', { voice });
      }
    }
  }

  /** Play a single audio blob and resolve when it finishes */
  private playBlob(blob: Blob, voice: string, signal: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (signal.aborted) { resolve(); return; }

      this.stopAudioElement();
      const url = URL.createObjectURL(blob);
      this.currentBlobUrl = url;
      this.audioElement = new Audio(url);
      this.audioElement.volume = 1.0;

      try {
        this.ensureAudioContext();
        const ctx = this.audioContext!;
        if (ctx.state === 'suspended') ctx.resume();
        this.mediaSource = ctx.createMediaElementSource(this.audioElement);
        this.mediaSource.connect(this.analyser || ctx.destination);
      } catch (e) {
        console.warn('[TTS] Analyser setup failed:', e);
      }

      this.startAudioLevelMonitoring();

      const onAbort = () => { this.stopAudioElement(); resolve(); };
      signal.addEventListener('abort', onAbort, { once: true });

      this.audioElement.onended = () => {
        signal.removeEventListener('abort', onAbort);
        this.stopAudioLevelMonitoring();
        resolve();
      };
      this.audioElement.onerror = () => {
        signal.removeEventListener('abort', onAbort);
        this.stopAudioLevelMonitoring();
        reject(new Error('Playback failed'));
      };

      this.audioElement.play().catch(reject);
    });
  }

  /** Send audio blob to Simli for lip-synced playback instead of local playback */
  private async sendToSimli(
    blob: Blob,
    simliSend: (blob: Blob) => Promise<void>,
    signal: AbortSignal
  ): Promise<void> {
    if (signal.aborted) return;
    try {
      // Send the WAV blob to Simli — it handles buffering + lip sync + playback
      await simliSend(blob);
      console.log(`[Kokoro TTS] Sent to Simli: ${blob.size} bytes`);
      // Tiny gap to prevent WebSocket flooding, Simli queues audio internally
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 100);
        const onAbort = () => { clearTimeout(timer); resolve(); };
        signal.addEventListener('abort', onAbort, { once: true });
      });
    } catch (err) {
      console.error('[Kokoro TTS] Simli send failed:', err);
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
  setSpeed(speed: number): void { this.currentSpeed = Math.max(0.5, Math.min(2.0, speed)); }
  getSpeed(): number { return this.currentSpeed; }
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
      loadingProgress: this.loadingProgress, currentVoice: this.currentVoice, currentSpeed: this.currentSpeed, audioLevel: this.audioLevel,
    };
  }

  dispose(): void {
    this.stop();
    this.stopAudioElement();
    if (this.audioContext) { this.audioContext.close(); this.audioContext = null; }
    this.eventListeners.clear();
  }
}
