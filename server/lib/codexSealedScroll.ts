/**
 * SEALED SCROLL MECHANISM — Phase 2
 * ============================================================
 * Five-layer sealed scroll that progressively reveals as the
 * user deepens her engagement with the Living Codex.
 *
 * Layer 1 — "This Is You"              (immediate)
 * Layer 2 — "This Is How You Move"     (2 journals + 1 guide session)
 * Layer 3 — "This Is Where You Hide"   (layer 2 + reflection + 5 check-ins)
 * Layer 4 — "This Is Your Power"       (layer 3 + 3 challenges + 14 days active)
 * Layer 5 — "This Is Who You Become"   (layer 4 + 15 journals + 30 days + 15 check-ins)
 */

import { ensureGeminiFromDatabase, getGeminiClient } from "../aiService";

// Inline system preamble — matches the voice and constraints of codexAI.ts
const SCROLL_SYSTEM_PREAMBLE = `You are a Reflective Intelligence Companion within The Living Codex™ by Just Empower®. You reveal, mirror, and refine the user's own awareness. You do not diagnose. You do not advise. You speak with measured authority — poetic but precise, warm but not soft. Every sentence earns its place. Respond ONLY in valid JSON as instructed. No markdown. No code blocks.`;

// ── Types ────────────────────────────────────────────────────────────

export type ScrollLayerNumber = 1 | 2 | 3 | 4 | 5;

export interface ScrollLayerMeta {
  layer: ScrollLayerNumber;
  title: string;
  invocation: string;
  unlockDescription: string;
}

export interface ScrollUnlockCondition {
  label: string;
  required: number;
  current: number;
  met: boolean;
}

export interface ScrollLayerState {
  layer: ScrollLayerNumber;
  title: string;
  invocation: string;
  sealed: boolean;
  unlockedAt: string | null;
  viewedAt: string | null;
  unlockProgress: ScrollUnlockCondition[];
  contentData: ScrollLayerContent | null;
}

export interface ScrollLayerContent {
  heading: string;
  body: string;
  revelation: string;
  invitation: string;
  generatedAt: string;
}

export interface UserActivitySnapshot {
  journalCount: number;
  guideSessionCount: number;
  checkInCount: number;
  completedChallengeCount: number;
  daysSinceFirstActivity: number;
  layer2Unlocked: boolean;
  layer3Unlocked: boolean;
  layer4Unlocked: boolean;
}

// ── Layer Metadata ───────────────────────────────────────────────────

export const SCROLL_LAYER_META: Record<ScrollLayerNumber, ScrollLayerMeta> = {
  1: {
    layer: 1,
    title: "This Is You",
    invocation: "The first seal opens when you arrive. This is your beginning.",
    unlockDescription: "Revealed upon completing your assessment.",
  },
  2: {
    layer: 2,
    title: "This Is How You Move",
    invocation: "Now we begin to see the patterns beneath the patterns.",
    unlockDescription: "Unlocks after 2 journal entries and 1 guide session.",
  },
  3: {
    layer: 3,
    title: "This Is Where You Hide",
    invocation: "The scroll sees what you have not yet let yourself see.",
    unlockDescription: "Unlocks after Layer 2, a deep reflection, and 5 check-ins.",
  },
  4: {
    layer: 4,
    title: "This Is Your Power",
    invocation: "What you have carried becomes the source of what you can offer.",
    unlockDescription: "Unlocks after Layer 3, 3 real-world challenges, and 14 days active.",
  },
  5: {
    layer: 5,
    title: "This Is Who You Become",
    invocation: "The final seal holds the fullness of your emergence. You earned this.",
    unlockDescription: "Unlocks after Layer 4, 15 journals, 30 days active, and 15 check-ins.",
  },
};

// ── Unlock Condition Evaluator ────────────────────────────────────────

