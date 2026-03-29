/**
 * RESONANCE ENGINE
 * =================
 * Pure-function matching engine for the Living Codex community system.
 * Computes pairwise "psychic genome" similarity between users based on
 * their assessment scoring outputs.
 *
 * Three matching modes:
 *  - Resonance: find women most like you (default)
 *  - Complement: find women whose strengths are your shadows
 *  - Kinship: find women who share a specific wound
 *
 * All math is deterministic — no AI, no randomness.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface GenomeVector {
  userId: string;
  archetype: number[];  // 15-dimensional (one per archetype, normalized 0-1)
  wound: number[];      // wound frequency scores, normalized 0-1
  spectrum: number[];   // [shadowPct, thresholdPct, giftPct] normalized 0-1
  mirror: number[];     // mirror pattern scores, normalized 0-1
  phase: number[];      // 9-dimensional one-hot
  integration: number;  // 0-1 normalized integration index
  composite: number[];  // concatenated weighted vector
}

export interface MatchSubscores {
  archetypeOverlap: number;       // 0-1000
  woundKinship: number;           // 0-1000
  spectrumCorrelation: number;    // 0-1000
  mirrorAlignment: number;        // 0-1000
  phaseProximity: number;         // 0-1000
  contradictionResonance: number; // 0-1000
  integrationParity: number;      // 0-1000
}

export interface MatchResult {
  userIdA: string;
  userIdB: string;
  matchMode: "resonance" | "complement" | "kinship";
  overallScore: number; // 0-1000
  subscores: MatchSubscores;
  sharedArchetypes: string[];
  sharedWounds: string[];
  sharedMirrors: string[];
}

/** Subset of the ScoringOutput interface relevant to matching. */
export interface ScoringProfile {
  archetypeConstellation: {
    arCode: string;
    arName: string;
    frequency: number;
    weightedScore: number;
    spectrum?: { shadow: number; threshold: number; gift: number };
  }[];
  activeWounds: { wiCode: string; wiName: string; frequency: number }[];
  activeMirrors: { mpCode: string; mpName: string; frequency: number }[];
  spectrumProfile: {
    shadowPct: number;
    thresholdPct: number;
    giftPct: number;
  };
  integrationIndex: number;
  contradictionFlags?: { pattern: string; interpretation: string; index: number }[];
}

export type MatchMode = "resonance" | "complement" | "kinship";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Ordered archetype keys — index in this array = index in archetype vector */
const ARCHETYPE_KEYS = [
  "silent-flame", "forsaken-child", "pleaser-flame", "burdened-flame",
  "drifting-one", "guarded-mystic", "spirit-dimmed", "fault-bearer",
  "shielded-one", "rational-pilgrim", "living-flame", "rooted-flame",
  "sovereign", "threshold-walker", "luminous-witness",
];

/** Mode weight profiles (values sum to 1.0) */
const MODE_WEIGHTS: Record<MatchMode, {
  archetype: number;
  wound: number;
  spectrum: number;
  mirror: number;
  phase: number;
  contradiction: number;
  integration: number;
}> = {
  resonance: {
    archetype: 0.20,
    wound: 0.30,
    spectrum: 0.15,
    mirror: 0.15,
    phase: 0.10,
    contradiction: 0.05,
    integration: 0.05,
  },
  complement: {
    archetype: 0.25,
    wound: 0.10,
    spectrum: 0.25,
    mirror: 0.15,
    phase: 0.05,
    contradiction: 0.05,
    integration: 0.15,
  },
  kinship: {
    archetype: 0.10,
    wound: 0.70,
    spectrum: 0.00,
    mirror: 0.00,
    phase: 0.20,
    contradiction: 0.00,
    integration: 0.00,
  },
};

// ============================================================================
// MATH HELPERS
// ============================================================================

function dotProduct(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < len; i++) sum += a[i] * b[i];
  return sum;
}

function magnitude(v: number[]): number {
  let sum = 0;
  for (const x of v) sum += x * x;
  return Math.sqrt(sum);
}

/**
 * Cosine similarity between two vectors. Returns 0-1 (clamped).
 * Returns 0 if either vector is zero-length.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return Math.max(0, Math.min(1, dotProduct(a, b) / (magA * magB)));
}

/**
 * Euclidean distance between two vectors.
 */
