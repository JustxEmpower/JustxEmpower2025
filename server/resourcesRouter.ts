import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, desc, and, sql, asc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";

// Admin session validation (reuse from adminRouters)
async function validateAdminSession(token: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  
  const [session] = await db
    .select()
    .from(schema.adminSessions)
    .where(eq(schema.adminSessions.token, token))
    .limit(1);
  
  if (!session) return null;
  
  if (session.expiresAt < new Date()) {
    await db.delete(schema.adminSessions).where(eq(schema.adminSessions.token, token));
    return null;
  }
  
  return session.username;
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

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

// Admin Resources Router
export const adminResourcesRouter = router({
  // Resource Categories
  categories: router({
    list: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const categories = await db
        .select()
        .from(schema.resourceCategories)
        .orderBy(asc(schema.resourceCategories.order));
      
      return categories;
    }),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        icon: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const slug = generateSlug(input.name);
        
        // Check for duplicate slug
        const existing = await db
          .select()
          .from(schema.resourceCategories)
          .where(eq(schema.resourceCategories.slug, slug))
          .limit(1);
        
        if (existing.length > 0) {
          throw new TRPCError({ code: "CONFLICT", message: "Category with this name already exists" });
        }
        
        // Get max order
        const [maxOrder] = await db
          .select({ max: sql<number>`MAX(\`order\`)` })
          .from(schema.resourceCategories);
        
        const result = await db.insert(schema.resourceCategories).values({
          name: input.name,
          slug,
          description: input.description,
          icon: input.icon,
          order: (maxOrder?.max || 0) + 1,
        });
        
        return { success: true, id: result[0].insertId };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
        isActive: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        const { id, ...data } = input;
        
        // If name is changing, update slug too
        if (data.name) {
          (data as any).slug = generateSlug(data.name);
        }
        
        await db
          .update(schema.resourceCategories)
          .set(data)
          .where(eq(schema.resourceCategories.id, id));
        
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        // Check if category has resources
        const resources = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(schema.resources)
          .where(eq(schema.resources.categoryId, input.id));
        
        if (resources[0]?.count > 0) {
          throw new TRPCError({ 
            code: "PRECONDITION_FAILED", 
            message: "Cannot delete category with resources. Move or delete resources first." 
          });
        }
        
        await db
          .delete(schema.resourceCategories)
          .where(eq(schema.resourceCategories.id, input.id));
        
        return { success: true };
      }),

    reorder: adminProcedure
      .input(z.object({
        orderedIds: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        
        for (let i = 0; i < input.orderedIds.length; i++) {
          await db
            .update(schema.resourceCategories)
            .set({ order: i })
            .where(eq(schema.resourceCategories.id, input.orderedIds[i]));
        }
        
        return { success: true };
      }),
  }),

  // Resources
  list: adminProcedure
    .input(z.object({
      categoryId: z.number().optional(),
      status: z.enum(['draft', 'published', 'archived']).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      let query = db
        .select({
          resource: schema.resources,
          categoryName: schema.resourceCategories.name,
        })
        .from(schema.resources)
        .leftJoin(schema.resourceCategories, eq(schema.resources.categoryId, schema.resourceCategories.id))
        .orderBy(desc(schema.resources.createdAt));
      
      const conditions = [];
      if (input?.categoryId) {
        conditions.push(eq(schema.resources.categoryId, input.categoryId));
      }
      if (input?.status) {
        conditions.push(eq(schema.resources.status, input.status));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      const results = await query;
      
      return results.map(r => ({
        ...r.resource,
        categoryName: r.categoryName,
        formattedSize: formatFileSize(r.resource.fileSize),
      }));
    }),

  get: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const [resource] = await db
        .select()
        .from(schema.resources)
        .where(eq(schema.resources.id, input.id))
        .limit(1);
      
      if (!resource) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
      }
      
      return {
        ...resource,
        formattedSize: formatFileSize(resource.fileSize),
      };
    }),

  upload: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      categoryId: z.number().optional(),
      fileName: z.string(),
      mimeType: z.string(),
      fileSize: z.number(),
      base64Data: z.string(),
      isPublic: z.number().optional().default(1),
      requiresEmail: z.number().optional().default(0),
      status: z.enum(['draft', 'published', 'archived']).optional().default('published'),
      isFeatured: z.number().optional().default(0),
      // Premium fields
      isPremium: z.number().optional().default(0),
      price: z.number().optional().default(0), // Price in cents
      allowPreview: z.number().optional().default(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Decode base64 data
      const buffer = Buffer.from(input.base64Data, 'base64');
      
      // Generate unique filename and slug
      const ext = input.fileName.split('.').pop() || '';
      const uniqueId = nanoid(10);
      const s3Key = `resources/${uniqueId}-${input.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const slug = generateSlug(input.title) + '-' + uniqueId;
      
      // Upload to S3
      const { url } = await storagePut(s3Key, buffer, input.mimeType);
      
      // Determine file type
      const fileType = ext.toLowerCase();
      
      // Insert into database
      const result = await db.insert(schema.resources).values({
        title: input.title,
        slug,
        description: input.description,
        categoryId: input.categoryId,
        fileUrl: url,
        s3Key,
        fileName: input.fileName,
        fileType,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        isPublic: input.isPublic,
        requiresEmail: input.requiresEmail,
        status: input.status,
        isFeatured: input.isFeatured,
        isPremium: input.isPremium,
        price: input.price,
        allowPreview: input.allowPreview,
        publishedAt: input.status === 'published' ? new Date() : null,
      });
      
      return { 
        success: true, 
        id: result[0].insertId,
        url,
        slug,
      };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      categoryId: z.number().nullable().optional(),
      isPublic: z.number().optional(),
      requiresEmail: z.number().optional(),
      status: z.enum(['draft', 'published', 'archived']).optional(),
      isFeatured: z.number().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      // Premium fields
      isPremium: z.number().optional(),
      price: z.number().optional(),
      allowPreview: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const { id, ...data } = input;
      
      // If status is changing to published, set publishedAt
      if (data.status === 'published') {
        (data as any).publishedAt = new Date();
      }
      
      await db
        .update(schema.resources)
        .set(data)
        .where(eq(schema.resources.id, id));
      
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Note: We're not deleting from S3 for safety
      await db
        .delete(schema.resources)
        .where(eq(schema.resources.id, input.id));
      
      return { success: true };
    }),

  // Analytics
  getDownloadStats: adminProcedure
    .input(z.object({
      resourceId: z.number().optional(),
      days: z.number().optional().default(30),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      
      const conditions = [sql`downloadedAt >= ${startDate}`];
      
      if (input.resourceId) {
        conditions.push(eq(schema.resourceDownloads.resourceId, input.resourceId));
      }
      
      const results = await db
        .select({
          date: sql<string>`DATE(downloadedAt)`.as('date'),
          count: sql<number>`COUNT(*)`.as('count'),
        })
        .from(schema.resourceDownloads)
        .where(and(...conditions))
        .groupBy(sql`DATE(downloadedAt)`)
        .orderBy(sql`DATE(downloadedAt)`);
      
      return results;
    }),

  getTopDownloads: adminProcedure
    .input(z.object({
      limit: z.number().optional().default(10),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const resources = await db
        .select()
        .from(schema.resources)
        .orderBy(desc(schema.resources.downloadCount))
        .limit(input.limit);
      
      return resources;
    }),
});

// Public Resources Router
export const publicResourcesRouter = router({
  // Get all published resources
  list: publicProcedure
    .input(z.object({
      categorySlug: z.string().optional(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      let categoryId: number | undefined;
      
      // If category slug provided, get category ID
      if (input?.categorySlug) {
        const [category] = await db
          .select()
          .from(schema.resourceCategories)
          .where(and(
            eq(schema.resourceCategories.slug, input.categorySlug),
            eq(schema.resourceCategories.isActive, 1)
          ))
          .limit(1);
        
        if (category) {
          categoryId = category.id;
        }
      }
      
      const conditions = [
        eq(schema.resources.status, 'published'),
        eq(schema.resources.isPublic, 1),
      ];
      
      if (categoryId) {
        conditions.push(eq(schema.resources.categoryId, categoryId));
      }
      
      const resources = await db
        .select({
          resource: schema.resources,
          categoryName: schema.resourceCategories.name,
          categorySlug: schema.resourceCategories.slug,
        })
        .from(schema.resources)
        .leftJoin(schema.resourceCategories, eq(schema.resources.categoryId, schema.resourceCategories.id))
        .where(and(...conditions))
        .orderBy(desc(schema.resources.publishedAt))
        .limit(input?.limit || 50)
        .offset(input?.offset || 0);
      
      return resources.map(r => ({
        id: r.resource.id,
        title: r.resource.title,
        slug: r.resource.slug,
        description: r.resource.description,
        fileType: r.resource.fileType,
        fileSize: r.resource.fileSize,
        formattedSize: formatFileSize(r.resource.fileSize),
        downloadCount: r.resource.downloadCount,
        isFeatured: r.resource.isFeatured,
        publishedAt: r.resource.publishedAt,
        categoryName: r.categoryName,
        categorySlug: r.categorySlug,
        requiresEmail: r.resource.requiresEmail,
        // Premium fields
        isPremium: r.resource.isPremium,
        price: r.resource.price,
        allowPreview: r.resource.allowPreview,
        fileUrl: r.resource.fileUrl, // Needed for preview
      }));
    }),

  // Get all active categories
  categories: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const categories = await db
      .select()
      .from(schema.resourceCategories)
      .where(eq(schema.resourceCategories.isActive, 1))
      .orderBy(asc(schema.resourceCategories.order));
    
    // Get resource count per category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const [count] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(schema.resources)
          .where(and(
            eq(schema.resources.categoryId, cat.id),
            eq(schema.resources.status, 'published'),
            eq(schema.resources.isPublic, 1)
          ));
        
        return {
          ...cat,
          resourceCount: count?.count || 0,
        };
      })
    );
    
    return categoriesWithCount;
  }),

  // Get single resource by slug
  get: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const [resource] = await db
        .select({
          resource: schema.resources,
          categoryName: schema.resourceCategories.name,
          categorySlug: schema.resourceCategories.slug,
        })
        .from(schema.resources)
        .leftJoin(schema.resourceCategories, eq(schema.resources.categoryId, schema.resourceCategories.id))
        .where(and(
          eq(schema.resources.slug, input.slug),
          eq(schema.resources.status, 'published'),
          eq(schema.resources.isPublic, 1)
        ))
        .limit(1);
      
      if (!resource) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
      }
      
      // Increment view count
      await db
        .update(schema.resources)
        .set({ viewCount: sql`viewCount + 1` })
        .where(eq(schema.resources.id, resource.resource.id));
      
      return {
        ...resource.resource,
        formattedSize: formatFileSize(resource.resource.fileSize),
        categoryName: resource.categoryName,
        categorySlug: resource.categorySlug,
      };
    }),

  // Download resource (get download URL and track)
  download: publicProcedure
    .input(z.object({
      id: z.number(),
      email: z.string().optional(),
      visitorId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const [resource] = await db
        .select()
        .from(schema.resources)
        .where(and(
          eq(schema.resources.id, input.id),
          eq(schema.resources.status, 'published'),
          eq(schema.resources.isPublic, 1)
        ))
        .limit(1);
      
      if (!resource) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
      }
      
      // Check if email is required
      if (resource.requiresEmail && !input.email) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Email is required to download this resource" });
      }
      
      // Track download
      await db.insert(schema.resourceDownloads).values({
        resourceId: input.id,
        email: input.email,
        visitorId: input.visitorId,
        ipAddress: ctx.req.headers['x-forwarded-for'] as string || ctx.req.socket?.remoteAddress,
        userAgent: ctx.req.headers['user-agent'],
      });
      
      // Increment download count
      await db
        .update(schema.resources)
        .set({ downloadCount: sql`downloadCount + 1` })
        .where(eq(schema.resources.id, input.id));
      
      return {
        success: true,
        fileUrl: resource.fileUrl,
        fileName: resource.fileName,
      };
    }),

  // Get featured resources
  featured: publicProcedure
    .input(z.object({
      limit: z.number().optional().default(5),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const resources = await db
        .select({
          resource: schema.resources,
          categoryName: schema.resourceCategories.name,
        })
        .from(schema.resources)
        .leftJoin(schema.resourceCategories, eq(schema.resources.categoryId, schema.resourceCategories.id))
        .where(and(
          eq(schema.resources.status, 'published'),
          eq(schema.resources.isPublic, 1),
          eq(schema.resources.isFeatured, 1)
        ))
        .orderBy(desc(schema.resources.publishedAt))
        .limit(input?.limit || 5);
      
      return resources.map(r => ({
        id: r.resource.id,
        title: r.resource.title,
        slug: r.resource.slug,
        description: r.resource.description,
        fileType: r.resource.fileType,
        formattedSize: formatFileSize(r.resource.fileSize),
        downloadCount: r.resource.downloadCount,
        categoryName: r.categoryName,
        requiresEmail: r.resource.requiresEmail,
        // Premium fields
        isPremium: r.resource.isPremium,
        price: r.resource.price,
        allowPreview: r.resource.allowPreview,
        fileUrl: r.resource.fileUrl,
      }));
    }),
});


