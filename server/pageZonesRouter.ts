import { z } from 'zod';
import { router, publicProcedure } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import { getDb } from './db';
import * as schema from '../drizzle/schema';
import { eq, and, lt } from 'drizzle-orm';

// Admin authentication middleware (matches adminRouters.ts pattern)
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
    await db.delete(schema.adminSessions).where(eq(schema.adminSessions.token, token));
    return null;
  }
  
  return session.username;
}

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

/**
 * Page Zones Router
 * Manages Page Builder blocks injected into existing React pages
 */
export const pageZonesRouter = router({
  /**
   * Get a specific zone's blocks (public - for rendering)
   */
  getZone: publicProcedure
    .input(z.object({
      pageSlug: z.string(),
      zoneName: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const results = await db
        .select()
        .from(schema.pageZones)
        .where(
          and(
            eq(schema.pageZones.pageSlug, input.pageSlug),
            eq(schema.pageZones.zoneName, input.zoneName)
          )
        )
        .limit(1);

      return results[0] || null;
    }),

  /**
   * Get all zones for a page (admin)
   */
  getPageZones: adminProcedure
    .input(z.object({
      pageSlug: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(schema.pageZones)
        .where(eq(schema.pageZones.pageSlug, input.pageSlug));
    }),

  /**
   * Get all zones across all pages (admin)
   */
  getAllZones: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    return db.select().from(schema.pageZones);
  }),

  /**
   * Create or update a zone
   */
  upsertZone: adminProcedure
    .input(z.object({
      pageSlug: z.string(),
      zoneName: z.string(),
      blocks: z.string(), // JSON string of blocks array
      isActive: z.boolean().optional().default(true),
    }))
    .mutation(async ({ input }) => {
      console.log('[pageZonesRouter] upsertZone called:', { pageSlug: input.pageSlug, zoneName: input.zoneName, blocksLength: input.blocks?.length });
      const db = await getDb();
      if (!db) {
        console.error('[pageZonesRouter] Database not available');
        throw new Error('Database not available');
      }

      // Check if zone exists
      const existing = await db
        .select()
        .from(schema.pageZones)
        .where(
          and(
            eq(schema.pageZones.pageSlug, input.pageSlug),
            eq(schema.pageZones.zoneName, input.zoneName)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing zone
        await db
          .update(schema.pageZones)
          .set({
            blocks: input.blocks,
            isActive: input.isActive ? 1 : 0,
          })
          .where(eq(schema.pageZones.id, existing[0].id));

        return { ...existing[0], blocks: input.blocks, isActive: input.isActive ? 1 : 0 };
      } else {
        // Create new zone
        const result = await db.insert(schema.pageZones).values({
          pageSlug: input.pageSlug,
          zoneName: input.zoneName,
          blocks: input.blocks,
          isActive: input.isActive ? 1 : 0,
        });

        return {
          id: Number((result as any).insertId || (result as any)[0]?.insertId || 0),
          pageSlug: input.pageSlug,
          zoneName: input.zoneName,
          blocks: input.blocks,
          isActive: input.isActive ? 1 : 0,
        };
      }
    }),

  /**
   * Delete a zone
   */
  deleteZone: adminProcedure
    .input(z.object({
      pageSlug: z.string(),
      zoneName: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db
        .delete(schema.pageZones)
        .where(
          and(
            eq(schema.pageZones.pageSlug, input.pageSlug),
            eq(schema.pageZones.zoneName, input.zoneName)
          )
        );

      return { success: true };
    }),

  /**
   * Toggle zone active status
   */
  toggleZoneActive: adminProcedure
    .input(z.object({
      pageSlug: z.string(),
      zoneName: z.string(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db
        .update(schema.pageZones)
        .set({ isActive: input.isActive ? 1 : 0 })
        .where(
          and(
            eq(schema.pageZones.pageSlug, input.pageSlug),
            eq(schema.pageZones.zoneName, input.zoneName)
          )
        );

      return { success: true };
    }),

  /**
   * Get list of available pages for zone editing
   */
  getAvailablePages: adminProcedure.query(async () => {
    // These are the existing React pages that can have zones
    return [
      { slug: 'home', name: 'Home', zones: ['after-hero', 'after-carousel', 'before-community', 'after-community', 'before-footer'] },
      { slug: 'about', name: 'About', zones: ['after-hero', 'before-content', 'after-content', 'before-footer'] },
      { slug: 'philosophy', name: 'Philosophy', zones: ['after-hero', 'after-pillars', 'before-footer'] },
      { slug: 'community', name: 'Community', zones: ['after-hero', 'after-features', 'before-footer'] },
      { slug: 'offerings', name: 'Offerings', zones: ['after-hero', 'after-grid', 'before-footer'] },
      { slug: 'events', name: 'Events', zones: ['after-hero', 'after-calendar', 'before-footer'] },
      { slug: 'contact', name: 'Contact', zones: ['after-hero', 'after-form', 'before-footer'] },
      { slug: 'blog', name: 'Blog', zones: ['after-hero', 'after-articles', 'sidebar', 'before-footer'] },
    ];
  }),
});

export type PageZonesRouter = typeof pageZonesRouter;
