import { z } from "zod";
import { generateArticleContent, generateMetaDescription, generateImageAltText, generateContentSuggestions, generateBulkAltText, generatePageSeo, generatePageBlocks, codeAssistant, initializeGemini, generateImageVariation, generateVideoLoop, ensureGeminiFromDatabase } from "./aiService";

// Ensure Gemini is initialized before AI calls - checks database first, then env var
async function ensureGeminiInitialized() {
  // First try to load from database
  const dbLoaded = await ensureGeminiFromDatabase();
  if (dbLoaded) return;
  
  // Fallback to environment variable
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    initializeGemini(apiKey);
  }
}
import { generateVideoThumbnail } from "./mediaConversionService";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as fs from "fs";
import * as path from "path";
import {
  getAdminByUsername,
  verifyPassword,
  updateAdminPassword,
  updateAdminUsername,
  getAllArticles,
  getPublishedArticles,
  getArticleBySlug,
  addPageToSeoSettings,
  createArticle,
  updateArticle,
  deleteArticle,
  getSiteContentByPage,
  getAllSiteContent,
  updateSiteContent,
  upsertSiteContent,
  createMedia,
  getAllMedia,
  getMediaById,
  deleteMedia,
  getThemeSettings,
  updateThemeSettings,
  getAllPages,
  getPageBySlug,
  createPage,
  updatePage,
  deletePage,
  softDeletePage,
  restorePage,
  permanentlyDeletePage,
  getTrashedPages,
  emptyTrash,
  cleanupExpiredTrash,
  reorderPages,
  getPageBlocks,
  createPageBlock,
  updatePageBlock,
  deletePageBlock,
  reorderPageBlocks,
  syncPageBlocksToSiteContent,
} from "./adminDb";
import { storagePut, getPresignedUploadUrl } from "./storage";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, and, sql, desc, lt, gte, isNotNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateColorPalette, suggestFontPairings } from "./aiService";

// Code Health Monitor - In-memory error log store
interface CodeError {
  id: string;
  type: 'js_error' | 'api_error' | 'build_error' | 'runtime_error';
  message: string;
  stack?: string;
  url?: string;
  timestamp: Date;
  resolved: boolean;
  userAgent?: string;
}

const codeErrorStore: CodeError[] = [];
const MAX_ERROR_STORE = 100;

function logCodeError(error: Omit<CodeError, 'id' | 'timestamp' | 'resolved'>): CodeError {
  const newError: CodeError = {
    ...error,
    id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    resolved: false,
  };
  codeErrorStore.unshift(newError);
  if (codeErrorStore.length > MAX_ERROR_STORE) {
    codeErrorStore.pop();
  }
  return newError;
}

// Admin session management (database-backed for persistence)
function generateSessionToken(): string {
  return nanoid(64); // Secure random token
}

async function createAdminSession(username: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  await db.insert(schema.adminSessions).values({
    token,
    username,
    expiresAt,
  });
  
  return token;
}

async function validateAdminSession(token: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  
  const [session] = await db
    .select()
    .from(schema.adminSessions)
    .where(eq(schema.adminSessions.token, token))
    .limit(1);
  
  if (!session) return null;
  
  // Check if expired
  if (session.expiresAt < new Date()) {
    // Clean up expired session
    await db.delete(schema.adminSessions).where(eq(schema.adminSessions.token, token));
    return null;
  }
  
  return session.username;
}

async function deleteAdminSession(token: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(schema.adminSessions).where(eq(schema.adminSessions.token, token));
}

// Clean up expired sessions periodically
async function cleanupExpiredSessions(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(schema.adminSessions).where(lt(schema.adminSessions.expiresAt, new Date()));
}

// Admin authentication middleware
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

