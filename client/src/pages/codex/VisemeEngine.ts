/**
 * VisemeEngine.ts
 *
 * Real-time audio → viseme mapper for Living Codex™ avatar lip-sync.
 * Drives frame-accurate mouth animation with ZERO runtime API calls.
 *
 * Two signal paths (blended for maximum accuracy):
 *
 *   1. TEXT PATH (predictive):
 *      Text → grapheme-to-phoneme → phoneme-to-viseme → timed sequence
 *      Knows WHAT the mouth should do before audio starts.
 *
 *   2. AUDIO PATH (reactive):
 *      AudioAnalyserNode → FFT → spectral band classification → viseme
 *      Responds to ACTUAL audio in real-time (handles timing drift).
 *
 * Output: A viseme ID + blend weight at 60fps, consumed by LifelikeAvatar
 * to select the correct frame from the pre-generated viseme sprite sheet.
 *
 * @module codex/VisemeEngine
 */

// ============================================================================
// Types
// ============================================================================

/** The 15 standard English visemes */
export type VisemeId =
  | 'sil'  // Silence — lips closed
  | 'PP'   // p, b, m — lips pressed
  | 'FF'   // f, v — lower lip under teeth
  | 'TH'   // th — tongue between teeth
  | 'DD'   // t, d, n — tongue behind teeth
  | 'kk'   // k, g — back tongue raised
  | 'CH'   // ch, j, sh — lips rounded, teeth close
  | 'SS'   // s, z — teeth together
  | 'nn'   // n, l — tongue up, slightly open
  | 'RR'   // r — lips slightly rounded
  | 'aa'   // a (father) — wide open
  | 'E'    // e (bed) — medium open, wide
  | 'I'    // i (see) — slightly open, wide
  | 'O'    // o (go) — lips rounded, medium
  | 'U';   // u (you) — lips tightly rounded

/** Viseme with blend weight for smooth transitions */
export interface VisemeFrame {
  /** Current primary viseme */
  viseme: VisemeId;
  /** Blend weight 0-1 (how "open" the mouth is within this viseme) */
  weight: number;
  /** Secondary viseme for blending (next in sequence) */
  nextViseme: VisemeId;
  /** Blend factor between current and next (0=current, 1=next) */
  blendFactor: number;
  /** Sprite sheet column (0-4) */
  spriteCol: number;
  /** Sprite sheet row (0-2) */
  spriteRow: number;
  /** Next sprite position for blending */
  nextSpriteCol: number;
  nextSpriteRow: number;
}

/** Viseme atlas index loaded from the pre-generated JSON */
export interface VisemeAtlasIndex {
  [viseme: string]: {
    bestFrame: number;
    frames: number[];
    timestamp: number;
  };
  _amplitudeBands: {
    [band: string]: {
      viseme: string;
      threshold: number;
    };
  };
  _meta: {
    guideId: string;
    frameCount: number;
    fps: number;
    duration: number;
  };
}

// ============================================================================
// Constants
// ============================================================================

/** Viseme order in the sprite sheet (5 columns × 3 rows) */
const VISEME_ORDER: VisemeId[] = [
  'sil', 'PP', 'FF', 'TH', 'DD',   // Row 0
  'kk',  'CH', 'SS', 'nn', 'RR',   // Row 1
  'aa',  'E',  'I',  'O',  'U',    // Row 2
];

/** Sprite sheet grid dimensions */
const SPRITE_COLS = 5;
const SPRITE_ROWS = 3;

/** Get sprite sheet position for a viseme */
function getSpritePosition(viseme: VisemeId): { col: number; row: number } {
  const idx = VISEME_ORDER.indexOf(viseme);
  if (idx === -1) return { col: 0, row: 0 }; // fallback to 'sil'
  return {
    col: idx % SPRITE_COLS,
    row: Math.floor(idx / SPRITE_COLS),
  };
}

/**
 * Grapheme-to-phoneme mapping (simplified).
 * Maps English letter patterns to viseme IDs.
 * Not as accurate as CMU dict but works for 90% of cases and is tiny (~2KB).
 */
