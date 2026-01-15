/**
 * Site Manager Router - Unified control center for all site capabilities
 * 
 * This router provides comprehensive site management including:
 * - Global search across all content types
 * - Site-wide publishing controls
 * - Quick statistics overview
 * - Content relationships and links
 * - Site health monitoring
 * - Bulk operations
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, like, or, desc, sql, and, gte, lte, isNull } from "drizzle-orm";

// Admin authentication middleware
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

export const siteManagerRouter = router({
  // ═══════════════════════════════════════════════════════════════════════════
  // GLOBAL SEARCH - Search across all content types
  // ═══════════════════════════════════════════════════════════════════════════
  globalSearch: adminProcedure
    .input(z.object({
      query: z.string().min(1),
      types: z.array(z.enum(["pages", "articles", "products", "events", "media", "resources"])).optional(),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const searchTerm = `%${input.query}%`;
      const types = input.types || ["pages", "articles", "products", "events", "media", "resources"];
      const results: Array<{
        type: string;
        id: number;
        title: string;
        slug?: string;
        status?: string;
        imageUrl?: string | null;
        updatedAt?: Date;
      }> = [];
      
      // Search pages
      if (types.includes("pages")) {
        const pages = await db
          .select({
            id: schema.pages.id,
            title: schema.pages.title,
            slug: schema.pages.slug,
            published: schema.pages.published,
            updatedAt: schema.pages.updatedAt,
          })
          .from(schema.pages)
          .where(and(
            or(
              like(schema.pages.title, searchTerm),
              like(schema.pages.slug, searchTerm)
            ),
            isNull(schema.pages.deletedAt)
          ))
          .limit(input.limit);
        
        results.push(...pages.map(p => ({
          type: "page" as const,
          id: p.id,
          title: p.title,
          slug: p.slug,
          status: p.published ? "published" : "draft",
          updatedAt: p.updatedAt,
        })));
      }
      
      // Search articles
      if (types.includes("articles")) {
        const articles = await db
          .select({
            id: schema.articles.id,
            title: schema.articles.title,
            slug: schema.articles.slug,
            status: schema.articles.status,
            imageUrl: schema.articles.imageUrl,
            updatedAt: schema.articles.updatedAt,
          })
          .from(schema.articles)
          .where(or(
            like(schema.articles.title, searchTerm),
            like(schema.articles.slug, searchTerm),
            like(schema.articles.content, searchTerm)
          ))
          .limit(input.limit);
        
        results.push(...articles.map(a => ({
          type: "article" as const,
          id: a.id,
          title: a.title,
          slug: a.slug,
          status: a.status,
          imageUrl: a.imageUrl,
          updatedAt: a.updatedAt,
        })));
      }
      
      // Search products
      if (types.includes("products")) {
        const products = await db
          .select({
            id: schema.products.id,
            name: schema.products.name,
            slug: schema.products.slug,
            status: schema.products.status,
            featuredImage: schema.products.featuredImage,
            updatedAt: schema.products.updatedAt,
          })
          .from(schema.products)
          .where(and(
            or(
              like(schema.products.name, searchTerm),
              like(schema.products.slug, searchTerm),
              like(schema.products.description, searchTerm)
            ),
            isNull(schema.products.deletedAt)
          ))
          .limit(input.limit);
        
        results.push(...products.map(p => ({
          type: "product" as const,
          id: p.id,
          title: p.name,
          slug: p.slug,
          status: p.status,
          imageUrl: p.featuredImage,
          updatedAt: p.updatedAt,
        })));
      }
      
      // Search events
      if (types.includes("events")) {
        const events = await db
          .select({
            id: schema.events.id,
            title: schema.events.title,
            slug: schema.events.slug,
            status: schema.events.status,
            featuredImage: schema.events.featuredImage,
            updatedAt: schema.events.updatedAt,
          })
          .from(schema.events)
          .where(or(
            like(schema.events.title, searchTerm),
            like(schema.events.slug, searchTerm),
            like(schema.events.description, searchTerm)
          ))
          .limit(input.limit);
        
        results.push(...events.map(e => ({
          type: "event" as const,
          id: e.id,
          title: e.title,
          slug: e.slug,
          status: e.status,
          imageUrl: e.featuredImage,
          updatedAt: e.updatedAt,
        })));
      }
      
      // Search media
      if (types.includes("media")) {
        const media = await db
          .select({
            id: schema.media.id,
            originalName: schema.media.originalName,
            url: schema.media.url,
            type: schema.media.type,
            createdAt: schema.media.createdAt,
          })
          .from(schema.media)
          .where(like(schema.media.originalName, searchTerm))
          .limit(input.limit);
        
        results.push(...media.map(m => ({
          type: "media" as const,
          id: m.id,
          title: m.originalName,
          imageUrl: m.type === "image" ? m.url : null,
          updatedAt: m.createdAt,
        })));
      }
      
      // Search resources
      if (types.includes("resources")) {
        const resources = await db
          .select({
            id: schema.resources.id,
            title: schema.resources.title,
            slug: schema.resources.slug,
            status: schema.resources.status,
            thumbnailUrl: schema.resources.thumbnailUrl,
            updatedAt: schema.resources.updatedAt,
          })
          .from(schema.resources)
          .where(or(
            like(schema.resources.title, searchTerm),
            like(schema.resources.slug, searchTerm),
            like(schema.resources.description, searchTerm)
          ))
          .limit(input.limit);
        
        results.push(...resources.map(r => ({
          type: "resource" as const,
          id: r.id,
          title: r.title,
          slug: r.slug,
          status: r.status,
          imageUrl: r.thumbnailUrl,
          updatedAt: r.updatedAt,
        })));
      }
      
      // Sort by most recently updated
      results.sort((a, b) => {
        if (!a.updatedAt || !b.updatedAt) return 0;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      
      return results.slice(0, input.limit);
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // SITE OVERVIEW - Complete site statistics at a glance
  // ═══════════════════════════════════════════════════════════════════════════
  siteOverview: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Parallel fetch all stats
    const [
      pagesCount,
      articlesCount,
      productsCount,
      eventsCount,
      ordersCount,
      revenueTotal,
      recentRevenue,
      subscribersCount,
      newSubscribers,
      submissionsCount,
      unreadSubmissions,
      mediaCount,
      resourcesCount,
      upcomingEvents,
      lowStockProducts,
      pendingOrders,
    ] = await Promise.all([
      // Content counts
      db.select({ count: sql<number>`count(*)` }).from(schema.pages).where(isNull(schema.pages.deletedAt)),
      db.select({ count: sql<number>`count(*)` }).from(schema.articles),
      db.select({ count: sql<number>`count(*)` }).from(schema.products).where(isNull(schema.products.deletedAt)),
      db.select({ count: sql<number>`count(*)` }).from(schema.events),
      
      // Orders & revenue
      db.select({ count: sql<number>`count(*)` }).from(schema.orders),
      db.select({ total: sql<number>`COALESCE(SUM(total), 0)` }).from(schema.orders).where(eq(schema.orders.paymentStatus, "paid")),
      db.select({ total: sql<number>`COALESCE(SUM(total), 0)` }).from(schema.orders).where(and(
        eq(schema.orders.paymentStatus, "paid"),
        gte(schema.orders.createdAt, thirtyDaysAgo)
      )),
      
      // Subscribers
      db.select({ count: sql<number>`count(*)` }).from(schema.newsletterSubscribers).where(eq(schema.newsletterSubscribers.status, "subscribed")),
      db.select({ count: sql<number>`count(*)` }).from(schema.newsletterSubscribers).where(and(
        eq(schema.newsletterSubscribers.status, "subscribed"),
        gte(schema.newsletterSubscribers.createdAt, sevenDaysAgo)
      )),
      
      // Submissions
      db.select({ count: sql<number>`count(*)` }).from(schema.formSubmissions),
      db.select({ count: sql<number>`count(*)` }).from(schema.formSubmissions).where(eq(schema.formSubmissions.isRead, 0)),
      
      // Media & resources
      db.select({ count: sql<number>`count(*)` }).from(schema.media),
      db.select({ count: sql<number>`count(*)` }).from(schema.resources),
      
      // Upcoming events (next 30 days)
      db.select({ count: sql<number>`count(*)` }).from(schema.events).where(and(
        eq(schema.events.status, "published"),
        gte(schema.events.startDate, now),
        lte(schema.events.startDate, thirtyDaysAgo)
      )),
      
      // Low stock products
      db.select({ count: sql<number>`count(*)` }).from(schema.products).where(and(
        eq(schema.products.trackInventory, 1),
        sql`${schema.products.stock} <= ${schema.products.lowStockThreshold}`,
        isNull(schema.products.deletedAt)
      )),
      
      // Pending orders
      db.select({ count: sql<number>`count(*)` }).from(schema.orders).where(eq(schema.orders.status, "pending")),
    ]);
    
    return {
      content: {
        pages: pagesCount[0]?.count || 0,
        articles: articlesCount[0]?.count || 0,
        products: productsCount[0]?.count || 0,
        events: eventsCount[0]?.count || 0,
        media: mediaCount[0]?.count || 0,
        resources: resourcesCount[0]?.count || 0,
      },
      commerce: {
        totalOrders: ordersCount[0]?.count || 0,
        pendingOrders: pendingOrders[0]?.count || 0,
        totalRevenue: revenueTotal[0]?.total || 0,
        recentRevenue: recentRevenue[0]?.total || 0,
        lowStockProducts: lowStockProducts[0]?.count || 0,
      },
      engagement: {
        subscribers: subscribersCount[0]?.count || 0,
        newSubscribers: newSubscribers[0]?.count || 0,
        submissions: submissionsCount[0]?.count || 0,
        unreadSubmissions: unreadSubmissions[0]?.count || 0,
        upcomingEvents: upcomingEvents[0]?.count || 0,
      },
      alerts: {
        hasUnreadSubmissions: (unreadSubmissions[0]?.count || 0) > 0,
        hasLowStock: (lowStockProducts[0]?.count || 0) > 0,
        hasPendingOrders: (pendingOrders[0]?.count || 0) > 0,
      },
    };
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // RECENT ACTIVITY - Timeline of all recent changes
  // ═══════════════════════════════════════════════════════════════════════════
  recentActivity: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const limit = input?.limit || 20;
      const activities: Array<{
        type: string;
        action: string;
        title: string;
        id: number;
        timestamp: Date;
        meta?: Record<string, unknown>;
      }> = [];
      
      // Recent pages
      const recentPages = await db
        .select()
        .from(schema.pages)
        .where(isNull(schema.pages.deletedAt))
        .orderBy(desc(schema.pages.updatedAt))
        .limit(5);
      
      activities.push(...recentPages.map(p => ({
        type: "page",
        action: "updated",
        title: p.title,
        id: p.id,
        timestamp: p.updatedAt,
      })));
      
      // Recent articles
      const recentArticles = await db
        .select()
        .from(schema.articles)
        .orderBy(desc(schema.articles.updatedAt))
        .limit(5);
      
      activities.push(...recentArticles.map(a => ({
        type: "article",
        action: "updated",
        title: a.title,
        id: a.id,
        timestamp: a.updatedAt,
      })));
      
      // Recent orders
      const recentOrders = await db
        .select()
        .from(schema.orders)
        .orderBy(desc(schema.orders.createdAt))
        .limit(5);
      
      activities.push(...recentOrders.map(o => ({
        type: "order",
        action: o.status === "pending" ? "created" : o.status,
        title: `Order ${o.orderNumber}`,
        id: o.id,
        timestamp: o.createdAt,
        meta: { total: o.total, status: o.status },
      })));
      
      // Recent submissions
      const recentSubmissions = await db
        .select()
        .from(schema.formSubmissions)
        .orderBy(desc(schema.formSubmissions.submittedAt))
        .limit(5);
      
      activities.push(...recentSubmissions.map(s => ({
        type: "submission",
        action: s.isRead ? "read" : "new",
        title: "Contact Form Submission",
        id: s.id,
        timestamp: s.submittedAt,
      })));
      
      // Recent subscribers
      const recentSubscribers = await db
        .select()
        .from(schema.newsletterSubscribers)
        .orderBy(desc(schema.newsletterSubscribers.createdAt))
        .limit(5);
      
      activities.push(...recentSubscribers.map(s => ({
        type: "subscriber",
        action: "subscribed",
        title: s.email,
        id: s.id,
        timestamp: s.createdAt,
      })));
      
      // Sort by timestamp and limit
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return activities.slice(0, limit);
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // BULK OPERATIONS - Perform actions on multiple items
  // ═══════════════════════════════════════════════════════════════════════════
  bulkPublish: adminProcedure
    .input(z.object({
      type: z.enum(["pages", "articles", "products", "events"]),
      ids: z.array(z.number()),
      publish: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      let updated = 0;
      
      for (const id of input.ids) {
        switch (input.type) {
          case "pages":
            await db.update(schema.pages)
              .set({ published: input.publish ? 1 : 0 })
              .where(eq(schema.pages.id, id));
            updated++;
            break;
          case "articles":
            await db.update(schema.articles)
              .set({ 
                published: input.publish ? 1 : 0,
                status: input.publish ? "published" : "draft"
              })
              .where(eq(schema.articles.id, id));
            updated++;
            break;
          case "products":
            await db.update(schema.products)
              .set({ status: input.publish ? "active" : "draft" })
              .where(eq(schema.products.id, id));
            updated++;
            break;
          case "events":
            await db.update(schema.events)
              .set({ status: input.publish ? "published" : "draft" })
              .where(eq(schema.events.id, id));
            updated++;
            break;
        }
      }
      
      return { success: true, updated };
    }),

  bulkDelete: adminProcedure
    .input(z.object({
      type: z.enum(["pages", "articles", "products", "events", "media"]),
      ids: z.array(z.number()),
      permanent: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      let deleted = 0;
      
      for (const id of input.ids) {
        switch (input.type) {
          case "pages":
            if (input.permanent) {
              await db.delete(schema.pages).where(eq(schema.pages.id, id));
            } else {
              await db.update(schema.pages)
                .set({ deletedAt: new Date(), deletedBy: ctx.adminUsername })
                .where(eq(schema.pages.id, id));
            }
            deleted++;
            break;
          case "articles":
            await db.delete(schema.articles).where(eq(schema.articles.id, id));
            deleted++;
            break;
          case "products":
            if (input.permanent) {
              await db.delete(schema.products).where(eq(schema.products.id, id));
            } else {
              await db.update(schema.products)
                .set({ deletedAt: new Date() })
                .where(eq(schema.products.id, id));
            }
            deleted++;
            break;
          case "events":
            await db.delete(schema.events).where(eq(schema.events.id, id));
            deleted++;
            break;
          case "media":
            await db.delete(schema.media).where(eq(schema.media.id, id));
            deleted++;
            break;
        }
      }
      
      return { success: true, deleted };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // SITE SETTINGS - All configurable site options
  // ═══════════════════════════════════════════════════════════════════════════
  getAllSettings: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const [settings, theme, brand, fonts, email, ai] = await Promise.all([
      db.select().from(schema.siteSettings),
      db.select().from(schema.themeSettings).limit(1),
      db.select().from(schema.brandAssets),
      db.select().from(schema.fontSettings).limit(1),
      db.select().from(schema.emailSettings).limit(1),
      db.select().from(schema.aiSettings).limit(1),
    ]);
    
    // Convert settings array to object
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => {
      settingsMap[s.settingKey] = s.settingValue || "";
    });
    
    return {
      general: settingsMap,
      theme: theme[0] || null,
      brand: brand,
      fonts: fonts[0] || null,
      email: email[0] || null,
      ai: ai[0] || null,
    };
  }),

  updateSetting: adminProcedure
    .input(z.object({
      key: z.string(),
      value: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Check if setting exists
      const [existing] = await db
        .select()
        .from(schema.siteSettings)
        .where(eq(schema.siteSettings.settingKey, input.key))
        .limit(1);
      
      if (existing) {
        await db.update(schema.siteSettings)
          .set({ settingValue: input.value })
          .where(eq(schema.siteSettings.settingKey, input.key));
      } else {
        await db.insert(schema.siteSettings).values({
          settingKey: input.key,
          settingValue: input.value,
        });
      }
      
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENT RELATIONSHIPS - Links between content types
  // ═══════════════════════════════════════════════════════════════════════════
  getContentLinks: adminProcedure
    .input(z.object({
      type: z.enum(["page", "article", "product", "event"]),
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const links: Array<{
        type: string;
        id: number;
        title: string;
        relationship: string;
      }> = [];
      
      // For pages, find blocks that reference other content
      if (input.type === "page") {
        const blocks = await db
          .select()
          .from(schema.pageBlocks)
          .where(eq(schema.pageBlocks.pageId, input.id));
        
        for (const block of blocks) {
          if (block.content) {
            try {
              const content = JSON.parse(block.content);
              // Check for product references
              if (content.productId) {
                const [product] = await db
                  .select()
                  .from(schema.products)
                  .where(eq(schema.products.id, content.productId))
                  .limit(1);
                if (product) {
                  links.push({
                    type: "product",
                    id: product.id,
                    title: product.name,
                    relationship: "featured_in_block",
                  });
                }
              }
              // Check for event references
              if (content.eventId) {
                const [event] = await db
                  .select()
                  .from(schema.events)
                  .where(eq(schema.events.id, content.eventId))
                  .limit(1);
                if (event) {
                  links.push({
                    type: "event",
                    id: event.id,
                    title: event.title,
                    relationship: "featured_in_block",
                  });
                }
              }
            } catch {}
          }
        }
      }
      
      return links;
    }),
});

export default siteManagerRouter;