export const adminRouter = router({
  // Dashboard Statistics - Enhanced
  dashboard: router({
    stats: adminProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Gather all stats in parallel for performance
        const [
          pages, articles, media, submissions, users,
          products, events, orders, newsletters, resources
        ] = await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(schema.pages).catch(() => [{ count: 0 }]),
          db.select({ count: sql<number>`count(*)` }).from(schema.articles).catch(() => [{ count: 0 }]),
          db.select({ count: sql<number>`count(*)` }).from(schema.media).catch(() => [{ count: 0 }]),
          db.select({ count: sql<number>`count(*)` }).from(schema.formSubmissions).catch(() => [{ count: 0 }]),
          db.select({ count: sql<number>`count(*)` }).from(schema.adminUsers).catch(() => [{ count: 0 }]),
          db.select({ count: sql<number>`count(*)` }).from(schema.products).catch(() => [{ count: 0 }]),
          db.select({ count: sql<number>`count(*)` }).from(schema.events).catch(() => [{ count: 0 }]),
          db.select({ count: sql<number>`count(*)` }).from(schema.orders).catch(() => [{ count: 0 }]),
          db.select({ count: sql<number>`count(*)` }).from(schema.newsletterSubscribers).catch(() => [{ count: 0 }]),
          db.select({ count: sql<number>`count(*)` }).from(schema.resources).catch(() => [{ count: 0 }]),
        ]);
        
        // Get unread submissions
        const unreadSubmissions = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.formSubmissions)
          .where(eq(schema.formSubmissions.isRead, 0))
          .catch(() => [{ count: 0 }]);
        
        // Get published vs draft counts
        const publishedPages = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.pages)
          .where(eq(schema.pages.published, 1))
          .catch(() => [{ count: 0 }]);
        
        const publishedArticles = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.articles)
          .where(eq(schema.articles.published, 1))
          .catch(() => [{ count: 0 }]);
        
        // Get recent orders count (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentOrders = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.orders)
          .where(gte(schema.orders.createdAt, sevenDaysAgo))
          .catch(() => [{ count: 0 }]);
        
        // Calculate total revenue
        const revenueResult = await db
          .select({ total: sql<number>`COALESCE(SUM(totalAmount), 0)` })
          .from(schema.orders)
          .where(eq(schema.orders.status, 'completed'))
          .catch(() => [{ total: 0 }]);
        
        // Helper to safely extract count (handles string/number/BigInt)
        const getCount = (arr: any[]) => {
          const val = arr[0]?.count;
          if (val === null || val === undefined) return 0;
          return typeof val === 'bigint' ? Number(val) : Number(val) || 0;
        };
        
        return {
          totalPages: getCount(pages),
          publishedPages: getCount(publishedPages),
          totalArticles: getCount(articles),
          publishedArticles: getCount(publishedArticles),
          totalMedia: getCount(media),
          totalFormSubmissions: getCount(submissions),
          unreadSubmissions: getCount(unreadSubmissions),
          totalUsers: getCount(users),
          totalProducts: getCount(products),
          totalEvents: getCount(events),
          totalOrders: getCount(orders),
          recentOrders: getCount(recentOrders),
          totalRevenue: revenueResult[0]?.total ? Number(revenueResult[0].total) : 0,
          totalSubscribers: getCount(newsletters),
          totalResources: getCount(resources),
        };
      }),
    
    // System health check
    health: adminProcedure.query(async () => {
      const db = await getDb();
      const checks = {
        database: false,
        storage: false,
        email: false,
        ai: false,
      };
      
      // Database check
      if (db) {
        try {
          await db.execute(sql`SELECT 1`);
          checks.database = true;
        } catch {}
      }
      
      // Storage check
      checks.storage = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
      
      // Email check
      checks.email = !!(process.env.SES_FROM_EMAIL || process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY);
      
      // AI check
      checks.ai = !!(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
      
      return {
        status: checks.database ? 'healthy' : 'degraded',
        checks,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    }),

    recentActivity: adminProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Get recent pages
        const recentPages = await db
          .select({
            id: schema.pages.id,
            title: schema.pages.title,
            slug: schema.pages.slug,
            createdAt: schema.pages.createdAt,
            updatedAt: schema.pages.updatedAt,
            type: sql<string>`'page'`,
          })
          .from(schema.pages)
          .orderBy(desc(schema.pages.createdAt))
          .limit(5);
        
        // Get recent articles
        const recentArticles = await db
          .select({
            id: schema.articles.id,
            title: schema.articles.title,
            slug: schema.articles.slug,
            createdAt: schema.articles.createdAt,
            updatedAt: schema.articles.updatedAt,
            type: sql<string>`'article'`,
          })
          .from(schema.articles)
          .orderBy(desc(schema.articles.createdAt))
          .limit(5);

        // Get recent products
        const recentProducts = await db
          .select({
            id: schema.products.id,
            title: schema.products.name,
            slug: schema.products.slug,
            createdAt: schema.products.createdAt,
            updatedAt: schema.products.updatedAt,
            type: sql<string>`'product'`,
          })
          .from(schema.products)
          .orderBy(desc(schema.products.createdAt))
          .limit(5);

        // Get recent events
        const recentEvents = await db
          .select({
            id: schema.events.id,
            title: schema.events.title,
            slug: schema.events.slug,
            createdAt: schema.events.createdAt,
            updatedAt: schema.events.updatedAt,
            type: sql<string>`'event'`,
          })
          .from(schema.events)
          .orderBy(desc(schema.events.createdAt))
          .limit(5);
        
        // Combine and sort
        const activities = [...recentPages, ...recentArticles, ...recentProducts, ...recentEvents]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 15)
          .map(item => {
            const typeLabels: Record<string, string> = {
              page: 'Page',
              article: 'Article',
              product: 'Product',
              event: 'Event',
            };
            const actionLabels: Record<string, string> = {
              page: 'created',
              article: 'published',
              product: 'added',
              event: 'scheduled',
            };
            const linkPaths: Record<string, string> = {
              page: '/admin/pages',
              article: '/admin/articles',
              product: '/admin/products',
              event: '/admin/events',
            };
            return {
              id: item.id,
              type: item.type,
              title: item.title,
              slug: item.slug,
              description: `${typeLabels[item.type] || 'Item'} "${item.title}" was ${actionLabels[item.type] || 'created'}`,
              timestamp: new Date(item.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              link: linkPaths[item.type] || '/admin/dashboard',
            };
          });
        
        return activities;
      }),
    
    // Code Health Monitor
    codeHealth: router({
      // Get all errors
      getErrors: adminProcedure
        .input(z.object({ limit: z.number().optional(), includeResolved: z.boolean().optional() }).optional())
        .query(({ input }) => {
          const limit = input?.limit || 20;
          const includeResolved = input?.includeResolved || false;
          const errors = includeResolved 
            ? codeErrorStore.slice(0, limit)
            : codeErrorStore.filter(e => !e.resolved).slice(0, limit);
          
          const stats = {
            total: codeErrorStore.length,
            unresolved: codeErrorStore.filter(e => !e.resolved).length,
            jsErrors: codeErrorStore.filter(e => e.type === 'js_error' && !e.resolved).length,
            apiErrors: codeErrorStore.filter(e => e.type === 'api_error' && !e.resolved).length,
            lastError: codeErrorStore[0]?.timestamp || null,
            status: codeErrorStore.filter(e => !e.resolved).length === 0 ? 'healthy' : 
                    codeErrorStore.filter(e => !e.resolved).length < 5 ? 'warning' : 'critical',
          };
          
          return { errors, stats };
        }),
      
      // Log a new error (public endpoint for frontend error reporting)
      logError: publicProcedure
        .input(z.object({
          type: z.enum(['js_error', 'api_error', 'build_error', 'runtime_error']),
          message: z.string(),
          stack: z.string().optional(),
          url: z.string().optional(),
          userAgent: z.string().optional(),
        }))
        .mutation(({ input }) => {
          const error = logCodeError(input);
          return { success: true, errorId: error.id };
        }),
      
      // Resolve an error
      resolveError: adminProcedure
        .input(z.object({ errorId: z.string() }))
        .mutation(({ input }) => {
          const error = codeErrorStore.find(e => e.id === input.errorId);
          if (error) {
            error.resolved = true;
            return { success: true };
          }
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Error not found' });
        }),
      
      // Clear all resolved errors
      clearResolved: adminProcedure
        .mutation(() => {
          const before = codeErrorStore.length;
          const unresolvedErrors = codeErrorStore.filter(e => !e.resolved);
          codeErrorStore.length = 0;
          codeErrorStore.push(...unresolvedErrors);
          return { success: true, cleared: before - codeErrorStore.length };
        }),
      
      // Resolve all errors
      resolveAll: adminProcedure
        .mutation(() => {
          codeErrorStore.forEach(e => e.resolved = true);
          return { success: true, resolved: codeErrorStore.length };
        }),
    }),
  }),

  // AI Content Generation
  ai: router({    generateArticle: adminProcedure
      .input(z.object({ topic: z.string(), tone: z.string().optional() }))
      .mutation(async ({ input }) => {
        const content = await generateArticleContent(input.topic, input.tone);
        return { content };
      }),

    generateMetaDescription: adminProcedure
      .input(z.object({ title: z.string(), content: z.string() }))
      .mutation(async ({ input }) => {
        const description = await generateMetaDescription(input.title, input.content);
        return { description };
      }),

    generateImageAlt: adminProcedure
      .input(z.object({ imageUrl: z.string(), context: z.string().optional() }))
      .mutation(async ({ input }) => {
        await ensureGeminiInitialized();
        const altText = await generateImageAltText(input.imageUrl, input.context);
        return { altText };
      }),

    generateContentSuggestions: adminProcedure
      .mutation(async () => {
        // Get all existing articles
        const articles = await getAllArticles();
        const articleData = articles.map(a => ({
          title: a.title,
          content: a.content || ""
        }));
        
        const suggestions = await generateContentSuggestions(articleData);
        return { suggestions };
      }),

    generateBulkAltText: adminProcedure
      .input(z.object({ imageUrls: z.array(z.string()) }))
      .mutation(async ({ input }) => {
        await ensureGeminiInitialized();
        const results = await generateBulkAltText(input.imageUrls);
        return { results };
      }),

    generatePageBlocks: adminProcedure
      .input(z.object({
        description: z.string().min(10, "Description must be at least 10 characters"),
        pageType: z.enum(['landing', 'about', 'services', 'contact', 'blog', 'custom']).default('custom')
      }))
      .mutation(async ({ input }) => {
        const result = await generatePageBlocks(input.description, input.pageType);
        return result;
      }),

    generateImage: adminProcedure
      .input(z.object({
        sourceImageUrl: z.string(),
        style: z.string().optional(),
        prompt: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await ensureGeminiInitialized();
        const result = await generateImageVariation(input.sourceImageUrl, input.style, input.prompt);
        
        // Save the generated image to S3 and database
        const filename = `ai-generated-${Date.now()}.png`;
        const buffer = Buffer.from(result.imageData, 'base64');
        
        // Upload to S3
        const s3Key = `media/${filename}`;
        await storagePut(s3Key, buffer, result.mimeType);
        
        // Get the public URL
        const s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;
        
        // Save to database
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const mediaResult = await db.insert(schema.media).values({
          filename,
          originalName: `AI Generated - ${new Date().toLocaleDateString()}`,
          mimeType: result.mimeType,
          fileSize: buffer.length,
          s3Key,
          url: s3Url,
          altText: result.description.substring(0, 500),
          type: 'image',
          uploadedBy: 'AI Generator',
        });
        
        return {
          success: true,
          mediaId: Number(mediaResult[0].insertId),
          url: s3Url,
          description: result.description,
        };
      }),

    generateVideoLoop: adminProcedure
      .input(z.object({
        sourceImageUrl: z.string().optional(),
        prompt: z.string().optional(),
        duration: z.number().min(2).max(10).default(4),
      }))
      .mutation(async ({ input }) => {
        await ensureGeminiInitialized();
        const result = await generateVideoLoop(input.sourceImageUrl, input.prompt, input.duration);
        
        // Save the generated video to S3 and database
        const filename = `ai-video-loop-${Date.now()}.mp4`;
        const buffer = Buffer.from(result.videoData, 'base64');
        
        // Upload to S3
        const s3Key = `media/${filename}`;
        await storagePut(s3Key, buffer, result.mimeType);
        
        // Get the public URL
        const s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;
        
        // Save to database
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const mediaResult = await db.insert(schema.media).values({
          filename,
          originalName: `AI Video Loop - ${new Date().toLocaleDateString()}`,
          mimeType: result.mimeType,
          fileSize: buffer.length,
          s3Key,
          url: s3Url,
          altText: result.description.substring(0, 500),
          type: 'video',
          uploadedBy: 'AI Generator',
        });
        
        return {
          success: true,
          mediaId: Number(mediaResult[0].insertId),
          url: s3Url,
          description: result.description,
        };
      }),
  }),

  // Get current admin settings
  getSettings: adminProcedure.query(async ({ ctx }) => {
    const admin = await getAdminByUsername(ctx.adminUsername);
    if (!admin) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Admin user not found" });
    }
    
    // Get Gemini API key from aiSettings table
    const db = await getDb();
    let geminiApiKey = '';
    let mailchimpApiKey = admin.mailchimpApiKey || '';
    let mailchimpAudienceId = admin.mailchimpAudienceId || '';
    
    if (db) {
      try {
        // Get Gemini key from aiSettings table
        const [aiSetting] = await db.select().from(schema.aiSettings).limit(1);
        if (aiSetting?.geminiApiKey) {
          geminiApiKey = aiSetting.geminiApiKey;
        }
      } catch (e) {
        console.log('aiSettings table may not exist yet');
      }
    }
    
    return {
      username: admin.username,
      mailchimpApiKey,
      mailchimpAudienceId,
      geminiApiKey,
      // Mask API keys for display (show last 4 chars only)
      geminiApiKeyMasked: geminiApiKey ? `****${geminiApiKey.slice(-4)}` : '',
      mailchimpApiKeyMasked: mailchimpApiKey ? `****${mailchimpApiKey.slice(-4)}` : '',
    };
  }),

  // Site Settings Management (uses aiSettings for Gemini, siteSettings for general)
  siteSettings: router({
    // Get all settings
    getAll: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      try {
        const settings = await db.select().from(schema.siteSettings);
        return settings;
      } catch (e) {
        return [];
      }
    }),

    // Get a single setting
    get: adminProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const [setting] = await db.select()
          .from(schema.siteSettings)
          .where(eq(schema.siteSettings.settingKey, input.key));
        
        return setting || null;
      }),

    // Update or create a setting
    upsert: adminProcedure
      .input(z.object({
        key: z.string(),
        value: z.string().nullable(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Check if setting exists
        const [existing] = await db.select()
          .from(schema.siteSettings)
          .where(eq(schema.siteSettings.settingKey, input.key));
        
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

    // Save Gemini API key specifically (uses aiSettings table)
    saveGeminiKey: adminProcedure
      .input(z.object({ apiKey: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Check if aiSettings row exists
        const [existing] = await db.select().from(schema.aiSettings).limit(1);
        
        if (existing) {
          await db.update(schema.aiSettings)
            .set({ geminiApiKey: input.apiKey })
            .where(eq(schema.aiSettings.id, existing.id));
        } else {
          await db.insert(schema.aiSettings).values({
            geminiApiKey: input.apiKey,
          });
        }
        
        // Reinitialize Gemini with new key
        initializeGemini(input.apiKey);
        
        return { success: true };
      }),

    // Test Gemini API connection
    testGeminiConnection: adminProcedure
      .mutation(async () => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Get the API key from aiSettings table
        const [aiSetting] = await db.select().from(schema.aiSettings).limit(1);
        
        const apiKey = aiSetting?.geminiApiKey || process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
          return { success: false, error: 'No Gemini API key configured' };
        }
        
        try {
          initializeGemini(apiKey);
          // Try a simple generation to test the connection
          const testResult = await generateMetaDescription('Test', 'This is a test to verify the API connection.');
          return { success: true, message: 'Gemini API connection successful!' };
        } catch (error: any) {
          return { success: false, error: error.message || 'Connection failed' };
        }
      }),
  }),

  // Authentication
  login: publicProcedure
    .input(z.object({
      username: z.string(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const admin = await getAdminByUsername(input.username);
      
      if (!admin || !verifyPassword(input.password, admin.passwordHash)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }
      
      const token = await createAdminSession(admin.username);
      
      return {
        success: true,
        token,
        username: admin.username,
      };
    }),
  
  logout: adminProcedure
    .mutation(async ({ ctx }) => {
      const token = ctx.req.headers["x-admin-token"] as string;
      await deleteAdminSession(token);
      return { success: true };
    }),
  
  verifySession: adminProcedure
    .query(({ ctx }) => {
      return {
        valid: true,
        username: ctx.adminUsername,
      };
    }),
  
  // Admin settings
  changePassword: adminProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ ctx, input }) => {
      const admin = await getAdminByUsername(ctx.adminUsername);
      
      if (!admin || !verifyPassword(input.currentPassword, admin.passwordHash)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
      }
      
      await updateAdminPassword(ctx.adminUsername, input.newPassword);
      
      return { success: true };
    }),
  
  changeUsername: adminProcedure
    .input(z.object({
      newUsername: z.string().min(3),
      password: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const admin = await getAdminByUsername(ctx.adminUsername);
      
      if (!admin || !verifyPassword(input.password, admin.passwordHash)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Password is incorrect" });
      }
      
      // Check if new username already exists
      const existing = await getAdminByUsername(input.newUsername);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Username already exists" });
      }
      
      await updateAdminUsername(ctx.adminUsername, input.newUsername);
      
      return { success: true, newUsername: input.newUsername };
    }),
  
  // Article management
  articles: router({
    list: adminProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const articles = await getAllArticles(input?.limit, input?.offset);
        return articles;
      }),
    
    get: adminProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const article = await getArticleBySlug(input.slug);
        if (!article) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
        }
        return article;
      }),
    
    create: adminProcedure
      .input(z.object({
        title: z.string(),
        slug: z.string(),
        category: z.string().optional(),
        date: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string(),
        imageUrl: z.string().optional(),
        published: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await createArticle(input);
        return { success: true };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        slug: z.string().optional(),
        category: z.string().optional(),
        date: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string().optional(),
        imageUrl: z.string().optional(),
        published: z.number().optional(),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateArticle(id, data);
        return { success: true };
      }),
    
    reorder: adminProcedure
      .input(z.object({
        articles: z.array(z.object({
          id: z.number(),
          displayOrder: z.number(),
        })),
      }))
      .mutation(async ({ input }) => {
        for (const article of input.articles) {
          await updateArticle(article.id, { displayOrder: article.displayOrder });
        }
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteArticle(input.id);
        return { success: true };
      }),
  }),
  
  // Site content management
  content: router({
    listAll: adminProcedure
      .query(async () => {
        return await getAllSiteContent();
      }),
    
    getByPage: adminProcedure
      .input(z.object({ page: z.string() }))
      .query(async ({ input }) => {
        return await getSiteContentByPage(input.page);
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        contentValue: z.string(),
      }))
      .mutation(async ({ input }) => {
        await updateSiteContent(input.id, input.contentValue);
        return { success: true };
      }),
    
    upsert: adminProcedure
      .input(z.object({
        page: z.string(),
        section: z.string(),
        contentKey: z.string(),
        contentValue: z.string(),
      }))
      .mutation(async ({ input }) => {
        await upsertSiteContent(input);
        return { success: true };
      }),
  }),
  
  // Media library management
  media: router({
    list: adminProcedure
      .query(async () => {
        const mediaItems = await getAllMedia();
        // Debug: Log video items with thumbnailUrl
        const videos = mediaItems.filter(m => m.type === 'video');
        console.log('[DEBUG] Video items with thumbnailUrl:', videos.map(v => ({ id: v.id, name: v.originalName, thumbnailUrl: v.thumbnailUrl })));
        return mediaItems;
      }),
    
    // Get presigned URL for direct S3 upload (for large files)
    getUploadUrl: adminProcedure
      .input(z.object({
        filename: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Generate unique filename
        const ext = input.filename.split('.').pop() || '';
        const uniqueFilename = `${nanoid()}.${ext}`;
        const s3Key = `media/${uniqueFilename}`;
        
        // Get presigned URL for direct upload
        const { uploadUrl, publicUrl } = await getPresignedUploadUrl(s3Key, input.mimeType);
        
        return {
          uploadUrl,
          publicUrl,
          s3Key,
          uniqueFilename,
          originalName: input.filename,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
        };
      }),
    
    // Confirm upload after direct S3 upload completes
    confirmUpload: adminProcedure
      .input(z.object({
        s3Key: z.string(),
        uniqueFilename: z.string(),
        originalName: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
        publicUrl: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Determine media type
        const type = input.mimeType.startsWith('video/') ? 'video' : 
                     input.mimeType.startsWith('audio/') ? 'video' : 'image';
        
        // Generate thumbnail for videos asynchronously
        let thumbnailUrl: string | undefined;
        if (type === 'video') {
          try {
            // Download video from S3
            const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
            const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
            
            const getCommand = new GetObjectCommand({
              Bucket: 'justxempower-assets',
              Key: input.s3Key,
            });
            
            const response = await s3Client.send(getCommand);
            const videoBuffer = await response.Body?.transformToByteArray();
            
            if (videoBuffer) {
              // Generate thumbnail
              const thumbnailResult = await generateVideoThumbnail(Buffer.from(videoBuffer), input.mimeType, 1);
              
              if (thumbnailResult.success && thumbnailResult.outputBuffer) {
                // Upload thumbnail to S3
                const thumbnailKey = `media/thumbnails/${nanoid()}.jpg`;
                const { storagePut } = await import('./storage');
                const uploadResult = await storagePut(thumbnailKey, thumbnailResult.outputBuffer, 'image/jpeg');
                thumbnailUrl = uploadResult.url;
              }
            }
          } catch (error) {
            console.error('Failed to generate video thumbnail:', error);
            // Continue without thumbnail - not a critical failure
          }
        }
        
        // Save to database
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        await db.insert(schema.media).values({
          filename: input.uniqueFilename,
          originalName: input.originalName,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          s3Key: input.s3Key,
          url: input.publicUrl,
          type,
          uploadedBy: ctx.adminUsername,
          thumbnailUrl: thumbnailUrl,
        });
        
        return { success: true, url: input.publicUrl, thumbnailUrl };
      }),
    
    // Legacy upload (for small files via base64)
    upload: adminProcedure
      .input(z.object({
        filename: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
        base64Data: z.string(), // Base64 encoded file data
      }))
      .mutation(async ({ input, ctx }) => {
        // Decode base64 data
        const buffer = Buffer.from(input.base64Data, 'base64');
        
        // Generate unique filename
        const ext = input.filename.split('.').pop() || '';
        const uniqueFilename = `${nanoid()}.${ext}`;
        const s3Key = `media/${uniqueFilename}`;
        
        // Upload to S3
        const { url } = await storagePut(s3Key, buffer, input.mimeType);
        
        // Determine media type
        const type = input.mimeType.startsWith('video/') ? 'video' : 'image';
        
        // Save to database
        await createMedia({
          filename: uniqueFilename,
          originalName: input.filename,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          s3Key,
          url,
          type,
          uploadedBy: ctx.adminUsername,
        });
        
        return { success: true, url };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        // Note: We're not deleting from S3 for safety
        // You can add S3 deletion logic here if needed
        await deleteMedia(input.id);
        return { success: true };
      }),
    
    // Update media alt text
    updateAltText: adminProcedure
      .input(z.object({ id: z.number(), altText: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.update(schema.media).set({ altText: input.altText }).where(eq(schema.media.id, input.id));
        return { success: true, altText: input.altText };
      }),
    
    // Get available conversion formats for a media file
    getConversionFormats: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const media = await getMediaById(input.id);
        if (!media) {
          throw new Error('Media not found');
        }
        
        const { getAvailableOutputFormats } = await import('./mediaConversionService');
        const formats = getAvailableOutputFormats(media.mimeType);
        
        return {
          currentFormat: media.mimeType,
          availableFormats: formats,
          mediaId: media.id,
          filename: media.originalName,
        };
      }),
    
    // Convert media to a different format
    convertMedia: adminProcedure
      .input(z.object({
        id: z.number(),
        targetFormat: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const media = await getMediaById(input.id);
        if (!media) {
          throw new Error('Media not found');
        }
        
        try {
          // Download media from S3
          const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
          // Extract valid region from AWS_REGION env var (handle cases like "USEast(N.Virginia)us-east-1")
          let region = process.env.AWS_REGION || 'us-east-1';
          if (region.includes('us-east-1')) {
            region = 'us-east-1';
          } else if (region.includes('us-west-2')) {
            region = 'us-west-2';
          } else if (region.includes('eu-west-1')) {
            region = 'eu-west-1';
          }
          const s3Client = new S3Client({ region });
          
          const getCommand = new GetObjectCommand({
            Bucket: 'justxempower-assets',
            Key: media.s3Key,
          });
          
          const response = await s3Client.send(getCommand);
          const mediaBuffer = await response.Body?.transformToByteArray();
          
          if (!mediaBuffer) {
            throw new Error('Failed to download media from S3');
          }
          
          // Convert media
          const { convertMedia: convertMediaFn } = await import('./mediaConversionService');
          const conversionResult = await convertMediaFn(Buffer.from(mediaBuffer), media.mimeType, input.targetFormat);
          
          if (!conversionResult.success || !conversionResult.outputBuffer) {
            throw new Error(conversionResult.error || 'Conversion failed');
          }
          
          // Upload converted file to S3
          const ext = conversionResult.outputExtension || 'bin';
          const convertedFilename = `${media.originalName.split('.')[0]}-converted.${ext}`;
          const convertedS3Key = `media/conversions/${nanoid()}.${ext}`;
          
          const { storagePut } = await import('./storage');
          const uploadResult = await storagePut(convertedS3Key, conversionResult.outputBuffer, input.targetFormat);
          
          // Save converted file to database
          await createMedia({
            filename: `${nanoid()}.${ext}`,
            originalName: convertedFilename,
            mimeType: input.targetFormat,
            fileSize: conversionResult.outputBuffer.length,
            s3Key: convertedS3Key,
            url: uploadResult.url,
            type: input.targetFormat.startsWith('video/') ? 'video' : 'image',
            uploadedBy: ctx.adminUsername,
          });
          
          return {
            success: true,
            url: uploadResult.url,
            filename: convertedFilename,
            format: input.targetFormat,
          };
        } catch (error) {
          console.error('Media conversion error:', error);
          throw new Error(error instanceof Error ? error.message : 'Conversion failed');
        }
      }),
  }),
  
  // Theme Settings
  theme: router({
    get: adminProcedure.query(async () => {
      return await getThemeSettings();
    }),
    
    update: adminProcedure
      .input(z.object({
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        accentColor: z.string().optional(),
        backgroundColor: z.string().optional(),
        textColor: z.string().optional(),
        headingFont: z.string().optional(),
        bodyFont: z.string().optional(),
        headingFontUrl: z.string().optional(),
        bodyFontUrl: z.string().optional(),
        containerMaxWidth: z.string().optional(),
        sectionSpacing: z.string().optional(),
        borderRadius: z.string().optional(),
        enableAnimations: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateThemeSettings(input);
        return { success: true };
      }),
    
    generatePalette: adminProcedure
      .input(z.object({ description: z.string() }))
      .mutation(async ({ input }) => {
        const palette = await generateColorPalette(input.description);
        return palette;
      }),
    
    suggestFonts: adminProcedure
      .input(z.object({ style: z.string() }))
      .mutation(async ({ input }) => {
        const fonts = await suggestFontPairings(input.style);
        return fonts;
      }),
  }),

  // Block Templates Management
  blockTemplates: router({
    list: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(schema.blockTemplates).orderBy(schema.blockTemplates.createdAt);
    }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          blocks: z.string(), // JSON array of block configurations
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const [result] = await db.insert(schema.blockTemplates).values(input);
        return { id: result.insertId };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.delete(schema.blockTemplates).where(eq(schema.blockTemplates.id, input.id));
        return { success: true };
      }),
  }),

  // Pages Management
  pages: router({
    list: adminProcedure.query(async () => {
      return await getAllPages();
    }),

    get: adminProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const page = await getPageBySlug(input.slug);
        if (!page) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Page not found" });
        }
        return page;
      }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const [page] = await db
          .select()
          .from(schema.pages)
          .where(eq(schema.pages.id, input.id));
        
        if (!page) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Page not found" });
        }
        return page;
      }),

    create: adminProcedure
      .input(
        z.object({
          title: z.string(),
          slug: z.string(),
          template: z.string().optional(),
          metaTitle: z.string().optional(),
          metaDescription: z.string().optional(),
          ogImage: z.string().optional(),
          published: z.number().optional(),
          showInNav: z.number().optional(),
          navOrder: z.number().optional(),
          parentId: z.number().nullable().optional(),
          autoGenerateSeo: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        let seoData = {
          metaTitle: input.metaTitle,
          metaDescription: input.metaDescription,
        };

        // Auto-generate SEO if requested and not provided
        if (input.autoGenerateSeo && (!input.metaTitle || !input.metaDescription)) {
          try {
            const generatedSeo = await generatePageSeo(input.title, input.slug);
            if (!input.metaTitle && generatedSeo.metaTitle) {
              seoData.metaTitle = generatedSeo.metaTitle;
            }
            if (!input.metaDescription && generatedSeo.metaDescription) {
              seoData.metaDescription = generatedSeo.metaDescription;
            }
          } catch (error) {
            console.error('Failed to auto-generate SEO:', error);
          }
        }

        // Create the page with SEO data
        const page = await createPage({
          ...input,
          metaTitle: seoData.metaTitle,
          metaDescription: seoData.metaDescription,
        });

        // Auto-add to SEO settings
        try {
          await addPageToSeoSettings(page.id, input.slug, seoData.metaTitle || input.title, seoData.metaDescription);
        } catch (error) {
          console.error('Failed to add page to SEO settings:', error);
        }

        return page;
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          slug: z.string().optional(),
          template: z.string().optional(),
          metaTitle: z.string().optional(),
          metaDescription: z.string().optional(),
          ogImage: z.string().optional(),
          published: z.number().optional(),
          showInNav: z.number().optional(),
          navOrder: z.number().optional(),
          parentId: z.number().nullable().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updatePage(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        // Now uses soft delete (moves to trash)
        return await softDeletePage(input.id);
      }),

    // Trash Bin Management
    trash: router({
      // List all trashed pages
      list: adminProcedure.query(async () => {
        return await getTrashedPages();
      }),

      // Restore a page from trash
      restore: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          return await restorePage(input.id);
        }),

      // Permanently delete a single page
      permanentDelete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          return await permanentlyDeletePage(input.id);
        }),

      // Empty all trash
      emptyAll: adminProcedure.mutation(async () => {
        return await emptyTrash();
      }),

      // Cleanup expired trash items
      cleanup: adminProcedure
        .input(z.object({ retentionDays: z.number().default(30) }))
        .mutation(async ({ input }) => {
          return await cleanupExpiredTrash(input.retentionDays);
        }),

      // Get trash retention settings
      getSettings: adminProcedure.query(async () => {
        const db = await getDb();
        if (!db) return { retentionDays: 30, autoCleanup: true };
        
        const [setting] = await db
          .select()
          .from(schema.siteSettings)
          .where(eq(schema.siteSettings.settingKey, 'trashRetentionDays'));
        
        const [autoCleanupSetting] = await db
          .select()
          .from(schema.siteSettings)
          .where(eq(schema.siteSettings.settingKey, 'trashAutoCleanup'));
        
        return {
          retentionDays: setting ? parseInt(setting.settingValue || '30') : 30,
          autoCleanup: autoCleanupSetting ? autoCleanupSetting.settingValue === 'true' : true,
        };
      }),

      // Update trash retention settings
      updateSettings: adminProcedure
        .input(z.object({
          retentionDays: z.number().min(1).max(365),
          autoCleanup: z.boolean(),
        }))
        .mutation(async ({ input }) => {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
          
          // Upsert retention days setting
          await db
            .insert(schema.siteSettings)
            .values({
              settingKey: 'trashRetentionDays',
              settingValue: input.retentionDays.toString(),
            })
            .onDuplicateKeyUpdate({
              set: { settingValue: input.retentionDays.toString() },
            });
          
          // Upsert auto cleanup setting
          await db
            .insert(schema.siteSettings)
            .values({
              settingKey: 'trashAutoCleanup',
              settingValue: input.autoCleanup.toString(),
            })
            .onDuplicateKeyUpdate({
              set: { settingValue: input.autoCleanup.toString() },
            });
          
          return { success: true };
        }),
    }),

    reorder: adminProcedure
      .input(
        z.object({
          pageOrders: z.array(
            z.object({
              id: z.number(),
              navOrder: z.number(),
              parentId: z.number().nullable().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        return await reorderPages(input.pageOrders);
      }),

    // Page Blocks Management
    blocks: router({
      list: adminProcedure
        .input(z.object({ pageId: z.number() }))
        .query(async ({ input }) => {
          return await getPageBlocks(input.pageId);
        }),

      create: adminProcedure
        .input(
          z.object({
            pageId: z.number(),
            type: z.string(), // Accept any block type from Page Builder
            content: z.string(),
            order: z.number(),
            settings: z.string().optional(),
            visibility: z.string().optional(),
            animation: z.string().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const result = await createPageBlock(input);
          
          // Sync to siteContent for Content Editor access
          try {
            const db = await getDb();
            if (db) {
              const [page] = await db
                .select()
                .from(schema.pages)
                .where(eq(schema.pages.id, input.pageId))
                .limit(1);
              if (page) {
                await syncPageBlocksToSiteContent(input.pageId, page.slug);
              }
            }
          } catch (error) {
            console.error('Failed to sync blocks to siteContent:', error);
          }
          
          return result;
        }),

      update: adminProcedure
        .input(
          z.object({
            id: z.number(),
            content: z.string().optional(),
            order: z.number().optional(),
            settings: z.string().optional(),
            visibility: z.string().optional(),
            animation: z.string().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          const result = await updatePageBlock(id, data);
          
          // Sync to siteContent for Content Editor access
          try {
            const db = await getDb();
            if (db) {
              // Get the block to find its pageId
              const [block] = await db
                .select()
                .from(schema.pageBlocks)
                .where(eq(schema.pageBlocks.id, id))
                .limit(1);
              if (block) {
                const [page] = await db
                  .select()
                  .from(schema.pages)
                  .where(eq(schema.pages.id, block.pageId))
                  .limit(1);
                if (page) {
                  await syncPageBlocksToSiteContent(block.pageId, page.slug);
                }
              }
            }
          } catch (error) {
            console.error('Failed to sync blocks to siteContent:', error);
          }
          
          return result;
        }),

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          return await deletePageBlock(input.id);
        }),

      reorder: adminProcedure
        .input(
          z.object({
            pageId: z.number().optional(),
            blocks: z.array(
              z.object({
                id: z.number(),
                order: z.number(),
              })
            ),
          })
        )
        .mutation(async ({ input }) => {
          console.log(`[blocks.reorder] Reordering ${input.blocks.length} blocks`);
          
          // Reorder the blocks
          await reorderPageBlocks(input.blocks);
          
          // Sync to siteContent if pageId is provided
          if (input.pageId) {
            try {
              const db = await getDb();
              if (db) {
                const [page] = await db
                  .select()
                  .from(schema.pages)
                  .where(eq(schema.pages.id, input.pageId))
                  .limit(1);
                if (page) {
                  await syncPageBlocksToSiteContent(input.pageId, page.slug);
                  console.log(`[blocks.reorder] Synced to siteContent for page ${page.slug}`);
                }
              }
            } catch (error) {
              console.error('[blocks.reorder] Failed to sync to siteContent:', error);
            }
          }
          
          return { success: true, reordered: input.blocks.length };
        }),

      // Normalize block orders (fix gaps and duplicates)
      normalizeOrders: adminProcedure
        .input(z.object({ pageId: z.number() }))
        .mutation(async ({ input }) => {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
          
          console.log(`[blocks.normalizeOrders] Normalizing orders for page ${input.pageId}`);
          
          // Get all blocks ordered by current order
          const allBlocks = await db
            .select()
            .from(schema.pageBlocks)
            .where(eq(schema.pageBlocks.pageId, input.pageId))
            .orderBy(schema.pageBlocks.order);
          
          // Reassign sequential orders
          let updated = 0;
          for (let i = 0; i < allBlocks.length; i++) {
            if (allBlocks[i].order !== i) {
              await db
                .update(schema.pageBlocks)
                .set({ order: i })
                .where(eq(schema.pageBlocks.id, allBlocks[i].id));
              updated++;
            }
          }
          
          // Sync to siteContent
          if (updated > 0) {
            const [page] = await db
              .select()
              .from(schema.pages)
              .where(eq(schema.pages.id, input.pageId))
              .limit(1);
            if (page) {
              await syncPageBlocksToSiteContent(input.pageId, page.slug);
            }
          }
          
          return { success: true, totalBlocks: allBlocks.length, updated };
        }),

      // Block version history endpoints
      versions: router({
        list: adminProcedure
          .input(z.object({ blockId: z.number() }))
          .query(async ({ input }) => {
            const db = await getDb();
            if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
            
            const versions = await db
              .select()
              .from(schema.blockVersions)
              .where(eq(schema.blockVersions.blockId, input.blockId))
              .orderBy(schema.blockVersions.versionNumber);
            
            return versions;
          }),

        restore: adminProcedure
          .input(z.object({ versionId: z.number() }))
          .mutation(async ({ input, ctx }) => {
            const db = await getDb();
            if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
            
            // Get the version to restore
            const [version] = await db
              .select()
              .from(schema.blockVersions)
              .where(eq(schema.blockVersions.id, input.versionId))
              .limit(1);
            
            if (!version) {
              throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
            }
            
            // Update the current block with version data
            await updatePageBlock(version.blockId, {
              content: version.content || "",
              settings: version.settings || "{}",
              order: version.order,
            });
            
            return { success: true };
          }),
      }),
    }),
  }),

  // Brand Assets Management
  brand: router({
    list: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const assets = await db.select().from(schema.brandAssets);
      return assets;
    }),

    upload: adminProcedure
      .input(z.object({
        assetType: z.enum(["logo_header", "logo_footer", "logo_mobile", "logo_preloader", "favicon", "og_image", "twitter_image"]),
        assetName: z.string(),
        base64Data: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Extract base64 data and convert to buffer
        const matches = input.base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid base64 image data" });
        }
        
        const [, imageType, base64] = matches;
        const buffer = Buffer.from(base64, 'base64');
        
        // Get image dimensions (simplified - in production use sharp or similar)
        let width = 0;
        let height = 0;
        
        // Upload to S3
        const fileName = `brand/${input.assetType}-${Date.now()}.${imageType}`;
        const { storagePut } = await import("./storage");
        const { url } = await storagePut(fileName, buffer, `image/${imageType}`);
        
        // Check if asset already exists
        const [existing] = await db
          .select()
          .from(schema.brandAssets)
          .where(eq(schema.brandAssets.assetType, input.assetType))
          .limit(1);
        
        if (existing) {
          // Update existing
          await db
            .update(schema.brandAssets)
            .set({
              assetUrl: url,
              assetName: input.assetName,
              width,
              height,
            })
            .where(eq(schema.brandAssets.assetType, input.assetType));
        } else {
          // Insert new
          await db.insert(schema.brandAssets).values({
            assetType: input.assetType,
            assetUrl: url,
            assetName: input.assetName,
            width,
            height,
          });
        }
        
        return { success: true, url };
      }),

    delete: adminProcedure
      .input(z.object({
        assetType: z.enum(["logo_header", "logo_footer", "logo_mobile", "logo_preloader", "favicon", "og_image", "twitter_image"]),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        await db
          .delete(schema.brandAssets)
          .where(eq(schema.brandAssets.assetType, input.assetType));
        
        return { success: true };
      }),
  }),

  // SEO Settings Management
  seo: router({
    get: adminProcedure
      .input(z.object({ pageSlug: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const [settings] = await db
          .select()
          .from(schema.seoSettings)
          .where(eq(schema.seoSettings.pageSlug, input.pageSlug))
          .limit(1);
        
        return settings || null;
      }),

    update: adminProcedure
      .input(z.object({
        pageSlug: z.string(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        metaKeywords: z.string().optional(),
        ogTitle: z.string().optional(),
        ogDescription: z.string().optional(),
        ogImage: z.string().optional(),
        twitterCard: z.string().optional(),
        canonicalUrl: z.string().optional(),
        noIndex: z.number().optional(),
        structuredData: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Check if settings exist
        const [existing] = await db
          .select()
          .from(schema.seoSettings)
          .where(eq(schema.seoSettings.pageSlug, input.pageSlug))
          .limit(1);
        
        if (existing) {
          // Update existing
          await db
            .update(schema.seoSettings)
            .set({
              metaTitle: input.metaTitle,
              metaDescription: input.metaDescription,
              metaKeywords: input.metaKeywords,
              ogTitle: input.ogTitle,
              ogDescription: input.ogDescription,
              ogImage: input.ogImage,
              twitterCard: input.twitterCard,
              canonicalUrl: input.canonicalUrl,
              noIndex: input.noIndex,
              structuredData: input.structuredData,
            })
            .where(eq(schema.seoSettings.pageSlug, input.pageSlug));
        } else {
          // Insert new
          await db.insert(schema.seoSettings).values({
            pageSlug: input.pageSlug,
            metaTitle: input.metaTitle,
            metaDescription: input.metaDescription,
            metaKeywords: input.metaKeywords,
            ogTitle: input.ogTitle,
            ogDescription: input.ogDescription,
            ogImage: input.ogImage,
            twitterCard: input.twitterCard,
            canonicalUrl: input.canonicalUrl,
            noIndex: input.noIndex,
            structuredData: input.structuredData,
          });
        }
        
        return { success: true };
      }),
  }),

  // Navigation Management
  navigation: router({
    list: adminProcedure
      .input(z.object({ location: z.enum(["header", "footer"]) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const items = await db
          .select()
          .from(schema.navigation)
          .where(eq(schema.navigation.location, input.location))
          .orderBy(schema.navigation.order);
        
        return items;
      }),

    create: adminProcedure
      .input(z.object({
        location: z.enum(["header", "footer"]),
        label: z.string(),
        url: z.string(),
        isExternal: z.number(),
        openInNewTab: z.number(),
        order: z.number(),
        parentId: z.number().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const result = await db.insert(schema.navigation).values(input);
        return { success: true, id: result[0].insertId };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        label: z.string().optional(),
        url: z.string().optional(),
        isExternal: z.number().optional(),
        openInNewTab: z.number().optional(),
        parentId: z.number().nullable().optional(),
        order: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const { id, ...updates } = input;
        await db
          .update(schema.navigation)
          .set(updates)
          .where(eq(schema.navigation.id, id));
        
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        await db
          .delete(schema.navigation)
          .where(eq(schema.navigation.id, input.id));
        
        return { success: true };
      }),

    reorder: adminProcedure
      .input(z.object({
        items: z.array(z.object({
          id: z.number(),
          order: z.number(),
        })),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Update order for each item
        for (const item of input.items) {
          await db
            .update(schema.navigation)
            .set({ order: item.order })
            .where(eq(schema.navigation.id, item.id));
        }
        
        return { success: true };
      }),
  }),

  // Form Builder Management
  forms: router({
    listFields: adminProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const fields = await db
          .select()
          .from(schema.formFields)
          .where(eq(schema.formFields.isActive, 1))
          .orderBy(schema.formFields.order);
        
        return fields;
      }),

    createField: adminProcedure
      .input(z.object({
        fieldName: z.string(),
        fieldLabel: z.string(),
        fieldType: z.enum(["text", "email", "tel", "textarea", "select", "checkbox"]),
        placeholder: z.string().nullable(),
        required: z.number(),
        order: z.number(),
        options: z.string().nullable(),
        isActive: z.number(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        await db.insert(schema.formFields).values(input);
        return { success: true };
      }),

    updateField: adminProcedure
      .input(z.object({
        id: z.number(),
        fieldName: z.string().optional(),
        fieldLabel: z.string().optional(),
        fieldType: z.enum(["text", "email", "tel", "textarea", "select", "checkbox"]).optional(),
        placeholder: z.string().nullable().optional(),
        required: z.number().optional(),
        options: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const { id, ...updates } = input;
        await db
          .update(schema.formFields)
          .set(updates)
          .where(eq(schema.formFields.id, id));
        
        return { success: true };
      }),

    deleteField: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        await db
          .update(schema.formFields)
          .set({ isActive: 0 })
          .where(eq(schema.formFields.id, input.id));
        
        return { success: true };
      }),

    listSubmissions: adminProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const submissions = await db
          .select()
          .from(schema.formSubmissions)
          .orderBy(desc(schema.formSubmissions.submittedAt));
        
        return submissions;
      }),

    markSubmissionRead: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        await db
          .update(schema.formSubmissions)
          .set({ isRead: 1 })
          .where(eq(schema.formSubmissions.id, input.id));
        
        return { success: true };
      }),
  }),

  // Backup & Restore Management - Time Machine Enhanced
  backups: router({
    // List all backups with optional filtering
    list: adminProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
        type: z.enum(["manual", "auto", "scheduled"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        const backupSystem = await import('./backupSystem');
        const result = await backupSystem.default.listBackups(input);
        return result.backups;
      }),

    // Create a new backup
    create: adminProcedure
      .input(z.object({
        backupName: z.string().min(1).max(255),
        description: z.string().max(1000).optional(),
        backupType: z.enum(["manual", "auto", "scheduled"]).default("manual"),
        includeMedia: z.boolean().default(true),
        includeConfig: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        const backupSystem = await import('./backupSystem');
        const result = await backupSystem.default.createBackup({
          ...input,
          createdBy: ctx.user?.email || ctx.user?.name || ctx.adminUsername || "admin",
        });
        return {
          success: result.success,
          s3Url: result.s3Url,
          backupId: result.backupId,
          size: result.size,
        };
      }),

    // Download backup data
    download: adminProcedure
      .input(z.object({
        backupId: z.number(),
      }))
      .query(async ({ input }) => {
        const backupSystem = await import('./backupSystem');
        const result = await backupSystem.default.downloadBackup(input.backupId);
        return result;
      }),

    // Restore from backup - ENHANCED with safety features
    restore: adminProcedure
      .input(z.object({
        backupId: z.number(),
        tables: z.array(z.string()).optional(),
        dryRun: z.boolean().default(false),
        createSafetyBackup: z.boolean().default(true),  // Auto-backup before restore
        mergeMode: z.boolean().default(false),  // Don't delete existing data
      }))
      .mutation(async ({ input }) => {
        const backupSystem = await import('./backupSystem');
        const result = await backupSystem.default.restoreBackup(input);
        return result;
      }),

    // Delete backup
    delete: adminProcedure
      .input(z.object({
        backupId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const backupSystem = await import('./backupSystem');
        const result = await backupSystem.default.deleteBackup(input.backupId);
        return result;
      }),

    // Get backup statistics
    stats: adminProcedure
      .query(async () => {
        const backupSystem = await import('./backupSystem');
        const result = await backupSystem.default.getBackupStats();
        return result;
      }),

    // Preview restore (dry run)
    previewRestore: adminProcedure
      .input(z.object({
        backupId: z.number(),
        tables: z.array(z.string()).optional(),
      }))
      .query(async ({ input }) => {
        const backupSystem = await import('./backupSystem');
        const result = await backupSystem.default.restoreBackup({
          ...input,
          dryRun: true,
        });
        return result;
      }),

    // Trigger scheduled backup manually
    triggerScheduled: adminProcedure
      .mutation(async () => {
        const backupSystem = await import('./backupSystem');
        await backupSystem.default.runScheduledBackup();
        return { success: true };
      }),

    // Cleanup old backups
    cleanup: adminProcedure
      .input(z.object({
        retentionDays: z.number().min(1).max(365).default(30),
      }))
      .mutation(async ({ input }) => {
        const backupSystem = await import('./backupSystem');
        const deleted = await backupSystem.default.cleanupOldBackups(input.retentionDays);
        return { deleted };
      }),

    // Verify backup integrity against live database
    verify: adminProcedure
      .input(z.object({
        backupId: z.number(),
      }))
      .query(async ({ input }) => {
        const backupSystem = await import('./backupSystem');
        const result = await backupSystem.verifyBackup(input.backupId);
        return result;
      }),

    // Get current database counts for comparison
    getLiveCounts: adminProcedure
      .query(async () => {
        const backupSystem = await import('./backupSystem');
        const result = await backupSystem.getLiveDatabaseCounts();
        return result;
      }),
  }),

  // Admin Users Management
  users: router({
    list: adminProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const users = await db
          .select({
            id: schema.adminUsers.id,
            username: schema.adminUsers.username,
            email: schema.adminUsers.email,
            role: schema.adminUsers.role,
            createdAt: schema.adminUsers.createdAt,
            lastLoginAt: schema.adminUsers.lastLoginAt,
          })
          .from(schema.adminUsers)
          .orderBy(desc(schema.adminUsers.createdAt));
        
        return users;
      }),

    create: adminProcedure
      .input(z.object({
        username: z.string(),
        email: z.string().nullable(),
        password: z.string(),
        role: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Check if username already exists
        const existing = await db
          .select()
          .from(schema.adminUsers)
          .where(eq(schema.adminUsers.username, input.username))
          .limit(1);
        
        if (existing.length > 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Username already exists" });
        }
        
        // Hash password
        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.hash(input.password, 10);
        
        await db.insert(schema.adminUsers).values({
          username: input.username,
          email: input.email,
          passwordHash,
          role: input.role,
        });
        
        return { success: true };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        email: z.string().nullable(),
        role: z.string(),
        password: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const updateData: any = {
          email: input.email,
          role: input.role,
        };
        
        // Update password if provided
        if (input.password) {
          const bcrypt = await import('bcryptjs');
          updateData.passwordHash = await bcrypt.hash(input.password, 10);
        }
        
        await db
          .update(schema.adminUsers)
          .set(updateData)
          .where(eq(schema.adminUsers.id, input.id));
        
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Prevent deleting the last admin
        const allAdmins = await db.select().from(schema.adminUsers);
        if (allAdmins.length <= 1) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete the last admin user" });
        }
        
        await db
          .delete(schema.adminUsers)
          .where(eq(schema.adminUsers.id, input.id));
        
        return { success: true };
      }),
  }),

  // URL Redirects Management
  redirects: router({
    list: adminProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const redirects = await db
          .select()
          .from(schema.redirects)
          .orderBy(schema.redirects.createdAt);
        
        return redirects;
      }),

    create: adminProcedure
      .input(z.object({
        fromPath: z.string(),
        toPath: z.string(),
        redirectType: z.enum(["301", "302"]),
        isActive: z.number(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        await db.insert(schema.redirects).values(input);
        return { success: true };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        fromPath: z.string().optional(),
        toPath: z.string().optional(),
        redirectType: z.enum(["301", "302"]).optional(),
        isActive: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const { id, ...updates } = input;
        await db
          .update(schema.redirects)
          .set(updates)
          .where(eq(schema.redirects.id, id));
        
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        await db
          .delete(schema.redirects)
          .where(eq(schema.redirects.id, input.id));
        
        return { success: true };
      }),
  }),

  // Products Management
  products: router({
    list: adminProcedure
      .input(z.object({
        status: z.enum(["draft", "active", "archived"]).optional(),
        search: z.string().optional(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const conditions: any[] = [];
        if (input?.status) {
          conditions.push(eq(schema.products.status, input.status));
        }
        if (input?.search) {
          conditions.push(
            sql`(${schema.products.name} LIKE ${`%${input.search}%`} OR ${schema.products.sku} LIKE ${`%${input.search}%`})`
          );
        }
        
        const products = await db
          .select()
          .from(schema.products)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(schema.products.createdAt))
          .limit(input?.limit || 50)
          .offset(input?.offset || 0);
        
        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.products)
          .where(conditions.length > 0 ? and(...conditions) : undefined);
        
        return {
          products,
          total: countResult?.count || 0,
        };
      }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const [product] = await db
          .select()
          .from(schema.products)
          .where(eq(schema.products.id, input.id));
        
        if (!product) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        }
        
        return product;
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        sku: z.string().optional(),
        description: z.string().optional(),
        shortDescription: z.string().optional(),
        price: z.number().min(0),
        compareAtPrice: z.number().optional(),
        costPrice: z.number().optional(),
        categoryId: z.number().optional(),
        images: z.string().optional(),
        featuredImage: z.string().optional(),
        stock: z.number().default(0),
        lowStockThreshold: z.number().optional(),
        trackInventory: z.number().default(1),
        weight: z.number().optional(),
        dimensions: z.string().optional(),
        tags: z.string().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        status: z.enum(["draft", "active", "archived"]).default("draft"),
        isFeatured: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Check for duplicate slug
        const [existing] = await db
          .select()
          .from(schema.products)
          .where(eq(schema.products.slug, input.slug));
        
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "A product with this slug already exists" });
        }
        
        const result = await db.insert(schema.products).values(input);
        return { success: true, id: Number(result[0].insertId) };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        sku: z.string().optional(),
        description: z.string().optional(),
        shortDescription: z.string().optional(),
        price: z.number().min(0).optional(),
        compareAtPrice: z.number().nullable().optional(),
        costPrice: z.number().nullable().optional(),
        categoryId: z.number().nullable().optional(),
        images: z.string().optional(),
        featuredImage: z.string().nullable().optional(),
        stock: z.number().optional(),
        lowStockThreshold: z.number().optional(),
        trackInventory: z.number().optional(),
        weight: z.number().nullable().optional(),
        dimensions: z.string().optional(),
        tags: z.string().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        status: z.enum(["draft", "active", "archived"]).optional(),
        isFeatured: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const { id, ...updates } = input;
        
        // Check for duplicate slug if updating slug
        if (updates.slug) {
          const [existing] = await db
            .select()
            .from(schema.products)
            .where(and(
              eq(schema.products.slug, updates.slug),
              sql`${schema.products.id} != ${id}`
            ));
          
          if (existing) {
            throw new TRPCError({ code: "CONFLICT", message: "A product with this slug already exists" });
          }
        }
        
        await db
          .update(schema.products)
          .set(updates)
          .where(eq(schema.products.id, id));
        
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        await db
          .delete(schema.products)
          .where(eq(schema.products.id, input.id));
        
        return { success: true };
      }),
  }),

  // Events Management
  events: router({
    list: adminProcedure
      .input(z.object({
        status: z.enum(["draft", "published", "cancelled", "completed"]).optional(),
        search: z.string().optional(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const conditions: any[] = [];
        if (input?.status) {
          conditions.push(eq(schema.events.status, input.status));
        }
        if (input?.search) {
          conditions.push(
            sql`(${schema.events.title} LIKE ${`%${input.search}%`} OR ${schema.events.venue} LIKE ${`%${input.search}%`})`
          );
        }
        
        const events = await db
          .select()
          .from(schema.events)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(schema.events.startDate))
          .limit(input?.limit || 50)
          .offset(input?.offset || 0);
        
        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.events)
          .where(conditions.length > 0 ? and(...conditions) : undefined);
        
        return {
          events,
          total: countResult?.count || 0,
        };
      }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const [event] = await db
          .select()
          .from(schema.events)
          .where(eq(schema.events.id, input.id));
        
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
        
        // Get registrations count
        const [regCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.eventRegistrations)
          .where(eq(schema.eventRegistrations.eventId, input.id));
        
        return {
          ...event,
          registrationCount: regCount?.count || 0,
        };
      }),

    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        shortDescription: z.string().optional(),
        eventType: z.enum(["workshop", "retreat", "webinar", "meetup", "conference", "other"]).default("workshop"),
        startDate: z.date(),
        endDate: z.date().optional(),
        timezone: z.string().optional(),
        isAllDay: z.number().default(0),
        locationType: z.enum(["in_person", "virtual", "hybrid"]).default("in_person"),
        venue: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        virtualUrl: z.string().optional(),
        virtualPassword: z.string().optional(),
        isFree: z.number().default(0),
        price: z.number().default(0),
        earlyBirdPrice: z.number().optional(),
        earlyBirdDeadline: z.date().optional(),
        capacity: z.number().optional(),
        waitlistEnabled: z.number().default(0),
        featuredImage: z.string().optional(),
        images: z.string().optional(),
        registrationOpen: z.number().default(1),
        registrationDeadline: z.date().optional(),
        requiresApproval: z.number().default(0),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        status: z.enum(["draft", "published", "cancelled", "completed"]).default("draft"),
        isFeatured: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Check for duplicate slug
        const [existing] = await db
          .select()
          .from(schema.events)
          .where(eq(schema.events.slug, input.slug));
        
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "An event with this slug already exists" });
        }
        
        const result = await db.insert(schema.events).values(input);
        return { success: true, id: Number(result[0].insertId) };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        description: z.string().optional(),
        shortDescription: z.string().optional(),
        eventType: z.enum(["workshop", "retreat", "webinar", "meetup", "conference", "other"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().nullable().optional(),
        timezone: z.string().optional(),
        isAllDay: z.number().optional(),
        locationType: z.enum(["in_person", "virtual", "hybrid"]).optional(),
        venue: z.string().nullable().optional(),
        address: z.string().nullable().optional(),
        city: z.string().nullable().optional(),
        state: z.string().nullable().optional(),
        country: z.string().nullable().optional(),
        virtualUrl: z.string().nullable().optional(),
        virtualPassword: z.string().nullable().optional(),
        isFree: z.number().optional(),
        price: z.number().optional(),
        earlyBirdPrice: z.number().nullable().optional(),
        earlyBirdDeadline: z.date().nullable().optional(),
        capacity: z.number().nullable().optional(),
        waitlistEnabled: z.number().optional(),
        featuredImage: z.string().nullable().optional(),
        images: z.string().optional(),
        registrationOpen: z.number().optional(),
        registrationDeadline: z.date().nullable().optional(),
        requiresApproval: z.number().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        status: z.enum(["draft", "published", "cancelled", "completed"]).optional(),
        isFeatured: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const { id, ...updates } = input;
        
        // Check for duplicate slug if updating slug
        if (updates.slug) {
          const [existing] = await db
            .select()
            .from(schema.events)
            .where(and(
              eq(schema.events.slug, updates.slug),
              sql`${schema.events.id} != ${id}`
            ));
          
          if (existing) {
            throw new TRPCError({ code: "CONFLICT", message: "An event with this slug already exists" });
          }
        }
        
        await db
          .update(schema.events)
          .set(updates)
          .where(eq(schema.events.id, id));
        
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Delete related registrations first
        await db
          .delete(schema.eventRegistrations)
          .where(eq(schema.eventRegistrations.eventId, input.id));
        
        await db
          .delete(schema.events)
          .where(eq(schema.events.id, input.id));
        
        return { success: true };
      }),

    // Get registrations for an event
    getRegistrations: adminProcedure
      .input(z.object({
        eventId: z.number(),
        status: z.enum(["pending", "confirmed", "waitlisted", "cancelled", "attended", "no_show"]).optional(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const conditions = [eq(schema.eventRegistrations.eventId, input.eventId)];
        if (input.status) {
          conditions.push(eq(schema.eventRegistrations.status, input.status));
        }
        
        const registrations = await db
          .select()
          .from(schema.eventRegistrations)
          .where(and(...conditions))
          .orderBy(desc(schema.eventRegistrations.createdAt))
          .limit(input.limit)
          .offset(input.offset);
        
        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.eventRegistrations)
          .where(and(...conditions));
        
        return {
          registrations,
          total: countResult?.count || 0,
        };
      }),

    // Update registration status
    updateRegistrationStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "confirmed", "waitlisted", "cancelled", "attended", "no_show"]),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        await db
          .update(schema.eventRegistrations)
          .set({ status: input.status })
          .where(eq(schema.eventRegistrations.id, input.id));
        
        return { success: true };
      }),
  }),

  // Orders Management
  orders: router({
    list: adminProcedure
      .input(z.object({
        status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]).optional(),
        search: z.string().optional(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const conditions: any[] = [];
        if (input?.status) {
          conditions.push(eq(schema.orders.status, input.status));
        }
        if (input?.search) {
          conditions.push(
            sql`(${schema.orders.orderNumber} LIKE ${`%${input.search}%`} OR ${schema.orders.email} LIKE ${`%${input.search}%`})`
          );
        }
        
        const orders = await db
          .select()
          .from(schema.orders)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(schema.orders.createdAt))
          .limit(input?.limit || 50)
          .offset(input?.offset || 0);
        
        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.orders)
          .where(conditions.length > 0 ? and(...conditions) : undefined);
        
        return {
          orders,
          total: countResult?.count || 0,
        };
      }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const [order] = await db
          .select()
          .from(schema.orders)
          .where(eq(schema.orders.id, input.id));
        
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }
        
        // Get order items
        const items = await db
          .select()
          .from(schema.orderItems)
          .where(eq(schema.orderItems.orderId, input.id));
        
        return {
          ...order,
          items,
        };
      }),

    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]),
        trackingNumber: z.string().optional(),
        trackingUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const { id, ...updates } = input;
        await db
          .update(schema.orders)
          .set(updates)
          .where(eq(schema.orders.id, id));
        
        return { success: true };
      }),
  }),

  // Revenue Analytics
  revenue: router({
    stats: adminProcedure
      .input(z.object({
        period: z.enum(["today", "week", "month", "year", "all"]).optional().default("month"),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Calculate date range
        const now = new Date();
        let startDate: Date | null = null;
        const period = input?.period || "month";
        
        switch (period) {
          case "today":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case "week":
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
            break;
          case "month":
            startDate = new Date(now);
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case "year":
            startDate = new Date(now);
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
          case "all":
            startDate = null;
            break;
        }
        
        // Get shop revenue from orders
        const shopConditions = [eq(schema.orders.status, "delivered")];
        if (startDate) {
          shopConditions.push(gte(schema.orders.createdAt, startDate));
        }
        
        const [shopStats] = await db
          .select({
            totalRevenue: sql<number>`COALESCE(SUM(${schema.orders.total}), 0)`.as('totalRevenue'),
            orderCount: sql<number>`COUNT(*)`.as('orderCount'),
          })
          .from(schema.orders)
          .where(and(...shopConditions));
        
        // Get event revenue from registrations
        const eventConditions = [eq(schema.eventRegistrations.status, "confirmed")];
        if (startDate) {
          eventConditions.push(gte(schema.eventRegistrations.createdAt, startDate));
        }
        
        const [eventStats] = await db
          .select({
            totalRevenue: sql<number>`COALESCE(SUM(${schema.eventRegistrations.total}), 0)`.as('totalRevenue'),
            registrationCount: sql<number>`COUNT(*)`.as('registrationCount'),
          })
          .from(schema.eventRegistrations)
          .where(and(...eventConditions));
        
        // Get previous period for comparison
        let prevStartDate: Date | null = null;
        let prevEndDate: Date | null = null;
        
        if (startDate) {
          const periodMs = now.getTime() - startDate.getTime();
          prevEndDate = new Date(startDate);
          prevStartDate = new Date(startDate.getTime() - periodMs);
        }
        
        let prevShopRevenue = 0;
        let prevEventRevenue = 0;
        
        if (prevStartDate && prevEndDate) {
          const [prevShopStats] = await db
            .select({
              totalRevenue: sql<number>`COALESCE(SUM(${schema.orders.total}), 0)`.as('totalRevenue'),
            })
            .from(schema.orders)
            .where(and(
              eq(schema.orders.status, "delivered"),
              gte(schema.orders.createdAt, prevStartDate),
              sql`${schema.orders.createdAt} < ${prevEndDate}`
            ));
          prevShopRevenue = prevShopStats?.totalRevenue || 0;
          
          const [prevEventStats] = await db
            .select({
              totalRevenue: sql<number>`COALESCE(SUM(${schema.eventRegistrations.total}), 0)`.as('totalRevenue'),
            })
            .from(schema.eventRegistrations)
            .where(and(
              eq(schema.eventRegistrations.status, "confirmed"),
              gte(schema.eventRegistrations.createdAt, prevStartDate),
              sql`${schema.eventRegistrations.createdAt} < ${prevEndDate}`
            ));
          prevEventRevenue = prevEventStats?.totalRevenue || 0;
        }
        
        const shopRevenue = shopStats?.totalRevenue || 0;
        const eventRevenue = eventStats?.totalRevenue || 0;
        const totalRevenue = shopRevenue + eventRevenue;
        const prevTotalRevenue = prevShopRevenue + prevEventRevenue;
        
        const percentChange = prevTotalRevenue > 0 
          ? Math.round(((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100)
          : totalRevenue > 0 ? 100 : 0;
        
        return {
          totalRevenue,
          shopRevenue,
          eventRevenue,
          orderCount: shopStats?.orderCount || 0,
          registrationCount: eventStats?.registrationCount || 0,
          percentChange,
          period,
        };
      }),

    recentTransactions: adminProcedure
      .input(z.object({
        limit: z.number().optional().default(10),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Get recent orders
        const orders = await db
          .select({
            id: schema.orders.id,
            type: sql<string>`'order'`.as('type'),
            reference: schema.orders.orderNumber,
            email: schema.orders.email,
            amount: schema.orders.total,
            status: schema.orders.status,
            createdAt: schema.orders.createdAt,
          })
          .from(schema.orders)
          .orderBy(desc(schema.orders.createdAt))
          .limit(input?.limit || 10);
        
        // Get recent event registrations
        const registrations = await db
          .select({
            id: schema.eventRegistrations.id,
            type: sql<string>`'registration'`.as('type'),
            reference: schema.eventRegistrations.confirmationNumber,
            email: schema.eventRegistrations.email,
            amount: schema.eventRegistrations.total,
            status: schema.eventRegistrations.status,
            createdAt: schema.eventRegistrations.createdAt,
          })
          .from(schema.eventRegistrations)
          .orderBy(desc(schema.eventRegistrations.createdAt))
          .limit(input?.limit || 10);
        
        // Combine and sort by date
        const transactions = [...orders, ...registrations]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, input?.limit || 10);
        
        return { transactions };
      }),
  }),

  // Source Code Editor - List editable files
  sourceCode: router({
    listFiles: adminProcedure
      .input(z.object({
        directory: z.enum(["pages", "components", "hooks", "lib", "styles"]).default("pages"),
      }).optional())
      .query(async ({ input }) => {
        const dir = input?.directory || "pages";
        const basePath = path.resolve(process.cwd(), "client/src", dir);
        
        try {
          const files = fs.readdirSync(basePath, { withFileTypes: true });
          const result = files
            .filter(f => f.isFile() && (f.name.endsWith(".tsx") || f.name.endsWith(".ts") || f.name.endsWith(".css")))
            .map(f => {
              const filePath = path.join(basePath, f.name);
              const stats = fs.statSync(filePath);
              const content = fs.readFileSync(filePath, "utf-8");
              const lines = content.split("\n").length;
              return {
                name: f.name,
                path: `client/src/${dir}/${f.name}`,
                size: stats.size,
                lines,
                modified: stats.mtime.toISOString(),
                type: f.name.endsWith(".css") ? "css" : f.name.endsWith(".ts") ? "typescript" : "tsx",
              };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
          
          return { files: result, directory: dir, basePath: `client/src/${dir}` };
        } catch (e: any) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: e.message });
        }
      }),

    readFile: adminProcedure
      .input(z.object({
        filePath: z.string(),
      }))
      .query(async ({ input }) => {
        if (!input.filePath.startsWith("client/src/") || input.filePath.includes("..")) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        
        const possiblePaths = [
          path.resolve(process.cwd(), input.filePath),
          path.resolve("/var/www/justxempower", input.filePath),
        ];
        
        let fullPath = "";
        for (const p of possiblePaths) {
          if (fs.existsSync(p)) {
            fullPath = p;
            break;
          }
        }
        
        if (!fullPath) {
          throw new TRPCError({ code: "NOT_FOUND", message: `File not found. Tried: ${possiblePaths[0]}` });
        }
        
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          const stats = fs.statSync(fullPath);
          return {
            content,
            path: input.filePath,
            size: stats.size,
            lines: content.split("\n").length,
            modified: stats.mtime.toISOString(),
          };
        } catch (e: any) {
          throw new TRPCError({ code: "NOT_FOUND", message: `File read error: ${e.message}` });
        }
      }),

    writeFile: adminProcedure
      .input(z.object({
        filePath: z.string(),
        content: z.string(),
        createBackup: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        if (!input.filePath.startsWith("client/src/") || input.filePath.includes("..")) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        
        const basePaths = [
          process.cwd(),
          "/var/www/justxempower",
        ];
        
        let baseDir = "";
        for (const b of basePaths) {
          if (fs.existsSync(path.join(b, "client/src"))) {
            baseDir = b;
            break;
          }
        }
        
        if (!baseDir) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Cannot find base directory" });
        }
        
        const fullPath = path.resolve(baseDir, input.filePath);
        const backupDir = path.resolve(baseDir, ".code-backups");
        
        try {
          if (input.createBackup && fs.existsSync(fullPath)) {
            if (!fs.existsSync(backupDir)) {
              fs.mkdirSync(backupDir, { recursive: true });
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const backupName = `${path.basename(input.filePath)}.${timestamp}.bak`;
            const originalContent = fs.readFileSync(fullPath, "utf-8");
            fs.writeFileSync(path.join(backupDir, backupName), originalContent);
          }
          
          fs.writeFileSync(fullPath, input.content, "utf-8");
          
          const stats = fs.statSync(fullPath);
          return {
            success: true,
            path: input.filePath,
            size: stats.size,
            lines: input.content.split("\n").length,
            modified: stats.mtime.toISOString(),
            backupCreated: input.createBackup,
          };
        } catch (e: any) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: e.message });
        }
      }),

    listBackups: adminProcedure
      .query(async () => {
        const backupDir = path.resolve(process.cwd(), ".code-backups");
        
        try {
          if (!fs.existsSync(backupDir)) {
            return { backups: [] };
          }
          
          const files = fs.readdirSync(backupDir, { withFileTypes: true });
          const backups = files
            .filter(f => f.isFile() && f.name.endsWith(".bak"))
            .map(f => {
              const filePath = path.join(backupDir, f.name);
              const stats = fs.statSync(filePath);
              const parts = f.name.replace(".bak", "").split(".");
              const timestamp = parts.pop() || "";
              const originalName = parts.join(".");
              return {
                name: f.name,
                originalFile: originalName,
                timestamp,
                size: stats.size,
                created: stats.mtime.toISOString(),
              };
            })
            .sort((a, b) => b.created.localeCompare(a.created));
          
          return { backups };
        } catch (e: any) {
          return { backups: [] };
        }
      }),

    restoreBackup: adminProcedure
      .input(z.object({
        backupName: z.string(),
        targetPath: z.string(),
      }))
      .mutation(async ({ input }) => {
        if (!input.targetPath.startsWith("client/src/") || input.targetPath.includes("..")) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        
        const backupDir = path.resolve(process.cwd(), ".code-backups");
        const backupPath = path.join(backupDir, input.backupName);
        const targetPath = path.resolve(process.cwd(), input.targetPath);
        
        try {
          if (!fs.existsSync(backupPath)) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Backup not found" });
          }
          
          const content = fs.readFileSync(backupPath, "utf-8");
          fs.writeFileSync(targetPath, content, "utf-8");
          
          return { success: true, restored: input.targetPath };
        } catch (e: any) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: e.message });
        }
      }),

    deleteBackup: adminProcedure
      .input(z.object({ backupName: z.string() }))
      .mutation(async ({ input }) => {
        const backupDir = path.resolve(process.cwd(), ".code-backups");
        const backupPath = path.join(backupDir, input.backupName);
        
        try {
          if (fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
          }
          return { success: true };
        } catch (e: any) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: e.message });
        }
      }),

    getDirectoryTree: adminProcedure
      .query(async () => {
        const possiblePaths = [
          path.resolve(process.cwd(), "client/src"),
          path.resolve("/var/www/justxempower/client/src"),
        ];
        
        let basePath = "";
        for (const p of possiblePaths) {
          if (fs.existsSync(p)) {
            basePath = p;
            break;
          }
        }
        
        if (!basePath) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Source directory not found. CWD: ${process.cwd()}, Tried: ${possiblePaths.join(", ")}`,
          });
        }
        
        const scanDir = (dirPath: string, relativePath: string = ""): any[] => {
          try {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            return entries
              .filter(e => !e.name.startsWith(".") && e.name !== "node_modules")
              .map(entry => {
                const fullPath = path.join(dirPath, entry.name);
                const relPath = path.join(relativePath, entry.name);
                
                if (entry.isDirectory()) {
                  return {
                    name: entry.name,
                    type: "directory",
                    path: `client/src/${relPath}`,
                    children: scanDir(fullPath, relPath),
                  };
                } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts") || entry.name.endsWith(".css")) {
                  const stats = fs.statSync(fullPath);
                  return {
                    name: entry.name,
                    type: entry.name.endsWith(".css") ? "css" : entry.name.endsWith(".ts") ? "typescript" : "tsx",
                    path: `client/src/${relPath}`,
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                  };
                }
                return null;
              })
              .filter(Boolean)
              .sort((a: any, b: any) => {
                if (a.type === "directory" && b.type !== "directory") return -1;
                if (a.type !== "directory" && b.type === "directory") return 1;
                return a.name.localeCompare(b.name);
              });
          } catch (e: any) {
            console.error("scanDir error:", e.message);
            return [];
          }
        };
        
        return { tree: scanDir(basePath), basePath };
      }),

    aiAssist: adminProcedure
      .input(z.object({
        action: z.enum(["explain", "fix", "improve", "generate", "refactor", "comment", "test", "chat"]),
        code: z.string(),
        fileName: z.string().optional(),
        language: z.string().optional(),
        selection: z.string().optional(),
        prompt: z.string().optional(),
        conversationHistory: z.array(z.object({
          role: z.string(),
          content: z.string(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const result = await codeAssistant(input.action, input.code, {
            fileName: input.fileName,
            language: input.language,
            selection: input.selection,
            prompt: input.prompt,
            conversationHistory: input.conversationHistory,
          });
          return { success: true, result };
        } catch (e: any) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: e.message });
        }
      }),

    buildAndDeploy: adminProcedure
      .mutation(async () => {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        try {
          const buildResult = await execAsync('pnpm build', {
            cwd: process.cwd(),
            timeout: 120000,
          });
          
          try {
            await execAsync('pm2 restart justxempower', {
              cwd: process.cwd(),
              timeout: 30000,
            });
          } catch (pm2Error) {
            console.log('PM2 restart skipped (dev mode or not available)');
          }
          
          return {
            success: true,
            buildOutput: buildResult.stdout.slice(-500),
            message: 'Build completed successfully',
          };
        } catch (e: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Build failed: ${e.message}`,
          });
        }
      }),

    getStatus: adminProcedure
      .query(async () => {
        const distPath = path.resolve(process.cwd(), 'dist');
        const clientPath = path.resolve(process.cwd(), 'client/src');
        
        try {
          const distStats = fs.existsSync(distPath) ? fs.statSync(distPath) : null;
          
          let latestSourceMod = new Date(0);
          const checkDir = (dir: string) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
              const fullPath = path.join(dir, entry.name);
              if (entry.isDirectory() && !entry.name.startsWith('.')) {
                checkDir(fullPath);
              } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
                const stats = fs.statSync(fullPath);
                if (stats.mtime > latestSourceMod) {
                  latestSourceMod = stats.mtime;
                }
              }
            }
          };
          checkDir(clientPath);
          
          const needsRebuild = distStats ? latestSourceMod > distStats.mtime : true;
          
          return {
            lastBuild: distStats?.mtime.toISOString() || null,
            latestSourceChange: latestSourceMod.toISOString(),
            needsRebuild,
          };
        } catch (e: any) {
          return {
            lastBuild: null,
            latestSourceChange: null,
            needsRebuild: true,
          };
        }
      }),
  }),
});

