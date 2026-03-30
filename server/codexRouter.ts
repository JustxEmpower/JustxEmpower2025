/**
 * Living Codex™ tRPC Router
 * Admin + Customer procedures for the full Codex integration
 */
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { runScoringEngine, type ResponseRecord, type AnswerMetadata } from "./lib/codexScoringEngine";
import { SECTION_META, ARCHETYPES, JOURNEY_TIERS, SCROLL_MODULES } from "./lib/codexConstants";
import { CODEX_GUIDES, codexGuideChat, generateJournalPrompt, reflectOnJournalEntry, generateGrowthInsight, type UserContext } from "./lib/codexAI";
import { interceptUserMessage, validateAIResponse } from "./lib/codexEscalationEngine";
import { classifyCommunityContent, updateTrustScore, recordModerationAction } from "./lib/codexCommunityModeration";
import { rankCircleCandidates } from "./lib/codexResonanceEngine";
import { generateWeeklyCirclePrompt, type CircleContext } from "./lib/codexCeremonyEngine";
import { generateMirrorReport } from "./lib/codexMirrorReport";
import { routePortalContent } from "./lib/codexRoutingEngine";
import { BOOK_CATALOG, BOOK_TO_CODEX_MAP, LINEAGE_LAYER_PROMPTS, GUIDE_MATERNAL_DNA, buildMaternalContextBlock, buildResonanceAnalysisPrompt, buildBridgeReflectionPrompt, type MaternalPattern } from "./lib/codexBridgePrompts";
import {
  evaluateScrollUnlock, generateLayerContent, SCROLL_LAYER_META,
  type ScrollLayerNumber, type UserActivitySnapshot, type CodexSignature,
} from "./lib/codexSealedScroll";
import {
  initiateDialogue, processUserResponse, generateMicroRevelation, issueRealWorldChallenge, processReportBack,
  type DialogueType, type ArchetypeContext, type DialogueExchange,
} from "./lib/codexDialogueEngine";
import {
  createMirrorSnapshot, detectPatternShift, generateMirrorAddendum, generateTemporalReflection,
  type MirrorAddendumType, type Timeframe,
} from "./lib/codexLivingMirror";
import {
  generateCheckInPrompts, processCheckIn, getCheckInPatterns,
  type CheckInResponse,
} from "./lib/codexCheckInEngine";
import {
  initializeAdaptiveState, updatePosteriors, shouldTerminate,
  evaluatePhaseTransition, eliminateLowProbability, selectNextQuestion,
  convertToScoringResponses, buildSignalFromAnswers, posteriorsSummary,
  computeEntropy, DEFAULT_ADAPTIVE_CONFIG,
  type AdaptiveState, type AdaptiveConfig, type QuestionSignal,
} from "./lib/codexAdaptiveEngine";
import Stripe from "stripe";

let _stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!_stripe && process.env.STRIPE_SECRET_KEY) {
    try { _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" as any }); } catch {}
  }
  return _stripe;
}

// ── Admin auth (same pattern as adminRouters.ts) ────────────────────
async function validateAdminSession(token: string): Promise<string | null> {
  const db = await getDb(); if (!db) return null;
  const [s] = await db.select().from(schema.adminSessions).where(eq(schema.adminSessions.token, token)).limit(1);
  if (!s || s.expiresAt < new Date()) return null;
  return s.username;
}

const adminProc = publicProcedure.use(async ({ ctx, next }) => {
  const token = ctx.req.headers["x-admin-token"] as string;
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin token required" });
  const username = await validateAdminSession(token);
  if (!username) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired admin session" });
  return next({ ctx: { ...ctx, adminUsername: username } });
});

// ── Customer auth (uses existing customer sessions) ─────────────────
async function validateCustomerSession(token: string) {
  const db = await getDb(); if (!db) return null;
  const [s] = await db.select().from(schema.customerSessions).where(eq(schema.customerSessions.token, token)).limit(1);
  if (!s || s.expiresAt < new Date()) return null;
  const [c] = await db.select().from(schema.customers).where(eq(schema.customers.id, s.customerId)).limit(1);
  return c || null;
}

// Finds or creates codex_users entry linked by email to JXE customer
async function getOrCreateCodexUser(customer: schema.Customer) {
  const db = await getDb(); if (!db) throw new Error("DB N/A");
  const [existing] = await db.select().from(schema.codexUsers).where(eq(schema.codexUsers.email, customer.email)).limit(1);
  if (existing) return existing;
  const id = nanoid();
  await db.insert(schema.codexUsers).values({
    id,
    email: customer.email,
    name: `${customer.firstName} ${customer.lastName}`,
    passwordHash: customer.passwordHash,
    role: "client",
    tier: customer.codexTier || null,
    purchaseDate: customer.codexPurchaseDate || null,
  });
  const [created] = await db.select().from(schema.codexUsers).where(eq(schema.codexUsers.id, id)).limit(1);
  return created!;
}

const customerProc = publicProcedure.use(async ({ ctx, next }) => {
  const t = ctx.req.headers["x-customer-token"] as string;
  if (!t) throw new TRPCError({ code: "UNAUTHORIZED", message: "Please log in" });
  const customer = await validateCustomerSession(t);
  if (!customer) throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expired" });
  const codexUser = await getOrCreateCodexUser(customer);
  return next({ ctx: { ...ctx, customer, codexUser } });
});

// ══════════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ══════════════════════════════════════════════════════════════════════
const codexAdminRouter = router({
  // List all codex clients
  clients: adminProc.query(async () => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const users = await db.select().from(schema.codexUsers).orderBy(desc(schema.codexUsers.createdAt));
    // For each user, get latest assessment status
    const enriched = await Promise.all(users.map(async (u) => {
      const [assessment] = await db.select().from(schema.codexAssessments).where(eq(schema.codexAssessments.userId, u.id)).orderBy(desc(schema.codexAssessments.createdAt)).limit(1);
      const [report] = await db.select({ id: schema.codexMirrorReports.id, status: schema.codexMirrorReports.status }).from(schema.codexMirrorReports).where(eq(schema.codexMirrorReports.userId, u.id)).orderBy(desc(schema.codexMirrorReports.generatedAt)).limit(1);
      const [noteCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.codexAdminNotes).where(eq(schema.codexAdminNotes.userId, u.id));
      return { ...u, passwordHash: undefined, assessmentStatus: assessment?.status || "none", reportStatus: report?.status || "none", noteCount: noteCount?.count || 0 };
    }));
    return enriched;
  }),

  // Get single client detail
  clientDetail: adminProc.input(z.object({ userId: z.string() })).query(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [user] = await db.select().from(schema.codexUsers).where(eq(schema.codexUsers.id, input.userId)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    const assessments = await db.select().from(schema.codexAssessments).where(eq(schema.codexAssessments.userId, input.userId)).orderBy(desc(schema.codexAssessments.createdAt));
    const reports = await db.select().from(schema.codexMirrorReports).where(eq(schema.codexMirrorReports.userId, input.userId)).orderBy(desc(schema.codexMirrorReports.generatedAt));
    const notes = await db.select().from(schema.codexAdminNotes).where(eq(schema.codexAdminNotes.userId, input.userId)).orderBy(desc(schema.codexAdminNotes.createdAt));
    const scrollEntries = await db.select().from(schema.codexScrollEntries).where(eq(schema.codexScrollEntries.userId, input.userId)).orderBy(asc(schema.codexScrollEntries.moduleNum));
    return { user: { ...user, passwordHash: undefined }, assessments, reports, notes, scrollEntries };
  }),

  // Update client tier
  updateClientTier: adminProc.input(z.object({ userId: z.string(), tier: z.string().nullable() })).mutation(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(schema.codexUsers).set({ tier: input.tier, purchaseDate: input.tier ? new Date() : null }).where(eq(schema.codexUsers.id, input.userId));
    return { success: true };
  }),

  // Add admin note
  addNote: adminProc.input(z.object({ userId: z.string(), content: z.string().min(1) })).mutation(async ({ input, ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const id = nanoid();
    await db.insert(schema.codexAdminNotes).values({ id, userId: input.userId, content: input.content });
    return { success: true, id };
  }),

  // Delete admin note
  deleteNote: adminProc.input(z.object({ noteId: z.string() })).mutation(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(schema.codexAdminNotes).where(eq(schema.codexAdminNotes.id, input.noteId));
    return { success: true };
  }),

  // Release mirror report to client
  releaseReport: adminProc.input(z.object({ reportId: z.string(), aprilNote: z.string().optional() })).mutation(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(schema.codexMirrorReports).set({ status: "released", releasedAt: new Date(), aprilNote: input.aprilNote || null, reviewedAt: new Date() }).where(eq(schema.codexMirrorReports.id, input.reportId));
    return { success: true };
  }),

  // Get scoring for an assessment
  getScoring: adminProc.input(z.object({ assessmentId: z.string() })).query(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [scoring] = await db.select().from(schema.codexScorings).where(eq(schema.codexScorings.assessmentId, input.assessmentId)).limit(1);
    return scoring ? { ...scoring, resultJson: JSON.parse(scoring.resultJson) } : null;
  }),

  // ── Content CMS ────────────────────────────────────────────────────
  sections: adminProc.query(async () => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(schema.codexSections).orderBy(asc(schema.codexSections.id));
  }),

  questions: adminProc.input(z.object({ sectionNum: z.number().optional() })).query(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const where = input.sectionNum ? eq(schema.codexQuestions.sectionNum, input.sectionNum) : undefined;
    const questions = where
      ? await db.select().from(schema.codexQuestions).where(where).orderBy(asc(schema.codexQuestions.questionNum))
      : await db.select().from(schema.codexQuestions).orderBy(asc(schema.codexQuestions.sectionNum), asc(schema.codexQuestions.questionNum));
    return questions;
  }),

  answers: adminProc.input(z.object({ questionId: z.string() })).query(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(schema.codexAnswers).where(eq(schema.codexAnswers.questionId, input.questionId));
  }),

  updateQuestion: adminProc.input(z.object({ id: z.string(), questionText: z.string().optional(), invitation: z.string().optional() })).mutation(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const updates: any = {};
    if (input.questionText) updates.questionText = input.questionText;
    if (input.invitation !== undefined) updates.invitation = input.invitation;
    await db.update(schema.codexQuestions).set(updates).where(eq(schema.codexQuestions.id, input.id));
    return { success: true };
  }),

  updateAnswer: adminProc.input(z.object({ id: z.string(), answerText: z.string().optional(), spectrumDepth: z.string().optional(), arPrimary: z.string().optional(), arSecondary: z.string().optional(), wi: z.string().optional(), mp: z.string().optional() })).mutation(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { id, ...updates } = input;
    await db.update(schema.codexAnswers).set(updates as any).where(eq(schema.codexAnswers.id, id));
    return { success: true };
  }),

  // Dashboard stats
  stats: adminProc.query(async () => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [totalClients] = await db.select({ count: sql<number>`count(*)` }).from(schema.codexUsers);
    const [activeAssessments] = await db.select({ count: sql<number>`count(*)` }).from(schema.codexAssessments).where(eq(schema.codexAssessments.status, "in_progress"));
    const [completedAssessments] = await db.select({ count: sql<number>`count(*)` }).from(schema.codexAssessments).where(eq(schema.codexAssessments.status, "complete"));
    const [pendingReports] = await db.select({ count: sql<number>`count(*)` }).from(schema.codexMirrorReports).where(eq(schema.codexMirrorReports.status, "ready_for_review"));
    const [releasedReports] = await db.select({ count: sql<number>`count(*)` }).from(schema.codexMirrorReports).where(eq(schema.codexMirrorReports.status, "released"));
    return {
      totalClients: totalClients?.count || 0,
      activeAssessments: activeAssessments?.count || 0,
      completedAssessments: completedAssessments?.count || 0,
      pendingReports: pendingReports?.count || 0,
      releasedReports: releasedReports?.count || 0,
    };
  }),
});

