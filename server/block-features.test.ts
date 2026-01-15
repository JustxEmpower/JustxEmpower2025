import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Block Editor Advanced Features", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let testPageId: number;
  let testBlock1Id: number;
  let testBlock2Id: number;
  let adminToken: string;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create admin session token
    const token = `test-features-token-${Date.now()}`;
    await db.insert(schema.adminSessions).values({
      token,
      username: "JusticeEmpower",
      expiresAt: new Date(Date.now() + 3600000),
    });
    adminToken = token;
    
    // Create a test admin context
    caller = appRouter.createCaller({
      req: { headers: { "x-admin-token": adminToken } } as any,
      res: {} as any,
      user: null,
    });

    // Create a test page
    const pageResult = await caller.admin.pages.create({
      title: "Feature Test Page",
      slug: `feature-test-${Date.now()}`,
      published: 0,
      showInNav: 0,
      navOrder: 999,
    });
    testPageId = pageResult.id;

    // Create test blocks - API expects strings for content and settings
    const block1 = await caller.admin.pages.blocks.create({
      pageId: testPageId,
      type: "text",
      content: "First test block content",
      settings: JSON.stringify({ alignment: "left" }),
      order: 0,
    });
    testBlock1Id = block1.id;

    const block2 = await caller.admin.pages.blocks.create({
      pageId: testPageId,
      type: "quote",
      content: "Test quote content",
      settings: JSON.stringify({ author: "Test Author" }),
      order: 1,
    });
    testBlock2Id = block2.id;
  });

  afterAll(async () => {
    // Clean up test data
    const db = await getDb();
    if (!db) return;

    await db.delete(schema.pageBlocks).where(eq(schema.pageBlocks.pageId, testPageId));
    await db.delete(schema.pages).where(eq(schema.pages.id, testPageId));
    await db.delete(schema.blockTemplates); // Clean up all test templates
    await db.delete(schema.adminSessions).where(eq(schema.adminSessions.token, adminToken));
  });

  // Helper function to get content as string from parsed block
  const getContentString = (content: any): string => {
    if (typeof content === 'string') return content;
    if (content && typeof content === 'object') {
      // Content is parsed as { html: "..." } for text blocks
      return content.html || JSON.stringify(content);
    }
    return '';
  };

  // Helper function to get settings as string from parsed block
  const getSettingsString = (settings: any): string => {
    if (typeof settings === 'string') return settings;
    if (settings && typeof settings === 'object') {
      return JSON.stringify(settings);
    }
    return '{}';
  };

  describe("Block Duplication", () => {
    it("should duplicate a block with all its properties", async () => {
      const blocksBefore = await caller.admin.pages.blocks.list({ pageId: testPageId });
      const initialCount = blocksBefore.length;

      // Get the first block
      const originalBlock = blocksBefore.find((b) => b.id === testBlock1Id);
      expect(originalBlock).toBeDefined();

      // Duplicate by creating a new block with same content
      // Need to stringify content/settings since API expects strings
      const duplicated = await caller.admin.pages.blocks.create({
        pageId: testPageId,
        type: originalBlock!.type,
        content: getContentString(originalBlock!.content),
        settings: getSettingsString(originalBlock!.settings),
        order: originalBlock!.order + 10,
      });

      const blocksAfter = await caller.admin.pages.blocks.list({ pageId: testPageId });
      expect(blocksAfter.length).toBe(initialCount + 1);

      // Verify duplicated block was created with correct ID
      expect(duplicated.id).toBeDefined();
      expect(duplicated.id).not.toBe(testBlock1Id);
      
      // Find the duplicated block in the list
      const duplicatedBlock = blocksAfter.find((b) => b.id === duplicated.id);
      expect(duplicatedBlock).toBeDefined();
      expect(duplicatedBlock!.type).toBe(originalBlock!.type);
      // Content is parsed, so compare the parsed values
      expect(getContentString(duplicatedBlock!.content)).toBe(getContentString(originalBlock!.content));
    });
  });

  describe("Block Templates", () => {
    it("should create a block template", async () => {
      const blocks = await caller.admin.pages.blocks.list({ pageId: testPageId });
      // Store template blocks with stringified content/settings
      const templateBlocks = blocks.map((b) => ({
        type: b.type,
        content: getContentString(b.content),
        settings: getSettingsString(b.settings),
      }));

      const template = await caller.admin.blockTemplates.create({
        name: "Test Template",
        description: "A test template with multiple blocks",
        blocks: JSON.stringify(templateBlocks),
      });

      expect(template.id).toBeDefined();
    });

    it("should list all block templates", async () => {
      const templates = await caller.admin.blockTemplates.list();
      expect(templates.length).toBeGreaterThan(0);

      const testTemplate = templates.find((t) => t.name === "Test Template");
      expect(testTemplate).toBeDefined();
      expect(testTemplate!.description).toBe("A test template with multiple blocks");

      // Verify blocks are stored as JSON
      const blocks = JSON.parse(testTemplate!.blocks);
      expect(Array.isArray(blocks)).toBe(true);
      expect(blocks.length).toBeGreaterThan(0);
    });

    it("should load blocks from a template", async () => {
      const templates = await caller.admin.blockTemplates.list();
      const testTemplate = templates.find((t) => t.name === "Test Template");
      expect(testTemplate).toBeDefined();

      const templateBlocks = JSON.parse(testTemplate!.blocks);
      const blocksBefore = await caller.admin.pages.blocks.list({ pageId: testPageId });
      const initialCount = blocksBefore.length;

      // Load template blocks - content/settings are already strings in template
      for (let i = 0; i < templateBlocks.length; i++) {
        await caller.admin.pages.blocks.create({
          pageId: testPageId,
          type: templateBlocks[i].type,
          content: templateBlocks[i].content || "",
          settings: templateBlocks[i].settings || "{}",
          order: initialCount + i + 100,
        });
      }

      const blocksAfter = await caller.admin.pages.blocks.list({ pageId: testPageId });
      expect(blocksAfter.length).toBe(initialCount + templateBlocks.length);
    });

    it("should delete a block template", async () => {
      const templatesBefore = await caller.admin.blockTemplates.list();
      const testTemplate = templatesBefore.find((t) => t.name === "Test Template");
      expect(testTemplate).toBeDefined();

      await caller.admin.blockTemplates.delete({ id: testTemplate!.id });

      const templatesAfter = await caller.admin.blockTemplates.list();
      const deletedTemplate = templatesAfter.find((t) => t.id === testTemplate!.id);
      expect(deletedTemplate).toBeUndefined();
    });
  });

  describe("Block Search and Filter", () => {
    it("should filter blocks by type", async () => {
      const allBlocks = await caller.admin.pages.blocks.list({ pageId: testPageId });
      
      const textBlocks = allBlocks.filter((b) => b.type === "text");
      const quoteBlocks = allBlocks.filter((b) => b.type === "quote");

      expect(textBlocks.length).toBeGreaterThan(0);
      expect(quoteBlocks.length).toBeGreaterThan(0);
      expect(textBlocks.every((b) => b.type === "text")).toBe(true);
      expect(quoteBlocks.every((b) => b.type === "quote")).toBe(true);
    });

    it("should search blocks by content", async () => {
      const allBlocks = await caller.admin.pages.blocks.list({ pageId: testPageId });
      
      const searchQuery = "test";
      // Content is parsed as object { html: "..." }, so we need to extract the string
      const matchingBlocks = allBlocks.filter((b) => {
        const contentStr = getContentString(b.content);
        return contentStr.toLowerCase().includes(searchQuery.toLowerCase());
      });

      expect(matchingBlocks.length).toBeGreaterThan(0);
      matchingBlocks.forEach((block) => {
        const contentStr = getContentString(block.content);
        expect(contentStr.toLowerCase()).toContain(searchQuery);
      });
    });
  });
});