// Public article router (for the Journal page)
export const publicArticlesRouter = router({
  list: publicProcedure
    .input(z.object({
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const articles = await getPublishedArticles(input?.limit, input?.offset);
      return articles;
    }),
  
  get: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const article = await getArticleBySlug(input.slug);
      if (!article || article.published !== 1) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
      }
      return article;
    }),
});

// Public site content router
export const publicContentRouter = router({
  getByPage: publicProcedure
    .input(z.object({ page: z.string() }))
    .query(async ({ input }) => {
      return await getSiteContentByPage(input.page);
    }),
  
  // Get text styles for a page (public)
  getTextStylesByPage: publicProcedure
    .input(z.object({ page: z.string() }).optional())
    .query(async ({ input }) => {
      // Handle undefined input gracefully
      if (!input || !input.page) {
        console.log('[getTextStylesByPage] No page specified, returning empty');
        return [];
      }
      
      const db = await getDb();
      if (!db) {
        console.log('[getTextStylesByPage] No database connection');
        return [];
      }
      
      // Get content IDs for this page
      const pageContent = await db
        .select({ id: schema.siteContent.id, section: schema.siteContent.section, contentKey: schema.siteContent.contentKey })
        .from(schema.siteContent)
        .where(eq(schema.siteContent.page, input.page));
      
      const contentIds = pageContent.map(c => c.id);
      console.log(`[getTextStylesByPage] Page: ${input.page}, Content IDs: ${contentIds.length}`);
      if (contentIds.length === 0) return [];
      
      // Get styles for these content items
      const styles = await db
        .select()
        .from(schema.contentTextStyles);
      
      console.log(`[getTextStylesByPage] Total styles in DB: ${styles.length}`);
      
      // Map styles with content keys and section for easier lookup on frontend
      const stylesWithKeys = styles
        .filter(s => contentIds.includes(s.contentId))
        .map(s => {
          const content = pageContent.find(c => c.id === s.contentId);
          return {
            contentId: s.contentId,
            section: content?.section || '',
            contentKey: content?.contentKey || '',
            isBold: s.isBold === 1,
            isItalic: s.isItalic === 1,
            isUnderline: s.isUnderline === 1,
            fontSize: s.fontSize || null,
            fontColor: s.fontColor || null,
          };
        });
      
      console.log(`[getTextStylesByPage] Returning ${stylesWithKeys.length} styles for page ${input.page}:`, JSON.stringify(stylesWithKeys));
      return stylesWithKeys;
    }),
});


