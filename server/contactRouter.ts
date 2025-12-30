import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";

export const contactRouter = router({
  // Submit contact form (public)
  submit: publicProcedure
    .input(z.object({
      firstName: z.string().min(2, "First name is required"),
      lastName: z.string().min(2, "Last name is required"),
      email: z.string().email("Invalid email address"),
      subject: z.string().min(5, "Subject must be at least 5 characters"),
      message: z.string().min(10, "Message must be at least 10 characters"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      try {
        await db.insert(schema.contactSubmissions).values({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          subject: input.subject,
          message: input.message,
          status: "new",
        });

        return { success: true, message: "Your message has been sent successfully!" };
      } catch (error) {
        console.error("Error submitting contact form:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to submit contact form" });
      }
    }),

  // List all submissions (admin only - will be protected in adminRouters)
  list: publicProcedure
    .input(z.object({
      status: z.enum(["new", "read", "replied", "archived"]).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const { status, limit = 50, offset = 0 } = input || {};

      let query = db.select().from(schema.contactSubmissions);
      
      if (status) {
        query = query.where(eq(schema.contactSubmissions.status, status)) as typeof query;
      }

      const submissions = await query
        .orderBy(desc(schema.contactSubmissions.createdAt))
        .limit(limit)
        .offset(offset);

      return submissions;
    }),

  // Update submission status (admin only)
  updateStatus: publicProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["new", "read", "replied", "archived"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const updateData: Record<string, unknown> = { status: input.status };
      if (input.notes !== undefined) {
        updateData.notes = input.notes;
      }
      if (input.status === "replied") {
        updateData.repliedAt = new Date();
      }

      await db
        .update(schema.contactSubmissions)
        .set(updateData)
        .where(eq(schema.contactSubmissions.id, input.id));

      return { success: true };
    }),

  // Delete submission (admin only)
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      await db
        .delete(schema.contactSubmissions)
        .where(eq(schema.contactSubmissions.id, input.id));

      return { success: true };
    }),
});
