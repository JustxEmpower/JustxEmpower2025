import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc.js';
import { subscribeToNewsletter, updateMailchimpSettings } from './mailchimp.js';
import { getDb } from './db.js';
import * as schema from '../drizzle/schema.js';

export const newsletterRouter = router({
  getSubscribers: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    try {
      const subscribers = await db.select().from(schema.newsletterSubscribers).orderBy(schema.newsletterSubscribers.createdAt);
      return subscribers;
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      return [];
    }
  }),

  subscribe: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await subscribeToNewsletter(
        input.email,
        input.firstName,
        input.lastName
      );

      if (!result.success) {
        throw new Error(result.message);
      }

      return {
        success: true,
        message: result.message,
      };
    }),

  // Admin-only: Update Mailchimp settings
  updateSettings: publicProcedure
    .input(
      z.object({
        apiKey: z.string().min(1),
        audienceId: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const result = await updateMailchimpSettings(input.apiKey, input.audienceId);

      if (!result.success) {
        throw new Error(result.message);
      }

      return {
        success: true,
        message: result.message,
      };
    }),
});