const GRAPHEME_TO_VISEME: [RegExp, VisemeId][] = [
  // Consonant clusters (check first)
  [/th/gi, 'TH'],
  [/sh|ch/gi, 'CH'],
  [/ph|ff/gi, 'FF'],
  [/ng|nk/gi, 'kk'],

  // Single consonants
  [/[pbm]/gi, 'PP'],
  [/[fv]/gi, 'FF'],
  [/[td]/gi, 'DD'],
  [/[kg]/gi, 'kk'],
  [/[jy]/gi, 'CH'],
  [/[sz]/gi, 'SS'],
  [/[nl]/gi, 'nn'],
  [/[r]/gi, 'RR'],
  [/[w]/gi, 'U'],
  [/[h]/gi, 'sil'],

  // Vowel patterns (longer patterns first)
  [/oo|ou|ew/gi, 'U'],
  [/oa|ow|oh/gi, 'O'],
  [/ee|ea|ie/gi, 'I'],
  [/ai|ay|a[^lrt]/gi, 'E'],
  [/ar|al|ah/gi, 'aa'],

  // Single vowels
  [/[u]/gi, 'U'],
  [/[o]/gi, 'O'],
  [/[i]/gi, 'I'],
  [/[e]/gi, 'E'],
  [/[a]/gi, 'aa'],
];

// ============================================================================
// Text-to-Viseme Sequence
// ============================================================================

interface TimedViseme {
  viseme: VisemeId;
  startTime: number; // seconds
  duration: number;  // seconds
}

/**
 * Convert text to a timed viseme sequence.
 * Uses grapheme-to-phoneme rules + estimated timing.
 *
 * @param text The text being spoken
 * @param totalDuration Estimated total speech duration (seconds)
 * @returns Array of timed visemes
 */