// Public pages router
export const publicPagesRouter = router({
  // List all published pages
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const pages = await db
      .select()
      .from(schema.pages)
      .where(eq(schema.pages.published, 1))
      .orderBy(schema.pages.navOrder);
    return pages;
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const page = await getPageBySlug(input.slug);
      if (!page || page.published !== 1) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Page not found" });
      }
      return page;
    }),

  getNavPages: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const pages = await db
      .select({
        id: schema.pages.id,
        title: schema.pages.title,
        slug: schema.pages.slug,
        published: schema.pages.published,
        showInNav: schema.pages.showInNav,
        navOrder: schema.pages.navOrder,
        parentId: schema.pages.parentId,
      })
      .from(schema.pages)
      .where(and(eq(schema.pages.published, 1), eq(schema.pages.showInNav, 1)))
      .orderBy(schema.pages.navOrder);
    return pages;
  }),

  getBlocks: publicProcedure
    .input(z.object({ pageId: z.number() }))
    .query(async ({ input }) => {
      return await getPageBlocks(input.pageId);
    }),
});

// Public theme router for applying theme settings to the site
export const publicThemeRouter = router({
  get: publicProcedure.query(async () => {
    return await getThemeSettings();
  }),
});

// Public site settings router for frontend to fetch brand/site settings
export const publicSiteSettingsRouter = router({
  get: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return {};
    
    const settings = await db
      .select()
      .from(schema.siteSettings);
    
    // Convert array to object for easier access
    const settingsObj: Record<string, string> = {};
    settings.forEach(s => {
      if (s.settingValue !== null) {
        settingsObj[s.settingKey] = s.settingValue;
      }
    });
    
    return settingsObj;
  }),
  
  // Get brand assets for public display
  getBrandAssets: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return {};
    
    const assets = await db.select().from(schema.brandAssets);
    
    // Convert array to object keyed by assetType
    const assetsObj: Record<string, string> = {};
    assets.forEach(a => {
      assetsObj[a.assetType] = a.assetUrl;
    });
    
    return assetsObj;
  }),
  
  // Get specific setting by key
  getByKey: publicProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const setting = await db
        .select()
        .from(schema.siteSettings)
        .where(eq(schema.siteSettings.settingKey, input.key))
        .limit(1);
      
      return setting[0]?.settingValue || null;
    }),
});

