/**
 * Initialize Question Signals
 * ============================================================
 * Reads all assessment questions from both domain files, analyzes each
 * answer's archetype and wound mappings, then upserts pre-computed
 * discrimination profiles into the codex_question_signals table.
 *
 * Run once at deploy time (or whenever the question bank changes):
 *   npx ts-node scripts/initializeQuestionSignals.ts
 *
 * Safe to re-run — uses upsert semantics (delete + reinsert per question).
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as schema from "../drizzle/schema";
import { DOMAIN_1_QUESTIONS } from "../server/lib/codexAssessmentDomains1to4";
import { DOMAIN_5_QUESTIONS } from "../server/lib/codexAssessmentDomains5to8";
import { buildSignalFromAnswers } from "../server/lib/codexAdaptiveEngine";

// ── DB connection ──────────────────────────────────────────────────────

const DB_URL =
  process.env.DATABASE_URL ??
  `mysql://${process.env.DB_USER ?? "root"}:${process.env.DB_PASS ?? ""}@${process.env.DB_HOST ?? "localhost"}:3306/${process.env.DB_NAME ?? "justxempower"}`;

async function getConnection() {
  const connection = await mysql.createConnection(DB_URL);
  const db = drizzle(connection, { schema, mode: "default" });
  return { db, connection };
}

// ── Helpers ────────────────────────────────────────────────────────────

/** Computes variance of an array (used as discriminative power score). */
function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
}

/**
 * Analyzes a question's answer pool and returns a fully-populated signal
 * ready for DB insertion.
 */
