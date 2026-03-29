/**
 * COMMUNITY MODERATION ENGINE
 * ============================
 * Pattern-based content classification, trust scoring, and moderation
 * logging for the Living Codex community system.
 *
 * Three-layer moderation:
 *  1. Crisis detection (reuses escalation engine patterns)
 *  2. Community boundary checks (advice-giving, diagnosing, promotion, bypassing)
 *  3. Trust-weighted decision (low-trust users get stricter thresholds)
 */

import { nanoid } from "nanoid";
import { eq, and, sql } from "drizzle-orm";
import {
  codexTrustEvents,
  codexModerationLog,
  codexCircleMembers,
} from "../../drizzle/schema";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ModerationStatus = "approved" | "flagged" | "removed";

export type ViolationCategory =
  | "crisis"
  | "advice_giving"
  | "diagnosing"
  | "promotion"
  | "spiritual_bypassing"
  | "boundary_crossing"
  | "trauma_dumping"
  | "clean";

export interface ModerationResult {
  status: ModerationStatus;
  confidence: number; // 0-1
  reasons: string[];
  category: ViolationCategory;
}

export interface AuthorContext {
  userId: string;
  trustScore: number;
  circleId: string;
  circleType?: string;
  woundCodes?: string[];
}

// ============================================================================
// CRISIS DETECTION PATTERNS (subset from escalation engine)
// ============================================================================

interface CommunityPattern {
  pattern: RegExp;
  category: ViolationCategory;
  label: string;
  severity: "hard" | "soft"; // hard = always flag, soft = trust-weighted
}