// Public navigation router for footer and header navigation
export const publicNavigationRouter = router({
  // Get all active navigation items
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const items = await db
      .select()
      .from(schema.navigation)
      .where(eq(schema.navigation.isActive, 1))
      .orderBy(schema.navigation.order);
    
    return items;
  }),

  getByLocation: publicProcedure
    .input(z.object({ location: z.enum(["header", "footer"]) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const items = await db
        .select()
        .from(schema.navigation)
        .where(and(
          eq(schema.navigation.location, input.location),
          eq(schema.navigation.isActive, 1)
        ))
        .orderBy(schema.navigation.order);
      
      return items;
    }),
});

// AI Chat Analytics Router
export const aiChatAnalyticsRouter = router({
  // Get topic distribution
  getTopicDistribution: adminProcedure
    .input(z.object({
      days: z.number().optional().default(30)
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      
      const conversations = await db
        .select({
          topic: schema.aiChatConversations.topic,
          count: sql<number>`COUNT(*)`.as('count')
        })
        .from(schema.aiChatConversations)
        .where(
          and(
            gte(schema.aiChatConversations.createdAt, startDate),
            isNotNull(schema.aiChatConversations.topic)
          )
        )
        .groupBy(schema.aiChatConversations.topic)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(10);
      
      return conversations;
    }),

  // Get sentiment trends over time
  getSentimentTrends: adminProcedure
    .input(z.object({
      days: z.number().optional().default(30)
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      
      const trends = await db
        .select({
          date: sql<string>`DATE(${schema.aiChatConversations.createdAt})`.as('date'),
          sentiment: schema.aiChatConversations.sentiment,
          count: sql<number>`COUNT(*)`.as('count')
        })
        .from(schema.aiChatConversations)
        .where(
          and(
            gte(schema.aiChatConversations.createdAt, startDate),
            isNotNull(schema.aiChatConversations.sentiment)
          )
        )
        .groupBy(sql`DATE(${schema.aiChatConversations.createdAt})`, schema.aiChatConversations.sentiment)
        .orderBy(sql`DATE(${schema.aiChatConversations.createdAt})`);
      
      return trends;
    }),

  // Get conversation statistics
  getConversationStats: adminProcedure
    .input(z.object({
      days: z.number().optional().default(30)
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return {
        totalConversations: 0,
        totalMessages: 0,
        avgMessagesPerConversation: 0,
        uniqueVisitors: 0
      };
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      
      const [stats] = await db
        .select({
          totalMessages: sql<number>`COUNT(*)`.as('totalMessages'),
          uniqueSessions: sql<number>`COUNT(DISTINCT ${schema.aiChatConversations.sessionId})`.as('uniqueSessions'),
          uniqueVisitors: sql<number>`COUNT(DISTINCT ${schema.aiChatConversations.visitorId})`.as('uniqueVisitors')
        })
        .from(schema.aiChatConversations)
        .where(gte(schema.aiChatConversations.createdAt, startDate));
      
      return {
        totalConversations: stats?.uniqueSessions || 0,
        totalMessages: stats?.totalMessages || 0,
        avgMessagesPerConversation: stats?.uniqueSessions 
          ? Math.round((stats.totalMessages / stats.uniqueSessions) * 10) / 10 
          : 0,
        uniqueVisitors: stats?.uniqueVisitors || 0
      };
    }),
});


// ============================================================================
// CAROUSEL MANAGEMENT SYSTEM - Multi-carousel with slides support
// ============================================================================

const CarouselTypeEnum = z.enum(['hero', 'featured', 'testimonial', 'gallery', 'card', 'custom']);

const CarouselSettingsSchema = z.object({
  autoPlay: z.boolean().optional().default(true),
  interval: z.number().min(1000).max(30000).optional().default(5000),
  showArrows: z.boolean().optional().default(true),
  showDots: z.boolean().optional().default(true),
  pauseOnHover: z.boolean().optional().default(true),
  loop: z.boolean().optional().default(true),
  itemsPerView: z.number().min(1).max(6).optional().default(1),
  gap: z.number().min(0).max(100).optional().default(24),
  minHeight: z.string().optional().default('500px'),
  dark: z.boolean().optional().default(false),
}).passthrough();

const CarouselStylingSchema = z.object({
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  accentColor: z.string().optional(),
  containerMaxWidth: z.string().optional(),
  borderRadius: z.string().optional(),
  padding: z.string().optional(),
}).passthrough();

export const carouselRouter = router({
  // ==========================================================================
  // PUBLIC ENDPOINTS
  // ==========================================================================

  // Get all carousel offerings (legacy - for backward compatibility)
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const offerings = await db
      .select()
      .from(schema.carouselOfferings)
      .where(eq(schema.carouselOfferings.isActive, 1))
      .orderBy(schema.carouselOfferings.order);
    
    return offerings;
  }),

  // Get carousel by slug (new system)
  getBySlug: publicProcedure
    .input(z.object({
      slug: z.string(),
      includeHidden: z.boolean().optional().default(false),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const carouselResults = await db
        .select()
        .from(schema.carousels)
        .where(and(
          eq(schema.carousels.slug, input.slug),
          eq(schema.carousels.active, 1)
        ))
        .limit(1);

      if (carouselResults.length === 0) return null;
      const carousel = carouselResults[0];

      // Get slides
      let slidesQuery = db
        .select()
        .from(schema.carouselSlides)
        .where(eq(schema.carouselSlides.carouselId, carousel.id))
        .orderBy(schema.carouselSlides.sortOrder);

      const slides = await slidesQuery;

      // Filter hidden slides if needed
      const filteredSlides = input.includeHidden 
        ? slides 
        : slides.filter(s => s.visible === 1);

      return {
        id: carousel.id,
        name: carousel.name,
        slug: carousel.slug,
        type: carousel.type,
        settings: carousel.settings ? JSON.parse(carousel.settings) : {},
        styling: carousel.styling ? JSON.parse(carousel.styling) : {},
        slides: filteredSlides.map(s => ({
          ...s,
          styling: s.styling ? JSON.parse(s.styling) : {},
        })),
      };
    }),

  // List all public carousels
  listPublic: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const carousels = await db
      .select({
        id: schema.carousels.id,
        name: schema.carousels.name,
        slug: schema.carousels.slug,
        type: schema.carousels.type,
        description: schema.carousels.description,
      })
      .from(schema.carousels)
      .where(eq(schema.carousels.active, 1))
      .orderBy(schema.carousels.name);

    return carousels;
  }),

  // ==========================================================================
  // ADMIN ENDPOINTS - CAROUSELS
  // ==========================================================================

  // List all carousels (admin)
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const carousels = await db
      .select()
      .from(schema.carousels)
      .orderBy(schema.carousels.name);

    // Get slide counts
    const carouselsWithCounts = await Promise.all(
      carousels.map(async (c) => {
        const slides = await db
          .select({ id: schema.carouselSlides.id })
          .from(schema.carouselSlides)
          .where(eq(schema.carouselSlides.carouselId, c.id));
        return {
          ...c,
          settings: c.settings ? JSON.parse(c.settings) : {},
          styling: c.styling ? JSON.parse(c.styling) : {},
          slideCount: slides.length,
        };
      })
    );

    return carouselsWithCounts;
  }),

  // Get single carousel with slides (admin)
  get: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const carouselResults = await db
        .select()
        .from(schema.carousels)
        .where(eq(schema.carousels.id, input.id))
        .limit(1);

      if (carouselResults.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Carousel not found" });
      }

      const carousel = carouselResults[0];
      const slides = await db
        .select()
        .from(schema.carouselSlides)
        .where(eq(schema.carouselSlides.carouselId, input.id))
        .orderBy(schema.carouselSlides.sortOrder);

      return {
        ...carousel,
        settings: carousel.settings ? JSON.parse(carousel.settings) : {},
        styling: carousel.styling ? JSON.parse(carousel.styling) : {},
        slides: slides.map(s => ({
          ...s,
          styling: s.styling ? JSON.parse(s.styling) : {},
        })),
      };
    }),

  // Create new carousel
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
      description: z.string().optional(),
      type: CarouselTypeEnum,
      settings: CarouselSettingsSchema.optional(),
      styling: CarouselStylingSchema.optional(),
      active: z.boolean().optional().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check for duplicate slug
      const existing = await db
        .select({ id: schema.carousels.id })
        .from(schema.carousels)
        .where(eq(schema.carousels.slug, input.slug))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "A carousel with this slug already exists" });
      }

      const result = await db.insert(schema.carousels).values({
        name: input.name,
        slug: input.slug,
        description: input.description || null,
        type: input.type,
        settings: JSON.stringify(input.settings || {}),
        styling: JSON.stringify(input.styling || {}),
        active: input.active ? 1 : 0,
      });

      return { id: result[0].insertId, slug: input.slug };
    }),

  // Update carousel
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
      description: z.string().optional().nullable(),
      type: CarouselTypeEnum.optional(),
      settings: CarouselSettingsSchema.optional(),
      styling: CarouselStylingSchema.optional(),
      active: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { id, ...updates } = input;

      // Check if carousel exists
      const existing = await db
        .select({ id: schema.carousels.id })
        .from(schema.carousels)
        .where(eq(schema.carousels.id, id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Carousel not found" });
      }

      // Check for duplicate slug if updating slug
      if (updates.slug) {
        const duplicate = await db
          .select({ id: schema.carousels.id })
          .from(schema.carousels)
          .where(and(
            eq(schema.carousels.slug, updates.slug),
            sql`${schema.carousels.id} != ${id}`
          ))
          .limit(1);

        if (duplicate.length > 0) {
          throw new TRPCError({ code: "CONFLICT", message: "A carousel with this slug already exists" });
        }
      }

      // Build update object
      const updateData: Record<string, any> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.slug !== undefined) updateData.slug = updates.slug;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.settings !== undefined) updateData.settings = JSON.stringify(updates.settings);
      if (updates.styling !== undefined) updateData.styling = JSON.stringify(updates.styling);
      if (updates.active !== undefined) updateData.active = updates.active ? 1 : 0;

      if (Object.keys(updateData).length > 0) {
        await db
          .update(schema.carousels)
          .set(updateData)
          .where(eq(schema.carousels.id, id));
      }

      return { success: true };
    }),

  // Delete carousel
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Delete slides first (cascade)
      await db
        .delete(schema.carouselSlides)
        .where(eq(schema.carouselSlides.carouselId, input.id));

      // Delete carousel
      await db
        .delete(schema.carousels)
        .where(eq(schema.carousels.id, input.id));

      return { success: true };
    }),

  // ==========================================================================
  // ADMIN ENDPOINTS - SLIDES
  // ==========================================================================

  // Create slide
  createSlide: adminProcedure
    .input(z.object({
      carouselId: z.number(),
      title: z.string().optional(),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      videoUrl: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      altText: z.string().optional(),
      ctaText: z.string().optional(),
      ctaLink: z.string().optional(),
      ctaStyle: z.enum(['primary', 'secondary', 'ghost', 'outline']).optional(),
      authorName: z.string().optional(),
      authorRole: z.string().optional(),
      authorAvatar: z.string().optional(),
      rating: z.number().min(1).max(5).optional(),
      styling: z.record(z.string(), z.any()).optional(),
      visible: z.boolean().optional().default(true),
      sortOrder: z.number().optional().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify carousel exists
      const carousel = await db
        .select({ id: schema.carousels.id })
        .from(schema.carousels)
        .where(eq(schema.carousels.id, input.carouselId))
        .limit(1);

      if (carousel.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Carousel not found" });
      }

      const result = await db.insert(schema.carouselSlides).values({
        carouselId: input.carouselId,
        title: input.title || null,
        subtitle: input.subtitle || null,
        description: input.description || null,
        imageUrl: input.imageUrl || null,
        videoUrl: input.videoUrl || null,
        thumbnailUrl: input.thumbnailUrl || null,
        altText: input.altText || null,
        ctaText: input.ctaText || null,
        ctaLink: input.ctaLink || null,
        ctaStyle: input.ctaStyle || 'primary',
        authorName: input.authorName || null,
        authorRole: input.authorRole || null,
        authorAvatar: input.authorAvatar || null,
        rating: input.rating || null,
        styling: input.styling ? JSON.stringify(input.styling) : null,
        visible: input.visible ? 1 : 0,
        sortOrder: input.sortOrder,
      });

      return { id: result[0].insertId };
    }),

  // Update slide
  updateSlide: adminProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional().nullable(),
      subtitle: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      imageUrl: z.string().optional().nullable(),
      videoUrl: z.string().optional().nullable(),
      thumbnailUrl: z.string().optional().nullable(),
      altText: z.string().optional().nullable(),
      ctaText: z.string().optional().nullable(),
      ctaLink: z.string().optional().nullable(),
      ctaStyle: z.enum(['primary', 'secondary', 'ghost', 'outline']).optional(),
      authorName: z.string().optional().nullable(),
      authorRole: z.string().optional().nullable(),
      authorAvatar: z.string().optional().nullable(),
      rating: z.number().min(1).max(5).optional().nullable(),
      styling: z.record(z.string(), z.any()).optional(),
      visible: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { id, ...updates } = input;

      const updateData: Record<string, any> = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.subtitle !== undefined) updateData.subtitle = updates.subtitle;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl;
      if (updates.videoUrl !== undefined) updateData.videoUrl = updates.videoUrl;
      if (updates.thumbnailUrl !== undefined) updateData.thumbnailUrl = updates.thumbnailUrl;
      if (updates.altText !== undefined) updateData.altText = updates.altText;
      if (updates.ctaText !== undefined) updateData.ctaText = updates.ctaText;
      if (updates.ctaLink !== undefined) updateData.ctaLink = updates.ctaLink;
      if (updates.ctaStyle !== undefined) updateData.ctaStyle = updates.ctaStyle;
      if (updates.authorName !== undefined) updateData.authorName = updates.authorName;
      if (updates.authorRole !== undefined) updateData.authorRole = updates.authorRole;
      if (updates.authorAvatar !== undefined) updateData.authorAvatar = updates.authorAvatar;
      if (updates.rating !== undefined) updateData.rating = updates.rating;
      if (updates.styling !== undefined) updateData.styling = JSON.stringify(updates.styling);
      if (updates.visible !== undefined) updateData.visible = updates.visible ? 1 : 0;
      if (updates.sortOrder !== undefined) updateData.sortOrder = updates.sortOrder;

      if (Object.keys(updateData).length > 0) {
        await db
          .update(schema.carouselSlides)
          .set(updateData)
          .where(eq(schema.carouselSlides.id, id));
      }

      return { success: true };
    }),

  // Delete slide
  deleteSlide: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .delete(schema.carouselSlides)
        .where(eq(schema.carouselSlides.id, input.id));

      return { success: true };
    }),

  // Reorder slides
  reorderSlides: adminProcedure
    .input(z.array(z.object({
      id: z.number(),
      sortOrder: z.number(),
    })))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      for (const item of input) {
        await db
          .update(schema.carouselSlides)
          .set({ sortOrder: item.sortOrder })
          .where(eq(schema.carouselSlides.id, item.id));
      }

      return { success: true };
    }),

  // ==========================================================================
  // LEGACY ENDPOINTS - For backward compatibility with carouselOfferings
  // ==========================================================================

  getAllAdmin: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const offerings = await db
      .select()
      .from(schema.carouselOfferings)
      .orderBy(schema.carouselOfferings.order);
    
    return offerings;
  }),

  createOffering: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      link: z.string().optional(),
      imageUrl: z.string().optional(),
      order: z.number().optional().default(0),
      isActive: z.number().optional().default(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const result = await db.insert(schema.carouselOfferings).values({
        title: input.title,
        description: input.description || null,
        link: input.link || null,
        imageUrl: input.imageUrl || null,
        order: input.order,
        isActive: input.isActive,
      });
      
      return { success: true, id: result[0].insertId };
    }),

  updateOffering: adminProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      link: z.string().optional(),
      imageUrl: z.string().optional(),
      order: z.number().optional(),
      isActive: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const { id, ...updateData } = input;
      const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined)
      );
      
      if (Object.keys(filteredData).length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No fields to update" });
      }
      
      await db
        .update(schema.carouselOfferings)
        .set(filteredData)
        .where(eq(schema.carouselOfferings.id, id));
      
      return { success: true };
    }),

  deleteOffering: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      await db
        .delete(schema.carouselOfferings)
        .where(eq(schema.carouselOfferings.id, input.id));
      
      return { success: true };
    }),

  reorderOfferings: adminProcedure
    .input(z.array(z.object({
      id: z.number(),
      order: z.number(),
    })))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      for (const item of input) {
        await db
          .update(schema.carouselOfferings)
          .set({ order: item.order })
          .where(eq(schema.carouselOfferings.id, item.id));
      }
      
      return { success: true };
    }),
});


