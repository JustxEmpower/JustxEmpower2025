import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { chatWithAI, initializeGemini, analyzeSentiment } from "./aiService";
import { getDb } from "./db";
import { aiChatConversations, aiSettings } from "../drizzle/schema";
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
