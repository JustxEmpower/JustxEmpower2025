import { z } from "zod";
import { generateArticleContent, generateMetaDescription, generateImageAltText, generateContentSuggestions, generateBulkAltText } from "./aiService";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getAdminByUsername,
  verifyPassword,
  updateAdminPassword,
  updateAdminUsername,
  getAllArticles,
  getPublishedArticles,
  getArticleBySlug,
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
  reorderPages,
  getPageBlocks,
  createPageBlock,
  updatePageBlock,
  deletePageBlock,
  reorderPageBlocks,
} from "./adminDb";
import { storagePut } from "./storage";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, and, sql, desc, lt, gte, isNotNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateColorPalette, suggestFontPairings } from "./aiService";

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
  // Dashboard Statistics
  dashboard: router({
    stats: adminProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const [pages, articles, media, submissions, users] = await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(schema.pages),
          db.select({ count: sql<number>`count(*)` }).from(schema.articles),
          db.select({ count: sql<number>`count(*)` }).from(schema.media),
          db.select({ count: sql<number>`count(*)` }).from(schema.formSubmissions),
          db.select({ count: sql<number>`count(*)` }).from(schema.adminUsers),
        ]);
        
        const unreadSubmissions = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.formSubmissions)
          .where(eq(schema.formSubmissions.isRead, 0));
        
        return {
          totalPages: pages[0]?.count || 0,
          totalArticles: articles[0]?.count || 0,
          totalMedia: media[0]?.count || 0,
          totalFormSubmissions: submissions[0]?.count || 0,
          unreadSubmissions: unreadSubmissions[0]?.count || 0,
          totalUsers: users[0]?.count || 0,
        };
      }),

    recentActivity: adminProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Get recent pages
        const recentPages = await db
          .select({
            title: schema.pages.title,
            createdAt: schema.pages.createdAt,
            type: sql<string>`'page'`,
          })
          .from(schema.pages)
          .orderBy(desc(schema.pages.createdAt))
          .limit(5);
        
        // Get recent articles
        const recentArticles = await db
          .select({
            title: schema.articles.title,
            createdAt: schema.articles.createdAt,
            type: sql<string>`'article'`,
          })
          .from(schema.articles)
          .orderBy(desc(schema.articles.createdAt))
          .limit(5);
        
        // Combine and sort
        const activities = [...recentPages, ...recentArticles]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10)
          .map(item => ({
            description: `${item.type === 'page' ? 'Page' : 'Article'} "${item.title}" was ${item.type === 'page' ? 'created' : 'published'}`,
            timestamp: new Date(item.createdAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
          }));
        
        return activities;
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
        const results = await generateBulkAltText(input.imageUrls);
        return { results };
      }),
  }),

  // Get current admin settings
  getSettings: adminProcedure.query(async ({ ctx }) => {
    const admin = await getAdminByUsername(ctx.adminUsername);
    if (!admin) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Admin user not found" });
    }
    return {
      username: admin.username,
      mailchimpApiKey: admin.mailchimpApiKey || '',
      mailchimpAudienceId: admin.mailchimpAudienceId || '',
    };
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
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateArticle(id, data);
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
        return await getAllMedia();
      }),
    
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
        })
      )
      .mutation(async ({ input }) => {
        return await createPage(input);
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
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updatePage(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deletePage(input.id);
      }),

    reorder: adminProcedure
      .input(
        z.object({
          pageOrders: z.array(
            z.object({
              id: z.number(),
              navOrder: z.number(),
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
            type: z.enum(["text", "image", "video", "quote", "cta", "spacer"]),
            content: z.string(),
            order: z.number(),
            settings: z.string().optional(),
            visibility: z.string().optional(),
            animation: z.string().optional(),
          })
        )
        .mutation(async ({ input }) => {
          return await createPageBlock(input);
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
          return await updatePageBlock(id, data);
        }),

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          return await deletePageBlock(input.id);
        }),

      reorder: adminProcedure
        .input(
          z.object({
            blocks: z.array(
              z.object({
                id: z.number(),
                order: z.number(),
              })
            ),
          })
        )
        .mutation(async ({ input }) => {
          return await reorderPageBlocks(input.blocks);
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
        assetType: z.enum(["logo_header", "logo_footer", "logo_mobile", "favicon", "og_image", "twitter_image"]),
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
        assetType: z.enum(["logo_header", "logo_footer", "logo_mobile", "favicon", "og_image", "twitter_image"]),
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
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        await db.insert(schema.navigation).values(input);
        return { success: true };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        label: z.string().optional(),
        url: z.string().optional(),
        isExternal: z.number().optional(),
        openInNewTab: z.number().optional(),
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

  // Site Settings Management
  siteSettings: router({    get: adminProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const settings = await db
          .select()
          .from(schema.siteSettings);
        
        return settings;
      }),

    update: adminProcedure
      .input(z.object({
        settingKey: z.string(),
        settingValue: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Check if setting exists
        const existing = await db
          .select()
          .from(schema.siteSettings)
          .where(eq(schema.siteSettings.settingKey, input.settingKey))
          .limit(1);
        
        if (existing.length > 0) {
          // Update existing
          await db
            .update(schema.siteSettings)
            .set({ settingValue: input.settingValue })
            .where(eq(schema.siteSettings.settingKey, input.settingKey));
        } else {
          // Insert new
          await db.insert(schema.siteSettings).values(input);
        }
        
        return { success: true };
      }),
  }),

  // Backup & Restore Management
  backups: router({
    list: adminProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const backups = await db
          .select()
          .from(schema.backups)
          .orderBy(desc(schema.backups.createdAt));
        
        return backups;
      }),

    create: adminProcedure
      .input(z.object({ backupName: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Export all tables to JSON
        const tables = [
          'articles', 'pages', 'pageBlocks', 'siteContent', 'media',
          'themeSettings', 'navigation', 'seoSettings', 'brandAssets',
          'formFields', 'formSubmissions', 'redirects', 'siteSettings',
          'blockTemplates', 'users', 'aiSettings'
        ];
        
        const backupData: any = {};
        for (const table of tables) {
          try {
            const data = await db.select().from((schema as any)[table]);
            backupData[table] = data;
          } catch (error) {
            console.error(`Error backing up table ${table}:`, error);
          }
        }
        
        const backupJson = JSON.stringify(backupData);
        const fileSize = Buffer.byteLength(backupJson, 'utf8');
        
        await db.insert(schema.backups).values({
          backupName: input.backupName,
          backupType: 'manual',
          backupData: backupJson,
          fileSize,
        });
        
        return { success: true };
      }),

    download: adminProcedure
      .input(z.object({ backupId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const backup = await db
          .select()
          .from(schema.backups)
          .where(eq(schema.backups.id, input.backupId))
          .limit(1);
        
        if (!backup || backup.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Backup not found" });
        }
        
        return { backupData: backup[0].backupData };
      }),

    restore: adminProcedure
      .input(z.object({ backupId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const backup = await db
          .select()
          .from(schema.backups)
          .where(eq(schema.backups.id, input.backupId))
          .limit(1);
        
        if (!backup || backup.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Backup not found" });
        }
        
        const backupData = JSON.parse(backup[0].backupData);
        
        // Restore tables (skip sensitive tables like adminUsers, adminSessions)
        const tablesToRestore = [
          'articles', 'pages', 'pageBlocks', 'siteContent', 'media',
          'themeSettings', 'navigation', 'seoSettings', 'brandAssets',
          'formFields', 'formSubmissions', 'redirects', 'siteSettings',
          'blockTemplates'
        ];
        
        for (const table of tablesToRestore) {
          if (backupData[table] && Array.isArray(backupData[table])) {
            try {
              // Delete existing data
              await db.delete((schema as any)[table]);
              
              // Insert backup data
              if (backupData[table].length > 0) {
                await db.insert((schema as any)[table]).values(backupData[table]);
              }
            } catch (error) {
              console.error(`Error restoring table ${table}:`, error);
            }
          }
        }
        
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ backupId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        await db
          .delete(schema.backups)
          .where(eq(schema.backups.id, input.backupId));
        
        return { success: true };
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
});


// Public pages router
export const publicPagesRouter = router({
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
      .select()
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
