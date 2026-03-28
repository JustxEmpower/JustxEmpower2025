/**
 * Living Codex™ Bayesian Adaptive Assessment Engine — Phase 1
 * ============================================================
 * Dynamically selects assessment questions based on accumulating
 * posterior probabilities over the archetype space.
 *
 * Flow:
 *   initializeAdaptiveState → updatePosteriors (per answer)
 *     → evaluatePhaseTransition → selectNextQuestion
 *     → shouldTerminate → convertToScoringResponses
 */

import { ARCHETYPES } from "./codexConstants";
import { type AnswerMetadata, type ResponseRecord } from "./codexScoringEngine";
import { nanoid } from "nanoid";

// ── Archetype Registry ────────────────────────────────────────────────

/** All 15 archetypal identities, in canonical order. */
export const ALL_ARCHETYPES: string[] = [
  ...ARCHETYPES.core.map(a => a.name),
  ...ARCHETYPES.expansion.map(a => a.name),
];

// ── Interfaces ─────────────────────────────────────────────────────────

/** Current belief state for a single archetype. */
export interface ArchetypePrior {
  archetype: string;
  /** Posterior probability (sums to 1.0 across all archetypes). */
  probability: number;
  /** Normalized confidence score [0, 1]. */
  confidence: number;
  /** Number of questions that provided direct evidence for this archetype. */
  evidenceCount: number;
}

export type AdaptivePhase =
  | 'broad_signal'
  | 'hypothesis_testing'
  | 'deep_dive'
  | 'confirmation';

/** Full mutable state for a single adaptive session. */
export interface AdaptiveState {
  sessionId: string;
  userId: string;
  /** Number of questions answered so far. */
  questionIndex: number;
  posteriors: ArchetypePrior[];
  /** Ordered list of question IDs that have been asked. */
  askedQuestions: string[];
  skippedQuestions: string[];
  /** Maps questionId → answerCode for answered questions. */
  answeredByQuestionId: Record<string, string>;
  currentPhase: AdaptivePhase;
  /** Top posterior probability recorded after each question. */
  confidenceHistory: number[];
  terminationReady: boolean;
  terminationReason: string | null;
}

/** Engine configuration — all values have defaults in DEFAULT_ADAPTIVE_CONFIG. */
export interface AdaptiveConfig {
  /** Number of questions in the initial broad-signal sweep. */
  broadSignalCount: number;
  /** Top probability threshold that triggers termination. */
  confidenceThreshold: number;
  /** Shannon entropy threshold that triggers termination. */
  entropyThreshold: number;
  /** Minimum questions before termination can trigger. */
  minQuestions: number;
  /** Hard ceiling — always terminate here. */
  maxQuestions: number;
  /** Archetypes below this probability are eliminated from posteriors. */
  eliminationThreshold: number;
}

export const DEFAULT_ADAPTIVE_CONFIG: AdaptiveConfig = {
  broadSignalCount: 5,
  confidenceThreshold: 0.75,
  entropyThreshold: 1.2,
  minQuestions: 25,
  maxQuestions: 75,
  eliminationThreshold: 0.05,
};

/**
 * Precomputed discrimination profile for a single question.
 * Populated by scripts/initializeQuestionSignals.ts at boot time.
 */
export interface QuestionSignal {
  questionId: string;
  sectionNum: number;
  /** Weight (0–1) describing how strongly each answer option maps to each archetype. */
  archetypeWeights: Record<string, number>;
  woundWeights: Record<string, number>;
  /** Precomputed expected information gain (updated dynamically per session). */
  informationGain: number;
  asked: boolean;
}

// ── Core Engine Functions ──────────────────────────────────────────────

/**
 * Creates a fresh adaptive state with uniform priors across all 15 archetypes.
 */
export function initializeAdaptiveState(
  userId: string,
  _config?: Partial<AdaptiveConfig>
): AdaptiveState {
  const n = ALL_ARCHETYPES.length;
  return {
    sessionId: nanoid(),
    userId,
    questionIndex: 0,
    posteriors: ALL_ARCHETYPES.map(archetype => ({
      archetype,
      probability: 1 / n,
      confidence: 0,
      evidenceCount: 0,
    })),
    askedQuestions: [],
    skippedQuestions: [],
    answeredByQuestionId: {},
    currentPhase: 'broad_signal',
    confidenceHistory: [],
    terminationReady: false,
    terminationReason: null,
  };
}

/**
 * Shannon entropy of the posterior distribution.
 * H = -Σ(p × log2(p))
 * Maximum entropy for 15 archetypes ≈ 3.91 bits (uniform).
 * Converged state < 1.2 bits.
 */