function euclideanDistance(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < len; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/**
 * Gaussian decay: 1.0 at distance 0, decays based on sigma.
 */
function gaussianDecay(distance: number, sigma: number = 1.5): number {
  return Math.exp(-(distance * distance) / (2 * sigma * sigma));
}

/**
 * Jaccard similarity between two string sets.
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  Array.from(a).forEach(item => {
    if (b.has(item)) intersection++;
  });
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ============================================================================
// GENOME VECTOR COMPUTATION
// ============================================================================

/**
 * Converts a user's scoring output into a normalized numeric vector
 * suitable for similarity computation.
 */
export function computeGenomeVector(
  userId: string,
  scoring: ScoringProfile,
  phase: number = 1
): GenomeVector {
  // Archetype vector: 15-dimensional
  const archetype = new Array(ARCHETYPE_KEYS.length).fill(0);
  let maxWeighted = 0;
  for (const a of scoring.archetypeConstellation) {
    if (a.weightedScore > maxWeighted) maxWeighted = a.weightedScore;
  }
  if (maxWeighted > 0) {
    for (const a of scoring.archetypeConstellation) {
      const key = a.arName
        .replace(/^The\s+/, "")
        .toLowerCase()
        .replace(/\s+/g, "-");
      const idx = ARCHETYPE_KEYS.indexOf(key);
      if (idx >= 0) {
        archetype[idx] = a.weightedScore / maxWeighted;
      }
    }
  }

  // Wound vector: normalized frequencies
  const wound: number[] = [];
  let maxWound = 0;
  for (const w of scoring.activeWounds) {
    if (w.frequency > maxWound) maxWound = w.frequency;
  }
  for (const w of scoring.activeWounds) {
    wound.push(maxWound > 0 ? w.frequency / maxWound : 0);
  }

  // Spectrum vector: [shadow, threshold, gift] normalized 0-1
  const spectrum = [
    scoring.spectrumProfile.shadowPct / 100,
    scoring.spectrumProfile.thresholdPct / 100,
    scoring.spectrumProfile.giftPct / 100,
  ];

  // Mirror vector: normalized frequencies
  const mirror: number[] = [];
  let maxMirror = 0;
  for (const m of scoring.activeMirrors) {
    if (m.frequency > maxMirror) maxMirror = m.frequency;
  }
  for (const m of scoring.activeMirrors) {
    mirror.push(maxMirror > 0 ? m.frequency / maxMirror : 0);
  }

  // Phase vector: 9-dimensional one-hot
  const phaseVec = new Array(9).fill(0);
  const phaseIdx = Math.max(0, Math.min(8, phase - 1));
  phaseVec[phaseIdx] = 1.0;

  // Integration: normalize 0-2.0 → 0-1
  const integration = Math.min(scoring.integrationIndex / 2.0, 1.0);

  // Composite: weighted concatenation
  const composite = [
    ...archetype.map((v) => v * 0.2),
    ...wound.map((v) => v * 0.3),
    ...spectrum.map((v) => v * 0.15),
    ...mirror.map((v) => v * 0.15),
    ...phaseVec.map((v) => v * 0.1),
    integration * 0.05,
  ];

  return { userId, archetype, wound, spectrum, mirror, phase: phaseVec, integration, composite };
}

// ============================================================================
// RESONANCE SCORE COMPUTATION
// ============================================================================

/**
 * Computes the resonance score between two users.
 * Uses sub-algorithms weighted by the matching mode.
 */
export function computeResonanceScore(
  vectorA: GenomeVector,
  vectorB: GenomeVector,
  mode: MatchMode,
  scoringA?: ScoringProfile,
  scoringB?: ScoringProfile
): MatchResult {
  const weights = MODE_WEIGHTS[mode];

  // Sub-score 1: Archetype overlap (cosine similarity)
  const archetypeOverlap = cosineSimilarity(vectorA.archetype, vectorB.archetype);

  // Sub-score 2: Wound kinship
  let woundKinship: number;
  if (scoringA && scoringB) {
    const woundsA = new Set(scoringA.activeWounds.map((w) => w.wiCode));
    const woundsB = new Set(scoringB.activeWounds.map((w) => w.wiCode));
    woundKinship = jaccardSimilarity(woundsA, woundsB);
    // Boost for shared high-frequency wounds
    for (const wA of scoringA.activeWounds) {
      for (const wB of scoringB.activeWounds) {
        if (wA.wiCode === wB.wiCode) {
          const avgFreq = (wA.frequency + wB.frequency) / 2;
          woundKinship = Math.min(1, woundKinship + avgFreq * 0.05);
        }
      }
    }
  } else {
    // Fallback: cosine on wound vectors (may be different lengths)
    const maxLen = Math.max(vectorA.wound.length, vectorB.wound.length);
    const padA = [...vectorA.wound, ...new Array(Math.max(0, maxLen - vectorA.wound.length)).fill(0)];
    const padB = [...vectorB.wound, ...new Array(Math.max(0, maxLen - vectorB.wound.length)).fill(0)];
    woundKinship = cosineSimilarity(padA, padB);
  }

  // Sub-score 3: Spectrum correlation
  let spectrumCorrelation: number;
  if (mode === "complement") {
    // Complement mode: high distance = good match
    const dist = euclideanDistance(vectorA.spectrum, vectorB.spectrum);
    const maxDist = Math.sqrt(3); // max distance in 3D unit cube
    spectrumCorrelation = dist / maxDist;
  } else {
    // Resonance/kinship: low distance = good match
    const dist = euclideanDistance(vectorA.spectrum, vectorB.spectrum);
    const maxDist = Math.sqrt(3);
    spectrumCorrelation = 1 - dist / maxDist;
  }

  // Sub-score 4: Mirror alignment (cosine similarity)
  const maxMirrorLen = Math.max(vectorA.mirror.length, vectorB.mirror.length);
  const mirrorA = [...vectorA.mirror, ...new Array(Math.max(0, maxMirrorLen - vectorA.mirror.length)).fill(0)];
  const mirrorB = [...vectorB.mirror, ...new Array(Math.max(0, maxMirrorLen - vectorB.mirror.length)).fill(0)];
  const mirrorAlignment = cosineSimilarity(mirrorA, mirrorB);

  // Sub-score 5: Phase proximity (Gaussian decay)
  const phaseA = vectorA.phase.indexOf(1);
  const phaseB = vectorB.phase.indexOf(1);
  const phaseDist = Math.abs(phaseA - phaseB);
  const phaseProximity =
    phaseDist === 0 ? 1.0 :
    phaseDist === 1 ? 0.7 :
    phaseDist === 2 ? 0.3 :
    0.05;

  // Sub-score 6: Contradiction resonance
  let contradictionResonance = 0;
  if (scoringA?.contradictionFlags && scoringB?.contradictionFlags) {
    const patternsA = scoringA.contradictionFlags.map((c) => c.pattern);
    const patternsB = new Set(scoringB.contradictionFlags.map((c) => c.pattern));
    for (let i = 0; i < patternsA.length; i++) {
      if (patternsB.has(patternsA[i])) {
        contradictionResonance = 1.0;
        break;
      }
    }
  }

  // Sub-score 7: Integration parity
  const integrationParity = 1.0 - Math.abs(vectorA.integration - vectorB.integration);

  // Weighted overall score
  const overall =
    archetypeOverlap * weights.archetype +
    woundKinship * weights.wound +
    spectrumCorrelation * weights.spectrum +
    mirrorAlignment * weights.mirror +
    phaseProximity * weights.phase +
    contradictionResonance * weights.contradiction +
    integrationParity * weights.integration;

  // Find shared elements
  const sharedArchetypes: string[] = [];
  const sharedWounds: string[] = [];
  const sharedMirrors: string[] = [];

  if (scoringA && scoringB) {
    const archA = new Set(scoringA.archetypeConstellation.map((a) => a.arName));
    for (const a of scoringB.archetypeConstellation) {
      if (archA.has(a.arName)) sharedArchetypes.push(a.arName);
    }
    const woundA = new Set(scoringA.activeWounds.map((w) => w.wiCode));
    for (const w of scoringB.activeWounds) {
      if (woundA.has(w.wiCode)) sharedWounds.push(w.wiCode);
    }
    const mirA = new Set(scoringA.activeMirrors.map((m) => m.mpCode));
    for (const m of scoringB.activeMirrors) {
      if (mirA.has(m.mpCode)) sharedMirrors.push(m.mpCode);
    }
  }

  return {
    userIdA: vectorA.userId,
    userIdB: vectorB.userId,
    matchMode: mode,
    overallScore: Math.round(overall * 1000),
    subscores: {
      archetypeOverlap: Math.round(archetypeOverlap * 1000),
      woundKinship: Math.round(woundKinship * 1000),
      spectrumCorrelation: Math.round(spectrumCorrelation * 1000),
      mirrorAlignment: Math.round(mirrorAlignment * 1000),
      phaseProximity: Math.round(phaseProximity * 1000),
      contradictionResonance: Math.round(contradictionResonance * 1000),
      integrationParity: Math.round(integrationParity * 1000),
    },
    sharedArchetypes,
    sharedWounds,
    sharedMirrors,
  };
}

// ============================================================================
// CIRCLE RANKING
// ============================================================================

/**
 * Ranks circles by relevance to a user's profile.
 * Returns sorted array with scores and human-readable reasons.
 */
export function rankCircleCandidates(
  scoring: ScoringProfile,
  circles: {
    id: string;
    circleType: string;
    archetypeFilter?: string | null;
    woundFilter?: string | null;
    phaseFilter?: number | null;
    name: string;
  }[],
  userPhase: number = 1
): { circleId: string; score: number; reason: string; name: string }[] {
  const results: { circleId: string; score: number; reason: string; name: string }[] = [];

  // Build quick lookup maps
  const archScores = new Map<string, number>();
  for (const a of scoring.archetypeConstellation) {
    const key = a.arName.replace(/^The\s+/, "").toLowerCase().replace(/\s+/g, "-");
    archScores.set(key, a.weightedScore);
  }
  const woundCodes = new Set(scoring.activeWounds.map((w) => w.wiCode));

  for (const circle of circles) {
    let score = 0;
    let reason = "";

    switch (circle.circleType) {
      case "general":
        score = 50;
        reason = "Open to all — connect with women across every archetype.";
        break;

      case "archetype":
        if (circle.archetypeFilter) {
          const matchScore = archScores.get(circle.archetypeFilter);
          if (matchScore != null) {
            score = Math.min(100, Math.round(matchScore * 10));
            reason = `Your archetype constellation includes this circle's archetype.`;
          } else {
            score = 5;
            reason = "This archetype is not in your constellation, but you may find growth here.";
          }
        }
        break;

      case "wound_kinship":
        if (circle.woundFilter && woundCodes.has(circle.woundFilter)) {
          score = 90;
          reason = "You carry this wound. These women know.";
        } else {
          score = 10;
          reason = "This wound is not in your active profile.";
        }
        break;

      case "phase":
        if (circle.phaseFilter != null) {
          const dist = Math.abs(circle.phaseFilter - userPhase);
          score = dist === 0 ? 100 : dist === 1 ? 60 : dist === 2 ? 30 : 10;
          reason =
            dist === 0
              ? "You are in this phase right now."
              : `This circle is ${dist} phase(s) from where you are.`;
        }
        break;

      default:
        score = 20;
        reason = "A circle you may explore.";
    }

    results.push({ circleId: circle.id, score, reason, name: circle.name });
  }

  return results.sort((a, b) => b.score - a.score);
}

// ============================================================================
// BATCH MATCHING
// ============================================================================

/**
 * Computes resonance scores between a target user and a list of candidates.
 * Returns the top N matches sorted by overall score.
 */
export function batchComputeMatches(
  targetVector: GenomeVector,
  candidates: GenomeVector[],
  mode: MatchMode = "resonance",
  topN: number = 20,
  targetScoring?: ScoringProfile,
  candidateScorings?: Map<string, ScoringProfile>
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const candidate of candidates) {
    if (candidate.userId === targetVector.userId) continue;
    const cScoring = candidateScorings?.get(candidate.userId);
    const match = computeResonanceScore(
      targetVector,
      candidate,
      mode,
      targetScoring,
      cScoring
    );
    results.push(match);
  }

  results.sort((a, b) => b.overallScore - a.overallScore);
  return results.slice(0, topN);
}