// ══════════════════════════════════════════════════════════════════════
// CUSTOMER (CLIENT-FACING) ROUTES
// ══════════════════════════════════════════════════════════════════════
const codexClientRouter = router({
  // Get portal data (assessment status, scoring, report status)
  portal: customerProc.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    const [assessment] = await db.select().from(schema.codexAssessments).where(eq(schema.codexAssessments.userId, u.id)).orderBy(desc(schema.codexAssessments.createdAt)).limit(1);
    let scoring = null;
    if (assessment) {
      const [s] = await db.select().from(schema.codexScorings).where(eq(schema.codexScorings.assessmentId, assessment.id)).limit(1);
      scoring = s ? { ...s, resultJson: JSON.parse(s.resultJson) } : null;
    }
    const [report] = await db.select().from(schema.codexMirrorReports).where(eq(schema.codexMirrorReports.userId, u.id)).orderBy(desc(schema.codexMirrorReports.generatedAt)).limit(1);
    const scrollProgress = await db.select({ moduleNum: schema.codexScrollEntries.moduleNum }).from(schema.codexScrollEntries).where(eq(schema.codexScrollEntries.userId, u.id));
    const completedModules = Array.from(new Set(scrollProgress.map(e => e.moduleNum)));

    return {
      user: { name: u.name, tier: u.tier, purchaseDate: u.purchaseDate?.toISOString() || null },
      assessment: assessment ? { id: assessment.id, status: assessment.status, currentSection: assessment.currentSection, currentQuestion: assessment.currentQuestion } : null,
      scoring: scoring ? { resultJson: scoring.resultJson } : null,
      mirrorReport: report ? { id: report.id, status: report.status, releasedAt: report.releasedAt?.toISOString() || null } : null,
      scrollProgress: completedModules,
    };
  }),

  // Check if customer has codex access
  hasAccess: customerProc.query(async ({ ctx }) => {
    const u = (ctx as any).codexUser as schema.CodexUser;
    return { hasAccess: !!u.tier, tier: u.tier };
  }),

  // Get assessment questions for a section
  getQuestions: customerProc.input(z.object({ sectionNum: z.number() })).query(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const questions = await db.select().from(schema.codexQuestions).where(eq(schema.codexQuestions.sectionNum, input.sectionNum)).orderBy(asc(schema.codexQuestions.questionNum));
    const withAnswers = await Promise.all(questions.map(async (q) => {
      const answers = await db.select().from(schema.codexAnswers).where(eq(schema.codexAnswers.questionId, q.id));
      return { ...q, answers: answers.map(a => ({ id: a.id, code: a.code, text: a.answerText })) };
    }));
    const meta = SECTION_META[input.sectionNum];
    return { section: { num: input.sectionNum, ...meta }, questions: withAnswers };
  }),

  // Start or resume assessment
  startAssessment: customerProc.mutation(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    if (!u.tier) throw new TRPCError({ code: "FORBIDDEN", message: "Please purchase a Codex tier to access the assessment" });
    // Check for existing in-progress assessment
    const [existing] = await db.select().from(schema.codexAssessments).where(and(eq(schema.codexAssessments.userId, u.id), eq(schema.codexAssessments.status, "in_progress"))).limit(1);
    if (existing) return { assessmentId: existing.id, currentSection: existing.currentSection, currentQuestion: existing.currentQuestion, resumed: true };
    // Create new
    const id = nanoid();
    await db.insert(schema.codexAssessments).values({ id, userId: u.id, status: "in_progress", startedAt: new Date() });
    return { assessmentId: id, currentSection: 1, currentQuestion: 1, resumed: false };
  }),

  // Submit response to a question
  submitResponse: customerProc.input(z.object({
    assessmentId: z.string(),
    sectionNum: z.number(),
    questionId: z.string(),
    answerCode: z.string().nullable(),
    openText: z.string().nullable(),
    isGhost: z.boolean().default(false),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    // RBAC: Verify assessment belongs to this user
    const [assessment] = await db.select().from(schema.codexAssessments).where(and(eq(schema.codexAssessments.id, input.assessmentId), eq(schema.codexAssessments.userId, u.id))).limit(1);
    if (!assessment) throw new TRPCError({ code: "NOT_FOUND", message: "Assessment not found" });
    const id = nanoid();
    // Upsert response
    const [existing] = await db.select().from(schema.codexResponses).where(and(
      eq(schema.codexResponses.assessmentId, input.assessmentId),
      eq(schema.codexResponses.sectionNum, input.sectionNum),
      eq(schema.codexResponses.questionId, input.questionId),
    )).limit(1);

    if (existing) {
      await db.update(schema.codexResponses).set({ answerCode: input.answerCode, openText: input.openText, isGhost: input.isGhost ? 1 : 0, answeredAt: new Date() }).where(eq(schema.codexResponses.id, existing.id));
    } else {
      await db.insert(schema.codexResponses).values({ id, assessmentId: input.assessmentId, sectionNum: input.sectionNum, questionId: input.questionId, answerCode: input.answerCode, openText: input.openText, isGhost: input.isGhost ? 1 : 0 });
    }
    return { success: true };
  }),

  // Update assessment progress
  updateProgress: customerProc.input(z.object({ assessmentId: z.string(), currentSection: z.number(), currentQuestion: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    // RBAC: Verify assessment belongs to this user
    const [assessment] = await db.select().from(schema.codexAssessments).where(and(eq(schema.codexAssessments.id, input.assessmentId), eq(schema.codexAssessments.userId, u.id))).limit(1);
    if (!assessment) throw new TRPCError({ code: "NOT_FOUND", message: "Assessment not found" });
    await db.update(schema.codexAssessments).set({ currentSection: input.currentSection, currentQuestion: input.currentQuestion }).where(eq(schema.codexAssessments.id, input.assessmentId));
    return { success: true };
  }),

  // Complete assessment and run scoring
  completeAssessment: customerProc.input(z.object({ assessmentId: z.string() })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;

    // Fetch all responses
    const responses = await db.select().from(schema.codexResponses).where(eq(schema.codexResponses.assessmentId, input.assessmentId));

    // Build answer lookup from DB
    const allAnswers = await db.select().from(schema.codexAnswers);
    const allQuestions = await db.select().from(schema.codexQuestions);
    const qMap = new Map(allQuestions.map(q => [q.id, q]));

    const answerLookup = new Map<string, AnswerMetadata>();
    for (const a of allAnswers) {
      const q = qMap.get(a.questionId);
      if (!q) continue;
      const key = `${q.sectionNum}-${a.questionId}-${a.code}`;
      answerLookup.set(key, {
        code: a.code,
        spectrumDepth: a.spectrumDepth,
        arPrimary: a.arPrimary,
        arSecondary: a.arSecondary,
        wi: a.wi,
        mp: a.mp,
        mmi: a.mmi,
        abi: a.abi,
        epcl: a.epcl,
        wombField: a.wombField,
      });
    }

    // Map responses to scoring engine format
    const records: ResponseRecord[] = responses.map(r => ({
      sectionNum: r.sectionNum,
      questionId: r.questionId,
      answerCode: r.answerCode,
      openText: r.openText,
      isGhost: r.isGhost === 1,
    }));

    const result = runScoringEngine(records, answerLookup);

    // Save scoring
    const scoringId = nanoid();
    await db.insert(schema.codexScorings).values({ id: scoringId, assessmentId: input.assessmentId, resultJson: JSON.stringify(result) });

    // Mark assessment complete
    await db.update(schema.codexAssessments).set({ status: "complete", completedAt: new Date() }).where(eq(schema.codexAssessments.id, input.assessmentId));

    // Auto-generate mirror report
    const reportId = nanoid();
    const reportContent = {
      archetypeConstellation: result.archetypeConstellation,
      activeWounds: result.activeWounds,
      activeMirrors: result.activeMirrors,
      spectrumProfile: result.spectrumProfile,
      integrationIndex: result.integrationIndex,
      contradictionFlags: result.contradictionFlags,
    };
    await db.insert(schema.codexMirrorReports).values({
      id: reportId,
      userId: u.id,
      assessmentId: input.assessmentId,
      scoringId,
      status: "ready_for_review",
      contentJson: JSON.stringify(reportContent),
    });

    // ── Community auto-join: General Circle + primary archetype circle ──
    try {
      const { computeGenomeVector } = await import("./lib/codexResonanceEngine");

      // Compute and store genome vector
      const vector = computeGenomeVector(u.id, result, 1);
      const [existingVector] = await db.select().from(schema.codexGenomeVectors).where(eq(schema.codexGenomeVectors.userId, u.id)).limit(1);
      if (existingVector) {
        await db.update(schema.codexGenomeVectors).set({
          archetypeVector: JSON.stringify(vector.archetype),
          woundVector: JSON.stringify(vector.wound),
          spectrumVector: JSON.stringify(vector.spectrum),
          mirrorVector: JSON.stringify(vector.mirror),
          phaseVector: JSON.stringify(vector.phase),
          compositeVector: JSON.stringify(vector.composite),
          scoringId,
        }).where(eq(schema.codexGenomeVectors.userId, u.id));
      } else {
        await db.insert(schema.codexGenomeVectors).values({
          id: nanoid(), userId: u.id,
          archetypeVector: JSON.stringify(vector.archetype),
          woundVector: JSON.stringify(vector.wound),
          spectrumVector: JSON.stringify(vector.spectrum),
          mirrorVector: JSON.stringify(vector.mirror),
          phaseVector: JSON.stringify(vector.phase),
          compositeVector: JSON.stringify(vector.composite),
          scoringId,
        });
      }

      // Auto-join General Circle
      const [generalCircle] = await db.select().from(schema.codexCircles)
        .where(and(eq(schema.codexCircles.circleType, "general"), eq(schema.codexCircles.isActive, 1))).limit(1);
      if (generalCircle) {
        const [existingMember] = await db.select().from(schema.codexCircleMembers)
          .where(and(eq(schema.codexCircleMembers.circleId, generalCircle.id), eq(schema.codexCircleMembers.userId, u.id))).limit(1);
        if (!existingMember) {
          await db.insert(schema.codexCircleMembers).values({
            id: nanoid(), circleId: generalCircle.id, userId: u.id,
            role: "member", status: "active", trustScore: 50,
          });
        }
      }

      // Auto-join primary archetype circle
      const primaryArch = result.archetypeConstellation[0];
      if (primaryArch) {
        const archKey = primaryArch.arName.replace(/^The\s+/, "").toLowerCase().replace(/\s+/g, "-");
        const [archCircle] = await db.select().from(schema.codexCircles)
          .where(and(eq(schema.codexCircles.circleType, "archetype"), eq(schema.codexCircles.archetypeFilter, archKey), eq(schema.codexCircles.isActive, 1))).limit(1);
        if (archCircle) {
          const [existingMember] = await db.select().from(schema.codexCircleMembers)
            .where(and(eq(schema.codexCircleMembers.circleId, archCircle.id), eq(schema.codexCircleMembers.userId, u.id))).limit(1);
          if (!existingMember) {
            await db.insert(schema.codexCircleMembers).values({
              id: nanoid(), circleId: archCircle.id, userId: u.id,
              role: "member", status: "active", trustScore: 50,
            });
          }
        }
      }
    } catch (communityErr) {
      // Community auto-join is non-fatal — assessment still succeeds
      console.warn("[Codex] Community auto-join failed:", communityErr);
    }

    return { success: true, scoringId, reportId };
  }),

  // Get mirror report
  mirrorReport: customerProc.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    const [report] = await db.select().from(schema.codexMirrorReports).where(and(eq(schema.codexMirrorReports.userId, u.id), eq(schema.codexMirrorReports.status, "released"))).orderBy(desc(schema.codexMirrorReports.generatedAt)).limit(1);
    if (!report) return null;
    return { ...report, contentJson: JSON.parse(report.contentJson) };
  }),

  // Scroll: get entries for a module
  scrollEntries: customerProc.input(z.object({ moduleNum: z.number() })).query(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    return db.select().from(schema.codexScrollEntries).where(and(eq(schema.codexScrollEntries.userId, u.id), eq(schema.codexScrollEntries.moduleNum, input.moduleNum)));
  }),

  // Scroll: save response
  saveScrollResponse: customerProc.input(z.object({ moduleNum: z.number(), promptId: z.string(), responseText: z.string() })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    const [existing] = await db.select().from(schema.codexScrollEntries).where(and(
      eq(schema.codexScrollEntries.userId, u.id),
      eq(schema.codexScrollEntries.moduleNum, input.moduleNum),
      eq(schema.codexScrollEntries.promptId, input.promptId),
    )).limit(1);
    if (existing) {
      await db.update(schema.codexScrollEntries).set({ responseText: input.responseText }).where(eq(schema.codexScrollEntries.id, existing.id));
    } else {
      await db.insert(schema.codexScrollEntries).values({ id: nanoid(), userId: u.id, moduleNum: input.moduleNum, promptId: input.promptId, responseText: input.responseText });
    }
    return { success: true };
  }),

  // Purchase a tier via Stripe Checkout
  purchaseTier: customerProc.input(z.object({ tierId: z.string() })).mutation(async ({ ctx, input }) => {
    const stripe = getStripe();
    if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payment processing not configured" });
    const tier = JOURNEY_TIERS.find(t => t.id === input.tierId);
    if (!tier) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid tier" });
    const customer = (ctx as any).customer as schema.Customer;
    const baseUrl = process.env.APP_URL || `${ctx.req.protocol}://${ctx.req.get('host')}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customer.email,
      line_items: [{ price_data: { currency: "usd", product_data: { name: `Living Codex™ — ${tier.name}`, description: tier.description }, unit_amount: tier.price }, quantity: 1 }],
      success_url: `${baseUrl}/account/codex?purchase=success&tier=${tier.id}`,
      cancel_url: `${baseUrl}/account/codex`,
      metadata: { customerId: String(customer.id), tierId: tier.id, type: "codex_tier" },
      allow_promotion_codes: true,
    });
    return { checkoutUrl: session.url };
  }),

  // Confirm tier after successful Stripe payment (called from success redirect)
  confirmTierPurchase: customerProc.input(z.object({ tierId: z.string() })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const tier = JOURNEY_TIERS.find(t => t.id === input.tierId);
    if (!tier) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid tier" });
    const customer = (ctx as any).customer as schema.Customer;
    const u = (ctx as any).codexUser as schema.CodexUser;
    // Update both customers table and codex_users table
    await db.update(schema.customers).set({ codexTier: tier.id, codexPurchaseDate: new Date() }).where(eq(schema.customers.id, customer.id));
    await db.update(schema.codexUsers).set({ tier: tier.id, purchaseDate: new Date() }).where(eq(schema.codexUsers.id, u.id));
    return { success: true, tier: tier.id };
  }),

  // ── Dashboard Data (enriched) ─────────────────────────────────────
  dashboardData: customerProc.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    const [assessment] = await db.select().from(schema.codexAssessments).where(eq(schema.codexAssessments.userId, u.id)).orderBy(desc(schema.codexAssessments.createdAt)).limit(1);
    let scoring = null;
    if (assessment) {
      const [s] = await db.select().from(schema.codexScorings).where(eq(schema.codexScorings.assessmentId, assessment.id)).limit(1);
      scoring = s ? JSON.parse(s.resultJson) : null;
    }
    const scrollProgress = await db.select({ moduleNum: schema.codexScrollEntries.moduleNum }).from(schema.codexScrollEntries).where(eq(schema.codexScrollEntries.userId, u.id));
    const completedModules = Array.from(new Set(scrollProgress.map(e => e.moduleNum)));
    const [journalCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.codexJournalEntries).where(eq(schema.codexJournalEntries.userId, u.id));
    const [report] = await db.select().from(schema.codexMirrorReports).where(eq(schema.codexMirrorReports.userId, u.id)).orderBy(desc(schema.codexMirrorReports.generatedAt)).limit(1);
    const daysActive = u.purchaseDate ? Math.floor((Date.now() - new Date(u.purchaseDate).getTime()) / 86400000) : 0;

    // Build user context for AI
    const userContext: UserContext = {
      name: u.name || undefined,
      primaryArchetype: scoring?.archetypeConstellation?.[0]?.archetype,
      phase: scoring?.spectrumProfile?.thresholdPct > 40 ? "threshold" : scoring?.spectrumProfile?.giftPct > 30 ? "integration" : "discovery",
      activeWounds: scoring?.activeWounds?.slice(0, 3).map((w: any) => w.wound),
      spectrumProfile: scoring?.spectrumProfile,
      integrationIndex: scoring?.integrationIndex,
      tier: u.tier || undefined,
    };

    let growthInsight = "";
    try { growthInsight = await generateGrowthInsight(userContext); } catch {}

    // Compute routing engine output for dashboard expansions
    let routing = null;
    if (scoring) {
      try {
        routing = routePortalContent({
          primaryArchetype: scoring.archetypeConstellation?.[0]?.archetype || "",
          shadowArchetype: scoring.archetypeConstellation?.[1]?.archetype || "",
          archetypeCluster: scoring.archetypeConstellation?.slice(0, 3).map((a: any) => a.archetype) || [],
          woundPrioritySet: scoring.activeWounds?.map((w: any) => w.wiCode || w.wound) || [],
          mirrorMap: scoring.activeMirrors?.map((m: any) => m.mpCode) || [],
          spectrumProfile: {
            shadowPercent: scoring.spectrumProfile?.shadowPct || 0,
            thresholdPercent: scoring.spectrumProfile?.thresholdPct || 0,
            giftPercent: scoring.spectrumProfile?.giftPct || 0,
          },
          siProportion: 0.5,
          nsProfile: { ns_freeze: 0, ns_fight: 0, ns_collapse: 0, ns_hypervigilant: 0, ns_regulated: 1 },
          phase: String(scoring.phase || 1),
          selfPlacedPhase: String(scoring.phase || 1),
          pathwayType: "discovery",
          depthLevel: "intermediate",
          supportStyle: "general",
          timeCapacity: "moderate",
          completedModules: completedModules.map(Number),
        });
      } catch {}
    }

    return {
      user: { name: u.name, tier: u.tier, purchaseDate: u.purchaseDate?.toISOString() || null },
      assessment: assessment ? { id: assessment.id, status: assessment.status, currentSection: assessment.currentSection } : null,
      scoring,
      reportStatus: report?.status || "none",
      completedModules,
      journalCount: journalCount?.count || 0,
      daysActive,
      growthInsight,
      routing,
    };
  }),

  // ── Journal Endpoints ──────────────────────────────────────────────
  journalList: customerProc.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    return db.select().from(schema.codexJournalEntries).where(eq(schema.codexJournalEntries.userId, u.id)).orderBy(desc(schema.codexJournalEntries.createdAt));
  }),

  journalCreate: customerProc.input(z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    mood: z.string().optional(),
    aiPrompt: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    const id = nanoid();

    // Get user context for AI reflection
    const [assessment] = await db.select().from(schema.codexAssessments).where(eq(schema.codexAssessments.userId, u.id)).orderBy(desc(schema.codexAssessments.createdAt)).limit(1);
    let scoring = null;
    if (assessment) {
      const [s] = await db.select().from(schema.codexScorings).where(eq(schema.codexScorings.assessmentId, assessment.id)).limit(1);
      scoring = s ? JSON.parse(s.resultJson) : null;
    }
    const userContext: UserContext = {
      primaryArchetype: scoring?.archetypeConstellation?.[0]?.archetype,
      phase: scoring?.spectrumProfile?.thresholdPct > 40 ? "threshold" : "discovery",
    };

    let aiResult = { themes: [] as string[], reflection: "" };
    try { aiResult = await reflectOnJournalEntry(input.content, userContext); } catch {}

    await db.insert(schema.codexJournalEntries).values({
      id,
      userId: u.id,
      title: input.title,
      content: input.content,
      mood: input.mood || null,
      themes: JSON.stringify(aiResult.themes),
      aiPrompt: input.aiPrompt || null,
      aiSummary: aiResult.reflection || null,
      phase: userContext.phase || null,
      archetypeContext: userContext.primaryArchetype || null,
    });

    const [entry] = await db.select().from(schema.codexJournalEntries).where(eq(schema.codexJournalEntries.id, id)).limit(1);
    return entry;
  }),

  journalPrompt: customerProc.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    const [assessment] = await db.select().from(schema.codexAssessments).where(eq(schema.codexAssessments.userId, u.id)).orderBy(desc(schema.codexAssessments.createdAt)).limit(1);
    let scoring = null;
    if (assessment) {
      const [s] = await db.select().from(schema.codexScorings).where(eq(schema.codexScorings.assessmentId, assessment.id)).limit(1);
      scoring = s ? JSON.parse(s.resultJson) : null;
    }
    const userContext: UserContext = {
      primaryArchetype: scoring?.archetypeConstellation?.[0]?.archetype,
      phase: scoring?.spectrumProfile?.thresholdPct > 40 ? "threshold" : "discovery",
      activeWounds: scoring?.activeWounds?.slice(0, 2).map((w: any) => w.wound),
    };

    // Doc 05 Journal Intelligence: extract themes from recent guide conversations
    let recentGuideThemes: string[] | null = null;
    try {
      const recentConvos = await db.select({ id: schema.codexGuideConversations.id })
        .from(schema.codexGuideConversations)
        .where(eq(schema.codexGuideConversations.userId, u.id))
        .orderBy(desc(schema.codexGuideConversations.updatedAt))
        .limit(3);
      if (recentConvos.length > 0) {
        const convIds = recentConvos.map(c => c.id);
        const recentUserMsgs = await db.select({ content: schema.codexGuideMessages.content })
          .from(schema.codexGuideMessages)
          .where(sql`${schema.codexGuideMessages.conversationId} IN (${sql.join(convIds.map(id => sql`${id}`), sql`, `)}) AND ${schema.codexGuideMessages.role} = 'user'`)
          .orderBy(desc(schema.codexGuideMessages.createdAt))
          .limit(5);
        if (recentUserMsgs.length > 0) {
          recentGuideThemes = recentUserMsgs.map(m => m.content.substring(0, 100));
        }
      }
    } catch (err) {
      console.error('[Codex] Journal intelligence theme fetch error:', err);
    }

    const prompt = await generateJournalPrompt(userContext, recentGuideThemes);
    return { prompt };
  }),

  // Export a journal entry as a trajectory JSON file for avatar upload
  journalExportTrajectory: customerProc.input(z.object({ entryId: z.string() })).query(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    // Verify ownership
    const [entry] = await db.select().from(schema.codexJournalEntries)
      .where(and(eq(schema.codexJournalEntries.id, input.entryId), eq(schema.codexJournalEntries.userId, u.id)))
      .limit(1);
    if (!entry) throw new TRPCError({ code: "NOT_FOUND", message: "Journal entry not found" });

    // Fetch user scoring context for richer trajectory
    const [assessment] = await db.select().from(schema.codexAssessments).where(eq(schema.codexAssessments.userId, u.id)).orderBy(desc(schema.codexAssessments.createdAt)).limit(1);
    let scoring = null;
    if (assessment) {
      const [s] = await db.select().from(schema.codexScorings).where(eq(schema.codexScorings.assessmentId, assessment.id)).limit(1);
      scoring = s ? JSON.parse(s.resultJson) : null;
    }

    const themes = entry.themes ? JSON.parse(entry.themes) : [];
    return {
      trajectory: {
        version: "1.0",
        platform: "living-codex",
        type: "journal_entry",
        exportedAt: new Date().toISOString(),
        entry: {
          id: entry.id,
          title: entry.title,
          content: entry.content,
          mood: entry.mood,
          themes,
          phase: entry.phase,
          archetypeContext: entry.archetypeContext,
          aiReflection: entry.aiSummary,
          aiPrompt: entry.aiPrompt,
          createdAt: entry.createdAt,
        },
        userContext: {
          primaryArchetype: scoring?.archetypeConstellation?.[0]?.archetype || null,
          phase: scoring?.phase || null,
          spectrumProfile: scoring?.spectrumProfile || null,
          activeWounds: scoring?.activeWounds?.slice(0, 3).map((w: any) => w.wound) || [],
        },
        // Structured for avatar trajectory reader ingestion
        messages: [
          { role: "system", content: `Journal entry titled "${entry.title}" — mood: ${entry.mood || "unspecified"}, themes: ${themes.join(", ") || "none"}, phase: ${entry.phase || "discovery"}` },
          { role: "user", content: entry.content },
          ...(entry.aiSummary ? [{ role: "assistant", content: entry.aiSummary }] : []),
        ],
      },
    };
  }),

  // Create a guide conversation pre-loaded with journal entry context
  journalDiscussWithGuide: customerProc.input(z.object({
    entryId: z.string(),
    guideId: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;

    // Fetch the journal entry
    const [entry] = await db.select().from(schema.codexJournalEntries)
      .where(and(eq(schema.codexJournalEntries.id, input.entryId), eq(schema.codexJournalEntries.userId, u.id)))
      .limit(1);
    if (!entry) throw new TRPCError({ code: "NOT_FOUND", message: "Journal entry not found" });

    const themes = entry.themes ? JSON.parse(entry.themes) : [];

    // Create new conversation titled after the journal entry
    const convId = nanoid();
    await db.insert(schema.codexGuideConversations).values({
      id: convId,
      userId: u.id,
      guideId: input.guideId,
      title: `Journal: ${entry.title}`,
    });

    // Seed the conversation with a context message from the user
    const contextMessage = [
      `I want to discuss my journal entry titled "${entry.title}".`,
      entry.mood ? `I was feeling ${entry.mood} when I wrote it.` : '',
      themes.length > 0 ? `The themes that emerged were: ${themes.join(", ")}.` : '',
      `\n\nHere is what I wrote:\n\n${entry.content}`,
      entry.aiSummary ? `\n\nThe AI reflection on this entry was: "${entry.aiSummary}"` : '',
    ].filter(Boolean).join(' ');

    await db.insert(schema.codexGuideMessages).values({
      id: nanoid(),
      conversationId: convId,
      role: "user",
      content: contextMessage,
    });

    // Get user context for AI response
    const [assessment] = await db.select().from(schema.codexAssessments).where(eq(schema.codexAssessments.userId, u.id)).orderBy(desc(schema.codexAssessments.createdAt)).limit(1);
    let scoring = null;
    if (assessment) {
      const [s] = await db.select().from(schema.codexScorings).where(eq(schema.codexScorings.assessmentId, assessment.id)).limit(1);
      scoring = s ? JSON.parse(s.resultJson) : null;
    }
    const userContext: UserContext = {
      name: u.name || undefined,
      primaryArchetype: scoring?.archetypeConstellation?.[0]?.archetype,
      phase: String(scoring?.phase || scoring?.spectrumProfile?.thresholdPct > 40 ? "4" : "1"),
      activeWounds: scoring?.activeWounds?.slice(0, 3).map((w: any) => w.wound),
    };

    // Generate the guide's initial response to the journal entry
    const chatHistory = [{ role: "user" as const, content: contextMessage }];
    let aiResponse: string;
    try {
      aiResponse = await codexGuideChat(input.guideId, contextMessage, [], userContext, false);
    } catch {
      aiResponse = "I've read your journal entry. I can feel the weight and beauty of what you've shared. What part of this feels most alive for you right now?";
    }

    // Save AI response
    await db.insert(schema.codexGuideMessages).values({
      id: nanoid(),
      conversationId: convId,
      role: "assistant",
      content: aiResponse,
    });
    await db.update(schema.codexGuideConversations).set({ updatedAt: new Date() }).where(eq(schema.codexGuideConversations.id, convId));

    return { conversationId: convId, guideId: input.guideId, response: aiResponse };
  }),

  // Generate an AI-crafted shareable snippet, persist it, and return public share URL
  generateShareSnippet: customerProc.input(z.object({ entryId: z.string() })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;

    const [entry] = await db.select().from(schema.codexJournalEntries)
      .where(and(eq(schema.codexJournalEntries.id, input.entryId), eq(schema.codexJournalEntries.userId, u.id)))
      .limit(1);
    if (!entry) throw new TRPCError({ code: "NOT_FOUND", message: "Journal entry not found" });

    // Check for existing snippet for this entry
    const [existing] = await db.select().from(schema.codexShareSnippets)
      .where(and(eq(schema.codexShareSnippets.journalEntryId, input.entryId), eq(schema.codexShareSnippets.userId, u.id)))
      .limit(1);
    if (existing) {
      const hashtags = existing.hashtags ? JSON.parse(existing.hashtags) : ["#LivingCodex"];
      return {
        snippet: existing.snippet,
        hashtags,
        publicId: existing.publicId,
        shareUrl: `/share/${existing.publicId}`,
        imageUrl: existing.imageUrl || `/api/share-image/${existing.publicId}`,
      };
    }

    const themes = entry.themes ? JSON.parse(entry.themes) : [];

    // Get user's archetype context for the share
    const [assessment] = await db.select().from(schema.codexAssessments).where(eq(schema.codexAssessments.userId, u.id)).orderBy(desc(schema.codexAssessments.createdAt)).limit(1);
    let scoring = null;
    if (assessment) {
      const [s] = await db.select().from(schema.codexScorings).where(eq(schema.codexScorings.assessmentId, assessment.id)).limit(1);
      scoring = s ? JSON.parse(s.resultJson) : null;
    }
    const archetype = scoring?.archetypeConstellation?.[0]?.archetype || null;
    const phase = entry.phase || (scoring?.phase ? String(scoring.phase) : null);

    // Use Gemini to distill the entry into a shareable poetic snippet
    let snippetText = `"${entry.title}" — a reflection from my Living Codex journey.`;
    let hashtagList = ["#LivingCodex", "#InnerWork", "#SelfDiscovery"];

    const { ensureGeminiFromDatabase, getGeminiClient } = await import("./aiService");
    const ready = await ensureGeminiFromDatabase();
    if (ready) {
      const genAI = getGeminiClient();
      if (genAI) {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `You are a poetic distiller for The Living Codex, a self-discovery platform for women.

A woman wrote a private journal entry. Your job is to create a SHAREABLE SNIPPET — a beautiful, poetic, 1-2 sentence distillation that captures the ESSENCE of her reflection without exposing private details.

The snippet should:
- Feel like a powerful quote or affirmation
- Be universally resonant (others should feel it too)
- NOT contain any specific personal details, names, or private information
- Be 15-40 words max
- Feel like something you'd want to share on Instagram or X

Also generate 3-5 relevant hashtags that blend inner-work themes with the Codex brand.

Journal entry title: "${entry.title}"
Mood: ${entry.mood || "unspecified"}
Themes: ${themes.join(", ") || "self-reflection"}
Content excerpt: ${entry.content.substring(0, 500)}
${entry.aiSummary ? `AI reflection: ${entry.aiSummary}` : ""}

Respond in JSON ONLY (no markdown, no code blocks):
{
  "snippet": "the shareable poetic snippet",
  "hashtags": ["#LivingCodex", "#tag2", "#tag3"]
}`;

        try {
          const result = await model.generateContent(prompt);
          const text = result.response.text().trim();
          const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const parsed = JSON.parse(cleaned);
          if (parsed.snippet) snippetText = parsed.snippet;
          if (parsed.hashtags?.length) hashtagList = parsed.hashtags;
        } catch {}
      }
    }

    // Generate a short public ID (URL-safe, 8 chars)
    const publicId = nanoid(8);
    const snippetId = nanoid();

    // Persist the snippet
    await db.insert(schema.codexShareSnippets).values({
      id: snippetId,
      publicId,
      userId: u.id,
      journalEntryId: input.entryId,
      snippet: snippetText,
      hashtags: JSON.stringify(hashtagList),
      phase,
      archetype,
      mood: entry.mood || null,
    });

    return {
      snippet: snippetText,
      hashtags: hashtagList,
      publicId,
      shareUrl: `/share/${publicId}`,
      imageUrl: `/api/share-image/${publicId}`,
    };
  }),

  // ── AI Guide Endpoints ─────────────────────────────────────────────
  guideList: customerProc.query(() => CODEX_GUIDES),

  guideConversations: customerProc.input(z.object({ guideId: z.string() })).query(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    return db.select().from(schema.codexGuideConversations).where(and(
      eq(schema.codexGuideConversations.userId, u.id),
      eq(schema.codexGuideConversations.guideId, input.guideId),
    )).orderBy(desc(schema.codexGuideConversations.updatedAt));
  }),

  guideMessages: customerProc.input(z.object({ conversationId: z.string() })).query(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    // RBAC: Verify the conversation belongs to this user
    const [conv] = await db.select().from(schema.codexGuideConversations)
      .where(and(eq(schema.codexGuideConversations.id, input.conversationId), eq(schema.codexGuideConversations.userId, u.id)))
      .limit(1);
    if (!conv) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
    return db.select().from(schema.codexGuideMessages).where(eq(schema.codexGuideMessages.conversationId, input.conversationId)).orderBy(asc(schema.codexGuideMessages.createdAt));
  }),

  // All conversations across all guides for conversation history view
  guideAllConversations: customerProc.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    const convos = await db.select().from(schema.codexGuideConversations)
      .where(eq(schema.codexGuideConversations.userId, u.id))
      .orderBy(desc(schema.codexGuideConversations.updatedAt));
    // Attach message count per conversation
    const result = await Promise.all(convos.map(async (c) => {
      const msgs = await db.select({ id: schema.codexGuideMessages.id })
        .from(schema.codexGuideMessages)
        .where(eq(schema.codexGuideMessages.conversationId, c.id));
      return { ...c, messageCount: msgs.length };
    }));
    return result;
  }),

  // Export a conversation as a downloadable trajectory JSON
  guideExportConversation: customerProc.input(z.object({ conversationId: z.string() })).query(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    // Verify ownership
    const [conv] = await db.select().from(schema.codexGuideConversations)
      .where(and(eq(schema.codexGuideConversations.id, input.conversationId), eq(schema.codexGuideConversations.userId, u.id)))
      .limit(1);
    if (!conv) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
    const messages = await db.select().from(schema.codexGuideMessages)
      .where(eq(schema.codexGuideMessages.conversationId, input.conversationId))
      .orderBy(asc(schema.codexGuideMessages.createdAt));
    return {
      trajectory: {
        version: "1.0",
        platform: "living-codex",
        exportedAt: new Date().toISOString(),
        conversation: {
          id: conv.id,
          guideId: conv.guideId,
          title: conv.title,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        },
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        })),
      },
    };
  }),

  // Import a trajectory file to resume a past conversation
  guideImportTrajectory: customerProc.input(z.object({
    guideId: z.string(),
    title: z.string(),
    messages: z.array(z.object({
      role: z.string(),
      content: z.string(),
    })),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    const convId = nanoid();
    await db.insert(schema.codexGuideConversations).values({
      id: convId, userId: u.id, guideId: input.guideId,
      title: `[Resumed] ${input.title}`,
    });
    // Insert all trajectory messages into the new conversation
    for (const msg of input.messages) {
      await db.insert(schema.codexGuideMessages).values({
        id: nanoid(), conversationId: convId, role: msg.role, content: msg.content,
      });
    }
    await db.update(schema.codexGuideConversations).set({ updatedAt: new Date() }).where(eq(schema.codexGuideConversations.id, convId));
    return { conversationId: convId, messageCount: input.messages.length };
  }),

  guideSend: customerProc.input(z.object({
    guideId: z.string(),
    conversationId: z.string().optional(),
    message: z.string().min(1),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;

    // Resume recent conversation or create new one
    let convId = input.conversationId;
    let isReturning = false;
    if (!convId) {
      // Check for a recent conversation with this guide (within 24 hours)
      const recentCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [recent] = await db.select()
        .from(schema.codexGuideConversations)
        .where(and(
          eq(schema.codexGuideConversations.userId, u.id),
          eq(schema.codexGuideConversations.guideId, input.guideId),
        ))
        .orderBy(desc(schema.codexGuideConversations.updatedAt))
        .limit(1);

      if (recent && recent.updatedAt && new Date(recent.updatedAt) > recentCutoff) {
        // Resume the recent conversation
        convId = recent.id;
        isReturning = true;
        console.log(`[Codex] Resuming conversation ${convId} for guide ${input.guideId}`);
      } else {
        convId = nanoid();
        await db.insert(schema.codexGuideConversations).values({
          id: convId, userId: u.id, guideId: input.guideId,
          title: input.message.substring(0, 100),
        });
      }
    }

    // Save user message
    await db.insert(schema.codexGuideMessages).values({ id: nanoid(), conversationId: convId, role: "user", content: input.message });

    // ── ESCALATION CHECK: Run every message through crisis detection ──
    const escalation = await interceptUserMessage(u.id, convId, input.message);
    if (escalation.shouldEscalate && escalation.aiResponseOverride) {
      // Save the escalation response as AI message
      const escMsgId = nanoid();
      await db.insert(schema.codexGuideMessages).values({ id: escMsgId, conversationId: convId, role: "assistant", content: escalation.aiResponseOverride });
      await db.update(schema.codexGuideConversations).set({ updatedAt: new Date() }).where(eq(schema.codexGuideConversations.id, convId));
      // Create admin notification for high/critical severity
      if (escalation.severity === "high" || escalation.severity === "critical") {
        try {
          await db.insert(schema.adminNotifications).values({
            type: "system",
            title: `Codex Escalation: ${escalation.severity}`,
            message: `User ${u.name || u.id} triggered ${escalation.triggers.join(", ")} (${escalation.severity}). Action: ${escalation.action}.`,
            link: "/admin/codex/clients",
            priority: escalation.severity === "critical" ? "urgent" : "high",
            relatedId: Number(u.id) || undefined,
            relatedType: "customer",
          }).catch(() => {});
        } catch {}
      }
      return { conversationId: convId, response: escalation.aiResponseOverride, messageId: escMsgId, escalated: true, severity: escalation.severity };
    }

    // Get history
    const history = await db.select().from(schema.codexGuideMessages).where(eq(schema.codexGuideMessages.conversationId, convId)).orderBy(asc(schema.codexGuideMessages.createdAt));

    // Build user context
    const [assessment] = await db.select().from(schema.codexAssessments).where(eq(schema.codexAssessments.userId, u.id)).orderBy(desc(schema.codexAssessments.createdAt)).limit(1);
    let scoring = null;
    if (assessment) {
      const [s] = await db.select().from(schema.codexScorings).where(eq(schema.codexScorings.assessmentId, assessment.id)).limit(1);
      scoring = s ? JSON.parse(s.resultJson) : null;
    }
    const userContext: UserContext = {
      name: u.name || undefined,
      primaryArchetype: scoring?.archetypeConstellation?.[0]?.archetype,
      phase: String(scoring?.phase || scoring?.spectrumProfile?.thresholdPct > 40 ? "4" : "1"),
      activeWounds: scoring?.activeWounds?.slice(0, 3).map((w: any) => w.wound),
      spectrumProfile: scoring?.spectrumProfile,
      integrationIndex: scoring?.integrationIndex,
    };

    // ── CROSS-SESSION MEMORY: Fetch recent messages from previous conversations with this guide ──
    let crossSessionMemory: { role: string; content: string }[] | null = null;
    try {
      const prevConvos = await db.select({ id: schema.codexGuideConversations.id })
        .from(schema.codexGuideConversations)
        .where(and(
          eq(schema.codexGuideConversations.userId, u.id),
          eq(schema.codexGuideConversations.guideId, input.guideId),
        ))
        .orderBy(desc(schema.codexGuideConversations.updatedAt))
        .limit(5);
      const prevIds = prevConvos.map(c => c.id).filter(id => id !== convId);
      if (prevIds.length > 0) {
        const prevMsgs = await db.select({
          role: schema.codexGuideMessages.role,
          content: schema.codexGuideMessages.content,
        })
        .from(schema.codexGuideMessages)
        .where(sql`${schema.codexGuideMessages.conversationId} IN (${sql.join(prevIds.map(id => sql`${id}`), sql`, `)})`)
        .orderBy(desc(schema.codexGuideMessages.createdAt))
        .limit(10);
        if (prevMsgs.length > 0) {
          crossSessionMemory = prevMsgs.reverse();
        }
      }
    } catch (err) {
      console.error('[Codex] Cross-session memory fetch error:', err);
    }

    // ── TRAJECTORY RECALL: Detect if user is asking to remember a past conversation ──
    let recalledTrajectory: { title: string; guideId: string; messages: { role: string; content: string }[] } | null = null;
    const msgLower = input.message.toLowerCase();
    const recallPatterns = [
      /remember (?:our |the |that |when we )?(?:conversation|convo|chat|talk|session|discussion)/i,
      /recall (?:our |the |that |when we )?(?:conversation|convo|chat|talk|session|discussion)/i,
      /go back to (?:our |the |that )?(?:conversation|convo|chat|talk|session)/i,
      /what did we (?:talk|discuss|chat) about/i,
      /pick up where we left off/i,
      /continue (?:our |the |that )?(?:conversation|convo|chat|talk|session)/i,
      /last time we (?:talked|spoke|chatted|discussed)/i,
      /remember when (?:we|i|you)/i,
      /bring up (?:our |the |that )?(?:conversation|convo|chat|talk)/i,
    ];
    const isRecallRequest = recallPatterns.some(p => p.test(input.message));

    if (isRecallRequest) {
      try {
        // Get all user conversations across all guides
        const allConvos = await db.select()
          .from(schema.codexGuideConversations)
          .where(eq(schema.codexGuideConversations.userId, u.id))
          .orderBy(desc(schema.codexGuideConversations.updatedAt));

        // Extract search keywords from the user's message (strip recall phrases)
        const cleanedMsg = msgLower
          .replace(/remember|recall|go back to|continue|bring up|pick up|where we left off|our|the|that|when we|conversation|convo|chat|talk|session|discussion|about|titled|called|from|last time/g, '')
          .trim();
        const searchWords = cleanedMsg.split(/\s+/).filter(w => w.length > 2);

        // Try to extract a date reference
        const datePatterns = [
          /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,  // MM/DD/YYYY or similar
          /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i,
          /(yesterday|today|last\s+week|last\s+month)/i,
        ];
        let dateFilter: Date | null = null;
        for (const dp of datePatterns) {
          const dm = input.message.match(dp);
          if (dm) {
            if (dm[0].toLowerCase() === 'yesterday') dateFilter = new Date(Date.now() - 86400000);
            else if (dm[0].toLowerCase() === 'today') dateFilter = new Date();
            else if (dm[0].toLowerCase().includes('last week')) dateFilter = new Date(Date.now() - 7 * 86400000);
            else if (dm[0].toLowerCase().includes('last month')) dateFilter = new Date(Date.now() - 30 * 86400000);
            else { try { dateFilter = new Date(dm[0]); } catch {} }
            break;
          }
        }

        // Score each conversation for match
        let bestMatch: typeof allConvos[0] | null = null;
        let bestScore = 0;

        for (const conv of allConvos) {
          let score = 0;
          const title = (conv.title || '').toLowerCase();

          // Title keyword matching
          for (const word of searchWords) {
            if (title.includes(word)) score += 3;
          }

          // Date proximity matching
          if (dateFilter && conv.updatedAt) {
            const convDate = new Date(conv.updatedAt);
            const diffMs = Math.abs(convDate.getTime() - dateFilter.getTime());
            const diffDays = diffMs / 86400000;
            if (diffDays < 1) score += 5;
            else if (diffDays < 3) score += 3;
            else if (diffDays < 7) score += 1;
          }

          // Exclude current conversation
          if (conv.id === convId) continue;

          if (score > bestScore) {
            bestScore = score;
            bestMatch = conv;
          }
        }

        // If no keyword/date match, fall back to most recent OTHER conversation
        if (!bestMatch && allConvos.length > 0) {
          bestMatch = allConvos.find(c => c.id !== convId) || null;
        }

        // Load the matched conversation's messages
        if (bestMatch) {
          const recalledMsgs = await db.select()
            .from(schema.codexGuideMessages)
            .where(eq(schema.codexGuideMessages.conversationId, bestMatch.id))
            .orderBy(asc(schema.codexGuideMessages.createdAt));

          if (recalledMsgs.length > 0) {
            recalledTrajectory = {
              title: bestMatch.title || 'Untitled conversation',
              guideId: bestMatch.guideId || 'unknown',
              messages: recalledMsgs.map(m => ({ role: m.role, content: m.content })),
            };
            console.log(`[Codex] Trajectory recall: matched "${bestMatch.title}" (${recalledMsgs.length} msgs, score=${bestScore})`);
          }
        }
      } catch (err) {
        console.error('[Codex] Trajectory recall error:', err);
      }
    }

    // ── CROSS-GUIDE AWARENESS (Doc 05): Fetch recent themes from OTHER guides ──
    let crossGuideContext: { guideId: string; summary: string }[] | null = null;
    try {
      const otherGuideConvos = await db.select({
        guideId: schema.codexGuideConversations.guideId,
        convId: schema.codexGuideConversations.id,
      })
      .from(schema.codexGuideConversations)
      .where(and(
        eq(schema.codexGuideConversations.userId, u.id),
        sql`${schema.codexGuideConversations.guideId} != ${input.guideId}`,
      ))
      .orderBy(desc(schema.codexGuideConversations.updatedAt))
      .limit(4);

      if (otherGuideConvos.length > 0) {
        crossGuideContext = [];
        for (const oc of otherGuideConvos) {
          const recentMsgs = await db.select({ content: schema.codexGuideMessages.content })
            .from(schema.codexGuideMessages)
            .where(and(
              eq(schema.codexGuideMessages.conversationId, oc.convId),
              eq(schema.codexGuideMessages.role, 'user'),
            ))
            .orderBy(desc(schema.codexGuideMessages.createdAt))
            .limit(3);
          if (recentMsgs.length > 0) {
            const themes = recentMsgs.map(m => m.content.substring(0, 80)).join('; ');
            crossGuideContext.push({ guideId: oc.guideId, summary: themes });
          }
        }
        if (crossGuideContext.length === 0) crossGuideContext = null;
      }
    } catch (err) {
      console.error('[Codex] Cross-guide awareness fetch error:', err);
    }

    // ── MATERNAL CONTEXT INJECTION (Doc 07): If user has journal ownership, inject maternal awareness ──
    let maternalContextBlock: string | null = null;
    try {
      const journalOwned = await db.select().from(schema.codexJournalOwnership).where(eq(schema.codexJournalOwnership.userId, u.id));
      if (journalOwned.length > 0) {
        const ownedIds = journalOwned.map(o => o.bookId);
        const [bridgeCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.codexBridgeEntries).where(eq(schema.codexBridgeEntries.userId, u.id));
        const patterns = ownedIds.map(id => BOOK_CATALOG[id]?.maternalLens).filter(Boolean);
        const dominantPattern = (patterns[0] || "present_mother") as MaternalPattern;
        maternalContextBlock = buildMaternalContextBlock(dominantPattern, ownedIds, bridgeCount?.count || 0);
        // Add per-guide maternal DNA
        const guideDNA = GUIDE_MATERNAL_DNA[input.guideId];
        if (guideDNA) maternalContextBlock += "\n\n" + guideDNA;
      }
    } catch (err) {
      console.error('[Codex] Maternal context fetch error:', err);
    }

    // Append maternal context to userContext
    if (maternalContextBlock) {
      userContext.maternalContext = maternalContextBlock;
    }

    // ── JOURNAL AWARENESS: Inject recent journal entries so guides know what user has been reflecting on ──
    try {
      const recentJournals = await db.select({
        title: schema.codexJournalEntries.title,
        content: schema.codexJournalEntries.content,
        mood: schema.codexJournalEntries.mood,
        themes: schema.codexJournalEntries.themes,
        aiSummary: schema.codexJournalEntries.aiSummary,
        createdAt: schema.codexJournalEntries.createdAt,
      })
      .from(schema.codexJournalEntries)
      .where(eq(schema.codexJournalEntries.userId, u.id))
      .orderBy(desc(schema.codexJournalEntries.createdAt))
      .limit(3);

      if (recentJournals.length > 0) {
        const journalLines = recentJournals.map(j => {
          const themes = j.themes ? JSON.parse(j.themes) : [];
          const dateStr = j.createdAt ? new Date(j.createdAt).toLocaleDateString() : 'recent';
          return `[${dateStr}] "${j.title}" (mood: ${j.mood || 'unspecified'}, themes: ${themes.slice(0, 3).join(', ') || 'none'})\nExcerpt: ${j.content.substring(0, 150)}...${j.aiSummary ? `\nReflection: ${j.aiSummary.substring(0, 100)}...` : ''}`;
        }).join('\n\n');

        userContext.journalContext = `JOURNAL AWARENESS (her recent private journal entries — reference themes subtly, never quote directly):\n${journalLines}`;
      }
    } catch (err) {
      console.error('[Codex] Journal awareness fetch error:', err);
    }

    // ── STOCHASTIC VOICE SYSTEM: Non-deterministic register selection + semantic pre-linearization ──
    try {
      const { assembleStochasticBlock } = await import("./lib/codexStochasticVoice");
      const chatHistoryForAnalysis = history.slice(-10).map(m => ({ role: m.role, content: m.content }));

      // Get latest journal mood for context
      let latestJournalMood: string | null = null;
      try {
        const [latestJournal] = await db.select({ mood: schema.codexJournalEntries.mood })
          .from(schema.codexJournalEntries)
          .where(eq(schema.codexJournalEntries.userId, u.id))
          .orderBy(desc(schema.codexJournalEntries.createdAt))
          .limit(1);
        latestJournalMood = latestJournal?.mood || null;
      } catch {}

      const stochastic = assembleStochasticBlock(
        input.message,
        chatHistoryForAnalysis,
        input.guideId,
        {
          phase: userContext.phase,
          mood: latestJournalMood,
          primaryArchetype: userContext.primaryArchetype,
          activeWounds: userContext.activeWounds,
          isReturning,
          sessionDepth: history.length,
        }
      );

      userContext.stochasticBlock = stochastic.promptBlock;
      userContext.stochasticTemperatureDelta = stochastic.temperatureDelta;
    } catch (err) {
      console.error('[Codex] Stochastic voice system error (non-fatal):', err);
    }

    // Get AI response — pass history so AI remembers context, flag if returning user
    const chatHistory = history.map(m => ({ role: m.role as "user" | "assistant", content: m.content }));
    let aiResponse = await codexGuideChat(input.guideId, input.message, chatHistory, userContext, isReturning, recalledTrajectory, crossSessionMemory, crossGuideContext);

    // ── BOUNDARY CHECK: Validate AI response before delivery ──
    const validation = validateAIResponse(aiResponse, input.guideId);
    if (!validation.approved) {
      aiResponse = validation.response;
      console.warn(`[Codex] AI response boundary violation: ${validation.violations.join(", ")}`);
    }

    // Save AI response
    const aiMsgId = nanoid();
    await db.insert(schema.codexGuideMessages).values({ id: aiMsgId, conversationId: convId, role: "assistant", content: aiResponse });
    await db.update(schema.codexGuideConversations).set({ updatedAt: new Date() }).where(eq(schema.codexGuideConversations.id, convId));

    return { conversationId: convId, response: aiResponse, messageId: aiMsgId };
  }),

  // ── User Settings ─────────────────────────────────────────────────
  getSettings: customerProc.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    const [settings] = await db.select().from(schema.codexUserSettings).where(eq(schema.codexUserSettings.userId, u.id)).limit(1);
    return settings || null;
  }),

  updateSettings: customerProc.input(z.object({
    weatherZip: z.string().optional(),
    weatherLat: z.string().optional(),
    weatherLon: z.string().optional(),
    guideStyle: z.string().optional(),
    guideFrequency: z.string().optional(),
    preferredGuideId: z.string().optional(),
    preferredVoiceId: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    const [existing] = await db.select().from(schema.codexUserSettings).where(eq(schema.codexUserSettings.userId, u.id)).limit(1);
    if (existing) {
      await db.update(schema.codexUserSettings).set({ ...input, updatedAt: new Date() }).where(eq(schema.codexUserSettings.id, existing.id));
    } else {
      await db.insert(schema.codexUserSettings).values({ id: nanoid(), userId: u.id, ...input });
    }
    return { success: true };
  }),

  // ── Custom Background Upload ───────────────────────────────────────
  listCustomBackgrounds: customerProc.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    return db.select().from(schema.codexCustomBackgrounds)
      .where(eq(schema.codexCustomBackgrounds.userId, u.id))
      .orderBy(desc(schema.codexCustomBackgrounds.createdAt));
  }),

  uploadCustomBackground: customerProc.input(z.object({
    name: z.string().min(1).max(100),
    imageDataUrl: z.string(), // base64 data URL
    width: z.number().min(1920),
    height: z.number().min(1080),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;

    // Validate minimum resolution
    if (input.width < 1920 || input.height < 1080) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Image must be at least 1920x1080 pixels (high resolution only)" });
    }

    // Validate data URL format
    if (!input.imageDataUrl.startsWith('data:image/')) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid image format" });
    }

    // Estimate file size from base64 (rough: base64 is ~33% larger than binary)
    const base64Part = input.imageDataUrl.split(',')[1] || '';
    const fileSizeKb = Math.round((base64Part.length * 0.75) / 1024);

    // Limit: 10MB max
    if (fileSizeKb > 10240) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Image must be under 10MB" });
    }

    // Limit: max 5 custom backgrounds per user
    const existing = await db.select({ id: schema.codexCustomBackgrounds.id })
      .from(schema.codexCustomBackgrounds)
      .where(eq(schema.codexCustomBackgrounds.userId, u.id));
    if (existing.length >= 5) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Maximum 5 custom backgrounds. Delete one to upload a new one." });
    }

    const id = nanoid();
    await db.insert(schema.codexCustomBackgrounds).values({
      id,
      userId: u.id,
      name: input.name,
      imageUrl: input.imageDataUrl,
      width: input.width,
      height: input.height,
      fileSizeKb,
    });

    return { id, name: input.name, width: input.width, height: input.height };
  }),

  deleteCustomBackground: customerProc.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    await db.delete(schema.codexCustomBackgrounds)
      .where(and(eq(schema.codexCustomBackgrounds.id, input.id), eq(schema.codexCustomBackgrounds.userId, u.id)));
    return { success: true };
  }),

  // ── Weather Proxy (Open-Meteo — free, no API key) ─────────────────
  weather: customerProc.input(z.object({
    lat: z.string(),
    lon: z.string(),
  })).query(async ({ input }) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${input.lat}&longitude=${input.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto&forecast_days=7`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather API failed");
      return await res.json();
    } catch (e: any) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: e.message || "Weather fetch failed" });
    }
  }),

  geocode: publicProcedure.input(z.object({ zip: z.string() })).query(async ({ input }) => {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(input.zip)}&count=1&language=en&format=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Geocode failed");
      const data = await res.json();
      if (!data.results?.length) throw new Error("Location not found");
      return { lat: String(data.results[0].latitude), lon: String(data.results[0].longitude), name: data.results[0].name, country: data.results[0].country };
    } catch (e: any) {
      throw new TRPCError({ code: "BAD_REQUEST", message: e.message || "Geocode failed" });
    }
  }),

  // ── Mirror Report Generator ────────────────────────────────────────
  generateMirrorReport: customerProc.mutation(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    const [assessment] = await db.select().from(schema.codexAssessments).where(eq(schema.codexAssessments.userId, u.id)).orderBy(desc(schema.codexAssessments.createdAt)).limit(1);
    if (!assessment) throw new TRPCError({ code: "NOT_FOUND", message: "No assessment found. Complete an assessment first." });
    const [scoringRow] = await db.select().from(schema.codexScorings).where(eq(schema.codexScorings.assessmentId, assessment.id)).limit(1);
    if (!scoringRow) throw new TRPCError({ code: "NOT_FOUND", message: "No scoring data found." });
    const scoring = JSON.parse(scoringRow.resultJson);

    const scoringResult = {
      userId: u.id,
      assessmentId: assessment.id,
      primaryArchetype: scoring.archetypeConstellation?.[0]?.archetype || "the-silent-flame",
      shadowArchetype: scoring.archetypeConstellation?.[1]?.archetype || "the-fierce-protector",
      primaryWounds: (scoring.activeWounds || []).map((w: any) => ({ name: w.wound, score: w.score || 0 })),
      nervousSystemProfile: { dominantState: scoring.nsProfile?.dominant || "ventral-vagal", score: 0 },
      mirrorPatterns: (scoring.activeMirrors || []).map((m: any) => ({ name: m.mirror, intensity: m.score || 0 })),
      phase: scoring.spectrumProfile?.thresholdPct > 40 ? "phase-4-integration" : "phase-1-awakening",
      spectrumScores: { shadow: scoring.spectrumProfile?.shadowPct || 0, threshold: scoring.spectrumProfile?.thresholdPct || 0, gift: scoring.spectrumProfile?.giftPct || 0 },
      siProportion: scoring.spectrumProfile?.siProportion || 0,
    };

    const routingResult = { phase: scoringResult.phase, pathway: "reclamation", modulePath: "" };
    const report = generateMirrorReport(u.name || "Beloved", scoringResult, routingResult);
    return report;
  }),

  // ── Portal Routing Engine ──────────────────────────────────────────
  getPortalRouting: customerProc.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    const [assessment] = await db.select().from(schema.codexAssessments).where(eq(schema.codexAssessments.userId, u.id)).orderBy(desc(schema.codexAssessments.createdAt)).limit(1);
    if (!assessment) return null;
    const [scoringRow] = await db.select().from(schema.codexScorings).where(eq(schema.codexScorings.assessmentId, assessment.id)).limit(1);
    if (!scoringRow) return null;
    const scoring = JSON.parse(scoringRow.resultJson);

    try {
      const routingInput = {
        primaryArchetype: scoring.archetypeConstellation?.[0]?.archetype || "the-silent-flame",
        shadowArchetype: scoring.archetypeConstellation?.[1]?.archetype || "the-fierce-protector",
        archetypeCluster: (scoring.archetypeConstellation || []).slice(0, 3).map((a: any) => a.archetype),
        woundPrioritySet: (scoring.activeWounds || []).slice(0, 3).map((w: any) => w.wound),
        mirrorMap: (scoring.activeMirrors || []).slice(0, 3).map((m: any) => m.mirror),
        spectrumProfile: {
          shadowPercent: scoring.spectrumProfile?.shadowPct || 0,
          thresholdPercent: scoring.spectrumProfile?.thresholdPct || 0,
          giftPercent: scoring.spectrumProfile?.giftPct || 0,
        },
        siProportion: scoring.spectrumProfile?.siProportion || 0,
        nsProfile: scoring.nsProfile || { ns_freeze: 0, ns_fight: 0, ns_collapse: 0, ns_hypervigilant: 0, ns_regulated: 0.5 },
        phase: scoring.spectrumProfile?.thresholdPct > 40 ? "4" : "1",
        selfPlacedPhase: "1",
        pathwayType: "reclamation",
        depthLevel: "intermediate",
        supportStyle: "general",
        timeCapacity: "moderate",
      };
      return routePortalContent(routingInput);
    } catch (e) {
      console.warn("[Codex] Routing engine error:", e);
      return null;
    }
  }),

  // ── Growth Tracking (Doc 02) ─────────────────────────────────────
  getGrowthDashboard: customerProc.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;

    // Streak
    const [streak] = await db.select().from(schema.codexUserStreaks).where(eq(schema.codexUserStreaks.userId, u.id)).limit(1);

    // Milestones (most recent 20)
    const milestones = await db.select().from(schema.codexMilestones).where(eq(schema.codexMilestones.userId, u.id)).orderBy(desc(schema.codexMilestones.earnedAt)).limit(20);

    // Uncelebrated milestones
    const uncelebrated = milestones.filter(m => m.celebrated === 0);

    // Companion state
    let [companion] = await db.select().from(schema.codexCompanionState).where(eq(schema.codexCompanionState.userId, u.id)).limit(1);
    if (!companion) {
      // Auto-create companion on first visit
      const compId = nanoid();
      await db.insert(schema.codexCompanionState).values({ id: compId, userId: u.id, mood: "calm", energy: 50, gardenLevel: 1 });
      [companion] = await db.select().from(schema.codexCompanionState).where(eq(schema.codexCompanionState.id, compId)).limit(1);
    }

    // Activity counts
    const [journalCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.codexJournalEntries).where(eq(schema.codexJournalEntries.userId, u.id));
    const [convCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.codexGuideConversations).where(eq(schema.codexGuideConversations.userId, u.id));

    return {
      streak: streak || { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, lastActivityDate: null },
      milestones,
      uncelebrated,
      companion,
      stats: {
        journalEntries: journalCount?.count || 0,
        guideSessions: convCount?.count || 0,
      },
    };
  }),

  recordActivity: customerProc.input(z.object({
    activityType: z.enum(["journal_entry", "module_progress", "guide_session", "event_attendance", "reflection_complete"]),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Get or create streak record
    let [streak] = await db.select().from(schema.codexUserStreaks).where(eq(schema.codexUserStreaks.userId, u.id)).limit(1);
    if (!streak) {
      const sid = nanoid();
      await db.insert(schema.codexUserStreaks).values({ id: sid, userId: u.id, currentStreak: 0, longestStreak: 0, totalActiveDays: 0 });
      [streak] = await db.select().from(schema.codexUserStreaks).where(eq(schema.codexUserStreaks.id, sid)).limit(1);
    }

    // Calculate streak
    const lastDate = streak!.lastActivityDate;
    let newStreak = streak!.currentStreak;
    let newLongest = streak!.longestStreak;
    let newTotalDays = streak!.totalActiveDays;
    const newMilestones: { type: string; name: string; narrative: string }[] = [];

    if (lastDate === today) {
      // Already active today — no streak change
    } else {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);

      if (lastDate === yesterday) {
        newStreak += 1;
        newTotalDays += 1;
      } else if (lastDate === twoDaysAgo && streak!.gracePeriodUsed === 0) {
        // Grace period — missed yesterday but came back
        newStreak += 1;
        newTotalDays += 1;
        await db.update(schema.codexUserStreaks).set({ gracePeriodUsed: 1 }).where(eq(schema.codexUserStreaks.id, streak!.id));
      } else {
        // Streak broken — start fresh
        newStreak = 1;
        newTotalDays += 1;
      }

      if (newStreak > newLongest) newLongest = newStreak;

      // Check streak milestones
      const streakThresholds = [7, 14, 30, 60, 90];
      for (const threshold of streakThresholds) {
        if (newStreak === threshold) {
          const [exists] = await db.select({ id: schema.codexMilestones.id }).from(schema.codexMilestones).where(and(eq(schema.codexMilestones.userId, u.id), eq(schema.codexMilestones.milestoneType, `${threshold}_day_streak`))).limit(1);
          if (!exists) {
            const mId = nanoid();
            const name = `${threshold}-Day Flame`;
            const narrative = threshold >= 60
              ? `${threshold} days of showing up for yourself. This is sovereignty in action.`
              : `${threshold} consecutive days of inner work. Your dedication is becoming embodied.`;
            await db.insert(schema.codexMilestones).values({ id: mId, userId: u.id, milestoneType: `${threshold}_day_streak`, displayName: name, narrative });
            newMilestones.push({ type: `${threshold}_day_streak`, name, narrative });
          }
        }
      }
    }

    // Update streak record
    await db.update(schema.codexUserStreaks).set({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActivityDate: today,
      lastActivityType: input.activityType,
      totalActiveDays: newTotalDays,
    }).where(eq(schema.codexUserStreaks.id, streak!.id));

    // Update companion energy
    const [companion] = await db.select().from(schema.codexCompanionState).where(eq(schema.codexCompanionState.userId, u.id)).limit(1);
    if (companion) {
      const newEnergy = Math.min(100, companion.energy + 10);
      const newMood = newEnergy >= 80 ? "radiant" : newEnergy >= 60 ? "content" : newEnergy >= 40 ? "calm" : newEnergy >= 20 ? "restless" : "dormant";
      await db.update(schema.codexCompanionState).set({
        energy: newEnergy,
        mood: newMood,
        lastInteractionAt: new Date(),
        totalInteractions: companion.totalInteractions + 1,
        daysWithoutInteraction: 0,
        gardenLevel: Math.min(5, Math.floor(companion.totalInteractions / 20) + 1),
      }).where(eq(schema.codexCompanionState.id, companion.id));
    }

    return { streak: { currentStreak: newStreak, longestStreak: newLongest, totalActiveDays: newTotalDays }, newMilestones };
  }),

  celebrateMilestone: customerProc.input(z.object({
    milestoneId: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    await db.update(schema.codexMilestones).set({ celebrated: 1 }).where(and(eq(schema.codexMilestones.id, input.milestoneId), eq(schema.codexMilestones.userId, u.id)));
    return { success: true };
  }),

  // ── Journal Ownership Verification (Doc 07) ─────────────────────────
  getJournalOwnership: customerProc.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    const owned = await db.select().from(schema.codexJournalOwnership).where(eq(schema.codexJournalOwnership.userId, u.id));
    return owned;
  }),

  verifyJournalISBN: customerProc.input(z.object({
    isbn: z.string().min(10),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;

    // Valid ISBNs — normalize by stripping spaces/hyphens
    const VALID_ISBNS: Record<string, string> = {
      "9798999333407": "1a", // Book 1A
      "9798999333414": "1b", // Book 1B
      "9798999333421": "1c", // Book 1C
    };
    const normalized = input.isbn.replace(/[-\s]/g, "");
    const bookId = VALID_ISBNS[normalized];

    if (!bookId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "ISBN not recognized. Please check and try again." });
    }

    // Check if already verified
    const [existing] = await db.select().from(schema.codexJournalOwnership)
      .where(and(eq(schema.codexJournalOwnership.userId, u.id), eq(schema.codexJournalOwnership.bookId, bookId)))
      .limit(1);
    if (existing) return { success: true, bookId, alreadyOwned: true };

    await db.insert(schema.codexJournalOwnership).values({
      id: nanoid(), userId: u.id, bookId, verificationType: "isbn", isbn: normalized,
    });
    return { success: true, bookId, alreadyOwned: false };
  }),

  declareJournalOwnership: customerProc.input(z.object({
    bookId: z.enum(["1a", "1b", "1c"]),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;

    const [existing] = await db.select().from(schema.codexJournalOwnership)
      .where(and(eq(schema.codexJournalOwnership.userId, u.id), eq(schema.codexJournalOwnership.bookId, input.bookId)))
      .limit(1);
    if (existing) return { success: true, alreadyOwned: true };

    await db.insert(schema.codexJournalOwnership).values({
      id: nanoid(), userId: u.id, bookId: input.bookId, verificationType: "self_declaration",
    });
    return { success: true, alreadyOwned: false };
  }),

  purchaseJournalBundle: customerProc.input(z.object({
    bookIds: z.array(z.enum(["1a", "1b", "1c"])).min(1),
  })).mutation(async ({ ctx, input }) => {
    const stripe = getStripe();
    if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payment processing not configured" });
    const customer = (ctx as any).customer as schema.Customer;
    const u = (ctx as any).codexUser as schema.CodexUser;
    const baseUrl = process.env.APP_URL || `${ctx.req.protocol}://${ctx.req.get('host')}`;

    const BOOK_CATALOG: Record<string, { name: string; price: number }> = {
      "1a": { name: "Her Mother's Wounds — Book 1A", price: 2497 },
      "1b": { name: "Her Mother's Wounds — Book 1B", price: 2497 },
      "1c": { name: "Her Mother's Wounds — Book 1C", price: 2497 },
    };

    // Bundle discount: 3 books = $59.97 instead of $74.91
    const isFull = input.bookIds.length === 3;
    const lineItems = input.bookIds.map(id => ({
      price_data: {
        currency: "usd",
        product_data: { name: BOOK_CATALOG[id].name, description: "Physical journal + digital Codex companion access" },
        unit_amount: isFull ? 1999 : BOOK_CATALOG[id].price,
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customer.email,
      line_items: lineItems,
      success_url: `${baseUrl}/account/codex?journal_purchase=success&books=${input.bookIds.join(",")}`,
      cancel_url: `${baseUrl}/account/codex`,
      metadata: { customerId: String(customer.id), codexUserId: u.id, type: "journal_bundle", bookIds: input.bookIds.join(",") },
      allow_promotion_codes: true,
      shipping_address_collection: { allowed_countries: ["US", "CA", "GB", "AU"] },
    });
    return { checkoutUrl: session.url };
  }),

  confirmJournalPurchase: customerProc.input(z.object({
    bookIds: z.string(), // comma-separated
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    const books = input.bookIds.split(",").filter(b => ["1a", "1b", "1c"].includes(b));

    for (const bookId of books) {
      const [existing] = await db.select().from(schema.codexJournalOwnership)
        .where(and(eq(schema.codexJournalOwnership.userId, u.id), eq(schema.codexJournalOwnership.bookId, bookId)))
        .limit(1);
      if (!existing) {
        await db.insert(schema.codexJournalOwnership).values({
          id: nanoid(), userId: u.id, bookId, verificationType: "bundled_purchase",
        });
      }
    }
    return { success: true, books };
  }),

  // ── Journal-Codex Bridge System (Doc 07) ─────────────────────────────

  getBridgeCatalog: customerProc.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    const owned = await db.select().from(schema.codexJournalOwnership).where(eq(schema.codexJournalOwnership.userId, u.id));
    const ownedIds = owned.map(o => o.bookId);
    const catalog = Object.values(BOOK_CATALOG).map(book => ({
      ...book,
      owned: ownedIds.includes(book.id),
      sectionMap: BOOK_TO_CODEX_MAP[book.id] || {},
    }));
    return catalog;
  }),

  getBridgeEntries: customerProc.input(z.object({
    bookId: z.string().optional(),
  }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    let query = db.select().from(schema.codexBridgeEntries).where(eq(schema.codexBridgeEntries.userId, u.id));
    if (input?.bookId) {
      query = db.select().from(schema.codexBridgeEntries).where(and(eq(schema.codexBridgeEntries.userId, u.id), eq(schema.codexBridgeEntries.bookId, input.bookId)));
    }
    return query.orderBy(desc(schema.codexBridgeEntries.createdAt));
  }),

  submitBridgeEntry: customerProc.input(z.object({
    bookId: z.enum(["1a", "1b", "1c"]),
    chapterNum: z.number().min(1).max(6),
    entryText: z.string().min(10),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;

    // Verify ownership
    const [ownership] = await db.select().from(schema.codexJournalOwnership)
      .where(and(eq(schema.codexJournalOwnership.userId, u.id), eq(schema.codexJournalOwnership.bookId, input.bookId)))
      .limit(1);
    if (!ownership) throw new TRPCError({ code: "FORBIDDEN", message: "You haven't verified ownership of this journal." });

    const book = BOOK_CATALOG[input.bookId];
    const maternalPattern = (book?.maternalLens || "present_mother") as MaternalPattern;
    const codexSections = BOOK_TO_CODEX_MAP[input.bookId]?.[input.chapterNum] || [];
    const journalSection = `${input.bookId}_ch${input.chapterNum}`;

    // Get user archetype for richer reflection
    let userArchetype: string | undefined;
    try {
      const [assessment] = await db.select().from(schema.codexAssessments).where(eq(schema.codexAssessments.userId, u.id)).orderBy(desc(schema.codexAssessments.createdAt)).limit(1);
      if (assessment) {
        const [s] = await db.select().from(schema.codexScorings).where(eq(schema.codexScorings.assessmentId, assessment.id)).limit(1);
        if (s) {
          const scoring = JSON.parse(s.resultJson);
          userArchetype = scoring?.archetypeConstellation?.[0]?.archetype;
        }
      }
    } catch {}

    // Generate AI bridge reflection
    let aiReflection = '';
    let themes: string[] = [];
    try {
      const { ensureGeminiFromDatabase, getGeminiClient } = await import("./aiService");
      const ready = await ensureGeminiFromDatabase();
      if (ready) {
        const genAI = getGeminiClient();
        if (genAI) {
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
          const prompt = buildBridgeReflectionPrompt(input.entryText, input.bookId, input.chapterNum, maternalPattern, userArchetype);
          const result = await model.generateContent(prompt);
          const text = result.response.text().trim().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const parsed = JSON.parse(text);
          aiReflection = parsed.reflection || '';
          themes = parsed.themes || [];
        }
      }
    } catch (err) {
      console.error('[Codex] Bridge reflection AI error:', err);
    }

    const entryId = nanoid();
    await db.insert(schema.codexBridgeEntries).values({
      id: entryId,
      userId: u.id,
      bookId: input.bookId,
      journalSection,
      codexSection: codexSections[0] || null,
      entryText: input.entryText,
      aiReflection: aiReflection || null,
      themes: themes.length > 0 ? JSON.stringify(themes) : null,
      maternalPattern,
    });

    return { id: entryId, aiReflection, themes, codexSections };
  }),

  getResonanceAnalysis: customerProc.input(z.object({
    bookId: z.enum(["1a", "1b", "1c"]),
  })).query(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;

    // Get existing resonances
    const resonances = await db.select().from(schema.codexMaternalResonance)
      .where(and(eq(schema.codexMaternalResonance.userId, u.id), eq(schema.codexMaternalResonance.bookId, input.bookId)))
      .orderBy(desc(schema.codexMaternalResonance.strength));

    // Get bridge entries for this book
    const entries = await db.select().from(schema.codexBridgeEntries)
      .where(and(eq(schema.codexBridgeEntries.userId, u.id), eq(schema.codexBridgeEntries.bookId, input.bookId)));

    // If no resonances exist but we have entries, generate them
    if (resonances.length === 0 && entries.length >= 2) {
      try {
        const [assessment] = await db.select().from(schema.codexAssessments).where(eq(schema.codexAssessments.userId, u.id)).orderBy(desc(schema.codexAssessments.createdAt)).limit(1);
        let scoring = null;
        if (assessment) {
          const [s] = await db.select().from(schema.codexScorings).where(eq(schema.codexScorings.assessmentId, assessment.id)).limit(1);
          scoring = s ? JSON.parse(s.resultJson) : null;
        }

        const book = BOOK_CATALOG[input.bookId];
        const maternalPattern = (book?.maternalLens || "present_mother") as MaternalPattern;
        const combinedText = entries.map(e => e.entryText).join("\n\n---\n\n");

        const { ensureGeminiFromDatabase, getGeminiClient } = await import("./aiService");
        const ready = await ensureGeminiFromDatabase();
        if (ready) {
          const genAI = getGeminiClient();
          if (genAI) {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = buildResonanceAnalysisPrompt(combinedText, {
              primaryArchetype: scoring?.archetypeConstellation?.[0]?.archetype,
              activeWounds: scoring?.activeWounds?.slice(0, 3).map((w: any) => w.wound),
              phase: scoring?.spectrumProfile?.thresholdPct > 40 ? "threshold" : "discovery",
              spectrumProfile: scoring?.spectrumProfile,
            }, input.bookId, maternalPattern);
            const result = await model.generateContent(prompt);
            const text = result.response.text().trim().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const parsed = JSON.parse(text);

            // Save resonances to DB
            const newResonances = [];
            for (const r of (parsed.resonances || []).slice(0, 5)) {
              const rid = nanoid();
              await db.insert(schema.codexMaternalResonance).values({
                id: rid,
                userId: u.id,
                bookId: input.bookId,
                resonanceType: r.type,
                pattern: r.pattern,
                strength: r.strength,
                aiInsight: r.insight,
              });
              newResonances.push({ id: rid, ...r });
            }
            return { resonances: newResonances, maternalSummary: parsed.maternalSummary || null, entryCount: entries.length };
          }
        }
      } catch (err) {
        console.error('[Codex] Resonance analysis error:', err);
      }
    }

    return { resonances, maternalSummary: null, entryCount: entries.length };
  }),

  getMaternalContext: customerProc.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;

    const owned = await db.select().from(schema.codexJournalOwnership).where(eq(schema.codexJournalOwnership.userId, u.id));
    if (owned.length === 0) return null;

    const ownedBookIds = owned.map(o => o.bookId);
    const [entryCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.codexBridgeEntries).where(eq(schema.codexBridgeEntries.userId, u.id));

    // Determine dominant maternal pattern from owned books
    const patterns = ownedBookIds.map(id => BOOK_CATALOG[id]?.maternalLens).filter(Boolean);
    const dominantPattern = (patterns[0] || "present_mother") as MaternalPattern;

    return {
      pattern: dominantPattern,
      ownedBooks: ownedBookIds,
      bridgeEntryCount: entryCount?.count || 0,
      contextBlock: buildMaternalContextBlock(dominantPattern, ownedBookIds, entryCount?.count || 0),
      guideDNA: GUIDE_MATERNAL_DNA,
    };
  }),

  getLineagePrompts: customerProc.input(z.object({
    bookId: z.enum(["1a", "1b", "1c"]),
    moduleNum: z.number().min(1).max(9),
  })).query(async ({ ctx, input }) => {
    const prompt = LINEAGE_LAYER_PROMPTS[input.bookId]?.[input.moduleNum];
    return {
      prompt: prompt || null,
      bookId: input.bookId,
      moduleNum: input.moduleNum,
    };
  }),

  // Get constants (archetypes, tiers, scroll modules) for frontend
  constants: publicProcedure.query(() => ({
    sectionMeta: SECTION_META,
    archetypes: ARCHETYPES,
    journeyTiers: JOURNEY_TIERS,
    scrollModules: SCROLL_MODULES,
    guides: CODEX_GUIDES,
  })),
});

