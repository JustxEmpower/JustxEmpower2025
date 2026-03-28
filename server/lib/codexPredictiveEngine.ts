/**
 * PREDICTIVE ENGINE — Phase 7
 * ============================================================
 * Hybrid heuristic + statistical + AI prediction system.
 * Scores self-sabotage risk, phase readiness, retention risk,
 * and recommends optimal intervention type.
 *
 * Key functions:
 *   generatePredictions        — full prediction object for a user
 *   calculateRetentionRisk     — 0-1 risk score from engagement signals
 *   suggestOptimalIntervention — which intervention is most effective now
 */

import { ensureGeminiFromDatabase, getGeminiClient } from "../aiService";
import { getDb } from "../db";
import * as schema from "../../drizzle/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { nanoid } from "nanoid";

// ── Types ──────────────────────────────────────────────────────────────

export type InterventionType =
  | "mirror_nudge"
  | "guide_prompt"
  | "challenge_reissue"
  | "streak_recovery";

export interface PredictionResult {
  selfSabotageScore: number;       // 0-1
  phaseReadinessScore: number;     // 0-1
  retentionRiskScore: number;      // 0-1
  interventionRecommended: InterventionType;
  rationale: string;
  signals: {
    daysSinceLastActivity: number;
    journalStreakLength: number;
    checkInStreakLength: number;
    pendingChallenges: number;
    completedDialogueSessions: number;
    patternShiftsDetected: number;
    scrollLayersUnlocked: number;
  };
}

// ── Main: generate full predictions ───────────────────────────────────

export async function generatePredictions(userId: string): Promise<PredictionResult | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    // Gather signals
    const signals = await gatherSignals(userId, db);

    // Heuristic scores
    const retentionRisk = await calculateRetentionRisk(userId);
    const selfSabotageScore = computeSelfSabotageScore(signals);
    const phaseReadinessScore = computePhaseReadinessScore(signals);

    // AI-enriched rationale
    let rationale = "";
    try {
      await ensureGeminiFromDatabase();
      const genAI = getGeminiClient();
      if (genAI) {
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          generationConfig: { maxOutputTokens: 200, temperature: 0.75 },
        });

        const prompt = `You are analyzing engagement signals for a personal growth platform user.

SIGNALS:
- Days since last activity: ${signals.daysSinceLastActivity}
- Journal streak: ${signals.journalStreakLength} days
- Check-in streak: ${signals.checkInStreakLength} days
- Pending challenges not reported back on: ${signals.pendingChallenges}
- Completed dialogue sessions: ${signals.completedDialogueSessions}
- Pattern shifts detected recently: ${signals.patternShiftsDetected}
- Scroll layers unlocked: ${signals.scrollLayersUnlocked}

Self-sabotage risk: ${(selfSabotageScore * 100).toFixed(0)}%
Phase readiness: ${(phaseReadinessScore * 100).toFixed(0)}%
Retention risk: ${(retentionRisk * 100).toFixed(0)}%

Write 2 sentences naming the most likely reason this user is at these risk levels. Be specific and behavioral, not generic. No advice. Just observation.`;

        const result = await model.generateContent(prompt);
        rationale = result.response.text().trim();
      }
    } catch {
      rationale = "Prediction generated from engagement signals.";
    }

    const interventionRecommended = suggestOptimalIntervention({
      selfSabotageScore,
      phaseReadinessScore,
      retentionRiskScore: retentionRisk,
      signals,
    });

    // Persist prediction
    const predId = nanoid();
    const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // valid for 24 hours

    await db.insert(schema.codexPredictions).values({
      id: predId,
      userId,
      predictionData: JSON.stringify({ signals, rationale }),
      selfSabotageScore: selfSabotageScore.toFixed(2),
      phaseReadinessScore: phaseReadinessScore.toFixed(2),
      retentionRiskScore: retentionRisk.toFixed(2),
      interventionRecommended,
      validUntil,
    });

    return {
      selfSabotageScore,
      phaseReadinessScore,
      retentionRiskScore: retentionRisk,
      interventionRecommended,
      rationale,
      signals,
    };
  } catch {
    return null;
  }
}

// ── Calculate retention risk ───────────────────────────────────────────

export async function calculateRetentionRisk(userId: string): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 0.5;

    const signals = await gatherSignals(userId, db);

    let risk = 0;

    // Streak decline — no activity in 3+ days
    if (signals.daysSinceLastActivity >= 7) risk += 0.4;
    else if (signals.daysSinceLastActivity >= 3) risk += 0.2;

    // Engagement drop — no streak
    if (signals.journalStreakLength === 0 && signals.checkInStreakLength === 0) risk += 0.2;

    // Challenge avoidance — pending challenges with no report-back
    if (signals.pendingChallenges >= 2) risk += 0.2;
    else if (signals.pendingChallenges === 1) risk += 0.1;

    // No dialogue sessions completed
    if (signals.completedDialogueSessions === 0) risk += 0.1;

    // No scroll progress
    if (signals.scrollLayersUnlocked === 0) risk += 0.1;

    return Math.min(1, risk);
  } catch {
    return 0.5;
  }
}

// ── Suggest optimal intervention ──────────────────────────────────────

export function suggestOptimalIntervention(scores: {
  selfSabotageScore: number;
  phaseReadinessScore: number;
  retentionRiskScore: number;
  signals: PredictionResult["signals"];
}): InterventionType {
  const { selfSabotageScore, phaseReadinessScore, retentionRiskScore, signals } = scores;

  // Streak recovery first if they've gone dark
  if (signals.daysSinceLastActivity >= 5) {
    return "streak_recovery";
  }

  // Challenge reissue if they have pending challenges (avoidance signal)
  if (signals.pendingChallenges >= 1 && selfSabotageScore >= 0.5) {
    return "challenge_reissue";
  }

  // Guide prompt if phase readiness is high (they're ready to go deeper)
  if (phaseReadinessScore >= 0.7 && retentionRiskScore < 0.4) {
    return "guide_prompt";
  }

  // Mirror nudge as default — surface what's there
  return "mirror_nudge";
}

