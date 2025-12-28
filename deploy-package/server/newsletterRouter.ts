import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc.js';
import { subscribeToNewsletter, updateMailchimpSettings } from './mailchimp.js';

export const newsletterRouter = router({
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
