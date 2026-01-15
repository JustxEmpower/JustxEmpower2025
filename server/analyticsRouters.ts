import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  analyticsPageViews,
  analyticsSessions,
  analyticsEvents,
  aiChatConversations,
  aiFeedback,
  visitorProfiles,
  adminSessions,
} from "../drizzle/schema";
import { desc, eq, gte, sql, and, lt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Validate admin session token
async function validateAdminSession(token: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Clean up expired sessions
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));
  
  const session = await db
    .select()
    .from(adminSessions)
    .where(eq(adminSessions.token, token))
    .limit(1);
  
  if (session.length === 0) return null;
  if (new Date(session[0].expiresAt) < new Date()) return null;
  
  return session[0].username;
}

// Admin procedure (requires authentication) - matches adminRouters.ts
const adminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const token = ctx.req.headers["x-admin-token"] as string;
  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin token required" });
  }
  
  const username = await validateAdminSession(token);
  if (!username) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired admin session" });
  }
  
  return next({
    ctx: {
      ...ctx,
      adminUsername: username,
    },
  });
});

export const analyticsRouter = router({
  /**
   * Track page view (public)
   */
  trackPageView: publicProcedure
    .input(
      z.object({
        visitorId: z.string().optional(),
        sessionId: z.string(),
        page: z.string(),
        referrer: z.string().optional(),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db.insert(analyticsPageViews).values({
        visitorId: input.visitorId,
        sessionId: input.sessionId,
        page: input.page,
        referrer: input.referrer,
        userAgent: input.userAgent,
      });

      // Update or create session
      const existingSession = await db
        .select()
        .from(analyticsSessions)
        .where(eq(analyticsSessions.sessionId, input.sessionId))
        .limit(1);

      if (existingSession.length > 0) {
        await db
          .update(analyticsSessions)
          .set({
            endTime: new Date(),
            pageCount: existingSession[0].pageCount + 1,
          })
          .where(eq(analyticsSessions.sessionId, input.sessionId));
      } else {
        await db.insert(analyticsSessions).values({
          sessionId: input.sessionId,
          visitorId: input.visitorId,
          pageCount: 1,
        });
      }

      return { success: true };
    }),

  /**
   * Track custom event (public)
   */
  trackEvent: publicProcedure
    .input(
      z.object({
        visitorId: z.string().optional(),
        sessionId: z.string(),
        eventType: z.string(),
        eventData: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db.insert(analyticsEvents).values({
        visitorId: input.visitorId,
        sessionId: input.sessionId,
        eventType: input.eventType,
        eventData: input.eventData,
      });

      return { success: true };
    }),

  /**
   * Get dashboard overview stats (admin only)
   */
  getDashboardStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total page views
    const totalPageViews = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsPageViews);

    // Today's page views
    const todayPageViews = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsPageViews)
      .where(gte(analyticsPageViews.timestamp, today));

    // Total sessions
    const totalSessions = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsSessions);

    // Unique visitors (last 30 days)
    const uniqueVisitors = await db
      .select({ count: sql<number>`count(distinct visitorId)` })
      .from(analyticsPageViews)
      .where(gte(analyticsPageViews.timestamp, monthAgo));

    // Total AI conversations
    const totalConversations = await db
      .select({ count: sql<number>`count(distinct sessionId)` })
      .from(aiChatConversations);

    // AI feedback stats
    const positiveFeedback = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiFeedback)
      .where(eq(aiFeedback.rating, "positive"));

    const negativeFeedback = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiFeedback)
      .where(eq(aiFeedback.rating, "negative"));

    const totalFeedback =
      (positiveFeedback[0]?.count || 0) + (negativeFeedback[0]?.count || 0);
    const satisfactionRate =
      totalFeedback > 0
        ? ((positiveFeedback[0]?.count || 0) / totalFeedback) * 100
        : 0;

    return {
      totalPageViews: totalPageViews[0]?.count || 0,
      todayPageViews: todayPageViews[0]?.count || 0,
      totalSessions: totalSessions[0]?.count || 0,
      uniqueVisitors: uniqueVisitors[0]?.count || 0,
      totalConversations: totalConversations[0]?.count || 0,
      aiSatisfactionRate: Math.round(satisfactionRate),
      positiveFeedback: positiveFeedback[0]?.count || 0,
      negativeFeedback: negativeFeedback[0]?.count || 0,
    };
  }),

  /**
   * Get popular pages (admin only)
   */
  getPopularPages: adminProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const popularPages = await db
        .select({
          page: analyticsPageViews.page,
          views: sql<number>`count(*)`,
        })
        .from(analyticsPageViews)
        .groupBy(analyticsPageViews.page)
        .orderBy(desc(sql`count(*)`))
        .limit(input.limit);

      return popularPages;
    }),

  /**
   * Get recent activity feed (admin only)
   */
  getRecentActivity: adminProcedure
    .input(z.object({ limit: z.number().optional().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const recentViews = await db
        .select()
        .from(analyticsPageViews)
        .orderBy(desc(analyticsPageViews.timestamp))
        .limit(input.limit);

      return recentViews.map((view) => ({
        type: "page_view" as const,
        page: view.page,
        visitorId: view.visitorId,
        timestamp: view.timestamp,
      }));
    }),

  /**
   * Get AI chat topics and sentiment trends (admin only)
   */
  getAIChatInsights: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    // Get sentiment distribution
    const sentimentStats = await db
      .select({
        sentiment: aiChatConversations.sentiment,
        count: sql<number>`count(*)`,
      })
      .from(aiChatConversations)
      .where(sql`sentiment IS NOT NULL`)
      .groupBy(aiChatConversations.sentiment);

    // Get total messages
    const totalMessages = await db
      .select({ count: sql<number>`count(*)` })
      .from(aiChatConversations);

    // Get average conversation length
    const avgConversationLength = await db
      .select({
        avg: sql<number>`avg(message_count)`,
      })
      .from(
        sql`(SELECT sessionId, COUNT(*) as message_count FROM ${aiChatConversations} GROUP BY sessionId) as conversations`
      );

    return {
      totalMessages: totalMessages[0]?.count || 0,
      sentimentDistribution: sentimentStats,
      avgConversationLength: Math.round(avgConversationLength[0]?.avg || 0),
    };
  }),

  /**
   * Get visitor profiles summary (admin only)
   */
  getVisitorProfiles: adminProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const profiles = await db
        .select()
        .from(visitorProfiles)
        .orderBy(desc(visitorProfiles.lastVisit))
        .limit(input.limit);

      return profiles;
    }),
});