// ── Private: gather engagement signals ────────────────────────────────

async function gatherSignals(
  userId: string,
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>
): Promise<PredictionResult["signals"]> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Last activity: latest journal entry
  const lastJournal = await db
    .select()
    .from(schema.codexJournalEntries)
    .where(eq(schema.codexJournalEntries.userId, userId))
    .orderBy(desc(schema.codexJournalEntries.createdAt))
    .limit(1);

  const lastActivity = lastJournal[0]?.createdAt || null;
  const daysSinceLastActivity = lastActivity
    ? Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  // Journal streak: count consecutive days with at least one journal
  const recentJournals = await db
    .select()
    .from(schema.codexJournalEntries)
    .where(
      and(
        eq(schema.codexJournalEntries.userId, userId),
        gte(schema.codexJournalEntries.createdAt, thirtyDaysAgo)
      )
    )
    .orderBy(desc(schema.codexJournalEntries.createdAt));

  const journalStreakLength = computeStreak(recentJournals.map(j => j.createdAt));

  // Check-in streak
  const recentCheckIns = await db
    .select()
    .from(schema.codexCheckIns)
    .where(
      and(
        eq(schema.codexCheckIns.userId, userId),
        gte(schema.codexCheckIns.createdAt, thirtyDaysAgo)
      )
    )
    .orderBy(desc(schema.codexCheckIns.createdAt));

  const checkInStreakLength = computeStreak(
    recentCheckIns.filter(c => c.completedAt !== null).map(c => c.completedAt!)
  );

  // Pending challenges (issued but not reported back on)
  const pendingChallenges = await db
    .select()
    .from(schema.codexRealWorldChallenges)
    .where(
      and(
        eq(schema.codexRealWorldChallenges.userId, userId)
      )
    );
  const pendingCount = pendingChallenges.filter(c => !c.completedAt).length;

  // Completed dialogue sessions
  const completedSessions = await db
    .select()
    .from(schema.codexDialogueSessions)
    .where(
      and(
        eq(schema.codexDialogueSessions.userId, userId)
      )
    );
  const completedDialogueSessions = completedSessions.filter(s => s.status === "completed").length;

  // Pattern shifts in last 30 days
  const patternShifts = await db
    .select()
    .from(schema.codexPatternShifts)
    .where(
      and(
        eq(schema.codexPatternShifts.userId, userId),
        gte(schema.codexPatternShifts.detectedAt, thirtyDaysAgo)
      )
    );
  const patternShiftsDetected = patternShifts.length;

  // Scroll layers unlocked
  const scrollLayers = await db
    .select()
    .from(schema.codexScrollLayers)
    .where(eq(schema.codexScrollLayers.userId, userId));
  const scrollLayersUnlocked = scrollLayers.filter(l => l.sealed === 0).length;

  return {
    daysSinceLastActivity,
    journalStreakLength,
    checkInStreakLength,
    pendingChallenges: pendingCount,
    completedDialogueSessions,
    patternShiftsDetected,
    scrollLayersUnlocked,
  };
}

// ── Private: compute self-sabotage score ──────────────────────────────

function computeSelfSabotageScore(signals: PredictionResult["signals"]): number {
  let score = 0;

  // Avoidance of challenges
  if (signals.pendingChallenges >= 2) score += 0.3;
  else if (signals.pendingChallenges === 1) score += 0.15;

  // Disengagement
  if (signals.daysSinceLastActivity >= 7) score += 0.3;
  else if (signals.daysSinceLastActivity >= 3) score += 0.15;

  // No dialogue depth
  if (signals.completedDialogueSessions === 0) score += 0.2;

  // No pattern shifts despite engagement
  if (signals.patternShiftsDetected === 0 && signals.completedDialogueSessions > 2) score += 0.2;

  return Math.min(1, score);
}

// ── Private: compute phase readiness score ────────────────────────────

function computePhaseReadinessScore(signals: PredictionResult["signals"]): number {
  let score = 0;

  // Active journaling
  if (signals.journalStreakLength >= 7) score += 0.3;
  else if (signals.journalStreakLength >= 3) score += 0.15;

  // Active check-ins
  if (signals.checkInStreakLength >= 5) score += 0.2;
  else if (signals.checkInStreakLength >= 2) score += 0.1;

  // Pattern shifts (growth signal)
  if (signals.patternShiftsDetected >= 2) score += 0.3;
  else if (signals.patternShiftsDetected === 1) score += 0.15;

  // Completed dialogue sessions
  if (signals.completedDialogueSessions >= 3) score += 0.2;
  else if (signals.completedDialogueSessions >= 1) score += 0.1;

  return Math.min(1, score);
}

// ── Private: compute streak from dates ────────────────────────────────

function computeStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const dayStrings = dates.map(d => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
  });

  const unique = Array.from(new Set(dayStrings));
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  let streak = 0;
  let current = new Date();

  for (let i = 0; i < 60; i++) {
    const checkStr = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`;
    if (unique.includes(checkStr)) {
      streak++;
      current = new Date(current.getTime() - 24 * 60 * 60 * 1000);
    } else if (checkStr === todayStr) {
      // Allow today to be missed (might not have checked in yet)
      current = new Date(current.getTime() - 24 * 60 * 60 * 1000);
    } else {
      break;
    }
  }

  return streak;
}
