import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, lt, desc } from "drizzle-orm";
import { getUspsTracking } from "./uspsTracking";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

async function createSession(cid: number) {
  const db = await getDb(); if (!db) throw new Error("DB N/A");
  const token = nanoid(64);
  await db.insert(schema.customerSessions).values({ token, customerId: cid, expiresAt: new Date(Date.now() + 30*24*60*60*1000) });
  return token;
}

async function validateSession(token: string) {
  const db = await getDb(); if (!db) return null;
  const [s] = await db.select().from(schema.customerSessions).where(eq(schema.customerSessions.token, token)).limit(1);
  if (!s || s.expiresAt < new Date()) return null;
  const [c] = await db.select().from(schema.customers).where(eq(schema.customers.id, s.customerId)).limit(1);
  return c || null;
}

const cp = publicProcedure.use(async ({ ctx, next }) => {
  const t = ctx.req.headers["x-customer-token"] as string;
  if (!t) throw new TRPCError({ code: "UNAUTHORIZED", message: "Please log in" });
  const customer = await validateSession(t);
  if (!customer) throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expired" });
  return next({ ctx: { ...ctx, customer } });
});

function safe(c: schema.Customer) {
  return { id: c.id, email: c.email, firstName: c.firstName, lastName: c.lastName, phone: c.phone, tier: c.tier, emailVerified: c.emailVerified, createdAt: c.createdAt };
}

