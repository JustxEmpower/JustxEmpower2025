import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { adminRouter, publicArticlesRouter, publicContentRouter, publicPagesRouter, aiChatAnalyticsRouter, publicThemeRouter, publicSiteSettingsRouter, publicNavigationRouter, carouselRouter, fontSettingsRouter, contentTextStylesRouter, aiTrainingRouter } from "./adminRouters";
import { siteManagerRouter } from "./siteManagerRouter";
import { automationRouter } from "./automationRouter";
import { shopRouter } from "./shopRouter";
import { eventsRouter } from "./eventsRouter";
import { adminResourcesRouter, publicResourcesRouter } from "./resourcesRouter";
import { contactRouter } from "./contactRouter";
import { newsletterRouter } from "./newsletterRouter";
import { aiRouter } from "./aiRouters";
import { analyticsRouter } from "./analyticsRouters";
import { pageZonesRouter } from "./pageZonesRouter";
import { blockStoreRouter } from "./blockStoreRouter";
import { imageRouter } from "./imageRouter";
import { notificationsRouter, financialRouter } from "./ecommerceRouters";

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
  
  // Public site settings (brand, logo, etc.)
  siteSettings: publicSiteSettingsRouter,
  
  // Shop/E-commerce
  shop: shopRouter,
  
  // Events with registration and payment
  events: eventsRouter,
  
  // Resources / Document Library
  resources: publicResourcesRouter,
  adminResources: adminResourcesRouter,
  
  // Contact form submissions
  contact: contactRouter,
  
  // Carousel offerings for homepage
  carousel: carouselRouter,
  
  // Font settings for site-wide typography
  fontSettings: fontSettingsRouter,
  
  // Content text styles for per-field formatting
  contentTextStyles: contentTextStylesRouter,
  
  // Public navigation for header/footer
  navigation: publicNavigationRouter,
  
  // Site Manager - unified control center
  siteManager: siteManagerRouter,
  
  // Automation - scheduled tasks, notifications, workflows
  automation: automationRouter,
  
  // AI Training - knowledge base management
  aiTraining: aiTrainingRouter,
  
  // Page Zones - inject Page Builder blocks into existing pages
  pageZones: pageZonesRouter,
  
  // Block Store - custom reusable blocks created in Page Builder
  blockStore: blockStoreRouter,
  
  // Image processing - Sharp-based image optimization
  image: imageRouter,
  
  // E-commerce: notifications + financial analytics
  adminNotifications: notificationsRouter,
  adminFinancial: financialRouter,
});

export type AppRouter = typeof appRouter;
