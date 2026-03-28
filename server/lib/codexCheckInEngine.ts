/**
 * CHECK-IN RITUAL SYSTEM — Phase 5
 * ============================================================
 * Generates personalized daily/weekly ritual prompts and processes
 * responses to extract patterns and track growth over time.
 *
 * Key functions:
 *   generateCheckInPrompts  — returns 3-5 personalized questions
 *   processCheckIn          — extracts patterns, updates tracking, checks scroll unlock
 *   getCheckInPatterns      — aggregated pattern trends for the user
 */

import { ensureGeminiFromDatabase, getGeminiClient } from "../aiService";
import { getDb } from "../db";
import * as schema from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";

// ── Types ──────────────────────────────────────────────────────────────

export interface CheckInQuestion {
  id: string;
  text: string;
  type: "universal" | "archetype_specific";
  archetypeTarget?: string;
}

export interface CheckInResponse {
  questionId: string;
  response: string;
}

// ── Universal questions always included ───────────────────────────────

const UNIVERSAL_QUESTIONS: CheckInQuestion[] = [
  { id: "abandon", text: "Where did you abandon yourself today?", type: "universal" },
  { id: "choose", text: "Where did you choose yourself?", type: "universal" },
  { id: "truth", text: "What truth did you hold back?", type: "universal" },
];

// ── Archetype-specific question pools ─────────────────────────────────

const ARCHETYPE_QUESTIONS: Record<string, CheckInQuestion[]> = {
  "The Silent Flame": [
    { id: "sf_voice", text: "What did you want to say today that you swallowed instead?", type: "archetype_specific", archetypeTarget: "The Silent Flame" },
    { id: "sf_space", text: "Whose comfort did you protect at the cost of your own expression?", type: "archetype_specific", archetypeTarget: "The Silent Flame" },
    { id: "sf_moment", text: "Was there a moment today when your silence felt like safety or like loss?", type: "archetype_specific", archetypeTarget: "The Silent Flame" },
  ],
  "The Pleaser Flame": [
    { id: "pl_yes", text: "What did you agree to today that cost you something?", type: "archetype_specific", archetypeTarget: "The Pleaser Flame" },
    { id: "pl_no", text: "Was there a moment you wanted to say no — and what happened?", type: "archetype_specific", archetypeTarget: "The Pleaser Flame" },
    { id: "pl_need", text: "What did you need today that you didn't ask for?", type: "archetype_specific", archetypeTarget: "The Pleaser Flame" },
  ],
  "The Burdened Flame": [
    { id: "bf_carry", text: "What were you carrying today that wasn't yours to carry?", type: "archetype_specific", archetypeTarget: "The Burdened Flame" },
    { id: "bf_help", text: "Did you let anyone help you today — or did you refuse it?", type: "archetype_specific", archetypeTarget: "The Burdened Flame" },
    { id: "bf_rest", text: "What would rest have looked like today, and why didn't it happen?", type: "archetype_specific", archetypeTarget: "The Burdened Flame" },
  ],
  "The Forsaken Child": [
    { id: "fc_belong", text: "Where did you feel like you didn't belong today?", type: "archetype_specific", archetypeTarget: "The Forsaken Child" },
    { id: "fc_reach", text: "Did you reach out for connection today — or pull away?", type: "archetype_specific", archetypeTarget: "The Forsaken Child" },
    { id: "fc_safe", text: "Was there a moment today you felt genuinely safe? What made it that way?", type: "archetype_specific", archetypeTarget: "The Forsaken Child" },
  ],
  "The Guarded Mystic": [
    { id: "gm_reveal", text: "What did you keep hidden about yourself today?", type: "archetype_specific", archetypeTarget: "The Guarded Mystic" },
    { id: "gm_trust", text: "Was there a moment you could have trusted someone — did you?", type: "archetype_specific", archetypeTarget: "The Guarded Mystic" },
    { id: "gm_edge", text: "Where did you step to the edge of vulnerability and step back?", type: "archetype_specific", archetypeTarget: "The Guarded Mystic" },
  ],
  "The Shielded One": [
    { id: "sh_armor", text: "What was your armor today — anger, humor, competence, distance?", type: "archetype_specific", archetypeTarget: "The Shielded One" },
    { id: "sh_soft", text: "Was there a moment when the shield wasn't needed but you kept it up anyway?", type: "archetype_specific", archetypeTarget: "The Shielded One" },
    { id: "sh_wound", text: "What were you protecting today?", type: "archetype_specific", archetypeTarget: "The Shielded One" },
  ],
  "The Drifting One": [
    { id: "dr_anchor", text: "What anchored you today — or what should have but didn't?", type: "archetype_specific", archetypeTarget: "The Drifting One" },
    { id: "dr_commit", text: "Was there a commitment you avoided or deferred today?", type: "archetype_specific", archetypeTarget: "The Drifting One" },
    { id: "dr_present", text: "When were you most present today — and when did you drift?", type: "archetype_specific", archetypeTarget: "The Drifting One" },
  ],
  "The Rational Pilgrim": [
    { id: "rp_feel", text: "What feeling did you intellectualize today instead of feeling it?", type: "archetype_specific", archetypeTarget: "The Rational Pilgrim" },
    { id: "rp_body", text: "What was your body trying to tell you today that your mind overrode?", type: "archetype_specific", archetypeTarget: "The Rational Pilgrim" },
    { id: "rp_unknown", text: "Where did you meet something you couldn't explain — and what did you do with it?", type: "archetype_specific", archetypeTarget: "The Rational Pilgrim" },
  ],
};

