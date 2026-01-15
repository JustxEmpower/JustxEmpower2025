/**
 * Carousel Router - tRPC API
 * 
 * Provides both admin and public endpoints for the universal carousel system.
 * 
 * Admin endpoints: CRUD for carousels and slides
 * Public endpoints: Fetch carousel by slug for display
 * 
 * @version 2.0 - Refactored to use Drizzle ORM
 * @date January 2026
 */

import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { TRPCError } from '@trpc/server';
import { eq, and, sql, desc, asc, isNull, or, lte, gte } from 'drizzle-orm';
import * as schema from '../drizzle/schema';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CarouselTypeEnum = z.enum([
  'hero',
  'featured',
  'testimonial',
  'gallery',
  'card',
  'custom',
]);

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
  aspectRatio: z.string().optional().default('16/9'),
  dark: z.boolean().optional().default(false),
  overlayOpacity: z.number().min(0).max(100).optional().default(50),
}).passthrough();

const CarouselStylingSchema = z.object({
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  accentColor: z.string().optional(),
  containerMaxWidth: z.string().optional(),
  borderRadius: z.string().optional(),
  padding: z.string().optional(),
}).passthrough();

const SlideStylingSchema = z.object({
  overlayOpacity: z.number().min(0).max(100).optional(),
  textAlignment: z.enum(['left', 'center', 'right']).optional(),
  textPosition: z.enum(['center', 'left', 'right', 'bottom-left', 'bottom-right', 'top-left', 'top-right']).optional(),
  backgroundColor: z.string().optional(),
}).passthrough();

// Helper to parse JSON fields safely
function parseJsonField<T>(value: string | T | null | undefined, defaultValue: T): T {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }
  return value as T;
}

// ============================================================================
// CAROUSEL ROUTER
// ============================================================================

