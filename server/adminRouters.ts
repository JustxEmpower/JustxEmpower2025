import { z } from "zod";
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
} from "./adminDb";
import { storagePut } from "./storage";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateColorPalette, suggestFontPairings } from "./aiService";

// Admin session management (simple in-memory for now)
const adminSessions = new Map<string, { username: string; expiresAt: number }>();

function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function createAdminSession(username: string): string {
  const token = generateSessionToken();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  adminSessions.set(token, { username, expiresAt });
  return token;
}

function validateAdminSession(token: string): string | null {
  const session = adminSessions.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    adminSessions.delete(token);
    return null;
  }
  return session.username;
}

function deleteAdminSession(token: string) {
  adminSessions.delete(token);
}

// Admin authentication middleware
const adminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const token = ctx.req.headers["x-admin-token"] as string;
  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin token required" });
  }
  
  const username = validateAdminSession(token);
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
      
      const token = createAdminSession(admin.username);
      
      return {
        success: true,
        token,
        username: admin.username,
      };
    }),
  
  logout: adminProcedure
    .mutation(({ ctx }) => {
      const token = ctx.req.headers["x-admin-token"] as string;
      deleteAdminSession(token);
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
});
