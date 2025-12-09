import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { chatWithAI, initializeGemini, analyzeSentiment } from "./aiService";
import { getDb } from "./db";
import { aiChatConversations, aiSettings, aiFeedback, visitorProfiles } from "../drizzle/schema";
import { desc, eq } from "drizzle-orm";

// Initialize Gemini on server start
const apiKey = process.env.GEMINI_API_KEY;
if (apiKey) {
  initializeGemini(apiKey);
  console.log("✅ Gemini AI initialized");
} else {
  console.warn("⚠️  GEMINI_API_KEY not found - AI features will be disabled");
}

export const aiRouter = router({
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