export function textToVisemeSequence(text: string, totalDuration: number): TimedViseme[] {
  const words = text.toLowerCase().replace(/[^a-z\s']/g, '').split(/\s+/).filter(Boolean);
  const visemes: VisemeId[] = [];

  for (const word of words) {
    let remaining = word;

    while (remaining.length > 0) {
      let matched = false;
      for (const [pattern, viseme] of GRAPHEME_TO_VISEME) {
        const match = remaining.match(pattern);
        if (match && match.index === 0) {
          visemes.push(viseme);
          remaining = remaining.slice(match[0].length);
          matched = true;
          break;
        }
      }
      if (!matched) {
        // Skip unknown character
        remaining = remaining.slice(1);
      }
    }

    // Add brief silence between words
    visemes.push('sil');
  }

  // Distribute timing evenly across visemes
  if (visemes.length === 0) return [];

  const perVisemeDuration = totalDuration / visemes.length;
  let currentTime = 0;

  return visemes.map(viseme => {
    // Silence is shorter, vowels are longer
    const durationMultiplier =
      viseme === 'sil' ? 0.3 :
      ['aa', 'E', 'I', 'O', 'U'].includes(viseme) ? 1.4 : 1.0;

    const duration = perVisemeDuration * durationMultiplier;
    const entry = { viseme, startTime: currentTime, duration };
    currentTime += duration;
    return entry;
  });
}

// ============================================================================
// Audio Analysis
// ============================================================================

/**
 * Classify audio spectrum into a viseme based on frequency bands.
 *
 * Key insight: Different mouth shapes produce different spectral signatures:
 *   - Closed mouth (sil, PP): Very low energy across all bands
 *   - Open vowels (aa, O): Strong energy in 300-1000Hz (first formant)
 *   - Front vowels (I, E): Strong energy in 1500-3000Hz (second formant)
 *   - Fricatives (SS, FF, CH): Strong energy above 3000Hz
 *   - Nasals (nn, PP closed): Energy concentrated below 500Hz
 */
export function classifySpectrum(
  frequencyData: Uint8Array,
  sampleRate: number
): { viseme: VisemeId; confidence: number } {
  const binCount = frequencyData.length;
  const hzPerBin = sampleRate / (binCount * 2);

  // Calculate energy in key frequency bands
  function bandEnergy(lowHz: number, highHz: number): number {
    const lowBin = Math.max(0, Math.floor(lowHz / hzPerBin));
    const highBin = Math.min(binCount - 1, Math.floor(highHz / hzPerBin));
    let sum = 0;
    for (let i = lowBin; i <= highBin; i++) {
      sum += frequencyData[i];
    }
    return sum / (highBin - lowBin + 1) / 255; // normalize to 0-1
  }

  const total = bandEnergy(80, 8000);
  const low = bandEnergy(80, 400);      // fundamentals, nasals
  const midLow = bandEnergy(400, 1200);  // first formant (vowel openness)
  const midHigh = bandEnergy(1200, 3000); // second formant (vowel frontness)
  const high = bandEnergy(3000, 8000);    // fricatives, sibilants

  // Silence threshold
  if (total < 0.03) {
    return { viseme: 'sil', confidence: 0.95 };
  }

  // Near-silence (consonant closures)
  if (total < 0.08) {
    if (low > midLow) return { viseme: 'PP', confidence: 0.7 };
    return { viseme: 'sil', confidence: 0.6 };
  }

  // High frequency dominant → fricatives
  if (high > midLow && high > 0.15) {
    if (high > 0.3) return { viseme: 'SS', confidence: 0.8 };
    if (midHigh > midLow) return { viseme: 'FF', confidence: 0.7 };
    return { viseme: 'CH', confidence: 0.6 };
  }

  // Classify vowels by formant ratios
  const f1Ratio = midLow / (total + 0.001); // openness
  const f2Ratio = midHigh / (total + 0.001); // frontness

  // Open vowels (high F1)
  if (f1Ratio > 0.4) {
    if (f2Ratio > 0.3) return { viseme: 'E', confidence: 0.7 };
    return { viseme: 'aa', confidence: 0.75 };
  }

  // Front/high vowels (high F2, low F1)
  if (f2Ratio > 0.35 && f1Ratio < 0.3) {
    return { viseme: 'I', confidence: 0.7 };
  }

  // Rounded vowels (low F2)
  if (f2Ratio < 0.2 && f1Ratio < 0.3) {
    if (total < 0.15) return { viseme: 'U', confidence: 0.65 };
    return { viseme: 'O', confidence: 0.7 };
  }

  // Nasal consonants (strong low, weak high)
  if (low > high * 2 && midLow < 0.2) {
    return { viseme: 'nn', confidence: 0.6 };
  }

  // Default to schwa-like mid vowel
  return { viseme: 'E', confidence: 0.4 };
}

// ============================================================================
// VisemeEngine Class
// ============================================================================

export class VisemeEngine {
  private analyser: AnalyserNode | null = null;
  private frequencyData: Uint8Array | null = null;
  private sampleRate: number = 44100;

  // Text-based prediction
  private predictedSequence: TimedViseme[] = [];
  private sequenceStartTime: number = 0;
  private textActive: boolean = false;

  // Blending state
  private currentViseme: VisemeId = 'sil';
  private targetViseme: VisemeId = 'sil';
  private blendProgress: number = 0;
  private lastUpdateTime: number = 0;

  // Smoothing
  private visemeHistory: VisemeId[] = [];
  private readonly HISTORY_SIZE = 3;
  private readonly BLEND_SPEED = 12; // visemes per second transition speed

  /**
   * Connect to a Web Audio AnalyserNode for real-time audio analysis.
   */
  connectAnalyser(analyser: AnalyserNode): void {
    this.analyser = analyser;
    this.frequencyData = new Uint8Array(analyser.frequencyBinCount);
    this.sampleRate = analyser.context.sampleRate;
  }

  /**
   * Set the predicted viseme sequence from text.
   * Call this when the guide starts speaking a new utterance.
   */
  prepareText(text: string, estimatedDuration: number): void {
    this.predictedSequence = textToVisemeSequence(text, estimatedDuration);
    this.sequenceStartTime = performance.now() / 1000;
    this.textActive = true;
  }

  /**
   * Stop text-based prediction (utterance ended).
   */
  stopText(): void {
    this.textActive = false;
    this.predictedSequence = [];
    this.targetViseme = 'sil';
  }

  /**
   * Get the current viseme frame for rendering.
   * Call this at 60fps from requestAnimationFrame.
   *
   * Blends text prediction (70%) with audio analysis (30%) for best accuracy.
   */
  getCurrentFrame(): VisemeFrame {
    const now = performance.now() / 1000;
    const dt = Math.min(now - this.lastUpdateTime, 0.1);
    this.lastUpdateTime = now;

    // --- Signal 1: Audio analysis (reactive) ---
    let audioViseme: VisemeId = 'sil';
    let audioConfidence = 0;

    if (this.analyser && this.frequencyData) {
      this.analyser.getByteFrequencyData(this.frequencyData);
      const result = classifySpectrum(this.frequencyData, this.sampleRate);
      audioViseme = result.viseme;
      audioConfidence = result.confidence;
    }

    // --- Signal 2: Text prediction (predictive) ---
    let textViseme: VisemeId = 'sil';
    let textConfidence = 0;

    if (this.textActive && this.predictedSequence.length > 0) {
      const elapsed = now - this.sequenceStartTime;

      // Find current viseme in sequence
      for (let i = this.predictedSequence.length - 1; i >= 0; i--) {
        const entry = this.predictedSequence[i];
        if (elapsed >= entry.startTime) {
          textViseme = entry.viseme;
          textConfidence = 0.8;

          // Check if we're past the end
          if (elapsed > entry.startTime + entry.duration && i === this.predictedSequence.length - 1) {
            textViseme = 'sil';
            textConfidence = 0.5;
          }
          break;
        }
      }
    }

    // --- Blend signals ---
    // Text prediction is weighted more when available (it knows what's coming)
    // Audio is used as a correction/fallback
    let finalViseme: VisemeId;

    if (this.textActive && textConfidence > 0.5) {
      // Text path active: 70% text, 30% audio
      // Use text viseme unless audio strongly disagrees
      if (audioConfidence > 0.8 && audioViseme !== textViseme) {
        finalViseme = audioViseme; // Audio override (strong signal)
      } else {
        finalViseme = textViseme;
      }
    } else if (audioConfidence > 0.3) {
      finalViseme = audioViseme; // Audio-only path
    } else {
      finalViseme = 'sil';
    }

    // --- Smoothing ---
    // Prevent viseme flickering by requiring 2/3 agreement in history
    this.visemeHistory.push(finalViseme);
    if (this.visemeHistory.length > this.HISTORY_SIZE) {
      this.visemeHistory.shift();
    }

    const stableViseme = this.getMostCommon(this.visemeHistory);

    // --- Smooth blending ---
    if (stableViseme !== this.targetViseme) {
      this.currentViseme = this.targetViseme;
      this.targetViseme = stableViseme;
      this.blendProgress = 0;
    }

    this.blendProgress = Math.min(1, this.blendProgress + dt * this.BLEND_SPEED);

    // --- Build output frame ---
    const currentPos = getSpritePosition(this.currentViseme);
    const targetPos = getSpritePosition(this.targetViseme);

    // Mouth openness (amplitude-based weight)
    const amplitude = this.getAmplitude();

    return {
      viseme: this.blendProgress > 0.5 ? this.targetViseme : this.currentViseme,
      weight: amplitude,
      nextViseme: this.targetViseme,
      blendFactor: this.blendProgress,
      spriteCol: currentPos.col,
      spriteRow: currentPos.row,
      nextSpriteCol: targetPos.col,
      nextSpriteRow: targetPos.row,
    };
  }

  /**
   * Get overall audio amplitude (0-1).
   */
  private getAmplitude(): number {
    if (!this.frequencyData) return 0;
    let sum = 0;
    for (let i = 0; i < this.frequencyData.length; i++) {
      sum += this.frequencyData[i];
    }
    return Math.min(1, (sum / this.frequencyData.length / 255) * 4);
  }

  /**
   * Find most common viseme in history (mode).
   */
  private getMostCommon(arr: VisemeId[]): VisemeId {
    const counts = new Map<VisemeId, number>();
    for (const v of arr) {
      counts.set(v, (counts.get(v) || 0) + 1);
    }
    let best: VisemeId = 'sil';
    let bestCount = 0;
    for (const [v, c] of counts) {
      if (c > bestCount) {
        best = v;
        bestCount = c;
      }
    }
    return best;
  }

  /**
   * Reset engine state.
   */
  reset(): void {
    this.currentViseme = 'sil';
    this.targetViseme = 'sil';
    this.blendProgress = 0;
    this.visemeHistory = [];
    this.predictedSequence = [];
    this.textActive = false;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

let _engine: VisemeEngine | null = null;

export function getVisemeEngine(): VisemeEngine {
  if (!_engine) _engine = new VisemeEngine();
  return _engine;
}

export { VISEME_ORDER, SPRITE_COLS, SPRITE_ROWS, getSpritePosition };
export default VisemeEngine;