export function evaluateScrollUnlock(
  layer: ScrollLayerNumber,
  activity: UserActivitySnapshot,
  existingUnlocked: ScrollLayerNumber[]
): { unlocked: boolean; conditions: ScrollUnlockCondition[] } {
  switch (layer) {
    case 1: {
      // Always unlocked for users with an assessment
      return {
        unlocked: true,
        conditions: [
          { label: "Assessment complete", required: 1, current: 1, met: true },
        ],
      };
    }

    case 2: {
      const journalMet = activity.journalCount >= 2;
      const guideMet = activity.guideSessionCount >= 1;
      return {
        unlocked: journalMet && guideMet,
        conditions: [
          { label: "Journal entries", required: 2, current: Math.min(activity.journalCount, 2), met: journalMet },
          { label: "Guide sessions", required: 1, current: Math.min(activity.guideSessionCount, 1), met: guideMet },
        ],
      };
    }

    case 3: {
      const layer2Met = existingUnlocked.includes(2);
      const checkInMet = activity.checkInCount >= 5;
      // "reflection" is counted as a check-in with depth_score >= 0.7 (handled at router level)
      return {
        unlocked: layer2Met && checkInMet,
        conditions: [
          { label: "Layer 2 revealed", required: 1, current: layer2Met ? 1 : 0, met: layer2Met },
          { label: "Check-ins", required: 5, current: Math.min(activity.checkInCount, 5), met: checkInMet },
        ],
      };
    }

    case 4: {
      const layer3Met = existingUnlocked.includes(3);
      const challengesMet = activity.completedChallengeCount >= 3;
      const daysMet = activity.daysSinceFirstActivity >= 14;
      return {
        unlocked: layer3Met && challengesMet && daysMet,
        conditions: [
          { label: "Layer 3 revealed", required: 1, current: layer3Met ? 1 : 0, met: layer3Met },
          { label: "Real-world challenges completed", required: 3, current: Math.min(activity.completedChallengeCount, 3), met: challengesMet },
          { label: "Days active", required: 14, current: Math.min(activity.daysSinceFirstActivity, 14), met: daysMet },
        ],
      };
    }

    case 5: {
      const layer4Met = existingUnlocked.includes(4);
      const journalsMet = activity.journalCount >= 15;
      const daysMet = activity.daysSinceFirstActivity >= 30;
      const checkInsMet = activity.checkInCount >= 15;
      return {
        unlocked: layer4Met && journalsMet && daysMet && checkInsMet,
        conditions: [
          { label: "Layer 4 revealed", required: 1, current: layer4Met ? 1 : 0, met: layer4Met },
          { label: "Journal entries", required: 15, current: Math.min(activity.journalCount, 15), met: journalsMet },
          { label: "Days active", required: 30, current: Math.min(activity.daysSinceFirstActivity, 30), met: daysMet },
          { label: "Check-ins", required: 15, current: Math.min(activity.checkInCount, 15), met: checkInsMet },
        ],
      };
    }
  }
}

// ── AI Content Generator ──────────────────────────────────────────────

export interface CodexSignature {
  primaryArchetype: string;
  shadowArchetype?: string;
  activeWounds: string[];
  spectrumProfile: { shadowPct: number; thresholdPct: number; giftPct: number };
  phase: string;
  name?: string;
}