export const customerRouter = router({
  register: publicProcedure.input(z.object({ email: z.string().email(), password: z.string().min(8), firstName: z.string().min(1), lastName: z.string().min(1), phone: z.string().optional() })).mutation(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [ex] = await db.select().from(schema.customers).where(eq(schema.customers.email, input.email.toLowerCase())).limit(1);
    if (ex) throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
    const ph = await bcrypt.hash(input.password, 12);
    const [r] = await db.insert(schema.customers).values({ email: input.email.toLowerCase(), passwordHash: ph, firstName: input.firstName, lastName: input.lastName, phone: input.phone || null, emailVerifyToken: nanoid(32) });
    const token = await createSession(r.insertId);
    return { success: true, token, customer: { id: r.insertId, email: input.email.toLowerCase(), firstName: input.firstName, lastName: input.lastName } };
  }),
  login: publicProcedure.input(z.object({ email: z.string().email(), password: z.string() })).mutation(async ({ input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [c] = await db.select().from(schema.customers).where(eq(schema.customers.email, input.email.toLowerCase())).limit(1);
    if (!c || !(await bcrypt.compare(input.password, c.passwordHash))) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
    await db.update(schema.customers).set({ lastLoginAt: new Date() }).where(eq(schema.customers.id, c.id));
    const token = await createSession(c.id);
    return { success: true, token, customer: safe(c) };
  }),
  logout: cp.mutation(async ({ ctx }) => {
    const db = await getDb(); const t = ctx.req.headers["x-customer-token"] as string;
    if (db && t) await db.delete(schema.customerSessions).where(eq(schema.customerSessions.token, t));
    return { success: true };
  }),
  me: cp.query(({ ctx }) => ({ valid: true, customer: safe((ctx as any).customer) })),
  updateProfile: cp.input(z.object({ firstName: z.string().min(1).optional(), lastName: z.string().min(1).optional(), phone: z.string().optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const c = (ctx as any).customer as schema.Customer;
    const updates: any = {};
    if (input.firstName) updates.firstName = input.firstName;
    if (input.lastName) updates.lastName = input.lastName;
    if (input.phone !== undefined) updates.phone = input.phone || null;
    await db.update(schema.customers).set(updates).where(eq(schema.customers.id, c.id));
    return { success: true };
  }),
  changePassword: cp.input(z.object({ currentPassword: z.string(), newPassword: z.string().min(8) })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const c = (ctx as any).customer as schema.Customer;
    if (!(await bcrypt.compare(input.currentPassword, c.passwordHash))) throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password incorrect" });
    await db.update(schema.customers).set({ passwordHash: await bcrypt.hash(input.newPassword, 12) }).where(eq(schema.customers.id, c.id));
    return { success: true };
  }),
  // ── Phase 3: Address Book ───────────────────────────────────────────
  addresses: cp.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const c = (ctx as any).customer as schema.Customer;
    return db.select().from(schema.customerAddresses).where(eq(schema.customerAddresses.customerId, c.id));
  }),
  addAddress: cp.input(z.object({ label: z.string().optional(), firstName: z.string().min(1), lastName: z.string().min(1), address1: z.string().min(1), address2: z.string().optional(), city: z.string().min(1), state: z.string().min(1), postalCode: z.string().min(1), country: z.string().default("US"), phone: z.string().optional(), isDefaultShipping: z.boolean().optional(), isDefaultBilling: z.boolean().optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const c = (ctx as any).customer as schema.Customer;
    if (input.isDefaultShipping) await db.update(schema.customerAddresses).set({ isDefaultShipping: 0 }).where(eq(schema.customerAddresses.customerId, c.id));
    if (input.isDefaultBilling) await db.update(schema.customerAddresses).set({ isDefaultBilling: 0 }).where(eq(schema.customerAddresses.customerId, c.id));
    const [r] = await db.insert(schema.customerAddresses).values({ ...input, customerId: c.id, address2: input.address2 || null, phone: input.phone || null, label: input.label || null, isDefaultShipping: input.isDefaultShipping ? 1 : 0, isDefaultBilling: input.isDefaultBilling ? 1 : 0 });
    return { success: true, id: r.insertId };
  }),
  updateAddress: cp.input(z.object({ id: z.number(), label: z.string().optional(), firstName: z.string().optional(), lastName: z.string().optional(), address1: z.string().optional(), address2: z.string().optional(), city: z.string().optional(), state: z.string().optional(), postalCode: z.string().optional(), country: z.string().optional(), phone: z.string().optional(), isDefaultShipping: z.boolean().optional(), isDefaultBilling: z.boolean().optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const c = (ctx as any).customer as schema.Customer;
    const { id, isDefaultShipping, isDefaultBilling, ...rest } = input;
    if (isDefaultShipping) await db.update(schema.customerAddresses).set({ isDefaultShipping: 0 }).where(eq(schema.customerAddresses.customerId, c.id));
    if (isDefaultBilling) await db.update(schema.customerAddresses).set({ isDefaultBilling: 0 }).where(eq(schema.customerAddresses.customerId, c.id));
    const updates: any = { ...rest };
    if (isDefaultShipping !== undefined) updates.isDefaultShipping = isDefaultShipping ? 1 : 0;
    if (isDefaultBilling !== undefined) updates.isDefaultBilling = isDefaultBilling ? 1 : 0;
    await db.update(schema.customerAddresses).set(updates).where(eq(schema.customerAddresses.id, id));
    return { success: true };
  }),
  deleteAddress: cp.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const c = (ctx as any).customer as schema.Customer;
    const [addr] = await db.select().from(schema.customerAddresses).where(eq(schema.customerAddresses.id, input.id)).limit(1);
    if (!addr || addr.customerId !== c.id) throw new TRPCError({ code: "NOT_FOUND" });
    await db.delete(schema.customerAddresses).where(eq(schema.customerAddresses.id, input.id));
    return { success: true };
  }),
  // ── Phase 6: Guest-to-account conversion ───────────────────────────
  claimGuestOrders: cp.mutation(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const c = (ctx as any).customer as schema.Customer;
    const [result] = await db.update(schema.orders).set({ userId: c.id }).where(eq(schema.orders.email, c.email));
    return { success: true, claimed: (result as any).affectedRows || 0 };
  }),
  // ── Phase 4: Wishlist ──────────────────────────────────────────────
  wishlist: cp.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const c = (ctx as any).customer as schema.Customer;
    const rows = await db.select().from(schema.customerWishlist).where(eq(schema.customerWishlist.customerId, c.id));
    if (rows.length === 0) return [];
    const pids = rows.map(r => r.productId);
    const products = await db.select().from(schema.products).where(eq(schema.products.id, pids[0]));
    for (let i = 1; i < pids.length; i++) { const [p] = await db.select().from(schema.products).where(eq(schema.products.id, pids[i])).limit(1); if (p) products.push(p); }
    return rows.map(r => ({ ...r, product: products.find(p => p.id === r.productId) || null }));
  }),
  addToWishlist: cp.input(z.object({ productId: z.number(), variantId: z.number().optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const c = (ctx as any).customer as schema.Customer;
    const [ex] = await db.select().from(schema.customerWishlist).where(eq(schema.customerWishlist.customerId, c.id)).limit(100);
    const exists = ex && (await db.select().from(schema.customerWishlist).where(eq(schema.customerWishlist.customerId, c.id))).find(w => w.productId === input.productId);
    if (exists) return { success: true, alreadyExists: true };
    await db.insert(schema.customerWishlist).values({ customerId: c.id, productId: input.productId, variantId: input.variantId || null });
    return { success: true, alreadyExists: false };
  }),
  removeFromWishlist: cp.input(z.object({ productId: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const c = (ctx as any).customer as schema.Customer;
    const items = await db.select().from(schema.customerWishlist).where(eq(schema.customerWishlist.customerId, c.id));
    const item = items.find(w => w.productId === input.productId);
    if (item) await db.delete(schema.customerWishlist).where(eq(schema.customerWishlist.id, item.id));
    return { success: true };
  }),
  // ── Phase 2: Order History ──────────────────────────────────────────
  orders: cp.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const c = (ctx as any).customer as schema.Customer;
    const rows = await db.select().from(schema.orders).where(eq(schema.orders.userId, c.id)).orderBy(desc(schema.orders.createdAt));
    return rows.map(o => ({ id: o.id, orderNumber: o.orderNumber, status: o.status, total: o.total, currency: o.currency, createdAt: o.createdAt, trackingNumber: o.trackingNumber, carrier: o.carrier, itemCount: 0 }));
  }),
  orderDetail: cp.input(z.object({ orderNumber: z.string() })).query(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const c = (ctx as any).customer as schema.Customer;
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.orderNumber, input.orderNumber)).limit(1);
    if (!order || order.userId !== c.id) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
    const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
    let tracking = null;
    if (order.trackingNumber) { try { tracking = await getUspsTracking(order.trackingNumber); } catch (_) {} }
    return { ...order, items, tracking };
  }),
});
