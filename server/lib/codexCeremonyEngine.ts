/**
 * CEREMONY & AI PROMPT ENGINE — Living Codex Community Circles
 * ============================================================================
 * Generates weekly discussion prompts for archetype circles and will
 * eventually facilitate full ceremonies (opening, sharing, witnessing,
 * reflection, closing).
 *
 * Q1 scope:
 *   - generateWeeklyCirclePrompt  — FULLY IMPLEMENTED (Gemini-powered)
 *   - generateCollectiveMirror    — STUB (returns placeholder)
 *   - generateCeremonyPromptSequence — STUB (returns placeholder)
 */

import { ensureGeminiFromDatabase, getGeminiClient } from "../aiService";

// ============================================================================
// Types
// ============================================================================

export interface CircleContext {
  circleId: string;
  circleType: string;
  name: string;
  archetypeFilter?: string | null;
  woundFilter?: string | null;
  phaseFilter?: number | null;
  memberCount: number;
  recentThemes?: string[];
}

export interface PromptStep {
  stepNumber: number;
  promptText: string;
  durationMinutes: number;
  isAnonymous: boolean;
  type: "opening" | "sharing" | "witnessing" | "reflection" | "closing";
}

export interface CollectiveMirrorSynthesis {
  period: string;
  circleName: string;
  memberCount: number;
  activeCount: number;
  dominantThemes: string[];
  collectiveSpectrum: {
    shadow: number;
    threshold: number;
    gift: number;
    movement: string;
  };
  emergingEdge: string;
  invitation: string;
}

// ============================================================================
// Archetype Flavor Map
// ============================================================================

const ARCHETYPE_FLAVOR: Record<string, string> = {
  "Silent Flame":
    "themes of being unseen, burning beneath the surface, the courage of voice",
  "Forsaken Child":
    "themes of conditional love, earning worth, the child who still waits",
  "Pleaser Flame":
    "themes of smallness, safety through service, reclaiming space",
  "Burdened Flame":
    "themes of carrying others' weight, mistaking burden for purpose",
  "Drifting One":
    "themes of rootlessness, searching, the anchor within",
  "Guarded Mystic":
    "themes of knowing, doubting the knowing, trusting intuition",
  "Spirit-Dimmed":
    "themes of forgotten fire, remembering brightness, permission to shine",
  "Fault-Bearer":
    "themes of absorbing blame, turning wounds inward, externalizing truth",
  "Shielded One":
    "themes of walls, finding the door, vulnerability as strength",
  "Rational Pilgrim":
    "themes of living in the mind, trusting the body, embodiment",
  "Living Flame":
    "themes of active emergence, becoming, aliveness",
  "Rooted Flame":
    "themes of homecoming, tending fire from the ground, stability",
};

// ============================================================================
// Fallback Prompts (when Gemini is unavailable)
// ============================================================================

const FALLBACK_ARCHETYPE =
  "This week, we invite you to share: What is your flame asking of you right now? Speak from the body, not the mind.";

const FALLBACK_GENERAL =
  "What truth is sitting in your chest this week? Name it here \u2014 even if it\u2019s only three words.";

// ============================================================================
// Weekly Circle Prompt Generation — FULLY IMPLEMENTED
// ============================================================================

/**
 * Generates a weekly discussion prompt for a community circle.
 *
 * For archetype circles the prompt is tailored to the archetype's lived
 * experience. For wound-kinship, phase, and general circles the prompt
 * is flavored accordingly. Falls back to a hardcoded prompt when Gemini
 * is unavailable.
 */
export async function generateWeeklyCirclePrompt(
  circle: CircleContext,
): Promise<string> {
  const systemPrompt = buildCircleSystemPrompt(circle);

  try {
    await ensureGeminiFromDatabase();
    const genAI = getGeminiClient();
    if (!genAI) {
      return pickFallback(circle);
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { maxOutputTokens: 300, temperature: 0.95 },
    });

    const result = await model.generateContent(systemPrompt);
    const text = result.response.text().trim();

    if (!text) {
      return pickFallback(circle);
    }

    return text;
  } catch {
    // Non-fatal — return a safe fallback prompt
    return pickFallback(circle);
  }
}

// ============================================================================
// Collective Mirror — STUB (Q1)
// ============================================================================

/**
 * Synthesizes collective patterns from a circle's messages over a period.
 *
 * **Q1 stub** — returns a placeholder synthesis. Full AI-driven collective
 * mirror analysis will be implemented in a future update.
 */
export async function generateCollectiveMirror(
  circleContext: CircleContext,
  messages: { content: string; authorId: string; createdAt: string }[],
  periodLabel: string,
): Promise<CollectiveMirrorSynthesis> {
  return {
    period: periodLabel,
    circleName: circleContext.name,
    memberCount: circleContext.memberCount,
    activeCount:
      messages.length > 0
        ? new Set(messages.map((m) => m.authorId)).size
        : 0,
    dominantThemes: ["(collective mirror coming soon)"],
    collectiveSpectrum: {
      shadow: 0,
      threshold: 0,
      gift: 0,
      movement: "Not yet computed",
    },
    emergingEdge:
      "The collective mirror will synthesize circle patterns in a future update.",
    invitation:
      "For now, simply be present with each other. The mirror is forming.",
  };
}