// ══════════════════════════════════════════════════════════════════════
// COMBINED ROUTER
// ══════════════════════════════════════════════════════════════════════
// ── Public endpoints (no auth required) ─────────────────────────────
const codexPublicRouter = router({
  // Fetch a share snippet by its public ID — for the share landing page
  getShareSnippet: publicProcedure.input(z.object({ publicId: z.string() })).query(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [snippet] = await db.select().from(schema.codexShareSnippets)
      .where(eq(schema.codexShareSnippets.publicId, input.publicId))
      .limit(1);
    if (!snippet) throw new TRPCError({ code: "NOT_FOUND", message: "Share not found" });

    // Increment view count
    await db.update(schema.codexShareSnippets)
      .set({ viewCount: sql`${schema.codexShareSnippets.viewCount} + 1` })
      .where(eq(schema.codexShareSnippets.id, snippet.id));

    const hashtags = snippet.hashtags ? JSON.parse(snippet.hashtags) : ["#LivingCodex"];
    return {
      snippet: snippet.snippet,
      hashtags,
      phase: snippet.phase,
      archetype: snippet.archetype,
      mood: snippet.mood,
      imageUrl: snippet.imageUrl || `/api/share-image/${snippet.publicId}`,
      createdAt: snippet.createdAt,
    };
  }),
});

