/**
 * GUIDE MEMORY — Phase 6
 * ============================================================
 * Builds and maintains per-guide relational memory for each user.
 * Extracts key moments, tracks intimacy level, and provides
 * formatted context blocks to inject into guide system prompts.
 *
 * Key functions:
 *   extractMemoryFromExchange — extracts key moments & themes from an exchange
 *   buildMemoryContext        — returns formatted string for guide system prompt
 *   selectMomentToReference   — picks a past moment to surface in conversation
 *   calculateIntimacyLevel    — computes 0-10 intimacy from memory record
 */

import { ensureGeminiFromDatabase, getGeminiClient } from "../aiService";
import { getDb } from "../db";
import * as schema from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";

// ── Types ──────────────────────────────────────────────────────────────

export interface MemoryContext {
  intimacyLevel: number;
  totalSessions: number;
  recurringThemes: string[];
  userLanguage: string[];
  keyMomentToReference?: { content: string; context: string } | null;
}

// ── Extract memory from a single exchange ─────────────────────────────

export async function extractMemoryFromExchange(
  userId: string,
  guideId: string,
  userMessage: string,
  guideResponse: string
): Promise<void> {
  try {
    await ensureGeminiFromDatabase();
    const genAI = getGeminiClient();
    if (!genAI) return;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { maxOutputTokens: 400, temperature: 0.78 },
    });

    const prompt = `You are analyzing a single exchange between a user and an AI guide for long-term memory.

USER MESSAGE:
${userMessage}

GUIDE RESPONSE:
${guideResponse}

Return raw JSON only (no markdown, no code fences):
{
  "isKeyMoment": true or false,
  "keyMomentContent": "if isKeyMoment, the core thing the user revealed, named precisely. Otherwise null.",
  "keyMomentContext": "if isKeyMoment, the context that makes it significant. Otherwise null.",
  "emotionalIntensity": "low|moderate|high|peak",
  "themes": ["theme1", "theme2"],
  "userLanguagePhrases": ["exact or near-exact phrase from user", "another phrase"]
}

A key moment is: a revelation, a vulnerability expressed, a pattern named, a breakthrough, or an unusually direct statement about the user's inner life.
User language phrases: pull only the most alive or characteristic things the user said — actual words, not paraphrases.`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const parsed = JSON.parse(raw);

    const db = await getDb();
    if (!db) return;

    // Get or create guide memory record
    const existing = await db
      .select()
      .from(schema.codexGuideMemory)
      .where(
        and(
          eq(schema.codexGuideMemory.userId, userId),
          eq(schema.codexGuideMemory.guideId, guideId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      // Create new guide memory record
      const memId = nanoid();
      await db.insert(schema.codexGuideMemory).values({
        id: memId,
        userId,
        guideId,
        intimacyLevel: 0,
        totalSessions: 1,
        totalExchanges: 1,
        recurringThemes: JSON.stringify(parsed.themes || []),
        userLanguage: JSON.stringify(parsed.userLanguagePhrases || []),
        lastInteractionAt: new Date(),
      });
    } else {
      const mem = existing[0];
      const prevThemes: string[] = tryParse(mem.recurringThemes, []);
      const prevLanguage: string[] = tryParse(mem.userLanguage, []);

      // Merge themes (keep unique, cap at 20)
      const newThemes = Array.from(new Set([...prevThemes, ...(parsed.themes || [])])).slice(0, 20);
      // Merge language phrases (keep unique, cap at 30)
      const newLanguage = Array.from(new Set([...prevLanguage, ...(parsed.userLanguagePhrases || [])])).slice(0, 30);

      const newExchangeCount = (mem.totalExchanges || 0) + 1;
      const newIntimacy = calculateIntimacyLevel({
        ...mem,
        totalExchanges: newExchangeCount,
        recurringThemes: JSON.stringify(newThemes),
      } as schema.CodexGuideMemoryRecord);

      await db.update(schema.codexGuideMemory).set({
        totalExchanges: newExchangeCount,
        recurringThemes: JSON.stringify(newThemes),
        userLanguage: JSON.stringify(newLanguage),
        intimacyLevel: newIntimacy,
        lastInteractionAt: new Date(),
      }).where(eq(schema.codexGuideMemory.id, mem.id));
    }

    // Save key moment if detected
    if (parsed.isKeyMoment && parsed.keyMomentContent) {
      await db.insert(schema.codexGuideKeyMoments).values({
        id: nanoid(),
        userId,
        guideId,
        content: parsed.keyMomentContent,
        context: parsed.keyMomentContext || "",
        emotionalIntensity: parsed.emotionalIntensity || "moderate",
        referenced: 0,
      });
    }
  } catch {
    // Non-fatal — memory extraction is best-effort
  }
}

// ── Build memory context for guide system prompt ───────────────────────