const CRISIS_PATTERNS: CommunityPattern[] = [
  {
    pattern:
      /\b(want(?:ing)?\s+to\s+die|don'?t\s+want\s+to\s+(?:be\s+here|live|exist)|end(?:ing)?\s+(?:my|it\s+all)|sui[cs]id(?:e|al)|kill(?:ing)?\s+myself)\b/i,
    category: "crisis",
    label: "suicidal_ideation",
    severity: "hard",
  },
  {
    pattern:
      /\b(self[- ]?harm(?:ing)?|cut(?:ting)?\s+myself|burn(?:ing)?\s+myself|hurt(?:ing)?\s+myself\s+on\s+purpose)\b/i,
    category: "crisis",
    label: "self_harm",
    severity: "hard",
  },
  {
    pattern:
      /\b(going\s+to\s+(?:hurt|kill|harm)\s+(?:him|her|them|someone)|murder|homicid)/i,
    category: "crisis",
    label: "threat_to_others",
    severity: "hard",
  },
];

// ============================================================================
// COMMUNITY BOUNDARY PATTERNS
// ============================================================================

const ADVICE_PATTERNS: CommunityPattern[] = [
  {
    pattern:
      /\b(?:you\s+should|you\s+need\s+to|why\s+don'?t\s+you|have\s+you\s+tried|you\s+(?:just\s+)?(?:have|need)\s+to)\b/i,
    category: "advice_giving",
    label: "unsolicited_advice",
    severity: "soft",
  },
  {
    pattern:
      /\b(?:(?:if\s+I\s+were\s+you|my\s+advice\s+(?:is|would\s+be))|(?:the\s+best\s+thing\s+(?:to\s+do|you\s+can\s+do)\s+is))\b/i,
    category: "advice_giving",
    label: "directive_language",
    severity: "soft",
  },
];

const DIAGNOSING_PATTERNS: CommunityPattern[] = [
  {
    pattern:
      /\b(?:that\s+sounds?\s+like\s+(?:narcissis|borderline|bipolar|PTSD|depression|anxiety\s+disorder)|you\s+(?:might|probably|definitely)\s+have|that'?s\s+textbook)\b/i,
    category: "diagnosing",
    label: "amateur_diagnosis",
    severity: "soft",
  },
  {
    pattern:
      /\b(?:you\s+(?:are|seem)\s+(?:a\s+)?(?:narcissist|codependent|empath|sociopath)|(?:he|she|they)\s+(?:is|are)\s+(?:a\s+)?(?:narcissist|psychopath|sociopath))\b/i,
    category: "diagnosing",
    label: "labeling",
    severity: "soft",
  },
];

const PROMOTION_PATTERNS: CommunityPattern[] = [
  {
    pattern:
      /\b(?:DM\s+me\s+(?:for|about)|check\s+out\s+my|sign\s+up\s+(?:for|at)|use\s+(?:my|this)\s+(?:code|link)|(?:free|paid)\s+(?:workshop|webinar|course|coaching))\b/i,
    category: "promotion",
    label: "self_promotion",
    severity: "hard",
  },
  {
    pattern: /https?:\/\/\S+/i,
    category: "promotion",
    label: "external_link",
    severity: "soft",
  },
];

const SPIRITUAL_BYPASSING_PATTERNS: CommunityPattern[] = [
  {
    pattern:
      /\b(?:everything\s+happens?\s+for\s+a\s+reason|just\s+(?:stay\s+positive|be\s+grateful|forgive|let\s+(?:it\s+)?go)|it'?s?\s+(?:all\s+)?(?:meant\s+to\s+be|part\s+of\s+(?:the|God'?s?)\s+plan)|good\s+vibes\s+only)\b/i,
    category: "spiritual_bypassing",
    label: "bypassing_language",
    severity: "soft",
  },
];

const ALL_PATTERNS: CommunityPattern[] = [
  ...CRISIS_PATTERNS,
  ...ADVICE_PATTERNS,
  ...DIAGNOSING_PATTERNS,
  ...PROMOTION_PATTERNS,
  ...SPIRITUAL_BYPASSING_PATTERNS,
];

// ============================================================================
// CONTENT CLASSIFICATION
// ============================================================================

/**
 * Classifies community content through a 3-layer pipeline:
 * crisis detection, boundary checks, and trust-weighted decisions.
 */
export function classifyCommunityContent(
  content: string,
  context: AuthorContext
): ModerationResult {
  const trimmed = content.trim();
  if (!trimmed) {
    return { status: "approved", confidence: 1.0, reasons: [], category: "clean" };
  }

  const matches: { pattern: CommunityPattern; match: RegExpMatchArray }[] = [];

  for (const p of ALL_PATTERNS) {
    const m = trimmed.match(p.pattern);
    if (m) {
      matches.push({ pattern: p, match: m });
    }
  }

  if (matches.length === 0) {
    return { status: "approved", confidence: 0.95, reasons: [], category: "clean" };
  }

  // Layer 1: Any crisis pattern → always flag
  const crisisMatch = matches.find((m) => m.pattern.category === "crisis");
  if (crisisMatch) {
    return {
      status: "flagged",
      confidence: 1.0,
      reasons: [`crisis_detected: ${crisisMatch.pattern.label}`],
      category: "crisis",
    };
  }

  // Layer 2: Hard violations → always flag regardless of trust
  const hardMatches = matches.filter((m) => m.pattern.severity === "hard");
  if (hardMatches.length > 0) {
    const primary = hardMatches[0];
    return {
      status: "flagged",
      confidence: 0.9,
      reasons: hardMatches.map((m) => `${m.pattern.category}: ${m.pattern.label}`),
      category: primary.pattern.category,
    };
  }

  // Layer 3: Soft violations — trust-weighted
  const softMatches = matches.filter((m) => m.pattern.severity === "soft");
  if (softMatches.length > 0) {
    const primary = softMatches[0];

    // High-trust users (>75) get benefit of doubt on single soft matches
    if (context.trustScore > 75 && softMatches.length === 1) {
      return {
        status: "approved",
        confidence: 0.6,
        reasons: [
          `soft_match_allowed: ${primary.pattern.label} (trust=${context.trustScore})`,
        ],
        category: primary.pattern.category,
      };
    }

    // Low-trust users (<30) get flagged on any soft match
    if (context.trustScore < 30) {
      return {
        status: "flagged",
        confidence: 0.8,
        reasons: softMatches.map(
          (m) => `${m.pattern.category}: ${m.pattern.label} (low_trust=${context.trustScore})`
        ),
        category: primary.pattern.category,
      };
    }

    // Medium-trust: flag if 2+ soft violations, approve with note if 1
    if (softMatches.length >= 2) {
      return {
        status: "flagged",
        confidence: 0.75,
        reasons: softMatches.map(
          (m) => `${m.pattern.category}: ${m.pattern.label}`
        ),
        category: primary.pattern.category,
      };
    }

    // Single soft match, medium trust → approved with note
    return {
      status: "approved",
      confidence: 0.65,
      reasons: [
        `soft_match_passed: ${primary.pattern.label} (trust=${context.trustScore})`,
      ],
      category: primary.pattern.category,
    };
  }

  return { status: "approved", confidence: 0.9, reasons: [], category: "clean" };
}

// ============================================================================
// TRUST SCORE SYSTEM
// ============================================================================

const TRUST_DELTAS: Record<string, number> = {
  message_approved: 1,
  thread_created: 2,
  ceremony_participation: 3,
  reaction_received: 1,
  consistent_presence: 2,
  offering_given: 10,
  phase_transition: 5,
  message_flagged: -5,
  message_removed: -15,
  boundary_violation: -10,
  report_upheld: -20,
  repeated_violation: -30,
};

/**
 * Returns the trust score delta for a given event type.
 */
export function calculateTrustDelta(eventType: string): number {
  return TRUST_DELTAS[eventType] ?? 0;
}

/**
 * Applies a trust score change, records the event, and updates
 * the member's aggregate trust score on the circle membership.
 * Returns the new clamped trust score (0-100).
 */
export async function updateTrustScore(
  db: any,
  userId: string,
  circleId: string | null,
  eventType: string,
  reason?: string
): Promise<number> {
  const delta = calculateTrustDelta(eventType);
  if (delta === 0) return -1; // no-op

  // Record trust event
  await db.insert(codexTrustEvents).values({
    id: nanoid(),
    userId,
    circleId: circleId ?? undefined,
    eventType,
    delta,
    reason: reason ?? eventType,
    issuedBy: "system",
  });

  // Update circle member trust score if circleId provided
  if (circleId) {
    await db
      .update(codexCircleMembers)
      .set({
        trustScore: sql`LEAST(100, GREATEST(0, ${codexCircleMembers.trustScore} + ${delta}))`,
      })
      .where(
        and(
          eq(codexCircleMembers.userId, userId),
          eq(codexCircleMembers.circleId, circleId),
          eq(codexCircleMembers.status, "active")
        )
      );

    // Fetch updated score
    const rows = await db
      .select({ trustScore: codexCircleMembers.trustScore })
      .from(codexCircleMembers)
      .where(
        and(
          eq(codexCircleMembers.userId, userId),
          eq(codexCircleMembers.circleId, circleId)
        )
      )
      .limit(1);

    return rows[0]?.trustScore ?? 50;
  }

  return -1;
}

// ============================================================================
// MODERATION LOGGING
// ============================================================================

/**
 * Records a moderation action to the immutable audit log.
 */
export async function recordModerationAction(
  db: any,
  params: {
    messageId?: string;
    userId: string;
    moderatorType: "ai" | "elder" | "admin";
    moderatorId?: string;
    action: string;
    reason?: string;
    aiConfidence?: number;
    previousStatus: string;
    newStatus: string;
  }
): Promise<void> {
  await db.insert(codexModerationLog).values({
    id: nanoid(),
    messageId: params.messageId ?? undefined,
    userId: params.userId,
    moderatorType: params.moderatorType,
    moderatorId: params.moderatorId ?? undefined,
    action: params.action,
    reason: params.reason ?? undefined,
    aiConfidence: params.aiConfidence != null ? String(params.aiConfidence) : undefined,
    previousStatus: params.previousStatus,
    newStatus: params.newStatus,
  });
}