// ══════════════════════════════════════════════════════════════════════
// PHASE 2: SEALED SCROLL ROUTER
// ══════════════════════════════════════════════════════════════════════
const codexScrollRouter = router({

  // Returns all 5 scroll layers with sealed/unsealed status and unlock progress
  getScrollState: customerProc.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;

    // Gather activity snapshot
    const [journalCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.codexJournalEntries).where(eq(schema.codexJournalEntries.userId, u.id));
    const [guideSessionCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.codexGuideConversations).where(eq(schema.codexGuideConversations.userId, u.id));

    // Check-ins = scroll interactions of type "check_in"
    const [checkInCount] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.codexScrollInteractions)
      .where(and(eq(schema.codexScrollInteractions.userId, u.id), eq(schema.codexScrollInteractions.interactionType, "check_in")));

    // Completed challenges
    const [challengeCount] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.codexRealWorldChallenges)
      .where(and(eq(schema.codexRealWorldChallenges.userId, u.id), sql`${schema.codexRealWorldChallenges.completedAt} IS NOT NULL`));

    // Days since first activity (assessment creation)
    const [firstAssessment] = await db.select({ createdAt: schema.codexAssessments.createdAt })
      .from(schema.codexAssessments).where(eq(schema.codexAssessments.userId, u.id))
      .orderBy(asc(schema.codexAssessments.createdAt)).limit(1);
    const daysSinceFirst = firstAssessment
      ? Math.floor((Date.now() - new Date(firstAssessment.createdAt).getTime()) / 86400000)
      : 0;

    // Existing unlocked layers
    const existingLayers = await db.select().from(schema.codexScrollLayers).where(eq(schema.codexScrollLayers.userId, u.id));
    const unlockedLayerNums = existingLayers.filter(l => l.sealed === 0).map(l => l.layer as ScrollLayerNumber);

    const activity: UserActivitySnapshot = {
      journalCount: journalCount?.count || 0,
      guideSessionCount: guideSessionCount?.count || 0,
      checkInCount: checkInCount?.count || 0,
      completedChallengeCount: challengeCount?.count || 0,
      daysSinceFirstActivity: daysSinceFirst,
      layer2Unlocked: unlockedLayerNums.includes(2),
      layer3Unlocked: unlockedLayerNums.includes(3),
      layer4Unlocked: unlockedLayerNums.includes(4),
    };

    // Build state for all 5 layers
    const layers = ([1, 2, 3, 4, 5] as ScrollLayerNumber[]).map(layer => {
      const meta = SCROLL_LAYER_META[layer];
      const existing = existingLayers.find(l => l.layer === layer);
      const { unlocked, conditions } = evaluateScrollUnlock(layer, activity, unlockedLayerNums);

      return {
        layer,
        title: meta.title,
        invocation: meta.invocation,
        unlockDescription: meta.unlockDescription,
        sealed: existing ? existing.sealed === 1 : !unlocked,
        unlockedAt: existing?.unlockedAt?.toISOString() || null,
        viewedAt: existing?.viewedAt?.toISOString() || null,
        unlockProgress: conditions,
        contentData: existing?.contentData ? JSON.parse(existing.contentData) : null,
        justUnlocked: unlocked && (!existing || existing.sealed === 1),
      };
    });

    return { layers, activity };
  }),

  // Records a scroll interaction (check-in or reflection), checks if new layer unlock triggered
  interactWithScrollLayer: customerProc.input(z.object({
    layer: z.number().min(1).max(5),
    sectionId: z.string().optional(),
    interactionType: z.enum(["check_in", "reflection", "viewed"]),
    responseText: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;

    // Find the layer row (or create it for layer 1 if first visit)
    let [layerRow] = await db.select().from(schema.codexScrollLayers)
      .where(and(eq(schema.codexScrollLayers.userId, u.id), eq(schema.codexScrollLayers.layer, input.layer)))
      .limit(1);

    if (!layerRow) {
      const newId = nanoid();
      await db.insert(schema.codexScrollLayers).values({
        id: newId, userId: u.id, layer: input.layer,
        sealed: input.layer === 1 ? 0 : 1, // Layer 1 always open
        unlockedAt: input.layer === 1 ? new Date() : null,
      });
      [layerRow] = await db.select().from(schema.codexScrollLayers)
        .where(eq(schema.codexScrollLayers.id, newId)).limit(1);
    }

    if (!layerRow) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Record the interaction
    await db.insert(schema.codexScrollInteractions).values({
      id: nanoid(),
      userId: u.id,
      layerId: layerRow.id,
      sectionId: input.sectionId || null,
      interactionType: input.interactionType,
      responseText: input.responseText || null,
    });

    // Mark viewed if not already
    if (input.interactionType === "viewed" && !layerRow.viewedAt) {
      await db.update(schema.codexScrollLayers).set({ viewedAt: new Date() }).where(eq(schema.codexScrollLayers.id, layerRow.id));
    }

    return { success: true };
  }),

  // Evaluates unlock conditions and unseals layers that are newly eligible
  checkScrollUnlock: customerProc.mutation(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;

    // Build activity snapshot (same as getScrollState)
    const [journalCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.codexJournalEntries).where(eq(schema.codexJournalEntries.userId, u.id));
    const [guideSessionCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.codexGuideConversations).where(eq(schema.codexGuideConversations.userId, u.id));
    const [checkInCount] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.codexScrollInteractions)
      .where(and(eq(schema.codexScrollInteractions.userId, u.id), eq(schema.codexScrollInteractions.interactionType, "check_in")));
    const [challengeCount] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.codexRealWorldChallenges)
      .where(and(eq(schema.codexRealWorldChallenges.userId, u.id), sql`${schema.codexRealWorldChallenges.completedAt} IS NOT NULL`));
    const [firstAssessment] = await db.select({ createdAt: schema.codexAssessments.createdAt })
      .from(schema.codexAssessments).where(eq(schema.codexAssessments.userId, u.id))
      .orderBy(asc(schema.codexAssessments.createdAt)).limit(1);
    const daysSinceFirst = firstAssessment
      ? Math.floor((Date.now() - new Date(firstAssessment.createdAt).getTime()) / 86400000)
      : 0;

    const existingLayers = await db.select().from(schema.codexScrollLayers).where(eq(schema.codexScrollLayers.userId, u.id));
    const unlockedLayerNums = existingLayers.filter(l => l.sealed === 0).map(l => l.layer as ScrollLayerNumber);

    const activity: UserActivitySnapshot = {
      journalCount: journalCount?.count || 0,
      guideSessionCount: guideSessionCount?.count || 0,
      checkInCount: checkInCount?.count || 0,
      completedChallengeCount: challengeCount?.count || 0,
      daysSinceFirstActivity: daysSinceFirst,
      layer2Unlocked: unlockedLayerNums.includes(2),
      layer3Unlocked: unlockedLayerNums.includes(3),
      layer4Unlocked: unlockedLayerNums.includes(4),
    };

    // Get user's codex signature for content generation
    const [assessment] = await db.select().from(schema.codexAssessments)
      .where(eq(schema.codexAssessments.userId, u.id)).orderBy(desc(schema.codexAssessments.createdAt)).limit(1);
    let scoring: any = null;
    if (assessment) {
      const [s] = await db.select().from(schema.codexScorings).where(eq(schema.codexScorings.assessmentId, assessment.id)).limit(1);
      if (s) scoring = JSON.parse(s.resultJson);
    }

    const codexSignature: CodexSignature = {
      primaryArchetype: scoring?.archetypeConstellation?.[0]?.archetype || "The Silent Flame",
      shadowArchetype: scoring?.archetypeConstellation?.[1]?.archetype,
      activeWounds: (scoring?.activeWounds || []).slice(0, 3).map((w: any) => w.wound || w),
      spectrumProfile: scoring?.spectrumProfile || { shadowPct: 33, thresholdPct: 34, giftPct: 33 },
      phase: String(scoring?.phase || "1"),
      name: u.name || undefined,
    };

    const newlyUnlocked: number[] = [];

    for (const layer of [1, 2, 3, 4, 5] as ScrollLayerNumber[]) {
      const { unlocked } = evaluateScrollUnlock(layer, activity, unlockedLayerNums);
      if (!unlocked) continue;

      const existing = existingLayers.find(l => l.layer === layer);

      if (!existing) {
        // Create row and generate content
        const content = await generateLayerContent(layer, codexSignature);
        const newId = nanoid();
        await db.insert(schema.codexScrollLayers).values({
          id: newId, userId: u.id, layer,
          sealed: 0,
          unlockedAt: new Date(),
          unlockProgress: JSON.stringify(evaluateScrollUnlock(layer, activity, unlockedLayerNums).conditions),
          contentData: content ? JSON.stringify(content) : null,
        });
        newlyUnlocked.push(layer);
        unlockedLayerNums.push(layer);
      } else if (existing.sealed === 1) {
        // Unseal existing row and generate content
        const content = await generateLayerContent(layer, codexSignature);
        await db.update(schema.codexScrollLayers).set({
          sealed: 0,
          unlockedAt: new Date(),
          contentData: content ? JSON.stringify(content) : null,
        }).where(eq(schema.codexScrollLayers.id, existing.id));
        newlyUnlocked.push(layer);
        unlockedLayerNums.push(layer);
      }
    }

    return { newlyUnlocked, totalUnlocked: unlockedLayerNums.length };
  }),
});

