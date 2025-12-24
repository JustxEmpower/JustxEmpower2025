import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { adminSessions, pages, pageBlocks, blockVersions } from "../drizzle/schema";
import { eq } from "drizzle-orm";


describe("Block Advanced Features", () => {
  let adminToken: string;
  let testPageId: number;
  let testBlockId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create admin session with unique token
    const sessionToken = `test-advanced-session-${Date.now()}`;
    await db.insert(adminSessions).values({
      username: "testadmin",
      token: sessionToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    adminToken = sessionToken;

    // Create test page
    const caller = appRouter.createCaller({
      req: { headers: { "x-admin-token": adminToken } } as any,
      res: {} as any,
      user: null,
    });

    const pageResult = await caller.admin.pages.create({
      title: "Test Page for Advanced Features",
      slug: `test-advanced-features-${Date.now()}`,
      published: 0,
    });

    testPageId = pageResult.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    if (testPageId) {
      await db.delete(blockVersions).where(eq(blockVersions.blockId, testBlockId));
      await db.delete(pageBlocks).where(eq(pageBlocks.pageId, testPageId));
      await db.delete(pages).where(eq(pages.id, testPageId));
    }
    await db.delete(adminSessions).where(eq(adminSessions.token, adminToken));
  });

  describe("Block Versioning", () => {
    it("should create a block with initial version", async () => {
      const caller = appRouter.createCaller({
        req: { headers: { "x-admin-token": adminToken } } as any,
        res: {} as any,
        user: null,
      });

      const result = await caller.admin.pages.blocks.create({
        pageId: testPageId,
        type: "text",
        content: "Original content",
        settings: JSON.stringify({ alignment: "left" }),
        visibility: JSON.stringify({}),
        animation: JSON.stringify({ type: "none" }),
        order: 0,
      });

      expect(result.id).toBeDefined();
      testBlockId = result.id;
    });

    it("should save version history when updating a block", async () => {
      const caller = appRouter.createCaller({
        req: { headers: { "x-admin-token": adminToken } } as any,
        res: {} as any,
        user: null,
      });

      // Update the block
      await caller.admin.pages.blocks.update({
        id: testBlockId,
        content: "Updated content",
        settings: JSON.stringify({ alignment: "center" }),
      });

      // Check version history
      const versions = await caller.admin.pages.blocks.versions.list({
        blockId: testBlockId,
      });

      expect(versions.length).toBeGreaterThan(0);
      // Version stores the original content before the update
      expect(versions[0].content).toBe("Original content");
    });

    it("should restore a block to a previous version", async () => {
      const caller = appRouter.createCaller({
        req: { headers: { "x-admin-token": adminToken } } as any,
        res: {} as any,
        user: null,
      });

      // Get versions
      const versions = await caller.admin.pages.blocks.versions.list({
        blockId: testBlockId,
      });

      const firstVersion = versions[0];

      // Restore to first version
      await caller.admin.pages.blocks.versions.restore({
        versionId: firstVersion.id,
      });

      // Verify restoration
      const blocks = await caller.admin.pages.blocks.list({
        pageId: testPageId,
      });

      const restoredBlock = blocks.find((b) => b.id === testBlockId);
      // After restoration, content should match the version content
      // Note: content is parsed as object with html property
      expect(restoredBlock?.content).toEqual({ html: "Original content" });
    });
  });

  describe("Conditional Visibility", () => {
    it("should create a block with device visibility rules", async () => {
      const caller = appRouter.createCaller({
        req: { headers: { "x-admin-token": adminToken } } as any,
        res: {} as any,
        user: null,
      });

      const visibilityConfig = {
        devices: {
          desktop: true,
          tablet: false,
          mobile: false,
        },
      };

      const result = await caller.admin.pages.blocks.create({
        pageId: testPageId,
        type: "text",
        content: "Desktop only content",
        settings: "{}",
        visibility: JSON.stringify(visibilityConfig),
        animation: "{}",
        order: 1,
      });

      expect(result.id).toBeDefined();

      // Verify visibility was saved - getPageBlocks returns parsed objects
      const blocks = await caller.admin.pages.blocks.list({
        pageId: testPageId,
      });

      const block = blocks.find((b) => b.id === result.id);
      expect(block).toBeDefined();
      // visibility is returned as parsed object, not string
      expect(block?.visibility).toEqual(visibilityConfig);
    });

    it("should create a block with schedule visibility rules", async () => {
      const caller = appRouter.createCaller({
        req: { headers: { "x-admin-token": adminToken } } as any,
        res: {} as any,
        user: null,
      });

      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const visibilityConfig = {
        schedule: {
          startDate: new Date().toISOString(),
          endDate: futureDate.toISOString(),
        },
      };

      const result = await caller.admin.pages.blocks.create({
        pageId: testPageId,
        type: "text",
        content: "Scheduled content",
        settings: "{}",
        visibility: JSON.stringify(visibilityConfig),
        animation: "{}",
        order: 2,
      });

      expect(result.id).toBeDefined();

      // Verify visibility was saved
      const blocks = await caller.admin.pages.blocks.list({
        pageId: testPageId,
      });

      const block = blocks.find((b) => b.id === result.id);
      // visibility is returned as parsed object
      expect(block?.visibility?.schedule).toBeDefined();
      expect(block?.visibility?.schedule?.startDate).toBeDefined();
      expect(block?.visibility?.schedule?.endDate).toBeDefined();
    });

    it("should update block visibility settings", async () => {
      const caller = appRouter.createCaller({
        req: { headers: { "x-admin-token": adminToken } } as any,
        res: {} as any,
        user: null,
      });

      const newVisibility = {
        devices: {
          desktop: true,
          tablet: true,
          mobile: true,
        },
        auth: {
          loggedIn: true,
        },
      };

      await caller.admin.pages.blocks.update({
        id: testBlockId,
        visibility: JSON.stringify(newVisibility),
      });

      // Verify update
      const blocks = await caller.admin.pages.blocks.list({
        pageId: testPageId,
      });

      const block = blocks.find((b) => b.id === testBlockId);
      // visibility is returned as parsed object
      expect(block?.visibility?.devices?.desktop).toBe(true);
      expect(block?.visibility?.auth?.loggedIn).toBe(true);
    });
  });

  describe("Animation Controls", () => {
    it("should create a block with fade-in animation", async () => {
      const caller = appRouter.createCaller({
        req: { headers: { "x-admin-token": adminToken } } as any,
        res: {} as any,
        user: null,
      });

      const animationConfig = {
        type: "fade-in",
        trigger: "on-scroll",
        duration: 600,
        delay: 0,
        easing: "ease-out",
      };

      const result = await caller.admin.pages.blocks.create({
        pageId: testPageId,
        type: "text",
        content: "Animated content",
        settings: "{}",
        visibility: "{}",
        animation: JSON.stringify(animationConfig),
        order: 3,
      });

      expect(result.id).toBeDefined();

      // Verify animation was saved - returned as parsed object
      const blocks = await caller.admin.pages.blocks.list({
        pageId: testPageId,
      });

      const block = blocks.find((b) => b.id === result.id);
      expect(block).toBeDefined();
      expect(block?.animation).toEqual(animationConfig);
    });

    it("should create a block with slide-up animation on hover", async () => {
      const caller = appRouter.createCaller({
        req: { headers: { "x-admin-token": adminToken } } as any,
        res: {} as any,
        user: null,
      });

      const animationConfig = {
        type: "slide-up",
        trigger: "on-hover",
        duration: 400,
        delay: 100,
        easing: "ease-in-out",
      };

      const result = await caller.admin.pages.blocks.create({
        pageId: testPageId,
        type: "cta",
        content: JSON.stringify({ headline: "Hover me!", subtitle: "Watch the animation" }),
        settings: "{}",
        visibility: "{}",
        animation: JSON.stringify(animationConfig),
        order: 4,
      });

      expect(result.id).toBeDefined();

      // Verify animation was saved - returned as parsed object
      const blocks = await caller.admin.pages.blocks.list({
        pageId: testPageId,
      });

      const block = blocks.find((b) => b.id === result.id);
      expect(block?.animation?.type).toBe("slide-up");
      expect(block?.animation?.trigger).toBe("on-hover");
      expect(block?.animation?.duration).toBe(400);
    });

    it("should update block animation settings", async () => {
      const caller = appRouter.createCaller({
        req: { headers: { "x-admin-token": adminToken } } as any,
        res: {} as any,
        user: null,
      });

      const newAnimation = {
        type: "zoom-in",
        trigger: "on-load",
        duration: 800,
        delay: 200,
        easing: "ease-in",
      };

      await caller.admin.pages.blocks.update({
        id: testBlockId,
        animation: JSON.stringify(newAnimation),
      });

      // Verify update - returned as parsed object
      const blocks = await caller.admin.pages.blocks.list({
        pageId: testPageId,
      });

      const block = blocks.find((b) => b.id === testBlockId);
      expect(block?.animation?.type).toBe("zoom-in");
      expect(block?.animation?.trigger).toBe("on-load");
      expect(block?.animation?.duration).toBe(800);
    });

    it("should disable animation by setting type to none", async () => {
      const caller = appRouter.createCaller({
        req: { headers: { "x-admin-token": adminToken } } as any,
        res: {} as any,
        user: null,
      });

      const noAnimation = {
        type: "none",
      };

      await caller.admin.pages.blocks.update({
        id: testBlockId,
        animation: JSON.stringify(noAnimation),
      });

      // Verify update - returned as parsed object
      const blocks = await caller.admin.pages.blocks.list({
        pageId: testPageId,
      });

      const block = blocks.find((b) => b.id === testBlockId);
      expect(block?.animation?.type).toBe("none");
    });
  });
});
