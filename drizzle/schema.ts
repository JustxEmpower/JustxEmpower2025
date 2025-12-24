import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Articles table for blog posts/journal entries
 */
export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  category: varchar("category", { length: 100 }),
  date: varchar("date", { length: 50 }),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }),
  published: int("published").default(1).notNull(), // 1 = published, 0 = draft
  status: varchar("status", { length: 20 }).default("published").notNull(), // published, draft, scheduled
  publishDate: timestamp("publishDate"), // For scheduled publishing
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

/**
 * Site content table for managing page sections, hero text, and media
 */
export const siteContent = mysqlTable("siteContent", {
  id: int("id").autoincrement().primaryKey(),
  page: varchar("page", { length: 100 }).notNull(), // 'home', 'about', 'philosophy', etc.
  section: varchar("section", { length: 100 }).notNull(), // 'hero', 'about', 'offerings', etc.
  contentKey: varchar("contentKey", { length: 100 }).notNull(), // 'title', 'subtitle', 'description', 'videoUrl', 'imageUrl'
  contentValue: text("contentValue").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteContent = typeof siteContent.$inferSelect;
export type InsertSiteContent = typeof siteContent.$inferInsert;

/**
 * Admin users table for custom admin authentication (separate from OAuth users)
 */
export const adminUsers = mysqlTable("adminUsers", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  role: varchar("role", { length: 50 }).default("editor").notNull(), // 'super_admin', 'admin', 'editor', 'viewer'
  permissions: text("permissions"), // JSON array of permissions
  mailchimpApiKey: varchar("mailchimpApiKey", { length: 255 }),
  mailchimpAudienceId: varchar("mailchimpAudienceId", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

/**
 * Admin sessions table for persistent session storage
 */
export const adminSessions = mysqlTable("adminSessions", {
  token: varchar("token", { length: 255 }).notNull().primaryKey(),
  username: varchar("username", { length: 100 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminSession = typeof adminSessions.$inferSelect;
export type InsertAdminSession = typeof adminSessions.$inferInsert;

/**
 * Media library table for tracking uploaded images and videos
 */
export const media = mysqlTable("media", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("originalName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  fileSize: int("fileSize").notNull(), // in bytes
  s3Key: varchar("s3Key", { length: 500 }).notNull(), // S3 storage key
  url: varchar("url", { length: 1000 }).notNull(), // Public URL
  type: mysqlEnum("type", ["image", "video"]).notNull(),
  uploadedBy: varchar("uploadedBy", { length: 100 }), // admin username
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Media = typeof media.$inferSelect;
export type InsertMedia = typeof media.$inferInsert;

/**
 * Theme settings table for design system control
 */
export const themeSettings = mysqlTable("themeSettings", {
  id: int("id").autoincrement().primaryKey(),
  // Color Palette
  primaryColor: varchar("primaryColor", { length: 50 }).default("#000000"),
  secondaryColor: varchar("secondaryColor", { length: 50 }).default("#ffffff"),
  accentColor: varchar("accentColor", { length: 50 }).default("#1a1a1a"),
  backgroundColor: varchar("backgroundColor", { length: 50 }).default("#ffffff"),
  textColor: varchar("textColor", { length: 50 }).default("#000000"),
  
  // Typography
  headingFont: varchar("headingFont", { length: 255 }).default("Playfair Display"),
  bodyFont: varchar("bodyFont", { length: 255 }).default("Inter"),
  headingFontUrl: varchar("headingFontUrl", { length: 500 }),
  bodyFontUrl: varchar("bodyFontUrl", { length: 500 }),
  
  // Spacing & Layout
  containerMaxWidth: varchar("containerMaxWidth", { length: 50 }).default("1280px"),
  sectionSpacing: varchar("sectionSpacing", { length: 50 }).default("120px"),
  borderRadius: varchar("borderRadius", { length: 50 }).default("8px"),
  
  // Animations
  enableAnimations: int("enableAnimations").default(1).notNull(),
  animationSpeed: varchar("animationSpeed", { length: 50 }).default("0.6s"),
  
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ThemeSettings = typeof themeSettings.$inferSelect;
export type InsertThemeSettings = typeof themeSettings.$inferInsert;

/**
 * Brand assets table for logo and brand image management
 */
export const brandAssets = mysqlTable("brandAssets", {
  id: int("id").autoincrement().primaryKey(),
  assetType: mysqlEnum("assetType", ["logo_header", "logo_footer", "logo_mobile", "favicon", "og_image", "twitter_image"]).notNull(),
  assetUrl: varchar("assetUrl", { length: 1000 }).notNull(),
  assetName: varchar("assetName", { length: 255 }),
  width: int("width"),
  height: int("height"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BrandAsset = typeof brandAssets.$inferSelect;
export type InsertBrandAsset = typeof brandAssets.$inferInsert;

/**
 * Pages table for dynamic page management
 */
export const pages = mysqlTable("pages", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  template: varchar("template", { length: 100 }).default("default"),
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  ogImage: varchar("ogImage", { length: 1000 }),
  published: int("published").default(1).notNull(),
  showInNav: int("showInNav").default(1).notNull(),
  navOrder: int("navOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Page = typeof pages.$inferSelect;
export type InsertPage = typeof pages.$inferInsert;

/**
 * Navigation items table for menu management
 */
export const navigation = mysqlTable("navigation", {
  id: int("id").autoincrement().primaryKey(),
  location: mysqlEnum("location", ["header", "footer"]).notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  order: int("order").default(0).notNull(),
  isExternal: int("isExternal").default(0).notNull(),
  openInNewTab: int("openInNewTab").default(0).notNull(),
  parentId: int("parentId"), // for nested menus
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Navigation = typeof navigation.$inferSelect;
export type InsertNavigation = typeof navigation.$inferInsert;

/**
 * SEO settings table for meta tags and structured data
 */
export const seoSettings = mysqlTable("seoSettings", {
  id: int("id").autoincrement().primaryKey(),
  pageSlug: varchar("pageSlug", { length: 255 }).notNull().unique(), // 'home', 'about', etc.
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  metaKeywords: text("metaKeywords"),
  ogTitle: varchar("ogTitle", { length: 255 }),
  ogDescription: text("ogDescription"),
  ogImage: varchar("ogImage", { length: 1000 }),
  twitterCard: varchar("twitterCard", { length: 50 }).default("summary_large_image"),
  canonicalUrl: varchar("canonicalUrl", { length: 500 }),
  noIndex: int("noIndex").default(0).notNull(),
  structuredData: text("structuredData"), // JSON-LD
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SEOSettings = typeof seoSettings.$inferSelect;
export type InsertSEOSettings = typeof seoSettings.$inferInsert;

/**
 * Site settings table for analytics, custom code, and integrations
 */
export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = typeof siteSettings.$inferInsert;


/**
 * AI chat conversations table for visitor chat history
 */
export const aiChatConversations = mysqlTable("aiChatConversations", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 255 }).notNull(),
  visitorId: varchar("visitorId", { length: 255 }), // optional identifier
  message: text("message").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  context: text("context"), // page context, visitor intent, etc.
  sentiment: varchar("sentiment", { length: 50 }), // positive, neutral, negative
  topic: varchar("topic", { length: 100 }), // conversation topic (e.g., "leadership", "empowerment", "coaching")
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AIChatConversation = typeof aiChatConversations.$inferSelect;
export type InsertAIChatConversation = typeof aiChatConversations.$inferInsert;

/**
 * AI settings table for API keys and configuration
 */
export const aiSettings = mysqlTable("aiSettings", {
  id: int("id").autoincrement().primaryKey(),
  geminiApiKey: varchar("geminiApiKey", { length: 500 }),
  chatEnabled: int("chatEnabled").default(1).notNull(),
  chatBubbleColor: varchar("chatBubbleColor", { length: 50 }).default("#000000"),
  chatBubblePosition: varchar("chatBubblePosition", { length: 50 }).default("bottom-right"),
  systemPrompt: text("systemPrompt"), // Custom AI personality/instructions
  autoResponses: text("autoResponses"), // JSON of common Q&A pairs
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AISettings = typeof aiSettings.$inferSelect;
export type InsertAISettings = typeof aiSettings.$inferInsert;


/**
 * AI feedback table for rating and improving responses
 */
export const aiFeedback = mysqlTable("aiFeedback", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  visitorId: varchar("visitorId", { length: 255 }),
  rating: mysqlEnum("rating", ["positive", "negative"]).notNull(),
  feedbackText: text("feedbackText"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AIFeedback = typeof aiFeedback.$inferSelect;
export type InsertAIFeedback = typeof aiFeedback.$inferInsert;

/**
 * Visitor profiles for persistent conversation memory
 */
export const visitorProfiles = mysqlTable("visitorProfiles", {
  id: int("id").autoincrement().primaryKey(),
  visitorId: varchar("visitorId", { length: 255 }).notNull().unique(),
  firstVisit: timestamp("firstVisit").defaultNow().notNull(),
  lastVisit: timestamp("lastVisit").defaultNow().onUpdateNow().notNull(),
  totalConversations: int("totalConversations").default(0).notNull(),
  preferences: text("preferences"), // JSON: interests, topics discussed, etc.
  context: text("context"), // JSON: journey stage, pain points, goals
});

export type VisitorProfile = typeof visitorProfiles.$inferSelect;
export type InsertVisitorProfile = typeof visitorProfiles.$inferInsert;


/**
 * Analytics page views table
 */
export const analyticsPageViews = mysqlTable("analyticsPageViews", {
  id: int("id").autoincrement().primaryKey(),
  visitorId: varchar("visitorId", { length: 255 }),
  sessionId: varchar("sessionId", { length: 255 }).notNull(),
  page: varchar("page", { length: 500 }).notNull(),
  referrer: varchar("referrer", { length: 500 }),
  userAgent: text("userAgent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AnalyticsPageView = typeof analyticsPageViews.$inferSelect;
export type InsertAnalyticsPageView = typeof analyticsPageViews.$inferInsert;

/**
 * Analytics sessions table
 */
export const analyticsSessions = mysqlTable("analyticsSessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 255 }).notNull().unique(),
  visitorId: varchar("visitorId", { length: 255 }),
  startTime: timestamp("startTime").defaultNow().notNull(),
  endTime: timestamp("endTime"),
  pageCount: int("pageCount").default(0).notNull(),
  duration: int("duration").default(0).notNull(), // in seconds
});

export type AnalyticsSession = typeof analyticsSessions.$inferSelect;
export type InsertAnalyticsSession = typeof analyticsSessions.$inferInsert;

/**
 * Analytics events table for custom tracking
 */
export const analyticsEvents = mysqlTable("analyticsEvents", {
  id: int("id").autoincrement().primaryKey(),
  visitorId: varchar("visitorId", { length: 255 }),
  sessionId: varchar("sessionId", { length: 255 }).notNull(),
  eventType: varchar("eventType", { length: 100 }).notNull(), // e.g., "button_click", "form_submit", "ai_chat_open"
  eventData: text("eventData"), // JSON
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

/**
 * Page content blocks for visual block editor
 */
export const pageBlocks = mysqlTable("pageBlocks", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("pageId").notNull(),
  type: mysqlEnum("type", ["text", "image", "video", "quote", "cta", "spacer"]).notNull(),
  content: text("content"), // JSON string with block-specific data
  order: int("order").notNull().default(0),
  settings: text("settings"), // JSON string with block settings (alignment, colors, spacing)
  visibility: text("visibility"), // JSON string with visibility conditions (device, auth, schedule)
  animation: text("animation"), // JSON string with animation settings (type, trigger, timing)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PageBlock = typeof pageBlocks.$inferSelect;
export type InsertPageBlock = typeof pageBlocks.$inferInsert;

// Parsed version of PageBlock with JSON fields converted to objects
export type ParsedPageBlock = Omit<PageBlock, 'content' | 'settings' | 'animation' | 'visibility'> & {
  content: any;
  settings: any;
  animation: any;
  visibility: any;
};

/**
 * Block templates for saving and reusing block combinations
 */
export const blockTemplates = mysqlTable("blockTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  blocks: text("blocks").notNull(), // JSON array of block configurations
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlockTemplate = typeof blockTemplates.$inferSelect;
export type InsertBlockTemplate = typeof blockTemplates.$inferInsert;

/**
 * Block versions for tracking history and enabling restore
 */
export const blockVersions = mysqlTable("blockVersions", {
  id: int("id").autoincrement().primaryKey(),
  blockId: int("blockId").notNull(),
  pageId: int("pageId").notNull(),
  type: mysqlEnum("type", ["text", "image", "video", "quote", "cta", "spacer"]).notNull(),
  content: text("content"),
  order: int("order").notNull(),
  settings: text("settings"),
  versionNumber: int("versionNumber").notNull(),
  createdBy: varchar("createdBy", { length: 255 }), // username who made the change
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BlockVersion = typeof blockVersions.$inferSelect;
export type InsertBlockVersion = typeof blockVersions.$inferInsert;

/**
 * Form fields table for customizable contact forms
 */
export const formFields = mysqlTable("formFields", {
  id: int("id").autoincrement().primaryKey(),
  fieldName: varchar("fieldName", { length: 100 }).notNull(), // e.g., "name", "email", "message"
  fieldLabel: varchar("fieldLabel", { length: 255 }).notNull(), // Display label
  fieldType: mysqlEnum("fieldType", ["text", "email", "tel", "textarea", "select", "checkbox"]).notNull(),
  placeholder: varchar("placeholder", { length: 255 }),
  required: int("required").default(1).notNull(),
  order: int("order").default(0).notNull(),
  options: text("options"), // JSON array for select/checkbox options
  validation: text("validation"), // JSON validation rules
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FormField = typeof formFields.$inferSelect;
export type InsertFormField = typeof formFields.$inferInsert;

/**
 * Form submissions table for storing contact form data
 */
export const formSubmissions = mysqlTable("formSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  formData: text("formData").notNull(), // JSON of all form fields
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  isRead: int("isRead").default(0).notNull(),
});

export type FormSubmission = typeof formSubmissions.$inferSelect;
export type InsertFormSubmission = typeof formSubmissions.$inferInsert;

/**
 * URL redirects table for SEO and site restructuring
 */
export const redirects = mysqlTable("redirects", {
  id: int("id").autoincrement().primaryKey(),
  fromPath: varchar("fromPath", { length: 500 }).notNull(),
  toPath: varchar("toPath", { length: 500 }).notNull(),
  redirectType: mysqlEnum("redirectType", ["301", "302"]).default("301").notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Redirect = typeof redirects.$inferSelect;
export type InsertRedirect = typeof redirects.$inferInsert;

/**
 * Database backups table for backup/restore functionality
 */
export const backups = mysqlTable("backups", {
  id: int("id").autoincrement().primaryKey(),
  backupName: varchar("backupName", { length: 255 }).notNull(),
  backupType: varchar("backupType", { length: 50 }).notNull(), // 'manual', 'scheduled'
  backupData: text("backupData").notNull(), // JSON dump of database
  fileSize: int("fileSize").notNull(), // Size in bytes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Backup = typeof backups.$inferSelect;
export type InsertBackup = typeof backups.$inferInsert;

/**
 * Email settings table for email provider configuration and weekly reports
 */
export const emailSettings = mysqlTable("emailSettings", {
  id: int("id").autoincrement().primaryKey(),
  emailProvider: varchar("emailProvider", { length: 50 }), // 'sendgrid', 'mailgun', 'ses', 'smtp', etc.
  apiKey: varchar("apiKey", { length: 500 }),
  fromEmail: varchar("fromEmail", { length: 320 }),
  fromName: varchar("fromName", { length: 255 }),
  smtpHost: varchar("smtpHost", { length: 255 }),
  smtpPort: int("smtpPort"),
  smtpUsername: varchar("smtpUsername", { length: 255 }),
  smtpPassword: varchar("smtpPassword", { length: 255 }),
  weeklyReportEnabled: int("weeklyReportEnabled").default(0).notNull(),
  reportRecipients: text("reportRecipients"), // JSON array of email addresses
  reportDay: int("reportDay").default(1), // 0=Sunday, 1=Monday, etc.
  reportTime: varchar("reportTime", { length: 5 }).default("09:00"), // HH:MM format
  lastSentAt: timestamp("lastSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailSettings = typeof emailSettings.$inferSelect;
export type InsertEmailSettings = typeof emailSettings.$inferInsert;