// ══════════════════════════════════════════════════════════════════════
// PHASE 3: GUIDED REFLECTION DIALOGUE ROUTER
// ══════════════════════════════════════════════════════════════════════
const codexDialogueRouter = router({

  // Creates a new dialogue session and returns the first guide prompt
  startDialogue: customerProc.input(z.object({
    type: z.enum(["archetype_exploration", "wound_inquiry", "shadow_work", "pattern_recognition", "embodiment_check_in", "integration_review"]),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;

    // Get archetype context
    const [assessment] = await db.select().from(schema.codexAssessments)
      .where(eq(schema.codexAssessments.userId, u.id)).orderBy(desc(schema.codexAssessments.createdAt)).limit(1);
    let scoring: any = null;
    if (assessment) {
      const [s] = await db.select().from(schema.codexScorings).where(eq(schema.codexScorings.assessmentId, assessment.id)).limit(1);
      if (s) scoring = JSON.parse(s.resultJson);
    }

    const archetypeContext: ArchetypeContext = {
      primaryArchetype: scoring?.archetypeConstellation?.[0]?.archetype || "The Silent Flame",
      shadowArchetype: scoring?.archetypeConstellation?.[1]?.archetype,
      activeWounds: (scoring?.activeWounds || []).slice(0, 3).map((w: any) => w.wound || w),
      spectrumProfile: scoring?.spectrumProfile || { shadowPct: 33, thresholdPct: 34, giftPct: 33 },
      phase: String(scoring?.phase || "1"),
      name: u.name || undefined,
    };

    const { firstPrompt } = await initiateDialogue(u.id, input.type as DialogueType, archetypeContext);

    // Create session
    const sessionId = nanoid();
    await db.insert(schema.codexDialogueSessions).values({
      id: sessionId, userId: u.id, type: input.type, exchangeCount: 0, status: "active",
    });

    // Store first exchange (guide prompt only, no user response yet)
    await db.insert(schema.codexDialogueExchanges).values({
      id: nanoid(), sessionId, exchangeIndex: 0, guidePrompt: firstPrompt,
    });

    return { sessionId, firstPrompt, archetypeContext: { primaryArchetype: archetypeContext.primaryArchetype, phase: archetypeContext.phase } };
  }),

  // Processes a user response, returns guide reflection + possible revelation/challenge
  submitDialogueResponse: customerProc.input(z.object({
    sessionId: z.string(),
    userResponse: z.string().min(1).max(3000),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;

    // Verify session belongs to user
    const [session] = await db.select().from(schema.codexDialogueSessions)
      .where(and(eq(schema.codexDialogueSessions.id, input.sessionId), eq(schema.codexDialogueSessions.userId, u.id)))
      .limit(1);
    if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
    if (session.status === "completed") throw new TRPCError({ code: "BAD_REQUEST", message: "Session already completed" });

    // Load all exchanges for this session
    const allExchanges = await db.select().from(schema.codexDialogueExchanges)
      .where(eq(schema.codexDialogueExchanges.sessionId, input.sessionId))
      .orderBy(asc(schema.codexDialogueExchanges.exchangeIndex));

    // The most recent exchange is the one awaiting user response
    const currentExchange = allExchanges[allExchanges.length - 1];
    if (!currentExchange) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Get archetype context
    const [assessment] = await db.select().from(schema.codexAssessments)
      .where(eq(schema.codexAssessments.userId, u.id)).orderBy(desc(schema.codexAssessments.createdAt)).limit(1);
    let scoring: any = null;
    if (assessment) {
      const [s] = await db.select().from(schema.codexScorings).where(eq(schema.codexScorings.assessmentId, assessment.id)).limit(1);
      if (s) scoring = JSON.parse(s.resultJson);
    }
    const archetypeContext: ArchetypeContext = {
      primaryArchetype: scoring?.archetypeConstellation?.[0]?.archetype || "The Silent Flame",
      shadowArchetype: scoring?.archetypeConstellation?.[1]?.archetype,
      activeWounds: (scoring?.activeWounds || []).slice(0, 3).map((w: any) => w.wound || w),
      spectrumProfile: scoring?.spectrumProfile || { shadowPct: 33, thresholdPct: 34, giftPct: 33 },
      phase: String(scoring?.phase || "1"),
      name: u.name || undefined,
    };

    // Build previous exchanges for context
    const previousExchanges: DialogueExchange[] = allExchanges.map(e => ({
      guidePrompt: e.guidePrompt,
      userResponse: e.userResponse || undefined,
      guideReflection: e.guideReflection || undefined,
      depthScore: e.depthScore ? parseFloat(e.depthScore) : undefined,
      patternDetected: e.patternDetected || undefined,
    }));

    const processed = await processUserResponse(
      input.sessionId,
      currentExchange.exchangeIndex,
      currentExchange.guidePrompt,
      input.userResponse,
      previousExchanges.slice(0, -1), // exclude current (unanswered) exchange
      archetypeContext,
      5 // max exchanges
    );

    // Update current exchange with user response and guide reflection
    await db.update(schema.codexDialogueExchanges).set({
      userResponse: input.userResponse,
      guideReflection: processed.guideReflection,
      depthScore: String(processed.depthScore.toFixed(2)),
      patternDetected: processed.patternDetected || null,
    }).where(eq(schema.codexDialogueExchanges.id, currentExchange.id));

    // Track max depth
    const currentMaxDepth = parseFloat(session.maxDepthReached || "0");
    const newMaxDepth = Math.max(currentMaxDepth, processed.depthScore);

    // Save micro-revelation if present
    let revelationId: string | null = null;
    if (processed.microRevelation) {
      revelationId = nanoid();
      await db.insert(schema.codexMicroRevelations).values({
        id: revelationId,
        userId: u.id,
        sessionId: input.sessionId,
        content: processed.microRevelation.content,
        type: processed.microRevelation.type,
        archetypeRelevance: processed.microRevelation.archetypeRelevance || null,
      });
    }

    let challenge: { id: string; text: string; difficulty: string; timeframe: string; intentDescription: string } | null = null;

    if (processed.shouldIssueChallenge) {
      const issued = issueRealWorldChallenge(archetypeContext, newMaxDepth);
      const challengeId = nanoid();
      await db.insert(schema.codexRealWorldChallenges).values({
        id: challengeId,
        userId: u.id,
        sessionId: input.sessionId,
        challengeText: issued.challengeText,
        difficulty: issued.difficulty,
        timeframe: issued.timeframe,
        archetypeTarget: issued.archetypeTarget,
        intentDescription: issued.intentDescription,
      });

      // Link challenge to session
      await db.update(schema.codexDialogueSessions).set({
        challengeId, status: "challenge_pending", exchangeCount: currentExchange.exchangeIndex + 1,
        maxDepthReached: String(newMaxDepth.toFixed(2)),
      }).where(eq(schema.codexDialogueSessions.id, input.sessionId));

      challenge = {
        id: challengeId,
        text: issued.challengeText,
        difficulty: issued.difficulty,
        timeframe: issued.timeframe,
        intentDescription: issued.intentDescription || "",
      };
    } else {
      // Create the next exchange row (guide prompt = reflection becomes next guide prompt if session continues)
      const nextExchangeIndex = currentExchange.exchangeIndex + 1;
      if (!processed.sessionComplete) {
        await db.insert(schema.codexDialogueExchanges).values({
          id: nanoid(), sessionId: input.sessionId, exchangeIndex: nextExchangeIndex,
          guidePrompt: processed.guideReflection,
        });
      }

      await db.update(schema.codexDialogueSessions).set({
        exchangeCount: nextExchangeIndex,
        maxDepthReached: String(newMaxDepth.toFixed(2)),
        status: processed.sessionComplete ? "completed" : "active",
      }).where(eq(schema.codexDialogueSessions.id, input.sessionId));
    }

    return {
      guideReflection: processed.guideReflection,
      depthScore: processed.depthScore,
      patternDetected: processed.patternDetected,
      microRevelation: processed.microRevelation,
      challenge,
      sessionComplete: processed.sessionComplete || processed.shouldIssueChallenge,
    };
  }),

  // Returns the active real-world challenge for a user (most recent unresolved)
  getActiveChallenge: customerProc.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;

    const [challenge] = await db.select().from(schema.codexRealWorldChallenges)
      .where(and(
        eq(schema.codexRealWorldChallenges.userId, u.id),
        sql`${schema.codexRealWorldChallenges.completedAt} IS NULL`
      ))
      .orderBy(desc(schema.codexRealWorldChallenges.createdAt))
      .limit(1);

    if (!challenge) return null;

    return {
      id: challenge.id,
      challengeText: challenge.challengeText,
      difficulty: challenge.difficulty,
      timeframe: challenge.timeframe,
      archetypeTarget: challenge.archetypeTarget,
      intentDescription: challenge.intentDescription,
      createdAt: challenge.createdAt.toISOString(),
    };
  }),

  // Processes user's report back on a challenge
  submitChallengeReport: customerProc.input(z.object({
    challengeId: z.string(),
    report: z.string().min(1).max(5000),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;

    const [challenge] = await db.select().from(schema.codexRealWorldChallenges)
      .where(and(eq(schema.codexRealWorldChallenges.id, input.challengeId), eq(schema.codexRealWorldChallenges.userId, u.id)))
      .limit(1);
    if (!challenge) throw new TRPCError({ code: "NOT_FOUND", message: "Challenge not found" });

    // Get archetype context
    const [assessment] = await db.select().from(schema.codexAssessments)
      .where(eq(schema.codexAssessments.userId, u.id)).orderBy(desc(schema.codexAssessments.createdAt)).limit(1);
    let scoring: any = null;
    if (assessment) {
      const [s] = await db.select().from(schema.codexScorings).where(eq(schema.codexScorings.assessmentId, assessment.id)).limit(1);
      if (s) scoring = JSON.parse(s.resultJson);
    }
    const archetypeContext: ArchetypeContext = {
      primaryArchetype: scoring?.archetypeConstellation?.[0]?.archetype || challenge.archetypeTarget,
      shadowArchetype: scoring?.archetypeConstellation?.[1]?.archetype,
      activeWounds: (scoring?.activeWounds || []).slice(0, 3).map((w: any) => w.wound || w),
      spectrumProfile: scoring?.spectrumProfile || { shadowPct: 33, thresholdPct: 34, giftPct: 33 },
      phase: String(scoring?.phase || "1"),
      name: u.name || undefined,
    };

    const { guideResponse, depth } = await processReportBack(
      challenge.challengeText, input.report, archetypeContext
    );

    await db.update(schema.codexRealWorldChallenges).set({
      reportBackText: input.report,
      guideResponse,
      reportDepth: String(depth.toFixed(2)),
      completedAt: new Date(),
    }).where(eq(schema.codexRealWorldChallenges.id, input.challengeId));

    // Update linked session to completed
    if (challenge.sessionId) {
      await db.update(schema.codexDialogueSessions).set({ status: "completed" })
        .where(eq(schema.codexDialogueSessions.id, challenge.sessionId));
    }

    return { guideResponse, depth };
  }),

  // Returns all micro-revelations for the user (unviewed ones first)
  getMicroRevelations: customerProc.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    const revelations = await db.select().from(schema.codexMicroRevelations)
      .where(eq(schema.codexMicroRevelations.userId, u.id))
      .orderBy(asc(schema.codexMicroRevelations.viewed), desc(schema.codexMicroRevelations.createdAt));
    return revelations.map(r => ({
      id: r.id, content: r.content, type: r.type,
      archetypeRelevance: r.archetypeRelevance, viewed: r.viewed === 1,
      createdAt: r.createdAt.toISOString(),
    }));
  }),

  // Marks a micro-revelation as viewed
  markRevelationViewed: customerProc.input(z.object({ revelationId: z.string() })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    await db.update(schema.codexMicroRevelations).set({ viewed: 1 })
      .where(and(eq(schema.codexMicroRevelations.id, input.revelationId), eq(schema.codexMicroRevelations.userId, u.id)));
    return { success: true };
  }),
});

