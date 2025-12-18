import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { adminUsers, adminSessions, pages, pageBlocks } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./adminDb";

describe.serial("Block Editor", () => {
  let adminToken: string;
  let testPageId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create admin user (or use existing)
    const existingUser = await db.select().from(adminUsers).where(eq(adminUsers.username, "blocktest")).limit(1);
    if (existingUser.length === 0) {
      await db.insert(adminUsers).values({
        username: "blocktest",
        passwordHash: hashPassword("testpass"),
      });
    }

    // Create admin session
    const token = `test-token-${Date.now()}`;
    await db.insert(adminSessions).values({
      token,
      username: "blocktest",
      expiresAt: new Date(Date.now() + 3600000),
    });
    adminToken = token;

    // Create test page using createPage function
    const { createPage } = await import("./adminDb");
    const page = await createPage({
      title: "Block Test Page",
      slug: `block-test-${Date.now()}`,
      published: 1,
      showInNav: 0,
      navOrder: 999,
    });
    testPageId = page.id;
    console.log("Test page created with ID:", testPageId);
  });

  it("should create a text block", async () => {
    const caller = appRouter.createCaller({
      req: { headers: { "x-admin-token": adminToken } } as any,
      res: {} as any,
      user: null,
    });

    const result = await caller.admin.pages.blocks.create({
      pageId: testPageId,
      type: "text",
      content: "This is a test text block",
      order: 0,
      settings: JSON.stringify({ alignment: "center", fontSize: "large" }),
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("should create an image block", async () => {
    const caller = appRouter.createCaller({
      req: { headers: { "x-admin-token": adminToken } } as any,
      res: {} as any,
      user: null,
    });

    const result = await caller.admin.pages.blocks.create({
      pageId: testPageId,
      type: "image",
      content: "https://example.com/image.jpg",
      order: 1,
      settings: JSON.stringify({ alignment: "center", width: "large", caption: "Test image" }),
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("should create a video block", async () => {
    const caller = appRouter.createCaller({
      req: { headers: { "x-admin-token": adminToken } } as any,
      res: {} as any,
      user: null,
    });

    const result = await caller.admin.pages.blocks.create({
      pageId: testPageId,
      type: "video",
      content: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      order: 2,
      settings: JSON.stringify({ alignment: "center", width: "large" }),
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("should create a quote block", async () => {
    const caller = appRouter.createCaller({
      req: { headers: { "x-admin-token": adminToken } } as any,
      res: {} as any,
      user: null,
    });

    const result = await caller.admin.pages.blocks.create({
      pageId: testPageId,
      type: "quote",
      content: "The only way to do great work is to love what you do.",
      order: 3,
      settings: JSON.stringify({ author: "Steve Jobs", role: "Apple Co-founder" }),
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("should create a CTA block", async () => {
    const caller = appRouter.createCaller({
      req: { headers: { "x-admin-token": adminToken } } as any,
      res: {} as any,
      user: null,
    });

    const result = await caller.admin.pages.blocks.create({
      pageId: testPageId,
      type: "cta",
      content: "Ready to get started?",
      order: 4,
      settings: JSON.stringify({
        subtitle: "Join thousands of satisfied users",
        buttonText: "Sign Up Now",
        buttonLink: "/signup",
      }),
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("should create a spacer block", async () => {
    const caller = appRouter.createCaller({
      req: { headers: { "x-admin-token": adminToken } } as any,
      res: {} as any,
      user: null,
    });

    const result = await caller.admin.pages.blocks.create({
      pageId: testPageId,
      type: "spacer",
      content: "Spacer",
      order: 5,
      settings: JSON.stringify({ height: "large" }),
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("should list all blocks for a page", async () => {
    const caller = appRouter.createCaller({
      req: { headers: { "x-admin-token": adminToken } } as any,
      res: {} as any,
      user: null,
    });

    const blocks = await caller.admin.pages.blocks.list({ pageId: testPageId });

    expect(blocks).toBeDefined();
    expect(blocks.length).toBeGreaterThanOrEqual(6);
    expect(blocks[0].type).toBe("text");
    expect(blocks[1].type).toBe("image");
    expect(blocks[2].type).toBe("video");
    expect(blocks[3].type).toBe("quote");
    expect(blocks[4].type).toBe("cta");
    expect(blocks[5].type).toBe("spacer");
  });

  it("should update a block", async () => {
    const caller = appRouter.createCaller({
      req: { headers: { "x-admin-token": adminToken } } as any,
      res: {} as any,
      user: null,
    });

    const blocks = await caller.admin.pages.blocks.list({ pageId: testPageId });
    const textBlock = blocks.find((b) => b.type === "text");
    expect(textBlock).toBeDefined();

    await caller.admin.pages.blocks.update({
      id: textBlock!.id,
      content: "Updated text block content",
      settings: JSON.stringify({ alignment: "left", fontSize: "medium" }),
    });

    const updatedBlocks = await caller.admin.pages.blocks.list({ pageId: testPageId });
    const updatedBlock = updatedBlocks.find((b) => b.id === textBlock!.id);
    expect(updatedBlock?.content).toBe("Updated text block content");
  });

  it("should reorder blocks", async () => {
    const caller = appRouter.createCaller({
      req: { headers: { "x-admin-token": adminToken } } as any,
      res: {} as any,
      user: null,
    });

    const blocks = await caller.admin.pages.blocks.list({ pageId: testPageId });
    
    // Reverse the order
    const reorderedBlocks = blocks.reverse().map((block, index) => ({
      id: block.id,
      order: index,
    }));

    await caller.admin.pages.blocks.reorder({ blocks: reorderedBlocks });

    const newBlocks = await caller.admin.pages.blocks.list({ pageId: testPageId });
    expect(newBlocks[0].id).toBe(blocks[0].id);
  });

  it("should delete a block", async () => {
    const caller = appRouter.createCaller({
      req: { headers: { "x-admin-token": adminToken } } as any,
      res: {} as any,
      user: null,
    });

    const blocks = await caller.admin.pages.blocks.list({ pageId: testPageId });
    const initialCount = blocks.length;
    const blockToDelete = blocks[blocks.length - 1];

    await caller.admin.pages.blocks.delete({ id: blockToDelete.id });

    const remainingBlocks = await caller.admin.pages.blocks.list({ pageId: testPageId });
    expect(remainingBlocks.length).toBe(initialCount - 1);
    expect(remainingBlocks.find((b) => b.id === blockToDelete.id)).toBeUndefined();
  });

  it("should allow public access to blocks for published pages", async () => {
    console.log("Public test - testPageId:", testPageId);
    expect(testPageId).toBeDefined();
    expect(typeof testPageId).toBe("number");

    const caller = appRouter.createCaller({
      req: { headers: {} } as any,
      res: {} as any,
      user: null,
    });

    const blocks = await caller.pages.getBlocks({ pageId: testPageId });

    expect(blocks).toBeDefined();
    expect(blocks.length).toBeGreaterThan(0);
  });
});
