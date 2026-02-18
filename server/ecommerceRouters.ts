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
        paymentIntentId: schema.orders.paymentIntentId,
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
      return { rev: Number(r?.rev) || 0, cnt: Number(r?.cnt) || 0 };
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
      pendingShipments: Number(pendShip?.count) || 0,
    };
  }),
  // === COMMAND CENTER: All KPIs in one call ===
  commandCenter: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now); thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    const rev = async (table: any, sf: any, df: any, from?: Date, to?: Date) => {
      const c: any[] = [eq(sf, "paid")];
      if (from) c.push(gte(df, from));
      if (to) c.push(sql`${df} < ${to}`);
      const [r] = await db.select({ rev: sql<number>`COALESCE(SUM(total),0)`, cnt: sql<number>`COUNT(*)` }).from(table).where(and(...c));
      return { rev: Number(r?.rev) || 0, cnt: Number(r?.cnt) || 0 };
    };

    // Revenue by period
    const [todayShop, todayEvt] = await Promise.all([rev(schema.orders, schema.orders.paymentStatus, schema.orders.createdAt, today), rev(schema.eventRegistrations, schema.eventRegistrations.paymentStatus, schema.eventRegistrations.createdAt, today)]);
    const [weekShop, weekEvt] = await Promise.all([rev(schema.orders, schema.orders.paymentStatus, schema.orders.createdAt, thisWeek), rev(schema.eventRegistrations, schema.eventRegistrations.paymentStatus, schema.eventRegistrations.createdAt, thisWeek)]);
    const [monthShop, monthEvt] = await Promise.all([rev(schema.orders, schema.orders.paymentStatus, schema.orders.createdAt, thisMonth), rev(schema.eventRegistrations, schema.eventRegistrations.paymentStatus, schema.eventRegistrations.createdAt, thisMonth)]);
    const [lastMShop, lastMEvt] = await Promise.all([rev(schema.orders, schema.orders.paymentStatus, schema.orders.createdAt, lastMonth, thisMonth), rev(schema.eventRegistrations, schema.eventRegistrations.paymentStatus, schema.eventRegistrations.createdAt, lastMonth, thisMonth)]);
    const [yearShop, yearEvt] = await Promise.all([rev(schema.orders, schema.orders.paymentStatus, schema.orders.createdAt, thisYear), rev(schema.eventRegistrations, schema.eventRegistrations.paymentStatus, schema.eventRegistrations.createdAt, thisYear)]);
    const [allShop, allEvt] = await Promise.all([rev(schema.orders, schema.orders.paymentStatus, schema.orders.createdAt), rev(schema.eventRegistrations, schema.eventRegistrations.paymentStatus, schema.eventRegistrations.createdAt)]);

    // Payment health
    const [ph] = await db.select({
      total: sql<number>`COUNT(*)`,
      paid: sql<number>`SUM(CASE WHEN paymentStatus='paid' THEN 1 ELSE 0 END)`,
      failed: sql<number>`SUM(CASE WHEN paymentStatus='failed' THEN 1 ELSE 0 END)`,
      refunded: sql<number>`SUM(CASE WHEN paymentStatus='refunded' OR paymentStatus='partially_refunded' THEN 1 ELSE 0 END)`,
      disputed: sql<number>`SUM(CASE WHEN paymentStatus='disputed' THEN 1 ELSE 0 END)`,
      pending: sql<number>`SUM(CASE WHEN paymentStatus='pending' THEN 1 ELSE 0 END)`,
      refundedAmt: sql<number>`COALESCE(SUM(CASE WHEN paymentStatus='refunded' OR paymentStatus='partially_refunded' THEN total ELSE 0 END),0)`,
    }).from(schema.orders);

    // Pending actions
    const [pendShip] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.orders).where(and(eq(schema.orders.paymentStatus, "paid"), eq(schema.orders.status, "processing")));
    const [pendOrders] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.orders).where(eq(schema.orders.status, "pending"));
    const [lowStock] = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.products).where(and(eq(schema.products.status, "active"), sql`${schema.products.stock} <= ${schema.products.lowStockThreshold}`, eq(schema.products.trackInventory, 1)));

    const allRev = allShop.rev + allEvt.rev;
    const allCnt = allShop.cnt + allEvt.cnt;
    const monthRev = monthShop.rev + monthEvt.rev;
    const lastMonthRev = lastMShop.rev + lastMEvt.rev;
    const monthChange = lastMonthRev > 0 ? Math.round(((monthRev - lastMonthRev) / lastMonthRev) * 100) : (monthRev > 0 ? 100 : 0);

    return {
      todayRevenue: todayShop.rev + todayEvt.rev, todayOrders: todayShop.cnt + todayEvt.cnt,
      weekRevenue: weekShop.rev + weekEvt.rev, weekOrders: weekShop.cnt + weekEvt.cnt,
      monthRevenue: monthRev, monthOrders: monthShop.cnt + monthEvt.cnt,
      lastMonthRevenue: lastMonthRev, monthChange,
      yearRevenue: yearShop.rev + yearEvt.rev, yearOrders: yearShop.cnt + yearEvt.cnt,
      allTimeRevenue: allRev, allTimeOrders: allCnt,
      avgOrderValue: allCnt > 0 ? Math.round(allRev / allCnt) : 0,
      shopRevenue: allShop.rev, shopOrders: allShop.cnt,
      eventRevenue: allEvt.rev, eventRegistrations: allEvt.cnt,
      paymentHealth: {
        total: Number(ph?.total) || 0, paid: Number(ph?.paid) || 0,
        failed: Number(ph?.failed) || 0, refunded: Number(ph?.refunded) || 0,
        disputed: Number(ph?.disputed) || 0, pending: Number(ph?.pending) || 0,
        refundedAmount: Number(ph?.refundedAmt) || 0,
        successRate: Number(ph?.total) > 0 ? Math.round((Number(ph?.paid) / Number(ph?.total)) * 100) : 0,
      },
      pendingShipments: Number(pendShip?.count) || 0,
      pendingOrders: Number(pendOrders?.count) || 0,
      lowStockProducts: Number(lowStock?.count) || 0,
    };
  }),

  // === REVENUE BY PRODUCT: Top sellers ===
  revenueByProduct: adminProcedure.input(z.object({ limit: z.number().optional().default(10) }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const rows = await db.select({
      productId: schema.orderItems.productId,
      name: schema.orderItems.name,
      imageUrl: schema.orderItems.imageUrl,
      totalRevenue: sql<number>`COALESCE(SUM(${schema.orderItems.total}), 0)`,
      totalQty: sql<number>`COALESCE(SUM(${schema.orderItems.quantity}), 0)`,
      orderCount: sql<number>`COUNT(DISTINCT ${schema.orderItems.orderId})`,
    }).from(schema.orderItems)
      .groupBy(schema.orderItems.productId, schema.orderItems.name, schema.orderItems.imageUrl)
      .orderBy(sql`SUM(${schema.orderItems.total}) DESC`)
      .limit(input?.limit || 10);
    return rows.map(r => ({ ...r, totalRevenue: Number(r.totalRevenue) || 0, totalQty: Number(r.totalQty) || 0, orderCount: Number(r.orderCount) || 0 }));
  }),

  // === REVENUE BY DAY: Last 30 days trend ===
  revenueByDay: adminProcedure.input(z.object({ days: z.number().optional().default(30) }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const days = input?.days || 30;
    const since = new Date(); since.setDate(since.getDate() - days);
    const shopRows = await db.select({
      day: sql<string>`DATE(createdAt)`.as('day'),
      revenue: sql<number>`COALESCE(SUM(total), 0)`,
      count: sql<number>`COUNT(*)`,
    }).from(schema.orders).where(and(eq(schema.orders.paymentStatus, "paid"), gte(schema.orders.createdAt, since))).groupBy(sql`DATE(createdAt)`).orderBy(sql`DATE(createdAt)`);
    const eventRows = await db.select({
      day: sql<string>`DATE(createdAt)`.as('day'),
      revenue: sql<number>`COALESCE(SUM(total), 0)`,
      count: sql<number>`COUNT(*)`,
    }).from(schema.eventRegistrations).where(and(eq(schema.eventRegistrations.paymentStatus, "paid"), gte(schema.eventRegistrations.createdAt, since))).groupBy(sql`DATE(createdAt)`).orderBy(sql`DATE(createdAt)`);

    const map: Record<string, { shopRevenue: number; eventRevenue: number; shopOrders: number; eventOrders: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().split("T")[0];
      map[key] = { shopRevenue: 0, eventRevenue: 0, shopOrders: 0, eventOrders: 0 };
    }
    shopRows.forEach(r => { const k = String(r.day); if (map[k]) { map[k].shopRevenue = Number(r.revenue) || 0; map[k].shopOrders = Number(r.count) || 0; } });
    eventRows.forEach(r => { const k = String(r.day); if (map[k]) { map[k].eventRevenue = Number(r.revenue) || 0; map[k].eventOrders = Number(r.count) || 0; } });
    return Object.entries(map).map(([date, d]) => ({ date, ...d, totalRevenue: d.shopRevenue + d.eventRevenue, totalOrders: d.shopOrders + d.eventOrders }));
  }),

  // === TOP CUSTOMERS ===
  topCustomers: adminProcedure.input(z.object({ limit: z.number().optional().default(10) }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const rows = await db.select({
      email: schema.orders.email,
      totalSpent: sql<number>`COALESCE(SUM(${schema.orders.total}), 0)`,
      orderCount: sql<number>`COUNT(*)`,
      lastOrder: sql<string>`MAX(${schema.orders.createdAt})`,
      avgOrder: sql<number>`ROUND(AVG(${schema.orders.total}))`,
    }).from(schema.orders).where(eq(schema.orders.paymentStatus, "paid"))
      .groupBy(schema.orders.email)
      .orderBy(sql`SUM(${schema.orders.total}) DESC`)
      .limit(input?.limit || 10);
    return rows.map(r => ({ ...r, totalSpent: Number(r.totalSpent) || 0, orderCount: Number(r.orderCount) || 0, avgOrder: Number(r.avgOrder) || 0 }));
  }),

  // === LOW STOCK ALERTS ===
  lowStockAlerts: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const rows = await db.select({
      id: schema.products.id, name: schema.products.name, sku: schema.products.sku,
      stock: schema.products.stock, lowStockThreshold: schema.products.lowStockThreshold,
      price: schema.products.price, featuredImage: schema.products.featuredImage,
    }).from(schema.products).where(and(
      eq(schema.products.status, "active"), eq(schema.products.trackInventory, 1),
      sql`${schema.products.stock} <= ${schema.products.lowStockThreshold}`
    )).orderBy(schema.products.stock).limit(20);
    return rows;
  }),

  // === ABANDONED CARTS ===
  abandonedCarts: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const cutoff = new Date(); cutoff.setHours(cutoff.getHours() - 1);
    const [stats] = await db.select({
      count: sql<number>`COUNT(*)`,
      totalValue: sql<number>`COALESCE(SUM(subtotal), 0)`,
    }).from(schema.shoppingCarts).where(sql`${schema.shoppingCarts.updatedAt} < ${cutoff}`);
    return { count: Number(stats?.count) || 0, totalValue: Number(stats?.totalValue) || 0 };
  }),

  // === RECENT ACTIVITY FEED ===
  activityFeed: adminProcedure.input(z.object({ limit: z.number().optional().default(20) }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const orders = await db.select({
      id: schema.orders.id, type: sql<string>`'order'`.as('type'),
      ref: schema.orders.orderNumber, email: schema.orders.email,
      amount: schema.orders.total, status: schema.orders.status,
      paymentStatus: schema.orders.paymentStatus,
      paymentIntentId: schema.orders.paymentIntentId,
      createdAt: schema.orders.createdAt,
    }).from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(input?.limit || 20);

    const regs = await db.select({
      id: schema.eventRegistrations.id, type: sql<string>`'event'`.as('type'),
      ref: schema.eventRegistrations.confirmationNumber, email: schema.eventRegistrations.email,
      amount: schema.eventRegistrations.total, status: schema.eventRegistrations.status,
      paymentStatus: schema.eventRegistrations.paymentStatus,
      paymentIntentId: schema.eventRegistrations.paymentIntentId,
      createdAt: schema.eventRegistrations.createdAt,
    }).from(schema.eventRegistrations).orderBy(desc(schema.eventRegistrations.createdAt)).limit(input?.limit || 20);

    return [...orders, ...regs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, input?.limit || 20);
  }),

});
