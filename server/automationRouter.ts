/**
 * Automation Router - Automated tasks and workflows
 * 
 * Features:
 * - Scheduled tasks (backups, reports, cleanup)
 * - Triggered automations (on order, on signup, etc.)
 * - Email notifications
 * - Webhook integrations
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, desc, sql, and, gte, lte, lt } from "drizzle-orm";
import { sendEmail } from "./emailService";

// Admin procedure middleware
const adminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const authHeader = ctx.req.headers["x-admin-token"];
  if (!authHeader || typeof authHeader !== "string") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin authentication required" });
  }
  
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  
  const [session] = await db
    .select()
    .from(schema.adminSessions)
    .where(eq(schema.adminSessions.token, authHeader))
    .limit(1);
  
  if (!session || new Date(session.expiresAt) < new Date()) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired session" });
  }
  
  return next({ ctx: { ...ctx, adminUsername: session.username } });
});

export const automationRouter = router({
  // ═══════════════════════════════════════════════════════════════════════════
  // DAILY DIGEST - Generate and send daily site summary
  // ═══════════════════════════════════════════════════════════════════════════
  generateDailyDigest: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Gather stats from the last 24 hours
    const [
      newOrders,
      newSubscribers,
      newSubmissions,
      orderRevenue,
      newRegistrations,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(schema.orders).where(gte(schema.orders.createdAt, yesterday)),
      db.select({ count: sql<number>`count(*)` }).from(schema.newsletterSubscribers).where(gte(schema.newsletterSubscribers.createdAt, yesterday)),
      db.select({ count: sql<number>`count(*)` }).from(schema.formSubmissions).where(gte(schema.formSubmissions.submittedAt, yesterday)),
      db.select({ total: sql<number>`COALESCE(SUM(total), 0)` }).from(schema.orders).where(and(
        gte(schema.orders.createdAt, yesterday),
        eq(schema.orders.paymentStatus, "paid")
      )),
      db.select({ count: sql<number>`count(*)` }).from(schema.eventRegistrations).where(gte(schema.eventRegistrations.createdAt, yesterday)),
    ]);

    const digest = {
      date: new Date().toISOString().split('T')[0],
      stats: {
        newOrders: newOrders[0]?.count || 0,
        revenue: orderRevenue[0]?.total || 0,
        newSubscribers: newSubscribers[0]?.count || 0,
        newSubmissions: newSubmissions[0]?.count || 0,
        newRegistrations: newRegistrations[0]?.count || 0,
      },
      generatedAt: new Date().toISOString(),
    };

    return digest;
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // SEND DIGEST EMAIL - Send the daily digest to admins
  // ═══════════════════════════════════════════════════════════════════════════
  sendDigestEmail: adminProcedure
    .input(z.object({
      recipients: z.array(z.string().email()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Gather stats
      const [newOrders, orderRevenue, newSubscribers, newSubmissions] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(schema.orders).where(gte(schema.orders.createdAt, yesterday)),
        db.select({ total: sql<number>`COALESCE(SUM(total), 0)` }).from(schema.orders).where(and(
          gte(schema.orders.createdAt, yesterday),
          eq(schema.orders.paymentStatus, "paid")
        )),
        db.select({ count: sql<number>`count(*)` }).from(schema.newsletterSubscribers).where(gte(schema.newsletterSubscribers.createdAt, yesterday)),
        db.select({ count: sql<number>`count(*)` }).from(schema.formSubmissions).where(gte(schema.formSubmissions.submittedAt, yesterday)),
      ]);

      const revenue = (orderRevenue[0]?.total || 0) / 100;
      const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Georgia, serif; background: #faf8f5; padding: 40px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 24px; font-style: italic; color: #1a1a19; }
    .date { color: #666; font-size: 14px; margin-top: 8px; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 32px 0; }
    .stat { background: #faf8f5; border-radius: 12px; padding: 20px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: bold; color: #1a1a19; }
    .stat-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-top: 8px; }
    .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5; }
    .footer a { color: #c9a86c; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Just Empower</div>
      <div class="date">${dateStr}</div>
    </div>
    
    <h2 style="text-align: center; font-weight: normal; font-style: italic;">Daily Digest</h2>
    
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${newOrders[0]?.count || 0}</div>
        <div class="stat-label">New Orders</div>
      </div>
      <div class="stat">
        <div class="stat-value">$${revenue.toLocaleString()}</div>
        <div class="stat-label">Revenue</div>
      </div>
      <div class="stat">
        <div class="stat-value">${newSubscribers[0]?.count || 0}</div>
        <div class="stat-label">New Subscribers</div>
      </div>
      <div class="stat">
        <div class="stat-value">${newSubmissions[0]?.count || 0}</div>
        <div class="stat-label">Messages</div>
      </div>
    </div>
    
    <div class="footer">
      <p><a href="${process.env.SITE_URL || 'https://justxempower.com'}/admin">View Admin Dashboard →</a></p>
    </div>
  </div>
</body>
</html>`;

      // Send to each recipient
      const results = await Promise.allSettled(
        input.recipients.map(email => 
          sendEmail([email], `Just Empower Daily Digest - ${dateStr}`, htmlContent)
        )
      );

      const sent = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return { sent, failed, total: input.recipients.length };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP TASKS - Automated maintenance
  // ═══════════════════════════════════════════════════════════════════════════
  cleanupExpiredSessions: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const now = new Date();
    const result = await db
      .delete(schema.adminSessions)
      .where(lt(schema.adminSessions.expiresAt, now));
    
    return { success: true, message: "Expired sessions cleaned up" };
  }),

  cleanupAbandonedCarts: adminProcedure
    .input(z.object({
      olderThanHours: z.number().min(1).max(720).default(48),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const cutoff = new Date(Date.now() - input.olderThanHours * 60 * 60 * 1000);
      
      const result = await db
        .delete(schema.shoppingCarts)
        .where(lt(schema.shoppingCarts.updatedAt, cutoff));
      
      return { success: true, message: `Abandoned carts older than ${input.olderThanHours} hours cleaned up` };
    }),

  cleanupExpiredReservations: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const now = new Date();
    
    // Get expired reservations
    const expired = await db
      .select()
      .from(schema.inventoryReservations)
      .where(lt(schema.inventoryReservations.expiresAt, now));
    
    // Restore stock for each expired reservation
    for (const reservation of expired) {
      if (reservation.variantId) {
        await db.update(schema.productVariants)
          .set({ stock: sql`${schema.productVariants.stock} + ${reservation.quantity}` })
          .where(eq(schema.productVariants.id, reservation.variantId));
      } else {
        await db.update(schema.products)
          .set({ stock: sql`${schema.products.stock} + ${reservation.quantity}` })
          .where(eq(schema.products.id, reservation.productId));
      }
    }
    
    // Delete expired reservations
    await db.delete(schema.inventoryReservations).where(lt(schema.inventoryReservations.expiresAt, now));
    
    return { success: true, released: expired.length };
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // LOW STOCK ALERTS - Check and notify about low stock
  // ═══════════════════════════════════════════════════════════════════════════
  checkLowStock: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const lowStockProducts = await db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        sku: schema.products.sku,
        stock: schema.products.stock,
        threshold: schema.products.lowStockThreshold,
      })
      .from(schema.products)
      .where(and(
        eq(schema.products.trackInventory, 1),
        eq(schema.products.status, "active"),
        sql`${schema.products.stock} <= ${schema.products.lowStockThreshold}`
      ));
    
    return {
      count: lowStockProducts.length,
      products: lowStockProducts,
    };
  }),

  sendLowStockAlert: adminProcedure
    .input(z.object({
      recipients: z.array(z.string().email()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const lowStockProducts = await db
        .select({
          id: schema.products.id,
          name: schema.products.name,
          sku: schema.products.sku,
          stock: schema.products.stock,
          threshold: schema.products.lowStockThreshold,
        })
        .from(schema.products)
        .where(and(
          eq(schema.products.trackInventory, 1),
          eq(schema.products.status, "active"),
          sql`${schema.products.stock} <= ${schema.products.lowStockThreshold}`
        ));
      
      if (lowStockProducts.length === 0) {
        return { sent: false, message: "No low stock items to report" };
      }
      
      const productRows = lowStockProducts.map(p => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${p.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${p.sku || '-'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center; color: ${(p.stock || 0) === 0 ? '#dc2626' : '#f59e0b'};">${p.stock}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${p.threshold}</td>
        </tr>
      `).join('');
      
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Georgia, serif; background: #faf8f5; padding: 40px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; }
    .alert { background: #fef3cd; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
    .alert-icon { font-size: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #faf8f5; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="alert">
      <span class="alert-icon">⚠️</span>
      <strong>Low Stock Alert</strong>
      <p style="margin: 8px 0 0 0; font-size: 14px;">${lowStockProducts.length} product(s) need restocking</p>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>SKU</th>
          <th style="text-align: center;">Stock</th>
          <th style="text-align: center;">Threshold</th>
        </tr>
      </thead>
      <tbody>
        ${productRows}
      </tbody>
    </table>
    
    <p style="text-align: center; margin-top: 24px;">
      <a href="${process.env.SITE_URL || 'https://justxempower.com'}/admin/products" style="color: #c9a86c;">Manage Inventory →</a>
    </p>
  </div>
</body>
</html>`;

      const results = await Promise.allSettled(
        input.recipients.map(email => 
          sendEmail([email], `⚠️ Low Stock Alert - ${lowStockProducts.length} items need restocking`, htmlContent)
        )
      );

      return { 
        sent: true, 
        recipients: results.filter(r => r.status === 'fulfilled').length,
        products: lowStockProducts.length,
      };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // ORDER NOTIFICATIONS - Send order-related emails
  // ═══════════════════════════════════════════════════════════════════════════
  sendOrderConfirmation: adminProcedure
    .input(z.object({
      orderId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const [order] = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, input.orderId))
        .limit(1);
      
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }
      
      // Get order items
      const items = await db
        .select()
        .from(schema.orderItems)
        .where(eq(schema.orderItems.orderId, order.id));
      
      const itemRows = items.map(item => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
            ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">` : ''}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${item.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">$${(item.total / 100).toFixed(2)}</td>
        </tr>
      `).join('');

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Georgia, serif; background: #faf8f5; padding: 40px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 24px; font-style: italic; color: #1a1a19; }
    .order-number { background: #faf8f5; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #faf8f5; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
    .totals { margin-top: 24px; text-align: right; }
    .total-row { padding: 8px 0; }
    .grand-total { font-size: 20px; font-weight: bold; border-top: 2px solid #1a1a19; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Just Empower</div>
      <h2 style="font-weight: normal; font-style: italic;">Order Confirmation</h2>
    </div>
    
    <p>Thank you for your order, ${order.shippingFirstName || 'Valued Customer'}!</p>
    
    <div class="order-number">
      <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666;">Order Number</p>
      <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: bold;">${order.orderNumber}</p>
    </div>
    
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>
    
    <div class="totals">
      <div class="total-row">Subtotal: $${(order.subtotal / 100).toFixed(2)}</div>
      ${order.discountAmount ? `<div class="total-row">Discount: -$${(order.discountAmount / 100).toFixed(2)}</div>` : ''}
      ${order.shippingAmount ? `<div class="total-row">Shipping: $${(order.shippingAmount / 100).toFixed(2)}</div>` : ''}
      ${order.taxAmount ? `<div class="total-row">Tax: $${(order.taxAmount / 100).toFixed(2)}</div>` : ''}
      <div class="total-row grand-total">Total: $${(order.total / 100).toFixed(2)}</div>
    </div>
    
    <p style="margin-top: 32px; text-align: center; color: #666; font-size: 14px;">
      Questions? Reply to this email or contact us at support@justxempower.com
    </p>
  </div>
</body>
</html>`;

      await sendEmail([order.email], `Order Confirmed - ${order.orderNumber}`, htmlContent);

      return { success: true, email: order.email };
    }),

  sendShippingNotification: adminProcedure
    .input(z.object({
      orderId: z.number(),
      trackingNumber: z.string(),
      trackingUrl: z.string().optional(),
      carrier: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Update order with tracking info
      await db.update(schema.orders)
        .set({
          trackingNumber: input.trackingNumber,
          trackingUrl: input.trackingUrl,
          status: "shipped",
          shippedAt: new Date(),
        })
        .where(eq(schema.orders.id, input.orderId));
      
      const [order] = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, input.orderId))
        .limit(1);
      
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Georgia, serif; background: #faf8f5; padding: 40px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 24px; font-style: italic; color: #1a1a19; }
    .tracking-box { background: #faf8f5; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .tracking-number { font-size: 20px; font-weight: bold; font-family: monospace; margin: 12px 0; }
    .track-button { display: inline-block; background: #1a1a19; color: white; padding: 12px 32px; border-radius: 9999px; text-decoration: none; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Just Empower</div>
      <h2 style="font-weight: normal; font-style: italic;">Your Order Has Shipped! 📦</h2>
    </div>
    
    <p>Great news, ${order.shippingFirstName || 'Valued Customer'}! Your order is on its way.</p>
    
    <div class="tracking-box">
      <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666;">
        ${input.carrier || 'Tracking Number'}
      </p>
      <p class="tracking-number">${input.trackingNumber}</p>
      ${input.trackingUrl ? `<a href="${input.trackingUrl}" class="track-button">Track Your Package</a>` : ''}
    </div>
    
    <p style="color: #666; font-size: 14px;">
      <strong>Shipping To:</strong><br>
      ${order.shippingFirstName} ${order.shippingLastName}<br>
      ${order.shippingAddress1}<br>
      ${order.shippingAddress2 ? `${order.shippingAddress2}<br>` : ''}
      ${order.shippingCity}, ${order.shippingState} ${order.shippingPostalCode}<br>
      ${order.shippingCountry}
    </p>
    
    <p style="margin-top: 32px; text-align: center; color: #666; font-size: 14px;">
      Questions about your shipment? Reply to this email.
    </p>
  </div>
</body>
</html>`;

      await sendEmail([order.email], `Your Order Has Shipped - ${order.orderNumber}`, htmlContent);

      return { success: true, email: order.email };
    }),
});

export default automationRouter;