// ── PHASE 4: LIVING MIRROR SUB-ROUTER ────────────────────────────────

const codexMirrorRouter = router({
  // Returns all addendums for the current user (unviewed first)
  getAddendums: customerProc.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    const addendums = await db.select().from(schema.codexMirrorAddendums)
      .where(eq(schema.codexMirrorAddendums.userId, u.id))
      .orderBy(asc(schema.codexMirrorAddendums.viewedAt), desc(schema.codexMirrorAddendums.createdAt));
    return addendums.map(a => ({
      id: a.id,
      type: a.type,
      content: a.content,
      patternShiftData: a.patternShiftData ? JSON.parse(a.patternShiftData) : null,
      viewed: !!a.viewedAt,
      createdAt: a.createdAt.toISOString(),
    }));
  }),

  // Returns mirror snapshots over time (the user's pattern timeline)
  getTimeline: customerProc.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;
    const snapshots = await db.select().from(schema.codexMirrorSnapshots)
      .where(eq(schema.codexMirrorSnapshots.userId, u.id))
      .orderBy(desc(schema.codexMirrorSnapshots.createdAt))
      .limit(50);
    return snapshots.map(s => ({
      id: s.id,
      sourceType: s.sourceType,
      sourceId: s.sourceId,
      dominantThemes: s.dominantThemes ? JSON.parse(s.dominantThemes) : [],
      emotionalTone: s.emotionalTone ? JSON.parse(s.emotionalTone) : null,
      avoidancePatterns: s.avoidancePatterns,
      growthIndicators: s.growthIndicators,
      userLanguage: s.userLanguage ? JSON.parse(s.userLanguage) : [],
      createdAt: s.createdAt.toISOString(),
    }));
  }),

  // Triggers a temporal reflection and returns the generated content
  generateTemporalReflection: customerProc
    .input(z.object({ timeframe: z.enum(["7_days", "14_days", "30_days"]) }))
    .mutation(async ({ ctx, input }) => {
      const u = (ctx as any).codexUser as schema.CodexUser;
      const content = await generateTemporalReflection(u.id, input.timeframe as Timeframe);
      if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Not enough data for reflection" });
      return { content };
    }),

  // Marks an addendum as viewed
  markAddendumViewed: customerProc
    .input(z.object({ addendumId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const u = (ctx as any).codexUser as schema.CodexUser;
      await db.update(schema.codexMirrorAddendums).set({ viewedAt: new Date() })
        .where(and(eq(schema.codexMirrorAddendums.id, input.addendumId), eq(schema.codexMirrorAddendums.userId, u.id)));
      return { success: true };
    }),
});

// ── PHASE 5: CHECK-IN SUB-ROUTER ──────────────────────────────────────

const codexCheckInRouter = router({
  // Generates personalized check-in questions for the current user
  start: customerProc
    .input(z.object({ type: z.enum(["daily", "weekly"]).default("daily") }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const u = (ctx as any).codexUser as schema.CodexUser;

      // Get archetype from latest scoring
      const [scoring] = await db.select().from(schema.codexScorings)
        .where(eq(schema.codexScorings.userId, u.id))
        .orderBy(desc(schema.codexScorings.createdAt)).limit(1);
      const scoreData = scoring?.resultJson ? JSON.parse(scoring.resultJson) : {};
      const archetype: string = scoreData?.archetypeConstellation?.primary?.name || "The Silent Flame";

      // Get recent patterns for dynamic question
      const recentPatterns = await db.select().from(schema.codexCheckInPatterns)
        .where(eq(schema.codexCheckInPatterns.userId, u.id))
        .orderBy(desc(schema.codexCheckInPatterns.frequency)).limit(3);
      const patternTexts = recentPatterns.map(p => p.pattern);

      const questions = await generateCheckInPrompts(u.id, archetype, patternTexts);

      // Create check-in record
      const checkInId = nanoid();
      await db.insert(schema.codexCheckIns).values({
        id: checkInId,
        userId: u.id,
        type: input.type,
        questionsData: JSON.stringify(questions),
      });

      return { checkInId, questions };
    }),

  // Processes submitted check-in responses
  submit: customerProc
    .input(z.object({
      checkInId: z.string(),
      responses: z.array(z.object({ questionId: z.string(), response: z.string() })),
    }))
    .mutation(async ({ ctx, input }) => {
      const u = (ctx as any).codexUser as schema.CodexUser;
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify check-in belongs to user
      const [checkIn] = await db.select().from(schema.codexCheckIns)
        .where(and(eq(schema.codexCheckIns.id, input.checkInId), eq(schema.codexCheckIns.userId, u.id))).limit(1);
      if (!checkIn) throw new TRPCError({ code: "NOT_FOUND" });

      const { patternsExtracted, scrollUnlockTriggered } = await processCheckIn(
        u.id, input.checkInId, input.responses as CheckInResponse[]
      );

      return { patternsExtracted, scrollUnlockTriggered };
    }),

  // Returns paginated check-in history
  getHistory: customerProc
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const u = (ctx as any).codexUser as schema.CodexUser;
      const checkIns = await db.select().from(schema.codexCheckIns)
        .where(eq(schema.codexCheckIns.userId, u.id))
        .orderBy(desc(schema.codexCheckIns.createdAt))
        .limit(input.limit);
      return checkIns.map(c => ({
        id: c.id,
        type: c.type,
        questions: c.questionsData ? JSON.parse(c.questionsData) : [],
        responses: c.responsesData ? JSON.parse(c.responsesData) : null,
        patternsExtracted: c.patternsExtracted ? JSON.parse(c.patternsExtracted) : [],
        completed: !!c.completedAt,
        completedAt: c.completedAt?.toISOString() || null,
        createdAt: c.createdAt.toISOString(),
      }));
    }),

  // Returns aggregated pattern trends for the user
  getPatterns: customerProc.query(async ({ ctx }) => {
    const u = (ctx as any).codexUser as schema.CodexUser;
    const patterns = await getCheckInPatterns(u.id);
    return patterns.map(p => ({
      id: p.id,
      pattern: p.pattern,
      frequency: p.frequency,
      trend: p.trend,
      relatedArchetype: p.relatedArchetype,
      firstDetectedAt: p.firstDetectedAt.toISOString(),
      lastDetectedAt: p.lastDetectedAt.toISOString(),
    }));
  }),
});

// ══════════════════════════════════════════════════════════════════════
// ADAPTIVE ASSESSMENT ROUTER  (Phase 1)
// ══════════════════════════════════════════════════════════════════════

/** Loads question signals from DB; falls back to computing from codexAnswers. */
async function loadQuestionSignals(db: Awaited<ReturnType<typeof getDb>>): Promise<QuestionSignal[]> {
  if (!db) return [];

  const dbSignals = await db.select().from(schema.codexQuestionSignals);
  if (dbSignals.length > 0) {
    return dbSignals.map(s => ({
      questionId: s.questionId,
      sectionNum: s.sectionNum,
      archetypeWeights: JSON.parse(s.archetypeWeights),
      woundWeights: JSON.parse(s.woundWeights),
      informationGain: parseFloat(s.informationGain ?? "0"),
      asked: false,
    }));
  }

  // Fallback: compute from raw answers grouped by question
  const allQuestions = await db.select().from(schema.codexQuestions);
  const allAnswers = await db.select().from(schema.codexAnswers);

  const answersByQuestion = new Map<string, typeof allAnswers>();
  for (const ans of allAnswers) {
    const arr = answersByQuestion.get(ans.questionId) ?? [];
    arr.push(ans);
    answersByQuestion.set(ans.questionId, arr);
  }

  const signals: QuestionSignal[] = [];
  for (const q of allQuestions) {
    if (q.isGhost || q.isOpenEnded) continue;
    const answers = answersByQuestion.get(q.id) ?? [];
    signals.push(buildSignalFromAnswers(q.id, q.sectionNum, answers));
  }
  return signals;
}

const codexAdaptiveRouter = router({
  /**
   * Starts a new adaptive session.
   * Creates a codex_assessment record + a codex_adaptive_sessions record,
   * then returns the first 5 broad-signal questions.
   */
  start: customerProc
    .input(z.object({
      config: z.object({
        broadSignalCount: z.number().default(5),
        confidenceThreshold: z.number().default(0.75),
        entropyThreshold: z.number().default(1.2),
        minQuestions: z.number().default(25),
        maxQuestions: z.number().default(75),
        eliminationThreshold: z.number().default(0.05),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const u = (ctx as any).codexUser as schema.CodexUser;

      const cfg: Partial<AdaptiveConfig> = input.config ?? {};

      // Create parent assessment record
      const assessmentId = nanoid();
      await db.insert(schema.codexAssessments).values({
        id: assessmentId,
        userId: u.id,
        status: "in_progress",
        startedAt: new Date(),
      });

      // Initialize Bayesian state
      const state = initializeAdaptiveState(u.id, cfg);

      // Load question pool
      const questionPool = await loadQuestionSignals(db);

      // Select first broadSignalCount questions
      const broadCount = cfg.broadSignalCount ?? DEFAULT_ADAPTIVE_CONFIG.broadSignalCount;
      const firstQuestions: QuestionSignal[] = [];
      let tempState = { ...state };
      for (let i = 0; i < broadCount && firstQuestions.length < broadCount; i++) {
        const next = selectNextQuestion(tempState, questionPool, cfg);
        if (!next) break;
        firstQuestions.push(next);
        // Mark as asked so next selection skips it
        tempState = { ...tempState, askedQuestions: [...tempState.askedQuestions, next.questionId] };
      }

      // Create adaptive session
      await db.insert(schema.codexAdaptiveSessions).values({
        id: state.sessionId,
        userId: u.id,
        assessmentId,
        state: JSON.stringify(state),
        config: input.config ? JSON.stringify(input.config) : null,
        phase: "broad_signal",
        questionsAsked: 0,
        terminated: 0,
        startedAt: new Date(),
      });

      // Fetch full question detail for first batch
      const questionIds = firstQuestions.map(q => q.questionId);
      const questionDetails = await db.select().from(schema.codexQuestions)
        .where(sql`${schema.codexQuestions.id} IN (${sql.join(questionIds.map(id => sql`${id}`), sql`, `)})`);
      const answerDetails = await db.select().from(schema.codexAnswers)
        .where(sql`${schema.codexAnswers.questionId} IN (${sql.join(questionIds.map(id => sql`${id}`), sql`, `)})`);

      const answersMap = new Map<string, typeof answerDetails>();
      for (const a of answerDetails) {
        const arr = answersMap.get(a.questionId) ?? [];
        arr.push(a);
        answersMap.set(a.questionId, arr);
      }

      const enriched = questionDetails.map(q => ({
        id: q.id,
        sectionNum: q.sectionNum,
        questionNum: q.questionNum,
        questionText: q.questionText,
        invitation: q.invitation,
        answers: (answersMap.get(q.id) ?? []).map(a => ({
          code: a.code,
          text: a.answerText,
          spectrumDepth: a.spectrumDepth,
        })),
      }));

      return {
        sessionId: state.sessionId,
        assessmentId,
        questions: enriched,
        phase: "broad_signal",
        totalQuestions: questionPool.length,
      };
    }),

  /**
   * Submits a single answer, updates posteriors, and returns the next question.
   * Returns { nextQuestion, posteriorsSummary, progress, phase, terminated }.
   */
  submitAnswer: customerProc
    .input(z.object({
      sessionId: z.string(),
      questionId: z.string(),
      answerCode: z.string(),
      responseTimeMs: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const u = (ctx as any).codexUser as schema.CodexUser;

      // Load session
      const [session] = await db.select().from(schema.codexAdaptiveSessions)
        .where(and(
          eq(schema.codexAdaptiveSessions.id, input.sessionId),
          eq(schema.codexAdaptiveSessions.userId, u.id),
        )).limit(1);
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Adaptive session not found" });
      if (session.terminated === 1) throw new TRPCError({ code: "BAD_REQUEST", message: "Session already terminated" });

      let state: AdaptiveState = JSON.parse(session.state);
      const cfg: Partial<AdaptiveConfig> = session.config ? JSON.parse(session.config) : {};

      // Fetch answer metadata for Bayesian update
      const [answerRow] = await db.select().from(schema.codexAnswers)
        .where(and(
          eq(schema.codexAnswers.questionId, input.questionId),
          eq(schema.codexAnswers.code, input.answerCode),
        )).limit(1);
      if (!answerRow) throw new TRPCError({ code: "NOT_FOUND", message: "Answer not found" });

      const answerMeta = {
        code: answerRow.code,
        spectrumDepth: answerRow.spectrumDepth,
        arPrimary: answerRow.arPrimary,
        arSecondary: answerRow.arSecondary,
        wi: answerRow.wi,
        mp: answerRow.mp,
        mmi: answerRow.mmi ?? null,
        abi: answerRow.abi ?? null,
        epcl: answerRow.epcl ?? null,
        wombField: answerRow.wombField ?? null,
      };

      // Load signal for this question (or build on the fly)
      const [signalRow] = await db.select().from(schema.codexQuestionSignals)
        .where(eq(schema.codexQuestionSignals.questionId, input.questionId)).limit(1);

      const [questionRow] = await db.select().from(schema.codexQuestions)
        .where(eq(schema.codexQuestions.id, input.questionId)).limit(1);

      let signal: QuestionSignal;
      if (signalRow) {
        signal = {
          questionId: signalRow.questionId,
          sectionNum: signalRow.sectionNum,
          archetypeWeights: JSON.parse(signalRow.archetypeWeights),
          woundWeights: JSON.parse(signalRow.woundWeights),
          informationGain: parseFloat(signalRow.informationGain ?? "0"),
          asked: true,
        };
        // Increment timesAsked
        await db.update(schema.codexQuestionSignals)
          .set({ timesAsked: (signalRow.timesAsked ?? 0) + 1 })
          .where(eq(schema.codexQuestionSignals.questionId, input.questionId));
      } else {
        const answers = await db.select().from(schema.codexAnswers)
          .where(eq(schema.codexAnswers.questionId, input.questionId));
        signal = buildSignalFromAnswers(
          input.questionId,
          questionRow?.sectionNum ?? 1,
          answers,
        );
      }

      // Bayesian update
      state = updatePosteriors(state, signal, answerMeta);
      state = eliminateLowProbability(state, cfg);

      // Record response with posterior snapshot
      const entropy = computeEntropy(state.posteriors);
      await db.insert(schema.codexAdaptiveResponses).values({
        id: nanoid(),
        sessionId: input.sessionId,
        questionId: input.questionId,
        questionIndex: state.questionIndex - 1,
        answerCode: input.answerCode,
        posteriorsSnapshot: JSON.stringify(posteriorsSummary(state.posteriors)),
        entropyAtAnswer: String(Math.round(entropy * 1000) / 1000),
        phaseAtAnswer: state.currentPhase,
        responseTimeMs: input.responseTimeMs ?? null,
        answeredAt: new Date(),
      });

      // Check termination
      const { terminate, reason } = shouldTerminate(state, cfg);
      state.terminationReady = terminate;
      state.terminationReason = reason;

      const sorted = [...state.posteriors].sort((a, b) => b.probability - a.probability);
      const topArchetype = sorted[0]?.archetype ?? null;
      const topConfidence = sorted[0]?.probability ?? 0;

      // Persist updated state
      await db.update(schema.codexAdaptiveSessions)
        .set({
          state: JSON.stringify(state),
          phase: state.currentPhase,
          questionsAsked: state.questionIndex,
          topArchetype,
          topConfidence: String(Math.round(topConfidence * 1000) / 1000),
          entropy: String(Math.round(entropy * 1000) / 1000),
          terminated: terminate ? 1 : 0,
          terminationReason: reason,
        })
        .where(eq(schema.codexAdaptiveSessions.id, input.sessionId));

      if (terminate) {
        return {
          nextQuestion: null,
          posteriorsSummary: posteriorsSummary(state.posteriors),
          progress: { answered: state.questionIndex, phase: state.currentPhase },
          phase: state.currentPhase,
          terminated: true,
          terminationReason: reason,
        };
      }

      // Select next question
      const questionPool = await loadQuestionSignals(db);
      const nextSignal = selectNextQuestion(state, questionPool, cfg);
      if (!nextSignal) {
        return {
          nextQuestion: null,
          posteriorsSummary: posteriorsSummary(state.posteriors),
          progress: { answered: state.questionIndex, phase: state.currentPhase },
          phase: state.currentPhase,
          terminated: true,
          terminationReason: "question_pool_exhausted",
        };
      }

      const [nextQ] = await db.select().from(schema.codexQuestions)
        .where(eq(schema.codexQuestions.id, nextSignal.questionId)).limit(1);
      const nextAnswers = await db.select().from(schema.codexAnswers)
        .where(eq(schema.codexAnswers.questionId, nextSignal.questionId));

      return {
        nextQuestion: nextQ ? {
          id: nextQ.id,
          sectionNum: nextQ.sectionNum,
          questionNum: nextQ.questionNum,
          questionText: nextQ.questionText,
          invitation: nextQ.invitation,
          answers: nextAnswers.map(a => ({
            code: a.code,
            text: a.answerText,
            spectrumDepth: a.spectrumDepth,
          })),
        } : null,
        posteriorsSummary: posteriorsSummary(state.posteriors),
        progress: {
          answered: state.questionIndex,
          phase: state.currentPhase,
          entropy: Math.round(entropy * 1000) / 1000,
          topConfidence: Math.round(topConfidence * 1000) / 1000,
        },
        phase: state.currentPhase,
        terminated: false,
        terminationReason: null,
      };
    }),

  /**
   * Returns the current adaptive session state for resuming a paused assessment.
   */
  getState: customerProc
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const u = (ctx as any).codexUser as schema.CodexUser;

      const [session] = await db.select().from(schema.codexAdaptiveSessions)
        .where(and(
          eq(schema.codexAdaptiveSessions.id, input.sessionId),
          eq(schema.codexAdaptiveSessions.userId, u.id),
        )).limit(1);
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      const state: AdaptiveState = JSON.parse(session.state);
      return {
        sessionId: session.id,
        assessmentId: session.assessmentId,
        phase: session.phase,
        questionsAsked: session.questionsAsked,
        topArchetype: session.topArchetype,
        topConfidence: session.topConfidence ? parseFloat(session.topConfidence) : null,
        entropy: session.entropy ? parseFloat(session.entropy) : null,
        terminated: session.terminated === 1,
        terminationReason: session.terminationReason,
        posteriorsSummary: posteriorsSummary(state.posteriors),
        startedAt: session.startedAt.toISOString(),
        completedAt: session.completedAt?.toISOString() ?? null,
      };
    }),

  /**
   * Finalizes an adaptive session: converts adaptive responses to scoring format,
   * runs the scoring engine, and generates a Codex Signature (mirror report).
   */
  complete: customerProc
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const u = (ctx as any).codexUser as schema.CodexUser;

      const [session] = await db.select().from(schema.codexAdaptiveSessions)
        .where(and(
          eq(schema.codexAdaptiveSessions.id, input.sessionId),
          eq(schema.codexAdaptiveSessions.userId, u.id),
        )).limit(1);
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      const state: AdaptiveState = JSON.parse(session.state);

      // Pull all scoreable questions from DB
      const allQuestions = await db.select().from(schema.codexQuestions);
      const allAnswers = await db.select().from(schema.codexAnswers);

      const answerLookup = new Map<string, AnswerMetadata>();
      const qMap = new Map(allQuestions.map(q => [q.id, q]));
      for (const a of allAnswers) {
        const q = qMap.get(a.questionId);
        if (!q) continue;
        const key = `${q.sectionNum}-${a.questionId}-${a.code}`;
        answerLookup.set(key, {
          code: a.code,
          spectrumDepth: a.spectrumDepth,
          arPrimary: a.arPrimary,
          arSecondary: a.arSecondary,
          wi: a.wi,
          mp: a.mp,
          mmi: a.mmi ?? null,
          abi: a.abi ?? null,
          epcl: a.epcl ?? null,
          wombField: a.wombField ?? null,
        });
      }

      // Convert adaptive state to ResponseRecord[] (ghost = unanswered)
      const records = convertToScoringResponses(
        state,
        allQuestions.map(q => ({ id: q.id, sectionNum: q.sectionNum }))
      );

      const scoringResult = runScoringEngine(records, answerLookup);

      // Persist scoring
      const scoringId = nanoid();
      await db.insert(schema.codexScorings).values({
        id: scoringId,
        assessmentId: session.assessmentId,
        resultJson: JSON.stringify(scoringResult),
      });

      // Mark assessment and session complete
      await db.update(schema.codexAssessments)
        .set({ status: "complete", completedAt: new Date() })
        .where(eq(schema.codexAssessments.id, session.assessmentId));

      await db.update(schema.codexAdaptiveSessions)
        .set({ terminated: 1, completedAt: new Date() })
        .where(eq(schema.codexAdaptiveSessions.id, input.sessionId));

      // Generate Codex Signature (mirror report)
      const reportId = nanoid();
      const reportContent = {
        archetypeConstellation: scoringResult.archetypeConstellation,
        activeWounds: scoringResult.activeWounds,
        activeMirrors: scoringResult.activeMirrors,
        spectrumProfile: scoringResult.spectrumProfile,
        integrationIndex: scoringResult.integrationIndex,
        contradictionFlags: scoringResult.contradictionFlags,
        adaptiveMeta: {
          questionsAsked: state.questionIndex,
          terminationReason: state.terminationReason,
          finalEntropy: Math.round(computeEntropy(state.posteriors) * 1000) / 1000,
          topPosteriors: posteriorsSummary(state.posteriors),
        },
      };

      await db.insert(schema.codexMirrorReports).values({
        id: reportId,
        userId: u.id,
        assessmentId: session.assessmentId,
        scoringId,
        status: "ready_for_review",
        contentJson: JSON.stringify(reportContent),
      });

      return {
        success: true,
        scoringId,
        reportId,
        topArchetype: scoringResult.archetypeConstellation[0]?.archetype ?? null,
        questionsAsked: state.questionIndex,
      };
    }),
});

