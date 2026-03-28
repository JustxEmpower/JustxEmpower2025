/**
 * LIVING MIRROR REPORT — Phase 4
 * ============================================================
 * Extracts patterns, themes, and emotional tone from any content source
 * and tracks shifts over time. Generates dynamic addendums to the mirror
 * report as the user grows and changes.
 *
 * Key functions:
 *   createMirrorSnapshot   — extract themes/tone/patterns from content
 *   detectPatternShift     — compare recent vs older snapshots
 *   generateMirrorAddendum — produce dynamic mirror update
 *   generateTemporalReflection — 7/14/30-day comparison narrative
 */

import { ensureGeminiFromDatabase, getGeminiClient } from "../aiService";
import { getDb } from "../db";
import * as schema from "../../drizzle/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { nanoid } from "nanoid";

// ── Types ──────────────────────────────────────────────────────────────

export interface MirrorSnapshot {
  id: string;
  userId: string;
  sourceType: string;
  sourceId: string;
  dominantThemes: string[];
  emotionalTone: { primary: string; secondary?: string; valence: "positive" | "negative" | "mixed" | "neutral" };
  avoidancePatterns: string;
  growthIndicators: string;
  userLanguage: string[];
  createdAt: Date;
}

export interface PatternShift {
  pattern: string;
  direction: "emerging" | "resolving" | "deepening" | "shifting";
  evidenceBefore: string;
  evidenceAfter: string;
  narrative: string;
  confidenceScore: number;
}

export type MirrorAddendumType =
  | "pattern_shift"
  | "growth_recognition"
  | "new_insight"
  | "temporal_reflection";

export type Timeframe = "7_days" | "14_days" | "30_days";

// ── Core: create a snapshot from any content ──────────────────────────

export async function createMirrorSnapshot(
  userId: string,
  sourceType: string,
  sourceId: string,
  content: string
): Promise<MirrorSnapshot | null> {
  try {
    await ensureGeminiFromDatabase();
    const genAI = getGeminiClient();
    if (!genAI) return null;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { maxOutputTokens: 600, temperature: 0.8 },
    });

    const prompt = `You are a depth-psychology pattern analyst reading the following content from a user in a personal growth journey.

CONTENT:
${content}

Extract and return a JSON object (no markdown, no code fences, raw JSON only) with exactly these fields:
{
  "dominantThemes": ["theme1", "theme2", "theme3"],
  "emotionalTone": { "primary": "string", "secondary": "string or null", "valence": "positive|negative|mixed|neutral" },
  "avoidancePatterns": "one paragraph describing what this person is avoiding, sidestepping, or not saying",
  "growthIndicators": "one paragraph describing evidence of movement, growth, or new awareness",
  "userLanguage": ["exact phrase 1 from their actual words", "exact phrase 2", "exact phrase 3"]
}

Rules:
- dominantThemes: 2-4 themes, named concisely (e.g. "self-abandonment", "fear of visibility")
- emotionalTone: be specific, not generic
- avoidancePatterns: name what is absent or deflected — be direct
- growthIndicators: name what is new or shifting — even small movement counts
- userLanguage: pull 2-5 verbatim or near-verbatim phrases that feel most alive or characteristic`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const parsed = JSON.parse(raw);

    const db = await getDb();
    if (!db) return null;

    const id = nanoid();
    await db.insert(schema.codexMirrorSnapshots).values({
      id,
      userId,
      sourceType,
      sourceId,
      dominantThemes: JSON.stringify(parsed.dominantThemes || []),
      emotionalTone: JSON.stringify(parsed.emotionalTone || {}),
      avoidancePatterns: parsed.avoidancePatterns || "",
      growthIndicators: parsed.growthIndicators || "",
      userLanguage: JSON.stringify(parsed.userLanguage || []),
    });

    return {
      id,
      userId,
      sourceType,
      sourceId,
      dominantThemes: parsed.dominantThemes || [],
      emotionalTone: parsed.emotionalTone,
      avoidancePatterns: parsed.avoidancePatterns || "",
      growthIndicators: parsed.growthIndicators || "",
      userLanguage: parsed.userLanguage || [],
      createdAt: new Date(),
    };
  } catch {
    return null;
  }
}