// ── Generate personalized check-in prompts ────────────────────────────

export async function generateCheckInPrompts(
  userId: string,
  archetype: string,
  recentPatterns: string[]
): Promise<CheckInQuestion[]> {
  // Always start with universal questions
  const questions: CheckInQuestion[] = [...UNIVERSAL_QUESTIONS];

  // Add 1-2 archetype-specific questions if available
  const archetypePool = ARCHETYPE_QUESTIONS[archetype] || [];
  if (archetypePool.length > 0) {
    // Pick one random archetype question to keep it varied
    const pick = archetypePool[Math.floor(Math.random() * archetypePool.length)];
    questions.push(pick);
  }

  // If there are recent patterns, optionally add an AI-generated question
  if (recentPatterns.length > 0 && questions.length < 5) {
    try {
      await ensureGeminiFromDatabase();
      const genAI = getGeminiClient();
      if (genAI) {
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          generationConfig: { maxOutputTokens: 150, temperature: 0.9 },
        });

        const prompt = `You are writing one check-in question for a person whose recent patterns include: ${recentPatterns.slice(0, 3).join(", ")}.

Write one short, direct introspective question (1 sentence, no more than 15 words) that will invite them to look at one of these patterns honestly. Begin with "Where", "What", "When", or "Did you". No preamble. Return the question text only.`;

        const result = await model.generateContent(prompt);
        const dynamicQ = result.response.text().trim().replace(/^["']|["']$/g, "");
        if (dynamicQ) {
          questions.push({
            id: `dynamic_${nanoid(6)}`,
            text: dynamicQ,
            type: "archetype_specific",
            archetypeTarget: archetype,
          });
        }
      }
    } catch {
      // Non-fatal — universal + archetype questions are enough
    }
  }

  return questions.slice(0, 5);
}

// ── Process a completed check-in ──────────────────────────────────────

export async function processCheckIn(
  userId: string,
  checkInId: string,
  responses: CheckInResponse[]
): Promise<{ patternsExtracted: string[]; scrollUnlockTriggered: boolean }> {
  try {
    const db = await getDb();
    if (!db) return { patternsExtracted: [], scrollUnlockTriggered: false };

    // Combine all responses for analysis
    const responseText = responses
      .map(r => `Q: ${r.questionId}\nA: ${r.response}`)
      .join("\n\n");

    let patternsExtracted: string[] = [];

    try {
      await ensureGeminiFromDatabase();
      const genAI = getGeminiClient();
      if (genAI) {
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          generationConfig: { maxOutputTokens: 300, temperature: 0.8 },
        });

        const prompt = `Read these check-in responses and extract patterns.

RESPONSES:
${responseText}

Return raw JSON only (no markdown):
{
  "patterns": ["pattern 1", "pattern 2", "pattern 3"]
}

Patterns should be concise (under 60 characters each), name specific behaviors or tendencies observed in the responses. 2-4 patterns maximum.`;

        const result = await model.generateContent(prompt);
        const raw = result.response.text().trim();
        const parsed = JSON.parse(raw);
        patternsExtracted = parsed.patterns || [];
      }
    } catch {
      // Non-fatal — save check-in without patterns
    }

    // Update the check-in record
    await db.update(schema.codexCheckIns).set({
      responsesData: JSON.stringify(responses),
      patternsExtracted: JSON.stringify(patternsExtracted),
      completedAt: new Date(),
    }).where(eq(schema.codexCheckIns.id, checkInId));

    // Update pattern tracking table
    for (const pattern of patternsExtracted) {
      const existing = await db
        .select()
        .from(schema.codexCheckInPatterns)
        .where(
          and(
            eq(schema.codexCheckInPatterns.userId, userId),
            eq(schema.codexCheckInPatterns.pattern, pattern)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        const prev = existing[0];
        const newFreq = (prev.frequency || 1) + 1;
        await db.update(schema.codexCheckInPatterns).set({
          frequency: newFreq,
          trend: newFreq >= 5 ? "rising" : "stable",
          lastDetectedAt: new Date(),
        }).where(eq(schema.codexCheckInPatterns.id, prev.id));
      } else {
        await db.insert(schema.codexCheckInPatterns).values({
          id: nanoid(),
          userId,
          pattern,
          frequency: 1,
          trend: "new",
        });
      }
    }

    // Check for scroll unlock conditions (3 check-ins completed)
    const completedCount = await db
      .select()
      .from(schema.codexCheckIns)
      .where(
        and(
          eq(schema.codexCheckIns.userId, userId),
          // completedAt is not null — use a simple length check
        )
      );

    const completedCheckIns = completedCount.filter(c => c.completedAt !== null);
    const scrollUnlockTriggered = completedCheckIns.length % 3 === 0 && completedCheckIns.length > 0;

    return { patternsExtracted, scrollUnlockTriggered };
  } catch {
    return { patternsExtracted: [], scrollUnlockTriggered: false };
  }
}

// ── Get aggregated pattern trends ─────────────────────────────────────

export async function getCheckInPatterns(
  userId: string
): Promise<schema.CodexCheckInPattern[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    return await db
      .select()
      .from(schema.codexCheckInPatterns)
      .where(eq(schema.codexCheckInPatterns.userId, userId))
      .orderBy(desc(schema.codexCheckInPatterns.frequency));
  } catch {
    return [];
  }
}
