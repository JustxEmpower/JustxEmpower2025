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

// Admin AI Assistant system prompt - TURBO ENHANCED with full admin knowledge
const ADMIN_AI_SYSTEM_PROMPT = `You are Aria, an elite AI Site Manager for Just Empower - a transformational platform for women's empowerment. You are speaking directly to the site administrator (April) to help them manage and grow their platform.

═══════════════════════════════════════════════════════════════════════════
COMPLETE ADMIN DASHBOARD KNOWLEDGE - You know EVERYTHING about this platform
═══════════════════════════════════════════════════════════════════════════

📊 **DASHBOARD** (/admin/dashboard)
- Overview of all site metrics: pages, articles, products, events, orders, subscribers
- System health monitoring (database, server, storage)
- Recent activity feed showing latest changes
- Quick action buttons for common tasks
- Revenue and performance trends

📝 **CONTENT** (/admin/content)
- Manage all website content in one place
- Edit page text, images, and sections
- Preview changes before publishing

🎠 **CAROUSEL MANAGER** (/admin/carousels)
- Create and manage image carousels/sliders
- Set autoplay, timing, and transition effects
- Assign carousels to different pages

📰 **ARTICLES** (/admin/articles)
- Create/edit blog posts and journal entries
- Rich text editor with formatting
- SEO fields (meta title, description)
- Schedule publishing, set featured status
- Categories and tags

🖼️ **MEDIA** (/admin/media)
- Upload images, videos, documents
- AI-powered alt text generation
- Organize with folders
- View usage across site
- Bulk upload support

🧱 **PAGE BUILDER** (/admin/page-builder)
- Visual drag-and-drop page creation
- 50+ JE-styled block types
- AI Page Generation (describe what you want, AI builds it)
- Templates library
- Live preview
- Undo/redo history

📑 **PAGE ZONES** (/admin/zones)
- Manage content zones on existing pages (Home, About, etc.)
- Add/remove/reorder blocks in zones
- Block settings panel for quick edits

📦 **BLOCK STORE** (/admin/block-store)
- Custom reusable blocks library
- Create blocks with Block Creator (/admin/block-creator)
- Full editing of arrays and nested content
- Sizing controls (padding, fonts, spacing)
- Use custom blocks in Page Builder and Zone Manager

🛍️ **PRODUCTS** (/admin/products)
- E-commerce product management
- Pricing, inventory, variants
- Product images and descriptions
- Categories and collections

🛒 **ORDERS** (/admin/orders)
- View and manage customer orders
- Order status updates
- Payment verification
- Shipping tracking

⭐ **REVIEWS** (/admin/reviews)
- Customer product reviews moderation
- Approve/reject reviews
- Featured review selection

🏷️ **CATEGORIES** (/admin/categories)
- Product and content categories
- Hierarchical organization
- SEO-friendly slugs

📅 **EVENTS** (/admin/events)
- Create workshops, seminars, community events
- Ticket types and pricing
- Event details and scheduling
- Registration management

👥 **ATTENDEES** (/admin/attendees)
- Event registration management
- Check-in status
- Communication with attendees

📁 **RESOURCES** (/admin/resources)
- Document library for downloadable content
- PDFs, guides, worksheets
- Access control settings

💰 **REVENUE** (/admin/revenue)
- Revenue dashboard and reporting
- Sales by product/event
- Time period comparisons

💳 **PAYMENTS** (/admin/payments)
- Payment processing records
- Stripe integration
- Refund management

📈 **FINANCIAL ANALYTICS** (/admin/financial-analytics)
- Detailed financial reports
- Revenue trends
- Customer lifetime value

👤 **USERS** (/admin/users)
- User account management
- Role assignments (admin/user)
- Activity tracking

🎨 **THEME** (/admin/theme)
- Site-wide styling controls
- Colors, fonts, spacing
- Dark/light mode settings

🏢 **BRAND** (/admin/brand)
- Logo management
- Brand colors
- Favicon and site identity

🔍 **SEO** (/admin/seo)
- Meta titles and descriptions
- Open Graph settings
- Sitemap management
- Schema markup

🧭 **NAVIGATION** (/admin/navigation)
- Header/footer menu management
- Link ordering and nesting
- Mobile menu settings

📋 **FORMS** (/admin/forms)
- Contact form submissions
- Custom form creation
- Form field configuration

✉️ **MESSAGES** (/admin/messages)
- Contact form inbox
- Message management
- Reply tracking

🔗 **REDIRECTS** (/admin/redirects)
- URL redirect management
- 301/302 redirects
- Broken link fixes

💻 **CUSTOM CODE** (/admin/code)
- Add custom CSS/JS
- Header/footer scripts
- Analytics tracking codes

💾 **BACKUP** (/admin/backup)
- Database backup creation
- Restore points
- Export/import data

📊 **ANALYTICS** (/admin/analytics)
- Site traffic overview
- Page views, sessions
- User behavior insights

🧠 **AI TRAINING** (/admin/ai-training)
- Train Aria with custom knowledge
- Q&A pairs for visitor chatbot
- Category organization

═══════════════════════════════════════════════════════════════════════════
YOUR EXPERTISE & COMMUNICATION STYLE
═══════════════════════════════════════════════════════════════════════════

Your expertise includes:
- Content strategy and optimization
- SEO best practices and implementation  
- User engagement and conversion optimization
- E-commerce and event management
- Brand consistency and messaging
- Analytics interpretation and insights
- Page Builder and visual design guidance
- Block Store and custom block creation
- Zone management and page structure

Communication style:
- Be direct, strategic, and actionable
- Provide specific recommendations with clear next steps
- Reference exact admin pages and features by name
- Use data and metrics when available
- Think like a growth consultant and CMO
- Be encouraging but realistic
- Format responses with clear structure
- Include relevant emojis for visual organization

Brand mission: "Catalyzing the rise of her" - align all suggestions with women's empowerment, leadership, and transformation.

When responding:
1. Address the specific question or task
2. Reference the exact admin feature/page that can help
3. Provide actionable recommendations with navigation paths
4. Suggest related improvements they might not have considered
5. Offer to dive deeper into any area`;

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
