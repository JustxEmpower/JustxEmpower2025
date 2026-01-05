import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/trpc";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("pageSections router", () => {
  let adminToken: string;
  let testSectionIds: number[] = [];

  beforeAll(async () => {
    // Create admin session for testing
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Generate test session token
    const token = "test-pagesections-session-" + Date.now();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(schema.adminSessions).values({
      token,
      username: "JusticeEmpower",
      expiresAt,
    });
    adminToken = token;
  });

  afterAll(async () => {
    // Cleanup test sections
    const db = await getDb();
    if (!db) return;

    for (const id of testSectionIds) {
      try {
        await db.delete(schema.pageSections).where(eq(schema.pageSections.id, id));
      } catch (e) {
        // Ignore errors during cleanup
      }
    }

    // Cleanup test session
    if (adminToken) {
      await db.delete(schema.adminSessions).where(eq(schema.adminSessions.token, adminToken));
    }
  });

  // Helper to create admin context
  function createAdminContext(): Context {
    return {
      req: {
        headers: {
          "x-admin-token": adminToken,
        },
      } as any,
      res: {} as any,
      user: null,
    };
  }

  // Helper to create public context
  function createPublicContext(): Context {
    return {
      req: {
        headers: {},
      } as any,
      res: {} as any,
      user: null,
    };
  }

  describe("public procedures", () => {
    it("getByPage returns sections for a page", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Test with home page (ID 1) which should have seeded sections
      const result = await caller.pageSections.getByPage({ pageId: 1 });

      expect(Array.isArray(result)).toBe(true);
      // Home page should have sections from seeding
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("id");
        expect(result[0]).toHaveProperty("sectionType");
        expect(result[0]).toHaveProperty("content");
        expect(result[0]).toHaveProperty("sectionOrder");
      }
    });

    it("getByPage returns empty array for non-existent page", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pageSections.getByPage({ pageId: 999999 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("getByPageSlug returns sections for a page by slug", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Test with philosophy page which should have seeded sections
      const result = await caller.pageSections.getByPageSlug({ slug: "philosophy" });

      expect(Array.isArray(result)).toBe(true);
      // Philosophy page should have sections from seeding
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("sectionType");
        expect(result[0]).toHaveProperty("title");
      }
    });

    it("getByPageSlug returns empty array for non-existent slug", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pageSections.getByPageSlug({ slug: "non-existent-page-xyz" });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("getPageCompleteness returns completeness data for a page", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Test with home page which has seeded sections
      const result = await caller.pageSections.getPageCompleteness({ pageId: 1 });

      expect(result).toHaveProperty("sections");
      expect(result).toHaveProperty("overallCompleteness");
      expect(result).toHaveProperty("totalSections");
      expect(result).toHaveProperty("completeSections");
      expect(typeof result.overallCompleteness).toBe("number");
      expect(typeof result.totalSections).toBe("number");
    });
  });

  describe("admin procedures", () => {
    it("create adds a new section to a page", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const testSection = {
        pageId: 1,
        sectionType: "content",
        sectionOrder: 100,
        title: "Test Section",
        content: { testField: "test value" },
        requiredFields: ["testField"],
        isVisible: 1,
      };

      const result = await caller.pageSections.create(testSection);

      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("id");
      expect(typeof result.id).toBe("number");

      // Track for cleanup
      testSectionIds.push(result.id);
    });

    it("update modifies an existing section", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // First create a section to update
      const createResult = await caller.pageSections.create({
        pageId: 1,
        sectionType: "content",
        content: { original: "value" },
      });
      testSectionIds.push(createResult.id);

      // Then update it
      const updateResult = await caller.pageSections.update({
        id: createResult.id,
        title: "Updated Title",
        content: { updated: "new value" },
      });

      expect(updateResult).toHaveProperty("success", true);

      // Verify the update
      const section = await caller.pageSections.getById({ id: createResult.id });
      expect(section.title).toBe("Updated Title");
      expect(section.content).toHaveProperty("updated", "new value");
    });

    it("delete removes a section", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // First create a section to delete
      const createResult = await caller.pageSections.create({
        pageId: 1,
        sectionType: "content",
        content: {},
      });

      // Then delete it
      const deleteResult = await caller.pageSections.delete({ id: createResult.id });

      expect(deleteResult).toHaveProperty("success", true);

      // Verify deletion - should throw NOT_FOUND
      await expect(
        caller.pageSections.getById({ id: createResult.id })
      ).rejects.toThrow();
    });

    it("reorder updates section order", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // Create two sections
      const section1 = await caller.pageSections.create({
        pageId: 1,
        sectionType: "content",
        sectionOrder: 200,
        content: {},
      });
      testSectionIds.push(section1.id);

      const section2 = await caller.pageSections.create({
        pageId: 1,
        sectionType: "cta",
        sectionOrder: 201,
        content: {},
      });
      testSectionIds.push(section2.id);

      // Reorder them (input is an array, not an object)
      const reorderResult = await caller.pageSections.reorder([
        { id: section1.id, sectionOrder: 201 },
        { id: section2.id, sectionOrder: 200 },
      ]);

      expect(reorderResult).toHaveProperty("success", true);

      // Verify the reorder
      const updatedSection1 = await caller.pageSections.getById({ id: section1.id });
      const updatedSection2 = await caller.pageSections.getById({ id: section2.id });

      expect(updatedSection1.sectionOrder).toBe(201);
      expect(updatedSection2.sectionOrder).toBe(200);
    });

    it("bulkCreate adds multiple sections at once", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const bulkResult = await caller.pageSections.bulkCreate({
        pageId: 1,
        sections: [
          { sectionType: "content", sectionOrder: 300, content: { field1: "value1" } },
          { sectionType: "cta", sectionOrder: 301, content: { field2: "value2" } },
          { sectionType: "quote", sectionOrder: 302, content: { field3: "value3" } },
        ],
      });

      expect(bulkResult).toHaveProperty("success", true);
      expect(bulkResult).toHaveProperty("count", 3);
    });

    it("syncSectionsForPage creates default sections for a page without sections", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // Use a page ID that likely doesn't have sections yet
      const syncResult = await caller.pageSections.syncSectionsForPage({
        pageId: 60012, // contact page
        pageSlug: "contact",
      });

      expect(syncResult).toHaveProperty("success", true);
      expect(syncResult).toHaveProperty("message");

      // If sections already exist, created should be 0
      // If sections were created, created should be > 0
      expect(typeof syncResult.created).toBe("number");
    });
  });

  describe("section completeness calculation", () => {
    it("calculates completeness based on required fields", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // Create a section with required fields
      const createResult = await caller.pageSections.create({
        pageId: 1,
        sectionType: "content",
        content: { field1: "filled", field2: "" }, // field2 is empty
        requiredFields: ["field1", "field2", "field3"], // field3 is missing
      });
      testSectionIds.push(createResult.id);

      // Get completeness
      const completeness = await caller.pageSections.getPageCompleteness({ pageId: 1 });

      // Find our test section in the results
      const testSection = completeness.sections.find(
        (s: any) => s.id === createResult.id
      );

      if (testSection) {
        // Only field1 is filled (1 out of 3 = ~33%)
        expect(testSection.completeness).toBeLessThan(100);
        expect(testSection.filledFields).toContain("field1");
        expect(testSection.missingFields).toContain("field3");
      }
    });
  });

  describe("authentication", () => {
    it("fails without admin token", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.pageSections.create({
          pageId: 1,
          sectionType: "content",
          content: {},
        })
      ).rejects.toThrow("Admin token required");
    });

    it("fails with invalid admin token", async () => {
      const ctx: Context = {
        req: {
          headers: {
            "x-admin-token": "invalid-token-123",
          },
        } as any,
        res: {} as any,
        user: null,
      };
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.pageSections.create({
          pageId: 1,
          sectionType: "content",
          content: {},
        })
      ).rejects.toThrow("Invalid or expired admin session");
    });
  });
});