export function computeEntropy(posteriors: ArchetypePrior[]): number {
  return posteriors.reduce((h, p) => {
    if (p.probability <= 0) return h;
    return h - p.probability * Math.log2(p.probability);
  }, 0);
}

/**
 * Bayesian posterior update after a single answered question.
 *
 * Likelihood model:
 *   - Primary archetype match   → 3.0× (strong confirmation)
 *   - Secondary archetype match → 1.5× (moderate confirmation)
 *   - No match                  → 0.7× (mild disconfirmation)
 *
 * Spectrum depth modulates likelihood strength:
 *   - SHADOW   → ×1.2 (patterned activation = reliable signal)
 *   - GIFT     → ×0.9 (integration may mask true type)
 *   - THRESHOLD → ×1.0 (neutral)
 *
 * All posteriors are renormalized to sum to 1.0 after each update.
 */
export function updatePosteriors(
  state: AdaptiveState,
  questionSignal: QuestionSignal,
  answerMeta: AnswerMetadata
): AdaptiveState {
  const depth = answerMeta.spectrumDepth.replace(/[●◐★○\s]/g, "").toUpperCase();
  const spectrumMultiplier =
    depth === "SHADOW" ? 1.2 : depth === "GIFT" ? 0.9 : 1.0;

  const unnormalized = state.posteriors.map(prior => {
    const isPrimary =
      !!answerMeta.arPrimary &&
      !answerMeta.arPrimary.startsWith("Ghost") &&
      prior.archetype === answerMeta.arPrimary;

    const isSecondary =
      !!answerMeta.arSecondary &&
      !answerMeta.arSecondary.startsWith("Ghost") &&
      prior.archetype === answerMeta.arSecondary;

    let likelihood: number;
    if (isPrimary) {
      likelihood = 3.0 * spectrumMultiplier;
    } else if (isSecondary) {
      likelihood = 1.5 * spectrumMultiplier;
    } else {
      likelihood = 0.7;
    }

    // Blend in precomputed signal weights for additional discrimination
    const signalWeight = questionSignal.archetypeWeights[prior.archetype] ?? 0;
    if (signalWeight > 0) {
      likelihood *= 1 + signalWeight * 0.3;
    }

    return {
      archetype: prior.archetype,
      probability: prior.probability * likelihood,
      confidence: 0, // set after normalize
      evidenceCount:
        isPrimary || isSecondary
          ? prior.evidenceCount + 1
          : prior.evidenceCount,
    };
  });

  const total = unnormalized.reduce((s, p) => s + p.probability, 0);
  const normalized = unnormalized.map(p => {
    const prob = total > 0 ? p.probability / total : 1 / unnormalized.length;
    return { ...p, probability: prob, confidence: Math.min(prob * 2, 1) };
  });

  const topProb = Math.max(...normalized.map(p => p.probability));

  const nextState: AdaptiveState = {
    ...state,
    posteriors: normalized,
    askedQuestions: [...state.askedQuestions, questionSignal.questionId],
    answeredByQuestionId: {
      ...state.answeredByQuestionId,
      [questionSignal.questionId]: answerMeta.code,
    },
    questionIndex: state.questionIndex + 1,
    confidenceHistory: [...state.confidenceHistory, topProb],
  };

  nextState.currentPhase = evaluatePhaseTransition(nextState);
  return nextState;
}

/**
 * Checks whether the assessment has gathered sufficient evidence to terminate.
 *
 * Termination conditions (evaluated in order):
 *   1. Hard ceiling: questionIndex >= maxQuestions
 *   2. Entropy convergence: entropy < entropyThreshold AND >= minQuestions
 *   3. Confidence threshold: topProb > confidenceThreshold AND >= minQuestions
 */
export function shouldTerminate(
  state: AdaptiveState,
  config?: Partial<AdaptiveConfig>
): { terminate: boolean; reason: string | null } {
  const cfg = { ...DEFAULT_ADAPTIVE_CONFIG, ...config };
  const { questionIndex, posteriors } = state;

  if (questionIndex >= cfg.maxQuestions) {
    return { terminate: true, reason: "max_questions_reached" };
  }

  if (questionIndex < cfg.minQuestions) {
    return { terminate: false, reason: null };
  }

  const entropy = computeEntropy(posteriors);
  const topProb = Math.max(...posteriors.map(p => p.probability));

  if (entropy < cfg.entropyThreshold) {
    return { terminate: true, reason: "entropy_converged" };
  }

  if (topProb > cfg.confidenceThreshold) {
    return { terminate: true, reason: "confidence_threshold_met" };
  }

  return { terminate: false, reason: null };
}