// ============================================================================
// Ceremony Prompt Sequence — STUB (Q1)
// ============================================================================

/**
 * Generates a multi-step ceremony prompt sequence for a circle gathering.
 *
 * **Q1 stub** — returns a simple 3-step placeholder ceremony (opening,
 * sharing, closing). Full AI-generated ceremony flows with witnessing
 * and reflection rounds will be implemented in a future update.
 */
export async function generateCeremonyPromptSequence(
  _ceremonyType: string,
  _context: CircleContext,
): Promise<PromptStep[]> {
  return [
    {
      stepNumber: 1,
      promptText: "Take three breaths. Arrive here.",
      durationMinutes: 2,
      isAnonymous: false,
      type: "opening",
    },
    {
      stepNumber: 2,
      promptText: "Share one thing you are carrying this week.",
      durationMinutes: 5,
      isAnonymous: false,
      type: "sharing",
    },
    {
      stepNumber: 3,
      promptText:
        "Close your eyes. Hold what was shared. Release it.",
      durationMinutes: 2,
      isAnonymous: false,
      type: "closing",
    },
  ];
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Builds the Gemini system prompt based on circle type and filters.
 */
function buildCircleSystemPrompt(circle: CircleContext): string {
  const recentClause =
    circle.recentThemes && circle.recentThemes.length > 0
      ? `\nRecent themes discussed: ${circle.recentThemes.join(", ")}. Avoid repeating these.`
      : "";

  // --- Archetype circle ---
  if (circle.circleType === "archetype" && circle.archetypeFilter) {
    const flavor =
      ARCHETYPE_FLAVOR[circle.archetypeFilter] ||
      "themes of self-discovery, truth, and embodiment";

    return `You are a sacred guide for the Living Codex community. You are generating a weekly discussion prompt for "${circle.name}".

This is a circle of women whose primary archetype is the ${circle.archetypeFilter}. This archetype carries ${flavor}.

Generate a single, evocative question or invitation for this week's circle discussion. The prompt should:
- Be 2-4 sentences maximum
- Speak directly to the lived experience of this archetype
- Invite embodied, honest sharing (not intellectual analysis)
- Never use clinical or diagnostic language
- Never give advice \u2014 only open doors
- Use poetic but accessible language
- End with a clear invitation to share
${recentClause}`;
  }

  // --- Wound kinship circle ---
  if (circle.circleType === "wound_kinship" && circle.woundFilter) {
    return `You are a sacred guide for the Living Codex community. You are generating a weekly discussion prompt for "${circle.name}".

This is a wound-kinship circle for women who share the wound code "${circle.woundFilter}". The wound is not something to fix \u2014 it is a landscape to witness.

Generate a single, evocative question or invitation for this week's circle discussion. The prompt should:
- Be 2-4 sentences maximum
- Speak to the shared wound without retraumatizing
- Invite embodied, honest sharing (not intellectual analysis)
- Never use clinical or diagnostic language
- Never give advice \u2014 only open doors
- Use poetic but accessible language
- End with a clear invitation to share
${recentClause}`;
  }

  // --- Phase circle ---
  if (circle.circleType === "phase" && circle.phaseFilter != null) {
    return `You are a sacred guide for the Living Codex community. You are generating a weekly discussion prompt for "${circle.name}".

This is a journey-phase circle for women in Phase ${circle.phaseFilter} of their Living Codex journey. Meet them where they are.

Generate a single, evocative question or invitation for this week's circle discussion. The prompt should:
- Be 2-4 sentences maximum
- Speak to the experience of this phase of growth
- Invite embodied, honest sharing (not intellectual analysis)
- Never use clinical or diagnostic language
- Never give advice \u2014 only open doors
- Use poetic but accessible language
- End with a clear invitation to share
${recentClause}`;
  }

  // --- General / fallback ---
  return `You are a sacred guide for the Living Codex community. You are generating a weekly discussion prompt for "${circle.name}".

This is a general circle open to all women on their Living Codex journey, regardless of archetype or phase.

Generate a single, evocative question or invitation for this week's circle discussion. The prompt should:
- Be 2-4 sentences maximum
- Speak to the universal human experience of growth and self-discovery
- Invite embodied, honest sharing (not intellectual analysis)
- Never use clinical or diagnostic language
- Never give advice \u2014 only open doors
- Use poetic but accessible language
- End with a clear invitation to share
${recentClause}`;
}

/**
 * Returns the appropriate hardcoded fallback prompt for a circle type.
 */
function pickFallback(circle: CircleContext): string {
  if (circle.circleType === "archetype" && circle.archetypeFilter) {
    return FALLBACK_ARCHETYPE;
  }
  return FALLBACK_GENERAL;
}
