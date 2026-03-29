/**
 * EVENT BUS — Phase 8
 * ============================================================
 * Typed event system connecting all Codex phases.
 * Events are logged and reactions fire asynchronously.
 * Each reaction can fail independently without breaking others.
 *
 * Usage:
 *   await emitCodexEvent({ type: "journal_created", userId, data: { entryId } });
 */

import { getDb } from "../db";
import * as schema from "../../drizzle/schema";
import { nanoid } from "nanoid";
import { createMirrorSnapshot } from "./codexLivingMirror";
import { detectPatternShift } from "./codexLivingMirror";
import { generatePredictions } from "./codexPredictiveEngine";

// ── Event type definitions ─────────────────────────────────────────────

export type CodexEventType =
  | "assessment_completed"
  | "journal_created"
  | "check_in_completed"
  | "dialogue_completed"
  | "challenge_reported_back"
  | "scroll_layer_unlocked"
  | "pattern_shift_detected"
  | "milestone_earned"
  | "phase_transition"
  | "community_circle_joined"
  | "community_thread_created"
  | "community_message_posted"
  | "community_reaction_given";

export interface CodexEventPayload {
  type: CodexEventType;
  userId: string;
  data?: Record<string, unknown>;
}

// ── Reaction type ──────────────────────────────────────────────────────

interface Reaction {
  name: string;
  handler: (event: CodexEventPayload) => Promise<void>;
}

// ── Reaction implementations ───────────────────────────────────────────

async function updateMirrorSnapshot(event: CodexEventPayload): Promise<void> {
  const content = (event.data?.content as string) || "";
  const sourceId = (event.data?.sourceId as string) || (event.data?.entryId as string) || "";
  const sourceTypeMap: Partial<Record<CodexEventType, string>> = {
    journal_created: "journal",
    check_in_completed: "check_in",
    dialogue_completed: "dialogue",
    assessment_completed: "assessment",
  };
  const sourceType = sourceTypeMap[event.type] || "unknown";
  if (content && sourceId) {
    await createMirrorSnapshot(event.userId, sourceType, sourceId, content);
  }
}

async function checkScrollUnlock(event: CodexEventPayload): Promise<void> {
  // Scroll unlock is evaluated by codexSealedScroll — emit only logs the event
  // The actual unlock check is handled by the scroll engine on next portal load
}

async function updateStreak(event: CodexEventPayload): Promise<void> {
  // Streak tracking is derived from activity data — no separate table needed
  // This reaction is a hook for future streak-specific tables if added
}

async function runPatternShiftDetection(event: CodexEventPayload): Promise<void> {
  await detectPatternShift(event.userId);
}

async function refreshPredictions(event: CodexEventPayload): Promise<void> {
  await generatePredictions(event.userId);
}

async function logMilestone(event: CodexEventPayload): Promise<void> {
  // Placeholder for milestone persistence (milestone table is scope of future phase)
}

// ── Event → reaction mapping ───────────────────────────────────────────

const REACTION_MAP: Record<CodexEventType, Reaction[]> = {
  assessment_completed: [
    { name: "updateMirrorSnapshot", handler: updateMirrorSnapshot },
    { name: "refreshPredictions", handler: refreshPredictions },
  ],
  journal_created: [
    { name: "updateMirrorSnapshot", handler: updateMirrorSnapshot },
    { name: "checkScrollUnlock", handler: checkScrollUnlock },
    { name: "updateStreak", handler: updateStreak },
    { name: "runPatternShiftDetection", handler: runPatternShiftDetection },
  ],
  check_in_completed: [
    { name: "updateMirrorSnapshot", handler: updateMirrorSnapshot },
    { name: "checkScrollUnlock", handler: checkScrollUnlock },
    { name: "updateStreak", handler: updateStreak },
  ],
  dialogue_completed: [
    { name: "updateMirrorSnapshot", handler: updateMirrorSnapshot },
    { name: "runPatternShiftDetection", handler: runPatternShiftDetection },
    { name: "checkScrollUnlock", handler: checkScrollUnlock },
  ],
  challenge_reported_back: [
    { name: "updateMirrorSnapshot", handler: updateMirrorSnapshot },
    { name: "runPatternShiftDetection", handler: runPatternShiftDetection },
    { name: "updateStreak", handler: updateStreak },
  ],
  scroll_layer_unlocked: [
    { name: "logMilestone", handler: logMilestone },
    { name: "refreshPredictions", handler: refreshPredictions },
  ],
  pattern_shift_detected: [
    { name: "logMilestone", handler: logMilestone },
    { name: "refreshPredictions", handler: refreshPredictions },
  ],
  milestone_earned: [
    { name: "logMilestone", handler: logMilestone },
  ],
  phase_transition: [
    { name: "refreshPredictions", handler: refreshPredictions },
    { name: "logMilestone", handler: logMilestone },
  ],
  community_circle_joined: [
    { name: "logMilestone", handler: logMilestone },
  ],
  community_thread_created: [
    { name: "updateStreak", handler: updateStreak },
  ],
  community_message_posted: [
    { name: "updateStreak", handler: updateStreak },
    { name: "updateMirrorSnapshot", handler: updateMirrorSnapshot },
  ],
  community_reaction_given: [],
};