// ══════════════════════════════════════════════════════════════════════
// EVENT BUS ROUTES (Phase 8)
// ══════════════════════════════════════════════════════════════════════
const codexEventBusRouter = router({
  // Get recent events for the current user
  getRecentEvents: customerProc
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      eventType: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const u = ctx.codexUser;

      const conditions = [eq(schema.codexEvents.userId, u.id)];
      if (input.eventType) {
        conditions.push(eq(schema.codexEvents.eventType, input.eventType));
      }

      const events = await db
        .select()
        .from(schema.codexEvents)
        .where(and(...conditions))
        .orderBy(desc(schema.codexEvents.emittedAt))
        .limit(input.limit);

      return events.map((e) => ({
        ...e,
        eventData: e.eventData ? JSON.parse(e.eventData) : null,
        reactionsTriggered: e.reactionsTriggered ? JSON.parse(e.reactionsTriggered) : [],
        errors: e.errors ? JSON.parse(e.errors) : null,
      }));
    }),

  // Get event counts grouped by type (for dashboard)
  getEventSummary: customerProc.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = ctx.codexUser;

    const counts = await db
      .select({
        eventType: schema.codexEvents.eventType,
        count: sql<number>`count(*)`,
        latest: sql<string>`max(${schema.codexEvents.emittedAt})`,
      })
      .from(schema.codexEvents)
      .where(eq(schema.codexEvents.userId, u.id))
      .groupBy(schema.codexEvents.eventType);

    return counts;
  }),

  // Manually emit an event (for client-driven events like milestone celebrations)
  emit: customerProc
    .input(z.object({
      eventType: z.enum([
        "assessment_completed", "journal_created", "check_in_completed",
        "dialogue_completed", "challenge_reported_back", "scroll_layer_unlocked",
        "pattern_shift_detected", "milestone_earned", "phase_transition",
      ]),
      data: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const u = ctx.codexUser;
      const { emitCodexEvent } = await import("./lib/codexEventBus");
      await emitCodexEvent({
        type: input.eventType,
        userId: u.id,
        data: input.data,
      });
      return { success: true };
    }),
});

// ══════════════════════════════════════════════════════════════════════
// COMMUNITY ROUTER — Circles, Threads, Messages, Reactions, Resonance
// ══════════════════════════════════════════════════════════════════════

