import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Contact Form Submissions", () => {
  let testSubmissionId: number;

  beforeAll(async () => {
    // Clean up any test data
    const db = await getDb();
    if (db) {
      await db.delete(schema.contactSubmissions).where(
        eq(schema.contactSubmissions.email, "test@example.com")
      );
    }
  });

  it("should create a contact submission", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();

    const result = await db!.insert(schema.contactSubmissions).values({
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      subject: "Test Subject",
      message: "This is a test message for the contact form.",
      status: "new",
    });

    expect(result).toBeDefined();
    
    // Get the created submission
    const submissions = await db!
      .select()
      .from(schema.contactSubmissions)
      .where(eq(schema.contactSubmissions.email, "test@example.com"));
    
    expect(submissions.length).toBeGreaterThan(0);
    testSubmissionId = submissions[0].id;
    expect(submissions[0].firstName).toBe("Test");
    expect(submissions[0].lastName).toBe("User");
    expect(submissions[0].status).toBe("new");
  });

  it("should update submission status", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();

    await db!
      .update(schema.contactSubmissions)
      .set({ status: "read" })
      .where(eq(schema.contactSubmissions.id, testSubmissionId));

    const updated = await db!
      .select()
      .from(schema.contactSubmissions)
      .where(eq(schema.contactSubmissions.id, testSubmissionId));

    expect(updated[0].status).toBe("read");
  });

  it("should delete a contact submission", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();

    await db!
      .delete(schema.contactSubmissions)
      .where(eq(schema.contactSubmissions.id, testSubmissionId));

    const deleted = await db!
      .select()
      .from(schema.contactSubmissions)
      .where(eq(schema.contactSubmissions.id, testSubmissionId));

    expect(deleted.length).toBe(0);
  });
});
