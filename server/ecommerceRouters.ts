import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, and, sql, desc, gte } from "drizzle-orm";

const adminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const token = ctx.req?.headers?.["x-admin-token"] as string;
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED" });
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  const [s] = await db.select().from(schema.adminSessions)
    .where(and(eq(schema.adminSessions.token, token), gte(schema.adminSessions.expiresAt, new Date())));
  if (!s) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, adminUsername: s.username } });
});

export const notificationsRouter = router({
  list: adminProcedure
    .input(z.object({ limit: z.number().optional().default(50), unreadOnly: z.boolean().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const c: any[] = [eq(schema.adminNotifications.dismissed, 0)];
      if (input?.unreadOnly) c.push(eq(schema.adminNotifications.read, 0));
      const notifs = await db.select().from(schema.adminNotifications)
        .where(and(...c)).orderBy(desc(schema.adminNotifications.createdAt)).limit(input?.limit || 50);
      const [uc] = await db.select({ count: sql<number>`count(*)` }).from(schema.adminNotifications)
        .where(and(eq(schema.adminNotifications.read, 0), eq(schema.adminNotifications.dismissed, 0)));
      return { notifications: notifs, unreadCount: uc?.count || 0 };
    }),
  markRead: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(schema.adminNotifications).set({ read: 1 }).where(eq(schema.adminNotifications.id, input.id));
    return { success: true };
  }),
  markAllRead: adminProcedure.mutation(async () => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(schema.adminNotifications).set({ read: 1 }).where(eq(schema.adminNotifications.read, 0));
    return { success: true };
  }),
  dismiss: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(schema.adminNotifications).set({ dismissed: 1 }).where(eq(schema.adminNotifications.id, input.id));
    return { success: true };
  }),
  dismissAll: adminProcedure.mutation(async () => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(schema.adminNotifications).set({ dismissed: 1 });
    return { success: true };
  }),
});

export const financialRouter = router({
  payments: adminProcedure
    .input(z.object({ status: z.string().optional(), limit: z.number().optional().default(50) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const conds: any[] = [];
      if (input?.status) conds.push(eq(schema.orders.paymentStatus, input.status as any));
      const rows = await db.select({
        id: schema.orders.id,
        orderNumber: schema.orders.orderNumber,
        email: schema.orders.email,
        total: schema.orders.total,
        paymentStatus: schema.orders.paymentStatus,
        paymentMethod: schema.orders.paymentMethod,
        status: schema.orders.status,
        createdAt: schema.orders.createdAt,
      }).from(schema.orders)
        .where(conds.length > 0 ? and(...conds) : undefined)
        .orderBy(desc(schema.orders.createdAt))
        .limit(input?.limit || 50);
      const [stats] = await db.select({
        total: sql<number>`COUNT(*)`,
        paid: sql<number>`SUM(CASE WHEN paymentStatus='paid' THEN 1 ELSE 0 END)`,
        pending: sql<number>`SUM(CASE WHEN paymentStatus='pending' THEN 1 ELSE 0 END)`,
        failed: sql<number>`SUM(CASE WHEN paymentStatus='failed' THEN 1 ELSE 0 END)`,
      }).from(schema.orders);
      return {
        payments: rows,
        stats: { total: stats?.total||0, paid: stats?.paid||0, pending: stats?.pending||0, failed: stats?.failed||0 },
      };
    }),

  overview: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const q = async (table: any, statusField: any, dateField: any, from?: Date, to?: Date) => {
      const c: any[] = [eq(statusField, "paid")];
      if (from) c.push(gte(dateField, from));
      if (to) c.push(sql`${dateField} < ${to}`);
      const [r] = await db.select({ rev: sql<number>`COALESCE(SUM(total),0)`, cnt: sql<number>`COUNT(*)` }).from(table).where(and(...c));
      return { rev: r?.rev || 0, cnt: r?.cnt || 0 };
    };

    const mShop = await q(schema.orders, schema.orders.paymentStatus, schema.orders.createdAt, thisMonth);
    const mEvt = await q(schema.eventRegistrations, schema.eventRegistrations.paymentStatus, schema.eventRegistrations.createdAt, thisMonth);
    const lShop = await q(schema.orders, schema.orders.paymentStatus, schema.orders.createdAt, lastMonth, thisMonth);
    const lEvt = await q(schema.eventRegistrations, schema.eventRegistrations.paymentStatus, schema.eventRegistrations.createdAt, lastMonth, thisMonth);
    const aShop = await q(schema.orders, schema.orders.paymentStatus, schema.orders.createdAt);
    const aEvt = await q(schema.eventRegistrations, schema.eventRegistrations.paymentStatus, schema.eventRegistrations.createdAt);

    const monthRev = mShop.rev + mEvt.rev;
    const lastMonthRev = lShop.rev + lEvt.rev;
    const allRev = aShop.rev + aEvt.rev;
    const allCnt = aShop.cnt + aEvt.cnt;
    const change = lastMonthRev > 0 ? Math.round(((monthRev - lastMonthRev) / lastMonthRev) * 100) : (monthRev > 0 ? 100 : 0);

    const [pendShip] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.orders)
      .where(and(eq(schema.orders.paymentStatus, "paid"), eq(schema.orders.status, "processing")));

    return {
      monthRevenue: monthRev, lastMonthRevenue: lastMonthRev, monthChange: change,
      allTimeRevenue: allRev, avgOrderValue: allCnt > 0 ? Math.round(allRev / allCnt) : 0,
      monthShopRevenue: mShop.rev, monthShopOrders: mShop.cnt,
      monthEventRevenue: mEvt.rev, monthEventRegs: mEvt.cnt,
      pendingShipments: pendShip?.count || 0,
    };
  }),
});
