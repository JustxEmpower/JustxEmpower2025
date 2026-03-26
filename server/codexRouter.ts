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
import { generateMirrorReport } from "./lib/codexMirrorReport";
import { routePortalContent } from "./lib/codexRoutingEngine";
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
  })).mutation(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
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
  updateProgress: customerProc.input(z.object({ assessmentId: z.string(), currentSection: z.number(), currentQuestion: z.number() })).mutation(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
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
    const prompt = await generateJournalPrompt(userContext);
    return { prompt };
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
            priority: escalation.severity === "critical" ? "critical" : "high",
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
      phase: scoring?.spectrumProfile?.thresholdPct > 40 ? "threshold" : "discovery",
      activeWounds: scoring?.activeWounds?.slice(0, 3).map((w: any) => w.wound),
      spectrumProfile: scoring?.spectrumProfile,
      integrationIndex: scoring?.integrationIndex,
    };

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

    // Get AI response — pass history so AI remembers context, flag if returning user
    const chatHistory = history.map(m => ({ role: m.role as "user" | "assistant", content: m.content }));
    let aiResponse = await codexGuideChat(input.guideId, input.message, chatHistory, userContext, isReturning, recalledTrajectory);

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
export const codexRouter = router({
  admin: codexAdminRouter,
  client: codexClientRouter,
});
