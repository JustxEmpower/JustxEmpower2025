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
import Stripe from "stripe";

let _stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!_stripe && process.env.STRIPE_SECRET_KEY) {
    try { _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" as any }); } catch {}
  }
  return _stripe;
}

function cuid() { return nanoid(25); }

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
  const id = cuid();
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
    const id = cuid();
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
    const completedModules = [...new Set(scrollProgress.map(e => e.moduleNum))];

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
    const id = cuid();
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
    const id = cuid();
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
    const scoringId = cuid();
    await db.insert(schema.codexScorings).values({ id: scoringId, assessmentId: input.assessmentId, resultJson: JSON.stringify(result) });

    // Mark assessment complete
    await db.update(schema.codexAssessments).set({ status: "complete", completedAt: new Date() }).where(eq(schema.codexAssessments.id, input.assessmentId));

    // Auto-generate mirror report
    const reportId = cuid();
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
      await db.insert(schema.codexScrollEntries).values({ id: cuid(), userId: u.id, moduleNum: input.moduleNum, promptId: input.promptId, responseText: input.responseText });
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

  // Get constants (archetypes, tiers, scroll modules) for frontend
  constants: publicProcedure.query(() => ({
    sectionMeta: SECTION_META,
    archetypes: ARCHETYPES,
    journeyTiers: JOURNEY_TIERS,
    scrollModules: SCROLL_MODULES,
  })),
});

// ══════════════════════════════════════════════════════════════════════
// COMBINED ROUTER
// ══════════════════════════════════════════════════════════════════════
export const codexRouter = router({
  admin: codexAdminRouter,
  client: codexClientRouter,
});