// ── Detect pattern shift between recent and older snapshots ───────────

export async function detectPatternShift(userId: string): Promise<PatternShift | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const allSnapshots = await db
      .select()
      .from(schema.codexMirrorSnapshots)
      .where(eq(schema.codexMirrorSnapshots.userId, userId))
      .orderBy(desc(schema.codexMirrorSnapshots.createdAt))
      .limit(20);

    if (allSnapshots.length < 4) return null;

    // Recent = newest 3, older = snapshots 4-10
    const recent = allSnapshots.slice(0, 3);
    const older = allSnapshots.slice(3, 10);

    const recentSummary = recent.map(s => ({
      themes: tryParse(s.dominantThemes, []),
      avoidance: s.avoidancePatterns,
      growth: s.growthIndicators,
      language: tryParse(s.userLanguage, []),
    }));

    const olderSummary = older.map(s => ({
      themes: tryParse(s.dominantThemes, []),
      avoidance: s.avoidancePatterns,
      growth: s.growthIndicators,
      language: tryParse(s.userLanguage, []),
    }));

    await ensureGeminiFromDatabase();
    const genAI = getGeminiClient();
    if (!genAI) return null;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { maxOutputTokens: 500, temperature: 0.82 },
    });

    const prompt = `You are comparing two windows of a person's inner life over time.

OLDER PATTERNS (earlier snapshots):
${JSON.stringify(olderSummary, null, 2)}

RECENT PATTERNS (latest snapshots):
${JSON.stringify(recentSummary, null, 2)}

Identify the most significant pattern shift — something that was present before that has changed, OR something new that has emerged.

Return raw JSON only (no markdown, no code fences):
{
  "pattern": "the pattern being tracked, named precisely",
  "direction": "emerging|resolving|deepening|shifting",
  "evidenceBefore": "specific evidence from older snapshots",
  "evidenceAfter": "specific evidence from recent snapshots",
  "narrative": "a 1-2 sentence human-readable observation, e.g.: You used to say you avoid conflict. Lately you've been naming what you actually want. This is new.",
  "confidenceScore": 0.0-1.0
}

If no meaningful shift is detectable, return { "pattern": null }.`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const parsed = JSON.parse(raw);

    if (!parsed.pattern) return null;

    // Persist the pattern shift
    const shiftId = nanoid();
    await db.insert(schema.codexPatternShifts).values({
      id: shiftId,
      userId,
      pattern: parsed.pattern,
      direction: parsed.direction || "shifting",
      evidenceBefore: parsed.evidenceBefore || "",
      evidenceAfter: parsed.evidenceAfter || "",
      narrative: parsed.narrative || "",
      confidenceScore: String((parsed.confidenceScore || 0.5).toFixed(2)),
    });

    return {
      pattern: parsed.pattern,
      direction: parsed.direction || "shifting",
      evidenceBefore: parsed.evidenceBefore || "",
      evidenceAfter: parsed.evidenceAfter || "",
      narrative: parsed.narrative || "",
      confidenceScore: parsed.confidenceScore || 0.5,
    };
  } catch {
    return null;
  }
}

// ── Generate a dynamic mirror addendum ────────────────────────────────

