import { SECTION_META } from "./utils";

// Types for the scoring system
export interface AnswerMetadata {
  code: string;
  spectrumDepth: string; // SHADOW | THRESHOLD | GIFT | GHOST
  arPrimary: string;
  arSecondary: string;
  wi: string;
  mp: string;
  mmi?: string;
  abi?: string;
  epcl?: string;
  wombField?: string;
}

export interface ResponseRecord {
  sectionNum: number;
  questionId: string;
  answerCode: string | null;
  openText: string | null;
  isGhost: boolean;
}

export interface ArchetypeScore {
  archetype: string;
  frequency: number;
  sections: number[];
  spectrumDistribution: { shadow: number; threshold: number; gift: number };
  weightedScore: number;
}

export interface WoundScore {
  wiCode: string;
  frequency: number;
  sections: number[];
  weightedScore: number;
}

export interface MirrorScore {
  mpCode: string;
  frequency: number;
  sections: number[];
  weightedScore: number;
}

export interface SpectrumProfile {
  shadowPct: number;
  thresholdPct: number;
  giftPct: number;
  totalScored: number;
}

export interface ScoringOutput {
  archetypeConstellation: ArchetypeScore[];
  activeWounds: WoundScore[];
  activeMirrors: MirrorScore[];
  spectrumProfile: SpectrumProfile;
  masculineMirror: { mmiCode: string; mmiName: string; frequency: number }[];
  abuseBond: { patterns: { abiCode: string; frequency: number }[]; noneOfAboveCount: number };
  escapeLoops: { epclCode: string; epclName: string; frequency: number }[];
  wombField: { dominantField: string; secondaryField: string | null };
  s12OpenResponses: { promptId: string; responseText: string }[];
  integrationIndex: number;
  contradictionFlags: ContradictionFlag[];
  scoredAt: string;
}

export interface ContradictionFlag {
  pattern: string;
  interpretation: string;
  index: number;
}

/**
 * The Living Codex Scoring Engine
 * Runs server-side after assessment completion.
 * Reads answer selections, looks up metadata, aggregates results.
 */
