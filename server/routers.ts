import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { adminRouter, publicArticlesRouter, publicContentRouter, publicPagesRouter, aiChatAnalyticsRouter, publicThemeRouter } from "./adminRouters";
import { shopRouter } from "./shopRouter";
import { eventsRouter } from "./eventsRouter";
import { newsletterRouter } from "./newsletterRouter";
import { aiRouter } from "./aiRouters";
import { analyticsRouter } from "./analyticsRouters";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Admin portal routes
  admin: adminRouter,
  
  // Public routes for articles and content
  articles: publicArticlesRouter,
  content: publicContentRouter,
  
  // Newsletter subscription
  newsletter: newsletterRouter,
  
  // AI Chat Assistant
  ai: aiRouter,
  
  // Analytics
  analytics: analyticsRouter,
  
  // AI Chat Analytics
  aiChatAnalytics: aiChatAnalyticsRouter,
  
  // Public pages
  pages: publicPagesRouter,
  
  // Public theme settings
  theme: publicThemeRouter,
  
  // Shop/E-commerce
  shop: shopRouter,
  
  // Events with registration and payment
  events: eventsRouter,
});

export type AppRouter = typeof appRouter;