export async function generateMirrorAddendum(
  userId: string,
  triggerType: MirrorAddendumType,
  reportId?: string
): Promise<string | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    // Gather recent snapshots for context
    const snapshots = await db
      .select()
      .from(schema.codexMirrorSnapshots)
      .where(eq(schema.codexMirrorSnapshots.userId, userId))
      .orderBy(desc(schema.codexMirrorSnapshots.createdAt))
      .limit(5);

    if (snapshots.length === 0) return null;

    // Build context block
    const context = snapshots.map(s => ({
      themes: tryParse(s.dominantThemes, []),
      avoidance: s.avoidancePatterns,
      growth: s.growthIndicators,
      source: s.sourceType,
    }));

    await ensureGeminiFromDatabase();
    const genAI = getGeminiClient();
    if (!genAI) return null;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { maxOutputTokens: 400, temperature: 0.88 },
    });

    const typeInstructions: Record<MirrorAddendumType, string> = {
      pattern_shift: "Witness a specific shift you've noticed in this person's patterns. Name what was, name what is now. Be precise, not poetic.",
      growth_recognition: "Acknowledge a specific piece of growth. Not encouragement — recognition. Name what you see concretely.",
      new_insight: "Surface a new theme or pattern that has just become visible. Name it plainly and directly.",
      temporal_reflection: "Reflect on what has changed over recent entries. What arc is this person on? What is emerging?",
    };

    const prompt = `You are the Living Mirror — a depth reflection system. You do not give advice or praise. You mirror back what you observe.

RECENT PATTERN DATA:
${JSON.stringify(context, null, 2)}

YOUR TASK: ${typeInstructions[triggerType]}

Write 3-5 sentences. No markdown. No "I notice that" openers. Begin with an observation. Use the person's actual themes and language. Speak directly but without judgment.`;

    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();

    // Persist addendum
    const addendumId = nanoid();
    await db.insert(schema.codexMirrorAddendums).values({
      id: addendumId,
      userId,
      reportId: reportId || null,
      type: triggerType,
      content,
    });

    return content;
  } catch {
    return null;
  }
}

// ── Temporal reflection: compare across a timeframe window ────────────

export async function generateTemporalReflection(
  userId: string,
  timeframe: Timeframe
): Promise<string | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const days = timeframe === "7_days" ? 7 : timeframe === "14_days" ? 14 : 30;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const midpoint = new Date(Date.now() - (days / 2) * 24 * 60 * 60 * 1000);

    const allSnapshots = await db
      .select()
      .from(schema.codexMirrorSnapshots)
      .where(
        and(
          eq(schema.codexMirrorSnapshots.userId, userId),
          gte(schema.codexMirrorSnapshots.createdAt, cutoff)
        )
      )
      .orderBy(desc(schema.codexMirrorSnapshots.createdAt));

    if (allSnapshots.length < 2) return null;

    const earlier = allSnapshots.filter(s => s.createdAt < midpoint);
    const recent = allSnapshots.filter(s => s.createdAt >= midpoint);

    await ensureGeminiFromDatabase();
    const genAI = getGeminiClient();
    if (!genAI) return null;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { maxOutputTokens: 500, temperature: 0.87 },
    });

    const prompt = `You are the Living Mirror. You are reflecting back what you have witnessed over the past ${days} days.

EARLIER IN THIS PERIOD:
${JSON.stringify(earlier.map(s => ({
  themes: tryParse(s.dominantThemes, []),
  avoidance: s.avoidancePatterns,
  growth: s.growthIndicators,
  language: tryParse(s.userLanguage, []),
})), null, 2)}

MORE RECENTLY:
${JSON.stringify(recent.map(s => ({
  themes: tryParse(s.dominantThemes, []),
  avoidance: s.avoidancePatterns,
  growth: s.growthIndicators,
  language: tryParse(s.userLanguage, []),
})), null, 2)}

Write a temporal reflection (4-6 sentences). Begin with what was present earlier in the period. Name what is present now. Name what is different, even subtly. Do not give advice. Do not offer hope or encouragement. Simply witness and name what you see.`;

    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();

    // Persist as a temporal_reflection addendum
    const addendumId = nanoid();
    await db.insert(schema.codexMirrorAddendums).values({
      id: addendumId,
      userId,
      type: "temporal_reflection",
      content,
    });

    return content;
  } catch {
    return null;
  }
}

// ── Helper ─────────────────────────────────────────────────────────────

function tryParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}
