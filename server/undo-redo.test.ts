import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Undo/Redo Functionality", () => {
  let testToken: string;
  let testPageId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Generate test session token
    const token = 'test-undo-session-' + Date.now();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    await db.insert(schema.adminSessions).values({
      token,
      username: 'JusticeEmpower',
      expiresAt,
    });

    testToken = token;

    // Create test page
    const authenticatedCaller = appRouter.createCaller({
      adminToken: testToken,
      req: { headers: { 'x-admin-token': testToken } } as any,
      res: {} as any,
      user: null,
    });
    const page = await authenticatedCaller.admin.pages.create({
      title: `Undo Test Page ${Date.now()}`,
      slug: `undo-test-${Date.now()}`,
      published: 0,
    });
    testPageId = page.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;
    
    // Clean up test data
    await db.delete(schema.pageBlocks).where(eq(schema.pageBlocks.pageId, testPageId));
    await db.delete(schema.pages).where(eq(schema.pages.id, testPageId));
    await db.delete(schema.adminSessions).where(eq(schema.adminSessions.token, testToken));
  });

  it("should create multiple blocks and track history", async () => {
    const caller = appRouter.createCaller({
      adminToken: testToken,
      req: { headers: { 'x-admin-token': testToken } } as any,
      res: {} as any,
      user: null,
    });

    // Create first block - createPageBlock returns { success, id }
    const block1Result = await caller.admin.pages.blocks.create({
      pageId: testPageId,
      type: "text",
      content: "First block",
      settings: "{}",
      order: 0,
    });

    expect(block1Result.id).toBeDefined();

    // Create second block
    const block2Result = await caller.admin.pages.blocks.create({
      pageId: testPageId,
      type: "text",
      content: "Second block",
      settings: "{}",
      order: 1,
    });

    expect(block2Result.id).toBeDefined();

    // Verify both blocks exist - list returns parsed content as { html: "..." }
    const blocks = await caller.admin.pages.blocks.list({ pageId: testPageId });
    expect(blocks.length).toBeGreaterThanOrEqual(2);
    
    // Verify content is parsed correctly
    const firstBlock = blocks.find(b => b.id === block1Result.id);
    const secondBlock = blocks.find(b => b.id === block2Result.id);
    expect(firstBlock?.content).toEqual({ html: "First block" });
    expect(secondBlock?.content).toEqual({ html: "Second block" });
  });

  it("should update a block and allow reverting via delete+recreate", async () => {
    const caller = appRouter.createCaller({
      adminToken: testToken,
      req: { headers: { 'x-admin-token': testToken } } as any,
      res: {} as any,
      user: null,
    });

    // Create a block
    const blockResult = await caller.admin.pages.blocks.create({
      pageId: testPageId,
      type: "text",
      content: "Original content",
      settings: "{}",
      order: 10,
    });

    const originalId = blockResult.id;

    // Update the block
    await caller.admin.pages.blocks.update({
      id: originalId,
      content: "Updated content",
      settings: "{}",
    });

    // Verify update - content is parsed as { html: "..." }
    const blocks = await caller.admin.pages.blocks.list({ pageId: testPageId });
    const updatedBlock = blocks.find((b) => b.id === originalId);
    expect(updatedBlock?.content).toEqual({ html: "Updated content" });

    // Simulate undo by updating back
    await caller.admin.pages.blocks.update({
      id: originalId,
      content: "Original content",
      settings: "{}",
    });

    // Verify undo
    const blocksAfterUndo = await caller.admin.pages.blocks.list({ pageId: testPageId });
    const revertedBlock = blocksAfterUndo.find((b) => b.id === originalId);
    expect(revertedBlock?.content).toEqual({ html: "Original content" });
  });

  it("should delete a block and allow recreation (undo delete)", async () => {
    const caller = appRouter.createCaller({
      adminToken: testToken,
      req: { headers: { 'x-admin-token': testToken } } as any,
      res: {} as any,
      user: null,
    });

    // Create a block
    const blockResult = await caller.admin.pages.blocks.create({
      pageId: testPageId,
      type: "quote",
      content: "Temporary block",
      settings: '{"author":"Test Author"}',
      order: 20,
    });

    const blockId = blockResult.id;

    // Delete the block
    await caller.admin.pages.blocks.delete({ id: blockId });

    // Verify deletion
    const blocksAfterDelete = await caller.admin.pages.blocks.list({ pageId: testPageId });
    const deletedBlock = blocksAfterDelete.find((b) => b.id === blockId);
    expect(deletedBlock).toBeUndefined();

    // Simulate undo by recreating
    const recreatedResult = await caller.admin.pages.blocks.create({
      pageId: testPageId,
      type: "quote",
      content: "Temporary block",
      settings: '{"author":"Test Author"}',
      order: 20,
    });

    expect(recreatedResult.id).toBeDefined();
    
    // Verify recreated block
    const blocksAfterRecreate = await caller.admin.pages.blocks.list({ pageId: testPageId });
    const recreatedBlock = blocksAfterRecreate.find((b) => b.id === recreatedResult.id);
    expect(recreatedBlock?.content).toEqual({ html: "Temporary block" });
    expect(recreatedBlock?.settings).toEqual({ author: "Test Author" });
  });

  it("should reorder blocks and allow reverting order", async () => {
    const caller = appRouter.createCaller({
      adminToken: testToken,
      req: { headers: { 'x-admin-token': testToken } } as any,
      res: {} as any,
      user: null,
    });

    // Create three blocks with unique orders
    const block1Result = await caller.admin.pages.blocks.create({
      pageId: testPageId,
      type: "text",
      content: "Block A",
      settings: "{}",
      order: 100,
    });

    const block2Result = await caller.admin.pages.blocks.create({
      pageId: testPageId,
      type: "text",
      content: "Block B",
      settings: "{}",
      order: 101,
    });

    const block3Result = await caller.admin.pages.blocks.create({
      pageId: testPageId,
      type: "text",
      content: "Block C",
      settings: "{}",
      order: 102,
    });

    // Reorder: swap block1 and block3
    await caller.admin.pages.blocks.reorder({
      blocks: [
        { id: block3Result.id, order: 100 },
        { id: block2Result.id, order: 101 },
        { id: block1Result.id, order: 102 },
      ],
    });

    // Verify new order - content is parsed as { html: "..." }
    const reorderedBlocks = await caller.admin.pages.blocks.list({ pageId: testPageId });
    const sortedBlocks = reorderedBlocks
      .filter((b) => [block1Result.id, block2Result.id, block3Result.id].includes(b.id))
      .sort((a, b) => a.order - b.order);

    expect(sortedBlocks[0].content).toEqual({ html: "Block C" });
    expect(sortedBlocks[2].content).toEqual({ html: "Block A" });

    // Revert order (undo)
    await caller.admin.pages.blocks.reorder({
      blocks: [
        { id: block1Result.id, order: 100 },
        { id: block2Result.id, order: 101 },
        { id: block3Result.id, order: 102 },
      ],
    });

    // Verify original order restored
    const restoredBlocks = await caller.admin.pages.blocks.list({ pageId: testPageId });
    const sortedRestored = restoredBlocks
      .filter((b) => [block1Result.id, block2Result.id, block3Result.id].includes(b.id))
      .sort((a, b) => a.order - b.order);

    expect(sortedRestored[0].content).toEqual({ html: "Block A" });
    expect(sortedRestored[2].content).toEqual({ html: "Block C" });
  });

  it("should handle complex undo scenario: create, update, delete sequence", async () => {
    const caller = appRouter.createCaller({
      adminToken: testToken,
      req: { headers: { 'x-admin-token': testToken } } as any,
      res: {} as any,
      user: null,
    });

    // Step 1: Create a block
    const blockResult = await caller.admin.pages.blocks.create({
      pageId: testPageId,
      type: "cta",
      content: "Click me!",
      settings: '{"buttonText":"Learn More"}',
      order: 200,
    });

    const blockId = blockResult.id;

    // Step 2: Update the block
    await caller.admin.pages.blocks.update({
      id: blockId,
      content: "Updated CTA",
      settings: '{"buttonText":"Get Started"}',
    });

    // Step 3: Delete the block
    await caller.admin.pages.blocks.delete({ id: blockId });

    // Verify deletion
    const blocksAfterDelete = await caller.admin.pages.blocks.list({ pageId: testPageId });
    const deletedBlock = blocksAfterDelete.find((b) => b.id === blockId);
    expect(deletedBlock).toBeUndefined();

    // Undo Step 3: Recreate the updated block
    const undoDeleteResult = await caller.admin.pages.blocks.create({
      pageId: testPageId,
      type: "cta",
      content: "Updated CTA",
      settings: '{"buttonText":"Get Started"}',
      order: 200,
    });

    expect(undoDeleteResult.id).toBeDefined();

    // Undo Step 2: Revert to original content
    await caller.admin.pages.blocks.update({
      id: undoDeleteResult.id,
      content: "Click me!",
      settings: '{"buttonText":"Learn More"}',
    });

    // Verify final state - content is parsed
    const finalBlocks = await caller.admin.pages.blocks.list({ pageId: testPageId });
    const finalBlock = finalBlocks.find((b) => b.id === undoDeleteResult.id);
    expect(finalBlock?.content).toEqual({ html: "Click me!" });
    expect(finalBlock?.settings).toEqual({ buttonText: "Learn More" });
  });
});