export async function buildMemoryContext(
  userId: string,
  guideId: string
): Promise<string> {
  try {
    const db = await getDb();
    if (!db) return "";

    const memRecords = await db
      .select()
      .from(schema.codexGuideMemory)
      .where(
        and(
          eq(schema.codexGuideMemory.userId, userId),
          eq(schema.codexGuideMemory.guideId, guideId)
        )
      )
      .limit(1);

    if (memRecords.length === 0) return "";
    const mem = memRecords[0];

    const themes: string[] = tryParse(mem.recurringThemes, []);
    const language: string[] = tryParse(mem.userLanguage, []);

    // Get a key moment to potentially reference
    const momentToRef = await selectMomentToReference(userId, guideId);

    const lines: string[] = [
      `[GUIDE MEMORY — ${mem.totalSessions} session(s), ${mem.totalExchanges} exchange(s), intimacy ${mem.intimacyLevel}/10]`,
    ];

    if (themes.length > 0) {
      lines.push(`Recurring themes this person returns to: ${themes.slice(0, 8).join(", ")}.`);
    }

    if (language.length > 0) {
      lines.push(`Their characteristic language: "${language.slice(0, 5).join('", "')}".`);
    }

    if (momentToRef) {
      lines.push(`A past moment worth acknowledging if relevant: "${momentToRef.content}" (context: ${momentToRef.context}).`);
    }

    if ((mem.intimacyLevel || 0) >= 3) {
      lines.push(`This is a returning person. You have history with them. Let that inform how you hold them.`);
    }

    return lines.join("\n");
  } catch {
    return "";
  }
}

// ── Select a key moment to reference ─────────────────────────────────

export async function selectMomentToReference(
  userId: string,
  guideId: string
): Promise<{ content: string; context: string } | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    // Prefer unreferenced high/peak intensity moments
    const moments = await db
      .select()
      .from(schema.codexGuideKeyMoments)
      .where(
        and(
          eq(schema.codexGuideKeyMoments.userId, userId),
          eq(schema.codexGuideKeyMoments.guideId, guideId)
        )
      )
      .orderBy(
        desc(schema.codexGuideKeyMoments.emotionalIntensity),
        desc(schema.codexGuideKeyMoments.createdAt)
      )
      .limit(10);

    if (moments.length === 0) return null;

    // Prefer unreferenced moments
    const unreferenced = moments.filter(m => (m.referenced || 0) === 0);
    const candidate = unreferenced.length > 0 ? unreferenced[0] : moments[0];

    // Mark as referenced
    await db.update(schema.codexGuideKeyMoments).set({
      referenced: (candidate.referenced || 0) + 1,
      lastReferencedAt: new Date(),
    }).where(eq(schema.codexGuideKeyMoments.id, candidate.id));

    return { content: candidate.content, context: candidate.context };
  } catch {
    return null;
  }
}

// ── Calculate intimacy level 0-10 ─────────────────────────────────────

export function calculateIntimacyLevel(memory: schema.CodexGuideMemoryRecord): number {
  const exchanges = memory.totalExchanges || 0;
  const sessions = memory.totalSessions || 0;
  const themes: string[] = tryParse(memory.recurringThemes, []);

  // Heuristic scoring
  let score = 0;

  // Exchanges contribution (0-4 points)
  if (exchanges >= 50) score += 4;
  else if (exchanges >= 20) score += 3;
  else if (exchanges >= 10) score += 2;
  else if (exchanges >= 3) score += 1;

  // Sessions contribution (0-3 points)
  if (sessions >= 10) score += 3;
  else if (sessions >= 5) score += 2;
  else if (sessions >= 2) score += 1;

  // Recurring themes depth (0-3 points)
  if (themes.length >= 10) score += 3;
  else if (themes.length >= 5) score += 2;
  else if (themes.length >= 2) score += 1;

  return Math.min(10, score);
}

// ── Increment session count ────────────────────────────────────────────

export async function incrementGuideSession(userId: string, guideId: string): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    const existing = await db
      .select()
      .from(schema.codexGuideMemory)
      .where(
        and(
          eq(schema.codexGuideMemory.userId, userId),
          eq(schema.codexGuideMemory.guideId, guideId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.codexGuideMemory).values({
        id: nanoid(),
        userId,
        guideId,
        intimacyLevel: 0,
        totalSessions: 1,
        totalExchanges: 0,
        lastInteractionAt: new Date(),
      });
    } else {
      await db.update(schema.codexGuideMemory).set({
        totalSessions: (existing[0].totalSessions || 0) + 1,
        lastInteractionAt: new Date(),
      }).where(eq(schema.codexGuideMemory.id, existing[0].id));
    }
  } catch {
    // Non-fatal
  }
}

// ── Helper ─────────────────────────────────────────────────────────────

function tryParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}