// Font Settings Router for site-wide typography management
export const fontSettingsRouter = router({
  // Get current font settings
  get: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;
    
    const settings = await db.select().from(schema.fontSettings).limit(1);
    return settings[0] || null;
  }),

  // Update font settings (admin only)
  update: adminProcedure
    .input(z.object({
      headingFont: z.string().optional(),
      bodyFont: z.string().optional(),
      accentFont: z.string().optional(),
      headingWeight: z.string().optional(),
      bodyWeight: z.string().optional(),
      headingBaseSize: z.string().optional(),
      bodyBaseSize: z.string().optional(),
      headingLineHeight: z.string().optional(),
      bodyLineHeight: z.string().optional(),
      headingLetterSpacing: z.string().optional(),
      bodyLetterSpacing: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Check if settings exist
      const existing = await db.select().from(schema.fontSettings).limit(1);
      
      if (existing.length === 0) {
        // Insert new settings
        await db.insert(schema.fontSettings).values(input);
      } else {
        // Update existing settings
        const filteredData = Object.fromEntries(
          Object.entries(input).filter(([_, v]) => v !== undefined)
        );
        
        if (Object.keys(filteredData).length > 0) {
          await db
            .update(schema.fontSettings)
            .set(filteredData)
            .where(eq(schema.fontSettings.id, existing[0].id));
        }
      }
      
      return { success: true };
    }),

  // Get available fonts list - 100+ Google Fonts
  availableFonts: publicProcedure.query(() => {
    return [
      // === SERIF FONTS (40+) ===
      { name: "Cormorant Garamond", category: "serif", googleFont: true, style: "elegant" },
      { name: "Playfair Display", category: "serif", googleFont: true, style: "elegant" },
      { name: "Libre Baskerville", category: "serif", googleFont: true, style: "classic" },
      { name: "Lora", category: "serif", googleFont: true, style: "elegant" },
      { name: "Crimson Text", category: "serif", googleFont: true, style: "classic" },
      { name: "EB Garamond", category: "serif", googleFont: true, style: "classic" },
      { name: "Merriweather", category: "serif", googleFont: true, style: "readable" },
      { name: "Source Serif Pro", category: "serif", googleFont: true, style: "modern" },
      { name: "Spectral", category: "serif", googleFont: true, style: "elegant" },
      { name: "Noto Serif", category: "serif", googleFont: true, style: "universal" },
      { name: "Bitter", category: "serif", googleFont: true, style: "modern" },
      { name: "Vollkorn", category: "serif", googleFont: true, style: "classic" },
      { name: "Cardo", category: "serif", googleFont: true, style: "classic" },
      { name: "Sorts Mill Goudy", category: "serif", googleFont: true, style: "elegant" },
      { name: "Cormorant", category: "serif", googleFont: true, style: "elegant" },
      { name: "PT Serif", category: "serif", googleFont: true, style: "classic" },
      { name: "Alegreya", category: "serif", googleFont: true, style: "elegant" },
      { name: "Bodoni Moda", category: "serif", googleFont: true, style: "elegant" },
      { name: "Cinzel", category: "serif", googleFont: true, style: "display" },
      { name: "Fraunces", category: "serif", googleFont: true, style: "display" },
      { name: "Newsreader", category: "serif", googleFont: true, style: "readable" },
      { name: "Petrona", category: "serif", googleFont: true, style: "modern" },
      { name: "Brygada 1918", category: "serif", googleFont: true, style: "classic" },
      { name: "Libre Caslon Text", category: "serif", googleFont: true, style: "classic" },
      { name: "Literata", category: "serif", googleFont: true, style: "readable" },
      { name: "Gelasio", category: "serif", googleFont: true, style: "classic" },
      { name: "Domine", category: "serif", googleFont: true, style: "classic" },
      { name: "Faustina", category: "serif", googleFont: true, style: "elegant" },
      { name: "Marcellus", category: "serif", googleFont: true, style: "display" },
      { name: "Quattrocento", category: "serif", googleFont: true, style: "classic" },
      { name: "Rufina", category: "serif", googleFont: true, style: "elegant" },
      { name: "Rokkitt", category: "serif", googleFont: true, style: "slab" },
      { name: "Zilla Slab", category: "serif", googleFont: true, style: "slab" },
      { name: "Roboto Slab", category: "serif", googleFont: true, style: "slab" },
      { name: "Arvo", category: "serif", googleFont: true, style: "slab" },
      { name: "Tinos", category: "serif", googleFont: true, style: "classic" },
      { name: "Crimson Pro", category: "serif", googleFont: true, style: "classic" },
      { name: "Amiri", category: "serif", googleFont: true, style: "elegant" },
      { name: "Gilda Display", category: "serif", googleFont: true, style: "display" },
      { name: "Vidaloka", category: "serif", googleFont: true, style: "display" },
      
      // === SANS-SERIF FONTS (50+) ===
      { name: "Inter", category: "sans-serif", googleFont: true, style: "modern" },
      { name: "Montserrat", category: "sans-serif", googleFont: true, style: "geometric" },
      { name: "Raleway", category: "sans-serif", googleFont: true, style: "elegant" },
      { name: "Poppins", category: "sans-serif", googleFont: true, style: "modern" },
      { name: "Nunito Sans", category: "sans-serif", googleFont: true, style: "friendly" },
      { name: "Work Sans", category: "sans-serif", googleFont: true, style: "professional" },
      { name: "DM Sans", category: "sans-serif", googleFont: true, style: "modern" },
      { name: "Outfit", category: "sans-serif", googleFont: true, style: "geometric" },
      { name: "Plus Jakarta Sans", category: "sans-serif", googleFont: true, style: "modern" },
      { name: "Jost", category: "sans-serif", googleFont: true, style: "geometric" },
      { name: "Josefin Sans", category: "sans-serif", googleFont: true, style: "elegant" },
      { name: "Quicksand", category: "sans-serif", googleFont: true, style: "rounded" },
      { name: "Karla", category: "sans-serif", googleFont: true, style: "grotesque" },
      { name: "Manrope", category: "sans-serif", googleFont: true, style: "modern" },
      { name: "Space Grotesk", category: "sans-serif", googleFont: true, style: "geometric" },
      { name: "Roboto", category: "sans-serif", googleFont: true, style: "modern" },
      { name: "Open Sans", category: "sans-serif", googleFont: true, style: "readable" },
      { name: "Lato", category: "sans-serif", googleFont: true, style: "friendly" },
      { name: "Source Sans Pro", category: "sans-serif", googleFont: true, style: "professional" },
      { name: "Nunito", category: "sans-serif", googleFont: true, style: "rounded" },
      { name: "Rubik", category: "sans-serif", googleFont: true, style: "rounded" },
      { name: "Ubuntu", category: "sans-serif", googleFont: true, style: "modern" },
      { name: "Cabin", category: "sans-serif", googleFont: true, style: "humanist" },
      { name: "Archivo", category: "sans-serif", googleFont: true, style: "grotesque" },
      { name: "Barlow", category: "sans-serif", googleFont: true, style: "modern" },
      { name: "Sora", category: "sans-serif", googleFont: true, style: "geometric" },
      { name: "Albert Sans", category: "sans-serif", googleFont: true, style: "modern" },
      { name: "Be Vietnam Pro", category: "sans-serif", googleFont: true, style: "modern" },
      { name: "Figtree", category: "sans-serif", googleFont: true, style: "modern" },
      { name: "Lexend", category: "sans-serif", googleFont: true, style: "readable" },
      { name: "Red Hat Display", category: "sans-serif", googleFont: true, style: "modern" },
      { name: "Urbanist", category: "sans-serif", googleFont: true, style: "geometric" },
      { name: "Mulish", category: "sans-serif", googleFont: true, style: "modern" },
      { name: "Heebo", category: "sans-serif", googleFont: true, style: "modern" },
      { name: "Signika", category: "sans-serif", googleFont: true, style: "readable" },
      { name: "Exo 2", category: "sans-serif", googleFont: true, style: "geometric" },
      { name: "Fira Sans", category: "sans-serif", googleFont: true, style: "modern" },
      { name: "Hind", category: "sans-serif", googleFont: true, style: "readable" },
      { name: "Asap", category: "sans-serif", googleFont: true, style: "rounded" },
      { name: "Overpass", category: "sans-serif", googleFont: true, style: "modern" },
      { name: "Assistant", category: "sans-serif", googleFont: true, style: "modern" },
      { name: "Sarabun", category: "sans-serif", googleFont: true, style: "modern" },
      { name: "Catamaran", category: "sans-serif", googleFont: true, style: "modern" },
      { name: "Maven Pro", category: "sans-serif", googleFont: true, style: "rounded" },
      { name: "Chivo", category: "sans-serif", googleFont: true, style: "modern" },
      { name: "Titillium Web", category: "sans-serif", googleFont: true, style: "modern" },
      { name: "IBM Plex Sans", category: "sans-serif", googleFont: true, style: "professional" },
      { name: "Questrial", category: "sans-serif", googleFont: true, style: "geometric" },
      { name: "Yantramanav", category: "sans-serif", googleFont: true, style: "modern" },
      { name: "Noto Sans", category: "sans-serif", googleFont: true, style: "universal" },
      { name: "Public Sans", category: "sans-serif", googleFont: true, style: "modern" },
      
      // === DISPLAY FONTS (15+) ===
      { name: "Abril Fatface", category: "display", googleFont: true, style: "display" },
      { name: "Bebas Neue", category: "display", googleFont: true, style: "display" },
      { name: "Oswald", category: "display", googleFont: true, style: "display" },
      { name: "Anton", category: "display", googleFont: true, style: "display" },
      { name: "Righteous", category: "display", googleFont: true, style: "display" },
      { name: "Fjalla One", category: "display", googleFont: true, style: "display" },
      { name: "Alfa Slab One", category: "display", googleFont: true, style: "display" },
      { name: "Archivo Black", category: "display", googleFont: true, style: "display" },
      { name: "Staatliches", category: "display", googleFont: true, style: "display" },
      { name: "Big Shoulders Display", category: "display", googleFont: true, style: "display" },
      { name: "Bungee", category: "display", googleFont: true, style: "display" },
      { name: "Monoton", category: "display", googleFont: true, style: "display" },
      { name: "Shrikhand", category: "display", googleFont: true, style: "display" },
      { name: "Yeseva One", category: "display", googleFont: true, style: "display" },
      { name: "Rampart One", category: "display", googleFont: true, style: "display" },
      
      // === SCRIPT/HANDWRITING FONTS (10+) ===
      { name: "Dancing Script", category: "script", googleFont: true, style: "script" },
      { name: "Pacifico", category: "script", googleFont: true, style: "script" },
      { name: "Great Vibes", category: "script", googleFont: true, style: "script" },
      { name: "Sacramento", category: "script", googleFont: true, style: "script" },
      { name: "Satisfy", category: "script", googleFont: true, style: "script" },
      { name: "Lobster", category: "script", googleFont: true, style: "script" },
      { name: "Allura", category: "script", googleFont: true, style: "script" },
      { name: "Alex Brush", category: "script", googleFont: true, style: "script" },
      { name: "Tangerine", category: "script", googleFont: true, style: "script" },
      { name: "Pinyon Script", category: "script", googleFont: true, style: "script" },
      { name: "Cormorant Upright", category: "script", googleFont: true, style: "elegant" },
      
      // === MONOSPACE FONTS (5+) ===
      { name: "Fira Code", category: "monospace", googleFont: true, style: "code" },
      { name: "JetBrains Mono", category: "monospace", googleFont: true, style: "code" },
      { name: "Source Code Pro", category: "monospace", googleFont: true, style: "code" },
      { name: "IBM Plex Mono", category: "monospace", googleFont: true, style: "code" },
      { name: "Space Mono", category: "monospace", googleFont: true, style: "code" },
      { name: "Inconsolata", category: "monospace", googleFont: true, style: "code" },
    ];
  }),
});

