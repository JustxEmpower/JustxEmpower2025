import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, asc, desc } from "drizzle-orm";

async function valAdmin(token: string) {
  const db = await getDb(); if (!db) return null;
  const [s] = await db.select().from(schema.adminSessions).where(eq(schema.adminSessions.token, token)).limit(1);
  return (s && s.expiresAt > new Date()) ? s.username : null;
}

const ap = publicProcedure.use(async ({ ctx, next }) => {
  const t = ctx.req.headers["x-admin-token"] as string;
  if (!t) throw new TRPCError({ code: "UNAUTHORIZED" });
  const u = await valAdmin(t);
  if (!u) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, adminUsername: u } });
});

export const governanceRouter = router({
  // ── Governance Config CRUD ──
  list: ap.input(z.object({ category: z.string().optional() })).query(async ({ input }) => {
    const db = await getDb(); if (!db) return [];
    if (input.category) return db.select().from(schema.codexAIGovernance).where(eq(schema.codexAIGovernance.category, input.category));
    return db.select().from(schema.codexAIGovernance);
  }),

  upsert: ap.input(z.object({
    id: z.number().optional(),
    configKey: z.string(),
    configValue: z.string(),
    category: z.string(),
    guideId: z.string().nullable().optional(),
    label: z.string(),
    description: z.string().nullable().optional(),
    isActive: z.number().default(1),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const v: any = {
      configKey: input.configKey, configValue: input.configValue,
      category: input.category, guideId: input.guideId || null,
      label: input.label, description: input.description || null,
      isActive: input.isActive, updatedBy: (ctx as any).adminUsername,
    };
    if (input.id) {
      await db.update(schema.codexAIGovernance).set(v).where(eq(schema.codexAIGovernance.id, input.id));
      return { ok: true, id: input.id };
    }
    await db.insert(schema.codexAIGovernance).values(v);
    return { ok: true };
  }),

  del: ap.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(schema.codexAIGovernance).where(eq(schema.codexAIGovernance.id, input.id));
    return { ok: true };
  }),

  // ── Escalation Resources CRUD ──
  resources: ap.query(async () => {
    const db = await getDb(); if (!db) return [];
    return db.select().from(schema.codexEscalationResources).orderBy(asc(schema.codexEscalationResources.displayOrder));
  }),

  resourceUpsert: ap.input(z.object({
    id: z.number().optional(),
    name: z.string(),
    contact: z.string(),
    url: z.string().nullable().optional(),
    availability: z.string().default("24/7"),
    category: z.string(),
    triggerTypes: z.string().nullable().optional(),
    displayOrder: z.number().default(0),
    isActive: z.number().default(1),
  })).mutation(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { id, ...v } = input;
    if (id) {
      await db.update(schema.codexEscalationResources).set(v).where(eq(schema.codexEscalationResources.id, id));
      return { ok: true };
    }
    await db.insert(schema.codexEscalationResources).values(v);
    return { ok: true };
  }),

  resourceDelete: ap.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(schema.codexEscalationResources).where(eq(schema.codexEscalationResources.id, input.id));
    return { ok: true };
  }),

  // ── Escalation Templates CRUD ──
  templates: ap.query(async () => {
    const db = await getDb(); if (!db) return [];
    return db.select().from(schema.codexEscalationTemplates).orderBy(asc(schema.codexEscalationTemplates.severity));
  }),

  templateUpsert: ap.input(z.object({
    id: z.number().optional(),
    severity: z.string(),
    templateText: z.string(),
    label: z.string().nullable().optional(),
    isActive: z.number().default(1),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { id, ...v } = input;
    const vals = { ...v, updatedBy: (ctx as any).adminUsername };
    if (id) {
      await db.update(schema.codexEscalationTemplates).set(vals).where(eq(schema.codexEscalationTemplates.id, id));
      return { ok: true };
    }
    await db.insert(schema.codexEscalationTemplates).values(vals);
    return { ok: true };
  }),

  templateDelete: ap.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(schema.codexEscalationTemplates).where(eq(schema.codexEscalationTemplates.id, input.id));
    return { ok: true };
  }),

  // ── Escalation Log (read-only from admin, written by AI engine) ──
  logs: ap.input(z.object({ limit: z.number().default(50) })).query(async ({ input }) => {
    const db = await getDb(); if (!db) return [];
    return db.select().from(schema.codexEscalationLog).orderBy(desc(schema.codexEscalationLog.createdAt)).limit(input.limit);
  }),

  logResolve: ap.input(z.object({ id: z.number(), notes: z.string().optional() })).mutation(async ({ input, ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(schema.codexEscalationLog).set({
      resolved: 1, resolvedBy: (ctx as any).adminUsername, notes: input.notes || null,
    }).where(eq(schema.codexEscalationLog.id, input.id));
    return { ok: true };
  }),
});