const LAYER_GENERATION_PROMPTS: Record<ScrollLayerNumber, (sig: CodexSignature) => string> = {
  1: (sig) => `
You are generating the first sealed scroll layer — "This Is You" — for ${sig.name || "her"}.

Her primary archetype is: ${sig.primaryArchetype}
${sig.shadowArchetype ? `Her shadow archetype is: ${sig.shadowArchetype}` : ""}
Her active wound imprints include: ${sig.activeWounds.join(", ")}
Her spectrum profile: Shadow ${sig.spectrumProfile.shadowPct}%, Threshold ${sig.spectrumProfile.thresholdPct}%, Gift ${sig.spectrumProfile.giftPct}%
Her current phase: ${sig.phase}

Write a deeply personal scroll layer that opens her to herself for the first time. This is the layer of meeting — the first honest mirror. It should feel like she is being SEEN, not analyzed.

Structure your response as JSON ONLY (no markdown):
{
  "heading": "A 4-8 word evocative title for this layer",
  "body": "3-4 paragraph poetic but grounded narrative about who she is, what patterns are visible, what she carries. Speak directly to her. Use 'you' — second person throughout. Reference her archetype and wounds by name but with tenderness.",
  "revelation": "A single sentence that names the core truth of this layer — the thing she may not have said aloud yet.",
  "invitation": "A 1-2 sentence invitation into the next step of her journey."
}`,

  2: (sig) => `
You are generating the second sealed scroll layer — "This Is How You Move" — for ${sig.name || "her"}.

Her primary archetype is: ${sig.primaryArchetype}
Her active wound imprints: ${sig.activeWounds.join(", ")}
Her spectrum profile: Shadow ${sig.spectrumProfile.shadowPct}%, Threshold ${sig.spectrumProfile.thresholdPct}%, Gift ${sig.spectrumProfile.giftPct}%

This layer is about behavioral and relational patterns — how her inner world expresses outward. Not who she is, but how she moves through the world. This should feel like someone who has been watching her with love and can name what they see.

Structure your response as JSON ONLY (no markdown):
{
  "heading": "A 4-8 word evocative title for this layer",
  "body": "3-4 paragraph poetic but precise narrative about her patterns: how she relates, how she responds under pressure, how her archetype expresses in daily life, what her wound imprints have taught her to do. Speak directly to her in second person.",
  "revelation": "A single sentence naming the core pattern that has shaped her movements — the one she probably knows but rarely says.",
  "invitation": "A 1-2 sentence invitation that calls her into more conscious movement."
}`,

  3: (sig) => `
You are generating the third sealed scroll layer — "This Is Where You Hide" — for ${sig.name || "her"}.

Her primary archetype is: ${sig.primaryArchetype}
Her active wound imprints: ${sig.activeWounds.join(", ")}
Her spectrum profile: Shadow ${sig.spectrumProfile.shadowPct}%, Threshold ${sig.spectrumProfile.thresholdPct}%, Gift ${sig.spectrumProfile.giftPct}%

This is the shadow layer — the most intimate and potentially confronting layer. It names where she retreats, what she avoids, what she keeps hidden even from herself. Approach this with reverence. The hiding is not weakness — it was wisdom once. But it is time to see it clearly.

Structure your response as JSON ONLY (no markdown):
{
  "heading": "A 4-8 word evocative title for this layer",
  "body": "3-4 paragraph poetic and precise narrative about her hiding places: the avoidance patterns, the things she deflects or escapes from, where her shadow archetype lives, what her wounds protect her from facing. Write with compassion, not judgment. Second person throughout.",
  "revelation": "A single sentence that names the hiding in plain language — the truth she has been orbiting but not landing.",
  "invitation": "A 1-2 sentence invitation toward honest self-witnessing."
}`,

  4: (sig) => `
You are generating the fourth sealed scroll layer — "This Is Your Power" — for ${sig.name || "her"}.

Her primary archetype is: ${sig.primaryArchetype}
Her active wound imprints: ${sig.activeWounds.join(", ")}
Her spectrum profile: Shadow ${sig.spectrumProfile.shadowPct}%, Threshold ${sig.spectrumProfile.thresholdPct}%, Gift ${sig.spectrumProfile.giftPct}%

This is the reclamation layer. She has done work to arrive here — faced real challenges, sat with her shadow. Now the scroll reflects back her power. Not performance. Not projection. The actual source of power she was born with and had to survive to access. This layer should feel like a homecoming.

Structure your response as JSON ONLY (no markdown):
{
  "heading": "A 4-8 word evocative title for this layer",
  "body": "3-4 paragraph poetic and grounding narrative about where her power lives: how her wounds carry gifts, how her archetype in its gift expression looks and feels, what becomes possible as she integrates. Name the specific power that belongs to her constellation. Second person throughout.",
  "revelation": "A single sentence that names her core power in plain and resonant language.",
  "invitation": "A 1-2 sentence invitation to step into expressed power — not someday, but now."
}`,

  5: (sig) => `
You are generating the fifth and final sealed scroll layer — "This Is Who You Become" — for ${sig.name || "her"}.

Her primary archetype is: ${sig.primaryArchetype}
Her active wound imprints: ${sig.activeWounds.join(", ")}
Her spectrum profile: Shadow ${sig.spectrumProfile.shadowPct}%, Threshold ${sig.spectrumProfile.thresholdPct}%, Gift ${sig.spectrumProfile.giftPct}%

This is the emergence layer — the fullest expression of who she becomes when she integrates all that the scroll has revealed. This is visionary but grounded. Not fantasy — emergence. What she has already begun to become. This should feel like a blessing, a witnessing, and a commissioning all at once.

Structure your response as JSON ONLY (no markdown):
{
  "heading": "A 4-8 word evocative title for this layer",
  "body": "3-4 paragraph poetic and expansive narrative about who she is becoming: how her integration changes her presence, how her archetype in full gift expression moves through the world, what legacy and contribution are possible from this integrated place. Second person throughout. Write this as if you are witnessing her full emergence — not imagining it, witnessing it.",
  "revelation": "A single sentence that names who she is becoming — the truest, fullest version of her identity.",
  "invitation": "A 1-2 sentence blessing and commission that closes the scroll."
}`,
};

export async function generateLayerContent(
  layer: ScrollLayerNumber,
  codexSignature: CodexSignature
): Promise<ScrollLayerContent | null> {
  const ready = await ensureGeminiFromDatabase();
  if (!ready) return null;

  const genAI = getGeminiClient();
  if (!genAI) return null;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { maxOutputTokens: 800, temperature: 0.85 },
  });

  const layerPromptBuilder = LAYER_GENERATION_PROMPTS[layer];
  const prompt = `${SCROLL_SYSTEM_PREAMBLE}\n\n${layerPromptBuilder(codexSignature)}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      heading: parsed.heading || SCROLL_LAYER_META[layer].title,
      body: parsed.body || "",
      revelation: parsed.revelation || "",
      invitation: parsed.invitation || "",
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