// Content Text Styles Router for per-field formatting
export const contentTextStylesRouter = router({
  // Get text style for a content item
  get: adminProcedure
    .input(z.object({ contentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const styles = await db
        .select()
        .from(schema.contentTextStyles)
        .where(eq(schema.contentTextStyles.contentId, input.contentId))
        .limit(1);
      
      const style = styles[0];
      return {
        isBold: style ? style.isBold === 1 : false,
        isItalic: style ? style.isItalic === 1 : false,
        isUnderline: style ? style.isUnderline === 1 : false,
        fontOverride: style?.fontOverride || null,
        fontSize: style?.fontSize || null,
        fontColor: style?.fontColor || null,
      };
    }),

  // Get all text styles for a page
  getByPage: adminProcedure
    .input(z.object({ page: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      // Get content IDs for this page
      const pageContent = await db
        .select({ id: schema.siteContent.id })
        .from(schema.siteContent)
        .where(eq(schema.siteContent.page, input.page));
      
      const contentIds = pageContent.map(c => c.id);
      if (contentIds.length === 0) return [];
      
      // Get styles for these content items
      const styles = await db
        .select()
        .from(schema.contentTextStyles);
      
      return styles.filter(s => contentIds.includes(s.contentId));
    }),

  // Save text style (used by TextFormatToolbar)
  save: adminProcedure
    .input(z.object({
      contentId: z.number(),
      isBold: z.boolean(),
      isItalic: z.boolean(),
      isUnderline: z.boolean(),
      fontSize: z.string().optional(),
      fontColor: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const { contentId, isBold, isItalic, isUnderline, fontSize, fontColor } = input;
      
      // Check if style exists
      const existing = await db
        .select()
        .from(schema.contentTextStyles)
        .where(eq(schema.contentTextStyles.contentId, contentId))
        .limit(1);
      
      if (existing.length === 0) {
        // Insert new style
        await db.insert(schema.contentTextStyles).values({
          contentId,
          isBold: isBold ? 1 : 0,
          isItalic: isItalic ? 1 : 0,
          isUnderline: isUnderline ? 1 : 0,
          fontSize: fontSize || null,
          fontColor: fontColor || null,
        });
      } else {
        // Update existing style
        await db
          .update(schema.contentTextStyles)
          .set({
            isBold: isBold ? 1 : 0,
            isItalic: isItalic ? 1 : 0,
            isUnderline: isUnderline ? 1 : 0,
            fontSize: fontSize || null,
            fontColor: fontColor || null,
          })
          .where(eq(schema.contentTextStyles.contentId, contentId));
      }
      
      return { success: true };
    }),

  // Update or create text style
  upsert: adminProcedure
    .input(z.object({
      contentId: z.number(),
      isBold: z.number().optional(),
      isItalic: z.number().optional(),
      isUnderline: z.number().optional(),
      fontOverride: z.string().nullable().optional(),
      fontSize: z.string().nullable().optional(),
      fontColor: z.string().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const { contentId, ...styleData } = input;
      
      // Check if style exists
      const existing = await db
        .select()
        .from(schema.contentTextStyles)
        .where(eq(schema.contentTextStyles.contentId, contentId))
        .limit(1);
      
      if (existing.length === 0) {
        // Insert new style
        await db.insert(schema.contentTextStyles).values({
          contentId,
          isBold: styleData.isBold ?? 0,
          isItalic: styleData.isItalic ?? 0,
          isUnderline: styleData.isUnderline ?? 0,
          fontOverride: styleData.fontOverride ?? null,
          fontSize: styleData.fontSize ?? null,
          fontColor: styleData.fontColor ?? null,
        });
      } else {
        // Update existing style
        const filteredData = Object.fromEntries(
          Object.entries(styleData).filter(([_, v]) => v !== undefined)
        );
        
        if (Object.keys(filteredData).length > 0) {
          await db
            .update(schema.contentTextStyles)
            .set(filteredData)
            .where(eq(schema.contentTextStyles.contentId, contentId));
        }
      }
      
      return { success: true };
    }),
});

// AI Training Router for managing knowledge base
export const aiTrainingRouter = router({
  listKnowledge: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const knowledge = await db
      .select()
      .from(schema.aiKnowledgeBase)
      .orderBy(desc(schema.aiKnowledgeBase.priority), desc(schema.aiKnowledgeBase.usageCount));
    
    return knowledge;
  }),

  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { totalKnowledge: 0, activeKnowledge: 0, totalUsage: 0, avgSatisfaction: 0 };
    
    const knowledge = await db.select().from(schema.aiKnowledgeBase);
    const feedback = await db.select().from(schema.aiFeedback);
    
    const totalKnowledge = knowledge.length;
    const activeKnowledge = knowledge.filter(k => k.isActive === 1).length;
    const totalUsage = knowledge.reduce((sum, k) => sum + k.usageCount, 0);
    
    const positiveFeedback = feedback.filter(f => f.rating === 'positive').length;
    const totalFeedback = feedback.length;
    const avgSatisfaction = totalFeedback > 0 ? Math.round((positiveFeedback / totalFeedback) * 100) : 0;
    
    return { totalKnowledge, activeKnowledge, totalUsage, avgSatisfaction };
  }),

  getRecentConversations: adminProcedure
    .input(z.object({ limit: z.number().optional().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const conversations = await db
        .select()
        .from(schema.aiChatConversations)
        .orderBy(desc(schema.aiChatConversations.createdAt))
        .limit(input.limit);
      
      return conversations;
    }),

  createKnowledge: adminProcedure
    .input(z.object({
      category: z.string(),
      question: z.string(),
      answer: z.string(),
      keywords: z.string().nullable().optional(),
      priority: z.number().optional().default(0),
      isActive: z.number().optional().default(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const result = await db.insert(schema.aiKnowledgeBase).values({
        category: input.category,
        question: input.question,
        answer: input.answer,
        keywords: input.keywords || null,
        priority: input.priority,
        isActive: input.isActive,
        createdBy: ctx.adminUsername || 'admin',
      });
      
      await db.insert(schema.aiTrainingLogs).values({
        action: 'added',
        knowledgeId: Number((result as any).insertId || (result as any)[0]?.insertId || 0),
        details: JSON.stringify({ category: input.category }),
        performedBy: ctx.adminUsername || 'admin',
      });
      
      return { success: true, id: Number((result as any).insertId || (result as any)[0]?.insertId || 0) };
    }),

  updateKnowledge: adminProcedure
    .input(z.object({
      id: z.number(),
      category: z.string().optional(),
      question: z.string().optional(),
      answer: z.string().optional(),
      keywords: z.string().nullable().optional(),
      priority: z.number().optional(),
      isActive: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const { id, ...updateData } = input;
      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined)
      );
      
      if (Object.keys(filteredUpdateData).length > 0) {
        await db
          .update(schema.aiKnowledgeBase)
          .set(filteredUpdateData)
          .where(eq(schema.aiKnowledgeBase.id, id));
      }
      
      await db.insert(schema.aiTrainingLogs).values({
        action: 'updated',
        knowledgeId: id,
        details: JSON.stringify(filteredUpdateData),
        performedBy: ctx.adminUsername || 'admin',
      });
      
      return { success: true };
    }),

  deleteKnowledge: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      await db.delete(schema.aiKnowledgeBase).where(eq(schema.aiKnowledgeBase.id, input.id));
      
      await db.insert(schema.aiTrainingLogs).values({
        action: 'deleted',
        knowledgeId: input.id,
        performedBy: ctx.adminUsername || 'admin',
      });
      
      return { success: true };
    }),
});