function computeSignal(
  questionId: string,
  sectionNum: number,
  answers: Array<{
    primaryArchetype: string | null;
    secondaryArchetype: string | null;
    woundImprint: string | null;
    mirrorPattern: string | null;
    spectrumDepth: string;
  }>
): schema.InsertCodexQuestionSignal {
  // Build raw weight maps
  const archetypeRaw: Record<string, number> = {};
  const woundRaw: Record<string, number> = {};

  for (const ans of answers) {
    if (ans.primaryArchetype && !ans.primaryArchetype.startsWith("Ghost")) {
      archetypeRaw[ans.primaryArchetype] =
        (archetypeRaw[ans.primaryArchetype] ?? 0) + 1.0;
    }
    if (ans.secondaryArchetype && !ans.secondaryArchetype.startsWith("Ghost")) {
      archetypeRaw[ans.secondaryArchetype] =
        (archetypeRaw[ans.secondaryArchetype] ?? 0) + 0.5;
    }
    if (ans.woundImprint && !ans.woundImprint.startsWith("Ghost")) {
      woundRaw[ans.woundImprint] = (woundRaw[ans.woundImprint] ?? 0) + 1.0;
    }
  }

  // Normalize to [0, 1]
  const maxAr = Math.max(...Object.values(archetypeRaw), 1);
  const maxWi = Math.max(...Object.values(woundRaw), 1);

  const archetypeWeights: Record<string, number> = Object.fromEntries(
    Object.entries(archetypeRaw).map(([k, v]) => [k, Math.round((v / maxAr) * 1000) / 1000])
  );
  const woundWeights: Record<string, number> = Object.fromEntries(
    Object.entries(woundRaw).map(([k, v]) => [k, Math.round((v / maxWi) * 1000) / 1000])
  );

  // Discriminative power = variance of archetype weights
  // High variance → question reliably separates archetypes
  const weights = Object.values(archetypeWeights);
  const discriminativePower = Math.round(variance(weights) * 1000) / 1000;

  // Initial information gain estimate: proportional to discriminative power
  // This is refined dynamically during live sessions.
  const informationGain = Math.round(discriminativePower * Math.log2(1 + weights.length) * 1000) / 1000;

  return {
    id: nanoid(),
    questionId,
    sectionNum,
    archetypeWeights: JSON.stringify(archetypeWeights),
    woundWeights: JSON.stringify(woundWeights),
    informationGain: String(informationGain),
    discriminativePower: String(discriminativePower),
    timesAsked: 0,
  };
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log("Initializing question signals...\n");

  const { db, connection } = await getConnection();

  // Merge both domain question sets
  const allDomainQuestions = [...DOMAIN_1_QUESTIONS, ...DOMAIN_5_QUESTIONS];

  // Also read from DB to catch any questions seeded via seed-codex-questions.cjs
  const dbQuestions = await db.select().from(schema.codexQuestions);
  const dbAnswers = await db.select().from(schema.codexAnswers);

  const dbAnswersByQuestion = new Map<string, typeof dbAnswers>();
  for (const a of dbAnswers) {
    const arr = dbAnswersByQuestion.get(a.questionId) ?? [];
    arr.push(a);
    dbAnswersByQuestion.set(a.questionId, arr);
  }

  const dbQuestionIds = new Set(dbQuestions.map(q => q.id));
  const dbAnsweredIds = new Set(dbAnswersByQuestion.keys());

  let inserted = 0;
  let skipped = 0;

  // ── Process static domain questions ───────────────────────────────────

  for (const dq of allDomainQuestions) {
    if (dq.isGhost) { skipped++; continue; }

    // Prefer DB answers if available for this question ID
    let signal: schema.InsertCodexQuestionSignal;

    if (dbAnsweredIds.has(dq.id)) {
      const dbAnsList = dbAnswersByQuestion.get(dq.id) ?? [];
      signal = {
        id: nanoid(),
        questionId: dq.id,
        sectionNum: dq.section,
        archetypeWeights: (() => {
          const raw: Record<string, number> = {};
          for (const a of dbAnsList) {
            if (a.arPrimary && !a.arPrimary.startsWith("Ghost"))
              raw[a.arPrimary] = (raw[a.arPrimary] ?? 0) + 1;
            if (a.arSecondary && !a.arSecondary.startsWith("Ghost"))
              raw[a.arSecondary] = (raw[a.arSecondary] ?? 0) + 0.5;
          }
          const max = Math.max(...Object.values(raw), 1);
          return JSON.stringify(Object.fromEntries(
            Object.entries(raw).map(([k, v]) => [k, Math.round((v / max) * 1000) / 1000])
          ));
        })(),
        woundWeights: (() => {
          const raw: Record<string, number> = {};
          for (const a of dbAnsList) {
            if (a.wi && !a.wi.startsWith("Ghost"))
              raw[a.wi] = (raw[a.wi] ?? 0) + 1;
          }
          const max = Math.max(...Object.values(raw), 1);
          return JSON.stringify(Object.fromEntries(
            Object.entries(raw).map(([k, v]) => [k, Math.round((v / max) * 1000) / 1000])
          ));
        })(),
        informationGain: "0",
        discriminativePower: "0",
        timesAsked: 0,
      };
    } else {
      // Use static domain data
      signal = computeSignal(
        dq.id,
        dq.section,
        dq.answers.map(a => ({
          primaryArchetype: a.primaryArchetype ?? null,
          secondaryArchetype: a.secondaryArchetype ?? null,
          woundImprint: a.woundImprint ?? null,
          mirrorPattern: a.mirrorPattern ?? null,
          spectrumDepth: a.spectrumDepth,
        }))
      );
    }

    // Recalculate discriminative power and IG from final weights
    const weights = Object.values(JSON.parse(signal.archetypeWeights) as Record<string, number>);
    const dp = Math.round(variance(weights) * 1000) / 1000;
    const ig = Math.round(dp * Math.log2(1 + weights.length) * 1000) / 1000;
    signal.discriminativePower = String(dp);
    signal.informationGain = String(ig);

    // Upsert
    const [existing] = await db.select({ id: schema.codexQuestionSignals.id })
      .from(schema.codexQuestionSignals)
      .where(eq(schema.codexQuestionSignals.questionId, dq.id))
      .limit(1);

    if (existing) {
      await db.update(schema.codexQuestionSignals)
        .set({
          archetypeWeights: signal.archetypeWeights,
          woundWeights: signal.woundWeights,
          informationGain: signal.informationGain,
          discriminativePower: signal.discriminativePower,
        })
        .where(eq(schema.codexQuestionSignals.questionId, dq.id));
    } else {
      await db.insert(schema.codexQuestionSignals).values(signal);
    }

    inserted++;
    process.stdout.write(`\r  Processed: ${inserted}`);
  }

  // ── Process any DB-only questions not in static files ─────────────────

  for (const dbQ of dbQuestions) {
    if (dbQ.isGhost || dbQ.isOpenEnded) continue;

    // Skip if already handled above
    const alreadyHandled = allDomainQuestions.some(dq => dq.id === dbQ.id);
    if (alreadyHandled) continue;

    const dbAnsList = dbAnswersByQuestion.get(dbQ.id) ?? [];
    if (dbAnsList.length === 0) continue;

    const signal = computeSignal(
      dbQ.id,
      dbQ.sectionNum,
      dbAnsList.map(a => ({
        primaryArchetype: a.arPrimary,
        secondaryArchetype: a.arSecondary,
        woundImprint: a.wi,
        mirrorPattern: a.mp,
        spectrumDepth: a.spectrumDepth,
      }))
    );

    const [existing] = await db.select({ id: schema.codexQuestionSignals.id })
      .from(schema.codexQuestionSignals)
      .where(eq(schema.codexQuestionSignals.questionId, dbQ.id))
      .limit(1);

    if (existing) {
      await db.update(schema.codexQuestionSignals)
        .set({
          archetypeWeights: signal.archetypeWeights,
          woundWeights: signal.woundWeights,
          informationGain: signal.informationGain,
          discriminativePower: signal.discriminativePower,
        })
        .where(eq(schema.codexQuestionSignals.questionId, dbQ.id));
    } else {
      await db.insert(schema.codexQuestionSignals).values(signal);
    }

    inserted++;
    process.stdout.write(`\r  Processed: ${inserted}`);
  }

  console.log(`\n\nDone.`);
  console.log(`  Signals upserted : ${inserted}`);
  console.log(`  Ghost/skipped    : ${skipped}`);

  // Print top-10 most discriminative questions
  const allSignals = await db.select().from(schema.codexQuestionSignals)
    .orderBy(schema.codexQuestionSignals.discriminativePower);
  const top10 = [...allSignals]
    .sort((a, b) => parseFloat(b.discriminativePower ?? "0") - parseFloat(a.discriminativePower ?? "0"))
    .slice(0, 10);

  console.log("\nTop 10 most discriminative questions:");
  for (const s of top10) {
    const dp = parseFloat(s.discriminativePower ?? "0").toFixed(3);
    const ig = parseFloat(s.informationGain ?? "0").toFixed(3);
    const topArchetypes = Object.entries(JSON.parse(s.archetypeWeights) as Record<string, number>)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([k]) => k.replace("The ", ""))
      .join(", ");
    console.log(`  [S${s.sectionNum}] ${s.questionId.padEnd(12)} dp=${dp} ig=${ig}  → ${topArchetypes}`);
  }

  await connection.end();
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