const codexCommunityRouter = router({

  // ── My Circles ──────────────────────────────────────────────────────
  getMyCircles: customerProc.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;

    const memberships = await db.select({
      membership: schema.codexCircleMembers,
      circle: schema.codexCircles,
    })
      .from(schema.codexCircleMembers)
      .innerJoin(schema.codexCircles, eq(schema.codexCircleMembers.circleId, schema.codexCircles.id))
      .where(and(eq(schema.codexCircleMembers.userId, u.id), eq(schema.codexCircleMembers.status, "active")));

    const results = [];
    for (const row of memberships) {
      // Count members in circle
      const [mc] = await db.select({ count: sql<number>`count(*)` })
        .from(schema.codexCircleMembers)
        .where(and(eq(schema.codexCircleMembers.circleId, row.circle.id), eq(schema.codexCircleMembers.status, "active")));

      // Get latest thread activity
      const [latestThread] = await db.select({ lastActivityAt: schema.codexCommunityThreads.lastActivityAt })
        .from(schema.codexCommunityThreads)
        .where(eq(schema.codexCommunityThreads.circleId, row.circle.id))
        .orderBy(desc(schema.codexCommunityThreads.lastActivityAt))
        .limit(1);

      results.push({
        id: row.circle.id,
        name: row.circle.name,
        slug: row.circle.slug,
        circleType: row.circle.circleType,
        description: row.circle.description,
        memberCount: mc?.count || 0,
        lastActivity: latestThread?.lastActivityAt?.toISOString() || null,
        role: row.membership.role,
        trustScore: row.membership.trustScore,
        joinedAt: row.membership.joinedAt.toISOString(),
      });
    }

    return results;
  }),

  // ── Recommended Circles ─────────────────────────────────────────────
  getRecommendedCircles: customerProc.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const u = (ctx as any).codexUser as schema.CodexUser;

    // Get user's latest scoring
    const [scoring] = await db.select()
      .from(schema.codexScorings)
      .where(eq(schema.codexScorings.userId, u.id))
      .orderBy(desc(schema.codexScorings.createdAt))
      .limit(1);

    // Get all active circles
    const allCircles = await db.select()
      .from(schema.codexCircles)
      .where(eq(schema.codexCircles.isActive, 1));

    // Get user's current memberships
    const myMemberships = await db.select({ circleId: schema.codexCircleMembers.circleId })
      .from(schema.codexCircleMembers)
      .where(and(eq(schema.codexCircleMembers.userId, u.id), eq(schema.codexCircleMembers.status, "active")));
    const joinedIds = new Set(myMemberships.map(m => m.circleId));

    // Filter to circles user hasn't joined
    const unjoinedCircles = allCircles.filter(c => !joinedIds.has(c.id));

    if (!scoring?.resultJson) {
      // No scoring yet — return circles with basic ranking
      return unjoinedCircles.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        circleType: c.circleType,
        description: c.description,
        score: c.circleType === "general" ? 100 : 50,
        reason: c.circleType === "general" ? "Open to all women." : "Complete your assessment for personalized recommendations.",
      }));
    }

    // Use resonance engine for ranked recommendations
    let parsed;
    try { parsed = JSON.parse(scoring.resultJson); } catch { parsed = null; }
    if (!parsed) {
      return unjoinedCircles.map(c => ({
        id: c.id, name: c.name, slug: c.slug, circleType: c.circleType,
        description: c.description, score: 50, reason: "A circle you may explore.",
      }));
    }

    const ranked = rankCircleCandidates(parsed, unjoinedCircles);
    return ranked.map(r => {
      const circle = unjoinedCircles.find(c => c.id === r.circleId)!;
      return {
        id: circle.id,
        name: circle.name,
        slug: circle.slug,
        circleType: circle.circleType,
        description: circle.description,
        score: r.score,
        reason: r.reason,
      };
    });
  }),

  // ── Circle Detail ───────────────────────────────────────────────────
  getCircleDetail: customerProc
    .input(z.object({ circleId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const u = (ctx as any).codexUser as schema.CodexUser;

      const [circle] = await db.select().from(schema.codexCircles)
        .where(eq(schema.codexCircles.id, input.circleId)).limit(1);
      if (!circle) throw new TRPCError({ code: "NOT_FOUND", message: "Circle not found" });

      const [mc] = await db.select({ count: sql<number>`count(*)` })
        .from(schema.codexCircleMembers)
        .where(and(eq(schema.codexCircleMembers.circleId, circle.id), eq(schema.codexCircleMembers.status, "active")));

      // Check if user is a member
      const [membership] = await db.select().from(schema.codexCircleMembers)
        .where(and(
          eq(schema.codexCircleMembers.circleId, circle.id),
          eq(schema.codexCircleMembers.userId, u.id),
          eq(schema.codexCircleMembers.status, "active")
        )).limit(1);

      return {
        ...circle,
        aiPromptConfig: circle.aiPromptConfig ? JSON.parse(circle.aiPromptConfig) : null,
        metadata: circle.metadata ? JSON.parse(circle.metadata) : null,
        memberCount: mc?.count || 0,
        isMember: !!membership,
        memberRole: membership?.role || null,
        memberTrustScore: membership?.trustScore || null,
        currentUserId: u.id,
      };
    }),

  // ── Join Circle ─────────────────────────────────────────────────────
  joinCircle: customerProc
    .input(z.object({ circleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const u = (ctx as any).codexUser as schema.CodexUser;

      // Check circle exists and is active
      const [circle] = await db.select().from(schema.codexCircles)
        .where(and(eq(schema.codexCircles.id, input.circleId), eq(schema.codexCircles.isActive, 1))).limit(1);
      if (!circle) throw new TRPCError({ code: "NOT_FOUND", message: "Circle not found or inactive" });

      // Check not already a member
      const [existing] = await db.select().from(schema.codexCircleMembers)
        .where(and(
          eq(schema.codexCircleMembers.circleId, input.circleId),
          eq(schema.codexCircleMembers.userId, u.id),
          eq(schema.codexCircleMembers.status, "active")
        )).limit(1);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Already a member" });

      // Check capacity
      if (circle.maxMembers > 0) {
        const [mc] = await db.select({ count: sql<number>`count(*)` })
          .from(schema.codexCircleMembers)
          .where(and(eq(schema.codexCircleMembers.circleId, input.circleId), eq(schema.codexCircleMembers.status, "active")));
        if ((mc?.count || 0) >= circle.maxMembers) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Circle is full" });
        }
      }

      const membershipId = nanoid();
      await db.insert(schema.codexCircleMembers).values({
        id: membershipId,
        circleId: input.circleId,
        userId: u.id,
        role: "member",
        status: "active",
        trustScore: 50,
      });

      // Trust event for joining
      await updateTrustScore(db, u.id, input.circleId, "thread_created", "Joined circle");

      // Auto-join the circle chat conversation if it exists
      const circleChatResult = await db.execute(sql`
        SELECT id FROM codex_conversations WHERE circleId = ${input.circleId} AND type = 'circle_chat' LIMIT 1
      `);
      const circleChatRows = (circleChatResult as any)[0];
      if (circleChatRows.length > 0) {
        await db.insert(schema.codexConversationParticipants).values({
          id: nanoid(),
          conversationId: circleChatRows[0].id,
          userId: u.id,
          role: "member",
        }).catch(() => {}); // ignore if already a participant
      }

      return { success: true, membershipId };
    }),

  // ── Leave Circle ────────────────────────────────────────────────────
  leaveCircle: customerProc
    .input(z.object({ circleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const u = (ctx as any).codexUser as schema.CodexUser;

      await db.update(schema.codexCircleMembers)
        .set({ status: "exited", exitedAt: new Date(), exitReason: "voluntary" })
        .where(and(
          eq(schema.codexCircleMembers.circleId, input.circleId),
          eq(schema.codexCircleMembers.userId, u.id),
          eq(schema.codexCircleMembers.status, "active")
        ));

      return { success: true };
    }),

  // ── Threads (paginated) ─────────────────────────────────────────────
  getThreads: customerProc
    .input(z.object({ circleId: z.string(), limit: z.number().min(1).max(50).default(20), offset: z.number().min(0).default(0) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const threads = await db.select({
        thread: schema.codexCommunityThreads,
      })
        .from(schema.codexCommunityThreads)
        .where(and(
          eq(schema.codexCommunityThreads.circleId, input.circleId),
          eq(schema.codexCommunityThreads.status, "active")
        ))
        .orderBy(desc(schema.codexCommunityThreads.isPinned), desc(schema.codexCommunityThreads.lastActivityAt))
        .limit(input.limit)
        .offset(input.offset);

      // Fetch author names
      const results = [];
      for (const row of threads) {
        const [author] = await db.select({ name: schema.codexUsers.name })
          .from(schema.codexUsers)
          .where(eq(schema.codexUsers.id, row.thread.authorId))
          .limit(1);

        results.push({
          ...row.thread,
          lastActivityAt: row.thread.lastActivityAt.toISOString(),
          createdAt: row.thread.createdAt.toISOString(),
          authorName: row.thread.isAnonymous ? "A woman in the circle" : (author?.name || "Unknown"),
        });
      }

      return results;
    }),

  // ── Thread Detail with Messages ─────────────────────────────────────
  getThread: customerProc
    .input(z.object({ threadId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [thread] = await db.select().from(schema.codexCommunityThreads)
        .where(eq(schema.codexCommunityThreads.id, input.threadId)).limit(1);
      if (!thread) throw new TRPCError({ code: "NOT_FOUND" });

      const messages = await db.select()
        .from(schema.codexCommunityMessages)
        .where(and(
          eq(schema.codexCommunityMessages.threadId, input.threadId),
          sql`${schema.codexCommunityMessages.moderationStatus} != 'removed'`
        ))
        .orderBy(asc(schema.codexCommunityMessages.createdAt));

      // Fetch author names and reactions
      const enriched = [];
      for (const msg of messages) {
        const [author] = await db.select({ name: schema.codexUsers.name })
          .from(schema.codexUsers)
          .where(eq(schema.codexUsers.id, msg.authorId))
          .limit(1);

        // Get reaction counts
        const reactions = await db.select({
          reactionType: schema.codexReactions.reactionType,
          count: sql<number>`count(*)`,
        })
          .from(schema.codexReactions)
          .where(eq(schema.codexReactions.messageId, msg.id))
          .groupBy(schema.codexReactions.reactionType);

        const reactionMap: Record<string, number> = {};
        for (const r of reactions) reactionMap[r.reactionType] = r.count;

        // Check if current user has reacted
        const u = (ctx as any).codexUser as schema.CodexUser;
        const userReactions = await db.select({ reactionType: schema.codexReactions.reactionType })
          .from(schema.codexReactions)
          .where(and(eq(schema.codexReactions.messageId, msg.id), eq(schema.codexReactions.userId, u.id)));
        const myReactions = userReactions.map(r => r.reactionType);

        enriched.push({
          id: msg.id,
          content: msg.moderationStatus === "flagged" ? "[This message is under review]" : msg.content,
          contentType: msg.contentType,
          authorId: msg.authorId,
          authorName: msg.isAnonymous ? "A woman in the circle" : (author?.name || "Unknown"),
          isAnonymous: msg.isAnonymous === 1,
          isAI: msg.isAI === 1,
          moderationStatus: msg.moderationStatus,
          parentMessageId: msg.parentMessageId,
          reactions: reactionMap,
          myReactions,
          createdAt: msg.createdAt.toISOString(),
        });
      }

      return {
        thread: {
          ...thread,
          lastActivityAt: thread.lastActivityAt.toISOString(),
          createdAt: thread.createdAt.toISOString(),
        },
        messages: enriched,
      };
    }),

  // ── Create Thread ───────────────────────────────────────────────────
  createThread: customerProc
    .input(z.object({
      circleId: z.string(),
      title: z.string().min(1).max(500),
      content: z.string().min(1).max(5000),
      threadType: z.enum(["discussion", "reflection", "offering"]).default("discussion"),
      isAnonymous: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const u = (ctx as any).codexUser as schema.CodexUser;

      // Verify membership
      const [membership] = await db.select().from(schema.codexCircleMembers)
        .where(and(
          eq(schema.codexCircleMembers.circleId, input.circleId),
          eq(schema.codexCircleMembers.userId, u.id),
          eq(schema.codexCircleMembers.status, "active")
        )).limit(1);
      if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "Must be a circle member" });

      // Moderate content
      const modResult = classifyCommunityContent(input.content, {
        userId: u.id,
        trustScore: membership.trustScore,
        circleId: input.circleId,
      });

      const threadId = nanoid();
      const messageId = nanoid();

      // Create thread
      await db.insert(schema.codexCommunityThreads).values({
        id: threadId,
        circleId: input.circleId,
        authorId: u.id,
        title: input.title,
        threadType: input.threadType,
        isAnonymous: input.isAnonymous ? 1 : 0,
        replyCount: 0,
        status: "active",
      });

      // Create first message
      await db.insert(schema.codexCommunityMessages).values({
        id: messageId,
        threadId,
        authorId: u.id,
        content: input.content,
        contentType: "text",
        isAnonymous: input.isAnonymous ? 1 : 0,
        moderationStatus: modResult.status === "approved" ? "approved" : "flagged",
        moderationNote: modResult.reasons.length > 0 ? JSON.stringify(modResult.reasons) : null,
      });

      // Log moderation if flagged
      if (modResult.status === "flagged") {
        await recordModerationAction(db, {
          messageId,
          userId: u.id,
          moderatorType: "ai",
          action: "flag",
          reason: modResult.reasons.join("; "),
          aiConfidence: modResult.confidence,
          previousStatus: "pending",
          newStatus: "flagged",
        });
        await updateTrustScore(db, u.id, input.circleId, "message_flagged", modResult.reasons.join("; "));
      } else {
        await updateTrustScore(db, u.id, input.circleId, "thread_created");
      }

      // Update member last active
      await db.update(schema.codexCircleMembers)
        .set({ lastActiveAt: new Date() })
        .where(eq(schema.codexCircleMembers.id, membership.id));

      return { threadId, messageId, moderation: modResult.status };
    }),

  // ── Post Message ────────────────────────────────────────────────────
  postMessage: customerProc
    .input(z.object({
      threadId: z.string(),
      content: z.string().min(1).max(5000),
      parentMessageId: z.string().optional(),
      isAnonymous: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const u = (ctx as any).codexUser as schema.CodexUser;

      // Get thread and verify membership
      const [thread] = await db.select().from(schema.codexCommunityThreads)
        .where(eq(schema.codexCommunityThreads.id, input.threadId)).limit(1);
      if (!thread) throw new TRPCError({ code: "NOT_FOUND" });
      if (thread.isLocked) throw new TRPCError({ code: "FORBIDDEN", message: "Thread is locked" });

      const [membership] = await db.select().from(schema.codexCircleMembers)
        .where(and(
          eq(schema.codexCircleMembers.circleId, thread.circleId),
          eq(schema.codexCircleMembers.userId, u.id),
          eq(schema.codexCircleMembers.status, "active")
        )).limit(1);
      if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "Must be a circle member" });

      // Moderate
      const modResult = classifyCommunityContent(input.content, {
        userId: u.id,
        trustScore: membership.trustScore,
        circleId: thread.circleId,
      });

      const messageId = nanoid();
      await db.insert(schema.codexCommunityMessages).values({
        id: messageId,
        threadId: input.threadId,
        authorId: u.id,
        content: input.content,
        contentType: "text",
        parentMessageId: input.parentMessageId || null,
        isAnonymous: input.isAnonymous ? 1 : 0,
        moderationStatus: modResult.status === "approved" ? "approved" : "flagged",
        moderationNote: modResult.reasons.length > 0 ? JSON.stringify(modResult.reasons) : null,
      });

      // Update thread reply count and activity
      await db.update(schema.codexCommunityThreads)
        .set({
          replyCount: sql`${schema.codexCommunityThreads.replyCount} + 1`,
          lastActivityAt: new Date(),
        })
        .where(eq(schema.codexCommunityThreads.id, input.threadId));

      // Trust + moderation logging
      if (modResult.status === "flagged") {
        await recordModerationAction(db, {
          messageId, userId: u.id, moderatorType: "ai", action: "flag",
          reason: modResult.reasons.join("; "), aiConfidence: modResult.confidence,
          previousStatus: "pending", newStatus: "flagged",
        });
        await updateTrustScore(db, u.id, thread.circleId, "message_flagged");
      } else {
        await updateTrustScore(db, u.id, thread.circleId, "message_approved");
      }

      // Update member last active
      await db.update(schema.codexCircleMembers)
        .set({ lastActiveAt: new Date() })
        .where(eq(schema.codexCircleMembers.id, membership.id));

      return { messageId, moderation: modResult.status };
    }),

  // ── Delete Message (soft) ───────────────────────────────────────────
  deleteMessage: customerProc
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const u = (ctx as any).codexUser as schema.CodexUser;

      const [msg] = await db.select().from(schema.codexCommunityMessages)
        .where(eq(schema.codexCommunityMessages.id, input.messageId)).limit(1);
      if (!msg) throw new TRPCError({ code: "NOT_FOUND" });
      if (msg.authorId !== u.id) throw new TRPCError({ code: "FORBIDDEN", message: "Can only delete your own messages" });

      await db.update(schema.codexCommunityMessages)
        .set({ moderationStatus: "removed", moderationNote: "Deleted by author" })
        .where(eq(schema.codexCommunityMessages.id, input.messageId));

      return { success: true };
    }),

  // ── Add Reaction ────────────────────────────────────────────────────
  addReaction: customerProc
    .input(z.object({
      messageId: z.string(),
      reactionType: z.enum(["witnessed", "resonates", "holding_space", "flame", "mirror", "offering"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const u = (ctx as any).codexUser as schema.CodexUser;

      // Check message exists
      const [msg] = await db.select().from(schema.codexCommunityMessages)
        .where(eq(schema.codexCommunityMessages.id, input.messageId)).limit(1);
      if (!msg) throw new TRPCError({ code: "NOT_FOUND" });

      // Check not already reacted with this type
      const [existing] = await db.select().from(schema.codexReactions)
        .where(and(
          eq(schema.codexReactions.messageId, input.messageId),
          eq(schema.codexReactions.userId, u.id),
          eq(schema.codexReactions.reactionType, input.reactionType)
        )).limit(1);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Already reacted" });

      await db.insert(schema.codexReactions).values({
        id: nanoid(),
        messageId: input.messageId,
        userId: u.id,
        reactionType: input.reactionType,
      });

      // Trust bonus for the message author (not self)
      if (msg.authorId !== u.id) {
        // Get author's circle membership from the thread
        const [thread] = await db.select({ circleId: schema.codexCommunityThreads.circleId })
          .from(schema.codexCommunityThreads)
          .where(eq(schema.codexCommunityThreads.id, msg.threadId)).limit(1);
        if (thread) {
          await updateTrustScore(db, msg.authorId, thread.circleId, "reaction_received", `${input.reactionType} from peer`);
        }
      }

      return { success: true };
    }),

  // ── Remove Reaction ─────────────────────────────────────────────────
  removeReaction: customerProc
    .input(z.object({
      messageId: z.string(),
      reactionType: z.enum(["witnessed", "resonates", "holding_space", "flame", "mirror", "offering"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const u = (ctx as any).codexUser as schema.CodexUser;

      await db.delete(schema.codexReactions)
        .where(and(
          eq(schema.codexReactions.messageId, input.messageId),
          eq(schema.codexReactions.userId, u.id),
          eq(schema.codexReactions.reactionType, input.reactionType)
        ));

      return { success: true };
    }),

  // ── Weekly AI Prompt ────────────────────────────────────────────────
  getWeeklyPrompt: customerProc
    .input(z.object({ circleId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [circle] = await db.select().from(schema.codexCircles)
        .where(eq(schema.codexCircles.id, input.circleId)).limit(1);
      if (!circle) throw new TRPCError({ code: "NOT_FOUND" });

      const [mc] = await db.select({ count: sql<number>`count(*)` })
        .from(schema.codexCircleMembers)
        .where(and(eq(schema.codexCircleMembers.circleId, circle.id), eq(schema.codexCircleMembers.status, "active")));

      // Get recent thread titles as themes
      const recentThreads = await db.select({ title: schema.codexCommunityThreads.title })
        .from(schema.codexCommunityThreads)
        .where(eq(schema.codexCommunityThreads.circleId, circle.id))
        .orderBy(desc(schema.codexCommunityThreads.createdAt))
        .limit(5);

      const context: CircleContext = {
        circleId: circle.id,
        circleType: circle.circleType,
        name: circle.name,
        archetypeFilter: circle.archetypeFilter,
        woundFilter: circle.woundFilter,
        phaseFilter: circle.phaseFilter,
        memberCount: mc?.count || 0,
        recentThemes: recentThreads.map(t => t.title),
      };

      const prompt = await generateWeeklyCirclePrompt(context);
      return { prompt, circleName: circle.name };
    }),

  // ── Resonance Map (stub for Q1) ────────────────────────────────────
  getResonanceMap: customerProc.query(async ({ ctx }) => {
    const u = (ctx as any).codexUser as schema.CodexUser;
    // Q1 stub — resonance matching UI will come in Q2
    return {
      userId: u.id,
      matches: [],
      message: "Your resonance constellation is forming. Full matching coming soon.",
    };
  }),

  // ── Admin: Flagged Messages ─────────────────────────────────────────
  getFlaggedMessages: adminProc.query(async () => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const flagged = await db.select({
      message: schema.codexCommunityMessages,
      thread: schema.codexCommunityThreads,
    })
      .from(schema.codexCommunityMessages)
      .innerJoin(schema.codexCommunityThreads, eq(schema.codexCommunityMessages.threadId, schema.codexCommunityThreads.id))
      .where(eq(schema.codexCommunityMessages.moderationStatus, "flagged"))
      .orderBy(desc(schema.codexCommunityMessages.createdAt))
      .limit(50);

    return flagged.map(row => ({
      messageId: row.message.id,
      content: row.message.content,
      authorId: row.message.authorId,
      threadTitle: row.thread.title,
      circleId: row.thread.circleId,
      moderationNote: row.message.moderationNote,
      createdAt: row.message.createdAt.toISOString(),
    }));
  }),

  // ── Admin: Moderate Message ─────────────────────────────────────────
  moderateMessage: adminProc
    .input(z.object({
      messageId: z.string(),
      action: z.enum(["approve", "remove"]),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [msg] = await db.select().from(schema.codexCommunityMessages)
        .where(eq(schema.codexCommunityMessages.id, input.messageId)).limit(1);
      if (!msg) throw new TRPCError({ code: "NOT_FOUND" });

      const newStatus = input.action === "approve" ? "approved" : "removed";
      await db.update(schema.codexCommunityMessages)
        .set({ moderationStatus: newStatus, moderationNote: input.reason || null })
        .where(eq(schema.codexCommunityMessages.id, input.messageId));

      await recordModerationAction(db, {
        messageId: input.messageId,
        userId: msg.authorId,
        moderatorType: "admin",
        action: input.action,
        reason: input.reason,
        previousStatus: msg.moderationStatus,
        newStatus,
      });

      // Trust penalty for removal
      if (input.action === "remove") {
        const [thread] = await db.select({ circleId: schema.codexCommunityThreads.circleId })
          .from(schema.codexCommunityThreads)
          .where(eq(schema.codexCommunityThreads.id, msg.threadId)).limit(1);
        if (thread) {
          await updateTrustScore(db, msg.authorId, thread.circleId, "message_removed", input.reason);
        }
      }

      return { success: true };
    }),
});

// ══════════════════════════════════════════════════════════════════════
// MESSAGING ROUTER — Direct messages, circle chat, presence, read receipts
// Adapted from EusoTrip messaging architecture for sacred community context
// ══════════════════════════════════════════════════════════════════════

const codexMessagingRouter = router({

  // ── Presence heartbeat — call every 30s to stay "online" ───────────
  heartbeat: customerProc
    .input(z.object({ circleId: z.string().optional() }).optional())
    .mutation(async ({ ctx }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const activeContext = ctx.input?.circleId ? JSON.stringify({ circleId: ctx.input.circleId }) : null;

      // Upsert presence
      await db.execute(sql`
        INSERT INTO codex_user_presence (id, userId, status, lastSeenAt, activeContext)
        VALUES (${nanoid()}, ${userId}, 'online', NOW(), ${activeContext})
        ON DUPLICATE KEY UPDATE status = 'online', lastSeenAt = NOW(), activeContext = ${activeContext}
      `);
      return { ok: true };
    }),

  // ── Get online members for a circle ────────────────────────────────
  getPresence: customerProc
    .input(z.object({ circleId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      // Get circle members who were active in last 5 minutes
      const results = await db.execute(sql`
        SELECT p.userId, p.status, p.lastSeenAt,
               u.name as userName
        FROM codex_user_presence p
        JOIN codex_circle_members cm ON cm.userId = p.userId AND cm.circleId = ${input.circleId} AND cm.status = 'active'
        JOIN users u ON u.id = p.userId
        WHERE p.lastSeenAt > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        ORDER BY p.lastSeenAt DESC
      `);
      return (results as any)[0] || [];
    }),

  // ── Get conversations for current user ─────────────────────────────
  getConversations: customerProc
    .input(z.object({
      circleId: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      let whereClause = sql`cp.userId = ${userId} AND cp.leftAt IS NULL`;
      if (input?.circleId) {
        whereClause = sql`${whereClause} AND c.circleId = ${input.circleId}`;
      }

      const results = await db.execute(sql`
        SELECT c.id, c.circleId, c.type, c.name, c.lastMessageAt, c.lastMessagePreview,
               cp.unreadCount, cp.isPinned, cp.isMuted, cp.isArchived,
               (SELECT GROUP_CONCAT(
                 JSON_OBJECT('userId', cp2.userId, 'name', u2.name)
               ) FROM codex_conversation_participants cp2
                JOIN users u2 ON u2.id = cp2.userId
                WHERE cp2.conversationId = c.id AND cp2.leftAt IS NULL AND cp2.userId != ${userId}
               ) as otherParticipants
        FROM codex_conversations c
        JOIN codex_conversation_participants cp ON cp.conversationId = c.id
        WHERE ${whereClause}
        ORDER BY cp.isPinned DESC, c.lastMessageAt DESC
        LIMIT 50
      `);

      const rows = (results as any)[0] || [];
      return rows.map((r: any) => ({
        ...r,
        isPinned: !!r.isPinned,
        isMuted: !!r.isMuted,
        isArchived: !!r.isArchived,
        otherParticipants: r.otherParticipants
          ? JSON.parse(`[${r.otherParticipants}]`)
          : [],
      }));
    }),

  // ── Get messages in a conversation ─────────────────────────────────
  getMessages: customerProc
    .input(z.object({
      conversationId: z.string(),
      limit: z.number().min(1).max(100).default(50),
      before: z.string().optional(), // cursor: message ID
    }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Verify participant
      const [participant] = await db.select()
        .from(schema.codexConversationParticipants)
        .where(and(
          eq(schema.codexConversationParticipants.conversationId, input.conversationId),
          eq(schema.codexConversationParticipants.userId, userId),
          sql`${schema.codexConversationParticipants.leftAt} IS NULL`
        )).limit(1);

      if (!participant) throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant" });

      let cursorClause = sql`1=1`;
      if (input.before) {
        cursorClause = sql`m.id < ${input.before}`;
      }

      const results = await db.execute(sql`
        SELECT m.id, m.conversationId, m.senderId, m.content, m.contentType,
               m.parentMessageId, m.isUnsent, m.readReceipts, m.metadata,
               m.createdAt, m.updatedAt,
               u.name as senderName
        FROM codex_direct_messages m
        JOIN users u ON u.id = m.senderId
        WHERE m.conversationId = ${input.conversationId} AND ${cursorClause}
        ORDER BY m.createdAt DESC
        LIMIT ${input.limit}
      `);

      const messages = ((results as any)[0] || []).map((m: any) => ({
        ...m,
        isUnsent: !!m.isUnsent,
        readReceipts: m.readReceipts ? JSON.parse(m.readReceipts) : [],
        metadata: m.metadata ? JSON.parse(m.metadata) : null,
      }));

      return messages.reverse(); // chronological order
    }),

  // ── Send a message ─────────────────────────────────────────────────
  sendMessage: customerProc
    .input(z.object({
      conversationId: z.string(),
      content: z.string().min(1).max(5000),
      contentType: z.string().default("text"),
      parentMessageId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Verify participant
      const [participant] = await db.select()
        .from(schema.codexConversationParticipants)
        .where(and(
          eq(schema.codexConversationParticipants.conversationId, input.conversationId),
          eq(schema.codexConversationParticipants.userId, userId),
          sql`${schema.codexConversationParticipants.leftAt} IS NULL`
        )).limit(1);

      if (!participant) throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant" });

      const messageId = nanoid();
      const preview = input.content.length > 200 ? input.content.slice(0, 197) + "..." : input.content;

      await db.insert(schema.codexDirectMessages).values({
        id: messageId,
        conversationId: input.conversationId,
        senderId: userId,
        content: input.content,
        contentType: input.contentType,
        parentMessageId: input.parentMessageId || null,
        readReceipts: JSON.stringify([{ userId, readAt: new Date().toISOString() }]),
      });

      // Update conversation last message
      await db.execute(sql`
        UPDATE codex_conversations
        SET lastMessageAt = NOW(), lastMessagePreview = ${preview}
        WHERE id = ${input.conversationId}
      `);

      // Increment unread for other participants
      await db.execute(sql`
        UPDATE codex_conversation_participants
        SET unreadCount = unreadCount + 1
        WHERE conversationId = ${input.conversationId} AND userId != ${userId} AND leftAt IS NULL
      `);

      return { id: messageId };
    }),

  // ── Create or find a conversation ──────────────────────────────────
  createConversation: customerProc
    .input(z.object({
      participantIds: z.array(z.string()).min(1).max(20),
      circleId: z.string().optional(),
      type: z.enum(["direct", "group", "circle_chat"]).default("direct"),
      name: z.string().optional(),
      initialMessage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const allParticipants = [...new Set([userId, ...input.participantIds])];

      // For direct conversations, check if one already exists between these two users
      if (input.type === "direct" && allParticipants.length === 2) {
        const existing = await db.execute(sql`
          SELECT c.id FROM codex_conversations c
          WHERE c.type = 'direct'
          AND (SELECT COUNT(*) FROM codex_conversation_participants cp
               WHERE cp.conversationId = c.id AND cp.leftAt IS NULL
               AND cp.userId IN (${allParticipants[0]}, ${allParticipants[1]})) = 2
          LIMIT 1
        `);
        const rows = (existing as any)[0];
        if (rows.length > 0) {
          return { id: rows[0].id, existing: true };
        }
      }

      const convId = nanoid();
      await db.insert(schema.codexConversations).values({
        id: convId,
        circleId: input.circleId || null,
        type: input.type,
        name: input.name || null,
        createdById: userId,
      });

      // Add all participants
      for (const pId of allParticipants) {
        await db.insert(schema.codexConversationParticipants).values({
          id: nanoid(),
          conversationId: convId,
          userId: pId,
          role: pId === userId ? "owner" : "member",
        });
      }

      // Send initial message if provided
      if (input.initialMessage) {
        const msgId = nanoid();
        const preview = input.initialMessage.length > 200 ? input.initialMessage.slice(0, 197) + "..." : input.initialMessage;
        await db.insert(schema.codexDirectMessages).values({
          id: msgId,
          conversationId: convId,
          senderId: userId,
          content: input.initialMessage,
          contentType: "text",
          readReceipts: JSON.stringify([{ userId, readAt: new Date().toISOString() }]),
        });
        await db.execute(sql`
          UPDATE codex_conversations SET lastMessageAt = NOW(), lastMessagePreview = ${preview} WHERE id = ${convId}
        `);
      }

      return { id: convId, existing: false };
    }),

  // ── Mark conversation as read ──────────────────────────────────────
  markAsRead: customerProc
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      await db.execute(sql`
        UPDATE codex_conversation_participants
        SET unreadCount = 0, lastReadAt = NOW()
        WHERE conversationId = ${input.conversationId} AND userId = ${userId}
      `);

      // Update read receipts on recent messages
      await db.execute(sql`
        UPDATE codex_direct_messages
        SET readReceipts = JSON_ARRAY_APPEND(
          COALESCE(readReceipts, '[]'), '$',
          JSON_OBJECT('userId', ${userId}, 'readAt', NOW())
        )
        WHERE conversationId = ${input.conversationId}
        AND senderId != ${userId}
        AND NOT JSON_CONTAINS(COALESCE(readReceipts, '[]'), JSON_QUOTE(${userId}), '$[*].userId')
        AND createdAt > DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);

      return { ok: true };
    }),

  // ── Unsend a message ───────────────────────────────────────────────
  unsendMessage: customerProc
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [msg] = await db.select()
        .from(schema.codexDirectMessages)
        .where(eq(schema.codexDirectMessages.id, input.messageId))
        .limit(1);

      if (!msg) throw new TRPCError({ code: "NOT_FOUND" });
      if (msg.senderId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      await db.update(schema.codexDirectMessages)
        .set({ isUnsent: true, content: null })
        .where(eq(schema.codexDirectMessages.id, input.messageId));

      return { ok: true };
    }),

  // ── Get circle members (for DM initiation + member list) ───────────
  getCircleMembers: customerProc
    .input(z.object({ circleId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const results = await db.execute(sql`
        SELECT cm.userId, cm.role, cm.trustScore, cm.joinedAt,
               u.name as userName,
               p.status as presenceStatus, p.lastSeenAt
        FROM codex_circle_members cm
        JOIN users u ON u.id = cm.userId
        LEFT JOIN codex_user_presence p ON p.userId = cm.userId
        WHERE cm.circleId = ${input.circleId} AND cm.status = 'active'
        ORDER BY
          CASE WHEN p.lastSeenAt > DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 0 ELSE 1 END,
          cm.trustScore DESC
      `);
      return ((results as any)[0] || []).map((m: any) => ({
        ...m,
        isOnline: m.presenceStatus === 'online' && m.lastSeenAt && new Date(m.lastSeenAt) > new Date(Date.now() - 5 * 60000),
      }));
    }),

  // ── Get or create the circle-wide chat conversation ────────────────
  getCircleChat: customerProc
    .input(z.object({ circleId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Find existing circle chat
      const existing = await db.execute(sql`
        SELECT c.id FROM codex_conversations c
        WHERE c.circleId = ${input.circleId} AND c.type = 'circle_chat'
        LIMIT 1
      `);
      const rows = (existing as any)[0];
      if (rows.length > 0) {
        return { conversationId: rows[0].id };
      }

      // Create circle chat + add all current members
      const convId = nanoid();
      await db.insert(schema.codexConversations).values({
        id: convId,
        circleId: input.circleId,
        type: "circle_chat",
        name: "Circle Chat",
        createdById: userId,
      });

      const members = await db.execute(sql`
        SELECT userId FROM codex_circle_members
        WHERE circleId = ${input.circleId} AND status = 'active'
      `);
      for (const m of (members as any)[0] || []) {
        await db.insert(schema.codexConversationParticipants).values({
          id: nanoid(),
          conversationId: convId,
          userId: m.userId,
          role: "member",
        });
      }

      return { conversationId: convId };
    }),

  // ── Get unread count across all conversations ──────────────────────
  getUnreadTotal: customerProc.query(async ({ ctx }) => {
    const db = getDb();
    const results = await db.execute(sql`
      SELECT COALESCE(SUM(cp.unreadCount), 0) as total
      FROM codex_conversation_participants cp
      WHERE cp.userId = ${ctx.user.id} AND cp.leftAt IS NULL
    `);
    return { total: ((results as any)[0]?.[0]?.total || 0) as number };
  }),

  // ── Pin/unpin conversation ─────────────────────────────────────────
  togglePin: customerProc
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.execute(sql`
        UPDATE codex_conversation_participants
        SET isPinned = NOT isPinned
        WHERE conversationId = ${input.conversationId} AND userId = ${ctx.user.id}
      `);
      return { ok: true };
    }),

  // ── Archive conversation ───────────────────────────────────────────
  archiveConversation: customerProc
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.execute(sql`
        UPDATE codex_conversation_participants
        SET isArchived = TRUE
        WHERE conversationId = ${input.conversationId} AND userId = ${ctx.user.id}
      `);
      return { ok: true };
    }),
});

export const codexRouter = router({
  admin: codexAdminRouter,
  client: codexClientRouter,
  public: codexPublicRouter,
  scroll: codexScrollRouter,
  dialogue: codexDialogueRouter,
  mirror: codexMirrorRouter,
  checkIn: codexCheckInRouter,
  adaptive: codexAdaptiveRouter,
  events: codexEventBusRouter,
  community: codexCommunityRouter,
  messaging: codexMessagingRouter,
});