/**
 * Determines which collection phase the session is currently in.
 *
 * Phases:
 *   broad_signal     — first 5 questions; maximizes coverage of archetype space
 *   hypothesis_testing — top 3-4 candidates emerging; focus discrimination
 *   deep_dive        — 1-2 archetypes dominant; probe specific patterns
 *   confirmation     — near threshold; contradiction-detection questions
 */
export function evaluatePhaseTransition(
  state: AdaptiveState,
  config?: Partial<AdaptiveConfig>
): AdaptivePhase {
  const cfg = { ...DEFAULT_ADAPTIVE_CONFIG, ...config };
  const { questionIndex, posteriors } = state;

  if (questionIndex < cfg.broadSignalCount) {
    return 'broad_signal';
  }

  const sorted = [...posteriors].sort((a, b) => b.probability - a.probability);
  const topProb = sorted[0]?.probability ?? 0;
  const entropy = computeEntropy(posteriors);

  // Approaching confirmation threshold
  if (topProb > cfg.confidenceThreshold * 0.9 && entropy < 2.0) {
    return 'confirmation';
  }

  // One or two archetypes clearly dominant
  if (topProb > 0.35 && entropy < 2.5) {
    return 'deep_dive';
  }

  // Top candidates beginning to separate from field
  if (topProb > 0.20 || entropy < 3.5) {
    return 'hypothesis_testing';
  }

  return 'broad_signal';
}

/**
 * Removes archetypes below the elimination threshold from posteriors.
 * Never eliminates below 3 remaining candidates to preserve assessment integrity.
 */
export function eliminateLowProbability(
  state: AdaptiveState,
  config?: Partial<AdaptiveConfig>
): AdaptiveState {
  const cfg = { ...DEFAULT_ADAPTIVE_CONFIG, ...config };
  const active = state.posteriors.filter(p => p.probability >= cfg.eliminationThreshold);

  // Keep minimum 3 candidates
  if (active.length === state.posteriors.length || active.length < 3) {
    return state;
  }

  const total = active.reduce((s, p) => s + p.probability, 0);
  const renormalized = active.map(p => ({
    ...p,
    probability: p.probability / total,
    confidence: Math.min((p.probability / total) * 2, 1),
  }));

  return { ...state, posteriors: renormalized };
}

/**
 * Expected information gain from asking a given question.
 *
 * IG ≈ H(current) − E[H(posterior | answer)]
 *
 * Approximated by simulating a "primary match" answer for each high-weight
 * archetype, weighting each simulation by current prior × signal weight.
 */
export function calculateInformationGain(
  question: QuestionSignal,
  posteriors: ArchetypePrior[]
): number {
  const currentEntropy = computeEntropy(posteriors);

  const candidates = Object.entries(question.archetypeWeights)
    .filter(([, w]) => w > 0.1)
    .slice(0, 5);

  if (candidates.length === 0) return 0;

  let weightedEntropySum = 0;
  let totalWeight = 0;

  for (const [arch, weight] of candidates) {
    // Simulate posterior after a primary-match answer for this archetype
    const simTotal = posteriors.reduce((s, p) => {
      const likelihood = p.archetype === arch ? 3.0 : 0.7;
      return s + p.probability * likelihood;
    }, 0);

    const simEntropy = posteriors.reduce((h, p) => {
      const likelihood = p.archetype === arch ? 3.0 : 0.7;
      const simProb = simTotal > 0 ? (p.probability * likelihood) / simTotal : p.probability;
      if (simProb <= 0) return h;
      return h - simProb * Math.log2(simProb);
    }, 0);

    const priorProb = posteriors.find(p => p.archetype === arch)?.probability ?? 0;
    const effectiveWeight = priorProb * weight;

    weightedEntropySum += effectiveWeight * simEntropy;
    totalWeight += effectiveWeight;
  }

  if (totalWeight === 0) return 0;
  const expectedEntropy = weightedEntropySum / totalWeight;

  return Math.max(0, currentEntropy - expectedEntropy);
}

/**
 * Selects the optimal next question given current state and phase.
 *
 * Selection strategy by phase:
 *   broad_signal       — maximize information gain (broadest coverage)
 *   hypothesis_testing — maximize IG weighted by relevance to top 3-4 archetypes
 *   deep_dive          — maximize primary-archetype signal + IG
 *   confirmation       — challenge questions (high signal for 2nd-3rd place archetypes)
 */
