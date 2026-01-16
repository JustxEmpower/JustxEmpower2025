import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { chatWithAI, initializeGemini, analyzeSentiment } from "./aiService";
import { getDb } from "./db";
import { aiChatConversations, aiSettings, aiFeedback, visitorProfiles } from "../drizzle/schema";
import { desc, eq } from "drizzle-orm";

// Lazy initialization of Gemini - will be initialized on first use
let geminiInitialized = false;

function ensureGeminiInitialized() {
  if (geminiInitialized) return;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    initializeGemini(apiKey);
    console.log("✅ Gemini AI initialized with gemini-2.0-flash");
    geminiInitialized = true;
  }
}

// Admin AI Assistant system prompt - separate from visitor AI
const ADMIN_AI_SYSTEM_PROMPT = `You are Aria, an elite AI Site Manager for Just Empower - a transformational platform for women's empowerment. You are speaking directly to the site administrator to help them manage and grow their platform.

Your expertise includes:
- Content strategy and optimization
- SEO best practices and implementation
- User engagement and conversion optimization
- E-commerce and event management
- Brand consistency and messaging
- Analytics interpretation and insights
- Social media strategy
- Task prioritization and project management

Your communication style:
- Be direct, strategic, and actionable
- Provide specific recommendations with clear next steps
- Use data and metrics when available
- Think like a growth consultant and CMO
- Be encouraging but realistic
- Format responses with clear structure (bullets, headers when helpful)
- Include emojis sparingly for visual organization

You understand the Just Empower brand mission of "catalyzing the rise of her" and align all suggestions with this vision of women's empowerment, leadership, and transformation.

When responding:
1. Address the specific question or task
2. Provide actionable recommendations
3. Suggest related improvements they might not have considered
4. Offer to dive deeper into any area`;

