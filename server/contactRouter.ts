import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { eq, desc, sql, and, or, like } from "drizzle-orm";
import { sendEmail } from "./emailService";

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

  // Bulk delete submissions
  bulkDelete: publicProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      for (const id of input.ids) {
        await db.delete(schema.contactSubmissions).where(eq(schema.contactSubmissions.id, id));
      }

      return { success: true, deleted: input.ids.length };
    }),

  // Bulk update status
  bulkUpdateStatus: publicProcedure
    .input(z.object({
      ids: z.array(z.number()),
      status: z.enum(["new", "read", "replied", "archived"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      for (const id of input.ids) {
        await db.update(schema.contactSubmissions)
          .set({ status: input.status })
          .where(eq(schema.contactSubmissions.id, id));
      }

      return { success: true, updated: input.ids.length };
    }),

  // Send reply email
  reply: publicProcedure
    .input(z.object({
      id: z.number(),
      toEmail: z.string().email(),
      toName: z.string(),
      subject: z.string(),
      message: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      try {
        // Send the reply email
        const htmlContent = `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Just Empower</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="color: #525252; margin: 0 0 20px 0;">Dear ${input.toName},</p>
              <div style="color: #404040; line-height: 1.6; white-space: pre-wrap;">${input.message}</div>
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
              <p style="color: #737373; font-size: 14px; margin: 0;">
                Best regards,<br />
                <strong>The Just Empower Team</strong>
              </p>
            </div>
            <div style="text-align: center; padding: 20px; color: #a3a3a3; font-size: 12px;">
              <p>Just Empower | Where Empowerment Becomes Embodiment</p>
            </div>
          </div>
        `;

        await sendEmail({
          to: [input.toEmail],
          subject: input.subject,
          htmlContent,
        });

        // Update the submission status and save reply
        await db.update(schema.contactSubmissions)
          .set({
            status: "replied",
            repliedAt: new Date(),
            notes: `Reply sent: ${input.subject}\n\n${input.message}`,
          })
          .where(eq(schema.contactSubmissions.id, input.id));

        return { success: true, message: "Reply sent successfully!" };
      } catch (error: any) {
        console.error("Error sending reply:", error);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: error.message || "Failed to send reply" 
        });
      }
    }),

  // Get stats
  stats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    }

    const [total] = await db.select({ count: sql<number>`count(*)` }).from(schema.contactSubmissions);
    const [newCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.contactSubmissions).where(eq(schema.contactSubmissions.status, "new"));
    const [readCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.contactSubmissions).where(eq(schema.contactSubmissions.status, "read"));
    const [repliedCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.contactSubmissions).where(eq(schema.contactSubmissions.status, "replied"));
    const [archivedCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.contactSubmissions).where(eq(schema.contactSubmissions.status, "archived"));

    return {
      total: total?.count || 0,
      new: newCount?.count || 0,
      read: readCount?.count || 0,
      replied: repliedCount?.count || 0,
      archived: archivedCount?.count || 0,
    };
  }),
});