export function selectNextQuestion(
  state: AdaptiveState,
  questionPool: QuestionSignal[],
  _config?: Partial<AdaptiveConfig>
): QuestionSignal | null {
  const askedSet = new Set(state.askedQuestions);
  const available = questionPool.filter(q => !askedSet.has(q.questionId));

  if (available.length === 0) return null;

  const phase = state.currentPhase;
  const sorted = [...state.posteriors].sort((a, b) => b.probability - a.probability);

  if (phase === 'broad_signal') {
    const scored = available.map(q => ({
      q,
      score: calculateInformationGain(q, state.posteriors),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.q ?? null;
  }

  if (phase === 'hypothesis_testing') {
    const topArchSet = new Set(sorted.slice(0, 4).map(a => a.archetype));
    const scored = available.map(q => {
      const topRelevance = Object.entries(q.archetypeWeights)
        .filter(([arch]) => topArchSet.has(arch))
        .reduce((s, [, w]) => s + w, 0);
      const ig = calculateInformationGain(q, state.posteriors);
      return { q, score: topRelevance * ig };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.q ?? null;
  }

  if (phase === 'deep_dive') {
    const topArch = sorted[0]?.archetype;
    if (!topArch) return available[0] ?? null;
    const scored = available.map(q => ({
      q,
      score:
        (q.archetypeWeights[topArch] ?? 0) * 2 +
        calculateInformationGain(q, state.posteriors),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.q ?? null;
  }

  if (phase === 'confirmation') {
    const topArch = sorted[0]?.archetype ?? '';
    const challengers = sorted.slice(1, 3).map(a => a.archetype);
    const scored = available.map(q => {
      const challengeSignal = challengers.reduce(
        (s, arch) => s + (q.archetypeWeights[arch] ?? 0), 0
      );
      const topSignal = q.archetypeWeights[topArch] ?? 0;
      return { q, score: challengeSignal * 0.6 + topSignal * 0.4 };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.q ?? null;
  }

  return available[0] ?? null;
}

/**
 * Converts adaptive session responses into the ResponseRecord[] format
 * expected by runScoringEngine. Questions not asked or not answered
 * are flagged as ghosts (isGhost: true) so the scoring engine skips them.
 */
export function convertToScoringResponses(
  state: AdaptiveState,
  allQuestions: Array<{ id: string; sectionNum: number }>
): ResponseRecord[] {
  return allQuestions.map(q => {
    const answeredCode = state.answeredByQuestionId[q.id] ?? null;
    return {
      sectionNum: q.sectionNum,
      questionId: q.id,
      answerCode: answeredCode,
      openText: null,
      isGhost: answeredCode === null,
    };
  });
}

/**
 * Builds a QuestionSignal from raw DB answer rows for a single question.
 * Used as a fallback when the codex_question_signals table is not yet seeded.
 */
export function buildSignalFromAnswers(
  questionId: string,
  sectionNum: number,
  answers: Array<{
    arPrimary: string;
    arSecondary: string;
    wi: string;
    spectrumDepth: string;
  }>
): QuestionSignal {
  const archetypeWeights: Record<string, number> = {};
  const woundWeights: Record<string, number> = {};

  for (const ans of answers) {
    if (ans.arPrimary && !ans.arPrimary.startsWith("Ghost")) {
      archetypeWeights[ans.arPrimary] = (archetypeWeights[ans.arPrimary] ?? 0) + 1;
    }
    if (ans.arSecondary && !ans.arSecondary.startsWith("Ghost")) {
      archetypeWeights[ans.arSecondary] =
        (archetypeWeights[ans.arSecondary] ?? 0) + 0.5;
    }
    if (ans.wi && !ans.wi.startsWith("Ghost")) {
      woundWeights[ans.wi] = (woundWeights[ans.wi] ?? 0) + 1;
    }
  }

  // Normalize weights to [0, 1]
  const maxAr = Math.max(...Object.values(archetypeWeights), 1);
  const maxWi = Math.max(...Object.values(woundWeights), 1);

  const normalizedAr = Object.fromEntries(
    Object.entries(archetypeWeights).map(([k, v]) => [k, v / maxAr])
  );
  const normalizedWi = Object.fromEntries(
    Object.entries(woundWeights).map(([k, v]) => [k, v / maxWi])
  );

  // Discriminative power: variance of weights (high = better discriminator)
  const vals = Object.values(normalizedAr);
  const mean = vals.reduce((s, v) => s + v, 0) / (vals.length || 1);
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (vals.length || 1);

  return {
    questionId,
    sectionNum,
    archetypeWeights: normalizedAr,
    woundWeights: normalizedWi,
    informationGain: variance, // initial estimate; updated per-session
    asked: false,
  };
}

/**
 * Returns a compact summary of the top-5 archetypes by probability.
 * Safe for serialization and client consumption.
 */
export function posteriorsSummary(posteriors: ArchetypePrior[]): Array<{
  archetype: string;
  probability: number;
  confidence: number;
}> {
  return [...posteriors]
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5)
    .map(({ archetype, probability, confidence }) => ({
      archetype,
      probability: Math.round(probability * 1000) / 1000,
      confidence: Math.round(confidence * 1000) / 1000,
    }));
}