export const aiRouter = router({
  /**
   * Admin AI Assistant - Strategic site management AI
   */
  adminChat: publicProcedure
    .input(
      z.object({
        message: z.string().min(1),
        sessionId: z.string(),
        siteStats: z.object({
          totalPages: z.number().optional(),
          totalArticles: z.number().optional(),
          totalProducts: z.number().optional(),
          totalEvents: z.number().optional(),
          totalOrders: z.number().optional(),
          totalSubscribers: z.number().optional(),
          unreadSubmissions: z.number().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ input }) => {
      ensureGeminiInitialized();
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Build context with site stats
      let statsContext = "";
      if (input.siteStats) {
        const s = input.siteStats;
        statsContext = `\n\nCurrent Site Statistics:
- Total Pages: ${s.totalPages ?? 'Unknown'}
- Total Articles: ${s.totalArticles ?? 'Unknown'}
- Total Products: ${s.totalProducts ?? 'Unknown'}
- Total Events: ${s.totalEvents ?? 'Unknown'}
- Total Orders: ${s.totalOrders ?? 'Unknown'}
- Newsletter Subscribers: ${s.totalSubscribers ?? 'Unknown'}
- Unread Form Submissions: ${s.unreadSubmissions ?? 'Unknown'}`;
      }

      // Get conversation history for this admin session
      const history = await db
        .select()
        .from(aiChatConversations)
        .where(eq(aiChatConversations.sessionId, input.sessionId))
        .orderBy(desc(aiChatConversations.createdAt))
        .limit(10);

      const conversationHistory = history.reverse().map((msg) => ({
        role: msg.role,
        message: msg.message,
      }));

      // Generate AI response with admin context
      const response = await chatWithAI(
        input.message + statsContext,
        conversationHistory,
        ADMIN_AI_SYSTEM_PROMPT
      );

      // Save conversation to database
      await db.insert(aiChatConversations).values({
        sessionId: input.sessionId,
        message: input.message,
        role: "user",
        context: "admin-assistant",
      });

      await db.insert(aiChatConversations).values({
        sessionId: input.sessionId,
        message: response,
        role: "assistant",
        context: "admin-assistant",
      });

      return { message: response };
    }),

  /**
   * Send a message to the AI chat assistant
   */
  chat: publicProcedure
    .input(
      z.object({
        message: z.string().min(1),
        sessionId: z.string(),
        visitorId: z.string().optional(),
        context: z.string().optional(), // page URL, visitor intent, etc.
      })
    )
    .mutation(async ({ input }) => {
      ensureGeminiInitialized();
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get conversation history for this session (last 10 messages)
      const history = await db
        .select()
        .from(aiChatConversations)
        .where(eq(aiChatConversations.sessionId, input.sessionId))
        .orderBy(desc(aiChatConversations.createdAt))
        .limit(10);

      // Reverse to get chronological order
      const conversationHistory = history.reverse().map((msg) => ({
        role: msg.role,
        message: msg.message,
      }));

      // Get AI settings (custom system prompt if configured)
      const settings = await db.select().from(aiSettings).limit(1);
      const systemPrompt = settings[0]?.systemPrompt || undefined;

      // Generate AI response
      const response = await chatWithAI(input.message, conversationHistory, systemPrompt);

      // Analyze sentiment of user message
      const sentiment = await analyzeSentiment(input.message);

      // Save user message to database
      await db.insert(aiChatConversations).values({
        sessionId: input.sessionId,
        visitorId: input.visitorId,
        message: input.message,
        role: "user",
        context: input.context,
        sentiment,
      });

      // Save AI response to database
      await db.insert(aiChatConversations).values({
        sessionId: input.sessionId,
        visitorId: input.visitorId,
        message: response,
        role: "assistant",
        context: input.context,
      });

      return {
        message: response,
        sentiment,
      };
    }),

  /**
   * Get conversation history for a session
   */
  getHistory: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const history = await db
        .select()
        .from(aiChatConversations)
        .where(eq(aiChatConversations.sessionId, input.sessionId))
        .orderBy(desc(aiChatConversations.createdAt))
        .limit(input.limit);

      return history.reverse();
    }),

  /**
   * Submit feedback for an AI response
   */
  submitFeedback: publicProcedure
    .input(
      z.object({
        conversationId: z.number(),
        visitorId: z.string().optional(),
        rating: z.enum(["positive", "negative"]),
        feedbackText: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(aiFeedback).values({
        conversationId: input.conversationId,
        visitorId: input.visitorId,
        rating: input.rating,
        feedbackText: input.feedbackText,
      });

      return { success: true };
    }),

  /**
   * Track or update visitor profile
   */
  trackVisitor: publicProcedure
    .input(
      z.object({
        visitorId: z.string(),
        preferences: z.string().optional(),
        context: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if visitor exists
      const existing = await db
        .select()
        .from(visitorProfiles)
        .where(eq(visitorProfiles.visitorId, input.visitorId))
        .limit(1);

      if (existing.length > 0) {
        // Update existing profile
        await db
          .update(visitorProfiles)
          .set({
            lastVisit: new Date(),
            totalConversations: existing[0].totalConversations + 1,
            preferences: input.preferences || existing[0].preferences,
            context: input.context || existing[0].context,
          })
          .where(eq(visitorProfiles.visitorId, input.visitorId));
      } else {
        // Create new profile
        await db.insert(visitorProfiles).values({
          visitorId: input.visitorId,
          totalConversations: 1,
          preferences: input.preferences,
          context: input.context,
        });
      }

      return { success: true };
    }),

  /**
   * Get visitor profile for personalized responses
   */
  getVisitorProfile: publicProcedure
    .input(z.object({ visitorId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const profile = await db
        .select()
        .from(visitorProfiles)
        .where(eq(visitorProfiles.visitorId, input.visitorId))
        .limit(1);

      return profile.length > 0 ? profile[0] : null;
    }),

  /**
   * Get AI chat settings (for frontend configuration)
   */
  getSettings: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const settings = await db.select().from(aiSettings).limit(1);
    if (settings.length === 0) return null;

    // Don't expose API key to frontend
    return {
      chatEnabled: settings[0].chatEnabled,
      chatBubbleColor: settings[0].chatBubbleColor,
      chatBubblePosition: settings[0].chatBubblePosition,
    };
  }),
});