// ── Core: emit an event ────────────────────────────────────────────────

export async function emitCodexEvent(event: CodexEventPayload): Promise<void> {
  const reactions = REACTION_MAP[event.type] || [];
  const reactionsTriggered: string[] = [];
  const errors: { reaction: string; error: string }[] = [];

  // Execute all reactions independently
  await Promise.allSettled(
    reactions.map(async (reaction) => {
      try {
        await reaction.handler(event);
        reactionsTriggered.push(reaction.name);
      } catch (err) {
        errors.push({
          reaction: reaction.name,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    })
  );

  // Log event to database
  try {
    const db = await getDb();
    if (db) {
      await db.insert(schema.codexEvents).values({
        id: nanoid(),
        userId: event.userId,
        eventType: event.type,
        eventData: event.data ? JSON.stringify(event.data) : null,
        reactionsTriggered: JSON.stringify(reactionsTriggered),
        errors: errors.length > 0 ? JSON.stringify(errors) : null,
      });
    }
  } catch {
    // Event log failure is non-fatal
  }
}

// ── Convenience typed emitters ─────────────────────────────────────────

export function emitJournalCreated(userId: string, entryId: string, content: string) {
  return emitCodexEvent({ type: "journal_created", userId, data: { entryId, sourceId: entryId, content } });
}

export function emitCheckInCompleted(userId: string, checkInId: string) {
  return emitCodexEvent({ type: "check_in_completed", userId, data: { checkInId, sourceId: checkInId } });
}

export function emitDialogueCompleted(userId: string, sessionId: string) {
  return emitCodexEvent({ type: "dialogue_completed", userId, data: { sessionId, sourceId: sessionId } });
}

export function emitChallengeReportedBack(userId: string, challengeId: string, reportText: string) {
  return emitCodexEvent({ type: "challenge_reported_back", userId, data: { challengeId, sourceId: challengeId, content: reportText } });
}

export function emitAssessmentCompleted(userId: string, assessmentId: string) {
  return emitCodexEvent({ type: "assessment_completed", userId, data: { assessmentId, sourceId: assessmentId } });
}

export function emitScrollLayerUnlocked(userId: string, layer: number) {
  return emitCodexEvent({ type: "scroll_layer_unlocked", userId, data: { layer } });
}

export function emitPhaseTransition(userId: string, fromPhase: string, toPhase: string) {
  return emitCodexEvent({ type: "phase_transition", userId, data: { fromPhase, toPhase } });
}

export function emitCommunityCircleJoined(userId: string, circleId: string, circleName: string) {
  return emitCodexEvent({ type: "community_circle_joined", userId, data: { circleId, circleName } });
}

export function emitCommunityThreadCreated(userId: string, threadId: string, circleId: string) {
  return emitCodexEvent({ type: "community_thread_created", userId, data: { threadId, circleId } });
}

export function emitCommunityMessagePosted(userId: string, messageId: string, content: string) {
  return emitCodexEvent({ type: "community_message_posted", userId, data: { messageId, sourceId: messageId, content } });
}

export function emitCommunityReactionGiven(userId: string, recipientId: string, reactionType: string) {
  return emitCodexEvent({ type: "community_reaction_given", userId, data: { recipientId, reactionType } });
}