export function runScoringEngine(
  responses: ResponseRecord[],
  answerLookup: Map<string, AnswerMetadata>
): ScoringOutput {
  // Filter out ghost responses
  const scoredResponses = responses.filter((r) => !r.isGhost && r.answerCode);

  // Aggregate archetype scores
  const arMap = new Map<string, { freq: number; sections: Set<number>; shadow: number; threshold: number; gift: number; weighted: number }>();
  const wiMap = new Map<string, { freq: number; sections: Set<number>; weighted: number }>();
  const mpMap = new Map<string, { freq: number; sections: Set<number>; weighted: number }>();
  const mmiMap = new Map<string, number>();
  const abiMap = new Map<string, number>();
  const epclMap = new Map<string, number>();
  const wombMap = new Map<string, number>();

  let shadowCount = 0;
  let thresholdCount = 0;
  let giftCount = 0;
  let totalScored = 0;
  let noneOfAboveCount = 0;

  // Truth Integrity Activation tracking (positive WI)
  let truthIntegrityScore = 0;
  let totalOtherWiScore = 0;

  const s12Responses: { promptId: string; responseText: string }[] = [];

  for (const resp of responses) {
    // Handle S12 open-ended
    if (resp.sectionNum === 12 && resp.openText) {
      s12Responses.push({ promptId: resp.questionId, responseText: resp.openText });
      continue;
    }

    if (resp.isGhost || !resp.answerCode) continue;

    const lookupKey = `${resp.sectionNum}-${resp.questionId}-${resp.answerCode}`;
    const meta = answerLookup.get(lookupKey);
    if (!meta) continue;

    const sectionWeight = SECTION_META[resp.sectionNum]?.weight ?? 1.0;
    totalScored++;

    // Spectrum depth counting
    const depth = meta.spectrumDepth.replace(/[●◐★○\s]/g, "").toUpperCase();
    if (depth === "SHADOW") shadowCount++;
    else if (depth === "THRESHOLD") thresholdCount++;
    else if (depth === "GIFT") giftCount++;

    // AR Primary scoring
    if (meta.arPrimary && !meta.arPrimary.startsWith("Ghost")) {
      const ar = arMap.get(meta.arPrimary) || { freq: 0, sections: new Set<number>(), shadow: 0, threshold: 0, gift: 0, weighted: 0 };
      ar.freq++;
      ar.sections.add(resp.sectionNum);
      ar.weighted += sectionWeight;
      if (depth === "SHADOW") ar.shadow++;
      else if (depth === "THRESHOLD") ar.threshold++;
      else if (depth === "GIFT") ar.gift++;
      arMap.set(meta.arPrimary, ar);
    }

    // AR Secondary scoring (half weight)
    if (meta.arSecondary && !meta.arSecondary.startsWith("Ghost")) {
      const ar2 = arMap.get(meta.arSecondary) || { freq: 0, sections: new Set<number>(), shadow: 0, threshold: 0, gift: 0, weighted: 0 };
      ar2.freq += 0.5;
      ar2.sections.add(resp.sectionNum);
      ar2.weighted += sectionWeight * 0.5;
      if (depth === "SHADOW") ar2.shadow += 0.5;
      else if (depth === "THRESHOLD") ar2.threshold += 0.5;
      else if (depth === "GIFT") ar2.gift += 0.5;
      arMap.set(meta.arSecondary, ar2);
    }

    // WI scoring
    if (meta.wi && !meta.wi.startsWith("Ghost")) {
      const wi = wiMap.get(meta.wi) || { freq: 0, sections: new Set<number>(), weighted: 0 };
      wi.freq++;
      wi.sections.add(resp.sectionNum);
      wi.weighted += sectionWeight;
      wiMap.set(meta.wi, wi);

      if (meta.wi.includes("Truth Integrity")) {
        truthIntegrityScore += sectionWeight;
      } else {
        totalOtherWiScore += sectionWeight;
      }
    }

    // MP scoring
    if (meta.mp && !meta.mp.startsWith("Ghost")) {
      const mp = mpMap.get(meta.mp) || { freq: 0, sections: new Set<number>(), weighted: 0 };
      mp.freq++;
      mp.sections.add(resp.sectionNum);
      mp.weighted += sectionWeight;
      mpMap.set(meta.mp, mp);
    }

    // Special columns
    if (meta.mmi && resp.sectionNum === 13) {
      mmiMap.set(meta.mmi, (mmiMap.get(meta.mmi) || 0) + 1);
    }
    if (meta.abi && resp.sectionNum === 14) {
      if (meta.abi.toLowerCase().includes("none")) {
        noneOfAboveCount++;
      } else {
        abiMap.set(meta.abi, (abiMap.get(meta.abi) || 0) + 1);
      }
    }
    if (meta.epcl && resp.sectionNum === 15) {
      epclMap.set(meta.epcl, (epclMap.get(meta.epcl) || 0) + 1);
    }
    if (meta.wombField && resp.sectionNum === 16) {
      wombMap.set(meta.wombField, (wombMap.get(meta.wombField) || 0) + 1);
    }
  }

  // Build archetype constellation (sorted by weighted score, top 5)
  const archetypeConstellation: ArchetypeScore[] = Array.from(arMap.entries())
    .map(([name, data]) => ({
      archetype: name,
      frequency: Math.round(data.freq),
      sections: Array.from(data.sections).sort((a, b) => a - b),
      spectrumDistribution: {
        shadow: Math.round(data.shadow),
        threshold: Math.round(data.threshold),
        gift: Math.round(data.gift),
      },
      weightedScore: Math.round(data.weighted * 10) / 10,
    }))
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, 5);

  // Build wound scores (top 3)
  const activeWounds: WoundScore[] = Array.from(wiMap.entries())
    .filter(([name]) => !name.includes("Truth Integrity"))
    .map(([name, data]) => ({
      wiCode: name,
      frequency: data.freq,
      sections: Array.from(data.sections).sort((a, b) => a - b),
      weightedScore: Math.round(data.weighted * 10) / 10,
    }))
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, 3);

  // Build mirror scores (top 5)
  const activeMirrors: MirrorScore[] = Array.from(mpMap.entries())
    .map(([name, data]) => ({
      mpCode: name,
      frequency: data.freq,
      sections: Array.from(data.sections).sort((a, b) => a - b),
      weightedScore: Math.round(data.weighted * 10) / 10,
    }))
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, 5);

  // Spectrum profile
  const spectrumProfile: SpectrumProfile = {
    shadowPct: totalScored ? Math.round((shadowCount / totalScored) * 100) : 0,
    thresholdPct: totalScored ? Math.round((thresholdCount / totalScored) * 100) : 0,
    giftPct: totalScored ? Math.round((giftCount / totalScored) * 100) : 0,
    totalScored,
  };

  // Masculine Mirror (S13) top patterns
  const masculineMirror = Array.from(mmiMap.entries())
    .map(([name, freq]) => ({ mmiCode: name, mmiName: name, frequency: freq }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 3);

  // Abuse Bond (S14)
  const abuseBond = {
    patterns: Array.from(abiMap.entries())
      .map(([name, freq]) => ({ abiCode: name, frequency: freq }))
      .sort((a, b) => b.frequency - a.frequency),
    noneOfAboveCount,
  };

  // Escape Loops (S15)
  const escapeLoops = Array.from(epclMap.entries())
    .map(([name, freq]) => ({ epclCode: name, epclName: name, frequency: freq }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 3);

  // Womb Field (S16)
  const wombSorted = Array.from(wombMap.entries()).sort((a, b) => b[1] - a[1]);
  const wombField = {
    dominantField: wombSorted[0]?.[0] ?? "Unknown",
    secondaryField: wombSorted[1]?.[0] ?? null,
  };

  // Integration Index
  const integrationIndex = totalOtherWiScore > 0
    ? Math.round(((truthIntegrityScore * 2) / totalOtherWiScore) * 100) / 100
    : truthIntegrityScore > 0 ? 2.0 : 0;

  // Contradiction detection
  const contradictionFlags = detectContradictions(archetypeConstellation, activeWounds, spectrumProfile);

  return {
    archetypeConstellation,
    activeWounds,
    activeMirrors,
    spectrumProfile,
    masculineMirror,
    abuseBond,
    escapeLoops,
    wombField,
    s12OpenResponses: s12Responses,
    integrationIndex,
    contradictionFlags,
    scoredAt: new Date().toISOString(),
  };
}

function detectContradictions(
  archetypes: ArchetypeScore[],
  wounds: WoundScore[],
  spectrum: SpectrumProfile
): ContradictionFlag[] {
  const flags: ContradictionFlag[] = [];

  // Check for high integration archetype + high wound scores
  const integrationArchetypes = ["The Rooted Flame", "The Sovereign", "The Luminous Witness", "The Living Flame"];
  const topArchNames = archetypes.slice(0, 3).map((a) => a.archetype);

  const hasIntegrationPrimary = topArchNames.some((n) => integrationArchetypes.includes(n));
  const highWoundCount = wounds.filter((w) => w.weightedScore > 15).length;

  if (hasIntegrationPrimary && highWoundCount >= 2) {
    flags.push({
      pattern: "Integration archetype dominant + multiple active wounds",
      interpretation: "May indicate spiritual bypassing or performance of integration. Verify with S12 open responses.",
      index: 0.8,
    });
  }

  // Check for high shadow + high gift percentages simultaneously
  if (spectrum.shadowPct > 40 && spectrum.giftPct > 25) {
    flags.push({
      pattern: "High shadow + high gift expression",
      interpretation: "Suggests context-dependent patterns — integrated in some areas, deeply wounded in others. This is diagnostic of active threshold work.",
      index: Math.abs(spectrum.shadowPct - spectrum.giftPct) / ((spectrum.shadowPct + spectrum.giftPct) / 2),
    });
  }

  return flags;
}
