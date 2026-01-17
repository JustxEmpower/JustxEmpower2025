/**
 * Block Store Router - CRUD operations for custom reusable blocks
 * These blocks are created in Page Builder and can be used in Zone Manager
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { blockStore } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

export const blockStoreRouter = router({
  // Get all public blocks for sidebar display
  getAll: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const conditions = [eq(blockStore.isPublic, 1)];
      
      if (input?.category && input.category !== 'all') {
        conditions.push(eq(blockStore.category, input.category));
      }
      
      const blocks = await db
        .select()
        .from(blockStore)
        .where(and(...conditions))
        .orderBy(desc(blockStore.usageCount), desc(blockStore.createdAt));
      
      return blocks;
    }),

  // Get single block by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const [block] = await db
        .select()
        .from(blockStore)
        .where(eq(blockStore.id, input.id))
        .limit(1);
      
      return block || null;
    }),

  // Create a new custom block
  create: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      category: z.string().default("custom"),
      icon: z.string().default("box"),
      blockType: z.string(),
      content: z.string(), // JSON string
      thumbnail: z.string().optional(),
      tags: z.string().optional(), // JSON array as string
      createdBy: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(blockStore).values({
        name: input.name,
        description: input.description || null,
        category: input.category,
        icon: input.icon,
        blockType: input.blockType,
        content: input.content,
        thumbnail: input.thumbnail || null,
        tags: input.tags || null,
        createdBy: input.createdBy || null,
        isPublic: 1,
        usageCount: 0,
      });
      
      return { success: true, id: result[0].insertId };
    }),

  // Update an existing block
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      icon: z.string().optional(),
      blockType: z.string().optional(),
      content: z.string().optional(),
      thumbnail: z.string().optional(),
      tags: z.string().optional(),
      isPublic: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updates } = input;
      const updateData: Record<string, any> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.blockType !== undefined) updateData.blockType = updates.blockType;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.thumbnail !== undefined) updateData.thumbnail = updates.thumbnail;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;
      
      await db.update(blockStore).set(updateData).where(eq(blockStore.id, id));
      
      return { success: true };
    }),

  // Delete a block
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(blockStore).where(eq(blockStore.id, input.id));
      return { success: true };
    }),

  // Increment usage count when a block is added to a zone
  incrementUsage: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      
      const [block] = await db
        .select({ usageCount: blockStore.usageCount })
        .from(blockStore)
        .where(eq(blockStore.id, input.id))
        .limit(1);
      
      if (block) {
        await db.update(blockStore)
          .set({ usageCount: block.usageCount + 1 })
          .where(eq(blockStore.id, input.id));
      }
      
      return { success: true };
    }),

  // Get categories for filtering
  getCategories: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return ['all', 'custom'];
    
    const blocks = await db
      .select({ category: blockStore.category })
      .from(blockStore)
      .where(eq(blockStore.isPublic, 1));
    
    const categories = [...new Set(blocks.map(b => b.category))].filter(Boolean);
    return ['all', 'custom', ...categories.filter(c => c !== 'custom')];
  }),
});