export const carouselRouter = router({
  
  // ==========================================================================
  // PUBLIC ENDPOINTS
  // ==========================================================================

  /**
   * Get carousel by slug (public)
   * Used by frontend components to fetch carousel data
   */
  getBySlug: publicProcedure
    .input(z.object({
      slug: z.string(),
      includeHidden: z.boolean().optional().default(false),
    }))
    .query(async ({ input }) => {
      const { slug, includeHidden } = input;
      const db = await getDb();
      if (!db) return null;

      // Get carousel
      const carouselRows = await db
        .select()
        .from(schema.carousels)
        .where(and(
          eq(schema.carousels.slug, slug),
          eq(schema.carousels.active, 1)
        ))
        .limit(1);

      const carousel = carouselRows[0];
      if (!carousel) {
        return null;
      }

      // Get slides with visibility filter
      const now = new Date();
      let slideRows;
      
      if (includeHidden) {
        slideRows = await db
          .select()
          .from(schema.carouselSlides)
          .where(eq(schema.carouselSlides.carouselId, carousel.id))
          .orderBy(asc(schema.carouselSlides.sortOrder));
      } else {
        slideRows = await db
          .select()
          .from(schema.carouselSlides)
          .where(and(
            eq(schema.carouselSlides.carouselId, carousel.id),
            eq(schema.carouselSlides.visible, 1),
            or(isNull(schema.carouselSlides.startDate), lte(schema.carouselSlides.startDate, now)),
            or(isNull(schema.carouselSlides.endDate), gte(schema.carouselSlides.endDate, now))
          ))
          .orderBy(asc(schema.carouselSlides.sortOrder));
      }

      // Parse JSON fields
      const settings = parseJsonField(carousel.settings, {});
      const styling = parseJsonField(carousel.styling, {});

      const slides = slideRows.map(slide => ({
        ...slide,
        styling: parseJsonField(slide.styling, {}),
      }));

      return {
        id: carousel.id,
        name: carousel.name,
        slug: carousel.slug,
        type: carousel.type,
        settings,
        styling,
        slides,
      };
    }),

  /**
   * Get all active carousels (public)
   * Used to list available carousels
   */
  listPublic: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];

      const rows = await db
        .select({
          id: schema.carousels.id,
          name: schema.carousels.name,
          slug: schema.carousels.slug,
          type: schema.carousels.type,
          description: schema.carousels.description,
        })
        .from(schema.carousels)
        .where(eq(schema.carousels.active, 1))
        .orderBy(asc(schema.carousels.name));

      return rows;
    }),

  // ==========================================================================
  // ADMIN ENDPOINTS - CAROUSELS
  // ==========================================================================

  /**
   * List all carousels (admin)
   */
  list: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];

      const rows = await db
        .select({
          id: schema.carousels.id,
          name: schema.carousels.name,
          slug: schema.carousels.slug,
          description: schema.carousels.description,
          type: schema.carousels.type,
          settings: schema.carousels.settings,
          styling: schema.carousels.styling,
          active: schema.carousels.active,
          createdAt: schema.carousels.createdAt,
          updatedAt: schema.carousels.updatedAt,
          slideCount: sql<number>`(SELECT COUNT(*) FROM carousel_slides WHERE carousel_id = ${schema.carousels.id})`,
        })
        .from(schema.carousels)
        .orderBy(asc(schema.carousels.name));

      return rows.map(row => ({
        ...row,
        settings: parseJsonField(row.settings, {}),
        styling: parseJsonField(row.styling, {}),
      }));
    }),

  /**
   * Get single carousel with slides (admin)
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const carouselRows = await db
        .select()
        .from(schema.carousels)
        .where(eq(schema.carousels.id, input.id))
        .limit(1);

      const carousel = carouselRows[0];
      if (!carousel) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Carousel not found' });
      }

      const slideRows = await db
        .select()
        .from(schema.carouselSlides)
        .where(eq(schema.carouselSlides.carouselId, input.id))
        .orderBy(asc(schema.carouselSlides.sortOrder));

      return {
        ...carousel,
        settings: parseJsonField(carousel.settings, {}),
        styling: parseJsonField(carousel.styling, {}),
        slides: slideRows.map(s => ({
          ...s,
          styling: parseJsonField(s.styling, {}),
        })),
      };
    }),

  /**
   * Create new carousel
   */
  create: protectedProcedure
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
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const { name, slug, description, type, settings, styling, active } = input;

      // Check for duplicate slug
      const existing = await db
        .select({ id: schema.carousels.id })
        .from(schema.carousels)
        .where(eq(schema.carousels.slug, slug))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({ 
          code: 'CONFLICT', 
          message: 'A carousel with this slug already exists' 
        });
      }

      const result = await db.insert(schema.carousels).values({
        name,
        slug,
        description: description || null,
        type,
        settings: JSON.stringify(settings || {}),
        styling: JSON.stringify(styling || {}),
        active: active ? 1 : 0,
      });

      const insertId = Number(result[0].insertId);
      return { id: insertId, slug };
    }),

  /**
   * Update carousel
   */
  update: protectedProcedure
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
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const { id, ...updates } = input;

      // Check if carousel exists
      const existing = await db
        .select({ id: schema.carousels.id })
        .from(schema.carousels)
        .where(eq(schema.carousels.id, id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Carousel not found' });
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
          throw new TRPCError({ 
            code: 'CONFLICT', 
            message: 'A carousel with this slug already exists' 
          });
        }
      }

      // Build update object
      const updateData: Partial<schema.InsertCarousel> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.slug !== undefined) updateData.slug = updates.slug;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.settings !== undefined) updateData.settings = JSON.stringify(updates.settings);
      if (updates.styling !== undefined) updateData.styling = JSON.stringify(updates.styling);
      if (updates.active !== undefined) updateData.active = updates.active ? 1 : 0;

      if (Object.keys(updateData).length > 0) {
        await db.update(schema.carousels)
          .set(updateData)
          .where(eq(schema.carousels.id, id));
      }

      return { success: true };
    }),

  /**
   * Delete carousel and all its slides
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Delete slides first
      await db.delete(schema.carouselSlides)
        .where(eq(schema.carouselSlides.carouselId, input.id));

      // Delete carousel
      await db.delete(schema.carousels)
        .where(eq(schema.carousels.id, input.id));

      return { success: true };
    }),

  /**
   * Duplicate carousel with all slides
   */
  duplicate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Get original carousel
      const originalRows = await db
        .select()
        .from(schema.carousels)
        .where(eq(schema.carousels.id, input.id))
        .limit(1);

      const original = originalRows[0];
      if (!original) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Carousel not found' });
      }

      // Generate unique slug
      let newSlug = `${original.slug}-copy`;
      let counter = 1;
      let slugExists = true;

      while (slugExists) {
        const existing = await db
          .select({ id: schema.carousels.id })
          .from(schema.carousels)
          .where(eq(schema.carousels.slug, newSlug))
          .limit(1);

        if (existing.length === 0) {
          slugExists = false;
        } else {
          counter++;
          newSlug = `${original.slug}-copy-${counter}`;
        }
      }

      // Create new carousel
      const result = await db.insert(schema.carousels).values({
        name: `${original.name} (Copy)`,
        slug: newSlug,
        description: original.description,
        type: original.type,
        settings: original.settings,
        styling: original.styling,
        active: 0, // Start as inactive
      });

      const newCarouselId = Number(result[0].insertId);

      // Copy slides
      const slides = await db
        .select()
        .from(schema.carouselSlides)
        .where(eq(schema.carouselSlides.carouselId, input.id))
        .orderBy(asc(schema.carouselSlides.sortOrder));

      for (const slide of slides) {
        await db.insert(schema.carouselSlides).values({
          carouselId: newCarouselId,
          title: slide.title,
          subtitle: slide.subtitle,
          description: slide.description,
          imageUrl: slide.imageUrl,
          videoUrl: slide.videoUrl,
          thumbnailUrl: slide.thumbnailUrl,
          altText: slide.altText,
          ctaText: slide.ctaText,
          ctaLink: slide.ctaLink,
          ctaStyle: slide.ctaStyle,
          authorName: slide.authorName,
          authorRole: slide.authorRole,
          authorAvatar: slide.authorAvatar,
          rating: slide.rating,
          styling: slide.styling,
          visible: slide.visible,
          startDate: slide.startDate,
          endDate: slide.endDate,
          sortOrder: slide.sortOrder,
        });
      }

      return { id: newCarouselId, slug: newSlug };
    }),

  // ==========================================================================
  // ADMIN ENDPOINTS - SLIDES
  // ==========================================================================

  /**
   * Create new slide
   */
  createSlide: protectedProcedure
    .input(z.object({
      carouselId: z.number(),
      title: z.string().max(500).optional(),
      subtitle: z.string().max(500).optional(),
      description: z.string().optional(),
      imageUrl: z.string().max(1000).optional(),
      videoUrl: z.string().max(1000).optional(),
      thumbnailUrl: z.string().max(1000).optional(),
      altText: z.string().max(500).optional(),
      ctaText: z.string().max(255).optional(),
      ctaLink: z.string().max(1000).optional(),
      ctaStyle: z.enum(['primary', 'secondary', 'ghost', 'outline']).optional(),
      authorName: z.string().max(255).optional(),
      authorRole: z.string().max(255).optional(),
      authorAvatar: z.string().max(1000).optional(),
      rating: z.number().min(1).max(5).optional(),
      styling: SlideStylingSchema.optional(),
      visible: z.boolean().optional().default(true),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Check carousel exists
      const carouselExists = await db
        .select({ id: schema.carousels.id })
        .from(schema.carousels)
        .where(eq(schema.carousels.id, input.carouselId))
        .limit(1);

      if (carouselExists.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Carousel not found' });
      }

      // Get max sort order
      const maxOrderResult = await db
        .select({ maxOrder: sql<number>`COALESCE(MAX(sort_order), -1)` })
        .from(schema.carouselSlides)
        .where(eq(schema.carouselSlides.carouselId, input.carouselId));

      const nextOrder = (maxOrderResult[0]?.maxOrder ?? -1) + 1;

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
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        sortOrder: nextOrder,
      });

      return { id: Number(result[0].insertId) };
    }),

  /**
   * Update slide
   */
  updateSlide: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().max(500).optional().nullable(),
      subtitle: z.string().max(500).optional().nullable(),
      description: z.string().optional().nullable(),
      imageUrl: z.string().max(1000).optional().nullable(),
      videoUrl: z.string().max(1000).optional().nullable(),
      thumbnailUrl: z.string().max(1000).optional().nullable(),
      altText: z.string().max(500).optional().nullable(),
      ctaText: z.string().max(255).optional().nullable(),
      ctaLink: z.string().max(1000).optional().nullable(),
      ctaStyle: z.enum(['primary', 'secondary', 'ghost', 'outline']).optional(),
      authorName: z.string().max(255).optional().nullable(),
      authorRole: z.string().max(255).optional().nullable(),
      authorAvatar: z.string().max(1000).optional().nullable(),
      rating: z.number().min(1).max(5).optional().nullable(),
      styling: SlideStylingSchema.optional(),
      visible: z.boolean().optional(),
      startDate: z.string().optional().nullable(),
      endDate: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const { id, ...updates } = input;

      // Check slide exists
      const existing = await db
        .select({ id: schema.carouselSlides.id })
        .from(schema.carouselSlides)
        .where(eq(schema.carouselSlides.id, id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Slide not found' });
      }

      // Build update object
      const updateData: Partial<schema.InsertCarouselSlide> = {};
      
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
      if (updates.startDate !== undefined) updateData.startDate = updates.startDate ? new Date(updates.startDate) : null;
      if (updates.endDate !== undefined) updateData.endDate = updates.endDate ? new Date(updates.endDate) : null;

      if (Object.keys(updateData).length > 0) {
        await db.update(schema.carouselSlides)
          .set(updateData)
          .where(eq(schema.carouselSlides.id, id));
      }

      return { success: true };
    }),

  /**
   * Delete slide
   */
  deleteSlide: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      await db.delete(schema.carouselSlides)
        .where(eq(schema.carouselSlides.id, input.id));

      return { success: true };
    }),

  /**
   * Reorder slides
   */
  reorderSlides: protectedProcedure
    .input(z.object({
      carouselId: z.number(),
      slideIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Update sort order for each slide
      for (let i = 0; i < input.slideIds.length; i++) {
        await db.update(schema.carouselSlides)
          .set({ sortOrder: i })
          .where(and(
            eq(schema.carouselSlides.id, input.slideIds[i]),
            eq(schema.carouselSlides.carouselId, input.carouselId)
          ));
      }

      return { success: true };
    }),

  /**
   * Toggle slide visibility
   */
  toggleSlideVisibility: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Get current visibility
      const slide = await db
        .select({ visible: schema.carouselSlides.visible })
        .from(schema.carouselSlides)
        .where(eq(schema.carouselSlides.id, input.id))
        .limit(1);

      if (slide.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Slide not found' });
      }

      const newVisibility = slide[0].visible === 1 ? 0 : 1;

      await db.update(schema.carouselSlides)
        .set({ visible: newVisibility })
        .where(eq(schema.carouselSlides.id, input.id));

      return { visible: newVisibility === 1 };
    }),
});
